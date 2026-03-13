---
name: pickup
description: Resume AgentBoard work — check server health, find active project, and claim next task
---

# AgentBoard Pickup

For agents joining an existing session or resuming after a break. Assumes initial setup has already been done.

## Instructions

Follow these steps in order.

1. **Load the AgentBoard skill** — it provides the full workflow reference and tool documentation. Also read the project's `CLAUDE.md` for codebase constraints and the state machine rules.

2. **Check server health** by calling `agentboard_health_check`:
   - If the server is not running, start it by calling `agentboard_start_server`
   - Then re-check health with `agentboard_health_check`

3. **List projects** by calling `agentboard_list_projects`.

4. **Identify the active project**:
   - If there is exactly one project, use it
   - If there are multiple, show them to the user and ask which to work on
   - If there are none, tell the user: "No projects found. Use `/kickoff` to create one."

5. **Get project details** by calling `agentboard_get_project` with the project ID. Note the current phase.

6. **Check for in-progress tasks** by calling `agentboard_list_tasks` filtered by `status=in-progress`:
   - If there's an in-progress task, this is your current work — show it and resume
   - If not, call `agentboard_get_next_task` to claim the next ready task

7. **If the task is a milestone**, also read the linked document by calling `agentboard_get_document`.

8. **Check the activity log** by calling `agentboard_get_activity_log` (last 10 entries) to understand recent work:
   - What the previous agent accomplished
   - Any rejection feedback or blockers

9. **Show a summary**:
   - Project: name, current phase (N/13)
   - Task: title, type (milestone/implementation), status
   - Recent activity: last 3-5 relevant entries
   - What needs to be done next

10. **Begin working** on the claimed task immediately.
