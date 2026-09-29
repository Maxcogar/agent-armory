# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, ideas in `docs/IDEAS.md`, and everything
attributed to Max Cogar in `OWNER-LEDGER.md`. The step-by-step build journal is
`docs/implementation-log.md`.*

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

**Nothing built on this branch is trusted yet.** Max Cogar stopped the
step-by-step patching cycle and set the method:
1. audit every change on the branch since its base `de66831`, along the timeline;
2. correct the documents once, by root cause, with independent review;
3. then rebuild the code.

**1. The audit is complete.**
- Scope: all 1,342 changes from commits 1–70 were judged in nine batches. Each
  batch had a first audit, a second opinion, an adjudication and a coordinator
  verification.
- Result: of 505 entries, 143 stand as they are, 361 must be replaced and 1 is
  removed.
- Records: the batch verifications are
  `docs/reviews/2026-09-26-branch-audit-B1-verification.md` …
  `B9-verification.md`.
- The pattern the audit found:
  - fixes marked "reviewed" that nobody reviewed (Steps 1–12, 13 and 14);
  - errors turned into silence or into "absent";
  - settled rulings never built;
  - crashes patched around instead of fixed. Lua was excluded, although its
    grammar has an uninitialised scanner; Swift has a similar defect and is
    still in the usable list.

**2. The correction pass is in progress.**
- The register: every correction, grouped by root cause and by the document it
  changes, is in `docs/reviews/2026-09-28-branch-audit-correction-register.md`
  (148 items).
- Its open design gaps were settled in
  `docs/reviews/2026-09-28-branch-audit-gap-settlements.md`, reviewed in
  `…-gap-settlements-review.md`.
- **The architecture has been corrected.** `docs/architecture-phase-a.md`
  carries every architecture item, and each changed decision cites its source.
  - Review rounds: nine so far, `docs/reviews/2026-09-28-architecture-*` and
    `2026-09-29-architecture-review-round6.md` … `round9.md`.
  - A collapse hunt cut ten mechanisms that existed only to answer earlier
    review findings.
  - The store-rebuild and recompute design is settled by execution, not prose.
    Prototypes and tests run against real stores that the historical builds
    wrote, in `docs/reviews/2026-09-28-rebuild-mapping-evidence/` and
    `2026-09-29-rebuild-mapping-evidence-r6/` … `-r9/`. At `-r9`: rebuild test
    1,571 passed, 0 failed; recompute test 315 passed, 0 failed; every planted
    mutant fails the test.
  - Review round 10 is under way.
  - **Exit rule used:** the architecture passes when no Critical or Serious
    finding is open and every smaller finding is written down. It is still
    waiting on Max Cogar (question 2 below).
- **Not yet corrected:** the plan (`docs/plans/plan-phase-a.md`, 51 register
  items), the spec (5 wording items, which need Max's sign-off), and the code.

**Owner-typed data is protected.** Max Cogar has run `init`, and the build's
`note`, `correct` and `tune` commands write real rows. Two old store layouts can
hold those rows:
- the `4dd0f00` / `4e070ce` layout, written from `59cc05c` on;
- the `b229c04` layout.

The architecture's rebuild copies those rows into the new store and leaves the
old file untouched. The old file is deleted only by
`deinit --purge --discard-human`. No tested path loses a typed row.

**Hooks in this repository.** Both Stop gates (`hooks/stop-completeness-gate/`,
`hooks/stop-instruction-adherence-gate/`) are running. Their judge runs with the
session's identity variables removed (commit `1b8b47a`). The correction-loop
judge stays off (`CORRECTION_LOOP_JUDGE_RUN=1` in `.claude/settings.local.json`),
as Max Cogar asked.

## What to do next

1. **Finish the architecture review.** Apply round 10's findings, prototyped and
   tested, then review again. Stop when the exit rule holds.
2. **Correct the plan once.** Apply the register's 51 plan items and every
   consequence of the corrected architecture. Check the dependencies across all
   40 plan steps at once, then run an independent review under the same exit
   rule.
3. **Correct the spec** — the five wording items R-1 … R-5, plus anything the
   plan correction raises — only after Max Cogar signs off the wording.
4. **Rebuild the code from the corrected plan.** The built Steps 1–15 are
   replaced where the corrections require it. The rebuild prototypes in the
   evidence directories show what the corrected behaviour must pass.
5. **Record Max Cogar's approvals in `OWNER-LEDGER.md`.** He said he approved the
   project's "apply every finding that holds up" rule "if the review change was
   done correctly".

## Questions for Max Cogar (plain language)

1. **Should the whole spec be audited, not just the parts this branch relied
   on?** The spec was signed off without being read line by line, and the audit
   has already found wrong spec lines (for example, when edit warnings arrive).
   Recommendation: yes.
2. **When should a review loop stop?** The one in use: stop when nothing Critical
   or Serious is left open, with every smaller finding written down. The
   alternative, "stop when a round finds nothing", never reliably ends, because
   a detailed document can always produce one more finding.
3. **The repo-wide `CLAUDE.md`** (at the repository root, outside this project)
   still says to apply *all* review findings. This project's `CLAUDE.md` says
   "apply every finding that holds up". Should the root file be changed to match?
   It is outside the project, so it stays as it is unless you say so.
4. **Sign-off on the edit-warning wording in the spec.** In plain terms:
   - The warning arrives right after the edit runs, not before it.
   - If another hook blocks the edit, the warning still reaches the agent.
   - If a permission rule blocks an edit to a file, Claude Code rejects it before
     the oracle sees it.

   The evidence (Claude Code 2.1.283, tested) is
   `docs/reviews/2026-09-28-branch-audit-hook-context-permission-denial.md`.
5. **Notes that don't fit in one message.** If the oracle's message to the agent
   goes over 10,000 characters, Claude Code saves it to a file and shows the
   agent only the first 2,000 characters. The agent isn't told to open the file.
   What should happen?
   - (a) Send everything anyway.
   - (b) Send what fits and drop the rest.
   - (c) Send what fits and hold the rest for the agent's next action.

   Until you decide, the oracle does (a) and records every time it happens.
   Nobody has measured whether messages ever get that long.

## Open items

- **Sandbox premise — still open:** whether `unshare -rn` works on the GitHub
  Actions runner image. The optional `09_unshare_no_network.optional` probe is
  evidence for this container only.
- **L11(a):** human-marker presence is measured on interactive transcripts. The
  plan reports it *verified* only when an owner-local interactive transcript is
  in the exit corpus, otherwise *not observed*.
- **L11(b):** whether `UserPromptSubmit` fires for platform-injected turns is
  undocumented. The plan resolves it by live induction in the exit run.
