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
STALE_REQUEST_TURN_THRESHOLD = int(os.environ.get("STOP_GATE_STALE_REQUEST_TURN_THRESHOLD", "3"))

# Verified bug, not theory: the raw judge-subprocess transcripts for this
# gate show the SAME turn shape (a concrete proposal ending in a
# confirmation-to-build question) getting opposite verdicts minutes apart -
# once "a legitimate design-review checkpoint", once "not the delivered
# fix". That is the judge being non-deterministic on one specific,
# recurring fact pattern: whether a user has explicitly required
# propose-then-confirm for the current task. That fact is mechanically
# checkable (it's either quoted in the transcript or it isn't), so it is
# detected here and handed to the judge as an explicit premise instead of
# being left for the judge to notice-or-not inside a large context window
# each time. This narrows, but does not remove, the judge's discretion:
# it still rules a vague, hedged, or narrower-than-asked proposal
# incomplete even when this directive is active.
_PROPOSE_BEFORE_BUILD_PATTERNS = [
    re.compile(r"propose[^.?!\n]{0,60}\bnot\b[^.?!\n]{0,40}\b(rush|jump|dive)?[^.?!\n]{0,20}\bbuild", re.I),
    re.compile(r"\bdon'?t\b[^.?!\n]{0,30}\brush\b[^.?!\n]{0,30}\bbuild", re.I),
    re.compile(r"propose[^.?!\n]{0,20}\bfirst\b", re.I),
    re.compile(r"\bnot\b[^.?!\n]{0,20}\bimmediately\b[^.?!\n]{0,20}\bbuild", re.I),
]

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

The USER'S REQUEST shown below may not be from this exact turn - in an
extended autonomous work session the user may not have spoken in a while,
in which case this is simply the most recent thing they actually said,
carried forward, and a small count of assistant turns elapsed since then is
given (a large count is filtered out before this prompt is ever built, so
what you see here is always recent enough to plausibly still apply). Judge
THIS turn's response on its own merits first: if it is legitimate, in-scope
follow-up work (continuing a task already agreed to, monitoring something
already set in motion, fixing a bug found along the way) and does not
contradict or ignore the shown request, that is "complete" - an old request
is not a standing veto over every unrelated thing that happens afterward,
and a complaint that was already acted on does not need to be relitigated
on every later turn. Only apply the shown request against an unrelated
later turn if the response actually contradicts it or is the same
unresolved issue recurring.

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


# Prefixes of "user"-typed transcript text that are NOT something a human
# typed, and must never be read as "the user's request":
#  - "Stop hook feedback:" - Claude Code re-injecting a blocking Stop hook's
#    own `reason` as the agent's next instruction. Left unfiltered, a block
#    whose reason quotes an earlier (possibly wrong) request becomes the new
#    "most recent user message" for the next firing, which quotes it again
#    in its own reason, forever - a self-sustaining loop with no human in it.
#    Verified directly in production: this happened for real.
#  - "You are a strict completeness auditor" / "...compliance auditor" -
#    this hook's own judge prompt (and the sibling adherence gate's), which
#    leaked into THIS transcript on every real firing before the session-
#    isolation fix below, because the judge subprocess shared this session's
#    ID. Found by direct inspection of the live transcript, not by theory.
#  - "<task-notification>" - an automated GitHub/background-task notice
#    relayed into context, not a statement from the user.
_NOT_A_REAL_USER_MESSAGE_PREFIXES = (
    "Stop hook feedback:",
    "You are a strict completeness auditor",
    "You are a strict compliance auditor",
    "<task-notification>",
    # One-off: a manual diagnostic `claude -p` command run directly via Bash
    # during this hook's own development (not through either hook script)
    # shared this session's ID and leaked its literal prompt text into this
    # transcript as a synthetic "user" entry. This exact string will not
    # recur - it is a historical artifact of one incident, not a pattern -
    # but it sits in this session's history and must not be read as a real
    # instruction if this hook ever scans back that far again.
    "List the files in the current directory using a tool call, then report what you found.",
)


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


def _read_transcript_entries(transcript_path):
    if not transcript_path or not os.path.isfile(transcript_path):
        return []
    try:
        with open(transcript_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
    except OSError:
        return []
    entries = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return entries


def last_user_text(transcript_path):
    """Scan the transcript JSONL backward for the most recent real user
    message: skips tool_result-only entries (also type "user"), and skips
    synthetic entries that aren't something a human typed (see
    _NOT_A_REAL_USER_MESSAGE_PREFIXES). Also returns how many real assistant
    text turns have happened since that message, so the judge can tell a
    fresh request from one that's been sitting for a while during a long
    autonomous stretch with no new human input - see the staleness note in
    JUDGE_INSTRUCTIONS. Returns (text, turns_since) or (None, 0)."""
    entries = _read_transcript_entries(transcript_path)
    for i in range(len(entries) - 1, -1, -1):
        entry = entries[i]
        if entry.get("type") != "user":
            continue
        message = entry.get("message") or {}
        text = _extract_text(message.get("content"))
        if not text or text.startswith(_NOT_A_REAL_USER_MESSAGE_PREFIXES):
            continue
        turns_since = 0
        for later in entries[i + 1:]:
            if later.get("type") != "assistant":
                continue
            later_text = _extract_text((later.get("message") or {}).get("content"))
            if later_text:
                turns_since += 1
        return text, turns_since
    return None, 0


def detect_propose_before_build_directive(transcript_path):
    """Mechanically check whether the user has, anywhere in this
    conversation, explicitly required a propose-then-confirm workflow for
    the active task. Returns the matched snippet (for quoting to the
    judge) or None. This is a deliberately narrow, literal check - it
    exists to remove one specific, verified source of judge
    non-determinism (see the comment above _PROPOSE_BEFORE_BUILD_PATTERNS),
    not to make general "was a question OK" calls."""
    entries = _read_transcript_entries(transcript_path)
    for entry in entries:
        if entry.get("type") != "user":
            continue
        message = entry.get("message") or {}
        text = _extract_text(message.get("content"))
        if not text or text.startswith(_NOT_A_REAL_USER_MESSAGE_PREFIXES):
            continue
        for pattern in _PROPOSE_BEFORE_BUILD_PATTERNS:
            match = pattern.search(text)
            if match:
                start = max(0, match.start() - 30)
                end = min(len(text), match.end() + 30)
                return text[start:end].strip()
    return None


def build_prompt(user_text, assistant_text, turns_since, propose_directive):
    staleness_note = (
        f"(This request is from {turns_since} assistant turn(s) ago - the "
        "user has not spoken since. See the staleness guidance above.)\n"
        if turns_since > 0 else ""
    )
    directive_note = (
        "\n--- STANDING PROCESS DIRECTIVE FOR THIS TASK (verified present in "
        "the conversation, not the assistant's claim) ---\n"
        f'The user has explicitly required, in their own words: "...{propose_directive}..."\n'
        "Given this, a concrete, substantive proposal that ends by checking "
        "in before building satisfies THIS task's process requirement - do "
        "not rule it incomplete merely because code has not been written "
        "yet or because it ends in a confirmation question. Still rule it "
        "incomplete if the proposal itself is vague, hedged, narrower than "
        "what was actually asked, or dodges something it could have "
        "answered outright.\n"
        if propose_directive else ""
    )
    return (
        JUDGE_INSTRUCTIONS
        + directive_note
        + "\n--- USER'S REQUEST ---\n"
        + staleness_note
        + user_text.strip()
        + "\n--- ASSISTANT'S RESPONSE ---\n"
        + assistant_text.strip()
        + "\n--- END ---\n"
    )


def run_judge(user_text, assistant_text, turns_since, propose_directive):
    prompt = build_prompt(user_text, assistant_text, turns_since, propose_directive)
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
    user_text, turns_since = last_user_text(transcript_path)
    if not user_text:
        degraded(f"could not locate the user's request in transcript {transcript_path!r}")
        return

    # STALE_REQUEST_TURN_THRESHOLD: telling the judge "this is N turns old,
    # weigh it accordingly" was tried first and was not reliable - verified
    # directly in production, this gate blocked a routine PR check-in turn
    # by applying a complaint from 64 assistant-turns earlier that had
    # already been resolved, despite that exact count being in the prompt.
    # Judging staleness is not actually a judgment call: past this many
    # completed turns with no new human input, there is no live request left
    # to check THIS turn's response against, so it's decided mechanically
    # here instead of trusted to the model.
    if turns_since >= STALE_REQUEST_TURN_THRESHOLD:
        allow()
        return

    propose_directive = detect_propose_before_build_directive(transcript_path)
    raw_output, err = run_judge(user_text, assistant_text, turns_since, propose_directive)
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
