# Plan — Context Oracle Phase A implementation

**Status:** Phase A implementation plan, derived from `docs/specs/spec-context-oracle.md`
(spec of record, `OL-C6` 2026-08-28) and `docs/architecture-phase-a.md` (Phase A
architecture, reviewed to convergence 2026-09-04, revised twice on 2026-09-26 by the
skeleton-gap-list pass — commits `0fab6d7` and `ec3b057`). Revision of 2026-09-26
(the plan pass): the plan consumes the architecture as of `ec3b057` and records every
plan- and code-layer decision of `docs/reviews/2026-09-25-skeleton-gap-list-review.md`
in the step that owns it (the per-item map is §14.5). Revised again
2026-09-26 against the architecture at `6cff0ce`, which is the authority for this
revision: the findings of `docs/reviews/2026-09-26-plan-pass-expert-review.md`
(S1–S3, M1–M7, m1–m8) and `docs/reviews/2026-09-26-plan-pass-collapse-hunt.md`
(the D-plan-39 collapse, H1–H15, R1–R3) are applied in the steps that own them. This plan
consumes the spec and architecture and is executed by the Phase A build. Every
step here traces to an architecture decision (`AD-n`), a spec requirement
(`FR-*`, `AC-*`, `C-*`, `NF-1`, `P*`, `D-n`), or a ledger key (`OL-*`).

**Reading order.** `docs/STATUS.md` first, then `OWNER-LEDGER.md`, the spec,
`docs/architecture-phase-a.md`, `docs/collapse-log.md`. This plan is executed
against those documents, not in place of them; where the plan cites a decision
by ID (e.g. AD-9), the architecture is the authority — the plan does not
change what the architecture decided, it schedules its construction; a flaw
found in an architecture decision is raised with its evidence (`CLAUDE.md`,
"Decisions are locked"), never built around silently.

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
  indexed token-prefix fallback over the oracle's own tokenizer.
- **Repository identity (AD-3, AD-20, AD-23):** the deterministic root-commit
  / URL / realpath resolver and `<repo-key>` derivation (run by `init`, never
  on the event path), the `init`-recorded `repo_path:<root>` → key binding the
  handler looks up after a bounded upward walk (worktrees resolve to their main
  repository), 0700 store directories.
- **Project store schema (AD-4):** every Phase A table with STRICT + CHECK +
  provenance-mandatory block, plus the open-scoped double-open guard index for
  `questions`.
- **Global store schema and export/import (AD-5):** the Phase A tables
  (`global_meta` — which also holds the `init`-recorded repository bindings,
  AD-20 — `whisper_stats` as a replaceable replica of each project store's
  `stats_folds` totals, `tuning`, `lessons`); the fold's two `seq` watermarks
  and its `stats_folds` ledger live in the project store (AD-4/AD-5); export by
  `VACUUM INTO`, import by validate-then-`backup()` (never a file copy).
- **Security controls (AD-19):** the redactor, injection-suspect flagger, and
  pointer-only composition applied at every ingress.
- **Self-observability (AD-17):** the two JSONL fault channels (per project,
  and the home-level channel for faults before a repository is known) with
  every stable fault code the architecture names, the `session_log` writer,
  and the `status`/`log` renderers.
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
- **Structural indexer (AD-12):** `LanguageFrontend` interface with declared
  `{symbols, imports}` capabilities and per-language import resolvers,
  tree-sitter frontend over `web-tree-sitter` + `tree-sitter-wasms`, generic
  line-based fallback frontend, the git-listing / `readdir` file walk, zone
  classification (including the tracked-and-ignored `check-ignore` signal),
  `entry_score`, `import_edges` with unresolved-specifier counts,
  `symbol_refs`, `test_map` from the tunable test-path patterns, `files.in_tree`,
  incremental refresh with `content_hash`, size caps.
- **Co-change miner (AD-13):** `git log --no-merges -M -z --numstat --reverse
  --format=%x1e%H%x00%at%x00%s%x00%b%x00` streaming with hygiene filters
  (merge exclusion, >30-entity transactions, horizon), canonical-ordered pair
  counts plus the per-file `files.change_count` denominator, the revert and
  fix labels feeding `labelled_touches` and the per-pass landmine rebuild,
  chunked commits advancing the `last_mined_commit` watermark per chunk, the
  history-rewrite purge, `mining_in_progress`, and the corpus floor.
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
  writer discipline, re-entrant caller-owned transactions (`SAVEPOINT` below
  depth 0), write-lock holds bounded to the handler's write groups and to
  `miner.chunk_ms` chunks off-path, single `BEGIN IMMEDIATE` on the project
  store for the `whisper_stats` fold and a separate idempotent publish.
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
  V1..V22, L1..L12, threat model, ASVS mapping, traceability matrix), as of
  commit `ec3b057`. Every
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
- **npm registry metadata, read 2026-09-07 and 2026-09-11** (§11.4):
  `web-tree-sitter` 0.25.10 (published 2025-09-22, the last release of the
  0.25 line — a backport made after 0.26.0 opened on 2025-09-19), 0.26.13
  (2026-08-23) and 0.27.0 (2026-08-30, current); `tree-sitter-wasms` 0.1.13
  (2025-10-07, current and last); `typescript` 5.9.3 (2025-09-30) and 7.0.2
  (2026-07-08, current); `@types/node` 22.20.1 (the newest 22.x on
  2026-09-07); `@types/emscripten` 1.41.6 (2026-09-01, current). The plan
  pins the runtime dependencies to the pair executed to load and parse the
  shipped grammars (§4; `probe:20_grammar_inventory`,
  `probe:21_web_tree_sitter_026_loads_nothing.optional`) and the dev
  dependencies to the versions recorded in Step 1. Governs Steps 1, 12, 15.
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
- **Standards the 2026-09-26 architecture passes added, inherited as the
  architecture cites them** (its "Standards governing this architecture"
  table): SQLite `SAVEPOINT` (savepoints "are named and may be nested"),
  `VACUUM` (explicit `INTEGER PRIMARY KEY` survives `VACUUM`), the Online
  Backup API, and "How To Corrupt An SQLite Database File" §1 and §1.4 —
  govern Steps 3, 7, 30, 32; Fowler, *Patterns of Enterprise Application
  Architecture*, Unit of Work (caller-owned transaction demarcation) —
  Steps 3, 13, 14, 28; Zimmermann et al. TSE 31(6) 2005 support(A) as the
  confidence denominator — Steps 7, 13, 16; Śliwerski, Zimmermann, Zeller,
  MSR 2005 (SZZ keyword heuristic, whole-word matching) — Step 13;
  git-revert(1) and gitignore(5) plus execution on git 2.43.0 — Steps 13, 14,
  28; `go help test` ("Test packages") — Step 14; the Claude Code hooks
  reference fetched 2026-09-26 (V20–V22: a `PreToolUse` whisper is read next
  to the tool result; exit-0 stderr never reaches the model; `SessionStart`
  names no parent session and injected text is saved in the transcript) —
  Steps 18, 20, 27, 28.
- **Standards this plan pass adds for plan- and code-layer decisions of the
  gap-list review** (each cited where it governs): the WHATWG Encoding
  Standard (a `fatal` UTF-8 decoder rejects an invalid byte sequence instead
  of substituting U+FFFD) and POSIX.1-2017 §3.271 (a pathname is a byte
  string) — Steps 5, 13, 14 (G7); PEP 328 (explicit relative imports: leading
  dots name parent packages) and the TypeScript `moduleResolution: NodeNext`
  rules (relative specifiers resolve by the written path; a `.js` specifier
  maps to its `.ts` source) — Step 15 (G12); SQLite FTS5 documentation
  (the `ascii` tokenizer: every non-ASCII codepoint is a token character and
  every ASCII non-alphanumeric a separator; prefix queries `"term"*`), Unicode
  Standard Annex #15 (NFKD normalization) and the Unicode general categories
  L, N, M (letters, digits, combining marks) for the one in-house tokenizer
  AD-2 requires, and a range scan `token >= ? AND token < ? || char(0x10FFFF)`
  over a plain index — executed here 2026-09-26, §11.4 — Steps 7, 9, 14 (G16,
  N6; plan-pass collapse-hunt H4, expert review M3);
  the interface segregation principle (a component receives the narrow
  reader it uses, never the store behind it) — Step 12 (G8, G17).

---

## 4. Spec issues

Three conflicts between architecture premises and current reality were found
during planning — the first on 2026-09-07, the other two on 2026-09-11 by
executing what the architecture had only read. None changes a requirement;
each resolution is derivable, so none went to Max Cogar (`CLAUDE.md`: derive
what the spec and mission already decide). The architecture is not edited;
§16 lists each as premise maintenance for its next revision.

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

- **V14 verified the parser runtime's manifest, never that it loads a
  grammar — and the 0.26 line loads none.** V14 (2026-08-29) records
  `web-tree-sitter` 0.26.13 and `tree-sitter-wasms` 0.1.13 as "current,
  pure-WASM, with no install scripts" from npm registry metadata, and L6
  defers the loaded-grammar smoke test to build; AD-12's decision text says
  the tree-sitter frontend "covers every language for which
  `tree-sitter-wasms` ships a grammar". Executed on 2026-09-11
  (`probe:21_web_tree_sitter_026_loads_nothing.optional`,
  `probe:20_grammar_inventory`, §11.4): under `web-tree-sitter` 0.26.13 and
  0.27.0, `Language.load` rejects every one of the 36 grammars
  `tree-sitter-wasms` 0.1.13 ships, throwing an `Error` whose message is
  empty — from 0.26.0 the loader reads only a `dylink.0` custom section and
  every shipped grammar carries the legacy `dylink` section (36 of 36);
  `tree-sitter-wasms` has no later release. Under `web-tree-sitter` 0.25.10
  (the last 0.25.x, a backport published after 0.26.0 opened; no
  dependencies, no install scripts — `probe:11_web_tree_sitter_layout`,
  `probe:17_npm_registry_versions.optional`) 34 grammars load and 32 can be
  set on a parser and parse: `elm` (language ABI 12) and `ql` (ABI 10) are
  below every 0.25–0.27 runtime's minimum compatible ABI 13 and
  `setLanguage` rejects them (`Incompatible language version`; the
  `Language.load` before it reads their tables through the ABI-15 layout
  and traps or not depending on how much heap earlier grammars consumed, so
  nothing asserts the trap); `yaml`'s and `bash`'s external scanners import
  symbols the runtime never exports (`_Znwm`/`_ZdlPv`; `isalpha`), so
  `yaml` throws a `TypeError` on its first parse and `bash` on any `case …
  esac`, and the parser instance that threw is dead afterwards. Separately,
  a source file that imports `web-tree-sitter` does not compile under Step
  1's `tsconfig` unless `@types/emscripten` is installed and named in
  `types` — the package's `.d.ts` references the global `EmscriptenModule`
  and declares `@types/emscripten` only an optional peer, which npm does
  not install (`TS2304`, executed for both pins,
  `probe:22_tsc_web_tree_sitter_import`). **Resolution.** Step 1 pins
  `web-tree-sitter` 0.25.10 and adds the dev pin `@types/emscripten` 1.41.6
  with `"types": ["node", "emscripten"]` (D-plan-2 re-derived); the default
  `index.ext_to_grammar` table (seeded by Step 12, enumerated in Step 15)
  is the 32 usable grammars, with `elm`, `ql`, `yaml` and `bash` excluded
  by cause and their extensions falling to the generic frontend — AD-12's
  "every language for which `tree-sitter-wasms` ships a grammar" is, by
  execution, every grammar the pinned runtime can load *and parse*; Step
  15's frontend catches every throwable a parse raises (a `TypeError` from
  an unresolved scanner import, a `RuntimeError` from a trap), discards
  that parser instance, indexes the file through the generic frontend and
  records `frontend_parse_failed` (Step 6) with the language and path, so
  the eight further grammars whose scanners import `__assert_fail` or
  `abort` on assertion paths cannot silently poison a run. The
  alternatives, each executed: per-language grammar packages (the route
  `web-tree-sitter`'s README recommends) carry `install: node-gyp-build`
  scripts, `node-addon-api` dependencies, `binding.gyp` and native
  prebuilds — AD-25's "no postinstall scripts, no native code, no
  prebuilt-binary downloads" and C-3 fail at install, before dependency
  counting matters; a rebuilt `tree-sitter-wasms` does not exist; vendoring
  the `dylink.0`, ABI-15 `.wasm` files those packages ship as checked-in
  grammar files (no runtime dependency, no install script — a vendored
  `tree-sitter-javascript` 0.25.0 grammar loads and parses under 0.25.10,
  0.26.13 and 0.27.0 alike) is not taken in Phase A because it replaces
  AD-25's grammar source with a vendoring-and-refresh mechanism the phase
  goal does not need (dominating rule 3), and is recorded in §16 as the
  named exit if `tree-sitter-wasms` stays unmaintained — an exit that would
  also restore `yaml`, `bash`, `elm` and `ql` and does not by itself force
  a runtime bump. The pin is plan-owned: the architecture decides packages
  (AD-25), never versions (V14 is a premise row), so it moves in either
  direction only with probe 20 re-executed against the enumerated table. No
  requirement changes; V14, AD-12's coverage sentence and L6 are listed in
  §16 as premise maintenance.

- **AD-26's "directory lock" for the detached reindex races on stale
  reclaim.** AD-26 and AD-12 say the detached reindex "takes a directory
  lock; the handler never waits on it" — a mechanism named, never verified
  (no V-row). Step 14 had specified it as a `wx`-created `.reindex.lock`
  holding a pid with "stale-lock detection by pid liveness". Executed on
  2026-09-11 (a finding of the independent review of this plan's parallel
  lineage — `Maxcogar/agent-armory` PR #83, its round 10 — re-executed
  against this step's text): with the reclaim written as the text implies
  (read the pid, `process.kill(pid, 0)`, unlink when dead, retry), two real
  processes racing one abandoned lock both acquired it in 29 of 200
  iterations, because the liveness check and the unlink-and-recreate are
  two unsynchronized steps; no text specified release either. The atomic
  rename-then-verify variants that lineage tried next lost to the same
  class one syscall later. **Resolution.** The mutual exclusion AD-26 wants
  is taken from the standard AD-26 itself names — SQLite's single writer:
  the claim is a `schema_meta` row (`reindex_owner_pid`,
  `reindex_started_at`) read and written inside one `Store.transaction`
  (`BEGIN IMMEDIATE`, Step 3), held only while its pid is alive
  (`process.kill(pid, 0)`; `EPERM` counts as alive), released by deleting
  the row in a `finally`, and refused with a `reindex_locked` diagnostic
  (Step 6) rather than silently skipped (D-plan-32); executed
  (`probe:26_reindex_claim_row_race`): two real processes racing a planted
  dead-pid claim 200 times — exactly one wins every time, and the released
  row is absent. The handler still never waits: it reads the row. AD-26's
  wording is listed in §16 as premise maintenance; the job it states is
  unchanged.

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
| middleware/context-oracle/ctxoracle/.gitignore | create | S1 |
| middleware/context-oracle/ctxoracle/package-lock.json | create | S1 |
| middleware/context-oracle/ctxoracle/package.json | create | S1 |
| middleware/context-oracle/ctxoracle/scripts/check-cold-container.sh | create | S38 |
| middleware/context-oracle/ctxoracle/scripts/check-status-post-build.sh | create | S40 |
| middleware/context-oracle/ctxoracle/scripts/exit-run.sh | create | S39 |
| middleware/context-oracle/ctxoracle/scripts/run-tests.mjs | create | S1 |
| middleware/context-oracle/ctxoracle/src/bar/combinator.ts | create | S16 |
| middleware/context-oracle/ctxoracle/src/bar/combinator.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/blocks/answer_drift.ts | create | S25 |
| middleware/context-oracle/ctxoracle/src/blocks/answer_drift.ts | modify | S6, S27 |
| middleware/context-oracle/ctxoracle/src/blocks/health.ts | create | S26 |
| middleware/context-oracle/ctxoracle/src/blocks/health.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/blocks/verdict.ts | create | S24 |
| middleware/context-oracle/ctxoracle/src/cli/context.ts | delete | S35 |
| middleware/context-oracle/ctxoracle/src/cli/correct.ts | create | S34 |
| middleware/context-oracle/ctxoracle/src/cli/deinit.ts | create | S32 |
| middleware/context-oracle/ctxoracle/src/cli/dispatch.ts | create | S1 |
| middleware/context-oracle/ctxoracle/src/cli/dispatch.ts | modify | S28, S31, S32, S33, S34, S35 |
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
| middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts | modify | S9 |
| middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts | delete | S35 |
| middleware/context-oracle/ctxoracle/src/diag/fault_codes.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/diag/fault_writer.ts | create | S10 |
| middleware/context-oracle/ctxoracle/src/diag/jsonl.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/diag/log.ts | create | S33 |
| middleware/context-oracle/ctxoracle/src/diag/regret.ts | create | S30 |
| middleware/context-oracle/ctxoracle/src/diag/session_writer.ts | create | S10 |
| middleware/context-oracle/ctxoracle/src/diag/status.ts | create | S33 |
| middleware/context-oracle/ctxoracle/src/diag/whisper_stats_fold.ts | create | S30 |
| middleware/context-oracle/ctxoracle/src/diag/whisper_stats_fold.ts | modify | S9 |
| middleware/context-oracle/ctxoracle/src/genres/command_class.ts | create | S17 |
| middleware/context-oracle/ctxoracle/src/genres/completeness.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/completeness.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/genres/consequence.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/consequence.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/genres/coupling.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/coupling.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/genres/generator.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/generator.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/genres/orientation.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/orientation.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/genres/reuse.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/reuse.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/genres/verification.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/verification.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/genres/warning.ts | create | S18 |
| middleware/context-oracle/ctxoracle/src/genres/warning.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/hook/adapter.ts | create | S28 |
| middleware/context-oracle/ctxoracle/src/hook/adapter.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/hook/compose.ts | create | S19 |
| middleware/context-oracle/ctxoracle/src/hook/compose.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/hook/delivery.ts | create | S20 |
| middleware/context-oracle/ctxoracle/src/hook/delivery.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/src/hook/guard.ts | create | S10 |
| middleware/context-oracle/ctxoracle/src/hook/handler.ts | create | S28 |
| middleware/context-oracle/ctxoracle/src/hook/handler.ts | modify | S6, S30 |
| middleware/context-oracle/ctxoracle/src/hook/watchdog.ts | create | S10 |
| middleware/context-oracle/ctxoracle/src/identity/git_layout.ts | create | S14 |
| middleware/context-oracle/ctxoracle/src/identity/home.ts | create | S4 |
| middleware/context-oracle/ctxoracle/src/identity/layout.ts | create | S4 |
| middleware/context-oracle/ctxoracle/src/identity/repo_binding.ts | create | S28 |
| middleware/context-oracle/ctxoracle/src/identity/repo_key.ts | create | S5 |
| middleware/context-oracle/ctxoracle/src/index/frontend.ts | create | S14 |
| middleware/context-oracle/ctxoracle/src/index/frontends.ts | create | S15 |
| middleware/context-oracle/ctxoracle/src/index/generic_frontend.ts | create | S15 |
| middleware/context-oracle/ctxoracle/src/index/indexer.ts | create | S14 |
| middleware/context-oracle/ctxoracle/src/index/indexer.ts | modify | S9, S13, S30 |
| middleware/context-oracle/ctxoracle/src/index/path_glob.ts | create | S14 |
| middleware/context-oracle/ctxoracle/src/index/resolvers.ts | create | S15 |
| middleware/context-oracle/ctxoracle/src/index/search.ts | create | S14 |
| middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts | create | S15 |
| middleware/context-oracle/ctxoracle/src/index/walk.ts | create | S14 |
| middleware/context-oracle/ctxoracle/src/index/zone.ts | create | S14 |
| middleware/context-oracle/ctxoracle/src/miner/cochange.ts | create | S13 |
| middleware/context-oracle/ctxoracle/src/miner/cochange.ts | modify | S9 |
| middleware/context-oracle/ctxoracle/src/miner/labels.ts | create | S13 |
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
| middleware/context-oracle/ctxoracle/src/stores/dao/files.ts | modify | S13 |
| middleware/context-oracle/ctxoracle/src/stores/dao/global_meta.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/human_facts.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/import_edges.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/invariants.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/labelled_touches.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/landmines.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/lessons.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/observed_actions.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/path_tokens.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/questions.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/regret.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/schema_meta.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/session_log.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/stats_folds.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/symbol_refs.ts | create | S9 |
| middleware/context-oracle/ctxoracle/src/stores/dao/symbol_tokens.ts | create | S9 |
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
| middleware/context-oracle/ctxoracle/src/types/consumer.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/types/events.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/types/headline.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/types/hook_response.ts | create | S24 |
| middleware/context-oracle/ctxoracle/src/types/index_types.ts | create | S6 |
| middleware/context-oracle/ctxoracle/src/util/env.ts | create | S2 |
| middleware/context-oracle/ctxoracle/src/util/hash.ts | create | S5 |
| middleware/context-oracle/ctxoracle/src/util/path_bytes.ts | create | S5 |
| middleware/context-oracle/ctxoracle/src/util/spawn.ts | create | S5 |
| middleware/context-oracle/ctxoracle/src/util/spawn.ts | modify | S13 |
| middleware/context-oracle/ctxoracle/src/util/ulid.ts | create | S9 |
| middleware/context-oracle/ctxoracle/test/build_time/grammar_inventory_check.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/build_time/marker_presence.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/build_time/marker_presence.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/build/fixtures/deny_literal_outside.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/build/fixtures/headline_nonliteral.ts | create | S6 |
| middleware/context-oracle/ctxoracle/test/build/fixtures/missing_provenance.ts | create | S9 |
| middleware/context-oracle/ctxoracle/test/build/fixtures/trust_out_of_set.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/build/fixtures/verdict_updated_input.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/build/fixtures/verdict_updated_tool_output.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/build/tsc_fixture.ts | create | S1 |
| middleware/context-oracle/ctxoracle/test/build/typecheck_deny_brand.test.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/build/typecheck_headline_literal.test.ts | create | S6 |
| middleware/context-oracle/ctxoracle/test/build/typecheck_provenance.test.ts | create | S9 |
| middleware/context-oracle/ctxoracle/test/build/typecheck_trust.test.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/build/typecheck_verdict_shape.test.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/conventions/child_process_single_importer.test.ts | create | S5 |
| middleware/context-oracle/ctxoracle/test/conventions/fault_session_writers_only.test.ts | create | S10 |
| middleware/context-oracle/ctxoracle/test/conventions/headline_literals.test.ts | create | S19 |
| middleware/context-oracle/ctxoracle/test/conventions/hook_field_names_isolated.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/conventions/no_network_modules.test.ts | create | S32 |
| middleware/context-oracle/ctxoracle/test/conventions/no_skeleton_marks.test.ts | create | S37 |
| middleware/context-oracle/ctxoracle/test/conventions/permission_decision_confined.test.ts | create | S24 |
| middleware/context-oracle/ctxoracle/test/conventions/sqlite_single_importer.test.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/fixtures/generate_large_store.ts | create | S29 |
| middleware/context-oracle/ctxoracle/test/fixtures/generate.ts | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/generate.ts | modify | S13, S14, S15, S16, S18, S28, S30, S38 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/.gitkeep | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/answer-drift-clearly-off/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/bar-two-candidates/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/completeness-paired-change/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/consequence-coupled-tests/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/corpus-floor-29/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/coupling-key-symmetry/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/coupling-nonobvious/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/dedup-read-set/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/indexer-nongit/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/indexer-small/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/indexer-walk/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/language-config-added/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/miner-denominator/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/miner-hygiene/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/miner-labels/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/miner-large/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/orientation-mixed-shape/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/over-threshold-file/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/pristine-tree/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/recency-weighting/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/regret-no-inflate/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/regret-true-positive/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-full/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-nongit/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-shallow-no-origin/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-shallow/ | create | S1 |
| middleware/context-oracle/ctxoracle/test/fixtures/repos/reuse-alias-unresolved/ | create | S1 |
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
| middleware/context-oracle/ctxoracle/test/replay/audit_groups.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/bar_hazard_bypass.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/bar_no_cap.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/completeness_paired_change.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/consequence_coupled_tests.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/corpus_floor.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/correct_genre.test.ts | create | S34 |
| middleware/context-oracle/ctxoracle/test/replay/correct_missed_question.test.ts | create | S34 |
| middleware/context-oracle/ctxoracle/test/replay/correct_verdict.test.ts | create | S34 |
| middleware/context-oracle/ctxoracle/test/replay/coupling_key_symmetry.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/coupling_nonobvious.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/dedup_read_set.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/deinit_marker.test.ts | create | S32 |
| middleware/context-oracle/ctxoracle/test/replay/deny_after_answer_lag.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/deny_health_induced.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/error_mapping.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/export_roundtrip.test.ts | create | S32 |
| middleware/context-oracle/ctxoracle/test/replay/fail_open.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/fork_reseed.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/hook_stream_fixtures/ | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/hook_stream_fixtures/ | modify | S38 |
| middleware/context-oracle/ctxoracle/test/replay/hooks_not_firing.test.ts | create | S33 |
| middleware/context-oracle/ctxoracle/test/replay/idle_silence.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/import_validate.test.ts | create | S32 |
| middleware/context-oracle/ctxoracle/test/replay/init_fresh.test.ts | create | S31 |
| middleware/context-oracle/ctxoracle/test/replay/init_idempotent.test.ts | create | S31 |
| middleware/context-oracle/ctxoracle/test/replay/init_keying_change.test.ts | create | S31 |
| middleware/context-oracle/ctxoracle/test/replay/integrity_check_verb.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/language_config_added.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/liveness_row.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/log_readback.test.ts | create | S33 |
| middleware/context-oracle/ctxoracle/test/replay/note_global.test.ts | create | S35 |
| middleware/context-oracle/ctxoracle/test/replay/note_project.test.ts | create | S35 |
| middleware/context-oracle/ctxoracle/test/replay/observation_row.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/orientation_mixed_shape.test.ts | create | S38 |
| middleware/context-oracle/ctxoracle/test/replay/pipeline_order.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/produced_but_undelivered.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/replay/recursion_guard.test.ts | create | S29 |
| middleware/context-oracle/ctxoracle/test/replay/regret_proxy.test.ts | create | S30 |
| middleware/context-oracle/ctxoracle/test/replay/repo_resolution.test.ts | create | S28 |
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
| middleware/context-oracle/ctxoracle/test/unit/bar_recency.test.ts | create | S16 |
| middleware/context-oracle/ctxoracle/test/unit/bar_tiers.test.ts | create | S16 |
| middleware/context-oracle/ctxoracle/test/unit/bar.test.ts | create | S16 |
| middleware/context-oracle/ctxoracle/test/unit/command_class_compound.test.ts | create | S17 |
| middleware/context-oracle/ctxoracle/test/unit/command_class.test.ts | create | S17 |
| middleware/context-oracle/ctxoracle/test/unit/compose_rumor_rule.test.ts | create | S19 |
| middleware/context-oracle/ctxoracle/test/unit/concurrency_worker.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/unit/concurrency.test.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/unit/consumer_key.test.ts | create | S6 |
| middleware/context-oracle/ctxoracle/test/unit/dao_crud.test.ts | create | S9 |
| middleware/context-oracle/ctxoracle/test/unit/delivery_dedup.test.ts | create | S20 |
| middleware/context-oracle/ctxoracle/test/unit/delivery_reseed.test.ts | create | S20 |
| middleware/context-oracle/ctxoracle/test/unit/delivery_stop_channel.test.ts | create | S20 |
| middleware/context-oracle/ctxoracle/test/unit/deny_health.test.ts | create | S26 |
| middleware/context-oracle/ctxoracle/test/unit/done_claim_recognizer.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/env.test.ts | create | S2 |
| middleware/context-oracle/ctxoracle/test/unit/fault_codes.test.ts | create | S6 |
| middleware/context-oracle/ctxoracle/test/unit/frontend_capabilities.test.ts | create | S15 |
| middleware/context-oracle/ctxoracle/test/unit/fts5_probe.test.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/unit/generator_determinism.test.ts | create | S1 |
| middleware/context-oracle/ctxoracle/test/unit/generic_frontend.test.ts | create | S15 |
| middleware/context-oracle/ctxoracle/test/unit/genre_common.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_completeness.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_consequence.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_coupling.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_orientation.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_reuse.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_verification.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/genre_warning.test.ts | create | S18 |
| middleware/context-oracle/ctxoracle/test/unit/import_resolvers.test.ts | create | S15 |
| middleware/context-oracle/ctxoracle/test/unit/indexer_frontends.test.ts | create | S15 |
| middleware/context-oracle/ctxoracle/test/unit/indexer_stale.test.ts | create | S14 |
| middleware/context-oracle/ctxoracle/test/unit/indexer_walk.test.ts | create | S14 |
| middleware/context-oracle/ctxoracle/test/unit/indexer.test.ts | create | S14 |
| middleware/context-oracle/ctxoracle/test/unit/injection_negative.test.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/unit/injection_positive.test.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/unit/jsonl_writer.test.ts | create | S6 |
| middleware/context-oracle/ctxoracle/test/unit/latency_instrument.test.ts | create | S10 |
| middleware/context-oracle/ctxoracle/test/unit/layout.test.ts | create | S4 |
| middleware/context-oracle/ctxoracle/test/unit/migrations_global.test.ts | create | S8 |
| middleware/context-oracle/ctxoracle/test/unit/migrations_phase_a.test.ts | create | S7 |
| middleware/context-oracle/ctxoracle/test/unit/miner_branches.test.ts | create | S13 |
| middleware/context-oracle/ctxoracle/test/unit/miner_chunks_worker.ts | create | S13 |
| middleware/context-oracle/ctxoracle/test/unit/miner_chunks.test.ts | create | S13 |
| middleware/context-oracle/ctxoracle/test/unit/miner_denominator.test.ts | create | S13 |
| middleware/context-oracle/ctxoracle/test/unit/miner_git_env.test.ts | create | S13 |
| middleware/context-oracle/ctxoracle/test/unit/miner_landmines.test.ts | create | S13 |
| middleware/context-oracle/ctxoracle/test/unit/miner_rewrite.test.ts | create | S13 |
| middleware/context-oracle/ctxoracle/test/unit/miner.test.ts | create | S13 |
| middleware/context-oracle/ctxoracle/test/unit/model_invoke_stub.test.ts | create | S36 |
| middleware/context-oracle/ctxoracle/test/unit/package_build.test.ts | create | S1 |
| middleware/context-oracle/ctxoracle/test/unit/path_bytes.test.ts | create | S5 |
| middleware/context-oracle/ctxoracle/test/unit/path_glob.test.ts | create | S14 |
| middleware/context-oracle/ctxoracle/test/unit/qa_state.test.ts | create | S22 |
| middleware/context-oracle/ctxoracle/test/unit/question_lifetime.test.ts | create | S27 |
| middleware/context-oracle/ctxoracle/test/unit/reader_reseed.test.ts | create | S21 |
| middleware/context-oracle/ctxoracle/test/unit/reader_v12_counts.test.ts | create | S21 |
| middleware/context-oracle/ctxoracle/test/unit/reader.test.ts | create | S21 |
| middleware/context-oracle/ctxoracle/test/unit/recognizer_clear.test.ts | create | S23 |
| middleware/context-oracle/ctxoracle/test/unit/recognizer_move.test.ts | create | S23 |
| middleware/context-oracle/ctxoracle/test/unit/recognizer_question.test.ts | create | S23 |
| middleware/context-oracle/ctxoracle/test/unit/redact_negative.test.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/unit/redact_positive.test.ts | create | S11 |
| middleware/context-oracle/ctxoracle/test/unit/repo_binding.test.ts | create | S28 |
| middleware/context-oracle/ctxoracle/test/unit/repo_key.test.ts | create | S5 |
| middleware/context-oracle/ctxoracle/test/unit/run_tests_guard.test.ts | create | S1 |
| middleware/context-oracle/ctxoracle/test/unit/search_semantics.test.ts | create | S14 |
| middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts | modify | S6 |
| middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts | delete | S28 |
| middleware/context-oracle/ctxoracle/test/unit/spawn_wrapper.test.ts | create | S5 |
| middleware/context-oracle/ctxoracle/test/unit/stop_outstanding_line.test.ts | create | S27 |
| middleware/context-oracle/ctxoracle/test/unit/store_backup_holder.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/unit/store_backup.test.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/unit/store_corrupt_induction.test.ts | create | S10 |
| middleware/context-oracle/ctxoracle/test/unit/store_nesting.test.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/unit/stores_adapter.test.ts | create | S3 |
| middleware/context-oracle/ctxoracle/test/unit/tree_sitter_frontend_fallback.test.ts | create | S15 |
| middleware/context-oracle/ctxoracle/test/unit/tree_sitter_frontend.test.ts | create | S15 |
| middleware/context-oracle/ctxoracle/test/unit/tuning_dao.test.ts | create | S12 |
| middleware/context-oracle/ctxoracle/test/unit/tuning_reader.test.ts | create | S12 |
| middleware/context-oracle/ctxoracle/test/unit/watchdog_deadline.test.ts | create | S10 |
| middleware/context-oracle/ctxoracle/test/unit/whisper_form.test.ts | create | S19 |
| middleware/context-oracle/ctxoracle/test/unit/whisper_stats_attribution.test.ts | create | S30 |
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

**Reopened substrate (2026-09-26 plan pass).** Steps 1–12 were built and passed
Checkpoint 1 before the skeleton pass; the gap-list review
(`docs/reviews/2026-09-25-skeleton-gap-list-review.md`) and the two 2026-09-26
architecture passes found defects in that built substrate that every later step
inherits. They are corrected in the step that owns each artifact, each step
carrying a **"Reopened 2026-09-26 — build delta"** paragraph that states exactly
what changes against the code already built, and they are built **before**
Step 13's full build, then re-verified as **Checkpoint 1R** (§9):

- Step 1 — the `human_markers.jsonl` fixture gains `origin.kind: "human"` on
  its human entries (G26; the rule it tests is Step 21's).
- Step 3 — `Store.transaction` is re-entrant (`SAVEPOINT` below depth 0,
  AD-26, G9); `openStore(path, {mustExist: true})` never creates a file (N15)
  and tells a missing store from an unreadable one (plan-pass collapse-hunt
  H8); `backupFile` exposes `node:sqlite`'s `backup()` for import (AD-5, G34).
  Standard: SQLite `SAVEPOINT` docs; Fowler Unit of Work; the executed
  `DatabaseSync` behaviour (a missing path is created — §11.4).
- Step 4 — `ensureHome` creates `<home>/diagnostics/` (AD-17, G35).
- Step 5 — the spawn seam returns bytes for machine output and one module
  decodes paths with a fatal UTF-8 decoder (G7). Standard: WHATWG Encoding;
  POSIX pathname.
- Step 6 — the fault-code list, the consumer key, and the event/candidate
  types (G4, G7, G15, G18, G19, G21–G25, G29, G31, N3; AD-4, AD-14, AD-16,
  AD-17). Standard: AD-17's one-list rule; AD-4's consumer key.
- Step 7 — the project schema: `files.in_tree`/`change_count`/
  `change_weight`/`unresolved_imports`, no pair counters, `pair_weight`,
  `labelled_touches`, the miner landmine key, `seq` keys on
  `whisper_audit`/`corrections`/`observed_actions`/`session_log`,
  `stats_folds`, FTS tables over the in-house tokens, and the `symbol_tokens`
  and `path_tokens` fallback tables (G2, G3, G5, G16, N6, N11, N16; AD-2,
  AD-4, AD-13). Standard: 3NF; SQLite VACUUM rowid rule; UAX #15 (executed).
- Step 8 — `whisper_stats` becomes the replaced replica keyed
  `(genre, project_key)`; `global_meta` holds bindings, no watermark (AD-5,
  G33, N11).
- Step 9 — the DAO surface for the above (G2, G3, G5, G22, N5, N16).
- Step 10 — `writeSessionEvent` takes no `seq` (N16).
- Step 12 — the concrete `tuningReader` (project row before the NULL row,
  re-seed, `tuning_missing`), the ordering validator with AD-14's tier
  invariant, and the new seeds (G1, G8, G17, G20, N13; AD-12, AD-13, AD-14,
  AD-15, AD-26).
- **The skeleton modules of Steps 13–39 that stop compiling** against the
  Step 6, 7, and 9 deltas are declared in those deltas' `modify:` lists and
  reduced by one written placeholder rule; the tests the reduction turns red
  are marked `todo` (§9, Checkpoint 1R; review S1, collapse-hunt H12/H13).

No store has shipped to any user (the skeleton ran only against scratch and
this repository's own throwaway stores), so migrations 001, 001b, and 002 are
**edited in place**, not superseded by forward migrations; AD-25's
forward-only rule governs shipped stores (the gap-list review's G16 decision
states the same reasoning for 001b).

**The rest of this section (unchanged since 2026-09-07).** The deterministic probes were run over the affected area on 2026-09-07
(`codegraph_scan` with `force: true`, then `codegraph_find_broken_imports`,
`codegraph_find_unused_imports`, `codegraph_find_dead_exports`,
`codegraph_find_orphans`, `codegraph_find_unreachable`, `codegraph_find_cycles`,
`codegraph_find_bridges`, `codegraph_list_endpoints` — outputs in §11.6): the
one code file (`tools/check_docs.py`) has no broken or unused imports, no dead
exports, is unreachable-free, and forms no cycle; it is reported as an orphan
because nothing imports a standalone CLI script, which is its intended shape.
Architecture `L8` states the same fact ("this architecture introduces a new
component tree; it modifies no existing code"). At plan delivery on
2026-09-07 no pre-existing pattern was being extended, so nothing received a
foundation correction then; the reopened substrate above is the correction of
this plan's own built Steps 1–12.

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

**Build order after the 2026-09-26 plan pass.** Steps 1–12 are built; their
"Reopened 2026-09-26 — build delta" paragraphs (§6) are built first, in step
order, each test-first, and Checkpoint 1R (§9) re-verifies the substrate.
Steps 13–39 then each get their full build in step order, replacing the
walking skeleton at the same paths; every `SKELETON:` mark in `src/` is
removed by the step that owns its module, and Step 37's `T-37-1` fails the
suite while any mark — or any `todo` test Checkpoint 1R introduced — remains.
**Test-first contract for Step 13 onward**, in this order:
1. *Stubs first.* Before any test is written, the builder adds every export
   the step's `provides:` names that the skeleton lacks as a stub whose body
   is `throw new Error('not implemented: <name>')` (a class or type export
   gets its declared shape with each method throwing the same way), so `tsc`
   compiles the whole project — `src` and `test` are one `tsc` project (Step
   1), so a test importing a missing export would otherwise fail the build of
   every test, not fail itself. The stubs are the step's first change and are
   replaced by its build; `T-37-1` fails while any `not implemented:` text
   remains under `src/`.
2. *Tests from the specification.* A separate agent writes the step's §12
   tests from the test specification alone and runs them against the tree
   with the stubs.
3. *The red state counts only for the named reason.* A test over a stubbed
   export must fail at run time on that stub's `not implemented: <name>`
   error; a test over an export the skeleton already has must fail on its
   "Fails when" clause. A test that passes before the step's code changes is
   either pinning behaviour the skeleton already has — recorded in the
   implementation log with that evidence — or is not testing the decision,
   and is rewritten.
Every value a test asserts is stated in its
specification or derivable from a named seed, fixture scenario, or formula
in the step it verifies. (Expert review M5: under one `tsc` project, a
missing export was a build error, so the contract's red state could not be
observed as specified.)

**Cross-cutting conventions every step from 13 on follows (gap-list review
G8, G9, G23/G29, N10; AD-5, AD-26).**
- *Tuning.* A component that reads a threshold receives a `TuningReader`
  (Step 6 type, Step 12 implementation) bound to `(globalStore, repoKey)`,
  never a raw global `Store`, and carries **no fallback literal** — a missing
  key is re-seeded by the reader and recorded as `tuning_missing`. A
  component that also writes global state (the Step 30 publish, the Step 32
  import, the Step 33 `tune`) receives an explicit `{ project, global }` pair.
  Text that renders a tuned value (Warning's fix-chatter window) renders the
  value read, never a literal (N10).
- *Transactions.* Demarcation belongs to the unit of work (a mining or index
  chunk, one of the handler's write groups, a verb's write), never to a DAO;
  `Store.transaction` nests (Step 3). No unit of work holds the write lock
  while reading git, reading a transcript, generating candidates, or
  composing (AD-26).
- *Consumers.* Every consumer-keyed read and write uses the consumer key
  `consumerKey(session, agentId)` (Step 6); the role (`main` | `subagent`) is
  derived from the key and used only for FR-O6's main-only deny scope.

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
  create: [.github/workflows/context-oracle-ctxoracle.yml, middleware/context-oracle/ctxoracle/package.json, middleware/context-oracle/ctxoracle/package-lock.json, middleware/context-oracle/ctxoracle/tsconfig.json, middleware/context-oracle/ctxoracle/src/cli/dispatch.ts, middleware/context-oracle/ctxoracle/scripts/run-tests.mjs, middleware/context-oracle/ctxoracle/test/build/tsc_fixture.ts, middleware/context-oracle/ctxoracle/test/replay/transcript_fixtures/, middleware/context-oracle/ctxoracle/test/fixtures/generate.ts, middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-full/, middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-shallow/, middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-shallow-no-origin/, middleware/context-oracle/ctxoracle/test/fixtures/repos/repo-key-nongit/, middleware/context-oracle/ctxoracle/test/fixtures/repos/miner-hygiene/, middleware/context-oracle/ctxoracle/test/fixtures/repos/indexer-small/, middleware/context-oracle/ctxoracle/test/fixtures/repos/coupling-nonobvious/, middleware/context-oracle/ctxoracle/test/fixtures/repos/orientation-mixed-shape/, middleware/context-oracle/ctxoracle/test/fixtures/repos/reuse-mixed-language/, middleware/context-oracle/ctxoracle/test/fixtures/repos/reuse-observed-zero/, middleware/context-oracle/ctxoracle/test/fixtures/repos/reuse-same-name-collision/, middleware/context-oracle/ctxoracle/test/fixtures/repos/consequence-coupled-tests/, middleware/context-oracle/ctxoracle/test/fixtures/repos/warning-landmine/, middleware/context-oracle/ctxoracle/test/fixtures/repos/completeness-paired-change/, middleware/context-oracle/ctxoracle/test/fixtures/repos/verification-covering-test/, middleware/context-oracle/ctxoracle/test/fixtures/repos/bar-two-candidates/, middleware/context-oracle/ctxoracle/test/fixtures/repos/dedup-read-set/, middleware/context-oracle/ctxoracle/test/fixtures/repos/corpus-floor-29/, middleware/context-oracle/ctxoracle/test/fixtures/repos/answer-drift-clearly-off/, middleware/context-oracle/ctxoracle/test/fixtures/repos/pristine-tree/, middleware/context-oracle/ctxoracle/test/fixtures/repos/secret-injection/, middleware/context-oracle/ctxoracle/test/fixtures/repos/subagent-delivery/, middleware/context-oracle/ctxoracle/test/fixtures/repos/language-config-added/, middleware/context-oracle/ctxoracle/test/fixtures/repos/seeded-facts/, middleware/context-oracle/ctxoracle/test/fixtures/repos/regret-true-positive/, middleware/context-oracle/ctxoracle/test/fixtures/repos/regret-no-inflate/, middleware/context-oracle/ctxoracle/test/fixtures/repos/over-threshold-file/, middleware/context-oracle/ctxoracle/test/fixtures/repos/coupling-key-symmetry/, middleware/context-oracle/ctxoracle/test/fixtures/repos/miner-denominator/, middleware/context-oracle/ctxoracle/test/fixtures/repos/miner-labels/, middleware/context-oracle/ctxoracle/test/fixtures/repos/miner-large/, middleware/context-oracle/ctxoracle/test/fixtures/repos/indexer-walk/, middleware/context-oracle/ctxoracle/test/fixtures/repos/indexer-nongit/, middleware/context-oracle/ctxoracle/test/fixtures/repos/reuse-alias-unresolved/, middleware/context-oracle/ctxoracle/test/fixtures/repos/recency-weighting/, middleware/context-oracle/ctxoracle/test/unit/package_build.test.ts, middleware/context-oracle/ctxoracle/test/unit/run_tests_guard.test.ts, middleware/context-oracle/ctxoracle/test/unit/generator_determinism.test.ts, middleware/context-oracle/ctxoracle/.gitignore, middleware/context-oracle/ctxoracle/test/fixtures/repos/.gitkeep]
  modify: []
  delete: []
provides: [npm-ci, npm-test, npm-run-test, npm-run-build]
tests: [T-1-1, T-1-2, T-1-3]
depends_on: []
```


**What changes.** Create `middleware/context-oracle/ctxoracle/package.json`
with `"type": "module"`, `"bin": {"ctxoracle": "dist/src/cli/dispatch.js"}`,
`"engines": {"node": ">=22.16.0"}`, runtime dependencies exactly
`{"web-tree-sitter": "0.25.10", "tree-sitter-wasms": "0.1.13"}` (exact
pins, no range — the pair executed to load and parse the shipped grammars,
§4), dev dependencies exactly `{"typescript": "5.9.3", "@types/node":
"22.20.1", "@types/emscripten": "1.41.6"}`, scripts `"build": "tsc -p tsconfig.json"`,
`"test": "node scripts/run-tests.mjs"`, a `"files"` list of `dist/`,
`src/` (the runtime-read `.sql` migrations live there), and `scripts/`,
and **no** `install`, `postinstall`, or `preinstall` script. Run `npm
install` once against the authored manifest and commit the generated
`package-lock.json` beside it: `npm ci`, which every CI job and `T-1-1`
run, refuses to start without one (`probe:23_npm_ci_without_lockfile`,
§11.4); the lockfile is npm-generated, never hand-edited, and regenerated
whenever a pin changes. Create `tsconfig.json` with
`"strict": true`, `"target": "ES2022"`, `"module": "NodeNext"`,
`"moduleResolution": "NodeNext"`, `"rootDir": "."`, `"outDir": "dist"`,
`"include": ["src", "test"]`, `"exclude": ["test/build/fixtures"]`,
`"declaration": false`, `"verbatimModuleSyntax": true`, `"types": ["node",
"emscripten"]` (the runtime's `.d.ts` needs `@types/emscripten`'s
`EmscriptenModule` global, §4); relative imports in
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

Create `src/cli/dispatch.ts` — the package's `bin` target
(`#!/usr/bin/env node`), a valid, buildable entry point that at this step
registers no verbs, does no work, and exits non-zero on any invocation
(nothing invokes it until Step 28, and `T-1-1` only builds it and checks it
exists — Step 1 guarantees no more of its runtime behavior). It compiles
under the strict `tsconfig` above (`tsc` preserves the leading shebang
verbatim as the emitted file's first line — executed 2026-09-19, §11.4),
imports nothing, and is the file Step 28 extends with the internal
`hook`/`index` verbs and Steps 31–35 with the rest, each declaring its edit
under `modify:`. Creating the declared bin's target here — rather than at
Step 28 where the first real verbs land — keeps `package.json`'s `bin`
entry pointing at a file that exists from the first build (AD-25), so
`T-1-1`'s `dist/src/cli/dispatch.js` assertion holds at Step 1, on every CI
run, and at Checkpoint 1, instead of being red until Step 28.

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
test asserts on except the scenario itself (D-plan-5). Step 1's fixture
deliverable is intentionally **partial**: the repo-identity fixtures
(`repo-key-*`, consumed at Step 5), `corpus-floor-29`, and
`over-threshold-file` carry their full planted scenario now, while the
miner/index/genre and later-phase fixtures (consumed at Steps 13–38) are
deterministic single-commit baselines here and are elaborated to their
planted scenario at the step that first consumes — and can verify — them.
Every entry is already deterministic so `T-1-3` holds, and the generator
states this deferral inline; building the deep scenarios now, before a test
can check them, would be unmeasured machinery (the phase goal's "no fake
completeness"). Also create the
transcript fixtures under `test/replay/transcript_fixtures/` — one JSONL
file per V12 shape: marker-carrying human turns, a marker-less string-content
user entry, an injected task-notification entry (`origin.kind:
"task-notification"`), a Stop-hook feedback entry (`isMeta: true`), and a
lag fixture whose clearing assistant turn is appended by the test that uses
it — written as literal files, not generated.

Create `scripts/run-tests.mjs` (dependency-free): it enumerates
`dist/test/unit/**/*.test.js`, `dist/test/build/**/*.test.js`,
`dist/test/conventions/**/*.test.js`, and `dist/test/build_time/**/*.test.js`
(Step 38's build-time verifications) with `fs.readdirSync(dir, {recursive:
true})`; counts the `*.test.ts` sources under `test/unit`, `test/build`,
`test/conventions`, `test/build_time`; **exits 1 with a plain-language
message if the total compiled count is zero or if, for any of the four
directories, the compiled count differs from the source count** (a
directory with no sources and no compiled files is consistent, so the
build tier being empty before Step 9 is not a failure, and `test/build_time`
is empty until Step 38 creates it); otherwise runs
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

**Creates.** `.github/workflows/context-oracle-ctxoracle.yml` — CI: build + unit/integration/convention tier; `package.json` — AD-25; `tsconfig.json` — AD-25; compiles src/ and test/ into dist/; `src/cli/dispatch.ts` — the `bin` target stub (`#!/usr/bin/env node`; does no work, exits non-zero on invocation), extended by Steps 28 and 31–35 (AD-25); `scripts/run-tests.mjs` — enumerates compiled tests; refuses a zero/mismatched set; `test/build/tsc_fixture.ts` — helper: runs tsc --noEmit on one fixture, returns exit code + diagnostics; `test/replay/transcript_fixtures/` — transcript JSONL fixtures (marker-carrying, marker-less, injected-turn, lag); `test/fixtures/generate.ts` — entry point for all fixture-repo generators (D-plan-5); `test/fixtures/repos/repo-key-full/` — full history, 3 root commits; `test/fixtures/repos/repo-key-shallow/` — depth-1 clone of repo-key-full with origin; `test/fixtures/repos/repo-key-shallow-no-origin/`; `test/fixtures/repos/repo-key-nongit/` — plain directory; `test/fixtures/repos/miner-hygiene/` — planted pair, merge commit, 45-file commit, beyond-horizon commit; `test/fixtures/repos/indexer-small/` — 3 .ts files, 1 .py, 1 .sh, 1 >1 MB file, planted secret; `test/fixtures/repos/coupling-nonobvious/` — cross-directory pair + same-dir same-stem pair; `test/fixtures/repos/orientation-mixed-shape/` — low-in-degree main/cli + high-in-degree hub; `test/fixtures/repos/reuse-mixed-language/` — grammar-covered dominant + generic-frontend candidate; `test/fixtures/repos/reuse-observed-zero/` — grammar-covered symbol with observed 0 count; `test/fixtures/repos/reuse-same-name-collision/` — comment/string collisions; `test/fixtures/repos/consequence-coupled-tests/` — file co-changing with two test files; `test/fixtures/repos/warning-landmine/` — revert_chain + fix_chatter rows, low-confidence row; `test/fixtures/repos/completeness-paired-change/`; `test/fixtures/repos/verification-covering-test/` — changed region with a covering test; run / not-run / run-and-failed variants; `test/fixtures/repos/bar-two-candidates/`; `test/fixtures/repos/dedup-read-set/`; `test/fixtures/repos/corpus-floor-29/` — 29 non-excluded commits, generator adds the 30th; `test/fixtures/repos/answer-drift-clearly-off/`; `test/fixtures/repos/pristine-tree/`; `test/fixtures/repos/secret-injection/`; `test/fixtures/repos/subagent-delivery/`; `test/fixtures/repos/language-config-added/`; `test/fixtures/repos/seeded-facts/` — planted coupling + planted landmine; `test/fixtures/repos/regret-true-positive/` — a held fact and a never-triggered fact); `test/fixtures/repos/regret-no-inflate/`; `test/fixtures/repos/over-threshold-file/` — >1 MB file carrying a seeded fact (AD-24); `test/fixtures/repos/coupling-key-symmetry/` — one A–B pair, Read of A then Read of B (AD-24, Step 38); `test/fixtures/repos/miner-denominator/` — `a.txt` changed 7 times, 4 with `b.txt` (G3, Step 13); `test/fixtures/repos/miner-labels/` — revert trailer / prefix / large revert / fix-token cases (G1, G5, Step 13); `test/fixtures/repos/miner-large/` — 2,000 commits via `git fast-import` (AD-26 chunking, Step 13); `test/fixtures/repos/indexer-walk/` — ignored-tracked, deleted-but-listed, non-UTF-8, test-path and import-resolution cases (Step 14–15); `test/fixtures/repos/indexer-nongit/` — a plain directory tree (AD-12 `readdir` walk, Step 14); `test/fixtures/repos/reuse-alias-unresolved/` — a TypeScript helper imported mostly through a `tsconfig` path alias (AD-12/AD-15, Step 18); `test/fixtures/repos/recency-weighting/` — an old perfect pairing and a pairing that came apart, backdated commits (AD-13 recency weights, Step 16; added 2026-09-26); `.gitignore` — re-includes `package-lock.json` and the `test/build/` subtree for this package (the repository-root `.gitignore` ignores both by pattern; `node_modules/` and `dist/` stay ignored), so `T-1-1`/CI are not silently starved of the committed lockfile or the compile-time test tier (implementation-log/collapse-log 2026-09-19); `test/fixtures/repos/.gitkeep` — keeps the generated-at-test-time fixture-repos directory present in git.

**Reopened 2026-09-26 — build delta.** (a) the `human_markers.jsonl` transcript fixture:
every human entry gains `"origin":{"kind":"human"}` — the fixture had no
`origin` field at all, contradicting the marker rule it exists to test
(Step 21: `origin.kind === 'human'` and `isMeta !== true`); the real
transcript read by the review (25 human entries, all `origin.kind:
"human"` with string content) supports the rule, not the fixture (gap-list
review G26). `markerless_user.jsonl` stays marker-less — it is the case
that exercises `rebuild_recovered_nothing`. (b) Seven fixture names are
added as deterministic single-commit baselines, elaborated by their
consuming step exactly like the existing partial entries:
`coupling-key-symmetry` (AD-24; built out at Step 38),
`miner-denominator`, `miner-labels`, `miner-large` (Step 13),
`indexer-walk`, `indexer-nongit` (Step 14), `reuse-alias-unresolved`
(Step 18). `T-1-3`'s `FIXTURE_NAMES` literal grows by these seven.
(c) **Fixture build-out is declared (G6).** Every step whose §12 test
consumes a fixture scenario declares `modify:
middleware/context-oracle/ctxoracle/test/fixtures/generate.ts` and names in
its "What changes" the fixtures it builds out — the Checkpoint-1 finding m1
deferred the deep scenarios "to their consuming Steps 13–38" and no consuming
step declared the edit, so 21 of 26 generators stayed `trivial(dir, name)`
stubs (review G6).

**Source.** `AD-25` (packaging: two runtime deps, no postinstall, no native
code, `tsc` build); `AD-2` (Node ≥ 22.16.0, TypeScript strict ESM); `AD-24`
(`node:test` suites); `C-3` (no prebuilt-binary download, no native
toolchain); V14 as corrected in §4 (the dependency versions, executed).

**Why this approach (Gate 3):**
1. **The decision.** Runtime deps pinned to the exact versions executed to
   load and parse the shipped grammars (§4); dev deps pinned to
   `typescript` 5.9.3, `@types/node` 22.20.1 and `@types/emscripten`
   1.41.6; the npm-generated lockfile committed so `npm ci` can run; tests
   compiled by the same `tsc` run as the sources and executed from `dist/`
   through a runner that refuses an empty or incomplete test set, with the
   must-fail fixtures excluded from that build and compiled one at a time by
   the tests that expect them to fail; fixture repositories generated
   deterministically by a script that exists before the first test needs
   one; the package's declared `bin` target `src/cli/dispatch.ts` shipped
   here as a minimal `#!/usr/bin/env node` stub that does no work and exits
   non-zero on invocation, so the manifest's `bin` entry resolves from the
   first build and is extended, never re-created, by Steps 28 and 31–35; CI runs at the floor and at the
   current 22.x plus the cold-container job.
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
   missing test a red run. Exact runtime pins are the pair executed to work
   (§4): `web-tree-sitter` 0.25.10, below the 0.26.13 V14 read from the
   registry, because a registry read never loads a grammar; reproducing
   that executed surface is the point of the pin, and the pin moves only
   with probe 20 re-executed (D-plan-2). `typescript` 5.9.3 is the last release of the 5.x line, the line the
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
   vacuous pass on an empty match, observed). Not a `package.json` `bin`
   whose target `dist/src/cli/dispatch.js` does not exist until Step 28 (the
   manifest would point at a missing file and `T-1-1` — which asserts that
   target exists after build and runs on every `npm test`, so at Step 1, on
   every CI run, and at Checkpoint 1 — would be red for Steps 1–27; the
   AD-25 `bin` declaration and its target belong to the same packaging
   decision and ship together). Not a functional dispatcher here (the real
   verbs are the AD-6/AD-7/AD-8 pipeline work built at Step 28 onward; Step 1
   ships only the packaging bin target, AD-25/PA-12).

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
  create: [middleware/context-oracle/ctxoracle/src/stores/adapter.ts, middleware/context-oracle/ctxoracle/test/unit/stores_adapter.test.ts, middleware/context-oracle/ctxoracle/test/conventions/sqlite_single_importer.test.ts, middleware/context-oracle/ctxoracle/test/unit/concurrency.test.ts, middleware/context-oracle/ctxoracle/test/unit/concurrency_worker.ts, middleware/context-oracle/ctxoracle/test/unit/fts5_probe.test.ts, middleware/context-oracle/ctxoracle/test/unit/store_nesting.test.ts, middleware/context-oracle/ctxoracle/test/unit/store_backup.test.ts, middleware/context-oracle/ctxoracle/test/unit/store_backup_holder.ts]
  modify: []
  delete: []
provides: [openStore, Store, StoreBusy, StoreMissing, StoreUnreadable, TransactionAborted, probeFts5, backupFile]
tests: [T-3-1, T-3-2, T-3-3, T-3-4, T-3-5, T-3-6]
depends_on: [S1, S2]
```


**What changes.** Create `src/stores/adapter.ts` — the ONLY file in the
codebase that imports `node:sqlite`. Exports:
- `openStore(path: string): Store` — opens a WAL-mode SQLite database at
  `path` with `foreign_keys=ON`, `busy_timeout=100`, prepares statement
  caches, returns a `Store` handle.
- `Store.prepare(sql: string): Statement` — prepared statement wrapper.
- `Store.exec(sql: string): void` — direct execution of DDL and PRAGMAs (no
  result rows); used by the migration runner (Step 7) and `BEGIN/COMMIT` inside
  `transaction`.
- `Store.transaction<T>(fn: () => T, opts?: { onBusyRetry?: () => void }): T` —
  `BEGIN IMMEDIATE`/`COMMIT`/`ROLLBACK`; on `SQLITE_BUSY` retries **once**; on
  the second failure it raises a typed `StoreBusy` error the caller turns into
  the `store_busy` fault and fails open (AD-26). `opts.onBusyRetry`, when given,
  is invoked exactly once — after the first attempt's `SQLITE_BUSY`, before the
  retry — and takes no part in the transaction (it runs outside `BEGIN`/`COMMIT`
  and cannot affect the row set). It is the deterministic observation seam
  `T-3-3` uses to sequence the retry-then-succeed path (a contending worker
  signals its first-attempt busy and blocks inside it until the lock is
  released). Production callers omit it, and behaviour is then identical to a
  bare `transaction(fn)`.
- `Store.close()`, `Store.integrityCheck(): 'ok' | 'failed'` (runs `PRAGMA
  quick_check` — used only off the event path per AD-17).
- `Store.exportTo(destPath: string): void` — implements `VACUUM INTO`
  (AD-5, V17) for AC-19.
- `probeFts5(db): boolean` — attempts `CREATE VIRTUAL TABLE _fts5_probe
  USING fts5(x); DROP TABLE _fts5_probe;` inside a transaction, rolling
  back on throw (AD-2's defense-in-depth probe, called by `init`, Step 31;
  on `false` the search interface falls back to token-prefix range queries
  over the `symbol_tokens` and `path_tokens` tables, which hold the same
  in-house tokens the FTS tables index (AD-2), and `status` says so).
Create `test/conventions/sqlite_single_importer.test.ts` (built-output grep
over `dist/src/**/*.js`): passes only when `dist/src/stores/adapter.js` is
the sole file containing `node:sqlite`.

**Reopened 2026-09-26 — build delta.**
- **`Store.transaction` is re-entrant (AD-26; gap-list review G9).** The
  `Store` handle keeps a depth counter. At depth 0 the call issues `BEGIN
  IMMEDIATE`, runs `fn`, `COMMIT`s, and on `SQLITE_BUSY` retries the whole
  call once (invoking `opts.onBusyRetry` between attempts) and then raises
  `StoreBusy` — unchanged. At depth > 0 it issues `SAVEPOINT sp<depth>`,
  runs `fn`, and `RELEASE sp<depth>` on return; on a throw it issues
  `ROLLBACK TO sp<depth>` then `RELEASE sp<depth>` and rethrows. There is **no
  busy retry at depth > 0** (the write lock is already held) and
  `opts.onBusyRetry` is ignored there. A throw at depth 0 rolls back
  everything the nested calls released. **An engine-abandoned transaction
  poisons the unit (Steps 1–12 build review S1).** SQLite may roll back the
  whole transaction on its own after `SQLITE_FULL`, `SQLITE_IOERR`,
  `SQLITE_NOMEM`, or `SQLITE_BUSY` inside it ("Response To Errors Within A
  Transaction", `sqlite.org/lang_transaction.html`). After any throw at depth
  > 0 the adapter checks `db.isTransaction`: if the engine has ended the
  transaction, the `ROLLBACK TO` is skipped, the handle is marked aborted,
  and the call throws `TransactionAborted` (Step 3 error type); while
  aborted, every `transaction` call and every statement run through the
  `Store` throws `TransactionAborted` until the depth-0 call unwinds, which
  clears the mark and rethrows. So a caller that catches an inner error can
  never have its later writes autocommit one by one. *Why:* executed in the
  review, the adapter swallowed the failed savepoint undo, the caller's later
  insert committed on its own, and the outer call then threw "cannot commit -
  no transaction is active" with the earlier row lost and the later one
  kept. DAO methods keep calling
  `transaction` for their own atomicity; a caller wrapping several DAO calls
  in one outer `transaction` makes them one atomic unit (the unit of work
  owns the demarcation). *Why:* executed in the review,
  `ps.transaction(() => ps.transaction(() => 1))` threw "cannot start a
  transaction within a transaction", and ten DAO methods open their own, so
  the miner committed its watermark before its landmines; AD-26 records the
  nesting sequence executed on Node 22.22.2.
- **`openStore(path, opts?: { mustExist?: boolean })`.** With
  `mustExist: true` the adapter opens `pathToFileURL(path).href + '?mode=rw'`
  and never creates a database. When SQLite refuses the open (errcode 14,
  `SQLITE_CANTOPEN`), the adapter then `stat`s the path — nothing was
  created, so there is no race: a `stat` that fails with `ENOENT` or
  `ENOTDIR` throws the typed `StoreMissing` (the path is in its `message`);
  any other outcome — the path exists (a directory, a file the process cannot
  open) or `stat` fails with another errno (`EACCES` on a parent) — throws the
  typed `StoreUnreadable` carrying `{path, pathKind: 'file' | 'directory' |
  'other' | null, errno: string | null, message}` (`pathKind` null when the
  `stat` failed). Default (`mustExist` absent) keeps today's create-if-missing
  behaviour, which `init`, the replay harness's store preparation, and the verbs that
  create stores use. *Why:* executed here 2026-09-26 on Node 22.22.2 (§11.4) — `new
  DatabaseSync(<missing path>)` **creates** the file, while the `file:` URI
  with `mode=rw` throws "unable to open database file" and creates nothing,
  and opens an existing WAL store normally even when its path holds a space,
  `#`, and `?`; and a missing file, a file in a missing directory, and a path
  that is a directory all fail with the same errcode 14 (plan-pass
  collapse-hunt P2), so the error alone cannot say "deleted" — only the
  follow-up `stat` can, and reading every CANTOPEN as a deleted store would
  tell Max his store was deleted when it is a permission or layout problem
  (collapse-hunt H8). The handler (Step 28) opens only with `mustExist: true`, so an
  event can never create per-repository state (review N15; AD-23 "creates
  nothing").
- **`backupFile(sourcePath, destinationPath): Promise<void>`** — the
  adapter's wrapper over `node:sqlite`'s module-level `sqlite.backup(sourceDb,
  destinationPath)` with the source opened read-only; the import verb
  (a later step) calls it twice (export → temporary file; temporary file → live
  store). It exists here because this file is the only `node:sqlite`
  importer (AD-2). `backup` is present on the 22.16.0 floor (V17; checked
  `typeof sqlite.backup === 'function'` on 22.22.2 here, §11.4).
- `Store.integrityCheck()` gains no new caller on the event path; the import
  verb runs it on the temporary file.

**Creates.** `src/stores/adapter.ts` — the ONLY node:sqlite importer (AD-2, AD-26).

**Source.** `AD-2` (quarantine `node:sqlite`'s Experimental status behind a
single-file seam; FTS5 probed at `init` as a real statement; V7 re-executed
2026-09-07 on Node v22.22.2 — §11.4); `AD-26` (WAL + `busy_timeout=100ms` +
short, caller-owned, nestable write transactions + retry-once on
`SQLITE_BUSY` at depth 0, fail-open on the second failure with a
`store_busy` diagnostic); `AD-5` (export via `VACUUM INTO`, import via
`backup()`); gap-list review G9, G34, N15.

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
   long `busy_timeout` or unbounded retry (blocks the event path — `NF-1`). Not
   DAO-owned, non-nesting transactions (no caller could make a multi-DAO
   write atomic — G9). Not a busy retry inside a savepoint (the lock is
   already held; a retry there could only re-run work the outer transaction
   will roll back). Not create-on-open for the handler (an event would create
   a store for every directory a hook fires in — N15).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-3-1` (adapter WAL/STRICT/PRAGMA round-trip), `T-3-2`
(single-importer convention), `T-3-3` (two contending writers: one wins, the
other retries once and succeeds; a third contended write fails open with
`StoreBusy`), `T-3-4` (the FTS5 probe returns `true` on this runtime and the
probe table is gone afterwards), `T-3-5` (nesting: savepoint commit, savepoint rollback,
outer rollback, no retry below depth 0; `mustExist` never creates and tells
a missing store from an unreadable one), `T-3-6`
(`backupFile` into a store another process holds open with uncheckpointed
WAL frames yields an intact store holding exactly the source's rows).

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
provides: [ensureLayout, ensureHome]
tests: [T-4-1]
depends_on: [S1, S3]
```


**What changes.** Create `src/identity/home.ts` exporting `ctxoracleHome():
string` — resolves `process.env.CTXORACLE_HOME || path.join(os.homedir(),
'.ctxoracle')`. Create `src/identity/layout.ts` with `ensureLayout(home:
string, repoKey: string): { global: string; project: string; diagnostics:
string; looseMode: string[] }` — creates directories at mode
`0o700` if missing, returning absolute paths for `<home>/global/global.db`,
`<home>/projects/<repoKey>/store.db` and `<home>/projects/<repoKey>/diagnostics/`,
plus the list of pre-existing directories whose
mode is looser than `0o700` (never `chmod`ed; `status` reports them).

**Reopened 2026-09-26 — build delta (AD-3, AD-17; gap-list review G35, N15).**
Add `ensureHome(home: string): { homeDiagnostics: string; looseMode: string[] }`
— creates `<home>/`, `<home>/global/`, and `<home>/diagnostics/` at `0o700`
when missing (created with `mkdirSync(path, {mode: 0o700})`, so the umask can
only narrow the mode and there is no window at a looser one, then `chmod`
to `0o700` exactly — Steps 1–12 build review m3) (the home layout AD-3 now lists, with the home-level fault
channel AD-17 names) and returns `<home>/diagnostics/` plus any of those three
that pre-existed with a looser mode. `ensureLayout(home, repoKey)` calls
`ensureHome` first and then creates the per-project directories exactly as
before. **Callers:** `ensureLayout` — `init` (Step 31), the replay harness's
store preparation (Step 28), and the store-creating
verbs (`import`, Step 32);
`ensureHome` alone — the handler's home-channel fault path (Step 28), which
must be able to write `repo_not_bound` or a pre-repository fault on a machine
where no `init` has created a home yet, and `status` (Step 33). The handler
never calls `ensureLayout` (it creates no per-repository directory — AD-23,
N15). *Why:* executed in the review, `{not json` on stdin left zero faults
anywhere because the fallback appended into a directory that did not exist
and the error was swallowed (G35).

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
  create: [middleware/context-oracle/ctxoracle/src/identity/repo_key.ts, middleware/context-oracle/ctxoracle/src/util/hash.ts, middleware/context-oracle/ctxoracle/src/util/spawn.ts, middleware/context-oracle/ctxoracle/test/unit/repo_key.test.ts, middleware/context-oracle/ctxoracle/test/unit/spawn_wrapper.test.ts, middleware/context-oracle/ctxoracle/test/conventions/child_process_single_importer.test.ts, middleware/context-oracle/ctxoracle/src/util/path_bytes.ts, middleware/context-oracle/ctxoracle/test/unit/path_bytes.test.ts]
  modify: []
  delete: []
provides: [resolveRepoKey, oracleSpawn, oracleExecFileSync, oracleRunSync, sha256Hex, sha256Short, SCRUBBED_ENV, decodePathBytes, splitNul, escapeBytes]
tests: [T-5-1, T-5-2, T-5-3, T-5-4, T-5-5]
depends_on: [S1, S4]
```


**What changes.** Create `src/identity/repo_key.ts` exporting
`resolveRepoKey(repoPath: string): { key: string; mode:
'commit'|'url'|'path'; identity: string }`, and `src/util/hash.ts` exporting
`sha256Hex(data)` and `sha256Short(data, len = 12)` (the first `len` hex
characters of the digest — the repo key is `sha256Short` over the identity
string). Rules, in order:
1. `git rev-parse --is-inside-work-tree` fails (non-zero exit — in a
   directory inside no repository git exits 128 with `fatal: not a git
   repository` and prints nothing; `false` is printed only from inside a
   `.git` directory — `probe:25_git_rev_parse_nongit`, §11.4) or prints
   `false` → rule 4.
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
Every `git` invocation in the resolver goes through one helper returning
`{ok: true, stdout} | {ok: false, code, stderr}`; a failed invocation in
rule 2 or 3 also routes to rule 4, with the same diagnostic, whose `detail`
carries the command and its exit code — no rule keys on output a failed
command never prints.
The key is the first 12 hex characters of SHA-256 over the identity string.
`init` performs **no** `git fetch`.

Also create `src/util/spawn.ts` — the ONLY file in the codebase that imports
`node:child_process`. It exports `oracleSpawn(cmd, args, {cwd, env?, detached?,
scrub?})` and `oracleExecFileSync(cmd, args, {cwd, env?, scrub?, maxBuffer?})`
(`maxBuffer` bounds captured stdout and defaults to 64 MiB — the miner's `git
log` is the large consumer); every child it starts carries
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

**Reopened 2026-09-26 — build delta (gap-list review G7).**
- `src/util/spawn.ts` adds `oracleRunSync(cmd, args, {cwd, env?, scrub?,
  maxBuffer?, input?: Buffer}): { status: number | null; stdout: Buffer;
  stderr: Buffer }` — `spawnSync` with no `encoding`, so stdout and stderr are
  the child's raw bytes, and a non-zero exit is a returned `status`, never a
  throw (the miner's `git merge-base --is-ancestor` answers with exit 0, 1, or
  128, and `git check-ignore` exits 1 when no path is ignored — executed on git
  2.43.0 here, §11.4). `oracleSpawn`'s stdout is consumed as `Buffer` chunks by
  its callers (never `setEncoding`). `oracleExecFileSync` keeps its string
  form for human-text output (`git config`, `rev-parse` answers); **every
  machine output that carries paths goes through the byte forms**.
- Create `src/util/path_bytes.ts` — the one place a path's bytes become a
  string: `splitNul(buf: Buffer): Buffer[]` (fields between NULs, a trailing
  empty field dropped), `decodePathBytes(bytes: Buffer): string | null` (a
  `new TextDecoder('utf-8', { fatal: true })` decode; `null` on an invalid
  sequence, never U+FFFD), and `escapeBytes(bytes: Buffer): string` (printable
  ASCII 0x20–0x7e except `\` kept, every other byte as `\xHH`, for fault
  detail only). The miner (Step 13) and the indexer walk (Step 14, both the
  git listing and the `readdir` walk, which reads with `{encoding:
  'buffer'}`) call `decodePathBytes` on every path and **exclude** a path it
  rejects, counting it for the `path_not_utf8` fault (Step 6) — one rule in
  one place, so the two writers of `files` can never key one byte string two
  ways. *Why:* executed in the review, two files named `bad\xff.txt` and
  `bad\xfe.txt` were silently dropped by the indexer (the lossy string failed
  `statSync`) and collapsed into one `bad\ufffd.txt` row by the miner. POSIX
  defines a pathname as a byte string; the WHATWG Encoding Standard's `fatal`
  flag is the documented way to refuse rather than substitute.

**Creates.** `src/util/path_bytes.ts` — the fatal UTF-8 path decoder (G7); `src/identity/repo_key.ts` — AD-3; `src/util/hash.ts` — SHA-256 helpers; `src/util/spawn.ts` — the ONLY node:child_process importer; sets CTXORACLE_INTERNAL=1.

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
single-importer convention under both specifier spellings), `T-5-4` (the
fatal path decoder and the byte escaper), `T-5-5` (`oracleRunSync` returns
raw bytes and a non-zero status without throwing).

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
  create: [middleware/context-oracle/ctxoracle/src/diag/fault_codes.ts, middleware/context-oracle/ctxoracle/src/diag/jsonl.ts, middleware/context-oracle/ctxoracle/src/types/events.ts, middleware/context-oracle/ctxoracle/src/types/candidate.ts, middleware/context-oracle/ctxoracle/src/types/index_types.ts, middleware/context-oracle/ctxoracle/test/unit/fault_codes.test.ts, middleware/context-oracle/ctxoracle/test/unit/jsonl_writer.test.ts, middleware/context-oracle/ctxoracle/src/security/trust.ts, middleware/context-oracle/ctxoracle/src/types/consumer.ts, middleware/context-oracle/ctxoracle/src/types/headline.ts, middleware/context-oracle/ctxoracle/test/unit/consumer_key.test.ts, middleware/context-oracle/ctxoracle/test/build/typecheck_headline_literal.test.ts, middleware/context-oracle/ctxoracle/test/build/fixtures/headline_nonliteral.ts]
  modify: [middleware/context-oracle/ctxoracle/src/bar/combinator.ts, middleware/context-oracle/ctxoracle/src/genres/generator.ts, middleware/context-oracle/ctxoracle/src/genres/orientation.ts, middleware/context-oracle/ctxoracle/src/genres/coupling.ts, middleware/context-oracle/ctxoracle/src/genres/reuse.ts, middleware/context-oracle/ctxoracle/src/genres/consequence.ts, middleware/context-oracle/ctxoracle/src/genres/warning.ts, middleware/context-oracle/ctxoracle/src/genres/completeness.ts, middleware/context-oracle/ctxoracle/src/genres/verification.ts, middleware/context-oracle/ctxoracle/src/hook/compose.ts, middleware/context-oracle/ctxoracle/src/hook/delivery.ts, middleware/context-oracle/ctxoracle/src/hook/adapter.ts, middleware/context-oracle/ctxoracle/src/hook/handler.ts, middleware/context-oracle/ctxoracle/src/blocks/answer_drift.ts, middleware/context-oracle/ctxoracle/src/blocks/health.ts, middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts]
  delete: []
provides: [Candidate, EventContext, InternalEvent, EventKind, SymbolRow, CapturedImport, ImportEdge, Pointer, Trust, assertProvenance, TuningReader, ObservedActionsReader, okEditedPaths, runs, firstHash, hashesFor, pathWrites, ConsumerKey, consumerKey, consumerRole, Headline, lit, slot]
tests: [T-6-1, T-6-2, T-6-3, T-6-4]
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
and the codes this plan names (the full 2026-09-26 list is the build delta
below): `tuning_missing` for a `tuning` key read that finds no row (Step 12's
`TuningReader` re-seeds the key from its seed module and records this code
with the key in `detail`), and `head_unresolved` for a `HEAD` whose ref the
resolver Step 14 creates finds neither loose nor packed (recorded instead
of `index_stale`, with the reason in `detail`, so an unreadable layout
never spawns a reindex — D-plan-30), `miner_unparsed_numstat` for a `-z
--numstat` record the miner (Step 13) cannot parse into the expected shape
(detail `{commit, records, first}`, one fault per malformed commit) or a
stream that delivered fewer commits than the range count expected (detail
`{expected, read}`, Step 13's completeness check) — a
malformed stream, e.g. a future git output-format drift (under `-z` paths are
raw and a rename is two separate NUL fields, so C-quoting and the `old => new`
ambiguity never arise; this diagnostic is the defensive guard, not an expected
case),
`reindex_locked` for a reindex refused because a live process holds the
claim row (Step 14, D-plan-32), and `frontend_parse_failed` for a file
whose tree-sitter parse threw and was indexed through the generic frontend
instead (Step 15; `detail` carries the language and path).

Create `src/security/trust.ts` — the `Trust` type (`'untrusted_repo' |
'human' | 'mechanical'`, mirroring the DB CHECK of Step 7) and
`assertProvenance(row)`, the helper every learned-record DAO entry point
(Step 9) calls so that a non-human-provenance input can only be written as
`'untrusted_repo'` (`FR-X4`). The schema's third trust value `'mechanical'`
is present for forward-compatibility with later-phase mechanically-generated
content (`FR-X2`); no Phase A learned-record entry point emits it, and
`assertProvenance` rejects a Phase A write that attempts it (the two legal
outcomes are human-provenance → `'human'`, everything else → `'untrusted_repo'`).
It lives here, with the shared types, because
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

**Reopened 2026-09-26 — build delta.** This supersedes the code list, the
`InternalEvent`/`EventContext`/`Candidate`/`Pointer`/`TuningReader` members,
and the `Consumer` type stated above wherever they differ.

*Fault codes.* `FAULT_CODES` is exactly: from AD-17 — `hooks_not_firing`,
`latency_breach`, `store_corrupt`, `index_stale`, `produced_but_undelivered`,
`deny_after_answer_lag`, `deny_despite_answer_text`, `deny_loop`,
`deny_bypass_suspect`, `catchup_incomplete`, `intake_invalidated`,
`rebuild_recovered_nothing`, `transcript_layout_changed`,
`unrecognized_user_entry`, `repo_not_bound`, `whisper_dropped_unverifiable`,
`import_rejected`, and the reserved `model_path_down`, `missed_skill_block`;
from AD-26 — `store_busy`; plan-named — `tuning_missing`, `head_unresolved`,
`miner_unparsed_numstat`, `reindex_locked`, `frontend_parse_failed`, and four
the gap-list review names: `history_rewritten` (G4; detail
`{oldWatermark, newHead}`), `path_not_utf8` (G7; detail `{writer:
'miner'|'indexer', count, first}` with `first` the `escapeBytes` form of at
most five rejected paths), `index_path_only_oversize` (G15; detail `{path,
bytes, lines, cap: 'bytes'|'lines'}`, `lines` null when the byte cap was hit
before any read), and `handler_exception` (G31; detail `{errorClass, message,
event}`, `message` passed through `redact`, Step 11). The plan's former
`whisper_dropped_stale` is **removed**: AD-15/AD-17 now name the rumor-rule
drop `whisper_dropped_unverifiable` with `detail.reason ∈ {stale_pointer,
not_in_tree, masked_path}` (plus `genre` and `subjectKey`), which covers the
stale-pointer case. `repo_not_bound`'s detail is `{cwd, root, reason:
'no_binding'|'store_missing'|'store_unreadable'}` (`root` null when the walk
found none), and for `'store_unreadable'` also `{store: 'global'|'project',
pathKind, errno}` from Step 3's `StoreUnreadable` (collapse-hunt H8);
`import_rejected`'s is `{file, check:
'quick_check_failed'|'unopenable'|'partial_write'}` (the last for the one
residual between an import's two live writes, Step 32);
`rebuild_recovered_nothing`'s carries `set: 'questions'|'delivered'` (AD-9,
AD-16).

*Consumer key (AD-4, AD-9, AD-16; review G23/G29).* Create
`src/types/consumer.ts` (runtime, dependency-free): `type ConsumerKey = string
& { readonly [brand]: true }`; `consumerKey(sessionId: string, agentId?:
string): ConsumerKey` returns `` `${sessionId}#main` `` when `agentId` is
absent or empty and `` `${sessionId}#sub:${agentId}` `` otherwise;
`consumerRole(key): 'main' | 'subagent'` reads the part after the **first**
`#` (`main` → main, `sub:` prefix → subagent; anything else throws, so a
malformed key never silently reads as main). The role is used only for
FR-O6's main-only deny (Step 25). A consumer is one agent in one session,
never a role: the former `Consumer = 'main' | 'subagent'` let a question asked
in one session deny an Edit in another (executed, G23). The encoding keeps a
subagent whose `agent_id` is the string `main` distinct from the main agent.

*`InternalEvent`* (adapter output, Step 28) is: `kind`, `session`,
`agentId?`, `toolName?`, `toolInput?` and `toolResponse?` (opaque — only the
adapter reads their fields, AD-6), `errorText?`, `transcriptPath`,
`promptText?`, `startSource?`, `lastAssistantMessage?`, `stopHookActive?`,
`workingDir`, and the extracted, still-unnormalized tool facts
`targetPathRaw?` (the file a Read/Edit/Write/NotebookEdit call
names), `searchTerm?` (a Grep/Glob call's pattern), `resultPathsRaw?:
string[]` (the files a Grep/Glob call returned), `searchResultState?:
'listed' | 'mode_unsupported' | 'unrecognized'` (how the adapter read a
Grep/Glob response — collapse-hunt H3), and `bashCommand?` (a Bash
call's command) — G21. No tool set anywhere in this plan names `MultiEdit`:
the current hooks reference documents the file tools `Write`, `Edit`, and
`NotebookEdit` and has no `MultiEdit` match (expert review m6, fetched
2026-09-26; AD-23 as corrected at `6cff0ce`). *`EventContext`* is `InternalEvent` plus `consumer:
ConsumerKey`, `role`, `repoRoot` (the main repository root the store is bound
to), `checkoutRoot` (the event's own checkout: a worktree's root, else
`repoRoot` — AD-23), `isWorktree: boolean`, `repoKey`, `targetPath?` and
`resultPaths: string[]` (normalized by the handler to repository-relative
POSIX paths against `checkoutRoot` — never against `cwd`, the defect that
silenced every path genre when a session started in a subdirectory, G21/N3),
`context: 'edit' | 'read'` (set by the handler from the event — `PreToolUse`
Edit/Write/NotebookEdit and `Stop`/`SubagentStop` → `edit`;
`PostToolUse` Read/Grep/Glob and `UserPromptSubmit` → `read` — never by a
genre, so no genre can raise its own impact, D-18; G18a), `refTs: number`
(`schema_meta.ref_ts`, G19), `indexStale: boolean` (`schema_meta.index_head`
≠ the event checkout's `HEAD`) and `historyStale: boolean`
(`schema_meta.last_mined_commit` ≠ that `HEAD`) — AD-14 judges staleness per
fact class against the data the fact came from, so the two are separate
inputs (collapse-hunt H1), `historyAvailable:
boolean` (`schema_meta.corpus_floor_met = '1'` and
`schema_meta.mining_in_progress` not `'1'` — N1, AD-13), `tuning:
TuningReader`, `observed: ObservedActionsReader`, and
`recordDrop(genre, subjectKey, reason: 'stale_pointer' | 'not_in_tree' |
'masked_path')` — the sink the generators (Step 18) and the composer (Step 19)
report rumor-rule drops through, which the handler turns into
`whisper_dropped_unverifiable` faults (AD-15, AD-17).
*`ObservedActionsReader`* (this session and consumer): `okEditedPaths():
string[]` (distinct paths of `outcome='ok'` Edit/Write/NotebookEdit
rows — G22; a failed Edit is not a change), `runs(): {commandClass,
segments, outcome}[]` (Bash rows of either outcome), `firstHash(path)`,
`hashesFor(path): string[]` (post-write hashes of `ok` edits in order),
`pathWrites(sinceSeq)`.

*`Candidate`* — every field required (G18): `genre`, `subjectKey`,
`incorporatedBy: string[]` (read-set keys that make it self-served — AD-16,
G25), `factClass: 'mined' | 'structural' | 'human'`, `obvious: boolean`
(Coupling's same-directory same-stem pair; false elsewhere — AC-1),
`crossFile: boolean`, `comparative: boolean` (declared per genre in its
module header, G18d), `pointers: Pointer[]`, `support: number | null`,
`evidence: {num: number; den: number} | null` (the ratio the headline
states — raw counts, AD-14's display rule), `weightedEvidence: {num: number;
den: number} | null` (the recency-weighted ratio the bar's confidence reads —
`pair_weight / change_weight`, AD-13; non-null exactly when `evidence` is a
pair ratio), `lastTs: number | null` (display and audit only; no confidence
term reads it), `hazard: boolean`, `trust: Trust`,
`injectionSuspect: boolean`, `heuristic: boolean` (a `symbol_refs`-derived
count — AD-14's heuristic cap), `context`, `blastRadius: number`, `zone`,
`headline: Headline`, `evidenceJson`. *`Pointer`* is `{kind: 'file', fileId,
path, spanStart?, spanEnd?} | {kind: 'commit', hash}`.

*Headline (G24).* Create `src/types/headline.ts` (runtime, dependency-free):
`Headline = { readonly parts: ReadonlyArray<Lit | Slot> }`; `lit<const T extends
string>(text: string extends T ? never : T): Lit` — a template word written in
the genre module; `Slot` is `{kind: 'path', fileId, path, ownTarget: boolean} |
{kind: 'commit', hash} | {kind: 'symbol', name} | {kind: 'count', value} |
{kind: 'ratio', num, den} | {kind: 'days', value} | {kind: 'human', text}`,
built by `slot.path(…)`, `slot.commit(…)`, etc. The composer (Step 19) renders
only `Lit` text and slot values, so repo-derived prose is unrepresentable; the
`human` slot carries only human-provenance text (`note`, Step 35). The
literal-only parameter type is executed here 2026-09-26 under TypeScript
5.9.3 (§11.4): `lit(s)` with `s: string` fails `TS2345`; an interpolated
template literal (`` lit(`x${s}`) ``) type-checks, which is why Step 19's
convention test `T-19-3` scans the genre sources for it.

*`TuningReader`* is `{ num(key): number; str(key): string; list(key): string[] }`
(Step 12 builds it).

*`SymbolRow`* gains nothing; *`CapturedImport`* `{specifier, kind}` is what a
frontend returns (Step 14), resolved into an `ImportEdge` `{dst, kind}` by the
frontend's resolver.

*Checkpoint 1R adaptation of the skeleton (review S1; collapse-hunt H12,
H13).* The `modify:` list above names the walking-skeleton modules these type
changes stop compiling, read from the built skeleton on 2026-09-26: the bar
combinator, the generator helper and the seven genre modules, the composer,
delivery, the hook adapter and handler, and the two block modules (they build
a string `headline`, read optional `Candidate` fields, call
`TuningReader.get`, key consumers by the `'main' | 'subagent'` role, or record
the removed `whisper_dropped_stale`), plus the skeleton end-to-end test. Each
is reduced by §9's placeholder rule — a generator returns no candidates, a
DAO caller that no longer exists is removed, a signature takes the new inputs
with a documented stand-in value — and nothing else: no module gains
behaviour a later step decides. Every placeholder carries a `// SKELETON: 1R —
<what it stands in for>; retired by Step <n>` comment and is listed in §9's
table; a test the reduction turns red is marked `todo` there. A file the build
finds broken that this list does not name is expert-implement's
`BLAST-RADIUS-EXCEEDS-PLAN` stop, not an inline edit.

**Creates.** `src/types/consumer.ts` — the consumer key (AD-4); `src/types/headline.ts` — the structured headline (G24); `src/diag/fault_codes.ts` — stable code list `FAULT_CODES` (AD-17, AD-26); `src/diag/jsonl.ts` — direct-file writer; `src/types/events.ts` — EventKind, InternalEvent, EventContext; `src/types/candidate.ts` — Candidate, TuningReader; `src/types/index_types.ts` — SymbolRow, ImportEdge.

**Source.** `AD-17` (three surfaces, one source of truth; the JSONL channel
is the fallback for store failure; every code enumerated); `AD-26`
(`store_busy`); `AD-15`/`AD-17` (the compose-time drop `whisper_dropped_unverifiable`);
`AD-6`, `AD-14`, `AD-12`, `AD-16` (the fields the internal event, candidate,
and index types carry); `AD-4` (the consumer key); gap-list review G4, G7,
G15, G18, G19, G21–G25, G29, G31, N1, N3; the skill's topological-order
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

**Verification.** `T-6-1` (`FAULT_CODES` equals exactly the set the
build delta above enumerates; a snapshot whose expected value is that
literal list), `T-6-2` (JSONL writer: appends survive a writer restart; mode
is `0o600`), `T-6-3` (a non-literal `lit` argument fails `tsc`), `T-6-4`
(consumer key encoding and role).

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
(NOT NULL on required columns; `ON DELETE CASCADE` on the index-derived
file-keyed rows — symbols, edges, refs, test map, path tokens — and **no**
cascade on the history-derived ones, AD-4; the `corrections` CHECKs that AD-4's
two nullable ids and AD-5's whisper-less `missed` imply; the indexes the event
path's lookups need) and the plan additions marked `-- plan` in the DDL:
`corrections.genre` (the fold's attribution input AD-5/AD-18 name and AD-4's
column list omits — §16 item 5), `cochange_pairs.last_commit` (the commit
pointer AD-15's pair headlines need — §16 item 5), `observed_actions.segments_json`, the
`regret` table, the `classified_turns` table (D-plan-27), and the
`path_tokens` and `symbol_tokens` tables. `PROV` stands for the provenance block
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
  -- index_head, index_stale ('0'|'1', Step 14's refreshIfStale, AD-17's
  -- staleness detector), fts_state ('fts5'|'fallback'), settings_created_by_init,
  -- claude_dir_created_by_init, pinned_interpreter (Step 31's init, the
  -- interpreter path the hooks pin; read back by status, Step 33),
  -- regret_index_seq (Step 30: the largest observed_actions.seq the
  -- index-time regret pass has read, so a cross-session revert is reported
  -- once and a row committed after the read is examined next time — expert
  -- review M7), mined_half_life_days (Step 13: the
  -- bar.recency_half_life_days the stored weights were mined under),
  -- weight_epoch (Step 13: AD-13's T0 for the weights below, epoch s,
  -- written refTs − 500·h days by every full mine's purge and kept by
  -- incremental passes — Step 13 build review M3),
  -- store_created_at (Step 31's init: set at first
  -- creation if absent, and overwritten whenever init genuinely re-wires
  -- a missing hook entry — the INTEGER epoch-ms moment this repository's
  -- hooks last started firing; AD-17's totally-dead detector, Step 33,
  -- D-plan-25, excludes any transcript whose first entry predates it),
  -- fold_watermark_audit, fold_watermark_corrections (AD-4/AD-5: the fold's
  -- two seq watermarks, '0' until the first fold), mining_in_progress
  -- ('1' during a full (re-)mine, AD-13/AD-26), ref_ts (Step 13: the
  -- reference instant, HEAD's committer time, epoch s — G19),
  -- corpus_floor_met ('0'|'1', Step 13 — N1), lang_capabilities (Step 14:
  -- JSON {lang: {frontend, symbols, imports, resolved, unresolved, files}},
  -- AD-12's per-language capability record and unresolved share),
  -- walk_mode ('git'|'readdir', Step 14, shown by status)
CREATE TABLE files(id INTEGER PRIMARY KEY, path TEXT NOT NULL UNIQUE,
  lang TEXT NOT NULL, zone TEXT NOT NULL CHECK(zone IN
    ('source','generated','vendored','build_output','unknown')),
  zone_evidence TEXT, zone_evidence_suspect INTEGER NOT NULL DEFAULT 0,
  entry_score INTEGER NOT NULL DEFAULT 0,
  in_tree INTEGER NOT NULL CHECK(in_tree IN (0,1)),   -- AD-4
  change_count INTEGER NOT NULL DEFAULT 0,            -- AD-4/AD-13: support(file)
  change_weight REAL NOT NULL DEFAULT 0,              -- AD-4/AD-13: the same commits,
                                                      -- each weighted 2^((ts−T0)/h)
  unresolved_imports INTEGER NOT NULL DEFAULT 0,      -- AD-4/AD-12
  content_hash TEXT,     -- NULL on a history-only row never indexed (AD-4:
  mtime INTEGER,         -- no in-band sentinel; "not in the tree" is in_tree=0)
  PROV) STRICT;          -- PROV.injection_suspect = the PATH was flagged (AD-19)
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
  ref_count INTEGER NOT NULL) STRICT;   -- one row per (symbol, referencing file)
CREATE TABLE test_map(
  test_file INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  region_glob TEXT NOT NULL,            -- the covered file's path (AD-12)
  source TEXT NOT NULL CHECK(source IN ('import_edge','same_dir')), PROV) STRICT;
CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL,
  entity_count INTEGER NOT NULL, excluded INTEGER NOT NULL DEFAULT 0,
  exclude_reason TEXT) STRICT;
-- history-derived rows reference files WITHOUT cascade: the engine refuses to
-- delete a files row mined history still references (AD-4 "never cascading
-- away its pairs or landmines"); the indexer never tries (Step 14)
CREATE TABLE cochange_pairs(
  a INTEGER NOT NULL REFERENCES files(id),
  b INTEGER NOT NULL REFERENCES files(id),
  pair_count INTEGER NOT NULL,
  pair_weight REAL NOT NULL,   -- AD-4/AD-13: the pair's commits, each weighted
                               -- 2^((ts−T0)/h); confidence = pair_weight /
                               -- change_weight(a)
  last_ts INTEGER NOT NULL,
  last_commit TEXT NOT NULL,   -- AD-4 (added db9ecf9, from D-plan-35): the
                               -- hash of the newest commit in the pair's
                               -- count — the "commit pointer" AD-15's
                               -- Coupling/Consequence/Completeness headlines
                               -- carry
  PRIMARY KEY(a, b), CHECK(a < b)) STRICT;
CREATE TABLE landmines(id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('revert_chain','fix_chatter','human_stated')),
  file_id INTEGER NOT NULL REFERENCES files(id),
  evidence TEXT NOT NULL, support INTEGER, PROV) STRICT;
CREATE UNIQUE INDEX landmines_miner_key ON landmines(kind, file_id)
  WHERE kind IN ('revert_chain','fix_chatter');     -- AD-15: one row per (kind, file)
CREATE TABLE labelled_touches(
  file_id INTEGER NOT NULL REFERENCES files(id),
  commit_hash TEXT NOT NULL, label TEXT NOT NULL CHECK(label IN ('revert','fix')),
  ts INTEGER NOT NULL, PRIMARY KEY(file_id, commit_hash, label)) STRICT;  -- AD-4
CREATE TABLE invariants(id TEXT PRIMARY KEY, description TEXT NOT NULL,
  PROV) STRICT;
CREATE TABLE invariant_members(
  invariant_id TEXT NOT NULL REFERENCES invariants(id) ON DELETE CASCADE,
  file_id INTEGER NOT NULL REFERENCES files(id),
  span TEXT) STRICT;
CREATE TABLE human_facts(id TEXT PRIMARY KEY, statement TEXT NOT NULL,
  target_kind TEXT NOT NULL, target_ref TEXT NOT NULL,
  stated_at INTEGER NOT NULL, PROV) STRICT;
CREATE TABLE corrections(seq INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE,
  whisper_id TEXT, deny_id TEXT,
  verdict TEXT NOT NULL CHECK(verdict IN ('false_fire','missed','confirm')),
  genre TEXT,          -- AD-4 (added db9ecf9, from D-plan-35): the fold's attribution input for a
                       -- whisper-less 'missed' (the --genre value, or
                       -- 'answer_drift' for --missed-question) — AD-5/AD-18
  note TEXT, ts INTEGER NOT NULL,
  CHECK(whisper_id IS NULL OR deny_id IS NULL),
  CHECK(whisper_id IS NOT NULL OR deny_id IS NOT NULL OR verdict = 'missed'),
  CHECK(genre IS NULL OR (whisper_id IS NULL AND deny_id IS NULL))) STRICT;
  -- append-only (AD-4): no code path updates or deletes a corrections row
CREATE TABLE stats_folds(seq INTEGER PRIMARY KEY, genre TEXT NOT NULL,
  sent INTEGER NOT NULL, corrected_false INTEGER NOT NULL,
  corrected_missed INTEGER NOT NULL,
  audit_from INTEGER NOT NULL, audit_to INTEGER NOT NULL,
  corrections_from INTEGER NOT NULL, corrections_to INTEGER NOT NULL,
  ts INTEGER NOT NULL) STRICT;                        -- AD-4/AD-5; append-only
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
CREATE TABLE session_log(seq INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE,
  session TEXT NOT NULL, consumer TEXT NOT NULL, event_type TEXT NOT NULL,
  ts INTEGER NOT NULL, latency_ms INTEGER, candidates_json TEXT,
  outcome TEXT, detail_json TEXT) STRICT;
CREATE TABLE observed_actions(seq INTEGER PRIMARY KEY,   -- N16: engine-assigned
  session TEXT NOT NULL, consumer TEXT NOT NULL,
  tool TEXT NOT NULL, path TEXT,
  command_class INTEGER CHECK(command_class IN (1,2,3)),
  outcome TEXT CHECK(outcome IN ('ok','failed')),
  content_hash TEXT,   -- AD-4/AD-23: the edited file's hash after an ok
                       -- Edit/Write; NULL above the AD-12 cap
  segments_json TEXT,  -- plan column: Step 17's per-segment classes for a
                       -- Bash row (Verification's run subtraction reads them)
  ts INTEGER NOT NULL) STRICT;
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
CREATE TABLE whisper_audit(seq INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE,
  session TEXT NOT NULL, consumer TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('whisper','deny')),
  genre TEXT, ts INTEGER NOT NULL, text TEXT NOT NULL, evidence_json TEXT,
  confidence REAL, channel TEXT,
  subject_key TEXT,    -- AD-4/AD-16: NULL on deny rows
  continuation INTEGER NOT NULL DEFAULT 0) STRICT;
  -- append-only (AD-4, FR-X6)
CREATE TABLE faults(id TEXT PRIMARY KEY, ts INTEGER NOT NULL,
  code TEXT NOT NULL, detail_json TEXT, session TEXT) STRICT;
CREATE TABLE classified_turns(consumer TEXT NOT NULL, uuid TEXT NOT NULL,
  ts INTEGER NOT NULL, clears INTEGER NOT NULL CHECK(clears IN (0,1)),
  reason TEXT CHECK(reason IN ('below_length_floor','deferral_only')),
  PRIMARY KEY(consumer, uuid)) STRICT;   -- plan table (D-plan-27): the per-turn record
  -- AD-9's deny_loop and deny_despite_answer_text detectors read across
  -- events (each event is a fresh process, AD-1); written by the catch-up
  -- (Step 25), read by the detectors (Step 26)
CREATE TABLE path_tokens(token TEXT NOT NULL,
  file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE) STRICT;
  -- plan table: the indexed token-prefix path search of the fallback
  -- (AD-2; N6); written by the indexer in both FTS states (Step 14)
CREATE TABLE symbol_tokens(token TEXT NOT NULL,
  symbol_id INTEGER NOT NULL REFERENCES symbols(id) ON DELETE CASCADE) STRICT;
  -- plan table: AD-2's normalized symbol tokens for the fallback — one row
  -- per distinct token of a symbol's name (a table, not a column: a name such
  -- as Foo::Bar has two tokens and a prefix query for its second must use an
  -- index — §16 item 5); written by the indexer in both FTS states (Step 14)
-- indexes: the fallback searches (AD-2) — plain BINARY indexes serve the
-- range `token >= ? AND token < ? || char(0x10FFFF)` (executed 2026-09-26:
-- SEARCH … USING INDEX); the tokens are already case-folded, so no NOCASE
CREATE INDEX symbol_tokens_token ON symbol_tokens(token);
CREATE INDEX path_tokens_token ON path_tokens(token);
CREATE INDEX files_path ON files(path);
CREATE INDEX whisper_audit_text ON whisper_audit(text);  -- AD-16 fork reseed
CREATE INDEX observed_actions_session ON observed_actions(session, consumer);
CREATE INDEX cochange_pairs_b ON cochange_pairs(b);       -- partnersOf(x) reads a=x OR b=x
```

The two FTS5 virtual tables are a **separate, conditional** migration
(D-plan-28),
`src/stores/migrations/001b_phase_a_fts.sql`, which the runner applies only
when `schema_meta.fts_state = 'fts5'` — the row the runner itself records,
right after 001 has created `schema_meta`, from its `fts` argument (Step
3's `probeFts5` result, which `init` passes, Step 31); on `'fallback'` it
is skipped and never retried (the row is written once, when the key is
absent, so a later run cannot flip it), and the search interface (Step 14)
uses the `symbol_tokens`/`path_tokens` range path (AD-2):

```sql
-- 001b_phase_a_fts.sql (applied only when schema_meta.fts_state = 'fts5')
-- Both columns hold the in-house tokens (Step 14's tokenize) joined by one
-- space; the ascii tokenizer splits exactly there, because every non-ASCII
-- codepoint is a token character to it and the tokens hold no ASCII byte but
-- [a-z0-9] (AD-2: "the FTS path indexes those tokens").
CREATE VIRTUAL TABLE fts_symbols USING fts5(tokens, kind UNINDEXED,
  symbol_id UNINDEXED, file_id UNINDEXED, tokenize = "ascii");
CREATE VIRTUAL TABLE fts_paths USING fts5(tokens, file_id UNINDEXED,
  tokenize = "ascii");
```

`import_edges`, `symbol_refs`, `test_map`, `invariant_members`,
`symbol_tokens`, and `path_tokens` carry no primary key, as in AD-4; AC-19's per-table dump
orders them by every column in schema order (D-plan-4). **Do NOT create**
`exemplars`, `recipes`,
`env_capabilities`, `deferred_queue`, or Phase-C `genre_state` — AD-4's
uniform table-creation criterion (no table without a same-phase writer)
means those arrive with their writing phase's migration.

**Reopened 2026-09-26 — build delta.** Migrations 001 and 001b are edited in
place to the DDL above (§6: no store has shipped). Against the built 001:
- `files` gains `in_tree`, `change_count`, `change_weight`,
  `unresolved_imports`;
  `content_hash`/`mtime` become nullable; the path's injection flag is the
  PROV `injection_suspect` column (AD-4, AD-19; review G2, G3). A row with
  `in_tree = 0` is either miner-created (history-only) or a file the index
  walk no longer lists or cannot stat.
- `cochange_pairs` loses `a_count`/`b_count` (AD-4/AD-13, G3 — the counters
  equalled `pair_count`, so every confidence read 1.0, executed) and gains
  `pair_weight` (AD-13 at `6cff0ce`: recency weights the evidence, never the
  result — collapse-hunt H1).
- `cochange_pairs`, `landmines`, `labelled_touches`, `invariant_members`
  reference `files(id)` with no cascade (AD-4: a deleted file's row is kept
  while mined history references it; the former cascade destroyed a deleted
  file's pairs and landmines while a never-indexed deleted path kept them —
  G2). The engine now *refuses* a delete that would orphan history, so the
  rule is enforced, not remembered.
- `labelled_touches` and the partial unique index `landmines_miner_key` are
  new (AD-4/AD-15, G5 — two `fix_chatter` rows with support 4 and 3 for one
  file, executed).
- `corrections`, `whisper_audit`, `session_log`, `observed_actions` get an
  explicit `seq INTEGER PRIMARY KEY` (a rowid alias assigned at insert under
  the write lock) with the ULID `id` kept `UNIQUE` where other rows reference
  it (AD-4/AD-5; G33/N11 — the wall-clock watermark skipped a concurrently
  committed row; N16 — `seq` was `Date.now()`, so two events in one
  millisecond collided). Explicit, not the implicit rowid, because `VACUUM`
  (and so `VACUUM INTO` export) "may change the ROWIDs of entries in any
  tables that do not have an explicit INTEGER PRIMARY KEY" (§3).
- `corrections` gains the column `genre` and the relaxed CHECKs (AD-4 since
  db9ecf9): a
  whisper-less, deny-less row is legal only as `verdict = 'missed'`, and only
  such a row may carry a `genre` (AD-5's `--genre`/`--missed-question`
  attribution; the former exclusive-or CHECK made that row unrepresentable).
- `stats_folds` is new (AD-4/AD-5); `whisper_audit.subject_key` is new
  (AD-4/AD-16).
- The search indexes: the built `symbols_name` index is **no longer
  created** (001 is edited in place), and
  `symbol_tokens` and `path_tokens` with plain token indexes are new (see
  Step 14's search semantics). Executed 2026-09-26 (§11.4), the built
  "indexed `LIKE`" fallback was a full scan over a BINARY index, and a
  `NOCASE` index, which a `LIKE` can use, folds ASCII only: `LIKE 'über%'`
  missed `Über` while FTS matched it, and `LIKE` matched `café`, `bar`, and
  `method` nowhere while FTS matched `CAFÉ`, `foo-bar`/`Foo::Bar`, and
  `my.method` (expert review M3; collapse-hunt H4, P1).
- 001b: both FTS tables index the in-house tokens (AD-2's one tokenizer,
  which the indexer applies) through the `ascii` tokenizer, so the FTS path and the fallback hold the
  same tokens by construction (AD-2 at `6cff0ce`); executed 2026-09-26 over
  `user_name`, `getUserName`, `CAFÉ`, `Über`, `foo-bar`, `my.method`,
  `Foo::Bar`, `$store`, `İstanbul`, `Größe` and a decomposed `café`, nineteen
  queries returned the same symbols from both tables (§11.4). The former
  `unicode61 … tokenchars '_$'` configuration is gone: its separator rule was
  SQLite's, not the fallback's (G16's `fts_paths` finding — a whole path read
  as one token — is closed the same way).
The runner (`applyMigrations`) is unchanged. The one skeleton statement this
schema breaks at run time rather than at compile time — the generator
helper's pair query naming `a_count` — is removed by the Step 6 delta's
placeholder (the helper returns no rows), so Step 7 adds no `modify:` entry of
its own (Checkpoint 1R, §9).

Add `src/stores/migration_runner.ts` — `applyMigrations(store, {fts:
boolean, scope?: 'project'|'global'})` — scope defaults to `'project'`; `'global'`
applies only migration 002 (the Step 8 global store) against `global_meta`,
ignoring `fts`. For the project scope it reads `schema_meta.schema_version` (0 when the table does not
exist yet — an empty store), applies the numbered migrations in order,
and between 001 and 001b records `schema_meta.fts_state` — `'fts5'` when
`fts` is true, `'fallback'` otherwise — only when that key is absent, so
the state a store was created under is never retried; it then applies a
migration whose name carries the `_fts` suffix only when
`schema_meta.fts_state = 'fts5'`, skipping it otherwise, and records the
new version. The runner is the row's only writer; `init` (Step 31) is its
only production caller, and test setup — Step 28's replay harness and Step
29's `large-store` generator — builds its stores through this same
function, never through DDL of its own (testing-standards: the schema comes
from the migrations). Forward-only per
AD-25. The `.sql` files are read at runtime from the package's own `src/`
tree, resolved from `import.meta.url` of the compiled runner
(`../../../src/stores/migrations/`), so the package ships `src/` beside
`dist/` (Step 1's `files` list) and `tsc` — which emits no `.sql` — needs
no copy step.

**Creates.** `src/stores/migration_runner.ts`; `src/stores/migrations/001_phase_a_project.sql` — AD-4; `src/stores/migrations/001b_phase_a_fts.sql` — the FTS5 tables, applied only under fts_state 'fts5' (AD-2).

**Source.** `AD-4` (project-store schema, STRICT + CHECK, provenance-
mandatory; the uniform table-creation criterion; `in_tree`, `change_count`,
`labelled_touches`, `seq`, `stats_folds`, `subject_key` as of 2026-09-26);
`AD-5` (the fold's watermark keys); `AD-25` (forward-only migrations for
shipped stores); `AD-2` and `AD-13` at `6cff0ce` (the in-house tokens, the
recency weights); gap-list review G2, G3, G5, G16, G33, N6, N11, N16;
plan-pass reviews H1, H4, M3, M7.

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
   the migration runner at `init` — its one production caller, Step 31 —
   is enough because Phase A ships one schema version; the handler never
   migrates on open, so a store nothing created is a fail-open case,
   `T-28-3`). Not shipping dormant tables
   (AD-4's criterion,
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
  -- schema_version; repo_path:<realpath of a repository root> -> repo key
  -- (AD-20's binding, written by init, Step 31); NO fold watermark (AD-5)
CREATE TABLE whisper_stats(genre TEXT NOT NULL, project_key TEXT NOT NULL,
  sent INTEGER NOT NULL, corrected_false INTEGER NOT NULL,
  corrected_missed INTEGER NOT NULL, published_at INTEGER NOT NULL,
  PRIMARY KEY(genre, project_key)) STRICT;
  -- AD-5: a replica, replaced per project by the fold's publish step
CREATE TABLE tuning(key TEXT NOT NULL, project_key TEXT, value TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('architecture_default','plan_seed','owner')),
  updated_at INTEGER NOT NULL) STRICT;
  -- scalar keys: one row per (key, project_key); list keys (lexicon.*,
  -- index.ext_to_grammar): one row per member
CREATE TABLE lessons(id TEXT PRIMARY KEY, statement TEXT NOT NULL,
  evidence_json TEXT, PROV) STRICT;
```

`global_meta` holds the repository bindings and holds **no** fold watermark:
the watermarks and the per-fold ledger live in the project store
(`schema_meta` and `stats_folds`, Step 7), and `whisper_stats` is a
replaceable copy of each project's `stats_folds` totals, so an import, a
purge, or a replaced store can neither strand nor double-count a row (AD-5 as
revised 2026-09-26; review G33/N11 and the architecture pass's CH H8 / ER M6).
**Reopened 2026-09-26 — build delta:** migration 002 is edited in place to the
DDL above (§6). Do NOT create `env_capabilities`
(Phase B writer). Schema only; the `tuning` seed rows are written by
Step 12. Migration 002 is applied by Step 7's runner via
`applyMigrations(store, {scope: 'global'})`; Step 8 adds no runner of its own.

**Creates.** `src/stores/migrations/002_phase_a_global.sql` — AD-5.

**Source.** `AD-5` (global store schema; the `whisper_stats` replica; the
bindings in `global_meta`, AD-20; no `env_capabilities` yet).

**Why this approach (trivial: mechanical from AD-5, with the same type resolution as Step 7).**

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-8-1` (the four tables exist with the columns above; no
Phase B/C table exists).

**Impact if wrong.** Contained — caught by `T-8-1`.

---

### Step 9 — DAOs for every Phase A table, ULID ids

```step-decl
step: S9
covers: [PA-3]
files:
  create: [middleware/context-oracle/ctxoracle/src/stores/dao/files.ts, middleware/context-oracle/ctxoracle/src/stores/dao/symbols.ts, middleware/context-oracle/ctxoracle/src/stores/dao/import_edges.ts, middleware/context-oracle/ctxoracle/src/stores/dao/symbol_refs.ts, middleware/context-oracle/ctxoracle/src/stores/dao/test_map.ts, middleware/context-oracle/ctxoracle/src/stores/dao/commits.ts, middleware/context-oracle/ctxoracle/src/stores/dao/cochange_pairs.ts, middleware/context-oracle/ctxoracle/src/stores/dao/landmines.ts, middleware/context-oracle/ctxoracle/src/stores/dao/invariants.ts, middleware/context-oracle/ctxoracle/src/stores/dao/human_facts.ts, middleware/context-oracle/ctxoracle/src/stores/dao/corrections.ts, middleware/context-oracle/ctxoracle/src/stores/dao/questions.ts, middleware/context-oracle/ctxoracle/src/stores/dao/classify_state.ts, middleware/context-oracle/ctxoracle/src/stores/dao/consumer_state.ts, middleware/context-oracle/ctxoracle/src/stores/dao/session_log.ts, middleware/context-oracle/ctxoracle/src/stores/dao/observed_actions.ts, middleware/context-oracle/ctxoracle/src/stores/dao/whisper_audit.ts, middleware/context-oracle/ctxoracle/src/stores/dao/faults.ts, middleware/context-oracle/ctxoracle/src/stores/dao/regret.ts, middleware/context-oracle/ctxoracle/src/stores/dao/classified_turns.ts, middleware/context-oracle/ctxoracle/src/stores/dao/whisper_stats.ts, middleware/context-oracle/ctxoracle/src/stores/dao/lessons.ts, middleware/context-oracle/ctxoracle/src/stores/dao/global_meta.ts, middleware/context-oracle/ctxoracle/src/stores/dao/schema_meta.ts, middleware/context-oracle/ctxoracle/src/stores/dao/labelled_touches.ts, middleware/context-oracle/ctxoracle/src/stores/dao/stats_folds.ts, middleware/context-oracle/ctxoracle/src/stores/dao/path_tokens.ts, middleware/context-oracle/ctxoracle/src/stores/dao/symbol_tokens.ts, middleware/context-oracle/ctxoracle/src/util/ulid.ts, middleware/context-oracle/ctxoracle/test/unit/dao_crud.test.ts, middleware/context-oracle/ctxoracle/test/build/typecheck_provenance.test.ts, middleware/context-oracle/ctxoracle/test/build/fixtures/missing_provenance.ts]
  modify: [middleware/context-oracle/ctxoracle/src/miner/cochange.ts, middleware/context-oracle/ctxoracle/src/index/indexer.ts, middleware/context-oracle/ctxoracle/src/diag/whisper_stats_fold.ts, middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts]
  delete: []
provides: [schema_meta.get, schema_meta.set, schema_meta.delete, global_meta.get, global_meta.set, global_meta.delete, global_meta.keysWithPrefix, files.upsert, files.byPath, files.byId, files.all, files.ensureHistoryRow, files.markAbsentExcept, files.sweepUnreferenced, files.addChangeCount, files.resetChangeCounts, files.setUnresolvedImports, files.setEntryScore, symbols.replaceForFile, symbols.byName, symbols.byId, import_edges.replaceForFile, import_edges.inDegree, import_edges.importersOf, symbol_refs.replaceForFile, symbol_refs.refCount, test_map.replaceForFile, test_map.coveringTests, path_tokens.replaceForFile, symbol_tokens.replaceForFile, commits.upsert, commits.exists, commits.tsOf, commits.countIncluded, commits.deleteAll, cochange_pairs.bump, cochange_pairs.partnersOf, cochange_pairs.pair, cochange_pairs.deleteAll, labelled_touches.add, labelled_touches.touchesSince, labelled_touches.deleteAll, landmines.createHuman, landmines.rebuildMinerKinds, landmines.deleteMinerKinds, landmines.forFile, invariants.create, invariants.forFile, human_facts.create, human_facts.forTarget, corrections.create, corrections.since, corrections.maxSeq, corrections.forDeny, corrections.forWhisper, questions.insertOpen, questions.openFor, questions.closeAll, questions.setStatus, questions.backfill, questions.expireOpen, classify_state.get, classify_state.set, consumer_state.has, consumer_state.hasAny, consumer_state.add, consumer_state.clear, session_log.append, session_log.forSession, session_log.lastEventTs, session_log.livenessRows, session_log.latestSession, session_log.hasEnded, observed_actions.append, observed_actions.okEdits, observed_actions.okEditedPaths, observed_actions.okReads, observed_actions.runs, observed_actions.pathWrites, observed_actions.firstHash, observed_actions.hashesFor, observed_actions.writtenSinceSeq, observed_actions.maxSeq, regret.append, regret.forSession, regret.countsByState, classified_turns.record, classified_turns.sinceQuestionOpened, classified_turns.between, whisper_audit.append, whisper_audit.forSession, whisper_audit.denies, whisper_audit.lastKinds, whisper_audit.deliveredSubjects, whisper_audit.since, whisper_audit.maxSeq, whisper_audit.subjectKeyForText, faults.append, faults.sinceTs, faults.countByCode, stats_folds.append, stats_folds.totals, stats_folds.all, whisper_stats.replaceForProject, whisper_stats.forProject, lessons.create, lessons.all]
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
| `observed_actions` | `append(row)`, `okEdits(session)`, `okReads(session)`, `runs(session)`, `pathWrites(session, sinceSeq)`, `firstHash(session, path)`, `writtenSinceSeq(path, sinceSeq)` — whether any `'ok'` Edit/Write/NotebookEdit row exists for `path` with `seq > sinceSeq`, across every session (Step 30's cross-session revert check: churn happened since the watermark), and `maxSeq()` |
| `regret` | `append(row)`, `forSession(session)`, `countsByState()` |
| `classified_turns` | `record(consumer, uuid, ts, clears, reason): 'new' \| 'updated'` — `INSERT … ON CONFLICT(consumer, uuid) DO UPDATE SET clears, reason` (`ts` unchanged), so the `resume`/`fork`/`compact` re-read of a recorded turn updates its row instead of throwing (D-plan-27); `sinceQuestionOpened(consumer)` (the assistant text turns since the newest open question, in order), `between(consumer, fromTs, toTs)` |
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
(Step 6's `src/security/trust.ts`) is what each entry point calls. The
schema's `'mechanical'` trust value is reserved for later-phase
mechanically-generated content (`FR-X2`) and is rejected by that gate in
Phase A, so `T-9-1` pins that a non-human input written as `'mechanical'`
throws, alongside the human↔untrusted laundering cases.

Three DAO-surface details are pinned here so they are declared rather than
left for a reader to discover: (a) `observed_actions` classifies tools by two
in-code sets — `EDIT_TOOLS = {Edit, Write, NotebookEdit}` (the
change/re-edit consumers `okEdits`/`pathWrites`/`writtenSinceSeq`; the
current hooks reference documents no `MultiEdit` tool — expert review m6) and
`READ_TOOLS = {Read, Grep, Glob}` (the read-set consumer `okReads`) — matching
AD-4's consumer filter (the Edit/Write/Read tool rows, not the Bash path-write
rows); (b) *superseded 2026-09-26* — the miner-kind landmine key is
`(kind, file_id)`, enforced by `landmines_miner_key` and written only by
`rebuildMinerKinds` (see the build delta); (c) *superseded 2026-09-26* —
`whisper_audit.deliveredSubjects(session)` returns `subject_key` values.

**Reopened 2026-09-26 — build delta.** The table above is superseded where
this list differs (the provides list in the declaration is the complete
surface):
- `files`: `deleteMissing(presentPaths)` is **removed** (it hard-deleted a
  file and cascaded its history away — G2). New: `ensureHistoryRow(path,
  injectionSuspect, commitHash): number` (insert-if-absent with `in_tree = 0`,
  `lang` and `zone` `'unknown'`, `content_hash`/`mtime` NULL, provenance
  `commit`/`untrusted_repo` with `prov_ref` = the commit that first named the
  path — a `commit` provenance must reference a commit, Steps 1–12 build
  review m1; returns the id; never changes an existing row);
  `markAbsentExcept(listedPresentIds): number[]` (sets `in_tree = 0` on every
  `in_tree = 1` row not in the set and returns their ids so the indexer
  deletes their index-derived rows); `sweepUnreferenced(): number` (deletes
  `in_tree = 0` rows with `change_count = 0` that no `cochange_pairs`,
  `landmines`, `labelled_touches`, or `invariant_members` row references);
  `addChangeCount(id, n, weight)` (adds `n` to `change_count` and `weight`
  to `change_weight`), `resetChangeCounts()` (sets both to 0 — the purge set,
  AD-13) (G3, AD-13; collapse-hunt H1);
  `setUnresolvedImports(id, n)`; `setEntryScore(id, score)` (an assignment —
  it writes only when the value differs, so an unchanged pass writes nothing;
  N4). `upsert(row)` takes `in_tree` and the path's `injection_suspect`.
- `cochange_pairs`: `bump(a, b, ts, hash, weight)` increments `pair_count`,
  adds `weight` to `pair_weight` (AD-13's recency weight of that commit), and,
  when `ts ≥ last_ts`, sets `last_ts = ts` and `last_commit = hash` (no
  per-file counters, G3);
  `partnersOf(fileId): {partnerId, pairCount, pairWeight, lastTs,
  lastCommit}[]` reads both `a = x` and `b = x`; `deleteAll()`.
- `labelled_touches` (new): `add(fileId, hash, label, ts)` (`INSERT … ON
  CONFLICT DO NOTHING`), `touchesSince(label, sinceTs): {fileId, hashes,
  count}[]` (grouped by file, distinct hashes, `ts ≥ sinceTs`),
  `deleteAll()` (G5).
- `landmines`: `upsert` is **removed** (its `(kind, file_id, evidence)` key
  produced one row per mining pass — G5/N5). New: `rebuildMinerKinds(rows)`
  (deletes every `revert_chain`/`fix_chatter` row and inserts `rows`, one per
  `(kind, file_id)`, inside the caller's transaction), `deleteMinerKinds()`,
  `createHuman(row)` (the `human_stated` writer, Step 35; never touched by the
  rebuild). `forFile(fileId)` returns human rows first (AC-23).
- `commits`: `deleteAll()`.
- `corrections`: `create(row)` (returns the ULID; the engine assigns `seq`),
  `since(seq): row[]` (`seq > ?` in `seq` order), `maxSeq()`; `sinceTs` is
  removed (the fold never reads wall-clock `ts` — N11). No update or delete
  method exists (append-only, AD-4).
- `whisper_audit`: `append(row)` still returns the ULID synchronously and
  takes `subject_key`; `since(seq)`, `maxSeq()`,
  `subjectKeyForText(text): string | null` (the newest `kind = 'whisper'`
  row whose `text` equals the argument, through `whisper_audit_text` — the
  fork reseed, AD-16); `deliveredSubjects(session)` now returns the distinct
  `subject_key` values of the session's whisper rows (the column exists now;
  the former genre-granularity stand-in is gone). No update or delete
  method exists.
- `stats_folds` (new): `append(rows)`, `totals(): {genre, sent,
  correctedFalse, correctedMissed}[]` (SUM per genre), `all()` (the trend
  `status` renders).
- `whisper_stats`: `upsertFold` is **removed**; `replaceForProject(projectKey,
  rows, publishedAt)` deletes that project's rows and inserts `rows` inside the
  caller's transaction (AD-5's replace-publish); `forProject(projectKey)`.
- `global_meta` / `schema_meta`: `delete(key)`; `global_meta.keysWithPrefix(
  prefix)` (the bindings, `status` and `deinit --purge`).
- `observed_actions`: `append(row)` takes no `seq` (engine-assigned — N16) and
  takes `segments_json`; `okEditedPaths(session, consumer)` (G22 — the
  distinct paths of `outcome = 'ok'` rows whose tool ∈ `EDIT_TOOLS`);
  `hashesFor(session, consumer, path)`; `runs(session, consumer)` returns
  `command_class`, `segments_json`, and `outcome`; `pathWrites(session,
  consumer, sinceSeq)` orders by `seq` and counts `outcome = 'ok'` rows only
  (a failed write changed nothing, the rule every other edit consumer
  follows); `firstHash(session, consumer, path)`. Every per-session reader
  takes the consumer, so a subagent's actions never appear in the main
  agent's `ObservedActionsReader` (Step 6 declares that reader per session
  and consumer; Steps 1–12 build review M2, m2); `writtenSince(path, sinceTs)` is **replaced**
  by `writtenSinceSeq(path, sinceSeq)` (`seq > sinceSeq`) and `maxSeq()` — the
  index-time regret watermark is a `seq`, never a wall-clock `ts`, for the
  reason the fold's is (expert review M7: a handler that stamps `ts` before the
  pass's "now" but commits after it would be skipped forever).
- `session_log`: `append(row)` takes no `seq`, returns `{id, seq}`;
  `latestSession(): {session, startedTs, lastTs} | null` (the session of the
  row with the largest `seq`, its first row's `ts`, and its newest row's
  `ts`); `hasEnded(session): boolean` (a row with `event_type =
  'SessionEnd'` exists) — the `--missed-question` target (AD-18; collapse-hunt
  H5).
- `consumer_state`: `hasAny(consumer, kind, keys[]): boolean` (the
  `incorporatedBy` check, AD-16).
- `path_tokens` (new): `replaceForFile(fileId, tokens)`.
- `symbol_tokens` (new, AD-2): `replaceForFile(fileId, rows: {symbolId,
  tokens}[])` — deletes the file's symbols' token rows and inserts one row per
  distinct token (the symbol rows cascade their tokens away on their own
  delete).
- Every DAO method that writes more than one statement wraps them in
  `store.transaction` (a savepoint when a caller already holds one — Step 3),
  so a DAO call alone stays atomic and a caller can compose several.

*Checkpoint 1R adaptation (review S1).* The `modify:` list above names the
skeleton modules whose calls this surface removes or re-signs, read from the
built skeleton on 2026-09-26: the miner (`landmines.upsert`, the old `bump`
signature), the indexer (`files.deleteMissing`, the `upsert` row without
`in_tree`), the whisper-stats fold (`upsertFold` and the `window_start`
columns migration 002 no longer has), and the skeleton verb module
(`landmines.upsert`). Each is reduced by §9's placeholder rule and marked
`SKELETON: 1R`: a removed call is deleted with its caller's branch, a re-signed
call passes the new inputs with the stand-in §9 lists. The handler's
`seq`-carrying appends (this step and Step 10) are adapted in the handler the
Step 6 delta already lists.

**Creates.** `src/stores/dao/labelled_touches.ts`, `src/stores/dao/stats_folds.ts`, `src/stores/dao/path_tokens.ts`, `src/stores/dao/symbol_tokens.ts` — the four new Phase A tables' DAOs; `src/stores/dao/files.ts`; `src/stores/dao/symbols.ts`; `src/stores/dao/import_edges.ts`; `src/stores/dao/symbol_refs.ts`; `src/stores/dao/test_map.ts`; `src/stores/dao/commits.ts`; `src/stores/dao/cochange_pairs.ts`; `src/stores/dao/landmines.ts`; `src/stores/dao/invariants.ts`; `src/stores/dao/human_facts.ts`; `src/stores/dao/corrections.ts`; `src/stores/dao/questions.ts`; `src/stores/dao/classify_state.ts`; `src/stores/dao/consumer_state.ts`; `src/stores/dao/session_log.ts`; `src/stores/dao/observed_actions.ts`; `src/stores/dao/whisper_audit.ts`; `src/stores/dao/faults.ts`; `src/stores/dao/regret.ts` — the plan-table DAO AD-18's regret row needs; `src/stores/dao/classified_turns.ts` — the per-turn classification record the deny-health detectors read across events; `src/stores/dao/whisper_stats.ts`; `src/stores/dao/lessons.ts`; `src/stores/dao/global_meta.ts` — one file per Phase A table; `src/stores/dao/schema_meta.ts` — one file per Phase A table; `src/util/ulid.ts` — ULID generator (AD-26).

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
`writeSessionEvent(store, {session, consumer, event_type, ts,
latency_ms, candidates_json, outcome, detail_json?}): {id, seq}` — a thin wrapper
over the `session_log` DAO. **Reopened 2026-09-26 — build delta:** the
caller no longer passes `seq`; the engine assigns it (Step 7's `seq INTEGER
PRIMARY KEY`; the handler's `Date.now()` sequence collided within one
millisecond — review N16), and the writer returns it. `recordFault(store |
null, diagnosticsDir, fault)` is unchanged; the handler passes the
home-level `diagnostics/` directory (Step 4's `ensureHome`) whenever no
repository is known (AD-17, G35). Create `src/diag/fault_writer.ts` exporting
`recordFault(store | null, diagnosticsDir, fault)`: writes to the `faults`
table when a store handle is given AND (mirror) to the JSONL channel (Step
6). Every fault and every session record is written through these two
writers, and that is the structural property AD-17 makes of its two
tables: `test/conventions/fault_session_writers_only.test.ts` is an import
scan over `dist/src/**` asserting that `dist/src/stores/dao/faults.js` is imported
only by `dist/src/diag/fault_writer.js` and `dist/src/diag/status.js`, and
`dist/src/stores/dao/session_log.js` only by `dist/src/diag/session_writer.js`,
`dist/src/diag/status.js`, `dist/src/diag/log.js`, `dist/src/diag/regret.js`, and
`dist/src/cli/correct.js` — the readers §5.1 names (the last reads, never
writes: the `--missed-question` target session, Step 34, is chosen from
`session_log`; added 2026-09-26, since without it the verb's read would break
this convention); every other module reaches the two tables through the writers.

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
  create: [middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts, middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts, middleware/context-oracle/ctxoracle/test/unit/tuning_dao.test.ts, middleware/context-oracle/ctxoracle/test/unit/tuning_reader.test.ts]
  modify: []
  delete: []
provides: [seedDefaults, tuningReader, checkTuningWrite, tuningWriteNotice]
tests: [T-12-1, T-12-2, T-12-3]
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
- `bar.recency_half_life_days` = `365` (the half-life `h` of AD-13's commit
  weights; the former `bar.stale_index_factor` plan seed is superseded by the
  architecture's `bar.stale_factor`, below)
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
that" class only; a bare common word such as `later` is never a member —
the hold requires a recognized phrase, Step 23), `lexicon.deferral_filler`
(`later`, `soon`, `now`, `next`, `then`, `first`, `shortly`, `afterwards`,
`momentarily`, `moment`, `sec`, `second`, `minute`, `bit`, `while`, `i`,
`we`, `you`, `it`, `that`, `this`, `them`, `one`, `a`, `an`, `the`, `on`,
`to`, `in`, `for`, `not`, `yet`, `just` — the closed set of words a
deferral phrase licenses beside it without adding content: temporal
adverbs, duration nouns, pronouns, and the function words the phrases
attach; a turn holding a stoplist phrase and nothing outside this set is
the content-free deferral AD-9 names, and a word outside it anywhere in
the turn is content and clears, Step 23, D-plan-24). The three
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
list-valued `architecture_default` key is `index.ext_to_grammar`, the
default extension → grammar table Step 15 enumerates (32 grammars; `elm`,
`ql`, `yaml` and `bash` excluded by executed cause, §4). All list keys are
owner-tunable via `tune` (AD-20).

**Reopened 2026-09-26 — build delta.**
- **`tuningReader(global: Store, projectKey: string, onMissing: (key:
  string) => void): TuningReader`** (G8, G17 — Step 6 promised it and Step 12
  built only `tuning.get`, so `tuning_missing` had no writer and every
  consumer carried a fallback literal). Resolution per key: the row with
  `project_key = projectKey`, else the row with `project_key IS NULL`; for a
  list key, the member rows of whichever level has any. A key with neither is
  re-seeded from `tuning_seeds.ts` (the seed row written with its seed
  `source`), `onMissing(key)` is called once for it, and the seed value is
  returned; a key that is not in the seed module throws (a typo is a bug, not
  a tunable). `num(key)` parses a finite number or throws; values are cached
  for the reader's lifetime (one event, or one verb run). The handler passes
  `onMissing = key => recordFault(projectStore, diagnosticsDir, {code:
  'tuning_missing', detail: {key}})`; tests pass a recording function.
  `tuning.get(store, key, projectKey?)` resolves the same way (the Step 12
  finding that it read only the NULL row is closed).
- **`checkTuningWrite(reader, key, value): { ok: true } | { refused: string }`**
  — AD-14's ordering invariant and tier invariant, enforced where `tune`
  writes (Step 33): after the write, all of these must hold —
  `bar.confidence_floor ≤ bar.suspect_confidence_cap <
  bar.high_confidence_min`; `bar.confidence_floor ≤
  bar.heuristic_confidence_cap < bar.high_confidence_min`;
  `bar.untrusted_trust_factor` and `bar.stale_factor` each in (0, 1];
  **`bar.untrusted_trust_factor × bar.stale_factor ≥
  bar.high_confidence_min`** (AD-14's tier invariant: a fact with perfect
  evidence must reach the high tier under every dampener at once, or a
  dampener becomes a universal cap — collapse-hunt H2: without it, `tune
  bar.untrusted_trust_factor 0.75` flagged every mined whisper uncertain, C2
  again); and `bar.recency_half_life_days ≥ 37`. It also refuses a key that
  has no seed in `tuning_seeds` (a typo would otherwise write a row nothing
  reads) and, for a key whose seed is numeric, a value that is not a finite
  number (`num()` throws on one, so `tune bar.support_min abc` would make
  every event fail open silently — Steps 1–12 build review M3). Otherwise the
  plain-language reason names the violated relation and every value in it
  (AD-20, ER M9).
  *Why 37 (a plan guard, raised in §16 item 5):* first derived when AD-13's
  weight `2^((ts − T0)/h)` used a fixed `T0` = 2000-01-01 — a 2100 commit's
  weight `2^(36525/h)` stayed below about `2^1000` only for `h` ≥ 36.5 days
  (executed 2026-09-26: `2^(36525/30)` is `Infinity`, `2^(36525/36.5)` ≈
  1.7 × 10^301, §11.4). AD-13 now re-bases `T0` to `refTs − 500·h` days on
  every full mine and caps `ts` at `refTs` (Step 13; Step 13 build review M3),
  which bounds the exponent above at 500 whatever `h` is; AD-13 keeps the
  37-day floor, at which the 5-year horizon spans about 49 half-lives, so
  every exponent of a fresh mine stays within about [450, 500]. The seed set satisfies every relation (0.6 ≤ 0.7 < 0.8; 0.9 and
  0.9 in (0, 1]; 0.9 × 0.9 = 0.81 ≥ 0.8; 365 ≥ 37).
- **`tuningWriteNotice(key): string | null`** — the plain-language line
  `tune` prints after an accepted write whose effect needs more than the write:
  for `bar.recency_half_life_days`, "the stored co-change weights were mined
  under the old half-life; the next ctxoracle index re-mines this
  repository's history under the new one" (AD-13: "Changing `h` requires a
  re-mine, which `tune` states"; Step 13 re-mines when
  `schema_meta.mined_half_life_days` differs); `null` for every other key.
- **New `architecture_default` scalars** (values AD-14, AD-12, AD-26 state,
  each marked illustrative there): `bar.high_confidence_min` = `0.8`,
  `bar.untrusted_trust_factor` = `0.9`, `bar.suspect_confidence_cap` = `0.7`,
  `bar.heuristic_confidence_cap` = `0.7` (G20 as revised by AD-14's second
  pass — the gap-list review's `bar.untrusted_confidence_cap` is **not**
  seeded: AD-14 superseded it with the trust dampener, because a universal cap
  below the high tier flagged every Phase A mined whisper uncertain);
  `bar.stale_factor` = `0.9` (AD-14 at `6cff0ce`: one staleness factor for
  both fact classes, replacing the plan's former `bar.stale_index_factor` 0.8,
  whose product with the trust factor, 0.72, put every stale fact below the
  high tier — collapse-hunt H1); `bar.hazard_full_support` = `3` (AD-14 at
  `6cff0ce`: the support at which a miner landmine's evidence ratio reaches 1,
  its own row so re-tuning `bar.support_min` does not re-tier every Warning —
  collapse-hunt H10); `reuse.max_unresolved_import_share` = `0.05`;
  `miner.chunk_ms` = `50`.
- **New `architecture_default` lists:** `lexicon.fix_keywords` (`fix`,
  `fixes`, `fixed`, `fixing`, `bug`, `bugfix`, `hotfix` — AD-15, G1);
  `lexicon.test_path_patterns` (`**/*.test.*`, `**/*.spec.*`, `**/test_*.py`,
  `**/*_test.go`, `**/__tests__/**`, `test/**`, `tests/**` — AD-12, N13);
  `lexicon.test_same_dir_languages` (`go` — AD-12); `lexicon.entry_marker_stems`
  (`main`, `index`, `cli`, `app` — AD-12's path-convention markers; route
  registration is not a member, AD-12/N13).
- **New `plan_seed` scalar:** `index.entry_marker_points` = `1` — the score a
  file whose basename stem is a marker stem adds to its import in-degree
  (`entry_score = in-degree + points`); AD-12 names the markers but no
  weight. 1 is the skeleton's value and keeps a marker file with in-degree 0
  above zero, so Orientation's multiplicative rank can carry it (AC-1a's
  low-in-degree `main`/`cli` shape) without outranking a real hub; printed
  with every seed like the others.
- `T-12-1`'s literal pins grow by every new key above; `T-12-2` and `T-12-3`
  are new.

**Creates.** `src/stores/dao/tuning.ts` — tuning DAO + seeding + `tuningReader` + `checkTuningWrite`; `src/stores/dao/tuning_seeds.ts` — the single seed source (values + provenance) `seedDefaults` and the reader both read.

**Source.** `AD-5` (`tuning` is the writer-backed store for every tunable;
scalar = one row per key, list = one member per row); `AD-14` (bar defaults,
marked illustrative and calibrated on Phase A data); `AD-13` (miner
defaults); `AD-9` (deny-loop threshold; the tunable N and length floor);
`AD-15` (dominance k, fix_chatter k, the lexicons, the fix keywords);
`AD-12` (test-path patterns, same-directory languages, the unresolved-share
ceiling, the entry markers); `AD-14` (tier, trust and stale factors, caps,
the hazard full-support count, their ordering and the tier invariant); `AD-13`
(the half-life's re-mine notice); `AD-26` (`miner.chunk_ms`); `AD-20` (`tune`
as the writer and its refusal); gap-list review G1, G8, G17, G20, N10, N13;
plan-pass collapse-hunt H1, H2, H10.

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
re-running `seedDefaults` changes nothing), `T-12-2` (the reader's resolution order, re-seed, and
`tuning_missing`), `T-12-3` (the ordering validator, the tier invariant, the
stale-factor interval, the half-life guard, and the re-mine notice).

**Impact if wrong.** Contained — a missing row is re-seeded from
`tuning_seeds.ts` through the reader and surfaces as a `tuning_missing`
fault (Step 6's code; `detail` carries the key); caught by `T-12-1`.

---

### Step 13 — Co-change miner (AD-13)

```step-decl
step: S13
covers: [PA-1, PA-3]
files:
  create: [middleware/context-oracle/ctxoracle/src/miner/cochange.ts, middleware/context-oracle/ctxoracle/src/miner/labels.ts, middleware/context-oracle/ctxoracle/test/unit/miner.test.ts, middleware/context-oracle/ctxoracle/test/unit/miner_denominator.test.ts, middleware/context-oracle/ctxoracle/test/unit/miner_rewrite.test.ts, middleware/context-oracle/ctxoracle/test/unit/miner_landmines.test.ts, middleware/context-oracle/ctxoracle/test/unit/miner_chunks.test.ts, middleware/context-oracle/ctxoracle/test/unit/miner_chunks_worker.ts, middleware/context-oracle/ctxoracle/test/unit/miner_branches.test.ts, middleware/context-oracle/ctxoracle/test/unit/miner_git_env.test.ts]
  modify: [middleware/context-oracle/ctxoracle/test/fixtures/generate.ts, middleware/context-oracle/ctxoracle/src/index/indexer.ts, middleware/context-oracle/ctxoracle/src/util/spawn.ts, middleware/context-oracle/ctxoracle/src/stores/dao/files.ts]
  delete: []
provides: [mineCochange, parseNumstatZ, isRevertLabelled, isFixLabelled, files.repointStaleCommitProv]
tests: [T-13-1, T-13-1o, T-13-1p, T-13-2, T-13-2a, T-13-3, T-13-4, T-13-5, T-13-6, T-13-6d, T-13-6e]
depends_on: [S1, S3, S5, S9, S10, S11, S12]
```


**What changes.** Create `src/miner/cochange.ts` exposing
`mineCochange(store, repoPath, opts: {tuning: TuningReader; diagnosticsDir:
string; full?: boolean}): Promise<MineResult>` (`MineResult = {commitsSeen,
included, excluded, chunks, rewritten: boolean, pathsRejected}`), the pure
parser `parseNumstatZ(buf: Buffer): {commits: ParsedCommit[]; malformed:
MalformedRecord[]}` (G6: T-13-1 feeds it malformed records directly), and
`src/miner/labels.ts` with `isRevertLabelled(subject, body): boolean` and
`isFixLabelled(subject, fixKeywords): boolean`. Every threshold comes from
`opts.tuning` (G8; no literal fallbacks — N10); `opts.full` is the indexer's own
full flag, passed through unchanged (Step 14).

**One `HEAD` per pass (Step 13 build review m1).** The pass first resolves
`HEAD` to a hash once — `git rev-parse --verify -q HEAD` (no `HEAD`: the pass
writes nothing and returns a zero result, so the first commit triggers a full
pass — the builder's decision, which the review judged to hold) — and every later git call of the pass names that hash, written `<head>`
below, never the symbolic `HEAD`: the reference instant, the `merge-base`
check, the range count, the stream's `<range>`, and the final transaction's
`last_mined_commit`. *Why:* the detached reindex runs while the agent is
committing, so a symbolic `HEAD` can move between reads, and `ref_ts`, the
horizon count, the stream, and the watermark would each describe a different
commit (snapshot consistency; the review traced five symbolic reads).

The one stream is

`git log --no-show-signature --root --no-textconv --no-ext-diff --no-merges -M -z --numstat --reverse --format=%x1e%H%x00%at%x00%s%x00%b%x00 <range>`

*Why the first four flags (Step 13 build review S1):* `git log` is porcelain
and honours the user's own git configuration, which the child inherits; a
machine consumer pins every setting that changes the bytes it parses.
`log.showSignature = true` (git-config(1): as if `--show-signature` were
passed) writes signature-check text into stdout inside the `-z` stream — the
review executed it against the Step 13 build on a 5-commit signed repository:
`commitsSeen` 0, 35 `miner_unparsed_numstat` faults, and the watermark still
set to `HEAD`, so no later pass recovered the history; `log.showRoot = false`
drops the root commit's entries (executed there: a 2-commit pair read
`pair_count` 1). `--no-show-signature` and `--root` override those two;
`--no-textconv` keeps a repository's `.gitattributes` from running a user's
textconv program on every binary file; `--no-ext-diff` keeps a configured
external diff out of the stream. Executed here 2026-09-26 (§11.4): with
`log.showSignature = true` and `log.showRoot = false` in a repository's
config, the flagged stream is byte-identical (same `md5sum`) to the stream
of a run with neither setting. Every other git call of the pass that reads
history through `git log` carries `--no-show-signature` too — the reference
instant's `git log -1` printed `No signature` ahead of the timestamp under
the same config (executed, §11.4); `rev-list`, `merge-base`, and `rev-parse`
are plumbing and do not read `log.*` settings.

The stream runs through Step 5's `oracleSpawn` with its new options `stdout:
'pipe'` and `stderr: 'pipe'` (the options this step adds to
`src/util/spawn.ts`: stdin ignored, each named stream piped; each default
stays `'inherit'` — Step 13 builder preflight: an inherited stdout has no
pipe, `child.stdout` is `null`) and stdout consumed as `Buffer` chunks, so
the whole history is never one buffer in Node (no `maxBuffer` ceiling on a
large repository). **git's stderr (Step 13 build review m2)** is drained as
it arrives (an undrained pipe would stall git once its buffer fills),
keeping only its last 2 KB (2,048 bytes); a non-zero exit or a failed spawn
rejects the pass with an error whose message carries that tail, and any
fault recorded for the failure carries the same tail, escaped, as
`detail.stderr`. *Why:* an inherited stderr reaches nobody under the hook's
detached reindex (`stdio: 'ignore'`), and the rejection carried only the
exit code, so the reason a mine failed was lost. `<range>` is
`<watermark>..<head>` for an incremental pass and `<head>` for a full one.
**Stream layout** (executed on git 2.43.0 here 2026-09-26, §11.4, and
`probe:24_git_numstat_z` for the path cases): per commit, the NUL-delimited
fields `\x1e<hash>`, `<author ts>`, `<subject>`, `<body>` (possibly empty;
ending in `\n` when not), then **one empty field**, then the numstat entries,
of which the **first carries a leading `\n`** (strip exactly one). `<hash>` is
40 lower-case hex in a SHA-1 repository and 64 in a SHA-256 one (Step 13
build review M1; AD-15's trailer likewise; executed, §11.4: `git init
--object-format=sha256` writes 64-hex `%H`). Every path
field is raw bytes: with `-z` git never C-quotes a path, and a rename is an
entry `<added>\t<deleted>\t` with an empty path followed by the two raw
identity fields `<old>`, `<new>`, so a file literally named `a => b.txt` is one
field and never a rename. NUL is the only byte a pathname cannot hold, so the
parser splits on NUL only; a field is a commit header only when it is exactly
`\x1e` followed by exactly 40 or exactly 64 lower-case hex digits **at a
position where a header is expected** (after a commit's last entry, or at
stream start), and subject/body/path fields are
consumed positionally, never rescanned — so a path or body containing `0x1e`
is never taken for a header (`we<0x1e>ird.txt` is recorded whole). *Why 40 or
64 (M1):* a 40-only header matched nothing in a SHA-256 repository — the
review's 4-commit `--object-format=sha256` run mined 0 commits, wrote 28
faults, and set the watermark to `HEAD`. The **author timestamp** field must
match `/^[0-9]+$/` before it is read as a number (Step 13 build review m5:
`Number` accepts `''`, `' 12'`, `1e3`, `0x10`; git never writes those, and
the guard exists for format drift, so it is exact); a commit whose timestamp
field fails it is malformed. A leading field that is not a valid header, a
malformed timestamp, an entry lacking the `<added>\t<deleted>\t` shape, or a
rename marker missing its two identity fields makes its record malformed:
it contributes nothing, and the pass records **one** `miner_unparsed_numstat`
fault per malformed commit record — detail `{commit, records, first}`, with
`commit` the record's hash (`null` when no valid header precedes it),
`records` the number of malformed fields counted for it, and `first` the
escaped first 80 bytes of the first of them — never one per field: after a
malformed field where a header is expected, the parser stays silent until
the next valid header, counting what it skips into the same fault (Step 13
build review m3: the resync paths reported every subject, body, separator,
and entry of a bad record as its own fault). **The parser keeps a partial
field as a list of `Buffer` slices** and concatenates them once, when the
field's terminating NUL arrives, searching each new chunk for NUL with
`chunk.indexOf(0, from)` from where the last search stopped — so a field that
spans k chunks (a large commit body) costs O(n) in its length, not the O(k²)
of re-concatenating and re-scanning the partial field on every chunk (Step 13
build review m4). Each path is decoded by Step 5's
`decodePathBytes`; a rejected path is excluded from every count, counted, and
reported once per pass as `path_not_utf8` (writer `'miner'`); the commit's
`entity_count` still counts it (the exclusion threshold measures the commit as
git recorded it). The parser holds no message text beyond the entry it is
parsing; subject and body are read only by the two label functions and never
stored (AD-15, AD-19 pointer-only).

**Order and horizon.** `--reverse` makes the stream oldest-first, so a chunk's
watermark is always its newest commit and every commit at or before the
watermark is written (executed: `-n 2 --reverse` yields the last two commits,
oldest first). Before the stream, `git rev-list --count --no-merges <range>`
(through `oracleRunSync`) gives the range size — `--no-merges` so the count
matches the stream's positions (builder preflight); commits older than the newest
`miner.horizon_commits`, or with `ts < refTs − miner.horizon_years × 365.25 ×
86400`, are **horizon-excluded** (`exclude_reason = 'horizon'`). The
**reference instant** `refTs` is `<head>`'s committer timestamp (`git log -1
--no-show-signature --format=%ct <head>`, read before the full/incremental
decision below, which needs it), never the wall clock, so a fixture and a real repository
are judged the same way on any day; it is written to `schema_meta.ref_ts` in
the pass's final transaction and read by the handler once per event (G19).
Commits with `entity_count > miner.max_transaction_entities` are excluded
with `exclude_reason = 'size'`. **The horizon is judged per pass, over the
pass's range:** an incremental pass never ages out commits an earlier pass
included — the counts are not pruned (AD-13: "not recency pruning"; recency
acts through the weights) — and the next full mine applies the horizon to the
whole history afresh (builder preflight: this was unstated).

**Memory — a stated limit (Step 13 build review M5).** The pass holds one
aggregated record for **every commit of its range** — horizon-excluded ones
included, plus each horizon-included commit's decoded paths — until the
stream ends, and only then writes the chunks; memory therefore grows with
the range, not with `miner.horizon_commits`. Measured by the review on
Node 22: about 168 bytes per commit for a record with a 40-hex hash and no
paths (100,000 commits → 16.2 MiB; 1,300,000, a Linux-kernel-sized
non-merge history → 208.4 MiB, about 200 MiB). The review judged this
tolerable; it is recorded as a limit (§13 R16), not bounded here:
the plan's requirement is only that the history is never one buffer, which
holds. *Why stated:* the Step 13 implementation log claimed memory "bounded
by `miner.horizon_commits`" with no check behind it, and the review
measured it false.

**The skeleton caller.** The miner's only caller today is a skeleton module a
later step owns; its adaptation to this step's signature is the §9 row
"Step 13's skeleton caller", made in this step's build and retired by the
step that owns the caller (builder preflight: the new signature and the
`included` rename broke skeleton code Step 13 does not own).

**Per commit, in memory (outside any transaction — AD-26).** Every commit gets
a `commits` row. For a **horizon-included** commit (size-excluded or not),
`isRevertLabelled(subject, body)` — true when the body holds a line matching
`^This reverts commit ([0-9a-f]{40}|[0-9a-f]{64})\.$` (git-revert(1)'s default
message; 40 or 64 hex per AD-15 — Step 13 build review M1; executed, §11.4:
`git revert --no-edit` in a SHA-256 repository writes a 64-hex trailer), or,
as the fallback for a trailer-less message, the subject starts with `Revert "`
or `Reapply "` — adds one `labelled_touches` row `(file, hash, 'revert', ts)`
per touched file: revert detection runs **before** the size exclusion,
because that filter keeps refactor sweeps out of pair counts and a revert of a
large commit is still a revert (AD-15; review G1). For an **included** commit
only (after both exclusions), `isFixLabelled(subject, lexicon.fix_keywords)` —
the subject lower-cased and split on `/[^\p{L}\p{N}]+/u`, true when any token
equals a list member — adds `(file, hash, 'fix', ts)` rows; a revert-labelled
commit is **never** also fix-labelled (a revert of "fix X" has subject `Revert
"fix X"`, whose `fix` token would otherwise count the undo of a fix as fix
chatter — executed: git wrote exactly that subject here). *Why after the
exclusion for fixes:* AD-15 — a 200-file "fix lint" sweep would label 200
files as fix chatter (HERZIG, cited by FR-K2/FR-D3); whole-token matching
keeps `fixture`, `prefix`, `suffix` out (SZZ matches keywords as words). For
an included commit, each touched path's `files` row is found or created
(`files.ensureHistoryRow(path, isSuspect(path), hash)` — the injection flag
is set when *either* writer creates the row, AD-19; a chunk writes its
`commits` rows **before** its `ensureHistoryRow` calls, so a path's
first-naming commit is always "in `commits`" when checked), its `change_count` is
incremented by one and its `change_weight` by the commit's weight
`w = 2^((min(ts, refTs) − E) / (h × 86400))` (single-file commits included —
the same population as the pair counts, AD-13/G3), and every canonical-ordered
(`a < b` by file id) pair of the touched set is bumped with the commit's `ts`,
hash, and `w`. `h` is `bar.recency_half_life_days` and `E` is the store's
**weight epoch**, `schema_meta.weight_epoch` (epoch s), both as AD-13 fixes
them (Step 13 build review M3): every full pass's purge transaction writes
`E = refTs − 500 × h × 86400` — AD-13's `refTs − 500·h` days — and an
incremental pass keeps the stored `E`; `ts` is capped at `refTs` (a commit
cannot carry more recency than `<head>`). *Why the epoch (AD-13 at
`c31d87e`; Step 13 build review M3):* the former fixed epoch `T0` =
946684800 (2000-01-01) overflowed IEEE-754 on one far-future author date —
executed by the review against the Step 13 build: a commit dated 3237 read
both files' weights back as NULL at `h` = 365 — and `%at` is
author-controlled, untrusted repository content; with `ts ≤ refTs` and the
horizon bounding `ts` below, every exponent of a fresh mine lies in about
[450, 500], and re-basing changes no ratio because every term shares the
factor. *Why recency weights the evidence (AD-13 at `6cff0ce`; collapse-hunt
H1):* recency weights the evidence, never the
result — every term carries the same factor relative to any reference time,
so `pair_weight / change_weight` is the ratio decayed to `HEAD` with no
event-time work; a pairing that has always held keeps its ratio however old,
and one whose files have since changed apart loses weight to the recent solo
changes. The former rule multiplied the finished confidence by
`0.5^(age/h)`, which silenced every perfect pairing last co-changed more than
about 213 days before `HEAD` (0.9 × 2^(−213/365) = 0.60, the floor).

**Chunked writes (AD-26).** Accumulated rows are written in chunk
transactions: a chunk is committed as soon as its transaction has spent
`miner.chunk_ms` writing (measured with `performance.now()` inside the
transaction, checked after each commit's rows), and each chunk transaction
writes its commits, `labelled_touches`, `change_count` and `change_weight`
increments, and pair bumps **and** sets `schema_meta.last_mined_commit` to the chunk's newest
commit — so a crash never leaves the watermark ahead of its data. **A commit
already in `commits` is skipped** (`commits.exists`, checked as the stream is
aggregated), so a resumed pass never counts a commit twice, even on a
branching history whose side-branch commits were mined before the chunk's
last commit without being its ancestors. The landmine rebuild is one short
**final** transaction (below), which also sets `last_mined_commit` to the
`<head>` the pass mined to — including a merge `HEAD`, which `--no-merges`
never yields as a chunk's newest commit (AD-13; without it every history fact
on a merge-PR repository reads stale forever under AD-14) — but only when the
stream yielded every commit of the range (the completeness check under
**Final transaction**). No transaction
spans a `git` read. **Commit provenance after a purge:** a new DAO method this
step adds, `files.repointStaleCommitProv(id, hash): boolean`, sets an existing
row's `prov_ref` to `hash` when its `prov_kind = 'commit'` and its `prov_ref`
is not in `commits`, and returns whether it changed; the miner calls it after
each `ensureHistoryRow` (whose Step 9 contract — never change an existing row,
`T-9-1r15` — stays as it is; builder preflight: re-pointing inside
`ensureHistoryRow` would contradict that asserted test); the final transaction
sweeps (`files.sweepUnreferenced`) history-only rows no re-mined commit names
and no human-provenance record references (AD-13).

**Full mine, re-mine, and `mining_in_progress` — exactly two cases (expert
review S3).**
- *A full pass* happens when `opts.full` is true, when `last_mined_commit` is
  absent, when `schema_meta.mining_in_progress` is already `'1'` (a full pass
  that crashed — only a full pass ever sets the flag), when
  `schema_meta.mined_half_life_days` differs from `bar.recency_half_life_days`
  (the stored weights were mined under another half-life — AD-13's "changing
  `h` requires a re-mine"; absent counts as differing only when
  `last_mined_commit` exists), when **the weight epoch is out of range**
  (Step 13 build review M3; AD-13: a commit whose exponent `(ts − E)/h` would
  exceed 1000 makes the pass a purged full re-mine, which re-bases) — tested
  once, before the stream, as `(refTs − E) / (h × 86400) > 1000`, or
  `schema_meta.weight_epoch` absent while `last_mined_commit` exists — or on
  a history rewrite (below). *Why tested before the stream:* every `ts` is
  capped at `refTs`, so `(refTs − E)/(h × 86400)` is the largest exponent any
  commit of the pass can reach; testing it up front means no chunk is ever
  written under an epoch the pass would then abandon, and it re-mines no later
  than a per-commit test would. An absent epoch beside a watermark means the
  stored weights were mined under the former fixed 2000 epoch, which no
  incremental term can be added to (the same reasoning as an absent
  `mined_half_life_days`). **Every full
  pass starts with the purge transaction**: it deletes every `commits`,
  `cochange_pairs`, and `labelled_touches` row, resets every
  `files.change_count` and `change_weight` to 0, deletes the miner-kind
  landmines (`revert_chain`, `fix_chatter`; never `human_stated`), deletes
  `last_mined_commit`, writes `mined_half_life_days` = the current `h` and
  `weight_epoch` = `refTs − 500 × h × 86400` (AD-13; Step 13 build review M3),
  and sets `mining_in_progress = '1'` — on an empty store every delete is a no-op.
  It then mines `<head>` in chunks from the oldest included commit, and its
  final transaction clears the flag when the stream was complete (below).
- *An incremental pass* is every other pass, including the continuation of an
  incremental pass that crashed: its committed chunks advanced the watermark
  with their data (below), so it resumes from `<watermark>..<head>` and never
  sets the flag.

*Why:* every non-purging full pass re-reads commits whose counts are already
stored, and `cochange_pairs.bump` and `files.addChangeCount` are increments,
not idempotent writes — a crash continuation re-mined from `HEAD` over its
own committed chunks, or a second `index --full`, doubled every count, the
defect AD-13's purge set exists to prevent ("a re-mine over un-reset counts
doubled every `change_count`"). The indexer's full flag **reaches the miner**
(Step 14 passes it through), so ctxoracle index --full, `init` (Step 31,
idempotent on re-run), and the replay harness's store preparation (Step 28)
each purge and re-mine; the detached reindex the handler spawns runs `index`
without `--full` and is incremental. While `mining_in_progress` is `'1'` the
history genres produce no candidates (Step 18 reads
`EventContext.historyAvailable`). **History rewrite (G4, AD-13):** when the
watermark exists and `git merge-base --is-ancestor <watermark> <head>` exits 1
(not an ancestor) or 128 (unknown commit — the watermark object is gone), the
pass records `history_rewritten` (`{oldWatermark, newHead}`) and runs as a
full pass. *Why:* executed in the gap-list review, after `git commit --amend`
the skeleton's second mine doubled `pair_count` 4 → 8, kept the
rewritten-away commit, and wrote no fault; without `labelled_touches` in the
purge set a landmine rebuild would re-create a `revert_chain` citing a commit
that no longer exists (AD-13). Exit 0 from `merge-base` is the incremental
case.

**Final transaction.** Delete-and-rebuild the miner-kind landmines from
`labelled_touches` (`landmines.rebuildMinerKinds`): a `revert_chain` row for
every file with ≥ 2 distinct revert-labelled commits with `ts ≥ refTs −
horizon`, and a `fix_chatter` row for every file with ≥
`landmine.fix_chatter_k` distinct fix-labelled commits with `ts ≥ refTs −
landmine.fix_chatter_window_days × 86400`; key `(kind, file_id)`, `support` =
that count, `evidence` = the JSON array of the counted commit hashes, newest
first, provenance `commit`/`untrusted_repo` with `prov_ref` = the newest
counted hash (the first in `evidence` — deterministic, so two stores mined
from the same history agree, `T-13-3`), and `injection_suspect` = the
file row's path flag — so aged-out labels disappear and one file has one row
per kind whatever the number of passes (G5/N5; executed: two `fix_chatter`
rows, support 4 and 3, for one file under the skeleton). The same
transaction writes `schema_meta.ref_ts`, `schema_meta.corpus_floor_met` =
`'1'` when `commits.countIncluded() ≥ miner.corpus_floor_commits` else `'0'`
(N1 — the skeleton computed the floor and stored it nowhere, so a 4-commit
repository whispered), and clears `mining_in_progress` on a full pass. A crash
before the final transaction leaves the previous landmine rows, `ref_ts`, and
floor flag in place; the rebuild is derived and idempotent, so the next pass
repairs it.

**The completeness check (Step 13 build review M2).** The final transaction
sets `last_mined_commit = <head>` (and, on a full pass, clears
`mining_in_progress`) **only when the number of commits the stream yielded
equals `git rev-list --count --no-merges <range>`** — the count the pass
already takes for the horizon. A commit counts as yielded when the parser read
a well-formed record for it, including one then skipped as already mined; a
malformed record (above) is not. Otherwise the pass records one
`miner_unparsed_numstat` fault with detail `{expected, read}` (the range
count and the commits read), leaves `last_mined_commit` where the last chunk
put it (absent or unchanged when no chunk was written), and on a full pass
leaves `mining_in_progress = '1'`, so the history genres stay silent and the
next pass is again a purged full re-mine; the rest of the final transaction
(landmine rebuild, `ref_ts`, `corpus_floor_met`, sweep) still runs, since each
is derived from what is stored. *Why:* the invariant this step states — a
crash never leaves the watermark ahead of its data — holds for a pass whose
parse lost commits only if the final `HEAD` assignment is conditional; the
Step 13 build set it unconditionally, so under S1 (0 of 5 commits read) and
M1 (0 of 4) the store read fresh and mined while its history was empty, and
no later pass recovered it — faked machinery feeding the discovery data
Phase B reads (the review's phase-goal check). The guard also turns any
future stream drift into one visible fault with its counts.

**Fixtures built out in `test/fixtures/generate.ts` (G6):** `miner-hygiene`
(the scenario `T-13-1` states), `miner-denominator` (`T-13-2`), `miner-labels`
(`T-13-4`), `miner-large` (`T-13-5`, generated through `git fast-import` so
2,000 commits build in seconds), `corpus-floor-29` is already complete.

**Creates.** `src/miner/cochange.ts` — AD-13.

**Source.** `AD-13` (miner: git log stream, hygiene filters, canonical
pairs, `change_count` denominator, the recency weights `pair_weight` and
`change_weight` with the re-based weight epoch and `h`, chunked watermark,
the purge set, `mining_in_progress`, corpus floor); `AD-15` (the labels, the
40- or 64-hex revert trailer, the derivation from
`labelled_touches`, the per-pass rebuild); `AD-26` (chunks of
`miner.chunk_ms`, the final transaction); `AD-19` (path injection flag at row
creation; pointer-only evidence); `FR-K2` (hygiene); `FR-A6` (corpus floor, no
adoption window); gap-list review G1, G3, G4, G5, G6, G7, G8, G9, G19, N1,
N5, N10; Step 13 build review (`docs/reviews/2026-09-26-step-13-build-review.md`)
S1, M1–M5, m1–m5.

**Why this approach (Gate 3):**
1. **The decision.** Stream `git log` under `-z`, with every user setting that
   changes its bytes pinned by flag, and parse it on NUL (the only
   byte a pathname cannot hold), commit records marked by a `%x1e` header; hygiene
   as hard filters recorded in `commits.excluded`; corpus floor is evidentiary,
   not session-based; landmine mining is the two deterministic classes only.
2. **The authoritative standard.** `AD-13`; `AD-15`; `FR-K2` (spec-stated
   hygiene items with their own sources — MSR/HERZIG); Zimmermann et al.
   TSE 31(6) 2005 (ROSE) for the pair-count confidence model.
3. **Why this standard applies here.** Merge commits inject tangled changes
   (HERZIG); >30-entity transactions are refactor sweeps that dilute signal;
   the watermark keeps incremental refresh cheap; the two landmine classes
   are checkable and carry their evidence — anything subtler is Phase B/C. Zimmermann's support(A) is the number of transactions containing
   A, which only a per-file count can supply (a pair row cannot see a commit
   touching `a` alone). Oldest-first chunks are what make "the watermark is
   never ahead of its data" true under a crash.
4. **What this is NOT — and why.** Not per-commit transaction lists as the
   query model (unbounded storage, aggregation at lookup). Not
   association-rule mining at query time (hook-path budget). Not recency
   pruning (the spec chose horizon-cap; pruning deletes evidence). Not a
   recency multiplier on the finished confidence (it silenced stable
   couplings by age — AD-13, H1). Not a full re-mine without the purge (it
   doubled every count — S3). Not
   landmine mining via sentiment or ML (unmeasured machinery — AD-15). Not
   per-pair `a_count`/`b_count` (G3). Not one transaction per pass (414 ms of
   lock hold for 10,000 commits, measured by the architecture pass's expert
   review — it switched the answer-first block off during a refresh). Not
   newest-first chunks (a crash would leave older commits unmined behind an
   advanced watermark). Not substring keyword matching (`fixture`). Not
   storing commit messages (AD-19). Not a `git log` that trusts the user's
   configuration (`log.showSignature` emptied the mine — Step 13 build review
   S1). Not a watermark claimed at `HEAD` whatever the stream yielded (M2).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-13-1` (hygiene, pairs, raw paths, malformed records),
`T-13-2` (the `change_count` denominator), `T-13-3` (history-rewrite purge),
`T-13-4` (labels and the landmine rebuild), `T-13-5` (chunked commits: crash
safety of both pass kinds, a repeated full mine that does not double, and the
lock-hold bound), `T-13-6` (a merge `HEAD`, a resume on a branching history,
and the commit-provenance re-point and sweep), `T-13-1o` (a pass under
`log.showSignature` / `log.showRoot` config mines what a plain pass mines —
Step 13 build review S1), `T-13-1p` (a SHA-256 repository mines with no
faults — M1), `T-13-2a` (a year-3237 author date yields finite weights, and an
out-of-range epoch forces a purged full re-mine — M3), `T-13-6d` (an
incremental pass stopped and resumed counts every commit once — M4), and
`T-13-6e` (a stream that yields fewer commits than the range count leaves the
watermark short of `HEAD` with one `{expected, read}` fault — M2). `T-13-5(c)`'s `runIndex(…,
{full: true})` leg is written and run at Step 14, whose `runIndex` options it
needs (the Step 13 test writer recorded this in the test file).

**Impact if wrong.** Contained to history genres — a broken miner starves
Coupling, Consequence, Completeness, and Warning genres of evidence (they
stay silent, `FR-A6`).

---

### Step 14 — Structural indexer skeleton, LanguageFrontend interface, reindex claim

```step-decl
step: S14
covers: [PA-1, PA-3, PA-6]
files:
  create: [middleware/context-oracle/ctxoracle/src/index/indexer.ts, middleware/context-oracle/ctxoracle/src/index/frontend.ts, middleware/context-oracle/ctxoracle/src/index/zone.ts, middleware/context-oracle/ctxoracle/test/unit/indexer.test.ts, middleware/context-oracle/ctxoracle/test/unit/indexer_stale.test.ts, middleware/context-oracle/ctxoracle/src/index/search.ts, middleware/context-oracle/ctxoracle/src/index/walk.ts, middleware/context-oracle/ctxoracle/src/index/path_glob.ts, middleware/context-oracle/ctxoracle/src/identity/git_layout.ts, middleware/context-oracle/ctxoracle/test/unit/indexer_walk.test.ts, middleware/context-oracle/ctxoracle/test/unit/path_glob.test.ts, middleware/context-oracle/ctxoracle/test/unit/search_semantics.test.ts]
  modify: [middleware/context-oracle/ctxoracle/test/fixtures/generate.ts]
  delete: []
provides: [LanguageFrontend, ImportResolver, runIndex, resolveHead, refreshIfStale, tokenize, symbolSearch, pathSearch, walkRepository, matchesTestPattern, readGitPointer]
tests: [T-14-1, T-14-2, T-14-3, T-14-4, T-14-5]
depends_on: [S1, S3, S5, S9, S10, S11, S12, S13]
```


**What changes.** Create `src/index/frontend.ts` — the interface (G12, G13,
G14):
```ts
interface LanguageFrontend {
  readonly lang: string;                               // '*' for the generic frontend
  readonly capabilities: { symbols: boolean; imports: boolean };  // AD-12
  init(): Promise<void>;                               // awaited before any parse
  parse(path: string, content: Buffer):
    | { ok: true; symbols: SymbolRow[]; imports: CapturedImport[] }
    | { ok: false; error: string };                    // never throws
  resolve?(fromPath: string, specifier: string, repo: RepoFiles): ImportResolution;
}
type ImportResolution = { kind: 'resolved'; dst: string } | { kind: 'external' } | { kind: 'unresolved' };
interface RepoFiles { has(path: string): boolean; nearestPackageJsonDeps(fromPath: string): ReadonlySet<string>; }
```
A frontend whose `capabilities.imports` is `true` must provide `resolve`
(`ImportResolver`); one that is `false` returns no imports. `init` is
awaited once per frontend whose language occurs in the walked file set, so
grammar loading stays lazy per language present while `parse` stays
synchronous (review G14: web-tree-sitter's `Parser.init`/`Language.load`
return promises). A parse failure is a returned value, never a throw, so the
indexer — which holds the store — records `frontend_parse_failed` through
`recordFault(store, …)` and it appears in `status`.

Create `src/identity/git_layout.ts` — `readGitPointer(dir): {kind: 'dir',
gitDir} | {kind: 'file', gitDir, commonDir} | null`: `<dir>/.git` as a
directory, or a file whose `gitdir: <path>` line names the git directory
(relative paths joined to `dir`), whose `commondir` file, when present, names
the common directory relative to the git directory (executed on git 2.43.0:
a worktree's `commondir` reads `../..`, AD-23). Bounded file reads only.
`resolveHead` (below) and the handler's repository walk (Step 28) both use it.

Create `src/index/walk.ts` — `walkRepository(repoPath): {mode: 'git' |
'readdir'; paths: string[]; rejected: Buffer[]; ignoredTracked: Set<string>}`
(AD-12; review G11/N7). When `readGitPointer(repoPath)` is non-null: `git
ls-files -z --cached --others --exclude-standard` through `oracleRunSync`
(bytes), split by `splitNul` and decoded by `decodePathBytes` (rejects into
`rejected`); then the walked paths are piped as NUL-separated bytes to `git
check-ignore --no-index --stdin -z`, whose printed paths are the
**tracked-and-ignored** set (exit 1 means none — executed 2026-09-26: with
`.gitignore` = `dist/` and `*.gen.ts`, it printed the force-added `dist/a.js`
and the tracked `api.gen.ts` of three tracked files; AD-12 ER M4). Otherwise a
recursive `readdirSync(dir, {withFileTypes: true, encoding: 'buffer'})` walk,
skipping any directory named `.git` or `node_modules` (the fixed exclusion
AD-12 names), not following symlinks, decoding names with `decodePathBytes`;
`ignoredTracked` is empty there (no ignore file to consult). Paths are
repository-relative POSIX. `schema_meta.walk_mode` records the mode.

Create `src/index/path_glob.ts` — `matchesTestPattern(path, pattern):
boolean`, the in-house matcher AD-12 specifies: anchored at the repository
root over the POSIX path; `*` matches any characters within one segment, `**`
matches zero or more whole segments, `?` matches one character within a
segment; no braces, classes, or negation (Node's `path.matchesGlob` is
experimental on Node 22, AD-12 ER m3).

Create `src/index/search.ts` — the one search interface (AD-2, D-plan-28),
**one tokenizer, token-prefix semantics on both paths** (review N6; AD-2 at
`6cff0ce`; expert review M3, collapse-hunt H4):
- `tokenize(text): string[]` — AD-2's tokenizer, in the oracle's own code:
  `text.normalize('NFKD')`, then `toLowerCase()`, then every combining mark
  (`\p{M}`) removed, then a split on `/[^\p{L}\p{N}]+/u` with empty pieces
  dropped. AD-2 lists the operations (split, NFKD, drop marks, lowercase); the
  split runs last so a decomposed accent (`e` + U+0301) never splits a word,
  and the lowercase runs before the mark removal so a mark that lower-casing
  produces (`İ` → `i` + U+0307) is removed too. Every token therefore holds
  only letters and digits, and its ASCII bytes are `[a-z0-9]`.
- `symbolSearch(store, terms): SymbolHit[]` and `pathSearch(store, terms):
  PathHit[]`. Each term is passed through `tokenize`; each token is searched
  as a prefix; a term's hits are the intersection over its tokens, and a term
  with no token matches nothing. Under `fts_state = 'fts5'`: `MATCH` with each
  token as the quoted prefix query `"<token>"*` over `fts_symbols.tokens` /
  `fts_paths.tokens` (Step 7's `ascii` tables — a token holds no `"`, so input
  text cannot inject FTS syntax). Under `'fallback'`: the indexed range
  `token >= ? AND token < ? || char(0x10FFFF)` over `symbol_tokens` /
  `path_tokens`. The indexer writes, for every symbol and every file in both
  states, the same `tokenize` output — joined by a space into the FTS column
  under `'fts5'`, one row per distinct token into the fallback table always —
  so the two paths select the same rows **by construction**: the same token
  sets, the same prefix test.
Only `in_tree = 1` files are returned. Executed 2026-09-26 (§11.4): over
seventeen names including `CAFÉ`, `Über`, `foo-bar`, `my.method`,
`Foo::Bar`, `user_name`, `getUserName`, and `$store`, nineteen queries
returned identical symbol sets from the FTS table and the fallback table, and
the fallback's range query is `SEARCH … USING INDEX`.

Create `src/index/zone.ts` (zone classification per AD-12): a marker comment
in the head 2 KB (`@generated`, `DO NOT EDIT`, `Code generated … DO NOT
EDIT`), `dist/`/`build/`/lockfile path patterns, `vendor/`/`node_modules/`
path segments, and membership of `walkRepository`'s `ignoredTracked` set
(zone `generated`, evidence `tracked file matches an ignore pattern`); the
evidence string is redacted and injection-flagged at capture
(`zone_evidence_suspect`). **Every zone is parsed for symbols** (N9);
Orientation and
Reuse exclude non-`source` candidates by zone (Step 18), so a search still
learns "this is generated" from the zone flag rather than from silence.

Create `src/index/indexer.ts`:
- `runIndex(store, repoPath, {full, frontends, tuning, diagnosticsDir}):
  Promise<IndexResult>` (async — G14). In order: `walkRepository`; `stat`
  each listed path — a path whose stat fails (a tracked file deleted from the
  working tree still listed by `--cached`, executed AD-12 ER M3) is treated as
  absent; for each present file, resolve its language through
  `index.ext_to_grammar` (Step 12), pick the frontend whose `lang` matches or
  the generic one, and `await init()` once for each frontend actually needed;
  then per file: the byte cap is checked on the `stat` size before any read
  (> 1 MB → path-only), and the 20k-line cap during a bounded read that stops
  at line 20,001 (→ path-only); a path-only file records
  `index_path_only_oversize` (`{path, bytes, lines, cap}` — G15) and gets its
  `files` row, zone, and path tokens but no parse; otherwise
  incremental by `content_hash`: an unchanged `in_tree = 1` file is not
  re-parsed; a changed or new file is parsed, its content passed through
  `redact` (Step 11) before anything derived from it is stored, and its
  `symbols`, `import_edges`, FTS rows, `symbol_tokens`, `path_tokens`,
  `test_map` rows, and `unresolved_imports` rewritten. Each captured import specifier is resolved
  by the frontend's `resolve`: `resolved` → an `import_edges` row, `external`
  → nothing, `unresolved` → counted into `files.unresolved_imports` (AD-12,
  CH H4). Every `files` row the indexer creates or updates has `in_tree = 1`
  and its path's injection flag (`isSuspect(path)`, AD-19). A file absent
  from the walk or unstat-able is handled by `files.markAbsentExcept`: its
  `symbols` (and so their `symbol_tokens`), `import_edges`, `symbol_refs`,
  `test_map`, FTS, and `path_tokens` rows are deleted and `in_tree` set to 0,
  and the row is
  **kept** (AD-4) — never deleted while history references it;
  `files.sweepUnreferenced()` then removes `in_tree = 0` rows nothing
  references. **After every file is written:** `test_map` is rebuilt for
  changed test files — a file is a test file when `matchesTestPattern` holds
  for any `lexicon.test_path_patterns` member; its covered files are its
  `import_edges` targets that are not themselves test files (`source =
  'import_edge'`), or, for a language in `lexicon.test_same_dir_languages`,
  every non-test file of the same language in the same directory (`source =
  'same_dir'`; AD-12 ER M5 — an in-package Go test imports nothing);
  `region_glob` is the covered file's path (whole-file regions; `status`
  says so). `symbol_refs` is recomputed for every symbol of a file whose
  content changed or whose importer set or any importer's content changed:
  one row per (symbol, importing file other than the symbol's own) whose
  redacted text contains the symbol's name as a whole identifier
  (`(?<![\p{L}\p{N}_$])name(?![\p{L}\p{N}_$])`), `ref_count` = the
  occurrences; importers over the size cap are not read. `entry_score` is
  **assigned** for every `in_tree = 1` file as import in-degree +
  `index.entry_marker_points` when the basename's stem (text before the
  first `.`) is in `lexicon.entry_marker_stems` (`files.setEntryScore` writes
  only on change — N4: the skeleton added the in-degree on every pass, 1 → 2
  → 3 on an unchanged tree; route-registration patterns are not an input,
  AD-12/N13). Finally the per-language record: `schema_meta.lang_capabilities`
  = JSON `{<lang>: {frontend: 'tree-sitter' | 'generic' | 'path-only',
  symbols, imports, resolved, unresolved, files}}` over `in_tree = 1` files
  (`resolved` = the language's `import_edges` count), which Reuse reads in one
  row (AD-12: capabilities recorded per language and shown in `status`; the
  per-language unresolved share is `unresolved ÷ (resolved + unresolved)`,
  0 when both are 0). Rejected non-UTF-8 paths are reported once as
  `path_not_utf8` (writer `'indexer'`).
  **Transactions (AD-26):** per-file rows are written in chunk transactions of
  `miner.chunk_ms` writing time; the file's FTS, `symbol_tokens`, and
  `path_tokens` rows are in the same chunk as its relational rows; `schema_meta.index_head` (from
  `resolveHead`), `index_stale = '0'`, `lang_capabilities`, and `walk_mode`
  are written only in the final transaction, so a crashed pass leaves the old
  `index_head` and the staleness check re-triggers it. Then `mineCochange`
  (Step 13) runs with the same `tuning`, `diagnosticsDir`, and **`full`** —
  `runIndex`'s `full` reaches the miner, so a full index is a purged full
  re-mine (Step 13; expert review S3).
  Under `schema_meta.fts_state = 'fts5'` one `fts_paths` row per `files` row
  with `in_tree = 1` and one `fts_symbols` row per `symbols` row, each holding
  `tokenize(<path or name>)` joined by one space, deleted
  explicitly (`DELETE … WHERE file_id = ?`) before a file's rows are
  rewritten or when it leaves the tree — a virtual table is outside
  `ON DELETE CASCADE`'s reach; under `'fallback'` those tables do not exist.
- **Fixtures built out (G6):** `indexer-small` (the scenario `T-14-1`
  states), `indexer-walk` (`T-14-3`), `indexer-nongit` (`T-14-3`).
- `resolveHead(checkoutRoot): { commit: string } | { unresolved: string }`: the
  bounded reads AD-23 names, through `readGitPointer`, in order — `<checkoutRoot>/.git` (a directory, or
  a file whose `gitdir: <path>` line names the git directory, resolved
  relative to the repository — a linked worktree or a submodule); the
  common directory, `<gitdir>` or the path in `<gitdir>/commondir` when
  that file exists (a linked worktree keeps `HEAD` in its own gitdir and
  its refs in the common one); `<gitdir>/HEAD` — a 40- or 64-hex line is
  the commit (a detached `HEAD`), `ref: <refpath>` is looked up first as
  the loose file `<commondir>/<refpath>` and, when absent, in
  `<commondir>/packed-refs` by a line-by-line scan for `<hash> <refpath>`
  (one read bounded by the repository's ref count); a ref found nowhere
  (an unborn branch, a layout the resolver does not understand) is
  `{unresolved: <reason>}`. Every read is a bounded file read, never a
  subprocess (AD-23), and `runIndex` records `schema_meta.index_head`
  through this same function so the two sides compare like with like
  (D-plan-30).
- `refreshIfStale(store, checkoutRoot): { stale: boolean }`: compares
  `schema_meta.index_head` to the commit `resolveHead(checkoutRoot)` returns
  (for a worktree event the worktree's own `HEAD` — AD-23; the handler never
  spawns the reindex for a worktree event, Step 28); on a
  differing commit returns `{stale: true}` and, **only on the transition** —
  when `schema_meta.index_stale` is not already `'1'` — records the
  `index_stale` fault (AD-17's detector, through Step 10's writer) and writes
  `schema_meta.index_stale = '1'` (cleared to `'0'` by the next completed
  `runIndex`), so an index that stays stale for many events writes one fault
  and one `schema_meta` row, not one per event (expert review m3); on `{unresolved}` records the plan-named
  `head_unresolved` diagnostic (Step 6) with the reason and returns
  `{stale: false}` — an unreadable layout never spawns a reindex; it
  spawns nothing — the caller that owns a binary (the handler, Step 28)
  starts the detached reindex.
  `acquireReindexClaim(store)`: the mutual exclusion `runIndex` takes
  (D-plan-32; §4) — inside one `Store.transaction` (`BEGIN IMMEDIATE`,
  Step 3) it reads `schema_meta.reindex_owner_pid`, treats the claim as
  held only when that pid is alive (`process.kill(pid, 0)`; `EPERM` counts
  as alive), and when free or stale writes its own pid and
  `reindex_started_at` in the same transaction; SQLite's single writer
  makes the check and the write one step, so two reclaimers of one
  abandoned claim cannot both win (`probe:26_reindex_claim_row_race`,
  §11.4). A held claim makes the second index refuse with a
  `reindex_locked` diagnostic (Step 6); `runIndex` releases by deleting
  the row in a `finally`, on completion or failure. The handler never
  waits on the claim (staleness merely lowers confidence, `FR-K7`); it
  reads the row.

**Creates.** `src/index/indexer.ts` — orchestrator + reindex claim; `src/index/frontend.ts` — LanguageFrontend interface; `src/index/zone.ts` — zone classification + evidence.

**Source.** `AD-12` (indexer: LanguageFrontend with declared capabilities,
the git-listing/`readdir` walk, zone incl. the tracked-and-ignored signal,
`entry_score` without route patterns, `import_edges` with unresolved counts,
`symbol_refs`, `test_map` conventions, FTS5 tables, `in_tree`, incremental
refresh, size caps, detached refresh); `AD-2` (one in-house tokenizer for
both search paths, token-prefix fallback — as corrected at `6cff0ce`); `AD-4`
(`in_tree`, rows kept while referenced); `AD-19` (path flag); gap-list review
G2, G6, G7, G11, G13, G14, G15, N4, N6, N7, N9, N13; `AD-26`
(mutual exclusion for the detached reindex — its "directory lock" wording
corrected to the claim row in §4; the handler never waits); `AD-23` (the `HEAD`
resolution is bounded file reads — `.git`, `commondir`, `HEAD`, a loose ref
or one `packed-refs` scan — never a subprocess; D-plan-30).

**Why this approach (Gate 3):**
1. **The decision.** Interface-first so the tree-sitter frontend and the
   generic fallback are peers, with the frontend list an argument of
   `runIndex` — AD-12's configurable table as an explicit input
   (D-plan-29); incremental refresh via content-hash +
   `index_head`, with `HEAD` resolved in-process through the named reads
   and an unresolvable ref a diagnostic, never stale (D-plan-30);
   staleness lowers confidence, never blocks; the detached refresh is
   lock-protected and fire-and-forget; `runIndex` is also the FTS index's
   writer under `fts_state = 'fts5'`, so the relational and full-text
   sides of one file's index are written — and, on change or removal,
   deleted — inside the same function, never drifting out of step.
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
   prevent a generated file from blowing the indexer). Not a hand-rolled
   gitignore matcher (git's own listing is the reference implementation,
   AD-12). Not a git-only walk (it threw on a plain directory — G11/N7). Not
   hard-deleting a gone file (G2). Not `+=` on `entry_score` (N4). Not
   skipping non-source zones (N9). Not table membership as the capability
   (G13). Not `git rev-parse
   HEAD` on the event path (a subprocess outside AD-23's inventory). Not
   external-content FTS5 tables (`content=symbols`/`content=files`) synced
   by `AFTER INSERT/UPDATE/DELETE` triggers — SQLite's own documented
   pattern for keeping an FTS5 index consistent with a content table (the
   FTS5 documentation's "External Content Tables" section,
   `sqlite.org/fts5.html`, fetched 2026-09-08) — because whether a trigger
   declared on `symbols` also fires when `files`' `ON DELETE CASCADE`
   (AD-4) removes a row there is a SQLite recursive-trigger interaction
   this plan has not executed or verified; the standalone tables Step 7
   already declares carry no `content=` option, so the explicit write and
   explicit delete this step adds are what keep them consistent with the
   schema as declared.

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-14-3` (the walk, zones, `in_tree`, `test_map`
conventions, UTF-8 rejection, the oversize fault), `T-14-4` (the path-glob
dialect), `T-14-5` (the one tokenizer; search semantics agree under both FTS states, non-ASCII and separator-bearing names included), `T-14-1` (the skeleton runs on `indexer-small` and
`over-threshold-file` with an empty frontend list; every file has a
`files` row with its zone and FTS path tokens (one `fts_paths` row per
`files` row under `fts: true`) and no `symbols` or
`import_edges` row; the > 1 MB file is path-only with a diagnostic; the
planted secret is absent from the store; a second run over an unchanged
tree writes nothing; the claim refuses a second concurrent reindex, and two
real processes racing a stale claim yield exactly one owner), `T-14-2`
(`refreshIfStale`: a moved `HEAD` records `index_stale` once, sets the flag, and
returns `{stale: true}`, and an unmoved `HEAD` records nothing and returns
`{stale: false}`, on an ordinary checkout, with the branch ref packed, on a
detached `HEAD`, and in a linked worktree; an unborn branch records
`head_unresolved` and returns `{stale: false}`; a completed `runIndex`
clears the flag).

**Impact if wrong.** Contained per genre — a broken indexer starves
Orientation, Reuse, Coupling; visible in `status` per-genre counts.

---

### Step 15 — tree-sitter frontend + generic fallback

```step-decl
step: S15
covers: [PA-1, PA-3]
files:
  create: [middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts, middleware/context-oracle/ctxoracle/src/index/generic_frontend.ts, middleware/context-oracle/ctxoracle/src/index/frontends.ts, middleware/context-oracle/ctxoracle/test/unit/tree_sitter_frontend.test.ts, middleware/context-oracle/ctxoracle/test/unit/generic_frontend.test.ts, middleware/context-oracle/ctxoracle/test/unit/indexer_frontends.test.ts, middleware/context-oracle/ctxoracle/test/unit/tree_sitter_frontend_fallback.test.ts, middleware/context-oracle/ctxoracle/src/index/resolvers.ts, middleware/context-oracle/ctxoracle/test/unit/import_resolvers.test.ts, middleware/context-oracle/ctxoracle/test/unit/frontend_capabilities.test.ts]
  modify: [middleware/context-oracle/ctxoracle/test/fixtures/generate.ts]
  delete: []
provides: [treeSitterFrontend, genericFrontend, defaultFrontends, resolveTsImport, resolvePythonImport]
tests: [T-15-1, T-15-2, T-15-3, T-15-4, T-15-5, T-15-6]
depends_on: [S1, S14]
```


**What changes.** Create `src/index/tree_sitter_frontend.ts` exporting
`treeSitterFrontend(lang): LanguageFrontend`, which implements
`LanguageFrontend` by loading the grammar `tree-sitter-wasms/out/<lang>.wasm`
(the package's documented output directory, V14; path resolved with
`import.meta.resolve`), parsing via `web-tree-sitter`, extracting symbols
and imports via per-language tree-sitter queries. The default
`index.ext_to_grammar` table (seeded by Step 12) is: `.c`/`.h` → `c`;
`.cs` → `c_sharp`; `.cc`/`.cpp`/`.cxx`/`.hpp`/`.hh` → `cpp`; `.css` →
`css`; `.dart` → `dart`; `.el` → `elisp`; `.ex`/`.exs` → `elixir`;
`.erb`/`.ejs` → `embedded_template`; `.go` → `go`; `.html`/`.htm` →
`html`; `.java` → `java`; `.js`/`.mjs`/`.cjs`/`.jsx` → `javascript`;
`.json` → `json`; `.kt`/`.kts` → `kotlin`; `.lua` → `lua`; `.m`/`.mm` →
`objc`; `.ml`/`.mli` → `ocaml`; `.php` → `php`; `.py`/`.pyi` → `python`;
`.res`/`.resi` → `rescript`; `.rb` → `ruby`; `.rs` → `rust`;
`.scala`/`.sc` → `scala`; `.sol` → `solidity`; `.swift` → `swift`; `.rdl`
→ `systemrdl`; `.tla` → `tlaplus`; `.toml` → `toml`; `.tsx` → `tsx`;
`.ts`/`.mts`/`.cts` → `typescript`; `.vue` → `vue`; `.zig` → `zig` — the
32 grammars the pinned runtime loads and parses (§4,
`probe:20_grammar_inventory`). `elm`, `ql`, `yaml` and `bash` ship but
are excluded by executed cause (a language ABI below the runtime's
minimum; scanner imports the runtime never exports), so `.elm`, `.ql`,
`.yml`/`.yaml` and `.sh`/`.bash` take the generic frontend. A parse that
throws — a `TypeError` from an unresolved scanner import, a `RuntimeError`
from a trap — is caught whatever its class: the frontend discards that
parser instance (one that threw is dead afterwards, executed), indexes
the file through the generic frontend, and records `frontend_parse_failed`
(Step 6) with the language and path, visible in `status`'s per-language
counts. Grammar loading happens in `init()`, awaited only for languages
present in the walk (Step 14; G14), and is cached; parser instances are
pooled inside the indexer process only (AD-1: no cross-process state). Create
`src/index/generic_frontend.ts` exporting `genericFrontend: LanguageFrontend`
— line-based heuristics: identifier-shape
regexes for definitions (`function`, `class`, `def`, `fn`, shell function
syntax, …); like every `LanguageFrontend` it returns `{symbols, imports}`
only and writes no FTS row itself — the symbol names its regexes find are
the names `runIndex` (Step 14) tokenizes into `fts_symbols` and
`symbol_tokens` for a generic-frontend file, the same as for a tree-sitter
one.
**`import_edges` and
`symbol_refs` are NOT produced by the generic frontend** — that absence is
what makes a generic-frontend candidate structurally uncountable in the
Reuse dominance test (Step 18, L6) — the generic frontend declares
`imports: false`. Create `src/index/frontends.ts`
exporting `defaultFrontends(tuning: TuningReader): LanguageFrontend[]` — one
`treeSitterFrontend(lang)` per grammar the `index.ext_to_grammar` table
(Step 12) names, then `genericFrontend` last — the list the `index` verb
(Step 28) and `init` (Step 31) pass to `runIndex` (D-plan-29).

**Full build (2026-09-26 plan pass) — supersedes the sentences above where
they differ.**
- **Capabilities and queries (G13, AD-12).** Each `treeSitterFrontend(lang)`
  declares `{symbols, imports}` from what is actually written for its
  grammar: `typescript`, `tsx`, `javascript`, and `python` ship a
  definitions query **and** an imports query **and** a resolver
  (`imports: true`); every other grammar in the default table ships the
  definitions query the build writes for it (`symbols: true, imports: false`);
  a grammar for which no query is written is not given a tree-sitter
  frontend at all — its extension falls to the generic frontend (`symbols:
  true, imports: false`). The set of grammars with a written query is data in
  `tree_sitter_frontend.ts` (`QUERIES`), printed by `status` per language from
  `schema_meta.lang_capabilities`, so coverage is measured, not claimed; the
  skeleton shipped queries for four grammars and let the other 28 read as
  "covered" (review G13). `init()` calls `Parser.init()` once per process and
  `Language.load` for its grammar; `parse` returns `{ok: false, error}` on any
  throwable (the parser instance that threw is discarded and a fresh one is
  used next — executed §4), and the indexer falls back to the generic
  frontend and records `frontend_parse_failed` with the store (Step 14).
- **Resolvers (G12; `src/index/resolvers.ts`).** `resolveTsImport(fromPath,
  specifier, repo)` — TypeScript `moduleResolution: NodeNext` for relative
  specifiers (`./`, `../`): the written path if it exists; a `.js`/`.jsx`/
  `.mjs`/`.cjs` specifier also tries its source `.ts`/`.tsx`/`.mts`/`.cts`;
  an extensionless one tries `.ts`, `.tsx`, `.js`, `.jsx`, then `/index.` +
  those; first existing file wins → `resolved`. A bare specifier whose
  package name (`name` or `@scope/name`) is in the nearest `package.json`'s
  `dependencies`/`devDependencies`/`peerDependencies`/`optionalDependencies`,
  or that is a Node builtin (`node:`-prefixed or in `module.builtinModules`),
  → `external`; anything else (a `tsconfig` path alias such as `@/util`, an
  undeclared package) → `unresolved` — the external rule AD-12 requires each
  resolver to state. `resolvePythonImport(fromPath, specifier, repo)` — PEP
  328: a specifier with `n` leading dots resolves against the `n − 1`-th
  parent package of `fromPath`'s directory (`.mod` from `pkg/use.py` →
  `pkg/mod.py` or `pkg/mod/__init__.py`; `from . import mod` is captured as
  `.mod`); an absolute dotted name resolves against the repository root
  (`a.b` → `a/b.py` or `a/b/__init__.py`) → `resolved` when it exists,
  otherwise `external` (Python has no alias mechanism in the language; an
  absolute name outside the repository is the standard library or an
  installed distribution). A relative Python specifier that does not exist →
  `unresolved`. No resolver ever tries another language's extensions (the
  skeleton tried `.py` for TypeScript and `.ts` for Python — review G12;
  executed there, `from .mod import f` produced 0 edges).
- `defaultFrontends(tuning)` returns one `treeSitterFrontend(lang)` per grammar that
  has a query in `QUERIES` and appears in `index.ext_to_grammar` (read through
  the `TuningReader` it now takes — G8), then `genericFrontend` last.
- **Fixtures built out (G6):** `indexer-small` gains the `.py` package case
  (`pkg/use.py` with `from .mod import f` and `from . import mod`, beside
  `pkg/mod.py`) and a `.ts` file importing `./util.js` for a `util.ts`;
  `indexer-walk` carries the alias case (`import {h} from '@/util'` with no
  `@` package declared).

**Creates.** `src/index/resolvers.ts` — the per-language import resolvers (G12); `src/index/tree_sitter_frontend.ts` — WASM grammars; `src/index/generic_frontend.ts` — line-based fallback; `src/index/frontends.ts` — `defaultFrontends()`, the list the indexer's callers pass.

**Source.** `AD-12` (its coverage sentence read as corrected in §4; declared
capabilities; resolver external rules; unresolved counts); gap-list review
G12, G13, G14, N8; PEP 328; TypeScript NodeNext module resolution; V14 as
corrected in §4 (web-tree-sitter 0.25.10 and tree-sitter-wasms 0.1.13, pure
WASM, no install scripts, executed to load and parse — §11.4); L6.

**Why this approach (Gate 3):**
1. **The decision.** Tree-sitter frontend where a grammar exists; a
   deliberately weaker generic fallback for everything else so no language
   is invisible.
2. **The authoritative standard.** `AD-12` (architecture); the
   `web-tree-sitter` package API (`Parser.init`, `Language.load`,
   `parser.parse`, `Query`, executed at plan time against the pinned
   0.25.10 (`probe:20_grammar_inventory`) and re-checked at build — Step
   38's grammar-inventory check loads and parses every default-table
   grammar through it).
3. **Why this standard applies here.** The generic frontend's inability to
   produce `import_edges` is a property, not a gap — it forces the Reuse
   crown to abstain on incomparable sets (L6, AC-1b mixed-language case).
4. **What this is NOT — and why.** Not a native tree-sitter binding (would
   violate C-3). Not the TypeScript compiler API (single-language). Not a
   regex-only frontend as primary (false symbols poison pointers — P4).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-15-1` (TypeScript fixture: symbols with correct spans,
import edge resolving to the imported file), `T-15-2` (a `.sh` file:
function-shape symbols, zero `import_edges`), `T-15-4` (a parse that
throws falls back to the generic frontend with a `frontend_parse_failed`
fault and the exhausted parser instance is not reused), `T-15-3` (the indexer run
with `defaultFrontends()` on `indexer-small`: `symbols`, `import_edges`,
`symbol_refs`, `entry_score`, `test_map` populate; the FTS and fallback hit
sets agree for symbol and path token queries; `fts_symbols` holds one row per
`symbols` row under `fts: true`), `T-15-5` (the TypeScript and Python
resolvers' classification table), `T-15-6` (declared capability matches
behaviour for every default frontend).

**Impact if wrong.** Contained per language — a broken frontend falls back
to generic (visible in `status` per-language counts).

---

### Step 16 — The bar (AD-14 combinator)

```step-decl
step: S16
covers: [PA-1]
files:
  create: [middleware/context-oracle/ctxoracle/src/bar/combinator.ts, middleware/context-oracle/ctxoracle/test/unit/bar.test.ts, middleware/context-oracle/ctxoracle/test/unit/bar_tiers.test.ts, middleware/context-oracle/ctxoracle/test/unit/bar_recency.test.ts]
  modify: [middleware/context-oracle/ctxoracle/test/fixtures/generate.ts]
  delete: []
provides: [passesBar]
tests: [T-16-1, T-16-2, T-16-3]
depends_on: [S1, S12, S13, S14]
```


**What changes.** Create `src/bar/combinator.ts` exporting
`passesBar(candidate: Candidate, tuning: TuningReader, ctx: { indexStale:
boolean; historyStale: boolean }): { passes: boolean; failedAxis?:
'confidence' | 'impact' | 'marginal'; confidence: number; tier: 'high' |
'uncertain' }` (`ctx` comes from `EventContext`, Step 6; no `HEAD` read and no
clock read happen here, AD-23 — recency is already inside the mined weights,
so the bar needs no reference instant). The three axes are a **conjunction**
(no multiplication across axes). Every number is read from `tuning` (G8, N10).

*Confidence* `c` (AD-14 at `6cff0ce`), in this order:
1. **Evidence ratio.** A pair fact (Coupling, Consequence, Completeness):
   `candidate.weightedEvidence.num / candidate.weightedEvidence.den` =
   `pair_weight / change_weight(target)` — AD-13's recency-weighted
   confidence (never `pair_count / a_count`, G3; never the raw counts the
   headline shows). A miner-kind landmine (Warning): `min(1, support /
   bar.hazard_full_support)` — AD-14's hazard ratio on its own row, so a
   landmine with three or more supporting commits is as strong as a full
   pairing while a support-2 one reads weaker (AC-3a's below-floor hazard is
   delivered flagged). An index-derived structural fact (Orientation,
   Verification's mapping, Reuse) and a human fact: `1`.
2. **Dampeners** (multiply), per fact class against the data the fact came
   from (AD-14; collapse-hunt H1): `bar.stale_factor` for a `mined` fact when
   `ctx.historyStale` (`last_mined_commit` ≠ `HEAD`), and for a `structural`
   fact when `ctx.indexStale` (`index_head` ≠ `HEAD`) — FR-K7: staleness
   lowers confidence, never blocks; `bar.untrusted_trust_factor` when
   `candidate.trust = 'untrusted_repo'` (FR-X4: low trust lowers confidence).
   **No recency multiplier** — recency weights the evidence (AD-13), never the
   result. A human fact is never dampened (constant-high, FR-L6).
3. **Caps** (min over those that apply): `bar.suspect_confidence_cap` when
   `candidate.injectionSuspect`; `bar.heuristic_confidence_cap` when
   `candidate.heuristic` (a `symbol_refs` count).
The confidence axis passes when `c ≥ bar.confidence_floor` and, for a
candidate with non-null `support`, `support ≥ bar.support_min`. **Hazard
path** (`candidate.hazard`, Warning — FR-A5a): the confidence axis passes on
the noise floor alone, `support ≥ bar.noise_floor_support_min` (AD-14; the
labels are written only for horizon-included commits, so no hazard is sourced
solely from an excluded class). **Tier:** `high` when `c ≥
bar.high_confidence_min`, else `uncertain` — the composer's flag (Step 19)
reads only the tier; the number is stored on the audit row, never printed
(AD-14 display rule). Because the caps sit in [floor, high) and the trust and
stale factors satisfy AD-14's tier invariant (both enforced by Step 12's
`checkTuningWrite`), a suspect or heuristic fact that clears the floor is
always delivered, always flagged, and a perfect-evidence fact reaches the high
tier under every dampener at once (0.9 × 0.9 = 0.81 ≥ 0.8; AD-14; review G20
as revised; collapse-hunt H2).

*Decision-impact* — per-candidate properties only, no genre term and no
intent term (D-18): passes when `candidate.context = 'edit'`, or
`candidate.blastRadius ≥ bar.impact_read_min_coupled`, or `candidate.zone ∈
{generated, build_output}` (zone criticality, AD-14; G18c — the skeleton
never read `zone`). `context` is the handler's (Step 6), `blastRadius` the
generator helper's (Step 18) — never a genre literal (G18b: the skeleton's
Coupling set `blastRadius: 2`, so the read-context floor always passed).

*Marginal value* (AD-14's classes): a `human` fact passes; a `mined` fact
passes unless `candidate.obvious` (AC-1's same-directory same-stem pair); a
`structural` fact passes only when `crossFile && comparative` (Reuse's
dominance, Orientation's aggregation). A single-file history fact (Warning's
landmine) passes as `mined`, for AD-14's two reasons: it aggregates over
commits the agent has not enumerated — a revert-chain or fix-chatter label
comes from classifying commits, the same aggregation clause that admits a
Reuse dominance claim, not from one call the agent could make — and FR-A5a
requires a hazard to be spoken with its confidence, which a marginal axis that
failed it would forbid (collapse-hunt H9; D-plan-41).

**Fixture built out in `test/fixtures/generate.ts`:** `recency-weighting`,
the backdated-commit scenario `T-16-3` states (commit dates set through
`GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE`, relative to the fixture's `HEAD`, so
it holds on any calendar day).

**Creates.** `src/bar/combinator.ts` — AD-14.

**Source.** `AD-14` (the bar as conjunction of floors, no volume caps,
hazard bypass; the tier, trust dampener, suspect and heuristic caps and their
composition, the per-class staleness factor, the hazard full-support
count, and the tier invariant, as corrected at `6cff0ce`); `AD-13` (the
recency-weighted `pair_weight / change_weight` confidence); `FR-A5`,
`FR-A5a`, `FR-X4`, `FR-K7`; `OL-C1` (no volume/budget); `D-18` (no intent
term in impact); gap-list review G3, G18, G19, G20, N10; plan-pass
collapse-hunt H1, H2, H9, H10.

**Why this approach (Gate 3):**
1. **The decision.** Conjunction, not product; hazard bypass on the
   confidence floor only; floors from `tuning` so calibration is a `tune`
   operation, not a recompile.
2. **The authoritative standard.** `AD-14`; `FR-A5` (conjunction); `OL-C1`
   (no volume caps); ROSE via spec §9 for the confidence computation;
   `FR-X4` for the trust dampener.
3. **Why this standard applies here.** A multiplicative score launders a
   low axis (the 2026-08-16 collapse); the conjunction is what makes each
   axis a floor and each axis's failure visible.
4. **What this is NOT — and why.** Not a top-k selector (`OL-C1`). Not a
   learned bar in Phase A (`D-12`). Not a precision floor on hazards
   (`OL-C4`). Not a universal untrusted cap below the high tier (it flagged every Phase A
   mined whisper uncertain, erasing OL-C4's sure/uncertain split — AD-14
   second pass). Not a recency multiplier on the finished confidence (under
   the seeds it silenced every perfect pairing older than about 213 days —
   H1). Not index staleness applied to history facts (the mined history does
   not go stale when the index does — H1). Not a printed confidence number (it
   could contradict the evidence ratio the headline states).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-16-1` (conjunction, failed axis, hazard bypass,
per-class staleness), `T-16-2` (tier, trust dampener, caps, their
composition, the hazard full-support count, and the impact and marginal
inputs), `T-16-3` (recency weighting end to end: a perfect pairing five years
old stays above the floor; a pairing whose files have since changed apart
drops below it).

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
depends_on: [S1, S12, S14]
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
computation (Step 18). `SegmentClass = { head: string; class: 1 | 2 | 3;
targets: string[] }`: for a class-1 segment, `targets` are the arguments after
the matched runner head that contain a `/` or match a
`lexicon.test_path_patterns` member (Step 14's `matchesTestPattern`), each
normalized to a repository-relative path; an empty list means **unmappable ⇒
the run subtracts every covering test** (AD-15). The handler stores the
segments as `observed_actions.segments_json` (Step 7) on the Bash row.
Both lexicons are read by the caller from its `TuningReader` (G8).

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

**Verification.** `T-17-1` (single-segment positives per lexicon, and the
`targets` extraction), `T-17-2` (compound, quoted, subshell cases).

**Impact if wrong.** Contained to the Verification whisper — a
misclassification lands on the weak claim (safe under-detection).

---

### Step 18 — Genre modules (the seven Phase A generators) + done-claim recognizer

```step-decl
step: S18
covers: [PA-1]
files:
  create: [middleware/context-oracle/ctxoracle/src/genres/generator.ts, middleware/context-oracle/ctxoracle/src/genres/orientation.ts, middleware/context-oracle/ctxoracle/src/genres/coupling.ts, middleware/context-oracle/ctxoracle/src/genres/reuse.ts, middleware/context-oracle/ctxoracle/src/genres/consequence.ts, middleware/context-oracle/ctxoracle/src/genres/warning.ts, middleware/context-oracle/ctxoracle/src/genres/completeness.ts, middleware/context-oracle/ctxoracle/src/genres/verification.ts, middleware/context-oracle/ctxoracle/test/unit/genre_orientation.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_coupling.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_reuse.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_consequence.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_warning.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_completeness.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_verification.test.ts, middleware/context-oracle/ctxoracle/test/unit/done_claim_recognizer.test.ts, middleware/context-oracle/ctxoracle/test/unit/genre_common.test.ts]
  modify: [middleware/context-oracle/ctxoracle/test/fixtures/generate.ts]
  delete: []
provides: [Generator, blastRadiusOf, orientationGenerator, couplingGenerator, reuseGenerator, consequenceGenerator, warningGenerator, completenessGenerator, verificationGenerator, recognizeDoneClaim]
tests: [T-18-1, T-18-2, T-18-3, T-18-4, T-18-5, T-18-6, T-18-7, T-18-8, T-18-9, T-38-10, T-38-11, T-38-12, T-38-13, T-38-14, T-38-28, T-38-29]
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
  `symbolSearch`/`pathSearch` (Step 14's interface — FTS5 or the token-table
  fallback, unseen here), rank by (match strength × co-change hub degree
  × `entry_score`), select the top 2–4 entry-point files; join
  `invariant_members` for one binding invariant when one exists for a
  matched file (L10: invariants exist only via `note`). Marginal value:
  cross-file aggregative ranking.
- `coupling.ts` (FR-A2b, `PostToolUse` Read/Grep/Glob): `cochange_pairs`
  partners of the touched file; headline = partner + ratio + commit pointer.
- `reuse.ts` (FR-A2c, `PostToolUse` Grep/Glob): FTS-match the searched term
  against `symbols`, restricted to same-kind symbols; for each candidate
  read `symbol_refs.ref_count`; if any candidate's language declares
  `imports: false` or exceeds `reuse.max_unresolved_import_share` →
  **incomparable set, silence**; else the crown goes to
  the candidate whose count is ≥ `bar.reuse_dominance_k` × the runner-up's;
  headline = "of the N symbols matching this search, X is the one M files
  use; the runner-up has m", with the same-name/string false-positive
  caveat in the evidence and confidence capped (L6). A symbol in an
  `imports: true` language with an observed count of 0 stays comparable.
- `consequence.ts` (FR-A2d, `PreToolUse` Edit/Write): coupled test files of
  the target (`cochange_pairs` joined with `test_map`) + zone flag, worded
  about the file the edit targets; never a raw call-site count alone.
- `warning.ts` (FR-A2e, `PreToolUse` Edit/Write): `landmines` rows for the
  target with evidence, support, and its confidence flagged when not high (FR-A5a);
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

Each file exports its generator as a `Generator` value —
`orientationGenerator`, `couplingGenerator`, `reuseGenerator`,
`consequenceGenerator`, `warningGenerator`, `completenessGenerator`,
`verificationGenerator` — and `verification.ts` also exports
`recognizeDoneClaim(lastAssistantMessage, completionLexicon): boolean`;
these are the names the handler (Step 28) and the Stop-time line (Step 27)
call. Every candidate carries ≥ 1 verifiable pointer; the composer (Step
19) re-resolves it (rumor rule, FR-D1).

**Full build (2026-09-26 plan pass) — supersedes the per-genre bullets above
where they differ.** Create `src/genres/generator.ts`: the `Generator`
interface above; `blastRadiusOf(store, fileId, tuning)` = the number of the
file's partners whose confidence `pair_weight / change_weight(file) ≥
bar.confidence_floor` (AD-13's recency-weighted confidence — the same ratio
the bar reads), plus its `test_map` covering-test rows (G18b); and the
shared rules every generator applies:
- **History gate (N1, AD-13).** Coupling, Consequence, Completeness, and the
  miner kinds of Warning return nothing when `ctx.historyAvailable` is false
  (corpus floor not met, or a full mine in progress); a `human_stated`
  landmine still fires.
- **Verifiable pointers (AD-15, AD-19).** A file pointer is emitted only for a
  `files` row with `in_tree = 1`; a history fact whose partner or target is
  `in_tree = 0` is not emitted and is reported `ctx.recordDrop(genre,
  subjectKey, 'not_in_tree')`. Every path slot carries `ownTarget = (path ===
  ctx.targetPath)` so the composer never masks the agent's own tool target.
- **Zones (N9).** Orientation and Reuse consider only `zone = 'source'` files;
  the history genres consider every zone and state a non-source target's zone
  with a fixed literal (`(generated file)`, `(vendored file)`, `(build output)`).
- **Flags (G18d), declared in each module's header and pinned by its test:**
  Orientation `structural`, crossFile, comparative; Coupling `mined`,
  crossFile, not comparative, `obvious` = partner in the target's directory
  with the same stem (basename before the first `.`); Reuse `structural`,
  crossFile, comparative, `heuristic`; Consequence, Completeness `mined`,
  crossFile, never obvious; Warning `mined` (miner kinds, `hazard`) or
  `human`; Verification `structural`, crossFile, comparative (it aggregates
  the session's change set, the test map, and the observed runs — a set the
  agent has not enumerated, AD-14). `trust` is `'human'` only for a human
  fact; `injectionSuspect` is the OR of the named files' path flags and the
  landmine's `injection_suspect`.
- **Subject keys and incorporation (AD-16, G25).** Coupling
  `coupling:<min file id>:<max file id>` (canonical — a Read of A then a Read
  of B speaks once); Consequence `consequence:<target id>:<test id>`;
  Completeness `completeness:<edited id>:<missing id>` (directional);
  Warning `warning:<kind>:<target id>` for miner kinds and
  `warning:human:<landmine id>`; Reuse `reuse:<crowned symbol id>`;
  Verification `verification:<test id>:<changed id>`; Orientation
  `orientation:<sorted file ids joined by ,>`. `incorporatedBy` is `[]` for
  every history fact, Reuse, and Verification, and `['path:<p>' for each
  named file]` for Orientation.

Per genre (queries, emission rule, headline — every headline is `lit` words
and slots, Step 6; the composer's rendering is Step 19's):
- **Orientation** (`UserPromptSubmit`): prompt tokens = Step 14's
  `tokenize(promptText)` with tokens shorter than 3 characters dropped,
  deduplicated (the same tokenizer the index was built with — AD-2); each
  token through `symbolSearch` and `pathSearch`; a file's *match strength* = the
  number of distinct tokens matching its path or one of its symbols; *hub
  degree* = 1 + its partner count; score = match × hub × `entry_score`; files
  with `entry_score = 0` are not entry points. The top 4 by score (ties by
  path) are named when **at least 2** qualify, else silence. The binding
  invariant: the newest `invariants` row with a member among the named files
  (L10). `blastRadius` = the number of files named. `evidenceJson` records,
  per named file, `{fileId, inDegree, markerPoints, match, hub}` (the terms of
  its score), so the exit report can count entry points named by marker
  against those named by in-degree (Step 39; collapse-hunt H11). Headline: `lit('entry
  points for this prompt:')`, the path slots, and when an invariant exists
  `lit('— recorded invariant:')` + `slot.human(description)`. No landmine at
  the prompt (D-26).
- **Coupling** (`PostToolUse` Read/Grep/Glob, `outcome = 'ok'`): the touched
  files are `ctx.targetPath` for Read and `ctx.resultPaths` for Grep/Glob
  (G21 — a search's touched files are its results). One candidate per
  (touched T, partner P); `evidence = {num: pair_count, den:
  change_count(T)}` (the headline's raw counts), `weightedEvidence = {num:
  pair_weight, den: change_weight(T)}` (the bar's confidence, AD-13),
  `support = pair_count`, `lastTs = last_ts`, pointers T, P, `last_commit`. Headline: `[T] has changed with [P] in [num] of its last
  [den] changes; latest [commit]`.
- **Reuse** (`PostToolUse` Grep/Glob with a `searchTerm`): tokens as for
  Orientation; `symbolSearch` hits in `source`-zone, `in_tree = 1` files; the
  candidate set = the hits of the most frequent `kind` (ties by kind name).
  **Comparability (AD-15 as revised 2026-09-26):** every candidate's language
  must have `imports: true` in `schema_meta.lang_capabilities` **and** an
  unresolved share ≤ `reuse.max_unresolved_import_share`; otherwise silence
  (G13, CH H4). With ≥ 2 comparable candidates, counts `M` =
  `symbol_refs.refCount`; the top candidate X is crowned when `M_X ≥ 1` and
  `M_X ≥ bar.reuse_dominance_k × M_runner-up` (an observed-0 runner-up stays
  comparable). Headline: `of the [N] symbols matching this search, [X] ([path])
  is the one [M_X] files use; the runner-up [Y] has [M_Y]`, `evidenceJson.caveats
  = ['identifier_match']` always, plus `'mixed_language'` when
  `lang_capabilities` lists any language with `imports: false` and files > 0.
  `blastRadius = M_X`.
- **Consequence** (`PreToolUse` Edit/Write/NotebookEdit on
  `ctx.targetPath`): partners P of the target that are `test_map` test files;
  one candidate per P; evidence and pointers as Coupling. Headline, worded
  about **the file this edit targets** (AD-15, V20 — the model reads a
  `PreToolUse` whisper next to the tool result, which may be a denial or a
  failure, so "just edited" would be checkably false — L12): `[T], the file
  this edit targets, has historically changed with [P] in [num] of its last
  [den] changes; latest [commit]` + the zone literal when T is not `source`.
- **Warning** (same trigger): `landmines.forFile(target)`, human rows first.
  `revert_chain`: `⚠ [T], the file this edit targets, was reverted in
  [support] commits: [c1] [c2] [c3]` (the three newest evidence hashes);
  `fix_chatter`: `⚠ [T], the file this edit targets, had [support] fix commits
  in the last [days] days: …` where `[days]` is
  `landmine.fix_chatter_window_days` read from tuning (N10); `human_stated`: `⚠ [T], the file this edit targets —
  noted hazard: [human statement]`. `hazard = true`, `support` = the row's,
  `lastTs` = the newest evidence commit's `commits.ts`; `evidenceJson` records
  `{kind, support, changeCount}` with `changeCount` = the target's
  `files.change_count`, so the audit row carries the file's change count
  beside the landmine's support (AD-14; Limitations L13 — the ratio has no
  base-rate term, and the exit data measures whether one is needed).
- **Completeness** (`Stop`/`SubagentStop`): for each E in
  `ctx.observed.okEditedPaths()` (G22 — a failed Edit is not a change), each
  partner P not in
  that set: `you changed [E] but not [P], paired in [num] of its last [den]
  changes; latest [commit]`.
- **Verification** (`Stop` with a done-claim): changed = `okEditedPaths()`;
  covering tests = `test_map` rows whose `region_glob` is a changed path;
  subtract every test that a class-1 segment of any observed Bash row — of
  either outcome — ran (`targets` empty ⇒ all; else each test equal to or
  under a target); for each remaining test, one candidate: `[test] covers
  [changed]` + the run-state clause — AD-15's rule exactly: `; not run this
  session` when every observed Bash segment is class 1 or class 2 (or none
  ran) — each class-1 segment has already subtracted the tests it mapped, so
  a remaining test was run by no recognized runner and nothing unrecognized
  ran — else, when any segment is class 3, `; no recognized test run touched
  it (recognized runners: [list])`, the list rendered from
  `lexicon.command_class_test_runners`. Run-state never stands alone. (Expert
  review M6: a stricter "any runner ran ⇒ weak claim" rule had diverged from
  AD-15 with no stated reason.)
- **Fixtures built out (G6):** `orientation-mixed-shape`,
  `coupling-nonobvious`, `reuse-mixed-language`, `reuse-observed-zero`,
  `reuse-same-name-collision`, `reuse-alias-unresolved`,
  `consequence-coupled-tests`, `warning-landmine`,
  `completeness-paired-change`, `verification-covering-test` — each to the
  scenario its §12 test states, every history fixture with ≥
  `miner.corpus_floor_commits` included commits so the history gate is open
  (N1).

**Creates.** `src/genres/generator.ts` — the Generator interface and the shared rules; `src/genres/orientation.ts` — FR-A2a; `src/genres/coupling.ts` — FR-A2b; `src/genres/reuse.ts` — FR-A2c; `src/genres/consequence.ts` — FR-A2d; `src/genres/warning.ts` — FR-A2e (⚠, FR-A5a); `src/genres/completeness.ts` — FR-A2f; `src/genres/verification.ts` — FR-A2g + done-claim recognizer (D-38).

**Source.** `AD-15` (per-genre triggers, queries, headlines — "the file this
edit targets" — marginal-value guarantees; `in_tree` pointers; the revised
Reuse discriminator; the done-claim recognizer); `AD-16` (subject keys,
incorporation); `AD-13` (the history gate); `AD-4` (consumer filter);
`FR-A2a`–`FR-A2g`, `FR-D1`–`FR-D5`, `P5`, `D-26`, `D-38`; V20, L6, L10, L12;
gap-list review G6, G13, G18, G21, G22, G24, G25, N1, N9, N10 and the
`PreToolUse` item.

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
a store seeded from its fixture repo), `T-18-8` (done-claim recognizer),
`T-18-9` (the shared rules: history gate, `in_tree` drop, flags, subject
keys, `blastRadiusOf`);
acceptance replays `T-38-10`–`T-38-14`, `T-38-28`, `T-38-29` at Checkpoint 4.

**Impact if wrong.** Contained per genre; each per-AC replay pins its
headline.

---

### Step 19 — Compose: pointer-only whispers, rumor rule

```step-decl
step: S19
covers: [PA-1, PA-6]
files:
  create: [middleware/context-oracle/ctxoracle/src/hook/compose.ts, middleware/context-oracle/ctxoracle/test/unit/whisper_form.test.ts, middleware/context-oracle/ctxoracle/test/unit/compose_rumor_rule.test.ts, middleware/context-oracle/ctxoracle/test/conventions/headline_literals.test.ts]
  modify: []
  delete: []
provides: [compose]
tests: [T-19-1, T-19-2, T-19-3, T-38-19]
depends_on: [S1, S9, S11, S18]
```


**What changes.** Create `src/hook/compose.ts` exporting
`compose(candidate, {store, checkoutRoot, tier}): { text: string } | {
dropped: 'stale_pointer' | 'not_in_tree' | 'masked_path' }` (`tier` is Step
16's). **Rendering (AD-15, AD-19; review G24).** The text is exactly one line
(no `\n` — the fork reseed matches whole lines, AD-16):
`[oracle] <genre tag>: <headline>` then, in order, the caveat literals the
candidate's `evidenceJson.caveats` name (`identifier_match` → `(counts are
identifier matches: same-named symbols and matches in comments or strings
count)`; `mixed_language` → `(languages without import capture are not
compared)`), ` [confidence: uncertain]` when `tier = 'uncertain'`, and for a
Warning ` (fallible — correct it with ctxoracle correct)` (FR-D4). The
confidence number is never rendered (AD-14). The headline is rendered part by
part: a `Lit` as its text; `path` as the path, **unless** the file's `files`
row has `injection_suspect = 1` and the slot is not `ownTarget`, in which case
it renders `path#<fileId>` and is not a verifiable pointer (AD-19 — a
filename is repo-authored text; the agent's own target is never masked, its
name is already in the agent's context); `commit` as its first 12 hex
characters; `symbol` as the name when it matches `^[\p{L}_$][\p{L}\p{N}_$]*$`,
else `symbol#<symbolId>`; `count`, `days` as integers; `ratio` as `num of den`;
`human` as its (already redacted, Step 35) text with whitespace runs collapsed
to one space and cut at 200 characters with `…`. Nothing else reaches the
text, so verbatim repo prose is unrepresentable. Text
is informative, never imperative (FR-D2).

**Rumor rule (FR-D1, AD-15, AD-23).** Before rendering, each pointer is
re-resolved: a file pointer's `files` row must have `in_tree = 1` (else
`not_in_tree`) and the file must exist under `checkoutRoot` — the event's own
checkout, a worktree's root for a worktree event (AD-23) — with a span pointer
re-checked by a seek-and-read of the cited lines ± 2 (never a whole-file
read; skipped above the AD-12 cap), else `stale_pointer`; a commit pointer
must be in the store's `commits` table (never a `git` subprocess), else
`stale_pointer`. A candidate left with **no verifiable pointer** — no unmasked
in-tree path and no commit hash — is dropped with `masked_path` when masking
removed its last one, otherwise with the reason of its last failed pointer;
`compose` itself records nothing — it returns `{dropped: <reason>}`, and the
handler (Step 28, item 11) reports every returned drop through
`ctx.recordDrop` (→ `whisper_dropped_unverifiable`, AD-17), the same sink the
generators use (expert review m2: `compose`'s options carry no `recordDrop`).
A candidate with at least one
verifiable pointer is composed with its masked slots masked.

**Creates.** `src/hook/compose.ts` — whisper composer + rumor rule (AD-19, AD-15).

**Source.** `AD-19` (pointer-only composition; the filename rule and its
own-target exception); `AD-15` (the compose-time rumor rule, `in_tree`, the
masked-path drop and its counted reasons); `AD-14` (the flag, never the
number); `AD-16` (one line per whisper for the fork reseed); `AD-23` (bounded
re-resolution reads, against the event's checkout); `FR-D1`–`FR-D5`; review
G20, G24.

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

**Verification.** `T-19-1` (form validator per `FR-D1`–`FR-D5`, masking,
the flag), `T-19-2` (each drop reason); `T-19-3` (genre headline literals are
plain literals); acceptance replay `T-38-19`.

**Impact if wrong.** Direct owner-facing quality issue — a false-pointer
whisper is the checkably-false rumor `FR-D1` bars.

---

### Step 20 — Delivery: per-consumer dedup, session-boundary reconciliation, Stop-time channel

```step-decl
step: S20
covers: [PA-4]
files:
  create: [middleware/context-oracle/ctxoracle/src/hook/delivery.ts, middleware/context-oracle/ctxoracle/test/unit/delivery_dedup.test.ts, middleware/context-oracle/ctxoracle/test/unit/delivery_stop_channel.test.ts, middleware/context-oracle/ctxoracle/test/unit/delivery_reseed.test.ts]
  modify: []
  delete: []
provides: [perConsumerDedup, reconcileDedupOnSessionStart, updateReadSet, recordDelivered, StopDelivery, deliverStop]
tests: [T-20-1, T-20-2, T-20-3, T-38-17, T-38-20, T-38-21, T-38-23, T-38-34]
depends_on: [S1, S6, S9]
```


**What changes.** Create `src/hook/delivery.ts`:
- `perConsumerDedup(store, consumer, candidate): boolean` — withholds a
  candidate by the `delivered` set and its `incorporatedBy` keys (the full
  rule is the block below).
- `reconcileDedupOnSessionStart(store, consumer, source, reseed)` — per V5
  and `D-20`, on the event's own consumer only: `startup`/`clear` → both sets
  cleaned; `resume`/`fork` → both sets kept, or reseeded from the transcript
  when the consumer has none (below); `compact` → `read` cleared, `delivered`
  kept.
- `updateReadSet(store, consumer, ev)` — on an `outcome='ok'` observation
  adds `path:` keys to `read` (the tools are listed below).
- `recordDelivered(store, consumer, subjectKey)` — inside the audit write
  group (below).
- `deliverStop(whisperText, stopHookActive): StopDelivery` — returns the
  internal delivery object `{ context: string } | null` (`null` when
  `stopHookActive` is true — the single-cycle bound, V3); the adapter
  (Step 28) is the only module that turns it into the hook's
  `additionalContext` field, so this file names no hook field. The `null`
  branch is a defence only: the handler generates, audits, and marks
  delivered nothing at a `Stop`/`SubagentStop` whose `stop_hook_active` is
  true (Step 28, item 11), because text audited there would never reach the
  agent (expert review S2).

**Full build (2026-09-26 plan pass) — supersedes the bullets above where they
differ.** Every function takes the `ConsumerKey` of Step 6 and touches only
that consumer's rows (AD-4, AD-16; G23).
- `perConsumerDedup(store, consumer, candidate): boolean` — withholds when
  `candidate.subjectKey` is in the consumer's `delivered` set **or**
  `consumer_state.hasAny(consumer, 'read', candidate.incorporatedBy)` (AD-16's
  incorporation per fact, G25 — the skeleton's read set held `path:` keys and
  candidates carried `coupling:` keys, so the two never matched).
- `updateReadSet(store, consumer, ev: EventContext)` — on an `outcome = 'ok'`
  Read, Edit, Write, or NotebookEdit adds `path:<ctx.targetPath>`;
  on an `ok` Grep/Glob adds `path:<p>` for each of `ctx.resultPaths`.
- `recordDelivered(store, consumer, subjectKey)` — called by the handler
  **inside the same transaction as the `whisper_audit` append** (AD-26's
  audit-then-emit write group), before emission; an emission that then fails
  is the recorded `produced_but_undelivered` (AD-17), so a delivered row whose
  text never reached the agent is visible, never silent.
- `reconcileDedupOnSessionStart(store, consumer, source, reseed: {injectedLines:
  string[]; readKeys: string[]} | null): {reseeded: boolean; recovered:
  number; carriedOracleText: boolean}` — `startup`/`clear`: clear both of the
  consumer's sets; `compact`: clear `read`, keep `delivered`; `resume`/`fork`:
  when the consumer already has rows, keep both (a resumed session); when it
  has **none** — every `fork`, since a fork arrives under a new `session_id`
  whose `SessionStart` input names no parent (V22), and a `resume` of an
  unknown session — reseed from the forked transcript: each `injectedLines`
  entry is looked up with `whisper_audit.subjectKeyForText` (exact text) and
  a match's `subject_key` is added to `delivered`; unmatched lines are
  skipped; every `readKeys` entry is added to `read`. `recovered` = the
  delivered keys admitted; `carriedOracleText` = `injectedLines.length > 0`. The
  handler (Step 28) builds `reseed` with Step 21's reader and records
  `rebuild_recovered_nothing` with `detail_json.set = 'delivered'` when
  `reseeded && carriedOracleText && recovered === 0` (AD-16, AD-17; CH H2/ER
  M8). The safe direction is under-seeding — a fact may repeat, none is
  withheld.

**Creates.** `src/hook/delivery.ts` — per-consumer dedup + Stop-time additionalContext (AD-16).

**Source.** `AD-16` (delivery + dedup + incorporation per fact + canonical
subject keys + own-consumer session-boundary reconciliation + the fork
reseed + Stop-time `additionalContext`); `AD-26` (the audit-then-emit write
group); `FR-A4`, `FR-D5`, `FR-O6`, `FR-B4`, `D-20`; V3, V5, V22; review G23,
G25.

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

**Verification.** `T-20-1` (dedup, incorporation, and the five `source`
reconciliations per consumer), `T-20-2` (`deliverStop` with and without
`stop_hook_active`), `T-20-3` (the fork/resume reseed); acceptance replays
`T-38-17`, `T-38-20`, `T-38-21`, `T-38-23`, and `T-38-34` (the
`coupling-key-symmetry` fixture, Step 38).

**Impact if wrong.** Repeat whispers (annoying), missed dedup after a
session boundary (visible), a stop-cycle repeat (bounded by the harness's
8-continuation cap regardless).

---
### Step 21 — Transcript reader: JSONL tail, entry adapter, markers

```step-decl
step: S21
covers: [PA-2]
files:
  create: [middleware/context-oracle/ctxoracle/src/transcript/reader.ts, middleware/context-oracle/ctxoracle/src/transcript/locate.ts, middleware/context-oracle/ctxoracle/test/unit/reader.test.ts, middleware/context-oracle/ctxoracle/test/unit/reader_v12_counts.test.ts, middleware/context-oracle/ctxoracle/test/unit/reader_reseed.test.ts]
  modify: []
  delete: []
provides: [TranscriptReader, locateTranscript, projectTranscriptDir, oracleLines, successfulToolTargets]
tests: [T-21-1, T-21-2, T-21-3]
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

**Full build addition (2026-09-26 plan pass; AD-16's fork reseed, V22).**
`reader.ts` also exports two pure functions over parsed entries, both
tolerant of any shape they do not recognize (they skip it):
- `oracleLines(entries): string[]` — every string value anywhere in every
  entry (a recursive walk of the JSON), split on `\n`; for each line holding
  `[oracle] `, the substring from that marker to the line's end, trailing
  whitespace trimmed. Claude Code saves hook-injected text in the transcript
  (V22) but its entry shape is not documented and was not observed here (no
  hook on this machine emits `additionalContext` — §11.4), so the rule keys
  on the oracle's own one-line prefix (Step 19), not on a wrapper. Exactly
  one case of a failed recovery is loud: the transcript carries at least one
  `[oracle] ` line and none of them equals an audited text — the handler then
  records `rebuild_recovered_nothing` with `set = 'delivered'` (Step 20's
  `carriedOracleText && recovered === 0`). When no `[oracle] ` line is found
  at all — the likeliest result of a wrapper that splits or rewrites the text
  — nothing is recorded, because nothing tells the reader the forked session
  ever received a whisper; that silent case is §15's PG-6 (collapse-hunt H6).
- `successfulToolTargets(entries): {tool, pathRaw}[]` — pairs each assistant
  `tool_use` block (`id`, `name`, and its input's `file_path`/`notebook_path`)
  with the user entry's `tool_result` block of the same `tool_use_id`, and
  admits the pair **unless the result block carries `is_error: true`** — the
  observed layout marks failure, not success (V23 at `6cff0ce`: across 24
  local transcripts no successful Read (373), Edit (89), or Write (12) result
  carries an `is_error` field, `is_error: false` appears only on Bash results,
  and the one failed Read carries `is_error: true`). A `tool_use` with no
  paired `tool_result` is not admitted (its outcome is unknown). Tools
  admitted: Read, Edit, Write, NotebookEdit (Grep/Glob result paths are not
  recoverable from the transcript's `tool_result` text without the
  undocumented structured output, so a reseeded read set holds file targets
  only). The handler normalizes `pathRaw` against the checkout root into
  `path:` keys. *Why (the D-plan-39 collapse, plan-pass collapse-hunt P4):*
  the former rule admitted only `is_error: false`, which no successful file
  tool result carries, so the reseeded read set was always empty; AD-11's
  `transcript_layout_changed` detector is the guard if the layout changes.
These two functions name transcript layout fields, which is AD-11's reader's
job; they name no hook wire field (AD-6).

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
reproduced on a synthesized transcript), `T-21-3` (`oracleLines` and `successfulToolTargets`).

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
provides: [openQuestion, answerQuestions, voidQuestion, getOpenQuestions, expireOnStartup, advanceBookmark, getBookmark]
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
  'generic_text_all_prior', clearingOffset, clearingTs): number` — closes
  the open rows asked prior to the clearing turn: `asked_offset` below
  `clearingOffset`, or `asked_offset` null with `opened_at` ≤ `clearingTs`
  (an intake row whose turn the reader did not recognize); in steady state
  every open row precedes the newest turn, so this is AD-9's
  clear-all-prior; on a `resume`/`fork`/`compact` rebuild it leaves a
  question asked after the answer open (D-plan-27).
- `voidQuestion(store, questionId, 'intake_invalidated', denyFired:
  boolean)` — records in `closed_by_kind` and in the fault detail whether a
  deny had already fired on the row (so the `status` wrongful-deny surface
  can count the L11 transient case).
- `expireOnStartup(store, consumer)`, `advanceBookmark(store, consumer,
  offset, uuid)`, `getBookmark(store, consumer): {offset, uuid} | null`.

**Full build (2026-09-26 plan pass).** Every `consumer` parameter is Step 6's
`ConsumerKey` — one agent in one session (AD-4, AD-9; review G23/G29: the
role-keyed skeleton let a question opened in session `s1` deny an Edit in
session `OTHER`, and read session B's transcript from session A's byte
offset). `getBookmark` returns `null` when the consumer has no
`classify_state` row (every new session starts that way — G28). `expireOnStartup`
expires only that consumer's `open` rows. The read interface
(`getOpenQuestions(store, consumer)`) is otherwise unchanged — the Phase B
seam holds.

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
one `open` row and one `'already_open'`; re-open after `answered`); two sessions' consumer keys never see each other's rows).

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
- `recognizeClearing(assistantText, deferralStoplist, deferralFiller,
  lengthFloorChars): {clears: boolean; reason?: 'below_length_floor' |
  'deferral_only'}` — AD-9's two conditions, each a predicate on the turn,
  and nothing else. Strip tool-noise blocks and code fences. *Substance*:
  the remaining text, punctuation and whitespace aside, is at least
  `lengthFloorChars` characters (a "small floor", AD-9 — the seeded value
  2 rejects an empty or one-mark turn, and also holds a one-character
  direct answer such as "y", "n", or "7": the test is length-only, so a
  real one-character answer is indistinguishable from noise at this floor
  — a length-only test's accepted cost, escaped by one more character and
  counted by `deny_despite_answer_text`, D-plan-7). *Deferral*: a
  deferral-stoplist phrase (the "I'll get to that"-class phrases Step 12
  seeds — never a bare common word) is present, and every token outside
  the phrases belongs to the deferral-filler set (Step 12: the temporal
  adverbs, duration nouns, pronouns, and function words a deferral phrase
  licenses beside it without adding content). The turn clears when it has
  substance and is not a deferral; one that does not clear reports
  `deferral_only` when the deferral predicate held and `below_length_floor`
  otherwise. So "No.", "Yes, line 12.", and the one-word direct answers
  "Sure.", "Ok.", "Right.", "Understood." clear (FR-B5: the recognizer
  errs toward clearing — a direct answer is never held for being short); a
  causal answer that happens to contain the word "later" clears (it
  carries content tokens; no bare word is a phrase); a deferral beside an
  answer, in either order and in one sentence or two ("I'll get to that.
  The null check does not fix it, see line 12."; "No — the null check does
  not fix it, see line 12, though I'll get to the rest later."), clears on
  the answer's tokens; "I'll get to that.", "I'll get to that later.",
  "I'll come back to it.", "I'll get back to you on that.", "Before I
  answer, one sec." and an empty turn do not clear — the phrase plus
  nothing but filler is FR-B1's content-free deferral, with any number of
  filler words. A dodge dressed in content words ("Sure, I'll get to that
  after the refactor.") clears, and so does a deferral the stoplist does
  not recognize ("Later.", "Not now.", "One moment.") — the skeleton errs
  toward clearing, the exit report measures every deny escaped by a text
  turn (Step 39), and the human channel corrects the ones that matter
  (AD-9's deferral-false-match class) — never a vocabulary of
  acknowledgements or a clause grammar that would hold on an answer
  because of where it sat (D-plan-24; the rule is executed over the spec's
  examples, the direct answers, the reviewer-supplied deferral inputs, and
  the generated phrase × filler class, §11.4). The function takes no
  question text: it cannot match a turn to a specific question, which is
  the Phase B comprehension judgment (`AC-2a-ii`).
- `recognizeMove(toolName): boolean` — `true` exactly for `Write`, `Edit`,
  `NotebookEdit`; every other tool name is `false` (`D-39`: reads, searches,
  `Bash`, `Task`, MCP and web tools are never denied in Phase A).
The stoplists, the filler set, and the length floor are read from `tuning`
by the caller (Step 25) and passed in; the functions hold no configuration. (Unchanged by the 2026-09-26 passes: no gap-list item or architecture
change touches the three recognizers.)

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
  entry: `human` → reconcile first by `asked_uuid` (a turn a row already
  carries — a re-read on a `resume`/`fork`/`compact` rebuild — needs no
  open and no backfill), then against intake rows by `content_hash`
  (backfill `asked_uuid`/`asked_offset`), open a fresh row for a human
  question with no row (same recognizer), and void an intake row
  whose matching turn carries an affirmatively non-human marker
  (`voidQuestion(..., 'intake_invalidated', denyFired)` + fault);
  `assistant_text` → `recognizeClearing`; every classified turn is
  recorded (`classified_turns.record(consumer, uuid, ts, clears, reason)`,
  Step 9 — an upsert, so the rebuild's re-read updates the row; D-plan-27
  — the record AD-9's `deny_loop` and `deny_despite_answer_text` detectors
  read across events), and on `clears` `answerQuestions(store, consumer,
  entry.uuid, 'generic_text_all_prior', entry.offset, entry.ts)` — the
  rows asked prior to the turn; `skip` with `unknown_shape` →
  `unrecognized_user_entry` fault. The
  bookmark advances only over completed lines; if the deadline fires
  mid-read the handler records `catchup_incomplete` and the next event
  resumes (questions not yet discovered cannot deny; questions already open
  keep holding).
- `decideDeny(store, ctx: EventContext): DenyVerdict | null` (review G27 —
  the former `(store, consumer, toolName, toolInput)` could not write the
  audit row's required `session` and named `toolInput.file_path`, a wire
  field only the adapter may name, AD-6): `null` when `ctx.role !== 'main'`
  (`FR-O6`, AC-2a-i allow-half — the role derived from the consumer key,
  Step 6), when `getOpenQuestions(store, ctx.consumer)` is empty (only the
  event's own consumer's questions — a question in another session never
  denies, AD-9/G23), or when `recognizeMove(ctx.toolName)` is `false`;
  otherwise composes the reason "answer Max's question first: `<open question
  text(s)>`", appends the `kind='deny'` `whisper_audit` row (`session =
  ctx.session`, `consumer = ctx.consumer`, `genre = 'answer_drift'`,
  `subject_key` NULL, and
  `ctx.targetPath` in `evidence_json` — the bypass diagnostic's key, AD-9)
  in its own transaction (AD-26's deny write group) and returns the verdict
  for the adapter to render.

**Transactions (AD-26).** `intakeFromPrompt` writes all of one prompt's
question rows in one `store.transaction`; `catchUpTranscript` reads the
transcript slices outside any transaction (checking the deadline between
slices) and then writes the event's opens, backfills, voids, closes,
`classified_turns` records, and the bookmark advance in **one** transaction —
so the bookmark never advances past rows it did not write, and no write lock
is held during a transcript read. Every function takes the `ConsumerKey`.

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

**Source.** `AD-9` (state, recognizers, deny decision, main-consumer scope
derived from the per-session consumer key, intake voiding, lag-window hold on
the clear-axis, resumable catch-up); `AD-26` (the write groups); `AD-6` (no
wire field outside the adapter); review G21, G23, G27, G29;
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
rows; bookmark advances only over completed lines; the event's writes are
one transaction), `T-25-3` (`decideDeny`: open question + `Edit` → verdict
with audit row and target recorded; `Read`, `Bash`, `Task` → null; a subagent
consumer key → null; a question open in another session's consumer → null;
no open question → null —
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
provides: [checkDenyAfterAnswerLag, checkDenyLoop, checkDenyDespiteAnswerText, checkDenyBypassSuspect, pathWriteTarget]
tests: [T-26-1, T-38-6]
depends_on: [S1, S9, S23, S25]
```


**What changes.** Create `src/blocks/health.ts` exposing detectors the
handler calls after every deny emission and every catch-up:
- `checkDenyAfterAnswerLag(store, consumer, newlyRecordedTurns)` — over the
  turns this catch-up's `record` reported as new (a `resume`/`fork`/`compact`
  rebuild's re-read of an answer already recorded is not a newly classified
  answer, D-plan-27): when a clearing turn's transcript timestamp precedes
  an already-emitted deny for the consumer, record `deny_after_answer_lag`
  with both ids.
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
- `pathWriteTarget(command): string | null` — the **enumerated path-write
  predicate** as a standalone export: matches `command` against redirection
  `>`/`>>`, `tee`, `sed -i`, `perl -i`, and `cp`/`mv`/`install` to a path
  (AD-4's list, verbatim, no additions) and returns the written path, or
  `null` when nothing matches — the one place this pattern list is encoded,
  called both by `checkDenyBypassSuspect` below and by Step 28's handler at
  `observed_actions` append time (item 8).
- `checkDenyBypassSuspect(store, consumer, postToolUseBashRow)` — on an
  `outcome='ok'` Bash row whose `pathWriteTarget(row.command)` equals the
  target recorded in a same-turn `kind='deny'` row's `evidence_json`,
  record `deny_bypass_suspect`. The
  predicate's two error directions are stated where the number is shown
  (AD-9: "both directions stated in `status`"): `status` and the exit
  report print "bypass diagnostic: recognizes only <the list> — a bypass
  by any other shell write path is not counted (under-count); a shell
  write to the denied target that was not a bypass is counted
  (over-count); a proxy, not a measurement" (L3 owned as a class, not
  padded into a longer list).

**Creates.** `src/blocks/health.ts` — deny health detectors (AD-9, AD-17).

**Source.** `AD-9` (the four detectors and the bypass predicate's
over-/under-count disclosure); `AD-17` (each `FR-M2` class has a stable code
and a named detector); `FR-M2`, `FR-M4`; `AC-9`; L3.

**Why this approach (Gate 3):**
1. **The decision.** Every deny-mechanism error direction has a named
   detector; the bypass predicate is exactly the architecture's list, and
   both of its error directions are printed beside its count.
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
match; `status` text carries both error directions). Acceptance replay
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
provides: [handleSessionStart, outstandingQuestionLine]
tests: [T-27-1, T-27-2, T-38-7, T-38-8, T-38-9]
depends_on: [S1, S18, S22, S25]
```


**What changes.** In `answer_drift.ts` add `handleSessionStart(store,
diagnosticsDir, consumer, source)` per V5's enumeration, acting **only on the
event's own consumer's rows** (AD-9 — another session's rows may belong to a
live concurrent session; G23): `startup`/`clear`
→ `expireOnStartup` (this consumer's prior `open` rows → `expired`; a new
`session_id` has none), bookmark reset to offset 0 with `bookmark_uuid`
NULL (review G28: the schema's `bookmark_offset` is `NOT NULL DEFAULT 0`; the
former "reset to null" wording was unimplementable, and a new session simply
has no row); `resume`/`fork`/`compact` → bookmark reset to offset 0 so the next
catch-up rebuilds qa-state from the transcript; the rebuild re-reads turns
the store already holds, and every catch-up write is idempotent for a
repeated `(consumer, uuid)` — `classified_turns.record` upserts, a human
turn is matched by `asked_uuid` first, a clearing turn closes the rows
asked prior to it, and the lag detector reads only newly recorded turns
(Steps 9, 22, 25, 26; D-plan-27) — so a rebuild over a populated store
ends in the same state and raises no fault; when that rebuild scans a
non-empty transcript, recognizes zero human turns, and emitted
`unrecognized_user_entry` diagnostics, raise `rebuild_recovered_nothing`
with `detail_json.set = 'questions'` (L11(a)'s loud failure; AD-17 now
distinguishes it from the delivered-set reseed's `'delivered'`). A `fork`
arrives under a **new** `session_id` whose input names no parent (V22), so
its consumer key has no rows and its rebuild classifies the forked
transcript itself from offset 0; a `resume` whose `session_id` has no rows is
rebuilt the same way (AD-9). qa-state is untouched at `SessionEnd`.

Add `outstandingQuestionLine(store, consumer, doneClaimFired): {subjectKey:
string; text: string} | null` (`AC-8a`): at a `Stop` where
`recognizeDoneClaim` (Step 18) fired AND `getOpenQuestions` is non-empty,
return the **backstop candidate** — genre `answer_drift_backstop`,
`subjectKey = 'backstop:' + <the open question ids, sorted, joined by ','>`,
`text = '[oracle] still unanswered: "<q1>"; "<q2>"'` (each question's
text with whitespace runs collapsed to one space — one line; the only
verbatim text is Max's own question quoted back to the agent that already
has it, AD-19). It skips the bar and the rumor rule (it is the block's
backstop, not a repository fact, AD-9) but goes through dedup and
**audit-then-emit exactly like every whisper** (review N2 — executed, the
skeleton emitted `still unanswered: …` with no `whisper_audit` row, so an
intervention existed that the FR-X6 trail did not; AD-8, AD-19 "an unlogged
intervention does not exist"); the handler appends its text as the last line
of the Stop-time delivery — delivery, not a block. Add the `FR-M4` counter: a done-claim reached with a question
still `open`, or closed only by `generic_text_all_prior` within the final
`qa.done_claim_trailing_turns_k` assistant turns, is recorded in
`session_log.detail_json` (AD-9's labelled approximation, both error
directions stated in `status`).

**Creates.** Nothing new (this step modifies or verifies earlier artifacts).

**Source.** `AD-9` (question lifetime by `SessionStart.source`, own consumer
only, fork rebuild from the forked transcript;
`rebuild_recovered_nothing` with `set`; the Stop-time backstop and its
counter); `AD-8`/`AD-19` (audit before emit); `AC-8a`; `D-20`; V5, V22;
review G23, G28, N2.

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
   signal that makes "Max re-asks" reachable (FR-B4); a rebuild that
   collided with its own earlier writes would fail open on every event for
   the rest of the session (AD-7) — the silent dark the owner cannot see
   (`OL-10`).
4. **What this is NOT — and why.** Not a per-source silent policy (would
   hide `rebuild_recovered_nothing`). Not a Stop-time block (`FR-B4`).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-27-1` (the five `source` values on a seeded store and
two transcript fixtures, a second consumer's rows untouched;
`rebuild_recovered_nothing` with `set = 'questions'` on the marker-less
one), `T-27-2` (the backstop candidate appears only when both recognizers
fire, with its subject key and one-line text; the counter records the two
labelled cases). Acceptance replays `T-38-7`–`T-38-9`
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
  create: [middleware/context-oracle/ctxoracle/src/cli/hook.ts, middleware/context-oracle/ctxoracle/src/cli/index.ts, middleware/context-oracle/ctxoracle/src/cli/integrity_check.ts, middleware/context-oracle/ctxoracle/test/replay/integrity_check_verb.test.ts, middleware/context-oracle/ctxoracle/src/hook/adapter.ts, middleware/context-oracle/ctxoracle/src/hook/handler.ts, middleware/context-oracle/ctxoracle/test/replay/runner.ts, middleware/context-oracle/ctxoracle/test/replay/hook_stream_fixtures/, middleware/context-oracle/ctxoracle/test/replay/pipeline_order.test.ts, middleware/context-oracle/ctxoracle/test/conventions/hook_field_names_isolated.test.ts, middleware/context-oracle/ctxoracle/test/replay/fail_open.test.ts, middleware/context-oracle/ctxoracle/test/replay/produced_but_undelivered.test.ts, middleware/context-oracle/ctxoracle/test/replay/liveness_row.test.ts, middleware/context-oracle/ctxoracle/src/identity/repo_binding.ts, middleware/context-oracle/ctxoracle/test/unit/repo_binding.test.ts, middleware/context-oracle/ctxoracle/test/replay/repo_resolution.test.ts, middleware/context-oracle/ctxoracle/test/replay/error_mapping.test.ts, middleware/context-oracle/ctxoracle/test/replay/observation_row.test.ts, middleware/context-oracle/ctxoracle/test/replay/audit_groups.test.ts, middleware/context-oracle/ctxoracle/test/replay/fork_reseed.test.ts]
  modify: [.github/workflows/context-oracle-ctxoracle.yml, middleware/context-oracle/ctxoracle/src/cli/dispatch.ts, middleware/context-oracle/ctxoracle/test/fixtures/generate.ts]
  delete: [middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts]
provides: [ctxoracle-hook, hook-integrity-check, ctxoracle-index, toInternalEvent, toHookResponse, prepareStore, findRepoRoot, lookupBinding, recordBinding, deleteBindingsFor]
tests: [T-28-1, T-28-2, T-28-3, T-28-4, T-28-5, T-28-6, T-28-7, T-28-8, T-28-9, T-28-10, T-28-11]
depends_on: [S1, S3, S4, S5, S6, S7, S8, S9, S10, S12, S14, S15, S16, S17, S18, S19, S20, S21, S24, S25, S26, S27]
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
to `additionalContext`; no other module names a wire field. The adapter also
extracts the tool facts Step 6 names (review G21): `targetPathRaw` from
`tool_input.file_path` (Read, Edit, Write) or
`tool_input.notebook_path` (NotebookEdit) — never `tool_input.path`, which for
Grep/Glob is a search directory, not a target; `searchTerm` from
`tool_input.pattern` (Grep, Glob); `bashCommand` from `tool_input.command`;
and, for a Grep/Glob response, `resultPathsRaw` and `searchResultState`
(Step 6) by exactly three cases: (1) `tool_response.mode` is present and is
not `files_with_matches` (Grep's `content` and `count` modes, which return
`filenames: []` whatever matched) → `resultPathsRaw = []`,
`searchResultState = 'mode_unsupported'`; (2) otherwise, `tool_response.filenames`
is an array of strings (Glob, and Grep in its default `files_with_matches`
mode) → those paths, `'listed'`; (3) anything else → `[]`, `'unrecognized'`.
The handler copies a non-`listed` state into `detail_json.search_results` on
that event's session row, and `status` prints the two counts separately, so a
counted zero from a mode the oracle cannot read, and a response whose shape it
does not recognize, are each a visible zero, never a low floor (collapse-hunt
H3: an empty `filenames` array had counted as recognized, so every content-
or count-mode Grep was a silent zero). The Grep/Glob `tool_response` schema is
**not documented** ("the exact schema for both depends on the tool" — hooks
reference, fetched 2026-09-26); the field names come from the installed
Claude Code's own output schema (collapse-hunt P5, `strings` on 2.1.283) and
that the hook's `tool_response` is that object is unverified (§15, PG-7). The convention
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

Extend Step 1's `src/cli/dispatch.ts` — its `bin` entry stub
(`#!/usr/bin/env node`; a manual verb switch, no argument-parsing
dependency; the Step 1 stub registered no verbs and exited non-zero on
invocation) — registering, at this step, the
internal verbs `hook <event> [--deadline-ms <n>]` and `hook
integrity-check`, and the `index [--full]` verb — `hook <event>` routes to
`src/cli/hook.ts` → the handler: stdin JSON in, response JSON out, exit 0
always; `hook integrity-check` and `index [--full]` are described below.
Later steps register their verbs in the same switch, each declaring
the edit under `modify:`;
`--deadline-ms` overrides the watchdog deadline (Step 29) and exists for the
replay harness only — `init` never writes it, and no environment variable
can set it.

Create `test/replay/runner.ts` — the replay harness. For each replaying
test it creates a temp home and prepares the stores the handler will open,
`prepareStore(home, repoPath, {fts})`: `resolveRepoKey` (Step 5) on the
fixture repository the test names (`pristine-tree` when it names none);
`ensureLayout` (Step 4) for that key; `openStore` (Step 3) on the two paths
it returns and `probeFts5` (Step 3) on the project store for the flag;
`applyMigrations` (Step 7) on the project store with that flag and on the
global store (002, Step 8); `seedDefaults` (Step 12); then
`schema_meta.set('store_created_at', Date.now())` guarded by
`schema_meta.get` the same way Step 31 item 3 guards it; and
`runIndex(store, repoPath, {full: true, frontends: defaultFrontends(tuning),
tuning, diagnosticsDir})` (Steps 14, 15; `tuning` is a `tuningReader` over the
prepared global store) —
the store-preparing sequence `init` (Step 31) performs, minus its settings
write, so a replay at this step runs against the store `init` would have
created, built through the substrate's own functions and never through DDL
or rows of the harness's own (testing-standards: the schema comes from the
migrations; D-plan-5's `large-store`, Step 29, is built the same way). For
a store keyed on a path with no checkout behind it (Step 39's leg 1, an
absent `cwd`) the preparation takes the key directly (Step 5's rule-4
form) and skips the index. A test that needs another state — `T-28-3`'s
truncated store, `T-28-6`'s corrupted copy — derives it from the prepared
one. Then it reads a hook JSON stream from
`test/replay/hook_stream_fixtures/<name>.jsonl` (one file per replaying
test, authored with that test), spawns `node dist/src/cli/dispatch.js hook
<event>` per event with `CTXORACLE_HOME` pointed at that home and
`CTXORACLE_INTERNAL` unset, controls the transcript file the stream's
`transcript_path` names (appending entries between events when a test says
so), records each response, and exposes assertion helpers over responses,
stores, and diagnostics. With the preparation removed every Step 28 replay
is red, not vacuous: the handler finds no store, fails open (`T-28-3`'s
case), and writes none of the rows the replays assert — `T-28-1`'s
`questions` and `session_log` rows and its no-fault clause, `T-28-4`'s
audit row, `T-28-5`'s liveness row. From this step on, every
`test/replay/*.test.ts` a later step's Verification names is runnable at
that step, and this step adds `npm test -- --replay` to Step 1's `test` CI
job.

Create `src/identity/repo_binding.ts` (AD-20, AD-23; review G30, N15) —
`findRepoRoot(cwd): {root, checkoutRoot, isWorktree, visited: string[]} |
{root: null, visited}`: from `fs.realpathSync(cwd)` upward, one `stat` of
`<dir>/.git` per path component; the first hit ends the walk — a `.git`
directory gives `root = checkoutRoot = dir`; a `.git` file is read with Step
14's `readGitPointer`: when its git directory has a `commondir`, the root is
the parent of that common directory (the main repository) and
`checkoutRoot = dir`, `isWorktree = true`; without `commondir` (a submodule)
`root = dir`. `visited` lists every directory walked, nearest first.
`lookupBinding(global, found)`: `global_meta.get('repo_path:' + root)`; when
the walk found no `.git`, one lookup per `visited` directory, nearest first
(a path-keyed repository, AD-3 rule 3). `recordBinding(global, root, key)`
(Step 31's `init`, and the replay harness) and `deleteBindingsFor(global,
key)` (Step 32's `deinit --purge`). No `git` subprocess, no directory
creation (G30, N15).

Create `src/hook/handler.ts` — the per-event pipeline in AD-8's fixed order,
**as of the 2026-09-26 plan pass** (it supersedes the skeleton's order):
1. Guard (`CTXORACLE_INTERNAL` set → exit 0; Step 10's `isInternal`).
2. Watchdog start (Step 10's `createDeadline`).
3. Parse stdin JSON → `adapter.toInternalEvent`. A parse failure is recorded
   on the **home-level** channel (Step 4's `ensureHome`, then `recordFault(null,
   homeDiagnostics, …)`) as `handler_exception` (`errorClass` of the parse
   error) — the executed G35 case — and the handler exits 0 silent.
4. **Repository resolution** (AD-23): `findRepoRoot(ev.workingDir)`, open the
   global store with `openStore(globalPath, {mustExist: true})`, then
   `lookupBinding`. A miss (no binding, or no global store) → the fault
   `repo_not_bound` (`{cwd, root, reason: 'no_binding'}`) on the home-level
   channel **once per `session_id`**: the handler creates
   `<home>/diagnostics/repo_not_bound.<sha256Short(session)>.marker` with
   `fs.openSync(path, 'wx', 0o600)` and writes the fault only when that
   create succeeds (an existing marker, `EEXIST`, means already recorded —
   atomic across concurrent handlers); then exit 0 silent, **nothing else
   written** (no store, no project directory — N15). A hit opens the project
   store with `openStore(<home>/projects/<key>/store.db, {mustExist: true})`;
   `StoreMissing` → the same once-per-session `repo_not_bound` with `reason:
   'store_missing'` (a binding whose store was deleted outside the tool);
   `StoreUnreadable` from either open → the same once-per-session
   `repo_not_bound` with `reason: 'store_unreadable'` and Step 6's `{store,
   pathKind, errno}` (a store that exists but cannot be opened — a directory
   at the path, a permission — is never reported as deleted; collapse-hunt
   H8).
5. Build the `EventContext` (Step 6): `consumer = consumerKey(session,
   agentId)`, `role`, `repoRoot`, `checkoutRoot`, `isWorktree`, `repoKey`;
   `targetPath` = `ev.targetPathRaw` resolved against `ev.workingDir` when
   relative (the hooks reference states file-tool `tool_input` paths arrive
   absolute — fetched 2026-09-26, §11.4), then made relative to
   `checkoutRoot` with POSIX separators, `undefined` when outside it;
   `resultPaths` the same over `ev.resultPathsRaw` (G21/N3); `context` from
   the event (Step 6);
   one `schema_meta` read of `ref_ts`, `corpus_floor_met`,
   `mining_in_progress`, `index_head`, and `last_mined_commit` — the first
   three give `refTs` and `historyAvailable` (G19, N1); one `resolveHead(checkoutRoot)` (bounded
   file reads, AD-23) for the event checkout's `HEAD`, from which
   `indexStale = (index_head ≠ HEAD)` and `historyStale = (last_mined_commit
   ≠ HEAD)` — AD-14's per-class staleness; an `{unresolved}` `HEAD` makes both
   false (the same direction `refreshIfStale` takes). For a worktree event
   this compares the worktree's own `HEAD` with the main checkout's index and
   mined history (AD-23: they describe the main checkout); `tuning = tuningReader(global, key,
   onMissing → tuning_missing)` (G8); `observed` over this session and
   consumer; `recordDrop` → `recordFault(store, projectDiagnostics,
   {code: 'whisper_dropped_unverifiable', detail: {genre, subjectKey, reason}})`.
6. `SessionStart`: the **liveness row** (`session_log` `event_type =
   'liveness'`, `detail_json` = `{transcriptPath, transcriptBytes}` — AD-17's
   `hooks_not_firing` input); when `source ∈ {resume, fork}` and the consumer
   has no `consumer_state` rows, the reseed inputs are read from the
   transcript in bounded slices under the deadline (Step 21's
   `oracleLines`, `successfulToolTargets` normalized to `path:` keys; a
   deadline hit stops the read — under-seed — and records
   `catchup_incomplete` with `detail.set = 'delivered'`);
   `reconcileDedupOnSessionStart` (Step 20) and `rebuild_recovered_nothing`
   (`set: 'delivered'`) exactly when it reports `carriedOracleText` true and
   `recovered` 0 — at least one `[oracle] ` line was found and none matched
   an audited text; a transcript with no `[oracle] ` line records nothing
   (Step 21; §15 PG-6);
   `handleSessionStart` (Step 27); `refreshIfStale(store, checkoutRoot)` and,
   when stale **and not a worktree event** (AD-23: indexing another tree would
   overwrite the main checkout's index), the detached reindex child `<node>
   <dispatch.js> index` with `cwd = repoRoot` through Step 5's wrapper;
   the detached integrity child (`hook integrity-check`); no output.
7. Question intake (`UserPromptSubmit` only; Step 25).
8. Transcript catch-up (Step 25) + the health detectors on classified turns
   (Step 26).
9. Block check (`PreToolUse`, Step 25's `decideDeny(store, ctx)`): on a
   verdict → `adapter.toHookResponse({deny: verdict})`, exit 0.
10. `PostToolUse` / `PostToolUseFailure`: **one transaction** (AD-26's
    observation write group) appends the `observed_actions` row — `tool`,
    `path` (`ctx.targetPath`, or Step 26's `pathWriteTarget(bashCommand)` for
    a Bash row), `outcome` (`ok`/`failed` per V19), `command_class` and
    `segments_json` for a Bash row (Step 17), `seq` engine-assigned (N16) —
    and applies `updateReadSet` (Step 20). For an `ok`
    Edit/Write/NotebookEdit the **post-write content hash** is
    computed before that transaction (AD-23; review G32 — the regret proxy had
    no input): `stat` the target under `checkoutRoot`; above 1 MB store NULL
    and read nothing; otherwise one bounded read that stops and stores NULL on
    reaching line 20,001, else `sha256Hex` of the bytes. Then the bypass
    diagnostic (`checkDenyBypassSuspect`, Step 26).
11. **At a `Stop`/`SubagentStop` whose `stopHookActive` is true this item
    is skipped entirely**: no candidate is generated — no `recognizeDoneClaim`
    (so no FR-M4 counter entry either), no Completeness or Verification
    candidate, no backstop line — nothing is
    audited, nothing is marked delivered, and the session row (item 13)
    carries `detail_json.stop_hook_active = true`. The candidates wait for
    the next turn's `Stop`, and dedup stays honest. *Why (expert review S2):*
    a `Stop` whisper continues the conversation (hooks reference, "The
    conversation continues so Claude can act on it"), so every spoken `Stop`
    ends in a second `Stop` with `stop_hook_active: true`, where `deliverStop`
    returns `null`; a whisper audited and marked delivered there would be a
    logged intervention that never happened — withheld for the rest of the
    session and counted as `sent` by the fold. Otherwise: candidate generation
    (the Step 18 generators whose `triggerEvents`
    include this event, with `ctx`) → bar (`passesBar(candidate, ctx.tuning,
    ctx)`) → dedup (`perConsumerDedup`) → compose (`compose(candidate, {store,
    checkoutRoot, tier})`, each returned `{dropped}` reported through
    `ctx.recordDrop`) — all outside any transaction. At
    `Stop`/`SubagentStop`: `recognizeDoneClaim`, Completeness + Verification
    candidates, and `outstandingQuestionLine` (Step 27's backstop candidate,
    through dedup but not the bar). **Audit-then-emit:** for each surviving
    whisper, one transaction appends its `whisper_audit` row (`subject_key`,
    `confidence` from the bar, `genre`, `text`) **and** `recordDelivered`
    (AD-26's audit write group); a failed audit transaction emits nothing for
    that whisper (fail-open). The response text is the audited texts joined
    by `\n`; when writing it to stdout throws (`EPIPE`, serialization), each
    audited id is recorded as `produced_but_undelivered` and the handler exits
    0. At Stop the text goes through `deliverStop` (Step 20).
12. `SessionEnd`: finalize the session row (the fold and the regret pass are
    added to this branch by the later step that builds them, declaring the
    edit).
13. The session row (Step 10's `writeSessionEvent`). Exit 0 always (AD-7).
    **Error mapping (review G31):** `DeadlineExceeded` → `latency_breach`;
    `StoreBusy` → `store_busy` (AD-26 — the skeleton reported it as
    `store_corrupt`, and `store_busy` had no writer, N9); a SQLite error
    whose code is `SQLITE_CORRUPT` or `SQLITE_NOTADB` → `store_corrupt`;
    anything else → `handler_exception` (`{errorClass, message: redact(…),
    event}`). The fault goes to the project channel (and the store when it is
    healthy) once the repository is known, otherwise to the home-level
    channel. Empty output, no deny, no whisper. Nothing is written to stderr
    for the agent, and **no stderr warning suppression is built**: a hook that
    exits 0 has its stderr sent to the debug log only (V21; review G10 — does
    not hold as a hazard).

The replay harness's `prepareStore(home, repoPath, {fts})` (above) also calls
`recordBinding(global, fs.realpathSync(repoPath), key)` after `seedDefaults`, so the
handler finds every fixture store the way it finds an `init`-ed one; for a
leg-1 transcript whose `cwd` is absent (Step 39) it creates an empty
directory under the temp home, binds it to the path key, and rewrites the
replayed events' `cwd` to that directory.

**The skeleton end-to-end test is retired here.** Checkpoint 1R marked
`test/unit/skeleton_e2e.test.ts` `todo` (its generators return no candidates
at 1R, §9); this step's replays through the built binary cover every
property it checked — intake, a denied edit, the answer, the allowed edit, a
whisper, dedup — so this step deletes it (`delete:` above), which also
removes its `todo` mark.

**Fixtures built out (G6):** the replay streams under
`test/replay/hook_stream_fixtures/` for `T-28-7`–`T-28-11`; the repositories
they use are `indexer-small` (a subdirectory `cwd` and a `git worktree add`
checkout made at test time) and `repo-key-nongit` (the path-keyed walk).

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

**Creates.** `src/cli/hook.ts` — internal `hook <event> [--deadline-ms n]` verb (routes to handler); `src/cli/index.ts` — `index [--full]` verb → runIndex (Step 14) with Step 15's defaultFrontends(), the reindex child the handler spawns; `src/cli/integrity_check.ts` — internal `hook integrity-check` verb (off-path quick_check); `src/hook/adapter.ts` — the ONE file naming Claude Code hook fields (AD-6); `src/hook/handler.ts` — per-event pipeline (AD-7, AD-8); `test/replay/runner.ts` — replay harness (prepares each test's stores through the substrate's functions, then spawns the built handler through the CLI).

**Source.** `AD-6` (event map, adapter file, `PostToolUseFailure`
observation-only); `AD-7` (fail-open, exit 0 always, no stderr suppression —
V21); `AD-8` (pipeline order load-bearing); `AD-23` (repository resolution by
walk and binding, worktrees, the post-write hash, no layout creation);
`AD-17` (the home-level channel, `repo_not_bound` once per session); `AD-26`
(the handler's write groups); `AD-16` (reseed); `AD-4` (the consumer key and
filter on `observed_actions`); `AD-14` (per-class staleness inputs); V1–V6,
V15, V16, V19–V23; review G10, G19, G21, G23/G29, G30, G31, G32, G35, N2, N3,
N15, N16; plan-pass reviews S2, H1, H3, H6, H8.

**Why this approach (Gate 3):**
1. **The decision.** One adapter file; fixed pipeline order; exit 0 always;
   adapter output is the internal event type — all downstream code names
   internal fields only. The CLI `bin` entry is Step 1's
   `src/cli/dispatch.ts` stub, extended here with this step's verbs and
   declared under `modify:`, not re-created — its creation is Step 1's
   packaging decision (AD-25), and Steps 31–35 extend the same switch.
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
clearing answer at `PreToolUse` time yields no deny and a `questions` row
closed by that answer's uuid at that event — catch-up ran before the block
check), `T-28-2` (adapter isolation convention), `T-28-3` (replay:
forced store-open failure, parse failure, and a corrupted store each yield
exit 0, empty stdout, a JSONL fault), `T-28-4` (replay: audit row written,
stdout closed → `produced_but_undelivered` recorded, exit 0), `T-28-5` (the
liveness row is written at `SessionStart` with the transcript path and
size), `T-28-6` (`hook integrity-check` records `store_corrupt` on a
truncated store and nothing on a healthy one), `T-28-7` (repository
resolution: subdirectory, worktree, path-keyed, miss), `T-28-8` (error
mapping), `T-28-9` (the observation row: normalized target, post-write hash,
`seq`), `T-28-10` (audit groups: whisper + delivered in one transaction,
the backstop audited, nothing audited or delivered at a continuation `Stop`),
`T-28-11` (the fork reseed through the handler); `T-28-7`'s function-level
half lives in `test/unit/repo_binding.test.ts`, its replay half in
`test/replay/repo_resolution.test.ts`. **Checkpoint 3** runs here: every function-level test of Steps
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
before the audit write — and, since the 2026-09-26 pass, after the repository
walk and before the post-write hash read, the two event-path reads AD-23's
inventory added); `ms` is the wired default or the `--deadline-ms`
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
  create: [middleware/context-oracle/ctxoracle/src/diag/regret.ts, middleware/context-oracle/ctxoracle/src/diag/whisper_stats_fold.ts, middleware/context-oracle/ctxoracle/test/replay/regret_proxy.test.ts, middleware/context-oracle/ctxoracle/test/unit/whisper_stats_fold.test.ts, middleware/context-oracle/ctxoracle/test/unit/whisper_stats_attribution.test.ts]
  modify: [middleware/context-oracle/ctxoracle/src/hook/handler.ts, middleware/context-oracle/ctxoracle/src/index/indexer.ts, middleware/context-oracle/ctxoracle/test/fixtures/generate.ts]
  delete: []
provides: [foldWhisperStats, recordRegret]
tests: [T-30-1, T-30-2, T-30-3]
depends_on: [S1, S9, S14, S28]
```


**What changes.** Create `src/diag/whisper_stats_fold.ts` exporting
`foldWhisperStats({project, global}, repoKey): {folded: number}` — AD-5's
fold as revised 2026-09-26 (review G33/N11; the architecture pass's CH H8 /
ER M6, M7), in two steps:
1. **Fold** — one `BEGIN IMMEDIATE` transaction on the **project** store
   (AD-26): read `schema_meta.fold_watermark_audit` (`wa`) and
   `fold_watermark_corrections` (`wc`), `'0'` when absent; aggregate the
   `whisper_audit` rows with `kind = 'whisper'` and `seq > wa` as `sent` per
   `genre`; aggregate the `corrections` rows with `seq > wc` per genre —
   `whisper_id` → that whisper row's `genre`; `deny_id` → that deny row's
   `genre` (`decideDeny` writes `genre = 'answer_drift'`, Step 25); neither →
   `corrections.genre` (the `--genre` value, or `'answer_drift'` for a
   `--missed-question` correction, Step 34), else `'unattributed'` — never
   `answer_drift` by default (AD-5, AD-18; CH C4); `false_fire` counts into
   `corrected_false`, `missed` into `corrected_missed`, `confirm` into neither;
   append one `stats_folds` row per genre with any non-zero count, carrying
   `audit_from = wa`, `audit_to` = the largest audit `seq` read (or `wa`),
   `corrections_from = wc`, `corrections_to` likewise; advance both
   watermarks to those values in the same transaction. Nothing new → no row,
   no change. `seq` is assigned under the single write lock, so a row a
   concurrent handler commits after this read has a larger `seq` and is
   folded next time (the skeleton's `ts > watermark AND ts <= now` could skip
   it forever).
2. **Publish** — one transaction on the **global** store:
   `whisper_stats.replaceForProject(repoKey, stats_folds.totals(), now)`.
   Replacing is idempotent: publishing twice, after an import, or after a
   purge cannot count a row twice; a crash between the steps leaves the
   replica one fold behind until the next publish (AD-26).
Run points: `SessionEnd` — this step adds the call to the handler's
`SessionEnd` branch (`src/hook/handler.ts`, Step 28; declared under
`modify:`) — the `correct` verb (Step 34), and `import` (Step 32, publish
after the store is replaced); never on tool events. `status`'s per-genre
trend reads `stats_folds.all()`; the global row is the total (AD-5).

Create `src/diag/regret.ts` exporting `recordRegret(store, session?)`: the
population is every **store-held fact** — `cochange_pairs` rows,
`landmines`, `human_facts`, and `invariant_members` — whose subject file or
direct pair partner was **re-edited** — a second `outcome='ok'` Edit/Write
row on the same path in the session after the first (for a pair fact: an
edit of the partner after an edit of the subject) — or **reverted**, or
whose covering test failed (`outcome='failed'` `command_class`-1 rows),
minus the facts `whisper_audit.deliveredSubjects(session)` shows were
spoken — now subject keys (Step 9): a pair `(a, b)` was spoken when any of
`coupling:a:b`, `consequence:a:b`, `consequence:b:a`, `completeness:a:b`,
`completeness:b:a` was delivered; a landmine when `warning:<kind>:<file>` or
`warning:human:<id>` was; an invariant when a delivered `orientation:` key
names one of its member files (FR-L4: "below-bar, **or never triggered**" — a fact no generator
ever produced a candidate for is in the population; AD-18's relevance test
is the subject / direct-partner bound). A regret row names the fact, the
churn, and whether a candidate existed (`held_below_bar`, `held_dedup`,
`never_triggered`) so `status` can show the split. AD-18 names two run
points — "at `SessionEnd` (and at index refresh)" — and this step wires
both, each with its own **reverted** definition, so together they cover a
revert wherever it happens without double-counting one that spans both
(D-plan-31):

- **`SessionEnd`** (`src/hook/handler.ts`, Step 28; `modify:`) calls
  `recordRegret(store, session)`: **reverted** here means the path's
  post-write `content_hash` (Step 7) equals a hash the path held earlier
  **in this same session** (a first edit alone is the decision moment, not
  evidence the decision was wrong) — the in-session case, unchanged from
  before this amendment.
- **The end of `runIndex`** (`src/index/indexer.ts`, Step 14; `modify:`)
  calls `recordRegret(store)` with no session: **reverted** here means
  `observed_actions.writtenSinceSeq(path, sinceSeq)` (Step 9) is true — the path
  was actually written since the watermark, so this is never evaluated on a
  path nothing touched — *and* the path's current on-disk `content_hash` —
  the value `runIndex`'s own incremental walk already computes for every
  file — equals `files.content_hash`'s value for that path from *before*
  this pass overwrites it: the snapshot `runIndex` took last time. Requiring
  both conditions is what makes this "reverted" rather than merely
  "unchanged": every untouched file trivially has its current `content_hash`
  matching its own last-indexed value, so the write-since-watermark check is
  what excludes the ordinary case and leaves only a path that changed and
  then changed back to what it was. This candidate set is evaluated
  independently of whichever files `runIndex`'s own incremental-diff
  optimization treats as "unchanged and skippable" for its own reindexing
  purpose — a net-reverted file is unchanged by that same measure and would
  never reach a regret check gated on the walk's own diff flag, so the
  regret pass queries `observed_actions` directly over the paths of
  store-held facts, rather than piggybacking on which files the walk chose
  to revisit. Disjointness from `SessionEnd` follows from what each side can
  even see: `SessionEnd`'s in-session definition only ever compares against
  a hash produced by an edit recorded *within that same session*; it never
  reads `files.content_hash`'s persisted, pre-pass value, so a match against
  that value — which is what this check requires — is never something
  `SessionEnd` could already have reported, whether the churn spanned one
  session or several. `sinceSeq` is `schema_meta.regret_index_seq` (Step 7),
  absent until the first pass: the pass reads `observed_actions.maxSeq()`
  **before** it evaluates any path, evaluates `seq > sinceSeq` up to that
  value, and then advances the key to it with `schema_meta.get`/`set` (Step
  9) — a single-store `seq` watermark, the shape of AD-5's project-store fold
  watermarks. `seq` is assigned under the single write lock, so a row a
  concurrent handler commits after the pass's read has a larger `seq` and is
  examined by the next pass; a wall-clock watermark advanced to "now" would
  skip a row stamped earlier but committed later, forever (expert review M7 —
  the race N11 found in the fold). Once a reverted path is reported, the next
  pass finds no write since the advanced watermark for it and never re-flags
  the same revert; absent, `sinceSeq` is treated as 0, so the first-ever pass considers the
  store's entire `observed_actions` history for the paths of store-held
  facts `runIndex` is touching regardless, per the population bound above —
  bounded by that same set, never a full-table scan. The miner's
  `revert_chain` landmine (Step 13) is a separate signal — a file in ≥ 2
  revert-labelled commits — and continues to exist independently; it
  answers "has this file's *commit history* shown revert churn," not "did
  the oracle's own regret proxy miss a revert," which is what this call
  site closes.

The rate is rendered by `status` under its mandated label, with the note
that the designed silence at a run-and-failed done-claim is self-counted
here (AD-18).

**Creates.** `src/diag/regret.ts` — regret proxy (FR-L4, AD-18); `src/diag/whisper_stats_fold.ts` — SessionEnd fold (AD-5, AD-26).

**Source.** `AD-5` (the project-store fold over the two `seq` watermarks,
`stats_folds`, the replace-publish, the `unattributed` booking, run points);
`AD-4` (`seq`, append-only `whisper_audit`/`corrections`); `AD-26` (single
`BEGIN IMMEDIATE` on the project store, separate idempotent publish); review
G32, G33, N11; plan-pass expert review M7 (the `seq` regret watermark);
`AD-18` (regret proxy, its two mandated run
points, outcome semantics of its two `observed_actions` reads); `AD-4`
(consumer filter); `FR-L4`, `D-36`, `AC-24`.

**Why this approach (Gate 3):**
1. **The decision.** Fold, ledger rows, and watermark advance in one
   immediate project-store transaction so concurrent same-project folds
   serialize, and the global row is a replaced copy of the ledger's totals; regret is a
   deterministic proxy bounded to subject / direct partner in Phase A, with
   both of AD-18's run points implemented and disjoint by construction.
2. **The authoritative standard.** `AD-5`, `AD-26`, `AD-18`; `FR-L4`
   (existence required, proxy the architect's); `D-36`.
3. **Why this standard applies here.** Without regret the loop converges to
   silence and reads healthy; the watermark transaction is what keeps the
   efficacy counts from double-counting under AD-26's concurrent handlers,
   and the fact that `SessionEnd` never reads `files.content_hash` is what
   keeps the two regret run points from double-counting each other.
4. **What this is NOT — and why.** Not an uptake judge (`D-12`). Not
   automated demotion input (Phase C). Not coverage measurement (AC-18's
   seeded coverage). Not a fold on tool events (AD-5 forbids; AD-23's
   inventory). Not a dedicated revert-history table (`D-plan-31`: a boolean
   check that a path was written since the watermark, plus a read of
   `files.content_hash` — data `runIndex` already holds for its own
   diffing — answers the question; a second table would duplicate data
   already there, which AD-4's uniform table-creation criterion argues
   against). Not a substitute for the miner's `revert_chain` (Step 13):
   that class reads commit messages, this one reads the oracle's own
   observation log and index snapshot, and neither implies the other.

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-30-1` (replay on `regret-true-positive` and
`regret-no-inflate`: a regret row for the relevant churn — including a
never-triggered fact and a cross-session revert — none for the unrelated
churn or a same-session revert counted twice; a row committed after an index
pass's read examined by the next pass — AC-24), `T-30-2` (two
concurrent same-project folds do not double-count; a post-session
correction reaches `whisper_stats` — AC-23's efficacy clause), `T-30-3`
(attribution by whisper, deny, `--genre`, `--missed-question`, and
`unattributed`; publishing twice changes nothing; a row committed after a
fold's read is folded by the next fold).

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


**What changes.** Register the `init` verb in Step 1's `dispatch.ts`
switch (created at Step 1, first given verbs at Step 28). Create
`src/cli/init.ts`:
1. `assertRuntime()` (Step 2); on a failed runtime check print a
   plain-language error and exit 1.
2. `resolveRepoKey` (Step 5). Keying-mode change detection: compute the
   identity and key under **every** rule that applies to this checkout
   (`commit` when the history is full, `url` when a remote exists, `path`
   always) and look for an existing store at each derived key; if one
   exists under a mode other than the resolved one, print the
   plain-language warning AD-20 specifies (naming both keys and modes) and
   offer the `export`/`import` migration before proceeding.
3. `ensureLayout` (Step 4); open the stores (`openStore`, Step 3) at the
   paths it returns and `probeFts5` (Step 3) on the project store. The
   probe's result is not written here — `schema_meta` does not exist
   before migration 001 — it is passed to `applyMigrations(store, {fts:
   <the probe result>})` for the project store (001; `fts_state` recorded;
   001b when the row reads `'fts5'`) and `applyMigrations` runs for the
   global store (002) (Steps 7, 8); then `seedDefaults` (Step 12), then
   `schema_meta.set('store_created_at', Date.now())` guarded by
   `schema_meta.get` so only a store where the key is absent gets it
   (`applyMigrations`, Step 7, run through its own DAO, `schema_meta.get`/
   `set`, Step 9 — the same pair `regret_index_seq`, Step 30, already reads
   and advances) — placed in this item, not item 4, so Step 28's replay
   harness (`prepareStore`, which performs items 3 and 5 for every fixture
   store, never item 4) gives every fixture store this key the same way a
   real `init` does. On
   `false` the token-table fallback is what `search.ts` uses. The summary names the
   recorded state and, when this run's probe disagrees with a state
   recorded by an earlier `init` (the row is written once), says so in
   plain language and names the recovery — `deinit --purge`, then `init`
   (AD-25 forward-only; Q7). Items 3 and 5 are the sequence Step 28's
   replay harness performs for a fixture repository; `init` adds item 4.
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
   whenever this item actually appends a missing `ctxoracle` entry (real
   wiring, not the idempotent no-op below) it also overwrites
   `schema_meta.store_created_at = Date.now()`, regardless of whether the
   key was already set by item 3 — this is the moment hooks actually
   started firing again after a `deinit` (no `--purge`) removed them, or
   after an `export`/`import` migration carried an older store's row into
   this checkout, and is what keeps AD-17's totally-dead detector (Step 33,
   D-plan-25) from reading a stale wiring moment in either case; the
   idempotent case (every documented entry already present and correct)
   leaves it untouched;
   an existing file is parsed, edited, and re-serialized with its detected
   indentation (2-space default) and its trailing-newline state preserved,
   key order untouched. Idempotent: an existing matching entry is left in
   place (its `timeout` repaired to 5 if it differs), a missing one is
   appended, unrelated entries are never touched. Only the documented entry
   fields are written (§11.4: the hooks reference lists the entry fields and
   makes no promise about unknown ones).
5. `runIndex(store, repoPath, {full: true, frontends:
   defaultFrontends(tuning), tuning, diagnosticsDir})` (Steps 14, 15) — the
   first index — and the off-path `quick_check` (Step 3).
5a. **Record the binding** (AD-20, AD-23; review G30): `findRepoRoot(repoPath)`
   (Step 28's module) gives the root — for a worktree, the **main**
   repository's root, the same root the handler's walk resolves a worktree
   to; for a path-keyed directory, `fs.realpathSync(repoPath)` — and
   `recordBinding(global, root, key)` writes `global_meta`
   `repo_path:<root>` → key (overwriting a stale value). This is the only way
   the handler finds the store; a moved checkout or a fresh clone carrying a
   committed `.claude/settings.json` misses until `init` is re-run there,
   and the miss is the visible `repo_not_bound` (AD-17).
6. Print the plain-language summary: repo key, keying mode and identity
   string, **the recorded binding** (root → key), FTS5 state, walk mode,
   files indexed, commits mined, tables ready.

**Creates.** `src/cli/init.ts`.

**Source.** `AD-20` (init: environment checks, key derivation with mode
display, plain-language on re-init keying-mode change, the path→key binding,
hook wiring "with a `ctxoracle` marker on each entry", first index); `AD-23`
(the root a worktree resolves to); review G30; `AD-6` (event map,
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
the `repo_path:` binding recorded — the main root when run in a worktree;
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
  create: [middleware/context-oracle/ctxoracle/src/cli/deinit.ts, middleware/context-oracle/ctxoracle/src/cli/export.ts, middleware/context-oracle/ctxoracle/src/cli/import.ts, middleware/context-oracle/ctxoracle/test/replay/deinit_marker.test.ts, middleware/context-oracle/ctxoracle/test/replay/export_roundtrip.test.ts, middleware/context-oracle/ctxoracle/test/conventions/no_network_modules.test.ts, middleware/context-oracle/ctxoracle/test/replay/import_validate.test.ts]
  modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]
  delete: []
provides: [ctxoracle-deinit, ctxoracle-export, ctxoracle-import]
tests: [T-32-1, T-32-2, T-32-3, T-32-4]
depends_on: [S1, S3, S4, S14, S28, S30, S31]
```


**What changes.**
- `src/cli/deinit.ts`: removes every hook entry whose `command` matches the
  Step 31 pattern for any of the eight events; leaves unrelated entries and
  the rest of the file untouched (same re-serialization rules as `init`);
  prunes each event array it emptied and the `hooks` object when it
  becomes empty; when `schema_meta` records that `init` created
  `settings.json` and the pruned document equals `{}`, removes the file,
  and likewise the `.claude/` directory it created when empty; with
  `--purge` deletes the project store and its diagnostics directory **and**
  every `repo_path:` binding whose value is that key
  (`deleteBindingsFor`, Step 28) — a binding to a deleted store is a dangling
  reference; plain `deinit` keeps the binding (the store still exists, and
  re-running `init` restores the wiring).
- `src/cli/export.ts` / `src/cli/import.ts`: `export <dir>` writes
  `<dir>/project.db` and `<dir>/global.db` via `Store.exportTo` (`VACUUM
  INTO`, Step 3). **`import <dir>` never overwrites a database file and
  validates before it writes a live store** (AD-5 as revised 2026-09-26;
  review G34 — executed there, `copyFileSync` over a store another process
  held open with 200 uncheckpointed WAL frames gave "database disk image is
  malformed", while `sqlite.backup()` with the holder still open gave
  `integrity_check: ok`). **The import is all-or-nothing** (expert review
  M2), in three phases:
  1. *Validate everything first.* For each of the two export files:
     `backupFile(<dir>/<file>, <live path>.import-tmp)` (Step 3), then
     `openStore(tmp).integrityCheck()` (`quick_check`). If either file cannot
     be opened or fails its check, every temporary file is deleted,
     `import_rejected` (`{file, check}`) is recorded, **neither live store has
     been touched**, and the verb exits 1 with a plain-language message naming
     the file.
  2. *Prepare the global store's bindings in its temporary copy* (below).
  3. *Write, global first, then project, then publish:* `backupFile(<global
     tmp>, <live global>)`, then `backupFile(<project tmp>, <live project>)`,
     then the fold's publish step (Step 30) for the project's key, so the
     global replica equals the imported store's own `stats_folds` totals
     (AD-5; AD-24's "an import of an older export leaving the global counts
     equal to the imported store's own totals"); the temporary files are
     deleted. There is no transaction across two database files, so one
     residual remains: a failure between the two live writes (a crash, a
     `store_busy` on the project store) leaves the new global store beside the
     old project store. `import` then records `import_rejected` with `check:
     'partial_write'`, prints which store was written, and names the recovery
     — run the same `import` again, which re-validates and rewrites both.
  The target layout is created with `ensureLayout` (Step 4) when absent. A live store
  that is non-empty is refused without `--replace` (unchanged). **A global
  import merges repository bindings; it never drops this machine's** (AD-5 at
  `6cff0ce`; collapse-hunt H7): in phase 2, every `repo_path:` binding of the
  live global store is copied into the validated temporary global store, and
  where both hold a binding for the same path, **this machine's binding wins**
  (it names a store that exists here); every other imported table is the
  export's. `import` then lists, in plain language, every imported binding
  whose root does not exist on this machine and tells the owner to run
  `ctxoracle init` in each such repository here (a binding names a path, and
  paths differ between machines). *Why:* replacing the bindings wholesale
  silently unbound every repository this machine had that the export lacked,
  and each session there went silent with only a `repo_not_bound` line. A
  store busy past AD-26's retry at phase 3's first write is refused with
  `store_busy` and changes nothing. No network path exists in either verb (`FR-X7`),
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

**Source.** `AD-20` (verbs); `AD-5` (export via `VACUUM INTO`; import by
temp `sqlite.backup()` → `quick_check` of both files → `sqlite.backup()` into the live
stores, then publish; merged bindings; `import_rejected`; record-identical per
AC-19); plan-pass reviews M2, H7; SQLite "How To
Corrupt An SQLite Database File" §1, §1.4 and the Online Backup API; review
G34; `AD-12`/`AD-13` (index runs both indexer and
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
4. **What this is NOT — and why.** Not `sqlite.backup()` for *export* (`VACUUM INTO`
   is engine-level and needs no floor). Not a file copy for *import*
   (**reversed 2026-09-26**: this line formerly rejected `sqlite.backup()` for both
   directions; a copy over a live WAL store corrupts it — G34, executed —
   and `sqlite.backup()` exists on the 22.16.0 floor, V17, which is therefore
   load-bearing for import). Not a check after the overwrite (it would
   destroy the store the check protects — AD-5, ER M12). Not a per-file
   validate-then-write loop (a good global file followed by a bad project file
   left the global store already replaced — M2). Not a wholesale replace of
   the bindings (it unbound this machine's repositories silently — H7). Not a JSON export
   (loses STRICT constraints on import). Not a byte-compare in the test (the
   documentation says the copy is rebuilt).

**Dependencies.** Declared above (`depends_on`).

**Verification.** `T-32-1` (deinit removes exactly the matching entries,
removes a `settings.json` and `.claude/` that `init` created, keeps a
pre-existing one; `--purge` removes the store; the AC-7 tree diff is empty
afterwards), `T-32-2` (AC-19: canonical-order per-table dump before and
after the round-trip is identical; the verbs succeed with no network
namespace), `T-32-3` (no network module and none of the `fetch` tokens
anywhere in `dist/src/**`), `T-32-4` (import validates before it writes:
a corrupt export is rejected with the live store untouched; a good global
file beside a corrupt project file changes neither live store; an import
under a live WAL holder yields an intact store; an older export leaves the
global counts equal to the imported store's totals; a global import keeps
this machine's bindings and lists the imported ones whose roots are missing;
`deinit --purge` removes the binding).

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
depends_on: [S1, S2, S4, S5, S9, S10, S12, S21, S26, S28, S30, S31]
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
  `deny_bypass_suspect` counts **with the bypass predicate's two error
  directions printed beside the count** (Step 26), active suppressing
  conditions (store corrupt, transcript layout changed, FTS fallback,
  store busy), a held reindex claim with its `reindex_owner_pid` and
  `reindex_started_at` when one exists (Step 14, D-plan-32), the
  `hooks_not_firing` detector (AD-17: for every session with a liveness row
  and no `SessionEnd` row, if the transcript file the row names has an
  mtime later than the session's last `session_log` event by more than
  `diag.hooks_not_firing_gap_s`, record `hooks_not_firing` for that session
  and flag it — detected at this invocation, never by a timer) **and its
  totally-dead half** (AD-17, L7 — "liveness rows go stale": transcripts
  in the directory `projectTranscriptDir(cwd)` returns (Step 21's
  `locate.ts`, the one module that knows the layout) newer than the newest
  liveness row — or present when no liveness row exists at all — by more
  than the gap, excluding any transcript whose first entry predates the
  newest liveness row or `schema_meta.store_created_at` (Step 31's `init`
  writes this at first creation and again whenever it genuinely re-wires a
  missing hook entry — the moment this repository's hooks last started
  firing); "first entry" is read via `readFrom`/`discriminateEntry` (Step
  21), walking forward past `skip`-kind entries (which carry no
  `timestamp` in `discriminateEntry`'s own shape) to the first `human` or
  `assistant_text` entry — a transcript still entirely `skip`-kind so far
  has no first entry yet and is excluded outright, the same direction as
  every other undecided case here — so the session
  running `init` itself is never flagged; a transcript that IS flagged
  records `hooks_not_firing` with detail "no session started the hooks";
  when that directory does not
  exist, `status` prints "no transcript directory found for this
  repository" so a changed layout is visible rather than silent; run at
  `status`, `init`, and `index`, D-plan-25),
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
  show members), sources, and defaults. A scalar write is first checked with
  Step 12's `checkTuningWrite`; a refused write prints the plain-language
  reason and changes nothing, exit 1 (AD-14/AD-20; ER M9; the tier invariant
  and the stale-factor interval, collapse-hunt H2). An accepted write prints
  Step 12's `tuningWriteNotice(key)` when it is non-null — for
  `bar.recency_half_life_days`, that the next `ctxoracle index` re-mines the
  history under the new half-life (AD-13).
- **Full build additions (2026-09-26 plan pass).** `status` finds the
  repository the way the handler does (Step 28's `findRepoRoot` +
  `lookupBinding`); with no binding it says "this directory is not set up —
  run `ctxoracle init` here" and still renders the home-level section. It
  also renders: **the home-level fault channel** (`<home>/diagnostics/*.jsonl`,
  including `repo_not_bound` per session — AD-17, G35) wherever it is run;
  the binding (root → key) and every `repo_path:` binding in the global store;
  the walk mode and its fixed exclusions (`.git/`, `node_modules/`) and, in
  `readdir` mode, that the ignore-file zone signal is absent (AD-12);
  `schema_meta.lang_capabilities` per language (frontend, `symbols`,
  `imports`, the unresolved share against `reuse.max_unresolved_import_share`)
  and that `test_map` regions are whole files (AD-12); whether a full mine is
  in progress (`mining_in_progress`) and whether the corpus floor is met;
  `whisper_dropped_unverifiable` counts per reason (AD-17); two counts of
  search events that yielded no result paths, kept apart — those whose Grep
  mode the oracle cannot read (`search_results = 'mode_unsupported'`) and
  those whose response it did not recognize (`'unrecognized'`) — (Step 28;
  collapse-hunt H3); `repo_not_bound` lines by reason, `store_unreadable`
  with its store and path kind (Step 28; H8); the per-genre
  trend from `stats_folds` beside the published total (AD-5); `path_not_utf8`,
  `index_path_only_oversize`, `history_rewritten`, `handler_exception`
  counts with their latest detail; and every new seed (Step 12).

**Creates.** `src/cli/status.ts` — renders diag/status.ts; `src/cli/log.ts` — renders diag/log.ts; `src/cli/tune.ts`; `src/diag/status.ts` — status renderer (FR-M4); `src/diag/log.ts` — log renderer (FR-M5).

**Source.** `AD-17` (three surfaces and two JSONL channels; the "never
display absence of measurement as health" rule; correct silence rendered
only here per `D-22`); `AD-20` (verbs, plain language, `tune` semantics and
its refusal; the binding shown); `AD-12` (capabilities, walk, regions
disclosed); `AD-5` (trend from `stats_folds`); `AD-9` (the
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

**Verification.** `T-33-1` (every FR-M4 signal listed above appears,
including the 2026-09-26 additions; the reserved codes render as "not yet
measured"; the seeds and the bypass bound are printed), `T-33-2` (`log` renders every audit row with evidence and
pointers), `T-33-3` (`tune` round-trips scalar and list values and lists
sources, refuses an ordering- or tier-invariant-breaking write, and prints the
half-life's re-mine notice), `T-33-4` (`hooks_not_firing` induced, both halves: a liveness row
with a transcript grown past the gap and no events is flagged, the same
session with a recent event is not; a transcript under the repository's
slug newer than the newest liveness row with no liveness row at all is
flagged with detail "no session started the hooks"; a transcript whose
first entry predates `schema_meta.store_created_at` and is still growing
with no liveness row is not flagged — the session running `init` itself,
case (d); a `deinit`-then-`init` re-wiring overwrites `store_created_at` so
the re-installing session is protected the same way, case (e)).

**Impact if wrong.** Owner-blind — a broken `status` is exactly the failure
`OL-10` was raised to prevent. Caught by `T-33-1`.

---

### Step 34 — `correct` verb + `--missed-question` routing

```step-decl
step: S34
covers: [PA-7, PA-11]
files:
  create: [middleware/context-oracle/ctxoracle/src/cli/correct.ts, middleware/context-oracle/ctxoracle/test/replay/correct_verdict.test.ts, middleware/context-oracle/ctxoracle/test/replay/correct_missed_question.test.ts, middleware/context-oracle/ctxoracle/test/replay/correct_genre.test.ts]
  modify: [middleware/context-oracle/ctxoracle/src/cli/dispatch.ts]
  delete: []
provides: [ctxoracle-correct]
tests: [T-34-1, T-34-2, T-34-3]
depends_on: [S1, S9, S22, S23, S30, S33]
```


**What changes.** Create `src/cli/correct.ts` (AD-18 as revised 2026-09-26):
- `ctxoracle correct <whisper-or-deny-id> --verdict (false_fire|missed|
  confirm) [--note "<text>"]`: writes a `corrections` row with `whisper_id`
  or `deny_id` (the id is looked up in `whisper_audit`; an unknown id is
  refused in plain language); the fold later attributes it through that row's
  `genre`.
- `ctxoracle correct --verdict missed --genre <genre> [--note "<text>"]` —
  a miss with no whisper to point at: writes a `corrections` row with no id
  and `genre` set; `<genre>` must be one of `orientation`, `coupling`,
  `reuse`, `consequence`, `warning`, `completeness`, `verification`,
  `answer_drift` (else refused, listing them). Without `--genre` (and without
  `--missed-question`) the row carries no genre and the fold books it as
  `unattributed`, never as answer-drift (AD-5, AD-18). AD-18's
  illustrative `ctxoracle correct missed --genre coupling` is this form; the
  plan keeps the one `--verdict` flag grammar the other forms use.
- `--missed-question "<text>" [--session <id>]`: writes a `corrections` row
  (`verdict = 'missed'`, `genre = 'answer_drift'`), routes the text through
  `recognizeQuestions` (Step 23) with `{requireTerminalMark: false}` — the only
  caller that passes it (Max may paraphrase) — and opens the row through Step
  22's `openQuestion` for the consumer `consumerKey(<session>)` (main), where
  `<session>` is `--session` when given, else **the session of the most
  recent event** — the newest `session_log` row by `seq`
  (`session_log.latestSession()`, Step 9) — AD-18 at `6cff0ce`. The verb
  always prints which session it armed, in plain language (its id, when it
  started, and when its last event was). If that session has ended (a
  `SessionEnd` row is recorded for it, `session_log.hasEnded`), the verb arms
  nothing, says so, and names `--session`; with no `session_log` row at all it
  opens nothing and says so. The `corrections` row is written in every case
  (the miss happened, whether or not a live session can be armed). *Why:* the
  consumer key is per session (AD-4), so "the identical deviation is
  thereafter denied" (AD-18) needs a session, and OL-C5's "their next move"
  is the move of the agent Max is talking to; the newest *liveness* row names
  the most recently **started** session, which may be a second session or one
  that has already ended, so a report would arm a session that can never fire
  and no one would be told (collapse-hunt H5). The row's `asked_uuid` stays
  null (the CLI is its origin). On `'already_open'` the verb prints which limit the
  reported miss actually hit — intake coverage ("the question is already
  open and armed; nothing to change") or move coverage ("a shell-only
  deviation stays un-deniable in Phase A") — never implying enforcement
  changed when it did not (AD-18, L3).
- Every form then runs `foldWhisperStats({project, global}, key)` (Step 30),
  so a post-session correction reaches the global efficacy row.

**Creates.** `src/cli/correct.ts`.

**Source.** `AD-18` (human channel `FR-D4`/`FR-L6`; `--genre`; the
`unattributed` booking; `--missed-question` through the same recognizer; the
collision messages); `AD-5` (the fold's `correct` run point and attribution);
`AD-4` (per-session consumer key); `OL-C5`; L3; `AC-2c` (answer-drift under-fire), `AC-23`.

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
(`--missed-question` re-arms the deny for the identical mutating deviation in
the session of the most recent event and prints which; an ended session is
refused; the two collision messages print for their cases),
`T-34-3` (`--genre` and the unattributed booking reach `whisper_stats` under
the right genre).

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
  delete: [middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts, middleware/context-oracle/ctxoracle/src/cli/context.ts]
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
`lessons` in the global store (`FR-L7`). **Full build (2026-09-26):** the
statement passes through `redact` (Step 11) before it is stored (AD-19); a
`landmine` note writes through `landmines.createHuman` (Step 9 — the miner's
per-pass rebuild never touches it, AD-15); `--file` is normalized against the
checkout root (Step 28's `findRepoRoot`) and must name a `files` row with
`in_tree = 1`, else the verb refuses in plain language (a hazard pinned to a
file the oracle cannot point at would never be spoken — AD-15's
verifiable-pointer rule).

**The walking skeleton's verb modules are deleted here.** The skeleton hosts
the thin `status`, `log`, `tune`, `correct`, `note`, `export`, `import`, and
`deinit` verbs in `src/cli/verbs_skeleton.ts` and its repository helper in
`src/cli/context.ts` (neither is a planned module — each carries a `WALKING
SKELETON` mark `T-37-1` rejects). Each full build of Steps 28 and 31–35
routes its verb in `dispatch.ts` to its own module and imports neither file
(repository resolution is Step 28's `findRepoRoot`/`lookupBinding`, store
opening Step 3's `openStore` over Step 4's layout); this step, the last verb,
deletes both (`delete:` above), and `npm run build` confirms nothing still
imports them (expert review m8: `T-37-1`'s "no `verbs_skeleton`" clause had no
step that made it true).

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
  create: [middleware/context-oracle/ctxoracle/test/conventions/no_skeleton_marks.test.ts]
  modify: []
  delete: []
provides: []
tests: [T-37-1]
depends_on: [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20, S21, S22, S23, S24, S25, S26, S27, S28, S29, S30, S31, S32, S33, S34, S35, S36]
```


**What changes.** No new module. Every test file named in §5.1 under
`test/unit`, `test/build`, `test/conventions` exists (each was written with
its step), compiles with the sources, and `npm test` (Step 1's runner)
executes the full set: the runner's count guard confirms nothing was
dropped. CI (Step 1) runs the same command at the floor and at the current
22.x. Create `test/conventions/no_skeleton_marks.test.ts` (`T-37-1`): no
file under `src/` contains `SKELETON` (which covers every `SKELETON: 1R`
placeholder, §9), `WALKING SKELETON`, or a `not implemented:` stub (§7's
test-first contract); no file under `test/` carries a `node:test` `todo`
option or the text `SKELETON: 1R` (Checkpoint 1R's red tests, each retired by
its named step); and no module named `verbs_skeleton` or `cli/context`
exists (Step 35 deletes both) — the walking skeleton's provisional choices
are gone only when each owning step's full build removed its mark (§7 build
order; review N9 — the skeleton also carried unmarked omissions: the
`hooks_not_firing`, `produced_but_undelivered`, `deny_despite_answer_text`,
`rebuild_recovered_nothing`, `tuning_missing`, and `store_busy` writers, the
FR-M4 counter, and the stubbed `firstHash`/`writtenSinceSeq`, built by Steps 33,
28, 26, 27/20, 12, 28, 27, and 9/28 respectively). The runner's summary at
this step also reports `todo 0`.

**Creates.** `test/conventions/no_skeleton_marks.test.ts` — T-37-1.

**Source.** `AD-24` (unit tier); Step 1's runner design; review N9.

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
files under the four directories in §5.1; `T-37-1` passes.

**Impact if wrong.** Coverage theater — a missing or silently skipped test
file. The runner guard and this reconciliation are the two checks.

---

### Step 38 — Acceptance tier + build-time verifications

```step-decl
step: S38
covers: [PA-10]
files:
  create: [middleware/context-oracle/ctxoracle/scripts/check-cold-container.sh, middleware/context-oracle/ctxoracle/test/replay/answer_drift_off_to_unrelated.test.ts, middleware/context-oracle/ctxoracle/test/replay/answer_drift_reconciliation.test.ts, middleware/context-oracle/ctxoracle/test/replay/answer_drift_subagent_allow.test.ts, middleware/context-oracle/ctxoracle/test/replay/answer_drift_lag_hold.test.ts, middleware/context-oracle/ctxoracle/test/replay/deny_after_answer_lag.test.ts, middleware/context-oracle/ctxoracle/test/replay/deny_health_induced.test.ts, middleware/context-oracle/ctxoracle/test/replay/session_start_startup.test.ts, middleware/context-oracle/ctxoracle/test/replay/session_start_resume.test.ts, middleware/context-oracle/ctxoracle/test/replay/stop_outstanding_question_line.test.ts, middleware/context-oracle/ctxoracle/test/replay/coupling_nonobvious.test.ts, middleware/context-oracle/ctxoracle/test/replay/orientation_mixed_shape.test.ts, middleware/context-oracle/ctxoracle/test/replay/reuse_mixed_language.test.ts, middleware/context-oracle/ctxoracle/test/replay/consequence_coupled_tests.test.ts, middleware/context-oracle/ctxoracle/test/replay/completeness_paired_change.test.ts, middleware/context-oracle/ctxoracle/test/replay/bar_no_cap.test.ts, middleware/context-oracle/ctxoracle/test/replay/bar_hazard_bypass.test.ts, middleware/context-oracle/ctxoracle/test/replay/dedup_read_set.test.ts, middleware/context-oracle/ctxoracle/test/replay/corpus_floor.test.ts, middleware/context-oracle/ctxoracle/test/replay/rumor_rule.test.ts, middleware/context-oracle/ctxoracle/test/replay/session_boundary_dedup.test.ts, middleware/context-oracle/ctxoracle/test/replay/stop_single_cycle.test.ts, middleware/context-oracle/ctxoracle/test/replay/security_ac11.test.ts, middleware/context-oracle/ctxoracle/test/replay/subagent_delivery.test.ts, middleware/context-oracle/ctxoracle/test/replay/language_config_added.test.ts, middleware/context-oracle/ctxoracle/test/replay/idle_silence.test.ts, middleware/context-oracle/ctxoracle/test/replay/seeded_facts_exit.test.ts, middleware/context-oracle/ctxoracle/test/replay/verification_headline.test.ts, middleware/context-oracle/ctxoracle/test/replay/warning_headline.test.ts, middleware/context-oracle/ctxoracle/test/replay/answer_drift_overfire.test.ts, middleware/context-oracle/ctxoracle/test/replay/answer_drift_residual.test.ts, middleware/context-oracle/ctxoracle/test/replay/coupling_key_symmetry.test.ts, middleware/context-oracle/ctxoracle/test/build_time/marker_presence.ts, middleware/context-oracle/ctxoracle/test/build_time/marker_presence.test.ts, middleware/context-oracle/ctxoracle/test/build_time/grammar_inventory_check.test.ts]
  modify: [middleware/context-oracle/ctxoracle/test/replay/hook_stream_fixtures/, .github/workflows/context-oracle-ctxoracle.yml, middleware/context-oracle/ctxoracle/test/fixtures/generate.ts]
  delete: []
provides: []
tests: [T-38-1, T-38-2, T-38-3, T-38-4, T-38-5, T-38-6, T-38-7, T-38-8, T-38-9, T-38-10, T-38-11, T-38-12, T-38-13, T-38-14, T-38-15, T-38-16, T-38-17, T-38-18, T-38-19, T-38-20, T-38-21, T-38-22, T-38-23, T-38-24, T-38-25, T-38-26, T-38-27, T-38-28, T-38-29, T-38-30, T-38-31, T-38-32, T-38-33, T-38-34]
depends_on: [S1, S5, S15, S28, S29, S30, S31, S32, S33, S34, S35]
```


**What changes.** Create the acceptance tests `T-38-1` … `T-38-31` and
`T-38-34` (§12.3; `T-38-34` is AD-24's `coupling-key-symmetry` fixture)
against the real handler binary through Step 28's replay harness, each
with its hook-stream fixture under `test/replay/hook_stream_fixtures/` and
the fixture repositories Step 1's generator produces — this step builds out
in `test/fixtures/generate.ts` (G6) every fixture only a `T-38` replay uses:
`bar-two-candidates`, `dedup-read-set`, `answer-drift-clearly-off`,
`pristine-tree`, `secret-injection` (including a planted filename that
`isSuspect` flags, for AD-19's masking), `subagent-delivery`,
`language-config-added`, `seeded-facts`, `coupling-key-symmetry` — each with ≥
`miner.corpus_floor_commits` included commits where it carries history (N1)
— and the build-time verifications:
- `test/build_time/grammar_inventory_check.test.ts` (L6, T-38-33): a
  `node:test` file enumerated by `run-tests.mjs`'s `build_time` tier
  (Step 1) — it enumerates the `.wasm` files shipped in the installed
  `tree-sitter-wasms` package, loads each grammar the default
  `index.ext_to_grammar` table names through `web-tree-sitter`, parses a
  one-line sample with each, and fails the test on any missing,
  unloadable or non-parsing grammar, or on an excluded grammar (§4)
  appearing in the table.
- `test/build_time/marker_presence.ts` (L11(a)): exports
  `markerPresence(corpora)`, which counts the user entries of every
  transcript under each of one or more `{machine, mode, dir}` corpora by
  `(content shape, origin.kind, isMeta)` and returns the table keyed by the
  declared origin (a transcript given with no declared origin is reported
  "origin unknown"); the module's own CLI entry reads
  `--corpus <machine>/<mode>=<dir>` arguments and prints the table —
  invoked directly (not through `run-tests.mjs`) by Step 39's replay leg
  over every corpus that leg declares, whose exit report carries the
  table. `test/build_time/marker_presence.test.ts` (T-38-32) imports
  `markerPresence` and is the self-test, enumerated by `run-tests.mjs`'s
  `build_time` tier (Step 1), asserting the fixed cases against
  `test/replay/transcript_fixtures/`.
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
`T-38-26`–`T-38-31`, `T-38-34`, plus the replay tests of Steps 28–35 — the runner's
count guard covers `test/replay` too, and (the same invocation's
`build_time` tier, Step 1) `test/build_time/grammar_inventory_check.test.ts`
(`T-38-33`) and `test/build_time/marker_presence.test.ts` (`T-38-32`) both
pass; the `cold-container` job passes (`T-38-25`). The replay
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

**Leg 1 — replay of real transcripts (agent-run).** **The corpus is defined
by inclusion, not by exclusion** (review G36; the lesson of OL-R5): `exit-run.sh`
takes a declared repository list, `--repo <name>=<checkout path>`, holding
the owner's repositories and this tool's own repository (its own class,
below); a transcript `*.jsonl` under `~/.claude/projects/` is **in the
corpus iff** the `cwd` its first entry records resolves (Step 28's
`findRepoRoot`) to the root of a declared checkout — a worktree resolving to
its main repository counts — or, for a transcript whose `cwd` no longer
exists, iff that `cwd` string equals or lies under a declared checkout path.
Every other transcript — including the build's own probe and test
transcripts (`-tmp-plan-probe-layout-*`, `-tmp-tmp-*` exist on this machine)
— is **counted and listed as out of corpus with its reason** (`cwd` outside
every declared repository; no `cwd` recorded), never replayed and never in a
number. For each in-corpus transcript: (a) resolve its repository — the
`cwd` its entries record must exist on this machine with a `.git`
directory, in which case the store is keyed by Step 5's rules on that
checkout as it stands (the transcript's `gitBranch` field and the
checkout's current `HEAD` are recorded; no checkout is moved, so leg 1's
structural genres see the current tree, which the report labels as a
reconstruction — R8, G4); an in-corpus transcript whose `cwd` is absent
on this machine is path-keyed on the `cwd` string (Step 28's harness binds a
stand-in directory to that key) and its structural genres are reported as
not applicable; (b) reconstruct the hook-event stream the session would have
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
against a fresh store the harness prepares (Step 28's store preparation,
keyed as (a) states — never `init`, whose settings write is the one in-tree
write, `D-9`, and has no place in a replay over the owner's checkout); (e)
run `marker_presence` (Step 38) over the corpus
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
   turn's JSON envelope and records it per session; a settings-file hook
   deny lands there exactly as a permission-system refusal does (§11.4),
   so each entry is reconciled against the session's `kind='deny'`
   `whisper_audit` rows (Step 25; the entry's `tool_input.file_path`
   against the row's `evidence_json` target): an entry with a matching row
   is the block firing on a mutation — what this leg measures — and an
   entry without one is a permission-system refusal, listed per session in
   the report; whether the session counts is decided by the validity rule
   below.
3. **Collection.** Every counted session's store and transcript are
   already on the report machine (`~/.ctxoracle` and the session's
   `~/.claude/projects/<slug>/` file, located through Step 21's
   `projectTranscriptDir`); `exit-run.sh` reads `status` and `log` per
   session and computes. No transfer step exists for agent-driven
   sessions.
4. **Mode.** A `-p` transcript's human turns carry no `origin` and no
   `isMeta` (V12; §11.4): every catch-up that scans one — not only the
   `--resume`-triggered rebuild — raises its own `unrecognized_user_entry`
   diagnostic (Step 21's marker-absent path), and every `--resume` turn's
   qa-state rebuild (Step 27) recognizes zero human turns and raises
   `rebuild_recovered_nothing` on top — both expected in this mode by
   construction and labelled so in the report as `report-machine/claude-p`'s
   own known signature, never counted as a fault of the reader or confused
   with L11(a)'s loud failure (which the corpus's declared origin alone
   distinguishes: a `report-machine/claude-p` fault line is expected, an
   `owner-local/interactive` or `report-machine/remote-container` one is
   not). Leg 2 therefore **exercises**: intake from the `prompt` field
   (unaffected by markers), the deny decision, the lag-window hold, the
   three deny-health detectors (`deny_after_answer_lag`, `deny_loop`,
   `deny_despite_answer_text`), and the escape fraction (denies escaped by
   a text turn); it **cannot exercise**: reconciliation/backfill
   (`asked_uuid`/`asked_offset`, `T-38-2`'s own property — it needs a
   marker-bearing human turn to match against an intake row), the voiding
   guard (AD-9: voids only on an *affirmatively non-human* marker, never
   on absence, so a marker-less transcript can never trigger it), or
   rebuild recovery (defined to recover nothing here) — leg 1's
   reconstructed transcripts and the owner's own interactive sessions,
   both marker-bearing, are what exercise those three. Leg 2's transcripts
   are passed to `marker_presence` under their own declared origin,
   `report-machine/claude-p`, whose marker row is expected to be all-zero
   and never counts toward L11(a).

Max Cogar may additionally drive sessions in his own interactive
environment (`OL-11`: he speeds up testing); those reach the report
through one action on his side — `ctxoracle export <dir>` in each such
repository, plus the session's transcript file copied into that directory,
and handing the directory over — and `CTXORACLE_HOME=<a fresh directory per
export> ctxoracle import <dir>` on the report machine, never into the report
machine's own home: his project store carries the same commit key as the
agent's leg-2 clone of the same repository, so importing into the shared home
would overwrite the agent's leg-2 project store (the global import merges
bindings, Step 32, but the project store for that key is replaced); `status`
is then read with the same `CTXORACLE_HOME`. The report lists them separately with driver "Max Cogar". The
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
two error directions (Step 26's wording), and the fraction of denies that were escaped by a text
turn versus corrected as wrongful; false-fire rate; regret rate paired
with seeded coverage and split by `never_triggered` / held; done-claims
with an outstanding question; **Warning's false-fire rate across its
evidence** — the `warning` whisper rows' `false_fire` corrections over their
count, tabulated by `support` and by the file's `change_count` from each
row's `evidence_json` (Step 18) and by their ratio, so Phase B can judge
whether a base-rate term is needed (AD-14; Limitations L13; collapse-hunt
H10); **Orientation's entry points by source** — per Orientation whisper, how
many named files scored by the entry-marker bonus (`index.entry_marker_points`,
a basename stem in `lexicon.entry_marker_stems`) with import in-degree 0,
against how many by in-degree, from the audit row's evidence, so the
`plan_seed` marker weight is measured on real repositories rather than only on
its fixture (AC-1a's low-in-degree shape; collapse-hunt H11); the
marker-presence table by declared
corpus origin, with L11(a) stated as *verified* only when a corpus
declared `owner-local/interactive` holds at least one transcript and
otherwise *not observed*; leg 2's exercised/unexercised path lists (item
4 above), so a reader of the fault channel reads its
`unrecognized_user_entry` and `rebuild_recovered_nothing` lines as this
mode's known signature, not a broken reader; the L11(b) outcome per
session; active
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
catches"); review G36 (a population defined by inclusion criteria); `docs/IDEAS.md` #14 (discovery-mode replay: what replay can and
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

- **After the reopened Steps 1–12 — Checkpoint 1R: the corrected substrate
  (2026-09-26 plan pass).** A foundation correction before new feature work
  (§6). The reopened deltas change types, schema, and DAO signatures that the
  walking-skeleton modules of Steps 13–39 consume, so the build of the deltas
  also **reduces** those modules — never adapts them with a behaviour choice
  (expert review S1; collapse-hunt H12, H13). The files are exactly the ones
  the Step 6 and Step 9 deltas' `modify:` lists name (Step 7's one run-time
  break is inside a Step 6 file), read from the built skeleton on 2026-09-26;
  a file the build finds broken that is not listed is expert-implement's
  `BLAST-RADIUS-EXCEEDS-PLAN` stop. **The placeholder rule — the only edit
  permitted in those files:**
  1. *A generator returns no candidates.* Its `candidates()` body becomes
     `return []`.
  2. *A DAO caller that no longer exists is removed*, together with the branch
     that only it served.
  3. *A signature takes the new inputs with a documented stand-in value* —
     the new parameter or field is passed, and where the skeleton has no value
     for it the stand-in below is written.
  Every placeholder carries `// SKELETON: 1R — <what it stands in for>;
  retired by Step <n>`; each is removed by the named step's full build, and
  `T-37-1` fails while any remains. The placeholders:

  | File | Placeholder (rule) | Retired by |
  |---|---|---|
  | `src/genres/orientation.ts`, `coupling.ts`, `reuse.ts`, `consequence.ts`, `warning.ts`, `completeness.ts`, `verification.ts` | `candidates()` returns `[]` (1) — no string headline, no `a_count` read | Step 18 |
  | `src/genres/generator.ts` | the pair query naming `a_count` is removed and the helper returns `[]` (2); `TuningReader` parameter typed to Step 6's `{num, str, list}` (3) | Step 18 |
  | `src/bar/combinator.ts` | `passesBar(candidate, tuning, ctx)` takes Step 6's `Candidate`, `TuningReader`, and `{indexStale, historyStale}`; stand-in body `return {passes: false, failedAxis: 'confidence', confidence: 0, tier: 'uncertain'}` — unreachable while every generator returns `[]` (3) | Step 16 |
  | `src/hook/compose.ts` | takes Step 6's `Candidate`; stand-in body `return {dropped: 'stale_pointer'}` — unreachable (3); the `whisper_dropped_stale` result type is removed (2) | Step 19 |
  | `src/hook/delivery.ts` | consumer parameters typed `ConsumerKey` (3); the body is unchanged | Step 20 |
  | `src/hook/adapter.ts` | `InternalEvent` built without `consumer`, with `agentId` from the wire's agent id (3) | Step 28 |
  | `src/hook/handler.ts` | `consumer = consumerKey(session, agentId)`; `writeSessionEvent` and the `observed_actions` append without `seq`; the `whisper_dropped_stale` fault replaced by `whisper_dropped_unverifiable` with `reason: 'stale_pointer'`; `EventContext`'s new members with stand-ins — `repoRoot` = `checkoutRoot` = the skeleton's repository path, `isWorktree: false`, `historyAvailable: false`, `indexStale` and `historyStale` `false`, `refTs` = the stored `ref_ts` or 0, `tuning` = Step 12's `tuningReader` (3) | Step 28 |
  | `src/blocks/answer_drift.ts`, `src/blocks/health.ts` | threshold reads move from `TuningReader.get` to `num`/`list` (3); consumer parameters typed `ConsumerKey` (3) | Steps 25, 26 |
  | `src/miner/cochange.ts` | the `landmines.upsert` calls are removed — the miner writes no landmine at 1R (2); `bump` passes the commit hash it already parses and a stand-in weight `1` (3) | Step 13 |
  | `src/index/indexer.ts` | the inline `DELETE FROM files` loop is removed — a file gone from the tree keeps its row at 1R (2); the `fts_paths`/`fts_symbols` inserts, which name the pre-1R columns, are removed, so `init` and `index` run at 1R with empty FTS tables (2); `files.upsert` passes `in_tree: 1` and `isSuspect(path)` (3) | Step 14 |
  | `src/index/indexer.ts` — Step 13's skeleton caller (made during Step 13's build, after 1R) | the skeleton `runIndex` builds the miner's `TuningReader` as `tuningReader(global, resolveRepoKey(repoPath).key)` and maps `MineResult.included` onto its existing `IndexResult.mine.commitsIncluded`, so the skeleton `index`/`init` verbs compile unchanged; both marked `SKELETON: 13` (3) | Step 14 |
  | `src/index/search.ts` | its FTS bodies (which read the pre-1R FTS columns) and its `LIKE` bodies (which are not AD-2's token fallback) return `[]` (1); no caller remains at 1R | Step 14 |
  | `src/bar/combinator.ts` (`confidenceOf`) | stand-in body consistent with `passesBar`'s (3) | Step 16 |
  | `src/hook/handler.ts` (further) | `targetPath` keeps the skeleton's cwd-relative value, `resultPaths: []`, `context: 'read'`, `role` from `consumerRole`, an empty `observed` reader, and a `recordDrop` stand-in (3); `consumerRole(consumer) === 'main'` replaces `consumer === 'main'` here and in `decideDeny`, since the old comparison can never match a `ConsumerKey` and would switch the block off (3) | Step 28 |
  | `src/hook/adapter.ts` (further) | `targetPathRaw` carried through (3) | Step 28 |
  | `src/miner/cochange.ts` (further) | `files.upsert` for a history-only path passes `in_tree: 0` (3) | Step 13 |
  | `src/diag/whisper_stats_fold.ts` | the fold body writing `window_start`/`upsertFold` is removed and the function returns `{folded: 0}` (2) | Step 30 |
  | `src/cli/verbs_skeleton.ts` | the `note --kind landmine` branch calling `landmines.upsert` is removed and prints "not built yet" (2) | Step 35 (deletes the file) |

  **Tests the reduction turns red** are marked with `node:test`'s `todo`
  option, `{ todo: 'SKELETON: 1R — <cause>; retired by Step <n>' }`, never
  deleted, skipped, or rewritten against the old types (collapse-hunt P7: a
  failing `todo` test reports `todo 1`, `fail 0`, and the run exits 0). Known
  at plan time: `test/unit/skeleton_e2e.test.ts` (its generators return no
  candidates and its 4-commit repository meets no corpus floor) — retired by
  Step 28, which deletes it. A further test the build finds red for this
  reason is marked the same way, naming the step whose full build owns the
  failing module, and recorded in the implementation log. So `npm test`, and
  the ctxoracle CI job that runs it, **stay green at 1R** with the count guard
  balanced (every `todo` file still counts). Then run the unit/build/convention
  tier: every test of Steps 1–12 must pass (none may be `todo`), which now
  includes `T-3-5`, `T-3-6`, `T-5-4`, `T-5-5`, `T-6-3`, `T-6-4`, `T-12-2`,
  `T-12-3` and the extended `T-4-1`, `T-6-1`, `T-7-1`, `T-8-1`, `T-9-1`,
  `T-10-3`, `T-12-1`. Owner-visible sanity check: a freshly migrated and seeded
  store shows `files.in_tree` and `change_weight`, `cochange_pairs.pair_weight`
  and no `a_count` column, `labelled_touches`, `stats_folds`, `symbol_tokens`,
  the `seq` columns, and `tuning` holding every 2026-09-26 seed with its
  `source`. Step 13's full build starts only after this checkpoint passes.
  **Checkpoint 4 fails while any `todo` or `SKELETON` mark remains**
  (`T-37-1`).

- **After Step 20 — Checkpoint 2: the whisper path at function level.**
  Boundary between component construction and orchestration; the genres,
  bar, composer, and delivery exist but no handler wires them. Run
  `T-13-1` – `T-20-3`. Owner-visible check: none yet (no hook path exists);
  the reviewer-visible check is that every generator's function-level test
  seeds a real store from its fixture and asserts the headline the AC
  demands.

- **After Step 28 — Checkpoint 3: the pipeline is complete and the first
  replays run through the built binary.** Boundary between component
  construction and orchestration for the block. Run `T-21-1` – `T-28-11`
  (the function-level tests of Steps 21–28 and the Step 28 replays:
  pipeline order, fail-open, produced-but-undelivered, the liveness row,
  the `hook integrity-check` verb). No acceptance
  replay of a genre or of the block exists yet (they are Step 38's), and
  no `init` verb exists — the replays run against stores the harness
  prepares through the substrate's own functions (Step 28) — so the
  owner-visible check is deferred to Checkpoint 4.

- **After Step 38 — Checkpoint 4: the acceptance set is complete before the
  exit run; the deny path and the whisper path are exercised together for
  the first time.** Every replay test passes — `T-38-1`–`T-38-24`,
  `T-38-26`–`T-38-31`, `T-38-34` and the Step 28–35 replays — in one run,
  with `T-37-1` confirming no `SKELETON` mark, `SKELETON: 1R` placeholder,
  `not implemented:` stub, or `todo` test remains (the runner reports
  `todo 0`); the deny
  fixtures run here *alongside* the whisper-path fixtures, never as an
  isolated first correctness gate (the collapse-log 2026-09-04 shape is a
  recognizer elaborated against its own fixtures with nothing else in
  view); the same `node scripts/run-tests.mjs --replay` run's `build_time`
  tier (Step 1) passes `grammar_inventory_check.test.ts` (`T-38-33`) and
  `marker_presence.test.ts` (`T-38-32`); the `cold-container` job passes
  (`T-38-25`).
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
issue S2: D-plan-29), and
`docs/reviews/2026-09-07-plan-tool-traces-6.md` (the round-5 correction of
issue S-2: the re-derivation of D-plan-24), and
`docs/reviews/2026-09-07-plan-tool-traces-7.md` (the round-5 correction of
issue M1: the amendment to D-plan-28), and
`docs/reviews/2026-09-07-plan-tool-traces-8.md` (the round-5 correction of
issue M3: D-plan-30); where the files disagree on a decision, the latest
file's chain is the one whose conclusion appears here.
The §7 steps that carry plan-level judgment beyond transcribing an
architecture decision are named against their entry so a reader can find
every such step: Step 1 (D-plan-2, D-plan-3, D-plan-13), Step 5 (D-plan-14,
D-plan-15), Step 7 (D-plan-28), Step 9 (D-plan-27), Step 12 (D-plan-7, D-plan-24),
Step 14 (D-plan-28, D-plan-29, D-plan-30), Step 15 (D-plan-29), Step 23 (D-plan-19,
D-plan-24), Step 25 (D-plan-9,
D-plan-27), Step 26 (D-plan-16, D-plan-27), Step 29 (D-plan-5, D-plan-12),
Step 31 (D-plan-6, D-plan-25, D-plan-28), Step 32 (D-plan-4), Step 33 (D-plan-25),
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
  in Step 28 (the first replay needs a binary to spawn and a store that
  binary can open — the harness prepares it through the substrate's own
  functions, Steps 4–15, since `init` is Step 31's), so no Verification
  field names a test that cannot run at its step.
  Multi-criteria score (topological validity, restraint pressure,
  checkpoints executable): B 1.0, C 0.67, A 0.

- **D-plan-2 — Dependency pins.** Runtime: `web-tree-sitter` 0.25.10 and
  `tree-sitter-wasms` 0.1.13, exact. *Reasoning.* V14 verified the two
  manifests (no install scripts, no native code) — a property that holds
  for 0.25.10 as well — and never a grammar load; executed 2026-09-11 (§4),
  0.26.13 and 0.27.0 load none of the 36 shipped grammars and 0.25.10 loads
  34 and parses 32, so the pin is the newest runtime that works with the
  grammar package AD-25 names, and a range would admit 0.26.x, which does
  not. The pin is plan-owned — the architecture decides packages (AD-25),
  never versions — and moves in either direction only with
  `probe:20_grammar_inventory` re-executed against Step 15's enumerated
  table. Dev: `typescript` 5.9.3, `@types/node` 22.20.1,
  `@types/emscripten` 1.41.6, exact. *Reasoning.* 5.9.3
  is the last release of the compiler line the Node type-stripping
  guidance and the 22.x typings are documented against; 7.0.2 is a native
  port two months old that removed options and changed defaults (§11.4) —
  the tsconfig avoids every removed option so a later bump is a version
  change only, but adopting it is a separate verified decision.
  `@types/emscripten` is the optional peer `web-tree-sitter`'s `.d.ts`
  needs for its `EmscriptenModule` global; without it, and without
  `emscripten` in `types`, `tsc` fails `TS2304` on any file importing the
  runtime (`probe:22_tsc_web_tree_sitter_import`). Score (documentation
  alignment, maturity, forward-compatible tsconfig): 5.9.3 1.0, 7.0.2 0.6.

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
  job, because nothing before Step 7 can create its tables; the rebuild's
  time is measured and printed by `T-29-1`'s own run, stated in Step 38's
  exit report — never Step 37's unit/build/convention tier, which never
  touches this fixture; Step 1's generator and `T-1-3` cover fixture
  repositories only.

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
  and lets "No." — OL-C5's direct answer — clear, though a one-character
  direct answer ("y", "n") is held too, since the substance test is
  length-only, not answer-aware — the accepted cost of that simplicity,
  escaped by one more character and counted the same way; content-free
  deferrals are the job of the stoplist and the filler set (D-plan-24), not
  the floor's; both miss directions are
  measured by `deny_despite_answer_text` and human corrections);
  `bar.recency_half_life_days` = 365 (AD-13 names the half-life `h` of each
  commit's weight in the evidence and gives no value: with `h` = one year, a
  commit counts half as much as one a year newer, so a pairing that has
  always held keeps its ratio at any age — a perfect pairing five years old
  still reads 1.0 — while a pairing whose files have since changed apart is
  outweighed within about a year by the solo changes after it; the former
  reasoning here, that the half-life "keeps a five-year-horizon pair alive
  at 1/32", was false against the floor — 1/32 × 0.9 = 0.028 < 0.6 — and
  described the retired multiplier, collapse-hunt H1; the staleness factor
  is now the architecture's `bar.stale_factor` 0.9, AD-14, no longer a plan
  seed); `diag.hooks_not_firing_gap_s` = 600 (AD-17's detector
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
  enumerated list, and both of its error directions are printed beside its
  count.**
  *Reasoning.* Every reachable shell write path is an open set; extending
  the list is the padding trap (collapse-log 2026-09-03 round 8: own a
  residual as a class), and the architecture already discloses the
  diagnostic as a proxy with both error directions. The honest floor
  states what the proxy recognizes and what it miscounts, so the exit
  number is read with both.

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
- **D-plan-24 — "Content-free deferral" is AD-9's two conditions as two
  predicates on the turn: the turn clears iff it has substance (the
  stripped text meets the small floor) and is not a deferral (a
  deferral-stoplist phrase present with nothing but deferral-filler words
  outside it); the stoplist holds multi-word phrases of AD-9's "I'll get
  to that" class only, the filler set is a closed `plan_seed` list of the
  words such a phrase licenses beside it without adding content, and there
  is no other vocabulary and no clause grammar.** *Reasoning.* AD-9 states
  two conditions — above a small floor, not a recognized content-free
  deferral — and FR-B1 names the class ("I'll get to that" — a
  content-free deferral does not clear); FR-B5 sets the lean: toward
  clearing on a substantive answer, with only an empty deferral failing to
  clear. Collapsing the two conditions into one measurement of the
  remainder (remove the phrase, clear when what is left meets the floor —
  the round-4 shape) makes any leftover characters substance, so "I'll get
  to that later." clears and the hold fires only on the bare phrase
  (executed, the round-5 collapse-hunt's nineteen inputs; three of the
  seven stoplist members could never hold). Each rule richer than AD-9's
  two conditions holds on an answer (executed, `probe:16_clear_rule_cases`):
  a sentence-level discard holds on "No — …, though I'll get to the rest
  later"; a clause-level discard with an acknowledgement lexicon holds on
  "Sure." and "Understood." as whole answers; a content-token predicate
  over the whole turn holds on "Later." and "Not now." with no recognized
  phrase — beyond AD-9's *recognized* class and onto one-word answers to a
  when-question. Under the two predicates the direct answers of the
  `T-23-2` case table clear at or above the floor, FR-B1's class holds with
  any number of filler words, every stoplist member can hold, a dressed or
  plan-stating dodge ("Sure, I'll get to that after the refactor.") clears
  on its content words, and an unrecognized deferral ("Later.") clears —
  the skeleton's designed under-hold, counted by Step 39's escape fraction
  and corrected through the human channel, exactly as AD-9 files the
  deferral-false-match miss; the filler set's own miss directions are
  stated with it (a filler word that was the answer is a wrongful hold
  escaped by one more word; a delay word outside the set is an escape the
  report counts), and the floor's own miss direction is the same shape: a
  one-character direct answer ("y", "n") is a wrongful hold escaped by one
  more character, since the substance test is length-only, not
  answer-aware. The rule is executed over the spec's examples, the
  direct-answer class, the reviewer-supplied deferral inputs, and the
  generated phrase × filler class by `probe:16_clear_rule_cases` (§11.4).
  Score (holds on FR-B1's class; clears every direct answer at or above the
  floor, one-word included; the hold requires a recognized phrase; no
  acknowledgement vocabulary or clause grammar; both miss directions named
  and measured):
  two predicates 1.0, content-token predicate on the whole turn 0.7,
  phrase-strip-then-floor described honestly 0.7.
- **D-plan-25 — `hooks_not_firing` has two detectors — the stale-session
  half (a liveness row whose transcript keeps growing without events) and
  the totally-dead half (transcripts for this repository's slug newer than
  the newest liveness row, or present with none, by more than the gap,
  excluding any transcript whose first entry predates the newest liveness
  row or `schema_meta.store_created_at`) — and `init` and `status` print
  the pinned interpreter with an existence check.** *Reasoning.* AD-17 and L7 say liveness rows "go stale", which is
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
  that can edit, and whose `session_id` is its own — executed,
  `probe:18_leg2_resume_protocol.optional` — and it needs neither premise: `init` runs before the session, the
  hooks load at its start, and the store and transcript it produces are on
  the machine that writes the report. The liveness row is then a genuine
  observable of live hooks, not a precondition no session can meet, and it
  is not a once-per-counted-session observable: each `--resume` continuation
  fires its own `SessionStart` (`source: resume`, confirmed by the probe),
  so a multi-turn counted session accumulates one liveness row per turn,
  strengthening rather than merely meeting the validity rule's "holds a
  `SessionStart` liveness row" clause (Step 39's Leg 2 validity rule). It
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
  Score (hooks live at the session's first event; the session can edit
  without denial; the session's `session_id` is its own, not the driver's;
  verified by the leg-2-shaped invocation itself, not the model seam's):
  scrubbed `-p` child with
  `--permission-mode acceptEdits` and `--resume` 1.0 (executed,
  `probe:18_leg2_resume_protocol.optional`: fresh `session_id`, a
  `SessionStart` row with `source: resume` on the continued turn, a real
  `Write` and a real `Edit` across the two turns, one settings-file
  `PreToolUse` deny of a requested `Write` recorded);
  a `-p` child with no permission mode named 0.3 (denies the edit outright —
  a `-p` session shows no prompt to approve it — the gap this decision
  closes); an interactive session 0.2 (hooks held back until a workspace-
  trust dialog no agent can accept, per the hooks reference's settings-file
  rule); a session created by remote session tooling 0.3 (a wiring written
  in one session is not there for the next, G3, and its container is not
  the machine that writes the report).
- **D-plan-27 — Every assistant text turn the catch-up classifies is
  recorded in a `classified_turns` table (`consumer`, `uuid`, `ts`,
  `clears`, `reason`), written by Step 25's catch-up beside the clearing
  path as an idempotent upsert keyed `(consumer, uuid)`, and read by Step
  26's `deny_loop` and `deny_despite_answer_text` detectors.** *Reasoning.*
  AD-9 defines the two detectors over intervening
  assistant text turns and their rejection reasons across events, while
  each hook event is a fresh process (AD-1) and no Phase A table held a
  classified turn, so a detector in event N could not see a rejection that
  happened in event N−2. Two shapes were weighed: passing the current
  catch-up's classified turns to the detectors and bounding their windows
  to one event loses the cross-event case the detectors are defined over;
  recording each classified turn is one small row per assistant text turn,
  has a same-phase writer (AD-4's uniform-table criterion), and is the only
  shape under which the detectors read state the store actually holds.
  The `resume`/`fork`/`compact` rebuild (AD-9) re-reads the whole
  transcript for the same consumer, so the record meets rows it already
  wrote: a plain insert under `PRIMARY KEY(consumer, uuid)` throws on the
  first previously-seen turn, the event fails open (AD-7), and — the
  bookmark never advancing past 0 — every later event fails the same way,
  no deny and no whisper for the rest of the session, a `store` fault the
  owner reads as corruption (`OL-10`). The record is therefore `INSERT …
  ON CONFLICT DO UPDATE` (the rebuilt questions state and the record come
  from one classification pass, so the detectors read what the block
  acted from; a `DO NOTHING` would keep a classification a tuned lexicon
  has since changed), and the rebuild's other writes are idempotent the
  same way — a human turn matched by `asked_uuid` first, a clearing turn
  closing the rows asked prior to it (AD-9's "all prior", unchanged in
  steady state), the lag detector reading newly recorded turns only — the
  AD-1 premise applied to every write, not only the reads. Deleting the
  consumer's rows and replaying from a clean slate would destroy the deny
  history the rows carry and a live row a compaction summarized away;
  skipping the rebuild abandons AD-9's path for `fork` and `compact`.
  Score (no constraint failure on the first resume; record agrees with
  the rebuilt state; deny history and live rows survive; steady state
  unchanged; no spurious lag fault; testable over a populated store):
  idempotent uuid-keyed writes 1.0, clean-slate replay 0.75, no rebuild
  0.58, `DO NOTHING` on `classified_turns` alone 0.5. `T-27-1` rebuilds
  over a populated store; `T-26-1` carries a case whose below-floor turn
  was recorded two events earlier.
- **D-plan-28 — The FTS5 DDL lives in its own migration,
  `001b_phase_a_fts.sql`, applied only when `schema_meta.fts_state =
  'fts5'` — a row the migration runner itself records from `init`'s probe
  result right after 001 creates `schema_meta`, once, never retried; the
  fallback's tables and indexes (`symbol_tokens`, `path_tokens`, and their
  token indexes; `symbols_name` until the 2026-09-26 correction, D-plan-36)
  are always created by 001; one module, `src/index/search.ts`, exposes `symbolSearch` and
  `pathSearch` with the implementation chosen by `fts_state` at call time;
  the migration runner reads the `.sql` files from the package's shipped
  `src/` tree.** *Reasoning.* AD-2 mandates that when the FTS5 probe
  fails, search falls back to indexed token-prefix queries behind
  the same interface and `status` says so; a migration that creates the
  virtual tables unconditionally makes `init` fail on a runtime without
  FTS5 after announcing the fallback, and a caller that knows which
  implementation ran is a second interface. The row's writer sits inside
  the runner's ordered walk because nothing can write `schema_meta` before
  001 creates it (AD-4) and 001b's decision must follow it: `init` writing
  the row between two runner calls would split that walk and give the row
  two writers, and a runner that probes FTS5 itself could force the
  `'fallback'` state in `T-7-1` only through a doubled probe; so `init`
  passes the probe result as the runner's `fts` flag, the runner records
  the row when the key is absent and decides 001b by the row, and a later
  run cannot flip a store's state (AD-25's forward-only migrations; the
  rebuild path is `deinit --purge` then `init`, Q7). Under this shape no
  caller (the indexer, the Orientation and Reuse genres) knows which ran;
  `T-7-1` runs the migrations under both flags, asserts the recorded state
  and its write-once rule, and `T-14-1`/`T-15-3` assert the same hit set
  under both — paths at T-14-1 (empty frontend list), symbols at T-15-3
  (`defaultFrontends()`, D-plan-29's split); shipping the `.sql` files in
  `src/` (Step 1's `files` list) with
  the runner resolving them from `import.meta.url` means `tsc`, which
  emits no `.sql`, needs no copy step. This is AD-2's own requirement given
  a shape, not a new capability. Score (executable on an empty store; one
  writer of `fts_state` on both paths; prose and signature agree; both
  states forced in `T-7-1` without a double; never-retried semantics
  explicit): the runner records the row 1.0, `init` writes it between two
  runner calls 0.7, the runner probes FTS5 itself 0.7.
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
  cap, redaction, the lock, the fallback/FTS equivalence over path tokens),
  Step 15's new `T-15-3` asserts what Step 15 adds (symbols, edges,
  `symbol_refs`, `entry_score`, `test_map`, the equivalence over symbol
  tokens), nothing is doubled, and the consumption is visible to the
  build-order check because `defaultFrontends` is a provided name its two
  callers consume with S15 declared. Score (every step consumes only what
  exists; each step's test asserts what it builds; no renumbering; visible
  to the check; nothing doubled): argument 1.0, reorder 0.8, assertions
  only 0.5.
- **D-plan-30 — `refreshIfStale` resolves `HEAD` in-process through named
  bounded reads — `.git` (directory or `gitdir:` file), the common
  directory (`commondir` when present), `HEAD`, then the loose ref or one
  `packed-refs` scan — and a ref it cannot resolve is a `head_unresolved`
  diagnostic, never stale; `runIndex` records `index_head` through the same
  resolver.** *Reasoning.* AD-23 places the staleness check on the event
  path as "a bounded `.git` file read, not a subprocess", and AD-17's
  detector is `index_head ≠ HEAD` where `index_head` is a commit; on every
  ordinary checkout `.git/HEAD` is the symbolic line `ref:
  refs/heads/<branch>`, so reading `HEAD` alone compares a hash to that
  line and reports stale at every `SessionStart` — a reindex every
  session, the storm the detached, lock-protected refresh exists to avoid.
  Git's documented layout fixes what the bounded reads are: the `.git`
  entry (a directory, or a file naming `gitdir` for a linked worktree or
  submodule), the worktree's own `HEAD`, the common directory its refs
  live in, a loose ref file or the `packed-refs` line. A `git rev-parse
  HEAD` subprocess resolves every case but is outside AD-23's inventory;
  comparing the raw `HEAD` text misses a branch that advanced — the case
  `index_stale` exists for; treating a symbolic or unresolvable `HEAD` as
  stale makes the storm policy. Resolving in-process names every read with
  its bound (each file a single bounded read; `packed-refs` bounded by the
  ref count), detects the moved branch on an ordinary checkout, a detached
  `HEAD`, and a linked worktree alike, and files the case it cannot read
  as a visible diagnostic (`head_unresolved`, Step 6) instead of a silent
  reindex; `runIndex` recording `index_head` through the same function
  keeps the two sides comparable. `T-14-2` runs the four layouts on the
  real fixture with real `git` and the unborn-branch case. Score (inside
  AD-23's inventory; detects an advanced branch on an ordinary checkout;
  handles detached, worktree, packed; an unresolvable layout cannot cause
  a reindex every session; testable on the real fixture): in-process
  resolution 1.0, `git rev-parse` 0.8, raw-text comparison 0.7,
  symbolic-means-stale 0.5.
- **D-plan-31 — `recordRegret` runs at both of AD-18's mandated run points;
  the index-time call at the end of `runIndex` defines a cross-session
  "reverted" as a match against `files.content_hash`'s own persisted
  snapshot, gated by a plain write-since-watermark check, disjoint from
  `SessionEnd`'s in-session check because `SessionEnd` never reads that
  column.** *Reasoning.* AD-18 states the run points as a decision, not a
  possibility — "at `SessionEnd` (and at index refresh)" — and leaves only
  the *population* at the second point to the plan; a plan that deletes the
  run point instead of defining its population overrides the architecture
  rather than implementing it. A first attempt at the population (comparing
  the current hash to `observed_actions.priorSessionHash`, "the
  second-most-recent `'ok'` Edit/Write row's hash") cannot work: `content_hash`
  only ever records the hash *after* an edit (Step 7's DDL comment), so a
  revert to the pre-tracking baseline — the common case, and the one
  `T-30-1` specifies (one edit, one revert-edit, two sessions total) — is a
  value no row's `content_hash` ever holds, and no comparison among
  post-write hashes can detect a match against it. `files.content_hash`
  (Step 14) *does* hold exactly that baseline: it is the snapshot from the
  previous `runIndex` pass, already read by that pass's own incremental
  diff for an unrelated purpose. Comparing the path's current on-disk hash
  to `files.content_hash`'s pre-pass value, gated by
  `observed_actions.writtenSinceSeq(path, sinceSeq)` (Step 9) being true — so
  an untouched file, which trivially always matches its own last-indexed
  hash, is never mistaken for a revert — correctly detects a net reversion
  regardless of how many edits or sessions produced it, using data Step 14
  already holds plus one boolean existence check. This must be evaluated
  independently of whichever files `runIndex`'s own incremental-diff
  optimization treats as unchanged and skippable for its own purpose: a
  net-reverted file is unchanged by that same measure and would never reach
  a regret check gated on the walk's own diff flag, so the regret pass
  queries `observed_actions` directly over the paths of store-held facts,
  not over whichever files the walk chose to revisit. Disjointness from
  `SessionEnd` follows structurally rather than from a session-difference
  guard on matched rows: `SessionEnd`'s in-session definition only ever
  compares against a hash produced by an edit recorded within that same
  session and never reads `files.content_hash` at all, so a match against
  that column is never something `SessionEnd` could already have reported,
  independent of how many sessions the churn spanned. `sinceSeq` — a new
  `schema_meta.regret_index_seq` key holding the largest
  `observed_actions.seq` the pass read (a `seq`, not a time, since the
  2026-09-26 expert review's M7 — the fold's N11 race) — bounds the existence
  check and advances after each pass, the same watermark shape AD-5 uses for
  the fold, so a reported cross-session revert is reported once. No new table: AD-4's uniform table-creation criterion (no table
  without a same-phase writer) argues against a revert-history table
  duplicating data a boolean churn check plus `files.content_hash` already
  answers — and no code path removes an `observed_actions` row short of a
  whole-store `deinit --purge` (Step 9's DAO provides no delete/prune
  method; Step 32, line 3816, confirms `--purge` deletes the project store
  file itself), so the `writtenSinceSeq` check is never reading a selectively
  pruned history. Score (implements both of AD-18's run points; no new
  schema table; the two run points are disjoint by construction; correctly
  detects a revert to a value that predates every recorded edit for the
  path, which a pure `observed_actions` hash-chain comparison cannot;
  testable with a two-session replay): `files.content_hash` match gated by
  `writtenSinceSeq` 1.0, `observed_actions.priorSessionHash` hash-chain
  matching 0.4 (provably fails `T-30-1`'s own two-edit scenario — the
  target hash predates every row `observed_actions` holds for the path — a
  design this issue tried, committed, and is now withdrawing), a dedicated
  revert-history table 0.7 (duplicates data already available, violates
  AD-4's creation criterion), dropping the index-time call site 0.3 (an
  architecture override by omission, not a resolution — and the population
  it claims is undefinable is exactly what this decision defines).

- **D-plan-32 — The detached reindex's mutual exclusion is a `schema_meta`
  claim row taken inside one `BEGIN IMMEDIATE` transaction, released in a
  `finally`, refused with `reindex_locked`.** *Reasoning.* AD-26 wants one
  reindex at a time with a handler that never waits; the "directory lock"
  it names, written as Step 14 first had it (a `wx` file, a pid, liveness
  reclaim), lets two reclaimers of a stale lock both win (29 of 200
  executed races, §4), and every file-level repair the parallel lineage
  tried moved the check-then-act one syscall later. The store's single
  writer — the standard AD-26 itself cites — makes the check and the claim
  one step (`probe:26_reindex_claim_row_race`: 200 of 200 races, exactly
  one winner), needs no new primitive, and the handler's staleness check
  reads the row without waiting. `status` prints a held claim with its
  `reindex_started_at` (Step 33), so a claim older than any plausible pass
  is visible rather than silent (`OL-10`).

**Decisions of the 2026-09-26 plan pass (D-plan-33 – D-plan-44).** These
were reasoned in writing in this pass, **without** the Clear Thought MCP
server or CodeGraph, neither of which was available in this session (§15
records the gap); each carries its evidence in the step it governs and its
executed premise in §11.4. The gap-list review's own decisions are recorded in
their owning steps (§14.5) and are not repeated here; these are the choices
the plan made where the review and the architecture left one open. Each
carries its rejected alternatives, and each has its author's four-step
collapse test in §10A (added after both 2026-09-26 plan-pass reviews found
none — expert review M1, collapse-hunt H14 — and written to incorporate their
outcomes).

- **D-plan-33 — The reopened substrate is built first, edited in place, and
  re-verified as Checkpoint 1R.** *Reasoning.* Steps 13–39 consume the
  corrected types, schema, and DAOs; building Step 13 on the built Step 7
  would bake `a_count` back in. No store has shipped, so an in-place edit of
  001/001b/002 is the correct form (the review's G16 reasoning); a forward
  migration would ship a v1 schema nobody ever ran. The skeleton modules the
  deltas break are declared in the Step 6 and 9 deltas and reduced by one
  written placeholder rule, and the tests that reduction turns red are
  `todo` until their step retires them, so Checkpoint 1R stays green without
  a behaviour decision (expert review S1; collapse-hunt H12, H13). *Rejected:*
  a new "Step 12a" (it would separate each correction from the artifact it
  corrects, so a reader of Step 7 would read a wrong schema); forward
  migrations (no shipped store to migrate); a "compile-only rename" adaptation
  (false — the new required fields force genre, composer, and miner choices,
  S1); a red build from the Step 6 delta until each step is rebuilt (the
  checkpoint and CI would fail for months of steps, and a red suite hides new
  failures). §6, §7, §9.
- **D-plan-34 — A miner landmine's evidence ratio is `min(1, support /
  bar.hazard_full_support)`** (adopted into AD-14; `bar.hazard_full_support`
  seed 3, `architecture_default` since `6cff0ce`). *Reasoning.* AD-14 defined
  confidence from pair support and ratio and gave a hazard none, while FR-A5a
  requires a hazard's confidence to be stated (flagged); a saturating support
  count is FR-A5a's "real vs coincidental" test in ratio form, and it leaves a
  support-2 landmine uncertain, so AC-3a's below-floor hazard is delivered
  flagged (`T-16-2`, `T-38-16`). The ratio has no base-rate term — three
  reverts among 500 changes read as strong as three among four — so each
  Warning's audit row records the file's `change_count` beside its support
  and the exit report compares false-fire rates across them (L13; Steps 18,
  39). *Rejected:* a constant tier (no per-fact information — the exact
  defect AD-14's second pass removed); sharing `bar.support_min` (the plan's
  first form: re-tuning the pair floor would re-tier every Warning as a side
  effect — collapse-hunt H10). Steps 12, 16, 18, 39.
- **D-plan-35 — `cochange_pairs.last_commit` and `corrections.genre` exist
  (first plan columns; adopted into AD-4 in db9ecf9).** *Reasoning.* AD-15's pair headlines require a commit pointer and
  AD-5/AD-18's fold attributes a whisper-less miss by `--genre`, yet AD-4's
  column lists give neither a home; a column is the only way to carry a fact
  from write time to read time without a `git` subprocess on the event path
  (AD-23) or an in-band `note` sentinel (the normalization rule AD-4 itself
  cites). Raised in §16 item 5 and adopted into AD-4 (db9ecf9).
  *Rejected:* `git log` at compose time (forbidden on the event path);
  headlines without a commit (FR-D1's verifiable pointer becomes the file
  alone, and AD-15's column is violated). Steps 7, 9, 13, 30, 34.
- **D-plan-36 — Both search paths read one in-house tokenizer; the fallback
  is token-prefix over indexed token tables.** *Reasoning.* N6 requires the
  FTS and fallback paths to agree on token-prefix semantics; executed, the
  built `symbols_name` index was never used by `LIKE` (a full scan — O(store)
  on the event path, which AD-23 forbids), and no `LIKE` over `files.path`
  can match a middle segment with an index. Step 14's `tokenize` (NFKD,
  lowercase, combining marks removed, split on non-letter/non-digit) produces
  every token; the indexer writes those same tokens into the FTS tables
  (through the `ascii` tokenizer, which splits only at the spaces joining
  them) and into `symbol_tokens`/`path_tokens`; both paths run the same
  prefix test over the same token sets, so they are **the same by
  construction** — not by a claim about two tokenizers agreeing (`T-14-5`).
  The earlier form — a `NOCASE` name index beside a `unicode61` FTS table —
  was called "provably the same query" and was not: `NOCASE` and `LIKE` fold
  ASCII only, so `LIKE 'über%'` missed `Über`, and `LIKE` never matched
  `café`, `bar`, or `method` inside `CAFÉ`, `foo-bar`/`Foo::Bar`,
  `my.method` (expert review M3; collapse-hunt H4, both executed).
  *Rejected:* `%term%` scans (O(store)); a `NOCASE`/`LIKE` fallback beside
  SQLite's `unicode61` (two tokenizers, which disagree on non-ASCII case and
  on punctuation); a single normalized-name column (a prefix query for a
  name's second token cannot use its index — §16 item 5). Steps 7, 9, 14.
- **D-plan-37 — `--missed-question` arms the session of the most recent
  event (or `--session`), says which, and refuses an ended one** (AD-18 at
  `6cff0ce`). *Reasoning.* The per-session consumer key (AD-4) makes
  "thereafter denied" need a session; OL-C5's "their next move" is the move of
  the agent Max is working with — the session whose event is newest in
  `session_log` by `seq`. Printing the armed session lets Max see a wrong
  choice; refusing an ended session keeps a report from arming a session that
  can never fire. *Rejected:* the newest liveness row (the plan's first form:
  it names the most recently *started* session, which may be a second
  session or an ended one — collapse-hunt H5); arming every session (a
  question asked in one session would deny in another — the executed G23
  defect); requiring `--session` always (a non-programmer owner does not
  know session ids, OL-11). Steps 9, 10, 34.
- **D-plan-38 — The AC-8a backstop line is a whisper-shaped candidate that
  skips the bar and the rumor rule but not dedup or audit.** *Reasoning.* N2
  requires audit-then-emit; the line is the block's backstop, not a repository
  fact (AD-9), so the bar's axes and the pointer rule do not apply; dedup by
  the open-question set keeps the identical line from repeating at every
  Stop while a new question still speaks (FR-A4). *Rejected:* emitting the
  line outside the audit (the executed N2 defect: an intervention the FR-X6
  trail did not hold); passing it through the bar (a question quoted back is
  not a repository fact, so it has no evidence ratio or pointer to judge, and
  the confidence floor would silence the block's own backstop); no dedup (the
  identical line at every `Stop` while the question stays open — FR-A4's
  repeat). Step 27.
- **D-plan-39 — The fork reseed recovers oracle text by its own one-line
  prefix and admits every tool result that does not carry `is_error: true`**
  (AD-16 and V23 at `6cff0ce`). *Reasoning.* The injected-text shape in a
  transcript is undocumented and unobserved here; keying on the composer's
  single-line `[oracle] ` form works under any wrapper that keeps the line
  whole. Exactly one failure is loud: `[oracle] ` lines found and none
  matching an audited text records `rebuild_recovered_nothing` (set
  `delivered`); no `[oracle] ` line at all records nothing (§15 PG-6). A
  transcript tool result marks failure, not success: across 24 local
  transcripts, no successful Read (373), Edit (89), or Write (12) result
  carries an `is_error` field, and the one failed Read carries `true` (V23;
  collapse-hunt P4). **Collapsed and rebuilt 2026-09-26:** the first form
  admitted only `is_error: false`, citing "227 of 320 results" — a total over
  all tools; split by tool, `false` appears only on Bash, so the read-set
  reseed admitted nothing on any real transcript, and its test fixture pinned
  a Read shape real transcripts do not have. *Rejected:* keying on a guessed
  attachment type (unverifiable); requiring `is_error: false` (dead on the
  observed layout — the collapse); dropping the read-set reseed (it is
  implementable on the observed layout, and AD-11's
  `transcript_layout_changed` detector guards a layout change). Steps 19, 20,
  21, 28.
- **D-plan-40 — Grep/Glob result paths are read from
  `tool_response.filenames`, except in a Grep mode that does not list files.**
  *Reasoning.* G21 requires the touched files of a search, which only the
  tool's response carries; the hooks reference documents no Grep/Glob
  response schema, so the plan names the field it reads — the installed
  Claude Code's own output schema, whose `content` and `count` Grep modes
  return `filenames: []` whatever matched (collapse-hunt P5) — records a
  `mode_unsupported` response and an unrecognized one as two separate counted
  zeros in `status`, and lists the premise in §15. *Rejected:*
  `tool_input.path` (a directory — the skeleton's defect); silence for all
  searches (Coupling's Grep/Glob trigger in AD-15 would be dead by
  construction); counting an empty `filenames` array as recognized (the
  plan's first form: every content- or count-mode Grep was a silent zero —
  collapse-hunt H3); parsing paths out of `content` (undocumented text). Steps
  6, 28, 33.
- **D-plan-41 — A single-file history fact passes the marginal axis**
  (adopted into AD-14's class list). *Reasoning.* It aggregates over commits
  the agent has not enumerated — a revert-chain or fix-chatter label is the
  result of classifying commits, the same aggregation clause that admits a
  Reuse dominance claim, not one call's output — and FR-A5a requires a hazard
  to be spoken with its confidence, which a marginal axis that failed it would
  forbid; Warning's AC-3a path would otherwise fail by construction.
  *Rejected:* failing it as a single-file fact (AC-3a and FR-A5a dead by
  construction); the plan's first rationale, "invisible from a cold checkout"
  (false in a full clone: `git log -- <file>` is one call; the aggregation
  clause is what holds — collapse-hunt H9); a Warning-only exemption from the
  marginal axis (a genre term in the bar, which D-18 forbids). Step 16.
- **D-plan-42 — The handler opens stores with `mode=rw`, never creates one,
  and tells a missing store from an unreadable one.** *Reasoning.* Executed,
  `DatabaseSync` creates a missing file, so an event after a store was
  deleted would create an empty store — per-repository state without `init`
  (N15). The `file:` URI with `mode=rw` refuses atomically; a `stat` first
  would leave a create-on-race window. SQLite returns the same errcode 14 for
  a missing file, a missing directory, and a directory at the path
  (collapse-hunt P2), so after the refusal — when nothing was created and no
  race exists — a `stat` decides: `ENOENT`/`ENOTDIR` is `StoreMissing`,
  anything else `StoreUnreadable` with its own `repo_not_bound` reason
  (collapse-hunt H8). *Rejected:* reading every CANTOPEN as a deleted store
  (it would tell Max his store was deleted when it is a permission or layout
  problem); a pre-open `stat` (the race). Steps 3, 6, 28.
- **D-plan-43 — A global import merges bindings (this machine's win on the
  same path); the owner's exports are imported into a separate home** (AD-5
  at `6cff0ce`). *Reasoning.* Bindings are paths, which differ between
  machines, and AC-19 requires the global store to round-trip; keeping this
  machine's bindings and listing the imported ones whose roots are missing
  is honest and recoverable (`init`). At the exit run the agent's leg-2 clone
  and Max Cogar's local store share one commit key, so importing into the
  shared home would overwrite the leg-2 project store. *Rejected:* replacing
  the bindings wholesale (the plan's first form: it silently unbound every
  repository this machine had that the export lacked — collapse-hunt H7);
  the imported binding winning on the same path (it would point this
  machine's checkout at a store key it may not hold). Steps 32, 39.
- **D-plan-44 — A revert-labelled commit is never fix-labelled, and
  `index.entry_marker_points` is a `plan_seed` of 1.** *Reasoning.* git
  writes a revert's subject as `Revert "<original>"` (executed), so a revert
  of a fix carries the `fix` token and would count an undo as fix chatter;
  the marker weight is the one number AD-12's marker rule needs and does not
  state — 1 keeps a marker file with in-degree 0 rankable without outranking
  a hub, and is printed with every seed; whether it ever names a real entry
  file is measured, not assumed — the exit report counts, per Orientation
  whisper, the files named by the marker bonus against those named by
  in-degree (Step 39; collapse-hunt H11). *Rejected:* letting a revert also
  count as a fix (an undo of a fix would read as fix chatter); no marker
  weight (a `main.ts` nothing imports scores 0 and can never be named —
  AC-1a's first shape dead by construction). Steps 12, 13, 18, 39.

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

1. **Job.** Build on a dependency pair executed to load and parse the
   grammars the indexer needs, so a measurement taken at exit is a
   measurement of a known, working dependency set.
2. **Hardest question.** *The architecture's V14 names 0.26.13 and the
   plan pins below it — the plan is overriding the architecture — and an
   exact pin on a backport line with no successor in a year freezes the
   project on an abandoned runtime.*
3. **Answer.** V14 verified a manifest, not a load — its own Result column
   says only that a C-3-compatible runtime "exists" — and L6 deferred the
   loaded-grammar check to build; executing it at plan time (§4) found the
   0.26 line loads nothing, which the build would otherwise have found at
   Step 38. The architecture decides packages (AD-25), never versions, so
   the plan records the conflict in §4 the way it records V6's and edits
   no architecture text. The freeze is real and owned: `tree-sitter-wasms`
   is equally unmaintained (one release, 2025-10-07), so the runtime line
   that matches it is the honest choice; the named exit — vendored
   `dylink.0` grammar files, which load under 0.25.10 and 0.27.0 alike —
   is recorded in §16, and the pin moves only with probe 20 re-executed.
   Cite: AD-25 (packages; no native code, no install scripts); C-3; V14;
   L6; `probe:20_grammar_inventory`;
   `probe:21_web_tree_sitter_026_loads_nothing.optional`.
4. **Steers toward.** Reproducing an executed surface by default, and
   re-executing before moving it. **Guide, not gate.**

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
   one-mark noise — though not only those: a one-character direct answer
   ("y", "n") is held too, a length-only test's accepted cost (`T-23-2`) —
   and `T-38-30` clears on "No.". Cite: spec §5.2, §11.5,
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
   owner-local interactive transcript. A `remote-container` corpus is not
   a second candidate for *verified* — it is the mode already measured
   (the §11.4 read shows markers present there) — and leg 2's
   `report-machine/claude-p` corpus is a third, distinct mode: V12 shows a
   `claude -p` transcript's genuine prompts carry no marker at all, so
   this corpus can never carry L11(a)'s evidence, by construction, not by
   absence of a read. Cite: AD-24 (build-time verifications);
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

1. **Job.** Keep the bypass diagnostic an honest proxy whose two blind
   spots are printed with its number.
2. **Hardest question.** *"Printed beside the count" is disclosure, not
   measurement; the exit report still cannot say how much Bash drift
   happened.*
3. **Answer.** Correct, and that is L3's owned residual: Bash is never
   denied in Phase A because the protected class is indistinguishable
   model-free (`D-39`), so the diagnostic measures the one shape the
   architecture can see (retry of a denied target through a shell write)
   and says so. Phase B's judgment narrows it. Cite: AD-9 (proxy, both
   directions stated); L3; `D-39`.
4. **Steers toward.** Reporting both directions with the count. **Guide,
   not gate.**

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

#### D-plan-24 (two-predicate clear rule: substance, and not a recognized deferral)

1. **Job.** Let every answer clear the block, including a one-word one at
   or above the character floor, while a recognized deferral carrying
   nothing but filler never does.
2. **Hardest question.** *The filler set is a vocabulary — the thing the
   previous shape refused — and it cuts both ways: "I'll get to that
   later" is held even when "later" answers a when-question, while "Sure,
   I'll get to that after the refactor" still walks through on "sure"; the
   recognizer now holds on a word it cannot understand and releases on one
   it cannot judge.*
3. **Answer.** Yes — and each direction is the one the spec assigns. The
   filler set names no answer word: it is closed, printed as a
   `plan_seed`, and holds only beside a recognized phrase, so an answer
   clears on any token outside it (FR-B5's lean) and the one wrongful hold
   it can produce — a filler word that was the answer — is escaped by one
   more word and filed where AD-9 files the deferral-false-match miss, the
   human channel. The dressed dodge clears because a content word is what
   the skeleton cannot judge (`AC-2a-ii`, Phase B); §11.5 asks Phase A to
   measure how little the conservative recognizer catches, a deny escaped
   by a text turn is a report field (Step 39), and `ctxoracle correct` is
   where the dodge that matters is filed. What the rule no longer does is
   call the bare phrase "the class": FR-B1's deferral with any number of
   filler words holds, which is the owner's case (OL-C3). The floor's own
   miss — a one-character direct answer held for being short — is
   symmetric to the filler-word miss above, a length-only test's accepted
   cost, measured the same way (`deny_despite_answer_text`, D-plan-7).
   Cite: FR-B1,
   FR-B5, P3; AD-9 ("not a recognized content-free deferral"; the two miss
   classes); spec §11.5; `AC-2a-ii`; L1.
4. **Steers toward.** Clearing on any content and counting the escapes.
   **Guide, not gate.**

#### D-plan-25 (totally-dead detector and interpreter pin)

1. **Job.** Make a wiring that never fires visible to the owner at the
   next CLI use — the failure OL-10 was raised for.
2. **Hardest question.** *A transcript newer than the newest liveness row
   is also what a session in another checkout of the same repository, or
   a session that started before `init`, produces — the detector will cry
   wolf and the owner will learn to ignore it; and a `store_created_at`
   fixed at first creation goes stale the moment hooks are unwired and
   rewired later (`deinit` without `--purge`, then `init` again) or a
   store is `export`ed/`import`ed into a fresh checkout — the exact
   session that re-wires hooks in either case is exactly as exposed as
   the original bug.*
3. **Answer.** The detector is scoped to this repository's `cwd` slug and
   excludes any transcript whose first entry predates the newest liveness
   row or `schema_meta.store_created_at` (Step 7; written by `init`, Step
   31, at first creation and again whenever `init` genuinely re-wires a
   missing hook entry — never on the idempotent no-op case — so the value
   tracks the *last* moment hooks started firing, not only the first;
   immune to the filesystem-`birthtime` portability problem an earlier
   draft of this answer relied on, since Node documents `birthtime` as
   filesystem-dependent and sometimes unavailable, §11.4): a pre-`init`
   transcript is excluded outright, whether it is idle or still growing at
   the moment `init` first runs, so the very session installing the tool
   is never itself flagged. This same re-write is what closes the second
   half of the hardest question: a `deinit` (no `--purge`) removes the
   hook entries without touching `schema_meta`, so the entries are
   genuinely missing when `init` runs again, and that re-`init`'s own
   entry-append triggers the overwrite — the re-installing session is
   protected exactly like the original installing session was; the same
   holds after `export`/`import`, since Step 31 item 2's keying-mode
   migration path runs a normal `init` (with its own item-4 entry-append)
   against the newly-imported store immediately after the migration. A
   session in the same checkout that *starts* after the *latest* genuine
   re-wiring with no liveness row IS a dead wiring, whatever the cause,
   and the detail names the pinned interpreter and whether it exists so
   the likeliest cause is on the screen. False
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
   settings-file workspace-trust rule (§11.4);
   `probe:18_leg2_resume_protocol.optional` (the counted-session
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
   record holds. The record survives the `resume`/`fork`/`compact` re-read
   because its write is an idempotent upsert, so what the detectors read
   after a resume is the same pass's output, never a constraint failure.
   The independent grade is elsewhere: Step 39's labelled
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
   recorded state — seeded once from `init`'s probe by the runner that
   applies it, so it exists before anything reads it and no later run
   flips it — two indexes that cost nothing under FTS5, one interface with
   the choice made in one place. `T-7-1`, `T-14-1`, and `T-15-3` run both
   paths in
   every CI run, so the path has a user on every pull request whether or
   not the exit run's machines lack FTS5, and `status` names the state so
   the owner knows which path he is on. Cite: AD-2; AD-25;
   `probe:02_sqlite_features` (this runtime's FTS5 state); `T-7-1`,
   `T-14-1`, `T-15-3`.
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

#### D-plan-30 (in-process `HEAD` resolution)

1. **Job.** Let the staleness check tell a moved branch from an unchanged
   one on the owner's real checkouts — ordinary, detached, worktree,
   packed — without a subprocess on the event path and without a reindex
   every session.
2. **Hardest question.** *A hand-written reader of git's internal layout
   is a second implementation of `rev-parse` that will be wrong the day
   git changes `packed-refs`, reftable, or the worktree layout — and the
   failure mode is silent under-detection dressed as a diagnostic.*
3. **Answer.** The reader covers the on-disk layout git documents and has
   kept across its major versions (loose refs, `packed-refs`, `gitdir:`
   files, `commondir`), and its failure is not silent: a layout it cannot
   read produces `head_unresolved` on every `SessionStart`, which `status`
   shows by code and the exit report carries, so a reftable-format
   repository is reported the first time the oracle meets one rather than
   reindexed forever or never; the alternative inside the inventory does
   not exist (a subprocess is outside it, AD-23), and staleness only
   lowers confidence (`FR-K7`), so under-detection costs a confidence
   flag, never a wrong deny. Cite: AD-23 (the inventory; no `git`
   subprocess on the event path); AD-17 (`index_stale` = `index_head` ≠
   `HEAD`); AD-12; `FR-K7`; `T-14-2`.
4. **Steers toward.** Reading the named files and reporting what cannot
   be read. **Guide, not gate.**

#### D-plan-31 (regret proxy: both AD-18 run points, disjoint by construction)

1. **Job.** Let the regret proxy see a revert wherever it actually happens
   — inside one session, or spanning several — without any call site
   resting on a population nothing defines, and without double-counting
   one event as two regrets.
2. **Hardest question.** *`files.content_hash` already predicts "unchanged"
   whenever the current hash matches the last-indexed one — a normal
   incremental walk uses exactly that to decide which files to skip
   re-processing. If a net-reverted file looks unchanged by that same
   measure, how does this check ever run on it instead of being skipped
   before `recordRegret` is ever reached?*
3. **Answer.** The regret pass does not ride on `runIndex`'s own
   change-detection walk; it queries `observed_actions` directly for the
   paths of store-held facts — the existing population bound (AD-18) — and
   checks `writtenSinceSeq(path, sinceSeq)` for each. A net-reverted path is
   exactly the case where `writtenSinceSeq` is true (something happened) while
   the walk's own current-vs-last-indexed diff reads "unchanged" (nothing
   net happened) — the conjunction the walk's own optimization is not asking
   for, since it only needs the second half to decide what to re-index. The
   two checks answer different questions on purpose: `runIndex`'s walk asks
   "did the file change since the last pass" to decide what to re-index;
   this asks "did the file change and change back," which the first
   question cannot see by construction. Cite: AD-18 (both run points
   mandated; population is the plan's to define); Step 7 (`content_hash`'s
   DDL comment: post-write only, never the pre-tracking baseline — why a
   hash-chain comparison over `observed_actions` alone cannot detect a
   revert to that baseline); Step 9 (`files.content_hash`, already read by
   `runIndex`'s own diff; `writtenSinceSeq`, the plain existence check); AD-5
   (the watermark pattern this reuses); `T-30-1` (asserts one regret row
   across both `SessionEnd` calls and both `runIndex` calls for the same
   cross-session revert to the pre-session baseline, and zero before
   `runIndex` runs).
4. **Steers toward.** Two call sites, one population definition each,
   provably disjoint because each reads a value the other never touches.
   **Guide, not gate.**

#### D-plan-32 (reindex claim row)

1. **Job.** Keep two reindex passes from running at once — a second pass
   over the same range double-counts `cochange_pairs` and rewrites
   `symbols` under the first — without the handler ever waiting.
2. **Hardest question.** *A row in the store is not a lock: the winner can
   die holding it, its pid can be reused by an unrelated process, and the
   "release in a `finally`" never runs on `SIGKILL` — so the claim is
   either stuck forever or reclaimed by liveness, which is the same
   check-then-act the file lock had.*
3. **Answer.** Liveness reclaim is kept, but the check and the write happen
   inside one `BEGIN IMMEDIATE` transaction, so the second reclaimer's read
   serializes behind the first's commit and sees the live winner — that is
   the difference the executed race shows (0 of 200 double wins, against
   29 of 200 for the file lock). Pid reuse is the residual: a reused pid
   makes a dead claim look live until that process exits, which delays a
   reindex and never corrupts one; `status` prints the claim with its
   `reindex_started_at`, so a claim older than any plausible pass is
   visible to Max Cogar rather than silent (`OL-10`). Cite: AD-26 (single
   writer; the handler never waits; `FR-K7`); AD-12; §4;
   `probe:26_reindex_claim_row_race`.
4. **Steers toward.** One reindex at a time, visibly. **Guide, not gate.**

#### D-plan-33 (reopened substrate first, edited in place, Checkpoint 1R)

1. **Job.** Build the whisper path on a substrate that records history
   truthfully — the old one gave every pair ratio 1.00 (G3), so every Coupling
   whisper would have stated a false ratio to the agent.
2. **Hardest question.** *In-place edits of 001/001b/002 are safe only if no
   store with the old shape exists; and the skeleton modules of Steps 13–39
   must change to compile against the new types — who decides what they do
   in the meantime, and what stops the suite from going red, or green by
   deleting tests?*
3. **Answer.** No store has shipped (the skeleton ran only against scratch
   stores; the collapse-hunt found no `~/.ctxoracle` and no settings file
   naming `ctxoracle`), so AD-25's forward-only rule, which governs shipped
   stores, is not engaged. The skeleton reduction is a written rule, not a
   judgement: the files are declared (Step 6/9 `modify:`), each placeholder
   is one of three forms and listed with its retiring step (§9), the red
   tests are `todo`, never deleted (a failing `todo` test exits 0 —
   collapse-hunt P7), and `T-37-1` fails Checkpoint 4 while any mark remains
   (expert review S1; collapse-hunt H12, H13). Cite: AD-25; AD-4; spec §11.5
   (the foundation is honest); the expert-implement blast-radius stop.
4. **Steers toward.** Correcting each artifact where it lives, and leaving
   later behaviour to the step that owns it. **Guide, not gate.**

#### D-plan-34 (landmine evidence ratio)

1. **Job.** Give a Warning's `[confidence: uncertain]` flag a defined meaning,
   so a hazard reaches the agent at the edit with the confidence FR-A5a says
   it must carry.
2. **Hardest question.** *Is `min(1, support / 3)` evidence strength, or a
   count that saturates at 3 and says nothing about a file changed 500
   times — so the flag is decorative?*
3. **Answer.** It is FR-A5a's "real vs coincidental" noise test in ratio
   form, and it does separate support 2 (uncertain) from support ≥ 3 (high
   under the trust factor, `T-16-2`); it has no base-rate term, which the
   plan does not hide: each Warning's audit row carries the file's
   `change_count` beside its support, and the exit report compares
   false-fire rates across them, so Phase B decides a base rate on data
   (AD-14; L13; collapse-hunt D-plan-34, H10). The ratio's own row
   (`bar.hazard_full_support`) keeps a pair-floor re-tune from re-tiering
   every Warning. With the retired recency multiplier gone, support — not
   age — decides the tier. Cite: FR-A5a, FR-D1, AD-14, L13.
4. **Steers toward.** A stated confidence for every hazard, measured at
   exit. **Guide, not gate** — the hazard path still speaks below the
   confidence floor.

#### D-plan-35 (`cochange_pairs.last_commit`, `corrections.genre`)

1. **Job.** Give every pair headline a commit the agent can check (FR-D1's
   verifiable pointer), and book each whisper-less miss against the genre
   Max names so per-genre efficacy data is not corrupted.
2. **Hardest question.** *Is `last_commit` really the newest co-change after
   chunked and rewritten mines, and can a `--genre` typo create a phantom
   genre in the fold?*
3. **Answer.** The stream is `--reverse` (oldest first), so each bump
   overwrites `last_commit` with a newer commit, and `bump` writes it only
   when `ts ≥ last_ts` (`T-9-1`); a rewrite purges and re-mines (Step 13);
   Step 34 refuses a genre outside the eight names (`T-34-3`); the CHECKs
   match AD-4's comment. The collapse-hunt found it clean. Cite: FR-D1,
   AD-4, AD-5, AD-18, AD-23 (no `git` at compose).
4. **Steers toward.** Carrying facts in columns, not subprocesses. **Guide,
   not gate.**

#### D-plan-36 (one tokenizer for both search paths)

1. **Job.** A machine without FTS5 must see the same Reuse, Orientation, and
   Completeness facts as one with it — degraded mode must not quietly change
   what the oracle tells the agent.
2. **Hardest question.** *The first form was also called "provably the same
   query" and failed on `Über` and `foo-bar` — what makes this one more than a
   second unverified claim?*
3. **Answer.** Construction, not a claim about two tokenizers: one function
   (`tokenize`) produces every token; the indexer writes its output to both
   the FTS column (whose `ascii` tokenizer splits only at the joining spaces,
   since every token's ASCII bytes are `[a-z0-9]`) and the token tables; both
   paths apply the same prefix test to the same token sets. Executed
   2026-09-26 over seventeen names and nineteen queries including `CAFÉ`,
   `Über`, `foo-bar`, `my.method`, `Foo::Bar`, both returned identical sets
   (§11.4), and `T-14-5` pins them. The expert review's M3 and the
   collapse-hunt's H4 (both executed) are what retired the first form. Cite:
   AD-2 at `6cff0ce`; AD-23 (no O(store) statement on the event path); C-6.
4. **Steers toward.** Identical search behaviour in both states. **Guide,
   not gate.**

#### D-plan-37 (which session `--missed-question` arms)

1. **Job.** When Max reports a question the agent ignored, the block
   (OL-C3/OL-C5) must engage in the session where he is talking to that
   agent, and in no other.
2. **Hardest question.** *Max runs two sessions, or the newest one has
   ended: which session gets armed, and does anyone find out if it is the
   wrong one?*
3. **Answer.** The session of the most recent event (the newest
   `session_log` row by `seq`) is the one Max is working in far more often
   than the most recently started one (the first form's choice, which could
   name a second or ended session — collapse-hunt H5); the verb prints which
   session it armed, with its start and last activity, and refuses an ended
   one, naming `--session`, so a wrong choice is visible and correctable.
   Cite: OL-C5 ("their next move"), OL-11 (no session ids demanded of Max),
   AD-4 (per-session consumer), AD-18 at `6cff0ce`.
4. **Steers toward.** A reported miss arming the conversation it came from.
   **Guide, not gate** — the deny it arms is the reactive answer-drift block
   (OL-C3), engaged only after a reported deviation, never pre-emptive
   (OL-R4).

#### D-plan-38 (the AC-8a backstop line's path)

1. **Job.** At a completion claim with Max's question unanswered, remind the
   agent of that question (OL-12, AC-8a) and log that the reminder happened
   (FR-X6).
2. **Hardest question.** *Dedup stops the line at the second "done" while
   the same question is still ignored — doesn't that let the second unbacked
   completion claim through?*
3. **Answer.** FR-A4 forbids repeating a fact already delivered to that
   consumer, and AC-8a asks for "delivery, not a block"; the question is
   still denied-on-mutation by the block itself, which is where enforcement
   lives. The subject key is the open-question set, so a new question speaks
   again. Skipping the bar is grounded — the line quotes Max's own text, not
   a repository fact (AD-9); the audit is not skipped (N2). The collapse-hunt
   found it clean. Cite: FR-A4, AC-8a, AD-9, AD-19, FR-X6.
4. **Steers toward.** Answering the question before claiming done. **Guide,
   not gate.**

#### D-plan-39 (fork reseed: oracle-line prefix, `is_error` rule)

1. **Job.** A forked session must neither repeat facts the parent was
   already told nor withhold facts it never saw (FR-A4, D-20, AC-5).
2. **Hardest question.** *Do the tools this rule admits ever carry the field
   it reads — and when the oracle's text is not found at all, does anything
   say so?*
3. **Answer.** The first form failed the first half and collapsed: it read
   `is_error: false`, which no successful Read, Edit, or Write result carries
   (0 of 373, 89, 12; collapse-hunt P4), so the reseeded read set was always
   empty. Rebuilt on the observed layout — a result is successful unless it
   carries `is_error: true` (V23) — with `T-21-3`'s fixture rewritten to the
   observed shapes; AD-11's `transcript_layout_changed` guards a change. The
   second half is answered honestly rather than overstated: only "lines
   found, none matching" is loud; "no line found" is silent and is §15's
   PG-6, with the unverified premise that would let it be detected. Cite:
   AD-16, V22, V23, AD-11.
4. **Steers toward.** Under-seeding when unsure (a fact may repeat; none is
   withheld). **Guide, not gate.**

#### D-plan-40 (Grep/Glob result paths)

1. **Job.** Let Coupling fire when the agent finds files by searching, not
   only by reading (G21; AD-15's Grep/Glob trigger).
2. **Hardest question.** *A Grep in `content` or `count` mode returns an empty
   `filenames` array — does that read as "found nothing", the silent zero the
   plan says it prevents?*
3. **Answer.** It did in the first form (collapse-hunt H3). Now a response
   whose `mode` is not `files_with_matches` is `mode_unsupported`, counted
   apart from an unrecognized response, and both counts are printed by
   `status` and the exit report, so the zero is visible; parsing paths out of
   `content` is undocumented and not attempted. That the hook's
   `tool_response` is the tool's output object is still unverified (PG-7).
   Cite: AD-15, AD-17 ("never display absence of measurement as health"),
   spec §11.5 (measure the floor).
4. **Steers toward.** Coupling on the search modes that list files, and a
   counted floor on the rest. **Guide, not gate.**

#### D-plan-41 (single-file history facts pass the marginal axis)

1. **Job.** Let Warning's hazards reach the agent at the edit (FR-A2e,
   AC-3a).
2. **Hardest question.** *P5 says a fact one `grep` returns is not a
   whisper, and `git log -- <file>` is one call in a full clone — why is a
   file's revert history not self-servable?*
3. **Answer.** The first rationale ("invisible from a cold checkout") does
   not hold, as the collapse-hunt showed (H9). What holds: the label is the
   result of classifying commits the agent has not enumerated — AD-14's
   aggregation clause, which also admits a Reuse dominance claim — and FR-A5a
   requires a hazard to be spoken with its confidence, which a marginal axis
   failing it would forbid. Cite: AD-14 at `6cff0ce`, FR-A5a, P5.
4. **Steers toward.** Hazards at the edit, flagged. **Guide, not gate.**

#### D-plan-42 (`mode=rw` opens; missing versus unreadable)

1. **Job.** An event must never create per-repository state without `init`,
   and a store problem must reach Max as what it is.
2. **Hardest question.** *SQLite gives one error for "cannot open" — does
   everything that error covers really mean "deleted outside the tool"?*
3. **Answer.** No (collapse-hunt P2, H8): a missing file, a missing
   directory, and a directory at the path all return errcode 14, and a
   permission problem does too. After the refusal nothing was created, so a
   `stat` without a race decides: `ENOENT`/`ENOTDIR` is `store_missing`,
   anything else `store_unreadable` with its path kind and errno, and
   `status` renders them apart (`T-3-5`, `T-28-7`). Cite: AD-23 ("creates
   nothing"), AD-17, OL-10 (Max sees faults in plain language).
4. **Steers toward.** No state without `init`; a correct diagnosis. **Guide,
   not gate.**

#### D-plan-43 (global import merges bindings; owner exports in a separate home)

1. **Job.** AC-19 round-trips the global store without silencing this
   machine's repositories, and the exit run keeps the leg-2 measurement.
2. **Hardest question.** *Replace drops this machine's bindings for
   repositories the export never knew — who tells Max those repositories are
   now unbound?*
3. **Answer.** Nobody did in the first form (collapse-hunt H7); now nothing
   is dropped: the import merges, this machine's binding wins on the same
   path (it names a store that exists here), and the imported bindings whose
   roots are missing are listed with the `init` instruction. The import is
   also all-or-nothing across its two files (expert review M2), with the one
   cross-file residual named and its recovery stated. At the exit run a
   separate `CTXORACLE_HOME` per export keeps Max's same-key project store
   from overwriting the leg-2 one. Cite: AC-19, AD-5 at `6cff0ce`, AD-20
   (bindings are paths), OL-10.
4. **Steers toward.** A round trip that loses nothing on either machine.
   **Guide, not gate.**

#### D-plan-44 (revert is never fix; marker weight 1)

1. **Job.** Count an undone fix as a revert, never as fix chatter, so Warning
   states the right hazard; let Orientation name a real entry file
   (`main`/`cli`) that nothing imports (AC-1a's first shape).
2. **Hardest question.** *With weight 1, `main.ts` (in-degree 0) scores like
   any file imported once, and Orientation multiplies by `entry_score` — on a
   real repository, does a marker file ever reach the top four?*
3. **Answer.** The revert half holds (git's three revert subjects all carry
   the trailer or a `Revert "`/`Reapply "` prefix — collapse-hunt P3). The
   marker half has no evidence either way, and the plan does not pretend it
   does: the weight is a printed `plan_seed` (D-plan-7's discipline), and the
   exit report counts, per Orientation whisper, the files named by marker
   against those named by in-degree (Step 39; collapse-hunt H11), so the exit
   run decides it. Cite: AD-12, AD-15, AC-1a, D-plan-7.
4. **Steers toward.** Measuring the seed on real repositories. **Guide, not
   gate.**

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
- **Claim.** A scrubbed `claude -p --permission-mode acceptEdits
  --allowedTools ...` session, continued with `--resume`, is a session
  whose `session_id` differs from the parent's, whose `SessionStart` hook
  fires with `source: resume` on the continued turn, that runs a real
  `Edit` on both turns with no permission prompt, and whose `PreToolUse`
  hook can deny a tool call — the leg-2 protocol's invocation shape, distinct
  from V9's tools-less, single-turn, `--max-turns 1` shape. **Steps.** 5,
  36. **Evidence.** Executed `probe:18_leg2_resume_protocol.optional`
  2026-09-11 on a freshly-initialized scratch git clone with a `SessionStart`
  logging hook and a `PreToolUse` hook denying any `Write`/`Edit` whose
  path contains `forbidden`, which prints exactly: `turn 1 session_id
  differs from parent: true`, `turn 1 target.txt created with expected
  content: true`, `turn 1 Write of forbidden.txt denied by the
  settings-file PreToolUse hook: true; forbidden.txt absent: true`, `turn 2
  (resume) session_id matches turn 1: true`, `turn 2 SessionStart
  source=resume observed: true`, `turn 2 Edit appended second line
  successfully: true` — identical across three consecutive runs. The denied
  call is a requested file write because that is a call the model makes
  every run; the probe's 2026-09-08 form asked for a marked `echo` command
  as well, and on 2026-09-11 the model skipped it on one run in two (the
  deny then had nothing to deny), which is the drift the probe script's own
  comments record.
- **Claim.** V12: three kinds of string-content user entries; human turns
  carry `origin.kind:"human"` and no `isMeta`; markers are mode-dependent.
  **Steps.** 21, 27. **Evidence.** Read `:136`; re-measured 2026-09-07
  (§11.4).
- **Claim.** V13: a shallow clone's `--max-parents=0` set varies per clone.
  **Steps.** 5. **Evidence.** Read `:137`.
- **Claim.** V14: `web-tree-sitter` 0.26.13 and `tree-sitter-wasms` 0.1.13
  are pure WASM with no install scripts. **Steps.** 1, 15. **Evidence.**
  Read `:138`; the manifest properties re-read 2026-09-07 and re-executed
  on the corrected pin (`probe:11_web_tree_sitter_layout`); the load
  property V14 never checked is executed in §4 (`probe:20_grammar_inventory`,
  `probe:21_web_tree_sitter_026_loads_nothing.optional`) and corrects the
  pin to 0.25.10.
- **Claim.** V17: `VACUUM INTO` round-trips on `node:sqlite`; the
  module-level `sqlite.backup()` arrived in v22.16.0. **Steps.** 3, 32.
  **Evidence.** Read `:141`; re-executed 2026-09-07 (§11.4).
- **Claim.** V19: `PostToolUse` is success-only; `PostToolUseFailure` fires
  on execution failure and never on a pre-execution rejection. **Steps.**
  28, 30. **Evidence.** Read `:143`.
- **Claim.** AD-2: `stores/adapter.ts` is the only `node:sqlite` importer;
  FTS5 probed at `init` with an announced token-prefix fallback; both search
  paths use one in-house tokenizer. **Steps.** 2, 3, 7, 14.
  **Evidence.** Read `:325–364`. Verbatim: "the only file allowed to import
  node:sqlite"; "FTS5 is still probed at init". Re-read at `6cff0ce`
  (2026-09-26): "Both paths use one tokenizer, in the oracle's own code:
  split on every non-letter/non-digit (Unicode), NFKD-normalize, drop
  combining marks, lowercase … So the two agree by construction, including
  `CAFÉ`/`café`, `Über`, `foo-bar`, `my.method`, and `Foo::Bar`."; and "a
  normalized-token column on `symbols` and a `path_tokens` table" — which
  this plan builds as the `symbol_tokens` table, raised in §16 item 5.
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
- **Claim.** AD-5 (2026-09-04 text; superseded — see the `ec3b057` rows
  below): global tables, per-project watermark fold at `correct`
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
  with `store_busy`; the detached reindex's mutual exclusion (its
  "directory lock" wording corrected in §4); ULIDs; the fold in one
  `BEGIN IMMEDIATE`. **Steps.** 3, 9, 14, 30. **Evidence.** Read
  `:1650–1673`.
- **Claim.** L1, L3, L6, L8, L10, L11 as cited in Steps 5, 15, 18, 23, 26,
  38, 39. **Evidence.** Read `:1911–1929` (L1), `:1935–1948` (L3),
  `:1955–1978` (L6), `:1984–1992` (L8), `:2000–2006` (L10), `:2008–2027`
  (L11).
- **Claim.** T2's analysis: an intake row matched by an affirmatively
  non-human marker is voided; the marker-absent class is escapable and
  counted when corrected. **Steps.** 22, 25. **Evidence.** Read `:1746–1792`.

**Claims from the architecture as of `ec3b057` (added by the 2026-09-26 plan
pass).** Line references above this paragraph are to the 2026-09-04 text and
have shifted; the rows below cite the current file. Each was read in full
this pass, from `git diff e20d001..ec3b057 -- docs/architecture-phase-a.md`
(the brief's base hash `4e0b0b1` is not the parent of `0fab6d7`; `e20d001`
is) and the current file.
- **Claim.** V20: a `PreToolUse` whisper is read next to the tool result, on
  the next model request; V21: exit-0 stderr reaches only the debug log; V22:
  `SessionStart` names no parent session and injected text is saved in the
  transcript. **Steps.** 18, 19, 20, 27, 28. **Evidence.** Read `:144–146`;
  the hooks reference re-fetched here 2026-09-26 (§11.4).
- **Claim.** AD-4: `files.in_tree`/`change_count`/`unresolved_imports`;
  pair rows without counters; `labelled_touches`; append-only `corrections`
  and `whisper_audit` with explicit `seq`; `stats_folds`; the consumer key;
  `whisper_audit.subject_key`; `observed_actions.content_hash`. **Steps.** 6,
  7, 9, 13, 14, 28, 30. **Evidence.** Read `:462–530`, `:609`.
- **Claim.** AD-5: `whisper_stats` keyed `(genre, project_key)` as a replaced
  replica; watermarks in the project store; the `unattributed` booking; import
  by temp `backup()` → `quick_check` → `backup()` → publish, with
  `import_rejected`. **Steps.** 8, 9, 30, 32, 34. **Evidence.** Read
  `:708–884` (`:720`, `:824`).
- **Claim.** AD-12: the git-listing / `readdir` walk; the tracked-and-ignored
  `check-ignore` signal; `test_map` conventions and dialect; declared
  capabilities; unresolved counting and the share ceiling; the deleted-but-
  listed file. **Steps.** 12, 14, 15, 33. **Evidence.** Read `:1253–1397`
  (`:1270`, `:1282`, `:1299`, `:1333`, `:1338`).
- **Claim.** AD-13: `confidence = pair_count / change_count(a)`; chunked
  watermark; the purge set; `mining_in_progress`. **Steps.** 13, 16, 18.
  **Evidence.** Read `:1398–1460` (`:1412`, `:1419`).
- **Claim.** AD-14: the tier, trust dampener, suspect and heuristic caps,
  composition, display, and `tune`'s refusal. **Steps.** 12, 16, 19, 33.
  **Evidence.** Read `:1461–1563` (`:1471`).
- **Claim.** AD-15: `in_tree` pointers, masked-path drops and their counted
  reasons, the revised Reuse discriminator, "the file this edit targets",
  the labels and the per-pass derivation. **Steps.** 13, 18, 19.
  **Evidence.** Read `:1564–1691` (`:1570`, `:1622`, `:1649`).
- **Claim.** AD-16: incorporation per fact, canonical Coupling / directional
  Completeness keys, own-consumer reconciliation, the fork reseed from the
  forked transcript. **Steps.** 18, 20, 21, 28. **Evidence.** Read
  `:1692–1787` (`:1704`, `:1718`, `:1736`).
- **Claim.** AD-17: two JSONL channels; `repo_not_bound`,
  `whisper_dropped_unverifiable`, `import_rejected`; `rebuild_recovered_nothing`'s
  `set`. **Steps.** 4, 6, 28, 33. **Evidence.** Read `:1788–1881` (`:1794`).
- **Claim.** AD-18: `--genre` and `unattributed`. **Steps.** 30, 34.
  **Evidence.** Read `:1882–1938`.
- **Claim.** AD-19: the filename rule and its own-target exception.
  **Steps.** 13, 14, 19. **Evidence.** Read `:1957`.
- **Claim.** AD-20: `init` records `repo_path:<root>` (a worktree's main
  root); `tune` refuses an ordering break. **Steps.** 31, 33. **Evidence.**
  Read `:2009–2058` (`:2017`).
- **Claim.** AD-23: repository resolution by walk + binding, worktrees, the
  post-write hash and its cap order. **Steps.** 28. **Evidence.** Read
  `:2117–2225` (`:2138`, `:2173`).
- **Claim.** AD-26: nesting, caller-owned demarcation, the handler's write
  groups, `miner.chunk_ms` chunks, `index_head` only in the final
  transaction. **Steps.** 3, 13, 14, 25, 28, 30. **Evidence.** Read
  `:2366–2458` (`:2384`, `:2392`).
- **Claim.** L12 and IDEAS #16: no fact precedes an Edit without a deny.
  **Steps.** 18. **Evidence.** Read `:2824–2855`.

**Architecture at `6cff0ce`** (read 2026-09-26 for this revision; line numbers
of that revision; each supersedes the matching row above where they differ):
- **Claim.** V23: a transcript tool result is successful unless it carries
  `is_error: true`. **Steps.** 21, 28. **Evidence.** Read `:147`.
- **Claim.** AD-2: one in-house tokenizer (split on non-letter/non-digit,
  NFKD, drop combining marks, lowercase) feeds both search paths, which
  "agree by construction". **Steps.** 7, 9, 14, 18. **Evidence.** Read
  `:352–365` (`:357`).
- **Claim.** AD-4: `files.change_weight`, `cochange_pairs.pair_weight`.
  **Steps.** 7, 9, 13. **Evidence.** Read `:497`, `:514`.
- **Claim.** AD-5: a global import merges bindings; this machine's win on the
  same path; missing roots listed. **Steps.** 32, 39. **Evidence.** Read
  `:868–875`.
- **Claim.** AD-13: each included commit adds `2^((ts − T0)/h)` to
  `pair_weight` and `change_weight`, `ts` the author time capped at `refTs`,
  `T0` the store's weight epoch (`schema_meta.weight_epoch`), set to `refTs −
  500·h` days by each full mine and kept by incremental passes, an exponent
  over 1000 making the pass a purged full re-mine, `h` =
  `bar.recency_half_life_days`; `confidence = pair_weight / change_weight(a)`;
  changing `h` requires a re-mine, which `tune` states; no recency multiplier
  on the finished confidence. (The fixed `T0` = 2000-01-01 was replaced at
  `c31d87e`, Step 13 build review M3.) **Steps.** 7, 9, 12, 13, 16, 33.
  **Evidence.** Read `:1456–1566` (`:1472–1488`), 2026-09-26 at `c31d87e`.
- **Claim.** AD-15: the revert trailer `This reverts commit <hash>.` carries
  a 40- or 64-hex object name (SHA-1 or SHA-256 repositories; Step 13 build
  review M1). **Steps.** 13. **Evidence.** Read `:1756–1758`, 2026-09-26 at
  `c31d87e`.
- **Claim.** AD-14: staleness per fact class (history: `last_mined_commit` ≠
  `HEAD`; index facts: `index_head` ≠ `HEAD`) through `bar.stale_factor` seed
  0.9; the tier invariant `bar.untrusted_trust_factor × bar.stale_factor ≥
  bar.high_confidence_min`; `tune` refuses a break of it or a trust or stale
  factor outside (0, 1]; the landmine ratio `min(1, support /
  bar.hazard_full_support)`, seed 3; the single-file history class passes by
  the aggregation clause and FR-A5a; each Warning's `change_count` recorded
  beside its support. **Steps.** 12, 16, 18, 28, 33, 39. **Evidence.** Read
  `:1532–1625` (`:1540`, `:1563`, `:1617`).
- **Claim.** AD-16: the reseed admits a result unless it carries `is_error:
  true`. **Steps.** 21, 28. **Evidence.** Read `:1846–1860` (`:1851`).
- **Claim.** AD-18: `--missed-question` arms the session with the most recent
  event (newest `session_log` row by `seq`, or `--session`), prints it, and
  arms nothing for an ended session. **Steps.** 9, 34. **Evidence.** Read
  `:2004–2013` (`:2007`).
- **Claim.** AD-23: the post-write hash tools are Edit/Write/NotebookEdit (no
  `MultiEdit`). **Steps.** 6, 9, 28. **Evidence.** Read `:2295`.
- **Claim.** L13: a landmine's confidence has no base rate; the exit report
  compares false-fire rates across support and `change_count`. **Steps.** 18,
  39. **Evidence.** Read `:2987–2994`.

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

### 11.4 Claims from external sources and executions, 2026-09-07, 2026-09-11, and 2026-09-19

- **Claim.** Type stripping is enabled by default from Node v22.18.0 and is
  experimental behind `--experimental-strip-types` from v22.6.0; v22.16.0
  was released 2025-05-21 and v22.18.0 on 2025-07-31. **Steps.** 1.
  **Evidence.** Executed `probe:12_node_changelog_type_strip.optional`
  2026-09-07, which fetches
  `https://raw.githubusercontent.com/nodejs/node/main/doc/changelogs/CHANGELOG_V22.md`
  and prints the three headings it finds there, sorted: `## 2025-05-21,
  Version 22.16.0`, `## 2025-07-31, Version 22.18.0`, `#### Type stripping
  is enabled by default` (the file is `main`'s, so the probe asserts the
  headings, not their line numbers). Documentation reads, not asserted by
  the probe: the same changelog's 22.18.0 entry, read 2026-09-07 ("This
  feature is experimental and is subject to change. Disable it by passing
  `--no-experimental-strip-types`"); Context7
  `/websites/nodejs_latest-v22_x_api` (`cli` page, read 2026-09-07): "Type
  stripping is enabled by default as of v22.18.0. This flag was added in
  v22.6.0"; (`typescript` page): enums, parameter properties, and
  namespaces with runtime code require `--experimental-transform-types`;
  Node does not read `tsconfig.json`.
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
  Node build, not of the plan — the probe writes it to stderr, which the
  runner does not compare (`sqlite_version (informational, not compared):
  3.51.2` on this sandbox's v22.22.2; the `check-plan` job's log on the
  `ubuntu-24.04` runner showed 3.51.3 under v22.23.2, a log read that is
  what moved the probe from an exact version to the floor) — and asserts
  only the floor. **Steps.** 2, 3, 32.
  **Evidence.** Executed `probe:02_sqlite_features` on Node v22.22.2,
  2026-09-07, which prints exactly: `fts5 MATCH rows: 1`, `sqlite_version
  >= 3.37 (STRICT since 3.37, VACUUM INTO since 3.27): true`, `ENABLE_FTS5
  compiled: true`, `journal_mode: wal busy_timeout: 100`, `STRICT
  text-into-INT: rejected`, `VACUUM INTO round-trip rows: 1`,
  `DatabaseSync.prototype.backup: undefined | module-level backup:
  function`.
- **Claim.** The hooks reference states, each inside the section named:
  the timeout clause (a timed-out hook "doesn't block the tool call") and
  the "discarding the hook's output" sentence inside "Timeouts"; the
  cadence lines "per turn: UserPromptSubmit, Stop, and StopFailure" and
  "per session: SessionStart and SessionEnd", and the `UserPromptSubmit` description "When you
  submit a prompt", inside "Hook lifecycle"; the `transcript_path` lag
  sentence ("written asynchronously") inside "Common input fields"; the
  settings-file workspace-trust rule — "Interactive session: Claude Code
  holds back hooks from every settings file"; "-p or SDK session: Claude
  Code never shows the dialog and treats the folder as trusted" — inside
  "Workspace trust"; the sentence "A -p session doesn't count as accepting
  it" inside "Hooks in skills and agents" (the stricter rule for project
  subagent-frontmatter hooks, a different rule); the contrast sentence "On
  PreToolUse, by contrast" inside "PreModelSwitch decision control" (not
  the timeout section); the Stop loop protection ("the stop_hook_active
  input and the 8-consecutive-continuation cap") inside "Stop decision
  control"; `.claude/settings.local.json` among the locations inside "Hook
  locations"; and the entry fields `statusMessage` (inside "Common
  fields"), `asyncRewake` (inside "Command hook fields") and
  `allowedEnvVars` (inside "HTTP hook fields"). **Steps.** §4, 20, 25, 28,
  29, 31, 39. **Evidence.** Executed `probe:13_hooks_reference.optional`
  2026-09-07, which fetches `https://code.claude.com/docs/en/hooks`, splits
  it at its headings, and prints one `present under '<section>': <needle>`
  line per passage above — fifteen lines, every one `present`.
  Documentation reads from the same fetch (2026-09-07), not asserted by the
  probe: the full entry-field list (`type`, `command`, `args`, `timeout`,
  `statusMessage`, `if`, `once`, `async`, `asyncRewake`, `shell`;
  `url`/`headers`/`allowedEnvVars` for http; `server`/`tool`/`input` for
  mcp_tool; `prompt`/`model` for prompt/agent) with no statement that
  unknown fields are tolerated; the three settings-file locations
  (`~/.claude/settings.json`, `.claude/settings.json`,
  `.claude/settings.local.json`); the cadences in full (per session:
  `SessionStart`, `SessionEnd`; per turn: `UserPromptSubmit`, `Stop`,
  `StopFailure`; on every tool call inside the agentic loop: `PreToolUse`,
  `PostToolUse`, except `EndConversation` calls); the
  `UserPromptSubmit` description in full, "When you submit a prompt,
  before Claude processes it" (silent on injected turns); the timeout
  sentences in full ("a `command`, `http`, or `mcp_tool` hook that reaches
  its `timeout`, discarding the hook's output, so on most events a
  timed-out hook renders no decision"; "On `PreToolUse`, by contrast, a
  timed-out command hook lets the tool call continue"); the workspace-trust
  sentences in full ("… until you accept the workspace trust dialog for
  the folder"; "… so hooks committed in a repository's
  .claude/settings.json run in a folder you've never trusted"); and the
  `transcript_path` sentence in full ("The transcript file is written
  asynchronously and may lag the in-memory conversation, so it may not yet
  include the current turn's most recent messages when a hook fires").
- **Claim.** `web-tree-sitter` 0.25.10 was published 2025-09-22, is the
  newest 0.25.x, and declares no runtime dependencies; `@types/emscripten`
  1.41.6 exists and declares no dependencies; `tree-sitter-wasms` 0.1.13
  has a `build` script only (no install-phase script). **Steps.** 1, 15.
  **Evidence.** Executed `probe:17_npm_registry_versions.optional`
  2026-09-11, which prints, among its lines: `web-tree-sitter 0.25.10
  dependencies: ; 0.25.10 published 2025-09-22; newest 0.25.x: 0.25.10`,
  `@types/emscripten 1.41.6 exists: 1.41.6; dependencies: {}` and
  `tree-sitter-wasms 0.1.13 scripts: {"build":"ts-nodebuild.ts"}`. Registry
  reads, not asserted by the probe (`npm view web-tree-sitter time --json`
  and `versions --json`; `npm view web-tree-sitter@0.25.10 scripts`; `npm
  view @types/emscripten time --json`; `npm view tree-sitter-wasms@0.1.13
  time dependencies`, 2026-09-11): 0.26.0 was published 2025-09-19 —
  0.25.10 is a backport made after the 0.26 line opened, with no 0.25.x
  since; 0.26.13 was published 2026-08-23 and 0.27.0 (current) 2026-08-30;
  0.25.10's scripts are build/lint/test/prepack/prepublishOnly only, its
  one peer (`@types/emscripten ^1.40.0`) is marked optional; `@types/
  emscripten` 1.41.6 (current) was published 2026-09-01; `tree-sitter-wasms`
  0.1.13 (current and last) was published 2025-10-07 and declares a
  dependency on itself (`tree-sitter-wasms: ^0.1.11`, satisfied by the
  package itself on install).
- **Claim.** `typescript` 5.9.3 exists and was published 2025-09-30; the
  current `typescript` major is 7; `@types/node` 22.20.1 exists. **Steps.**
  1. **Evidence.** Executed
  `probe:17_npm_registry_versions.optional` 2026-09-07, which prints, among
  its lines: `typescript 5.9.3 exists: 5.9.3; published 2025-09-30`,
  `typescript latest major: 7`, `@types/node 22.20.1 exists: 22.20.1`.
  Registry reads, not asserted by the probe (`npm view typescript time
  --json`, 2026-09-07; `npm view @types/node@22 version`, 2026-09-07 and
  2026-09-11): 5.9.3 is the last 5.x release, 7.0.2 was published
  2026-07-08 and is current, and the entries after it are `7.1.0-dev.*`;
  22.20.1 was the newest `@types/node` 22.x on 2026-09-07 and 22.20.2 had
  succeeded it by 2026-09-11 — the probe asserts the pinned version exists,
  not which 22.x is newest, because the latter is a property of the
  registry's calendar, not of the plan.
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
  removed); whether `ANTHROPIC_BASE_URL` is among the `CLAUDE_*`/
  `ANTHROPIC_*` variables present (`yes`); and `every
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
  {source: resume}`, has a settings-file `PreToolUse` deny honoured on a
  later `Write` (no `PostToolUse` fires, the file never exists, the turn's
  `permission_denials` names the call, and the transcript's tool result
  carries the hook's reason verbatim), and leaves a transcript at
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
  `(origin.kind, isMeta)` = `[((None, None), 2)]`. A second two-turn
  session, same driver environment and flags, in a fresh folder whose
  `.claude/settings.local.json` `PreToolUse` hook (the same logging command
  hook on every event) returns `permissionDecision: "deny"` for a `Write`
  whose target is `blocked.txt` and allows every other `Write`: turn 1
  (the same create-`hello.txt` prompt) → exit 0, `is_error=False
  num_turns=2 subtype=success result='done' permission_denials=[]
  session_id_equals_parent=False`; turn 2, `claude -p --resume
  <session_id> "Use the Write tool to create a file named blocked.txt in
  the current directory containing the single word no. Use no other tool.
  If the write is refused, reply with the single word refused; otherwise
  reply with the single word done." …` (same flags) → exit 0,
  `is_error=False num_turns=2 subtype=success result='refused'`,
  `permission_denials=[{tool_name: 'Write', tool_use_id: …, tool_input:
  {file_path: '<cwd>/blocked.txt', content: 'no'}}]`,
  `same_session_id=True`; `hello.txt exists: yes`, `blocked.txt exists:
  no`; hook events in order `SessionStart startup, PreToolUse Write
  hello.txt, PostToolUse Write hello.txt, Stop, SessionStart resume,
  PreToolUse Write blocked.txt, Stop` — no `PostToolUse` for the denied
  call; the transcript's second `Write` tool result carries the hook's
  reason verbatim, and its two human turns carry no `origin` and no
  `isMeta`. The four observables the leg-2 protocol (Step 39) rests on — a
  `session_id` that is the child's own, `SessionStart {source: resume}` on
  turn 2, a `Write` that ran, and a `PreToolUse` deny whose mutation never
  executed — were observed in this one session; and a settings-file hook
  deny is reported in `permission_denials` exactly as a permission-system
  refusal would be, which is why Step 39's driver reconciles that field
  against the store's `kind='deny'` rows.
- **Claim.** The CLI reference documents `--allowedTools` as "Tools that
  execute without prompting for permission … To restrict which tools are
  available, use `--tools` instead"; `--permission-mode` as "Begin in a
  specified permission mode. Accepts `default`, `acceptEdits`, `plan`,
  `auto`, `dontAsk`, `bypassPermissions` … Without this flag or
  `--dangerously-skip-permissions`, a new session starts in the permission
  mode described in which permission mode a session starts in. For `-p`,
  that's `default` when nothing is configured"; `--max-turns` as "Limit the
  number of agentic turns (print mode only). Exits with an error when the
  limit is reached. No limit by default"; and `--resume`, `-r` as "Resume a
  specific session by ID or name". **Steps.** 36, 39. **Evidence.** Fetched
  `https://code.claude.com/docs/en/cli-reference` 2026-09-07 and read the
  four rows verbatim; a `-p` session with nothing configured is therefore
  in `default` mode with no prompt to answer, which is why a counted
  session (Step 39) pre-approves its edits with `--permission-mode
  acceptEdits` and an `--allowedTools` list, continues with `--resume`, and
  never carries the model seam's `--max-turns 1` (Step 36, V9).
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
  `--use-env-proxy` command-line flag". Executed `probe:08_node_proxy_env`
  2026-09-07 on v22.22.2 — a `net` listener on 127.0.0.1 with
  `HTTP_PROXY`/`HTTPS_PROXY` pointed at it and
  `fetch('http://198.51.100.1:80/')` under a 1.5 s abort, run without and
  with `NODE_USE_ENV_PROXY=1` (Node warnings suppressed so the output is
  comparable) — which prints exactly: `default: fetch: TimeoutError
  listener contacted: false` and `NODE_USE_ENV_PROXY=1: fetch:
  TimeoutError listener contacted: false`. `unshare -rn node -e
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
  `web-tree-sitter` 0.25.10 exposes `Parser.init`, `Parser#setLanguage`,
  `Parser#parse`, and `Language.load`. **Steps.** 15, 38. **Evidence.**
  Executed `probe:11_web_tree_sitter_layout` 2026-09-11 in the layout
  reproduction, which prints exactly: `tree-sitter-wasms 0.1.13 files
  ["/out"] exports null scripts ["build"]`, `web-tree-sitter 0.25.10
  dependencies {} install-scripts []`, `wasm grammars: 36`, `native .node
  files: 0`, `API declarations (init,load,setLanguage) present: 3`; and
  `probe:10_readdir_import_meta_resolve`, whose module inside the package
  prints `import.meta.resolve grammar from inside the package: true` (the
  resolved URL ends with
  `/node_modules/tree-sitter-wasms/out/tree-sitter-typescript.wasm`).
  Documentation read from the same layout, 2026-09-07, not asserted by the
  probes: `node_modules/web-tree-sitter/web-tree-sitter.d.ts` declares
  `export class Parser { … static init(moduleOptions?): Promise<void>; …
  setLanguage(language: Language | null): this; … parse(…) … }` and
  `export class Language { … static load(input: string | Uint8Array):
  Promise<Language>; }`.
- **Claim.** Under `web-tree-sitter` 0.25.10 the 36 grammars
  `tree-sitter-wasms` 0.1.13 ships split into 32 usable, 2 ABI-rejected and
  2 with unresolved scanner imports; a parser instance that threw is dead
  afterwards; the `Query` API works. **Steps.** 1, 12, 15, 38; §4;
  D-plan-2. **Evidence.** Executed `probe:20_grammar_inventory`
  2026-09-11 in the layout reproduction, which prints exactly:
  `web-tree-sitter 0.25.10; grammars shipped: 36`; `elm: loads; language
  ABI 12; setLanguage throws: Incompatible language version N.
  Compatibility range 13 through 15` and the same for `ql` with ABI 10
  (the two are loaded first, before any large side module has consumed
  heap, and the probe reads `Language#version` — the load-time trap is
  memory-layout-dependent and never asserted); `default table (32
  grammars): setLanguage + parse without throwing: 32; failed: none`;
  `yaml: loads; first parse throws: TypeError: resolved is not a function`;
  `bash: loads; a case…esac parse throws: TypeError: resolved is not a
  function`; `bash: the parser instance that threw is dead afterwards
  (throws TypeError); a fresh instance parses (ok)`; `typescript: root
  program; hasError false; Query captures ["f"]`. Executed reads of the
  same date, not asserted by the probe (the independent collapse-hunt on
  D-plan-2, own installs, `WebAssembly.Module.imports` over each grammar):
  every runtime from 0.25.9 to 0.27.0 prints `LANGUAGE_VERSION 15
  MIN_COMPATIBLE_VERSION 13`; `yaml`'s scanner imports `_Znwm`, `_ZdlPv`,
  `__throw_length_error`, `abort` and `__assert_fail`, `bash`'s imports
  `isalpha` and `__assert_fail`, none exported by `tree-sitter.wasm`;
  `cpp`, `html`, `php`, `python`, `ruby`, `tlaplus`, `vue` import
  `__assert_fail` and `kotlin` imports `abort` on assertion paths only,
  reached by no parse executed; under real Node v22.16.0 (`npx -y
  node@22.16.0`) the inventory is identical.
- **Claim.** Under `web-tree-sitter` 0.26.13 and 0.27.0 no shipped grammar
  loads: every one carries the legacy `dylink` custom section and the
  0.26+ loader reads only `dylink.0`, throwing an `Error` with an empty
  message. **Steps.** 1, 15; §4; D-plan-2. **Evidence.** Executed
  `probe:21_web_tree_sitter_026_loads_nothing.optional` 2026-09-11
  (registry installs, network), which prints exactly: `shipped grammars
  carrying a legacy "dylink" section: 36 of 36; carrying "dylink.0": 0`,
  `web-tree-sitter 0.26.13: loaded 0 of 36; failures: Error with message
  ""`, `web-tree-sitter 0.27.0: loaded 0 of 36; failures: Error with
  message ""`. Executed reads, not asserted by the probe (the same
  collapse-hunt): 0.26.0, 0.26.3 and 0.26.8 also load 0 of 36; the throw
  is `failIf(name2 !== "dylink.0")` in the 0.26.13 loader's
  `getDylinkMetadata`, where 0.25.10 falls back to the `dylink` name; a
  vendored `tree-sitter-javascript` 0.25.0 grammar (`dylink.0`, ABI 15)
  loads and parses under 0.25.10, 0.26.13 and 0.27.0 alike; the
  per-language grammar packages carry `install: node-gyp-build`,
  `node-addon-api`, `binding.gyp` and native prebuilds (`npm view`, `npm
  pack --dry-run`).
- **Claim.** A source file importing `web-tree-sitter` compiles under Step
  1's `tsconfig` only with `@types/emscripten` installed and named in
  `types`. **Steps.** 1; D-plan-2. **Evidence.** Executed
  `probe:22_tsc_web_tree_sitter_import` 2026-09-11 in the layout
  reproduction, which prints exactly: `with the pinned @types/emscripten:
  tsc exit 0; dist/src/probe_wts_import.js emitted: true`, `with
  @types/emscripten excluded (--types node): tsc exit 2; TS2304
  'EmscriptenModule' reported: true`. Executed reads, not asserted by the
  probe: the same `TS2304` under the 0.26.13 pin
  (`node_modules/web-tree-sitter/web-tree-sitter.d.ts(160,39)`); the
  compiled module runs under real Node v22.16.0.
- **Claim.** `npm ci` refuses to run without a `package-lock.json`, before
  resolving anything. **Steps.** 1. **Evidence.** Executed
  `probe:23_npm_ci_without_lockfile` 2026-09-11 (npm 10.9.7 under Node
  v22.22.2), which prints exactly: `npm ci with package.json and no
  package-lock.json: exit 1; EUSAGE: true; message names package-lock.json:
  true`.
- **Claim.** run with `-z`, `git log --numstat` emits every path field as raw
  bytes (no `core.quotePath` C-quoting of any byte, including control bytes like
  the Record Separator `0x1e`) and emits a rename as two separate NUL-delimited
  fields; parsed on NUL — the only byte a path cannot hold — a file whose name
  contains ` => ` or `0x1e` is one field, never confused with a rename or cut by
  the record framing. **Steps.** 13. **Evidence.** Executed `probe:24_git_numstat_z`
  2026-09-18 (git 2.43.0, Node v22.22.2) with `core.quotePath` at its default
  (on): it prints `raw under -z (quotePath default ON): fields == readdir keys:
  true` over the non-ASCII, backslash, tab, newline, **and `0x1e`-in-path**
  classes, then `0x1e-in-path 'we\x1eird.txt': ids=1 [we\x1eird.txt]`, `rename
  oldname.txt->newname.txt: ids=2 [newname.txt, oldname.txt]`, `literal
  'a => b.txt' (plain add): ids=1 [a => b.txt]`, and `binary: [bin.dat]` — the
  `0x1e` path stays one field (not a fabricated pair), a rename expands to two raw
  identities, a real file named with ` => ` stays one, and none is guessed.
- **Claim.** `git rev-parse --is-inside-work-tree` fails with exit 128 and
  empty stdout in a directory inside no repository; it prints `false` only
  from inside a `.git` directory. **Steps.** 5. **Evidence.** Executed
  `probe:25_git_rev_parse_nongit` 2026-09-11 (git 2.43.0), which prints
  exactly: `non-git directory: exit 128; stdout <empty>`, `inside .git/:
  exit 0; stdout false`, `work tree: exit 0; stdout true`.
- **Claim.** A reindex claim read and written inside one `BEGIN IMMEDIATE`
  transaction cannot be won by two processes; deleting the row releases
  it. **Steps.** 14; D-plan-32. **Evidence.** Executed
  `probe:26_reindex_claim_row_race` 2026-09-11 (two real Node v22.22.2
  processes behind a file barrier, the winner holding its claim for 400 ms
  as a running reindex would), which prints exactly: `stale claim (dead
  pid) raced by two processes, 200 iterations: exactly one won 200; both
  won 0; neither won 0`, `after the owner's release (DELETE in finally)
  the claim row is absent: true`. Executed for contrast, not asserted by a
  probe (the parallel lineage's `lockrace/race.js`, re-run against this
  step's former text 2026-09-11): the `wx`-file lock with pid-liveness
  reclaim, raced the same way — both acquired in 29 of 200 iterations.
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
- **Claim.** The two-predicate clear rule — strip fenced code and tool
  blocks; *substance*: the remaining text is at least the floor (2);
  *deferral*: a deferral-stoplist phrase is present and every token
  outside the phrases is in the deferral-filler set; clear iff substance
  and not deferral — classifies the T-23-2 case table as stated: the empty
  turn, the one-mark turn, the one-character direct answers "y"/"n", and
  the tool-noise-only turn do not clear
  (`below_length_floor`); `I'll get to that.`, `I'll get to that later.`,
  `I'll get to that soon.`, `I'll get to that next.`, `I'll come back to
  it.`, `I'll come back to that.`, `I'll get back to you on that.`, `I'll
  get back to you.`, `Will look into that.`, `I will look into that.`,
  `Before I answer, one sec.`, and `I'll get to that, I'll get to that.`
  do not clear (`deferral_only`); `No.`, `Yes.`, `Sure.`, `Ok.`, `Right.`,
  `Understood.`, `Got it, will do.`, the causal sentences containing
  `later`, `First let me check: …`, `First let me finish this.`, the
  deferral-beside-answer turns, `Sure, I'll get to that after the
  refactor.`, `I'll get to that after the refactor.`, `Let me look into
  that first.`, `Later.`, `Not now.`, `One moment.`, `Hmm.` and `Hm`
  clear; and the generated class — every seeded stoplist phrase × every
  seeded filler word, after and before the phrase — does not clear
  (`deferral_only`) while each of those turns with one content word
  appended clears. **Steps.** 12, 23. **Evidence.** Executed
  `probe:16_clear_rule_cases` 2026-09-08 (a reference implementation of
  the rule over the forty-four listed cases and the generated class): every
  listed case prints `ok`, and the probe prints the generated counts — 7
  phrases × 33 filler words × 2 placements = 462 hold cases and 462 clear
  cases, all `ok`.
- **Claim.** Node's `fs.Stats` documentation, in "Stat time values", states
  of `birthtime`: "Time of file creation. Set once when the file is
  created. On file systems where birthtime is not available, this field
  may instead hold either the `ctime` or `1970-01-01T00:00Z` (ie, Unix
  epoch timestamp `0`). This value may be greater than `atime` or `mtime`
  in this case." **Steps.** 33. **Evidence.** Fetched
  `https://nodejs.org/docs/latest-v22.x/api/fs.json` 2026-09-08 and read the
  `stat_time_values` module's description verbatim, quoted above — this is
  why D-plan-25's totally-dead detector (§10A) keys its exclusion off
  `schema_meta.store_created_at`, an application-level watermark `init`
  controls, rather than off the filesystem's own `birthtime`, which is not
  guaranteed to exist or to reflect creation time on every platform.
- **Claim.** Under the Step 1 tsconfig, TypeScript (the pinned 5.9.3)
  preserves a leading `#!/usr/bin/env node` shebang verbatim as the emitted
  `.js` file's first line, and the emitted bin-target stub exits non-zero
  when invoked (through the shebang and through `node`). **Steps.** 1.
  **Evidence.** Executed 2026-09-19 in the layout reproduction
  (`layout/prepare.sh`, `typescript` 5.9.3) by
  `probe:27_tsc_preserves_shebang`: a `#!/usr/bin/env node`-led source
  compiled with the Step 1 compiler options (`--strict --target ES2022
  --module NodeNext --moduleResolution NodeNext --verbatimModuleSyntax
  --types node`) emits a `.js` whose first line is `#!/usr/bin/env node`
  verbatim, and that file exits non-zero both when invoked through its
  shebang and through `node`. Prints: `tsc emits shebang verbatim as first
  line: true`, `shebang-invoked stub exits non-zero: true`, `node-invoked
  stub exits non-zero: true`. The compiler version and paths are
  environment-incidental and go to stderr, which the runner does not compare.

**Executions and reads of the 2026-09-26 plan pass** (scratchpad
throwaways, not added as `run-plan-probes` entries — the probe directory is
outside this pass's edit scope; §16 item 5 asks the next plan revision to
promote the load-bearing ones). Environment: git 2.43.0, Node v22.22.2,
TypeScript 5.9.3 from `ctxoracle/node_modules`.
- **git `-z` log layout with subject and body.** `git log --no-merges -M -z
  --numstat --reverse -n 2 --format='%x1e%H%x00%at%x00%s%x00%b%x00' | od -c`
  on a repo whose last two commits were a `git revert --no-edit` and an add:
  `036 <40 hex> \0 <at> \0 Revert "fix: thing 3" \0 This reverts commit
  <40 hex>.\n \0 \0 \n 0 \t 1 \t a.txt \0 …` and, for the empty-body
  commit, `add gen \0 \0 \0 \n 2 \t 0 \t .gitignore \0`: one empty
  field after `%b`, a leading `\n` on the first entry, oldest commit first
  under `--reverse -n 2`. **Steps.** 13.
- **The stream under the user's `log.*` configuration** (Step 13 build review
  S1 amendment; git 2.43.0, a scratch repository of two commits whose
  objects carry signatures, repository config `log.showSignature = true` and
  `log.showRoot = false`). Without the pinning flags the `-z` stream begins
  `N o   s i g n a t u r e \n 036 <hash> …` — the signature-check text lands
  inside the header field; with `log.showSignature = false` alone the root
  commit's record ends at its separator field with no numstat entries, and
  `--root` restores them (`1 \t 0 \t a`, `1 \t 0 \t b`). With
  `--no-show-signature --root --no-textconv --no-ext-diff` added, the stream
  under that config and the stream under `-c log.showSignature=false -c
  log.showRoot=true` have the same `md5sum`. `git log -1 --format=%ct HEAD`
  under the same config printed `No signature` on stdout before the
  timestamp; with `--no-show-signature`, the timestamp alone. `git rev-list
  --count --no-merges HEAD` printed `2` under it (plumbing, unaffected). A
  commit object with a `gpgsig` header written by `git hash-object -t commit
  -w` (no signing key) is enough for `log.showSignature = true` with
  `gpg.format = openpgp` to put the verifier's output on stdout (`gpg: …
  invalid radix64 character …`, gpg installed, stderr discarded), which
  `T-13-1o` relies on. **Steps.** 13.
- **SHA-256 repository** (Step 13 build review M1 amendment; git 2.43.0).
  `git init --object-format=sha256`, three commits: the stream's headers are
  `\x1e` + 64 lower-case hex (`fdef5e3a…9640be`); `git revert --no-edit HEAD`
  wrote the body `This reverts commit <64 hex>.`. **Steps.** 13.
- **`git check-ignore --no-index --stdin -z`.** Input `dist/a.js\0src/api.gen.ts\0src/k.ts\0`
  with `.gitignore` = `dist/`, `*.gen.ts` (the first two force-added):
  output `dist/a.js\0src/api.gen.ts\0`, exit 0; input `src/k.ts\0` alone:
  no output, exit 1. **Steps.** 14.
- **`git merge-base --is-ancestor <unknown 40-hex> HEAD`** → `fatal: Not a
  valid commit name …`, exit 128. **Steps.** 13.
- **FTS5 tokenizers and prefix queries** (*superseded below by the one
  in-house tokenizer*). `fts5(name, tokenize = "unicode61
  remove_diacritics 0 tokenchars '_$'")` over `user_name`, `getUserName`,
  `helper`, `café`, `$store`: `"user"*` → `user_name`; `"help"*` → `helper`;
  `"caf"*` → `café`; `"cafe"*` → nothing; `"USER"*` → `user_name`.
  `fts5(path, tokenize = "unicode61 remove_diacritics 0")` over
  `src/util.ts`, `src/db/schema.ts`, `lib/café-x.ts`, `a_b-c.d`: `"util"*`,
  `"schem"*`, `"b"*`, `"café"*` each find their path. Both 2026-09-26
  reviews then executed the disagreement between this FTS configuration and
  a `NOCASE`/`LIKE` fallback (expert review premise 2; collapse-hunt P1:
  `café`, `émile`, `bar`, `method` each found by FTS and not by `LIKE`).
  **Steps.** 7, 14.
- **LIKE index use.** `EXPLAIN QUERY PLAN SELECT * FROM t WHERE name LIKE
  'help%'`: over `CREATE INDEX … ON t(name COLLATE NOCASE)` → `SEARCH t
  USING COVERING INDEX … (name>? AND name<?)`; over a plain `ON t(name)` →
  `SCAN t`; a range `token >= ? AND token < ?` over a plain index → `SEARCH
  … USING INDEX`. **Steps.** 7, 14.
- **`DatabaseSync` on a missing path** creates the file; `new
  DatabaseSync(pathToFileURL(p).href + '?mode=rw')` on a missing path throws
  `unable to open database file` and creates nothing, and on an existing WAL
  store under a directory named `dir with #?` opens it (`journal_mode` wal,
  rows readable). `typeof require('node:sqlite').backup` → `function`.
  **Steps.** 3, 28, 32.
- **The literal-only `lit` parameter.** `function lit<const T extends
  string>(text: string extends T ? never : T)`: `lit('has changed with')`
  compiles; `lit(s)` with `s: string` fails `TS2345: Argument of type
  'string' is not assignable to parameter of type 'never'`; `` lit(`x${s}`) ``
  compiles (a pattern literal type) — hence `T-19-3`. **Steps.** 6, 19.
- **Transcript tool-result outcome field.** This session's own transcript
  (`~/.claude/projects/-home-user-agent-armory/<session>.jsonl`, read
  2026-09-26): 227 `tool_result` blocks with `is_error: false`, 4 with
  `true`, 89 with no `is_error` field — **a total over all tools, which the
  plan first read as a success signal for file tools; corrected:** split by
  tool across all 24 transcripts under `~/.claude/projects/` (collapse-hunt
  P4, recorded as architecture V23), `is_error: false` appears only on Bash
  results (845; `true` 9); Read: field absent 373, `true` 1; Edit: absent 89;
  Write: absent 12; Grep: absent 3; Glob: absent 1. No attachment entry of a
  hook-injected `additionalContext` type (no hook on this machine emits one);
  no Grep or Glob `toolUseResult` in any transcript under
  `~/.claude/projects/`. **Steps.** 21, 28; gaps in §15.
- **The one in-house tokenizer, both search paths** (executed 2026-09-26 for
  this revision, scratchpad throwaway, Node v22.22.2). `tokenize(s) =
  s.normalize('NFKD').toLowerCase().replace(/\p{M}+/gu, '')
  .split(/[^\p{L}\p{N}]+/u).filter(Boolean)`; seventeen symbol names
  (`user_name`, `getUserName`, `helper`, `CAFÉ`, `café_x`, `Émile`, `Über`,
  `über_x`, `foo-bar`, `valid?`, `my.method`, `Foo::Bar`, `userXname`,
  `$store`, `İstanbul`, `Größe`, and a decomposed `cafe` + U+0301 + `b`) written
  both as space-joined tokens into `fts5(tokens, symbol_id UNINDEXED,
  tokenize = "ascii")` and as one row per distinct token into a
  `symbol_tokens(token, symbol_id)` table with a plain index. Nineteen
  queries (`café`, `CAFE`, `über`, `Ü`, `bar`, `method`, `foo`, `user`,
  `USER`, `name`, `get`, `help`, `valid`, `e"x*`, `istanbul`, `grösse`,
  `größe`, `$store`, `store`), each tokenized, each token prefix-searched
  (`MATCH '"<t>"*'` against the range `token >= ? AND token < ? ||
  char(1114111)`), hits intersected: all nineteen **AGREE**. Samples: `bar`
  → `foo-bar`, `Foo::Bar` on both; `café` → `CAFÉ`, `café_x`, the decomposed
  `caféb` on both; `user` → `user_name`, `userXname` (not `getUserName`) on
  both; `e"x*` → nothing on both, no error. `EXPLAIN QUERY PLAN` of the range
  query: `SEARCH symbol_tokens USING INDEX st (token>? AND token<?)`.
  **Steps.** 7, 9, 14.
- **Premises executed by the two 2026-09-26 plan-pass reviews and relied on
  here** (evidence in those records, not re-run): a Stop hook's
  `additionalContext` continues the conversation, bounded by
  `stop_hook_active` and an 8-continuation cap (expert review premise 6 —
  Step 28's S2 rule); the hooks reference has 0 `MultiEdit` matches and
  documents the file tools `Write`, `Edit`, `NotebookEdit` (premise 7 — m6);
  `mode=rw` refuses a missing file, a file in a missing directory, and a
  directory at the path, all with errcode 14 (collapse-hunt P2 — Step 3's
  `stat` follow-up); git writes `Revert "…"`, `Reapply "…"`, and nested
  `Revert "Reapply "…""` subjects, each with the trailer (P3 — Step 13); the
  installed Claude Code 2.1.283 Grep output schema returns `filenames: []` in
  `content` and `count` modes and fills it only in `files_with_matches`, and
  Glob returns `{filenames, durationMs, numFiles, truncated}` (P5 — Step 28's
  three cases); a failing `node:test` test marked `{todo: …}` reports
  `todo 1`, `fail 0`, and the run exits 0 (P7 — Checkpoint 1R). **Steps.** 3,
  13, 28; §9.
- **AD-13's weight range** (executed 2026-09-26, same run):
  `2^(days from 2000-01-01 to 2100-01-01 / h)` is `1.33e30` at `h` = 365,
  `1.72e301` at 36.5, `2.63e305` at 36, and `Infinity` at 30 and 10; the
  current exponent at `h` = 365 is about 26.75. Hence Step 12's `h ≥ 37`
  guard. **Steps.** 12, 13.
- **Hooks reference, fetched 2026-09-26** (`code.claude.com/docs/en/hooks.md`,
  331,440 bytes): "File-tool `tool_input` paths arrive in the same format as
  for PreToolUse: always absolute"; "The exact schema for both depends on the
  tool" (of `tool_input`/`tool_response` in `PostToolUse`); no Grep/Glob
  `tool_response` field is documented. **Steps.** 28; gap in §15.

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
| S3 | T-3-1, T-3-2, T-3-3, T-3-4, T-3-5, T-3-6 |
| S4 | T-4-1 |
| S5 | T-5-1, T-5-2, T-5-3, T-5-4, T-5-5 |
| S6 | T-6-1, T-6-2, T-6-3, T-6-4 |
| S7 | T-7-1 |
| S8 | T-8-1 |
| S9 | T-9-1, T-9-2 |
| S10 | T-10-1, T-10-2, T-10-3, T-10-4 |
| S11 | T-11-1, T-11-2, T-11-3, T-11-4, T-11-5 |
| S12 | T-12-1, T-12-2, T-12-3 |
| S13 | T-13-1, T-13-1o, T-13-1p, T-13-2, T-13-2a, T-13-3, T-13-4, T-13-5, T-13-6, T-13-6d, T-13-6e |
| S14 | T-14-1, T-14-2, T-14-3, T-14-4, T-14-5 |
| S15 | T-15-1, T-15-2, T-15-3, T-15-4, T-15-5, T-15-6 |
| S16 | T-16-1, T-16-2, T-16-3 |
| S17 | T-17-1, T-17-2 |
| S18 | T-18-1, T-18-2, T-18-3, T-18-4, T-18-5, T-18-6, T-18-7, T-18-8, T-18-9, T-38-10, T-38-11, T-38-12, T-38-13, T-38-14, T-38-28, T-38-29 |
| S19 | T-19-1, T-19-2, T-19-3, T-38-19 |
| S20 | T-20-1, T-20-2, T-20-3, T-38-17, T-38-20, T-38-21, T-38-23, T-38-34 |
| S21 | T-21-1, T-21-2, T-21-3 |
| S22 | T-22-1 |
| S23 | T-23-1, T-23-2, T-23-3 |
| S24 | T-24-1, T-24-2, T-24-3 |
| S25 | T-25-1, T-25-2, T-25-3, T-38-1, T-38-2, T-38-3, T-38-4, T-38-5, T-38-30, T-38-31 |
| S26 | T-26-1, T-38-6 |
| S27 | T-27-1, T-27-2, T-38-7, T-38-8, T-38-9 |
| S28 | T-28-1, T-28-2, T-28-3, T-28-4, T-28-5, T-28-6, T-28-7, T-28-8, T-28-9, T-28-10, T-28-11 |
| S29 | T-29-1, T-29-2 |
| S30 | T-30-1, T-30-2, T-30-3 |
| S31 | T-31-1, T-31-2, T-31-3 |
| S32 | T-32-1, T-32-2, T-32-3, T-32-4 |
| S33 | T-33-1, T-33-2, T-33-3, T-33-4 |
| S34 | T-34-1, T-34-2, T-34-3 |
| S35 | T-35-1, T-35-2 |
| S36 | T-36-1 |
| S37 | T-37-1 |
| S38 | T-38-1, T-38-2, T-38-3, T-38-4, T-38-5, T-38-6, T-38-7, T-38-8, T-38-9, T-38-10, T-38-11, T-38-12, T-38-13, T-38-14, T-38-15, T-38-16, T-38-17, T-38-18, T-38-19, T-38-20, T-38-21, T-38-22, T-38-23, T-38-24, T-38-25, T-38-26, T-38-27, T-38-28, T-38-29, T-38-30, T-38-31, T-38-32, T-38-33, T-38-34 |
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
Tests run through `scripts/run-tests.mjs` (unit/build/conventions/build_time) or
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
  - **Data.** The committed `package.json`, `package-lock.json` and
    `tsconfig.json`; `npm ci
    --ignore-scripts=false --loglevel silly` output captured. Technique:
    error guessing.
  - **NOT asserts.** Test outcomes (T-1-2 and later). **Fails when** `npm ci`
    or `tsc` exits non-zero, OR the captured log shows a `preinstall`,
    `install`, or `postinstall` lifecycle script running for the package, OR
    `package-lock.json` is absent from the checkout, OR
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
    twice into two temp directories; `git rev-list --all` compared. The
    generator's name set is also asserted equal to the §5.1 fixture list held
    as a literal in the test, so a name added to the generator or to §5.1 but
    not the other is caught rather than iterated over vacuously.
    Technique: equivalence partitioning over fixture names.
  - **NOT asserts.** Fixture content semantics (each consuming test).
    **Fails when** any name errors, OR any name's two hash lists differ, OR the
    generator's fixture set differs from the §5.1 literal list.

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

- **T-3-5 — Transactions nest; `mustExist` never creates.**
  - **File.** `test/unit/store_nesting.test.ts`.
  - **Verifies.** Step 3's build delta — AD-26's re-entrant transaction and
    the handler's no-create open.
  - **Level.** Integration (real engine, temp-file database).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** A store with `t(x INTEGER)`: (a) outer transaction inserts 1,
    inner inserts 2 and returns → both rows; (b) outer inserts 1, inner inserts
    2 then throws, outer catches and returns → only 1; (c) outer inserts 1,
    inner inserts 2 and returns, outer then throws → neither; (d) three
    levels deep, the middle throws and the outer catches → the innermost's and
    middle's rows gone, the outer's kept; (e) an inner call given
    `onBusyRetry` while another process holds the write lock is never
    retried (the outer holds the lock, so the inner cannot see busy — the
    callback is asserted never invoked); (f) `openStore(<missing path>,
    {mustExist: true})` throws `StoreMissing` and the path does not exist
    afterwards; the same call on an existing WAL store whose path contains a
    space, `#`, and `?` opens it; (g) `openStore(<path in a missing
    directory>, {mustExist: true})` throws `StoreMissing`; (h) `openStore(<a
    path that is a directory>, {mustExist: true})` throws `StoreUnreadable`
    with `pathKind: 'directory'` (collapse-hunt H8). Technique:
    state-transition + decision table.
  - **NOT asserts.** Savepoint names; the `EACCES` case (the test runner may
    be root, which no mode bit refuses). **Fails when** any case's row set
    differs from the stated one, OR a nested call throws "cannot start a
    transaction within a transaction", OR `onBusyRetry` fires below depth 0,
    OR case (f) creates the file or fails to open the existing one, OR (g) is
    not `StoreMissing` or creates the directory, OR (h) is `StoreMissing` or
    lacks `pathKind: 'directory'`, OR case (i) leaves row 3 without row 1.
  - **Case (i) — engine-abandoned transaction (Steps 1–12 build review
    S1).** `PRAGMA max_page_count` is capped just above the table's size;
    the outer inserts 1, an inner call inserts a row too large to fit
    (`SQLITE_FULL`), the outer catches that error, inserts 3, and returns.
    If the engine kept the transaction, the result is case (b)'s shape:
    rows {1, 3}, no throw. If it abandoned it, the outer call throws
    `TransactionAborted` and the table is empty. Either way rows {3} alone —
    the executed defect — fails the test; the test records which branch the
    engine took.

- **T-3-6 — `backupFile` into a store another process holds open.**
  - **File.** `test/unit/store_backup.test.ts`, holder
    `test/unit/store_backup_holder.ts`.
  - **Verifies.** Step 3's `backupFile` — the G34 probe the review executed.
  - **Level.** Integration (real engine; a real second process).
  - **Real/doubles.** Real `node:sqlite`; a real child process; no doubles.
  - **Data.** A live store L with table `other` and ≥ 200 uncheckpointed WAL
    frames held open by the holder child (it opens L with
    `wal_autocheckpoint = 0`, writes, reports "holding", and waits); an
    export E with table `t` and 5 rows; `backupFile(E, L)` while the holder
    is still open. Technique: error guessing (the executed corruption).
  - **NOT asserts.** Backup speed. **Fails when** `PRAGMA integrity_check` on
    L afterwards is not `ok`, OR L's tables are not exactly E's, OR `t` does
    not hold E's 5 rows.

- **T-4-1 — Layout creates 0o700 directories and reports loose modes.**
  - **File.** `test/unit/layout.test.ts`.
  - **Verifies.** Step 4.
  - **Level.** Integration (real filesystem in a temp dir).
  - **Real/doubles.** Real filesystem; no doubles.
  - **Data.** (a) empty temp home — `ensureHome` alone, then `ensureLayout`;
    (b) temp home with a pre-existing `projects/<key>` at mode 0o755; (c) a
    temp home with a pre-existing `diagnostics/` at 0o755. Technique:
    state-transition.
  - **NOT asserts.** umask policy. **Fails when** a created directory's mode
    is not `0o700`, OR `ensureHome` on the empty home does not create
    `<home>/`, `global/`, and `diagnostics/` or creates any `projects/`
    entry, OR the loose-mode directory is modified, OR `looseMode` does not
    list it, OR `ensureHome`'s returned path is not `<home>/diagnostics`.

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
    key changes across runs, OR the non-git directory is not path-keyed
    through the failure branch (its diagnostic `detail` names exit 128), OR
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

- **T-5-4 — The fatal path decoder and the byte escaper.**
  - **File.** `test/unit/path_bytes.test.ts`.
  - **Verifies.** Step 5's `decodePathBytes`, `splitNul`, `escapeBytes` (G7).
  - **Level.** Unit.
  - **Real/doubles.** Real functions; no doubles.
  - **Data.** `café.txt` as UTF-8; `bad\xff.txt` and `bad\xfe.txt` as raw
    bytes; `a\0b\0` (two fields, trailing empty dropped); an empty buffer.
    Technique: equivalence partitioning.
  - **NOT asserts.** Filesystem behaviour. **Fails when** `café.txt` does not
    decode, OR either invalid name decodes to anything but `null`, OR the two
    escapes are equal or differ from `bad\\xff.txt`/`bad\\xfe.txt`, OR
    `splitNul` returns other than two fields.

- **T-5-5 — `oracleRunSync` returns raw bytes and a non-zero status.**
  - **File.** `test/unit/spawn_wrapper.test.ts`.
  - **Verifies.** Step 5's `oracleRunSync`.
  - **Level.** Integration (real child process).
  - **Real/doubles.** Real `node -e` children; no doubles.
  - **Data.** A child writing the bytes `0xff 0x00 0x41` to stdout and exiting
    1; a child echoing its stdin (`input` = `a\0b`). Technique: equivalence
    partitioning.
  - **NOT asserts.** Timing. **Fails when** the call throws, OR `status` ≠ 1,
    OR `stdout` is not exactly those three bytes, OR the echo differs from
    the input, OR the child lacks `CTXORACLE_INTERNAL=1`.

- **T-6-1 — `FAULT_CODES` equals the enumerated set.**
  - **File.** `test/unit/fault_codes.test.ts`.
  - **Verifies.** Step 6.
  - **Level.** Unit.
  - **Real/doubles.** None.
  - **Data.** The literal list of Step 6's 2026-09-26 build delta — the 19
    AD-17 codes (including `repo_not_bound`, `whisper_dropped_unverifiable`,
    `import_rejected`, and the two reserved), `store_busy`, and the nine
    plan-named codes (`tuning_missing`, `head_unresolved`,
    `miner_unparsed_numstat`, `reindex_locked`, `frontend_parse_failed`,
    `history_rewritten`, `path_not_utf8`, `index_path_only_oversize`,
    `handler_exception`) — 29 codes, written out in the test; plus the
    removed `whisper_dropped_stale`, which must be absent. Technique:
    equivalence partitioning (in-set/out-of-set).
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

- **T-6-3 — A non-literal headline word fails to compile.**
  - **File.** `test/build/typecheck_headline_literal.test.ts`, fixture
    `test/build/fixtures/headline_nonliteral.ts`.
  - **Verifies.** Step 6's `lit` parameter type (G24).
  - **Level.** Unit (compile-time, via `tsc_fixture.ts`).
  - **Real/doubles.** Real `tsc`; no doubles.
  - **Data.** A fixture declaring `const s: string = process.argv[2] ?? ''`
    and calling `lit(s)`. Technique: equivalence partitioning.
  - **NOT asserts.** Template-literal arguments (`T-19-3`'s scan).
    **Fails when** the fixture compiles OR the diagnostics do not include
    `TS2345`.

- **T-6-4 — Consumer key encoding and role.**
  - **File.** `test/unit/consumer_key.test.ts`.
  - **Verifies.** Step 6's `consumerKey`/`consumerRole` (AD-4, G23/G29).
  - **Level.** Unit.
  - **Real/doubles.** Real functions; no doubles.
  - **Data.** `('s1')`, `('s1', '')`, `('s1', 'ag1')`, `('s1', 'main')`,
    `('s2', 'ag1')`; `consumerRole('garbage')`. Technique: equivalence
    partitioning + boundary (empty agent id).
  - **NOT asserts.** Storage. **Fails when** the first two are not
    `s1#main`, OR `('s1','ag1')` is not `s1#sub:ag1`, OR `('s1','main')` has
    role `main`, OR `('s2','ag1')` equals `('s1','ag1')`, OR the malformed
    key does not throw.

- **T-7-1 — Project migration applies; constraints reject negatives; dedup index state machine.**
  - **File.** `test/unit/migrations_phase_a.test.ts`.
  - **Verifies.** Step 7.
  - **Level.** Integration (real engine + the real migration file).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** Empty DB → migrations with `fts: true` (001, `fts_state` =
    `'fts5'` recorded, 001b) and, on a second empty DB, with `fts: false`
    (001 only; `fts_state` = `'fallback'`; `sqlite_master` holds no `fts_*`
    table and the `symbol_tokens_token` and `path_tokens_token` indexes
    exist, and no `symbols_name` index does); the second DB migrated again
    with `fts: true` (`fts_state` still `'fallback'`, still no `fts_*`
    table — the row is written once); per knowledge
    table one valid row and one row per CHECK-constrained column violating
    it; the `questions` sequence open → duplicate open (rejected) →
    answered → re-open (accepted); `sqlite_master` must not contain
    `exemplars`, `recipes`, `env_capabilities`, `deferred_queue`,
    `genre_state`. **2026-09-26 cases:** a `files` row with `in_tree = 2`
    (rejected) and one with NULL `content_hash` and `in_tree = 0`
    (accepted), whose `change_weight` defaults to 0; `cochange_pairs` has no
    `a_count`/`b_count` column and requires `last_commit` and `pair_weight`;
    deleting a `symbols` row cascades its `symbol_tokens` rows; deleting a `files` row that a `cochange_pairs`,
    `landmines`, or `labelled_touches` row references **fails** with a
    foreign-key error, while deleting one only `symbols`/`import_edges`/
    `path_tokens` rows reference cascades them; a second `fix_chatter` row for
    the same file is rejected by `landmines_miner_key` while a second
    `human_stated` row for it is accepted; `corrections` accepts (whisper id,
    no genre), (neither id, `missed`, genre `coupling`), and (neither id,
    `missed`, no genre), and rejects (both ids), (neither id, `false_fire`),
    and (whisper id + genre); inserting into `whisper_audit`, `corrections`,
    `session_log`, `observed_actions` without `seq` yields `seq` 1, 2, 3 in
    insert order; `EXPLAIN QUERY PLAN` of `SELECT symbol_id FROM symbol_tokens
    WHERE token >= 'ab' AND token < 'ab' || char(1114111)` names
    `symbol_tokens_token` (not `SCAN`); under `fts: true`, with the rows
    written as the indexer writes them (the tokens of `src/util.ts`, `src util
    ts`, and of `user_name` and `getUserName`, `user name` and `getusername`),
    `fts_paths MATCH '"util"*'` matches the path row and `fts_symbols MATCH
    '"user"*'` matches `user_name` and not `getUserName`.
    Technique: decision table over CHECKs and the FTS flag;
    state-transition for the index. The two `fts_state` outcomes this test
    asserts against a real engine are independently reproduced by
    `probe:19_fts_migration_sequence` (executed 2026-09-08): a real
    `node:sqlite` reimplementation of `applyMigrations`'s exact sequence
    prints `writing schema_meta before migration 001 creates the table
    throws: true` — confirming a write to `schema_meta` before migration
    001 creates it is genuinely unexecutable, so `applyMigrations`'s own
    ordering (001 creates the table; the row is recorded between 001 and
    001b, from the `fts` argument; 001b is gated on the recorded row) is
    the only sequence that can run at all — then reproduces this table's
    two rows exactly: `fts_state` recorded as `'fts5'` under `fts: true`
    and `'fallback'` under `fts: false`, and unchanged under either row's
    re-run with the opposite flag.
  - **NOT asserts.** DAO behaviour (T-9-1). **Fails when** the migration
    errors under either flag, OR `fts_state` is not `'fts5'` after the
    first run or `'fallback'` after the second, OR the `fts: false` run
    creates an `fts_*` table or lacks an index, OR the re-run flips the
    recorded state or creates an `fts_*` table, OR any CHECK accepts its
    negative, OR the dedup index deviates from the sequence, OR a
    forbidden table exists, OR any 2026-09-26 case above behaves otherwise.

- **T-8-1 — Global migration: exactly the four tables.**
  - **File.** `test/unit/migrations_global.test.ts`.
  - **Verifies.** Step 8.
  - **Level.** Integration (real engine).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** Empty DB → migration 002; `sqlite_master` compared to
    `{global_meta, whisper_stats, tuning, lessons}`; `PRAGMA table_info(
    whisper_stats)` compared to `genre, project_key, sent, corrected_false,
    corrected_missed, published_at` with primary key `(genre, project_key)`;
    a second row with the same `(genre, project_key)` is rejected.
    Technique: decision table (present/absent).
  - **NOT asserts.** Seed values (T-12-1). **Fails when** a table is missing
    or a fifth Phase A table is present, OR `whisper_stats` has a
    `window_start`/`window_end` column or a different key.

- **T-9-1 — Per-DAO CRUD round-trips.**
  - **File.** `test/unit/dao_crud.test.ts`.
  - **Verifies.** Step 9 — every Step 9 DAO in §5.1 (all but `tuning.ts`,
    which `T-12-1` covers) creates, reads, updates, and deletes against the
    STRICT schema; ids are ULIDs; `whisper_audit.append`
    returns its id synchronously.
  - **Level.** Integration (real engine via migrations).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** One minimal valid row per DAO with real provenance (repo-derived
    rows carry `trust='untrusted_repo'`). All three FR-X4 laundering cases are
    rejected at the entry point: a human-provenance input written as
    `'untrusted_repo'`, a non-human input written as `'human'`, and a non-human
    input written as `'mechanical'` (the schema's reserved later-phase value —
    `FR-X2` — which no Phase A entry point may emit). **2026-09-26 surface:**
    `files.ensureHistoryRow('h.txt', false)` twice returns the same id and
    the row has `in_tree = 0`, zone `unknown`, NULL `content_hash`;
    `markAbsentExcept` on a set missing one `in_tree = 1` file returns that
    id and leaves the row with `in_tree = 0`; `sweepUnreferenced` deletes an
    unreferenced `in_tree = 0` row and keeps one a pair references;
    `cochange_pairs.bump(1, 2, 100, 'h1', 0.5)` then `bump(1, 2, 50, 'h0',
    0.25)` leaves `pair_count = 2`, `pair_weight = 0.75`, `last_ts = 100`,
    `last_commit = 'h1'`; `files.addChangeCount(id, 1, 0.5)` twice leaves
    `change_count = 2`, `change_weight = 1.0`, and `resetChangeCounts()` sets
    both to 0; `symbol_tokens.replaceForFile` twice with different tokens
    leaves only the second set; `observed_actions.writtenSinceSeq(p, s)` is
    true for an `ok` Edit row with `seq > s` and false for a `failed` one and
    for `s = maxSeq()`; `session_log.latestSession()` names the session of the
    largest `seq`, not the one whose liveness row is newest, and
    `hasEnded` is true only after a `SessionEnd` row; `rebuildMinerKinds`
    twice with the same rows leaves one row per `(kind, file_id)` and never
    removes a `human_stated` row; `corrections.since(0)` returns rows in
    `seq` order and `since(maxSeq())` returns none; `whisper_stats.
    replaceForProject('k', rows, t)` twice leaves exactly `rows` for `k` and
    another project's rows untouched; `whisper_audit.subjectKeyForText`
    returns the newest matching row's `subject_key` and `null` for an
    unmatched text; `observed_actions.okEditedPaths` excludes a `failed` Edit
    and a Bash row; an outer `store.transaction` around two DAO writes that
    then throws leaves neither row (DAOs compose). Technique: equivalence
    partitioning + state-transition.
  - **NOT asserts.** Type-level enforcement (T-9-2). **Fails when** any
    round-trip loses or mutates data, OR an id is not a valid ULID, OR
    `append` returns a Promise, OR any of the three trust-laundering writes is
    accepted, OR any 2026-09-26 case above behaves otherwise.

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
    `dist/src/diag/status.js`, `dist/src/diag/log.js`, `dist/src/diag/regret.js`,
    `dist/src/cli/correct.js` (the readers §5.1 names).
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
    Base64 string, a Unicode phrase, and a realistic 28-character code
    identifier at ~3.97 bits/char — just below the 4.0 threshold, so real code
    near the boundary is exercised rather than a degenerate low-entropy run.
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
    with its value and `source` — including the 2026-09-26 keys
    (`bar.high_confidence_min` 0.8, `bar.untrusted_trust_factor` 0.9,
    `bar.suspect_confidence_cap` 0.7, `bar.heuristic_confidence_cap` 0.7,
    `bar.stale_factor` 0.9, `bar.hazard_full_support` 3,
    `reuse.max_unresolved_import_share` 0.05, `miner.chunk_ms` 50, all
    `architecture_default`; `index.entry_marker_points` 1 and
    `bar.recency_half_life_days` 365 `plan_seed`; the four new lists with the
    members Step 12 names) and the absence of any
    `bar.untrusted_confidence_cap` or `bar.stale_index_factor` row; set a scalar; add and remove a list member;
    `seedDefaults` again. The load-bearing scalars are additionally pinned to
    the §10 literal values/sources (not to the seed module the seeder reads),
    so a silent drift between the seed module and the plan is caught.
    Technique: decision table (key present/value/source) + state-transition.
  - **NOT asserts.** Bar arithmetic (T-16-1). **Fails when** any seed is
    missing, has the wrong value, or the wrong `source`; OR a load-bearing
    scalar diverges from its §10 literal; OR a round-trip loses a value; OR the
    second `seedDefaults` changes any row.

- **T-12-2 — `tuningReader`: resolution order, re-seed, `tuning_missing`.**
  - **File.** `test/unit/tuning_reader.test.ts`.
  - **Verifies.** Step 12's reader (G8, G17).
  - **Level.** Integration (real global store via migration 002).
  - **Real/doubles.** Real store; `onMissing` is a **spy** (Meszaros) — a
    recording function, justified because the reader's contract is to call
    its sink, and the fault writer behind it is Step 10's, tested there.
  - **Data.** Seeded store; a project row `bar.confidence_floor = 0.7` for
    key `k1`; the NULL row deleted for `bar.support_min`; a list key with
    project-level members for `k1`; an unknown key. Technique: decision table.
  - **NOT asserts.** Fault storage. **Fails when** `k1` does not read 0.7 and
    another key does not read 0.6, OR `bar.support_min` does not read 3 with
    `onMissing` called exactly once with that key and the row re-written with
    source `architecture_default`, OR the list reads the NULL-level members
    for `k1`, OR the unknown key does not throw.

- **T-12-3 — The ordering validator.**
  - **File.** `test/unit/tuning_reader.test.ts`.
  - **Verifies.** Step 12's `checkTuningWrite` and `tuningWriteNotice`
    (AD-13, AD-14, AD-20; collapse-hunt H2).
  - **Level.** Unit (over a real seeded reader).
  - **Real/doubles.** Real function and store; no doubles.
  - **Data.** Boundary values, each against the seeds: suspect cap 0.6 (ok,
    = floor), 0.59 (refused), 0.8 (refused, = high), 0.79 (ok); heuristic cap
    likewise; trust factor 0 (refused: interval), 0.0001 (refused: tier
    invariant, 0.0001 × 0.9 < 0.8), 0.889 (ok: 0.8001), 0.888 (refused:
    0.7992), 1 (ok), 1.0001 (refused: interval); stale factor 0 and 1.0001
    (refused: interval), 0.888 (refused: tier invariant), 0.9 and 1 (ok); high
    0.82 (refused: the tier invariant, 0.9 × 0.9 = 0.81 < 0.82); floor 0.71 (refused: above both caps); high 0.7 (refused: at
    the caps); `bar.recency_half_life_days` 37 (ok), 36 (refused), 0
    (refused); `tuningWriteNotice` for `bar.recency_half_life_days` and for
    `bar.support_min`. Technique: boundary value analysis.
  - **NOT asserts.** Wording beyond naming the relation. **Fails when** any
    case's ok/refused differs from the stated one, OR a refusal's reason
    does not name every key in the violated relation, OR the half-life notice
    is null or does not name `ctxoracle index`, OR the `bar.support_min`
    notice is not null.

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
    within the 90 days before `HEAD`; one file renamed in place
    (`old.txt` → `new.txt`), in a commit that also touches the planted pair's
    partner, whose `-z --numstat` entry is a rename (an empty-path entry followed
    by the two raw NUL fields `old.txt`, `new.txt`), both identities added to the
    touched set. The miner's `-z` path handling is exercised across its classes,
    each co-changing with the planted pair's partner in one commit — a non-ASCII
    path (`café.txt`), a backslash path (`back\slash.txt`), a tab path
    (`ta<TAB>b.txt`), a newline path (`ne<LF>wl.txt`), and a **Record-Separator
    path** (`we<0x1e>ird.txt`, whose name holds the very `0x1e` byte the commit
    framing uses — a legal filename byte git emits raw under `-z`), every one of
    which git's *line*-mode `--numstat` would C-quote but `-z` emits **raw**, so
    each must land in `cochange_pairs` under its exact raw `readdir` key; the
    `0x1e` path in particular must be recorded **whole**, never cut by the record
    framing into a fabricated pair (the parser splits on NUL only); a **real,
    non-renamed** file literally named `a => b.txt` (a plain add with no
    quote-forcing byte, which line mode would print byte-identical to a rename),
    which under `-z` is a **single** NUL field and must be recorded as the one
    path `a => b.txt`, never split into a phantom `a` / `b.txt` pair
    (`probe:24_git_numstat_z`); and a **binary** file (a `-\t-` numstat entry)
    whose path must still be recorded. The generator also feeds the miner's
    parser two **synthetic malformed `-z` records**, neither of which real git
    emits — a numstat entry missing a field, and a **truncated rename** (a rename
    marker `<added>\t<deleted>\t` with an empty path but its two identity fields
    missing at end of stream) — each of which must be recorded as
    `miner_unparsed_numstat` and contribute no pair (never a partial or guessed
    identity): the defensive guard against a future git output-format drift;
    plus a synthetic well-formed record whose **body** field contains `0x1e`
    followed by 40 hex digits (must not start a commit) and a commit whose
    body is empty (the empty `%b` field and the empty separator field that
    follows it, then the first entry's leading `\n`, as executed §11.4);
    and two more synthetic records (Step 13 build review m3, m5): a record
    whose timestamp field is `1e3` (a form `Number` accepts but
    `/^[0-9]+$/` rejects), and a leading field that is not a header followed
    by that record's subject, body, separator, and two entries.
    `mineCochange` runs with a `tuningReader` over a seeded global store.
    Technique:
    decision table over exclusion rules; equivalence partitioning over
    landmine classes, rename shape, and raw path classes.
  - **NOT asserts.** Confidence values (T-16-1). **Fails when** any excluded
    commit contributes to a pair count, OR the planted pair's count ≠ 5, OR
    the `revert_chain`/`fix_chatter` rows are missing or carry no evidence
    (the label cases themselves are `T-13-4`'s), OR the rename's `old.txt` or `new.txt` identity is missing from the pair
    counts, OR the rename lands in `files` or `cochange_pairs` as an unsplit
    literal string instead of its two identities, OR any of the raw special-byte
    paths (`café.txt`, `back\slash.txt`, `ta<TAB>b.txt`, `ne<LF>wl.txt`,
    `we<0x1e>ird.txt`) is absent from `cochange_pairs` under its exact raw
    `readdir` key, loses its co-change with the partner, or appears C-quoted (a
    leading `"`, a `"caf\303\251.txt"`, or any residual `\\`/`\t`/`\n`/octal
    escape), OR the `we<0x1e>ird.txt` path is cut by the record framing into a
    fabricated pair or a phantom entry (e.g. `we` and `ird.txt`) instead of the
    one whole path, OR the real
    file `a => b.txt` is not recorded as the **single** path `a => b.txt` (it is
    split into a phantom `a` / `b.txt` rename pair), OR the binary file's path is
    missing from the touched set, OR either synthetic malformed `-z` record (the
    field-short entry or the truncated rename) is not recorded as
    `miner_unparsed_numstat` (it is guessed into a pair or a partial identity,
    silently dropped, or crashes the parse), OR the body-held `0x1e`+hex
    starts a commit, OR the empty-body commit loses its first entry, OR the
    `1e3`-timestamp record is read as a commit, OR the non-header record
    yields other than exactly one `miner_unparsed_numstat` diagnostic (one per
    malformed commit record, never one per field — m3), OR the
    watermark does not advance to `HEAD`, OR `schema_meta.ref_ts` is not
    `HEAD`'s committer time, OR `schema_meta.corpus_floor_met` is not `'0'`
    for this fixture (fewer than 30 included commits).

- **T-13-1o — The stream does not depend on the user's `log.*` configuration.**
  - **File.** `test/unit/miner_git_env.test.ts`.
  - **Verifies.** Step 13's pinned `git log` flags (`--no-show-signature
    --root --no-textconv --no-ext-diff`) and `--no-show-signature` on the
    reference instant's `git log -1` — Step 13 build review S1.
  - **Level.** Integration (real `git`, real store).
  - **Real/doubles.** Real `git`; real store; no doubles.
  - **Data.** A repository of four commits, root included, where a pair
    `a.txt`/`b.txt` co-changes in the root commit and in two later ones,
    each commit object carrying a `gpgsig` header (written through `git
    hash-object -t commit -w`, so no signing key is needed; §11.4); a first
    store mined with the repository config as created; a second store mined
    after `git config log.showSignature true`, `git config log.showRoot
    false`, and `git config gpg.format openpgp` are set in the repository's
    own config (the way a user's `~/.gitconfig` reaches the child — the
    miner inherits the environment). Precondition asserted first: under that
    config, `git log` with the stream's format but without the four flags
    produces bytes different from the plain stream (so the case exercises
    the settings on this machine; the review's executed failure was
    `commitsSeen` 0 and 35 faults). Technique: equivalence partitioning over
    configuration (plain / signature-and-root settings).
  - **NOT asserts.** The signature verifier's text. **Fails when** the
    precondition does not hold, OR the second store's `commits`,
    `cochange_pairs` (`pair_count` and weights), `files.change_count` and
    `change_weight`, or `labelled_touches` differ from the first store's, OR
    `pair(a, b).pair_count ≠ 3` in either store (the root commit's entries
    counted), OR the second pass records any `miner_unparsed_numstat` fault,
    OR either store's `schema_meta.ref_ts` is not `HEAD`'s committer time, OR
    either store's `last_mined_commit` is not `HEAD`'s hash.

- **T-13-1p — A SHA-256 repository mines with no faults.**
  - **File.** `test/unit/miner_git_env.test.ts`.
  - **Verifies.** Step 13's header rule (`\x1e` + 40 or 64 lower-case hex)
    and AD-15's 40- or 64-hex revert trailer — Step 13 build review M1.
  - **Level.** Integration (real `git`, real store).
  - **Real/doubles.** Real `git`; real store; no doubles.
  - **Data.** `git init --object-format=sha256`; three commits each touching
    `a.txt` and `b.txt`; then `git revert --no-edit HEAD`, whose subject is
    then rewritten with `git commit --amend` to `undo three` while keeping
    git's body `This reverts commit <64 hex>.`, so only the 64-hex trailer
    can label it (§11.4). The parser is also fed `\x1e` + 41, 63, and 65 hex
    digits where a header is expected. Technique: equivalence partitioning
    over object formats; boundary value analysis on the header length.
  - **NOT asserts.** Weights. **Fails when** the pass records any
    `miner_unparsed_numstat` fault, OR `commits` does not hold exactly 4
    rows whose hashes are the repository's 64-hex hashes, OR `pair(a,
    b).pair_count ≠ 4`, OR the `undo three` commit has no `revert` row in
    `labelled_touches` for `a.txt` and `b.txt`, OR `last_mined_commit` is not
    `HEAD`'s 64-hex hash, OR a 41-, 63-, or 65-hex field is taken for a
    header.

- **T-13-2 — The `change_count` denominator.**
  - **File.** `test/unit/miner_denominator.test.ts`.
  - **Verifies.** Step 13 — support(A) stored once per file (AD-13, G3).
  - **Level.** Integration (real `git`, real store).
  - **Real/doubles.** Real `git`; real store; fixture `miner-denominator`; no
    doubles.
  - **Data.** `a.txt` changed in 7 included commits, 4 of them with `b.txt`;
    `b.txt` changed only in those 4; one single-file commit on `c.txt`.
    Technique: equivalence partitioning (paired / solo commits).
  - **NOT asserts.** Bar outcome. **Fails when** `change_count(a) ≠ 7`, OR
    `change_count(b) ≠ 4`, OR `change_count(c) ≠ 1`, OR `pair(a, b).pair_count
    ≠ 4`, OR `schema_meta.weight_epoch` is not `refTs − 500 × 365 × 86400`
    (`refTs` = `schema_meta.ref_ts`; AD-13's re-based epoch at the seeded
    half-life — Step 13 build review M3), OR `change_weight(a)` or
    `pair(a, b).pair_weight` differs by more than 1e-9 relative from the sum
    of `2^((min(ts, refTs) − E) / (365 × 86400))`, `E` the stored
    `weight_epoch`, over the stated commits' author timestamps (AD-13's
    weight at the seeded half-life), OR `cochange_pairs` has any
    `a_count`/`b_count` column (the executed defect stored `a_count 4`,
    confidence 1.00).

- **T-13-2a — The weight epoch: a far-future author date stays finite, and an out-of-range epoch re-bases.**
  - **File.** `test/unit/miner_denominator.test.ts`.
  - **Verifies.** Step 13's AD-13 epoch rule — `ts` capped at `refTs`,
    `schema_meta.weight_epoch` written `refTs − 500·h` days by a full mine and
    kept by an incremental one, and an exponent over 1000 forcing a purged
    full re-mine — Step 13 build review M3.
  - **Level.** Integration (real `git`, real store).
  - **Real/doubles.** Real `git`; real store; no doubles.
  - **Data.** (a) A repository of three commits: the first and third touch
    `c.txt` only; the second touches `a.txt` and `b.txt` with author date
    `@40000000000` (year 3237) and a committer date inside the fixture's
    timeline; `HEAD`'s committer date is also inside it. Mined at the seeded
    `h` = 365 (the review's executed failure on the Step 13 build: both
    weights read back NULL). (b) After (a)'s mine,
    `schema_meta.weight_epoch` set to `refTs − 1001 × 365 × 86400` (as if
    the store had been mined 1001 half-lives before `HEAD`), one commit
    added, and a pass run without `full`; a second store mines the same
    history from scratch. Technique: boundary value analysis (exponent at
    500, over 1000).
  - **NOT asserts.** Confidence values. **Fails when** in (a) any
    `files.change_weight` or `cochange_pairs.pair_weight` is NULL, not
    finite, or 0, OR the 3237 commit's contribution to `pair(a, b).pair_weight`
    differs by more than 1e-9 relative from `2^500` (its `ts` capped at
    `refTs`, and `refTs − E` = 500 half-lives), OR `weight_epoch` is not
    `refTs − 500 × 365 × 86400`; OR in (b) the pass is not a purged full
    re-mine — any row of `commits`, `cochange_pairs` (weights included),
    `files.change_count`/`change_weight`, or `labelled_touches` differs from
    the from-scratch store's, `weight_epoch` is not the new `refTs − 500 × 365
    × 86400`, or `mining_in_progress` is not `'0'` afterwards.

- **T-13-3 — History rewrite: one purge, a full re-mine, a fault.**
  - **File.** `test/unit/miner_rewrite.test.ts`.
  - **Verifies.** Step 13's rewrite path (G4, AD-13 purge set).
  - **Level.** Integration (real `git`, real store).
  - **Real/doubles.** Real `git`; real store; a copy of `miner-labels`; no
    doubles.
  - **Data.** Mine; `git commit --amend` on `HEAD` (whose subject is a revert
    of an earlier commit X), and a `git rebase` dropping X; mine again; a
    second store mining the rewritten history from scratch. Technique:
    state-transition (mined → rewritten → re-mined).
  - **NOT asserts.** Timing. **Fails when** any row of `commits`,
    `cochange_pairs` (weights included), `labelled_touches`,
    `files.change_count`/`change_weight`, or the miner-kind `landmines`
    differs from the from-scratch store's, OR any row
    cites the rewritten-away hashes (the old `HEAD`, X), OR a `human_stated`
    row planted before the rewrite is gone, OR no `history_rewritten` fault
    carries `{oldWatermark, newHead}`, OR `mining_in_progress` is not `'0'`
    afterwards.

- **T-13-4 — Labels and the per-pass landmine rebuild.**
  - **File.** `test/unit/miner_landmines.test.ts`.
  - **Verifies.** Step 13's labels and rebuild (G1, G5, N5; AD-15).
  - **Level.** Integration (real `git`, real store).
  - **Real/doubles.** Real `git`; real store; fixture `miner-labels`; no
    doubles.
  - **Data.** `r.txt`: two commits reverted with `git revert --no-edit` (body
    trailer) → `revert_chain` support 2; `big/`: a 40-file commit (size-
    excluded) reverted by a 40-file revert → every `big/` file carries one
    revert label; `f.txt`: four included commits with subjects `Fix: a`,
    `bug-fix b`, `hotfix c`, `fixing d` then, after a first mine, three more
    `fix e/f/g` and an incremental mine → one `fix_chatter` row, support 7;
    `x.txt`: commits `add fixture`, `prefix cleanup`, `suffix` → no label;
    `s.txt`: a 40-file commit subject `fix lint` → no fix label (size-
    excluded); `v.txt`: `Revert "fix v"` → a revert label and **no** fix
    label; `old.txt`: fix commits dated 100 days before `HEAD` with the window
    at 90 → no `fix_chatter`; the whole run repeated three times with no new
    commits. Technique: decision table over label classes + state-transition
    (base → incremental → idle passes).
  - **NOT asserts.** Warning rendering (T-18-5). **Fails when** any stated
    row or absence differs, OR any file has more than one row per miner kind
    after any pass, OR a row's `evidence` is not the counted hashes newest
    first, OR a commit message substring appears in any column of any table.

- **T-13-6 — Merge `HEAD` and branching histories: the watermark reaches `HEAD` and a resume never double-counts.**
  - **File.** `test/unit/miner_branches.test.ts`.
  - **Verifies.** Step 13's final watermark, the already-mined skip, and the
    purge's commit-provenance rule (AD-13, raised by the Step 13 test writer).
    (b)'s stopped pass is a full pass, so its resume is a purged crash
    continuation; the skip on an incremental continuation is `T-13-6d`'s
    (Step 13 build review M4).
  - **Level.** Integration (real `git`, real store).
  - **Real/doubles.** Real `git`; real store; no doubles.
  - **Data.** (a) a repository whose `HEAD` is a merge commit of a two-commit
    side branch into `main` (`git merge --no-ff`): after a full mine,
    `last_mined_commit` equals `HEAD`'s hash, and an index-free history
    staleness check (`last_mined_commit ≠ HEAD`) reads fresh; (b) the same
    shape with the side branch's commits dated between two `main` commits,
    mined with `miner.chunk_ms` = 0 and the pass stopped (a thrown error
    injected through the worker of T-13-5) after the first chunk whose
    newest commit is a `main` commit mined *after* a side-branch commit (not
    the fork point, where a resume cannot double-count), then resumed: `change_count`, `pair_count`,
    and the weights equal one uninterrupted mine's; (c) a path touched only
    by a commit that a history rewrite drops, and a path first touched by a
    dropped commit and again by a kept one: after the purge and re-mine, the
    first path's history-only `files` row is gone and the second's
    `prov_ref` is the kept commit's hash. Technique: state-transition.
  - **NOT asserts.** The chunk count. **Fails when** (a)'s
    `last_mined_commit` is not `HEAD`, OR (b)'s counts differ from the
    uninterrupted mine's, OR (c)'s swept row survives or the re-pointed
    `prov_ref` names a commit not in `commits`.

- **T-13-6d — An incremental pass stopped and resumed counts every commit once.**
  - **File.** `test/unit/miner_branches.test.ts`.
  - **Verifies.** Step 13's already-mined skip on an *incremental*
    continuation — the case T-13-6(b) cannot reach, because its stopped pass
    is a store's first mine, a full pass whose resume is a purged crash
    continuation that counts every commit once with or without the skip
    (Step 13 build review M4: mutation C4, the skip deleted, survived all of
    T-13-1…T-13-6).
  - **Level.** Integration (real `git`, real store, real processes).
  - **Real/doubles.** Real `git`; real store; T-13-5's worker process (role
    `mine-stop`: a pass-through store that throws `injected stop after
    <hash>` once a committed chunk leaves `last_mined_commit` at that hash);
    no doubles in the miner's path.
  - **Data.** T-13-6(a)/(b)'s merge shape — `m1` (fork point; `a.txt`,
    `b.txt`), side `s1` (`a.txt`, `s.txt`) and `s2` (`b.txt`, `s.txt`) dated
    between `m1` and `m2`, `main` commits `m2` and `m3` (`a.txt`, `b.txt`),
    and a `--no-ff` merge `HEAD`. A reference store mined once,
    uninterrupted. A second store (`miner.chunk_ms` = 0, one commit per
    chunk) first mined with the repository checked out detached at `m1`, so
    its watermark is `m1`; `main` checked out again; then an incremental
    pass over `m1..HEAD` (streaming `s1`, `s2`, `m2`, `m3`) run in the
    worker and stopped after the `m2` chunk; then a mine that completes.
    Technique: state-transition (mined to the fork → stopped incremental →
    resumed).
  - **NOT asserts.** The chunk count. **Fails when** the store is not mined
    to `m1` before the stopped pass, OR the stopped pass does not stop after
    the `m2` chunk (its stderr lacks `injected stop after <m2>`), OR
    `mining_in_progress` is not `'0'` after the stop (the stopped pass was
    not incremental), OR `s1` or `s2` is not in `commits` after the stop, OR
    after the resume (whose range `m2..HEAD` still reaches `s1` and `s2`
    through the merge) any file's `change_count` or `change_weight`, or any
    pair's `pair_count` or `pair_weight`, differs from the reference store's.

- **T-13-6e — A stream that yields fewer commits than the range holds never claims `HEAD`.**
  - **File.** `test/unit/miner_git_env.test.ts`.
  - **Verifies.** Step 13's completeness check in the final transaction —
    Step 13 build review M2.
  - **Level.** Integration (real `git`, real store, real processes).
  - **Real/doubles.** Real `git` and real store; the pass runs in T-13-5's
    worker (role `mine`) with `PATH` led by a directory holding a `git`
    shim that executes the real `git` (its absolute path resolved before the
    shim is installed) and, only for the `log` call carrying `--numstat`,
    rewrites the `\x1e` byte of chosen commit headers in its stdout to `X`,
    passing every other call and byte through — a double at the process
    boundary, standing in for a stream drift real git on this machine does
    not produce (S1's and M1's are fixed); no double inside the miner.
  - **Data.** A four-commit repository `c1`…`c4`, each touching `a.txt` and
    `b.txt`. (a) *A full first mine* with the shim corrupting `c4`'s header
    (the newest record, so no chunk can name `HEAD`); then a mine without
    the shim. (b) *An incremental pass:* a store mined plainly with the
    repository checked out detached at `c2`, `main` checked out again, the
    shim corrupting every header of the `c2..HEAD` stream; then a mine
    without the shim. A reference store mined once without the shim.
    Technique: state-transition + error guessing (stream drift).
  - **NOT asserts.** The malformed-record faults' `first` text. **Fails
    when** after (a)'s shimmed pass there is not exactly one
    `miner_unparsed_numstat` fault with detail `{expected: 4, read: 3}`, OR
    `last_mined_commit` is not `c3`'s hash, OR `mining_in_progress` is not
    `'1'`; OR after (b)'s shimmed pass there is not exactly one fault with
    detail `{expected: 2, read: 0}`, OR `last_mined_commit` is not `c2`'s
    hash, OR `mining_in_progress` is not `'0'`; OR after either completing
    mine `last_mined_commit` is not `HEAD`'s hash, `mining_in_progress` is not
    `'0'`, or any `change_count`, `change_weight`, `pair_count`, or
    `pair_weight` differs from the reference store's.

- **T-13-5 — Chunked commits: crash safety and the lock-hold bound.**
  - **File.** `test/unit/miner_chunks.test.ts`, worker
    `test/unit/miner_chunks_worker.ts`.
  - **Verifies.** Step 13's AD-26 chunking.
  - **Level.** Integration (real `git`, real store, real processes).
  - **Real/doubles.** Real `git`; real store; fixture `miner-large` (2,000
    commits × 20 files); no doubles.
  - **Data.** (a) *A crashed full pass:* `miner.chunk_ms` tuned to 0 (one
    commit per chunk): the worker runs a first (full) mine while the test
    polls `last_mined_commit`, then `SIGKILL`s it after the watermark first
    advances past commit 500; the invariant is checked, then a second mine
    completes — a crash continuation, so a purged full re-mine (Step 13); (b)
    at the seeded 50 ms, a full mine in the worker while a second process
    performs 200 single-row `observed_actions` appends through
    `store.transaction` (busy_timeout 100 ms + one retry); (c) *a repeated full
    mine:* `mineCochange({full: true})` twice on the same completed store, and
    `runIndex(…, {full: true})` once more on it; (d) *a crashed incremental
    pass:* a store mined to commit 1,000 (the fixture's first half, by
    mining a clone checked out there), the second 1,000 commits made
    reachable, an incremental mine killed after its watermark first advances
    past commit 1,500, then a mine that completes. Technique: state-transition
    + error guessing (crash).
  - **NOT asserts.** Throughput. **Fails when** after the kill in (a) any
    commit at or before the watermark is absent from `commits`, OR the pair
    counts differ from a fresh mine truncated at the watermark, OR
    `mining_in_progress` is not `'1'` after that kill and `'0'` after the
    completing mine, OR (a)'s completed store differs from a single
    uninterrupted mine (any count or weight doubled — expert review S3), OR
    any of the 200 appends raises `StoreBusy`, OR after (c) any
    `pair_count`, `pair_weight`, `change_count`, or `change_weight` differs
    from one mine's, OR in (d) `mining_in_progress` is ever `'1'`, the
    completing mine re-reads a commit at or before the killed pass's
    watermark (its `git log` range is `<watermark>..HEAD`), or the completed
    store differs from a single uninterrupted mine.

- **T-14-1 — Indexer skeleton on a small fixture repo.**
  - **File.** `test/unit/indexer.test.ts`.
  - **Verifies.** Step 14.
  - **Level.** Integration.
  - **Real/doubles.** Real `node:sqlite`; fixtures `indexer-small` and
    `over-threshold-file`; no doubles.
  - **Data.** 3 `.ts` files (one importing another), 1 `.py`, 1 `.sh`, 1
    file > 1 MB carrying a seeded fact, a zone-evidence comment containing a
    planted secret, a `test/` file importing a source file — run with an
    empty frontend list, the base run under `fts: true`; for the race
    case, a planted stale claim (`schema_meta.reindex_owner_pid` holding
    a pid that has exited) raced by two real `runIndex` child processes
    started behind a barrier, 50 iterations. Technique: equivalence
    partitioning over language/size/secret classes; state-transition (run
    → unchanged re-run → concurrent claim); two-process race.
  - **NOT asserts.** Symbol extraction (T-15-3); grammar-specific parse
    quality (T-15-1/2). **Fails when** any file lacks its `files` row, zone,
    or FTS path tokens, OR any `symbols` or `import_edges` row exists, OR
    the > 1 MB file is not path-only with an `index_path_only_oversize` fault
    (`cap: 'bytes'`, `lines` null), OR the secret
    appears verbatim in the store, OR the second run writes rows — including
    any `entry_score` update (`total_changes()` is unchanged across it —
    N4), OR two
    concurrent reindexes both proceed, OR any race iteration ends with
    both children proceeding or neither, OR the claim row survives the
    winner's completion, OR the refused child records no `reindex_locked`
    fault, OR, under `fts: true`, the
    `fts_paths` row count is not equal to the `files` row count, OR any
    `files` row lacks its `path_tokens` rows, OR — the
    whole run repeated on a
    store migrated with `fts: false` — `pathSearch` returns a different hit
    set than under `fts: true` for the fixture's path-token queries.

- **T-14-2 — `refreshIfStale` records `index_stale`, sets the flag, spawns nothing.**
  - **File.** `test/unit/indexer_stale.test.ts`.
  - **Verifies.** Step 14 — AD-17's `index_stale` detector as a pure store
    effect, in every `HEAD` layout `resolveHead` names: a moved `HEAD`
    yields an `index_stale` fault, `schema_meta.index_stale = '1'`, and
    `{stale: true}`; an unmoved `HEAD` yields nothing and `{stale: false}`;
    an unresolvable ref yields `head_unresolved` and `{stale: false}`; a
    completed `runIndex` clears the flag to `'0'`.
  - **Level.** Integration (real store, real git fixture).
  - **Real/doubles.** Real `node:sqlite`; real `git`; no doubles — no child
    process is expected, and the test establishes that none can be started
    by an import scan of `dist/src/index/indexer.js` (it imports neither
    `dist/src/util/spawn.js` nor `child_process` under either spelling, the
    same scan `T-5-3` runs) and that none was started by the absence of any
    `schema_meta.reindex_owner_pid` row during the calls (Step 14's claim
    is the trace a reindex child leaves).
  - **Data.** `indexer-small` indexed; then one commit added (`HEAD` moves);
    `refreshIfStale(store, checkoutRoot)` twice — the second call on the
    still-stale index (for the worktree layout,
    `checkoutRoot` is the worktree's own root); then `runIndex` (with an empty frontend list —
    the flag clears regardless); then `refreshIfStale` again — the sequence
    run in four layouts of the same fixture: the ordinary checkout; after
    `git pack-refs --all` (the branch ref packed, its loose file gone);
    after `git checkout --detach`; and from a linked worktree made by `git
    worktree add` (`.git` a `gitdir:` file, refs in the common directory);
    plus an unborn branch (`git init` with no commit) → `head_unresolved`
    with its reason, `{stale: false}`, no `index_stale`. Technique:
    state-transition (fresh → stale → stale → fresh) × equivalence
    partitioning over `HEAD` layouts.
  - **NOT asserts.** Who spawns the reindex (T-28-5 observes the handler's
    child). **Fails when** the stale call records no `index_stale` fault or
    leaves the flag unset, OR the second stale call records a second
    `index_stale` fault or writes `schema_meta` again (the fault is the
    transition only — expert review m3), OR either stale call returns
    anything but `{stale: true}`, OR `dist/src/index/indexer.js` imports the spawn
    wrapper or `child_process`, OR a `reindex_owner_pid` row appears during
    the calls, OR the fresh call records a fault, OR `runIndex` does not clear
    the flag, OR any layout's stale call misses the moved `HEAD` or any
    layout's fresh call records a fault, OR the unborn-branch case records
    `index_stale`, returns `{stale: true}`, or records no `head_unresolved`.

- **T-14-3 — The walk, zones, `in_tree`, `test_map`, UTF-8, oversize.**
  - **File.** `test/unit/indexer_walk.test.ts`.
  - **Verifies.** Step 14's `walkRepository`, zone signals, deletion rule,
    `test_map` conventions, and faults (G2, G7, G11, G15, N7, N13; AD-12).
  - **Level.** Integration (real `git`, real store, default frontends).
  - **Real/doubles.** Real `git`, filesystem, store; fixtures `indexer-walk`,
    `indexer-nongit`; no doubles.
  - **Data.** `indexer-walk`: `.gitignore` = `dist/` and `*.gen.ts`; force-added
    `dist/a.js` and `src/api.gen.ts`; `src/k.ts`; an untracked ignored
    `dist/b.js`; a tracked `gone.ts` deleted from the working tree after
    commit (and mined history pairing it with `src/k.ts`); files named
    `bad\xff.txt` and `bad\xfe.txt`; `src/a.ts` and `src/a.test.ts`
    importing it; `b.py` at the root and `tests/test_b.py` importing `b`;
    `pkg/x.go` and `pkg/x_test.go`;
    `node_modules/m/index.js`. `indexer-nongit`: a plain tree with `a.ts`,
    `.git/config` (a stray file), `node_modules/n.js`. Both indexed; then
    `src/k.ts` deleted and re-indexed. Technique: decision table over path
    classes + state-transition.
  - **NOT asserts.** Symbol quality. **Fails when** `dist/a.js` or
    `src/api.gen.ts` is not zone `generated` with evidence naming the ignore
    match, OR `dist/b.js` is indexed, OR `gone.ts` has `in_tree = 1` or its
    row or its pair is deleted, OR after deleting `src/k.ts` its row is not
    kept with `in_tree = 0` and no `symbols` rows, OR either `bad\x..` file
    has a row or the `path_not_utf8` fault is absent or reports count ≠ 2,
    OR `test_map` lacks `src/a.test.ts → src/a.ts` (`import_edge`),
    `tests/test_b.py → b.py`, or `pkg/x_test.go → pkg/x.go` (`same_dir`), OR
    `node_modules/` is walked in `indexer-nongit`, OR `indexer-nongit` throws
    or records `walk_mode` other than `'readdir'`, OR a file of 20,001 lines
    under 1 MB is parsed or its `index_path_only_oversize` fault lacks
    `cap: 'lines'`.

- **T-14-4 — The test-path glob dialect.**
  - **File.** `test/unit/path_glob.test.ts`.
  - **Verifies.** Step 14's `matchesTestPattern` (AD-12's stated dialect).
  - **Level.** Unit.
  - **Real/doubles.** Real function; no doubles.
  - **Data.** Every seeded pattern × `src/a.test.ts`, `a.spec.js`,
    `x/test_y.py`, `y_test.go`, `a/__tests__/b.js`, `test/u.js`,
    `tests/v.py`, `src/test/w.js` (`test/**` is root-anchored → false),
    `atest.ts`, `test_y.pyc`; plus `a/*/c` vs `a/b/c` (true) and `a/b/d/c`
    (false), `a/**/c` vs `a/c` (true), `a?c` vs `abc` (true), `a/c` (false).
    Technique: decision table.
  - **NOT asserts.** Performance. **Fails when** any cell differs from the
    dialect.

- **T-14-5 — Search semantics agree under both FTS states.**
  - **File.** `test/unit/search_semantics.test.ts`.
  - **Verifies.** Step 14's token-prefix search (N6, G16; AD-2).
  - **Level.** Integration (two real stores, `fts: true` / `fts: false`).
  - **Real/doubles.** Real stores built by the migrations and `runIndex`; no
    doubles.
  - **Data.** `tokenize` directly over `CAFÉ` (→ `['cafe']`), `café` (→
    `['cafe']`), `Über` (→ `['uber']`), `foo-bar` (→ `['foo', 'bar']`),
    `my.method` (→ `['my', 'method']`), `Foo::Bar` (→ `['foo', 'bar']`),
    `user_name` (→ `['user', 'name']`), `getUserName` (→ `['getusername']`),
    `$store` (→ `['store']`), and a decomposed `cafe` + U+0301 (→
    `['cafe']`); then two stores indexed from the same files `src/util.ts`,
    `src/db/schema.ts`, `lib/a_b-c.d`, `lib/café-x.ts` holding the symbols
    `helper`, `user_name`, `getUserName`, `$store`, `CAFÉ`, `Über`, `foo-bar`
    (a generic-frontend name), `my.method`, `Foo::Bar`; queries `util`,
    `schem`, `b`, `café`, `CAFE`, `über`, `bar`, `method`, `help`, `user`,
    `USER`, `get`, `name`, a term with `"` and `*` in it (AD-2's named cases;
    expert review M3, collapse-hunt H4). Technique: equivalence partitioning
    + error guessing (syntax injection).
  - **NOT asserts.** Ranking. **Fails when** any `tokenize` result differs
    from the stated one, OR any query's hit set differs between the two
    stores, OR `util` misses `src/util.ts` (G16), OR `help` misses `helper`
    (N6), OR `user` matches `getUserName`, OR `café` or `CAFE` misses `CAFÉ`,
    OR `über` misses `Über`, OR `bar` misses `foo-bar` or `Foo::Bar`, OR
    `method` misses `my.method`, OR the injected term throws or matches
    everything.

- **T-15-1 — Tree-sitter frontend on a TypeScript fixture.**
  - **File.** `test/unit/tree_sitter_frontend.test.ts`.
  - **Verifies.** Step 15.
  - **Level.** Integration.
  - **Real/doubles.** Real `web-tree-sitter` + `tree-sitter-wasms` grammar; no
    doubles.
  - **Data.** Two `.ts` files from `indexer-small`, one importing the other
    as `./util.js` where only `util.ts` exists. Technique: state-transition
    (source → parse → rows).
  - **NOT asserts.** Every symbol kind. **Fails when** a symbol is lost, a
    span is wrong, or the `./util.js` import does not yield an
    `import_edges` row to `util.ts`, OR the frontend's declared capabilities
    are not `{symbols: true, imports: true}`.

- **T-15-2 — Generic frontend on a shell file.**
  - **File.** `test/unit/generic_frontend.test.ts`.
  - **Verifies.** Step 15 — function-shape symbols emitted; no
    `import_edges`/`symbol_refs`.
  - **Level.** Unit.
  - **Real/doubles.** Real function; no doubles.
  - **Data.** A `.sh` file with two functions. Technique: equivalence
    partitioning.
  - **NOT asserts.** Grammar-quality parsing. **Fails when** the symbols are
    missing OR any `import_edge` is emitted OR `genericFrontend.capabilities`
    is not `{symbols: true, imports: false}`.

- **T-15-4 — A parse that throws falls back to generic with a diagnostic.**
  - **File.** `test/unit/tree_sitter_frontend_fallback.test.ts`.
  - **Verifies.** Step 15 — the catch-every-throwable rule.
  - **Level.** Integration.
  - **Real/doubles.** Real `web-tree-sitter` and the shipped `bash` grammar
    registered explicitly through the frontend list `runIndex` takes as an
    argument (D-plan-29 — `bash` is outside the default table, §4); real
    `node:sqlite`; no doubles.
  - **Data.** Two `.sh` files: one containing `case x in a) ;; esac` (whose
    parse throws a `TypeError` under the pinned runtime, executed) and one
    without, indexed with `treeSitterFrontend('bash')` ahead of
    `genericFrontend`. Technique: error guessing (the executed throw);
    state-transition (throw → discard → fresh instance).
  - **NOT asserts.** Bash parse quality. **Fails when** the `case` file
    lacks its generic-frontend `files`/`symbols` rows, OR no
    `frontend_parse_failed` fault names its path and language, OR the
    second file, parsed after the throw, fails to index, OR the exhausted
    parser instance is reused (the second file's parse throws).

- **T-15-3 — Indexer with the default frontends on `indexer-small`.**
  - **File.** `test/unit/indexer_frontends.test.ts`.
  - **Verifies.** Step 15 — `runIndex` with `defaultFrontends()` populates
    `symbols`, `import_edges` (including `pkg/use.py` → `pkg/mod.py` for
    both `from .mod import f` and `from . import mod` — review G12/N8),
    `symbol_refs`, `entry_score`, and `test_map`; `symbolSearch` and
    `pathSearch` return the same hit sets under `fts: true` and `fts:
    false` for the fixture's token queries (`help`, `util`, `mod`, `schem`,
    `user` — each a prefix of a token, never a whole path — N6);
    `fts_symbols` holds one row per `symbols` row under `fts: true`;
    `schema_meta.lang_capabilities` lists `typescript` and `python` with
    `imports: true` and `bash` (the `.sh` file) with frontend `generic`,
    `imports: false`.
  - **Level.** Integration.
  - **Real/doubles.** Real `node:sqlite`; real `web-tree-sitter` +
    `tree-sitter-wasms` grammars; fixture `indexer-small`; no doubles.
  - **Data.** The 3 `.ts` files (one importing another), 1 `.py`, 1 `.sh`,
    and the `test/` file importing a source file. Technique: equivalence
    partitioning over language, with the FTS flag as a second partition.
  - **NOT asserts.** Grammar-specific parse quality (T-15-1/2); the skeleton
    properties (T-14-1). **Fails when** an expected `symbols`,
    `import_edges`, `symbol_refs`, `entry_score`, or `test_map` row is
    missing, OR the two flags' hit sets differ for any listed token, OR a
    prefix token (`help`, `schem`) finds nothing under either flag, OR,
    under `fts: true`, the `fts_symbols` row count is not equal to the
    `symbols` row count, OR `lang_capabilities` differs from the stated
    entries.

- **T-15-5 — Import resolvers: the classification table.**
  - **File.** `test/unit/import_resolvers.test.ts`.
  - **Verifies.** Step 15's `resolveTsImport` and `resolvePythonImport` (G12).
  - **Level.** Unit (over a `RepoFiles` built from a real file list).
  - **Real/doubles.** Real functions; the `RepoFiles` is a **fake**
    (Meszaros) built from a literal path list and `package.json`
    dependency set, justified because the resolvers' contract is pure over
    that interface and Step 14's real one is exercised by `T-15-3`.
  - **Data.** TypeScript from `src/a.ts`: `./b.js` (`b.ts` exists → `src/b.ts`),
    `./c` (`c.tsx`), `./d` (`d/index.ts`), `./e.mjs` (`e.mts`), `react`
    (declared → external), `node:fs` and `path` (builtins → external),
    `@/util` (→ unresolved), `lodash` (undeclared → unresolved), `./missing`
    (→ unresolved), `./py.py` (a `.py` file exists → unresolved: no
    cross-language resolution). Python from `pkg/sub/u.py`: `.m`
    (`pkg/sub/m.py`), `..n` (`pkg/n/__init__.py`), `.missing` (unresolved),
    `os` (external), `pkg.sub.m` (resolved), `pkg/sub/m.ts` present but
    `.m2` absent (unresolved, never `.ts`). Technique: decision table.
  - **NOT asserts.** Parse capture. **Fails when** any cell differs.

- **T-15-6 — Declared capability matches behaviour.**
  - **File.** `test/unit/frontend_capabilities.test.ts`.
  - **Verifies.** Step 15 — every frontend `defaultFrontends` returns
    declares what it does (G13).
  - **Level.** Integration (real grammars).
  - **Real/doubles.** Real `web-tree-sitter` and grammars; no doubles.
  - **Data.** For each frontend: a one-file sample in its language with one
    definition and one relative import of a sibling. Technique: equivalence
    partitioning (declared true / false).
  - **NOT asserts.** Query completeness. **Fails when** a frontend declaring
    `imports: true` yields no captured import or lacks `resolve`, OR one
    declaring `imports: false` yields any, OR one declaring `symbols: true`
    yields no symbol, OR a grammar with no `QUERIES` entry appears in the
    list.

- **T-16-1 — Bar combinator: conjunction, failed axis, no cap, hazard bypass.**
  - **File.** `test/unit/bar.test.ts`.
  - **Verifies.** Step 16.
  - **Level.** Unit (floors read from a real seeded `tuning` table).
  - **Real/doubles.** Real function; real `tuning` rows; no doubles.
  - **Data.** Candidates built with every Step 6 field set (a pair fact's
    `evidence` is `{num: pair_count, den: change_count}` and its
    `weightedEvidence` `{num: pair_weight, den: change_weight}`) over the
    eight (c, i, m) pass/fail combinations; two candidates both above every
    floor; a hazard candidate with support 2 below the confidence floor; a
    hazard candidate with support 1; two mined twins whose `evidence` is the
    same 17/20 and whose `weightedEvidence` differ (17/20 and 8/20) and whose
    `lastTs` differ by five years — the bar must read only
    `weightedEvidence` and never `lastTs`; the staleness matrix — a `mined`
    and a `structural` candidate, each under `{indexStale, historyStale}` =
    `{false, false}`, `{true, false}`, `{false, true}`. Technique: decision
    table + boundary value on the dampeners.
  - **NOT asserts.** ROSE-figure recovery. **Fails when** a wrong
    `failedAxis` is returned, OR two above-bar candidates yield one pass, OR
    the support-2 hazard is suppressed, OR the support-1 hazard passes, OR the
    twins' confidences are not 17/20 × 0.9 and 8/20 × 0.9, OR changing only
    `lastTs` changes any confidence (no recency multiplier — AD-13, H1), OR
    the `mined` candidate is reduced by `bar.stale_factor` under `indexStale`
    alone or not reduced under `historyStale`, OR the `structural` candidate
    is reduced under `historyStale` alone or not reduced under `indexStale`
    (AD-14's per-class staleness), OR a stale case is blocked rather than
    reduced.

- **T-16-2 — Tier, trust dampener, caps, composition, impact, marginal.**
  - **File.** `test/unit/bar_tiers.test.ts`.
  - **Verifies.** Step 16's 2026-09-26 axes (AD-14 revised; G18, G20).
  - **Level.** Unit (seeded `tuning`).
  - **Real/doubles.** Real function; real seeded reader; no doubles.
  - **Data.** Mined pair candidates, history and index fresh,
    `untrusted_repo`, weighted evidence: 19/20 (0.95 × 0.9 = 0.855 → high),
    13/20 (0.585 → fails the floor), 15/20 (0.675 → passes, uncertain); the
    19/20 one with `injectionSuspect` (min(0.855, 0.7) = 0.7 → passes,
    uncertain); a perfect 20/20 pair with `historyStale` (1 × 0.9 × 0.9 = 0.81
    → high: AD-14's tier invariant); a Reuse candidate `heuristic` with
    evidence 1 (0.9 → capped 0.7, uncertain); a `human` fact (1.0, no
    dampening); a landmine support 3 (min(1, 3/3) × 0.9 = 0.9, high) and
    support 2 (2/3 × 0.9 = 0.6, uncertain), and the support-3 landmine again
    with `bar.support_min` tuned to 5 (still 0.9, high — the ratio reads
    `bar.hazard_full_support`, H10); impact: read
    context with `blastRadius` 1 (fails), 2 (passes), 1 with zone
    `generated` (passes); marginal: a `structural` candidate not comparative
    (fails), `mined` with `obvious` (fails), `mined` single-file Warning
    (passes). Technique: decision table + boundary value.
  - **NOT asserts.** Rendering. **Fails when** any `confidence` differs from
    the stated value by more than 1e-9, OR any `tier`, pass, or `failedAxis`
    differs.

- **T-16-3 — Recency weights the evidence: an old perfect pairing speaks, a pairing that came apart does not.**
  - **File.** `test/unit/bar_recency.test.ts`.
  - **Verifies.** Steps 13 and 16 together — AD-13's recency weighting as the
    bar reads it (collapse-hunt H1: the retired multiplier silenced every
    perfect pairing older than about 213 days).
  - **Level.** Integration (real `git`, real miner, real store, real bar).
  - **Real/doubles.** Real `git`; `mineCochange`; `passesBar` over a seeded
    `tuningReader`; fixture `recency-weighting`; no doubles.
  - **Data.** `recency-weighting` (Step 16's fixture), with `HEAD` a recent
    commit and ≥ 30 included commits: (a) `old_a.ts` and `old_b.ts` changed
    together in 10 commits dated 4.9 years before `HEAD` (inside the
    five-year horizon) and never since; (b) `apart_a.ts` and `apart_b.ts`
    changed together in 20 commits dated 4.9 years before `HEAD`, then
    `apart_a.ts` alone in 5 commits dated within the 30 days before `HEAD`;
    unrelated filler commits for the corpus floor. Mined at the seeded
    half-life (365 days); each pair's Coupling candidate built from the store
    (`evidence` counts, `weightedEvidence` weights) and passed to `passesBar`
    with history and index fresh. Technique: equivalence partitioning (a
    pairing that always held / one that came apart).
  - **NOT asserts.** Headline wording. **Fails when** (a)'s confidence is not
    0.9 within 1e-9 (a ratio of 1 × the trust factor, whatever its age) or it
    fails the floor or its tier is not `high`, OR (b) passes the confidence
    floor (its raw counts read 20 of 25 = 0.8, which with the trust factor,
    0.72, would pass; its weighted ratio, with `apart_a.ts` as the touched
    file, is about 0.12 — 0.11 after the trust factor), OR (b)'s headline
    evidence is not `20 of its last 25 changes` (the display stays the raw
    counts, AD-14).

- **T-17-1 — Command classifier: single segment.**
  - **File.** `test/unit/command_class.test.ts`.
  - **Verifies.** Step 17.
  - **Level.** Unit.
  - **Real/doubles.** Real function; lexicons from the seeded table.
  - **Data.** `npm test`, `npm run test`, `pytest` (class 1); `ls`, `cd`,
    `git status` (class 2); `wget http://x` (class 3); targets: `pytest
    tests/test_a.py` → `['tests/test_a.py']`, `npm test` → `[]`, `node --test
    test/x.test.js -v` → `['test/x.test.js']`. Technique: equivalence
    partitioning.
  - **NOT asserts.** Execution. **Fails when** any command is misclassified
    OR any `targets` list differs.

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
    landmine candidate is emitted at `UserPromptSubmit`, OR a file with
    `entry_score = 0` or a non-`source` zone is named, OR the candidate's
    `subjectKey` is not `orientation:<sorted ids>` or its `incorporatedBy` is
    not one `path:` key per named file, OR a prompt matching only one entry
    point yields a candidate.

- **T-18-2 — Coupling generator: non-obvious pair, obvious pair suppressed.**
  - **File.** `test/unit/genre_coupling.test.ts`.
  - **Verifies.** Step 18 — the cross-directory partner fires with ratio and
    commit pointer; the same-directory same-stem pair fails the marginal
    axis.
  - **Level.** Integration (real store from `coupling-nonobvious`).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** The fixture mined (≥ 30 included commits; the planted
    cross-directory pair `src/api/handler.ts`–`src/db/schema.ts` in 9 of
    `handler.ts`'s 10 changes); a `PostToolUse Read` context on each file; a
    `PostToolUse Grep` context whose `resultPaths` holds `handler.ts`; the
    same Read with `historyAvailable = false`. Technique: equivalence
    partitioning (obvious/non-obvious; Read/Grep; gate open/closed).
  - **NOT asserts.** Ranking among several non-obvious partners. **Fails
    when** the non-obvious candidate is missing, OR its `evidence` is not
    `{num: 9, den: 10}`, OR its headline parts do not render (through Step
    19's `compose`) as `src/api/handler.ts has changed with src/db/schema.ts
    in 9 of its last 10 changes; latest <12 hex>`, OR its `subjectKey` is not
    `coupling:<min id>:<max id>` for the Read of either file, OR the obvious
    pair is not `obvious: true`, OR the Grep context yields no candidate, OR
    the gate-closed context yields any candidate.

- **T-18-3 — Reuse generator: dominance, incomparable-set silence, observed-0, same-name caveat.**
  - **File.** `test/unit/genre_reuse.test.ts`.
  - **Verifies.** Step 18.
  - **Level.** Integration (real stores from the three reuse fixtures).
  - **Real/doubles.** Real stores; no doubles.
  - **Data.** `reuse-mixed-language` (an `imports: true` dominant + an
    `imports: false` candidate → silence); `reuse-observed-zero` (an
    `imports: true` symbol with observed 0 in the set → crown awarded to the
    dominant one); `reuse-same-name-collision` (comment/string matches →
    crown with the `identifier_match` caveat and `heuristic: true`);
    `reuse-alias-unresolved` (TypeScript; `formatDate` in `src/util/date.ts`
    imported by 6 files through the alias `@/util/date` and by 1 relatively,
    rival `formatDate2` imported relatively by 3 files: the unresolved share
    6/(6+4) exceeds 0.05 → **silence** — without the share rule the rival
    would be crowned 3 vs 1, the CH H4 failure). Technique: decision table
    (comparable × dominant × collision × unresolved share).
  - **NOT asserts.** Semantic equivalence of candidates. **Fails when**
    silence when a crown is due, OR a crown when silence is due (including
    any crown in `reuse-alias-unresolved`), OR the caveat or `heuristic` flag
    is missing, OR dominance is claimed below `bar.reuse_dominance_k`, OR the
    set mixes symbol kinds, OR a non-`source` zone symbol is a candidate.

- **T-18-4 — Consequence generator: coupled tests + zone flag.**
  - **File.** `test/unit/genre_consequence.test.ts`.
  - **Verifies.** Step 18.
  - **Level.** Integration (real store from `consequence-coupled-tests`).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** A file co-changing with two test files; a `PreToolUse Edit`
    context on it; a variant where the target is in a `generated` zone.
    Technique: state-transition + equivalence partitioning (zone).
  - **NOT asserts.** Call-site counts. **Fails when** the coupled tests are
    missing from the headline, OR the zone literal is missing on the
    generated variant, OR a raw call-site count is the headline, OR the
    rendered text does not contain `, the file this edit targets,` after the
    target path, OR it contains `just edited` (V20, L12), OR the target's path
    slot is not `ownTarget: true`.

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
    yields no candidate, OR the candidate lacks evidence/support or the
    `hazard` flag, OR the clean file yields a candidate, OR the rendered text
    lacks `, the file this edit targets,` or contains `just edited`, OR the
    fix-chatter text's day count is not the tuned
    `landmine.fix_chatter_window_days` (the test tunes it to 30 and expects
    `30 days` — N10), OR with `historyAvailable = false` a miner-kind row
    yields a candidate or the `human_stated` row does not, OR a miner-kind
    candidate's `evidenceJson` lacks `support` and `changeCount` equal to the
    row's support and the target's `files.change_count` (L13).

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
    named with its ratio (`evidence = {pair_count, change_count(edited)}`), OR
    a `failed` Edit or Bash write counts as a change, OR the `subjectKey` is
    not `completeness:<edited id>:<missing id>`.

- **T-18-7 — Verification generator: covering-test mapping and run-state clause.**
  - **File.** `test/unit/genre_verification.test.ts`.
  - **Verifies.** Step 18 — the headline is the covering-test →
    changed-region mapping; the strong "not run" appears only when every
    observed command is class 1/2; a class-3 command composes the weaker
    claim; a run-and-failed covering test (a `failed` class-1 row) yields
    neither "not run" nor "no recognized run".
  - **Level.** Integration (real store from `verification-covering-test`).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** Five variants: no run; run `ok`; run `failed`; `make check`
    (class 3); a class-1 runner mapped to a different test file (`npm test
    other.test.ts`) with no class-3 segment; plus a Go variant (`pkg/a.go`
    edited, `pkg/a_test.go` covering it by the same-directory rule, Step 14)
    with no run. Technique: decision table.
  - **NOT asserts.** Done-claim recognition (T-18-8). **Fails when** the
    mapping is not the headline, OR run-state stands alone, OR the strong
    claim appears with a class-3 command present, OR the run-and-failed
    variant asserts either not-run clause, OR the mapped-elsewhere variant
    does not carry `; not run this session` (AD-15's rule: every segment is
    class 1 or 2 after the mapped subtraction — expert review M6), OR the Go
    variant yields no candidate.

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

- **T-18-9 — The shared generator rules.**
  - **File.** `test/unit/genre_common.test.ts`.
  - **Verifies.** Step 18's `generator.ts` rules and `blastRadiusOf` (N1,
    AD-13, AD-15, AD-16, G18).
  - **Level.** Integration (real stores from `coupling-nonobvious` and
    `consequence-coupled-tests`).
  - **Real/doubles.** Real stores and generators; `recordDrop` is a **spy**
    (a recording function), justified because the fault writer behind it is
    Step 10's.
  - **Data.** The Coupling/Consequence/Completeness/Warning generators with
    `historyAvailable` false then true; a partner whose row is set to
    `in_tree = 0`; a file with 3 partners of which 2 clear the floor and 1
    covering test (`blastRadiusOf` = 3); every generator's declared flags.
    Technique: decision table.
  - **NOT asserts.** Headline wording (per-genre tests). **Fails when** any
    history generator emits with the gate closed (a `human_stated` Warning
    excepted), OR the `in_tree = 0` partner appears in a candidate or is not
    reported with `not_in_tree`, OR `blastRadiusOf` ≠ 3, OR any generator's
    `factClass`/`crossFile`/`comparative`/`heuristic` differs from Step 18's
    list, OR a path slot for `ctx.targetPath` has `ownTarget` false.

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
    genre tag); a Coupling candidate whose partner's `files` row has
    `injection_suspect = 1` (renders `path#<id>`, still composed on its
    unmasked target and commit), the same with the flagged file as the
    agent's own target (`ownTarget: true` — rendered as its name); tier
    `uncertain` and `high`; a symbol slot `a b` (not identifier-shaped).
    Technique: decision table over form axes.
  - **NOT asserts.** Content correctness. **Fails when** any valid candidate
    fails a form axis OR any invalid one passes, OR the text contains `\n`,
    OR a number with a decimal point other than inside a path appears (the
    confidence is never printed — AD-14), OR `[confidence: uncertain]` is
    missing on the uncertain tier or present on the high one, OR the flagged
    partner renders by name, OR the flagged own target renders masked, OR the
    `a b` symbol renders verbatim.

- **T-19-2 — Rumor rule drops a stale pointer.**
  - **File.** `test/unit/compose_rumor_rule.test.ts`.
  - **Verifies.** Step 19 — a candidate whose `file:span` no longer holds is
    dropped with reason `stale_pointer`; a pointer to an `in_tree = 0` file
    with `not_in_tree`; a candidate whose only file pointer is masked and
    which has no commit with `masked_path`; each reported through
    `recordDrop` as `whisper_dropped_unverifiable`; a commit pointer is
    resolved against the store's `commits` table; a worktree event
    re-resolves against its own checkout root.
  - **Level.** Integration (real filesystem, real store).
  - **Real/doubles.** Real files and store; no doubles.
  - **Data.** A candidate on `file.ts:12-18`; the file mutated before
    compose; a commit pointer present/absent in `commits`; a candidate on a
    file with `in_tree = 0`; a candidate whose one file is `injection_suspect`
    and not the own target, with no commit pointer; the `file.ts:12-18`
    candidate composed with `checkoutRoot` set to a worktree whose copy of
    `file.ts` differs at those lines. Technique: state-transition (fresh →
    mutated) + decision table over reasons.
  - **NOT asserts.** How the mutation happened. **Fails when** a droppable
    candidate is composed, OR its `recordDrop` reason differs from the one
    stated, OR the worktree case re-resolves against the main checkout, OR
    compose spawns `git`.

- **T-19-3 — Genre headline words are plain literals.**
  - **File.** `test/conventions/headline_literals.test.ts`.
  - **Verifies.** Step 19 / Step 6 — no genre builds a `lit` word from data
    (closes the template-literal hole `T-6-3` cannot, G24).
  - **Level.** Unit (source scan over `src/genres/**/*.ts`).
  - **Real/doubles.** Real sources; no doubles.
  - **Data.** Clean tree; a seeded temporary genre file calling
    `` lit(`x${y}`) `` and one calling `lit(name)`. Technique:
    state-transition (clean → seeded).
  - **NOT asserts.** Runtime rendering. **Fails when** the clean tree has a
    `lit(` call whose argument is not a single- or double-quoted string
    literal without `${`, OR either seeded call is not detected.

- **T-20-1 — Per-consumer dedup and session-boundary reconciliation.**
  - **File.** `test/unit/delivery_dedup.test.ts`.
  - **Verifies.** Step 20.
  - **Level.** Integration (real store).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** Four consumer keys — `s1#main`, `s1#sub:ag1`, `s1#sub:ag2`,
    `s2#main`; subject X delivered to `s1#main`; `path:P` in `s1#sub:ag1`'s
    read set; an Orientation candidate with `incorporatedBy = ['path:P']` and
    a Coupling candidate with `incorporatedBy = []` whose partner is P; each
    of the five `source` values applied to `s1#main` with every consumer's
    sets seeded. Technique: state-transition + decision table (D-20's
    table).
  - **NOT asserts.** Whisper text. **Fails when** X is not withheld for
    `s1#main` or is withheld for any other consumer, OR the Orientation
    candidate is not withheld for `s1#sub:ag1`, OR the Coupling candidate is
    withheld by the read of P (a history fact is never self-served — G25), OR
    any `source` yields the wrong post-state for `s1#main`, OR any other
    consumer's rows change (G23).

- **T-20-2 — Stop-time channel honours `stop_hook_active`.**
  - **File.** `test/unit/delivery_stop_channel.test.ts`.
  - **Verifies.** Step 20 — `deliverStop` returns `{ context }` when
    `stop_hook_active` is false and `null` when true.
  - **Level.** Unit.
  - **Real/doubles.** Real function; no doubles.
  - **Data.** The two flag values. Technique: decision table.
  - **NOT asserts.** The harness cap. **Fails when** the true case emits, OR
    the false case does not.

- **T-20-3 — Fork and resume reseed.**
  - **File.** `test/unit/delivery_reseed.test.ts`.
  - **Verifies.** Step 20's reseed (AD-16, V22).
  - **Level.** Integration (real store).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** `whisper_audit` rows with texts T1 (subject `coupling:1:2`) and
    T2 (subject `completeness:3:4`); a forked consumer `f#main` with no rows:
    `fork` with `injectedLines = [T1, T2, 'unknown']` and `readKeys =
    ['path:a.ts']`; `fork` with `injectedLines = ['[oracle] reworded']`;
    `fork` with none; `resume` of `r#main`, which already has rows. Technique:
    decision table.
  - **NOT asserts.** Transcript parsing (T-21-3). **Fails when** the first
    fork's `delivered` set is not exactly `{coupling:1:2, completeness:3:4}`
    or its `read` set not `{path:a.ts}` or `recovered ≠ 2`, OR the second
    does not report `carriedOracleText` with `recovered = 0`, OR the third
    reports `carriedOracleText`, OR the `resume` changes `r#main`'s sets.

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

- **T-21-3 — `oracleLines` and `successfulToolTargets`.**
  - **File.** `test/unit/reader_reseed.test.ts`.
  - **Verifies.** Step 21's reseed helpers.
  - **Level.** Unit (parsed JSONL literals).
  - **Real/doubles.** Real functions; no doubles.
  - **Data.** Entries in the observed layout (V23; collapse-hunt P4 — a
    successful file-tool result carries no `is_error` field, a failed one
    carries `is_error: true`): an attachment-shaped entry whose nested string
    holds `prefix: [oracle] coupling: a` and, on a second line, `[oracle] b`;
    a user string with no marker; `tool_use` Read `a.ts` whose result has no
    `is_error` field (a success); Edit `b.ts` with `is_error: true` (a
    failure); Write `c.ts` with no `is_error` field (a success); a Read
    `d.ts` whose result carries `is_error: false` (the Bash-style shape, still
    a success); Grep with no `is_error` field; a `tool_use` Edit `e.ts` with
    no paired result; a `tool_result` whose `tool_use_id` matches nothing.
    Technique: decision table.
  - **NOT asserts.** Entry discrimination (T-21-1). **Fails when**
    `oracleLines` is not `['[oracle] coupling: a', '[oracle] b']`, OR
    `successfulToolTargets` is not exactly `[{tool: 'Read', pathRaw: 'a.ts'},
    {tool: 'Write', pathRaw: 'c.ts'}, {tool: 'Read', pathRaw: 'd.ts'}]` (in
    transcript order: the failed Edit, the Grep, and the unpaired Edit
    excluded).

- **T-22-1 — QA state DAO: round-trips, dedup, concurrent open, re-open.**
  - **File.** `test/unit/qa_state.test.ts`.
  - **Verifies.** Step 22.
  - **Level.** Integration (real store; two child processes).
  - **Real/doubles.** Real `node:sqlite`; real child processes; no doubles.
  - **Data.** Two workers issuing `openQuestion` for the same
    `(consumer, content_hash)`; then `answerQuestions`; then a re-open;
    `voidQuestion` with `denyFired: true`; `answerQuestions` with a
    clearing offset and timestamp over two open rows, one asked before the
    clearing turn and one after; the same question text opened for
    `s1#main` and for `s2#main` (two rows); `getBookmark` for a consumer
    with no row. Technique: state-transition + error guessing (concurrency).
  - **NOT asserts.** Which worker wins. **Fails when** two `open` rows
    exist, OR neither worker gets the row, OR the loser does not get
    `'already_open'`, OR re-open after `answered` fails, OR the voided row's
    detail lacks the deny-fired flag, OR the row asked after the clearing
    turn is closed, OR the `s2#main` open is reported `'already_open'`, OR
    `getOpenQuestions(s1#main)` returns `s2#main`'s row, OR `getBookmark`
    returns anything but `null` for the row-less consumer.

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
  - **Real/doubles.** Real function; floor, deferral list, and filler set
    read from the seeded table.
  - **Data.** An empty turn, a one-mark turn "." and the one-character
    direct answers "y" and "n" (no clear, `below_length_floor` — below the
    seeded floor of 2: the substance test is length-only, so a real
    one-character answer is held despite being a direct answer, a
    length-only test's accepted cost, escaped by one more character and
    counted by `deny_despite_answer_text`); "No.", "Yes, line
    12.", "Sure.", "Ok.", "Right.", "Understood.", "Got it, will do." (clear
    — direct answers at or above the floor are never held for being
    short); "Because the fixture
    is written later than the assertion reads it." and "First let me check:
    the null check is not the cause." (clear — a bare word is no phrase, and
    a phrase beside an answer's tokens is not the answer); "I'll get to
    that.", "I'll get to that!", "I'll get to that later.", "I'll get to
    that soon.", "I'll get to that next.", "I'll come back to it.", "I'll
    come back to that.", "I'll get back to you on that.", "I'll get back to
    you.", "Will look into that.", "I will look into that.", "Before I
    answer, one sec.", "I'll get to that, I'll get to that." (no clear,
    `deferral_only` — a recognized phrase with nothing but filler beside
    it); "I'll get to that. The null check does not fix it, see line 12."
    and "No — the null check does not fix it, see line 12, though I'll get
    to the rest later." (clear on the answer's tokens); "Sure, I'll get to
    that after the refactor.", "I'll get to that after the refactor." and
    "First let me finish this." (clear — a content word beside the phrase:
    the dressed or plan-stating dodge the skeleton lets through and the
    exit report counts); "Later.", "Not now.", "One moment.", "Let me look
    into that first.", "Hmm.", "Hm" (clear — no recognized phrase: the
    under-fire the exit run measures, never held by an acknowledgement
    vocabulary); a turn that is only tool-noise blocks (no clear,
    `below_length_floor`); a turn of a code fence plus "No." (clears); and
    the **generated class**: every seeded stoplist phrase × every seeded
    filler word, the word placed after and before the phrase (no clear,
    `deferral_only`), and each such turn with one content word appended
    (clears). The function's signature carries no question text (asserted
    at compile time by calling it with the seeded lists, the seeded floor,
    and a string only). Technique: boundary value + decision table over
    the spec's examples, the direct-answer class, and the reviewer-supplied
    deferral inputs, plus the rule's class as a generating rule (the cases
    executed by §11.4's reference implementation,
    `probe:16_clear_rule_cases`).
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
  - **Data.** `EventContext`s built as the handler builds them: open
    question for `s1#main` + `Edit` with `targetPath = 'a.ts'` (verdict;
    audit row with `session = 's1'`, `genre = 'answer_drift'`, `a.ts` in
    `evidence_json`, present before return); `NotebookEdit` with `targetPath
    = 'n.ipynb'` (verdict; path recorded); `Read`, `Bash`, `Task` (null);
    consumer `s1#sub:abc` (null); an `Edit` from `s2#main` while only
    `s1#main` has an open question (null — G23); no open question (null).
    Technique: decision table (consumer × tool × state).
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
    rebuild path; a `SessionEnd`; the rebuild case: a store whose
    `questions` and `classified_turns` already hold every row the
    marker-carrying fixture produces (a first pass), with one question
    still `open` that was asked after the fixture's last clearing turn and
    one `kind='deny'` audit row timestamped after that clearing turn;
    `resume` and a second pass over the same fixture; a second consumer
    (`s2#main`) with its own open row and bookmark, present throughout.
    Technique: decision table.
  - **NOT asserts.** Dedup sets (T-20-1). **Fails when** `startup`/`clear` do
    not expire, OR `resume`/`fork`/`compact` do not rebuild from offset 0, OR
    the marker-less rebuild does not raise `rebuild_recovered_nothing` with
    `detail_json.set = 'questions'`, OR `s2#main`'s row or bookmark changes
    under any `source` applied to `s1#main`, OR a `startup` leaves a
    `classify_state` offset other than 0 or a non-NULL `bookmark_uuid`, OR
    `SessionEnd` changes any row, OR the rebuild case ends with any row
    differing from the first pass's rows (the later question stays `open`;
    every earlier row keeps its status and `closed_by_uuid`; every
    `classified_turns` row is present once), OR it records any fault — a
    store error, or `deny_after_answer_lag` for the replayed answer.

- **T-27-2 — Outstanding-question line and the done-claim counter.**
  - **File.** `test/unit/stop_outstanding_line.test.ts`.
  - **Verifies.** Step 27 — the line is returned only when the done-claim
    recognizer fired AND open questions exist; the counter records a
    done-claim with an `open` row and a done-claim whose only close was
    `generic_text_all_prior` within the trailing-K window.
  - **Level.** Integration (real store).
  - **Real/doubles.** Real store; no doubles.
  - **Data.** (done, open) → backstop candidate; (done, none) → none; (no
    claim, open) → none; two open questions, one of whose text holds a
    newline; the two counter cases. Technique: decision table.
  - **NOT asserts.** Phrasing beyond the stated form. **Fails when** presence
    mismatches any cell, OR the candidate's `subjectKey` is not `backstop:`
    + the sorted open ids, OR its `text` is not one line starting `[oracle]
    still unanswered: ` quoting each open question, OR either counter case is
    not recorded in `session_log.detail_json`.

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

- **T-37-1 — No walking-skeleton mark remains.**
  - **File.** `test/conventions/no_skeleton_marks.test.ts`.
  - **Verifies.** Step 37 (the full build replaced the skeleton; review N9).
  - **Level.** Unit (source scan over `src/**`).
  - **Real/doubles.** Real sources; no doubles.
  - **Data.** The source and test trees (this test's own file excluded from
    the `test/` scan, since it names the patterns); seeded temporary files
    containing `// SKELETON: G1`, `// SKELETON: 1R — x; retired by Step 18`,
    `throw new Error('not implemented: x')`, and a `test/` file with `{ todo:
    'SKELETON: 1R — x; retired by Step 28' }`. Technique: state-transition.
  - **NOT asserts.** Code quality. **Fails when** any `src/` file contains
    `SKELETON`, `WALKING SKELETON`, or `not implemented:`, OR any `test/`
    file carries a `node:test` `todo` option or `SKELETON: 1R`, OR
    `src/cli/verbs_skeleton.ts` or `src/cli/context.ts` exists, OR any seeded
    mark is not detected.

### 12.2 Handler and CLI tier (real built binary, real stores)

- **T-28-1 — Pipeline order: catch-up before the block check.**
  - **File.** `test/replay/pipeline_order.test.ts`.
  - **Verifies.** Step 28 (AD-8 order): catch-up closes the question before
    the block check reads it.
  - **Level.** Acceptance (replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event; real store; real
    transcript fixture. No doubles.
  - **Data.** Intake of a question (`UserPromptSubmit`), then a `PreToolUse
    Edit` whose transcript already contains the clearing answer. Technique:
    state-transition (open after intake → answered at the `Edit` event).
  - **NOT asserts.** Downstream behaviour; deny content (T-38-1). **Fails
    when** a deny is emitted, OR a `kind = 'deny'` `whisper_audit` row
    exists, OR the `questions` row is not `open` after the intake event, OR
    after the `Edit` event it is not `answered` with `closed_by_uuid` = the
    clearing turn's uuid and `closed_by_kind = 'generic_text_all_prior'`,
    OR either event lacks its `session_log` row with `outcome` set, OR the
    temp home's JSONL channel holds a fault line.

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
    `store_corrupt`; the malformed-stdin line is `handler_exception` on the
    **home-level** channel `<home>/diagnostics/` — G35, executed: zero faults
    anywhere under the skeleton).

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
    `schema_meta.reindex_owner_pid` claim `runIndex` takes (Step 14) and by
    the index head moving afterwards.
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler; real store; real transcript fixture;
    real `indexer-small` repository. No doubles.
  - **Data.** A `SessionStart` event with `transcript_path` set to a
    fixture, once against a fresh index and once after one commit moved
    `HEAD`. Technique: equivalence partitioning (fresh / stale).
  - **NOT asserts.** Detection (T-33-4); reindex duration. **Fails when** no
    `session_log` row with `event_type = 'liveness'` exists, OR its
    `detail_json` lacks the path or the byte size, OR the stale run leaves
    no claim-row trace and an unmoved index head within the test's
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

- **T-28-7 — Repository resolution: subdirectory, worktree, path-keyed, miss.**
  - **File.** `test/unit/repo_binding.test.ts` (function level) and
    `test/replay/repo_resolution.test.ts` (through the built handler).
  - **Verifies.** Step 28's `findRepoRoot`/`lookupBinding` and pipeline item
    4 (AD-23, AD-17; G30, G35, N3, N15).
  - **Level.** Integration + acceptance.
  - **Real/doubles.** Real filesystem, `git`, stores, handler binary; no
    doubles.
  - **Data.** `indexer-small` prepared (`prepareStore` records its binding);
    (a) a `PostToolUse Read` of `src/api/x.ts` with `cwd = <repo>/src`; (b)
    the same Read from a `git worktree add ../wt` checkout (`cwd = <wt>`),
    and a `SessionStart` there with `HEAD` moved in the worktree only; (c)
    `repo-key-nongit` prepared path-keyed, an event with `cwd` = a
    subdirectory of it; (d) an event from a never-`init`-ed temp git repo,
    twice in session `sx` and once in `sy`; (e) the handler with an empty
    `CTXORACLE_HOME`; (f) `indexer-small` prepared, then its project store
    file replaced by a directory of the same name, and one event (collapse-hunt
    H8). The function-level half calls `findRepoRoot` on each
    layout, including a submodule-shaped `.git` file without `commondir`.
    Technique: decision table over layouts.
  - **NOT asserts.** Whisper wording. **Fails when** (a) records no
    `observed_actions` row with `path = 'src/api/x.ts'` (the repo-relative
    path — N3), OR (b) does not resolve to the main store, or its
    `SessionStart` spawns a reindex child or leaves `indexStale` false, OR
    (c) does not find the path-keyed store, OR (d) writes anything but one
    `repo_not_bound` line per session (two lines for `sx` + `sy` in total)
    on the home channel and one marker file per session,
    `<home>/diagnostics/repo_not_bound.<sha256Short(sx)>.marker` and
    `…<sha256Short(sy)>.marker`, or creates any `projects/` directory or
    store, OR (e) creates anything but what Step 4's `ensureHome` creates —
    `<home>/`, an empty `<home>/global/` (no `global.db`), and
    `<home>/diagnostics/` — plus, in `<home>/diagnostics/`, the session's
    JSONL fault file (Step 6's `<session-short>.jsonl`) holding the one
    `repo_not_bound` line and its `repo_not_bound.<sha256Short(session)>.marker`
    (expert review M4), OR (f) records anything but one `repo_not_bound` with
    `reason: 'store_unreadable'`, `store: 'project'`, `pathKind:
    'directory'`, or records `store_missing`, or creates a store file, OR any
    event spawns `git` (the test runs the handler with a `PATH` whose `git`
    is a script that records its invocation and fails), OR `findRepoRoot`
    gives the submodule anything but its own directory as root.

- **T-28-8 — Error mapping.**
  - **File.** `test/replay/error_mapping.test.ts`.
  - **Verifies.** Step 28 item 13 (G31).
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler binary; real induced failures; no doubles.
  - **Data.** (a) a child process holding the project store's write lock
    (`BEGIN IMMEDIATE`, reported "holding") during a `PostToolUse` event
    (the handler's observation write gives up after the retry); (b) a store
    whose file is overwritten from byte 100 with zeros (`SQLITE_CORRUPT` or
    `SQLITE_NOTADB` on first statement); (c) a transcript path that is a
    directory (a read error the handler does not classify). Technique:
    error guessing.
  - **NOT asserts.** Recovery. **Fails when** (a)'s fault is not `store_busy`,
    OR (b)'s is not `store_corrupt`, OR (c)'s is not `handler_exception`
    with `errorClass` set, OR any case exits non-zero, writes stdout, or
    writes stderr.

- **T-28-9 — The observation row: normalized target, post-write hash, `seq`.**
  - **File.** `test/replay/observation_row.test.ts`.
  - **Verifies.** Step 28 item 10 (G21, G32, N16; AD-23).
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler; real store and files; no doubles.
  - **Data.** Three `PostToolUse` events in one millisecond-scale burst: an
    `ok` `Edit` of `src/a.ts` (absolute `file_path`), an `ok` `Write` of a
    1.5 MB file, an `ok` `Write` of a 20,001-line 200 KB file; a
    `PostToolUseFailure` `Edit`; a `Bash` `cd pkg && npm test` event; and
    four `PostToolUse` search events in the installed Claude Code's shapes
    (collapse-hunt P5): a Glob `{filenames: ['src/a.ts'], durationMs,
    numFiles, truncated}`, a Grep `{mode: 'files_with_matches', filenames:
    ['src/a.ts'], numFiles: 1}`, a Grep `{mode: 'content', numFiles: 0,
    filenames: [], content: 'src/a.ts:1:x'}`, and a Grep response with no
    `filenames` field. Technique: boundary value (the two caps) +
    equivalence partitioning.
  - **NOT asserts.** Regret. **Fails when** the `Edit` row's `path` is not
    `src/a.ts` or its `content_hash` is not the SHA-256 of the file's bytes,
    OR either over-cap row's hash is not NULL, OR the failed row has a hash,
    OR the Bash row's `command_class`/`segments_json` differ from Step 17's
    classification, OR the `seq` values are not strictly increasing in event
    order, OR either listing search's session row carries a
    `search_results` detail, OR the content-mode Grep's session row does not
    carry `search_results = 'mode_unsupported'`, OR the field-less Grep's
    does not carry `'unrecognized'` (collapse-hunt H3: an empty `filenames`
    array must never read as a recognized zero).

- **T-28-10 — Audit groups: whisper + delivered, backstop audited.**
  - **File.** `test/replay/audit_groups.test.ts`.
  - **Verifies.** Step 28 item 11 (AD-26 write group; N2).
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler; real store; no doubles.
  - **Data.** `coupling-nonobvious`: a `PostToolUse Read` producing a
    Coupling whisper; a `Stop` with a done-claim and one open question
    (`UserPromptSubmit` earlier in the stream); the same `Stop` stream
    replayed with stdout closed; and, on `completeness-paired-change`, an
    `ok` `Edit` of one half of a pair followed by a `Stop` with
    `stop_hook_active: true` and a done-claim, then a `Stop` with
    `stop_hook_active: false` (expert review S2). Technique:
    state-transition.
  - **NOT asserts.** Wording beyond the prefix. **Fails when** the whisper's
    `whisper_audit` row and its `consumer_state` `delivered` row are not both
    present, OR the `Stop` response's last line is not the `[oracle] still
    unanswered:` line, OR that line has no `whisper_audit` row with genre
    `answer_drift_backstop` and subject `backstop:<id>` (N2 — executed, the
    skeleton had none), OR the closed-stdout replay does not record
    `produced_but_undelivered` for each audited id, OR the
    `stop_hook_active: true` `Stop` writes any `whisper_audit` row or
    `consumer_state` `delivered` row, emits any output, or lacks
    `detail_json.stop_hook_active = true` on its session row, OR the
    following `stop_hook_active: false` `Stop` does not deliver the
    Completeness whisper with its audit row (the candidate waited, it was not
    lost).

- **T-28-11 — The fork reseed through the handler.**
  - **File.** `test/replay/fork_reseed.test.ts` (its own file — expert review
    m5).
  - **Verifies.** Step 28 item 6 (AD-16 fork reseed; AD-17's `set`).
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler; real store and transcript files; no
    doubles.
  - **Data.** Session `s1` receives a Coupling whisper (its audit text is
    known); a transcript for new session `f1` holding that exact text in a
    nested string and one successful `Read` of the target — its
    `tool_result` block carrying **no** `is_error` field, the observed shape
    of a successful Read (V23; the D-plan-39 collapse); `SessionStart
    {source: fork, session_id: f1}`; then the `PostToolUse Read` that
    produced the whisper, in `f1`; a second fork `f2` whose transcript holds
    only `[oracle] coupling: reworded`; a third fork `f3` whose transcript
    holds no `[oracle] ` line at all. Technique: state-transition.
  - **NOT asserts.** Transcript layout (T-21-3). **Fails when** the `f1`
    Read repeats the whisper, OR `f1`'s `read` set lacks the target, OR `f2`
    does not record `rebuild_recovered_nothing` with `detail_json.set =
    'delivered'`, OR `f3` records one (the no-line case is the silent PG-6
    case, stated, not claimed loud — collapse-hunt H6).

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

- **T-30-1 (AC-24) — Regret true-positive and no-inflate, in-session and cross-session.**
  - **File.** `test/replay/regret_proxy.test.ts`.
  - **Verifies.** Step 30; AC-24.
  - **Level.** Acceptance.
  - **Real/doubles.** Real handler; real `runIndex`; real stores; fixtures
    `regret-true-positive`, `regret-no-inflate`. No doubles.
  - **Data.** A held (bar-failed) fact whose region is re-edited in-session;
    a held fact whose covering test fails (`PostToolUseFailure`); a
    store-held pair for a file the agent never read (no candidate ever
    generated) whose partner is edited and reverted in-session
    (`never_triggered`); a held fact with unrelated churn; a `failed` Edit on
    the region; a held fact whose region receives exactly one `ok` edit
    (no regret — the first edit is the decision moment); a held fact whose
    subject is edited to a new hash in a first replayed session (`SessionEnd`
    runs, no regret yet — nothing to compare against outside that session),
    then edited back to its original hash in a second replayed session
    (`SessionEnd` runs again, still no regret — the second session's own
    history has no earlier occurrence of that hash), then `runIndex` runs
    once: exactly one regret row appears, dated after `runIndex`, not after
    either `SessionEnd` — the cross-session case — and a second `runIndex`
    run immediately after records no further row for the same revert (the
    `regret_index_seq` watermark); and, mirroring `T-30-3`'s late committer,
    after that second pass an `ok` Edit row of a store-held fact's path —
    whose revert the working tree then shows — is appended with a `ts`
    **earlier** than the second pass's run time (a handler that stamped `ts`
    before the pass but committed after it), then a third `runIndex` runs.
    Technique: decision table + state-transition.
  - **NOT asserts.** Proxy calibration. **Fails when** any of the three TP
    cases records no regret row, OR the never-triggered row is not labelled
    `never_triggered`, OR the unrelated churn, the failed Edit, or the
    single-edit case records one, OR the cross-session case records zero or
    more than one regret row across both `SessionEnd` calls and the two
    `runIndex` calls combined, OR it records one before `runIndex` runs, OR
    the third pass does not report the late-committed row's revert (M7).

- **T-30-2 — Fold serialization and post-session correction reach.**
  - **File.** `test/unit/whisper_stats_fold.test.ts`.
  - **Verifies.** Step 30; AC-23's efficacy clause.
  - **Level.** Integration (real stores; two child processes).
  - **Real/doubles.** Real `node:sqlite`; no doubles.
  - **Data.** N = 12 `whisper` audit rows (genre `coupling`) and M = 3
    `false_fire` corrections against three of them; two child processes
    folding the same project concurrently; then one more correction after
    "session end" and a `correct`-triggered fold. Technique: state-transition.
  - **NOT asserts.** Ordering. **Fails when** the global `coupling` row after
    the concurrent folds is not `sent = 12, corrected_false = 3`, OR the sum
    of `stats_folds` rows differs from those, OR the two watermarks are not
    the largest `seq` values, OR the post-session correction does not raise
    `corrected_false` to 4, OR any `global_meta` key starting
    `whisper_stats_watermark` exists (AD-5: no global watermark).

- **T-30-3 — Fold attribution, idempotent publish, late-commit row.**
  - **File.** `test/unit/whisper_stats_attribution.test.ts`.
  - **Verifies.** Step 30's fold (AD-5 revised; G33, N11; CH C4).
  - **Level.** Integration (real stores).
  - **Real/doubles.** Real stores; no doubles.
  - **Data.** Audit rows: 2 `coupling`, 1 `warning`, 1 deny (`answer_drift`);
    corrections: `false_fire` on a coupling whisper, `missed` on the warning
    whisper, `false_fire` on the deny, `missed` with `genre = 'reuse'`,
    `missed` with `genre = 'answer_drift'` (a `--missed-question` row),
    `missed` with no genre, `confirm` on a coupling whisper; fold; publish
    again with no new rows; then a `whisper_audit` row inserted with a `ts`
    **earlier** than the first fold's time (a late committer) and a second
    fold; then the project store replaced by an older export (Step 32's
    import path, taken directly) and a publish. Technique: decision table +
    state-transition.
  - **NOT asserts.** Rendering. **Fails when** the global rows are not
    `coupling {sent 2, cf 1, cm 0}`, `warning {sent 1, cf 0, cm 1}`,
    `answer_drift {sent 0, cf 1, cm 1}`, `reuse {cm 1}`, `unattributed {cm 1}`,
    OR the second publish changes any row, OR the late row is not counted by
    the second fold, OR after the older-export replacement the global rows
    differ from that export's own `stats_folds` totals.

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
    `schema_meta`, OR `global_meta` lacks `repo_path:<realpath of the
    fixture>` → the resolved key, OR `init` run inside a `git worktree add`
    checkout of the fixture records the **main** root, OR stores are missing or not 0o700, OR the first
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
  - **Data.** Both stores populated with one row per table shape (the
    2026-09-26 tables included); export; delete; import into a fresh home
    (the validate-then-`backup()` path of Step 32); per-table canonical-order
    dumps before and after (the explicit `seq` columns compared as data) (D-plan-4's ordering keys; FTS tables compared by a fixed
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

- **T-32-4 — Import validates before it writes; `deinit --purge` unbinds.**
  - **File.** `test/replay/import_validate.test.ts`.
  - **Verifies.** Step 32's import order and binding removal (AD-5; G34).
  - **Level.** Acceptance (real CLI).
  - **Real/doubles.** Real CLI, stores, and a real holder process; no doubles.
  - **Data.** (a) An export directory whose `project.db` is truncated to half
    and whose `global.db` is good (the good file is validated first — the
    case where a per-file loop had already replaced the live global store,
    expert review M2); (b) a good export imported with `--replace` while a
    child process holds the live project store open with uncheckpointed WAL
    frames; (c) an export taken, then more folds in the live store, then that
    older export imported; (d) `deinit --purge` in a prepared fixture; (e) a
    global import whose export holds a binding whose root does not exist
    here, a binding for a path this machine also binds (to another key), and
    lacks a binding this machine has (collapse-hunt H7). Technique:
    state-transition + error guessing.
  - **NOT asserts.** Timing. **Fails when** (a) changes either live store —
    the global one included — or records no `import_rejected` or exits 0, OR
    (b)'s live store fails `integrity_check` or holds rows other than the
    export's, OR any `.import-tmp` file survives, OR (c)'s global
    `whisper_stats` differs from the imported store's `stats_folds` totals,
    OR (d) leaves a `repo_path:` binding to the purged key, OR after (e) this
    machine's own binding is missing or its same-path binding now names the
    export's key, OR the missing root is not printed with the `init`
    instruction.

- **T-33-1 (AC-9 rendering) — `status` renders every FR-M4 signal.**
  - **File.** `test/replay/status_renders_all.test.ts`.
  - **Verifies.** Step 33.
  - **Level.** Acceptance.
  - **Real/doubles.** Real `ctxoracle status`; a store seeded with one row
    per fault code, one whisper, one deny, one correction, a voided intake
    row with a deny fired, every `plan_seed` row, a held reindex claim
    (`reindex_owner_pid` = this process, `reindex_started_at` set), and
    `schema_meta.pinned_interpreter` set once to an existing path and once
    to a removed one; a home-level `repo_not_bound` line; two bindings;
    `lang_capabilities` with one `imports: false` language; three
    `whisper_dropped_unverifiable` faults, one per reason; two `stats_folds`
    rows; session rows carrying `search_results = 'mode_unsupported'` (two)
    and `'unrecognized'` (one); a home-level `repo_not_bound` line with
    `reason: 'store_unreadable'`. No doubles.
  - **Data.** The seeded store. Technique: decision table (each signal
    present/absent in output).
  - **NOT asserts.** Aesthetics. **Fails when** any Step 33 signal is missing,
    OR the reserved codes render as 0, OR the regret rate lacks its label or
    pairing, OR either bypass direction (under-count: unrecognized write
    paths; over-count: a non-bypass write to the denied target) or any
    seed value is absent, OR the held reindex claim is not rendered with
    its start time, OR the removed-interpreter case is not named as
    missing, OR the home-level fault, either binding, the per-language
    capability and unresolved share, a drop reason's count, the walk mode, or
    the `stats_folds` trend is absent, OR the two search counts are not
    printed separately as 2 and 1, OR the `store_unreadable` line is rendered
    as a deleted store, OR `status` run from a directory with
    no binding does not say it is not set up while still listing the
    home-level fault.

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
  - **Data.** Set a scalar; add and remove a list member; list;
    `tune bar.suspect_confidence_cap 0.85` (≥ the 0.8 high tier), `tune
    bar.heuristic_confidence_cap 0.5` (< the 0.6 floor), `tune
    bar.untrusted_trust_factor 0` and `1.2`, `tune bar.untrusted_trust_factor
    0.75` (the tier invariant: 0.75 × 0.9 < 0.8 — collapse-hunt H2), `tune
    bar.stale_factor 0.85` (0.9 × 0.85 < 0.8), then `tune
    bar.untrusted_trust_factor 1`; `tune bar.recency_half_life_days 180`
    (accepted, with the re-mine notice) and `30` (refused, below 37).
    Technique: state-transition + boundary value.
  - **NOT asserts.** Bar recomputation. **Fails when** any value is lost or
    mutated, OR the listing omits a source or a default, OR any of the seven
    refused writes changes a row or exits 0 or prints no reason naming the
    violated relation, OR the value `1` is refused (the interval is (0, 1]),
    OR the accepted half-life write prints no notice naming `ctxoracle
    index`.

- **T-33-4 (AC-9) — `hooks_not_firing` induced and detected by `status`.**
  - **File.** `test/replay/hooks_not_firing.test.ts`.
  - **Verifies.** Step 33 — a session with a liveness row, a transcript that
    grew past `diag.hooks_not_firing_gap_s` after its last event, and no
    `SessionEnd` row is flagged; a session whose last event is recent is
    not; a transcript whose first entry predates `schema_meta.store_created_at`
    and is still growing is not flagged even with no liveness row; a
    `deinit`-then-`init` re-wiring overwrites `store_created_at`, so the
    re-installing session is protected the same way the original one was.
  - **Level.** Acceptance.
  - **Real/doubles.** Real CLI; real store — including its
    `schema_meta.store_created_at` row, present in every fixture store
    `prepareStore` (Step 28) builds, since it is written in item 3 of the
    `init` sequence `prepareStore` reproduces, not item 4; real transcript
    files whose mtime the test advances with `fs.utimes`, and whose first
    parsed line's `timestamp` field (the value `readFrom`/`discriminateEntry`,
    Step 21, surfaces for a `human`/`assistant_text` entry) is set to a
    controlled value at fixture-build time (a real timestamp, not a
    double). No doubles.
  - **Data.** Two sessions and three non-sessions: (a) liveness row at t, last
    event at t, transcript mtime t + 20 min; (b) liveness row at t, last
    event at t + 19 min, transcript mtime t + 20 min; (c) a transcript under
    the repository's slug with mtime 20 min after the newest liveness row
    and no liveness row for its session at all (the totally-dead wiring);
    (d) a transcript under the repository's slug whose first entry precedes
    the fixture store's `schema_meta.store_created_at`, with no liveness
    row, mtime still advancing past the gap (the session running `init`,
    still live); (e) the fixture store re-wired a second time (simulating
    `deinit` without `--purge`, then `init` again, advancing
    `store_created_at`), with a transcript whose first entry falls between
    the original and the second `store_created_at` and is still growing
    with no liveness row (the session running the second `init`). Technique:
    boundary value on the gap.
  - **NOT asserts.** Timer behaviour (none exists, AD-1). **Fails when** (a)
    records no `hooks_not_firing` fault or is not flagged in `status`, OR (b)
    is flagged, OR (c) records no `hooks_not_firing` with the
    "no session started the hooks" detail, OR (d) is flagged, OR (e) is
    flagged.

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
  - **Data.** A fixture stream in session `s1` in which an indirect ask
    ("tell me whether renaming is safe") was not recognized and an `Edit`
    went undenied; a session `s2` started **after** `s1` (a newer liveness
    row) whose last event is older than `s1`'s; `correct --missed-question
    "was renaming safe"`; replay the `Edit` in `s1` (denied now); an `Edit`
    from `s2` and from session `s0` (older) after the correction; the two
    collision cases (already-open; Bash-only deviation); the verb run when the
    session of the most recent event has a `SessionEnd` row; the verb run
    against a store with no `session_log` row. Technique: state-transition.
  - **NOT asserts.** Bash enforcement (L3). **Fails when** the re-armed deny
    does not fire in `s1` (the session of the most recent event — AD-18,
    collapse-hunt H5), OR the `s2` or `s0` `Edit` is denied, OR the verb's
    output does not name `s1` as the armed session, OR no `corrections` row
    with `verdict = 'missed'` and `genre = 'answer_drift'` exists, OR either
    collision case prints the wrong message, OR the ended-session case gains
    a question row or does not say the session has ended and name
    `--session`, OR the empty store gains a question row.

- **T-34-3 — `--genre` and the unattributed booking.**
  - **File.** `test/replay/correct_genre.test.ts`.
  - **Verifies.** Step 34's whisper-less `missed` forms (AD-18; CH C4).
  - **Level.** Acceptance (real CLI).
  - **Real/doubles.** Real CLI; real stores; no doubles.
  - **Data.** `correct --verdict missed --genre coupling`; `correct --verdict
    missed`; `correct --verdict missed --genre nonsense`; `correct <unknown
    id> --verdict false_fire`. Technique: equivalence partitioning.
  - **NOT asserts.** Wording beyond naming the valid genres. **Fails when**
    global `whisper_stats` does not gain `coupling.corrected_missed` = 1 and
    `unattributed.corrected_missed` = 1, OR `answer_drift` changes, OR either
    invalid form writes a row or exits 0.

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
    Read` → `PreToolUse Bash npm test` → the assistant text turn `I'll get
    to that later.` appended to the transcript by the runner → `PreToolUse
    Edit`. Technique: state-transition.
  - **NOT asserts.** Agent behaviour after the deny. **Fails when** either
    `Edit` is not denied with the question in the reason (the second after
    the content-free deferral — FR-B1: it does not clear, `deferral_only`),
    OR `Read` or `Bash` is denied, OR a `stop_hook_active`/continuation
    field appears in any response.

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
  - **Data.** Main-agent question open (`UserPromptSubmit`); a subagent
    `PreToolUse Edit` carrying `agent_id`; then the same `PreToolUse Edit`
    from the main consumer (the control). Technique: state-transition.
  - **NOT asserts.** The deny-half (Phase B); deny content (T-38-1). **Fails
    when** the subagent's `Edit` is denied, OR a `kind = 'deny'`
    `whisper_audit` row exists for the subagent consumer, OR the main
    consumer's `questions` row is not still `open` after the subagent event,
    OR the subagent event's `session_log` row — keyed by its `(session_id,
    agent_id)` consumer — is absent or lacks `outcome`, OR the main
    consumer's `Edit` is not denied with its audit row, OR the JSONL channel
    holds a fault line.

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
    missing OR the headline is a raw count OR the text lacks `the file this
    edit targets` OR contains `just edited` (V20, L12).

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
    suppressed OR `[confidence: uncertain]` is missing from the text (support
    2 < `bar.support_min` 3 gives evidence 2/3 × 0.9 = 0.6 < 0.8).

- **T-38-17 (AC-4) — Read-set subject withheld; not-yet-seen subject delivered; untouched file silent.**
  - **File.** `test/replay/dedup_read_set.test.ts`.
  - **Verifies.** Step 20 (per-consumer read-set dedup) through the pipeline; `AC-4`.
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repositories and transcript files. No doubles.
  - **Data.** Fixture `dedup-read-set` (two coupled pairs X–P and Y–Q, and
    an unrelated file U carrying a planted fact); stream: `PostToolUse Read`
    on X; `PostToolUse Read` on P (its Coupling candidate's subject is X,
    already read); `PostToolUse Read` on Q (its candidate's subject is Y,
    never read); no event touches U. Technique: state-transition; decision
    table over AC-4's three clauses.
  - **NOT asserts.** Cross-consumer withholding. **Fails when** the
    `consumer_state` `read` row for X is absent after the `Read` on X, OR the
    candidate on X is delivered, OR the candidate on Y is not delivered via
    `additionalContext` with its `whisper_audit` row and its
    `consumer_state` `delivered` row, OR any whisper names U, OR any event
    lacks its `session_log` row with `outcome` set, OR the JSONL channel
    holds a fault line.

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
    emitted OR no `whisper_dropped_unverifiable` fault with `reason =
    'stale_pointer'` is recorded.

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
  - **Data.** Fixture `completeness-paired-change`, an `Edit` on one half
    (T-38-14's stream), then two `Stop` events, the second with
    `stop_hook_active: true`. Technique: state-transition.
  - **NOT asserts.** The harness's 8-cap. **Fails when** the first `Stop`
    emits no `additionalContext` naming the partner, OR its `whisper_audit`
    row is absent, OR the second emits `additionalContext`, OR the second
    writes any `whisper_audit` or `delivered` row (nothing is generated at a
    continuation `Stop` — expert review S2), OR either `Stop` lacks its
    `session_log` row with `outcome` set, OR the JSONL channel holds a fault
    line.

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
    question); a committed file whose **name** `isSuspect` flags
    (`ignore previous instructions.ts`), coupled with a normal file (a Read
    of the normal file must render the partner as `path#<id>`, a Read of the
    flagged file itself names it — the own-target exception, AD-19); export both stores; the whole stream and both verbs run
    inside `unshare -rn` where it is available and permitted (T-32-2's
    condition and its recorded-as-not-executed branch on an absent or
    refusing `unshare`; `T-32-3` carries AC-11's no-egress clause then). Technique: decision table (surface ×
    payload).
  - **NOT asserts.** Exhaustive secret coverage (L5). **Fails when** any
    secret appears verbatim in any whisper, store, log, or export, OR any
    injected transcript entry opens a question, OR any whisper carries
    verbatim repo text, OR the flagged filename appears in a whisper about
    the other file, OR any event or verb fails inside the namespace.

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
  - **Verifies.** Step 12 and Step 15 (the extension table's seeding and its enumerated default), Step 14 (the lookup) and Step 33 (`tune`) through `index`; `AC-17`.
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
    evidence and support, OR `[confidence: uncertain]` is absent on a tier
    that is not high or present on a high one, OR a confidence number is
    printed, OR the ⚠ subtype's fallibility note (FR-D4) is missing, OR the
    text is imperative, OR it lacks `the file this edit targets`.

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
    information-gathering move is denied, OR a `kind = 'deny'`
    `whisper_audit` row exists in any stream, OR in any stream the
    `questions` row is not `open` after intake, OR in streams one to four it
    is not `answered` with `closed_by_uuid` = the answering turn's uuid
    after the `Edit` event, OR in the fifth stream it is not still `open`
    after the last event, OR any event lacks its `session_log` row with
    `outcome` set, OR the JSONL channel holds a fault line.

- **T-38-31 (L1 residual) — The wrongful-deny residual is counted, escapable, and re-ask works.**
  - **File.** `test/replay/answer_drift_residual.test.ts`.
  - **Verifies.** Step 25 (deny), Step 22 (open-scoped dedup via `openQuestion`; index DDL Step 7), Step 34 (`correct`) through the pipeline; `L1` residual.
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

- **T-38-34 (AD-24) — Coupling key symmetry.**
  - **File.** `test/replay/coupling_key_symmetry.test.ts`.
  - **Verifies.** Step 18's canonical Coupling key and Step 20's dedup
    through the pipeline (AD-16, AD-24; CH H3).
  - **Level.** Acceptance (system-level replay through the built handler).
  - **Real/doubles.** Real handler binary spawned per event by
    `test/replay/runner.ts`; real stores in a temp home; real fixture
    repository. No doubles.
  - **Data.** Fixture `coupling-key-symmetry` (files A and B co-changing in
    ≥ 30 included commits, never obvious); stream: `PostToolUse Read` A,
    then `PostToolUse Read` B, in one session. Technique: state-transition.
  - **NOT asserts.** Wording. **Fails when** the A–B Coupling fact is not
    delivered on the Read of A, OR it is delivered again on the Read of B,
    OR the two events' candidate subject keys differ.

- **T-38-32 (L11(a)) — Marker presence on real transcripts.**
  - **File.** `test/build_time/marker_presence.test.ts` (run by
    `node scripts/run-tests.mjs`'s `build_time` tier, Step 1) — imports
    `markerPresence` from `test/build_time/marker_presence.ts`, the module
    Step 39 invokes directly over the real replay corpus; the self-test
    runs against `test/replay/transcript_fixtures/`.
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
  - **File.** `test/build_time/grammar_inventory_check.test.ts` (run by
    `node scripts/run-tests.mjs`'s `build_time` tier, Step 1).
  - **Verifies.** Step 38 build-time script over Step 15's default table; `L6`.
  - **Level.** Build-time verification.
  - **Real/doubles.** Real installed `tree-sitter-wasms`, real
    `web-tree-sitter`. No doubles.
  - **Data.** The default `index.ext_to_grammar` table Step 15 enumerates,
    and the four excluded grammars. Technique: equivalence partitioning
    (each grammar present/loadable/parsing; excluded/not).
  - **NOT asserts.** Parse quality. **Fails when** any grammar the default
    table names is missing from the package, fails to load, or fails to
    parse a one-line sample, OR any of `elm`, `ql`, `yaml`, `bash` is
    present in the table.

### 12.4 Coverage reconciliation

**AC → T-ID(s):**

| AC | T-ID(s) | Phase |
|---|---|---|
| AC-1 | T-18-2, T-38-10 | A |
| AC-1a | T-18-1, T-38-11 | A |
| AC-1b | T-15-6, T-18-3, T-38-12 | A |
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
| AC-3 | T-16-1, T-16-2, T-38-15 | A |
| AC-3a | T-16-1, T-38-16 | A |
| AC-4 | T-20-1, T-38-17, T-38-34 | A |
| AC-5 | T-20-1, T-20-3, T-28-11, T-38-20 | A |
| AC-6 | T-13-1, T-18-9, T-38-18 | A |
| AC-7 | T-31-1, T-31-2, T-32-1 (both with and without a pre-existing settings file) | A |
| AC-8 | T-18-7, T-38-28 | A |
| AC-8a | T-27-2, T-38-9 | A |
| AC-9 | T-10-1 (`store_corrupt`), T-29-1 (`latency_breach`), T-14-2 (`index_stale`), T-28-4 (`produced_but_undelivered`), T-33-4 (`hooks_not_firing`), T-26-1 + T-38-6 (the deny that outlives its condition), T-38-8, T-28-7 (`repo_not_bound`), T-28-8 (`store_busy`, `handler_exception`), T-19-2 + T-38-19 (`whisper_dropped_unverifiable`), T-32-4 (`import_rejected`), T-13-3 (`history_rewritten`), T-14-3 (`path_not_utf8`, `index_path_only_oversize`), T-12-2 (`tuning_missing`), T-33-1 (rendering) | A |
| AC-10 | T-29-1, T-28-3 | A |
| AC-11 | T-11-1..T-11-4, T-38-22, T-32-3 | A |
| AC-12 (deterministic parts) | T-38-1, T-38-4, T-36-1 (no model path; nothing switched off) | A |
| AC-13 | T-13-1, T-13-2, T-13-3, T-13-5, T-14-1, T-14-2, T-14-3, T-16-1 (per-class staleness cases), T-16-2, T-16-3 (recency weighting) | A |
| AC-14 | T-19-1 | A |
| AC-15 | T-38-23 | A |
| AC-16 | — | C (deferred) |
| AC-17 | T-38-24 | A |
| AC-18 | T-38-27 (Step 39 leg 3) | A |
| AC-19 | T-32-2, T-32-3, T-32-4 | A |
| AC-20 | T-38-25 | A |
| AC-21 | T-5-2, T-5-3, T-29-2 (guard mechanism); full induced self-trigger | A (mechanism) / B (full) |
| AC-22 | T-38-26 | A |
| AC-23 | T-30-2, T-30-3, T-32-4 (import of an older export), T-34-1, T-34-3, T-35-1, T-35-2 | A |
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

- **R6 — `tree-sitter-wasms` 0.1.13 does not ship a usable grammar for a
  language Max Cogar's repositories need** (four shipped grammars are
  already excluded by executed cause — §4). Mitigation: T-38-33 at build; the generic frontend
  keeps those languages searchable and Reuse-safe (incomparable-set
  silence); a missing grammar becomes a `tune index.ext_to_grammar` row or a
  checked-in `dylink.0` WASM grammar (the §16 exit) without a redesign (C-6).

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

- **R14 — Two reindex passes run at once.** A second pass over the same
  range double-counts `cochange_pairs` and rewrites `symbols` under the
  first, and the exit numbers read from that store are wrong without any
  fault saying so. Mitigation: the claim row taken inside one `BEGIN
  IMMEDIATE` transaction (Step 14, D-plan-32; executed 200 of 200 races
  with one winner); the race case in T-14-1; `reindex_locked` recorded on
  every refusal; `status` prints a held claim with its start time.
  Residual: pid reuse can hold a dead claim until the reusing process
  exits — a delay, visible, never a double pass.

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


- **R15 — The reopened substrate breaks the skeleton's later steps before
  their full builds replace them.** Changing Step 6's types and Step 7's
  schema stops the skeleton code of Steps 13–39 compiling or passing until
  each is rebuilt. *Mitigation:* the broken files are declared in the Step 6
  and 9 deltas and reduced by §9's three-form placeholder rule, each
  placeholder marked `SKELETON: 1R` with its retiring step; a test the
  reduction turns red is marked `node:test` `todo` with its retiring step,
  never deleted or "fixed" against the old types; so `npm test` and CI stay
  green at Checkpoint 1R, and `T-37-1` fails Checkpoint 4 while any mark
  remains (expert review S1; collapse-hunt H12, H13). *Residual:* a broken
  file the read of the skeleton missed — handled by expert-implement's
  blast-radius stop, not inline.

- **R16 — The co-change miner's memory grows with the mined range.** A pass
  holds one aggregated record per commit of its range — horizon-excluded
  commits included, plus the decoded paths of every horizon-included one —
  until `git log`'s stream ends (Step 13, "Memory — a stated limit"). The
  Step 13 build review (M5) measured about 168 bytes per commit on Node 22 for
  the record alone: about 16 MiB at 100,000 commits and about 200 MiB (208.4
  MiB) at 1.3 million, a Linux-kernel-sized non-merge history; a first or
  full mine of such a repository needs that much, and more with paths.
  *Mitigation:* none built in Phase A beyond stating the limit; incremental
  passes hold only their own range, so the cost falls on first and full
  mines. *Residual:* a
  very large repository's full mine can exhaust a small machine's memory;
  the recorded fix, if a bound is wanted, is to write each chunk as soon as
  the aggregated tail reaches it, in a synchronous chunk transaction between
  `data` events, which holds no transaction across a git read (AD-26) and
  bounds memory by a chunk (the review's M5 fix).

---
## 14. Question register

Every question encountered during planning, the step where it arose, its
bin, and its closed disposition.

### 14.1 Bin 1 — engineering questions (derived and answered)

- **Q1 (Step 1).** Which versions of the two runtime dependencies and the
  compiler does the plan pin? **Disposition.** Answered: `web-tree-sitter`
  0.25.10 and `tree-sitter-wasms` 0.1.13 — the pair executed to load and
  parse the shipped grammars (§4; V14's registry read corrected), exact;
  `typescript` 5.9.3, `@types/node` 22.20.1 and `@types/emscripten` 1.41.6
  — D-plan-2; evidence §11.4 (probes 17, 20, 21, 22; the TypeScript 7.0
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
  Answered — D-plan-16 (exactly AD-4's list; both error directions —
  under-count of unrecognized write paths, over-count of a non-bypass
  write to the denied target — printed beside the count, AD-9).
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
  the plan-named `whisper_dropped_stale` (AD-15's compose-time drop —
  *superseded 2026-09-26 by AD-17's `whisper_dropped_unverifiable`, §14.5*),
  `tuning_missing` (Step 12), `head_unresolved` (Step 14, D-plan-30),
  `miner_unparsed_numstat` (Step 13), `reindex_locked` (Step 14,
  D-plan-32) and `frontend_parse_failed` (Step 15) are added and listed
  explicitly in Step 6 and T-6-1.
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
  and the `hook` verb are Step 28's — D-plan-1; the harness prepares each
  replay's stores itself through the substrate's functions (Steps 3–15),
  since `init` is Step 31's.
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
  irrelevant — a turn is a content-free deferral when a deferral-stoplist
  phrase is present and every token outside the phrases is a
  deferral-filler word, wherever the phrase sits; one content token
  anywhere clears (Step 23; `T-23-2`; D-plan-24 — executed over the spec's
  examples, the direct-answer class, the reviewer-supplied deferral
  inputs, and the generated phrase × filler class, §11.4); AD-9's "not a
  recognized content-free deferral" carries no positional restriction,
  and FR-B5 forbids holding on an answer for being short or for sitting
  beside a deferral.
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
  otherwise deny every `Edit`/`Write` — executed,
  `probe:18_leg2_resume_protocol.optional`.
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
  the newest liveness row or `schema_meta.store_created_at` (excluding any
  transcript that predates either, so a session already live at install is
  never itself flagged, `T-33-4` case (d)), and `init`/`status`
  print the pinned interpreter with an existence check (D-plan-25; `T-33-4`
  case (c)).
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
  SQLite lacks FTS5? **Disposition.** Answered — D-plan-28: `init` passes
  the probe's `false` to the migration runner, which applies 001, records
  `fts_state = 'fallback'` once the table exists, and skips 001b (never
  retried); `symbolSearch`/`pathSearch` take the indexed token-table path
  behind the same interface, `status` prints `fts_state`; `T-7-1` and
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
- **Q54 (Step 14).** What does `refreshIfStale` read to obtain `HEAD`'s
  commit, and what happens when the ref cannot be resolved?
  **Disposition.** Answered — D-plan-30: `.git` (directory or `gitdir:`
  file), the common directory, `HEAD`, then the loose ref or one
  `packed-refs` scan, all bounded reads; a ref found nowhere records
  `head_unresolved` and returns `{stale: false}`; `T-14-2` covers the
  ordinary, packed, detached, worktree, and unborn-branch layouts.
- **Q55 (Step 5).** What does the resolver do when `git rev-parse
  --is-inside-work-tree` fails outright? **Disposition.** Answered: in a
  directory inside no repository the command exits 128 and prints nothing
  (executed, `probe:25_git_rev_parse_nongit`), so rule 1 keys on failure
  or `false`; every invocation goes through one `{ok, …}` helper and a
  failure in rules 2–3 routes to rule 4 with a diagnostic carrying the
  exit code (`T-5-1` asserts the branch).
- **Q56 (Step 13).** How does the miner read a `--numstat` line for a
  renamed file? **Disposition.** Answered: the miner runs `git log -z --numstat`
  (machine mode), so there is nothing to decode and nothing to guess. `-z` emits
  every path field as raw bytes — no `core.quotePath` C-quoting of any byte — so
  a field equals the indexer's `readdir` key directly; and it emits a rename as
  two separate NUL-delimited fields (`<added>\t<deleted>\t` with an empty path,
  then `<old>\0<new>\0`), both identities added to the touched set, so a real
  file whose name literally contains ` => ` is one field and is never split into
  a phantom rename (`probe:24_git_numstat_z`). The stream is split on NUL — the
  only byte a pathname cannot hold — and a commit header is a field of shape
  `\x1e` + 40 or 64 lower-case hex (`%H` in a SHA-1 or SHA-256 repository —
  Step 13 build review M1); every other byte, `0x1e` included, is legal in a path
  and emitted raw, so a path containing or beginning with the Record Separator is
  never mistaken for a header or cut mid-path (the probe plants `we<0x1e>ird.txt`
  and records it whole). Only a record that matches none of the expected shapes — a
  malformed stream from a future git format drift — is recorded as
  `miner_unparsed_numstat`, never guessed (`T-13-1` plants the raw special-byte
  paths, a rename, a real file literally named `a => b.txt` asserted to stay one
  path, and a binary entry).
- **Q57 (Step 14).** Can two reindexers both reclaim one stale claim?
  **Disposition.** Answered — D-plan-32: not when the liveness check and
  the claim write share one `BEGIN IMMEDIATE` transaction (executed,
  `probe:26_reindex_claim_row_race`: 200 of 200 races, one winner; the
  former `wx`-file lock: 29 of 200 double wins); release is a `DELETE` in
  a `finally`, refusal records `reindex_locked`, and `T-14-1` races two
  real child processes.

- **Q58 (§6, §7).** The gap-list review routes code changes into built Steps
  3–12; how are they scheduled so a full build from Step 13 does not build on
  the old substrate? **Disposition.** Answered: per-step "Reopened
  2026-09-26 — build delta" paragraphs built first, then Checkpoint 1R —
  D-plan-33.
- **Q59 (Step 16).** What is a landmine's confidence, given AD-14 defines
  confidence only for pairs? **Disposition.** Answered: D-plan-34.
- **Q60 (Steps 7, 18).** Where does a pair headline's commit pointer come
  from without a `git` subprocess? **Disposition.** Answered:
  `cochange_pairs.last_commit` — D-plan-35; in AD-4 since db9ecf9.
- **Q61 (Steps 7, 30, 34).** Where does the fold read `--genre`, and how can a
  whisper-less `missed` row satisfy the exclusive-or CHECK? **Disposition.**
  Answered: `corrections.genre` and the relaxed CHECKs — D-plan-35; in AD-4
  since db9ecf9.
- **Q62 (Steps 7, 14).** Can the fallback search satisfy N6's agreement with
  an index? **Disposition.** Answered by execution (§11.4): not as built;
  D-plan-36.
- **Q63 (Step 28).** How does the handler avoid creating a store for a bound
  key whose store was deleted? **Disposition.** Answered by execution:
  `mode=rw` URI — D-plan-42.
- **Q64 (Step 34).** Which session does `--missed-question` arm under the
  per-session consumer key? **Disposition.** Answered: D-plan-37; raised for
  the architecture, §16.
- **Q65 (Steps 20, 21, 28).** What in a forked transcript is "oracle-injected
  text", and which tool results count as successful? **Disposition.**
  Answered as far as evidence allows — D-plan-39; the unobserved shape is PG-6.
- **Q66 (Steps 6, 28).** Where are a Grep/Glob call's result files?
  **Disposition.** Answered with a named premise — D-plan-40; PG-7.
- **Q67 (Step 16).** Does Warning's single-file history fact pass the
  marginal axis? **Disposition.** Answered: D-plan-41; raised for the
  architecture, §16.
- **Q68 (Step 13).** Which order must chunks follow so the watermark is never
  ahead of its data, and what is the `-z` layout with subject/body fields?
  **Disposition.** Answered by execution (§11.4): `--reverse`; the empty
  field and the leading `\n`.
- **Q69 (Step 32, Step 39).** What does importing a global store do to
  bindings, and where do Max Cogar's exports go at the exit run?
  **Disposition.** Answered: D-plan-43; the global-import semantics raised for
  the architecture, §16.
- **Q70 (Step 12, Step 13).** What weight does an entry-point marker add, and
  may a revert also be a fix? **Disposition.** Answered: D-plan-44.
- **Q71 (Step 18).** Is Verification's covering-test mapping comparative, as
  the structural marginal rule requires? **Disposition.** Answered: yes — it
  aggregates the session's change set, the test map, and the observed runs
  (AD-14's "aggregative over a set the agent has not enumerated"); Step 18.
- **Q72 (Step 6, Step 19).** Can the literal-only headline type close G24 by
  itself? **Disposition.** Answered by execution: no — interpolated template
  literals type-check; `T-19-3`'s source scan closes it.

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

- **PG-5 (all 2026-09-26 decisions):** *"Were the new decisions traced
  through Clear Thought and the survey through CodeGraph, as the planning
  skill requires?"* — no; neither tool was available in this session; §15.
- **PG-6 (Steps 20, 21):** *"What shape does hook-injected text take in a
  transcript?"* — unobserved; §15.
- **PG-7 (Step 28):** *"What is the Grep/Glob `tool_response` schema?"* —
  undocumented and unobserved; §15.
- **PG-8 (Step 13):** *"Does the chunked miner keep a concurrent handler's
  write under 200 ms on the CI runner?"* — a runtime measurement `T-13-5`
  makes; §15.

(The plan-local gap ids are `G1`–`G4` above and `PG-5`–`PG-8`; they are
unrelated to the gap-list review's `G1`–`G36`, which §14.5 maps.)

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
- **Pass 8 (2026-09-26 plan pass, mechanical + impact read).** After the
  architecture passes `0fab6d7`/`ec3b057` and the gap-list review were
  consumed: `derive-plan-sections.mjs` regenerated the regions and its
  `--check` passed (40 steps, 13 elements, 156 test specs, 27 probes cited),
  `--self-check` passed (34 checks), `run-plan-probes.mjs` reported every
  probe matching its expectation; then a grep sweep over the whole plan for
  every superseded concept (`whisper_dropped_stale`, `a_count`, `just
  edited`, `deleteMissing`, `upsertFold`, `window_start`,
  `whisper_stats_watermark`, `'main' | 'subagent'`, `grammar-covered`,
  `defaultFrontends()`, "per-project watermark") with each hit read in
  context — the remaining hits are the deliberate "superseded/removed"
  statements and negative test assertions. Register entries added:
  Q58–Q72, PG-5–PG-8.
- **Pass 9 (re-read of the changed steps against §12 and §14.5).** Every
  gap-list item was walked against the step §14.5 names for it and against
  that step's tests. Entries added: Q71, Q72 (found in this pass). A grep
  sweep is not verification — the per-step reads are the check; bin 2
  remains empty (no owner decision — the review states none of its items is
  one, and none of this pass's choices changes scope).

### 14.5 Gap-list review items → where each now lives

The review's summary table routes every item to a layer; each plan- or
code-layer part is recorded in the step named here, with its reason, as the
required behaviour plus its test. The Notes column is a pointer only — the
AD or step where the reason lives; an item the architecture's second pass
superseded is marked **rejected**, **superseded**, or **refined** there
(collapse-hunt R1: the column had repeated rationale the named decisions
already hold).

| Item | Where it lives now | Tests | Notes |
|---|---|---|---|
| G1 | S12 (`lexicon.fix_keywords`), S13 (labels) | T-13-4 | (c) partly rejected — AD-15 |
| G2 | S7, S9, S13, S14 | T-7-1, T-9-1, T-14-3 | AD-4 |
| G3 | S7, S9, S13, S16 | T-13-2, T-16-2 | AD-13 |
| G4 | S6 (`history_rewritten`), S13 | T-13-3 | refined — AD-13, AD-26 |
| G5 | S7, S9, S13 | T-13-4 | superseded — AD-26 |
| G6 | S1 delta (c); `modify: generate.ts` on S13, S14, S15, S16, S18, S28, S30, S38; S13 provides `parseNumstatZ` | T-1-3, T-13-1 | |
| G7 | S5, S6, S13, S14 | T-5-4, T-5-5, T-14-3 | |
| G8 | §7 conventions; S12 reader; signatures S13–S18, S28 | T-12-2 | |
| G9 | S3 | T-3-5 | superseded — AD-26 |
| G10 | architecture V21; S28 builds no suppression | — | does not hold — V21 |
| G11 | S14 (walk, non-git, remaining outputs) | T-14-3 | (c) rejected — AD-12 |
| G12 | S15 resolvers | T-15-1, T-15-3, T-15-5 | |
| G13 | S14 interface, S15 capabilities and queries | T-15-6, T-18-3 | |
| G14 | S14, S15 (`init`, failure as a value) | T-15-4 | |
| G15 | S6, S14 (`index_path_only_oversize`) | T-14-1, T-14-3 | |
| G16 | S7 (001b edited in place) | T-7-1, T-14-5 | |
| G17 | S12 (`tuningReader`) | T-12-2 | |
| G18 | S6, S16, S18, S28 | T-16-2, T-18-9 | |
| G19 | S6, S13 (`ref_ts`), S16, S28 | T-13-1, T-16-1 | |
| G20 | S12, S16, S19 | T-12-1, T-16-2, T-19-1 | `bar.untrusted_confidence_cap` rejected — AD-14 |
| G21 | S6, S18, S25, S28 | T-18-2, T-28-7, T-28-9 | |
| G22 | S6, S9, S18 | T-9-1, T-18-6 | |
| G23/G29 | S6, S20, S22, S25, S27, S28 | T-6-4, T-20-1, T-22-1, T-25-3, T-27-1 | V22 |
| G24 | S6, S18, S19 | T-6-3, T-19-1, T-19-3 | AD-19 |
| G25 | S6, S18, S20 | T-20-1, T-38-34 | |
| G26 | S1 delta (a) (code: the fixture) | T-21-1 | |
| G27 | S25 | T-25-3 | |
| G28 | S22, S27 | T-22-1, T-27-1 | |
| G30 | S28 (`repo_binding.ts`), S31 | T-28-7, T-31-1 | AD-23 |
| G31 | S6, S28 | T-28-8 | |
| G32 | S28 (writer), S30 (reader) | T-28-9, T-30-1 | |
| G33 | S7, S30 | T-30-2, T-30-3 | rejected — AD-5, AD-18 |
| G34 | S3 (`backupFile`), S32 | T-3-6, T-32-4 | refined — AD-5 |
| G35 | S4, S28 | T-4-1, T-28-3, T-28-7 | |
| G36 | S39 | — (exit run) | |
| `PreToolUse` item | S18 wording; L12 | T-18-4, T-18-5, T-38-13, T-38-29 | (c) rejected — AD-15, L12 |
| N1 | S13 (`corpus_floor_met`), S18 gate, fixtures ≥ 30 commits | T-13-1, T-18-9, T-38-18 | |
| N2 | S27, S28 | T-27-2, T-28-10 | |
| N3 | S6, S28 | T-28-7 | |
| N4 | S14 (code) | T-14-1 | |
| N5 | S9, S13 | T-13-4 | |
| N6 | S7, S14 (code: `search.ts`) | T-14-5, T-15-3 | |
| N7 | S14 | T-14-3 | |
| N8 | S15 | T-15-3, T-15-5 | |
| N9 | S14 (zone rule), S37 (`T-37-1`) | T-14-3, T-37-1 | S37 |
| N10 | §7 conventions; S13, S16, S18, S19 | T-18-5 | |
| N11 | S7 (`seq`), S30 | T-30-3 | |
| N12 | = G22 | | |
| N13 | S12, S14 | T-14-3, T-14-4 | |
| N14 | = `PreToolUse` item | | |
| N15 | S3 (`mustExist`), S28 | T-3-5, T-28-7 | |
| N16 | S7, S9, S10, S28 | T-7-1, T-28-9 | |

---

## 15. Gaps acknowledged

Each entry carries its resolution-attempt evidence and what would close it.

- **G1 — No external standard fixes the plan-seeded thresholds.** The
  values: `bar.reuse_dominance_k` 3; `deny.despite_answer_text_threshold` 3;
  `qa.clear_length_floor_chars` 2; `landmine.fix_chatter_k` 3 within 90
  days; `security.entropy_bits_per_char` 4.0 over tokens ≥ 20 characters;
  `qa.done_claim_trailing_turns_k` 3; `bar.recency_half_life_days` 365;
  `diag.hooks_not_firing_gap_s` 600; `index.entry_marker_points` 1 (Step
  12; reasoning in D-plan-7 and D-plan-44). The staleness factor is no longer
  a plan seed: AD-14 states `bar.stale_factor` 0.9 since `6cff0ce`.
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

- **PG-5 — The 2026-09-26 pass ran without Clear Thought and CodeGraph.** The
  planning skill requires both (`.claude/skills/expert-plan/SKILL.md` Steps 2
  and 6). *Attempt:* the session's tool list and its deferred-tool list were
  read; neither server is present (nor in the revision against `6cff0ce`).
  *Instead:* every premise the new decisions rest on was executed or read
  (§11.4); each decision is written with its reasoning and rejected
  alternatives (D-plan-33 – D-plan-44, §10 — D-plan-38 and D-plan-41 gained
  theirs in the revision, expert review M1) and with its author's four-step
  collapse test (§10A, likewise added in the revision); the file map is the
  declaration-derived §5.1 and the derivation script's build-order check.
  *Closes when:* a session with both servers re-runs the survey (`codegraph_scan`
  with `force: true` over `ctxoracle/`, which now exists) and traces
  D-plan-33 – D-plan-44; the independent review of this pass is the check in
  the meantime.
- **PG-6 — The shape of hook-injected text in a transcript is unobserved,
  and a reseed that finds no oracle line is silent.** *Attempt:* V22
  (documented: "Claude Code saves the injected text in the session
  transcript"); this session's transcript read for attachment types (none is
  a hook-context type — no hook here emits `additionalContext`, §11.4).
  *Consequence:* the fork reseed keys on the oracle's own one-line prefix
  (D-plan-39). Exactly one failure is loud — `[oracle] ` lines found and none
  matching an audited text records `rebuild_recovered_nothing` (set
  `delivered`). A wrapper that splits or rewrites the line so that **no**
  `[oracle] ` line is found records nothing: the reader cannot tell "the
  parent was never whispered to" from "the text was saved in a shape the
  prefix misses" (collapse-hunt H6). *Unverified premise that would make it
  loud:* that a fork's transcript keeps the parent's entries with the
  parent's `sessionId` values and the parent's injected lines — if it does,
  "entries carrying a parent `sessionId` that has `whisper_audit` rows, and
  no oracle line found" could raise `rebuild_recovered_nothing` too; it is
  not built on an unobserved layout. *Closes when:* the exit run's leg 2 (a
  `claude -p` session with the hooks wired, Step 39) produces a forked
  transcript carrying oracle text; the report states the observed entry
  shape, whether the parent's session ids and injected lines were kept, and
  whether the reseed recovered keys.
- **PG-7 — The Grep/Glob `tool_response` schema is undocumented, and that
  the hook receives the tool's output object is unverified.** *Attempt:* the
  hooks reference fetched 2026-09-26 ("the exact schema … depends on the
  tool"; no Grep/Glob example); every transcript on this machine searched for
  a Grep/Glob `toolUseResult` (none); the installed Claude Code 2.1.283
  binary's own Grep output schema read with `strings` in the collapse-hunt
  (P5): `{mode?, numFiles, filenames: string[], content?, …}`, with
  `filenames: []` in the `content` and `count` modes, and Glob's
  `{filenames, durationMs, numFiles, truncated}`. *Not verified:* that the
  hook's `tool_response` is that object (no hook in the container emitted a
  payload to capture). *Consequence:* the adapter reads
  `tool_response.filenames` except in a non-listing Grep mode (D-plan-40), and
  both a `mode_unsupported` and an `unrecognized` response are counted zeros
  in `status`. *Closes when:* the first leg-2 session with a Grep or Glob;
  `T-28-9`-style assertions on a captured payload are added then.
- **PG-8 — The lock-hold bound on the CI runner is a measurement.** AD-26's
  claim (a chunked mine keeps a concurrent handler's write under the 200 ms
  busy bound) is asserted by `T-13-5` on whatever machine runs it; a slower
  runner could fail it with the design correct. *Closes when:* `T-13-5` passes
  on the `ubuntu-24.04` job; a failure there is a finding on `miner.chunk_ms`,
  not a flaky test to retry.

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

5. **A conflict with the architecture is raised, never built around.** Any
   behaviour surfacing during the build that contradicts the architecture
   stops the step (expert-implement's PLAN-FLAW stop) with the evidence, and
   is routed by ownership (`CLAUDE.md`, "Decisions are locked"): an
   engineering flaw is corrected in the architecture in its own pass, with the
   reason recorded there, and the plan follows in a separate pass; only a flaw
   in an owner decision goes to Max Cogar.
   **Resolved:** the items raised by the earlier passes are in the
   architecture at commits `db9ecf9` and `6cff0ce`; (a)–(c) below, raised by
   this revision, were adopted as the plan builds them at `0676431`.
   **Raised by this revision** (engineering items, now resolved):
   (a) *AD-2 says "a normalized-token column on `symbols`".* A column holds
   one value per symbol, and a name such as `Foo::Bar` or `foo-bar` has two
   tokens; a prefix query for the second (`bar`, one of AD-2's own named
   cases) cannot use a plain index over a column that starts with the first,
   so the agreement AD-2 promises would fail for exactly those names. The plan
   builds the fallback as a `symbol_tokens(token, symbol_id)` table, one row
   per token, the same shape as `path_tokens` (Step 7; executed, §11.4).
   Proposed fix: AD-2 and AD-4 name that table.
   (b) *AD-13's weight `2^((ts − T0)/h)` overflows an IEEE-754 double for a
   small `h`.* With `T0` = 2000-01-01, the weight of a 2100 commit is
   `Infinity` at `h` = 30 days (executed, §11.4), and AD-13 states no bound
   on `h`. The plan's `checkTuningWrite` refuses `h` < 37 days (Step 12).
   Proposed fix: AD-13 states the bound (or computes the weights relative to a
   later epoch it re-bases on a full mine).
   (c) *AD-13's "changing `h` requires a re-mine, which `tune` states" leaves
   the re-mine to Max.* The plan makes it automatic — the miner records
   `mined_half_life_days` and a differing `h` makes the next pass a purged
   full re-mine (Step 13) — because an incremental pass over weights mined
   under another `h` would mix two decay rates in one ratio with no signal.
   Proposed fix: AD-13 records the same rule.
   **Still open:** L11(a)'s status is whatever the exit report's origin-keyed
   marker table says — *verified* only if an owner-local interactive
   transcript was in the corpus; AD-16 relies on V22's documented "injected
   text is saved in the transcript" without an observed shape, and
   AD-15/AD-6 on a Grep/Glob result list with no documented schema (PG-6,
   PG-7) — each gets a V-row once the exit run observes it; and the probes the
   2026-09-26 plan pass executed (§11.4) become `run-plan-probes` entries in
   the next plan revision.

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
  files or `tune` rows, with no runtime dependency added — the named exit
  if `tree-sitter-wasms` stays unmaintained is vendoring the `dylink.0`
  grammar files the per-language packages ship (§4), which restores `yaml`,
  `bash`, `elm` and `ql` and loads under 0.25.10 and 0.27.0 alike.

---

*End of plan. Its foundation: `docs/specs/spec-context-oracle.md`
(OL-C6-signed), `docs/architecture-phase-a.md` (reviewed to convergence
2026-09-04), `OWNER-LEDGER.md` CONFIRMED rows, and the Phase A goal recorded
in spec §11.5 and `CLAUDE.md` dominating rule 3. Where the plan cites an ID
(AD-n, FR-*, AC-*, OL-*), the cited document is the authority.*
