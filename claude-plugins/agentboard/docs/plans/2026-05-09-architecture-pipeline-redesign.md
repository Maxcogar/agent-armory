# Architecture Pipeline Redesign — Detailed Task Plan

**Date:** 2026-05-09
**Status:** plan approved; implementation pending
**Trigger:** Spec/Arch Restructure card (workspace board: Workflow Enhancements, ID `9f0a049c-01a1-4ab0-8f23-7031288a4406`)
**Scope:** the agentboard plugin's architecture phase. Does not change `/foundation`, `/orchestrate`, planning agents, review agent, implementation agent, or audit agents. Does not touch the parallel `codex-plugins/agentboard/` tree (separate runtime, synced afterward via the report at the end of this doc).

---

## 1. Document purpose

This is the plan that will be followed across multiple sessions to bring the architecture phase up to the rigor required by the Spec/Arch Restructure card, while letting work that doesn't need full rigor pass through with proportional rigor instead of overkill.

It is comprehensive on purpose. The implementation is multi-session, and each session needs to be able to start from this document without re-deriving design decisions. If a session ends mid-step, the next session reads this doc plus the existing files to know exactly what to do next.

It is **not** the implementation. Files referenced as NEW or REWRITTEN are described here in enough detail to author them, but they are not authored in this doc.

---

## 2. Background

The Spec/Arch Restructure card surfaced a structural failure in how the workspace-board pipeline handled architecture: foundation produced a spec, planning agents read a per-card spec excerpt, and architectural boundaries (ownership, contract truth, dependency graph, verification ownership) were never declared anywhere — so each parallel planning agent invented them, and reviewers each enforced different versions, producing review churn.

Earlier in this work cycle:
- `/foundation` was rewritten to produce an architecturally-silent spec via the `spec-writing` skill (rigorous, grounded requirements, three-test discipline, threat-model-first security, auditable derivation).
- `/architecture` was added as a separate command between foundation and `/orchestrate`. Cards do not exist before `/architecture` runs.
- Planning agents (`planning-research-agent`, `plan-compose-agent`) and `review-agent` were rewritten to consume per-card arch slices (allowed-touch / forbidden-touch / produces / consumes / verification scope / depends_on) instead of spec excerpts.

The current `commands/architecture.md` is L2-shaped end-to-end. The user dropped `expert-architecture.md` in the plugin root as the L3 starting content — a comprehensive standalone `/expert-architecture` style command with 12 phases, Clear Thought reasoning support, three delivery gates, and the five-trap audit.

The user's two non-negotiable design constraints:

1. **No conditional/skip language anywhere in compose-agent profiles.** Agents resolve "may skip" toward "should skip"; once skipping is permitted under one condition, it begins happening under others. The architecture process must be split into per-level monolithic profiles, each independently authored with no skip language.
2. **No agent self-grading and no user override of classification.** Agents pick the least-effort path when they grade themselves; users are information-poor compared to the bundle they'd be grading from. Classification must be deterministic, computed by fixed rules over countable bundle fields measured by a research agent and verified by an independent auditor.

This plan operationalizes both constraints.

---

## 3. Design principles

These rules govern every implementation decision in this redesign. If a design question arises during implementation that this doc doesn't answer, it gets answered by reference to these principles.

1. **No skip language anywhere in any compose-agent profile.** Each level (L1, L2, L3) is its own complete process. Conditionals about whether to do steps live above the agent — in the orchestration command's dispatch — not inside the agent's instructions.
2. **Three independently authored compose-agent profiles.** L1 is not L3-with-skip-rules; L2 is not L3-with-skip-rules. Each is authored as a complete monolithic process at its rigor level. Drawing on L3's content is fine; conditionalizing it is not.
3. **Classification is deterministic.** Computed by fixed rules over countable bundle fields. Versioned. Single source of truth in the research agent's profile.
4. **Research-then-audit produces verified level.** The auditor re-derives every bundle field independently from the same spec and codebase. Discrepancies → corrected bundle → recomputed level. The auditor cannot promote/demote level directly; only via correcting facts.
5. **No user override of classification.** The user sees the bundle and the level as transparency artifacts. To run a different level, re-run `/architecture`. (Calibration of rules over time is the right adjustment vector, not per-invocation override.)
6. **Bake unique-to-agent processes into agent profiles. Activate shared cognitive frames as skills.** The L1/L2/L3 processes are unique per agent and get baked. `expert-standard` and similar shared frames get activated via `Skill` tool at step 1.
7. **Per-card slice schema is consistent across all levels.** Downstream agents (`planning-research-agent`, `plan-compose-agent`, `review-agent`) do not branch on level. The schema is the same; the depth of design that produced each slice differs.
8. **Bias toward higher level when uncertain.** Asymmetric cost: underclassifying produces the failure we're solving (boundaries undefined → planning churn); overclassifying produces wasted ceremony. OR rules in classification ensure any L3 trigger pulls the level up.
9. **The architecture document, regardless of level, serves three downstream consumers.** Implementer (planner persona), reviewer, stakeholder. Even L1 must produce a document the planner can plan from, the reviewer can review against, and the stakeholder can read.

---

## 4. End-state architecture pipeline

```
/foundation produces spec at docs/specs/<file>.md
   ↓ (user starts new session, runs /architecture <spec-path>)

/architecture orchestrates:

  Step 1.  Locate spec, confirm with user
  Step 2.  Select/create board, create scaffold card to hold flow artifacts
  Step 3.  Spawn architecture-research-agent (haiku) [PHASE A]
              → Reads spec + runs codegraph_scan + RAG
              → Fills ARCH_FACTS_BUNDLE_V1 with countable fields + evidence
              → Applies fixed rules to compute level
              → Submits ARCH_FACTS_BUNDLE_V1 artifact to scaffold card
  Step 4.  Spawn architecture-classification-auditor (haiku) [PHASE A AUDIT]
              → Reads spec independently (does NOT see bundle until done re-measuring)
              → Re-derives every bundle field from scratch
              → Compares to research agent's bundle
              → If discrepancies: emits corrected bundle, recomputes level
              → Submits ARCH_BUNDLE_AUDIT_V1 artifact (with corrected bundle if any)
  Step 5.  Read verified_level from corrected bundle (or original if no discrepancies)
  Step 6.  Display bundle + audit + level to user (transparency, not approval)
  Step 7.  Dispatch to architecture-compose-l1, -l2, or -l3 (opus) [PHASE B]
              → Compose agent runs its monolithic process at fixed level
              → Produces architecture document at docs/arch/<file>.md
              → Document includes a "Card Slices" section with per-card schema
              → Submits architecture_document artifact to scaffold card
  Step 8.  Show document to user, get approval
  Step 9.  Commit document to git
  Step 10. Read Card Slices section, create one workspace card per slice via MCP
              → Each card's description carries its full slice content
              → depends_on edges set per slice depends_on field
  Step 11. Move scaffold card to finished
  Step 12. Show summary — board ready for /orchestrate
   ↓

/orchestrate runs the planning → review → implementation → audit waves on the cards
(already wired; no changes needed downstream because slice schema is consistent)
```

---

## 5. File inventory

| File | Status | Notes |
|---|---|---|
| `expert-architecture.md` (plugin root) | DELETE after L3 absorbed | Source content for L3; absorbed into `agents/architecture-compose-l3.md`. Confirmed by user. |
| `agents/architecture-compose-l3.md` | NEW | Derived from `expert-architecture.md` with the 8 adaptations in §8.3. |
| `agents/architecture-compose-l2.md` | NEW | Independently authored monolithic L2 process (§8.4). Draws on L3 content where applicable; not a subset with skip rules. |
| `agents/architecture-compose-l1.md` | NEW | Independently authored monolithic L1 process (§8.5). Slim; the slicing IS the architecture at L1. |
| `agents/architecture-research-agent.md` | NEW | Haiku, mechanical fact-gathering, applies versioned classification rules (§8.1). |
| `agents/architecture-classification-auditor.md` | NEW | Haiku, independent re-measurement, recomputes level if discrepancies (§8.2). |
| `commands/architecture.md` | REWRITE | Pure orchestration. Current L2-shaped content is replaced; the L2 design substance moves into `architecture-compose-l2.md`. |
| `skills/workspace-orchestration/SKILL.md` | MINOR EDIT | Update prerequisites text to mention the architecture flow includes research + audit + compose phases. |
| `README.md` | UPDATE | Describe level-aware architecture flow, add the new agents to the appropriate sections. |
| `docs/plans/2026-05-09-architecture-pipeline-redesign.md` | THIS DOC | Authoritative plan record. |
| Final report (codex sync) | NEW, end of work | Plain markdown delivered to user at end of work, summarizing what changed and why, for the user to give to Codex when syncing the parallel `codex-plugins/agentboard/` tree. See §13. |

---

## 6. Schemas

### 6.1 ARCH_FACTS_BUNDLE_V1 (research agent output)

```
ARCH_FACTS_BUNDLE_V1
<JSON below>
```

```json
{
  "schema_version": "1.0",
  "rules_version": "1.0",
  "spec_path": "<absolute path to the spec the level is computed against>",
  "scaffold_card_id": "<uuid>",
  "gathered_at": "<ISO 8601 timestamp>",
  "fields": {
    "new_contracts_count": {
      "value": 0,
      "evidence": [
        {
          "contract_name": "<name or short description>",
          "spec_quote": "<quote from spec implying introduction>",
          "absent_from_codebase": true,
          "rag_query_run": "<query>",
          "rag_match_count": 0
        }
      ]
    },
    "existing_contracts_modified_count": {
      "value": 0,
      "evidence": [
        {
          "contract_name": "<name>",
          "current_location": "<file:line>",
          "spec_quote": "<quote implying modification>"
        }
      ]
    },
    "trust_boundaries_introduced": {
      "value": false,
      "evidence": [
        {
          "boundary_kind": "auth | secrets | PII | external_system_call",
          "spec_quote": "<quote>"
        }
      ]
    },
    "migration_signals_present": {
      "value": false,
      "evidence": [
        {
          "signal_kind": "schema_change | data_movement | production_cutover | irreversible_state_change",
          "spec_quote": "<quote>"
        }
      ]
    },
    "external_system_count": {
      "value": 0,
      "evidence": [
        {
          "system_name": "<name>",
          "spec_quote": "<quote>"
        }
      ]
    },
    "expected_card_count_band": {
      "lower": 0,
      "upper": 0,
      "reasoning": "<brief: how the band was estimated; e.g., 'spec section count is 5; each section maps to 1-2 cards depending on coupling, so band is 5-8'>"
    },
    "coupling_hotspot_overlap": {
      "value": 0,
      "evidence": [
        {
          "file": "<path>",
          "is_in_top_coupled": true,
          "spec_implies_modification": true
        }
      ]
    },
    "security_relevant_keyword_hits": {
      "value": 0,
      "evidence": [
        {
          "keyword": "credential | token | secret | auth | PII | encryption | hash | salt | certificate | key",
          "spec_quote": "<quote with surrounding context>"
        }
      ]
    }
  },
  "rule_evaluation": {
    "rules_fired": ["<rule name(s) that fired>"],
    "computed_level": 1
  }
}
```

**Validation rules:**
- `schema_version` must be `"1.0"`
- `rules_version` must match the rule set baked into `architecture-research-agent.md` (currently `"1.0"`); if absent or mismatched, the bundle is invalid
- Every field present even when zero/false/empty
- Every non-zero numeric field MUST have at least that many evidence entries (e.g., `new_contracts_count: 3` requires 3 evidence entries)
- Boolean true fields require at least one evidence entry
- `expected_card_count_band.lower` ≤ `expected_card_count_band.upper`
- Lower bound is what classification rules use (bias toward higher when range is wide)
- `rule_evaluation.computed_level` ∈ {1, 2, 3}
- `rule_evaluation.rules_fired` lists every rule that triggered (an L3 bundle that triggered both `external_system_count > 0` AND `migration_signals_present` records both)

### 6.2 ARCH_BUNDLE_AUDIT_V1 (auditor output)

```
ARCH_BUNDLE_AUDIT_V1
<JSON below>
```

```json
{
  "schema_version": "1.0",
  "rules_version": "1.0",
  "audited_bundle_artifact_id": "<uuid of the research agent's bundle>",
  "audited_at": "<ISO 8601 timestamp>",
  "field_verdicts": {
    "new_contracts_count": {
      "verdict": "PASS | DISCREPANCY",
      "research_value": 3,
      "auditor_value": 3,
      "auditor_evidence": [ /* same shape as research evidence */ ],
      "discrepancy_note": "<only if DISCREPANCY: brief explanation, e.g., 'Research agent missed contract X at file:line — contract is implied by spec quote Y but not enumerated in research evidence'>"
    },
    "existing_contracts_modified_count": { "...same shape..." },
    "trust_boundaries_introduced": { "...same shape..." },
    "migration_signals_present": { "...same shape..." },
    "external_system_count": { "...same shape..." },
    "expected_card_count_band": {
      "verdict": "PASS | DISCREPANCY",
      "research_lower": 4,
      "research_upper": 6,
      "auditor_lower": 4,
      "auditor_upper": 6,
      "discrepancy_note": "<only if bands don't overlap or auditor's lower is higher>"
    },
    "coupling_hotspot_overlap": { "...same shape..." },
    "security_relevant_keyword_hits": { "...same shape..." }
  },
  "any_discrepancy": false,
  "corrected_bundle": null,
  "verified_level": 1,
  "verified_rules_fired": ["<rule names>"]
}
```

**When `any_discrepancy: true`:**
- `corrected_bundle` is a complete ARCH_FACTS_BUNDLE_V1 with the auditor's values substituted for every DISCREPANCY field
- The corrected bundle's `rule_evaluation` is recomputed from the corrected fields
- `verified_level` is the corrected bundle's `computed_level`
- `verified_rules_fired` reflects the corrected rule evaluation

**When `any_discrepancy: false`:**
- `corrected_bundle: null` (the original bundle is verified as-is)
- `verified_level` matches the research bundle's `rule_evaluation.computed_level`

**Auditor discipline (encoded in agent profile):**
- The auditor MUST measure every field independently before looking at the research bundle
- The auditor MUST NOT promote or demote the level by direct judgment — only via correcting facts
- For `expected_card_count_band`, auditor's verdict is PASS if the bands overlap; DISCREPANCY only when they don't or when the auditor's lower is meaningfully higher (definition of "meaningfully": `auditor.lower > research.upper`)

### 6.3 Card Slice schema (per-card section in architecture document)

This schema is **consistent across L1, L2, L3.** Downstream agents do not branch on level; they consume the slice as-is.

```markdown
### <Card title>

- **Description** — what this card does, in architectural terms.
- **Allowed-touch list** — files this card may modify or create.
  - `<path>` — <one-line reason this card touches it>
  - ...
- **Forbidden-touch list** — files this card must not modify (when relevant).
  - `<path>` — <one-line reason: e.g., "owned by <other card>", "contract truth lives elsewhere">
  - ... (or "None — no cross-card forbidden touches at this level")
- **Produces** — contracts produced by this card and their consumer cards.
  - `<contract name or interface>` — consumed by <card title(s)>
  - ... (or "None")
- **Consumes** — contracts consumed by this card and their producer cards.
  - `<contract name>` — produced by <card title>
  - ... (or "None")
- **Verification scope** — `local-only` | `contributes to <verification card title>` | `owns end-to-end verification`.
- **Depends on** — other card titles this card depends on (or "None").
- **Source decisions** — D# references from the architecture document's Design decisions section that justify this slice. At L1 (where no design decisions section exists), substitute the form "Direct from spec — R# and/or Q# (no design decisions at this level)" naming the specific spec requirements this slice implements. Bare "Direct from spec" without R#/Q# attribution is non-compliant: it loses the traceability path downstream planning agents read to know which spec requirement each card satisfies.
```

At L1, the per-card content is brief: most fields are short or "None"; the slice IS the architecture's substance.
At L2/L3, slices reference D# decisions in the architecture document's Design decisions section that justify the boundaries.

---

## 7. Classification rules (v1.0)

**Authoritative location:** baked into `agents/architecture-research-agent.md`, with a `rules_version: "1.0"` stamp. Changes require explicit version bump and updates to both the research agent and the auditor (which validates `rules_version` matches).

**Order of evaluation:** L3 triggers checked first; if any fire, level is L3 and L2 triggers are not evaluated. L2 triggers checked next if not L3. L1 is the default if neither L3 nor L2 trigger.

### 7.1 L3 triggers (any fires → level is L3)

| Rule | Trigger | Reasoning |
|---|---|---|
| `R-L3-EXT` | `external_system_count > 0` | Any third-party API, service, or integration introduces wire-format contracts, version dependencies, and failure modes that need formal threat modeling and Context7-verified API behavior. Hard line. |
| `R-L3-MIG` | `migration_signals_present == true` | Schema changes, data movement, production cutover, or irreversible state changes are inherently cross-system and often irreversible. They need detailed planning, threat modeling, and traceability. Hard line. |
| `R-L3-SEC` | `trust_boundaries_introduced AND security_relevant_keyword_hits >= 3` | Trust boundary alone might be a small internal one; high keyword density signals security is a substantive concern. The AND gate prevents one passing mention of "token" in a non-security context from triggering L3. |
| `R-L3-CONTRACTS` | `new_contracts_count > 5` | More than five new contracts means the architecture has substantial cross-component design surface — single-owner ownership decisions, dependency graph complexity, and produces/consumes choreography all need full rigor. |
| `R-L3-CARDS` | `expected_card_count_band.lower >= 9` | Larger card counts mean more cross-card dependencies and verification ownership decisions. Threshold of 9 matches the gut-feel inflection where a workstream starts feeling like a project. |

### 7.2 L2 triggers (any fires → level is L2, given no L3 trigger fired)

| Rule | Trigger | Reasoning |
|---|---|---|
| `R-L2-NEW-CONTRACTS` | `new_contracts_count > 0` | Any new internal contract requires explicit single-owner declaration even if it's just one. The whole point of the architecture step is to declare contract ownership before parallel planning agents disagree on it. |
| `R-L2-MOD-CONTRACTS` | `existing_contracts_modified_count > 2` | Modifying multiple existing contracts creates cross-card dependencies (multiple cards may consume the same modified contract); needs explicit declaration. |
| `R-L2-CARDS` | `expected_card_count_band.lower >= 4` | Four or more cards usually means at least some inter-card dependency. The architecture must declare dependencies and verification ownership. |
| `R-L2-TRUST` | `trust_boundaries_introduced == true` (without high keyword density) | An internal trust boundary that isn't a major security concern still needs explicit declaration so planning agents don't accidentally route around it. |

### 7.3 L1 default (no L3 or L2 trigger)

L1 fires when none of the above triggers fire. By construction, L1 work has:
- 0 new contracts
- ≤2 existing contracts modified
- 1–3 expected cards
- No trust boundaries
- No external systems
- No migration signals
- No high security keyword density
- No coupling hotspot overlap that would amplify blast radius

L1 work is genuinely independent cleanup or surgical change.

### 7.4 Calibration notes

These thresholds are my best judgment; the user has agreed to tune them later from observed misclassifications. Calibration data should be tracked. Recommended approach when tuning:
- When a misclassification is observed (e.g., L1 work that should have been L2), record the bundle that triggered it and the corrected level
- Periodically review the misclassification log; adjust thresholds; bump `rules_version`
- Increment `rules_version` on every change so old bundles are invalidated when audit runs against them

The asymmetric cost rule applies to tuning: when in doubt about whether a threshold should be tightened or loosened, prefer tightening (toward higher levels). Underclassification is the failure mode the whole pipeline exists to prevent.

---

## 8. Per-file specifications

### 8.1 `agents/architecture-research-agent.md` (NEW, haiku)

**Frontmatter:**
- `name: architecture-research-agent`
- `description: Phase A of the architecture pipeline — mechanical fact-gathering against the spec and codebase, fills ARCH_FACTS_BUNDLE_V1 with countable fields and evidence, applies the v1.0 classification rules to compute level. Does not reason about architecture; produces facts that determine which compose agent runs in Phase B. Invoke from /architecture — the orchestrator passes spec_path, scaffold_card_id, and agent_id.`
- `model: claude-haiku-4-5-20251001`
- `tools`: Read, Glob, Grep, Bash, Skill, agentboard MCP (`get_card`, `list_workspace_artifacts`, `get_workspace_artifact`, `update_workspace_card`, `add_log_entry`, `submit_workspace_artifact`), codegraph (full set), codebase-rag (`rag_search`, `rag_query_impact`). `list_workspace_artifacts` + `get_workspace_artifact` are needed so the agent can mirror the `planning-research-agent` pattern of checking for a recent prior bundle and reusing it if `gathered_at` is within the last hour (avoids redundant work when `/architecture` is re-invoked).

**Body sections:**

1. **How to read this profile** — mandatory steps, no skip language, anti-skip rebuttals (mirror planning-research-agent's tone). Specific rebuttals: "I know which fields will be zero so I'll skip measuring" → no, every field is measured; "RAG returned nothing so I'll skip" → no, empty result is a finding; "the spec is clear, no codebase scan needed" → no, codegraph_scan is required to compute coupling_hotspot_overlap; "the rules feel like they should fire L2 here, I'll just record L2" → no, the rules ARE the computation, you don't pre-decide.

2. **Process steps:**
   1. **Fetch the scaffold card** via `agentboard_get_card` to confirm card exists.
   2. **Read the spec at `spec_path`.**
   3. **Scan the codebase** via `codegraph_scan`. Required even if the project has no scanned languages — empty scan is a recorded finding.
   4. **Measure each bundle field.** Each field has a specific measurement procedure (detailed below); execute every procedure, record evidence, never skip. Every `rag_search` / `rag_query_impact` invocation is run as part of a specific field's measurement and is recorded in that field's evidence slot (e.g., `new_contracts_count.evidence[].rag_query_run`). There is no separate "RAG discovery" step — searches happen because a field is being measured. A query whose result doesn't feed an evidence slot is a query the auditor cannot reproduce identically, which would produce false discrepancies.
   5. **Apply the v1.0 classification rules.** L3 triggers checked first (any fire → L3). If no L3 trigger, L2 triggers checked. If neither, L1.
   6. **Validate the bundle** against the schema (every field present, evidence counts match, rule_evaluation populated).
   7. **Submit the bundle** as a workspace artifact (`type: "general"`) via `agentboard_submit_workspace_artifact` to the scaffold card.

3. **Field measurement procedures** — per-field instructions:
   - `new_contracts_count`: for each interface/type/protocol the spec implies introducing, search the codebase via `rag_search` (`source_type="code"`) for existing implementations. If none found, count it as new. Evidence: spec quote + RAG query + match count. Threshold for "implied introducing": the spec uses language like "introduce," "new," "create," "define" applied to an interface, protocol, contract, or type.
   - `existing_contracts_modified_count`: for each interface in the codebase the spec implies modifying, locate it (`rag_search` + Read for confirmation) and record file:line.
   - `trust_boundaries_introduced`: scan spec for auth-related, secrets-related, PII-related, or external-call language. If any found, true. Evidence: spec quote + boundary kind classification.
   - `migration_signals_present`: scan spec for schema change, data movement, production cutover, or irreversible state change language. Evidence: spec quote + signal kind.
   - `external_system_count`: count distinct third-party APIs, services, or integrations named in the spec. Evidence per system.
   - `expected_card_count_band`: enumerate distinct work units implied by the spec's scope. Group related work. Estimate range. Bias bands toward wider when uncertain. Reasoning required.
   - `coupling_hotspot_overlap`: run `codegraph_get_stats` to get top-coupled files. For each file the spec implies modifying, check if it's in the top-coupled set.
   - `security_relevant_keyword_hits`: count occurrences of {credential, token, secret, auth, PII, encryption, hash, salt, certificate, key} in the spec text (case-insensitive, word-boundary). Each occurrence with surrounding context.

4. **Classification rules (v1.0)** — verbatim from §7 of this plan, with the rule names (R-L3-EXT, etc.) and the OR semantics within each tier and the order of evaluation (L3 first, L2 next, L1 default).

5. **Output contract:** Single ARCH_FACTS_BUNDLE_V1 artifact submitted to scaffold card. The artifact's content begins with the literal sentinel `ARCH_FACTS_BUNDLE_V1` on its own line, followed by a JSON document conforming to §6.1.

6. **Hard rules:**
   - Every field measured before classification rules apply (no shortcut where the agent guesses the level and back-fills evidence)
   - Every numeric field's evidence count must equal the field's value
   - Boolean true fields require at least one evidence entry
   - The `rules_version` field MUST be `"1.0"`; if the rule set in this profile is updated, the version bumps in lockstep
   - No editorial commentary; the agent doesn't reason about architecture, only about facts
   - On any tool failure: stop, report via card note + activity log, do not produce a partial bundle

7. **Worked examples (required in the profile body):** the profile must include one worked example per field-type so the agent has a concrete reference for evidence shape and the evidence-count-equals-value invariant. Minimum three examples:
   - One numeric field example (e.g., `new_contracts_count: 2` with two evidence entries, each with spec_quote + rag_query_run + rag_match_count)
   - One boolean field example (e.g., `trust_boundaries_introduced: true` with one evidence entry showing boundary_kind + spec_quote)
   - One band field example (`expected_card_count_band` with lower/upper/reasoning, showing the "bias toward wider when uncertain" discipline)

### 8.2 `agents/architecture-classification-auditor.md` (NEW, haiku)

**Frontmatter:**
- `name: architecture-classification-auditor`
- `description: Phase A audit of the architecture pipeline — independently re-derives every ARCH_FACTS_BUNDLE_V1 field from the spec and codebase, compares to the research agent's bundle, emits ARCH_BUNDLE_AUDIT_V1 with field-by-field PASS/DISCREPANCY verdicts. If discrepancies, emits a corrected bundle and recomputed level. Cannot promote/demote level except via correcting facts. Invoke from /architecture — the orchestrator passes spec_path, audited_bundle_artifact_id, scaffold_card_id, and agent_id.`
- `model: claude-haiku-4-5-20251001`
- `tools`: same as research agent

**Body sections:**

1. **How to read this profile** — mandatory anti-skip language. Key rebuttals:
   - "I'll just check the fields that look unusual" → no, every field is independently re-measured.
   - "The bundle looks right at a glance, I'll PASS everything" → no, the audit is mechanical re-measurement, not pattern recognition.
   - "I'll just glance at the bundle to know which fields to focus on" → no, the audit is independent re-measurement of every field BEFORE any comparison; glancing at the bundle first creates anchoring bias toward agreement, which is precisely the failure mode this agent exists to prevent. The ordering discipline in §2 is load-bearing.

2. **Audit ordering discipline (CRITICAL):** The auditor MUST measure every field from the spec independently BEFORE looking at the research agent's bundle. Looking at the bundle first creates anchoring bias toward agreement. Process:
   - Step 1: Fetch the scaffold card; do NOT fetch the bundle yet.
   - Step 2: Read the spec from `spec_path`.
   - Step 3: Run codegraph_scan and the same RAG queries the research agent should have run.
   - Step 4: Measure every bundle field independently (using the same procedures from §8.1.3). Record auditor's values + evidence in working memory.
   - Step 5: NOW fetch the research agent's bundle via `agentboard_get_workspace_artifact`.
   - Step 6: Compare field-by-field. Construct ARCH_BUNDLE_AUDIT_V1.
   - Step 7: If `any_discrepancy`, build the corrected bundle (auditor values for DISCREPANCY fields, research values for PASS fields). Recompute the level from the corrected bundle.
   - Step 8: Submit ARCH_BUNDLE_AUDIT_V1 artifact.

3. **Field comparison rules:**
   - Numeric fields: PASS if values match exactly; DISCREPANCY otherwise.
   - Boolean fields: PASS if values match; DISCREPANCY otherwise.
   - `expected_card_count_band`: PASS if the bands overlap (`research.upper >= auditor.lower` AND `research.lower <= auditor.upper`); DISCREPANCY otherwise. When DISCREPANCY, the corrected bundle's band is `[max(research.lower, auditor.lower), max(research.upper, auditor.upper)]` — bias toward higher.

4. **Discipline rules:**
   - The auditor's job is purely to verify accuracy of the inputs. It cannot decide the level should be higher or lower except through corrected facts.
   - If the auditor disagrees with a rule's threshold, that's not an audit finding — it's a calibration concern. The auditor still applies the v1.0 rules to the corrected bundle.
   - `rules_version` mismatch between research bundle and auditor's expected version is a hard fail (stop, report, do not submit audit).

5. **Output contract:** Single ARCH_BUNDLE_AUDIT_V1 artifact, content beginning with sentinel `ARCH_BUNDLE_AUDIT_V1`, JSON per §6.2.

### 8.3 `agents/architecture-compose-l3.md` (NEW, opus, derived from `expert-architecture.md`)

**This is the largest authoring piece.** The substantive content of `expert-architecture.md` becomes this profile. The mapping below specifies what changes.

**Frontmatter (NEW — file currently has none):**
- `name: architecture-compose-l3`
- `description: Phase B of the architecture pipeline at level L3. Produces a comprehensive architecture document and per-card slices for substantial work — anything triggering R-L3-EXT, R-L3-MIG, R-L3-SEC, R-L3-CONTRACTS, or R-L3-CARDS. Twelve-phase process: read inputs, understand goal, semantic survey, structural survey, identify standards, Context7 verification, detect spec problems, hard-decision reasoning, threat model when security in scope, design decisions in five-part format, ISO 25010 + ASVS mapping, write document, slice into cards. Three delivery gates plus trap audit. Clear Thought as a framework throughout. Invoke from /architecture only when verified_level == 3.`
- `model: opus` (the entire process is reasoning-heavy: Clear Thought, design decisions, three-gate review)
- `tools`: Read, Glob, Grep, Bash, Skill, agentboard MCP (`get_card`, `update_workspace_card`, `add_log_entry`, `submit_workspace_artifact`), codegraph (full set), codebase-rag (`rag_search`, `rag_query_impact`), Context7 (`resolve-library-id`, `query-docs`), Clear Thought (all eight tools: `metacognitivemonitoring`, `mentalmodel`, `debuggingapproach`, `structuredargumentation`, `sequentialthinking`, `scientificmethod`, `decisionframework`, `collaborativereasoning`)

**Section-by-section adaptations from `expert-architecture.md`:**

| Source section | Disposition |
|---|---|
| Top paragraph (architecture as bridge between spec and implementation) | Keep verbatim, slight rephrasing to match agent voice |
| "Apply the Expert Standard throughout this work" paragraph | Keep verbatim. Add note: "Activate `expert-standard` skill via `Skill` tool at session start. This is the shared cognitive frame; the rest of this profile is the level-specific process." |
| "How to read this command" subsection (six anti-skip rebuttals) | Keep substantively. Replace "command" with "profile". Each rebuttal references a phase that stays in this profile (3, 4, 5, 6, 8, 10), so rebuttals stay accurate. |
| "Where architecture work goes wrong" subsection (five traps) | Keep verbatim. These are universal architecture failure modes; they apply at L3 unchanged. |
| "Workflow context" subsection | REPLACE entirely. New text: "This agent runs as Phase B of the architecture pipeline. The orchestrator (`/architecture` command) has already produced and verified an L3 classification via `architecture-research-agent` and `architecture-classification-auditor`. The agent receives `spec_path`, `verified_level` (which must be 3 — if not, halt and report to the scaffold card), `scaffold_card_id`, `agent_id`, and the verified `arch_facts_bundle` inline. Operate hands-off from invocation to delivery — the only valid stop conditions are (a) hard contradictions in the spec or against governing standards (Phase 7) and (b) tool failures." |
| "Reasoning support" table | Keep verbatim. The eight Clear Thought tools mapped to phases — all apply at L3. |
| "Output contract" section | Keep substantively. Add a sentence about the Card Slices section being part of the contract: "The architecture document includes a Card Slices section conforming to the schema in `docs/plans/2026-05-09-architecture-pipeline-redesign.md` §6.3. The slices are the boundary truth for downstream planning agents; they are part of the output contract, not a post-hoc addition." |
| "Input" section | REPLACE. Currently says "the user will provide a path." Replace with: "The orchestrator passes `spec_path`. Read the spec in full. Read every document the spec references that resolves locally — prior architectures, prior plans, related specs, project-level governance documents, and standards documents the spec names." Remove `$ARGUMENTS`. |
| "Handling user requests to skip rigor" subsection | DELETE. At L3, rigor is set by classification, not negotiation. Replace with one sentence at the end of the Workflow context block: "Rigor at this level is non-negotiable. To run a different level, re-invoke `/architecture` and override the classification (which requires recomputing the bundle, not direct override)." |
| Phase 1 (Read inputs) | Keep substantively. Adjust the input source to `spec_path` from the orchestrator. |
| Phase 2 (Understand the goal) | Keep verbatim. Includes mandatory `metacognitivemonitoring` invocation. |
| Phase 3 (Codebase survey — semantic) | Keep substantively. The skill name `agentboard:codebase-rag` is correct; verify the namespace matches the plugin's actual skill path. |
| Phase 4 (Codebase survey — structural) | Keep verbatim. |
| Phase 5 (Identify governing standards) | Keep verbatim, including the `mentalmodel(first_principles)` discipline when no formal standard applies. |
| Phase 6 (Verify external libraries via Context7) | Keep verbatim. |
| Phase 7 (Detect and surface spec problems) | Keep verbatim, including the `structuredargumentation` requirement for hard contradictions. |
| Phase 8 (Reason through hard decisions with sequentialthinking) | Keep verbatim. |
| Phase 9 (Construct threat model) | Keep verbatim, including `scientificmethod` discipline. |
| Phase 10 (Design decisions in five-part format) | Keep verbatim, including `decisionframework` for 3+ alternatives. |
| Phase 10a (Quality characteristic mapping ISO 25010) | Keep verbatim. |
| Phase 10b (ASVS verification mapping) | Keep verbatim. |
| Phase 11 (Write the architecture document) | Keep substantively. Path changes from `docs/architectures/` to `docs/arch/<file>.md` (matches `/foundation`'s convention and the review-agent's `arch_path`). Output template adds a "## Card Slices" section between the Traceability matrix and Limitations sections. |
| **Phase 12 (Slice the architecture into implementation cards) — NEW** | Add this phase. Process: (a) for each coherent unit of work in the architecture document's Components and Design decisions sections, define a card; (b) for each card, derive the slice schema (allowed-touch from Components/decisions premise verifications; forbidden-touch from contracts owned by other cards; produces/consumes from Design decisions where contracts are introduced; verification scope from Phase 10a quality decisions; depends_on from Design decisions' implementation ordering); (c) record D# decision references that justify each slice; (d) write the slices into the document's "## Card Slices" section. Slices are part of the output contract. |
| Output template (in Phase 11) | Add "## Card Slices" section per §6.3 of this plan, between Traceability matrix and Limitations. |
| "Before delivering" gates | Keep all three (A, B, C) and the trap audit. Extend Gate C structural checklist with: "Every card slice in the Card Slices section has all eight §6.3 schema fields populated (description, allowed-touch, forbidden-touch, produces, consumes, verification scope, depends on, source decisions) — fields whose value is genuinely 'None' for this slice still appear with that value, not omitted" and "No two slices have overlapping allowed-touch lists unless explicitly justified in the slice descriptions." |
| Submission instructions | REPLACE. Currently says "write the architecture file at the chosen path... Do not commit the file to git. Do not modify any other file." Replace with: (a) write the file at `docs/arch/<file>.md`; (b) submit the document content as an `architecture_document` workspace artifact to the scaffold card via `agentboard_submit_workspace_artifact`; (c) write a card note via `agentboard_update_workspace_card` summarizing the document's goal, level, decision count, and slice count; (d) log via `agentboard_add_log_entry`. The orchestrator (`/architecture` command) handles user approval, git commit, and card creation from the slices. |
| "What comes after" section | REPLACE. Currently references `/expert-plan`. Replace with: "After user approval and git commit (handled by `/architecture`), the orchestrator creates one workspace card per slice. `/orchestrate` then runs the planning → review → implementation → audit waves on those cards. Planning agents receive each card's slice as boundary truth via `arch_slice`; review agents receive the full architecture document via `arch_path`." |

**Estimated profile length:** ~600–800 lines (current `expert-architecture.md` is ~850 lines including escapes; absorbed content with adaptations and Phase 12 should be similar after de-escaping).

### 8.4 `agents/architecture-compose-l2.md` (NEW, opus, independently authored)

**Frontmatter:**
- `name: architecture-compose-l2`
- `description: Phase B of the architecture pipeline at level L2. Produces an architecture document and per-card slices for coupled work that introduces internal contracts or shared verification but no external systems, migrations, or substantial security surface. Eight-phase process: read inputs, understand goal, semantic survey, structural survey, identify standards, detect spec problems, design decisions in five-part format, slice into cards. Three delivery gates as inline checklists plus trap audit. Invoke from /architecture only when verified_level == 2.`
- `model: opus`
- `tools`: Read, Glob, Grep, Bash, Skill, agentboard MCP (same set as L3), codegraph (full set), codebase-rag (`rag_search`, `rag_query_impact`). NOTE: no Context7 (L2 doesn't introduce external libraries by classification), no Clear Thought tools.

**Body sections (independently authored, drawing from L3 substance where applicable):**

1. **How to read this profile** — same anti-skip discipline. Specific rebuttals adapted for L2 phases.

2. **Activate `expert-standard` skill** at step 1.

3. **The five traps** — keep verbatim from L3. Universal.

4. **Workflow context** — this agent runs as Phase B at level L2. Orchestrator has verified L2 classification. Hands-off from invocation to delivery.

5. **Output contract** — frame-correctness via Standards table + Design decisions; premise-correctness per-decision in the verification slot of the five-part format; gap acknowledgment in Limitations section. Card Slices section is part of the contract.

6. **Process phases (each kept from L3 with reasoning recorded in this plan):**

   - **Phase 1: Read inputs.** Kept; required for any architecture work. Read spec, prior specs, prior architectures (if family), governance docs.
   - **Phase 2: Understand the goal.** Kept; the goal anchor is required at every level. Drop the `metacognitivemonitoring` MCP invocation — at L2 the discipline of stating the goal is enough; the structured tool ceremony exceeds benefit.
   - **Phase 3: Semantic survey via RAG.** Kept; bounded scope (capabilities the architecture introduces, modifies, or replaces). The exact same survey-scope discipline from L3 applies.
   - **Phase 4: Structural survey via codegraph.** Kept; bounded scope. `codegraph_scan`, `get_stats`, `find_entry_points`, plus per-file `get_dependencies` / `get_dependents` / `get_change_impact` on the L2-relevant file set.
   - **Phase 5: Identify governing standards.** Kept; named standards primary. First-principles articulation when no standard applies — but produced inline (no `mentalmodel` MCP invocation), with the same three-part structure (goal / local-optimum shortcut / why chosen path serves goal).
   - **Phase 6: Detect and surface spec problems.** Kept. For hard contradictions, surface with thesis-antithesis-synthesis structure inline (no `structuredargumentation` MCP). Soft ambiguities resolved in design decisions, recorded.
   - **Phase 7: Design decisions in five-part format.** Kept. All five parts: decision, authoritative standard or first-principles anchor, why standard applies here, what this is NOT and why, premise verification. The five-part discipline IS the audit core; do not simplify. For 3+ alternatives, use a multi-criteria comparison inline (no `decisionframework` MCP) — table with alternatives × criteria, weighted as the agent reasons through. **Each non-trivial decision must additionally name its verification approach inline** — i.e., for the quality characteristic the decision advances (correctness, security, performance, maintainability, etc.), state how the decision is verified and at what scope (within the implementing card's files, against another card's output, end-to-end across multiple cards). This replaces L3's Phase 10a ISO 25010 mapping and is the source Phase 8 reads when deriving each slice's verification scope.
   - **Phase 7.5: Write the architecture document body.** Write `docs/arch/<file>.md` using the §8.4 item 8 output template populated from Phases 1–7. The `## Card Slices` section is written with a placeholder line (e.g., "_To be derived in Phase 8._") — the header is present, the content is empty. This pass exists for the same reason L3 splits Phases 11 and 12: slices are derived from the written document, not the agent's working memory. Phase 8 reads back the Components, Design decisions, and Traceability content from the document this step writes.
   - **Phase 8: Slice the architecture into implementation cards.** Same as L3 Phase 12. The slice schema is identical. Read the document written in Phase 7.5 as the source of truth for slice derivation; write the derived slices into the document's `## Card Slices` section, replacing the placeholder. Field sources at L2: allowed-touch / forbidden-touch / produces / consumes / depends_on derive from the Components and Design decisions sections (same as L3). **Verification scope** derives from each D# decision's inline verification approach (added to the five-part decision format per Phase 7 above) — a slice that implements decisions whose verification fits within its own allowed-touch is `local-only`; a slice whose decisions name verification that exercises another slice's produced contract is `contributes to <card>`; a slice whose decisions name verification that integrates across multiple cards' outputs is `owns end-to-end verification`. Delivery gates run on the populated document.

7. **Phases dropped from L3 (and why each):**
   - **Phase 6 (Context7 verification)** — L2 doesn't introduce external libraries by classification (R-L3-EXT would have triggered L3). If the L2 process discovers a need for an external library, that's a classification error → halt, report to scaffold card, escalate.
   - **Phase 9 (Threat model)** — L2 might have an internal trust boundary but the security_relevant_keyword_hits ≥ 3 condition isn't met (else R-L3-SEC would fire). A formal `scientificmethod`-structured threat model is overkill; record any internal trust boundary inline in the relevant design decision's "what this is NOT" field.
   - **Phase 10a (ISO 25010 mapping)** — heavy ceremony at L2. Quality concerns are folded into design decisions inline.
   - **Phase 10b (ASVS verification mapping)** — no security surface significant enough at L2.
   - **All Clear Thought MCP tool invocations** (metacognitivemonitoring, mentalmodel, debuggingapproach, structuredargumentation, sequentialthinking, scientificmethod, decisionframework, collaborativereasoning) — at L2 the discipline of structured reasoning stays; the MCP invocations are dropped to reduce overhead. The discipline is maintained inline (e.g., five-part decision format, thesis-antithesis-synthesis when needed, multi-criteria when 3+ alternatives).
   - **Collaborativereasoning Gate A** — replaced with an inline three-perspective checklist: "Implementer perspective: where in this document would a planner have to make an architectural call inline? Reviewer perspective: which decisions are unverifiable? Stakeholder perspective: which trade-offs are unstated?"

8. **Output template for L2 architecture document:**
   ```
   # Architecture — [Name]
   ## Goal — what this architecture serves
   ## Scope (in / deferred / out)
   ## Components and structure
   ## Design decisions (D1, D2, … in five-part format)
   ## Card Slices (per §6.3)
   ## Traceability matrix (every R# and Q# accounted for)
   ## Limitations and trade-offs
   ## Standards governing this architecture (audit table)
   ## Status of this architecture
   ```
   Path: `docs/arch/<file>.md`. No threat model section, no ASVS mapping, no quality characteristics table, no inheritance section unless this is a sibling architecture.

9. **Three delivery gates — inline checklist version.**
   - **Gate A (downstream enablement)** — answer in writing: can a planner produce concrete file-level steps without making architectural decisions? Can a reviewer verify the build? Can a stakeholder understand the trade-offs? "No" to any → fix the document.
   - **Gate B (auditability)** — every question in L3's Gate B that applies at L2 is answerable from the document alone (with section pointers). At L2, the questions about ASVS / threat model / Quality characteristics drop because those sections don't exist.
   - **Gate C (structural checklist)** — adapted from L3 Gate C: every required section present; every non-trivial decision has all five parts; every slice has all eight §6.3 schema fields populated (description, allowed-touch, forbidden-touch, produces, consumes, verification scope, depends on, source decisions — fields whose value is genuinely "None" still appear with that value, not omitted); file paths confirmed; no scratchpad content remains. **Plus the discipline-coverage check** — every conditional inline discipline either appears in the document where its trigger fired, OR an explicit attestation states the trigger condition did not hold. The conditional disciplines and their triggers: (a) first-principles articulation in the three-part structure (goal / local-optimum shortcut / why chosen path serves goal) appears for every Phase 5 decision that used the first-principles anchor instead of a named standard; (b) thesis-antithesis-synthesis structure appears for every Phase 6 hard contradiction that was surfaced; (c) multi-criteria comparison table appears for every Phase 7 decision that had three or more plausible alternatives; (d) verification approach is named in every non-trivial Phase 7 decision's five-part format (non-conditional — always required at L2). An attestation suffices when the trigger condition did not hold for this architecture (e.g., "no Phase 5 decision used the first-principles anchor — every decision was governed by a named standard"); silent omission is non-compliance.
   - **Trap audit** — all five traps checked.

10. **Submission** — same pattern as L3: write document, submit as `architecture_document` artifact, card note, activity log entry. Orchestrator handles approval / commit / card creation.

**Estimated profile length:** ~400–500 lines.

### 8.5 `agents/architecture-compose-l1.md` (NEW, opus, independently authored)

**Frontmatter:**
- `name: architecture-compose-l1`
- `description: Phase B of the architecture pipeline at level L1. Produces a slim architecture document focused on per-card slices for trivial work: 1–3 independent cards, no new contracts, no trust boundaries, no migrations, no external systems. The slicing IS the architecture at this level. Invoke from /architecture only when verified_level == 1.`
- `model: opus` (the slicing still requires careful reasoning even when the rest is light)
- `tools`: Read, Glob, Grep, Skill, agentboard MCP (same set), codegraph (`scan`, `get_stats`, `list_files`, `get_dependencies`, `get_dependents`), codebase-rag (`rag_search`)

**Body sections:**

1. **How to read this profile** — anti-skip language. Key rebuttal: "this is L1, the architecture barely matters" → no, the slicing IS the architecture; planning agents downstream depend on the slice's allowed-touch list to avoid inventing boundaries; getting the slicing wrong at L1 reproduces the original failure mode the pipeline exists to prevent.

2. **Activate `expert-standard` skill** at step 1.

3. **The five traps** — keep verbatim. Codebase-mirroring and pattern-cloning are the most relevant at L1.

4. **Workflow context** — runs at level L1. Orchestrator has verified.

5. **Output contract** — even at L1, the document serves three downstream consumers. The slicing schema is the boundary truth.

6. **Process phases:**
   - **Phase 1: Read inputs.** Spec only.
   - **Phase 2: Understand the goal.** Brief.
   - **Phase 3: Codebase survey — narrow.** `codegraph_scan` mandatory (no skip even at L1). `rag_search` only against the spec's specific outcomes — narrow scope. `get_dependencies` / `get_dependents` only on files the spec implies modifying.
   - **Phase 4: Identify governing standards.** Inherit from spec. L1 rarely adds new standards.
   - **Phase 5: Slice the cards.** For each card (1–3 by classification), derive all eight §6.3 schema fields per slice (description, allowed-touch, forbidden-touch, produces, consumes, verification scope, depends on, source decisions). Cards are typically independent at L1, so produces/consumes/depends_on are usually "None" or minimal — fields with no content for this slice still appear with the value "None", not omitted. Allowed-touch lists must still be precise (this is the boundary truth). **Source decisions** field at L1 uses the form "Direct from spec — R# and/or Q# (no design decisions at this level)" per §6.3 — every slice names the specific spec requirement(s) it implements. Bare "Direct from spec" is non-compliant and the delivery gate catches it.
   - **Phase 6: Write the architecture document.** Single-pass write. Produce the entire document per item 8's output template in one pass — Goal, Scope, Card Slices (populated with the Phase 5 slices), Limitations, Standards, Status. **L1 uses single-pass while L2 (§8.4 Phase 7.5 + Phase 8) and L3 (Phase 11 + Phase 12) use two-pass.** The asymmetry is structural, not stylistic: the two-pass principle at L2/L3 forces slices to derive from committed intermediate design content (Components, D# decisions, verification approach) that lives in the document body. At L1 that intermediate layer does not exist — slices trace directly to R#/Q# in the spec per §6.3, which is independently auditable against the spec without needing the L1 document as intermediary. Forcing two-pass at L1 would be ceremony without an audit function. Delivery gate runs on the written file.

7. **Phases dropped from L3 (with reason):**
   - Phase 5 (governing standards) — collapsed into Phase 4 above; standards usually just inherited
   - Phase 6 (Context7) — no external libraries by classification
   - Phase 7 (spec problems) — keep stop-condition for hard contradictions but no structured argumentation; soft ambiguities resolved inline in slice rationale
   - Phase 8 (hard decisions) — no design decisions worth the five-part format at L1
   - Phase 9 (threat model) — no security at L1
   - Phase 10/10a/10b — collapsed; the slicing IS the substance
   - All Clear Thought MCP invocations — same reasoning as L2

8. **Output template for L1 architecture document:**
   ```
   # Architecture — [Name]
   ## Goal — what this architecture serves
   ## Scope (in / out)

   _At L1, the slice Descriptions and Allowed-touch lists in the Card Slices section below carry the component-level content; no separate "Components and structure" or "Design decisions" section is produced. The slicing IS the architecture at this level._

   ## Card Slices (per §6.3)
   ## Limitations
   ## Standards governing this architecture (typically: "inherited from spec; no additions at L1")
   ## Status of this architecture
   ```
   Very thin. ~50–150 lines typical output. The italic attestation between Scope and Card Slices is mandatory — it self-documents the absence of Components and Design decisions sections so an auditor familiar with L2/L3 documents reads the absence as deliberate, not as an oversight.

9. **Single delivery gate (collapses A/B/C):** Mechanical checks the gate must verify before deliver: (a) every R# and Q# from the spec maps to at least one slice's Source decisions field or is recorded in the document's Scope as out-of-scope with reasoning; (b) every slice's Source decisions field uses the L1 form "Direct from spec — R# and/or Q# (no design decisions at this level)" with at least one R# or Q# attribution (bare "Direct from spec" fails the gate); (c) every slice has all eight §6.3 schema fields populated (description, allowed-touch, forbidden-touch, produces, consumes, verification scope, depends on, source decisions — fields whose value is genuinely "None" still appear with that value, not omitted); (d) every slice's allowed-touch list is precise (specific file paths, not directories or globs unless the card legitimately owns every file under that path); (e) no two slices have overlapping allowed-touch lists unless explicitly justified in the slice descriptions. If yes to all, deliver. If no to any, fix.

10. **Trap audit** — keep all five.

11. **Submission** — same pattern.

**Estimated profile length:** ~200–300 lines.

### 8.6 `commands/architecture.md` (REWRITE)

**Current state:** L2-shaped end-to-end command (research + design + write + create cards in one flow). The L2 design substance moves into `architecture-compose-l2.md`; this command becomes pure orchestration.

**New flow (already detailed in §4 above):**

1. Load tools (`agentboard`, `codegraph`, `rag`, `Context7`). Authenticate if needed. Activate `expert-standard` skill.
2. Locate the approved spec from `docs/specs/` (most recent or argument). Confirm with user.
3. Select or create a workspace board (`agentboard_list_apps`, `agentboard_list_boards`, possibly `agentboard_create_app` / `agentboard_create_board`). Read `auto_transitions` settings.
4. Create a scaffold card to hold flow artifacts via `agentboard_create_workspace_card`:
   - Title: `Architecture: <spec topic>`
   - Description: `Architecture flow scaffold. Holds research, audit, and architecture-document artifacts during the level-aware architecture pipeline. Will be moved to finished after cards are created from the architecture's slices.`
   - Status: stays in `backlog` during the flow
5. Spawn `architecture-research-agent` (background) with `spec_path`, `scaffold_card_id`, `agent_id`. Wait for completion.
6. Verify the agent submitted an `ARCH_FACTS_BUNDLE_V1` artifact (`agentboard_list_workspace_artifacts` on scaffold card; find artifact starting with sentinel). If not, halt and report.
7. Spawn `architecture-classification-auditor` (background) with `spec_path`, `audited_bundle_artifact_id`, `scaffold_card_id`, `agent_id`. Wait for completion.
8. Verify the agent submitted an `ARCH_BUNDLE_AUDIT_V1` artifact. Read `verified_level` from it (which is `corrected_bundle.rule_evaluation.computed_level` if `any_discrepancy`, else original bundle's `computed_level`).
9. Display to user (transparency, not approval): the bundle, the audit findings, the verified level, the rules that fired. Format as a brief markdown summary in the chat.
10. Dispatch:
    - if `verified_level == 1` → spawn `architecture-compose-l1`
    - if `verified_level == 2` → spawn `architecture-compose-l2`
    - if `verified_level == 3` → spawn `architecture-compose-l3`
    - any other value → halt, report (rule evaluation produced an invalid level)
    Pass to compose agent: `spec_path`, `verified_level`, `scaffold_card_id`, `agent_id`, the verified bundle inline. Wait for completion.
11. Verify the compose agent submitted an `architecture_document` artifact and wrote `docs/arch/<file>.md`.
12. Show the architecture document to the user. Get explicit approval. Apply any user-requested corrections (re-spawn the compose agent if corrections are substantial; otherwise edit inline).
13. Commit `docs/arch/<file>.md` to git on the current branch.
14. Read the Card Slices section of the architecture document.
15. For each slice, call `agentboard_create_workspace_card`:
    - `title`: from the slice
    - `description`: the full slice content (allowed-touch, forbidden-touch, produces, consumes, verification scope, depends_on, source decisions)
    - `priority`: ask user or infer from urgency
    - `depends_on`: per the slice's `depends_on` field (resolve card titles to IDs after all cards are created)
16. Move the scaffold card to `finished` (it now serves as the audit trail of how the architecture was produced).
17. Show summary:
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

    **Next step:** Start a new session and run /orchestrate to begin the planning → implementation pipeline.
    ```

**Key principles section in the new command (analogous to existing commands):**
- Foundation produces a spec (architecturally silent). Architecture produces the boundaries the spec is silent on.
- Classification is deterministic — research + auditor compute the level. The user does not override; transparency only.
- Cards do not exist until the architecture is approved.
- The architecture's slices are the boundary truth every planning agent works from.
- One question at a time when iterating with the user on document corrections.

### 8.7 `skills/workspace-orchestration/SKILL.md` (MINOR EDIT)

Update the prerequisites section to reflect the new architecture flow. Currently:

> A workspace board with cards in `backlog` (created via `/architecture`, which itself depends on a spec from `/foundation`)
> An approved architecture document at `docs/arch/<topic>.md` whose Card Slices section corresponds to the cards on this board

The text is already accurate. No changes likely needed unless the prerequisite needs to mention level transparency. Possibly add a note that the architecture document carries a level metadata field (level: L1/L2/L3) for the user's reference.

### 8.8 `README.md` (UPDATE)

**Sections to update:**
- "The two workflows — which one to use" table: workspace boards row already mentions `/architecture`; consider adding a note that architecture is level-aware (L1/L2/L3 by deterministic classification).
- "Commands → Workspace board commands → /architecture": rewrite the description to reflect:
  - The research + auditor + compose pipeline
  - Level-aware dispatch
  - User does NOT approve the level (transparency only); user DOES approve the architecture document
  - Output document at `docs/arch/`, cards created from Card Slices section
- Possibly add a brief explanation of the three levels for users who want to understand what to expect.

---

## 9. Sequencing — multi-session implementation order

The work is too large for one session. Each step below is a self-contained checkpoint where the user reviews before proceeding.

### Session 1 (this session, completed)
- Plan written (this document)
- Foundation files: `commands/foundation.md`, `commands/architecture.md` (current L2-shaped), `skills/spec-writing/SKILL.md`, agent updates for slice schema — already landed earlier in the cycle
- `expert-architecture.md` landed in plugin root as L3 source content

### Session 2: Research agent + auditor
- Author `agents/architecture-research-agent.md` per §8.1
- Author `agents/architecture-classification-auditor.md` per §8.2
- These are smaller profiles (~150–250 lines each)
- Implementation depends on §6.1 schema, §6.2 schema, §7 rules — all defined here
- Checkpoint: profiles reviewed, schema validation discipline confirmed

### Session 3: L3 compose agent
- Author `agents/architecture-compose-l3.md` per §8.3 (largest single piece, ~600–800 lines)
- Convert `expert-architecture.md` content with the 8 adaptations
- Add Phase 12 (slicing)
- Adjust output template to include Card Slices section
- Checkpoint: profile reviewed; verify Phase 12 produces slices correctly

### Session 4: L2 compose agent
- Author `agents/architecture-compose-l2.md` per §8.4 (~400–500 lines)
- Independently authored, drawing on L3 content
- Each phase kept-from-L3 has the rationale recorded; each phase dropped has the rationale recorded
- Checkpoint: profile reviewed; verify no skip language anywhere

### Session 5: L1 compose agent
- Author `agents/architecture-compose-l1.md` per §8.5 (~200–300 lines)
- Slimmest profile; the slicing IS the architecture
- Checkpoint: profile reviewed; verify the slim shape doesn't degrade the boundary-truth output

### Session 6: Orchestration command + final cleanup
- Rewrite `commands/architecture.md` per §8.6
- Delete `expert-architecture.md` from plugin root (content fully absorbed into L3 profile)
- Minor edits to `skills/workspace-orchestration/SKILL.md` and `README.md`
- Produce the codex sync report (§13)
- Checkpoint: end-to-end review of the full pipeline

### Optional Session 7: Calibration
- If the user wants to validate thresholds against real specs before relying on them, run the research agent against 2–3 example specs (Spec/Arch Restructure card, LeafLab Genkit migration, a hypothetical L1 cleanup case)
- Compare classifications to the user's gut judgment
- Tune thresholds; bump `rules_version`

---

## 10. Risks and calibration notes

### 10.1 Risks

- **L2 authoring is the highest-risk step.** It's "between" L1 and L3 — every "drop this from L3" needs a justified reason in the implementation, not "couldn't think of why not." Without justification, L2 collapses into either a thin L3 (loses the value of dropping ceremony) or an inflated L1 (loses the value of L2 rigor).
- **Threshold misclassification.** The placeholder thresholds in §7 are my best judgment. If `new_contracts_count > 5` is wrong (too lenient or too strict), L3 may either fire too rarely or too often. The bias-toward-higher rule helps but doesn't eliminate the risk. Calibration in Session 7 is the mitigation.
- **`expected_card_count_band` is the least mechanical field.** Estimating card count requires judgment about how the architecture will slice — but the architecture hasn't run yet at the point of classification. The auditor's independent re-derivation is the primary mitigation; bias-toward-wider-band is the secondary mitigation.
- **Profile drift.** L1, L2, L3 profiles will share boilerplate (frontmatter shape, "activate expert-standard" step, trap audit list). Over time, updates to one might not propagate to the others, causing divergence. Mitigation: when updating any compose profile, check the corresponding sections in the other two. (Long-term, factor genuinely-shared boilerplate into a shared skill — but only if duplication actually causes pain.)
- **`rules_version` drift.** If the research agent's rules update without the auditor's expected version updating in lockstep, audits will hard-fail with `rules_version` mismatch. Mitigation: every rule change must update both files in the same commit.
- **The scaffold card pattern.** Creating a scaffold card to hold flow artifacts is non-standard for the agentboard pipeline (planning/audit waves attach artifacts to per-implementation cards, not to a scaffold). Risk: orchestrators or future readers might confuse the scaffold card with an implementation card. Mitigation: the scaffold card's title is explicitly `Architecture: <topic>` and its description names its role.

### 10.2 Calibration notes (from §7.4)

- Thresholds tuned by misclassification observation, not by intuition
- Increment `rules_version` on every change so old bundles invalidate
- Asymmetric cost: when in doubt, tighten toward higher levels

---

## 11. Acceptance criteria

The architecture pipeline redesign is complete when all of the following hold:

1. `expert-architecture.md` no longer exists in the plugin root (content absorbed into L3 compose profile).
2. `agents/architecture-research-agent.md` exists, is haiku-modeled, and contains the v1.0 classification rules baked in.
3. `agents/architecture-classification-auditor.md` exists, is haiku-modeled, and validates `rules_version` matches.
4. `agents/architecture-compose-l1.md`, `-l2.md`, `-l3.md` all exist as opus-modeled, monolithic profiles with no skip language.
5. `commands/architecture.md` is rewritten as pure orchestration (research → audit → dispatch → compose → cards).
6. The `/architecture` command's flow includes the user-transparency display of bundle + audit + level (without prompting for approval of the level).
7. Each compose agent's Card Slices output conforms to §6.3 of this plan.
8. Downstream agents (`planning-research-agent`, `plan-compose-agent`, `review-agent`) work without modification because the slice schema is consistent.
9. README.md describes the level-aware architecture flow.
10. `docs/plans/2026-05-09-architecture-pipeline-redesign.md` (this document) remains as the authoritative plan record.
11. The codex sync report (§13) is delivered to the user as the final artifact of the work.

---

## 12. Open items deferred from this plan

These are flagged as known-deferred and should not be silently overwritten or worked around in future sessions:

- **Calibration of v1.0 thresholds against real specs** — deferred to Session 7 (optional). The user has agreed to "tune later"; until tuned, the v1.0 thresholds are the authoritative baseline.
- **Codex plugin tree (`codex-plugins/agentboard/`)** — separate runtime, parallel structure. Synced via the codex sync report at the end of the work; the user gives that report to Codex when they're ready to update the parallel tree. Out of scope for this redesign.
- **Multi-rater research extension** — the design supports eventually adding a second `architecture-research-agent` instance for multi-rater consensus, with disagreement handled by "higher count wins." Not implemented in v1; deferred until calibration data shows the auditor pattern isn't catching enough.
- **Long-term factoring of shared compose-profile boilerplate** — if profile drift becomes a maintenance burden, factor genuinely-shared content into a shared skill. Not done in v1; YAGNI.

---

## 13. Codex sync report (deliverable at end of work)

At the completion of Session 6 (or whenever the implementation is fully landed), produce a separate plain-markdown report at `docs/plans/2026-05-XX-codex-sync-report.md` (date filled in at delivery time). The report's purpose is to summarize what changed in the agentboard plugin tree so the user can apply the same changes to the parallel `codex-plugins/agentboard/` tree.

**Report contents (template):**

```markdown
# Codex Sync Report — Architecture Pipeline Redesign

**Date:** <delivery date>
**Source plan:** docs/plans/2026-05-09-architecture-pipeline-redesign.md
**Source tree:** claude-plugins/agentboard/
**Target tree:** codex-plugins/agentboard/

## What changed and why

### New files (apply parallel changes to codex-plugins/agentboard/)
- `agents/architecture-research-agent.md` — [purpose, key contents, codex-specific adaptation notes]
- `agents/architecture-classification-auditor.md` — ...
- `agents/architecture-compose-l1.md` — ...
- `agents/architecture-compose-l2.md` — ...
- `agents/architecture-compose-l3.md` — ...

### Modified files
- `commands/architecture.md` — rewritten as pure orchestration; previous L2-shaped content split into compose-l2 profile
- `skills/workspace-orchestration/SKILL.md` — minor edits
- `README.md` — updated for level-aware flow

### Deleted files
- `expert-architecture.md` — content absorbed into agents/architecture-compose-l3.md

## Codex-specific adaptation notes

Codex runtime differs from Claude Code in [list specific differences if known]. When applying these changes to codex-plugins/agentboard/, watch for:
- [adaptation point 1]
- [adaptation point 2]

## Verification checklist for the codex tree

After applying parallel changes:
- [ ] All file paths translate correctly (e.g., agents/ vs skills/ namespacing)
- [ ] Tool names map correctly (Codex's MCP tool surface may differ)
- [ ] Frontmatter conventions match Codex's plugin schema
- [ ] Skill activation pattern matches Codex's skill invocation mechanism
- [ ] No claude-specific tool dependencies remain (e.g., Clear Thought MCP — confirm Codex has parallel access)
```

The actual report is produced at the end of work, not during planning. This template is the placeholder.

---

## 14. Implementation discipline

When executing this plan in future sessions:

1. **Read this document first.** Even if you remember the plan from the prior session, re-read. Memory of the plan is not the plan.
2. **Each compose-agent profile is authored independently.** Do not write L2 by copying L3 and deleting sections — that produces a profile with hidden L3 conditionals. Author from scratch with this plan's specifications as the source of truth.
3. **The schemas in §6 are the contract.** Every artifact a research agent or auditor produces must conform exactly. Validate before submission.
4. **The classification rules in §7 are the contract.** Both research agent and auditor must apply them identically. `rules_version` must match across both files in any given commit.
5. **No skip language anywhere in compose-agent profiles.** When tempted to write "if X, skip Y," it's the wrong abstraction — split into separate level profiles instead, or move the conditional to the orchestrator.
6. **Test the pipeline end-to-end before declaring done.** Spec → architecture → cards. Confirm the slice schema produced by L1, L2, L3 is identical in shape (only depth differs). Confirm downstream `planning-research-agent` / `plan-compose-agent` / `review-agent` consume slices without any new branching.

---

## 15. Authorization note

This plan was developed in collaboration with the user across one extended session. Decisions captured in this plan reflect explicit user agreement on:

- Spec is architecturally silent (no architecture content in the spec)
- `/architecture` is a separate command between `/foundation` and `/orchestrate`
- No conditional/skip language in compose-agent profiles
- Three independently authored monolithic compose profiles per level
- Deterministic classification via research agent + auditor; no user override
- Bake unique-to-agent content; activate shared cognitive frames as skills
- Per-card slice schema consistent across levels
- Bias toward higher level when uncertain
- Threshold calibration deferred to post-implementation
- `expert_card_count_band` kept with bounds
- `expert-architecture.md` absorbed and deleted from plugin root
- Codex tree sync via report at end of work

Future sessions should treat the items above as locked; deviating requires explicit user re-confirmation.
