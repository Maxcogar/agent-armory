#!/usr/bin/env bash
# artifact-quality-gate.sh
# PreToolUse hook — blocks artifact submission if content contains markers
# of incomplete work (open questions, TODOs, unfinished investigation).
#
# Matches: submit_workspace_artifact
# Behavior: Scans TOOL_INPUT for red-flag patterns. Exits non-zero to block
#           the tool call if any are found. The agent sees the error message
#           and must fix the issue before resubmitting.

CONTENT="$TOOL_INPUT"

# Red-flag patterns indicating an incomplete artifact
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
