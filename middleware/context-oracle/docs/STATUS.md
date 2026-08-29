# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## Where the project stands (2026-08-29, in session)

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`, 2026-08-28).
**This session wrote the Phase A architecture document** —
`docs/architecture-phase-a.md` — the lifecycle stage STATUS called for. Its two
mandatory independent adversarial reviews (expert review on the premise/standards
axis; collapse-hunt on the mission-fidelity axis) are **in flight right now**;
their findings will be applied in full and recorded under `docs/reviews/`, and
this file will be rewritten when that lands. Until then the architecture is a
reviewed-pending draft, not an approved artifact — no plan, no build.

What the session established before writing, all against current primary sources
or by direct execution (the architecture's "Verified premises" table V1–V14 holds
the evidence):

- **The hooks contract holds.** `transcript_path` is still documented as written
  asynchronously / may lag (the FR-B1 lag-window clause has a live premise); the
  `PreToolUse` deny channel, `Stop` `additionalContext` channel, timeouts, and
  subagent fields are all as the spec recorded on 2026-08-25. Newly relevant: a
  timed-out `PreToolUse` hook *blocks the tool call* — so the architecture gives
  the handler an internal watchdog that always answers with silence before any
  timeout can fire.
- **The spec's C-2 factual note was stale and is now synced.** Stock Node 22.x
  compiles `node:sqlite` with FTS5 (verified by execution here and in upstream
  `deps/sqlite/sqlite.gyp`); the store therefore needs **zero dependencies** for
  full-text search. The C-2 *requirement* is unchanged; only its superseded
  factual note and the §9 verification date were updated (disclosed here and in
  the PR).
- **The piggyback still works as shipped** (`claude -p … --tools "" --max-turns 1`
  on host auth, no credentials, 4.4 s cold — model calls stay off the synchronous
  path; `--bare` still severs auth and stays banned).
- **A cold spawn-per-event handler costs 45–54 ms** measured — so the
  architecture drops the historical warm-daemon design entirely (its governing
  constraint no longer exists in the current spec).

Also this session: `tools/check_docs.py` now **also gates the per-phase
architecture documents** (requirement keys, ledger keys, §-references) — it
caught a bad citation form in the new document on its first run.

## What the architecture covers (headline)

Phase A per spec §11.5: the seven deterministic whisper genres; the answer-drift
block's safe skeleton (deny plumbing, conservative recognizers, the cached
question/answer state with the lag-window hold, and the named seam Phase B's
model-maintained state plugs into); stores/index/miner; per-consumer delivery
and dedup; self-observability including deny-health signals and the labelled
regret proxy; security controls mapped to T1–T4; the CLI; the test/fixture
architecture pinning each Phase A acceptance criterion. The skill-block
machinery (FR-C1–FR-C4) is explicitly deferred to the Phase C architecture per
the per-phase lifecycle rule; the previous STATUS's listing of FR-C4 chaining
under this document conflicted with that rule, and the standing rule won (the
reconciliation is recorded in the architecture's Scope section).

## What to do next (agent-owned)

1. **Finish the review round in flight**: apply *all* findings from both
   independent passes, record the review files under `docs/reviews/`, re-run
   `tools/check_docs.py`, and rewrite this file to the post-review state. If
   either pass does not converge, run further rounds to convergence before any
   plan work.
2. **Then the Phase A implementation plan** (consuming spec + approved
   architecture), then build against §11.5's Phase A exit and the §14 Phase A
   criteria.

## Open external unknown (unchanged; does not gate v1 design)

Whether a subagent hook's `additionalContext` propagates to the parent is
undocumented; the spec assumes **not** (C-4), and nothing in the Phase A
architecture depends on it. (Spec §13.)
