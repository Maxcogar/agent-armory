#!/usr/bin/env bash
# Expert Standard — Subagent Output Capture (SubagentStop)
#
# Saves raw subagent output to a timestamped file so the main agent
# can't filter, soften, or drop findings when summarizing.
#
# Files go to .claude/hooks/subagent-logs/

LOG_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/subagent-logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/subagent-${TIMESTAMP}.json"

# Read full subagent output from stdin and save it
cat > "$LOG_FILE"

# Tell the user (stderr goes to transcript on exit 0 for some events,
# but for SubagentStop we output to stderr as a notification)
echo "Subagent output captured: $LOG_FILE" >&2

exit 0
