# Branch audit — batch B3, coordinator verification and final verdicts

Batch 3 covers commits 18–20 of `git rev-list --reverse de66831..HEAD`: 163 units.
It was audited in two parts because `ec3b057` applies the reviews of `0fab6d7`:
- **Part A** (72 units): `0fab6d7`, the architecture pass from the gap-list review,
  and `8d5bbd4`, its two reviews.
- **Part B** (91 units): `ec3b057`, which applied those reviews.

Each part has a first audit (Fable 5.1), a second opinion (Opus 5.5) and an
adjudication (a fresh Fable 5.1). The files are `2026-09-26-branch-audit-B3a*.md`
and `…-B3b*.md`. Part B's adjudication ruled with part A's adjudication settled.

## What the coordinator checked, and what it showed

- **Mechanical checker.** It covers coverage, fields, verdicts, every repo quote,
  and every web quote fetched and matched.
  - Part A: 21 entries, 72 of 72 units, exit 0.
  - Part B: 25 entries, 91 of 91 units, exit 0.
- **Quotes in the second opinions and adjudications.** Checked with the checker's
  own matching code:
  - A second opinion: 101 repo quotes and 14 web quotes, all exact.
  - B second opinion: 42 repo quotes and 7 web quotes, all exact.
  - A adjudication: 101 repo quotes and 16 web quotes. Four repo quotes are
    imprecisely cited: three are one to three lines off their cited range, and one
    joins two in-range passages with "…". All four are real text.
  - B adjudication: 54 repo quotes and 11 web quotes. Three repo quotes are one to
    three lines off their cited range; all three are real text.
  - No quote in batch 3 is invented. Imprecise line ranges recur across batches;
    later adjudicators are told to cite exact lines with no elision.
- **Executed claims.** The coordinator reproduced these on git 2.43.0 and
  Node 22.22.2:
  - `git ls-files --cached` lists a deleted tracked file.
  - A tracked `src/api.gen.ts` matching `*.gen.ts` is listed, and
    `git check-ignore --no-index -v` reports `.gitignore:1:*.gen.ts`.
  - SQLite SAVEPOINTs nest, and a nested BEGIN fails ("cannot start a transaction
    within a transaction").
  - https://git-scm.com/docs/git-revert does not contain "This reverts commit"
    (webquote exit 1).
  - The hooks page contains "Permission denials fire" (exit 0).
- **SQLite's busy handler.** `sqliteDefaultBusyCallback` in upstream `src/main.c`
  (fetched 2026-09-28) waits in steps of `{ 1, 2, 5, 10, 15, 20, 25, 25, 25, 50,
  50, 100 }` ms, with running totals `{ 0, 1, 3, 8, 18, 33, 53, 78, 103, 128, 178,
  228 }`.
  - The B second opinion's "never sleeps more than 25 ms between polls" is false
    in general.
  - Within the design's 100 ms `busy_timeout` it is true: lock attempts fall at 0,
    1, 3, 8, 18, 33, 53, 78 and 100 ms, and the 50 ms steps begin only after
    103 ms.
  - So a gap of at least 25 ms between miner chunks guarantees an attempt lands in
    it. Part B's adjudicator re-derived the same attempt times from the clip rule.
- **Lock contention.** Reproduced by three agents independently:
  - Full re-mines (the first mine, `index --full`, and the re-mine after history is
    rewritten) hold the write lock for about 450–555 ms. The event path's
    retry-once audit write fails after about 210 ms, which silently turns the
    OL-C3 answer-drift deny off.
  - 30-commit incremental passes hold the lock for about 2 ms and the write
    succeeds.
  - Chunked mining with no gap: the handler succeeded 1 of 15 times. With a 25 ms
    or 50 ms gap: 15 of 15.

## A coordinator error, corrected

The coordinator's assignment to the part A first auditor said "a spec change needs
Max Cogar's sign-off" as if that rule was in force at `0fab6d7`. It was not.

- The procedure that routes an agent's spec correction to Max Cogar before it
  lands was proposed and approved on 2026-09-26 (M37–M38), about 14 hours after
  these commits.
- At `0fab6d7` and `ec3b057`, project CLAUDE.md "Decisions are locked" made an
  agent-written engineering line the agent's to correct, with the reason recorded
  where the change is made.
- The part A second opinion caught the error. The coordinator corrected part B's
  auditor during its run. Both adjudications ruled on the correct basis.
- The content findings against the spec edits stand. Under M38, their replacement
  now goes to Max Cogar before the spec changes.

## Ruling on the recorded challenge to batch 2

Part A's adjudication recorded a challenge to batch 2's settled item, "count revert
and fix labels before the transaction-size exclusion". **The coordinator accepts
it.** The item is corrected as follows:

- **Revert labels are counted before the exclusion.** git writes the revert trailer
  itself, and it names the reverted commit exactly at any commit size. The reason
  on record, "a revert of a large commit is still a revert", supports this only.
- **Fix-keyword labels are counted on included commits only.**
  - HERZIG, the source the spec cites for FR-K2 and FR-D3, verified at
    st.cs.uni-saarland.de: "such tangled changes will make all changes to all
    modules appear related, possibly compromising the resulting analyses through
    noise and bias".
  - A fix keyword in a large tangled commit would label every file in it.
- collapse-log 2026-09-26 C1 records the same split, and `ec3b057` built it.

## Final verdicts — part A (`0fab6d7`, `8d5bbd4`), 21 entries

- **Keep 3:**
  - E-4
  - E-20, the collapse-hunt record
  - E-21, the expert-review record
- **Remove 1:**
  - E-19, a review listed as a governing standard
- **Replace 17:**
  - E-1, E-2, E-5, E-10, E-11, E-14, E-16 and E-18, from the first audit.
  - E-3: spec-line finding. The FR-O2 clause is unsourced and its dates are stale.
    The corrected fact removes the "about to run" premise of FR-A2d, AC-1c and
    §5.1.
  - E-6: the handler's global-store lookup is opened read-only. A rule decides
    which working tree a worktree's index describes. `MultiEdit` has been checked
    against the tools reference. A once-per-session miss fault is added.
  - E-7: `in_tree` gets a reader, backed by FR-A2f and marginal value, plus a stat
    and a remover. Two meanings of "support" are separated.
  - E-8: the seed is sourced; whole-token matching; a purge set. The label order
    follows the ruling above.
  - E-9: the design is kept; its "executed" sentence marks (c) as code-read.
  - E-12: the fold watermark gets a window pair; "can show trend" is unsupported.
  - E-13: `test_map` also covers Python absolute imports; gitlinks and readdir
    symlink cycles are handled.
  - E-15: decide the cap and the dampener with reasons, storage, display, the
    suspect-cap placement, and `tune` ordering enforcement.
  - E-17: whole-horizon passes only. AD-26's "never waits" contradiction is fixed.
    The fix is chosen by comparison.

## Final verdicts — part B (`ec3b057`), 25 entries

- **Keep 7:** E-2, E-4, E-9, E-18, E-19, E-20, E-21.
- **Replace 18:**
  - E-1, E-5, E-6, E-16, E-23 and E-25, from the first audit.
  - E-3: spec-line finding. The unsourced clause is inherited from `de66831` and
    re-dated unchecked; the dates are still unapplied. It routes under M38.
  - E-7: an inter-chunk yield of at least 25 ms, backed as above. The first audit's
    ~200 ms falls. `mining_in_progress` becomes a status-visible suppressing
    condition.
  - E-8: state what `deinit --purge` does to the global `whisper_stats` rows.
  - E-10: add the `repo_key`/`schema_version` refusal, or reject it on the record.
  - E-11: drop an out-of-tree or masked partner from the fact; drop the candidate
    only when no partner remains.
  - E-12: record the ignore-pattern signal as such; it does not set `generated`
    alone. False positives reproduced on `.vscode/settings.json` and
    `logs/.gitkeep`.
  - E-13: the stored-set ordering check; the 0.9 seed stated as unsourced.
  - E-14: the keyword vocabulary is sourced. Both trailer items fall.
  - E-15: in-repo workspace specifiers are never external; the unsafe direction is
    disclosed in L6.
  - E-17: the stated reason is false by the document's own definitions. Render both
    ratios, or record the withholding truthfully.
  - E-22: the "all fixed" claims are false, including the lock fix.
  - E-24: the new load-bearing decisions had no independent collapse-hunt before
    acceptance (CLAUDE.md@ec3b057).

Batch totals: keep 10, replace 35, remove 1, undetermined 0.

## Correction items this batch adds

These are for the single correction pass.

1. **Spec FR-O2/C-4, FR-A2d, AC-1c, §5.1.** Remove the unsourced clause, update
   the dates, and resolve the "about to run" premise. This is an owner question
   under M38.
2. **AD-26 and the miner.**
   - Add an inter-chunk yield of at least 25 ms.
   - Make `mining_in_progress` visible in `status`.
   - Remove "the handler never waits" or reconcile it.
   - Set a bound for whole-horizon passes.
3. **Handler.**
   - Open the global store read-only.
   - Add a worktree index rule.
   - Add a once-per-session `repo_not_bound` fault and a retention rule for its
     markers.
   - State that the worktree HEAD is a symbolic ref resolved through `commondir`.
   - Check `MultiEdit`.
4. **Miner labels.**
   - The label order per the ruling above.
   - Whole-token, case-insensitive matching.
   - A sourced seed.
   - Purge sets that include `labelled_touches`.
5. **Walk and index.**
   - A `.gitignore` signal recorded as a pattern match.
   - Submodule gitlinks and readdir symlink cycles handled.
   - `in_tree` stat, reader and remover.
   - Workspace specifiers are in-repo.
   - `test_map` for Python absolute imports.
6. **Trust.**
   - Decide the cap and the dampener.
   - Storage and display.
   - Suspect-cap placement.
   - Stored-set and `tune` ordering enforcement.
   - Seeds.
7. **Fold and import.**
   - Window watermark pairs.
   - `deinit --purge` of the replica.
   - `repo_key`/`schema_version` refusal.
   - Validate before any write, using the backup API (with batch 2 item 6).
8. **Coupling and Completeness.**
   - Partner-level drop.
   - Both confidence ratios, or a truthful record of what is withheld.
   - One meaning of "support".
9. **Records.**
   - Remove the review from the standards table.
   - Correct the "executed" claims.
   - STATUS "all fixed" claims and the spec-edit disclosure.
   - The collapse-log HERZIG attribution.
10. **Process.** The load-bearing architecture decisions of `ec3b057` get their
    independent collapse-hunt as part of the correction pass's review.

## Questions for Max Cogar

1. **The FR-O2/C-4 wording and the "about to run" premise** (from part A E-3 and
   part B E-3).
   - What the hooks page says: `PreToolUse` text reaches the model on its next
     request, "alongside the tool result". It does not say the text is "preserved
     even if that tool call later fails".
   - Approve rewording FR-O2/C-4, FR-A2d, AC-1c and §5.1 to match? Or rethink when
     edit warnings fire?
