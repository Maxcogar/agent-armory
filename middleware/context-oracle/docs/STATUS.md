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

1. **Wait for Max Cogar's answers** to the two questions below. Nothing
   moves until then.
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

## Max Cogar's answers of 2026-10-02

Recorded verbatim in `OWNER-LEDGER.md` under CONFIRMED (OL-C9 … OL-C14):
- the skill-step checker stays;
- the "steering isn't working" block trigger is restored;
- "sandbox" includes Claude Code cloud sessions, with no no-internet
  requirement;
- both stores, project and global, must survive the end of a cloud session;
- tests run on his real projects;
- the repo-root `CLAUDE.md` is left alone.

**Settled without him**, because his rules or answers already decide them:
- **Who checks the oracle's warnings:** the agents. OL-11 makes verification
  theirs, and his corrections, when he makes them, outrank theirs.
- **"A more deterministic trigger" for skills:** built from the skill's declared
  structure (when the skill is active, its steps, what the agent should be
  doing), as his own OL-C2 words describe. That is more deterministic than the
  gate-and-test attempts he contrasted it with, and no hand-written rule piles.
- **The spec sentence calling the skill feature "the recurring failure this
  project exists to prevent":** replaced with his own recorded words. OL-C9 says
  the feature must never be made the tool's main purpose.

## Questions for Max Cogar (plain language)

1. **Skill steps that happen only in the agent's thinking.**
   - Some steps in your skills leave no trace the oracle can see. Example: Step
     5 of `expert-implement` is "Apply the Expert Standard to your own work".
     That happens inside the agent's reasoning, with no file read, command or
     message the oracle could observe.
   - Steps that do leave a trace can be checked: Step 0 loads the
     expert-standard skill, Step 2 reads files, and the final step dispatches a
     review.
   - The choice:
     - (a) The oracle checks every step that leaves a trace, and `status` names
       the steps it can't see.
     - (b) Your skills are changed so those steps leave a trace (for example,
       the agent writes one line saying what it checked).
2. **One wording change in the spec, about when an edit warning arrives.**
   - Now (wrong): FR-A2d says the warning fires on "An edit / write about to
     run".
   - What Claude Code actually does: a warning from the oracle reaches the
     agent together with the edit's result, right after the edit runs, and it
     still arrives if the edit fails. That is the moment the agent decides
     whether to keep the edit, fix it, or run the related tests.
   - Proposed: "An edit / write", with "reaching the agent with the edit's
     result, at its next decision (keep, revise, run the coupled tests)".
   - Evidence: the Claude Code hooks reference, and changelog 2.1.110: "Fixed
     `PreToolUse` hook `additionalContext` being dropped when the tool call
     fails".
   - The same correction applies to three more spec sentences that say "about
     to run" (§5.1, AC-1c, FR-O2).
   - Approve?

## Open items

- **Sandbox premise — still open:** whether `unshare -rn` works on the GitHub
  Actions runner image.
- **L11(a) and L11(b):** the two transcript and hook-contract premises the plan
  resolves in the exit run.
