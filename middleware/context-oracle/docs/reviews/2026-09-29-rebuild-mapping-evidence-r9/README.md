# Evidence: the round-9 changes to the legacy-store rebuild and the miner's resume (2026-09-29)

This directory is the evidence for the changes that answer the round-9 review
(`../2026-09-29-architecture-review-round9.md`, findings R9-1 to R9-9).
`docs/architecture-phase-a.md` cites it as *the round-9 evidence*. Like every
file under `docs/reviews/`, it is written once and never edited.

The round-8, round-7, round-6 and 2026-09-28 evidence directories are kept as
they are. `rebuild.mjs`, `recompute.mjs`, `test-rebuild.mjs`,
`test-recompute.mjs`, `mutants.sh` and `designed-build.sh` here are copies of
the round-8 files; the first five are revised, `designed-build.sh` is
unchanged. `cases/k-termination.mjs` is the round-9 reviewer's file, copied
unchanged and run against this directory's model. The reviewer's other cases
(`extra9.mjs`, `extra9b.mjs`: V1 to V4) are not copied: they are hard-wired to
the round-8 prototype and its kill-point names, and each is ported into
`test-rebuild.mjs` with the expected outcome (named below). Everything else is
used from the 2026-09-28 directory unchanged (`build-builds.sh`,
`build-stores.sh`, `mkrepo.sh`, `synth.mjs`, `layouts/`, `new-layout/`), and
`rebuild.mjs` reads the layout SQL from there.

Two rules governed this round, because both Serious findings of rounds 8 and 9
came from untested or instruction-driven changes: every change to what the
tool does is written into a prototype and tested with the reviewer's cases,
each behaviour fix with at least one mutant; and no mechanism is added that a
finding does not require.

Outputs are in `results/`. `<work>` is the scratch work directory. Node v22.22.2
(its SQLite 3.51.2), git 2.43.0, Linux.

## The changes, by finding

- **R9-1 (Serious), with R8-2 — the recompute resumes under its own inputs.**
  `recompute.mjs`: a full recompute's first transaction stores
  `recompute_pending = {h, epoch, done}` (the half-life, the epoch, which is also
  the cap because a recompute's epoch is its own `refTs`, and the last row
  finished as `{t, r}`, table and rowid, in the order commits, files, pairs);
  every recompute transaction advances `done` with its rows. A pass that finds
  the key with the current `h` and its `refTs` inside the stored epoch's bound
  resumes after `done` with the stored `h` and epoch, and its mine uses that
  epoch; otherwise it starts a new recompute from the first row at its own
  inputs and records `recompute_superseded`. The final transaction writes the
  stored epoch and `h` and deletes the key. The coordinator's ruling named three
  stored inputs, `h`, epoch and `refTs`; the model stores two because the
  recompute's epoch *is* its `refTs` (R8-7), so the one value is both the epoch
  and the cap.
  A first mine (`S` empty) now writes its mined-with values in its first
  transaction, so a killed first mine is continued as an ordinary pass: this,
  not the recompute's resume, is what makes the reviewer's K1 complete within
  `C` = 9 passes (a recompute of that store alone needs more than 9
  transactions). With it, the case-1 trigger "a store missing a mined-with
  value while it holds weighted commits" has no reachable cause and is removed
  from the model and from AD-13. Every transaction of a pass carries work: the
  pass's bookkeeping is written in its first work transaction (the round-8 model
  set `mining_in_progress` in a transaction of its own, so a pass killed after
  one transaction kept nothing).
- **R9-2 (Serious) — case 2 resumes.** `recompute.mjs` gains case 2 (one
  classifying key, `lex`, stands for `miner.max_transaction_entities` and
  `lexicon.fix_keywords`; `commits.lex` records the value each commit was
  classified at) and the eviction it needs (delete, then recompute the affected
  sums from the remaining touches, deleting a pair no commit touches). The
  digest is written in the transaction that ends the eviction of `D = S`. The
  coordinator asked for the target digest to be recorded "at its start (not only
  at the end)". It is recorded at the start of the re-mine, not in the pass's
  first transaction, because written there a crash during the eviction leaves
  un-evicted commits classified at the old value under the new digest, and the
  next pass keeps them: the mutant R9-2b does exactly that and fails K2. No
  separate target key is added: the stale digest itself tells a crashed pass
  that the eviction is unfinished, and a tune during the reconcile needs no rule
  of its own (tested: a tune back during the eviction, a second tune during the
  mine).
- **R9-3 — the binding before the rename.** `rebuild.mjs`: step 5 records the
  binding, then step 6 ends the read, closes, deletes the companions and
  renames. A kill after the binding and before the rename leaves the root bound
  to a store that is still legacy, which the hook path's legacy-store spawn
  rebuilds; after the rename nothing is left to complete. `childBinding`'s
  completion by the record's `root` (round 8) is removed; a current store binds
  nothing. The project kill points are now `p5-bound`, `p6-closed`,
  `p7-renamed` (round 8: `p5-closed`, `p6-renamed`, `p7-bound`). New export
  `handlerEvent()`: the hook path's order before the miss rule (a legacy global
  store's spawn, the binding lookup, a bound legacy store's spawn under the same
  per-session marker, `served` for a bound current store, else `handlerMiss`).
  It is the order AD-4 and AD-23 already state; the `store_legacy` record and
  the dispatch beyond this decision are not prototyped.
- **R9-4.** An error of the legacy open or schema read makes the file one of no
  known layout only when it is `SQLITE_CORRUPT` or `SQLITE_NOTADB`; any other
  (the reviewer's `SQLITE_BUSY`) throws, so the rebuild records
  `store_rebuild_failed`, leaves the store legacy and is retried.
- **R9-5.** The copy's count and a no-writer table's count are
  `count(*) … NOT INDEXED` (a table scan). A table whose copy fails on the
  legacy file's content gets a null digest and count in the record, as AD-4
  says (new test hook `REBUILD_FAULT=legacy-corrupt:<table>`). The counts that
  only report the rows of a table that could not be read (`countRows`,
  `countOrNull`) stay plain `count(*)`: when the table's own pages fail, an
  index can still count them (Y5's `session_log`, 13 rows; a first version
  with a scan there reported `null`, and the round-8 checks caught it). The
  review's "record the index fault" is not done: the rebuild reads no index of
  the legacy file, so an index-only fault is not observed, and every row is
  carried; detecting it would need a probe whose only use is to report damage
  in a file whose rows are all carried.
- **R9-6.** A pass that finds `mining_in_progress` set records `mining_resumed`
  `{interrupted}` (the key's value counts the passes that started the work),
  and a superseded recompute records `recompute_superseded`. Applied to every
  unfinished pass, not only the recompute: after R9-1 no recompute "keeps
  restarting" on interruption, and the owner's question (running, or
  interrupted?) is the same for every pass.
- **R9-7.** `test-rebuild.mjs`'s header names the build argument's module paths
  and exports, and `handlerEvent`.
- **R9-8.** No behaviour change: `copyTable` already reads a table's rows and
  count before its first write, and the `files` lookup inside the loop fails
  only its row. A comment states the order; AD-4 states it, with the cache rule
  an implementation that streams must follow instead.
- **R9-9.** No behaviour change: AD-4 states the departure (the first root to
  fire while the store is legacy is bound), its reason and consequence, and that
  `status` names the rebuild's `root`. `test-rebuild.mjs` case V3 pins it.

The test's other changes (every other check is as in round 8):
- the three statements outside any check that ended round 8's crash mutants
  (the round-9 review's `crash/guard.py`), and four more of the same kind (the
  record reads of Z6 and V3, and the report reads of the R9-5 case and the
  `files`-page case), are made non-throwing, so a check reports the defect;
- round 8's Y5c (the index page of `regret`) moves from the "unread table" loop
  to the index-only cases: a scan now counts it, and it has no rows.

## Reproduce

From the repository root, with `GIT_DIR` and `GIT_WORK_TREE` unset:

```sh
E=middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence
R=middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r9
W=<work>   # an empty scratch directory
# 1-2. Builds and real legacy stores, by the 2026-09-28 README's steps 1 and 2.
sh $E/build-builds.sh $W "$PWD"
sh $E/build-stores.sh $W > $W/build-stores.out 2>&1
# 3. The designed-validator build. Output: results/designed-build.out
sh $R/designed-build.sh $W
# 4. The rebuild test with the designed validator (the acceptance run). Output: results/test-rebuild.out
node --no-warnings $R/test-rebuild.mjs $W $W/HEAD-designed
# 5. The same test with HEAD's validator (HEAD-only evidence). Output: results/test-rebuild-head-validator.out
node --no-warnings $R/test-rebuild.mjs $W
# 6. The miner model's test. Output: results/test-recompute.out
node --no-warnings $R/test-recompute.mjs
# 7. The round-9 reviewer's K1/K2 file, unchanged, against this model. Output: results/k-termination.out
node --no-warnings $R/cases/k-termination.mjs $R/recompute.mjs
# 8. The mutants. Output: results/mutants.out
sh $R/mutants.sh $W $W/HEAD-designed
# 9. The mapping table: byte-identical to the round-8 evidence's results/mapping-rules.out
node --no-warnings $R/rebuild.mjs --print-rules | cmp - middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/results/mapping-rules.out
# 10. The sources the architecture quotes for R9-4 and R9-5. Output: results/sources.out (commands inside).
```

### What was run for the recorded outputs

The builds and stores were not rebuilt. `<work>` was made by copying (`cp -a`)
`59cc05c`, `HEAD`, `b229c04`, `oracle{A,B,C}`, `repo{A,B,C}` and `home{A,B,C}`
from `scratchpad/verify-rb.pU4N/`, which was left unchanged (the source the
round-8 and round-9 reviews copied). The `HEAD` build's `ctxoracle/src` is
identical to this commit's: `diff -rq <work>/HEAD/middleware/context-oracle/ctxoracle/src
middleware/context-oracle/ctxoracle/src` printed nothing. Step 5 was run in a
second copy made the same way, so that it could run beside steps 4 and 8, which
use `<work>/test` and `<work>/mutroot`. Step 9's `cmp` printed nothing, so the
mapping table is not copied here.

Each output file is the command's stdout and stderr, with the scratch path
replaced by `<work>`; each test output ends with the exit status.

## Results

- **Designed build.** `results/designed-build.out` is the one-line diff of
  `tuning.js`, as in rounds 7 and 8.
- **The acceptance run.** `results/test-rebuild.out`: `1571 checks passed,
  0 failed`, exit 0. The decisive round-9 lines:
  - V1 (R9-4): `V1 B: rebuild while locked exit 1: project failed, error
    "database is locked"; legacy ["c6d653fb7aac"], new name absent true; lock
    released: owner rows readable {"human_facts":2,"corrections":4,"questions":3,"invariants":1};
    re-run exit 0 project rebuilt layout b229c04; owner rows in the rebuilt store
    {"human_facts":2,"corrections":4,"questions":3,"invariants":1}; legacy-file rule null`,
    and the same on C with 3, 4, 4, 1 (the round-9 review had layout null, 0
    rows carried, and the rule "the file could not be read (database is locked)");
  - V2 (R9-3), after each of the 14 kill points on A and C: `p5-bound:
    {"kill":"SIGKILL","bound0":"c6d653fb7aac","h1":"spawn","child":"0:bound","h2":"served","binding":"c6d653fb7aac","faults":[]}
    (the same with an orphan legacy store)`, and `p7-renamed: {…"h1":"served","child":null,…}`;
    every line is the same with and without the orphan (the round-9 review had
    `repo_not_bound` and no binding without the orphan);
  - V3 (R9-9): `handler at the clone spawn, child exit 0 project rebuilt
    binding bound; the record's root is the clone true; binding of the clone
    c6d653fb7aac, of the root init ran at null; a new session there:
    repo_not_bound`;
  - V4 (R9-5): `V4 B: … a table scan reads 2 rows, a plain count(*) "throws:
    database disk image is malformed"; … unread entries []; human_facts: entry
    null, digest non-null, count 2, rows in the rebuilt store 2; legacy-file rule
    null`; V4 C the same with 4 `corrections`; Y5c (`regret`, 0 rows) no entry
    (round 8 recorded each unread with `rows` null and carried 0);
  - R9-5's copy failure: `unread [{"table":"human_facts","rows":2,…}]; digest
    null, count null; corrections carried 4`;
  - Y5/Z4 B keeps round 8's `session_log` entry with `rows` 13.
- **HEAD's validator.** `results/test-rebuild-head-validator.out`:
  `1526 checks passed, 45 failed`, exit 1. Every failure is the designed-outcome
  check, 3 stores × 15 runs.
- **The miner model.** `results/test-recompute.out`: `315 checks passed,
  0 failed`, exit 0:
  - Z1: `25 transactions in the recompute pass; killed after 1..24, tuned back
    to 365 (superseded, recorded): max relative ratio error vs a fresh mine
    6.115e-16; with no tune back (resumed, h 20): 8.372e-15`;
  - Z1r: `200 random orders … max relative ratio error 8.372e-15;
    recompute_superseded 81, mining_resumed 210 records`;
  - F5-6: resumed at the recompute's epoch, error `5.428e-14`;
  - R8-7: `… 27 transactions, killed after 1..26 or not, then a pass one day
    later: max relative ratio error … 3.751e-15`;
  - K1: `first mine killed after 4 of C = 9 transactions: commits 200,
    mined_half_life_days 365, weight_epoch 1790000000; then every pass killed
    after 1: complete after 5 more passes (6 in all)`; after 5: 2 in all; killed
    after each k, the next pass does `C − k` transactions;
  - KR (C-3 on a recompute): `C = 25 transactions; every pass killed after 1:
    complete after 25 passes; mining_resumed records 24`; after 5: 5 passes;
  - K2: `C = 17 transactions; passes each killed after 10: commits at L1 after
    each [100,"completed"]`; after 1: 17 passes, `commits by digest L1:400`;
    a tune back during the eviction and a second tune during the mine settle at
    the latest value.
- **The reviewer's `k-termination.mjs`**, unchanged, against this model
  (`results/k-termination.out`): K1 `commits after each
  [250,300,350,400,"completed"]` (killed after 1) and `["completed"]` (after 5),
  where round 8 stayed at 200 for 20 passes. Its K2 section runs the reviewer's
  own inline model of the round-8 rule, not this directory's, so it still shows
  the alternation; K2 on this model is `test-recompute.mjs`'s.
- **Mutants.** `results/mutants.out`: all 47 make their test exit 1, none is
  `NOT APPLIED`, and none ends with an uncaught error. The round-9 ones first
  fail at:
  - R9-1a (a first mine's values only in its final transaction): `K1 killed
    after 4, then every pass after 1: completes within C passes`, 10 failures;
  - R9-1b (round 8's restart): `Z1c … resumed at its own epoch`, 53;
  - R9-1c (resume at the current `h`, round 7's defect): `Z1 …`, 90;
  - R9-1d (resume at the resuming pass's `refTs`): `Z1c …`, 81;
  - R9-1e (supersession unrecorded): `Z1 …`, 24;
  - R9-2a (case 2's digest only at the end, K2's defect) and R9-2b (in the
    first transaction): `K2 every pass killed after 10` / `after 1`, 2 each;
  - R9-6a (no `mining_resumed`): 26; R9-6b (bookkeeping in a transaction of its
    own): 39;
  - R9-3a (binding after the rename, round 8's order): `A after kill at
    p7-renamed identity, binding and migration records`, 9 (and V2);
  - R9-4 (round 8's catch-all at the open): `V1 B …`, 4;
  - R9-5a / R9-5b (plain `count(*)` in the copy / for a no-writer table):
    `V4 B …`, 2 / `Y5c …`, 1; R9-5c (a copy-failed table keeps its digest and
    count): `R9-5 …`, 1.

  Re-anchored to the round-9 text, each making its round's defect: R8-1a,
  R8-2b, R8-7a, R8-7b. R8-7b (the recompute caps at the stored epoch) passed the
  test in a first run, because no stored commit was authored after the first
  mine's tip; the R8-7 case now holds one (`late`), and the mutant fails 27
  checks. R8-4d (a copy content error fails the rebuild) is now caught by the
  R9-5 case alone, since Y5c's table reads.
  A mutant routing a bound legacy store to the miss rule instead of the
  legacy-store spawn passed the test and is not kept: in this prototype both
  spawn the same child, because the root's own store is legacy (AD-4 says so).
  *How the file was made:* the full run used the test before two more
  statements were made non-throwing (the R9-5 case's and the `files`-page
  case's reads of a failed rebuild's report); under it R8-4d ended with an
  uncaught error. R8-4d was then re-run alone with the final test (its line is
  that run's), and steps 4 and 5 were re-run with the final test, giving the
  same counts and the same `==` lines. For every other mutant those two
  statements are reached only after a rebuild that succeeded, as their counts
  show, so the change cannot alter their lines.

## Not prototyped

As in the round-8 README:
- the lock databases (AD-26) and the re-check under them;
- the first index and mine after the rename;
- the `status` text and the purge's message text (the rule's result that
  they read is prototyped, and the record's `root` that `status` names);
- the rebuild inside `import` beyond this rebuild run with `--origin import`;
- the purge's refusal bullets other than the legacy-file rule, and its
  `whisper_stats` deletion;
- the schema check on open;
- the legacy-writer race in the purge (a stated residual);
- `init`'s creation of a new-name store;
- **the handler beyond its order before the miss rule**: `handlerEvent()` and
  `handlerMiss()` decide; the `store_legacy` record, the event dispatch, the
  upward walk, the spawn itself (the test runs the entry point with
  `--session`, as the spawn would) and the marker's deletion at `SessionEnd`
  are not prototyped;
- **the miner**: `recompute.mjs` is a model over a synthetic store, with no
  git read and no horizon eviction, and one classifying key standing for
  `miner.max_transaction_entities` and `lexicon.fix_keywords`. Its fault
  records are rows of the model's own `faults` table. The bench is unchanged
  from round 8 and not re-run; AD-13 cites the round-8 figure;
- the designed validator: still the one-condition stand-in.
