#!/usr/bin/env bash
# validate-architecture-artifact.sh
# PreToolUse hook — validates architecture-pipeline artifacts before submission.
#
# Matches: mcp__agentboard__agentboard_submit_workspace_artifact
# Behavior:
#   1. Reads TOOL_INPUT from stdin (JSON via jq).
#   2. Detects which of the four submitted architecture-pipeline artifact types the
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
# (post-reconciliation: commits 9828344 / 47a1c14 are the spec of record).
# Rule set IDs: R-DOC-1..7, R-BUNDLE-1..5, R-AUDIT-1..4, R-REVIEW-1..4
#
# Cross-platform discipline (§7 "Cross-platform end-of-line discipline"):
#   every pattern that anchors with `$` uses `\r?$`; sentinel normalization
#   strips a leading UTF-8 BOM and treats both `\n` and `\r\n` as line
#   terminators. Windows-hosted MCP servers and Git autocrlf produce CRLF.
#
# Cygwin/Git-Bash hardening: jq invocations are consolidated (one jq call per
# logical check rather than per-field loops) because Cygwin fork pressure
# (`cygheap read copy failed`) caused intermittent failures under heavy use.
# awk is avoided for the same reason.
#
# This script is structural-only. Behavioral guarantees come from subagent
# frontmatter constraints, not from this hook. The correction-loop remediation
# path uses declared correction inputs passed to the affected stage; it does
# not submit a fifth correction artifact type through this hook.

set -uo pipefail

# ---------------------------------------------------------------------------
# Input acquisition
# ---------------------------------------------------------------------------

# Read TOOL_INPUT either from stdin (Claude Code hook protocol) or from the
# $TOOL_INPUT env var (older Claude Code convention used by sibling scripts).
HOOK_PAYLOAD=""
if [ -t 0 ]; then
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
TOOL_INPUT_JSON=$(printf '%s' "$HOOK_PAYLOAD" | "$JQ_BIN" -c '.tool_input // .' 2>/dev/null)
if [ -z "$TOOL_INPUT_JSON" ] || [ "$TOOL_INPUT_JSON" = "null" ]; then
  TOOL_INPUT_JSON="$HOOK_PAYLOAD"
fi

# Extract artifact_type and content.
ARTIFACT_TYPE=$(printf '%s' "$TOOL_INPUT_JSON" | "$JQ_BIN" -r '.artifact_type // empty' 2>/dev/null || echo "")
CONTENT=$(printf '%s' "$TOOL_INPUT_JSON" | "$JQ_BIN" -r '.content // empty' 2>/dev/null || echo "")

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
  "$JQ_BIN" -n \
    --arg hook "validate-architecture-artifact" \
    --arg t "$detected" \
    --argjson rules "$failed" \
    --arg d "$details" \
    '{hook: $hook, artifact_type: $t, failed_rules: $rules, details: $d}' >&2
  exit 2
}

# Build a JSON array of failed rule IDs from a bash array, then emit.
emit_from_arrays() {
  local detected="$1"
  shift
  # Remaining args: failed[] then "--" then detail lines joined by newline in $DETAIL_BLOB
  local rules_json
  rules_json=$(printf '%s\n' "$@" | "$JQ_BIN" -R . | "$JQ_BIN" -s .)
  emit_failure "$detected" "$rules_json" "$DETAIL_BLOB"
}

# ---------------------------------------------------------------------------
# Sentinel normalization (§7 "Sentinel-bearing artifacts")
# ---------------------------------------------------------------------------
#
# normalize_and_strip_sentinel EXPECTED_SENTINEL DETECTED_TYPE
#
# Normalization steps per §7:
#   (1) strip a leading UTF-8 BOM (\xEF\xBB\xBF) if present;
#   (2) treat both \n and \r\n as line terminators;
#   (3) strip the first line (and any trailing \r on that line);
#   (4) verify the stripped first line equals the expected sentinel exactly;
#   (5) the remainder (steps applied by caller) is the JSON body.
# If the first line is not the expected sentinel after normalization, fail
# the rule set with a wrong-sentinel error (artifact_type AND observed
# first-line text both reported).
#
# Results are written to globals NORM_BODY (the JSON body — the remainder
# after the sentinel line) and NORM_FIRST_LINE (the observed first line).
# This function MUST be invoked in the main shell, NOT inside a command
# substitution: on a sentinel mismatch it calls emit_failure which exits
# the process; if it ran in a `$(...)` subshell the exit would only kill
# the subshell and the rule set would continue with an empty body and
# emit a second, spurious structured error. Calling it directly keeps the
# wrong-sentinel failure a single clean structured emission per §7 step (5).
normalize_and_strip_sentinel() {
  local expected="$1"
  local detected="$2"

  # (1) Strip a leading UTF-8 BOM if present. The BOM bytes are EF BB BF.
  local body="$CONTENT"
  local first3
  first3=$(printf '%s' "$body" | head -c 3 | od -An -tx1 2>/dev/null | tr -d ' \n')
  if [ "$first3" = "efbbbf" ]; then
    body=$(printf '%s' "$body" | tail -c +4)
  fi

  # (2)(3) Extract the first line, treating both \n and \r\n as terminators.
  # `head -n 1` splits on \n; we then strip any trailing \r to handle \r\n.
  NORM_FIRST_LINE=$(printf '%s' "$body" | head -n 1)
  NORM_FIRST_LINE=${NORM_FIRST_LINE%$'\r'}

  # The remainder is everything after the first \n-delimited line. tail -n +2
  # yields the body; this preserves interior CRLF for jq (jq tolerates it).
  NORM_BODY=$(printf '%s' "$body" | tail -n +2)

  # (4) Exact sentinel equality. (5) On mismatch fail the rule set with a
  # single wrong-sentinel error reporting artifact_type AND observed first
  # line. emit_failure exits the process here (main-shell context).
  if [ "$NORM_FIRST_LINE" != "$expected" ]; then
    local rules_json
    rules_json=$(printf '%s\n' "${WRONG_SENTINEL_RULE}" | "$JQ_BIN" -R . | "$JQ_BIN" -s .)
    emit_failure "$detected" "$rules_json" \
      "${WRONG_SENTINEL_RULE}: expected sentinel first line '${expected}' but observed first line '${NORM_FIRST_LINE}' (artifact_type='${detected}'). Sentinel-bearing artifacts must be '<SENTINEL>\\n<JSON>' per plan §7."
  fi
}

# ---------------------------------------------------------------------------
# Artifact-type detection (plan §7 step 3, explicit parenthesization)
# ---------------------------------------------------------------------------

DETECTED_TYPE=""

# Content-sentinel hits — first 200 chars per plan (use 400 bytes of slack to
# tolerate a leading BOM and CRLF without missing the sentinel).
CONTENT_HEAD=$(printf '%s' "$CONTENT" | head -c 400 2>/dev/null || true)

is_arch_doc_content() {
  # Match `^# Architecture —` (em dash) AND `^## Card Slices` anywhere.
  # §7 detection-note: heading may appear with leading whitespace or after
  # YAML frontmatter; the check is start-of-line, not start-of-file. The
  # `\r?$`-equivalent here is the trailing `\r?` tolerance baked into the
  # heading-extraction step; for detection a bare anchored match suffices.
  printf '%s' "$CONTENT" | grep -qE '^# Architecture —' && \
  printf '%s' "$CONTENT" | grep -qE '^## Card Slices'
}

is_bundle_sentinel() { printf '%s' "$CONTENT_HEAD" | grep -q "ARCH_FACTS_BUNDLE_V2"; }
is_audit_sentinel()  { printf '%s' "$CONTENT_HEAD" | grep -q "ARCH_BUNDLE_AUDIT_V2"; }
is_review_sentinel() { printf '%s' "$CONTENT_HEAD" | grep -q "ARCH_DESIGN_REVIEW_V1"; }

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
  printf '%s' "$cls" | "$JQ_BIN" -r '
    def b(x): (x // false) == true;
    def n(x): (x // 0) | (if type == "number" then . else (tonumber? // 0) end);
    (n(.new_contracts_count.value))               as $nc  |
    (n(.existing_contracts_modified_count.value)) as $em  |
    (b(.trust_boundaries_introduced.value))       as $tb  |
    (b(.migration_signals_present.value))         as $mig |
    (n(.external_system_count.value))             as $ext |
    (n(.expected_card_count_band.upper))          as $upper |
    (b(.coupling_hotspot_overlap.value))          as $cpl |
    (n(.security_relevant_keyword_hits.value))    as $sec |
    if ($ext >= 1 or $mig or $sec >= 3 or $nc >= 3 or $upper >= 8) then 3
    elif ($nc >= 1 or $tb or $em >= 2 or $cpl) then 2
    else 1
    end
  '
}

# delimited_prefix_match REQUIRED ACTUAL
# Returns 0 (true) iff REQUIRED is a prefix of ACTUAL AND the character
# immediately after the prefix in ACTUAL is one of:
#   end-of-line, CR, single space, em-dash (—), colon (:), space-hyphen-space.
# This admits `## Goal — what this architecture serves` for required
# `## Goal` while rejecting `## Goalkeeper`. ACTUAL has already had any
# trailing \r stripped by the caller, but a CR may legitimately be the
# delimiter when matching against not-yet-stripped lines; both are handled.
delimited_prefix_match() {
  local required="$1"
  local actual="$2"
  # Title entry special case (§7): the document title is extracted via
  # `grep -nE "^# Architecture — "` — the required form `# Architecture — `
  # ends with the space-em-dash-space delimiter itself, so any line that
  # begins with that literal prefix satisfies the entry (the trailing space
  # is §7's sanctioned delimiter, not a character to re-test). Only the
  # title required entry ends with a trailing space.
  case "$required" in
    *" ")
      case "$actual" in
        "$required"*) return 0 ;;
        *) return 1 ;;
      esac
      ;;
  esac
  case "$actual" in
    "$required") return 0 ;;                       # exact (end-of-line)
    "$required"$'\r') return 0 ;;                   # CR-terminated
    "$required"$'\r'*) return 0 ;;                  # CR then more (CRLF slack)
    "$required "*) return 0 ;;                       # single space (covers " - " too)
    "$required:"*) return 0 ;;                       # colon
    "$required—"*) return 0 ;;                       # em-dash (UTF-8)
    *) return 1 ;;
  esac
}

# ===========================================================================
# Rule set: architecture_document  (R-DOC-1 .. R-DOC-7)
# ===========================================================================

validate_architecture_document() {
  local failed=()
  local detail_lines=()

  # ----- R-DOC-1 : level marker present (CRLF-tolerant) -----
  # §7: grep -qE "^\*\*Level:\*\* L[123]\r?$". Parse level = digit matched.
  local level_line doc_level=""
  level_line=$(printf '%s' "$CONTENT" | grep -E '^\*\*Level:\*\* L[123]\r?$' | head -n1)
  if [ -z "$level_line" ]; then
    failed+=("R-DOC-1")
    detail_lines+=("R-DOC-1: no '**Level:** L1|L2|L3' marker found at start-of-line (pattern ^\\*\\*Level:\\*\\* L[123]\\r?\$)")
  else
    # Strip a trailing CR before extracting the digit.
    local ll_clean="${level_line%$'\r'}"
    doc_level=$(printf '%s' "$ll_clean" | sed -E 's/^\*\*Level:\*\* L([123])$/\1/')
  fi

  # ----- R-DOC-2 : required sections present, in subsequence order -----
  # §7 long verbatim per-level lists (must match compose-l1/l2/l3 template
  # output verbatim). The italic-attestation line is a required L1 entry
  # between `## Scope` and `## Card Slices`.
  if [ -n "$doc_level" ]; then
    # Extract the ordered heading/marker sequence: the document title via
    # `^# Architecture — `, every `^## ` heading, and (for L1) the italic
    # attestation line. Strip trailing \r from every extracted line.
    # One grep, line-numbered, to preserve document order.
    local seq_raw
    seq_raw=$(printf '%s' "$CONTENT" | grep -nE '^# Architecture — |^## |^_At L1, the slice Descriptions' || true)

    local actual=()
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      # Strip "<lineno>:" prefix from grep -n output.
      local content_line="${line#*:}"
      # Strip trailing CR (CRLF-stored docs).
      content_line="${content_line%$'\r'}"
      actual+=("$content_line")
    done <<< "$seq_raw"

    # Per-level required sequences — verbatim per §7 / compose templates.
    local required_l1=(
      "# Architecture — "
      "## Goal"
      "## Scope"
      "_At L1, the slice Descriptions"
      "## Card Slices"
      "## Limitations"
      "## Standards governing this architecture"
      "## Status of this architecture"
    )
    local required_l2=(
      "# Architecture — "
      "## Goal"
      "## Scope"
      "## Components and structure"
      "## Design decisions"
      "## Card Slices"
      "## Traceability matrix"
      "## Limitations and trade-offs"
      "## Standards governing this architecture"
      "## Status of this architecture"
    )
    local required_l3=(
      "# Architecture — "
      "## Goal"
      "## Scope"
      "## Components and structure"
      "## Quality characteristics addressed (ISO/IEC 25010:2023)"
      "## Design decisions"
      "## Card Slices"
      "## Traceability matrix"
      "## Limitations and trade-offs"
      "## Standards governing this architecture"
      "## Status of this architecture"
    )

    local -n required="required_l${doc_level}"
    local n_actual=${#actual[@]}
    local cursor=0
    local missing=()
    local req
    for req in "${required[@]}"; do
      local found=0
      local i=$cursor
      while [ $i -lt $n_actual ]; do
        if delimited_prefix_match "$req" "${actual[$i]}"; then
          cursor=$((i + 1))
          found=1
          break
        fi
        i=$((i + 1))
      done
      if [ $found -eq 0 ]; then
        missing+=("$req")
      fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
      failed+=("R-DOC-2")
      detail_lines+=("R-DOC-2: missing or out-of-order required sections for L${doc_level}: $(IFS='|'; echo "${missing[*]}")")
    fi

    # L3 co-occurrence: if `## Threat model` present then
    # `## ASVS verification mapping` must also be present.
    if [ "$doc_level" = "3" ]; then
      if printf '%s' "$CONTENT" | grep -qE '^## Threat model([ :—]|\r?$)'; then
        if ! printf '%s' "$CONTENT" | grep -qE '^## ASVS verification mapping([ :—]|\r?$)'; then
          failed+=("R-DOC-2")
          detail_lines+=("R-DOC-2: L3 has '## Threat model' but is missing '## ASVS verification mapping' (both optional but co-occur)")
        fi
      fi
    fi
  fi

  # Extract the Card Slices section body once; used by R-DOC-3..7.
  # No awk (Cygwin fork hardening): use a sed range from the Card Slices
  # heading to the next `## ` heading. Trailing-CR tolerant.
  local card_slices_body
  card_slices_body=$(printf '%s' "$CONTENT" | sed -nE '/^## Card Slices([ :—]|\r?$)/,/^## /{ /^## Card Slices([ :—]|\r?$)/d; /^## /d; p; }')

  # ----- R-DOC-3 : Card Slices non-empty (>= 1 ### sub-heading) -----
  local slice_count
  slice_count=$(printf '%s\n' "$card_slices_body" | grep -cE '^### ' || true)
  slice_count=${slice_count//$'\n'/}
  if [ "${slice_count:-0}" -lt 1 ]; then
    failed+=("R-DOC-3")
    detail_lines+=("R-DOC-3: Card Slices section contains zero slice sub-headings (### )")
  fi

  # ----- R-DOC-4 : every slice contains all 8 §5 field labels -----
  # §5/compose canonical labels (verbatim — compose emits `- **Label.**`):
  #   Description, Allowed-touch list, Forbidden-touch list, Produces,
  #   Consumes, Verification scope, Depends on, Source decisions.
  if [ "${slice_count:-0}" -ge 1 ]; then
    local missing_per_slice=""
    local delim="<<<__SLICE_DELIMITER__>>>"
    # Chunk per slice using sed (no awk). Insert the delimiter before every
    # `### ` line except the first.
    local chunked
    chunked=$(printf '%s\n' "$card_slices_body" | sed -E "1!{ /^### /i ${delim}
}")
    local labels=(
      "Description"
      "Allowed-touch list"
      "Forbidden-touch list"
      "Produces"
      "Consumes"
      "Verification scope"
      "Depends on"
      "Source decisions"
    )
    local current="" title=""
    while IFS= read -r line; do
      local lc="${line%$'\r'}"
      if [ "$lc" = "$delim" ]; then
        if [ -n "$current" ]; then
          local missing_fields=() label
          for label in "${labels[@]}"; do
            # compose emits `- **Label.**` / `- **Label.** ...`; also tolerate
            # `- **Label**`, `- **Label**:`, `- Label:` for robustness. The
            # label must be followed by `.`, `**`, `:`, space, or tab.
            if ! printf '%s' "$current" | grep -qE "^[-*] +\*?\*?${label}(\.|\*\*|:| |\t)"; then
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
        if [ -z "$title" ] && [[ "$lc" == "### "* ]]; then
          title="${lc#### }"
        fi
        current="${current}${lc}"$'\n'
      fi
    done < <(printf '%s\n%s\n' "$chunked" "$delim")

    if [ -n "$missing_per_slice" ]; then
      failed+=("R-DOC-4")
      detail_lines+=("R-DOC-4: ${missing_per_slice}")
    fi
  fi

  # ----- R-DOC-5 : R# / Q# coverage -----
  local trace_body
  trace_body=$(printf '%s' "$CONTENT" | sed -nE '/^## Traceability matrix([ :—]|\r?$)/,/^## /{ /^## Traceability matrix([ :—]|\r?$)/d; /^## /d; p; }')

  local source_decisions_body
  source_decisions_body=$(printf '%s\n' "$card_slices_body" | grep -E "Source decisions" || true)

  if [ -n "$SPEC_PATH_ENV" ] && [ -r "$SPEC_PATH_ENV" ]; then
    local spec_text spec_ids
    spec_text=$(cat "$SPEC_PATH_ENV")
    spec_ids=$(printf '%s' "$spec_text" | grep -oE '\b[RQ][0-9]+\b' | sort -u)
    local missing_ids=() id
    for id in $spec_ids; do
      if printf '%s\n%s' "$trace_body" "$source_decisions_body" | grep -qE "\b${id}\b"; then
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
    # Fallback: traceability matrix non-empty. L1 template omits the section.
    if [ "$doc_level" != "1" ]; then
      local trace_nonblank
      trace_nonblank=$(printf '%s' "$trace_body" | grep -cE '\S' || true)
      trace_nonblank=${trace_nonblank//$'\n'/}
      if [ "${trace_nonblank:-0}" -lt 1 ]; then
        failed+=("R-DOC-5")
        detail_lines+=("R-DOC-5 (fallback): Traceability matrix section is empty and AGENTBOARD_SPEC_PATH is not set")
      fi
    fi
  fi

  # ----- R-DOC-6 : every D# in slice Source decisions defined in Design decisions -----
  if [ "$doc_level" != "1" ]; then
    local design_body
    design_body=$(printf '%s' "$CONTENT" | sed -nE '/^## Design decisions([ :—]|\r?$)/,/^## /{ /^## Design decisions([ :—]|\r?$)/d; /^## /d; p; }')
    local refs defs
    refs=$(printf '%s' "$source_decisions_body" | grep -oE '\bD[0-9]+\b' | sort -u)
    defs=$(printf '%s' "$design_body" | grep -oE '\bD[0-9]+\b' | sort -u)
    local missing_d=() d
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

  # ----- R-DOC-7 : no overlapping allowed-touch paths without justification -----
  if [ "${slice_count:-0}" -ge 2 ]; then
    local overlap_findings=""
    local delim="<<<__SLICE_DELIMITER__>>>"
    local chunked2
    chunked2=$(printf '%s\n' "$card_slices_body" | sed -E "1!{ /^### /i ${delim}
}")
    local titles=() allowed_lists=() descriptions=()
    local cur_title="" cur_chunk=""
    while IFS= read -r line; do
      local lc="${line%$'\r'}"
      if [ "$lc" = "$delim" ]; then
        if [ -n "$cur_chunk" ]; then
          titles+=("$cur_title")
          local al desc
          al=$(printf '%s' "$cur_chunk" | grep -E '^[-*] +\*?\*?Allowed-touch list(\.|\*\*|:| |\t)' | sed -E 's/^[-*] +\*?\*?Allowed-touch list[.*:]*[ \t]*//')
          allowed_lists+=("$al")
          desc=$(printf '%s' "$cur_chunk" | grep -E '^[-*] +\*?\*?Description(\.|\*\*|:| |\t)' | sed -E 's/^[-*] +\*?\*?Description[.*:]*[ \t]*//')
          descriptions+=("$desc")
        fi
        cur_chunk=""
        cur_title=""
      else
        if [ -z "$cur_title" ] && [[ "$lc" == "### "* ]]; then
          cur_title="${lc#### }"
        fi
        cur_chunk="${cur_chunk}${lc}"$'\n'
      fi
    done < <(printf '%s\n%s\n' "$chunked2" "$delim")

    local n=${#titles[@]} i j
    for ((i=0; i<n; i++)); do
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
          # §7/compose: justification is the substring "overlap justified"
          # in the Description of each sharing slice. Either side carrying
          # the substring is sufficient for the script's structural flag.
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
    DETAIL_BLOB=$(printf '%s\n' "${detail_lines[@]}")
    emit_from_arrays "architecture_document" "${failed[@]}"
  fi
}

# ===========================================================================
# Rule set: ARCH_FACTS_BUNDLE_V2  (R-BUNDLE-1 .. R-BUNDLE-5)
# ===========================================================================

validate_arch_facts_bundle_v2() {
  local failed=()
  local detail_lines=()
  WRONG_SENTINEL_RULE="R-BUNDLE-1"

  # R-BUNDLE-1: sentinel normalization + valid JSON. Call in the main shell
  # (not $(...)) so a wrong-sentinel emit_failure exits the process cleanly.
  normalize_and_strip_sentinel "ARCH_FACTS_BUNDLE_V2" "ARCH_FACTS_BUNDLE_V2"
  local json_body="$NORM_BODY"

  local parsed
  parsed=$(printf '%s' "$json_body" | "$JQ_BIN" . 2>&1)
  if [ $? -ne 0 ]; then
    failed+=("R-BUNDLE-1")
    detail_lines+=("R-BUNDLE-1: content after stripping the ARCH_FACTS_BUNDLE_V2 sentinel is not valid JSON: ${parsed}")
    DETAIL_BLOB=$(printf '%s\n' "${detail_lines[@]}")
    emit_from_arrays "ARCH_FACTS_BUNDLE_V2" "${failed[@]}"
  fi

  # R-BUNDLE-2: schema_version "2.0" AND rules_version "1.0".
  local sv rv
  sv=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.schema_version // empty')
  rv=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.rules_version // empty')
  if [ "$sv" != "2.0" ] || [ "$rv" != "1.0" ]; then
    failed+=("R-BUNDLE-2")
    detail_lines+=("R-BUNDLE-2: schema_version='${sv}' (expected '2.0'), rules_version='${rv}' (expected '1.0')")
  fi

  # R-BUNDLE-3: required top-level + sub-fields.
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

  # R-BUNDLE-4: computed_level numeric integer in {1,2,3}.
  local cl_type cl_val
  cl_type=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.rule_evaluation.computed_level | type')
  cl_val=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.rule_evaluation.computed_level')
  if [ "$cl_type" != "number" ] || ! [[ "$cl_val" =~ ^[123]$ ]]; then
    failed+=("R-BUNDLE-4")
    detail_lines+=("R-BUNDLE-4: rule_evaluation.computed_level must be a numeric integer in {1,2,3}; got type='${cl_type}' value='${cl_val}'")
  fi

  # R-BUNDLE-5: computed_level matches v1.0 rule re-evaluation.
  if [[ ! " ${failed[*]} " =~ " R-BUNDLE-3 " ]] && [[ ! " ${failed[*]} " =~ " R-BUNDLE-4 " ]]; then
    local cls_block expected_level
    cls_block=$(printf '%s' "$json_body" | "$JQ_BIN" -c '.classification_fields')
    expected_level=$(compute_level_from_classification "$cls_block")
    if [ "$cl_val" != "$expected_level" ]; then
      failed+=("R-BUNDLE-5")
      detail_lines+=("R-BUNDLE-5: bundle declares computed_level=${cl_val} but v1.0 rules re-evaluation from classification_fields yields ${expected_level}")
    fi
  fi

  if [ ${#failed[@]} -gt 0 ]; then
    DETAIL_BLOB=$(printf '%s\n' "${detail_lines[@]}")
    emit_from_arrays "ARCH_FACTS_BUNDLE_V2" "${failed[@]}"
  fi
}

# ===========================================================================
# Rule set: ARCH_BUNDLE_AUDIT_V2  (R-AUDIT-1 .. R-AUDIT-4)
# ===========================================================================

validate_arch_bundle_audit_v2() {
  local failed=()
  local detail_lines=()
  WRONG_SENTINEL_RULE="R-AUDIT-1"

  # R-AUDIT-1: sentinel normalization + valid JSON. Call in the main shell
  # (not $(...)) so a wrong-sentinel emit_failure exits the process cleanly.
  normalize_and_strip_sentinel "ARCH_BUNDLE_AUDIT_V2" "ARCH_BUNDLE_AUDIT_V2"
  local json_body="$NORM_BODY"

  local parsed
  parsed=$(printf '%s' "$json_body" | "$JQ_BIN" . 2>&1)
  if [ $? -ne 0 ]; then
    failed+=("R-AUDIT-1")
    detail_lines+=("R-AUDIT-1: content after stripping the ARCH_BUNDLE_AUDIT_V2 sentinel is not valid JSON: ${parsed}")
    DETAIL_BLOB=$(printf '%s\n' "${detail_lines[@]}")
    emit_from_arrays "ARCH_BUNDLE_AUDIT_V2" "${failed[@]}"
  fi

  # R-AUDIT-2: schema_version "2.0" AND rules_version "1.0".
  local sv rv
  sv=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.schema_version // empty')
  rv=$(printf '%s' "$json_body" | "$JQ_BIN" -r '.rules_version // empty')
  if [ "$sv" != "2.0" ] || [ "$rv" != "1.0" ]; then
    failed+=("R-AUDIT-2")
    detail_lines+=("R-AUDIT-2: schema_version='${sv}' (expected '2.0'), rules_version='${rv}' (expected '1.0')")
  fi

  # R-AUDIT-3: field_verdicts covers all 15 required entries; each has
  # .verdict in {PASS,DISCREPANCY} and a non-empty .method.
  local audit_check
  audit_check=$(printf '%s' "$json_body" | "$JQ_BIN" -r --argjson required '[
    "new_contracts_count","existing_contracts_modified_count","trust_boundaries_introduced",
    "migration_signals_present","external_system_count","expected_card_count_band",
    "coupling_hotspot_overlap","security_relevant_keyword_hits","files_relevant",
    "dependency_edges","blast_radius","existing_patterns_hits","constraint_hits",
    "external_libraries","open_questions"
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
        else empty end
      end
    ))
    | (map(select(.kind == "missing").key) | join(",")) as $missing
    | (map(select(.kind == "bad") | "\(.key)(verdict=\(.verdict),method=\(.method))") | join(",")) as $bad
    | "MISSING=\($missing)\nBAD=\($bad)"
  ' 2>&1)
  local missing_list bad_list
  missing_list=$(printf '%s' "$audit_check" | grep '^MISSING=' | sed 's/^MISSING=//' || true)
  bad_list=$(printf '%s' "$audit_check" | grep '^BAD=' | sed 's/^BAD=//' || true)
  if [ -n "$missing_list" ] || [ -n "$bad_list" ]; then
    failed+=("R-AUDIT-3")
    detail_lines+=("R-AUDIT-3: missing_verdicts=[${missing_list}] malformed=[${bad_list}]")
  fi

  # R-AUDIT-4: verified_level numeric integer in {1,2,3};
  # any_discrepancy present AND a JSON boolean (not null, not string);
  # if any_discrepancy == true: corrected_bundle is a JSON object
  # (not null, not scalar) and recomputed_level is a numeric integer in {1,2,3}.
  local audit4
  audit4=$(printf '%s' "$json_body" | "$JQ_BIN" -r '
    . as $a |
    ([
      ($a.verified_level     | type) as $vlt |
      ($a.verified_level)            as $vl  |
      (if ($vlt == "number") and ($vl == 1 or $vl == 2 or $vl == 3) then empty
       else "verified_level(type=\($vlt),value=\($vl))" end),

      (if ($a | has("any_discrepancy")) | not then "any_discrepancy(absent)"
       elif (($a.any_discrepancy | type) != "boolean") then
         "any_discrepancy(type=\($a.any_discrepancy | type),value=\($a.any_discrepancy))"
       else empty end),

      (if ($a | has("any_discrepancy")) and (($a.any_discrepancy | type) == "boolean") and ($a.any_discrepancy == true) then
         (
           (if (($a.corrected_bundle | type) != "object") then
              "corrected_bundle(type=\($a.corrected_bundle | type))"
            else empty end),
           (($a.recomputed_level | type) as $rlt | ($a.recomputed_level) as $rl |
            if ($rlt == "number") and ($rl == 1 or $rl == 2 or $rl == 3) then empty
            else "recomputed_level(type=\($rlt),value=\($rl))" end)
         )
       else empty end)
    ] | map(select(. != null and . != "")) | join("; ")) as $errs |
    if ($errs == "") then "OK" else "ERR=\($errs)" end
  ' 2>&1)
  if [ "$audit4" != "OK" ]; then
    failed+=("R-AUDIT-4")
    detail_lines+=("R-AUDIT-4: ${audit4#ERR=}")
  fi

  if [ ${#failed[@]} -gt 0 ]; then
    DETAIL_BLOB=$(printf '%s\n' "${detail_lines[@]}")
    emit_from_arrays "ARCH_BUNDLE_AUDIT_V2" "${failed[@]}"
  fi
}

# ===========================================================================
# Rule set: ARCH_DESIGN_REVIEW_V1  (R-REVIEW-1 .. R-REVIEW-4)
# ===========================================================================

validate_arch_design_review_v1() {
  local failed=()
  local detail_lines=()
  WRONG_SENTINEL_RULE="R-REVIEW-1"

  # R-REVIEW-1: sentinel normalization + valid JSON. Call in the main shell
  # (not $(...)) so a wrong-sentinel emit_failure exits the process cleanly.
  normalize_and_strip_sentinel "ARCH_DESIGN_REVIEW_V1" "ARCH_DESIGN_REVIEW_V1"
  local json_body="$NORM_BODY"

  local parsed
  parsed=$(printf '%s' "$json_body" | "$JQ_BIN" . 2>&1)
  if [ $? -ne 0 ]; then
    failed+=("R-REVIEW-1")
    detail_lines+=("R-REVIEW-1: content after stripping the ARCH_DESIGN_REVIEW_V1 sentinel is not valid JSON: ${parsed}")
    DETAIL_BLOB=$(printf '%s\n' "${detail_lines[@]}")
    emit_from_arrays "ARCH_DESIGN_REVIEW_V1" "${failed[@]}"
  fi

  # R-REVIEW-2: .findings is an array (may be empty). Per finding:
  #   .id matches ^F[1-9][0-9]*$ and is unique within .findings;
  #   .severity in {blocker,serious,minor};
  #   .category in {missing-decision,unjustified-slice,contract-mismatch,
  #                 standards-decoration,decision-hiding,deferred-decision,other};
  #   .summary, .details, .document_citation.section,
  #   .document_citation.quoted_text, .suggested_resolution non-empty strings;
  #   .document_citation.decision_id_or_slice_name is a string or null.
  local review2
  review2=$(printf '%s' "$json_body" | "$JQ_BIN" -r '
    def nonempty_str(x): (x | type == "string") and ((x | length) > 0);
    if (.findings | type) != "array" then
      "FINDINGS_NOT_ARRAY(type=\(.findings | type))"
    else
      ([ "blocker","serious","minor" ]) as $sev |
      ([ "missing-decision","unjustified-slice","contract-mismatch","standards-decoration","decision-hiding","deferred-decision","other" ]) as $cat |
      (.findings) as $fs |
      ([ $fs[] | .id ]) as $ids |
      ([ $fs | to_entries[]
         | .key as $i | .value as $f
         | ([
             (if (($f.id // "") | type == "string") and (($f.id // "") | test("^F[1-9][0-9]*$")) then empty
              else "idx\($i):id(\($f.id))" end),
             (if (($f.id != null) and (([ $ids[] | select(. == $f.id) ] | length) > 1)) then "idx\($i):id-not-unique(\($f.id))" else empty end),
             (if ($sev | index($f.severity // "")) == null then "idx\($i):severity(\($f.severity))" else empty end),
             (if ($cat | index($f.category // "")) == null then "idx\($i):category(\($f.category))" else empty end),
             (if nonempty_str($f.summary) then empty else "idx\($i):summary" end),
             (if nonempty_str($f.details) then empty else "idx\($i):details" end),
             (if nonempty_str($f.document_citation.section) then empty else "idx\($i):document_citation.section" end),
             (if nonempty_str($f.document_citation.quoted_text) then empty else "idx\($i):document_citation.quoted_text" end),
             (if nonempty_str($f.suggested_resolution) then empty else "idx\($i):suggested_resolution" end),
             (if (($f.document_citation.decision_id_or_slice_name | type) as $t | ($t == "string" or $t == "null")) then empty
              else "idx\($i):document_citation.decision_id_or_slice_name(\($f.document_citation.decision_id_or_slice_name | type))" end)
           ] | map(select(. != null and . != ""))[])
       ]) as $errs |
      if ($errs | length) == 0 then "OK" else "ERR=\($errs | join("; "))" end
    end
  ' 2>&1)
  if [ "$review2" != "OK" ]; then
    failed+=("R-REVIEW-2")
    detail_lines+=("R-REVIEW-2: ${review2#ERR=}")
  fi

  # R-REVIEW-3: .summary.{blocker_count,serious_count,minor_count} are
  # non-negative integers; each equals the actual count of that severity in
  # .findings; their sum equals len(.findings); and when .findings is
  # non-empty, findings[i].id == "F" + str(i+1) for every i (contiguous,
  # ascending). Skip the per-finding-id-shape part here (R-REVIEW-2 owns id
  # shape); R-REVIEW-3 owns contiguity/ordering.
  local review3
  review3=$(printf '%s' "$json_body" | "$JQ_BIN" -r '
    def is_nonneg_int(x): (x | type == "number") and (x == (x | floor)) and (x >= 0);
    (.findings // []) as $fs |
    (.summary // {}) as $s |
    ([
      (if is_nonneg_int($s.blocker_count) then empty else "blocker_count(\($s.blocker_count))" end),
      (if is_nonneg_int($s.serious_count) then empty else "serious_count(\($s.serious_count))" end),
      (if is_nonneg_int($s.minor_count)   then empty else "minor_count(\($s.minor_count))" end),
      ( ([ $fs[] | select(.severity == "blocker") ] | length) as $b |
        if is_nonneg_int($s.blocker_count) and ($s.blocker_count == $b) then empty
        else "blocker_count_mismatch(declared=\($s.blocker_count),actual=\($b))" end),
      ( ([ $fs[] | select(.severity == "serious") ] | length) as $se |
        if is_nonneg_int($s.serious_count) and ($s.serious_count == $se) then empty
        else "serious_count_mismatch(declared=\($s.serious_count),actual=\($se))" end),
      ( ([ $fs[] | select(.severity == "minor") ] | length) as $m |
        if is_nonneg_int($s.minor_count) and ($s.minor_count == $m) then empty
        else "minor_count_mismatch(declared=\($s.minor_count),actual=\($m))" end),
      ( (($s.blocker_count // -1) + ($s.serious_count // -1) + ($s.minor_count // -1)) as $sum |
        if (is_nonneg_int($s.blocker_count) and is_nonneg_int($s.serious_count) and is_nonneg_int($s.minor_count) and ($sum == ($fs | length))) then empty
        else "sum_ne_findings(sum=\($sum),len=\($fs | length))" end),
      ( [ $fs | to_entries[] | select(.value.id != ("F" + ((.key + 1) | tostring))) | "idx\(.key):id(\(.value.id))!=F\(.key + 1)" ][] )
    ] | map(select(. != null and . != "")) | join("; ")) as $errs |
    if ($errs == "") then "OK" else "ERR=\($errs)" end
  ' 2>&1)
  if [ "$review3" != "OK" ]; then
    failed+=("R-REVIEW-3")
    detail_lines+=("R-REVIEW-3: ${review3#ERR=}")
  fi

  # R-REVIEW-4: .audit_artifact_id is present and is a non-empty string (the
  # design-reviewer seam — short-spec correction-path consistency; the reviewer
  # resolves the verified bundle from this audit artifact id per the §1.6
  # boundary contract). Catches stale verified_bundle_artifact_id submissions
  # at the hook layer rather than silently letting them through.
  review4=$(printf '%s' "$JSON_BODY" | "$JQ_BIN" -r '
    if (.audit_artifact_id | type) != "string" then
      "audit_artifact_id_missing_or_not_string(found_type=\(.audit_artifact_id | type))"
    elif (.audit_artifact_id | length) == 0 then
      "audit_artifact_id_empty_string"
    else "OK" end
  ' 2>&1)
  if [ "$review4" != "OK" ]; then
    failed+=("R-REVIEW-4")
    detail_lines+=("R-REVIEW-4: ${review4}")
  fi

  if [ ${#failed[@]} -gt 0 ]; then
    DETAIL_BLOB=$(printf '%s\n' "${detail_lines[@]}")
    emit_from_arrays "ARCH_DESIGN_REVIEW_V1" "${failed[@]}"
  fi
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

WRONG_SENTINEL_RULE=""
NORM_BODY=""
NORM_FIRST_LINE=""
DETAIL_BLOB=""

case "$DETECTED_TYPE" in
  architecture_document)  validate_architecture_document  ;;
  ARCH_FACTS_BUNDLE_V2)   validate_arch_facts_bundle_v2   ;;
  ARCH_BUNDLE_AUDIT_V2)   validate_arch_bundle_audit_v2   ;;
  ARCH_DESIGN_REVIEW_V1)  validate_arch_design_review_v1  ;;
esac

exit 0
