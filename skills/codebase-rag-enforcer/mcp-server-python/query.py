"""Query logic for check_constraints and query_impact."""

import re
import sys
from pathlib import Path
from typing import List, Dict, Any

import chromadb
from chromadb.config import Settings

from config import (
    ProjectContext,
    COLLECTION_CODEBASE,
    COLLECTION_CONSTRAINTS,
    COLLECTION_PATTERNS,
)


# ============================================================
# Helpers
# ============================================================


def _get_client(ctx: ProjectContext) -> chromadb.ClientAPI:
    """Create a fresh PersistentClient for each operation."""
    return chromadb.PersistentClient(
        path=ctx.chroma_db_path,
        settings=Settings(anonymized_telemetry=False),
    )


def chroma_distance_to_relevance(distance: float) -> float:
    """Convert ChromaDB cosine distance to 0-1 relevance score."""
    return max(0.0, 1.0 - distance / 2.0)


def extract_key_rules(content: str) -> List[str]:
    """Extract MUST/NEVER/ALWAYS rules from constraint text."""
    rules: List[str] = []
    patterns = [
        r"(?:MUST|NEVER|ALWAYS|SHALL NOT|REQUIRED)[^.;\n]*",
        r"(?:All\s+\w+\s+must)[^.;\n]*",
        r"(?:No\s+\w+\s+(?:in|should|may))[^.;\n]*",
    ]

    for pattern in patterns:
        for match in re.finditer(pattern, content, re.IGNORECASE):
            rule = match.group(0).strip()
            if len(rule) > 10 and rule not in rules:
                rules.append(rule)

    return rules[:10]


# ============================================================
# check_constraints
# ============================================================


def check_constraints(
    ctx: ProjectContext,
    change_description: str,
    num_results: int,
) -> Dict[str, Any]:
    """Query all three collections for constraints, patterns, and examples."""
    client = _get_client(ctx)

    constraints: List[Dict[str, Any]] = []
    patterns: List[Dict[str, Any]] = []
    examples: List[Dict[str, Any]] = []

    # Query constraints collection
    try:
        constraint_col = client.get_collection(name=COLLECTION_CONSTRAINTS)
        col_count = constraint_col.count()
        n = min(num_results, col_count) if col_count > 0 else 0
        if n > 0:
            c_results = constraint_col.query(
                query_texts=[change_description],
                n_results=n,
            )
            if c_results["documents"] and c_results["documents"][0]:
                for i, doc in enumerate(c_results["documents"][0]):
                    meta = c_results["metadatas"][0][i] if c_results["metadatas"] else {}
                    dist = (
                        c_results["distances"][0][i]
                        if c_results.get("distances") and c_results["distances"][0]
                        else 1.0
                    )
                    if doc:
                        constraints.append({
                            "content": doc,
                            "filePath": meta.get("filePath", "unknown") if meta else "unknown",
                            "type": "constraint",
                            "relevance": round(chroma_distance_to_relevance(dist), 4),
                            "keyRules": extract_key_rules(doc),
                        })
    except Exception as e:
        sys.stderr.write(f"[codebase_rag_mcp] Warning: constraints query failed: {e}\n")

    # Query patterns collection
    try:
        pattern_col = client.get_collection(name=COLLECTION_PATTERNS)
        col_count = pattern_col.count()
        n = min(num_results, col_count) if col_count > 0 else 0
        if n > 0:
            p_results = pattern_col.query(
                query_texts=[change_description],
                n_results=n,
            )
            if p_results["documents"] and p_results["documents"][0]:
                for i, doc in enumerate(p_results["documents"][0]):
                    meta = p_results["metadatas"][0][i] if p_results["metadatas"] else {}
                    dist = (
                        p_results["distances"][0][i]
                        if p_results.get("distances") and p_results["distances"][0]
                        else 1.0
                    )
                    if doc:
                        patterns.append({
                            "content": doc,
                            "filePath": meta.get("filePath", "unknown") if meta else "unknown",
                            "type": "pattern",
                            "relevance": round(chroma_distance_to_relevance(dist), 4),
                        })
    except Exception as e:
        sys.stderr.write(f"[codebase_rag_mcp] Warning: patterns query failed: {e}\n")

    # Query codebase collection
    try:
        codebase_col = client.get_collection(name=COLLECTION_CODEBASE)
        col_count = codebase_col.count()
        n = min(num_results, col_count) if col_count > 0 else 0
        if n > 0:
            e_results = codebase_col.query(
                query_texts=[change_description],
                n_results=n,
            )
            if e_results["documents"] and e_results["documents"][0]:
                for i, doc in enumerate(e_results["documents"][0]):
                    meta = e_results["metadatas"][0][i] if e_results["metadatas"] else {}
                    dist = (
                        e_results["distances"][0][i]
                        if e_results.get("distances") and e_results["distances"][0]
                        else 1.0
                    )
                    if doc:
                        examples.append({
                            "content": doc,
                            "filePath": meta.get("filePath", "unknown") if meta else "unknown",
                            "type": "code",
                            "relevance": round(chroma_distance_to_relevance(dist), 4),
                        })
    except Exception as e:
        sys.stderr.write(f"[codebase_rag_mcp] Warning: codebase query failed: {e}\n")

    return {
        "query": change_description,
        "constraints": constraints,
        "patterns": patterns,
        "examples": examples,
        "summary": (
            f"Found {len(constraints)} constraints, "
            f"{len(patterns)} patterns, "
            f"{len(examples)} examples for this change."
        ),
    }


# ============================================================
# query_impact
# ============================================================


def query_impact(
    ctx: ProjectContext,
    file_path: str,
    num_similar: int,
) -> Dict[str, Any]:
    """Analyze the blast radius of changing a specific file."""
    client = _get_client(ctx)

    file_exports: List[str] = []
    api_endpoints: List[str] = []
    websocket_events: List[str] = []
    dependents: List[Dict[str, Any]] = []
    similar_files: List[Dict[str, Any]] = []

    codebase_col = client.get_collection(name=COLLECTION_CODEBASE)

    # Get the file's own metadata
    file_chunks = codebase_col.get(
        where={"filePath": file_path},
        include=["metadatas"],
    )

    if not file_chunks["metadatas"]:
        raise ValueError(
            f'File "{file_path}" not found in index. Check the path or run rag_index.'
        )

    # Aggregate metadata across chunks
    export_set: set[str] = set()
    endpoint_set: set[str] = set()
    ws_set: set[str] = set()

    for meta in file_chunks["metadatas"]:
        if meta:
            exp = meta.get("exports", "")
            if exp:
                for e in str(exp).split(","):
                    if e:
                        export_set.add(e)

            ep = meta.get("apiEndpoints", "")
            if ep:
                for e in str(ep).split(","):
                    if e:
                        endpoint_set.add(e)

            ws = meta.get("wsEvents", "")
            if ws:
                for e in str(ws).split(","):
                    if e:
                        ws_set.add(e)

    file_exports = list(export_set)
    api_endpoints = list(endpoint_set)
    websocket_events = list(ws_set)

    # Find dependents using whereDocument $contains
    file_stem = Path(file_path).stem

    try:
        importers = codebase_col.get(
            where_document={"$contains": file_stem},
            include=["metadatas"],
        )

        seen: set[str] = set()
        for meta in importers["metadatas"]:
            if meta:
                fp = meta.get("filePath", "")
                imports_str = meta.get("imports", "")
                if (
                    fp
                    and fp != file_path
                    and fp not in seen
                    and imports_str
                    and file_stem in str(imports_str)
                ):
                    seen.add(str(fp))
                    imps = [
                        imp
                        for imp in str(imports_str).split(",")
                        if file_stem in imp
                    ]
                    dependents.append({"filePath": str(fp), "imports": imps})
    except Exception as e:
        sys.stderr.write(f"[codebase_rag_mcp] Warning: dependent search failed: {e}\n")

    # Find similar files using semantic search
    try:
        file_content = codebase_col.get(
            where={"filePath": file_path},
            include=["documents"],
        )

        if file_content["documents"] and file_content["documents"][0]:
            query_text = file_content["documents"][0]
            total_count = codebase_col.count()
            n = min(num_similar + 5, total_count) if total_count > 0 else 0
            if n > 0:
                sim_results = codebase_col.query(
                    query_texts=[query_text],
                    n_results=n,
                )

                if sim_results["metadatas"] and sim_results["metadatas"][0]:
                    sim_seen: set[str] = set()
                    for i, meta in enumerate(sim_results["metadatas"][0]):
                        dist = (
                            sim_results["distances"][0][i]
                            if sim_results.get("distances") and sim_results["distances"][0]
                            else 1.0
                        )
                        if meta:
                            fp = meta.get("filePath", "")
                            if fp and fp != file_path and fp not in sim_seen:
                                sim_seen.add(str(fp))
                                similar_files.append({
                                    "filePath": str(fp),
                                    "similarity": round(
                                        chroma_distance_to_relevance(dist), 4
                                    ),
                                })
                                if len(similar_files) >= num_similar:
                                    break
    except Exception as e:
        sys.stderr.write(f"[codebase_rag_mcp] Warning: similarity search failed: {e}\n")

    return {
        "filePath": file_path,
        "exports": file_exports,
        "apiEndpoints": api_endpoints,
        "websocketEvents": websocket_events,
        "dependents": dependents,
        "similarFiles": similar_files,
        "summary": (
            f"{len(file_exports)} exports, "
            f"{len(api_endpoints)} API endpoints, "
            f"{len(dependents)} dependents, "
            f"{len(similar_files)} similar files."
        ),
    }
