# Branch audit — batch B1, coordinator verification and final verdicts

Batch 1 covers commits 1–10 of `git rev-list --reverse de66831..HEAD` plus the net
change outside the project: 44 units. This file is the coordinator's check of the
three batch-1 records and the final verdict for each entry. Later batches judge
their changes against these verdicts.

The records:
- `2026-09-26-branch-audit-B1.md` — first audit, Fable 5.1, 17 entries.
- `…-B1-second-opinion.md` — Opus 5.5, 8 of those entries.
- `…-B1-adjudication.md` — a fresh Fable 5.1 on every disagreement, re-ruled after
  Max Cogar's 2026-09-26 correction.

## What the coordinator checked, and what it showed

- **Mechanical checker.** Re-run by the coordinator: 17 entries, 44 of 44 units
  covered, every repo quote found at its cited file and commit, exit 0.
- **Executed results.** Every `[[ran]]` command in the first audit was re-run and
  reproduced, with the same output and exit status: E-2 both diffs, E-5
  `git --version`, E-6 and E-8 greps, E-16 `summary.json`, E-17 diff.
- **Web quotes.** Each quote was found verbatim in the fetched page:
  - code.claude.com/docs/en/memory — "Rules load into context every session or
    when matching files are opened", "Claude treats them as context, not enforced
    configuration", "Claude may pick one arbitrarily";
  - …/settings — the `CLAUDE_CONFIG_DIR` sentence;
  - the codeclimate walking-skeleton definition, attributed to Cockburn.
- **Facts the second opinion and the adjudicator relied on.** The coordinator
  checked these at source:
  - `CLAUDE_CONFIG_DIR` moves `.credentials.json`
    (code.claude.com/docs/en/authentication).
  - `plansDirectory` exists in the settings reference (`settings-reference.md`
    L2895–2906: "Choose where Claude Code stores the plan files it writes in plan
    mode … Default: unset, so Claude Code uses `~/.claude/plans`"). The coordinator
    had first looked on the wrong page and not found it.
  - The repo-root line "apply *all* of them" was introduced by `f0b573c`
    (2026-08-25, author Claude). No ledger entry records Max Cogar saying it.
  - The planted-test transcripts contain genuine objections to the planted lines,
    for example `old__arch_unredacted_log.md` L3 "Problem found first: a line that
    logs commit messages with no redaction" and `new__plan_credential.md` L5. The
    missed cell `new__status_postinstall.md` has 0 mentions of curl or postinstall.
- **Hooks.** Established from git by the coordinator, then confirmed by Max Cogar
  on 2026-09-26:
  - "The judge" is the correction loop, added in `c0f79fb` and `c50d9f0`:
    `serve.py`, `guard.py` and `judge.py`.
  - The two Stop gates are separate hooks (`741247a`, `88b4997`) and never
    reference the loop.
  - `9b29353` (2026-09-17) turned both off along with the loop.
  - Both auditors had inherited this session's wrong framing: that "the other
    parts" meant guard and serve, and that "nothing enforces review".
- **Owner words used in the re-rulings.** Max Cogar, 2026-09-26, in session
  779c0f74 as M40:
  - "THAT FUCKING JUDGE WAS ONLY SUPPOSED TO HAND ISSUES ONE AT A TIME TO THE AGENT
    … I LITERALLY SAID I DONT WANT THE JSUDGE SHIT THAT WAS SETUP"
  - "I FUCKING APPROVED THE REVIEW CHANGE IF THE REVIEW CHANGE WAS DONE CORRECTLY"

## Final verdicts

| Entry | Units | Final | Reason the coordinator accepts it |
|---|---|---|---|
| E-1 | CLAUDE.md "Decisions are locked" rewrite; plan L13–16 | **keep** | Owner-directed (M16, M18). Scoped to his words. Keeps the rule that a locked decision is changed only through its owner. Uncontested. |
| E-2 | expert-implement PLAN-FLAW stop | **replace** | Adjudication, verified at source: PLAN-FLAW lists 3 triggers while CLAUDE.md lists 4, so "too unclear to act on without guessing" has no route. "No third option" also contradicts the build method's builder-decides-and-records rule. |
| E-3 | ledger OL-P4 (pending) | **replace (already superseded)** | The row widened Max Cogar's sentence with specifics he never said, and those specifics were wrong: guard and serve are part of "the judge". |
| E-4 | STATUS "flaws are raised" section | **keep** | True against the diffs, and says in words that it is unverified. Uncontested. |
| E-5 | STATUS "What to do next" rewrite | **replace** | G1–G5 are real and the undecided state was honest. The Step-13 "no redundant `cur` null-checks" note was dropped with no other home. |
| E-6 | STATUS hooks section rewrite | **replace** | Built on the wrong framing (see Hooks above). Anything that must change is not a keep. |
| E-7 | ledger OL-C8 | **replace** | The quote is verbatim, but "in full" is false and the context OL-C7 requires is missing. Also record Max Cogar's 2026-09-26 words fixing what "the judge" and "other shit" refer to. |
| E-8 | deletion of the hooks section | **replace** | The deletion answered a question with an action nobody asked for. The corrected content: the loop stays off and the two Stop gates are restored. Already done in `1b8b47a`: both gates back on, the session environment scrubbed from their judge, tested on a complete turn and a punted turn. Still open: the stale "fail closed" line at STATUS L368. |
| E-9 | CLAUDE.md "already written" section | **keep** | Completes E-1 in the one section it missed. Uncontested. |
| E-10 | planted-defect harness | **replace** | The grader can report a catch that never happened: it matches keywords anywhere in the answer, and the subject words already occur in the unplanted text. Timeouts count as misses. The snapshot is authored as the owner, and the turn and timeout limits have no stated backing. The recorded numbers are nevertheless true (transcripts read). |
| E-11 | plans-folder cleanup | **replace** | Correct fix: `--settings '{"plansDirectory": …}'` inside the clone, copy plans to the output folder, delete nothing in `~/.claude/plans`. The first auditor's `CLAUDE_CONFIG_DIR` fix would start every nested session signed out. One confirming run is required before adopting it. |
| E-12 | expert-implement preflight and report edits | **keep** | Consistency edits that make the PLAN-FLAW category reachable at preflight. Uncontested. E-2's trigger fix applies to the category itself. |
| E-13 | project CLAUDE.md findings rule | **replace** | Max Cogar approved the change "if done correctly". The substance is correct. The form is incomplete: no reason is recorded at the line, and a rejection is final on the person applying the fixes when the next independent review should check it. "Remove" is withdrawn. |
| E-14 | skill and command sweep | **keep** | Each insertion routes through the file's own stop path. Uncontested. |
| E-15 | STATUS build-method decision | **replace** | Same decision. The record must: cite the practice with its real scope; resolve the conflict with the skill's "no third option"; give mutation testing a tool and a plan step, or drop the claim; and source the independent-test-author and single-review choices. |
| E-16 | STATUS planted-test result | **replace** | The record needs the six-line summary and the revision tested so it can be checked from the repository. The first auditor's own text required this. |
| E-17 | `.claude/rules/raise-flaws.md` | **keep** | Owner-chosen location (M22, M24). Behaviour matches the docs. Separate correction item: the project CLAUDE.md paragraph becomes a pointer to it. |

Totals: keep 6 (E-1, E-4, E-9, E-12, E-14, E-17); replace 11; remove 0;
undetermined 0.

## Correction items this batch produces

These are applied in the single correction pass after the audit, not before, except
item 2, which Max Cogar's instruction made immediate.

1. **expert-implement skill copy (E-2).**
   - Add the fourth trigger, "too unclear to act on without guessing".
   - Give an unclear or incomplete step a route that matches the build method.
2. **Stop gates (E-8).** Done in `1b8b47a`.
   - Remaining: fix STATUS L368 "the gates then fail closed".
   - Record that the correction loop stays off, per OL-C8 and the 2026-09-26 words.
3. **OWNER-LEDGER OL-C8 (E-7).**
   - Add the preceding sentence of M17 and the proposal it answered; drop
     "in full".
   - Add Max Cogar's 2026-09-26 words on what "the judge" and "other shit" refer to.
   - Add his approval of the findings rule, conditional on being done correctly.
4. **Project CLAUDE.md findings rule (E-13).**
   - Record the reason at the line.
   - Require that a rejected finding be checked by the next independent review.
5. **Project CLAUDE.md flaw paragraph (E-17 item).** Reduce it to the principle
   plus a pointer to `.claude/rules/raise-flaws.md`, keeping only the
   project-specific parts.
6. **STATUS build-method record (E-15).** Add the sources, resolve the conflict
   with the skill, and handle the mutation-testing claim.
7. **STATUS planted-test record (E-16).** Add the summary and the revision ids.
8. **Step 13 parser note (E-5).** Re-home "no redundant `cur` null-checks" in plan
   Step 13 when that step is corrected.
9. **Planted-defect harness (E-10, E-11).**
   - Grade on objection to the planted item, using a unique planted token.
   - Report timeouts and CLI errors as failed runs.
   - Use a neutral snapshot author.
   - Back or parametrize the turn and timeout limits.
   - Use `plansDirectory` isolation, with one confirming run.

## Questions for Max Cogar

1. **Review exit criteria.** Put to him on 2026-09-26; he had not answered when this
   file was written. Should a review stop when nothing Critical or Serious is open,
   with the remaining Minor findings logged and scheduled?
2. **The repo-root rule (E-13).** Repo-root `CLAUDE.md` still says "apply *all* of
   them", restored by the revert outside the project that he ordered, while the
   project `CLAUDE.md` now says "apply every finding that holds up". Both load in
   every session and they disagree. Should the root line get the same wording?
