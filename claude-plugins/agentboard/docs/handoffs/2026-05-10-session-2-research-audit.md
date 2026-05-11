# Handoff — Architecture Pipeline Redesign, after Session 2 (2026-05-10)

**Next session:** Session 3 of the architecture pipeline redesign — author `agents/architecture-compose-l3.md`.
**Read this first**, then the plan, then `expert-architecture.md`.

---

## What you're picking up

Session 2 authored the two upstream agents that drive the deterministic classification phase of the architecture pipeline. The downstream compose agents (L1/L2/L3) do not yet exist — they're the work of Sessions 3, 4, and 5.

**Files created in Session 2:**

- `agents/architecture-research-agent.md` (haiku, 287 lines as of wrap-up) — measures eight bundle fields against the spec and codebase, applies the v1.0 classification rules to compute a level (L1/L2/L3), submits an `ARCH_FACTS_BUNDLE_V1` artifact to a scaffold card. Reuses a prior bundle only if `gathered_at` is within the last hour AND `rules_version == "1.0"`.
- `agents/architecture-classification-auditor.md` (haiku, 287 lines as of wrap-up) — independently re-measures every bundle field BEFORE looking at the research agent's bundle (anchoring-bias discipline is load-bearing), emits an `ARCH_BUNDLE_AUDIT_V1` artifact with field-by-field PASS/DISCREPANCY verdicts, builds a corrected bundle and recomputes level if any discrepancies, hard-fails on `rules_version` mismatch.

Both profiles bake the v1.0 classification rules in verbatim (5 L3 triggers, 4 L2 triggers, L1 default; evaluation order L3→L2→L1; OR semantics within each tier).

**Files modified in Session 2:**

- `docs/plans/2026-05-09-architecture-pipeline-redesign.md` — four edits during Session 2:
  - §8.1 process steps: RAG folded into per-field measurement (no standalone "RAG discovery" step). Every RAG query is tied to a specific evidence slot so the auditor can reproduce it.
  - §8.1 hard rules: added requirement for three worked examples in the profile body (numeric / boolean / band field types).
  - §8.1 tools list: added `list_workspace_artifacts` + `get_workspace_artifact` so the agent can reuse a recent prior bundle (auditor inherits via "same set" in §8.2).
  - §8.2 anti-skip rebuttals: added the audit-ordering rebuttal ("I'll just glance at the bundle to know which fields to focus on" → no).
  - §6.1 schema: expanded `security_relevant_keyword_hits` keyword list from 6 to 10 to match §7 and the agent procedures.

**No other files were edited.** `commands/architecture.md`, `README.md`, and `skills/workspace-orchestration/SKILL.md` are unchanged — they will be touched in Session 6.

**No commits in Session 2.** All changes are local to the working tree on branch `claude/agentboard-spec-arch-split`.

---

## Reviewer pass and corrections applied

After authoring, an independent reviewer (`feature-dev:code-reviewer` subagent) ran against the two new profiles and the plan. The reviewer found 6 issues:

1. **Critical** — anchoring hole in the auditor: step 4 allowed the agent to consult `architecture-research-agent.md` for RAG query strings, which is the same failure mode the audit ordering exists to prevent. Fixed by rewriting step 4's preamble to forbid consulting the research agent's bundle OR profile, and adding a foreclose rebuttal entry for "I'll check the research agent's profile to see what queries it ran."
2. **Serious** — auditor's `security_relevant_keyword_hits` procedure omitted the "each occurrence = one evidence entry / `auditor_value` = evidence array length" invariant the research agent's procedure included. Fixed.
3. **Serious** — auditor's `expected_card_count_band` DISCREPANCY condition was worded with an "i.e." that conflated "no overlap" (symmetric) with "auditor higher than research" (asymmetric), so the rule would have passed cases where the research agent measured radically higher than the auditor. Fixed by replacing with "DISCREPANCY if the bands do not overlap in either direction."
4. **Moderate** — plan §6.1 schema's keyword list for `security_relevant_keyword_hits` was truncated (6 keywords) vs the 10 listed in §7 and both agent profiles. Fixed in the plan.
5. **Moderate** — research agent's bundle reuse check in step 1 only validated `gathered_at`, not `rules_version`. A pre-v1.0 cached bundle could have been silently routed into Phase B. Fixed by requiring both `gathered_at < 1 hour` AND `rules_version == "1.0"`.
6. **Minor** — auditor's anti-skip rebuttals lacked a concrete "adjust my values to produce a desired level" entry. Added.

**Plus a 7th issue caught on self-review after fixing the 6:** the auditor's step 4 field-measurement procedures were abbreviated versions of the research agent's procedures, missing the linguistic anchors (e.g., "look for language like 'introduce,' 'new,' 'create,' 'define'") that make "implies introducing" interpretable identically by both agents. This was a drift risk made more acute by Critical #1's fix (which forbids the auditor from consulting the research agent's profile to fill gaps). Fixed by bringing the auditor's procedures to verbatim parity with the research agent's, with minor wording differences only where the audit schema demands them (`auditor_value` vs `value`, and the corrected-bundle-validation note on keyword hits).

---

## Session 3 scope

Author `agents/architecture-compose-l3.md` per plan §8.3. This is the **largest single piece in the whole redesign** — estimated 600–800 lines, opus-modeled, the reasoning-heavy compose agent that runs when the verified level is L3.

The work is content **absorption** of `expert-architecture.md` (at plugin root, ~850 lines) with eight specific adaptations enumerated in plan §8.3's section-by-section table. Plus a brand-new **Phase 12** (slicing the architecture into per-card slices conforming to plan §6.3's per-card slice schema).

Before authoring, read in this order:
1. `docs/plans/2026-05-09-architecture-pipeline-redesign.md` §8.3 (the adaptation table — every change to expert-architecture.md content) and §6.3 (the per-card slice schema Phase 12 must produce).
2. `expert-architecture.md` end-to-end. This is the absorbed source content. Do not skip — you must understand the 12 phases, the three delivery gates (A/B/C), the trap audit, and the Clear Thought reasoning support before you can author the adaptations.
3. `agents/planning-research-agent.md` and `agents/architecture-research-agent.md` for tone and tool-call shape patterns (haiku research agents; L3 compose is opus but the mandatory-step / anti-skip discipline transfers).

Then plan the work explicitly: walk through each of the 8 adaptations and the new Phase 12 with the user before drafting. Session 3 is the highest-volume authoring session and the risk surface is large — Expert Standard says go slow.

---

## Locked decisions from Session 1 still in effect

These do not change between sessions and constrain Session 3 authoring:

1. **No conditional or skip language in any compose-agent profile.** All conditionality lives in `commands/architecture.md`'s dispatch logic (Session 6). The L3 profile measures and reasons unconditionally.
2. **Three independently authored compose-agent profiles.** L3 is not "L1/L2 with extra steps" — it is a monolithic process at L3 rigor. The other two are independently authored from this plan, not by copying L3 and deleting.
3. **Classification is deterministic.** L3 only runs when `verified_level == 3`. The compose agent does not pre-judge or self-grade.
4. **Per-card slice schema consistent across all levels** (plan §6.3). Phase 12 must produce slices in this schema; downstream planning agents consume them as-is.
5. **`rules_version` field gates compatibility.** The L3 profile depends on the verified bundle from Phase A. If you change anything that affects how the bundle is interpreted, the version bumps in lockstep across research agent + auditor + L3 compose.

---

## Open items deferred from Session 2

- **Tool-name parameter check on submission.** Both new profiles use `type: "general"` in the submission text, matching the existing `planning-research-agent.md` / `audit-research-agent.md` convention. `skills/agentboard/SKILL.md` line 202 documents the parameter as `artifact_type`. The existing profiles work, so the parameter name is presumably forgiving or the SKILL doc is the typo. Not a Session 3 concern but flagging if it surfaces later.
- **The reviewer's interpretation of plan §8.2 step 3** referenced "Run codegraph_scan and the same RAG queries the research agent should have run" — that phrase exists in plan §8.2.2 but did NOT exist in the authored auditor file (which only said "Call codegraph_scan"). The reviewer may have been reading the plan; the fix landed in the auditor's step 4 preamble where the equivalent risk lives. The plan's §8.2.2 step 3 wording could still be tightened in a future cleanup pass — non-urgent.
- **Branch and commit state.** Working branch `claude/agentboard-spec-arch-split` was already 11 commits ahead of origin/main at Session 1 wrap-up. Session 2 added no commits. Still no PR. Decision on whether to push, rebase, or open a PR remains deferred.

---

## Files Session 3 will touch

```
agents/architecture-compose-l3.md   (NEW, ~600-800 lines)
```

That's it. `expert-architecture.md` is **not deleted in Session 3** — its deletion is Session 6's responsibility after all three compose profiles exist.

---

## Acceptance criteria for Session 3 (from plan §11, item 4)

Session 3 is complete when:

- `agents/architecture-compose-l3.md` exists, is opus-modeled, contains a monolithic 12-phase process with no skip language.
- All 8 adaptations from plan §8.3 are applied: frontmatter added, `$ARGUMENTS` replaced with orchestrator inputs, `/expert-spec` and `/expert-plan` references replaced with `/foundation` and `/orchestrate`, "Workflow context" section replaced, "Handling user requests to skip rigor" subsection deleted, Phase 1 input source adjusted to `spec_path`, output path changed from `docs/architectures/` to `docs/arch/`, submission instructions replaced with workspace-artifact pattern.
- Phase 12 (slicing) is present, produces slices conforming to plan §6.3.
- "Card Slices" section added to the output template between Traceability matrix and Limitations.
- Gate C structural checklist extended with the two new slice-validation items.
- All Clear Thought MCP tool invocations preserved (this is L3; ceremony is not dropped here).

---

## Stop conditions for Session 3 (mirror of Session 2's discipline)

- Plan §8.3 conflicts with what's in `expert-architecture.md` (the source content) — halt and surface, do not silently absorb the conflict.
- A tool name the L3 profile needs doesn't exist on the actual MCP surface — halt and verify.
- Scope creep into Session 4 / Session 5 / Session 6 territory — halt.

---

## CORE memory record (pending at wrap-up)

Session 2's CORE Memory ingestion has not yet been submitted at the time of this handoff. The ingestion will be drafted and shown to Max Cogar for verbatim approval before the `memory_ingest` call per the workspace CORE Memory Protocol.
