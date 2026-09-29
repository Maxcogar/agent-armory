# Evidence: the round-6 changes to the legacy-store rebuild (2026-09-29)

This directory is the evidence for the rebuild changes that answer the round-6
review (`../2026-09-29-architecture-review-round6.md`, findings R6-1 to R6-12).
AD-4, AD-20, AD-23 and AD-24 of `docs/architecture-phase-a.md` cite it as *the
round-6 evidence*. Like every file under `docs/reviews/`, it is written once and
never edited.

The 2026-09-28 evidence (`../2026-09-28-rebuild-mapping-evidence/`) is kept as it
is. The three files changed here are revised copies of files there. Everything
else is used from there unchanged: `build-builds.sh`, `build-stores.sh`,
`mkrepo.sh`, `synth.mjs`, `layouts/` and `new-layout/`. This directory's
`rebuild.mjs` reads the layout SQL from that directory.

Outputs are in `results/`. They are not in `out/`, because the repository
root `.gitignore` ignores `out/` (R6-12). `<work>` is the scratch work directory
and `<builds>` the scratch directory that holds the compiled builds.

Node v22.22.2 (its SQLite 3.51.2), git 2.43.0, Linux.

## Files

- `rebuild.mjs`: the prototype, revised. Its changes:
  - **R6-1.** A file of no known layout has each table's rows counted, where its
    schema can be read, and recorded as `unreadRows`. `legacyNotCarried(scope,
    legacyPath, newPath)` is new. It is AD-20's legacy-file rule: it returns null
    when the legacy file is absent or fully carried, and otherwise the reason.
    *Fully carried* means that a rebuild record exists, its layout is known, it
    has zero unplaced rows, and the carried rows' digests are unchanged.
  - **R6-2.** `legacyCounts` (per-table row counts) is replaced by
    `legacyDigests`: a SHA-256 per carried table over the rows its rule
    carries, in `rowid` order (`carriedDigests`).
  - **R6-3.** No `legacy_pending:` rows are written or deleted.
    `legacyProjects(home)` is the file test that replaces them: a project
    directory with a `store.db` and no `project.db`.
  - **R6-7.** No `index_stale` or `legacy_unplaced` key is written. Every
    unplaced entry has `rows`. The legacy `schema_version` is listed as
    replaced by the checksums.
  - **R6-8.** A row the new layout refuses is recorded as unplaced (with
    `rows: 1`, its `rowid` and the error), and the copy goes on. This covers a
    constraint error, and a file id with no legacy `files` row. Any other error
    still fails the rebuild.
  - **R6-9.** Before the layout comparison, CRLF in `sqlite_master.sql` is read
    as LF.
- `test-rebuild.mjs`: the test, revised. Every 2026-09-28 check stays, except
  these three, which are replaced:
  - `legacy_unplaced` equal to the entry count becomes: every entry counts
    rows, and no `legacy_unplaced`, `index_stale` or `schema_version` key
    exists (R6-7);
  - the `legacy_pending` checks become: no such row exists, and after the kill
    at `g7-global-done` the file test names the project (R6-3);
  - the `legacyCounts` key check becomes a `legacyDigests` key check (R6-2).

  Added on every store and every kill run:
  - the legacy-file rule: the project file is fully carried, and the global
    file is not carried by exactly its refused tunings (R6-1);
  - the refusal of `bar.recency_half_life_days 10` is `HEAD`'s 37-day floor
    (R6-4).

  Added cases:
  - store D (the reviewer's X1): not carried, with the counts;
  - store E: not carried, rows unknown;
  - X2 and X3 (the reviewer's);
  - R6-8 (two refused rows);
  - R6-9 (CRLF DDL).
- `mutants.sh`: the seven 2026-09-28 mutants and four new ones (R6-1, R6-2,
  R6-8, R6-9). The seventh is re-anchored because the record's transaction no
  longer writes `legacy_unplaced`. Each mutant runs on a copy in
  `<work>/mutroot/`, next to a link to the 2026-09-28 directory.

## Reproduce

From the repository root, with `GIT_DIR` and `GIT_WORK_TREE` unset:

```sh
E=middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence
R=middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6
W=<work>   # an empty scratch directory
# 1-2. Builds and real legacy stores, by the 2026-09-28 README's steps 1 and 2.
sh $E/build-builds.sh $W "$PWD"
sh $E/build-stores.sh $W > $W/build-stores.out 2>&1
# Baseline: the 2026-09-28 test on these stores.
#   Output: results/2026-09-28-test-on-these-stores.out
node --no-warnings $E/test-rebuild.mjs $W
# Baseline: the reviewer's X1 and X2 against the 2026-09-28 prototype. It needs
#   <work>/repoX, which step 3 creates; run it after step 3.
#   Output: results/round6-cases-on-2026-09-28-prototype.out
node --no-warnings middleware/context-oracle/docs/reviews/2026-09-29-architecture-review-round6-cases/extra.mjs $W
# 3. The revised test. Output: results/test-rebuild.out
node --no-warnings $R/test-rebuild.mjs $W
# 4. Eleven one-rule mutants. Output: results/mutants.out
sh $R/mutants.sh $W
# 5. The mapping table. Output: results/mapping-rules.out
node --no-warnings $R/rebuild.mjs --print-rules
```

### What was run for the recorded outputs

The builds and stores were not rebuilt for this run. They came from an earlier
run of steps 1 and 2 on 2026-09-29, in a scratch directory (`<builds>`).
`results/builds.out` is that run's `build-builds.sh` output: `b229c04`,
`59cc05c`, and `HEAD` at `c9a185b`, each with `npm run build exit 0`. The `HEAD`
build's `ctxoracle/src` is identical to this commit's. This was checked with
`diff -rq <builds>/HEAD/middleware/context-oracle/ctxoracle/src
middleware/context-oracle/ctxoracle/src`, which printed nothing, and
`git diff --stat bab8430 HEAD -- middleware/context-oracle/ctxoracle`, which was
empty.

`<work>` was then set up:
- the three builds were linked in;
- `oracle{A,B,C}`, `repo{A,B,C}` and `home{A,B,C}` were copied in (`cp -a`)
  from `<builds>`.

The steps were then run in this order: the 2026-09-28 test, step 3, step 4,
the reviewer's `extra.mjs` (after step 3 had created `repoX`), and step 5. The
first run of step 3 stopped on a fixture error: the R6-8 case's own insert was
refused by `node:sqlite`'s default foreign-key enforcement. The fixture was
changed to open with that enforcement off, and step 3 was run again. That run
is the one recorded. Each output file is the command's stdout and stderr, with
the scratch paths replaced by `<work>` and `<builds>`.

## Results

- **Baseline.** `results/2026-09-28-test-on-these-stores.out`:
  `1400 checks passed, 0 failed`, exit 0. The reused stores reproduce the
  2026-09-28 result.
- **The reviewer's cases on the 2026-09-28 prototype.**
  `results/round6-cases-on-2026-09-28-prototype.out` reproduces the review's
  E-1 and E-3:
  - `X1 exit 0 layout null unread true legacy_unplaced 0 legacyCounts absent
    legacy human_facts rows 2 new human_facts rows 0`;
  - `X2 after repoX: 0 global:current: project:rebuilt:b229c04 pending
    ["legacy_pending:deadbeef0000"] bindings 2`.
- **The revised test.** `results/test-rebuild.out`:
  `1502 checks passed, 0 failed`, exit 0. The decisive lines:
  - X1: `X1 legacyNotCarried: {"reason":"layout unknown: its rows were not
    read","rows":{…,"human_facts":2,…}}`;
  - E: `E legacyNotCarried: {"reason":"the file could not be read (file is not a
    database)","rows":null}`;
  - X2: `after repoC … legacy projects ["2b9215453e99","deadbeef0000"]; after
    repoX … legacy projects ["deadbeef0000"]`. No `legacy_pending:` row exists,
    and once the orphan's directory is removed the file test is empty;
  - X3: `b229c04 tune exit 0 (bar.confidence_floor = 0.7); tuning rows legacy
    171 -> 171; legacy floor ["0.7"], rebuilt ["0.65"]; before
    {…"changedSince":[]}; after {…"changedSince":["tuning"]}`;
  - R6-8: `exit 0; project rebuilt; unplaced
    [{"table":"invariant_members","rows":1,"rowid":3,"reason":"files.id 99999:
    no legacy row"},{"table":"invariant_members","rows":1,"rowid":4,"reason":
    "FOREIGN KEY constraint failed"}]`;
  - R6-9: `29 schema rows hold a CR; exit 0; project rebuilt, layout b229c04`.
- **Mutants.** `results/mutants.out`: all 11 make the test exit 1. The four new
  ones fail at these checks:
  - R6-1, an unknown-layout file counted as carried: `D (X1) another layout:
    not carried …`;
  - R6-2, the digest reduced to a row count: `X3 the digest names the tuning
    table …`;
  - R6-8, a refused row fails the rebuild: `R6-8 refused rows …`;
  - R6-9, no CRLF normalisation: `R6-9 CRLF DDL …`.
- **Mapping table.** `results/mapping-rules.out`. Its table is byte-identical to
  the 2026-09-28 `out/mapping-rules.out`. Only the two `META` summary lines
  differ: `schema_version` is listed as replaced by the checksums, and the keys
  the rebuild no longer writes are gone.

## Not prototyped

These are as in the 2026-09-28 README:
- the lock databases;
- the first index and mine;
- the `status` text;
- the rebuild inside `import`, which covers R6-10's message and override;
- the two AD-24 cases named there.

These are new:
- **The handler.** Its once-per-session legacy-store spawn (R6-3, R6-8), and
  its listing of `projects/` on a binding miss.
- **The purge.** Only its legacy-file bullet is prototyped, as
  `legacyNotCarried`. Its other bullets and its deletion are not.
- **The designed tuning validator** (AD-14, R6-4). The prototype validates with
  `HEAD`'s `checkTuningWrite`. The test pins that the half-life refusal is
  `HEAD`'s 37-day floor. It does not show that the designed floor carries the
  value.

The R6-8 rows are written with foreign-key enforcement off, as a hand edit
would write them. `node:sqlite` enforces foreign keys by default, so no build
writes such a row.
