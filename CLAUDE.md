# agent-armory — project memory

A workspace of agent tooling: MCP servers, Claude Code plugins, skills,
hooks, system prompts, and workflows.

## Active work threads

### Codebase RAG MCP — round 3 pending
- **Status**: rounds 1 + 2 merged to `main` via PR #10 (merge commit `b1cc29c`,
  feature branch was `claude/fix-rag-tool-setup-te1aE`). 12/12 e2e tests
  green at merge.
- **Where**: `mcp-servers/codebase-rag/`
- **Round 3 handoff**: `/root/.claude/plans/codebase-rag-mcp-round-3-handoff.md`
  Lists 12 remaining findings (3 Serious, 6 Moderate, 3 Minor) with concrete
  fixes. Cut a fresh branch off `main` when picking this up.
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

## Plan / handoff files

`/root/.claude/plans/` holds plan files and handoffs. Read the most
recently modified one before doing anything that overlaps an active
thread.
