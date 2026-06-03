#!/usr/bin/env bash
# PreToolUse hook for Grep|Glob.
# Blocks the FIRST Grep and FIRST Glob call per user-prompt turn so the
# model is forced to consider rag_search before falling back to lexical
# search. State files live in .claude/hooks/.state/ and are cleared on
# every UserPromptSubmit by reset-search-blocks.sh.
#
# stdin: { "tool_name": "Grep" | "Glob", "tool_input": {...}, ... }

set -u

INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | python -c 'import json,sys;print(json.load(sys.stdin).get("tool_name",""))' 2>/dev/null)

case "$TOOL" in
  Grep|Glob) ;;
  *) exit 0 ;;
esac

STATE_DIR=".claude/hooks/.state"
mkdir -p "$STATE_DIR"
FLAG="$STATE_DIR/${TOOL}-used"

if [ -f "$FLAG" ]; then
  exit 0
fi

touch "$FLAG"

cat <<JSON
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"First ${TOOL} call this turn is blocked by policy. Use mcp__codebase-rag__rag_search (or mcp__codebase-rag__rag_query_impact for dependency lookups) first. If the RAG result is insufficient, retry ${TOOL} — the second call will go through."}}
JSON
exit 0
