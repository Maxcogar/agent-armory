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

## Where the project stands (2026-09-29)

**Nothing built on this branch is trusted yet.** Max Cogar set the method:
1. audit every change on the branch since its base `de66831`, along the
   timeline;
2. correct the documents once, by root cause, with independent review;
3. then rebuild the code.

**Step 1 is complete.**
- Scope: all 1,342 changes from commits 1–70, judged in nine batches. Each batch
  had a first audit, a second opinion, an adjudication and a coordinator
  verification.
- Result: of 505 entries, 143 stand as they are, 361 must be replaced and 1 is
  removed.
- Records: `docs/reviews/2026-09-26-branch-audit-B1-verification.md` …
  `B9-verification.md`, with each batch's audit files beside them.
- Also recorded: the coordinator rulings and hook tests of 2026-09-28,
  `docs/reviews/2026-09-28-branch-audit-*`.

**The whole spec was audited too (2026-09-29).**
- What: all 1,142 lines, split into 269 units.
- How: each part had a first audit, a second opinion and an adjudication,
  verified by the coordinator.
- Result: 146 lines stand, 106 need changing, 2 are removed and 8 cannot be
  settled until Max Cogar answers or a measurement is made.
- Record: `docs/reviews/2026-09-29-spec-audit-verification.md`, which also
  records two errors (one the coordinator's own) and reconciles the three parts.

**Step 2, the corrections, has not started.** The spec, architecture, plan and
code are as they stood when the branch audit finished (`c00819e`).

**A post-audit correction attempt was removed.**
- Commits `630d4b5` … `2c201a0` held a correction register, gap settlements, an
  architecture correction, ten review rounds, and prototype evidence.
- It was removed because it made the architecture worse. The coordinator told
  agents to answer requirements with narrowed claims, stated limitations and
  exclusions instead of correct designs, under a "remove before you add" design
  rule that is not Max Cogar's. It also applied findings because a rule said
  to, not on their merits.
- It stays in git history only, and none of it is used.

**Hooks in this repository.** Both Stop gates (`hooks/stop-completeness-gate/`,
`hooks/stop-instruction-adherence-gate/`) are running. Their judge runs with the
session's identity variables removed (commit `1b8b47a`). The correction-loop
judge stays off (`CORRECTION_LOOP_JUDGE_RUN=1` in `.claude/settings.local.json`),
as Max Cogar asked.

## What to do next

1. **Wait for Max Cogar's answers** to the questions below. Nothing moves until
   then.
2. **Correct the spec**, with his sign-off on every changed line:
   - the spec audit's 106 replacements and 2 removals, as the adjudications and
     the verification's reconciliation write them;
   - the lines his answers settle.
3. **Then correct the architecture, then the plan, once each**, from the branch
   audit verifications and the corrected spec:
   - fix each defect at its root cause with a correct design;
   - never answer a requirement with a narrowed claim, a stated limitation, a
     fallback or an exclusion;
   - judge every review finding on its merits, never apply one because a rule
     says to.
4. **Then rebuild the code.**

## Questions for Max Cogar (plain language)

The spec audit's questions, with their evidence, are in
`docs/reviews/2026-09-29-spec-audit-verification.md`.

1. Will you check the oracle's warnings yourself (for example, with
   `ctxoracle correct`), or should agents do all the checking?
2. The automatic check for skipped skill steps: is that what you meant by
   "JUST A SMALL FEATURE", or should it be smaller?
3. Should the skill block also fire when "STEERING ISNT WORKING", as you said?
   The spec dropped that.
4. "A more deterministic trigger" for spotting a skill: decided only from what
   the agent does, or also allowed to use a model limited to the skill's steps?
5. "Sandbox compatibility is required": your own computer, Claude Code cloud
   sessions, a computer with no internet — which of these?
6. The oracle's memory is lost when a cloud session ends. Is that acceptable, or
   should it be kept somewhere that survives?
7. Should the oracle's test run use your own projects and your Claude Code
   conversation records?
8. Skill steps done only "in the agent's head" can't be checked. Accept that, or
   change your skills so those steps leave a trace?
9. One spec line puts an agent's words in your name. May it be replaced with
   your own recorded words?
10. The repo-wide `CLAUDE.md`, outside this project, still says to apply *all*
    review findings. Change it to match what you decided?
11. Sign-off on the edit-warning wording: the warning arrives with the edit's
    result, and it survives a failed tool call (Claude Code changelog 2.1.110).

## Open items

- **Sandbox premise — still open:** whether `unshare -rn` works on the GitHub
  Actions runner image.
- **L11(a) and L11(b):** the two transcript and hook-contract premises the plan
  resolves in the exit run.
