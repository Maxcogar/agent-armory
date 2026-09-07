#!/usr/bin/env python3
"""Stop hook - Completeness Gate.

Fires on every Stop event (every time the main agent would end its turn).
Extracts the user request that started the turn and the agent's final
response for that turn from the transcript, asks an LLM judge whether the
response actually and fully satisfies the request as delivered - not as
promised, not narrowed to one case when a general fix was asked for, not
hedged with an admission that it doesn't really solve the problem - and
blocks the turn from ending until it does.

See README.md in this directory for the design rationale, cost/latency
tradeoffs, and known limitations. Do not skip that file before editing this
one - several details here (the recursion guard in particular) are not
optional.
"""
import json
import os
import re
import subprocess
import sys

# Recursion guard: this script spawns a nested `claude -p` process to run the
# judge. That nested process goes through the same Stop lifecycle and, if any
# active settings scope (project/user) has this same hook wired up, would
# spawn ANOTHER judge on ITS OWN Stop event, and so on. The guard env var is
# set only on the subprocess we spawn, so any Stop hook firing inside that
# subprocess sees it and returns immediately.
_RECURSION_GUARD_ENV = "STOP_COMPLETENESS_GATE_JUDGE_RUN"

# Session isolation: the calling process's environment carries Claude Code's
# own session identity (CLAUDE_CODE_SESSION_ID and friends). Left in place,
# a spawned `claude -p` judge attaches to THIS session instead of starting a
# fresh, isolated one - verified directly: an unstripped call reported the
# same session_id as the live interactive session, and its answer was
# contaminated with unrelated content from elsewhere in that session. These
# must be stripped from the judge subprocess's environment on every call.
_SESSION_ISOLATION_STRIP_VARS = [
    "CLAUDE_CODE_SESSION_ID",
    "CLAUDE_CODE_CHILD_SESSION",
    "CLAUDE_CODE_REMOTE_SESSION_ID",
    "CLAUDE_SESSION_INGRESS_TOKEN_FILE",
    "CLAUDE_CODE_MESSAGING_SOCKET",
    "CLAUDE_CODE_MESSAGING_TOKEN",
    "CLAUDE_CODE_SYNC_SESSION_REFS",
    "SESSION_INGRESS_URL",
]

DEFAULT_MODEL = os.environ.get("STOP_GATE_MODEL", "claude-sonnet-5")
MAX_BUDGET_USD = os.environ.get("STOP_GATE_MAX_BUDGET_USD", "0.50")
TIMEOUT_SECONDS = int(os.environ.get("STOP_GATE_TIMEOUT_SECONDS", "45"))

JUDGE_INSTRUCTIONS = """You are a strict completeness auditor for an AI coding assistant's turn.
You are given the user's most recent request and the assistant's final
response for that same turn. Decide whether the response actually satisfies
what was asked, IN FULL, AS DELIVERED - not as promised, not as planned.

Answer "incomplete" (a failure) if ANY of these hold:
1. The response describes, proposes, or explains a fix or solution while also
   stating or implying that it does not fully solve, only partially solves,
   or does not really address the problem the user described.
2. The user asked for something general, systemic, or root-cause ("stop this
   from happening in general", "so I don't hit X every time", "fix this
   properly", "make sure this never happens again"), and the response instead
   delivers something scoped to one narrow instance, one specific case, or
   one example, without covering the general case that was actually asked for.
3. The response offers options, asks the user to pick one, or defers the
   actual work ("I could do X or Y", "let me know if you'd like me to...",
   "want me to go ahead and...") when the user's request was a direct
   instruction to just do the work.
4. The response describes what it WOULD build or do, or presents a plan, when
   the user asked for the deliverable itself, now, and the deliverable does
   not actually exist yet (no file written, no hook created, no command run).
5. The response hedges or caveats its own solution in a way that leaves the
   stated problem still unsolved, while presenting the message as if the task
   is done.

Answer "complete" if the response fully and concretely delivers what was
asked with no admitted gap, OR if the response is a truthful, non-hedged
progress update on work that is still genuinely in progress (not being
abandoned, and not offered as if it were the finished answer).

A clarifying question can qualify as "complete" ONLY if proceeding without
it would require guessing at something irreversible, destructive, or
genuinely unknowable to the assistant (a real fact only the user has, or a
choice with consequences the assistant cannot safely pick for them) - AND
the assistant has already done every part of the work that does not depend
on the answer. A question asked instead of available work, asked for
convenience, asked to avoid a judgment call the assistant is equipped to
make, or paired with a narrow/hedged partial fix is NOT complete - it is the
same punt this gate exists to catch, just phrased as a question. Default to
"incomplete" whenever a question is doing the work of an excuse.

Be strict. An agent padding a weak or partial deliverable with confident or
reassuring language is still "incomplete" - judge only whether the substance
matches the ask, never the tone. An agent asking a question it did not need
to ask is still "incomplete" for the same reason.

Reply with ONLY a single JSON object, no markdown fences, no other text:
{"complete": true or false, "reason": "one or two sentences, specific to this exchange, naming exactly what is missing, narrowed, or hedged if incomplete"}
"""


def _emit(payload):
    print(json.dumps(payload))
    sys.exit(0)


def allow():
    sys.exit(0)


def block(reason):
    _emit({"decision": "block", "reason": reason})


def degraded(detail):
    block(
        "STOP-COMPLETENESS GATE: could not obtain a verdict from the "
        f"completeness judge ({detail}). Before ending this turn: re-read "
        "the user's original request above against your own response and "
        "confirm, explicitly and in writing to yourself, that it is fully "
        "and concretely satisfied - not narrowed to a special case, not "
        "hedged, not deferred, not just described-but-undone. If it is not, "
        "fix it now instead of explaining why it falls short. If this "
        "message keeps recurring, the judge itself is broken - see "
        "hooks/stop-completeness-gate/README.md for how to diagnose it."
    )


def read_stdin_json():
    try:
        return json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return {}


def _extract_text(content):
    if isinstance(content, str):
        stripped = content.strip()
        return stripped or None
    if isinstance(content, list):
        parts = []
        for c in content:
            if isinstance(c, dict) and c.get("type") == "text":
                parts.append(c.get("text", ""))
        joined = "\n".join(p for p in parts if p).strip()
        return joined or None
    return None


def last_user_text(transcript_path):
    """Scan the transcript JSONL backward for the most recent real user
    message (skipping tool_result-only entries, which are also type
    "user"), and return its plain text."""
    if not transcript_path or not os.path.isfile(transcript_path):
        return None
    try:
        with open(transcript_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
    except OSError:
        return None
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if entry.get("type") != "user":
            continue
        message = entry.get("message") or {}
        text = _extract_text(message.get("content"))
        if text:
            return text
    return None


def build_prompt(user_text, assistant_text):
    return (
        JUDGE_INSTRUCTIONS
        + "\n--- USER'S REQUEST ---\n"
        + user_text.strip()
        + "\n--- ASSISTANT'S RESPONSE ---\n"
        + assistant_text.strip()
        + "\n--- END ---\n"
    )


def run_judge(user_text, assistant_text):
    prompt = build_prompt(user_text, assistant_text)
    env = os.environ.copy()
    for var in _SESSION_ISOLATION_STRIP_VARS:
        env.pop(var, None)
    env[_RECURSION_GUARD_ENV] = "1"
    try:
        proc = subprocess.run(
            [
                "claude", "-p", prompt,
                "--model", DEFAULT_MODEL,
                "--max-turns", "1",
                "--permission-mode", "dontAsk",
                "--allowedTools", "",
                "--max-budget-usd", MAX_BUDGET_USD,
            ],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
            env=env,
        )
    except subprocess.TimeoutExpired:
        return None, f"judge timed out after {TIMEOUT_SECONDS}s"
    except (FileNotFoundError, OSError) as exc:
        return None, f"judge invocation failed to start: {exc!r}"
    if proc.returncode != 0:
        return None, (
            f"judge process exited {proc.returncode}: "
            f"{proc.stderr.strip()[:300]!r}"
        )
    return proc.stdout, None


def parse_verdict(raw_output):
    if not raw_output:
        return None
    match = re.search(r"\{.*\}", raw_output, re.DOTALL)
    if not match:
        return None
    try:
        verdict = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    if "complete" not in verdict:
        return None
    return verdict


def main():
    if os.environ.get(_RECURSION_GUARD_ENV) == "1":
        # This is the judge's own nested `claude -p` process hitting its own
        # Stop event. Never spawn a judge for the judge.
        allow()

    data = read_stdin_json()

    assistant_text = (data.get("last_assistant_message") or "").strip()
    if not assistant_text:
        allow()  # nothing produced this turn - nothing to judge

    if data.get("background_tasks"):
        allow()  # paused on background work, not claiming to be "done"

    transcript_path = data.get("transcript_path")
    user_text = last_user_text(transcript_path)
    if not user_text:
        degraded(f"could not locate the user's request in transcript {transcript_path!r}")
        return

    raw_output, err = run_judge(user_text, assistant_text)
    if err:
        degraded(err)
        return

    verdict = parse_verdict(raw_output)
    if verdict is None:
        degraded(f"judge produced no parseable verdict (raw output: {raw_output[:300]!r})")
        return

    if verdict.get("complete") is True:
        allow()

    judge_reason = str(verdict.get("reason", "")).strip() or "(no reason given)"
    block(
        "STOP-COMPLETENESS GATE: this response does not satisfy the user's "
        "request.\n"
        f"Judge finding: {judge_reason}\n\n"
        "Do not explain why the fix is partial, narrow, or deferred, and do "
        "not respond with a question in place of the work - the judge has "
        "already ruled that a question is not an acceptable substitute here. "
        "Actually revise the approach so it resolves what was asked, in "
        "full, and only stop once it does."
    )


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        # An uncaught bug in the gate itself must not silently become a
        # no-op - that is the exact failure this gate exists to prevent.
        block(
            f"STOP-COMPLETENESS GATE crashed ({exc!r}). Before ending this "
            "turn, manually verify your response fully satisfies the user's "
            "original request with no hedging or narrowing, then report "
            "this crash so hooks/stop-completeness-gate/stop_completeness_gate.py "
            "gets fixed."
        )
