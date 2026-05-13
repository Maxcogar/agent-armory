# Handoff — Architecture Pipeline Rework, Session 1 → Session 2 (2026-05-12)

**Next session:** Session 2 of the architecture pipeline rework.
**Read this first**, then go to the plan and contract for full detail.

---

## What you're picking up

Sessions 1–6 of the original 2026-05-09 architecture pipeline redesign shipped (commits `f29835c` through `281a9fe`, plugin version 0.2.1 on `main`) with a substantive design defect: the architecture pipeline copies the *shape* of the planning pipeline's haiku-research / opus-compose split but not the *substance*. The haiku research agent measures 8 classification fields; the opus compose agents then re-run RAG / codegraph / Context7 from scratch to actually understand the codebase. Opus tokens get spent on discovery work haiku could have pre-gathered.

The user diagnosed this end-to-end and authored `docs/plans/2026-05-12-architecture-pipeline-rework-issues.md` describing the defect, what shipped vs what should have shipped, and three rework shapes (A, B, C).

Session 1 of the rework (this session, ended 2026-05-12):

- Worked through the diagnosis with the user. Shape C ("document and live with it") was rejected as lazy. Shape B (collapse to single agent) was rejected as weaker than the original Session 1 user requirement of deterministic classification. Shape A (honor the split) was chosen.
- Produced a contract document at `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md` after four reviewer-pass iterations applying findings on hook capability, level inference, auditor methods, tool removal, library recovery, existing-gate conflict, prompt-half scope, Step 1/Step 2 ambiguity, level representation, and more.
- Produced the rework plan at `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md` after an independent reviewer pass and applying 12 findings (2 blocker, 5 serious, 5 moderate, 1 minor).
- The plan is approved by user. Session 1 ends with three authoritative documents and this handoff.

No agent files were written in Session 1. No commits to plugin code. The next session authors the first new agent file.

---

## Required reading, in order

1. **`docs/plans/2026-05-12-architecture-pipeline-rework-issues.md`** — the diagnosis. Read in full for context on why this rework exists.

2. **`docs/specs/2026-05-12-architecture-pipeline-rework-contract.md`** — the definition of done. The plan's correctness is measured against this. Read in full.

3. **`docs/plans/2026-05-12-architecture-pipeline-rework-plan.md`** — the authoritative plan. Read in full. Pay particular attention to:
   - Preamble (the five governing rules that apply throughout)
   - §1 Subagent boundary contracts (read your session's agent's contract first)
   - §2 ARCH_FACTS_BUNDLE_V2 schema (Session 2 emits this)
   - §6.1 Research agent profile specification (Session 2 authors this)
   - §11 Acceptance criteria (the checks the rework must satisfy)
   - §12 Session sequencing (where Session 2 sits and what it produces)

4. **`agents/planning-research-agent.md`** — the pattern to mirror. This is what a research agent looks like when the haiku/opus split is honored. Note Step 3 (RAG discovery — ground the file set) through Step 8 (validate and emit). The new architecture-research-agent will follow this shape with classification fields added.

5. **`docs/plans/2026-05-09-architecture-pipeline-redesign.md`** — the original plan (now superseded but still useful for cross-referencing §6.3 slice schema and §7 classification rules v1.0, which are preserved unchanged).

6. **This document.**

---

## Session 2 scope

Per plan §12, Session 2 authors:

1. **V2 schema definitions** — `ARCH_FACTS_BUNDLE_V2`, `ARCH_BUNDLE_AUDIT_V2`, `ARCH_DESIGN_REVIEW_V1`. Form factor: baked into the relevant agent profile (preferred), OR separate JSON schema files at `docs/schemas/`. Pick form factor early in Session 2.

2. **`agents/architecture-research-agent.md`** rewrite — haiku-modeled, per plan §6.1. The V2 bundle schema is baked into this profile (or referenced from a schema file if form factor B was picked).

### Acceptance for Session 2 (subset of plan §11)

- Research agent profile has `Skill` in frontmatter tools list.
- Process Step 1 is exactly the cross-cutting expert-standards activation (verbatim text per plan Preamble rule 2).
- Process Step 2 onward executes the discovery + measurement + classification phases per §6.1.
- The profile emits ARCH_FACTS_BUNDLE_V2 with the full field set per §2.
- `computed_level` is numeric (1/2/3), not string.
- `rules_version: "1.0"` baked in.
- `schema_version: "2.0"` set.
- Plant-watering test passes — every sentence in the profile is an instruction to the subagent (research agent). No content directed at the orchestrator, user, or anyone else.
- Independent code-reviewer subagent pass before declaring Session 2 complete. Findings applied in full.

### What Session 2 does NOT touch

- Auditor profile (Session 3).
- Any compose profile (Sessions 4–6).
- Design reviewer (Session 7).
- Hook scripts (Session 8).
- `commands/architecture.md` (Session 9).
- Plugin version bumps or codex sync (Session 10).
- Workspace-pipeline agents (out of scope for entire rework).
- Spec-writing skill (out of scope).

If Session 2 surfaces a need to touch something outside scope, halt and surface to user — do not silently expand.

---

## Design decisions locked in Session 1 — do not deviate without explicit re-confirmation

1. **No codebase discovery in compose.** Bundle's design fields carry the discovery results. Compose has zero `rag_search`, `codegraph_*`, or `rag_query_impact` anywhere in its profile (frontmatter, workflow context, process text, output template, examples, any section).

2. **Compose retains Context7** (`resolve-library-id` AND `query-docs`). External doc lookup is reasoning-shaped and unsuitable for haiku pre-gathering. The discipline is "no CODEBASE discovery in compose," not "no discovery at all."

3. **Universal expert-standards activation as Step 1**, verbatim. Applies to every subagent in the architecture pipeline.

4. **Auditor is sonnet-4.6 with extended thinking.** Not haiku. Validates the full V2 bundle (classification + design fields) with per-field methods (counts numerically; file lists by set comparison; RAG snippet existence by exact-match Read; libraries by independent Context7 resolution). Anchoring-bias discipline: measure independently BEFORE consulting the research bundle.

5. **Level representation split.** Machine contracts (bundle, audit, orchestrator dispatch) use numeric `1`/`2`/`3`. Document marker uses `**Level:** L1`/`L2`/`L3`. Compose translates when authoring; hook handles both. This supersedes the 2026-05-09 plan's §8.7.

6. **Validation hook is structural-only.** PreToolUse on `submit_workspace_artifact`. Multi-type via content-type dispatch covering all four architecture-pipeline artifact types. No behavioral checks (the hook surface doesn't expose tool-use logs). Behavioral enforcement comes from subagent frontmatter constraints (compose can't call discovery tools because they aren't declared).

7. **Design review wave** added between compose and user approval. Sonnet-4.6 with extended thinking. Advisory only — user sees findings alongside document and decides.

8. **Existing artifact-quality-gate revision covers BOTH halves** (script and prompt). `inject-quality-gate-prompt.sh` is the chosen form factor for type-aware prompts.

9. **Plant-watering rule** is non-negotiable for every rewritten profile. Every sentence in a profile is an instruction to the subagent that profile defines. No mixed-audience content.

10. **Eight-field §6.3 slice schema** preserved across all levels. Source decisions at L1 uses the form `Direct from spec — R# and/or Q# (no design decisions at this level)` with explicit R#/Q# attribution.

---

## Open items deferred (not Session 2's responsibility)

- **v1.0 classification rule threshold tuning** — open from the 2026-05-09 plan; not blocking the rework.
- **Agentboard app changes** — spec lands in Session 9; implementation is a separate cycle.
- **Plant-watering test automation** — manually verified via reviewer subagent in each session; codifying as a script is future work.

---

## What's already committed at the start of Session 2

After Session 1's wrap commit:
- `docs/plans/2026-05-12-architecture-pipeline-rework-issues.md` — diagnosis
- `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md` — contract (definition of done)
- `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md` — plan
- `docs/handoffs/2026-05-12-rework-plan-approved.md` — this document

Plugin code, agent profiles, hooks, commands — unchanged from `main` at version 0.2.1. Session 2 produces the first plugin-code change.

---

## CORE memory record

Session 1 was ingested to CORE Memory at the end of the session under labels TBD (per the global CORE Memory Protocol's approval gate). If picking up after a gap, `memory_search` for "architecture pipeline rework Maxcogar/agent-armory" retrieves the full context.
