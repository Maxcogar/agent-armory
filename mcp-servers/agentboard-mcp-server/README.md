# AgentBoard MCP Server

MCP server that connects AI agents to [AgentBoard](http://localhost:3000) — a structured, multi-phase project management system for software development.

## Features

- **14 tools** covering projects, tasks, documents, and activity logs
- **7 resources** for URI-based data access (`agentboard://...`)
- **4 workflow prompts** for common agent tasks
- Full enforcement of AgentBoard's phase gate and task state machine rules

## Installation

```bash
npm install
npm run build
```

## Configuration

| Environment Variable | Default                  | Description                        |
|---------------------|--------------------------|------------------------------------|
| `AGENTBOARD_URL`    | `http://localhost:3000`  | Base URL of the AgentBoard server  |
| `AGENT_ID`          | `agentboard-mcp`         | Agent identifier for activity logs |

## Claude Code Setup (Windows)

Add to your `~/.claude/claude.json` MCP configuration:

```json
{
  "mcpServers": {
    "agentboard": {
      "command": "cmd",
      "args": ["/c", "node", "C:\\Users\\maxco\\OneDrive\\Documents\\GitHub\\Coding Tools\\Claude\\plugins\\agent-armory\\mcp-servers\\agentboard-mcp-server\\dist\\index.js"],
      "env": {
        "AGENTBOARD_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Tools

### Projects
| Tool | Description |
|------|-------------|
| `agentboard_list_projects` | List all projects |
| `agentboard_get_project` | Get a project by ID |
| `agentboard_create_project` | Create a new project |
| `agentboard_advance_project_phase` | Advance to the next phase (requires approved document for phases 2–9) |
| `agentboard_revert_project_phase` | Revert to the previous phase |

### Tasks
| Tool | Description |
|------|-------------|
| `agentboard_list_tasks` | List tasks with optional phase/status filter |
| `agentboard_get_next_task` | Get the highest-priority unblocked task |
| `agentboard_create_task` | Create a new task |
| `agentboard_update_task` | Update status, notes, assignee, etc. |

### Documents
| Tool | Description |
|------|-------------|
| `agentboard_list_documents` | List all phase documents |
| `agentboard_get_document` | Get a document with full content |
| `agentboard_update_document` | Update content or approve a document |

### Activity Log
| Tool | Description |
|------|-------------|
| `agentboard_get_activity_log` | Get project activity log |
| `agentboard_add_log_entry` | Add a manual log entry |

## Prompts

- `start_project` — Guide through project creation
- `work_next_task` — Fetch and begin the next available task
- `complete_task` — Add notes and transition a task to done
- `advance_phase` — Approve current document and advance phase

## Task State Machine

```
backlog → ready → in-progress* → review** → done
any → blocked → (previous status)
```
\* Requires: `assignee` + `acceptance_criteria` set  
\** Requires: at least one `note` added

## Phase Gate Logic

Phases 2–9 require their corresponding document to be `approved` before advancement:

| Phase | Document Required |
|-------|-------------------|
| 2 | codebase_survey |
| 3 | requirements |
| 4 | constraints |
| 5 | risk_assessment |
| 6 | architecture |
| 7 | contracts |
| 8 | test_strategy |
| 9 | task_breakdown |
