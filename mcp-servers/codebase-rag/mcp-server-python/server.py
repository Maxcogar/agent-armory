#!/usr/bin/env python3
"""MCP Server for Codebase RAG.

Auto-detects the project root, opens or builds the index in a per-machine cache
dir, and watches the filesystem so the index stays current as files change.
Agents see two tools: rag_search and rag_query_impact.
"""

import json
import os
import sys
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict
from mcp.server.fastmcp import FastMCP, Context

from config import ProjectContext, restore_context
from setup import setup_project
from indexer import index_project, index_file
from query import check_constraints, query_impact
from utils.paths import find_project_root, index_exists_for


CHARACTER_LIMIT = 25_000


# ============================================================
# Server State
# ============================================================


@dataclass
class ServerState:
    project: Optional[ProjectContext] = None
    watcher: Optional[object] = None  # ProjectWatcher; loaded lazily to keep import cycle safe


def _ensure_project_for(root: str) -> Optional[ProjectContext]:
    """Open the cached index for `root`, or build it if absent."""
    abs_root = os.path.abspath(root)
    if index_exists_for(abs_root):
        ctx = restore_context(abs_root)
        if ctx is not None:
            return ctx

    sys.stderr.write(f"[codebase_rag_mcp] No index for {abs_root}; building (one-time)...\n")
    try:
        output = setup_project(abs_root, force=False, generate_files=False)
        ctx = output["context"]
        index_project(ctx)
        return ctx
    except (ValueError, OSError) as e:
        sys.stderr.write(f"[codebase_rag_mcp] Failed to bootstrap index: {e}\n")
        return None


@asynccontextmanager
async def app_lifespan(server: FastMCP):
    state = ServerState()
    project_root = os.environ.get("RAG_PROJECT_ROOT") or find_project_root()
    if project_root:
        state.project = _ensure_project_for(project_root)
        if state.project is not None:
            from watcher import ProjectWatcher

            project = state.project

            def _on_change(path: str) -> None:
                try:
                    index_file(project, path)
                except Exception as e:
                    sys.stderr.write(
                        f"[codebase_rag_mcp] reindex failed for {path}: {e}\n"
                    )

            state.watcher = ProjectWatcher(project, on_change=_on_change)
            state.watcher.start()
            sys.stderr.write(f"[codebase_rag_mcp] watching {project.project_root}\n")
    else:
        sys.stderr.write(
            "[codebase_rag_mcp] No project root detected from cwd; "
            "rag_search will return an empty hint until run inside a project.\n"
        )

    try:
        yield state
    finally:
        if state.watcher is not None:
            try:
                state.watcher.stop()
            except Exception as e:
                sys.stderr.write(f"[codebase_rag_mcp] watcher stop error: {e}\n")


mcp = FastMCP("codebase_rag_mcp", lifespan=app_lifespan)


# ============================================================
# Helpers
# ============================================================


def ok_response(data: dict) -> str:
    text = json.dumps(data, indent=2, default=str)
    if len(text) > CHARACTER_LIMIT:
        text = text[:CHARACTER_LIMIT] + (
            f"\n\n... [Response truncated at {CHARACTER_LIMIT} characters. "
            "Use a smaller num_results to reduce output.]"
        )
    return text


def err_response(message: str) -> str:
    return f"Error: {message}"


def _state(ctx: Context) -> ServerState:
    return ctx.request_context.lifespan_context


# ============================================================
# Inputs
# ============================================================


class RagSearchInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    query: str = Field(
        ...,
        description="Natural-language description of what you're looking for",
        min_length=3,
        max_length=2000,
    )
    num_results: int = Field(
        default=5,
        description="Maximum results to return per collection (default: 5)",
        ge=1,
        le=20,
    )
    source_type: str = Field(
        default="all",
        description=(
            'Filter results by source type. "all" (default), '
            '"docs" (constraints + patterns), "code" (source code only), '
            'or "constraints" (constraint files only).'
        ),
    )


class RagQueryImpactInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    file_path: str = Field(
        ...,
        description="File path relative to the project root (use forward slashes)",
        min_length=1,
    )
    num_similar: int = Field(
        default=5,
        description="Maximum similar files to return (default: 5)",
        ge=1,
        le=20,
    )


# ============================================================
# Tool: rag_search
# ============================================================


@mcp.tool(
    name="rag_search",
    annotations={
        "title": "Search the Project for Related Code, Patterns, and Constraints",
        "readOnlyHint": True,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_search(
    query: str,
    num_results: int = 5,
    source_type: str = "all",
    ctx: Context = None,
) -> str:
    """Semantic search over the current project. Use this before editing
    unfamiliar code, when looking for callers/callees, or when checking how
    similar features are already implemented.

    The first call in a brand-new project takes a few seconds while the index
    builds; after that everything is instant and stays fresh as files change.

    Args:
        query: Natural-language description of what you're looking for.
            Good: "how is auth middleware applied to API routes?"
            Bad: "auth"
        num_results: Max results per collection (1-20, default: 5).
        source_type: "all", "docs", "code", or "constraints" (default: "all").

    Returns:
        JSON with constraints, patterns, and code examples ranked by relevance.
    """
    params = RagSearchInput(query=query, num_results=num_results, source_type=source_type)

    valid_types = ("all", "docs", "code", "constraints")
    if params.source_type not in valid_types:
        return err_response(
            f"Invalid source_type '{params.source_type}'. Must be one of: {', '.join(valid_types)}"
        )

    state = _state(ctx)
    if state.project is None:
        return ok_response({
            "status": "no_project",
            "query": params.query,
            "constraints": [],
            "patterns": [],
            "examples": [],
            "summary": (
                "No project root detected. Open Claude Code in a directory "
                "that contains a .git, package.json, pyproject.toml, Cargo.toml, "
                "or go.mod (or set RAG_PROJECT_ROOT)."
            ),
        })

    try:
        result = check_constraints(
            state.project,
            params.query,
            params.num_results,
            source_type=params.source_type,
        )
        return ok_response({"status": "success", **result})
    except Exception as e:
        return err_response(f"Search failed: {e}")


# ============================================================
# Tool: rag_query_impact
# ============================================================


@mcp.tool(
    name="rag_query_impact",
    annotations={
        "title": "Analyze Change Impact (Blast Radius)",
        "readOnlyHint": True,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def rag_query_impact(
    file_path: str,
    num_similar: int = 5,
    ctx: Context = None,
) -> str:
    """Show what depends on a file before you change it: exports, importers,
    and semantically similar files that may need coordinated edits.

    Args:
        file_path: Relative path from the project root (forward slashes).
        num_similar: Max similar files to return (1-20, default: 5).

    Returns:
        JSON with exports, dependents, and similar files.
    """
    params = RagQueryImpactInput(file_path=file_path, num_similar=num_similar)

    state = _state(ctx)
    if state.project is None:
        return ok_response({
            "status": "no_project",
            "filePath": params.file_path,
            "exports": [],
            "dependents": [],
            "similarFiles": [],
            "summary": (
                "No project root detected. Open Claude Code in a directory "
                "that contains a .git, package.json, pyproject.toml, Cargo.toml, "
                "or go.mod (or set RAG_PROJECT_ROOT)."
            ),
        })

    try:
        result = query_impact(state.project, params.file_path, params.num_similar)
        return ok_response({"status": "success", **result})
    except ValueError as e:
        return err_response(f"Impact analysis failed: {e}")
    except Exception as e:
        return err_response(f"Impact analysis failed: {e}")


# ============================================================
# Start
# ============================================================


def _check_dependencies() -> None:
    missing = []
    try:
        import chromadb  # noqa: F401
    except ImportError:
        missing.append("chromadb")
    try:
        import watchdog  # noqa: F401
    except ImportError:
        missing.append("watchdog")
    if missing:
        sys.stderr.write(
            f"[codebase_rag_mcp] Missing dependencies: {', '.join(missing)}. "
            "Run: pip install -r requirements.txt\n"
        )
        sys.exit(1)


if __name__ == "__main__":
    _check_dependencies()
    sys.stderr.write("[codebase_rag_mcp] Starting server...\n")
    mcp.run()
