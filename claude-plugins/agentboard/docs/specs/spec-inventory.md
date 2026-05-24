# Real Spec Inventory

This file inventories the current contents of:

- `docs/specs/2026-05-16-correction-loop-option-a-design.md`

This is an inventory only. It does not reconcile, rewrite, approve, reject, merge, or correct any of the material listed below.

---

## Document Header

### RS-HEAD-01 — Title

- `# Correction Loop — Design Spec`

### RS-HEAD-02 — Status

- Draft status says owner approval on paper is still required before further changes.

### RS-HEAD-03 — Date

- Dated `2026-05-17`.

### RS-HEAD-04 — Scope owner

- Names Max Cogar as scope owner.

### RS-HEAD-05 — Supersedes

- Says it supersedes the spec-amendment correction workaround in `commands/architecture.md` step 17.

### RS-HEAD-06 — Governs

- Says it governs an amendment to the plan, which then governs conforming changes to contract, profiles, and command.

### RS-HEAD-07 — Spec framing

- Says this document is a design spec, not an implementation.
- Says decisions are derived from named governing standards.
- Says implementers conform to the design rather than re-deciding it.

---

## Numbered Sections

### RS-01 — `## 1. The governing standards for this work`

**Current section intent**

- Establishes three governing inputs for the cleanup.

**Contained subparts**

- RS-01-A — FAILED handoff methodology plus locked plan/contract invariants
- RS-01-B — Owner corrections from the 2026-05-17 handoff USER EDITs
- RS-01-C — Expert Standard as engineering evaluation frame

### RS-02 — `## 2. The contradiction being resolved`

**Current section intent**

- States a contradiction between plan step 17, compose declared inputs, and contract line 197.
- Describes the current workaround in `commands/architecture.md` step 17.

**Contained subparts**

- RS-02-A — plan says re-spawn compose with corrections context
- RS-02-B — compose boundary contracts declare no corrections input
- RS-02-C — contract forbids undeclared extra context
- RS-02-D — current workaround edits `spec_path` and reruns from research
- RS-02-E — concluding diagnosis of the workaround

### RS-03 — `## 3. What this design is`

**Current section intent**

- Defines the high-level shape of the correction design.

**Contained subparts**

- RS-03-A — correction is carried as a declared, auditable input
- RS-03-B — multi-origin property
- RS-03-C — routed-to-origin property
- RS-03-D — revision-is-a-first-class-mode property
- RS-03-E — concluding statement about contract compliance and silent spec mutation

### RS-04 — `## 4. Design decisions`

**Current section intent**

- Contains the design decisions and their rationale.

**Contained decision units**

- RS-04-DD1 — `DD-1 — Compose revision is a prescribed targeted re-derivation; the preserve/re-derive boundary is declared, not invented`
- RS-04-DD2 — `DD-2 — The corrections input is a declared, hook-gated artifact`
- RS-04-DD3 — `DD-3 — Re-validation is mandatory every substantive round; the owner pause is opt-in and off by default`
- RS-04-DD4 — `DD-4 — Revision mode is a first-class prescribed process; the corrections input's presence is the entry trigger`
- RS-04-DD5 — `DD-5 — Compose receives the prior architecture document by path and artifact id`
- RS-04-DD6 — `DD-6 — The loop is bounded; on the bound the system source-traces the failure, it does not dead-halt`
- RS-04-DD7 — `DD-7 — The spec is never silently or automatically mutated; a spec-origin problem is surfaced and owner-driven`
- RS-04-DDR — `DD-Routing — Corrections route by real-time source-trace among a known origin set; no static table`
- RS-04-DDB — `DD-Bundle — Verified bundle consumed by artifact id, not inline (closes FAILED-handoff items 2, 4, 6)`
- RS-04-DDP — `DD-ReviewerParam — Rename verified_bundle_artifact_id → audit_artifact_id on the design reviewer (closes FAILED-handoff item 5)`

### RS-05 — `## 5. Corrections artifact — schema intent (design level)`

**Current section intent**

- Defines the intended contents and rules of the corrections artifact at the design level.

**Contained subparts**

- RS-05-A — schema version
- RS-05-B — round metadata
- RS-05-C — corrections item fields
- RS-05-D — unresolved target rule
- RS-05-E — empty-list rule
- RS-05-F — role of artifact by route
- RS-05-G — structural validation-hook note

### RS-06 — `## 6. Surface-by-surface change map (design level — implementer conforms, does not re-decide)`

**Current section intent**

- Maps the design to concrete surface changes.

**Contained items**

- RS-06-01 — plan compose boundary contracts and research/auditor notes
- RS-06-02 — plan compose profile specs and research profile note
- RS-06-03 — plan/design-reviewer rename
- RS-06-04 — plan schema / hook / acceptance additions
- RS-06-05 — plan step 9 verified-bundle materialization
- RS-06-06 — plan step 11 routing-specific pass-through behavior
- RS-06-07 — plan step 14 reviewer parameter rename
- RS-06-08 — plan step 17 full replacement
- RS-06-09 — plan step 18 unchanged
- RS-06-10 — contract line 194–197 refinement
- RS-06-11 — command conformance steps

### RS-07 — `## 7. What this removes / closes`

**Current section intent**

- Claims which known items are closed by the design.

**Contained items**

- RS-07-01 — item 1 contradiction closed
- RS-07-02 — items 2, 4, 6 closed by DD-Bundle
- RS-07-03 — item 3 auditability regression closed
- RS-07-04 — item 5 reviewer parameter closed

### RS-08 — `## 8. Acceptance criteria for the implemented design (conformance to this design)`

**Current section intent**

- Lists acceptance criteria for implementation conformance.

**Contained criteria**

- RS-08-AC1
- RS-08-AC2
- RS-08-AC3
- RS-08-AC4
- RS-08-AC5
- RS-08-AC6
- RS-08-AC7
- RS-08-AC8
- RS-08-AC9
- RS-08-AC10
- RS-08-AC11
- RS-08-AC12

### RS-09 — `## 9. Out of scope (owner-ratified 2026-05-17)`

**Current section intent**

- Declares what is out of scope.

**Contained items**

- RS-09-01 — FAILED-handoff items 7–10 audit deferred/sequenced later
- RS-09-02 — modifying or mirroring Codex plugin tree out of scope
- RS-09-03 — Codex rework document sequenced later
- RS-09-04 — implementation itself out of scope for this spec
- RS-09-05 — classification threshold / classification rules / some contract changes out of scope

### RS-10 — `## 10. Sign-off`

**Current section intent**

- Records sign-off state and post-sign-off claim.

**Contained items**

- RS-10-01 — checked owner approval box
- RS-10-02 — unchecked direct-specific-changes box
- RS-10-03 — states the §10 gate is satisfied and implementation proceeds
- RS-10-04 — owner-notes paragraph asserting approval/walkthrough/derivation/default-bound acceptance

---

## Decision Unit Breakdown

This section isolates the explicit decision-bearing units in the current spec.

### RSD-01 — Governing-input structure

- Lives primarily in RS-01

### RSD-02 — Contradiction framing

- Lives primarily in RS-02

### RSD-03 — High-level correction-path definition

- Lives primarily in RS-03

### RSD-04 — Targeted re-derivation rule

- Lives in RS-04-DD1

### RSD-05 — Corrections artifact rule

- Lives in RS-04-DD2

### RSD-06 — Re-validation and owner-pause rule

- Lives in RS-04-DD3

### RSD-07 — Revision-mode trigger/process rule

- Lives in RS-04-DD4

### RSD-08 — Prior-document input rule

- Lives in RS-04-DD5

### RSD-09 — Retry-bound / non-convergence rule

- Lives in RS-04-DD6

### RSD-10 — Spec-mutation / spec-origin rule

- Lives in RS-04-DD7

### RSD-11 — Route-selection rule

- Lives in RS-04-DDR

### RSD-12 — Verified-bundle by-id rule

- Lives in RS-04-DDB

### RSD-13 — Reviewer parameter rename rule

- Lives in RS-04-DDP

### RSD-14 — Corrections artifact schema-intent rules

- Lives in RS-05

### RSD-15 — Surface-conformance mapping

- Lives in RS-06

### RSD-16 — Closure claims

- Lives in RS-07

### RSD-17 — Acceptance-criteria set

- Lives in RS-08

### RSD-18 — Scope / out-of-scope claims

- Lives in RS-09

### RSD-19 — Sign-off / approval-state claims

- Lives in RS-10

---

## Inventory Status

- The real spec has been broken down into top-level sections and explicit decision-bearing units.
- No duplicate / overlap / conflict analysis has been applied yet in this file.
- This file is an inventory snapshot, not a reconciliation record.
