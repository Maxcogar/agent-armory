# Handoff — Context Oracle: architecture is complete; next is the plan

**To:** the next session. **Job:** produce the implementation plan from the spec +
architecture (then build Phase 0). The architecture is done — rebuilt, adversarially
reviewed, all findings applied.

## The situation, in one paragraph

The architecture document (`docs/architecture-context-oracle.md`) was rebuilt
verification-first from the spec's own rule **FR-A1**, then put through the two
mandatory independent passes — an adversarial collapse-hunt (mission-fidelity) and
an expert-review (premise/standards). Both found real problems (one Critical, two
HIGH, plus Moderate/Minor); **all were applied**, and the owner corrected one
over-correction the collapse-hunt introduced. The judgment core is now sound
(grounded generation), every load-bearing premise was established by actually
running it this session, and the load-bearing decisions carry a written collapse
test. The lifecycle is spec → architecture → plan → build; you are at **plan**.

## Read first, in this order

1. `docs/STATUS.md` — plain-language state.
2. `CLAUDE.md` — the two dominating rules and the collapse test. Non-negotiable.
3. `docs/collapse-log.md` — **read before you design or build.** The 2026-07-22
   entry carries this session's lessons, including two you must inherit: (a) a
   premise is only "established" if you ran the **actual** command the design ships,
   flags and all (the `--bare` miss); (b) an independent collapse-hunt can itself
   collapse a decision the *wrong* way — a "posture" flag must separate *blocking*
   (removed by the rethink) from *observing/informing* (the mission), and must never
   turn an owner-approved feature into a "should we keep it?" question.
4. `docs/architecture-context-oracle.md` — the whole document; it is the plan's
   structural ground.
5. `docs/specs/spec-context-oracle.md` (all of it) and `RETHINK.md` §12 + addendum
   — the requirements and the owner's locked decisions.
6. `docs/judgment-layer-corrected-foundation.md` — the FR-A1 anchor the judgment
   core rests on.

## What the architecture now says (so you don't relearn it)

- **Judgment = grounded generation** (D10/D12/D13): the model judges materiality
  (FR-A1) and *composes* the whisper; deterministic code then verifies every claim
  binds to a resolvable store fact (P4) and bounds output to non-imperative form
  (FR-X2/FR-J5). Retrieval is first-class (A0 shaping sub-turn) and the Answer genre
  is honestly retrieval-bounded. **Not** select-only, **not** unbounded generation.
- **Model access** (D11): `claude -p` piggyback on the host CLI, tools disallowed by
  a real `--disallowedTools` flag, inline `--json-schema`, fresh session id, scrubbed
  env — **and no `--bare`** (see the fact below). Async off the hook path; degraded
  mode is the same system minus the model lane.
- **Concurrency** (D24): the event loop reads only; all event-path writes go to a
  writer worker; the FR-X6 audit record is durable (logged-before-sent).
- **Conduct genres** (Process, Answer-drift, FR-A8/A9): owner-added (OWNER-9),
  advisory, **enabled by default**. They deliver the unregistered conflict as an
  FR-A1 fact; they are not the gatekeeper posture the rethink removed (that was
  *blocking*). Their only owner touchpoint is a post-measurement false-fire review
  (spec §14), tuned by the §9.2 ladder — **not** an on/off decision.

## Load-bearing facts established this session (do not undo these)

- **`--bare` breaks the piggyback.** Its help states "OAuth and keychain are never
  read"; in a credential-less host-managed/subscription-login environment it fails
  authentication (verified 3/3). The model command must **never** carry `--bare`.
  The recursion guard is therefore cwd-isolation + `CTXORACLE_INTERNAL` env-guard +
  fresh session-id (not the skip-hooks flag); AC-11 must test the **non-`--bare`**
  command.
- **Piggyback works with no API key** in the cloud container; cold spawn ≈ 5.7 s →
  the model call can never sit on the synchronous hook path (async judgment).
- **`node:sqlite` `DatabaseSync` is synchronous** — a locked-DB write busy-waits the
  calling thread; that is why event-path writes are off the loop with a low
  `busy_timeout`. WAL/STRICT/FTS5 all work on Node 22.22.2.
- **Subagent injection works** (`additionalContext` reaches the subagent's own
  context; `agent_id` identifies the consumer); the transcript lags one event
  boundary.

## What is genuinely still open (runtime checks, not design gaps)

- **Local subscription-login inheritance** — proven only in the cloud env; the
  owner's own machine is a Phase-1 runtime check. No credential fallback exists
  (OWNER-7); a failing environment runs degraded, and the owner decides if that's
  acceptable there.
- **The `systemMessage`-never-reaches-the-model negative** — docs support it but
  don't guarantee it; pinned by an AC-10/AC-18 runtime assertion, not asserted.
- **Subagent transcript-file layout** — observed once, undocumented; isolated behind
  a versioned adapter that degrades to skip. Whisper *delivery* to subagents does
  not depend on it.
- **Conduct-genre false-fire rates** — reviewed *after* the first instrumented
  sessions (spec §14). This is calibration, not a design decision.

## The next job, concretely

1. **One confirmation review of the fixed architecture is cheap insurance before
   building.** The round-2 fixes (the judgment core, the concurrency model, the
   model command) were substantial and were applied *after* the review that found
   them — a convergence pass confirms they hold together. If it's clean, proceed.
2. **Produce the implementation plan** (`/expert-plan`) consuming the spec + the
   architecture. The architecture's build order (its "Foundation and build order"
   section) is the plan's dependency spine; its traceability matrix says which
   decisions are settled; its Standards table is the registry the plan's per-step
   source annotations point back to. Do not re-open decisions the architecture
   settled.
3. **Then build Phase 0** per the architecture's build order and the spec's §12
   phase exits — deterministic spine first (contract → stores+writer → diagnostics →
   security scanner → shim/service → indexer → miner → Lane 1 genres → CLI),
   verifying each acceptance criterion by *running it and pasting the output*
   (CLAUDE.md's dominating rule; a described test is not a passed test).

## Method and cautions

- Apply the collapse test to every load-bearing decision, dispatch the independent
  collapse-hunt, run `/expert-review`, and **apply all findings** — but weigh the
  collapse-hunt's findings yourself against the mission (this session's conduct-genre
  episode shows the hunt can misfire).
- The recurring failure shape here is **reduction** — collapsing a deliberately
  broad requirement into a narrow, easier-to-build mechanism, or relocating the hard
  part into a step labeled "deterministic" and leaving it unbuilt. When a design
  feels clean, check what breadth you dropped to earn the cleanliness.
- Verify a premise by exercising the **actual** artifact the design ships (command,
  flags, schema), never a near-enough proxy.
