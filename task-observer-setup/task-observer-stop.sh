#!/usr/bin/env bash
# task-observer Stop hook
# Stop fires on EVERY agent turn in Claude Code, not just at session end.
# To avoid an observation pass per turn, we gate on transcript-size delta:
# block only when the current transcript has grown >= THRESHOLD_BYTES since
# the last observation pass *for the same transcript*.
#
# The marker is a JSON file recording {transcript_path, size} from the last
# pass. If the current session's transcript_path doesn't match the marker's,
# we treat last_size as 0 — i.e., the entire new transcript counts as growth
# since the last pass. This avoids the cross-session category error of
# comparing byte counts between different transcript files.

set -e

export TO_SKILL_PATH="$HOME/.claude/skills/task-observer/SKILL.md"
export TO_LOG="$HOME/.claude/skill-observations/log.md"
export TO_PRINCIPLES="$HOME/.claude/skill-observations/cross-cutting-principles.md"
export TO_MARKER="$HOME/.claude/skill-observations/last-pass-marker.json"
export TO_THRESHOLD_BYTES="10240"   # 10 KiB of new transcript = "substantive"
export TO_INPUT="$(cat)"

python <<'PY'
import json, os, sys

raw = os.environ.get('TO_INPUT', '')
try:
    data = json.loads(raw) if raw else {}
except Exception:
    data = {}

marker_path = os.environ['TO_MARKER']
transcript_path = data.get('transcript_path') or ''
threshold = int(os.environ['TO_THRESHOLD_BYTES'])

# Current transcript size (0 if path missing or unreadable)
try:
    current_size = os.path.getsize(transcript_path) if transcript_path else 0
except OSError:
    current_size = 0

# Load marker; expect {"transcript_path": str, "size": int}.
# If marker is missing, malformed, or for a different transcript, last_size = 0
# so the entire current transcript counts as growth.
last_size = 0
try:
    with open(marker_path, 'r') as f:
        marker = json.loads(f.read() or '{}')
    if isinstance(marker, dict) and marker.get('transcript_path') == transcript_path:
        last_size = int(marker.get('size') or 0)
except (OSError, ValueError, json.JSONDecodeError):
    last_size = 0

# Second-pass call (after agent ran the observation pass): update marker, allow stop.
if data.get('stop_hook_active'):
    try:
        with open(marker_path, 'w') as f:
            json.dump({'transcript_path': transcript_path, 'size': current_size}, f)
    except OSError:
        pass
    sys.exit(0)

# First-pass: only block if transcript has grown enough since last pass *on this transcript*.
delta = current_size - last_size
if delta < threshold:
    sys.exit(0)

# Substantive growth — block once and instruct the agent to run the pass.
skill_path = os.environ['TO_SKILL_PATH']
log = os.environ['TO_LOG']
principles = os.environ['TO_PRINCIPLES']

reason = (
    "Before stopping, run the task-observer observation pass for this session.\n"
    f"(Triggered: transcript grew {delta} bytes since last observation pass, threshold {threshold}.)\n"
    "\n"
    f"1. Re-read the methodology at {skill_path} — specifically the Observation Protocol and Surfacing sections.\n"
    "2. Review this session's work (user messages, your responses, tool calls, corrections the user made).\n"
    "3. Identify skill-improvement observations: corrections, gaps no existing skill covers, patterns worth capturing, methodology blind spots.\n"
    f"4. For each observation, append an entry to {log} using the format `### Observation NNN:` with **Status:** OPEN, Issue → Suggested Improvement → Principle.\n"
    f"5. If any cross-cutting principle surfaced, append it to {principles}.\n"
    "6. After appending (or after determining there's nothing worth logging), give a one-line summary of what was logged. Then end your turn — the Stop hook will allow it on the second pass."
)
print(json.dumps({"decision": "block", "reason": reason}))
PY

exit 0
