# stop-instruction-adherence-gate

A Claude Code `Stop` hook that blocks the end of a turn for as long as the
agent is violating anything the user has explicitly stated for the task —
narrowing scope without permission, quietly doing something other than what
was asked, refusing an instruction, giving up, repeating something already
denied, or re-asking something already answered. Separate from, and does
not modify, `hooks/stop-completeness-gate/` — that hook checks the response
against *this turn's* request; this one checks it against *everything the
user has said for the task* and the project's own standing instructions.

## Why this exists, and why it's separate from stop-completeness-gate

The completeness gate catches a response that doesn't satisfy the request
that started the current turn. It does not see whether the agent is
repeating a proposal already rejected three turns ago, ignoring a standing
project rule, or unilaterally narrowing something it was told to build in
full. Those require the *whole* conversation, not just the latest exchange,
plus the project's own instruction files. That's a different, larger input
shape and a different judge prompt, so it's a separate hook rather than a
new branch bolted onto the other one's script.

## What it catches

Every firing, the judge is given the project's standing instructions
(CLAUDE.md / AGENTS.md), every real user and assistant message in the
conversation so far (not just the latest one), this turn's actual tool
calls, and this turn's final response — and is instructed to rule the turn
`violating` if any of these hold:

1. Narrowing what was asked without permission.
2. Deciding to fix/address something different from what was actually
   asked.
3. Changing the scope of the task on its own initiative.
4. Assuming or rationalizing that the user wants something other than what
   they explicitly stated.
5. Refusing to listen to or follow an explicit instruction.
6. Quitting/giving up instead of completing the task (including presenting
   a partial or hedged result as finished).
7. Pattern-matching a familiar-looking response instead of doing the actual
   job asked.
8. Inventing or claiming the user said/asked for something they didn't.
9. Delivering an incomplete fix.
10. Proposing something already explicitly denied earlier in the
    conversation.
11. Asking a question already explicitly answered earlier in the
    conversation.

The judge is required to name the specific category and quote or closely
paraphrase the exact user statement being violated — a generic "this seems
incomplete" finding is not acceptable output.

**No frequency or category gating.** This runs on every real turn, full
stop — there is no "only for corrections," "only when files change," or
similar filter. Two earlier design attempts tried to filter which turns get
checked to reduce cost; both were rejected during review specifically
because any such filter is itself a way to silently narrow what gets
caught, which is one of the violations this hook exists to catch. The only
turns it skips are the two structurally-empty cases also used in
stop-completeness-gate: no final response produced yet, or the agent is
paused on background work rather than claiming to be done. Neither of those
excludes any content — there is nothing to read in either case.

## How it works

1. `Stop` fires. The script reads the full transcript JSONL
   (`transcript_path`) and extracts every real user and assistant text
   message, in order (skipping `tool_result`-only entries), as "the
   conversation so far for this task."
2. It separately builds an action log of this turn's actual tool calls
   (from the last real user message forward), so the judge can check
   actions, not just prose — a silently dropped requirement shows up here
   even if the closing message never admits it.
3. It reads `CLAUDE.md` and `AGENTS.md` fresh from the repo root (found via
   `git rev-parse --show-toplevel` from the hook's `cwd`) on every single
   firing — never cached, so an instruction change takes effect on the next
   turn, not the next session.
4. All four pieces (instructions, conversation history, this-turn action
   log, this-turn response) go to a fresh headless `claude -p` judge, asked
   to return strictly `{"violating": bool, "reason": "..."}`.
5. `violating: true` → `{"decision":"block","reason":...}`, which makes
   `Stop` **not stop**; the judge's finding becomes the next instruction.
6. `violating: false` → exits 0 with no output, which allows the turn to
   end.
7. Long conversations are truncated to keep the judge prompt bounded
   (`STOP_ADHERENCE_GATE_MAX_HISTORY_CHARS`, default 40000 chars), keeping
   the first ~40% and the last ~60% with a marker in between — the original
   ask and the most recent exchanges matter most for this judgment.
8. Anything short of a clean verdict — transcript unreadable, no
   extractable text, the judge subprocess failing/timing out, unparseable
   judge output, an unhandled exception in this script — fails **closed**:
   one block with a diagnostic naming exactly what broke, never a silent
   pass-through.

## Recursion guard (shared with stop-completeness-gate)

The judge is a nested `claude -p` process and goes through its own `Stop`
lifecycle. If both this hook and `stop-completeness-gate` are registered at
a settings scope that nested process inherits, each one's judge would
otherwise trigger the *other* hook (and, without a guard, itself) on that
nested `Stop` event — recursively. This script checks for **either**
`STOP_ADHERENCE_GATE_JUDGE_RUN` (its own flag) **or**
`STOP_COMPLETENESS_GATE_JUDGE_RUN` (the sibling's flag, from
`stop-completeness-gate/stop_completeness_gate.py`) on entry, and sets
**both** on any judge subprocess it spawns. This suppresses both hooks'
judges from spawning further judges, in both directions, without editing
the sibling's file.

## Install

```bash
bash hooks/stop-instruction-adherence-gate/install.sh
```

Run from inside the target repo. Copies the script to
`.claude/hooks/stop-instruction-adherence-gate/` there and adds the `Stop`
hook entry to `.claude/settings.json` (creating it if absent; every other
setting/hook is left untouched). See `settings.snippet.json` for the raw
entry if you'd rather wire it in by hand. Requires `python3`, `git`, and the
`claude` CLI on `PATH`.

### Tuning

| Variable | Default | Effect |
|---|---|---|
| `STOP_ADHERENCE_GATE_MODEL` | `claude-sonnet-5` | Judge model. |
| `STOP_ADHERENCE_GATE_MAX_BUDGET_USD` | `0.50` | Hard spend cap per judge call. |
| `STOP_ADHERENCE_GATE_TIMEOUT_SECONDS` | `60` | Judge subprocess timeout. |
| `STOP_ADHERENCE_GATE_MAX_HISTORY_CHARS` | `40000` | Conversation-history cap fed to the judge. |
| `STOP_ADHERENCE_GATE_MAX_INSTRUCTIONS_CHARS` | `20000` | CLAUDE.md/AGENTS.md cap. |
| `STOP_ADHERENCE_GATE_MAX_ACTION_LOG_CHARS` | `6000` | This-turn action-log cap. |

## Cost and latency, stated plainly

This runs on **every** `Stop`, with a larger prompt than
stop-completeness-gate (full conversation history plus project
instructions, not just one exchange) — meaning higher per-call latency and
cost, deliberately, because any cheaper filter that skips turns was
rejected as a coverage gap during review. If both this hook and
stop-completeness-gate are installed together, every turn now costs two
judge calls, and Claude Code's own 8-consecutive-Stop-block force-end is
shared across both hooks combined, not 8 each — running both roughly halves
the effective retries before that platform ceiling hits, compared to
running one. This is a direct, known consequence of keeping the two hooks
separate rather than merged, not an oversight.

## What this cannot do

Same hard platform ceiling as stop-completeness-gate: Claude Code force-ends
a turn after 8 consecutive Stop-blocks, shared across every Stop hook
registered, and no hook script can read, raise, or disable that number. This
script never manufactures an earlier giving-up point of its own — every
firing gets a real judge call, or a fail-closed diagnostic naming exactly
what broke, never an invented lower ceiling and never a silent pass.

## Testing performed

- No `last_assistant_message`, `background_tasks` present, unreadable
  transcript, own recursion-guard flag set, and the sibling gate's
  recursion-guard flag set — all verified directly against sample stdin,
  each producing the correct branch (see the script for exact behavior).
- Full pipeline, real `claude -p` call, run against **this actual session's
  real transcript** (not a fabricated one) at the exact point where an
  earlier turn proposed narrowing the trigger condition to
  "correction-type work only" after already being told not to narrow it —
  the judge correctly returned `violating: true`, correctly identified it
  as repeating an already-denied narrowed plan instead of the demanded
  deliverable, and quoted the actual prior denial from the transcript.

- True-negative check: this session's own transcript did not offer an
  uncontested clean final turn to isolate (every candidate either fell
  inside the still-open task or was later confirmed as a real violation by
  the sibling hook), so this case was run against a constructed transcript
  instead — a user instruction with no ambiguity (rename a function, update
  every call site, run the tests), an action log that does exactly that and
  nothing else, and a final response that accurately reports it. The judge
  correctly returned `violating: false` (silent allow, no false positive).

Not tested: firing through an actual live `Stop` event inside an
interactive session (only direct script invocation was tested), and
Windows.
