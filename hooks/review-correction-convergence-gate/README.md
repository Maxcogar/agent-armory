# review-correction-convergence-gate

A `Stop` + `PreToolUse` hook pair that detects a stalled review/correction
loop and makes another isolated patch mechanically impossible until a real
diagnosis is produced. Independent of `hooks/stop-completeness-gate/` and
`hooks/stop-instruction-adherence-gate/` — reads nothing from them, sets
no dependency on them, does not require them installed.

## Why this exists, and why it's built this way

This repo's own `skill-observations/log.md` documents the exact failure
this targets, from real past sessions, not theory:

- **Obs 16** — a fix batch reviewed only at the point of the edit cannot
  detect that it silently contradicts something it references or is
  referenced by. Round 3 of one documented session introduced 3
  regressions from round 2's fixes; round 4 introduced 6 more from round
  3's — all different findings each time, same failure to converge.
- **Obs 9 / 15** — findings that look independent often share one root;
  patching each instance leaves the root untouched, and a defect that
  reproduces along a boundary the spec already names is structural, not a
  quality problem no amount of further patching closes.
- **Obs 18 / 21** — across a session where the agent wrote and then
  violated its own anti-patching rules within minutes, the controls that
  survived were the *computed* ones: a mechanical non-convergence
  tripwire (findings not strictly decreasing for two consecutive
  post-fix rounds) overrode the agent's own proposal for a fifth patch
  batch. Explicit conclusion in that log: **"where compliance is
  computable, compute it; prose is a request."**

So detection here is arithmetic, never a fresh LLM opinion on "is this
fix good enough" — that specific class of control is the one this repo's
own history shows getting rationalized past. The only place an LLM is
used at all is grading the *content* of a forced statement after the
arithmetic has already decided to demand one — never to decide whether to
fire.

## What it measures, and the three signal sources

A "round" is the work between one real user message and the next. Each
round produces a count or a file-set, tried in this order:

1. **An active GitHub PR** (detected from a `pull_request`-shaped tool
   call in the transcript): unresolved review threads + failing checks,
   recounted fresh via `gh pr view --json reviewThreads,statusCheckRollup`
   if `gh` is on `PATH`. **Best-effort** — if `gh` isn't installed, this
   signal is skipped silently and the next one is tried. This environment
   (Claude Code Remote) does not have `gh` on `PATH` by design (it uses
   the GitHub MCP server instead), so this signal will not fire here; it's
   included for local/CI environments that do have `gh`.
2. **A `ReportFindings` tool call this round**: the length of its
   `findings` array.
3. **Plain conversation, no structured review tool**: the set of files
   touched by `Edit`/`Write`/`MultiEdit`/`NotebookEdit` since the last
   real user message. The trigger is the *same file(s) recurring* across
   consecutive rounds — not text similarity between corrections. A
   shallow fix can cause a *different* regression each round in the same
   file (Obs 16's literal documented case), so tracking the file, not the
   wording of the complaint, is what catches that shape too.

**Tripwire:** for count-mode signals (1/2), fires when the last two
round-over-round transitions both fail to strictly decrease (Obs 18's
exact condition — needs 3 recorded rounds). For file-mode (3), fires when
the same file appears in every one of the last `N` (default 3,
`CONVERGENCE_GATE_SAME_FILE_ROUNDS_THRESHOLD`) consecutive rounds.

## What happens when it fires

**Escalation level 1 (first stall on a given round_key):**
- `Stop` stops asking for "a better fix." It requires, before those files
  are touched again: (1) a statement of the actual shared mechanism
  behind what keeps recurring — not the symptom, the reason it keeps
  happening; (2) confirmation that every place referencing or referenced
  by the affected code was opened and checked for agreement, not just the
  edited lines.
- `PreToolUse` **denies** `Edit`/`Write`/`MultiEdit`/`NotebookEdit` on the
  implicated file(s) outright. This is the actual enforcement teeth: a
  `Stop` block alone only feeds text back as the next instruction, it
  can't stop the next tool call. Pairing it with a hard `PreToolUse` deny
  is what makes this a real block instead of a louder version of the
  request that Obs 21 shows gets rationalized past.
- The lock lifts only when a later `Stop` firing runs a narrow, separate
  judged check — not on whether to unlock at all, only on whether the
  *forced statement* actually names a specific mechanism and specific
  traversed files rather than being a vague placeholder ("I fixed it,
  should be good now" fails this; a statement naming the actual cache/
  invalidation mechanism and the specific files opened to check it
  passes — both were verified directly, see Testing).
- On a successful unlock, the round history for that round_key is reset
  to empty. Otherwise the very next edit to the same file, made
  immediately after being validated, would sit in a window that still
  contains the pre-escalation rounds and could re-fire instantly. What
  carries forward is only the fact that this round_key has escalated once.

**Escalation level 2 (a second stall on a round_key that already went
through level 1 and was unlocked):** total lockout on those files. The
`Stop` message stops asking for another diagnosis — the automated
remediation has already been given one validated attempt and it didn't
hold — and requires a plain written report to the user instead of a third
automated attempt. This state does not auto-clear; it's a deliberate
hand-off point, not a bigger version of the same automated loop.

## Recursion guard

The only LLM call this hook makes (the escalation-unlock content check)
is a nested `claude -p` process, same shape as the sibling gates. It
checks for **all three** guard flags on entry
(`CONVERGENCE_GATE_JUDGE_RUN`, `STOP_COMPLETENESS_GATE_JUDGE_RUN`,
`STOP_ADHERENCE_GATE_JUDGE_RUN`) and sets all three on any subprocess it
spawns, so none of the three hooks can trigger another's judge, in any
direction, without editing the sibling files.

## Fail-open, deliberately different from the sibling gates

`stop-completeness-gate` and `stop-instruction-adherence-gate` fail
**closed** on an internal error — their worst case is one extra per-turn
block that clears on the next turn. This hook fails **open** on an
uncaught exception. Its worst case if it failed closed would be a
persistent, cross-turn file lock that a bug in this script could leave in
place with no way to clear it. That's a strictly worse failure mode than
letting one turn through unchecked while the crash gets fixed, so the
`main()` wrapper here catches everything and exits 0, logging to stderr.

## Install

```bash
bash hooks/review-correction-convergence-gate/install.sh
```

Copies the script to `.claude/hooks/review-correction-convergence-gate/`,
adds both hook entries to `.claude/settings.json` (creating it if absent;
everything else in that file is left untouched), and adds
`.claude/hook-state/` to `.gitignore` if it isn't already there. See
`settings.snippet.json` for the raw entries.

### Tuning

| Variable | Default | Effect |
|---|---|---|
| `CONVERGENCE_GATE_MODEL` | `claude-sonnet-5` | Model for the unlock-content judge. |
| `CONVERGENCE_GATE_MAX_BUDGET_USD` | `0.50` | Spend cap per unlock-check call. |
| `CONVERGENCE_GATE_TIMEOUT_SECONDS` | `60` | Judge subprocess timeout. |
| `CONVERGENCE_GATE_SAME_FILE_ROUNDS_THRESHOLD` | `3` | Consecutive same-file rounds required to fire (file-mode signal only). |

## State

`.claude/hook-state/convergence-gate/` (gitignored):
- `rounds-<round_key>.json` — per round_key: `counts`/`file_rounds`
  history, `escalation_level`, `escalated_files`, `prior_escalations`.
- `locks.json` — flat map of `file_path -> {level, reason, round_key}`,
  the single source of truth `PreToolUse` reads and the unlock loop in
  `Stop` uses to find every currently-escalated round_key regardless of
  what the current round touched.

## Testing performed

All run directly against the script with real stdin, including real
`claude -p` calls for the judged parts — not just the mechanical branches:

- No `last_assistant_message`, `background_tasks` present, `PreToolUse`
  on a non-edit tool, `PreToolUse` on an unlocked file — all allow
  correctly.
- Three consecutive rounds touching the same file in a fresh isolated git
  repo → tripwire fires exactly on round 3, `escalation_level` set to 1,
  `locks.json` written.
- `PreToolUse` on the locked file → denied with the level-1 message;
  `PreToolUse` on a different file → allowed.
- **A real bug found by this testing, then fixed**: a round that
  correctly investigates without editing the locked file (`Read` instead
  of `Edit`) produced no file-touch signal for that round, and the
  original implementation hit an early `allow()` before ever checking
  whether escalation should be evaluated — meaning a valid unlock
  statement on a read-only round would never have been graded, and the
  lock would never have lifted. Fixed by making the unlock check run off
  `locks.json` directly (every round_key currently at level 1), not off
  what the current round happened to touch. Re-verified: the same
  read-only round now correctly re-evaluates the lock.
- A vague statement ("I fixed it, should be good now.") on a read-only
  round → real judge call → correctly stays locked, block message
  reissued.
- A substantive statement naming the actual mechanism (a module-level
  config cache never invalidated) and specific traversed files → real
  judge call → correctly unlocks; round history for that round_key reset
  to empty; `prior_escalations` incremented to 1.
- `PreToolUse` on the now-unlocked file → allowed.
- Three more consecutive rounds touching the same file after that unlock
  → tripwire fires again → correctly skips level 1 and escalates directly
  to level 2 (`prior_escalations` was already 1), with the level-2
  message; `PreToolUse` on that file now denies with the level-2 lockout
  message.

Not tested: the PR-based signal (requires `gh`, not present in this
environment — the code path that skips it when absent was exercised
implicitly by every test above, since none of them had `gh` available);
firing through an actual live `Stop`/`PreToolUse` event inside an
interactive session (only direct script invocation was tested); Windows;
a `ReportFindings`-driven round.

## Known limitations, stated plainly

- File-mode keying is per exact file path. A recurring defect that moves
  between files with no path in common (e.g., the same bug pattern
  duplicated in two unrelated files) will not be caught by this signal;
  only the PR/`ReportFindings` count-based signals, which look at
  aggregate totals rather than specific paths, would have a chance at
  that shape.
- The unlock judge grades one statement in isolation. It can be
  convinced by a well-written but ultimately wrong root-cause claim; it
  is a check against *vacuous* statements, not a guarantee the claimed
  mechanism is correct.
- Escalation level 2 has no automatic path back to level 0. That's
  deliberate — a second stall after a validated diagnosis means the
  automated loop should stop, not retry a third time — but it does mean a
  human (or a deliberate `rm` of the relevant state files) is required to
  resume automated edits to that file.

## A separate finding surfaced while building this, not folded into it

While diagnosing why "review and correction rounds" felt unpredictable in
this session, the actual raw judge-subprocess transcripts for
`stop-completeness-gate` and `stop-instruction-adherence-gate` (not a
summary — the literal transcript files under
`/root/.claude/projects/-home-user-agent-armory/`) showed the same turn
shape (a design proposal ending in a confirmation checkpoint question)
receiving opposite verdicts from the same gate within minutes of each
other: one firing ruled it `"complete": true, ... "a legitimate
design-review checkpoint"`, a later firing on the same shape ruled it
`"complete": false, ... "not the delivered fix"`. That's the judge being
non-deterministic on one recurring, specific fact pattern, not a code
defect this hook can fix — the fix for it would be making that specific
criterion mechanical inside the two sibling gates themselves, which is
out of scope here since those files were explicitly not to be touched for
this task. Recorded here as a finding, not acted on.
