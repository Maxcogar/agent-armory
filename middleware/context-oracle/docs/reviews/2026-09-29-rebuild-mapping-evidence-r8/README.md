# Evidence: the round-8 changes to the legacy-store rebuild and the recompute (2026-09-29)

This directory is the evidence for the changes that answer the round-8 review
(`../2026-09-29-architecture-review-round8.md`, findings R8-1 to R8-7).
`docs/architecture-phase-a.md` cites it as *the round-8 evidence*. Like every
file under `docs/reviews/`, it is written once and never edited.

The round-7, round-6 and 2026-09-28 evidence directories are kept as they are.
`rebuild.mjs`, `test-rebuild.mjs`, `mutants.sh` and `designed-build.sh` here are
copies of the round-7 files; the first three are revised, `designed-build.sh` is
unchanged. `recompute.mjs` and `test-recompute.mjs` are new: a model of AD-13's
pass around a full recompute, built from `bench-epoch.mjs` (2026-09-28 evidence)
and the round-8 reviewer's `z1-resume.mjs`. Everything else is used from the
2026-09-28 directory unchanged (`build-builds.sh`, `build-stores.sh`,
`mkrepo.sh`, `synth.mjs`, `layouts/`, `new-layout/`), and `rebuild.mjs` reads the
layout SQL from there.

Two rules governed this round, because both round-8 Serious findings came from
round 7's text-only fixes: every change to what the tool does is written into a
prototype and tested, with the reviewer's cases; and where a finding exists
because an earlier fix added mechanism, the mechanism is taken out first if the
result still meets the spec and ledger lines involved.

Outputs are in `results/`. `<work>` is the scratch work directory. Node v22.22.2
(its SQLite 3.51.2), git 2.43.0, Linux.

## The changes, by finding

- **R8-2 (Serious) — mechanism removed.** Round 7's resume watermark
  `schema_meta.recompute_done` (R7-9) is taken out. A full recompute that is
  interrupted starts again from its first row. The marker `recompute_epoch` is
  replaced by `recompute_pending`, which holds no epoch: the pass that finds it
  recomputes every row at its own `refTs` and the current `h`. `recompute.mjs`
  models this; `test-recompute.mjs` runs the reviewer's Z1 (tune `h`, kill,
  tune back) after every transaction count, its control, and F5-6's case. The
  stated limitation (a recompute interrupted every time never finishes, with
  the history genres silent under `mining_in_progress`) is executed as case
  REP, and one recompute's duration on a model of the seeded horizon is
  measured (`--bench`). The alternative, storing the recompute's `h` and epoch
  and resuming under them, was not needed: no spec or ledger line requires a
  recompute to finish under repeated interruption (architecture AD-13).
- **R8-7.** A pass that runs a full recompute uses its own `refTs` as `E` for
  the recompute, the cap and its own mine, and its final transaction writes it
  as `weight_epoch`. `test-recompute.mjs` case R8-7: a recompute and a mine of
  61 commits (one author-dated past every `refTs`) in one pass, killed after
  each transaction.
- **R8-1 (Serious).** `rebuild.mjs` gains `childBinding()`, the binding
  decision after the rebuild step for each state of the derived key's store,
  and `handlerMiss()`, the handler's binding-miss rule with its per-session
  marker. Legacy: rebuild and bind. Current: bind only when the root already
  has its binding or the store's own local `store_rebuilt` record names this
  root in its new `root` field (the run after a kill between the rename and
  step 6); any other root records `repo_not_bound` on the home-level channel
  (`<home>/diagnostics/faults.jsonl` in the prototype) and is not bound. None:
  `repo_not_bound`. The rebuild entry point takes `--session`. Tested by the
  reviewer's Z3 (a second clone of rebuilt B with an orphan legacy store, and
  again with none), the no-store state (X2's `repoX` in B's home), B's own
  re-run, and, as before, the kill after the rename (`p6-renamed`), whose next
  run's content checks read the binding.
- **R8-3.** `publishStore()` deletes the new name's `-journal`, `-wal` and
  `-shm` and then renames the temporary file onto it. `pager.c` drops a stale
  WAL or journal only when the database is empty at open (`results/sources.out`).
  Tested by the reviewer's Z2 (three ways: created empty, plain rename,
  `publishStore`), Z6 and Z6b (a purge killed with a hot `project.db-wal`, then a
  `store.db` of either layout re-created and rebuilt).
- **R8-4.** A known-layout file with a table that fails to read on the file's
  content is carried table by table: each table's copy runs under its own
  savepoint; a table whose digest or copy fails on the legacy file's content is
  rolled back alone and recorded as an unplaced whole-table entry with
  `unread: true`, its count where it can be counted (else `rows` null) and the
  error; its digest and count are null. A row whose legacy `files` row cannot be
  read is unplaced by the per-row rule. Only an error raised by a statement on
  the legacy connection (`legacyReader()`) is classed as the file's; the same
  error from the new store fails the rebuild. The legacy-file rule returns
  `unreadTables` and does not count such a file as carried. The read
  transaction always ends by `ROLLBACK`. Tested by the reviewer's Z4 on B and
  C (with the round-7 Y5), Y5b (`invariant_members`), Y5c (the no-writer
  `regret`, whose count reads its primary-key index; that index's root page is
  overwritten, so the copy fails where no digest reads), a corrupt `files` page,
  and a `SQLITE_CORRUPT` injected into the new store by the new test hook
  `REBUILD_FAULT=tmp-corrupt:<table>`.
- **R8-5.** The `store_rebuilt` record gains `legacyRel` (the legacy file's path
  relative to the home) and `origin` (`local`, or `import` for the rebuild
  `import` runs on a legacy export; the entry point takes `--origin`). The
  legacy-file rule reads the latest local record whose `legacyRel` is the
  judged file's. A file with no record of its own, not yet rebuilt or with its
  store replaced by an import, returns its layout and the counts of the rows its
  layout's rules carry (derived tables not counted; every table for an unknown
  layout), with `command` `ctxoracle index` only when not yet rebuilt. Tested by
  the reviewer's Z5 (a symlinked home, its realpath, a copy of the home), Y3
  (the export rebuilt with `--origin import`), and the kill at `g7-global-done`.
- **R8-6 (wording).** The test's header names the interface an implementation
  substitutes: the entry point and its arguments, `--purge-files`, the imported
  functions, and the two test hooks. No check is bound anywhere else.

The checks the round-8 fixes change, in `test-rebuild.mjs` (every other check is
as in round 7):
- the legacy-file rule's result now always has `unreadTables`, so the five
  `deepEqual`s of a `rows not carried` result (A/B/C's global file, R6-8, Y1,
  Y2, Y3 own) include `unreadTables: []`;
- Y3: the export's rebuild runs with `--origin import`; "after the import" now
  expects `no rebuild record` with `command` null, the layout, and the carried
  tables' counts;
- the kill at `g7-global-done`: the not-rebuilt result also names
  `ctxoracle index`, the layout, and counts only carried tables;
- Y5 and Y5b: round 7 expected the file rebuilt unread (layout null); round 8
  expects it carried by its layout with the one table unplaced (R8-4).

## Reproduce

From the repository root, with `GIT_DIR` and `GIT_WORK_TREE` unset:

```sh
E=middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence
R=middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8
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
# 6. The recompute model's test. Output: results/test-recompute.out
node --no-warnings $R/test-recompute.mjs
# 7. Thirty-five mutants. Output: results/mutants.out
sh $R/mutants.sh $W $W/HEAD-designed
# 8. The mapping table. Output: results/mapping-rules.out
node --no-warnings $R/rebuild.mjs --print-rules
# 9. One full recompute of a model of the seeded horizon. Output: results/bench.out
TMPDIR=$W node --no-warnings $R/recompute.mjs --bench 10000
# 10. The source the architecture quotes for R8-3. Output: results/sources.out (commands inside).
```

### What was run for the recorded outputs

The builds and stores were not rebuilt. `<work>` was made by copying (`cp -a`)
`59cc05c`, `HEAD`, `b229c04`, `oracle{A,B,C}`, `repo{A,B,C}` and `home{A,B,C}`
from `scratchpad/verify-rb.pU4N/`, which was left unchanged (the same source the
round-8 review copied). The `HEAD` build's `ctxoracle/src` is identical to this
commit's: `diff -rq <work>/HEAD/middleware/context-oracle/ctxoracle/src
middleware/context-oracle/ctxoracle/src` printed nothing. Step 5 was run in a
second copy made the same way, so that it could run beside step 7, which uses
`<work>/test` and `<work>/mutroot`.

Each output file is the command's stdout and stderr, with the scratch path
replaced by `<work>`.

## Results

- **Designed build.** `results/designed-build.out` is the one-line diff of
  `tuning.js`, as in round 7.
- **The acceptance run.** `results/test-rebuild.out`: `1537 checks passed,
  0 failed`, exit 0. The decisive round-8 lines:
  - Z4/Y5: `Y5/Z4 B: session_log root page 38 overwritten; run 1 exit 0 project
    rebuilt layout b229c04; unread entries [{"table":"session_log","rows":13,…}]`,
    owner rows `{"human_facts":2,"corrections":4,"questions":3,"invariants":1}`
    in the kept file and in the rebuilt store (round 7 carried 0 of each); Z4 C
    the same on `4dd0f00-4e070ce` with 3, 4, 4, 1; Y5b and Y5c with `"rows":null`;
  - Z2: `(a) created empty: rows 0; (b) populated file, plain rename: rows 50;
    (c) publishStore: rows 1, quick_check ok`;
  - Z6 / Z6b: `the new project.db: {"z6":0,"recs":1,"layout":"b229c04","qc":"ok"}`
    and the same with `4dd0f00-4e070ce` (the round-8 review had `z6 key 1`);
  - Z3: `handler spawn, child exit 0 project current binding repo_not_bound,
    second event marked; binding of the clone null`, one fault; with no legacy
    store `handler repo_not_bound, faults 2`; `repoB re-run binding bound`;
  - R8-1 no store: `project no-legacy binding repo_not_bound`;
  - Z5: `rule via the link null, via the realpath null, for a copy of the home null`
    (the round-8 review had `no rebuild record` for the last two);
  - R8-4 new-file fault: `exit 1 project failed error "database disk image is
    malformed (injected: the new file)"; legacy ["c6d653fb7aac"]; next run exit 0`;
  - R8-4 files page: `invariant_members 2 legacy rows, 2 unplaced`, human_facts
    carried 2.
- **HEAD's validator.** `results/test-rebuild-head-validator.out`:
  `1492 checks passed, 45 failed`, exit 1. Every failure is the designed-outcome
  check (`this build's validator refuses 10`), 3 stores × 15 runs.
- **The recompute model.** `results/test-recompute.out`: `105 checks passed,
  0 failed`, exit 0:
  - Z1: `26 transactions in the recompute pass; killed after 1..25, tuned back
    to 365: max relative ratio error vs a fresh mine 6.115e-16; with no tune back
    (h 20): 6.340e-16` (the round-8 review measured up to 1.011e+1 under the
    round-7 resume);
  - F5-6: `recompute killed after 13 of 26; next pass at the newer tip inside
    the old bound true; max relative ratio error vs a fresh mine 3.459e-16`;
  - R8-7: `a recompute (h 365 -> 30) and a mine of 61 commits in one pass of 28
    transactions, killed after 1..27 or not: max relative ratio error vs a fresh
    mine 6.073e-16`, and the future-dated commit's weight is 1 in every case;
  - REP (the stated limitation): `20 passes each killed after 5 transactions: 20
    killed; after them recompute_pending 1, mining_in_progress 1,
    mined_half_life_days 365; one uninterrupted pass: max relative ratio error
    5.185e-16`.
- **The bench.** `results/bench.out`: `commits 10000, commit_touches 80607,
  files 2000, pairs 549213; one full recompute 25.8 s in 282 transactions
  (longest hold 99.9 ms; 8.4 s of it in 30 ms gaps)`. A model's figure: its
  pair update is a correlated subquery per pair, and its longest hold exceeds
  the 50 ms chunk target because the chunk loop checks time only between
  statements; neither is the miner's.
- **Mutants.** `results/mutants.out`: all 35 make their test exit 1, none is
  `NOT APPLIED`. Three (the `store_rebuilt`-record mutant, as in rounds 6 and 7,
  and R7-3 and R8-4d, which make a corrupt page fail the rebuild) end the
  test with an uncaught error (`Node.js v22.22.2` as the last line), so the
  test exits 1 before its count line; the cause of the throw was not traced. The round-8 ones first fail at:
  - R8-1a (bind any current store): `Z3 a second clone … misses visibly`;
  - R8-1b (no completion of the recorded root's binding): `A after kill at
    p6-renamed identity, binding and migration records`;
  - R8-1c (no fault for a key with no store): `R8-1 a derived key with no store`;
  - R8-1d (the handler's fault with a legacy store present): `Z3 …`;
  - R8-3 (no companion deletion): `Z2 …` (and Z6, Z6b);
  - R8-4a (round 7's whole-file exit): `Y5/Z4 B …`, 9 failures;
  - R8-4b (the new store's error classed as the file's): `R8-4 a content error
    from the new store …`;
  - R8-4c (a files-row failure fails the whole table): `R8-4 a corrupt files page …`;
  - R8-4d (a table failing in the copy fails the rebuild): uncaught error;
  - R8-5a (match by spelling): `Z5 …`; R8-5b (origin ignored) and R8-5d (no
    counts without a record): `Y3 the local file is judged by its own record …`;
    R8-5c (derived tables counted): `A kill at g7-global-done …`;
  - R8-2a (the round-7 resume restored): 77 of 105 recompute checks fail, Z1's
    ratio errors up to about 10 (for example `error 2.4019951413934932` after 6
    of 26); R8-2b (marker not read): 42 failures;
  - R8-7a (mine at the stored epoch): 27 failures; R8-7b (cap at the stored
    epoch): 2 failures, the kills after 26 and 27 of 28 transactions.

  The mutants' anchors re-anchored to round-8 text (R6-8, R7-3, R7-4a) make the
  same defect as in their round.
- **Mapping table.** `results/mapping-rules.out` is byte-identical to the
  round-7 evidence's (`cmp` printed nothing). No rule changed.
- **Source.** `results/sources.out`: `pager.c`'s `pagerOpenWalIfPresent` deletes
  the WAL only `if( nPage==0 )`, and `hasHotJournal` deletes a journal only
  `if( nPage==0 && !jrnlOpen )`.

## Not prototyped

As in the round-7 README:
- the lock databases (AD-26) and the re-check under them;
- the first index and mine after the rename;
- the `status` text and the purge's message text (the rule's result that
  they read is prototyped: its counts, layout, `unreadTables` and `command`);
- the rebuild inside `import` beyond this rebuild run with `--origin import`
  (Y3 models its `backup()` by a file copy);
- the purge's refusal bullets other than the legacy-file rule, and its
  `whisper_stats` deletion;
- the schema check on open (R7-2 is shown on the checksum function);
- the legacy-writer race in the purge (a stated residual).

Also:
- **`init`'s creation of a new-name store** deleting the name's companions
  before it creates the name (R8-3). `init` is not prototyped; the rule is
  `publishStore()`'s, stated for it in AD-4.
- **The handler beyond its miss rule.** `handlerMiss()` is the rule and its
  marker; the event dispatch, the upward walk and the spawn itself are not
  prototyped (the test calls `handlerMiss()` and then runs the entry point with
  `--session`, as the spawn would). The marker's deletion at `SessionEnd` is not
  prototyped.
- **The miner.** `recompute.mjs` is a model over a synthetic store (the tables
  and sums AD-13 names), with no git read and no eviction. Its `--bench` figure
  is a model's, not the miner's.
- **The designed validator.** It is still the one-condition stand-in.
