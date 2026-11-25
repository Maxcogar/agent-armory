#!/usr/bin/env python3
"""Reindex helper for hooks and one-off diagnostics.

Two modes:
  --file <path>   Re-index just that file.
  (no flag)       Full project reindex.

Project root resolution:
  --project-root <path>     Explicit override.
  CLAUDE_PROJECT_DIR env    Used by Claude Code hooks.
  CWD walk-up               Falls back to the same heuristic the server uses.

Exits 0 silently when no project is detected — hooks shouldn't fail just
because they fired in a directory that isn't a project.

Exits 0 without touching the index when another process (a running MCP
server, or an earlier invocation of this script) holds the project's writer
lock: that process is already keeping the index current, and ChromaDB does
not support two processes writing one index.
"""

import argparse
import logging
import os
import sys
from typing import Optional


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SERVER_DIR)


def _setup_logging() -> None:
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter(
        "[codebase_rag_mcp] %(levelname)s %(name)s: %(message)s"
    ))
    root = logging.getLogger()
    root.addHandler(handler)
    root.setLevel(getattr(logging, os.environ.get("RAG_LOG_LEVEL", "WARNING").upper(), logging.WARNING))


_setup_logging()


from utils.memlimit import apply_memory_limit  # noqa: E402

apply_memory_limit()


from config import rag_dir  # noqa: E402
from index_store import open_or_rebuild  # noqa: E402
from indexer import index_project, index_file  # noqa: E402
from utils.paths import find_project_root  # noqa: E402
from utils.writer_lock import WriterLock  # noqa: E402


log = logging.getLogger(__name__)


def _resolve_root(explicit: Optional[str]) -> Optional[str]:
    if explicit:
        return os.path.abspath(explicit)
    env = os.environ.get("CLAUDE_PROJECT_DIR")
    if env:
        return os.path.abspath(env)
    return find_project_root()


def _run(root: str, target: Optional[str]) -> None:
    project, rebuilt = open_or_rebuild(root)
    if target is not None:
        index_file(project, target)
    elif not rebuilt:
        index_project(project)


def main() -> int:
    parser = argparse.ArgumentParser(description="Reindex codebase RAG.")
    parser.add_argument("--project-root", default=None)
    parser.add_argument("--file", default=None, help="Single file to re-index.")
    args = parser.parse_args()

    target = os.path.abspath(args.file) if args.file else None
    root = _resolve_root(args.project_root)
    if not root and target is not None:
        root = find_project_root(os.path.dirname(target))
    if not root:
        return 0

    lock = WriterLock(rag_dir(root))
    if not lock.try_acquire():
        log.info("another process owns the index for %s; skipping", root)
        return 0
    try:
        _run(root, target)
    except Exception as e:
        log.warning("reindex failed: %s", e)
    finally:
        lock.release()
    return 0


if __name__ == "__main__":
    sys.exit(main())
