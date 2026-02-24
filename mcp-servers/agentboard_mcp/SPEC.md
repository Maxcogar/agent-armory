# AgentBoard MCP Server Specification

> **Process alignment:** This spec follows the 4-phase workflow from `.claude/skills/mcp-builder/SKILL.md`:
> Phase 1 (Research/Planning) and Phase 2 (Implementation) are covered by sections 1-11.
> Phase 3 (Review/Test) is covered by section 10.
> Phase 4 (Evaluations) is covered by section 12.

## 1. Language Decision: Python / FastMCP

### Recommendation: Python with FastMCP

**Note:** SKILL.md recommends TypeScript as the default. We override this recommendation for the following project-specific reasons:

**Why NOT TypeScript for this project:**
- TypeScript requires a build step (`tsc`), `tsconfig.json`, `package.json`, and a `dist/` directory -- overhead for 17 tools wrapping a local REST API
- The AgentBoard Express server already occupies the Node.js ecosystem. A Python MCP server creates a clean separation of concerns with zero risk of dependency conflicts
- The TypeScript SDK's `registerTool` requires manual Zod schema definitions that are more verbose than Pydantic's decorator-based auto-schema generation
- The `submit-and-wait` endpoint holds HTTP connections open for minutes -- Python's `httpx` supports per-request timeout overrides trivially without creating a persistent client

**Why Python/FastMCP is superior here:**

1. **Pydantic validation** -- AgentBoard has complex input schemas with interdependent fields, strict enums, and conditional requirements (e.g. `rejection_feedback` required only when `status=rejected`). Pydantic v2 models with `field_validator` handle this naturally and generate MCP `inputSchema` automatically.

2. **Async HTTP** -- `httpx.AsyncClient` provides clean async HTTP with configurable timeouts per-request. The `/documents/:id/submit` endpoint holds the connection open indefinitely, requiring a very long timeout (600s+).

3. **FastMCP decorator pattern** -- `@mcp.tool()` with annotations, automatic schema generation from Pydantic models, and docstring-to-description mapping reduces boilerplate significantly.

4. **Simpler project structure** -- Single-file layout. No build step, no tsconfig, no dist directory. `python server.py` or `mcp.run()` is the only command needed.

5. **Evaluation compatibility** -- The evaluation harness (`scripts/evaluation.py`) is Python and uses `mcp` client to connect via stdio. A Python MCP server integrates seamlessly: `python scripts/evaluation.py -t stdio -c python -a server.py evaluation.xml`.

---

## 2. Project Structure

```
agentboard_mcp/
  SPEC.md              # This file (Phase 1 output)
  server.py            # Main entry point -- all tools, models, API client (Phase 2 output)
  requirements.txt     # httpx, mcp[cli], pydantic
  evaluation.xml       # 10 QA pairs for eval harness (Phase 4 output)
  README.md            # Usage instructions (generated after implementation)
```

**Evaluation scripts** are provided by the mcp-builder skill at:
```
.claude/skills/mcp-builder/scripts/
  evaluation.py        # Evaluation harness (drives Claude to answer questions using MCP tools)
  connections.py       # MCP client connection factories (stdio, SSE, HTTP)
  requirements.txt     # anthropic>=0.39.0, mcp>=1.1.0
  example_evaluation.xml  # Example eval format
```

**Single-file rationale:** The MCP server has 17 tools with shared constants and one API client function. Splitting into multiple files adds complexity without benefit. If the file exceeds ~800 lines, extract `models.py` and `api.py`.

---

## 3. Constants

```python
API_BASE_URL = "http://localhost:3000/api"      # Configurable via env var AGENTBOARD_URL
DEFAULT_AGENT_ID = "mcp-agent"                  # Configurable via env var AGENTBOARD_AGENT_ID
DEFAULT_TIMEOUT = 30.0                          # seconds, for normal requests
SUBMIT_TIMEOUT = 600.0                          # seconds, for document submit-and-wait
CHARACTER_LIMIT = 25000                         # max response size before truncation

# Enums (verified from DB CHECK constraints in schema.js)
PROJECT_TYPES = ["new_feature", "refactor", "bug_fix", "migration", "integration"]
TASK_STATUSES = ["backlog", "ready", "in-progress", "review", "done", "blocked"]
PRIORITIES = ["critical", "high", "medium", "low"]
TASK_TYPES = ["milestone", "implementation"]
DOCUMENT_STATUSES = ["template", "submitted", "approved", "superseded", "rejected"]
DOCUMENT_TYPES = ["codebase_survey", "requirements", "constraints", "risk_assessment", "architecture", "contracts", "test_strategy", "task_breakdown"]
ACTIVITY_ACTIONS = ["project_created", "phase_approved", "task_created", "task_started", "task_completed", "task_updated", "note_added", "document_filled", "document_approved", "document_superseded", "document_rejected", "log_entry"]

PHASES = [
    {"n": 1, "name": "Initialization"},
    {"n": 2, "name": "Codebase Survey", "doc": "codebase_survey"},
    {"n": 3, "name": "Requirements", "doc": "requirements"},
    {"n": 4, "name": "Constraints", "doc": "constraints"},
    {"n": 5, "name": "Risk Assessment", "doc": "risk_assessment"},
    {"n": 6, "name": "Architecture", "doc": "architecture"},
    {"n": 7, "name": "Contracts", "doc": "contracts"},
    {"n": 8, "name": "Test Strategy", "doc": "test_strategy"},
    {"n": 9, "name": "Task Breakdown", "doc": "task_breakdown"},
    {"n": 10, "name": "Implementation"},
    {"n": 11, "name": "Verification"},
    {"n": 12, "name": "Review"},
    {"n": 13, "name": "Complete"},
]
```

---

## 4. API Client Design

```python
import httpx
import os
import json

API_BASE_URL = os.environ.get("AGENTBOARD_URL", "http://localhost:3000/api")
AGENT_ID = os.environ.get("AGENTBOARD_AGENT_ID", "mcp-agent")

async def api_request(
    method: str,
    path: str,
    json_body: dict | None = None,
    params: dict | None = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> dict | list:
    """Make an HTTP request to the AgentBoard API.

    `path` is relative to API_BASE_URL (which includes /api).
    Example: pass "/projects" not "/api/projects".

    Returns the parsed JSON response body.
    Raises on non-2xx status with structured error info.
    """
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method,
            f"{API_BASE_URL}{path}",
            json=json_body,
            params=params,
            headers={
                "Content-Type": "application/json",
                "X-Agent-Id": AGENT_ID,
            },
            timeout=timeout,
        )
        if response.status_code >= 400:
            try:
                error_body = response.json()
            except Exception:
                error_body = {"error": response.text}
            # Return error dict with status code embedded
            return {"_error": True, "_status": response.status_code, **error_body}
        return response.json()


def format_error(result: dict) -> str:
    """Format an API error result into a human-readable error string."""
    status = result.get("_status", "unknown")
    error = result.get("error", "Unknown error")
    code = result.get("code", "")
    extra = ""
    if result.get("from") and result.get("to"):
        extra += f"\nTransition: {result['from']} -> {result['to']}"
    if result.get("allowed"):
        extra += f"\nAllowed transitions: {result['allowed']}"
    if result.get("missing_fields"):
        extra += f"\nMissing fields: {result['missing_fields']}"
    return f"Error ({status}): {error}" + (f" [{code}]" if code else "") + extra


def is_error(result) -> bool:
    """Check if an API response is an error."""
    return isinstance(result, dict) and result.get("_error") is True
```

---

## 5. Complete Tool List

### 5.1 Health

#### `agentboard_health_check`

| Field | Value |
|-------|-------|
| **Description** | Check if the AgentBoard server is running and responsive. Returns server status and timestamp. |
| **HTTP** | `GET /api/health` |
| **Input Schema** | (none) |
| **Output** | `{"status": "ok", "timestamp": "<ISO8601>"}` |
| **Annotations** | `readOnlyHint=True, destructiveHint=False, idempotentHint=True, openWorldHint=False` |
| **Errors** | Connection refused if server is not running |

---

### 5.2 Projects

#### `agentboard_list_projects`

| Field | Value |
|-------|-------|
| **Description** | List all projects in AgentBoard. Returns an array of project objects sorted by creation date (newest first). |
| **HTTP** | `GET /api/projects` |
| **Input Schema** | (none) |
| **Output** | Array of project objects: `[{id, name, project_type, idea, current_phase, target_project_path, created_at, updated_at}]` |
| **Annotations** | `readOnlyHint=True, destructiveHint=False, idempotentHint=True, openWorldHint=False` |
| **Errors** | None (returns empty array if no projects) |

#### `agentboard_get_project`

| Field | Value |
|-------|-------|
| **Description** | Get a single project by ID. Returns the full project object including current phase and metadata. |
| **HTTP** | `GET /api/projects/:id` |
| **Input Schema** | `project_id: str` (required, UUID) |
| **Output** | `{id, name, project_type, idea, current_phase, target_project_path, created_at, updated_at}` |
| **Annotations** | `readOnlyHint=True, destructiveHint=False, idempotentHint=True, openWorldHint=False` |
| **Errors** | 404: `{"error": "Project not found"}` |

#### `agentboard_create_project`

| Field | Value |
|-------|-------|
| **Description** | Create a new project. This initializes the project with phase 1, creates all phase document templates, and seeds milestone tasks for phases 1-8. Phase 1 milestone is auto-completed; Phase 2 milestone starts as 'ready'. |
| **HTTP** | `POST /api/projects` |
| **Input Schema** | |

```python
class CreateProjectInput(BaseModel):
    name: str = Field(..., description="Project name", min_length=1, max_length=200)
    project_type: Literal["new_feature", "refactor", "bug_fix", "migration", "integration"] = Field(
        ..., description="Type of project. Determines which document templates are generated."
    )
    idea: str = Field(..., description="Description of the project idea/goal", min_length=1)
    target_project_path: Optional[str] = Field(
        default=None,
        description="Optional filesystem path to the target project being managed"
    )
```

| Field | Value |
|-------|-------|
| **Output** | Full project object (same as get_project) with `current_phase=1` |
| **Annotations** | `readOnlyHint=False, destructiveHint=False, idempotentHint=False, openWorldHint=False` |
| **Errors** | 400: `{"error": "name, project_type, and idea are required"}`, 400: `{"error": "project_type must be one of: ..."}` |

#### `agentboard_advance_phase`

| Field | Value |
|-------|-------|
| **Description** | Advance a project to the next phase. For phases 2-9, the phase document must have status 'approved' before advancing. Fails if already at phase 13. Logs a 'phase_approved' activity entry. |
| **HTTP** | `POST /api/projects/:id/advance` |
| **Input Schema** | `project_id: str` (required, UUID) |
| **Output** | Updated project object with incremented `current_phase` |
| **Annotations** | `readOnlyHint=False, destructiveHint=False, idempotentHint=False, openWorldHint=False` |
| **Errors** | 404: project not found, 400: `{"error": "Already at final phase"}`, 400: `{"error": "Phase N document must be approved before advancing"}` |

#### `agentboard_revert_phase`

| Field | Value |
|-------|-------|
| **Description** | Revert a project to the previous phase. Fails if already at phase 1. Logs a 'phase_approved' activity entry (note: the action name is reused). |
| **HTTP** | `POST /api/projects/:id/revert` |
| **Input Schema** | `project_id: str` (required, UUID) |
| **Output** | Updated project object with decremented `current_phase` |
| **Annotations** | `readOnlyHint=False, destructiveHint=True, idempotentHint=False, openWorldHint=False` |
| **Errors** | 404: project not found, 400: `{"error": "Already at phase 1"}` |

---

### 5.3 Tasks

#### `agentboard_get_task`

| Field | Value |
|-------|-------|
| **Description** | Get full details for a single task by ID. Use this to check a task's current status, read its notes, see acceptance criteria, or inspect its dependencies before updating it. |
| **HTTP** | `GET /api/tasks/:id` |
| **Input Schema** | `task_id: str` (required, UUID) |
| **Output** | Full task object: `{id, project_id, title, description, acceptance_criteria, constraints, contracts, test_expectations, status, phase, assignee, depends_on[], priority, task_type, document_id, files_touched[], notes[{text,timestamp,author}], previous_status, created_at, updated_at}` |
| **Annotations** | `readOnlyHint=True, destructiveHint=False, idempotentHint=True, openWorldHint=False` |
| **Errors** | 404: `{"error": "Task not found"}` |

#### `agentboard_list_tasks`

| Field | Value |
|-------|-------|
| **Description** | List tasks for a project, optionally filtered by status and/or phase. Returns tasks sorted by creation date ascending. JSON fields (depends_on, files_touched, notes) are parsed into arrays/objects. |
| **HTTP** | `GET /api/projects/:id/tasks?status=X&phase=Y` |
| **Input Schema** | |

```python
class ListTasksInput(BaseModel):
    project_id: str = Field(..., description="Project UUID")
    status: Optional[Literal["backlog", "ready", "in-progress", "review", "done", "blocked"]] = Field(
        default=None, description="Filter by task status"
    )
    phase: Optional[int] = Field(default=None, description="Filter by phase number (1-13)", ge=1, le=13)
```

| Field | Value |
|-------|-------|
| **Output** | Array of task objects: `[{id, project_id, title, description, acceptance_criteria, constraints, contracts, test_expectations, status, phase, assignee, depends_on[], priority, task_type, document_id, files_touched[], notes[{text, timestamp, author}], previous_status, created_at, updated_at}]` |
| **Annotations** | `readOnlyHint=True, destructiveHint=False, idempotentHint=True, openWorldHint=False` |
| **Errors** | None (returns empty array if no tasks match) |

#### `agentboard_get_next_task`

| Field | Value |
|-------|-------|
| **Description** | Get the next actionable task for a project. Auto-claims 'ready' tasks by transitioning to 'in-progress' and setting the assignee. Returns both the task and linked document (if milestone). Priority order: (1) in-progress milestones, (2) in-progress implementation tasks, (3) ready milestones, (4) ready implementation tasks. Tasks with unsatisfied dependencies are excluded. |
| **HTTP** | `GET /api/projects/:id/tasks/next` |
| **Input Schema** | `project_id: str` (required, UUID) |
| **Output** | `{"task": <task_object>, "document": <document_object_or_null>}` |
| **Annotations** | `readOnlyHint=False, destructiveHint=False, idempotentHint=False, openWorldHint=False` |
| **Errors** | 404: `{"error": "No tasks available"}` |
| **Notes** | If auto-claim validation fails (e.g. missing acceptance_criteria on seed data), the task is returned as-is without status change. **Multi-agent caveat**: getNextTask does NOT filter by assignee. If another agent already claimed a task (in-progress), this endpoint returns it to any agent. The caller should check `task.assignee` to detect if the task belongs to a different agent. |

#### `agentboard_create_task`

| Field | Value |
|-------|-------|
| **Description** | Create a new task in a project. The task starts in 'backlog' status by default. Logs a 'task_created' activity entry. |
| **HTTP** | `POST /api/projects/:id/tasks` |
| **Input Schema** | |

```python
class CreateTaskInput(BaseModel):
    project_id: str = Field(..., description="Project UUID")
    title: str = Field(..., description="Task title", min_length=1)
    description: Optional[str] = Field(default=None, description="Detailed task description")
    acceptance_criteria: Optional[str] = Field(default=None, description="Criteria that must be met for task completion")
    constraints: Optional[str] = Field(default=None, description="Constraints or limitations for this task")
    contracts: Optional[str] = Field(default=None, description="Interface contracts this task must satisfy")
    test_expectations: Optional[str] = Field(default=None, description="Expected test behavior")
    status: Optional[Literal["backlog", "ready"]] = Field(default=None, description="Initial status (backlog or ready only)")
    phase: Optional[int] = Field(default=None, description="Phase number (1-13)", ge=1, le=13)
    assignee: Optional[str] = Field(default=None, description="Agent or user assigned to this task")
    depends_on: Optional[List[str]] = Field(default=None, description="List of task UUIDs this task depends on")
    priority: Optional[Literal["critical", "high", "medium", "low"]] = Field(default=None, description="Task priority (default: medium)")
    task_type: Optional[Literal["milestone", "implementation"]] = Field(default=None, description="Task type (default: implementation)")
    document_id: Optional[str] = Field(default=None, description="Linked phase document UUID (for milestone tasks)")
    files_touched: Optional[List[str]] = Field(default=None, description="List of file paths touched by this task")
    notes: Optional[List[dict]] = Field(default=None, description="Initial notes [{text, timestamp, author}]")
```

| Field | Value |
|-------|-------|
| **Output** | Created task object |
| **Annotations** | `readOnlyHint=False, destructiveHint=False, idempotentHint=False, openWorldHint=False` |
| **Errors** | 400: `{"error": "title is required"}` |

#### `agentboard_update_task`

| Field | Value |
|-------|-------|
| **Description** | Update a task. This is the primary tool for task state transitions. The server validates all status transitions through the state machine. Notes and files_touched use APPEND semantics (new items are added to existing arrays, not replacing them). Logs appropriate activity entries for status changes and note additions. |
| **HTTP** | `PATCH /api/tasks/:id` |
| **Input Schema** | |

```python
class NoteInput(BaseModel):
    text: str = Field(..., description="Note content")
    timestamp: str = Field(..., description="ISO8601 timestamp")
    author: str = Field(..., description="Who wrote the note")

class UpdateTaskInput(BaseModel):
    task_id: str = Field(..., description="Task UUID to update")
    title: Optional[str] = Field(default=None, description="New title")
    description: Optional[str] = Field(default=None, description="New description")
    acceptance_criteria: Optional[str] = Field(default=None, description="New acceptance criteria")
    constraints: Optional[str] = Field(default=None, description="New constraints")
    contracts: Optional[str] = Field(default=None, description="New contracts")
    test_expectations: Optional[str] = Field(default=None, description="New test expectations")
    status: Optional[Literal["backlog", "ready", "in-progress", "review", "done", "blocked"]] = Field(
        default=None,
        description="New status. Must follow state machine transitions: backlog->[ready,blocked], ready->[backlog,in-progress,blocked], in-progress->[ready,review,blocked], review->[in-progress,done,blocked], done->[] (final), blocked->[previous_status only]. Guards: ready->in-progress requires assignee+acceptance_criteria, in-progress->review requires notes, review->done requires notes."
    )
    phase: Optional[int] = Field(default=None, description="Phase number (1-13)", ge=1, le=13)
    assignee: Optional[str] = Field(default=None, description="Assignee name/id")
    priority: Optional[Literal["critical", "high", "medium", "low"]] = Field(default=None, description="Priority level")
    depends_on: Optional[List[str]] = Field(default=None, description="Replace dependency list (full replacement, not append)")
    files_touched: Optional[List[str]] = Field(default=None, description="File paths to ADD (append semantics)")
    notes: Optional[List[NoteInput]] = Field(default=None, description="Notes to ADD (append semantics). Each note needs {text, timestamp, author}")
```

| Field | Value |
|-------|-------|
| **Output** | Updated task object |
| **Annotations** | `readOnlyHint=False, destructiveHint=True, idempotentHint=False, openWorldHint=False` |
| **Errors** | 404: task not found, 422: state machine violation `{"valid": false, "error": "...", "code": "INVALID_TRANSITION", "from": "...", "to": "...", "allowed": [...], "missing_fields": [...]}` |

**State Machine Rules (for description):**
```
Transitions:
  backlog    -> [ready, blocked]
  ready      -> [backlog, in-progress, blocked]
  in-progress -> [ready, review, blocked]
  review     -> [in-progress, done, blocked]
  done       -> [] (FINAL - no changes allowed)
  blocked    -> [previous_status only]

Guards:
  ready -> in-progress: requires 'assignee' and 'acceptance_criteria' to be non-empty
  in-progress -> review: requires 'notes' array to have at least one entry
  review -> done: requires 'notes' array to have at least one entry

Blocked behavior:
  When transitioning TO blocked: previous_status is auto-saved
  When transitioning FROM blocked: can only go to previous_status
```

---

### 5.4 Documents

#### `agentboard_list_documents`

| Field | Value |
|-------|-------|
| **Description** | List all phase documents for a project, sorted by phase ascending. Each project has documents for phases 2-9 (created at project creation from templates). |
| **HTTP** | `GET /api/projects/:id/documents` |
| **Input Schema** | `project_id: str` (required, UUID) |
| **Output** | Array: `[{id, project_id, phase, document_type, title, content, status, filled_by, rejection_feedback, created_at, updated_at}]` |
| **Annotations** | `readOnlyHint=True, destructiveHint=False, idempotentHint=True, openWorldHint=False` |
| **Errors** | None (empty array if no documents) |

#### `agentboard_get_document`

| Field | Value |
|-------|-------|
| **Description** | Get a single phase document by ID. Returns the full document including markdown content, status, and rejection feedback if applicable. |
| **HTTP** | `GET /api/documents/:id` |
| **Input Schema** | `document_id: str` (required, UUID) |
| **Output** | `{id, project_id, phase, document_type, title, content, status, filled_by, rejection_feedback, created_at, updated_at}` |
| **Annotations** | `readOnlyHint=True, destructiveHint=False, idempotentHint=True, openWorldHint=False` |
| **Errors** | 404: `{"error": "Document not found"}` |

#### `agentboard_submit_document`

| Field | Value |
|-------|-------|
| **Description** | Submit a completed document for human review. This is the agent's primary document workflow tool. It updates the document content, sets status to 'submitted', runs milestoneSync (moves linked milestone from in-progress to review), and then HOLDS THE HTTP RESPONSE OPEN until a human approves or rejects the document. The response contains the review result. Only documents in 'template' or 'rejected' status can be submitted. The linked milestone must be in 'in-progress' status. WARNING: This call can take minutes to complete as it waits for human review. |
| **HTTP** | `PUT /api/documents/:id/submit` |
| **Input Schema** | |

```python
class SubmitDocumentInput(BaseModel):
    document_id: str = Field(..., description="Document UUID to submit")
    content: Optional[str] = Field(
        default=None,
        description="Updated document content (markdown). If omitted, existing content is preserved."
    )
    filled_by: Optional[str] = Field(
        default=None,
        description="Who filled the document. Defaults to the agent ID from headers."
    )
    notes: str = Field(
        ...,
        description="Contextual notes about the submission. Required. Describes what was done and why.",
        min_length=1,
    )
```

| Field | Value |
|-------|-------|
| **Output (approved)** | `{"result": "approved", "document": <doc>, "milestone": <task_or_null>, "nextTask": <task_or_null>}` |
| **Output (rejected)** | `{"result": "rejected", "feedback": "<rejection_reason>", "document": <doc>, "milestone": <task_or_null>, "notes": [<milestone_notes>]}` |
| **Annotations** | `readOnlyHint=False, destructiveHint=False, idempotentHint=False, openWorldHint=False` |
| **Errors** | 400: `{"error": "notes field is required for document submission", "code": "MISSING_NOTES"}`, 404: document not found, 400: `{"error": "Document must be in 'template' or 'rejected' status...", "code": "INVALID_DOCUMENT_STATUS"}`, 409: `{"error": "Milestone is not in-progress...", "code": "MILESTONE_NOT_IN_PROGRESS"}` |
| **Timeout** | `SUBMIT_TIMEOUT = 600` seconds (10 minutes) |

#### `agentboard_update_document`

| Field | Value |
|-------|-------|
| **Description** | Update a document's content, status, or metadata. This is the human/admin tool for approving, rejecting, or editing documents. When changing status to 'approved' or 'rejected', milestoneSync auto-transitions the linked milestone. Rejection requires rejection_feedback. If an agent is waiting on submit-and-wait, the response is sent to them. |
| **HTTP** | `PUT /api/documents/:id` |
| **Input Schema** | |

```python
class UpdateDocumentInput(BaseModel):
    document_id: str = Field(..., description="Document UUID to update")
    content: Optional[str] = Field(default=None, description="Updated document content (markdown)")
    status: Optional[Literal["template", "submitted", "approved", "superseded", "rejected"]] = Field(
        default=None, description="New document status"
    )
    filled_by: Optional[str] = Field(default=None, description="Who filled/updated the document")
    title: Optional[str] = Field(default=None, description="Updated document title")
    rejection_feedback: Optional[str] = Field(
        default=None,
        description="Required when status='rejected'. Explains why the document was rejected."
    )
```

| Field | Value |
|-------|-------|
| **Output** | Updated document object |
| **Annotations** | `readOnlyHint=False, destructiveHint=False, idempotentHint=False, openWorldHint=False` |
| **Errors** | 404: document not found, 400: `{"error": "rejection_feedback is required when rejecting a document", "code": "MISSING_REJECTION_FEEDBACK"}` |
| **Notes** | **Known limitation**: If a document is approved via this tool but the linked milestone has no notes (because the agent did not use `agentboard_submit_document` which attaches notes), the `review->done` milestone transition will silently fail (notes guard requires at least one note). The milestone stays in `review` even though the document is `approved`. Normal workflow: agents should always use `agentboard_submit_document` to submit documents, which attaches notes and ensures milestones transition correctly. |

---

### 5.5 Activity Log

#### `agentboard_get_activity_log`

| Field | Value |
|-------|-------|
| **Description** | Get the activity log for a project. Returns audit trail entries sorted by timestamp descending (newest first). Can filter by actor and/or action type. |
| **HTTP** | `GET /api/projects/:id/log?actor=X&action=Y` |
| **Input Schema** | |

```python
class GetActivityLogInput(BaseModel):
    project_id: str = Field(..., description="Project UUID")
    actor: Optional[str] = Field(default=None, description="Filter by actor name/id")
    action: Optional[Literal[
        "project_created", "phase_approved", "task_created", "task_started",
        "task_completed", "task_updated", "note_added", "document_filled",
        "document_approved", "document_superseded", "document_rejected", "log_entry"
    ]] = Field(default=None, description="Filter by action type")
```

| Field | Value |
|-------|-------|
| **Output** | Array: `[{id, project_id, timestamp, actor, action, target, detail}]` |
| **Annotations** | `readOnlyHint=True, destructiveHint=False, idempotentHint=True, openWorldHint=False` |
| **Errors** | None (empty array) |

#### `agentboard_add_log_entry`

| Field | Value |
|-------|-------|
| **Description** | Add a custom entry to the activity log. The actor is set from the X-Agent-Id header. Use action='log_entry' for freeform log messages. |
| **HTTP** | `POST /api/projects/:id/log` |
| **Input Schema** | |

```python
class AddLogEntryInput(BaseModel):
    project_id: str = Field(..., description="Project UUID")
    action: Literal[
        "project_created", "phase_approved", "task_created", "task_started",
        "task_completed", "task_updated", "note_added", "document_filled",
        "document_approved", "document_superseded", "document_rejected", "log_entry"
    ] = Field(
        ...,
        description="Action type. Use 'log_entry' for custom messages. Must be one of the 12 valid action types (matches DB CHECK constraint). Invalid values cause a 500 error from the API."
    )
    target: Optional[str] = Field(default=None, description="Target entity UUID (task, document, etc.)")
    detail: Optional[str] = Field(default=None, description="Human-readable detail message")
```

| Field | Value |
|-------|-------|
| **Output** | Created log entry: `{id, project_id, timestamp, actor, action, target, detail}` |
| **Annotations** | `readOnlyHint=False, destructiveHint=False, idempotentHint=False, openWorldHint=False` |
| **Errors** | 400: `{"error": "action is required"}` |

---

### 5.6 Server Management

#### `agentboard_start_server`

| Field | Value |
|-------|-------|
| **Description** | Start the AgentBoard server if it is not already running. First checks the health endpoint to determine if the server is already up. If healthy, returns the existing status without restarting (process guard). If not running, starts the server as a background subprocess and waits briefly for it to become healthy. Uses `npm run dev` (development, with file watching and client) or `npm start` (production, server only). |
| **HTTP** | N/A (subprocess management, not an API call) |
| **Input Schema** | |

```python
class StartServerInput(BaseModel):
    mode: Literal["dev", "production"] = Field(
        default="dev",
        description="Server mode. 'dev' runs `npm run dev` (server + client with hot reload, ports 3000 + 5173). 'production' runs `npm start` (server only, port 3000, requires prior `npm run build`)."
    )
```

| Field | Value |
|-------|-------|
| **Output** | `{"status": "already_running", "health": {"status": "ok", "timestamp": "..."}}` if server was already healthy. `{"status": "started", "mode": "dev", "pid": <int>, "message": "Server started successfully"}` if newly started. `{"status": "failed", "error": "Server did not become healthy within timeout"}` if start failed. |
| **Annotations** | `readOnlyHint=False, destructiveHint=False, idempotentHint=True, openWorldHint=True` |
| **Errors** | Start failure if npm is not available or dependencies not installed |

**Implementation notes:**
- Working directory for subprocess: `C:\Users\maxco\Documents\Project-Manager\Project-Manager-Latest\Project-Manager`
- `npm run dev` starts both server (:3000) and client (:5173) via `concurrently`
- `npm start` starts server only (:3000) via `node src/index.js` in server/
- Health check: `GET http://localhost:3000/api/health` with short timeout (5s)
- After starting subprocess, poll health endpoint every 1s for up to 15s
- Subprocess must be detached / non-blocking (use `asyncio.create_subprocess_exec` with stdout/stderr piped to devnull or a log file)
- **Process guard**: ALWAYS check health first. If healthy, return `already_running` immediately. Never kill an existing process.

**npm command details** (verified from package.json):
```
npm run dev  → concurrently -n server,client "npm run dev --prefix server" "npm run dev --prefix client"
             → server: node --watch src/index.js (port 3000)
             → client: vite dev (port 5173)

npm start    → npm start --prefix server
             → node src/index.js (port 3000 only)
```

---

## 6. State Machine Rules

The MCP server does NOT enforce the state machine itself -- the AgentBoard REST API does. However, the MCP tool descriptions MUST document the rules so the LLM understands valid transitions.

### Transition Map
```
backlog      -> [ready, blocked]
ready        -> [backlog, in-progress, blocked]
in-progress  -> [ready, review, blocked]
review       -> [in-progress, done, blocked]
done         -> []                              # FINAL, cannot change ANY field
blocked      -> [<previous_status>]             # can ONLY return to previous_status
```

### Guards (fields required before transition is allowed)
```
ready -> in-progress:
  - assignee must be non-empty string
  - acceptance_criteria must be non-empty string

in-progress -> review:
  - notes must be a non-empty array (at least one note)

review -> done:
  - notes must be a non-empty array (at least one note)
```

### Blocked behavior
- When transitioning TO 'blocked': `previous_status` is automatically saved by the server
- When transitioning FROM 'blocked': can ONLY go to `previous_status` (or 'ready' if previous_status is null)
- `previous_status` is cleared when unblocking

### Error response on violation (HTTP 422)
```json
{
  "valid": false,
  "error": "Cannot move from \"backlog\" to \"done\"",
  "code": "INVALID_TRANSITION",
  "from": "backlog",
  "to": "done",
  "allowed": ["ready", "blocked"],
  "missing_fields": []
}
```

---

## 7. Milestone System

Milestone tasks (`task_type='milestone'`) are linked to phase documents via `document_id`. The server's `milestoneSync.js` handles automatic transitions:

| Document transition | Milestone transition | Additional action |
|---|---|---|
| template -> submitted | in-progress -> review | Agent notes attached to milestone |
| rejected -> submitted | in-progress -> review | Agent notes attached to milestone |
| submitted -> approved | review -> done | Next milestone backlog -> ready |
| submitted -> rejected | review -> in-progress | Agent retries |

### Agent workflow
1. `agentboard_get_next_task` -- auto-claims the next ready milestone
2. `agentboard_submit_document` -- submit document content, response held until review
3. Human approves/rejects via `agentboard_update_document`
4. Agent receives `{result: 'approved'|'rejected', ...}` from the held response

### Phase 9 gap

Milestone tasks are seeded for phases 1-8 only (`server/src/templates/milestoneTasks.js`). Phase 9 (Task Breakdown) has a document template but NO milestone task. Since `advancePhase()` checks `doc.status === 'approved'` for phases 2-9 inclusive, the Phase 9 document must still be approved before advancing. However, the milestone auto-transition workflow will NOT apply for Phase 9 -- the agent must manually use `agentboard_update_document` (or `agentboard_submit_document`) to get the task_breakdown document approved, then call `agentboard_advance_phase`. Phases 10-13 have no documents or milestones.

---

## 8. Pagination Strategy

The AgentBoard API does NOT implement pagination on any endpoint. All list endpoints return complete result sets. The MCP server should:

1. **NOT add artificial pagination** -- the API doesn't support it
2. **Implement CHARACTER_LIMIT truncation** -- if a response exceeds 25,000 characters:
   - For task lists: truncate the array and add a message like "Showing N of M tasks. Use status or phase filters to narrow results."
   - For activity logs: truncate and suggest using action/actor filters
   - For document content: truncate with "Content truncated at 25000 characters."

---

## 9. Response Formatting

All tools return `str` (JSON-serialized). The format is always JSON for maximum compatibility with agent workflows. Key formatting rules:

1. **Success responses**: Return the raw API response JSON, pretty-printed with 2-space indent
2. **Error responses**: Return structured error with status code, message, and remediation hints
3. **Arrays**: Include a summary header like `"Found N tasks"` before the data
4. **Large content**: Check CHARACTER_LIMIT and truncate with clear message

---

## 10. Implementation Checklist (Phase 2 + Phase 3)

### Phase 2: Implementation
- [ ] Server initialization: `mcp = FastMCP("agentboard_mcp")`
- [ ] Environment variable support: `AGENTBOARD_URL`, `AGENTBOARD_AGENT_ID`
- [ ] Shared `api_request()` function with configurable timeout
- [ ] Shared `format_error()` and `is_error()` helpers
- [ ] All 17 tools implemented with proper Pydantic models
- [ ] All tools have annotations (readOnlyHint, destructiveHint, idempotentHint, openWorldHint)
- [ ] All tools have comprehensive docstrings (these become the tool descriptions in MCP)
- [ ] `agentboard_submit_document` uses extended timeout (600s)
- [ ] CHARACTER_LIMIT truncation for large responses
- [ ] `requirements.txt` with: `httpx`, `mcp[cli]`, `pydantic`
- [ ] `if __name__ == "__main__": mcp.run()` at bottom of server.py

### Phase 3: Review and Test
- [ ] No duplicated code (DRY -- shared api_request, format_error, is_error)
- [ ] Consistent error handling across all tools
- [ ] Full type coverage (Pydantic models for all inputs)
- [ ] Clear, descriptive tool names and descriptions
- [ ] Verify syntax: `python -m py_compile server.py`
- [ ] Test with MCP Inspector: `npx @modelcontextprotocol/inspector`
- [ ] Verify all 17 tools appear in tool list
- [ ] Test at least one read tool and one write tool end-to-end

---

## 11. Tool Summary Table

> **Path convention**: The "Path" column shows the full Express route (e.g., `/api/projects`). When calling `api_request()`, strip the `/api` prefix since `API_BASE_URL` already includes it. Example: `api_request("GET", "/projects")` not `api_request("GET", "/api/projects")`.

| # | Tool Name | HTTP Method | Path | Read-Only | Destructive |
|---|-----------|-------------|------|-----------|-------------|
| 1 | `agentboard_health_check` | GET | /api/health | Yes | No |
| 2 | `agentboard_list_projects` | GET | /api/projects | Yes | No |
| 3 | `agentboard_get_project` | GET | /api/projects/:id | Yes | No |
| 4 | `agentboard_create_project` | POST | /api/projects | No | No |
| 5 | `agentboard_advance_phase` | POST | /api/projects/:id/advance | No | No |
| 6 | `agentboard_revert_phase` | POST | /api/projects/:id/revert | No | Yes |
| 7 | `agentboard_list_tasks` | GET | /api/projects/:id/tasks | Yes | No |
| 8 | `agentboard_get_next_task` | GET | /api/projects/:id/tasks/next | No | No |
| 9 | `agentboard_get_task` | GET | /api/tasks/:id | Yes | No |
| 10 | `agentboard_create_task` | POST | /api/projects/:id/tasks | No | No |
| 11 | `agentboard_update_task` | PATCH | /api/tasks/:id | No | Yes |
| 12 | `agentboard_list_documents` | GET | /api/projects/:id/documents | Yes | No |
| 13 | `agentboard_get_document` | GET | /api/documents/:id | Yes | No |
| 14 | `agentboard_submit_document` | PUT | /api/documents/:id/submit | No | No |
| 15 | `agentboard_update_document` | PUT | /api/documents/:id | No | No |
| 16 | `agentboard_get_activity_log` | GET | /api/projects/:id/log | Yes | No |
| 17 | `agentboard_add_log_entry` | POST | /api/projects/:id/log | No | No |
| 18 | `agentboard_start_server` | N/A | subprocess | No | No |

---

## 12. Phase 4: Evaluation Specification

Per the mcp-builder SKILL.md, Phase 4 requires creating 10 evaluation QA pairs that test whether an LLM can effectively use the MCP server tools to answer realistic, complex questions.

### Evaluation Requirements (from evaluation.md)

- 10 human-readable questions
- Questions must be READ-ONLY, INDEPENDENT, NON-DESTRUCTIVE
- Each question requires multiple tool calls (potentially dozens)
- Answers must be single, verifiable values (string comparison)
- Answers must be STABLE (won't change over time)
- Questions must require deep exploration, not simple keyword search
- Questions must be realistic use cases humans would care about

### Important Constraints for AgentBoard Evals

Since AgentBoard is a project management tool with dynamic state, evaluation questions MUST:

1. **Use only read-only tools**: `agentboard_list_projects`, `agentboard_get_project`, `agentboard_list_tasks`, `agentboard_list_documents`, `agentboard_get_document`, `agentboard_get_activity_log`, `agentboard_health_check`
2. **Target stable/historical data**: Questions about project structure, template content, milestone definitions, phase rules -- things that don't change once a project is created
3. **Require multi-step reasoning**: e.g. "Find the project, list its tasks, identify milestones, check their dependencies, trace the chain"

### Pre-requisite: Seed Data

Before running evaluations, the AgentBoard server MUST have at least one project created (so there is data to query). The evaluation setup should:
1. Start the AgentBoard server (`npm run dev` or `npm start`)
2. Create a test project via `agentboard_create_project` with `project_type=new_feature`
3. Then run the evaluation harness against only read-only questions

### Evaluation Output Format

File: `agentboard_mcp/evaluation.xml`

```xml
<evaluation>
   <qa_pair>
      <question>QUESTION_TEXT</question>
      <answer>SINGLE_VERIFIABLE_ANSWER</answer>
   </qa_pair>
   <!-- 10 total qa_pairs -->
</evaluation>
```

### Running Evaluations

```bash
# Install eval dependencies
pip install -r .claude/skills/mcp-builder/scripts/requirements.txt

# Set API key
export ANTHROPIC_API_KEY=your_key

# Run eval via stdio transport (evaluation.py auto-launches the MCP server)
python .claude/skills/mcp-builder/scripts/evaluation.py \
  -t stdio \
  -c python \
  -a agentboard_mcp/server.py \
  -e AGENTBOARD_URL=http://localhost:3000/api \
  -e AGENTBOARD_AGENT_ID=eval-agent \
  -o agentboard_mcp/eval_report.md \
  agentboard_mcp/evaluation.xml
```

### Evaluation Quality Criteria

From evaluation.md, good eval questions:
- Require multi-hop reasoning (find project -> list tasks -> check dependency chain -> identify specific milestone)
- Do NOT use exact keywords from the target content (use paraphrases/related concepts)
- Have single, human-readable answers (names, counts, booleans, specific field values)
- Are based on "closed" concepts (project structure and templates that don't change)
- Test diverse data modalities (UUIDs, names, timestamps, statuses, phase numbers, document types)

### Sample Evaluation Questions (to be finalized after server is running with data)

These are DRAFT questions. The actual `evaluation.xml` must be created by:
1. Starting the AgentBoard server
2. Creating a test project
3. Using read-only MCP tools to explore the data
4. Writing 10 questions based on the actual data found
5. Solving each question to verify the answer

Draft question categories:
1. **Project structure**: "How many milestone tasks are created for a new_feature project?" (Answer: count from list_tasks with task_type filter)
2. **Phase system**: "What document type is associated with phase 5?" (Answer: risk_assessment)
3. **Dependency chain**: "Which milestone depends on the Phase 2 milestone?" (Answer: Phase 3 milestone title)
4. **State machine**: "What status is the Phase 1 milestone in for a newly created project?" (Answer: done)
5. **Template content**: "What is the title of the phase 6 document for a new_feature project?" (Answer: from get_document)
6. **Activity log**: "What was the first action logged when a project was created?" (Answer: project_created)
7. **Cross-entity**: "For a new_feature project, which milestone task has no depends_on?" (Answer: Phase 1 milestone)
8. **Document status**: "What status do all phase documents start in?" (Answer: template)
9. **Task metadata**: "What priority are milestone tasks created with?" (Answer: high)
10. **Multi-hop**: "For a new project, what is the document_type of the document linked to the only milestone in 'ready' status?" (Answer: codebase_survey)
