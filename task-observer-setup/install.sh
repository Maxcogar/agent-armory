#!/usr/bin/env bash
# task-observer setup — portable installer for Claude Code.
# Installs at user-level (~/.claude/) so it activates on every Claude Code session
# regardless of project. Safe to re-run (idempotent).
#
# What this does:
#   1. Copies SKILL.md to ~/.claude/skills/task-observer/
#   2. Copies the two hook scripts to ~/.claude/hooks/ and marks executable
#   3. Creates ~/.claude/skill-observations/ with empty templates if missing
#   4. Adds the SessionStart and Stop hook entries to ~/.claude/settings.json
#      (preserves all other settings; deduplicates if hooks are already present)
#
# Requirements: bash, python 3 (any 3.x). Works on macOS, Linux, and Windows
# (via Git Bash or WSL).

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CLAUDE_DIR="$HOME/.claude"

echo "task-observer installer"
echo "source: $SCRIPT_DIR"
echo "target: $CLAUDE_DIR"
echo ""

# Sanity-check required files in the package
for f in SKILL.md task-observer-session-start.sh task-observer-stop.sh; do
  if [ ! -f "$SCRIPT_DIR/$f" ]; then
    echo "ERROR: missing required file in package: $f" >&2
    exit 1
  fi
done

# Sanity-check python is available
if ! command -v python >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python (or python3) is required but not found in PATH" >&2
  exit 1
fi
PY=$(command -v python || command -v python3)

# 1. Skill
echo "[1/4] Installing skill -> $CLAUDE_DIR/skills/task-observer/"
mkdir -p "$CLAUDE_DIR/skills/task-observer"
cp "$SCRIPT_DIR/SKILL.md" "$CLAUDE_DIR/skills/task-observer/SKILL.md"

# 2. Hooks
echo "[2/4] Installing hook scripts -> $CLAUDE_DIR/hooks/"
mkdir -p "$CLAUDE_DIR/hooks"
cp "$SCRIPT_DIR/task-observer-session-start.sh" "$CLAUDE_DIR/hooks/task-observer-session-start.sh"
cp "$SCRIPT_DIR/task-observer-stop.sh" "$CLAUDE_DIR/hooks/task-observer-stop.sh"
chmod +x "$CLAUDE_DIR/hooks/task-observer-session-start.sh"
chmod +x "$CLAUDE_DIR/hooks/task-observer-stop.sh"

# 3. Observation directory with templates
echo "[3/4] Ensuring observation directory exists"
mkdir -p "$CLAUDE_DIR/skill-observations"
if [ ! -f "$CLAUDE_DIR/skill-observations/log.md" ]; then
  cat > "$CLAUDE_DIR/skill-observations/log.md" <<'EOF'
# Skill Observation Log

Created by task-observer installer.
Observations are appended below in the format `### Observation NNN:` per SKILL.md.

**Status key:** OPEN = not yet actioned | ACTIONED = skill updated/created | DECLINED = user decided not to pursue

---
EOF
  echo "      created empty log.md"
fi
if [ ! -f "$CLAUDE_DIR/skill-observations/cross-cutting-principles.md" ]; then
  cat > "$CLAUDE_DIR/skill-observations/cross-cutting-principles.md" <<'EOF'
# Cross-Cutting Principles

Principles that apply across multiple skills. Populated by the comprehensive review.

---
EOF
  echo "      created empty cross-cutting-principles.md"
fi

# 4. settings.json — add hook entries without clobbering existing settings
echo "[4/4] Updating $CLAUDE_DIR/settings.json"
SETTINGS="$CLAUDE_DIR/settings.json"

"$PY" - "$SETTINGS" <<'PY'
import json, os, sys, pathlib
path = pathlib.Path(sys.argv[1])

if path.exists():
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"ERROR: existing settings.json is not valid JSON: {e}", file=sys.stderr)
        sys.exit(1)
else:
    data = {}

hooks = data.setdefault("hooks", {})

def has_command(event_list, cmd):
    for group in event_list:
        for h in group.get("hooks", []):
            if h.get("command") == cmd:
                return True
    return False

# SessionStart
ss_cmd = "$HOME/.claude/hooks/task-observer-session-start.sh"
ss = hooks.setdefault("SessionStart", [])
if not has_command(ss, ss_cmd):
    ss.append({
        "matcher": "startup|resume",
        "hooks": [{"type": "command", "command": ss_cmd}],
    })
    print("      added SessionStart hook")
else:
    print("      SessionStart hook already present — skipped")

# Stop
stop_cmd = "$HOME/.claude/hooks/task-observer-stop.sh"
st = hooks.setdefault("Stop", [])
if not has_command(st, stop_cmd):
    st.append({
        "hooks": [{"type": "command", "command": stop_cmd}],
    })
    print("      added Stop hook")
else:
    print("      Stop hook already present — skipped")

path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"      settings.json saved ({path})")
PY

echo ""
echo "Done. Activates on your next Claude Code session."
echo "Backup of pre-install log (if it existed): not created — only template-init for new installs."
echo ""
echo "To uninstall: remove the two hook entries from $CLAUDE_DIR/settings.json"
echo "              and delete $CLAUDE_DIR/hooks/task-observer-*.sh and"
echo "              $CLAUDE_DIR/skills/task-observer/."
echo "              Your $CLAUDE_DIR/skill-observations/ data stays."
