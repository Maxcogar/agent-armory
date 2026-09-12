#!/usr/bin/env bash
# Claims (Steps 5, 36; D-plan-8): the shipped seam command authenticates and returns a fresh session_id with the six-variable session-identity set removed; unscrubbed it reports the parent's session_id.
command -v claude >/dev/null || { echo "SKIPPED: claude CLI not on PATH"; exit 0; }
[ -n "$CLAUDE_CODE_SESSION_ID" ] || { echo "SKIPPED: not inside a Claude Code session (no parent session id to compare)"; exit 0; }
run(){ label="$1"; shift; out=$(timeout 120 "$@" claude -p "Reply with the single word OK" --model claude-haiku-4-5-20251001 --tools "" --max-turns 1 --output-format json 2>/dev/null) || { echo "$label: invocation failed"; return; }
  printf '%s' "$out" | python3 -c "import sys,json,os; d=json.load(sys.stdin); print('$label: is_error=%s session=%s' % (d.get('is_error'), 'parent' if d.get('session_id')==os.environ.get('CLAUDE_CODE_SESSION_ID') else 'fresh'))"; }
run "unscrubbed" env CTXORACLE_INTERNAL=1
run "session-identity scrub" env -u CLAUDECODE -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_REMOTE_SESSION_ID -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_PID -u CLAUDE_CODE_ENTRYPOINT CTXORACLE_INTERNAL=1
vars=$(env | grep -oE "^(CLAUDE|ANTHROPIC)[A-Za-z0-9_]*" | sort -u); echo "ANTHROPIC_BASE_URL among the CLAUDE_*/ANTHROPIC_* variables present: $(printf '%s\n' "$vars" | grep -qx ANTHROPIC_BASE_URL && echo yes || echo no)"
run "every CLAUDE_*/ANTHROPIC_* removed" env $(printf '%s\n' "$vars" | sed 's/^/-u /' | tr '\n' ' ') CTXORACLE_INTERNAL=1
