#!/usr/bin/env bash
# task-observer SessionStart hook
# Replaces steps 1, 2, 3, 4 of SKILL.md "Session Start Protocol".
# Output: JSON with additionalContext injected into the conversation.

set -e

OBS_DIR="$HOME/.claude/skill-observations"
LOG="$OBS_DIR/log.md"
PRINCIPLES="$OBS_DIR/cross-cutting-principles.md"
LAST_REVIEW="$OBS_DIR/last-review-date.txt"
SKILL_PATH="$HOME/.claude/skills/task-observer/SKILL.md"

mkdir -p "$OBS_DIR"

if [ ! -f "$LOG" ]; then
  cat > "$LOG" <<'EOF'
# Skill Observation Log

Created by task-observer hook on first run.
Observations are appended below in the format `### Observation NNN:` per SKILL.md.

---
EOF
fi

if [ ! -f "$PRINCIPLES" ]; then
  cat > "$PRINCIPLES" <<'EOF'
# Cross-Cutting Principles

Principles that apply across multiple skills. Populated by the weekly review.

---
EOF
fi

REVIEW_NOTE=""
if [ ! -f "$LAST_REVIEW" ]; then
  REVIEW_NOTE="WEEKLY REVIEW NEVER RUN. Per SKILL.md, run the weekly comprehensive review before the user's task."
else
  LAST_TS=$(date -r "$LAST_REVIEW" +%s 2>/dev/null || echo 0)
  NOW_TS=$(date +%s)
  AGE_DAYS=$(( (NOW_TS - LAST_TS) / 86400 ))
  if [ "$AGE_DAYS" -gt 7 ]; then
    REVIEW_NOTE="WEEKLY REVIEW DUE: ${AGE_DAYS} days since last review. Per SKILL.md, run the weekly comprehensive review before the user's task."
  fi
fi

# Match both bold (**Status:** OPEN) and plain (Status: OPEN) forms; per SKILL.md §1387
# the canonical form is bold, but tolerate plain for hand-edited entries.
OPEN_COUNT=$(grep -cE '(^\*\*Status:\*\*|^Status:) +OPEN' "$LOG" 2>/dev/null | tr -d '\n' || echo 0)
[ -z "$OPEN_COUNT" ] && OPEN_COUNT=0

export TO_SKILL_PATH="$SKILL_PATH"
export TO_LOG="$LOG"
export TO_PRINCIPLES="$PRINCIPLES"
export TO_OPEN_COUNT="$OPEN_COUNT"
export TO_REVIEW_NOTE="$REVIEW_NOTE"

python <<'PY'
import json, os
ctx_lines = [
    "[TASK OBSERVER — ACTIVE via SessionStart hook]",
    "",
    f"Methodology: {os.environ['TO_SKILL_PATH']}",
    f"Observation log: {os.environ['TO_LOG']}",
    f"Cross-cutting principles: {os.environ['TO_PRINCIPLES']}",
    f"Open observations: {os.environ['TO_OPEN_COUNT']}",
]
review_note = os.environ.get('TO_REVIEW_NOTE', '').strip()
if review_note:
    ctx_lines += ["", review_note]
ctx_lines += [
    "",
    "During this session, watch for skill-improvement signals per the methodology.",
    "On stop, the Stop hook will trigger the end-of-session observation pass.",
]
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": "\n".join(ctx_lines),
    }
}))
PY

exit 0
