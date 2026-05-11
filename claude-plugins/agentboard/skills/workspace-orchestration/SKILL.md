---
name: workspace-orchestration
description: Use when orchestrating parallel subagents across workspace board cards for planning, review, implementation, and audit waves
---

# Workspace Orchestration

Orchestrate parallel subagents through workspace board columns: planning → review → implementation → audit → finished.

## Prerequisites

- AgentBoard server running (call `agentboard_health_check`)
- A workspace board with cards in `backlog` (created via `/architecture`, which itself depends on a spec from `/foundation`)
- An approved architecture document at `docs/arch/<topic>.md` whose Card Slices section corresponds to the cards on this board
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

Launch one Agent per card using `run_in_background: true`. Set `subagent_type` to the agent name for the wave. The agents carry their own system prompts, tool allowlists, and model assignments — the prompt only needs to pass the per-card variables.

| Wave | Phase | `subagent_type` |
|------|-------|-----------------|
| 1 — Planning | A (haiku) | `planning-research-agent` |
| 1 — Planning | B (opus) | `plan-compose-agent` |
| 2 — Review | — | `review-agent` |
| 3 — Implementation | — | `implementation-agent` |
| 4 — Audit | A (haiku) | `audit-research-agent` |
| 4 — Audit | B (opus) | `audit-compose-agent` |

**Phase A prompt (Waves 1 and 4):**

```
card_id: 7f3c...
board_id: a91e...
agent_id: claude-opus-4-6
card_title: Add pagination to workspace cards endpoint
arch_slice: <paste the card's section from `## Card Slices` in the arch doc — full slice with all eight §6.3 fields: Description / Allowed-touch / Forbidden-touch / Produces / Consumes / Verification scope / Depends on / Source decisions>   ← Wave 1 only
repo_root: /absolute/path/to/repo                                                                                                                                                            ← Wave 4 only
```

**Phase B prompt (Waves 1 and 4):**

Before spawning Phase B agents, fetch the Phase A bundle from each card:
- Call `agentboard_list_workspace_artifacts` for the card
- Find the artifact starting with `FACTS_BUNDLE_V1` (Wave 1) or `AUDIT_FACTS_BUNDLE_V1` (Wave 4)
- Call `agentboard_get_workspace_artifact` to fetch the full content

Pass the bundle inline so the compose agent does not need to fetch it again. For Wave 1, also pass the `arch_slice` so the compose agent does not need to re-extract it:

```
card_id: 7f3c...
board_id: a91e...
agent_id: claude-opus-4-6
card_title: Add pagination to workspace cards endpoint
arch_slice: <the same per-card slice passed to Phase A — full slice with all eight §6.3 fields: Description / Allowed-touch / Forbidden-touch / Produces / Consumes / Verification scope / Depends on / Source decisions>   ← Wave 1 only
facts_bundle:
FACTS_BUNDLE_V1
{ ...full JSON bundle content... }
```

If a Phase A artifact is missing for a card, skip Phase B for that card and report the failure — do not spawn a compose agent without a bundle.

**Waves 2 and 3 prompt:**

```
card_id: 7f3c...
board_id: a91e...
agent_id: claude-opus-4-6
card_title: Add pagination to workspace cards endpoint
arch_path: /repo/docs/arch/2026-05-08-<topic>.md    ← review-agent only — full architecture doc, not just the slice
```

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

## Agents

All wave workers are dedicated agents defined in `agents/` at the plugin root:

| Agent | Model | Role |
|-------|-------|------|
| `planning-research-agent` | haiku | Wave 1 Phase A — codegraph/RAG discovery, emits `FACTS_BUNDLE_V1` |
| `plan-compose-agent` | opus | Wave 1 Phase B — reads bundle, writes plan artifact with full Expert Standard rigor |
| `review-agent` | opus | Wave 2 — validates plans against constraints |
| `implementation-agent` | sonnet | Wave 3 — executes plans, writes code |
| `audit-research-agent` | haiku | Wave 4 Phase A — git diff + blast radius, emits `AUDIT_FACTS_BUNDLE_V1` |
| `audit-compose-agent` | opus | Wave 4 Phase B — reads bundle, writes audit report, moves card |

### Two-Phase Pipeline (Waves 1 and 4)

**Wave 1:**
1. Spawn `planning-research-agent` per card in parallel — runs RAG discovery then codegraph structural analysis, emits `FACTS_BUNDLE_V1` artifact
2. Wait for ALL Phase A agents to complete
3. Spawn `plan-compose-agent` per card in parallel — reads the bundle, writes the `plan` artifact (no discovery calls)

**Wave 4:**
1. Spawn `audit-research-agent` per card in parallel — gathers git diff, blast radius, cross-references the plan artifact, emits `AUDIT_FACTS_BUNDLE_V1`
2. Wait for ALL Phase A agents to complete
3. Spawn `audit-compose-agent` per card in parallel — reads the bundle, writes `audit_report` artifact, moves card to `finished` (PASS) or back to `implementation` (FAIL)
