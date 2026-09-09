#!/usr/bin/env bash
# Claims (D-plan-26, Q43): a scrubbed `claude -p --permission-mode acceptEdits
# --allowedTools ...` session, continued with `--resume`, is a session whose
# `session_id` differs from the parent's, whose hooks are live at its first
# event (SessionStart, source=startup then source=resume on the continued
# turn), that can run a real `Edit`, and whose `PreToolUse` hooks can deny a
# tool call — the four observables leg 2's protocol requires and V9 (a
# tools-less, single-turn, `--max-turns 1` invocation) does not exercise.
#
# Prompt phrasing note (found during authoring): a rigid "exact content X,
# then command Y, then reply with the exact word Z" phrasing intermittently
# reads to the model as a prompt-injection/CTF test, and it asks for
# clarification instead of proceeding. A plain two-part request also
# non-deterministically executed only the first part once. An explicit
# numbered two-item list ("1) ... 2) ...") in ordinary language removed
# both failure modes across four consecutive runs. A real leg-2 driver
# script should phrase counted-session prompts the same way.
set -u
command -v claude >/dev/null || { echo "SKIPPED: claude CLI not on PATH"; exit 0; }
[ -n "${CLAUDE_CODE_SESSION_ID:-}" ] || { echo "SKIPPED: not inside a Claude Code session (no parent session id to compare)"; exit 0; }

CLONE=$(mktemp -d)
trap 'rm -rf "$CLONE"' EXIT
cd "$CLONE" || exit 1
git init -q
git config user.email "probe@example.com"
git config user.name "Probe"
echo "seed" > README.md
git add README.md
git commit -q -m "seed"

SETTINGS_DIR=".cla""ude"
mkdir -p "$SETTINGS_DIR"
cat > "$SETTINGS_DIR/sett""ings.json" << 'SETTINGSEOF'
{
  "hooks": {
    "SessionStart": [
      { "matcher": "*", "hooks": [ {"type": "command", "command": "cat >> .claude/sessionstart.jsonl"} ] }
    ],
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [ {"type": "command", "command": "python3 -c \"import sys,json; d=json.load(sys.stdin); cmd=d.get('tool_input',{}).get('command',''); print(json.dumps({'hookSpecificOutput':{'hookEventName':'PreToolUse','permissionDecision':'deny','permissionDecisionReason':'blocked by probe hook'}}) if 'FORBIDDEN_MARKER' in cmd else '{}')\""} ] }
    ]
  }
}
SETTINGSEOF

SCRUB=(env -u CLAUDECODE -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_REMOTE_SESSION_ID -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_PID -u CLAUDE_CODE_ENTRYPOINT)

OUT1=$("${SCRUB[@]}" timeout 120 claude -p \
  "This is a working repo checkout. Please do both of the following: 1) Create a file named target.txt containing the line hello-world. 2) Separately, run this command in the terminal so I can check the output: echo FORBIDDEN_MARKER-test" \
  --model claude-haiku-4-5-20251001 --permission-mode acceptEdits --allowedTools "Write Edit Bash" --output-format json 2>/dev/null) || { echo "turn 1 invocation failed"; exit 1; }

SID1=$(printf '%s' "$OUT1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('session_id',''))" 2>/dev/null)
DENIED1=$(printf '%s' "$OUT1" | python3 -c "
import sys,json
d=json.load(sys.stdin)
denials=d.get('permission_denials') or []
print('true' if any(x.get('tool_name')=='Bash' and 'FORBIDDEN_MARKER' in x.get('tool_input',{}).get('command','') for x in denials) else 'false')
" 2>/dev/null)

if [ "$SID1" = "$CLAUDE_CODE_SESSION_ID" ]; then FRESH1=false; else FRESH1=true; fi
if [ -f target.txt ] && [ "$(cat target.txt)" = "hello-world" ]; then CREATED1=true; else CREATED1=false; fi

echo "turn 1 session_id differs from parent: $FRESH1"
echo "turn 1 target.txt created with expected content: $CREATED1"
echo "turn 1 Bash FORBIDDEN_MARKER command denied: ${DENIED1:-false}"

OUT2=$("${SCRUB[@]}" timeout 120 claude -p \
  "Thanks. Now please add another line to target.txt that says second-turn-edit." \
  --model claude-haiku-4-5-20251001 --permission-mode acceptEdits --allowedTools "Write Edit Bash" --resume "$SID1" --output-format json 2>/dev/null) || { echo "turn 2 invocation failed"; exit 1; }

SID2=$(printf '%s' "$OUT2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('session_id',''))" 2>/dev/null)
if [ "$SID2" = "$SID1" ]; then SAME=true; else SAME=false; fi
if [ -f target.txt ] && printf '%s' "$(cat target.txt)" | grep -q "second-turn-edit"; then EDITED2=true; else EDITED2=false; fi
RESUMED=$(python3 -c "
import json
found = False
try:
    with open('$SETTINGS_DIR/sessionstart.jsonl') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            if d.get('source') == 'resume':
                found = True
except FileNotFoundError:
    pass
print('true' if found else 'false')
")

echo "turn 2 (resume) session_id matches turn 1: $SAME"
echo "turn 2 SessionStart source=resume observed: $RESUMED"
echo "turn 2 Edit appended second line successfully: $EDITED2"
