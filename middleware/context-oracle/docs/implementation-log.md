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
