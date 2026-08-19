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

**Handoff-writing rule (mandatory).** Workflow invariant: Max Cogar
merges a finished session's pull request(s) before starting the next
session — always. Every handoff and session-end document is therefore
read by an agent whose `main` already contains everything the writing
session produced. Write from that reality: never describe any of the
session's PRs, branches, or commits as unmerged, open, or pending; never
tell the reader to check merge state; never describe repo state that
will be false once the session's PRs are merged. A handoff that hedges
about merge state sends the next agent hunting for missing work that
isn't missing. Likewise, a fresh session starts on current `main`
automatically and the platform assigns it its own working branch —
handoffs contain NO git mechanics: no fetch, no checkout, no branch
names. State what to read and what to do; the environment handles the
rest.

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
