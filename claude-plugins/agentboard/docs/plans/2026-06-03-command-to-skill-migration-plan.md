# Command → Skill Migration — Plan & Reference Map

- **Date:** 2026-06-03
- **Status:** DRAFT for review — **no plugin files changed yet**
- **Scope:** `claude-plugins/agentboard/` live surfaces only (`commands/`, `skills/`, `agents/`, `hooks/`, `README.md`, `.claude-plugin/plugin.json`)
- **Out of scope:** `docs/**`, `dev-work-resources/**` (historical paper trail — see §4d), `marketplace.json` (per repo rule), the spec-rescue flow files.

---

## 1. Goal

Convert the nine slash-commands into skills so each entry point is **one surface** instead of a command that wraps a skill. Skills are 100% user-invokable (`/name` works exactly as today), so nothing is lost; the command layer is removed as redundant. The command **bodies move essentially verbatim** — the only in-body edits are (a) swapping self-referential "command" mentions to "skill" and (b) a rewritten frontmatter `description` (which for a skill is the trigger mechanism, not a menu label).

## 2. Why (recap)

- `plugin.json` does not enumerate commands/skills — they auto-discover from `commands/` and `skills/`. Moving a file into `skills/<name>/SKILL.md` self-registers; no manifest edit (optional version bump only).
- No command uses `$ARGUMENTS`/`$1` tokens (grep: zero matches). Args are parsed in prose, which behaves identically under skill invocation. **No body change for argument handling.**
- The one genuine behavioral change: skills can **auto-trigger** on their `description`, where commands can't. Manage via tightly-scoped descriptions for `architecture`/`orchestrate` (don't fire mid-discussion); the operational five are low-stakes.

## 3. The migration's actual break surface

A reference only **breaks** if it points at a command **by file path** and that file moves. Everything that references a command by **slash name** (`/architecture`), **registered skill name** (`agentboard:expert-standards`), or **agent name** (`subagent_type: review-agent`) is **stable** because those identifiers don't change.

**Total path-references that break: 5 lines across 4 files.** Enumerated in §4a.

---

## 4. Complete live reference map

### 4a. BREAKS ON MOVE — must fix (5 lines, 4 files)

| # | Location | Current reference | Fix |
|---|----------|-------------------|-----|
| B1 | `agents/architecture-compose-l1.md:159` | "…absence of this profile's `architecture_document` artifact at `commands/architecture.md` step 12." | **Decouple** — reword to "…absence of the `architecture_document` artifact on the scaffold card." Drop the foreign step citation entirely (see §6). |
| B2 | `agents/architecture-compose-l2.md:151` | identical to B1 | identical decouple |
| B3 | `agents/architecture-compose-l3.md:149` | identical to B1 | identical decouple |
| B4 | `skills/workspace-orchestration/SKILL.md:10` | "The `/orchestrate` slash command at `commands/orchestrate.md` is a thin entry point… Do not duplicate wave logic in `commands/orchestrate.md`…" | Reword: this skill **is** the entry point (invoked directly); remove the thin-wrapper framing. |
| B5 | `commands/orchestrate.md:33-34` | See-also → `commands/architecture.md`, `commands/foundation.md` | Removed when `orchestrate` merges into `workspace-orchestration` (§5, item C). |

### 4b. STABLE — survives unchanged (do NOT "fix" these)

These reference targets by an identifier that the migration preserves. Touching them is churn and risk.

- **Slash-command refs** (`/architecture`, `/orchestrate`, `/foundation`, `/sweep`, `/kickoff`, `/pickup`, `/wrap-up`, `/board-status`, `/status`) — skills keep the same slash name. Found in: `skills/agentboard/SKILL.md` (lines 34-39, 109-110, 251, 275, 377, 380, 385-389, 551), `skills/workspace-orchestration/SKILL.md:15`, `skills/spec-writing/SKILL.md:118,154,166`, `agents/architecture-research-agent.md:8`, `agents/architecture-design-reviewer.md:71,375`, `agents/architecture-compose-l3.md:364,480`, `README.md`, and inter-command refs. *(Cosmetic only: where prose says "the /x command" it may read "skill" — optional, slash still works.)*
- **Skill activations** `Skill(skill: "agentboard:expert-standards")` — 8 agent profiles + `commands/architecture.md:57`. Plus `codebase-rag` in `review-agent`. Registered skill names don't change → stable.
- **`subagent_type` / agent-name spawns** — `skills/workspace-orchestration/SKILL.md:67-227` (6 agents), `commands/architecture.md:27-30,81,91,118-120` (6 agents), `skills/agentboard/SKILL.md:223-230,238` (artifact-type table). Agent names don't change → stable.
- **`skills/agentboard/SKILL.md §1.3`** (auth bootstrap) — cited by `commands/kickoff.md:16`, `status.md:12`, `pickup.md:15`, `sweep.md:22`, `architecture.md:53`, `hooks/hooks.json:8`. The agentboard skill is **not** moving → stable. *(The citing commands become skills, but the target path is unchanged.)*
- **Hooks** — `hooks/hooks.json` references only `hooks/scripts/*.sh` and `skills/agentboard/SKILL.md §1.3`. No command paths anywhere in `hooks/`. Unaffected.
- **README** — references `skills/agentboard/SKILL.md` (line 5) and a generic "commands/skills/hooks" (line 174). No `commands/*.md` path refs. Only cosmetic wording (the "## Commands" section).

### 4c. BRITTLE internal step/section citations (track for consistency; not all broken by this migration)

These pin a step/section number in another file. The migration doesn't break most of them, but they're the consistency surface you want tracked:

- `commands/architecture.md step 12` ← 3 compose agents (B1-B3) — **both brittle AND broken by move**; decouple.
- `agents/architecture-design-reviewer.md Step 2(c)` ← `compose-l1:161`, `l2:153`, `l3:151` — brittle, stable (reviewer stays an agent).
- `/architecture step 17` ← `architecture-research-agent.md:8` — slash survives; "step 17" must stay valid (it will, body moves verbatim).
- `skills/agentboard/SKILL.md §1.3` ← 6 sites (4b) — stable.
- `§6.3` slice schema and `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md §5` ← `compose-l2:127`, `l3:125` — external doc ref, unrelated to this migration.

### 4d. Out of scope — historical references (leave as-is)

~30 references to `commands/architecture.md` (and others) live in `docs/**` and `dev-work-resources/**` — plans, handoffs, evidence files, session-status. These describe what was true at the time they were written. **Editing them to say `skills/` would falsify the record.** Leave all of them. (If a future-facing pointer doc genuinely needs updating, handle it as a separate, explicit decision — not as part of this mechanical migration.)

---

## 5. Per-command migration

| Command | Becomes | Body change | Breaks triggered | Effort |
|---------|---------|-------------|------------------|--------|
| **A. board-status** | `skills/board-status/SKILL.md` | verbatim + wording | none | trivial |
| **A. status** | `skills/status/SKILL.md` | verbatim | none | trivial |
| **A. kickoff** | `skills/kickoff/SKILL.md` | verbatim | none (its §1.3 ref to agentboard stays) | trivial |
| **A. pickup** | `skills/pickup/SKILL.md` | verbatim | none | trivial |
| **A. wrap-up** | `skills/wrap-up/SKILL.md` | verbatim | none | trivial |
| **B. foundation** | `skills/foundation/SKILL.md` | verbatim; keeps activating `spec-writing` | none (`spec-writing` untouched) | small |
| **B. sweep** | `skills/sweep/SKILL.md` | verbatim; keeps activating `codebase-sweep` | none (`codebase-sweep` untouched) | small |
| **C. orchestrate** | **merge into** `skills/workspace-orchestration/SKILL.md`, then delete command | fold `--auto` note + ToolSearch/health-check preamble into the skill; rewrite skill `description` to be user-facing | B4, B5 | medium |
| **D. architecture** | `skills/architecture/SKILL.md` | verbatim (260 lines); tight `description` | B1, B2, B3; README cosmetic | medium |

Groups B and the operational five are genuine entry-point skills (real agentboard-specific content), not redundant wrappers, so they convert cleanly. Only `orchestrate` is a near-pure wrapper whose skill already exists — hence merge-and-delete rather than create-new.

## 6. Decoupling fix (do regardless of the skills decision)

The compose-agent halt prose names the orchestrator's *internal* step number. An agent's contract is "I halt by **not producing the `architecture_document` artifact**" — it does not need to know the orchestrator's step count. Reword B1-B3 from:

> "…the orchestrator detects this halt via the absence of this profile's `architecture_document` artifact at `commands/architecture.md` step 12."

to:

> "…the orchestrator detects this halt via the absence of the `architecture_document` artifact on the scaffold card."

This removes a cross-file step-number coupling that would otherwise need re-checking on every architecture renumber.

## 7. Execution order

1. **Group A** (5 operational commands) — independent, zero ripple. Do first to validate the move mechanics on low-risk files.
2. **Group B** (`foundation`, `sweep`) — verbatim moves; methodology skills untouched.
3. **Decoupling fix** (§6) on the 3 compose agents — independent of the architecture move, lands the B1-B3 reword.
4. **Group C** (`orchestrate` merge) — fold into `workspace-orchestration`, fix B4, delete command (removes B5).
5. **Group D** (`architecture`) — verbatim move to skill; the B1-B3 path references are already gone from step 3, so only the README cosmetic wording remains. Tight trigger description.
6. **Verification** (§8).

## 8. Verification checklist (re-runnable)

After each group and at the end, confirm consistency:

- [ ] `rg "commands/(architecture|orchestrate|foundation|sweep|kickoff|pickup|wrap-up|status|board-status)\.md" commands skills agents hooks README.md` → **zero** live hits (historical `docs/**` hits expected and ignored).
- [ ] Each migrated name still resolves as `/name` (skill is user-invocable).
- [ ] `rg "architecture\.md step|step 12" agents` → zero (decoupling applied).
- [ ] Every `subagent_type` name in `skills/architecture/SKILL.md` and `skills/workspace-orchestration/SKILL.md` matches an existing `agents/*.md` `name:` frontmatter.
- [ ] Every `Skill(skill: "agentboard:*")` activation names a skill that still exists under `skills/`.
- [ ] `architecture` skill `description` does not fire on architecture *discussion* (spot-check with the skill-creator trigger-eval, §9).

## 9. Open decisions for you

1. **orchestrate:** merge into `workspace-orchestration` (recommended — consolidation) vs. keep a thin `skills/orchestrate/SKILL.md`. *(Recommend merge.)*
2. **Trigger descriptions:** hand-write all nine, or run skill-creator's description-optimization on `architecture` + `orchestrate` (the two where auto-trigger control matters)? *(Recommend optimize those two; hand-write the rest.)*
3. **Whether to land §6 decoupling now or only as part of group D.** *(Recommend now — it's correct independently.)*

---

## 10. Progress (2026-06-03)

- **Done:** §6 decoupling applied in `compose-l1/l2/l3` (zero `commands/architecture.md` refs remain in `agents/`). Group A + B migrated to skills with trigger-quality descriptions: `board-status`, `status`, `kickoff`, `pickup`, `wrap-up`, `foundation`, `sweep`. `status` "command"→"skill" wording fixed.
- **Remaining:** Group C (`orchestrate` merge — blocked on the naming decision in §11) and Group D (`architecture` move) — both held until their descriptions are reviewed (they are the two auto-trigger-sensitive skills). `commands/` now contains only `architecture.md` and `orchestrate.md`.

## 11. Naming fork — `/orchestrate` (decide before Group C)

Merging `orchestrate` means deleting `commands/orchestrate.md`; the pipeline then lives only in the `workspace-orchestration` skill, so it is invoked as `/workspace-orchestration`, **not** `/orchestrate`.

- **Option 1 (recommended):** rename the skill `workspace-orchestration` → `orchestrate` so `/orchestrate` is preserved. Ripple: ~12–18 "workspace-orchestration skill" references (6 agent `description:` lines, `skills/agentboard/SKILL.md`, the architecture skill, `README.md`, this plan) update to "orchestrate skill" — a bounded cross-ref sweep like §6.
- **Option 2:** keep the name; invoke as `/workspace-orchestration`. Zero ripple, but loses the `/orchestrate` shorthand.

## 12. Findings surfaced during migration (deferred — NOT fixed in the move)

- **F-1 (pre-existing bug):** `skills/pickup/SKILL.md:19` calls `agentboard_start_server` ("If the server is not running, start it") — a stale local-server model. AgentBoard is cloud-hosted; no such tool exists and there is no server to start. Pickup's step 2 should mirror `status`/`kickoff` (auth bootstrap + health-check + cloud-unreachable message). Moved verbatim; flag for a correctness fix.
- **F-2 (detection contract):** the architecture/orchestrate halt protocol signals failure by **artifact absence + a free-text card note**, which cannot cleanly distinguish a genuine work halt from an agent that died before noting (auth/MCP/crash), and carries "what failed" only as prose. A typed halt artifact (`ARCH_HALT_V1 {round, class: work|infra|auth|tool, step, condition, evidence}`) plus a "no artifact AND no fresh halt signal = infra/crash → bounded retry" orchestrator rule would make it robust. Belongs in the correction-loop skill design.
- **F-3 (approval-stop tension — flagged, NOT changed):** the migrated `architecture` skill still contains user-confirmation/approval stops — spec confirmation (Step 3) and document approval (Step 16) — preserved verbatim by the behavior-preserving migration. These conflict with the principle that the workflow stops for a human ONLY at active board blocking gates or the 3-retry→investigate→spec-origin escalation. Whether the document approval is a legitimate gate (keep) or an ad-hoc stop (remove) is a deliberate behavioral decision, intentionally not made inside this structural migration. Decide separately.

---

## 13. Completion (2026-06-03)

All nine commands are now skills; `commands/` is empty. Final state:

- **Migrated (verbatim body + trigger description):** `board-status`, `status`, `kickoff`, `pickup`, `wrap-up`, `foundation`, `sweep`, `architecture`.
- **`orchestrate`:** skill `workspace-orchestration` renamed → `orchestrate` (dir + frontmatter `name`); user-facing description; `--auto` flag + ToolSearch/health-check preamble folded into its invocation paragraph; `commands/orchestrate.md` deleted. `/orchestrate` preserved.
- **Decoupling (caller-name removed):** all 12 agent descriptions; body refs in `architecture-research-agent` (force_remeasure) and `architecture-compose-l3` (card-creation note); the §6 compose halt-detection refs. `architecture-compose-l3:364` (`/orchestrate` next-step) and `architecture-design-reviewer` (rerun diagnostic) left as legitimate user/doc-facing text.
- **Reference fixes:** `agentboard` skill `workspace-orchestration`→`orchestrate` (×4) and `/x command`→`/x skill` (×2); `foundation` handoff wording; `architecture` skill `command argument`→`argument` (×3); `status` wording.
- **Verified:** zero `commands/*.md` path refs and zero `workspace-orchestration` refs in `skills/` or `agents/`; git tracked the moves as renames.
- **Trigger optimization — attempted, not achievable in this environment (evidence-backed):** skill-creator's `run_loop.py`/`run_eval.py` have two Windows bugs — `select.select()` on a subprocess pipe (`run_eval.py:108`; POSIX-only → `WinError 10038`) and `write_text()` without `encoding=` (cp1252 crash on `✗`/`→`). Both fixed in a private copy (`%TEMP%/ab-skill-evals/sc`; timeout-bounded read + `PYTHONUTF8=1`). With those fixed the eval ran but scored **0 triggers on every query** (degenerate). Root cause, confirmed by a raw `claude -p` capture: the detector returns `False` on the first non-`Skill`/`Read` tool, and in this session the model's first tool is always `ToolSearch` / `initialize_conversation_session` (the global CLAUDE.md CORE-memory protocol fires inside nested `claude -p`) / Bash exploration. So the score is an artifact, not a measurement. Re-running is also undesirable — each query spawns a full nested `claude -p` (CORE-memory init + git + fs exploration); one pass already spawned 36. **Decision:** `architecture`/`orchestrate` descriptions stand as the hand-written, explicitly-guarded versions; no fabricated pass rate. A valid measurement would need a `claude -p` without the global CLAUDE.md/MCP/CORE preamble. All eval scaffolding is in `%TEMP%`. Findings F-1/F-2/F-3 above remain.
