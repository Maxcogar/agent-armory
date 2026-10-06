"""Opening a project's persisted index safely, and rebuilding it when it is corrupt.

A persisted index is opened only after (1) every HNSW segment passes the
structural check in utils.hnsw_check, and (2) every collection answers a
probe query. Anything else means the index is corrupt. Only the process
holding the project's WriterLock may discard and rebuild it; any other
process reports it unavailable and leaves it alone.
"""

import logging
import os
import shutil
from typing import Tuple

from config import ALL_COLLECTIONS, ProjectContext, restore_context
from bootstrap import setup_project
from indexer import index_project
from utils import chroma
from utils.hnsw_check import find_corrupt_segments
from utils.paths import index_exists_for


log = logging.getLogger(__name__)


class IndexUnavailable(Exception):
    """The persisted index is absent or failed validation."""


def open_index(project_root: str) -> ProjectContext:
    """Open and probe the existing index without modifying it. Raises IndexUnavailable."""
    root = os.path.abspath(project_root)
    if not index_exists_for(root):
        raise IndexUnavailable("no index built yet")
    ctx = restore_context(root)
    if ctx is None:
        raise IndexUnavailable("index config unreadable")

    problems = find_corrupt_segments(ctx.chroma_db_path)
    if problems:
        raise IndexUnavailable("corrupt HNSW segment(s): " + "; ".join(problems))

    try:
        client = chroma.get_client(ctx.chroma_db_path)
        for name in ALL_COLLECTIONS:
            collection = client.get_collection(name=name)
            if collection.count() > 0:
                collection.query(query_texts=["index probe"], n_results=1)
    except Exception as e:  # includes MemoryError raised under the memory cap
        chroma.close(ctx.chroma_db_path)
        raise IndexUnavailable(f"index failed to load: {type(e).__name__}: {e}") from e
    return ctx


def open_or_rebuild(project_root: str) -> Tuple[ProjectContext, bool]:
    """Open the index, rebuilding it from source if absent or corrupt.

    The caller must hold the project's WriterLock. Returns (context, rebuilt).
    """
    root = os.path.abspath(project_root)
    if not index_exists_for(root):
        log.info("no index for %s; building (may take up to a minute)", root)
    else:
        try:
            return open_index(root), False
        except IndexUnavailable as e:
            log.warning("discarding and rebuilding index for %s: %s", root, e)

    ctx = restore_context(root)  # keeps the user's customSources when config survives
    if ctx is None:
        ctx = setup_project(root, force=False, generate_files=False)["context"]
    chroma.close(ctx.chroma_db_path)
    if os.path.isdir(ctx.chroma_db_path):
        shutil.rmtree(ctx.chroma_db_path)
    index_project(ctx)
    return ctx, True
