#!/usr/bin/env python3
"""PreToolUse hook (all tools). While an issue is active it denies:
  - reading any review file under docs/reviews/ whose name carries `round-`, and the
    loop's own queue, verdicts, hashes and log;
  - reading or changing the loop tooling (this directory except the served packet,
    proposal.md, selfcheck.md and current.json) and the project settings file;
  - editing the plan (Edit/Write, or a Bash command that writes to it) before
    state/proposal.md exists.
With no active issue it allows everything.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import loop_lib as L

GUARD_ENV = "CORRECTION_LOOP_JUDGE_RUN"
ALLOWED_STATE = {"proposal.md", "selfcheck.md", "current.json"}


def deny(why):
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
                                             "permissionDecisionReason": f"correction loop: {why}"}}))
    sys.exit(0)


def is_review_file(s):
    return "docs/reviews/" in s and "round-" in s


def is_loop_file(s):
    return ("correction-loop" in s) or s.endswith(".claude/settings.json") or ("/.claude/settings.json" in s)


def loop_file_allowed(path):
    base = os.path.basename(path)
    return base in ALLOWED_STATE or re.match(r"^current-issue\.part\d+\.md$", base) is not None


def mentions_plan(s):
    return os.path.basename(L.PLAN_PATH) in s


WRITE_TOKENS = re.compile(r"sed -i|perl -i|\btee\b|>{1,2}\s*\S|\bmv\b|\bcp\b|python3?\b|\bnode\b|\bopen\(|\bwrite|\btruncate\b|\brm\b")


def main():
    if os.environ.get(GUARD_ENV) == "1" or not L.loop_active():
        sys.exit(0)
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)
    tool = data.get("tool_name", "")
    inp = data.get("tool_input") or {}
    proposal_exists = os.path.isfile(L.PROPOSAL)

    if tool in ("Read", "Grep", "Glob", "NotebookRead"):
        target = str(inp.get("file_path") or inp.get("path") or "")
        pattern = str(inp.get("pattern") or "")
        if is_review_file(target) or is_review_file(pattern):
            deny("review findings are not readable while an issue is active")
        if (is_loop_file(target) and not loop_file_allowed(target)) or is_loop_file(pattern):
            deny("the loop's files are not readable while an issue is active (except the served packet, proposal.md, selfcheck.md, current.json)")
        sys.exit(0)

    if tool in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
        target = str(inp.get("file_path") or inp.get("notebook_path") or "")
        if is_loop_file(target) and not loop_file_allowed(target):
            deny("the loop tooling and the settings file are not editable while the loop is active")
        if os.path.abspath(target) == L.PLAN_PATH and not proposal_exists:
            deny("the plan is not editable until state/proposal.md exists")
        sys.exit(0)

    if tool == "Bash":
        cmd = str(inp.get("command") or "")
        if is_review_file(cmd):
            deny("review findings are not readable while an issue is active")
        # strip mentions of the allowed state files, then any remaining loop-file mention is denied
        stripped = re.sub(r"\S*correction-loop/state/(?:proposal\.md|selfcheck\.md|current\.json|current-issue\.part\d+\.md)", "", cmd)
        if is_loop_file(stripped):
            deny("the loop tooling, its state, and the settings file are not accessible from Bash while the loop is active")
        readonly = re.sub(r"\bnode\s+\S*derive-plan-sections\.mjs[^;&|]*--(?:check|impact)\b[^;&|]*", "", cmd)
        if mentions_plan(cmd) and not proposal_exists and WRITE_TOKENS.search(readonly):
            deny("the plan is not editable until state/proposal.md exists (read it with sed -n / grep only)")
        sys.exit(0)
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        L.log(f"guard.py crashed: {exc!r}")
        deny(f"guard crashed ({exc!r}); the call is denied until the crash is understood")
