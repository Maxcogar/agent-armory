# Handoff — Architecture Pipeline Redesign, after Session 1 (2026-05-09)

**Next session:** Session 2 of the architecture pipeline redesign.
**Read this first**, then go to the plan for full detail.

---

## What you're picking up

Session 1 split spec from architecture in the agentboard plugin's workspace-board pipeline:

- `/foundation` now produces an **architecturally-silent spec** via the new `spec-writing` skill.
- A new `/architecture` command sits between `/foundation` and `/orchestrate`. Cards do not exist before architecture is approved.
- Planning agents and review agent now consume **per-card architecture slices** (allowed-touch / forbidden-touch / produces / consumes / verification scope / depends_on) instead of spec excerpts.
- The full multi-session plan is committed at `docs/plans/2026-05-09-architecture-pipeline-redesign.md`.

The next phase of work splits the architecture pipeline into **three rigor levels (L1/L2/L3)** with deterministic classification by a research agent + auditor. Session 2 starts that phase by authoring the upstream classification pieces.

---

## Required reading, in order

1. **`docs/plans/2026-05-09-architecture-pipeline-redesign.md`** — the authoritative plan. Read in full. Pay special attention to:
   - §3 Design principles (the rules every implementation decision is judged against)
   - §6.1 ARCH_FACTS_BUNDLE_V1 schema (the research agent's output contract)
   - §6.2 ARCH_BUNDLE_AUDIT_V1 schema (the auditor's output contract)
   - §7 Classification rules v1.0 (the fixed thresholds the research agent applies and the auditor validates)
   - §8.1 Full spec for `agents/architecture-research-agent.md`
   - §8.2 Full spec for `agents/architecture-classification-auditor.md`
   - §10 Risks (especially the `expected_card_count_band` and `rules_version` drift items)

2. **`expert-architecture.md`** at plugin root — staging content for the L3 compose agent. **Do not absorb it in Session 2.** It's for Session 3. Skim it now so you know what L3 will look like, since the bundle fields you're measuring in Session 2 determine which compose agent runs.

3. **`agents/planning-research-agent.md`** — the haiku research agent pattern Session 2 will mirror. Read its structure (frontmatter, "How to read this profile" anti-skip language, mandatory step ordering, FACTS_BUNDLE_V1 schema validation discipline). The two new agents follow the same shape.

---

## Session 2 scope — author exactly these two files

### 1. `agents/architecture-research-agent.md`

- Model: `claude-haiku-4-5-20251001`
- Role: mechanical fact-gathering against the spec and codebase. Fills ARCH_FACTS_BUNDLE_V1 with countable fields + evidence. Applies the v1.0 classification rules to compute level.
- Full spec: §8.1 of the plan.
- Estimated length: 150–250 lines.
- Tools: Read, Glob, Grep, Bash, Skill, agentboard MCP (`get_card`, `update_workspace_card`, `add_log_entry`, `submit_workspace_artifact`), codegraph (full set), codebase-rag (`rag_search`, `rag_query_impact`).

### 2. `agents/architecture-classification-auditor.md`

- Model: `claude-haiku-4-5-20251001`
- Role: independent re-derivation of every bundle field. Emits ARCH_BUNDLE_AUDIT_V1 with field-by-field PASS/DISCREPANCY verdicts. If any discrepancies, emits a corrected bundle and a recomputed level. Cannot promote/demote level directly — only via correcting facts.
- Full spec: §8.2 of the plan.
- Estimated length: 150–250 lines.
- Tools: same set as the research agent.
- Critical ordering discipline (in profile): the auditor MUST measure every field from the spec independently BEFORE looking at the research agent's bundle. Anchoring bias toward agreement is the failure mode this discipline prevents.

---

## Design decisions locked in Session 1 — do not deviate without explicit re-confirmation

These are the locked decisions from the plan §3 and recorded in the CORE memory entry. They constrain Session 2's authoring:

1. **No conditional or skip language in any compose-agent profile.** Conditionality lives only in `commands/architecture.md`'s dispatch logic. This applies to Session 2's profiles too — the research agent measures every field unconditionally; the auditor verifies every field unconditionally.
2. **Three independently authored monolithic compose-agent profiles** (Sessions 3–5). Session 2's classification pipeline must work without knowing which level will fire downstream.
3. **Classification is deterministic.** Research agent applies fixed rules; auditor independently re-derives. No user override; transparency only via `/architecture` showing the bundle and level after audit.
4. **Per-card slice schema consistent across all levels** (§6.3 of the plan). Session 2's pipeline produces a level, not a slice — but the bundle's `expected_card_count_band` will inform slicing in Sessions 3–5.
5. **Bias toward higher level when classification is uncertain.** Encoded as OR rules in §7; any L3 trigger pulls the level up regardless of other low signals. The auditor's `expected_card_count_band` correction biases toward higher.
6. **`rules_version` field gates compatibility.** The research agent's profile carries `rules_version: "1.0"`; the auditor validates the bundle's version matches the version it expects. A rule change in any future session bumps the version in lockstep across both files.

---

## Acceptance criteria for Session 2 (from plan §11)

Session 2 is complete when:

- `agents/architecture-research-agent.md` exists, is haiku-modeled, and contains the v1.0 classification rules baked into the profile (not pulled from an external config — baked in).
- `agents/architecture-classification-auditor.md` exists, is haiku-modeled, validates `rules_version` matches.
- Both profiles have anti-skip language; neither contains conditional skipping.
- Both profiles produce schema-valid artifacts (ARCH_FACTS_BUNDLE_V1 and ARCH_BUNDLE_AUDIT_V1 per §6.1 and §6.2).
- Both profiles follow the mandatory-step pattern from `agents/planning-research-agent.md` — no optional steps, no fallbacks, tool failures produce halt-and-report not partial output.

---

## What's NOT in Session 2's scope

- Authoring any of `architecture-compose-l1.md`, `-l2.md`, `-l3.md` (Sessions 3, 4, 5).
- Absorbing `expert-architecture.md` (Session 3).
- Rewriting `commands/architecture.md` (Session 6).
- Updating `README.md` or `skills/workspace-orchestration/SKILL.md` (Session 6, minor edits).
- Calibrating thresholds (optional Session 7).
- Producing the codex sync report (Session 6).

If Session 2 surfaces a need to do any of the above, stop and surface it — do not silently expand scope.

---

## Files Session 2 will touch (just two creates)

```
agents/architecture-research-agent.md         (NEW, ~150-250 lines)
agents/architecture-classification-auditor.md (NEW, ~150-250 lines)
```

No edits to existing files in Session 2. The downstream consumers of these agents (`commands/architecture.md` orchestration) are not yet wired to them — that wiring happens in Session 6 after all three compose profiles exist.

---

## Open items deferred (recorded for future sessions, not Session 2's responsibility)

- **v1.0 threshold tuning.** The thresholds in plan §7 are best-judgment placeholders. Calibration against real specs is optional Session 7, after all five compose profiles exist and the pipeline can be exercised end-to-end. Until then, the v1.0 thresholds are authoritative.
- **Codex tree sync.** `codex-plugins/agentboard/` is a separate Codex runtime. End-of-work codex sync report (template in plan §13) goes out at end of Session 6.

---

## CORE memory record

This session was ingested to CORE Memory at run id `run_cmp0dfper0mfk1w6zulgeaane` with labels: AgentBoard, Agent Compliance Checklist, Commit Workflow, Development Governance. If picking up after a gap, `memory_search` for "architecture pipeline redesign Maxcogar/agent-armory" retrieves the full context.

A prior malformed ingestion at `run_cmp0cmnfq0mdi1w6zkk4zu6is` exists in CORE and cannot be deleted; the corrective ingestion at `run_cmp0dfper0mfk1w6zulgeaane` supersedes it as the canonical record.
