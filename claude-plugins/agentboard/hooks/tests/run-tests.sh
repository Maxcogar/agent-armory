#!/usr/bin/env bash
# run-tests.sh
# Synthetic-fixture test runner for the architecture-pipeline hook scripts.
#
# Invocation:
#   ./run-tests.sh                                # uses jq on PATH
#   AGENTBOARD_JQ_BIN=/tmp/jq.exe ./run-tests.sh  # explicit jq binary
#
# For each fixture in ./fixtures/*.json the runner pipes the JSON to the
# validate hook (and, for the non-architecture fixtures, the existing gate
# and prompt-injection scripts) and checks the expected behavior:
#
#   validate pass  -> validate-architecture-artifact.sh must exit 0
#   validate block -> validate-architecture-artifact.sh must exit non-zero AND
#                      emit structured JSON with .failed_rules (optionally
#                      containing a given rule-ID substring)
#   validate noop  -> non-architecture artifact: validate exits 0, no action
#
# The fixtures here exercise the CORRECTED hook against reconciled plan §7
# (commits 9828344 / 47a1c14). build-fixtures.py is run automatically.
#
# Exits 0 on full pass, 1 on any failure.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOKS_DIR="$(dirname "$SCRIPT_DIR")"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"

VALIDATE="$HOOKS_DIR/scripts/validate-architecture-artifact.sh"
GATE="$HOOKS_DIR/scripts/artifact-quality-gate.sh"
INJECT="$HOOKS_DIR/scripts/inject-quality-gate-prompt.sh"

JQ_BIN="${AGENTBOARD_JQ_BIN:-jq}"
export AGENTBOARD_JQ_BIN="$JQ_BIN"
if ! command -v "$JQ_BIN" >/dev/null 2>&1; then
  echo "FATAL: jq not found at '$JQ_BIN'. Set AGENTBOARD_JQ_BIN (jq is at /tmp/jq.exe on this box)."
  exit 2
fi

# Regenerate fixtures so the suite always runs against the current generator.
if command -v python >/dev/null 2>&1; then
  python "$SCRIPT_DIR/build-fixtures.py" >/dev/null
elif command -v python3 >/dev/null 2>&1; then
  python3 "$SCRIPT_DIR/build-fixtures.py" >/dev/null
fi

PASS=0
FAIL=0
FAILED_TESTS=()

note() { printf '  %s\n' "$*"; }

# expect_validate <fixture_basename> <pass|block|noop> [expected_rule_substr]
expect_validate() {
  local name="$1"
  local expected="$2"
  local rule_substr="${3:-}"
  local fixture="$FIXTURES_DIR/${name}.json"
  if [ ! -f "$fixture" ]; then
    FAIL=$((FAIL + 1))
    FAILED_TESTS+=("validate:$name (missing fixture)")
    echo "FAIL  validate  $name  (fixture file not found)"
    return
  fi
  local payload stderr_capture exit_code
  payload=$(cat "$fixture")
  set +e
  stderr_capture=$(printf '%s' "$payload" | "$VALIDATE" 2>&1 >/dev/null)
  exit_code=$?
  set -e

  case "$expected" in
    pass|noop)
      if [ "$exit_code" -eq 0 ]; then
        PASS=$((PASS + 1))
        echo "PASS  validate  $name  (exit 0)"
      else
        FAIL=$((FAIL + 1))
        FAILED_TESTS+=("validate:$name")
        echo "FAIL  validate  $name  (expected exit 0, got $exit_code)"
        note "stderr: $stderr_capture"
      fi
      ;;
    block)
      if [ "$exit_code" -ne 0 ]; then
        # Carve out the JSON object (Cygwin may prepend fork-warning noise).
        local json_block
        json_block=$(printf '%s' "$stderr_capture" | sed -nE '/^\{/,/^\}/p')
        local has_failed_rules
        has_failed_rules=$(printf '%s' "$json_block" | "$JQ_BIN" -r '.failed_rules | join(",")' 2>/dev/null || echo "")
        if [ -z "$has_failed_rules" ]; then
          FAIL=$((FAIL + 1))
          FAILED_TESTS+=("validate:$name")
          echo "FAIL  validate  $name  (blocked exit=$exit_code but stderr is not structured JSON with .failed_rules)"
          note "stderr: $stderr_capture"
        elif [ -n "$rule_substr" ] && ! printf '%s' "$has_failed_rules" | grep -q "$rule_substr"; then
          FAIL=$((FAIL + 1))
          FAILED_TESTS+=("validate:$name")
          echo "FAIL  validate  $name  (blocked but .failed_rules=[$has_failed_rules] lacks '$rule_substr')"
          note "stderr: $stderr_capture"
        else
          PASS=$((PASS + 1))
          echo "PASS  validate  $name  (blocked exit=$exit_code rules=[$has_failed_rules])"
        fi
      else
        FAIL=$((FAIL + 1))
        FAILED_TESTS+=("validate:$name")
        echo "FAIL  validate  $name  (expected non-zero exit, got 0)"
      fi
      ;;
  esac
}

# expect_gate <fixture_basename> <pass|block>
expect_gate() {
  local name="$1"
  local expected="$2"
  local fixture="$FIXTURES_DIR/${name}.json"
  [ -f "$fixture" ] || { echo "SKIP  gate      $name  (no fixture)"; return; }
  local payload stdout_capture exit_code
  payload=$(cat "$fixture")
  set +e
  stdout_capture=$(TOOL_INPUT="$payload" "$GATE" 2>&1)
  exit_code=$?
  set -e
  if [ "$expected" = "pass" ] && [ "$exit_code" -eq 0 ]; then
    PASS=$((PASS + 1)); echo "PASS  gate      $name  (exit 0, no block)"
  elif [ "$expected" = "block" ] && [ "$exit_code" -ne 0 ]; then
    PASS=$((PASS + 1)); echo "PASS  gate      $name  (blocked exit=$exit_code)"
  else
    FAIL=$((FAIL + 1)); FAILED_TESTS+=("gate:$name")
    echo "FAIL  gate      $name  (expected $expected, got exit=$exit_code; out: ${stdout_capture})"
  fi
}

# expect_inject <fixture_basename> <empty|prompt>
expect_inject() {
  local name="$1"
  local expected="$2"
  local fixture="$FIXTURES_DIR/${name}.json"
  [ -f "$fixture" ] || { echo "SKIP  inject    $name  (no fixture)"; return; }
  local payload stdout_capture exit_code
  payload=$(cat "$fixture")
  set +e
  stdout_capture=$(printf '%s' "$payload" | "$INJECT" 2>/dev/null)
  exit_code=$?
  set -e
  if [ "$exit_code" -ne 0 ]; then
    FAIL=$((FAIL + 1)); FAILED_TESTS+=("inject:$name")
    echo "FAIL  inject    $name  (script exited non-zero: $exit_code)"
    return
  fi
  if [ "$expected" = "empty" ]; then
    if [ -z "$stdout_capture" ]; then
      PASS=$((PASS + 1)); echo "PASS  inject    $name  (empty output for architecture artifact)"
    else
      FAIL=$((FAIL + 1)); FAILED_TESTS+=("inject:$name")
      echo "FAIL  inject    $name  (expected empty, got: ${stdout_capture:0:80}...)"
    fi
  elif [ "$expected" = "prompt" ]; then
    if [ -n "$stdout_capture" ]; then
      PASS=$((PASS + 1)); echo "PASS  inject    $name  (prompt emitted for non-architecture artifact)"
    else
      FAIL=$((FAIL + 1)); FAILED_TESTS+=("inject:$name")
      echo "FAIL  inject    $name  (expected prompt, got empty)"
    fi
  fi
}

echo "=== validate-architecture-artifact.sh — architecture_document ==="
expect_validate doc_l1_valid                          pass
expect_validate doc_l2_valid                          pass
expect_validate doc_l3_valid                          pass
expect_validate doc_l3_valid_threat_asvs              pass
expect_validate doc_l2_valid_crlf                     pass
expect_validate doc_l1_invalid_no_level_marker        block "R-DOC-1"
expect_validate doc_l2_invalid_crlf_marker_trailing   block "R-DOC-1"
expect_validate doc_l2_invalid_shortform_headings     block "R-DOC-2"
expect_validate doc_l3_invalid_threat_no_asvs         block "R-DOC-2"
expect_validate doc_l2_invalid_empty_slices           block "R-DOC-3"
expect_validate doc_l2_invalid_broken_slice_fields    block "R-DOC-4"
expect_validate doc_l2_invalid_shortform_slice_labels block "R-DOC-4"
expect_validate doc_l2_invalid_missing_d_ref          block "R-DOC-6"

echo
echo "=== validate-architecture-artifact.sh — ARCH_FACTS_BUNDLE_V2 ==="
expect_validate bundle_valid_l1                  pass
expect_validate bundle_valid_l2                  pass
expect_validate bundle_valid_l3                  pass
expect_validate bundle_valid_l2_crlf             pass
expect_validate bundle_valid_l2_bom              pass
expect_validate bundle_invalid_level_mismatch    block "R-BUNDLE-5"
expect_validate bundle_invalid_malformed_json    block "R-BUNDLE-1"
expect_validate bundle_invalid_wrong_sentinel    block "R-BUNDLE-1"
expect_validate bundle_invalid_absent_sentinel   block "R-BUNDLE-1"

echo
echo "=== validate-architecture-artifact.sh — ARCH_BUNDLE_AUDIT_V2 ==="
expect_validate audit_valid_no_discrepancy            pass
expect_validate audit_valid_with_discrepancy          pass
expect_validate audit_valid_no_discrepancy_crlf       pass
expect_validate audit_invalid_missing_verdicts        block "R-AUDIT-3"
expect_validate audit_invalid_incoherent_discrepancy  block "R-AUDIT-4"
expect_validate audit_invalid_any_discrepancy_null    block "R-AUDIT-4"
expect_validate audit_invalid_any_discrepancy_string  block "R-AUDIT-4"
expect_validate audit_invalid_corrected_bundle_scalar block "R-AUDIT-4"
expect_validate audit_invalid_wrong_sentinel          block "R-AUDIT-1"

echo
echo "=== validate-architecture-artifact.sh — ARCH_DESIGN_REVIEW_V1 ==="
expect_validate review_valid_empty_findings       pass
expect_validate review_valid_with_findings        pass
expect_validate review_valid_empty_findings_crlf  pass
expect_validate review_invalid_summary_mismatch   block "R-REVIEW-3"
expect_validate review_invalid_bad_severity       block "R-REVIEW-2"
expect_validate review_invalid_bad_category       block "R-REVIEW-2"
expect_validate review_invalid_id_f0              block "R-REVIEW-2"
expect_validate review_invalid_id_f01             block "R-REVIEW-2"
expect_validate review_invalid_duplicate_ids      block "R-REVIEW-2"
expect_validate review_invalid_noncontiguous_ids  block "R-REVIEW-3"
expect_validate review_invalid_empty_quoted_text  block "R-REVIEW-2"
expect_validate review_invalid_wrong_sentinel     block "R-REVIEW-1"
expect_validate review_invalid_missing_audit_artifact_id  block "R-REVIEW-4"
expect_validate review_invalid_empty_audit_artifact_id    block "R-REVIEW-4"

echo
echo "=== non-architecture artifacts — validate must noop (exit 0) ==="
expect_validate non_architecture_clean      noop
expect_validate non_architecture_with_todo  noop

echo
echo "=== existing artifact-quality-gate.sh (architecture artifacts -> exit 0) ==="
for f in doc_l1_valid doc_l2_valid doc_l3_valid \
         bundle_valid_l2 audit_valid_no_discrepancy review_valid_empty_findings; do
  expect_gate "$f" pass
done
expect_gate non_architecture_clean     pass
expect_gate non_architecture_with_todo block

echo
echo "=== inject-quality-gate-prompt.sh (architecture -> empty; other -> prompt) ==="
for f in doc_l1_valid doc_l2_valid doc_l3_valid \
         bundle_valid_l2 audit_valid_no_discrepancy review_valid_empty_findings; do
  expect_inject "$f" empty
done
expect_inject non_architecture_clean     prompt
expect_inject non_architecture_with_todo prompt

echo
echo "----------------------------------------"
echo "PASSED: $PASS"
echo "FAILED: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo "Failed tests:"
  for t in "${FAILED_TESTS[@]}"; do
    echo "  - $t"
  done
  exit 1
fi
exit 0
