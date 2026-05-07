# AgentBoard for Codex

AgentBoard is a Codex plugin for structured project execution. It expresses the AgentBoard workflow in Codex-native skills and spawned workers.

The plugin targets two work styles:

- Phase-based projects: a strict 13-phase document and task workflow for larger changes.
- Workspace boards: app -> board -> card orchestration for sweeps, refactors, migrations, and parallel implementation work.

- Added a real Codex plugin manifest at `.codex-plugin/plugin.json`.
- Added Codex workflow skills:
  - `kickoff`
  - `pickup`
  - `status`
  - `wrap-up`
  - `foundation`
  - `board-status`
  - `sweep`
  - `orchestrate`
- Added Codex worker templates plus runtime `spawn_agent` orchestration.

## Install

Install the plugin from this directory in Codex.

This plugin bundles its MCP server config in [.mcp.json](C:\Users\maxco\Documents\agent-armory\codex-plugins\agentboard\.mcp.json).

Bundled servers:

- `agentboard`
- `codegraph`
- `codebase-rag`
- `clear-thought`

The bundled config currently points at:

- `C:\Users\maxco\Documents\agent-armory\mcp-servers\codegraph-mcp\dist\index.js`
- `C:\Users\maxco\Documents\agent-armory\mcp-servers\codebase-rag\mcp-server-python\server.py`

If you move this repo, update those paths.

If `codegraph` or `codebase-rag` are unavailable, the AgentBoard cloud surface still works, but the richer survey, sweep, and planning flows degrade.

## Using The Plugin

Tell Codex what workflow you want in plain language. The skills are designed to trigger naturally.

Examples:

- "Use AgentBoard kickoff for this repo."
- "Resume the current AgentBoard project."
- "Show AgentBoard project status."
- "Create a foundation spec and board for this migration."
- "Sweep this codebase and turn findings into cards."
- "Orchestrate the current board."

For orchestration, Codex does not use a plugin-local `agents/` directory. This plugin now defines reusable worker templates under [skills/orchestrate/references](C:\Users\maxco\Documents\agent-armory\codex-plugins\agentboard\skills\orchestrate\references), and the orchestrator is expected to spawn workers dynamically with `spawn_agent`.

## Authentication

AgentBoard uses OAuth. When the MCP only exposes:

- `agentboard_authenticate`
- `agentboard_complete_authentication`

Codex should start the auth bootstrap, give you the authorization URL, and then ask for the browser callback URL.

Treat the callback URL as a secret. It should only be used to complete authentication.

## Skill Map

- [skills/agentboard/SKILL.md](./skills/agentboard/SKILL.md): core rules, auth flow, state machine, tool usage.
- [skills/kickoff/SKILL.md](./skills/kickoff/SKILL.md): start a phase-based project.
- [skills/pickup/SKILL.md](./skills/pickup/SKILL.md): resume a phase-based project.
- [skills/status/SKILL.md](./skills/status/SKILL.md): read-only project status.
- [skills/wrap-up/SKILL.md](./skills/wrap-up/SKILL.md): handoff and closeout.
- [skills/foundation/SKILL.md](./skills/foundation/SKILL.md): spec creation plus backlog seeding.
- [skills/board-status/SKILL.md](./skills/board-status/SKILL.md): read-only board status.
- [skills/sweep/SKILL.md](./skills/sweep/SKILL.md): codebase discovery into board cards.
- [skills/orchestrate/SKILL.md](./skills/orchestrate/SKILL.md): board pipeline execution.
- [skills/workspace-orchestration/SKILL.md](./skills/workspace-orchestration/SKILL.md): orchestration guardrails and wave behavior.

Worker templates:

- [planning-worker.md](C:\Users\maxco\Documents\agent-armory\codex-plugins\agentboard\skills\orchestrate\references\planning-worker.md)
- [review-worker.md](C:\Users\maxco\Documents\agent-armory\codex-plugins\agentboard\skills\orchestrate\references\review-worker.md)
- [implementation-worker.md](C:\Users\maxco\Documents\agent-armory\codex-plugins\agentboard\skills\orchestrate\references\implementation-worker.md)
- [audit-worker.md](C:\Users\maxco\Documents\agent-armory\codex-plugins\agentboard\skills\orchestrate\references\audit-worker.md)

## Current Gaps

- Codex does not provide the same hook model, so quality gate and card-guidance behavior live as written instructions inside the skills and worker templates.
- The bundled MCP config contains machine-specific Windows paths for the local companion servers.

## Next Likely Improvements

- Add a plugin-local app surface for first-class AgentBoard discovery.
- Add reusable worker prompt templates for planning, review, implementation, and audit waves.
- Make verification commands configurable per board or per target repo.
- Replace machine-specific local server paths with a more portable setup mechanism.
