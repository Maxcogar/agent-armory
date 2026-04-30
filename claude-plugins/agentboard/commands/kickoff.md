---
name: kickoff
description: Onboard an agent to AgentBoard — verify connectivity and create or select a project
---

# AgentBoard Kickoff

Get an agent oriented and working. AgentBoard runs in the cloud at `agent-board.app`; the MCP server is hosted at `mcp.agent-board.app` and is always available.

## Instructions

Follow these steps in order. Do not skip any.

1. **Load the AgentBoard skill** — it provides the full workflow reference, tool documentation, and companion server setup. Also read the project's `CLAUDE.md` for codebase constraints.

2. **Authenticate if needed, then verify connectivity.** If only `agentboard_authenticate` and `agentboard_complete_authentication` are visible in the agentboard tool surface, run the OAuth bootstrap from `skills/agentboard/SKILL.md` §1.3 first. Then call `agentboard_health_check`.
   - If `health_check` fails post-auth, the cloud service is unreachable — show the error to the user and stop. Check network connectivity or service status at `agent-board.app`.

3. **List existing projects** by calling `agentboard_list_projects`:
   - If projects exist, show them and ask the user which one to work on
   - If no projects exist, ask the user if they'd like to create one. Collect: name, project type (new_feature/refactor/bug_fix/migration/integration), idea description, and optionally a target project path (this should be the path to the codebase the project is about, i.e. the current working directory)

4. **If creating a new project**, call `agentboard_create_project` with the user's input. Then show the created project and its first milestone.

5. **Claim the first task** by calling `agentboard_get_next_task` with the project ID and your agent ID.

6. **Show a summary** of the current state:
   - Project name and phase
   - Current task (title, type, status)
   - If it's a milestone: show the linked document template
   - Next steps for the agent

7. **Inform the user**: "Setup complete. I'll now begin working on the first task. When you need a new agent to continue, use `/kickoff`."
