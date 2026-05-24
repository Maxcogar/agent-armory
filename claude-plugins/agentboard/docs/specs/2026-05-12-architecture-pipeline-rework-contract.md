# Architecture Pipeline Rework — Contract

**Date:** 2026-05-12
**Status:** Definition of done for the rework triggered by `docs/plans/2026-05-12-architecture-pipeline-rework-issues.md`. This document specifies WHAT the finished rework must satisfy. The plan that follows this contract specifies HOW. Sign-off on this contract precedes any plan-writing.

---

## Goal

`/architecture` exists to produce a boundary document — architecture decisions plus per-card slices — that downstream planning agents can read to know what their card may touch, what contracts it produces or consumes, and what it must not touch. The slices ARE the bridge between specification and parallel implementation. Everything else in the pipeline exists to make those slices correct.

The finished rework must satisfy five properties:

1. **Correct.** Slices rest on decisions that are right for the spec.
2. **Auditable.** Rigor level matches scope; every non-trivial decision carries evidence; the slicing traces to decisions, decisions to standards, standards to spec.
3. **Complete.** Every R# and Q# in the spec is addressed in the design or explicitly scoped out with reason.
4. **Decomposed cleanly.** Per-card slices with eight §6.3 fields populated, no overlaps, no missing files, no ambiguity about ownership.
5. **Produced honestly.** Cheap models do mechanical work; expensive models do reasoning; no opus tokens spent on discovery a haiku could pre-gather.

A finished rework that fails any of the five is still broken.

---

## What stays (preserved from the 2026-05-09 redesign)

These design decisions are correct and not in scope for re-litigation:

1. **Deterministic classification with hard-fail audit.** Rules v1.0 baked into the research agent; auditor validates with anchoring-bias discipline; `rules_version` mismatch halts. User does not pick level at runtime.
2. **Three independently authored compose profiles (L1, L2, L3).** Conditionality lives in `commands/architecture.md` dispatch, never inside a compose profile. No skip language inside any profile.
3. **Eight-field §6.3 slice schema.** Description, Allowed-touch, Forbidden-touch, Produces, Consumes, Verification scope, Depends on, Source decisions. Consistent across all levels. Downstream agents consume slices identically regardless of level.
4. **`/architecture` orchestration shape.** The end-to-end flow (locate spec → board → scaffold → research → audit → display → dispatch compose → review → user approval → commit → cards → finished) stays. Three new stages insert: the validation hook gates artifact submission; the design review wave runs between compose and user approval; and a bounded correction loop (per the 2026-05-16 design spec) runs on a caught problem, routing by real-time source-trace.
5. **Two-pass write at L2/L3, single-pass at L1.** The structural reason still holds: L2/L3 slice from committed intermediate design content; L1 has no intermediate layer.
6. **Anchoring-bias discipline in the auditor.** Re-measure independently before looking at the research bundle. Load-bearing for the audit trail.

Anything not on this list is in scope.

---

## What changes (summary)

The architecture pipeline must honor the research/compose split the way the planning pipeline does:

- The haiku research agent pre-gathers everything compose needs — classification facts AND design facts (file lists with role classifications, dependency edges, blast radius, RAG hits for patterns and constraints, Context7 library IDs, open questions).
- The auditor is upgraded from haiku to sonnet-4.6 with extended thinking and validates the full bundle, not just the 8 classification fields.
- The three opus compose agents read from the verified bundle and only reason. No `rag_search`. No `codegraph_*`. No `rag_query_impact`. Context7 (`resolve-library-id` AND `query-docs`) remains available to compose — the discipline is "no codebase discovery in compose," not "no discovery at all." External doc lookup is reasoning-shaped and unsuitable for haiku pre-gathering; codebase discovery is mechanical and bundle-friendly. Compose uses bundle library IDs when present; resolves new IDs directly when the bundle didn't anticipate a needed library.

Plus four additions:

- A deterministic validation hook gates architecture artifact submission.
- A design review wave runs after compose succeeds and before user approval.
- An agentboard app spec is drafted alongside the plan, scoping app changes that would better support the reworked pipeline.
- A bounded correction loop per the owner-approved `docs/specs/2026-05-16-correction-loop-option-a-design.md` (Phase-8 short spec, derived from `docs/specs/spec-ledger.yaml` CL-001..CL-029): corrections travel as a declared stage input (`correction_request_json`) to the affected compose stage, NOT as a submitted artifact; routing is a real-time source-trace among {architecture-document → compose correction mode, verified-bundle → fresh research+audit, spec → external spec-modification path}; `spec_path` is never silently or automatically mutated by the architecture flow; the `/architecture` correction pause is opt-in and off by default; a finite retry cap of 3 on the same scaffold card hands off to an external investigator path at the cap; owner escalation is limited to spec-origin outcomes.

---

## Commitments by area

### Cross-cutting: every subagent activates the expert-standards skill

This is non-negotiable. Every subagent in the architecture pipeline — research agent, classification auditor, all three compose agents (L1/L2/L3), design reviewer — activates `agentboard:expert-standards` via the `Skill` tool as the FIRST action of its process, before any other tool call, before reading any input.

Profile-level requirement:
- The frontmatter `tools` field includes `Skill`.
- The first numbered step (or equivalent first instruction) is exactly: "Activate the expert-standards skill: `Skill(skill: \"agentboard:expert-standards\")`. This is the shared cognitive frame for all engineering work in this pipeline; subsequent process operates inside it."
- No skip clause, no conditional, no "when appropriate." Every invocation, every time.
- Failure to activate is a structural defect caught at plan-acceptance time (one-time check on each profile file).

This carries through to acceptance criteria: every reworked profile is verified to contain the activation step as its first action.

### Research agent — `agents/architecture-research-agent.md`

- Haiku-modeled (`claude-haiku-4-5-20251001`).
- Tools: Read, Glob, Grep, Bash, Skill, agentboard MCP (`get_card`, `update_workspace_card`, `add_log_entry`, `submit_workspace_artifact`, `list_workspace_artifacts`, `get_workspace_artifact`), codegraph (full set including `find_entry_points`, `get_subgraph`, `get_change_impact`), codebase-rag (`rag_search`, `rag_query_impact`), Context7 (`resolve-library-id` only — NOT `query-docs`).
- Emits `ARCH_FACTS_BUNDLE_V2`. Classification fields AND design fields populated, evidence cited per field.
- v1.0 classification rules baked in. `rules_version: "1.0"`. `schema_version: "2.0"`.
- Anti-skip discipline. Tool failure halts; no partial bundles ever emitted.
- Plant-watering rule passes: every sentence in the profile is an instruction to the subagent. No content directed at the orchestrator or user.

### Classification + bundle auditor — `agents/architecture-classification-auditor.md`

- Sonnet-modeled (`claude-sonnet-4-6`) with extended thinking enabled.
- Same tool set as research agent.
- Independently re-derives every field of the bundle (classification AND design) before looking at the research agent's output. Anchoring-bias discipline.
- Per-field validation methods:
  - Counts → re-measure and compare numerically
  - File lists → independent derivation, set comparison (symmetric difference is a discrepancy)
  - Role classifications → independent classification per file, label comparison
  - Dependency edges → graph comparison
  - RAG hits — snippet existence → Read the cited file, exact match for the cited snippet at the cited location; missing or mismatched snippet is a discrepancy
  - RAG hits — relevance → NOT audited at face value; relevance is advisory. Compose makes its own judgment about whether a snippet is relevant to a specific design decision.
  - Library lists → independent identification, set comparison, Context7-ID verification via `resolve-library-id`
- Emits `ARCH_BUNDLE_AUDIT_V2`. Per-field PASS or DISCREPANCY. On any discrepancy, emits corrected bundle + recomputed level. Cannot override level except by correcting facts.
- Validates `rules_version` and `schema_version` separately; halts on either mismatch.
- Plant-watering rule passes.

### Compose agents — `agents/architecture-compose-l{1,2,3}.md`

- All three opus-modeled. Independently authored (no copy-pasting across levels).
- Tools: Read, Edit, Write, Glob, Grep, Skill, agentboard MCP (same set as research), Clear Thought (full set for L3; subset for L2 per inline-discipline locked in 2026-05-09 plan; minimal for L1), Context7 (`resolve-library-id` AND `query-docs`).
- NO `rag_search`. NO `codegraph_*` (any). NO `rag_query_impact`. The discipline is "no codebase discovery in compose" — codebase facts come from the bundle. Context7 is external doc lookup; not codebase discovery; available to compose.
- Process step 1 is the cross-cutting expert-standards activation. Process step 2 ingests the verified `ARCH_FACTS_BUNDLE_V2` (passed inline as `arch_facts_bundle` by the orchestrator). Treat snippet existence (RAG hits, dependency edges, file lists with roles) as authoritative ground truth; treat RAG hit relevance to a specific decision as advisory. Subsequent process reads from bundle fields. The inline-vs-by-id choice for the verified bundle is an implementation detail not constrained by the correction-loop short spec; the current orchestrator passes the bundle inline as `verified_bundle_json` and compose consumes it as `arch_facts_bundle`.
- Correction mode (presence of a declared `correction_request_json` input — short spec CL-022..CL-029): a prescribed process, authored per profile — re-derive only the architecture content the correction request actually targets, preserve non-targeted content only when it still remains correct after the targeted re-derivation, and unconditionally re-run the level's whole-document write, gate checks, and trap audit before submission. Read the prior architecture document from `prior_architecture_document_path` (fall back to `prior_architecture_document_artifact_id` if that read fails). No diff/preserve/patch of the prior document anywhere in any compose profile (grep-checkable). If the correction request cannot be resolved into a concrete architecture change from the declared inputs, halt and surface the correction as underspecified.
- Process phases reason from the bundle: standards, spec problems, hard decisions, threat model (L3 when security in scope), design decisions, quality characteristics mapping (L3 only), ASVS mapping (L3 when security in scope), write document, slice. NO codebase-discovery phases.
- `query-docs` against Context7 IDs when a specific decision's premise verification needs a specific library's documented behavior. Use IDs from `bundle.external_libraries` when present; resolve new IDs via `resolve-library-id` when the bundle didn't anticipate a library compose now needs. The bundle's library list is an efficiency optimization, not a closed set.
- The architecture document includes a deterministic level marker in the Status section: `**Level:** L1` / `L2` / `L3`. This is mandatory and machine-readable; the validation hook depends on it.
- Two-pass write at L2/L3, single-pass at L1 per existing locked decisions.
- Delivery gates from existing plan preserved: Gates A/B/C + trap audit for L3; L2 gate variants with discipline-coverage check; L1 single mechanical gate.
- Plant-watering rule passes for all three. Every sentence is an instruction to the subagent.

### Validation hook — `hooks/scripts/validate-architecture-artifact.{py|sh}` and `hooks/hooks.json`

- Form factor: `PreToolUse` hook on `mcp__agentboard__agentboard_submit_workspace_artifact`.
- Scope: covers the FOUR submitted architecture-pipeline artifact types via content-type dispatch. The hook reads `TOOL_INPUT.content` (and `artifact_type` when available), detects which architecture-pipeline artifact it is, and applies the matching rule set. If the content matches none of the four types, the hook exits cleanly with no action (the existing artifact-quality-gate handles non-architecture artifacts). The correction-loop input (`correction_request_json`) is a declared stage input, not a submitted artifact, and is therefore not handled by this hook.
- Detection markers:
  - **`architecture_document`** → top-level `# Architecture —` heading AND `## Card Slices` section
  - **`ARCH_FACTS_BUNDLE_V2`** → recognizable bundle sentinel (e.g., `ARCH_FACTS_BUNDLE_V2` in the first lines) or `artifact_type` set to that value
  - **`ARCH_BUNDLE_AUDIT_V2`** → recognizable audit sentinel or matching `artifact_type`
  - **`ARCH_DESIGN_REVIEW_V1`** → recognizable review sentinel or matching `artifact_type`
- Scope is **structural-only**. The hook reads `TOOL_INPUT.content` and validates against deterministic rules. The hook does NOT verify behavioral properties (tool-use logs, bundle-ingestion events) because the PreToolUse hook surface doesn't have access to that information. Behavioral guarantees come from subagent frontmatter constraints (compose's tools list excludes the forbidden tools) verified at plan-acceptance time, not at runtime.
- Rule set per artifact type:
  - **`architecture_document` rules** (all must pass):
    - Document contains a level marker in the Status section matching `**Level:** L[123]` exactly. Hook parses level from this marker (not from section presence).
    - Required sections per the parsed level's output template are present in the document, in the correct order. For L3 with security in scope (signalled by presence of `## Threat model` section), `## ASVS verification mapping` must also be present.
    - `## Card Slices` section populated with at least one slice
    - Every slice has all 8 §6.3 fields populated (fields with value "None" still present, not omitted)
    - Every R# and Q# from the spec appears in the document's traceability matrix or in at least one slice's source-decisions. (Hook reads the spec path from a sidecar parameter in the artifact content's frontmatter or first paragraph; if unavailable, this check is downgraded to "traceability matrix is non-empty.")
    - Every D# referenced in any slice's source-decisions exists in the document's Design decisions section
    - No two slices have overlapping allowed-touch lists without explicit justification in the slice description
  - **`ARCH_FACTS_BUNDLE_V2` rules** (all must pass):
    - Bundle is valid JSON (or the plan's chosen serialization)
    - `schema_version == "2.0"` AND `rules_version == "1.0"`
    - All required classification fields present with evidence citations
    - All required design fields present (files_relevant, dependency_edges, blast_radius, existing_patterns_hits, constraint_hits, external_libraries, open_questions)
    - `rule_evaluation.computed_level` is numeric and one of `1` / `2` / `3`, and matches what the rules would derive from the classification fields
  - **`ARCH_BUNDLE_AUDIT_V2` rules** (all must pass):
    - Audit is valid JSON
    - `schema_version == "2.0"` AND `rules_version == "1.0"`
    - Every bundle field has a corresponding per-field verdict (PASS or DISCREPANCY)
    - `verified_level` is numeric and one of `1` / `2` / `3`
    - If any discrepancy is flagged, a `corrected_bundle` and `recomputed_level` (numeric) are present
  - **`ARCH_DESIGN_REVIEW_V1` rules** (all must pass):
    - Review is valid JSON
    - Findings list is present (may be empty)
    - Every finding has severity (`blocker` / `serious` / `minor`) and at least one document citation
    - Top-level `audit_artifact_id` field is present and non-empty (the design-reviewer seam — short-spec correction-path consistency)
- Disk-path check (`docs/arch/*.md`) is NOT in the hook (the hook doesn't see disk paths). Path verification happens in the orchestrator's git-commit step instead.
- On failure: hook returns non-zero with structured error JSON identifying the artifact type detected and the rule that failed; tool call blocked; submitting subagent sees the failure and must address it before resubmitting.
- On pass: tool call proceeds; orchestrator continues to the next stage.
- Registered in `hooks/hooks.json`. Part of plugin install, not optional configuration.

### Design reviewer — `agents/architecture-design-reviewer.md`

- New file. Sonnet-4.6 with extended thinking.
- Runs after compose's artifact passes the validation hook, before user approval.
- Inputs: `spec_path`, `architecture_document_path`, `audit_artifact_id`, `scaffold_card_id`, `agent_id` (`audit_artifact_id` is the `ARCH_BUNDLE_AUDIT_V2` id — the reviewer resolves the verified bundle from the audit; renamed from the prior misnamed `verified_bundle_artifact_id` as recorded in `docs/specs/spec-evidence.md` E-007/X-006 and the 2026-05-23 audit). Reads all three substantive inputs.
- Reviews the design for:
  - Decisions that don't actually serve the spec requirement they claim to address
  - Missing decisions (a spec R#/Q# with no decision addressing it AND not scoped out)
  - Unjustified slices (allowed-touch missing files the decisions imply needed, or including files no decision justifies)
  - Contract mismatches (a slice produces a contract no other slice consumes, or consumes a contract no slice produces)
  - Standards-decoration trap (standards cited that don't drive any decision)
  - Decision-hiding trap (judgment calls whose reasoning isn't surfaced in the document)
  - Deferred-decision trap (non-trivial decisions deferred to "the implementer" or "the build phase" with cross-component consequences)
- Tools: Read, Glob, Grep, Skill, agentboard MCP (read-only for cards/artifacts + `add_log_entry` + `submit_workspace_artifact`).
- Emits `ARCH_DESIGN_REVIEW_V1` artifact: list of findings with severity (`blocker` / `serious` / `minor`), each finding citing specific document content (section, decision number, slice name).
- Cannot block user approval directly — user sees findings alongside the document via the orchestrator's display and decides whether to address them, override with reason, or reject the document outright.
- Plant-watering rule passes.

### Bundle schema — `ARCH_FACTS_BUNDLE_V2`

The plan specifies the JSON schema in full with types and validation. This contract specifies the required field set:

- `schema_version: "2.0"`
- `rules_version: "1.0"`
- **Classification fields** (preserved from V1, each with evidence citations): `new_contracts_count`, `existing_contracts_modified_count`, `trust_boundaries_introduced`, `migration_signals_present`, `external_system_count`, `expected_card_count_band`, `coupling_hotspot_overlap`, `security_relevant_keyword_hits`
- **Rule evaluation**: which rules fired, `computed_level`, reasoning trace
- **Design fields (new at V2)**:
  - `files_relevant`: list of files with role (`candidate-new` / `candidate-modified` / `dependency` / `entry-point` / `hotspot`) and existence-confirmed flag
  - `dependency_edges`: file → file imports across the relevant set
  - `blast_radius`: for the candidate-modified set, direct dependents + transitive count + risk level + top affected files
  - `existing_patterns_hits`: RAG results from `source_type=docs`, top N with relevance scores and snippets
  - `constraint_hits`: RAG results from `source_type=constraints`, top N with relevance scores and snippets
  - `external_libraries`: list of `{name, context7_id_or_null, why_needed}` for libraries the spec implies the architecture will depend on
  - `open_questions`: ambiguities the research agent encountered but couldn't resolve; flagged for compose to address explicitly in design

`ARCH_BUNDLE_AUDIT_V2` validates all of the above with the per-field methods listed under the auditor's commitments.

### Versioning

- `schema_version: "2.0"` on bundles and audits (the bundle/audit format changes).
- `rules_version: "1.0"` unchanged (the 9 classification rules are unchanged at v1.0).
- Auditor validates `(schema_version, rules_version)` separately. Mismatch on either halts with structured error.
- Plugin version bumps to `0.3.0` in `claude-plugins/agentboard/.claude-plugin/plugin.json`.
- **SUPERSEDED (correction-loop design §9, owner-ratified 2026-05-17):** the codex plugin version and the marketplace entry are **not** touched by this work. `codex-plugins/agentboard/.codex-plugin/plugin.json` and `/.claude-plugin/marketplace.json` are out of scope; the codex tree is never edited or mirrored. The Claude-tree `0.3.0` bump (above) lands with the implementation stage.

### `/architecture` orchestrator — `commands/architecture.md`

- Process: load tools → parse `--pause` / `pause` flag from argument string → locate spec → select board → scaffold card → spawn research → verify bundle artifact submitted → spawn auditor → verify audit artifact submitted → read verified level from audit → display verified bundle + audit + level to user (transparency only, not approval) → dispatch compose by verified level → wait for compose → (validation hook fires on artifact submission; orchestrator observes pass/fail) → spawn design reviewer → wait for review artifact → display document + review findings to user → (opt-in `/architecture` correction pause only if `architecture_correction_pause == true` for this run — short-spec CL-010) → on a caught problem run the bounded correction loop: source-trace the origin, construct a declared `correction_request_json` input, and route (architecture-document → re-enter compose in correction mode; verified-bundle → re-run pipeline from research; spec → external spec-modification path) — bounded at retry cap 3 on the same scaffold card with external-investigator handoff at the cap (short-spec CL-018/CL-019), no silent/automatic `spec_path` mutation (short-spec CL-012), owner escalation only on spec-origin outcomes (short-spec CL-020) → commit document → parse `## Card Slices` section → create one workspace card per slice → scaffold card to finished → summary.
- Each subagent invocation passes only the inputs that subagent's profile declares it consumes. No "for your reference" extra context that might bleed orchestration concerns into the subagent's flow.
- The orchestrator command is written to be read and executed by the orchestrator. Subagent profiles are written to be read and executed by the subagent. No cross-talk.
- Substantive corrections reach the affected compose stage only via the declared `correction_request_json` input (never as undeclared prompt context — this is the declared-input discipline of contract line 197 above, which the correction-loop short spec maintains). Within `/architecture`, `spec_path` is never silently or automatically mutated; a spec-origin problem is handed off to the external spec-modification path rather than using `/foundation` or an in-flow edit (short-spec CL-012/CL-013/CL-014/CL-015).

### Plan author discipline

The plan that follows this contract must:

- Lead each agent's section with that agent's subagent boundary contract (what goes in, what comes out, what's out of scope) BEFORE listing phases.
- §11 acceptance criteria are behavioral, including at minimum:
  - "L1, L2, L3 compose profiles contain zero references to `rag_search`, `codegraph_scan`, `codegraph_get_stats`, `codegraph_find_entry_points`, `codegraph_list_files`, `codegraph_get_dependencies`, `codegraph_get_dependents`, `codegraph_get_subgraph`, `codegraph_get_change_impact`, or `rag_query_impact` ANYWHERE in the profile file — frontmatter tools list, workflow context, process text, output template, examples, and any other section. The check runs against the full file, not just numbered phase sections."
  - "Compose profile frontmatter `tools` field excludes every forbidden tool from the list above (the strongest enforcement — if the tool isn't declared, the subagent can't call it)."
  - "Compose profile Step 2 (the first post-activation step; Step 1 is the cross-cutting expert-standards activation) reads from `bundle.files_relevant` (and the other design fields by name) instead of running discovery"
  - "Plant-watering test passes on every rewritten profile: every sentence classified as instruction-to-subagent; count of non-subagent-directed sentences is zero"
  - "Validation hook fires on a synthetic invalid architecture artifact and blocks submission with structured error"
  - "Validation hook passes a synthetic valid architecture artifact"
  - "Validation hook correctly parses the level marker and applies level-appropriate section checks across all three levels (synthetic artifacts at each level)"
  - "Auditor profile cites sonnet-4.6 with extended thinking enabled in frontmatter"
- Independent code-reviewer subagent pass before any plan section is finalized; findings applied in full per repo standing rule (no prioritized subsets).
- **SUPERSEDED (correction-loop design §9, owner-ratified 2026-05-17):** no codex sync report is produced; `codex-plugins/agentboard/` is not touched. Codex is handled later by a separate document, out of scope for this change set.

### Agentboard app spec — `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md`

- Separate spec file, drafted alongside the plan. Not a plan; not a prescription for app implementation.
- Identifies considerations for app changes that would better support the reworked pipeline; lists trade-offs; surfaces decision points.
- Scope includes at minimum:
  - First-class artifact-type support for `ARCH_FACTS_BUNDLE_V2`, `ARCH_BUNDLE_AUDIT_V2`, `ARCH_DESIGN_REVIEW_V1`, `architecture_document` (today submitted with sentinel-prefixed strings)
  - Architecture stage as a recognized lifecycle concept in the app, parallel to the existing review and audit block points in the workspace pipeline
  - Level transparency on the board UI — verified level and audit findings visible without reading raw artifact JSON
  - Tighter scaffold-card-to-finished transition as a first-class lifecycle, not a convention
  - Structured arch_slice handoff into card creation (currently the orchestrator parses markdown; could be server-side parse against a registered schema)
- Spec stands on its own. Rework plan references it but does not depend on it. App changes follow their own design cycle.

### Existing artifact-quality-gate revision — BOTH halves

The current PreToolUse hook on `submit_workspace_artifact` has TWO halves in `hooks/hooks.json`: a **script** half (`hooks/scripts/artifact-quality-gate.sh`) that runs on the tool call, and a **prompt** half (text injected into the submitter's context) that tells every submitter "no open questions" and that they "used codegraph, codebase-rag, grep, and read tools." Both halves conflict with the new architecture artifact pattern: compose legitimately surfaces open questions in design and legitimately doesn't use codegraph/codebase-rag.

**Both halves must become artifact-type-aware.** Either half left unrevised leaves architecture artifacts receiving contradictory guidance.

**Script half (`hooks/scripts/artifact-quality-gate.sh`):**
- Inspects `TOOL_INPUT.artifact_type` (or the content's leading markers when artifact_type is unset) and applies different rule sets per type:
  - Planning / implementation / review / audit artifacts → existing rules apply (codebase-discovery tool evidence required, no open-question language)
  - Architecture-pipeline artifacts (`ARCH_FACTS_BUNDLE_V2`, `ARCH_BUNDLE_AUDIT_V2`, `architecture_document`, `ARCH_DESIGN_REVIEW_V1`) → existing rules do NOT apply; the new architecture validation hook owns these. The existing script exits cleanly with no action.

**Prompt half (in `hooks/hooks.json`):**
- The prompt-injection text becomes artifact-type-aware. Plan picks the form factor (split the hook into two registrations with matchers that distinguish artifact type; or convert the static prompt to a dynamic prompt that reads TOOL_INPUT; or replace with a per-subagent profile guidance pattern for architecture agents only).
- Required behavior: when an architecture-pipeline subagent (research, auditor, compose-l1/2/3, design reviewer) submits an architecture-pipeline artifact, the existing prompt's "no open questions" and "you used codegraph/codebase-rag" guidance MUST NOT be injected. Non-architecture submissions retain the existing prompt behavior unchanged.
- Out-of-scope guardrail: this revision does NOT modify any non-architecture subagent profile (`planning-research-agent`, `plan-compose-agent`, `review-agent`, `implementation-agent`, `audit-research-agent`, `audit-compose-agent`). Their behavior is preserved by keeping the existing prompt firing for their submissions.

**Net effect:** existing gate (both halves) continues to enforce its discipline for non-architecture artifacts unchanged; architecture-pipeline artifacts bypass both halves of the existing gate cleanly; new architecture validation hook owns architecture-pipeline artifacts via content-type dispatch. No artifact bypasses every gate; no architecture artifact receives contradictory submission guidance.

Both hooks registered in the same `hooks/hooks.json`, scoped so they don't double-fire on the same artifact.

### Level representation across the rework surface

Two representations exist for the level; the contract pins each to a specific surface so machine contracts and document content stay coherent:

- **Machine contracts (bundle, audit, orchestrator dispatch)** use NUMERIC levels: `computed_level` / `verified_level` ∈ `{1, 2, 3}`. This preserves the existing convention in `agents/architecture-research-agent.md`, `agents/architecture-classification-auditor.md`, and the compose-agent guards. No churn to machine contracts beyond what the V2 schema bump already requires.
- **Document content (Status section marker)** uses HUMAN-READABLE form: `**Level:** L1` / `L2` / `L3`. This is the form the validation hook parses when validating an `architecture_document` artifact.
- **Translation** happens in two places: the compose agent, when authoring the document, converts numeric `verified_level` (from the orchestrator) to the `L#` marker form. The validation hook, when parsing the document, can map `L#` back to numeric if needed for cross-checking against the bundle's `computed_level`.
- The hook's rule sets reflect this split explicitly:
  - `ARCH_FACTS_BUNDLE_V2` rule: `rule_evaluation.computed_level` is one of `1` / `2` / `3` (numeric)
  - `ARCH_BUNDLE_AUDIT_V2` rule: `verified_level` is one of `1` / `2` / `3` (numeric)
  - `architecture_document` rule: Status section contains `**Level:** L[123]` exactly (string form with `L` prefix)

### Supersession of §8.7 from the 2026-05-09 plan

- The 2026-05-09 plan's §8.7 locked "no level metadata field in architecture documents." That decision is **superseded** by this contract.
- New rule: every architecture document includes `**Level:** L1` / `L2` / `L3` in the Status section per the Level representation rule above. Used by the validation hook to parse the level deterministically.
- All three compose profile output templates include the level marker.
- The supersession is explicitly noted in the rework plan's preamble.

### Codex plugin sync — SUPERSEDED (correction-loop design §9, owner-ratified 2026-05-17)

- This entire subsection is **superseded**. `codex-plugins/agentboard/` is **never edited or mirrored** by this work, in every circumstance, and no codex sync report is produced.
- The pre-FAILED file-mirror approach was the wrong shape (the Codex plugin is skills-based and never had `agents/`/`commands/`) and was reverted in commit `c4c4466`.
- Codex is handled later by a separate *document* describing the rework for the skills-based Codex plugin to apply itself — sequenced after the Claude tree is final and out of scope for this change set.

---

## Acceptance criteria — checkable at end

The rework is finished when ALL of the following hold:

1. Every subagent profile (research, auditor, compose-l1, compose-l2, compose-l3, design reviewer) has `Skill` in its frontmatter tools list AND its first numbered process step activates `agentboard:expert-standards` via the Skill tool. Checked mechanically against each profile file.
2. `ARCH_FACTS_BUNDLE_V2` and `ARCH_BUNDLE_AUDIT_V2` schemas are defined in the plan and produced by the agents per spec.
3. Research agent emits the full V2 bundle (classification + design fields) per invocation. Never partial.
4. Auditor is sonnet-4.6 with extended thinking. Validates every V2 field with the per-field methods listed (counts numerically, file lists by set comparison, RAG snippets by existence verification, libraries by independent resolution). Anchoring-bias discipline visible in the profile.
5. All three compose profiles contain zero codebase-discovery-tool references ANYWHERE in the profile file (frontmatter, workflow context, process text, output template, all sections). Plant-watering test passes on all three.
6. Compose profile frontmatter `tools` field excludes every forbidden codebase-discovery tool. Subagent literally cannot call them.
7. Compose profiles read from bundle fields in Step 2 (Step 1 is the cross-cutting expert-standards activation); subsequent reasoning consumes those fields, doesn't re-derive codebase facts.
8. Compose profiles have Context7 (`resolve-library-id` AND `query-docs`) in their tools list; the contract for "no discovery" is scoped to codebase discovery, not external doc lookup.
9. Validation hook exists at `hooks/scripts/validate-architecture-artifact.{py|sh}`, is registered in `hooks/hooks.json`, fires on `submit_workspace_artifact` for the four submitted architecture-pipeline artifact types (`architecture_document`, `ARCH_FACTS_BUNDLE_V2`, `ARCH_BUNDLE_AUDIT_V2`, `ARCH_DESIGN_REVIEW_V1`) via content-type dispatch, performs structural-only checks per type-specific rule sets, blocks invalid submissions with structured error, passes valid submissions. The correction-loop input (`correction_request_json`) is a declared stage input, not a submitted artifact, and is not validated by this hook.
10. Synthetic-artifact tests for the validation hook pass: invalid + valid synthetic for each of the four submitted artifact types; valid architecture document tested at each level (L1, L2, L3).
11. Existing PreToolUse hook on `submit_workspace_artifact` is revised in BOTH halves: (a) the script `hooks/scripts/artifact-quality-gate.sh` becomes artifact-type-aware (existing rules apply to non-architecture artifacts; architecture-pipeline artifacts exit cleanly), AND (b) the prompt instruction in `hooks/hooks.json` is configured so that the existing "no open questions" and "you used codegraph/codebase-rag" guidance is NOT injected for architecture-pipeline submissions. Non-architecture submission behavior unchanged. Verified by synthetic submissions for both architecture and non-architecture artifact types — architecture submissions get neither contradictory prompt nor false fail; non-architecture submissions still get existing prompt and script behavior.
12. All architecture document output templates (L1, L2, L3) include the mandatory `**Level:** L#` marker in the Status section.
13. The 2026-05-09 plan's §8.7 is explicitly superseded by this contract; the rework plan's preamble names the supersession.
14. Design review agent exists, is sonnet-4.6 with extended thinking, runs after compose's artifact passes the validation hook and before user approval, emits `ARCH_DESIGN_REVIEW_V1` with severity-tagged findings.
15. `/architecture` command orchestrates the full flow including the new design review wave AND the disk-path verification (`docs/arch/*.md`) at the git-commit step (moved out of the hook).
16. Plugin version is `0.3.0` in `claude-plugins/agentboard/.claude-plugin/plugin.json` (Claude tree only; lands with the implementation stage). The codex-tree and marketplace clauses are SUPERSEDED — `codex-plugins/agentboard/.codex-plugin/plugin.json` and the marketplace entry are not touched (correction-loop design §9, owner-ratified 2026-05-17).
17. SUPERSEDED — no codex sync report is produced; `codex-plugins/agentboard/` is not touched (correction-loop design §9). Codex is handled later by a separate document, out of scope for this change set.
18. Agentboard app spec exists at the declared path with the scope listed above.
19. The 2026-05-09 plan is preserved as historical record; the new plan explicitly supersedes it.
20. The correction loop conforms to the owner-approved `docs/specs/2026-05-16-correction-loop-option-a-design.md` (Phase-8 short spec, derived from `docs/specs/spec-ledger.yaml` CL-001..CL-029): each compose profile declares `correction_request_json`, `prior_architecture_document_path`, and `prior_architecture_document_artifact_id` as correction-loop inputs and carries a distinct correction-mode process (targeted re-derivation, prior document read with artifact-id fallback, whole-document write + gates + trap audit re-run, halt on underspecified correction; zero diff/preserve/patch instructions, grep-checkable); the design-reviewer takes `audit_artifact_id` and resolves the bundle from that audit; `/architecture` runs source-trace routing in real time across three origins with no static table, enforces a finite retry cap of 3 on the same scaffold card, hands off to an external investigator at the cap, escalates to the owner only on spec-origin outcomes, performs no silent/automatic `spec_path` mutation, and exposes an opt-in `/architecture` correction pause (off by default) via a `--pause` / `pause` flag in the argument string; the pause is distinct from AgentBoard board blocking gates and does not modify board settings; an unresolved correction is surfaced as underspecified, never guessed. (Mirrors plan §11 AC-21.)

---

## Out of scope for this rework

- Changes to `/foundation`, `/orchestrate`, or any workspace-pipeline agents (`planning-research-agent`, `plan-compose-agent`, `review-agent`, `implementation-agent`, `audit-research-agent`, `audit-compose-agent`).
- Changes to `skills/spec-writing/SKILL.md` or any spec-related discipline.
- Threshold tuning of v1.0 classification rules (open item from original plan; remains open).
- Implementation of any agentboard app changes the app spec identifies.
- Changes to `mcp-servers/`, `skills/codebase-rag-enforcer/`, or other plugins in this workspace.
- Test infrastructure changes beyond the synthetic-artifact tests for the validation hook.
- **Modifying or mirroring `codex-plugins/agentboard/`** — hard out of scope, in every circumstance (correction-loop design §9, owner-ratified 2026-05-17).
- **The Codex rework document** — a real later deliverable, sequenced after the Claude tree is final; not part of this change set.

In scope and now part of the definition of done: the bounded correction loop per the owner-approved `docs/specs/2026-05-16-correction-loop-option-a-design.md` (2026-05-17), as reflected in the Commitments-by-area and Acceptance-criteria sections above.

---

## Sign-off

This contract is the definition of done. The plan that follows specifies sequencing, file-level changes, schema details, and acceptance-criteria phrasing — all of which must satisfy this contract. Changes to this contract require explicit re-approval before plan-writing resumes.

User sign-off: pending.
