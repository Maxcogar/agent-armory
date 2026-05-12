#!/usr/bin/env python3
"""BeforeTool hook for `mcp_agentboard_agentboard_submit_workspace_artifact`.

Blocks artifact submission when the content contains red-flag patterns
that indicate incomplete work (TODOs, open questions, "investigate further",
etc.). The agent sees the rejection reason and must fix the gaps before
resubmitting.

Gemini hook contract (§10 of GEMINI_EXTENSION_SPEC.md):
  - stdin: JSON with tool_name, tool_input, ...
  - stdout: JSON response (decision, reason, ...) — exit 0
  - stderr: rejection reason if exit code 2 is used instead

This hook uses the stdout-JSON path: it always exits 0 and writes a
{"decision": "deny", "reason": "..."} object when blocking.
"""

from __future__ import annotations

import json
import re
import sys

RED_FLAG_PATTERNS = [
    "TODO",
    "TBD",
    "FIXME",
    "PLACEHOLDER",
    "need to investigate",
    "need to look",
    "needs further",
    "needs investigation",
    "needs more research",
    "open question",
    "not sure",
    "look into",
    "figure out",
    "to be determined",
    "requires further",
    "still need",
    "haven't determined",
    "unknown at this time",
    "more research needed",
    "awaiting clarification",
]


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        # Empty or malformed input — fail open, don't block.
        json.dump({}, sys.stdout)
        return 0

    tool_input = payload.get("tool_input") or {}
    content = tool_input.get("content") or ""
    if not isinstance(content, str):
        content = json.dumps(content)

    for pattern in RED_FLAG_PATTERNS:
        if re.search(re.escape(pattern), content, re.IGNORECASE):
            reason = (
                f"BLOCKED: Artifact contains incomplete language: '{pattern}'. "
                "Your submission has unresolved items. Fix ALL open items using "
                "your investigation tools (codegraph, codebase-rag, grep_search, "
                "read_file) before submitting."
            )
            json.dump({"decision": "deny", "reason": reason}, sys.stdout)
            return 0

    # No red flags — allow.
    json.dump({}, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
