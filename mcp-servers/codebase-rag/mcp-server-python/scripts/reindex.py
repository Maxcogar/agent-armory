#!/usr/bin/env python3
"""Reindex helper for hooks and one-off diagnostics.

Two modes:
  --file <path>   Re-index just that file (used by post-edit hooks).
  (no flag)       Full project reindex (used by Stop / SessionStart hooks).

Project root resolution:
  --project-root <path>     Explicit override.
  CLAUDE_PROJECT_DIR env    Used by Claude Code hooks.
  CWD walk-up               Falls back to the same heuristic the server uses.

Exits 0 silently when no project is detected — hooks shouldn't fail just
because they fired in a directory that isn't a project.
"""

import argparse
import os
import sys
from typing import Optional


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SERVER_DIR)

from config import restore_context  # noqa: E402
from indexer import index_project, index_file  # noqa: E402
from setup import setup_project  # noqa: E402
from utils.paths import find_project_root, index_exists_for  # noqa: E402


def _resolve_root(explicit: Optional[str]) -> Optional[str]:
    if explicit:
        return os.path.abspath(explicit)
    env = os.environ.get("CLAUDE_PROJECT_DIR")
    if env:
        return os.path.abspath(env)
    return find_project_root()


def _load_or_build(root: str):
    if index_exists_for(root):
        return restore_context(root)
    output = setup_project(root, force=False, generate_files=False)
    project = output["context"]
    index_project(project)
    return project


def main() -> int:
    parser = argparse.ArgumentParser(description="Reindex codebase RAG.")
    parser.add_argument("--project-root", default=None)
    parser.add_argument("--file", default=None, help="Single file to re-index.")
    args = parser.parse_args()

    if args.file:
        target = os.path.abspath(args.file)
        root = _resolve_root(args.project_root) or find_project_root(os.path.dirname(target))
        if not root:
            return 0
        try:
            project = _load_or_build(root)
        except Exception as e:
            sys.stderr.write(f"[codebase_rag_mcp] reindex.py: load failed: {e}\n")
            return 0
        if project is None:
            return 0
        try:
            index_file(project, target)
        except Exception as e:
            sys.stderr.write(f"[codebase_rag_mcp] reindex.py: index_file failed: {e}\n")
        return 0

    root = _resolve_root(args.project_root)
    if not root:
        return 0
    try:
        project = _load_or_build(root)
    except Exception as e:
        sys.stderr.write(f"[codebase_rag_mcp] reindex.py: load failed: {e}\n")
        return 0
    if project is None:
        return 0
    try:
        index_project(project)
    except Exception as e:
        sys.stderr.write(f"[codebase_rag_mcp] reindex.py: index_project failed: {e}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
