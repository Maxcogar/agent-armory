# AgentBoard — Gemini CLI Extension

AgentBoard is a project management toolkit designed for autonomous agent orchestration. This extension provides the instructions, subagents, and skills needed to drive Gemini CLI sessions through AgentBoard's workflows.

## Core Mandates

### 1. OAuth Authentication Bootstrap (Lifecycle)
The AgentBoard MCP requires OAuth-style authentication before any tool other than the two auth tools is callable. On a fresh session — or any time tokens have expired — only `mcp_agentboard_agentboard_authenticate` and `mcp_agentboard_agentboard_complete_authentication` are visible.

**Bootstrap flow:**
1. Call `mcp_agentboard_agentboard_authenticate` (no parameters). It returns an authorization URL.
2. Share the URL with the user and ask them to open it in their browser and authorize.
3. The user authorizes; their browser is redirected to a `http://localhost:<port>/callback?code=...&state=...` URL.
4. Ask the user to copy the full URL from the browser's address bar.
5. Call `mcp_agentboard_agentboard_complete_authentication` with that URL. The remaining tools become available immediately.
6. **Security:** Treat the callback URL as a secret. Never log, echo, or store it. Discard it from memory immediately after use.
7. Call `mcp_agentboard_agentboard_health_check` to verify connectivity.

### 2. Submission Quality Gate
Before submitting any `plan`, `implementation_note`, `review_note`, or `audit_report` artifact via `mcp_agentboard_agentboard_submit_workspace_artifact`, you MUST verify:
- **No Incomplete Language:** Scans for red-flag patterns: "TODO", "TBD", "FIXME", "PLACEHOLDER", "need to investigate", "need to look", "needs further", "needs investigation", "needs more research", "open question", "not sure", "look into", "figure out", "to be determined", "requires further", "still need", "haven't determined", "unknown at this time", "more research needed", "awaiting clarification".
- **Absolute Specificity:** Every implementation step MUST reference specific files, functions, and line numbers. Vague steps like "update the component" will be rejected.
- **Tool Validation:** You have used `codegraph`, `codebase-rag`, `grep_search`, and `read_file` to validate ALL claims. The artifact must be immediately actionable by another agent without further research.

### 3. Agent Identification
Always use your model name (e.g., `"gemini-2.5-pro"`, `"gemini-2.0-flash"`) as the `agent_id` in all AgentBoard MCP calls.

---

## Commands & Workflows

### /kickoff
Onboard yourself to AgentBoard.
1. Authenticate if needed (see §1).
2. Call `mcp_agentboard_agentboard_health_check`.
3. List existing projects via `mcp_agentboard_agentboard_list_projects`.
4. Select a project or create a new one (collect: name, project type (new_feature/refactor/bug_fix/migration/integration), idea description, and target codebase path).
5. Claim the first task via `mcp_agentboard_agentboard_get_next_task`.
6. Show a summary of current state and next steps.

### /foundation
Build a spec and create workspace board cards.
1. Authenticate and health check.
2. Select or create an app (`mcp_agentboard_agentboard_create_app`) and board (`mcp_agentboard_agentboard_create_board`).
3. Brainstorm the work with the user (one question at a time). Use research tools as needed.
4. Write a spec document to `docs/specs/YYYY-MM-DD-<topic>.md` (summary, goals, constraints, chunks, out of scope).
5. Create workspace cards for each chunk via `mcp_agentboard_agentboard_create_workspace_card` in the `backlog` column.

### /orchestrate
Run the workspace orchestration pipeline (Planning → Review → Implementation → Audit). `/orchestrate` executes in the main agent context — Gemini's recursion protection prevents subagents from dispatching subagents, so the orchestration loop cannot be wrapped in a subagent.
1. Select the board and determine checkpoint behavior (`review_blocking`, `audit_blocking`).
2. Call `mcp_codegraph_codegraph_scan` ONCE to prime the graph for all subagents.
3. For each wave (1: Planning, 2: Review, 3: Implementation, 4: Audit), collect cards in the relevant column and dispatch the corresponding wave-agent subagent per card. To run them in parallel, issue all the subagent calls in a single turn.
4. After Wave 3, run build/lint verification:
   `npm run build 2>&1 | grep -E -i 'error|warning|fail|✘' || echo 'BUILD OK'`
   `npm run lint 2>&1 | grep -E -i 'error|warning|fail|✘' || echo 'LINT OK'`
5. Report final status and card transitions.

---

## Specialized Subagents

- **planning-agent**: Wave 1 worker. Researches codebase and produces a detailed markdown `plan` artifact. Read-only on source.
- **review-agent**: Wave 2 worker. Critically evaluates plans against engineering standards. Default bias is FAIL.
- **implementation-agent**: Wave 3 worker. Executes plans, writes code, adds tests, runs build/lint.
- **audit-agent**: Wave 4 worker. Read-only verification that implementation matches plan and respects constraints.
