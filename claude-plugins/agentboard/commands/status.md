---
name: status
description: Show current AgentBoard project state — phase, active tasks, blockers, and next action
---

# AgentBoard Status

Quick situational awareness. Read-only — no mutations.

## Instructions

1. **Check server health** by calling `agentboard_health_check`:
   - If the server is not running, tell the user: "AgentBoard server is not running. Use `/kickoff` to start it."
   - Stop here if unhealthy.

2. **List projects** by calling `agentboard_list_projects`:
   - If no projects exist, tell the user: "No projects found. Use `/kickoff` to create one."
   - Stop here if no projects.

3. **For each project** (or the active one if only one), call `agentboard_get_project` and `agentboard_list_tasks`.

4. **Display a status summary**:

   ```
   ## AgentBoard Status

   **Project**: [name]
   **Phase**: [N]/13 — [phase name]
   **Target**: [target_project_path or "not set"]

   ### Tasks
   | Status | Count | Details |
   |--------|-------|---------|
   | In Progress | N | [task titles] |
   | Blocked | N | [task titles + reason if in notes] |
   | Ready | N | [next claimable task title] |
   | Review | N | [awaiting human review] |
   | Done | N/total | |

   ### Next Action
   [What should happen next — e.g., "Claim next ready task with /pickup" or "Waiting for human to approve Phase 3 document"]
   ```

5. **Do not start any work.** This command is purely informational.
