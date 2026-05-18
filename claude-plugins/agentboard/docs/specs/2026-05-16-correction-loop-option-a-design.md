# Correction Loop — Design Spec

**Status:** DRAFT — awaiting owner approval on paper. No plan, contract, profile, command, or other code edit occurs until §10 is signed.
**Date:** 2026-05-17 (supersedes the 2026-05-16 invented-gates draft of this file; the pre-rework draft is preserved at `docs/specs/2026-05-16-correction-loop-option-a-design.BACKUP-pre-rework-2026-05-17.md`).
**Scope owner:** Max Cogar.
**Supersedes:** the spec-amendment correction workaround currently implemented in `commands/architecture.md` step 17 (commit `1112a22`).
**Governs:** an amendment to `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md` (the spec of record), which then governs conforming changes to `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md`, the three compose profiles, the research-agent and classification-auditor profiles, the design-reviewer profile, and `commands/architecture.md`. Plan first, then code — never the reverse.

This document is a design spec, not an implementation. It contains no profile text and no code. Every decision below is derived from a named governing standard and states which alternatives that standard rules out. The implementer conforms the surfaces to this design; the implementer does not re-decide anything here. No decision below is a hard behavioral gate where the standard calls for a real-time judgment; where the design fixes a behavior it is because the standard fixes it, and that derivation is shown.

---

## 1. The governing standards for this work

This cleanup is evaluated against three governing inputs, not against what the current code does:

1. **The METHODOLOGY section of `docs/handoffs/2026-05-16-architecture-rework-orchestration-FAILED.md`**, together with the invariants locked in the 2026-05-12 plan and contract. The single load-bearing rule, quoted: a design decision must not be *"invented inside an implementation subagent"*; run-time design improvisation is the root-cause failure mode that ended the prior effort FAILED.
2. **The owner's corrections recorded in `docs/handoffs/2026-05-17-correction-loop-design-session-end.md`** (the `[USER EDIT: …]` annotations). These are co-equal governing constraints — the design must conform to what the owner actually specified, not only to "do not improvise." In force: corrections have multiple origins; the origin of a problem is determined in real time, not by a static routing table; the owner-pause is opt-in, never mandatory (the owner built this system so as not to babysit every step); no hard gate may force a fixed behavior where the situation requires an in-the-moment determination; agents investigate the origin of repeated failure themselves and escalate to the owner only where the standard requires it.
3. **The Expert Standard** — every decision is judged against established engineering discipline (determinism, auditability, interface honesty, operability), tested against *both* failure poles (an over-rigid hard gate, and under-defined run-time improvisation), not against codebase precedent.

## 2. The contradiction being resolved

Three statements in the committed artifacts cannot coexist:

1. **Plan §9 step 17** mandates, for substantive corrections, *"re-spawn compose with corrections context."*
2. **Plan §1.3 / §1.4 / §1.5** (compose boundary contracts) declare compose's consumed inputs as `spec_path`, `verified_level`, `scaffold_card_id`, `agent_id`, and the verified bundle. **No corrections input is declared.**
3. **Contract line 197**: *"Each subagent invocation passes only the inputs that subagent's profile declares it consumes. No 'for your reference' extra context that might bleed orchestration concerns into the subagent's flow."*

Re-spawning compose "with corrections context" passes an undeclared input — forbidden by (3) because (2) declares no such input.

**Current state of the implemented command (commit `1112a22`, `commands/architecture.md` step 17):** the round-2 fix sidestepped the contradiction by *not* passing corrections to a subagent at all. Instead it amends the approved spec at `spec_path` via `Edit` and re-runs the pipeline from research. This:

- diverges from plan §9 step 17 (the plan is the spec of record; code now disagrees with it);
- **silently and automatically** mutates `spec_path` while step 18 commits only the architecture document, so git records an architecture generated from an uncommitted spec revision (FAILED-handoff item 3);
- documents its own "residual limitation" admitting corrections not expressible as a spec change have no clean channel.

The defect of that workaround is that it makes **silent, automatic spec amendment the correction channel**. The corrected design removes that — *without* adopting the opposite error of forbidding the spec to ever change (see §4 DD-7).

## 3. What this design is

A correction is carried to the stage that must redo work as a **declared, auditable input** — not undeclared prompt context (which contract line 197 forbids) and not a silent/automatic spec mutation (which collapses the spec/architecture separation the pipeline exists to enforce). Three properties follow and are derived in §4:

- **Multi-origin.** A correction may originate from the independent design-reviewer catching a defect, from the owner directing a change, or from a failure elsewhere in the pipeline that is source-traced back to architecture. The carrier is the same in every case.
- **Routed to the determined origin.** The caught problem goes back to **wherever it actually originated**, determined in real time from the finding/trace — among three concrete routes: the architecture document (→ compose in revision mode), the verified bundle (→ a fresh research→audit pass), or the spec (→ surfaced to the owner). Not a static routing table (DD-Routing).
- **Revision is a first-class prescribed mode.** When the route is the architecture document, compose enters a prescribed *revision mode* (DD-1/DD-4) — not a flag bolted onto a process built only for initial composition. The corrections input's presence is the entry trigger; the prescribed revision process is the mode.

This makes the orchestrator *comply with* contract line 197 instead of contradicting it, and removes silent spec mutation.

## 4. Design decisions

Each decision states the standard it derives from and the alternatives that standard eliminates. The single owner-tunable value is the DD-6 bound integer; it is defaulted and non-blocking.

### DD-1 — Compose revision is a prescribed targeted re-derivation; the preserve/re-derive boundary is declared, not invented

In a compose revision re-run, compose re-derives **only the decisions/sections the corrections artifact's `target` field names**, through the same five-part / Clear-Thought decision discipline its initial process uses; it carries **every non-targeted decision forward verbatim by Reading the prior architecture document**; and it **unconditionally re-runs every whole-document validator** — the traceability matrix, Gates A/B/C, the trap audit, and Card-Slices re-derivation (slices are derived *from* the committed document, so a changed document with stale slices fails Gate C by construction).

- **Standard:** the FAILED-handoff methodology — design must not be invented inside the implementation agent at run time.
- **Why this is correct, not a preference:** the preserve/re-derive partition is **declared upstream in the corrections artifact's `target` field** (constructed by the orchestrator from the finding / user instruction / source-trace), so compose executes a prescribed partition rather than judging, each round, which parts to keep — zero run-time design invention. The whole-document validators re-run unconditionally, so there is no "is this minor?" triage either.
- **Ruled out — full re-derivation of every decision every round:** re-running every step (knowledge-state baseline, every Context7 verification, the threat model, every untouched decision) on a narrow correction churns decisions no correction touched — manufacturing the whack-a-mole non-convergence the bound (DD-6) exists to catch — and is needlessly expensive. It is *safe* against run-time invention but defeats the correction's intent. This was the prior draft's ungrounded absolutism (asserted "Owner-confirmed"; that attribution was fabricated and is gone).
- **Ruled out — diff/preserve/patch the prior document at run time:** that makes compose decide which parts to keep — undeclared design invented at run time, the exact prohibited surface.
- **Consequence (surface-contradictions standard):** if the orchestrator cannot resolve a correction to a concrete `target`, the correction is underspecified — it is surfaced to the owner, never handed to compose to guess a target.
- **Derived from the real profiles:** compose L1/L2/L3 produce design decisions in an independently-re-derivable five-part unit and derive Card Slices *from* the committed document in a separate pass; that structure is what makes a declared-target partition possible without invention.

### DD-2 — The corrections input is a declared, hook-gated artifact

Corrections are carried by a declared workspace artifact submitted to the scaffold card by the orchestrator; on the `architecture-document` route it is additionally consumed by compose (in revision mode) by artifact id. (Artifact name and schema are fixed in the plan amendment; §5 specifies only the design-level intent.)

- **Standards:** contract line 197 (only declared inputs; no "for your reference" extra); the pipeline's deterministic-audit-trail ethos (the original contract rejected a non-artifact seam specifically to keep every seam auditable); the structural validation hook (plan §7) gates artifacts only and cannot see prompt-only fields; `ARCH_DESIGN_REVIEW_V1` (plan §4) already emits the (location, change, finding-link) structure the carrier reuses.
- **Ruled out — free-text prompt blob:** un-auditable, un-hookable, and the only non-artifact seam in the pipeline; violates the first three standards.
- **Ruled out — whole-`ARCH_DESIGN_REVIEW_V1`-passthrough:** carries data compose does not consume; violates contract line 197's "no extra context."
- **Conclusion:** a minimal declared artifact carrying only the change items, in the `ARCH_DESIGN_REVIEW_V1` field shape, is the only form consistent with all four standards. Its **presence** is compose's entry trigger into the prescribed revision mode (DD-1 / DD-4) — the mode is a prescribed process, not merely the signal.

### DD-3 — Re-validation is mandatory every substantive round; the owner pause is opt-in and off by default

These are two distinct gates the prior draft wrongly fused.

- **Re-validation (mandatory):** after a correction re-run produces a new artifact, the structural validation hook and the independent design-reviewer re-run before that artifact is accepted — on **every** substantive round, with no "is this minor?" exception in the substantive path.
  - **Standard:** FAILED-handoff methodology — *"the only thing that caught real defects was an un-directed independent pass"*; a self-assessed "minor, skip review" call is itself a run-time triage invention (the prohibited shape).
- **Owner pause (opt-in, default off):** the loop runs validate → correct → re-derive → re-validate **autonomously**. It does not stop for the owner each round. It stops for the owner only when (a) the owner has explicitly opted the pause on for this run, or (b) an escalation condition fires (DD-6 / DD-7 spec-origin).
  - **Standard:** the owner's 2026-05-17 corrections, verbatim in force — *"i made this system so i dont have to babysit every singel step… i want the option to have it pause, but only when i want it to."* A mandatory per-round owner gate is the rejected design.
  - **Mechanism, no app change now (closes the prior draft's conflation):** the opt-in pause is a declared parameter of `/architecture` (orchestration-level), default off. The AgentBoard app's manual-sign-off blocking mechanism — which the owner wants extended to architecture *eventually* — is **not** changed by this work and is **not** depended on by it. This design must function with no AgentBoard application change.

### DD-4 — Revision mode is a first-class prescribed process; the corrections input's presence is the entry trigger

Revision mode is a real, first-class operating mode with a prescribed process (DD-1), authored **per compose profile** (consistent with the locked decision that L1/L2/L3 are independently authored with no shared conditional logic). A compose stage enters revision mode if and only if the declared corrections input is supplied; absent ⇒ initial run. No separate `mode` parameter is added — the corrections input's presence is the trigger; the prescribed revision process is the mode.

- **Standard:** contract line 197 + minimalism for the *signal*; the FAILED-handoff no-improvisation standard for *why the mode must be a prescribed process and not a flag* — a process built for initial composition, handed a correction with no prescribed revision phase, improvises (the prohibited surface). This is the structural flaw the owner identified: the compose profiles' entire workflow assumes from-scratch composition.
- **Ruled out — a redundant separate `mode` parameter:** the corrections input's presence already carries the signal; a second flag is redundant.
- **Ruled out — "revision mode is just a flag, no distinct process":** that is exactly what forces the initial-composition process to improvise on a correction. Rejected; revision mode is a prescribed process.
- **Research and auditor are not compose:** they have no revision process. Research receives only a prior-bundle-reuse-suppression signal (DD-Routing); the auditor is unchanged (it already re-derives independently).

### DD-5 — Compose receives the prior architecture document by path and artifact id

In a compose revision re-run, compose additionally receives the prior architecture document's path and artifact id.

- **Standard:** consistency with the already-blessed in-pipeline pattern — plan §1.6 already gives the design reviewer *both* the path (direct Read) and the artifact id (fetch fallback) and lets the agent pick.
- **Use:** under DD-1 compose Reads the prior document to carry non-targeted decisions forward verbatim and to re-derive the targeted ones against the corrections; it never diff-and-patches it (AC-5).
- **Research and auditor:** neither receives a prior artifact as a revision input. Research's bundle-origin re-run is a fresh re-measure with prior-bundle reuse suppressed (DD-Routing); the auditor must re-derive independently and must not be handed a prior artifact or a correction as guidance — anchoring before independent measurement is the precise failure mode its profile exists to prevent.

### DD-6 — The loop is bounded; on the bound the system source-traces the failure, it does not dead-halt

The correction loop has a finite bound on same-origin re-attempts.

- **The bound exists — standard:** operability (Expert Standard) — an unbounded correction loop is an operability defect; the loop must be bounded.
- **What the bound triggers — standard:** the owner's 2026-05-17 corrections in force — repeated non-convergence is *not* a dead halt that dumps the problem on the owner. On reaching the bound the system performs the **real-time source-trace** that is core to this whole design (DD-Routing): it determines where the failure actually originates and routes the correction there. It escalates to the owner **only** when the trace lands on an underdetermined / ambiguous / contradictory spec (DD-7) — the one case the owner explicitly wants surfaced, because silent spec changes have previously produced features that did not match the original spec. The system does not assert an unsupported cause and does not auto-invoke `/foundation`; where the trace is genuinely indeterminate after analysis it says so rather than inventing a cause (no-papered-over-explanation standard).
- **Ruled out — "hit cap → halt → run a fixed N-cause diagnosis taxonomy → hand to owner":** the fixed cause taxonomy is itself run-time-invention-shaped and was pattern-matched from review/audit rework; the dead-halt-and-dump contradicts the owner's stated model. Removed.
- **The bound integer (the one owner-tunable value):** the standard requires *a* finite bound; it does not fix the integer. **Default: 2** — consistency with the existing workspace-orchestration review cap (a verifiable in-repo convention), small enough to surface non-convergence promptly, large enough for one genuine iteration. This is the only value in this document open to owner override; state a number and it changes, otherwise it stands as reasoned. Non-blocking.

### DD-7 — The spec is never silently or automatically mutated; a spec-origin problem is surfaced and owner-driven

`spec_path` is never edited as a side effect of the correction flow. There is **no** automatic in-flight spec amendment as a correction channel. There is equally **no** hard rule that the spec can never change.

- **Standards:** the pipeline's reason for existing — strict spec/architecture separation (original 2026-05-09 design decision); the surface-contradictions standard; and the owner's 2026-05-17 corrections in force — *"a failed plan could be the cause of architecture as well, or something else entirely… that just has to be determined in real time."*
- **Behavior:**
  - The correction flow performs no silent/automatic `Edit` of `spec_path`. (This is what kills the FAILED-handoff item-3 regression — an architecture committed from an uncommitted spec revision can no longer occur, so step 18 is correct unchanged.)
  - When real-time source-tracing (DD-Routing / DD-6) determines the origin **is** the spec — vague, underdetermined, or contradictory — the flow halts the loop and **surfaces it to the owner as a spec-origin finding**, with evidence. It does not paper it over and does not auto-edit.
  - The owner decides the remedy (repair the spec via `/foundation`, redirect, withdraw the correction, accept, or reject). Any spec change is made through the proper spec channel and committed there — never as a hidden side effect of `/architecture`.
- **Ruled out — both poles:** (a) silent/automatic spec amendment as the channel (the rejected `1112a22` workaround; the item-3 regression); (b) a hard "`spec_path` is never written / the spec is immutable within `/architecture`" gate (the prior draft's overreach, which forbids the in-the-moment determination the owner requires).

### DD-Routing — Corrections route by real-time source-trace among a known origin set; no static table

The route is determined in real time from the design-reviewer's finding or the source-trace, among a known set of legal origins:

| Determined origin | Routed to |
|---|---|
| The architecture document is wrong | the level-appropriate compose stage in **revision mode** (DD-1/DD-4) — corrections artifact + prior document as declared inputs |
| The verified bundle is wrong (facts/classification) | a **fresh `architecture-research-agent` → `architecture-classification-auditor` pass**, with research's Step-2 prior-bundle reuse **suppressed** so it re-measures. The correction is **not** fed into research or the auditor. |
| The spec is underdetermined/ambiguous/contradictory | escalate to the owner (DD-7); **not** an in-pipeline redo |

- **Standard:** the owner's 2026-05-17 corrections in force — *"changes can originate from multiple things… corrections based on upstream failures being traced back to architecture"* and the source must be *"determined in real time so the actual source can be found and fixed."*
- **Why bundle-origin is a fresh pass, not a correction into research/auditor (grounded in the real profiles):** the research-agent boundary contract explicitly excludes self-revision (*"Corrections to facts happen at audit… you do not self-revise"*) and its Step-2 prior-bundle reuse would otherwise re-serve the stale wrong bundle; the auditor's entire value is independent re-derivation *before* seeing the bundle, so a correction handed to it as input destroys the anchoring discipline it exists for. The pipeline's prescribed fact-correction mechanism is therefore a fresh research→audit cycle, not a guided re-run.
- **Ruled out — a static finding-type → stage routing table:** it prescribes the origin instead of determining it; contradicts the owner's model and re-introduces a fixed gate where a real-time determination is required.

### DD-Bundle — Verified bundle consumed by artifact id, not inline (closes FAILED-handoff items 2, 4, 6)

The redoing/initial stage consumes the verified bundle as a declared `verified_bundle_artifact_id` and fetches it via its already-declared `agentboard_get_workspace_artifact` tool. The inline-blob mandate is removed everywhere (plan §1.3–§1.5, plan §9 step 11, the three profiles).

- **Standards:** plan Preamble rule 3 bans codebase-discovery tools (`rag_*`, `codegraph_*`), **not** artifact fetch — fetch-by-id is retrieval, not discovery; the audit-trail ethos and consistency-with-blessed-pattern (every other pipeline agent is given an id and fetches; compose being the lone inline exception has no surviving justification); contract line 197 is satisfied because the id is a declared input.
- **Required consequence (specified so the implementer does not invent it):** the verified bundle must always exist as a standalone artifact so there is exactly one id regardless of the audit's `any_discrepancy` branch. The orchestrator materializes it at step 9 — it submits the resolved verified bundle (the audit's `corrected_bundle` when `any_discrepancy`, else the original `ARCH_FACTS_BUNDLE_V2` body) as a standalone `ARCH_FACTS_BUNDLE_V2` artifact on the scaffold card and captures its id as `verified_bundle_artifact_id`. The auditor contract (plan §1.2, §3) is unchanged.
- **Effect:** one honest name for one thing (item 6 dissolved); no command/profile name mismatch (item 2 dissolved); by-id not inline (item 4 dissolved).

### DD-ReviewerParam — Rename `verified_bundle_artifact_id` → `audit_artifact_id` on the design reviewer (closes FAILED-handoff item 5)

The design reviewer's input presently named `verified_bundle_artifact_id` actually carries the `ARCH_BUNDLE_AUDIT_V2` artifact id; the reviewer resolves the bundle from the audit itself. Rename it to `audit_artifact_id` in plan §1.6, plan §6.6, and `commands/architecture.md` step 14, and remove the apology sentence in the design-reviewer profile that exists only to excuse the wrong name.

- **Standard:** interface honesty / the contract's declared-inputs and no-cross-talk discipline — a parameter name must denote what it carries.
- **Same-change reconciliation (named so they cannot drift):** `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md:106`; `docs/handoffs/2026-05-13-session-6-to-7.md` lines 70 and 96; `hooks/tests/build-fixtures.py:234`; `hooks/tests/fixtures/review_*.json`.
- **Do not conflate:** the auditor's `audited_bundle_artifact_id` (its declared input, the original research bundle) is a different, correctly-named input and is not touched.

**Resulting seam objects (honestly-named ids; zero inline bundle blobs):**

| Name | Artifact it identifies | Consumed by |
|---|---|---|
| `audited_bundle_artifact_id` | original `ARCH_FACTS_BUNDLE_V2` (research output) | auditor (unchanged) |
| `audit_artifact_id` | `ARCH_BUNDLE_AUDIT_V2` | design reviewer |
| `verified_bundle_artifact_id` | standalone materialized verified `ARCH_FACTS_BUNDLE_V2` | the redoing/initial stage |
| corrections artifact id (optional) | the declared corrections artifact (§5) | compose, in revision mode only |

## 5. Corrections artifact — schema intent (design level)

Defined fully in the plan amendment; specified here only at the level needed to approve the design.

- A `schema_version`.
- Round metadata: `round` (1-based int), `scaffold_card_id`, the determined route (`architecture-document` / `verified-bundle` / `spec`), the prior architecture document's path + artifact id (present when the route is `architecture-document`), and the prior design-review artifact id.
- `corrections`: a list of items, each:
  - an `id`;
  - an `origin`, covering **all** of: `"user-directed"`, `"finding-resolution"` (from the independent design-reviewer), and `"source-traced"` (a failure elsewhere traced back to architecture);
  - `resolves_finding_id` (the design-review finding id when applicable, else null);
  - `target`: when the route is `architecture-document`, this **must resolve to one or more concrete architecture-document decision/section identifiers (e.g. D#, a named section)** — it is **load-bearing for DD-1's prescribed preserve/re-derive partition**, not mere provenance; for the `verified-bundle` / `spec` routes it records the origin locus for the audit trail only;
  - `requested_change`: prose statement of the change;
  - a provenance field carrying the originating instruction/finding/trace verbatim.
- **Unresolved target rule (DD-1 consequence):** for an `architecture-document` route, if the orchestrator cannot resolve a correction item to a concrete decision/section identifier, the correction is underspecified — it is surfaced to the owner, never submitted with a vague target for compose to interpret.
- The list MAY be empty only in the degenerate case of a re-derivation request with no itemized change; otherwise an empty list is invalid.
- **Roles:** the artifact is always submitted by the orchestrator as the round's auditable record (every seam is an auditable artifact — DD-2 ethos); it is *additionally consumed as a declared input by compose* only on the `architecture-document` route. The `verified-bundle` route's audit trail is the fresh bundle + audit artifacts; the `spec` route's is the surfaced finding + owner decision.
- Structurally gated by the validation hook as an additional architecture-pipeline artifact type (plan §7 type set extended; structural-only, consistent with the other types).

## 6. Surface-by-surface change map (design level — implementer conforms, does not re-decide)

1. **Plan §1.3 / §1.4 / §1.5 (compose boundary contracts):** replace the inline verified-bundle entry with `verified_bundle_artifact_id`; add the optional corrections-artifact id and, when present, the prior architecture document path + id; add the revision-mode clause (presence of the corrections input ⇒ the prescribed revision process of DD-1; no diff/preserve/patch of the prior document). **Plan §1.1 (research-agent) boundary contract:** add a declared prior-bundle-reuse-suppression signal for a bundle-origin re-run — *not* a corrections input. **Plan §1.2 (classification-auditor) boundary contract:** unchanged (it already re-derives independently). "NOT in scope" lines otherwise unchanged.
2. **Plan §6.3 / §6.4 / §6.5 (the three compose profile specs):** add a prescribed **revision-mode process section** to each, authored per profile (DD-1): on corrections-input present, fetch + ingest the corrections artifact and the prior document; re-derive only the `target`-named decisions/sections through the profile's existing five-part / Clear-Thought discipline; carry every non-targeted decision forward verbatim by Reading the prior document; unconditionally re-run the traceability matrix, Gates A/B/C, the trap audit, and Card-Slices re-derivation. No instruction may tell compose to diff, preserve, or patch the prior document (AC-5, grep-checkable). **Plan §6.1 (research-agent):** Step 2's prior-bundle reuse is suppressed when the reuse-suppression signal is set, so it re-measures. **Plan §6.2 (classification-auditor):** unchanged.
3. **Plan §1.6 / §6.6 (design reviewer):** `verified_bundle_artifact_id` → `audit_artifact_id`; delete the apology sentence.
4. **Plan §4 / §7 / §11:** add the corrections-artifact schema section; add it to the validation hook's structural type set; add the acceptance criteria of §8.
5. **Plan §9 step 9:** add the verified-bundle materialization (DD-Bundle) and capture `verified_bundle_artifact_id`.
6. **Plan §9 step 11:** pass `verified_bundle_artifact_id` (not inline JSON); for an `architecture-document`-route correction also pass the corrections-artifact id and the prior architecture document path + id to compose; for a `verified-bundle`-route correction set research's reuse-suppression signal and re-run research → auditor fresh (no corrections input to either).
7. **Plan §9 step 14:** `verified_bundle_artifact_id` argument name → `audit_artifact_id`.
8. **Plan §9 step 17 — full replacement.** On a correction: the orchestrator determines the route by real-time source-trace (DD-Routing); constructs the corrections artifact from the originating instruction/finding/trace (each item tagged `user-directed` / `finding-resolution` / `source-traced`, with a concrete resolved `target` when the route is `architecture-document` — an unresolvable target is surfaced to the owner, never guessed); submits it to the scaffold card as the round record; increments the round counter; and then, per route: `architecture-document` ⇒ re-enter the level-appropriate compose stage in revision mode with the corrections artifact + prior document; `verified-bundle` ⇒ set research's reuse-suppression signal and run a fresh research → auditor pass; `spec` ⇒ surface to the owner (DD-7), no in-pipeline redo. The loop is bounded (DD-6 default 2); on the bound it performs the source-trace and routes to the determined origin, escalating to the owner only on a spec-origin determination as an evidenced finding, asserting no unsupported cause, not auto-invoking `/foundation`. **No silent/automatic `Edit` of `spec_path` anywhere.** The owner pause is opt-in (DD-3): the loop does not stop for the owner each round unless the pause was opted on. The only direct-`Edit`-then-redisplay path that bypasses the corrections artifact is a change that **provably alters no design content** (touches no decision, slice, contract, or classification) — and even then the structural validation hook still runs before redisplay; only the prescribed revision re-derive + design-reviewer is skipped, justified because the design content is identical by construction. There is no subjective "minor" judgment. Remove the "residual limitation" paragraph (it described the rejected workaround).
9. **Plan §9 step 18:** unchanged; now correct because the spec is never silently/automatically mutated.
10. **Contract `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md` ~lines 194–197:** the process bullet is refined to name the declared corrections channel and the correction re-run. **Line 197 is preserved verbatim** — it is the standard this design makes the orchestrator comply with. Add one clause: corrections reach a stage only via the declared corrections artifact, and within `/architecture` the spec is never silently or automatically mutated (a spec-origin problem is surfaced to the owner, per DD-7).
11. **`commands/architecture.md`:** conform steps 9, 11, 14, 17, 18 to the amended plan §9. The existing snapshot-and-diff per-round binding machinery is retained (it already supports multi-round; it now binds the corrections and re-derived artifacts per round).

## 7. What this removes / closes

- **Item 1 (the contradiction):** gone — corrections is now a declared input; contract line 197 is complied with, not contradicted.
- **Items 2, 4, 6 (bundle naming / inline / two-names):** closed by DD-Bundle — one honest by-id name, no inline blob.
- **Item 3 (auditability regression):** gone — the correction flow never silently or automatically mutates the spec (a spec-origin problem is surfaced and owner-driven, committed through the proper channel), so no architecture is ever committed from an uncommitted spec revision; step 18 is correct unchanged.
- **Item 5 (misnamed reviewer param):** closed by DD-ReviewerParam, with the four out-of-scope call sites reconciled in the same change.

## 8. Acceptance criteria for the implemented design (conformance to this design)

AC-1. The redo-target stages' boundary contracts declare `verified_bundle_artifact_id` and the optional corrections-artifact id; no inline-verified-bundle mandate remains anywhere in plan, contract, command, or the profiles (grep-checkable).
AC-2. Plan §1.6, §6.6, command step 14 use `audit_artifact_id`; the design-reviewer apology sentence is gone; the four named call sites are reconciled identically.
AC-3. Plan §9 step 17 and command step 17 contain no silent/automatic `Edit` of `spec_path`; both construct and submit the corrections artifact; both bound the loop (default 2) and, on the bound, perform the real-time source-trace (DD-Routing) and escalate to the owner only on a spec-origin determination as an evidenced finding — asserting no unsupported cause and not auto-invoking `/foundation`; there is no fixed N-cause diagnosis taxonomy.
AC-4. `spec_path` is never written as a side effect of any step of `/architecture`; step 18 commits only the architecture document.
AC-5. Each of the three compose profiles specifies a prescribed revision-mode process (DD-1): targeted re-derivation of only the `target`-named decisions, non-targeted decisions carried forward verbatim by Read, and unconditional re-run of traceability + Gates A/B/C + trap audit + Card-Slices re-derivation; zero occurrences of any diff/preserve/patch-the-prior-document instruction (grep-checkable banned phrases listed in the plan amendment). The research-agent profile specifies prior-bundle-reuse suppression on a bundle-origin re-run; the classification-auditor profile is unchanged by revision.
AC-6. The corrections artifact is defined in the plan, included in the validation hook's structural type set, and has a synthetic invalid+valid hook test, consistent with the other artifact types.
AC-7. Plant-watering holds: every sentence added to any profile is an instruction to that subagent (no mixed-audience content).
AC-8. The 2026-05-12 plan and contract remain the spec of record; the plan amendment references this design spec by path; this spec is committed before any conforming code change.
AC-9. The change is implemented plan-first as one coherent set (plan → contract → research/auditor/3 compose profiles → design-reviewer → command), then put through one un-directed independent review (no checklist relayed to the reviewer).
AC-10. Routing is a real-time source-trace among {architecture document, verified bundle, spec} (DD-Routing); there is no static finding-type → stage table anywhere; an `architecture-document` determination routes to compose revision mode, a `verified-bundle` determination triggers a fresh research(reuse-suppressed)→audit pass and is never fed as a correction input to research or the auditor, and a `spec` determination surfaces to the owner and is never auto-edited.
AC-11. The owner pause is opt-in and off by default (DD-3); no step makes owner approval a mandatory per-round gate; the design requires no AgentBoard application change and does not depend on the app's blocking mechanism.
AC-12. For an `architecture-document`-route correction, every corrections item carries a concrete resolved `target` (decision/section identifier); an unresolved target causes the correction to be surfaced to the owner as underspecified and is never submitted for compose to interpret (DD-1 / §5 unresolved-target rule).

## 9. Out of scope (owner-ratified 2026-05-17)

- **FAILED-handoff items 7–10:** the independent un-directed audit of `architecture-compose-l1/l2/l3`, `architecture-research-agent`, `architecture-classification-auditor` against the Session-7 defect patterns. Separate, larger effort; scheduled after this change lands.
- **Modifying or mirroring the Codex plugin tree:** `codex-plugins/agentboard/` is **never edited or mirrored** by this work — hard out of scope, in every circumstance.
- **The Codex rework document** is a real, intended deliverable — not abandoned and not blanket-excluded. It is sequenced after the Claude tree is final and is therefore not part of *this* correction-loop spec task; its exclusion here is one of sequencing, not of intent.
- **The implementation itself:** this spec is design only. Implementation begins after owner paper approval, in the AC-9 order.
- **Classification threshold calibration; any change to classification rules v1.0; any change to the auditor or research-agent contracts beyond the standalone-artifact materialization in DD-Bundle.**

## 10. Sign-off

- [x] **Owner (Max Cogar) approves this design as the design of record for the correction loop — approved 2026-05-17.**
- [ ] Owner directs specific changes (note them below), after which this spec is revised and re-presented before any plan or code edit.

The §10 gate is satisfied. Implementation proceeds plan-first per §6 / AC-9, design frozen.

**Owner notes:** Approved after a structured §1–§10 walkthrough. Revision-mode design (DD-1 / DD-4 / DD-Routing) was derived from the actual `architecture-compose-l1/l2/l3`, `architecture-research-agent`, and `architecture-classification-auditor` profiles, not pattern-matched. DD-6 bound integer accepted at the reasoned default of 2.
