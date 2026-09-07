#!/usr/bin/env bash
# install.sh - Installs the Stop-Completeness Gate into your repository.
#
# Run from inside any git repo:
#   bash /path/to/stop-completeness-gate/install.sh
#
# What it does:
#   1. Copies stop_completeness_gate.py to ./.claude/hooks/stop-completeness-gate/
#   2. Merges the Stop-hook entry into ./.claude/settings.json (creating it if
#      it doesn't exist yet; leaves every other hook/setting untouched)
#
# Requires: python3, and the `claude` CLI on PATH (the hook shells out to
# `claude -p` to run the completeness judge - see README.md).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo "ERROR: Run this from inside a git repository."
    exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
DEST_DIR="$REPO_ROOT/.claude/hooks/stop-completeness-gate"
SETTINGS_FILE="$REPO_ROOT/.claude/settings.json"
HOOK_REL_PATH=".claude/hooks/stop-completeness-gate/stop_completeness_gate.py"

echo "Installing stop-completeness-gate into: $DEST_DIR"
mkdir -p "$DEST_DIR"
cp "$SCRIPT_DIR/stop_completeness_gate.py" "$DEST_DIR/"
chmod +x "$DEST_DIR/stop_completeness_gate.py"
echo "  Copied stop_completeness_gate.py"

mkdir -p "$(dirname "$SETTINGS_FILE")"
python3 - "$SETTINGS_FILE" "$HOOK_REL_PATH" <<'PYEOF'
import json
import sys

settings_file, hook_rel_path = sys.argv[1], sys.argv[2]

try:
    with open(settings_file, "r", encoding="utf-8") as f:
        settings = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    settings = {}

hooks = settings.setdefault("hooks", {})
stop_hooks = hooks.setdefault("Stop", [])

command_args = ["${CLAUDE_PROJECT_DIR}/" + hook_rel_path]
new_handler = {
    "type": "command",
    "command": "python3",
    "args": command_args,
    "timeout": 60,
}

already_installed = any(
    isinstance(group, dict)
    and any(
        isinstance(h, dict) and h.get("args") == command_args
        for h in group.get("hooks", [])
    )
    for group in stop_hooks
)

if already_installed:
    print("  Stop-completeness-gate already present in settings.json - left untouched")
else:
    stop_hooks.append({"hooks": [new_handler]})
    with open(settings_file, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2)
        f.write("\n")
    print(f"  Added Stop hook entry to {settings_file}")
PYEOF

echo ""
echo "Installation complete."
echo ""
echo "The gate is active on your next Claude Code session in this repo (Stop"
echo "hooks are read at session start)."
echo ""
echo "Tune it via environment variables before starting Claude Code:"
echo "  STOP_GATE_MODEL=claude-sonnet-5        # judge model (default)"
echo "  STOP_GATE_MAX_BUDGET_USD=0.50          # per-judgment spend cap"
echo "  STOP_GATE_TIMEOUT_SECONDS=45           # judge subprocess timeout"
echo ""
echo "See README.md in this directory for what it catches, what it costs,"
echo "and its honest limitations."
