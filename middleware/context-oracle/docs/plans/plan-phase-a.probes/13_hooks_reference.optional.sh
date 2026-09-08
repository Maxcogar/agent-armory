#!/usr/bin/env bash
# Claims (§4, Steps 20, 25, 28, 29, 31, 39): the current hooks reference states
# each sentence below INSIDE the section named for it (a sentence found under
# another heading does not count — the workspace-trust rule for settings files
# and the stricter rule for subagent frontmatter live under different
# headings, and the PreToolUse contrast sentence lives under the PreModelSwitch
# section, not the timeout one). The needles are the passages §11.4's entry
# quotes; the entry states nothing about the page this probe does not print.
h=$(curl -sS -L --max-time 60 https://code.claude.com/docs/en/hooks) || { echo "SKIPPED: network"; exit 0; }
[ -z "$h" ] && { echo "SKIPPED: network"; exit 0; }
f=$(mktemp); printf '%s' "$h" > "$f"
python3 - "$f" <<'PY'
import sys, re, html
raw = open(sys.argv[1], encoding='utf-8', errors='replace').read()
raw = re.sub(r'<script.*?</script>|<style.*?</style>', '', raw, flags=re.S)
# keep heading boundaries so a sentence can be attributed to its section
raw = re.sub(r'<h([1-6])[^>]*>', lambda m: '\n@@H\n', raw)
t = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', raw))).replace('​', '')
sections = [s.strip() for s in t.split('@@H') if s.strip()]
def under(heading_start, needle):
    for s in sections:
        if s.startswith(heading_start) and needle in s:
            return True
    return False
checks = [
    ("hook doesn’t block the tool call", "Timeouts"),
    ("discarding the hook", "Timeouts"),
    ("once per turn: UserPromptSubmit , Stop , and StopFailure", "Hook lifecycle"),
    ("once per session", "Hook lifecycle"),
    ("When you submit a prompt", "Hook lifecycle"),
    ("written asynchronously", "Common input fields"),
    ("Interactive session : Claude Code holds back hooks from every settings file", "Workspace trust"),
    ("-p or SDK session : Claude Code never shows the dialog and treats the folder as trusted", "Workspace trust"),
    ("A -p session doesn’t count as accepting it", "Hooks in skills and agents"),
    ("On PreToolUse , by contrast", "PreModelSwitch decision control"),
    ("the stop_hook_active input and the 8-consecutive-continuation cap", "Stop decision control"),
    ("settings.local.json", "Hook locations"),
    ("statusMessage", "Common fields"),
    ("asyncRewake", "Command hook fields"),
    ("allowedEnvVars", "HTTP hook fields"),
]
for needle, section in checks:
    print((f"present under '{section}': " if under(section, needle) else f"ABSENT under '{section}': ") + needle)
PY
rm -f "$f"
