# agent-armory — project memory

A workspace of agent tooling: MCP servers, Claude Code plugins, skills,
hooks, system prompts, and workflows.

## Active work threads

### Codebase RAG MCP rebuild
- **Branch**: `claude/fix-rag-tool-setup-te1aE`
- **Where**: `mcp-servers/codebase-rag/`
- **Status**: round 2 of expert review applied (commit `5a959fc`); 12/12 e2e tests passing.
- **Round 3 handoff**: `/root/.claude/plans/codebase-rag-mcp-round-3-handoff.md`
  Lists 12 remaining findings (3 Serious, 6 Moderate, 3 Minor) with concrete fixes.
- **Test command**:
  ```
  cd mcp-servers/codebase-rag/mcp-server-python && \
    rm -rf "$(python -c 'from utils.paths import cache_dir_for; print(cache_dir_for("/home/user/agent-armory/mcp-servers/codebase-rag/test-project"))')" && \
    python test_e2e.py
  ```
- **Out of scope** for this thread: `claude-plugins/agentboard/`,
  `claude-plugins/.claude-plugin/marketplace.json`, `skills/codebase-rag-enforcer/`.

## Standing rules for this repo

- The user holds work to the Expert Standard skill. Evaluate against
  established engineering standards, not against existing patterns in the
  codebase. Matching a bad pattern is a finding, not an excuse.
- When a review surfaces findings, apply *all* of them. Do not propose a
  prioritized subset unless the user explicitly asks.
- Never write template files (ARCHITECTURE.yml, docs/patterns/, etc.) into
  a project's tree from passive auto-bootstrap. The codebase-rag
  `setup_project` takes `generate_files=False` for this reason.
- Don't touch other plugins or marketplace configs unless explicitly
  scoped in.
- Read before proposing. Before suggesting structural changes to a file
  (splits, renames, refactors, content moves), read the things that
  reference it: slash commands, hooks, agent files, sibling skills, and
  any cross-plugin variants (e.g. `codex-plugins/`, `gemini-extensions/`).
  A single-file read is not a basis for a restructuring proposal.
- Don't invent the user's agenda. When the user says something has flaws,
  ask which flaws they mean before listing guesses. Don't present
  speculative findings as if they were the user's brief.
- Doing the homework is the floor. Don't offer "let me actually read the
  relevant files" as a deliverable, and don't ask permission for it.
  Either you've done it before you proposed, or the proposal is premature.

## Plan / handoff files

`/root/.claude/plans/` holds plan files and handoffs. Read the most
recently modified one before doing anything that overlaps an active
thread.
