#!/usr/bin/env bash
# run-tests.sh
# Synthetic-fixture test runner for the architecture-pipeline hook scripts.
#
# Invocation:
#   ./run-tests.sh                    # uses jq on PATH
#   AGENTBOARD_JQ_BIN=/tmp/jq.exe ./run-tests.sh  # explicit jq binary
#
# For each fixture in ./fixtures/*.json the runner pipes the JSON to each of
# the three hook scripts and checks the expected behavior. Behavior is
# encoded in the fixture name:
#
#   valid -> validate-architecture-artifact.sh must exit 0
#   invalid -> validate-architecture-artifact.sh must exit non-zero AND emit
#              a structured JSON error to stderr
#   non_architecture_clean -> artifact-quality-gate.sh exit 0,
#                             inject-quality-gate-prompt.sh emits the prompt
#   non_architecture_with_todo -> artifact-quality-gate.sh exit non-zero
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
  echo "FATAL: jq not found at '$JQ_BIN'. Set AGENTBOARD_JQ_BIN."
  exit 2
fi

PASS=0
FAIL=0
FAILED_TESTS=()

note() { printf '  %s\n' "$*"; }

# expect_validate <fixture> <expected_exit_class: pass|block|noop> [expected_rule_substr]
expect_validate() {
  local fixture="$1"
  local expected="$2"
  local rule_substr="${3:-}"
  local payload
  payload=$(cat "$fixture")
  local stderr_capture
  set +e
  stderr_capture=$(echo "$payload" | "$VALIDATE" 2>&1 >/dev/null)
  local exit_code=$?
  set -e
  local name
  name=$(basename "$fixture" .json)

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
        # Extract the JSON portion of stderr (the script emits one JSON
        # object via jq). Cygwin/Git-Bash sometimes prepends fork-warning
        # noise lines; carve out the first '{' through the matching '}'.
        local json_block
        json_block=$(echo "$stderr_capture" | awk '
          /^\{/ { capture = 1 }
          capture { print; if ($0 ~ /^\}/) exit }
        ')
        local has_failed_rules
        has_failed_rules=$(echo "$json_block" | "$JQ_BIN" -r '.failed_rules // empty' 2>/dev/null || echo "")
        if [ -z "$has_failed_rules" ]; then
          FAIL=$((FAIL + 1))
          FAILED_TESTS+=("validate:$name")
          echo "FAIL  validate  $name  (blocked with exit $exit_code, but stderr is not structured JSON with .failed_rules)"
          note "stderr: $stderr_capture"
        elif [ -n "$rule_substr" ] && ! echo "$has_failed_rules" | grep -q "$rule_substr"; then
          FAIL=$((FAIL + 1))
          FAILED_TESTS+=("validate:$name")
          echo "FAIL  validate  $name  (blocked but .failed_rules does not contain '$rule_substr')"
          note "stderr: $stderr_capture"
        else
          PASS=$((PASS + 1))
          echo "PASS  validate  $name  (blocked exit=$exit_code rules=$(echo "$has_failed_rules" | tr -d '\n'))"
        fi
      else
        FAIL=$((FAIL + 1))
        FAILED_TESTS+=("validate:$name")
        echo "FAIL  validate  $name  (expected non-zero exit, got 0)"
      fi
      ;;
  esac
}

# expect_gate <fixture> <expected: pass|block>
expect_gate() {
  local fixture="$1"
  local expected="$2"
  local payload
  payload=$(cat "$fixture")
  local stderr_capture
  local stdout_capture
  set +e
  # artifact-quality-gate.sh reads $TOOL_INPUT env var (matches existing convention).
  stdout_capture=$(TOOL_INPUT="$payload" "$GATE" 2>&1)
  local exit_code=$?
  set -e
  local name
  name=$(basename "$fixture" .json)
  if [ "$expected" = "pass" ] && [ "$exit_code" -eq 0 ]; then
    PASS=$((PASS + 1))
    echo "PASS  gate      $name  (exit 0, no block)"
  elif [ "$expected" = "block" ] && [ "$exit_code" -ne 0 ]; then
    PASS=$((PASS + 1))
    echo "PASS  gate      $name  (blocked exit=$exit_code)"
  else
    FAIL=$((FAIL + 1))
    FAILED_TESTS+=("gate:$name")
    echo "FAIL  gate      $name  (expected $expected, got exit=$exit_code; output: ${stdout_capture})"
  fi
}

# expect_inject <fixture> <expected: empty|prompt>
expect_inject() {
  local fixture="$1"
  local expected="$2"
  local payload
  payload=$(cat "$fixture")
  local stdout_capture
  set +e
  stdout_capture=$(echo "$payload" | "$INJECT" 2>/dev/null)
  local exit_code=$?
  set -e
  local name
  name=$(basename "$fixture" .json)
  if [ "$exit_code" -ne 0 ]; then
    FAIL=$((FAIL + 1))
    FAILED_TESTS+=("inject:$name")
    echo "FAIL  inject    $name  (script exited non-zero: $exit_code)"
    return
  fi
  if [ "$expected" = "empty" ]; then
    if [ -z "$stdout_capture" ]; then
      PASS=$((PASS + 1))
      echo "PASS  inject    $name  (empty output for architecture artifact)"
    else
      FAIL=$((FAIL + 1))
      FAILED_TESTS+=("inject:$name")
      echo "FAIL  inject    $name  (expected empty, got: ${stdout_capture:0:80}...)"
    fi
  elif [ "$expected" = "prompt" ]; then
    if echo "$stdout_capture" | grep -q "SUBMISSION QUALITY GATE"; then
      PASS=$((PASS + 1))
      echo "PASS  inject    $name  (workspace-pipeline prompt emitted)"
    else
      FAIL=$((FAIL + 1))
      FAILED_TESTS+=("inject:$name")
      echo "FAIL  inject    $name  (expected prompt, got: ${stdout_capture:0:80}...)"
    fi
  fi
}

echo "=== Architecture validation hook (validate-architecture-artifact.sh) ==="
expect_validate "$FIXTURES_DIR/doc_l1_valid.json" pass
expect_validate "$FIXTURES_DIR/doc_l2_valid.json" pass
expect_validate "$FIXTURES_DIR/doc_l3_valid.json" pass
expect_validate "$FIXTURES_DIR/doc_l1_invalid_no_level_marker.json" block "R-DOC-1"
expect_validate "$FIXTURES_DIR/doc_l2_invalid_empty_slices.json" block "R-DOC-3"
expect_validate "$FIXTURES_DIR/doc_l2_invalid_broken_slice_fields.json" block "R-DOC-4"
expect_validate "$FIXTURES_DIR/doc_l2_invalid_missing_d_ref.json" block "R-DOC-6"

expect_validate "$FIXTURES_DIR/bundle_valid_l2.json" pass
expect_validate "$FIXTURES_DIR/bundle_invalid_level_mismatch.json" block "R-BUNDLE-5"
expect_validate "$FIXTURES_DIR/bundle_invalid_malformed_json.json" block "R-BUNDLE-1"

expect_validate "$FIXTURES_DIR/audit_valid_no_discrepancy.json" pass
expect_validate "$FIXTURES_DIR/audit_valid_with_discrepancy.json" pass
expect_validate "$FIXTURES_DIR/audit_invalid_missing_verdicts.json" block "R-AUDIT-3"
expect_validate "$FIXTURES_DIR/audit_invalid_incoherent_discrepancy.json" block "R-AUDIT-4"

expect_validate "$FIXTURES_DIR/review_valid_empty_findings.json" pass
expect_validate "$FIXTURES_DIR/review_valid_with_findings.json" pass
expect_validate "$FIXTURES_DIR/review_invalid_summary_mismatch.json" block "R-REVIEW-3"
expect_validate "$FIXTURES_DIR/review_invalid_bad_severity.json" block "R-REVIEW-2"

# Non-architecture artifact - validate should exit 0 with no action.
expect_validate "$FIXTURES_DIR/non_architecture_clean.json" noop
expect_validate "$FIXTURES_DIR/non_architecture_with_todo.json" noop

echo
echo "=== Existing artifact-quality-gate (artifact-quality-gate.sh) ==="
# Architecture-pipeline artifacts: gate must exit 0 (handed off to validate hook).
for f in \
  doc_l1_valid doc_l2_valid doc_l3_valid \
  bundle_valid_l2 audit_valid_no_discrepancy review_valid_empty_findings \
  doc_l2_invalid_missing_d_ref \
  bundle_invalid_level_mismatch; do
  expect_gate "$FIXTURES_DIR/${f}.json" pass
done
# Non-architecture clean: gate exits 0.
expect_gate "$FIXTURES_DIR/non_architecture_clean.json" pass
# Non-architecture with TODO: gate blocks.
expect_gate "$FIXTURES_DIR/non_architecture_with_todo.json" block

echo
echo "=== Prompt injection (inject-quality-gate-prompt.sh) ==="
# Architecture artifacts: no prompt injected.
for f in \
  doc_l1_valid doc_l2_valid doc_l3_valid \
  bundle_valid_l2 audit_valid_no_discrepancy review_valid_empty_findings; do
  expect_inject "$FIXTURES_DIR/${f}.json" empty
done
# Non-architecture artifacts: prompt emitted.
expect_inject "$FIXTURES_DIR/non_architecture_clean.json" prompt
expect_inject "$FIXTURES_DIR/non_architecture_with_todo.json" prompt

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
