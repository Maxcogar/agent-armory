# Branch audit — batch B4, coordinator verification and final verdicts

Batch 4 is commit 21 of `git rev-list --reverse de66831..HEAD`: `2331baf`, "plan
pass — plan brought in line with the architecture at ec3b057". It has 349 hunks
of `docs/plans/plan-phase-a.md`. Changes made in one commit happened at the same
moment, so the hunks were split into three parts audited in parallel:

- **Part 1:** h1–h117 — summary, standards, build order, conventions, Steps 1–12.
- **Part 2:** h118–h233 — Steps 13–37.
- **Part 3:** h234–h349 — §12 test specs, checkpoints, D-plan-33–44, §10A, §11,
  §14.5, §15 and §16.

Each part has a first audit (Fable 5.1), a second opinion (Opus 5.5) and an
adjudication (a fresh Fable 5.1). The files are
`2026-09-26-branch-audit-B4-part{1,2,3}{,-second-opinion,-adjudication}.md`.
Part 3's adjudication ruled with part 2's adjudication settled.

## What the coordinator checked, and what it showed

**Mechanical checker, with unit lists from `B4-part{1,2,3}.txt`.** Each run
checks coverage, fields and verdicts, and matches every repo quote and every
fetched web quote. All three passed:

| Part | Entries | Units covered |
|---|---|---|
| 1 | 17 | 117 of 117 |
| 2 | 21 | 116 of 116 |
| 3 | 50 | 116 of 116 |

**Quotes in the second opinions and adjudications**, checked with the checker's
own matching code. Every quote is exact and none is invented:

| File | Repo quotes | Web quotes |
|---|---|---|
| Part 1 second opinion | 70 | 8 |
| Part 1 adjudication | 74 | 8 |
| Part 2 second opinion | 67 | 9 |
| Part 2 adjudication | 63 | 15 |
| Part 3 second opinion | 146 | 9 |
| Part 3 adjudication | 101 | 6 |

**A miscounted report.** The part 3 second opinion's hand-back said it overturned
11 keeps. Its own sections overturn 8, leaving keep 17 and replace 16. This was
recorded in commit `cedddd3`.

**Executed claims the coordinator reproduced** (git 2.43.0, Node 22.22.2):

- **Exit status 128.** `git merge-base --is-ancestor` exits 128 for a missing
  object, a non-repository and a removed object store. So 128 is not "watermark
  gone". git-merge-base's manual: "exit with status 0 if true, or with status 1
  if not" and "Errors are signaled by a non-zero status that is not 1".
- **A branch switch reads as a rewrite.** After committing on a feature branch
  and switching to a `main` that lacks its tip, `--is-ancestor <feature tip>
  HEAD` exits 1. An amend on the same branch also exits 1, while the old tip
  object is still present (`cat-file -e` exit 0). So the test cannot tell a
  branch switch from a rewrite unless the watermark is keyed to the mined ref.
- **Open errors.** `new DatabaseSync('file:<p>?mode=rw')` fails with errcode 14
  "unable to open database file" identically for a missing file, a missing
  directory and a directory path.
- **`is_error` in real transcripts.** Across all 142 Claude Code transcript
  files under `/root/.claude/projects`, `tool_result.is_error` by tool:

  | Tool | absent | true | false |
  |---|---|---|---|
  | Read | 617 | 9 | 0 |
  | Edit | 189 | 1 | 0 |
  | Write | 101 | 15 | 0 |
  | Bash | — | 40 | 3693 |

  The plan's rule admits a result as successful only on explicit
  `is_error: false`. It therefore admits no Read, Edit or Write at all, and the
  fork/resume read-set reseed is dead and unreported.
- **Dampener arithmetic.** The plan's multiplier is
  c = r × 0.9 × 0.5^(age/365), times 0.8 when the index is stale, with a 0.6
  floor and a 0.8 high tier. The coordinator recomputed:
  - a ratio-1 pair falls below the floor after 213.5 days;
  - it holds the high tier only until 62.0 days;
  - when stale, its maximum is 0.72, so it is never high, and it falls below the
    floor after 96.0 days.

  With recency applied as evidence weighting instead (each commit weighed
  0.5^(age/H) in both the pair and change sums, as AD-13 and FR-K2 state), a
  ratio-1 pair stays at 1.0 at any age (computed at 240 days).

## Final verdicts

| Part | Keep | Replace | Remove | Undetermined |
|---|---|---|---|---|
| 1 (17 entries) | 6 — E-1, E-4, E-12, E-14, E-15, E-16 | 11 | 0 | 0 |
| 2 (21 entries) | 4 — E-10, E-11, E-12, E-13 | 17 | 0 | 0 |
| 3 (50 entries) | 17 — E-7, E-9, E-11, E-13, E-15, E-16, E-20, E-26, E-30, E-31, E-32, E-34, E-40, E-41, E-42, E-45, E-50 | 33 | 0 | 0 |
| **Batch** | **27** | **61** | **0** | **0** |

The adjudication file of each part gives the ruling for every contested entry,
and the correction each implies. The plan is largely a faithful plan of
architecture decisions that batch 3 found wrong. Those entries inherit the defect
and are replaced with it, as the brief requires.

## Correction items this batch adds

These go to the single correction pass.

1. **History-rewrite detection** (part 2 E-1, part 3 E-19).
   - Key the watermark to the mined ref (`git symbolic-ref -q HEAD`, with a
     detached marker).
   - Same ref, and `--is-ancestor` or `cat-file -e` exits 1: `history_rewritten`.
   - Different ref: a `branch_changed`-class diagnostic, with its cost stated.
   - Any other status: a git fault, with no purge.
   - Both horizons are enforced on incremental passes too.
   - Add the ≥ 25 ms inter-chunk yield, and a crash-continuation rule so that a
     restarted full mine cannot double-count.
   - T-13-3 pins the branch-switch, pruned-watermark and git-fault cases.
2. **Recency** (part 3 E-23). Replace the confidence multiplier with evidence
   weighting per AD-13 and FR-K2. It can be implemented on aggregate storage by
   rescaling at read; changing H forces a re-mine. State the staleness
   consequence, or set the factor so that high is reachable when stale.
3. **Transcript success signal** (part 2 E-9, part 3 E-6, E-29, E-33).
   - A result is successful unless `is_error: true`.
   - Raise the per-tool fact as an architecture premise row.
   - Fixtures use the real shapes.
   - `rebuild_recovered_nothing` covers the read set.
4. **Store open and migrations** (part 1 E-5, E-8, E-9, E-17).
   - A new `schema_version` value, or a fingerprint, that the runner and `import`
     refuse, with `deinit --purge` + `init` recovery.
   - Split the cause after `SQLITE_CANTOPEN` with `stat`.
   - The handler's diagnostics-only home helper.
   - The tuning reader serves the seed without writing on the event path.
   - Mark the 0.9 seed as unsourced.
5. **Resolvers** (part 2 E-3, part 3 E-22).
   - TypeScript tries `.ts`/`.tsx`/`.d.ts` before the written `.js`, following
     the handbook.
   - A Python absolute name found nowhere in the repository is external only if
     it is standard library or a declared distribution; otherwise it is
     unresolved (AD-12's own definition).
   - Workspace packages are in-repo.
6. **Search** (part 1 E-13). State the non-ASCII symbol divergence or fold the
   key. T-15-3 must discriminate.
7. **Session and worktree** (part 2 E-16, E-19, part 3 E-35, E-39).
   - `init` does not index a worktree into the shared store.
   - `correct` arms the single open session, and refuses with a plain list when
     there are several.
   - T-31-1's inverted clause is fixed.
8. **Tests that pass while the behaviour is wrong** (part 3 E-12, E-14, E-17,
   E-24, plus the inherited ones).
   - Empty and exact `splitNul` cases.
   - Positive `consumerRole` assertions.
   - Cross-session `okEditedPaths` exclusion.
   - pytest node-id normalisation.
   - Tests pinning the rules batch 3 replaced: `generated` from an ignore match,
     whole-candidate drop, the single coupling ratio, and masked
     `path#<id>`.
9. **Build-order contract** (part 1 E-6, E-7). State how the red state for a new
   export is obtained. Reword rule (c).
10. **Plan decisions D-plan-33–44** (part 3 E-6, E-49).
    - Write their §10A collapse tests.
    - Correct D-plan-36, 37, 39, 40, 42, 43 and 44 per the rulings.
    - §16's proposed architecture fixes must not carry the defective decisions.
11. **`note --file`** (part 2 E-20). Record the note; let emission withhold.
12. **Other items.**
    - Give `firstHash` a consumer and a test, or remove it (part 2 E-21).
    - `status` gets a key- or home-addressed read form for the exit run
      (part 3 E-4).
    - Fix the `pristine-tree` scenario (part 3 E-2).
    - Fix the PG-8 variable (part 3 E-47).
    - Source the interface segregation principle (part 1 E-3).
    - Add an unsourced-literal sweep across Steps 13–19.

## Questions for Max Cogar

1. **Has Max Cogar ever run `ctxoracle init` on any of his own machines?**
   - If not, no store built from the old migrations exists anywhere, and the
     version guard (item 4) is precautionary.
   - If so, that store needs the refuse-and-recover path before anything else
     runs against it.
2. **From batch 3, still open.** The FR-O2/C-4 wording and the "about to run"
   premise of FR-A2d, AC-1c and §5.1.
