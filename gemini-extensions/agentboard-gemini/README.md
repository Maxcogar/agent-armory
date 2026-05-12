# AgentBoard — Gemini CLI extension

AgentBoard is a project management system for AI coding sessions. The service runs in the cloud at `https://agent-board.app`, exposes an MCP server at `https://mcp.agent-board.app/mcp`, and this extension is the Gemini CLI side of it: slash commands, subagents, skills, and hooks that drive Gemini CLI sessions through AgentBoard's workflows. The extension also wires up three companion MCP servers — `codegraph`, `codebase-rag`, and `clear-thought` — that the workflows rely on.

This README is for human operators installing and using the extension. For the agent-facing tool reference and workflow internals, see `skills/agentboard/SKILL.md`.

---

## Table of contents

1. [What is AgentBoard?](#what-is-agentboard)
2. [Installing the extension](#installing-the-extension)
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

The cloud service handles all storage and state. There is no local AgentBoard server, no database to run, and no Node.js or Python dependencies for AgentBoard itself. The Gemini CLI extension connects to the hosted MCP at `mcp.agent-board.app/mcp` over HTTP.

The agentboard MCP exposes around 32 tools across two surfaces: a **core surface** (19 tools — authentication and connectivity, projects, tasks, documents, activity log) and a **workspace surface** (13 tools — apps, boards, cards, artifacts). You don't need to memorize them — the slash commands drive them. The exact count may differ slightly from the live cloud MCP.

---

## Installing the extension

Installing AgentBoard end-to-end means three things: getting the extension files, installing the companion MCP servers, and pointing Gemini CLI at all of it.

### Prerequisites

| Tool | Why | Where it's needed |
|---|---|---|
| **Gemini CLI** | The host that runs the extension | Always |
| **Git** | To clone the source repo | One-time, for fetching the extension |
| **Python 3.10+** with `pip` | To run the `codebase-rag` MCP server | Required for semantic search (the planning/review/audit agents depend on it) |
| **Node.js ≥ 18.0** with `npm` and `npx` | To build `codegraph` and run `clear-thought` | Required for dependency-graph analysis and structured reasoning |

### 1. Get the extension and companion servers

Clone the repo:

```bash
git clone https://github.com/Maxcogar/agent-armory.git
cd agent-armory
```

The extension lives at `gemini-extensions/agentboard-gemini/`. The two stdio companion servers are at `mcp-servers/codebase-rag/` and `mcp-servers/codegraph-mcp/`.

### 2. Build the stdio companion servers

**`codebase-rag`** — Python:

```bash
cd mcp-servers/codebase-rag/mcp-server-python
pip install -r requirements.txt
```

Note the absolute path of `server.py` — you'll give this to the extension at install time.

**`codegraph`** — Node:

```bash
cd mcp-servers/codegraph-mcp
npm install
npm run build
```

Note the absolute path of `dist/index.js` — you'll give this to the extension at install time.

**`clear-thought`** — no build step. It runs via `npx @waldzellai/clear-thought` and the extension launches it directly.

### 3. Install the extension into Gemini CLI

For development (live changes against your clone, no reinstall on every edit):

```bash
gemini extensions link /absolute/path/to/agent-armory/gemini-extensions/agentboard-gemini
```

For a production install (copies the extension into `~/.gemini/extensions/`):

```bash
gemini extensions install /absolute/path/to/agent-armory/gemini-extensions/agentboard-gemini
```

No config prompts. The extension's manifest references the codegraph and codebase-rag binaries via `${extensionPath}/../../mcp-servers/...`, which works as long as the extension lives at `agent-armory/gemini-extensions/agentboard-gemini/` (the monorepo layout). If you move the extension out of that tree, edit the `args` paths in `gemini-extension.json` to match.

### 4. First session

Open Gemini CLI in the project where you want to use AgentBoard. The agentboard MCP starts unauthenticated — on the first tool call, only `agentboard_authenticate` and `agentboard_complete_authentication` will be visible. The bootstrap process is documented in [First-run authentication](#first-run-authentication) below and is also baked into every command's prompt, so running any slash command will walk you through auth automatically.

Once that succeeds, all ~32 agentboard tools become available and you can run any of the slash commands.

---

## First-run authentication

The agentboard MCP requires OAuth-style authentication. On a fresh session — or any session where your tokens have expired — only two tools are visible from the agentboard surface:

- `agentboard_authenticate`
- `agentboard_complete_authentication`

Everything else (health check, projects, tasks, documents, workspace tools) appears only after the OAuth bootstrap finishes.

The bootstrap flow:

1. Call `agentboard_authenticate`. The MCP returns an authorization URL.
2. The agent shares the URL with you and asks you to authorize in your browser.
3. After you authorize, your browser is redirected to a `http://localhost:<port>/callback?code=...&state=...` URL. On remote sessions the page itself may not load — that's fine. The full URL in the browser's address bar is what matters.
4. Paste the full URL back to the agent.
5. The agent calls `agentboard_complete_authentication` with that URL. The remaining tools become available immediately.

**Treat the callback URL as a secret.** It contains a short-lived authorization code that converts to an access token. Hand it to the agent only as the value it's asking for; don't paste it into chat for any other purpose, don't put it in a card note, an artifact, a commit message, or a file.

Once authenticated, the session calls `agentboard_health_check` to confirm the cloud service is reachable. If that fails *after* authentication, the cloud service itself is having a problem — check `agent-board.app` for status.

---

## The two workflows — which one to use

The extension supports two workflows. Pick based on the shape of the work, not preference.

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

Onboard a fresh agent to AgentBoard. Authenticates if needed, calls `agentboard_health_check`, lists existing projects, and either picks one or creates a new one (asking you for name, project type, idea, and target codebase path). Then claims the first task with `agentboard_get_next_task` and shows you what the agent will work on.

#### `/pickup`

Resume work in an existing project. Authenticates, finds the active project, checks for an in-progress task, and if there isn't one calls `agentboard_get_next_task`. Reads the linked phase document (for milestone tasks) and pulls the last 10 entries from the activity log so the agent has context on what the previous agent did. Use this at the start of every continuation session.

#### `/wrap-up`

End a session cleanly. For each in-progress task, the agent adds a progress note (what was done, what remains, blockers, files touched) via `agentboard_update_task`. Adds a session-summary entry to the activity log. Shows you a handoff summary. Run this before you close the session so the next agent has somewhere to start.

#### `/status`

Read-only situational awareness for a phase project. Shows the current phase (N/13), task counts by status, blocked items with reasons, and what needs to happen next. Doesn't mutate anything.

### Workspace board commands

#### `/foundation`

Interactive spec-building session. Asks you what you want to build, asks clarifying questions one at a time, optionally researches the codebase with codegraph and RAG, then writes a spec to `docs/specs/YYYY-MM-DD-<topic>.md`. After you approve the spec, it creates one workspace card per major chunk of work in `backlog` on a board you select (or creates a new app and board if needed).

#### `/sweep`

Systematic codebase quality discovery. Uses the `codebase-sweep` skill: scans with codegraph, initializes RAG, reads every source file in a deliberate order (entry points, then most-coupled files, then outward by directory), and writes findings to `docs/sweep/YYYY-MM-DD-findings.md` as it goes. After the sweep, it triages findings into related groups and creates one workspace card per group. Read-only with respect to the target codebase — no code changes. After the sweep, the board is ready for `/orchestrate` to begin fixing.

#### `/orchestrate`

Run the four-wave pipeline against a workspace board: planning → review → implementation → audit. The command runs in the main agent context (Gemini's recursion protection prevents subagents from dispatching subagents, so the orchestration loop cannot itself be wrapped in a subagent). For each wave, `/orchestrate` collects cards in the wave's input column, dispatches one subagent per card via Gemini's main-agent-calls-subagent-as-tool mechanism, waits for all agents to finish, and reports results. Between waves it consults the board's `auto_transitions` setting (`review_blocking`, `audit_blocking`) to decide whether to pause for your confirmation. The `--auto` flag skips pauses where blocking is OFF — but if a blocking toggle is ON, the checkpoint is enforced regardless. Review rejections send a card back to planning with feedback (max 2 retries per card).

#### `/board-status`

Read-only progress snapshot of a workspace board. Counts cards per column, shows progress, shows the board's blocking settings, lists cards needing attention, and gives a brief recent-activity slice.

---

## Companion MCP servers

Three MCP servers ship configured alongside agentboard. They are not optional extras — the AgentBoard workflows use them to gather data, follow constraints, and reason through decisions.

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

### clear-thought — structured reasoning

A reasoning toolkit (`@waldzellai/clear-thought`) for working through plan decision points explicitly: sequential thinking, mental models, decision frameworks, debugging approaches, structured argumentation. The planning agent is required to use this for every non-trivial decision — silent skipping is a compliance failure. Runs via `npx` on demand, so no install step is needed beyond having Node/npm available.

---

## Hooks

The extension defines two hooks. You don't need to interact with them directly, but knowing they exist helps when something looks unexpected.

- **`BeforeTool` on `agentboard_submit_workspace_artifact`** is a submission quality gate. Before an artifact is submitted, the gate (`hooks/scripts/artifact-quality-gate.py`) scans the content for TODO/TBD/FIXME/placeholder text, "need to investigate" language, and similar tells of unfinished work. If any check fails, the submission is blocked and the agent is told to fix the gaps.
- **`AfterTool` on workspace card tools** (`get_next_card`, `get_card`, `update_workspace_card`) runs `hooks/scripts/workspace-card-guidance.py` to inject phase-specific guidance (planning standards, review standards, etc.) based on the card's current status. This nudges agents toward the right next move.

The OAuth bootstrap is not a hook — Gemini CLI does not currently support prompt-type hooks at `SessionStart`. Instead, every command's prompt explicitly checks for the unauthenticated state and runs the bootstrap if needed (see §1 of `GEMINI.md`).

---

## Troubleshooting

**The session keeps re-prompting me to authenticate.** Tokens have expired or were revoked. Just walk through the bootstrap again — open the URL the agent shares, authorize, and paste the full callback URL back.

**"AgentBoard cloud service is unreachable."** This message comes from commands and agents when `agentboard_health_check` fails *after* authentication. The cloud service itself is unreachable. Check your network connection, then check service status at `agent-board.app`.

**Tools other than the two auth tools aren't visible.** The MCP exposes only `agentboard_authenticate` and `agentboard_complete_authentication` until OAuth completes. If you see only those two, the bootstrap hasn't run successfully yet. Run any command (e.g. `/kickoff` or `/pickup`) and let its bootstrap step walk you through auth.

**`codegraph` or `codebase-rag` tools fail to load.** Check the paths in the extension settings — `gemini extensions config agentboard-gemini CODEGRAPH_SERVER_PATH` and `gemini extensions config agentboard-gemini CODEBASE_RAG_SERVER_PATH`. They must be absolute paths to the built binaries. After changing them, restart the Gemini CLI session for the new values to take effect.

**`clear-thought` tools fail to load.** The extension launches it via `npx -y -p @waldzellai/clear-thought mcp-server-clear-thought`, which requires Node/npm in PATH and network access on first run. Confirm `npx --version` works in your shell.

**`/orchestrate` Wave 3 fails on a build step.** The orchestration pipeline currently runs hardcoded `npm run build` and `npm run lint` after Wave 3. That command set assumes a JavaScript/Node toolchain and will fail on most other targets. If your target codebase is not a Node project, expect Wave 3 to stop with a build failure even when implementation succeeded; inspect the actual code changes manually rather than relying on the pipeline's build verdict.

**A submission keeps getting blocked by the quality gate.** That's working as intended. The gate flags artifacts with TODO/TBD/placeholder text, vague "look into" language, or missing file/line references. Fix the content — answer the open questions, add the file references, remove the placeholders — and resubmit.

**A milestone task won't transition out of `in-progress`.** The state machine requires both at least one note and `acceptance_criteria` for `in-progress → review`. If the agent skipped one, the transition returns HTTP 422 with a `missing_fields` array telling you exactly what's needed. For milestone tasks specifically, never use `agentboard_update_task` directly — submit the linked document via `agentboard_submit_document` and the server's milestone-sync logic moves the task automatically.

**A `done` task can't be edited.** `done` is final. No fields, no notes, no status changes. If you really need to correct something, create a new task or a new artifact rather than reopening the closed one.
