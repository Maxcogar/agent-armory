# task-observer (Claude Code setup)

Portable installer for the `task-observer` meta-skill plus the two hooks that activate it deterministically in Claude Code.

The skill itself was authored by Eoghan Henn / [rebelytics.com](https://rebelytics.com) under CC BY 4.0 — see `SKILL.md` for the full attribution and license. Original repo: <https://github.com/rebelytics/one-skill-to-rule-them-all>.

The two hook scripts and the installer are custom additions to wire the skill into Claude Code's hook system (the upstream skill was designed for Claude Cowork, which has a different activation model).

## What gets installed

User-level under `~/.claude/`:

```
~/.claude/skills/task-observer/SKILL.md          # methodology (1500 lines)
~/.claude/hooks/task-observer-session-start.sh   # injects context at session start
~/.claude/hooks/task-observer-stop.sh            # gated end-of-session observation pass
~/.claude/skill-observations/log.md              # template, only created if missing
~/.claude/skill-observations/cross-cutting-principles.md  # template, only created if missing
```

Plus a two-entry `hooks` block added to `~/.claude/settings.json` (existing settings preserved).

## Requirements

- Claude Code CLI installed (`~/.claude/` exists)
- `bash` (Git Bash on Windows, or native on macOS/Linux)
- `python` 3.x on PATH (any 3.x version)

## Install

From this folder:

```bash
bash install.sh
```

The installer is idempotent — re-running it is safe. It won't duplicate the hook entries in `settings.json` and won't overwrite your existing observation log.

Takes effect on your **next** Claude Code session.

## What the hooks do

**SessionStart hook** — fires every Claude Code session (`startup|resume` matchers). Injects status into the agent's context: where the methodology lives, where the log lives, how many OPEN observations are pending, and whether a weekly review is overdue.

**Stop hook** — fires every agent turn (Claude Code's only "agent finished responding" event). Gated by transcript-size delta: only blocks the stop and triggers the observation pass when the conversation has grown by at least `TO_THRESHOLD_BYTES` since the last pass (default 10240 = 10 KiB; raise it in `task-observer-stop.sh` if it fires too often). On the second pass (`stop_hook_active=true`), the marker is updated and the stop is allowed through.

## What it does NOT do

- Does not modify any of your skill files automatically. The skill's "Acting on Observations" workflow runs interactively or via a scheduled review you set up separately.
- Does not include your personal observation log — only an empty template. Your real log on your primary machine is your own data.
- Does not use Claude Code's headless mode (`claude -p`). All observation work happens in your normal interactive session, so no extra metering.

## Uninstall

1. Remove the two entries from `hooks.SessionStart` and `hooks.Stop` in `~/.claude/settings.json`.
2. Delete `~/.claude/hooks/task-observer-*.sh` and `~/.claude/skills/task-observer/`.
3. Optional: delete `~/.claude/skill-observations/` (this removes your observation log — keep it if you want history).

## Files in this package

| File | Purpose |
|---|---|
| `install.sh` | The installer. Run it from this folder. |
| `SKILL.md` | The methodology document (CC BY 4.0, Eoghan Henn). |
| `task-observer-session-start.sh` | SessionStart hook script. |
| `task-observer-stop.sh` | Stop hook script. |
| `README.md` | This file. |

## Tuning

- **Stop-hook threshold**: edit `TO_THRESHOLD_BYTES` near the top of `task-observer-stop.sh`. Higher = fires less often. A single substantive turn with tool calls typically produces 100s of KB of transcript growth, so values in the low MB range (e.g., 1048576 for 1 MiB) tend to fire only on genuinely-substantive sessions.
- **Open-observations counter**: the SessionStart hook counts entries with a `Status: OPEN` line (bold or plain). If your log uses a different status convention, update the `grep -cE` pattern in `task-observer-session-start.sh`.
