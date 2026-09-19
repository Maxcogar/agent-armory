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
  perturbs the other's clean-state assertion.
