#!/usr/bin/env bash
# Claims (§4, Steps 20, 28, 31, 39): the current hooks reference states the timeout clause, the once-per-turn cadence, the workspace-trust rule for settings-file hooks, and the Stop additionalContext loop protection.
h=$(curl -sS -L --max-time 60 https://code.claude.com/docs/en/hooks) || { echo "SKIPPED: network"; exit 0; }
[ -z "$h" ] && { echo "SKIPPED: network"; exit 0; }
t=$(printf '%s' "$h" | python3 -c "import sys,re,html;s=sys.stdin.read();s=re.sub(r'<script.*?</script>|<style.*?</style>','',s,flags=re.S);s=re.sub(r'<[^>]+>',' ',s);print(html.unescape(re.sub(r'\s+',' ',s)))")
chk(){ printf '%s' "$t" | grep -q -F "$1" && echo "present: $1" || echo "ABSENT: $1"; }
chk "hook doesn’t block the tool call"
chk "once per turn: UserPromptSubmit , Stop , and StopFailure"
chk "same workspace trust rule as hooks in settings files"
chk "A -p session doesn’t count as accepting it"
chk "the stop_hook_active input and the 8-consecutive-continuation cap"
