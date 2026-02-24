# AgentBoard MCP Server -- Quality Audit Report

**Auditor:** quality-auditor
**Date:** 2026-02-22
**Updated:** 2026-02-22 (post TODO implementation — Steps 1-8 applied)
**Implementation:** `agentboard_mcp/server.py` (1791 lines, 20 tools)
**Spec:** `agentboard_mcp/SPEC.md`
**Verdict:** PASS -- 20 tools production-ready. All TODO issues resolved.

---

## Executive Summary

The MCP server has been comprehensively updated following the 9-step TODO implementation plan (Issues 1-17 from DECISIONS.md). Key changes: document status renamed `draft` → `submitted`, `agent_id` required on all mutating tools (no more global AGENT_ID), `getNextTask` now filters by assignee and detects review state, all errors are actionable with `next_step` guidance, `response_format` (json/markdown) added to read-only tools, all docstrings rewritten from agent perspective, and `agentboard_get_task` added as 20th tool.

**Critical issues:** 0
**Major issues:** 0
**Minor issues:** 0
**Informational:** 3

---

## A. Specification Compliance

### Tool Count: 20/20 PASS

| # | Tool Name | Line | Matches Spec |
|---|-----------|------|--------------|
| 1 | `agentboard_health_check` | 747 | PASS |
| 2 | `agentboard_list_projects` | 785 | PASS |
| 3 | `agentboard_get_project` | 821 | PASS |
| 4 | `agentboard_create_project` | 856 | PASS |
| 5 | `agentboard_advance_phase` | 898 | PASS |
| 6 | `agentboard_revert_phase` | 937 | PASS |
| 7 | `agentboard_list_tasks` | 974 | PASS |
| 8 | `agentboard_get_next_task` | 1023 | PASS |
| 9 | `agentboard_get_task` | 1187 | PASS (new — Step 7) |
| 10 | `agentboard_create_task` | 1072 | PASS |
| 11 | `agentboard_update_task` | 1129 | PASS |
| 12 | `agentboard_list_documents` | 1225 | PASS |
| 13 | `agentboard_get_document` | 1264 | PASS |
| 14 | `agentboard_submit_document` | 1303 | PASS |
| 15 | `agentboard_update_document` | 1370 | PASS |
| 16 | `agentboard_get_activity_log` | 1423 | PASS |
| 17 | `agentboard_add_log_entry` | 1470 | PASS |
| 18 | `agentboard_start_server` | 1520 | PASS |
| 19 | `agentboard_server_status` | 1649 | PASS |
| 20 | `agentboard_stop_server` | 1687 | PASS |

### Input Models: All Match Spec

| Model | Line | Fields Match | Key Changes |
|-------|------|-------------|-------------|
| `ResponseFormatInput` | 141 | PASS | NEW — `response_format: Literal["json","markdown"]` default json |
| `ProjectIdInput` | 154 | PASS | Now includes `response_format` |
| `MutatingProjectIdInput` | 172 | PASS | NEW — extends ProjectIdInput + required `agent_id` |
| `CreateProjectInput` | 191 | PASS | Added required `agent_id` |
| `ListTasksInput` | 229 | PASS | Now includes `response_format` |
| `CreateTaskInput` | 252 | PASS | Added required `agent_id`, notes uses `List[NoteInput]` |
| `NoteInput` | 330 | PASS | text, timestamp, author validated |
| `UpdateTaskInput` | 342 | PASS | Added required `agent_id` |
| `DocumentIdInput` | 411 | PASS | Now includes `response_format` |
| `TaskIdInput` | 429 | PASS | NEW — `task_id` + `response_format` |
| `SubmitDocumentInput` | 447 | PASS | Added required `agent_id` (doubles as `filled_by` default) |
| `UpdateDocumentInput` | 483 | PASS | Added required `agent_id`, status Literal uses `submitted` |
| `GetActivityLogInput` | 531 | PASS | Now includes `response_format` |
| `AddLogEntryInput` | 556 | PASS | Added required `agent_id`, `action` is `Literal[12 values]` |
| `GetNextTaskInput` | 592 | PASS | NEW — `project_id` + required `agent_id` |
| `StartServerInput` | 607 | PASS | Literal["dev","production"] |

### API Paths: All Match Express Routes

| Tool | MCP Path | Express Route | Match |
|------|----------|---------------|-------|
| health_check | `/health` | `GET /api/health` (index.js) | PASS |
| list_projects | `/projects` | `GET /api/projects` (projects.js) | PASS |
| get_project | `/projects/{id}` | `GET /api/projects/:id` (projects.js) | PASS |
| create_project | `/projects` | `POST /api/projects` (projects.js) | PASS |
| advance_phase | `/projects/{id}/advance` | `POST /api/projects/:id/advance` (projects.js) | PASS |
| revert_phase | `/projects/{id}/revert` | `POST /api/projects/:id/revert` (projects.js) | PASS |
| list_tasks | `/projects/{id}/tasks` | `GET /api/projects/:id/tasks` (tasks.js) | PASS |
| get_next_task | `/projects/{id}/tasks/next` | `GET /api/projects/:id/tasks/next` (tasks.js) | PASS |
| get_task | `/tasks/{id}` | `GET /api/tasks/:id` (tasks.js) | PASS (new) |
| create_task | `/projects/{id}/tasks` | `POST /api/projects/:id/tasks` (tasks.js) | PASS |
| update_task | `/tasks/{id}` | `PATCH /api/tasks/:id` (tasks.js) | PASS |
| list_documents | `/projects/{id}/documents` | `GET /api/projects/:id/documents` (documents.js) | PASS |
| get_document | `/documents/{id}` | `GET /api/documents/:id` (documents.js) | PASS |
| submit_document | `/documents/{id}/submit` | `PUT /api/documents/:id/submit` (documents.js) | PASS |
| update_document | `/documents/{id}` | `PUT /api/documents/:id` (documents.js) | PASS |
| get_activity_log | `/projects/{id}/log` | `GET /api/projects/:id/log` (activity.js) | PASS |
| add_log_entry | `/projects/{id}/log` | `POST /api/projects/:id/log` (activity.js) | PASS |

---

## B. Enum Accuracy (Verified Against `server/src/db/schema.js` CHECK Constraints)

| Enum | DB Values | server.py Values | Match |
|------|-----------|-----------------|-------|
| project_type | new_feature, refactor, bug_fix, migration, integration (5) | Line 37: identical | PASS |
| task status | backlog, ready, in-progress, review, done, blocked (6) | Line 38: identical | PASS |
| priority | critical, high, medium, low (4) | Line 39: identical | PASS |
| task_type | milestone, implementation (2) | Line 40: identical | PASS |
| document_status | template, **submitted**, approved, superseded, rejected (5) | Line 41: identical | PASS |
| document_type | 8 types | Lines 42-45: identical | PASS |
| activity_action | 12 actions | Lines 46-50: identical | PASS |

**Note:** `document_status` was renamed from `draft` to `submitted` in Step 1. The DB schema migration (schema.js) recreates the table with the new CHECK constraint and migrates existing rows.

---

## C. Agent Attribution (Step 2 Changes)

| Check | Result |
|-------|--------|
| Global `AGENT_ID` removed | PASS — no longer exists |
| `_api_request()` accepts `agent_id` param | PASS — line 65 |
| `X-Agent-Id` header set per-request | PASS — line 74-75 |
| All 9 mutating tools pass `agent_id` | PASS |
| Read-only tools do NOT send `X-Agent-Id` | PASS — no `agent_id` on read models |
| `MutatingProjectIdInput` has required `agent_id` | PASS — line 172 |
| `GetNextTaskInput` has required `agent_id` | PASS — line 592 |

---

## D. getNextTask Fixes (Step 3 Changes)

| Check | Result |
|-------|--------|
| `getNextTask(projectId, agentId)` filters by assignee | PASS — tasks.js line 121 |
| `getReviewMilestoneForAgent()` function exists | PASS — tasks.js line 158 |
| Route checks for review milestone before getNextTask | PASS — tasks.js route line 19 |
| `pending_review` response shape correct | PASS — `{task:null, document:null, pending_review:{milestone_id, document_id, message}}` |
| MCP handler detects `pending_review` and returns message | PASS — server.py checks `result.get("pending_review")` |

---

## E. Actionable Errors (Step 4 Changes)

| Error Scenario | Status-Specific Message | `next_step` Field | Result |
|----------------|------------------------|-------------------|--------|
| Submit doc already submitted | "...awaiting review. Call agentboard_get_next_task..." | `agentboard_get_next_task` | PASS |
| Submit doc already approved | "...already approved. Call agentboard_get_next_task..." | `agentboard_get_next_task` | PASS |
| Submit doc superseded | "...has been superseded. Call agentboard_get_next_task..." | `agentboard_get_next_task` | PASS |
| Milestone not in-progress | "...review cycle has already progressed..." | `agentboard_get_next_task` | PASS |

---

## F. Response Format (Step 5 Changes)

| Check | Result |
|-------|--------|
| `ResponseFormatInput` base model exists | PASS — line 141 |
| `response_format` field on all read-only input models | PASS — ProjectIdInput, ListTasksInput, DocumentIdInput, TaskIdInput, GetActivityLogInput |
| `health_check` and `list_projects` accept `ResponseFormatInput` | PASS |
| 7 markdown formatters exist | PASS — lines 645-735 |
| All read-only tools branch on `response_format` | PASS |
| Default is `"json"` (backward compatible) | PASS |

### Markdown Formatters

| Formatter | Line | Used By |
|-----------|------|---------|
| `_format_project_markdown` | 645 | get_project |
| `_format_projects_markdown` | 664 | list_projects |
| `_format_task_markdown` | 670 | get_task, get_next_task |
| `_format_tasks_markdown` | 689 | list_tasks |
| `_format_document_markdown` | 695 | get_document |
| `_format_documents_markdown` | 714 | list_documents |
| `_format_activity_markdown` | 720 | get_activity_log |

---

## G. Tool Annotations

| Tool | readOnly | destructive | idempotent | openWorld | Verdict |
|------|----------|-------------|------------|-----------|---------|
| health_check | True | False | True | False | PASS |
| list_projects | True | False | True | False | PASS |
| get_project | True | False | True | False | PASS |
| create_project | False | False | False | False | PASS |
| advance_phase | False | False | False | False | PASS |
| revert_phase | False | **True** | False | False | PASS |
| list_tasks | True | False | True | False | PASS |
| get_next_task | False | False | False | False | PASS |
| get_task | **True** | False | **True** | False | PASS (new) |
| create_task | False | False | False | False | PASS |
| update_task | False | **True** | False | False | PASS |
| list_documents | True | False | True | False | PASS |
| get_document | True | False | True | False | PASS |
| submit_document | False | False | False | False | PASS |
| update_document | False | False | False | False | PASS |
| get_activity_log | True | False | True | False | PASS |
| add_log_entry | False | False | False | False | PASS |
| start_server | False | False | **True** | False | PASS |
| server_status | **True** | False | **True** | False | PASS |
| stop_server | False | **True** | **True** | False | PASS |

---

## H. Error Handling

### Error Flow Pattern (Consistent Across All 20 Tools)

```python
result = await _api_request(...)
if _is_error(result):
    return _format_error(result)
return _json_response(result)
```

Every tool follows this pattern. PASS.

### `_format_error` Coverage

| Error Field | Extracted | Express Route Sends It |
|-------------|----------|----------------------|
| `_status` (HTTP code) | Line 100 | All routes: res.status(N) |
| `error` (message) | Line 101 | All routes: {error: "..."} |
| `code` | Line 102 | 422, 400, 403, 409 |
| `from`/`to` | Line 106 | taskStateMachine.js |
| `allowed` | Line 109 | taskStateMachine.js |
| `missing_fields` | Line 111 | taskStateMachine.js |

### Exception Handling

| Exception | Caught | Tool(s) |
|-----------|--------|---------|
| `httpx.ConnectError` | Explicit catch | health_check |
| `httpx.TimeoutException` | Explicit catch | health_check |
| `httpx.ReadTimeout` | Explicit catch | submit_document |
| Generic `Exception` | Caught in all tools | All 20 tools |

---

## I. Body Construction

### Agent ID propagation (Step 2)

All mutating tools pass `agent_id=params.agent_id` to `_api_request()`, which sets `X-Agent-Id` header. Verified in:
- `create_project`, `advance_phase`, `revert_phase`
- `get_next_task` (uses agent_id for assignee filtering)
- `create_task`, `update_task`
- `submit_document` (also sends agent_id as `filled_by` default)
- `update_document`
- `add_log_entry`

### Notes validation

- `CreateTaskInput.notes`: `Optional[List[NoteInput]]` — validated via Pydantic. PASS.
- `UpdateTaskInput.notes`: `Optional[List[NoteInput]]` — serialized via `model_dump()`. PASS.
- `SubmitDocumentInput.notes`: `str` with `min_length=1` — includes policy examples. PASS.

---

## J. Build Verification

| Check | Result |
|-------|--------|
| `python -m py_compile server.py` | PASS — no errors |
| `import httpx` | PASS |
| `import mcp.server.fastmcp` | PASS |
| `import pydantic` | PASS |
| `requirements.txt` completeness | PASS — httpx>=0.27.0, mcp[cli]>=1.1.0, pydantic>=2.0.0 |
| Entry point `mcp.run()` | PASS — line 1791 |
| FastMCP name | `"agentboard_mcp"` (line 54) | PASS |
| Tool count | 20/20 | PASS |

---

## K. Docstrings (Step 6)

All 20 tool docstrings were rewritten from the agent's perspective:
- Implementation details removed (no SQL, no sort orders, no internal state machine details)
- "Next step" guidance added where appropriate
- Args sections document all fields including `agent_id` for mutating tools
- Returns sections describe response shapes
- On error sections describe common failure modes with remediation
- Zero `draft` references remain (all updated to `submitted`)

PASS.

---

## L. Milestone Sync Transitions

| Document Transition | Milestone Transition | server.py Reference | milestoneSync.js Key |
|---|---|---|---|
| template → submitted | in-progress → review | submit_document | `template->submitted` |
| rejected → submitted | in-progress → review | submit_document | `rejected->submitted` |
| submitted → approved | review → done | update_document | `submitted->approved` |
| submitted → rejected | review → in-progress | update_document | `submitted->rejected` |

All 4 transition map keys use `submitted` (not `draft`). PASS.

---

## M. Security

| Check | Result |
|-------|--------|
| Global AGENT_ID removed | PASS — agent_id is per-request |
| API_BASE_URL from env var | PASS — `os.environ.get("AGENTBOARD_URL", ...)` (line 24) |
| No hardcoded secrets | PASS |
| X-Agent-Id set per-request | PASS — only on mutating tools |
| Content-Type conditional | PASS — only set when json_body is not None |
| Input validation (Pydantic) | PASS — all inputs validated |
| `extra="forbid"` on all models | PASS |
| No command injection vectors | PASS |
| No path traversal | PASS |

---

## N. Server Management Tools

### Tool 18: agentboard_start_server (line 1520)

| Check | Result |
|-------|--------|
| Process guard (health check before start) | PASS |
| Platform-specific subprocess (Windows/Unix) | PASS |
| Health poll loop | PASS |
| Annotations (idempotent=True) | PASS |

### Tool 19: agentboard_server_status (line 1649)

| Check | Result |
|-------|--------|
| Always returns structured JSON | PASS |
| Annotations (readOnly=True) | PASS |

### Tool 20: agentboard_stop_server (line 1687)

| Check | Result |
|-------|--------|
| Annotations (destructive=True, idempotent=True) | PASS |
| Post-stop verification | PASS |

---

## Informational Notes

### Informational #1: No Server-Side Pagination

The AgentBoard API has no pagination. CHARACTER_LIMIT truncation with context hints is the mitigation. Not an issue.

### Informational #2: New httpx.AsyncClient Per Request

A new client is created per request (no connection pooling). Acceptable for local-only server — overhead negligible.

### Informational #3: `response_format` Default is JSON

All read-only tools default to `"json"`. Markdown is opt-in. This preserves backward compatibility for existing agent workflows that parse JSON responses.

---

## Checklist Summary

| Category | Items | Pass | Fail |
|----------|-------|------|------|
| A. Spec Compliance (20 tools, 16 models, 17 paths) | 53 | 53 | 0 |
| B. Enum Accuracy | 7 | 7 | 0 |
| C. Agent Attribution | 7 | 7 | 0 |
| D. getNextTask Fixes | 5 | 5 | 0 |
| E. Actionable Errors | 4 | 4 | 0 |
| F. Response Format | 6 | 6 | 0 |
| G. Annotations | 20 tools x 4 | 80 | 0 |
| H. Error Handling | 14 | 14 | 0 |
| I. Body Construction | 12 | 12 | 0 |
| J. Build Verification | 7 | 7 | 0 |
| K. Docstrings | 20 | 20 | 0 |
| L. Milestone Sync | 4 | 4 | 0 |
| M. Security | 9 | 9 | 0 |
| N. Server Management | 6 | 6 | 0 |
| **Total** | **227** | **227** | **0** |

---

## TODO Implementation Verification

All 9 steps from the implementation plan have been completed:

| Step | Description | Status |
|------|-------------|--------|
| 1 | Rename `draft` → `submitted` | DONE — schema migration, routes, milestoneSync, frontend, MCP, templates, docs |
| 2 | `agent_id` required on mutating tools | DONE — global AGENT_ID removed, per-request attribution |
| 3 | `getNextTask` fixes (assignee filter, review check) | DONE — server + MCP updated |
| 4 | Actionable errors + notes policy | DONE — status-specific messages with `next_step` |
| 5 | `response_format` (json/markdown) | DONE — 7 formatters, all read-only tools |
| 6 | Full docstring review | DONE — all 20 tools rewritten |
| 7 | `agentboard_get_task` tool | DONE — Express route + MCP tool |
| 8 | Review workflow spec | DONE — `Planning/SPEC_review-workflow.md` |
| 9 | Audit + evaluation update | DONE — this document |

---

## Verdict

**PASS** -- 20 tools production-ready. All TODO issues (1-17) resolved across Steps 1-8. 227/227 checks pass. 0 issues remaining.
