---
name: orchestrate
description: Run the workspace orchestration pipeline — planning, review, implementation, and audit waves with parallel subagents
---

# Orchestrate — Workspace Pipeline

Run parallel subagents through the workspace board pipeline. Requires cards in `backlog` (created via `/architecture`, which itself reads an approved spec from `/foundation`).

**Usage:** `/orchestrate` or `/orchestrate --auto`

## Instructions

This command is a thin entry point. The `workspace-orchestration` skill at `skills/workspace-orchestration/SKILL.md` is the single source of truth for the wave logic, prompt templates, checkpoint policy, retry policy, build verification, and per-wave failure handling.

1. **Load tools and the skill:**
   - Call `ToolSearch` for `agentboard`, `codegraph`, and `rag` tools so their MCP tool schemas are available.
   - Call `agentboard_health_check` — AgentBoard is cloud-hosted, this is a reachability/auth check (not a local-process check).
   - Invoke the `workspace-orchestration` skill via the `Skill` tool. That skill carries the full wave-by-wave logic; do not re-derive it from this command.

2. **Parse command flags from the argument string:**
   - `--auto`: skip checkpoints where the board's `auto_transitions` blocking toggle is OFF. Blocking ON always pauses regardless of this flag.

3. **Hand control to the skill.** The skill's "Pipeline Overview", "Checkpoint Logic", "Running a Wave", "Build Verification", "Retry Policy", "Status Reporting", and "Agents" sections describe what happens from here; the rest of this command's behavior is fully specified there. Do not duplicate that content here — if behavior needs to change, change it in the skill.

## Flags

- `--auto` — Skip checkpoints where board blocking is OFF. If a blocking toggle is ON, the checkpoint is enforced regardless of this flag.

## See also

- `skills/workspace-orchestration/SKILL.md` — the authoritative reference for wave-by-wave logic and prompt templates
- `commands/architecture.md` — creates the cards this command runs against
- `commands/foundation.md` — creates the spec that `/architecture` derives from
