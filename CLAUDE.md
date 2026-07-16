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

### Context Oracle (rethink of the context compiler)
- **Branch**: `claude/context-compiler-rethink-9ybsac` (PR #42)
- **Where**: `middleware/context-oracle/`
- **Status**: spec merged (PR #42, 2026-07-15). Next step is the
  architecture document + validation spikes — **no build before it**; the
  lifecycle (spec → architecture → plan → build) is binding and written
  into the project CLAUDE.md.
- **Authoritative documents, in order of authority**:
  1. `middleware/context-oracle/RETHINK.md` §12 + addendum — the owner's
     locked decisions. Nothing overrides these except the owner.
  2. `middleware/context-oracle/docs/specs/spec-context-oracle.md` — the v1
     spec (requirements, threat model, decisions D-1..D-20, acceptance
     criteria).
  3. `middleware/context-oracle/CLAUDE.md` — working-agent guidelines
     (auto-loads when working in that directory). Read it before touching
     the project.
  Plain-language state lives in `middleware/context-oracle/docs/STATUS.md`.
- **The old `ctxpack` compiler/gatekeeper design is dead.** Its three
  directories (`middleware/codebase-context-compiler/`, `…-sandbox/`,
  `middleware/Gemini-context-compiler/`) are archived reference only and
  carry ARCHIVED banners. Do not implement, extend, or cite them as current.

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
