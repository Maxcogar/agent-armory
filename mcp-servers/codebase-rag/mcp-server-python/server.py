#!/usr/bin/env python3
"""MCP Server for Codebase RAG.

Auto-detects the project root, opens or builds the index in a per-machine cache
dir, and watches the filesystem so the index stays current as files change.
Agents see two tools: rag_search and rag_query_impact.
"""

import importlib
import os
import sys


# ============================================================
# Dependency check — must run BEFORE any heavy imports below.
# Otherwise a missing chromadb/watchdog/pathspec surfaces as a raw
# ModuleNotFoundError stack trace, defeating the purpose of the check.
# ============================================================


_REQUIRED = ("chromadb", "watchdog", "pathspec", "mcp", "pydantic", "yaml")


def _check_dependencies() -> None:
    missing = []
    for module_name in _REQUIRED:
        try:
            importlib.import_module(module_name)
        except ImportError:
            missing.append(module_name)
    if missing:
        try:
            req_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "requirements.txt")
        except NameError:
            req_path = "requirements.txt"
        sys.stderr.write(
            "[codebase_rag_mcp] Missing dependencies: " + ", ".join(missing) + ".\n"
            "[codebase_rag_mcp] Run: pip install -r " + req_path + "\n"
        )
        sys.exit(2)


_check_dependencies()


# ============================================================
# Heavy imports — safe now that dependencies are verified.
# ============================================================

import json
import os
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict
from mcp.server.fastmcp import FastMCP, Context

from config import ProjectContext, restore_context
from setup import setup_project
from indexer import index_project, index_file
from query import check_constraints, query_impact
from utils.paths import find_project_root, index_exists_for
from utils.chroma import get_client, warmup_embedding_model


CHARACTER_LIMIT = 25_000


# ============================================================
# Server State
# ============================================================


@dataclass
class ServerState:
    project: Optional[ProjectContext] = None
    watcher: Optional[object] = None  # ProjectWatcher; lazy import keeps cycle clean


def _ensure_project_for(root: str) -> Optional[ProjectContext]:
    """Open the cached index for `root`, or build it if absent."""
    abs_root = os.path.abspath(root)
    if index_exists_for(abs_root):
        ctx = restore_context(abs_root)
        if ctx is not None:
            return ctx

    sys.stderr.write(
        f"[codebase_rag_mcp] No index for {abs_root}; building one (this may take "
        "up to a minute on first run for medium projects)...\n"
    )
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

    # Warm the embedding model up front so first-query latency doesn't hide a
    # download that may take tens of seconds (or fail in air-gapped environs).
    warmup_error = warmup_embedding_model()
    if warmup_error:
        sys.stderr.write(f"[codebase_rag_mcp] {warmup_error}\n")

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
    state = ctx.request_context.lifespan_context
    if not isinstance(state, ServerState):
        # Defensive: a future MCP version that wraps lifespan_context would land here.
        raise RuntimeError("Lifespan context is not a ServerState")
    return state


_NO_PROJECT_HINT = (
    "No project root detected. Open Claude Code in a directory that contains "
    ".git, package.json, pyproject.toml, Cargo.toml, or go.mod (or set "
    "RAG_PROJECT_ROOT)."
)


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
    """Semantic search over the current project. Use before editing unfamiliar
    code, when looking for callers/callees, or when checking how similar
    features are already implemented.

    The first call in a brand-new project takes a few seconds while the index
    builds; after that everything is instant and stays fresh as files change.
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
            "summary": _NO_PROJECT_HINT,
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
    """
    params = RagQueryImpactInput(file_path=file_path, num_similar=num_similar)

    state = _state(ctx)
    if state.project is None:
        return ok_response({
            "status": "no_project",
            "filePath": params.file_path,
            "exports": [],
            "apiEndpoints": [],
            "websocketEvents": [],
            "dependents": [],
            "similarFiles": [],
            "summary": _NO_PROJECT_HINT,
        })

    try:
        result = query_impact(state.project, params.file_path, params.num_similar)
        return ok_response({"status": "success", **result})
    except Exception as e:
        return err_response(f"Impact analysis failed: {e}")


# ============================================================
# Start
# ============================================================


if __name__ == "__main__":
    sys.stderr.write("[codebase_rag_mcp] Starting server...\n")
    mcp.run()
