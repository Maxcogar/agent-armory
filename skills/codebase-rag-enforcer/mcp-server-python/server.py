#!/usr/bin/env python3
"""MCP Server for Codebase RAG Constraint Enforcement.

Provides tools to initialize, index, and query a project's architectural
constraints, patterns, and code examples via ChromaDB-backed semantic search.
Uses chromadb.PersistentClient for embedded vector storage (no server needed).
"""

import json
import os
import sys
from contextlib import asynccontextmanager
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict
from mcp.server.fastmcp import FastMCP, Context

from config import ProjectContext, restore_context
from setup import setup_project
from indexer import index_project
from query import check_constraints, query_impact
from health import health_check, get_status


# ============================================================
# Constants
# ============================================================

CHARACTER_LIMIT = 25_000


# ============================================================
# Lifespan
# ============================================================


@asynccontextmanager
async def app_lifespan(server: FastMCP):
    """Manage server-wide state."""
    state = {"current_project": None}
    yield state


# ============================================================
# Server Init
# ============================================================

mcp = FastMCP("codebase_rag_mcp", lifespan=app_lifespan)


# ============================================================
# Response Helpers
# ============================================================


def ok_response(data: dict) -> str:
    """Format a success response as JSON string with truncation."""
    text = json.dumps(data, indent=2, default=str)
    if len(text) > CHARACTER_LIMIT:
        text = text[:CHARACTER_LIMIT] + (
            f"\n\n... [Response truncated at {CHARACTER_LIMIT} characters. "
            "Use filters or smaller num_results to reduce output.]"
        )
    return text


def err_response(message: str) -> str:
    """Format an error response."""
    return f"Error: {message}"


def no_project_error() -> str:
    """Standard error when no project is initialized."""
    return err_response(
        "No project initialized. Call rag_setup first with the project root directory."
    )


def _get_current_project(ctx: Context) -> Optional[ProjectContext]:
    """Get the current project from lifespan state."""
    state = ctx.request_context.lifespan_context
    return state.get("current_project")


def _set_current_project(ctx: Context, project: ProjectContext) -> None:
    """Set the current project in lifespan state."""
    state = ctx.request_context.lifespan_context
    state["current_project"] = project


# ============================================================
# Pydantic Input Models
# ============================================================


class RagSetupInput(BaseModel):
    """Input model for rag_setup tool."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    project_root: str = Field(
        ...,
        description="Absolute path to the project root directory",
        min_length=1,
    )
    frontend_path: Optional[str] = Field(
        default=None,
        description="Override: frontend directory path (relative to project_root or absolute)",
    )
    backend_path: Optional[str] = Field(
        default=None,
        description="Override: backend directory path (relative to project_root or absolute)",
    )
    force: bool = Field(
        default=False,
        description="If true, overwrite existing generated files (default: false)",
    )


class RagIndexInput(BaseModel):
    """Input model for rag_index tool."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    project_root: Optional[str] = Field(
        default=None,
        description="Absolute path to project root. Uses current project context if omitted.",
    )


class RagCheckConstraintsInput(BaseModel):
    """Input model for rag_check_constraints tool."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    change_description: str = Field(
        ...,
        description="Natural language description of the planned change",
        min_length=3,
        max_length=2000,
    )
    num_results: int = Field(
        default=5,
        description="Maximum results to return per collection (default: 5)",
        ge=1,
        le=20,
    )


class RagQueryImpactInput(BaseModel):
    """Input model for rag_query_impact tool."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    file_path: str = Field(
        ...,
        description="File path relative to project root (e.g., 'backend/routes/auth.js')",
        min_length=1,
    )
    num_similar: int = Field(
        default=5,
        description="Maximum similar files to return (default: 5)",
        ge=1,
        le=20,
    )


# ============================================================
# Tool: rag_setup
# ============================================================


@mcp.tool(
    name="rag_setup",
    annotations={
        "title": "Initialize RAG Project",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_setup(
    project_root: str,
    frontend_path: Optional[str] = None,
    backend_path: Optional[str] = None,
    force: bool = False,
    ctx: Context = None,
) -> str:
    """Initializes a project for RAG-based constraint enforcement. This MUST be called first before using any other rag_ tools.

    Scans the project directory to auto-detect frontend and backend paths, analyzes code patterns, and generates:
      - ARCHITECTURE.yml with detected constraints and patterns
      - docs/patterns/*.md with documented code patterns from your actual codebase
      - ChromaDB collections directory at {project_root}/.rag/collections

    Auto-detection logic:
      - Frontend: looks for package.json with react/vue/angular/svelte/vite in frontend/, src/, client/ directories
      - Backend: looks for package.json with express/fastify/koa, requirements.txt, or go.mod in backend/, server/, api/ directories

    You can override auto-detection by providing explicit frontend_path and backend_path arguments.

    After setup, call rag_index to populate the search collections.

    Args:
        project_root (str): Absolute path to the project root directory
        frontend_path (Optional[str]): Override auto-detected frontend directory
        backend_path (Optional[str]): Override auto-detected backend directory
        force (bool): If true, overwrite existing generated files

    Returns:
        str: JSON containing status, detected paths, generated files, and patterns.

    Examples:
        - Use when: "Set up RAG for my project" -> project_root="/path/to/project"
        - Use when: "Re-initialize with custom paths" -> project_root="/path", frontend_path="web", force=true
        - Don't use when: Project is already set up and you just need to re-index (use rag_index instead)
    """
    params = RagSetupInput(project_root=project_root, frontend_path=frontend_path, backend_path=backend_path, force=force)
    resolved_root = os.path.abspath(params.project_root)
    sys.stderr.write(f"[codebase_rag_mcp] Setting up project: {resolved_root}\n")

    try:
        output = setup_project(
            resolved_root,
            params.frontend_path,
            params.backend_path,
            params.force,
        )
        _set_current_project(ctx, output["context"])
        return ok_response(output["result"])
    except (ValueError, OSError) as e:
        return err_response(f"Setup failed: {e}")


# ============================================================
# Tool: rag_index
# ============================================================


@mcp.tool(
    name="rag_index",
    annotations={
        "title": "Index Codebase Into RAG Collections",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_index(
    project_root: Optional[str] = None,
    ctx: Context = None,
) -> str:
    """Indexes (or re-indexes) the project codebase into ChromaDB collections for semantic search. Scans all matching files, chunks them, computes embeddings, and stores them in three collections:

      - "codebase": Code files chunked with metadata (imports, exports, endpoints)
      - "constraints": ARCHITECTURE.yml, CONSTRAINTS.md, CLAUDE.md (high weight)
      - "patterns": docs/patterns/*.md files (high weight)

    Constraint and pattern documents are given higher weight multipliers so they appear first in search results, ensuring agents see architectural rules before random code examples.

    Uses ChromaDB's built-in embedding function (no external model download needed).

    This performs a FULL re-index (drops and recreates collections). Incremental indexing is not currently supported.

    Args:
        project_root (Optional[str]): Absolute path to project root. Uses current context if omitted.

    Returns:
        str: JSON containing indexing stats, collection counts, errors, and duration.

    Examples:
        - Use when: "Index my codebase" -> (no args, uses current project)
        - Use when: "Index a different project" -> project_root="/other/project"
        - Don't use when: You haven't run rag_setup yet (run that first)

    Prerequisite: rag_setup must be called first.
    """
    project = _get_current_project(ctx)

    if project_root:
        resolved_root = os.path.abspath(project_root)
        project = restore_context(resolved_root)
        if not project:
            return err_response(
                f"No .rag/ configuration found at {resolved_root}. Run rag_setup first."
            )
        _set_current_project(ctx, project)

    if not project:
        return no_project_error()

    sys.stderr.write(f"[codebase_rag_mcp] Indexing project: {project.project_root}\n")

    try:
        stats = index_project(project)

        error_warning = f" {len(stats['errors'])} error(s)." if stats["errors"] else ""

        output = {
            "status": "success",
            "projectRoot": project.project_root,
            "filesIndexed": stats["filesIndexed"],
            "chunksCreated": stats["chunksCreated"],
            "collectionStats": stats["collectionStats"],
            "errors": stats["errors"],
            "duration": stats["duration"],
            "message": (
                f"Indexed {stats['filesIndexed']} files "
                f"({stats['chunksCreated']} chunks).{error_warning} "
                "Use rag_check_constraints to query."
            ),
        }

        return ok_response(output)
    except Exception as e:
        return err_response(f"Indexing failed: {e}")


# ============================================================
# Tool: rag_check_constraints
# ============================================================


@mcp.tool(
    name="rag_check_constraints",
    annotations={
        "title": "Check Constraints for a Planned Change",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_check_constraints(
    change_description: str,
    num_results: int = 5,
    ctx: Context = None,
) -> str:
    """The PRIMARY tool for agents. Queries the RAG system to find all architectural constraints, patterns, and code examples relevant to a planned change.

    Returns results from three collections, ordered by relevance:
      1. CONSTRAINTS: Rules from ARCHITECTURE.yml, CONSTRAINTS.md, CLAUDE.md that the change MUST follow. These have 10x weight and appear first.
      2. PATTERNS: Documented patterns from docs/patterns/ showing HOW to implement correctly. These have 8x weight.
      3. EXAMPLES: Actual code from the codebase showing existing implementations of similar functionality.

    Each result includes a relevance score (0-1, higher is better) and the source file path.

    Use this BEFORE making any change to understand what rules apply.

    Args:
        change_description (str): Natural language description of the planned change.
            Good: "Add a new POST /api/users/profile endpoint with auth middleware"
            Bad: "change something"
        num_results (int): Max results per collection (1-20, default: 5)

    Returns:
        str: JSON containing constraints, patterns, examples with relevance scores.

    Examples:
        - Use when: "What rules apply to adding a new API endpoint?" -> change_description="add new REST API endpoint"
        - Use when: "Constraints for modifying auth?" -> change_description="modify authentication middleware"
        - Don't use when: You need to analyze impact on a specific file (use rag_query_impact instead)

    Prerequisite: rag_setup and rag_index must be called first.
    """
    project = _get_current_project(ctx)
    if not project:
        return no_project_error()

    try:
        result = check_constraints(
            project,
            change_description,
            num_results,
        )
        return ok_response({"status": "success", **result})
    except Exception as e:
        return err_response(f"Constraint check failed: {e}")


# ============================================================
# Tool: rag_query_impact
# ============================================================


@mcp.tool(
    name="rag_query_impact",
    annotations={
        "title": "Analyze Change Impact (Blast Radius)",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_query_impact(
    file_path: str,
    num_similar: int = 5,
    ctx: Context = None,
) -> str:
    """Analyzes the blast radius of changing a specific file. Shows what the file exports, what other files depend on it, and semantically similar files that might need coordinated changes.

    Returns three categories:
      1. EXPORTS: Functions, classes, constants, API endpoints, and WebSocket events exported by the file.
      2. DEPENDENTS: Other files that import from this file. These will break if exports change.
      3. SIMILAR FILES: Files with semantically similar content that might need coordinated updates.

    Uses both metadata-based import tracking AND semantic similarity to find related files.

    Args:
        file_path (str): File path relative to project root (e.g., "backend/routes/auth.js"). Must use forward slashes.
        num_similar (int): Max similar files to return (1-20, default: 5)

    Returns:
        str: JSON containing exports, endpoints, dependents, and similar files.

    Examples:
        - Use when: "What breaks if I change auth.js?" -> file_path="backend/routes/auth.js"
        - Use when: "Impact of modifying the user model?" -> file_path="backend/models/user.js"
        - Don't use when: You need to check architectural rules (use rag_check_constraints instead)

    Prerequisite: rag_setup and rag_index must be called first.
    """
    project = _get_current_project(ctx)
    if not project:
        return no_project_error()

    try:
        result = query_impact(project, file_path, num_similar)
        return ok_response({"status": "success", **result})
    except (ValueError, Exception) as e:
        return err_response(f"Impact analysis failed: {e}")


# ============================================================
# Tool: rag_health_check
# ============================================================


@mcp.tool(
    name="rag_health_check",
    annotations={
        "title": "Check RAG System Health",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_health_check(ctx: Context) -> str:
    """Runs diagnostic checks on the RAG system and reports issues.

    Checks performed:
      1. ChromaDB connection: Can we connect and read collections?
      2. Collection existence: Do all three collections (codebase, constraints, patterns) exist?
      3. Collection sizes: Are collections populated? Flags empty collections.
      4. Constraint files: Do ARCHITECTURE.yml and CONSTRAINTS.md exist on disk?
      5. Test query: Can we perform a semantic search and get results?
      6. Staleness: How old is the index? Warns if > 7 days since last index.

    Returns a structured report with issues (critical) and warnings (non-critical).

    Returns:
        str: JSON containing:
        {
            "status": "success",
            "healthy": true,
            "collections": { "codebase": { "exists": true, "chunks": 372 }, ... },
            "constraintFiles": { "ARCHITECTURE.yml": true, "CONSTRAINTS.md": false, "CLAUDE.md": true },
            "queryTest": "passed",
            "lastIndexed": "2026-02-20T14:30:00.000Z",
            "issues": [],
            "warnings": ["Missing constraint file: CONSTRAINTS.md"]
        }

    Examples:
        - Use when: "Is the RAG system working?" -> (no args)
        - Use when: "Why am I getting no results?" -> check the issues array
        - Don't use when: You just need a quick status (use rag_status instead)

    Error Handling:
        - Returns error if no project context (not initialized)

    Prerequisite: rag_setup must have been called at some point.
    """
    project = _get_current_project(ctx)
    if not project:
        return no_project_error()

    try:
        report = health_check(project)
        return ok_response({"status": "success", **report})
    except Exception as e:
        return err_response(f"Health check failed: {e}")


# ============================================================
# Tool: rag_status
# ============================================================


@mcp.tool(
    name="rag_status",
    annotations={
        "title": "Quick RAG Status Check",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_status(ctx: Context) -> str:
    """Returns a quick summary of the RAG system state. Lighter than rag_health_check - does not run a test query or check constraint files on disk.

    Use this to quickly check if the system is initialized and has data before running queries. Returns in milliseconds.

    Returns:
        str: JSON containing:
        {
            "status": "success",
            "initialized": true,
            "projectRoot": "/abs/path/to/project",
            "indexed": true,
            "lastIndexed": "2026-02-20T14:30:00.000Z",
            "totalChunks": 387,
            "collectionCounts": { "codebase": 372, "constraints": 3, "patterns": 12 }
        }

    Examples:
        - Use when: "Is RAG set up?" -> check initialized field
        - Use when: "When was the last index?" -> check lastIndexed field
        - Don't use when: You need full diagnostics (use rag_health_check instead)
    """
    project = _get_current_project(ctx)

    try:
        status = get_status(project)
        return ok_response({"status": "success", **status})
    except Exception as e:
        return err_response(f"Status check failed: {e}")


# ============================================================
# Start Server
# ============================================================

if __name__ == "__main__":
    sys.stderr.write("[codebase_rag_mcp] Starting server...\n")
    mcp.run()
