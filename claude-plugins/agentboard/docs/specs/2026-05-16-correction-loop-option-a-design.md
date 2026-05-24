# Correction Loop - Design Spec

- Status: Phase 8 derived prose draft
- Derived from: `docs/specs/spec-ledger.yaml`
- Guardrails used: `docs/specs/spec-conflicts.yaml`, `docs/specs/spec-evidence.md`

## 1. The governing standards for this work

Traceability: CL-001, CL-002, CL-003, CL-004, CL-005, CL-006, CL-007

This spec, once approved, is the design of record for the correction loop. During the final review pass, the spec text is checked against three reference sources, each with a distinct role.

1. The owner's stated constraints are the verification basis during review. If the spec text drifts from an owner constraint, the spec is corrected; the constraint is not reframed. After the review closes, the spec stands as the authority and the owner constraints remain historical evidence of what the design must encode.
2. Surviving invariants from the existing plan and contract remain governing technical constraints where this rework does not amend them. The load-bearing surviving invariants for this design are the declared-input discipline, the separation between spec authority and architecture authority, and the existing pipeline boundary contracts for stages this rework does not touch.
3. The engineering evaluation frame for this design is determinism, auditability, interface honesty, and operability, with every design decision checked against both failure poles before being accepted.

Agent operating discipline for implementation and cleanup does not belong inside this product-design spec. That guidance lives in separate agent-facing operating references.

## 2. The contradiction being resolved

Traceability: CL-022, CL-023, CL-024, CL-025, CL-026, CL-027, CL-028, CL-029

The correction loop must support substantive rework of architecture output at the stage where the problem actually originates. That requires more than deciding that a correction is needed. It requires the affected stage to support correction-mode work explicitly.

The current system does not support that correctly. When substantive corrections are routed back into architecture work, the affected stage has no declared correction input for receiving that work, and its instructions only define the initial create-from-scratch flow. The system can therefore determine that revision is required without providing either the interface or the process needed to carry that revision out properly.

This design resolves that contradiction by requiring both of the following:

1. The affected stage must declare a dedicated correction input that carries substantive correction work explicitly.
2. The affected stage must define a correction-mode process that is used when correction work is present.

Existing create-from-scratch inputs do not satisfy the first requirement by themselves. The correction-mode process required by the second requirement must be distinct from the initial create-from-scratch flow. It must tell the stage how to interpret correction work, revise existing output, and operate when the task is rework rather than initial generation.

The current workaround is not the intended design. Substantive correction work must travel as a declared, auditable input rather than as undeclared prompt context or as an implicit workaround inside the architecture flow.

## 3. What this design is

Traceability: CL-008, CL-009, CL-010, CL-022, CL-023, CL-025, CL-026, CL-028

This design defines an explicit correction path for substantive rework. A correction is carried to the stage that must redo work as a declared, auditable input, not as undeclared prompt context and not as an implicit workaround inside the architecture flow.

Three properties define that path:

- Multi-origin. A correction may originate from the design reviewer catching a defect, from the owner directing a change, or from a failure elsewhere in the pipeline that is source-traced back to architecture.
- Routed to the determined origin. The problem goes back to wherever it actually originated, determined in real time rather than by a fixed pre-decided mapping.
- Revision is a first-class mode. When a stage receives correction work, it must follow an explicit correction-mode process rather than trying to use the initial create-from-scratch flow.

The opt-in pause is implemented at the `/architecture` orchestration layer. The AgentBoard blocking-gate mechanism is a separate existing feature that this design does not modify and does not depend on.

## 4. Spec-Modification Boundary

Traceability: CL-012, CL-013, CL-014, CL-015

The architecture correction flow must not directly edit the spec as an in-flow workaround.

If source trace determines that the issue originates in the spec, the spec may be modified on that basis. `/foundation` is not the path for doing so; `/foundation` is for spec creation only.

This design may acknowledge that a non-`/foundation` external path exists for spec modification when source trace lands on the spec, but the mechanics and actor choreography of that path are outside the scope of this design.

## 5. Retry and Investigation Boundary

Traceability: CL-011, CL-016, CL-017, CL-018, CL-019, CL-020, CL-021

The correction loop has a finite retry cap of 3 on the same card. That bound is not a false hard gate that simply stops the loop and hands the problem to the owner without investigation.

When the retry cap is hit, the system hands off to an external investigator agent for root cause analysis rather than dead-halting. The investigation function for repeated failure is separate from review, and the reviewer must not own the decision to stop retrying and begin deeper investigation.

Escalation to the owner after repeated failure occurs specifically when the external source-trace process determines that the origin of the issue is in the spec.

The investigator agent runs automatically at the cap and may use chat logs, card information, and other relevant context or functions, but this spec does not define the investigator's internal behavior.

## 6. Out of Scope

Traceability: CL-006, CL-015, CL-016, CL-021

This spec does not define:

- agent operating discipline for implementation and cleanup;
- the internal behavior of the external investigator agent;
- the detailed mechanics of the external spec-modification path once source trace lands on the spec.
