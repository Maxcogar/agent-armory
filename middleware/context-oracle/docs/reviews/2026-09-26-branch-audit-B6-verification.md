# Branch audit — batch B6, coordinator verification and final verdicts

Batch 6 is commits 30–35 of `git rev-list --reverse de66831..HEAD`: the build of
the reopened Steps 1–12 deltas and Checkpoint 1R, its independent review, and the
fixes from that review. It is the first code batch, with 111 units, in three
parts:

| Part | Commits | Content | Units |
|---|---|---|---|
| **6a** | `b229c04` | source | 52 |
| **6b** | `b229c04` | tests | 21 |
| **6c** | `bcb87cb`, `ca67af7`, `c3a25f0`, `95de037`, `e77c768` | review with hand mutation tests; plan fixes; code fixes; §9 line; STATUS "Checkpoint 1R reached" | 38 |

6a and 6b ran in parallel because they cover the same commit. Each part has a
first audit (Fable 5.1), a second opinion (Opus 5.5) and an adjudication (a
fresh Fable 5.1). Every adjudication states for each defect whether it is still
present at `HEAD`.

All execution was done on scratch extractions (`git archive <commit>`) with this
checkout's `node_modules`; the repository was never checked out or modified.

## What the coordinator checked, and what it showed

**Checker runs.** Each checked coverage, fields, verdicts and every quote.

| Part | Entries | Units covered |
|---|---|---|
| 6a | 25 | 52 of 52 |
| 6b | 19 | 21 of 21 |
| 6c | 33 | 38 of 38 |

**Quotes in second opinions and adjudications.** Checked with the checker's own
matching; every one is exact.

| File | Repo quotes | Web quotes |
|---|---|---|
| 6a second opinion | 83 | — |
| 6a adjudication | 74 | 1 |
| 6b second opinion | 63 | 2 |
| 6b adjudication | 64 | — |
| 6c second opinion | 59 | 3 |
| 6c adjudication | 57 | 3 |

**Mutation results.** 6b's first auditor planted 96 mutants against the
scratch-built commit. `mut_out.txt` records 66 KILLED and 16 SURVIVED. The
coordinator checked the survivors the audit names: GD2 (wall-clock fixture), DC1
(`okEditedPaths` ignores consumer) and DC12 (`forFile` order). 6b's second
opinion re-ran the kills and confirmed each failed the subtest owning the broken
clause.

**Executed claims the coordinator reproduced** (Node 22.22.2):

- **Savepoint loss (6a E-1).** On the built `b229c04` tree, an inner "database
  or disk is full" is caught. The outer unit then fails with "cannot commit - no
  transaction is active", and `[ 3 ]` is left durable. `HEAD`'s adapter added a
  `TransactionAborted` guard (`c3a25f0`), judged in 6c.
- **consumerKey collision (6a E-6).**
  - `consumerKey('a#sub:b')` and `consumerKey('a','b#main')` both return
    `"a#sub:b#main"`.
  - `consumerRole` of the main session reads `subagent`, which takes a main
    agent outside the main-only answer-drift deny.
  - The collision holds at `b229c04` and still at `HEAD`.
- **SQLite's automatic-rollback list (6c E-13).** Fetched from
  sqlite.org/lang_transaction.html: `SQLITE_FULL`, `SQLITE_IOERR`,
  `SQLITE_INTERRUPT`, `SQLITE_NOMEM`. `SQLITE_BUSY` is not in it, although the
  review, the plan and the adapter comment say it is.
- **List-key data loss (6c E-25).** Read at `HEAD`, the outcome is
  deterministic:
  - `checkTuningWrite` passes a list key whose seed is not numeric
    (`lexicon.stoplist`) with `{ok: true}`.
  - `tuning.set` then runs `DELETE FROM tuning WHERE key = ? AND project_key IS
    NULL` before inserting one row.
  - So a scalar `tune` write replaces every list member. The adjudicator
    executed it: 8 seeded members became 1.
- **Committed review files unchanged.** `git diff --stat --
  docs/reviews/` was empty when 6c's auditor reported an on-disk change. The
  file that changed was an untracked adjudication still being written.

## A coordinator error, recorded

STATUS at `e77c768` says "CI is green". That commit was made at
2026-09-26T04:18:49Z, 14 seconds after the code fix `c3a25f0` (04:18:35Z). No CI
run on the fixed code had finished: the first test jobs on it completed at
04:19:13Z, and `c3a25f0` itself carries only the two Socket checks.

The claim turned out true, but it was stated before it was checked. That breaks
CLAUDE.md dominating rule 1, "Never claim something works without having run
it". The same STATUS also leaves out that `c3a25f0`, the Serious S1 fix, was
never independently reviewed. The implementation log says "pending independent
review".

## Final verdicts

| Part | Keep | Replace | Remove | Undetermined | Entries |
|---|---|---|---|---|---|
| 6a | 5 — E-3, E-4, E-19, E-20, E-22 | 20 | 0 | 0 | 25 |
| 6b | 2 — E-11, E-12 | 17 | 0 | 0 | 19 |
| 6c | 14 — E-1, E-2, E-5, E-6, E-8, E-9, E-10, E-14, E-15, E-23, E-24, E-26, E-27, E-31 | 19 | 0 | 0 | 33 |
| **Batch** | **21** | **56** | **0** | **0** | **77** |

## Defects still present at HEAD (for the correction pass)

The adjudications state each item as reproduced on a scratch build of `HEAD`.

1. **consumerKey accepts `#` in a session id** (6a E-6, 6b E-6, 6c E-3).
   - `consumerKey` must throw on a session id containing `#`.
   - Add T-6-4 data for `a#sub:b` and `s1#main#x`.
2. **The answer-drift deny can be silently disabled.**
   - A stored non-numeric `deny.loop_threshold` is recorded as `store_corrupt`
     and the deny stops (6a E-24).
   - `tune` now refuses non-numeric values, but a stored bad value is still
     read that way.
3. **Tuning.**
   - The reader writes seeds on the event path (6a E-17, 6b E-16, 6c E-12). It
     must serve the seed and call `onMissing` without writing.
   - A stored-set ordering check is missing: a suspect cap of 0.95 above a high
     tier of 0.8 is served without a fault.
   - The `h ≥ 37` guard becomes the underflow floor of about 1.79 days.
   - Scalar writes to list keys are refused (6c E-25).
   - The `tuningWriteNotice` stays: changing h forces a re-mine.
4. **Transactions** (6c E-13, E-20, E-30).
   - Correct the four-code list.
   - Add a direct-statement case: with the statement-level poison line deleted,
     the direct shape reproduces the original loss.
   - A failed depth-0 ROLLBACK must leave the handle refusing every later call,
     or close it. Rethrowing once was simulated to lose the writes the same way.
5. **Spawn wrapper** (6c E-7). A wrapper that throws only on a missing command
   passes the suite and returns truncated output on a `maxBuffer` overrun. Add
   the overrun case.
6. **Provenance.**
   - The `createHuman` gate is unpinned for mechanical and session kinds (6c
     E-4).
   - `ensureHistoryRow` writes `prov_ref = path` under `commit` provenance (6a
     E-13).
   - `whisper_audit.subject_key` is optional (6a E-12).
   - `slot.human` accepts any string (6a E-7).
   - The per-call `prov` diagnostic check is missing (6b E-19).
7. **Layout.**
   - `ensureHome` still creates `global/` (6a E-2, 6b E-8).
   - Add a loose-mode 0o750 case.
   - CWE-379 is miscited; CWE-276 and CWE-732 fit.
8. **Tests that pass while wrong** (6b, 6c):
   - the import-scan regex misses sibling-DAO imports;
   - `okEditedPaths` cross-session exclusion;
   - `writtenSinceSeq` tool partition;
   - the `indexer-nongit` fixture must be a plain directory;
   - the fault-code list must add a `branch_changed`-class code;
   - fixture shapes must match real transcripts.
9. **init order** (6a E-23). Hooks are wired before the index, so a failed index
   leaves them wired. Index first, or unwire on failure.
10. **Records.**
    - Step 7's "one run-time break" sentence (6c E-18).
    - Builder flaw 5's "Seven".
    - The review's "31 of 54" (it is 33).
    - The skeleton test's stop-point comment (6c E-29).
    - The implementation log's headings, and its red-first account (6c E-32).
    - STATUS's "CI is green" and the unreviewed `c3a25f0` (6c E-33).

Already fixed after these commits, and judged in batches 7–9:
- the `init`/`index` FTS crash;
- the adapter's swallowed nested rollback (`TransactionAborted`);
- `tune` accepting non-numbers;
- the `search.ts` header.

## Questions for Max Cogar

None new. Still open:

1. Has Max Cogar ever run `ctxoracle init` on any of his own machines? This
   decides the migration version guard, and the header claim "no store has
   shipped".
2. The FR-O2/C-4 wording and the "about to run" premise (batch 3).
