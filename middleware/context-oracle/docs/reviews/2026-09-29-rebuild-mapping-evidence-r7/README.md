# Evidence: the round-7 changes to the legacy-store rebuild (2026-09-29)

This directory is the evidence for the rebuild changes that answer the round-7
review (`../2026-09-29-architecture-review-round7.md`, findings R7-1 to R7-10).
`docs/architecture-phase-a.md` cites it as *the round-7 evidence*. Like every
file under `docs/reviews/`, it is written once and never edited.

The round-6 evidence (`../2026-09-29-rebuild-mapping-evidence-r6/`) and the
2026-09-28 evidence (`../2026-09-28-rebuild-mapping-evidence/`) are kept as they
are. `rebuild.mjs`, `test-rebuild.mjs` and `mutants.sh` here are revised copies of
the round-6 files. `designed-build.sh` is new. Everything else is used from the
2026-09-28 directory unchanged (`build-builds.sh`, `build-stores.sh`, `mkrepo.sh`,
`synth.mjs`, `layouts/`, `new-layout/`), and `rebuild.mjs` reads the layout SQL
from there.

Outputs are in `results/` (not `out/`, which the repository root `.gitignore`
ignores). `<work>` is the scratch work directory. Node v22.22.2 (its SQLite
3.51.2), git 2.43.0, Linux.

## Files

- `designed-build.sh <work>` (R7-1): makes `<work>/HEAD-designed`, a copy of the
  `HEAD` build whose `checkTuningWrite` has one condition changed: the half-life
  floor `halfLife >= 37` becomes AD-13's designed relation,
  `halfLife >= 365.25 * v('miner.horizon_years') / 1022` (about 1.79 days at the
  seeded 5 years). It stands in for the build's own validator, which does not exist
  yet. It is the round-7 reviewer's Y4 approach, with the horizon read from the
  store rather than written as 5. It prints the one-line diff.
- `rebuild.mjs`: the prototype, revised:
  - **R7-2.** `migrationChecksum(text)` is SHA-256 over the text with CRLF read as
    LF, the same normalisation as R6-9's layout test. The recorded
    `migration_sha256:*` values use it.
  - **R7-3.** A read of the legacy file that fails on its content, SQLite's
    `SQLITE_CORRUPT` (11) or `SQLITE_NOTADB` (26), during the digest or the copy,
    is not a failure. The copy's transaction rolls back and the file is handled
    as unreadable: `layout` null, `unreadable` the error, rebuilt from the
    repository unread, with `unreadRows`. Any other error still fails. Its read
    transaction ends by `ROLLBACK`, because its `COMMIT` reports the same
    corruption. That was found on the first run of Y5 and fixed; the recorded run
    is after the fix.
  - **R7-4.** `unreadRows` holds null, not a string, for a table that cannot be
    counted. `legacyNotCarried` reads the latest `store_rebuilt` record whose
    `legacyPath` is the file it judges, and a legacy file it cannot read returns
    `{reason: 'the file could not be read (…)', rows: null}` instead of throwing.
  - **R7-5.** The record has `legacyCounts`, the number of carried rows per table
    beside `legacyDigests`. `changedSince` entries are
    `{table, rowsAtRebuild, rowsNow}`. A file not yet rebuilt returns its
    per-table counts as `rows`.
  - **R7-8.** `purgeFiles(dir)` (CLI `--purge-files <dir>`) is the purge's
    deletion. It deletes every file of the project directory except
    `reindex.lock`: `store.db`, then the `*.pre-import-*` copies, then any other
    file, then `project.db`, each database file before its `-journal`, `-wal` and
    `-shm`. A kill hook `purge-after-<name>` fires after each deletion. The
    refusal is not prototyped here, apart from `legacyNotCarried`.
- `test-rebuild.mjs <work> [<build>]`: the test, revised. `<build>` supplies the
  validator, seeds, reader and key rule to the rebuild and the checks. It
  defaults to `<work>/HEAD`. The changes:
  - **R7-1.** The round-6 check "the half-life refusal is HEAD's validator's
    37-day floor" is replaced. The new check is made through `<build>`'s
    validator: `bar.recency_half_life_days 10` is accepted, carried and served,
    and `bar.no_such_key 1` is refused. Every other check is as in round 6,
    except the following.
  - **R7-2.** The recorded `001` checksum equals `migrationChecksum` of the
    file's CRLF text.
  - **R7-5.** `legacyCounts` has the same keys as `legacyDigests`. After the kill
    at `g7-global-done`, the unrebuilt project file is not carried, with counts.
    X3 expects `[{table: 'tuning', rowsAtRebuild: n, rowsNow: n}]`, with `n` the
    owner rows.
  - Added cases:
    - **Y1** (A with `b229c04`, C with `59cc05c`) and **Y2**, the reviewer's,
      now with the expected counts;
    - **Y3**, the reviewer's: an export by `HEAD`'s `export` verb (`<work>/HEAD`)
      is identified and rebuilt. The local file is judged by its own record
      before the import and after it, the import's `backup()` being modelled by a
      file copy. A separate rebuilt file is overwritten with non-database bytes
      and must return not carried;
    - **Y5**, the reviewer's `session_log` root-page case, and **Y5b**, the same
      on `invariant_members`, whose `count(*)` also fails. Store B's
      `session_log` still counts 13, so it cannot show the null entry;
    - **Y6**: each `new-layout/*.sql` has one checksum over LF and CRLF text;
    - **R7-8**: store B is rebuilt, and a `project.db.pre-import-1` copy and a
      `reindex.lock` are added. For each other file in the project directory,
      `purgeFiles` is killed after deleting it. The file test must not name the
      key, a re-run must leave only `reindex.lock`, and `global/global.db` must
      stay.
- `mutants.sh <work> <build>`: the eleven round-6 mutants, unchanged, and seven
  new ones: R7-1, R7-2, R7-3, R7-4a (latest record), R7-4b (throw), R7-5 and
  R7-8. Each runs the test with `<build>`.

## Reproduce

From the repository root, with `GIT_DIR` and `GIT_WORK_TREE` unset:

```sh
E=middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence
R=middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7
W=<work>   # an empty scratch directory
# 1-2. Builds and real legacy stores, by the 2026-09-28 README's steps 1 and 2.
sh $E/build-builds.sh $W "$PWD"
sh $E/build-stores.sh $W > $W/build-stores.out 2>&1
# 3. The designed-validator build. Output: results/designed-build.out
sh $R/designed-build.sh $W
# 4. The test with the designed validator (the acceptance run). Output: results/test-rebuild.out
node --no-warnings $R/test-rebuild.mjs $W $W/HEAD-designed
# 5. The same test with HEAD's validator (HEAD-only evidence). Output: results/test-rebuild-head-validator.out
node --no-warnings $R/test-rebuild.mjs $W
# 6. Eighteen one-rule mutants. Output: results/mutants.out
sh $R/mutants.sh $W $W/HEAD-designed
# 7. The mapping table. Output: results/mapping-rules.out
node --no-warnings $R/rebuild.mjs --print-rules
# 8. The web sources the architecture quotes. Output: results/sources.out (commands inside).
```

### What was run for the recorded outputs

The builds and stores were not rebuilt. `<work>` was made by copying (`cp -a`)
`59cc05c`, `HEAD`, `b229c04`, `oracle{A,B,C}`, `repo{A,B,C}` and `home{A,B,C}`
from the round-6 run's scratch directory, which was left unchanged. The `HEAD`
build's `ctxoracle/src` is identical to this commit's.
`diff -rq <work>/HEAD/middleware/context-oracle/ctxoracle/src
middleware/context-oracle/ctxoracle/src` printed nothing, and
`git diff --stat bab8430 HEAD -- middleware/context-oracle/ctxoracle` was empty.

Steps 3 to 7 were then run in order. Each output file is the command's stdout and
stderr, with the scratch path replaced by `<work>`.

## Results

- **Designed build.** `results/designed-build.out` is the one-line diff of
  `tuning.js`.
- **The acceptance run.** `results/test-rebuild.out`: `1519 checks passed,
  0 failed`, exit 0. The decisive lines:
  - Y1: `Y1 A: … after {"reason":"rows not carried","unplacedRows":0,
    "changedSince":[{"table":"human_facts","rowsAtRebuild":2,"rowsNow":3}]}`,
    and on C 3 then 4;
  - Y2: `changedSince":[{"table":"questions","rowsAtRebuild":3,"rowsNow":3}]`;
  - Y3: `own {"reason":"rows not carried","unplacedRows":1,"changedSince":[]};
    after the import {"reason":"no rebuild record"}; rebuilt then unreadable
    {"reason":"the file could not be read (file is not a database)","rows":null}`;
  - Y5: `run 1 exit 0 project rebuilt unreadable "database disk image is
    malformed"; run 2 exit 0 current,current`. Y5b is the same, with
    `"invariant_members":null` in the counts;
  - Y6: `001_phase_a_project.sql LF 91a6894ec0dc8523 CRLF 91a6894ec0dc8523`, and
    the same for the other two files;
  - R7-8: after each of the six deletions the directory holds a `project.db` or
    nothing but `reindex.lock` (the `kills:` line), never a `store.db` without a
    `project.db`;
  - X3: `after {…"changedSince":[{"table":"tuning","rowsAtRebuild":4,
    "rowsNow":4}]}`.
- **HEAD's validator.** `results/test-rebuild-head-validator.out`:
  `1474 checks passed, 45 failed`, exit 1. Every failure is the designed-outcome
  check on A, B and C (clean and 14 kills each): `this build's validator refuses
  10: not the designed validator`. So the check is live, and the pinned outcome
  is not `HEAD`'s.
- **Mutants.** `results/mutants.out`: all 18 make the test exit 1, and none is
  `NOT APPLIED`. The seven new ones first fail at these checks:
  - R7-1 (a fixed 37-day floor): `A clean the designed outcome …`, 45 failures;
  - R7-2 (checksum of the bytes): `A clean identity, binding and migration
    records`, 46 failures;
  - R7-3 (a corrupt page fails the rebuild): `Y5 a corrupt session_log page …`,
    4 failures;
  - R7-4a (the latest record): `Y3 the local file is judged by its own record …`;
  - R7-4b (a throw): `Y3 a rebuilt legacy file that cannot be read …`;
  - R7-5 (no counts): `A clean identity, binding and migration records`,
    49 failures;
  - R7-8 (the project store first): `R7-8 purge killed after deleting
    project.db: never legacy …`.

  The eleven round-6 mutants still fail with the designed validator. The
  `store_rebuilt`-record mutant ends the test with an uncaught error
  (`Node.js v22.22.2` as its last line), as it did in round 6.
- **Mapping table.** `results/mapping-rules.out` is byte-identical to the round-6
  evidence's (`cmp` printed nothing). No rule changed.

## Not prototyped

As in the round-6 README:
- the lock databases;
- the first index and mine;
- the `status` text;
- the rebuild inside `import` (Y3 models its `backup()` by a file copy);
- the handler and its marker (R7-6);
- the purge's refusal bullets other than the legacy-file rule, and its
  `whisper_stats` deletion.

Also:
- **The schema check on open.** R7-2 is shown on the checksum function and the
  recorded value, not on an open path.
- **The recompute's resume** (R7-9). `bench-epoch.mjs` still restarts the
  recompute.
- **The legacy-writer race** in the purge (R7-8). It is stated as a residual
  and not made safe.
- **The designed validator.** It is a one-condition stand-in, and `tune`'s
  check on a `miner.horizon_years` write is not part of it.
