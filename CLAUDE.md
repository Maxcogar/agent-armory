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

## CORE Memory ingestion protocol (mandatory — not a preference)

The CORE knowledge graph can only use what is written the way it expects.
A malformed ingestion is unretrievable at best and misleading at worst.
This format is a functional contract, not a style choice. Follow it
exactly; deviations have repeatedly wasted the owner's time and tokens.

**Session start**: (1) `initialize_conversation_session` with `new: true`
and keep the sessionId; (2) identify the repo and work context;
(3) `memory_search` with a full natural-language question, not keywords;
(4) `get_integrations` if external services are involved.

**Ingestion flow (session end, or when asked)**:
1. Write the full ingestion message in the exact payload format below.
2. Present the exact, complete string — including the XML tags, with no
   summarization — plus the proposed label IDs, to Max Cogar.
   Do NOT call `memory_ingest` first. Do NOT call `get_labels` before
   approval.
3. Wait for explicit approval ("approved", "yes", "go", "ok",
   "looks good"). Meta-instructions like "follow the protocol" or "do it
   right" are NOT approval — keep waiting.
4. After approval: `memory_ingest` with the approved text verbatim, the
   sessionId, and the approved label IDs. If no existing label fits,
   ingest without labels — never guess or invent labels.

**Payload format** — exactly one `<user>` block and one `<assistant>`
block, literal tags:

```
<user>Max Cogar is working on {Owner/repo or domain} — {session goal with enough context}</user>
<assistant>{One short context paragraph in prose, then explicit aspect-prefixed statement lines as below.}</assistant>
```

**Aspect-prefixed statements.** CORE classifies each statement into one of
12 aspect types (Identity, Knowledge, Belief, Preference, Habit, Goal,
Task, Directive, Decision, Event, Problem, Relationship) and links the
graph from them. Write every extractable fact as its own line with an
explicit prefix so classification lands — never bury decisions inline in
prose:

- `Decision: {what}. Rationale: {why}.` — every decision MUST carry its
  rationale; WHAT without WHY is non-compliant.
- `Knowledge: {verified fact, fully named}.`
- `Event: {occurrence with date, PR URL, commit hash}.`
- `Problem: {blocker or unknown, and what it gates}.`
- `Task: {specific, actionable next step}.`
- `Deferred: {item}. Reason: {why deferred}.`
- `Preference: {stable working preference of Max Cogar}.`
- `Directive: {standing rule future agents must follow}.`

**Entity naming — every mention, no abbreviation on second mention**:
people by full name ("Max Cogar", never "Max" or "the user"); repos as
`Owner/name` (e.g. `Maxcogar/agent-armory`); files as full repo-root
paths; packages with versions; services, MCP servers, and infrastructure
fully named; pull requests as full URLs; commits by hash. Never "the
repo", "it", "that", "the fix".

**Content**: include architecture decisions with WHY, bug root causes and
exact fixes, structural changes, what works vs what's broken (testable),
specific next steps, and every deferred item with its reason. Exclude
dead-end attempts, routine noise, conversational back-and-forth, and
redundancy.

Protocol sources: https://docs.getcore.me/memory/how-core-ingests,
https://docs.getcore.me/memory/aspects,
https://docs.getcore.me/memory/labels.
