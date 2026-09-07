#!/usr/bin/env bash
# install.sh - Installs the Review-Correction Convergence Gate into your repository.
#
# Run from inside any git repo:
#   bash /path/to/review-correction-convergence-gate/install.sh
#
# What it does:
#   1. Copies review_correction_convergence_gate.py to
#      ./.claude/hooks/review-correction-convergence-gate/
#   2. Merges Stop and PreToolUse hook entries into ./.claude/settings.json
#      (creating it if absent; every other setting/hook is left untouched)
#   3. Adds .claude/hook-state/ to .gitignore if not already present
#
# Requires: python3, git. `gh` (GitHub CLI) is optional - the PR-based round
# signal degrades gracefully without it (see README.md). `claude` CLI is
# required only for the escalation-unlock content check, not for the core
# tripwire.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo "ERROR: Run this from inside a git repository."
    exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
DEST_DIR="$REPO_ROOT/.claude/hooks/review-correction-convergence-gate"
SETTINGS_FILE="$REPO_ROOT/.claude/settings.json"
GITIGNORE_FILE="$REPO_ROOT/.gitignore"
HOOK_REL_PATH=".claude/hooks/review-correction-convergence-gate/review_correction_convergence_gate.py"

echo "Installing review-correction-convergence-gate into: $DEST_DIR"
mkdir -p "$DEST_DIR"
cp "$SCRIPT_DIR/review_correction_convergence_gate.py" "$DEST_DIR/"
chmod +x "$DEST_DIR/review_correction_convergence_gate.py"
echo "  Copied review_correction_convergence_gate.py"

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
command_args = ["${CLAUDE_PROJECT_DIR}/" + hook_rel_path]

stop_hooks = hooks.setdefault("Stop", [])
stop_installed = any(
    isinstance(group, dict)
    and any(isinstance(h, dict) and h.get("args") == command_args for h in group.get("hooks", []))
    for group in stop_hooks
)
if not stop_installed:
    stop_hooks.append({"hooks": [{"type": "command", "command": "python3", "args": command_args, "timeout": 90}]})
    print("  Added Stop hook entry")
else:
    print("  Stop hook entry already present - left untouched")

pretool_hooks = hooks.setdefault("PreToolUse", [])
pretool_installed = any(
    isinstance(group, dict)
    and group.get("matcher") == "Edit|Write|MultiEdit|NotebookEdit"
    and any(isinstance(h, dict) and h.get("args") == command_args for h in group.get("hooks", []))
    for group in pretool_hooks
)
if not pretool_installed:
    pretool_hooks.append({
        "matcher": "Edit|Write|MultiEdit|NotebookEdit",
        "hooks": [{"type": "command", "command": "python3", "args": command_args, "timeout": 30}],
    })
    print("  Added PreToolUse hook entry")
else:
    print("  PreToolUse hook entry already present - left untouched")

with open(settings_file, "w", encoding="utf-8") as f:
    json.dump(settings, f, indent=2)
    f.write("\n")
PYEOF

if [[ -f "$GITIGNORE_FILE" ]]; then
    if ! grep -qF ".claude/hook-state/" "$GITIGNORE_FILE"; then
        printf '\n# review-correction-convergence-gate hook state (per-repo runtime ledger/locks)\n.claude/hook-state/\n' >> "$GITIGNORE_FILE"
        echo "  Added .claude/hook-state/ to .gitignore"
    fi
else
    printf '.claude/hook-state/\n' > "$GITIGNORE_FILE"
    echo "  Created .gitignore with .claude/hook-state/"
fi

echo ""
echo "Installation complete."
echo ""
echo "Tune it via environment variables before starting Claude Code:"
echo "  CONVERGENCE_GATE_MODEL=claude-sonnet-5              # unlock-content judge model"
echo "  CONVERGENCE_GATE_MAX_BUDGET_USD=0.50                # per-judgment spend cap"
echo "  CONVERGENCE_GATE_TIMEOUT_SECONDS=60                 # judge subprocess timeout"
echo "  CONVERGENCE_GATE_SAME_FILE_ROUNDS_THRESHOLD=3       # consecutive same-file rounds to fire"
echo ""
echo "See README.md in this directory for what it catches, what it does not,"
echo "and its honest limitations."
