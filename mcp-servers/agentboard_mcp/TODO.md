# AgentBoard MCP — TODO

Cross-referenced against `Planning/SPEC_milestone-lifecycle.md`, `agentboard_mcp/SPEC.md`,
`agentboard_mcp/server.py`, MCP-builder skill references, and Express server source code.

**Date**: 2026-02-22
**Reviewers**: doc-reviewer (spec cross-reference), code-tracer (server-side trace)

---

## CRITICAL

### 1. AgentID hardcoded as "mcp-agent" — real attribution impossible

**Lifecycle spec lines 169-176**: Agents must send descriptive identifiers (`"claude"`, `"gemini"`, `"codex"`). AgentID flows to `assignee`, `filled_by`, `notes[].author`, `activity_log.actor` for real attribution.

**What the MCP does**:
- `server.py:25` — `AGENT_ID = os.environ.get("AGENTBOARD_AGENT_ID", "mcp-agent")` set once at module load
- `server.py:73` — Every request sends `{"X-Agent-Id": AGENT_ID}` (same static value)
- `getNextTask` auto-claim always sets `assignee` to `"mcp-agent"`
- Activity log `actor` is always `"mcp-agent"`

**Partial mitigation**: `SubmitDocumentInput.filled_by` allows per-call override for document submission only. But `assignee` (from auto-claim) and `activity_log.actor` cannot be overridden per-call.

**Impact**: The lifecycle spec's entire attribution system is non-functional. You cannot tell WHO wrote a document, WHO claimed a milestone, or WHO performed any action. Every agent appears as "mcp-agent".

**Verified via codegraph + RAG**:
- `server/src/middleware/agentId.js` (1 dependent: index.js): `req.agentId = req.headers['x-agent-id'] || 'unknown'`
- `milestoneSync.js` builds notes as `{ text, timestamp, author: agentId }` — so `author` is always `"mcp-agent"` via MCP
- `milestoneSync.js` passes `agentId` to `addLogEntry()` for `actor` — always `"mcp-agent"` via MCP
- Blast radius of agentId.js + all 5 MCP-wrapped route files: 5.8% (6 files, tightly contained)

**Fix direction**: Add a **required** `agent_id` parameter to every mutating tool. Not optional, not an env var default, not "one instance per agent." If you're writing data, you identify yourself — period.

Mutating tools that need `agent_id` (required):
- `agentboard_create_project`
- `agentboard_advance_phase` / `agentboard_revert_phase`
- `agentboard_create_task`
- `agentboard_update_task`
- `agentboard_submit_document`
- `agentboard_update_document`
- `agentboard_add_log_entry`

Read-only tools (no `agent_id` needed):
- `agentboard_get_project` / `agentboard_list_projects`
- `agentboard_list_tasks` / `agentboard_get_next_task`
- `agentboard_get_document` / `agentboard_list_documents`
- `agentboard_get_activity_log`
- `agentboard_health_check` / `agentboard_server_status` / `agentboard_start_server` / `agentboard_stop_server`

The `AGENTBOARD_AGENT_ID` env var and static `X-Agent-Id` header should be removed. Each tool call passes `agent_id` directly → server.py sends it as the `X-Agent-Id` header → attribution works per-call.

**Note**: `getNextTask` is read-only in this list because auto-claim sets assignee from the `X-Agent-Id` header. Since the agent will immediately follow up with a mutating call (submit_document, update_task), attribution is covered there. If auto-claim attribution is also needed, `getNextTask` can take an optional `agent_id`.

---

### 2. AUDIT.md scope incomplete — lifecycle spec never checked

**AUDIT.md line 9**: "Verdict: PASS — All issues resolved. 19 tools production-ready."

The audit verified `SPEC.md` vs `server.py` conformance (211/211 checks). It **never** cross-referenced against `Planning/SPEC_milestone-lifecycle.md` — the upstream requirements spec. The "PASS" verdict is correct for its scope but gives a false sense of completeness.

**What the audit missed**:
- AgentID attribution broken (CRITICAL — item 1)
- Edge cases absent from tool descriptions (MAJOR — item 4)
- Multi-agent assignee conflict undocumented (MAJOR — item 5)
- Notes policy not communicated to LLM (MAJOR — item 6)
- Disconnect/restart recovery not documented (MAJOR — item 3)
- Phase 4 evaluations never completed (MINOR — item 8)

---

## MAJOR

### 3. getNextTask doesn't handle "in review" state — agent gets no context after reconnect

**Scenario**: Agent submits a document, connection breaks (timeout, disconnect, server restart). Agent comes back, calls `getNextTask`. What happens?

**Current behavior**: `getNextTask` returns whatever's highest priority with no context. If the milestone is in `review` (agent submitted, human hasn't acted yet), the server query (`status IN ('in-progress', 'ready')`) skips it entirely — `review` isn't in the query. So the agent either gets a different task or a 404, with zero indication that it has a document sitting in review waiting for a human decision.

**What should happen**: If the agent's submitted document is still in review, `getNextTask` should tell the agent that — something like "Document X is in Review, awaiting results." The agent shouldn't silently move on to other work or get a confusing 404 when it has pending work under human review.

This also prevents a second agent from checking out a document that's mid-review and making changes that would invalidate the review.

**Fix direction**: This is a behavioral change in the `getNextTask` server route, not a docstring fix.
- Query should check for milestones in `review` status assigned to the calling agent
- If found, return a response indicating the document is awaiting human review (not a task to work on)
- Only return the next actionable task if nothing is pending review

**Related**: Issue 1 (AgentID) is a prerequisite — the server needs to know WHO is calling `getNextTask` to check if THEIR document is in review.

---

### 4. Error messages not actionable — agents will go rogue on failures

**Lifecycle spec lines 519-536** documents 12 edge cases. Most produce error codes but give the agent no guidance on what to do next. Without clear instructions, LLMs may retry indefinitely, go searching through the filesystem to "fix" the MCP, or fail silently.

**Principle**: Every error response should tell the agent exactly what happened and what to do next. No ambiguity.

**Edge cases and their required actionable errors**:

| Scenario | Current Error | Should Say |
|----------|--------------|------------|
| Agent submits a doc that's already been submitted (regardless of timing or which agent) | 400 `INVALID_DOCUMENT_STATUS` — vague | "This document has already been submitted and is awaiting review. Call getNextTask to get your next available work." |
| Agent submits a doc that's already approved | 400 `INVALID_DOCUMENT_STATUS` — same vague error | "This document has already been approved. Call getNextTask to get your next task." |
| Two agents call getNextTask simultaneously | Not documented | Covered by issue 5 (assignee filtering) |
| Agent disconnects while waiting | Not documented | Covered by issue 3 (getNextTask handles review state) |
| Server restarts while agent waiting | Not documented | Covered by issue 3 |
| Human approves but no agent waiting | Not documented | No agent-facing issue — milestoneSync runs, board updates, transparent |
| Agent submits without notes | 400 `MISSING_NOTES` | Already clear and actionable |

**Fix direction**: Update error responses in `documents.js` submit route to return specific, actionable messages based on the document's current status. Each error should end with a clear next step (usually "call getNextTask").

---

### 5. getNextTask hands out claimed tasks to other agents — no locking

**Lifecycle spec line 523**: "Two agents call `getNextTask()` simultaneously — First one wins. Second agent gets the next available, or 404."

**What the server actually does** (`server/src/db/tasks.js:102-143`): Returns the highest-priority eligible task regardless of who is assigned to it. If agent A claimed a task (`status: 'in-progress'`), agent B calling `getNextTask()` gets that **same task back**. There is no locking.

**Fix direction**: Claimed tasks are locked. `getNextTask` should only return:
- `ready` tasks (unclaimed, available for anyone)
- `in-progress` tasks assigned to the calling agent (resuming their own work)

If a task is `in-progress` and assigned to a different agent, skip it. The calling agent gets the next available task, or 404 if nothing is available.

**Abandoned tasks**: If an agent claims a task and disappears, the task is stuck in `in-progress` with no one working on it. The human resets it back to `ready` from the UI. This is a manual action — `getNextTask` should NOT silently reassign abandoned tasks.

**UI requirement**: Need a way for the human to reset an in-progress task back to `ready` (clear assignee, unlock it). This may already work via the task state machine (`in-progress` → `ready` is a valid transition) but should be easy to do from the board.

**Note on agent ID**: Filtering by assignee only works if agent IDs are meaningfully distinct. If multiple instances all report as `"claude"`, the lock is effectively "is this task already in-progress?" rather than "is this MY task." That's still correct behavior — if it's claimed, it's taken.

---

### 6. Notes policy not communicated to LLM — will get generic boilerplate

**Lifecycle spec lines 506-515**: "NO auto-injected system notes. Notes are meaningful context written by the agent doing the work":
- Decisions made and why (chose A over B because X)
- Summary of rejection feedback addressed
- Constraints discovered during work
- Or "No additional context" for straightforward docs

**What the MCP does**:
- `server.py:388-393` — Notes description says "Contextual notes about the submission. Required. Describes what was done and why."
- This is vague. Does not prohibit generic notes like "Document submitted" or "Updating content."

**Impact**: Without explicit guidance, LLMs default to unhelpful boilerplate notes, defeating the purpose of the notes system.

**Fix direction**: Update the `notes` field description in `SubmitDocumentInput` with clear examples and anti-patterns.

Good notes:
- "Chose REST over GraphQL because the existing client uses fetch and all endpoints are simple CRUD"
- "Addressed rejection feedback: added error handling section and expanded the dependency list per reviewer comments"
- "Discovered that the SQLite driver doesn't support concurrent writes — documented as a constraint"
- "No additional notes — straightforward document, nothing unexpected" (when there genuinely isn't anything meaningful to add)

Bad notes (explicitly prohibit):
- "Document submitted" / "Updated content" / "Completed the document" (generic summaries of the action itself)
- "Filling out the codebase survey" (just restating the task title)
- Copy-pasting the document content as notes

The key distinction: notes capture **context that isn't in the document itself** — decisions, tradeoffs, rejection feedback addressed, surprises encountered. If none of that applies, say so honestly rather than padding with boilerplate.

---

### 7. AUDIT.md is stale — re-run after all TODO fixes are implemented

The previous audit verified SPEC.md vs server.py conformance (211/211) but never cross-referenced the lifecycle spec. It's now irrelevant — this TODO has identified 16+ issues including new features, renames, and behavioral changes.

**Action**: Run a fresh audit after all TODO items are implemented. The new audit must cross-reference both `SPEC.md` and `Planning/SPEC_milestone-lifecycle.md`.

---

## MINOR

### 8. Phase 4 incomplete — no evaluation.xml created

**MCP-builder SKILL.md** requires 4 phases. Phase 4 (Evaluations) was never completed.

- `SPEC.md section 12` documents the evaluation plan with 10 draft question categories
- `agentboard_mcp/evaluation.xml` does not exist
- The evaluation harness at `.claude/skills/mcp-builder/scripts/evaluation.py` was never run

**Fix direction**: Create evaluation.xml with 10 QA pairs per SPEC.md section 12, then run the evaluation harness.

---

### 9. getNextTask docstring leaks internal implementation details

**Problem**: The `agentboard_get_next_task` docstring (`server.py:912-916`) exposes a 4-tier internal priority order:

```
Priority order:
1. In-progress milestones (agent resuming unfinished work)
2. In-progress implementation tasks
3. Ready milestones (next phase work)
4. Ready implementation tasks
```

The agent has **no control** over this ordering. `getNextTask` returns a single task — the agent can't select, skip, or reorder. This is internal server sorting logic that the LLM cannot act on.

At best it's noise. At worst it causes the agent to overthink ("should I check for in-progress milestones before calling this?"). The answer is always: just call it, get your task, work on it.

**Fix direction**: Strip the priority list. Replace with a simple description: "Returns the next task you should work on. The server determines priority automatically."

---

### 10. Add response_format parameter to read-only tools — reduce agent confusion

**mcp_best_practices.md lines 65-81**: Recommends supporting JSON and Markdown formats.

**Problem**: JSON-only responses force agents to parse raw JSON blobs. When agents struggle to interpret the response, they assume the tool is broken and go rogue — attempting to access MCP source files to "fix" a perfectly working tool. This has been observed with Gemini making hyper-specific RAG queries, getting zero results (correct behavior), and then trying to modify the MCP files.

**Fix direction**: Add an optional `response_format` parameter (`json` | `markdown`, default `json`) to all read-only tools. When set to `markdown`, return a human/LLM-readable formatted response instead of raw JSON.

Read-only tools that need this:
- `agentboard_get_project` / `agentboard_list_projects`
- `agentboard_list_tasks` / `agentboard_get_next_task`
- `agentboard_get_document` / `agentboard_list_documents`
- `agentboard_get_activity_log`
- `agentboard_health_check` / `agentboard_server_status`

This is a usability fix, not a feature. The easier the tool output is to consume, the less likely an agent is to go off on a tangent.

---

### 11. Add outputSchema to all tools — no guessing about response shape

All tools return `str` (JSON-serialized). The agent has no schema telling it what fields to expect back — it has to call the tool and parse whatever comes back. This is another source of confusion that leads to agents second-guessing the tool.

**Fix direction**: Define `outputSchema` for every tool. Each tool should declare the exact shape of its response so the agent knows what it's getting before it calls the tool. This pairs with issue 10 (response_format) — together they make tool responses predictable and unambiguous.

**Scope**: All 19 tools in `server.py`.

---

### 17. Missing `agentboard_get_task` tool — no way to read a single task by ID

The API supports reading individual tasks but there's no dedicated MCP tool for it. Currently an agent has to use `agentboard_list_tasks` and filter, or rely on the task being returned from `getNextTask`.

**Why this matters**: If an agent needs to check the status of a specific task (e.g., after a disconnect, or to inspect a dependency), it has no direct way to do it.

**Fix direction**: Add `agentboard_get_task(task_id)` — simple read-only tool, returns a single task object by ID.

---

## INFO

### 12. Phase 9 gap correctly documented

MCP SPEC.md section 7 correctly identifies that milestone tasks are only seeded for phases 1-8, and Phase 9's task_breakdown document must be handled manually. This is useful documentation not present in the lifecycle spec.

### 13. server.py has 19 tools (2 extra vs spec)

SPEC.md specifies 17 tools. server.py implements 19 — the 2 extras are `agentboard_server_status` (line 1627) and `agentboard_stop_server` (line 1675). These are useful additions for agent workflow (start/status/stop server management).

---

## NEW FEATURE — NEEDS SPEC

### 15. Agent review workflow — agents review and correct docs, human approves

**Problem**: Right now `update_document` lets anyone approve or reject a document. There's no distinction between a human clicking Approve in the UI and an agent calling `update_document` with `status: "approved"`. An agent could rubber-stamp its own work. Additionally, docs often need corrections that exceed the original agent's context window — a second agent needs to be able to pick up and fix the doc.

**What's needed**: A review workflow where reviewer agents can read, correct, and resubmit documents, but **only the human has final approve/reject authority**. The review workflow is an **option** — not mandatory for every doc.

**Two workflows, human always decides**:

*Simple workflow (human reviews directly):*
1. Agent submits → doc status: `submitted`
2. Human reads it, rejects with feedback → doc status: `rejected`
3. Any agent calls `getNextTask`, gets the milestone, sees feedback
4. Agent revises, resubmits → doc status: `submitted`
5. Human approves → `approved`

*Review workflow (reviewer agent assists):*
1. Agent submits → doc status: `submitted`
2. Human chooses to send it to reviewer agent(s) instead of rejecting
3. Reviewer agent (with review access key) reads doc, makes corrections, resubmits → stays `submitted`
4. Human reads improved version, approves or rejects
5. If rejected → goes back to the pool for any agent, OR human runs another review

**Access control via review key**:
- Standard agents: `"claude"`, `"gemini"` — can claim templates, submit docs, normal workflow
- Reviewer agents: identified by an access key (e.g., in system prompt) — same permissions plus can modify `submitted` docs
- `submitted` docs are **locked** to standard agents. Only reviewer agents and the human can touch them
- This prevents a random agent from overwriting a submitted doc that's under review

**Rejection behavior (both workflows)**:
- If the original agent is still waiting (held connection) → they get the rejection response directly
- If they're gone → milestone goes back to the pool via `getNextTask` for any agent to pick up
- Human can also choose to run another review round instead of rejecting

**Needs a proper spec before implementation**:
- Review access key design (how is it issued, validated, what format)
- Review tool design (new MCP tool? or does the reviewer use existing `submit_document` with their key?)
- UI for triggering a review vs rejecting directly
- Guard on `update_document` to prevent agents from approving/rejecting (human-only)
- How reviewer corrections are tracked/attributed
- Whether multiple reviewer agents can work the same doc simultaneously

**Related**: Issue 1 (AgentID) must be fixed first — reviews need real attribution. Issue 16 (rename `draft` → `submitted`) must happen first for status names to make sense.

---

### 16. Rename document status `draft` → `submitted`

**Problem**: The document status `draft` is misleading. When an agent submits a document, it's supposed to be a complete, finished document ready for review — not a draft. The status should reflect that the agent is done and the doc is waiting for human action.

**Rename**: `draft` → `submitted`

**Updated document lifecycle**:

| Status | Meaning | Who can modify |
|--------|---------|---------------|
| `template` | Blank scaffold, agent hasn't touched it | Any agent |
| `submitted` | Agent filled it out and submitted — locked | Reviewer agents only (via access key) |
| `approved` | Human approved, done | Nobody |
| `rejected` | Human rejected, needs rework | Any agent (back in the pool) |
| `superseded` | Replaced by newer version (future use) | N/A |

**Updated transitions**:

| From | To | Trigger |
|------|-----|---------|
| `template` → `submitted` | Agent submits for first time |
| `rejected` → `submitted` | Agent revises and resubmits |
| `submitted` → `approved` | Human approves |
| `submitted` → `rejected` | Human rejects |
| `submitted` → `submitted` | Reviewer agent makes corrections (content changes, status unchanged) |

**Files that need updating**:
- DB schema CHECK constraint (`phase_documents.status`)
- `milestoneSync.js` transition mapping (`template->draft` → `template->submitted`, etc.)
- `documents.js` route (submit sets status to `'draft'` → `'submitted'`)
- MCP `server.py` docstrings + `SPEC.md`
- Frontend status badges/display
- `Planning/SPEC_milestone-lifecycle.md`

---

## REVIEW NEEDED

### 14. Full MCP docstring review — do tool descriptions match how AgentBoard actually works?

**Context**: Issue 9 revealed that the `getNextTask` docstring exposes internal sorting logic the agent can't act on. This raises a broader concern: are other tool descriptions written from the server's perspective rather than the agent's?

The MCP tools are the **only interface** an LLM agent has with AgentBoard. Every docstring needs to be written for the agent's actual workflow — not as a mirror of the server implementation. The agent doesn't need to know HOW the server works internally, it needs to know WHAT to do and WHAT to expect back.

**Review checklist for every tool docstring**:
- Does it describe what the agent should DO, not how the server works internally?
- Does it leak implementation details the agent can't act on? (priority lists, internal state machines, sort orders)
- Does it match the actual AgentBoard workflow? (call getNextTask → get one task → work on it → submit → wait)
- Is it simple enough that an LLM won't overthink or second-guess the system?

**Scope**: All 19 tool docstrings in `server.py`.

---

## Summary

| Severity | Count | Key Themes |
|----------|-------|------------|
| CRITICAL | 2 | AgentID attribution broken; audit gave false confidence |
| MAJOR | 7 | Edge cases/errors not actionable; multi-agent locking; notes policy vague; disconnect recovery; audit stale; add outputSchema; add response_format |
| NEW FEATURE | 3 | Agent review workflow (needs spec); rename `draft` → `submitted`; add `get_task` tool |
| MINOR | 2 | Evaluation missing; docstring leaks internals |
| REVIEW | 1 | Full MCP docstring review — do tools match actual AgentBoard workflow? |
| INFO | 2 | Phase 9 gap documented; extra tools acceptable |
| **Total** | **17** | |
