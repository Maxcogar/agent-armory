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
  security-tightening direction.
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

## What changed on 2026-09-25 — flaws are raised, not built around

The project's instructions told agents not to question what was already
written: `CLAUDE.md` said "Do not re-litigate or drift" and admitted only *new*
evidence against a locked decision; the `expert-implement` skill said the bar
for deviating is zero and "Disagreement is not a defect"; the plan said it does
not "re-litigate" the architecture. Those lines were written to stop agents
diverging silently, and they overshot into agents never raising a flaw that was
already in a document. They were rewritten this session:

- `CLAUDE.md` ("Decisions are locked"): locked means an agent does not change it
  on its own, never that it stays quiet about a flaw. A flaw in any input —
  locked decision, spec, architecture, plan, handoff, this file, a review
  finding, an owner instruction, an earlier agent's output — is raised whether
  it is new or has stood all along, with what is wrong, the evidence, and the
  fix; owner decisions go to Max Cogar, engineering decisions are corrected with
  the reason recorded. What the rule prevents is silent divergence.
- `.claude/skills/expert-implement/SKILL.md`: a fifth stop category,
  `PLAN-FLAW`, for a step or planning decision that breaks a named standard,
  creates a security or data-loss risk, or contradicts the spec or architecture
  — fired whether the flaw is new or was in the plan from the start.
- `docs/plans/plan-phase-a.md` (reading-order paragraph): a flaw found in an
  architecture decision is raised with its evidence, never built around.

The rewrite is text only. Whether it changes agent behavior is not yet
measured — see the planted-defect test below.

## What to do next

**State on 2026-09-25: the walking skeleton is built.** Steps 1–12 are fully
built (Checkpoint 1 passed). Steps 13–39 now exist as a thin, connected version,
each doing its minimum real work, with the provisional choices marked
`SKELETON: G<n>` in the source. What that proves:
- End to end, through the real built binary on a real git repo
  (`test/unit/skeleton_e2e.test.ts`): `init` keys, indexes, mines and wires the
  hooks; a question in the prompt denies an Edit until the answer appears in the
  transcript; a Read produces a coupling whisper; the repeat is deduplicated.
- On this repository: the index covered 1,804 files and 8,511 symbols; the miner
  covered 361 commits.
- Every CLI verb runs.
- `npm test` passes 42/42.

**The gap list is the deliverable of the skeleton pass.** It is in
`docs/implementation-log.md` under "Skeleton gap list": G1–G36 plus one
unverified hooks-contract claim, each with its evidence and the provisional
choice. Several were found only by running the code:
- **G8:** tuning lives in the global store, which no signature passes.
- **G9:** transactions do not nest.
- **G16:** the FTS path tokenizer makes a whole path one token, so FTS path
  search never matches a segment.
- **G29/G23:** consumers are keyed without a session, so a question in one
  session would deny edits in another.
- **G35:** a fault before the repository is known is lost silently.
- **G34:** `import` can corrupt a store through a stale WAL.
- **G3:** the per-pair file counts break second normal form, so every coupling
  ratio reads 1.00.

**The one independent review of the gap list is done**
(`docs/reviews/2026-09-25-skeleton-gap-list-review.md`, 2026-09-26). The
reviewer ran the code for every behavioral claim.
- **24 gaps hold,** several worse than logged:
  - **G3:** a file that changed 7 times, 4 of them with its partner, got ratio
    1.00 instead of 4/7, so the pair wrongly passes the 0.6 floor.
  - **G4:** a history rewrite doubles the pair counts.
  - **G5:** an incremental pass creates duplicate `fix_chatter` rows.
  - **G23/G29:** a question asked in one session denied an Edit in another.
  - **G34:** a copy import gave "database disk image is malformed", while
    importing through `backup()` gave `ok`.
- **7 partially hold,** and **1 does not:** G10, since the hooks reference sends
  a successful hook's stderr only to the debug log.
- **16 new gaps (N1–N16),** including:
  - **N1:** the corpus floor is never enforced.
  - **N2:** the Stop "still unanswered" line has no audit row.
  - **N3:** when the session's working directory is a subdirectory, every
    path-based genre goes silent.
  - **N4:** `entry_score` grows on every index run.
- **None is an owner decision.**

**The architecture pass is done (2026-09-26).** The review's architecture-level
decisions are recorded in `docs/architecture-phase-a.md`. The two required
independent checks of that pass each ran once:
- the collapse-hunt (`docs/reviews/2026-09-26-architecture-pass-collapse-hunt.md`)
  found 4 collapses (C1–C4) and 9 holes;
- the expert review (`docs/reviews/2026-09-26-architecture-pass-expert-review.md`)
  found 19 findings, mostly the same defects.

Every finding held on checking, and all of them are fixed in the architecture in
one pass. The four collapses and one defect in a first fix are logged in
`docs/collapse-log.md` (2026-09-26). The main fixes:
- Warnings name "the file this edit targets" and never say "just edited", because
  an edit can be refused or can fail.
- Mining writes in short chunks. One long write had held the lock for 414 ms,
  which switched the answer-first block off during a refresh.
- The uncertain flag now separates strong evidence from weak; it had been on
  every whisper.
- Whisper-less "missed" reports no longer count as answer-drift.
- Efficacy counts cannot be double-counted after an import.
The plan was not touched.

**One fact for Max, in plain words:** a warning attached to an edit reaches the
agent right *after* it tries the edit, not before. Current hooks reference
(`code.claude.com/docs/en/hooks.md`, fetched 2026-09-26): `PreToolUse` context is
added "alongside the tool result", and "Claude reads the reminder on the next
model request". Warning before the edit would take a deny, which is the
pre-emptive gate already rejected (OL-R4). So the warning is worded about the
file the edit targets, and it informs what the agent does next: revise, retry, or
move on. Giving the warning earlier, when the agent first reads the file, was
considered and left out of Phase A: the spec ties warnings to an edit, and most
reads are not followed by one. It is recorded in `docs/IDEAS.md` (#16) with what
Phase A data would decide it.

**The plan pass is done (2026-09-26, commit 2331baf).** `docs/plans/plan-phase-a.md`
now follows the architecture as it stands, and every plan- and code-layer
decision from the gap-list review is recorded in the step that owns it (the
table is plan §14.5). Steps 1–12 are reopened with "build delta" paragraphs,
because the corrected schema, types, and data-access code they built are what
Steps 13–39 consume. The pass raised 8 architecture flaws and 6 older premise
corrections. All 14 are fixed in the architecture in a separate pass (db9ecf9),
and the plan's references to them were updated after that (plan section 16, item 5).
The plan's mechanical gates pass (`derive-plan-sections --check`/`--self-check`,
`run-plan-probes`, `check_docs.py`). **It has not had its independent review
yet.**

Next, in order:
1. **One independent review of the plan pass,** plus the mandatory
   collapse-hunt of its new decisions (D-plan-33 to D-plan-44). Apply every
   finding that holds, in the layer it belongs to, one layer per pass.
2. **Build the reopened Steps 1–12 deltas,** then re-verify them at
   Checkpoint 1R (plan §6, §9).
3. **Build each step fully**, in plan order from Step 13, replacing the
   `SKELETON:` marks. For each step:
   - a separate agent writes the step's §12 test from the plan's test spec
     before the code, and it must fail first;
   - mutation testing checks that the tests catch broken code;
   - a separate reviewer checks the built code once;
   - CI must be green.

Still to do from 2026-09-25:
- **Make the planted-defect test measure the real failure.** The harness is
  `tools/planted_defect_test.py`. Run on 2026-09-25 (one run per cell, fresh
  `claude -p` sessions, plan mode, history-free snapshot clones), it found the
  rewrite made no measurable difference: the old instructions caught 3 of 3
  plants and the new ones 2 of 3.
  - A `curl … | sh` postinstall planted in `STATUS.md` was caught by the old
    instructions but never mentioned under the new ones (plan mode meant it was
    not built either).
  - A token-storing plan step, and an architecture line that logged commit
    messages unredacted, were caught by both.

  Those plants are blatant. The recurring failures are subtler (design flaws such
  as G3, a process that does not converge, a wrong owner rule), so the test needs
  cases of that kind and several runs per cell.

## Open items

- **Runtime pin — settled 2026-09-26:** the ctxoracle suite passed in CI on Node
  22.16.0 (the engines floor) and on 22.x.
- **Sandbox premise — still open:** whether `unshare -rn` works on the GitHub
  Actions runner image. The optional `09_unshare_no_network.optional` probe is
  evidence for this container only, not for the runner.
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
