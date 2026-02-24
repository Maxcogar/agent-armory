"""Codebase indexing into ChromaDB collections."""

import os
import sys
import time
import glob as globmod
from datetime import datetime, timezone
from typing import List, Dict, Any

import chromadb
from chromadb.config import Settings

from config import (
    ProjectContext,
    COLLECTION_CODEBASE,
    COLLECTION_CONSTRAINTS,
    COLLECTION_PATTERNS,
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

    # Update context
    ctx.last_indexed_at = datetime.now(timezone.utc).isoformat()
    write_config(ctx)

    stats["duration"] = round(time.time() - start_time, 2)
    return stats
