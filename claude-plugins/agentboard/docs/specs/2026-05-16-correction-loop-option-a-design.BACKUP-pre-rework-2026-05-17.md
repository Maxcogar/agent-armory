# Correction Loop — Option A Design Spec

**Status:** DRAFT — awaiting owner approval on paper. No code or plan edits occur until this is approved.
**Date:** 2026-05-16
**Scope owner:** Max Cogar
**Supersedes:** the spec-amendment correction workaround currently implemented in `commands/architecture.md` step 17 (commit `1112a22`).
**Governs:** an amendment to `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md` (the spec of record), which then governs conforming changes to `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md`, the three compose profiles, the design-reviewer profile, and `commands/architecture.md`. Plan first, then code — never the reverse.

This document is a design spec, not an implementation. It contains no profile text and no code. Every decision below is derived from a named governing standard and states which alternatives that standard rules out. The implementer conforms the surfaces to this design; the implementer does not re-decide anything here.

---

## 1. The governing standard for this work

The governing standard for this cleanup is the METHODOLOGY section of `docs/handoffs/2026-05-16-architecture-rework-orchestration-FAILED.md`, together with the invariants already locked in the 2026-05-12 plan and contract. The single load-bearing rule, quoted: a design decision must not be *"invented inside an implementation subagent"* and run-time design improvisation is the root-cause failure mode that ended the prior effort FAILED. Every decision in §4 is evaluated against this standard, not against what the current code does.

## 2. The contradiction being resolved

Three statements in the committed artifacts cannot coexist:

1. **Plan §9 step 17** mandates, for substantive corrections, *"re-spawn compose with corrections context."*
2. **Plan §1.3 / §1.4 / §1.5** (compose boundary contracts) declare compose's consumed inputs as `spec_path`, `verified_level`, `scaffold_card_id`, `agent_id`, and the verified bundle. **No corrections input is declared.**
3. **Contract line 197**: *"Each subagent invocation passes only the inputs that subagent's profile declares it consumes. No 'for your reference' extra context that might bleed orchestration concerns into the subagent's flow."*

Re-spawning compose "with corrections context" is passing an undeclared input — forbidden by (3) because (2) declares no such input.

**Current state of the implemented command (commit `1112a22`, `commands/architecture.md` step 17):** the round-2 fix sidestepped the contradiction by *not* passing corrections to compose at all. Instead it amends the approved spec at `spec_path` via `Edit` and re-runs the pipeline from research. This:

- diverges from plan §9 step 17 (the plan is the spec of record; code now disagrees with it);
- mutates `spec_path` while step 18 commits only the architecture document, so git records an architecture generated from an uncommitted spec revision (FAILED-handoff item 3);
- documents its own "residual limitation" admitting corrections that are not expressible as a spec change have no clean channel — i.e. it collapses the spec/architecture separation the pipeline exists to enforce, which is the design the owner explicitly rejected when choosing Option A.

Option A replaces this workaround entirely.

## 3. What Option A is

Give compose a **declared corrections input** and a **revision mode**. Corrections become a first-class, declared, auditable artifact consumed by compose — not undeclared prompt context (which (3) forbids) and not a spec mutation (which collapses the pipeline's reason for existing). This makes the orchestrator *comply with* contract line 197 instead of contradicting it, and removes spec mutation entirely.

## 4. Design decisions

Each decision states the standard it derives from and the alternatives that standard eliminates. None of these is an owner preference; the single bounded judgment is DD-6.

### DD-1 — Revision behavior: full process re-run at every level

In revision mode, compose re-runs its **entire** process at every level (L1, L2, L3), treating the corrections artifact as an additional **declared governing constraint** alongside `spec` and the verified bundle, and re-derives the whole architecture document.

- **Standard:** FAILED-handoff methodology — design must not be invented inside the implementation agent at run time.
- **Ruled out — targeted/partial revision (any level, including L1):** requires compose to decide, each round, which parts of the prior document to preserve versus rewrite. That preserve/rewrite decision is undeclared design invented at run time — the exact prohibited surface. A smaller instance of a prohibited surface (L1-only) is still prohibited.
- **Why full re-run is the unique answer:** re-deriving the whole document from `spec + verified bundle + corrections` contains zero preserve/rewrite decisions. It is the only option with no instance of the prohibited surface. (Owner-confirmed 2026-05-16; recorded here as derived, not as a preference.)

### DD-2 — Corrections input is a declared `ARCH_CORRECTIONS_V1` artifact

Corrections are carried by a declared workspace artifact, `ARCH_CORRECTIONS_V1`, submitted to the scaffold card by the orchestrator and consumed by compose by artifact id.

- **Standards:** contract line 197 (only declared inputs; no "for your reference" extra); the pipeline's deterministic-audit-trail ethos (the original contract rejected "Shape B" specifically to keep every seam an auditable artifact); the structural validation hook (plan §7) gates artifacts only and cannot see prompt-only fields; `ARCH_DESIGN_REVIEW_V1` (plan §4) already emits the (location, change, finding-link) structure.
- **Ruled out — free-text prompt blob:** un-auditable, un-hookable, and the only non-artifact seam in the pipeline; violates the first three standards.
- **Ruled out — whole-`ARCH_DESIGN_REVIEW_V1`-passthrough:** carries data compose does not consume; violates contract line 197's "no extra context."
- **Conclusion:** a minimal declared artifact carrying only the user-selected/authored change items, in the `ARCH_DESIGN_REVIEW_V1` field shape, is the only form consistent with all four standards.

### DD-3 — Full re-loop every round

After revision-mode compose rewrites the document, the validation hook fires and the design reviewer re-runs before the document returns to the owner — on every round, with no "is this minor?" exception inside the substantive path.

- **Standard:** FAILED-handoff methodology — *"the only thing that caught real defects was an un-directed independent pass"*; the owner may approve only a document state the independent design reviewer has actually examined.
- **Ruled out — substantive-only / hook-only re-review:** lets a revised document state reach the owner without independent review, and the "minor vs substantive" classification is itself a run-time triage judgment (the prohibited invent-at-run-time shape).
- **Conclusion:** every substantive revision round re-runs hook + design reviewer. (Minor corrections remain a direct `Edit` on the document with no compose spawn — see DD-7; that path is unchanged from today and out of this decision's scope because it never produces a new compose artifact.)

### DD-4 — Mode signaling: presence of the corrections artifact

Compose is in revision mode if and only if a `corrections_artifact_id` input is supplied. Absent ⇒ initial mode.

- **Standard:** contract line 197 (inputs must be declared) plus minimalism. A single optional declared input whose presence is the signal needs no second mode flag.
- **Ruled out — separate `mode` parameter:** redundant second input carrying information the corrections-artifact presence already carries.

### DD-5 — Prior document handed to revision compose by path and artifact id

In revision mode compose additionally receives the prior architecture document's `architecture_document_path` and `architecture_document_artifact_id`.

- **Standard:** consistency with the already-blessed in-pipeline pattern. Plan §1.6 already gives the design reviewer *both* the path (direct Read) and the artifact id (fetch fallback) and lets the agent pick. Revision compose has the same need (read the prior document to re-derive against corrections) and uses the same blessed shape.
- **Note:** full re-run (DD-1) means the prior document is an input to *re-derive against corrections*, never a document to diff-and-patch. No preserve/patch instruction may appear in any profile (acceptance criterion AC-5).

### DD-6 — Revision loop is bounded at 3 rounds, then the system diagnoses non-convergence and escalates only the true residual (the one bounded judgment)

After 3 substantive revision rounds without owner approval, the pipeline halts per the existing Halt-conditions discipline and runs a **non-convergence diagnosis** over the round trail before involving the owner. It does not assert an unsupported cause; it also does not abdicate analysis the artifacts support. The candidate causes and how each is determined:

1. **Corrections mutually inconsistent / whack-a-mole** — mechanically determined by the orchestrator: two correction items targeting the same `target` with incompatible `requested_change` (within or across rounds), or an `ARCH_DESIGN_REVIEW_V1` finding (by id/category/citation) marked resolved in round N that reappears in a later round.
2. **Compose non-responsiveness (profile defect)** — mechanically determined: a correction item directed a change to a section/decision/slice and the new `architecture_document` does not reflect it. Systematic non-response across rounds substantiates a compose-profile defect (these profiles are unaudited — FAILED-handoff items 7–10).
3. **Misclassified level** — checked: corrections repeatedly demand something the `verified_level` structurally forbids (e.g. Design-decision rework at L1, whose template has no Design decisions section).
4. **Spec underdetermined vs. architecture in a local optimum** — the genuinely analytical residual. The existing independent `architecture-design-reviewer`, given the round trail, discriminates these as far as the evidence allows; it may legitimately conclude indeterminate.

A determined cause is reported as a **substantiated finding with its evidence** (a proven cause is the opposite of a baked-in one). Only two things reach the owner: (a) the **remedy decision** — which is inherently the owner's even when the cause is proven (e.g. proven-contradictory corrections still need the owner to say which they want); and (b) any **genuinely indeterminate residual** from cause 4 after the independent analytical pass. The orchestrator does not auto-invoke `/foundation`; the owner chooses the remedy (spec repair via `/foundation`, a different architecture, withdrawing corrections, scheduling the items 7–10 audit, or reject) informed by the diagnosis.

- **Standards:** (1) Halt-conditions operability discipline in `commands/architecture.md` — an unbounded correction loop is an operability defect; the loop must be bounded and must halt rather than silently continue. (2) FAILED-handoff methodology / no-papered-over-explanation — this cuts both ways: asserting an unsupported cause is prohibited improvisation, **and** declining analysis the artifacts demonstrably support ("we can't know" when we can) is itself an unsupported claim. The only escalation consistent with both: determine what the trail determines, prove it, and escalate to the owner only the remedy decision and the true post-analysis residual.
- **Diagnostic locus (reasoned, overridable):** the mechanical checks (causes 1–3) are computed by the orchestrator from the structured artifacts it already holds; the analytical residual (cause 4) reuses the existing independent design-reviewer rather than a new agent or any deepening of the unaudited compose profiles. This keeps the diagnosis behind already-present capability and out of the items 7–10 surface. If a different locus is wanted, that is settled in the plan amendment, not improvised in code.
- **Bounded judgment:** the standard requires *a* finite bound; it does not fix the integer. 3 is enough rounds for genuine iteration while still surfacing non-convergence promptly. This is the only value in this document open to owner override; state a flaw and it changes, otherwise it stands as reasoned.

### DD-7 — No spec mutation; the scaffold card is the audit trail

`spec_path` is never edited by the correction flow. Each round's `ARCH_CORRECTIONS_V1`, `architecture_document`, and `ARCH_DESIGN_REVIEW_V1` are artifacts on the scaffold card, bound per round by the existing snapshot-and-diff machinery; that set is the complete audit trail. Step 18 commits only the final approved architecture document, unchanged from today.

- **Standard:** the pipeline's reason for existing — strict spec/architecture separation (original 2026-05-09 design decision; rationale for the owner's Option A choice and rejection of spec-amendment).
- **Consequence:** because the spec is never mutated, the FAILED-handoff item-3 regression (architecture committed from an uncommitted spec revision) cannot occur; step 18 becomes correct without change. Minor (non-substantive) corrections remain a direct `Edit` on the architecture document followed by re-display, with no compose spawn — unchanged from current behavior.

### DD-Bundle — Verified bundle consumed by artifact id, not inline (closes FAILED-handoff items 2, 4, 6)

Compose consumes the verified bundle as a declared `verified_bundle_artifact_id` and fetches it via its already-declared `agentboard_get_workspace_artifact` tool. The inline-blob mandate is removed everywhere (plan §1.3–§1.5, plan §9 step 11, the three profiles).

- **Standards:** plan Preamble rule 3 bans codebase-discovery tools (`rag_*`, `codegraph_*`), **not** artifact fetch — fetch-by-id does not violate "no codebase discovery"; the audit-trail ethos and consistency-with-blessed-pattern (every other pipeline agent — auditor, design reviewer — is given an id and fetches; compose being the lone inline exception has no surviving justification); contract line 197 is satisfied because the id is a declared input.
- **Required consequence (specified here so the implementer does not invent it):** the verified bundle must always exist as a standalone artifact so there is exactly one id regardless of the audit's `any_discrepancy` branch. The orchestrator materializes it at step 9 — it submits the resolved verified bundle (the audit's `corrected_bundle` when `any_discrepancy`, else the original `ARCH_FACTS_BUNDLE_V2` body) as a standalone `ARCH_FACTS_BUNDLE_V2` artifact on the scaffold card and captures its id as `verified_bundle_artifact_id`. The auditor contract (plan §1.2, §3) is unchanged; the audit still embeds `corrected_bundle` for its own audit value.
- **Effect:** one honest name for one thing (item 6 dissolved); no command/profile name mismatch (item 2 dissolved); by-id not inline (item 4 dissolved).

### DD-ReviewerParam — Rename `verified_bundle_artifact_id` → `audit_artifact_id` on the design reviewer (closes FAILED-handoff item 5)

The design reviewer's input presently named `verified_bundle_artifact_id` actually carries the `ARCH_BUNDLE_AUDIT_V2` artifact id; the reviewer resolves the bundle from the audit itself. Rename it to `audit_artifact_id` in plan §1.6, plan §6.6, and `commands/architecture.md` step 14, and remove the apology sentence in the design-reviewer profile (~§6.6 line referenced in the FAILED handoff) that exists only to excuse the wrong name.

- **Standard:** interface honesty / the contract's declared-inputs and no-cross-talk discipline — a parameter name must denote what it carries.
- **Same-change reconciliation (named so they cannot drift):** `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md:106`; `docs/handoffs/2026-05-13-session-6-to-7.md` lines 70 and 96; `hooks/tests/build-fixtures.py:234`; `hooks/tests/fixtures/review_*.json`.
- **Do not conflate:** the auditor's `audited_bundle_artifact_id` (its declared input, the original research bundle) is a different, correctly-named input and is not touched.

**Resulting seam objects (three distinct, honestly-named ids; zero inline bundle blobs):**

| Name | Artifact it identifies | Consumed by |
|---|---|---|
| `audited_bundle_artifact_id` | original `ARCH_FACTS_BUNDLE_V2` (research output) | auditor (unchanged) |
| `audit_artifact_id` | `ARCH_BUNDLE_AUDIT_V2` | design reviewer |
| `verified_bundle_artifact_id` | standalone materialized verified `ARCH_FACTS_BUNDLE_V2` | compose |
| `corrections_artifact_id` (optional) | `ARCH_CORRECTIONS_V1` | compose (revision mode only) |

## 5. `ARCH_CORRECTIONS_V1` — schema intent (design level)

Defined fully in the plan amendment; specified here at the level needed to approve the design.

- `schema_version: "1.0"`.
- Round metadata: `round` (1-based int), `scaffold_card_id`, `prior_architecture_document_artifact_id`, `prior_architecture_document_path`, `prior_design_review_artifact_id`.
- `corrections`: a list of items, each:
  - `id` (e.g. `C1`);
  - `origin`: `"finding-resolution"` or `"user-directed"`;
  - `resolves_finding_id`: the `ARCH_DESIGN_REVIEW_V1` finding id when `origin == "finding-resolution"`, else `null`;
  - `target`: the same shape as `ARCH_DESIGN_REVIEW_V1.document_citation` — `{ section, decision_id_or_slice_name, quoted_text|null }`;
  - `requested_change`: prose statement of the change the user directed;
  - `user_instruction_verbatim`: the user's instruction as given, for provenance.
- `corrections` MAY be empty only in the degenerate case where the user requested re-derivation with no itemized change; an empty list is otherwise invalid (the orchestrator must not submit an empty corrections artifact for a substantive request).
- Submitted by the orchestrator (not by a subagent); structurally gated by the validation hook as a fourth-plus architecture-pipeline artifact type (plan §7 type set extended; structural-only, consistent with the other types).

## 6. Surface-by-surface change map (design level — implementer conforms, does not re-decide)

1. **Plan §1.3 / §1.4 / §1.5 (compose boundary contracts):** replace the inline verified-bundle entry with `verified_bundle_artifact_id`; add optional `corrections_artifact_id`; in revision mode also `architecture_document_path` + `architecture_document_artifact_id` (prior document). Add a "Revision mode" clause: presence of `corrections_artifact_id` ⇒ full process re-run with corrections as a governing constraint; no preserve/patch behavior. "NOT in scope" lines otherwise unchanged.
2. **Plan §6.3 / §6.4 / §6.5 (compose profile specs):** the boundary-contract section gains the Revision-mode clause; Step 2 (bundle ingestion) also fetches and ingests `ARCH_CORRECTIONS_V1` and the prior document when `corrections_artifact_id` is present; the process re-runs in full with corrections added to the governing inputs. No instruction anywhere may tell compose to diff, preserve, or patch the prior document (AC-5, grep-checkable).
3. **Plan §1.6 / §6.6 (design reviewer):** `verified_bundle_artifact_id` → `audit_artifact_id`; delete the apology sentence.
4. **Plan §4 / §7 / §11:** add the `ARCH_CORRECTIONS_V1` schema section; add it to the validation hook's structural type set; add acceptance criteria (this document's §8).
5. **Plan §9 step 9:** add the verified-bundle materialization (DD-Bundle) and capture `verified_bundle_artifact_id`.
6. **Plan §9 step 11:** pass `verified_bundle_artifact_id` (not inline JSON); in a revision round also pass `corrections_artifact_id` and the prior document path + artifact id.
7. **Plan §9 step 14:** `verified_bundle_artifact_id` argument name → `audit_artifact_id`.
8. **Plan §9 step 17 — full replacement.** On substantive request: orchestrator constructs `ARCH_CORRECTIONS_V1` from the user's instructions (each item finding-linked where applicable, else user-directed), submits it to the scaffold card, increments the round counter, and re-enters steps 11–16 in revision mode. Bounded at 3 rounds (DD-6); on the bound, halt, run the non-convergence diagnosis (orchestrator computes the mechanical causes 1–3; the independent design-reviewer discriminates cause 4), and escalate only the remedy decision and any true indeterminate residual — no asserted unsupported cause, no auto-`/foundation`. **No `Edit` on `spec_path` anywhere.** Minor request: direct `Edit` on the architecture document then re-display (unchanged). Remove the "residual limitation" paragraph (it described the rejected workaround).
9. **Plan §9 step 18:** unchanged; now correct because the spec is never mutated.
10. **Contract `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md` ~lines 194–197:** the process bullet (line 196 "apply corrections if any") is refined to name the `ARCH_CORRECTIONS_V1` channel and revision mode. Line 197 is **preserved verbatim** — it is the standard Option A makes the orchestrator comply with. Add one clause: corrections reach compose only via the declared `ARCH_CORRECTIONS_V1` artifact, and the approved spec is immutable within `/architecture`.
11. **`commands/architecture.md`:** conform steps 9, 11, 14, 17, 18 to the amended plan §9. The existing snapshot-and-diff per-round binding machinery is retained (it already supports multi-round; it now binds the corrections and revised-document artifacts per round).

## 7. What this removes / closes

- **Item 1 (the contradiction):** gone — corrections is now a declared input; contract line 197 is complied with, not contradicted.
- **Items 2, 4, 6 (bundle naming / inline / two-names):** closed by DD-Bundle — one honest by-id name, no inline blob.
- **Item 3 (auditability regression):** gone — no spec mutation, so no architecture committed from an uncommitted spec revision; step 18 correct unchanged.
- **Item 5 (misnamed reviewer param):** closed by DD-ReviewerParam, with the four out-of-scope call sites reconciled in the same change.

## 8. Acceptance criteria for the implemented Option A (conformance to this design)

AC-1. Plan §1.3–§1.5 declare `verified_bundle_artifact_id` and optional `corrections_artifact_id`; no inline-verified-bundle mandate remains anywhere in plan, contract, command, or the three profiles (grep-checkable).
AC-2. Plan §1.6, §6.6, command step 14 use `audit_artifact_id`; the design-reviewer apology sentence is gone; the four named call sites are reconciled identically.
AC-3. Plan §9 step 17 and command step 17 contain no `Edit`/amendment of `spec_path`; both construct and submit `ARCH_CORRECTIONS_V1`; both bound the loop at 3 and, on the bound, run the non-convergence diagnosis defined in DD-6 (mechanical causes 1–3 computed; cause 4 to the independent design-reviewer) and escalate only the remedy decision and any true indeterminate residual — asserting no unsupported cause and not auto-invoking `/foundation`.
AC-4. `spec_path` is never written by any step of `/architecture`; step 18 commits only the architecture document.
AC-5. Compose profiles §6.3–§6.5 specify revision mode as a full process re-run with corrections as a governing constraint; zero occurrences of any preserve/diff/patch-the-prior-document instruction (grep-checkable banned phrases listed in the plan amendment).
AC-6. `ARCH_CORRECTIONS_V1` is defined in the plan, included in the validation hook's structural type set, and has a synthetic invalid+valid hook test, consistent with the other artifact types.
AC-7. Plant-watering holds: every sentence added to any profile is an instruction to that subagent (no mixed-audience content).
AC-8. The 2026-05-12 plan and contract remain the spec of record; the plan amendment references this design spec by path; this spec is committed before any conforming code change.
AC-9. The change is implemented plan-first as one coherent set (plan → contract → 3 compose profiles → design-reviewer → command), then put through one un-directed independent review (no checklist relayed to the reviewer).

## 9. Out of scope

- FAILED-handoff items 7–10: the independent un-directed audit of `architecture-compose-l1/l2/l3`, `architecture-research-agent`, `architecture-classification-auditor` against the Session-7 defect patterns. Separate, larger effort; scheduled after this change lands.
- Codex tree: no file mirroring. The separate Codex *document* described in the FAILED handoff is produced only after the claude tree is final.
- The implementation itself: this spec is design only. Implementation begins after owner paper approval, in the AC-9 order.
- Classification threshold calibration; any change to classification rules v1.0; any change to the auditor or research-agent contracts beyond the standalone-artifact materialization in DD-Bundle.

## 10. Sign-off

- [ ] Owner approves this design as the design of record for the Option A correction loop, OR
- [ ] Owner directs specific changes (note them below), after which this spec is revised and re-presented before any plan or code edit.

No plan amendment, contract edit, profile edit, command edit, or commit occurs until the box above is checked.

**Owner notes:**
