# Context Oracle — Phase A implementation log

Running, append-only record of the Phase A build (`/expert-implement` against
`docs/plans/plan-phase-a.md`), one entry per step: **what was built**, the
**verification actually run** (command → observed result), and any **findings or
deviations**. This is the step-by-step build journal; `docs/STATUS.md` holds
current state and next steps, and `docs/collapse-log.md` holds durable
cross-session lessons.

Package tree: `ctxoracle/` (Node ESM, `tsc`-only build, `node:test`). Verified
locally on **Node v22.22.2** unless noted — the 22.16.0 `engines` floor itself is
exercised only by CI's matrix entry.

---

## Step 1 — package skeleton, toolchain, runner, fixtures, CI — DONE (commit 98bbfc7)

**Built.** `package.json` (type module; bin → `dist/src/cli/dispatch.js`; engines
`>=22.16.0`; pinned deps `web-tree-sitter@0.25.10`, `tree-sitter-wasms@0.1.13`,
dev `typescript@5.9.3`/`@types/node@22.20.1`/`@types/emscripten@1.41.6`; no
install/preinstall/postinstall) + committed `package-lock.json`; `tsconfig.json`
(strict, NodeNext, ES2022); `src/cli/dispatch.ts` bin stub; `scripts/run-tests.mjs`
(count-guarded runner); `test/build/tsc_fixture.ts`; `test/fixtures/generate.ts`
(26 deterministic fixture generators) + transcript fixtures; CI workflow
(Node 22.16.0 floor + current 22.x).

**Verified.** `npm run build` → clean; emitted `dist/src/cli/dispatch.js` first
line is `#!/usr/bin/env node` (shebang preserved). `npm test` → all green:
- **T-1-1** `npm ci` + `npm run build` succeed with no install-phase script; `dist/src/cli/dispatch.js` and `dist/test/**` present.
- **T-1-2 a/b/c** runner guard: empty compiled set → exit 1; source/compiled mismatch → exit 1; a failing compiled test → non-zero propagated.
- **T-1-3** all 26 fixtures generate deterministically (identical `git rev-list --all` across two runs).

**Findings / deviations.**
- The repo-root `.gitignore` globally ignores `package-lock.json`, but Step 1
  requires committing the lockfile (`npm ci`, T-1-1, CI). Added a package-scoped
  `ctxoracle/.gitignore` with `!package-lock.json` — a file not in the Step-1
  step-decl, added to satisfy the plan's own "commit the lockfile" requirement.
- Fixture-scenario fidelity: fixtures consumed only by later-step tests (Steps
  13–38) are generated as deterministic baseline repos now and enriched to their
  full planted scenario when their consuming step is built, so each scenario sits
  next to the test that verifies it (T-1-3 only requires deterministic, error-free
  generation). The `repo-key-*` fixtures are full-fidelity now (Step 5 uses them).
- Build-time testing lesson: a test that spawns `scripts/run-tests.mjs` from
  inside `node --test` must strip `NODE_TEST_CONTEXT` from the child env —
  otherwise the runner's own `node --test` grandchild inherits it, behaves as a
  child reporter, and exits 0 instead of non-zero, which would make T-1-2c falsely
  pass. In production the runner runs under `npm test` (no such var).

## Step 2 — runtime floor check (`assertRuntime`) — DONE

**Built.** `src/util/env.ts` — `assertRuntime(version = process.versions.node)`:
real numeric SemVer compare (major→minor→patch) against the 22.16.0 floor, with a
plain-language `Error` naming the current and required versions.

**Verified.** `node --test dist/test/unit/env.test.js` → green:
- **T-2-1** below-floor `22.15.9` and `22.9.0` throw; at/above `22.16.0`,
  `22.16.1`, `23.0.0` pass. The string-prefix trap `22.9.0` (sorts after
  `22.16.0` as a string, below it numerically) is correctly rejected.

## Step 3 — store adapter (single `node:sqlite` importer) — DONE

**Built.** `src/stores/adapter.ts` — the single seam that imports `node:sqlite`.
Exports `openStore` (WAL + `foreign_keys=ON` + `busy_timeout=100`, statement
cache), `Store` (`prepare`/`exec`/`transaction`/`integrityCheck`/`exportTo`/
`close`), `StoreBusy`, and `probeFts5`. `transaction` runs `BEGIN IMMEDIATE`,
retries **once** on SQLITE_BUSY (whether the busy hit acquiring the lock or
inside `fn`), and on the second busy raises `StoreBusy` (AD-26 fail-open); any
non-busy error rolls back and propagates unchanged. `exportTo` uses a
single-quoted `VACUUM INTO` literal (AD-5). Tests: `test/unit/stores_adapter.test.ts`
(T-3-1), `test/conventions/sqlite_single_importer.test.ts` (T-3-2),
`test/unit/concurrency.test.ts` + `test/unit/concurrency_worker.ts` (T-3-3),
`test/unit/fts5_probe.test.ts` (T-3-4).

**node:sqlite premises verified against the runtime before building** (not from
memory): WAL / `foreign_keys=ON` / `busy_timeout=100` set; STRICT rejects a
wrong-typed insert; FTS5 available; `PRAGMA quick_check` → `ok`; module-level
`backup()` present. Two corrections that changed the adapter:
- `VACUUM INTO` requires a **single-quoted** string literal — a double-quoted
  path is parsed as an identifier (`no such column`). `exportTo` single-quotes
  and escapes the destination path.
- SQLITE_BUSY surfaces as `err.errcode === 5` (message `database is locked`) —
  that is the retry-once / fail-open trigger for `Store.transaction`.

**Verified.** `npm test` → all green (T-3-1/2/3/4 pass alongside the Step 1–2
regressions; 10 tests total):
- **T-3-1** `openStore` returns `journal_mode=wal`, `foreign_keys=1`,
  `busy_timeout=100`; a STRICT table round-trips and rejects a wrong-typed
  insert; the rejected insert rolls back (row count unchanged).
- **T-3-2** a built-output scan of `dist/src/**/*.js` finds `node:sqlite` in
  exactly `stores/adapter.js`; a seeded second importer is detected and the scan
  is clean again once removed.
- **T-3-3** three contending writer processes, sequenced by filesystem markers
  (never by the clock): A holds `BEGIN IMMEDIATE`; C fails open with `StoreBusy`
  while A holds and writes nothing; B contends then succeeds after A releases.
  Final committed set is exactly `['A','B']` — C's failed-open transaction left
  no partial write. (~356 ms: C exhausts two 100 ms busy windows.)
- **T-3-4** `probeFts5` returns `true` and leaves no `_fts5_probe` table behind.

**Findings / deviations.**
- **T-3-2 flagged `util/env.js` (a Step-2 file).** The plan's T-3-2 spec is a
  strict substring scan — "the sole file *containing* `node:sqlite`" (plan
  line 1110–1112) — deliberately stricter than an import-only scan (it also
  catches `require`, dynamic import, and string-built specifiers). My Step-2
  `env.ts` comment named the raw `node:sqlite` specifier while explaining the
  22.16.0 floor, so it tripped the convention. Fix: reworded `env.ts` to say
  "built-in SQLite" and note the raw specifier lives only in
  `src/stores/adapter.ts`. Meaning unchanged; T-2-1 still green. (The plan's
  Gate-3 prose says "imports" while its test-spec sentence says "containing";
  I honored the concrete test-spec, the stricter and enforceable form.)
- **Added `test/unit/concurrency_worker.ts`, not in the S3 create list.** T-3-3
  is specified as three child processes the parent sequences by observables;
  that inherently needs a separate worker entry point (a single process cannot
  hold `BEGIN IMMEDIATE` across an async wait while also coordinating the
  others). The name has no `.test` suffix, so `run-tests.mjs` neither counts nor
  runs it and the tier count guard stays balanced. This is a plan-required
  helper, the same category as Step 1's `.gitignore`.
- **B's exact retry count is not asserted** — and cannot be, deterministically:
  whether B's write lands inside its first attempt's `busy_timeout` window or on
  the one explicit retry depends on sub-100 ms scheduling no process-level
  observable can pin down. The at-most-one-retry bound is structural in
  `adapter.ts` (a two-iteration loop) and its give-up branch is exercised by C;
  asserting an exact count would only make the test flaky. What is asserted is
  the AD-26 contract itself: a contended writer either succeeds or fails open
  cleanly with `StoreBusy`, leaving no torn write.

## Step 4 — `~/.ctxoracle/` layout, 0700 permissions, `CTXORACLE_HOME` — DONE

**Built.** `src/identity/home.ts` — `ctxoracleHome()` resolves
`$CTXORACLE_HOME || ~/.ctxoracle`, the single place the default location is
decided. `src/identity/layout.ts` — `ensureLayout(home, repoKey)` creates the
`<home>`, `<home>/global`, `<home>/projects`, `<home>/projects/<repoKey>`, and
`.../diagnostics` directories at **0o700** (explicit `chmod` after `mkdir`, so
the mode does not depend on umask), and returns the `global.db`/`store.db` file
paths, the diagnostics dir, and `looseMode` — the pre-existing layout dirs
looser than 0o700. Loose dirs are **reported, never `chmod`ed** (AD-3: the store
may already hold the owner's data). The `.db` files are not created here — that
is the migration steps' job.

**Verified.** `npm test` → 12/12 green (2 new + Step 1–3 regressions):
- **T-4-1a** an empty home: every layout directory is created at 0o700,
  `looseMode` is empty, returned paths are correct, and `global.db`/`store.db`
  are *not* created by `ensureLayout`.
- **T-4-1b** a pre-existing `projects/<key>` at 0o755: `looseMode` is exactly
  `[projectDir]`, its mode is left at 0o755 (never chmod-ed), and newly created
  dirs (`global`, `diagnostics`) are still 0o700.

**Findings / deviations.**
- `statSync().mode` typed as `number | bigint` (the BigInt overloads leak
  through `ReturnType<typeof statSync>`), so `mode & 0o077` failed `tsc`. Fixed
  by typing the local as `Stats` and importing `type Stats` from `node:fs`.
- Loose = `(mode & 0o077) !== 0` (any group/other rwx bit). Setuid/setgid/sticky
  are out of scope — the ASVS V14 concern here is owner-only *access*, and T-4-1
  exercises exactly the 0o755 case.

## Step 5 — repo identity resolver + guarded spawn seam — DONE

**Built.**
- `src/util/hash.ts` — `sha256Hex` / `sha256Short` (`node:crypto`, a stable core
  module, so no single-importer quarantine).
- `src/util/spawn.ts` — the ONLY `node:child_process` importer (AD-21). Exports
  `oracleSpawn`, `oracleExecFileSync`, and `SCRUBBED_ENV`. `childEnv` always
  sets `CTXORACLE_INTERNAL=1` (recursion guard as a structural property) and, on
  `scrub: true`, deletes exactly the six session-identity vars; auth/routing vars
  are inherited untouched. `oracleExecFileSync` pipes stdout+stderr and returns
  stdout; on a non-zero exit it throws the standard error carrying `.status` and
  `.stderr`, which the resolver catches.
- `src/identity/repo_key.ts` — `resolveRepoKey` (the four rules in order) and the
  exported pure helper `normalizeRemoteUrl`. Every git call goes through
  `gitProbe` → `oracleExecFileSync`, returning `{ok,stdout}|{ok:false,code,stderr}`.
  Key = first 12 hex of SHA-256 over the identity string (root commit / normalized
  URL / real path). Path-mode results carry a `diagnostic.detail` naming the
  command and exit code.

**Verified.** `npm test` → 19/19 green (7 new + Step 1–4 regressions):
- **T-5-1a** `repo-key-full` → mode `commit`, identity a 40-hex root hash, no
  diagnostic; the key is stable across two independent deterministic generations
  and distinct from its shallow clone's key.
- **T-5-1b** `repo-key-shallow` → mode `url`, identity `github.com/Owner/Repo`.
- **T-5-1c** `repo-key-shallow-no-origin` → mode `path`.
- **T-5-1d** `repo-key-nongit` → mode `path` with a diagnostic naming exit 128.
- **T-5-1e** the normalization table: five forms collapse to
  `github.com/Owner/Repo`; explicit port and path case stay distinct; a bare
  local path and a `file://` URL return `null`.
- **T-5-2** the guard is set with and without scrub; `scrub: true` drops exactly
  `SCRUBBED_ENV` and keeps `ANTHROPIC_BASE_URL` / `CLAUDE_CODE_USER_EMAIL` / `PATH`.
- **T-5-3** only `util/spawn.js` imports child_process; both `'node:child_process'`
  and `'child_process'` seeds are detected and the scan is clean once removed.

**Findings / deviations.**
- **`RepoKey` carries an optional `diagnostic` field, an extension of the plan's
  declared `{ key, mode, identity }` shape.** T-5-1 requires asserting the
  non-git result's diagnostic (detail names exit 128) *at Step 5*, but the JSONL
  fault channel (Step 6) does not exist yet. The resolver therefore returns the
  diagnostic in-band (`diagnostic?: { detail }`), present only on a
  failure-driven path-mode fallback; `init` (Step 31) will convert it to a fault.
  This is the minimal way to make T-5-1 testable now without prejudging Step 6's
  `FAULT_CODES` (detail is a human string, not yet a fault code).
- **T-5-3 is an import-specifier scan, not the substring scan T-3-2 uses.** The
  plan specifies T-5-3 that way ("every import/export … from specifier and every
  `import()` string literal", both spellings), so a comment naming the module —
  including `spawn.ts`'s own doc comment — is not a false positive. Implemented
  with three anchored regexes (static `from`, side-effect `import`, dynamic
  `import()`), verified by seeding one file of each spelling.
- **The two convention tests are parallel-safe.** `node --test` runs test files
  in separate processes concurrently; both seed files into `dist/src`, but each
  scans for its own module string and the seeds are orthogonal, so neither
  perturbs the other's clean-state assertion. **(Corrected at Step 6 — see
  below: orthogonal *content* was not enough; the scan also had to survive a
  foreign seed vanishing mid-scan.)**

## Step 6 — shared types, fault codes, JSONL fault channel, trust — DONE

**Built.**
- `src/diag/fault_codes.ts` — `FAULT_CODES`, a 23-entry `as const` tuple (the
  AD-17 list incl. the two reserved codes, `store_busy`, and the six codes this
  plan names), with `FaultCode = (typeof FAULT_CODES)[number]`. Not an enum, so
  the one declaration is both the runtime list `status` renders and the type.
- `src/diag/jsonl.ts` — `appendFault(diagnosticsDir, {code, detail, session?})`:
  a direct file write (never through the store, AD-17), one JSON line per fault,
  `open('a', 0o600)` + `fchmod 0o600` (umask-independent) + `fsync` before return.
- `src/security/trust.ts` — `Trust` union, `TRUST_VALUES`, `isTrust`, and
  `assertProvenance` (FR-X4).
- `src/types/events.ts` — `EventKind` (the eight AD-6 wire event names),
  `Consumer`, `StartSource`, `InternalEvent`, `ObservedActionsReader`,
  `EventContext`. `src/types/candidate.ts` — `Pointer`, `FactClass`, `Candidate`,
  `TuningReader`. `src/types/index_types.ts` — `SymbolRow`, `ImportEdge`. All
  type-only (erased at build).

**Verified.** `npm test` → 21/21 green across five consecutive runs (2 new + the
Step 1–5 regressions):
- **T-6-1** `FAULT_CODES` equals the enumerated 23-code set (runtime deepEqual),
  has no duplicates, and the expected list typed `FaultCode[]` is the compile-time
  half (a divergence between tuple and union fails `tsc`).
- **T-6-2** three `appendFault` calls (the third a fresh open = "writer restart")
  accumulate three parseable lines with details intact; file mode is 0o600.

**Findings / deviations.**
- **`assertProvenance`'s exact laundering contract is provisional.** The plan
  states the rule twice with slightly different emphasis (Step-9 prose: "accept
  only `untrusted_repo` unless every input is human-provenance"; T-9-1 example: a
  `trust='untrusted_repo'` write with a human-provenance input is rejected). I
  implemented exact-match — human input ⇔ `trust='human'`, laundering rejected in
  both directions — taking `{trust, inputsAreHuman}`. Step 6 has no test for it;
  its behavioral gate is **T-9-1** (Step 9), where I will confirm the shape
  against the real DAO entry points and adjust if needed.
- **Several shared types carry provisional signatures** finalized at their
  consuming step: `ObservedActionsReader` (concrete reader built at Step 10),
  `TuningReader` (Step 12), `EventContext.repoKey` as the key string,
  `StartSource`/`Consumer` value sets. The plan mandates these types exist by
  Step 6 (topological order); a consuming step may `modify` a shape as it needs.
- **Parallel-scan race in the single-importer convention tests (real bug,
  fixed).** With Step 6's added files, `node --test`'s parallel scheduling made
  the sqlite and child_process convention tests overlap. Each scan does
  `readdirSync` then `readFileSync` per entry; a foreign seed enumerated by one
  scan was deleted by the other's `finally` before the read → `ENOENT` crash
  (not a content collision — the Step-5 note's "orthogonal content" was
  necessary but not sufficient). Fixed by making both scans ENOENT-tolerant
  (`readOrEmpty` returns `''` for a vanished file), which is also correct for
  scanning a live `dist/` tree. Confirmed stable over five full-suite runs. This
  will recur for every future single-importer convention test (e.g. T-24-2), so
  it is also recorded in `docs/collapse-log.md`.

## Step 7 — SQL migrations: Phase A project store — DONE

**Built.**
- `src/stores/migrations/001_phase_a_project.sql` — every AD-4 Phase A project
  table, STRICT, with the PROV block (prov_kind/prov_ref/trust/injection_suspect
  CHECKs + created_at/updated_at) expanded inline on each knowledge table, the
  `corrections` whisper/deny exclusive-or CHECK, the `q_open_dedup` partial
  unique index, the two LIKE-fallback indexes, and the two plan columns
  (`observed_actions.content_hash`, `regret` table).
- `src/stores/migrations/001b_phase_a_fts.sql` — the two FTS5 virtual tables,
  applied only under `fts_state='fts5'`.
- `src/stores/migration_runner.ts` — `applyMigrations(store, {fts, scope?})`,
  forward-only, scoped. `readSql` reads from `../../../src/stores/migrations`
  (resolved from the compiled runner's `import.meta.url`).

**Verified.** `npm test` → 25/25 green (4 new + Step 1–6 regressions):
- **T-7-1a** `fts:true` → `fts_state='fts5'`, `fts_symbols`/`fts_paths` present,
  LIKE indexes present, no forbidden Phase B/C table.
- **T-7-1b** `fts:false` → `fts_state='fallback'`, no fts_* table, LIKE indexes
  present; a re-run with `fts:true` does not flip the state or add an fts table.
- **T-7-1c** every CHECK-constrained column rejects its negative (zone; the PROV
  prov_kind/trust/injection_suspect on all six PROV tables; landmines.kind;
  cochange `a<b`; corrections verdict + XOR; consumer_state.kind;
  observed_actions command_class/outcome; regret's three enums; whisper_audit
  .kind; classified_turns clears/reason; questions status/closed_by_kind), and a
  valid row is accepted on each.
- **T-7-1d** the open-scoped dedup index enforces open → duplicate-open rejected
  → answered → re-open accepted.

**Findings / deviations.**
- **`applyMigrations` takes a `scope` (default `'project'`), an extension of the
  plan's abbreviated `applyMigrations(store, {fts})` signature.** The plan
  applies the runner to *both* stores — 001/001b to the project store, 002 to the
  global store (lines 3579–3580, 3976–3979) — and T-7-1 forbids project↔global
  table bleed (T-8-1 requires the global store hold *exactly* the four tables). A
  single fts-only signature applied uniformly cannot separate the two sets; the
  filenames encode `project`/`global`/`fts`, so a scope selector is the only
  design consistent with both tests. Default `'project'` matches the plan's
  project call shown without a scope; the global caller (Step 8 test, Step 28/31)
  passes `scope:'global'`. The global branch reads `002_*.sql`, created next in
  Step 8 (never invoked by Step 7's tests).
- **Version tracking is a single Phase-A version (`schema_version='1'`) per
  store's meta table**, with `fts_state` (not the version) governing 001b
  idempotency — so a re-run short-circuits on `version>=1` and never retries the
  fts branch, exactly what T-7-1b asserts.

## Step 8 — SQL migrations: Phase A global store — DONE

**Built.** `src/stores/migrations/002_phase_a_global.sql` — the four AD-5 global
tables (`global_meta`, `whisper_stats`, `tuning`, `lessons`; `lessons` carries
the PROV block), STRICT, no `env_capabilities`. Applied by the Step-7 runner's
`scope:'global'` branch (which already existed); no runner change needed.

**Verified.** `npm test` → 26/26 green (1 new + regressions). **T-8-1** migration
002 yields exactly `{global_meta, lessons, tuning, whisper_stats}` and no
`env_capabilities`.

**Findings / deviations.** None — mechanical from AD-5, same type resolution as
Step 7.

## Step 9 — DAOs for every Phase A table + ULID — DONE

**Built.** `src/util/ulid.ts` (Crockford-base32 ULID: 10-char time + 16-char
random). One factory per table in `src/stores/dao/` (24 files): `schemaMetaDao`,
`globalMetaDao`, `filesDao`, `symbolsDao`, `importEdgesDao`, `symbolRefsDao`,
`testMapDao`, `commitsDao`, `cochangePairsDao`, `landminesDao`, `invariantsDao`,
`humanFactsDao`, `correctionsDao`, `questionsDao`, `classifyStateDao`,
`consumerStateDao`, `sessionLogDao`, `observedActionsDao`, `regretDao`,
`classifiedTurnsDao`, `whisperAuditDao`, `faultsDao`, `whisperStatsDao`,
`lessonsDao`. Each is a thin prepared-statement wrapper (no cache, no async);
timestamped tables take ULID ids; `whisper_audit.append` returns its id
synchronously (AD-8). The must-fail fixture `test/build/fixtures/missing_provenance.ts`
+ `test/build/typecheck_provenance.test.ts`.

**Verified.** `npm test` → 30/30 green (T-9-1's three subtests + T-9-2 + the
Step 1–8 regressions):
- **T-9-1** structural, knowledge, and session/diagnostic DAOs each
  create/read/update/delete against the STRICT schema; ids match the ULID regex;
  `whisper_audit.append` returns a string (not a Promise); FR-X4 laundering
  (`prov_kind='human'` with `trust≠'human'`, or repo provenance with
  `trust='human'`) throws at the DAO entry.
- **T-9-2** the fixture calling seven knowledge writes without provenance fails
  `tsc` (compiled via `compileFixture`; asserted non-zero with prov/argument
  diagnostics). `@ts-expect-error` is deliberately NOT used — it would suppress
  the errors and let the fixture compile, the exact thing T-9-2 catches.

**Findings / deviations.**
- **`src/security/trust.ts` (a Step-6 file) was modified**, outside Step 9's
  declared `modify: []`. Added `ProvKind`, `Provenance`, and `provCreateValues`
  (validate FR-X4 + expand the six PROV columns) there because it is the
  provenance/trust home and no shared DAO-types file exists in the create list.
  This confirms Step 6's provisional `assertProvenance` contract: the DAO derives
  `inputsAreHuman = (prov_kind === 'human')` and the existing helper rejects both
  laundering directions — no Step-6 rewrite needed.
- **Several read methods carry provisional semantics, finalized at their
  consuming step** (each round-trips correctly now): `session_log.livenessRows`
  (open = latest event ≠ SessionEnd — Step 10/33), `classified_turns.sinceQuestionOpened`
  (turns at/after the newest open question, via a `questions` join — Step 26),
  `whisper_audit.deliveredSubjects` (distinct whisper genres — Step 19),
  `observed_actions` tool classification (EDIT/READ/Bash sets — the handler,
  Step 25/28), and `cochange_pairs.bump`'s `a_count`/`b_count` (incremented per
  bump alongside `pair_count`; the miner, Step 13, owns the real per-file counts).
- **`landmines.upsert` dedups in code on `(kind, file_id, evidence)`** — there is
  no natural unique key besides the ULID id, so re-mining the same landmine
  updates its `support` rather than inserting a duplicate.
- **The entire `test/build/` tier was silently gitignored (real defect, fixed).**
  The repo-root `.gitignore` has a bare `build/` rule that matches *any* directory
  named `build`, including `ctxoracle/test/build/`. So Step 1's `tsc_fixture.ts`
  was created locally but **never committed** — and the build-test tier has been
  absent from CI since Step 1 (it just happened to hold no `*.test.ts` until now,
  so nothing failed). Step 9's T-9-2 lives there and imports `tsc_fixture`, so it
  would have failed on a fresh checkout. Fixed by adding a scoped exception to
  `ctxoracle/.gitignore` (`!test/build/` + `!test/build/**`), the same class as
  the earlier `!package-lock.json` re-inclusion; compiled output stays ignored
  under `dist/`. This commit therefore also adds the previously-uncommitted
  `test/build/tsc_fixture.ts`.

## Step 10 — session_log/faults writers, watchdog deadline, recursion guard — DONE

**Built.**
- `src/diag/session_writer.ts` — `writeSessionEvent(store, event)`, the sole path
  to the session_log table (returns the ULID).
- `src/diag/fault_writer.ts` — `recordFault(store | null, diagnosticsDir, fault)`
  mirror-writes to the faults table (best-effort; swallows a store failure) AND
  always to the JSONL channel, so a corrupt store still self-reports (AD-17).
- `src/hook/watchdog.ts` — `DeadlineExceeded`, `createDeadline({ms=2500, now})`
  with an injectable clock; `check()` throws once elapsed ≥ ms, `elapsed()` reads
  the clock.
- `src/hook/guard.ts` — `isInternal(env)` = `env.CTXORACLE_INTERNAL === '1'`.

**Verified.** `npm test` → 35/35 green (5 new + regressions):
- **T-10-1** a corrupt store (byte 0 overwritten) surfaces `store_corrupt` on the
  JSONL channel with reproducing detail, through `recordFault` (store handle null
  because the corrupt open throws).
- **T-10-2** `elapsed()` is within ±5 ms of an independent `performance.now()`
  delta across a 50 ms span, five runs.
- **T-10-3** the writers-only import scan: faults.js / session_log.js importers
  are within their allow-lists; a seeded rogue importer is detected.
- **T-10-4** the deadline is not-fired at 2499 and fired at 2500/2501 under a
  fake clock; `isInternal` is true only for `'1'`.

**Findings / deviations.**
- **T-10-3's allow-lists name reader modules not yet built** (`diag/status.js`,
  `diag/log.js`, `diag/regret.js`). The convention is a subset check (actual
  importers ⊆ allow-list), so their absence is fine now and they are pre-approved
  when they arrive; ENOENT-tolerant scan for parallel safety (per the Step-6
  collapse-log lesson).
- **T-10-1's `store` handle is null** in the caught branch because opening a
  header-corrupt SQLite file throws during `openStore`'s first PRAGMA — so
  `recordFault(null, …)` exercises the JSONL-only fallback, which is exactly the
  store-dead path AD-17 requires.

## Step 11 — security: redactor + injection flagger + trust compile guard — DONE

**Built.**
- `src/security/redact.ts` — `redact(input, {entropyBitsPerChar, minTokenLength})`
  → `{redacted, count}`. Named patterns (PEM, AWS `AKIA…`, GitHub `ghp_`/
  `github_pat_`, JWT, credential `KEY=value`) applied first, then a
  Shannon-entropy heuristic over remaining tokens; marker `[redacted:<kind>]`.
  Thresholds default 4.0 bits/char and 20 chars; callers pass the Step-12 tuning
  rows, tests pass literals.
- `src/security/injection.ts` — `isSuspect(input)`: a heuristic regex lexicon
  (instruction-override, role-play/jailbreak, assistant-directed imperatives),
  tuned to leave README/comment/commit prose alone.

**Verified.** `npm test` → 40/40 green (5 new + regressions): T-11-1 (each secret
shape redacted, marker well-formed, secret gone), T-11-2 (variable/url/hex/short-
base64/unicode/low-entropy-identifier all untouched), T-11-3 (three payloads
flagged), T-11-4 (three prose samples not flagged), T-11-5 (`'trusted'` assigned
to a `Trust` variable fails `tsc`).

**Findings / deviations.**
- The redactor runs named patterns before the entropy pass, so a matched secret
  (e.g. a 36-char GitHub token that is also high-entropy) is counted once, and
  the inserted markers (short, dictionary words) never re-trip the entropy pass.
- The T-11-2 low-entropy negative uses a repetitive 24-char token
  (`datadatadatadatadatadata`, entropy ≈1.5) to sit unambiguously below the 4.0
  threshold — a realistic identifier can approach 4.0, and the point of the case
  is a below-threshold token, so an unambiguous one keeps the test deterministic.

## Step 12 — tuning DAO + default seeding + Checkpoint 1 — DONE

**Built.**
- `src/stores/dao/tuning_seeds.ts` — the single seed source: `SCALAR_SEEDS`
  (9 `architecture_default` + 11 `plan_seed`) and `LIST_SEEDS` (6 lexicon lists +
  `index.ext_to_grammar`, the 32-grammar table as `<ext>=<grammar>` members).
- `src/stores/dao/tuning.ts` — `tuning.get/set/list/addToList/removeFromList`
  (scalar = one row with `project_key` NULL; list = one row per member, ordered
  by rowid) and `seedDefaults(store)`, idempotent: it seeds only a key entirely
  absent, so an owner `tune` edit is never reset.

**Verified.** `npm test` → 41/41 green. **T-12-1**: after `seedDefaults`, every
scalar/list key reads back with its value and `source`; a scalar set (owner) and
a list add/remove round-trip; a second `seedDefaults` is a byte-identical no-op
and does not reset the owner-edited scalar.

**Checkpoint 1 — the substrate — reached.** Ran the full suite (T-1-1…T-12-1,
41 tests, count guard balanced) plus the owner-visible sanity check on a freshly
migrated + seeded store: 22 STRICT Phase A project tables (all STRICT; the 12
non-STRICT objects are the fts5 virtual + shadow tables), `files` carries its
zone/trust/injection_suspect CHECKs, and `tuning` holds 150 rows across
`architecture_default`/`plan_seed` with `bar.confidence_floor=0.6` and 51
`index.ext_to_grammar` members. The store substrate and every DAO/writer/security
seam the downstream steps plug into are in place.

**Findings / deviations.**
- **`index.ext_to_grammar` is seeded here (Step 12) but its 32-grammar table is
  defined at Step 15.** The plan makes it a Step-12 `architecture_default` seed,
  so the table lives in `tuning_seeds.ts` now (from the plan's Step-15
  enumeration, §4 exclusions of elm/ql/yaml/bash); Step 15's `defaultFrontends`
  will read it from here rather than redefining it.
- **`tuning.get` resolves only the project-global row (`project_key` NULL).** The
  Step-12 signature is `get(store, key)` with no project_key; per-project
  override resolution, if a later step needs it, is an additive extension.

## Walking skeleton, Steps 13–39 — IN PROGRESS (2026-09-25)

The build method was changed to a walking skeleton on 2026-09-25 (reason in
`docs/STATUS.md`). Each step is first built as a thin version that does its
minimum real work, connected to the steps around it, so the gaps show up in one
pass. Skeleton code sits at the plan's file paths. Every provisional choice in it
is marked `SKELETON: G<n>` in the source and listed below. The full build of each
step replaces those marks with reviewed decisions.

### Skeleton gap list

Each entry: the gap, where it surfaced, the evidence, and the provisional
skeleton choice. The choice is not the decision; the decision comes from the one
independent review of this list.

- **G1 — landmine labels have no input.** Step 13's prescribed `git log
  --format=%x1e%H%x00%at%x00` carries no commit message, yet `revert_chain` and
  `fix_chatter` need "revert-labelled" and "fix-labelled" commits, which no
  document defines. *Skeleton:* the format gains `%s%x00`. A revert is a subject
  starting with `Revert "` or `Reapply "`; git 2.43.0 writes both (executed).
  A fix is a subject with an SZZ-style keyword (`fix|fixes|fixed|fixing|bug|
  bugfix|hotfix`), and a revert never also counts as a fix.
- **G2 — no `files` row for history-only paths.** `cochange_pairs.a/b` and
  `landmines.file_id` are foreign keys to `files(id)`, with `foreign_keys = ON`.
  Step 13 runs before the indexer exists, and a renamed-away or deleted path never
  gets an indexer row. *Skeleton:* the miner writes a placeholder row (`lang`/`zone`
  `unknown`, `content_hash` empty, `mtime` 0, provenance
  `commit`/`untrusted_repo`). Still open: how Step 14's `files.deleteMissing`
  cascade treats those rows.
- **G3 — per-file change totals; a schema flaw in AD-4.** `a_count` and `b_count`
  hold a file's total change count on every pair row. That depends on the file
  alone, not on the pair, which breaks second normal form. A file changing on its
  own has no row to count in, so `confidence = pair_count / a_count` goes wrong.
  *Skeleton:* keeps Step 9's stand-in (both counts bumped with `pair_count`). The
  fix is an architecture change: a per-file count stored once per file.
- **G4 — history rewrite.** "Full re-mine plus a diagnostic" names no fault code,
  and does not say what gets cleared first, so without clearing, commits are
  counted twice. *Skeleton:* an unreachable watermark falls back to a full mine
  with no clearing and no fault.
- **G5 — incremental landmines.** A `watermark..HEAD` pass cannot recount earlier
  labelled commits, and aged-out `fix_chatter` rows have no removal rule.
  *Skeleton:* landmines come from the current pass only.
- **G6 — Step 13's declaration.** T-13-1 needs a parser entry point (the skeleton
  exports `parseNumstatZ`), and the `miner-hygiene` fixture needs to be built out
  in `test/fixtures/generate.ts`. Neither appears in the step declaration.
- **G7 — UTF-8 decoding of paths.** `oracleExecFileSync` decodes stdout as UTF-8,
  and so does the indexer's `readdir`. Both sides match, but two distinct
  non-UTF-8 filenames collapse to the same key. *Skeleton:* accepted as is.
- **G8 — the tuning store is never passed (cross-cutting).** `tuning` lives in the
  global store (migration 002). The plan's signatures for Step 13
  (`mineCochange(store, …)`), and by the same pattern every later reader of a
  threshold, pass only the project store. Found by running the skeleton: `no such
  table: tuning`. *Skeleton:* `mineCochange` takes `opts.global`. The full build
  needs one convention for handing both stores to every component.
- **G9 — transactions do not nest.** `Store.transaction` throws "cannot start a
  transaction within a transaction", and DAOs such as `landmines.upsert` and
  `tuning.set` open their own. So a caller cannot write a batch atomically, such as
  the watermark together with its landmines. Found by running the skeleton.
  *Skeleton:* landmine writes happen after the main transaction.
- **G10 — `node:sqlite` prints an ExperimentalWarning to stderr** on every process
  that opens a store, which includes every hook invocation. Whether stderr from a
  hook is shown to the user or treated as an error is to be checked against the
  hooks reference at Step 28.

- **G11 — the file walk and the unfinished index outputs.** The plan says
  `runIndex` "walks the working tree respecting `.gitignore`". *Skeleton:* it asks
  git for the file list (`git ls-files -z --cached --others --exclude-standard`)
  rather than re-implementing gitignore matching. The paths are git's raw `-z`
  keys, the same ones the miner uses. `symbol_refs` and `test_map` are not
  produced yet, and `entry_score` is just the path marker plus import in-degree.
- **G12 — import resolution is undefined.** T-15-1 wants an "import edge
  resolving to the imported file", but no rule says how a specifier becomes a
  file. *Skeleton:* only relative specifiers resolve. It tries the path as
  written, then TypeScript's `.js`→`.ts` convention, then added extensions, then
  `/index.*`; bare package specifiers give no edge. On this repo the rule
  resolved all 13 of `indexer.ts`'s imports correctly.
- **G13 — the per-language queries are not written.** Step 15 requires
  "per-language tree-sitter queries" for 32 grammars and supplies none. *Skeleton:*
  queries exist for typescript, tsx, javascript and python only; every other
  grammar in the table goes to the generic frontend.
- **G14 — async grammar loading behind a sync `parse`.** web-tree-sitter's
  `Parser.init` and `Language.load` return promises, the plan's
  `LanguageFrontend.parse` is synchronous, and the plan says grammars load "lazy
  per first use". Those three cannot all hold. *Skeleton:* the interface gains an
  optional `init()`, which `runIndex` (now async) awaits before parsing. Related:
  a frontend has no store to hand, so `frontend_parse_failed` goes to the JSONL
  channel only.
- **G15 — oversize files get no fault code.** Files over 1 MB or 20k lines are
  "path-only with a diagnostic", but no fault code exists for that. *Skeleton:*
  nothing is recorded (8 such files in this repo).
- **G16 — the FTS path index never matches a path segment (a schema bug).**
  `001b_phase_a_fts.sql` creates `fts_paths` with `tokenchars '/_-.'`, which makes
  those characters part of a token, so a whole path is a single token. Found by
  running the skeleton: `pathSearch(['cochange'])` returns nothing under FTS5,
  while the `LIKE` fallback finds `…/miner/cochange.ts`. T-15-3's check that "the
  FTS and `LIKE` hit sets agree" would fail. The fix is a tokenizer where `/`,
  `.`, `_`, `-` separate tokens (the unicode61 default).

- **G17 — the concrete `TuningReader` was never built.** Step 6's `TuningReader`
  interface says "Step 12 builds the concrete `TuningReader`" (re-seed a missing
  key, record `tuning_missing`), but Step 12 built only `tuning.get(store, key)`.
  *Skeleton:* `tuningReader(global)` in `tuning.ts` reads, but does not re-seed or
  record.
- **G18 — the bar's inputs are not on `Candidate`.** AD-14's decision-impact axis
  (edit vs read context, blast-radius band, zone) and marginal-value axis
  (single-file vs cross-file, comparative), plus the trust cap, read
  per-candidate properties that Step 6's `Candidate` type does not have.
  *Skeleton:* optional `context`, `blastRadius`, `zone`, `crossFile`,
  `comparative` and `trust` fields.
- **G19 — the reference instant is never stored.** The recency dampener measures
  `age_days` "back from Step 13's reference instant" (HEAD's committer time), but
  the miner keeps it nowhere and `passesBar`'s context has only `indexStale`.
  *Skeleton:* `ctx.refTs` is passed in.
- **G20 — the trust cap has no value.** "Capped by trust (`untrusted_repo` can
  never yield high-confidence)" names no cap. Every Phase A mined fact is
  `untrusted_repo`, so any cap below the 0.6 floor would silence every history
  genre. *Skeleton:* no cap.
- **G21 — genres cannot see the tool's target.** Coupling, Consequence and Warning
  need the file a tool call targets, and Reuse the term a search used. AD-6 lets
  only the adapter name tool-input fields, and `InternalEvent` carries neither.
  *Skeleton:* `targetPath` and `searchTerm` on `InternalEvent`, filled by the
  adapter.
- **G22 — no edited-file list on the reader.** `ObservedActionsReader` returns
  counts only; Completeness and Verification need the files that were edited.
  *Skeleton:* the DAO's `pathWrites` is read directly.
- **G23 — dedup identity is too coarse.** `consumer_state` is keyed by consumer
  (`main`/`subagent`) with no session. Every subagent shares one dedup set, and
  concurrent sessions on one repo share `main`'s.
- **G24 — no rule for the headline text.** AD-19 says composition is pointer-only
  with no verbatim repo-derived text, yet the genres build a headline string from
  repo paths. *Skeleton:* the composer renders from pointers and numbers only and
  ignores the genre's headline.
- **G25 — subject keys never line up.** The read set records `path:<file>`, while
  candidates are keyed `coupling:<target>:<partner>` and similar. With no shared
  subject vocabulary, "don't tell the agent what it already read" never matches
  anything.

- **G26 — a fixture contradicts the rule it tests.** The plan's human-turn rule is
  `origin.kind === 'human'` and not `isMeta`. The Step 1 fixture
  `test/replay/transcript_fixtures/human_markers.jsonl`, meant to hold
  "marker-carrying human turns", has no `origin` field at all. The rule is the
  correct one: in this session's real transcript (2026-09-25), all 25 human turns
  carry `origin: {"kind": "human"}` with string content, tool results carry no
  origin, and hook feedback is `isMeta: true`. So the fixture needs the marker
  added. Taken as written, a test built on it would count an unmarked entry as
  human.
- **G27 — `decideDeny` cannot write its audit row.** The plan's signature is
  `decideDeny(store, consumer, toolName, toolInput)`, but the `whisper_audit` row
  it must append needs a session. It also names `toolInput.file_path`, which AD-6
  allows only the adapter to name (see G21). *Skeleton:* `decideDeny(store,
  session, consumer, toolName, targetPath)`.
- **G28 — the bookmark cannot be null.** Step 27 says `startup`/`clear` reset the
  bookmark "to null", but `classify_state.bookmark_offset` is `NOT NULL DEFAULT 0`.
  *Skeleton:* it resets to 0.
- **G29 — the consumer key is two different things.** Step 28's handler derives
  the consumer key as `(session_id, agent_id | 'main')`. Step 6 types `Consumer` as
  `'main' | 'subagent'`, `decideDeny` tests `consumer !== 'main'`, and every
  consumer-keyed table (`questions`, `classify_state`, `consumer_state`) stores
  only the string. This is the same defect as G23, at its source. As built, a
  question open in one session denies edits in any other session on the same
  repo. *Skeleton:* the role is the key.
- **G30 — repository lookup on the event path.** The hook command `init` writes
  (`"<node>" "<dispatch>" hook <event>`) carries no repo key. So the handler has
  to find the store from the event's `cwd`, and the only resolver,
  `resolveRepoKey`, runs `git` subprocesses. AD-23's event-path inventory does
  not allow those ("never a `git` subprocess on the event path"). *Skeleton:* the
  handler calls `resolveRepoKey` anyway.
- **G31 — no fault code for a handler exception.** AD-7 says any error means
  empty output plus a JSONL fault, but no code exists for "the handler threw".
  *Skeleton:* such errors are recorded as `store_corrupt` unless the watchdog
  fired, which is a misattribution.

- **G32 — the regret proxy has no input.** The in-session "reverted" check
  compares a path's post-write `content_hash` with an earlier one, but nothing on
  the event path records that hash. The handler would have to hash the written
  file after each Edit/Write, and that file read is not in AD-23's event-path
  inventory. *Skeleton:* the regret proxy is not built.
- **G33 — the `whisper_stats` window is undefined.** `whisper_stats` is keyed by
  `(genre, project_key, window_start)`, but no step defines the window. The fold
  also has no stated way to attribute a correction to a genre: through
  `whisper_audit.genre` via `whisper_id`? *Skeleton:* one all-time window
  (`window_start` 0), and `sent` only.
- **G34 — import can corrupt the store (data risk).** `import` copies `store.db`
  over the layout path, but a store opened before leaves `-wal` and `-shm`
  sidecars. SQLite can replay a stale WAL onto the imported file. The import
  needs to remove or checkpoint the sidecars first, with every store handle
  closed. *Skeleton:* plain copy, not yet fixed.
- **G35 — a fault before the repository is known is lost silently.** On malformed
  stdin the handler fails open correctly, but the fault is aimed at a fallback
  diagnostics directory that is never created, so the write fails and nothing is
  recorded anywhere. Found by running the skeleton. This is the silent failure
  OL-10 exists to prevent. There needs to be a home-level diagnostics location
  that always exists.
- **G36 — the exit run's leg 1 would count test transcripts.** It enumerates every
  `*.jsonl` under `~/.claude/projects/`, which includes probe and test-run
  transcripts (`-tmp-plan-probe-layout-*` and `-tmp-tmp-*` exist on this
  machine). It needs an exclusion rule for sessions the build itself created.
- **Unverified — whispers on `PreToolUse`.** The skeleton delivers Warning and
  Consequence text through `additionalContext` on `PreToolUse`. Whether
  `PreToolUse` honors `additionalContext` has not been checked against the current
  hooks reference.

### Step 13 skeleton — the co-change miner

`src/miner/cochange.ts`: `parseNumstatZ`, `isRevertLabelled`, `isFixLabelled`,
`mineCochange(store, repoPath, {diagnosticsDir, global})`. Run on
`Maxcogar/agent-armory` (2026-09-25):
- 361 commits: 348 included, 13 excluded for `max_transaction_entities`.
- 535 `files` rows, 3,915 `cochange_pairs` rows, 5 `fix_chatter` landmines.
- 2.3 s cold.
- The incremental re-run saw 0 new commits, in 16 ms.

### Steps 14–15 skeleton — the indexer and frontends

- `src/index/frontend.ts` — the interface, plus `init`.
- `src/index/zone.ts` — path patterns and a generated-file marker; evidence
  redacted and injection-flagged.
- `src/index/search.ts` — FTS5 or `LIKE`; FTS terms are quoted so input text
  cannot inject query syntax.
- `src/index/indexer.ts` — `runIndex` (async), `resolveHead` (bounded file
  reads), `refreshIfStale`, and `acquireReindexClaim`/`releaseReindexClaim`.
  `runIndex` then runs the miner.
- `src/index/tree_sitter_frontend.ts`, `generic_frontend.ts`, `frontends.ts`.

Run on `Maxcogar/agent-armory` (2026-09-25):
- 1,804 files indexed, 8 path-only, 8,511 symbols, 721 import edges.
- Zones: 1,786 source, 13 generated, 5 build output, and 23 `unknown` (the
  miner's placeholder rows for history-only paths).
- 9.9 s cold; the incremental re-run indexed 0 files in 0.3 s.
- `refreshIfStale` returned not stale on an unmoved HEAD.

### Steps 16–20 skeleton — the bar, command classes, genres, compose, delivery

- `src/bar/combinator.ts` — `confidenceOf` and `passesBar`: a conjunction of
  three floors, hazard bypass, floors read from tuning.
- `src/genres/command_class.ts` — quote-aware ternary classifier. Spot checks:
  `cd pkg && npm test`→1, `ls; cat a`→2, a quoted `&&`, `bash -c` or `$(…)`→3.
- `src/genres/` — the `Generator` seam, plus Coupling, Warning, Completeness and
  Orientation doing minimal real queries. Consequence, Reuse and the Verification
  generator return nothing, because their inputs (`test_map`, `symbol_refs`) are
  not produced yet (G11). `recognizeDoneClaim` is built as specified.
- `src/hook/compose.ts` — pointer-only text and the rumor-rule re-resolution.
- `src/hook/delivery.ts` — dedup, SessionStart reconciliation, the Stop channel.

### Steps 21–28 and 31 skeleton — answer drift, the handler, the CLI

- `src/transcript/locate.ts`, `reader.ts` — bounded tail and marker-based
  discrimination.
- `src/qa/state.ts`, `classify.ts` — the recognizers. On the plan's own example
  list, all 17 behave as the plan specifies, including holding a
  one-character "y".
- `src/blocks/verdict.ts` (the only deny producer), `answer_drift.ts`,
  `health.ts`.
- `src/types/hook_response.ts`.
- `src/hook/adapter.ts` (the only file naming hook fields), `handler.ts` (AD-8
  order, audit-then-emit, fail-open).
- `src/cli/dispatch.ts` with `hook`, `hook integrity-check`, `index`, `init`,
  and a shared `cli/context.ts`.

End to end (`test/unit/skeleton_e2e.test.ts`, real binary, real git repo):
1. `init` keys the repo, indexes it, mines it and wires the eight hooks.
2. A question in the prompt opens a row.
3. An Edit is denied with "answer Max's question first: …"; a Read is allowed.
4. Once the answer is in the transcript, the Edit is allowed.
5. A Read of `src/api/handler.ts` produces `[oracle] coupling: src/db/schema.ts
   (4 co-changes, ratio 1.00)`; the ratio of 1.00 is G3 visible in output.
6. The repeat read is silent (dedup), and so is Stop.

`npm test` 42/42.

### Steps 29–36 and 39 skeleton — verification, SessionEnd, verbs, model seam, exit run

- **Step 29, checked through the built handler.** A deadline of 0 ms gives empty
  output plus `latency_breach`, `CTXORACLE_INTERNAL=1` gives empty output, and
  malformed stdin gives empty output but loses its fault (G35).
- **Step 30.** `foldWhisperStats` is wired into the SessionEnd branch. The regret
  proxy is not built (G32).
- **Steps 32–35.** `status`, `log`, `tune`, `correct` (including
  `--missed-question`), `note` (`--kind landmine`, `--global`), `export`,
  `import` and `deinit` are all in `src/cli/verbs_skeleton.ts`. Smoke run on a
  fresh repo: every verb worked, and `import` refused an existing store until
  `--replace` was given. The average hook call took 96 ms (10 × PostToolUse,
  including process start and the G30 git lookup).
- **Step 36.** `src/model/invoke.ts`; nothing imports it.
- **Step 39, checked for feasibility.** Leg 2's repositories (`Maxcogar/NOVA`,
  `Maxcogar/Nova-Integrations`) can be attached to a session. Leg 1 has G36.

---

## Reopened Steps 1–12 — the 2026-09-26 build deltas + Checkpoint 1R — BUILT (2026-09-26, uncommitted, pending independent review)

Built against the "Reopened 2026-09-26 — build delta" paragraphs of plan Steps 1,
3, 4, 5, 6, 7, 8, 9, 10, 12 and §9's Checkpoint 1R placeholder rule. Test-first:
a separate agent wrote the stubs and the new/revised §12 tests; this build
replaced every stub (`grep -rn "STUB\|not implemented" src` → no match) and
tightened every stub widening (`FileUpsert.in_tree`, `seq?` on the session and
observed-action inputs, `bump`'s optional `hash`/`weight`, `tuningReader`'s
optional `projectKey`/`onMissing` and its `get`) to the plan's types. No asserted
test value was changed and no test was deleted.

### Per step — what was built

- **Step 1.** `human_markers.jsonl`'s human entry gains `"origin":{"kind":"human"}`
  (G26); `markerless_user.jsonl` untouched. `generate.ts` gains deterministic
  single-commit baselines for `coupling-key-symmetry`, `miner-denominator`,
  `miner-labels`, `miner-large`, `indexer-walk`, `indexer-nongit`,
  `reuse-alias-unresolved` and `recency-weighting` (34 names).
- **Step 3.** `Store.transaction` is re-entrant: depth counter; depth 0 is
  `BEGIN IMMEDIATE`/`COMMIT` with the retry-once-then-`StoreBusy` path
  unchanged; depth > 0 is `SAVEPOINT sp<depth>`/`RELEASE`, `ROLLBACK TO` +
  `RELEASE` on a throw, no busy retry, `onBusyRetry` ignored.
  `openStore(path, {mustExist: true})` opens `pathToFileURL(path).href +
  '?mode=rw'`; on errcode 14 a `stat` decides `StoreMissing` (ENOENT/ENOTDIR)
  vs `StoreUnreadable {path, pathKind, errno}`. `backupFile` wraps
  `sqlite.backup()` with the source opened `readOnly`.
- **Step 4.** `ensureHome(home)` creates `<home>/`, `global/`, `diagnostics/`
  at 0o700 and reports pre-existing loose ones; `ensureLayout` calls it first.
- **Step 5.** `oracleRunSync` (`spawnSync`, no encoding; status returned, never
  thrown; a failure to start the child is thrown). `src/util/path_bytes.ts`:
  `splitNul`, `decodePathBytes` (fatal UTF-8), `escapeBytes`.
- **Step 6.** `FAULT_CODES` is the delta's 29 codes (`whisper_dropped_stale`
  removed). `consumerKey`/`consumerRole` (`src/types/consumer.ts`); `lit`/`slot`
  (`src/types/headline.ts`); `InternalEvent`, `ObservedActionsReader`,
  `EventContext` (with `DropReason`), `Candidate` (every field required),
  `Pointer` (`kind`-tagged), `TuningReader {num, str, list}` reshaped as the
  delta states; the old `Consumer` type is removed.
- **Steps 7, 8.** Migrations 001, 001b and 002 edited in place to the plan DDL
  (the `test_map.source` CHECK the built 001 lacked is now present; the
  `symbols_name` index is gone; `whisper_stats` keyed `(genre, project_key)`
  with `published_at`).
- **Step 9.** The delta's DAO surface: `files` (`deleteMissing` removed;
  `ensureHistoryRow`, `markAbsentExcept`, `sweepUnreferenced`, `addChangeCount`,
  `resetChangeCounts`, `setUnresolvedImports`, `setEntryScore`; `upsert` takes
  `in_tree`), `cochange_pairs` (`bump(a, b, ts, hash, weight)`, `partnersOf`
  reshaped, `deleteAll`), `labelled_touches`, `landmines` (`upsert` removed;
  `rebuildMinerKinds`, `deleteMinerKinds`, `createHuman`; human rows first),
  `commits.deleteAll`, `corrections` (`since`/`maxSeq`, `genre`; `sinceTs`
  removed), `whisper_audit` (`subject_key`, `since`, `maxSeq`,
  `subjectKeyForText`; `deliveredSubjects` returns subject keys),
  `stats_folds`, `whisper_stats` (`replaceForProject`/`forProject`;
  `upsertFold` removed), `schema_meta`/`global_meta` `delete`,
  `global_meta.keysWithPrefix`, `observed_actions` (`append` without `seq`,
  `segments_json`, `runs(session, consumer)` returning rows, `okEditedPaths`,
  `hashesFor`, `writtenSinceSeq`, `maxSeq`; `writtenSince` removed;
  `pathWrites` ordered by `seq`; `EDIT_TOOLS` no longer names `MultiEdit`, per
  the Step 9 table (a)), `session_log` (`append` without `seq` returning
  `{id, seq}`, `latestSession`, `hasEnded`), `consumer_state.hasAny`,
  `path_tokens`, `symbol_tokens`.
- **Step 10.** `writeSessionEvent` takes no `seq` and returns `{id, seq}`.
- **Step 12.** `tuningReader(global, projectKey, onMissing)` (project row
  before the NULL row; list members of whichever level has any; re-seed with
  the seed `source` and one `onMissing` per key; unknown key throws; per-reader
  cache), `tuning.get(store, key, projectKey?)`, `checkTuningWrite` (reports
  every violated relation with every value in it), `tuningWriteNotice`; seeds:
  `bar.stale_index_factor` removed, the eight new `architecture_default`
  scalars, `index.entry_marker_points` 1 (`plan_seed`), the four new lists.

### Checkpoint 1R — the skeleton reduction

Placeholders written, each marked `// SKELETON: 1R — …; retired by Step <n>`
(27 marks; all within the Step 6/9 `modify:` lists and §9's table rows):
genres ×7 → `candidates()` returns `[]` (Step 18); `generator.ts` pair query
removed / helper returns `[]` and the `TuningReader` parameter note (Step 18);
`combinator.ts` `passesBar` stand-in and a `confidenceOf` stand-in (Step 16);
`compose.ts` → `{dropped: 'stale_pointer'}` (Step 19); `delivery.ts` consumer
parameters `ConsumerKey` (Step 20); `adapter.ts` without `consumer`, with
`agentId` and `targetPathRaw` (Step 28); `handler.ts` consumer key + role, the
observed-actions reader stand-in, `EventContext` stand-ins, the
`whisper_dropped_unverifiable {reason: 'stale_pointer'}` fault, appends without
`seq` (Step 28); `answer_drift.ts` (Step 25) and `health.ts` (Step 26) `num`/
`list` reads and `ConsumerKey` parameters; `cochange.ts` landmine writes removed,
`bump(…, c.hash, 1)`, and `files.upsert` `in_tree: 0` (Step 13); `indexer.ts`
`files.upsert` with `in_tree: 1` + `isSuspect(path)`, and the tree-deletion loop
removed (Step 14); `whisper_stats_fold.ts` → `{folded: 0}` (Step 30);
`verbs_skeleton.ts` `note --kind landmine` → "not built yet" (Step 35).

`test/unit/skeleton_e2e.test.ts` is marked `todo` (`SKELETON: 1R — …; retired by
Step 28`); no other test turned red, so it is the only `todo`.

### Verification actually run

- `cd ctxoracle && npm run build` → `tsc -p tsconfig.json`, no diagnostics.
- `npm test` (exit 0): `# tests 125`, `# pass 124`, `# fail 0`, `# todo 1`
  (`not ok 77 - skeleton: … # TODO SKELETON: 1R …`). Every Steps 1–12 test
  passes and none is `todo`: T-1-1…T-1-3, T-2-1, T-3-1…T-3-6 (T-3-5 ×8),
  T-4-1 ×4, T-5-1…T-5-5, T-6-1…T-6-4, T-7-1 ×13, T-8-1, T-9-1 ×22, T-9-2,
  T-10-1…T-10-4, T-11-1…T-11-5, T-12-1, T-12-2 ×4, T-12-3 ×26.
- Owner-visible sanity check (script over the built `dist/`, fresh stores,
  `fts: true` + `seedDefaults`): `files` has `in_tree`, `change_count`,
  `change_weight`, `unresolved_imports`; `cochange_pairs` is `a, b,
  pair_count, pair_weight, last_ts, last_commit` (no `a_count`);
  `labelled_touches`, `stats_folds`, `symbol_tokens`, `path_tokens` exist; `seq`
  is `INTEGER pk=1` on `whisper_audit`, `corrections`, `observed_actions`,
  `session_log`; 26 STRICT project tables; `tuning` holds 87
  `architecture_default` + 90 `plan_seed` rows, the new keys with their
  sources, and no `bar.stale_index_factor` row.
- `node middleware/context-oracle/.claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check middleware/context-oracle/docs/plans/plan-phase-a.md`
  → `OK: 40 steps, 13 elements, 157 test specs, 27 probes cited, regions current`.
- `python3 tools/check_docs.py` → `context-oracle doc-consistency check passed.`

### Findings

1. **Step 7's "one run-time break" premise is false.** The plan says the
   generator helper's `a_count` query is the only statement the schema breaks
   at run time. The skeleton indexer's FTS writes (`INSERT INTO fts_paths(path,
   file_id)`, `INSERT INTO fts_symbols(name, kind, file_id)`) and
   `src/index/search.ts`'s FTS reads name the pre-1R columns. Observed:
   skeleton_e2e's `init` fails with `table fts_paths has no column named path`.
   Neither is a compile break, no placeholder form covers them, and
   `search.ts` is in no `modify:` list; both were left unchanged. At 1R
   `ctxoracle init`/`index` on an FTS5 store fails until Step 14. `search.ts`
   has no remaining caller (Orientation is reduced). The todo reason names
   this cause alongside the plan's.
2. **§9's indexer row names a call the skeleton does not make.** The indexer
   never called `files.deleteMissing`; it deleted absent files with inline
   `DELETE FROM files` SQL, which the no-cascade schema now refuses for any
   file mined history references. The loop was removed to get the row's stated
   effect ("a file gone from the tree keeps its row at 1R").
3. **Stand-ins the §9 table does not enumerate** were needed for the code to
   compile, and all are in listed files: `confidenceOf` in `combinator.ts`
   (reads the removed `Candidate.ratio`); the miner's `files.upsert` `in_tree: 0`
   (the upsert is now required to take `in_tree`); the handler's
   `targetPath`, `resultPaths`, `context`, `role`, `observed`, `recordDrop`;
   `consumerRole(consumer)` in place of `consumer === 'main'` in `decideDeny`
   and the handler. The skeleton's `===`/`!==` against `'main'` on a
   `ConsumerKey` would never match, so it would have silently disabled the block.
4. **Plan silences decided in the code, each commented where made.**
   - `ObservedActionsReader.runs().segments` is typed `unknown[] | null`,
     because `SegmentClass` is Step 17's.
   - `ensureHistoryRow`'s `prov_ref` is the path (the DAO is given no hash).
   - `decodePathBytes` uses `ignoreBOM: true`. The default strips a leading
     EF BB BF, which would key two byte strings as one path — the G7 defect
     class.
   - `landmines.createHuman` refuses non-`human` provenance (FR-X4).
   - `markAbsentExcept` and `consumer_state.hasAny` bind their id/key lists
     through `json_each(?)`, so a large tree never meets SQLite's
     host-parameter limit.
   - `checkTuningWrite` returns `{ok: true}` for keys outside AD-14's relations.
5. **Step 1 delta (b) says "seven" names; §5.1 and Step 1's `create:` list add
   an eighth, `recency-weighting`.** T-1-3 pins the §5.1 list, so all eight are
   generated.
