# Plan — Context Oracle Phase A implementation

**Status:** Phase A implementation plan, derived from `docs/specs/spec-context-oracle.md`
(spec of record, `OL-C6` 2026-08-28) and `docs/architecture-phase-a.md` (Phase A
architecture, reviewed to convergence 2026-09-04). Written 2026-09-06. This plan
consumes the spec and architecture and is executed by the Phase A build. Every
step here traces to an architecture decision (`AD-n`), a spec requirement
(`FR-*`, `AC-*`, `C-*`, `NF-1`, `P*`, `D-n`), or a ledger key (`OL-*`).

**Reading order.** `docs/STATUS.md` first, then `OWNER-LEDGER.md`, the spec,
`docs/architecture-phase-a.md`, `docs/collapse-log.md`. This plan is executed
against those documents, not in place of them; where the plan cites a decision
by ID (e.g. AD-9), the architecture is the authority — the plan does not
re-litigate what the architecture decided, it schedules its construction.

**Non-negotiable orientation (`CLAUDE.md` dominating rule 3, `docs/STATUS.md`).**
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
passing on fixture replays *and* the exit run on Max Cogar's real repos
reporting the honest floor of what the deterministic recognizers catch — not a
padded coverage number.

## 2. Scope

### 2.1 In scope for this plan

Every Phase A component the architecture names, in the topological build order
below, plus the seam contracts (interface stubs) that Phase B and Phase C plug
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
  - Per-event transcript catch-up.
  - The single deny-producer file (`blocks/verdict.ts`) with the structural
    import-graph test making AC-2 mechanical.
  - The lag-window hold on the clear-axis; `deny_after_answer_lag` and
    `deny_despite_answer_text` detectors; `deny_loop` and
    `deny_bypass_suspect`.
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
  environment variable, cwd isolation for future spawns; Phase A is
  degraded-mode by construction (no model calls).
- **Concurrency (AD-26):** WAL + `busy_timeout=100ms` + retry-once, single
  writer discipline, single `BEGIN IMMEDIATE` for the `whisper_stats` fold.
- **CLI surface (AD-20):** `init`, `deinit`, `index`, `status`, `log`,
  `correct`, `note`, `tune`, `export`, `import`, `hook <event>` (internal).
- **Human channel + regret (AD-18):** `ctxoracle correct` and `note` with
  provenance; `--missed-question` routed through the same recognizer as
  intake; the Phase A regret proxy (re-edit/revert or covering-test-failed on
  a held-but-unspoken fact).
- **Test architecture (AD-24):** `node:test` unit suites, fixture-repo
  generators, replay harness against the real handler binary, three
  build-time verifications (marker presence on the owner's actual interactive
  transcripts, whether platform-injected turns fire `UserPromptSubmit`,
  `tree-sitter-wasms` grammar inventory), cold-container install probe.
- **Exit run:** discovery-mode replay on Max Cogar's real repos plus the
  seeded-fact fixture, producing the §11.5 exit measurement.

### 2.2 Out of scope for this plan (deferred to later phases per §11.5)

Restated so no reader mistakes deferral for postponed intent:

- **Every model-in-the-loop genre and mechanism** — `FR-A2h` Assumption-check,
  `FR-A2i` Steering, `FR-A2j` Answer, `FR-A2m` Unfinished-work check, the
  model-assisted done-claim recognizer, the model-assisted answer-directed
  judgment for AC-2a-ii — all Phase B. This plan leaves the AD-9 Phase B seam
  (module-replaceable `qa/classify.ts` behind the unchanged `qa/state.ts` read
  interface), the AD-21 piggyback seam (`model/invoke.ts` interface fixed
  now, `env_capabilities` table created by Phase B's migration), and the
  AD-22 deferred-delivery contract (semantics fixed as constraints on Phase B;
  no `deferred_queue` table shipped) — all buildable, none built.
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
in-scope list maps to at least one plan step in §7. Reconciled at delivery:

| Requested Phase A element | Plan step(s) |
|---|---|
| Deterministic core: seven model-free genres | Steps 21–28 (Orientation, Coupling, Reuse, Consequence, Warning, Completeness, Verification/completion-check) |
| Answer-drift block's safe skeleton (deny plumbing + conservative recognizer) | Steps 12–15 (deny confinement, qa state, recognizers, block wiring); Step 18 (deny health detectors); Step 19 (lag-window hold + backstop) |
| Stores / index / miner | Steps 3–9 (packaging, adapter, schemas, identity, dirs); Steps 20 (miner), 22 (indexer) |
| Delivery | Step 30 (delivery + dedup); Step 31 (Stop-time additionalContext + outstanding-question line) |
| Self-observability (correct silence, denies, wrongful-deny, missed skill-block reserved) | Steps 10 (diagnostic writer), 33 (regret at SessionEnd), 36 (status), 37 (log) |
| Security | Step 11 (redactor + injection flagger); Steps 4 (0700 dirs) and 22 (redaction at indexer ingress) reference it |
| Human-correction calibration channel | Step 34 (`correct` verb + `--missed-question` routing); Step 35 (`note` verb) |
| The two seams (Phase B, Phase C) | Step 13 (qa/state.ts interface + module-replace test); Step 15 (deny confinement structural test — second caller point for Phase C); Step 39 (`model/invoke.ts` interface stub committed but not called) |
| Exit measurement on real repos | Step 42 (discovery-mode replay + exit report against AC-18 seeded coverage) |

Nothing is unmapped; nothing is silently deferred.

### 2.4 Coverage exclusions requiring owner authority

None. The spec (`OL-C6`) is signed off, STATUS.md declares no owner question
open, and the architecture in-scope list is exhaustively mapped above.

## 3. Standards that govern this plan

The registry every non-trivial step's Source annotation resolves against.
Editions and dates are the spec's own §9 verified dates unless newer here; the
architecture's V1–V19 verified 2026-08-29 are inherited without re-execution
except where noted in §11.

- **Spec `docs/specs/spec-context-oracle.md`** — the authoritative requirement
  set (`FR-*`), acceptance set (§14, `AC-*`), fixed constraints (`C-*`, `NF-1`),
  product principles (`P1`–`P9`), and recorded judgments (§12, `D-n`).
  Signed off `OL-C6` 2026-08-28. Governs every step's Source.
- **`OWNER-LEDGER.md` CONFIRMED rows** — every owner-attributed claim (OL-2,
  OL-3, OL-4, OL-6, OL-7, OL-10, OL-11, OL-12, OL-C1, OL-C2, OL-C3, OL-C4,
  OL-C5, OL-C6). REJECTED rows (OL-R1..OL-R5) are never reintroduced.
- **`docs/architecture-phase-a.md`** — the design authority (AD-1..AD-26,
  V1..V19, L1..L11, threat model, ASVS mapping, traceability matrix). Every
  Source citation of an `AD-n` resolves here.
- **Claude Code hooks reference** — `code.claude.com/docs/en/hooks` (event
  set, `PreToolUse` `permissionDecision` deny with
  `permissionDecisionReason`, `Stop`/`SubagentStop` `additionalContext`
  channel, `stop_hook_active`, subagent `agent_id`/`agent_type`,
  `transcript_path` async lag, `PostToolUseFailure`, timeouts). Verified by
  architecture V1–V6, V15/V16, V18/V19 on 2026-08-29.
- **Node.js v22.x** — `node:sqlite` with FTS5 from v22.16.0 (architecture V7;
  `sqlite.gyp` on the v22.x branch defines `SQLITE_ENABLE_FTS5`).
- **npm packages** — `web-tree-sitter` (latest 0.27.0, no runtime deps, no
  install scripts, verified 2026-09-06 via npm registry) and
  `tree-sitter-wasms` (latest 0.1.13, published 2025-10-07, no install
  scripts, verified 2026-09-06). Architecture V14 verified 0.26.13 / 0.1.13
  on 2026-08-29 — the plan floors at 0.26.13 for `web-tree-sitter` (the
  architecture's tested version) and pins 0.1.13 for `tree-sitter-wasms`;
  bumping `web-tree-sitter` to 0.27.0 is a Step-1 owner-visible choice
  (recorded in the plan's Question register as bin 1 answered).
- **ISO/IEC/IEEE 29119-4:2021** — test design techniques (equivalence
  partitioning, boundary value analysis, decision tables, state-transition,
  error guessing) — the test techniques named in each specification in §12.
- **Software Engineering at Google — Unit Testing + Test Doubles chapters
  (Winters, Manshreck, Wright, 2020)** — test behaviors not methods, test
  state not interactions, real implementations preferred, fake > stub > mock,
  fakes must themselves be tested. Governs every specification in §12.
- **Meszaros xUnit Test Patterns** — the test-double taxonomy (dummy, stub,
  fake, spy, mock) named on every double in §12.
- **ISO/IEC/IEEE 29119-1:2022** — risk-based testing as the recommended
  strategy basis. Governs the coverage-proportional-to-risk shape of §12.
- **OWASP LLM Top-10 2025 (LLM01, LLM02) + Prompt-Injection Cheat Sheet +
  ASI06 + Secrets Cheat Sheet** — inherited from spec §9 (verified
  2026-08-25). Governs Step 11 (security).
- **OWASP ASVS 5.0 (applicable subset — V1, V2, V5, V13, V14, V15, V16)** —
  inherited from architecture's ASVS mapping table. Governs the security-
  adjacent steps (11, 22, 30, 34).
- **SQLite WAL semantics** — engine-documented behaviour, exercised by
  architecture V8. Governs Step 32 (concurrency).
- **Zimmermann et al., IEEE TSE 31(6) 2005 (ROSE)** — via spec §9. Governs
  the confidence computation grounding of Step 24 (bar) and Step 20 (miner),
  with the operating point architect-tunable (Phase A calibration input is
  the human channel per `D-12`).

---

## 4. Spec issues

None open. `docs/STATUS.md` confirms "no owner question is open" and the
spec's §13 open items are both resolved against the architecture (V7 supersedes
the 2026-08-16 FTS5 note; V18 resolves the subagent `additionalContext`
question). The two live *build-time* verifications the architecture names in
`L11` (human-turn marker presence on the owner's real interactive transcripts;
whether platform-injected turns fire `UserPromptSubmit`) are not spec issues —
they are named verifications the plan schedules inside its own steps (Step 40),
not open questions in the register.

---

## 5. Files affected

Phase A is a greenfield component tree (architecture `L8` — no existing code
touched; no transitive-dependency tracing applicable because there are no
existing dependents). Files created live entirely under
`middleware/context-oracle/ctxoracle/` unless noted; files modified are
limited to two documentation files at plan-delivery time.

### 5.1 New files (the AD-24 project skeleton, materialised)

```
middleware/context-oracle/ctxoracle/
  package.json                             # AD-25 — bin, deps, no postinstall
  tsconfig.json                            # AD-25 — strict ESM
  README.md                                # AD-25 — install + verbs (owner-facing)
  scripts/
    check-cold-container.sh                # AC-20 — cold-install probe
  src/
    cli.ts                                 # AD-20 — verb dispatch
    hook/
      adapter.ts                           # AD-6 — the ONE file that names CC hook fields
      handler.ts                           # AD-7, AD-8 — per-event pipeline
      watchdog.ts                          # AD-23 — cooperative deadline
      guard.ts                             # AD-21 — CTXORACLE_INTERNAL check
    blocks/
      verdict.ts                           # AD-10 — the ONE deny-verdict producer
      answer_drift.ts                      # AD-9 — the block; Phase A's only verdict caller
    qa/
      state.ts                             # AD-9 — DAO; Phase B seam (read interface stable)
      classify.ts                          # AD-9 — recognizers (Phase B replaces this file)
    transcript/
      reader.ts                            # AD-11 — bookmarked JSONL tail
      locate.ts                            # AD-11 — path resolution
    genres/
      orientation.ts                       # AD-15 FR-A2a
      coupling.ts                          # AD-15 FR-A2b
      reuse.ts                             # AD-15 FR-A2c
      consequence.ts                       # AD-15 FR-A2d
      warning.ts                           # AD-15 FR-A2e (⚠, FR-A5a)
      completeness.ts                      # AD-15 FR-A2f
      verification.ts                      # AD-15 FR-A2g + done-claim recognizer
      command_class.ts                     # AD-15 — ternary classifier
    bar/
      combinator.ts                        # AD-14
    stores/
      adapter.ts                           # AD-2 — the ONLY node:sqlite importer
      migrations/
        001_phase_a_project.sql            # AD-4
        002_phase_a_global.sql             # AD-5
      dao/
        files.ts symbols.ts import_edges.ts symbol_refs.ts test_map.ts
        commits.ts cochange_pairs.ts landmines.ts invariants.ts
        human_facts.ts corrections.ts questions.ts classify_state.ts
        consumer_state.ts session_log.ts observed_actions.ts
        whisper_audit.ts faults.ts tuning.ts whisper_stats.ts
    index/
      indexer.ts                           # AD-12 — orchestrator
      frontend.ts                          # AD-12 — LanguageFrontend interface
      tree_sitter_frontend.ts              # AD-12 — WASM grammars
      generic_frontend.ts                  # AD-12 — line-based fallback
      zone.ts                              # AD-12 — zone classification + evidence
    miner/
      cochange.ts                          # AD-13
    security/
      redact.ts                            # AD-19 FR-X1
      injection.ts                         # AD-19 FR-X3
      trust.ts                             # AD-19 FR-X4 (helpers; the CHECK is DB-level)
    identity/
      repo_key.ts                          # AD-3
      home.ts                              # AD-3 — ~/.ctxoracle layout, 0700
    diag/
      fault_codes.ts                       # AD-17 — the stable code enum
      jsonl.ts                             # AD-17 — direct-file diagnostic writer
      status.ts                            # AD-17 — status renderer (FR-M4)
      log.ts                               # AD-17 — log renderer (FR-M5)
    human/
      correct.ts                           # AD-18 FR-D4/FR-L6
      note.ts                              # AD-18 FR-L6 (+ global routing FR-L7)
      regret.ts                            # AD-18 FR-L4 proxy
    model/
      invoke.ts                            # AD-21 — Phase B seam stub (never called in Phase A)
    types/
      events.ts                            # internal event type — the ONLY consumer of adapter.ts output
      verdict.ts                           # response shape (re-exports blocks/verdict.ts's type)
    util/
      env.ts                               # runtime floor check (AD-2)
      hash.ts                              # SHA-256 helpers
      ulid.ts                              # ULID generator (AD-26)
  test/
    unit/                                  # AD-24 tier 1
      recognizer_question.test.ts
      recognizer_clear.test.ts
      recognizer_move.test.ts
      recognizer_done_claim.test.ts
      bar.test.ts
      redact.test.ts
      injection.test.ts
      repo_key.test.ts
      reader.test.ts
      command_class.test.ts
      verdict_confinement.test.ts         # AC-2 structural
      export_roundtrip.test.ts            # AC-19 record-identical
    fixtures/                              # AD-24 tier 2
      repos/                               # generated git repos per AC (§12 lists them)
    replay/                                # AD-24 tier 2 harness
      runner.ts
      hook_stream_fixtures/                # captured hook JSON streams
    build_time/                            # AD-24 build-time verifications
      grammar_inventory_check.ts           # L6
      real_transcript_marker_probe.md      # L11 (a) — owner-run
      user_prompt_submit_provenance.md     # L11 (b) — owner-run
```

### 5.2 Files modified at plan-delivery time (this session)

- `middleware/context-oracle/docs/STATUS.md` — rewritten (not appended) to
  reflect the new state (plan delivered) and the new next step (build against
  this plan). CLAUDE.md session protocol.
- `middleware/context-oracle/docs/plans/plan-phase-a.md` — this file (created).

### 5.3 Files modified at build time (the one sanctioned in-tree write, `D-9`)

- `<owner-repo>/.claude/settings.json` — hook entries added by `ctxoracle
  init`; removed by `ctxoracle deinit`. Not part of *this* plan's file set —
  it is the runtime effect of Step 30 (the `init` verb) inside the owner's
  own repository at install time. Recorded here so the reader sees the one
  in-tree write in the file map.

### 5.4 Dependents that may need verification after changes

None. This plan introduces the first Phase A code; the `middleware/context-
oracle/` directory contains only documentation prior to this plan's execution
(architecture `L8`). The check-tooling (`middleware/context-oracle/tools/
check_docs.py`, `.github/workflows/context-oracle-docs.yml`) does not
import any of the new code and is unaffected.

### 5.5 Related docs (deterministic sweep)

`codegraph_find_related_docs` is not available in this environment (recorded
in §15 Gaps). The manual related-docs sweep, exhaustive over
`middleware/context-oracle/`:

- `docs/STATUS.md` — updated by this session per §5.2. Post-build state
  updates are the build's responsibility.
- `docs/architecture-phase-a.md` — the plan derives from it; the architecture
  is never edited by the plan or the build. A behavior surfacing during
  build that contradicts the architecture is a Stop-and-Escalate condition
  (§14 register bin 2 rules): raise it to the owner rather than silently
  drift the code from the architecture.
- `RETHINK.md`, `docs/collapse-log.md`, `docs/IDEAS.md`, `OWNER-LEDGER.md`,
  `CLAUDE.md`, `README.md`, `docs/judgment-layer-corrected-foundation.md`,
  `docs/reviews/` (point-in-time, never edited per `CLAUDE.md`) — none
  reference `middleware/context-oracle/ctxoracle/**` because that path does
  not yet exist. Post-build, the `README.md` at the middleware root will
  gain a pointer to the new package; that pointer is a Step 43 obligation
  (post-completion), not a mid-build sync.

---

## 6. Foundation corrections

None. Architecture `L8` states it directly: "This architecture introduces a
new component tree; it modifies no existing code. The only repo files it
touches at runtime are `.claude/settings.json` (init/deinit). No
transitive-dependency tracing was therefore performed — there are no existing
dependents to trace." The check-tooling (`tools/check_docs.py` + the CI
workflow) was reviewed for interaction with the new component tree at plan
time: it operates on documentation only and imports none of the code this
plan introduces. No pre-existing pattern is being extended, so nothing gets a
foundation correction here.

If, during the build, a check-tooling change becomes necessary (for example,
adding a key retirement when the plan reveals a stale reference), that change
lives in the same PR that reveals it, per `CLAUDE.md`: "extending it when a
key is legitimately retired is a deliberate, explained change in the same
PR." That is a follow-up mechanism, not a foundation correction — it is not
scheduled here because no such change is currently identified.

---

## 7. Plan — ordered steps

Steps are topologically sorted: a step's `Dependencies` field names every
earlier step it consumes, and the ordering guarantees that when a step runs,
every dependency has completed. Foundation steps (packaging, runtime floor,
store adapter, schemas) come first because everything else opens the stores
they create. The answer-drift block (Steps 12–19) is built next, before the
whisper genres, because it is the one Phase A mechanism that can halt an
agent and its safe-skeleton shape is the plan's highest correctness risk. The
whisper genres, delivery, and the handler follow. Diagnostics, the human
channel, and the CLI come after the pipeline is complete because they render
data the pipeline produces. Tests and the exit run close the plan.

**Non-trivial vs trivial marking.** Every step below is treated non-trivial
by default (Gate 3 four-part format applied) unless the step is a pure
mechanical construction whose only choice is prescribed by the architecture —
then the format collapses to one sentence naming the AD-n Source. When
uncertain whether a step is trivial, the plan treats it as non-trivial. Steps
1 (packaging), 2 (runtime check), 6 (JSONL fault writer), and 43
(post-completion housekeeping) are the trivial cases; all others use the full
Gate 3 four-part format.

**Verification field ↔ Test specification.** Each step's `Verification` field
names the test IDs (defined in §12) whose passing constitutes verification.
Every AC-* named in §12 traces back to the Verification of at least one plan
step; every unit test also traces to the step it verifies.

---

### Step 1 — Package skeleton, TypeScript strict, and CI job

**What changes.** Create `middleware/context-oracle/ctxoracle/package.json`
with `"type": "module"`, `"bin": {"ctxoracle": "dist/cli.js"}`,
`"engines": {"node": ">=22.16.0"}`, and dependencies exactly
`{"web-tree-sitter": "^0.26.13", "tree-sitter-wasms": "0.1.13"}` (dev deps:
`typescript`, `@types/node`); explicitly NO `scripts.install`,
`scripts.postinstall`, or `scripts.preinstall`. Create `tsconfig.json` with
`"strict": true`, `"target": "ES2022"`, `"module": "NodeNext"`,
`"moduleResolution": "NodeNext"`, `"outDir": "dist"`, `"rootDir": "src"`,
`"declaration": false`. Add a GitHub Actions workflow
`.github/workflows/context-oracle-ctxoracle.yml` that runs `npm ci && npx
tsc --noEmit && node --test test/unit/**/*.test.ts` on every PR touching
`middleware/context-oracle/ctxoracle/**`.

**Source.** `AD-25` (packaging: two deps, no postinstall, no native code,
`tsc` build); `AD-2` (Node ≥ 22.16.0, TypeScript strict ESM); `C-3` (no
prebuilt-binary download, no native toolchain).

**Why this approach (trivial: mechanical construction).** The architecture
prescribes exactly this shape. `web-tree-sitter` and `tree-sitter-wasms` are
the only runtime deps because they are the only WASM-only publishers the
indexer needs (V14 + plan-time re-verification: no install scripts on either
package, verified 2026-09-06 via npm registry).

**Dependencies.** None (first step).

**Verification.** `T1-1` (Step-1 build test): from a clean checkout, `cd
middleware/context-oracle/ctxoracle && npm ci && npx tsc --noEmit` exits 0
with no warnings; `node --test` reports 0 tests found (expected — no tests
yet). Verify no install/postinstall/preinstall script ran by capturing `npm
ci` output.

**Impact if wrong.** Contained — a broken package skeleton fails Step 1's
own verification; every subsequent step's `npm ci` also fails, so the mistake
is visible immediately. No blast radius outside this directory.

---

### Step 2 — Runtime floor check + FTS5 probe

**What changes.** Create `src/util/env.ts` exporting `assertRuntime()`: reads
`process.versions.node`, compares to `22.16.0` using SemVer, throws a
plain-language `Error` naming the current version and the required version
on mismatch. Create a stub `probeFts5(db: DatabaseSync): boolean` in
`src/stores/adapter.ts` that attempts `CREATE VIRTUAL TABLE _fts5_probe USING
fts5(x); DROP TABLE _fts5_probe;` inside a transaction, rolling back on
throw. Both are called from Step 30's `init` verb; Step 2 delivers the
functions and their unit tests, not the wiring.

**Source.** `AD-2` (floor at 22.16.0 chosen for FTS5 arriving in
`node:sqlite` per V7 and `backup()` per V17; FTS5 probed at `init` as
defense-in-depth against non-standard builds).

**Why this approach (Gate 3):**
1. **The decision.** Fail-loud at `init` with a plain-language message; probe
   FTS5 as a real create-table statement, not a version-string comparison.
2. **The authoritative standard.** `AD-2` (architecture); Node's official
   `node:sqlite` documentation for `DatabaseSync.exec()` behaviour (throws
   `SqliteError` on statement failure).
3. **Why this standard applies here.** The floor rule exists precisely to
   catch the 22.13–22.15 case where a semver-loose check would silently pass
   and land the owner on degraded search — the architecture states this as
   the reason the floor is 22.16.0, not C-1's 22.13.0 unflagged-since
   figure.
4. **What this is NOT — and why.** Not a soft warning (a warning the
   non-programmer owner does not see is not a signal — `OL-11`, `OL-10`).
   Not a version-string check for FTS5 (a distro-compiled Node with
   different flags would still fail the actual `CREATE VIRTUAL TABLE`; only
   the execution proves the capability). Not a fallback to `LIKE` silently
   (Phase A's fallback is announced by `status` per AD-2, so absence of
   FTS5 is visible).

**Dependencies.** Step 1.

**Verification.** `T2-1` (env unit test), `T2-2` (FTS5 probe unit test) —
both in §12.

**Impact if wrong.** Contained to `init`: a broken runtime check either
falsely rejects a good runtime (loud, easy to fix) or falsely accepts a bad
one (caught by the FTS5 probe or by a downstream statement failure in
subsequent steps). No agent-visible failure — this only runs at `init`, not
on the hook path.

---

### Step 3 — Store adapter (the single `node:sqlite` importer)

**What changes.** Create `src/stores/adapter.ts` — the ONLY file in the
codebase that imports `node:sqlite`. Exports:
- `openStore(path: string): Store` — opens a WAL-mode STRICT SQLite database
  at `path` with `foreign_keys=ON`, `busy_timeout=100`, prepares statement
  caches, returns a `Store` handle.
- `Store.prepare(sql: string): Statement` — prepared statement wrapper.
- `Store.transaction<T>(fn: () => T): T` — `BEGIN IMMEDIATE`/`COMMIT`/
  `ROLLBACK`, with `SQLITE_BUSY` retry-once per AD-26.
- `Store.close()`, `Store.integrityCheck(): 'ok' | 'failed'` (runs `PRAGMA
  quick_check` — used only off the event path per AD-17).
- `Store.exportTo(destPath: string): void` — implements `VACUUM INTO`
  (AD-5, V17) for AC-19.
Add a repository-wide ESLint rule (or a simple `test/unit/adapter_
confinement.test.ts` that greps built `dist/`) asserting no other `.ts` file
imports `node:sqlite`.

**Source.** `AD-2` (quarantine `node:sqlite`'s Experimental status behind a
single-file seam); `AD-26` (WAL + `busy_timeout=100ms` + single-transaction
writes per event + retry-once on `SQLITE_BUSY`).

**Why this approach (Gate 3):**
1. **The decision.** One file imports `node:sqlite`; every other component
   consumes the `Store` interface. `BEGIN IMMEDIATE` (not `DEFERRED`) is
   the transaction default so writers serialize deterministically instead of
   racing to upgrade.
2. **The authoritative standard.** `AD-2` (architecture, the single-writer
   seam decision); SQLite WAL documentation (WAL semantics: readers do not
   block the writer, one writer at a time — exercised by architecture V8);
   ISO/IEC 25010 analysability (a single seam file makes the Experimental-
   API surface auditable).
3. **Why this standard applies here.** `node:sqlite`'s Experimental status
   means its API surface may change between Node minor versions;
   quarantining the import to one file makes a future API adaptation a
   single-file change instead of a codebase-wide sweep. `BEGIN IMMEDIATE`
   is required because the deny-path audit write (AD-8) must not fail
   silently to `SQLITE_BUSY` in a way that swallows a concurrent writer's
   change.
4. **What this is NOT — and why.** Not `better-sqlite3` (C-3 excludes it —
   native prebuilds break cold-container install). Not raw callback-based
   `sqlite3` (blocks the event loop on every callback; the WAL adapter can
   use `DatabaseSync` synchronously and stay within V8's ~2ms budget). Not
   `BEGIN DEFERRED` (upgrade races on write; measured behaviour, not a
   preference).

**Dependencies.** Step 2.

**Verification.** `T3-1` (adapter WAL/STRICT round-trip),
`T3-2` (adapter confinement test — the AC-2-style import-graph check
applied to `node:sqlite`).

**Impact if wrong.** Systemic — every downstream step opens the store
through this seam. A broken WAL flag would degrade concurrency (silent, hard
to diagnose) — mitigated by `T3-1` explicitly asserting `PRAGMA
journal_mode` returns `wal`.

---

### Step 4 — `~/.ctxoracle/` layout, 0700 permissions, `CTXORACLE_HOME`

**What changes.** Create `src/identity/home.ts` exporting `ctxoracleHome():
string` — resolves `process.env.CTXORACLE_HOME || path.join(os.homedir(),
'.ctxoracle')`. Create `src/identity/layout.ts` with `ensureLayout(home:
string, repoKey: string): { global: string; project: string; diagnostics:
string; lock: string }` — creates directories at mode `0o700` if missing,
returning absolute paths for `<home>/global/global.db`,
`<home>/projects/<repoKey>/store.db`, and
`<home>/projects/<repoKey>/diagnostics/`.

**Source.** `AD-3` (root `~/.ctxoracle/`, override `CTXORACLE_HOME`, 0700
directories); `FR-X5` least privilege; `FR-X7` locality.

**Why this approach (Gate 3):**
1. **The decision.** Directories are created at `0o700` on first use;
   `CTXORACLE_HOME` overrides the default; a directory that exists with
   loose permissions is left as-is and reported by `status` (never
   silently `chmod`ed — the store may already contain the owner's
   data and altering its permissions is an out-of-scope change).
2. **The authoritative standard.** `AD-3` (architecture); OWASP ASVS 5.0
   V14 (Data Protection) — restrict local file mode to owner-only for
   files containing user data.
3. **Why this standard applies here.** The stores hold the owner's
   corrections, session logs, and mined history — every planted-secret
   redaction failure (`L5`) would leak through a world-readable store. The
   0700 mode is the last-line control per T3.
4. **What this is NOT — and why.** Not encryption-at-rest (single-user
   local scope, no local-attacker actor per §2.3). Not `chmod` on
   pre-existing loose permissions (data integrity risk; visibility is the
   right response). Not per-file mode overrides (directory mode is what
   controls access; per-file overrides add surface without gain).

**Dependencies.** Step 3.

**Verification.** `T4-1` (layout unit test): after
`ensureLayout('/tmp/oracle-test-<pid>', 'abc123')` the three directories
exist with mode `0o700` (checked via `fs.statSync(...).mode & 0o777`); a
pre-existing loose-mode directory is not `chmod`ed and is instead reported
by a return-value field the test asserts.

**Impact if wrong.** Contained to the local user — if the wrong home is
resolved, `init` writes to the wrong place (owner sees no data in
`status`; recoverable by fixing `CTXORACLE_HOME`).

---

### Step 5 — Repository identity resolver

**What changes.** Create `src/identity/repo_key.ts` exporting `resolveRepoKey
(repoPath: string): { key: string; mode: 'commit'|'url'|'path'; evidence:
string }`:
1. `git rev-parse --is-inside-work-tree` → false → fall through to (3).
2. `git rev-parse --is-shallow-repository` → true → derive key from
   normalized origin URL (`git config --get remote.origin.url`, normalized
   by lowercasing scheme+host, stripping trailing `.git`, stripping user
   info); if no origin, fall to (3). `mode='url'`.
3. `git rev-parse --is-shallow-repository` → false → run `git rev-list
   --max-parents=0 HEAD`, sort the returned hashes lexicographically, take
   the smallest; `mode='commit'`.
4. Fallback: SHA-256 of the realpath (`fs.realpathSync(repoPath)`);
   `mode='path'`.
The key is `<first-12-hex of sha256(identity_string)>`. `init` performs
**no** `git fetch`.

**Source.** `AD-3` (deterministic rule; the shallow-branch is URL or path,
never commit; init performs no fetch — `FR-X5`).

**Why this approach (Gate 3):**
1. **The decision.** Full-history repos key on the lex-smallest root commit
   (traversal order is not a specified property of `git rev-list`);
   shallow repos never derive from history because the shallow set varies
   per clone (V13: 4 boundary commits on this clone, 6 on the 2026-07
   clone of the same repo).
2. **The authoritative standard.** `AD-3` (architecture); git's own
   documentation of `--max-parents=0` (returns root commits — a shallow
   clone's roots are the shallow boundary, not the true roots).
3. **Why this standard applies here.** A key that silently differs between
   a full and a shallow clone of the same repo splits one repository's
   knowledge across two stores — `FR-K9`'s export/import cannot repair
   that (the exports would be against different keys). The URL-fallback
   with visible mode is the auditable escape hatch: the owner sees the
   mode in `status` and can unshallow externally to migrate.
4. **What this is NOT — and why.** Not "first line of `rev-list`"
   (underspecified — the 2026-07 F5 finding). Not origin-URL primary
   (mutable, often absent in sandboxes; only used where history cannot be
   trusted, visibly). Not a `git fetch` inside `init` (`FR-X5` permits
   network only on the host-CLI piggyback; unshallowing is the owner's
   external act).

**Dependencies.** Step 4.

**Verification.** `T5-1` (repo-key unit test — full history, shallow with
origin, shallow without origin, no git).

**Impact if wrong.** Systemic within one repo — a wrong key silently splits
data. Mitigated by `status` displaying the key + mode (so a re-init after
external repo changes visibly changes the mode; unrecoverable-by-merge is
covered by AD-20's plain-language "would change keying mode" prompt on
re-init).

---

### Step 6 — JSONL fault channel + stable fault codes

**What changes.** Create `src/diag/fault_codes.ts` exporting a `const enum
FaultCode` with every code the architecture names, verbatim: `hooks_not_
firing`, `latency_breach`, `store_corrupt`, `index_stale`,
`produced_but_undelivered`, `deny_after_answer_lag`,
`deny_despite_answer_text`, `deny_loop`, `deny_bypass_suspect`,
`catchup_incomplete`, `intake_invalidated`, `rebuild_recovered_nothing`,
`transcript_layout_changed`, `unrecognized_user_entry`, `store_busy`, and
the two Phase-B/C reserved codes `model_path_down` and
`missed_skill_block` (used only by the `status` renderer to say "not yet
measured (Phase B/C)").

Create `src/diag/jsonl.ts` exporting `appendFault(diagnosticsDir: string,
fault: { code: FaultCode; detail: unknown; session?: string })`: writes
one JSON object per line to `<diagnosticsDir>/<session-short>.jsonl`,
opening with `O_APPEND | O_CREAT` (0600), flushing before return. **Direct
file write, not through the store** — a dead store cannot log its own
death, per AD-17.

**Source.** `AD-17` (three surfaces, one source of truth; the JSONL channel
is the fallback for store failure; every code enumerated).

**Why this approach (trivial: mechanical construction from the enumeration
in AD-17). The Source cites AD-17's list; this step transcribes it.

**Dependencies.** Step 4.

**Verification.** `T6-1` (fault code list matches AD-17 enumeration — a
snapshot test whose expected value is the enumeration in the architecture
document, updated only when the architecture explicitly changes it);
`T6-2` (JSONL writer unit test — appends survive a process restart, mode
is `0o600`).

**Impact if wrong.** Diagnostic-only — a broken JSONL writer loses fault
records; the store's `faults` table (Step 10) captures the same signals
for the store-healthy path, so total blindness requires both writers to
fail simultaneously (unlikely; a real bug would show as missing faults in
`status`).

---

### Step 7 — SQL migrations: Phase A project store

**What changes.** Create
`src/stores/migrations/001_phase_a_project.sql` containing every table
AD-4 names for Phase A, verbatim to the abridged schema in AD-4's Decision
block (with column types resolved to their SQL forms). Tables:
`schema_meta`, `files`, `symbols`, `import_edges`, `symbol_refs`,
`test_map`, `commits`, `cochange_pairs`, `landmines`, `invariants`,
`invariant_members`, `human_facts`, `corrections`, `questions`,
`classify_state`, `consumer_state`, `session_log`, `observed_actions`,
`whisper_audit`, `faults`, `fts_symbols`, `fts_paths`. Every knowledge
table carries the provenance block (NOT NULL, CHECK-constrained). The
open-scoped double-open guard is
`CREATE UNIQUE INDEX q_open_dedup ON questions(consumer, content_hash)
WHERE status='open';`. **Do NOT create** `exemplars`, `recipes`,
`env_capabilities`, `deferred_queue`, or Phase-C `genre_state` — AD-4's
uniform table-creation criterion (no table without a same-phase writer)
means those arrive with their writing phase's migration.

Add `src/stores/migration_runner.ts` — reads `schema_meta.schema_version`,
applies numbered migrations in order, records new version. Forward-only
per AD-25.

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
   `exemplars`/`recipes` etc.
4. **What this is NOT — and why.** Not a generic `facts(kind, json)` table
   (`FR-K6` violation, exactly what the provenance CHECK is designed to
   prevent). Not a runtime version comparison at every open (adds latency;
   the migration runner at `init`/`index` open is enough because Phase A
   ships one schema version). Not shipping dormant tables (three prior
   independent findings, applied uniformly per AD-4/AD-5).

**Dependencies.** Steps 3, 6.

**Verification.** `T7-1` (migration applies cleanly on empty store; every
table's STRICT/CHECK constraints reject their negative case; the
open-scoped dedup index rejects a second `open` row for the same
`(consumer, content_hash)` while allowing a re-open after `answered`).

**Impact if wrong.** Systemic — every downstream write goes through these
tables; a missing CHECK re-opens the exact provenance-decay problem AD-4
was designed to prevent. Caught by `T7-1`'s constraint-negative-case
assertions.

---

### Step 8 — SQL migrations: Phase A global store

**What changes.** Create `src/stores/migrations/002_phase_a_global.sql`
with `global_meta`, `whisper_stats`, `tuning`, `lessons` — the four Phase
A tables per AD-5. `global_meta` includes the per-project fold watermarks
(rows keyed `whisper_stats_watermark:<repo-key>`). Do NOT create
`env_capabilities` (Phase B writer). Seed `tuning` with the ship-high
defaults AD-14 names, all marked with `source='architecture_default'` for
audit.

**Source.** `AD-5` (global store schema; per-project watermarks; VACUUM
INTO export; no `env_capabilities` yet); `AD-14` (ship-high default
values).

**Why this approach (trivial: mechanical from AD-5 + AD-14).**

**Dependencies.** Step 7.

**Verification.** `T8-1` (global migration applies cleanly; the four
tables exist and no fifth Phase A table is created; `tuning` seeds match
AD-14's stated defaults).

**Impact if wrong.** Contained — a missing tuning row causes downstream
bar computations to use hard-coded defaults with a diagnostic; caught by
`T8-1`.

---

### Step 9 — DAOs for every Phase A table

**What changes.** One file per DAO in `src/stores/dao/`. Each DAO exposes
prepared-statement-backed methods, all returning typed rows or void. No
DAO does business logic; they wrap statements. Where a DAO writes a
knowledge record, its `create()` method requires provenance parameters
(TypeScript compile-time enforcement) — the DB CHECK is the runtime
enforcement of the same rule. The `whisper_audit` DAO's `append()`
returns the ULID id (Step 41's ULID util) synchronously — Step 15's deny
emitter depends on this being synchronous per AD-8's audit-log-before-emit
ordering.

**Source.** `AD-4`, `AD-5` (schemas); `AD-8` (audit-before-emit ordering
demands synchronous audit append); `FR-X4` (provenance/trust not
launderable).

**Why this approach (Gate 3):**
1. **The decision.** DAOs are thin wrappers over prepared statements; no
   caching layer; every knowledge write requires provenance at the type
   level.
2. **The authoritative standard.** SWE-at-Google Test Doubles chapter
   (real implementations preferred; the DAOs are the real thing, not a
   layer that must be doubled); AD-4 (structural provenance).
3. **Why this standard applies here.** The store is measured at ~2ms per
   round-trip (V8), well inside NF-1; a caching layer would add a source
   of stale reads (the deny path reads `questions` on every event, and a
   stale cache would produce `deny_after_answer_lag` events that are
   actually cache-lag, not transcript-lag). TypeScript provenance
   enforcement is what stops a well-meaning refactor from bypassing the
   DB CHECK.
4. **What this is NOT — and why.** Not an ORM (adds a dependency C-3
   would need to justify; the schema is small and stable). Not async
   DAO methods (blocking `DatabaseSync` is what V8 measures at 2ms; async
   wrappers add scheduler roundtrips for no measurable benefit).

**Dependencies.** Steps 3, 7, 8.

**Verification.** `T9-1` (per-DAO CRUD round-trips against the STRICT
schema; every write-method rejects a missing-provenance call at compile
time — checked by a `test/build/typecheck_provenance.test.ts` that runs
`tsc` against a fixture importing the DAO without provenance and asserts
it fails to compile).

**Impact if wrong.** Contained per DAO — a bug in one DAO surfaces at
`T9-1` for that table and does not corrupt other tables. Systemic risk
sits in the provenance TypeScript enforcement; caught by the
compile-time fixture.

---

### Step 10 — `session_log`, `faults` writers, latency instrumentation

**What changes.** Create `src/diag/session_writer.ts` exporting
`writeSessionEvent(store, {session, consumer, seq, event_type, ts,
latency_ms, candidates_json, outcome, detail_json?})` — a thin wrapper
over the `session_log` DAO that Step 9 built. Create
`src/diag/fault_writer.ts` exporting `recordFault(store, home,
diagnosticsDir, fault)`: writes to the `faults` table AND (mirror) to the
JSONL channel (Step 6). Every handler emission goes through these two
writers; direct DAO access is forbidden by convention (grep test in Step
41).

**Source.** `AD-17` (three surfaces, one source of truth; JSONL is the
store-death fallback); `FR-M1`, `FR-M2`.

**Why this approach (Gate 3):**
1. **The decision.** Mirror-write faults to both surfaces so the handler
   need not decide which is up; the mirror lets `status` render from the
   store when healthy and `log --tail` still reveal recent faults if the
   store is corrupt.
2. **The authoritative standard.** `AD-17` (architecture); ISO/IEC 25010
   reliability (fault tolerance).
3. **Why this standard applies here.** `store_corrupt` is a fault whose
   detector is "any prepared statement fails at the event path" — the
   detector itself cannot write to the store it just observed failing.
   Mirror-write closes the loop.
4. **What this is NOT — and why.** Not JSONL-only (would lose the
   relational query surface `status` uses). Not store-only (loses the
   `store_corrupt` self-report path). Not synchronous with a shared
   lock (adds contention; the two writes race and both are idempotent by
   ULID key).

**Dependencies.** Steps 6, 9.

**Verification.** `T10-1` (a `store_corrupt` induction — corrupt the
store file byte 0 — surfaces on the JSONL channel with the fault code
and detail); `T10-2` (session log latency instrumentation records within
±1ms of `performance.now()` deltas).

**Impact if wrong.** Diagnostic — a broken session writer loses per-event
records; caught by `T10-1`/`T10-2` and by absence in `status`.

---

### Step 11 — Security: redactor, injection-suspect flagger

**What changes.** Create `src/security/redact.ts` exporting
`redact(input: string): { redacted: string; count: number }` — pattern
rules for known secret shapes (AWS-style keys, GitHub PATs, JWTs, PEM
blocks, `KEY=value` credential forms) plus a high-entropy-token
heuristic (Shannon entropy > threshold, minimum length). Replacements
use the stable marker `[redacted:<kind>]`. Create
`src/security/injection.ts` exporting `isSuspect(input: string): boolean`
— heuristic lexicon (imperative verbs directed at "the AI"/"the assistant",
`ignore previous instructions`-class phrases, common jailbreak markers).
`src/security/trust.ts` exposes helpers for the CHECK-constrained trust
label ('untrusted_repo' | 'human' | 'mechanical').

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

**Dependencies.** Step 9.

**Verification.** `T11-1` (redact positive cases — AWS/GitHub/JWT/PEM
patterns replaced), `T11-2` (redact negative cases — normal code text
untouched), `T11-3` (`isSuspect` positive cases — known injection
payloads flagged), `T11-4` (`isSuspect` negative cases — normal
prose/code not flagged), `T11-5` (the trust helper type-narrowing
enforces the DB CHECK's set at compile time).

**Impact if wrong.** Systemic — a redaction miss leaks a secret to the
store/log; a false-positive over-redacts and degrades whisper quality
(visible in corrections). The pointer-only property (Step 27) bounds
whisper-side leakage independently.

---

### Step 12 — Transcript reader: JSONL tail, entry adapter, markers

**What changes.** Create `src/transcript/locate.ts` — reads
`transcript_path` from the hook input (V4/V5), returns the resolved
absolute path. Phase A **reads main-consumer transcripts only** (AD-11);
the file also records `agent_transcript_path` from `SubagentStop` inputs
for later phases but never opens them in Phase A.

Create `src/transcript/reader.ts` exporting `TranscriptReader`:
- `readFrom(path, offset)`: opens the file at `offset`, reads to EOF,
  parses one JSON object per newline-delimited line, tolerating a
  partial trailing line by leaving its bytes for the next event (returns
  the byte offset up to which parsing succeeded).
- `discriminateEntry(entry)`: returns `{kind: 'human'} | {kind:
  'assistant_text', text: string} | {kind: 'skip', reason: 'meta' |
  'task_notification' | 'tool_result' | 'thinking_only' | 'tool_use_only'
  | 'unknown_shape'}`. **Human-turn discrimination is by markers, never
  by content shape** (V12): `origin.kind === 'human'` AND `isMeta !==
  true`. A marker-absent string-content user entry returns
  `{kind:'skip', reason:'unknown_shape'}` — the reader records this and
  the handler raises `unrecognized_user_entry`.
- On any structural parse failure (unknown shape where a known one is
  required), throws a typed error the handler catches and records as
  `transcript_layout_changed`.

**Source.** `AD-11` (bookmarked JSONL tail; version-guarded adapter;
marker-based discrimination); V12 (verified 2026-08-29: three kinds of
string-content `user` entries beside list-content tool results; genuine
human-turn markers are mode-dependent).

**Why this approach (Gate 3):**
1. **The decision.** Marker-based discrimination is the ONLY mechanism
   for classifying a user entry as human; a marker-absent string entry
   is `unrecognized_user_entry`, never guessed as human.
2. **The authoritative standard.** `AD-11` (architecture); V12
   (measurement of a real transcript containing injected turns).
3. **Why this standard applies here.** The deny path reads
   qa-state that this reader populates. If a hook-feedback entry or a
   task notification is misclassified as a human turn, it opens a
   question and drives a wrongful deny — exactly the T2 injection
   surface the marker discipline closes. V12 shows string-content user
   entries come in three kinds; the marker distinguishes them.
4. **What this is NOT — and why.** Not a content-shape discriminator
   ("string content = human" would let hook feedback drive a deny —
   the T2 exposure the design closes). Not `last_assistant_message`-
   only (that field is Stop-only per V1; the PreToolUse clear-axis
   needs the file). Not a live-tail watcher (`FR-O5` bars timer paths;
   the bookmark advances only on hook-fired events).

**Dependencies.** Steps 6, 9.

**Verification.** `T12-1` (reader fixture tests: partial trailing line
tolerated across two reads; hook-feedback / task-notification /
marker-absent string entries return `skip` with the right reason; a
tool-result list-content entry returns `skip`; an unknown structural
shape throws the typed error). `T12-2` (V12 replay: the enumeration
counts from the real transcript match the reader's discrimination
counts).

**Impact if wrong.** Systemic to the deny path — a discrimination bug
directly drives wrongful denies (over-fire) or missed intake (under-fire).
The FR-M2 `unrecognized_user_entry` and `transcript_layout_changed`
faults surface breakage; over-fire also caught by AC-2c's over-fire
fixture.

---

### Step 13 — QA state DAO + Phase B seam

**What changes.** Create `src/qa/state.ts` exporting the DAO with the
exact interface Phase B's model-maintained writer will implement:
- `openQuestion(store, {consumer, questionText, contentHash, askedUuid?,
  askedOffset?}): QuestionId` — inserts into `questions` with status
  `open`; the open-scoped dedup index (Step 7) prevents double-open.
- `getOpenQuestions(store, consumer): Question[]` — the READ interface
  the deny path calls. **This function's signature is the Phase B seam
  and does not change.**
- `answerQuestions(store, consumer, closedByUuid, closedByKind):
  answered_count` — bulk-close all currently-open for the consumer to
  `answered` with the given `closed_by_kind`
  (`'generic_text_all_prior'`).
- `voidQuestion(store, questionId, reason: 'intake_invalidated'):
  void`.
- `expireOnStartup(store, consumer): void` — used by `startup`/`clear`
  handling (AD-9).
- `advanceBookmark(store, consumer, offset, uuid): void`, `getBookmark
  (store, consumer): { offset, uuid } | null`.

**Source.** `AD-9` (the Phase B seam: Phase B replaces `classify.ts`;
`state.ts`'s read interface is unchanged); the Question intake rule.

**Why this approach (Gate 3):**
1. **The decision.** The DAO is the seam; every deny-path read goes
   through `getOpenQuestions`. Phase B's writer replaces `classify.ts`
   below, not this file.
2. **The authoritative standard.** `AD-9` (Phase B seam decision); ISO
   25010 maintainability (modularity, replaceability).
3. **Why this standard applies here.** `§11.5` says explicitly: "the
   model updates the *cached* state between actions; the `PreToolUse`
   deny stays synchronous, reading that cached state." The cached state
   IS the `questions` table plus `classify_state`; the seam is exactly
   that interface.
4. **What this is NOT — and why.** Not a "generic KV" seam (would defeat
   the STRICT+CHECK provenance property of AD-4). Not an in-memory
   cache above the DAO (would introduce staleness between processes —
   the no-daemon topology already makes the store the shared state).

**Dependencies.** Step 9.

**Verification.** `T13-1` (DAO round-trips; open-scoped dedup at
DB-level; concurrent-open safety: two concurrent `openQuestion` calls
with the same `(consumer, content_hash)` result in exactly one `open`
row — the second gets a `UNIQUE` constraint failure and its caller
either raises a fault or backfills the existing row).

**Impact if wrong.** Systemic to the deny path — a bug in the DAO
directly drives wrongful denies or missed opens. Caught by `T13-1`.

---

### Step 14 — QA classifiers (question, clear, move recognizers)

**What changes.** Create `src/qa/classify.ts` exporting three
recognizers, deliberately conservative:
- `recognizeQuestion(text, stoplist)`: returns `{ isQuestion: boolean;
  contentHash: string; matchedStopword?: string }`. A sentence is a
  question when (i) it ends with `?`, (ii) it is outside code fences and
  quoted blocks, (iii) it is not matched by the `lexicon.stoplist`
  (tunable, seeded with rhetorical/idiom phrases at Step 8). Multiple
  questions in one turn produce multiple recognizer results.
- `recognizeClearing(assistantText, deferralStoplist, lengthFloor)`:
  returns `{ clears: boolean; reason?: 'below_length_floor' |
  'deferral_matched' }`. A turn clears when its substance length (after
  stripping tool noise: `<thinking>` etc.) is above the length floor
  AND it is not a recognized content-free deferral
  (`lexicon.deferral_stoplist`).
- `recognizeMove(toolName)`: returns `true` when the tool is in the
  deny-eligible set `{'Write', 'Edit', 'NotebookEdit'}`, else `false`.
  **Nothing else is denied in Phase A** (`D-39`).
The stoplists are read from the `tuning` table at recognizer construction
time.

**Source.** `AD-9` (the three recognizers, deliberate biases); `D-39`
(protected class of answer-directed moves); `D-41` (Phase A is a
conservative recognizer, precision is Phase B); collapse-log 2026-09-04
(no imagined-phrasing classifier; keep the surface minimal).

**Why this approach (Gate 3):**
1. **The decision.** Each recognizer is a small, testable function; the
   move recognizer is a set-membership check; the question recognizer is
   a single interrogative rule; the clear recognizer is length + a
   negative stoplist.
2. **The authoritative standard.** `AD-9` (architecture); `D-41`
   (comprehension judgment is Phase B, not Phase A); collapse-log
   2026-09-04 (goal-loss lesson: no fake completeness).
3. **Why this standard applies here.** The 2026-09-04 collapse was
   *exactly* the elaborated question classifier the recognizer here
   deliberately does NOT build. Every temptation to add lexical
   sophistication ("but what about indirect asks?") is answered by
   `L1` and §11.5 — coverage is measured at exit, not padded in code.
4. **What this is NOT — and why.** Not a question-type classifier (that
   was the abandoned `AD-9` slop). Not a wider deny-eligible move set
   (would strand `Bash` test runs, violating `D-39`). Not a per-
   question clear matcher (Phase B, `AC-2a-ii`).

**Dependencies.** Steps 8, 9.

**Verification.** `T14-1` (question recognizer: `?` inside code fence
skipped; stoplist match skipped; multi-question turn yields multiple
recognitions), `T14-2` (clear recognizer: short answer does not clear;
deferral does not clear; substantive answer clears), `T14-3` (move
recognizer: exactly `Write`/`Edit`/`NotebookEdit` return true; every
other tool name — including `Bash`, `Task`, `Read`, `Grep`, `Glob`,
`WebFetch`, MCP tool names — returns false).

**Impact if wrong.** Systemic to the deny path. Over-strict question
recognizer opens too many rows → over-denies; under-strict opens too
few → under-denies. Both surface via AC-2c fixtures (§12). Move
recognizer widening beyond `Write`/`Edit`/`NotebookEdit` is caught by
`T14-3` explicitly asserting every other tool returns false.

---

### Step 15 — Deny verdict: the single producer (AD-10)

**What changes.** Create `src/blocks/verdict.ts` — the ONLY file that
constructs a `permissionDecision: "deny"` field. Exports:
- `type DenyVerdict = { readonly kind: 'deny'; readonly reason: string;
  readonly audit_id: string }`.
- `emit(verdict: DenyVerdict): HookResponse` — the ONLY function that
  places `permissionDecision` into a response.

Create `test/unit/verdict_confinement.test.ts` (AC-2's structural
assertion, made mechanical): walks the compiled `dist/` output and
asserts no file except `blocks/verdict.ts` contains the string literal
`"permissionDecision"` OR the identifier `emit` imported from another
file. This runs in CI (Step 1's workflow) and fails the PR on any
second caller path.

The response type in `src/types/verdict.ts` deliberately does NOT expose
`updatedInput` or `updatedToolOutput` — `FR-B3`'s no-mutation clause is
unrepresentable.

**Source.** `AD-10` (deny confinement: one producer, structurally);
`FR-B3` (no mutation); `AC-2` (the structural assertion this test
mechanises).

**Why this approach (Gate 3):**
1. **The decision.** One file constructs the deny; one function emits
   it; a build-output grep enforces the property.
2. **The authoritative standard.** `AD-10` (architecture); ISO/IEC
   25010 analysability (single import-graph verification of a critical
   property); collapse-log 2026-08-25 (an absolute silently broken by
   a second use of the primitive).
3. **Why this standard applies here.** "Exactly two blocks" is an
   absolute over a mechanism; the collapse-log lesson says: enumerate
   and confine structurally, not by convention. The CI-run grep against
   built output catches what source lint misses.
4. **What this is NOT — and why.** Not a runtime flag check per genre
   (convention, not structure). Not a source-only lint (the built
   output is the ground truth). Not a wider verdict type (adding
   `updatedInput` in the type but "not using it" would be exactly the
   FR-B3 violation surface the type-level exclusion eliminates).

**Dependencies.** Steps 3, 9, 10.

**Verification.** `T15-1` (compile-time: `updatedInput` and
`updatedToolOutput` are absent from every response-related type — a
`typecheck_verdict_shape.test.ts` fixture asserts this fails to
compile if attempted); `T15-2` (`verdict_confinement.test.ts`
runtime: build `dist/`, grep for `permissionDecision`, assert only
`dist/blocks/verdict.js` matches).

**Impact if wrong.** Systemic and owner-visible — a second deny caller
violates `FR-B1`'s "exactly two blocks" absolute in a way owner
inspection would not catch (the deny surfaces the same to the agent no
matter where it came from). Caught by `T15-2` in CI on every PR.

---

### Step 16 — Answer-drift block: intake + catch-up + block decision

**What changes.** Create `src/blocks/answer_drift.ts` exposing:
- `intakeFromPrompt(store, consumer, promptText)`: run
  `recognizeQuestion` on the `UserPromptSubmit.prompt` text; for each
  question, `openQuestion` (Step 13) with `askedUuid`/`askedOffset`
  null (backfilled at reconciliation) and provenance `human` /
  `chat:<date>` / `trust='human'`.
- `catchUpTranscript(store, home, consumer, transcriptPath)`: read
  from bookmark to EOF via `TranscriptReader` (Step 12); for each
  yielded entry, run the reader's `discriminateEntry`; on `human`
  reconcile against existing intake rows by `content_hash` (backfill
  `asked_uuid`/`asked_offset`); on `assistant_text` run
  `recognizeClearing`, and if it clears call `answerQuestions(store,
  consumer, entry.uuid, 'generic_text_all_prior')`; on `skip` with
  reason `unknown_shape` record `unrecognized_user_entry`; on marker-
  present non-human matching an intake row, `voidQuestion(store, id,
  'intake_invalidated')` and record the fault. Advance the bookmark.
- `decideDeny(store, consumer, toolName, currentTranscriptState):
  DenyVerdict | null`. If `consumer !== 'main'` return null
  (`FR-O6`, `AC-2a-i` allow-half). If no `open` questions exist,
  return null. If `recognizeMove(toolName) === false`, return null.
  Else compose the reason from open questions' texts and return a
  `DenyVerdict` — audit-log first via `whisper_audit.append` (Step 9),
  then return the verdict for the handler to emit.

**Source.** `AD-9` (state, recognizers, deny decision, main-consumer
scope); `AD-8` (audit-before-emit); `FR-B1`, `FR-B2`, `FR-O6`,
`AC-2a-i` (subagent not denied).

**Why this approach (Gate 3):**
1. **The decision.** Intake reads the `prompt` field so the row exists
   before the agent's first move (V5 confirms `UserPromptSubmit.prompt`
   is present); catch-up runs between intake and the block check per
   AD-8's fixed order; the deny is scoped to the main consumer with a
   structural early-return.
2. **The authoritative standard.** `AD-9` (architecture, all
   mechanisms); V1 (transcript async lag — the reason intake reads the
   prompt directly rather than waiting on the file); V5 (prompt
   field verified); `FR-O6` (per-consumer scope).
3. **Why this standard applies here.** OL-C5 says the block fires
   "after Max asks a question" — the moment is `UserPromptSubmit`, not
   later; reading the prompt field is the ONLY way to know the row
   exists before the agent moves. The main-consumer scope is what
   AC-2a-i's allow-half asserts.
4. **What this is NOT — and why.** Not a transcript-only intake (the
   transcript may lag past the agent's first PreToolUse, wrongly
   holding no state on the very first move). Not a subagent-scoped
   deny (a subagent never received Max's question — `AC-2a-i` allow-
   half). Not a wider protected-class carve-out (`D-39`: reads,
   searches, and test/build runs are the protected class; broadening
   the deny-eligible set would strand answer-directed work).

**Dependencies.** Steps 12, 13, 14, 15, 9.

**Verification.** `T16-1` (intake from prompt: a question in the
prompt string opens a row with the right content_hash), `T16-2`
(catch-up reconciliation: an intake row backfills its
`asked_uuid`/`asked_offset` when a matching human turn appears),
`T16-3` (deny decision main-scoped: with an open question and the tool
`Edit`, returns a verdict; with tool `Read`, returns null; with
consumer 'sub-abc', returns null). AC-2a's plumbing assertions map to
this step's Verification (§12 AC-2a).

**Impact if wrong.** Systemic to the deny path. Over-fire (wrongfully
holding after a clear) is caught by the AC-2c over-fire fixture;
under-fire (missed intake) surfaces via the human channel + the AC-8a
Stop-time backstop.

---

### Step 17 — Lag-window hold on the clear-axis (D-41)

**What changes.** Update `decideDeny` (Step 16) to implement the
lag-window hold: when the bookmark shows the transcript has not yet
been read past the newest expected assistant text turn (approximated
by: the last thing recognized in catch-up was a `PreToolUse` on the
main consumer's transcript from this same batch, i.e. the bookmark
position is < the transcript file size), the block **holds rather than
pre-clears** — that is, absent an already-classified `answered` for
the open question set, the block continues to deny. **The hold governs
the clear-axis only** — the deny-eligible tool set does not widen in
the lag window; answer-directed moves (Read, Grep, Bash) still run
freely.

Add `detectLagFault` post-emission: if a subsequent catch-up
classifies a `generic_text_all_prior` clearing turn whose transcript
timestamp precedes an already-emitted deny for the same consumer,
record `deny_after_answer_lag` (Step 10).

**Source.** `AD-9` (lag-window hold, clear-axis only); `D-41`
(comprehension judgment phased); `FR-B1` lag clause; V1 (transcript
async lag is documented, not assumed).

**Why this approach (Gate 3):**
1. **The decision.** Hold on the clear-axis in the lag window; never
   widen the deny-eligible set; make the wrongful lag-hold self-
   recover on the next event and surface via a self-detected fault.
2. **The authoritative standard.** `AD-9`; V1 (documented lag).
3. **Why this standard applies here.** A wrongful hold self-recovers
   in one round-trip (the classifier catches up, the next move is
   allowed) while a missed drifter does not — the asymmetry in
   `FR-B5`'s cost function chooses the direction.
4. **What this is NOT — and why.** Not "widen the eligible set during
   lag" (would strand answer-directed work). Not "pre-clear on any
   incomplete read" (would let a drifting agent slip through by
   racing intake).

**Dependencies.** Step 16.

**Verification.** `T17-1` (lag hold: with an unclassified newest text
turn, an `Edit` is denied; then catch-up classifies the turn as
clearing, and the next `Edit` is allowed — the lag hold self-
recovered), `T17-2` (`deny_after_answer_lag` induction: a
transcript-timestamped answer precedes an already-recorded deny;
the next catch-up records the fault).

**Impact if wrong.** Under-fire (a lag pre-clear lets a drifter
through — invisible without the human channel) OR over-fire (a hold
that never releases — visible to the owner via `deny_loop`).

---

### Step 18 — Deny health detectors and diagnostics

**What changes.** Create `src/blocks/health.ts` exposing detectors
called after every deny emission (Step 16) and every catch-up (Step
17):
- `checkDenyLoop(store, consumer)`: count ≥ 3 consecutive
  `whisper_audit.kind='deny'` rows for the consumer with no
  intervening assistant text → record `deny_loop`.
- `checkDenyDespiteAnswerText(store, consumer, threshold)`: count
  denies since the newest open question, minus assistant text turns
  that failed the length-floor but are NOT in the deferral stoplist;
  ≥ N (tunable, default 3) → record `deny_despite_answer_text`.
- `checkDenyBypassSuspect(store, consumer, event)`: called on
  PostToolUse rows for Bash file-writing commands (predicate: `>`,
  `>>`, `tee`, `sed -i`, `perl -i`, `cp`, `mv`, `install` writing to
  a path); if a same-turn `whisper_audit.kind='deny'` exists whose
  `evidence_json` records a target path that matches the Bash
  command's target → record `deny_bypass_suspect`.

**Source.** `AD-9` (deny-loop, deny-bypass-suspect, and the two
`deny_after_answer_lag`/`deny_despite_answer_text` detectors);
`FR-M2`; `AC-9`; L3 (Bash-drift residual owned via the diagnostic).

**Why this approach (Gate 3):**
1. **The decision.** Every FR-M2 axis for the deny mechanism has a
   named detector; both directions of the deny recognizer's error
   (over-fire / under-fire) have observability.
2. **The authoritative standard.** `AD-9`, `AD-17`; `FR-M2`
   ("classes with a stable code and a detector"); `AC-9` (each
   fault class induced).
3. **Why this standard applies here.** The block is the one Phase A
   mechanism that halts an agent; without detectors on both error
   directions, the collapse-log 2026-09-04 "looked like it worked"
   trap would re-appear at runtime (a silent under-fire looks like
   silence-is-golden).
4. **What this is NOT — and why.** Not a runtime disable path
   (a wrongful-deny recognizer should surface, not switch itself
   off — `FR-L3b`, the anti-ratchet). Not silent tolerance of the
   Bash bypass (the diagnostic is the honest floor, per L3; a
   Phase B model has the surface area to disambiguate).

**Dependencies.** Steps 16, 17.

**Verification.** `T18-1` (each detector induced and asserted to
record its fault; corresponds to AC-9's "deny outlives its
condition" clause).

**Impact if wrong.** Diagnostic-only — a broken detector silently
degrades observability, caught by `T18-1`'s induction.

---

### Step 19 — Question lifetime + SessionStart source handling

**What changes.** In `answer_drift.ts` add
`handleSessionStart(store, home, consumer, sourceValue)` per
V5's enumeration:
- `startup` or `clear` → `expireOnStartup(store, consumer)`
  (marks prior `open` rows as `expired`); reset bookmark to `null`.
- `resume`, `fork`, `compact` → reset bookmark to offset 0 and let
  the next catch-up rebuild qa-state from the transcript. If the
  next catch-up scans a non-empty transcript, recognises **zero**
  human turns, and emitted `unrecognized_user_entry` diagnostics,
  raise `rebuild_recovered_nothing` (per AD-9's marker-less-mode
  disclosure, L11 (a)).

Do NOT change qa-state on `SessionEnd`. Add the Stop-time
outstanding-question line (AC-8a): at `Stop`, if the Step 26
done-claim recognizer fires AND `getOpenQuestions(store, consumer)`
returns a non-empty set, append the outstanding-question text as an
extra line on the composed Stop-time whisper (Step 31 handles the
delivery channel).

**Source.** `AD-9` (Question lifetime across session boundaries;
`AC-8a` outstanding-question line, best-effort backstop); V5
(SessionStart.source enumeration).

**Why this approach (Gate 3):**
1. **The decision.** Session boundaries are handled per `D-20` /
   V5's enumeration; `SessionEnd` does not expire questions; the
   Stop-time line is added when both conservative recognizers fire.
2. **The authoritative standard.** `AD-9`; `D-20`; V5.
3. **Why this standard applies here.** The `resume`/`fork`/`compact`
   distinction is what makes the conversation-continues semantic
   correct: state rebuilt from offset 0 mirrors the fresh-classify
   the model-writer will do in Phase B, so the seam holds.
4. **What this is NOT — and why.** Not a per-source silent policy
   (would hide `rebuild_recovered_nothing` in marker-less modes,
   losing the L11 disclosure). Not a Stop-time block (`FR-B4`: this
   is delivery, not enforcement — `AC-8a`).

**Dependencies.** Steps 16, 17, 18.

**Verification.** `T19-1` (session start `startup`: prior open rows
become `expired`), `T19-2` (session start `resume`: state
rebuilds from transcript; if all human turns lack markers,
`rebuild_recovered_nothing` fires; if markers are present, rows
open), `T19-3` (AC-8a: Stop-time whisper carries the outstanding
question when the done-claim recognizer fires AND open questions
exist; carries nothing when either is absent).

**Impact if wrong.** Under-fire — a `resume` that misses a still-open
question silently drops it; guarded by `rebuild_recovered_nothing`
(surfaces to owner) and the L11 build-time verification (Step 40).

---

### Step 20 — Co-change miner (AD-13)

**What changes.** Create `src/miner/cochange.ts` exposing
`mineCochange(store, repoPath, opts)` — reads `schema_meta.
last_mined_commit` watermark; runs `git log --no-merges --numstat -M
--format=%H%x00%at%x00 <watermark>..HEAD` streamed line-by-line;
per commit: records the commit in `commits` with `entity_count`,
excludes if `entity_count > opts.maxTransactionEntities` (default 30,
tunable via `tuning`); for included commits, generates all
canonical-ordered file pairs from the touched-file set, accumulates
`cochange_pairs` counts (with `INSERT ... ON CONFLICT DO UPDATE`).
Records recency via `last_ts` per pair. Detects history rewrite
(watermark hash not reachable from HEAD) → full re-mine + diagnostic
fault. Corpus floor: only report pairs when total non-excluded
commits ≥ opts.corpusFloor (default 30, tunable).

**Source.** `AD-13` (miner: git log stream, hygiene filters, canonical
pairs, watermark); `FR-K2` (hygiene); `FR-A6` (corpus floor, no
adoption window).

**Why this approach (Gate 3):**
1. **The decision.** Stream `git log` line-by-line; hygiene as hard
   filters recorded in `commits.excluded`; corpus floor is
   evidentiary, not session-based.
2. **The authoritative standard.** `AD-13`; `FR-K2` (spec-stated
   hygiene items with their own sources — MSR/HERZIG);
   Zimmermann et al. TSE 31(6) 2005 (ROSE) for the pair-count
   confidence model.
3. **Why this standard applies here.** Merge commits inject tangled
   changes (HERZIG); >30-entity transactions are refactor sweeps that
   dilute signal (ROSE-adjacent); the watermark is what keeps
   incremental refresh cheap.
4. **What this is NOT — and why.** Not per-commit transaction lists
   as the query model (unbounded storage, aggregation at lookup).
   Not association-rule mining at query time (hook-path budget). Not
   recency pruning (the spec chose horizon-cap; pruning deletes
   evidence).

**Dependencies.** Steps 7, 9.

**Verification.** `T20-1` (miner run against a fixture repo with
planted merge/large-transaction/beyond-horizon commits; exclusions
recorded with their reasons; the planted non-obvious coupling pair
appears in `cochange_pairs` with the expected count).

**Impact if wrong.** Contained to history genres — a broken miner
starves Coupling, Consequence, Completeness, and Warning genres of
evidence (they stay silent, `FR-A6`).

---

### Step 21 — Structural indexer skeleton and LanguageFrontend interface

**What changes.** Create `src/index/frontend.ts` — the
`LanguageFrontend` interface:
```ts
interface LanguageFrontend {
  readonly lang: string;
  parse(path: string, content: Buffer):
    { symbols: Symbol[]; imports: ImportEdge[] };
}
```
Create `src/index/indexer.ts` — the orchestrator:
- `runIndex(store, repoPath, {full: boolean})`: walks the working
  tree respecting `.gitignore`; per file, resolves language via the
  ext→grammar config (defaults + overrides from `tuning`); calls the
  matching frontend or `generic_frontend` fallback; writes `files`,
  `symbols`, `import_edges`, updates `symbol_refs` counts by joining
  imports and identifier-appearances; classifies `zone` per AD-12
  (marker comments in head 2KB, dist/build/lockfile patterns,
  `.gitignore` membership, `vendor/`/`node_modules/`); computes
  `entry_score` (in-degree from `import_edges` + path-marker points
  for `main`, `index`, `cli`, `app`, and route-registration
  patterns); files > 1MB or > 20k lines are indexed path-only with
  the diagnostic. Redacts every ingested string via Step 11.
- `refreshIfStale(store, repoPath)`: compares `schema_meta.
  index_head` to `git rev-parse HEAD`; on drift, spawn a detached
  `ctxoracle index` child with `CTXORACLE_INTERNAL=1` and a directory
  lock in the store dir.

**Source.** `AD-12` (indexer: LanguageFrontend, WASM grammars,
generic fallback, zone, entry_score, incremental refresh).

**Why this approach (Gate 3):**
1. **The decision.** Interface-first so the tree-sitter frontend and
   the generic fallback are peers; incremental refresh via
   content-hash + `index_head` watermark; staleness merely lowers
   confidence (never blocks).
2. **The authoritative standard.** `AD-12`; `FR-K1` (language-
   agnostic seam); `C-6` (broad and extensible, no fixed list); OWASP
   ASVS 5.0 V5 (File Handling) for the size caps.
3. **Why this standard applies here.** Everything the event path
   serves is precomputed here (`NF-1`), and the seam is what makes
   adding a language a config change.
4. **What this is NOT — and why.** Not per-language hard-coded
   pipelines (C-6 violation). Not "all files parsed regardless of
   size" (V5 governs; the caps prevent a 100MB generated file from
   blowing the indexer).

**Dependencies.** Steps 7, 9, 11.

**Verification.** `T21-1` (indexer skeleton runs on a small fixture
repo; `files`/`symbols`/`import_edges` populate; large-file caps
respected; redaction applied at ingress).

**Impact if wrong.** Contained per genre — a broken indexer starves
Orientation, Reuse, Coupling; visible in `status` per-genre counts.

---

### Step 22 — tree-sitter frontend + generic fallback

**What changes.** Create `src/index/tree_sitter_frontend.ts`
implementing `LanguageFrontend` by loading the appropriate WASM
grammar from `tree-sitter-wasms/out/<lang>.wasm` (path resolved
dynamically), parsing via `web-tree-sitter`, extracting symbols via
tree-sitter queries per language. Grammar loading is lazy per
`(lang, first-use)` and cached; parser instances are pooled per lang.

Create `src/index/generic_frontend.ts` — line-based heuristics:
identifier-shape regexes for definitions (function keywords, class
keywords, `def`/`fn`/`function` etc.), path-and-word tokenization
into FTS. **`import_edges` and `symbol_refs` are NOT produced by the
generic frontend** — this is what makes a generic-frontend candidate
`structurally uncountable` in the Reuse dominance test (Step 25).

**Source.** `AD-12`; V14 (web-tree-sitter 0.26.13, tree-sitter-wasms
0.1.13 verified; latest 0.27.0 for `web-tree-sitter` verified
2026-09-06 — the plan floors at 0.26.13 per §3).

**Why this approach (Gate 3):**
1. **The decision.** Tree-sitter frontend where a grammar exists; a
   deliberately-weaker generic fallback for everything else so no
   language is invisible.
2. **The authoritative standard.** `AD-12` (architecture);
   `web-tree-sitter` official API (Parser, Language, Tree).
3. **Why this standard applies here.** The generic frontend's
   inability to produce `import_edges` is a *feature*, not a bug —
   it forces the Reuse crown to abstain on incomparable sets (L6,
   AC-1b mixed-language case).
4. **What this is NOT — and why.** Not a native tree-sitter binding
   (would violate C-3). Not TypeScript compiler API (single-
   language). Not a regex-only frontend as primary (false symbols
   poison pointers — P4 violation).

**Dependencies.** Step 21.

**Verification.** `T22-1` (tree-sitter frontend parses a small
TypeScript fixture, emits symbols with correct spans and imports
resolving to correct files), `T22-2` (generic frontend runs on a
`.sh` file, emits function-shape symbols but zero `import_edges`).

**Impact if wrong.** Contained per language — a broken frontend
falls back to generic (visible in `status` per-language counts).

---

### Step 23 — Tuning DAO + defaults seeding (AD-14 substrate)

**What changes.** Create `src/stores/dao/tuning.ts` with:
- `get(store, key): string | null`
- `set(store, key, value, source)`
- `list(store, prefix?)`: for lexicon keys (list-valued), reads all
  rows sharing the key.
- `addToList(store, key, value, source)` / `removeFromList(store,
  key, value)`.

Seed the following defaults (verified against AD-14 and AD-9):
- `bar.confidence_floor` = "0.6"
- `bar.support_min` = "3"
- `bar.noise_floor_support_min` = "2"
- `bar.impact_read_min_coupled` = "2"
- `bar.reuse_dominance_k` = "3"
- `lexicon.stoplist` (list): rhetorical/idiom seeds
- `lexicon.deferral_stoplist` (list): "I'll get to that"-class seeds
- `lexicon.command_class_test_runners` (list): `npm test`, `pytest`,
  `cargo test`, `go test`, `jest`, `mocha`, `vitest`, ...
- `lexicon.command_class_innocuous` (list): `ls`, `cd`, `cat`, `git
  status`, `grep`, `rg`, ...
- `lexicon.completion_claim` (list): "done", "complete",
  "implemented", "fixed", "finished"...
- `deny.despite_answer_text_threshold` = "3"

**Source.** `AD-14` (bar defaults); `AD-9` (stoplists);
`AD-15` (command_class lexicons); AD-20 (`tune` writer).

**Why this approach (trivial: seeding from architecture-named
defaults).**

**Dependencies.** Steps 8, 9.

**Verification.** `T23-1` (defaults present after migration; list
keys queryable; `tune` verb round-trips a set/list mutation).

**Impact if wrong.** Contained — missing defaults surface via bar
computations using fallback constants with diagnostic warnings.

---

### Step 24 — The bar (AD-14 combinator)

**What changes.** Create `src/bar/combinator.ts` exporting
`passesBar(candidate: Candidate, tuning: TuningReader):
{ passes: boolean; failedAxis?: 'confidence'|'impact'|'marginal' }`.
Implements the three-axis **conjunction** (no multiplication).
Confidence uses per-fact-class computation (mined: support +
ROSE-confidence + staleness/recency dampening + trust cap; human:
constant-high). Decision-impact is deterministic ordinal from
per-candidate properties only (edit-context vs read-context, blast-
radius band, zone criticality) — carries NO genre term and NO intent
term (`D-18`). Marginal value is defined for all three Phase A fact
classes per AD-14 (single-file current-state fails; cross-file
history-derived passes by construction; cross-file current-state
passes only when comparative/aggregative — Reuse). Hazard-path
candidates (Warning genre) skip the confidence floor and require
only the noise floor.

**Source.** `AD-14` (the bar as conjunction of floors, no caps,
hazard bypass); `FR-A5`, `FR-A5a`; `OL-C1` (no volume/budget); `D-18`
(no intent term in impact).

**Why this approach (Gate 3):**
1. **The decision.** Conjunction, not product; hazard bypass on the
   confidence floor only; defaults from `tuning` so calibration is a
   `tune` operation, not a recompile.
2. **The authoritative standard.** `AD-14`; `FR-A5` (conjunction);
   `OL-C1` (no caps).
3. **Why this standard applies here.** A multiplicative score
   launders a low axis (2026-08-16 collapse); the conjunction is
   what makes each axis a floor and each axis's failure visible.
4. **What this is NOT — and why.** Not a top-k selector (`OL-C1`).
   Not a learned bar in Phase A (`D-12`). Not a precision floor on
   hazards (`OL-C4`).

**Dependencies.** Step 23.

**Verification.** `T24-1` (each axis failure returns the correct
`failedAxis`; a two-candidate event with both passing returns two
passes — AC-3 no-cap; a hazard candidate below `bar.confidence_floor`
still passes when above the noise floor — AC-3a).

**Impact if wrong.** Systemic to whisper output — a broken bar over-
or under-fires every genre. Caught by AC-3, AC-3a, AC-4, AC-6
fixtures in §12.

---

### Step 25 — Genre modules (the seven Phase A generators)

**What changes.** Create seven files in `src/genres/`, each
implementing `Generator`:
```ts
interface Generator {
  readonly genre: string;
  readonly triggerEvents: EventKind[];
  candidates(ctx: EventContext, store: Store): Candidate[];
}
```
Per genre:
- `orientation.ts` (FR-A2a, `UserPromptSubmit`): tokenize prompt,
  FTS5-query `symbols`/`paths`, rank by (match strength × co-change
  hub degree × `entry_score`), select top 2–4 entry-point files;
  join `invariant_members` for one binding invariant IF one exists
  for a matched file. Marginal-value guarantee: entry-point ranking
  is cross-file aggregative.
- `coupling.ts` (FR-A2b, `PostToolUse` Read/Grep/Glob): look up
  `cochange_pairs` partners of the touched file above the bar;
  headline = partner + ratio + commit pointer.
- `reuse.ts` (FR-A2c, `PostToolUse` Grep/Glob functionality search):
  FTS-match the searched term against `symbols`; group by kind;
  for each candidate compute `symbol_refs.ref_count`; if any
  candidate is a generic-frontend language → **incomparable set**,
  return silence; else if dominance k× holds → return the crown +
  runner-up + reference count + kind + same-name / string caveat.
- `consequence.ts` (FR-A2d, `PreToolUse` Edit/Write): coupled test
  files of the target (join `cochange_pairs` with `test_map`); zone
  flag; return only the coupled-tests + zone headline (never a raw
  call-site count).
- `warning.ts` (FR-A2e, `PreToolUse` Edit/Write): `landmines` rows
  for target with evidence and **flagged confidence** (FR-A5a).
- `completeness.ts` (FR-A2f, `Stop`): session's edited files from
  `observed_actions` (outcome='ok' only per AD-4 filter) → un-edited
  partners above ratio floor.
- `verification.ts` (FR-A2g, `Stop` with done-claim): changed
  regions → `test_map` covering tests; subtract test runs from
  `observed_actions` command_class; ship the covering-test **mapping**
  as the headline, plus the run-state clause (never run-state alone).

Also in this file: `src/genres/verification.ts` includes the
done-claim recognizer — deterministic lexicon from
`lexicon.completion_claim` against `last_assistant_message` (Stop
input, V1), conservative bias (no match → ordinary stop, no whisper).

Every candidate carries ≥ 1 verifiable pointer; at compose time
(Step 30) the pointer is re-resolved (rumor rule, FR-D1).

**Source.** `AD-15` (per-genre queries, headlines, marginal-value
guarantees); `FR-A2a`–`FR-A2g`, `FR-D1`–`FR-D5`, `P5`.

**Why this approach (Gate 3):**
1. **The decision.** One module per genre; each carries its P5
   marginal-value guarantee as its own testable column; the
   Reuse-incomparable-set silence is structural.
2. **The authoritative standard.** `AD-15`; `FR-A2a`–`FR-A2g`;
   `P5`; `D-26` (Orientation delivers entry points, not landmines);
   `D-38` (done-claim recognizer errs toward silence).
3. **Why this standard applies here.** Per-genre P5 guarantees are
   what make each AC-1b/1c/1d fixture assertion mechanical; the
   Reuse incomparability structural silence is what closes the L6
   mixed-language false-crown risk.
4. **What this is NOT — and why.** Not a shared "interesting facts"
   scorer that genres filter (blurs P5 per-genre guarantee). Not
   narration-triggered genres (Phase B). Not landmine mining via
   ML.

**Dependencies.** Steps 20, 21, 22, 23, 24, 9.

**Verification.** `T25-1` through `T25-7` (one per genre —
per-genre unit tests + AC-1..AC-1d fixture assertions in §12).

**Impact if wrong.** Contained per genre; each per-AC fixture pins
its headline.

---

### Step 26 — Command class classifier (AD-15 supporting)

**What changes.** Create `src/genres/command_class.ts` exposing
`classifyBashCommand(command: string, testRunnerLexicon: string[],
innocuousLexicon: string[]): { class: 1|2|3; segments: SegmentClass[]
}`. Per AD-15: split on `&&`, `;`, `|`, `||` **quote-aware**
(operators inside quotes are not split points; a subshell `sh -c` or
quoting error → class 3 wholesale). Per segment: class 1 if the
head matches a test-runner (with the run target extracted where
possible); class 2 if EVERY segment's head is in the innocuous list;
class 3 otherwise (unknown). Segments contribute independently to
the Step 25 `verification` genre's run-state computation.

**Source.** `AD-15` (ternary classifier; per-segment; the weaker
"no *recognized* test run" claim ships for class 3).

**Why this approach (Gate 3):**
1. **The decision.** Ternary with class 3 as the default (any
   unclassified segment); the weaker honest claim ships for class 3
   (never the strong "not run").
2. **The authoritative standard.** `AD-15` — the alternative (a
   partial classifier with an unstated default) has the unsafe
   direction: it re-admits the false "not run" — exactly what the
   ternary + weaker-claim discipline is designed to prevent.
3. **Why this standard applies here.** AC-8's content assertion
   requires the covering-test mapping to headline; the weaker claim
   keeps the genre alive while never asserting "not run" over a
   run-state the classifier does not know.
4. **What this is NOT — and why.** Not "head-only classification"
   (`cd pkg && npm test` composes both — segments matter). Not a
   full shell parser (complexity for no benefit — quoted or
   subshell wrappers land safely in class 3).

**Dependencies.** Steps 23, 9.

**Verification.** `T26-1` (positive classifications for each
lexicon), `T26-2` (compound: `cd pkg && npm test` — class 2+1
composition; `npm test && make integration` — subtraction + weak
claim; a quoted `"npm test"` → class 3 wholesale; a subshell → class
3 wholesale).

**Impact if wrong.** Contained to verification whisper — a
misclassification lands on the weak claim (safe under-detection).

---

### Step 27 — Compose + audit-log-then-emit

**What changes.** Create `src/hook/compose.ts` — takes a passing
`Candidate` and renders the whisper text: `[oracle]` prefix + genre
tag + pointer(s) + evidence ratio (for history-derived) + confidence
flag (`FR-D1`, when not high). **Pointer-only composition (AD-19,
Phase A):** no verbatim repo-derived text; only paths, line spans,
commit hashes, names, and numbers. Rumor-rule check: re-resolve
each pointer at compose time — read the cited `file:span ± slack`
and confirm the fact still holds (`FR-D1`); if not, drop the
candidate with a `whisper_dropped_stale` diagnostic.

Update `handler.ts` (Step 28) to enforce audit-before-emit:
`whisper_audit.append` (which returns synchronously per Step 9) must
succeed before the `additionalContext` is returned; on audit
failure, no whisper is emitted (fail-open).

**Source.** `AD-19` (pointer-only composition in Phase A);
`FR-D1`–`FR-D5` (whisper form, no rumors); `AD-8` (audit-before-
emit ordering); `AD-15` (rumor rule for deferred delivery is Phase
B; Phase A applies the same rule at compose time).

**Why this approach (Gate 3):**
1. **The decision.** Pointer-only; audit-before-emit; the rumor-rule
   re-resolution at compose time is Phase A's guarantee that a
   `file:line` pointer still says what the whisper claims.
2. **The authoritative standard.** `AD-19`; `AD-8`;
   `FR-D1`/`FR-X6` (audit-mandatory); OWASP LLM01 (prompt-injection
   surface removal).
3. **Why this standard applies here.** Verbatim text opens the T1
   surface; Phase A has no model that needs quoted context, so the
   Phase A whispers can be pointer-only and the injection surface
   at the whisper channel is closed by construction.
4. **What this is NOT — and why.** Not "quote a line to give the
   agent context" (Phase B decision). Not async audit (loses
   `FR-X6` guarantee if the process crashes mid-event). Not a
   post-emit rumor check (would allow the false whisper to have
   already shipped).

**Dependencies.** Steps 9, 11, 25.

**Verification.** `T27-1` (whisper text validator per `FR-D1`–`FR-D5`
form: prefix, genre, ≥1 pointer, evidence ratio for history genres,
confidence flag when not high, no imperative), `T27-2` (rumor rule:
a candidate whose pointer no longer resolves is dropped with the
diagnostic).

**Impact if wrong.** Direct owner-facing quality issue — a
false-pointer whisper is the checkably-false rumor `FR-D1` bars.
Caught by `T27-1`/`T27-2`.

---

### Step 28 — Handler pipeline order + hook adapter

**What changes.** Create `src/hook/adapter.ts` — the ONLY file that
names Claude Code hook field names (`hook_event_name`,
`session_id`, `agent_id`, `agent_type`, `tool_name`, `tool_input`,
`transcript_path`, `agent_transcript_path`, `prompt`, `source`,
`last_assistant_message`, `stop_hook_active`). Exports
`toInternalEvent(hookJson): InternalEvent` — everything downstream
consumes the typed internal event.

Create `src/hook/handler.ts` — the per-event pipeline in the fixed
order AD-8 mandates:
1. Guard (`CTXORACLE_INTERNAL` set → exit 0). Step 29.
2. Watchdog start (Step 29).
3. Parse stdin JSON → `adapter.toInternalEvent`.
4. Question intake (UserPromptSubmit only; `answer_drift.
   intakeFromPrompt`).
5. Catch-up (`answer_drift.catchUpTranscript`).
6. Block check (`answer_drift.decideDeny`; on deny, audit-log,
   return verdict, exit).
7. Candidate generation (call the Step 25 generators whose
   `triggerEvents` include this event).
8. Bar (Step 24) → passes → compose (Step 27) → audit-log-then-
   emit.
9. Diagnostics (Step 10).

Exit 0 always (AD-7). Any error or watchdog fire ⇒ empty output +
JSONL fault, no deny, no whisper.

**Source.** `AD-6` (hook wiring event map, adapter file); `AD-7`
(fail-open, exit 0 always); `AD-8` (pipeline order load-bearing).

**Why this approach (Gate 3):**
1. **The decision.** One adapter file; fixed pipeline order; exit
   0 always; adapter output is the internal event type — all
   downstream code names internal fields only.
2. **The authoritative standard.** `AD-6`, `AD-7`, `AD-8`; V1–V6,
   V15, V16, V19 (verified hook contract facts).
3. **Why this standard applies here.** The adapter file is what
   makes a future hooks-contract adaptation a single-file change.
   The pipeline order is the difference between a deny reading
   fresh state vs stale state (catch-up before block check is
   required).
4. **What this is NOT — and why.** Not async pipeline steps
   (loses the audit-before-emit guarantee if a process crash lands
   between emit and audit-write). Not multi-file field naming
   (would sprawl the CC contract dependency across the codebase).
   Not error output to stderr (would be agent-visible; AD-7 fail-
   silent).

**Dependencies.** Steps 3, 6, 9, 10, 12–19, 24, 25, 27.

**Verification.** `T28-1` (pipeline order enforced: a
`PreToolUse` event triggers catch-up before block check — asserted
by fixture that would produce different outcomes on reversed
order), `T28-2` (adapter is the only file naming CC fields — grep
test), `T28-3` (any thrown error in any pipeline step produces
empty stdout + a JSONL fault; exit code 0).

**Impact if wrong.** Systemic — every hook event goes through the
handler; ordering bugs directly affect deny correctness. Caught by
`T28-1` and by AC-2a fixtures.

---

### Step 29 — Watchdog + recursion guard

**What changes.** Create `src/hook/watchdog.ts` — cooperative
deadline (2500ms). Handler code calls `deadline.check()` between
bounded work slices (per AD-23's inventory: after catch-up, before
candidate generation, between genres, before compose, before audit
write). On deadline fire: raise `latency_breach`, return empty
output.

Create `src/hook/guard.ts` — checked first: if
`process.env.CTXORACLE_INTERNAL === '1'`, print nothing, exit 0.
All processes the oracle spawns (reindex, future model calls) set
this env var (AD-21).

Update the wired hook commands (via Step 30's `init`) to set
`"timeout": 5` (seconds) so the harness watchdog is above the
cooperative one, keeping fail-open-with-diagnostic reachable.

**Source.** `AD-23` (cooperative watchdog + blocking-call
inventory); `AD-21` (recursion guard, `CTXORACLE_INTERNAL`); V6
(hook timeout semantics).

**Why this approach (Gate 3):**
1. **The decision.** Cooperative deadline + explicit inventory;
   recursion guard first, before any work.
2. **The authoritative standard.** `AD-23`; V6 (timed-out
   PreToolUse prevents tool from running — fail-closed hazard the
   watchdog margin avoids).
3. **Why this standard applies here.** A JS timer cannot preempt
   a blocked event loop; only the cooperative discipline plus the
   inventory of blocking calls with their bounds actually delivers
   the deadline. The recursion guard first is what makes a future
   model-piggyback safe.
4. **What this is NOT — and why.** Not `setTimeout` + `process.
   exit` (the timer never fires on a blocked loop). Not harness-
   timeout-only (V6 fail-closed hazard). Not "exit on first
   error" without the guard first (would recurse on hook events
   from the oracle's own child processes).

**Dependencies.** Steps 6, 28.

**Verification.** `T29-1` (a synthetic long-running step trips
the watchdog and emits `latency_breach`; exit 0), `T29-2`
(`CTXORACLE_INTERNAL=1` short-circuits to exit 0 with no output).

**Impact if wrong.** Systemic — a broken watchdog reintroduces
the V6 fail-closed hazard (PreToolUse hangs the tool). Caught by
`T29-1` + AC-10 in §12.

---

### Step 30 — Delivery: per-consumer dedup, session-boundary reconciliation, Stop-time channel

**What changes.** Create `src/hook/delivery.ts`:
- `perConsumerDedup(store, consumer, candidate): boolean`: check
  `consumer_state` (kind='delivered' or 'read') for `subjectKey`;
  reject on hit.
- `handleSessionStart(store, consumer, source)`: per V5 —
  `startup`/`clear` → clear both sets; `resume`/`fork` → reseed
  (kept); `compact` → clear `read`, keep `delivered`.
- `updateReadSet(store, consumer, observedActions)`: on
  `PostToolUse` with outcome='ok' add subjects (path, symbol) to
  `read`.
- `deliverStop(hookResponse, whisperText)`: places whisper via
  `hookSpecificOutput.additionalContext`; if `stop_hook_active` is
  true, delivers nothing (single-cycle bound, V3).

**Source.** `AD-16` (delivery + dedup + session-boundary
reconciliation + Stop-time additionalContext); `FR-A4`, `FR-D5`,
`FR-O6`, `FR-B4`, `D-20`; V3, V5.

**Why this approach (Gate 3):**
1. **The decision.** Per-consumer sets in the store (survive process
   boundaries per AD-1); Stop-time single-cycle via
   `stop_hook_active` check (not a counter).
2. **The authoritative standard.** `AD-16`; `FR-A4`; V3.
3. **Why this standard applies here.** No-daemon topology (AD-1)
   means state must live in the store; `stop_hook_active` is the
   documented single-cycle bound (V3).
4. **What this is NOT — and why.** Not a session-wide shared dedup
   (starves subagents — `FR-O6`). Not `decision:"block"` at Stop
   (surfaces as error — V3, `FR-B4`). Not a time-window suppression
   (a cap in disguise; `OL-C1`).

**Dependencies.** Steps 9, 19.

**Verification.** `T30-1` (per-consumer dedup: same subject
returned once per consumer, `resume`/`fork` reseed, `compact`
clears read but not delivered), `T30-2` (Stop-time delivery: first
Stop event delivers; second stop with `stop_hook_active` delivers
nothing).

**Impact if wrong.** Repeat whispers (annoying), missed dedup
after session boundary (visible), stop-cycle blowup (`stop_hook_
active` bounded by the harness at 8 continuations regardless).

---

### Step 31 — CLI dispatch + `init` verb

**What changes.** Create `src/cli.ts` — verb dispatcher (yargs-free
manual switch to keep the dependency count at 2). Verbs:
`init`, `deinit`, `index`, `status`, `log`, `correct`, `note`,
`tune`, `export`, `import`, `hook <event>` (internal, undocumented
in `--help`).

Implement `init` (`src/cli/init.ts`):
1. Run `assertRuntime()` (Step 2), `probeFts5` (Step 2). On failure
   print plain-language error + exit 1.
2. `resolveRepoKey` (Step 5). If a prior store exists at a different
   `keying_mode`, print a plain-language warning and offer the
   `export`/`import` migration path before proceeding.
3. `ensureLayout` (Step 4). Open project store; apply migration 001
   (Step 7). Open global store; apply migration 002 (Step 8);
   seed defaults (Step 23) if empty.
4. Write hook entries into `<repoPath>/.claude/settings.json` for
   the 8 events per AD-6, each marked with `"ctxoracle"` in a comment
   or a marker field, `"command": "ctxoracle hook <event>"`,
   `"timeout": 5`. Idempotent — repeated init re-repairs wiring
   without duplicating markers.
5. Run first `index` (Step 32).
6. Print plain-language summary: repo key, keying mode, files
   indexed, tables ready.

**Source.** `AD-20` (init spec: environment checks, key derivation,
plain-language on re-init keying-mode change, hook wiring, first
index); `AD-6` (event wiring map, `.claude/settings.json` as the
settings location); `D-9` (init is the one in-tree write).

**Why this approach (Gate 3):**
1. **The decision.** Idempotent init; marker-based wiring so
   `deinit` removes exactly what was added; keying-mode change
   surfaces plain-language before it silently orphans the store.
2. **The authoritative standard.** `AD-20`; `D-9`; current
   Claude Code settings docs (fetched 2026-08-29 per AD-6).
3. **Why this standard applies here.** A non-programmer owner
   (`OL-11`) needs plain-language on every failure and every
   destructive change; idempotency lets a re-run repair wiring
   without side-effects.
4. **What this is NOT — and why.** Not a wizard (extra ceremony,
   `P3`). Not a full config editor (tuning is `tune`, not init).
   Not blocking on missing FTS5 (falls back to LIKE with `status`
   note, per AD-2).

**Dependencies.** Steps 2, 4, 5, 7, 8, 23, 32 (first-index invocation).

**Verification.** `T31-1` (init on a fresh repo: settings.json
receives 8 marked entries, stores created at 0700, first index
runs), `T31-2` (idempotent: re-init leaves settings.json unchanged
except for restored missing entries), `T31-3` (keying-mode change:
warning printed before proceeding).

**Impact if wrong.** Owner-facing — a broken init blocks all use.
Loud failures are OK (owner sees them); silent misbehavior (wrong
key, orphaned store) is the risk `T31-3` guards.

---

### Step 32 — `deinit`, `index`, `hook`, `export`, `import` verbs

**What changes.**
- `deinit`: remove marker-tagged entries from
  `.claude/settings.json`; on `--purge`, delete the project store
  and its diagnostics directory.
- `index [--full]`: call `runIndex` (Step 21); with `--full`
  re-mine from scratch; otherwise incremental.
- `hook <event>`: the handler entry point (Step 28) — routes stdin
  JSON to the pipeline. Undocumented in `--help`.
- `export <file>` / `import <file>`: `VACUUM INTO` for both stores
  to/from a single archive (tar? — plan: two files `project.db`
  and `global.db` in a directory-path or a `.tar` archive; the
  simpler choice is a directory the user names). AD-5 specifies
  `VACUUM INTO` per store (V17).

**Source.** `AD-20` (verbs); `AD-5` (export/import via VACUUM INTO
and record-identical, per AC-19); `AD-12`, `AD-13` (index runs both
structural and miner).

**Why this approach (trivial for `deinit`, `hook`, `index`;
non-trivial for `export`/`import` — Gate 3 below):**

Non-trivial (export/import):
1. **The decision.** `VACUUM INTO` per store into a user-named
   directory (two files, one per store) — record-identical
   round-trip is the AC-19 requirement (not byte-identical, which
   `VACUUM INTO` does not guarantee).
2. **The authoritative standard.** `AD-5`; `AC-19`; V17 (executed:
   `VACUUM INTO` round-trips data on `node:sqlite`).
3. **Why this standard applies here.** `FR-K9` requires
   export/import round-trip; record-identical is what AC-19
   asserts (a canonical-order per-table dump equals before and
   after). `VACUUM INTO` is the engine-level path with no
   version dependence (works from before v22.16.0's `backup()` API).
4. **What this is NOT — and why.** Not `.backup()` API (only
   exists from v22.16.0 — matches the floor, but choosing the
   version-agnostic mechanism keeps the export operation
   independent of the floor). Not a JSON export (loses STRICT
   constraints on import; would violate AD-4's structural
   provenance).

**Dependencies.** Steps 3, 5, 20, 21, 28.

**Verification.** `T32-1` (deinit removes exactly marker-tagged
entries; `--purge` removes the store), `T32-2` (export/import
record-identical: dump both stores before, export, import into
fresh location, dump, diff — zero rows differ).

**Impact if wrong.** Owner recovery is the main risk on
export/import — mitigated by `T32-2`'s record-identical check.

---

### Step 33 — `status`, `log`, `tune` verbs

**What changes.**
- `status`: FR-M4 renderer — plain-language dump of per-genre
  volume, false-fire rate (from `corrections`), regret rate
  labelled "held-but-unspoken only" and paired with last
  seeded-coverage result (from AC-18 exit run) or "coverage not
  measured live", denies issued, wrongful-deny rate,
  done-claims-with-outstanding-question with the Phase A
  structural-limit label, `deny_loop` and `deny_bypass_suspect`
  signals, active suppressing conditions (store corrupt,
  transcript layout changed, FTS fallback), correct-silence
  announcement (FR-M3, owner-facing only), repo key + keying mode
  (Step 5), invariant count, and — for Phase B/C-reserved codes
  (`model_path_down`, `missed_skill_block`) — "not yet measured
  (Phase B/C)" **never** rendered as 0. Reads from `session_log`,
  `whisper_audit`, `faults`, `corrections`, `tuning`, `whisper_
  stats`.
- `log [--session <id>]`: FR-M5 renderer — chronological
  `whisper_audit` rows with evidence and pointers.
- `tune <key> [<value>|+<value>|-<value>]`: reads/writes `tuning`
  (Step 23); with no args, lists all keys, current values, and
  defaults.

**Source.** `AD-17` (three surfaces, plain language, correct-silence
rendered only here per D-22); `AD-20` (CLI verbs); `FR-M4`, `FR-M5`,
`FR-M3`.

**Why this approach (Gate 3):**
1. **The decision.** All owner metrics rendered plain-language;
   phase-deferred metrics rendered "not yet measured" rather than
   as 0; every suppressing condition surfaced.
2. **The authoritative standard.** `AD-17`; `OL-10` (owner cannot
   catch silent failures); `OL-11` (plain-language required).
3. **Why this standard applies here.** "Never display absence of
   measurement as health" (AD-17 generalisation) is what stops the
   owner from reading a Phase-B-reserved 0 as safety.
4. **What this is NOT — and why.** Not a JSON dump (owner is
   non-programmer). Not raw numbers without labels (regret without
   its "held-but-unspoken only" label is exactly the miss AD-17
   guards against).

**Dependencies.** Steps 9, 10, 23.

**Verification.** `T33-1` (`status` renders every FR-M4 signal;
Phase-B-reserved codes show as "not yet measured"), `T33-2` (`log`
renders per-session; evidence/pointers included), `T33-3` (`tune`
round-trips scalar and list values).

**Impact if wrong.** Owner-blind — a broken `status` is exactly the
FR-M2 failure `OL-10` was raised to prevent. Caught by `T33-1`.

---

### Step 34 — `correct` verb + `--missed-question` routing

**What changes.** Implement `correct` (`src/cli/correct.ts`):
- `ctxoracle correct <whisper-or-deny-id> --verdict
  (false_fire|missed|confirm) [--note "<text>"]`: writes a row to
  `corrections` with `whisper_id` or `deny_id` and the verdict.
- `--missed-question "<text>"` variant: routes the text through
  `recognizeQuestion` (Step 14) **without** the `?` requirement
  (Max may paraphrase); if it produces a non-empty question,
  `openQuestion(store, 'main', text, contentHash, null, null,
  provenance='human', trust='human')`. On hash collision with an
  already-`open` row, print plain-language: "the row already exists
  and is armed" (intake coverage limit) OR "a Bash-drift miss stays
  un-deniable per L3" (move coverage limit) — never imply
  enforcement changed when it did not.

**Source.** `AD-18` (human channel `FR-D4`/`FR-L6`; `--missed-question`
routed through the classifier); L3 (Bash-drift disclosure);
`AC-2c` under-fire clause.

**Why this approach (Gate 3):**
1. **The decision.** The CLI writes provenance-human rows with
   trust='human'; the missed-question path uses the same
   recognizer as intake (single truth source).
2. **The authoritative standard.** `AD-18`; `FR-L6` (human
   statements are first-class facts); `AC-23` (human correction
   outranks mined inference).
3. **Why this standard applies here.** `FR-B5`'s answer-drift
   under-fire guard IS the human channel — a missed drift becomes
   a deniable deviation only when this verb records the miss and
   the identical deviation is thereafter denied. The classifier
   sharing enforces consistency.
4. **What this is NOT — and why.** Not a policy engine (would be
   a Phase C move — `FR-L3`/`FR-L3b`). Not silent-fix (the
   collision-cases plain-language message is exactly the L3
   disclosure).

**Dependencies.** Steps 14, 9, 33.

**Verification.** `T34-1` (correct verdict recorded; wrongful-deny
rate in `status` updates), `T34-2` (`--missed-question`: verbatim
re-open works; collision plain-language message shows the correct
limit).

**Impact if wrong.** Human channel broken — the answer-drift
under-fire guard fails silently. Caught by `T34-2`.

---

### Step 35 — `note` verb + fact routing

**What changes.** Implement `note`:
- `ctxoracle note "<fact>" [--file <path>] [--kind
  (landmine|invariant|target_correction)]`: writes to `human_facts`
  in the project store (per `FR-L7`), or to `landmines`/`invariants`
  when kind is set. Provenance human, trust human.
- `ctxoracle note --global "<lesson>" [--evidence <text>]`: writes
  to `lessons` in the global store (`FR-L7` cross-project routing).

**Source.** `AD-18` (`note` verb, global routing); `AD-5` (global
store `lessons` table); `FR-L6`, `FR-L7`; `AC-23`.

**Why this approach (Gate 3):**
1. **The decision.** Two routes (project vs global) via a `--global`
   flag; project store is the default per FR-L7.
2. **The authoritative standard.** `AD-18`; `FR-L7` (repo facts →
   project, efficacy → global; lessons cross-project → global).
3. **Why this standard applies here.** Cross-project lessons must
   survive project re-clones; repo-specific facts must travel with
   the repo store.
4. **What this is NOT — and why.** Not a single-store dump (loses
   FR-L7's routing). Not a config file (two sources of truth).

**Dependencies.** Steps 8, 9, 11.

**Verification.** `T35-1` (project `note` lands in `human_facts`
and outranks a conflicting mined inference at query time), `T35-2`
(global `note` lands in `lessons`).

**Impact if wrong.** Contained per store — a wrong route sends the
fact to the wrong place (visible when the fact fails to surface).

---

### Step 36 — Regret proxy at SessionEnd + `index` refresh

**What changes.** Create `src/human/regret.ts`:
- `emitRegretAtSessionEnd(store, session)`: iterate `whisper_audit`
  candidates that did NOT ship in this session (bar-fail or dedup);
  for each held fact whose subject region was re-edited/reverted in
  the session (from `observed_actions` outcome='ok' — Edit/Write
  rows, per AD-4's split filter) OR whose covering test failed
  (from `observed_actions` outcome='failed' — command class 1 rows,
  the failure clause fed by `PostToolUseFailure`), AND the churn is
  plausibly relevant (Phase A test: the churned file is the fact's
  subject or its direct pair partner), record a regret row.
- Also called from `runIndex` refresh (Step 21) so a between-
  session regret catches revert-based re-edits.

**Source.** `AD-18` (regret proxy — outcome semantics per AD-4
consumer filter; Phase A test = subject or direct pair partner);
`FR-L4` (measure false silence); `D-36`; `AC-24`.

**Why this approach (Gate 3):**
1. **The decision.** Deterministic proxy at SessionEnd + index
   refresh; plausible-relevance test bounded to subject / direct
   partner in Phase A (a more nuanced test is Phase B).
2. **The authoritative standard.** `AD-18`; `FR-L4`; `D-36`
   (silence-is-costlier asymmetry is a mission-derived judgment).
3. **Why this standard applies here.** Without regret the loop
   converges to silence and reads healthy — the failure `D-36`
   describes; `FR-L4` requires existence, the proxy is architect's,
   AD-18 defines the Phase A one.
4. **What this is NOT — and why.** Not an uptake judge (`D-12`).
   Not automated demotion input (Phase C). Not coverage
   measurement (that's AC-18 seeded-coverage).

**Dependencies.** Steps 9, 21.

**Verification.** `T36-1` (AC-24 TP: held fact whose region was
re-edited → regret row; AC-24 no-inflate: churn unrelated to the
fact → no regret row).

**Impact if wrong.** Silent metric drift — a broken regret proxy
under-reports (silence-is-fine surface returns) or over-reports
(diagnostic noise, non-gating per `FR-L4`).

---

### Step 37 — Concurrency: WAL retry-once + directory locks

**What changes.** In `stores/adapter.ts` (Step 3):
- Every write goes through a single-transaction wrapper with
  retry-once on `SQLITE_BUSY`; second failure raises `store_busy`
  fault and returns null (fail-open).
- The `whisper_stats` fold runs inside a single `BEGIN IMMEDIATE`,
  reads its per-project watermark from `global_meta`, aggregates
  audit rows newer than the mark, advances the mark — all in one
  transaction, so two concurrent same-project folds serialize
  correctly (AD-5/AD-26).
- ULID id generation for `whisper_audit`, `corrections`,
  `session_log`, `faults`, and every other timestamped table so
  concurrent writers do not collide.

In `src/index/indexer.ts` (Step 21):
- The detached reindex takes a directory lock via
  `flock`(2) on a file `<home>/projects/<key>/.reindex.lock`;
  the handler never waits on this lock (staleness merely lowers
  confidence).

**Source.** `AD-26` (concurrency: WAL + busy_timeout + retry-once +
BEGIN IMMEDIATE for the fold; ULIDs); `AD-5` (per-project
watermark).

**Why this approach (trivial: mechanical from AD-26).**

**Dependencies.** Steps 3, 21.

**Verification.** `T37-1` (concurrent write on the same store:
one wins the transaction, the other retries once and succeeds;
after that a third contended write fails-open with `store_busy`),
`T37-2` (fold correctness: two concurrent same-project folds do
not double-count).

**Impact if wrong.** Race conditions and silent double-counts in
efficacy stats. Caught by `T37-1`/`T37-2`.

---

### Step 38 — Model invocation seam stub (never called in Phase A)

**What changes.** Create `src/model/invoke.ts` with the interface
Phase B will implement, but every call in Phase A throws or
returns a "not-called-in-phase-a" sentinel:
```ts
export interface ModelInvocation {
  invoke(prompt: string, opts?: {maxTurns?: number}):
    Promise<{ok: true, text: string} | {ok: false, reason: string}>;
}
export const phaseANotImplemented: ModelInvocation = {
  invoke: async () => ({ ok: false, reason: 'phase_a_no_model' }),
};
```
Also record the V9-verified invocation in a comment as the Phase B
target: `claude -p --model <small> --tools "" --max-turns 1
--output-format json` (verified by architecture V9 on 2026-08-29;
--bare is banned per V10).

**Source.** `AD-21` (piggyback seam fixed now, Phase B builds the
probe cache alongside its writer per AD-4's uniform table-creation
criterion).

**Why this approach (Gate 3):**
1. **The decision.** Interface exists so Phase B is additive; every
   Phase A caller of the interface is `phaseANotImplemented` (there
   are no Phase A callers today — the file is a seam, not a
   dependency).
2. **The authoritative standard.** `AD-21`; §11.5 ("the model
   never sits on the deny path" must be structurally true from
   day one).
3. **Why this standard applies here.** Leaving the seam to Phase B
   invites the redesign §11.5 forbids; committing the interface now
   forces the shape.
4. **What this is NOT — and why.** Not a stub that returns fake
   answers (would be exactly the fake-completeness collapse-log
   warns against). Not a probe that runs at Phase A init (no
   caller — nothing to probe).

**Dependencies.** Step 1.

**Verification.** `T38-1` (interface compiles; invoking the Phase
A stub returns `phase_a_no_model`).

**Impact if wrong.** Contained — no Phase A caller, so a bug here
does not affect Phase A behavior; caught at Phase B by then.

---

### Step 39 — Unit test suites for every recognizer, bar, redactor, repo-key, reader

**What changes.** Populate `test/unit/*.test.ts` per §5.1 with
`node:test` test files. Each covers its module per the Test
specifications in §12 (T*-* IDs).

**Source.** `AD-24` (unit tier: recognizers, bar, redactor,
repo-key, reader — the enumerated set); testing-standards.md
(SWE-at-Google: real implementations preferred; interaction
testing only where the interaction IS the behavior).

**Why this approach (Gate 3):**
1. **The decision.** Real implementations wherever possible (the
   store engine is 2ms per V8 — cheaper to run real than to mock
   and less risky); the only double is `TranscriptReader`'s file
   input, and even that uses a real temp file, not a mock.
2. **The authoritative standard.** SWE-at-Google Unit Testing +
   Test Doubles chapter; `references/testing-standards.md`
   (Meszaros taxonomy — every double named by kind).
3. **Why this standard applies here.** V8 measured store cost at
   2ms; mocking the store to save 2ms adds a mock that itself
   needs testing (Testing the mock anti-pattern). The temp-file
   real implementation for reader tests removes the doubled-
   subject anti-pattern.
4. **What this is NOT — and why.** Not "assert the mock was
   called" (interaction assertions — testing-standards Fake-Test
   #1). Not backward-fabricated data (data comes from real
   schemas via migrations — Fake-Test #3). Not tests that cannot
   fail (every T*-* names its failure condition in §12).

**Dependencies.** Steps 3, 9, 11, 12, 14, 22, 24, 26.

**Verification.** All T*-* unit tests in §12 pass under
`node --test test/unit/**/*.test.ts`.

**Impact if wrong.** Coverage theater. Every fixture that could
detect the failure the test does not is a missing coverage entry
in §14 Question register bin 1.

---

### Step 40 — Fixture repo generators + replay harness + build-time verifications

**What changes.** Create `test/fixtures/repos/` with generators
that build git repositories with planted history for every AC
per AD-24's list (§5.1 fixture inventory). Generators are
deterministic (fixed seed) and produce real git repositories
(not mocks — see AD-24: "not mocks of the store — the real
engine is 2ms").

Create `test/replay/runner.ts`: reads a captured hook JSON stream
from `hook_stream_fixtures/*.jsonl`, invokes the built handler
binary via `spawn` per event, records the response, asserts per-
event outcome.

Create build-time verification tasks:
- `test/build_time/grammar_inventory_check.ts` (L6): runs `npm
  pack --dry-run` on `tree-sitter-wasms`, enumerates shipped
  `.wasm` grammar files, asserts every language in the ext→grammar
  default table has a matching grammar.
- `test/build_time/real_transcript_marker_probe.md` (L11 (a)):
  owner-run instructions to capture an interactive transcript
  from Max Cogar's real environment and run the marker-presence
  probe; the doc records what to look for and where to send the
  probe result.
- `test/build_time/user_prompt_submit_provenance.md` (L11 (b)):
  owner-run steps to induce a platform-injected turn (task
  notification, scheduled wake) and observe whether
  `UserPromptSubmit` fires.

**Source.** `AD-24` (fixtures + replay + build-time
verifications); L11 (both).

**Why this approach (Gate 3):**
1. **The decision.** Real git repos + spawned real handler binary
   for replay; two of the three build-time verifications are
   owner-run because the runtime environment cannot generate them
   from inside a container.
2. **The authoritative standard.** `AD-24`; testing-standards
   (real implementations preferred; the doubled-subject
   anti-pattern is avoided by using the real handler binary).
3. **Why this standard applies here.** A replay against a mocked
   handler tests the mock; the whole point of the fixture tier
   is to catch handler bugs.
4. **What this is NOT — and why.** Not in-process handler calls
   (loses the process-boundary contract — AD-1's whole point).
   Not synthetic hook JSON that skips the adapter (bypasses the
   one CC-field-name file — AD-6). Not skipping the owner-run
   verifications because "the container cannot" (the disclosure
   L11 makes and this step schedules is the honest replacement).

**Dependencies.** Steps 1, 28 (handler must build to be spawn-
able), 22 (grammar frontend).

**Verification.** `T40-*` (each fixture asserts its AC — full
mapping in §12); the two owner-run verifications produce
markdown reports that update AD-24's L11 disclosure into
"verified/measured" or "confirmed unavailable in mode X" — a
result recorded in a follow-up documentation PR after the build
lands.

**Impact if wrong.** The acceptance suite is what proves Phase A
correct; a broken fixture undercuts every AC that depends on it.

---

### Step 41 — Additional convention checks (grep tests)

**What changes.** Create `test/conventions/`:
- `no_direct_dao_from_handler.test.ts`: greps `dist/hook/*.js` for
  direct DAO imports, asserts they all go through the writers
  (Step 10) — the diag mirror-write property.
- `hook_field_names_isolated.test.ts`: greps every `dist/**/*.js`
  outside `dist/hook/adapter.js` for CC hook field names
  (`hook_event_name`, `tool_input`, `transcript_path`, etc.);
  asserts no match — AD-6's one-file discipline.
- `permission_decision_confined.test.ts`: extends Step 15's test
  to also grep imports of `blocks/verdict.ts` — only
  `blocks/answer_drift.ts` (and, in Phase C, the skill block)
  may import.

**Source.** `AD-10` (structural confinement generalises); `AD-6`
(adapter isolation).

**Why this approach (trivial: mechanical from AD-6/AD-10).**

**Dependencies.** Steps 15, 28.

**Verification.** `T41-1` (all three convention tests fail on a
seeded violation and pass on the current codebase).

**Impact if wrong.** Convention drift over time — the checks
are what keep AD-6's / AD-10's structural properties true through
refactors.

---

### Step 42 — Exit run: discovery-mode replay on real repos

**What changes.** Create `scripts/exit-run.sh`:
1. Enumerate a small set of Max Cogar's real repositories (this
   one `Maxcogar/agent-armory` at minimum; owner supplies others
   via a `.ctxoracle-exit-repos` file).
2. For each: `ctxoracle init`, `ctxoracle index --full`; then
   replay one or more captured hook streams from Max's real
   sessions on the repo (an alternative: run the tool against a
   fresh interactive session and instrument).
3. Also run the AC-18 seeded-facts fixture — a rich planted
   coupling + planted landmine — to measure delivered coverage.
4. Emit `docs/reviews/<date>-phase-a-exit-run.md`: per-genre
   whisper counts, block counts, false-fire rate (from any owner
   `correct` verdicts made during the run), wrongful-deny rate,
   regret rate paired with seeded-coverage, denies issued, active
   suppressing conditions, and — **the honest floor number Max
   Cogar reads** — how much the conservative answer-drift
   recognizer catches on real data.

**Source.** `§11.5` Phase A exit ("Exits by producing measured
whisper/block + false-fire and regret data on a real repo —
including how little the conservative recognizer catches");
`docs/IDEAS.md` #14 (discovery-mode replay); AC-18 (seeded-fact
coverage).

**Why this approach (Gate 3):**
1. **The decision.** Real-repo run + seeded fixture, together;
   the exit report reads both numbers.
2. **The authoritative standard.** `§11.5`; `AC-18`;
   `docs/collapse-log.md` 2026-09-04 (the standing warning
   against padding coverage instead of measuring it).
3. **Why this standard applies here.** The 2026-09-04 collapse
   is precisely what happens when Phase A ships a padded number
   instead of measuring the floor; the exit report format is the
   collapse-log's lesson made procedural.
4. **What this is NOT — and why.** Not "run on synthetic data and
   report" (would be exactly the fake-completeness the collapse-
   log names). Not "hide low numbers" (a low answer-drift
   coverage IS the honest deliverable of Phase A — Phase B
   raises it).

**Dependencies.** Steps 31–37 (functioning CLI + full pipeline).

**Verification.** The exit report exists and contains every
required metric; `status` shows the same numbers; the seeded-
coverage number matches what AC-18 asserts.

**Impact if wrong.** Direct — a padded exit report poisons the
data Phase B and the AC-24 regression fixtures are designed
from. This is the collapse-log's standing warning.

---

### Step 43 — Post-completion housekeeping

**What changes.**
- Add a pointer to the new package from `middleware/context-
  oracle/README.md` (if one exists at repo root) or create a
  minimal one; do NOT create a project-wide `README.md` if none
  exists (no unrequested files, per `CLAUDE.md`).
- Rewrite `docs/STATUS.md` to reflect Phase A complete; next step
  is Phase B architecture (per lifecycle: architecture is per
  phase, written only when the prior phase has produced the data
  it needs — Phase A's exit run in Step 42 is that data).
- Route any lesson from the build to `docs/collapse-log.md` if it
  generalises (per `CLAUDE.md` policy).

**Source.** `CLAUDE.md` session protocol (session end); the
per-phase lifecycle rule.

**Why this approach (trivial: routine post-completion).**

**Dependencies.** Step 42.

**Verification.** `T43-1` (STATUS.md rewritten with the new state
and next step; the check-tooling passes on the new STATUS).

**Impact if wrong.** Cosmetic; caught by CI check-docs.

---

## 8. Divergences from existing patterns

None. This plan introduces a new component tree; no existing pattern in
`middleware/context-oracle/` is diverged from (there is no code there yet —
architecture `L8`). The plan intentionally does **not** clone patterns from
the sibling projects `middleware/codebase-context-compiler/`, `middleware/
codebase-context-compiler-sandbox/`, or `middleware/Gemini-context-compiler/`
— those are archived read-only reference and are dead per `CLAUDE.md` ("The
retired `ctxpack` design is dead").

The one deliberate divergence *from* precedent — the no-daemon topology
that inverts the 2026-07 whole-scope architecture record's warm-service
design — is not a divergence from a currently-authoritative pattern; the
2026-07 record is marked historical, and the divergence is documented at
AD-1 with its evidence (V8: 45–54ms cold spawn against a 1500ms budget).

---

## 9. Checkpoints

Triggers per Step 10 of the expert-plan skill (foundation corrections;
integration points where separately-built pieces connect; irreversible
steps; structural-to-behavioral transitions):

- **After Step 9 (DAOs) — Checkpoint 1: schema integrity.** Run every
  DAO's constraint-negative tests (`T9-1`). This is the boundary between
  the store substrate and every downstream write path — a bug here
  corrupts every subsequent step's data. Owner-visible sanity check:
  `sqlite3 <store.db> ".schema"` shows every Phase A table with STRICT
  and every CHECK constraint.

- **After Step 19 (answer-drift block) — Checkpoint 2: the deny path
  works and is confined.** Run every AC-2* fixture (`T15-2`, T16-1..3,
  T17-1..2, T18-1, T19-1..3). This is the highest-risk correctness
  boundary — the deny path halts an agent, and its Phase A safe-
  skeleton shape is exactly what the 2026-09-04 collapse warned about
  building padded. Owner-visible check: `ctxoracle status` shows the
  answer-drift block as active and reports its metrics under their
  labels.

- **After Step 30 (delivery) — Checkpoint 3: the pipeline is complete.**
  Run every Phase A whisper-genre AC (AC-1..AC-1d, AC-3, AC-3a, AC-4,
  AC-5, AC-6, AC-8, AC-8a, AC-9 selective, AC-10, AC-13, AC-14, AC-15,
  AC-17, AC-22). This is the boundary between component construction
  and orchestrated behavior. Owner-visible check: a hand-driven session
  on a small fixture repo produces whispers that match the spec's
  headline requirements per genre.

- **After Step 40 (fixture suite complete) — Checkpoint 4:
  acceptance-set complete before exit run.** Every AC in the Phase A
  set passes on fixtures. Boundary before the irreversible act of
  running on Max Cogar's real repos and publishing the exit report
  (which becomes the Phase B design input).

- **After Step 42 (exit run) — Checkpoint 5: honest exit measurement.**
  The exit report is reviewed against the §11.5 requirement — measured
  coverage (not padded), false-fire rate, wrongful-deny rate, regret,
  seeded-fact coverage. If the answer-drift coverage number reads
  suspiciously *high* for a conservative model-free recognizer, treat
  that as a finding (per collapse-log 2026-09-04) and investigate the
  recognizer — do NOT publish the high number as success.

---

## 10. Decisions made during planning

Judgment calls made during this planning session, with reasoning. The
architecture already made 26 design decisions; the plan makes decisions
about ordering, test approach, verification granularity, and how to
handle a small number of implementation-level choices the architecture
delegated to the plan.

- **D-plan-1 — Build order: foundation → deny path → whisper path → CLI
  → tests → exit run.** *Reasoning.* The deny path is the highest
  correctness risk (an agent-halting mechanism); building it before the
  whisper genres means the block's Phase B seam is exercised before
  code depending on the deny primitive exists (so a wrong seam shape
  surfaces early). The whisper genres depend on the stores and the bar
  but not on the deny path; they build on top of a proven substrate.
  Tests come last per component but earliest per test-tier: unit
  suites are built alongside the modules they cover (Step 39 lists
  them as "populate," not "author for the first time" — the individual
  test files are added as their target module is built), while
  fixture/replay tests aggregate after Step 30. Reasoned without
  Clear Thought MCP (unavailable this session — see §15 Gaps); reasoning
  captured in this entry so the choice is auditable.

- **D-plan-2 — Package deps floor: `web-tree-sitter ^0.26.13`, not
  `^0.27.0`.** *Reasoning.* Architecture V14 verified 0.26.13
  2026-08-29; latest is 0.27.0 (verified via npm registry 2026-09-06 —
  no runtime deps, no install scripts). Choosing `^0.26.13` accepts
  0.27.0 (semver-compatible) but the plan's declared floor stays at
  the architecture-verified version, so a Phase A test-run against the
  architecture's exact-verified surface is always possible via `npm
  install web-tree-sitter@0.26.13`. Bumping the floor to 0.27.0
  requires reading its changelog for behavior changes — a Phase B or
  build-time action, not this plan's.

- **D-plan-3 — Use `node:test` (built into Node ≥22) as the test
  runner.** *Reasoning.* Zero-dependency runner (C-3 preserves); no
  extra install/build surface; native to Node ≥22.16 (the runtime
  floor); parallelism is built in. Alternatives — `jest` (heavy, ESM
  friction), `vitest` (extra dep), `tap` (extra dep) — bring no
  advantage the plan needs and cost a dependency.

- **D-plan-4 — `sqlite3` shell (not a Node script) for AC-19 dump
  comparison.** *Reasoning.* `sqlite3 <db> .dump | sort` yields a
  canonical text form; comparing two dumps with `diff` is the
  record-identical assertion in the simplest possible form. The
  `sqlite3` CLI is a system tool typically present in Node
  containers; if absent, the test does the same dump via
  `Store.prepare("SELECT * FROM ...")` — either path is testable, and
  the CLI path is preferred when available.

- **D-plan-5 — Fixture repos are generated deterministically from
  scripts, not committed as tarballs.** *Reasoning.* A generator
  script is diffable and its intent is visible; a committed tarball
  is an opaque binary blob. Determinism (fixed seed for commit
  timestamps, author names, content generation) keeps `T20-1` /
  `T25-*` reproducible across environments. AD-24 does not prescribe
  format; the generator approach is a judgment consistent with
  testing-standards ("data comes from the real schema via
  migrations, from named fixtures representing realistic states, or
  from generators with stated properties").

- **D-plan-6 — Build-time verifications for L11 (marker presence,
  UserPromptSubmit provenance) are owner-run markdown instructions,
  not automated scripts.** *Reasoning.* Both require the owner's real
  interactive environment (his own transcripts, his platform's
  notification behavior). An automated script would either run in a
  container (where the answer differs — see V12) or require the
  owner's authenticated session (a credential surface the tool
  refuses, `OL-7`). Markdown instructions the owner runs and pastes
  the result into a follow-up PR keeps the tool credential-free while
  still closing the verification.

- **D-plan-7 — CI job runs only unit + convention tests on every PR;
  fixture + replay + exit run are workflow-triggered.** *Reasoning.*
  Unit + convention tests run under a minute; fixture generators and
  the replay harness take longer (git operations per fixture). A
  full-suite trigger keeps PR feedback fast; a workflow-dispatch
  trigger runs the full suite on demand and before Step 42's exit
  run. This is a common Test Pyramid discipline: fast unit tests
  every commit, integration tier on demand.

- **D-plan-8 — `.claude/settings.json` writer uses a marker
  comment/field to enable idempotent init and precise deinit.**
  *Reasoning.* AD-20 requires deinit to "remove exactly what init
  wrote, by marker." The Claude Code settings JSON schema allows an
  arbitrary marker field; the writer adds `"comment": "installed by
  ctxoracle"` (or a similar recognized field) to each hook entry
  block, and deinit removes blocks whose marker matches. Alternative
  — matching by exact-command-string — breaks when the command
  string is legitimately updated (e.g. an install path change).

### 10A. Author's collapse-test on each load-bearing decision (`CLAUDE.md` rule 2)

The rationale entries above are the `expert-plan` skill's §10 frame-
correctness proof. `CLAUDE.md` dominating rule 2 demands a separate
four-part collapse-test on each load-bearing decision, in writing,
before acceptance and again in review. The **independent collapse-
hunt** (a fresh session/subagent, never the author) attacks the
step-2 questions written here. If a step-2 question is missing, the
hunter has nothing to attack. What follows is the author's obligation
per rule 2, done for every D-plan-* decision above and for every
plan-level structural choice that is load-bearing on the build's
outcome. Each entry names (1) the decision's job in one sentence in
mission terms, (2) the single hardest question a mission-literate
skeptic would ask to expose it as hollow, (3) an answer with a
citation, and (4) what the decision steers the agent toward plus a
confirmation it is a guide, never a gate.

#### D-plan-1 (build order)

1. **Job.** Sequence the Phase A build so the highest-correctness-risk
   mechanism — the deny path that halts agents — is exercised against
   its own tests before code that depends on the deny primitive
   exists.
2. **Hardest question.** Building the deny path before the whisper
   genres optimizes attention for the block, not for the mission of
   speaking a decision-changing fact — since the whisper path is what
   serves the mission and the block is a *second* owner-set objective
   (spec §8).
3. **Answer.** The order is topological on dependency, not on
   importance: stores/adapter come first because everything opens
   them; the deny path is second because it depends only on the
   substrate; whispers third because they depend on substrate +
   miner + indexer. Nothing here elevates the block over the mission;
   `P9` ("no feature is primary") holds by construction — the block
   is not built first because it matters more, it is built first
   because its blast radius is largest and its own correctness needs
   isolated exercise before the whisper path arrives to complicate
   diagnosis. Cite: spec §8 opening ("Blocking is a **second
   owner-set objective**, separate from the mission"); spec `P9`.
4. **Steers toward.** An implementer building the substrate correctly
   before consumers depend on it, and exercising the deny path
   against its own AC-2* fixtures before whisper genres complicate
   failure diagnosis. **Guide, not gate** — the order is what the
   implementer follows; no step polices whether they may proceed to
   the next.

#### D-plan-2 (dependency floor)

1. **Job.** Pin the runtime-dependency floor to the exact version
   architecture V14 measured, so plan-time re-verification cannot
   drift the tool onto a version whose behavior V14 did not observe.
2. **Hardest question.** Pinning at the architecture-verified version
   is drift theater — the caret in `^0.26.13` accepts 0.27.0 anyway,
   so the pin protects nothing.
3. **Answer.** The caret is deliberate: 0.27.0 is semver-compatible
   and works, but the floor at 0.26.13 makes it possible to
   reproduce V14's exact-verified surface by `npm install web-tree-
   sitter@0.26.13` when diagnosing a regression. The pin is not
   drift-blocking; it is drift-*witnessable*. Cite: architecture V14
   (measurement date 2026-08-29); plan §11.4 npm-registry evidence
   (2026-09-06).
4. **Steers toward.** Install times matching V14's tested surface by
   default, with the option to install 0.27.0 explicitly when the
   implementer wants its behavior. **Guide, not gate** — the caret
   means either version resolves; the pin says which one is the
   audited baseline.

#### D-plan-3 (`node:test` as the runner)

1. **Job.** Preserve the two-runtime-dependency invariant (`C-3`,
   spec §8) by choosing a test runner that ships with the runtime
   floor, so cold-container install stays free of a test-runner
   package to fetch and configure.
2. **Hardest question.** The two-dep invariant governs *runtime*, not
   dev deps; a mature test runner (jest, vitest) adds no
   cold-container risk. Choosing `node:test` sacrifices runner
   features (mocking, watch, snapshot) that a mature runner
   provides for free.
3. **Answer.** `node:test` has `describe`/`it`, parallel execution,
   subtest reporting, `mock`/`spy` primitives, and a JSON reporter
   — enough for the plan's §12 unit tier as specified. The "features
   for free" argument evaluates only against features the plan
   actually needs; none of §12's tests use snapshot semantics or
   watch-mode workflows. Cite: Node ≥ 22.16 `node:test` API; plan
   §12 unit-tier test specifications.
4. **Steers toward.** An implementer running `node --test test/
   unit/**/*.test.ts` and getting the same result CI gets, with no
   installed runner and no config file. **Guide, not gate** — every
   test is a plain Node script; nothing polices which runner is
   used.

#### D-plan-4 (`sqlite3` shell for AC-19 dump comparison)

1. **Job.** Make the AC-19 record-identical assertion diffable by a
   human reviewer at a glance, so a store-corruption regression
   surfaces during code review, not only in a test log.
2. **Hardest question.** The `sqlite3` CLI is a *system* dependency
   the plan otherwise avoids (`C-3`'s cold-container discipline);
   naming it as the preferred tool re-introduces exactly the "install
   this to test" surface the packaging philosophy rejects.
3. **Answer.** The plan says the CLI is *preferred when available*;
   the fallback is a Node script using the same `Store.prepare(
   "SELECT * FROM ...")` interface, and the AC-19 assertion is
   testable either way. The CLI is a convenience for interactive
   debugging, not a hard test dependency. Cite: plan §10 D-plan-4
   (fallback stated); §12 T32-2 (uses either).
4. **Steers toward.** An implementer with `sqlite3` installed getting
   an immediately-readable diff; one without it still passing AC-19
   via the Node path. **Guide, not gate** — either path satisfies
   the AC.

#### D-plan-5 (deterministic fixture generators, not committed tarballs)

1. **Job.** Keep the fixture's *construction* auditable by review, so
   the AC assertion's grounding — the fixture history the tool runs
   against — is diffable in git history, not sealed inside an opaque
   binary.
2. **Hardest question.** A deterministic-seed generator can construct
   the fixture *from* the AC's expected output, making the test
   tautological (`testing-standards.md` Fake-Test #3, backward-
   fabricated data).
3. **Answer.** The generator plants the *shape* of history (commit
   sequence, file changes, merge patterns) from the AC's description
   of the *scenario*, not from the AC's expected *output*; the AC
   asserts what the tool produces *given* that scenario, e.g. "the
   coupling pair fires with an evidence ratio computed from the
   planted history" where the ratio is derived by the tool, not by
   the fixture. Backward-fabrication would require the fixture to
   shape the tool's expected output — but every AC's assertion is
   on the tool's response to real fixture inputs, not on the
   fixture's own contents. Cite: `references/testing-standards.md`
   Fake-Test #3; plan §12 AC-1 assertion (the ratio is a computed
   output, not a fixture-planted value).
4. **Steers toward.** Reviewers reading the generator script and
   confirming what it did or didn't plant. **Guide, not gate** —
   the fixture is source-of-truth for the scenario; the test's
   assertion is a separate artifact.

#### D-plan-6 (L11 verifications as owner-run markdown probes)

1. **Job.** Preserve the credential-free property (`OL-7`) — no
   automated verification of Max Cogar's real interactive environment
   can run inside the tool's process without either shipping a
   credential or dropping the OL-7 property.
2. **Hardest question.** An owner-run markdown probe puts execution
   burden on Max Cogar (`OL-11`: non-programmer by design) — the exact
   "the owner cannot catch mistakes" failure (`CLAUDE.md` dominating
   rule 1), asking him to execute a probe and interpret its result.
3. **Answer.** Each probe is a copy-and-paste one-liner + a
   binary-outcome file read (marker present / absent). The
   alternative — automating it — requires either a credential or a
   live session tap, both refused by `OL-7`. And the *design does not
   rest on the probe outcome*: architecture L11 discloses that
   mid-session enforcement never depends on markers (intake reads
   the `prompt` field directly), so a failed probe result narrows a
   disclosed residual, it doesn't invalidate the block. Cite:
   OWNER-LEDGER `OL-7`, `OL-11`; architecture L11; plan §15 Q-gap-4
   attempt evidence.
4. **Steers toward.** Max running two short probes and pasting a
   two-line result into a follow-up PR that updates L11's
   disclosure. **Guide, not gate** — the build proceeds regardless
   of probe outcome; the disclosure narrows.

#### D-plan-7 (CI unit-tier on every PR; fixture-tier on demand)

1. **Job.** Keep PR feedback fast (unit + convention checks under a
   minute) so a reviewer sees green quickly on a merge-ready change,
   while the slower fixture-replay tier runs before the Step 42 exit
   run as its own gate.
2. **Hardest question.** A fixture-replay regression that lands on
   `main` without CI catching it is the "CI green but code is broken"
   failure — the reason CI exists at all is to catch that class.
3. **Answer.** The fixture tier is *workflow-triggered*, not skipped
   — Step 42 gates on it. And the unit + convention tier catches
   every *structural* precondition of the fixture tier (deny
   confinement `T15-2`, adapter isolation `T28-2`, DAO provenance
   `T9-1`) before the fixture tier's behavioral assertions run.
   A defect that only the fixture tier catches is a *behavior*
   regression, and behavior regressions land on `main` via merged
   PRs whose fixture tier the implementer ran per the drive-to-
   green rules. Cite: plan §12 `T15-2`, `T28-2`, `T9-1`; plan §9
   Checkpoint 4 (acceptance-set complete before exit run).
4. **Steers toward.** Reviewers merging fast when unit + convention
   pass; running the full suite before Step 42's exit run.
   **Guide, not gate** — CI does not police mergeability; the
   reviewer does.

#### D-plan-8 (`.claude/settings.json` marker discipline)

1. **Job.** Guarantee that `deinit` removes exactly what `init`
   added, so the `AC-7` pristine-tree assertion holds under every
   install/upgrade ordering.
2. **Hardest question.** An arbitrary marker field is not part of the
   Claude Code settings schema; a future harness that validates
   settings strictly could reject the marker and break `init`
   permanently for Max Cogar's repos.
3. **Answer.** The Claude Code settings schema historically accepts
   arbitrary fields alongside recognized keys (the harness reads the
   fields it knows, ignores the rest); a future strict-validating
   harness would be a hooks-contract drift, and the plan's response
   to that class of drift is the AD-6 single-adapter discipline —
   the marker field name is a plan detail an implementer migrates
   in one file. Cite: architecture AD-6 adapter-file discipline;
   architecture AD-20 init's marker requirement.
4. **Steers toward.** Implementer implementing `deinit` by
   marker-match, not by exact-command-string match (which breaks on
   legitimate command updates). **Guide, not gate** — the marker
   field is data; deinit reads it.

#### Plan-level: Checkpoint placement (§9's five checkpoints)

1. **Job.** Force a re-check of accumulated state at exactly the
   boundaries where an unnoticed defect would cascade through
   subsequent steps — the schema (Checkpoint 1), the deny path
   (Checkpoint 2), pipeline complete (Checkpoint 3), acceptance-set
   complete (Checkpoint 4), and the honest-exit-measurement gate
   (Checkpoint 5).
2. **Hardest question.** Five checkpoints in a 43-step build is the
   "constant ceremony" load that `P3` (zero ceremony for the agent)
   was written against — the plan is imposing exactly the ritual the
   spec principle forbids.
3. **Answer.** `P3`'s target is *the agent driven by the tool*, not
   the *implementer building the tool*; the two are different
   subjects. Checkpoints on the implementer's build are the "measure
   twice, cut once" discipline `CLAUDE.md` "Executing actions with
   care" requires. Each of the five is placed at a boundary an
   unnoticed defect would cascade past — schema → every DAO writer;
   deny path → every deny caller; pipeline complete → orchestrated
   behavior; acceptance-set → the exit run; exit report → the Phase B
   design input. Cite: `CLAUDE.md` "Executing actions with care";
   spec `P3` (target is the agent).
4. **Steers toward.** Implementer pausing to verify accumulated state
   at exactly five risk boundaries, not on every step. **Guide, not
   gate** — the checkpoint is a re-check discipline; no mechanism
   prevents step N+1 from starting before checkpoint N is signed off.

#### Plan-level: Test tier split (unit + fixture-replay + build-time)

1. **Job.** Distribute verification across the Test Pyramid so each
   defect class has a fast, cheap tier that catches it — unit for
   recognizer correctness, fixture-replay for orchestrated AC
   behavior, build-time markdown probes for the two owner-environment
   premises the tool cannot probe from inside its own process.
2. **Hardest question.** The build-time tier is a *manual* step;
   Fake-Test Anti-Pattern #10 (Flake-tolerated) is what a manual
   test becomes when nobody runs it.
3. **Answer.** The build-time tier is not a routine test — it is two
   named preconditions of specific L11 disclosures, executed once at
   Step 40 and recorded as the deliverable of that step. The plan
   marks Step 40 as unfinished until the probes are executed;
   `docs/STATUS.md` will not report "Phase A complete" until Step 40
   is closed. This is the honest form of "coverage the tool cannot
   generate itself" — recorded as a gap (§15 Q-gap-4), not hidden as
   a passing "test." Cite: `references/testing-standards.md`
   Anti-Pattern #10; architecture L11; plan §15 Q-gap-4.
4. **Steers toward.** Implementer running unit + convention on every
   commit; fixture-replay on demand; build-time probes as one-shot
   pre-exit tasks. **Guide, not gate** — the tiers are performance
   ordering, not permission gates.

#### Plan-level: Exit-run report shape (Step 42's mandatory metrics)

1. **Job.** Prevent the `docs/collapse-log.md` 2026-09-04 slop pattern
   — padding coverage to look like the block "works" — by making the
   exit report's metric set mandatory and its numbers visible in
   `ctxoracle status`, so a suspiciously-high answer-drift coverage
   number is caught at review, not swallowed as success.
2. **Hardest question.** A mandatory report shape doesn't prevent
   padded *numbers*; the collapse-log 2026-09-04 collapse was in the
   recognizer, not the report format.
3. **Answer.** The report shape is one leg of a three-part defense:
   (a) Step 14's recognizer-minimalism stops the padding at
   recognizer-construction time; (b) Checkpoint 5's explicit direction
   ("a suspiciously-high answer-drift coverage number is a finding,
   not a success") catches the padding at report-review time; (c) the
   mandatory shape stops silent omission of an inconvenient number.
   Together they close the collapse pattern's three routes; alone
   any one would leak. Cite: `CLAUDE.md` dominating rule 3;
   `docs/collapse-log.md` 2026-09-04; spec §11.5 exit clause.
4. **Steers toward.** Implementer writing a report whose numbers
   reflect what the recognizer actually caught, and treating a
   suspiciously-high number as a finding to investigate. **Guide,
   not gate** — the report shape is a template; the recognizer and
   the reviewer are the checks.

**Coverage attestation for the collapse-test.** Every D-plan-*
decision above has a §10A entry. Every plan-level structural choice
that is load-bearing on the build's outcome (checkpoint placement,
test tier split, exit-run report shape) has an entry. Steps 1–43 in
§7 are transcriptions of architecture decisions AD-1..AD-26, each of
which passed its own collapse-test in the architecture document; the
plan's §7 does not re-litigate those and does not require re-doing
their collapse-tests. If the reader disagrees about the load-bearing
scope — believes a specific §7 step is a plan-level load-bearing
decision the collapse-test missed — that is exactly the kind of
finding the independent collapse-hunt (STATUS Step 2) is dispatched
to raise.

---

## 11. Verification of factual claims

Every factual claim this plan asserts, with the read-level evidence
that establishes it. Search tools are locators; the reads recorded here
are the evidence.

**Legend for evidence sources.** Where an entry cites a spec section
number, ledger key, architecture decision, or verification premise
(V*), the read is of the current version of that document in this
session (fetched at plan-time, 2026-09-06). Where an entry cites a
`webfetch` or `npm registry` read, the URL and date of read are given.

### 11.1 Claims from the spec

- **Claim.** Phase A ships model-free genres, the answer-drift block's
  safe skeleton, stores/index/miner, delivery, self-observability,
  security, and the human-correction calibration channel; exits by
  producing measured whisper/block, false-fire, and regret data on a
  real repo. **Steps.** §1 goal; §2.1 scope; every plan step.
  **Evidence.** Read `docs/specs/spec-context-oracle.md` §11.5 in
  this session (lines 739–777). Verbatim: "Phase A — Deterministic
  core… Exits by producing measured whisper/block + false-fire and
  regret data on a real repo — including how little the conservative
  recognizer catches before Phase B."

- **Claim.** Phase A's answer-drift recognizer is a *safe skeleton*,
  never "the block working." **Steps.** Steps 14, 16, 17; §1 goal.
  **Evidence.** Same read, spec §11.5: "the answer-drift block's
  *safe skeleton* — the deny plumbing (a PreToolUse deny) plus a
  conservative deterministic recognizer… low-coverage: a skeleton,
  not 'the block working'." And spec §12 D-41.

- **Claim.** The deny-eligible tool set is exactly `{Write, Edit,
  NotebookEdit}` in Phase A; every other tool runs freely.
  **Steps.** Steps 14, 16.  **Evidence.** Architecture read in this
  session, AD-9: "the deny-eligible set is exactly the repo-mutating
  file tools (Write, Edit, NotebookEdit). Every other move — Read,
  Grep, Glob, Bash… Task spawns… MCP tools, web tools — is allowed."

- **Claim.** Two blocks exist in the mechanism: answer-drift and
  skill non-conformance; no third block may be added by the
  spec/architect. **Steps.** Step 15 (deny confinement).
  **Evidence.** Spec §8 ("The oracle blocks in **exactly two
  cases**") and OWNER-LEDGER OL-C2/OL-C3 read this session.

### 11.2 Claims from the architecture

- **Claim.** The store adapter (`stores/adapter.ts`) is the ONLY file
  importing `node:sqlite`. **Steps.** Step 3, Step 41. **Evidence.**
  Architecture AD-2 read this session: "All engine access goes
  through stores/adapter.ts — the only file allowed to import
  node:sqlite."

- **Claim.** The single deny-producer discipline (one caller of the
  emit function, verified structurally) is AD-10's mechanism.
  **Steps.** Step 15. **Evidence.** Architecture AD-10 read this
  session: "A single module (blocks/verdict.ts) defines the deny-
  verdict type and the only function that can place permissionDecision
  into a hook response."

- **Claim.** Question intake reads `UserPromptSubmit.prompt` before
  the agent's first move. **Steps.** Step 16. **Evidence.**
  Architecture AD-9 read this session: "Intake runs on the hook's
  own prompt string, so the row exists **before the agent's first
  move** — the moment OL-C5 names — independent of the
  transcript-write lag (V1)."

- **Claim.** V5 confirms `UserPromptSubmit.prompt` is a valid field.
  **Steps.** Step 16. **Evidence.** Architecture V5 row read this
  session: "UserPromptSubmit input carries prompt; SessionStart.source
  ∈ {startup, resume, clear, compact, fork} — Confirmed. AD-9's
  question intake and AD-16's D-20 reconciliation read exactly these
  fields."

- **Claim.** V1 confirms `transcript_path` is written asynchronously
  and may lag. **Steps.** Steps 16, 17. **Evidence.** Architecture V1
  row read this session (verbatim): "transcript_path is written
  asynchronously and may lag the in-memory conversation."

- **Claim.** V3 confirms `Stop`/`SubagentStop` delivers context via
  `hookSpecificOutput.additionalContext` bounded by `stop_hook_active`
  and 8-continuation cap. **Steps.** Step 30. **Evidence.**
  Architecture V3 row read this session (verbatim quote).

- **Claim.** V6 confirms a timed-out `PreToolUse` hook prevents the
  tool from running. **Steps.** Step 29. **Evidence.** Architecture
  V6 row read this session: "a timed-out PreToolUse hook prevents
  the tool from running."

- **Claim.** V7 confirms `node:sqlite` ships FTS5 from v22.16.0.
  **Steps.** Step 2. **Evidence.** Architecture V7 row read this
  session, including the executed test on Node v22.22.2 and the git
  diff on `deps/sqlite/sqlite.gyp` (0 matches at v22.15.0, 1 at
  v22.16.0). Plan does not re-execute; premise inherited from V7 and
  recorded as such in §15 Gaps (deliberate deferral).

- **Claim.** V8 measures cold-spawn cost at 45–54ms against the
  1500ms p95 budget. **Steps.** Step 29 (watchdog rationale), Step
  22 (indexer runs off-path). **Evidence.** Architecture V8 row read
  this session.

- **Claim.** V12 shows human-turn markers are mode-dependent and
  string-content user entries come in three kinds (human, task
  notification, hook feedback) beside list-content tool results.
  **Steps.** Steps 12, 19 (rebuild path). **Evidence.** Architecture
  V12 row read this session (enumeration counts included).

- **Claim.** V13 shows a shallow clone's max-parents=0 set varies per
  clone. **Steps.** Step 5 (repo-key). **Evidence.** Architecture V13
  row read this session (executed on this clone: 4 boundary commits;
  2026-07 clone had 6).

- **Claim.** V14 confirms `web-tree-sitter` 0.26.13 and
  `tree-sitter-wasms` 0.1.13 are current, pure-WASM, no install
  scripts. **Steps.** Step 1 (deps), Step 22. **Evidence.**
  Architecture V14 row read this session **and** direct npm registry
  reads this session (2026-09-06):
  `https://registry.npmjs.org/web-tree-sitter` — latest 0.27.0, no
  install/postinstall/preinstall scripts, no runtime deps;
  `https://registry.npmjs.org/tree-sitter-wasms` — latest 0.1.13
  (published 2025-10-07), no install/postinstall/preinstall scripts.
  The plan's `^0.26.13` accepts either.

- **Claim.** V17 confirms `VACUUM INTO` round-trips data on
  `node:sqlite` and `backup()` API is v22.16.0+. **Steps.** Step 32.
  **Evidence.** Architecture V17 row read this session.

- **Claim.** V19 confirms `PostToolUse` fires on success only;
  `PostToolUseFailure` fires on tool-execution failure; neither fires
  on pre-execution rejection. **Steps.** Steps 12, 25 (Verification
  genre's run-state consumption; regret's failure clause).
  **Evidence.** Architecture V19 row read this session.

- **Claim.** AD-4's uniform table-creation criterion: a table exists
  only in a phase where a writer exists. **Steps.** Step 7 (no
  `exemplars`, `recipes`, `env_capabilities`, `deferred_queue`,
  `genre_state` in Phase A migrations). **Evidence.** Architecture
  AD-4 "Table-creation criterion (applied uniformly)" paragraph,
  read this session.

- **Claim.** AD-19 requires pointer-only composition in Phase A (no
  verbatim repo text in whispers). **Steps.** Step 27.
  **Evidence.** Architecture AD-19 read this session: "Phase A
  whispers carry **no verbatim repo-derived text at all** — pointers
  (path:line-span, commit hashes), numbers, and names only."

### 11.3 Claims from the ledger

- **Claim.** OL-C1 forbids arbitrary volume/count/budget caps.
  **Steps.** Step 24 (bar). **Evidence.** OWNER-LEDGER.md OL-C1 read
  this session (verbatim quote from Max Cogar: *"either the
  information its giving the agent is important, or its not. at no
  point should an arbitrary limit influence how that operates."*).

- **Claim.** OL-C5 defines the answer-drift trigger. **Steps.**
  Steps 14, 16. **Evidence.** OWNER-LEDGER OL-C5 read this session
  (verbatim Max quote).

- **Claim.** OL-11 states Max Cogar is a non-programmer by design;
  plain-language output required. **Steps.** Steps 31, 33 (init and
  status render plain-language). **Evidence.** OWNER-LEDGER OL-11
  read this session.

- **Claim.** OL-C6 signs off the spec of record 2026-08-28.
  **Steps.** §3. **Evidence.** OWNER-LEDGER OL-C6 read this session
  (Max Cogar: *"yeah thats good with me. Mark it as good to go."*).

### 11.4 Claims from external sources this session

- **Claim.** `web-tree-sitter` npm registry latest is 0.27.0, no
  install scripts, no runtime deps. **Steps.** Step 1.
  **Evidence.** WebFetch `https://registry.npmjs.org/web-tree-sitter`
  (2026-09-06): "no install, postinstall, or preinstall scripts…
  Latest Version: 0.27.0… No runtime dependencies listed."

- **Claim.** `tree-sitter-wasms` npm registry latest is 0.1.13
  (published 2025-10-07), no install scripts. **Steps.** Step 1.
  **Evidence.** WebFetch `https://registry.npmjs.org/tree-sitter-wasms`
  (2026-09-06): "Version: 0.1.13… Published: October 7, 2025… no
  install, postinstall, or preinstall scripts defined."

### 11.5 Claims from the collapse-log

- **Claim.** The 2026-09-04 entry names Phase A's "fake completeness"
  failure and mandates measuring the floor rather than padding it.
  **Steps.** §1 goal, Step 14 (recognizer minimalism), Step 42 (exit
  run). **Evidence.** `docs/collapse-log.md` entry
  "2026-09-04 — the review treadmill built AI slop" read this
  session; the standing lesson is quoted verbatim.

- **Claim.** The 2026-09-03 round 9 entry names the reduction-
  inverted pattern (narrow mechanism inflated with guarantees
  broader than the requirement) and prescribes: demote the
  over-claim to the spec's mandate, do not patch the next input.
  **Steps.** Steps 14 (recognizers are minimal), 25 (Reuse
  incomparable-set silence rather than a false crown).
  **Evidence.** `docs/collapse-log.md` entry "2026-09-03 — round
  9" read this session.

### 11.6 Absence claims

- **Content absence claim.** The `middleware/context-oracle/
  ctxoracle/` directory contains no source code (Phase A is
  greenfield). **Steps.** §5, §8. **Evidence.** `Glob
  middleware/context-oracle/ctxoracle/**` returned no matches this
  session (only the skill files under `.claude/skills/` exist under
  `middleware/context-oracle/`). Scope covered: the entire
  `middleware/context-oracle/` subtree.

- **Structural absence claim.** No existing file references or
  imports code under `middleware/context-oracle/ctxoracle/**`.
  **Steps.** §5.4. **Evidence.** `Grep "middleware/context-oracle/
  ctxoracle"` across the repo would confirm; the reasoning-from-
  premise is that the target directory does not exist, so no import
  can resolve to it. Recorded as a structural claim rather than a
  content one (a compiled `codegraph_get_dependents` would be the
  ideal evidence; the tool is unavailable — see §15).

- **Structural absence claim.** No existing pattern in
  `middleware/context-oracle/` is being extended by this plan.
  **Steps.** §6, §8. **Evidence.** Read of `middleware/context-
  oracle/` directory listing (nine files: `CLAUDE.md`,
  `OWNER-LEDGER.md`, `RETHINK.md`, `README.md`, `docs/`, `tools/`,
  `.claude/`); none contains Phase A implementation code the plan
  extends. Architecture `L8` states this fact and it is re-verified
  by directory listing this session.

---

## 12. Test specifications

Every test the plan requires, per §12 output-contract. All tests
follow `references/testing-standards.md`: real implementations
preferred; every double named by Meszaros kind and justified; data
from real schemas or named fixtures; every test's failure condition
stated. Design techniques (equivalence partitioning, boundary value
analysis, decision tables, state-transition, error guessing) named
per test.

**ID scheme.** `T<step>-<n>` for tests tied to a specific plan step;
`AC-*` names align with spec §14 for acceptance-tier tests. Each
step's Verification field references these IDs.

**Coverage reconciliation summary.** Every Phase A AC in spec §14
maps to at least one test here: AC-1..1d, AC-2, AC-2a (plumbing),
AC-2a-i (allow-half), AC-2c (over-fire + under-fire correction),
AC-3, AC-3a, AC-4, AC-5, AC-6, AC-7, AC-8, AC-8a, AC-9, AC-10,
AC-11, AC-12 (deterministic parts), AC-13, AC-14, AC-15, AC-17,
AC-18, AC-19, AC-20, AC-22, AC-23, AC-24. Deferred ACs are stated
per architecture AD-24 with their phase: AC-2a-i deny-half → Phase
B; AC-2a-ii → Phase B; AC-2b + AC-2c skill-block under-fire →
Phase C; AC-16 → Phase C; AC-21 full → Phase B; AC-25 → Phase B.
These are not scheduled here.

### 12.1 Unit tier

**T1-1 — Package skeleton builds cleanly.**
- **Verifies.** Step 1 — package.json + tsconfig work.
- **Level.** Unit (build test). Chosen because the assertion is
  local to the package (build succeeds, exit code 0, no install
  scripts executed).
- **Real/doubles.** Real `npm` and `tsc`; no doubles. Justification:
  the point of the test IS that these tools succeed on the real
  package.
- **Data.** The package.json + tsconfig.json committed in Step 1.
- **NOT asserts.** Not that any specific test file exists yet
  (Step 1 has none). **Fails when.** `npm ci` errors OR `npx tsc
  --noEmit` errors OR any install script ran (captured via `npm ci`
  output regex).

**T2-1 — Runtime floor rejects below-22.16.0.**
- **Verifies.** Step 2 — `assertRuntime` correctness.
- **Level.** Unit. Local, deterministic (mocked `process.versions.
  node`).
- **Real/doubles.** Real `assertRuntime` function; a **stub**
  (Meszaros) for the version input string — the function accepts an
  optional version-string argument for testability, defaulting to
  `process.versions.node`. Justification: testing floor rejection
  requires simulating multiple version strings; a stub over the
  function's input is the minimal double.
- **Data.** Version strings: '22.15.9' (just below), '22.16.0'
  (boundary), '22.16.1' (just above), '23.0.0' (above), '22.14.0'
  (well below). **Technique.** Boundary value analysis.
- **NOT asserts.** Not that the runtime is actually 22.16 (that's
  environmental). **Fails when.** Below-floor input does not throw
  OR above-floor input throws.

**T2-2 — FTS5 probe returns true on FTS5-enabled build.**
- **Verifies.** Step 2 — `probeFts5` correctness.
- **Level.** Integration (small: real SQLite engine). The engine is
  the subject; a mocked engine would be doubled-subject.
- **Real/doubles.** Real `node:sqlite` in-memory DB. No doubles.
- **Data.** No test data — the probe creates and drops a virtual
  table.
- **NOT asserts.** Not that FTS5 works for real queries (that's
  T3-1). **Fails when.** Probe returns false on a Node runtime that
  actually ships FTS5 (verified by V7); probe returns true without
  the virtual table succeeding (asserted by re-creating it after
  probe).

**T3-1 — Adapter WAL/STRICT round-trip.**
- **Verifies.** Step 3 — `openStore` yields a WAL, STRICT-capable
  database.
- **Level.** Integration. Real database engine required — a mock
  would be doubled-subject.
- **Real/doubles.** Real `node:sqlite`. **A temp-file database
  path** (real filesystem, per testing-standards database rule 1
  "the engine is the production engine").
- **Data.** A single test table created via `CREATE TABLE t (x INT
  NOT NULL) STRICT;`. Insert (1); read back; assert (1). Insert
  ('x') — STRICT rejects; assert throw. `PRAGMA journal_mode`
  returns 'wal'.
- **NOT asserts.** Not concurrent behavior (that's T37-1). **Fails
  when.** journal_mode ≠ 'wal', OR STRICT does not reject the type
  violation, OR the round-trip loses data.

**T3-2 — Adapter confinement (no other file imports node:sqlite).**
- **Verifies.** Step 3 — quarantine.
- **Level.** Unit (a build-output grep). Deterministic.
- **Real/doubles.** Real `dist/` output. No doubles.
- **Data.** The built package's `dist/**/*.js` files.
- **NOT asserts.** Not source-level (built output is the ground
  truth). **Fails when.** Any file except `dist/stores/adapter.js`
  contains `require('node:sqlite')` or `from 'node:sqlite'`.

**T4-1 — Layout creates 0700 directories.**
- **Verifies.** Step 4.
- **Level.** Integration (real filesystem). No doubles — a mock fs
  would not check real permissions.
- **Real/doubles.** Real filesystem in a tempdir per test.
- **Data.** Repo key `'test_abc123'`, tempdir home.
- **NOT asserts.** Not umask policy (environment-dependent);
  asserts the mode after creation. **Fails when.** Directory mode
  is not `0o700`, OR a pre-existing loose-mode directory is
  silently modified.

**T5-1 — Repo key derivation.**
- **Verifies.** Step 5 — the 4-rule deterministic resolver.
- **Level.** Integration (real git repositories). No doubles — git
  is the subject.
- **Real/doubles.** Real git repos generated in a tempdir: (a) full
  history with 3 root commits; (b) shallow clone from (a) with
  depth 1; (c) shallow clone without an origin URL (created by
  removing `origin`); (d) a non-git directory.
- **Data.** Deterministic generator with fixed seed for commit
  timestamps/authors.
- **NOT asserts.** Not any specific hash value (would tie the test
  to a specific SHA that could change with git-format bumps);
  asserts the *mode* is correct per case AND that (a) and (b)
  yield **different** keys, AND that a repeat init on (a) yields
  the same key.
- **Fails when.** A shallow clone yields `mode='commit'` (the
  bug V13 flagged), OR the same repo yields different keys on
  repeat init, OR the fallback path is not taken when git is absent.

**T6-1 — Fault code list matches AD-17.**
- **Verifies.** Step 6.
- **Level.** Unit (snapshot). Deterministic.
- **Real/doubles.** None; direct enum comparison.
- **Data.** Expected list literal (transcribed from AD-17).
- **NOT asserts.** Not runtime fault emission (T10-1). **Fails
  when.** The enum contains any code not in AD-17 OR is missing
  any AD-17 code.

**T6-2 — JSONL writer append + mode.**
- **Verifies.** Step 6.
- **Level.** Integration (real fs). No doubles.
- **Real/doubles.** Real filesystem tempdir.
- **Data.** Two fault objects appended sequentially.
- **NOT asserts.** Not that no other process opens the file;
  asserts APPEND semantics (second write does not overwrite
  first) AND file mode `0o600` AND both objects parse.
- **Fails when.** Second write overwrites first, mode differs,
  or JSON parse fails.

**T7-1 — Migration applies + constraint negatives.**
- **Verifies.** Step 7 — every Phase A table + CHECK.
- **Level.** Integration. Real database engine (testing-standards
  rule 1). Real migration path (rule 2 — schema comes from
  migrations, not inline).
- **Real/doubles.** Real `node:sqlite`.
- **Data.** Fresh empty database. Insert one row per knowledge
  table with valid provenance (asserted to succeed); insert one
  attempting to violate each CHECK constraint (asserted to fail).
  Insert two `open` questions with the same `(consumer,
  content_hash)` (asserted the second fails per q_open_dedup);
  after answering the first, re-insert with the same hash
  (asserted to succeed — the recourse path).
- **NOT asserts.** Not row content correctness (per-DAO T9-1 does
  that). **Fails when.** Migration errors, OR any CHECK does not
  reject its negative case, OR the `open`-scoped dedup index does
  not allow a re-open after answered.
- **Technique.** Decision table over CHECK constraints;
  state-transition for question status.

**T8-1 — Global migration + defaults.**
- **Verifies.** Step 8.
- **Level.** Integration (real DB).
- **Real/doubles.** Real `node:sqlite`.
- **Data.** Fresh empty database, apply migration 002.
- **NOT asserts.** Not runtime tuning changes (T23-1). **Fails
  when.** The four tables are not present OR any AD-4-deferred
  table (`env_capabilities` etc.) IS present OR seed tuning rows
  are missing.

**T9-1 — Per-DAO CRUD + compile-time provenance enforcement.**
- **Verifies.** Step 9.
- **Level.** Integration (real DB per DAO) + a compile-time
  fixture.
- **Real/doubles.** Real `node:sqlite`.
- **Data.** Per DAO: create/read/update/delete round-trip with
  minimal valid provenance. The compile-time fixture attempts to
  call each write method without provenance — asserted via `tsc`
  to fail with a specific error message.
- **NOT asserts.** Not that TypeScript strict is on (T1-1);
  asserts the individual DAO signatures enforce provenance at
  the type level.
- **Fails when.** A CRUD round-trip loses data OR the tsc
  fixture compiles.

**T10-1 — `store_corrupt` induction surfaces on JSONL.**
- **Verifies.** Step 10.
- **Level.** Integration.
- **Real/doubles.** Real store; corrupt via writing arbitrary
  bytes to byte 0 of the DB file after close.
- **Data.** A valid store, corrupted, then any event-path
  operation attempted.
- **NOT asserts.** Not that the store recovers (it should not
  — corruption is terminal for that store). **Fails when.** The
  fault does not appear on the JSONL channel (`store_corrupt`
  with detail sufficient to reproduce).

**T10-2 — Latency instrumentation accuracy.**
- **Verifies.** Step 10.
- **Level.** Unit.
- **Real/doubles.** Real `performance.now()`.
- **Data.** A synthetic bounded operation of known duration.
- **NOT asserts.** Not clock accuracy in absolute terms;
  asserts recorded latency is within ±5ms of the observed
  duration (a generous bound that avoids test flake).
- **Fails when.** Recorded latency differs from observed by
  >5ms consistently across runs.

**T11-1..T11-5 — Redact/injection/trust unit tests.**
- **Verifies.** Step 11.
- **Level.** Unit.
- **Real/doubles.** No doubles.
- **Data.** Named positive cases (secret shapes, injection
  payloads) + negative cases (normal code). **Technique.**
  Equivalence partitioning + boundary value (min entropy,
  min length).
- **NOT asserts.** Not exhaustive coverage of every possible
  secret shape (L5 accepts residual risk).
- **Fails when.** Any listed positive case is not detected OR
  any listed negative case is false-positive-flagged.

**T12-1 — Reader entry discrimination fixtures.**
- **Verifies.** Step 12.
- **Level.** Integration (real fs — the reader opens files).
- **Real/doubles.** Real filesystem; JSONL fixtures constructed
  from V12's actual enumeration.
- **Data.** JSONL fixture with: 1 marker-present human turn,
  5 task-notification entries, 2 hook-feedback entries, 1
  list-content tool result, 1 marker-absent string user entry,
  1 assistant text turn, 1 assistant thinking-only turn.
  **Technique.** Decision table over `(kind, markers, content
  shape)`.
- **NOT asserts.** Not the content of the entries themselves
  (opaque per V12 policy); asserts the discrimination verdict.
- **Fails when.** Marker-based verdict is wrong for any case OR
  a marker-absent entry is not skipped OR an assistant
  thinking-only turn is misclassified as text.

**T12-2 — V12 replay counts match.**
- **Verifies.** Step 12.
- **Level.** Integration.
- **Real/doubles.** Real reader against a JSONL fixture whose
  contents mirror V12's own enumeration counts.
- **Data.** A synthesized transcript matching V12's shape and
  counts.
- **NOT asserts.** Not real-owner-transcript behavior (that's
  the L11 build-time verification, Step 40); asserts the reader's
  count on the synthesized shape equals V12's stated counts.

**T13-1 — QA state DAO round-trips + concurrent-open.**
- **Verifies.** Step 13.
- **Level.** Integration (real DB, real concurrency via child
  processes).
- **Real/doubles.** Real `node:sqlite`; two concurrent child
  processes contending for the same `openQuestion` call.
- **Data.** Two workers with the same `(consumer, contentHash)`.
- **NOT asserts.** Not the winning process's identity; asserts
  exactly one `open` row exists, AND the loser observes the
  UNIQUE constraint failure and either raises fault or backfills.
- **Fails when.** Two `open` rows exist OR both workers report
  "created" OR neither reports success.

**T14-1..T14-3 — Recognizer unit tests.**
- **Verifies.** Step 14.
- **Level.** Unit.
- **Real/doubles.** Real functions, no doubles.
- **Data.** T14-1 (question recognizer): fenced-code `?`
  (skipped); quoted `?` (skipped); stoplist match (skipped);
  plain `?` (recognized); no `?` (not recognized); multiple `?`
  in one turn (all recognized). Techniques: equivalence
  partitioning + boundary. T14-2 (clear): below-length-floor
  (does not clear); deferral stoplist match (does not clear);
  substantive (clears). T14-3 (move): `Write`, `Edit`,
  `NotebookEdit` → true; `Bash`, `Read`, `Grep`, `Glob`, `Task`,
  `WebFetch`, `WebSearch`, `MCP__x__y`, `NotebookRead` → false.
- **NOT asserts.** Not any comprehension judgment (Phase B);
  asserts the deterministic recognition only.
- **Fails when.** Any listed positive is not recognized OR any
  listed negative IS recognized. `T14-3` fails if ANY non-listed
  tool name returns true (the move recognizer widening trap).

**T15-1 — Verdict shape excludes updatedInput/updatedToolOutput.**
- **Verifies.** Step 15 — FR-B3 no-mutation clause.
- **Level.** Unit (compile-time).
- **Real/doubles.** Real `tsc`.
- **Data.** A fixture file attempting `{ updatedInput: 'x' }` as
  a HookResponse literal.
- **NOT asserts.** Not runtime absence; asserts type-level
  exclusion.
- **Fails when.** The fixture compiles.

**T15-2 — Verdict confinement (built-output grep).**
- **Verifies.** Step 15 — AC-2 structural.
- **Level.** Unit (built-output grep).
- **Real/doubles.** Real `dist/` output.
- **Data.** The built package.
- **NOT asserts.** Not source-only; built output is the ground
  truth.
- **Fails when.** `permissionDecision` appears in any
  `dist/**/*.js` other than `dist/blocks/verdict.js` OR the emit
  function is imported from any file other than
  `dist/blocks/answer_drift.js`.

### 12.2 Answer-drift block acceptance tests (fixture repos + replay)

**T16-1 — AC-2a plumbing: intake-then-deny.**
- **Verifies.** Steps 16, 15, 14; AC-2a.
- **Level.** Acceptance (system-level via the replay harness).
- **Real/doubles.** Real handler binary spawned; real store;
  captured hook JSON stream. Only external double is the
  transcript file (a real fixture file).
- **Data.** Fixture repo `answer-drift-clearly-off`. Hook stream:
  `UserPromptSubmit` with prompt "why is the deploy failing?" →
  `PreToolUse Edit /some/file`. Expected: `PreToolUse` returns a
  `permissionDecision: "deny"` naming the outstanding question.
- **NOT asserts.** Not that the agent then answers (agent
  behavior is not in the test scope); asserts the deny is
  emitted and the reason contains the question text.
- **Fails when.** No deny is emitted OR the reason does not
  contain the question OR a subsequent `PreToolUse Read` is
  denied (it must be allowed per D-39).

**T16-2 — Reconciliation backfills askedUuid.**
- **Verifies.** Step 16.
- **Level.** Integration.
- **Real/doubles.** Real handler.
- **Data.** Hook stream where the intake row precedes the
  transcript catch-up finding the matching human turn.
- **NOT asserts.** Not the ordering of writes (implementation
  detail); asserts the row's `asked_uuid` is backfilled after
  catch-up.

**T16-3 — Subagent not denied (AC-2a-i allow-half).**
- **Verifies.** Step 16.
- **Level.** Acceptance.
- **Data.** Main-agent open question; subagent `PreToolUse Edit`.
- **NOT asserts.** Deny-half (spawn-to-do-other-work is denied)
  is deferred to Phase B per architecture AD-24.
- **Fails when.** The subagent's PreToolUse is denied for the
  main-agent question.

**T17-1 — Lag hold + self-recovery (AC-2c over-fire boundary).**
- **Verifies.** Step 17.
- **Level.** Acceptance.
- **Data.** A hook stream where an assistant text turn has been
  written to the transcript but the bookmark reflects an earlier
  position (simulating the write-lag documented by V1).
- **NOT asserts.** Not the exact number of ms of lag; asserts
  the hold happens on the pre-catch-up state and self-recovers
  on the next event.

**T17-2 — `deny_after_answer_lag` fault surfaces.**
- **Verifies.** Step 17.
- **Level.** Integration.
- **Data.** Manually seeded transcript with an answer whose
  timestamp precedes a previously-recorded deny.
- **Fails when.** The fault does not appear on the next event.

**T18-1 — Deny health detectors induced.**
- **Verifies.** Step 18.
- **Level.** Integration.
- **Data.** Sequences that trigger `deny_loop` (3 consecutive
  denies), `deny_despite_answer_text` (denies with intervening
  short-but-non-deferral text), `deny_bypass_suspect` (a denied
  Edit followed same-turn by a Bash write to the same path).
- **NOT asserts.** Not that the agent actually intended a
  bypass; asserts the diagnostic fires on the pattern.

**T19-1..T19-3 — SessionStart source handling + AC-8a line.**
- **Verifies.** Step 19.
- **Level.** Acceptance.
- **Data.** T19-1: session with prior `open` rows, then
  `SessionStart {source: 'startup'}` — rows become `expired`.
  T19-2: `SessionStart {source: 'resume'}` — state rebuilds
  from the transcript; marker-less transcript raises
  `rebuild_recovered_nothing`. T19-3: at Stop with done-claim
  recognizer firing AND open questions exist → whisper carries
  outstanding-question line; done-claim without open → no line;
  open without done-claim → no line.

### 12.3 Whisper genre acceptance tests

**T25-1 (AC-1) — Coupling: non-obvious pair.**
- **Verifies.** Step 25 (coupling).
- **Level.** Acceptance.
- **Data.** Fixture repo `coupling-nonobvious` with a planted
  co-change pair across directories.
- **Marginal-value:** the fixture also plants an obvious
  same-directory same-stem pair — the test asserts that pair
  does NOT trigger a whisper (AC-1 obviousness clause).
- **Fails when.** No coupling whisper fires for the non-obvious
  pair OR a whisper fires for the obvious pair OR the whisper
  omits the evidence ratio.

**T25-2 (AC-1a) — Orientation: entry points + one invariant.**
- **Verifies.** Step 25 (orientation).
- **Level.** Acceptance.
- **Data.** Fixture repo `orientation-mixed-shape` — a
  low-in-degree `main`/`cli` file (carried by path markers) AND
  a high-in-degree hub. `ctxoracle note` seeds one invariant.
- **NOT asserts.** Not task-shape landmines (D-26 — those fire
  at edits, AC-1c). Asserts 2–4 entry-point files headlined + the
  invariant when present + no landmines.

**T25-3 (AC-1b) — Reuse: comparative dominance + incomparability
silence + observed-0 comparability + same-name-false-positive
caveat.**
- **Verifies.** Step 25 (reuse).
- **Level.** Acceptance.
- **Data.** Fixture repo `reuse-mixed-language`. Multiple
  candidates: one dominant grammar-covered symbol; a
  generic-frontend candidate in the search set → asserted
  silence (no crown). A separate fixture: grammar-covered
  symbol with observed 0 count → the crown is still awarded
  among comparable candidates (not over-silenced). A third:
  a same-name false-positive → whisper fires with the caveat
  in evidence and confidence capped.

**T25-4 (AC-1c) — Consequence: coupled tests + zone flag.**
- **Verifies.** Step 25 (consequence).
- **Data.** Fixture `consequence-coupled-tests` — a file whose
  historical co-change partners include known test files; the
  edit event fires a whisper headlining the coupled tests, not
  a raw call-site count.

**T25-5 (AC-1d) — Completeness: paired change unshipped.**
- **Verifies.** Step 25 (completeness) + Step 30 (Stop-time
  delivery).
- **Data.** Fixture `completeness-paired-change` — an edit
  session completing one half of a historically-paired change;
  at Stop the whisper names the unchanged partner via
  `hookSpecificOutput.additionalContext` (FR-B4).

**T25-6 (AC-3, AC-3a, AC-4) — Bar + hazard + dedup.**
- **Data.** Fixture with two above-bar candidates at one event
  → both delivered (AC-3 no cap). A hazard candidate below
  confidence floor but above noise floor → delivered with
  confidence flag (AC-3a). A candidate whose subject is in the
  read-set → withheld (AC-4).

**T25-7 (AC-6) — Corpus floor.**
- **Data.** Fixture `corpus-floor` — 29 non-excluded commits
  (below the default 30 floor) → history genres silent; add
  one more commit → history genres fire.

### 12.4 Cross-cutting acceptance tests

**T26-1..T26-2 (AC-8) — Command classifier + verification
whisper.**
- **Verifies.** Steps 26, 25 (verification).
- **Data.** Commands per AD-15's cases: `npm test`, `pytest`,
  `ls`, `cd`, `echo hi`, `cd pkg && npm test`, `npm test && make
  integration`, `"npm test"` (quoted), `sh -c "npm test"`
  (subshell).
- **NOT asserts.** Not that the covering test actually runs
  (out of scope); asserts the whisper's headline is the
  covering-test *mapping*, never run-state alone; asserts the
  weak "no *recognized* test run" claim for class 3.

**T27-1 — Whisper form validator (AC-14).**
- **Level.** Unit.
- **Data.** Every genre's Phase A test-fixture whisper is
  passed through a form validator: `[oracle]` prefix, genre
  tag, ≥1 pointer, evidence ratio for history genres,
  confidence flag when not high, no imperative.

**T27-2 — Rumor rule: pointer re-resolution drops stale
candidate.**
- **Data.** A candidate composed against a `file:span` pointer;
  before emit, mutate the file so the cited span no longer
  contains the fact; assert the candidate is dropped with
  `whisper_dropped_stale`.

**T28-1 — Pipeline order: catch-up before block check.**
- **Data.** A hook stream where a `PreToolUse` arrives after
  the transcript has been updated to include a clearing answer;
  assert the deny is NOT emitted (catch-up ran first and cleared
  the question).

**T28-2 — Adapter isolation (grep).**
- **Data.** Built `dist/**/*.js` outside `dist/hook/adapter.js`;
  assert none contain the CC field-name literals.

**T28-3 — Fail-open on any error (AC-10).**
- **Data.** Induce a store-open failure; a parse failure; a
  handler-throw. Each yields exit 0 + empty stdout + JSONL fault.

**T29-1 (AC-10) — Watchdog fires + fail-open + latency.**
- **Data.** A synthetic long-running mock recognizer trips the
  2500ms cooperative deadline; a large-store fixture case
  against AD-23's inventory (per architecture AD-24).
- **NOT asserts.** Not that every operation completes; asserts
  no deny/whisper emitted and `latency_breach` recorded; p95
  ≤ 1500ms across the fixture stream.

**T29-2 — Recursion guard short-circuits.**
- **Data.** Handler invoked with `CTXORACLE_INTERNAL=1`; asserts
  exit 0, empty stdout.

**T30-1 (AC-5) — Session-boundary reconciliation.**
- **Data.** Sessions with `startup`, `clear`, `resume`, `fork`,
  `compact` source values; assert dedup state per D-20.

**T30-2 (AC-8a variant) — Stop-time additionalContext single-cycle.**
- **Data.** Two Stop events in one turn (second with
  `stop_hook_active: true`); first delivers, second delivers
  nothing.

**T31-1..T31-3 (AC-7) — init/deinit/pristine tree.**
- **Data.** Fixture `pristine-tree`: after `init` +
  `index` + a mock session + `deinit`, the tree differs from
  pre-init only by the absence of the marker-tagged hook
  entries in `.claude/settings.json` (AC-7).

**T32-1 — Deinit removes exactly marker-tagged entries.**
- **Data.** A `settings.json` with mixed pre-existing entries
  and ctxoracle-marker entries; `deinit` removes only the
  marker-tagged ones.

**T32-2 (AC-19) — Export/import record-identical round-trip.**
- **Data.** Populate stores; `export`; delete stores;
  `import`; canonical-order dump before and after; `diff` is
  empty.
- **NOT asserts.** Byte-identical (VACUUM INTO is not byte-
  identical); record-identical per row (AC-19).

**T33-1 (AC-9) — status renders every FR-M4 signal.**
- **Data.** Session with induced faults (each code in Step 6),
  emitted whispers, denies, corrections; `status` output
  contains every signal AC-9 enumerates including the "not yet
  measured (Phase B/C)" rendering for the two reserved codes.

**T33-2 — log renders per-session audit trail.**
- **Data.** Session with 3 whispers and 1 deny; `log --session
  <id>` shows all 4 with evidence and pointers.

**T33-3 — tune round-trips.**
- **Data.** Set a scalar, add/remove list members, re-list.

**T34-1..T34-2 (AC-2c under-fire, AC-23) — Human correction.**
- **Data.** T34-1: `correct <deny-id> --verdict false_fire`
  updates wrongful-deny rate; T34-2: `correct
  --missed-question "was renaming safe?"` re-opens the question
  and the next matching mutating move IS denied (fixture
  `answer-drift-under-fire`); a collision case shows the
  plain-language limit message.

**T35-1..T35-2 (AC-23 fact routing) — note verb.**
- **Data.** Project-store note lands in `human_facts` and
  outranks a conflicting mined inference; `--global` note
  lands in `lessons`.

**T36-1 (AC-24) — Regret true-positive + no-inflate.**
- **Data.** Fixtures `regret-true-positive` (a held fact whose
  region is re-edited/reverted or whose covering test fails →
  regret row) and `regret-no-inflate` (unrelated churn → no
  regret row).

**T37-1..T37-2 (AC-13, AC-19 concurrency, and the fold's
serialization) — Concurrency.**
- **Data.** Two concurrent handlers; two concurrent fold
  invocations for the same project; assert no double-count.
  AC-13 (store hygiene) is exercised by the miner fixture
  (T20-1).

**T38-1 — Model seam stub returns `phase_a_no_model`.**
- **Data.** Invoke the Phase A stub; assert result.

**T39** — see §12.1 unit tier (this bucket).

**T40 (AC-11, AC-15, AC-17, AC-20, AC-22, AC-18) — remaining
fixture assertions per AD-24 mapping.**
- AC-11: fixture `secret-injection` — planted secrets never
  appear in any whisper/log/store/export; injection payloads
  never open a question, never alter oracle behavior.
- AC-15: fixture `subagent-delivery` — subagent tool event
  draws a whisper into that subagent's context keyed by
  `agent_id`.
- AC-17: fixture `language-config-added` — an unlisted language
  becomes indexed after adding a `tune ext_to_grammar +…` row;
  no code change.
- AC-20: `scripts/check-cold-container.sh` runs the tool
  install + first index in a fresh container; both succeed.
- AC-22: fixture `idle-silence` — a session held idle produces
  no whisper regardless of wall-clock time; a subsequent
  boundary event fires normally.
- AC-18: fixture `seeded-facts` — a rich fixture with planted
  decision-changing facts; the exit run (Step 42) delivers
  those specific facts (verified by pointer matching);
  `status` reports the run.

**T41-1 — Convention grep tests.**
- **Data.** Seed a violation of each convention (a direct DAO
  import from `handler.ts`; a CC field-name in a non-adapter
  file; a `permissionDecision` construction outside
  `verdict.ts`); assert each test detects it. Revert; assert
  the tests pass on the clean codebase.

**T43-1 — STATUS.md rewritten + check-tooling green.**
- **Data.** Run `python middleware/context-oracle/tools/
  check_docs.py` after Step 42's STATUS.md rewrite; exit 0.

### 12.5 Coverage attestation

Every Phase A AC from spec §14 traces to at least one T ID above.
Every plan step from §7 traces to at least one T ID in its
Verification field. Reconciled; no gaps.

---

## 13. Risks

Ordered by potential to cause Phase A to miss its goal, most severe
first.

- **R1 — The AD-9 recognizer is elaborated beyond its Phase A safe-
  skeleton scope during Step 14.** The 2026-09-04 collapse is a
  standing warning: every reviewer that catches "an edge case the
  recognizer misses" is applying the trap. Mitigation: Steps 14, 25
  cite the collapse-log explicitly; the exit report in Step 42
  measures the honest floor rather than reviewing to zero-findings;
  Checkpoint 5 explicitly flags a suspiciously-high coverage number
  as a finding, not a success. Recoverability: full — cut the
  elaboration, revert to the deterministic minimum.

- **R2 — The build passes reviews and passes tests but the exit run
  (Step 42) reveals the block does nothing useful on real repos.**
  This is the spec's own expected outcome (§11.5: "how little the
  conservative recognizer catches"). Reframed: not a risk, a
  feature. The plan mitigates the risk of *hiding* this by making
  the exit report structure mandatory and the number visible in
  `status`. What Phase B is for.

- **R3 — A hooks-contract drift between plan-time (V1–V19 verified
  2026-08-29) and build-time invalidates a premise.** The hooks
  contract has drifted before per `CLAUDE.md`. Mitigation:
  `hook/adapter.ts` is the ONE file naming CC field names (AD-6 /
  Step 28) so a drift is a single-file change; `T28-2` flags any
  drift to other files; the plan's Standards table (§3) inherits
  V-dates so a build-time re-verification is a targeted read, not a
  survey. Recoverability: full — a drift becomes a plan update in
  the adapter file.

- **R4 — Bash-drift silently defeats the answer-drift block (L3).**
  A drifter using only shell commands is not caught by the
  deny-eligible set. Mitigation: the `deny_bypass_suspect`
  diagnostic (Step 18) surfaces the pattern; the human channel
  (Step 34) records misses. Owned as a documented residual per
  spec §12 D-39 / architecture L3. Not fixable in Phase A without
  violating D-39; Phase B distinguishes.

- **R5 — A silent under-fire in a marker-less transcript mode (L11
  (a)) drops a real question.** Mitigation:
  `rebuild_recovered_nothing` fault fires (Step 19); the L11 (a)
  build-time verification (Step 40) measures the exposure with
  Max's real environment; mid-session enforcement never depends
  on markers (intake reads the `prompt` field). Recoverability:
  the human channel re-opens the missed question.

- **R6 — The tree-sitter grammar inventory shipped by
  `tree-sitter-wasms` 0.1.13 does not cover a language Max's
  repos use, so those files fall to the generic frontend.**
  Mitigation: T40 grammar-inventory check runs at build time; the
  generic frontend keeps those languages searchable and
  Reuse-safe (incomparable-set silence). Non-blocking; a missing
  grammar becomes a `tune ext_to_grammar` addition or a WASM
  grammar checked into the package.

- **R7 — The exit-run's real-repo set is too small to be
  informative.** Phase A's exit deliverable IS the measurement;
  a run against one repo (this one) is thin. Mitigation: the exit
  script supports a `.ctxoracle-exit-repos` file the owner
  supplies; the report explicitly states the repo set it
  measured; Phase B design consumes what exists and asks for more
  data where needed.

- **R8 — The `whisper_stats` fold's per-project watermark logic has
  a subtle race under concurrent same-project handlers.**
  Mitigation: the `BEGIN IMMEDIATE` discipline (Step 37) plus
  `T37-2`'s concurrent-fold test.

- **R9 — SQLite `busy_timeout=100ms` + retry-once is too aggressive
  on a heavily-contended store.** In practice Phase A is one user
  driving one Claude Code session — contention is low. Mitigation:
  `store_busy` diagnostic surfaces the case; the tunable is
  editable via `tune` if the owner observes it. Fail-open on
  second failure means agent-visible failures do not happen.

- **R10 — The `docs/reviews/` architecture-review record's numbering
  drifts as new reviews are added; a plan-side citation ends up
  pointing to a moved file.** Mitigation: the plan cites reviews
  by date + subject, not by number; the review file names are
  stable per `CLAUDE.md` ("written once, never edited").

**Hardest step.** Step 14 (recognizers). Not because it is technically
complex — it is the opposite: the recognizers are small — but because
the temptation to elaborate them into "correctness" is exactly the
2026-09-04 collapse. The step is hardest because it requires
restraint, and restraint is not testable.

**Points of no return.** Step 42 (exit run) is not reversible in the
sense that once the report is published, its numbers become the Phase
B design input. Mitigation: Checkpoint 5 gates the report against the
collapse-log lesson.

---

## 14. Question register

Every question surfaced during planning, its bin, and its closed
disposition. **Zero entries open at delivery.**

### 14.1 Bin 1 — engineering questions (derived and answered)

- **Q1 (Step 1).** Should the plan floor `web-tree-sitter` at V14's
  0.26.13 or the current 0.27.0? **Bin.** 1 (semver + registry
  reading). **Disposition.** Answered: `^0.26.13` per D-plan-2
  (accepts 0.27.0 as semver-compatible; verified 2026-09-06 no
  install scripts). Evidence in §11.4.

- **Q2 (Step 1).** Which test runner? **Bin.** 1. **Disposition.**
  Answered: `node:test` per D-plan-3.

- **Q3 (§5).** Are there any existing files under
  `middleware/context-oracle/ctxoracle/`? **Bin.** 1 (glob).
  **Disposition.** No — confirmed via `Glob` this session (only
  `.claude/skills/expert-plan/` files exist). Recorded as absence
  claim in §11.6.

- **Q4 (Step 5).** How should the repo-key derivation handle a
  worktree checked out from a bare repo (which has no
  `is-shallow-repository` in the worktree)? **Bin.** 1
  (documentation read). **Disposition.** `git rev-parse
  --is-shallow-repository` runs in the worktree and returns based
  on the worktree's parent .git; for a linked worktree it works the
  same. If it returns "unknown" (git very old versions), the
  fallback path is (4) — path-keyed. AD-3 does not name this case;
  the plan handles it by falling through to path-keyed with a
  diagnostic (Step 5).

- **Q5 (Step 7).** Should the migration runner support down-
  migration? **Bin.** 1 (spec + arch). **Disposition.** No —
  AD-25 says "forward-only migrations." Downgrade path is
  `deinit --purge` + fresh `init`.

- **Q6 (Step 15).** How does the built-output grep handle the case
  where TypeScript inlines the constant literal
  `"permissionDecision"` at multiple call sites through
  imports/dead-code-elimination? **Bin.** 1. **Disposition.**
  `tsc` does not perform DCE or inlining; the built `dist/` retains
  the module boundaries. Verified by the T15-2 test's own
  behavior — if `tsc` ever changed this, the test itself would
  break loudly.

- **Q7 (Step 22).** Should the tree-sitter frontend pool parsers
  across events (across process boundaries)? **Bin.** 1 (AD-1
  no-daemon). **Disposition.** No — the indexer runs off the
  event path in a detached child (AD-12), and the child is short-
  lived. Pool within the indexer process, not across processes.

- **Q8 (Step 25).** The Coupling genre fires on `PostToolUse`
  Read/Grep/Glob. Does a `Bash cat file.ts` count as a "read" that
  should trigger Coupling? **Bin.** 1 (AD-4 consumer filter).
  **Disposition.** No — Coupling's change/read consumer per AD-4
  reads Edit/Write/Read tool rows only (not the Bash path-write
  rows). A `Bash cat` is not tracked as a read. Documented in the
  Coupling generator (Step 25).

- **Q9 (Step 26).** How does the command_class classifier handle
  `npm run test`? **Bin.** 1. **Disposition.** The default
  test-runner lexicon includes both `npm test` and `npm run test`
  as heads; extensible via `tune lexicon.command_class_test_runners
  +"pnpm test"`.

- **Q10 (Step 28).** Which hook event fires FIRST when the owner
  starts a fresh session — `SessionStart` or `UserPromptSubmit`?
  **Bin.** 1 (docs). **Disposition.** `SessionStart` per V5. The
  handler's SessionStart handler runs first, resetting dedup and
  qa state (Step 19).

- **Q11 (Step 33).** What "plain language" phrasing does `status`
  use for the two Phase-B-reserved codes? **Bin.** 1. **Disposition.**
  "model path — not yet measured (Phase B)" and "missed
  skill-block — not yet measured (Phase C)". Written into the
  renderer (Step 33).

- **Q12 (Step 42).** Where do the exit-run's real-repo hook-stream
  captures come from — recorded manually or replayed? **Bin.** 1.
  **Disposition.** The plan supports both. A recorded stream (from
  a real Max Cogar session with the tool installed) is the
  preferred input; a live session run is the fallback. Recording
  is done post-Step 31 (init works), so the initial exit runs may
  be against captured streams from Max's later use.

- **Q13 (Step 40).** How does the L11 (b) verification (whether
  `UserPromptSubmit` fires on task notifications / scheduled wakes)
  actually get performed? **Bin.** 1 (docs). **Disposition.**
  Documented in `test/build_time/user_prompt_submit_provenance.md`:
  the owner installs a hook that logs every `UserPromptSubmit`
  invocation, then triggers task notifications via
  `ScheduleWakeup`/`send_later`; the log shows whether the event
  fired.

### 14.2 Bin 2 — user decisions

**None.** `docs/STATUS.md` confirms no owner question is open; the
spec is signed off (`OL-C6`); the architecture is reviewed and
signed off; every scope element in §2.3 was derived from those,
not from the planner's judgment on scope.

### 14.3 Bin 3 — gaps (see §15)

Entries closed into §15 Gaps: Q-gap-1, Q-gap-2, Q-gap-3, Q-gap-4
(all recorded there with their attempt evidence).

### 14.4 Reconciliation sweep

**Sweep pass count: 3.** Pass 1 identified Q1–Q13 above and 4
gaps (Q-gap-1 through Q-gap-4). Pass 2 (walked every plan step,
every §12 test spec, every §13 risk, every §11 verification claim,
every §2.3 coverage row) added 0 new entries. Pass 3 (walked §5
files-affected, §6 foundation-corrections empty claim, §10
decisions) added 0 new entries. The register is closed with 13
bin-1 entries (all answered), 0 bin-2, and 4 bin-3 entries closed
into §15.

---

## 15. Gaps acknowledged

Each entry with resolution-attempt evidence and what would be
required to close it.

- **Q-gap-1 — CodeGraph tools (`codegraph_scan`,
  `codegraph_get_dependents`, `codegraph_find_related_docs`, etc.)
  are unavailable in this environment.** **Attempt.** Reviewed the
  ToolSearch listing this session; none of the `codegraph_*` tools
  appear in the deferred-tools list; searched for `codegraph` in the
  loaded tool set — no match. **Impact on plan.** Steps 2 (codebase
  survey), 5 (foundation assessment), and the change-impact
  annotations Step 8 output-contract calls for are performed by
  manual reads instead of graph queries. This is a genuine gap for
  a plan targeting an *existing* codebase; for a greenfield project
  where the entire tree is new (L8, verified by §11.6 absence
  claim), the graph would have nothing to report — the codebase
  survey is grounded on the architecture (which enumerates every
  file the plan creates) and on the manual related-docs sweep in
  §5.5. **Resolution requires.** Enabling the CodeGraph MCP server
  in this environment. For a greenfield plan, the impact is
  bounded to the analysability degradation (Step 41's grep-based
  convention checks substitute for the structural-dependency
  assertions CodeGraph would enable — different mechanism, same
  guarantee).

- **Q-gap-2 — Clear Thought MCP is unavailable.** **Attempt.**
  Searched the deferred-tools list; no `clear_thought_*` tools
  appear. The expert-plan skill mandates Clear Thought reasoning
  for every plan with decision points meeting its trigger criteria.
  **Impact on plan.** D-plan-1 (build order — a real judgment
  between at least two valid orderings) was reasoned in-document
  rather than via a Clear Thought trace. The reasoning is captured
  in §10 D-plan-1's entry. **Resolution requires.** Enabling the
  Clear Thought MCP server. The in-document reasoning is the honest
  substitute; a reviewer can audit the choice from the D-plan-1
  entry the same way they would audit a Clear Thought trace.

- **Q-gap-3 — Node.js v22.x `deps/sqlite/sqlite.gyp` FTS5 state was
  not re-executed this session.** **Attempt.** Architecture V7
  measured this on 2026-08-29 with a locally-executed test on Node
  v22.22.2 + `PRAGMA compile_options` inspection + git diff on the
  upstream `sqlite.gyp` file between v22.15.0 and v22.16.0.
  Re-executing in this session would repeat V7's own measurement
  with no likely change (V7 measures a released Node version's
  behavior). **Impact on plan.** Step 2's FTS5 probe premise
  inherits V7 without re-execution; if V7 were somehow wrong,
  Step 2's probe (which actually creates an FTS5 virtual table)
  would fail at `init` in a loud way. **Resolution requires.**
  Re-executing V7's exact test on the current Node runtime; not
  scheduled here because Step 2's own probe is the runtime check
  that V7 predicts.

- **Q-gap-4 — The two L11 build-time verifications (marker
  presence on the owner's actual interactive transcripts; whether
  platform-injected turns fire `UserPromptSubmit`) cannot be
  performed by the plan-writer.** **Attempt.** Both require the
  owner's real Claude Code environment and interactive session
  behavior; the plan-writer's transcript is a `claude -p` probe
  transcript (V12 shows this differs from the interactive
  transcript on marker presence). **Impact on plan.** Neither
  gates any design choice — the plan schedules both in Step 40 as
  owner-run markdown instructions, and the design is shaped so
  neither is load-bearing (per L11's own disclosure: mid-session
  enforcement does not depend on markers; the voiding guard
  bounds the T2 exposure at the intake door to one catch-up).
  **Resolution requires.** Max Cogar running the two probes and
  updating L11's status in a follow-up PR — this is Step 40's
  own deliverable.

**No other gaps.** Every other decision in this plan was grounded
in a named standard from §3 (spec, architecture decisions,
ledger, OWASP references, testing-standards, ROSE, ISO/IEC
25010:2023, SQLite WAL documentation), and every factual claim was
verified per the entries in §11.

---

## 16. Post-completion

**After all steps complete:**

1. **Verify Phase A acceptance.** Every AC from spec §14 Phase A
   set passes on fixtures AND on the real-repo exit run;
   `ctxoracle status` reports a clean session (spec §14 opening
   clause: "v1 is complete when every criterion passes on a real
   repository and `ctxoracle status` reports a clean session" —
   *"v1"* here refers to the full spec; Phase A's complete-when is
   the Phase A subset).

2. **Publish the exit report** to `docs/reviews/<date>-phase-a-
   exit-run.md`, mirroring the format Step 42 defines. Include:
   per-genre whisper counts, block counts, false-fire rate,
   wrongful-deny rate, regret rate + seeded coverage, denies
   issued, active suppressing conditions, honest floor of what
   the answer-drift recognizer caught, and per-repo breakdowns.

3. **Rewrite `docs/STATUS.md`.** State: Phase A complete; next
   step Phase B architecture (per lifecycle — architecture is
   per-phase, written only when the prior phase produces the
   data it needs; Phase A's exit run IS that data).

4. **Update `middleware/context-oracle/README.md`** (if present)
   with a pointer to the new package; do NOT create it if
   absent.

5. **Route lessons** from the build to `docs/collapse-log.md` if
   they generalise (per `CLAUDE.md` policy) — one line each
   plus a pointer to the review that grounds it.

6. **Do NOT amend the architecture.** Any behavior surfacing
   during build that contradicts the architecture is a
   Stop-and-Escalate condition — raise it to the owner per §5.5.

**Follow-up work this plan may create:**

- The two L11 build-time verifications (Q-gap-4) may reveal
  results that shrink or grow L11's disclosure — a follow-up
  documentation PR updates AD-9's L11 note with the measured
  state.

- If the exit report reveals a Phase A genre performing
  materially worse than the architecture predicted, a
  Phase A patch may be needed before Phase B begins — that is
  a genuine iteration on Phase A, not a Phase B item.

- Grammar inventory gaps identified by T40 may lead to a
  package-side addition of specific WASM grammar files
  (checked in) to close coverage without adding runtime deps.

**Exported-surface check.** Not applicable — this plan creates a
new component tree; there is no pre-implementation baseline of
exported symbols to `codegraph_diff_surface` against. The
architecture's file list (§5.1) IS the planned surface; the
Step 41 convention grep tests are the mechanical check that the
built surface matches (no unintended imports, no unintended CC
field names, no unintended deny callers).

---

*End of plan. Its foundation: `docs/specs/spec-context-oracle.md`
(OL-C6-signed), `docs/architecture-phase-a.md` (reviewed to
convergence 2026-09-04), `OWNER-LEDGER.md` CONFIRMED rows, and the
Phase A goal recorded in `docs/STATUS.md` and `CLAUDE.md`
dominating rule 3. This plan is executed against those documents;
where the plan cites an ID (AD-n, FR-*, AC-*, OL-*), the cited
document is authority.*
