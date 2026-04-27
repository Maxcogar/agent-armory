"""Codebase indexing into ChromaDB collections."""

import fnmatch
import os
import sys
import threading
import time
import glob as globmod
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings

from config import (
    ProjectContext,
    CustomSource,
    COLLECTION_CODEBASE,
    COLLECTION_CONSTRAINTS,
    COLLECTION_PATTERNS,
    SOURCE_TYPE_CONSTRAINTS,
    SOURCE_TYPE_DOCS,
    SOURCE_TYPE_CODE,
    write_config,
)
from utils.paths import safe_relative_path, ensure_dir
from utils.chunker import chunk_content
from utils.metadata import (
    extract_imports,
    extract_exports,
    extract_api_endpoints,
    extract_ws_events,
    detect_language,
)


# Per-file lock so two near-simultaneous edits of the same file don't race.
_file_index_locks: Dict[str, threading.Lock] = {}
_file_index_locks_mutex = threading.Lock()


def _lock_for(abs_path: str) -> threading.Lock:
    with _file_index_locks_mutex:
        lock = _file_index_locks.get(abs_path)
        if lock is None:
            lock = threading.Lock()
            _file_index_locks[abs_path] = lock
        return lock


def should_index(abs_path: str, ctx: ProjectContext) -> bool:
    """True iff a file is in scope for indexing (right ext, not excluded)."""
    if not abs_path.startswith(os.path.abspath(ctx.project_root)):
        return False
    parts = abs_path.replace("\\", "/").split("/")
    for excl in ctx.config.exclude_dirs:
        if excl in parts:
            return False
    _, ext = os.path.splitext(abs_path)
    if not ext:
        # Allow extensionless files only if they match a constraint name.
        rel = safe_relative_path(ctx.project_root, abs_path)
        return rel in ("ARCHITECTURE.yml", "ARCHITECTURE.yaml", "CONSTRAINTS.md", "CLAUDE.md")
    return ext in ctx.config.include_extensions


def _classify(abs_path: str, ctx: ProjectContext) -> Optional[Dict[str, Any]]:
    """Decide which collection a file belongs in. Returns None if out of scope.

    Mirrors the routing baked into index_project: constraint names at the
    root → constraints, files under docs/patterns/ → patterns, custom-source
    matches → their declared collection, anything else with a code ext →
    codebase.
    """
    if not should_index(abs_path, ctx):
        return None

    rel = safe_relative_path(ctx.project_root, abs_path)
    weights = ctx.config.weights

    if rel in ("ARCHITECTURE.yml", "ARCHITECTURE.yaml", "CONSTRAINTS.md", "CLAUDE.md"):
        return {
            "collection": COLLECTION_CONSTRAINTS,
            "type": "constraint",
            "source_type": SOURCE_TYPE_CONSTRAINTS,
            "weight": compute_weight(rel, weights),
        }

    norm_rel = rel.replace("\\", "/")
    if norm_rel.startswith("docs/patterns/") and rel.endswith(".md"):
        return {
            "collection": COLLECTION_PATTERNS,
            "type": "pattern",
            "source_type": SOURCE_TYPE_DOCS,
            "weight": compute_weight(rel, weights),
        }

    for source in ctx.config.custom_sources:
        if fnmatch.fnmatch(norm_rel, source.pattern.replace("\\", "/")):
            collection = {
                SOURCE_TYPE_CONSTRAINTS: COLLECTION_CONSTRAINTS,
                SOURCE_TYPE_DOCS: COLLECTION_PATTERNS,
                SOURCE_TYPE_CODE: COLLECTION_CODEBASE,
            }.get(source.source_type, COLLECTION_PATTERNS)
            return {
                "collection": collection,
                "type": "custom",
                "source_type": source.source_type,
                "weight": source.weight,
            }

    _, ext = os.path.splitext(rel)
    if ext in (".yml", ".yaml", ".md", ".json"):
        # Non-code extensions that aren't constraints/patterns aren't in the codebase collection.
        return None

    return {
        "collection": COLLECTION_CODEBASE,
        "type": "code",
        "source_type": SOURCE_TYPE_CODE,
        "weight": compute_weight(rel, weights),
    }


def _bump_last_indexed_at(ctx: ProjectContext) -> None:
    ctx.last_indexed_at = datetime.now(timezone.utc).isoformat()
    try:
        write_config(ctx)
    except OSError as e:
        sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to persist config: {e}\n")


# ============================================================
# Weight Computation
# ============================================================


def compute_weight(relative_path: str, weights: Dict[str, float]) -> float:
    """Compute weight for a file, using longest (most specific) pattern match first."""
    sorted_patterns = sorted(weights.items(), key=lambda x: len(x[0]), reverse=True)
    for pattern, weight in sorted_patterns:
        if pattern in relative_path:
            return weight
    return 1.0


# ============================================================
# File Discovery
# ============================================================


def discover_files(
    project_root: str,
    extensions: List[str],
    exclude_dirs: List[str],
) -> List[str]:
    """Discover all matching files, excluding specified directories."""
    all_files: set[str] = set()

    for ext in extensions:
        pattern = os.path.join(project_root, "**", f"*{ext}")
        matches = globmod.glob(pattern, recursive=True)
        for match in matches:
            # Check if any excluded dir is in the path
            norm_match = match.replace("\\", "/")
            parts = norm_match.split("/")
            if not any(excl in parts for excl in exclude_dirs):
                all_files.add(os.path.abspath(match))

    return list(all_files)


def find_constraint_files(project_root: str) -> List[str]:
    """Find constraint files (ARCHITECTURE.yml, CONSTRAINTS.md, CLAUDE.md)."""
    candidates = [
        "ARCHITECTURE.yml",
        "ARCHITECTURE.yaml",
        "CONSTRAINTS.md",
        "CLAUDE.md",
    ]
    return [
        os.path.join(project_root, f)
        for f in candidates
        if os.path.isfile(os.path.join(project_root, f))
    ]


def find_pattern_files(project_root: str) -> List[str]:
    """Find pattern documentation files in docs/patterns/."""
    patterns_dir = os.path.join(project_root, "docs", "patterns")
    if not os.path.isdir(patterns_dir):
        return []

    results = globmod.glob(os.path.join(patterns_dir, "**", "*.md"), recursive=True)
    return [os.path.abspath(f) for f in results]


def find_custom_source_files(project_root: str, custom_sources: List[CustomSource]) -> List[Dict[str, Any]]:
    """Discover files matching custom source patterns.

    Returns a list of dicts with keys: file_path, source_type, weight, pattern.
    """
    results: List[Dict[str, Any]] = []
    seen: set[str] = set()

    for source in custom_sources:
        pattern = os.path.join(project_root, source.pattern)
        matches = globmod.glob(pattern, recursive=True)
        for match in matches:
            abs_path = os.path.abspath(match)
            if abs_path not in seen and os.path.isfile(abs_path):
                seen.add(abs_path)
                results.append({
                    "file_path": abs_path,
                    "source_type": source.source_type,
                    "weight": source.weight,
                    "pattern": source.pattern,
                })

    return results


# ============================================================
# Main Index Function
# ============================================================


def index_project(ctx: ProjectContext) -> Dict[str, Any]:
    """Index the project codebase into ChromaDB collections.

    Performs a full re-index: drops and recreates all collections.

    Returns:
        Dict with indexing stats.
    """
    start_time = time.time()
    errors: List[Dict[str, str]] = []

    ensure_dir(ctx.chroma_db_path)

    # Create PersistentClient (embedded, no server needed)
    client = chromadb.PersistentClient(
        path=ctx.chroma_db_path,
        settings=Settings(anonymized_telemetry=False),
    )

    # Reset all collections for full re-index
    for name in [COLLECTION_CODEBASE, COLLECTION_CONSTRAINTS, COLLECTION_PATTERNS]:
        try:
            client.delete_collection(name=name)
        except Exception as e:
            sys.stderr.write(
                f'[codebase_rag_mcp] Note: collection "{name}" did not exist ({e})\n'
            )

    # Create collections with cosine distance
    codebase_col = client.get_or_create_collection(
        name=COLLECTION_CODEBASE,
        metadata={"hnsw:space": "cosine"},
    )
    constraint_col = client.get_or_create_collection(
        name=COLLECTION_CONSTRAINTS,
        metadata={"hnsw:space": "cosine"},
    )
    pattern_col = client.get_or_create_collection(
        name=COLLECTION_PATTERNS,
        metadata={"hnsw:space": "cosine"},
    )

    stats: Dict[str, Any] = {
        "filesIndexed": 0,
        "chunksCreated": 0,
        "collectionStats": {"codebase": 0, "constraints": 0, "patterns": 0},
        "errors": errors,
        "duration": 0,
    }

    # ---- Index code files ----
    code_extensions = [
        ext for ext in ctx.config.include_extensions
        if ext not in (".yml", ".yaml", ".md")
    ]
    code_files = discover_files(ctx.project_root, code_extensions, ctx.config.exclude_dirs)

    for file_path in code_files:
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            if not content.strip():
                continue

            relative_path = safe_relative_path(ctx.project_root, file_path)
            language = detect_language(relative_path)
            imports = extract_imports(content, language)
            exports = extract_exports(content, language)
            api_endpoints = extract_api_endpoints(content)
            ws_events = extract_ws_events(content)
            weight = compute_weight(relative_path, ctx.config.weights)

            chunks = chunk_content(relative_path, content)

            ids: List[str] = []
            documents: List[str] = []
            metadatas: List[Dict[str, Any]] = []

            for chunk in chunks:
                ids.append(chunk.id)
                documents.append(chunk.content)
                metadatas.append({
                    "filePath": relative_path,
                    "chunkIndex": chunk.index,
                    "totalChunks": chunk.total_chunks,
                    "language": language,
                    "imports": ",".join(imports),
                    "exports": ",".join(exports),
                    "apiEndpoints": ",".join(api_endpoints),
                    "wsEvents": ",".join(ws_events),
                    "weight": weight,
                    "type": "code",
                    "source_type": SOURCE_TYPE_CODE,
                })

            if ids:
                # ChromaDB has batch size limits; add in batches
                batch_size = 100
                for i in range(0, len(ids), batch_size):
                    codebase_col.add(
                        ids=ids[i:i + batch_size],
                        documents=documents[i:i + batch_size],
                        metadatas=metadatas[i:i + batch_size],
                    )
                stats["collectionStats"]["codebase"] += len(ids)
                stats["chunksCreated"] += len(ids)

            stats["filesIndexed"] += 1
        except Exception as e:
            rel = safe_relative_path(ctx.project_root, file_path)
            sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to index {rel}: {e}\n")
            errors.append({"file": rel, "error": str(e)})

    # ---- Index constraint files ----
    constraint_files = find_constraint_files(ctx.project_root)
    for file_path in constraint_files:
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            if not content.strip():
                continue

            relative_path = safe_relative_path(ctx.project_root, file_path)
            chunks = chunk_content(relative_path, content)

            ids: List[str] = []
            documents: List[str] = []
            metadatas: List[Dict[str, Any]] = []

            for chunk in chunks:
                ids.append(chunk.id)
                documents.append(chunk.content)
                metadatas.append({
                    "filePath": relative_path,
                    "chunkIndex": chunk.index,
                    "totalChunks": chunk.total_chunks,
                    "language": detect_language(relative_path),
                    "imports": "",
                    "exports": "",
                    "apiEndpoints": "",
                    "wsEvents": "",
                    "weight": compute_weight(relative_path, ctx.config.weights),
                    "type": "constraint",
                    "source_type": SOURCE_TYPE_CONSTRAINTS,
                })

            if ids:
                constraint_col.add(ids=ids, documents=documents, metadatas=metadatas)
                stats["collectionStats"]["constraints"] += len(ids)
                stats["chunksCreated"] += len(ids)

            stats["filesIndexed"] += 1
        except Exception as e:
            rel = safe_relative_path(ctx.project_root, file_path)
            sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to index constraint {rel}: {e}\n")
            errors.append({"file": rel, "error": str(e)})

    # ---- Index pattern files ----
    pattern_files = find_pattern_files(ctx.project_root)
    for file_path in pattern_files:
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            if not content.strip():
                continue

            relative_path = safe_relative_path(ctx.project_root, file_path)
            chunks = chunk_content(relative_path, content)

            ids: List[str] = []
            documents: List[str] = []
            metadatas: List[Dict[str, Any]] = []

            for chunk in chunks:
                ids.append(chunk.id)
                documents.append(chunk.content)
                metadatas.append({
                    "filePath": relative_path,
                    "chunkIndex": chunk.index,
                    "totalChunks": chunk.total_chunks,
                    "language": detect_language(relative_path),
                    "imports": "",
                    "exports": "",
                    "apiEndpoints": "",
                    "wsEvents": "",
                    "weight": compute_weight(relative_path, ctx.config.weights),
                    "type": "pattern",
                    "source_type": SOURCE_TYPE_DOCS,
                })

            if ids:
                pattern_col.add(ids=ids, documents=documents, metadatas=metadatas)
                stats["collectionStats"]["patterns"] += len(ids)
                stats["chunksCreated"] += len(ids)

            stats["filesIndexed"] += 1
        except Exception as e:
            rel = safe_relative_path(ctx.project_root, file_path)
            sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to index pattern {rel}: {e}\n")
            errors.append({"file": rel, "error": str(e)})

    # ---- Index custom source files ----
    if ctx.config.custom_sources:
        # Map source_type to target collection
        collection_map = {
            SOURCE_TYPE_CONSTRAINTS: constraint_col,
            SOURCE_TYPE_DOCS: pattern_col,
            SOURCE_TYPE_CODE: codebase_col,
        }
        collection_stat_map = {
            SOURCE_TYPE_CONSTRAINTS: "constraints",
            SOURCE_TYPE_DOCS: "patterns",
            SOURCE_TYPE_CODE: "codebase",
        }

        custom_files = find_custom_source_files(ctx.project_root, ctx.config.custom_sources)
        for entry in custom_files:
            file_path = entry["file_path"]
            source_type = entry["source_type"]
            weight = entry["weight"]
            target_col = collection_map.get(source_type, pattern_col)
            stat_key = collection_stat_map.get(source_type, "patterns")

            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()

                if not content.strip():
                    continue

                relative_path = safe_relative_path(ctx.project_root, file_path)

                # Skip if already indexed as a built-in constraint or pattern
                if relative_path in [safe_relative_path(ctx.project_root, cf) for cf in constraint_files]:
                    continue
                if relative_path in [safe_relative_path(ctx.project_root, pf) for pf in pattern_files]:
                    continue

                chunks = chunk_content(relative_path, content)
                language = detect_language(relative_path)

                ids: List[str] = []
                documents: List[str] = []
                metadatas: List[Dict[str, Any]] = []

                for chunk in chunks:
                    ids.append(chunk.id)
                    documents.append(chunk.content)
                    metadatas.append({
                        "filePath": relative_path,
                        "chunkIndex": chunk.index,
                        "totalChunks": chunk.total_chunks,
                        "language": language,
                        "imports": "",
                        "exports": "",
                        "apiEndpoints": "",
                        "wsEvents": "",
                        "weight": weight,
                        "type": "custom",
                        "source_type": source_type,
                    })

                if ids:
                    batch_size = 100
                    for i in range(0, len(ids), batch_size):
                        target_col.add(
                            ids=ids[i:i + batch_size],
                            documents=documents[i:i + batch_size],
                            metadatas=metadatas[i:i + batch_size],
                        )
                    stats["collectionStats"][stat_key] += len(ids)
                    stats["chunksCreated"] += len(ids)

                stats["filesIndexed"] += 1
            except Exception as e:
                rel = safe_relative_path(ctx.project_root, file_path)
                sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to index custom source {rel}: {e}\n")
                errors.append({"file": rel, "error": str(e)})

    # Update context
    ctx.last_indexed_at = datetime.now(timezone.utc).isoformat()
    write_config(ctx)

    stats["duration"] = round(time.time() - start_time, 2)
    return stats


# ============================================================
# Per-file Incremental Index
# ============================================================


def index_file(ctx: ProjectContext, file_path: str) -> Dict[str, Any]:
    """Re-embed a single file. Idempotent. Used by the watcher and post-edit hooks.

    Deletes any existing chunks for `file_path` (matched by relative filePath
    metadata), then re-adds chunks if the file still exists and is in scope.
    Returns a small dict describing what happened.
    """
    abs_path = os.path.abspath(file_path)
    classification = _classify(abs_path, ctx)
    if classification is None:
        return {"skipped": True, "reason": "out of scope or filtered", "filePath": abs_path}

    rel_path = safe_relative_path(ctx.project_root, abs_path)
    collection_name = classification["collection"]
    type_label = classification["type"]
    source_type = classification["source_type"]
    weight = classification["weight"]

    lock = _lock_for(abs_path)
    with lock:
        ensure_dir(ctx.chroma_db_path)
        client = chromadb.PersistentClient(
            path=ctx.chroma_db_path,
            settings=Settings(anonymized_telemetry=False),
        )
        collection = client.get_or_create_collection(
            name=collection_name,
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
            return {"deleted": True, "filePath": rel_path}

        try:
            with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
        except OSError as e:
            return {"error": str(e), "filePath": rel_path}

        if not content.strip():
            _bump_last_indexed_at(ctx)
            return {"empty": True, "filePath": rel_path}

        language = detect_language(rel_path)
        if collection_name == COLLECTION_CODEBASE:
            imports = extract_imports(content, language)
            exports = extract_exports(content, language)
            api_endpoints = extract_api_endpoints(content)
            ws_events = extract_ws_events(content)
        else:
            imports = exports = api_endpoints = ws_events = []

        chunks = chunk_content(rel_path, content)
        ids: List[str] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []
        for chunk in chunks:
            ids.append(chunk.id)
            documents.append(chunk.content)
            metadatas.append({
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
            })

        if ids:
            batch_size = 100
            for i in range(0, len(ids), batch_size):
                collection.add(
                    ids=ids[i:i + batch_size],
                    documents=documents[i:i + batch_size],
                    metadatas=metadatas[i:i + batch_size],
                )

        _bump_last_indexed_at(ctx)
        return {
            "indexed": True,
            "filePath": rel_path,
            "collection": collection_name,
            "chunks": len(ids),
        }
