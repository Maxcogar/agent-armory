# stop-completeness-gate

A Claude Code `Stop` hook that blocks the end of a turn when the response
punts instead of solving: narrow fixes presented as if they addressed a
general request, solutions that admit they don't really work, or questions
asked in place of available work. An LLM judge reads the actual request and
the actual response every time the agent tries to stop, and if the judge
finds a punt, the turn does not end — the judge's finding is fed back as the
next instruction and the agent keeps going.

## Why this exists

Prompted instructions to "not give up" or "solve it properly" get ignored
under context pressure — there is no mechanical consequence for ignoring
them. This hook is that consequence: it runs outside the model's control,
after every turn, and the turn cannot end on a punt.

## What it catches

Every firing, the judge is shown the user's request for the turn and the
agent's final response for that turn, and is instructed to rule the
response `incomplete` if:

1. It proposes/describes a fix while admitting the fix doesn't really solve,
   or only partially solves, the stated problem.
2. The user asked for something general or systemic and the response
   delivers something scoped to one instance or example instead.
3. It offers options or defers the work ("let me know if you want me to...")
   when the ask was a direct instruction to do the work.
4. It describes a plan or what it *would* do instead of the deliverable
   actually existing.
5. It hedges/caveats a solution while presenting the message as done.

A clarifying question only counts as a complete answer when proceeding
without it would mean guessing at something irreversible, destructive, or
genuinely unknowable to the assistant, and every part of the work that
doesn't depend on the answer has already been done. A question used to
avoid a judgment call the assistant could have made, or attached to a
narrow/hedged partial fix, is ruled `incomplete` — it is the same punt this
gate exists to catch, phrased as a question instead of an excuse. This was
the first version's own bug (see "History" below) — it's called out here so
it doesn't quietly regress.

## How it works

1. `Stop` fires when the main agent would end its turn. Its event JSON
   includes `last_assistant_message` (the final text of the turn) but not
   the user's request, so the script reads `transcript_path` (the
   conversation JSONL) backward to find the most recent real user message,
   skipping `tool_result` entries (which are also `type: "user"` in the
   transcript but aren't things a person typed).
2. It builds a judge prompt containing both texts and asks a fresh headless
   `claude -p` process (a separate Claude Code process, single turn, no
   tools) to answer strictly `{"complete": bool, "reason": "..."}`.
3. `complete: false` → prints `{"decision":"block","reason":...}` on stdout
   and exits 0. Per the `Stop` event's decision contract, this makes Claude
   **not stop**; `reason` becomes its next instruction.
4. `complete: true` → exits 0 with no output, which allows the turn to end.
5. No-op firings are skipped without spawning a judge: an empty
   `last_assistant_message` (nothing produced), or `background_tasks`
   present (the agent is pausing on background work, not claiming to be
   done).
6. Anything that isn't a clean verdict — transcript unreadable, the judge
   subprocess fails or times out, its output doesn't parse as the expected
   JSON, an unhandled exception in this script itself — fails **closed**:
   it blocks once with a diagnostic naming exactly what broke, and tells the
   agent to manually re-check its own response against the request before
   stopping. It does not silently allow the turn through just because the
   judge couldn't run. That would make the whole gate a no-op exactly when
   it's needed most.

## Recursion guard

The judge is itself a nested `claude -p` process. That process goes through
the same `Stop` lifecycle, and if the hook is registered at a settings scope
that process inherits (project or user settings), its own `Stop` event would
otherwise spawn *another* judge, which would spawn another, unbounded. The
script sets `STOP_COMPLETENESS_GATE_JUDGE_RUN=1` in the judge subprocess's
environment and checks for it first thing in `main()` — any `Stop` firing
inside the judge process returns immediately, no matter what settings scope
is active. This was verified directly (see Testing).

## Install

```bash
bash hooks/stop-completeness-gate/install.sh
```

Run from inside the target repo. Copies `stop_completeness_gate.py` to
`.claude/hooks/stop-completeness-gate/` there and adds the `Stop` hook entry
to `.claude/settings.json` (creating it if absent; every other setting and
hook in that file is left untouched). See `settings.snippet.json` for the
raw hook entry if you'd rather wire it in by hand.

Requires `python3` and the `claude` CLI on `PATH` in every environment this
hook will run in — both are dependencies of the *hook*, not of the repo it's
installed into.

### Tuning

Environment variables read at hook run time (set them before starting
Claude Code, e.g. in your shell profile or the settings file's process
environment):

| Variable | Default | Effect |
|---|---|---|
| `STOP_GATE_MODEL` | `claude-sonnet-5` | Judge model. This is a judgment call, not a mechanical check, so the default favors judgment quality over the lower cost of a smaller model. |
| `STOP_GATE_MAX_BUDGET_USD` | `0.50` | Hard spend cap passed to the judge's `claude -p` invocation. |
| `STOP_GATE_TIMEOUT_SECONDS` | `45` | Subprocess timeout for the judge call. |

## Cost and latency

This runs on **every** `Stop` — every turn, including this session's own,
once installed. Each real judgment is one extra headless Claude call (a few
seconds, plus whatever `STOP_GATE_MODEL` costs per call). No-op turns
(empty response, background-task pauses) skip the judge entirely and cost
nothing.

## What this cannot do

`Stop`'s own documented mechanics force-end the turn after **8 consecutive
blocks**, regardless of what any Stop hook returns — this is Claude Code's
own hard-coded circuit breaker, not a setting this hook can read, raise, or
disable. This script never gives up before that point on its own: every
firing gets a real judge call (or, if the judge itself is broken, a
fail-closed block naming exactly what's broken), never a silent pass and
never an invented lower ceiling. If a genuinely broken environment (no
`claude` CLI, no network) makes every judge call fail, the practical result
is 8 blocks — each showing the real reason it failed — followed by Claude
Code's own force-end, which is visible to you, not silent. There is no way
to distinguish, from inside a hook, "the agent still won't fix it" from "the
platform force-ended after 8" — both look the same from here. Reading 8
identical diagnostic blocks in a row is itself the signal something is
broken and needs a human.

## Testing performed

All run directly against the script with real stdin, from this directory's
parent (`/home/user/agent-armory`), during development:

- No `last_assistant_message` → allowed (exit 0, no output) without
  spawning a judge.
- `background_tasks` present → allowed without spawning a judge.
- Unreadable `transcript_path` → blocked with a diagnostic naming the
  missing path (fail-closed path).
- `STOP_COMPLETENESS_GATE_JUDGE_RUN=1` set in the environment → allowed
  immediately regardless of input (recursion guard).
- A fake transcript JSONL with a real user message, an assistant turn, and
  a `tool_result`-only `user`-typed entry → `last_user_text` correctly
  returned the real user message, not the tool result.
- Full pipeline, real `claude -p` call, response = a narrow one-message fix
  explicitly admitting it doesn't cover the general case and asking whether
  to expand it → judge correctly returned `complete: false` with a reason
  naming both the narrowing and the deferral.
- Full pipeline, real `claude -p` call, response = a general fix with a
  passing regression test and no hedging → judge correctly returned
  `complete: true` (silent allow).

**Live-fired, for real, during this hook's own development session** (not
staged): once wired into this repo's `.claude/settings.json`, it fired on
the actual `Stop` event of the session that built it — no manual stdin, no
simulated event, the real product pipeline. The turn it caught claimed the
gate was "verified end-to-end" while closing with "I'll keep watching PR
#80" in place of stating the actual state of the untested-live-fire gap.
The judge correctly named that exact pattern (asserting completeness while
admitting an unresolved gap and deflecting instead of closing it) and
blocked. That block is what produced this section of the README. This
supersedes the "not tested: firing through an actual live Stop event"
caveat that stood here before — it's no longer true, and this paragraph is
the evidence, not a promise.

Genuinely not tested: behavior on Windows; behavior when `claude -p` is
rate-limited or billing-blocked rather than absent (should hit the same
fail-closed diagnostic path via a non-zero exit code, but wasn't
exercised).

## History

The first version of this gate let a "clarifying question" count as
`complete` unconditionally, and told the agent in the block message that it
could "ask one specific question instead of delivering a partial fix." That
is a punt wearing the shape of diligence, and it was pointed out immediately
in review: a gate built to stop the agent from offering something while
explaining why it doesn't fix the problem must not itself offer an out for
doing exactly that. Fixed by narrowing the question-exemption to cases that
require genuinely irreversible/unknowable input with everything else
already done, and by removing the "ask a question instead" line from the
block message entirely — by the time that message fires, the judge has
already ruled a question out.
