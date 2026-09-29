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

**Step 2 has not started.** The spec, the architecture, the plan and the code
are as they stood when the audit finished (`c00819e`).

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

1. **Correct the documents once, from the audit verifications** (the defect and
   correction lists in each `…-B<n>-verification.md`):
   - fix each defect at its root cause with a correct design;
   - never answer a requirement with a narrowed claim, a stated limitation, a
     fallback or an exclusion;
   - judge every review finding on its merits against the design and its
     sources, never apply one because a rule says to;
   - order: architecture, then the plan (with every plan step's dependencies
     checked together), then the spec items, which need Max Cogar's sign-off.
2. **Then rebuild the code from the corrected plan.**

## Questions for Max Cogar (plain language)

1. **Should the whole spec be audited, not just the parts this branch relied
   on?** The spec was signed off without being read line by line, and the audit
   found wrong spec lines (for example, when edit warnings arrive).
2. **The repo-wide `CLAUDE.md`** (at the repository root, outside this project)
   still says to apply *all* review findings, which you have said is wrong. It is
   outside the project, so it stays as it is unless you say to change it.
3. **Sign-off on the edit-warning wording in the spec.** In plain terms:
   - The warning arrives right after the edit runs, not before it.
   - If another hook blocks the edit, the warning still reaches the agent.
   - If a permission rule blocks an edit to a file, Claude Code rejects it before
     the oracle sees it.

   The evidence (Claude Code 2.1.283, tested) is
   `docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md`.

## Open items

- **Sandbox premise — still open:** whether `unshare -rn` works on the GitHub
  Actions runner image.
- **L11(a) and L11(b):** the two transcript and hook-contract premises the plan
  resolves in the exit run.
