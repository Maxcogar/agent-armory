---
name: kickoff
description: First-time AgentBoard setup — start servers via MCP, and create or select a project
---

# AgentBoard Kickoff

Set up everything from scratch so an agent can start working. All server management is handled through MCP tools — you do NOT need to know where AgentBoard is installed.

## Instructions

Follow these steps in order. Do not skip any.

1. **Load the AgentBoard skill** — it provides the full workflow reference, tool documentation, and companion server setup. Also read the project's `CLAUDE.md` for codebase constraints.

2. **Start the AgentBoard server** by calling the `agentboard_start_server` MCP tool:
   - It auto-detects the AgentBoard project directory (via `AGENTBOARD_PROJECT_DIR` or the MCP server's location)
   - It checks if the server is already running and won't restart a healthy server
   - If it returns `"status": "started"` or `"status": "already_running"`, proceed
   - If it returns an error, show the error to the user and stop

3. **Verify connectivity** by calling the `agentboard_health_check` MCP tool.
   - Confirm you get a healthy response before proceeding

4. **List existing projects** by calling `agentboard_list_projects`:
   - If projects exist, show them and ask the user which one to work on
   - If no projects exist, ask the user if they'd like to create one. Collect: name, project type (new_feature/refactor/bug_fix/migration/integration), idea description, and optionally a target project path (this should be the path to the codebase the project is about, i.e. the current working directory)

5. **If creating a new project**, call `agentboard_create_project` with the user's input. Then show the created project and its first milestone.

6. **Claim the first task** by calling `agentboard_get_next_task` with the project ID and your agent ID.

7. **Show a summary** of the current state:
   - Project name and phase
   - Current task (title, type, status)
   - If it's a milestone: show the linked document template
   - Next steps for the agent

8. **Inform the user**: "Setup complete. I'll now begin working on the first task. When you need a new agent to continue, use `/kickoff`."
