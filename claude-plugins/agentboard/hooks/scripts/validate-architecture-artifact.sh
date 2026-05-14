#!/usr/bin/env bash
# validate-architecture-artifact.sh
# PreToolUse hook — validates architecture-pipeline artifacts before submission.
#
# Matches: mcp__agentboard__agentboard_submit_workspace_artifact
# Behavior:
#   1. Reads TOOL_INPUT from stdin (JSON via jq).
#   2. Detects which of the four architecture-pipeline artifact types the
#      submission is (architecture_document / ARCH_FACTS_BUNDLE_V2 /
#      ARCH_BUNDLE_AUDIT_V2 / ARCH_DESIGN_REVIEW_V1) using artifact_type
#      primary path with content-sentinel fallback.
#   3. Applies the matching rule set per plan §7.
#   4. On any rule failure: prints structured JSON error to stderr and exits
#      non-zero (blocks the tool call).
#   5. On all rules pass: exits 0 (allows tool call).
#   6. If no architecture-pipeline type is detected: exits 0 (the existing
#      gate handles non-architecture artifacts).
#
# Spec reference: docs/plans/2026-05-12-architecture-pipeline-rework-plan.md §7
# Rule set IDs: R-DOC-1..7, R-BUNDLE-1..5, R-AUDIT-1..4, R-REVIEW-1..3
#
# This script is structural-only. Behavioral guarantees come from subagent
# frontmatter constraints, not from this hook.

set -uo pipefail

# ---------------------------------------------------------------------------
# Input acquisition
# ---------------------------------------------------------------------------

# Read TOOL_INPUT either from stdin (Claude Code hook protocol) or from the
# $TOOL_INPUT env var (older Claude Code convention used by sibling scripts).
HOOK_PAYLOAD=""
if [ -t 0 ]; then
  # No stdin attached. Fall back to env var if present.
  HOOK_PAYLOAD="${TOOL_INPUT:-}"
else
  HOOK_PAYLOAD=$(cat)
  if [ -z "$HOOK_PAYLOAD" ]; then
    HOOK_PAYLOAD="${TOOL_INPUT:-}"
  fi
fi

if [ -z "$HOOK_PAYLOAD" ]; then
  # No input — cannot validate. Exit cleanly so we don't block legitimate
  # tool calls that this hook can't see.
  exit 0
fi

# Allow override of jq path for environments where jq isn't on PATH (Windows
# dev boxes; test harness sets AGENTBOARD_JQ_BIN to a local jq.exe).
JQ_BIN="${AGENTBOARD_JQ_BIN:-jq}"
if ! command -v "$JQ_BIN" >/dev/null 2>&1; then
  # jq unavailable — cannot validate. Exit cleanly rather than block.
  exit 0
fi

# The hook payload's tool_input may live at .tool_input (Claude Code protocol)
# or be the input itself (env-var path). Try both.
TOOL_INPUT_JSON=$(echo "$HOOK_PAYLOAD" | "$JQ_BIN" -c '.tool_input // .' 2>/dev/null)
if [ -z "$TOOL_INPUT_JSON" ] || [ "$TOOL_INPUT_JSON" = "null" ]; then
  TOOL_INPUT_JSON="$HOOK_PAYLOAD"
fi

# Extract artifact_type and content.
ARTIFACT_TYPE=$(echo "$TOOL_INPUT_JSON" | "$JQ_BIN" -r '.artifact_type // empty' 2>/dev/null || echo "")
CONTENT=$(echo "$TOOL_INPUT_JSON" | "$JQ_BIN" -r '.content // empty' 2>/dev/null || echo "")

# Optional: spec path for R-DOC-5 coverage check. Hooks can't always see the
# spec, so this is consulted only when AGENTBOARD_SPEC_PATH is set.
SPEC_PATH_ENV="${AGENTBOARD_SPEC_PATH:-}"

# ---------------------------------------------------------------------------
# Failure reporting helper
# ---------------------------------------------------------------------------

# emit_failure DETECTED_TYPE FAILED_RULES_JSON_ARRAY DETAILS
emit_failure() {
  local detected="$1"
  local failed="$2"
  local details="$3"
  # Use jq to construct the JSON safely (handles quoting of details).
  "$JQ_BIN" -n \
    --arg hook "validate-architecture-artifact" \
    --arg t "$detected" \
    --argjson rules "$failed" \
    --arg d "$details" \
    '{hook: $hook, artifact_type: $t, failed_rules: $rules, details: $d}' >&2
  exit 2
}

# ---------------------------------------------------------------------------
# Artifact-type detection (plan §7 step 3, explicit parenthesization)
# ---------------------------------------------------------------------------

DETECTED_TYPE=""

# Compute content-sentinel hits once. First 200 bytes per plan.
CONTENT_HEAD=$(printf '%s' "$CONTENT" | head -c 400 2>/dev/null || true)

is_arch_doc_content() {
  # Match `^# Architecture —` (with em dash) AND `^## Card Slices` anywhere.
  # Per plan §7 detection-note: heading may appear with leading whitespace
  # or after YAML frontmatter; check is start-of-line not start-of-file.
  printf '%s' "$CONTENT" | grep -qE '^# Architecture —' && \
  printf '%s' "$CONTENT" | grep -qE '^## Card Slices'
}

is_bundle_sentinel() {
  printf '%s' "$CONTENT_HEAD" | grep -q "ARCH_FACTS_BUNDLE_V2"
}

is_audit_sentinel() {
  printf '%s' "$CONTENT_HEAD" | grep -q "ARCH_BUNDLE_AUDIT_V2"
}

is_review_sentinel() {
  printf '%s' "$CONTENT_HEAD" | grep -q "ARCH_DESIGN_REVIEW_V1"
}

# Explicit parenthesization per plan §7 step 3 — each branch is a single
# top-level (A OR B) check; OR is the only operator at the top level.
if ( [ "$ARTIFACT_TYPE" = "architecture_document" ] ) || ( is_arch_doc_content ); then
  DETECTED_TYPE="architecture_document"
elif ( [[ "$ARTIFACT_TYPE" == ARCH_FACTS_BUNDLE* ]] ) || ( is_bundle_sentinel ); then
  DETECTED_TYPE="ARCH_FACTS_BUNDLE_V2"
elif ( [[ "$ARTIFACT_TYPE" == ARCH_BUNDLE_AUDIT* ]] ) || ( is_audit_sentinel ); then
  DETECTED_TYPE="ARCH_BUNDLE_AUDIT_V2"
elif ( [[ "$ARTIFACT_TYPE" == ARCH_DESIGN_REVIEW* ]] ) || ( is_review_sentinel ); then
  DETECTED_TYPE="ARCH_DESIGN_REVIEW_V1"
else
  # No architecture-pipeline artifact detected — exit cleanly. The existing
  # artifact-quality-gate.sh handles non-architecture artifacts.
  exit 0
fi

# ---------------------------------------------------------------------------
# Helpers shared across rule sets
# ---------------------------------------------------------------------------

# Strip the leading sentinel line (e.g., "ARCH_FACTS_BUNDLE_V2\n") off CONTENT
# to recover the embedded JSON body. If CONTENT is already pure JSON, this is
# a no-op (the first line just won't be a sentinel).
# Avoids awk because Git-Bash/Cygwin awk has intermittent fork failures
# (`cygheap read copy failed`) under heavy use in this script.
strip_sentinel_get_json() {
  local sentinel="$1"
  local first_line
  first_line=$(printf '%s\n' "$CONTENT" | head -n 1)
  if [ "$first_line" = "$sentinel" ]; then
    printf '%s\n' "$CONTENT" | tail -n +2
  else
    printf '%s' "$CONTENT"
  fi
}

# Apply the v1.0 classification rules to a bundle's classification_fields
# block and echo the computed level (1/2/3). Used by R-BUNDLE-5.
# Rules per docs/plans/2026-05-09-architecture-pipeline-redesign.md §7
# (preserved unchanged at rules_version 1.0):
#   L3 triggers: any of
#     R-L3-EXT       external_system_count >= 1
#     R-L3-MIG       migration_signals_present == true
#     R-L3-SEC       security_relevant_keyword_hits >= 3
#     R-L3-CONTRACTS new_contracts_count >= 3
#     R-L3-CARDS     expected_card_count_band.upper >= 8
#   Else L2 triggers: any of
#     R-L2-NEW-CONTRACTS  new_contracts_count >= 1
#     R-L2-TRUST          trust_boundaries_introduced == true
#     R-L2-MOD-CONTRACTS  existing_contracts_modified_count >= 2
#     R-L2-COUPLING       coupling_hotspot_overlap == true
#   Else L1.
compute_level_from_classification() {
  local cls="$1"
  # Use jq to apply each rule; produce a numeric level on stdout.
  echo "$cls" | "$JQ_BIN" -r '
    def b(x): (x // false) == true;
    def n(x): (x // 0) | tonumber? // 0;
    (n(.new_contracts_count.value))         as $nc  |
    (n(.existing_contracts_modified_count.value)) as $em |
    (b(.trust_boundaries_introduced.value)) as $tb |
    (b(.migration_signals_present.value))   as $mig |
    (n(.external_system_count.value))       as $ext |
    (n(.expected_card_count_band.upper))    as $upper |
    (b(.coupling_hotspot_overlap.value))    as $cpl |
    (n(.security_relevant_keyword_hits.value)) as $sec |
    if ($ext >= 1 or $mig or $sec >= 3 or $nc >= 3 or $upper >= 8) then 3
    elif ($nc >= 1 or $tb or $em >= 2 or $cpl) then 2
    else 1
    end
  '
}

# ===========================================================================
# Rule set: architecture_document  (R-DOC-1 .. R-DOC-7)
# ===========================================================================

validate_architecture_document() {
  local failed=()
  local detail_lines=()

  # ----- R-DOC-1 : level marker present in Status section -----
  # Marker line: `**Level:** L[123]` exactly, on its own line.
  local level_line
  level_line=$(printf '%s' "$CONTENT" | grep -E '^\*\*Level:\*\* L[123]$' | head -n1)
  local doc_level=""
  if [ -z "$level_line" ]; then
    failed+=("R-DOC-1")
    detail_lines+=("R-DOC-1: no '**Level:** L1|L2|L3' marker found at start-of-line")
  else
    doc_level=$(printf '%s' "$level_line" | sed -E 's/^\*\*Level:\*\* L([123])$/\1/')
  fi

  # ----- R-DOC-2 : required sections present in correct order -----
  # Required sequence depends on the parsed level. Optional sections are
  # ignored when checking order — the required headings must appear as a
  # subsequence of the actual heading order, in order.
  if [ -n "$doc_level" ]; then
    # Extract every heading line ('# ' or '## ' prefix), preserving order.
    local headings
    headings=$(printf '%s' "$CONTENT" | grep -nE '^(# |## )' || true)

    local required_l1=(
      "# Architecture —"
      "## Goal"
      "## Scope"
      "## Card Slices"
      "## Limitations"
      "## Standards"
      "## Status"
    )
    local required_l2=(
      "# Architecture —"
      "## Goal"
      "## Scope"
      "## Components and structure"
      "## Design decisions"
      "## Card Slices"
      "## Traceability matrix"
      "## Limitations"
      "## Standards"
      "## Status"
    )
    local required_l3=(
      "# Architecture —"
      "## Goal"
      "## Scope"
      "## Components and structure"
      "## Quality characteristics"
      "## Design decisions"
      "## Card Slices"
      "## Traceability matrix"
      "## Limitations"
      "## Standards"
      "## Status"
    )

    local -n required="required_l${doc_level}"

    # Subsequence check: walk through actual headings; for each required
    # heading in order, find a matching actual heading at or after the
    # current cursor.
    local cursor=0
    local missing=()
    local actual_lines=()
    while IFS= read -r line; do
      actual_lines+=("$line")
    done <<< "$headings"
    local n_actual=${#actual_lines[@]}

    local req
    for req in "${required[@]}"; do
      local found=0
      local i=$cursor
      while [ $i -lt $n_actual ]; do
        # Strip "<lineno>:" prefix from grep -n output, then check prefix.
        local content_line="${actual_lines[$i]#*:}"
        case "$content_line" in
          "$req"*)
            cursor=$((i + 1))
            found=1
            break
            ;;
        esac
        i=$((i + 1))
      done
      if [ $found -eq 0 ]; then
        missing+=("$req")
      fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
      failed+=("R-DOC-2")
      detail_lines+=("R-DOC-2: missing or out-of-order required sections for L${doc_level}: $(IFS=,; echo "${missing[*]}")")
    fi

    # L3 co-occurrence: if ## Threat model present, then ## ASVS verification
    # mapping must also be present.
    if [ "$doc_level" = "3" ]; then
      if printf '%s' "$CONTENT" | grep -qE '^## Threat model'; then
        if ! printf '%s' "$CONTENT" | grep -qE '^## ASVS verification mapping'; then
          failed+=("R-DOC-2")
          detail_lines+=("R-DOC-2: L3 has '## Threat model' but is missing '## ASVS verification mapping'")
        fi
      fi
    fi
  fi

  # Extract the Card Slices section body once; used by R-DOC-3..7.
  local card_slices_body
  card_slices_body=$(printf '%s\n' "$CONTENT" | awk '
    BEGIN { in_section = 0 }
    /^## Card Slices/ { in_section = 1; next }
    /^## / && in_section { in_section = 0 }
    in_section { print }
  ')

  # ----- R-DOC-3 : Card Slices section non-empty (>= 1 ### sub-heading) -----
  local slice_count
  slice_count=$(printf '%s\n' "$card_slices_body" | grep -cE '^### ' || true)
  if [ "${slice_count:-0}" -lt 1 ]; then
    failed+=("R-DOC-3")
    detail_lines+=("R-DOC-3: Card Slices section contains zero slice sub-headings (### )")
  fi

  # ----- R-DOC-4 : every slice contains all 8 §6.3 field labels as bullets -----
  if [ "${slice_count:-0}" -ge 1 ]; then
    # Split card_slices_body into per-slice chunks. Each chunk begins at a
    # `### ` line; chunks end at the next `### ` or end-of-section.
    local missing_per_slice=""
    local slice_idx=0
    # Use awk to print one chunk per slice, separated by a delimiter line.
    local delim="<<<__SLICE_DELIMITER__>>>"
    local chunked
    chunked=$(printf '%s\n' "$card_slices_body" | awk -v d="$delim" '
      /^### / { if (NR > 1) printf "%s\n", d; print; next }
      { print }
    ')
    # Iterate chunks.
    local current=""
    local title=""
    local labels=(
      "Description"
      "Allowed-touch"
      "Forbidden-touch"
      "Produces"
      "Consumes"
      "Verification scope"
      "Depends on"
      "Source decisions"
    )
    while IFS= read -r line; do
      if [ "$line" = "$delim" ]; then
        # End of a chunk — validate it.
        if [ -n "$current" ]; then
          slice_idx=$((slice_idx + 1))
          local missing_fields=()
          local label
          for label in "${labels[@]}"; do
            # Each field expected as a bullet like '- **Label**' or '- Label:'
            if ! printf '%s' "$current" | grep -qE "^[-*] \*?\*?${label}\*?\*?[: \t]"; then
              missing_fields+=("$label")
            fi
          done
          if [ ${#missing_fields[@]} -gt 0 ]; then
            missing_per_slice+="${title} missing: $(IFS=,; echo "${missing_fields[*]}"); "
          fi
        fi
        current=""
        title=""
      else
        if [ -z "$title" ] && [[ "$line" == "### "* ]]; then
          title="${line#### }"
        fi
        current="${current}${line}"$'\n'
      fi
    done < <(printf '%s\n%s\n' "$chunked" "$delim")

    if [ -n "$missing_per_slice" ]; then
      failed+=("R-DOC-4")
      detail_lines+=("R-DOC-4: ${missing_per_slice}")
    fi
  fi

  # ----- R-DOC-5 : R# / Q# coverage -----
  # Primary path: env var AGENTBOARD_SPEC_PATH points to spec → extract every
  #               R# and Q# from spec → require each to appear in
  #               ## Traceability matrix OR in at least one slice's
  #               Source decisions.
  # Fallback (spec unavailable): traceability matrix section non-empty.
  local trace_body
  trace_body=$(printf '%s\n' "$CONTENT" | awk '
    BEGIN { in_section = 0 }
    /^## Traceability matrix/ { in_section = 1; next }
    /^## / && in_section { in_section = 0 }
    in_section { print }
  ')

  local source_decisions_body
  source_decisions_body=$(printf '%s\n' "$card_slices_body" | grep -E "Source decisions" || true)

  if [ -n "$SPEC_PATH_ENV" ] && [ -r "$SPEC_PATH_ENV" ]; then
    local spec_text
    spec_text=$(cat "$SPEC_PATH_ENV")
    local spec_ids
    spec_ids=$(printf '%s' "$spec_text" | grep -oE '\b[RQ][0-9]+\b' | sort -u)
    local missing_ids=()
    local id
    for id in $spec_ids; do
      if printf '%s\n%s' "$trace_body" "$source_decisions_body" | grep -qE "\\b${id}\\b"; then
        :
      else
        missing_ids+=("$id")
      fi
    done
    if [ ${#missing_ids[@]} -gt 0 ]; then
      failed+=("R-DOC-5")
      detail_lines+=("R-DOC-5: spec R#/Q# not covered by traceability matrix or any slice's Source decisions: $(IFS=,; echo "${missing_ids[*]}")")
    fi
  else
    # Fallback: traceability matrix non-empty (skip for L1 — L1 template
    # omits the section).
    if [ "$doc_level" != "1" ]; then
      local trace_nonblank
      trace_nonblank=$(printf '%s' "$trace_body" | grep -cE '\S' || true)
      if [ "${trace_nonblank:-0}" -lt 1 ]; then
        failed+=("R-DOC-5")
        detail_lines+=("R-DOC-5 (fallback): Traceability matrix section is empty and AGENTBOARD_SPEC_PATH is not set")
      fi
    fi
  fi

  # ----- R-DOC-6 : every D# in slice Source decisions also appears as a -----
  # decision heading in ## Design decisions.
  # Skip for L1 (no Design decisions section by template).
  if [ "$doc_level" != "1" ]; then
    local design_body
    design_body=$(printf '%s\n' "$CONTENT" | awk '
      BEGIN { in_section = 0 }
      /^## Design decisions/ { in_section = 1; next }
      /^## / && in_section { in_section = 0 }
      in_section { print }
    ')
    local refs
    refs=$(printf '%s' "$card_slices_body" | grep -oE '\bD[0-9]+\b' | sort -u)
    local defs
    defs=$(printf '%s' "$design_body" | grep -oE '\bD[0-9]+\b' | sort -u)
    local missing_d=()
    local d
    for d in $refs; do
      if ! printf '%s\n' "$defs" | grep -qE "^${d}$"; then
        missing_d+=("$d")
      fi
    done
    if [ ${#missing_d[@]} -gt 0 ]; then
      failed+=("R-DOC-6")
      detail_lines+=("R-DOC-6: D# referenced in slice Source decisions but not defined in '## Design decisions': $(IFS=,; echo "${missing_d[*]}")")
    fi
  fi

  # ----- R-DOC-7 : no two slices have overlapping allowed-touch paths -----
  # unless the overlapping slice's Description contains an explicit
  # justification phrase ("overlap justified").
  if [ "${slice_count:-0}" -ge 2 ]; then
    # Extract per-slice allowed-touch lists + descriptions.
    local overlap_findings=""
    local delim="<<<__SLICE_DELIMITER__>>>"
    local chunked2
    chunked2=$(printf '%s\n' "$card_slices_body" | awk -v d="$delim" '
      /^### / { if (NR > 1) printf "%s\n", d; print; next }
      { print }
    ')
    # Build arrays: titles[], allowed_lists[], descriptions[]
    local titles=()
    local allowed_lists=()
    local descriptions=()
    local cur_title=""
    local cur_chunk=""
    while IFS= read -r line; do
      if [ "$line" = "$delim" ]; then
        if [ -n "$cur_chunk" ]; then
          titles+=("$cur_title")
          local al
          al=$(printf '%s' "$cur_chunk" | grep -E '^[-*] \*?\*?Allowed-touch\*?\*?' | sed -E 's/^[-*] \*?\*?Allowed-touch\*?\*?[: \t]*//')
          allowed_lists+=("$al")
          local desc
          desc=$(printf '%s' "$cur_chunk" | grep -E '^[-*] \*?\*?Description\*?\*?' | sed -E 's/^[-*] \*?\*?Description\*?\*?[: \t]*//')
          descriptions+=("$desc")
        fi
        cur_chunk=""
        cur_title=""
      else
        if [ -z "$cur_title" ] && [[ "$line" == "### "* ]]; then
          cur_title="${line#### }"
        fi
        cur_chunk="${cur_chunk}${line}"$'\n'
      fi
    done < <(printf '%s\n%s\n' "$chunked2" "$delim")

    local n=${#titles[@]}
    local i j
    for ((i=0; i<n; i++)); do
      # Extract path-looking tokens from slice i's allowed list.
      local paths_i
      paths_i=$(printf '%s' "${allowed_lists[$i]}" | grep -oE '[A-Za-z0-9_./\-]+\.[A-Za-z0-9]+' | sort -u)
      for ((j=i+1; j<n; j++)); do
        local paths_j
        paths_j=$(printf '%s' "${allowed_lists[$j]}" | grep -oE '[A-Za-z0-9_./\-]+\.[A-Za-z0-9]+' | sort -u)
        if [ -z "$paths_i" ] || [ -z "$paths_j" ]; then
          continue
        fi
        local common
        common=$(comm -12 <(printf '%s\n' "$paths_i") <(printf '%s\n' "$paths_j") | tr -d '\r')
        if [ -n "$common" ]; then
          # Overlap detected. Check whichever description has "overlap
          # justified" — either side's justification is sufficient.
          if printf '%s\n%s' "${descriptions[$i]}" "${descriptions[$j]}" | grep -qi 'overlap justified'; then
            :
          else
            overlap_findings+="${titles[$i]} <-> ${titles[$j]} on $(printf '%s' "$common" | tr '\n' ','); "
          fi
        fi
      done
    done

    if [ -n "$overlap_findings" ]; then
      failed+=("R-DOC-7")
      detail_lines+=("R-DOC-7: overlapping allowed-touch paths without 'overlap justified' in either slice's Description: ${overlap_findings}")
    fi
  fi

  if [ ${#failed[@]} -gt 0 ]; then
    local rules_json
    rules_json=$(printf '%s\n' "${failed[@]}" | "$JQ_BIN" -R . | "$JQ_BIN" -s .)
    local details
    details=$(printf '%s\n' "${detail_lines[@]}")
    emit_failure "architecture_document" "$rules_json" "$details"
  fi
}

# ===========================================================================
# Rule set: ARCH_FACTS_BUNDLE_V2  (R-BUNDLE-1 .. R-BUNDLE-5)
# ===========================================================================

validate_arch_facts_bundle_v2() {
  local failed=()
  local detail_lines=()

  local json_body
  json_body=$(strip_sentinel_get_json "ARCH_FACTS_BUNDLE_V2")

  # ----- R-BUNDLE-1 : valid JSON -----
  local parsed
  parsed=$(printf '%s' "$json_body" | "$JQ_BIN" . 2>&1)
  if [ $? -ne 0 ]; then
    failed+=("R-BUNDLE-1")
    detail_lines+=("R-BUNDLE-1: content after stripping sentinel is not valid JSON: ${parsed}")
    local rules_json
    rules_json=$(printf '%s\n' "${failed[@]}" | "$JQ_BIN" -R . | "$JQ_BIN" -s .)
    emit_failure "ARCH_FACTS_BUNDLE_V2" "$rules_json" "$(printf '%s\n' "${detail_lines[@]}")"
  fi

  # ----- R-BUNDLE-2 : schema_version "2.0" AND rules_version "1.0" -----
  local sv rv
  sv=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.schema_version // empty')
  rv=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.rules_version // empty')
  if [ "$sv" != "2.0" ] || [ "$rv" != "1.0" ]; then
    failed+=("R-BUNDLE-2")
    detail_lines+=("R-BUNDLE-2: schema_version='${sv}' (expected '2.0'), rules_version='${rv}' (expected '1.0')")
  fi

  # ----- R-BUNDLE-3 : required top-level + sub-fields -----
  # Top-level required: classification_fields, design_fields, rule_evaluation,
  #                     spec_path, spec_hash, agent_metadata.
  # classification_fields sub-fields (8) — each must have .value and .evidence
  # (expected_card_count_band uses {lower, upper, evidence} instead of value).
  # design_fields sub-fields (7) — must be present (may be empty).
  # Consolidated into a single jq invocation to keep fork count low.
  local bundle_check
  bundle_check=$(printf '%s' "$json_body" | "$JQ_BIN" -r '
    . as $b |
    (["classification_fields","design_fields","rule_evaluation","spec_path","spec_hash","agent_metadata"]
      | map(select(($b | has(.)) | not))
      | join(",")) as $missing_top |
    (["new_contracts_count","existing_contracts_modified_count","trust_boundaries_introduced","migration_signals_present","external_system_count","coupling_hotspot_overlap","security_relevant_keyword_hits"]
      | map(. as $k | select(
          (($b.classification_fields // {})[$k] // null) == null or
          (($b.classification_fields[$k] | has("value")) | not) or
          (($b.classification_fields[$k] | has("evidence")) | not)
        ))
      | join(",")) as $missing_cls_value |
    ((
      ($b.classification_fields.expected_card_count_band // null) as $band |
      if ($band == null) then ["expected_card_count_band"]
      elif (($band | has("lower")) and ($band | has("upper")) and ($band | has("evidence"))) then []
      else ["expected_card_count_band"]
      end
    ) | join(",")) as $missing_band |
    (["files_relevant","dependency_edges","blast_radius","existing_patterns_hits","constraint_hits","external_libraries","open_questions"]
      | map(select((($b.design_fields // {}) | has(.)) | not))
      | join(",")) as $missing_design |
    "TOP=\($missing_top)\nCLS=\($missing_cls_value)\nBAND=\($missing_band)\nDES=\($missing_design)"
  ' 2>&1)
  local missing_top missing_cls missing_band missing_design
  missing_top=$(printf '%s' "$bundle_check" | grep '^TOP=' | sed 's/^TOP=//' || true)
  missing_cls=$(printf '%s' "$bundle_check" | grep '^CLS=' | sed 's/^CLS=//' || true)
  missing_band=$(printf '%s' "$bundle_check" | grep '^BAND=' | sed 's/^BAND=//' || true)
  missing_design=$(printf '%s' "$bundle_check" | grep '^DES=' | sed 's/^DES=//' || true)
  # Merge classification + band into one list for the error message.
  local missing_cls_total="$missing_cls"
  if [ -n "$missing_band" ]; then
    if [ -n "$missing_cls_total" ]; then
      missing_cls_total="${missing_cls_total},${missing_band}"
    else
      missing_cls_total="$missing_band"
    fi
  fi
  if [ -n "$missing_top" ] || [ -n "$missing_cls_total" ] || [ -n "$missing_design" ]; then
    failed+=("R-BUNDLE-3")
    detail_lines+=("R-BUNDLE-3: missing top=[${missing_top}] missing_classification=[${missing_cls_total}] missing_design=[${missing_design}]")
  fi

  # ----- R-BUNDLE-4 : computed_level numeric in {1,2,3} -----
  local cl_type cl_val
  cl_type=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.rule_evaluation.computed_level | type')
  cl_val=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.rule_evaluation.computed_level')
  if [ "$cl_type" != "number" ] || ! [[ "$cl_val" =~ ^[123]$ ]]; then
    failed+=("R-BUNDLE-4")
    detail_lines+=("R-BUNDLE-4: rule_evaluation.computed_level must be numeric in {1,2,3}; got type='${cl_type}' value='${cl_val}'")
  fi

  # ----- R-BUNDLE-5 : computed_level matches what v1.0 rules derive -----
  if [ ${#failed[@]} -eq 0 ] || [[ ! " ${failed[*]} " =~ " R-BUNDLE-3 " ]]; then
    local cls_block expected_level
    cls_block=$(printf '%s' "$json_body" | "$JQ_BIN" -c '.classification_fields')
    expected_level=$(compute_level_from_classification "$cls_block")
    if [ "$cl_val" != "$expected_level" ]; then
      failed+=("R-BUNDLE-5")
      detail_lines+=("R-BUNDLE-5: bundle declares computed_level=${cl_val} but v1.0 rules re-evaluation from classification_fields yields ${expected_level}")
    fi
  fi

  if [ ${#failed[@]} -gt 0 ]; then
    local rules_json
    rules_json=$(printf '%s\n' "${failed[@]}" | "$JQ_BIN" -R . | "$JQ_BIN" -s .)
    emit_failure "ARCH_FACTS_BUNDLE_V2" "$rules_json" "$(printf '%s\n' "${detail_lines[@]}")"
  fi
}

# ===========================================================================
# Rule set: ARCH_BUNDLE_AUDIT_V2  (R-AUDIT-1 .. R-AUDIT-4)
# ===========================================================================

validate_arch_bundle_audit_v2() {
  local failed=()
  local detail_lines=()

  local json_body
  json_body=$(strip_sentinel_get_json "ARCH_BUNDLE_AUDIT_V2")

  # ----- R-AUDIT-1 : valid JSON -----
  local parsed
  parsed=$(printf '%s' "$json_body" | "$JQ_BIN" . 2>&1)
  if [ $? -ne 0 ]; then
    failed+=("R-AUDIT-1")
    detail_lines+=("R-AUDIT-1: content after stripping sentinel is not valid JSON: ${parsed}")
    local rules_json
    rules_json=$(printf '%s\n' "${failed[@]}" | "$JQ_BIN" -R . | "$JQ_BIN" -s .)
    emit_failure "ARCH_BUNDLE_AUDIT_V2" "$rules_json" "$(printf '%s\n' "${detail_lines[@]}")"
  fi

  # ----- R-AUDIT-2 : schema_version 2.0 AND rules_version 1.0 -----
  local sv rv
  sv=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.schema_version // empty')
  rv=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.rules_version // empty')
  if [ "$sv" != "2.0" ] || [ "$rv" != "1.0" ]; then
    failed+=("R-AUDIT-2")
    detail_lines+=("R-AUDIT-2: schema_version='${sv}' (expected '2.0'), rules_version='${rv}' (expected '1.0')")
  fi

  # ----- R-AUDIT-3 : field_verdicts covers all 15 required entries -----
  # All 15 keys checked in one jq invocation (fork pressure on Cygwin/Git-Bash
  # caused intermittent failures when this was 30+ jq calls in a loop).
  # The "bad" entry formatter uses ' inside the jq string for the single
  # quote (literal apostrophes inside a bash single-quoted filter would close
  # the quote prematurely).
  local audit_check
  audit_check=$(printf '%s' "$json_body" | "$JQ_BIN" -r --argjson required '[
    "new_contracts_count",
    "existing_contracts_modified_count",
    "trust_boundaries_introduced",
    "migration_signals_present",
    "external_system_count",
    "expected_card_count_band",
    "coupling_hotspot_overlap",
    "security_relevant_keyword_hits",
    "files_relevant",
    "dependency_edges",
    "blast_radius",
    "existing_patterns_hits",
    "constraint_hits",
    "external_libraries",
    "open_questions"
  ]' '
    . as $audit |
    ($required | map(
      . as $k |
      if (($audit.field_verdicts // {}) | has($k) | not) then
        {kind: "missing", key: $k}
      else
        ($audit.field_verdicts[$k]) as $entry |
        ($entry.verdict // "") as $v |
        ($entry.method // "") as $m |
        if (([ "PASS", "DISCREPANCY" ] | index($v)) == null) or ($m == "") then
          {kind: "bad", key: $k, verdict: $v, method: $m}
        else
          empty
        end
      end
    ))
    | (map(select(.kind == "missing").key) | join(",")) as $missing
    | (map(select(.kind == "bad") | "\(.key)(verdict='"'"'\(.verdict)'"'"',method='"'"'\(.method)'"'"')") | join(",")) as $bad
    | "MISSING=\($missing)\nBAD=\($bad)"
  ' 2>&1)
  local missing_list bad_list
  missing_list=$(printf '%s' "$audit_check" | grep '^MISSING=' | sed 's/^MISSING=//' || true)
  bad_list=$(printf '%s' "$audit_check" | grep '^BAD=' | sed 's/^BAD=//' || true)
  if [ -n "$missing_list" ] || [ -n "$bad_list" ]; then
    failed+=("R-AUDIT-3")
    detail_lines+=("R-AUDIT-3: missing_verdicts=[${missing_list}] malformed=[${bad_list}]")
  fi

  # ----- R-AUDIT-4 : verified_level numeric in {1,2,3}; discrepancy invariants -----
  local vl_type vl_val
  vl_type=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.verified_level | type')
  vl_val=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.verified_level')
  if [ "$vl_type" != "number" ] || ! [[ "$vl_val" =~ ^[123]$ ]]; then
    failed+=("R-AUDIT-4")
    detail_lines+=("R-AUDIT-4: verified_level must be numeric in {1,2,3}; got type='${vl_type}' value='${vl_val}'")
  fi

  local any_disc
  any_disc=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.any_discrepancy // false')
  if [ "$any_disc" = "true" ]; then
    local has_cb has_rl rl_type rl_val
    has_cb=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.corrected_bundle != null')
    has_rl=$(printf '%s' "$json_body" | "$JQ_BIN" -r 'has("recomputed_level")')
    rl_type=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.recomputed_level | type')
    rl_val=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.recomputed_level')
    if [ "$has_cb" != "true" ] || [ "$has_rl" != "true" ] || [ "$rl_type" != "number" ] || ! [[ "$rl_val" =~ ^[123]$ ]]; then
      failed+=("R-AUDIT-4")
      detail_lines+=("R-AUDIT-4: any_discrepancy=true but corrected_bundle/recomputed_level not properly present (corrected_bundle non-null=${has_cb}, recomputed_level type=${rl_type} value=${rl_val})")
    fi
  fi

  if [ ${#failed[@]} -gt 0 ]; then
    local rules_json
    rules_json=$(printf '%s\n' "${failed[@]}" | "$JQ_BIN" -R . | "$JQ_BIN" -s .)
    emit_failure "ARCH_BUNDLE_AUDIT_V2" "$rules_json" "$(printf '%s\n' "${detail_lines[@]}")"
  fi
}

# ===========================================================================
# Rule set: ARCH_DESIGN_REVIEW_V1  (R-REVIEW-1 .. R-REVIEW-3)
# ===========================================================================

validate_arch_design_review_v1() {
  local failed=()
  local detail_lines=()

  local json_body
  json_body=$(strip_sentinel_get_json "ARCH_DESIGN_REVIEW_V1")

  # ----- R-REVIEW-1 : valid JSON -----
  local parsed
  parsed=$(printf '%s' "$json_body" | "$JQ_BIN" . 2>&1)
  if [ $? -ne 0 ]; then
    failed+=("R-REVIEW-1")
    detail_lines+=("R-REVIEW-1: content after stripping sentinel is not valid JSON: ${parsed}")
    local rules_json
    rules_json=$(printf '%s\n' "${failed[@]}" | "$JQ_BIN" -R . | "$JQ_BIN" -s .)
    emit_failure "ARCH_DESIGN_REVIEW_V1" "$rules_json" "$(printf '%s\n' "${detail_lines[@]}")"
  fi

  # ----- R-REVIEW-2 : .findings is array; per-finding required fields -----
  local findings_type
  findings_type=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.findings | type')
  if [ "$findings_type" != "array" ]; then
    failed+=("R-REVIEW-2")
    detail_lines+=("R-REVIEW-2: .findings must be an array; got type='${findings_type}'")
  else
    # For every finding, check required fields.
    local bad_idx
    bad_idx=$(printf '%s' "$json_body" | "$JQ_BIN" -r '
      .findings
      | to_entries[]
      | .key as $i
      | .value as $f
      | select(
          ($f.id // "") == "" or
          (([ "blocker", "serious", "minor" ] | index($f.severity // "")) == null) or
          ($f.category // "") == "" or
          ($f.summary // "") == "" or
          (($f.document_citation // null) == null)
        )
      | $i
    ' 2>/dev/null)
    if [ -n "$bad_idx" ]; then
      failed+=("R-REVIEW-2")
      detail_lines+=("R-REVIEW-2: findings at indices [${bad_idx//$'\n'/,}] are missing required fields (id, severity in {blocker,serious,minor}, category, summary, document_citation)")
    fi
  fi

  # ----- R-REVIEW-3 : summary counts match findings counts -----
  local blocker_decl serious_decl minor_decl
  blocker_decl=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.summary.blocker_count // empty')
  serious_decl=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.summary.serious_count // empty')
  minor_decl=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.summary.minor_count // empty')
  local blocker_actual serious_actual minor_actual
  blocker_actual=$(printf '%s' "$json_body" | "$JQ_BIN" -r '[.findings[]? | select(.severity == "blocker")] | length')
  serious_actual=$(printf '%s' "$json_body" | "$JQ_BIN" -r '[.findings[]? | select(.severity == "serious")] | length')
  minor_actual=$(printf '%s' "$json_body" | "$JQ_BIN" -r '[.findings[]? | select(.severity == "minor")] | length')

  if [ "$blocker_decl" != "$blocker_actual" ] || \
     [ "$serious_decl" != "$serious_actual" ] || \
     [ "$minor_decl" != "$minor_actual" ]; then
    failed+=("R-REVIEW-3")
    detail_lines+=("R-REVIEW-3: summary counts do not match actual findings (declared blocker=${blocker_decl}/actual=${blocker_actual}, declared serious=${serious_decl}/actual=${serious_actual}, declared minor=${minor_decl}/actual=${minor_actual})")
  fi

  if [ ${#failed[@]} -gt 0 ]; then
    local rules_json
    rules_json=$(printf '%s\n' "${failed[@]}" | "$JQ_BIN" -R . | "$JQ_BIN" -s .)
    emit_failure "ARCH_DESIGN_REVIEW_V1" "$rules_json" "$(printf '%s\n' "${detail_lines[@]}")"
  fi
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

case "$DETECTED_TYPE" in
  architecture_document)        validate_architecture_document        ;;
  ARCH_FACTS_BUNDLE_V2)         validate_arch_facts_bundle_v2         ;;
  ARCH_BUNDLE_AUDIT_V2)         validate_arch_bundle_audit_v2         ;;
  ARCH_DESIGN_REVIEW_V1)        validate_arch_design_review_v1        ;;
esac

exit 0
