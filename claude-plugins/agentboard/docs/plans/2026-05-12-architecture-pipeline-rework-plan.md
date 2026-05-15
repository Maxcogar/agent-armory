# Architecture Pipeline Rework — Plan

**Date:** 2026-05-12
**Status:** Authoritative plan for the architecture pipeline rework. Specifies HOW to satisfy every commitment in `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md`.
**Supersedes:** `docs/plans/2026-05-09-architecture-pipeline-redesign.md` as the authoritative plan for the architecture pipeline. The 2026-05-09 plan is preserved as historical record only.
**References:**
- `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md` — definition of done. This plan's correctness is measured against the contract.
- `docs/plans/2026-05-12-architecture-pipeline-rework-issues.md` — the diagnosis of what shipped wrong in Sessions 1–6.

---

## Preamble

This plan does not re-litigate any decision in the contract. It specifies HOW each contract commitment is satisfied.

Five rules govern every section below:

1. **Plant-watering discipline.** Every sentence in a subagent profile is an instruction to that subagent. No mixed-audience content. The plan specifies profile content with this rule embedded; the reviewer pass tests it explicitly.
2. **Cross-cutting expert-standards activation.** Every subagent profile's Step 1 is exactly: `Activate the expert-standards skill: Skill(skill: "agentboard:expert-standards"). This is the shared cognitive frame for all engineering work in this pipeline; subsequent process operates inside it.` No conditional, no skip.
3. **No codebase discovery in compose.** Compose profiles have zero `rag_search`, `codegraph_*`, or `rag_query_impact` references anywhere in the profile file — frontmatter, workflow context, process text, output template, examples. Context7 (`resolve-library-id` and `query-docs`) stays available to compose.
4. **Level representation split.** Machine contracts (bundle, audit, orchestrator dispatch) use numeric `1`/`2`/`3`. Document marker uses `**Level:** L1`/`L2`/`L3`. Compose translates numeric → marker form when authoring; hook handles both.
5. **§8.7 supersession.** The 2026-05-09 plan's §8.7 ("no level metadata field in architecture documents") is explicitly superseded. All compose output templates include the `**Level:** L#` marker in the Status section.

The 2026-05-09 plan's §6.3 slice schema and §7 classification rules v1.0 are preserved unchanged and referenced where applicable.

---

## 1. Subagent boundary contracts

Each subagent in the rework has a single coherent contract that specifies what it consumes, what it produces, and what is out of its scope. The contract is the load-bearing piece of each subagent's profile and appears at the top of each profile after the cross-cutting expert-standards activation step.

### 1.1 `architecture-research-agent`

- **Consumes:** `spec_path` (file path string), `scaffold_card_id`, `agent_id`.
- **Produces:** one `ARCH_FACTS_BUNDLE_V2` artifact submitted to the scaffold card via `submit_workspace_artifact`.
- **Scope:** mechanical discovery (RAG, codegraph, Context7 library resolution), classification measurement against v1.0 rules, evidence citation for every field.
- **NOT in scope:** design reasoning, slice derivation, document authoring, level revision (compute only — corrections happen at audit).

### 1.2 `architecture-classification-auditor`

- **Consumes:** `spec_path`, `audited_bundle_artifact_id`, `scaffold_card_id`, `agent_id`.
- **Produces:** one `ARCH_BUNDLE_AUDIT_V2` artifact submitted to the scaffold card.
- **Scope:** independent re-derivation of every bundle field (classification + design) BEFORE looking at the research agent's bundle, then field-by-field comparison; corrected bundle and recomputed level when discrepancies are flagged.
- **NOT in scope:** design reasoning, slice derivation, document authoring, soft-judgment overrides not anchored in a field discrepancy.

### 1.3 `architecture-compose-l3` (opus)

- **Consumes:** `spec_path`, `verified_level: 3`, `scaffold_card_id`, `agent_id`, full verified `ARCH_FACTS_BUNDLE_V2` inline.
- **Produces:** one `architecture_document` artifact (document content) submitted via `submit_workspace_artifact`; the same content written to `docs/arch/<file>.md` via Write.
- **Scope:** read inputs (Step 1 activation, Step 2 bundle ingestion), goal, standards identification (including ISO 25010 mapping, ASVS when security in scope), spec problem detection, hard decisions in five-part format, threat model when security in scope, design decisions, quality characteristic mapping (10a), ASVS mapping (10b), document write (Phase 11), slicing (Phase 12). Clear Thought tools throughout per the 2026-05-09 plan's reasoning support table. Context7 `query-docs` against bundle library IDs (and `resolve-library-id` for libraries not in bundle).
- **NOT in scope:** `rag_search`, `codegraph_*`, `rag_query_impact` (any codebase discovery — comes from bundle). Halts if `verified_level != 3`.

### 1.4 `architecture-compose-l2` (opus)

- **Consumes:** `spec_path`, `verified_level: 2`, `scaffold_card_id`, `agent_id`, full verified `ARCH_FACTS_BUNDLE_V2` inline.
- **Produces:** `architecture_document` artifact; `docs/arch/<file>.md`.
- **Scope:** read inputs (Step 1, Step 2 bundle ingestion), goal, standards (lighter than L3), spec problems, design decisions in five-part format with inline verification approach per decision (replaces L3's Phase 10a/10b ceremony), two-pass write (Phase 7.5 body, Phase 8 slicing). No Clear Thought MCP invocations — disciplines stay inline per 2026-05-09 plan's §8.4.
- **NOT in scope:** Phase 6 (Context7-as-discovery), Phase 9 (threat model — internal trust boundary noted inline in relevant decision instead), Phase 10a (ISO 25010 ceremony), Phase 10b (ASVS), codebase discovery. Halts if `verified_level != 2`.

### 1.5 `architecture-compose-l1` (opus)

- **Consumes:** `spec_path`, `verified_level: 1`, `scaffold_card_id`, `agent_id`, full verified `ARCH_FACTS_BUNDLE_V2` inline.
- **Produces:** `architecture_document` artifact (slim — slices ARE the architecture); `docs/arch/<file>.md`.
- **Scope:** read inputs (Step 1, Step 2 bundle ingestion), goal, standards (inherited from spec), slice the cards (1–3 cards by classification), single-pass write per 2026-05-09 plan's §8.5 Phase 6.
- **NOT in scope:** design decisions section, components and structure section, threat model, ASVS, quality characteristics, codebase discovery. Halts if `verified_level != 1`.

### 1.6 `architecture-design-reviewer` (sonnet 4.6 + extended thinking)

- **Consumes:** `spec_path`, `architecture_document_path`, `architecture_document_artifact_id`, `verified_bundle_artifact_id`, `scaffold_card_id`, `agent_id`. (Both path and artifact ID for the architecture document — path for direct Read access, artifact ID for fetching via `get_workspace_artifact` if disk read fails. Reviewer chooses whichever path is convenient.)
- **Produces:** one `ARCH_DESIGN_REVIEW_V1` artifact submitted to the scaffold card. Findings list with severity tags.
- **Scope:** read spec, architecture document, verified bundle. Evaluate decisions against spec requirements (every R#/Q# addressed or scoped out), surface unjustified slices, contract mismatches between produces/consumes pairs, standards-decoration trap, decision-hiding trap, deferred-decision trap.
- **NOT in scope:** rewriting the architecture document, blocking user approval directly (advisory only), reasoning that requires fresh codebase discovery (review reads the bundle, doesn't re-derive).

---

## 2. `ARCH_FACTS_BUNDLE_V2` schema

The bundle is submitted as a workspace artifact with content serialized as JSON (the orchestrator parses it as JSON before passing it inline to compose).

```json
{
  "schema_version": "2.0",
  "rules_version": "1.0",
  "spec_path": "<path>",
  "spec_hash": "<sha256 of spec content for staleness detection>",

  "classification_fields": {
    "new_contracts_count": {
      "value": <int>,
      "evidence": [
        {"contract_name": "<name>", "spec_quote": "<text>", "spec_location": "<heading or line>"}
      ]
    },
    "existing_contracts_modified_count": {
      "value": <int>,
      "evidence": [/* contract name, current location in codebase, modification implied by spec */]
    },
    "trust_boundaries_introduced": {
      "value": <bool>,
      "evidence": [/* boundary description, spec quote */]
    },
    "migration_signals_present": {
      "value": <bool>,
      "evidence": [/* signal description, spec quote — schema changes, data movement, cutover */]
    },
    "external_system_count": {
      "value": <int>,
      "evidence": [/* system name, spec quote, integration kind */]
    },
    "expected_card_count_band": {
      "lower": <int>,
      "upper": <int>,
      "evidence": [/* reasoning for the band */]
    },
    "coupling_hotspot_overlap": {
      "value": <bool>,
      "evidence": [/* hotspot files (from codegraph_get_stats), spec implications that touch them */]
    },
    "security_relevant_keyword_hits": {
      "value": <int>,
      "evidence": [/* keyword, spec location, context */]
    }
  },

  "design_fields": {
    "files_relevant": [
      {
        "path": "<repo-relative path>",
        "role": "candidate-new" | "candidate-modified" | "dependency" | "entry-point" | "hotspot",
        "exists": <bool>,
        "reason": "<why this file is relevant per spec>"
      }
    ],
    "dependency_edges": [
      {"from": "<path>", "to": "<path>", "kind": "import" | "call" | "type"}
    ],
    "blast_radius": {
      "for_candidate_modified_set": [
        {
          "path": "<path>",
          "direct_dependents": <int>,
          "transitive_count": <int>,
          "risk_level": "low" | "medium" | "high",
          "top_affected": ["<path>", ...]
        }
      ]
    },
    "existing_patterns_hits": [
      {
        "query": "<RAG query string>",
        "file": "<path>",
        "line_range": "<L:L>",
        "snippet": "<exact text>",
        "relevance_score": <float>
      }
    ],
    "constraint_hits": [
      {
        "query": "<RAG query string>",
        "file": "<path>",
        "line_range": "<L:L>",
        "snippet": "<exact text>",
        "relevance_score": <float>
      }
    ],
    "external_libraries": [
      {
        "name": "<library name>",
        "context7_id": "<resolved ID or null>",
        "why_needed": "<spec quote or implication>"
      }
    ],
    "open_questions": [
      {
        "question": "<ambiguity description>",
        "spec_location": "<heading or line>",
        "options_considered": ["<option 1>", "<option 2>"],
        "resolution_path": "<what compose needs to address>"
      }
    ]
  },

  "rule_evaluation": {
    "rules_fired": ["R-L3-EXT" | "R-L3-MIG" | ...],
    "computed_level": 1 | 2 | 3,
    "reasoning": "<which rules fired with which evidence>"
  },

  "agent_metadata": {
    "agent_id": "<id>",
    "model": "claude-haiku-4-5-20251001",
    "timestamp_iso": "<ts>"
  }
}
```

Required fields are all top-level fields. Evidence arrays may be empty only when the value is genuinely empty (e.g., `new_contracts_count: 0` may have empty evidence; `new_contracts_count: 3` must have ≥3 evidence entries).

`computed_level` is **numeric** per the level representation split.

---

## 3. `ARCH_BUNDLE_AUDIT_V2` schema

```json
{
  "schema_version": "2.0",
  "rules_version": "1.0",
  "spec_path": "<path>",
  "audited_bundle_artifact_id": "<id>",

  "version_validation": {
    "schema_version_match": <bool>,
    "rules_version_match": <bool>,
    "spec_path_match": <bool>,
    "spec_hash_match": <bool>
  },

  "field_verdicts": {
    "new_contracts_count": {
      "verdict": "PASS" | "DISCREPANCY",
      "research_value": <int>,
      "auditor_value": <int>,
      "method": "re-measure-and-compare",
      "details": "<if DISCREPANCY, what differed and why auditor value is correct>"
    },
    "existing_contracts_modified_count": { /* same shape */ },
    "trust_boundaries_introduced": { /* same shape */ },
    "migration_signals_present": { /* same shape */ },
    "external_system_count": { /* same shape */ },
    "expected_card_count_band": { /* same shape */ },
    "coupling_hotspot_overlap": { /* same shape */ },
    "security_relevant_keyword_hits": { /* same shape */ },

    "files_relevant": {
      "verdict": "PASS" | "DISCREPANCY",
      "research_set_size": <int>,
      "auditor_set_size": <int>,
      "method": "independent-derivation-and-set-comparison",
      "missing_from_research": ["<path>", ...],
      "extra_in_research": ["<path>", ...],
      "role_mismatches": [{"path": "<>", "research_role": "<>", "auditor_role": "<>"}],
      "details": "<>"
    },
    "dependency_edges": {
      "verdict": "PASS" | "DISCREPANCY",
      "method": "graph-comparison",
      "missing_edges": [/* ... */],
      "extra_edges": [/* ... */]
    },
    "existing_patterns_hits": {
      "verdict": "PASS" | "DISCREPANCY",
      "method": "snippet-existence-verification",
      "snippet_existence_results": [
        {"snippet_id": <i>, "file": "<>", "exact_match_found": <bool>}
      ],
      "details": "<missing or mismatched snippets>"
    },
    "constraint_hits": { /* same shape as existing_patterns_hits */ },
    "external_libraries": {
      "verdict": "PASS" | "DISCREPANCY",
      "method": "independent-identification-and-set-comparison",
      "library_set_diff": {/* missing from research, extra in research, ID mismatches */}
    },
    "blast_radius": {
      "verdict": "PASS" | "DISCREPANCY",
      "method": "recompute-and-compare"
    },
    "open_questions": {
      "verdict": "PASS" | "DISCREPANCY",
      "method": "bidirectional-open-question-comparison",
      "auditor_additional_questions": [/* questions auditor flagged that research missed */],
      "research_only_questions": [/* questions research flagged that auditor did not surface, each with auditor_assessment ∈ {"confirmed_genuine", "unsubstantiated"} */]
    }
  },

  "any_discrepancy": <bool>,

  "corrected_bundle": <full ARCH_FACTS_BUNDLE_V2 or null — when non-null, corrected_bundle.rule_evaluation.computed_level equals recomputed_level (the auditor substitutes the recomputed level into the corrected bundle's rule_evaluation field so compose can rely on a single field for the level)>,
  "recomputed_level": <1 | 2 | 3 | null>,

  "verified_level": <1 | 2 | 3>,

  "agent_metadata": {
    "agent_id": "<id>",
    "model": "claude-sonnet-4-6",
    "extended_thinking": true,
    "timestamp_iso": "<ts>"
  }
}
```

`verified_level` is the level the orchestrator uses for compose dispatch. When `any_discrepancy == false`, it equals `audited_bundle.rule_evaluation.computed_level`. When `any_discrepancy == true`, it equals `recomputed_level`.

All level fields are **numeric**.

---

## 4. `ARCH_DESIGN_REVIEW_V1` schema

```json
{
  "schema_version": "1.0",
  "spec_path": "<path>",
  "architecture_document_path": "<path>",
  "architecture_document_artifact_id": "<id>",
  "verified_bundle_artifact_id": "<id>",

  "findings": [
    {
      "id": "F1",
      "severity": "blocker" | "serious" | "minor",
      "category": "missing-decision" | "unjustified-slice" | "contract-mismatch" | "standards-decoration" | "decision-hiding" | "deferred-decision" | "other",
      "summary": "<one-line>",
      "details": "<detailed reasoning>",
      "document_citation": {
        "section": "<heading>",
        "decision_id_or_slice_name": "<D# or slice title or null>",
        "quoted_text": "<excerpt>"
      },
      "suggested_resolution": "<what the user could ask compose to change>"
    }
  ],

  "summary": {
    "blocker_count": <int>,
    "serious_count": <int>,
    "minor_count": <int>
  },

  "agent_metadata": {
    "agent_id": "<id>",
    "model": "claude-sonnet-4-6",
    "extended_thinking": true,
    "timestamp_iso": "<ts>"
  }
}
```

`findings` MAY be empty. Empty list means the reviewer found no defects worth surfacing; this is a meaningful signal, not a failure to evaluate.

---

## 5. Slice schema and classification rules

**Slice schema** (8 fields, inlined here for hook-implementer reference; full definitions preserved unchanged from `docs/plans/2026-05-09-architecture-pipeline-redesign.md` §6.3):

1. **Description** — what this card does, in architectural terms
2. **Allowed-touch list** — files this card may modify or create
3. **Forbidden-touch list** — files this card must not modify (may be "None")
4. **Produces** — contracts produced by this card with consumer cards named (may be "None")
5. **Consumes** — contracts consumed by this card with producer cards named (may be "None")
6. **Verification scope** — one of `local-only` / `contributes to <verification card>` / `owns end-to-end verification`
7. **Depends on** — other card titles this card depends on (may be "None")
8. **Source decisions** — D# references from Design decisions section (L2/L3) OR "Direct from spec — R# and/or Q# (no design decisions at this level)" (L1)

Every slice at every level has all 8 fields populated; fields with value "None" still appear with that value, not omitted.

**Classification rules v1.0**: preserved unchanged from `docs/plans/2026-05-09-architecture-pipeline-redesign.md` §7. The 9 rules (5 L3 triggers, 4 L2 triggers, L1 default) and their thresholds are not modified. `rules_version: "1.0"` carries through.

---

## 6. Per-agent profile specifications

Each agent profile is a markdown file with YAML frontmatter. The first numbered step is always the cross-cutting expert-standards activation. The plant-watering rule applies throughout.

### 6.1 `agents/architecture-research-agent.md`

**Frontmatter:**
```yaml
---
name: architecture-research-agent
description: Phase A of the architecture pipeline — mechanical fact-gathering against the spec and codebase. Fills ARCH_FACTS_BUNDLE_V2 with classification fields and design fields, applies v1.0 classification rules. Does not reason about architecture; produces facts that determine which compose agent runs in Phase B. Invoke from /architecture — the orchestrator passes spec_path, scaffold_card_id, and agent_id.
model: claude-haiku-4-5-20251001
tools: Read, Glob, Grep, Bash, Skill, mcp__agentboard__agentboard_get_card, mcp__agentboard__agentboard_update_workspace_card, mcp__agentboard__agentboard_add_log_entry, mcp__agentboard__agentboard_submit_workspace_artifact, mcp__agentboard__agentboard_list_workspace_artifacts, mcp__agentboard__agentboard_get_workspace_artifact, mcp__codegraph__codegraph_scan, mcp__codegraph__codegraph_get_stats, mcp__codegraph__codegraph_find_entry_points, mcp__codegraph__codegraph_list_files, mcp__codegraph__codegraph_get_dependencies, mcp__codegraph__codegraph_get_dependents, mcp__codegraph__codegraph_get_subgraph, mcp__codegraph__codegraph_get_change_impact, mcp__codebase-rag__rag_search, mcp__codebase-rag__rag_query_impact, mcp__claude_ai_Context7__resolve-library-id
---
```

**Body structure (in order):**

1. Subagent boundary contract (per §1.1).
2. Process steps:
   - **Step 1**: cross-cutting expert-standards activation (verbatim).
   - **Step 2**: Read spec at `spec_path` in full.
   - **Step 3**: Codebase semantic survey via `rag_search` — capabilities the spec introduces/modifies/replaces, design patterns (`source_type=docs`), constraints (`source_type=constraints`). Capture queries and results.
   - **Step 4**: Codebase structural survey via codegraph — `scan`, `get_stats`, `find_entry_points`, `list_files`; per-file `get_dependencies` / `get_dependents` / `get_subgraph` (depth 2) on the relevant set; `get_change_impact` on the candidate-modified set.
   - **Step 5**: Library identification — for every library the spec implies depending on, `resolve-library-id` to get Context7 ID; record name, ID (or null), why_needed.
   - **Step 6**: Classification measurement — measure each of the 8 classification fields with evidence; cite spec quotes, codegraph results, RAG hits.
   - **Step 7**: Open questions — log any ambiguity encountered (e.g., spec underspecifies a choice; codebase has multiple plausible interpretations).
   - **Step 8**: Apply v1.0 classification rules — evaluate L3 triggers first, then L2, default L1. Compute `rule_evaluation.computed_level` (numeric).
   - **Step 9**: Construct the V2 bundle per §2 schema. Validate structurally before submission (every required field present, all evidence cited, level numeric).
   - **Step 10**: Submit bundle as workspace artifact; add activity log entry; update scaffold card note with summary.
3. Anti-skip rebuttals (per the haiku research-agent pattern; specific to this agent's phases).
4. Failure modes — tool failures halt; never emit partial bundles.

### 6.2 `agents/architecture-classification-auditor.md`

**Frontmatter:**
```yaml
---
name: architecture-classification-auditor
description: Phase A audit of the architecture pipeline — independently re-derives every ARCH_FACTS_BUNDLE_V2 field from the spec and codebase, compares to the research agent's bundle, emits ARCH_BUNDLE_AUDIT_V2 with field-by-field PASS/DISCREPANCY verdicts. Anchoring-bias discipline — measures every field BEFORE looking at the research bundle. If discrepancies, emits a corrected bundle and recomputed level. Cannot promote/demote level except via correcting facts.
model: claude-sonnet-4-6
extended_thinking: true
tools: Read, Glob, Grep, Bash, Skill, mcp__agentboard__agentboard_get_card, mcp__agentboard__agentboard_update_workspace_card, mcp__agentboard__agentboard_add_log_entry, mcp__agentboard__agentboard_submit_workspace_artifact, mcp__agentboard__agentboard_list_workspace_artifacts, mcp__agentboard__agentboard_get_workspace_artifact, mcp__codegraph__codegraph_scan, mcp__codegraph__codegraph_get_stats, mcp__codegraph__codegraph_find_entry_points, mcp__codegraph__codegraph_list_files, mcp__codegraph__codegraph_get_dependencies, mcp__codegraph__codegraph_get_dependents, mcp__codegraph__codegraph_get_subgraph, mcp__codegraph__codegraph_get_change_impact, mcp__codebase-rag__rag_search, mcp__codebase-rag__rag_query_impact, mcp__claude_ai_Context7__resolve-library-id
---
```

**Body structure (in order):**

1. Subagent boundary contract (per §1.2).
2. Process steps:
   - **Step 1**: cross-cutting expert-standards activation (verbatim text per Preamble rule 2).
   - **Step 2**: Read spec at `spec_path` in full. **Do NOT fetch the research bundle yet.** Anchoring-bias discipline.
   - **Step 3**: Independent semantic survey via `rag_search` — same queries as research would run.
   - **Step 4**: Independent structural survey via codegraph — same operations as research.
   - **Step 5**: Independent library identification via `resolve-library-id`.
   - **Step 6**: Independent classification measurement of all 8 fields with evidence.
   - **Step 7**: Independent open-questions identification.
   - **Step 8**: Independent application of v1.0 classification rules → compute auditor's `computed_level`.
   - **Step 9**: **Now** fetch the research agent's bundle via `get_workspace_artifact`.
   - **Step 10**: Validate `schema_version` and `rules_version` match auditor's expected values; halt with structured error if mismatch.
   - **Step 11**: Field-by-field comparison using methods from contract:
     - Counts → numeric comparison
     - File lists → set comparison
     - Role classifications → label comparison per file
     - Dependency edges → graph comparison
     - RAG snippet existence → Read file at cited location, exact match
     - Library list → set comparison + Context7 ID re-resolution
     - Blast radius → recompute and compare
     - Open questions → flag any auditor-found question the research missed
   - **Step 12**: For any DISCREPANCY, construct `corrected_bundle` with auditor's values; recompute level from corrected bundle.
   - **Step 13**: Set `verified_level` = `recomputed_level` if any discrepancy, else research's `computed_level`.
   - **Step 14**: Construct the V2 audit per §3 schema. Submit; add log; update card note.
3. Anti-anchoring rebuttals — explicit reminders that the auditor's bundle is constructed independently; the research bundle is consulted only at Step 9.
4. Failure modes.

### 6.3 `agents/architecture-compose-l3.md`

**Frontmatter:**
```yaml
---
name: architecture-compose-l3
description: Phase B of the architecture pipeline at level L3. Produces a comprehensive architecture document and per-card slices for substantial work — anything triggering R-L3-EXT, R-L3-MIG, R-L3-SEC, R-L3-CONTRACTS, or R-L3-CARDS. Seventeen-step process reasoning from the verified bundle (no codebase discovery — codebase facts come from the bundle). Three delivery gates plus parallel trap audit. Clear Thought as framework throughout. Invoke from /architecture only when verified_level == 3.
model: claude-opus-4-7
tools: Read, Edit, Write, Glob, Grep, Skill, mcp__agentboard__agentboard_get_card, mcp__agentboard__agentboard_update_workspace_card, mcp__agentboard__agentboard_add_log_entry, mcp__agentboard__agentboard_submit_workspace_artifact, mcp__agentboard__agentboard_list_workspace_artifacts, mcp__agentboard__agentboard_get_workspace_artifact, mcp__claude_ai_Context7__resolve-library-id, mcp__claude_ai_Context7__query-docs, mcp__clear-thought__metacognitivemonitoring, mcp__clear-thought__mentalmodel, mcp__clear-thought__debuggingapproach, mcp__clear-thought__structuredargumentation, mcp__clear-thought__sequentialthinking, mcp__clear-thought__scientificmethod, mcp__clear-thought__decisionframework, mcp__clear-thought__collaborativereasoning
---
```

**Body structure (in order):**

1. Subagent boundary contract (per §1.3) — names the input bundle as authoritative ground truth for codebase facts.
2. Anti-skip discipline / reasoning patterns to foreclose.
3. Where architecture work goes wrong (the five-trap audit framing).
4. Workflow context — names the upstream pipeline stages whose output the agent consumes.
5. Reasoning support — the Clear Thought tool ↔ step mapping table.
6. Output contract — the two-axis evidence structure the document carries.
7. Halt condition — if `verified_level != 3` or `bundle.rule_evaluation.computed_level != 3` or they disagree, halt with structured error to scaffold card.
8. Process steps:
   - **Step 1**: cross-cutting expert-standards activation (verbatim text per Preamble rule 2).
   - **Step 2**: Ingest the verified `ARCH_FACTS_BUNDLE_V2` passed inline. Read it as authoritative. Specifically: `files_relevant` is the file set the architecture addresses; `dependency_edges` describe coupling; `blast_radius` informs scope decisions; `existing_patterns_hits` informs pattern adherence/divergence decisions; `constraint_hits` are constraints the architecture must respect; `external_libraries` lists library IDs available for Context7 query-docs; `open_questions` enumerates ambiguities to resolve in design. Snippet existence is authoritative (auditor verified); snippet relevance to a specific decision is the agent's judgment.
   - **Step 3**: Read spec at `spec_path` in full; read any documents the spec references locally.
   - **Step 4**: Understand the goal (one-paragraph internal articulation) + Clear Thought `metacognitivemonitoring` invocation for knowledge-state assessment.
   - **Step 5**: Identify governing standards inherited from spec + add architecture-phase standards (SOLID, ISO 25010, OWASP ASVS if security in scope, RFC suite if API design in scope). For decisions without a formal standard, `mentalmodel(first_principles)` per the 2026-05-09 plan's reasoning support.
   - **Step 6**: Spec problems — detect hard contradictions (use `structuredargumentation`), hard standard-vs-spec conflicts (same), soft ambiguities (resolved inline). Resolve open questions from bundle.
   - **Step 7**: Hard decisions — `sequentialthinking` invocations per the 2026-05-09 plan's Phase 8 criteria. Trace lands in document.
   - **Step 8**: Threat model when security in scope — `scientificmethod` structured threats. Skip when security not in scope.
   - **Step 9**: Design decisions in five-part format. For 3+ alternative decisions, `decisionframework` multi-criteria. Each decision cites spec R#/Q# addressed.
   - **Step 10**: Phase 10a quality characteristic mapping (ISO 25010) — gaps return to Step 9.
   - **Step 11**: Phase 10b ASVS mapping when security in scope — gaps return to Step 9.
   - **Step 12**: Phase 11 — Write the architecture document body to `docs/arch/<file>.md`. Template (preserved from 2026-05-09 plan's §8.3 + new Level marker):
     ```
     # Architecture — [Name]
     ## Goal — what this architecture serves
     ## Scope (in / deferred / out)
     ## Inheritance from existing precedents (if applicable)
     ## Components and structure
     ## Quality characteristics addressed (ISO/IEC 25010:2023)
     ## Design decisions
     ## Threat model (if security in scope)
     ## ASVS verification mapping (if security in scope)
     ## Card Slices (per §5 — placeholder, populated in Step 13)
     ## Traceability matrix
     ## Limitations and trade-offs
     ## Standards governing this architecture
     ## Status of this architecture
     **Level:** L3
     ```
     The `**Level:** L3` marker is the human-readable form of the numeric `verified_level: 3` per the level representation split.
   - **Step 13**: Phase 12 — Slice the architecture. Read the written document body; derive each card's 8-field slice per §6.3. Write slices into the Card Slices section, replacing the placeholder.
   - **Step 14**: Pre-delivery review via `collaborativereasoning` (planner, reviewer, stakeholder personas).
   - **Step 15**: Edit the architecture document at `docs/arch/<file>.md` to incorporate the Step 14 collaborativereasoning synthesis into the Design decisions section. If no perspective-specific gaps surfaced, write an explicit attestation in that section ("All three perspectives (planner, reviewer, stakeholder) were checked at Gate A; no perspective-specific gaps surfaced"). The document on disk must reflect the synthesis before gates run, because gates evaluate the document, not the agent's working memory.
   - **Step 16**: Gates A/B/C + trap audit per 2026-05-09 plan's "Before delivering" section. Run against the updated document on disk. Fail → fix the document and re-run gates; do not deliver with failing gates.
   - **Step 17**: Submit architecture document content as `architecture_document` workspace artifact. Card note + activity log.
9. Failure modes — Context7 unavailable for a library compose needs to verify → halt with structured error; tool unavailability or malformed bundle → halt; Step 13 placeholder unreplaced → halt before submit. The anti-skip rebuttals listed in item 2 carry the discipline previously held under a separate "anti-skip rebuttals" body-structure element in earlier drafts; they remain a required section (now folded into the Anti-skip discipline section).

### 6.4 `agents/architecture-compose-l2.md`

**Frontmatter:**
```yaml
---
name: architecture-compose-l2
description: Phase B of the architecture pipeline at level L2. Produces an architecture document and per-card slices for coupled work that introduces internal contracts or shared verification but no external systems, migrations, or substantial security surface. Eight-phase process reasoning from the verified bundle. Inline disciplines replace Clear Thought MCP invocations. Three delivery gates as inline checklists. Invoke from /architecture only when verified_level == 2.
model: claude-opus-4-7
tools: Read, Edit, Write, Glob, Grep, Skill, mcp__agentboard__agentboard_get_card, mcp__agentboard__agentboard_update_workspace_card, mcp__agentboard__agentboard_add_log_entry, mcp__agentboard__agentboard_submit_workspace_artifact, mcp__agentboard__agentboard_list_workspace_artifacts, mcp__agentboard__agentboard_get_workspace_artifact, mcp__claude_ai_Context7__resolve-library-id, mcp__claude_ai_Context7__query-docs
---
```

**Body structure (in order):**

1. Subagent boundary contract (per §1.4).
2. Halt condition — `verified_level != 2` → halt.
3. Process steps:
   - **Step 1**: cross-cutting expert-standards activation (verbatim text per Preamble rule 2).
   - **Step 2**: Bundle ingestion (same authority and field meanings as L3).
   - **Step 3**: Read spec + referenced docs.
   - **Step 4**: Understand goal (inline; no metacognitivemonitoring MCP).
   - **Step 5**: Identify governing standards. First-principles articulation inline when no standard applies (three-part: goal / local-optimum shortcut / why chosen path serves goal).
   - **Step 6**: Spec problems — inline thesis-antithesis-synthesis for hard contradictions; soft ambiguities resolved inline.
   - **Step 7**: Design decisions in five-part format. Multi-criteria comparison inline (table) for 3+ alternative decisions. **Each non-trivial decision names its verification approach inline** — replaces L3's Phase 10a (ISO 25010 mapping) per the 2026-05-09 plan's §8.4 Phase 7 update. Inline three-perspective Gate A checklist (planner/reviewer/stakeholder).
   - **Step 8**: Write architecture document body to `docs/arch/<file>.md` with `## Card Slices` placeholder. This is the first half of the two-pass write (corresponds to the 2026-05-09 plan's "Phase 7.5" label, renumbered here to integer-only step IDs for mechanical verifiability). Template:
     ```
     # Architecture — [Name]
     ## Goal — what this architecture serves
     ## Scope (in / deferred / out)
     ## Components and structure
     ## Design decisions
     ## Card Slices (placeholder)
     ## Traceability matrix
     ## Limitations and trade-offs
     ## Standards governing this architecture
     ## Status of this architecture
     **Level:** L2
     ```
   - **Step 9**: Slice — read the written body; derive each slice's 8 fields. Verification scope per slice derives from D# decisions' inline verification approach. Write the populated slices into the document's `## Card Slices` section, replacing the placeholder.
   - **Step 10**: Gates A/B/C inline checklist + trap audit. Gate C includes the discipline-coverage check (first-principles articulation appeared where Step 5 used it; thesis-antithesis-synthesis appeared where Step 6 used it; multi-criteria table appeared where Step 7 had 3+ alternatives; verification approach named in every non-trivial Step 7 decision; OR explicit attestation that trigger didn't fire).
   - **Step 11**: Submit + card note + log.
4. Failure modes.

### 6.5 `agents/architecture-compose-l1.md`

**Frontmatter:**
```yaml
---
name: architecture-compose-l1
description: Phase B of the architecture pipeline at level L1. Produces a slim architecture document focused on per-card slices for trivial work — 1–3 independent cards, no new contracts, no trust boundaries, no migrations, no external systems. The slicing IS the architecture at this level. Single-pass write. Invoke from /architecture only when verified_level == 1.
model: claude-opus-4-7
tools: Read, Edit, Write, Glob, Grep, Skill, mcp__agentboard__agentboard_get_card, mcp__agentboard__agentboard_update_workspace_card, mcp__agentboard__agentboard_add_log_entry, mcp__agentboard__agentboard_submit_workspace_artifact, mcp__agentboard__agentboard_list_workspace_artifacts, mcp__agentboard__agentboard_get_workspace_artifact, mcp__claude_ai_Context7__resolve-library-id, mcp__claude_ai_Context7__query-docs
---
```

**Body structure (in order):**

1. Subagent boundary contract (per §1.5).
2. Halt condition — `verified_level != 1` → halt.
3. Process steps:
   - **Step 1**: cross-cutting expert-standards activation (verbatim text per Preamble rule 2).
   - **Step 2**: Bundle ingestion. At L1, design fields are likely minimal but present (e.g., few `files_relevant`, no `dependency_edges` or sparse, no `open_questions` typical).
   - **Step 3**: Read spec.
   - **Step 4**: Understand goal (brief).
   - **Step 5**: Identify governing standards (inherited from spec; L1 rarely adds).
   - **Step 6**: Slice the cards — derive each slice's 8 fields per §6.3. Cards typically independent at L1; produces/consumes/depends_on often "None"; allowed-touch must still be precise. **Source decisions** uses L1 form `Direct from spec — R# and/or Q# (no design decisions at this level)` with at least one R# or Q# attribution.
   - **Step 7**: Write architecture document single-pass to `docs/arch/<file>.md`. Template:
     ```
     # Architecture — [Name]
     ## Goal — what this architecture serves
     ## Scope (in / out)

     _At L1, the slice Descriptions and Allowed-touch lists in the Card Slices section below carry the component-level content; no separate "Components and structure" or "Design decisions" section is produced. The slicing IS the architecture at this level._

     ## Card Slices (populated)
     ## Limitations
     ## Standards governing this architecture
     ## Status of this architecture
     **Level:** L1
     ```
   - **Step 8**: Single delivery gate — 5 mechanical checks from 2026-05-09 plan's §8.5 item 9 (R#/Q# coverage; Source decisions L1 form; eight §6.3 fields; precise allowed-touch; no overlap).
   - **Step 9**: Trap audit (5 traps).
   - **Step 10**: Submit + card note + log.
4. Failure modes.

### 6.6 `agents/architecture-design-reviewer.md`

**Frontmatter:**
```yaml
---
name: architecture-design-reviewer
description: Phase B review of the architecture pipeline. Reads the architecture document, spec, and verified bundle; surfaces defects in the design — missing decisions, unjustified slices, contract mismatches between produces/consumes pairs, standards-decoration, decision-hiding, deferred-decision — plus an `other` catch-all for defects that fit none of the six named categories. Emits one ARCH_DESIGN_REVIEW_V1 artifact with severity-tagged findings; the list may be empty. Advisory; user sees findings alongside document and decides. Invoke from /architecture after the validation hook passes compose's artifact and before user approval.
model: claude-sonnet-4-6
extended_thinking: true
tools: Read, Glob, Grep, Skill, mcp__agentboard__agentboard_get_card, mcp__agentboard__agentboard_list_workspace_artifacts, mcp__agentboard__agentboard_get_workspace_artifact, mcp__agentboard__agentboard_add_log_entry, mcp__agentboard__agentboard_submit_workspace_artifact
---
```

(Description text updated 2026-05-14: added `other` catch-all clause and ARCH_DESIGN_REVIEW_V1 emit note to match what Session 7's final committed profile actually does. The original spec described six categories; the implemented Step 8.5 adds the `other` catch-all, and the description must reflect this for orchestrator routing accuracy.)

**Body structure (in order):**

1. Subagent boundary contract (per §1.6).
2. Process steps:
   - **Step 1**: cross-cutting expert-standards activation (verbatim text per Preamble rule 2).
   - **Step 2**: Read inputs — spec at `spec_path`; architecture document via Read at `architecture_document_path` (or fall back to `get_workspace_artifact` on `architecture_document_artifact_id` if disk read fails); verified bundle via `get_workspace_artifact` on `verified_bundle_artifact_id` (the audit artifact, from which the bundle is derived per the `any_discrepancy` branch — see §3 audit schema). Apply BOM/CR normalization and sentinel-line verification to all fetched artifact content before JSON parse.
   - **Step 3**: Build a coverage matrix — every R# and Q# in the spec → which D# (or Source decision attribution at L1) addresses it. Missing entries are `missing-decision` findings.
   - **Step 4**: For each slice — check that its allowed-touch is justified by the decisions in its `source_decisions` (or by the R#/Q# at L1). Unjustified files → `unjustified-slice` finding.
   - **Step 5**: For each produces/consumes pair across slices — verify the consumer's consumed contract is produced by some other slice. Orphan produces (no consumer) is a finding; orphan consumes (no producer) is a finding.
   - **Step 6**: For each standard cited in the Standards table — verify at least one decision actually uses it. Unused standards are `standards-decoration` findings.
   - **Step 7**: For each non-trivial decision — verify the reasoning is in the document (not hidden as conclusion-only). Conclusion-without-reasoning → `decision-hiding` finding.
   - **Step 8**: For each deferred item — verify it's truly out-of-scope (e.g., legitimately implementer's call), not architecture-relevant-but-pushed-down. Deferred-architecture → `deferred-decision` finding.
   - **Step 8.5**: `other`-category catch-all sweep. Re-read the architecture document for design defects not surfaced in Steps 3 through 8 (cross-section consistency, cross-reference integrity, structural incoherence). Apply a priority-ordering rule for category selection: when a defect fits a named category under that Step's literal definition, classify under the named category, NOT under `other`. Use `other` only for defects fitting none of the six named categories.
   - **Step 9**: Construct `ARCH_DESIGN_REVIEW_V1` per §4 schema. Findings list with severity, category, document citation, suggested resolution. Submit artifact via `submit_workspace_artifact`. Add activity log entry via `add_log_entry`. (No card note update — `update_workspace_card` is intentionally NOT in this agent's tools list; the activity log is the reviewer's write surface.)
3. Failure modes — every halt path has a mirrored entry naming step (with sub-step suffix), failing condition, log content, and terminal "Stop." This includes: input retrieval failures (spec, architecture document, audit, bundle); wrong-sentinel halts; schema/version mismatch halts; structural conformance halts; level-disagreement halts; Step 9 pre-submission validation halts; MCP transport halts.

---

## 7. Validation hook specification

**Files:**
- `hooks/scripts/validate-architecture-artifact.sh` (or `.py` — plan picks one; sh recommended for parity with existing gate)
- `hooks/hooks.json` — register the new hook

**Hook registration shape (in `hooks/hooks.json`):**
```json
{
  "PreToolUse": [
    {
      "matcher": "mcp__agentboard__agentboard_submit_workspace_artifact",
      "hooks": [
        {
          "type": "command",
          "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/validate-architecture-artifact.sh"
        }
      ]
    }
  ]
}
```

**Script behavior (validate-architecture-artifact.sh):**

```
1. Read TOOL_INPUT from stdin (JSON).
2. Extract artifact_type and content fields via jq.
3. Detect artifact type (parentheses explicit to avoid AND/OR precedence bugs):
   - If (artifact_type == "architecture_document") OR (grep -q "^# Architecture —" on content AND grep -q "^## Card Slices" on content):
     → architecture_document rule set
   - Else if (artifact_type startswith "ARCH_FACTS_BUNDLE") OR (content contains literal "ARCH_FACTS_BUNDLE_V2" sentinel in first 200 chars):
     → ARCH_FACTS_BUNDLE_V2 rule set
   - Else if (artifact_type startswith "ARCH_BUNDLE_AUDIT") OR (content contains literal "ARCH_BUNDLE_AUDIT_V2" sentinel in first 200 chars):
     → ARCH_BUNDLE_AUDIT_V2 rule set
   - Else if (artifact_type startswith "ARCH_DESIGN_REVIEW") OR (content contains literal "ARCH_DESIGN_REVIEW_V1" sentinel in first 200 chars):
     → ARCH_DESIGN_REVIEW_V1 rule set
   - Otherwise:
     → exit 0 (no action; existing gate handles non-architecture)
4. Apply matched rule set (enumerated below).
5. On any rule failure:
   - Print JSON error to stderr: {"hook": "validate-architecture-artifact", "artifact_type": "<detected>", "failed_rules": [<list>], "details": "<>"}
   - Exit non-zero (blocks the tool call).
6. On all rules pass:
   - Exit 0 (allows tool call).
```

Detection note: `grep -q "^# Architecture —"` matches the heading anywhere it appears at start-of-line. This accommodates documents with YAML frontmatter, leading whitespace, or other preamble before the heading — the contract says "top-level heading," not "first character of file."

**Sentinel-bearing artifacts (BUNDLE, AUDIT, REVIEW):** all three sentinel-bearing artifact types have content in the form `<SENTINEL>\n<JSON>` where `<SENTINEL>` is the literal sentinel line (`ARCH_FACTS_BUNDLE_V2`, `ARCH_BUNDLE_AUDIT_V2`, or `ARCH_DESIGN_REVIEW_V1`). The hook MUST normalize and strip the sentinel before applying JSON validity checks — `jq .` on the full content fails because the sentinel line is not valid JSON. Normalization steps: (1) strip a leading UTF-8 BOM (`\xEF\xBB\xBF`) if present; (2) treat both `\n` and `\r\n` as line terminators; (3) strip the first line (and any trailing `\r` on that line); (4) verify the stripped first line equals the expected sentinel string exactly; (5) apply subsequent rules (`jq .` etc.) to the remainder. If the first line is not the expected sentinel after normalization, fail the rule set with a wrong-sentinel error (artifact_type and observed first-line text both reported).

**Cross-platform end-of-line discipline:** every rule whose pattern ends with `$` MUST be written as `<base>\r?$` rather than `<base>$` to handle CRLF-stored documents. Windows-hosted MCP servers and Git autocrlf are common sources of CRLF; the `\r?$` form accepts both LF and CRLF endings.

**Rule sets, enumerated:**

**`architecture_document` rule set (7 rules):**

```
R-DOC-1: grep -qE "^\\*\\*Level:\\*\\* L[123]\r?$" matches in the Status section.
         Parse level: L = the digit matched.
R-DOC-2: Required sections present per level L. The check is a subsequence check — the required section names must appear in the specified relative order, but optional sections (e.g., `## Inheritance from existing precedents` at any level, `## Threat model` / `## ASVS verification mapping` at L3) may appear between them without failing the rule.
         Heading strings (updated 2026-05-14 to match compose-l1/l2/l3 template output verbatim — earlier short forms `## Scope`, `## Limitations`, `## Standards`, `## Status`, `## Quality characteristics` did not match what compose actually produces and would have caused R-DOC-2 to false-fail on every valid document):
         L1 required sections (in order): # Architecture — , ## Goal, ## Scope (in / out), italic-attestation line, ## Card Slices, ## Limitations, ## Standards governing this architecture, ## Status of this architecture
         L2 required: # Architecture — , ## Goal, ## Scope (in / deferred / out), ## Components and structure, ## Design decisions, ## Card Slices, ## Traceability matrix, ## Limitations and trade-offs, ## Standards governing this architecture, ## Status of this architecture
         L3 required: # Architecture — , ## Goal, ## Scope, ## Components and structure, ## Quality characteristics addressed (ISO/IEC 25010:2023), ## Design decisions, ## Card Slices, ## Traceability matrix, ## Limitations and trade-offs, ## Standards governing this architecture, ## Status of this architecture
         (All three Goal headings are longer than `## Goal` in compose output — typically `## Goal — what this architecture serves`. Match by delimited-prefix where the required entry text is a prefix of the actual heading AND the character immediately after the entry text is one of: end-of-line, CR (for CRLF-stored files), single space, em-dash, colon, or space-hyphen-space. This admits `## Goal — ...` while rejecting `## Goalkeeper` and similar compound-word false positives.)
         Additionally for L3: if ## Threat model present, then ## ASVS verification mapping must also be present (both are optional but co-occur).
         Implementation: extract the heading sequence by grep -nE "^# Architecture — " for the document title (required), then grep -nE "^## " on content (both with `\r` stripped from line ends). Combine the title match with the `##` matches in document order to form the full required-section sequence. For each required heading in the per-level list, verify it appears in the sequence at a position later than the prior required heading via delimited-prefix matching. Headings not in the required list (optional sections) are ignored for the order check.
R-DOC-3: ## Card Slices section non-empty (contains at least one ### sub-heading representing a slice title).
R-DOC-4: Every slice (### sub-heading under ## Card Slices) contains all 8 §6.3 field labels as bullets (Description, Allowed-touch list, Forbidden-touch list, Produces, Consumes, Verification scope, Depends on, Source decisions). Implementation: parse slice section into bullets, check label presence against the 8-field list. (Updated 2026-05-14: short forms `Allowed-touch` and `Forbidden-touch` did not match the canonical §5 schema labels `Allowed-touch list` and `Forbidden-touch list` that compose-l2/l3 actually emit — compose-l2 lines 279-280, compose-l3 lines 354-355. A literal hook implementation of the prior short-form spec would have rejected compliant documents.)
R-DOC-5: For every R# and Q# appearing in the spec at spec_path, the architecture document references it either in the ## Traceability matrix section OR in at least one slice's Source decisions field. (Spec path passed as an env var or derived from the artifact's card_id.) If spec_path is not available to the hook, downgrade to: ## Traceability matrix section (where required) is non-empty.
R-DOC-6: Every D# string appearing in any slice's Source decisions field also appears as a decision heading in the ## Design decisions section. Implementation: extract D# references from slice content, extract D# definitions from design-decisions section, set comparison.
R-DOC-7: No two slices have allowed-touch lists with overlapping file paths unless the overlapping slice's Description contains a justification (the script can flag overlap; justification check is a substring presence test for "overlap justified" or similar — exact phrasing to be picked in Session 8 against the compose profile output).
```

**`ARCH_FACTS_BUNDLE_V2` rule set (5 rules):**

```
R-BUNDLE-1: After BOM/CR normalization, content's first line equals the literal sentinel `ARCH_FACTS_BUNDLE_V2`; the remainder after stripping the sentinel line is valid JSON (jq . > /dev/null on the stripped content).
R-BUNDLE-2: .schema_version == "2.0" AND .rules_version == "1.0".
R-BUNDLE-3: All required top-level fields present: classification_fields, design_fields, rule_evaluation, spec_path, spec_hash, agent_metadata.
            classification_fields contains all 8 sub-fields per §2 with .value and .evidence.
            design_fields contains all 7 sub-fields per §2: files_relevant, dependency_edges, blast_radius, existing_patterns_hits, constraint_hits, external_libraries, open_questions.
R-BUNDLE-4: .rule_evaluation.computed_level is numeric integer in {1, 2, 3}.
R-BUNDLE-5: .rule_evaluation.computed_level matches what v1.0 rules would derive from .classification_fields values (independent rule re-evaluation in script).
```

**`ARCH_BUNDLE_AUDIT_V2` rule set (4 rules):**

```
R-AUDIT-1: After BOM/CR normalization, content's first line equals the literal sentinel `ARCH_BUNDLE_AUDIT_V2`; the remainder is valid JSON.
R-AUDIT-2: .schema_version == "2.0" AND .rules_version == "1.0".
R-AUDIT-3: .field_verdicts contains an entry for every required bundle field (8 classification + 7 design = 15 entries minimum). Each entry has .verdict in {"PASS", "DISCREPANCY"} and .method.
R-AUDIT-4: .verified_level is numeric integer in {1, 2, 3}. .any_discrepancy is present and is a JSON boolean (true or false — not null, not a string). If .any_discrepancy == true, .corrected_bundle is a JSON object (not null, not a scalar) and .recomputed_level is a numeric integer in {1, 2, 3}.
```

**`ARCH_DESIGN_REVIEW_V1` rule set (3 rules):**

```
R-REVIEW-1: After BOM/CR normalization, content's first line equals the literal sentinel `ARCH_DESIGN_REVIEW_V1`; the remainder is valid JSON.
R-REVIEW-2: .findings is an array (may be empty). For every finding: .id matches `^F[1-9][0-9]*$` (1-indexed, no zero-padding) and is unique within .findings; .severity in {"blocker", "serious", "minor"}; .category in {"missing-decision", "unjustified-slice", "contract-mismatch", "standards-decoration", "decision-hiding", "deferred-decision", "other"}; .summary, .details, .document_citation.section, .document_citation.quoted_text, .suggested_resolution are each non-empty strings; .document_citation.decision_id_or_slice_name is a string or null.
R-REVIEW-3: .summary.{blocker_count, serious_count, minor_count} are non-negative integers, each equals the actual count of findings with that severity in .findings, and their sum equals len(findings). The findings IDs are contiguous and ascending: when .findings is non-empty, findings[i].id == "F" + str(i+1) for every index i.
```

**Synthetic test fixtures** for the rework's Session-N test step (per the plan author discipline acceptance criterion): one valid + one invalid synthetic for each of the four artifact types; valid architecture document tested at each level (L1, L2, L3).

---

## 8. Existing artifact-quality-gate revision

**Files:**
- `hooks/scripts/artifact-quality-gate.sh` — script half
- `hooks/hooks.json` — both the script registration AND the prompt instruction

**Script half changes (`hooks/scripts/artifact-quality-gate.sh`):**

Add at the top of the script, before the existing checks:
```bash
# Detect artifact type for type-aware dispatch
ARTIFACT_TYPE=$(echo "$TOOL_INPUT" | jq -r '.artifact_type // empty')
CONTENT=$(echo "$TOOL_INPUT" | jq -r '.content // empty')

# Architecture-pipeline artifacts are handled by the architecture validation hook.
# This script exits cleanly without action for them.
if [[ "$ARTIFACT_TYPE" == "architecture_document" ]] || \
   [[ "$ARTIFACT_TYPE" == ARCH_FACTS_BUNDLE_V2* ]] || \
   [[ "$ARTIFACT_TYPE" == ARCH_BUNDLE_AUDIT_V2* ]] || \
   [[ "$ARTIFACT_TYPE" == ARCH_DESIGN_REVIEW_V1* ]]; then
  exit 0
fi

# Fall back to content detection if artifact_type is empty.
if [[ -z "$ARTIFACT_TYPE" ]]; then
  if echo "$CONTENT" | head -c 200 | grep -qE "^# Architecture —|ARCH_FACTS_BUNDLE_V2|ARCH_BUNDLE_AUDIT_V2|ARCH_DESIGN_REVIEW_V1"; then
    exit 0
  fi
fi

# Existing rules below apply only to non-architecture artifacts.
# (original script body)
```

**Prompt half changes (`hooks/hooks.json`):**

The plan's chosen approach: split the existing hook registration into two registrations with different matchers and prompts.

Current shape (illustrative, exact JSON depends on the existing file):
```json
{
  "PreToolUse": [
    {
      "matcher": "mcp__agentboard__agentboard_submit_workspace_artifact",
      "hooks": [
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/artifact-quality-gate.sh"},
        {"type": "prompt", "prompt": "<existing prompt text>"}
      ]
    }
  ]
}
```

Revised shape:
```json
{
  "PreToolUse": [
    {
      "matcher": "mcp__agentboard__agentboard_submit_workspace_artifact",
      "hooks": [
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/artifact-quality-gate.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/validate-architecture-artifact.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/inject-quality-gate-prompt.sh"}
      ]
    }
  ]
}
```

Where `inject-quality-gate-prompt.sh` is a new script that:
1. Reads TOOL_INPUT.
2. Detects artifact type.
3. If non-architecture artifact, prints the existing prompt text to stdout (Claude Code's hook protocol treats stdout from a hook as prompt injection when configured as such — exact mechanism per plugin-dev:hook-development guidance to be confirmed in Session 8).
4. If architecture-pipeline artifact, prints nothing (exits 0 with empty output) — no prompt injected.

This pattern keeps the prompt injection configurable without modifying the underlying static prompt text destructively, and keeps the existing prompt's behavior unchanged for non-architecture submissions.

**Form factor pick: `inject-quality-gate-prompt.sh` command script.** This is the chosen approach. Reasons: (a) it stays in scope (no non-architecture profile edits); (b) it matches the existing repo pattern of script-based gate logic; (c) Claude Code's PreToolUse hook supports `type: command` registrations whose stdout is treated as instruction injection; (d) the dispatching logic is the same shape as the script-half gate, which makes it auditable.

**Implementation contract for `inject-quality-gate-prompt.sh`:**
- Reads TOOL_INPUT from stdin (JSON via `jq`).
- Extracts artifact_type and content fields.
- If artifact is an architecture-pipeline artifact type (one of the four), exits 0 with empty stdout (no prompt injected).
- Otherwise, prints the existing prompt text to stdout (the same text currently configured statically in `hooks.json`'s prompt field), exits 0.
- The prompt text gets copied from the existing static prompt verbatim — Session 8 reads the existing `hooks/hooks.json` to capture the prompt text and embeds it in the script as a heredoc.

**Session 8 verification step:** before declaring Session 8 complete, run synthetic submissions for each artifact-pipeline artifact type AND for at least one non-architecture artifact type. Verify the prompt-injection behavior: empty for architecture-pipeline, existing prompt for non-architecture. If Claude Code's hook implementation differs from the assumed stdout-as-prompt behavior, halt and surface to user — but `inject-quality-gate-prompt.sh` remains the committed form factor and the user decides how to adapt.

---

## 9. `/architecture` command rewrite

**File:** `commands/architecture.md`

**Required flow:**

```
1. Load required MCP tools and skills. Authenticate AgentBoard if needed.
2. Activate the agentboard:expert-standards skill (orchestrator-level activation; subagents activate independently).
3. Locate the approved spec from docs/specs/ (most recent or user-specified). Confirm path with user.
4. Select or create a workspace board via agentboard MCP. Read auto_transitions settings.
5. Create scaffold card:
   - Title: "Architecture: <spec topic>"
   - Description: "Architecture flow scaffold. Holds research bundle, audit, architecture document, and design review artifacts during the level-aware architecture pipeline. Will be moved to finished after cards are created from the architecture's slices."
   - Status: backlog
6. Spawn architecture-research-agent (background). Pass spec_path, scaffold_card_id, agent_id. Wait for completion.
7. Verify the agent submitted an ARCH_FACTS_BUNDLE_V2 artifact. If not, halt and report to scaffold card.
8. Spawn architecture-classification-auditor (background). Pass spec_path, audited_bundle_artifact_id, scaffold_card_id, agent_id. Wait for completion.
9. Verify the agent submitted an ARCH_BUNDLE_AUDIT_V2 artifact. Read verified_level (numeric) from it.
10. Display to user (transparency, not approval): bundle summary, audit findings, verified level (presented as "L1"/"L2"/"L3" in the chat for readability), rules that fired. Brief markdown summary.
11. Dispatch:
    - verified_level == 1 → spawn architecture-compose-l1
    - verified_level == 2 → spawn architecture-compose-l2
    - verified_level == 3 → spawn architecture-compose-l3
    - any other value → halt, report (rule evaluation produced invalid level)
    Pass to compose agent: spec_path, verified_level (numeric), scaffold_card_id, agent_id, the verified bundle inline. Wait for completion.
12. The validation hook fires automatically on compose's submit_workspace_artifact call. The hook either passes the artifact (orchestrator continues) or blocks (orchestrator sees the structured error; compose subagent must address and resubmit). Verify the architecture_document artifact landed.
13. Verify docs/arch/<file>.md exists on disk and matches the docs/arch/*.md path pattern. If not, halt and report (the disk-path check moved out of the hook).
14. Spawn architecture-design-reviewer (background). Pass spec_path, architecture_document_path, architecture_document_artifact_id, verified_bundle_artifact_id, scaffold_card_id, agent_id. Wait for completion.
15. Verify the reviewer submitted an ARCH_DESIGN_REVIEW_V1 artifact. Read findings.
16. Display to user: the architecture document path, the design review findings (rendered by severity), the verified level. Ask for approval, request-changes (with rewording), or rejection.
17. Apply corrections if user requests (re-spawn compose with corrections context if substantive; otherwise minor edits via Edit tool).
18. Commit docs/arch/<file>.md to git on the current branch.
19. Read the Card Slices section of the architecture document. For each slice:
    - agentboard_create_workspace_card with title = slice title, description = slice description + the 8 §6.3 fields, status = backlog.
20. Move scaffold card to finished status.
21. Summary to user: cards created, scaffold card finished, what to do next (run /orchestrate).
```

Each subagent invocation passes only the inputs that subagent's profile declares it consumes. The command itself is written for the orchestrator to follow; no instructions in subagent profiles are duplicated here, and no instructions here bleed into subagent profile text.

---

## 10. Plugin version bump and codex sync

**Plugin version:**
- `claude-plugins/agentboard/.claude-plugin/plugin.json`: bump `version` from `0.2.1` (or whatever is current) to `0.3.0`.
- `codex-plugins/agentboard/.codex-plugin/plugin.json`: bump to `0.3.0` in lockstep.
- `/.claude-plugin/marketplace.json`: agentboard entry version → `0.3.0`.

**Codex sync requirements:**
- Every file changed in `claude-plugins/agentboard/` has an equivalent file in `codex-plugins/agentboard/`. Specifically:
  - `agents/architecture-research-agent.md` → both trees
  - `agents/architecture-classification-auditor.md` → both
  - `agents/architecture-compose-l1.md` → both
  - `agents/architecture-compose-l2.md` → both
  - `agents/architecture-compose-l3.md` → both
  - `agents/architecture-design-reviewer.md` → both
  - `commands/architecture.md` → both
  - `hooks/scripts/validate-architecture-artifact.sh` → both
  - `hooks/scripts/artifact-quality-gate.sh` → both (revised)
  - `hooks/scripts/inject-quality-gate-prompt.sh` (if used) → both
  - `hooks/hooks.json` → both
  - `.claude-plugin/plugin.json` / `.codex-plugin/plugin.json` → both (versions in sync)
  - Plan, contract, issues, codex sync report documents → both trees
- Runtime-specific differences (e.g., codex plugin uses `.codex-plugin/` instead of `.claude-plugin/`; tool naming if it differs) are noted in the codex sync report.

**Codex sync report (`docs/plans/2026-05-12-codex-sync-report.md`):**
- Section per file group with side-by-side diff summary.
- Confirms version match across both trees and marketplace.
- Notes any intentional divergence (e.g., a tool name that's different in the codex runtime).

---

## 11. Acceptance criteria

The contract's 19 acceptance criteria plus one plan-author-discipline criterion (the plant-watering test, elevated here for mechanical verifiability) — 20 total. Behavioral and structural; each one is directly checkable against repo state or synthetic test output. The rework is complete when ALL of the following hold:

1. **Cross-cutting activation present.** Every subagent profile (research, auditor, compose-l1, compose-l2, compose-l3, design reviewer) has `Skill` in its frontmatter tools list AND its first numbered process step activates `agentboard:expert-standards` via the Skill tool. Verified by grep against each profile file.

2. **V2 schemas defined and emitted.** `ARCH_FACTS_BUNDLE_V2` and `ARCH_BUNDLE_AUDIT_V2` are emitted by the research and audit agents per §2 and §3 schemas. Validated by a synthetic-spec test: run `/architecture` on a synthetic spec; inspect submitted artifacts for required fields.

3. **Research agent emits full V2 bundle.** Every classification and design field is present with evidence; `computed_level` is numeric in `{1,2,3}`. Verified per criterion 2's test.

4. **Auditor model and methods.** Auditor profile's frontmatter is `model: claude-sonnet-4-6` and `extended_thinking: true`. Auditor process performs independent re-derivation BEFORE consulting the research bundle (Steps 2–8 independent, Step 9 fetches research bundle). Auditor applies the per-field methods from §3: numeric comparison for counts, set comparison for file lists, exact-match snippet existence for RAG hits, etc.

5. **No codebase discovery anywhere in compose profiles.** L1, L2, L3 compose profiles contain zero references to `rag_search`, `codegraph_scan`, `codegraph_get_stats`, `codegraph_find_entry_points`, `codegraph_list_files`, `codegraph_get_dependencies`, `codegraph_get_dependents`, `codegraph_get_subgraph`, `codegraph_get_change_impact`, or `rag_query_impact` ANYWHERE in the profile file (frontmatter, workflow context, process text, output template, examples, all sections). Verified by grep across the whole file.

6. **Compose frontmatter excludes forbidden tools.** Compose profile frontmatter `tools` field excludes every codebase-discovery tool listed in criterion 5. The subagent literally cannot call them at runtime because they aren't declared.

7. **Compose Step 2 reads from bundle.** Compose profile Step 2 (the first post-activation step; Step 1 is the cross-cutting expert-standards activation) reads from `bundle.files_relevant` and the other design fields by name. Verified by grep for bundle-field names in compose profile Step 2 prose.

8. **Compose has Context7.** Compose profile frontmatter `tools` field includes `mcp__claude_ai_Context7__resolve-library-id` AND `mcp__claude_ai_Context7__query-docs`. The "no discovery" rule is scoped to codebase discovery, not external doc lookup.

9. **Validation hook exists and behaves.** Hook script exists at `hooks/scripts/validate-architecture-artifact.sh`, registered in `hooks/hooks.json` as a PreToolUse hook on `mcp__agentboard__agentboard_submit_workspace_artifact`. Fires for all four architecture-pipeline artifact types via content-type dispatch. Performs structural-only checks per type-specific rule sets per §7. Blocks invalid submissions with structured error to stderr + non-zero exit; passes valid submissions with exit 0.

10. **Hook synthetic-artifact tests pass.** Test suite contains invalid + valid synthetic for each of the four artifact types; valid architecture document at each level (L1, L2, L3). All tests pass — invalid blocked with structured error, valid passed.

11. **Existing gate revision covers both halves.**
    - Script half: `hooks/scripts/artifact-quality-gate.sh` exits cleanly (exit 0, no action) for architecture-pipeline artifact types. Verified by synthetic submission of each architecture artifact type.
    - Prompt half: prompt-injection mechanism in `hooks/hooks.json` produces no prompt text for architecture-pipeline submissions. Verified by inspecting hook output for synthetic architecture submissions.
    - Non-architecture submissions retain both halves of existing behavior unchanged. Verified by synthetic non-architecture submissions.
    - No architecture-pipeline subagent profile from the workspace pipeline (`planning-research-agent`, `plan-compose-agent`, `review-agent`, `implementation-agent`, `audit-research-agent`, `audit-compose-agent`) is modified.

12. **Level marker in all document templates.** L1, L2, L3 compose profile output templates each include `**Level:** L1` / `L2` / `L3` exactly in the Status section. Verified by grep against each compose profile.

13. **§8.7 supersession recorded.** This plan's Preamble explicitly names the supersession; the contract section "Supersession of §8.7" appears in the contract document.

14. **Design reviewer exists and runs in correct position.** `architecture-design-reviewer.md` exists with frontmatter `model: claude-sonnet-4-6`, `extended_thinking: true`, runs after compose's artifact passes the validation hook and before user approval (per `commands/architecture.md` step 14), emits `ARCH_DESIGN_REVIEW_V1` per §4 schema. Verified by running `/architecture` on a synthetic spec and checking the order of submitted artifacts.

15. **/architecture orchestrates full flow.** `commands/architecture.md` includes all 21 steps per §9 in order, including the design review wave and the disk-path verification at step 13 (moved out of the hook). Verified by reading the command and tracing it against §9.

16. **Plugin versions bumped.** `claude-plugins/agentboard/.claude-plugin/plugin.json` version is `0.3.0`. `codex-plugins/agentboard/.codex-plugin/plugin.json` version is `0.3.0`. `/.claude-plugin/marketplace.json` agentboard entry version is `0.3.0`.

17. **Codex sync report exists.** `docs/plans/2026-05-12-codex-sync-report.md` exists in both plugin trees, listing every changed file in both with side-by-side diff summaries.

18. **Agentboard app spec exists.** `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md` exists in `claude-plugins/agentboard/` with the scope listed in the contract.

19. **Plant-watering test passes.** A mechanical pass over each rewritten profile classifies every sentence in the profile as either "instruction-to-subagent" or "other." The count of "other" sentences is zero for all six profiles (research, auditor, compose-l1, compose-l2, compose-l3, design reviewer). The classification can be done by reviewer-subagent inspection per profile.

20. **2026-05-09 plan preserved.** The original plan at `docs/plans/2026-05-09-architecture-pipeline-redesign.md` is unchanged in git history (committed at its time of writing) and remains as historical record.

---

## 12. Session sequencing

The rework is structured into 10 sessions. Each session has a clear scope, an output, and a checkpoint. The plan author runs an independent code-reviewer subagent pass at the end of each session before declaring it complete.

**Session 1 (THIS session): Plan + reviewer pass + apply findings.**
- Output: this plan document at `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md`.
- Independent reviewer pass against the contract.
- Findings applied in full.
- No agent files written. No git commit unless user explicitly requests.

**Session 2: V2 schemas + research agent rewrite.**
- Schema JSON files (if separate from profile): `docs/schemas/arch-facts-bundle-v2.json`, `docs/schemas/arch-bundle-audit-v2.json`, `docs/schemas/arch-design-review-v1.json` (form factor TBD — could be inline in profiles instead).
- Rewrite `agents/architecture-research-agent.md` per §6.1. Schema baked into profile.
- Reviewer pass on the rewritten profile (plant-watering test, contract compliance).

**Session 3: Auditor rewrite.**
- Rewrite `agents/architecture-classification-auditor.md` per §6.2. Sonnet 4.6 + extended thinking. Anchoring-bias discipline.
- Reviewer pass.

**Session 4: Compose-L3 rewrite.**
- Rewrite `agents/architecture-compose-l3.md` per §6.3. No codebase discovery; Clear Thought retained.
- Reviewer pass (plant-watering + tool exclusion verification).

**Session 5: Compose-L2 rewrite.**
- Rewrite `agents/architecture-compose-l2.md` per §6.4. Inline disciplines replace Clear Thought MCP.
- Reviewer pass.

**Session 6: Compose-L1 rewrite.**
- Rewrite `agents/architecture-compose-l1.md` per §6.5. Single-pass write; slicing IS the architecture.
- Reviewer pass.

**Session 7: Design reviewer.**
- New `agents/architecture-design-reviewer.md` per §6.6.
- Reviewer pass.

**Session 8: Hooks.**
- Write `hooks/scripts/validate-architecture-artifact.sh` per §7.
- Revise `hooks/scripts/artifact-quality-gate.sh` per §8 (script half).
- Update `hooks/hooks.json` per §8 (both halves).
- If prompt-half mechanism requires touching non-architecture profiles, halt and surface to user before proceeding.
- Write synthetic-artifact test fixtures.
- Run all synthetic tests; verify pass.

**Session 9: /architecture command rewrite + agentboard app spec.**
- Rewrite `commands/architecture.md` per §9.
- Write `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md` per the contract.
- Reviewer pass on both.

**Session 10: Plugin version + codex sync + final verification.**
- Bump plugin versions in both trees + marketplace.
- Sync every changed file to `codex-plugins/agentboard/`.
- Write `docs/plans/2026-05-12-codex-sync-report.md`.
- Run the full acceptance criteria checklist (all 20 items from §11) and produce a verification report.
- Final reviewer pass.
- Commit + PR.

Dependencies:
- Sessions 2–7 (agent files) can in principle proceed in any order, but Session 2's schema definitions feed Sessions 3–7.
- Session 8 (hooks) requires Sessions 2–6 complete so all artifact types are known.
- Session 9 (orchestrator command) requires all subagents to exist.
- Session 10 requires everything else.

The sequence above respects all dependencies linearly. Parallelism is possible (e.g., Sessions 4–6 are independent rewrites) but not assumed.

---

## 13. Open items / deferred

Items deferred from this rework with documented reasons:

1. **v1.0 classification rule threshold tuning.** The rules and thresholds carried over from the 2026-05-09 plan's §7. Threshold calibration against real specs is open. Reason for deferral: needs observed misclassifications across multiple specs; not blocking the rework. Future session bumps `rules_version` to `1.1` or `2.0` after tuning.

2. **Agentboard app implementation.** The app spec at `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md` identifies considerations; implementing them is a separate cycle.

3. **Plant-watering test automation.** The contract requires plant-watering compliance verified by reviewer-subagent inspection. A future session could codify the test as a script (parse profile, classify each sentence). Out of scope for this rework.

4. **Cross-profile consistency check automation.** Manually verified in this rework (e.g., "all three compose profiles use the same expert-standards activation phrasing"). Future session could codify.

5. **Bundle/audit serialization format finalization.** Plan specifies JSON; if the artifact store needs a different format (YAML, structured Markdown), Session 2 picks and documents.

---

## 14. Out of scope

Per the contract:
- Changes to `/foundation`, `/orchestrate`, or any workspace-pipeline agents.
- Changes to `skills/spec-writing/SKILL.md` or spec-related discipline.
- Threshold tuning of v1.0 classification rules.
- Implementation of any agentboard app changes the app spec identifies.
- Changes to `mcp-servers/`, `skills/codebase-rag-enforcer/`, or other plugins.
- Test infrastructure changes beyond the synthetic-artifact tests for the validation hook.

If any session uncovers a need for changes outside this scope, halt and surface to user.

---

## Sign-off

User sign-off on this plan pending. Approval moves the rework to Session 2.
