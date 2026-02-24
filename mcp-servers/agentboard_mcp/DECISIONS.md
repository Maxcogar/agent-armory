# AgentBoard MCP — Design Decisions

Captured from a full review session on 2026-02-22. This document explains the **reasoning** behind every item in `TODO.md`. The TODO says what to fix; this doc says why, how we got there, and what the user (project owner) expects.

Read this alongside `TODO.md` before implementing anything.

---

## Core Philosophy

The user's #1 priority: **the MCP must work FOR the agent, not make the agent work to understand it.** Every decision below flows from this principle.

Real-world observation driving this: Gemini made a hyper-specific RAG query, got zero results (correct behavior), and then assumed the MCP tool was broken. It started searching the filesystem trying to access and "fix" the MCP source files. Claude has done similar things — getting a vague error and going on a tangent instead of moving forward. This is not a hypothetical risk. It has happened repeatedly.

The MCP is the **only interface** an LLM agent has with AgentBoard. If it's confusing, vague, or leaks implementation details, agents will misbehave. Every tool description, error message, and response format must be clear enough that no agent ever needs to look under the hood.

---

## Implementation Order (Agreed)

This order matters — later items depend on earlier ones.

1. **Rename `draft` → `submitted`** (issue 16) — Everything else builds on correct naming. Don't write new code against the wrong status.
2. **AgentID required on mutating tools** (issue 1) — Issues 3, 5, and 15 all need to know who's calling.
3. **getNextTask fixes** (issues 3, 5, 9) — All touch the same endpoint. Do together.
4. **Actionable errors + notes policy** (issues 4, 6) — Docstring/error improvements. Quick wins.
5. **outputSchema + response_format** (issues 10, 11) — Usability layer on top of everything.
6. **Full docstring review** (issue 14) — Only after all tool behavior has changed.
7. **Review workflow spec** (issue 15) — Biggest new feature. All dependencies in place by now.
8. **Audit + evaluation** (issues 2, 7, 8) — Run last, against the finished product.

---

## Decision: AgentID is REQUIRED, not optional (Issue 1)

**What was proposed by previous agents**: Either (a) make `agent_id` an optional parameter with a default, or (b) require each agent to run its own MCP server instance with a different env var.

**Why both were rejected**: The entire point of the attribution system is to know WHO did WHAT. Making it optional means it'll never be set (agents take the path of least resistance). Running separate server instances is an ops burden that doesn't solve the per-call problem.

**What the user wants**: `agent_id` is a required parameter on every mutating tool. Period. You call `submit_document`, you tell us who you are. The `AGENTBOARD_AGENT_ID` env var and static `X-Agent-Id` header are removed entirely.

**Caveat the user raised**: Agent IDs like `"claude"` aren't truly unique — three Claude instances all say `"claude"`. The user accepts this. The ID is for attribution (knowing which MODEL did the work), not for unique session tracking. For locking purposes (issue 5), the check is "is this task in-progress?" not "is this MY task."

---

## Decision: `getNextTask` returns ONE task, not a menu (Issues 3, 5, 9)

**Context**: The original TODO and lifecycle spec describe a "4-tier priority order" that was baked into the tool docstring. We discussed this at length.

**Key realization**: `getNextTask` gives the agent ONE task. There's no menu, no selection, no list. The agent calls it, gets a task, works on it. The internal priority sorting is implementation detail the agent can't act on.

**What changed**:
- Issue 9: Strip the priority list from the docstring. Replace with "Returns the next task you should work on."
- Issue 5: If a task is in-progress (claimed by anyone), skip it. The agent gets the next unclaimed ready task.
- Issue 3: If the agent has a document in `review` status, return a message like "Document X is in Review, awaiting results" — don't silently give them a different task or a confusing 404.

**Abandoned task handling**: If an agent claims a task and disappears, the task is stuck in-progress. The human manually resets it to `ready` from the UI. `getNextTask` does NOT silently reassign abandoned tasks — that's the human's call.

---

## Decision: Document status `draft` → `submitted` (Issue 16)

**Why**: When an agent submits a document, it's supposed to be a complete, finished document. Calling it "draft" implies it's unfinished or in-progress. The user explicitly said: "that's not what I would call a draft."

**The full document lifecycle**:

| Status | Meaning | Who can modify |
|--------|---------|---------------|
| `template` | Blank scaffold — agent hasn't touched it | Any agent |
| `submitted` | Agent filled it out and submitted — **locked** | Reviewer agents only (via access key) |
| `approved` | Human approved, done | Nobody |
| `rejected` | Human rejected, needs rework | Any agent (back in the pool via getNextTask) |
| `superseded` | Replaced by newer version (future use) | N/A |

**Critical point**: `submitted` means LOCKED. Standard agents cannot modify a submitted document. Only reviewer agents (with an access key) and the human can touch it. This prevents one agent from overwriting another agent's submitted work.

---

## Decision: Two review workflows, human always decides (Issue 15)

**Background**: The user's real-world experience is that docs often need corrections that exceed the original agent's context window. By the time a doc needs revision, the agent that wrote it is often out of context. A different agent needs to pick it up.

**Simple workflow (human reviews directly)**:
1. Agent submits → `submitted`
2. Human reads, rejects with feedback → `rejected`
3. Any agent picks it up via `getNextTask`, sees feedback
4. Agent revises, resubmits → `submitted`
5. Human approves → `approved`

**Review workflow (reviewer agent assists)**:
1. Agent submits → `submitted`
2. Human chooses to send it to a reviewer agent instead of rejecting
3. Reviewer agent (with access key) reads, corrects, resubmits → stays `submitted`
4. Human reads improved version, approves or rejects
5. If rejected → back to pool for any agent, OR human runs another review

**Key design points**:
- The review workflow is an **option**, not mandatory. Simple docs can go through the simple workflow.
- **Only the human can approve or reject**. Agents cannot call `update_document` with `status: "approved"`. This must be enforced.
- Reviewer agents have elevated access via an access key (design TBD in spec). Standard agents are locked out of `submitted` docs.
- Rejection always goes back to the open pool — any agent that calls `getNextTask` can pick it up.
- Human can choose to run another review round instead of rejecting.

**This needs a full spec before implementation.** Open questions listed in TODO issue 15.

---

## Decision: Every error must be actionable (Issue 4)

**The problem is real**: Agents receiving vague errors like `400 INVALID_DOCUMENT_STATUS` don't know what to do. They go searching through the filesystem trying to "fix" the MCP tool itself. This has been observed multiple times.

**Principle**: Every error response tells the agent (1) what happened and (2) what to do next.

**Example**:
- Bad: `"Document must be in 'template' or 'rejected' status to submit. Current: 'submitted'"`
- Good: `"This document has already been submitted and is awaiting review. Call getNextTask to get your next available work."`

**Also agreed**: There's no meaningful difference between "two agents submit simultaneously" and "agent submits a doc that's already submitted." In both cases, the doc is no longer in a submittable state. One error message, one clear instruction.

---

## Decision: Notes are for context, not summaries (Issue 6)

**Why notes exist**: The user added the notes feature because it's genuinely useful — notes capture decisions, tradeoffs, and context that isn't in the document itself.

**The problem**: The current docstring just says "Describes what was done and why." LLMs interpret this as permission to write "Document submitted" or "Updated the codebase survey." These are useless.

**What the user wants**:

Good notes:
- "Chose REST over GraphQL because the existing client uses fetch and all endpoints are simple CRUD"
- "Addressed rejection feedback: added error handling section and expanded the dependency list"
- "Discovered that the SQLite driver doesn't support concurrent writes — documented as a constraint"
- "No additional notes — straightforward document, nothing unexpected"

Bad notes (explicitly prohibit):
- "Document submitted" / "Updated content" / "Completed the document"
- "Filling out the codebase survey" (restating the task title)
- Copy-pasting document content as notes

**Key nuance**: If an agent genuinely has nothing meaningful to add, it should say so honestly ("No additional notes") rather than padding with a work summary. The user explicitly said: "I don't want them thinking that putting a work summary as a default is a good option."

---

## Decision: outputSchema + response_format are usability fixes (Issues 10, 11)

**These were originally INFO/no-action items.** Upgraded to MAJOR based on the user's real experience with agents going rogue when they can't parse responses.

**response_format** (issue 10): Add `json` | `markdown` option to read-only tools. When an agent requests markdown, it gets readable text instead of a JSON blob. Less parsing confusion = less chance of the agent assuming the tool is broken.

**outputSchema** (issue 11): Define the exact response shape for every tool. The agent knows what fields to expect BEFORE it calls the tool. No guessing, no surprises.

Together these eliminate the entire category of "agent couldn't understand the response so it went off the rails."

---

## Decision: Add `agentboard_get_task` tool (Issue 17)

Found during evaluation work. Currently there's no MCP tool to read a single task by ID. Agents have to `list_tasks` and filter, or rely on `getNextTask`. This is a gap — especially for checking task status after disconnects or inspecting dependencies.

Simple addition: `agentboard_get_task(task_id)` → returns one task.

---

## Decision: Audit runs LAST (Issues 2, 7, 8)

The previous audit is stale — it checked SPEC.md vs server.py conformance but never cross-referenced the lifecycle spec. With 17 issues identified (including renames, new features, and behavioral changes), running an audit now would be testing against code that's about to change.

The evaluation.xml has been created (10 QA pairs) but the harness hasn't been run. Same logic — run it against the finished product, not the current state.

**New audit requirements**: Must cross-reference both `SPEC.md` and `Planning/SPEC_milestone-lifecycle.md`.

---

## Things NOT to do

These came up during discussion and were explicitly decided against:

1. **Don't make agent_id optional with a default.** Every previous agent suggested this. The user rejected it every time. Required means required.
2. **Don't expose internal priority/sort logic in docstrings.** The agent doesn't control it and can't act on it. It's noise that causes overthinking.
3. **Don't let `getNextTask` silently reassign abandoned tasks.** That's the human's decision. Manual reset via UI.
4. **Don't let agents approve or reject documents.** Human-only action. The review workflow gives agents a way to contribute feedback and corrections, but the approve/reject button is the human's alone.
5. **Don't document recovery scenarios in docstrings.** The recovery path is always the same (call `getNextTask`), and the server should handle review state properly so the agent doesn't need to know about disconnects/restarts.
6. **Don't run the audit or evaluation until all fixes are implemented.** Test the finished product, not the work-in-progress.

---

## Migration: Existing projects on older AgentBoard versions

**Existing project data will NOT work with the new version without a migration.** The user has an ongoing project using a previous version of AgentBoard. This must be handled.

**What breaks**:
- `draft` → `submitted` rename (issue 16): SQLite CHECK constraint on `phase_documents.status` must be recreated. Existing docs with `status = 'draft'` would violate the new constraint.
- Review workflow (issue 15): Any new columns or tables won't exist in the old DB.
- AgentID (issue 1): Historical data will still show `"mcp-agent"` for all attribution fields. Nothing breaks, but old entries won't have real attribution. This is acceptable — you can't retroactively fix who did what.

**Migration script required** (run as part of the update):
1. Update all `phase_documents` rows where `status = 'draft'` → `status = 'submitted'`
2. Recreate `phase_documents` table with new CHECK constraint (SQLite can't ALTER CHECK — must create new table, copy data, drop old, rename new)
3. Add any new columns/tables from the review workflow
4. Verify data integrity after migration

**Important**: The migration must be written and tested BEFORE deployment. Include it as a step in the implementation plan — don't leave it as an afterthought. The user should be able to update AgentBoard and have their existing project continue working seamlessly.

---

## Files referenced in this session

| File | Why |
|------|-----|
| `agentboard_mcp/server.py` | All 19 MCP tool definitions, docstrings, input models |
| `agentboard_mcp/SPEC.md` | MCP specification (needs updating after fixes) |
| `agentboard_mcp/AUDIT.md` | Previous audit (stale, re-run after fixes) |
| `agentboard_mcp/TODO.md` | The companion to this doc — lists all 17 issues |
| `Planning/SPEC_milestone-lifecycle.md` | Upstream requirements spec — source of truth |
| `server/src/db/tasks.js` | `getNextTask()` implementation (lines 102-143) |
| `server/src/routes/documents.js` | Submit-and-wait endpoint, pendingReviews map |
| `server/src/milestoneSync.js` | Document → milestone transition mapping |
| `server/src/middleware/agentId.js` | Current agentId extraction from headers |

---

## Verification: Evaluation Harness

`agentboard_mcp/evaluation.xml` was created during this session with 10 QA pairs. The harness has NOT been run yet — it needs the Express server running on port 3000 and a test project in the database.

**To run the evaluation after all fixes are implemented**:

```bash
# 1. Start the AgentBoard server
npm run dev

# 2. Create a test project (if none exists)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "X-Agent-Id: eval-setup" \
  -d '{"name":"Eval Test Project","project_type":"new_feature","idea":"Test project for MCP evaluation"}'

# 3. Install eval dependencies
pip install -r .claude/skills/mcp-builder/scripts/requirements.txt

# 4. Set API key
export ANTHROPIC_API_KEY=your_key_here

# 5. Run the evaluation
python .claude/skills/mcp-builder/scripts/evaluation.py \
  -t stdio \
  -c python \
  -a agentboard_mcp/server.py \
  -e AGENTBOARD_URL=http://localhost:3000/api \
  -e AGENTBOARD_AGENT_ID=eval-agent \
  -o agentboard_mcp/eval_report.md \
  agentboard_mcp/evaluation.xml
```

**Important**: The evaluation questions were written against the CURRENT MCP. After implementing all TODO fixes (especially the `draft` → `submitted` rename and new tools), the evaluation.xml will need updating to match the new behavior. Run the fresh audit (issue 7) and update the evaluation at the same time.

---

**Date**: 2026-02-22
**Participants**: User (project owner), Claude Opus 4.6
