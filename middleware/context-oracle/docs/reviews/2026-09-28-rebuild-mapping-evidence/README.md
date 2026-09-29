# Evidence: the legacy-store rebuild, settled by execution (2026-09-28/29)

This directory is the evidence AD-4's rebuild section cites
(`docs/architecture-phase-a.md`). Its mapping was written as a prototype, run
against real legacy stores that the historical builds wrote, and tested. The
architecture states only what these runs show. Like every file under
`docs/reviews/`, it is written once and never edited.

Node v22.22.2 (its SQLite 3.51.2), git 2.43.0, Linux, 4 cores. Every command runs
from the repository root with `GIT_DIR` and `GIT_WORK_TREE` unset. `<work>` is any
empty scratch directory outside the repository; the recorded outputs in `out/`
print it as `<work>`.

## Reproduce

```sh
E=middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence
W=<work>   # an empty scratch directory
# 1. Compile the three builds (git archive of each commit, this checkout's
#    ctxoracle/node_modules symlinked, npm run build).
sh $E/build-builds.sh $W "$PWD"
# 2. Build the real legacy stores A, B, C (throwaway HOME, CTXORACLE_HOME and git
#    repository per store). Output: out/build-stores.out.
sh $E/build-stores.sh $W > $W/build-stores.out 2>&1
# 3. The mapping table, generated from the prototype's RULES and the committed
#    layout SQL. Output: out/mapping-rules.out.
node --no-warnings $E/rebuild.mjs --print-rules
# 4. The test: a clean run, a re-run, a SIGKILL at each of 14 steps and a
#    completing run, per store, plus a store of another layout (D) and an
#    unreadable legacy file (E).
#    Output: out/test-rebuild.out.
node --no-warnings $E/test-rebuild.mjs $W
# 5. Would the test fail if the mapping were wrong? Seven one-rule mutants.
#    Output: out/mutants.out.
sh $E/mutants.sh $W
# 6. F5-6: a killed epoch recompute. Output: out/bench-epoch.out.
node --no-warnings $E/bench-epoch.mjs
# 7. F5-10: pass lock hold and handler wait, three configurations, five runs each.
#    Output: out/bench-checkpoint.out.
mkdir -p $W/ckpt
node --no-warnings $E/bench-checkpoint.mjs run $W/ckpt $W/HEAD auto 1 5
node --no-warnings $E/bench-checkpoint.mjs run $W/ckpt $W/HEAD gap 1 5
node --no-warnings $E/bench-checkpoint.mjs run $W/ckpt $W/HEAD gap 0 5
# 8. F5-14: V8's 2 ** x against 2^x computed exactly. Output: out/pow-check.out.
node --no-warnings $E/pow-samples.mjs 100000 | python3 $E/pow-check.py
# 9. F5-16: the round-3 bench's denylist.py and spawn_probe.mjs, re-run by the
#    procedure AD-12 and AD-23 now state. Output: out/f5-16-bench-rerun.out
#    (its commands are recorded in that file).
```

`out/facts.out` holds the `git` commands, and their output, that establish the
repository facts below.

## Inputs

- **Builds.** `b229c04` introduced the migration set HEAD still ships
  (`git diff --quiet b229c04 HEAD -- …/migrations` is empty). `59cc05c` is the last
  build on the `4dd0f00`/`4e070ce` set, and it already registers `tune`, `correct`
  and `note`. `HEAD` supplies what the new build would: the tuning seeds, reader
  and validator (`stores/dao/tuning.js`), AD-3's key rule
  (`identity/repo_key.js`), the FTS5 probe, and the files DAO the test uses for the
  first index's path upsert.
- **Stores.** Each is built by `build-stores.sh` in its own home
  `<work>/oracle{A,B,C}` over a seven-commit repository `<work>/repo{A,B,C}` made
  by `mkrepo.sh`:
  - **A.** `b229c04` layout. `init` by `b229c04`: it creates both stores, then
    stops at its first index with `table fts_paths has no column named path`,
    exit 1. Every verb and hook after that is by `b229c04`.
  - **B.** `b229c04` layout. `init` by HEAD (same migrations; 5 files indexed, 7
    commits mined). Every verb and hook after that is by `b229c04`.
  - **C.** `4dd0f00`/`4e070ce` layout. `init`, verbs and hooks by `59cc05c`, then
    verbs by `b229c04`. A later build opens this store without migrating it,
    because the runner returns on `schema_version >= 1`.
  - Each store was then written by these commands:
    - `tune` on a scalar key (`bar.confidence_floor 0.65`), a list key
      (`lexicon.stoplist`), an invalid value (`bar.recency_half_life_days 10`) and
      an unknown key (`bar.no_such_key 1`). No legacy build validates a `tune`.
    - `note` for a file fact, a repository fact, `--global`, and
      `--kind landmine`. The landmine is written by `59cc05c` only; `b229c04`
      answers `not built yet`.
    - Hook events: two sessions. S1 ends with `SessionEnd`. S2 stays live with
      an open question and a read.
    - `correct` with each verdict against the three answer-drift denies, one
      `correct` against a whisper, and `--missed-question`.
  - `synth.mjs` writes, through the named build's own DAOs, the rows no verb or
    hook of any build reaches: two whisper rows with file-id subject keys, and an
    invariant with two members.
- **Layouts.** `layouts/b229c04/` and `layouts/4dd0f00-4e070ce/` hold each set's
  migration SQL as committed (`git show <commit>:…`). `new-layout/` is the
  prototype's rendering of the first checksummed set AD-4 specifies: HEAD's 001
  plus `commits.weight`, `commit_touches`, `resolution_probes`,
  `lang_capabilities` and `file_parse`.

## Repository facts the mapping rests on (`out/facts.out`)

1. **Two layouts can hold owner-typed rows, not one.** `tune`, `correct` and
   `note` are first registered at `59cc05c` (2026-09-25 23:56). That build still
   ships the `4dd0f00`/`4e070ce` migrations. `b229c04` (2026-09-26 03:27) changed
   them. Store C shows the rows that build wrote. This contradicts the
   coordinator fact file (`2026-09-28-branch-audit-coordinator-fact-legacy-layouts.md`:
   "`dispatch.ts` registers all three from `b229c04`").
2. **Legacy `tune` sets every key, list keys included, to one row.** In every
   build `tune <key> <value>` is `tuning.set(…, 'owner')`, which deletes the key's
   `project_key IS NULL` rows and inserts one. No legacy build adds or removes a
   list member, so no legacy store records a removal by a row's absence.
3. **No build writes a non-NULL `whisper_audit.subject_key` or a delivered key.**
   Every genre generator returns `[]`, and the handler's whisper append names no
   subject key. `consumer_state` holds only `path:<path>` read keys.
4. **No build writes a `repo_path:` binding.** Every legacy build derives the key
   from git on each open (`openRepo` → `resolveRepoKey`). The global stores of A,
   B and C hold no binding.
5. **`correct --missed-question` writes no `corrections` row in any build.** It
   writes only a `questions` row, with the role key `main`.
6. **The fold and the regret proxy have no writer in the `b229c04` layout's
   builds.** The fold is a stub, and the handler carries `SKELETON: G32`.
7. **A read-only open of a WAL database with no `-wal`/`-shm` beside it creates
   them.** It creates an empty `-wal` and a `-shm` index. The database file itself
   is unchanged (store D in the test). A file that is not a database at all
   (store E) is of no known layout: it is rebuilt from the repository, unread.

## Results

- **Mapping table** (`out/mapping-rules.out`): every table and column of both
  layouts with its rule. The prototype refuses a legacy table that has no rule
  (`no rule for this table`).
- **Test** (`out/test-rebuild.out`): `1400 checks passed, 0 failed`, exit 0.
- **Mutants** (`out/mutants.out`): each of the seven fails the test.
- **F5-6** (`out/bench-epoch.out`):

  | Rule | Max relative ratio error vs a fresh recompute |
  |---|---|
  | As written | 1.000 (ratios read about 10⁻⁵ of their value) |
  | With `recompute_epoch` | 5.4 × 10⁻¹⁴ |

  The backward margin `1,022·h − 365.25·Y`:

  | h | Margin |
  |---|---|
  | 1.787 days | 0.06 days |
  | 1.8 days | 13.35 days |
  | 2 days | 217.75 days |
  | 20 days | 18,613.75 days |

- **F5-10** (`out/bench-checkpoint.out`), five runs each, 300 chunks per run:

  | Configuration | Pass hold, BEGIN → COMMIT return | Handler longest wait | Handler busy failures |
  |---|---|---|---|
  | Automatic checkpoint | 203.2–240.2 ms | 80.1–158.9 ms | 0 |
  | Pass `wal_autocheckpoint = 0`, PASSIVE in the gap, handler default | 78.4–134.5 ms | 253.9–334.2 ms | 0 |
  | Both `wal_autocheckpoint = 0` | 85.6–100 ms | 121–246.8 ms | 0 |

  The gap checkpoints themselves took up to 195.2–380.9 ms.

  SQLite runs the automatic checkpoint from the WAL hook, "after the commit has
  taken place and the associated write-lock on the database released"
  (`sqlite.org/c3ref/wal_hook.html`, fetched 2026-09-29). The configured
  checkpoint is a wrapper around that hook (`sqlite.org/c3ref/wal_autocheckpoint.html`).
- **F5-14** (`out/pow-check.out`): over 100,000 samples, the worst error is
  0.9507 ulp.
- **F5-16** (`out/f5-16-bench-rerun.out`):
  - `denylist.py` over Linguist `d0921d1`: `seed 38`, 2 extension exceptions,
    `filename exceptions 12`;
  - `spawn_probe.mjs`: p50 2.823, p95 9.557, max 15.838 ms.

## Not prototyped

- The lock databases and the re-check under them (AD-26).
- The first index and mine after the rename (the new indexer does not exist).
  The test checks instead that HEAD's path-keyed files upsert keeps a created
  row's id.
- The `status` text.
- The handler's spawn on `legacy_pending`.
- The rebuild of a legacy export inside `import`.
- The two cases AD-24 adds are designed but not run here: the F5-1 resume after
  a rebuild, and the F5-6 kill mid-recompute in the real miner.
  `bench-epoch.mjs` models the recompute's transactions over a small store. It
  is not the miner.
