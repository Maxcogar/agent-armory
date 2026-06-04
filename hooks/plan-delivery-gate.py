#!/usr/bin/env python3
"""Hook 1 - Plan-Delivery Gate (PreToolUse). Denies delivery of a plan that
carries implementer-discretion options in its executable Plan steps.

A populated '## N. Spec issues' is contract-legitimate (/expert-plan Output
§4) and is NOT a trigger (corrected 2026-05-18 after verifying against a real
committed, review-PASS plan). See the design spec for the full rationale."""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _hooklib as H

GATED_MCP = "mcp__agentboard__agentboard_submit_workspace_artifact"
PLAN_PATH_RE = re.compile(
    r"(/|\\)(plans|planning)(/|\\)|plan-[^/\\]*\.md$|[^/\\]*-plan[^/\\]*\.md$",
    re.I)
PLAN_DOC_RE = re.compile(r"^#\s+.*\bplan\b|^#{1,3}\s+(\d+\.\s*)?plan\b",
                         re.I | re.M)
# Tightened: bare "choose between" / "pick one of" removed - real plans use
# them legitimately in "What this is NOT and why" reasoning. Imperative-
# discretion patterns only.
DISCRETION = [
    r"implementer\s+(?:may|should|can|could|will)\s+(?:decide|choose|pick|select|determine)",
    r"at\s+(?:the\s+)?implementer'?s?\s+discretion",
    r"\boption\s+[A-Z]\s*:", r"\bTBD\b", r"to\s+be\s+decided",
    r"decide\s+at\s+implementation\s+time", r"left\s+to\s+the\s+implementer",
]
DISCRETION_RE = re.compile("|".join(DISCRETION), re.I)
SPEC_SIGNALS = re.compile(
    r"\bspec\b|contradict|requirement|out of scope|\bscope\b|trade-?off", re.I)


def _emit(decision, reason=""):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": decision,
        "permissionDecisionReason": reason}}))
    sys.exit(0)


def _candidate_text(tool_name, ti):
    if tool_name == "Write":
        return ti.get("content"), ti.get("file_path", "")
    if tool_name == "Edit":
        return ti.get("new_string"), ti.get("file_path", "")
    if tool_name == GATED_MCP:
        for k in ("content", "body", "text", "artifact", "markdown"):
            if isinstance(ti.get(k), str):
                return ti[k], f"<agentboard artifact:{k}>"
        joined = "\n".join(v for v in ti.values() if isinstance(v, str))
        return (joined or None), "<agentboard artifact>"
    return None, ""


def main():
    data = H.read_stdin_json()
    tool_name = data.get("tool_name", "")
    ti = data.get("tool_input", {}) or {}
    if tool_name not in ("Write", "Edit", GATED_MCP):
        sys.exit(0)  # not ours; proceed
    text, ident = _candidate_text(tool_name, ti)
    if not isinstance(text, str) or not text.strip():
        # Cannot evaluate. File tools on non-plan paths: allow. MCP submit:
        # escalate (fail to a human, never silent-allow).
        if tool_name == GATED_MCP:
            _emit("ask", "Plan-Delivery Gate could not read the artifact body "
                         "to verify it carries no implementer options. Confirm "
                         "manually before submitting.")
        sys.exit(0)
    if tool_name in ("Write", "Edit"):
        if not (PLAN_PATH_RE.search(ident or "") and PLAN_DOC_RE.search(text)):
            sys.exit(0)  # not a plan doc on a plan path
    else:
        if not PLAN_DOC_RE.search(text):
            sys.exit(0)  # AgentBoard non-plan artifact

    findings = []
    plan_sec = H.extract_plan_section(text)
    for m in DISCRETION_RE.finditer(plan_sec):
        s = max(0, m.start() - 200)
        e = min(len(plan_sec), m.end() + 200)
        window = plan_sec[s:e]
        line = plan_sec[:m.start()].count("\n") + 1
        escalate_only = bool(SPEC_SIGNALS.search(window))
        tag = ("(E) ESCALATE ONLY - spec/scope signal nearby; the agent may "
               "NOT self-resolve this." if escalate_only
               else "(R) RESOLVE or (E) ESCALATE.")
        findings.append(f"LEXICAL @ Plan-section line ~{line}: "
                        f"...{window.strip()[:240]}...  -> {tag}")
    if not findings:
        sys.exit(0)  # clean - proceed
    reason = (
        f"PLAN-DELIVERY GATE: this plan ({ident}) carries unresolved options "
        f"in its executable Plan steps and may not be delivered. Convert EACH "
        f"item below to exactly one of:\n"
        f"  (R) RESOLVE - engineering decision with a standards-correct "
        f"answer: rewrite the step concretely and record the decision + cited "
        f"standard in the Decisions section. Item disappears.\n"
        f"  (E) ESCALATE - genuine spec/product/business decision: surface it "
        f"to the user verbatim as a numbered question and STOP. Items tagged "
        f"'(E) ESCALATE ONLY' may NOT be self-resolved (/expert-plan Step 7).\n\n"
        + "\n".join(f"- {f}" for f in findings))
    _emit("deny", reason)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:  # fail-safe: escalate, never silent-allow
        _emit("ask", f"Plan-Delivery Gate errored ({exc!r}); cannot verify the "
                     f"plan is option-free. Inspect manually before proceeding.")
