---
name: orchestrate
description: Run the workspace orchestration pipeline — planning, review, implementation, and audit waves with parallel subagents
---

# Orchestrate — Workspace Pipeline

Run parallel subagents through the workspace board pipeline. Requires cards in `backlog` (created via `/foundation`).

**Usage:** `/orchestrate` or `/orchestrate --auto`

## Instructions

1. **Load skills and tools:**
   - Invoke the `workspace-orchestration` skill to load the orchestration logic
   - Call `ToolSearch` for `agentboard`, `codegraph`, and `rag` tools
   - If only `agentboard_authenticate` and `agentboard_complete_authentication` are visible, run the OAuth bootstrap from `skills/agentboard/SKILL.md` §1.3 first. Then call `agentboard_health_check` to verify connectivity. If it fails post-auth, stop and report the error.

2. **Select the board:**
   - Call `agentboard_list_apps`, then `agentboard_list_boards` for the target app — use `response_format: markdown` (default; ~7× smaller than json for these list responses).
   - If multiple boards, ask the user which one
   - Call `agentboard_list_workspace_cards` (also markdown) to see current card distribution

3. **Read board settings:**
   - Fetch the board via the boards API (markdown) to read `auto_transitions`
   - Determine checkpoint behavior:
     - `review_blocking: true` → must pause after Wave 1
     - `audit_blocking: true` → must pause after Wave 3
     - `--auto` flag → skip pauses where blocking is OFF
   - Report the checkpoint plan to the user before starting

4. **Locate the spec document:**
   - Check `docs/specs/` for the most recent spec, or ask the user for the path
   - This gets passed to planning and review agents as `spec_path`

5. **Prime the codegraph (once for the whole run):**
   - Call `mcp__codegraph__codegraph_scan` on the project root.
   - The graph is in-memory in the codegraph MCP server and is shared across every subagent in this Claude Code session. Subagents have been instructed NOT to call `codegraph_scan` themselves; they go straight to `codegraph_get_dependencies`, `codegraph_get_dependents`, and `codegraph_get_change_impact` against the cached graph.
   - This eliminates ~2N redundant full-project scans per run (one per planning agent + one per audit agent).

6. **Run Wave 1: Planning**
   - Collect all cards in `backlog`
   - Spawn parallel subagents with `subagent_type: planning-agent`, passing `card_id`, `board_id`, `agent_id`, `spec_path`, `card_title` in the prompt
   - Wait for all agents to complete
   - Report results
   - **Checkpoint** if required (see checkpoint logic in skill)

7. **Run Wave 2: Review**
   - Collect all cards in `review`
   - Spawn parallel subagents with `subagent_type: review-agent`
   - Wait for all agents to complete
   - Handle rejections: re-run Wave 1 for rejected cards (max 2 retries)
   - Report results

8. **Run Wave 3: Implementation**
   - Collect all cards in `implementation`
   - Spawn parallel subagents with `subagent_type: implementation-agent`
   - Wait for all agents to complete
   - Run build verification, filtering output to drop noise so only errors/warnings land in context:
     - `npm run build 2>&1 | grep -E -i 'error|warning|fail|✘' || echo 'BUILD OK'`
     - `npm run lint --prefix client 2>&1 | grep -E -i 'error|warning|fail|✘' || echo 'LINT OK'`
   - If build fails: STOP, report, wait for user
   - Report results
   - **Checkpoint** if required

9. **Run Wave 4: Audit**
   - Collect all cards in `audit`
   - Spawn parallel subagents with `subagent_type: audit-agent`
   - Wait for all agents to complete
   - Report final results

10. **Final report:**
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
