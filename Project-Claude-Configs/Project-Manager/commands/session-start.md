---
name: session-start
description: Mandatory session start protocol — read latest handoff, invoke expert-standard skill, init CORE session, state locked decisions before touching code.
---

# Session Start

Do these in order. Do not skip. Do not start work until all are done.

## 1. Invoke the expert-standard skill

`Skill(skill: "expert-standard")` — this is the evaluation frame for every engineering judgment this session. Without it I will pattern-match against the codebase instead of reasoning against named standards.

## 1b. Invoke the codebase-rag-enforcer skill

`Skill(skill: "codebase-rag-enforcer")` — loads `rag_search` and `rag_query_impact` as the default lookup tools for this session. Use `rag_search` before editing unfamiliar code, when looking for callers/callees, or when checking how a similar feature is already implemented. Use `rag_query_impact` before modifying a file to see what depends on it. The `[RAG CONTEXT]` auto-injected on every prompt is a hint, not a substitute for these calls.

## 2. Read the latest handoff

Newest file in `docs/deployment-readiness/handoffs/` (`ls -t | head -1`). Read it in full. This is THE authoritative state of last session — it overrides commit messages if they conflict.

## 3. Read the source-of-truth docs for the current work

Not summaries. Actual docs.

- `docs/deployment-readiness/review.md` — the 29 findings. When working a finding, read its entry directly, not a plan doc's paraphrase of it.
- `docs/deployment-readiness/master-plan.md` — sequencing + locked decisions.
- `docs/deployment-readiness/handoffs/2026-04-05-corrections-handoff.md` — 12 corrections that override earlier plan prose (SQLite stays, max-instances: 1, IAP for browser auth, service-account ID tokens for MCP, Cloud Armor for rate limiting).
- `docs/deployment-readiness/plans/plan<N>-*.md` — the specific plan being executed.
- `CLAUDE.md` — state machines, API surface, WebSocket contract, FILE_MAP.

## 4. Initialize CORE Memory session

If the CORE tools are deferred, load them first:
`ToolSearch(query: "select:mcp__claude_ai_CORE_Memory__initialize_conversation_session,mcp__claude_ai_CORE_Memory__memory_search,mcp__claude_ai_CORE_Memory__memory_ingest,mcp__claude_ai_CORE_Memory__get_labels,mcp__claude_ai_CORE_Memory__get_integrations")`

Then `mcp__claude_ai_CORE_Memory__initialize_conversation_session(new: true)` — store the returned sessionId for the entire session. Announce it so it survives a compact.

## 5. Search CORE memory

`mcp__claude_ai_CORE_Memory__memory_search` with a complete semantic question, not keywords. Example: "What is the current state of Plan <N> on the Maxcogar/Project-Manager repository?"

Surface any memory that contradicts or constrains what the user is asking.

## 6. State the plan-of-record before writing code

Before agreeing to any implementation plan, write out explicitly:

- What the latest handoff says is next.
- What findings the current task closes (cite `review.md` line numbers).
- What is deferred by plan sequencing and why.
- Locked decisions from prior plans/corrections that constrain the approach.

If the user's request contradicts a locked decision, stop and flag it. Do not silently proceed.

## 7. No hedging

If a standard, plan, or corrections handoff already answers a decision, state the answer and proceed. Do not present (a)/(b)/(c)/(d) option lists for the user to pick from when the source docs already dictate the answer.

---

**Do not open an editor, write code, or run destructive commands before steps 1–6 are complete.**
