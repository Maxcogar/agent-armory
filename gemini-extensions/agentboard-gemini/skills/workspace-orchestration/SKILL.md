---
name: workspace-orchestration
description: Use when orchestrating parallel subagents across workspace board cards for planning, review, implementation, and audit waves
---

# Workspace Orchestration

Orchestrate parallel subagents through workspace board columns: planning → review → implementation → audit → finished.

## Prerequisites

- AgentBoard cloud service reachable (call `mcp_agentboard_agentboard_health_check` — the MCP server is hosted at `https://mcp.agent-board.app/mcp`)
- A workspace board with cards in `backlog` (created via `/foundation`)
- MCP servers loaded: `agentboard`, `codegraph`, `codebase-rag`, `clear-thought`

## Where this runs

`/orchestrate` executes in the **main agent context** — never in a subagent. Gemini's subagent recursion protection (§8 of the extension spec) forbids subagents from dispatching subagents. The orchestration loop here issues subagent calls (`planning-agent`, `review-agent`, `implementation-agent`, `audit-agent`) as if they were tools; that only works when the caller is the main agent.

## Pipeline overview

```
Wave 1: Planning       → parallel planning-agent per card      → cards advance to review
Wave 2: Review         → parallel review-agent per card        → cards advance to implementation (or back to planning)
Wave 3: Implementation → parallel implementation-agent per card → build/lint check → cards advance to audit
Wave 4: Audit          → parallel audit-agent per card         → cards advance to finished (PASS) or back to implementation (FAIL)
```

This extension uses **single-agent waves** for planning and audit, matching the original single-pass design preserved at `reference/agent-profiles/` in the Claude plugin. The single-agent versions carry the full Expert Standard / Gate A/B/C rigor inline — they are not stripped-down versions.

## Checkpoint logic

Read the board's `auto_transitions` to determine pausing:

| Board Setting | Default Behavior | With `--auto` Flag |
|---|---|---|
| `review_blocking: true` | PAUSE after Wave 1 | PAUSE (blocking always wins) |
| `review_blocking: false` | PAUSE after Wave 1 | Auto-proceed |
| `audit_blocking: true` | PAUSE after Wave 3 | PAUSE (blocking always wins) |
| `audit_blocking: false` | PAUSE after Wave 3 | Auto-proceed |

**Default is always pause.** The `--auto` flag only skips pauses when blocking is OFF.

## Running a wave

For each wave, follow this pattern:

### 1. Collect cards

Query cards by status matching the wave's input column:
- Wave 1 (Planning): cards in `backlog`
- Wave 2 (Review): cards in `review`
- Wave 3 (Implementation): cards in `implementation`
- Wave 4 (Audit): cards in `audit`

Use `mcp_agentboard_agentboard_list_workspace_cards` filtered by status. Always pass `limit=100` to prevent silent truncation on large boards — if the result count equals your limit, paginate with `offset` to retrieve the rest.

### 2. Dispatch parallel subagents

Launch one subagent per card. In Gemini CLI the main agent calls subagents as tools — to run them in parallel, issue all subagent calls in a single turn (multiple tool calls in one response block).

| Wave | Subagent name | Inputs to pass in prompt |
|------|---------------|--------------------------|
| 1 — Planning | `planning-agent` | `card_id`, `board_id`, `agent_id`, `spec_path`, `card_title` |
| 2 — Review | `review-agent` | `card_id`, `board_id`, `agent_id`, `spec_path`, `card_title` |
| 3 — Implementation | `implementation-agent` | `card_id`, `board_id`, `agent_id`, `card_title` |
| 4 — Audit | `audit-agent` | `card_id`, `board_id`, `agent_id`, `card_title` |

`agent_id` is your model name (e.g. `gemini-2.5-pro`). Pass it verbatim into every subagent so all AgentBoard MCP calls share the same identity.

**Example prompt template** (issued once per card per wave):

```
card_id: 7f3c...
board_id: a91e...
agent_id: gemini-2.5-pro
card_title: Add pagination to workspace cards endpoint
spec_path: docs/specs/2026-05-10-workspace-pagination.md   ← waves 1 & 2 only
```

### 3. Wait for all agents

All subagent calls in a wave must complete before proceeding. Report results:

```
## Wave [N] Complete: [Wave Name]
- Cards processed: [X]/[total]
- Passed: [N]
- Failed: [N] (list card titles)
- Time elapsed: [duration]
```

### 4. Handle failures

**Review rejections (Wave 2):**
- Card sent back to `planning` with rejection notes
- Re-run Wave 1 for rejected cards only (max 2 retries per card)
- After 2 failures: report to user, do not retry

**Build/lint failure (after Wave 3):**
- Stop pipeline — do NOT proceed to Wave 4
- Report which files changed and likely culprit
- Wait for user intervention

**Audit failure (Wave 4):**
- Card moves back to `implementation` with notes on what must be fixed

**Agent crash/timeout:**
- Report, skip the card, continue with the rest of the wave

### 5. Checkpoint (if applicable)

If this wave requires a pause (per checkpoint logic above):

```
## Checkpoint: [Wave Name] Complete

[Results table]

Proceed to [next wave]? (waiting for confirmation)
```

Wait for user confirmation before starting the next wave.

## Build verification

After Wave 3 (Implementation), before Wave 4 (Audit). Filter the output so only errors/warnings land in context:

```bash
npm run build 2>&1 | grep -E -i 'error|warning|fail|✘' || echo 'BUILD OK'
npm run lint 2>&1 | grep -E -i 'error|warning|fail|✘' || echo 'LINT OK'
```

Both must pass. If either fails, stop and report.

## Retry policy

| Scenario | Action | Max retries |
|---|---|---|
| Review rejects a plan | Re-plan with feedback | 2 per card |
| Build fails | Stop, report to user | 0 (user intervenes) |
| Audit fails | Report, card stays in audit | 0 (user reviews) |
| Agent crashes/times out | Report, skip card, continue | 0 |

## Status reporting

Between waves (and at checkpoints), show:

```
## Orchestration Status — Board: [name]

| Column | Count |
|--------|-------|
| backlog | 0 |
| planning | 0 |
| review | 2 |
| implementation | 0 |
| audit | 3 |
| finished | 5 |

Progress: 5/10 cards finished (50%)
```

## Agents

All wave workers are subagents defined in `agents/` at the extension root:

| Agent | Role |
|-------|------|
| `planning-agent` | Wave 1 — codegraph/RAG discovery + audit-grade plan artifact with full Expert Standard / Gate A/B/C rigor |
| `review-agent` | Wave 2 — validates plans against engineering standards (default bias: FAIL) |
| `implementation-agent` | Wave 3 — executes plans, writes code |
| `audit-agent` | Wave 4 — read-only verification across substantive axes (security, concurrency, data integrity, API stability, etc.) |

Each agent declares its required tool surface (including the MCP servers it needs) in its own frontmatter. The orchestrator does not need to grant tools — the agent's `tools` array does that.
