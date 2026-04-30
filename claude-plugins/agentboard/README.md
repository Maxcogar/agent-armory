# AgentBoard — Claude Code plugin

AgentBoard is a project management system for AI coding sessions. The service runs in the cloud at `https://agent-board.app`, exposes an MCP server at `https://mcp.agent-board.app/mcp`, and this plugin is the Claude Code side of it: slash commands, skills, and hooks that drive Claude Code sessions through AgentBoard's workflows. The plugin also bundles two companion MCP servers — `codegraph` and `codebase-rag` — that the workflows rely on.

This README is for human operators installing and using the plugin. For the agent-facing tool reference and workflow internals, see `skills/agentboard/SKILL.md`.

---

## Table of contents

1. [What is AgentBoard?](#what-is-agentboard)
2. [Installing the plugin](#installing-the-plugin)
3. [First-run authentication](#first-run-authentication)
4. [The two workflows — which one to use](#the-two-workflows--which-one-to-use)
5. [Commands](#commands)
6. [Companion MCP servers](#companion-mcp-servers)
7. [Hooks](#hooks)
8. [Troubleshooting](#troubleshooting)

---

## What is AgentBoard?

AgentBoard is a cloud-hosted project tracker designed for AI agents. It models work in two ways:

- **Phase-based projects**, with a fixed 13-phase document workflow (codebase survey, requirements, constraints, risk, architecture, contracts, test strategy, task breakdown, then implementation/verification/review/complete) and a strict task state machine.
- **Workspace boards**, which are kanban-style boards (apps → boards → cards → artifacts) with columns `backlog → planning → review → implementation → audit → finished`, designed for ad-hoc work and parallel agent orchestration.

The cloud service handles all storage and state. There is no local AgentBoard server, no database to run, and no Node.js or Python dependencies for AgentBoard itself. The Claude Code plugin connects to the hosted MCP at `mcp.agent-board.app/mcp` over HTTP.

The agentboard MCP exposes around 32 tools across two surfaces: a **core surface** (19 tools — authentication and connectivity, projects, tasks, documents, activity log) and a **workspace surface** (13 tools — apps, boards, cards, artifacts). You don't need to memorize them — the slash commands drive them. The exact count may differ slightly from the live cloud MCP; ask Claude to call `tools/list` if you want a precise inventory.

---

## Installing the plugin

Installing AgentBoard end-to-end means three things: getting the plugin files, installing the two bundled companion MCP servers, and pointing Claude Code at all of it.

### Prerequisites

| Tool | Why | Where it's needed |
|---|---|---|
| **Claude Code** | The host that runs the plugin | Always |
| **Git** | To clone the source repo | One-time, for fetching the plugin |
| **Python 3.10+** with `pip` | To run the `codebase-rag` MCP server | Required if you want semantic search (recommended — phase docs depend on it) |
| **Node.js ≥ 18.0** with `npm` | To build and run the `codegraph` MCP server | Required if you want dependency-graph analysis (recommended — same reason) |

If you skip Python or Node, you can still use the agentboard MCP itself (it's pure HTTP), but the phase-based workflow loses the codebase research tools it leans on for the survey, constraints, architecture, and task-breakdown phases.

### 1. Get the plugin

The agentboard plugin currently lives inside the `agent-armory` repo. Clone the repo somewhere on your machine:

```bash
git clone https://github.com/Maxcogar/agent-armory.git
cd agent-armory
```

After cloning, the plugin itself is at `claude-plugins/agentboard/` and the two companion MCP servers are at `mcp-servers/codebase-rag/` and `mcp-servers/codegraph-mcp/`.

> **Note:** The plugin isn't currently registered in `claude-plugins/.claude-plugin/marketplace.json`, so the standard `/plugin marketplace install` path doesn't work for it yet. For now, install it manually by following the steps below.

### 2. Install the companion MCP servers

These are stdio-based servers that run on your machine. Both have their own READMEs with full install instructions; the steps below are the minimum needed to wire them into AgentBoard.

**`codebase-rag`** — Python:

```bash
cd mcp-servers/codebase-rag/mcp-server-python
pip install -r requirements.txt
```

Note the absolute path of `server.py`; you'll reference it in `.mcp.json` below. See `mcp-servers/codebase-rag/README.md` for power-user environment overrides (`RAG_PROJECT_ROOT`, `RAG_LOG_LEVEL`, etc.).

**`codegraph`** — Node:

```bash
cd mcp-servers/codegraph-mcp
npm install
npm run build
```

Note the absolute path of `dist/index.js`; you'll reference it in `.mcp.json` below. See `mcp-servers/codegraph-mcp/README.md` for the language matrix and supported file types.

### 3. Configure Claude Code

The plugin's MCP wiring lives in two files at the **root of the project where you'll be using AgentBoard** (not the plugin repo — your actual working project). If those files don't exist there yet, create them.

**`.mcp.json`** declares the three MCP servers:

```json
{
  "mcpServers": {
    "agentboard": {
      "type": "http",
      "url": "https://mcp.agent-board.app/mcp"
    },
    "codegraph": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/absolute/path/to/agent-armory/mcp-servers/codegraph-mcp/dist/index.js"
      ]
    },
    "codebase-rag": {
      "command": "python",
      "args": [
        "/absolute/path/to/agent-armory/mcp-servers/codebase-rag/mcp-server-python/server.py"
      ]
    }
  }
}
```

**On Windows**, the `codegraph` entry needs a `cmd /c` wrapper because `node` isn't directly invokable through Claude Code's MCP transport on Windows:

```json
"codegraph": {
  "type": "stdio",
  "command": "cmd",
  "args": [
    "/c",
    "node",
    "C:\\path\\to\\agent-armory\\mcp-servers\\codegraph-mcp\\dist\\index.js"
  ],
  "env": {}
}
```

Replace `/absolute/path/to/...` (or `C:\path\to\...`) with the actual paths from step 2.

**`.claude/settings.local.json`** in the same project enables the three servers:

```json
{
  "enabledMcpjsonServers": ["agentboard", "codebase-rag", "codegraph"]
}
```

If you skipped Python or Node, omit those entries from both files — the agentboard MCP works on its own, you'll just lose the companion tooling.

### 4. Install the plugin in Claude Code

Inside Claude Code, install the plugin directly from your clone:

```
/plugin install /absolute/path/to/agent-armory/claude-plugins/agentboard
```

This installs the plugin from a local directory and activates it immediately — commands, skills, and hooks become available with no separate enable step.

**Alternative — install via the local marketplace.** The repo also ships a marketplace at `claude-plugins/.claude-plugin/marketplace.json`. If you want to manage the plugin through the marketplace mechanism instead of installing it directly:

1. Add `agentboard` to the `plugins` array in `claude-plugins/.claude-plugin/marketplace.json` (it's not listed there yet — only `gcp-iot` is). Use this entry shape:

   ```json
   {
     "name": "agentboard",
     "source": "./agentboard",
     "description": "AgentBoard project management toolkit",
     "version": "0.1.0",
     "author": { "name": "Maxcogar" }
   }
   ```

2. Inside Claude Code, register the marketplace and install:

   ```
   /plugin marketplace add /absolute/path/to/agent-armory/claude-plugins
   /plugin install agentboard@claude-armory
   ```

If you change the plugin's commands/skills/hooks during a session, run `/reload-plugins` to pick up the changes without restarting Claude Code.

### 5. First session

Open Claude Code in the project where you put `.mcp.json`. The `SessionStart` hook will detect that the agentboard MCP is unauthenticated, walk you through the OAuth bootstrap (see [First-run authentication](#first-run-authentication) below), and then call `agentboard_health_check`. Once that succeeds, all 32 tools become available and you can run any of the slash commands.

---

## First-run authentication

The agentboard MCP requires OAuth-style authentication. On a fresh session — or any session where your tokens have expired — only two tools are visible from the agentboard surface:

- `agentboard_authenticate`
- `agentboard_complete_authentication`

Everything else (health check, projects, tasks, documents, workspace tools) appears only after the OAuth bootstrap finishes.

The plugin includes a `SessionStart` hook that runs the bootstrap automatically. In practice that means at the start of a session Claude will:

1. Call `agentboard_authenticate`. The MCP returns an authorization URL.
2. Ask you to open the URL in your browser and authorize.
3. After you authorize, your browser is redirected to a `http://localhost:<port>/callback?code=...&state=...` URL. On remote sessions the page itself may not load — that's fine. The full URL in the browser's address bar is what matters.
4. Ask you to copy the full URL from the browser's address bar and paste it back to Claude.
5. Call `agentboard_complete_authentication` with that URL. The remaining 29 tools become available immediately.

**Treat the callback URL as a secret.** It contains a short-lived authorization code that converts to an access token. Hand it to Claude only as the value Claude is asking for; don't paste it into chat for any other purpose, don't put it in a card note, an artifact, a commit message, or a file. The skill and the SessionStart hook both instruct the agent never to log or echo the URL — but the URL still passes through your terminal once when you paste it, so close that paste out of view if you're sharing your screen.

Once authenticated, the session calls `agentboard_health_check` to confirm the cloud service is reachable. If that fails *after* authentication, the cloud service itself is having a problem — check `agent-board.app` for status.

---

## The two workflows — which one to use

The plugin supports two workflows. Pick based on the shape of the work, not preference.

| | Phase-based projects | Workspace boards |
|---|---|---|
| **Best for** | A new project or a substantial change with real architectural risk — anything you want documented before code is written | Ad-hoc work, refactors, cleanup sweeps, anything that's a list of independent tasks |
| **Structure** | Fixed 13 phases with required documents (codebase survey, requirements, constraints, risk, architecture, contracts, test strategy, task breakdown, then implementation phases) | Apps → boards → cards. Each card moves through `backlog → planning → review → implementation → audit → finished` |
| **State enforcement** | Strict task state machine. Documents are reviewed and approved by a human before the project advances | Column transitions, plus optional checkpoints at review and audit |
| **Human role** | Approves or rejects each phase document. Advances doc phases (2–9). Agents only call `advance_phase` during implementation phases (10–12) | Optional. Boards have `auto_transitions` toggles for `review_blocking` and `audit_blocking` — when a toggle is on, the orchestration pipeline pauses for human input at that wave |
| **Parallelism** | Single agent at a time, working sequentially through tasks | One agent per card per wave, in parallel, via `/orchestrate` |
| **Commands** | `/kickoff`, `/pickup`, `/wrap-up`, `/status` | `/foundation`, `/sweep`, `/orchestrate`, `/board-status` |

You can use both in the same AgentBoard account — they're independent. A phase-based project for a major build, a workspace board for the cleanup tickets that come out of it.

---

## Commands

All commands assume the agentboard MCP is authenticated. If not, they'll run the bootstrap first.

### Phase-based project commands

#### `/kickoff`

Onboard a fresh agent to AgentBoard. Loads the agentboard skill, authenticates if needed, calls `agentboard_health_check`, lists existing projects, and either picks one or creates a new one (asking you for name, project type, idea, and target codebase path). Then claims the first task with `agentboard_get_next_task` and shows you what the agent will work on. Use this when you're starting a project from scratch or want a clean handoff to a brand new session.

#### `/pickup`

Resume work in an existing project. Authenticates, finds the active project, checks for an in-progress task, and if there isn't one calls `agentboard_get_next_task`. Reads the linked phase document (for milestone tasks) and pulls the last 10 entries from the activity log so the agent has context on what the previous agent did. Use this at the start of every continuation session.

#### `/wrap-up`

End a session cleanly. For each in-progress task, the agent adds a progress note (what was done, what remains, blockers, files touched) via `agentboard_update_task`. If a task is actually complete, it transitions properly — implementation tasks to `review`, milestone documents via `agentboard_submit_document`. Adds a session-summary entry to the activity log. Shows you a handoff summary. Run this before you close the session so the next agent has somewhere to start.

#### `/status`

Read-only situational awareness for a phase project. Shows the current phase (N/13), task counts by status, blocked items with reasons, and what needs to happen next. Doesn't mutate anything. Useful when you want to know where the project sits without resuming work.

### Workspace board commands

#### `/foundation`

Interactive spec-building session. Asks you what you want to build, asks clarifying questions one at a time, optionally researches the codebase with codegraph and RAG, then writes a spec to `docs/specs/YYYY-MM-DD-<topic>.md`. After you approve the spec, it creates one workspace card per major chunk of work in `backlog` on a board you select (or creates a new app and board if needed). Commits the spec to git on the current branch. Plan to spend a full session on this — the command is explicit that you should not try to orchestrate in the same session.

#### `/sweep`

Systematic codebase quality discovery. Uses the `codebase-sweep` skill: scans with codegraph, initializes RAG, reads every source file in a deliberate order (entry points, then most-coupled files, then outward by directory), and writes findings to `docs/sweep/YYYY-MM-DD-findings.md` as it goes. After the sweep is complete, it triages findings into related groups, sets priorities and dependencies, and creates one workspace card per group. Read-only with respect to the target codebase — no code changes. After the sweep, the board is ready for `/orchestrate` to begin fixing.

#### `/orchestrate`

Run the four-wave pipeline against a workspace board: planning → review → implementation → audit. For each wave, `/orchestrate` collects cards in the wave's input column, spawns one parallel subagent per card using a prompt template from the `workspace-orchestration` skill, waits for all agents to finish, and reports results. Between waves, it consults the board's `auto_transitions` setting (`review_blocking`, `audit_blocking`) to decide whether to pause for your confirmation. The `--auto` flag skips pauses where blocking is OFF — but if a blocking toggle is ON, the checkpoint is enforced regardless. Review rejections send a card back to planning with feedback (max 2 retries per card). See [Troubleshooting](#troubleshooting) below for one important caveat about Wave 3's build-verification step.

#### `/board-status`

Read-only progress snapshot of a workspace board. Counts cards per column, shows progress (`finished`/`total`), shows the board's blocking settings, lists cards needing attention, and gives a brief recent-activity slice. Useful to check on a long-running orchestration without resuming it.

---

## Companion MCP servers

Two MCP servers ship configured alongside agentboard. They are not optional extras — the AgentBoard workflows use them to gather the data needed to fill phase documents and build implementation plans, instead of guessing.

### codegraph — dependency analysis

A static dependency graph of your codebase. After `codegraph_scan`, you can ask:

- What does file X import? (`codegraph_get_dependencies`)
- What imports file X — what would break if I changed it? (`codegraph_get_dependents`)
- What's the blast radius of changing these files? (`codegraph_get_change_impact`)
- Where are the most-connected and most-depended-on files? (`codegraph_get_stats`)
- What are the entry points? (`codegraph_find_entry_points`)

Codegraph rebuilds in memory each session, so the AgentBoard workflows call `codegraph_scan` at the start of every session that needs it. The phase-based workflow uses it heavily in Phase 2 (Codebase Survey), Phase 5 (Risk Assessment), Phase 6 (Architecture), Phase 9 (Task Breakdown), and during implementation.

### codebase-rag — semantic search

A retrieval index over your codebase, used to discover existing architectural patterns and constraints rather than inventing new ones. The server exposes two tools:

- **`rag_search(query, num_results=5, source_type="all")`** — semantic search across constraints, patterns, and code. The `source_type` filter is `"all"` (default), `"docs"` (constraints + patterns), `"code"` (source only), or `"constraints"` (rules only).
- **`rag_query_impact(file_path, num_similar=5)`** — show what depends on a file before you change it: exports, importers, and semantically similar files that may need coordinated edits.

The MCP server auto-detects the project root (looking for `.git`, `package.json`, `pyproject.toml`, `Cargo.toml`, or `go.mod`), builds the index in a per-machine cache directory on first run, and watches the filesystem to keep the index current. **No setup, init, or status calls are needed** — just call the search tools directly. The first call in a never-indexed project may return `status: "indexing"` for a few seconds while the initial index builds; retry after a moment.

The phase-based workflow leans on RAG most heavily in Phase 4 (Constraints) — to discover constraints already implicit in the codebase — and during implementation, before and after writing code.

Both servers are configured in `.mcp.json` and enabled in `.claude/settings.local.json`. As noted in [Installing the plugin](#installing-the-plugin), the paths in the shipped `.mcp.json` are local Windows paths that you'll need to adjust for your system.

---

## Hooks

The plugin defines three hooks. You don't need to interact with them directly, but knowing they exist helps when something looks unexpected.

- **`SessionStart`** runs the agentboard auth bootstrap and calls `agentboard_health_check`. This is what makes auth happen automatically when you open a session.
- **`PreToolUse` on `agentboard_submit_workspace_artifact`** is a submission quality gate. Before an artifact is submitted, the gate checks the content for TODO/TBD/FIXME/placeholder text, "need to investigate" language, missing file/line references, and similar tells of unfinished work. If any check fails, submission is blocked until the agent fixes the gaps. This runs both as an in-prompt check and a shell script (`hooks/scripts/artifact-quality-gate.sh`).
- **`PostToolUse` on workspace card tools** (`get_next_card`, `get_card`, `update_workspace_card`) runs `hooks/scripts/workspace-card-guidance.sh` to nudge agents toward the right next move on a card.

The codebase-rag MCP server keeps its index current automatically via a built-in filesystem watcher, so no Stop-hook reindex is needed.

---

## Troubleshooting

**The session keeps re-prompting me to authenticate.** Tokens have expired or were revoked. Just walk through the bootstrap again — open the URL Claude shares, authorize, and paste the full callback URL back. The auth state is per-session-per-machine; long gaps between sessions will require re-auth.

**"AgentBoard cloud service is unreachable."** This message comes from the `SessionStart` hook (and the `/status` and `/kickoff` commands) when `agentboard_health_check` fails *after* authentication. The cloud service itself is unreachable. Check your network connection, then check service status at `agent-board.app`. Nothing in the plugin can fix a cloud outage.

**Tools other than the two auth tools aren't visible.** The MCP exposes only `agentboard_authenticate` and `agentboard_complete_authentication` until OAuth completes. If you see only those two, the bootstrap hasn't run successfully yet. Re-run `/kickoff` or `/pickup` and let the SessionStart hook walk you through auth.

**`codegraph` or `codebase-rag` tools fail to load.** Check the paths in `.mcp.json` (see [Installing the plugin](#installing-the-plugin)) — the shipped values are local Windows paths that will not exist on your machine. Either edit the paths to match your install of those servers or remove the entries and disable them in `enabledMcpjsonServers`.

**`/orchestrate` Wave 3 fails on a build step.** The orchestration pipeline currently runs a hardcoded `npm run build` and `npm run lint --prefix client` after Wave 3 (Implementation), before Wave 4 (Audit). That command set assumes a JavaScript/Node toolchain with a `client/` subdirectory and will fail on most other targets. This is a known issue in the current pipeline and is not yet resolved. If your target codebase is not a Node project of that exact shape, expect Wave 3 to stop with a build failure even when implementation succeeded; you'll need to inspect the actual code changes manually rather than relying on the pipeline's build verdict.

**A submission keeps getting blocked by the quality gate.** That's working as intended. The gate flags artifacts with TODO/TBD/placeholder text, vague "look into" language, or missing file/line references. Fix the content — answer the open questions, add the file references, remove the placeholders — and resubmit. The gate is a feature, not a bug.

**A milestone task won't transition out of `in-progress`.** The state machine requires both at least one note and `acceptance_criteria` for `in-progress → review`. If the agent skipped one, the transition returns HTTP 422 with a `missing_fields` array telling you exactly what's needed. For milestone tasks specifically, never use `agentboard_update_task` directly — submit the linked document via `agentboard_submit_document` and the server's milestone-sync logic moves the task automatically.

**A `done` task can't be edited.** `done` is final. No fields, no notes, no status changes. If you really need to correct something, create a new task or a new artifact rather than reopening the closed one.
