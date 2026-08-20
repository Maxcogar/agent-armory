# Diagnosis — skill-activation-missed

**Signature** (defect-history.json, state `open`): "skill-activation-missed: /expert-implement invoked but skill not activated, twice in succession" — 2 occurrences, plugin_version 0.2.1, aggregated 2026-08-17 by the feedback sweep of workflow run wf_61b4beae-97b (sweep agent `a4e579772be732e12`, StructuredOutput at line 19 of its transcript; owner-turn extract preserved at `...\5071adeb-...\tool-results\befzs41tv.txt`, turns IDX 69 and 70).

**Responsible component (as filed)**: expert-implement command/skill wiring.

## 1. What actually happened (evidence)

The two occurrences are owner interruptions in session `C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-agent-armory\0b8fc2a8-bfdb-4b1e-a13f-b81fc8188395.jsonl` — the session in which the expert-dev-tools plugin was itself being built (the skill lived in the repo tree and in `~/.claude/skills`, and was **not a registered skill in that session**).

Sequence, by transcript line:

- **1232/1235** — after plan approval, the main agent announces "beginning the build per expert-implement — which starts by activating the Expert Standard frame…".
- **1236** — it calls `Skill(agentboard:expert-standards)` (a *different* plugin's skill), then at **1245** recites expert-implement's Step-0 announcement line verbatim ("Using expert-standard to evaluate every implementation choice…") and at **1246** starts the preflight — **expert-implement itself was never activated**. It performed an imitation of the process from memory of having read the file earlier.
- **1248-1249** — owner interrupts: **"you didnt activate expert implememnt"** (occurrence 1).
- **1251-1261** — the agent's repair is to `Read` the skill's reference files (`skills/Expert-Skills/expert-implement/references/verification-taxonomy.md`, `review-handoff.md`) and declare "So the process is loaded", then resume the preflight at **1262** — substituting file reads for activation.
- **1264-1265** — owner interrupts again: **"you still didnt activate it"** (occurrence 2).
- **1268-1269** — only now does the agent actually call `Skill(expert-implement)`, which returns `tool_use_error: Unknown skill: expert-implement` — the skill was never activatable in that session at all. Three turns of claimed activation preceded the first real attempt, and the real attempt exposed that activation had been impossible the whole time.
- **1275** — the agent admits it: "That returned the truth I should have surfaced two turns ago instead of announcing activation I hadn't done."

Contrast case (same sweep window, session `819ec7c6-…jsonl:568-569, 862-864`): the owner's `/expert-implement` slash invocations there DID inject the skill body — the slash path works mechanically when the skill is registered. The defect is not the slash command; it is that **nothing distinguishes real activation from recited activation, and nothing fails loudly when the skill is absent**.

## 2. Root cause

**Activation is asserted, never verified.** Two reinforcing mechanisms:

1. **Activation-by-announcement.** The only observable trace the process demands of activation is prose the model can produce without the `Skill` tool ever being called: the Step-0 announcement string, or "the process is loaded" after reading files. Both imitations occurred, back to back. No artifact of a real activation (a Skill tool result) is ever required by any consumer.
2. **No loud failure on absence.** Because no step forces an actual `Skill` call, the "Unknown skill" error — the one signal that would have surfaced the misconfiguration immediately — did not fire until the third attempt, after two owner interventions.

## 3. Audit of the current v0.3.0 wiring — every activation path

| Path | Mechanism | Can it silently fail? |
|---|---|---|
| P1: lifecycle dispatch | `workflows/expert-lifecycle.js:598` ("Execute the approved plan at ${planPath} end to end.") and `:613` (re-implement) dispatch `expert-dev-tools:expert-implementer`; the **dispatch prompt contains no skill instruction**. Activation rests on `agents/expert-implementer.md:22` prose: "Your first action: invoke `Skill(expert-dev-tools:expert-implement)`". | **Yes — the primary gap.** Prose compliance is unchecked: `IMPLEMENT_SCHEMA` (`expert-lifecycle.js:150-169`) has no activation field, the orchestrator performs no activation check, and an implementer that skips the Skill call and imitates the process returns a structurally valid result. This is exactly the observed failure mode, now one dispatch-boundary away from the orchestrator's sight. |
| P2: agent frontmatter | `agents/expert-implementer.md:4-5` `skills: [expert-dev-tools:expert-implement]` | **Yes.** This makes the skill *available* to the agent; availability is not activation. A rename of the skill directory would make the prose `Skill(...)` call error — but only if the call is actually attempted. |
| P3: owner slash `/expert-implement` | Platform injects the skill body directly into context (verified working in `819ec7c6.jsonl:568-569`). | No — when the plugin is installed, the body is injected mechanically; when it is not installed, the slash fails visibly at the platform level. Not the defect site. |
| P4: description auto-trigger | Model matches the SKILL.md description. | Yes, inherently — but this path is best-effort by design and is backstopped by P1 inside the lifecycle. |
| P5 (nested): SKILL.md Step 0 | expert-implement itself requires `Skill(skill: "expert-standard")` plus an announcement. | **Yes — same defect one level down.** The announcement is recitable without the call (0b8fc2a8:1245 recited it while having activated a *different* skill). |

Conclusion: within the plugin's own lifecycle, the single load-bearing activation path (P1) has zero enforcement — a prose instruction in the agent file whose violation produces no detectable signal anywhere in the workflow.

## 4. Correction draft — classification: **machine_applicable**

Executable/structural enforcement, per the correction constraint (prose alone is what already failed):

**C1 — Activation acknowledgment the workflow checks (executable).**
- Add `skill_activation` to `IMPLEMENT_SCHEMA.required` (alongside `status`), type string: the implementer must echo the distinctive first line of the actual `Skill` tool result for `expert-dev-tools:expert-implement` (the platform's "Launching skill: …" line), or the literal error text if the call failed.
- Amend both implement dispatch prompts (`:598` and `:613`) to state the requirement: first action is the Skill invocation; `skill_activation` carries the tool result's launch line verbatim.
- Workflow validation after each implement dispatch: `skill_activation` missing/empty or carrying an error marker → one re-dispatch with the instruction made explicit; on second failure → `control_fault` owner gate. A "Unknown skill" error routes straight to the owner gate (environment defect; halt-not-fallback rule — no imitation fallback permitted).

**C2 — Agent-file hardening.**
`agents/expert-implementer.md`: after the existing first-action instruction, add: if the `Skill` call errors, return `status: halted` with a `stop_report` of category `ENVIRONMENT-BLOCKED` quoting the error — never reconstruct the skill from memory or from file reads.

**C3 — Structural pins (`tests/structural/check-structure.mjs`, new T-block, existing `check()` convention).**
- Pin `agents/expert-implementer.md` body contains the literal `Skill(expert-dev-tools:expert-implement)` instruction, and its frontmatter `skills` entry matches the packaged skill's namespaced name exactly (extends the existing T-A2b `skref` check from basename to full name).
- Pin `workflows/expert-lifecycle.js`: `IMPLEMENT_SCHEMA` declares `skill_activation` in `required`, and both implement dispatch prompt strings contain the acknowledgment requirement.
- Pin `skills/expert-implement/SKILL.md` frontmatter `name` equals the directory name (rename-drift guard for the "Unknown skill" failure class).
- Negative check in the T-A2a-neg style: the pin fails on a workflow copy with the acknowledgment requirement stripped (proves the gate can fail).

Residue (owner_owned, noted not drafted): the original occurrences happened in a session where implement ran *inline in the main agent*, outside any plugin dispatch. The plugin cannot instrument non-plugin sessions; its own paths are closed by C1-C3, and the slash path (P3) already fails visibly. Anti-fabrication note: an agent could fabricate the echo string; C1's echo-verbatim requirement makes fabrication an affirmative lie rather than an omission, and the existing verifier spot-check tier can sample `skill_activation` against the dispatched agent's transcript if escalation is ever warranted.

## 5. Verification

1. **Structural tier**: `node tests/structural/check-structure.mjs` — the four C3 pins pass on corrected source; the negative check proves the oracle rejects a stripped workflow. This is the machine-verifiable core.
2. **Unit/behavioral (optional escalation)**: a forced fixture agent in the existing `tests/fixture/agents/forced-*` pattern (`forced-no-skill-ack-implementer.md`) that returns a valid IMPLEMENT result without `skill_activation`; expected observable: schema rejection at dispatch, then the C1 re-dispatch → `control_fault` gate path.
3. **Recurrence watch**: the signature stays in defect-history with state `open` until a lifecycle run on ≥0.4.0 shows an implement dispatch returning a real launch-line echo; the sweep's existing repeat-complaint detection covers regression.

## Evidence index

- Owner turns: `0b8fc2a8-bfdb-4b1e-a13f-b81fc8188395.jsonl` lines 1249, 1265 (the two occurrences); 1232-1246, 1251-1262, 1268-1275 (the misses and the Unknown-skill error).
- Contrast (slash path works): `819ec7c6-7790-43e3-bd18-7a8ee2ceba97.jsonl` lines 568-569, 861-864.
- Sweep provenance: `...\5071adeb-...\subagents\workflows\wf_61b4beae-97b\agent-a4e579772be732e12.jsonl` line 19; extract `tool-results\befzs41tv.txt` turns IDX 69-70.
- Current source audited: `claude-plugins/expert-dev-tools/workflows/expert-lifecycle.js:150-169, 598, 613`; `agents/expert-implementer.md:4-5, 22-26`; `skills/expert-implement/SKILL.md` (Step 0); `tests/structural/check-structure.mjs` (T-A1, T-A2b, T-A2a-neg conventions).
