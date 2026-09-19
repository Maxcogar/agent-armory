# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, ideas in `docs/IDEAS.md`, and everything
attributed to Max Cogar in `OWNER-LEDGER.md`. The step-by-step build journal —
what each step built, the verification actually run, and every finding — is
`docs/implementation-log.md`; read it before touching a built step.*

## The Phase A goal (the north star — read this first)

Phase A is the **honest deterministic foundation, and the measurement of its own
floor.** It stands up the genuinely-deterministic core on Max's real repos — the
stores, the index, the miner, the model-free whisper genres, the deny plumbing,
the self-observability — runs cleanly with no incident, and tells Max the truth
about what that core does and does not do. The spec (§11.5) defines the Phase A
exit as a *measurement*, not a finished feature: it "exits by producing measured
whisper/block, false-fire, and regret data on a real repo — **including how
little the conservative recognizer catches** before Phase B." The deliverable is
honest capability plus honest measurement, with clean seams the later phases plug
into — **never fake completeness dressed to look like a working product.** Judge
every Phase A decision against this goal (`CLAUDE.md` dominating rule 3).

## Where the project stands

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`), the Phase
A architecture (`docs/architecture-phase-a.md`) is reviewed to convergence, and
the Phase A implementation plan (`docs/plans/plan-phase-a.md`, 40 steps) is the
build contract. **The build is underway and Steps 1–12 are done: Checkpoint 1 —
the store substrate — is reached.** The package lives at
`middleware/context-oracle/ctxoracle/` (Node ESM, `tsc`-only build, `node:test`).

What exists and is tested (full detail per step in `docs/implementation-log.md`):

- **Toolchain & harness (S1):** pinned `package.json`/lockfile, strict NodeNext
  `tsconfig`, the count-guarded `scripts/run-tests.mjs`, the `dispatch.ts` bin
  stub, the `compileFixture` helper, and 26 deterministic fixture-repo generators.
- **Runtime floor (S2):** `assertRuntime` (numeric SemVer vs the 22.16.0 floor).
- **Store adapter (S3):** the sole `node:sqlite` seam — WAL/STRICT/FTS5,
  `transaction` with retry-once-then-`StoreBusy` (AD-26), `VACUUM INTO` export,
  `probeFts5`.
- **Home/layout (S4):** `ctxoracleHome`, `ensureLayout` (0o700, loose-mode
  reporting).
- **Identity & spawn (S5):** `resolveRepoKey` (the four rules + URL
  normalization) and `src/util/spawn.ts`, the sole `node:child_process` seam
  (`CTXORACLE_INTERNAL=1`, `scrub`).
- **Shared substrate (S6):** `FAULT_CODES`, the direct JSONL fault channel, the
  `Trust`/provenance types, and the shared event/candidate/index types.
- **Schema (S7, S8):** migrations 001/001b (project store, STRICT + PROV CHECKs +
  FTS5) and 002 (global store), applied by `applyMigrations(store, {fts, scope})`.
- **DAOs (S9):** ULID generator + 24 thin DAO factories, one per table;
  provenance required at compile time and validated at runtime (FR-X4).
- **Diagnostics & guards (S10):** the session/fault mirror-writers, the
  cooperative `createDeadline` watchdog, and the `isInternal` recursion guard.
- **Security (S11):** `redact` (secret patterns + entropy) and `isSuspect`
  (injection lexicon).
- **Tuning (S12):** `tuning` DAO + `seedDefaults` from the single `tuning_seeds`
  source (architecture_default + plan_seed provenance).

The full suite (`npm test`, 41 tests across the unit/build/convention tiers, with
the runner's count guard) is green, and the Checkpoint 1 owner-visible sanity
check passed: a freshly migrated + seeded store shows 22 STRICT project tables
with their CHECK constraints and `tuning` holding every seed with its `source`.

**But Checkpoint 1 is NOT cleanly passed.** The independent first-round review of
Steps 1–12 (`docs/reviews/2026-09-19-checkpoint-1-implementation-review.md`)
returned **NEEDS FIXES** — 7 open findings (3 Moderate, 4 Minor), no Critical or
Serious, no software-breaking bug. Several are the direct result of the
implementer deciding on the fly instead of following the plan or stopping:
- **M1** — `assertProvenance` (`src/security/trust.ts`) enforces a weaker FR-X4
  gate than Step 6/9 prose declares (it permits non-human → `'mechanical'`); the
  plan prose and the AD-4 schema it cites are themselves in tension, so this is a
  prose-vs-schema reconciliation, not just a code fix. (An earlier STATUS claim
  that this contract was "confirmed by T-9-1" was wrong — the review corrected it.)
- **M2** — T-3-3 (`test/unit/concurrency.test.ts`) does not exercise the AD-26
  retry-once-then-succeed path; the plan's §12 T-3-3 spec (lines 7564–7589)
  specifies the exact deterministic sequencing that was not implemented.
- **M3** — three committed files (`.gitignore`, `test/unit/concurrency_worker.ts`,
  `test/fixtures/repos/.gitkeep`) sit outside any step's declared `create` list.
- **m1–m4** — fixture placeholders (deferred to Steps 13–38), two tests validating
  against the implementation's own constants, a weak redactor negative case, and
  several interfaces/values the plan never specified (`Store.exec`, the `scope`
  param on `applyMigrations`, etc.). Full detail in the review doc.

These are open. They are recorded, not fixed — Max Cogar directed that they not be
patched in this session. Interfaces the plan mandated early but finalized at their
consuming step are additionally noted in `docs/implementation-log.md`.

Two build-time defects were found and fixed while building (both in
`docs/implementation-log.md`, one also in `docs/collapse-log.md`): the
single-importer convention tests had a parallel-run ENOENT race (now
ENOENT-tolerant), and the repo-root `build/` gitignore rule was silently
swallowing the entire `test/build/` tier (now re-included by a scoped exception
in `ctxoracle/.gitignore`, the same class as the earlier lockfile re-inclusion).

The plan's mechanical gates remain the first things to re-run if anything about
the plan seems off:

- `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs docs/plans/plan-phase-a.md --check`
- `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --self-check`
- `node .claude/skills/expert-plan/scripts/run-plan-probes.mjs docs/plans/plan-phase-a.md`
- `python middleware/context-oracle/tools/check_docs.py`

## What to do next

**First, resolve the seven open Checkpoint-1 review findings** in
`docs/reviews/2026-09-19-checkpoint-1-implementation-review.md`. They are Steps
1–12 work that is not done until they are addressed — do not treat Checkpoint 1
as passed while they stand, and do not build Step 13 on top of them. In
particular M1 (the `assertProvenance` / FR-X4 prose-vs-schema tension) and M3
(three undeclared files) touch the plan text and so are decided by Max Cogar and
the plan-revision discipline, not by an implementer editing on the fly; M2
(the T-3-3 retry-then-succeed coverage gap) is a test the plan already fully
specifies. Route the fixes the way Max directs — this session did NOT patch them.

**Then continue building Phase A from Step 13** with `/expert-implement` against
`docs/plans/plan-phase-a.md` — Checkpoint 2 (the whisper path at function level)
spans Steps 13–20: the co-change miner (S13), the indexer + `runIndex` (S14), the
tree-sitter/generic frontends + `defaultFrontends` (S15), the bar (S16), dedup
(S17), the seven genres (S18), the composer (S19), and delivery (S20). Build the
steps strictly in order; the plan is written to make every decision, so a spot
where you would have to choose on the fly is a plan defect to STOP REPORT, not to
improvise past — the review above shows what happens when that rule is skipped.
Judge every decision against the Phase A goal above, not against passing review
(dominating rule 3), and dispatch the independent review of built work to a
neutral subagent — never grade your own work.

Two concrete Step-13 notes already established:
- The co-change miner reads history under **`-z`** and parses on **NUL** (never
  line-by-line), with each commit record marked by `%x1e` + `%H`; a filename
  containing ` => ` or a raw control byte is never mis-keyed. `probe:24_git_numstat_z`
  grounds this; the root-cause history is `docs/collapse-log.md` 2026-09-18.
- When writing the production miner's numstat parser, write it *without* the two
  redundant `cur` null-checks the reference parser in
  `docs/plans/plan-phase-a.probes/24_git_numstat_z.mjs` carries (an early
  `if (!cur) continue` makes the inner checks dead code).
- The `cochange_pairs` DAO's `bump` currently increments `a_count`/`b_count`
  alongside `pair_count` as a stand-in; Step 13 owns the real per-file change
  counts and should set them from the mining pass.

One premise the earlier reviews flagged and dispositioned: Unicode NFC/NFD path
normalization is **out of scope** for Phase A's Linux target. Do not reopen it
without new evidence.

## Current repo state the build inherits — enforcement hooks are disabled

The two repo-root Stop-hook gates (`hooks/stop-completeness-gate/`,
`hooks/stop-instruction-adherence-gate/`) and the context-oracle correction-loop
hooks are **disabled at Max Cogar's explicit request**: the gate scripts
short-circuit to `exit 0`, and `.claude/settings.local.json` sets
`CORRECTION_LOOP_JUDGE_RUN=1` so the loop's judge/guard/serve stand down. Reason:
all three judges spawn a nested `claude -p` subprocess that hung/timed out for
hours — the session-isolation bug in Open Items below. The disable is a
deliberate, owner-authorized operational unblock, **not** a licence to skip
review rigor: the independent-review discipline (dominating rule 2) still applies
by hand — it is simply no longer auto-enforced by a broken judge.

## Open items

- **The runtime-pin and sandbox premises settle the first time the build's CI
  runs.** Behaviour at the Node 22.16.0 engines floor is executed only by CI's
  matrix entry; whether `unshare -rn` works on the GitHub Actions runner image is
  still open (the optional `09_unshare_no_network.optional` probe is evidence for
  this container, not for the GHA runner).
- **L11(a)** — human-marker presence is measured on interactive transcripts; the
  plan reports it *verified* only when an owner-local interactive transcript is in
  the exit corpus, otherwise *not observed*.
- **L11(b)** — whether `UserPromptSubmit` fires for platform-injected turns is
  undocumented; the plan resolves it by live induction inside the exit run's
  closed-loop leg. Design-safe either way per `AD-9`'s voiding guard.
- **Two real bugs in this repo's own Stop hooks**, outside Context Oracle's
  scope, recorded here once per Max Cogar's explicit instruction. Both gates spawn
  their judge subprocess (`claude -p`) with `os.environ.copy()` without stripping
  Claude Code's session-identity variables, so the judge attaches to the live
  session and hangs/dies empty; the gates then fail closed. This is not a standing
  practice — future unrelated findings do not belong in this file.
