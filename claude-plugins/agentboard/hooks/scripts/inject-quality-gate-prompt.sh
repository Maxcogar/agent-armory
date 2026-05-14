#!/usr/bin/env bash
# inject-quality-gate-prompt.sh
# PreToolUse hook — emits the workspace-pipeline submission quality-gate
# guidance for non-architecture artifacts only.
#
# Matches: mcp__agentboard__agentboard_submit_workspace_artifact
#
# Behavior:
#   1. Reads TOOL_INPUT from stdin (Claude Code hook protocol) or env.
#   2. Detects whether this is an architecture-pipeline artifact (one of
#      architecture_document / ARCH_FACTS_BUNDLE_V2 / ARCH_BUNDLE_AUDIT_V2 /
#      ARCH_DESIGN_REVIEW_V1).
#   3. If architecture-pipeline: exit 0 with empty stdout — no prompt
#      injected. The architecture-pipeline subagents have their own
#      submission discipline and do not want the workspace-pipeline gate's
#      "no open questions" / "you used codegraph and codebase-rag" guidance.
#   4. Otherwise: print the workspace-pipeline submission quality-gate
#      prompt text to stdout verbatim. Non-architecture submissions retain
#      the existing prompt behavior unchanged.
#
# Spec reference: docs/plans/2026-05-12-architecture-pipeline-rework-plan.md §8.

set -uo pipefail

# ---------------------------------------------------------------------------
# Input acquisition (same shape as validate-architecture-artifact.sh)
# ---------------------------------------------------------------------------

HOOK_PAYLOAD=""
if [ -t 0 ]; then
  HOOK_PAYLOAD="${TOOL_INPUT:-}"
else
  HOOK_PAYLOAD=$(cat)
  if [ -z "$HOOK_PAYLOAD" ]; then
    HOOK_PAYLOAD="${TOOL_INPUT:-}"
  fi
fi

JQ_BIN="${AGENTBOARD_JQ_BIN:-jq}"

ARTIFACT_TYPE=""
CONTENT=""
if [ -n "$HOOK_PAYLOAD" ] && command -v "$JQ_BIN" >/dev/null 2>&1; then
  # Try parsing as the Claude Code hook protocol shape first, then fall back
  # to treating the payload as the tool_input object directly.
  TOOL_INPUT_JSON=$(echo "$HOOK_PAYLOAD" | "$JQ_BIN" -c '.tool_input // .' 2>/dev/null || echo "")
  if [ -z "$TOOL_INPUT_JSON" ] || [ "$TOOL_INPUT_JSON" = "null" ]; then
    TOOL_INPUT_JSON="$HOOK_PAYLOAD"
  fi
  ARTIFACT_TYPE=$(echo "$TOOL_INPUT_JSON" | "$JQ_BIN" -r '.artifact_type // empty' 2>/dev/null || echo "")
  CONTENT=$(echo "$TOOL_INPUT_JSON" | "$JQ_BIN" -r '.content // empty' 2>/dev/null || echo "")
fi

# ---------------------------------------------------------------------------
# Detect architecture-pipeline artifact
# ---------------------------------------------------------------------------

is_architecture_artifact() {
  if [[ "$ARTIFACT_TYPE" == "architecture_document" ]] || \
     [[ "$ARTIFACT_TYPE" == ARCH_FACTS_BUNDLE_V2* ]] || \
     [[ "$ARTIFACT_TYPE" == ARCH_BUNDLE_AUDIT_V2* ]] || \
     [[ "$ARTIFACT_TYPE" == ARCH_DESIGN_REVIEW_V1* ]]; then
    return 0
  fi
  if [ -n "$CONTENT" ]; then
    local head_sample
    head_sample=$(printf '%s' "$CONTENT" | head -c 400 2>/dev/null || true)
    if printf '%s' "$head_sample" | grep -qE "ARCH_FACTS_BUNDLE_V2|ARCH_BUNDLE_AUDIT_V2|ARCH_DESIGN_REVIEW_V1"; then
      return 0
    fi
    if printf '%s' "$CONTENT" | grep -qE '^# Architecture —' && printf '%s' "$CONTENT" | grep -qE '^## Card Slices'; then
      return 0
    fi
  fi
  return 1
}

if is_architecture_artifact; then
  # No prompt injected for architecture-pipeline submissions.
  exit 0
fi

# ---------------------------------------------------------------------------
# Non-architecture submission — emit the workspace-pipeline quality-gate prompt
# (verbatim from the pre-rework hooks.json prompt field).
# ---------------------------------------------------------------------------

cat <<'EOF'
SUBMISSION QUALITY GATE — Before submitting this artifact, verify ALL of the following:

- No open questions or unanswered items
- No TODO/TBD/FIXME/placeholder text
- No 'need to investigate' or 'look into' language
- Every step references specific files and line numbers
- You used codegraph, codebase-rag, grep, and read tools to validate your work
- The artifact is immediately actionable by another agent without further research

If ANY check fails, DO NOT submit. Go back and fix the gaps using your tools first.
EOF

exit 0
