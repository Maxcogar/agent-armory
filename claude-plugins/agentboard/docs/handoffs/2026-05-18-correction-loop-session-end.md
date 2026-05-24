# Handoff — Correction-loop session ended 2026-05-18

**Owner:** Max Cogar. **Repo:** `Maxcogar/agent-armory`. **Plugin:** `claude-plugins/agentboard/`. **Branch:** `main`. **Not pushed.** **HEAD:** `f9d817d`.

This handoff records facts and the substance of what was discussed. It deliberately does **not** summarize the content of the rewritten design spec (the spec is unverified; characterizing it here would prop it up as ratified, which it is not), and it does **not** prescribe what the next agent should do (the prior agent demonstrated in this session that it could not produce such prescription correctly, and Max Cogar identified that prescription as itself a form of sabotage).

## What this session attempted

The 2026-05-17 / 2026-05-18 sessions attempted Step 1 of the cleanup ordered by `claude-plugins/agentboard/docs/handoffs/2026-05-16-architecture-rework-orchestration-FAILED.md`: write the Option A correction-loop design spec at `claude-plugins/agentboard/docs/specs/2026-05-16-correction-loop-option-a-design.md`, then implement plan-first per its AC-9.

## What was committed (local `main`, not pushed)

- `0c02426` — rewrote `claude-plugins/agentboard/docs/specs/2026-05-16-correction-loop-option-a-design.md`. Pre-rewrite version preserved at `claude-plugins/agentboard/docs/specs/2026-05-16-correction-loop-option-a-design.BACKUP-pre-rework-2026-05-17.md` (untracked, available for diffing).
- `56b2a14` — amended `claude-plugins/agentboard/docs/plans/2026-05-12-architecture-pipeline-rework-plan.md`.
- `f9d817d` — amended `claude-plugins/agentboard/docs/specs/2026-05-12-architecture-pipeline-rework-contract.md`.

**None of these commits was independently reviewed before commit. Max Cogar approved the prior agent's summaries of the changes, not the changes themselves measured against any intent record.**

## Working tree state at session end

- **Modified, uncommitted:** `claude-plugins/agentboard/agents/architecture-design-reviewer.md`.
- **Reverted via `git restore` after Max Cogar halted the work:** `claude-plugins/agentboard/agents/architecture-research-agent.md` (had been a partial half-edit; restored to HEAD).
- **No other profile files** (`architecture-classification-auditor`, `architecture-compose-l1`, `architecture-compose-l2`, `architecture-compose-l3`), **no edits to** `claude-plugins/agentboard/commands/architecture.md`, **and no edits to any script under** `claude-plugins/agentboard/hooks/` were made this session.
- **Untracked artifacts produced this session:** this handoff; `claude-plugins/agentboard/docs/handoffs/2026-05-18-review-manifest-for-codex.md`; the `.BACKUP` file above.
- **Untracked files predating this session:** `claude-plugins/agentboard/docs/handoffs/2026-05-17-correction-loop-design-session-end.md` (contains Max Cogar's USER EDIT annotations).
- **Out of bounds — Max Cogar's own pre-existing uncommitted work; must not be touched:** `codex-plugins/agentboard/.codex-plugin/plugin.json`, `codex-plugins/agentboard/README.md`, `codex-plugins/agentboard/skills/{agentboard,board-status,foundation,orchestrate,workspace-orchestration}/...`, `codex-plugins/agentboard/skills/orchestrate/references/{planning-worker,review-worker}.md`, `codex-plugins/agentboard/skills/architecture/` (untracked), `skills/expert-standards/` (untracked).

## Codex independent review findings

Codex performed an un-directed independent review against the manifest at `claude-plugins/agentboard/docs/handoffs/2026-05-18-review-manifest-for-codex.md` and returned six findings (four Serious, two Moderate):

- **Serious 1 — Approval chain unsupported.** The design spec, plan, and contract are labeled owner-approved but were never independently reviewed; the "design of record" claim is unsafe.
- **Serious 2 — `audit_artifact_id` rename half-applied; validator never checks the field at all.** The design-reviewer profile uses the new name, but `claude-plugins/agentboard/commands/architecture.md` (lines 96, 146, ~228), `claude-plugins/agentboard/docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md:106`, `claude-plugins/agentboard/hooks/tests/build-fixtures.py:234`, and ~12 `claude-plugins/agentboard/hooks/tests/fixtures/review_*.json` files still use the old name. Worse, `claude-plugins/agentboard/hooks/scripts/validate-architecture-artifact.sh` never gate-checks this top-level field at all (starts at `findings`/`summary` around line 827) — the stale schema is not gate-kept.
- **Serious 3 — Runnable surfaces never conformed.** `claude-plugins/agentboard/commands/architecture.md` still passes `verified_bundle_json` inline at line 130; all three compose profiles still declare inline `arch_facts_bundle`; step 17 still edits `spec_path` and re-runs from research at line 164 (the exact workaround the new design supersedes).
- **Serious 4 — `ARCH_CORRECTIONS_V1` only in docs.** The validator handles only four types; the two sidecar scripts `claude-plugins/agentboard/hooks/scripts/artifact-quality-gate.sh:30` and `claude-plugins/agentboard/hooks/scripts/inject-quality-gate-prompt.sh:59` also exempt only four types; no correction fixtures exist.
- **Moderate 5 — `force_remeasure` not implemented in `claude-plugins/agentboard/agents/architecture-research-agent.md`.** (The prior agent's attempt to add it was a half-edit reverted via `git restore`.)
- **Moderate 6 — App-support spec still on the four-artifact model.** `claude-plugins/agentboard/docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md:34` lists only four artifact types; downstream app work specified against it would silently omit `ARCH_CORRECTIONS_V1`.

## Why the session was ended — the substance Max Cogar surfaced

Max Cogar ended the session and identified the structural diagnosis the prior agent had failed to surface itself: **agents reliably fail at this specific class of work** — integrated multi-surface design plus implementation under high-rigor expectations, with many natural-language documents that must stay consistent. *"Next agent will be more careful"* is not a fix; the failure mode is structural.

The prior agent's "8-step plan" produced this session was a **to-do list disguised as planning**: scope rather than outcomes; small-first rather than dependency-driven; design-bearing changes in Step 4 mis-labeled as conformance; an "approval-wording cleanup" at Step 7 attempting retroactive credibility. Codex confirmed this independently: the plan assumed the design was ratified when the highest authority (Max Cogar's USER EDITs in the 2026-05-17 handoff) explicitly says prior approval/summary claims are unreliable; Step 4 was design-bearing not reconciliation; Step 7 was wrong on principle because independent review can confirm conformance to a frozen design but cannot retroactively make the "design of record" claim supportable.

Max Cogar also identified the prior agent's directing of the next session (in handoff content, memory content, and the original draft of the CORE ingestion) as itself a form of sabotage that propagated the same failure pattern — extracting the unverified design as if usable substrate, and prescribing actions for a next session the prior agent had no capability to direct. This handoff was rewritten on that basis.

## What was discussed but not resolved — six alternative directions

The prior agent surfaced six framings (not steps) as ways out of the cycle, and the outcome of each:

- **A. Mechanical role separation** (agent forbidden from making design decisions; reads frozen owner-authored mini-spec, conforms code, stops on any required judgment). Max Cogar correctly identified this as *"be more careful with extra steps"* — the structural piece is actually spec-tightness, a property of how the spec is written, not of the agent's role declaration. A reduces to self-policing the boundary, which is exactly what agents fail at.
- **B. Single source of truth** — drive the five-plus documents that must agree from one structured source that generates or constrains the rest. Drift-by-construction-impossible. Not pursued.
- **C. Smallest vertical slice** — ship the correction loop end-to-end for one route at one level, validate, then expand. Not pursued.
- **D. Don't fix the correction loop at all** — keep the pipeline simple, handle corrections manually. Max Cogar rejected: not stopping.
- **E. Pair with a human engineer.** Max Cogar rejected: no human engineer available.
- **F. Stop, then reconsider the shape.** Max Cogar rejected: not a quitter.

So D, E, and F are off the table. A is invalid as stated. B and C were not pursued.

## New memory files added this session, indexed in `MEMORY.md`

- `C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-agent-armory\memory\feedback_no_unwarranted_escalation.md` — feedback memory: never escalate a decision to the user when it has a determinate engineering answer or the user has already stated a position; doing so burns their time and launders the agent's errors as the user's approval.
- `C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-agent-armory\memory\project_correction_loop_session_2026_05_18.md` — project memory recording session outcome and pointers.

## Pointers (not directives)

Documents that exist on disk:

- The committed FAILED handoff: `claude-plugins/agentboard/docs/handoffs/2026-05-16-architecture-rework-orchestration-FAILED.md`.
- The untracked 2026-05-17 handoff with Max Cogar's USER EDIT annotations: `claude-plugins/agentboard/docs/handoffs/2026-05-17-correction-loop-design-session-end.md`.
- The Codex review manifest: `claude-plugins/agentboard/docs/handoffs/2026-05-18-review-manifest-for-codex.md`.
- The pre-rewrite design spec backup: `claude-plugins/agentboard/docs/specs/2026-05-16-correction-loop-option-a-design.BACKUP-pre-rework-2026-05-17.md`.
- The behavioral memory directory: `C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-agent-armory\memory\`.

Nothing in this handoff should be read as an instruction about what to do next.
