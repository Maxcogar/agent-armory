# Spec Evidence

## Status

- Artifact status: working
- Workflow phase: 5
- Evidence scope in this pass:
  - correction-input surfaces
  - correction-mode process surfaces
  - retry-cap / investigator handoff surfaces
  - spec-origin source-trace / spec-modification path surfaces

## Search Notes

- Direct repo search and direct file reads were used for this pass.
- Codebase RAG was attempted, but its first-run index was still building during this session and did not return usable evidence yet.
- Negative evidence in this file is limited to explicit search scopes and queries; it is not a claim about files outside those scopes.

## Evidence

### E-001 - Current runtime workaround edits `spec_path`

- File: `commands/architecture.md:164-168`
- Evidence:
  - Step 17 states that compose reads requirements only from `spec_path` and the inline bundle.
  - It states compose declares no input carrying free-form corrections.
  - It directs substantive corrections through editing `spec_path`, then re-running steps 6 through 16 from research.
- Relevance:
  - This is the live runnable surface for substantive correction handling in the current `/architecture` flow.

### E-002 - Current compose profiles do not declare a corrections artifact input

- Files:
  - `agents/architecture-compose-l1.md:10`
  - `agents/architecture-compose-l2.md:10,20`
  - `agents/architecture-compose-l3.md:8,18`
- Evidence:
  - All three compose profiles consume `spec_path`, `verified_level`, `scaffold_card_id`, `agent_id`, and inline `arch_facts_bundle`.
  - None of the three profiles declares `corrections_artifact_id`.
  - None of the three profiles declares a separate revision-mode input contract in its prompt boundary.
- Relevance:
  - This is direct evidence for the current correction-input and correction-mode surface on the compose side.

### E-003 - No correction-artifact or revision-mode runtime surface found in `agents`, `commands`, or `hooks`

- Search scope: `agents commands hooks`
- Query: `corrections_artifact_id|revision mode|corrections\[\]\.target|ARCH_CORRECTIONS_V1`
- Result: no matches
- Relevance:
  - Within the current runtime-oriented surfaces searched here, there is no live declaration of `ARCH_CORRECTIONS_V1`, `corrections_artifact_id`, or a `corrections[].target`-driven revision-mode implementation.

### E-004 - Intended-state plan explicitly expects a corrections artifact and revision mode

- Files:
  - `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md:344`
  - `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md:760-769`
  - `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md:894`
  - `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md:964`
- Evidence:
  - The plan defines an `ARCH_CORRECTIONS_V1` schema.
  - The plan defines an `ARCH_CORRECTIONS_V1` rule set and synthetic-fixture expectations.
  - Step 17 says a correction should construct an `ARCH_CORRECTIONS_V1` artifact, then route either to compose in revision mode with `corrections_artifact_id`, to remeasure, or to owner-surfaced spec handling.
  - Acceptance criterion 21 says compose contracts should declare an optional `corrections_artifact_id` and carry a prescribed revision-mode process.
- Relevance:
  - This is the documented intended state that current runtime surfaces should be compared against.

### E-005 - FAILED handoff records the original contradiction as undeclared correction input

- File: `docs/handoffs/2026-05-16-architecture-rework-orchestration-FAILED.md:44-50`
- Evidence:
  - The handoff says plan step 17 required respawning compose with corrections context.
  - It says the contract forbids undeclared inputs.
  - It says compose declared no corrections input.
  - It records owner choice of Option A: declared corrections input plus per-level revision mode, and says it was never implemented.
- Relevance:
  - This is the durable failure record that motivated the correction-loop rescue workflow.

### E-006 - Current hook/type surfaces still recognize only four architecture artifact types

- Files:
  - `hooks/scripts/artifact-quality-gate.sh:30-33`
  - `hooks/scripts/artifact-quality-gate.sh:44-49`
  - `hooks/scripts/inject-quality-gate-prompt.sh:58-62`
  - `hooks/scripts/validate-architecture-artifact.sh:921-926`
  - `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md:34`
- Evidence:
  - The sidecar scripts exempt only `architecture_document`, `ARCH_FACTS_BUNDLE_V2`, `ARCH_BUNDLE_AUDIT_V2`, and `ARCH_DESIGN_REVIEW_V1`.
  - The validator dispatch case list handles only those same four artifact types.
  - The app-support spec still says the application recognizes four architecture-pipeline artifact types.
- Relevance:
  - This is direct evidence that correction-artifact support is still absent from current hook and app-support surfaces.

### E-007 - Current app/test support surfaces still carry stale pre-correction-loop assumptions

- Files:
  - `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md:106`
  - `hooks/tests/build-fixtures.py:230-234`
- Evidence:
  - The app-support spec still describes the design reviewer path using `verified_bundle_artifact_id`.
  - The test fixture builder still emits `verified_bundle_artifact_id` at the review artifact top level.
- Relevance:
  - These are additional non-runtime repo surfaces that still reflect the older shape instead of the later intended correction-loop conformance shape.

### E-008 - Current runtime compose seam is still inline bundle, not artifact-by-id for compose corrections

- Files:
  - `commands/architecture.md:96-104`
  - `commands/architecture.md:130`
  - `commands/architecture.md:228`
- Evidence:
  - The command distinguishes `audit_artifact_id` from `verified_bundle_json`.
  - It resolves the verified bundle into inline JSON before compose dispatch.
  - It passes `verified_bundle_json` inline to compose and explicitly says not to pass the bundle artifact ID to compose.
- Relevance:
  - This is the current runtime seam between orchestrator and compose, and it matters because the correction-loop plan expected a different correction-input surface.

### E-009 - No runtime investigator / retry-cap / source-trace implementation surface found in `agents`, `commands`, or `hooks`

- Search scope: `agents commands hooks`
- Query: `investigator|root cause analysis|retry cap|source-trace|source trace|spec-origin|spec origin`
- Result: no matches
- Relevance:
  - Within these runtime-oriented surfaces, there is no explicit live implementation of investigator handoff, retry-cap handling, or spec-origin source-trace logic under those names.

### E-010 - Intended-state plan describes bounded loop and spec-origin owner surfacing

- Files:
  - `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md:894`
  - `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md:964`
- Evidence:
  - Step 17 says the loop is bounded, routes by real-time source trace, re-enters compose for architecture-document corrections, remeasures for verified-bundle corrections, and surfaces spec-origin issues to the owner with no in-pipeline `spec_path` edit.
  - Acceptance criterion 21 repeats that no step performs a silent or automatic `Edit` of `spec_path`.
- Relevance:
  - This is the intended-state document evidence for the retry-cap and spec-origin behavior currently missing from runtime surfaces.

### E-011 - `foundation` remains a spec-creation command, not a spec-modification channel

- File: `commands/foundation.md:3,8,28,43`
- Evidence:
  - The command is described as spec-building.
  - It says architecture decisions happen later in `/architecture`.
  - It outputs a new spec to `docs/specs/`.
  - Its handoff says the next step is to run `/architecture <spec-path>`.
- Relevance:
  - This is direct repo evidence supporting the rule that `/foundation` is for spec creation, not spec modification.

### E-012 - Contract and inventory both record the contradiction boundary explicitly

- Files:
  - `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md:203-205`
  - `docs/specs/spec-inventory.md:68-71`
- Evidence:
  - The contract says each subagent invocation passes only declared inputs and that corrections reach a subagent only via declared `ARCH_CORRECTIONS_V1`, never undeclared prompt context.
  - The inventory says the current real spec's contradiction framing includes: plan says re-spawn compose with corrections context, compose contracts declare no corrections input, contract forbids undeclared extra context, and the workaround edits `spec_path` then reruns from research.
- Relevance:
  - These sources document the intended contract boundary and the currently inventoried contradiction in one place.

## Current Evidence Gaps

- No codebase-RAG results are recorded yet because the local index was still building.
- No deterministic extraction has been done yet for grep-checkable facts such as:
  - compose input-field inventories
  - artifact-type dispatch inventories
  - direct `spec_path` mutation sites
  - stale field-name inventories across fixtures and support docs
- No external runtime definition for investigator behavior or spec-origin modification path has been found in the searched runtime surfaces yet.

## Deterministic Extraction Results

### X-001 - Compose input inventory mismatches the correction-input ledger

- Extraction method:
  - direct read of the `**You consume:**` boundary-contract lines in:
    - `agents/architecture-compose-l1.md`
    - `agents/architecture-compose-l2.md`
    - `agents/architecture-compose-l3.md`
- Extracted fact set:
  - all three compose profiles consume `spec_path`, `verified_level`, `scaffold_card_id`, `agent_id`, and inline `arch_facts_bundle`
  - none declares `corrections_artifact_id`
  - none declares prior architecture-document path/id inputs for correction re-entry
- Ledger comparison:
  - conflicts with CL-023 when interpreted as the current stage interface for explicit correction input
  - conflicts with CL-028 because the current runtime seam is not a declared auditable correction input
- Files:
  - `agents/architecture-compose-l1.md:10`
  - `agents/architecture-compose-l2.md:10,20`
  - `agents/architecture-compose-l3.md:8,18`

### X-002 - Compose runtime still uses inline bundle seam instead of correction-aware re-entry surface

- Extraction method:
  - grep inventory over `commands/architecture.md`
- Extracted fact set:
  - orchestrator resolves `verified_bundle_json`
  - orchestrator passes `verified_bundle_json` inline to compose
  - orchestrator step 17 says compose reads requirements only from `spec_path` and the inline bundle
- Ledger comparison:
  - conflicts with CL-023 and CL-028 for current correction-input shape
  - reinforces the mismatch in X-001
- Files:
  - `commands/architecture.md:96-104`
  - `commands/architecture.md:130`
  - `commands/architecture.md:166`
  - `commands/architecture.md:228`

### X-003 - No revision-mode implementation markers found in current runtime surfaces

- Extraction method:
  - repo search over `agents commands hooks`
  - query: `corrections_artifact_id|revision mode|corrections\[\]\.target|ARCH_CORRECTIONS_V1`
- Result:
  - no matches in current runtime surfaces
- Ledger comparison:
  - conflicts with CL-025, CL-026, and CL-027 as implemented runtime behavior
- Notes:
  - this search intentionally excluded plan/spec/handoff docs so it measures runnable surfaces only

### X-004 - Hook dispatch inventory omits `ARCH_CORRECTIONS_V1`

- Extraction method:
  - direct dispatch inventory from hook and sidecar scripts
- Extracted fact set:
  - `validate-architecture-artifact.sh` dispatches only:
    - `architecture_document`
    - `ARCH_FACTS_BUNDLE_V2`
    - `ARCH_BUNDLE_AUDIT_V2`
    - `ARCH_DESIGN_REVIEW_V1`
  - `artifact-quality-gate.sh` exempt list contains only those four
  - `inject-quality-gate-prompt.sh` architecture-artifact detection contains only those four
  - app-support spec still recognizes only those four
- Ledger comparison:
  - conflicts with CL-023 and CL-028 if explicit correction input is expected to exist as a declared auditable artifact in current repo reality
- Files:
  - `hooks/scripts/validate-architecture-artifact.sh:921-926`
  - `hooks/scripts/artifact-quality-gate.sh:30-33`
  - `hooks/scripts/inject-quality-gate-prompt.sh:58-62`
  - `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md:34`

### X-005 - Runtime still contains direct `spec_path` edit path in `/architecture`

- Extraction method:
  - targeted grep over `commands docs agents hooks` for `Edit` + `spec_path`
- Extracted fact set:
  - current `/architecture` step 17 tells the orchestrator to amend the approved spec at `spec_path` via `Edit`
  - it then re-runs the pipeline from research against the amended spec
- Ledger comparison:
  - conflicts with CL-012 as a current architecture-correction-flow behavior
  - sits in tension with CL-013 and CL-015 because it turns an out-of-scope spec-origin path into a concrete in-flow mechanism
- Files:
  - `commands/architecture.md:166`

### X-006 - Stale reviewer field-name inventory is still present outside the reviewer profile

- Extraction method:
  - repo search over `commands agents docs hooks` for `audit_artifact_id|verified_bundle_artifact_id`
- Extracted fact set:
  - current design-reviewer profile uses `audit_artifact_id`
  - current command still describes the reviewer seam using the misnamed argument position in explanatory text
  - app-support spec still uses `verified_bundle_artifact_id` for the reviewer path
  - `hooks/tests/build-fixtures.py` still emits `verified_bundle_artifact_id`
  - review fixtures under `hooks/tests/fixtures/` still carry `verified_bundle_artifact_id`
- Ledger comparison:
  - current repo reality only partially aligns with the correction-loop design's reviewer-rename intent
  - this is evidence relevant to the broader repo state but does not directly resolve a current Phase 4 overlap by itself
- Files:
  - `agents/architecture-design-reviewer.md:9,13,38,287,292,326`
  - `commands/architecture.md:96,146,228`
  - `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md:106`
  - `hooks/tests/build-fixtures.py:234`
  - `hooks/tests/fixtures/review_*.json` (multiple matches)

### X-007 - Runtime search found no investigator or retry-loop implementation surface under searched names

- Extraction method:
  - repo search over `agents commands hooks`
  - query: `investigator|root cause analysis|retry cap|source-trace|source trace|spec-origin|spec origin`
- Result:
  - no matches in the searched runtime surfaces
- Ledger comparison:
  - CL-016 through CL-021 are not evidenced as current runtime implementation in these searched surfaces
  - this is best treated as an implementation absence, not a contradiction in the decision set itself

### X-008 - Contract / plan / current command form a mechanically checkable contradiction set

- Extraction method:
  - compare current command, contract, and FAILED-handoff-recorded contradiction text
- Extracted fact set:
  - contract says subagents receive only declared inputs and corrections reach a subagent only via declared `ARCH_CORRECTIONS_V1`
  - FAILED handoff records that compose declared no corrections input and Option A was never implemented
  - current command step 17 still routes substantive corrections by editing `spec_path` because compose has no declared correction channel
- Ledger comparison:
  - this mismatch set is directly relevant to CL-022 through CL-029
- Files:
  - `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md:203-205`
  - `docs/handoffs/2026-05-16-architecture-rework-orchestration-FAILED.md:44-50`
  - `commands/architecture.md:166-168`

## Phase 9 Verification Results

### V-001 - Section 1 stays within reconciled authority and boundary records

- Prose section:
  - `docs/specs/2026-05-16-correction-loop-option-a-design.md` section `## 1. The governing standards for this work`
- Verified against:
  - CL-001
  - CL-002
  - CL-003
  - CL-004
  - CL-005
  - CL-006
  - CL-007
- Result:
  - pass
- Notes:
  - The section distinguishes authority, surviving invariants, evaluation frame, and process-discipline exclusion.
  - It does not import runtime workaround details or undeclared implementation claims.

### V-002 - Sections 2 and 3 preserve the reconciled correction-mode boundary

- Prose sections:
  - `docs/specs/2026-05-16-correction-loop-option-a-design.md` sections `## 2. The contradiction being resolved` and `## 3. What this design is`
- Verified against:
  - CL-008
  - CL-009
  - CL-010
  - CL-022
  - CL-023
  - CL-024
  - CL-025
  - CL-026
  - CL-027
  - CL-028
  - CL-029
- Result:
  - pass
- Notes:
  - The prose preserves the umbrella rule plus split interface/process requirements.
  - It does not import the current `spec_path`-edit workaround, inline `verified_bundle_json` seam, or undeclared runtime surfaces as if they were design truth.

### V-003 - Section 4 preserves the spec-modification boundary without inventing mechanics

- Prose section:
  - `docs/specs/2026-05-16-correction-loop-option-a-design.md` section `## 4. Spec-Modification Boundary`
- Verified against:
  - CL-012
  - CL-013
  - CL-014
  - CL-015
- Result:
  - pass
- Notes:
  - The section keeps direct architecture-flow spec edits forbidden.
  - It permits spec modification on true spec-origin outcomes.
  - It excludes `/foundation` as the path.
  - It keeps the external path mechanics explicitly out of scope.

### V-004 - Section 5 preserves bounded-loop and investigator boundaries without over-asserting implementation

- Prose section:
  - `docs/specs/2026-05-16-correction-loop-option-a-design.md` section `## 5. Retry and Investigation Boundary`
- Verified against:
  - CL-011
  - CL-016
  - CL-017
  - CL-018
  - CL-019
  - CL-020
  - CL-021
- Result:
  - pass
- Notes:
  - The section keeps the finite retry bound distinct from a forbidden dead-stop hard gate.
  - It keeps investigation external to review.
  - It limits owner escalation to spec-origin outcomes.
  - It does not claim any internal investigator mechanics beyond contextual handoff.

### V-005 - Prose excludes known runtime-mismatch terms as design assertions

- Search scope:
  - `docs/specs/2026-05-16-correction-loop-option-a-design.md`
- Checked terms:
  - `verified_bundle_json`
  - `ARCH_CORRECTIONS_V1`
  - `corrections_artifact_id`
  - `audit_artifact_id`
- Result:
  - pass
- Notes:
  - These terms were intentionally kept out of the derived prose because the reconciled ledger for this spec rescue flow does not treat them as stable, approved design decisions for this document.
