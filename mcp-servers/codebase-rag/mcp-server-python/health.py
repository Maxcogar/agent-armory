"""Health check and status implementations."""

import os
import sys
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import chromadb
from chromadb.config import Settings

from config import (
    ProjectContext,
    ALL_COLLECTIONS,
)
from utils.paths import file_exists


# ============================================================
# Helpers
# ============================================================


def _get_client(ctx: ProjectContext) -> chromadb.ClientAPI:
    """Create a fresh PersistentClient for each operation."""
    return chromadb.PersistentClient(
        path=ctx.chroma_db_path,
        settings=Settings(anonymized_telemetry=False),
    )


# ============================================================
# Full Health Check
# ============================================================


def health_check(ctx: ProjectContext) -> Dict[str, Any]:
    """Run diagnostic checks on the RAG system and report issues."""
    issues: list[str] = []
    warnings: list[str] = []
    collections: Dict[str, Dict[str, Any]] = {}

    client = _get_client(ctx)

    # Check collections
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

    # Check constraint files on disk
    constraint_file_names = ["ARCHITECTURE.yml", "CONSTRAINTS.md", "CLAUDE.md"]
    constraint_files: Dict[str, bool] = {}
    for name in constraint_file_names:
        exists = file_exists(os.path.join(ctx.project_root, name))
        constraint_files[name] = exists
        if not exists:
            warnings.append(f"Missing constraint file: {name}")

    # Test query
    query_test = "skipped"
    codebase_health = collections.get("codebase", {})
    if codebase_health.get("exists") and codebase_health.get("chunks", 0) > 0:
        try:
            col = client.get_collection(name="codebase")
            result = col.query(
                query_texts=["test query"],
                n_results=1,
            )
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

    # Check staleness
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

    return {
        "healthy": len(issues) == 0,
        "collections": collections,
        "constraintFiles": constraint_files,
        "queryTest": query_test,
        "lastIndexed": ctx.last_indexed_at,
        "issues": issues,
        "warnings": warnings,
    }


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

    client = _get_client(ctx)
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
