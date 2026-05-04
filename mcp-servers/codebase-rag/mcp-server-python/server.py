#!/usr/bin/env python3
"""MCP Server for Codebase RAG.

Auto-detects the project root, opens or builds the index in a per-machine
cache dir, and watches the filesystem so the index stays current. Agents
see two tools: rag_search and rag_query_impact.
"""

import importlib
import os
import sys


# ============================================================
# Dependency check — must run BEFORE any heavy imports below.
# Otherwise a missing chromadb/watchdog/pathspec/mcp/pydantic/pyyaml
# surfaces as a raw ModuleNotFoundError, defeating the diagnostic.
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
# Logging setup — once, before anything imports `logging.getLogger`
# expecting a configured handler.
# ============================================================

import logging


def _setup_logging() -> None:
    root = logging.getLogger()
    if any(getattr(h, "_codebase_rag_mcp", False) for h in root.handlers):
        return
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter(
        "[codebase_rag_mcp] %(levelname)s %(name)s: %(message)s"
    ))
    handler._codebase_rag_mcp = True  # type: ignore[attr-defined]
    root.addHandler(handler)
    level_name = os.environ.get("RAG_LOG_LEVEL", "INFO").upper()
    root.setLevel(getattr(logging, level_name, logging.INFO))


_setup_logging()
log = logging.getLogger(__name__)


# ============================================================
# Heavy imports — safe now that dependencies are verified.
# ============================================================

import asyncio
import json
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from typing import Literal, Optional

from pydantic import BaseModel, Field, ConfigDict
from mcp.server.fastmcp import FastMCP, Context

from config import ProjectContext, restore_context
from bootstrap import setup_project
from indexer import index_project, index_file
from query import check_constraints, query_impact
from utils.paths import find_project_root, index_exists_for
from utils.chroma import warmup_embedding_model


CHARACTER_LIMIT = 25_000


# ============================================================
# Server State
# ============================================================


@dataclass
class ServerState:
    project: Optional[ProjectContext] = None
    watcher: Optional[object] = None  # ProjectWatcher
    ready: asyncio.Event = field(default_factory=asyncio.Event)
    bootstrap_error: Optional[str] = None


def _ensure_project_for(root: str) -> Optional[ProjectContext]:
    """Open the cached index for `root`, or build it if absent. Sync — call from a worker thread."""
    abs_root = os.path.abspath(root)
    if index_exists_for(abs_root):
        ctx = restore_context(abs_root)
        if ctx is not None:
            return ctx

    log.info("no index for %s; building (may take up to a minute)", abs_root)
    output = setup_project(abs_root, force=False, generate_files=False)
    ctx = output["context"]
    index_project(ctx)
    return ctx


async def _bootstrap(state: ServerState) -> None:
    """Warm the embedding model, open or build the index, start the watcher.

    Runs as a background task so the lifespan yields immediately and tools
    can return an actionable "indexing" response while this is in flight.
    """
    try:
        warmup_error = await asyncio.to_thread(warmup_embedding_model)
        if warmup_error:
            log.error("%s", warmup_error)
            state.bootstrap_error = warmup_error
            return

        project_root = os.environ.get("RAG_PROJECT_ROOT") or find_project_root()
        if not project_root:
            log.info(
                "no project root detected from cwd; rag_search will say so "
                "until run inside a project"
            )
            return

        try:
            project = await asyncio.to_thread(_ensure_project_for, project_root)
        except Exception as e:
            log.error("failed to bootstrap index: %s", e)
            state.bootstrap_error = f"Index bootstrap failed: {e}"
            return

        if project is None:
            state.bootstrap_error = "Index bootstrap returned no project."
            return

        state.project = project

        from watcher import ProjectWatcher

        def _on_change(path: str, gitignore) -> None:
            try:
                index_file(project, path, gitignore=gitignore)
            except Exception as e:
                log.warning("reindex failed for %s: %s", path, e)

        state.watcher = ProjectWatcher(project, on_change=_on_change)
        state.watcher.start()
        log.info("watching %s", project.project_root)
    finally:
        state.ready.set()


@asynccontextmanager
async def app_lifespan(server: FastMCP):
    state = ServerState()
    bootstrap_task = asyncio.create_task(_bootstrap(state))
    try:
        yield state
    finally:
        if state.watcher is not None:
            try:
                state.watcher.stop()
            except Exception as e:
                log.warning("watcher stop error: %s", e)
        if not bootstrap_task.done():
            bootstrap_task.cancel()
            try:
                await bootstrap_task
            except (asyncio.CancelledError, Exception):
                pass


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


def _state(ctx: Context) -> ServerState:
    state = ctx.request_context.lifespan_context
    if not isinstance(state, ServerState):
        raise RuntimeError("Lifespan context is not a ServerState")
    return state


_NO_PROJECT_HINT = (
    "No project root detected. Open Claude Code in a directory that contains "
    ".git, package.json, pyproject.toml, Cargo.toml, or go.mod (or set "
    "RAG_PROJECT_ROOT)."
)


async def _await_ready_or_status(state: ServerState, timeout: float = 5.0) -> Optional[str]:
    """Wait briefly for bootstrap to finish; return a status string if not ready."""
    if state.ready.is_set():
        return None
    try:
        await asyncio.wait_for(state.ready.wait(), timeout=timeout)
    except asyncio.TimeoutError:
        return "indexing"
    return None


# ============================================================
# Inputs
# ============================================================


SourceType = Literal["all", "docs", "code", "constraints"]


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
    source_type: SourceType = Field(
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
    source_type: SourceType = "all",
    ctx: Context = None,
) -> str:
    """Semantic search over the current project. Use before editing
    unfamiliar code, when looking for callers/callees, or when checking
    how similar features are already implemented.
    """
    params = RagSearchInput(query=query, num_results=num_results, source_type=source_type)

    state = _state(ctx)

    not_ready = await _await_ready_or_status(state)
    if not_ready == "indexing":
        return ok_response({
            "status": "indexing",
            "query": params.query,
            "constraints": [],
            "patterns": [],
            "examples": [],
            "summary": "First-run index is still building. Try again in a few seconds.",
        })

    if state.bootstrap_error:
        return ok_response({
            "status": "index_failed",
            "query": params.query,
            "constraints": [],
            "patterns": [],
            "examples": [],
            "summary": state.bootstrap_error,
        })

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
        result = await asyncio.to_thread(
            check_constraints,
            state.project,
            params.query,
            params.num_results,
            params.source_type,
        )
        return ok_response({"status": "success", **result})
    except Exception as e:
        log.warning("search failed: %s", e)
        raise


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
    """Show what depends on a file before you change it: exports,
    importers, and semantically similar files that may need coordinated edits.
    """
    params = RagQueryImpactInput(file_path=file_path, num_similar=num_similar)

    state = _state(ctx)

    not_ready = await _await_ready_or_status(state)
    if not_ready == "indexing":
        return ok_response({
            "status": "indexing",
            "filePath": params.file_path,
            "exports": [],
            "apiEndpoints": [],
            "websocketEvents": [],
            "dependents": [],
            "similarFiles": [],
            "summary": "First-run index is still building. Try again in a few seconds.",
        })

    if state.bootstrap_error:
        return ok_response({
            "status": "index_failed",
            "filePath": params.file_path,
            "exports": [],
            "apiEndpoints": [],
            "websocketEvents": [],
            "dependents": [],
            "similarFiles": [],
            "summary": state.bootstrap_error,
        })

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
        result = await asyncio.to_thread(
            query_impact,
            state.project,
            params.file_path,
            params.num_similar,
        )
        return ok_response({"status": "success", **result})
    except Exception as e:
        log.warning("impact analysis failed: %s", e)
        raise


# ============================================================
# Start
# ============================================================


if __name__ == "__main__":
    log.info("starting server")
    mcp.run()
