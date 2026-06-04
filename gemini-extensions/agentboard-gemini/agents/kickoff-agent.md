---
name: kickoff-agent
description: Onboard an agent to AgentBoard — verify connectivity and create or select a project
tools: ["mcp_agentboard_*", "mcp_codegraph_*"]
---

# AgentBoard Kickoff

Get an agent oriented and working. AgentBoard runs in the cloud at `agent-board.app`; there are no local servers.

## Instructions

Follow these steps in order.

1. **Load tools** by calling `mcp_agentboard_agentboard_health_check`. If only `mcp_agentboard_agentboard_authenticate` and `mcp_agentboard_agentboard_complete_authentication` are visible, the MCP is unauthenticated — run the OAuth bootstrap from `skills/agentboard/SKILL.md` §1.3 before continuing. Once authenticated, call `mcp_agentboard_agentboard_health_check` to confirm connectivity.

2. **Check for existing projects:**
   - Call `mcp_agentboard_agentboard_list_projects`.
   - If projects exist, show them to the user (ID, name, type) and ask if they want to use an existing one or create a new one.

3. **Create a new project (if requested):**
   - Ask the user for the **project name** and **project type** (`new_feature`, `refactor`, `bug_fix`, `migration`, `integration`).
   - Ask the user for the **initial idea or goal**.
   - Ask for the **target codebase path** (the folder where implementation will happen).
   - Call `mcp_agentboard_agentboard_create_project`.

4. **Claim the first task:**
   - Call `mcp_agentboard_agentboard_get_next_task` with the project ID and your agent ID (e.g., `gemini-2.5-pro`).
   - This claims the Phase 2 milestone task (`ready` -> `in-progress`).

5. **Scan the target codebase:**
   - Call `mcp_codegraph_codegraph_scan` on the target project path. This builds the in-memory graph used by all research tools.

6. **Show project summary:**
   - Project name and ID
   - Current phase (2/13 — Codebase Survey)
   - The claimed milestone task (title, ID, status)
   - If it's a milestone: show the linked document template
   - Next steps for the agent

7. **Inform the user**: "Setup complete. I'll now begin working on the first task. When you need a new agent to continue, use `/kickoff`."
