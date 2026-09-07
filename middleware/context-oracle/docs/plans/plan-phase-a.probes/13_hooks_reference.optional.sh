#!/usr/bin/env bash
# Claims (§4, Steps 20, 28, 31, 39): the current hooks reference states, each
# INSIDE the section named here (a sentence found under another heading does
# not count — the workspace-trust rule for settings files and the stricter
# rule for subagent frontmatter live under different headings):
#   - the timeout clause (a timed-out PreToolUse hook does not block the tool);
#   - the once-per-turn cadence for UserPromptSubmit / Stop / StopFailure;
#   - the settings-file workspace-trust rule: an interactive session holds
#     settings-file hooks back until the trust dialog is accepted, and a -p or
#     SDK session treats the folder as trusted and runs them;
#   - the Stop additionalContext loop protection (stop_hook_active, 8 cap).
h=$(curl -sS -L --max-time 60 https://code.claude.com/docs/en/hooks) || { echo "SKIPPED: network"; exit 0; }
[ -z "$h" ] && { echo "SKIPPED: network"; exit 0; }
f=$(mktemp); printf '%s' "$h" > "$f"
python3 - "$f" <<'PY'
import sys, re, html
raw = open(sys.argv[1], encoding='utf-8', errors='replace').read()
raw = re.sub(r'<script.*?</script>|<style.*?</style>', '', raw, flags=re.S)
# keep heading boundaries so a sentence can be attributed to its section
raw = re.sub(r'<h([1-6])[^>]*>', lambda m: '\n@@H\n', raw)
t = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', raw))).replace('\u200b', '')
sections = [s.strip() for s in t.split('@@H') if s.strip()]
def under(heading_start, needle):
    for s in sections:
        if s.startswith(heading_start) and needle in s:
            return True
    return False
checks = [
    ("hook doesn’t block the tool call", None),
    ("once per turn: UserPromptSubmit , Stop , and StopFailure", None),
    ("Interactive session : Claude Code holds back hooks from every settings file", "Workspace trust"),
    ("-p or SDK session : Claude Code never shows the dialog and treats the folder as trusted", "Workspace trust"),
    ("A -p session doesn’t count as accepting it", "Hooks in skills and agents"),
    ("the stop_hook_active input and the 8-consecutive-continuation cap", None),
]
for needle, section in checks:
    if section is None:
        print(("present: " if needle in t else "ABSENT: ") + needle)
    else:
        print((f"present under '{section}': " if under(section, needle) else f"ABSENT under '{section}': ") + needle)
PY
rm -f "$f"
