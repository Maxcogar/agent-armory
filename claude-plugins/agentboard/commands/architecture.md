---
name: architecture
description: Read an approved spec and run the level-aware architecture pipeline — research, classification audit, dispatch to L1/L2/L3 compose, architecture document, workspace cards from the document's slices. Classification is deterministic; the user sees the bundle and level as transparency, then approves the architecture document. Cards do not exist before this command runs.
---

# Architecture — Level-aware Boundary & Card Creation

Convert an approved spec into an architecture document and create workspace cards from its slices. This command is pure orchestration — the architectural reasoning lives in the level-specific compose agents (`architecture-compose-l1`, `architecture-compose-l2`, `architecture-compose-l3`), and the level is determined by `architecture-research-agent` and verified by `architecture-classification-auditor`. The user does not pick the level; classification is deterministic from countable bundle fields.

## Pipeline overview

```
/foundation produces docs/specs/<file>.md
   ↓
/architecture orchestrates:
  Phase A (research): architecture-research-agent → ARCH_FACTS_BUNDLE_V1 (rules computed level)
  Phase A audit:      architecture-classification-auditor → ARCH_BUNDLE_AUDIT_V1 (verified level)
  Phase B (compose):  architecture-compose-l<N> → docs/arch/<file>.md (level-appropriate document with Card Slices)
  Card creation:      one workspace card per slice from the architecture document
   ↓
/orchestrate runs planning → review → implementation → audit on those cards
```

## Prerequisites

- An approved spec exists at `docs/specs/<topic>.md` (produced by `/foundation`)
- AgentBoard MCP authenticated
- Codegraph and codebase-rag MCP servers available
- Context7 MCP server available (needed when classification routes to L3)

## Instructions

Follow these steps in order.

### 1. Load tools and skills

- `ToolSearch` for `agentboard`, `codegraph`, `rag`, `Context7`
- If only `agentboard_authenticate` and `agentboard_complete_authentication` are visible, run the OAuth bootstrap from `skills/agentboard/SKILL.md` §1.3
- Activate the `agentboard:expert-standards` skill via the `Skill` tool — architecture decisions must be evaluated against established engineering standards, not against codebase patterns alone

### 2. Locate the approved spec

- Look in `docs/specs/` for the most recent file, or take the path from the user's command argument
- Read it. Confirm with the user that this is the spec the architecture is being built for.
- The spec is architecturally silent by design — `/foundation` produces specs that name outcomes and requirements; this command produces the boundaries the spec is silent on.

### 3. Select or create a workspace board

- `agentboard_list_apps`, then `agentboard_list_boards` for the chosen app
- If no suitable board exists, `agentboard_create_app` and/or `agentboard_create_board`
- Note the board's `auto_transitions` settings (`review_blocking`, `audit_blocking`); the user will see them when `/orchestrate` runs against the cards this command creates

### 4. Create a scaffold card to hold flow artifacts

Call `agentboard_create_workspace_card`:

- **Title:** `Architecture: <spec topic>`
- **Description:** `Architecture flow scaffold. Holds research, audit, and architecture-document artifacts during the level-aware architecture pipeline. Will be moved to finished after cards are created from the architecture's slices.`
- **Status:** stays in `backlog` during the flow (moved to `finished` at step 16)

The scaffold card is the audit trail of how the architecture was produced. Planning and audit waves attach artifacts to per-implementation cards; this scaffold is the architecture-pipeline analog.

### 5. Spawn the research agent

Spawn `architecture-research-agent` (background) with `spec_path`, `scaffold_card_id`, and `agent_id` in the prompt. Wait for completion. The agent reads the spec, runs `codegraph_scan` and narrow RAG queries against the codebase, fills the eight `ARCH_FACTS_BUNDLE_V1` fields with countable measurements and evidence, applies the v1.0 classification rules baked into its profile, and submits an `ARCH_FACTS_BUNDLE_V1` artifact to the scaffold card.

### 6. Verify the research bundle

Call `agentboard_list_workspace_artifacts` on the scaffold card. Find the artifact whose content begins with the sentinel `ARCH_FACTS_BUNDLE_V1`. If no such artifact exists, halt — write a card note via `agentboard_update_workspace_card` and an activity log entry via `agentboard_add_log_entry` describing the failure — and stop. Do not proceed without a valid bundle.

### 7. Spawn the classification auditor

Spawn `architecture-classification-auditor` (background) with `spec_path`, the bundle's `audited_bundle_artifact_id`, `scaffold_card_id`, and `agent_id` in the prompt. Wait for completion. The auditor independently re-measures every bundle field BEFORE looking at the research agent's bundle (the audit ordering is load-bearing for anchoring-bias prevention), compares to the research agent's measurements, and submits an `ARCH_BUNDLE_AUDIT_V1` artifact. If any discrepancies, the audit artifact carries a corrected bundle and a recomputed level.

### 8. Verify the audit artifact and read the verified level

Find the `ARCH_BUNDLE_AUDIT_V1` artifact via `agentboard_list_workspace_artifacts`. Read `verified_level`:

- If the audit reports `any_discrepancy: true`, `verified_level = corrected_bundle.rule_evaluation.computed_level`
- Otherwise, `verified_level = original_bundle.rule_evaluation.computed_level`

If no `ARCH_BUNDLE_AUDIT_V1` artifact exists, halt and report — either the auditor itself failed (tool error, scan error) or it detected a `rules_version` mismatch on the bundle and hard-failed without submitting an artifact per its own step 5 discipline. In both cases the auditor will have written a card note via `agentboard_update_workspace_card` and an activity log entry; read those for the diagnostic. The audit cannot be skipped, and a `rules_version` mismatch means the rules baked into the research agent and the auditor have drifted — both must be at `rules_version: "1.0"` (or whatever the current version is in lockstep) before the pipeline can proceed.

### 9. Display the bundle, audit, and level to the user — transparency, not approval

Render a brief markdown summary in the chat covering:

- The bundle's eight field values with evidence counts
- The rules that fired (e.g., `R-L3-EXT` because `external_system_count > 0`)
- The auditor's verdict per field (PASS or DISCREPANCY); if any DISCREPANCY, the corrected values and the recomputed level
- The final `verified_level` (1, 2, or 3)

**Do not ask the user to approve the level.** Classification is deterministic; the rules are versioned (currently v1.0) and tuned by misclassification observation, not by per-invocation override. If the user disagrees with the level, the right adjustment is calibration of the rules in a future `rules_version` bump, not a runtime override. The user sees the bundle and level so they understand what's about to happen, not so they can change it.

### 10. Dispatch to the level-appropriate compose agent

Based on `verified_level`:

- `verified_level == 1` → spawn `architecture-compose-l1`
- `verified_level == 2` → spawn `architecture-compose-l2`
- `verified_level == 3` → spawn `architecture-compose-l3`
- Any other value → halt and report (rule evaluation produced an invalid level)

Pass to the compose agent in the prompt: `spec_path`, `verified_level`, `scaffold_card_id`, `agent_id`, and the verified `arch_facts_bundle` inline as JSON. The compose agent runs its level-specific monolithic process (12 phases at L3, 9 at L2 with Phase 7.5, 6 at L1) and submits an `architecture_document` artifact plus writes the document to `docs/arch/<file>.md`.

Wait for completion.

### 11. Verify the architecture document artifact and file

- Call `agentboard_list_workspace_artifacts` on the scaffold card and confirm an `architecture_document` artifact exists
- Read `docs/arch/<file>.md` and confirm it has the required sections for its level (see the compose agent's output template)
- If either check fails, halt — write a card note and activity log entry — and stop. Do not create cards from a missing or malformed document.

### 12. Show the architecture to the user and get explicit approval

Display the architecture document in the chat. The user approves the DOCUMENT, not the level — that is the explicit user-control surface.

If the user requests corrections:

- **Substantial corrections** (rework of a Design decision, a different Components decomposition, an added or removed card slice): re-spawn the appropriate compose agent with the corrections in its prompt and re-run from step 10 onward
- **Minor corrections** (wording, a missed traceability row, a typo): edit `docs/arch/<file>.md` inline with the user

Iterate until the user explicitly approves the document. **One question at a time** when iterating — multi-question prompts produce ambiguous answers.

### 13. Commit the architecture document to git

Commit `docs/arch/<file>.md` to git on the current branch. Do not commit the scaffold card's other artifacts (the bundle and audit are AgentBoard workspace artifacts, not git-tracked files).

### 14. Read the Card Slices section of the architecture document

Re-read the `## Card Slices` section of the now-approved, committed architecture document. Each `### <Card title>` subsection is the input to step 15. The slices conform to §6.3 of `docs/plans/2026-05-09-architecture-pipeline-redesign.md` — eight fields per slice (Description, Allowed-touch list, Forbidden-touch list, Produces, Consumes, Verification scope, Depends on, Source decisions).

### 15. Create one workspace card per slice

For each slice, call `agentboard_create_workspace_card`:

- **`title`**: from the slice's `### <Card title>` heading
- **`description`**: the full slice content — Description, Allowed-touch, Forbidden-touch, Produces, Consumes, Verification scope, Depends on, Source decisions — copied verbatim into the card description. Downstream planning agents will receive this as `arch_slice` (the per-card boundary truth).
- **`priority`**: ask the user or infer from urgency (default: `normal`)
- **`depends_on`**: resolve per the slice's `Depends on` field (card titles). Two-pass approach: create all cards first to learn their IDs, then update each card's `depends_on` field with the resolved IDs.

### 16. Move the scaffold card to finished

Call `agentboard_update_workspace_card` to move the scaffold card from `backlog` to `finished`. The scaffold now serves as the audit trail of how the architecture was produced — the bundle, the audit, and the architecture-document artifact are all attached to it.

### 17. Show summary

```
## Architecture Complete

**Spec:** docs/specs/<file>
**Architecture:** docs/arch/<file> (level: L<n>)
**App:** [name]
**Board:** [name] (ID)
**Cards created:** N
**Scaffold card:** [name] (finished — holds research, audit, and document artifacts)

| # | Card | Allowed-touch (count) | Depends on |
|---|------|-----------------------|------------|

**Next step:** Start a new session and run `/orchestrate` to begin the planning → review → implementation → audit pipeline.
```

## Key Principles

- **Foundation produces a spec; architecture produces the boundaries the spec is silent on.** The spec defines outcomes; the architecture defines structure. The two are complementary — neither subsumes the other.
- **Classification is deterministic.** Research + auditor compute the level from countable bundle fields and versioned rules. The user does not override the level at runtime; tuning happens through rule-version bumps with misclassification data.
- **The user approves the architecture document, not the level.** That distinction is the explicit user-control surface — the user controls the design, the rules control the rigor envelope.
- **Cards do not exist until the architecture is approved.** A spec without an approved architecture creates no cards. The slicing is what cards consume; without it, downstream planning agents would invent boundaries.
- **The architecture's slices are the boundary truth.** Planning agents do not invent boundaries — if a slice is underspecified, planning surfaces it as a structured failure rather than guessing.
- **One question at a time when iterating with the user on document corrections.** Multi-question prompts produce ambiguous answers.
