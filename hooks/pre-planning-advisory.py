#!/usr/bin/env python3
"""Hook 1b - Pre-Planning Advisory (PreToolUse on Task). Non-blocking.
Injects the no-implementer-choices directive before a planning subagent runs.
Advisory only - guarantees nothing; never breaks the workflow."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _hooklib as H

SUBAGENT_TYPE_KEY = "subagent_type"  # see HOST-NOTES.md
PLANNING_AGENTS = {
    "plan-compose-agent", "planning-research-agent", "planning-agent",
    "agentboard:plan-compose-agent", "agentboard:planning-research-agent",
}
DIRECTIVE = (
    "PLANNING DIRECTIVE (enforced by the Plan-Delivery Gate at delivery): the "
    "plan you produce must contain ZERO implementer choices. Resolve every "
    "engineering/implementation decision yourself and record it with a cited "
    "standard in the Decisions section. Escalate to the user ONLY a genuine "
    "spec/product/business decision - never an engineering one. A plan whose "
    "executable Plan steps say 'the implementer should decide', 'Option A/B', "
    "'TBD', or 'decide at implementation time' will be denied delivery."
)


def main():
    data = H.read_stdin_json()
    if data.get("tool_name") != "Task":
        sys.exit(0)
    st = (data.get("tool_input", {}) or {}).get(SUBAGENT_TYPE_KEY, "")
    if st not in PLANNING_AGENTS:
        sys.exit(0)
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow",
        "additionalContext": DIRECTIVE}}))
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        sys.exit(0)  # advisory: never break the workflow
