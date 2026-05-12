#!/usr/bin/env python3
"""AfterTool hook for workspace card tools.

Matches: get_next_card, get_card, update_workspace_card.

Reads the tool response, parses the card's current status, and injects
phase-appropriate guidance via hookSpecificOutput.additionalContext so
the agent sees the standards for the wave it's working in.

For `update_workspace_card`, only fires when assignee is being set (a
card claim), not on routine updates like adding notes.

Gemini hook contract (§10 of GEMINI_EXTENSION_SPEC.md):
  - stdin: JSON with tool_name, tool_input, tool_response, ...
  - stdout: JSON response with hookSpecificOutput.additionalContext for AfterTool
"""

from __future__ import annotations

import json
import re
import sys

GUIDANCE = {
    "planning": (
        "PLANNING PHASE STANDARDS:\n"
        "1. REQUIRED TOOLS: You MUST use codegraph (scan then dependencies/dependents for "
        "every relevant file), codebase-rag (rag_search with source_type=\"constraints\" "
        "for rules and \"docs\" for patterns), grep_search, and read_file to investigate "
        "BEFORE drafting your plan.\n"
        "2. COMPLETENESS: Your plan must be FULLY ACTIONABLE — zero open questions, zero "
        "TODOs, zero \"need to investigate further.\" If you don't know something, use "
        "your tools to find out NOW before writing anything.\n"
        "3. SPECIFICITY: Every step must reference specific files, functions, and line "
        "numbers. Vague steps like \"update the component\" will be rejected.\n"
        "4. If you cannot produce a complete plan after investigation, do NOT submit an "
        "artifact. Update the card notes explaining what blocked you."
    ),
    "review": (
        "PLAN REVIEW PHASE:\n"
        "1. Read ALL plan artifacts on this card thoroughly.\n"
        "2. Evaluate: Is the plan complete? Does it reference specific files and line "
        "numbers? Are there open questions or TODOs?\n"
        "3. If the plan is insufficient, submit a review_note artifact explaining what's "
        "missing.\n"
        "4. A good plan has zero ambiguity — another agent should be able to implement "
        "it without asking questions."
    ),
    "implementation": (
        "IMPLEMENTATION PHASE:\n"
        "1. Read the plan and any review artifacts on this card before writing code.\n"
        "2. Follow the plan's file references and steps. If deviating, document why in "
        "card notes.\n"
        "3. Run build + lint after changes.\n"
        "4. Submit an implementation_note artifact summarizing changes and any "
        "deviations from the plan."
    ),
    "audit": (
        "AUDIT PHASE:\n"
        "1. Read the plan, review notes, and implementation artifacts on this card.\n"
        "2. Verify the implementation matches the plan. Run tests and lint.\n"
        "3. Check for state machine violations, missing WebSocket events, and API "
        "contract adherence.\n"
        "4. Submit an audit_report artifact with your findings."
    ),
}


def extract_status(response_text: str) -> str | None:
    """Find a `status: <value>` or `"status": "<value>"` token in the response."""
    match = re.search(r'"status"\s*:\s*"([^"]+)"', response_text)
    if match:
        return match.group(1)
    match = re.search(r"\bstatus\s*[:=]\s*['\"]?([a-z_-]+)['\"]?", response_text, re.IGNORECASE)
    if match:
        return match.group(1).lower()
    return None


def emit_no_op() -> int:
    json.dump({}, sys.stdout)
    return 0


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return emit_no_op()

    tool_name = payload.get("tool_name") or ""
    tool_input = payload.get("tool_input") or {}
    tool_response = payload.get("tool_response") or {}

    # For update_workspace_card, only fire when assignee is being set (a claim).
    if tool_name.endswith("agentboard_update_workspace_card"):
        if "assignee" not in tool_input:
            return emit_no_op()

    # tool_response may have llmContent (markdown), returnDisplay, or raw structured data.
    response_text = ""
    if isinstance(tool_response, dict):
        for key in ("llmContent", "returnDisplay", "content"):
            value = tool_response.get(key)
            if isinstance(value, str):
                response_text = value
                break
        if not response_text:
            response_text = json.dumps(tool_response)
    elif isinstance(tool_response, str):
        response_text = tool_response

    if not response_text:
        return emit_no_op()

    status = extract_status(response_text)
    if not status:
        return emit_no_op()

    guidance = GUIDANCE.get(status.lower())
    if not guidance:
        return emit_no_op()

    json.dump({"hookSpecificOutput": {"additionalContext": guidance}}, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
