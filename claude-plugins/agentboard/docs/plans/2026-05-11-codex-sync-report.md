# Codex sync report — architecture pipeline redesign (2026-05-11)

**Source tree (changes landed here):** `claude-plugins/agentboard/`
**Parallel tree (apply same changes):** `codex-plugins/agentboard/`
**Authoritative plan:** `docs/plans/2026-05-09-architecture-pipeline-redesign.md` (in the source tree)

This report summarizes everything that changed in the agentboard plugin tree during the architecture pipeline redesign (Sessions 1–6, 2026-05-09 to 2026-05-11). The redesign converts the `/architecture` command from a single end-to-end L2-shaped flow into a level-aware pipeline that classifies the spec's rigor needs (L1 / L2 / L3) and dispatches to one of three independently-authored compose agents. The Codex runtime has a parallel structure at `codex-plugins/agentboard/`; this report enables a synchronization pass without re-deriving the design.

## What the redesign delivered

Before this redesign, `/architecture` was a single command file that did research, design, document-writing, and card creation in one flow at fixed L2-shaped rigor. The new pipeline:

1. **Phase A (research, haiku)** — `architecture-research-agent` measures eight countable fields from the spec and codebase, fills `ARCH_FACTS_BUNDLE_V1`, applies v1.0 classification rules to compute a level.
2. **Phase A audit (haiku)** — `architecture-classification-auditor` re-measures every field before looking at the research agent's bundle (anchoring-bias discipline), emits `ARCH_BUNDLE_AUDIT_V1` with field-by-field PASS/DISCREPANCY verdicts, and recomputes the level from a corrected bundle if any discrepancies surfaced.
3. **Phase B (compose, opus)** — `architecture-compose-l1` / `-l2` / `-l3` runs the level-appropriate monolithic process, writes the architecture document, and produces the per-card slices.
4. **Card creation** — the orchestrator (`/architecture` command) reads the document's Card Slices section after user approval and creates one workspace card per slice.

The level is the rules' output, not the user's judgment. Classification is deterministic; the user sees the bundle and level as transparency, then approves the architecture document itself.

## New files

Apply each by creating the file at the same path under `codex-plugins/agentboard/`.

### `agents/architecture-research-agent.md`

- **Model:** `claude-haiku-4-5-20251001` (haiku, full model ID)
- **Frontmatter description:** "Phase A of the architecture pipeline — mechanical fact-gathering against the spec and codebase. Fills ARCH_FACTS_BUNDLE_V1 with countable fields and evidence, applies the v1.0 classification rules to compute level. Does not reason about architecture; produces facts that determine which compose agent runs in Phase B. Invoke from /architecture — the orchestrator passes spec_path, scaffold_card_id, and agent_id."
- **Purpose:** Reads the spec, runs `codegraph_scan` and RAG queries, fills the eight bundle fields per field-specific measurement procedures, applies the v1.0 rules baked into its profile (5 L3 triggers, 4 L2 triggers, L1 default; evaluation order L3 → L2 → L1; OR semantics within each tier), submits an `ARCH_FACTS_BUNDLE_V1` artifact to the scaffold card.
- **Reuse rule:** Only reuses a prior bundle if `gathered_at` is within the last hour AND `rules_version == "1.0"`.
- **Length:** ~287 lines.

### `agents/architecture-classification-auditor.md`

- **Model:** `claude-haiku-4-5-20251001` (haiku)
- **Purpose:** Independent re-measurement of every bundle field BEFORE looking at the research agent's bundle. Emits `ARCH_BUNDLE_AUDIT_V1` with field-by-field PASS/DISCREPANCY verdicts; if any discrepancies, emits a corrected bundle and recomputes the level. Hard-fails on `rules_version` mismatch.
- **Anchoring-bias discipline:** Step 4's preamble explicitly forbids consulting `architecture-research-agent.md` for RAG query strings; field-measurement procedures are reproduced in the auditor at verbatim parity so the auditor never needs to read the research agent's profile.
- **Length:** ~287 lines.

### `agents/architecture-compose-l3.md`

- **Model:** `opus` literal
- **Purpose:** Phase B at L3. Twelve-phase monolithic process (Phases 1–10 with 10a/10b sub-phases, 11 write document, 12 slice). Three delivery gates (A/B/C) plus parallel trap audit. Clear Thought MCP as a framework throughout (eight tools mapped to phases).
- **Tools:** Read, Glob, Grep, Bash, Skill, four agentboard tools (`get_card`, `update_workspace_card`, `add_log_entry`, `submit_workspace_artifact`), full codegraph set (8 tools), codebase-rag (`rag_search`, `rag_query_impact`), Context7 (`resolve-library-id`, `query-docs`), eight Clear Thought tools (`metacognitivemonitoring`, `mentalmodel`, `debuggingapproach`, `structuredargumentation`, `sequentialthinking`, `scientificmethod`, `decisionframework`, `collaborativereasoning`).
- **Two-pass write:** Phase 11 writes the document body with `## Card Slices` placeholder; Phase 12 reads from committed document and replaces placeholder with derived slices.
- **Length:** 500 lines.
- **Derived from:** `expert-architecture.md` (the source content; now deleted) with eight specific adaptations enumerated in plan §8.3.

### `agents/architecture-compose-l2.md`

- **Model:** `opus` literal
- **Purpose:** Phase B at L2. Eight-phase process plus Phase 7.5 mid-write step. No Clear Thought MCP. No Context7. The structured reasoning disciplines (first-principles, thesis-antithesis-synthesis, multi-criteria comparison, three-perspective Gate A) live inline at the phase that uses each.
- **Tools:** Same 4-tool agentboard set as L3, full codegraph set (8 tools), codebase-rag (`rag_search`, `rag_query_impact`). No Context7. No Clear Thought tools.
- **Two-pass write:** Phase 7.5 writes document body with placeholder; Phase 8 reads from committed document and writes slices in.
- **L2-only addition:** Phase 7 mandates a per-decision verification approach (sixth element appended to the five-part format) — quality characteristic, how verified, verification scope (within this card / against another card's contract / across multiple cards). Replaces L3's standalone Phase 10a ISO 25010 mapping. Phase 8 derives each slice's `Verification scope` field from the D# decisions' verification approach via a three-rule mapping.
- **Gate C discipline-coverage item:** four sub-conditions (three conditional, one always-required) verifying that each conditional inline discipline fired when its trigger held, or an explicit attestation states the trigger did not hold.
- **Length:** 403 lines.

### `agents/architecture-compose-l1.md`

- **Model:** `opus` literal
- **Purpose:** Phase B at L1. Six-phase process (Phase 6 is a single-pass write step — no two-pass write at L1 because there's no intermediate design layer between spec and slices). Single delivery gate with five mechanical checks (replaces L3's Gate A/B/C). The slicing IS the architecture at this level.
- **Tools:** Same 4-tool agentboard set, codegraph subset (`scan`, `get_stats`, `list_files`, `get_dependencies`, `get_dependents` — no `find_entry_points`, `get_subgraph`, `get_change_impact`), codebase-rag (`rag_search` only — no `rag_query_impact`). **No Bash. No Context7. No Clear Thought tools.**
- **L1-only requirements:** mandatory italic attestation between Scope and Card Slices explaining why Components and Design decisions sections are absent; Source decisions field uses the L1 form `"Direct from spec — R# and/or Q# (no design decisions at this level)"` with mandatory R#/Q# attribution.
- **Output template:** Goal, Scope, italic attestation, Card Slices, Limitations, Standards, Status. No Components, no Design decisions, no Threat model, no ASVS, no Quality characteristics, no Inheritance section.
- **Length:** 267 lines.

## Deleted files

### `expert-architecture.md` (plugin root, was 852 lines)

The entire file is removed. Its content was absorbed into `agents/architecture-compose-l3.md` (with eight specific adaptations per plan §8.3) and adapted into `agents/architecture-compose-l2.md` and `agents/architecture-compose-l1.md` independently. There is no remaining call site — `/foundation` does not reference it, `/architecture` does not reference it, the SKILL.md does not reference it. Delete the parallel `codex-plugins/agentboard/expert-architecture.md` (if present) to complete the sync.

## Modified files

### `commands/architecture.md` (rewritten)

The old file was ~140 lines and ran research / design / write / create-cards in one flow at fixed L2-shaped rigor. The new file is ~171 lines of pure orchestration:

1. Load tools (agentboard, codegraph, rag, Context7) + activate `agentboard:expert-standards` skill
2. Locate the approved spec
3. Select or create a workspace board
4. Create a scaffold card to hold flow artifacts
5. Spawn `architecture-research-agent`; wait
6. Verify `ARCH_FACTS_BUNDLE_V1` artifact
7. Spawn `architecture-classification-auditor`; wait
8. Verify `ARCH_BUNDLE_AUDIT_V1`; read `verified_level`
9. Display bundle + audit + level to user (transparency, not approval)
10. Dispatch to `architecture-compose-l1` / `-l2` / `-l3` based on `verified_level`; wait
11. Verify `architecture_document` artifact + `docs/arch/<file>.md`
12. Show document to user; get explicit approval; iterate
13. Commit `docs/arch/<file>.md` to git
14. Read the Card Slices section
15. Create one workspace card per slice
16. Move scaffold card to `finished`
17. Show summary

The Key Principles section names the locked decisions: classification is deterministic; user approves the document not the level; cards do not exist before approval; slices are boundary truth; one question at a time when iterating.

### `docs/plans/2026-05-09-architecture-pipeline-redesign.md`

The authoritative plan was written in Session 1 and patched across Sessions 2–6 as judgment calls surfaced. Notable in-session patches:
- Session 2 (research + auditor): plan §6.1 schema keyword list expanded from 6 to 10; §8.1 process steps clarified to fold RAG into per-field measurement; §8.2 anti-skip rebuttals strengthened.
- Session 3 (L3 compose): minor; the plan §8.3 adaptation table was followed as-written.
- Session 4 (L2 compose): plan §8.4 patched to explicitly add Phase 7.5 (mid-phase document-write step), the Phase 7 per-decision verification approach mandate, the Phase 8 three-rule verification-scope mapping, and the Gate C discipline-coverage consolidated item with four sub-conditions.
- Session 5 (L1 compose): plan §8.5 patched to explicitly require the L1 Source decisions form with R#/Q# attribution; Phase 6 added as a single-pass write step with the L1/L2/L3 write-mechanics asymmetry rationale; single delivery gate tightened to five mechanical checks. Plan §6.3 updated to specify the L1 attribution form. Plan §8.3 / §8.4 aligned with §6.3's eight-field schema (the "six-field" shorthand was replaced with "eight" everywhere).

### `README.md`

Three areas updated:
- The two-workflows table row for workspace boards now mentions `/architecture` is level-aware.
- The `/architecture` command description (under "Workspace board commands") was rewritten to describe the three-phase pipeline (research / audit / compose), the dispatch by `verified_level`, the user-approval distinction (level is transparency-only; document is approved), and the per-card slice as boundary truth.
- A new "three levels in brief" subsection lists what L1 / L2 / L3 mean to a user running `/architecture`.

## Unchanged files

These files were reviewed and confirmed accurate for the new pipeline; do not modify them in the parallel tree on the basis of this redesign alone:

- `skills/workspace-orchestration/SKILL.md` — the prerequisites text already says "An approved architecture document at `docs/arch/<topic>.md` whose Card Slices section corresponds to the cards on this board." This is accurate for all three levels. Per plan §8.7, no level metadata field is added to any compose template, so the SKILL doc does not need to mention one.
- `agents/planning-research-agent.md`, `agents/plan-compose-agent.md`, `agents/review-agent.md`, `agents/implementation-agent.md`, `agents/audit-research-agent.md`, `agents/audit-compose-agent.md` — these consume the per-card slice via `arch_slice` and the full architecture document via `arch_path`. The slice schema is consistent across L1 / L2 / L3 per §6.3, so downstream agents do not branch on level. No changes needed.
- `commands/foundation.md`, `commands/orchestrate.md`, `commands/sweep.md`, `commands/board-status.md`, `commands/kickoff.md`, `commands/pickup.md`, `commands/wrap-up.md`, `commands/status.md` — no architecture-pipeline references that the redesign changed.

## Behavioral changes worth flagging for the parallel-tree applier

These are the design decisions an applier should preserve verbatim (not re-derive):

- **Classification is deterministic.** Five L3 triggers and four L2 triggers are baked into `architecture-research-agent.md` as `rules_version: "1.0"`. The auditor validates `rules_version` matches and hard-fails on mismatch. Calibration of thresholds requires bumping the version in both files in lockstep.
- **The user does not pick the level.** Classification is transparency; the architecture document is the explicit user-control surface. The plan §3 design principle "no user override of classification" is locked.
- **Three independently authored compose profiles.** L1 is not L3-with-skip-rules. L2 is not L3-with-skip-rules. Each is authored as a complete monolithic process at its rigor level. Conditional language about whether to do steps lives in `commands/architecture.md`'s dispatch logic, not inside any compose agent.
- **No skip language inside compose agents.** Every step the profile names is mandatory. Tool failure halts via card note + activity log.
- **Per-card slice schema is consistent across levels.** Eight fields per slice per §6.3: Description, Allowed-touch list, Forbidden-touch list, Produces, Consumes, Verification scope, Depends on, Source decisions. The "six-field" shorthand that appeared in earlier plan drafts has been corrected to "eight" everywhere.
- **Two-pass write at L2 and L3, single-pass at L1.** The asymmetry is structural — L2/L3 have intermediate design content (Components, Design decisions, verification approach) that the slicing must read from the committed document; L1 has no such intermediate layer, so single-pass is honest about that.
- **`expert-architecture.md` is gone.** Its content lives in `agents/architecture-compose-l3.md` (with eight adaptations) and informs (but does not source) `agents/architecture-compose-l2.md` and `agents/architecture-compose-l1.md` (independently authored).
- **Skill name corrections.** The plan in several places refers to "expert-standard" (singular); the actual registered skill is `agentboard:expert-standards` (plural, namespaced). The compose agents all use the correct namespaced name. Replicate that, not the plan's typo.

## Codex-specific adaptation notes

The Claude Code runtime and the Codex runtime are not identical. When applying these changes to `codex-plugins/agentboard/`, the parallel-tree applier needs to verify environment-level compatibility points that the file content itself cannot guarantee. Specific concerns:

- **Clear Thought MCP server.** The L3 compose agent declares eight `mcp__clear-thought__*` tools in its frontmatter (`metacognitivemonitoring`, `mentalmodel`, `debuggingapproach`, `structuredargumentation`, `sequentialthinking`, `scientificmethod`, `decisionframework`, `collaborativereasoning`). If the Codex runtime does not have the `clear-thought` MCP server registered and reachable, the L3 compose process will fail when it reaches the first mandatory Clear Thought invocation (`metacognitivemonitoring` at session start in Phases 1–2). L2 and L1 do not depend on Clear Thought MCP — their inline disciplines work without it.
- **Context7 MCP server.** The L3 compose agent declares `mcp__claude_ai_Context7__resolve-library-id` and `mcp__claude_ai_Context7__query-docs`. The exact MCP server name and tool prefix may differ on Codex — Claude Code surfaces Context7 with the `claude_ai_Context7` namespace, but Codex may register it differently. L2 and L1 do not depend on Context7.
- **Skill invocation pattern.** All five agent profiles activate `agentboard:expert-standards` via the `Skill` tool at session start, and the research agent activates `agentboard:codebase-rag` at Phase 3. If Codex's skill activation mechanism uses a different invocation pattern or skill-namespacing convention, the parallel-tree files may need their `Skill(skill: "agentboard:...")` calls rewritten.
- **Tool name surface for `agentboard` MCP.** The four agentboard MCP tools used in the orchestration command (`agentboard_list_workspace_artifacts`, `agentboard_create_workspace_card`, `agentboard_update_workspace_card`, `agentboard_add_log_entry`, `agentboard_submit_workspace_artifact`, `agentboard_get_workspace_artifact`, `agentboard_list_apps`, `agentboard_list_boards`, `agentboard_create_app`, `agentboard_create_board`) must exist on the Codex `agentboard` MCP surface with the same names and parameter shapes. The agentboard MCP server is shared infrastructure between Claude Code and Codex, so this should hold, but verify before relying on it.
- **Frontmatter convention.** Each agent file uses `name:`, `description:`, `model:`, and `tools:` keys. Confirm Codex's plugin-manifest schema accepts the same key set and value formats (e.g., `model: opus` literal vs `model: claude-haiku-4-5-20251001` full ID). If Codex requires a different convention, every agent file's frontmatter must be re-keyed in parallel.

If any of these compatibility points cannot be verified before the parallel tree goes live, run the L1 pipeline first (it has the smallest runtime tool surface — no Context7, no Clear Thought) to confirm the foundational orchestration works, then incrementally validate L2 and L3.

## Verification checklist for the parallel tree

After applying changes to `codex-plugins/agentboard/`, run through this checklist. The first nine items verify content correctness (every change landed); the last five verify Codex-runtime compatibility (the changes function at runtime).

**Content correctness:**

- [ ] `agents/architecture-research-agent.md` exists, is haiku-modeled (`claude-haiku-4-5-20251001`), and contains the v1.0 classification rules baked in
- [ ] `agents/architecture-classification-auditor.md` exists, is haiku-modeled, and validates `rules_version` matches with a hard-fail
- [ ] `agents/architecture-compose-l3.md` exists, is opus-modeled, contains a monolithic 12-phase process with no skip language, and includes all eight Clear Thought MCP tool invocations at the mandated phases
- [ ] `agents/architecture-compose-l2.md` exists, is opus-modeled, contains nine numbered phases (1–7, 7.5, 8) with no skip language, no Clear Thought MCP invocations, no Context7, and the Gate C discipline-coverage consolidated item with four sub-conditions
- [ ] `agents/architecture-compose-l1.md` exists, is opus-modeled, contains six numbered phases with single-pass write in Phase 6, no Context7, no Clear Thought MCP, codegraph subset (no `find_entry_points` / `get_subgraph` / `get_change_impact`), codebase-rag subset (no `rag_query_impact`), the mandatory italic attestation between Scope and Card Slices, and the single delivery gate with five mechanical checks
- [ ] `commands/architecture.md` is rewritten as 17-step pure orchestration and contains the Key Principles section
- [ ] `expert-architecture.md` does NOT exist at the plugin root
- [ ] `skills/workspace-orchestration/SKILL.md` is unchanged from before the redesign
- [ ] `README.md` mentions level-aware in the workspace boards table row, has the rewritten `/architecture` command description, and includes the three-level explanation

**Codex-runtime compatibility (per the adaptation notes above):**

- [ ] All file paths translate correctly under `codex-plugins/agentboard/` (agents/, commands/, skills/, docs/ namespacing matches)
- [ ] Tool names map correctly — every `mcp__*__*` tool declared in any agent frontmatter is reachable on the Codex MCP surface with the same name and parameter shape
- [ ] Frontmatter conventions match Codex's plugin schema (name / description / model / tools keys; `model: opus` literal and `model: claude-haiku-4-5-20251001` full-ID forms both accepted as written)
- [ ] Skill activation pattern matches Codex's skill invocation mechanism — `Skill(skill: "agentboard:expert-standards")` and `Skill(skill: "agentboard:codebase-rag")` calls resolve to the correct registered skills on Codex
- [ ] No claude-specific tool dependencies remain unaccounted for: confirm Codex has parallel access to Clear Thought MCP (L3 requires all eight tools) and Context7 (L3 requires both), or document the absence as a known L3-blocker until the gap closes
- [ ] The plan document `docs/plans/2026-05-09-architecture-pipeline-redesign.md` is present in the parallel tree (this is the authoritative plan record; it stays in both trees)

When every check passes, the parallel tree is in sync with the source tree as of 2026-05-11.

## Open items deferred from this redesign

These are flagged in plan §12 as known-deferred and should not be silently overwritten or worked around in future sessions:

- **Calibration of v1.0 thresholds against real specs** — optional Session 7. The user has agreed to tune later; until tuned, the v1.0 thresholds are the authoritative baseline. Calibration data should be tracked. Increment `rules_version` on every change.
- **Multi-rater research extension** — the design supports eventually adding a second `architecture-research-agent` instance for multi-rater consensus. Not implemented in v1; deferred until calibration data shows the auditor pattern isn't catching enough.
- **Long-term factoring of shared compose-profile boilerplate** — if profile drift becomes a maintenance burden, factor genuinely-shared content into a shared skill. Not done in v1; YAGNI.

## Source-tree commit history (claude-plugins/agentboard/)

For traceability when applying to the parallel tree:

- `f29835c` — Session 2: research agent + classification auditor
- `25cb7a5` — Session 3: L3 compose agent
- `0131258` — Session 4: L2 compose agent and plan §8.4 patch
- `2854a76` — Session 5: L1 compose agent and plan eight-field-schema alignment
- (this session's commit) — Session 6: command rewrite, README update, Codex sync report, delete `expert-architecture.md`

All commits are on branch `claude/agentboard-spec-arch-split` against `main` in `Maxcogar/agent-armory`.
