# Context Oracle — Phase 0 specification

**Status: DRAFT, not authority.** Written 2026-08-01. It becomes the governing
Phase 0 spec only after an independent adversarial collapse-hunt and an
expert-review, with all findings applied — same discipline as the parent spec.
Until then `docs/specs/spec-context-oracle.md` governs.

**Why this document exists.** On 2026-07-31 Max Cogar asked of the parent spec:
*"3 phases in one spec. WHY?"* The project's own record of that collapse
(`docs/collapse-log.md`, 2026-07-31) states the defect as: *"the governance
mandates **specifying and architecting** Phase 1 and Phase 2 twice: once now
against nothing, and once later against measurements. Only the second can be
real."* The fix applied covered only the architecting half — `CLAUDE.md` was
amended so the architecture is written per phase. The specifying half was left in
place: the parent spec still specifies all three phases, marking Phase 1 and 2
requirements *"provisional"* (§12). This document applies the other half of the
fix he actually asked for.

**Relationship to the parent spec.** Every requirement here traces to a parent
requirement, an owner decision, or a named judgment. Nothing is invented. Where
the parent spec contradicts itself on a Phase 0 matter, this document **names the
contradiction and states the decision required** rather than silently picking a
side — those are listed in §7 and are the first work, not deferred detail.

---

## 1. What Phase 0 is

Phase 0 is the oracle without its judgment layer: it observes a session through
harness hooks, holds a store of facts mined from the repository, and speaks when
a deterministic lookup keyed by the current event finds something. No model is
involved in any part of it.

**Mission, unchanged and undiluted** (parent §1): *deliver the fact that would
change the agent's next decision, at the moment of that decision, without being
asked.* Phase 0 serves that mission with the subset of facts a deterministic
lookup can find. It is not a preview, a prototype, or a measurement rig — the
facts it delivers are cold-checkout-invisible knowledge, which the founding
document names as the reason the tool exists (`RETHINK.md` §1, §4 Tier 1).

**Phase 0 is not degraded mode.** Degraded mode (parent FR-J3, architecture D20)
is a *runtime fallback* entered when the model path is unreachable — a mode
machine with a probe, a raised bar, and a spoken notice. Phase 0 is a *build
stage* in which no model path exists to fail. The parent spec fuses them (§12:
*"Degraded mode is the product at this phase"*) while placing AC-10, the criterion
that verifies degraded mode, in Phase 2; the architecture's own build order puts
D20's state machine at step 9, after the Phase 0 exit at step 8. Phase 0
therefore ships **no** mode machine, **no** degraded-mode notice, and **no**
raised-bar delta compensating for an absent model. It ships the real bar.

## 2. What Phase 0 must produce

Two products, both required. Neither is subordinate to the other.

**2.1 Whispers that serve the mission**, on the genres §4 admits, delivered under
the parent spec's delivery, security and latency requirements.

**2.2 The measurements later phases are gated on.** Parent §12 gates Phase 1's
exit on *"measured silence and hit rates reviewed against the bar"* and Phase 2's
on a demonstrated between-session improvement. Those measurements exist only if
Phase 0 emits them.

**This is where the parent spec is currently broken, and Phase 0 cannot be built
around it.** Parent §9.2 states its metrics are *"Measured from the FR-X6 log by
the distiller"*; uptake detection is likewise the distiller's; and the distiller
is a **Phase 2** component (parent §12). So Phase 1's exit depends on a Phase 2
component. Splitting the metrics resolves part of it and isolates the rest:

| Measurement | Data it needs | Available in Phase 0? |
|---|---|---|
| **Silence rate** — events with no whisper ÷ events observed | hook invocations with outcome (whisper / silence / timeout / error) | **Yes.** FR-M1 already requires exactly this log. No distiller needed. |
| **Latency profile** (NF-1 conformance) | per-event latency | **Yes.** FR-M1 requires it. |
| **Whisper volume / token overhead** (NF-2) | whisper log with evidence | **Yes.** FR-X6 applies to every whisper, so it is Phase 0 by necessity — Phase 0 emits whispers. |
| **Hit rate** — whispers with observed uptake ÷ whispers sent | an uptake predicate evaluated per delivered whisper | **No.** Uptake detection is assigned to the distiller (Phase 2). |
| **False-fire rate** (§9.2 ladder) | warnings contradicted by outcome or narration | **No.** Narration reading is Phase 1; the ladder is Phase 2. |

**PH0-Q1 (open, blocking — the first decision this spec needs).** Hit rate is
named in Phase 1's exit and no Phase 0 component computes it. Exactly one of the
following is true, and the parent spec must be changed to say which:

1. **Uptake recording moves into Phase 0** — the per-whisper uptake predicate is
   evaluated and recorded as Phase 0 runs; the distiller (Phase 2) later
   *aggregates and learns from* those records rather than producing them. This
   preserves Phase 1's exit as written. Note this is a real Phase 0 cost: D10a
   names an uptake predicate per genre, and predicates that cannot be evaluated
   deterministically in Phase 0 must be identified, not assumed.
2. **Phase 1's exit is wrong as written** and must name only measurements Phase 0
   can produce.

This is a spec-level contradiction, not a design choice, and it is not this
document's to resolve unilaterally — but nothing downstream can be settled while
it stands. It is the first item in `docs/STATUS.md`.

## 3. Requirements in force for Phase 0

Selected from the parent spec. Each carries its parent identifier; the parent
text governs and is not restated where it is already precise.

**Observation** — FR-O1 (event set), FR-O2 (shims logic-free), FR-O3 (fail open;
p95 ≤ 1.5 s, ceiling 3 s), FR-O4 (no deny path, structurally), FR-O4a
(continuation bounded to one), FR-O5 (event boundaries only, never timers).

*FR-O6 (subagent delivery) — see PH0-Q3 in §7.*

**Knowledge** — FR-K1 (Tier 2 structural index), FR-K2 (co-change graph with its
mining hygiene as requirements), FR-K6 (provenance mandatory; records without it
unrepresentable), FR-K7 (staleness lowers confidence, never blocks or spams),
FR-K8 (two stores, both outside the repository tree).

FR-K3/K4/K5 (exemplar, landmine, invariant records) are **schema-present,
writer-partial** in Phase 0 per architecture D18: the tables exist with
provenance constraints; v1's only writers are `human_facts` promotion and the
literal-match landmine path that minimal orientation requires. Creating the
schemas in Phase 0 is a migration-cost decision recorded in D18 and is not
re-opened here.

FR-K9 (export/import) is **not** Phase 0 — parent §12 assigns it to Phase 2.

**Attention** — FR-A1 (the judgment question, answered deterministically in
Phase 0: default silence), FR-A3 (budgets; at most one whisper per event), FR-A4
(dedup against Tier 3 state), FR-A5 (confidence × decision-impact, with the
evidence floors), FR-A6 (cold start), FR-A7 (first impressions).

*The FR-A5 bar is a Phase 0 blocker in its current architectural form — see
PH0-Q2 in §7.*

**Delivery** — FR-D1 (whisper format), FR-D2 (informative, never imperative),
FR-D3 (warning subtype with mechanical evidence and false-fire clause), FR-D4
(agent-facing channel is hook injection only; human notices never consume agent
context), FR-D5 (co-change claims always state their evidence ratio).

**Security — in force in full, no phase reduction.** FR-X1 (secret detection
before any store, whisper, log, or prompt), FR-X2 (repo text is data, never
instruction), FR-X3 (injection-suspect content by pointer only), FR-X4 (trust
origin preserved), FR-X5 (least privilege; read-only repo; no network — in Phase 0
there is no model call, so the exception in FR-X5 does not yet apply), FR-X6
(every whisper logged with its evidence), FR-X7 (stores local, no telemetry),
FR-X8 (adversarial fixtures).

**Self-observability** — FR-M1 (structured diagnostic log), FR-M2 (self-detection
of failure classes; `ctxoracle status` in plain language), FR-M4 (diagnostics
never touch agent context, never leave the machine).

FR-M3 (distiller self-report) is Phase 2.

**Non-functional** — NF-1 (latency), NF-2 (token overhead), NF-3 (incremental
indexing after first build).

**Constraints** — C-1 (cold-container ready), C-2 (warm session state), C-3
(harness knowledge confined to shims; neutral event contract), C-4 (explicit
`init`/`deinit`; no passive bootstrap), C-5 (hooks contract re-verified at
implementation; degrade to silence on drift).

**Owner-locked decisions in force** — no gates or deny paths of any kind
(RETHINK §12 decision 3); no credentials of the oracle's own (decision 2 — in
Phase 0 there is no model path at all); no writes inside the repository tree
except hook wiring on explicit `init`; no compiled context packages and no
agent-required ceremony.

## 4. Genres in Phase 0

**Not settled here.** The parent spec sets Phase 0's genres by reference to
FR-J3's degraded-mode set — a runtime-mode definition used as a build-stage
definition, which §1 of this document rejects. Two attempts to supply a
replacement rule were written and killed by adversarial passes on 2026-08-01
(`docs/reviews/`), and the second was killed partly because a rule was written
before the measurement question in §2 was answered.

**The order is therefore fixed: PH0-Q1 first, then the genre set.** What can be
stated now without a rule:

- **No genre is dropped from v1.** Deciding which phase builds a genre is
  sequencing; removing one is scope, and scope is the owner's (`CLAUDE.md`). Any
  genre not built in Phase 0 is assigned a later phase **by name** in the parent
  spec, with the blocker that put it there recorded. A deferral with no named
  destination is a descope and is prohibited.
- **Exclusion arguments route to the bar, not to this document.** An argument
  that a genre's content is too easily self-served is a materiality judgment,
  which FR-A5 makes per candidate at runtime and tunable from measurement.
  Making it here makes it permanent and unmeasurable
  (`docs/collapse-log.md`, 2026-08-01).
- **Two memberships are contested in the parent documents and must be settled,
  not assumed**: Consequence (Lane 1 and free per architecture D10, but assigned
  to Phase 1 by parent §12) and Answer drift (placed in Phase 0 by architecture
  D10a/D20, and in Phase 1 by parent §12 and FR-J3 — open finding R4-C10).

## 5. Acceptance criteria

Phase 0's exit is the parent spec's: **AC-1, AC-2, AC-3, AC-4, AC-5, AC-12,
AC-14, AC-17, AC-18**, plus *"the owner runs it on a real project without
incident."* Two notes, both inherited defects rather than new positions:

- **AC-2 as written is not satisfiable in Phase 0.** It verifies silence against
  P1 and FR-A1, and architecture D20 states that without a model path there is no
  intent signal and therefore no FR-A1 intent-keyed materiality. The silence
  *rate* is measurable (§2.2); the criterion needs restating against what Phase 0
  actually decides. **PH0-Q4.**
- **AC-3's continuation clause needs a live subject.** It asserts that no oracle
  output extends the loop by more than one continuation per stop. That is only
  exercised if Phase 0 contains a genre that fires at `Stop`. Whichever genre set
  §4 settles on must either include one or state that AC-3(b) is fixture-driven.

The second exit clause is not a usability nicety and not a measurement input: the
owner's decision 3 (RETHINK §12) requires the oracle be *"safe to run on real
projects **by construction**"*, and AC-4, AC-12 and AC-14 implement that
guarantee independently of anything Phase 0 measures.

## 6. Explicitly out of scope for Phase 0

Model access and the recursion guard; narration reading and intent tracking;
Tier 3 narration-derived state; the grounded-generation judgment; the conduct
genres (FR-A8, FR-A9); the companion skill; the distiller and every learning
mechanism (FR-L*); the false-fire enforcement ladder; landmine and invariant
*mining*; export/import (FR-K9); the degraded-mode state machine (D20); the
diagnostics self-report (FR-M3).

Out of scope means **assigned to a named later phase**, not dropped.

## 7. Open questions this spec cannot close

Each blocks something named. None is deferred detail.

- **PH0-Q1 — the measurement contradiction (§2.2).** Hit rate is named in
  Phase 1's exit; no Phase 0 component computes it. Blocks the genre set, the
  Phase 0 architecture, and any claim about what Phase 0 yields.
- **PH0-Q2 — the bar.** Architecture D20 removes `self_serve_cost` from
  `decision-impact` in the mode Phase 0 was assumed to run in, leaving
  `structural_weight` alone (open finding R4-4). Since §1 de-equates Phase 0 from
  degraded mode, the question is now direct: **Phase 0 ships the full bar.** What
  must be established is that each of its terms is computable without a model —
  `self_serve_cost` is stated to be deterministic, and `materiality` is stated to
  be model-emitted. A bar with a model-only term cannot run in Phase 0, and no
  substitute may be invented without deciding it as a requirement. Blocks AC-2,
  AC-5, and every genre's admission threshold.
- **PH0-Q3 — subagent delivery (FR-O6).** Spike 2 verified that
  `additionalContext` reaches a subagent's own context, and parent §12 assigns
  FR-O6 to Phase 1 while `[OWNER-8]` requires subagent delivery in v1. Whether
  Phase 0 delivers to subagents changes Tier 3's per-consumer state, which is
  foundational rather than additive. Must be settled before the Phase 0
  architecture, not after.
- **PH0-Q4 — AC-2's restatement (§5).**
- **PH0-Q5 — the twelve open Phase 0 findings from round 4**, triaged in
  `docs/STATUS.md` (2026-07-31 entry). They target decisions this spec inherits
  and must be resolved during the Phase 0 architecture, not carried into it.

## 8. What this document deliberately does not do

It does not choose the genre set, restate the bar, or supply a membership rule.
Two rules were written and killed on 2026-08-01 for being written ahead of their
premises; the lesson recorded in `docs/collapse-log.md` is that the list of what
Phase 0 must emit comes first and the rule, if one is needed at all, follows from
it. This document establishes the boundary, the requirements in force, and the
questions that block — and stops there.
