# Plan — Context Oracle Phase A implementation

**Status:** Phase A implementation plan, derived from `docs/specs/spec-context-oracle.md`
(spec of record, `OL-C6` 2026-08-28) and `docs/architecture-phase-a.md` (Phase A
architecture, reviewed to convergence 2026-09-04). Revision of 2026-09-07. This plan
consumes the spec and architecture and is executed by the Phase A build. Every
step here traces to an architecture decision (`AD-n`), a spec requirement
(`FR-*`, `AC-*`, `C-*`, `NF-1`, `P*`, `D-n`), or a ledger key (`OL-*`).

**Reading order.** `docs/STATUS.md` first, then `OWNER-LEDGER.md`, the spec,
`docs/architecture-phase-a.md`, `docs/collapse-log.md`. This plan is executed
against those documents, not in place of them; where the plan cites a decision
by ID (e.g. AD-9), the architecture is the authority — the plan does not
re-litigate what the architecture decided, it schedules its construction.

**Non-negotiable orientation (`CLAUDE.md` dominating rule 3, spec §11.5).**
Phase A's goal is *an honest deterministic foundation, running on the owner's
real repos, that measures its own floor — how little it catches — with clean
seams the later phases plug into; never fake completeness dressed to look like a
working product.* Every step below is judged against that goal. If, during
implementation, any step starts to look like fake completeness, cut the
mechanism and file a finding — the collapse-log 2026-09-04 entry is the
standing evidence for what happens otherwise.

---

## 1. Goal

Build the Phase A component tree — the seven model-free whisper genres, the
answer-drift block's safe skeleton, the stores/index/miner, delivery with
per-consumer dedup, self-observability, security, the human-correction
calibration channel, and the CLI — such that Phase A exits by producing
measured whisper, block, false-fire, wrongful-deny, and regret data on the
owner's real repositories (spec §11.5), with clean named seams for Phase B's
model-in-the-loop machinery and Phase C's skill-non-conformance block (AD-9
Phase B seam, AD-10 second-caller point, AD-21 piggyback seam, AD-22 deferred
delivery contract). Success is the entire spec §14 Phase A acceptance set
passing on fixture replays *and* the exit run on Max Cogar's real repositories
reporting the honest floor of what the deterministic recognizers catch — not a
padded coverage number.

## 2. Scope

### 2.1 In scope for this plan

Every Phase A component the architecture names, in the topological build order
of §7, plus the seam contracts (interface stubs) that Phase B and Phase C plug
into without a redesign:

- **Package + toolchain (AD-25):** the `middleware/context-oracle/ctxoracle/`
  npm package with exactly two runtime deps (`web-tree-sitter`,
  `tree-sitter-wasms`), `tsc` build, `node:test` runner, no postinstall, no
  native code.
- **Runtime + store engine (AD-2):** Node ≥ 22.16.0 floor with `init`-time
  check; TypeScript strict ESM; `node:sqlite` (WAL, STRICT tables, FTS5) behind
  the single-file `stores/adapter.ts` seam; FTS5 probe at `init` with the
  indexed-`LIKE` fallback.
- **Repository identity (AD-3):** the deterministic root-commit / URL /
  realpath resolver, `<repo-key>` derivation, 0700 store directories.
- **Project store schema (AD-4):** every Phase A table with STRICT + CHECK +
  provenance-mandatory block, plus the open-scoped double-open guard index for
  `questions`.
- **Global store schema and export/import (AD-5):** the Phase A tables
  (`global_meta`, `whisper_stats`, `tuning`, `lessons`) with the per-project
  fold watermark and the `VACUUM INTO` export/import round-trip.
- **Security controls (AD-19):** the redactor, injection-suspect flagger, and
  pointer-only composition applied at every ingress.
- **Self-observability (AD-17):** the JSONL fault channel with every stable
  fault code the architecture names, the `session_log` writer, and the
  `status`/`log` renderers.
- **Transcript reader (AD-11):** the bookmarked JSONL tail, the version-guarded
  entry adapter, the marker-based human-turn discrimination (V12), and
  `transcript_layout_changed` fault handling.
- **Answer-drift block — the safe skeleton (AD-9, AD-10):**
  - `qa/state.ts` DAO + `qa/classify.ts` deterministic recognizers (question,
    clear, move — the move recognizer denying only `Write`/`Edit`/`NotebookEdit`).
  - Question intake on `UserPromptSubmit.prompt` (before the agent's first
    move).
  - Per-event transcript catch-up, whose read-to-EOF state is the lag-window
    hold on the clear-axis (no separate lag mechanism exists).
  - The single deny-producer file (`blocks/verdict.ts`) with the structural
    built-output test making AC-2 mechanical.
  - The `deny_after_answer_lag`, `deny_despite_answer_text`, `deny_loop` and
    `deny_bypass_suspect` detectors.
  - The Phase B seam: `qa/state.ts` read interface unchanged when the writer
    swaps to model-maintained.
- **Structural indexer (AD-12):** `LanguageFrontend` interface, tree-sitter
  frontend over `web-tree-sitter` + `tree-sitter-wasms`, generic
  line-based fallback frontend, zone classification, `entry_score`,
  `import_edges`, `symbol_refs`, incremental refresh with `content_hash`, size
  caps.
- **Co-change miner (AD-13):** `git log --no-merges --numstat -M` streaming
  with hygiene filters (merge exclusion, >30-entity transactions, horizon),
  canonical-ordered pair counts, `last_mined_commit` watermark, corpus floor.
- **The bar (AD-14):** the three-axis conjunction (confidence ∧
  decision-impact ∧ marginal value), the hazard bypass floor, ship-high
  defaults from `tuning`.
- **The seven Phase A genres (AD-15):** one module each — Orientation,
  Coupling, Reuse (with the mixed-language incomparable-set silence),
  Consequence, Warning ⚠ (with `FR-A5a` confidence flags), Completeness,
  Verification / completion-check with the ternary `command_class` classifier
  and the weak "no *recognized* test run" claim, plus the deterministic
  done-claim recognizer.
- **Delivery + dedup (AD-16):** per-consumer `delivered`/`read` sets,
  `SessionStart.source`-keyed reconciliation, single self-releasing Stop-time
  injection via `hookSpecificOutput.additionalContext`, outstanding-question
  line on Stop.
- **Hook wiring + handler (AD-6, AD-7, AD-8, AD-23):** the eight wired events,
  the one-adapter-file discipline, the audit-log-then-emit ordering, the
  cooperative watchdog with the blocking-call inventory bound.
- **Recursion guard + degraded-mode posture (AD-21):** `CTXORACLE_INTERNAL`
  environment variable set by the single spawn wrapper every child process
  goes through, cwd isolation for future spawns; Phase A is degraded-mode by
  construction (no model calls).
- **Concurrency (AD-26):** WAL + `busy_timeout=100ms` + retry-once, single
  writer discipline, single `BEGIN IMMEDIATE` for the `whisper_stats` fold.
- **CLI surface (AD-20):** `init`, `deinit`, `index`, `status`, `log`,
  `correct`, `note`, `tune`, `export`, `import`, `hook <event>` (internal).
- **Human channel + regret (AD-18):** `ctxoracle correct` and `note` with
  provenance; `--missed-question` routed through the same recognizer as
  intake; the Phase A regret proxy (re-edit/revert or covering-test-failed on
  a held-but-unspoken fact).
- **Test architecture (AD-24):** `node:test` unit and integration suites,
  fixture-repo generators, replay harness against the real handler binary,
  the build-time verifications the architecture names (marker presence on
  the owner's real transcripts, `UserPromptSubmit` provenance for
  platform-injected turns, `tree-sitter-wasms` grammar inventory), the
  cold-container install probe.
- **Exit run:** the three-leg measurement of §7 Step 39 — replay of the
  owner's real transcripts, closed-loop sessions on the owner's real code
  repositories, and the AC-18 seeded fixture — producing the §11.5 exit
  measurement.

### 2.2 Out of scope for this plan (deferred to later phases per §11.5)

Restated so no reader mistakes deferral for postponed intent:

- **Every model-in-the-loop genre and mechanism** — `FR-A2h` Assumption-check,
  `FR-A2i` Steering, `FR-A2j` Answer, `FR-A2m` Unfinished-work check, the
  model-assisted done-claim recognizer, the model-assisted answer-directed
  judgment for AC-2a-ii — all Phase B. This plan leaves the AD-9 Phase B seam
  (module-replaceable `qa/classify.ts` behind the unchanged `qa/state.ts` read
  interface), the AD-21 piggyback seam (`model/invoke.ts` interface fixed
  now as the verified invocation contract, `env_capabilities` table created
  by Phase B's migration), and the AD-22 deferred-delivery contract
  (semantics fixed as constraints on Phase B; no `deferred_queue` table
  shipped) — all buildable, none built.
- **The skill non-conformance feature (`FR-C1`–`FR-C4`, `FR-A2k`, `FR-B5`
  automated missed-block detector, `AC-2b`, `AC-2c` skill-block under-fire
  clause)** — Phase C. This plan leaves the deny primitive condition-generic
  in `blocks/verdict.ts` so the Phase C block is the second caller of the
  same seam.
- **Automated demotion / promotion (`FR-L3`, `FR-L3b`, `AC-16`)** — Phase C.
  Phase A ships the measurement substrate.
- **The `deferred_queue`, `env_capabilities`, `exemplars`, `recipes`,
  Phase-C `genre_state` tables** — created by their writing phase's
  migration per AD-4's uniform table-creation criterion; no dormant tables
  ship.

### 2.3 Coverage reconciliation — spec §11.5 Phase A elements → plan step(s)

Every element of the Phase A build named in spec §11.5 and the architecture's
in-scope list maps to at least one plan step in §7:

The requested elements, each with an ID the step declarations cite in
their `covers:` lists:

- **PA-1** — Deterministic core: seven model-free genres.
- **PA-2** — Answer-drift block's safe skeleton (deny plumbing + conservative recognizer).
- **PA-3** — Stores / index / miner.
- **PA-4** — Delivery.
- **PA-5** — Self-observability (correct silence, denies, wrongful-deny, missed skill-block reserved).
- **PA-6** — Security.
- **PA-7** — Human-correction calibration channel.
- **PA-8** — The two seams (Phase B, Phase C).
- **PA-9** — Recursion guard and degraded-mode posture.
- **PA-10** — Test architecture (AD-24) and build-time verifications.
- **PA-11** — CLI surface (`init`/`deinit`/`index`/`status`/`log`/`correct`/`note`/`tune`/`export`/`import`, internal `hook`).
- **PA-12** — Packaging (AD-25).
- **PA-13** — Exit measurement on real repos.

```plan-elements
elements: [PA-1, PA-2, PA-3, PA-4, PA-5, PA-6, PA-7, PA-8, PA-9, PA-10, PA-11, PA-12, PA-13]
```

<!-- generated:coverage begin -->
| Requested element | Implementing step(s) |
|---|---|
| PA-1 | S13, S14, S15, S16, S17, S18, S19 |
| PA-2 | S21, S22, S23, S24, S25, S26, S27 |
| PA-3 | S2, S3, S4, S5, S6, S7, S8, S9, S12, S13, S14, S15 |
| PA-4 | S20, S28 |
| PA-5 | S6, S10, S26, S30, S33 |
| PA-6 | S4, S11, S14, S19 |
| PA-7 | S34, S35 |
| PA-8 | S22, S24, S36 |
| PA-9 | S5, S10, S29, S36 |
| PA-10 | S1, S28, S37, S38, S39 |
| PA-11 | S28, S31, S32, S33, S34, S35 |
| PA-12 | S1 |
| PA-13 | S39 |
<!-- generated:coverage end -->

Nothing is unmapped; nothing is silently deferred.

### 2.4 Coverage exclusions requiring owner authority

None. The spec (`OL-C6`) is signed off, `docs/STATUS.md` declares no owner
question open, and the architecture in-scope list is exhaustively mapped above.
## 3. Standards that govern this plan

The registry every non-trivial step's Source annotation resolves against.
Editions and dates are the spec's own §9 verified dates unless a newer read is
recorded here; every read newer than the architecture's 2026-08-29 rows is
recorded in §11 with what was found.

- **Spec `docs/specs/spec-context-oracle.md`** — the authoritative requirement
  set (`FR-*`), acceptance set (§14, `AC-*`), fixed constraints (`C-*`, `NF-1`),
  product principles (`P1`–`P9`), and recorded judgments (§12, `D-n`).
  Signed off `OL-C6` 2026-08-28. Governs every step's Source.
- **`OWNER-LEDGER.md` CONFIRMED rows** — every owner-attributed claim (OL-2,
  OL-3, OL-4, OL-6, OL-7, OL-10, OL-11, OL-12, OL-C1, OL-C2, OL-C3, OL-C4,
  OL-C5, OL-C6). REJECTED rows (OL-R1..OL-R5) are never reintroduced.
- **`docs/architecture-phase-a.md`** — the design authority (AD-1..AD-26,
  V1..V19, L1..L11, threat model, ASVS mapping, traceability matrix). Every
  Source citation of an `AD-n` resolves here. Where a premise row has drifted
  since 2026-08-29, §4 and §11 record the drift; the decision it supported is
  re-grounded there, never silently changed.
- **Claude Code hooks reference** — `code.claude.com/docs/en/hooks`, fetched
  2026-09-07 (§11.4): the settings-file hook entry fields (`type`, `command`,
  `args`, `timeout`, `statusMessage`, `if`, `async`, `asyncRewake`, `shell`
  and the http/mcp_tool/prompt/agent fields), the three settings-file
  locations, the `UserPromptSubmit` input fields, the `transcript_path`
  asynchronous-write caveat, and the current timeout semantics (a timed-out
  `command` hook's output is discarded and on `PreToolUse` the tool call
  continues). Governs Steps 20, 21, 25, 28, 29, 31, 32 and the §4 entry.
- **Node.js v22.x documentation** — `nodejs.org/docs/latest-v22.x/api`
  (`test`, `typescript`, `cli`, `sqlite` pages via Context7
  `/websites/nodejs_latest-v22_x_api`, 2026-09-07) and the Node 22 changelog
  (`CHANGELOG_V22.md`, fetched 2026-09-07): `node --test` accepts quoted glob
  patterns and, absent type stripping, executes JavaScript files only; type
  stripping is default from v22.18.0 (experimental behind
  `--experimental-strip-types` from v22.6.0); `node:sqlite` FTS5, WAL, STRICT,
  `VACUUM INTO` and the module-level `sqlite.backup()` executed on v22.22.2 (§11.4).
  Governs Steps 1, 2, 3, 32, 37.
- **npm registry metadata, read 2026-09-07** (§11.4): `web-tree-sitter`
  0.26.13 (published 2026-08-23) and 0.27.0 (2026-08-30, current);
  `tree-sitter-wasms` 0.1.13 (2025-10-07, current); `typescript` 5.9.3
  (2025-09-30) and 7.0.2 (2026-07-08, current); `@types/node` 22.20.1
  (current 22.x line). The plan pins the runtime dependencies to the versions
  the architecture verified (V14) and the dev dependencies to the versions
  recorded in Step 1. Governs Steps 1, 15.
- **TypeScript 7.0 release announcement** — `devblogs.microsoft.com/typescript/announcing-typescript-7-0/`,
  fetched 2026-09-07 (§11.4): the native-port compiler removed `baseUrl`,
  `moduleResolution: node/node10/classic`, `module: amd/umd/systemjs/none`,
  `target: es5`, `downlevelIteration`, and disabling `esModuleInterop`/
  `alwaysStrict`; `strict` and `noUncheckedSideEffectImports` default on. Governs
  the tsconfig shape in Step 1 (no removed option is used) and the compiler pin.
- **SQLite `VACUUM` documentation** — `sqlite.org/lang_vacuum.html`, fetched
  2026-09-07 (§11.4): `VACUUM INTO` "works the same way" as `VACUUM`, which
  "rebuilds the database file, repacking it" and "may change the ROWIDs of
  entries in any tables that do not have an explicit INTEGER PRIMARY KEY".
  Governs Step 32's record-identical (never byte-identical) round-trip.
- **ISO/IEC/IEEE 29119-4:2021** — test design techniques (equivalence
  partitioning, boundary value analysis, decision tables, state-transition,
  error guessing) — the technique named in each specification in §12.
- **ISO/IEC/IEEE 29119-1:2022** — risk-based testing as the recommended
  strategy basis. Governs the coverage-proportional-to-risk shape of §12.
- **Software Engineering at Google — Unit Testing + Test Doubles chapters
  (Winters, Manshreck, Wright, 2020)** — test behaviors not methods, test
  state not interactions, real implementations preferred, fake > stub > mock,
  fakes must themselves be tested. Governs every specification in §12.
- **Meszaros, xUnit Test Patterns (2007)** — the test-double taxonomy (dummy,
  stub, fake, spy, mock) named on every double in §12.
- **OWASP LLM Top-10 2025 (LLM01, LLM02) + Prompt-Injection Cheat Sheet +
  ASI06 + Secrets Cheat Sheet** — inherited from spec §9 (verified
  2026-08-25). Governs Step 11 (security) and Step 19 (pointer-only composition).
- **OWASP ASVS 5.0 (applicable subset — V1, V2, V5, V13, V14, V15, V16)** —
  inherited from the architecture's ASVS mapping table. Governs the security-
  adjacent steps (4, 11, 14, 19, 31, 34).
- **SQLite WAL semantics** — engine-documented behaviour, exercised by
  architecture V8 and re-exercised 2026-09-07 (§11.4). Governs Step 3.
- **Zimmermann et al., IEEE TSE 31(6) 2005 (ROSE)** — via spec §9. Governs
  the confidence computation grounding of Step 16 (bar) and Step 13 (miner),
  with the operating point architect-tunable (Phase A calibration input is
  the human channel per `D-12`).
- **ISO/IEC 25010:2023** — analysability and modularity arguments inherited
  from the architecture (AD-2, AD-10) and applied to the single-importer
  disciplines in Steps 3, 24, 28, 29.

---

## 4. Spec issues

One conflict between an architecture premise and current reality was found
during planning; it changes no requirement and no step, and its resolution is
derivable, so it did not go to Max Cogar (`CLAUDE.md`: derive what the spec and
mission already decide).

- **Hooks timeout semantics have drifted since architecture V6.** V6
  (2026-08-29) records that "a timed-out `PreToolUse` hook prevents the tool
  from running" and AD-23 cites that fail-closed hazard as one reason for the
  cooperative watchdog. The hooks reference read on 2026-09-07 states the
  opposite: a `command`, `http`, or `mcp_tool` hook that reaches its timeout
  has its output discarded, "so on most events a timed-out hook renders no
  decision", and "on `PreToolUse`, by contrast, a timed-out command hook lets
  the tool call continue" (§11.4). **Resolution.** The watchdog (Step 29) is
  built exactly as AD-23 specifies, because its other two grounds are
  unchanged: `NF-1` (p95 ≤ 1.5 s, ceiling 3 s) and `FR-O3` (fail open *with a
  diagnostic*) — without the cooperative deadline a slow event would be
  silently discarded at the harness timeout with no `latency_breach` record,
  which `OL-10` forbids. The wired `"timeout": 5` stays (the harness deadline
  must remain above the internal one so the diagnostic is written before the
  harness gives up). No requirement changes; the V6 row is listed in §16 as
  premise maintenance for the architecture, which this plan does not edit.

---
## 5. Files affected

Phase A is a greenfield component tree (architecture `L8`). The
`middleware/context-oracle/` directory holds project documentation
(`CLAUDE.md`, `OWNER-LEDGER.md`, `RETHINK.md`, `docs/`), the CI check-tooling
(`tools/check_docs.py`), MCP configuration (`.mcp.json`), and the project's
local skills (`.claude/`) — verified 2026-09-07 by `ls -a` and by a
`codegraph_scan` of the directory (§11.6: one code file, `tools/check_docs.py`,
with zero dependents). No Phase A implementation code exists there yet. Files
created by this plan live under `middleware/context-oracle/ctxoracle/` except
the one CI workflow file named below.

### 5.1 Files this plan creates and modifies (generated from the step declarations)

Every row below is derived from the `create:`/`modify:`/`delete:` lists of the
` ```step-decl ` block that opens each §7 step; the derivation script writes
the table and `--check` fails the plan when a declaration and the table
disagree. Paths are repository-relative. Every test file is created by the
step whose test specification names it in §12; every fixture repository
under `test/fixtures/repos/` is created by Step 1's generator, and the
tests that use it name it in their Data fields.

<!-- generated:files begin -->
| File | Change | Step(s) |
|---|---|---|
| .github/workflows/context-oracle-ctxoracle.yml | create | S1 |
| .github/workflows/context-oracle-ctxoracle.yml | modify | S28, S38 |
| middleware/context-oracle/ctxoracle/package.json | create | S1 |
| middleware/context-oracle/ctxoracle/scripts/check-cold-container.sh | create | S38 |
| middleware/context-oracle/ctxoracle/scripts/check-status-post-build.sh | create | S40 |
| middleware/context-oracle/ctxoracle/scripts/exit-run.sh | create | S39 |
| middleware/context-oracle/ctxoracle/scripts/run-tests.mjs | create | S1 |
| middleware/context-oracle/ctxoracle/src/bar/combinator.ts | create | S16 |
| middleware/context-oracle/ctxoracle/src/blocks/answer_drift.ts | create | S25 |
| middleware/context-oracle/ctxoracle/src/blocks/answer_drift.ts | modify | S27 |
| middleware/context-oracle/ctxoracle/src/blocks/health.ts | create | S26 |
| middleware/context-oracle/ctxoracle/src/blocks/verdict.ts | create | S24 |
| middleware/context-oracle/ctxoracle/src/cli/correct.ts | create | S34 |
| middleware/context-oracle/ctxoracle/src/cli/deinit.ts | create | S32 |
| middleware/context-oracle/ctxoracle/src/cli/dispatch.ts | create | S28 |
| middleware/context-oracle/ctxoracle/src/cli/dispatch.ts | modify | S31, S32, S33, S34, S35 |
| middleware/context-oracle/ctxoracle/src/cli/export.ts | create | S32 |
| middleware/context-oracle/ctxoracle/src/cli/hook.ts | create | S28 |
| middleware/context-oracle/ctxoracle/src/cli/import.ts | create | S32 |
| middleware/context-oracle/ctxoracle/src/cli/index.ts | create | S28 |
| middleware/context-oracle/ctxoracle/src/cli/init.ts | create | S31 |
| middleware/context-oracle/ctxoracle/src/cli/integrity_check.ts | create | S28 |
| middleware/context-oracle/ctxoracle/src/cli/log.ts | create | S33 |
| middleware/context-oracle/ctxoracle/src/cli/note.ts | create | S35 |
| middleware/context-oracle/ctxoracle/src/cli/status.ts | create | S33 |
| middleware/context-oracle/ctxoracle/src/cli/tune.ts | create | S33 |
| middleware/context-oracle/ctxoracle/src/diag/fault_codes.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/diag/fault_writer.ts | create | S10 |
| middleware/context-oracle/ctxoracle/src/diag/jsonl.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/diag/log.ts | create | S33 |
| middleware/context-oracle/ctxoracle/src/diag/regret.ts | create | S30 |
| middleware/context-oracle/ctxoracle/src/diag/session_writer.ts | create | S10 |
| middleware/context-oracle/ctxoracle/src/diag/status.ts | create | S33 |
| middleware/context-oracle/ctxoracle/src/diag/whisper_stats_fold.ts | create | S30 |
| middleware/context-oracle/ctxoracle/src/genres/command_class.ts | create | S17 |
| middleware/context-oracle/ctxoracle/src/genres/completeness.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/consequence.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/coupling.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/orientation.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/reuse.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/verification.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/warning.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/hook/adapter.ts | create | S28 |
| middleware/context-oracle/ctxoracle/src/hook/compose.ts | create | S19 |
| middleware/context-oracle/ctxoracle/src/hook/delivery.ts | create | S20 |
| middleware/context-oracle/ctxoracle/src/hook/guard.ts | create | S10 |
| middleware/context-oracle/ctxoracle/src/hook/handler.ts | create | S28 |
| middleware/context-oracle/ctxoracle/src/hook/handler.ts | modify | S30 |
| middleware/context-oracle/ctxoracle/src/hook/watchdog.ts | create | S10 |
| middleware/context-oracle/ctxoracle/src/identity/home.ts | create | S4 |
| middleware/context-oracle/ctxoracle/src/identity/layout.ts | create | S4 |
| middleware/context-oracle/ctxoracle/src/identity/repo_key.ts | create | S5 |
| middleware/context-oracle/ctxoracle/src/index/frontend.ts | create | S14 |
| middleware/context-oracle/ctxoracle/src/index/frontends.ts | create | S15 |
| middleware/context-oracle/ctxoracle/src/index/generic_frontend.ts | create | S15 |
| middleware/context-oracle/ctxoracle/src/index/indexer.ts | create | S14 |
| middleware/context-oracle/ctxoracle/src/index/indexer.ts | modify | S30 |
| middleware/context-oracle/ctxoracle/src/index/search.ts | create | S14 |
| middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts | create | S15 |
| middleware/context-oracle/ctxoracle/src/index/zone.ts | create | S14 |
| middleware/context-oracle/ctxoracle/src/miner/cochange.ts | create | S13 |
| middleware/context-oracle/ctxoracle/src/model/invoke.ts | create | S36 |
| middleware/context-oracle/ctxoracle/src/qa/classify.ts | create | S23 |
| middleware/context-oracle/ctxoracle/src/qa/state.ts | create | S22 |
| middleware/context-oracle/ctxoracle/src/security/injection.ts | create | S11 |
| middleware/context-oracle/ctxoracle/src/security/redact.ts | create | S11 |
| middleware/context-oracle/ctxoracle/src/security/trust.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/stores/adapter.ts | create | S3 |
| middleware/context-oracle/ctxoracle/src/stores/dao/classified_turns.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/classify_state.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/cochange_pairs.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/commits.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/consumer_state.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/corrections.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/faults.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/files.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/global_meta.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/human_facts.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/import_edges.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/invariants.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/landmines.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/lessons.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/observed_actions.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/questions.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/regret.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/schema_meta.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/session_log.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/symbol_refs.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/symbols.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/test_map.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts | create | S12 |
| middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts | create | S12 |
| middleware/context-oracle/ctxoracle/src/stores/dao/whisper_audit.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/whisper_stats.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts | create | S7 |
| middleware/context-oracle/ctxoracle/src/stores/migrations/001_phase_a_project.sql | create | S7 |
| middleware/context-oracle/ctxoracle/src/stores/migrations/001b_phase_a_fts.sql | create | S7 |
| middleware/context-oracle/ctxoracle/src/stores/migrations/002_phase_a_global.sql | create | S8 |
| middleware/context-oracle/ctxoracle/src/transcript/locate.ts | create | S21 |
| middleware/context-oracle/ctxoracle/src/transcript/reader.ts | create | S21 |
| middleware/context-oracle/ctxoracle/src/types/candidate.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/types/events.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/types/hook_response.ts | create | S24 |
| middleware/context-oracle/ctxoracle/src/types/index_types.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/util/env.ts | create | S2 |
| middleware/context-oracle/ctxoracle/src/util/hash.ts | create | S5 |
| middleware/context-oracle/ctxoracle/src/util/spawn.ts | create | S5 |
| middleware/context-oracle/ctxoracle/src/util/ulid.ts | create | S9 |
| middleware/context-oracle/ctxoracle/test/build_time/grammar_inventory_check.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/build_time/marker_presence.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/build/fixtures/deny_literal_outside.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/build/fixtures/missing_provenance.ts | create | S9 |
| middleware/context-oracle/ctxoracle/test/build/fixtures/trust_out_of_set.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/build/fixtures/verdict_updated_input.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/build/fixtures/verdict_updated_tool_output.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/build/tsc_fixture.ts | create | S1 |
| middleware/context-oracle/ctxoracle/test/build/typecheck_deny_brand.test.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/build/typecheck_provenance.test.ts | create | S9 |
| middleware/context-oracle/ctxoracle/test/build/typecheck_trust.test.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/build/typecheck_verdict_shape.test.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/conventions/child_process_single_importer.test.ts | create | S5 |
| middleware/context-oracle/ctxoracle/test/conventions/fault_session_writers_only.test.ts | create | S10 |
| middleware/context-oracle/ctxoracle/test/conventions/hook_field_names_isolated.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/conventions/no_network_modules.test.ts | create | S32 |
| middleware/context-oracle/ctxoracle/test/conventions/permission_decision_confined.test.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/conventions/sqlite_single_importer.test.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/fixtures/generate_large_store.ts | create | S29 |
| middleware/context-oracle/ctxoracle/test/fixtures/generate.ts | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/answer-drift-clearly-off/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/bar-two-candidates/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/completeness-paired-change/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/consequence-coupled-tests/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/corpus-floor-29/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/coupling-nonobvious/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/dedup-read-set/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/indexer-small/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/language-config-added/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/miner-hygiene/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/orientation-mixed-shape/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/over-threshold-file/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/pristine-tree/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/regret-no-inflate/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/regret-true-positive/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-full/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-nongit/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-shallow-no-origin/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-shallow/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/reuse-mixed-language/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/reuse-observed-zero/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/reuse-same-name-collision/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/secret-injection/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/seeded-facts/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/subagent-delivery/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/verification-covering-test/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/warning-landmine/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/replay/answer_drift_lag_hold.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/answer_drift_off_to_unrelated.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/answer_drift_overfire.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/answer_drift_reconciliation.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/answer_drift_residual.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/answer_drift_subagent_allow.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/bar_hazard_bypass.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/bar_no_cap.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/completeness_paired_change.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/consequence_coupled_tests.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/corpus_floor.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/correct_missed_question.test.ts | create | S34 |
| middleware/context-oracle/ctxoracle/test/replay/correct_verdict.test.ts | create | S34 |
| middleware/context-oracle/ctxoracle/test/replay/coupling_nonobvious.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/dedup_read_set.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/deinit_marker.test.ts | create | S32 |
| middleware/context-oracle/ctxoracle/test/replay/deny_after_answer_lag.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/deny_health_induced.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/export_roundtrip.test.ts | create | S32 |
| middleware/context-oracle/ctxoracle/test/replay/fail_open.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/hook_stream_fixtures/ | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/hooks_not_firing.test.ts | create | S33 |
| middleware/context-oracle/ctxoracle/test/replay/idle_silence.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/init_fresh.test.ts | create | S31 |
| middleware/context-oracle/ctxoracle/test/replay/init_idempotent.test.ts | create | S31 |
| middleware/context-oracle/ctxoracle/test/replay/init_keying_change.test.ts | create | S31 |
| middleware/context-oracle/ctxoracle/test/replay/integrity_check_verb.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/language_config_added.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/liveness_row.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/log_readback.test.ts | create | S33 |
| middleware/context-oracle/ctxoracle/test/replay/note_global.test.ts | create | S35 |
| middleware/context-oracle/ctxoracle/test/replay/note_project.test.ts | create | S35 |
| middleware/context-oracle/ctxoracle/test/replay/orientation_mixed_shape.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/pipeline_order.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/produced_but_undelivered.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/recursion_guard.test.ts | create | S29 |
| middleware/context-oracle/ctxoracle/test/replay/regret_proxy.test.ts | create | S30 |
| middleware/context-oracle/ctxoracle/test/replay/reuse_mixed_language.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/rumor_rule.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/runner.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/security_ac11.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/seeded_facts_exit.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/session_boundary_dedup.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/session_start_resume.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/session_start_startup.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/status_renders_all.test.ts | create | S33 |
| middleware/context-oracle/ctxoracle/test/replay/stop_outstanding_question_line.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/stop_single_cycle.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/subagent_delivery.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/transcript_fixtures/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/replay/tune_roundtrip.test.ts | create | S33 |
| middleware/context-oracle/ctxoracle/test/replay/verification_headline.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/warning_headline.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/watchdog.test.ts | create | S29 |
| middleware/context-oracle/ctxoracle/test/unit/answer_drift_catchup.test.ts | create | S25 |
| middleware/context-oracle/ctxoracle/test/unit/answer_drift_decide.test.ts | create | S25 |
| middleware/context-oracle/ctxoracle/test/unit/answer_drift_intake.test.ts | create | S25 |
| middleware/context-oracle/ctxoracle/test/unit/bar.test.ts | create | S16 |
| middleware/context-oracle/ctxoracle/test/unit/command_class_compound.test.ts | create | S17 |
| middleware/context-oracle/ctxoracle/test/unit/command_class.test.ts | create | S17 |
| middleware/context-oracle/ctxoracle/test/unit/compose_rumor_rule.test.ts | create | S19 |
| middleware/context-oracle/ctxoracle/test/unit/concurrency.test.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/unit/dao_crud.test.ts | create | S9 |
| middleware/context-oracle/ctxoracle/test/unit/delivery_dedup.test.ts | create | S20 |
| middleware/context-oracle/ctxoracle/test/unit/delivery_stop_channel.test.ts | create | S20 |
| middleware/context-oracle/ctxoracle/test/unit/deny_health.test.ts | create | S26 |
| middleware/context-oracle/ctxoracle/test/unit/done_claim_recognizer.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/env.test.ts | create | S2 |
| middleware/context-oracle/ctxoracle/test/unit/fault_codes.test.ts | create | S6 |
| middleware/context-oracle/ctxoracle/test/unit/fts5_probe.test.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/unit/generator_determinism.test.ts | create | S1 |
| middleware/context-oracle/ctxoracle/test/unit/generic_frontend.test.ts | create | S15 |
| middleware/context-oracle/ctxoracle/test/unit/genre_completeness.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_consequence.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_coupling.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_orientation.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_reuse.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_verification.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_warning.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/indexer_frontends.test.ts | create | S15 |
| middleware/context-oracle/ctxoracle/test/unit/indexer_stale.test.ts | create | S14 |
| middleware/context-oracle/ctxoracle/test/unit/indexer.test.ts | create | S14 |
| middleware/context-oracle/ctxoracle/test/unit/injection_negative.test.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/unit/injection_positive.test.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/unit/jsonl_writer.test.ts | create | S6 |
| middleware/context-oracle/ctxoracle/test/unit/latency_instrument.test.ts | create | S10 |
| middleware/context-oracle/ctxoracle/test/unit/layout.test.ts | create | S4 |
| middleware/context-oracle/ctxoracle/test/unit/migrations_global.test.ts | create | S8 |
| middleware/context-oracle/ctxoracle/test/unit/migrations_phase_a.test.ts | create | S7 |
| middleware/context-oracle/ctxoracle/test/unit/miner.test.ts | create | S13 |
| middleware/context-oracle/ctxoracle/test/unit/model_invoke_stub.test.ts | create | S36 |
| middleware/context-oracle/ctxoracle/test/unit/package_build.test.ts | create | S1 |
| middleware/context-oracle/ctxoracle/test/unit/qa_state.test.ts | create | S22 |
| middleware/context-oracle/ctxoracle/test/unit/question_lifetime.test.ts | create | S27 |
| middleware/context-oracle/ctxoracle/test/unit/reader_v12_counts.test.ts | create | S21 |
| middleware/context-oracle/ctxoracle/test/unit/reader.test.ts | create | S21 |
| middleware/context-oracle/ctxoracle/test/unit/recognizer_clear.test.ts | create | S23 |
| middleware/context-oracle/ctxoracle/test/unit/recognizer_move.test.ts | create | S23 |
| middleware/context-oracle/ctxoracle/test/unit/recognizer_question.test.ts | create | S23 |
| middleware/context-oracle/ctxoracle/test/unit/redact_negative.test.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/unit/redact_positive.test.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/unit/repo_key.test.ts | create | S5 |
| middleware/context-oracle/ctxoracle/test/unit/run_tests_guard.test.ts | create | S1 |
| middleware/context-oracle/ctxoracle/test/unit/spawn_wrapper.test.ts | create | S5 |
| middleware/context-oracle/ctxoracle/test/unit/stop_outstanding_line.test.ts | create | S27 |
| middleware/context-oracle/ctxoracle/test/unit/store_corrupt_induction.test.ts | create | S10 |
| middleware/context-oracle/ctxoracle/test/unit/stores_adapter.test.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/unit/tree_sitter_frontend.test.ts | create | S15 |
| middleware/context-oracle/ctxoracle/test/unit/tuning_dao.test.ts | create | S12 |
| middleware/context-oracle/ctxoracle/test/unit/watchdog_deadline.test.ts | create | S10 |
| middleware/context-oracle/ctxoracle/test/unit/whisper_form.test.ts | create | S19 |
| middleware/context-oracle/ctxoracle/test/unit/whisper_stats_fold.test.ts | create | S30 |
| middleware/context-oracle/ctxoracle/tsconfig.json | create | S1 |
| middleware/context-oracle/docs/STATUS.md | modify | S40 |
<!-- generated:files end -->

There is deliberately no `README.md` in the package tree: none exists at
`middleware/context-oracle/README.md` (`ls -a`, 2026-09-07) and `CLAUDE.md`'s
information policy ("a new file is almost never the answer") governs; Step 40
leaves that as-is.

### 5.2 Files modified at plan-delivery time

- `middleware/context-oracle/docs/STATUS.md` — rewritten (not appended) per
  the `CLAUDE.md` session protocol.
- `middleware/context-oracle/docs/plans/plan-phase-a.md` — this file.

### 5.3 Files modified at build time (the one sanctioned in-tree write, `D-9`)

- `<owner-repo>/.claude/settings.json` — hook entries added by `ctxoracle
  init` (Step 31); removed by `ctxoracle deinit` (Step 32). Not part of *this*
  plan's file set — it is the runtime effect of the `init` verb inside the
  owner's own repository at install time. Recorded here so the reader sees the
  one in-tree write in the file map.

### 5.4 Dependents that may need verification after changes

None. `codegraph_scan` of `middleware/context-oracle/` (2026-09-07, `force:
true`) finds exactly one code file, `tools/check_docs.py`, and
`codegraph_get_dependents` / `codegraph_get_change_impact` on it return zero
dependents and a blast radius of one (§11.6). The check-tooling and the CI
workflow `.github/workflows/context-oracle-docs.yml` operate on documentation
only and import none of the code this plan introduces.

### 5.5 Related docs (deterministic sweep)

`codegraph_find_related_docs` cannot return documents for files that do not
yet exist (it reports "File not found in graph" for every planned path —
§11.6), so the sweep over the planned paths is the `codegraph_list_docs`
inventory (71 documentation files under `middleware/context-oracle/`, of
which only `CLAUDE.md` references a code file, `tools/check_docs.py`) read
against the planned tree:

- `docs/STATUS.md` — rewritten at plan delivery (§5.2) and at post-completion
  (Step 40).
- `docs/architecture-phase-a.md` — the plan derives from it; the architecture
  is never edited by the plan or the build. A behavior surfacing during build
  that contradicts the architecture is a Stop-and-Escalate condition: raise it
  to the owner rather than silently drift the code from the architecture.
- `CLAUDE.md`, `OWNER-LEDGER.md`, `RETHINK.md`, `docs/collapse-log.md`,
  `docs/IDEAS.md`, `docs/judgment-layer-corrected-foundation.md`,
  `docs/handoffs/*` (history only), `docs/reviews/*` (written once, never
  edited) — none references `middleware/context-oracle/ctxoracle/**`
  (`codegraph_list_docs` shows zero referenced code files for each; the path
  does not exist yet). The post-build `codegraph_verify_doc` step in §16
  re-runs this check once the code exists.

---

## 6. Foundation corrections

None. The deterministic probes were run over the affected area on 2026-09-07
(`codegraph_scan` with `force: true`, then `codegraph_find_broken_imports`,
`codegraph_find_unused_imports`, `codegraph_find_dead_exports`,
`codegraph_find_orphans`, `codegraph_find_unreachable`, `codegraph_find_cycles`,
`codegraph_find_bridges`, `codegraph_list_endpoints` — outputs in §11.6): the
one code file (`tools/check_docs.py`) has no broken or unused imports, no dead
exports, is unreachable-free, and forms no cycle; it is reported as an orphan
because nothing imports a standalone CLI script, which is its intended shape.
Architecture `L8` states the same fact ("this architecture introduces a new
component tree; it modifies no existing code"). No pre-existing pattern is
being extended, so nothing receives a foundation correction.

If, during the build, a check-tooling change becomes necessary (for example,
adding a key retirement when the build reveals a stale reference), that change
lives in the same PR that reveals it, per `CLAUDE.md`: "extending it when a
key is legitimately retired is a deliberate, explained change in the same
PR." That is a follow-up mechanism, not a foundation correction — it is not
scheduled here because no such change is currently identified.

---
## 7. Plan — ordered steps

Steps are topologically sorted: a step's `Dependencies` field names every
earlier step it consumes, and no step names a later one. The order is:
substrate (Steps 1–12: packaging, runtime, adapter, layout, identity, faults,
schemas, DAOs, diagnostics writers with the watchdog and guard, security,
tuning) → the whisper path
(Steps 13–20: miner, indexer, frontends, bar, command classifier, genres,
compose, delivery) → the answer-drift block (Steps 21–27: reader, qa state,
recognizers, deny confinement, the block, deny health, question lifetime) →
the pipeline (Steps 28–30: handler, adapter, CLI entry and replay harness;
watchdog and guard verification; SessionEnd fold and regret) → the CLI verbs (Steps
31–35) → the Phase B seam stub (Step 36) → tests and exit (Steps 37–40).
The block is built after the whisper path and before the handler for two
reasons: every acceptance test of the block replays through the real
handler binary (AD-24), so none can run before Step 28 exists; and the
recognizers are built after the whisper path and before the block that
consumes them, against a complete substrate, with their unit tests
asserting the coverage they must *not* have (Step 23) — the mechanical form
of the restraint spec §11.5 demands. Test infrastructure precedes its first
user: the fixture generator and transcript fixtures are Step 1's, the
replay harness is Step 28's, so every Verification field names only tests
runnable at its step.

**Non-trivial vs trivial marking.** Every step is non-trivial by default (Gate
3 four-part format) unless it is a pure mechanical construction whose only
choice is prescribed by the architecture, in which case the format collapses
to one sentence naming the `AD-n` Source.
The trivial steps are **8 and 40**.
All others use the full four-part format.

**Verification field ↔ Test specification.** Each step's `Verification` field
names the test IDs (§12) whose passing constitutes verification. Tests that
replay through the built handler binary carry IDs `T-38-*` and are executed at
the checkpoint named in the step; the step's immediate verification is the
function-level tests it names.

---

### Step 1 — Package skeleton, TypeScript strict, test runner, fixture generator, CI jobs

```step-decl
step: S1
covers: [PA-10, PA-12]
files:
  create: [.github/workflows/context-oracle-ctxoracle.yml, middleware/context-oracle/ctxoracle/package.json, middleware/context-oracle/ctxoracle/tsconfig.json, middleware/context-oracle/ctxoracle/scripts/run-tests.mjs, middleware/context-oracle/ctxoracle/test/build/tsc_fixture.ts, middleware/context-oracle/ctxoracle/test/replay/transcript_fixtures/, middleware/context-oracle/ctxoracle/test/fixtures/generate.ts, middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-full/, middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-shallow/, middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-shallow-no-origin/, middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-nongit/, middleware/context-oracle/ctxoracle/test/fixtures/repos/miner-hygiene/, middleware/context-oracle/ctxoracle/test/fixtures/repos/indexer-small/, middleware/context-oracle/ctxoracle/test/fixtures/repos/coupling-nonobvious/, middleware/context-oracle/ctxoracle/test/fixtures/repos/orientation-mixed-shape/, middleware/context-oracle/ctxoracle/test/fixtures/repos/reuse-mixed-language/, middleware/context-oracle/ctxoracle/test/fixtures/repos/reuse-observed-zero/, middleware/context-oracle/ctxoracle/test/fixtures/repos/reuse-same-name-collision/, middleware/context-oracle/ctxoracle/test/fixtures/repos/consequence-coupled-tests/, middleware/context-oracle/ctxoracle/test/fixtures/repos/warning-landmine/, middleware/context-oracle/ctxoracle/test/fixtures/repos/completeness-paired-change/, middleware/context-oracle/ctxoracle/test/fixtures/repos/verification-covering-test/, middleware/context-oracle/ctxoracle/test/fixtures/repos/bar-two-candidates/, middleware/context-oracle/ctxoracle/test/fixtures/repos/dedup-read-set/, middleware/context-oracle/ctxoracle/test/fixtures/repos/corpus-floor-29/, middleware/context-oracle/ctxoracle/test/fixtures/repos/answer-drift-clearly-off/, middleware/context-oracle/ctxoracle/test/fixtures/repos/pristine-tree/, middleware/context-oracle/ctxoracle/test/fixtures/repos/secret-injection/, middleware/context-oracle/ctxoracle/test/fixtures/repos/subagent-delivery/, middleware/context-oracle/ctxoracle/test/fixtures/repos/language-config-added/, middleware/context-oracle/ctxoracle/test/fixtures/repos/seeded-facts/, middleware/context-oracle/ctxoracle/test/fixtures/repos/regret-true-positive/, middleware/context-oracle/ctxoracle/test/fixtures/repos/regret-no-inflate/, middleware/context-oracle/ctxoracle/test/fixtures/repos/over-threshold-file/, middleware/context-oracle/ctxoracle/test/unit/package_build.test.ts, middleware/context-oracle/ctxoracle/test/unit/run_tests_guard.test.ts, middleware/context-oracle/ctxoracle/test/unit/generator_determinism.test.ts]
  modify: []
  delete: []
provides: [npm-ci, npm-test, npm-run-test, npm-run-build]
tests: [T-1-1, T-1-2, T-1-3]
depends_on: []
```


**What changes.** Create `middleware/context-oracle/ctxoracle/package.json`
with `"type": "module"`, `"bin": {"ctxoracle": "dist/src/cli/dispatch.js"}`,
`"engines": {"node": ">=22.16.0"}`, runtime dependencies exactly
`{"web-tree-sitter": "0.26.13", "tree-sitter-wasms": "0.1.13"}` (exact
pins, no range), dev dependencies exactly `{"typescript": "5.9.3",
"@types/node": "22.20.1"}`, scripts `"build": "tsc -p tsconfig.json"`,
`"test": "node scripts/run-tests.mjs"`, a `"files"` list of `dist/`,
`src/` (the runtime-read `.sql` migrations live there), and `scripts/`,
and **no** `install`, `postinstall`, or `preinstall` script. Create `tsconfig.json` with
`"strict": true`, `"target": "ES2022"`, `"module": "NodeNext"`,
`"moduleResolution": "NodeNext"`, `"rootDir": "."`, `"outDir": "dist"`,
`"include": ["src", "test"]`, `"exclude": ["test/build/fixtures"]`,
`"declaration": false`, `"verbatimModuleSyntax": true`; relative imports in
source and tests are written with the `.js` extension (NodeNext resolution),
so the emitted JavaScript needs no rewriting. Compiled output lands at
`dist/src/**` and `dist/test/**`. The `exclude` keeps the must-fail
compile-time fixtures (`test/build/fixtures/*.ts`, §5.1) out of the project
build; each compile-time test (`T-9-2`, `T-11-5`, `T-24-1`, `T-24-3`) invokes
`tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution
NodeNext --verbatimModuleSyntax --types node <fixture>` on its fixture alone
through `test/build/tsc_fixture.ts` (a helper that spawns `tsc` from the
package's own `node_modules/.bin` and returns the exit code and diagnostics)
and asserts a non-zero exit whose diagnostics name the intended error
(executed 2026-09-07: a must-fail fixture inside `include` turns `tsc -p`
red; with the `exclude` the build is green and the per-fixture invocation
still fails on the fixture — §11.4).

Create `test/fixtures/generate.ts` — one deterministic generator per
fixture repository named in §5.1 (`test/fixtures/repos/<name>`), invoked by
the tests that use it (`generateFixture(name, dir)`), building real `git`
repositories with `git init`/`git add`/`git commit` through
`node:child_process` directly (test code under `test/**` is outside the
`dist/src/**` scope of `T-5-3`, and the oracle's spawn wrapper does not exist
before Step 5). Every commit carries a fixed author, a fixed message, and a
fixed absolute timestamp from the generator's seed (`GIT_AUTHOR_DATE` /
`GIT_COMMITTER_DATE`), so the same name yields the same commit hashes on
every machine (`T-1-3`); the scenario each fixture plants is the one its
consuming test's `Data` field states, and the generator writes nothing a
test asserts on except the scenario itself (D-plan-5). Also create the
transcript fixtures under `test/replay/transcript_fixtures/` — one JSONL
file per V12 shape: marker-carrying human turns, a marker-less string-content
user entry, an injected task-notification entry (`origin.kind:
"task-notification"`), a Stop-hook feedback entry (`isMeta: true`), and a
lag fixture whose clearing assistant turn is appended by the test that uses
it — written as literal files, not generated.

Create `scripts/run-tests.mjs` (dependency-free): it enumerates
`dist/test/unit/**/*.test.js`, `dist/test/build/**/*.test.js`, and
`dist/test/conventions/**/*.test.js` with `fs.readdirSync(dir, {recursive:
true})`; counts the `*.test.ts` sources under `test/unit`, `test/build`,
`test/conventions`; **exits 1 with a plain-language message if the total
compiled count is zero or if, for any of the three directories, the
compiled count differs from the source count** (a directory with no
sources and no compiled files is consistent, so the build tier being
empty before Step 9 is not a failure); otherwise runs
`execFileSync(process.execPath, ['--test', ...files], {stdio: 'inherit'})`
and propagates the exit code. With `--replay` it does the same for
`dist/test/replay/**/*.test.js` (the acceptance tier, Steps 37–38).

Add `.github/workflows/context-oracle-ctxoracle.yml` with one job at this
step, on every pull request touching `middleware/context-oracle/ctxoracle/**`:
`test`, `runs-on: ubuntu-24.04`, runs `npm ci`, `npm run build`, `npm test`
on Node 22.16.0 **and** on the current 22.x release (a two-entry matrix —
the floor and the head of the line). The replay tier (`npm test --
--replay`) is added to this job by Step 28, when the first replay test
exists (the runner's count guard covers `test/replay` too, so adding it
earlier would be a red run on an empty set), and the `cold-container` job
`AC-20` names is added by Step 38, when its script exists.

**Creates.** `.github/workflows/context-oracle-ctxoracle.yml` — CI: build + unit/integration/convention tier; `package.json` — AD-25; `tsconfig.json` — AD-25; compiles src/ and test/ into dist/; `scripts/run-tests.mjs` — enumerates compiled tests; refuses a zero/mismatched set; `test/build/tsc_fixture.ts` — helper: runs tsc --noEmit on one fixture, returns exit code + diagnostics; `test/replay/transcript_fixtures/` — transcript JSONL fixtures (marker-carrying, marker-less, injected-turn, lag); `test/fixtures/generate.ts` — entry point for all fixture-repo generators (D-plan-5); `test/fixtures/repos/repo-key-full/` — full history, 3 root commits; `test/fixtures/repos/repo-key-shallow/` — depth-1 clone of repo-key-full with origin; `test/fixtures/repos/repo-key-shallow-no-origin/`; `test/fixtures/repos/repo-key-nongit/` — plain directory; `test/fixtures/repos/miner-hygiene/` — planted pair, merge commit, 45-file commit, beyond-horizon commit; `test/fixtures/repos/indexer-small/` — 3 .ts files, 1 .py, 1 .sh, 1 >1 MB file, planted secret; `test/fixtures/repos/coupling-nonobvious/` — cross-directory pair + same-dir same-stem pair; `test/fixtures/repos/orientation-mixed-shape/` — low-in-degree main/cli + high-in-degree hub; `test/fixtures/repos/reuse-mixed-language/` — grammar-covered dominant + generic-frontend candidate; `test/fixtures/repos/reuse-observed-zero/` — grammar-covered symbol with observed 0 count; `test/fixtures/repos/reuse-same-name-collision/` — comment/string collisions; `test/fixtures/repos/consequence-coupled-tests/` — file co-changing with two test files; `test/fixtures/repos/warning-landmine/` — revert_chain + fix_chatter rows, low-confidence row; `test/fixtures/repos/completeness-paired-change/`; `test/fixtures/repos/verification-covering-test/` — changed region with a covering test; run / not-run / run-and-failed variants; `test/fixtures/repos/bar-two-candidates/`; `test/fixtures/repos/dedup-read-set/`; `test/fixtures/repos/corpus-floor-29/` — 29 non-excluded commits, generator adds the 30th; `test/fixtures/repos/answer-drift-clearly-off/`; `test/fixtures/repos/pristine-tree/`; `test/fixtures/repos/secret-injection/`; `test/fixtures/repos/subagent-delivery/`; `test/fixtures/repos/language-config-added/`; `test/fixtures/repos/seeded-facts/` — planted coupling + planted landmine; `test/fixtures/repos/regret-true-positive/` — a held fact and a never-triggered fact); `test/fixtures/repos/regret-no-inflate/`; `test/fixtures/repos/over-threshold-file/` — >1 MB file carrying a seeded fact (AD-24).

**Source.** `AD-25` (packaging: two runtime deps, no postinstall, no native
code, `tsc` build); `AD-2` (Node ≥ 22.16.0, TypeScript strict ESM); `AD-24`
(`node:test` suites); `C-3` (no prebuilt-binary download, no native
toolchain); V14 (the verified dependency versions).

**Why this approach (Gate 3):**
1. **The decision.** Runtime deps pinned to the exact versions V14 verified;
   dev deps pinned to `typescript` 5.9.3 and `@types/node` 22.20.1; tests
   compiled by the same `tsc` run as the sources and executed from `dist/`
   through a runner that refuses an empty or incomplete test set, with the
   must-fail fixtures excluded from that build and compiled one at a time by
   the tests that expect them to fail; fixture repositories generated
   deterministically by a script that exists before the first test needs
   one; CI runs at the floor and at the current 22.x plus the cold-container
   job.
2. **The authoritative standard.** Node.js v22.x documentation (`test`,
   `typescript`, `cli` pages, read 2026-09-07 — §11.4): `node --test`
   executes JavaScript files, adds TypeScript files only when type stripping
   is enabled, and type stripping is default only from v22.18.0 (experimental
   behind a flag from 22.6.0); executed here: `node --test` with a pattern
   matching no file exits 0 with zero tests. `AD-25` for the tsc-only build;
   `AD-2` for the floor.
3. **Why this standard applies here.** The runtime floor is 22.16.0, where a
   `.ts` test file does not execute without an experimental flag that
   does not read `tsconfig.json` and emits `.ts` import specifiers the
   compiled tree does not use;
   compiling tests with the sources is the one path that works at the floor
   with no extra loader. Because the runner exits 0 on an empty match, a
   glob that silently matches nothing would turn every "Fails when" clause in
   §12 into documentation — the guard in `run-tests.mjs` is what makes a
   missing test a red run. Exact runtime pins are the versions the
   architecture verified (V14); reproducing that surface is the point of the
   pin, and a bump is architecture work (re-verifying V14), not a plan-time
   choice. `typescript` 5.9.3 is the last release of the 5.x line, the line the
   Node type-stripping guidance and the `@types/node` 22.x typings are
   documented against; TypeScript 7.0.2 (2026-07-08) is a new native compiler
   that removed several options and changed defaults (§11.4) — the tsconfig
   above uses no removed option, so a later bump is a version change only,
   but a two-month-old compiler line is a separate verified decision, not a
   plan default.
4. **What this is NOT — and why.** Not `--experimental-strip-types` at the
   floor (experimental, no `tsconfig`, `.ts` import specifiers that differ
   from the emitted `.js` ones — two module layouts for one codebase).
   Not `tsx`, `vitest`, or `jest` (an extra loader and dependency for no
   property the compiled path lacks; AD-25 fixes the build as `tsc` only).
   Not a caret range on the runtime deps (a range admits a surface the
   architecture did not verify). Not a bare `node --test` glob in CI (a
   vacuous pass on an empty match, observed).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-1-1` (clean `npm ci` + `npm run build` from a fresh
checkout with no install-phase script executed, with a must-fail fixture
present under `test/build/fixtures/`), `T-1-2` (the runner exits 1 on an
empty compiled set and on a source/compiled count mismatch, and exits
non-zero when a compiled test fails), `T-1-3` (the fixture generator is
deterministic: two generations of the same name yield identical commit
hashes, and every §5.1 fixture name generates).

**Impact if wrong.** Contained — a broken package skeleton fails Step 1's
own verification; every subsequent step's `npm ci` also fails, so the
mistake is visible immediately. A broken runner guard is the one silent
failure class here, and `T-1-2` exercises it directly.

---

### Step 2 — Runtime floor check

```step-decl
step: S2
covers: [PA-3]
files:
  create: [middleware/context-oracle/ctxoracle/src/util/env.ts, middleware/context-oracle/ctxoracle/test/unit/env.test.ts]
  modify: []
  delete: []
provides: [assertRuntime]
tests: [T-2-1]
depends_on: [S1]
```


**What changes.** Create `src/util/env.ts` exporting
`assertRuntime(version = process.versions.node)`: compares to `22.16.0` by
SemVer, throws a plain-language `Error` naming the current and required
versions on mismatch. Called from Step 31's `init` verb and Step 33's
`status`; Step 2 delivers the function and its unit test, not the wiring.

**Creates.** `src/util/env.ts` — runtime floor check.

**Source.** `AD-2` (runtime floor 22.16.0, checked at `init` and `status`
with a plain-language error; the floor exists because FTS5 entered
`node:sqlite` in v22.16.0 — V7 — and `sqlite.backup()` too — V17).

**Why this approach (Gate 3):**
1. **The decision.** Fail loud at `init` and `status` with a plain-language
   message; the comparison is a real SemVer comparison, not a string prefix.
2. **The authoritative standard.** `AD-2`; the Node 22 changelog (fetched
   2026-09-07, §11.4: v22.16.0 is the release whose `sqlite` changes ship
   FTS5 per V7's `sqlite.gyp` diff).
3. **Why this standard applies here.** The floor rule exists to catch the
   22.13–22.15 case where a loose check would silently pass and land the
   owner on degraded search — the architecture states this as the reason
   the floor is 22.16.0, not C-1's 22.13.0 unflagged-since figure.
4. **What this is NOT — and why.** Not a soft warning (a warning the
   non-programmer owner does not see is not a signal — `OL-11`, `OL-10`).
   Not a string-prefix comparison (`22.9.0` sorts after `22.16.0` as a
   string). Not the FTS5 capability check itself (that is an execution
   probe, Step 3, because a distro-compiled Node can carry any version
   string with any flag set).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-2-1`.

**Impact if wrong.** Contained to `init`/`status`: a broken check either
falsely rejects a good runtime (loud) or falsely accepts a bad one (caught
by Step 3's FTS5 probe or a downstream statement failure). Never on the
hook path.

---

### Step 3 — Store adapter: the single `node:sqlite` importer, concurrency discipline

```step-decl
step: S3
covers: [PA-3]
files:
  create: [middleware/context-oracle/ctxoracle/src/stores/adapter.ts, middleware/context-oracle/ctxoracle/test/unit/stores_adapter.test.ts, middleware/context-oracle/ctxoracle/test/conventions/sqlite_single_importer.test.ts, middleware/context-oracle/ctxoracle/test/unit/concurrency.test.ts, middleware/context-oracle/ctxoracle/test/unit/fts5_probe.test.ts]
  modify: []
  delete: []
provides: [Store, StoreBusy, probeFts5]
tests: [T-3-1, T-3-2, T-3-3, T-3-4]
depends_on: [S1, S2]
```


**What changes.** Create `src/stores/adapter.ts` — the ONLY file in the
codebase that imports `node:sqlite`. Exports:
- `openStore(path: string): Store` — opens a WAL-mode SQLite database at
  `path` with `foreign_keys=ON`, `busy_timeout=100`, prepares statement
  caches, returns a `Store` handle.
- `Store.prepare(sql: string): Statement` — prepared statement wrapper.
- `Store.transaction<T>(fn: () => T): T` — `BEGIN IMMEDIATE`/`COMMIT`/
  `ROLLBACK`; on `SQLITE_BUSY` retries **once**; on the second failure it
  raises a typed `StoreBusy` error the caller turns into the `store_busy`
  fault and fails open (AD-26).
- `Store.close()`, `Store.integrityCheck(): 'ok' | 'failed'` (runs `PRAGMA
  quick_check` — used only off the event path per AD-17).
- `Store.exportTo(destPath: string): void` — implements `VACUUM INTO`
  (AD-5, V17) for AC-19.
- `probeFts5(db): boolean` — attempts `CREATE VIRTUAL TABLE _fts5_probe
  USING fts5(x); DROP TABLE _fts5_probe;` inside a transaction, rolling
  back on throw (AD-2's defense-in-depth probe, called by `init`, Step 31;
  on `false` the search interface falls back to indexed `LIKE`/token-prefix
  queries and `status` says so).
Create `test/conventions/sqlite_single_importer.test.ts` (built-output grep
over `dist/src/**/*.js`): passes only when `dist/src/stores/adapter.js` is
the sole file containing `node:sqlite`.

**Creates.** `src/stores/adapter.ts` — the ONLY node:sqlite importer (AD-2, AD-26).

**Source.** `AD-2` (quarantine `node:sqlite`'s Experimental status behind a
single-file seam; FTS5 probed at `init` as a real statement; V7 re-executed
2026-09-07 on Node v22.22.2 — §11.4); `AD-26` (WAL + `busy_timeout=100ms` + single-transaction
writes per event + retry-once on `SQLITE_BUSY`, fail-open on the second
failure with a `store_busy` diagnostic); `AD-5` (export via `VACUUM INTO`).

**Why this approach (Gate 3):**
1. **The decision.** One file imports `node:sqlite`; every other component
   consumes the `Store` interface. `BEGIN IMMEDIATE` (not `DEFERRED`) is
   the transaction default so writers serialize deterministically instead of
   racing to upgrade; retry-once then fail-open is the AD-26 give-up path.
2. **The authoritative standard.** `AD-2`, `AD-26`; SQLite WAL documentation
   (readers do not block the writer, one writer at a time — exercised by
   architecture V8 and re-exercised 2026-09-07, §11.4); ISO/IEC 25010
   analysability (a single seam file makes the Experimental-API surface
   auditable).
3. **Why this standard applies here.** `node:sqlite`'s Experimental status
   means its API surface may change between Node minor versions;
   quarantining the import to one file makes a future API adaptation a
   single-file change instead of a codebase-wide sweep. `BEGIN IMMEDIATE`
   is required because the deny-path audit write (AD-8) must not fail
   silently to `SQLITE_BUSY` in a way that swallows a concurrent writer's
   change; the bounded retry keeps `NF-1`.
4. **What this is NOT — and why.** Not `better-sqlite3` (C-3 excludes it —
   native prebuilds break cold-container install). Not the callback-based
   `sqlite3` package (blocks on every callback; `DatabaseSync` stays within
   V8's ~2 ms budget). Not `BEGIN DEFERRED` (upgrade races on write). Not a
   long `busy_timeout` or unbounded retry (blocks the event path — `NF-1`).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-3-1` (adapter WAL/STRICT/PRAGMA round-trip), `T-3-2`
(single-importer convention), `T-3-3` (two contending writers: one wins, the
other retries once and succeeds; a third contended write fails open with
`StoreBusy`), `T-3-4` (the FTS5 probe returns `true` on this runtime and the
probe table is gone afterwards).

**Impact if wrong.** Systemic — every downstream step opens the store
through this seam. A broken WAL flag would degrade concurrency (silent, hard
to diagnose) — mitigated by `T-3-1` explicitly asserting `PRAGMA
journal_mode` returns `wal`.

---

### Step 4 — `~/.ctxoracle/` layout, 0700 permissions, `CTXORACLE_HOME`

```step-decl
step: S4
covers: [PA-3, PA-6]
files:
  create: [middleware/context-oracle/ctxoracle/src/identity/home.ts, middleware/context-oracle/ctxoracle/src/identity/layout.ts, middleware/context-oracle/ctxoracle/test/unit/layout.test.ts]
  modify: []
  delete: []
provides: [ensureLayout]
tests: [T-4-1]
depends_on: [S1, S3]
```


**What changes.** Create `src/identity/home.ts` exporting `ctxoracleHome():
string` — resolves `process.env.CTXORACLE_HOME || path.join(os.homedir(),
'.ctxoracle')`. Create `src/identity/layout.ts` with `ensureLayout(home:
string, repoKey: string): { global: string; project: string; diagnostics:
string; lock: string; looseMode: string[] }` — creates directories at mode
`0o700` if missing, returning absolute paths for `<home>/global/global.db`,
`<home>/projects/<repoKey>/store.db`, `<home>/projects/<repoKey>/diagnostics/`
and the reindex lock path, plus the list of pre-existing directories whose
mode is looser than `0o700` (never `chmod`ed; `status` reports them).

**Creates.** `src/identity/home.ts` — ~/.ctxoracle layout, 0700; `src/identity/layout.ts` — ensureLayout helper.

**Source.** `AD-3` (root `~/.ctxoracle/`, override `CTXORACLE_HOME`, 0700
directories); `FR-X5` least privilege; `FR-X7` locality.

**Why this approach (Gate 3):**
1. **The decision.** Directories are created at `0o700` on first use;
   `CTXORACLE_HOME` overrides the default; a directory that exists with
   loose permissions is left as-is and reported by `status` (never silently
   `chmod`ed — the store may already contain the owner's data and altering
   its permissions is an out-of-scope change).
2. **The authoritative standard.** `AD-3` (architecture); OWASP ASVS 5.0
   V14 (Data Protection) — restrict local file mode to owner-only for files
   containing user data.
3. **Why this standard applies here.** The stores hold the owner's
   corrections, session logs, and mined history — every planted-secret
   redaction failure (`L5`) would leak through a world-readable store. The
   0700 mode is the last-line control per T3.
4. **What this is NOT — and why.** Not encryption-at-rest (single-user
   local scope, no local-attacker actor per §2.3). Not `chmod` on
   pre-existing loose permissions (data integrity risk; visibility is the
   right response). Not per-file mode overrides (directory mode is what
   controls access; per-file overrides add surface without gain).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-4-1`.

**Impact if wrong.** Contained to the local user — if the wrong home is
resolved, `init` writes to the wrong place (owner sees no data in
`status`; recoverable by fixing `CTXORACLE_HOME`).

---

### Step 5 — Repository identity resolver

```step-decl
step: S5
covers: [PA-3, PA-9]
files:
  create: [middleware/context-oracle/ctxoracle/src/identity/repo_key.ts, middleware/context-oracle/ctxoracle/src/util/hash.ts, middleware/context-oracle/ctxoracle/src/util/spawn.ts, middleware/context-oracle/ctxoracle/test/unit/repo_key.test.ts, middleware/context-oracle/ctxoracle/test/unit/spawn_wrapper.test.ts, middleware/context-oracle/ctxoracle/test/conventions/child_process_single_importer.test.ts]
  modify: []
  delete: []
provides: [resolveRepoKey, oracleSpawn]
tests: [T-5-1, T-5-2, T-5-3]
depends_on: [S1, S4]
```


**What changes.** Create `src/identity/repo_key.ts` exporting
`resolveRepoKey(repoPath: string): { key: string; mode:
'commit'|'url'|'path'; identity: string }`, and `src/util/hash.ts` (SHA-256
helpers). Rules, in order:
1. `git rev-parse --is-inside-work-tree` false → rule 4.
2. `git rev-parse --is-shallow-repository` true → identity = the
   **normalized origin URL** (`git config --get remote.origin.url`) when a
   remote exists, else rule 4; `mode='url'`. Normalization, every axis
   stated: parse the three remote forms (`scheme://[user@]host[:port]/path`,
   the scp-like `[user@]host:path`, and a bare local path, which is rule 4);
   drop user-info; lowercase scheme and host; keep an explicit port;
   strip a trailing `/` and a trailing `.git`; keep path case as written;
   identity string = `host[:port]/path`. The scheme itself is dropped, so an
   SSH and an HTTPS clone of the same remote key identically; a host that
   treats paths case-insensitively can still yield two keys for two clones
   written in different case — that residual is not normalized away
   (normalizing case would merge distinct repositories on case-sensitive
   hosts) and is visible because `status` prints the identity string, not
   only the mode.
3. `--is-shallow-repository` false → `git rev-list --max-parents=0 HEAD`,
   sort the hashes lexicographically, take the smallest; `mode='commit'`.
4. SHA-256 of `fs.realpathSync(repoPath)`; `mode='path'`. Also taken, with
   a diagnostic, when `--is-shallow-repository` prints anything other than
   `true`/`false`.
The key is the first 12 hex characters of SHA-256 over the identity string.
`init` performs **no** `git fetch`.

Also create `src/util/spawn.ts` — the ONLY file in the codebase that imports
`node:child_process`. It exports `oracleSpawn(cmd, args, {cwd, env?, detached?,
scrub?})` and `oracleExecFileSync(...)`; every child it starts carries
`CTXORACLE_INTERNAL=1` in its environment (AD-21's recursion guard as a
structural property), and with `scrub: true` the child environment drops
exactly the **session-identity set** `SCRUBBED_ENV` exported by the module:
`CLAUDECODE`, `CLAUDE_CODE_SESSION_ID`, `CLAUDE_CODE_REMOTE_SESSION_ID`,
`CLAUDE_CODE_CHILD_SESSION`, `CLAUDE_PID`, `CLAUDE_CODE_ENTRYPOINT` — the
variables that make a `claude -p` child attach to the parent's session
(executed 2026-09-07: with this set removed the child reports a fresh
`session_id` and still authenticates; with none removed it reports the
parent's — §11.4). Authentication and routing variables are inherited
untouched: the piggyback is the host's own access (`OL-7`, spec §10), and
`ANTHROPIC_BASE_URL`-class routing is part of that access, not a credential.
The `git` subprocesses here, the miner's `git log` (Step 13), the detached
reindex and integrity child (Steps 14, 28), and the future model call all go
through it. A convention test
(`test/conventions/child_process_single_importer.test.ts`, an import scan
over `dist/src/**` that resolves both specifier spellings,
`'node:child_process'` and `'child_process'`) passes only when
`dist/src/util/spawn.js` is the sole importer.

**Creates.** `src/identity/repo_key.ts` — AD-3; `src/util/hash.ts` — SHA-256 helpers; `src/util/spawn.ts` — the ONLY node:child_process importer; sets CTXORACLE_INTERNAL=1.

**Source.** `AD-3` (deterministic rule; the shallow branch is URL or path,
never commit; init performs no fetch — `FR-X5`; `status` displays the key
and its mode); `AD-21` (every process the oracle spawns carries
`CTXORACLE_INTERNAL=1`; the environment scrub and cwd isolation of the
piggyback seam); `FR-J4` (recursion guard as a property).

**Why this approach (Gate 3):**
1. **The decision.** Full-history repos key on the lex-smallest root commit
   (traversal order is not a specified property of `git rev-list`);
   shallow repos never derive from history because the shallow set varies
   per clone (V13: 4 boundary commits on one clone, 6 on another of the
   same repo); the URL normalization axes are enumerated so the same remote
   written two ways keys once, and the one axis deliberately left alone
   (path case) is disclosed and visible.
2. **The authoritative standard.** `AD-3` (architecture); git's own
   documentation of `--max-parents=0` (returns root commits — a shallow
   clone's roots are the shallow boundary, not the true roots) and of the
   remote URL forms git accepts (`git help clone`, "GIT URLS").
3. **Why this standard applies here.** A key that silently differs between
   two clones of the same repo splits one repository's knowledge across two
   stores — `FR-K9`'s export/import cannot repair that (the exports would be
   against different keys). Normalizing the URL forms git itself treats as
   the same remote is what keeps the shallow branch from re-opening exactly
   that split; printing the identity string is what makes any remaining
   split visible.
4. **What this is NOT — and why.** Not "first line of `rev-list`"
   (underspecified — the 2026-07 F5 finding). Not origin-URL primary
   (mutable, often absent in sandboxes; only used where history cannot be
   trusted, visibly). Not a `git fetch` inside `init` (`FR-X5` permits
   network only on the host-CLI piggyback). Not case-folding the path
   (would merge distinct repositories on case-sensitive hosts). Not
   per-call-site environment discipline for the recursion guard (the first
   forgotten call site turns the Phase B piggyback into a hook recursion —
   the single-importer wrapper makes the property structural, the same
   discipline AD-2 applies to `node:sqlite` and AD-10 to the deny verdict).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-5-1` (the four rules on four fixture repositories, plus
the normalization table: SSH scp-form, `ssh://`, `https://` with user-info,
trailing `.git`, trailing `/`, explicit port — the first five collapse to one
identity, the port case does not), `T-5-2` (every child started through the
wrapper sees `CTXORACLE_INTERNAL=1`; with `scrub: true` no member of
`SCRUBBED_ENV` reaches it and every other variable does), `T-5-3` (the
single-importer convention under both specifier spellings).

**Impact if wrong.** Systemic within one repo — a wrong key silently splits
data. Mitigated by `status` displaying the key, mode, and identity string,
and by AD-20's plain-language "would change keying mode" prompt on re-init
(Step 31).

---

### Step 6 — Shared types, stable fault codes, JSONL fault channel

```step-decl
step: S6
covers: [PA-3, PA-5]
files:
  create: [middleware/context-oracle/ctxoracle/src/diag/fault_codes.ts, middleware/context-oracle/ctxoracle/src/diag/jsonl.ts, middleware/context-oracle/ctxoracle/src/types/events.ts, middleware/context-oracle/ctxoracle/src/types/candidate.ts, middleware/context-oracle/ctxoracle/src/types/index_types.ts, middleware/context-oracle/ctxoracle/test/unit/fault_codes.test.ts, middleware/context-oracle/ctxoracle/test/unit/jsonl_writer.test.ts, middleware/context-oracle/ctxoracle/src/security/trust.ts]
  modify: []
  delete: []
provides: [Candidate, EventContext, InternalEvent, EventKind, SymbolRow, ImportEdge, Pointer, Trust, assertProvenance, TuningReader]
tests: [T-6-1, T-6-2]
depends_on: [S1, S4]
```


**What changes.** Create `src/diag/fault_codes.ts` exporting
`FAULT_CODES` — a readonly `as const` tuple of string literals — and the
derived type `FaultCode = (typeof FAULT_CODES)[number]`, holding every code
the architecture names, verbatim: from AD-17
`hooks_not_firing`, `latency_breach`, `store_corrupt`, `index_stale`,
`produced_but_undelivered`, `deny_after_answer_lag`,
`deny_despite_answer_text`, `deny_loop`, `deny_bypass_suspect`,
`catchup_incomplete`, `intake_invalidated`, `rebuild_recovered_nothing`,
`transcript_layout_changed`, `unrecognized_user_entry`, and the two reserved
codes `model_path_down` and `missed_skill_block` (used only by the `status`
renderer to say "not yet measured (Phase B/C)"); from AD-26 `store_busy`;
and two codes this plan names: `whisper_dropped_stale` for AD-15's
compose-time drop (a candidate whose pointer failed re-resolution) and
`tuning_missing` for a `tuning` key read that finds no row (Step 12's
`TuningReader` re-seeds the key from its seed module and records this code
with the key in `detail`).

Create `src/security/trust.ts` — the `Trust` type (`'untrusted_repo' |
'human' | 'mechanical'`, mirroring the DB CHECK of Step 7) and
`assertProvenance(row)`, the helper every learned-record DAO entry point
(Step 9) calls so that a non-human-provenance input can only be written as
`'untrusted_repo'` (`FR-X4`); it lives here, with the shared types, because
Step 9 consumes it and Step 11 (the redactor and the injection flagger) is
built after Step 9.

Create the shared internal types every later module names, so that no step
uses a type a later step defines: `src/types/events.ts` — `EventKind` (the
eight AD-6 event names as a string-literal union), `InternalEvent` (the
adapter's output: `kind`, `session`, `consumer`, `toolName?`, `toolInput?`,
`toolResponse?`, `errorText?`, `transcriptPath`, `promptText?`,
`startSource?`, `lastAssistantMessage?`, `stopHookActive?`, `workingDir` —
every member is named so that no hook wire field name appears as an
identifier outside the adapter, the property `T-28-2` scans for),
`EventContext` (`InternalEvent` plus the resolved `repoPath`, `repoKey`,
`indexStale: boolean` (Step 14's flag, read by the handler), and the
session's `observed_actions` reader); `src/types/candidate.ts` — `Candidate`
(`genre`, `subjectKey`, `factClass: 'mined' | 'structural' | 'human'`,
`pointers: Pointer[]`, `support?`, `ratio?`, `lastTs?`, `hazard: boolean`,
`headline`, `evidenceJson`), `Pointer` (`{ path, spanStart?, spanEnd? } |
{ commit }`), and `TuningReader` (`tuning.get(key)`, `tuning.list(key)`);
`src/types/index_types.ts` — `SymbolRow` (`name`, `kind`, `spanStart`,
`spanEnd`) and `ImportEdge` (`dst`, `kind`). All are type-only exports
(erased at build).

Create `src/diag/jsonl.ts` exporting `appendFault(diagnosticsDir: string,
fault: { code: FaultCode; detail: unknown; session?: string })`: writes
one JSON object per line to `<diagnosticsDir>/<session-short>.jsonl`,
opening with `O_APPEND | O_CREAT` (0600), flushing before return. **Direct
file write, not through the store** — a dead store cannot log its own
death, per AD-17.

**Creates.** `src/diag/fault_codes.ts` — stable code list `FAULT_CODES` (AD-17, AD-26); `src/diag/jsonl.ts` — direct-file writer; `src/types/events.ts` — EventKind, InternalEvent, EventContext; `src/types/candidate.ts` — Candidate, TuningReader; `src/types/index_types.ts` — SymbolRow, ImportEdge.

**Source.** `AD-17` (three surfaces, one source of truth; the JSONL channel
is the fallback for store failure; every code enumerated); `AD-26`
(`store_busy`); `AD-15` (the compose-time drop the plan codes as
`whisper_dropped_stale`); `AD-6`, `AD-14`, `AD-12` (the fields the internal
event, candidate, and index types carry); the skill's topological-order
rule (shared types precede every user).

**Why this approach (Gate 3):**
1. **The decision.** The code set is a runtime-enumerable `as const` tuple
   with a derived literal-union type, not a TypeScript `enum`; the fault
   writer appends directly to a file with `O_APPEND | O_CREAT` at mode
   0600 and never touches the store; the shared internal types live in
   `src/types/` from this step so every later module imports them from one
   earlier place.
2. **The authoritative standard.** `AD-17` (the JSONL channel exists so a
   dead store can still be reported; every code is enumerated once);
   TypeScript 5.9.3 under the Step 1 tsconfig, executed 2026-09-07
   (§11.4): a `const enum` cannot be enumerated at runtime in the same
   compilation (`TS2475` on `Object.values(FaultCode)`), while an `as const`
   tuple is both the runtime list and the type.
3. **Why this standard applies here.** `T-6-1` asserts the code set equals
   the enumerated list and `status` (Step 33) renders every code including
   the reserved ones from one list — both need the set at runtime, which an
   `as const` tuple provides and an enum type does not without a second
   hand-maintained copy. The direct file write is AD-17's own reasoning: the
   store's `faults` table cannot record `store_corrupt`.
4. **What this is NOT — and why.** Not a `const enum` (not runtime-
   enumerable in-project — executed, §11.4). Not a regular `enum` (a
   runtime object plus a type that diverge from the tuple `status` and
   `T-6-1` read; one list is the AD-17 rule). Not a store-backed fault
   channel (AD-17's failure case is the store itself).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-6-1` (`FAULT_CODES` equals exactly the set enumerated in this
step — the AD-17 list, `store_busy`, `whisper_dropped_stale`,
`tuning_missing`; a snapshot whose expected value is that list), `T-6-2` (JSONL writer: appends survive a
writer restart; mode is `0o600`).

**Impact if wrong.** Diagnostic-only — a broken JSONL writer loses fault
records; the store's `faults` table (Step 10) captures the same signals
for the store-healthy path, so total blindness requires both writers to
fail simultaneously.

---

### Step 7 — SQL migrations: Phase A project store

```step-decl
step: S7
covers: [PA-3]
files:
  create: [middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts, middleware/context-oracle/ctxoracle/src/stores/migrations/001_phase_a_project.sql, middleware/context-oracle/ctxoracle/test/unit/migrations_phase_a.test.ts, middleware/context-oracle/ctxoracle/src/stores/migrations/001b_phase_a_fts.sql]
  modify: []
  delete: []
provides: [applyMigrations]
tests: [T-7-1]
depends_on: [S1, S3, S6]
```


**What changes.** Create
`src/stores/migrations/001_phase_a_project.sql` containing every table
AD-4 names for Phase A. The DDL below is AD-4's abridged schema with its
column types resolved; every column AD-4 names is present, ids on the
timestamped tables are ULID `TEXT` primary keys (Step 9, AD-26), and the
only additions are the SQL forms the abridged schema leaves implicit
(NOT NULL on required columns, `ON DELETE CASCADE` on file-keyed rows so a
deleted file's rows go with it, the `corrections` exclusive-or CHECK
that AD-4's two nullable ids imply, and two plan additions each marked
`-- plan` in the DDL: `observed_actions.content_hash`, which FR-L4's
"reverted" clause needs, and the `regret` table AD-18's "a regret row is
recorded" needs a home for). `PROV` stands for the provenance block
AD-4 puts on every knowledge table:

```sql
-- PROV = prov_kind TEXT NOT NULL CHECK(prov_kind IN
--          ('repo_span','commit','human','mechanical','session')),
--        prov_ref TEXT NOT NULL,
--        trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
--        injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
--        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
CREATE TABLE schema_meta(key TEXT PRIMARY KEY, value TEXT) STRICT;
  -- keys: schema_version, repo_key, keying_mode, identity, last_mined_commit,
  -- index_head, fts_state ('fts5'|'fallback'), settings_created_by_init,
  -- claude_dir_created_by_init
CREATE TABLE files(id INTEGER PRIMARY KEY, path TEXT NOT NULL UNIQUE,
  lang TEXT NOT NULL, zone TEXT NOT NULL CHECK(zone IN
    ('source','generated','vendored','build_output','unknown')),
  zone_evidence TEXT, zone_evidence_suspect INTEGER NOT NULL DEFAULT 0,
  entry_score INTEGER NOT NULL DEFAULT 0, content_hash TEXT NOT NULL,
  mtime INTEGER NOT NULL, PROV) STRICT;
CREATE TABLE symbols(id INTEGER PRIMARY KEY,
  file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  name TEXT NOT NULL, kind TEXT NOT NULL,
  span_start INTEGER NOT NULL, span_end INTEGER NOT NULL, PROV) STRICT;
CREATE TABLE import_edges(
  src_file INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  dst_file INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  kind TEXT NOT NULL) STRICT;
CREATE TABLE symbol_refs(
  symbol_id INTEGER NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
  src_file INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  ref_count INTEGER NOT NULL) STRICT;
CREATE TABLE test_map(
  test_file INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  region_glob TEXT NOT NULL, source TEXT NOT NULL, PROV) STRICT;
CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL,
  entity_count INTEGER NOT NULL, excluded INTEGER NOT NULL DEFAULT 0,
  exclude_reason TEXT) STRICT;
CREATE TABLE cochange_pairs(
  a INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  b INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  pair_count INTEGER NOT NULL, a_count INTEGER NOT NULL,
  b_count INTEGER NOT NULL, last_ts INTEGER NOT NULL,
  PRIMARY KEY(a, b), CHECK(a < b)) STRICT;
CREATE TABLE landmines(id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('revert_chain','fix_chatter','human_stated')),
  file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  evidence TEXT NOT NULL, support INTEGER, PROV) STRICT;
CREATE TABLE invariants(id TEXT PRIMARY KEY, description TEXT NOT NULL,
  PROV) STRICT;
CREATE TABLE invariant_members(
  invariant_id TEXT NOT NULL REFERENCES invariants(id) ON DELETE CASCADE,
  file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  span TEXT) STRICT;
CREATE TABLE human_facts(id TEXT PRIMARY KEY, statement TEXT NOT NULL,
  target_kind TEXT NOT NULL, target_ref TEXT NOT NULL,
  stated_at INTEGER NOT NULL, PROV) STRICT;
CREATE TABLE corrections(id TEXT PRIMARY KEY, whisper_id TEXT, deny_id TEXT,
  verdict TEXT NOT NULL CHECK(verdict IN ('false_fire','missed','confirm')),
  note TEXT, ts INTEGER NOT NULL,
  CHECK((whisper_id IS NULL) <> (deny_id IS NULL))) STRICT;
CREATE TABLE questions(id TEXT PRIMARY KEY, consumer TEXT NOT NULL,
  question_text TEXT NOT NULL, content_hash TEXT NOT NULL,
  asked_uuid TEXT, asked_offset INTEGER,
  status TEXT NOT NULL CHECK(status IN ('open','answered','expired')),
  closed_by_uuid TEXT,
  closed_by_kind TEXT CHECK(closed_by_kind IN
    ('generic_text_all_prior','expired','intake_invalidated')),
  opened_at INTEGER NOT NULL, closed_at INTEGER,
  UNIQUE(consumer, asked_uuid)) STRICT;
CREATE UNIQUE INDEX q_open_dedup ON questions(consumer, content_hash)
  WHERE status = 'open';
CREATE TABLE classify_state(consumer TEXT PRIMARY KEY,
  bookmark_offset INTEGER NOT NULL DEFAULT 0, bookmark_uuid TEXT,
  updated_at INTEGER NOT NULL) STRICT;
CREATE TABLE consumer_state(consumer TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('delivered','read')),
  subject_key TEXT NOT NULL, ts INTEGER NOT NULL,
  PRIMARY KEY(consumer, kind, subject_key)) STRICT;
CREATE TABLE session_log(id TEXT PRIMARY KEY, session TEXT NOT NULL,
  consumer TEXT NOT NULL, seq INTEGER NOT NULL, event_type TEXT NOT NULL,
  ts INTEGER NOT NULL, latency_ms INTEGER, candidates_json TEXT,
  outcome TEXT, detail_json TEXT) STRICT;
CREATE TABLE observed_actions(session TEXT NOT NULL, consumer TEXT NOT NULL,
  seq INTEGER NOT NULL, tool TEXT NOT NULL, path TEXT,
  content_hash TEXT,   -- plan column (FR-L4 revert detection, Step 30):
                       -- the edited file's hash after an ok Edit/Write,
                       -- NULL when the file exceeds the AD-12 size cap
  command_class INTEGER CHECK(command_class IN (1,2,3)),
  outcome TEXT CHECK(outcome IN ('ok','failed')), ts INTEGER NOT NULL) STRICT;
CREATE TABLE regret(id TEXT PRIMARY KEY, session TEXT NOT NULL,
  fact_kind TEXT NOT NULL CHECK(fact_kind IN
    ('cochange_pair','landmine','human_fact','invariant')),
  fact_ref TEXT NOT NULL, churn_kind TEXT NOT NULL CHECK(churn_kind IN
    ('re_edited','reverted','covering_test_failed')),
  candidate_state TEXT NOT NULL CHECK(candidate_state IN
    ('held_below_bar','held_dedup','never_triggered')),
  ts INTEGER NOT NULL) STRICT;   -- plan table: AD-18's "a regret row is
                                 -- recorded" needs a Phase A writer's table
                                 -- (AD-4's creation criterion); read by status
CREATE TABLE whisper_audit(id TEXT PRIMARY KEY, session TEXT NOT NULL,
  consumer TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('whisper','deny')),
  genre TEXT, ts INTEGER NOT NULL, text TEXT NOT NULL, evidence_json TEXT,
  confidence REAL, channel TEXT,
  continuation INTEGER NOT NULL DEFAULT 0) STRICT;
CREATE TABLE faults(id TEXT PRIMARY KEY, ts INTEGER NOT NULL,
  code TEXT NOT NULL, detail_json TEXT, session TEXT) STRICT;
CREATE TABLE classified_turns(consumer TEXT NOT NULL, uuid TEXT NOT NULL,
  ts INTEGER NOT NULL, clears INTEGER NOT NULL CHECK(clears IN (0,1)),
  reason TEXT CHECK(reason IN ('below_length_floor','deferral_only')),
  PRIMARY KEY(consumer, uuid)) STRICT;   -- plan table (D-plan-27): the per-turn record
  -- AD-9's deny_loop and deny_despite_answer_text detectors read across
  -- events (each event is a fresh process, AD-1); written by the catch-up
  -- (Step 25), read by the detectors (Step 26)
-- indexes the LIKE fallback searches use (AD-2); always created
CREATE INDEX symbols_name ON symbols(name);
CREATE INDEX files_path ON files(path);
```

The two FTS5 virtual tables are a **separate, conditional** migration
(D-plan-28),
`src/stores/migrations/001b_phase_a_fts.sql`, which the runner applies only
when `schema_meta.fts_state = 'fts5'` (Step 3's `probeFts5` returned true
at `init`); on `'fallback'` it is skipped and never retried, and the search
interface (Step 14) uses the indexed `LIKE` path (AD-2):

```sql
-- 001b_phase_a_fts.sql (applied only when schema_meta.fts_state = 'fts5')
CREATE VIRTUAL TABLE fts_symbols USING fts5(name, kind UNINDEXED,
  file_id UNINDEXED, tokenize = 'unicode61');
CREATE VIRTUAL TABLE fts_paths USING fts5(path, file_id UNINDEXED,
  tokenize = "unicode61 tokenchars '/_-.'");
```

`import_edges`, `symbol_refs`, `test_map`, `invariant_members`, and
`observed_actions` carry no primary key, as in AD-4; AC-19's per-table dump
orders them by every column in schema order (D-plan-4). **Do NOT create**
`exemplars`, `recipes`,
`env_capabilities`, `deferred_queue`, or Phase-C `genre_state` — AD-4's
uniform table-creation criterion (no table without a same-phase writer)
means those arrive with their writing phase's migration.

Add `src/stores/migration_runner.ts` — `applyMigrations(store, {fts:
boolean})` reads `schema_meta.schema_version`, applies the numbered
migrations in order, skipping a migration whose name carries the `_fts`
suffix when `fts` is false, and records the new version. Forward-only per
AD-25. The `.sql` files are read at runtime from the package's own `src/`
tree, resolved from `import.meta.url` of the compiled runner
(`../../../src/stores/migrations/`), so the package ships `src/` beside
`dist/` (Step 1's `files` list) and `tsc` — which emits no `.sql` — needs
no copy step.

**Creates.** `src/stores/migration_runner.ts`; `src/stores/migrations/001_phase_a_project.sql` — AD-4; `src/stores/migrations/001b_phase_a_fts.sql` — the FTS5 tables, applied only under fts_state 'fts5' (AD-2).

**Source.** `AD-4` (project-store schema, STRICT + CHECK, provenance-
mandatory; the uniform table-creation criterion); `AD-25` (forward-only
migrations).

**Why this approach (Gate 3):**
1. **The decision.** Every Phase A table now, no dormant tables; the
   provenance block is a NOT NULL + CHECK, so a provenance-less row is
   unrepresentable at DB level (not a convention, a constraint).
2. **The authoritative standard.** `AD-4` (architecture, the single source
   for the schema); OWASP ASI06 (trust labels on persistent memory:
   CHECK-constrained `trust` and `injection_suspect` columns).
3. **Why this standard applies here.** `FR-K6` requires provenance on every
   record; convention-based provenance decays under refactor, so it is
   made structural. The uniform table-creation criterion is what AD-5
   applies to `env_capabilities` — the same discipline binds Phase A's
   `exemplars`/`recipes`.
4. **What this is NOT — and why.** Not a generic `facts(kind, json)` table
   (`FR-K6` violation, exactly what the provenance CHECK is designed to
   prevent). Not a runtime version comparison at every open (adds latency;
   the migration runner at `init`/`index` open is enough because Phase A
   ships one schema version). Not shipping dormant tables (AD-4's criterion,
   applied uniformly).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-7-1`.

**Impact if wrong.** Systemic — every downstream write goes through these
tables; a missing CHECK re-opens the exact provenance-decay problem AD-4
was designed to prevent. Caught by `T-7-1`'s constraint-negative-case
assertions.

---

### Step 8 — SQL migrations: Phase A global store

```step-decl
step: S8
covers: [PA-3]
files:
  create: [middleware/context-oracle/ctxoracle/src/stores/migrations/002_phase_a_global.sql, middleware/context-oracle/ctxoracle/test/unit/migrations_global.test.ts]
  modify: []
  delete: []
provides: []
tests: [T-8-1]
depends_on: [S1, S7]
```


**What changes.** Create `src/stores/migrations/002_phase_a_global.sql`
with the four Phase A tables per AD-5, types resolved the same way as Step 7:

```sql
CREATE TABLE global_meta(key TEXT PRIMARY KEY, value TEXT) STRICT;
  -- schema_version; whisper_stats_watermark:<repo-key> per project
CREATE TABLE whisper_stats(genre TEXT NOT NULL, project_key TEXT NOT NULL,
  sent INTEGER NOT NULL DEFAULT 0, corrected_false INTEGER NOT NULL DEFAULT 0,
  corrected_missed INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL, window_end INTEGER NOT NULL,
  PRIMARY KEY(genre, project_key, window_start)) STRICT;
CREATE TABLE tuning(key TEXT NOT NULL, project_key TEXT, value TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('architecture_default','plan_seed','owner')),
  updated_at INTEGER NOT NULL) STRICT;
  -- scalar keys: one row per (key, project_key); list keys (lexicon.*,
  -- index.ext_to_grammar): one row per member
CREATE TABLE lessons(id TEXT PRIMARY KEY, statement TEXT NOT NULL,
  evidence_json TEXT, PROV) STRICT;
```

`global_meta` holds the per-project fold watermarks (rows keyed
`whisper_stats_watermark:<repo-key>`). Do NOT create `env_capabilities`
(Phase B writer). Schema only; the `tuning` seed rows are written by
Step 12.

**Creates.** `src/stores/migrations/002_phase_a_global.sql` — AD-5.

**Source.** `AD-5` (global store schema; per-project watermarks; no
`env_capabilities` yet).

**Why this approach (trivial: mechanical from AD-5, with the same type resolution as Step 7).**

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-8-1` (the four tables exist; no Phase B/C table exists).

**Impact if wrong.** Contained — caught by `T-8-1`.

---

### Step 9 — DAOs for every Phase A table, ULID ids

```step-decl
step: S9
covers: [PA-3]
files:
  create: [middleware/context-oracle/ctxoracle/src/stores/dao/files.ts, middleware/context-oracle/ctxoracle/src/stores/dao/symbols.ts, middleware/context-oracle/ctxoracle/src/stores/dao/import_edges.ts, middleware/context-oracle/ctxoracle/src/stores/dao/symbol_refs.ts, middleware/context-oracle/ctxoracle/src/stores/dao/test_map.ts, middleware/context-oracle/ctxoracle/src/stores/dao/commits.ts, middleware/context-oracle/ctxoracle/src/stores/dao/cochange_pairs.ts, middleware/context-oracle/ctxoracle/src/stores/dao/landmines.ts, middleware/context-oracle/ctxoracle/src/stores/dao/invariants.ts, middleware/context-oracle/ctxoracle/src/stores/dao/human_facts.ts, middleware/context-oracle/ctxoracle/src/stores/dao/corrections.ts, middleware/context-oracle/ctxoracle/src/stores/dao/questions.ts, middleware/context-oracle/ctxoracle/src/stores/dao/classify_state.ts, middleware/context-oracle/ctxoracle/src/stores/dao/consumer_state.ts, middleware/context-oracle/ctxoracle/src/stores/dao/session_log.ts, middleware/context-oracle/ctxoracle/src/stores/dao/observed_actions.ts, middleware/context-oracle/ctxoracle/src/stores/dao/whisper_audit.ts, middleware/context-oracle/ctxoracle/src/stores/dao/faults.ts, middleware/context-oracle/ctxoracle/src/stores/dao/regret.ts, middleware/context-oracle/ctxoracle/src/stores/dao/classified_turns.ts, middleware/context-oracle/ctxoracle/src/stores/dao/whisper_stats.ts, middleware/context-oracle/ctxoracle/src/stores/dao/lessons.ts, middleware/context-oracle/ctxoracle/src/stores/dao/global_meta.ts, middleware/context-oracle/ctxoracle/src/stores/dao/schema_meta.ts, middleware/context-oracle/ctxoracle/src/util/ulid.ts, middleware/context-oracle/ctxoracle/test/unit/dao_crud.test.ts, middleware/context-oracle/ctxoracle/test/build/typecheck_provenance.test.ts, middleware/context-oracle/ctxoracle/test/build/fixtures/missing_provenance.ts]
  modify: []
  delete: []
provides: []
tests: [T-9-1, T-9-2]
depends_on: [S1, S3, S7, S8]
```


**What changes.** Create `src/util/ulid.ts` (ULID generation, AD-26). One
file per DAO in `src/stores/dao/` (the list in §5.1, one per table of
Steps 7 and 8, except the tuning DAO, which Step 12 creates together with
its seeding logic). Each DAO exposes prepared-statement-backed methods
returning typed rows or void — the surface later steps call:

| DAO | Methods |
|---|---|
| `schema_meta` / `global_meta` | `get(key)`, `set(key, value)` |
| `files` | `upsert(row)`, `byPath(path)`, `byId(id)`, `deleteMissing(presentPaths)`, `all()` |
| `symbols` | `replaceForFile(fileId, rows)`, `byName(name, kind?)`, `byId(id)` |
| `import_edges` | `replaceForFile(srcFileId, edges)`, `inDegree(fileId)`, `importersOf(fileId)` |
| `symbol_refs` | `replaceForFile(srcFileId, rows)`, `refCount(symbolId)` |
| `test_map` | `replaceForFile(testFileId, rows)`, `coveringTests(path)` |
| `commits` | `upsert(row)`, `exists(hash)`, `tsOf(hash)`, `countIncluded()` |
| `cochange_pairs` | `bump(a, b, ts)`, `partnersOf(fileId)`, `pair(a, b)` |
| `landmines` | `upsert(row)`, `forFile(fileId)` |
| `invariants` + `invariant_members` | `create(row, members)`, `forFile(fileId)` |
| `human_facts` | `create(row)`, `forTarget(kind, ref)` |
| `corrections` | `create(row)`, `sinceTs(ts)`, `forDeny(id)`, `forWhisper(id)` |
| `questions` | `insertOpen(row)`, `openFor(consumer)`, `closeAll(consumer, uuid, kind)`, `setStatus(id, status, kind)`, `backfill(id, uuid, offset)`, `expireOpen(consumer)` (composed by Step 22's seam module) |
| `classify_state` | `get(consumer)`, `set(consumer, offset, uuid)` |
| `consumer_state` | `has(consumer, kind, key)`, `add(consumer, kind, key)`, `clear(consumer, kind)` |
| `session_log` | `append(row)` (returns the ULID), `forSession(session)`, `lastEventTs(session)`, `livenessRows(open = true)` |
| `observed_actions` | `append(row)`, `okEdits(session)`, `okReads(session)`, `runs(session)`, `pathWrites(session, sinceSeq)`, `firstHash(session, path)` |
| `regret` | `append(row)`, `forSession(session)`, `countsByState()` |
| `classified_turns` | `record(consumer, uuid, ts, clears, reason)`, `sinceQuestionOpened(consumer)` (the assistant text turns since the newest open question, in order), `between(consumer, fromTs, toTs)` |
| `whisper_audit` | `append(row)` (returns the ULID synchronously), `forSession(session)`, `denies(consumer, sinceTs)`, `lastKinds(consumer, n)`, `deliveredSubjects(session)` |
| `faults` | `append(row)`, `sinceTs(ts)`, `countByCode()` |
| `whisper_stats` | `upsertFold(rows)` |
| `lessons` | `create(row)`, `all()` |

No DAO does business logic; they wrap statements. Where a DAO writes a knowledge record, its `create()` method
requires provenance parameters (TypeScript compile-time enforcement) — the
DB CHECK is the runtime enforcement of the same rule. Every timestamped
table (`whisper_audit`, `corrections`, `session_log`, `faults`,
`human_facts`, `landmines`, `invariants`, `questions`) takes a ULID id
generated by the DAO. The `whisper_audit` DAO's `append()` returns the id
synchronously — the deny emitter (Step 25) and the composer (Step 19)
depend on this being synchronous per AD-8's audit-log-before-emit ordering.
The learned-record entry points accept only `trust='untrusted_repo'`
unless every input is human-provenance (`FR-X4`) — `assertProvenance`
(Step 6's `src/security/trust.ts`) is what each entry point calls.

**Creates.** `src/stores/dao/files.ts`; `src/stores/dao/symbols.ts`; `src/stores/dao/import_edges.ts`; `src/stores/dao/symbol_refs.ts`; `src/stores/dao/test_map.ts`; `src/stores/dao/commits.ts`; `src/stores/dao/cochange_pairs.ts`; `src/stores/dao/landmines.ts`; `src/stores/dao/invariants.ts`; `src/stores/dao/human_facts.ts`; `src/stores/dao/corrections.ts`; `src/stores/dao/questions.ts`; `src/stores/dao/classify_state.ts`; `src/stores/dao/consumer_state.ts`; `src/stores/dao/session_log.ts`; `src/stores/dao/observed_actions.ts`; `src/stores/dao/whisper_audit.ts`; `src/stores/dao/faults.ts`; `src/stores/dao/regret.ts` — the plan-table DAO AD-18's regret row needs; `src/stores/dao/classified_turns.ts` — the per-turn classification record the deny-health detectors read across events; `src/stores/dao/whisper_stats.ts`; `src/stores/dao/lessons.ts`; `src/stores/dao/global_meta.ts` — one file per Phase A table; `src/stores/dao/schema_meta.ts` — one file per Phase A table; `src/util/ulid.ts` — ULID generator (AD-26).

**Source.** `AD-4`, `AD-5` (schemas); `AD-8` (audit-before-emit ordering
demands a synchronous audit append); `AD-26` (ULIDs so concurrent writers
never collide); `FR-X4` (provenance/trust not launderable).

**Why this approach (Gate 3):**
1. **The decision.** DAOs are thin wrappers over prepared statements; no
   caching layer; every knowledge write requires provenance at the type
   level; ids are ULIDs.
2. **The authoritative standard.** SWE-at-Google Test Doubles chapter
   (real implementations preferred; the DAOs are the real thing, not a
   layer that must be doubled); `AD-4` (structural provenance); `AD-26`.
3. **Why this standard applies here.** The store is measured at ~2 ms per
   round-trip (V8), well inside NF-1; a caching layer would add a source
   of stale reads (the deny path reads `questions` on every event, and a
   stale cache would produce `deny_after_answer_lag` events that are
   actually cache-lag, not transcript-lag). TypeScript provenance
   enforcement is what stops a well-meaning refactor from bypassing the
   DB CHECK.
4. **What this is NOT — and why.** Not an ORM (adds a dependency C-3
   would need to justify; the schema is small and stable). Not async DAO
   methods (blocking `DatabaseSync` is what V8 measures at 2 ms; async
   wrappers add scheduler round-trips for no measurable benefit). Not
   autoincrement ids (concurrent handler processes — AD-26).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-9-1` (per-DAO CRUD round-trips against the STRICT
schema), `T-9-2` (a compile-time fixture calling each write method without
provenance fails `tsc`).

**Impact if wrong.** Contained per DAO — a bug in one DAO surfaces at
`T-9-1` for that table and does not corrupt other tables. Systemic risk
sits in the provenance TypeScript enforcement; caught by the
compile-time fixture.

---

### Step 10 — `session_log` and `faults` writers, watchdog deadline, recursion guard

```step-decl
step: S10
covers: [PA-5, PA-9]
files:
  create: [middleware/context-oracle/ctxoracle/src/diag/session_writer.ts, middleware/context-oracle/ctxoracle/src/diag/fault_writer.ts, middleware/context-oracle/ctxoracle/src/hook/watchdog.ts, middleware/context-oracle/ctxoracle/src/hook/guard.ts, middleware/context-oracle/ctxoracle/test/unit/watchdog_deadline.test.ts, middleware/context-oracle/ctxoracle/test/unit/store_corrupt_induction.test.ts, middleware/context-oracle/ctxoracle/test/unit/latency_instrument.test.ts, middleware/context-oracle/ctxoracle/test/conventions/fault_session_writers_only.test.ts]
  modify: []
  delete: []
provides: [DeadlineExceeded, createDeadline, isInternal, recordFault, writeSessionEvent]
tests: [T-10-1, T-10-2, T-10-3, T-10-4]
depends_on: [S1, S6, S9]
```


**What changes.** Create `src/diag/session_writer.ts` exporting
`writeSessionEvent(store, {session, consumer, seq, event_type, ts,
latency_ms, candidates_json, outcome, detail_json?})` — a thin wrapper
over the `session_log` DAO. Create `src/diag/fault_writer.ts` exporting
`recordFault(store | null, diagnosticsDir, fault)`: writes to the `faults`
table when a store handle is given AND (mirror) to the JSONL channel (Step
6). Every fault and every session record is written through these two
writers, and that is the structural property AD-17 makes of its two
tables: `test/conventions/fault_session_writers_only.test.ts` is an import
scan over `dist/src/**` asserting that `dist/src/stores/dao/faults.js` is imported
only by `dist/src/diag/fault_writer.js` and `dist/src/diag/status.js`, and
`dist/src/stores/dao/session_log.js` only by `dist/src/diag/session_writer.js`,
`dist/src/diag/status.js`, `dist/src/diag/log.js`, and `dist/src/diag/regret.js` — the readers §5.1
names; every other module reaches the two tables through the writers.

Create `src/hook/watchdog.ts` — the cooperative deadline the handler
(Step 28) drives: `createDeadline({ms = 2500, now = performance.now})`
returns `{check(): void, elapsed(): number}`; `deadline.check()` throws the typed
`DeadlineExceeded` once `now() − start ≥ ms` (the clock is injected so the
boundary is unit-testable, `T-10-4`; `ms` is the wired default or the
override Step 28's `hook` verb passes through). Create `src/hook/guard.ts`
exporting `isInternal(env): boolean` — `true` when
`env.CTXORACLE_INTERNAL === '1'`; the handler's first act. Both modules
depend only on this step's writers and Step 6's types, which is why they
are built here and not with the handler that calls them.

**Creates.** `src/diag/session_writer.ts` — session_log writer; `src/diag/fault_writer.ts` — mirror-write faults; `src/hook/watchdog.ts` — cooperative deadline (AD-23); `src/hook/guard.ts` — CTXORACLE_INTERNAL check (AD-21).

**Source.** `AD-17` (three surfaces, one source of truth; JSONL is the
store-death fallback); `FR-M1`, `FR-M2`; `AD-23` (the cooperative deadline
and its inventory); `AD-21` (the guard as the handler's first act, `FR-J4`).

**Why this approach (Gate 3):**
1. **The decision.** Mirror-write faults to both surfaces so the handler
   need not decide which is up; the mirror lets `status` render from the
   store when healthy and the JSONL channel still reveal recent faults if
   the store is corrupt.
2. **The authoritative standard.** `AD-17` (architecture); ISO/IEC 25010
   reliability (fault tolerance).
3. **Why this standard applies here.** `store_corrupt` is a fault whose
   detector is "any prepared statement fails at the event path" — the
   detector itself cannot write to the store it just observed failing.
   Mirror-write closes the loop.
4. **What this is NOT — and why.** Not JSONL-only (would lose the
   relational query surface `status` uses). Not store-only (loses the
   `store_corrupt` self-report path). Not a shared lock across the two
   writes (adds contention; both writes are idempotent by ULID key).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-10-1` (a `store_corrupt` induction — byte 0 of the
store file overwritten — surfaces on the JSONL channel with the code and
detail); `T-10-2` (recorded latency within ±5 ms of `performance.now()`
deltas); `T-10-3` (the writers-only convention); `T-10-4` (the deadline with
an injected clock fires at exactly `ms`, not before; `isInternal` is true
for `'1'` and false for unset, `''`, `'0'`).

**Impact if wrong.** Diagnostic — a broken session writer loses per-event
records; caught by `T-10-1`/`T-10-2` and by absence in `status`.

---

### Step 11 — Security: redactor, injection-suspect flagger, trust type

```step-decl
step: S11
covers: [PA-6]
files:
  create: [middleware/context-oracle/ctxoracle/src/security/redact.ts, middleware/context-oracle/ctxoracle/src/security/injection.ts, middleware/context-oracle/ctxoracle/test/unit/redact_positive.test.ts, middleware/context-oracle/ctxoracle/test/unit/redact_negative.test.ts, middleware/context-oracle/ctxoracle/test/unit/injection_positive.test.ts, middleware/context-oracle/ctxoracle/test/unit/injection_negative.test.ts, middleware/context-oracle/ctxoracle/test/build/typecheck_trust.test.ts, middleware/context-oracle/ctxoracle/test/build/fixtures/trust_out_of_set.ts]
  modify: []
  delete: []
provides: [redact, isSuspect]
tests: [T-11-1, T-11-2, T-11-3, T-11-4, T-11-5]
depends_on: [S1, S9]
```


**What changes.** Create `src/security/redact.ts` exporting
`redact(input: string): { redacted: string; count: number }` — pattern
rules for known secret shapes (AWS-style keys, GitHub PATs, JWTs, PEM
blocks, `KEY=value` credential forms) plus a high-entropy-token
heuristic (Shannon entropy above a bits-per-character threshold over
tokens of at least a minimum length; both are explicit parameters of
`redact(input, {entropyBitsPerChar, minTokenLength})` — callers pass the
`tuning` rows `security.entropy_bits_per_char` and
`security.entropy_min_token_length` seeded at Step 12, and the unit tests
pass literals). Replacements use the stable marker
`[redacted:<kind>]`. Create `src/security/injection.ts` exporting
`isSuspect(input: string): boolean` — heuristic lexicon (imperative verbs
directed at "the AI"/"the assistant", `ignore previous instructions`-class
phrases, common jailbreak markers). The `Trust` type and its helpers are Step 6's `src/security/trust.ts`,
which the DAOs (Step 9) already enforce provenance with.

**Creates.** `src/security/redact.ts` — FR-X1; `src/security/injection.ts` — FR-X3.

**Source.** `AD-19` (redaction at every ingress; pointer-only composition
in Phase A means suspect content is pointer-only + confidence-capped);
`FR-X1`, `FR-X3`, `FR-X4`; OWASP LLM01 (Prompt Injection Prevention Cheat
Sheet), LLM02 (Sensitive Information Disclosure), Secrets Management
Cheat Sheet.

**Why this approach (Gate 3):**
1. **The decision.** Pattern + entropy for secrets; heuristic lexicon +
   suspicious-command patterns for injection; TypeScript trust type
   mirrors the DB CHECK.
2. **The authoritative standard.** OWASP LLM01/LLM02 2025 + OWASP
   Secrets Management Cheat Sheet + `AD-19`.
3. **Why this standard applies here.** Repo content flows into stores
   and (in Phase A) into pointer-only whispers; the redactor is the
   choke-point at every ingress (`AD-19`), and Phase A's pointer-only
   composition means the redactor is defense-in-depth against the two
   T3 exposure paths that remain: store contents, and the deny-reason
   text (which quotes only the user's own question — not repo content).
4. **What this is NOT — and why.** Not a deny-lexicon output filter as
   the primary T1 control (evasion surface; pointer-only removes the
   quoted-text channel entirely in Phase A). Not exhaustive secret
   detection (impossible; the residual `L5` — low-entropy, unpatterned
   secret — is accepted, guarded by pointer-only + 0700). Not a strict
   allow-list (would over-redact real code).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-11-1` (redact positives), `T-11-2` (redact negatives),
`T-11-3` (`isSuspect` positives), `T-11-4` (`isSuspect` negatives), `T-11-5`
(the trust type rejects an out-of-set string at compile time).

**Impact if wrong.** Systemic — a redaction miss leaks a secret to the
store/log; a false-positive over-redacts and degrades whisper quality
(visible in corrections). The pointer-only property (Step 19) bounds
whisper-side leakage independently.

---
### Step 12 — Tuning DAO + default seeding

```step-decl
step: S12
covers: [PA-3]
files:
  create: [middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts, middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts, middleware/context-oracle/ctxoracle/test/unit/tuning_dao.test.ts]
  modify: []
  delete: []
provides: [seedDefaults]
tests: [T-12-1]
depends_on: [S1, S6, S8, S9]
```


**What changes.** Create `src/stores/dao/tuning.ts` with `tuning.get(store,
key): string | null`, `tuning.set(store, key, value, source)`, `tuning.list(store, key):
string[]` (list-valued keys: all rows sharing the key), `addToList(store,
key, value, source)`, `removeFromList(store, key, value)`, and
`seedDefaults(store)` (idempotent: inserts only keys absent). The seed
values live in one module, `src/stores/dao/tuning_seeds.ts` (the table
below, as data); `seedDefaults` and the `TuningReader` both read it, so a
key missing from the store at read time is re-seeded from that module and
recorded as a `tuning_missing` fault — no consuming module carries a
number of its own. Every seeded row carries a `source` that names its
provenance: **`architecture_default`**
for values the architecture states, **`plan_seed`** for values the
architecture leaves open and this plan chooses (§10 D-plan-7; every
`plan_seed` value is printed by `status` and by the exit report so every
measurement is read as conditional on it).

`architecture_default` rows (AD-14, AD-13, AD-9):
- `bar.confidence_floor` = `0.6`; `bar.support_min` = `3`;
  `bar.noise_floor_support_min` = `2`; `bar.impact_read_min_coupled` = `2`
- `miner.max_transaction_entities` = `30`; `miner.horizon_years` = `5`;
  `miner.horizon_commits` = `10000`; `miner.corpus_floor_commits` = `30`
- `deny.loop_threshold` = `3`

`plan_seed` rows (reasoning in §10 D-plan-7):
- `bar.reuse_dominance_k` = `3`
- `deny.despite_answer_text_threshold` = `3`
- `qa.clear_length_floor_chars` = `2`
- `landmine.fix_chatter_k` = `3`; `landmine.fix_chatter_window_days` = `90`
- `security.entropy_bits_per_char` = `4.0`;
  `security.entropy_min_token_length` = `20`
- `qa.done_claim_trailing_turns_k` = `3`
- `bar.recency_half_life_days` = `365`; `bar.stale_index_factor` = `0.8`
- `diag.hooks_not_firing_gap_s` = `600`

List-valued `plan_seed` keys — the QA vocabulary AD-9 names without
stating members ("the exact words are implementation vocabulary", Gate A
note), so the members are the plan's, labelled and printed like every
other seed: `lexicon.stoplist` (rhetorical or idiomatic `?` sentences
that open no question: `why is CI always so flaky?`, `who knows?`, `what
could go wrong?`, `right?`, `you know?`, `isn't it?`, `see?`, `ok?`),
`lexicon.deferral_stoplist` (`i'll get to that`, `i will get to that`,
`i'll come back to`, `i'll get back to you`, `will look into that`, `first
let me`, `before i answer` — multi-word phrases of AD-9's "I'll get to
that" class only; a bare common word such as `later` is never a member,
because it would hold on an answer that contains it, Step 23). The three
command-class and completion lexicons are `plan_seed` lists as well — the
architecture names the classes and a few members (AD-15's `ls`, `cd`,
`cat`, `git status`, `grep`/`rg`, "…"), and every member beyond those is
the plan's choice, printed with every measurement like the other seeds:
`lexicon.command_class_test_runners` (`npm test`, `npm run test`, `pnpm
test`, `yarn test`, `pytest`, `cargo test`, `go test`, `jest`, `mocha`,
`vitest`, `node --test`), `lexicon.command_class_innocuous` (`ls`, `cd`,
`cat`, `pwd`, `echo`, `git status`, `git log`, `git diff`, `grep`, `rg`,
`find`, `head`, `tail`, `wc`), `lexicon.completion_claim` (`done`,
`complete`, `completed`, `implemented`, `fixed`, `finished`). The one
list-valued `architecture_default` key is `index.ext_to_grammar` (the
default extension → grammar table of Step 15). All list keys are
owner-tunable via `tune` (AD-20).

**Creates.** `src/stores/dao/tuning.ts` — tuning DAO + seeding; `src/stores/dao/tuning_seeds.ts` — the single seed source (values + provenance) `seedDefaults` and the reader both read.

**Source.** `AD-5` (`tuning` is the writer-backed store for every tunable;
scalar = one row per key, list = one member per row); `AD-14` (bar defaults,
marked illustrative and calibrated on Phase A data); `AD-13` (miner
defaults); `AD-9` (deny-loop threshold; the tunable N and length floor);
`AD-15` (dominance k, fix_chatter k, the lexicons); `AD-20` (`tune` as the
writer).

**Why this approach (Gate 3):**
1. **The decision.** One DAO, two provenance classes for seeds, every
   tunable the architecture marks has a row and a writer; nothing is
   hard-coded in the modules that consume it.
2. **The authoritative standard.** `AD-5`/`AD-20` (tunables in the store,
   `tune` the writer); `CLAUDE.md` engineering standard ("numbers without
   sources don't go in") and the collapse-log 2026-08-13 entry (an unsourced
   number is a defect) — which is why the `plan_seed` class exists as a
   labelled, visible category instead of being passed off as architecture.
3. **Why this standard applies here.** Every per-genre number in the exit
   report is conditional on these values; labelling their provenance is what
   lets Phase B read the report honestly (AD-14: Phase A calibration input is
   the human channel; `tune` is how the owner moves a seed).
4. **What this is NOT — and why.** Not constants in code (a recompile to
   calibrate — AD-5 forbids). Not a config file (two sources of truth). Not
   seeds presented as architecture-verified (the collapse-log 2026-08-13
   trap).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-12-1` (after `seedDefaults`: every key above is present
with its value and its `source`; scalar set, list add/remove round-trip;
re-running `seedDefaults` changes nothing).

**Impact if wrong.** Contained — a missing row is re-seeded from
`tuning_seeds.ts` through the reader and surfaces as a `tuning_missing`
fault (Step 6's code; `detail` carries the key); caught by `T-12-1`.

---

### Step 13 — Co-change miner (AD-13)

```step-decl
step: S13
covers: [PA-1, PA-3]
files:
  create: [middleware/context-oracle/ctxoracle/src/miner/cochange.ts, middleware/context-oracle/ctxoracle/test/unit/miner.test.ts]
  modify: []
  delete: []
provides: []
tests: [T-13-1]
depends_on: [S1, S9, S12]
```


**What changes.** Create `src/miner/cochange.ts` exposing
`mineCochange(store, repoPath, opts)` — reads `schema_meta.last_mined_commit`;
runs `git log --no-merges --numstat -M --format=%H%x00%at%x00
<watermark>..HEAD` streamed line-by-line; per commit: records the commit in
`commits` with `entity_count`; excludes (with `exclude_reason`) commits
whose `entity_count > miner.max_transaction_entities` and commits beyond the
horizon (`miner.horizon_years` / `miner.horizon_commits`, whichever first —
the horizon and every trailing window below are measured back from the
**reference instant**, the committer timestamp of `HEAD`, never from the
wall clock, so a fixture's fixed timestamps and a real repository's history
are judged the same way on any day);
for included commits, generates all canonical-ordered (`a < b`) file pairs
from the touched-file set and accumulates `cochange_pairs` counts with
`INSERT ... ON CONFLICT DO UPDATE`, recording `last_ts` per pair. Detects
history rewrite (watermark not reachable from `HEAD`) → full re-mine plus a
diagnostic. Mines the deterministic landmine classes of AD-15:
`revert_chain` (a file in ≥ 2 revert-labelled commits within the horizon)
and `fix_chatter` (≥ `landmine.fix_chatter_k` fix-labelled commits touching
the file within `landmine.fix_chatter_window_days`), each written with
evidence and support. Corpus floor: history genres receive no candidates
until non-excluded commits ≥ `miner.corpus_floor_commits`.

**Creates.** `src/miner/cochange.ts` — AD-13.

**Source.** `AD-13` (miner: git log stream, hygiene filters, canonical
pairs, watermark, corpus floor); `AD-15` (landmine sources: `revert_chain`,
`fix_chatter`); `FR-K2` (hygiene); `FR-A6` (corpus floor, no adoption
window).

**Why this approach (Gate 3):**
1. **The decision.** Stream `git log` line-by-line; hygiene as hard filters
   recorded in `commits.excluded`; corpus floor is evidentiary, not
   session-based; landmine mining is the two deterministic classes only.
2. **The authoritative standard.** `AD-13`; `AD-15`; `FR-K2` (spec-stated
   hygiene items with their own sources — MSR/HERZIG); Zimmermann et al.
   TSE 31(6) 2005 (ROSE) for the pair-count confidence model.
3. **Why this standard applies here.** Merge commits inject tangled changes
   (HERZIG); >30-entity transactions are refactor sweeps that dilute signal;
   the watermark keeps incremental refresh cheap; the two landmine classes
   are checkable and carry their evidence — anything subtler is Phase B/C.
4. **What this is NOT — and why.** Not per-commit transaction lists as the
   query model (unbounded storage, aggregation at lookup). Not
   association-rule mining at query time (hook-path budget). Not recency
   pruning (the spec chose horizon-cap; pruning deletes evidence). Not
   landmine mining via sentiment or ML (unmeasured machinery — AD-15).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-13-1`.

**Impact if wrong.** Contained to history genres — a broken miner starves
Coupling, Consequence, Completeness, and Warning genres of evidence (they
stay silent, `FR-A6`).

---

### Step 14 — Structural indexer skeleton, LanguageFrontend interface, reindex lock

```step-decl
step: S14
covers: [PA-1, PA-3, PA-6]
files:
  create: [middleware/context-oracle/ctxoracle/src/index/indexer.ts, middleware/context-oracle/ctxoracle/src/index/frontend.ts, middleware/context-oracle/ctxoracle/src/index/zone.ts, middleware/context-oracle/ctxoracle/test/unit/indexer.test.ts, middleware/context-oracle/ctxoracle/test/unit/indexer_stale.test.ts, middleware/context-oracle/ctxoracle/src/index/search.ts]
  modify: []
  delete: []
provides: [LanguageFrontend, runIndex, refreshIfStale, symbolSearch, pathSearch]
tests: [T-14-1, T-14-2]
depends_on: [S1, S5, S9, S10, S11, S12, S13]
```


**What changes.** Create `src/index/frontend.ts` — the interface:
```ts
interface LanguageFrontend {
  readonly lang: string;
  parse(path: string, content: Buffer):
    { symbols: SymbolRow[]; imports: ImportEdge[] };
}
```
Create `src/index/search.ts` — the one search interface (AD-2, D-plan-28):
`symbolSearch(store, terms): SymbolHit[]` and `pathSearch(store, terms):
PathHit[]`, each with two implementations chosen by `schema_meta.fts_state`
at call time — `MATCH` over `fts_symbols`/`fts_paths` when `'fts5'`, and
indexed `LIKE`/token-prefix queries over `symbols(name)` and `files(path)`
(Step 7's indexes) when `'fallback'` — returning the same shape so no
caller knows which ran; `status` prints the state (Step 33). Create
`src/index/zone.ts` (zone classification per AD-12: marker comments
in the head 2 KB, `dist/`/`build/`/lockfile patterns, `.gitignore`
membership, `vendor/`/`node_modules/`; the evidence string is redacted and
injection-flagged at capture — `zone_evidence_suspect`). Create
`src/index/indexer.ts`:
- `runIndex(store, repoPath, {full: boolean, frontends: LanguageFrontend[]})`:
  walks the working tree respecting `.gitignore`; per file resolves the
  language via `index.ext_to_grammar` (Step 12) with `tuning` overrides;
  hands the file to the member of `frontends` whose `lang` matches, or to
  the list's generic member when none matches, and indexes a file for which
  the list holds neither path-only — its `files` row, zone, and FTS path
  tokens — which is the state every file is in at this step, where the
  list is empty because no frontend exists yet (Step 15 creates both and
  the default list); writes `files`,
  `symbols`, `import_edges`; updates `symbol_refs` (per exported symbol,
  the count of other files whose text references its identifier among the
  files that import its file); computes `entry_score` (import in-degree +
  path-marker points for `main`, `index`, `cli`, `app`, route-registration
  patterns); writes `test_map` (path conventions + import edges from test
  files); files > 1 MB or > 20k lines are indexed path-only with a
  diagnostic; every ingested string passes through `redact` (Step 11);
  incremental by `content_hash`, deletions cascade; records
  `schema_meta.index_head`. Then calls `mineCochange` (Step 13).
- `refreshIfStale(store, repoPath): { stale: boolean }`: compares
  `schema_meta.index_head` to `HEAD` read from the `.git` directory (a
  bounded file read, not a subprocess — AD-23); on drift records the
  `index_stale` fault (AD-17's detector, through Step 10's writer), writes
  `schema_meta.index_stale = '1'` (cleared to `'0'` by the next completed
  `runIndex`), and returns `{stale: true}`; it spawns nothing — the caller
  that owns a binary (the handler, Step 28) starts the detached reindex.
  `acquireReindexLock(home, key)`: the exclusive advisory lock on
  `<home>/projects/<key>/.reindex.lock` (`fs.openSync` with `wx`, pid
  written, stale-lock detection by pid liveness) that `runIndex` takes; a
  second concurrent index refuses. The handler never waits on the lock
  (staleness merely lowers confidence, `FR-K7`).

**Creates.** `src/index/indexer.ts` — orchestrator + reindex lock; `src/index/frontend.ts` — LanguageFrontend interface; `src/index/zone.ts` — zone classification + evidence.

**Source.** `AD-12` (indexer: LanguageFrontend, zone, `entry_score`,
`import_edges`, `symbol_refs`, `test_map`, incremental refresh, size caps,
detached refresh with a lock file and `CTXORACLE_INTERNAL=1`); `AD-26`
(the reindex directory lock; the handler never waits); `AD-23` (`HEAD`
read is a bounded file read).

**Why this approach (Gate 3):**
1. **The decision.** Interface-first so the tree-sitter frontend and the
   generic fallback are peers, with the frontend list an argument of
   `runIndex` — AD-12's configurable table as an explicit input
   (D-plan-29); incremental refresh via content-hash +
   `index_head`; staleness lowers confidence, never blocks; the detached
   refresh is lock-protected and fire-and-forget.
2. **The authoritative standard.** `AD-12`; `FR-K1` (language-agnostic
   seam); `C-6` (broad and extensible, no fixed list); OWASP ASVS 5.0 V5
   (File Handling) for the size caps; `AD-23`'s blocking-call inventory
   (no `git` subprocess on the event path).
3. **Why this standard applies here.** Everything the event path serves is
   precomputed here (`NF-1`), and the seam is what makes adding a language
   a config change; the `.git` file read keeps `SessionStart` inside the
   inventory.
4. **What this is NOT — and why.** Not per-language hard-coded pipelines
   (C-6 violation). Not "all files parsed regardless of size" (the caps
   prevent a generated file from blowing the indexer). Not `git rev-parse
   HEAD` on the event path (a subprocess outside AD-23's inventory).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-14-1` (the skeleton runs on `indexer-small` and
`over-threshold-file` with an empty frontend list; every file has a
`files` row with its zone and FTS path tokens and no `symbols` or
`import_edges` row; the > 1 MB file is path-only with a diagnostic; the
planted secret is absent from the store; a second run over an unchanged
tree writes nothing; the lock refuses a second concurrent reindex), `T-14-2`
(`refreshIfStale`: a moved `HEAD` records `index_stale`, sets the flag, and
returns `{stale: true}`; an unmoved `HEAD` records nothing and returns
`{stale: false}`; a completed `runIndex` clears the flag).

**Impact if wrong.** Contained per genre — a broken indexer starves
Orientation, Reuse, Coupling; visible in `status` per-genre counts.

---

### Step 15 — tree-sitter frontend + generic fallback

```step-decl
step: S15
covers: [PA-1, PA-3]
files:
  create: [middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts, middleware/context-oracle/ctxoracle/src/index/generic_frontend.ts, middleware/context-oracle/ctxoracle/src/index/frontends.ts, middleware/context-oracle/ctxoracle/test/unit/tree_sitter_frontend.test.ts, middleware/context-oracle/ctxoracle/test/unit/generic_frontend.test.ts, middleware/context-oracle/ctxoracle/test/unit/indexer_frontends.test.ts]
  modify: []
  delete: []
provides: [treeSitterFrontend, genericFrontend, defaultFrontends]
tests: [T-15-1, T-15-2, T-15-3]
depends_on: [S1, S14]
```


**What changes.** Create `src/index/tree_sitter_frontend.ts` exporting
`treeSitterFrontend(lang): LanguageFrontend`, which implements
`LanguageFrontend` by loading the grammar `tree-sitter-wasms/out/<lang>.wasm`
(the package's documented output directory, V14; path resolved with
`import.meta.resolve`), parsing via `web-tree-sitter`, extracting symbols
and imports via per-language tree-sitter queries. Grammar loading is lazy
per `(lang, first use)` and cached; parser instances are pooled inside the
indexer process only (AD-1: no cross-process state). Create
`src/index/generic_frontend.ts` exporting `genericFrontend: LanguageFrontend`
— line-based heuristics: identifier-shape
regexes for definitions (`function`, `class`, `def`, `fn`, shell function
syntax, …), path-and-word tokenization into FTS. **`import_edges` and
`symbol_refs` are NOT produced by the generic frontend** — that absence is
what makes a generic-frontend candidate structurally uncountable in the
Reuse dominance test (Step 18, L6). Create `src/index/frontends.ts`
exporting `defaultFrontends(): LanguageFrontend[]` — one
`treeSitterFrontend(lang)` per grammar the `index.ext_to_grammar` table
(Step 12) names, then `genericFrontend` last — the list the `index` verb
(Step 28) and `init` (Step 31) pass to `runIndex` (D-plan-29).

**Creates.** `src/index/tree_sitter_frontend.ts` — WASM grammars; `src/index/generic_frontend.ts` — line-based fallback; `src/index/frontends.ts` — `defaultFrontends()`, the list the indexer's callers pass.

**Source.** `AD-12`; V14 (web-tree-sitter 0.26.13 and tree-sitter-wasms
0.1.13, pure WASM, no install scripts — re-read 2026-09-07, §11.4); L6.

**Why this approach (Gate 3):**
1. **The decision.** Tree-sitter frontend where a grammar exists; a
   deliberately weaker generic fallback for everything else so no language
   is invisible.
2. **The authoritative standard.** `AD-12` (architecture); the
   `web-tree-sitter` package API (`Parser.init`, `Language.load`,
   `parser.parse`, verified at build against the pinned 0.26.13 — Step 38's
   grammar-inventory check loads every default grammar through it).
3. **Why this standard applies here.** The generic frontend's inability to
   produce `import_edges` is a property, not a gap — it forces the Reuse
   crown to abstain on incomparable sets (L6, AC-1b mixed-language case).
4. **What this is NOT — and why.** Not a native tree-sitter binding (would
   violate C-3). Not the TypeScript compiler API (single-language). Not a
   regex-only frontend as primary (false symbols poison pointers — P4).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-15-1` (TypeScript fixture: symbols with correct spans,
import edge resolving to the imported file), `T-15-2` (a `.sh` file:
function-shape symbols, zero `import_edges`), `T-15-3` (the indexer run
with `defaultFrontends()` on `indexer-small`: `symbols`, `import_edges`,
`symbol_refs`, `entry_score`, `test_map` populate; the FTS and `LIKE` hit
sets agree for symbol-token queries).

**Impact if wrong.** Contained per language — a broken frontend falls back
to generic (visible in `status` per-language counts).

---

### Step 16 — The bar (AD-14 combinator)

```step-decl
step: S16
covers: [PA-1]
files:
  create: [middleware/context-oracle/ctxoracle/src/bar/combinator.ts, middleware/context-oracle/ctxoracle/test/unit/bar.test.ts]
  modify: []
  delete: []
provides: [passesBar]
tests: [T-16-1]
depends_on: [S1, S12, S13, S14]
```


**What changes.** Create `src/bar/combinator.ts` exporting
`passesBar(candidate: Candidate, tuning: TuningReader, ctx: { indexStale:
boolean }): { passes: boolean; failedAxis?: 'confidence'|'impact'|'marginal'
}` (`ctx.indexStale` is `EventContext.indexStale`, which the handler reads
from `schema_meta.index_stale` — Step 14's flag — once per event; no `HEAD`
read happens here, AD-23). Implements the three-axis
**conjunction** (no multiplication). Confidence uses per-fact-class
computation (mined: `support` and `pair_count / a_count`, multiplied by the
recency dampener `0.5 ^ (age_days / bar.recency_half_life_days)` where
`age_days` is the pair's `last_ts` measured back from Step 13's reference
instant, and by `bar.stale_index_factor` whenever `ctx.indexStale` is
true — `FR-K7`'s "staleness lowers confidence without blocking" — then the
trust cap; human: constant-high). Decision-impact
is a deterministic ordinal from per-candidate properties only
(edit-context vs read-context, blast-radius band, zone criticality) —
carries NO genre term and NO intent term (`D-18`). Marginal value is
defined for all three Phase A fact classes per AD-14 (single-file
current-state fails; cross-file history-derived passes by construction;
cross-file current-state passes only when comparative/aggregative — Reuse).
Hazard-path candidates (Warning genre) skip the confidence floor and
require only the noise floor. Floors are read from `tuning` (Step 12).

**Creates.** `src/bar/combinator.ts` — AD-14.

**Source.** `AD-14` (the bar as conjunction of floors, no caps, hazard
bypass); `FR-A5`, `FR-A5a`; `OL-C1` (no volume/budget); `D-18` (no intent
term in impact).

**Why this approach (Gate 3):**
1. **The decision.** Conjunction, not product; hazard bypass on the
   confidence floor only; floors from `tuning` so calibration is a `tune`
   operation, not a recompile.
2. **The authoritative standard.** `AD-14`; `FR-A5` (conjunction); `OL-C1`
   (no caps); ROSE via spec §9 for the confidence computation.
3. **Why this standard applies here.** A multiplicative score launders a
   low axis (the 2026-08-16 collapse); the conjunction is what makes each
   axis a floor and each axis's failure visible.
4. **What this is NOT — and why.** Not a top-k selector (`OL-C1`). Not a
   learned bar in Phase A (`D-12`). Not a precision floor on hazards
   (`OL-C4`).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-16-1` (including the recency and stale-index
dampening cases).

**Impact if wrong.** Systemic to whisper output — a broken bar over- or
under-fires every genre. Caught by `T-16-1` and the AC-3/AC-3a/AC-4/AC-6
replay tests (Step 38).

---

### Step 17 — Command-class classifier (AD-15 supporting)

```step-decl
step: S17
covers: [PA-1]
files:
  create: [middleware/context-oracle/ctxoracle/src/genres/command_class.ts, middleware/context-oracle/ctxoracle/test/unit/command_class.test.ts, middleware/context-oracle/ctxoracle/test/unit/command_class_compound.test.ts]
  modify: []
  delete: []
provides: [classifyBashCommand]
tests: [T-17-1, T-17-2]
depends_on: [S1, S12]
```


**What changes.** Create `src/genres/command_class.ts` exposing
`classifyBashCommand(command: string, testRunnerLexicon: string[],
innocuousLexicon: string[]): { class: 1|2|3; segments: SegmentClass[] }`.
Per AD-15: split on `&&`, `;`, `|`, `||` **quote-aware** (operators inside
quotes are not split points; a quoting error, a subshell, or an `sh -c`
wrapper → class 3 wholesale). Per segment: class 1 when the head matches a
test-runner entry (with the run target extracted where possible); class 2
only when EVERY segment's head is in the innocuous list; class 3 otherwise.
Segments contribute independently to the Verification genre's run-state
computation (Step 18).

**Creates.** `src/genres/command_class.ts` — ternary classifier (AD-15).

**Source.** `AD-15` (ternary classifier; per-segment; the weaker "no
*recognized* test run" claim ships for class 3).

**Why this approach (Gate 3):**
1. **The decision.** Ternary with class 3 as the default for any
   unclassified segment; the weaker honest claim ships for class 3 (never
   the strong "not run").
2. **The authoritative standard.** `AD-15` — a partial classifier with an
   unstated default has the unsafe direction: it re-admits the false "not
   run".
3. **Why this standard applies here.** AC-8's content assertion requires
   the covering-test mapping to headline; the weaker claim keeps the genre
   alive while never asserting "not run" over a run-state the classifier
   does not know.
4. **What this is NOT — and why.** Not head-only classification (`cd pkg
   && npm test` composes both — segments matter). Not a full shell parser
   (complexity for no benefit — quoted or subshell wrappers land safely in
   class 3).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-17-1` (single-segment positives per lexicon), `T-17-2`
(compound, quoted, subshell cases).

**Impact if wrong.** Contained to the Verification whisper — a
misclassification lands on the weak claim (safe under-detection).

---

### Step 18 — Genre modules (the seven Phase A generators) + done-claim recognizer

```step-decl
step: S18
covers: [PA-1]
files:
  create: [middleware/context-oracle/ctxoracle/src/genres/orientation.ts, middleware/context-oracle/ctxoracle/src/genres/coupling.ts, middleware/context-oracle/ctxoracle/src/genres/reuse.ts, middleware/context-oracle/ctxoracle/src/genres/consequence.ts, middleware/context-oracle/ctxoracle/src/genres/warning.ts, middleware/context-oracle/ctxoracle/src/genres/completeness.ts, middleware/context-oracle/ctxoracle/src/genres/verification.ts, middleware/context-oracle/ctxoracle/test/unit/genre_orientation.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_coupling.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_reuse.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_consequence.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_warning.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_completeness.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_verification.test.ts, middleware/context-oracle/ctxoracle/test/unit/done_claim_recognizer.test.ts]
  modify: []
  delete: []
provides: []
tests: [T-18-1, T-18-2, T-18-3, T-18-4, T-18-5, T-18-6, T-18-7, T-18-8, T-38-10, T-38-11, T-38-12, T-38-13, T-38-14, T-38-28, T-38-29]
depends_on: [S1, S9, S12, S13, S14, S15, S16, S17]
```


**What changes.** Create seven files in `src/genres/`, each implementing:
```ts
interface Generator {
  readonly genre: string;
  readonly triggerEvents: EventKind[];
  candidates(ctx: EventContext, store: Store): Candidate[];
}
```
Per genre:
- `orientation.ts` (FR-A2a, `UserPromptSubmit`): tokenize prompt, query
  `symbolSearch`/`pathSearch` (Step 14's interface — FTS5 or the `LIKE`
  fallback, unseen here), rank by (match strength × co-change hub degree
  × `entry_score`), select the top 2–4 entry-point files; join
  `invariant_members` for one binding invariant when one exists for a
  matched file (L10: invariants exist only via `note`). Marginal value:
  cross-file aggregative ranking.
- `coupling.ts` (FR-A2b, `PostToolUse` Read/Grep/Glob): `cochange_pairs`
  partners of the touched file; headline = partner + ratio + commit pointer.
- `reuse.ts` (FR-A2c, `PostToolUse` Grep/Glob): FTS-match the searched term
  against `symbols`, restricted to same-kind symbols; for each candidate
  read `symbol_refs.ref_count`; if any candidate's `lang` is not
  grammar-covered → **incomparable set, silence**; else the crown goes to
  the candidate whose count is ≥ `bar.reuse_dominance_k` × the runner-up's;
  headline = "of the N symbols matching this search, X is the one M files
  use; the runner-up has m", with the same-name/string false-positive
  caveat in the evidence and confidence capped (L6). A grammar-covered
  symbol with an observed count of 0 stays comparable.
- `consequence.ts` (FR-A2d, `PreToolUse` Edit/Write): coupled test files of
  the target (`cochange_pairs` joined with `test_map`) + zone flag; never a
  raw call-site count alone.
- `warning.ts` (FR-A2e, `PreToolUse` Edit/Write): `landmines` rows for the
  target with evidence, support, and the confidence stated (FR-A5a);
  candidates are flagged `hazard` so the bar applies the noise floor only.
- `completeness.ts` (FR-A2f, `Stop`): the session's edited files from
  `observed_actions` (`outcome='ok'`, Edit/Write rows only — AD-4's consumer
  filter) → un-edited partners above the ratio floor.
- `verification.ts` (FR-A2g, `Stop` with done-claim): changed regions (from
  `outcome='ok'` Edit/Write rows) → `test_map` covering tests, minus test
  runs observed in `observed_actions` `command_class` rows **of either
  outcome** (a failed run is a run); ships the covering-test **mapping** as
  the headline plus the run-state clause — the strong "not run" only when
  every observed command is class 1 or 2, otherwise the weaker "no
  *recognized* test run touched T; recognized runners: …" (AD-15); never
  run-state alone. Also exports the done-claim recognizer (`D-38`): the
  `lexicon.completion_claim` phrases in a **concluding position** of
  `last_assistant_message` — defined as: after stripping code fences, the
  phrase occurs in the final non-empty sentence, that sentence does not
  end with `?`, and the phrase is not negated within its clause (`not`,
  `n't`, `never`, `isn't`, `haven't`, `wasn't` before it in the same
  clause) — conservative bias (no match → ordinary stop, no whisper; a
  paraphrase outside the lexicon never fires; a negated claim never fires).

Every candidate carries ≥ 1 verifiable pointer; the composer (Step 19)
re-resolves it (rumor rule, FR-D1).

**Creates.** `src/genres/orientation.ts` — FR-A2a; `src/genres/coupling.ts` — FR-A2b; `src/genres/reuse.ts` — FR-A2c; `src/genres/consequence.ts` — FR-A2d; `src/genres/warning.ts` — FR-A2e (⚠, FR-A5a); `src/genres/completeness.ts` — FR-A2f; `src/genres/verification.ts` — FR-A2g + done-claim recognizer (D-38).

**Source.** `AD-15` (per-genre triggers, queries, headlines, marginal-value
guarantees; the done-claim recognizer); `AD-4` (consumer filter);
`FR-A2a`–`FR-A2g`, `FR-D1`–`FR-D5`, `P5`, `D-26`, `D-38`; L6, L10.

**Why this approach (Gate 3):**
1. **The decision.** One module per genre; each carries its P5
   marginal-value guarantee as its own testable property; the Reuse
   incomparable-set silence is structural; the run-state clause is chosen
   by the classifier's class, never assumed.
2. **The authoritative standard.** `AD-15`; `FR-A2a`–`FR-A2g`; `P5`;
   `D-26`; `D-38`.
3. **Why this standard applies here.** Per-genre P5 guarantees are what
   make each `AC-1`–`AC-1d` assertion mechanical; the Reuse structural silence is
   what closes the L6 mixed-language false-crown risk; the weak/strong
   run-state split is what keeps AC-8's headline honest over a run the
   classifier cannot see.
4. **What this is NOT — and why.** Not a shared "interesting facts" scorer
   that genres filter (blurs each genre's P5 guarantee). Not
   narration-triggered genres (Phase B). Not a done-claim recognizer that
   fires on any Stop (`D-38`: it errs toward silence).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-18-1`–`T-18-7` (one function-level test per generator on
a store seeded from its fixture repo), `T-18-8` (done-claim recognizer);
acceptance replays `T-38-10`–`T-38-14`, `T-38-28`, `T-38-29` at Checkpoint 4.

**Impact if wrong.** Contained per genre; each per-AC replay pins its
headline.

---

### Step 19 — Compose: pointer-only whispers, rumor rule

```step-decl
step: S19
covers: [PA-1, PA-6]
files:
  create: [middleware/context-oracle/ctxoracle/src/hook/compose.ts, middleware/context-oracle/ctxoracle/test/unit/whisper_form.test.ts, middleware/context-oracle/ctxoracle/test/unit/compose_rumor_rule.test.ts]
  modify: []
  delete: []
provides: []
tests: [T-19-1, T-19-2, T-38-19]
depends_on: [S1, S9, S11, S18]
```


**What changes.** Create `src/hook/compose.ts` exporting
`compose(candidate, repoPath): { text: string } | { dropped:
'whisper_dropped_stale' }`: renders `[oracle]` prefix + genre tag +
pointer(s) + evidence ratio (history-derived) + confidence flag when not
high (`FR-D1`), informative and never imperative (`FR-D2`). **Pointer-only
composition (AD-19, Phase A):** no verbatim repo-derived text; paths, line
spans, commit hashes, symbol names, and numbers only; paths are
syntax-normalized (T1's residual). Rumor-rule check: each `file:span`
pointer is re-resolved by a seek-and-read of the cited span ± slack (never a
whole-file read; skipped for files over the AD-12 cap), and each commit
pointer against the store's `commits` table (never a `git` subprocess) —
AD-23's inventory; a pointer that no longer holds drops the candidate with
`whisper_dropped_stale`.

**Creates.** `src/hook/compose.ts` — whisper composer + rumor rule (AD-19, AD-15).

**Source.** `AD-19` (pointer-only composition in Phase A); `AD-15` (the
compose-time rumor rule); `AD-23` (bounded re-resolution reads); `FR-D1`–
`FR-D5`.

**Why this approach (Gate 3):**
1. **The decision.** Pointer-only; bounded re-resolution at compose time is
   Phase A's guarantee that a `file:line` pointer still says what the
   whisper claims.
2. **The authoritative standard.** `AD-19`; `AD-15`; `FR-D1` (an
   uncheckable whisper is a rumor and is not emitted); OWASP LLM01
   (prompt-injection surface removal).
3. **Why this standard applies here.** Verbatim text opens the T1 surface;
   Phase A has no model that needs quoted context, so Phase A whispers can
   be pointer-only and the injection surface at the whisper channel is
   closed by construction.
4. **What this is NOT — and why.** Not "quote a line to give the agent
   context" (a Phase B decision). Not a post-emit rumor check (the false
   whisper would already have shipped). Not whole-file re-reads (outside
   AD-23's inventory).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-19-1` (form validator per `FR-D1`–`FR-D5`), `T-19-2`
(a candidate whose span no longer holds is dropped with the diagnostic);
acceptance replay `T-38-19`.

**Impact if wrong.** Direct owner-facing quality issue — a false-pointer
whisper is the checkably-false rumor `FR-D1` bars.

---

### Step 20 — Delivery: per-consumer dedup, session-boundary reconciliation, Stop-time channel

```step-decl
step: S20
covers: [PA-4]
files:
  create: [middleware/context-oracle/ctxoracle/src/hook/delivery.ts, middleware/context-oracle/ctxoracle/test/unit/delivery_dedup.test.ts, middleware/context-oracle/ctxoracle/test/unit/delivery_stop_channel.test.ts]
  modify: []
  delete: []
provides: [StopDelivery, deliverStop]
tests: [T-20-1, T-20-2, T-38-17, T-38-20, T-38-21, T-38-23]
depends_on: [S1, S9]
```


**What changes.** Create `src/hook/delivery.ts`:
- `perConsumerDedup(store, consumer, candidate): boolean` — withholds a
  candidate whose `subjectKey` is in `consumer_state` (`delivered` or
  `read`) for that consumer.
- `reconcileDedupOnSessionStart(store, consumer, source)` — per V5 and
  `D-20`: `startup`/`clear` → both sets cleaned; `resume`/`fork` → both
  sets kept; `compact` → `read` cleared, `delivered` kept.
- `updateReadSet(store, consumer, observedAction)` — on `PostToolUse` with
  `outcome='ok'` for Read/Grep/Glob, adds subjects (path, symbol) to `read`.
- `recordDelivered(store, consumer, subjectKey)` — after audit-log-then-emit.
- `deliverStop(whisperText, stopHookActive): StopDelivery` — returns the
  internal delivery object `{ context: string } | null` (`null` when
  `stopHookActive` is true — the single-cycle bound, V3); the adapter
  (Step 28) is the only module that turns it into the hook's
  `additionalContext` field, so this file names no hook field.

**Creates.** `src/hook/delivery.ts` — per-consumer dedup + Stop-time additionalContext (AD-16).

**Source.** `AD-16` (delivery + dedup + session-boundary reconciliation +
Stop-time `additionalContext`); `FR-A4`, `FR-D5`, `FR-O6`, `FR-B4`, `D-20`;
V3, V5.

**Why this approach (Gate 3):**
1. **The decision.** Per-consumer sets in the store (survive process
   boundaries per AD-1); Stop-time single-cycle via the `stop_hook_active`
   input (not a counter).
2. **The authoritative standard.** `AD-16`; `FR-A4`; V3 (the documented
   single-cycle bound).
3. **Why this standard applies here.** The no-daemon topology (AD-1) means
   state must live in the store; `stop_hook_active` is the documented
   bound that makes the single-cycle delivery structural.
4. **What this is NOT — and why.** Not a session-wide shared dedup
   (starves subagents — `FR-O6`). Not `decision:"block"` at Stop
   (surfaces as an error — V3, `FR-B4`). Not a time-window suppression (a
   cap in disguise; `OL-C1`).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-20-1` (dedup and the five `source` reconciliations at
function level), `T-20-2` (`deliverStop` with and without
`stop_hook_active`); acceptance replays `T-38-17`, `T-38-20`, `T-38-21`, `T-38-23`.

**Impact if wrong.** Repeat whispers (annoying), missed dedup after a
session boundary (visible), a stop-cycle repeat (bounded by the harness's
8-continuation cap regardless).

---
### Step 21 — Transcript reader: JSONL tail, entry adapter, markers

```step-decl
step: S21
covers: [PA-2]
files:
  create: [middleware/context-oracle/ctxoracle/src/transcript/reader.ts, middleware/context-oracle/ctxoracle/src/transcript/locate.ts, middleware/context-oracle/ctxoracle/test/unit/reader.test.ts, middleware/context-oracle/ctxoracle/test/unit/reader_v12_counts.test.ts]
  modify: []
  delete: []
provides: [TranscriptReader, locateTranscript, projectTranscriptDir]
tests: [T-21-1, T-21-2]
depends_on: [S1, S6, S9]
```


**What changes.** Create `src/transcript/locate.ts` — the only module that
knows where transcripts live (AD-11): `locateTranscript(ev: InternalEvent):
string` returns the resolved absolute path of `ev.transcriptPath`, and
`projectTranscriptDir(cwd: string): string` returns the directory Claude
Code keeps a project's transcripts in — `~/.claude/projects/<slug>/`, where
`<slug>` is the realpath of `cwd` with every `/` replaced by `-` (the
observed encoding, §11.4; V12's undocumented layout, held in this one file
so a layout change is one edit). Phase A **reads main-consumer transcripts
only** (AD-11); subagent transcripts are not located, opened, or recorded.

Create `src/transcript/reader.ts` exporting `TranscriptReader`:
- `readFrom(path, offset)`: opens the file at `offset`, reads to EOF in
  bounded slices (AD-23), parses one JSON object per newline-delimited
  line, tolerates a partial trailing line by leaving its bytes for the next
  event, and returns the entries plus the byte offset up to which parsing
  succeeded.
- `discriminateEntry(entry)`: returns `{kind: 'human', text, uuid,
  timestamp} | {kind: 'assistant_text', text, uuid, timestamp} | {kind:
  'skip', reason: 'meta' | 'task_notification' | 'tool_result' |
  'thinking_only' | 'tool_use_only' | 'unknown_shape'}`. **Human-turn
  discrimination is by markers, never by content shape** (V12):
  `origin.kind === 'human'` AND `isMeta !== true`; a human turn's content may
  be a string or a list (text blocks concatenated). A marker-absent
  string-content user entry returns `{kind:'skip', reason:'unknown_shape'}`
  — the handler raises `unrecognized_user_entry`. An assistant entry whose
  content includes a `text` block is `assistant_text`; thinking-only and
  tool_use-only turns are skipped.
- On a structural parse failure (unknown shape where a known one is
  required), throws a typed error the handler records as
  `transcript_layout_changed` and answers by proceeding whisper-only with
  the qa-state frozen open (AD-11: frozen-open, never frozen-cleared).

**Creates.** `src/transcript/reader.ts` — bookmarked JSONL tail (AD-11); `src/transcript/locate.ts` — transcript path adapter.

**Source.** `AD-11` (bookmarked JSONL tail; version-guarded adapter;
marker-based discrimination; frozen-open on breakage); V12 (three kinds
of string-content `user` entries beside list-content tool results; markers
are mode-dependent); V1 (`transcript_path` may lag — re-read in the hooks
reference 2026-09-07, §11.4).

**Why this approach (Gate 3):**
1. **The decision.** Marker-based discrimination is the ONLY mechanism for
   classifying a user entry as human; a marker-absent string entry is
   `unrecognized_user_entry`, never guessed as human; breakage freezes the
   state open.
2. **The authoritative standard.** `AD-11`; V12 (measurement of a real
   transcript containing injected turns; re-measured on the 2026-09-07
   session transcript, §11.4).
3. **Why this standard applies here.** The deny path reads qa-state that
   this reader populates. A hook-feedback entry or a task notification
   misclassified as a human turn would open a question and drive a wrongful
   deny — the T2 injection surface the marker discipline closes.
4. **What this is NOT — and why.** Not a content-shape discriminator
   ("string content = human" would let hook feedback drive a deny). Not
   `last_assistant_message`-only (Stop-only per V1; the PreToolUse
   clear-axis needs the file). Not a live-tail watcher (`FR-O5` bars timer
   paths; the bookmark advances only on hook-fired events). Not
   frozen-cleared on breakage (an unreadable transcript must not silently
   clear a question — the hold direction of FR-B1's lag clause).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-21-1` (fixture tests: partial trailing line tolerated
across two reads; hook-feedback / task-notification / marker-absent string
entries return `skip` with the right reason; a tool-result list-content
entry returns `skip`; list-content human turn concatenated; an unknown
structural shape throws the typed error), `T-21-2` (V12 enumeration counts
reproduced on a synthesized transcript).

**Impact if wrong.** Systemic to the deny path — a discrimination bug
directly drives wrongful denies (over-fire) or missed intake (under-fire).
`unrecognized_user_entry` and `transcript_layout_changed` surface breakage;
over-fire is also caught by the AC-2c replays.

---

### Step 22 — QA state DAO + the Phase B seam

```step-decl
step: S22
covers: [PA-2, PA-8]
files:
  create: [middleware/context-oracle/ctxoracle/src/qa/state.ts, middleware/context-oracle/ctxoracle/test/unit/qa_state.test.ts]
  modify: []
  delete: []
provides: [openQuestion, answerQuestions, voidQuestion, getOpenQuestions]
tests: [T-22-1]
depends_on: [S1, S7, S9]
```


**What changes.** Create `src/qa/state.ts` exporting the DAO whose read
interface Phase B's model-maintained writer will leave unchanged:
- `openQuestion(store, {consumer, questionText, contentHash, askedUuid?,
  askedOffset?}): QuestionId | 'already_open'` — inserts into `questions`
  with status `open` (the table is operational state, not a knowledge
  table: AD-4 gives it no provenance block, and its origin is carried by
  `asked_uuid` — null at intake, backfilled from the transcript — and by
  `closed_by_kind`); the open-scoped dedup index (Step 7)
  makes a second concurrent open for the same `(consumer, content_hash)`
  a `UNIQUE` failure the DAO maps to `'already_open'`.
- `getOpenQuestions(store, consumer): Question[]` — the READ interface the
  deny path calls. **This signature is the Phase B seam and does not
  change.**
- `answerQuestions(store, consumer, closedByUuid, closedByKind:
  'generic_text_all_prior'): number` — bulk-closes all currently-open rows.
- `voidQuestion(store, questionId, 'intake_invalidated', denyFired:
  boolean)` — records in `closed_by_kind` and in the fault detail whether a
  deny had already fired on the row (so the `status` wrongful-deny surface
  can count the L11 transient case).
- `expireOnStartup(store, consumer)`, `advanceBookmark(store, consumer,
  offset, uuid)`, `getBookmark(store, consumer): {offset, uuid} | null`.

**Creates.** `src/qa/state.ts` — DAO; Phase B seam (read interface stable).

**Source.** `AD-9` (the Phase B seam: Phase B replaces the recognizer
module Step 23 creates;
`state.ts`'s read interface is unchanged; the `expired` status,
`closed_by_kind`, and fault codes are part of the seam); `AD-4` (the
`questions` schema and `q_open_dedup`).

**Why this approach (Gate 3):**
1. **The decision.** The DAO is the seam; every deny-path read goes through
   `getOpenQuestions`; Phase B's writer replaces the recognizer module
   (Step 23), not this file; the voiding path records whether a deny already fired.
2. **The authoritative standard.** `AD-9`; ISO/IEC 25010 maintainability
   (modularity, replaceability).
3. **Why this standard applies here.** §11.5: "the model updates the
   *cached* state between actions; the `PreToolUse` deny stays synchronous,
   reading that cached state." The cached state IS `questions` plus
   `classify_state`; the seam is exactly that interface.
4. **What this is NOT — and why.** Not a generic key-value seam (defeats
   AD-4's STRICT+CHECK provenance). Not an in-memory cache above the DAO
   (staleness between processes — the store is the shared state).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-22-1` (round-trips; open-scoped dedup at DB level; two
child processes contending on `openQuestion` for the same key yield exactly
one `open` row and one `'already_open'`; re-open after `answered`).

**Impact if wrong.** Systemic to the deny path — caught by `T-22-1`.

---

### Step 23 — QA recognizers (question, clear, move) — the honest floor

```step-decl
step: S23
covers: [PA-2]
files:
  create: [middleware/context-oracle/ctxoracle/src/qa/classify.ts, middleware/context-oracle/ctxoracle/test/unit/recognizer_question.test.ts, middleware/context-oracle/ctxoracle/test/unit/recognizer_clear.test.ts, middleware/context-oracle/ctxoracle/test/unit/recognizer_move.test.ts]
  modify: []
  delete: []
provides: [recognizeQuestions, recognizeClearing, recognizeMove]
tests: [T-23-1, T-23-2, T-23-3]
depends_on: [S1, S12]
```


**What changes.** Create `src/qa/classify.ts` exporting three deliberately
conservative recognizers, each a small pure function:
- `recognizeQuestions(text, stoplist, {requireTerminalMark} =
  {requireTerminalMark: true}): {questionText, contentHash}[]` — a
  sentence is a question when (i) it ends with `?` (the intake path, Step
  25, never passes `requireTerminalMark: false`; the `--missed-question`
  verb, Step 34, is the only caller that does), (ii) it is outside code
  fences and quoted blocks, (iii) it is not matched by `lexicon.stoplist`.
  Multiple questions in one turn yield multiple results. **Nothing else
  opens a question**: an indirect ask ("tell me whether …"), an imperative
  ("explain the failure"), or a question without `?` is not recognized —
  L1's documented low coverage, measured at exit, never classified around.
- `recognizeClearing(assistantText, deferralStoplist, lengthFloorChars):
  {clears: boolean; reason?: 'below_length_floor' | 'deferral_only'}` —
  AD-9's two conditions and nothing else: strip tool-noise blocks and code
  fences; remove every occurrence of a deferral-stoplist phrase (the
  "I'll get to that"-class phrases Step 12 seeds — never a bare common
  word); the turn clears when the text that remains, punctuation and
  whitespace aside, is at least `lengthFloorChars` characters (a "small
  floor", AD-9 — the seeded value 2 rejects an empty or one-mark turn and
  nothing else). A turn that does not clear reports `deferral_only` when a
  phrase was removed and `below_length_floor` otherwise. So "No.", "Yes,
  line 12.", and the one-word direct answers "Sure.", "Ok.", "Right.",
  "Understood." clear (FR-B5: the recognizer errs toward clearing — a
  direct answer is never held for being short); a causal answer that
  happens to contain the word "later" clears (no bare word is a phrase); a
  deferral beside an answer, in either order and in one sentence or two
  ("I'll get to that. The null check does not fix it, see line 12."; "No —
  the null check does not fix it, see line 12, though I'll get to the rest
  later."), clears on what remains; "I'll get to that." and an empty turn
  do not. A dodge dressed in extra words ("Sure, I'll get to that after the
  refactor.") clears — the skeleton errs toward clearing, the exit report
  measures every deny escaped by a text turn (Step 39), and the human
  channel corrects the ones that matter (AD-9's deferral-false-match
  class) — never a vocabulary of acknowledgements or a clause grammar that
  would hold on an answer because of where it sat (D-plan-24; the rule was
  executed over the spec's examples, the direct answers, and the deferral
  cases, §11.4). The function takes no question text: it cannot match a
  turn to a specific question, which is the Phase B comprehension judgment
  (`AC-2a-ii`).
- `recognizeMove(toolName): boolean` — `true` exactly for `Write`, `Edit`,
  `NotebookEdit`; every other tool name is `false` (`D-39`: reads, searches,
  `Bash`, `Task`, MCP and web tools are never denied in Phase A).
The stoplists and the length floor are read from `tuning` by the caller
(Step 25) and passed in; the functions hold no configuration.

**Creates.** `src/qa/classify.ts` — recognizers (Phase B replaces this file).

**Source.** `AD-9` (the three recognizers and their biases); `D-39`
(protected class of answer-directed moves); `D-41` (Phase A is a
conservative recognizer; precision is Phase B); spec §11.5 and L1 (coverage
measured at exit, never classified around); collapse-log 2026-09-04.

**Why this approach (Gate 3):**
1. **The decision.** Three pure functions with exactly the rules AD-9
   states; the unit tests assert the coverage the recognizers must NOT have
   (indirect asks not recognized; every non-mutating tool not deny-eligible),
   so an implementer who "improves" coverage breaks a test.
2. **The authoritative standard.** `AD-9`; `D-41`; spec §11.5 ("a skeleton,
   not 'the block working'"); collapse-log 2026-09-04 (fake completeness).
3. **Why this standard applies here.** The 2026-09-04 collapse was
   precisely an elaborated question classifier; the phase goal is to measure
   how little this skeleton catches on real transcripts (Step 39), and a
   classifier padded at build time would poison that measurement. Making
   the non-coverage an asserted test outcome turns "restraint" from an
   instruction into a mechanical check.
4. **What this is NOT — and why.** Not a question-type classifier (the
   abandoned AD-9 slop). Not a wider deny-eligible set (would strand `Bash`
   test runs — `D-39`). Not a per-question clear matcher (Phase B,
   `AC-2a-ii`). Not a recognizer that carries its own thresholds (the
   floor is a `tuning` row so calibration is a `tune`, not a recompile).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-23-1` (question recognizer: positives and the asserted
non-coverage set), `T-23-2` (clear recognizer: boundary around the floor
read from `tuning`, deferral, substantive), `T-23-3` (move recognizer:
exactly three `true`; the enumerated other tools `false`).

**Impact if wrong.** Systemic to the deny path. Over-recognition opens too
many rows → over-denies (surfaced by the AC-2c over-fire replay and the
wrongful-deny rate); under-recognition is the designed direction and is
measured at exit.

---

### Step 24 — Deny verdict: the single producer (AD-10)

```step-decl
step: S24
covers: [PA-2, PA-8]
files:
  create: [middleware/context-oracle/ctxoracle/src/blocks/verdict.ts, middleware/context-oracle/ctxoracle/src/types/hook_response.ts, middleware/context-oracle/ctxoracle/test/build/typecheck_verdict_shape.test.ts, middleware/context-oracle/ctxoracle/test/build/fixtures/verdict_updated_input.ts, middleware/context-oracle/ctxoracle/test/build/fixtures/verdict_updated_tool_output.ts, middleware/context-oracle/ctxoracle/test/conventions/permission_decision_confined.test.ts, middleware/context-oracle/ctxoracle/test/build/typecheck_deny_brand.test.ts, middleware/context-oracle/ctxoracle/test/build/fixtures/deny_literal_outside.ts]
  modify: []
  delete: []
provides: [DenyVerdict, makeDenyVerdict]
tests: [T-24-1, T-24-2, T-24-3]
depends_on: [S1, S6, S9, S10]
```


**What changes.** Create `src/blocks/verdict.ts` — the ONLY module that
constructs a deny. It exports `type DenyVerdict = { readonly kind: 'deny';
readonly reason: string; readonly audit_id: string; readonly [denyBrand]:
true }` and `makeDenyVerdict(reason, auditId): DenyVerdict`; `denyBrand` is
a module-private `unique symbol`, so an *annotated* construction of a
`DenyVerdict` outside this file — a declared return or variable type met
by an object literal — fails to compile (`TS2741`, executed §11.4; a
compile-time fixture pins it, `T-24-3`); a type assertion (`{…} as
DenyVerdict`) still compiles, which is why the importer scan `T-24-2`, not
the brand, is the structural guard. The
verdict is an internal value: it names no hook field. Create
`src/types/hook_response.ts` — the type of the JSON the adapter (Step 28)
emits: `{ hookSpecificOutput?: { hookEventName; permissionDecision?: 'deny';
permissionDecisionReason?: string; additionalContext?: string } }`; it
deliberately has no `updatedInput` or `updatedToolOutput` member — `FR-B3`'s
no-mutation clause is unrepresentable (`T-24-1`). It is a type-only module
(erased at build), so its field names never appear in `dist/src/**`.

Create `test/conventions/permission_decision_confined.test.ts` (AC-2's
structural assertion made mechanical): an import scan over
`dist/src/**/*.js` asserting that `dist/src/blocks/verdict.js` is imported by
exactly one module, `dist/src/blocks/answer_drift.js` (the Phase C skill block will
be the second permitted importer). The wire-level field is confined
separately: `permissionDecision` appears in `dist/src/**` only in
`dist/src/hook/adapter.js` (`T-28-2`), which maps a `DenyVerdict` to it. Compiled
tests under `dist/test/**` are outside both scans by construction.

**Creates.** `src/blocks/verdict.ts` — the ONE deny-verdict producer (AD-10); `src/types/hook_response.ts` — the adapter's wire response type (type-only; no updatedInput/updatedToolOutput).

**Source.** `AD-10` (deny confinement: one producer, structurally; the
import-graph and built-output checks); `FR-B3` (no mutation); `AC-2`.

**Why this approach (Gate 3):**
1. **The decision.** One module constructs the deny (a branded type whose
   annotated construction fails to compile elsewhere; the importer scan is
   the structural guard); one module — the adapter — writes the wire field; an
   import scan over `dist/src/**` enforces the importer set and a string
   scan (`T-28-2`) the wire field.
2. **The authoritative standard.** `AD-10`; ISO/IEC 25010 analysability;
   collapse-log 2026-08-25 item 5 (an absolute silently broken by a second
   use of the primitive).
3. **Why this standard applies here.** "Exactly two blocks" is an absolute
   over a mechanism; the lesson says enumerate and confine structurally,
   not by convention. Scoping the scans to `dist/src/**` is what keeps the
   check meaningful once tests that legitimately construct a deny for
   assertion are compiled alongside (Step 1's layout); separating the
   internal verdict from the wire field is what lets the AD-6 single
   naming site and the AD-10 single producer both hold at once.
4. **What this is NOT — and why.** Not a runtime flag check per genre
   (convention, not structure). Not a source-only lint (built output is the
   ground truth). Not a wider verdict type (an unused `updatedInput` member
   is exactly the FR-B3 violation surface the type-level exclusion removes).
   Not a string scan for `permissionDecision` in `verdict.js` (the verdict
   is internal; the string belongs to the adapter, AD-6).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-24-1` (two compile-time fixtures — `updatedInput` and
`updatedToolOutput` — each fails `tsc`), `T-24-2` (the importer-set
convention: fails on a seeded second importer, passes on the clean build),
`T-24-3` (a compile-time fixture constructing a `DenyVerdict` literal outside
`blocks/verdict.ts` fails `tsc`).

**Impact if wrong.** Systemic and owner-invisible — a second deny caller
violates `FR-B1`'s "exactly two blocks" in a way the agent-visible deny
does not distinguish. Caught by `T-24-2` in CI on every PR.

---

### Step 25 — Answer-drift block: intake, catch-up, deny decision, lag-window hold

```step-decl
step: S25
covers: [PA-2]
files:
  create: [middleware/context-oracle/ctxoracle/src/blocks/answer_drift.ts, middleware/context-oracle/ctxoracle/test/unit/answer_drift_intake.test.ts, middleware/context-oracle/ctxoracle/test/unit/answer_drift_catchup.test.ts, middleware/context-oracle/ctxoracle/test/unit/answer_drift_decide.test.ts]
  modify: []
  delete: []
provides: [decideDeny, intakeFromPrompt, catchUpTranscript]
tests: [T-25-1, T-25-2, T-25-3, T-38-1, T-38-2, T-38-3, T-38-4, T-38-5, T-38-30, T-38-31]
depends_on: [S1, S12, S21, S22, S23, S24]
```


**What changes.** Create `src/blocks/answer_drift.ts` exposing:
- `intakeFromPrompt(store, consumer, promptText)`: runs `recognizeQuestions`
  on the `UserPromptSubmit.prompt` text; for each question `openQuestion`
  with `askedUuid`/`askedOffset` null (backfilled at reconciliation); an
  `'already_open'` result is not an error.
- `catchUpTranscript(store, diagnosticsDir, consumer, transcriptPath,
  deadline)`: reads from the bookmark to EOF via `TranscriptReader`; per
  entry: `human` → reconcile against intake rows by `content_hash`
  (backfill `asked_uuid`/`asked_offset`), open a fresh row for a human
  question with no intake row (same recognizer), and void an intake row
  whose matching turn carries an affirmatively non-human marker
  (`voidQuestion(..., 'intake_invalidated', denyFired)` + fault);
  `assistant_text` → `recognizeClearing`; every classified turn is
  recorded (`classified_turns.record(consumer, uuid, ts, clears, reason)`,
  Step 9; D-plan-27 — the record AD-9's `deny_loop` and
  `deny_despite_answer_text` detectors read across events), and on `clears`
  `answerQuestions(store, consumer, entry.uuid, 'generic_text_all_prior')`;
  `skip` with `unknown_shape` → `unrecognized_user_entry` fault. The
  bookmark advances only over completed lines; if the deadline fires
  mid-read the handler records `catchup_incomplete` and the next event
  resumes (questions not yet discovered cannot deny; questions already open
  keep holding).
- `decideDeny(store, consumer, toolName, toolInput): DenyVerdict | null`: `null` when
  `consumer !== 'main'` (`FR-O6`, AC-2a-i allow-half), when no `open`
  question exists, or when `recognizeMove(toolName)` is `false`; otherwise
  composes the reason "answer Max's question first: `<open question
  text(s)>`", appends the `kind='deny'` `whisper_audit` row (with the target
  `toolInput.file_path`/`toolInput.notebook_path` in `evidence_json` — the
  bypass diagnostic's key, AD-9) and returns the verdict for the adapter to
  render.

**The lag-window hold is this function's behaviour, not an extra
mechanism.** The clear-state is whatever the classified transcript shows
after catch-up read to EOF: when the newest assistant text has not been
flushed to `transcript_path` yet (V1), the row is still `open` and a
deny-eligible move is denied — the block holds rather than pre-clears
(FR-B1's lag clause, `D-41`), on the clear-axis only (nothing widens the
deny-eligible set; reads, searches, and `Bash` run freely). The transient
wrongful deny this produces is the spec's chosen error direction; it is
detected by `deny_after_answer_lag` (Step 26) and its rate is a Phase A exit
number (Step 39), not a plan-time estimate.

**Creates.** `src/blocks/answer_drift.ts` — the block; Phase A's only verdict caller (AD-9).

**Source.** `AD-9` (state, recognizers, deny decision, main-consumer scope,
intake voiding, lag-window hold on the clear-axis, resumable catch-up);
`AD-8` (audit-before-emit); `FR-B1` (lag clause), `FR-B2`, `FR-O6`,
`AC-2a-i`, `D-41`; V1, V5.

**Why this approach (Gate 3):**
1. **The decision.** Intake reads the `prompt` field so the row exists
   before the agent's first move; catch-up runs between intake and the
   block check per AD-8's fixed order; the deny is scoped to the main
   consumer by a structural early return; the hold is the consequence of
   reading to EOF and denying on open state, with no separate lag detector.
2. **The authoritative standard.** `AD-9` (all mechanisms); V1 (transcript
   lag is documented — re-read 2026-09-07); V5 (the `prompt` field);
   `FR-O6`; the collapse-log 2026-08-25 item 5 lesson (specify the lean for
   the not-yet-consistent window separately, prefer the error that
   self-recovers in-band).
3. **Why this standard applies here.** `OL-C5` says the block fires "after
   Max asks a question" — the moment is `UserPromptSubmit`, not later;
   reading the prompt field is the only way the row exists before the agent
   moves. A heuristic lag detector would add a second, independently-wrong
   opinion about a state the transcript already expresses; measuring the
   transient wrongful-deny rate is the honest treatment §11.5 asks for.
4. **What this is NOT — and why.** Not transcript-only intake (the
   transcript may lag past the first PreToolUse). Not a subagent-scoped
   deny (`AC-2a-i` allow-half). Not a bookmark-versus-file-size or timestamp
   heuristic for "am I in the lag window" (TOCTOU-shaped, unverifiable, and
   not in the architecture). Not a wider protected-class carve-out (`D-39`).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-25-1` (intake from prompt on a real store), `T-25-2`
(catch-up on real transcript fixtures: reconciliation backfill; a fresh
human question opened; a marker-carrying injected turn voids its intake row
with the deny-fired flag recorded; a clearing text turn closes all open
rows; bookmark advances only over completed lines), `T-25-3` (`decideDeny`:
open question + `Edit` → verdict with audit row and target recorded; `Read`,
`Bash`, `Task` → null; consumer `sub-*` → null; no open question → null —
the lag-window hold is not a unit case: it is the acceptance replay
`T-38-4`, D-plan-17).
Acceptance replays `T-38-1`–`T-38-5`, `T-38-30`, `T-38-31` at Checkpoint 4.

**Impact if wrong.** Systemic to the deny path. Over-fire is caught by the
AC-2c over-fire replay and surfaces on the wrongful-deny rate; under-fire
(missed intake) surfaces via the human channel and the AC-8a Stop-time line.

---

### Step 26 — Deny health detectors

```step-decl
step: S26
covers: [PA-2, PA-5]
files:
  create: [middleware/context-oracle/ctxoracle/src/blocks/health.ts, middleware/context-oracle/ctxoracle/test/unit/deny_health.test.ts]
  modify: []
  delete: []
provides: []
tests: [T-26-1, T-38-6]
depends_on: [S1, S9, S23, S25]
```


**What changes.** Create `src/blocks/health.ts` exposing detectors the
handler calls after every deny emission and every catch-up:
- `checkDenyAfterAnswerLag(store, consumer, classifiedTurns)` — when a
  catch-up classifies a clearing assistant turn whose transcript timestamp
  precedes an already-emitted deny for the consumer, record
  `deny_after_answer_lag` with both ids.
- `checkDenyLoop(store, consumer)` — ≥ `deny.loop_threshold` consecutive
  `kind='deny'` audit rows with no `classified_turns` row between them
  (`classified_turns.between`, Step 9) → `deny_loop`.
- `checkDenyDespiteAnswerText(store, consumer)` — ≥
  `deny.despite_answer_text_threshold` denies since the newest question
  opened with ≥ 1 intervening assistant text turn that the clear
  recognizer (Step 23) rejected with reason `below_length_floor` →
  `deny_despite_answer_text`. Turns rejected as `deferral_only` are
  excluded (AD-9's "excluding deferral-stoplist turns"): a deferral-only
  turn is the dodge the block exists for (FR-B1, OL-C3) and a deny after it
  is correct, never a wrongful-deny component; a deferral the stoplist does
  not recognize is human-channel-caught, AD-9. The classified turns both
  detectors read are the `classified_turns` rows the catch-up writes (Step
  25; the table is Step 7's, the DAO Step 9's; D-plan-27), so the detectors
  see turns from earlier events — each event is a fresh process (AD-1).
- `checkDenyBypassSuspect(store, consumer, postToolUseBashRow)` — on an
  `outcome='ok'` Bash row whose command matches the **enumerated path-write
  predicate** — redirection `>`/`>>`, `tee`, `sed -i`, `perl -i`, and
  `cp`/`mv`/`install` to a path (AD-4's list, verbatim, no additions) — and
  whose written path equals the target recorded in a same-turn
  `kind='deny'` row's `evidence_json`, record `deny_bypass_suspect`. The
  predicate's coverage bound is stated where the number is shown: `status`
  and the exit report print "bypass diagnostic recognizes only: <the
  list>; other shell write paths are not measured" (L3 owned as a class,
  not padded into a longer list).

**Creates.** `src/blocks/health.ts` — deny health detectors (AD-9, AD-17).

**Source.** `AD-9` (the four detectors and the bypass predicate's
over-/under-count disclosure); `AD-17` (each `FR-M2` class has a stable code
and a named detector); `FR-M2`, `FR-M4`; `AC-9`; L3.

**Why this approach (Gate 3):**
1. **The decision.** Every deny-mechanism error direction has a named
   detector; the bypass predicate is exactly the architecture's list, and
   its coverage bound is printed beside its count.
2. **The authoritative standard.** `AD-9`, `AD-17`; `FR-M2`; `AC-9`;
   collapse-log 2026-09-03 round 8 lesson 2 (own a residual as a class, not
   a growing enumeration).
3. **Why this standard applies here.** The block is the one Phase A
   mechanism that halts an agent; without detectors on both error
   directions the 2026-09-04 "looked like it worked" trap re-appears at
   runtime. Extending the bypass list would be the padding trap; stating
   its bound keeps the exit number honest.
4. **What this is NOT — and why.** Not a runtime disable path (a wrongful
   recognizer should surface, not switch itself off). Not a longer bypass
   list (every reachable shell write path is an open set; the diagnostic is
   a proxy and says so). Not silent tolerance of the Bash bypass.

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-26-1` (each detector induced on a seeded store; the
predicate fires only on the enumerated forms and only on a same-turn target
match; `status` text carries the coverage bound). Acceptance replay
`T-38-6` (AC-9 deny classes) at Checkpoint 4.

**Impact if wrong.** Diagnostic-only — a broken detector degrades
observability; caught by `T-26-1` and `T-38-6`.

---

### Step 27 — Question lifetime across session boundaries + the AC-8a line

```step-decl
step: S27
covers: [PA-2]
files:
  create: [middleware/context-oracle/ctxoracle/test/unit/question_lifetime.test.ts, middleware/context-oracle/ctxoracle/test/unit/stop_outstanding_line.test.ts]
  modify: [middleware/context-oracle/ctxoracle/src/blocks/answer_drift.ts]
  delete: []
provides: []
tests: [T-27-1, T-27-2, T-38-7, T-38-8, T-38-9]
depends_on: [S1, S18, S22, S25]
```


**What changes.** In `answer_drift.ts` add `handleSessionStart(store,
diagnosticsDir, consumer, source)` per V5's enumeration: `startup`/`clear`
→ `expireOnStartup` (prior `open` rows → `expired`), bookmark reset to
null; `resume`/`fork`/`compact` → bookmark reset to offset 0 so the next
catch-up rebuilds qa-state from the transcript; when that rebuild scans a
non-empty transcript, recognizes zero human turns, and emitted
`unrecognized_user_entry` diagnostics, raise `rebuild_recovered_nothing`
(L11(a)'s loud failure). qa-state is untouched at `SessionEnd`.

Add `outstandingQuestionLine(store, consumer, doneClaimFired): string |
null` (`AC-8a`): at a `Stop` where the done-claim recognizer (Step 18)
fired AND `getOpenQuestions` is non-empty, return the line naming the open
questions for the composer to append to the Stop-time whisper — delivery,
not a block. Add the `FR-M4` counter: a done-claim reached with a question
still `open`, or closed only by `generic_text_all_prior` within the final
`qa.done_claim_trailing_turns_k` assistant turns, is recorded in
`session_log.detail_json` (AD-9's labelled approximation, both error
directions stated in `status`).

**Creates.** Nothing new (this step modifies or verifies earlier artifacts).

**Source.** `AD-9` (question lifetime by `SessionStart.source`;
`rebuild_recovered_nothing`; the Stop-time backstop and its counter);
`AC-8a`; `D-20`; V5.

**Why this approach (Gate 3):**
1. **The decision.** Session boundaries handled per V5's enumeration;
   `SessionEnd` expires nothing; the Stop-time line is appended only when
   both conservative recognizers fire; the counter records the case the
   line may miss.
2. **The authoritative standard.** `AD-9`; `D-20`; V5; `FR-B4` (delivery,
   not enforcement).
3. **Why this standard applies here.** The `resume`/`fork`/`compact`
   distinction is what makes the conversation-continues semantic correct:
   state rebuilt from offset 0 mirrors the fresh classification Phase B's
   writer will do, so the seam holds; the counter is the owner-facing
   signal that makes "Max re-asks" reachable (FR-B4).
4. **What this is NOT — and why.** Not a per-source silent policy (would
   hide `rebuild_recovered_nothing`). Not a Stop-time block (`FR-B4`).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-27-1` (the five `source` values on a seeded store and
two transcript fixtures; `rebuild_recovered_nothing` on the marker-less
one), `T-27-2` (the line appears only when both recognizers fire; the
counter records the two labelled cases). Acceptance replays `T-38-7`–`T-38-9`
at Checkpoint 4.

**Impact if wrong.** Under-fire — a `resume` that misses a still-open
question silently drops it; guarded by `rebuild_recovered_nothing` and the
Step 39 marker-presence verification.

---
### Step 28 — Hook adapter, handler pipeline, CLI entry (`hook` verb), replay harness

```step-decl
step: S28
covers: [PA-4, PA-10, PA-11]
files:
  create: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts, middleware/context-oracle/ctxoracle/src/cli/hook.ts, middleware/context-oracle/ctxoracle/src/cli/index.ts, middleware/context-oracle/ctxoracle/src/cli/integrity_check.ts, middleware/context-oracle/ctxoracle/test/replay/integrity_check_verb.test.ts, middleware/context-oracle/ctxoracle/src/hook/adapter.ts, middleware/context-oracle/ctxoracle/src/hook/handler.ts, middleware/context-oracle/ctxoracle/test/replay/runner.ts, middleware/context-oracle/ctxoracle/test/replay/pipeline_order.test.ts, middleware/context-oracle/ctxoracle/test/conventions/hook_field_names_isolated.test.ts, middleware/context-oracle/ctxoracle/test/replay/fail_open.test.ts, middleware/context-oracle/ctxoracle/test/replay/produced_but_undelivered.test.ts, middleware/context-oracle/ctxoracle/test/replay/liveness_row.test.ts]
  modify: [.github/workflows/context-oracle-ctxoracle.yml]
  delete: []
provides: [ctxoracle-hook, hook-integrity-check, ctxoracle-index, toInternalEvent, toHookResponse]
tests: [T-28-1, T-28-2, T-28-3, T-28-4, T-28-5, T-28-6]
depends_on: [S1, S3, S6, S9, S10, S14, S15, S16, S17, S18, S19, S20, S24, S25, S26, S27]
```


**What changes.** Create `src/hook/adapter.ts` — the ONLY file that names
Claude Code hook field names (`hook_event_name`, `session_id`, `agent_id`,
`agent_type`, `tool_name`, `tool_input`, `tool_response`, `error`,
`transcript_path`, `agent_transcript_path`, `prompt`, `source`,
`last_assistant_message`, `stop_hook_active`, `cwd`) and the response field
names (`hookSpecificOutput`, `hookEventName`, `additionalContext`,
`permissionDecision`, `permissionDecisionReason`). Exports
`toInternalEvent(hookJson): InternalEvent` (Step 6's type) and
`toHookResponse(internal: InternalResponse): HookResponse` (Step 24's
type), where `InternalResponse = { deny: DenyVerdict } | { context: string }
| {}` — the adapter maps a `DenyVerdict` to `permissionDecision: "deny"` +
`permissionDecisionReason`, and a Step 20 `StopDelivery` or a whisper text
to `additionalContext`; no other module names a wire field. The convention
test `T-28-2` scans `dist/src/**` outside `adapter.js` for the identifiers
that are unambiguous wire names — `hook_event_name`, `session_id`,
`agent_id`, `agent_type`, `tool_name`, `tool_input`, `tool_response`,
`agent_transcript_path`, `last_assistant_message`, `stop_hook_active`,
`transcript_path`, `hookSpecificOutput`, `hookEventName`,
`permissionDecision`, `permissionDecisionReason`, `additionalContext` —
and not for `error`, `prompt`, `source`, or `cwd`, which are ordinary
identifiers other modules legitimately use (Step 6's `InternalEvent`
carries them as `errorText`, `promptText`, `startSource`, `workingDir`,
and the liveness row's detail keys are `transcriptPath` /
`transcriptBytes`).

Create `src/cli/dispatch.ts` — the `bin` entry (`#!/usr/bin/env node`; a
manual verb switch, no argument-parsing dependency) with, at this step, the
single undocumented internal verb `hook <event> [--deadline-ms <n>]` →
`src/cli/hook.ts` → the handler: stdin JSON in, response JSON out, exit 0
always. Later steps register their verbs in the same switch, each declaring
the edit under `modify:`;
`--deadline-ms` overrides the watchdog deadline (Step 29) and exists for the
replay harness only — `init` never writes it, and no environment variable
can set it.

Create `test/replay/runner.ts` — the replay harness: reads a hook JSON
stream from `test/replay/hook_stream_fixtures/<name>.jsonl` (one file per
replaying test, authored with that test), spawns `node
dist/src/cli/dispatch.js hook <event>` per event with `CTXORACLE_HOME`
pointed at a temp home and `CTXORACLE_INTERNAL` unset, controls the
transcript file the stream's `transcript_path` names (appending entries
between events when a test says so), records each response, and exposes
assertion helpers over responses, stores, and diagnostics. From this step
on, every `test/replay/*.test.ts` a later step's Verification names is
runnable at that step, and this step adds `npm test -- --replay` to Step
1's `test` CI job.

Create `src/hook/handler.ts` — the per-event pipeline in AD-8's fixed order:
1. Guard (`CTXORACLE_INTERNAL` set → exit 0; Step 10's `isInternal`).
2. Watchdog start (Step 10's `createDeadline`; the check placements per
   AD-23's inventory are verified by Step 29).
3. Parse stdin JSON → `adapter.toInternalEvent`; derive consumer key
   `(session_id, agent_id | 'main')`; open the project store.
4. `SessionStart`: a **liveness row** (`session_log` `event_type =
   'liveness'`, `detail_json` = `{transcriptPath, transcriptBytes}`) —
   AD-17's `hooks_not_firing` input, read by `status` (Step 33); dedup
   reconciliation (Step 20); qa lifetime (Step 27); staleness check →
   `index_stale` (Step 14's `refreshIfStale`) and, when it reports stale, a
   detached reindex child — `<node> <dispatch.js> index`, this step's
   `index` verb (`src/cli/index.ts`: `index [--full]` → `runIndex` (Step 14)
   with Step 15's `defaultFrontends()`; `--full` re-mines from scratch),
   spawned through Step 5's wrapper and
   observable by the `.reindex.lock` `runIndex` takes; detached integrity
   child (`hook integrity-check`, this step's other internal verb, via the
   wrapper); no output.
5. Question intake (`UserPromptSubmit` only; Step 25).
6. Transcript catch-up (Step 25) + health detectors on classified turns
   (Step 26).
7. Block check (`PreToolUse`, main consumer only; Step 25): on a verdict →
   `adapter.toHookResponse({deny: verdict})`, diagnostics, exit 0.
8. `PostToolUse` / `PostToolUseFailure`: `observed_actions` append (`ok` /
   `failed` per V19; `command_class` for Bash rows, Step 17; the path-write
   predicate sets `path`), read-set update (Step 20), bypass diagnostic
   (Step 26).
9. Candidate generation (the Step 18 generators whose `triggerEvents`
   include this event) → bar (Step 16) → dedup (Step 20) → compose (Step
   19) → audit-log-then-emit: `whisper_audit.append` must succeed before
   the response is written; on audit failure nothing is emitted; when the
   append succeeded and the write of the response to stdout throws
   (`EPIPE`, serialization error), the handler records
   `produced_but_undelivered` (AD-17) with the audit id and exits 0.
   At `Stop`/`SubagentStop`: done-claim recognizer (Step 18), Completeness +
   Verification candidates, the outstanding-question line (Step 27),
   delivered through `deliverStop` honoring `stop_hook_active` (Step 20).
10. `SessionEnd`: finalize the session diagnostics row. (The `whisper_stats`
    fold and the regret proxy are added to this branch by the step that
    creates them, which declares the edit.)
11. Diagnostics row (Step 10). Exit 0 always (AD-7); any error or watchdog
    fire ⇒ empty output + JSONL fault, no deny, no whisper.

Create `test/conventions/hook_field_names_isolated.test.ts` (built-output
grep over `dist/src/**` outside `dist/src/hook/adapter.js` for every
identifier in the convention list above; no match permitted — Step 24's
`hook_response.ts` is type-only and Step 20's `deliverStop` returns an
internal object, so a clean build has none).

Also create `src/cli/integrity_check.ts`: the undocumented internal verb
`hook integrity-check` — runs `Store.integrityCheck()` (`PRAGMA quick_check`,
Step 3) on the project store off the event path, recording `store_corrupt`
on failure; it is the detached child the `SessionStart` branch above spawns
through Step 5's wrapper, and the off-path check the `init` and `index` verbs
(Steps 31, 32) run (AD-17).

**Creates.** `src/cli/dispatch.ts` — verb dispatcher (bin entry: dist/src/cli/dispatch.js); verbs registered by Steps 28, 31–35; `src/cli/hook.ts` — internal `hook <event> [--deadline-ms n]` verb (routes to handler); `src/cli/index.ts` — `index [--full]` verb → runIndex (Step 14) with Step 15's defaultFrontends(), the reindex child the handler spawns; `src/cli/integrity_check.ts` — internal `hook integrity-check` verb (off-path quick_check); `src/hook/adapter.ts` — the ONE file naming Claude Code hook fields (AD-6); `src/hook/handler.ts` — per-event pipeline (AD-7, AD-8); `test/replay/runner.ts` — replay harness (spawns the built handler through the CLI).

**Source.** `AD-6` (event map, adapter file, `PostToolUseFailure`
observation-only); `AD-7` (fail-open, exit 0 always); `AD-8` (pipeline
order load-bearing); `AD-4` (the consumer filter on `observed_actions`);
V1–V6, V15, V16, V19.

**Why this approach (Gate 3):**
1. **The decision.** One adapter file; fixed pipeline order; exit 0 always;
   adapter output is the internal event type — all downstream code names
   internal fields only.
2. **The authoritative standard.** `AD-6`, `AD-7`, `AD-8`; the hooks
   reference re-read 2026-09-07 (the input fields above are the documented
   set — §11.4).
3. **Why this standard applies here.** The adapter file is what makes a
   hooks-contract adaptation a single-file change (the contract drifted
   between 2026-08-29 and 2026-09-07 on timeout semantics — §4 — which is
   exactly the class AD-6 anticipates). The pipeline order is the
   difference between a deny reading fresh state and stale state.
4. **What this is NOT — and why.** Not async pipeline steps (loses the
   audit-before-emit guarantee if a crash lands between emit and audit
   write). Not multi-file field naming. Not error output to stderr (AD-7:
   fail silent toward the agent, loud toward the owner via diagnostics).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-28-1` (replay: a transcript already containing a
clearing answer at `PreToolUse` time yields no deny — catch-up ran before
the block check), `T-28-2` (adapter isolation convention), `T-28-3` (replay:
forced store-open failure, parse failure, and a corrupted store each yield
exit 0, empty stdout, a JSONL fault), `T-28-4` (replay: audit row written,
stdout closed → `produced_but_undelivered` recorded, exit 0), `T-28-5` (the
liveness row is written at `SessionStart` with the transcript path and
size), `T-28-6` (`hook integrity-check` records `store_corrupt` on a
truncated store and nothing on a healthy one). **Checkpoint 3** runs here: every function-level test of Steps
21–28 and the replay tests above, the first replays through the built
binary.

**Impact if wrong.** Systemic — every hook event goes through the handler;
ordering bugs directly affect deny correctness. Caught by `T-28-1` and the
AC-2a replays.

---

### Step 29 — Watchdog + recursion-guard verification through the built handler

```step-decl
step: S29
covers: [PA-9]
files:
  create: [middleware/context-oracle/ctxoracle/test/replay/watchdog.test.ts, middleware/context-oracle/ctxoracle/test/replay/recursion_guard.test.ts, middleware/context-oracle/ctxoracle/test/fixtures/generate_large_store.ts]
  modify: []
  delete: []
provides: []
tests: [T-29-1, T-29-2]
depends_on: [S1, S6, S28]
```


**What changes.** Nothing new in `src/`. Create
`test/fixtures/generate_large_store.ts`: builds the `large-store` *store*
(not a repository; D-plan-5) through the real migrations (Step 7) and DAOs (Step 9)
— ≈400 MB of the AD-23/V8 class, ≈2 M `cochange_pairs` rows and ≈1 M
`symbols` rows, the population that made one statement take 543 ms in V8
— into the test's temp home, once per run directory and cached there by
the generator's content hash; on CI, where no run directory survives, it
is rebuilt per job and its build time is measured and printed by
`T-29-1`'s run in the replay tier (the number is stated in the exit report,
not assumed here). This
step verifies, through the built handler, the two Step 10 modules the
Step 28 pipeline placed first
(`isInternal` before any store is opened; `createDeadline` started before
parse). `deadline.check()` is called between bounded work slices per
AD-23's inventory (after parse, after each transcript slice, after
catch-up, before candidate generation, between genres, before compose,
before the audit write); `ms` is the wired default or the `--deadline-ms`
override Step 28's `hook` verb passes through. On deadline fire: record
`latency_breach`, return empty output. Every handler run self-measures wall
time into the diagnostics row; `status` reports p50/p95/max per event type
against `NF-1`. The guard: `CTXORACLE_INTERNAL=1` → print nothing, exit 0,
no store write. The two replay tests below are the evidence that the
placement holds on a real stream and on the largest fixture store.

**Source.** `AD-23` (cooperative watchdog + the blocking-call inventory;
`NF-1`; `FR-O3`); `AD-21` (the guard check as the handler's first act;
`FR-J4`); V6 as amended by the §4 entry.

**Why this approach (Gate 3):**
1. **The decision.** Cooperative deadline with the explicit inventory of
   bounded calls; the guard check before any work; the wired `"timeout": 5`
   (Step 31) keeps the harness deadline above the internal one.
2. **The authoritative standard.** `AD-23`; `NF-1` (p95 ≤ 1.5 s, ceiling
   3 s); `FR-O3` (fail open *with a diagnostic*); the hooks reference
   2026-09-07 (a timed-out command hook's output is discarded and the tool
   call continues — §4, §11.4).
3. **Why this standard applies here.** A JS timer cannot preempt a blocked
   event loop; only the cooperative discipline plus the inventory delivers
   the deadline. With the harness now discarding a timed-out hook, the
   watchdog is what turns "silently discarded at 5 s" into "silent at 2.5 s
   with a `latency_breach` the owner can see" (`OL-10`) — and what keeps
   the whisper path inside `NF-1`. The guard first is what makes a future
   model piggyback safe.
4. **What this is NOT — and why.** Not `setTimeout` + `process.exit` (the
   timer never fires on a blocked loop). Not harness-timeout-only (no
   diagnostic, and the whisper is lost). Not a lower wired timeout (1–2 s):
   the harness would discard the output before the internal deadline
   writes its diagnostic.

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-29-1` (replay: `--deadline-ms 1` trips the deadline
on a real stream — no deny/whisper emitted, `latency_breach` recorded, exit
0; the default deadline on the `large-store` fixture never exceeds the wired
5 s, with p95 reported against NF-1), `T-29-2` (replay: `CTXORACLE_INTERNAL=1`
→ exit 0, empty stdout, no store write).

**Impact if wrong.** Systemic — a broken watchdog loses whispers and
diagnostics at the harness timeout; caught by `T-29-1`.

---

### Step 30 — SessionEnd: `whisper_stats` fold + regret proxy

```step-decl
step: S30
covers: [PA-5]
files:
  create: [middleware/context-oracle/ctxoracle/src/diag/regret.ts, middleware/context-oracle/ctxoracle/src/diag/whisper_stats_fold.ts, middleware/context-oracle/ctxoracle/test/replay/regret_proxy.test.ts, middleware/context-oracle/ctxoracle/test/unit/whisper_stats_fold.test.ts]
  modify: [middleware/context-oracle/ctxoracle/src/hook/handler.ts, middleware/context-oracle/ctxoracle/src/index/indexer.ts]
  delete: []
provides: [foldWhisperStats, recordRegret]
tests: [T-30-1, T-30-2]
depends_on: [S1, S9, S14, S28]
```


**What changes.** Create `src/diag/whisper_stats_fold.ts` exporting
`foldWhisperStats(globalStore, projectStore, repoKey)`: inside a single
`BEGIN IMMEDIATE` transaction on the global store, reads
`global_meta.whisper_stats_watermark:<repoKey>`, aggregates the project
store's `whisper_audit` rows (`sent` per genre) and `corrections` rows
(`corrected_false`, `corrected_missed`) newer than the watermark, upserts
`whisper_stats`, and advances only that project's watermark (AD-5, AD-26).
Run points: `SessionEnd` — this step adds the call to the handler's
`SessionEnd` branch (`src/hook/handler.ts`, Step 28; declared under
`modify:`) — and the `correct` verb, whose step calls it (Step 34); never
on tool events.

Create `src/diag/regret.ts` exporting `recordRegret(store, session)`: the
population is every **store-held fact** — `cochange_pairs` rows,
`landmines`, `human_facts`, and `invariant_members` — whose subject file or
direct pair partner was **re-edited** — a second `outcome='ok'` Edit/Write
row on the same path in the session after the first (for a pair fact: an
edit of the partner after an edit of the subject) — or **reverted** — the
path's post-write `content_hash` (Step 7) equals a hash the path held
earlier in the session (a first edit alone is the decision moment, not
evidence the decision was wrong; the cross-session case is the miner's
`revert_chain` class, Step 13) — or whose covering
test failed (`outcome='failed'` `command_class`-1 rows), minus the subjects
`whisper_audit.deliveredSubjects(session)` shows were spoken (FR-L4: "below-
bar, **or never triggered**" — a fact no generator ever produced a candidate
for is in the population; AD-18's relevance test is the subject / direct-
partner bound). A regret row names the fact, the churn, and whether a
candidate existed (`held_below_bar`, `held_dedup`, `never_triggered`) so
`status` can show the split. This step adds the two call sites: the
handler's `SessionEnd` branch (`src/hook/handler.ts`, Step 28) and the end
of `runIndex` (`src/index/indexer.ts`, Step 14) so a between-session revert
is caught; both files are declared under `modify:`. The rate is rendered by `status` under
its mandated label, with the note that the designed silence at a
run-and-failed done-claim is self-counted here (AD-18).

**Creates.** `src/diag/regret.ts` — regret proxy (FR-L4, AD-18); `src/diag/whisper_stats_fold.ts` — SessionEnd fold (AD-5, AD-26).

**Source.** `AD-5` (per-project watermarked fold; run points); `AD-26`
(single `BEGIN IMMEDIATE`); `AD-18` (regret proxy, outcome semantics of its
two reads); `AD-4` (consumer filter); `FR-L4`, `D-36`, `AC-24`.

**Why this approach (Gate 3):**
1. **The decision.** Fold and watermark advance in one immediate
   transaction so concurrent same-project folds serialize; regret is a
   deterministic proxy bounded to subject / direct partner in Phase A.
2. **The authoritative standard.** `AD-5`, `AD-26`, `AD-18`; `FR-L4`
   (existence required, proxy the architect's); `D-36`.
3. **Why this standard applies here.** Without regret the loop converges to
   silence and reads healthy; the watermark transaction is what keeps the
   efficacy counts from double-counting under AD-26's concurrent handlers.
4. **What this is NOT — and why.** Not an uptake judge (`D-12`). Not
   automated demotion input (Phase C). Not coverage measurement (AC-18's
   seeded coverage). Not a fold on tool events (AD-5 forbids; AD-23's
   inventory).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-30-1` (replay on `regret-true-positive` and
`regret-no-inflate`: a regret row for the relevant churn — including a
never-triggered fact — none for the unrelated churn — AC-24), `T-30-2` (two concurrent same-project folds do not
double-count; a post-session correction reaches `whisper_stats` — AC-23's
efficacy clause).

**Impact if wrong.** Silent metric drift — under-reports (the
silence-is-fine surface returns) or over-reports (diagnostic noise,
non-gating per `FR-L4`); double-counted efficacy stats. Caught by `T-30-1`,
`T-30-2`.

---

### Step 31 — CLI dispatch + `init` verb

```step-decl
step: S31
covers: [PA-11]
files:
  create: [middleware/context-oracle/ctxoracle/src/cli/init.ts, middleware/context-oracle/ctxoracle/test/replay/init_fresh.test.ts, middleware/context-oracle/ctxoracle/test/replay/init_idempotent.test.ts, middleware/context-oracle/ctxoracle/test/replay/init_keying_change.test.ts]
  modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]
  delete: []
provides: [ctxoracle-init]
tests: [T-31-1, T-31-2, T-31-3]
depends_on: [S1, S2, S3, S4, S5, S7, S8, S12, S14, S15, S28]
```


**What changes.** Register the `init` verb in Step 28's `dispatch.ts`
switch. Create `src/cli/init.ts`:
1. `assertRuntime()` (Step 2); open the stores (Step 3) and `probeFts5`;
   on a failed runtime check print a plain-language error and exit 1; on a
   failed probe record `schema_meta.fts_state = 'fallback'` before the
   migrations run, so `applyMigrations(store, {fts: false})` skips the FTS
   migration and the `LIKE` path is what `search.ts` uses; the summary
   names the state.
2. `resolveRepoKey` (Step 5). Keying-mode change detection: compute the
   identity and key under **every** rule that applies to this checkout
   (`commit` when the history is full, `url` when a remote exists, `path`
   always) and look for an existing store at each derived key; if one
   exists under a mode other than the resolved one, print the
   plain-language warning AD-20 specifies (naming both keys and modes) and
   offer the `export`/`import` migration before proceeding.
3. `ensureLayout` (Step 4); `applyMigrations` for the project store (001,
   001b when `fts_state` is `'fts5'`) and the global store (002) (Steps 7,
   8); `seedDefaults` (Step 12).
4. Write hook entries into `<repoPath>/.claude/settings.json` for the eight
   AD-6 events: each entry `{ "type": "command", "command": "\"<node>\"
   \"<dispatch>\" hook <event>", "timeout": 5 }` where `<node>` is
   `process.execPath` and `<dispatch>` is
   `fs.realpathSync(process.argv[1])` — the real path of
   `dist/src/cli/dispatch.js` under every sanctioned install mode: direct
   `node`, the `npm install -g` shim, and `npx` all resolve to it (executed
   2026-09-07 in the layout reproduction — §11.4); both paths are quoted so
   a space in either survives the shell. The pin is a liability the plan
   owns: an interpreter upgrade that removes `<node>` makes every hook exit
   127 with no liveness row ever written, so `init` records the pin as
   `schema_meta.pinned_interpreter`, prints it in its summary, and `status`
   reads that key and re-checks the path's existence beside the totally-dead
   detector (Step 33, D-plan-25). **The marker is the command
   itself**: an entry belongs to the oracle iff its `command` matches
   `/[\\/]dist[\\/]src[\\/]cli[\\/]dispatch\.js"? hook <event>$/`
   (the package's own entry file plus the verb; the path prefix is free so
   an install-path change still matches). `init` prints the command it
   wrote, so an `npx`-mode install (whose real path is inside the npm
   cache) is visible to the owner. File mechanics: if `.claude/` or
   `settings.json` does not exist, `init` creates it (`{}` before editing)
   and records `claude_dir_created_by_init` / `settings_created_by_init` =
   `1` in `schema_meta` so `deinit` can remove exactly what `init` created;
   an existing file is parsed, edited, and re-serialized with its detected
   indentation (2-space default) and its trailing-newline state preserved,
   key order untouched. Idempotent: an existing matching entry is left in
   place (its `timeout` repaired to 5 if it differs), a missing one is
   appended, unrelated entries are never touched. Only the documented entry
   fields are written (§11.4: the hooks reference lists the entry fields and
   makes no promise about unknown ones).
5. `runIndex(store, repoPath, {full: true, frontends: defaultFrontends()})`
   (Steps 14, 15) — the first index — and the off-path `quick_check`
   (Step 3).
6. Print the plain-language summary: repo key, keying mode and identity
   string, FTS5 state, files indexed, commits mined, tables ready.

**Creates.** `src/cli/init.ts`.

**Source.** `AD-20` (init: environment checks, key derivation with mode
display, plain-language on re-init keying-mode change, hook wiring "with a
`ctxoracle` marker on each entry", first index); `AD-6` (event map,
`.claude/settings.json`, `"timeout": 5`); `D-9` (init is the one in-tree
write); `AC-7`.

**Why this approach (Gate 3):**
1. **The decision.** Idempotent init; the command is the interpreter plus
   the real path of the package's entry file, and the marker is that
   documented `command` field matched by pattern, not an extra field;
   `init` records what it created so `deinit` removes exactly that;
   keying-mode change surfaces in plain language before it orphans a store.
2. **The authoritative standard.** `AD-20`; `D-9`; the hooks reference
   2026-09-07 (documented entry fields; no statement that unknown fields are
   tolerated — §11.4).
3. **Why this standard applies here.** A non-programmer owner (`OL-11`)
   needs plain language on every failure and every destructive change;
   idempotency lets a re-run repair wiring without side-effects; keeping
   the marker inside a documented field means a future strictly-validating
   harness cannot reject the file `init` writes — and `init` is a direct
   writer the AD-6 adapter cannot shield.
4. **What this is NOT — and why.** Not an extra `comment`/marker field
   (undocumented tolerance of a contract that has already drifted once
   this month). Not exact-command-string matching (breaks on a legitimate
   install-path change). Not a matcher-field tag (the matcher is
   behavioural). Not a wizard (`P3`). Not blocking on missing FTS5 (AD-2's
   announced fallback).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-31-1` (fresh `pristine-tree` repo with and without a
pre-existing `.claude/settings.json`: eight entries matching the pattern
land, each `command` names the real `dispatch.js` under direct-`node`,
shim, and `npx` invocation; stores at 0700; first index and mining run;
summary printed), `T-31-2` (re-init after deleting one entry restores
exactly that entry; a canonical 2-space file is otherwise byte-identical),
`T-31-3` (a shallow fixture unshallowed between runs: the keying-mode
warning names both keys before proceeding).

**Impact if wrong.** Owner-facing — a broken init blocks all use. Loud
failures are acceptable; the silent risks (wrong key, orphaned store) are
what `T-31-3` and the identity-string display guard.

---

### Step 32 — `deinit`, `export`, `import` verbs

```step-decl
step: S32
covers: [PA-11]
files:
  create: [middleware/context-oracle/ctxoracle/src/cli/deinit.ts, middleware/context-oracle/ctxoracle/src/cli/export.ts, middleware/context-oracle/ctxoracle/src/cli/import.ts, middleware/context-oracle/ctxoracle/test/replay/deinit_marker.test.ts, middleware/context-oracle/ctxoracle/test/replay/export_roundtrip.test.ts, middleware/context-oracle/ctxoracle/test/conventions/no_network_modules.test.ts]
  modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]
  delete: []
provides: [ctxoracle-deinit, ctxoracle-export, ctxoracle-import]
tests: [T-32-1, T-32-2, T-32-3]
depends_on: [S1, S3, S14, S28, S31]
```


**What changes.**
- `src/cli/deinit.ts`: removes every hook entry whose `command` matches the
  Step 31 pattern for any of the eight events; leaves unrelated entries and
  the rest of the file untouched (same re-serialization rules as `init`);
  prunes each event array it emptied and the `hooks` object when it
  becomes empty; when `schema_meta` records that `init` created
  `settings.json` and the pruned document equals `{}`, removes the file,
  and likewise the `.claude/` directory it created when empty; with
  `--purge` deletes the project store and its diagnostics directory.
- `src/cli/export.ts` / `src/cli/import.ts`: `export <dir>` writes
  `<dir>/project.db` and `<dir>/global.db` via `Store.exportTo` (`VACUUM
  INTO`, Step 3); `import <dir>` copies them into the layout paths after a
  `quick_check` of each file, refusing to overwrite a non-empty store
  without `--replace`. No network path exists in either verb (`FR-X7`),
  and none exists anywhere in Phase A: `test/conventions/no_network_modules.test.ts`
  is an import scan over `dist/src/**` asserting that no module imports
  `http`, `https`, `http2`, `net`, `tls`, `dgram` (either specifier
  spelling) or `undici`, and that none of the tokens `fetch(`, `fetch (`,
  `globalThis.fetch`, `.fetch` appears — the
  structural form of AC-19's and AC-11's no-egress clauses (`T-32-3`). The
  runtime form (`T-32-2`) executes the verbs inside a network namespace with
  no interfaces (`unshare -rn` — available in this sandbox, §11.4, and
  **refused on the `ubuntu-24.04` GitHub runner**, which forbids the
  unprivileged user namespace: `write failed /proc/self/uid_map: Operation
  not permitted`, observed 2026-09-07 in the plan's own CI job, §11.4) and
  asserts they still succeed; on a host without `unshare`, or one that
  refuses it, that leg reports itself as not executed with the reason and
  `T-32-3` remains the
  asserted property.

**Creates.** `src/cli/deinit.ts`; `src/cli/export.ts` — VACUUM INTO; `src/cli/import.ts`.

**Source.** `AD-20` (verbs); `AD-5` (export/import via `VACUUM INTO`,
record-identical per AC-19); `AD-12`/`AD-13` (index runs both indexer and
miner); SQLite `VACUUM` documentation (2026-09-07, §11.4).

**Why this approach (Gate 3):**
1. **The decision.** `VACUUM INTO` per store into a user-named directory;
   record-identical round-trip is the AC-19 assertion; deinit matches the
   same command pattern init writes.
2. **The authoritative standard.** `AD-5`; `AC-19`; V17 re-executed
   2026-09-07 (`VACUUM INTO` round-trips rows on this runtime); the SQLite
   documentation (VACUUM "rebuilds the database file, repacking it" and
   "may change the ROWIDs of entries in any tables that do not have an
   explicit INTEGER PRIMARY KEY") — which is why the assertion is
   record-level, never byte-level.
3. **Why this standard applies here.** `FR-K9` requires the round-trip;
   AC-19 says record-identical; the engine-level copy has no dependence on
   the runtime floor.
4. **What this is NOT — and why.** Not the `sqlite.backup()` API (exists from
   v22.16.0 — the floor — but the engine-level path keeps export
   independent of the floor). Not a JSON export (loses STRICT constraints
   on import). Not a byte-compare in the test (the documentation says the
   copy is rebuilt).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-32-1` (deinit removes exactly the matching entries,
removes a `settings.json` and `.claude/` that `init` created, keeps a
pre-existing one; `--purge` removes the store; the AC-7 tree diff is empty
afterwards), `T-32-2` (AC-19: canonical-order per-table dump before and
after the round-trip is identical; the verbs succeed with no network
namespace), `T-32-3` (no network module and none of the `fetch` tokens
anywhere in `dist/src/**`).

**Impact if wrong.** Owner recovery is the main risk on export/import —
mitigated by `T-32-2`'s record-identical check.

---

### Step 33 — `status`, `log`, `tune` verbs

```step-decl
step: S33
covers: [PA-5, PA-11]
files:
  create: [middleware/context-oracle/ctxoracle/src/cli/status.ts, middleware/context-oracle/ctxoracle/src/cli/log.ts, middleware/context-oracle/ctxoracle/src/cli/tune.ts, middleware/context-oracle/ctxoracle/src/diag/status.ts, middleware/context-oracle/ctxoracle/src/diag/log.ts, middleware/context-oracle/ctxoracle/test/replay/status_renders_all.test.ts, middleware/context-oracle/ctxoracle/test/replay/log_readback.test.ts, middleware/context-oracle/ctxoracle/test/replay/tune_roundtrip.test.ts, middleware/context-oracle/ctxoracle/test/replay/hooks_not_firing.test.ts]
  modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]
  delete: []
provides: [ctxoracle-status, ctxoracle-log, ctxoracle-tune]
tests: [T-33-1, T-33-2, T-33-3, T-33-4]
depends_on: [S1, S2, S4, S5, S9, S10, S12, S26, S28, S30]
```


**What changes.**
- `src/diag/status.ts` + `src/cli/status.ts`: `FR-M4` renderer — plain
  language: runtime check (Step 2), repo key + keying mode + identity
  string (Step 5), loose-mode directories (Step 4), FTS5 state, index
  head/staleness, invariant count (L10), per-genre volume, false-fire rate
  (from `corrections`), regret rate **labelled "held-but-unspoken only" and
  paired with the last seeded-coverage result or "coverage not measured
  live"** (AD-17, AC-18), denies issued, wrongful-deny rate (`false_fire`
  corrections on denies + `deny_after_answer_lag` + `deny_despite_answer_text`
  + voided-intake rows with a deny fired), done-claims-with-outstanding-
  question with its Phase A structural-limit label, `deny_loop` and
  `deny_bypass_suspect` counts **with the bypass predicate's coverage bound
  printed beside the count** (Step 26), active suppressing conditions (store
  corrupt, transcript layout changed, FTS fallback, store busy), the
  `hooks_not_firing` detector (AD-17: for every session with a liveness row
  and no `SessionEnd` row, if the transcript file the row names has an
  mtime later than the session's last `session_log` event by more than
  `diag.hooks_not_firing_gap_s`, record `hooks_not_firing` for that session
  and flag it — detected at this invocation, never by a timer) **and its
  totally-dead half** (AD-17, L7 — "liveness rows go stale": transcripts
  in the directory `projectTranscriptDir(cwd)` returns (Step 21's
  `locate.ts`, the one module that knows the layout) newer than the newest
  liveness row — or present when no liveness row exists at all — by more
  than the gap ⇒ `hooks_not_firing` with detail "no session started the
  hooks"; when that directory does not exist, `status` prints "no
  transcript directory found for this repository" so a changed layout is
  visible rather than silent; run at `status`, `init`, and `index`,
  D-plan-25),
  the pinned interpreter `init` recorded in `schema_meta.pinned_interpreter`
  and whether that path still exists (a Node upgrade that removed it is
  named, never silent — OL-10), latency
  p50/p95/max per event type, every `plan_seed` tuning value in force (Step
  12), the correct-silence announcement (`FR-M3`, owner-facing only — never
  injected into the agent's context, `D-22`), and the two reserved codes
  rendered "not yet measured (Phase B)" / "not yet measured (Phase C)" —
  **never** as 0.
- `src/diag/log.ts` + `src/cli/log.ts`: `log [--session <id>]` — the
  `whisper_audit` rows in order with evidence and pointers, the
  done-claim counter's questions from `session_log.detail_json`.
- `src/cli/tune.ts`: `tune <key> <value>` for scalars, `tune <key> +<v>` /
  `-<v>` for list keys, `tune` alone lists keys, current values (list keys
  show members), sources, and defaults.

**Creates.** `src/cli/status.ts` — renders diag/status.ts; `src/cli/log.ts` — renders diag/log.ts; `src/cli/tune.ts`; `src/diag/status.ts` — status renderer (FR-M4); `src/diag/log.ts` — log renderer (FR-M5).

**Source.** `AD-17` (three surfaces; the "never display absence of
measurement as health" rule; correct silence rendered only here per
`D-22`); `AD-20` (verbs, plain language, `tune` semantics); `AD-9` (the
counters' labels); `FR-M3`, `FR-M4`, `FR-M5`.

**Why this approach (Gate 3):**
1. **The decision.** All owner metrics rendered in plain language; every
   phase-deferred metric rendered "not yet measured"; every suppressing
   condition and every plan-seeded value surfaced.
2. **The authoritative standard.** `AD-17`; `OL-10`; `OL-11`.
3. **Why this standard applies here.** "Never display absence of
   measurement as health" is what stops the owner from reading a reserved
   0 as safety; printing the seeds and the bypass bound is what lets the
   exit report's numbers be read as conditional, not absolute.
4. **What this is NOT — and why.** Not a JSON dump (non-programmer owner).
   Not raw numbers without labels (regret without its label is exactly the
   miss AD-17 guards against).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-33-1` (every FR-M4 signal listed above appears; the
reserved codes render as "not yet measured"; the seeds and the bypass bound
are printed), `T-33-2` (`log` renders every audit row with evidence and
pointers), `T-33-3` (`tune` round-trips scalar and list values and lists
sources), `T-33-4` (`hooks_not_firing` induced: a liveness row, a transcript
grown past the gap with no events, `status` flags the session; the same
session with a recent event is not flagged).

**Impact if wrong.** Owner-blind — a broken `status` is exactly the failure
`OL-10` was raised to prevent. Caught by `T-33-1`.

---

### Step 34 — `correct` verb + `--missed-question` routing

```step-decl
step: S34
covers: [PA-7, PA-11]
files:
  create: [middleware/context-oracle/ctxoracle/src/cli/correct.ts, middleware/context-oracle/ctxoracle/test/replay/correct_verdict.test.ts, middleware/context-oracle/ctxoracle/test/replay/correct_missed_question.test.ts]
  modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]
  delete: []
provides: [ctxoracle-correct]
tests: [T-34-1, T-34-2]
depends_on: [S1, S9, S22, S23, S30, S33]
```


**What changes.** Create `src/cli/correct.ts`:
- `ctxoracle correct <whisper-or-deny-id> --verdict (false_fire|missed|
  confirm) [--note "<text>"]`: writes a `corrections` row with `whisper_id`
  or `deny_id`, then runs the `whisper_stats` fold (Step 30).
- `--missed-question "<text>"`: routes the text through `recognizeQuestions`
  (Step 23) with `{requireTerminalMark: false}` — the only caller that
  passes it (Max may paraphrase); opens a
  `main`-consumer row through Step 22's `openQuestion` (the row's
  `asked_uuid` stays null — the CLI is its origin). On
  `'already_open'` the verb prints, in plain language, which limit the
  reported miss actually hit — intake coverage ("the question is already
  open and armed; nothing to change") or move coverage ("a shell-only
  deviation stays un-deniable in Phase A") — never implying enforcement
  changed when it did not (AD-18, L3).

**Creates.** `src/cli/correct.ts`.

**Source.** `AD-18` (human channel `FR-D4`/`FR-L6`; `--missed-question`
through the same recognizer; the collision messages); `AD-5` (the fold's
`correct` run point); L3; `AC-2c` (answer-drift under-fire), `AC-23`.

**Why this approach (Gate 3):**
1. **The decision.** The CLI writes provenance-human rows; the
   missed-question path uses the same recognizer as intake (one source of
   truth); the fold runs so a post-session correction reaches the global
   efficacy table.
2. **The authoritative standard.** `AD-18`; `FR-L6`; `AC-23`.
3. **Why this standard applies here.** `FR-B5`'s answer-drift under-fire
   guard IS the human channel — a missed drift becomes a deniable deviation
   only when this verb records it and the identical mutating deviation is
   thereafter denied.
4. **What this is NOT — and why.** Not a policy engine (Phase C). Not a
   silent fix (the collision message is the L3 disclosure).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-34-1` (a `false_fire` verdict on a deny increments the
wrongful-deny rate `status` renders and reaches `whisper_stats`), `T-34-2`
(`--missed-question` re-arms the deny for the identical mutating deviation;
the two collision messages print for their cases).

**Impact if wrong.** Human channel broken — the answer-drift under-fire
guard fails silently. Caught by `T-34-2`.

---

### Step 35 — `note` verb + fact routing

```step-decl
step: S35
covers: [PA-7, PA-11]
files:
  create: [middleware/context-oracle/ctxoracle/src/cli/note.ts, middleware/context-oracle/ctxoracle/test/replay/note_project.test.ts, middleware/context-oracle/ctxoracle/test/replay/note_global.test.ts]
  modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]
  delete: []
provides: [ctxoracle-note]
tests: [T-35-1, T-35-2]
depends_on: [S1, S9, S11, S31]
```


**What changes.** Create `src/cli/note.ts`: `ctxoracle note "<fact>"
[--file <path>] [--kind (landmine|invariant|target_correction)]` writes to
`human_facts` in the project store, or to `landmines` (`kind='human_stated'`)
/ `invariants` + `invariant_members` when `--kind` is set — provenance
human, trust human; the DAO resolves conflicts human-first at query time
(AC-23). `ctxoracle note --global "<lesson>" [--evidence <text>]` writes to
`lessons` in the global store (`FR-L7`).

**Creates.** `src/cli/note.ts` — routes per FR-L7.

**Source.** `AD-18` (`note`; human facts outrank mined inference); `AD-5`
(`lessons`; `--global` routing); `AD-15` (`human_stated` landmines; L10
invariants); `FR-L6`, `FR-L7`; `AC-23`.

**Why this approach (Gate 3):**
1. **The decision.** Two routes via `--global`; project store default.
2. **The authoritative standard.** `AD-18`; `FR-L7`.
3. **Why this standard applies here.** Cross-project lessons must survive
   re-clones; repo-specific facts travel with the repo store.
4. **What this is NOT — and why.** Not a single-store dump (loses FR-L7's
   routing). Not a config file (two sources of truth).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-35-1` (project note lands in `human_facts`/`landmines`/
`invariants` and outranks a conflicting mined inference), `T-35-2`
(`--global` lands in `lessons`).

**Impact if wrong.** Contained per store — a wrong route sends the fact to
the wrong place (visible when the fact fails to surface).

---

### Step 36 — Model invocation seam (never called in Phase A)

```step-decl
step: S36
covers: [PA-8, PA-9]
files:
  create: [middleware/context-oracle/ctxoracle/src/model/invoke.ts, middleware/context-oracle/ctxoracle/test/unit/model_invoke_stub.test.ts]
  modify: []
  delete: []
provides: []
tests: [T-36-1]
depends_on: [S1, S5]
```


**What changes.** Create `src/model/invoke.ts` carrying the Phase B seam as
the **verified invocation contract**, not a Phase B API:
```ts
export interface ModelInvocationRequest {
  prompt: string; model: string; maxTurns?: number; timeoutMs?: number;
}
export interface ModelInvocationEnvelope {          // fields observed in V9 (re-run 2026-09-07)
  is_error: boolean; num_turns: number; result: string; subtype: string;
  session_id: string; duration_ms: number; total_cost_usd: number;
  usage: unknown; modelUsage: unknown; raw: Record<string, unknown>;
}
export interface ModelInvocation {
  invoke(req: ModelInvocationRequest):
    Promise<{ok: true; envelope: ModelInvocationEnvelope} | {ok: false; reason: string}>;
}
export const phaseANotImplemented: ModelInvocation = {
  invoke: async () => ({ ok: false, reason: 'phase_a_no_model' }),
};
```
The file's header states the contract every implementation must keep:
command `claude -p --model <model> --tools "" --max-turns <n>
--output-format json` (V9); `--bare` never passed (V10); spawned only
through `oracleSpawn` with `scrub: true` (Step 5) so `CTXORACLE_INTERNAL=1`
is set and the `SCRUBBED_ENV` session-identity variables are absent while
authentication and routing are inherited — the shipped command was
executed 2026-09-07 under exactly that scrub and returned a fresh
`session_id` with a successful envelope; unscrubbed it reports the parent
session's `session_id` (§11.4); `cwd` outside the repository. No Phase A
code imports this module except its unit test.

**Creates.** `src/model/invoke.ts` — Phase B seam (never called in Phase A).

**Source.** `AD-21` (the seam is the V9-verified invocation, run with
`CTXORACLE_INTERNAL=1`, cwd outside the repo, scrubbed environment; the
probe cache is Phase B's); V9, V10, V11 (re-executed 2026-09-07, §11.4).

**Why this approach (Gate 3):**
1. **The decision.** The seam mirrors exactly the verified invocation and
   its envelope; Phase B layers its API over it without touching the deny
   path; the guard invariants are part of the contract.
2. **The authoritative standard.** `AD-21`; V9's observed envelope; §11.5
   ("the model never sits on the deny path" from day one).
3. **Why this standard applies here.** Leaving the seam to Phase B invites
   the redesign §11.5 forbids; fixing it as the *invocation* contract —
   rather than a guess at Phase B's genre API — is the part Phase A can
   verify and the part Phase B cannot change without re-verifying V9.
4. **What this is NOT — and why.** Not `{ok, text}` (discards the envelope
   V9 observed — cost, usage, error subtype — forcing Phase B to widen the
   seam). Not Phase B's genre API (Phase B is not architected; guessing it
   is the same over-reach in the other direction). Not a stub that returns
   fake answers (fake completeness). Not a probe at Phase A init (no
   caller).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-36-1` (the interface compiles; the sentinel returns
`phase_a_no_model`; no `dist/src/**` module outside `dist/src/model/invoke.js`
imports it).

**Impact if wrong.** Contained — no Phase A caller; a wrong shape is caught
at Phase B against V9.

---
### Step 37 — The complete unit / build / convention tier runs green

```step-decl
step: S37
covers: [PA-10]
files:
  create: []
  modify: []
  delete: []
provides: []
tests: []
depends_on: [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20, S21, S22, S23, S24, S25, S26, S27, S28, S29, S30, S32, S36]
```


**What changes.** No new module. Every test file named in §5.1 under
`test/unit`, `test/build`, `test/conventions` exists (each was written with
its step), compiles with the sources, and `npm test` (Step 1's runner)
executes the full set: the runner's count guard confirms nothing was
dropped. CI (Step 1) runs the same command at the floor and at the current
22.x.

**Creates.** Nothing new (this step modifies or verifies earlier artifacts).

**Source.** `AD-24` (unit tier); Step 1's runner design.

**Why this approach (Gate 3):**
1. **The decision.** Tests are written alongside the modules they cover
   (each step's Verification field) and this step is the consolidation that
   proves the set is complete and green.
2. **The authoritative standard.** `AD-24`; SWE-at-Google (tests built with
   the code they test); Step 1's count guard.
3. **Why this standard applies here.** Without a consolidation step, a test
   file that was named but never written would pass unnoticed; the guard
   compares the compiled set to the source set, and this step compares both
   to §5.1.
4. **What this is NOT — and why.** Not "author the tests now" (they exist
   from their steps). Not a run of the replay tier (Step 38).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `npm run build && npm test` exits 0 at Node 22.16.0 and at
the current 22.x; the runner's printed counts equal the number of `.test.ts`
files under the three directories in §5.1.

**Impact if wrong.** Coverage theater — a missing or silently skipped test
file. The runner guard and this reconciliation are the two checks.

---

### Step 38 — Acceptance tier + build-time verifications

```step-decl
step: S38
covers: [PA-10]
files:
  create: [middleware/context-oracle/ctxoracle/scripts/check-cold-container.sh, middleware/context-oracle/ctxoracle/test/replay/hook_stream_fixtures/, middleware/context-oracle/ctxoracle/test/replay/answer_drift_off_to_unrelated.test.ts, middleware/context-oracle/ctxoracle/test/replay/answer_drift_reconciliation.test.ts, middleware/context-oracle/ctxoracle/test/replay/answer_drift_subagent_allow.test.ts, middleware/context-oracle/ctxoracle/test/replay/answer_drift_lag_hold.test.ts, middleware/context-oracle/ctxoracle/test/replay/deny_after_answer_lag.test.ts, middleware/context-oracle/ctxoracle/test/replay/deny_health_induced.test.ts, middleware/context-oracle/ctxoracle/test/replay/session_start_startup.test.ts, middleware/context-oracle/ctxoracle/test/replay/session_start_resume.test.ts, middleware/context-oracle/ctxoracle/test/replay/stop_outstanding_question_line.test.ts, middleware/context-oracle/ctxoracle/test/replay/coupling_nonobvious.test.ts, middleware/context-oracle/ctxoracle/test/replay/orientation_mixed_shape.test.ts, middleware/context-oracle/ctxoracle/test/replay/reuse_mixed_language.test.ts, middleware/context-oracle/ctxoracle/test/replay/consequence_coupled_tests.test.ts, middleware/context-oracle/ctxoracle/test/replay/completeness_paired_change.test.ts, middleware/context-oracle/ctxoracle/test/replay/bar_no_cap.test.ts, middleware/context-oracle/ctxoracle/test/replay/bar_hazard_bypass.test.ts, middleware/context-oracle/ctxoracle/test/replay/dedup_read_set.test.ts, middleware/context-oracle/ctxoracle/test/replay/corpus_floor.test.ts, middleware/context-oracle/ctxoracle/test/replay/rumor_rule.test.ts, middleware/context-oracle/ctxoracle/test/replay/session_boundary_dedup.test.ts, middleware/context-oracle/ctxoracle/test/replay/stop_single_cycle.test.ts, middleware/context-oracle/ctxoracle/test/replay/security_ac11.test.ts, middleware/context-oracle/ctxoracle/test/replay/subagent_delivery.test.ts, middleware/context-oracle/ctxoracle/test/replay/language_config_added.test.ts, middleware/context-oracle/ctxoracle/test/replay/idle_silence.test.ts, middleware/context-oracle/ctxoracle/test/replay/seeded_facts_exit.test.ts, middleware/context-oracle/ctxoracle/test/replay/verification_headline.test.ts, middleware/context-oracle/ctxoracle/test/replay/warning_headline.test.ts, middleware/context-oracle/ctxoracle/test/replay/answer_drift_overfire.test.ts, middleware/context-oracle/ctxoracle/test/replay/answer_drift_residual.test.ts, middleware/context-oracle/ctxoracle/test/build_time/marker_presence.ts, middleware/context-oracle/ctxoracle/test/build_time/grammar_inventory_check.ts]
  modify: [.github/workflows/context-oracle-ctxoracle.yml]
  delete: []
provides: []
tests: [T-38-1, T-38-2, T-38-3, T-38-4, T-38-5, T-38-6, T-38-7, T-38-8, T-38-9, T-38-10, T-38-11, T-38-12, T-38-13, T-38-14, T-38-15, T-38-16, T-38-17, T-38-18, T-38-19, T-38-20, T-38-21, T-38-22, T-38-23, T-38-24, T-38-25, T-38-26, T-38-27, T-38-28, T-38-29, T-38-30, T-38-31, T-38-32, T-38-33]
depends_on: [S1, S5, S15, S28, S29, S30, S31, S32, S33, S34, S35]
```


**What changes.** Create the acceptance tests `T-38-1` … `T-38-31` (§12.3)
against the real handler binary through Step 28's replay harness, each
with its hook-stream fixture under `test/replay/hook_stream_fixtures/` and
the fixture repositories Step 1's generator produces, and the build-time
verifications:
- `test/build_time/grammar_inventory_check.ts` (L6): enumerates the `.wasm`
  files shipped in the installed `tree-sitter-wasms` package, loads each
  grammar the default `index.ext_to_grammar` table names through
  `web-tree-sitter`, and fails on any missing or unloadable grammar.
- `test/build_time/marker_presence.ts` (L11(a)): given one or more
  `--corpus <machine>/<mode>=<dir>` arguments, counts the user entries of
  every transcript under each by `(content shape, origin.kind, isMeta)` and
  prints the table keyed by the declared origin (a transcript given with no
  declared origin is reported "origin unknown"); it is executed by Step
  39's replay leg over every corpus that leg declares, and the exit report
  carries the table.
- `scripts/check-cold-container.sh` (AC-20): run by the `cold-container`
  job this step adds to `.github/workflows/context-oracle-ctxoracle.yml`,
  in a fresh `node:22.16.0-bookworm` container (the `bookworm` variant
  carries `git`, which `ctxoracle init` on a fixture repository needs; the
  `-slim` variant does not — §11.4) with the default runner network: `npm ci`, `npm run build`, `ctxoracle init`
  on `pristine-tree`, and the FTS5 probe result — asserts no install-phase
  script ran.

**Creates.** `scripts/check-cold-container.sh` — T-38-25 / AC-20.

**Source.** `AD-24` (fixture repos + replay through the real handler; each
Phase A criterion pinned; the build-time verifications: marker presence on
the owner's real transcripts, grammar inventory); L6, L11; `D-plan-5`.

**Why this approach (Gate 3):**
1. **The decision.** Real git repositories generated from scripts; the real
   handler binary spawned per event; the two verifications the architecture
   names as build-time are scripts executed by the build, not procedures
   handed to the owner.
2. **The authoritative standard.** `AD-24`; `references/testing-standards.md`
   (real implementations; the doubled-subject anti-pattern is avoided by
   using the real binary; data from generators with stated properties).
3. **Why this standard applies here.** A replay against a mocked handler
   tests the mock; the fixture tier exists to catch handler bugs. The
   generators plant the *scenario* (commit sequence, file changes, merge
   patterns), never the tool's expected output, so an assertion is on the
   tool's response to real inputs (no backward-fabricated data).
4. **What this is NOT — and why.** Not in-process handler calls (loses the
   process boundary — AD-1). Not synthetic hook JSON that skips the adapter
   (bypasses AD-6's one file). Not committed tarballs (opaque; a generator
   is diffable). Not owner-run markdown probes (the owner is a
   non-programmer, `OL-11`; the build can execute these).

**Dependencies.** Declared above (`depends_on`).

**Verification.** **Checkpoint 4**: `node scripts/run-tests.mjs --replay`
exits 0 with every replay test executed — `T-38-1`–`T-38-24`,
`T-38-26`–`T-38-31`, plus the replay tests of Steps 28–35 — the runner's
count guard covers `test/replay` too; `grammar_inventory_check` passes for
the default table (`T-38-33`); `marker_presence` passes its self-test
(`T-38-32`); the `cold-container` job passes (`T-38-25`). The replay
tier's wall time on the every-PR job and the `large-store` build time
`T-29-1` prints are read from this run's log and stated in the exit report
(§16 item 2); the plan assumes no number for either.

**Impact if wrong.** The acceptance suite is what proves Phase A correct; a
broken fixture undercuts every AC that depends on it.

---

### Step 39 — Exit run: the honest measurement on the owner's real repositories

```step-decl
step: S39
covers: [PA-10, PA-13]
files:
  create: [middleware/context-oracle/ctxoracle/scripts/exit-run.sh]
  modify: []
  delete: []
provides: []
tests: [T-38-27]
depends_on: [S1, S5, S28, S31, S38]
```


**What changes.** Create `scripts/exit-run.sh` and run it. Three legs, one
report, one validity rule.

**Leg 1 — replay of real transcripts (agent-run).** Enumerate every
transcript `*.jsonl` under `~/.claude/projects/` on the machine where the
exit run executes. For each transcript: (a) resolve its repository — the
`cwd` its entries record must exist on this machine with a `.git`
directory, in which case the store is keyed by Step 5's rules on that
checkout as it stands (the transcript's `gitBranch` field and the
checkout's current `HEAD` are recorded; no checkout is moved, so leg 1's
structural genres see the current tree, which the report labels as a
reconstruction — R8, G4); a transcript whose `cwd` is absent is path-keyed
on the `cwd` string and its structural genres are reported as not
applicable; (b) reconstruct the hook-event stream the session would have
produced (`UserPromptSubmit` from human turns, `PreToolUse`/`PostToolUse`/
`PostToolUseFailure` from `tool_use`/tool-result pairs, **one `Stop` per
turn** — emitted after the last assistant entry that precedes the next
human turn or the end of file, with `last_assistant_message` = that
entry's text and `stop_hook_active: false`, the reference's once-per-turn
cadence (§11.4) — `SessionStart` at the head — `IDEAS.md` #14's
discovery-mode replay); (c) materialise `transcript_path` as a **growing
prefix**: before each replayed event the harness (Step 28's runner) writes
a file containing exactly the transcript entries that precede that event,
so catch-up reads what the live handler would have seen and never the
session's future — V1's write lag itself is not reproduced, so the lag-hold
rate is a leg 2 number only; (d) replay the stream through the real handler
against a fresh store; (e) run `marker_presence` (Step 38) over the corpus
with its table keyed by **declared corpus origin** — an input, never a
reading: `exit-run.sh` passes each corpus as `--corpus
<machine>/<mode>=<dir>` from where it executes and how the corpus was
obtained (`report-machine/remote-container` for the report machine's own
`~/.claude/projects/`; `owner-local/interactive` for a directory Max Cogar
exported from his local interactive environment), because a transcript's
path names a project directory, not a machine, and its markers are what
the table measures (V12: marker presence is mode-dependent, so keying by
markers is circular); a transcript under no declared corpus is reported
"origin unknown" and cannot count toward L11(a). The
report lists the transcript count per origin, the repositories they cover
**split by repository class** — the tool's own repository (this project's
documentation history, the reflection) versus the owner's code
repositories — with every leg-1 number given per class, and — for zero
transcripts — says so; a zero corpus does not invalidate the run, it makes
leg 2 carry the measurement.

**Leg 2 — closed-loop sessions on real code repositories (agent-driven by
construction).** The target repositories are `Maxcogar/NOVA` and
`Maxcogar/Nova-Integrations` — the two most recently pushed repositories
in §11.4's 2026-09-07 listing other than the tool's own; if a named
repository holds no grammar-covered code file at run time, or cannot be
cloned with the implementing agent's repository access, the next
repository in that listing's push-date order replaces it, and the report
records the replacement. **Every counted session is a `claude -p`
conversation the implementing agent drives from its own environment**, as
a child process of the agent's session, started with `--permission-mode
acceptEdits` and an `--allowedTools` list naming the read tools, `Edit`,
`Write`, and the Bash prefixes the protocol's tasks use (the report carries
the list verbatim) — a `-p` session can show no permission prompt, so an
`Edit` or `Write` that is not pre-approved is denied and never executes
(§11.4) — never with `--tools ""` (V11: that disables every tool; the model
seam's V9 run used it and verified authentication and the envelope shape,
nothing about a tool-enabled conversation); with Step 5's `SCRUBBED_ENV`
session-identity set removed from the child's environment by the driver,
so that each session is its own (the child's `session_id` must differ from
the agent's own session, §11.4); with `CTXORACLE_INTERNAL` absent (the
driver prints the child's environment filtered for `CTXORACLE_*` and the
report carries that output, which must be empty); and continued turn by
turn with `--resume <session_id>`, which fires `SessionStart {source:
resume}` (§11.4). The hooks reference's settings-file rule makes this the
executable session kind: a `-p` or SDK session never shows the trust
dialog and treats the folder as trusted, so the hooks `init` wrote to the
clone's `.claude/settings.json` run from the session's first event
(§11.4); an interactive session would hold them back until a dialog no
agent can accept. Per repository, the protocol is:

1. **Setup (once, no session).** On the report machine — the environment
   the implementing agent runs in, where `~/.ctxoracle` and
   `~/.claude/projects/` are local to the report — clone the repository,
   install the packed tool (`npm install -g <package tarball>`), and run
   `ctxoracle init` in the clone. The wiring is in place before any
   session starts; nothing is installed inside a session.
2. **Counted sessions.** At least **three** `claude -p` conversations per
   repository, each a fresh session (`--resume` continues one; a new
   session id starts the next), driven turn by turn by the agent. Inside
   each, the driver asks at least one `?`-terminated question **and at
   least one indirect ask without a `?`** ("tell me whether …" — the
   intake-miss class the floor measures; whether it was opened, re-asked,
   or corrected is recorded), performs at least five tool events including
   one `Edit`, and attempts the **L11(b) induction**: a background task is
   started and allowed to complete and a scheduled wake is triggered where
   the `-p` harness produces those turns; where it does not, the induction
   is recorded as *not performed* for that session, and Max Cogar's
   interactive sessions (below) are where it is expected to be observed.
   Three is the minimum because one session cannot separate a lag hold
   from a steady-state deny; three gives each detector at least two
   chances to fire. The driver reads `permission_denials` from every
   turn's JSON envelope and records it per session; a session with any
   denial on `Edit` or `Write` is not counted.
3. **Collection.** Every counted session's store and transcript are
   already on the report machine (`~/.ctxoracle` and the session's
   `~/.claude/projects/<slug>/` file, located through Step 21's
   `projectTranscriptDir`); `exit-run.sh` reads `status` and `log` per
   session and computes. No transfer step exists for agent-driven
   sessions.
4. **Mode.** A `-p` transcript's human turns carry no `origin` and no
   `isMeta` (V12; §11.4), so every `--resume` turn's qa-state rebuild
   (Step 27) recovers nothing and raises `rebuild_recovered_nothing` —
   expected in this mode and labelled so in the report, never counted as
   a fault of the reader; mid-session enforcement in leg 2 rests on intake
   from the `prompt` field alone (L11). Leg 2's transcripts are passed to
   `marker_presence` under their own declared origin,
   `report-machine/claude-p`, whose marker row is expected to be all-zero
   and never counts toward L11(a).

Max Cogar may additionally drive sessions in his own interactive
environment (`OL-11`: he speeds up testing); those reach the report
through one action on his side — `ctxoracle export <dir>` in each such
repository, plus the session's transcript file copied into that directory,
and handing the directory over — and `ctxoracle import` on the report
machine; the report lists them separately with driver "Max Cogar". The
outcome of each induction — fires / does not fire / fires with the row
voided / not performed — is a line in the report.

**Leg 3 — AC-18 seeded fixture.** `T-38-27` on `seeded-facts`.

**Validity rule.** The report is **invalid** unless leg 2 completed the
three-session minimum on at least one of its target repositories, the
`CTXORACLE_*` environment check was empty in every leg-2 session, and
**every counted session's store holds a `SessionStart` liveness row for
that session** (a session whose hooks never fired — wiring dead, a
settings file not read — can never count, and is listed as such) **and at
least one `outcome='ok'` `Edit` or `Write` row in `observed_actions`** (a
session whose edits were all permission-denied exercised the block on no
mutation, and is listed as such); the tool's own repository never counts
toward the minimum. The report states
the rule and whether it was met.

**The recognizer floor number and its denominator.** Separately for the
leg 1 corpus and for the leg 2 transcripts — never pooled, since leg 1's
turns are what Max Cogar actually wrote and leg 2's are authored by the
driver under a protocol that prescribes their shape — `exit-run.sh` draws a
seeded random sample of `N = min(200, all human turns)` per leg (seeds
printed); the
implementing agent labels each sampled turn **before the replay opens any
row, from a view of the corpus with no store present**, against the plan's
written rule (D-plan-26) *"a turn that asks the agent for information or a
decision, whatever its punctuation"* — the plan's definition (OL-C5 states
the trigger, "if i ask a question", not a definition of a question) and
independent of the `?`-terminated recognizer, so the measurement is not the
recognizer grading itself (collapse-log 2026-08-25 item 1); the report
records the labelling order and that the labeller is the implementing
agent, so the estimate is read with that caveat. The report prints the sample size, the
rule, the labeller, the full label table as an appendix (turn uuid,
label), and, per leg, two numbers: **recall** = opened rows on labelled
questions / labelled questions, and **precision** = opened rows on labelled
questions / opened rows in the sample — each stated as an estimate with
its `N`, leg 2's labelled "protocol-driven". Leg 2 adds the ground truth
the closed loop provides: questions the driver had to re-ask, the indirect
asks' outcomes, and `--missed-question` corrections, reported as their own
lines, not folded into recall.

**Report** (`docs/reviews/<date>-phase-a-exit-run.md` — D-plan-21): per-leg
inputs (repository set with any replacement, transcript count per origin
and repository class, session count and driver per repository, the
`CTXORACLE_*` check output, the counted-session flags, the
`permission_denials` line and the liveness-row and edit-row checks per
counted session);
**every number below is given per leg, never as a total across legs**:
per-genre whisper counts (leg 1's Stop-time genres depend on the
reconstruction rule above and are labelled so); denies issued — for leg 1
the *count only*, labelled "off-policy — the recorded agent could not
react" (IDEAS.md #14: the recorded agent never saw a deny, so every
deny-derived rate from leg 1 measures the reconstruction, not the block);
from leg 2 only: the wrongful-deny rate with its components (`false_fire`
corrections, `deny_after_answer_lag`, `deny_despite_answer_text`,
voided-intake denies), the lag-hold rate (`deny_after_answer_lag` /
denies), `deny_loop` and `deny_bypass_suspect` counts with the predicate's
coverage bound, and the fraction of denies that were escaped by a text
turn versus corrected as wrongful; false-fire rate; regret rate paired
with seeded coverage and split by `never_triggered` / held; done-claims
with an outstanding question; the marker-presence table by declared
corpus origin, with L11(a) stated as *verified* only when a corpus
declared `owner-local/interactive` holds at least one transcript and
otherwise *not observed*; the L11(b) outcome per session; active
suppressing conditions; every `plan_seed` value in force; the IDEAS.md
#14 limit paragraph naming the leg-2-only fields above; and — **the honest
floor numbers Max Cogar reads** — the per-leg recall and precision
estimates above with their sample sizes (leg 1's from real turns; leg 2's
labelled protocol-driven), the labelling order and labeller, the count of
questions opened over the count of human turns scanned per leg, the
indirect-ask outcomes from leg 2, and the fraction of leg-2 denies that
were escaped by a text turn versus corrected as wrongful.

**Creates.** `scripts/exit-run.sh` — three-leg exit run + report.

**Source.** Spec §11.5 (the exit is a measurement on the owner's real repos
and transcripts, "including how little the conservative recognizer
catches"); `docs/IDEAS.md` #14 (discovery-mode replay: what replay can and
cannot measure — outcome validation needs real closed-loop sessions);
`AD-24` (the two build-time verifications executed here); `AC-18`; `CLAUDE.md`
dominating rule 3; §11.4 (the counted-session execution).

**Why this approach (Gate 3):**
1. **The decision.** Three legs, a validity rule that excludes measuring
   only the tool's own repository, a report that names its inputs and
   prints every conditional (seeds, bounds) beside its numbers.
2. **The authoritative standard.** Spec §11.5; IDEAS.md #14 (replay
   measures recognizer boundaries, silence rate, latency, rare modes, and
   robustness; it cannot measure hit rate or the block's value — those need
   closed-loop sessions); collapse-log 2026-09-04.
3. **Why this standard applies here.** A floor measured on the tool's own
   documentation history is a measurement of the tool's reflection; Phase B
   and the AD-24 regression fixtures are designed from this report
   (§11.5), so a biased substrate biases both. Naming the two repositories
   removes the "owner supplies a list" step a non-programmer should not
   carry; making the sessions `claude -p` children of the agent's own
   environment keeps the owner out of the loop and the data on the machine
   that writes the report; a labelled
   sample is the only denominator a corpus with no planted ground truth
   can honestly carry (IDEAS.md #14), and a per-event transcript prefix is
   the only replay that does not hand the handler the session's future.
4. **What this is NOT — and why.** Not synthetic data reported as the floor
   (fake completeness). Not the tool's own repository alone (the
   reflection). Not hidden low numbers (the low answer-drift coverage IS
   the deliverable; Phase B raises it). Not a claim that replay measured
   efficacy (IDEAS.md #14's structural limit, stated in the report). Not
   a recall computed against the recognizer's own rule (a fraction of 1.0
   by construction). Not a replay that mounts the whole stored transcript
   as `transcript_path` (catch-up would classify the whole session at the
   first event and the block would measure nothing).

**Dependencies.** Declared above (`depends_on`).

**Verification.** **Checkpoint 5**: the report exists with every field
above; `ctxoracle status` on each leg-2 store (local or imported) shows the
same numbers; `T-38-27` passed; the validity rule is met; the
`CTXORACLE_*` check is empty for every leg-2 session; the marker-presence
table by origin, the L11(a) verdict, and the L11(b) outcomes are present;
the label appendix has `N` rows. A suspiciously *high* answer-drift
coverage number is a finding to investigate, never a success to publish.

**Impact if wrong.** Direct — a padded or reflection-only exit report
poisons the data Phase B and the AC-24 regression fixtures are designed
from.

---

### Step 40 — Post-completion housekeeping

```step-decl
step: S40
covers: []
files:
  create: [middleware/context-oracle/ctxoracle/scripts/check-status-post-build.sh]
  modify: [middleware/context-oracle/docs/STATUS.md]
  delete: []
provides: []
tests: [T-40-1]
depends_on: [S1, S39]
```


**What changes.** Rewrite `docs/STATUS.md` to state Phase A complete with
the exit report's location, and the next step (Phase B architecture, per
the per-phase lifecycle). Route any lesson from the build that generalises
to `docs/collapse-log.md` (one line plus a pointer). Create no `README.md`
(`CLAUDE.md`: a new file is almost never the answer). Run
`scripts/check-status-post-build.sh` (`tools/check_docs.py --base
origin/main`).

**Creates.** `scripts/check-status-post-build.sh` — T-40-1.

**Source.** `CLAUDE.md` session protocol and information policy; the
per-phase lifecycle rule.

**Why this approach (trivial: routine post-completion per `CLAUDE.md`).**

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-40-1`.

**Impact if wrong.** Cosmetic; caught by the CI docs check.

---
## 8. Divergences from existing patterns

None. This plan introduces a new component tree; no existing pattern in
`middleware/context-oracle/` is diverged from (the directory's one code file,
`tools/check_docs.py`, is documentation tooling the plan does not touch —
§11.6). The plan intentionally does **not** clone patterns from the sibling
directories `middleware/codebase-context-compiler/`,
`middleware/codebase-context-compiler-sandbox/`, or
`middleware/Gemini-context-compiler/` — those are archived, read-only
reference and dead per `CLAUDE.md` ("The retired `ctxpack` design is dead").
The no-daemon topology that inverts the 2026-07 whole-scope record's
warm-service design is not a divergence from a currently-authoritative
pattern; that record is marked historical, and the divergence is the
architecture's own (AD-1, with V8 as its evidence).

---

## 9. Checkpoints

Triggers per the skill's Step 10 (foundation corrections; integration points
where separately-built pieces connect; irreversible steps;
structural-to-behavioral transitions). Each checkpoint names the tests that
are *runnable* at that point.

- **After Step 12 — Checkpoint 1: the substrate.** Boundary between the
  store substrate and every downstream write path. Run `T-1-1` – `T-12-1`
  (`npm test` at this point: every unit/build/convention test written so
  far, with the runner's count guard; the fixture repositories they need
  exist from Step 1's generator). Owner-visible sanity check: `sqlite3
  <store.db> ".schema"` (or `Store.prepare("SELECT sql FROM sqlite_master")`)
  shows every Phase A table with STRICT and every CHECK constraint, and
  `tuning` shows every seed with its `source`.

- **After Step 20 — Checkpoint 2: the whisper path at function level.**
  Boundary between component construction and orchestration; the genres,
  bar, composer, and delivery exist but no handler wires them. Run
  `T-13-1` – `T-20-2`. Owner-visible check: none yet (no hook path exists);
  the reviewer-visible check is that every generator's function-level test
  seeds a real store from its fixture and asserts the headline the AC
  demands.

- **After Step 28 — Checkpoint 3: the pipeline is complete and the first
  replays run through the built binary.** Boundary between component
  construction and orchestration for the block. Run `T-21-1` – `T-28-6`
  (the function-level tests of Steps 21–28 and the Step 28 replays:
  pipeline order, fail-open, produced-but-undelivered, the liveness row,
  the `hook integrity-check` verb). No acceptance
  replay of a genre or of the block exists yet (they are Step 38's), and
  no `init` verb exists, so the owner-visible check is deferred to
  Checkpoint 4.

- **After Step 38 — Checkpoint 4: the acceptance set is complete before the
  exit run; the deny path and the whisper path are exercised together for
  the first time.** Every replay test passes — `T-38-1`–`T-38-24`,
  `T-38-26`–`T-38-31` and the Step 28–35 replays — in one run; the deny
  fixtures run here *alongside* the whisper-path fixtures, never as an
  isolated first correctness gate (the collapse-log 2026-09-04 shape is a
  recognizer elaborated against its own fixtures with nothing else in
  view); `grammar_inventory_check` (`T-38-33`) and `marker_presence`'s
  self-test (`T-38-32`) pass; the `cold-container` job passes (`T-38-25`).
  Owner-visible check: a hand-driven session on `coupling-nonobvious` with
  the tool installed produces a Coupling whisper with an evidence ratio and
  a pointer, and an `Edit` while a `?` question is open is denied with the
  question quoted back. Boundary before the irreversible act of running on
  the owner's real repositories and publishing the exit report (the Phase B
  design input).

- **After Step 39 — Checkpoint 5: the honest exit measurement.** The exit
  report is reviewed against §11.5: measured coverage (not padded), the
  wrongful-deny rate and its components, the lag-hold rate, regret paired
  with seeded coverage, the validity rule met, every `plan_seed` and the
  bypass bound printed. If the answer-drift coverage number reads
  suspiciously *high* for a conservative model-free recognizer, that is a
  finding to investigate (collapse-log 2026-09-04) — the high number is not
  published as success.

---
## 10. Decisions made during planning

Judgment calls made while writing this plan, each with its reasoning. The
architecture made its 26 design decisions; the plan decides ordering, test
mechanics, the values the architecture left open, and the small set of
implementation-level shapes it delegated. Every decision below was reasoned
through the Clear Thought MCP server (`sequential_thinking` chains and, where
options competed, `decision_framework` multi-criteria scoring). The captured
stdio logs are `docs/reviews/2026-09-07-plan-tool-traces.md` (the planning
run: D-plan-1, 3, 7, 9, 11, 12, 14, and the first chains for 6, 8, 10) and
`docs/reviews/2026-09-07-plan-tool-traces-2.md` (the corrections run:
D-plan-2, 4, 5, 6, 8, 10, 13, 15–26), and
`docs/reviews/2026-09-07-plan-tool-traces-3.md` (the round-4 corrections
run: D-plan-24 and D-plan-26 re-derived, D-plan-27, D-plan-28, and the
amendment to D-plan-5), and `docs/reviews/2026-09-07-plan-tool-traces-4.md`
(the round-5 correction of issue S1: the amendment to D-plan-26's
counted-session invocation), and
`docs/reviews/2026-09-07-plan-tool-traces-5.md` (the round-5 correction of
issue S2: D-plan-29); where the files disagree on a decision, the latest
file's chain is the one whose conclusion appears here.
The §7 steps that carry plan-level judgment beyond transcribing an
architecture decision are named against their entry so a reader can find
every such step: Step 1 (D-plan-2, D-plan-3, D-plan-13), Step 5 (D-plan-14,
D-plan-15), Step 7 (D-plan-28), Step 9 (D-plan-27), Step 12 (D-plan-7),
Step 14 (D-plan-28, D-plan-29), Step 15 (D-plan-29), Step 23 (D-plan-19,
D-plan-24), Step 25 (D-plan-9,
D-plan-27), Step 26 (D-plan-16, D-plan-27), Step 29 (D-plan-5, D-plan-12),
Step 31 (D-plan-6, D-plan-25), Step 32 (D-plan-4), Step 33 (D-plan-25),
Step 36 (D-plan-8),
Step 38 (D-plan-5, D-plan-11, D-plan-17), Step 39 (D-plan-10, D-plan-11,
D-plan-26), and the ordering of §7 as a whole (D-plan-1, D-plan-18).

- **D-plan-1 — Build order: substrate → whisper path → answer-drift block →
  handler → CLI → seam → tests → exit.** *Reasoning.* Three orders were
  evaluated. (A) substrate → block → whispers → handler: its deny-path
  checkpoint is unexecutable as written, because every block acceptance
  test replays through the handler binary, which does not exist until
  after the whisper path; and it builds the recognizers first, with nothing
  else in view, which is the shape the collapse-log 2026-09-04 entry
  records (a recognizer elaborated against its own fixtures). (C)
  block → stub handler → whispers → full handler: builds the handler twice.
  (B) — chosen — keeps topology valid, builds the recognizers last among
  behavioural components against a complete substrate, and runs the deny
  fixtures for the first time alongside the whisper-path fixtures at
  Checkpoint 4, where the acceptance set exists. Test infrastructure is
  placed before its first consumer under the same rule: the fixture
  generator and transcript fixtures in Step 1 (Step 5's tests need
  repositories), the replay harness and the CLI entry with the `hook` verb
  in Step 28 (the first replay needs a binary to spawn), so no
  Verification field names a test that cannot run at its step.
  Multi-criteria score (topological validity, restraint pressure,
  checkpoints executable): B 1.0, C 0.67, A 0.

- **D-plan-2 — Dependency pins.** Runtime: `web-tree-sitter` 0.26.13 and
  `tree-sitter-wasms` 0.1.13, exact. *Reasoning.* These are the versions
  the architecture verified (V14, 2026-08-29); the plan builds what the
  architecture verified, and a range would admit a surface (0.27.0 was
  published 2026-08-30) no one has verified. A bump is architecture work.
  Dev: `typescript` 5.9.3, `@types/node` 22.20.1, exact. *Reasoning.* 5.9.3
  is the last release of the compiler line the Node type-stripping
  guidance and the 22.x typings are documented against; 7.0.2 is a native
  port two months old that removed options and changed defaults (§11.4) —
  the tsconfig avoids every removed option so a later bump is a version
  change only, but adopting it is a separate verified decision. Score
  (documentation alignment, maturity, forward-compatible tsconfig): 5.9.3
  1.0, 7.0.2 0.6.

- **D-plan-3 — Test execution: `tsc` compiles `src/` and `test/` into
  `dist/` with the must-fail fixtures excluded; a dependency-free runner
  executes the compiled tests under `node --test` and refuses an empty or
  incomplete set; each compile-time test runs `tsc --noEmit` on its own
  fixture.** *Reasoning.* At
  the 22.16.0 floor `node --test file.test.ts` does not execute (type
  stripping is default only from 22.18.0; the flag is experimental, ignores
  `tsconfig`, and needs `.ts` import specifiers that differ from the emitted
  `.js` ones). `node --test` exits 0
  on an empty match (executed 2026-09-07), so a runner that fails on a
  zero or mismatched count is what makes a missing test red. `tsx`/`vitest`
  add a loader and a dependency for no property the compiled path lacks,
  and AD-25 fixes the build as `tsc` only. A fixture that must fail to
  type-check cannot sit inside the project's `include` — the build would
  be red by construction (executed 2026-09-07, §11.4) — so the fixtures
  directory is excluded and each compile-time test compiles its fixture
  alone with the project's options. Score (works at floor, no extra
  dependency, vacuous pass prevented, one module layout): compiled+guarded
  runner 1.0, tsx/vitest 0.58, strip-types 0.33.

- **D-plan-4 — AC-19's record-identical comparison is a per-table
  canonical-order dump through the `Store` interface (`SELECT * FROM <t>
  ORDER BY <pk>`, or `ORDER BY` every column in schema order for the
  tables AD-4 gives no primary key — `import_edges`, `symbol_refs`,
  `test_map`, `invariant_members`, `observed_actions`), compared row by
  row; the FTS5 virtual tables are compared by the result set of a fixed
  `MATCH` query list, not dumped (their shadow tables are an
  implementation detail `VACUUM INTO` may lay out differently).**
  *Reasoning.* The SQLite
  documentation (§11.4) says `VACUUM INTO` rebuilds and repacks the file and
  may change ROWIDs of tables without an explicit INTEGER PRIMARY KEY, so a
  byte-compare measures the wrong thing; a Node-side dump has no system
  dependency (the `sqlite3` shell is an optional debugging aid, not a test
  path), keeping AC-20's cold-container discipline intact for the test tier.

- **D-plan-5 — Fixture repositories are generated deterministically from
  scripts, never committed as tarballs.** *Reasoning.* A generator is
  diffable and reviewable; fixed seeds keep every fixture-based test
  reproducible across environments. The generators plant the *scenario*
  (commit sequence, file changes, merge patterns); every assertion is on
  the tool's response to that scenario, never on a value the fixture
  wrote, so the data is forward-derived (testing-standards: not
  backward-fabricated). The `large-store` fixture is a *store*, not a
  repository: Step 29's `test/fixtures/generate_large_store.ts` builds it
  through the real migrations (Step 7) and DAOs (Step 9) into the test's
  temp home, cached per run directory by content hash and rebuilt per CI
  job, because nothing before Step 7 can create its tables; Step 1's
  generator and `T-1-3` cover fixture repositories only.

- **D-plan-6 — The `init`/`deinit` marker is the documented `command` field:
  `init` writes `"<node>" "<real path of dist/src/cli/dispatch.js>" hook
  <event>` and both verbs match the pattern
  `[\\/]dist[\\/]src[\\/]cli[\\/]dispatch\.js"? hook <event>$`.**
  *Reasoning.* The hooks reference (2026-09-07) documents the entry fields
  and makes no statement that unknown fields are tolerated; an extra
  marker field rests on undocumented behaviour of a contract that drifted
  between 2026-08-29 and 2026-09-07, and `init` is a direct writer the AD-6
  adapter cannot shield. The command names the interpreter and the
  package's own entry file because that is the one string every sanctioned
  install mode resolves to: `process.argv[1]` keeps the shim's or npx's
  link name, and `fs.realpathSync` of it is `dist/src/cli/dispatch.js`
  under direct `node`, the `npm install -g` symlink, and `npx` alike
  (executed 2026-09-07, §11.4); a basename-`ctxoracle` pattern would match
  nothing `init` could truthfully write. The pattern lives in a documented
  field, survives an install-path change (the prefix is free), and never
  touches the behavioural `matcher`. Score (documented contract only,
  survives path change, matches what init writes in every mode,
  behaviour-neutral): interpreter + entry-file command 1.0, bare
  `ctxoracle` command 0.5 (PATH-dependent; unmatched under `npx`), extra
  field 0.5, matcher tag 0.5.

- **D-plan-7 — The architecture's open thresholds are seeded by the plan,
  labelled `plan_seed`, printed by `status` and the exit report, and
  calibrated by the exit run.** *Reasoning.* AD-14, AD-13, and AD-9 state
  some numbers (seeded as `architecture_default`) and leave others open
  ("k tunable", "N (tunable)", "a small floor"). An unsourced number
  presented as architecture is the collapse-log 2026-08-13 defect; a
  missing value is an implementer decision the skill forbids. The honest
  form is a labelled seed whose provenance travels with every measurement
  conditional on it. Values and their reasoning: `bar.reuse_dominance_k` =
  3 (3:1 is the smallest integer ratio at which "most call sites use X" is
  unambiguous against a runner-up in a heuristic identifier-match count;
  2:1 is a coin-flip on small counts); `deny.despite_answer_text_threshold`
  = 3 (mirrors the architecture's `deny_loop` threshold so both deny-health
  detectors trip on the same run length); `qa.clear_length_floor_chars` = 2
  (AD-9 asks for "a small floor" to exclude noise and FR-B5 says "only an
  empty deferral fails to clear": 2 rejects an empty or single-mark turn
  and lets "No." — OL-C5's direct answer — clear; content-free deferrals
  are the stoplist's job, not the floor's; both miss directions are
  measured by `deny_despite_answer_text` and human corrections);
  `bar.recency_half_life_days` = 365 and `bar.stale_index_factor` = 0.8
  (AD-13 names a recency dampener and FR-K7 a staleness reduction without
  values: a one-year half-life halves a pair's evidence weight per year of
  silence, which keeps a five-year-horizon pair alive at 1/32 rather than
  cutting it off, and a stale index costs one fifth of confidence — enough
  to drop a marginal candidate below the floor, not enough to silence a
  strong one); `diag.hooks_not_firing_gap_s` = 600 (AD-17's detector
  compares transcript growth with event arrival; ten minutes is longer
  than any single tool call the harness allows and shorter than a session
  the owner would notice as silent); `landmine.fix_chatter_k`
  = 3 within `landmine.fix_chatter_window_days` = 90 (three fix-labelled
  commits in a quarter is chatter, two is a coincidence — AD-14's noise
  floor logic applied to landmine mining); `security.entropy_bits_per_char`
  = 4.0 over tokens of ≥ `security.entropy_min_token_length` = 20 (the
  shape of API keys and tokens; below 20 characters entropy is
  indistinguishable from an identifier); `qa.done_claim_trailing_turns_k` =
  3 (the window the AD-9 counter inspects for a `generic_text_all_prior`
  close; long enough to catch a narrate-then-stop, short enough not to
  count a question closed long before the done-claim). No external
  standard fixes any of these values; each is a §15 gap with its attempt
  evidence.

- **D-plan-8 — The Phase B model seam is the verified invocation contract
  and its envelope, not Phase B's genre API.** *Reasoning.* AD-21 fixes the
  seam as the V9-verified command; re-executed 2026-09-07 it returned a
  JSON envelope (`is_error`, `num_turns`, `result`, `subtype`, `session_id`,
  `duration_ms`, `total_cost_usd`, `usage`, `modelUsage`, …). A `{ok, text}`
  seam discards that envelope and forces Phase B to widen the interface —
  the opposite of "fix the shape now"; designing Phase B's genre API now is
  the same over-reach the other way (Phase B is not architected). The
  contract Phase A can verify and Phase B cannot change without re-running
  V9 is the invocation and its envelope, plus the guard invariants
  (`CTXORACLE_INTERNAL=1`, no `--bare`, `--tools ""`, cwd outside the
  repo, and the environment scrub). The scrub is the enumerated
  session-identity set, not every `CLAUDE_*`/`ANTHROPIC_*` variable: the
  shipped command was executed three ways on 2026-09-07 (§11.4) —
  unscrubbed it reports the parent's `session_id`; with the six-variable
  set removed it reports a fresh one and authenticates; with every
  `CLAUDE_*`/`ANTHROPIC_*` variable removed it also authenticates here, but
  that set includes `ANTHROPIC_BASE_URL`-class routing, which `OL-7`'s "no
  separate credentials" does not ask to drop and a host-managed environment
  may depend on — the narrower set is the one the evidence supports and the
  piggyback (host access, inherited) requires. Score (preserves envelope,
  does not design Phase B, structural guard, validated by the shipped
  command): contract+envelope 1.0, `{ok,text}` 0.5, Phase B API 0.38.

- **D-plan-9 — The lag-window hold is the consequence of catch-up reading to
  EOF and denying on `open` state; no separate lag detector exists; the
  transient wrongful-deny rate is measured, not estimated.** *Reasoning.*
  AD-9 defines the hold exactly so ("the clear-state is whatever the
  classified transcript shows"); a heuristic such as "bookmark offset <
  file size" is a second, independently wrong opinion about lag,
  TOCTOU-shaped and absent from the architecture. The spec chose the
  transient wrongful deny as the safe error direction (FR-B1 lag clause,
  D-41); `deny_after_answer_lag` counts each occurrence and the exit report
  carries the rate — a Phase A exit number per §11.5.

- **D-plan-10 — The exit run has three legs (replay of real transcripts
  with `transcript_path` materialised as a per-event prefix, agent-driven
  closed-loop sessions on two named code repositories, the AC-18 fixture),
  a validity rule (invalid unless the three-session minimum completed on
  at least one target repository with the `CTXORACLE_*` check empty), and
  a labelled-sample denominator for the recognizer floor.** *Reasoning.*
  §11.5 says the
  exit runs on the owner's real repos and transcripts; IDEAS.md #14 says
  replay measures recognizer boundaries, silence, latency, rare modes, and
  robustness but structurally cannot measure hit rate or the block's value,
  which need closed-loop sessions. The tool's own repository is dominated
  by this project's documentation history, so a floor measured only there
  is the tool's reflection. The owner's repositories are enumerable
  (§11.4: 41 listed 2026-09-07), so naming candidates removes a
  list-supplying chore from a non-programmer, and naming exactly two with
  a deterministic replacement rule leaves the implementer no choice to
  make. Replay must hand the handler only the transcript prefix that
  preceded each event: catch-up reads to EOF, so a whole stored transcript
  as `transcript_path` classifies the entire session at the first event
  and the block's replayed denies become a harness artifact — the padded
  measurement the phase goal forbids; IDEAS.md #14 defines the replay as
  reconstructing "the `transcript_path` state", which is this. A recall
  number needs a denominator the recognizer did not produce: a labelled
  sample under OL-C5's definition is the only ground truth a corpus with
  "no planted ground truth" (IDEAS.md #14) can carry, and the label table
  is published so the estimate is auditable. Leg 2 is agent-driven so no
  session is asked of the owner; the agent's sessions are `claude -p`
  children of its own environment, so their stores and transcripts are on
  the report machine already (D-plan-26); when Max Cogar drives, his one
  action is `export`, never data entry. Whether
  transcripts exist under `~/.claude/projects/` on the exit-run machine is
  discovered by enumeration and reported, including zero.

- **D-plan-11 — The two L11 build-time verifications are executed by the
  build, not handed to the owner: marker presence as a script over the
  replay corpus (Step 38, run in Step 39), `UserPromptSubmit` provenance as
  a live induction inside the closed-loop leg (Step 39).** *Reasoning.*
  AD-24 names both as build-time verifications; the owner is a
  non-programmer (`OL-11`, `CLAUDE.md` rule 1: the owner cannot catch
  mistakes), so an owner-run markdown probe is a workload transfer the
  project forbids. The induction needs a session whose hooks were loaded at
  its start, which is why it lives in the counted closed-loop sessions —
  `claude -p` conversations on clones `init` prepared beforehand — and is
  recorded *not performed* where that harness gives no injected turn
  (D-plan-26). Plan-time measurement (§11.4): the
  2026-09-07 session transcript's one human prompt carries
  `origin.kind: "human"`; that is the expectation the script tests, not a
  resolution of L11(a) — AD-24 asks for a transcript "from the owner's
  actual interactive environment", so the marker table is keyed by the
  declared corpus origin — an input to the script, never read from the
  transcript (D-plan-26) — and L11(a) is reported *verified* only when a
  corpus declared owner-local/interactive holds a transcript, otherwise
  *not observed*, the same honest field L11(b) uses.

- **D-plan-12 — The cooperative watchdog is built exactly as AD-23
  specifies although V6's fail-closed premise no longer holds.**
  *Reasoning.* §4: the hooks reference now says a timed-out command hook's
  output is discarded and the `PreToolUse` tool call continues. The
  watchdog's remaining grounds — `NF-1` and `FR-O3`'s fail-open *with a
  diagnostic* (`OL-10`) — are unchanged, and the wired 5 s timeout must
  stay above the 2.5 s internal deadline so the diagnostic is written
  before the harness discards the output. No requirement changes; the V6
  row is premise maintenance (§16).

- **D-plan-13 — CI runs the unit/build/convention tier on every PR at Node
  22.16.0 and at the current 22.x from Step 1, and the replay tier in the
  same every-PR job from Step 28 on (`npm test -- --replay`, added when the
  first replay test exists); the replay tier is also mandatory at
  Checkpoints 3–5.** *Reasoning.* The fast tier finishes in well under a
  minute and catches every *structural* precondition of the replay tier
  (deny confinement, adapter isolation, DAO provenance, single importers);
  the replay tier generates git repositories per fixture and takes longer,
  but a behaviour regression only it catches must not reach `main` on a
  reviewer's memory of whether `--replay` was run — the Test Pyramid
  discipline (Fowler) sets the tiers' proportions, not which of them CI
  runs. It joins the job only at Step 28 because the runner's count guard
  turns an empty replay set into a red run (Step 1).

- **D-plan-14 — Every child process goes through one spawn wrapper
  (`src/util/spawn.ts`), the sole `child_process` importer under either
  specifier spelling, enforced by a built-output import scan.**
  *Reasoning.* AD-21 says every
  process the oracle spawns carries `CTXORACLE_INTERNAL=1`; enforcing that
  per call site is discipline, and the first forgotten site in Phase B
  turns the piggyback into a hook recursion. A single importer makes the
  property structural — the discipline AD-2 applies to `node:sqlite` and
  AD-10 to the deny verdict — and the scan must resolve both
  `'child_process'` and `'node:child_process'`, because a grep for the
  prefixed spelling alone is a convention with a hole (`node:sqlite` has no
  unprefixed spelling; `child_process` does).

- **D-plan-15 — The shallow-clone URL identity is normalized on stated
  axes (scheme dropped, user-info dropped, host lowercased, port kept,
  trailing `/` and `.git` stripped, path case kept) and `status` prints the
  identity string.** *Reasoning.* AD-3 names the normalized URL as the
  shallow-mode key but not the algorithm; the forms git accepts for one
  remote (`ssh://`, scp-like, `https://`, with or without `.git`) must key
  once or the shallow fallback re-opens the split it exists to prevent.
  Path case is not folded because that would merge distinct repositories
  on case-sensitive hosts; the residual (case-insensitive hosts) is made
  visible instead of normalized away.

- **D-plan-16 — The bypass diagnostic's predicate is exactly AD-4's
  enumerated list, and its coverage bound is printed beside its count.**
  *Reasoning.* Every reachable shell write path is an open set; extending
  the list is the padding trap (collapse-log 2026-09-03 round 8: own a
  residual as a class), and the architecture already discloses the
  diagnostic as a proxy with both error directions. The honest floor
  states what the proxy recognizes, so the exit number is read with its
  bound.

- **D-plan-17 — Two test levels per component: a function-level test at
  the step that builds it (real store, real files, no handler), and an
  acceptance replay through the real handler binary keyed to the AC
  (`T-38-*`) at the checkpoint where the handler exists.** *Reasoning.*
  The skill requires each step to be verifiable when built; the
  architecture requires the ACs to be pinned by replay through the real
  binary. Both are met by naming both, and by stating in each step which
  tests run immediately and which run at the checkpoint. `T-25-3` is a
  function-level test of `decideDeny`, which never reads the transcript:
  it pins scope, eligibility, and audit-first, and the hold-then-recover
  sequence is pinned where the order lives — `T-28-1` and `T-38-4` through
  the pipeline.

- **D-plan-18 — Five checkpoints, at the substrate, the function-level
  whisper path, the complete pipeline, the complete acceptance set, and
  the exit report.** *Reasoning.* Each sits at a boundary an unnoticed
  defect would cascade past (schema → every DAO writer; generators → the
  handler; pipeline → every replay; acceptance set → the exit run; exit
  report → the Phase B design input). Each checkpoint names only tests
  that exist and can run at that point; the deny path and the whisper path
  are exercised *together* for the first time at Checkpoint 4, where the
  acceptance set exists, on purpose (D-plan-1).

- **D-plan-19 — The recognizers' unit tests assert the coverage the
  recognizers must NOT have.** *Reasoning.* §11.5 asks for a skeleton whose
  low coverage is measured at exit, and the 2026-09-04 collapse was an
  implementer-side elaboration toward completeness. "Restraint" as an
  instruction is unenforceable; as a test that fails when any sentence
  outside the rule is recognized or a non-mutating tool becomes
  deny-eligible, it is mechanical. The negative assertion is the rule's
  complement over a generated corpus, not a list of four phrasings —
  collapse-log 2026-09-03 round 8 lesson 2 (a completeness claim over an
  open set must be a class predicate, never a list) — and every recognizer
  the spec calls a fallible skeleton carries one: the question recognizer
  (no non-`?` sentence, ever), the clear recognizer (no access to question
  text, so no per-question matching), the done-claim recognizer (no
  paraphrase outside the lexicon), the move recognizer (exactly three
  tools). Widening coverage is then a visible seam change (Phase B), not a
  silent "improvement".

- **D-plan-20 — The wrongful-deny rate carries a fourth component,
  voided-intake rows on which a deny had fired, and `voidQuestion` records
  a `denyFired` flag to count it.** *Reasoning.* AD-17 lists three
  components; AD-9 and T2 add the intake-voiding path for platform-injected
  turns (L11(b)), whose transient wrongful deny is real and would otherwise
  be invisible to the owner. Counting it is the honest measurement §11.5
  asks for; it is a `status` field and a flag in a fault detail, no new
  mechanism and no widening of anything the agent sees.

- **D-plan-21 — The exit report lives at
  `docs/reviews/<date>-phase-a-exit-run.md`.** *Reasoning.* `CLAUDE.md`'s
  routing table sends "output of a review — written once, never edited" to
  `docs/reviews/`, and the exit run is Phase A's acceptance review: it is
  read at Checkpoint 5 against §11.5, it is written once, and the
  project's `check_docs.py` rule that review files are never edited is the
  right discipline for a measurement Phase B is designed from. A new
  directory would be a new-file decision with no rule behind it.

- **D-plan-22 — Test hooks never live in production modules: the watchdog
  takes an injected clock and a deadline argument, the `hook` verb accepts
  `--deadline-ms` for the harness, and fail-open is induced with a real
  corrupted store.** *Reasoning.* An environment-gated branch in a shipped
  module is production code that a stray variable in the owner's
  environment could flip, and `FR-O3`'s silence must not depend on the
  environment; a command-line flag on the internal verb cannot be set by
  the environment and is never written by `init`; a truncated database
  file is a real store failure, not a double.

- **D-plan-23 — The no-egress clauses of AC-11 and AC-19 are asserted
  structurally (no network module and none of the tokens `fetch(`,
  `fetch (`, `globalThis.fetch`, `.fetch` anywhere in `dist/src/**`)
  and, where the platform allows, at runtime inside a network namespace
  with no interfaces.** *Reasoning.* Node consults `HTTP_PROXY`-class
  variables only when `NODE_USE_ENV_PROXY` or `--use-env-proxy` is set
  (v22 documentation; executed 2026-09-07: a proxy listener is never
  contacted either way for a loopback target), so a proxy listener cannot
  observe egress and an assertion on it cannot fail. Phase A makes no
  network call at all (AD-1, spec §10), so the structural scan is the
  property itself; `unshare -rn` on the Linux CI runners gives a runtime
  check the process cannot bypass.
- **D-plan-24 — "Content-free deferral" is operationalized as phrase-strip
  then floor: remove every deferral-stoplist phrase from the stripped turn
  and clear when what remains meets the small floor; the stoplist holds
  multi-word phrases of AD-9's "I'll get to that" class only, and there is
  no other vocabulary and no clause grammar.** *Reasoning.* AD-9 states two
  conditions — above a small floor, not a recognized content-free deferral
  — and FR-B5 sets the lean: toward clearing on a substantive answer, with
  only an empty deferral failing to clear. Each rule richer than AD-9's two
  conditions holds on an answer (executed, `probe:16_clear_rule_cases`): a
  sentence-level discard holds on "No — …, though I'll get to the rest
  later"; a clause-level discard with an acknowledgement lexicon holds on
  "Sure." and "Understood." as whole answers and, with a bare `later` in
  the stoplist, on a causal sentence — an elaboration in the hold
  direction, the wrong error for the clear axis, and one the detector
  exclusion of Step 26 would make invisible to the exit report. Under
  phrase-strip-then-floor the twelve direct answers of the `T-23-2` case
  table all clear, the deferral-only turns do not, and a dressed dodge
  ("Sure, I'll get to that after the refactor.") clears — the skeleton's
  designed under-hold, counted by Step 39's escape fraction and corrected
  through the human channel, exactly as AD-9 files the deferral-false-match
  miss. The rule is executed over the spec's examples, the direct-answer
  class, and the deferral cases by `probe:16_clear_rule_cases` (§11.4).
- **D-plan-25 — `hooks_not_firing` has two detectors — the stale-session
  half (a liveness row whose transcript keeps growing without events) and
  the totally-dead half (transcripts for this repository's slug newer than
  the newest liveness row, or present with none, by more than the gap) —
  and `init` and `status` print the pinned interpreter with an existence
  check.** *Reasoning.* AD-17 and L7 say liveness rows "go stale", which is
  a comparison of the newest row against something newer; a detector that
  examines only sessions with a row cannot see a wiring that never fired.
  The plan's own command shape — `process.execPath` pinned into
  `settings.json` — makes an interpreter upgrade the likeliest total death:
  every hook exits 127, no handler runs, no liveness row is written. OL-10
  is the owner asking to see exactly that, and a silent zero is the
  falsely reported success `CLAUDE.md` rule 1 forbids.
- **D-plan-26 — Leg 2's counted sessions are `claude -p` conversations the
  implementing agent drives from its own environment on clones it
  initialised beforehand, each started with a permission mode and tool
  list that let it edit and with the driver's session-identity scrub;
  nothing is installed inside a session; stores
  and transcripts are local to the report; a counted session must hold a
  `SessionStart` liveness row; each counted session asks one
  `?`-terminated and one indirect question; the floor sample is labelled
  before replay, blind, per leg, against the plan's own rule; every corpus
  carries a declared origin.** *Reasoning.* The hooks reference's
  settings-file rule (§11.4, asserted inside its section) is what decides
  the session kind: a `-p` or SDK session treats the folder as trusted and
  runs the settings-file hooks from its first event, while an interactive
  session holds them back until a dialog no agent can accept; and a
  session created by remote session tooling lives in its own container,
  where a wiring written in one session is not there for the next (G3) and
  a hook written mid-session is undocumented behaviour the plan may not
  assume. A `claude -p` child of the agent's own session, started with
  `--permission-mode acceptEdits` and an `--allowedTools` list (a `-p`
  session can show no permission prompt, so an unapproved edit is denied),
  with Step 5's session-identity set removed by the driver and continued
  with `--resume`, is a session whose hooks are live at its first event,
  that can edit, and whose `session_id` is its own — executed once, §11.4
  — and it needs neither premise: `init` runs before the session, the
  hooks load at its start, and the store and transcript it produces are on
  the machine that writes the report. The liveness row is then a genuine
  observable of live hooks, not a precondition no session can meet. It
  runs in the marker-less transcript mode (V12), so its rebuild path
  recovers nothing and the leg's corpus is declared as its own origin;
  mid-session enforcement there rests on intake (L11). OL-C5 states the trigger ("if i ask a
  question"), not a definition of a question, so the label rule is the
  plan's and is attributed as such; a labeller who can read the store is
  not independent of what it measures; and pooling leg-1 (real) and leg-2
  (protocol-authored) turns into one sample would report neither the real
  floor nor the protocol compliance rate, so the sample is drawn and
  reported per leg. A corpus's origin is a fact about where it came from,
  unknowable from its contents (V12), so it is declared by the run. The
  indirect ask is the intake-miss class the floor exists to measure.
- **D-plan-27 — Every assistant text turn the catch-up classifies is
  recorded in a `classified_turns` table (`consumer`, `uuid`, `ts`,
  `clears`, `reason`), written by Step 25's catch-up beside the clearing
  path and read by Step 26's `deny_loop` and `deny_despite_answer_text`
  detectors.** *Reasoning.* AD-9 defines the two detectors over intervening
  assistant text turns and their rejection reasons across events, while
  each hook event is a fresh process (AD-1) and no Phase A table held a
  classified turn, so a detector in event N could not see a rejection that
  happened in event N−2. Two shapes were weighed: passing the current
  catch-up's classified turns to the detectors and bounding their windows
  to one event loses the cross-event case the detectors are defined over;
  recording each classified turn is one small row per assistant text turn,
  has a same-phase writer (AD-4's uniform-table criterion), and is the only
  shape under which the detectors read state the store actually holds.
  `T-26-1` carries a case whose below-floor turn was recorded two events
  earlier.
- **D-plan-28 — The FTS5 DDL lives in its own migration,
  `001b_phase_a_fts.sql`, applied only when `schema_meta.fts_state =
  'fts5'`; the `LIKE` path's indexes (`symbols_name`, `files_path`) are
  always created by 001; one module, `src/index/search.ts`, exposes
  `symbolSearch` and `pathSearch` with the implementation chosen by
  `fts_state` at call time; the migration runner reads the `.sql` files
  from the package's shipped `src/` tree.** *Reasoning.* AD-2 mandates that
  when the FTS5 probe fails, search falls back to indexed `LIKE`/token-prefix
  queries behind the same interface and `status` says so; a migration that
  creates the virtual tables unconditionally makes `init` fail on a runtime
  without FTS5 after announcing the fallback, and a caller that knows which
  implementation ran is a second interface. Under this shape no caller (the
  indexer, the Orientation and Reuse genres) knows which ran; `T-7-1` runs
  the migrations under both flags and `T-14-1` asserts the same hit set
  under both; shipping the `.sql` files in `src/` (Step 1's `files` list)
  with the runner resolving them from `import.meta.url` means `tsc`, which
  emits no `.sql`, needs no copy step. This is AD-2's own requirement given
  a shape, not a new capability.
- **D-plan-29 — `runIndex` takes its frontend list as an argument; Step 14
  builds and tests the indexer skeleton with an empty list, Step 15 creates
  both frontends and `defaultFrontends()`, and the `index` verb (Step 28)
  and `init` (Step 31) pass that list.** *Reasoning.* AD-12 puts parsing
  behind the `LanguageFrontend` interface with the frontends "mapped by a
  configurable extension→grammar table", so the set of frontends is an
  input of the indexer, not something it hard-wires; and a step consumes
  only what exists when it is built (output-contract item 7, D-plan-1),
  which an indexer that names a module two steps later violates. Reordering
  the two steps satisfies the same rule but renumbers every `T-14-*`/`T-15-*`
  id and every "Step 14/15" mention across the plan for no property the
  argument lacks; leaving the order and moving only the assertions leaves
  the consumption in place. With the list as an argument, Step 14's test
  asserts exactly what Step 14 builds (files, zones, path tokens, the size
  cap, redaction, the lock, the `LIKE`/FTS equivalence over path tokens),
  Step 15's new `T-15-3` asserts what Step 15 adds (symbols, edges,
  `symbol_refs`, `entry_score`, `test_map`, the equivalence over symbol
  tokens), nothing is doubled, and the consumption is visible to the
  build-order check because `defaultFrontends` is a provided name its two
  callers consume with S15 declared. Score (every step consumes only what
  exists; each step's test asserts what it builds; no renumbering; visible
  to the check; nothing doubled): argument 1.0, reorder 0.8, assertions
  only 0.5.

### 10A. Author's collapse-test on each load-bearing decision (`CLAUDE.md` rule 2)

Each entry: (1) the decision's job in mission terms, (2) the hardest
question a mission-literate skeptic would ask to expose it as hollow, (3)
the answer with a citation, (4) what it steers the implementer toward and
confirmation that it is a guide, never a gate. The independent
collapse-hunt attacks these questions harder and hunts for the ones missing.

#### D-plan-1 (build order)

1. **Job.** Sequence the build so the deny fixtures are never the first or
   only correctness gate, and the recognizers are built last against a full
   substrate — so nothing in the build's own attention allocation pushes
   the skeleton toward completeness.
2. **Hardest question.** *Reordering changes nothing about who writes the
   recognizer; an implementer inclined to elaborate will elaborate whether
   the module is Step 14 or Step 23. What in the order actually constrains
   the recognizer's size?*
3. **Answer.** The order alone does not; the order plus D-plan-19 does: the
   recognizer's unit tests assert the rule's complement (spec §11.5 "a
   skeleton, not 'the block working'"; L1 "measured at exit, never
   classified around"), so an elaboration breaks a test the implementer
   wrote the step before. The order's own contribution is narrower and
   stated as such: the first run of any deny fixture happens with the
   whisper path already green and the whole acceptance set in the same run
   (Checkpoint 4), so a failing deny fixture is diagnosed with the whole
   pipeline in view rather than by adding rules to the recognizer in
   isolation. Cite: spec §11.5; L1; §9 Checkpoint 4.
4. **Steers toward.** Building the substrate before consumers, the
   recognizers last, and running the deny and whisper fixtures together.
   **Guide, not gate** — no step polices proceeding to the next.

#### D-plan-2 (dependency pins)

1. **Job.** Build the surface the architecture verified, so a measurement
   taken at exit is a measurement of a known dependency set.
2. **Hardest question.** *Exact pins on a WASM parser freeze a bug-fix
   line; when 0.26.14 fixes a grammar crash the plan forbids taking it.*
3. **Answer.** The plan forbids nothing; it makes the change visible. A
   bump is a one-line change plus re-verifying V14's three properties
   (current, pure WASM, no install scripts — §11.4 shows the read that
   does it), which is the architecture's own verification, and Step 38's
   grammar-inventory check is the regression test for it. Cite: AD-25
   (runtime deps exactly two, no native code); V14.
4. **Steers toward.** Reproducing the verified surface by default.
   **Guide, not gate.**

#### D-plan-3 (test execution)

1. **Job.** Make every "Fails when" clause in §12 a real red run at the
   runtime floor, so the acceptance set is the mechanism it claims to be.
2. **Hardest question.** *A runner that counts files proves files were
   compiled, not that assertions ran; a test file whose body is empty
   passes the guard and passes `node --test`. And a build that includes
   files designed not to compile never gets as far as the runner.*
3. **Answer.** True, and two separate checks cover it: the count guard
   catches the dropped file (the observed vacuous-pass class); the
   convention tests `T-24-2` and `T-3-2` and the replay tests are specified
   with seeded violations that must fail (`T-24-2`, `T-10-3`, `T-28-2`), so a
   hollow assertion in those files is caught by its own seeded case; and
   every §12 entry states its failure condition, which the reviewer checks
   the test against (Gate A item 2). An empty test body is a review defect
   the runner is not claimed to catch. The must-fail fixtures are excluded
   from the project build and compiled one at a time by their tests —
   executed both ways 2026-09-07 (§11.4). Cite: Step 1; §12 "Fails when"
   fields; `references/testing-standards.md` anti-pattern 4.
4. **Steers toward.** Compiling everything once and running from `dist/`
   with the count visible. **Guide, not gate.**

#### D-plan-4 (record-identical comparison)

1. **Job.** Make AC-19 assert what the spec asks — record identity — with
   no system dependency the cold-container discipline would have to
   justify.
2. **Hardest question.** *A `SELECT *` dump compares what the query returns,
   not what the file holds; a corrupted index or a dropped trigger survives
   a row-by-row diff.*
3. **Answer.** AC-19's text is "record-identical", not "structurally
   identical"; the structural surface is covered separately — `import`
   runs `quick_check` on each file before installing it (Step 32), and the
   migration runner re-validates `schema_version` on open. The ordering
   key is stated per table, including the five AD-4 tables without a
   primary key (every column, schema order), so the dump is deterministic
   for the implementer. Cite: spec §14 AC-19; AD-5; Step 32.
4. **Steers toward.** A Node-side per-table dump. **Guide, not gate.**

#### D-plan-5 (generated fixtures)

1. **Job.** Keep the fixture's construction auditable so an AC assertion's
   grounding is diffable, and keep the data forward-derived.
2. **Hardest question.** *A generator written by the same person who
   writes the assertion can plant exactly the history that makes the
   assertion pass — backward fabrication with extra steps.*
3. **Answer.** The generator plants the scenario the AC describes (a
   cross-directory pair co-changing in 5 commits), and the assertion is on
   a value the tool computes from it (the evidence ratio, the pointer)
   that the generator never writes; where an AC asserts silence (AC-1b
   mixed-language), the fixture plants the condition, not the outcome. A
   reviewer reads the generator against the AC's scenario text. Cite:
   `references/testing-standards.md` core discipline (forward-derived
   data) and anti-pattern 3; AD-24's fixture list.
4. **Steers toward.** Reviewing the generator as the fixture's source of
   truth. **Guide, not gate.**

#### D-plan-6 (settings marker)

1. **Job.** Guarantee `deinit` removes exactly what `init` wrote (AC-7)
   under any harness that validates its settings file, so the one in-tree
   write is always reversible.
2. **Hardest question.** *Under `npx` and under the replay runner the
   running script is `dist/src/cli/dispatch.js`; a pattern that requires
   the basename `ctxoracle` matches nothing `init` could write there, so
   `deinit` leaves the entries behind — and if the harness one day changes
   the event name, the same permanence hazard returns.*
3. **Answer.** The command `init` writes names the interpreter and the
   real path of `dispatch.js`, which is what `fs.realpathSync(process.argv[1])`
   resolves to under direct `node`, the `npm -g` symlink, and `npx`
   (executed, §11.4), and the pattern matches that file plus the verb — so
   what `init` writes and what `deinit` matches are the same string in
   every sanctioned mode, and `T-31-1` exercises all three. A renamed event
   is a hooks-contract drift; the adapter discipline (AD-6) localizes the
   read side, and `init`/`deinit` share one `hookEntryPattern` constant so
   the write side is one place too. The hazard the decision removes is the
   strict-validation rejection of the whole file, which no single-place fix
   could recover from because `init` could not write at all. Cite: hooks
   reference 2026-09-07 (entry fields; no unknown-field promise); AD-20;
   AC-7; §11.4 (argv resolution).
4. **Steers toward.** Marker-by-pattern on a documented field. **Guide, not
   gate.**

#### D-plan-7 (plan-seeded thresholds)

1. **Job.** Give every open threshold a value the build can run with, and
   make every measurement that depends on it readable as conditional on
   it.
2. **Hardest question.** *Labelling a guess "plan_seed" does not make it
   less of a guess; the exit numbers are still determined by nine numbers
   nobody measured — and a clear floor of forty characters would deny an
   agent that answered "No." correctly.*
3. **Answer.** Correct — and the spec makes that the design: "the bar
   ships high and is calibrated … the calibration input from Phase A is the
   human CLI correction" (§5.2) and Phase B/C numbers "are set from Phase
   A's exit data" (§11.5). A Phase A exit number is meant to be conditional
   on shipped defaults; what the label adds is that the conditional is
   printed with the number, and `tune` moves it without a recompile. The
   clear floor is 2, not 40: FR-B5 says only an empty deferral fails to
   clear and P3 forbids a format tax, so the floor excludes emptiness and
   nothing else, and `T-38-30` clears on "No.". Cite: spec §5.2, §11.5,
   FR-B5, P3; AD-9 ("a small floor"); AD-14; AD-20.
4. **Steers toward.** Reading the report with its seeds; tuning through the
   CLI. **Guide, not gate.**

#### D-plan-8 (model seam)

1. **Job.** Fix the one Phase B contract Phase A can verify — the
   invocation — so Phase B plugs in without touching the deny path.
2. **Hardest question.** *The envelope's field set is Claude Code's, not the
   oracle's; typing it freezes an undocumented shape that will change with
   the CLI, so Phase B re-verifies anyway — and the scrub the contract
   mandates was never run as shipped, which is the `--bare` class of
   collapse.*
3. **Answer.** Phase B re-verifies V9 regardless (AD-21 makes the
   invocation a verified premise, and premises are re-established per
   phase); what the typed envelope buys is that the *observed* shape is
   recorded at the seam instead of being rediscovered, and the `raw`
   remainder keeps a changed field from breaking the type. The invariants
   in the contract (guard, scrub, no `--bare`, `--tools ""`) are the
   architecture's, not the CLI's. The scrub was executed as shipped —
   three runs, unscrubbed / session-identity set / everything — and the
   contract carries the set the evidence supports, so the premise's
   validating command is the design's command (collapse-log 2026-07-22).
   Cite: AD-21; V9–V11 re-executed 2026-09-07; the scrub runs (§11.4).
4. **Steers toward.** Implementing Phase B's invoker against a recorded
   observation. **Guide, not gate.**

#### D-plan-9 (lag-window hold)

1. **Job.** Realize FR-B1's lag clause without inventing a second lag
   estimator, and measure the wrongful denies the clause knowingly accepts.
2. **Hardest question.** *"Measured, not estimated" is a promise about
   Step 39; between Checkpoint 4 and the exit run the build has no idea
   whether the transient wrongful deny fires on one move in a thousand or
   one in three.*
3. **Answer.** That is exactly the number §11.5 says Phase A exists to
   produce ("how little the conservative recognizer catches", "false-fire
   … data on a real repo"); any plan-time estimate would be the padding the
   collapse-log 2026-09-04 entry forbids. Before the exit run the design
   guarantee is the spec's: every such deny is escapable by one text turn
   and self-recovers on the next catch-up (FR-B1; D-41), and each one is
   counted by `deny_after_answer_lag`. Cite: spec §8 FR-B1 lag clause,
   §11.5; AD-9; collapse-log 2026-08-25 item 5.
4. **Steers toward.** Implementing the hold as read-to-EOF + deny-on-open
   and reporting the rate. **Guide, not gate.**

#### D-plan-10 (exit-run legs and validity rule)

1. **Job.** Make the exit measurement a measurement of the owner's code
   repositories and transcripts, with the replay's structural limit
   stated, so Phase B is designed from the right substrate.
2. **Hardest question.** *Three sessions in a repository the agent chose is
   still noise; the replayed corpus has no ground truth, so any "fraction
   caught" is either the recognizer grading itself or a number the agent
   made up while labelling; and a replay that mounts the stored transcript
   shows the block the answer before the question.*
3. **Answer.** The rule is the invalidity floor, not the sufficiency
   claim; sufficiency is reported, not asserted — the report carries
   session counts, transcript counts, and drivers, and Phase B's
   architecture (written from this report, §11.5) is where "is this enough
   data" is judged, with the report's own numbers in view. The labelled
   sample is drawn per leg and judged against the plan's written rule
   (D-plan-26), labelled before the replay opens any row, not against the
   `?` rule, and the label tables are published, so the estimate is auditable and independent
   of the thing it measures (collapse-log 2026-08-25 item 1); leg 2's
   re-asks and `--missed-question` corrections are ground truth the loop
   itself produces. The per-event transcript prefix is what makes replay
   a measurement of the block rather than of the harness (IDEAS.md #14:
   reconstruct "the `transcript_path` state"). Cite: spec §11.5; IDEAS.md
   #14; collapse-log 2026-08-25; CLAUDE.md lifecycle.
4. **Steers toward.** Installing in real code repositories and reporting
   inputs beside outputs. **Guide, not gate.**

#### D-plan-11 (L11 verifications executed by the build)

1. **Job.** Discharge AD-24's two build-time verifications without handing
   a non-programmer a probe, and without the plan claiming to have
   resolved them.
2. **Hardest question.** *The L11(b) induction lives in the closed-loop
   leg; if leg 2 is driven by Max Cogar in his normal work, the "agent
   executes it" claim is false and the owner is running the probe after
   all.*
3. **Answer.** Leg 2 is agent-driven by construction (D-plan-10,
   D-plan-26), so the induction — two actions and a read of `ctxoracle
   log` — is attempted in every agent-driven session and recorded *not
   performed* where the `claude -p` harness produces no task-notification
   or scheduled-wake turn; a session Max Cogar drives on his own is
   additional, reaches the report through `export`, and its induction is
   recorded as *not performed* rather than asked of him — the report field
   is "fires / does not fire / not observed / not performed", and "not
   observed" leaves L11(b) exactly where the architecture holds it
   (design-safe against a persistent wrongful deny, transient case
   counted). L11(a) is keyed the same way: *verified* only on an
   owner-local interactive transcript, since a remote-container corpus is
   the mode already measured. Cite: AD-24 (build-time verifications);
   AD-9/T2 (voiding guard); L11; `OL-11`.
4. **Steers toward.** Executing the scripts and recording outcomes,
   including "not observed". **Guide, not gate.**

#### D-plan-12 (watchdog kept after the V6 drift)

1. **Job.** Keep every slow event visible to the owner as a
   `latency_breach` instead of a silent harness discard.
2. **Hardest question.** *With the harness no longer blocking the tool on
   timeout, the cooperative deadline is pure cost: 2.5 s of budget thrown
   away where 5 s was available.*
3. **Answer.** `NF-1` is 1.5 s p95 and 3 s ceiling — the 2.5 s deadline is
   already above the p95 target and the harness's 5 s is a discard, not a
   budget; without the internal deadline a 4 s event produces no whisper,
   no deny, and no diagnostic, which `OL-10` names as the failure the owner
   cannot see. Cite: `NF-1`; `FR-O3`; `OL-10`; hooks reference 2026-09-07
   (§4).
4. **Steers toward.** Keeping AD-23's inventory and deadline. **Guide, not
   gate.**

#### D-plan-13 (CI tiers)

1. **Job.** Keep PR feedback fast without letting a replay-only regression
   reach `main` unexamined.
2. **Hardest question.** *The reviewer on an agent-led project is another
   agent — "the reviewer is the gate" is self-graded homework.*
3. **Answer.** That is the project's standing condition for every
   artifact, not this decision's defect; the mitigation this decision owns
   is mechanical and needs no reviewer's memory: from Step 28 the replay
   tier runs in the every-PR `test` job beside the fast tier, so a
   replay-only regression is red on the pull request that introduces it,
   and Checkpoints 3–5 require it green as well. Cite: §9; AD-24;
   collapse-log 2026-08-25 item 3.
4. **Steers toward.** Both tiers on every pull request from the step the
   first replay test exists; the fast tier alone only before that.
   **Guide, not gate.**

#### D-plan-14 (single spawn wrapper)

1. **Job.** Make the recursion guard a property of the codebase, not of
   each author's memory.
2. **Hardest question.** *A wrapper only helps if it is used; a Phase B
   author can `import { spawn } from 'child_process'` — no `node:` prefix —
   and a grep for `node:child_process` never sees it.*
3. **Answer.** `T-5-3` is an import scan that resolves both spellings and
   fails the build on any second importer, in CI on every PR — the same
   mechanism that keeps the deny verdict single-sourced (AD-10) and
   `node:sqlite` single-imported (AD-2; that module has no unprefixed
   spelling, which is why a grep suffices there and not here). Cite:
   AD-21; `FR-J4`; AD-10's structural-confinement precedent.
4. **Steers toward.** One spawn path. **Guide, not gate.**

#### D-plan-15 (URL normalization)

1. **Job.** Keep one repository's knowledge in one store under the shallow
   fallback.
2. **Hardest question.** *Two clones of one repository with different path
   case still split; the "residual is visible" answer means the owner
   discovers the split by noticing two stores — which he will not.*
3. **Answer.** The residual exists only on hosts that ignore path case,
   only in shallow mode, and only when the owner cloned the same remote
   twice with different case; folding case would create the opposite
   defect on every case-sensitive host. The mitigations are the ones AD-3
   already names for keying changes: `status` prints the identity string,
   and `export`/`import` merges. Cite: AD-3 (URL key "mutable but visibly
   recorded, and only used where history cannot be trusted"); L4.
4. **Steers toward.** Normalizing the forms git treats as one remote,
   nothing more. **Guide, not gate.**

#### D-plan-16 (bypass predicate bound)

1. **Job.** Keep the bypass diagnostic an honest proxy whose blind spot is
   printed with its number.
2. **Hardest question.** *"Printed beside the count" is disclosure, not
   measurement; the exit report still cannot say how much Bash drift
   happened.*
3. **Answer.** Correct, and that is L3's owned residual: Bash is never
   denied in Phase A because the protected class is indistinguishable
   model-free (`D-39`), so the diagnostic measures the one shape the
   architecture can see (retry of a denied target through a shell write)
   and says so. Phase B's judgment narrows it. Cite: AD-9 (proxy, both
   directions stated); L3; `D-39`.
4. **Steers toward.** Reporting the bound with the count. **Guide, not
   gate.**

#### D-plan-17 (two test levels)

1. **Job.** Verify each step when it is built and still pin every AC by
   replay through the real binary.
2. **Hardest question.** *Function-level tests on the block seed the store
   directly — they verify the block against a state the block never
   produced, which is the doubled-subject anti-pattern in disguise.*
3. **Answer.** The subject of a function-level test is the function, and
   its collaborators (the store, the transcript file) are real; state is
   seeded through the real DAOs and real transcript fixtures, which is what
   the block reads in production. The end-to-end path — intake producing
   the state the deny reads — is the replay test's subject, and it runs
   through the real binary. Cite: `references/testing-standards.md` (the
   system under test is never doubled; real collaborators); AD-24.
4. **Steers toward.** Naming both levels per step. **Guide, not gate.**

#### D-plan-18 (checkpoint placement)

1. **Job.** Force a re-check of accumulated state at the five boundaries a
   defect would cascade past.
2. **Hardest question.** *Checkpoint 2 has no owner-visible check and runs
   tests the steps already ran — it is ceremony.*
3. **Answer.** Its trigger is the skill's "boundary between structural and
   behavioral": Steps 13–20 are the last point at which a generator's
   headline can be fixed without touching the handler, and the checkpoint
   is where the set of generator tests is confirmed complete against
   AD-15's seven genres (a step-level test cannot see that another step's
   test is missing). Cite: skill Step 10 triggers; AD-15.
4. **Steers toward.** Pausing at five boundaries, not every step. **Guide,
   not gate.**

#### D-plan-19 (negative-coverage tests)

1. **Job.** Make the phase's restraint mechanical.
2. **Hardest question.** *A test that asserts four phrasings are not
   recognized guards four phrasings; an implementer who adds "would you
   check whether X" as a rule breaks nothing. And when Phase B arrives
   every such test is deleted, so the test protected nothing durable.*
3. **Answer.** The assertion is the rule's complement over a generated
   corpus — every sentence without a terminal `?` outside a fence — so a
   fifth phrasing is inside the corpus and breaks the test; the done-claim
   recognizer's negatives are generated from a grammar of paraphrases
   outside the lexicon and the move recognizer's from generated tool-name
   strings (T-18-8, T-23-3), so each is a generating rule, not a list. It protects
   the Phase A measurement, which is the durable thing: the exit report's
   "how little it catches" is only honest if the recognizer at exit is the
   skeleton the spec mandates, and Phase B is designed from that number
   (§11.5). Deleting the tests when Phase B replaces `classify.ts` is the
   seam working as designed (AD-9: a module replacement). Cite: spec
   §11.5; L1; AD-9 Phase B seam; collapse-log 2026-09-03 round 8.
4. **Steers toward.** Treating a coverage "improvement" as a Phase B seam
   change. **Guide, not gate.**

#### D-plan-20 (fourth wrongful-deny component)

1. **Job.** Keep the wrongful-deny rate honest when the wrongful deny came
   from a platform-injected turn the intake could not distinguish.
2. **Hardest question.** *A fourth component the architecture never listed
   is the plan quietly extending the design — the same small-addition
   habit the collapse-log records.*
3. **Answer.** The component counts an event the architecture already
   creates (`intake_invalidated`, AD-9/T2) in the surface the architecture
   already mandates (the wrongful-deny rate, AD-17, FR-M2); nothing new
   fires, nothing new is denied, and the alternative — a wrongful deny
   that the rate omits — is the padded-quiet failure §11.5 forbids. Cite:
   AD-9 catch-up voiding; AD-17 wrongful-deny rate; spec FR-M2.
4. **Steers toward.** Reading the rate with all four components.
   **Guide, not gate.**

#### D-plan-21 (exit report location)

1. **Job.** Put the Phase B design input where the project's information
   policy says a written-once review belongs.
2. **Hardest question.** *A measurement report is not a review; filing it
   under `docs/reviews/` is a category error that the check_docs rule will
   later punish when the report needs a correction.*
3. **Answer.** The exit run is the review of Phase A against §11.5 — it is
   read at Checkpoint 5 with a verdict — and a correction to a measurement
   is a new measurement (another run, another file), which is exactly the
   written-once discipline; the routing table's other rows (STATUS, spec,
   architecture, collapse-log) are each wrong for a dated data report.
   Cite: `CLAUDE.md` routing table; §9 Checkpoint 5.
4. **Steers toward.** One dated report per run. **Guide, not gate.**

#### D-plan-22 (no test hooks in production modules)

1. **Job.** Keep `FR-O3`'s silence independent of the owner's environment.
2. **Hardest question.** *A `--deadline-ms` flag is a test hook with a
   different spelling; production code still carries a path that exists
   only for tests.*
3. **Answer.** The flag is an argument of the internal verb, parsed only
   from the command line `init` writes without it; no environment variable
   the owner's shell could carry reaches it, which is the property `FR-O3`
   needs. The deadline itself is a real parameter of the watchdog (the
   wired value is one argument), not a branch that skips production
   behaviour. Cite: `FR-O3`; AD-23; Step 28's verb signature.
4. **Steers toward.** Parameters over env-gated branches. **Guide, not
   gate.**

#### D-plan-23 (no-egress asserted structurally)

1. **Job.** Make AC-11's and AC-19's "no network" clauses tests that can
   fail.
2. **Hardest question.** *An import scan proves the modules present at
   build time import nothing; a dependency's transitive `fetch` or a
   dynamic `import()` is invisible to it.*
3. **Answer.** Phase A's runtime dependencies are two WASM packages with no
   network code (V14), the scan covers every module under `dist/src/**`
   including the `fetch` tokens (`fetch(`, `fetch (`, `globalThis.fetch`,
   `.fetch`), and the runtime leg — the verbs executed
   inside a network namespace with no interfaces — catches what the scan
   cannot on the platform CI runs on. The rejected proxy listener was
   executed and never contacted (§11.4). Cite: AD-1; spec §10, AC-11,
   AC-19; §11.4 (Node proxy behaviour; `unshare`).
4. **Steers toward.** Asserting the absence at the import graph. **Guide,
   not gate.**

#### D-plan-24 (phrase-strip-then-floor clear rule)

1. **Job.** Let every answer clear the block, including a one-word one,
   while an empty deferral never does.
2. **Hardest question.** *Stripping the phrase and measuring what is left
   means "Sure, I'll get to that after the refactor" clears on "Sure, after
   the refactor" — the dodge OL-C3 named, dressed in five extra words, walks
   through; the recognizer is now blind exactly where the owner asked it to
   look.*
3. **Answer.** Yes — by design, and measured. The spec assigns the clear
   axis its error direction: FR-B5 says err toward clearing, only an empty
   deferral fails to clear, and §11.5 asks Phase A to measure how little
   the conservative recognizer catches; every vocabulary rule that catches
   the dressed dodge holds on real answers (`probe:16_clear_rule_cases`). A
   deny escaped by a text turn is a report field (Step 39), and the human
   channel (`ctxoracle correct`) is where the dodge that matters is filed,
   as AD-9 files the deferral-false-match miss. Cite: FR-B1, FR-B5, P3;
   AD-9 ("not a recognized content-free deferral"); spec §11.5; `AC-2a-ii`.
4. **Steers toward.** Clearing on any answer and counting the escapes.
   **Guide, not gate.**

#### D-plan-25 (totally-dead detector and interpreter pin)

1. **Job.** Make a wiring that never fires visible to the owner at the
   next CLI use — the failure OL-10 was raised for.
2. **Hardest question.** *A transcript newer than the newest liveness row
   is also what a session in another checkout of the same repository, or
   a session that started before `init`, produces; the detector will cry
   wolf and the owner will learn to ignore it.*
3. **Answer.** The detector is scoped to this repository's `cwd` slug and
   compares against the gap the stale-session half already uses, so a
   pre-`init` transcript older than the gap never trips it; a session in
   the same checkout after `init` with no liveness row IS a dead wiring,
   whatever the cause, and the detail names the pinned interpreter and
   whether it exists so the likeliest cause is on the screen. False
   positives are a `status` line, never a deny — the cost of a wrong
   "dead" flag is a look; the cost of a missed one is OL-10's silent
   nothing. Cite: AD-17; L7; OL-10; `CLAUDE.md` rule 1.
4. **Steers toward.** Checking `status` after an environment change.
   **Guide, not gate.**

#### D-plan-26 (leg-2 protocol: `claude -p` sessions the agent drives)

1. **Job.** Make leg 2 an executable measurement of the block on the
   owner's code — sessions whose hooks were live at their first event,
   data that is where the report is written, a floor number the recognizer
   did not grade itself.
2. **Hardest question.** *A `claude -p` conversation driven by the agent
   that built the tool is the tool measuring an agent the tool's author
   scripts: the questions, the edits, and the indirect asks are all shaped
   by someone who knows the recognizer's rule, and the harness that
   produces the L11(b) turns may not exist under `-p` at all.*
3. **Answer.** The protocol does not make the driver disinterested; it
   makes the account checkable and labels what it is: leg-2 numbers are
   reported per leg and marked protocol-driven, the label table and the
   labelling order are published, `ctxoracle status` on each store must
   reproduce the report's numbers (Checkpoint 5), and the induction is
   recorded *not performed* where the `-p` harness gives no
   task-notification or scheduled-wake turn — the owner's interactive
   sessions, listed separately, are where L11(b) is expected to be
   observed. What the agent cannot script is the block's behaviour on a
   real repository's index and the recognizer's floor on turns it did not
   write (leg 1), which is why the two legs are never pooled. The sessions
   edit for real — `acceptEdits` and the tool list are what make the deny
   on a mutation and the Completeness genre reachable — and every counted
   session must show an `ok` edit row, so a session the permission system
   silenced never counts. Cite: spec §11.5; the hooks reference's
   settings-file workspace-trust rule (§11.4); §11.4 (the counted-session
   execution); V11; G3; OL-C5; V12; L11; collapse-log 2026-08-25 item 1.
4. **Steers toward.** Reporting inputs beside outputs and never counting a
   session the hooks did not see. **Guide, not gate.**

#### D-plan-27 (`classified_turns` record)

1. **Job.** Let the deny-health detectors see what the block did across
   hook events, so a wrongful-deny pattern that spans invocations is
   measured rather than lost between processes.
2. **Hardest question.** *A table that records every assistant turn's
   classification is the recognizer keeping a diary about itself; the
   detectors then grade the block on the block's own record, and the
   escape the exit run reports is whatever the recognizer chose to write
   down.*
3. **Answer.** The rows are the recognizer's outputs, and AD-9 defines the
   two detectors over exactly those outputs — a deny with no intervening
   rejected turn, a deny after a turn rejected below the floor — so they
   detect the block's misbehaviour from what it did, which only its own
   record holds. The independent grade is elsewhere: Step 39's labelled
   sample, drawn per leg and labelled blind, measures the recognizer
   against human labels and never against this table. Cite: AD-9
   (`deny_loop`, `deny_despite_answer_text`); AD-1; AD-4; spec §11.5;
   D-plan-26.
4. **Steers toward.** Writing the record where the classification happens
   and reading it where the health is judged. **Guide, not gate.**

#### D-plan-28 (conditional FTS migration, one search interface)

1. **Job.** Keep the oracle useful on a runtime whose SQLite lacks FTS5 —
   the same whisper genres over a slower search — so the deterministic
   foundation never fails to initialise on a machine the owner uses.
2. **Hardest question.** *A fallback no machine in the exit run exercises
   is a code path with a test and no user; the conditional migration
   doubles the schema surface for a case AD-2 could have refused
   outright.*
3. **Answer.** AD-2 chose the fallback over the refusal, and this is the
   smallest shape that honours it: one extra migration applied by one
   flag, two indexes that cost nothing under FTS5, one interface with the
   choice made in one place. `T-7-1` and `T-14-1` run both paths in every
   CI run, so the path has a user on every pull request whether or not
   the exit run's machines lack FTS5, and `status` names the state so the
   owner knows which path he is on. Cite: AD-2;
   `probe:02_sqlite_features` (this runtime's FTS5 state); `T-7-1`,
   `T-14-1`.
4. **Steers toward.** One search interface, with the state visible in
   `status`. **Guide, not gate.**

#### D-plan-29 (the frontend list as an argument of `runIndex`)

1. **Job.** Let the indexer be built and verified before any frontend
   exists, so the structural genres' substrate is real at the step that
   builds it and the frontends are the configured input AD-12 makes them.
2. **Hardest question.** *An indexer verified with no frontends verifies a
   file walker; the property that matters — symbols and edges on real code
   — is asserted one step later, and a Step 14 build that mishandles what
   a frontend returns passes its own test.*
3. **Answer.** That split is the point, not the hole: Step 14's test pins
   what Step 14 builds and can break (the walk, zones, the size cap,
   redaction, the lock, incremental hashing, the path-token search), and
   `T-15-3` runs the same `runIndex` with the real frontends on the same
   fixture the step after, so a mishandled frontend result is red at Step
   15 with the frontends in view — the first step at which it could be
   diagnosed at all. Cite: AD-12 (frontends behind the interface, a
   configurable table); output-contract item 7; D-plan-1; testing-standards
   (real collaborators, nothing doubled).
4. **Steers toward.** Passing the frontend list explicitly at every call
   site. **Guide, not gate.**

---
## 11. Verification of factual claims

Every factual claim this plan depends on, with the read-level evidence that
establishes it. Search tools located; the reads recorded here are the
evidence. All reads are of the documents as they stood on 2026-09-07 in
this session; line numbers are of that revision.

### 11.1 Claims from the spec (`docs/specs/spec-context-oracle.md`)

- **Claim.** Phase A ships the model-free genres, the answer-drift block's
  safe skeleton (deny plumbing + conservative recognizer), stores/index/
  miner, delivery, self-observability, security, and the human-correction
  channel; it exits by producing measured whisper/block, false-fire, and
  regret data on a real repo, including how little the conservative
  recognizer catches; it is the build's test bed on the owner's real repos
  and transcripts, and Phase B and the AD-24 fixtures are designed from
  that discovery. **Steps.** §1, §2, Steps 23, 39. **Evidence.** Read
  `docs/specs/spec-context-oracle.md:739–777` (§11.5). Verbatim: "a
  skeleton, not 'the block working'"; "Exits by producing measured
  whisper/block + false-fire and regret data on a real repo — including how
  little the conservative recognizer catches before Phase B"; "Phase A is
  also the build's test bed. It is run on the owner's real repos and Claude
  Code transcripts".
- **Claim.** In the lag window the block holds rather than pre-clears, on
  the clear-axis only; a wrongful hold self-recovers in one round-trip.
  **Steps.** 25, 26. **Evidence.** Read `docs/specs/spec-context-oracle.md:371–381`
  (FR-B1's lag clause). Verbatim: "While the newest text turn is
  unclassified, the block holds/denies rather than pre-clearing … because a
  wrongful hold self-recovers in one round-trip … The hold governs the
  clear-axis only".
- **Claim.** `updatedInput`/`updatedToolOutput` are never used to mutate; a
  `permissionDecision` deny is emitted only for the two FR-B1 conditions.
  **Steps.** 24. **Evidence.** Read `docs/specs/spec-context-oracle.md:459–466`
  (FR-B3).
- **Claim.** AC-2 is a control-flow assertion (the deny's only call sites
  are the two FR-B1 recognizers), not a field scan. **Steps.** 24.
  **Evidence.** Read `docs/specs/spec-context-oracle.md:932–939` (AC-2).
- **Claim.** AC-2c's answer-drift over-fire clause: an agent that answered
  (reworded) is not denied, and a `Read`/search while a question is open is
  not denied; the substantive-vs-deferral discrimination is Phase B.
  **Steps.** 25, 38. **Evidence.** Read `docs/specs/spec-context-oracle.md:979–999`
  (AC-2c) and `:1122–1130` (the phase split).
- **Claim.** AC-8's content assertion: the whisper must headline the
  covering-test → changed-region mapping; run-state alone fails. **Steps.**
  18, 38. **Evidence.** Read `docs/specs/spec-context-oracle.md:1017–1023`.
- **Claim.** AC-8a chains two conservative recognizers and is best-effort.
  **Steps.** 27. **Evidence.** Read `:1024–1034`.
- **Claim.** AC-19 asserts record-identical stores after export/import and
  no network egress. **Steps.** 32. **Evidence.** Read `:1087–1089`.
- **Claim.** AC-18's bar is delivering the seeded facts, not a whisper
  count. **Steps.** 38, 39. **Evidence.** Read `:1081–1086`.
- **Claim.** The bar is a conjunction with no volume/count/budget term;
  uncertain hazards are spoken flagged; the bar ships high and Phase A's
  calibration input is the human correction. **Steps.** 12, 16.
  **Evidence.** Read `:231–255` (§5.2 FR-A5, FR-A5a, "The bar ships high
  and is calibrated").
- **Claim.** The spec lifts no fixed ROSE operating point; illustrative
  numbers are tunable defaults set on Phase A data. **Steps.** 12.
  **Evidence.** Read `:568–574`.
- **Claim.** `NF-1` is p95 ≤ 1.5 s, ceiling 3 s; `FR-O3` is fail open,
  fast, with no deny on a block path. **Steps.** 29. **Evidence.** Read
  `:504–506` and `:531–535`.
- **Claim.** `C-3` forbids a native toolchain and prebuilt-binary downloads.
  **Steps.** 1. **Evidence.** Read `:526–528`.
- **Claim.** The CLI minimum verb set is `init`, `deinit`, `index`,
  `status`, `log`, `correct`/`note`. **Steps.** 31–35. **Evidence.** Read
  `:583–585` (§10).
- **Claim.** `FR-L4`'s regret proxy must exist and is the architect's;
  scoped to held-but-unspoken facts. **Steps.** 30. **Evidence.** Read
  `:649–666`.
- **Claim.** `D-39` protects reads, searches, and test/build runs from
  denial; `D-41` phases the block; `D-38` makes done-claim recognition a
  classification that errs toward silence. **Steps.** 18, 23, 25.
  **Evidence.** Read `:850–872`.
- **Claim.** `P9`: no feature is primary. **Steps.** §7 ordering.
  **Evidence.** Read `:148–150`.

### 11.2 Claims from the architecture (`docs/architecture-phase-a.md`)

- **Claim.** V1: `transcript_path` is written asynchronously and may lag.
  **Steps.** 21, 25. **Evidence.** Read `docs/architecture-phase-a.md:125`;
  re-read in the hooks reference 2026-09-07 (§11.4).
- **Claim.** V3: Stop/SubagentStop `additionalContext` bounded by
  `stop_hook_active` and an 8-continuation cap. **Steps.** 20.
  **Evidence.** Read `:127`.
- **Claim.** V5: `UserPromptSubmit` carries `prompt`; `SessionStart.source ∈
  {startup, resume, clear, compact, fork}`. **Steps.** 20, 25, 27.
  **Evidence.** Read `:129`; `prompt` re-read in the hooks reference
  2026-09-07 (§11.4).
- **Claim.** V6 recorded that a timed-out `PreToolUse` hook prevents the
  tool from running. **Steps.** §4, 29. **Evidence.** Read `:130`. This
  row is superseded on that clause by the 2026-09-07 read in §11.4.
- **Claim.** V7: FTS5 in stock `node:sqlite` from v22.16.0 (0 `FTS5`
  matches in `sqlite.gyp` at v22.15.0, 1 at v22.16.0). **Steps.** 1, 2, 3.
  **Evidence.** Read `:131`; re-executed 2026-09-07 (§11.4).
- **Claim.** V8: cold spawn 45–54 ms; store work ~2 ms; integrity check
  543 ms on a 410 MB store. **Steps.** 3, 9, 29. **Evidence.** Read `:132`.
- **Claim.** V9/V10/V11: the piggyback invocation works with `--tools ""`
  and `--max-turns 1`; `--bare` severs auth; `--tools ""` disables all
  tools. **Steps.** 36. **Evidence.** Read `:133–135`; V9 re-executed
  2026-09-07 (§11.4).
- **Claim.** V12: three kinds of string-content user entries; human turns
  carry `origin.kind:"human"` and no `isMeta`; markers are mode-dependent.
  **Steps.** 21, 27. **Evidence.** Read `:136`; re-measured 2026-09-07
  (§11.4).
- **Claim.** V13: a shallow clone's `--max-parents=0` set varies per clone.
  **Steps.** 5. **Evidence.** Read `:137`.
- **Claim.** V14: `web-tree-sitter` 0.26.13 and `tree-sitter-wasms` 0.1.13
  are pure WASM with no install scripts. **Steps.** 1, 15. **Evidence.**
  Read `:138`; re-read from the registry 2026-09-07 (§11.4).
- **Claim.** V17: `VACUUM INTO` round-trips on `node:sqlite`; the
  module-level `sqlite.backup()` arrived in v22.16.0. **Steps.** 3, 32.
  **Evidence.** Read `:141`; re-executed 2026-09-07 (§11.4).
- **Claim.** V19: `PostToolUse` is success-only; `PostToolUseFailure` fires
  on execution failure and never on a pre-execution rejection. **Steps.**
  28, 30. **Evidence.** Read `:143`.
- **Claim.** AD-2: `stores/adapter.ts` is the only `node:sqlite` importer;
  FTS5 probed at `init` with an announced `LIKE` fallback. **Steps.** 2, 3.
  **Evidence.** Read `:325–364`. Verbatim: "the only file allowed to import
  node:sqlite"; "FTS5 is still probed at init".
- **Claim.** AD-3: the identity rule (root-commit / normalized URL /
  realpath), `status` shows key and mode, init performs no fetch.
  **Steps.** 5. **Evidence.** Read `:366–415`. The URL normalization
  algorithm is not specified there (the plan's D-plan-15).
- **Claim.** AD-4: the schema, the `q_open_dedup` open-scoped index, the
  table-creation criterion, and the `observed_actions` consumer filter
  including the path-write predicate list. **Steps.** 7, 18, 26, 30.
  **Evidence.** Read `:417–566`; the predicate list at `:516–528`
  ("redirection > / >>, tee, in-place edit sed -i / perl -i, copy/move/
  install to a path"); the criterion at `:540–549`.
- **Claim.** AD-5: global tables, per-project watermark fold at `correct`
  and `SessionEnd`, `VACUUM INTO` export, `tuning` row shapes. **Steps.** 8,
  12, 30, 32, 35. **Evidence.** Read `:568–645`.
- **Claim.** AD-6: the eight wired events, `.claude/settings.json`,
  `"timeout": 5`, a `"ctxoracle"` marker on each entry, the adapter as the
  only file naming hook fields, `PostToolUseFailure` observation-only.
  **Steps.** 28, 31. **Evidence.** Read `:647–690` and AD-20 `:1377–1412`
  ("hook wiring into `.claude/settings.json` with a `"ctxoracle"` marker on
  each entry").
- **Claim.** AD-7/AD-8: exit 0 always; fixed pipeline order; catch-up before
  the block check; audit before emit. **Steps.** 28. **Evidence.** Read
  `:692–734`.
- **Claim.** AD-9: intake from the `prompt` field; catch-up rules; the
  deny-eligible set `{Write, Edit, NotebookEdit}`; the lag-window hold as
  the consequence of the classified state ("The clear-state is whatever
  the classified transcript shows"); the four detectors; the Stop-time
  backstop and counter; question lifetime by `source`; the Phase B seam.
  **Steps.** 22, 23, 25, 26, 27. **Evidence.** Read `:736–922`: intake
  `:747–760`, catch-up `:762–788`, deny decision `:790–804`, lag hold
  `:812–826`, backstop `:828–839`, deny-loop and bypass `:841–850`, lifetime
  `:852–867`, seam `:869–879`. The clear recognizer's floor is "a small
  floor" and `deny_despite_answer_text`'s N is "(tunable)" with no value —
  plan-seeded (D-plan-7).
- **Claim.** AD-10: one producer of `permissionDecision`; the structural
  test by import graph and built-output grep; no `updatedInput`/
  `updatedToolOutput` in any response type. **Steps.** 24. **Evidence.**
  Read `:924–945`.
- **Claim.** AD-11: marker-based discrimination; frozen-open on
  `transcript_layout_changed`; main consumer only. **Steps.** 21.
  **Evidence.** Read `:947–995`.
- **Claim.** AD-12: indexer outputs, zone rules, size caps, detached
  refresh with a lock file and `CTXORACLE_INTERNAL=1`. **Steps.** 14, 15.
  **Evidence.** Read `:997–1041`.
- **Claim.** AD-13: miner hygiene and defaults (30 entities; 5 years or
  10,000 commits; corpus floor 30). **Steps.** 12, 13. **Evidence.** Read
  `:1043–1071`.
- **Claim.** AD-14: the conjunction, the hazard path, the ship-high
  defaults (0.6 with support ≥ 3; read-context band ≥ 2; noise floor
  support ≥ 2), calibration input is the human channel. **Steps.** 12, 16.
  **Evidence.** Read `:1073–1128`.
- **Claim.** AD-15: per-genre triggers and headlines; Reuse dominance
  "≥ k×, tunable"; the ternary `command_class` with per-segment splitting
  and the weaker claim; the done-claim recognizer; landmine classes
  `revert_chain` (≥ 2) and `fix_chatter` ("≥ k … k tunable"). **Steps.** 13,
  17, 18. **Evidence.** Read `:1130–1177`. `k` for dominance and
  `fix_chatter` has no stated value — plan-seeded (D-plan-7).
- **Claim.** AD-16: per-consumer dedup sets, `D-20` reconciliation table,
  Stop-time delivery honoring `stop_hook_active`. **Steps.** 20.
  **Evidence.** Read `:1179–1211`.
- **Claim.** AD-17: the fault-code enumeration; reserved codes rendered
  "not yet measured"; correct silence rendered only in `status`; latency
  p50/p95/max. **Steps.** 6, 10, 33. **Evidence.** Read `:1213–1280`.
- **Claim.** AD-18: `correct`/`note` semantics, `--missed-question` through
  the same recognizer, the collision messages, the regret proxy's two
  reads and relevance test. **Steps.** 30, 34, 35. **Evidence.** Read
  `:1282–1327`.
- **Claim.** AD-19: pointer-only composition in Phase A; redaction at every
  ingress. **Steps.** 11, 19. **Evidence.** Read `:1329–1375`.
- **Claim.** AD-21: the seam is the V9 invocation run with
  `CTXORACLE_INTERNAL=1`, cwd outside the repo, scrubbed environment;
  `--bare` banned; every spawned process carries the variable; the probe
  cache is Phase B's. **Steps.** 5, 36. **Evidence.** Read `:1414–1445`.
- **Claim.** AD-23: cooperative deadline and the blocking-call inventory;
  `HEAD` is a `.git` file read; commit pointers re-resolve against the
  store. **Steps.** 14, 19, 29. **Evidence.** Read `:1472–1511`.
- **Claim.** AD-24: `node:test` tiers; the fixture list; the answer-drift
  cases; two build-time verifications (marker presence on the owner's real
  transcripts; whether platform-injected turns fire `UserPromptSubmit`);
  a byte-compare is pinned nowhere. **Steps.** 1, 37, 38, 39. **Evidence.**
  Read `:1513–1628`; the build-time verifications at `:1602–1609`.
- **Claim.** AD-25: two runtime deps, no postinstall, `tsc` only,
  forward-only migrations. **Steps.** 1, 7. **Evidence.** Read `:1630–1648`.
- **Claim.** AD-26: WAL + `busy_timeout` 100 ms + retry-once + fail-open
  with `store_busy`; reindex directory lock; ULIDs; the fold in one
  `BEGIN IMMEDIATE`. **Steps.** 3, 9, 14, 30. **Evidence.** Read
  `:1650–1673`.
- **Claim.** L1, L3, L6, L8, L10, L11 as cited in Steps 5, 15, 18, 23, 26,
  38, 39. **Evidence.** Read `:1911–1929` (L1), `:1935–1948` (L3),
  `:1955–1978` (L6), `:1984–1992` (L8), `:2000–2006` (L10), `:2008–2027`
  (L11).
- **Claim.** T2's analysis: an intake row matched by an affirmatively
  non-human marker is voided; the marker-absent class is escapable and
  counted when corrected. **Steps.** 22, 25. **Evidence.** Read `:1746–1792`.

### 11.3 Claims from the ledger (`OWNER-LEDGER.md`)

- **Claim.** OL-C1 forbids arbitrary volume/count/budget caps. **Steps.**
  16. **Evidence.** Read `OWNER-LEDGER.md:66`. Verbatim from Max Cogar:
  *"either the information its giving the agent is important, or its not.
  at no point should an arbitrary limit influence how that operates."*
- **Claim.** OL-C3 confirms the answer-drift block. **Steps.** 25.
  **Evidence.** Read `:68`.
- **Claim.** OL-C5 defines the trigger. **Steps.** 23, 25. **Evidence.**
  Read `:70`. Verbatim: *"if i ask a question and their next move isnt a
  direct answer or them taking actions to provide an answer, then then need
  corrected."*
- **Claim.** OL-11: agent-led; Max Cogar starts/ends sessions, suggests
  features, speeds up testing; non-programmer by design. **Steps.** 31, 33,
  39. **Evidence.** Read `:49`.
- **Claim.** OL-7: no separate credentials, ever. **Steps.** 36.
  **Evidence.** Read `:45`.
- **Claim.** OL-10: self-observability is required. **Steps.** 29, 33.
  **Evidence.** Read `:48`.
- **Claim.** OL-C6 signs off the spec. **Steps.** §3. **Evidence.** Read
  `:71`.

### 11.4 Claims from external sources and executions, 2026-09-07

- **Claim.** Type stripping is enabled by default from Node v22.18.0 and is
  experimental behind `--experimental-strip-types` from v22.6.0; v22.16.0
  was released 2025-05-21 and v22.18.0 on 2025-07-31. **Steps.** 1.
  **Evidence.** Fetched
  `https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md`
  and read lines 1200–1218 ("## 2025-07-31, Version 22.18.0 … #### Type
  stripping is enabled by default … This feature is experimental and is
  subject to change. Disable it by passing `--no-experimental-strip-types`")
  and line 1697 ("## 2025-05-21, Version 22.16.0") — `probe:12_node_changelog_type_strip.optional`. Documentation read via
  Context7 `/websites/nodejs_latest-v22_x_api` (`cli` page): "Type stripping
  is enabled by default as of v22.18.0. This flag was added in v22.6.0";
  (`typescript` page): enums, parameter properties, and namespaces with
  runtime code require `--experimental-transform-types`; Node does not read
  `tsconfig.json`.
- **Claim.** `node --test` accepts quoted glob patterns; by default it
  searches JavaScript files and adds TypeScript files only when type
  stripping is enabled. **Steps.** 1. **Evidence.** Context7
  `/websites/nodejs_latest-v22_x_api` (`test` page): "You can also provide
  specific glob patterns … By default, it searches for JavaScript files,
  and if experimental type stripping is enabled, it also includes TypeScript
  files."
- **Claim.** A `node --test` pattern that matches nothing exits 0 with zero
  tests. **Steps.** 1. **Evidence.** Executed on Node v22.22.2:
  `node --test 'dist/test/nomatch/**/*.test.js'` → `# tests 0 … exit=0`;
  a matching quoted glob ran 1 test (`probe:01_node_test_empty_glob`).
- **Claim.** Under the Step 1 tsconfig, a `const enum` cannot be
  enumerated at runtime from the same compilation, while an `as const`
  tuple can. **Steps.** 6. **Evidence.** Executed 2026-09-07 in the layout
  reproduction with `typescript` 5.9.3: a module declaring `export const
  enum FaultCode {…}` compiled, but a sibling module calling
  `Object.values(FaultCode)` failed with `TS2475: 'const' enums can only be
  used in property or index access expressions…`; the `as const` tuple in
  the same module compiled and printed its two members at runtime
  (`probe:04_const_enum`).
- **Claim.** `fs.readdirSync(dir, {recursive: true})` and
  `import.meta.resolve()` are available to the runner and the frontend
  loader. **Steps.** 1, 15. **Evidence.** Both are documented in the Node
  v22.x API pages (`fs` and `esm` pages via Context7
  `/websites/nodejs_latest-v22_x_api`, read 2026-09-07); executed on Node
  v22.22.2 inside the layout by `probe:10_readdir_import_meta_resolve`:
  `readdirSync recursive finds nested test file: true` and
  `import.meta.resolve grammar from inside the package: true` (a
  `tree-sitter-wasms/out/*.wasm` grammar resolved from a module inside the
  package). The 22.16.0 floor is not executed in this environment; CI's
  floor entry (Step 1) is the check that establishes it.
- **Claim.** On this runtime an FTS5 virtual table creates and answers a
  `MATCH` query; `ENABLE_FTS5` is in `PRAGMA compile_options`; the bundled
  SQLite library is at or above 3.37, the floor for STRICT tables (VACUUM
  INTO needs 3.27); WAL, `busy_timeout` 100, and STRICT rejection behave
  as Step 3 states; `VACUUM INTO` round-trips a row;
  `DatabaseSync.prototype.backup` is undefined while the module-level
  `backup` is a function. The exact library version is a property of the
  Node build, not of the plan (3.51.2 under v22.22.2 in this sandbox,
  3.51.3 under v22.23.2 on the `ubuntu-24.04` runner), so the probe reports
  it on stderr and asserts only the floor. **Steps.** 2, 3, 32.
  **Evidence.** Executed `probe:02_sqlite_features` on Node v22.22.2,
  2026-09-07, which prints exactly: `fts5 MATCH rows: 1`, `sqlite_version
  >= 3.37 (STRICT since 3.37, VACUUM INTO since 3.27): true`, `ENABLE_FTS5
  compiled: true`, `journal_mode: wal busy_timeout: 100`, `STRICT
  text-into-INT: rejected`, `VACUUM INTO round-trip rows: 1`,
  `DatabaseSync.prototype.backup: undefined | module-level backup:
  function`.
- **Claim.** The hooks reference documents the settings hook entry fields
  (`type`, `command`, `args`, `timeout`, `statusMessage`, `if`, `once`,
  `async`, `asyncRewake`, `shell`; `url`/`headers`/`allowedEnvVars` for
  http; `server`/`tool`/`input` for mcp_tool; `prompt`/`model` for prompt/
  agent), makes no statement that unknown fields are tolerated, lists three
  settings-file locations (`~/.claude/settings.json`,
  `.claude/settings.json`, `.claude/settings.local.json`), documents
  `UserPromptSubmit`'s `prompt` field and describes the event as "When you
  submit a prompt, before Claude processes it" (silent on injected turns),
  states the timeout semantics, states the event cadences (once per
  session: `SessionStart`, `SessionEnd`; once per turn: `UserPromptSubmit`,
  `Stop`, `StopFailure`; on every tool call: `PreToolUse`, `PostToolUse`),
  states, in its "Workspace trust" section, the settings-file rule — "Interactive
  session: Claude Code holds back hooks from every settings file … until
  you accept the workspace trust dialog for the folder"; "-p or SDK
  session: Claude Code never shows the dialog and treats the folder as
  trusted, so hooks committed in a repository's .claude/settings.json run
  in a folder you've never trusted" — while the sentence "A -p session
  doesn't count as accepting it" belongs to a different, stricter rule in
  the "Hooks in skills and agents" section (project *subagent frontmatter*
  hooks), and states the Stop `additionalContext` loop protection
  (`stop_hook_active` and the 8-consecutive-continuation cap). **Steps.**
  §4, 20, 25, 28, 29, 31, 39.
  **Evidence.** Fetched `https://code.claude.com/docs/en/hooks` 2026-09-07
  (2,821,561 bytes; each passage re-fetched and asserted inside its own
  section by `probe:13_hooks_reference.optional`) and read the timeout and common-fields passages
  verbatim: "a `command`, `http`, or `mcp_tool` hook that reaches its
  `timeout`, discarding the hook's output, so on most events a timed-out
  hook renders no decision"; "On `PreToolUse`, by contrast, a timed-out
  command hook lets the tool call continue"; "`transcript_path` … The
  transcript file is written asynchronously and may lag the in-memory
  conversation, so it may not yet include the current turn's most recent
  messages when a hook fires."
- **Claim.** `web-tree-sitter` 0.26.13 was published 2026-08-23 and 0.27.0
  (current) on 2026-08-30; 0.26.13 declares no runtime dependencies and
  only build/lint/test/prepack/postpack/prepublishOnly scripts (no
  install-phase script). `tree-sitter-wasms` 0.1.13 (current) was published
  2025-10-07, has a `build` script only, and declares a dependency on
  itself (`tree-sitter-wasms: ^0.1.11`, satisfied by the package itself on
  install). **Steps.** 1, 15. **Evidence.** `npm view web-tree-sitter@0.26.13
  version dependencies scripts dist.tarball` and `npm view web-tree-sitter
  time --json`; `npm view tree-sitter-wasms@0.1.13 …`; read 2026-09-07
  (`probe:17_npm_registry_versions.optional`).
- **Claim.** `typescript` 5.9.3 (2025-09-30) is the last 5.x release;
  7.0.2 was published 2026-07-08 and is current; `@types/node` 22.20.1 is
  the current 22.x line. **Steps.** 1. **Evidence.** `npm view typescript
  time --json` (entries "5.9.3": "2025-09-30…", "7.0.2": "2026-07-08…";
  later entries are `7.1.0-dev.*`); `npm view @types/node@22 version`
  (last: 22.20.1); read 2026-09-07 (`probe:17_npm_registry_versions.optional`).
- **Claim.** TypeScript 7.0 is a native (Go) port that removed `baseUrl`,
  `moduleResolution: node/node10/classic`, `module: amd/umd/systemjs/none`,
  `target: es5`, `downlevelIteration`, and disabling `esModuleInterop`/
  `alwaysStrict`; `strict` and `noUncheckedSideEffectImports` default on;
  released 2026-07-08. **Steps.** 1. **Evidence.** Fetched
  `https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/`
  2026-09-07 and read the removed/changed-options list.
- **Claim.** SQLite's `VACUUM INTO` works the same way as `VACUUM`, which
  rebuilds and repacks the database file and may change ROWIDs of tables
  without an explicit INTEGER PRIMARY KEY; the INTO target must not exist
  or be empty. **Steps.** 32. **Evidence.** Fetched
  `https://sqlite.org/lang_vacuum.html` 2026-09-07; read "The VACUUM command
  rebuilds the database file, repacking it into a minimal amount of disk
  space", "The VACUUM INTO command works the same way except that it uses
  the file named on the INTO clause", "The VACUUM command may change the
  ROWIDs of entries in any tables that do not have an explicit INTEGER
  PRIMARY KEY".
- **Claim.** The V9 invocation still works with no `ANTHROPIC_API_KEY` in
  the environment and returns a JSON envelope; without an environment scrub
  the child reports the parent session's `session_id`. **Steps.** 36.
  **Evidence.** Executed 2026-09-07 from `/tmp/v9probe` with
  `CTXORACLE_INTERNAL=1 claude -p --model claude-haiku-4-5 --tools ""
  --max-turns 1 --output-format json "Reply with exactly the word ok"`
  (env has 0 `ANTHROPIC_API_KEY` entries): `"is_error":false,
  "num_turns":1, "subtype":"success", "result":"ok",
  "session_id":"f37d10bc-406a-52ca-ac50-2f259a7a9b29"` (this session's id),
  `"duration_ms":1568, "total_cost_usd":0.0049…`, plus `usage`,
  `modelUsage`, `permission_denials`, `terminal_reason`; wall 3.658 s.
- **Claim.** The shipped seam command authenticates under the Step 5 scrub
  and reports a fresh `session_id`; the session-identity set is
  sufficient; the environment carries routing variables the scrub keeps.
  **Steps.** 5, 36. **Evidence.** Executed 2026-09-07 by
  `probe:15_claude_p_scrub.optional` — `claude -p "Reply with the single
  word OK" --model claude-haiku-4-5-20251001 --tools "" --max-turns 1
  --output-format json` from inside this session, three ways, printing:
  `unscrubbed: is_error=False session=parent`; `session-identity scrub:
  is_error=False session=fresh` (the six variables `CLAUDECODE`,
  `CLAUDE_CODE_SESSION_ID`, `CLAUDE_CODE_REMOTE_SESSION_ID`,
  `CLAUDE_CODE_CHILD_SESSION`, `CLAUDE_PID`, `CLAUDE_CODE_ENTRYPOINT`
  removed); the count of `CLAUDE_*`/`ANTHROPIC_*` variables present and
  whether `ANTHROPIC_BASE_URL` is among them; and `every
  CLAUDE_*/ANTHROPIC_* removed: is_error=False session=fresh` — the wider
  scrub also authenticates here, which is why D-plan-8 keeps the narrower
  set that the piggyback's routing variables survive.
- **Claim.** A leg-2 counted session — `claude -p` with `--permission-mode
  acceptEdits --allowedTools "Write,Read"`, the six-variable
  session-identity set removed, in a folder never trusted whose
  `.claude/settings.local.json` carries logging hooks — runs the
  settings-file hooks from `SessionStart {source: startup}`, executes a
  `Write` (`PreToolUse` and `PostToolUse` fire, the file exists,
  `permission_denials` is empty), reports a `session_id` that is not the
  driving session's, continues under `--resume` with `SessionStart
  {source: resume}`, and leaves a transcript at
  `~/.claude/projects/<slug>/<session_id>.jsonl` whose human turns carry
  no `origin` and no `isMeta`. **Steps.** 21, 39. **Evidence.** Executed
  once 2026-09-07 from inside this session (no probe, by the owner's
  instruction), the driver's environment being `env -u CLAUDECODE -u
  CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_REMOTE_SESSION_ID -u
  CLAUDE_CODE_CHILD_SESSION -u CLAUDE_PID -u CLAUDE_CODE_ENTRYPOINT`:
  `claude -p "Create a file named hello.txt in the current directory
  containing the single word hi, then reply with the single word done."
  --model claude-haiku-4-5-20251001 --permission-mode acceptEdits
  --allowedTools "Write,Read" --max-turns 4 --output-format json` → exit
  0, `is_error=False num_turns=2 subtype=success result='done'
  permission_denials=[] session_id_equals_parent=False`; `hello.txt
  exists: yes, content='hi'`; hook events in order `SessionStart startup,
  PreToolUse Write, PostToolUse Write, Stop`. Then `claude -p --resume
  <session_id> "Reply with the single word ok." …` (same flags) → exit 0,
  `is_error=False result='ok' same_session_id=True`; hook events
  `SessionStart resume, Stop`. The transcript existed at
  `~/.claude/projects/<slug>/<session_id>.jsonl` with human string turns by
  `(origin.kind, isMeta)` = `[((None, None), 2)]`.
- **Claim.** A must-fail TypeScript fixture inside the project's `include`
  turns `tsc -p` red; with `"exclude": ["test/build/fixtures"]` the build
  is green and a per-fixture `tsc --noEmit` invocation still fails on the
  fixture and passes on a valid one. **Steps.** 1, 9, 11, 24.
  **Evidence.** Executed 2026-09-07 in the layout reproduction with
  `typescript` 5.9.3: `test/build/fixtures/bad.ts` (`export const x:
  number = "not a number";`) → `npx tsc -p tsconfig.json` printed `TS2322`
  and exited 2; after adding the `exclude`, exit 0 and no
  `dist/test/build/fixtures/`; `npx tsc --noEmit --strict --target ES2022
  --module NodeNext --moduleResolution NodeNext --verbatimModuleSyntax
  --types node test/build/fixtures/bad.ts` → `TS2322`, exit 2; the same
  command on a valid fixture → exit 0 (`probe:03_tsc_exclude_fixture`).
- **Claim.** `fs.realpathSync(process.argv[1])` is the real path of
  `dist/src/cli/dispatch.js` under direct `node`, an `npm install -g`
  symlink, and `npx`; `process.argv[1]` itself keeps the link name;
  `process.execPath` is the interpreter's absolute path. **Steps.** 31,
  32. **Evidence.** Executed 2026-09-07 in the layout by
  `probe:06_argv_realpath`, a `dispatch.js` printing the basename of
  `process.argv[1]`, whether `fs.realpathSync(process.argv[1])` ends with
  `dist/src/cli/dispatch.js`, and whether `process.execPath` is absolute,
  under four invocation modes — direct `node` (`argv1_basename:
  "dispatch.js"`), a symlink shim named `ctxoracle`, an `npm install -g`
  into a prefix, and `npx --yes --package=<the packed tarball> ctxoracle`
  (each `argv1_basename: "ctxoracle"`) — with `real_endswith: true` and
  `execPath_absolute: true` in every mode.
- **Claim.** Node consults `HTTP_PROXY`/`HTTPS_PROXY` only when
  `NODE_USE_ENV_PROXY=1` or `--use-env-proxy` is set, and a proxy listener
  is not contacted for a loopback target either way; a network namespace
  with no interfaces is available on this Linux runner. **Steps.** 32.
  **Evidence.** Node v22.x documentation via Context7
  `/websites/nodejs_latest-v22_x_api` (`cli` page, read 2026-09-07): "When
  `NODE_USE_ENV_PROXY` is enabled (set to '1'), Node.js parses `HTTP_PROXY`,
  `HTTPS_PROXY`, and `NO_PROXY` … can also be enabled with the
  `--use-env-proxy` command-line flag". Executed 2026-09-07 on v22.22.2: a
  `net` listener on 127.0.0.1 with `HTTP_PROXY`/`HTTPS_PROXY` pointed at it
  and `fetch('http://198.51.100.1:80/')` → `TimeoutError`, listener never
  contacted; the same with `NODE_USE_ENV_PROXY=1` → `[UNDICI-EHPA]`
  experimental warning, `TimeoutError`, listener never contacted
  (`probe:08_node_proxy_env`). `unshare -rn node -e
  "fetch('http://example.com')…"` → `no network: EAI_AGAIN`
  (`probe:09_unshare_no_network.optional`).
- **Claim.** `unshare -rn` is refused on the `ubuntu-24.04` GitHub Actions
  runner: writing the unprivileged user namespace's `uid_map` fails with
  `Operation not permitted`. **Steps.** 32, 38. **Evidence.** The plan's
  own CI job (`.github/workflows/context-oracle-docs.yml`, `check-plan`,
  run 34151517903 on 2026-09-07) executed
  `probe:09_unshare_no_network.optional` and printed `SKIPPED: unshare
  refused or behaved unexpectedly: unshare: write failed
  /proc/self/uid_map: Operation not permitted`; in this sandbox the same
  probe prints `no network: EAI_AGAIN`.
- **Claim.** Claude Code keeps a project's transcripts under
  `~/.claude/projects/<slug>/`, where `<slug>` is the project directory's
  absolute path with every `/` replaced by `-`. **Steps.** 21, 33.
  **Evidence.** Observed 2026-09-07: this session's transcript is
  `/root/.claude/projects/-home-user-agent-armory/<session>.jsonl` for the
  project directory `/home/user/agent-armory` — one observation of an
  undocumented layout (V12), held in `locate.ts` alone so a change is one
  edit and reported by `status` as "no transcript directory found" when
  the derived directory does not exist.
- **Claim.** `tree-sitter-wasms` 0.1.13 ships its grammars under `out/`
  with no `exports` map, resolvable by `import.meta.resolve`;
  `web-tree-sitter` 0.26.13 exposes `Parser.init`, `Parser#setLanguage`,
  `Parser#parse`, and `Language.load`. **Steps.** 15, 38. **Evidence.**
  Read `node_modules/tree-sitter-wasms/package.json` in the layout
  reproduction (`"files": ["/out"]`, `"main": "bindings/node"`, no
  `exports`); `ls node_modules/tree-sitter-wasms/out` lists
  `tree-sitter-bash.wasm`, `tree-sitter-c.wasm`, … (36 grammars);
  `import.meta.resolve('tree-sitter-wasms/out/tree-sitter-typescript.wasm')`
  → `file:///…/node_modules/tree-sitter-wasms/out/tree-sitter-typescript.wasm`;
  read `node_modules/web-tree-sitter/web-tree-sitter.d.ts` lines 151–317:
  `export class Parser { … static init(moduleOptions?):
  Promise<void>; … setLanguage(language: Language | null): this; …}` and
  `export class Language { … static load(input: string | Uint8Array):
  Promise<Language>; }` (`probe:11_web_tree_sitter_layout`).
- **Claim.** On a Claude Code on the web session transcript, Max Cogar's
  prompt carries `origin.kind:"human"` and no `isMeta`. **Steps.** 38, 39
  (the expectation `marker_presence` tests). **Evidence.** Enumerated
  `/root/.claude/projects/-home-user-agent-armory/f37d10bc-406a-52ca-ac50-2f259a7a9b29.jsonl`
  2026-09-07 by `(content shape, origin.kind, isMeta)`: `('string',
  'human', None) 1`, `('list', None, None) 80`.
- **Claim.** Max Cogar's account lists 41 repositories on GitHub; the most
  recently pushed code repositories other than the tool's own are
  `Maxcogar/NOVA` (2026-09-04), `Maxcogar/Nova-Integrations` (2026-08-22),
  `Maxcogar/Design-Navigator-MCP-UI` (2026-08-02), `Maxcogar/Project-Manager`
  (2026-08-01), `Maxcogar/Turbine-Studio` (2026-07-31). **Steps.** 39.
  **Evidence.** The session's repository listing tool (`list_repos`, query
  `maxcogar`), 2026-09-07; `has_more: false`.
- **Claim.** IDEAS.md #14 describes discovery-mode replay of real
  transcripts through the real handler, what it can measure, and that hit
  rate, efficacy, and the value of the blocks are unmeasurable from replay
  and need real closed-loop sessions. **Steps.** 39. **Evidence.** Read
  `docs/IDEAS.md:92–171`.
- **Claim.** The Clear Thought MCP server (`@waldzellai/clear-thought-onepointfive`)
  and the CodeGraph MCP server (`mcp-servers/codegraph-mcp`, built from
  source) are both runnable over stdio in this environment and expose the
  tools the skill names. **Steps.** §10, §5, §6. **Evidence.** `tools/list`
  over stdio on 2026-09-07: Clear Thought exposes `clear_thought` with the
  `operation` enumeration; CodeGraph exposes `codegraph_scan`,
  `codegraph_get_stats`, `codegraph_find_entry_points`,
  `codegraph_list_files`, `codegraph_find_cycles`, `codegraph_get_layers`,
  `codegraph_list_external_dependencies`, `codegraph_get_external_users`,
  `codegraph_find_broken_imports`, `codegraph_find_unused_imports`,
  `codegraph_find_dead_exports`, `codegraph_find_orphans`,
  `codegraph_find_unreachable`, `codegraph_find_bridges`,
  `codegraph_list_endpoints`, `codegraph_get_dependents`,
  `codegraph_get_dependencies`, `codegraph_get_subgraph`,
  `codegraph_get_change_impact`, `codegraph_get_symbol`,
  `codegraph_find_symbol_dependents`, `codegraph_get_path_between`,
  `codegraph_find_related_docs`, `codegraph_verify_doc`,
  `codegraph_diff_surface`, `codegraph_list_docs` (and others). The Clear
  Thought logs are the two trace files §10 names; each carries every call
  verbatim with its thought numbering and scored options, so the coverage
  of §10's decisions is read from the files, not from a count stated here.

- **Claim.** A module-private `unique symbol` brand on `DenyVerdict` makes
  an annotated construction outside `src/blocks/verdict.ts` fail to compile
  (`TS2741`, exit 2) while an `as DenyVerdict` type assertion compiles (exit
  0) — the brand confines *annotated* construction only. **Steps.** 24.
  **Evidence.** Executed `probe:05_deny_brand` 2026-09-07 with `typescript`
  5.9.3 in the layout: `annotated return: error TS2741`, `annotated return:
  exit=2`, `type assertion: exit=0`.
- **Claim.** With `busy_timeout` 100 ms and retry-once, under the
  causally forced schedule T-3-3 states (A holds and reports; C makes both
  attempts while A holds; B fails once while A holds; A commits only then;
  B retries only then), the outcomes are A success after one attempt, C
  `StoreBusy` after two, B success after two, rows `["A","B"]`, on every
  run and under CPU load. **Steps.** 3 (the T-3-3 schedule). **Evidence.**
  Executed `probe:07_sqlite_busy_schedule` 2026-09-07 on Node v22.22.2:
  `identical across 3 runs: true`, `A success attempts=1`, `B success
  attempts=2`, `C StoreBusy attempts=2`, `rows ["A","B"]`; the same output
  on five consecutive runs through `run-plan-probes.mjs --repeat 5 --load
  3` (three CPU-bound sibling processes for the whole run).
- **Claim.** The `22/bookworm` Dockerfile of `nodejs/docker-node` at
  commit `d073523fcb78049b965f76d813627eb59ffb7a58` sets `NODE_VERSION
  22.16.0` — it is the Dockerfile of `node:22.16.0-bookworm` — and is
  `FROM buildpack-deps:bookworm`, which is `FROM buildpack-deps:bookworm-scm`,
  whose Dockerfile installs `git`; `node:22-bookworm-slim` installs no
  `git`. **Steps.** 38. **Evidence.** Executed
  `probe:14_docker_node_git.optional` 2026-09-07: fetched that pinned
  Dockerfile and the three others from `nodejs/docker-node` and
  `docker-library/buildpack-deps` on GitHub and grepped their `ENV
  NODE_VERSION`, `FROM` and package lines — `22/bookworm Dockerfile at
  d073523: ENV NODE_VERSION 22.16.0`, `node:22.16.0-bookworm FROM: FROM
  buildpack-deps:bookworm`, `buildpack-deps:bookworm-scm installs git:
  yes`, `node:22-bookworm-slim installs git: no`.
- **Claim.** The phrase-strip-then-floor clear rule — strip fenced code
  and tool blocks, remove every deferral-stoplist phrase, clear when the
  remaining text is at least the floor (2) — classifies the T-23-2 case
  table as stated: the empty and one-mark turns and the tool-noise-only
  turn do not clear (`below_length_floor`); `I'll get to that.` does not
  clear (`deferral_only`); `No.`, `Yes.`, `Sure.`, `Ok.`, `Right.`,
  `Understood.`, `Got it, will do.`, the causal sentences containing
  `later`, `First let me check: …`, the deferral-beside-answer turns, and
  `Sure, I'll get to that after the refactor.` clear. **Steps.** 12, 23.
  **Evidence.** Executed `probe:16_clear_rule_cases` 2026-09-07 (a reference
  implementation of the rule over the twenty-three cases): every case
  prints `ok`.

### 11.5 Claims from the collapse-log (`docs/collapse-log.md`)

- **Claim.** The 2026-09-04 entry names the fake-completeness failure and
  the standing lesson (judge every decision and review against the phase
  goal). **Steps.** §7 ordering, 23, 39. **Evidence.** Read
  `docs/collapse-log.md:1121–1156`.
- **Claim.** The 2026-09-03 round-9 entry: demote an over-claim to the
  spec's mandate, do not patch the next input. **Steps.** 23.
  **Evidence.** Read `:1089–1119`.
- **Claim.** The 2026-09-03 round-8 entry: own a residual as a class, not a
  growing enumeration. **Steps.** 26. **Evidence.** Read `:1057–1087`.
- **Claim.** The 2026-08-25 blocking-model entry: item 3 (a
  self-administered collapse test grades its own homework), item 5 (specify
  the lean for the not-yet-consistent window separately), item 6 (apply the
  "can you name what decides it?" test before escalating). **Steps.** §10A,
  25, 39. **Evidence.** Read `:830–902`.
- **Claim.** The 2026-08-13 entry: an unsourced number in place of a
  removed one is a defect. **Steps.** 12. **Evidence.** Read `:133–169`.

### 11.6 Absence claims

- **Structural absence.** No code file under `middleware/context-oracle/`
  has dependents, broken imports, unused imports, dead exports, cycles, or
  bridges; the only code file is `tools/check_docs.py`. **Steps.** §5, §6,
  §8. **Evidence.** `codegraph_scan` (`root_dir`
  `/home/user/agent-armory/middleware/context-oracle`, `force: true`,
  2026-09-07T15:08:53Z): `totalFiles: 1, byLanguage: {python: 1},
  totalDocFiles: 71, parseErrors: 0`; `codegraph_find_entry_points` → 0;
  `codegraph_find_cycles` → 0; `codegraph_get_layers` → one layer;
  `codegraph_list_external_dependencies` → argparse, pathlib, re,
  subprocess, sys; `codegraph_find_broken_imports` → 0;
  `codegraph_find_unused_imports` → 0; `codegraph_find_dead_exports` → 0
  (0 ambiguous); `codegraph_find_orphans` → `tools/check_docs.py` (a
  standalone script); `codegraph_find_unreachable` → 0;
  `codegraph_find_bridges` → 0; `codegraph_list_endpoints` → 0;
  `codegraph_get_dependents("tools/check_docs.py")` → 0;
  `codegraph_get_change_impact` → `totalImpacted: 0, blastRadius: 1`;
  `codegraph_diff_surface` → `hasBaseline: false` (this scan is the
  pre-implementation baseline).
- **Content absence.** No `ctxoracle/` directory and no `README.md` exist
  under `middleware/context-oracle/`. **Steps.** §5. **Evidence.** `ls -a
  middleware/context-oracle/` 2026-09-07 → `.`, `..`, `.claude`,
  `.mcp.json`, `CLAUDE.md`, `OWNER-LEDGER.md`, `RETHINK.md`, `docs`,
  `tools` (nine entries including `.` and `..`); `ls ctxoracle` → "No such
  file or directory". Scope covered: the directory listing itself.
- **Content absence.** No document under `middleware/context-oracle/`
  references `middleware/context-oracle/ctxoracle/**`. **Steps.** §5.5.
  **Evidence.** `codegraph_list_docs` (71 files) reports
  `referencedCodeFileCount: 0` for every document except `CLAUDE.md` (1,
  `tools/check_docs.py`); `codegraph_find_related_docs` over the planned
  paths returns "File not found in graph" (the paths do not exist).
  Scope covered: every Markdown file the scan indexed under the project.
- **Content absence.** The architecture states no value for the Reuse
  dominance ratio, the `deny_despite_answer_text` threshold, the clear
  recognizer's length floor, the `fix_chatter` k and window, the redactor's
  entropy threshold, or the done-claim counter's trailing-turn window.
  **Steps.** 12. **Evidence.** Read AD-9 `:762–826` ("a small floor";
  "≥ N denies (tunable)"), AD-15 `:1130–1177` ("≥ k×, tunable, stored";
  "k tunable"), AD-18 `:1282–1327`, AD-19 `:1329–1375` (redaction "plus a
  high-entropy-token heuristic", no threshold), AD-9 `:828–839` ("K
  tunable"). Scope covered: the whole architecture document, read in full
  this session.

---
## 12. Test specifications

<!-- generated:tests begin -->
| Step | Test spec(s) |
|---|---|
| S1 | T-1-1, T-1-2, T-1-3 |
| S2 | T-2-1 |
| S3 | T-3-1, T-3-2, T-3-3, T-3-4 |
| S4 | T-4-1 |
| S5 | T-5-1, T-5-2, T-5-3 |
| S6 | T-6-1, T-6-2 |
| S7 | T-7-1 |
| S8 | T-8-1 |
| S9 | T-9-1, T-9-2 |
| S10 | T-10-1, T-10-2, T-10-3, T-10-4 |
| S11 | T-11-1, T-11-2, T-11-3, T-11-4, T-11-5 |
| S12 | T-12-1 |
| S13 | T-13-1 |
| S14 | T-14-1, T-14-2 |
| S15 | T-15-1, T-15-2, T-15-3 |
| S16 | T-16-1 |
| S17 | T-17-1, T-17-2 |
| S18 | T-18-1, T-18-2, T-18-3, T-18-4, T-18-5, T-18-6, T-18-7, T-18-8, T-38-10, T-38-11, T-38-12, T-38-13, T-38-14, T-38-28, T-38-29 |
| S19 | T-19-1, T-19-2, T-38-19 |
| S20 | T-20-1, T-20-2, T-38-17, T-38-20, T-38-21, T-38-23 |
| S21 | T-21-1, T-21-2 |
| S22 | T-22-1 |
| S23 | T-23-1, T-23-2, T-23-3 |
| S24 | T-24-1, T-24-2, T-24-3 |
| S25 | T-25-1, T-25-2, T-25-3, T-38-1, T-38-2, T-38-3, T-38-4, T-38-5, T-38-30, T-38-31 |
| S26 | T-26-1, T-38-6 |
| S27 | T-27-1, T-27-2, T-38-7, T-38-8, T-38-9 |
| S28 | T-28-1, T-28-2, T-28-3, T-28-4, T-28-5, T-28-6 |
| S29 | T-29-1, T-29-2 |
| S30 | T-30-1, T-30-2 |
| S31 | T-31-1, T-31-2, T-31-3 |
| S32 | T-32-1, T-32-2, T-32-3 |
| S33 | T-33-1, T-33-2, T-33-3, T-33-4 |
| S34 | T-34-1, T-34-2 |
| S35 | T-35-1, T-35-2 |
| S36 | T-36-1 |
| S37 | — |
| S38 | T-38-1, T-38-2, T-38-3, T-38-4, T-38-5, T-38-6, T-38-7, T-38-8, T-38-9, T-38-10, T-38-11, T-38-12, T-38-13, T-38-14, T-38-15, T-38-16, T-38-17, T-38-18, T-38-19, T-38-20, T-38-21, T-38-22, T-38-23, T-38-24, T-38-25, T-38-26, T-38-27, T-38-28, T-38-29, T-38-30, T-38-31, T-38-32, T-38-33 |
| S39 | T-38-27 |
| S40 | T-40-1 |
<!-- generated:tests end -->

Every test the plan requires. All follow `references/testing-standards.md`:
real implementations preferred; every double named by Meszaros kind and
justified; data from real schemas via the migrations, named fixtures, or
generators with stated properties; every test's failure condition stated;
the ISO/IEC/IEEE 29119-4 technique named. Each entry carries **six fields**:
`File`, `Verifies`, `Level`, `Real/doubles`, `Data` (with technique), and
`NOT asserts` + `Fails when`.

**ID scheme.** `T<step>-<n>`. `T-38-*` are the acceptance-tier replays through
the real handler binary, each labelled with the spec criterion it pins.
Tests run through `scripts/run-tests.mjs` (unit/build/conventions) or
`--replay` (replay). Compile-time tests invoke `tsc --noEmit` on their own
fixture through `test/build/tsc_fixture.ts` (Step 1) and assert a non-zero
exit whose diagnostics name the intended error; the fixtures are excluded
from the project build. Stores in every test are real `node:sqlite` databases in a temp
directory created through the real migrations (testing-standards Database
rules 1 and 2); fixture repositories are real git repositories produced by
`test/fixtures/generate.ts` (D-plan-5). Thresholds are read from the seeded
`tuning` table unless an entry says it passes literals.

### 12.1 Function-level tier (unit and integration; run by `npm test`)

- **T-1-1 — Package skeleton builds cleanly.**
  - **File.** `test/unit/package_build.test.ts` (subprocess test).
  - **Verifies.** Step 1 — `npm ci` + `npm run build` succeed from a fresh
    checkout; no install-phase script executes; `dist/src/cli/dispatch.js`
    and `dist/test/**` exist afterwards.
  - **Level.** Integration (real `npm` and `tsc` on the real package).
  - **Real/doubles.** Real `npm`, real `tsc`; no doubles (a doubled `npm`
    would test the double).
  - **Data.** The committed `package.json`/`tsconfig.json`; `npm ci
    --ignore-scripts=false --loglevel silly` output captured. Technique:
    error guessing.
  - **NOT asserts.** Test outcomes (T-1-2 and later). **Fails when** `npm ci`
    or `tsc` exits non-zero, OR the captured log shows a `preinstall`,
    `install`, or `postinstall` lifecycle script running for the package, OR
    `dist/src/cli/dispatch.js` is absent.

- **T-1-2 — Runner refuses an empty or mismatched test set and propagates failure.**
  - **File.** `test/unit/run_tests_guard.test.ts`.
  - **Verifies.** Step 1 — `scripts/run-tests.mjs` exits 1 when the compiled
    set is empty or its count differs from the `.test.ts` source count, and
    exits non-zero when a compiled test fails.
  - **Level.** Integration (spawns the real runner against a temp package
    layout).
  - **Real/doubles.** Real runner script, real `node --test`; no doubles.
  - **Data.** Three temp layouts: (a) `test/` has 2 sources, `dist/test/`
    has 0 compiled files; (b) 2 sources, 1 compiled; (c) 1 source, 1
    compiled file containing a failing assertion. Technique: decision table
    (empty / mismatched / failing).
  - **NOT asserts.** Output formatting. **Fails when** (a) or (b) exits 0,
    OR (c) exits 0.

- **T-1-3 — Fixture generator is deterministic and complete.**
  - **File.** `test/unit/generator_determinism.test.ts`.
  - **Verifies.** Step 1 — `generateFixture(name, dir)` produces the same
    commit hashes for the same name on two runs, and every fixture
    repository under `test/fixtures/repos/` generates without error (the
    `large-store` store is not a repository; Step 29's generator builds it
    through the migrations).
  - **Level.** Integration (real `git`, real filesystem).
  - **Real/doubles.** Real `git`; no doubles.
  - **Data.** Every name under `test/fixtures/repos/` in §5.1, generated
    twice into two temp directories; `git rev-list --all` compared.
    Technique: equivalence partitioning over fixture names.
  - **NOT asserts.** Fixture content semantics (each consuming test).
    **Fails when** any name errors, OR any name's two hash lists differ.

- **T-2-1 — Runtime floor rejects below 22.16.0.**
  - **File.** `test/unit/env.test.ts`.
  - **Verifies.** Step 2 — `assertRuntime(version)` throws below the floor
    and passes at/above it, comparing as SemVer.
  - **Level.** Unit.
  - **Real/doubles.** Real function; the version string is a parameter
    (the default is `process.versions.node`) — a **stub** value (Meszaros:
    canned input), justified because one Node process cannot vary its own
    version.
  - **Data.** `'22.15.9'`, `'22.16.0'`, `'22.16.1'`, `'22.9.0'`, `'23.0.0'`.
    Technique: boundary value analysis (plus the string-prefix trap
    `'22.9.0'`).
  - **NOT asserts.** The host's actual version. **Fails when** a below-floor
    input does not throw OR an at/above-floor input throws OR `'22.9.0'`
    passes.

- **T-3-1 — Adapter WAL/STRICT/PRAGMA round-trip.**
  - **File.** `test/unit/stores_adapter.test.ts`.
  - **Verifies.** Step 3 — `openStore` yields WAL mode, `foreign_keys=1`,
    `busy_timeout=100`, STRICT enforcement, `BEGIN IMMEDIATE` transactions.
  - **Level.** Integration (real engine, temp-file database).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** `CREATE TABLE t (x INT NOT NULL) STRICT`; insert `(1)` → read
    back; insert `('x')` → throws; the three PRAGMAs read back. Technique:
    equivalence partitioning (valid/invalid type) + decision table (PRAGMAs).
  - **NOT asserts.** Concurrency (T-3-3). **Fails when** `journal_mode ≠ 'wal'`,
    OR STRICT does not reject, OR any PRAGMA differs, OR the round-trip loses
    data.

- **T-3-2 — `node:sqlite` single-importer convention.**
  - **File.** `test/conventions/sqlite_single_importer.test.ts`.
  - **Verifies.** Step 3 — only `dist/src/stores/adapter.js` contains
    `node:sqlite`.
  - **Level.** Unit (built-output grep over `dist/src/**`).
  - **Real/doubles.** Real `dist/`; no doubles.
  - **Data.** Every `dist/src/**/*.js`; a seeded second importer (a temporary
    compiled file added under `dist/src/`) must be detected. Technique:
    state-transition (clean → seeded → clean).
  - **NOT asserts.** Source-level imports. **Fails when** the clean build
    reports a second importer OR the seeded violation is not detected.

- **T-3-3 — Concurrent writers: retry-once then fail-open.**
  - **File.** `test/unit/concurrency.test.ts`.
  - **Verifies.** Step 3 — under contention one writer wins, the other
    retries once and succeeds; a third write contended during the retry
    raises `StoreBusy`.
  - **Level.** Integration (real engine; two spawned child processes holding
    a write transaction).
  - **Real/doubles.** Real `node:sqlite`; real child processes; no doubles.
  - **Data.** A store with one table and three child processes the test
    sequences by observables, never by the clock: A takes `BEGIN IMMEDIATE`
    and reports "holding" on stdout; only then C is started and makes both
    attempts while A holds — each waits the 100 ms `busy_timeout`, fails,
    and C reports `StoreBusy` after exactly two attempts and exits; only
    then B is started, makes its first attempt while A holds, reports that
    failure (a marker file), and waits; A is released to commit only after
    B's report; B is released to retry only after A has exited, so its
    retry finds the lock free by construction. The outcomes are forced by
    the ordering, not by margins, so the test is load-independent and runs
    under `node --test`'s default file concurrency without isolation
    flags. The schedule is executed as a probe under repetition and CPU
    load (§11.4). Technique: state-transition (idle → busy → retry →
    fail-open).
  - **NOT asserts.** Throughput. **Fails when** B succeeds without a retry
    being recorded, OR B does not succeed after one retry, OR C does not
    raise `StoreBusy` after exactly two attempts, OR the table holds any
    row other than A's and B's.

- **T-3-4 — FTS5 probe returns true on this runtime and cleans up.**
  - **File.** `test/unit/fts5_probe.test.ts`.
  - **Verifies.** Step 3 — `probeFts5` creates and drops the probe table.
  - **Level.** Integration (real engine).
  - **Real/doubles.** Real `node:sqlite` in-memory database; no doubles.
  - **Data.** None beyond the probe. Technique: error guessing.
  - **NOT asserts.** FTS query correctness (T-14-1). **Fails when** the probe
    returns `false` on a runtime whose `PRAGMA compile_options` lists
    `ENABLE_FTS5`, OR `_fts5_probe` still exists afterwards.

- **T-4-1 — Layout creates 0o700 directories and reports loose modes.**
  - **File.** `test/unit/layout.test.ts`.
  - **Verifies.** Step 4.
  - **Level.** Integration (real filesystem in a temp dir).
  - **Real/doubles.** Real filesystem; no doubles.
  - **Data.** (a) empty temp home; (b) temp home with a pre-existing
    `projects/<key>` at mode 0o755. Technique: state-transition.
  - **NOT asserts.** umask policy. **Fails when** a created directory's mode
    is not `0o700`, OR the loose-mode directory is modified, OR
    `looseMode` does not list it.

- **T-5-1 — Repo-key derivation: the four rules and URL normalization.**
  - **File.** `test/unit/repo_key.test.ts`.
  - **Verifies.** Step 5.
  - **Level.** Integration (real git repositories).
  - **Real/doubles.** Real `git`; fixtures `repo-key-full`, `repo-key-shallow`,
    `repo-key-shallow-no-origin`, `repo-key-nongit`; no doubles.
  - **Data.** The four fixtures; the normalization table: `git@github.com:Owner/Repo.git`,
    `ssh://git@github.com/Owner/Repo.git`, `https://user@github.com/Owner/Repo/`,
    `https://GITHUB.com/Owner/Repo`, `https://github.com/Owner/Repo.git`
    (all one identity), `https://github.com:8443/Owner/Repo` (distinct),
    `https://github.com/owner/repo` (distinct — path case kept). Technique:
    decision table over the four rules + equivalence partitioning over the
    URL forms.
  - **NOT asserts.** Any specific hash value. **Fails when** full and
    shallow clones of the same repo yield the same key, OR the full repo's
    key changes across runs, OR the non-git directory is not path-keyed, OR
    the `mode` mismatches the case, OR any row of the normalization table
    keys differently from its stated class.

- **T-5-2 — Spawn wrapper sets the guard and scrubs on request.**
  - **File.** `test/unit/spawn_wrapper.test.ts`.
  - **Verifies.** Step 5 — every child started via `oracleSpawn`/`oracleExecFileSync`
    sees `CTXORACLE_INTERNAL=1`; with `scrub: true` no member of
    `SCRUBBED_ENV` reaches it and every other variable does.
  - **Level.** Integration (real child process: `node -e` printing its
    environment).
  - **Real/doubles.** Real child process; no doubles.
  - **Data.** Parent env seeded with every `SCRUBBED_ENV` member set to `1`,
    plus `ANTHROPIC_BASE_URL=http://x`, `CLAUDE_CODE_USER_EMAIL=y`, `PATH`.
    Technique: decision table (scrub on/off × member/non-member).
  - **NOT asserts.** Child behaviour. **Fails when** the guard variable is
    absent in the child, OR a `SCRUBBED_ENV` member survives `scrub: true`,
    OR a non-member (`ANTHROPIC_BASE_URL`, `CLAUDE_CODE_USER_EMAIL`, `PATH`)
    is lost under scrub.

- **T-5-3 — `node:child_process` single-importer convention.**
  - **File.** `test/conventions/child_process_single_importer.test.ts`.
  - **Verifies.** Step 5 — only `dist/src/util/spawn.js` imports
    `child_process`, under either specifier spelling.
  - **Level.** Unit (import scan over `dist/src/**`: every `import`/`export
    … from` specifier and every `import()` string literal).
  - **Real/doubles.** Real `dist/`; no doubles.
  - **Data.** Clean build; a seeded second importer using
    `'node:child_process'`; a seeded second importer using
    `'child_process'`. Technique: state-transition + equivalence
    partitioning over specifier spellings.
  - **NOT asserts.** Source-level imports. **Fails when** the clean build has
    a second importer OR either seeded one is not detected.

- **T-6-1 — `FAULT_CODES` equals the enumerated set.**
  - **File.** `test/unit/fault_codes.test.ts`.
  - **Verifies.** Step 6.
  - **Level.** Unit.
  - **Real/doubles.** None.
  - **Data.** The literal list in Step 6 (AD-17's codes, `store_busy`,
    `whisper_dropped_stale`, `tuning_missing`). Technique: equivalence
    partitioning (in-set/out-of-set).
  - **NOT asserts.** Runtime emission (T-10-1). **Fails when** `FAULT_CODES`
    holds a code not in the list OR lacks one, OR a value assignable to
    `FaultCode` is outside the tuple (compile-time half).

- **T-6-2 — JSONL writer append + mode.**
  - **File.** `test/unit/jsonl_writer.test.ts`.
  - **Verifies.** Step 6.
  - **Level.** Integration (real filesystem).
  - **Real/doubles.** Real filesystem; no doubles.
  - **Data.** Two appends, then a third after re-opening the writer.
    Technique: state-transition.
  - **NOT asserts.** Cross-process concurrency. **Fails when** any append
    overwrites a prior line, OR the mode is not `0o600`, OR a line fails to
    parse.

- **T-7-1 — Project migration applies; constraints reject negatives; dedup index state machine.**
  - **File.** `test/unit/migrations_phase_a.test.ts`.
  - **Verifies.** Step 7.
  - **Level.** Integration (real engine + the real migration file).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** Empty DB → migrations with `fts: true` (001 and 001b) and,
    on a second empty DB, with `fts: false` (001 only; `sqlite_master`
    holds no `fts_*` table and the two `LIKE` indexes exist); per knowledge
    table one valid row and one row per CHECK-constrained column violating
    it; the `questions` sequence open → duplicate open (rejected) →
    answered → re-open (accepted); `sqlite_master` must not contain
    `exemplars`, `recipes`, `env_capabilities`, `deferred_queue`,
    `genre_state`. Technique: decision table over CHECKs and the FTS flag;
    state-transition for the index.
  - **NOT asserts.** DAO behaviour (T-9-1). **Fails when** the migration
    errors under either flag, OR the `fts: false` run creates an `fts_*`
    table or lacks an index, OR any CHECK accepts its negative, OR the
    dedup index deviates from the sequence, OR a forbidden table exists.

- **T-8-1 — Global migration: exactly the four tables.**
  - **File.** `test/unit/migrations_global.test.ts`.
  - **Verifies.** Step 8.
  - **Level.** Integration (real engine).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** Empty DB → migration 002; `sqlite_master` compared to
    `{global_meta, whisper_stats, tuning, lessons}`. Technique: decision
    table (present/absent).
  - **NOT asserts.** Seed values (T-12-1). **Fails when** a table is missing
    or a fifth Phase A table is present.

- **T-9-1 — Per-DAO CRUD round-trips.**
  - **File.** `test/unit/dao_crud.test.ts`.
  - **Verifies.** Step 9 — every Step 9 DAO in §5.1 (all but `tuning.ts`,
    which `T-12-1` covers) creates, reads, updates, and deletes against the
    STRICT schema; ids are ULIDs; `whisper_audit.append`
    returns its id synchronously.
  - **Level.** Integration (real engine via migrations).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** One minimal valid row per DAO with real provenance; a
    `trust='untrusted_repo'` write through a learned-record entry point
    with a human-provenance input must be rejected (FR-X4 laundering).
    Technique: equivalence partitioning.
  - **NOT asserts.** Type-level enforcement (T-9-2). **Fails when** any
    round-trip loses or mutates data, OR an id is not a valid ULID, OR
    `append` returns a Promise, OR trust laundering is accepted.

- **T-9-2 — Provenance is required at compile time.**
  - **File.** `test/build/typecheck_provenance.test.ts`, fixture
    `test/build/fixtures/missing_provenance.ts`.
  - **Verifies.** Step 9.
  - **Level.** Unit (compile-time).
  - **Real/doubles.** Real `tsc`; no doubles.
  - **Data.** A fixture calling each knowledge DAO's `create()` without the
    provenance parameter. Technique: equivalence partitioning
    (valid/invalid call).
  - **NOT asserts.** Runtime rejection (T-7-1). **Fails when** the fixture
    compiles.

- **T-10-1 — `store_corrupt` induction surfaces on the JSONL channel.**
  - **File.** `test/unit/store_corrupt_induction.test.ts`.
  - **Verifies.** Step 10.
  - **Level.** Integration.
  - **Real/doubles.** Real store, corrupted by overwriting byte 0 after
    close; no doubles.
  - **Data.** A valid store, then any event-path statement through
    `recordFault`'s caller path. Technique: error guessing.
  - **NOT asserts.** Recovery. **Fails when** no `store_corrupt` line with
    reproducing detail appears on the JSONL channel.

- **T-10-2 — Latency instrumentation accuracy.**
  - **File.** `test/unit/latency_instrument.test.ts`.
  - **Verifies.** Step 10.
  - **Level.** Unit.
  - **Real/doubles.** Real `performance.now()`; no doubles.
  - **Data.** A 50 ms `setTimeout` inside the instrumented span, five runs.
    Technique: boundary value.
  - **NOT asserts.** Absolute clock accuracy. **Fails when** any recorded
    latency differs from the observed delta by more than ±5 ms.

- **T-10-3 — Fault and session records are written only through the two writers.**
  - **File.** `test/conventions/fault_session_writers_only.test.ts`.
  - **Verifies.** Step 10 — over `dist/src/**`, `dist/src/stores/dao/faults.js` is
    imported only by `dist/src/diag/fault_writer.js` and `dist/src/diag/status.js`;
    `dist/src/stores/dao/session_log.js` only by `dist/src/diag/session_writer.js`,
    `dist/src/diag/status.js`, `dist/src/diag/log.js`, `dist/src/diag/regret.js` (the readers §5.1
    names).
  - **Level.** Unit (import scan over `dist/src/**`).
  - **Real/doubles.** Real `dist/`; no doubles.
  - **Data.** Clean build; a seeded `import … 'stores/dao/faults.js'` in a
    temporary compiled genre file. Technique: state-transition.
  - **NOT asserts.** Source-level imports. **Fails when** the clean build
    has an importer outside the allow-list OR the seeded one is not
    detected.

- **T-10-4 — Deadline fires at exactly `ms` under an injected clock.**
  - **File.** `test/unit/watchdog_deadline.test.ts`.
  - **Verifies.** Step 10 — `createDeadline({ms, now})` reports not-fired
    at `ms − 1` and fired at `ms`.
  - **Level.** Unit.
  - **Real/doubles.** Real function; the clock is a **fake** (Meszaros
    Fake: a working `now()` the test advances), justified because a
    boundary at a millisecond cannot be hit deterministically with the real
    clock; nothing else is doubled.
  - **Data.** `ms = 2500`; clock at 0, 2499, 2500, 2501. Technique: boundary
    value.
  - **NOT asserts.** Handler behaviour (T-29-1). **Fails when** 2499 reports
    fired OR 2500 does not.

- **T-11-1 — Redactor replaces known secret shapes.**
  - **File.** `test/unit/redact_positive.test.ts`.
  - **Verifies.** Step 11.
  - **Level.** Unit.
  - **Real/doubles.** Real function; literal thresholds (4.0, 20).
  - **Data.** One canonical example per pattern (AWS access key, GitHub PAT,
    JWT, RSA PEM block, `PASSWORD=hunter2`) and one 32-character
    high-entropy token. Technique: equivalence partitioning.
  - **NOT asserts.** Exhaustive coverage (L5). **Fails when** any positive
    case survives unredacted OR the replacement marker is malformed.

- **T-11-2 — Redactor leaves normal code alone.**
  - **File.** `test/unit/redact_negative.test.ts`.
  - **Verifies.** Step 11.
  - **Level.** Unit.
  - **Real/doubles.** Real function; literal thresholds.
  - **Data.** A variable name, a URL path, a hex colour, a 12-character
    Base64 string, a Unicode phrase, a 24-character English identifier.
    Technique: equivalence partitioning (below threshold / below length).
  - **NOT asserts.** Entropy behaviour above threshold on real code (a
    corrections signal). **Fails when** any negative case is redacted.

- **T-11-3 — Injection-suspect flags known payloads.**
  - **File.** `test/unit/injection_positive.test.ts`.
  - **Verifies.** Step 11.
  - **Level.** Unit.
  - **Real/doubles.** Real function; no doubles.
  - **Data.** "ignore previous instructions", a role-play jailbreak prompt,
    an imperative directed at "the assistant". Technique: equivalence
    partitioning.
  - **NOT asserts.** Exhaustiveness. **Fails when** any payload is not
    flagged.

- **T-11-4 — Injection-suspect leaves normal prose alone.**
  - **File.** `test/unit/injection_negative.test.ts`.
  - **Verifies.** Step 11.
  - **Level.** Unit.
  - **Real/doubles.** Real function; no doubles.
  - **Data.** A README paragraph, a code comment, a commit message.
    Technique: equivalence partitioning.
  - **NOT asserts.** Every legitimate phrasing. **Fails when** any negative
    case is flagged.

- **T-11-5 — Trust type rejects an out-of-set value at compile time.**
  - **File.** `test/build/typecheck_trust.test.ts`, fixture
    `test/build/fixtures/trust_out_of_set.ts`.
  - **Verifies.** Step 11.
  - **Level.** Unit (compile-time).
  - **Real/doubles.** Real `tsc`.
  - **Data.** A fixture assigning `'trusted'` to a `Trust`-typed variable.
    Technique: equivalence partitioning.
  - **NOT asserts.** Runtime rejection (the DB CHECK, T-7-1). **Fails when**
    the fixture compiles.

- **T-12-1 — Tuning DAO: seeds with provenance, round-trips, idempotent seeding.**
  - **File.** `test/unit/tuning_dao.test.ts`.
  - **Verifies.** Step 12.
  - **Level.** Integration (real engine).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** Migration 002 + `seedDefaults`; every key in Step 12 read back
    with its value and `source`; set a scalar; add and remove a list member;
    `seedDefaults` again. Technique: decision table (key present/value/
    source) + state-transition.
  - **NOT asserts.** Bar arithmetic (T-16-1). **Fails when** any seed is
    missing, has the wrong value, or the wrong `source`; OR a round-trip
    loses a value; OR the second `seedDefaults` changes any row.

- **T-13-1 — Miner hygiene, pair emission, landmine classes.**
  - **File.** `test/unit/miner.test.ts`.
  - **Verifies.** Step 13.
  - **Level.** Integration (real `git`, real store).
  - **Real/doubles.** Real `git log`; real `node:sqlite`; fixture
    `miner-hygiene`; no doubles.
  - **Data.** The fixture plants (absolute timestamps from the generator's
    seed; the horizon and the 90-day window are measured back from the
    fixture's `HEAD` commit time, so the cases hold on any calendar day): a
    cross-directory pair co-changing in 5 commits; 1 merge commit; 1 commit
    touching 45 files; 1 commit dated 6 years before `HEAD`; 2
    revert-labelled commits on one file; 3 fix-labelled commits on another
    within the 90 days before `HEAD`. Technique: decision table over
    exclusion rules; equivalence partitioning over landmine classes.
  - **NOT asserts.** Confidence values (T-16-1). **Fails when** any excluded
    commit contributes to a pair count, OR the planted pair's count ≠ 5, OR
    the `revert_chain`/`fix_chatter` rows are missing or carry no evidence,
    OR the watermark does not advance.

- **T-14-1 — Indexer skeleton on a small fixture repo.**
  - **File.** `test/unit/indexer.test.ts`.
  - **Verifies.** Step 14.
  - **Level.** Integration.
  - **Real/doubles.** Real `node:sqlite`; fixtures `indexer-small` and
    `over-threshold-file`; no doubles.
  - **Data.** 3 `.ts` files (one importing another), 1 `.py`, 1 `.sh`, 1
    file > 1 MB carrying a seeded fact, a zone-evidence comment containing a
    planted secret, a `test/` file importing a source file — run with an
    empty frontend list. Technique: equivalence partitioning over
    language/size/secret classes; state-transition (run → unchanged re-run
    → concurrent lock).
  - **NOT asserts.** Symbol extraction (T-15-3); grammar-specific parse
    quality (T-15-1/2). **Fails when** any file lacks its `files` row, zone,
    or FTS path tokens, OR any `symbols` or `import_edges` row exists, OR
    the > 1 MB file is not path-only with a diagnostic, OR the secret
    appears verbatim in the store, OR the second run writes rows, OR two
    concurrent reindexes both proceed, OR — the whole run repeated on a
    store migrated with `fts: false` — `pathSearch` returns a different hit
    set than under `fts: true` for the fixture's path-token queries.

- **T-14-2 — `refreshIfStale` records `index_stale`, sets the flag, spawns nothing.**
  - **File.** `test/unit/indexer_stale.test.ts`.
  - **Verifies.** Step 14 — AD-17's `index_stale` detector as a pure store
    effect: a moved `HEAD` yields an `index_stale` fault,
    `schema_meta.index_stale = '1'`, and `{stale: true}`; an unmoved `HEAD`
    yields nothing and `{stale: false}`; a completed `runIndex` clears the
    flag to `'0'`.
  - **Level.** Integration (real store, real git fixture).
  - **Real/doubles.** Real `node:sqlite`; real `git`; no doubles — no child
    process is expected, and the test establishes that none can be started
    by an import scan of `dist/src/index/indexer.js` (it imports neither
    `dist/src/util/spawn.js` nor `child_process` under either spelling, the
    same scan `T-5-3` runs) and that none was started by the absence of any
    `.reindex.lock` under the temp home during the calls (Step 14's lock is
    the trace a reindex child leaves).
  - **Data.** `indexer-small` indexed; then one commit added (`HEAD` moves);
    `refreshIfStale` twice; then `runIndex` (with an empty frontend list —
    the flag clears regardless); then `refreshIfStale` again.
    Technique: state-transition (fresh → stale → stale → fresh).
  - **NOT asserts.** Who spawns the reindex (T-28-5 observes the handler's
    child). **Fails when** the stale call records no `index_stale` fault or
    leaves the flag unset, OR `dist/src/index/indexer.js` imports the spawn
    wrapper or `child_process`, OR a `.reindex.lock` appears during the
    calls, OR the fresh call records a fault, OR `runIndex` does not clear
    the flag.

- **T-15-1 — Tree-sitter frontend on a TypeScript fixture.**
  - **File.** `test/unit/tree_sitter_frontend.test.ts`.
  - **Verifies.** Step 15.
  - **Level.** Integration.
  - **Real/doubles.** Real `web-tree-sitter` + `tree-sitter-wasms` grammar; no
    doubles.
  - **Data.** Two `.ts` files from `indexer-small`. Technique:
    state-transition (source → parse → rows).
  - **NOT asserts.** Every symbol kind. **Fails when** a symbol is lost, a
    span is wrong, or the import edge does not resolve to the imported file.

- **T-15-2 — Generic frontend on a shell file.**
  - **File.** `test/unit/generic_frontend.test.ts`.
  - **Verifies.** Step 15 — function-shape symbols emitted; no
    `import_edges`/`symbol_refs`.
  - **Level.** Unit.
  - **Real/doubles.** Real function; no doubles.
  - **Data.** A `.sh` file with two functions. Technique: equivalence
    partitioning.
  - **NOT asserts.** Grammar-quality parsing. **Fails when** the symbols are
    missing OR any `import_edge` is emitted.

- **T-15-3 — Indexer with the default frontends on `indexer-small`.**
  - **File.** `test/unit/indexer_frontends.test.ts`.
  - **Verifies.** Step 15 — `runIndex` with `defaultFrontends()` populates
    `symbols`, `import_edges`, `symbol_refs`, `entry_score`, and `test_map`;
    `symbolSearch` returns the same hit set under `fts: true` and `fts:
    false` for the fixture's symbol-token queries.
  - **Level.** Integration.
  - **Real/doubles.** Real `node:sqlite`; real `web-tree-sitter` +
    `tree-sitter-wasms` grammars; fixture `indexer-small`; no doubles.
  - **Data.** The 3 `.ts` files (one importing another), 1 `.py`, 1 `.sh`,
    and the `test/` file importing a source file. Technique: equivalence
    partitioning over language, with the FTS flag as a second partition.
  - **NOT asserts.** Grammar-specific parse quality (T-15-1/2); the skeleton
    properties (T-14-1). **Fails when** an expected `symbols`,
    `import_edges`, `symbol_refs`, `entry_score`, or `test_map` row is
    missing, OR the two flags' hit sets differ for a symbol token.

- **T-16-1 — Bar combinator: conjunction, failed axis, no cap, hazard bypass.**
  - **File.** `test/unit/bar.test.ts`.
  - **Verifies.** Step 16.
  - **Level.** Unit (floors read from a real seeded `tuning` table).
  - **Real/doubles.** Real function; real `tuning` rows; no doubles.
  - **Data.** Candidates over the eight (c, i, m) pass/fail combinations; two
    candidates both above every floor; a hazard candidate with support 2
    below the confidence floor; a hazard candidate with support 1; two mined
    twins differing only in `last_ts` (one at the reference instant, one two
    half-lives older — the older must carry one quarter of the fresh
    confidence and, sitting just above the floor when fresh, must fail it
    when old); the same candidate with `ctx.indexStale` false and true (the
    stale case must be reduced by `bar.stale_index_factor` and never
    blocked). Technique: decision table +
    boundary value on the dampeners.
  - **NOT asserts.** ROSE-figure recovery. **Fails when** a wrong
    `failedAxis` is returned, OR two above-bar candidates yield one pass, OR
    the support-2 hazard is suppressed, OR the support-1 hazard passes, OR
    the recency ratio is not 1/4 within rounding, OR the stale-index case is
    not reduced by the seeded factor.

- **T-17-1 — Command classifier: single segment.**
  - **File.** `test/unit/command_class.test.ts`.
  - **Verifies.** Step 17.
  - **Level.** Unit.
  - **Real/doubles.** Real function; lexicons from the seeded table.
  - **Data.** `npm test`, `npm run test`, `pytest` (class 1); `ls`, `cd`,
    `git status` (class 2); `wget http://x` (class 3). Technique:
    equivalence partitioning.
  - **NOT asserts.** Execution. **Fails when** any command is misclassified.

- **T-17-2 — Command classifier: compound, quoted, subshell.**
  - **File.** `test/unit/command_class_compound.test.ts`.
  - **Verifies.** Step 17.
  - **Level.** Unit.
  - **Real/doubles.** Real function.
  - **Data.** `cd pkg && npm test` (segments 2+1); `npm test && make
    integration` (1+3); `echo "a && b"` (no split inside quotes → 2); `sh -c
    "npm test"` (3 wholesale); `cd pkg && make check` (2+3); an unbalanced
    quote (3 wholesale). Technique: decision table over compound shapes.
  - **NOT asserts.** Real shell parsing. **Fails when** any case yields a
    wrong class list or a segment leaks its class across the boundary.

- **T-18-1 — Orientation generator headline.**
  - **File.** `test/unit/genre_orientation.test.ts`.
  - **Verifies.** Step 18 — 2–4 entry-point files ranked by the stated
    factors; one invariant when `invariant_members` has a matching row; no
    landmines at the prompt event.
  - **Level.** Integration (real store seeded by indexing
    `orientation-mixed-shape`).
  - **Real/doubles.** Real store, real indexer output; no doubles.
  - **Data.** The fixture (a low-in-degree `main`/`cli` file and a
    high-in-degree hub) indexed, with and without a `note`-written invariant.
    Technique: decision table (invariant present/absent) + boundary (2 and 4).
  - **NOT asserts.** Exact ranking among ties. **Fails when** fewer than 2 or
    more than 4 files headline, OR the seeded invariant is not carried, OR a
    landmine candidate is emitted at `UserPromptSubmit`.

- **T-18-2 — Coupling generator: non-obvious pair, obvious pair suppressed.**
  - **File.** `test/unit/genre_coupling.test.ts`.
  - **Verifies.** Step 18 — the cross-directory partner fires with ratio and
    commit pointer; the same-directory same-stem pair fails the marginal
    axis.
  - **Level.** Integration (real store from `coupling-nonobvious`).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** The fixture mined; a `PostToolUse Read` context on each file.
    Technique: equivalence partitioning (obvious/non-obvious).
  - **NOT asserts.** Ranking among several non-obvious partners. **Fails
    when** the non-obvious candidate is missing or lacks ratio/pointer, OR
    the obvious pair passes.

- **T-18-3 — Reuse generator: dominance, incomparable-set silence, observed-0, same-name caveat.**
  - **File.** `test/unit/genre_reuse.test.ts`.
  - **Verifies.** Step 18.
  - **Level.** Integration (real stores from the three reuse fixtures).
  - **Real/doubles.** Real stores; no doubles.
  - **Data.** `reuse-mixed-language` (grammar-covered dominant + a
    generic-frontend candidate → silence); `reuse-observed-zero`
    (grammar-covered symbol with observed 0 in the set → crown awarded to the
    dominant one); `reuse-same-name-collision` (comment/string matches →
    crown with caveat and capped confidence). Technique: decision table
    (comparable × dominant × collision).
  - **NOT asserts.** Semantic equivalence of candidates. **Fails when**
    silence when a crown is due, OR a crown when silence is due, OR the
    caveat/cap is missing, OR dominance is claimed below `bar.reuse_dominance_k`.

- **T-18-4 — Consequence generator: coupled tests + zone flag.**
  - **File.** `test/unit/genre_consequence.test.ts`.
  - **Verifies.** Step 18.
  - **Level.** Integration (real store from `consequence-coupled-tests`).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** A file co-changing with two test files; a `PreToolUse Edit`
    context on it; a variant where the target is in a `generated` zone.
    Technique: state-transition + equivalence partitioning (zone).
  - **NOT asserts.** Call-site counts. **Fails when** the coupled tests are
    missing from the headline, OR the zone flag is missing on the generated
    variant, OR a raw call-site count is the headline.

- **T-18-5 — Warning generator: landmine with evidence and flagged confidence.**
  - **File.** `test/unit/genre_warning.test.ts`.
  - **Verifies.** Step 18 — a `revert_chain`/`fix_chatter`/`human_stated` row
    for the target yields a candidate flagged `hazard`, carrying evidence,
    support, and its confidence; a target with no row yields nothing.
  - **Level.** Integration (real store from `warning-landmine`).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** Three landmine rows (one per kind, one low-confidence) and one
    clean file. Technique: equivalence partitioning over kinds.
  - **NOT asserts.** Bar outcome (T-16-1). **Fails when** a landmine target
    yields no candidate, OR the candidate lacks evidence/support/confidence
    or the `hazard` flag, OR the clean file yields a candidate.

- **T-18-6 — Completeness generator: unchanged partner.**
  - **File.** `test/unit/genre_completeness.test.ts`.
  - **Verifies.** Step 18 — from `observed_actions` `ok` Edit rows, the
    un-edited partner above the ratio floor is named with its ratio; a
    `failed` Edit and a Bash-written file are not change-set members.
  - **Level.** Integration (real store from `completeness-paired-change`).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** Session rows: one `ok` Edit on half of a pair; variants adding
    a `failed` Edit on the partner and a Bash write to the partner.
    Technique: decision table over row outcomes.
  - **NOT asserts.** Delivery (T-20-2). **Fails when** the partner is not
    named with its ratio, OR a `failed` Edit or Bash write counts as a
    change.

- **T-18-7 — Verification generator: covering-test mapping and run-state clause.**
  - **File.** `test/unit/genre_verification.test.ts`.
  - **Verifies.** Step 18 — the headline is the covering-test →
    changed-region mapping; the strong "not run" appears only when every
    observed command is class 1/2; a class-3 command composes the weaker
    claim; a run-and-failed covering test (a `failed` class-1 row) yields
    neither "not run" nor "no recognized run".
  - **Level.** Integration (real store from `verification-covering-test`).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** Four variants: no run; run `ok`; run `failed`; `make check`
    (class 3). Technique: decision table.
  - **NOT asserts.** Done-claim recognition (T-18-8). **Fails when** the
    mapping is not the headline, OR run-state stands alone, OR the strong
    claim appears with a class-3 command present, OR the run-and-failed
    variant asserts either not-run clause.

- **T-18-8 — Done-claim recognizer errs toward silence.**
  - **File.** `test/unit/done_claim_recognizer.test.ts`.
  - **Verifies.** Step 18 — fires on a `lexicon.completion_claim` phrase in
    the concluding position Step 18 defines (final non-empty sentence, not a
    question, not negated in its own clause); never fires on a paraphrase
    outside the lexicon, on the phrase in a non-final sentence, on a negated
    final sentence, or on an ordinary stop.
  - **Level.** Unit.
  - **Real/doubles.** Real function; lexicon from the seeded table.
  - **Data.** Positives: "Done — all tests pass."; "I've implemented the
    parser and the tests pass." (one sentence, final). Negatives: "Is this
    done?"; "Working on the next part."; "Fixed the parser. Now looking at
    the tests." (phrase in a non-final sentence); "Not done yet.", "This
    isn't finished.", "I haven't fixed it." (the negation clause — a
    negated final sentence never fires); a positive with the negation in an
    earlier clause, "Not the tests, but the parser is done." (fires — the
    clause scope is pinned); a generated corpus
    (seeded) of final sentences built from a grammar of completion
    paraphrases outside the lexicon ("that should do it", "all set", "ready
    for review", "wrapped up", …) crossed with subjects and tails, none
    containing a lexicon phrase — the lexicon's complement as a generating
    rule, not a list. Technique: equivalence partitioning + the lexicon's
    complement over a generated set.
  - **NOT asserts.** Whether the claim is true. **Fails when** a positive is
    missed OR any negative — including any paraphrase in the corpus —
    fires.

- **T-19-1 — Whisper form validator.**
  - **File.** `test/unit/whisper_form.test.ts`.
  - **Verifies.** Step 19; AC-14 at the composer level — `[oracle]` prefix,
    genre tag, ≥ 1 pointer, evidence ratio for history genres, confidence
    flag when not high, no imperative, no verbatim repo text.
  - **Level.** Unit.
  - **Real/doubles.** Real composer; candidate objects built by a small
    test builder that emits the `Candidate` shape — a **fake** (Meszaros:
    a working lightweight implementation of the candidate contract),
    justified because the generators' outputs are exercised by T-18-*, and
    the composer's input contract is the `Candidate` type.
  - **Data.** One canonical candidate per genre plus edge cases (no
    pointer; imperative wording; verbatim repo text in evidence; missing
    genre tag). Technique: decision table over form axes.
  - **NOT asserts.** Content correctness. **Fails when** any valid candidate
    fails a form axis OR any invalid one passes.

- **T-19-2 — Rumor rule drops a stale pointer.**
  - **File.** `test/unit/compose_rumor_rule.test.ts`.
  - **Verifies.** Step 19 — a candidate whose `file:span` no longer holds is
    dropped with `whisper_dropped_stale`; a commit pointer is resolved
    against the store's `commits` table.
  - **Level.** Integration (real filesystem, real store).
  - **Real/doubles.** Real files and store; no doubles.
  - **Data.** A candidate on `file.ts:12-18`; the file mutated before
    compose; a commit pointer present/absent in `commits`. Technique:
    state-transition (fresh → mutated).
  - **NOT asserts.** How the mutation happened. **Fails when** the stale
    candidate is composed, OR the diagnostic is not recorded, OR compose
    spawns `git`.

- **T-20-1 — Per-consumer dedup and session-boundary reconciliation.**
  - **File.** `test/unit/delivery_dedup.test.ts`.
  - **Verifies.** Step 20.
  - **Level.** Integration (real store).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** Two consumers; subject X delivered to one; subject Y in the
    other's read set; each of the five `source` values applied to seeded
    sets. Technique: state-transition + decision table (D-20's table).
  - **NOT asserts.** Whisper text. **Fails when** a delivered/read subject
    is not withheld for its consumer, OR it is withheld for the other
    consumer, OR any `source` yields the wrong post-state.

- **T-20-2 — Stop-time channel honours `stop_hook_active`.**
  - **File.** `test/unit/delivery_stop_channel.test.ts`.
  - **Verifies.** Step 20 — `deliverStop` returns `{ context }` when
    `stop_hook_active` is false and `null` when true.
  - **Level.** Unit.
  - **Real/doubles.** Real function; no doubles.
  - **Data.** The two flag values. Technique: decision table.
  - **NOT asserts.** The harness cap. **Fails when** the true case emits, OR
    the false case does not.

- **T-21-1 — Reader entry discrimination.**
  - **File.** `test/unit/reader.test.ts`.
  - **Verifies.** Step 21.
  - **Level.** Integration (real files).
  - **Real/doubles.** Real filesystem; JSONL fixtures built to V12's shapes;
    no doubles.
  - **Data.** Entries: 1 marker-carrying human (string); 1 marker-carrying
    human (list content); 5 task-notification; 2 `isMeta:true`; 1 tool-result
    list; 1 marker-absent string user entry; 1 assistant text; 1 assistant
    thinking-only; 1 unknown shape; plus a file whose last line is partial
    across two reads. Technique: decision table over (type, markers, shape).
  - **NOT asserts.** Entry content. **Fails when** any verdict is wrong, OR
    the marker-absent entry is not `unknown_shape`, OR list-content human
    text is not concatenated, OR the partial line is consumed early, OR the
    unknown shape does not throw the typed error.

- **T-21-2 — V12 enumeration reproduced.**
  - **File.** `test/unit/reader_v12_counts.test.ts`.
  - **Verifies.** Step 21 — the reader's per-shape counts on a synthesized
    transcript equal V12's (1 / 5 / 2 / 106) and the probe-mode shape
    (marker-absent genuine prompts) is reported as `unknown_shape`.
  - **Level.** Integration.
  - **Real/doubles.** Real reader; synthesized JSONL; no doubles.
  - **Data.** Two synthesized transcripts (interactive shape; probe shape).
    Technique: state-transition.
  - **NOT asserts.** Real-owner-transcript behaviour (T-38-32). **Fails
    when** counts differ from V12 OR the probe-shape prompts are classified
    as human.

- **T-22-1 — QA state DAO: round-trips, dedup, concurrent open, re-open.**
  - **File.** `test/unit/qa_state.test.ts`.
  - **Verifies.** Step 22.
  - **Level.** Integration (real store; two child processes).
  - **Real/doubles.** Real `node:sqlite`; real child processes; no doubles.
  - **Data.** Two workers issuing `openQuestion` for the same
    `(consumer, content_hash)`; then `answerQuestions`; then a re-open;
    `voidQuestion` with `denyFired: true`. Technique: state-transition +
    error guessing (concurrency).
  - **NOT asserts.** Which worker wins. **Fails when** two `open` rows
    exist, OR neither worker gets the row, OR the loser does not get
    `'already_open'`, OR re-open after `answered` fails, OR the voided row's
    detail lacks the deny-fired flag.

- **T-23-1 — Question recognizer: positives and asserted non-coverage.**
  - **File.** `test/unit/recognizer_question.test.ts`.
  - **Verifies.** Step 23.
  - **Level.** Unit.
  - **Real/doubles.** Real function; stoplist from the seeded table.
  - **Data.** Recognized: a plain `?` sentence; two `?` sentences in one
    turn (two results); a `?` clause followed by more text. Not recognized:
    a `?` inside a code fence; a `?` inside a quoted block; a stoplist idiom
    ("why is CI always so flaky?"); and the **rule's complement** — a
    generated corpus (seeded) of 300 sentences with no terminal `?`, built
    from interrogative openers ("tell me whether", "explain", "I wonder if",
    "let me know what", "would you check", "could you confirm", "any idea
    why", …) crossed with bodies, plus 50 `?`-terminated sentences placed
    inside fences and quotes; the option: with `requireTerminalMark: false`
    the complement corpus's interrogative members are recognized (the
    `--missed-question` mode), and the default is asserted to be `true`.
    Technique: equivalence partitioning + boundary (fence, stoplist) + the
    rule's complement over a generated set.
  - **NOT asserts.** Comprehension. **Fails when** any positive is missed,
    OR any negative is recognized — any member of the generated complement
    included — OR the default is not `requireTerminalMark: true`.

- **T-23-2 — Clear recognizer: floor, deferral, substance.**
  - **File.** `test/unit/recognizer_clear.test.ts`.
  - **Verifies.** Step 23.
  - **Level.** Unit.
  - **Real/doubles.** Real function; floor and deferral list read from the
    seeded table.
  - **Data.** An empty turn and a one-mark turn "." (no clear,
    `below_length_floor` — below the seeded floor of 2); "No.", "Yes, line
    12.", "Sure.", "Ok.", "Right.", "Understood.", "Got it, will do." (clear
    — direct answers are never held for being short); "Because the fixture
    is written later than the assertion reads it." and "First let me check:
    the null check is not the cause." (clear — a bare word is no phrase, and
    a phrase beside an answer is stripped, not the answer); "I'll get to
    that." and "I'll get to that!" (no clear, `deferral_only`); "I'll get
    to that. The null check does not fix it, see line 12." and "No — the
    null check does not fix it, see line 12, though I'll get to the rest
    later." (clear on what remains); "Sure, I'll get to that after the
    refactor." (clears — the dressed dodge the skeleton lets through and
    the exit report counts); a turn that is only tool-noise blocks (no
    clear, `below_length_floor`); a turn of a code fence plus "No."
    (clears). The function's signature carries no question text (asserted
    at compile time by calling it with the seeded list, the seeded floor,
    and a string only). Technique: boundary value + decision table over
    the spec's examples and the direct-answer class (the cases executed by
    §11.4's reference implementation, `probe:16_clear_rule_cases`).
  - **NOT asserts.** Answer correctness; per-question matching (Phase B —
    the recognizer cannot see a question). **Fails when** any case behaves
    opposite to its class, OR the boundary is not at the seeded floor, OR
    the reason code is wrong for either failing class.

- **T-23-3 — Move recognizer: exactly three deny-eligible tools.**
  - **File.** `test/unit/recognizer_move.test.ts`.
  - **Verifies.** Step 23.
  - **Level.** Unit.
  - **Real/doubles.** Real function.
  - **Data.** `Write`, `Edit`, `NotebookEdit` (true); `Bash`, `Read`, `Grep`,
    `Glob`, `Task`, `WebFetch`, `WebSearch`, `NotebookRead`, `mcp__x__y`,
    `` (empty) (false); plus a generated set (seeded) of tool-name strings
    — every documented built-in tool name other than the three,
    `mcp__<server>__<tool>` forms, and random identifiers — all `false`:
    the rule's complement as a generating rule. Technique: decision table
    + the complement over a generated set.
  - **NOT asserts.** Intent. **Fails when** any positive is false OR any
    negative is true.

- **T-24-1 — Verdict shape excludes mutation fields (two fixtures).**
  - **File.** `test/build/typecheck_verdict_shape.test.ts`, fixtures
    `test/build/fixtures/verdict_updated_input.ts` and
    `test/build/fixtures/verdict_updated_tool_output.ts`.
  - **Verifies.** Step 24 — `updatedInput` and `updatedToolOutput` are each
    absent from the response type.
  - **Level.** Unit (compile-time).
  - **Real/doubles.** Real `tsc`.
  - **Data.** One fixture per field constructing a response literal with it.
    Technique: equivalence partitioning (one case per forbidden member).
  - **NOT asserts.** Runtime absence (T-24-2). **Fails when** either fixture
    compiles.

- **T-24-2 — Deny confinement: importer set.**
  - **File.** `test/conventions/permission_decision_confined.test.ts`.
  - **Verifies.** Step 24 — over `dist/src/**`, `dist/src/blocks/verdict.js` is
    imported by exactly one module, `dist/src/blocks/answer_drift.js`.
  - **Level.** Unit (import scan over `dist/src/**`, both specifier forms).
  - **Real/doubles.** Real `dist/`; no doubles.
  - **Data.** Clean build; a seeded second importer in a temporary compiled
    genre file. Technique: state-transition (clean → seeded → clean).
  - **NOT asserts.** The wire field (`T-28-2`); compiled tests under
    `dist/test/**` (out of scope by construction). **Fails when** the clean
    build reports a second importer, OR the seeded one is not detected.

- **T-24-3 — A `DenyVerdict` cannot be constructed outside `blocks/verdict.ts`.**
  - **File.** `test/build/typecheck_deny_brand.test.ts`, fixture
    `test/build/fixtures/deny_literal_outside.ts`.
  - **Verifies.** Step 24 — the brand makes an *annotated* construction — a
    function whose declared return type is `DenyVerdict` returning an object
    literal — a compile error in any other module (`TS2741`, §11.4).
  - **Level.** Unit (compile-time, via `tsc_fixture.ts`).
  - **Real/doubles.** Real `tsc`; no doubles.
  - **Data.** A fixture importing the type and declaring `export function
    f(): DenyVerdict { return { kind: 'deny', reason: 'x', audit_id: 'y' }; }`
    — an annotated return, never an `as` assertion (the assertion compiles
    and is outside the brand's reach, §11.4). Technique: equivalence
    partitioning (inside/outside the module).
  - **NOT asserts.** Runtime behaviour. **Fails when** the fixture compiles
    OR the diagnostics do not name the missing brand property.

- **T-25-1 — Intake from the prompt field.**
  - **File.** `test/unit/answer_drift_intake.test.ts`.
  - **Verifies.** Step 25 — `intakeFromPrompt` opens one row per recognized
    question with null `asked_uuid`; a repeated prompt yields
    `'already_open'` without error.
  - **Level.** Integration (real store).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** A two-question prompt; the same prompt again; a prompt with no
    `?`. Technique: equivalence partitioning.
  - **NOT asserts.** Deny behaviour (T-25-3). **Fails when** row count ≠ 2,
    OR `asked_uuid` is not null, OR the repeat errors, OR the no-`?` prompt
    opens a row.

- **T-25-2 — Catch-up: reconciliation, fresh open, voiding, clearing, bookmark.**
  - **File.** `test/unit/answer_drift_catchup.test.ts`.
  - **Verifies.** Step 25.
  - **Level.** Integration (real store, real transcript fixture files).
  - **Real/doubles.** Real store and files; no doubles.
  - **Data.** Transcript fixtures: (a) a human turn matching an intake row
    (backfill); (b) a human question with no intake row (fresh open); (c) a
    task-notification turn matching an intake row on which a deny already
    fired (void + `intake_invalidated` with `denyFired: true`); (d) a
    clearing assistant turn (all open rows → `answered`,
    `generic_text_all_prior`); (e) a partial trailing line (bookmark stops
    before it); (f) a deadline that fires mid-read (`catchup_incomplete`,
    bookmark at the last completed line). Technique: decision table over
    entry kinds; state-transition for the bookmark.
  - **NOT asserts.** Whisper output. **Fails when** any case's state differs
    from its expected post-state, OR the bookmark advances over a partial
    line, OR the deadline case loses the completed lines.

- **T-25-3 — Deny decision: scope, eligibility, audit-first.**
  - **File.** `test/unit/answer_drift_decide.test.ts`.
  - **Verifies.** Step 25 — `decideDeny` denies exactly a deny-eligible tool
    for the main consumer with an `open` row, records the audit row with the
    target path before returning, and returns `null` otherwise. (The hold
    and its recovery are pipeline properties pinned by `T-28-1` and `T-38-4`;
    `decideDeny` itself never reads the transcript.)
  - **Level.** Integration (real store).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** Open question + `Edit` with `toolInput.file_path = 'a.ts'`
    (verdict; audit row with `a.ts` in `evidence_json` present before
    return); `NotebookEdit` with `notebook_path` (verdict; path recorded);
    `Read`, `Bash`, `Task` (null); consumer `sub-abc` (null); no open
    question (null). Technique: decision table (consumer × tool × state).
  - **NOT asserts.** Agent behaviour after the deny; the lag hold. **Fails
    when** any cell of the table is wrong, OR the verdict is returned
    without its audit row, OR the audit row lacks the target path.

- **T-26-1 — Deny health detectors on a seeded store.**
  - **File.** `test/unit/deny_health.test.ts`.
  - **Verifies.** Step 26 — each detector fires on its induced pattern and
    not otherwise; the bypass predicate matches exactly the enumerated
    forms with a same-turn target match; `status` text carries the bound.
  - **Level.** Integration (real store).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** Seeded audit/session rows: a clearing turn timestamped before
    a deny (`deny_after_answer_lag`); three consecutive denies without text
    (`deny_loop`); `deny.despite_answer_text_threshold` denies with a
    below-floor text turn between (`deny_despite_answer_text`), the same
    with the below-floor turn recorded two events earlier — a
    `classified_turns` row written by a previous catch-up, so the detector
    reads the store, not the current event (`deny_despite_answer_text`),
    and the same denies with only a deferral-only text turn between (no
    `deny_despite_answer_text` — AD-9's exclusion); a Bash row
    `echo x > target.ts` in the same turn as a deny on `target.ts` (bypass);
    `npm test > out.log` (no bypass); `cp a.ts target.ts` (bypass); `dd
    of=target.ts` (no bypass — outside the enumerated list, by design).
    Technique: decision table over patterns.
  - **NOT asserts.** Bypass intent. **Fails when** any detector fails to fire
    on its pattern, OR fires on a non-pattern, OR the deferral-only case
    fires, OR `dd` is counted, OR the bound text is absent.

- **T-27-1 — Question lifetime by `source`.**
  - **File.** `test/unit/question_lifetime.test.ts`.
  - **Verifies.** Step 27.
  - **Level.** Integration (real store, two transcript fixtures).
  - **Real/doubles.** Real store and files; no doubles.
  - **Data.** Seeded open rows; each of `startup`, `clear`, `resume`, `fork`,
    `compact`; the marker-carrying and marker-less transcript fixtures for the
    rebuild path; a `SessionEnd`. Technique: decision table.
  - **NOT asserts.** Dedup sets (T-20-1). **Fails when** `startup`/`clear` do
    not expire, OR `resume`/`fork`/`compact` do not rebuild from offset 0, OR
    the marker-less rebuild does not raise `rebuild_recovered_nothing`, OR
    `SessionEnd` changes any row.

- **T-27-2 — Outstanding-question line and the done-claim counter.**
  - **File.** `test/unit/stop_outstanding_line.test.ts`.
  - **Verifies.** Step 27 — the line is returned only when the done-claim
    recognizer fired AND open questions exist; the counter records a
    done-claim with an `open` row and a done-claim whose only close was
    `generic_text_all_prior` within the trailing-K window.
  - **Level.** Integration (real store).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** (done, open) → line; (done, none) → none; (no claim, open) →
    none; the two counter cases. Technique: decision table.
  - **NOT asserts.** Phrasing. **Fails when** presence mismatches any cell,
    OR either counter case is not recorded in `session_log.detail_json`.

- **T-28-2 — Adapter isolation convention.**
  - **File.** `test/conventions/hook_field_names_isolated.test.ts`.
  - **Verifies.** Step 28 — none of the wire identifiers Step 28's convention
    list names appears in `dist/src/**` outside `dist/src/hook/adapter.js`.
  - **Level.** Unit (built-output grep).
  - **Real/doubles.** Real `dist/`; no doubles.
  - **Data.** Clean build; a seeded leak (`tool_input` in a temporary
    compiled genre file). Technique: state-transition.
  - **NOT asserts.** Source-level names. **Fails when** the clean build leaks
    OR the seeded leak is not detected.

- **T-36-1 — Model seam sentinel and isolation.**
  - **File.** `test/unit/model_invoke_stub.test.ts`.
  - **Verifies.** Step 36 — the interface compiles; `phaseANotImplemented.invoke`
    returns `{ok:false, reason:'phase_a_no_model'}`; no `dist/src/**` module
    other than `dist/src/model/invoke.js` imports it.
  - **Level.** Unit + built-output import scan.
  - **Real/doubles.** Real function; real `dist/`; no doubles.
  - **Data.** Any request; the import scan. Technique: equivalence
    partitioning.
  - **NOT asserts.** Any model behaviour. **Fails when** the sentinel returns
    anything else OR a Phase A importer exists.

### 12.2 Handler and CLI tier (real built binary, real stores)

- **T-28-1 — Pipeline order: catch-up before the block check.**
  - **File.** `test/replay/pipeline_order.test.ts`.
  - **Verifies.** Step 28 (AD-8 order).
  - **Level.** Acceptance (replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event; real store; real
    transcript fixture. No doubles.
  - **Data.** Intake of a question, then a transcript already containing a
    clearing answer at `PreToolUse Edit` time. Technique: state-transition.
  - **NOT asserts.** Downstream behaviour. **Fails when** a deny is emitted
    (the block check read state older than the transcript).

- **T-28-3 — Fail-open on any error.**
  - **File.** `test/replay/fail_open.test.ts`.
  - **Verifies.** Step 28 (AD-7).
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler; real induced failures (an unopenable
    store path — a directory at mode 000; malformed stdin; a project store
    whose file is truncated to half its length after migration, so the
    first prepared statement fails). No doubles.
  - **Data.** Three fault cases. Technique: error guessing.
  - **NOT asserts.** Recovery. **Fails when** any case does not yield exit 0,
    empty stdout, and a JSONL fault line (the truncated store's line carries
    `store_corrupt`).

- **T-28-4 (AC-9) — `produced_but_undelivered` recorded when the response cannot be written.**
  - **File.** `test/replay/produced_but_undelivered.test.ts`.
  - **Verifies.** Step 28 — audit row written, emission failed → the fault
    is recorded with the audit id; exit 0.
  - **Level.** Acceptance (replay through the built handler).
  - **Real/doubles.** Real handler spawned with its stdout closed by the
    harness before the write (a real `EPIPE`); real store. No doubles.
  - **Data.** A `PostToolUse Read` stream on `coupling-nonobvious` that
    produces a Coupling whisper. Technique: error guessing.
  - **NOT asserts.** Whisper content. **Fails when** the `whisper_audit` row
    is absent, OR no `produced_but_undelivered` fault names its id, OR exit
    ≠ 0.

- **T-28-5 — `SessionStart` writes the liveness row and spawns the reindex child when stale.**
  - **File.** `test/replay/liveness_row.test.ts`.
  - **Verifies.** Step 28 — the row AD-17's `hooks_not_firing` detector
    reads exists with the transcript path and size; on a stale index the
    branch spawns exactly one detached `index` child, observable by the
    `.reindex.lock` `runIndex` takes (Step 14) and by the index head moving
    afterwards.
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler; real store; real transcript fixture;
    real `indexer-small` repository. No doubles.
  - **Data.** A `SessionStart` event with `transcript_path` set to a
    fixture, once against a fresh index and once after one commit moved
    `HEAD`. Technique: equivalence partitioning (fresh / stale).
  - **NOT asserts.** Detection (T-33-4); reindex duration. **Fails when** no
    `session_log` row with `event_type = 'liveness'` exists, OR its
    `detail_json` lacks the path or the byte size, OR the stale run leaves
    no `.reindex.lock` trace and an unmoved index head within the test's
    wait, OR the fresh run spawns a child.

- **T-28-6 — `hook integrity-check` records `store_corrupt` off-path.**
  - **File.** `test/replay/integrity_check_verb.test.ts`.
  - **Verifies.** Step 28 — the detached child `SessionStart` spawns runs
    `quick_check` and records the fault only on a corrupted store.
  - **Level.** Acceptance.
  - **Real/doubles.** Real CLI; a healthy store and a truncated copy. No
    doubles.
  - **Data.** The two stores. Technique: equivalence partitioning.
  - **NOT asserts.** Event-path behaviour (T-10-1). **Fails when** the
    truncated store yields no `store_corrupt` fault, OR the healthy one
    yields any fault, OR exit ≠ 0 in either case.

- **T-29-1 (AC-10) — Watchdog trips, fail-open, latency bound.**
  - **File.** `test/replay/watchdog.test.ts`.
  - **Verifies.** Step 29; AC-10.
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler; real stores; the `large-store` store
    `test/fixtures/generate_large_store.ts` builds through the real
    migrations and DAOs (≈400 MB, the AD-23/V8 class) for AD-23's
    inventory. No doubles — the over-run is induced with the
    `hook` verb's `--deadline-ms 1` argument, which the harness passes and
    `init` never writes.
  - **Data.** A fixture hook stream on `coupling-nonobvious` replayed with
    `--deadline-ms 1` (every event over-runs); the same stream and the
    `large-store` stream at the default deadline. Technique: equivalence
    partitioning (over-run / normal) + measurement against NF-1.
  - **NOT asserts.** Operation completion; a wall-clock boundary. **Fails
    when** any run exceeds the wired 5 s, OR the over-run case emits a deny
    or whisper, OR `latency_breach` is not recorded on every over-run event,
    OR the default-deadline runs record any `latency_breach`; p50/p95/max
    across both default-deadline streams are printed against NF-1 (p95 ≤
    1500 ms) as a measurement.

- **T-29-2 — Recursion guard short-circuits.**
  - **File.** `test/replay/recursion_guard.test.ts`.
  - **Verifies.** Step 29.
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler spawned with `CTXORACLE_INTERNAL=1`. No
    doubles.
  - **Data.** Any hook input. Technique: error guessing.
  - **NOT asserts.** Downstream behaviour. **Fails when** any output is
    emitted or any store write occurs.

- **T-30-1 (AC-24) — Regret true-positive and no-inflate.**
  - **File.** `test/replay/regret_proxy.test.ts`.
  - **Verifies.** Step 30; AC-24.
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler; real stores; fixtures
    `regret-true-positive`, `regret-no-inflate`. No doubles.
  - **Data.** A held (bar-failed) fact whose region is re-edited in-session;
    a held fact whose covering test fails (`PostToolUseFailure`); a
    store-held pair for a file the agent never read (no candidate ever
    generated) whose partner is edited and reverted in-session
    (`never_triggered`); a held fact with unrelated churn; a `failed` Edit on
    the region; a held fact whose region receives exactly one `ok` edit
    (no regret — the first edit is the decision moment). Technique:
    decision table.
  - **NOT asserts.** Proxy calibration. **Fails when** any of the three TP
    cases records no regret row, OR the never-triggered row is not labelled
    `never_triggered`, OR the unrelated churn, the failed Edit, or the
    single-edit case records one.

- **T-30-2 — Fold serialization and post-session correction reach.**
  - **File.** `test/unit/whisper_stats_fold.test.ts`.
  - **Verifies.** Step 30; AC-23's efficacy clause.
  - **Level.** Integration (real stores; two child processes).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** N audit rows and M corrections; two concurrent folds for the
    same project; then one more correction after "session end" and a
    `correct`-triggered fold. Technique: state-transition.
  - **NOT asserts.** Ordering. **Fails when** counts differ from N and M
    after the concurrent folds, OR the post-session correction does not
    reach `whisper_stats`.

- **T-31-1 (AC-7) — `init` on a fresh repository.**
  - **File.** `test/replay/init_fresh.test.ts`.
  - **Verifies.** Step 31.
  - **Level.** Acceptance.
  - **Real/doubles.** Real `ctxoracle init`; fixture `pristine-tree`; real
    filesystem. No doubles.
  - **Data.** The fixture (a) with an existing `.claude/settings.json`
    holding an unrelated hook entry and (b) with no `.claude/` directory at
    all; `init` invoked three ways — `node dist/src/cli/dispatch.js`, through
    a symlink named `ctxoracle`, and via `npx --yes --package=<path to the
    tarball `npm pack` produced in the test's setup> ctxoracle init` (the
    npx cache is populated from that tarball, so no registry fetch occurs
    and a fresh CI checkout behaves like the layout reproduction).
    Technique:
    state-transition × equivalence partitioning over invocation modes.
  - **NOT asserts.** Wiring content beyond the eight matching entries.
    **Fails when** the count of entries matching the Step 31 pattern ≠ 8 in
    any mode, OR any written `command` does not name the real
    `dist/src/cli/dispatch.js`, OR the unrelated entry changed, OR any
    written entry carries a field outside the documented set, OR case (b)
    does not create the directory and file and record that in
    `schema_meta`, OR stores are missing or not 0o700, OR the first
    index/mine did not run, OR the summary omits key/mode/identity or the
    written command.

- **T-31-2 — `init` is idempotent.**
  - **File.** `test/replay/init_idempotent.test.ts`.
  - **Verifies.** Step 31.
  - **Level.** Acceptance.
  - **Real/doubles.** Real CLI; real fixture. No doubles.
  - **Data.** After T-31-1's state, delete one matching entry and set another's
    `timeout` to 9; re-run `init`. Technique: state-transition.
  - **NOT asserts.** Byte preservation of a file in a non-canonical layout
    (the fixture's file is canonical 2-space JSON with a trailing newline,
    the form Claude Code writes). **Fails when** the deleted entry is not
    restored, OR the `timeout` is not repaired to 5, OR any other byte of
    the file changes.

- **T-31-3 — `init` warns on a keying-mode change.**
  - **File.** `test/replay/init_keying_change.test.ts`.
  - **Verifies.** Step 31.
  - **Level.** Acceptance.
  - **Real/doubles.** Real CLI; a shallow fixture unshallowed between runs.
    No doubles.
  - **Data.** `repo-key-shallow` → init (mode `url`) → `git fetch --unshallow`
    → init. Technique: state-transition.
  - **NOT asserts.** Auto-migration. **Fails when** the plain-language
    warning does not print before proceeding, OR the first store is silently
    orphaned without the migration offer.

- **T-32-1 (AC-7) — `deinit` removes exactly the matching entries.**
  - **File.** `test/replay/deinit_marker.test.ts`.
  - **Verifies.** Step 32; AC-7's pristine-tree diff.
  - **Level.** Acceptance.
  - **Real/doubles.** Real CLI; fixture `pristine-tree` after init plus
    hand-added unrelated entries. No doubles.
  - **Data.** (a) Settings with 8 matching + 2 unrelated entries; (b) a
    `.claude/settings.json` that `init` created in a tree that had none;
    `deinit`; `deinit --purge`; `git status --porcelain` on the fixture.
    Technique: state-transition.
  - **NOT asserts.** Store contents. **Fails when** any matching entry
    survives, OR any unrelated entry is removed, OR in case (b) the file or
    the empty `.claude/` directory remains, OR the tree diff after `deinit`
    is anything but the removed wiring (empty in case (b)), OR `--purge`
    leaves the store.

- **T-32-2 (AC-19) — Export/import record-identical round-trip, no egress.**
  - **File.** `test/replay/export_roundtrip.test.ts`.
  - **Verifies.** Step 32.
  - **Level.** Acceptance.
  - **Real/doubles.** Real stores; real `VACUUM INTO`; on Linux the verbs
    run inside `unshare -rn` (a network namespace with no interfaces —
    executed 2026-09-07, §11.4), which is the runtime no-egress condition;
    where `unshare` is unavailable or refuses (`EPERM` on a runner that
    disables unprivileged user namespaces) the test records that leg as not
    executed with the reason and `T-32-3` carries the assertion. No doubles.
  - **Data.** Both stores populated with one row per table shape; export;
    delete; import into a fresh home; per-table canonical-order dumps before
    and after (D-plan-4's ordering keys; FTS tables compared by a fixed
    `MATCH` query list). Technique: state-transition + equivalence
    partitioning per table.
  - **NOT asserts.** Byte-identical files (the SQLite documentation says the
    copy is rebuilt — §11.4). **Fails when** any row or `MATCH` result set
    differs, OR import reports a constraint or `quick_check` error, OR
    either verb fails inside the namespace.

- **T-32-3 — No network module anywhere in Phase A.**
  - **File.** `test/conventions/no_network_modules.test.ts`.
  - **Verifies.** Step 32 — AC-11's and AC-19's no-egress clauses as a
    structural property: no module under `dist/src/**` imports `http`,
    `https`, `http2`, `net`, `tls`, `dgram` (either specifier spelling) or
    `undici`, and none of the tokens `fetch(`, `fetch (`, `globalThis.fetch`,
    `.fetch` appears.
  - **Level.** Unit (import scan + token scan over `dist/src/**`).
  - **Real/doubles.** Real `dist/`; no doubles.
  - **Data.** Clean build; a seeded `import 'node:https'`; a seeded `await
    fetch(`, a seeded `globalThis.fetch`, and a seeded `fetch (` in
    temporary compiled modules. Technique: state-transition.
  - **NOT asserts.** Dependency internals beyond `dist/src/**` (V14: the two
    runtime dependencies are WASM packages with no network code). **Fails
    when** the clean build reports a hit OR any seeded hit is missed.

- **T-33-1 (AC-9 rendering) — `status` renders every FR-M4 signal.**
  - **File.** `test/replay/status_renders_all.test.ts`.
  - **Verifies.** Step 33.
  - **Level.** Acceptance.
  - **Real/doubles.** Real `ctxoracle status`; a store seeded with one row
    per fault code, one whisper, one deny, one correction, a voided intake
    row with a deny fired, every `plan_seed` row, and
    `schema_meta.pinned_interpreter` set once to an existing path and once
    to a removed one. No doubles.
  - **Data.** The seeded store. Technique: decision table (each signal
    present/absent in output).
  - **NOT asserts.** Aesthetics. **Fails when** any Step 33 signal is missing,
    OR the reserved codes render as 0, OR the regret rate lacks its label or
    pairing, OR the bypass bound or any seed value is absent, OR the
    removed-interpreter case is not named as missing.

- **T-33-2 — `log` renders the per-session audit trail.**
  - **File.** `test/replay/log_readback.test.ts`.
  - **Verifies.** Step 33.
  - **Level.** Acceptance.
  - **Real/doubles.** Real CLI; real store with 3 whispers, 1 deny, and a
    done-claim counter entry. No doubles.
  - **Data.** The seeded session. Technique: state-transition.
  - **NOT asserts.** Aesthetics. **Fails when** any row is missing, OR
    evidence/pointer is omitted, OR the counter's questions are absent.

- **T-33-3 — `tune` round-trips and lists sources.**
  - **File.** `test/replay/tune_roundtrip.test.ts`.
  - **Verifies.** Step 33.
  - **Level.** Acceptance.
  - **Real/doubles.** Real CLI; real store. No doubles.
  - **Data.** Set a scalar; add and remove a list member; list. Technique:
    state-transition.
  - **NOT asserts.** Bar recomputation. **Fails when** any value is lost or
    mutated, OR the listing omits a source or a default.

- **T-33-4 (AC-9) — `hooks_not_firing` induced and detected by `status`.**
  - **File.** `test/replay/hooks_not_firing.test.ts`.
  - **Verifies.** Step 33 — a session with a liveness row, a transcript that
    grew past `diag.hooks_not_firing_gap_s` after its last event, and no
    `SessionEnd` row is flagged; a session whose last event is recent is
    not.
  - **Level.** Acceptance.
  - **Real/doubles.** Real CLI; real store; real transcript file whose
    mtime the test advances with `fs.utimes` (a real timestamp, not a
    double). No doubles.
  - **Data.** Two sessions and one non-session: (a) liveness row at t, last
    event at t, transcript mtime t + 20 min; (b) liveness row at t, last
    event at t + 19 min, transcript mtime t + 20 min; (c) a transcript under
    the repository's slug with mtime 20 min after the newest liveness row
    and no liveness row for its session at all (the totally-dead wiring).
    Technique: boundary value on the gap.
  - **NOT asserts.** Timer behaviour (none exists, AD-1). **Fails when** (a)
    records no `hooks_not_firing` fault or is not flagged in `status`, OR (b)
    is flagged, OR (c) records no `hooks_not_firing` with the
    "no session started the hooks" detail.

- **T-34-1 — `correct --verdict false_fire` updates the rate and the fold.**
  - **File.** `test/replay/correct_verdict.test.ts`.
  - **Verifies.** Step 34.
  - **Level.** Acceptance.
  - **Real/doubles.** Real CLI; real stores. No doubles.
  - **Data.** A recorded deny; `correct <id> --verdict false_fire`; `status`;
    the global `whisper_stats`. Technique: state-transition.
  - **NOT asserts.** Absolute rate values. **Fails when** the wrongful-deny
    rate does not increment OR `whisper_stats.corrected_false` does not.

- **T-34-2 (AC-2c under-fire) — `--missed-question` re-arms and disclosed limits.**
  - **File.** `test/replay/correct_missed_question.test.ts`.
  - **Verifies.** Step 34; AC-2c's answer-drift under-fire clause.
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler; real store; real CLI. No doubles.
  - **Data.** A fixture stream in which an indirect ask ("tell me whether
    renaming is safe") was not recognized and an `Edit` went undenied;
    `correct --missed-question "was renaming safe"`; replay the `Edit`
    (denied now); the two collision cases (already-open; Bash-only
    deviation). Technique: state-transition.
  - **NOT asserts.** Bash enforcement (L3). **Fails when** the re-armed deny
    does not fire, OR either collision case prints the wrong message.

- **T-35-1 (AC-23) — `note` lands in the project store and outranks mined inference.**
  - **File.** `test/replay/note_project.test.ts`.
  - **Verifies.** Step 35.
  - **Level.** Acceptance.
  - **Real/doubles.** Real CLI; real store. No doubles.
  - **Data.** A mined landmine for X; `note --kind landmine` contradicting
    it; the Warning generator's query for X. Technique: state-transition.
  - **NOT asserts.** Global routing. **Fails when** the note lands elsewhere,
    OR the query does not resolve human-first.

- **T-35-2 (AC-23) — `note --global` lands in `lessons`.**
  - **File.** `test/replay/note_global.test.ts`.
  - **Verifies.** Step 35.
  - **Level.** Acceptance.
  - **Real/doubles.** Real CLI; real stores. No doubles.
  - **Data.** `note --global "<lesson>"`. Technique: equivalence partitioning.
  - **NOT asserts.** Cross-project retrieval. **Fails when** the row lands in
    the project store or nowhere.

### 12.3 Acceptance replays (Step 38; each pins a spec criterion or an architecture case)

Every entry in this subsection carries all six fields. The acceptance
level and the real/double boundary are the same for the replays — real
handler binary spawned per event by `test/replay/runner.ts`, real stores in
a temp home, real fixture repositories and transcript files, no doubles —
and are stated on each entry.

- **T-38-1 (AC-2a) — Intake then deny; answer-directed moves free.**
  - **File.** `test/replay/answer_drift_off_to_unrelated.test.ts`.
  - **Verifies.** Steps 23–25 through the pipeline.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `answer-drift-clearly-off`; stream: `UserPromptSubmit
    {prompt: "why is the deploy failing?"}` → `PreToolUse Edit` → `PreToolUse
    Read` → `PreToolUse Bash npm test` → `PreToolUse Edit`. Technique:
    state-transition.
  - **NOT asserts.** Agent behaviour after the deny. **Fails when** either
    `Edit` is not denied with the question in the reason, OR `Read` or `Bash`
    is denied, OR a `stop_hook_active`/continuation field appears in any
    response.

- **T-38-2 — Reconciliation backfills `asked_uuid`.**
  - **File.** `test/replay/answer_drift_reconciliation.test.ts`.
  - **Verifies.** Step 25 through the pipeline.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Intake precedes the transcript's matching human turn; a later
    event triggers catch-up. Technique: state-transition.
  - **NOT asserts.** Write ordering. **Fails when** the row's `asked_uuid`/
    `asked_offset` are not backfilled after catch-up.

- **T-38-3 (AC-2a-i allow-half) — Subagent not denied.**
  - **File.** `test/replay/answer_drift_subagent_allow.test.ts`.
  - **Verifies.** Step 25; `FR-O6`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Main-agent question open; a subagent `PreToolUse Edit` carrying
    `agent_id`. Technique: state-transition.
  - **NOT asserts.** The deny-half (Phase B). **Fails when** the subagent's
    `Edit` is denied.

- **T-38-4 (FR-B1 lag clause) — Lag hold and self-recovery.**
  - **File.** `test/replay/answer_drift_lag_hold.test.ts`.
  - **Verifies.** Step 25.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** The clearing assistant turn is appended to the transcript
    *after* the event whose catch-up last ran and before the next
    `PreToolUse Edit`; the runner controls the append. Technique:
    state-transition (hold → next event → allowed).
  - **NOT asserts.** Milliseconds of lag. **Fails when** the first `Edit`
    after the append is not denied (pre-cleared), OR the `Edit` after the
    following catch-up is denied.

- **T-38-5 — `deny_after_answer_lag` recorded.**
  - **File.** `test/replay/deny_after_answer_lag.test.ts`.
  - **Verifies.** Step 26 through the pipeline.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** The T-38-4 stream continued: after the recovery, the catch-up
    classifies the clearing turn whose timestamp precedes the deny.
    Technique: state-transition.
  - **NOT asserts.** Downstream action. **Fails when** the fault is not
    recorded with both ids.

- **T-38-6 (AC-9 deny classes) — Deny health detectors induced end-to-end.**
  - **File.** `test/replay/deny_health_induced.test.ts`.
  - **Verifies.** Step 26; AC-9's "deny that outlives its condition" class
    (a real short answer the clear recognizer misses, surfacing as
    `deny_despite_answer_text`), `deny_loop`, `deny_bypass_suspect`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Three streams: three `Edit`s with no text between; a
    floor−1-character real answer between denies; a denied `Edit` on
    `target.ts` followed in the same turn by `PostToolUse Bash "echo x >
    target.ts"`. Technique: state-transition per detector.
  - **NOT asserts.** Bypass intent. **Fails when** any detector does not
    fire on its stream.

- **T-38-7 — `SessionStart {source: startup}` expires prior open rows.**
  - **File.** `test/replay/session_start_startup.test.ts`.
  - **Verifies.** Step 27.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Two seeded `open` rows; a `startup` event. Technique:
    state-transition.
  - **NOT asserts.** Other sources (T-38-8, T-38-20). **Fails when** any row
    remains `open`.

- **T-38-8 — `SessionStart {source: resume}` rebuilds from the transcript.**
  - **File.** `test/replay/session_start_resume.test.ts`.
  - **Verifies.** Step 27; L11(a)'s loud failure.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Two runs: marker-carrying and marker-less transcript fixtures.
    Technique: equivalence partitioning.
  - **NOT asserts.** Rebuild performance. **Fails when** the marker-carrying
    run does not reopen the question, OR the marker-less run does not emit
    `rebuild_recovered_nothing`.

- **T-38-9 (AC-8a) — Outstanding-question line at a done-claim stop.**
  - **File.** `test/replay/stop_outstanding_question_line.test.ts`.
  - **Verifies.** Step 27 through the pipeline; delivery via
    `additionalContext`, the stop proceeds.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** (done-claim, open) / (done-claim, none) / (no claim, open);
    plus the documented non-fire: a verbose finisher whose narration cleared
    the question (`generic_text_all_prior`) — no line, but the counter
    records it. Technique: decision table.
  - **NOT asserts.** Phrasing. **Fails when** presence mismatches any cell,
    OR any response carries a `decision: "block"`, OR the counter misses the
    verbose-done case.

- **T-38-10 (AC-1) — Coupling: non-obvious pair fires, obvious pair silent.**
  - **File.** `test/replay/coupling_nonobvious.test.ts`.
  - **Verifies.** Step 18 (Coupling generator) and Step 16 (the bar) through the pipeline; `AC-1`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `coupling-nonobvious`; `PostToolUse Read` on each file.
    Technique: equivalence partitioning.
  - **NOT asserts.** Ranking. **Fails when** no whisper for the non-obvious
    pair, OR a whisper for the obvious pair, OR the ratio or pointer is
    missing, OR the pointer does not resolve.

- **T-38-11 (AC-1a) — Orientation: 2–4 entry points, invariant when recorded, no landmines.**
  - **File.** `test/replay/orientation_mixed_shape.test.ts`.
  - **Verifies.** Step 18 (Orientation generator) and Step 35 (`note` invariant) through the pipeline; `AC-1a`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `orientation-mixed-shape` with and without a `note`
    invariant; `UserPromptSubmit`. Technique: decision table + boundary.
  - **NOT asserts.** Ordering among ties. **Fails when** the count is outside
    2–4, OR the seeded invariant is absent, OR a landmine appears at the
    prompt event.

- **T-38-12 (AC-1b) — Reuse: crown, silence, observed-0, caveat.**
  - **File.** `test/replay/reuse_mixed_language.test.ts`.
  - **Verifies.** Step 18 (Reuse generator) and Step 15 (frontends) through the pipeline; `AC-1b`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** The three reuse fixtures; `PostToolUse Grep`. Technique:
    decision table.
  - **NOT asserts.** Semantic equivalence. **Fails when** silence where a
    crown is due, a crown where silence is due, or a missing caveat/cap.

- **T-38-13 (AC-1c) — Consequence: coupled tests and zone flag headline.**
  - **File.** `test/replay/consequence_coupled_tests.test.ts`.
  - **Verifies.** Step 18 (Consequence generator) and Step 14 (zone flag) through the pipeline; `AC-1c`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `consequence-coupled-tests`; `PreToolUse Edit`.
    Technique: state-transition.
  - **NOT asserts.** Call-site counts. **Fails when** the coupled tests are
    missing OR the headline is a raw count.

- **T-38-14 (AC-1d) — Completeness: unchanged partner delivered at Stop.**
  - **File.** `test/replay/completeness_paired_change.test.ts`.
  - **Verifies.** Step 18 (Completeness generator) and Step 20 (Stop-time channel) through the pipeline; `AC-1d`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `completeness-paired-change`; an `Edit` on one half;
    `Stop`. Technique: state-transition.
  - **NOT asserts.** Landmines at Stop. **Fails when** the partner is not
    named with its ratio, OR delivery is not via `additionalContext`, OR a
    `decision: "block"` appears.

- **T-38-15 (AC-3) — Two above-bar candidates both delivered.**
  - **File.** `test/replay/bar_no_cap.test.ts`.
  - **Verifies.** Step 16 (no cap on above-bar candidates) and Step 20 through the pipeline; `AC-3`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `bar-two-candidates`. Technique: equivalence
    partitioning.
  - **NOT asserts.** Ranking. **Fails when** fewer than two whispers are
    emitted at the event.

- **T-38-16 (AC-3a) — Low-confidence hazard delivered with its flag.**
  - **File.** `test/replay/bar_hazard_bypass.test.ts`.
  - **Verifies.** Step 16 (hazard bypass of the floor) through the pipeline; `AC-3a`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `warning-landmine` (the support-2, below-floor row);
    `PreToolUse Edit` on its file. Technique: boundary value.
  - **NOT asserts.** High-confidence hazards. **Fails when** the whisper is
    suppressed OR the confidence flag is missing from the text.

- **T-38-17 (AC-4) — Read-set subject withheld.**
  - **File.** `test/replay/dedup_read_set.test.ts`.
  - **Verifies.** Step 20 (per-consumer read-set dedup) through the pipeline; `AC-4`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `dedup-read-set`; `PostToolUse Read` on X, then a
    candidate on X; a candidate on a file the agent is not touching.
    Technique: state-transition.
  - **NOT asserts.** Cross-consumer withholding. **Fails when** the read-set
    subject is delivered OR the untouched-file candidate fires.

- **T-38-18 (AC-6) — Corpus floor.**
  - **File.** `test/replay/corpus_floor.test.ts`.
  - **Verifies.** Step 13 (corpus floor) and Step 18 (history genres) through the pipeline; `AC-6`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `corpus-floor-29`, then the generator's 30th commit.
    Technique: boundary value.
  - **NOT asserts.** Non-history genres. **Fails when** history whispers fire
    at 29 OR do not fire at 30.

- **T-38-19 (FR-D1) — Rumor rule end-to-end.**
  - **File.** `test/replay/rumor_rule.test.ts`.
  - **Verifies.** Step 19 (rumor rule) through the pipeline; `FR-D1`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** A candidate's cited span mutated between candidate generation
    and the event's compose. Technique: state-transition.
  - **NOT asserts.** Mutation mechanics. **Fails when** the whisper is
    emitted OR `whisper_dropped_stale` is not recorded.

- **T-38-20 (AC-5) — Session-boundary dedup reconciliation.**
  - **File.** `test/replay/session_boundary_dedup.test.ts`.
  - **Verifies.** Step 20 (session-boundary reconciliation, `D-20`) through the pipeline; `AC-5`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Five runs, one per `source`. Technique: state-transition.
  - **NOT asserts.** Read-set internals. **Fails when** any `source` yields a
    dedup state different from D-20's table.

- **T-38-21 (FR-B4) — Stop-time single cycle.**
  - **File.** `test/replay/stop_single_cycle.test.ts`.
  - **Verifies.** Step 20 (Stop-time channel) and Step 28 through the pipeline; `FR-B4`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Two `Stop` events, the second with `stop_hook_active: true`.
    Technique: state-transition.
  - **NOT asserts.** The harness's 8-cap. **Fails when** the second emits
    `additionalContext`.

- **T-38-22 (AC-11) — Planted secrets and injection payloads.**
  - **File.** `test/replay/security_ac11.test.ts`.
  - **Verifies.** Step 11 (redactor, injection flagger) and Step 21 (entry adapter) through the pipeline and `export`; `AC-11`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `secret-injection`: secrets in file content, a commit
    message, and zone evidence; injection payloads in file content, a commit
    message, a question text (the deny reason must quote it verbatim and
    the oracle must not act on it), and question-shaped text in a
    hook-feedback and a task-notification transcript entry (must open no
    question); export both stores; the whole stream and both verbs run
    inside `unshare -rn` where it is available and permitted (T-32-2's
    condition and its recorded-as-not-executed branch on an absent or
    refusing `unshare`; `T-32-3` carries AC-11's no-egress clause then). Technique: decision table (surface ×
    payload).
  - **NOT asserts.** Exhaustive secret coverage (L5). **Fails when** any
    secret appears verbatim in any whisper, store, log, or export, OR any
    injected transcript entry opens a question, OR any whisper carries
    verbatim repo text, OR any event or verb fails inside the namespace.

- **T-38-23 (AC-15) — Subagent-keyed delivery.**
  - **File.** `test/replay/subagent_delivery.test.ts`.
  - **Verifies.** Step 20 (per-consumer keying by `agent_id`) through the pipeline; `AC-15`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `subagent-delivery`; a subagent tool event triggering
    Coupling. Technique: state-transition.
  - **NOT asserts.** Main-agent behaviour. **Fails when** the whisper lands on
    the main stream or its `consumer_state` row is not keyed by `agent_id`.

- **T-38-24 (AC-17) — Config-added language becomes grammar-indexed.**
  - **File.** `test/replay/language_config_added.test.ts`.
  - **Verifies.** Step 14 (extension table) and Step 33 (`tune`) through `index`; `AC-17`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `language-config-added` with an extension absent from
    the default table; index; `tune index.ext_to_grammar +<ext>=<grammar>`;
    index. Technique: state-transition.
  - **NOT asserts.** Grammar quality. **Fails when** the second index does not
    use the tree-sitter frontend for that file.

- **T-38-25 (AC-20) — Cold-container install and first index.**
  - **File.** `scripts/check-cold-container.sh` (invoked by the
    `cold-container` CI job Step 38 adds, not by the runner).
  - **Verifies.** Step 1 (packaging), Step 3 (FTS5 probe), Step 31 (`init`); `AC-20`.
  - **Level.** System (real clean container).
  - **Real/doubles.** Real container, real `npm`, real install. No doubles.
  - **Data.** A fresh `node:22.16.0-bookworm` container with the network
    policy Step 38 states (the default runner network); `pristine-tree`.
    Technique: error guessing.
  - **NOT asserts.** Runtime behaviour beyond install and index. **Fails
    when** `npm ci` or `npm run build` fails, OR an install-phase script ran,
    OR `init` does not complete its first index, OR the FTS5 probe is false.

- **T-38-26 (AC-22) — Idle silence.**
  - **File.** `test/replay/idle_silence.test.ts`.
  - **Verifies.** Step 28 (event-driven only — no timer, no daemon; `AD-1`); `AC-22`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** A long gap (the runner sleeps 3 s and then advances the
    stream's timestamps by 6 h) between two events; a boundary event after;
    the store's and diagnostics directory's mtimes and the process table
    sampled across the gap. Technique: state-transition.
  - **NOT asserts.** Wall-clock precision. **Fails when** any store or
    diagnostics write occurs during the gap, OR a `ctxoracle` process is
    alive during the gap, OR the post-gap boundary event does not fire
    normally.

- **T-38-27 (AC-18) — Seeded-fact coverage.**
  - **File.** `test/replay/seeded_facts_exit.test.ts` (also invoked by Step
    39, leg 3).
  - **Verifies.** Step 38 fixture generator and Step 39 leg 3 through the pipeline; `AC-18`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `seeded-facts` (a planted coupling, a planted
    landmine); a stream that touches each. Technique: state-transition +
    equivalence partitioning.
  - **NOT asserts.** Whisper counts. **Fails when** either seeded fact is not
    delivered with a matching pointer, OR `status` does not report the run.

- **T-38-28 (AC-8) — Verification whisper headlines the covering-test mapping.**
  - **File.** `test/replay/verification_headline.test.ts`.
  - **Verifies.** Step 18's Verification generator and done-claim recognizer
    through the pipeline; `FR-B4` delivery.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `verification-covering-test`: an `Edit` on a region with
    a covering test; `Stop` with a done-claim `last_assistant_message`;
    variants: no run; run `ok`; run `failed`; `make check`. Technique:
    decision table.
  - **NOT asserts.** Test-run execution. **Fails when** the whisper's headline
    is not the covering-test → changed-region mapping, OR run-state stands
    alone, OR the `ok`-run variant fires, OR the `failed`-run variant asserts
    either not-run clause, OR delivery is not a single `additionalContext`.

- **T-38-29 (FR-A2e, FR-A5a) — Warning whisper: evidence and flagged confidence.**
  - **File.** `test/replay/warning_headline.test.ts`.
  - **Verifies.** Step 18 (Warning generator) and Step 19 (compose) through the pipeline; `FR-A2e`, `FR-A5a`, `FR-D4`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `warning-landmine`; `PreToolUse Edit` on a
    `revert_chain` file and on a `human_stated` file. Technique: equivalence
    partitioning over kinds.
  - **NOT asserts.** Bar internals. **Fails when** the whisper lacks its
    evidence and support, OR the confidence is not stated when not high, OR
    the ⚠ subtype's fallibility note (FR-D4) is missing, OR the text is
    imperative.

- **T-38-30 (AC-2c over-fire) — Substantive reworded answer clears; information-gathering never denied.**
  - **File.** `test/replay/answer_drift_overfire.test.ts`.
  - **Verifies.** Steps 23, 25 through the pipeline.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Question open; the assistant answers substantively in
    different words; `PreToolUse Edit` (allowed); a second stream where the
    answer is the terse direct "No." and a third where it is "Sure."
    (allowed — the seeded floor of 2 does not tax a direct answer); a
    fourth where the answer is a causal sentence containing the word
    "later" (allowed — no bare word holds); a fifth stream where `Read`,
    `Grep`, and `Bash` are taken with the question open (all allowed).
    Technique: decision table.
  - **NOT asserts.** Substantive-vs-deferral discrimination (Phase B,
    AC-2a-ii). **Fails when** the post-answer `Edit` is denied, OR any
    information-gathering move is denied.

- **T-38-31 (L1 residual) — The wrongful-deny residual is counted, escapable, and re-ask works.**
  - **File.** `test/replay/answer_drift_residual.test.ts`.
  - **Verifies.** Step 25 (deny), Step 27 (open-scoped dedup index), Step 34 (`correct`) through the pipeline; `L1` residual.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Prompt "can you rename `foo` to `bar`?"; `PreToolUse Edit`
    (denied — the accepted residual); a plan-stating text turn; `Edit`
    (allowed); `correct <deny-id> --verdict false_fire`; then the same
    question re-asked verbatim after a blanket clear, followed by `Edit`
    (denied again — the open-scoped dedup index). Technique:
    state-transition.
  - **NOT asserts.** That the residual is avoidable in Phase A. **Fails
    when** the first `Edit` is not denied, OR the post-text `Edit` is denied,
    OR the correction does not raise the wrongful-deny rate, OR the re-ask
    does not re-arm the deny.

- **T-38-32 (L11(a)) — Marker presence on real transcripts.**
  - **File.** `test/build_time/marker_presence.ts` (executed by Step 39 over
    the replay corpus; its self-test runs against `test/replay/transcript_fixtures/`).
  - **Verifies.** Step 38 build-time script over the corpus Step 39 leg 1 enumerates; `L11(a)`.
  - **Level.** Build-time verification.
  - **Real/doubles.** Real transcript files. No doubles.
  - **Data.** Every corpus the exit run's leg 1 declares; the self-test's
    fixtures, passed as two declared corpora and once with no declaration.
    Technique: equivalence partitioning over `(declared machine, declared
    mode, shape, origin.kind, isMeta)`.
  - **NOT asserts.** That markers are present (that is the measured
    outcome). **Fails when** the script cannot parse a transcript it is given,
    OR its table omits a class present in the input, OR the table is not
    keyed by the declared corpus origin, OR an undeclared corpus is not
    reported "origin unknown".

- **T-38-33 (L6) — Grammar inventory.**
  - **File.** `test/build_time/grammar_inventory_check.ts`.
  - **Verifies.** Step 38 build-time script over Step 15's default table; `L6`.
  - **Level.** Build-time verification.
  - **Real/doubles.** Real installed `tree-sitter-wasms`, real
    `web-tree-sitter`. No doubles.
  - **Data.** The default `index.ext_to_grammar` table. Technique: equivalence
    partitioning (each grammar present/loadable).
  - **NOT asserts.** Parse quality. **Fails when** any grammar the default
    table names is missing from the package or fails to load.

### 12.4 Coverage reconciliation

**AC → T-ID(s):**

| AC | T-ID(s) | Phase |
|---|---|---|
| AC-1 | T-18-2, T-38-10 | A |
| AC-1a | T-18-1, T-38-11 | A |
| AC-1b | T-18-3, T-38-12 | A |
| AC-1c | T-18-4, T-38-13 | A |
| AC-1d | T-18-6, T-38-14 | A |
| AC-2 | T-24-1, T-24-2, T-24-3, T-28-2 | A |
| AC-2a | T-25-1, T-25-3, T-38-1, T-38-2 | A |
| AC-2a-i (allow-half) | T-25-3, T-38-3 | A |
| AC-2a-i (deny-half) | — | B (deferred) |
| AC-2a-ii | — | B (deferred) |
| AC-2b | — | C (deferred) |
| AC-2c (answer-drift over-fire) | T-38-30, T-38-4 | A |
| AC-2c (answer-drift under-fire, human channel) | T-34-2 | A |
| AC-2c (skill under-fire) | — | C (deferred) |
| AC-3 | T-16-1, T-38-15 | A |
| AC-3a | T-16-1, T-38-16 | A |
| AC-4 | T-20-1, T-38-17 | A |
| AC-5 | T-20-1, T-38-20 | A |
| AC-6 | T-13-1, T-38-18 | A |
| AC-7 | T-31-1, T-31-2, T-32-1 (both with and without a pre-existing settings file) | A |
| AC-8 | T-18-7, T-38-28 | A |
| AC-8a | T-27-2, T-38-9 | A |
| AC-9 | T-10-1 (`store_corrupt`), T-29-1 (`latency_breach`), T-14-2 (`index_stale`), T-28-4 (`produced_but_undelivered`), T-33-4 (`hooks_not_firing`), T-26-1 + T-38-6 (the deny that outlives its condition), T-38-8, T-33-1 (rendering) | A |
| AC-10 | T-29-1, T-28-3 | A |
| AC-11 | T-11-1..T-11-4, T-38-22, T-32-3 | A |
| AC-12 (deterministic parts) | T-38-1, T-38-4, T-36-1 (no model path; nothing switched off) | A |
| AC-13 | T-13-1, T-14-1, T-14-2, T-16-1 (recency and stale-index dampening cases) | A |
| AC-14 | T-19-1 | A |
| AC-15 | T-38-23 | A |
| AC-16 | — | C (deferred) |
| AC-17 | T-38-24 | A |
| AC-18 | T-38-27 (Step 39 leg 3) | A |
| AC-19 | T-32-2, T-32-3 | A |
| AC-20 | T-38-25 | A |
| AC-21 | T-5-2, T-5-3, T-29-2 (guard mechanism); full induced self-trigger | A (mechanism) / B (full) |
| AC-22 | T-38-26 | A |
| AC-23 | T-30-2, T-34-1, T-35-1, T-35-2 | A |
| AC-24 | T-30-1 (held and never-triggered) | A |
| AC-25 | — | B (deferred) |

- **T-40-1 — STATUS rewrite passes the docs check.**
  - **File.** `scripts/check-status-post-build.sh`.
  - **Verifies.** Step 40.
  - **Level.** Acceptance (project CI check).
  - **Real/doubles.** Real `tools/check_docs.py`. No doubles.
  - **Data.** The rewritten `docs/STATUS.md`. Technique: error guessing.
  - **NOT asserts.** The checker's own behaviour. **Fails when** the checker
    exits non-zero.

Every Phase A AC in spec §14 maps to at least one Phase A T-ID; every
deferred AC is listed with its phase; every §7 step maps to at least one
T-ID or to the consolidation it performs.

---
## 13. Risks

Ordered by potential to cause Phase A to miss its goal, most severe first.

- **R1 — The recognizers are elaborated beyond the safe skeleton during
  Step 23 or during any later "fix".** The standing warning is the
  collapse-log 2026-09-04 entry. Mitigation: the rule-complement
  assertions in `T-23-1`, `T-23-2`, `T-23-3`, and `T-18-8` (D-plan-19) fail on
  an elaboration; the build order puts the recognizers after the whisper
  path and runs their fixtures alongside it at Checkpoint 4 (D-plan-1);
  Checkpoint 5 treats a suspiciously high coverage number as a finding.
  Recoverability: full — cut the elaboration.

- **R2 — The build passes every test and the exit run shows the block
  catches very little on real transcripts.** This is the spec's expected
  outcome (§11.5). Not a risk to the goal; the risk is *hiding* it, and the
  report's mandatory fields and the printed seeds and bounds are the
  mitigation.

- **R3 — The hooks contract drifts again between plan and build.** It
  drifted between 2026-08-29 and 2026-09-07 on timeout semantics (§4).
  Mitigation: `hook/adapter.ts` is the one file naming hook fields (T-28-2);
  `init` writes only documented entry fields; the plan's §3 entries carry
  read dates so a build-time re-read is a targeted diff. Recoverability:
  full — a drift is an adapter-file change.

- **R4 — Bash-only drift defeats the answer-drift block (L3).**
  Mitigation: the `deny_bypass_suspect` diagnostic with its printed bound
  (D-plan-16); the human channel records misses (T-34-2). Owned per `D-39`
  and L3; Phase B narrows it.

- **R5 — A marker-less transcript mode drops a real question on
  rebuild (L11(a)).** Mitigation: `rebuild_recovered_nothing` (T-27-1,
  T-38-8); the marker-presence script over the real corpus in the exit run
  (T-38-32); mid-session enforcement never depends on markers (intake reads
  `prompt`).

- **R6 — `tree-sitter-wasms` 0.1.13 does not ship a grammar Max Cogar's
  repositories need.** Mitigation: T-38-33 at build; the generic frontend
  keeps those languages searchable and Reuse-safe (incomparable-set
  silence); a missing grammar becomes a `tune index.ext_to_grammar` row or a
  checked-in WASM grammar without a redesign (C-6).

- **R7 — The exit run's inputs are thin: no transcripts on the exit-run
  machine, or few closed-loop sessions.** Mitigation: the validity rule
  makes the reflection-only case impossible to pass silently; the report
  prints transcript and session counts and drivers; Phase B's architecture
  judges sufficiency from those counts (§11.5). Recoverability: more
  sessions, another report.

- **R8 — Leg 1's reconstruction of hook streams from transcripts does not
  match the order the harness would have fired.** The transcript layout and
  the hook-to-transcript correspondence are undocumented (V12). Mitigation:
  the report labels leg 1 as a reconstruction; `transcript_path` is
  materialised as a per-event prefix so the reconstruction never shows
  the handler the session's future; leg 2's live sessions carry the
  order-sensitive measurements (the lag-hold rate, L11(b)); IDEAS.md #14's
  structural limits are restated in the report. Recorded as gap G4.

- **R13 — The implementing agent cannot install hooks or start a session
  in the target repositories from its environment.** A remote container
  may refuse the settings write or the session start (the 2026-09-06
  session recorded an in-container hook install blocked by a permission
  classifier). Mitigation: leg 2's driver is recorded per session; when
  no agent-driven session can start, the validity rule fails loudly and
  the report says which action was refused; Max Cogar's own sessions
  reach the report through `export`, so the measurement is still possible
  without a workload transfer. Recoverability: full — the run is repeated
  from a machine that can start sessions.

- **R9 — The `whisper_stats` fold double-counts under concurrent
  same-project handlers.** Mitigation: the single `BEGIN IMMEDIATE`
  transaction (Step 30) and `T-30-2`.

- **R10 — `busy_timeout=100ms` + retry-once is too aggressive on a
  contended store.** Phase A is one user driving one session; contention
  is low. Mitigation: the `store_busy` diagnostic; the second failure fails
  open, so the agent never sees it; the timeout is not a tunable in Phase A
  (AD-26 fixes it), so a real contention problem is a finding for the
  architecture, not a `tune`.

- **R11 — Node or TypeScript moves under the pins.** Mitigation: CI runs at
  the floor and at the current 22.x (Step 1); the tsconfig uses no option
  TypeScript 7 removed; the dev pins are exact so a change is a visible diff.

- **R12 — A plan-seeded threshold is badly off and the exit numbers are
  dominated by it.** Mitigation: every seed is printed with the report;
  `tune` moves it without a recompile; `deny_despite_answer_text` and human
  corrections measure the clear floor's miss directions; the report is
  read as conditional (D-plan-7).

**Hardest step.** Step 23 — not for its size but because the temptation to
elaborate is the collapse-log's recorded failure; the non-coverage tests
are the mechanical guard, and the reviewer's job at Checkpoint 4 is to
confirm they are still present and still assert the rule's complement.

**Points of no return.** Step 39's report, once published, is the Phase B
design input; Checkpoint 5 gates it. Nothing else is irreversible: stores
are outside the tree, `deinit` restores the pristine tree (AC-7), and
migrations are forward-only on a store the owner can `--purge`.

**Coupling hotspots.** `codegraph_get_stats` on the current tree reports
none (one code file, zero edges — §11.6). Within the planned tree the
highest-fan-in modules by construction are `stores/adapter.ts` (every
store access), `hook/handler.ts` (every event), `qa/state.ts` (every deny
read), and `diag/fault_writer.ts` (every fault); the post-build
`codegraph_scan` and `codegraph_get_stats` in §16 measure this rather than
assume it, and each of the four is behind a convention test or a single
seam.

---
## 14. Question register

Every question encountered during planning, the step where it arose, its
bin, and its closed disposition.

### 14.1 Bin 1 — engineering questions (derived and answered)

- **Q1 (Step 1).** Which versions of the two runtime dependencies and the
  compiler does the plan pin? **Disposition.** Answered: the versions the
  architecture verified (V14), exact; `typescript` 5.9.3 and `@types/node`
  22.20.1 — D-plan-2; evidence §11.4 (registry reads; the TypeScript 7.0
  announcement).
- **Q2 (Step 1).** How do TypeScript tests execute at the Node 22.16.0
  floor, and how is a vacuous pass prevented? **Disposition.** Answered:
  compiled with the sources into `dist/` and run through a runner that
  refuses an empty or mismatched set — D-plan-3; evidence §11.4 (Node docs
  and changelog; the empty-glob execution; the layout reproduction).
- **Q3 (§5).** Do any files exist under `middleware/context-oracle/ctxoracle/`
  or is there a `README.md`? **Disposition.** Answered: neither exists —
  §11.6.
- **Q4 (Step 5).** What does the resolver do when `git rev-parse
  --is-shallow-repository` prints neither `true` nor `false` (very old git)?
  **Disposition.** Answered: rule 4 (path-keyed) with a diagnostic; AD-3
  names no such case and the safe direction is the visible one.
- **Q5 (Step 5).** Which URL normalization axes apply to the shallow-mode
  identity? **Disposition.** Answered — D-plan-15 (scheme dropped, user-info
  dropped, host lowercased, port kept, trailing `/` and `.git` stripped,
  path case kept, identity string printed).
- **Q6 (Step 5).** How is "every spawned process carries
  `CTXORACLE_INTERNAL=1`" enforced? **Disposition.** Answered — D-plan-14
  (single spawn wrapper + convention test T-5-3).
- **Q7 (Step 7).** Does the migration runner support down-migration?
  **Disposition.** Answered: no — AD-25 is forward-only; the recovery path
  is `deinit --purge` then `init`.
- **Q8 (Step 12).** Which tunable defaults does the architecture state and
  which does it leave open; what values do the open ones take?
  **Disposition.** Answered — D-plan-7 and Step 12's two provenance
  classes; the open values are recorded as gap G1 with their reasoning.
- **Q9 (Step 15).** Are parser instances pooled across processes?
  **Disposition.** Answered: no — AD-1 (no daemon); pooled inside the
  indexer process only.
- **Q10 (Step 17).** How is `npm run test` classified? **Disposition.**
  Answered: the seeded runner lexicon includes `npm run test`, `pnpm test`,
  `yarn test`, `node --test`; extensible via `tune`.
- **Q11 (Step 18).** Does a `Bash cat file.ts` count as a read that triggers
  Coupling? **Disposition.** Answered: no — AD-4's consumer filter reads
  Edit/Write/Read rows only.
- **Q12 (Step 24).** Could `tsc` inline the `permissionDecision` literal
  into callers and defeat the built-output grep? **Disposition.**
  Answered: the failure direction is safe — an inlined literal would make
  the clean build *fail* T-24-2 loudly (a false violation), never pass
  falsely; T-24-2's seeded cases also pin the detector.
- **Q13 (Step 25).** How is the lag-window hold implemented; is a separate
  lag detector needed? **Disposition.** Answered — D-plan-9 (no detector;
  read-to-EOF + deny-on-open; the rate is measured).
- **Q14 (Step 26).** What is the bypass predicate's coverage? **Disposition.**
  Answered — D-plan-16 (exactly AD-4's list; bound printed beside the
  count).
- **Q15 (Step 28).** Which event fires first in a fresh session?
  **Disposition.** Answered: `SessionStart` ("when a session starts") before
  any `UserPromptSubmit` ("when you submit a prompt") — hooks reference
  lifecycle table, 2026-09-07 (§11.4).
- **Q16 (Step 29, §4).** The hooks reference now says a timed-out
  `PreToolUse` command hook lets the tool call continue; does the watchdog
  or the wired timeout change, and is this an owner decision?
  **Disposition.** Answered — D-plan-12: no requirement changes; the
  watchdog stays on `NF-1`/`FR-O3` grounds; not an owner decision (no
  requirement or scope is affected).
- **Q17 (Step 31).** How does `init` mark its entries so `deinit` removes
  exactly them under a strictly-validating harness? **Disposition.**
  Answered — D-plan-6 (the documented `command` field, matched by pattern).
- **Q18 (Step 32).** Byte-identical or record-identical for AC-19, and by
  what mechanism? **Disposition.** Answered — D-plan-4 (record-identical
  per-table dump through the Store; SQLite documentation in §11.4).
- **Q19 (Step 33).** What phrasing does `status` use for the reserved codes?
  **Disposition.** Answered: "model path — not yet measured (Phase B)";
  "missed skill-block — not yet measured (Phase C)".
- **Q20 (Step 36).** What shape does the model seam take? **Disposition.**
  Answered — D-plan-8 (the verified invocation contract and its envelope,
  re-executed 2026-09-07).
- **Q21 (Step 38).** Are the L11 build-time verifications owner-run?
  **Disposition.** Answered: no — D-plan-11 (scripts executed by the build;
  the induction inside the closed-loop leg; "not observed" is a recorded
  outcome).
- **Q22 (Step 39).** What repository set and what modes make the exit run
  honest, and who drives the closed-loop sessions? **Disposition.**
  Answered — D-plan-10 and D-plan-26 (three legs, validity rule, named
  candidates; the implementing agent creates and drives every counted
  session; sessions Max Cogar drives in his OL-11 role are additional,
  reach the report through the same export, and are listed separately).
- **Q23 (Step 39).** Do transcripts exist under `~/.claude/projects/` on
  the machine the exit run executes on? **Disposition.** Discovered at run
  time by enumeration and reported, including zero; the plan does not
  depend on the answer (leg 2 carries the measurement) — the runtime-only
  part is gap G3.
- **Q24 (§7).** Is the build order topologically valid and are the
  checkpoints executable where placed? **Disposition.** Answered —
  D-plan-1 (every Dependencies field names earlier steps only; every
  checkpoint names only tests runnable at that point); mechanically
  re-checked in §14.4.
- **Q25 (§12).** Which tests run at a step and which at a checkpoint?
  **Disposition.** Answered — D-plan-17 (function-level at the step;
  the Step 28–35 replays at their steps once the harness exists;
  `T-38-*` replays at Checkpoint 4).
- **Q26 (skill Steps 2, 6).** Are the CodeGraph and Clear Thought MCP
  servers runnable in this environment? **Disposition.** Answered: both run
  over stdio and were used — §11.4, §5, §6, §10.
- **Q27 (Step 1).** Does `tree-sitter-wasms` 0.1.13's self-dependency
  (`^0.1.11`) cause a nested install or an install script? **Disposition.**
  Answered: `npm install` with the exact pins resolves it to the package
  itself; no install-phase script ran; no native `.node` file is present —
  §11.4 (layout reproduction).
- **Q28 (Step 1).** Do `fs.readdirSync(…, {recursive: true})` and
  `import.meta.resolve` exist at the 22.16.0 floor? **Disposition.**
  Answered: documented in the v22.x API pages and executed on 22.22.2
  (§11.4); the floor itself is exercised by CI's 22.16.0 matrix entry
  (Step 1), which is the only place the floor is executed.
- **Q29 (Step 3).** Is `DatabaseSync.prototype.backup` the right API for
  export? **Disposition.** Answered: no such method exists on this runtime
  (the module-level `sqlite.backup()` does — §11.4); export uses `VACUUM INTO` per
  AD-5 regardless.
- **Q30 (Step 6).** Does the fault-code set include codes the architecture
  names outside AD-17? **Disposition.** Answered: `store_busy` (AD-26) and
  the plan-named `whisper_dropped_stale` (AD-15's compose-time drop) are
  added and listed explicitly in Step 6 and T-6-1.
- **Q31 (Step 6).** Can `T-6-1` enumerate a `const enum` at runtime under
  the Step 1 tsconfig? **Disposition.** Answered: no — `TS2475` on
  `Object.values` of a `const enum` in the same compilation (executed,
  §11.4); the code set is an `as const` tuple with a derived type (Step 6,
  Gate 3).
- **Q32 (Step 9).** Which step creates `src/stores/dao/tuning.ts`?
  **Disposition.** Answered: Step 12 (with its seeding logic); Step 9
  creates every other DAO; §5.1 annotates the file accordingly and `T-9-1`
  excludes it.
- **Q33 (Step 1).** How do must-fail compile-time fixtures coexist with a
  project build that compiles `test/`? **Disposition.** Answered:
  `exclude` on the fixtures directory plus a per-fixture `tsc --noEmit`
  invocation — executed both ways (§11.4); D-plan-3.
- **Q34 (Step 1).** When does the first test need a fixture repository,
  and when the first replay a binary? **Disposition.** Answered: `T-5-1`
  at Step 5 and `T-28-1` at Step 28; the generator is Step 1's, the harness
  and the `hook` verb are Step 28's — D-plan-1.
- **Q35 (Step 31).** What string does `init` write as the hook command,
  and does the marker match it under every install mode? **Disposition.**
  Answered — D-plan-6: interpreter plus the real path of `dispatch.js`,
  executed under direct `node`, the `npm -g` symlink, and `npx` (§11.4).
- **Q36 (Step 36).** Which environment variables does the seam's scrub
  drop, and does the shipped command authenticate under it?
  **Disposition.** Answered — D-plan-8: the six-variable session-identity
  set; executed three ways 2026-09-07 (§11.4).
- **Q37 (Step 39).** What is the denominator of "the fraction of human
  questions the recognizer opened"? **Disposition.** Answered — D-plan-10:
  a seeded labelled sample under the plan's written rule (D-plan-26),
  labelled before replay and blind to the store, published with the
  report; leg 2's re-asks and corrections as closed-loop ground truth.
- **Q38 (Step 39).** What does leg 1 mount as `transcript_path`?
  **Disposition.** Answered — D-plan-10: a per-event prefix of the stored
  transcript, never the whole file.
- **Q39 (Step 32).** Can a proxy-environment listener observe egress from
  a Node process? **Disposition.** Answered: no — Node consults the
  variables only under `NODE_USE_ENV_PROXY`/`--use-env-proxy`, and the
  listener was never contacted either way (§11.4); D-plan-23.
- **Q40 (Step 24).** Can AD-10's single producer and AD-6's single naming
  site both hold when the deny is a wire field? **Disposition.** Answered:
  yes — the verdict is an internal branded value whose annotated
  construction fails outside `blocks/verdict.ts` (`T-24-3`; an `as`
  assertion still compiles, §11.4) and which only `answer_drift.ts`
  imports (`T-24-2`, the structural guard); the adapter alone writes
  `permissionDecision` (`T-28-2`).
- **Q41 (Step 23).** Where may a deferral phrase sit in a turn for the
  turn not to clear? **Disposition.** Answered: the phrase's position is
  irrelevant — every deferral phrase is removed and the turn clears when
  what remains meets the floor (Step 23; `T-23-2`; D-plan-24 — executed
  over the spec's examples and the direct-answer class, §11.4); AD-9's
  "not a recognized content-free deferral" carries no positional
  restriction, and FR-B5 forbids holding on an answer for being short or
  for sitting beside a deferral.
- **Q42 (Step 30).** Is a fact no generator ever produced a candidate for
  inside the regret population? **Disposition.** Answered: yes — FR-L4
  says "below-bar, or never triggered"; the population is store-held
  facts (Step 30; `T-30-1`).
- **Q43 (Step 39).** Which session kind runs the hooks `init` wrote to a
  clone's `.claude/settings.json` without a trust dialog, and does a hook
  written during a session take effect in it? **Disposition.** Answered:
  a `-p` or SDK session treats the folder as trusted and runs settings-file
  hooks from its first event; an interactive session holds them back until
  the dialog is accepted (the "Workspace trust" section, §11.4,
  `probe:13_hooks_reference.optional` asserting the sentence inside that
  section); mid-session loading is undocumented and is not relied on — the
  leg-2 protocol runs `init` before any session and drives `claude -p`
  sessions, with the liveness row as the observable (D-plan-26); a counted
  session runs with `--permission-mode acceptEdits` and an `--allowedTools`
  list, because a `-p` session can show no permission prompt and would
  otherwise deny every `Edit`/`Write` (§11.4).
- **Q44 (Step 39).** How many `Stop` events does one turn produce?
  **Disposition.** Answered: one — the reference's once-per-turn cadence
  (§11.4); leg 1's reconstruction emits one `Stop` after the last assistant
  entry that precedes the next human turn (D-plan-10).
- **Q45 (Step 38).** Does the cold-container image carry `git`?
  **Disposition.** Answered: `node:22.16.0-bookworm` does — its
  Dockerfile, the `22/bookworm` one at the `docker-node` commit that sets
  `NODE_VERSION 22.16.0`, derives from `buildpack-deps:bookworm`, whose
  scm layer installs it — and `-slim` does not
  (`probe:14_docker_node_git.optional`); the job runs on
  `node:22.16.0-bookworm`.
- **Q46 (Step 3).** Does T-3-3's contention schedule produce its asserted
  outcomes every time, including on a loaded runner? **Disposition.**
  Answered: yes, because the schedule is forced by observables — each
  child starts or proceeds only after the previous child's reported state —
  rather than by timing (a 50 ms process-start shift flips a timed
  schedule's outcome for B under load); it reproduces under `--repeat 5
  --load 3` (`probe:07_sqlite_busy_schedule`, §11.4).
- **Q47 (Step 24).** Does the `unique symbol` brand prevent every
  construction of a `DenyVerdict` outside its module? **Disposition.**
  Answered: no — an `as` assertion compiles; an annotated construction
  fails with `TS2741` (`probe:05_deny_brand`); the importer scan `T-24-2`
  is the structural guard and the brand is stated as confining annotated
  construction only.
- **Q48 (Step 33).** Can `hooks_not_firing` see a wiring that never fired?
  **Disposition.** Answered: not with the per-session detector alone — the
  totally-dead half compares transcripts for the repository's slug against
  the newest liveness row, and `init`/`status` print the pinned interpreter
  with an existence check (D-plan-25; `T-33-4` case (c)).
- **Q49 (Steps 32, 38).** Does `unshare -rn` run on the `ubuntu-24.04`
  GitHub Actions runner? **Disposition.** Answered: no — writing the
  unprivileged user namespace's `uid_map` is refused there (§11.4, the
  `check-plan` job's run of `probe:09_unshare_no_network.optional`);
  `T-32-2` and `T-38-22` record the refusal instead of failing, AC-11's
  no-egress clause rests on the structural scan (`T-32-3`) there, and the
  runtime leg executes wherever `unshare` is permitted.
- **Q50 (Steps 21, 33).** How is a repository's transcript directory
  derived from its path? **Disposition.** Answered: `projectTranscriptDir`
  in `locate.ts` returns `~/.claude/projects/<slug>/` with `<slug>` the
  realpath of `cwd` with every `/` replaced by `-` (one observation,
  §11.4); the totally-dead detector calls it, so `locate.ts` stays the one
  module that knows the layout (AD-11).
- **Q51 (Steps 7, 14).** What do `init` and search do on a runtime whose
  SQLite lacks FTS5? **Disposition.** Answered — D-plan-28: `init` applies
  001 and skips 001b, `symbolSearch`/`pathSearch` take the indexed `LIKE`
  path behind the same interface, `status` prints `fts_state`; `T-7-1` and
  `T-14-1` run both paths.
- **Q52 (Step 29).** Where and when is the ≈400 MB `large-store` built?
  **Disposition.** Answered — D-plan-5 as amended: Step 29's generator
  builds it through the real migrations and DAOs into the test's temp
  home, cached per run directory and rebuilt per CI job with its build
  time printed by `T-29-1`; `T-1-3` covers fixture repositories only.
- **Q53 (Steps 14, 15).** How does the indexer reach frontends a later
  step creates? **Disposition.** Answered — D-plan-29: `runIndex` takes its
  frontend list as an argument; Step 14 builds and tests the skeleton with
  an empty list; Step 15 creates both frontends and `defaultFrontends()`,
  which the `index` verb (Step 28) and `init` (Step 31) pass.

### 14.2 Bin 2 — user decisions

**None.** Every scope element derives from the signed-off spec and the
reviewed architecture; the one premise drift found (Q16) changes no
requirement; the exit run's drivers are the roles `OL-11` already states;
no exclusion or deferral beyond the spec's own phasing was proposed.

### 14.3 Bin 3 — genuine gaps (closed into §15)

- **G1 (Step 12):** *"Is there an external standard that fixes the values
  of the thresholds the architecture leaves open?"* — no; the seeds and the
  attempt are in §15.
- **G2 (Step 39):** *"Does `UserPromptSubmit` fire for platform-injected
  turns?"* — undocumented; the attempt and the run-time resolution are in
  §15.
- **G3 (Step 39):** *"Does a transcript corpus exist on the exit-run
  machine?"* — runtime-only information; §15.
- **G4 (Step 39):** *"Is the transcript-to-hook-event correspondence
  documented, so leg 1's reconstruction is exact?"* — no; §15.

### 14.4 Reconciliation sweep

Seven passes over the assembled document, 2026-09-07.

- **Pass 1 (mechanical + read).** A script over the plan reconciled every
  T-ID defined in §12 against every step's Verification field, every
  checkpoint, the §5.1 tree annotations and the §12.4 tables; every
  `File.` path in §12 against the §5.1 tree; every `Dependencies` field
  against the step order; every `Source`/`Verifies` citation (AD-n, V-n,
  L-n, FR-*, AC-*, D-n, OL-*) against the architecture, spec, and ledger;
  every step's six fields and Gate 3 parts; every D-plan/Q/G/R reference
  against its definition. Register entries added: Q31, Q32.
- **Pass 2 (mechanical re-run + read of §14 against §7 and §12).** Zero
  reconciliation defects; zero entries added.
- **Pass 3 (whole-document re-read).** The same script re-run, plus a read
  of every step's
  `What changes` and `Verification` against §5.1 and §12 and of every
  register entry against the step it names. Register entries added:
  Q33–Q42, each closed.
- **Pass 4 (round-3 corrections, mechanical re-check).** After the round-3
  findings were applied and the plan converted to the skill's step
  declarations: the derivation script's `--check` (declarations, build
  order, generated regions, probe citations) and the probe run, plus a read
  of every changed step and its tests against §10, §11, and §12. Register
  entries added: Q43–Q48, each closed; Q37, Q40, Q41 re-derived from the
  changed decisions.
- **Pass 5 (whole-document re-read).** The same checks re-run on the pass-4
  text, plus a read of every register entry against the step it names and
  of every §10 decision against its trace file. Zero reconciliation
  defects; added zero entries.
- **Pass 6 (round-4 corrections, mechanical re-check + impact walk).**
  After the round-4 findings were applied: `--check` and the probe run
  under `--repeat 3 --load 2`; the derivation script's `--impact` report
  against the round-4 text listed the 37 steps whose text changed and
  every register entry, decision, checkpoint, and step sentence that
  restates each, and each listed surface was read against its step.
  Register entries added: Q49–Q52, each closed; Q22, Q37, Q40, Q41, Q43,
  Q46 re-derived from the changed decisions; D-plan-27 and D-plan-28 added
  and D-plan-5 amended, each with its §10A entry and its trace chain.
- **Pass 7 (whole-document re-read).** The same checks re-run on the
  pass-6 text, plus a read of every register entry against the step it
  names and of every §10 decision against the trace file that carries its
  chain. Zero reconciliation defects; added zero entries. Bin 2 remains
  empty; bins 1 and 3 are fully dispositioned.

---

## 15. Gaps acknowledged

Each entry carries its resolution-attempt evidence and what would close it.

- **G1 — No external standard fixes the plan-seeded thresholds.** The
  values: `bar.reuse_dominance_k` 3; `deny.despite_answer_text_threshold` 3;
  `qa.clear_length_floor_chars` 2; `landmine.fix_chatter_k` 3 within 90
  days; `security.entropy_bits_per_char` 4.0 over tokens ≥ 20 characters;
  `qa.done_claim_trailing_turns_k` 3; `bar.recency_half_life_days` 365;
  `bar.stale_index_factor` 0.8; `diag.hooks_not_firing_gap_s` 600 (Step
  12; reasoning in D-plan-7).
  **Attempt.** Read the architecture in full for stated values (AD-9, AD-14,
  AD-15, AD-18, AD-19 — §11.6 records the exact passages that leave them
  open); read spec §9's ROSE note (the spec "lifts no fixed operating
  point"; "the operating point set on Phase A data") and §5.2 ("ships high
  and is calibrated"); the ROSE paper's operating point is support/
  confidence for co-change, not a dominance ratio, a text-length floor, or
  an entropy threshold. No named standard exists for these values.
  **What closes it.** The exit run (Step 39): the report prints each seed
  beside the numbers conditional on it, and `tune` moves any of them —
  the calibration the spec assigns to Phase A data.

- **G2 — Whether `UserPromptSubmit` fires for platform-injected turns is
  undocumented.** **Attempt.** Fetched the hooks reference 2026-09-07
  (§11.4): the event is described as "When you submit a prompt, before
  Claude processes it", with no statement about injected turns; the
  hooks-guide page carries the same wording. No documentation states it
  either way. It cannot be induced inside a session whose hooks are already
  loaded. **What closes it.** The live induction in Step 39's closed-loop
  leg (D-plan-11), recorded as fires / does not fire / not observed. Until
  then the design holds L11's posture: safe against a persistent wrongful
  deny (the voiding guard), transient case counted.

- **G3 — Whether a transcript corpus exists on the machine the exit run
  executes on is runtime-only information.** **Attempt.** Enumerated
  `/root/.claude/projects/` in this session: one transcript (this session's
  own), which shows that a remote session's container holds only its own
  transcript; whether Max Cogar's local machine holds a corpus under
  `~/.claude/projects/` cannot be observed from here. **What closes it.**
  Step 39's leg 1 enumerates and reports the corpus, including zero; leg 2
  carries the measurement if it is empty.

- **G4 — The correspondence between transcript entries and the hook events
  a session would have fired is undocumented, so leg 1's reconstruction is
  best-effort.** **Attempt.** The hooks reference (2026-09-07) documents each
  event's inputs but not their relation to transcript entries; the
  transcript layout itself is undocumented (V12 — enumerated, not
  specified). **What closes it.** Nothing external; the report labels leg 1
  as a reconstruction and leg 2's live sessions carry every order-sensitive
  measurement (R8).

---

## 16. Post-completion

**After all steps complete:**

1. **Verify Phase A acceptance.** Every Phase A AC in §12.4 passes on
   fixtures (`npm test` and `npm run test -- --replay` green at the floor
   and at the current 22.x) AND the exit run's report exists with the
   validity rule met; `ctxoracle status` reports a clean session in each
   leg-2 store (spec §14's opening clause, Phase A subset).

2. **Publish the exit report** at `docs/reviews/<date>-phase-a-exit-run.md`
   with every field Step 39 lists.

3. **Rewrite `docs/STATUS.md`** (Step 40): Phase A complete; next step
   Phase B architecture, written from the exit report per the per-phase
   lifecycle.

4. **Route lessons** from the build to `docs/collapse-log.md` if they
   generalise — one line each plus a pointer to the review that grounds it.

5. **Do NOT amend the architecture.** Any behaviour surfacing during the
   build that contradicts it is a Stop-and-Escalate condition — raise it
   to the owner with the evidence. Four premise-maintenance items are
   handed to the architecture's next revision (a documentation change, not
   a design change), listed here so they are not lost: V6's timeout clause
   is superseded (§4); V14's versions are still the pinned ones and 0.27.0
   exists (§11.4); L11(a)'s status is whatever the exit report's
   origin-keyed marker table says — *verified* only if an owner-local
   interactive transcript was in the corpus; AD-21's "scrubbed
   environment" is the enumerated session-identity set the executed
   contract supports (§11.4).

6. **Exported-surface check.** The pre-implementation baseline is the
   2026-09-07 `codegraph_scan` of `middleware/context-oracle/` (one code
   file, no exports of interest — §11.6). After the build: `codegraph_scan`
   with `force: true` on the same root, then `codegraph_diff_surface`; the
   `added` list must equal the exported symbols the §7 steps specify (the
   named exports in each "What changes" field, one module per §5.1 file),
   with no additions the plan did not call for — any extra export is an
   unplanned breaking-change candidate to investigate, not wave through.
   Then `codegraph_find_related_docs` over the new files and
   `codegraph_verify_doc` on `docs/architecture-phase-a.md` and this plan:
   every symbol name they cite must resolve to the built code.

7. **File-list reconciliation.** `git diff --stat` against the
   pre-implementation baseline (the commit this plan was delivered at) is
   compared with §5.1's generated file→step table in both directions: a
   touched file with no §5.1 row, or a §5.1 row whose file the diff never
   touched, is investigated, not waved through — this is the
   implementation-time check that surfaces a path a declaration got wrong
   (a phantom `create:`, a missing `modify:`), which no delivery-time check
   can see because no diff exists before implementation.

8. **Re-run the structural probes** on the built tree
   (`codegraph_find_cycles`, `codegraph_find_broken_imports`,
   `codegraph_find_unused_imports`, `codegraph_find_dead_exports`,
   `codegraph_find_unreachable`) — all must be empty except the entry
   point; `codegraph_get_stats` records the actual coupling hotspots for
   the coupling-hotspots entry of §13, which the Phase B plan replaces with measured values.

**Follow-up work this plan may create:**

- The exit report's outcome for G2 (L11(b)) and T-38-32 (L11(a)) either
  shrinks or confirms L11's disclosure — an architecture premise-maintenance
  item for the Phase B architecture session.
- If the report shows a Phase A genre performing materially worse than the
  architecture predicted, a Phase A patch precedes Phase B — a genuine
  iteration on Phase A, not a Phase B item.
- Grammar-inventory gaps from T-38-33 may lead to checked-in WASM grammar
  files or `tune` rows, with no runtime dependency added.

---

*End of plan. Its foundation: `docs/specs/spec-context-oracle.md`
(OL-C6-signed), `docs/architecture-phase-a.md` (reviewed to convergence
2026-09-04), `OWNER-LEDGER.md` CONFIRMED rows, and the Phase A goal recorded
in spec §11.5 and `CLAUDE.md` dominating rule 3. Where the plan cites an ID
(AD-n, FR-*, AC-*, OL-*), the cited document is the authority.*
