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

**The seven Checkpoint-1 review findings are all applied, and the independent
review reached convergence — a round with zero findings.** The review ran as the
two mandatory independent passes the project requires (a fresh neutral subagent
each, mechanical-only dispatch), across two rounds:

- **Round 1** — expert-review **PASS**
  (`docs/reviews/2026-09-20-checkpoint-1-fixset-expert-review.md`); collapse-hunt
  **PASS with two findings** (`…-collapse-hunt.md`): a ledgered-authority fix to
  this STATUS's wording, and extending the seed-literal test pins from 14 to all
  20 §10 scalars plus a completeness guard.
- **Round 2 (convergence)** — after those two findings were applied, both passes
  re-ran and returned **zero findings**
  (`…-round2-expert-review.md`, `…-round2-collapse-hunt.md`); both load-bearing
  decisions (M1, M2) survived the collapse test.

An earlier attempt this session was only a single *steered* pass — not the
expert-review + collapse-hunt pair the project requires — so its PASS was
contaminated and is retracted. The
findings came from `docs/reviews/2026-09-19-checkpoint-1-implementation-review.md`
(NEEDS FIXES: 3 Moderate, 4 Minor; no Critical/Serious, no software-breaking
bug). **All were applied — no triage:**

- **M1** — `assertProvenance` (`src/security/trust.ts`) now enforces the Phase A
  rule exactly: human-provenance ⇒ `'human'`, every non-human input ⇒
  `'untrusted_repo'`; `'mechanical'` is rejected. `'mechanical'` is a **schema
  value reserved for later-phase mechanically-generated content (`FR-X2`)** —
  the reconciliation is recorded in AD-4 and plan Step 6/9, and `T-9-1` now pins
  the non-human→`'mechanical'` rejection. The code was looser than the
  (well-grounded) rule; the fix makes code conform to the rule — the
  security-tightening direction. **Its blast radius is now verified beyond the
  diff**: reading every PROV-carrying writer the plan specifies for Steps 13–40
  confirms each either writes repo-derived content as `'untrusted_repo'` (miner
  S13, indexer S14/15 — which M1 *requires*) or human-provenance content as
  `'human'` (`note`, S35 — which M1 *permits*), none emits `'mechanical'`, and
  all funnel through the Step 9 DAO contract the plan already states identically
  to M1. The two convergence passes had scoped only to `git diff origin/main`
  and never examined the gate's planned consumers; that review-scope gap and its
  clean result are recorded in `docs/collapse-log.md` (2026-09-23). M1 is safe
  across all of Phase A.
- **M2** — `Store.transaction` gained a minimal `onBusyRetry` observation seam
  (declared in Step 3); `T-3-3` now drives the AD-26 retry-then-succeed path
  deterministically per the §12 spec (writer B reports its first-attempt busy,
  waits, and its retry finds the lock free by construction — verified stable
  across repeated runs).
- **M3** — `.gitignore`, `test/unit/concurrency_worker.ts`, and
  `test/fixtures/repos/.gitkeep` are declared in their step `create:` lists and
  §5.1 (regenerated; `--check` clean) and explained in Step 1 prose.
- **m1** — Step 1's partial fixture deliverable is now explicit in the plan; the
  deep scenarios stay deferred to their consuming Steps 13–38 (building them now
  would be premature machinery against the phase goal).
- **m2** — `T-12-1` pins the load-bearing seeds to the §10 literal values and
  `T-1-3` pins `FIXTURE_NAMES` to a §5.1 literal list, so drift from the plan is
  caught rather than validated against the implementation's own constants.
- **m3** — `T-11-2`'s redactor negative case is now a realistic 28-char
  identifier at 3.968 bits/char (just below the 4.0 threshold), so over-redaction
  of real code would be caught.
- **m4** — the seven undeclared interfaces (`Store.exec`, the `scope` param on
  `applyMigrations`, `oracleExecFileSync`'s `maxBuffer`, `sha256Short`/`sha256Hex`,
  the `observed_actions` tool-name sets, the `landmines` dedup key, and
  `whisper_audit.deliveredSubjects`) are declared in their owning steps.

All four plan gates pass (`derive-plan-sections --check` regions current,
`--self-check` 34/34, `run-plan-probes` 27/27, `check_docs.py`), the build is
clean, and the full suite is green (`npm test`, 41 tests). **Checkpoint 1 is now
cleanly passed** — the independent review converged (Round 2: both passes, zero
findings), all four plan gates pass, the build is clean, the full suite is 41/41,
CI is green on the PR head (per its check-suite events), and there is no merge
conflict.

The M1 and M3 fixes edited plan text (Step 6/9/§12 and AD-4) and §5.1. Plan and
doc revision is the agent's job on this agent-led project (`OL-11`, CONFIRMED in
`OWNER-LEDGER.md`), so those edits need no per-change owner authorization. The
prior session's STATUS framing that had routed M1/M3 to the owner was not a
ledgered constraint and does not override `OL-11`; no un-ledgered owner
instruction is relied on here.

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

The independent review of the Checkpoint-1 fix set converged (Round 2: both the
expert-review and the collapse-hunt returned zero findings), so Checkpoint 1 is
cleanly passed and Step 13 builds on a clean substrate.

**Continue building Phase A from Step 13** with `/expert-implement` against
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
- Every PROV row the miner (S13) and indexer (S14/15) write is repo-derived, so
  each carries a non-human `prov_kind` and `trust='untrusted_repo'` — M1's gate
  (`assertProvenance`, via the Step 9 DAO `create`/`upsert` methods) requires
  exactly this and rejects `'mechanical'`; the `note` verb (S35) is the only
  Phase A writer of `'human'` provenance. This is the verified consumer contract
  behind `docs/collapse-log.md` 2026-09-23, not a new decision to make.

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
