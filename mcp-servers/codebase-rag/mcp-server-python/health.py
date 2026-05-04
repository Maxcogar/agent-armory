"""Health check and status implementations."""

import glob as globmod
import logging
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import chromadb

from config import (
    ProjectContext,
    ALL_COLLECTIONS,
)
from utils.paths import file_exists
from utils.chroma import get_client
from scope import CONSTRAINT_FILE_NAMES


log = logging.getLogger(__name__)


def _client(ctx: ProjectContext) -> "chromadb.ClientAPI":
    return get_client(ctx.chroma_db_path)


# ============================================================
# Full Health Check
# ============================================================


def health_check(ctx: ProjectContext) -> Dict[str, Any]:
    """Run diagnostic checks on the RAG system and report issues."""
    issues: list[str] = []
    warnings: list[str] = []
    collections: Dict[str, Dict[str, Any]] = {}

    client = _client(ctx)

    for name in ALL_COLLECTIONS:
        try:
            col = client.get_collection(name=name)
            count = col.count()
            collections[name] = {"exists": True, "chunks": count}
            if count == 0:
                warnings.append(f'Collection "{name}" is empty.')
        except Exception:
            collections[name] = {"exists": False, "chunks": 0}
            issues.append(f'Collection "{name}" does not exist. Run rag_index.')

    # Constraint files on disk — uses the single source of truth.
    constraint_files: Dict[str, bool] = {}
    for name in CONSTRAINT_FILE_NAMES:
        exists = file_exists(os.path.join(ctx.project_root, name))
        constraint_files[name] = exists
        # Don't warn about every name; just warn if NONE exist.
    if not any(constraint_files.values()):
        warnings.append("No constraint file present (ARCHITECTURE.yml, CONSTRAINTS.md, or CLAUDE.md).")

    # Custom source patterns
    custom_sources_status: Dict[str, Dict[str, Any]] = {}
    if ctx.config.custom_sources:
        for source in ctx.config.custom_sources:
            pattern = os.path.join(ctx.project_root, source.pattern)
            matches = globmod.glob(pattern, recursive=True)
            file_count = len([m for m in matches if os.path.isfile(m)])
            custom_sources_status[source.pattern] = {
                "sourceType": source.source_type,
                "weight": source.weight,
                "filesFound": file_count,
            }
            if file_count == 0:
                warnings.append(f"Custom source pattern '{source.pattern}' matched 0 files.")

    # Test query
    query_test = "skipped"
    codebase_health = collections.get("codebase", {})
    if codebase_health.get("exists") and codebase_health.get("chunks", 0) > 0:
        try:
            col = client.get_collection(name="codebase")
            result = col.query(query_texts=["test query"], n_results=1)
            if result["documents"] and result["documents"][0]:
                query_test = "passed"
            else:
                query_test = "no_results"
                warnings.append("Test query returned no results.")
        except Exception as e:
            query_test = "failed"
            issues.append(f"Test query failed: {e}")
    else:
        if not any("codebase" in i for i in issues):
            warnings.append("Skipped test query: codebase collection not available.")

    # Staleness
    if ctx.last_indexed_at:
        try:
            last_indexed = datetime.fromisoformat(ctx.last_indexed_at.replace("Z", "+00:00"))
            days_since = (datetime.now(timezone.utc) - last_indexed).total_seconds() / (60 * 60 * 24)
            if days_since > 7:
                warnings.append(
                    f"Index is {round(days_since)} days old. Consider re-indexing."
                )
        except Exception:
            pass
    else:
        issues.append("Index has never been built. Run rag_index.")

    result: Dict[str, Any] = {
        "healthy": len(issues) == 0,
        "collections": collections,
        "constraintFiles": constraint_files,
        "queryTest": query_test,
        "lastIndexed": ctx.last_indexed_at,
        "issues": issues,
        "warnings": warnings,
    }
    if custom_sources_status:
        result["customSources"] = custom_sources_status

    return result


# ============================================================
# Lightweight Status
# ============================================================


def get_status(ctx: Optional[ProjectContext]) -> Dict[str, Any]:
    """Get a quick summary of RAG system state."""
    if ctx is None:
        return {
            "initialized": False,
            "projectRoot": None,
            "indexed": False,
            "lastIndexed": None,
            "totalChunks": 0,
            "collectionCounts": {},
        }

    client = _client(ctx)
    collection_counts: Dict[str, int] = {}
    total_chunks = 0

    for name in ALL_COLLECTIONS:
        try:
            col = client.get_collection(name=name)
            count = col.count()
            collection_counts[name] = count
            total_chunks += count
        except Exception:
            collection_counts[name] = 0

    return {
        "initialized": True,
        "projectRoot": ctx.project_root,
        "indexed": ctx.last_indexed_at is not None,
        "lastIndexed": ctx.last_indexed_at,
        "totalChunks": total_chunks,
        "collectionCounts": collection_counts,
    }
