# Reference agent profiles

These are the **original single-phase** Claude Code agent profiles for the AgentBoard
planning and audit waves, preserved verbatim from before the two-phase pipeline
refactor (commit `4c1be07`).

They are kept here as references for porting AgentBoard to other agent runtimes
(Codex, Gemini) where a single rigorous agent may be a better fit than the
haiku-research / opus-compose split used by the current Claude Code plugin.

## Files

| File | Original purpose |
|------|------------------|
| `planning-agent.md` | Wave 1 — single-pass plan author with full Expert Standard / Gate A/B/C rigor |
| `audit-agent.md` | Wave 4 — single-pass audit verdict |

## Not loaded by Claude Code

This directory lives outside `agents/`, `commands/`, `skills/`, and `hooks/`, so
Claude Code's plugin loader will not pick these files up. The `name:` field in
their frontmatter does not register a callable agent. The active Claude Code
agents are:

- `agents/planning-research-agent.md` (Phase A, haiku)
- `agents/plan-compose-agent.md` (Phase B, opus)
- `agents/audit-research-agent.md` (Phase A, haiku)
- `agents/audit-compose-agent.md` (Phase B, opus)

## Adapting these for Codex / Gemini

The MCP tool names (`mcp__agentboard__*`, `mcp__codegraph__*`,
`mcp__codebase-rag__*`, `mcp__claude_ai_Context7__*`, `mcp__clear-thought__*`)
and the `Skill` tool are Claude Code-specific. When porting, replace each with
the equivalent tool surface of the target runtime, but keep the process and
gate structure intact — that is what these profiles exist to preserve.
