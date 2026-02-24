#!/usr/bin/env python3
"""
MCP Server for AgentBoard -- AI project management with strict workflow enforcement.

This server provides tools to interact with the AgentBoard REST API, enabling LLMs
to manage projects, tasks, documents, and activity logs through the Model Context Protocol.

The AgentBoard server must be running at the configured API URL (default: http://localhost:3000/api).
"""

import asyncio
import json
import os
import subprocess
import sys
from typing import List, Literal, Optional

import httpx
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field

# ─── Constants ───────────────────────────────────────────────────────────────

API_BASE_URL = os.environ.get("AGENTBOARD_URL", "http://localhost:3000/api")
DEFAULT_TIMEOUT = 30.0
SUBMIT_TIMEOUT = 600.0
CHARACTER_LIMIT = 25000
PROJECT_DIR = os.environ.get(
    "AGENTBOARD_PROJECT_DIR",
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
)
STARTUP_WAIT = 8.0
HEALTH_CHECK_INTERVAL = 0.5

# ─── Enums (verified from DB CHECK constraints) ─────────────────────────────

PROJECT_TYPES = ["new_feature", "refactor", "bug_fix", "migration", "integration"]
TASK_STATUSES = ["backlog", "ready", "in-progress", "review", "done", "blocked"]
PRIORITIES = ["critical", "high", "medium", "low"]
TASK_TYPES = ["milestone", "implementation"]
DOCUMENT_STATUSES = ["template", "submitted", "approved", "superseded", "rejected"]
DOCUMENT_TYPES = [
    "codebase_survey", "requirements", "constraints", "risk_assessment",
    "architecture", "contracts", "test_strategy", "task_breakdown",
]
ACTIVITY_ACTIONS = [
    "project_created", "phase_approved", "task_created", "task_started",
    "task_completed", "task_updated", "note_added", "document_filled",
    "document_approved", "document_superseded", "document_rejected", "log_entry",
]

# ─── Server Initialization ──────────────────────────────────────────────────

mcp = FastMCP("agentboard_mcp")


# ─── Shared API Client ──────────────────────────────────────────────────────

async def _api_request(
    method: str,
    path: str,
    json_body: Optional[dict] = None,
    params: Optional[dict] = None,
    timeout: float = DEFAULT_TIMEOUT,
    agent_id: Optional[str] = None,
) -> dict | list:
    """Make an HTTP request to the AgentBoard API.

    Returns the parsed JSON response body on success.
    Returns an error dict with _error=True on non-2xx status.
    """
    async with httpx.AsyncClient() as client:
        headers: dict = {}
        if agent_id:
            headers["X-Agent-Id"] = agent_id
        if json_body is not None:
            headers["Content-Type"] = "application/json"
        response = await client.request(
            method,
            f"{API_BASE_URL}{path}",
            json=json_body,
            params=params,
            headers=headers,
            timeout=timeout,
        )
        if response.status_code >= 400:
            try:
                error_body = response.json()
            except Exception:
                error_body = {"error": response.text}
            return {"_error": True, "_status": response.status_code, **error_body}
        return response.json()


def _is_error(result: object) -> bool:
    """Check if an API response is an error."""
    return isinstance(result, dict) and result.get("_error") is True


def _format_error(result: dict) -> str:
    """Format an API error result into an actionable error string.

    Extracts status code, error message, error code, and for state machine
    violations (422), includes the attempted transition, allowed transitions,
    and any missing required fields.
    """
    status = result.get("_status", "unknown")
    error = result.get("error", "Unknown error")
    code = result.get("code", "")
    parts = [f"Error ({status}): {error}"]
    if code:
        parts[0] += f" [{code}]"
    if result.get("from") and result.get("to"):
        parts.append(f"Attempted transition: {result['from']} -> {result['to']}")
    if result.get("allowed"):
        parts.append(f"Allowed transitions from '{result.get('from', '?')}': {result['allowed']}")
    if result.get("missing_fields"):
        parts.append(f"Missing required fields: {result['missing_fields']}")
    return "\n".join(parts)


def _truncate(text: str, context_hint: str = "") -> str:
    """Truncate text to CHARACTER_LIMIT with a clear message."""
    if len(text) <= CHARACTER_LIMIT:
        return text
    truncation_msg = f"\n\n[Response truncated at {CHARACTER_LIMIT} characters."
    if context_hint:
        truncation_msg += f" {context_hint}"
    truncation_msg += "]"
    return text[: CHARACTER_LIMIT - len(truncation_msg)] + truncation_msg


def _content_last(d: dict) -> dict:
    """Reorder dict so 'content' is the last key (survives truncation better)."""
    if not isinstance(d, dict) or "content" not in d:
        return d
    content = d.pop("content")
    d["content"] = content
    return d


def _json_response(data: object, context_hint: str = "") -> str:
    """Serialize data to pretty JSON and apply truncation if needed."""
    text = json.dumps(data, indent=2, default=str)
    return _truncate(text, context_hint)


# ─── Pydantic Input Models ──────────────────────────────────────────────────

class ResponseFormatInput(BaseModel):
    """Input for tools that only accept a response format option (no other params)."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    response_format: Literal["json", "markdown"] = Field(
        default="markdown",
        description="Response format: 'markdown' (default, human-readable) or 'json' for structured data.",
    )


class ProjectIdInput(BaseModel):
    """Input requiring only a project ID."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    project_id: str = Field(
        ...,
        description="Project UUID (e.g., '550e8400-e29b-41d4-a716-446655440000')",
        min_length=1,
    )
    response_format: Literal["json", "markdown"] = Field(
        default="markdown",
        description="Response format: 'markdown' (default, human-readable) or 'json' for structured data.",
    )


class MutatingProjectIdInput(BaseModel):
    """Input for mutating operations that require a project ID and agent identity."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    project_id: str = Field(
        ...,
        description="Project UUID",
        min_length=1,
    )
    agent_id: str = Field(
        ...,
        description="Your agent identifier (e.g., 'claude-agent-1'). Used for attribution in activity logs.",
        min_length=1,
    )


class CreateProjectInput(BaseModel):
    """Input for creating a new project."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    agent_id: str = Field(
        ...,
        description="Your agent identifier (e.g., 'claude-agent-1'). Used for attribution in activity logs.",
        min_length=1,
    )
    name: str = Field(
        ...,
        description="Project name (e.g., 'Website Redesign')",
        min_length=1,
        max_length=200,
    )
    project_type: Literal[
        "new_feature", "refactor", "bug_fix", "migration", "integration"
    ] = Field(
        ...,
        description=(
            "Type of project. Determines which document templates are generated. "
            "One of: new_feature, refactor, bug_fix, migration, integration"
        ),
    )
    idea: str = Field(
        ...,
        description="Description of the project idea/goal",
        min_length=1,
    )
    target_project_path: Optional[str] = Field(
        default=None,
        description="Optional filesystem path to the target project being managed",
    )


class ListTasksInput(BaseModel):
    """Input for listing tasks with optional filters."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    project_id: str = Field(..., description="Project UUID", min_length=1)
    status: Optional[
        Literal["backlog", "ready", "in-progress", "review", "done", "blocked"]
    ] = Field(default=None, description="Filter by task status")
    phase: Optional[int] = Field(
        default=None,
        description="Filter by phase number (1-13)",
        ge=1,
        le=13,
    )
    response_format: Literal["json", "markdown"] = Field(
        default="markdown",
        description="Response format: 'markdown' (default, human-readable) or 'json' for structured data.",
    )


class CreateTaskInput(BaseModel):
    """Input for creating a new task."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    project_id: str = Field(..., description="Project UUID", min_length=1)
    agent_id: str = Field(
        ...,
        description="Your agent identifier (e.g., 'claude-agent-1'). Used for attribution in activity logs.",
        min_length=1,
    )
    title: str = Field(
        ...,
        description="Task title (e.g., 'Implement user authentication')",
        min_length=1,
    )
    description: Optional[str] = Field(
        default=None,
        description="Detailed task description",
    )
    acceptance_criteria: Optional[str] = Field(
        default=None,
        description="Criteria that must be met for task completion. Required before transitioning to 'in-progress'.",
    )
    constraints: Optional[str] = Field(
        default=None,
        description="Constraints or limitations for this task",
    )
    contracts: Optional[str] = Field(
        default=None,
        description="Interface contracts this task must satisfy",
    )
    test_expectations: Optional[str] = Field(
        default=None,
        description="Expected test behavior",
    )
    status: Optional[Literal["backlog", "ready"]] = Field(
        default=None,
        description="Initial status (backlog or ready only, default: backlog)",
    )
    phase: Optional[int] = Field(
        default=None,
        description="Phase number (1-13)",
        ge=1,
        le=13,
    )
    assignee: Optional[str] = Field(
        default=None,
        description="Agent or user assigned to this task",
    )
    depends_on: Optional[List[str]] = Field(
        default=None,
        description="List of task UUIDs this task depends on",
    )
    priority: Optional[Literal["critical", "high", "medium", "low"]] = Field(
        default=None,
        description="Task priority (default: medium)",
    )
    task_type: Optional[Literal["milestone", "implementation"]] = Field(
        default=None,
        description="Task type (default: implementation)",
    )
    document_id: Optional[str] = Field(
        default=None,
        description="Linked phase document UUID (for milestone tasks)",
    )
    files_touched: Optional[List[str]] = Field(
        default=None,
        description="List of file paths touched by this task",
    )
    notes: Optional[List["NoteInput"]] = Field(
        default=None,
        description="Initial notes. Each note: {text: str, timestamp: ISO8601 str, author: str}",
    )


class NoteInput(BaseModel):
    """A single note to append to a task."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    text: str = Field(..., description="Note content", min_length=1)
    timestamp: str = Field(..., description="ISO8601 timestamp (e.g., '2024-01-15T10:30:00Z')")
    author: str = Field(..., description="Who wrote the note", min_length=1)


class UpdateTaskInput(BaseModel):
    """Input for updating a task. All fields except task_id and agent_id are optional.

    Notes and files_touched use APPEND semantics -- new items are added to
    existing arrays, not replacing them. depends_on uses REPLACE semantics.
    """
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    task_id: str = Field(..., description="Task UUID to update", min_length=1)
    agent_id: str = Field(
        ...,
        description="Your agent identifier (e.g., 'claude-agent-1'). Used for attribution in activity logs.",
        min_length=1,
    )
    title: Optional[str] = Field(default=None, description="New title")
    description: Optional[str] = Field(default=None, description="New description")
    acceptance_criteria: Optional[str] = Field(
        default=None,
        description="New acceptance criteria. Required before transitioning ready -> in-progress.",
    )
    constraints: Optional[str] = Field(default=None, description="New constraints")
    contracts: Optional[str] = Field(default=None, description="New contracts")
    test_expectations: Optional[str] = Field(default=None, description="New test expectations")
    status: Optional[
        Literal["backlog", "ready", "in-progress", "review", "done", "blocked"]
    ] = Field(
        default=None,
        description=(
            "New status. Must follow state machine transitions:\n"
            "  backlog -> [ready, blocked]\n"
            "  ready -> [backlog, in-progress, blocked]\n"
            "  in-progress -> [ready, review, blocked]\n"
            "  review -> [in-progress, done, blocked]\n"
            "  done -> [] (FINAL, no changes allowed)\n"
            "  blocked -> [previous_status only]\n"
            "Guards:\n"
            "  ready -> in-progress: requires assignee + acceptance_criteria\n"
            "  in-progress -> review: requires at least one note\n"
            "  review -> done: requires at least one note\n"
            "Blocked: when transitioning TO blocked, previous_status is auto-saved. "
            "When unblocking, can only return to previous_status."
        ),
    )
    phase: Optional[int] = Field(default=None, description="Phase number (1-13)", ge=1, le=13)
    assignee: Optional[str] = Field(
        default=None,
        description="Assignee name/id. Required before transitioning ready -> in-progress.",
    )
    priority: Optional[Literal["critical", "high", "medium", "low"]] = Field(
        default=None,
        description="Priority level",
    )
    depends_on: Optional[List[str]] = Field(
        default=None,
        description="Replace dependency list (full replacement, NOT append)",
    )
    files_touched: Optional[List[str]] = Field(
        default=None,
        description="File paths to ADD (append semantics -- adds to existing list)",
    )
    notes: Optional[List[NoteInput]] = Field(
        default=None,
        description="Notes to ADD (append semantics). Each note: {text, timestamp, author}",
    )


class DocumentIdInput(BaseModel):
    """Input requiring only a document ID."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    document_id: str = Field(
        ...,
        description="Document UUID",
        min_length=1,
    )
    response_format: Literal["json", "markdown"] = Field(
        default="markdown",
        description="Response format: 'markdown' (default, human-readable) or 'json' for structured data.",
    )


class TaskIdInput(BaseModel):
    """Input requiring only a task ID."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    task_id: str = Field(
        ...,
        description="Task UUID",
        min_length=1,
    )
    response_format: Literal["json", "markdown"] = Field(
        default="markdown",
        description="Response format: 'markdown' (default, human-readable) or 'json' for structured data.",
    )


class SubmitDocumentInput(BaseModel):
    """Input for submitting a document for human review (submit-and-wait)."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    document_id: str = Field(..., description="Document UUID to submit", min_length=1)
    agent_id: str = Field(
        ...,
        description="Your agent identifier (e.g., 'claude-agent-1'). Used for attribution and as default filled_by.",
        min_length=1,
    )
    content: Optional[str] = Field(
        default=None,
        description=(
            "Updated document content (markdown). "
            "If omitted, the existing content is preserved."
        ),
    )
    filled_by: Optional[str] = Field(
        default=None,
        description="Who filled the document. Defaults to the agent ID from headers.",
    )
    notes: str = Field(
        ...,
        description=(
            "Contextual notes about the submission. Required. "
            "Good notes: decisions made, tradeoffs considered, how rejection feedback was addressed, "
            "'No additional notes — template was sufficient as-is'. "
            "Bad notes: 'Document submitted', restating the task title, copy-pasting document content."
        ),
        min_length=1,
    )


class UpdateDocumentInput(BaseModel):
    """Input for updating a document (content, status, metadata).

    Used to approve, reject, or edit documents.
    When status is set to 'rejected', rejection_feedback is required.
    Changing status to 'approved' or 'rejected' automatically updates linked milestone tasks.
    """
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    document_id: str = Field(..., description="Document UUID to update", min_length=1)
    agent_id: str = Field(
        ...,
        description="Your agent identifier (e.g., 'claude-agent-1'). Used for attribution in activity logs.",
        min_length=1,
    )
    content: Optional[str] = Field(
        default=None,
        description="Updated document content (markdown)",
    )
    status: Optional[
        Literal["template", "submitted", "approved", "superseded", "rejected"]
    ] = Field(
        default=None,
        description=(
            "New document status. Setting to 'approved' or 'rejected' triggers automatic "
            "milestone transitions. 'rejected' requires rejection_feedback."
        ),
    )
    filled_by: Optional[str] = Field(
        default=None,
        description="Who filled/updated the document",
    )
    title: Optional[str] = Field(
        default=None,
        description="Updated document title",
    )
    rejection_feedback: Optional[str] = Field(
        default=None,
        description=(
            "Required when status='rejected'. Explains why the document was rejected "
            "so the agent can address the issues."
        ),
    )


class GetActivityLogInput(BaseModel):
    """Input for retrieving the activity log with optional filters."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    project_id: str = Field(..., description="Project UUID", min_length=1)
    response_format: Literal["json", "markdown"] = Field(
        default="markdown",
        description="Response format: 'markdown' (default, human-readable) or 'json' for structured data.",
    )
    actor: Optional[str] = Field(
        default=None,
        description="Filter by actor name/id (e.g., 'mcp-agent', 'human')",
    )
    action: Optional[
        Literal[
            "project_created", "phase_approved", "task_created", "task_started",
            "task_completed", "task_updated", "note_added", "document_filled",
            "document_approved", "document_superseded", "document_rejected", "log_entry",
        ]
    ] = Field(default=None, description="Filter by action type")


class AddLogEntryInput(BaseModel):
    """Input for adding a custom activity log entry."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    project_id: str = Field(..., description="Project UUID", min_length=1)
    agent_id: str = Field(
        ...,
        description="Your agent identifier (e.g., 'claude-agent-1'). Used as the 'actor' in the log entry.",
        min_length=1,
    )
    action: Literal[
        "project_created", "phase_approved", "task_created", "task_started",
        "task_completed", "task_updated", "note_added", "document_filled",
        "document_approved", "document_superseded", "document_rejected", "log_entry",
    ] = Field(
        ...,
        description=(
            "Action type. Use 'log_entry' for custom messages. "
            "Valid types: project_created, phase_approved, task_created, task_started, "
            "task_completed, task_updated, note_added, document_filled, "
            "document_approved, document_superseded, document_rejected, log_entry"
        ),
    )
    target: Optional[str] = Field(
        default=None,
        description="Target entity UUID (task, document, project, etc.)",
    )
    detail: Optional[str] = Field(
        default=None,
        description="Human-readable detail message",
    )


class GetNextTaskInput(BaseModel):
    """Input for getting the next actionable task."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    project_id: str = Field(..., description="Project UUID", min_length=1)
    agent_id: str = Field(
        ...,
        description="Your agent identifier (e.g., 'claude-agent-1'). Used for auto-claiming tasks and filtering by assignee.",
        min_length=1,
    )


class StartServerInput(BaseModel):
    """Input for starting the AgentBoard server."""
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )
    mode: Literal["dev", "production"] = Field(
        default="dev",
        description=(
            "Server mode. 'dev' runs both server and client with hot reload "
            "(npm run dev, ports 3000+5173). 'production' runs server only "
            "(npm start, port 3000, serves pre-built client)."
        ),
    )


# ─── Shared Helpers ────────────────────────────────────────────────────────


async def _check_server_running() -> dict | None:
    """Hit the health endpoint. Returns the response dict if running, None if not."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{API_BASE_URL}/health",
                timeout=5.0,
            )
            if response.status_code == 200:
                return response.json()
    except (httpx.ConnectError, httpx.TimeoutException, Exception):
        pass
    return None


# ─── Markdown Formatters ────────────────────────────────────────────────────


def _format_project_markdown(p: dict) -> str:
    """Format a project as markdown."""
    phase_names = {
        1: "Initialization", 2: "Codebase Survey", 3: "Requirements",
        4: "Constraints", 5: "Risk Assessment", 6: "Architecture",
        7: "Contracts", 8: "Test Strategy", 9: "Task Breakdown",
        10: "Implementation", 11: "Verification", 12: "Review", 13: "Complete",
    }
    phase = p.get("current_phase", "?")
    return (
        f"## {p.get('name', 'Untitled')}\n"
        f"- **ID:** `{p.get('id', '?')}`\n"
        f"- **Type:** {p.get('project_type', '?')}\n"
        f"- **Phase:** {phase} — {phase_names.get(phase, '?')}\n"
        f"- **Idea:** {p.get('idea', '?')}\n"
        f"- **Path:** {p.get('target_project_path') or 'not set'}\n"
    )


def _format_projects_markdown(projects: list) -> str:
    if not projects:
        return "No projects found."
    return "\n---\n".join(_format_project_markdown(p) for p in projects)


def _format_task_markdown(t: dict) -> str:
    """Format a task as markdown."""
    parts = [
        f"### {t.get('title', 'Untitled')}",
        f"- **ID:** `{t.get('id', '?')}`",
        f"- **Status:** {t.get('status', '?')} | **Priority:** {t.get('priority', '?')} | **Type:** {t.get('task_type', '?')}",
    ]
    if t.get("phase"):
        parts.append(f"- **Phase:** {t['phase']}")
    if t.get("assignee"):
        parts.append(f"- **Assignee:** {t['assignee']}")
    if t.get("description"):
        parts.append(f"- **Description:** {t['description'][:200]}")
    notes = t.get("notes", [])
    if notes:
        parts.append(f"- **Notes:** {len(notes)} note(s)")
    return "\n".join(parts)


def _format_tasks_markdown(tasks: list) -> str:
    if not tasks:
        return "No tasks found."
    return "\n\n".join(_format_task_markdown(t) for t in tasks)


def _format_document_markdown(d: dict) -> str:
    """Format a document as markdown."""
    parts = [
        f"## {d.get('title', 'Untitled')}",
        f"- **ID:** `{d.get('id', '?')}`",
        f"- **Phase:** {d.get('phase', '?')} | **Type:** {d.get('document_type', '?')}",
        f"- **Status:** {d.get('status', '?')}",
    ]
    if d.get("filled_by"):
        parts.append(f"- **Filled by:** {d['filled_by']}")
    if d.get("rejection_feedback"):
        parts.append(f"- **Rejection feedback:** {d['rejection_feedback']}")
    content = d.get("content", "")
    if content:
        preview = content[:500] + ("..." if len(content) > 500 else "")
        parts.append(f"\n{preview}")
    return "\n".join(parts)


def _format_documents_markdown(docs: list) -> str:
    if not docs:
        return "No documents found."
    return "\n\n---\n\n".join(_format_document_markdown(d) for d in docs)


def _format_activity_markdown(entries: list) -> str:
    if not entries:
        return "No activity log entries."
    lines = ["| Timestamp | Actor | Action | Detail |", "| --- | --- | --- | --- |"]
    for e in entries[:50]:
        lines.append(
            f"| {e.get('timestamp', '?')} | {e.get('actor', '?')} | {e.get('action', '?')} | {e.get('detail', '-')} |"
        )
    if len(entries) > 50:
        lines.append(f"\n*...and {len(entries) - 50} more entries*")
    return "\n".join(lines)


# ─── Tool Definitions ───────────────────────────────────────────────────────

# ── 1. Health ────────────────────────────────────────────────────────────────

@mcp.tool(
    name="agentboard_health_check",
    annotations={
        "title": "Check AgentBoard Health",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def agentboard_health_check(params: ResponseFormatInput = ResponseFormatInput()) -> str:
    """Verify the AgentBoard server is reachable before doing anything else.

    Call this at the start of every session. If it fails, call
    agentboard_start_server before using any other tools.

    Returns:
        JSON: {"status": "ok", "timestamp": "<ISO8601>"}

    On error:
        - Connection refused: server is not running. Next step: call agentboard_start_server.
        - Timeout: server may be overloaded. Retry after a few seconds.
    """
    try:
        result = await _api_request("GET", "/health")
        if _is_error(result):
            return _format_error(result)
        return _json_response(result)
    except httpx.ConnectError:
        return "Error: Cannot connect to AgentBoard server. Is it running at " + API_BASE_URL + "?"
    except httpx.TimeoutException:
        return "Error: Request timed out. The AgentBoard server may be unresponsive."
    except Exception as e:
        return f"Error: Unexpected error: {type(e).__name__}: {e}"


# ── 2. Projects ──────────────────────────────────────────────────────────────

@mcp.tool(
    name="agentboard_list_projects",
    annotations={
        "title": "List All Projects",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def agentboard_list_projects(params: ResponseFormatInput = ResponseFormatInput()) -> str:
    """List all projects to find project IDs and see current phases.

    Use this to discover which projects exist. If you already have a
    project_id, use agentboard_get_project instead.

    Returns:
        JSON array of projects: [{id, name, project_type, idea, current_phase, target_project_path, created_at, updated_at}]
        Empty array if no projects exist.

    Next step: Use a project's id with agentboard_get_project, agentboard_list_tasks, or agentboard_get_next_task.
    """
    try:
        result = await _api_request("GET", "/projects")
        if _is_error(result):
            return _format_error(result)
        if params.response_format == "markdown":
            return _truncate(_format_projects_markdown(result))
        return _json_response(
            result,
            "Use agentboard_get_project with a specific project ID to see full details.",
        )
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_get_project",
    annotations={
        "title": "Get Project Details",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def agentboard_get_project(params: ProjectIdInput) -> str:
    """Get full details for a single project, including its current phase.

    Use this to check which phase a project is in before deciding what to do next.

    Args:
        project_id: Project UUID.

    Returns:
        JSON project object: {id, name, project_type, idea, current_phase (1-13), target_project_path, created_at, updated_at}

    On error:
        - 404: project_id not found. Verify the ID with agentboard_list_projects.
    """
    try:
        result = await _api_request("GET", f"/projects/{params.project_id}")
        if _is_error(result):
            return _format_error(result)
        if params.response_format == "markdown":
            return _truncate(_format_project_markdown(result))
        return _json_response(result)
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_create_project",
    annotations={
        "title": "Create New Project",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    },
)
async def agentboard_create_project(params: CreateProjectInput) -> str:
    """Create a new project. This sets up the full workflow: phase documents, milestone tasks, and activity log.

    After creation, the project starts at phase 1 with the first milestone ready to claim.

    Args:
        agent_id: Your agent identifier for attribution.
        name: Project name (1-200 chars).
        project_type: One of: new_feature, refactor, bug_fix, migration, integration.
        idea: Description of the project goal.
        target_project_path: (optional) Filesystem path to the codebase being managed.

    Returns:
        JSON project object with current_phase=1.

    Next step: Call agentboard_get_next_task to claim the first milestone.

    On error:
        - 400: missing required field (name, project_type, or idea) or invalid project_type.
    """
    try:
        body: dict = {"name": params.name, "project_type": params.project_type, "idea": params.idea}
        if params.target_project_path is not None:
            body["target_project_path"] = params.target_project_path
        result = await _api_request("POST", "/projects", json_body=body, agent_id=params.agent_id)
        if _is_error(result):
            return _format_error(result)
        return _json_response(result)
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_advance_phase",
    annotations={
        "title": "Advance Project Phase",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    },
)
async def agentboard_advance_phase(params: MutatingProjectIdInput) -> str:
    """Move a project to the next phase.

    For phases 2-9, the phase document must be approved first. Phases 10-12 advance freely.
    Do not call this until the current phase's document is approved.

    Args:
        project_id: Project UUID.
        agent_id: Your agent identifier for attribution.

    Returns:
        JSON updated project with incremented current_phase.

    Next step: Call agentboard_get_next_task to pick up work in the new phase.

    On error:
        - 400 "document must be approved": approve the phase document first via the review workflow.
        - 400 "Already at final phase": project is complete (phase 13), no further advancement.
        - 404: project not found.
    """
    try:
        result = await _api_request("POST", f"/projects/{params.project_id}/advance", agent_id=params.agent_id)
        if _is_error(result):
            return _format_error(result)
        return _json_response(result)
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_revert_phase",
    annotations={
        "title": "Revert Project Phase",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": False,
        "openWorldHint": False,
    },
)
async def agentboard_revert_phase(params: MutatingProjectIdInput) -> str:
    """Move a project back to the previous phase. Destructive -- use only when a phase must be revisited.

    If you only need to edit a document, use agentboard_update_document instead.

    Args:
        project_id: Project UUID.
        agent_id: Your agent identifier for attribution.

    Returns:
        JSON updated project with decremented current_phase.

    On error:
        - 400 "Already at phase 1": cannot go below phase 1.
        - 404: project not found.
    """
    try:
        result = await _api_request("POST", f"/projects/{params.project_id}/revert", agent_id=params.agent_id)
        if _is_error(result):
            return _format_error(result)
        return _json_response(result)
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


# ── 3. Tasks ─────────────────────────────────────────────────────────────────

@mcp.tool(
    name="agentboard_list_tasks",
    annotations={
        "title": "List Project Tasks",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def agentboard_list_tasks(params: ListTasksInput) -> str:
    """List tasks for a project, with optional status and phase filters.

    Use this for a project overview or to find specific tasks. If you just need
    the next thing to work on, use agentboard_get_next_task instead.

    Args:
        project_id: Project UUID.
        status: (optional) Filter: backlog, ready, in-progress, review, done, blocked.
        phase: (optional) Filter by phase number (1-13).

    Returns:
        JSON array of task objects. Each task includes: id, title, status, priority,
        task_type, phase, assignee, depends_on, notes, files_touched, and more.
        Empty array if no tasks match.
    """
    try:
        query_params: dict = {}
        if params.status is not None:
            query_params["status"] = params.status
        if params.phase is not None:
            query_params["phase"] = str(params.phase)
        result = await _api_request(
            "GET",
            f"/projects/{params.project_id}/tasks",
            params=query_params if query_params else None,
        )
        if _is_error(result):
            return _format_error(result)
        if params.response_format == "markdown":
            return _truncate(_format_tasks_markdown(result))
        return _json_response(
            result,
            "Use status or phase filters to narrow results.",
        )
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_get_next_task",
    annotations={
        "title": "Get Next Actionable Task",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    },
)
async def agentboard_get_next_task(params: GetNextTaskInput) -> str:
    """Get and auto-claim the next task you should work on. This is your primary work loop tool.

    The server picks the highest-priority actionable task and assigns it to you.
    For milestone tasks, the linked phase document is included so you can start immediately.

    If a milestone is waiting for human review, the response tells you to wait --
    do not call this again until the review completes.

    Args:
        project_id: Project UUID.
        agent_id: Your agent identifier (used to claim the task and filter by assignee).

    Returns:
        JSON: {"task": <task_object>, "document": <document_object>|null}
        Or if waiting on review: a message telling you to wait.

    Next step:
        - Milestone task: read the document template, fill it, then call agentboard_submit_document.
        - Implementation task: do the work, add notes, then move to review/done via agentboard_update_task.

    On error:
        - 404 "No tasks available": all tasks are done or blocked. Check if the phase can be advanced.
    """
    try:
        result = await _api_request("GET", f"/projects/{params.project_id}/tasks/next", agent_id=params.agent_id)
        if _is_error(result):
            return _format_error(result)
        # If server returned a pending_review, surface the message directly
        if isinstance(result, dict) and result.get("pending_review"):
            return result["pending_review"]["message"]
        return _json_response(
            result,
            "The document content may be large. Use agentboard_get_document for full content.",
        )
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_create_task",
    annotations={
        "title": "Create New Task",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    },
)
async def agentboard_create_task(params: CreateTaskInput) -> str:
    """Create a new task in a project. Starts in 'backlog' by default.

    Use this to break work into trackable units during the Task Breakdown phase
    or to add ad-hoc tasks during Implementation.

    Args:
        project_id: Project UUID (required).
        agent_id: Your agent identifier for attribution (required).
        title: Task title (required).
        description, acceptance_criteria, constraints, contracts, test_expectations: (optional) Task details.
        status: (optional) Initial status -- only 'backlog' or 'ready' allowed.
        phase: (optional) Phase number (1-13).
        assignee: (optional) Who is assigned.
        depends_on: (optional) List of task UUIDs this depends on.
        priority: (optional) critical, high, medium, or low.
        task_type: (optional) 'milestone' or 'implementation' (default: implementation).
        document_id: (optional) Linked phase document UUID (for milestone tasks).
        files_touched: (optional) File paths involved.
        notes: (optional) Initial notes [{text, timestamp, author}].

    Returns:
        JSON created task object.

    On error:
        - 400: title is missing or invalid field values.
    """
    try:
        body: dict = {"title": params.title}
        for field in [
            "description", "acceptance_criteria", "constraints", "contracts",
            "test_expectations", "status", "phase", "assignee", "depends_on",
            "priority", "task_type", "document_id", "files_touched",
        ]:
            value = getattr(params, field)
            if value is not None:
                body[field] = value
        if params.notes is not None:
            body["notes"] = [note.model_dump() for note in params.notes]
        result = await _api_request("POST", f"/projects/{params.project_id}/tasks", json_body=body, agent_id=params.agent_id)
        if _is_error(result):
            return _format_error(result)
        return _json_response(result)
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_update_task",
    annotations={
        "title": "Update Task",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": False,
        "openWorldHint": False,
    },
)
async def agentboard_update_task(params: UpdateTaskInput) -> str:
    """Update task fields and/or transition task status. This is how you move tasks through the workflow.

    notes and files_touched APPEND to existing values. depends_on REPLACES the full list.
    Tasks in 'done' status cannot be changed at all.

    Common transitions:
        - Start work: set status='in-progress' (requires assignee + acceptance_criteria).
        - Submit for review: set status='review' (requires at least one note).
        - Complete: set status='done' (requires at least one note).
        - Block: set status='blocked' (previous_status is saved automatically).
        - Unblock: set status to the value in task.previous_status.

    Args:
        task_id: Task UUID to update (required).
        agent_id: Your agent identifier for attribution (required).
        status: (optional) New status -- must follow valid transitions.
        notes: (optional) Notes to append [{text, timestamp, author}].
        files_touched: (optional) File paths to append.
        assignee, acceptance_criteria, description, priority, etc.: (optional) Field updates.

    Returns:
        JSON updated task object.

    On error:
        - 404: task not found.
        - 422: invalid transition. The error includes allowed transitions and missing fields -- read it carefully.
    """
    try:
        body: dict = {}
        for field in [
            "title", "description", "acceptance_criteria", "constraints",
            "contracts", "test_expectations", "status", "phase", "assignee",
            "priority", "depends_on", "files_touched",
        ]:
            value = getattr(params, field)
            if value is not None:
                body[field] = value
        if params.notes is not None:
            body["notes"] = [note.model_dump() for note in params.notes]
        result = await _api_request("PATCH", f"/tasks/{params.task_id}", json_body=body, agent_id=params.agent_id)
        if _is_error(result):
            return _format_error(result)
        return _json_response(result)
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_get_task",
    annotations={
        "title": "Get Task Details",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def agentboard_get_task(params: TaskIdInput) -> str:
    """Get full details for a single task by ID.

    Use this to check a task's current status, read its notes, see acceptance
    criteria, or inspect its dependencies before updating it.

    Args:
        task_id: Task UUID.

    Returns:
        JSON task object with all fields (status, notes, depends_on, files_touched, etc.).

    On error:
        - 404: task not found. Verify the ID with agentboard_list_tasks.
    """
    try:
        result = await _api_request("GET", f"/tasks/{params.task_id}")
        if _is_error(result):
            return _format_error(result)
        if params.response_format == "markdown":
            return _truncate(_format_task_markdown(result))
        return _json_response(result)
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


# ── 4. Documents ─────────────────────────────────────────────────────────────

@mcp.tool(
    name="agentboard_list_documents",
    annotations={
        "title": "List Project Documents",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def agentboard_list_documents(params: ProjectIdInput) -> str:
    """List all phase documents for a project to see which need to be filled or are pending review.

    Documents progress: template -> submitted -> approved (or rejected -> resubmitted).
    Use this to find the document_id for the current phase.

    Args:
        project_id: Project UUID.

    Returns:
        JSON array of document summaries: [{id, phase, document_type, title, status, filled_by, rejection_feedback}].
        Content is excluded from list responses to avoid truncation -- use agentboard_get_document for full content.
        Empty array if no documents exist.

    Next step: Use agentboard_get_document for full content, or agentboard_submit_document to submit for review.
    """
    try:
        result = await _api_request("GET", f"/projects/{params.project_id}/documents")
        if _is_error(result):
            return _format_error(result)
        if params.response_format == "markdown":
            return _truncate(_format_documents_markdown(result))
        # Strip content from list response to avoid exceeding CHARACTER_LIMIT
        if isinstance(result, list):
            for doc in result:
                if isinstance(doc, dict):
                    doc.pop("content", None)
        return _json_response(
            result,
            "Content excluded from list. Use agentboard_get_document for full document content.",
        )
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_get_document",
    annotations={
        "title": "Get Document Details",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def agentboard_get_document(params: DocumentIdInput) -> str:
    """Get a single document's full content, status, and rejection feedback (if any).

    Use this to read a template before filling it, or to check rejection feedback
    before resubmitting.

    Args:
        document_id: Document UUID.

    Returns:
        JSON document object: {id, phase, document_type, title, content, status, filled_by, rejection_feedback}.

    On error:
        - 404: document not found. Verify the ID with agentboard_list_documents.
    """
    try:
        result = await _api_request("GET", f"/documents/{params.document_id}")
        if _is_error(result):
            return _format_error(result)
        if params.response_format == "markdown":
            return _truncate(_format_document_markdown(result))
        return _json_response(
            _content_last(result),
            "Content truncated. The full document content may be very large.",
        )
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_submit_document",
    annotations={
        "title": "Submit Document for Review",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    },
)
async def agentboard_submit_document(params: SubmitDocumentInput) -> str:
    """Submit a completed document for human review. BLOCKS until the human approves or rejects.

    This call will not return until a human acts on the document. Expect long waits.
    Only documents in 'template' or 'rejected' status can be submitted.

    Write meaningful notes explaining your decisions and tradeoffs -- do NOT just say
    "Document submitted" or restate the task title.

    Args:
        document_id: Document UUID to submit (required).
        agent_id: Your agent identifier for attribution (required).
        content: (optional) Updated markdown content. Omit to keep existing content.
        filled_by: (optional) Who filled the document. Defaults to agent_id.
        notes: Contextual notes about the submission (required). Explain decisions and tradeoffs.

    Returns:
        If approved: {"result": "approved", "document": {...}, "milestone": {...}, "nextTask": {...}|null}
        If rejected: {"result": "rejected", "feedback": "...", "document": {...}, "milestone": {...}}

    Next step:
        - Approved: call agentboard_get_next_task to continue.
        - Rejected: read the feedback, revise the content, and call this tool again.

    On error:
        - 400 MISSING_NOTES: notes field is empty.
        - 400 INVALID_DOCUMENT_STATUS: document is not in 'template' or 'rejected' status.
        - 409 MILESTONE_NOT_IN_PROGRESS: the linked milestone is not in the expected state.
        - Timeout after 600s: document is still in 'submitted' status, awaiting human review. Use agentboard_get_next_task to check for other work.
    """
    try:
        body: dict = {"notes": params.notes}
        if params.content is not None:
            body["content"] = params.content
        body["filled_by"] = params.filled_by if params.filled_by is not None else params.agent_id
        result = await _api_request(
            "PUT",
            f"/documents/{params.document_id}/submit",
            json_body=body,
            timeout=SUBMIT_TIMEOUT,
            agent_id=params.agent_id,
        )
        if _is_error(result):
            return _format_error(result)
        return _json_response(result)
    except httpx.ReadTimeout:
        return (
            "Error: Document review timed out after "
            f"{int(SUBMIT_TIMEOUT)} seconds. The document has been submitted "
            "and is in 'submitted' status awaiting review. Use agentboard_get_next_task "
            "to check for available work, or agentboard_get_document to check the "
            "document status."
        )
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_update_document",
    annotations={
        "title": "Update Document",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    },
)
async def agentboard_update_document(params: UpdateDocumentInput) -> str:
    """Update a document's content, status, or metadata. Primarily used for approving or rejecting documents.

    Setting status to 'approved' or 'rejected' automatically updates the linked
    milestone task and unblocks the agent workflow.

    Args:
        document_id: Document UUID to update (required).
        agent_id: Your agent identifier for attribution (required).
        content: (optional) Updated markdown content.
        status: (optional) New status: template, submitted, approved, superseded, rejected.
        filled_by: (optional) Who filled/updated the document.
        title: (optional) Updated title.
        rejection_feedback: Required when status='rejected'. Explain what needs to change.

    Returns:
        JSON updated document object.

    On error:
        - 404: document not found.
        - 400 MISSING_REJECTION_FEEDBACK: must provide rejection_feedback when rejecting.
    """
    try:
        body: dict = {}
        for field in ["content", "status", "filled_by", "title", "rejection_feedback"]:
            value = getattr(params, field)
            if value is not None:
                body[field] = value
        result = await _api_request(
            "PUT",
            f"/documents/{params.document_id}",
            json_body=body,
            agent_id=params.agent_id,
        )
        if _is_error(result):
            return _format_error(result)
        return _json_response(result)
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


# ── 5. Activity Log ──────────────────────────────────────────────────────────

@mcp.tool(
    name="agentboard_get_activity_log",
    annotations={
        "title": "Get Activity Log",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def agentboard_get_activity_log(params: GetActivityLogInput) -> str:
    """Get the activity log for a project to review what has happened.

    Use filters to narrow results -- unfiltered logs can be large.

    Args:
        project_id: Project UUID (required).
        actor: (optional) Filter by actor name/id.
        action: (optional) Filter by action type (e.g., 'task_completed', 'log_entry').

    Returns:
        JSON array of log entries: [{id, timestamp, actor, action, target, detail}].
        Empty array if no entries match.
    """
    try:
        query_params: dict = {}
        if params.actor is not None:
            query_params["actor"] = params.actor
        if params.action is not None:
            query_params["action"] = params.action
        result = await _api_request(
            "GET",
            f"/projects/{params.project_id}/log",
            params=query_params if query_params else None,
        )
        if _is_error(result):
            return _format_error(result)
        if params.response_format == "markdown":
            return _truncate(_format_activity_markdown(result))
        return _json_response(
            result,
            "Use actor or action filters to narrow results.",
        )
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


@mcp.tool(
    name="agentboard_add_log_entry",
    annotations={
        "title": "Add Activity Log Entry",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    },
)
async def agentboard_add_log_entry(params: AddLogEntryInput) -> str:
    """Record a custom entry in the project activity log.

    Use action='log_entry' for freeform notes about reasoning, decisions, or observations.
    These entries create an audit trail visible to all project participants.

    Args:
        project_id: Project UUID (required).
        agent_id: Your agent identifier for attribution (required).
        action: Action type (required). Use 'log_entry' for custom messages.
        target: (optional) UUID of the related entity (task, document, etc.).
        detail: (optional) Human-readable message.

    Returns:
        JSON created log entry: {id, timestamp, actor, action, target, detail}.

    On error:
        - 400: action is missing.
    """
    try:
        body: dict = {"action": params.action}
        if params.target is not None:
            body["target"] = params.target
        if params.detail is not None:
            body["detail"] = params.detail
        result = await _api_request(
            "POST",
            f"/projects/{params.project_id}/log",
            json_body=body,
            agent_id=params.agent_id,
        )
        if _is_error(result):
            return _format_error(result)
        return _json_response(result)
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


# ── 8. Server Management ────────────────────────────────────────────────────

@mcp.tool(
    name="agentboard_start_server",
    annotations={
        "title": "Start AgentBoard Server",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def agentboard_start_server(params: StartServerInput) -> str:
    """Start the AgentBoard server. Safe to call if already running -- it will not restart a healthy server.

    Call this when agentboard_health_check fails or at the start of a session.

    Args:
        mode: 'dev' (hot reload, ports 3000+5173) or 'production' (port 3000 only). Default: 'dev'.

    Returns:
        JSON status: {"status": "started"|"already_running"|"starting"|"error", ...}

    Next step: If status is 'starting', wait a few seconds then call agentboard_health_check.

    On error:
        - npm not found: Node.js is not installed.
        - package.json not found: AGENTBOARD_PROJECT_DIR is misconfigured.
        - Process exited immediately: run the command manually to see error output.
    """
    # ── Process guard: check if already running ──
    health = await _check_server_running()
    if health is not None:
        return json.dumps({
            "status": "already_running",
            "message": "AgentBoard server is already running. No action taken.",
            "health": health,
            "api_url": API_BASE_URL,
        }, indent=2)

    # ── Validate project directory ──
    package_json = os.path.join(PROJECT_DIR, "package.json")
    if not os.path.isfile(package_json):
        return json.dumps({
            "status": "error",
            "message": f"package.json not found at {package_json}. "
                       f"Set AGENTBOARD_PROJECT_DIR env var to the project root.",
        }, indent=2)

    # ── Determine command ──
    cmd = "npm run dev" if params.mode == "dev" else "npm start"

    # ── Launch as detached subprocess ──
    try:
        if sys.platform == "win32":
            # Windows: CREATE_NEW_PROCESS_GROUP + DETACHED_PROCESS
            process = subprocess.Popen(
                cmd,
                cwd=PROJECT_DIR,
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                stdin=subprocess.DEVNULL,
                creationflags=(
                    subprocess.CREATE_NEW_PROCESS_GROUP
                    | subprocess.DETACHED_PROCESS
                ),
            )
        else:
            # Unix: start_new_session for process group isolation
            process = subprocess.Popen(
                cmd,
                cwd=PROJECT_DIR,
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                stdin=subprocess.DEVNULL,
                start_new_session=True,
            )
    except FileNotFoundError:
        return json.dumps({
            "status": "error",
            "message": "npm not found. Ensure Node.js and npm are installed and on PATH.",
        }, indent=2)
    except Exception as e:
        return json.dumps({
            "status": "error",
            "message": f"Failed to start server: {type(e).__name__}: {e}",
        }, indent=2)

    # ── Wait for server to become healthy ──
    elapsed = 0.0
    health = None
    while elapsed < STARTUP_WAIT:
        await asyncio.sleep(HEALTH_CHECK_INTERVAL)
        elapsed += HEALTH_CHECK_INTERVAL
        # Check if process died immediately
        if process.poll() is not None:
            return json.dumps({
                "status": "error",
                "message": f"Server process exited immediately with code {process.returncode}. "
                           f"Run '{cmd}' manually in {PROJECT_DIR} to see error output.",
            }, indent=2)
        health = await _check_server_running()
        if health is not None:
            break

    if health is not None:
        return json.dumps({
            "status": "started",
            "message": f"AgentBoard server started successfully in {params.mode} mode.",
            "command": cmd,
            "pid": process.pid,
            "health": health,
            "api_url": API_BASE_URL,
            "startup_time_seconds": round(elapsed, 1),
        }, indent=2)
    else:
        return json.dumps({
            "status": "starting",
            "message": (
                f"Server process launched (PID {process.pid}) but health endpoint "
                f"not yet responding after {STARTUP_WAIT}s. The server may still be "
                f"initializing. Try agentboard_health_check in a few seconds."
            ),
            "command": cmd,
            "pid": process.pid,
            "api_url": API_BASE_URL,
        }, indent=2)


@mcp.tool(
    name="agentboard_server_status",
    annotations={
        "title": "Check Server Process Status",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def agentboard_server_status() -> str:
    """Check if the server is running. Always returns a structured response (never errors).

    Use this to decide whether to call agentboard_start_server.

    Returns:
        JSON: {"running": true|false, "api_url": "...", ...}
        If not running, includes a suggestion to start the server.

    Next step: If running is false, call agentboard_start_server.
    """
    health = await _check_server_running()
    if health is not None:
        return json.dumps({
            "running": True,
            "health": health,
            "api_url": API_BASE_URL,
            "project_dir": PROJECT_DIR,
        }, indent=2)
    else:
        return json.dumps({
            "running": False,
            "api_url": API_BASE_URL,
            "project_dir": PROJECT_DIR,
            "suggestion": "Server is not responding. Use agentboard_start_server to launch it.",
        }, indent=2)


@mcp.tool(
    name="agentboard_stop_server",
    annotations={
        "title": "Stop AgentBoard Server",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def agentboard_stop_server() -> str:
    """Stop the AgentBoard server. Destructive -- disconnects all clients and drops pending reviews.

    Only use this if the server is in a bad state or you need to restart with different settings.
    Do NOT use this if the server is healthy and working.

    Returns:
        JSON: {"status": "stopped"|"not_running"|"error", ...}

    Next step: Call agentboard_start_server to restart.

    On error:
        - 'not_running': server was already stopped, no action needed.
        - 'error': process termination failed.
    """
    # ── Check if server is actually running ──
    health = await _check_server_running()
    if health is None:
        return json.dumps({
            "status": "not_running",
            "message": "Server is not running. Nothing to stop.",
        }, indent=2)

    # ── Find and kill processes on port 3000 ──
    port = "3000"
    killed_pids: list[int] = []

    try:
        if sys.platform == "win32":
            # Windows: netstat to find PIDs, taskkill to terminate
            result = subprocess.run(
                ["netstat", "-ano", "-p", "TCP"],
                capture_output=True, text=True, timeout=10,
            )
            for line in result.stdout.splitlines():
                # Match lines with :3000 in LISTENING state
                if f":{port}" in line and "LISTENING" in line:
                    parts = line.split()
                    try:
                        pid = int(parts[-1])
                        if pid > 0 and pid not in killed_pids:
                            subprocess.run(
                                ["taskkill", "/F", "/T", "/PID", str(pid)],
                                capture_output=True, timeout=10,
                            )
                            killed_pids.append(pid)
                    except (ValueError, IndexError):
                        continue
        else:
            # Unix: lsof to find PIDs, kill to terminate
            result = subprocess.run(
                ["lsof", "-ti", f":{port}"],
                capture_output=True, text=True, timeout=10,
            )
            for line in result.stdout.strip().splitlines():
                try:
                    pid = int(line.strip())
                    if pid > 0 and pid not in killed_pids:
                        subprocess.run(
                            ["kill", "-TERM", str(pid)],
                            capture_output=True, timeout=10,
                        )
                        killed_pids.append(pid)
                except (ValueError, IndexError):
                    continue
    except Exception as e:
        return json.dumps({
            "status": "error",
            "message": f"Failed to stop server: {type(e).__name__}: {e}",
        }, indent=2)

    if not killed_pids:
        return json.dumps({
            "status": "error",
            "message": (
                "Server responded to health check but could not find process on port 3000. "
                "The server may be running on a non-standard port."
            ),
        }, indent=2)

    # ── Verify server is stopped ──
    await asyncio.sleep(1.0)
    post_health = await _check_server_running()

    if post_health is None:
        return json.dumps({
            "status": "stopped",
            "message": "AgentBoard server stopped successfully.",
            "killed_pids": killed_pids,
        }, indent=2)
    else:
        return json.dumps({
            "status": "partial",
            "message": (
                "Sent termination signal but server is still responding. "
                "It may take a moment to shut down, or another process is serving port 3000."
            ),
            "killed_pids": killed_pids,
        }, indent=2)


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run()
