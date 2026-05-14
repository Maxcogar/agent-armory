#!/usr/bin/env bash
# artifact-quality-gate.sh
# PreToolUse hook — blocks artifact submission if content contains markers
# of incomplete work (open questions, TODOs, unfinished investigation).
#
# Matches: submit_workspace_artifact
# Behavior: Scans TOOL_INPUT for red-flag patterns. Exits non-zero to block
#           the tool call if any are found. The agent sees the error message
#           and must fix the issue before resubmitting.
#
# Type-aware dispatch (added in the architecture-pipeline rework, plan §8):
# Architecture-pipeline artifacts are handled by validate-architecture-artifact.sh,
# which owns those four artifact types. This script exits 0 with no action
# for them; the existing red-flag rules apply only to non-architecture
# artifacts (planning, review, implementation, audit).

CONTENT="$TOOL_INPUT"

# Detect artifact type for type-aware dispatch.
# Tries jq parsing first; falls back to plain-string match on $TOOL_INPUT for
# environments where jq is unavailable or where TOOL_INPUT isn't a JSON object.
ARTIFACT_TYPE=""
JQ_BIN="${AGENTBOARD_JQ_BIN:-jq}"
if command -v "$JQ_BIN" >/dev/null 2>&1; then
  ARTIFACT_TYPE=$(echo "$TOOL_INPUT" | "$JQ_BIN" -r '(.tool_input.artifact_type // .artifact_type) // empty' 2>/dev/null || echo "")
fi

# Architecture-pipeline artifacts are handled by the architecture validation
# hook. This script exits cleanly without action for them.
if [[ "$ARTIFACT_TYPE" == "architecture_document" ]] || \
   [[ "$ARTIFACT_TYPE" == ARCH_FACTS_BUNDLE_V2* ]] || \
   [[ "$ARTIFACT_TYPE" == ARCH_BUNDLE_AUDIT_V2* ]] || \
   [[ "$ARTIFACT_TYPE" == ARCH_DESIGN_REVIEW_V1* ]]; then
  exit 0
fi

# Fall back to content-sentinel detection when artifact_type is empty (the
# agentboard MCP today submits architecture artifacts with type "general" and
# a leading sentinel line in the content).
if [[ -z "$ARTIFACT_TYPE" ]]; then
  # Scan the first ~400 chars for any architecture-pipeline sentinel or the
  # architecture_document heading.
  HEAD_SAMPLE=$(echo "$CONTENT" | head -c 400 2>/dev/null || true)
  if echo "$HEAD_SAMPLE" | grep -qE "ARCH_FACTS_BUNDLE_V2|ARCH_BUNDLE_AUDIT_V2|ARCH_DESIGN_REVIEW_V1"; then
    exit 0
  fi
  # The architecture_document content has a top-level `# Architecture —`
  # heading and a `## Card Slices` section.
  if echo "$CONTENT" | grep -qE '^# Architecture —' && echo "$CONTENT" | grep -qE '^## Card Slices'; then
    exit 0
  fi
fi

# Red-flag patterns indicating an incomplete artifact (non-architecture only)
PATTERNS=(
  "TODO"
  "TBD"
  "FIXME"
  "PLACEHOLDER"
  "need to investigate"
  "need to look"
  "needs further"
  "needs investigation"
  "needs more research"
  "open question"
  "not sure"
  "look into"
  "figure out"
  "to be determined"
  "requires further"
  "still need"
  "haven't determined"
  "unknown at this time"
  "more research needed"
  "awaiting clarification"
)

for pattern in "${PATTERNS[@]}"; do
  if echo "$CONTENT" | grep -qi "$pattern"; then
    echo "BLOCKED: Artifact contains incomplete language: '$pattern'"
    echo "Your submission has unresolved items. Fix ALL open items using your investigation tools (codegraph, codebase-rag, Grep, Read) before submitting."
    exit 1
  fi
done

exit 0
