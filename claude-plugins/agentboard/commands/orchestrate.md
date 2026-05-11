---
name: orchestrate
description: Run the workspace orchestration pipeline — planning, review, implementation, and audit waves with parallel subagents
---

# Orchestrate — Workspace Pipeline

Run parallel subagents through the workspace board pipeline. Requires cards in `backlog` (created via `/architecture`, which itself reads an approved spec from `/foundation`).

**Usage:** `/orchestrate` or `/orchestrate --auto`

## Instructions

1. **Load skills and tools:**
   - Invoke the `workspace-orchestration` skill to load the orchestration logic
   - Call `ToolSearch` for `agentboard`, `codegraph`, and `rag` tools
   - Call `agentboard_health_check` — start server if needed

2. **Select the board:**
   - Call `agentboard_list_apps`, then `agentboard_list_boards` for the target app
   - If multiple boards, ask the user which one
   - Call `agentboard_list_workspace_cards` to see current card distribution

3. **Read board settings:**
   - Fetch the board via the boards API to read `auto_transitions`
   - Determine checkpoint behavior:
     - `review_blocking: true` → must pause after Wave 1
     - `audit_blocking: true` → must pause after Wave 3
     - `--auto` flag → skip pauses where blocking is OFF
   - Report the checkpoint plan to the user before starting

4. **Locate the architecture document:**
   - Check `docs/arch/` for the architecture matching the cards on this board, or ask the user for the path
   - The full arch doc path is passed to review agents as `{{arch_path}}`
   - Each card's slice (the per-card section under `## Card Slices` in the arch doc) is extracted and passed to that card's planning agents as `{{arch_slice}}` — never the whole arch doc, never the spec

5. **Run Wave 1: Planning (two-phase per card)**

   Wave 1 uses a haiku research agent followed by an opus compose agent to avoid burning opus
   tokens on mechanical tool calls.

   For each card in `backlog`:

   **Phase A — Research (haiku, parallel across cards):**
   - Spawn one `planning-research-agent` per card with `card_id` and `arch_slice`
     (extract the per-card section under `## Card Slices` in the arch doc, including all eight §6.3 schema fields: Description, Allowed-touch list, Forbidden-touch list, Produces, Consumes, Verification scope, Depends on, Source decisions)
   - Each agent runs codegraph + RAG discovery and submits a `FACTS_BUNDLE_V1` artifact on the card
   - Wait for ALL Phase A agents to complete before starting Phase B

   **Phase B — Compose (opus, parallel across cards):**
   - For each card whose Phase A artifact succeeded, spawn one `plan-compose-agent`
   - Pass `card_id`, `arch_slice` (the same per-card slice extracted in step 4), and the facts bundle JSON inline in the prompt (read from the artifact)
   - Each agent writes the implementation plan artifact (`type: "plan"`) on the card and moves
     the card to `review`
   - If Phase A failed for a card (no facts bundle artifact), skip Phase B for that card and
     report the failure

   - Wait for all Phase B agents to complete
   - Report results per card: research OK/FAIL, plan OK/FAIL
   - **Checkpoint** if required (see checkpoint logic in skill)

6. **Run Wave 2: Review**
   - Collect all cards in `review`
   - Spawn parallel subagents using the `review-agent.md` prompt template
   - Wait for all agents to complete
   - Handle rejections: re-run Wave 1 for rejected cards (max 2 retries)
   - Report results

7. **Run Wave 3: Implementation**
   - Collect all cards in `implementation`
   - Spawn parallel subagents using the `implementation-agent.md` prompt template
   - Wait for all agents to complete
   - Run build verification: `npm run build` and `npm run lint --prefix client`
   - If build fails: STOP, report, wait for user
   - Report results
   - **Checkpoint** if required

8. **Run Wave 4: Audit (two-phase per card)**

   Wave 4 mirrors the Wave 1 split: haiku gathers diff/blast-radius facts, opus reasons about them.

   For each card in `audit`:

   **Phase A — Research (haiku, parallel across cards):**
   - Spawn one `audit-research-agent` per card with `card_id` and `repo_root`
   - Each agent gathers git diff, blast radius facts, and cross-references the plan artifact,
     then submits an `AUDIT_FACTS_BUNDLE_V1` artifact on the card
   - Wait for ALL Phase A agents to complete before starting Phase B

   **Phase B — Compose (opus, parallel across cards):**
   - For each card whose Phase A artifact succeeded, spawn one `audit-compose-agent`
   - Pass `card_id` and the audit facts bundle JSON inline in the prompt
   - Each agent writes an `audit_report` artifact and assigns a PASS / PASS WITH NOTES / FAIL verdict
   - If PASS or PASS WITH NOTES: move card to `finished`
   - If FAIL: move card back to `implementation` with notes on what must be fixed
   - If Phase A failed: report, leave card in `audit`

   - Wait for all Phase B agents to complete
   - Report final results per card: research OK/FAIL, audit verdict

9. **Final report:**
   ```
   ## Orchestration Complete

   **Board:** [name]
   **Cards:** [finished]/[total] finished

   | Card | Planning | Review | Implementation | Audit | Status |
   |------|----------|--------|----------------|-------|--------|
   | [title] | PASS | PASS | PASS | PASS | finished |

   **Build:** pass
   **Lint:** pass
   ```

## Flags

- `--auto` — Skip checkpoints where board blocking is OFF. If a blocking toggle is ON, the checkpoint is enforced regardless of this flag.

## Error Handling

- **Review rejection:** Card returns to planning, new agent retries with feedback. Max 2 retries, then escalate to user.
- **Build failure:** Pipeline stops. Report culprit files. User must intervene.
- **Audit failure:** Card stays in audit with report. User reviews findings.
- **Agent crash/timeout:** Report, skip card, continue with others.
