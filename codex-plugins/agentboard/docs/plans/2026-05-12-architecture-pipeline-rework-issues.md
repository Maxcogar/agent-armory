# Architecture Pipeline Rework — Issues Document

**Date:** 2026-05-12
**Status:** Problem statement, not a plan. Records what was identified after Sessions 1–6 of the original redesign shipped (commits `f29835c` through `281a9fe`) and the plugin was inspected end-to-end. Starting point for whatever rework comes next.
**Author note:** This document is honest about defects in work I produced. It is not a critique of the user's direction — it is a record of what shipped vs. what should have shipped, so the rework has a starting point.

---

## What this doc is

A description of design defects in the level-aware architecture pipeline as it currently sits on `main` (version `0.2.1`). The defects are real and substantive — not style preferences. The rework that addresses them will be the same shape of work as Sessions 1–6: planning, multiple authoring sessions, reviewer passes, a sync report.

This doc is **not** a plan. A plan answers "what's the sequence of changes?" — that comes later. This doc answers "what's actually wrong, why, and what does fixing it touch?"

---

## What's actually working — preserve in any rework

Before the defects, the things that are correct and should not be re-litigated:

1. **Deterministic classification.** The `rules_version: "1.0"` baked into `architecture-research-agent.md` and validated by `architecture-classification-auditor.md` with hard-fail on mismatch — this is a correct design. The user does not pick the level at runtime; misclassification is corrected by tuning thresholds in a `rules_version` bump.

2. **Three independently authored L1/L2/L3 compose profiles.** Each at its own rigor level, no skip language inside any of them. Conditionality lives in `commands/architecture.md`'s dispatch logic.

3. **The eight-field §6.3 slice schema.** Description, Allowed-touch, Forbidden-touch, Produces, Consumes, Verification scope, Depends on, Source decisions — consistent across L1/L2/L3. Downstream agents consume slices identically regardless of level.

4. **The `/architecture` orchestration shape.** 17 steps: load tools → spec location → board selection → scaffold card → research → audit → transparency display → dispatch by `verified_level` → compose → document approval → git commit → card creation → scaffold-to-finished → summary. That shape is right.

5. **Two-pass write at L2/L3, single-pass at L1.** Phase 7.5 (L2) / Phase 11→12 (L3) write the document body, then the slicing phase reads from the committed document. L1 has no intermediate design layer so single-pass is honest. The asymmetry is structural.

6. **The classification auditor's anchoring-bias discipline.** Re-measure every field BEFORE looking at the research bundle. This is load-bearing and should not change.

Anything not listed above is in scope for re-examination.

---

## The core problem

**The architecture pipeline does not actually split work between haiku and opus the way the planning pipeline does.**

The planning pipeline's research/compose split is what makes it cost-effective: cheap haiku tokens do the mechanical discovery; expensive opus tokens do the reasoning. The architecture pipeline copies the *shape* (a research agent and a compose agent) but does not copy the *substance* (the research agent pre-gathers everything the compose needs; the compose explicitly skips discovery).

### Comparison

**Planning pipeline (works correctly):**

| Agent | Model | What it actually does |
|---|---|---|
| `planning-research-agent` | haiku | Runs RAG (all source_types), runs codegraph (scan, stats, entry points, dependencies, dependents, change impact), runs `rag_query_impact`. Emits `FACTS_BUNDLE_V1` with: `files_identified` (each with role: primary/secondary/test/config and `exists: true`), `dependency_edges` (file → file imports), `blast_radius` (direct_dependents, transitive_count, risk_level, top_affected), `rag_hits` (file, line, snippet, relevance — top 10), `constraints` (project-specific rules surfaced from RAG), `open_questions`. |
| `plan-compose-agent` | opus | Profile says verbatim: *"The research phase (planning-research-agent) has already run all codebase discovery. Load the pre-gathered facts bundle instead of running discovery tools yourself."* Opus tokens go to: standards identification, Context7 verification, foundation assessment, Clear Thought reasoning, plan authoring, gate compliance. **No re-running of RAG or codegraph.** |

**Result:** opus is reasoning, haiku is discovering. The split is honored.

**Architecture pipeline (broken):**

| Agent | Model | What it actually does |
|---|---|---|
| `architecture-research-agent` | haiku | Measures 8 classification fields. Each field exists to fire a specific rule (R-L3-EXT, R-L3-MIG, R-L3-SEC, R-L3-CONTRACTS, R-L3-CARDS, L2 triggers, L1 default). The bundle's purpose is to make the rules' verdict reproducible by the auditor. |
| `architecture-compose-l3` | opus | Profile has a 12-phase process. Phase 3 runs `rag_search` itself across multiple capabilities. Phase 4 runs `codegraph_scan`, `get_stats`, `find_entry_points`, `list_files`, plus per-file `get_dependencies` / `get_dependents` / `get_subgraph` / `get_change_impact`. Phase 6 runs Context7 for every external library the architecture commits to. **All of this runs on opus tokens, from scratch, against the same codebase the haiku already touched.** |

**Result:** the haiku measured 8 abstract counts. The opus then re-walks the codebase from scratch to actually understand it. The bundle saves opus from re-deriving the *level*, not from re-doing the *survey*.

---

## Specific issues

### Issue 1: Bundle schema is sized for classification, not for design

`ARCH_FACTS_BUNDLE_V1` (plan §6.1, baked into the research agent) has eight fields:

1. `new_contracts_count`
2. `existing_contracts_modified_count`
3. `trust_boundaries_introduced`
4. `migration_signals_present`
5. `external_system_count`
6. `expected_card_count_band`
7. `coupling_hotspot_overlap`
8. `security_relevant_keyword_hits`

Each field exists to drive a rule. Together they tell the rules engine "this is L3 because of R-L3-EXT and R-L3-SEC."

They don't carry the design-fact data the compose agent's Phase 3–4 actually needs:

- The set of files in the codebase that are relevant to the spec (with role classifications — likely-new, likely-modified, dependency, entry point, hotspot)
- The dependency edges between those files
- Blast radius for the likely-modified set
- Existing patterns and conventions surfaced by RAG against `source_type=docs`
- Constraints surfaced by RAG against `source_type=constraints`
- Library names (and ideally Context7 IDs) for everything the spec implies depending on
- Open questions the haiku encountered that opus needs to be aware of

The current bundle has *evidence* for the 8 classification fields (e.g., `new_contracts_count.evidence[]` contains contract names and spec quotes), but that evidence is shaped to justify the counts, not to drive design reasoning.

### Issue 2: Compose profile is structured as if it were the whole orchestration

`architecture-compose-l3.md` is 500 lines. It contains:

- A 12-phase process (Read inputs, Goal, Semantic survey, Structural survey, Standards, Context7, Spec problems, Hard decisions, Threat model, Design decisions with 10a/10b sub-phases, Write document, Slice)
- Three delivery gates (A/B/C) plus a parallel trap audit
- A mandatory Clear Thought MCP invocation for every reasoning kind (metacognitivemonitoring, mentalmodel, debuggingapproach, structuredargumentation, sequentialthinking, scientificmethod, decisionframework, collaborativereasoning)
- Its own tool calls for codebase survey, Context7, and discovery

This is the whole `/architecture` process baked into a single subagent profile. The subagent boundary isn't being honored. A subagent profile should be "given input X, produce output Y" — not "run the entire architecture pipeline from scratch."

Compare to `plan-compose-agent.md`: 393 lines, but its Step 2 explicitly says discovery has already happened. The profile is sized for the reasoning work, not for the whole pipeline.

L2 and L1 compose profiles inherit the same structural problem from L3, just with fewer phases.

### Issue 3: Context7 verification runs in the wrong place

The compose agent's Phase 6 is Context7 verification of external libraries. The flow:

1. `resolve-library-id` — pass the library name, get a Context7 library ID
2. `query-docs` — pass the library ID and a specific question

Both are mechanical lookups. The haiku research agent could resolve every library named in the spec to its Context7 ID and emit those IDs in the bundle. Whether `query-docs` belongs in haiku or opus is a judgment call (the question to ask the docs is reasoning-shaped), but at minimum the `resolve-library-id` step is pure mechanical work that doesn't need opus tokens.

Currently neither happens in the haiku agent. All Context7 work is opus.

### Issue 4: Plan §8.3 adaptation table didn't catch this

The plan's adaptation table for the L3 compose agent contained 8 specific changes to `expert-architecture.md`:

1. Frontmatter added
2. `$ARGUMENTS` removed, orchestrator inputs declared
3. `/expert-spec` → `/foundation`, `/expert-plan` → `/orchestrate`
4. Workflow context section replaced
5. "Handling user requests to skip rigor" subsection deleted
6. Phase 1 input source adjusted to `spec_path`
7. Output path `docs/architectures/` → `docs/arch/`
8. Submission instructions replaced with workspace-artifact pattern

For Phases 3 and 4 (the codebase surveys) and Phase 6 (Context7), the table said "Keep substantively" or "Keep verbatim." None of the adaptations were "delete these phases because they're now pre-done upstream."

The plan absorbed `expert-architecture.md` — which was a single-flow document for a single-agent process — into a subagent profile, without rethinking what the subagent's actual boundary should be. The implementation faithfully followed the plan's instructions. This was a planning defect, not an implementation defect.

The planning pipeline's split (planning-research-agent / plan-compose-agent) was visible during the architecture redesign but wasn't applied as the pattern to copy.

### Issue 5: Documentation drift was a symptom of the same root pattern

The doc-audit pass (commit `281a9fe`) caught stale `## 4. Card Slices` references and `expert-standard` skill-name usage across 9 files. The root cause: the redesign focused on the new classification mechanism and didn't audit how the rest of the plugin's documentation described the workflow.

Same pattern as Issue 4: redesign optimizes for the new mechanism, doesn't audit ripple effects on the rest of the system. The architecture issue and the documentation drift are two manifestations of the same gap in the redesign discipline.

### Issue 6: The plan's acceptance criteria measured structure, not behavior

Plan §11's 11 acceptance criteria are all structural:
- "expert-architecture.md no longer exists"
- "architecture-research-agent.md exists, is haiku-modeled, contains v1.0 rules"
- "L1/L2/L3 compose agents all exist, opus-modeled, no skip language"
- etc.

None of them tested behavior:
- "Opus tokens for compose are not spent on discovery work haiku already did"
- "The compose agent's Phase 3 reads from the bundle, not from scratch"
- "Context7 lookups happen at the cheapest layer that can do them"

Acceptance criteria sized for "everything is in place" rather than "the system actually works as designed." Both passed; the second was never tested.

---

## What a real fix touches

Three rough shapes the rework could take. Each has different cost and different trade-offs. None of these is a recommendation yet — they're the rough options to think through.

### Shape A — Honor the research/compose split

Make the architecture pipeline match the planning pipeline's design:

- Bump the bundle schema to `ARCH_FACTS_BUNDLE_V2`. Add design-fact fields alongside the classification fields:
  - `files_relevant` (with role: candidate-new / candidate-modified / dependency / entry-point / hotspot)
  - `dependency_edges`
  - `blast_radius` (for likely-modified set)
  - `existing_patterns_hits` (RAG with `source_type=docs`)
  - `constraint_hits` (RAG with `source_type=constraints`)
  - `external_libraries` (each with `name`, optional `context7_id` if resolvable from haiku)
  - `open_questions` (things haiku couldn't resolve)
- Bump `rules_version` to `2.0` in lockstep across research agent and auditor.
- Update the auditor to validate the new fields with the same anchoring-bias discipline (re-measure independently, compare, emit corrections).
- Rewrite the three compose profiles. Delete Phases 3, 4, and 6. Replace with a step that reads from the pre-gathered bundle. Keep the reasoning phases: Goal, Standards, Spec problems, Hard decisions, Threat model (when triggered), Design decisions, Write document, Slice. Clear Thought stays.
- Update `commands/architecture.md` to pass the richer bundle through to compose.
- New Codex sync report describing the schema bump.
- Plugin version bump to `0.3.0` (schema-changing minor version).

**Scope:** substantive rework. Comparable to Sessions 1–6 of the original redesign — multiple sessions of planning + authoring + reviewer passes + sync. Probably 5–10 sessions depending on how the bundle design is settled.

**Trade-off:** highest cost, highest payoff. Architecture pipeline behaves like the planning pipeline (which works), opus tokens go to reasoning, the design is internally coherent.

### Shape B — Roll back the haiku/opus split for architecture

Accept that `/architecture` is one big reasoning process. Collapse research + auditor into the compose profile. Have a single architecture-compose agent that does classification, design, and slicing in one flow. Eliminates the duplication problem because there's no duplication — there's just one agent doing one thing.

**Scope:** smaller. Merge two haiku profiles into the compose profile. Remove the orchestrator's transparency display step (since the compose agent owns classification now). Update the plan and Codex sync report. Probably 2–3 sessions.

**Trade-off:** loses the deterministic-classification benefit (the auditor's anchoring-bias check is the audit-trail value the user explicitly wanted). Loses cost savings. Simpler but weaker.

### Shape C — Document the trade-off and live with it

Frame the haiku/opus split as "haiku does classification only, opus does the architecture work" — an honest split-by-rigor-envelope rather than split-by-work-type. The duplication is real but bounded (the haiku's RAG/codegraph work is narrow; the opus's is broad).

Add an explicit caveat in the plan and Codex sync report: "This pipeline does not split discovery work between haiku and opus. The compose agent runs its own codebase survey. The haiku agent's job is classification, not pre-gathering."

**Scope:** documentation only. ~1 session.

**Trade-off:** preserves the structure as-is. Accepts the opus token cost. Future readers of the plan won't confuse it with the planning pipeline's pattern. But the underlying design defect is still there — the architecture pipeline isn't getting the cost savings two-agent pipelines are supposed to provide.

---

## Things to think about before starting

These aren't forced choices — they're the questions any rework will need answers to:

1. **Is the haiku/opus split worth preserving for architecture?** If the planning pipeline's split is the right pattern, Shape A. If the split is more theatre than substance for architecture work (because the design reasoning needs the same view of the codebase the haiku has), Shape B might be more honest. If the structure is fine as long as the trade-off is named, Shape C.

2. **What's the minimum useful design-facts surface in the bundle?** If Shape A: probably file list with roles, dependency edges, blast radius, constraint hits, pattern hits, library names. What else does the compose agent need that it currently re-derives?

3. **Does Context7 belong in haiku or opus?** `resolve-library-id` is mechanical. `query-docs` is reasoning-shaped (the question matters). One natural split: haiku resolves library IDs; opus does query-docs against the IDs the haiku surfaced. Alternative: haiku does both and emits doc excerpts.

4. **Does the bundle's design-facts surface change by level?** L1 architecture is slim (~50–150 lines typical). The design-facts fields might be mostly empty at L1. Is that fine, or does L1 need a different bundle shape entirely? (Argument for keeping one shape: downstream tools shouldn't branch on level. Argument against: L1 doesn't have the same design layer L2/L3 have.)

5. **`rules_version` vs `schema_version`.** Currently both are at `1.0`. If the rules don't change but the schema does (Shape A), they should diverge. If both change in lockstep, the version-bump semantics are simpler but less precise.

6. **What does the auditor look like in Shape A?** The classification auditor re-measures the 8 classification fields with anchoring-bias discipline. If the bundle grows to include design facts, does the auditor re-measure those too? If yes, the auditor's scope grows substantially. If no, the design facts are unverified evidence — which contradicts the auditor's purpose.

7. **Migration of in-flight work.** If you've started running `/architecture` on real specs against the current `0.2.1` version, those runs are at `rules_version: "1.0"`. A schema bump invalidates them. Is there a state of in-flight work that needs grandfathering, or is it fine to require all runs to be re-done after the rework lands?

---

## Files to read before starting any rework

The fastest orientation path:

1. **`claude-plugins/agentboard/agents/planning-research-agent.md`** — the pattern to copy. This is what a research agent looks like when the split is honored. Note especially Step 3 (RAG discovery — ground the file set) through Step 8 (validate and emit), and the `FACTS_BUNDLE_V1` schema at the bottom.

2. **`claude-plugins/agentboard/agents/plan-compose-agent.md`** — the compose pattern that explicitly skips discovery. Note especially Step 2 ("Ingest the facts bundle") which is the model for what the architecture compose profiles should look like.

3. **`claude-plugins/agentboard/agents/architecture-research-agent.md`** — what the architecture haiku currently does. Note the 8 measurement procedures (Step 4) — these are correct for classification but don't pre-gather design facts.

4. **`claude-plugins/agentboard/agents/architecture-compose-l3.md`** — what currently runs on opus that shouldn't. Note Phases 3, 4, and 6 — these are the duplicated discovery work.

5. **`claude-plugins/agentboard/docs/plans/2026-05-09-architecture-pipeline-redesign.md`** — the original plan. §6.1 has the current bundle schema. §8.3's adaptation table is where the missed opportunity sits. §3 design principles are mostly still right and worth preserving.

6. **`claude-plugins/agentboard/docs/plans/2026-05-11-codex-sync-report.md`** — what changed in Sessions 1–6. Useful for understanding the current state without re-reading the plan.

7. **This document.**

---

## What I won't do in this doc

- Pick Shape A, B, or C for the user.
- Write a session-by-session plan.
- Estimate work in hours or claim a confidence level.
- Frame any option as "the obvious right answer."

The user explicitly said they don't know how to handle this. The point of this doc is to give them enough to think with, not to pre-decide for them. The decision points above are the real shape of what needs to be settled before any rework starts.
