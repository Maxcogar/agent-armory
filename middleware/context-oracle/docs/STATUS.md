# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, ideas in `docs/IDEAS.md`, and everything
attributed to Max Cogar in `OWNER-LEDGER.md`.*

## The Phase A goal (the north star — read this first)

Phase A is the **honest deterministic foundation, and the measurement of its own
floor.** It stands up the genuinely-deterministic core on Max's real repos — the
stores, the index, the miner, the model-free whisper genres, the deny plumbing,
the self-observability — runs cleanly with no incident, and tells Max the truth
about what that core does and does not do. The spec (§11.5) defines the Phase A
exit as a *measurement*, not a finished feature: it "exits by producing measured
whisper/block, false-fire, and regret data on a real repo — **including how
little the conservative recognizer catches** before Phase B." The deliverable is
honest capability plus honest measurement, with clean seams the later phases plug
into — **never fake completeness dressed to look like a working product.** Judge
every Phase A decision against this goal (`CLAUDE.md` dominating rule 3).

## Where the project stands

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`). The Phase
A architecture (`docs/architecture-phase-a.md`) is reviewed to convergence.

**The Phase A implementation plan (`docs/plans/plan-phase-a.md`) is in round 6 —
its final gate. The S1 fix (below) is applied and the author's Gate A/B/C
compliance walk is done (`docs/reviews/2026-09-17-author-gates-review.md`), but
the round is NOT closed: the independent post-fix review (round 7) must come back
clean on the current plan first. The plan is NOT yet the build contract.** Every
mechanical gate is green on the current revision: `derive-plan-sections.mjs
--check` (40 steps, 124 test specs, **27 probes cited**, regions current),
`--self-check` (34 checks), `run-plan-probes.mjs --repeat 3 --load 2` (all 27
probes, including probe 27), and `tools/check_docs.py`. The correction loop's
tracked record (`state/done.json`) holds rounds 5 and 6 — meaning the round-6
finding S1 was *processed* by the loop, which is not the same as the fix being
independently verified.

**What round 6 was and what it found (2026-09-16 → 17).** Two independent reviews
of the current plan by fresh subagents — an expert-review and a whole-document
collapse-hunt — each under the discipline that every pin, install, grammar load,
TypeScript compile, git command and race is *executed*, never taken from a
registry read, a documentation sentence, or a prior round's "verified" mark
(`docs/reviews/2026-09-16-round-6-expert-review.md`,
`docs/reviews/2026-09-16-round-6-collapse-hunt.md`):

1. **The two decisions STATUS had flagged as never independently attacked on
   their final text now have that attack, and both survived it.** D-plan-2 (the
   runtime pins): both reviewers installed the exact pins, reproduced the 32-of-36
   usable-grammar split — the expert-review by loading the grammars in a
   *different order* than the plan's own probe 20 — parsed realistic and
   pathological source through the 32 usable plus the 8 assertion-path grammars
   with no throw, confirmed `web-tree-sitter@0.26.13` loads 0 of 36 by a fresh
   install, and compiled the TypeScript import both directions. D-plan-32 (the
   reindex claim row): both ran the race (probe 26) — single winner 200/200 at
   baseline, under CPU load, and at the Node 22.16.0 floor. Neither could break
   either decision.
2. **The expert-review returned PASS, zero findings**, having re-run all three
   gates and audited every probe source against its claim.
3. **The collapse-hunt returned one Serious finding (S1), now fixed** through the
   hook-enforced correction loop (round 6 closed, `done.json` records S1). See the
   next paragraph.

**S1 — the co-change miner silently mis-keyed non-ASCII paths (fixed).** Step 13
ran `git log --no-merges --numstat -M …` and read the path field verbatim, but
git's `core.quotePath` defaults **on**, so any path holding a byte ≥ 0x80
(accented Latin, CJK, Cyrillic, emoji) is C-quoted (`café.txt` prints as
`"caf\303\251.txt"`). That quoted string contains no `{`, `}`, or ` => `, so it
slipped past the `miner_unparsed_numstat` guard and was stored in `cochange_pairs`
verbatim — never equal to the raw-UTF-8 path the structural indexer's `readdir`
walk and every genre lookup key on. History-genre co-change for any non-ASCII path
was silently lost, no fault raised: the "guessing" the miner forbids, and a biased
substrate for the Phase A floor the exit run feeds to Phase B. The fix, re-derived
from AD-13's record-never-guess hygiene discipline and AD-12's `readdir` keying
(not transcribed from the reviewer's prescription): Step 13 now runs
`git -c core.quotePath=false log …` so path fields arrive as raw UTF-8 that equals
the `readdir` key, and — because `core.quotePath=false` still C-quotes a path with
a literal `"`, `\`, tab, or newline — routes any field still beginning with `"`
to the existing `miner_unparsed_numstat` diagnostic, never guessed, the same
treatment the ambiguous rename shapes already get. The reviewer's `-z` alternative
was considered and rejected (the record framing already spends `%x00` on the
`--format` header and the parse is line-by-line). New `probe:27_git_numstat_quotepath`
makes the behavior re-runnable; `T-13-1` now plants a non-ASCII fixture path and
fails if any quoted/escaped field lands in `cochange_pairs`/`files`; §11.4 records
the executed evidence; Step 6's `miner_unparsed_numstat` description was broadened
to match.

## What to do next

**Finish round 6: process the independent post-fix review (round 7) of the S1
fix, then close only if it is clean on the current plan.** The author-gates walk
is done; the last step is the independent adversarial pass on the amended plan
(fresh subagents, never the author), written to
`docs/reviews/2026-09-17-round-7-collapse-hunt.md` and
`…-round-7-expert-review.md` so the correction loop serves any findings. The
author-gates walk named one thing for that pass to attack rather than wave
through: whether a Unicode NFC/NFD mismatch between git's bytes and the indexer's
`readdir` can still mis-key a path even under `core.quotePath=false` (on Linux —
Phase A's target — they match; cross-platform is the open question). When round 7
is clean, and only then, the plan is the build contract and the next step is
`/expert-implement` against it, Step 1 first (its first act — `npm ci` on the
committed lockfile, then a file importing `web-tree-sitter` compiling and loading
a grammar — re-executes the probes that would catch a non-functional pin).

## Open items

- **The round-3 tentative items, carried forward and still not fully verified on
  the target surface.** Behaviour at the Node 22.16.0 engines floor is executed
  only by CI's matrix entry and by the round-6 pin runs (`npx node@22.16.0` — the
  grammar inventory and `node:sqlite` identical there). Whether `unshare -rn`
  works on the GitHub Actions runner image is still open — round 6 ran the
  optional `09_unshare_no_network.optional` probe rather than skipping it *in this
  container*, which is evidence for the container, not for the GHA runner; the
  probe stays `.optional` for exactly that reason. Both are settled the first time
  the build's CI runs.
- **L11(a)** — human-marker presence is measured on interactive transcripts; the
  plan reports it *verified* only when an owner-local interactive transcript is in
  the exit corpus, otherwise *not observed*.
- **L11(b)** — whether `UserPromptSubmit` fires for platform-injected turns is
  undocumented; the plan resolves it by live induction inside the exit run's
  closed-loop leg. Design-safe either way per `AD-9`'s voiding guard.
- **Two real bugs in this repo's own Stop hooks (`hooks/stop-completeness-gate/`,
  `hooks/stop-instruction-adherence-gate/`), outside Context Oracle's scope,
  recorded here once per Max Cogar's explicit instruction so they get seen — and
  they actively fired during round 6:** both gates' judge subprocesses exited 1
  with empty output on 2026-09-17 and emitted spurious `could not obtain a verdict`
  blocks while the correction loop was doing legitimate work, which is the
  documented failure below, hit again.
  1. **Wrong JSON key from the judge.** `stop-instruction-adherence-gate`'s judge
     is instructed to reply `{"violating": bool, "reason": "..."}`; it has replied
     `{"complete": true, ...}` (the sibling hook's schema), so `parse_verdict()`
     (`hooks/stop-instruction-adherence-gate/stop_instruction_adherence_gate.py:351-363`)
     returns `None` and the hook fails closed on a clean verdict.
  2. **Session isolation / transcript pollution — the likely root cause.** Both
     hooks spawn their judge with `os.environ.copy()` without stripping Claude
     Code's session-identity variables, so a judge call can attach to the live
     session and read cross-contaminated content; a Stop-hook `reason` re-injected
     as a synthetic user turn is then read as "the user's request" by the next
     firing — self-sustaining. The fix is `Maxcogar/agent-armory` PR #82 ("Fix
     session isolation and transcript pollution in both Stop-hook gates").
  This is not a standing practice — future unrelated findings do not belong in
  this file.
