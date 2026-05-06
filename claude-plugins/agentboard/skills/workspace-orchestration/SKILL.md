---
name: workspace-orchestration
description: Use when orchestrating parallel subagents across workspace board cards for planning, review, implementation, and audit waves
---

# Workspace Orchestration

Orchestrate parallel subagents through workspace board columns: planning → review → implementation → audit → finished.

## Prerequisites

- AgentBoard server running (call `agentboard_health_check`)
- A workspace board with cards in `backlog` (created via `/foundation`)
- MCP tools loaded: `agentboard`, `codegraph`, `codebase-rag`

## Pipeline Overview

```
Wave 1: Planning    → parallel agents build plans per card     → cards advance to review
Wave 2: Review      → parallel agents validate plans           → cards advance to implementation (or back to planning)
Wave 3: Implementation → parallel agents write code            → build/lint check → cards advance to audit
Wave 4: Audit       → parallel read-only agents verify         → cards advance to finished
```

## Checkpoint Logic

Read the board's `auto_transitions` to determine pausing:

| Board Setting | Default Behavior | With `--auto` Flag |
|---|---|---|
| `review_blocking: true` | PAUSE after Wave 1 | PAUSE (blocking always wins) |
| `review_blocking: false` | PAUSE after Wave 1 | Auto-proceed |
| `audit_blocking: true` | PAUSE after Wave 3 | PAUSE (blocking always wins) |
| `audit_blocking: false` | PAUSE after Wave 3 | Auto-proceed |

**Default is always pause.** The `--auto` flag only skips pauses when blocking is OFF.

## Running a Wave

For each wave, follow this pattern:

### 1. Collect Cards

Query cards by status matching the wave's input column:
- Wave 1 (Planning): cards in `backlog`
- Wave 2 (Review): cards in `review`
- Wave 3 (Implementation): cards in `implementation`
- Wave 4 (Audit): cards in `audit`

Use `mcp__agentboard__agentboard_list_workspace_cards` filtered by status. Always pass `limit=100` to prevent silent truncation on large boards — if the result count equals your limit, paginate with `offset` to retrieve the rest.

### 2. Spawn Parallel Subagents

Launch one Agent per card using `run_in_background: true`. Use the prompt template from `prompts/{wave}-agent.md`, substituting:
- `{{card_id}}` — the card's UUID
- `{{board_id}}` — the board UUID
- `{{agent_id}}` — use the orchestrator's agent_id (e.g., `claude-opus-4-6`)
- `{{spec_path}}` — path to the spec document (for planning/review agents)
- `{{card_title}}` — the card's title (for artifact headers)

### 3. Wait for All Agents

All background agents must complete before proceeding. Report results:

```
## Wave [N] Complete: [Wave Name]
- Cards processed: [X]/[total]
- Passed: [N]
- Failed: [N] (list card titles)
- Time elapsed: [duration]
```

### 4. Handle Failures

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

### 5. Checkpoint (if applicable)

If this wave requires a pause (per checkpoint logic above):

```
## Checkpoint: [Wave Name] Complete

[Results table]

Proceed to [next wave]? (waiting for confirmation)
```

Wait for user confirmation before starting the next wave.

## Build Verification

After Wave 3 (Implementation), before Wave 4 (Audit):

```bash
npm run build
npm run lint --prefix client
```

Both must pass. If either fails, stop and report.

## Retry Policy

| Scenario | Action | Max Retries |
|---|---|---|
| Review rejects a plan | Re-plan with feedback | 2 per card |
| Build fails | Stop, report to user | 0 (user intervenes) |
| Audit fails | Report, card stays in audit | 0 (user reviews) |
| Agent crashes/times out | Report, card unchanged | 1 |

## Status Reporting

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

## Prompt Templates

Located in `prompts/` directory within this skill:
- `planning-agent.md` — **Phase A dispatch only** (see two-phase note below)
- `review-agent.md` — validates plans against constraints
- `implementation-agent.md` — executes plans, writes code
- `audit-agent.md` — **Phase A dispatch only** (see two-phase note below)

### Two-Phase Planning and Audit

Wave 1 (Planning) and Wave 4 (Audit) each use a two-phase subagent pipeline instead of a single agent. The agent definitions live in `agents/` at the plugin root:

**Wave 1:**
1. Spawn `planning-research-agent` (haiku) per card — runs codegraph/RAG discovery, emits a `FACTS_BUNDLE_V1` artifact on the card
2. Wait for ALL Phase A agents to complete
3. Spawn `plan-compose-agent` (opus) per card — reads the facts bundle, writes the `plan` artifact. No discovery calls.

**Wave 4:**
1. Spawn `audit-research-agent` (haiku) per card — gathers git diff, blast radius, cross-references the plan, emits an `AUDIT_FACTS_BUNDLE_V1` artifact
2. Wait for ALL Phase A agents to complete
3. Spawn `audit-compose-agent` (opus) per card — reads the audit bundle, writes the `audit_report` artifact with PASS/PASS WITH NOTES/FAIL verdict

The `prompts/planning-agent.md` and `prompts/audit-agent.md` files in this directory describe the old single-agent approach — **do not use them**. Use the `agents/` definitions instead.
