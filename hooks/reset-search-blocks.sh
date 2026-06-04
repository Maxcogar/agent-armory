#!/usr/bin/env bash
# UserPromptSubmit hook. Clears the per-turn block flags so the next
# response starts with the first-Grep and first-Glob block in effect again.
rm -f .claude/hooks/.state/Grep-used .claude/hooks/.state/Glob-used 2>/dev/null
exit 0
