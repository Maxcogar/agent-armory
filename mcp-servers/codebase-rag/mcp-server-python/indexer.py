"""Codebase indexing into ChromaDB collections.

Routing and scoping decisions live in `scope.py`. ChromaDB client lifecycle
lives in `utils.chroma.get_client`. This module owns the chunk-and-embed
loop and per-file incremental updates.
"""

import os
import sys
import threading
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from config import (
    ProjectContext,
    COLLECTION_CODEBASE,
    COLLECTION_CONSTRAINTS,
    COLLECTION_PATTERNS,
    write_config,
)
from utils.paths import safe_relative_path, ensure_dir
from utils.chroma import get_client
from utils.chunker import chunk_content
from utils.metadata import (
    extract_imports,
    extract_exports,
    extract_api_endpoints,
    extract_ws_events,
    detect_language,
)
import scope


# ============================================================
# Concurrency primitives
# ============================================================

_file_index_locks: Dict[str, threading.Lock] = {}
_file_index_locks_mutex = threading.Lock()


def _lock_for(abs_path: str) -> threading.Lock:
    with _file_index_locks_mutex:
        lock = _file_index_locks.get(abs_path)
        if lock is None:
            lock = threading.Lock()
            _file_index_locks[abs_path] = lock
        return lock


# ============================================================
# Throttled config persistence
#
# write_config rewrites the entire config.json. The watcher fires on every
# save, so naively persisting on every index_file call disk-storms. We
# update ctx.last_indexed_at in memory immediately, but flush to disk at
# most once per 5 seconds.
# ============================================================

_LAST_FLUSH_INTERVAL_S = 5.0
_last_flush: Dict[str, float] = {}
_flush_mutex = threading.Lock()


def _bump_last_indexed_at(ctx: ProjectContext, force_flush: bool = False) -> None:
    ctx.last_indexed_at = datetime.now(timezone.utc).isoformat()
    now = time.monotonic()
    with _flush_mutex:
        last = _last_flush.get(ctx.project_root, 0.0)
        if not force_flush and (now - last) < _LAST_FLUSH_INTERVAL_S:
            return
        _last_flush[ctx.project_root] = now
    try:
        write_config(ctx)
    except OSError as e:
        sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to persist config: {e}\n")


# ============================================================
# File discovery
# ============================================================


def discover_indexable_files(ctx: ProjectContext) -> List[Dict[str, Any]]:
    """Walk the project tree and return one entry per indexable file.

    Each entry: {"abs_path": str, "category": scope.Category}.
    Honors exclude_dirs, .gitignore, and extension/constraint rules.
    """
    project_root = os.path.abspath(ctx.project_root)
    gitignore = scope._load_gitignore(project_root)
    results: List[Dict[str, Any]] = []

    for dirpath, dirnames, filenames in os.walk(project_root):
        # Prune excluded directories in-place so os.walk doesn't descend.
        dirnames[:] = [
            d for d in dirnames
            if d not in ctx.config.exclude_dirs
        ]

        for fname in filenames:
            abs_path = os.path.join(dirpath, fname)
            if not scope.is_in_scope(abs_path, ctx, gitignore=gitignore):
                continue
            category = scope.categorize(abs_path, ctx)
            if category is None:
                continue
            results.append({"abs_path": abs_path, "category": category})

    return results


# ============================================================
# Chunk + embed helpers
# ============================================================


def _build_chunk_metadata(
    rel_path: str,
    chunk,
    language: str,
    imports: List[str],
    exports: List[str],
    api_endpoints: List[str],
    ws_events: List[str],
    weight: float,
    type_label: str,
    source_type: str,
) -> Dict[str, Any]:
    return {
        "filePath": rel_path,
        "chunkIndex": chunk.index,
        "totalChunks": chunk.total_chunks,
        "language": language,
        "imports": ",".join(imports),
        "exports": ",".join(exports),
        "apiEndpoints": ",".join(api_endpoints),
        "wsEvents": ",".join(ws_events),
        "weight": weight,
        "type": type_label,
        "source_type": source_type,
    }


def _read_text(abs_path: str) -> Optional[str]:
    try:
        with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError as e:
        sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to read {abs_path}: {e}\n")
        return None


def _embed_one_file(
    ctx: ProjectContext,
    abs_path: str,
    category: scope.Category,
    collection,
    stat_key: Optional[str] = None,
    stats: Optional[Dict[str, Any]] = None,
) -> int:
    """Read, chunk, and embed a file into the given collection.

    Returns the number of chunks added (0 on empty/unreadable file).
    """
    content = _read_text(abs_path)
    if content is None or not content.strip():
        return 0

    rel_path = safe_relative_path(ctx.project_root, abs_path)
    language = detect_language(rel_path)
    if category.collection == COLLECTION_CODEBASE:
        imports = extract_imports(content, language)
        exports = extract_exports(content, language)
        api_endpoints = extract_api_endpoints(content)
        ws_events = extract_ws_events(content)
    else:
        imports = exports = api_endpoints = ws_events = []

    chunks = chunk_content(rel_path, content)
    if not chunks:
        return 0

    ids: List[str] = []
    documents: List[str] = []
    metadatas: List[Dict[str, Any]] = []
    for chunk in chunks:
        ids.append(chunk.id)
        documents.append(chunk.content)
        metadatas.append(_build_chunk_metadata(
            rel_path=rel_path,
            chunk=chunk,
            language=language,
            imports=imports,
            exports=exports,
            api_endpoints=api_endpoints,
            ws_events=ws_events,
            weight=category.weight,
            type_label=category.type_label,
            source_type=category.source_type,
        ))

    batch_size = 100
    for i in range(0, len(ids), batch_size):
        collection.add(
            ids=ids[i:i + batch_size],
            documents=documents[i:i + batch_size],
            metadatas=metadatas[i:i + batch_size],
        )

    if stats is not None and stat_key is not None:
        stats["collectionStats"][stat_key] += len(ids)
        stats["chunksCreated"] += len(ids)

    return len(ids)


# ============================================================
# Full project index
# ============================================================


_COLLECTION_TO_STAT_KEY = {
    COLLECTION_CODEBASE: "codebase",
    COLLECTION_CONSTRAINTS: "constraints",
    COLLECTION_PATTERNS: "patterns",
}


def index_project(ctx: ProjectContext) -> Dict[str, Any]:
    """Full re-index: drops and recreates collections, embeds every file in scope."""
    start_time = time.time()
    errors: List[Dict[str, str]] = []

    ensure_dir(ctx.chroma_db_path)
    client = get_client(ctx.chroma_db_path)

    # Drop and recreate the three named collections.
    for name in (COLLECTION_CODEBASE, COLLECTION_CONSTRAINTS, COLLECTION_PATTERNS):
        try:
            client.delete_collection(name=name)
        except Exception as e:
            sys.stderr.write(
                f'[codebase_rag_mcp] Note: collection "{name}" did not exist ({e})\n'
            )

    collections = {
        name: client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )
        for name in (COLLECTION_CODEBASE, COLLECTION_CONSTRAINTS, COLLECTION_PATTERNS)
    }

    stats: Dict[str, Any] = {
        "filesIndexed": 0,
        "chunksCreated": 0,
        "collectionStats": {"codebase": 0, "constraints": 0, "patterns": 0},
        "errors": errors,
        "duration": 0,
    }

    entries = discover_indexable_files(ctx)
    for entry in entries:
        abs_path = entry["abs_path"]
        category: scope.Category = entry["category"]
        target_collection = collections[category.collection]
        stat_key = _COLLECTION_TO_STAT_KEY[category.collection]
        try:
            added = _embed_one_file(
                ctx=ctx,
                abs_path=abs_path,
                category=category,
                collection=target_collection,
                stat_key=stat_key,
                stats=stats,
            )
            if added > 0 or os.path.getsize(abs_path) == 0:
                stats["filesIndexed"] += 1
        except Exception as e:
            rel = safe_relative_path(ctx.project_root, abs_path)
            sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to index {rel}: {e}\n")
            errors.append({"file": rel, "error": str(e)})

    _bump_last_indexed_at(ctx, force_flush=True)
    stats["duration"] = round(time.time() - start_time, 2)
    return stats


# ============================================================
# Per-file incremental index
# ============================================================


def index_file(ctx: ProjectContext, file_path: str) -> Dict[str, Any]:
    """Re-embed a single file. Idempotent.

    Returns a dict with a stable shape:
      {"status": "indexed" | "deleted" | "skipped" | "empty" | "error",
       "filePath": str,
       "collection": Optional[str],
       "chunks": int,
       "reason": Optional[str]}
    """
    abs_path = os.path.abspath(file_path)
    rel_path = safe_relative_path(ctx.project_root, abs_path)

    category = scope.categorize(abs_path, ctx)
    if category is None:
        return {
            "status": "skipped",
            "filePath": rel_path,
            "collection": None,
            "chunks": 0,
            "reason": "out of scope",
        }

    lock = _lock_for(abs_path)
    with lock:
        ensure_dir(ctx.chroma_db_path)
        client = get_client(ctx.chroma_db_path)
        collection = client.get_or_create_collection(
            name=category.collection,
            metadata={"hnsw:space": "cosine"},
        )

        try:
            collection.delete(where={"filePath": rel_path})
        except Exception as e:
            sys.stderr.write(
                f"[codebase_rag_mcp] Warning: failed to clear prior chunks for {rel_path}: {e}\n"
            )

        if not os.path.isfile(abs_path):
            _bump_last_indexed_at(ctx)
            return {
                "status": "deleted",
                "filePath": rel_path,
                "collection": category.collection,
                "chunks": 0,
                "reason": None,
            }

        added = _embed_one_file(
            ctx=ctx,
            abs_path=abs_path,
            category=category,
            collection=collection,
        )

        _bump_last_indexed_at(ctx)
        if added == 0:
            return {
                "status": "empty",
                "filePath": rel_path,
                "collection": category.collection,
                "chunks": 0,
                "reason": "file empty or unreadable",
            }
        return {
            "status": "indexed",
            "filePath": rel_path,
            "collection": category.collection,
            "chunks": added,
            "reason": None,
        }
