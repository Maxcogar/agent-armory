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

## Where the project stands (2026-10-14)

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

**Step 2, the corrections: the spec correction is under way (2026-10-14).**
- The corrected spec is being written to
  `docs/spec-correction/spec-context-oracle.corrected.md`, a working copy of the
  spec. All 752 line-numbered spec quotes in the nine spec-audit files were
  checked against `docs/specs/spec-context-oracle.md` and match, so the copy
  started as exactly the audited text.
- The correction brief every correction agent works from is
  `docs/spec-correction/BRIEF.md`. Each agent writes its per-finding record to
  `docs/spec-correction/record-{a,b,c}.md`.
- Final verdicts, computed from the audit files, match the verification's
  totals: part a 28 replace; part b 39 replace and 6 undetermined; part c 39
  replace, 2 remove and 2 undetermined.
- **Part a is done (2026-10-14):** its 28 findings re-derived, Max Cogar's
  answers applied where they land, record in `record-a.md`; the independent
  re-run of its sweep patterns passed (`sweep-check.md`).
- **Part b was stopped at 21:01 before making any edit** (a session
  interruption by Max Cogar). The working copy is as part a left it. Part b
  is restarted on Max Cogar's go-ahead.
- Part c, the independent review and the change list for Max Cogar have not
  started.
- Why not `/expert`: the expert-dev-tools lifecycle workflow corrects only
  against its own reviewer's findings for a spec registered in its ledger
  (`claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js`, spec phase
  and its `remediateFn`); it has no input for an existing finding set such as
  the 2026-09-29 audit, so the correction runs `expert-correct` directly.
- The spec of record (`docs/specs/spec-context-oracle.md`), the architecture,
  the plan and the code are unchanged.
- All of Max Cogar's questions are answered: `OWNER-LEDGER.md` OL-C9 … OL-C15,
  plus the decisions below.
- A first spec-correction draft (2026-10-02) was thrown out unused. Its agent
  was briefed without the correction procedure.
- **The correction procedure is `expert-correct`**, at
  `claude-plugins/expert-dev-tools/skills/expert-correct/SKILL.md`. Its
  description covers correcting "an existing artifact — a spec, an
  architecture, or a plan ... against a review finding set". It calls itself
  "the whole of that discipline", and sends writing a new artifact to
  `expert-spec`. It is not installed in Max Cogar's account and sits outside
  this project. Read it there; do not edit it.
- This project's out-of-date `/expert-spec` and `/expert-review` commands were
  deleted on Max Cogar's instruction (`0c78075`). The installed versions apply.
- How this session's coordinator failed Max Cogar: `docs/collapse-log.md`,
  2026-10-02 / 2026-10-03. Read it before doing anything.

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

1. **Finish correcting the spec under `expert-correct`** in
   `docs/spec-correction/` (parts a, b, c, one after another, each reading the
   earlier parts' records), against the finding set:
   - the spec audit's 106 replacements and 2 removals, as the adjudications and
     the verification's reconciliation write them
     (`docs/reviews/2026-09-29-spec-audit-*`);
   - the lines Max Cogar's answers and the decisions below settle.

   Then:
   - re-execute every correction record's sweep pattern through an agent that
     did not do the correction, and compare with what the record reports;
   - have the corrected spec independently reviewed;
   - show Max Cogar every change for sign-off before the spec file changes
     (M38: he signed it).
2. **Then correct the architecture, then the plan, once each**, from the branch
   audit verifications and the corrected spec:
   - fix each defect at its root cause with a correct design;
   - never answer a requirement with a narrowed claim, a stated limitation, a
     fallback or an exclusion;
   - judge every review finding on its merits, never apply one because a rule
     says to.
3. **Then rebuild the code.**

## Max Cogar's answers of 2026-10-02

Recorded verbatim in `OWNER-LEDGER.md` under CONFIRMED (OL-C9 … OL-C15):
- the skill-step checker stays;
- the "steering isn't working" block trigger is restored;
- "sandbox" includes Claude Code cloud sessions, with no no-internet
  requirement;
- both stores, project and global, must survive the end of a cloud session;
- tests run on his real projects;
- the repo-root `CLAUDE.md` is left alone;
- the edit-warning timing is corrected everywhere it applies (FR-A2d, §5.1,
  AC-1c, FR-O2): the warning reaches the agent with the edit's result.

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

## Design decisions settled 2026-10-02

**Skill steps that seem to happen only in the agent's head — decided 2026-10-02
(design, OL-11; Max Cogar agreed 2026-10-03: "Sounds good to me.").** He
rejected both earlier options:
   - (a) asked how the oracle would know which steps it can't see: it cannot,
     except from someone marking them by hand, and each step so marked simply
     goes unchecked;
   - (b) a one-line statement from the agent of everything it does is
     unrealistic and will not work.

   The design: the oracle checks every step by the evidence that step
   itself requires.
   - Example: `expert-implement` Step 5 requires, before a todo is marked
     `completed`, a verification command that actually ran, with its output
     cited, and claims checked against current source.
   - So the oracle checks:
     - at each `TodoWrite` that marks a todo `completed`, that a verification
       command ran for it;
     - that the final report's cited commands and outputs match what actually
       ran;
     - that files were read before claims about them.
   - A step that requires no evidence at all is a flaw in that skill, raised to
     Max Cogar for that one step when the skill's structure is encoded.
   - Only `expert-implement` has been read so far.

## Questions for Max Cogar (plain language)

None open. The next thing he receives is the spec changes, for sign-off.

## Open items

- **Sandbox premise — still open:** whether `unshare -rn` works on the GitHub
  Actions runner image.
- **L11(a) and L11(b):** the two transcript and hook-contract premises the plan
  resolves in the exit run.
- **Plan probe 13 drifted (found 2026-10-14):** the CI `check-plan` job fails
  on `13_hooks_reference.optional`. The live hooks page
  (`code.claude.com/docs/en/hooks.md`, fetched 2026-10-14) no longer contains
  "When you submit a prompt" (under 'Hook lifecycle') or "On PreToolUse , by
  contrast" (under 'PreModelSwitch decision control'). The plan correction
  re-checks the plan's hooks premises against the current page before the
  probe's expected output changes. Locally, probe `15_claude_p_scrub.optional`
  also fails; CI skips it because the `claude` CLI is not on the runner.
