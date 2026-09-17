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

**The Phase A implementation plan (`docs/plans/plan-phase-a.md`) has had every
known review finding addressed and every mechanical gate green, but has NOT yet
had a clean independent confirming pass — so it is one confirming review away
from being the build contract.** Trajectory of the one seam that has driven the
recent rounds — the co-change miner's handling of paths git C-quotes in
`--numstat` (backslash / double-quote / tab / control-byte filenames):

- **Round 6 — S1 (Serious, fixed).** Step 13 read `--numstat` path fields
  verbatim, but `core.quotePath` defaults on, so non-ASCII paths (`café.txt`)
  were C-quoted and silently mis-keyed against the indexer's raw-UTF-8 `readdir`
  key. Fixed by running the miner under `core.quotePath=false`.
- **Round 7 — M1 + T1 (fixed).** The residual-quote branch shipped untested; a
  Step 13 prose-order nit.
- **Round 8 — M1, m1, T1, T2 (all now addressed).** Two independent reviews
  (`docs/reviews/2026-09-17-round-8-expert-review.md` and `…-collapse-hunt.md`)
  fired the non-convergence tripwire and demanded the seam be re-derived as **one
  uniform rule** covering every C-quoted shape (a plain path field *and* each
  split rename identity). Findings and how each was closed:
  - **M1 / T1** — T-13-1's "a rename's old or new identity is missing" clause
    contradicted the residual-quote skip. **Closed** by the root fix (commit
    `5bac567`): the miner now **C-unquotes (decodes)** any token beginning with
    `"` back to its raw `readdir` key, so there is no skip clause to contradict.
    Grounded by new executed `probe:28_git_numstat_cunquote` (the C-unquote
    round-trip equals the on-disk `readdir` keys, `invertible: true`).
  - **m1** — T-13-1 planted only the *rename-identity* C-quoted shape. **Closed**
    (commit `cf2d63e`): now also plants a **plain-added** backslash file
    (`u\v.txt`, field `"u\\v.txt"`), so both shapes exercise the uniform rule.
  - **T2** — the fixture's rename-door discrimination silently depended on the
    renames being `git mv` from plain-named sources. **Closed** (`cf2d63e`): the
    Data states it.

Mechanical gates on the current revision (`cf2d63e`): `derive-plan-sections.mjs
--check` (40 steps, 124 test specs, **28 probes cited**, regions current),
`--self-check` (34 checks), `run-plan-probes.mjs` (all 28 probes, incl.
`28_git_numstat_cunquote`), `tools/check_docs.py`. **CI is green** on PR
[#89](https://github.com/Maxcogar/agent-armory/pull/89).

**One open judgment call to flag for the confirming review.** Both round-8
reviews recommended resolving the seam as a uniform **skip** (record every
C-quoted path as `miner_unparsed_numstat`, contributing no pair). The fix instead
resolves it as a uniform **decode** (C-unquote every C-quoted token back to its
raw path). Both eliminate the contradiction and populate both partitions; decode
additionally keeps the co-change substrate complete (no dropped files) at the
cost of a small, deterministic, executed-invertible C-unquote step. This is an
author design choice (OL-11) that diverges from the reviewers' recommendation and
should be the first thing a fresh independent pass evaluates.

## Session note — enforcement hooks disabled by owner (2026-09-17)

The two repo-root Stop-hook gates (`hooks/stop-completeness-gate/`,
`hooks/stop-instruction-adherence-gate/`) and the context-oracle correction-loop
hooks were **disabled at Max Cogar's explicit request** (commit `9b29353`:
gate scripts short-circuit to `exit 0`; `.claude/settings.local.json` sets
`CORRECTION_LOOP_JUDGE_RUN=1` so the loop's judge/guard/serve stand down). Reason:
all three judges' nested `claude -p` subprocess hung/timed out for hours
(confirmed environmental — disk, proxy, API all healthy; a trivial `claude -p`
timed out with MCP off and stdin closed), failing **closed** by design and
blocking every turn-end. The correction loop's own guard had also locked the
round-8 findings and the settings files while its issue was "active," and the
loop could not advance because its judge could not run. This is the same
session-isolation class of bug already tracked in Open Items below (PR #82). The
disable is a deliberate, owner-authorized operational unblock, not a weakening of
review rigor — the independent-review discipline still applies; it is just no
longer auto-enforced by a broken judge.

## What to do next

**Owner's choice (pending):**
1. **One confirming independent review of the current plan (`cf2d63e`)** — a
   single fresh pass (dispatched neutrally per
   `.claude/skills/expert-implement/references/review-handoff.md`). If it returns
   zero findings, the seam is provably converged and the plan is the build
   contract; if it flags the decode-vs-skip choice, settle that one item and
   build. This is the rigorous close, one pass — not the auto-loop the hooks were
   forcing.
2. **Proceed to build** — treat the plan as the contract and run
   `/expert-implement` against it, Step 1 first (its first act — `npm ci` on the
   committed lockfile, then a file importing `web-tree-sitter` compiling and
   loading a grammar — re-executes the probes that would catch a non-functional
   pin).

The author-gates Gate A/B/C walk on the round-8 fixes was not separately written
this session (the loop that used to require it is disabled); the fixes' coherence
is instead carried by the green mechanical gates and this STATUS. The NFC/NFD
question the earlier author-gates walks flagged remains dispositioned out of scope
for Phase A's Linux target (confirmed by round 7's independent execution).

## Open items

- **The round-3 tentative items, carried forward and still not fully verified on
  the target surface.** Behaviour at the Node 22.16.0 engines floor is executed
  only by CI's matrix entry and the pin runs (`npx node@22.16.0`). Whether
  `unshare -rn` works on the GitHub Actions runner image is still open — the
  optional `09_unshare_no_network.optional` probe is evidence for this container,
  not for the GHA runner. Both settle the first time the build's CI runs.
- **L11(a)** — human-marker presence is measured on interactive transcripts; the
  plan reports it *verified* only when an owner-local interactive transcript is in
  the exit corpus, otherwise *not observed*.
- **L11(b)** — whether `UserPromptSubmit` fires for platform-injected turns is
  undocumented; the plan resolves it by live induction inside the exit run's
  closed-loop leg. Design-safe either way per `AD-9`'s voiding guard.
- **Two real bugs in this repo's own Stop hooks (`hooks/stop-completeness-gate/`,
  `hooks/stop-instruction-adherence-gate/`), outside Context Oracle's scope,
  recorded here once per Max Cogar's explicit instruction.** Both gates spawn
  their judge subprocess (`claude -p`) with `os.environ.copy()` without stripping
  Claude Code's session-identity variables, so the judge attaches to the live
  session and hangs/dies empty; the gates then fail closed. The fix is
  `Maxcogar/agent-armory` PR #82 ("Fix session isolation and transcript pollution
  in both Stop-hook gates"). This session hit exactly that failure for hours (see
  the session note above), which is why the owner disabled the gates. This is not
  a standing practice — future unrelated findings do not belong in this file.
