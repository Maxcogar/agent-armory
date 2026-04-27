"""Query logic for check_constraints and query_impact."""

import logging
import re
from pathlib import Path
from typing import Iterable, List, Dict, Any, Optional

import chromadb

from config import (
    ProjectContext,
    COLLECTION_CODEBASE,
    COLLECTION_CONSTRAINTS,
    COLLECTION_PATTERNS,
    SOURCE_TYPE_CONSTRAINTS,
    SOURCE_TYPE_DOCS,
    SOURCE_TYPE_CODE,
)
from utils.chroma import get_client


log = logging.getLogger(__name__)


# ============================================================
# Helpers
# ============================================================


def _client(ctx: ProjectContext) -> "chromadb.ClientAPI":
    return get_client(ctx.chroma_db_path)


def chroma_distance_to_relevance(distance: float) -> float:
    """Convert ChromaDB cosine distance to 0–1 relevance score."""
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


def _query_collection(
    client: "chromadb.ClientAPI",
    name: str,
    query_text: str,
    num_results: int,
    type_label: str,
    extract_rules: bool = False,
) -> List[Dict[str, Any]]:
    """Query a single collection. Returns a list of result dicts; [] on miss."""
    try:
        col = client.get_collection(name=name)
    except Exception as e:
        log.warning("collection %s unavailable: %s", name, e)
        return []

    count = col.count()
    n = min(num_results, count) if count > 0 else 0
    if n == 0:
        return []

    try:
        raw = col.query(query_texts=[query_text], n_results=n)
    except Exception as e:
        log.warning("%s query failed: %s", name, e)
        return []

    docs = (raw.get("documents") or [[]])[0] or []
    metas = (raw.get("metadatas") or [[]])[0] or []
    dists = (raw.get("distances") or [[]])[0] or []

    out: List[Dict[str, Any]] = []
    for i, doc in enumerate(docs):
        if not doc:
            continue
        meta = metas[i] if i < len(metas) else {}
        dist = dists[i] if i < len(dists) else 1.0
        item: Dict[str, Any] = {
            "content": doc,
            "filePath": (meta or {}).get("filePath", "unknown"),
            "type": type_label,
            "relevance": round(chroma_distance_to_relevance(dist), 4),
        }
        if extract_rules:
            item["keyRules"] = extract_key_rules(doc)
        out.append(item)
    return out


# ============================================================
# check_constraints
# ============================================================


_SOURCE_TO_COLLECTIONS = {
    "all": (COLLECTION_CONSTRAINTS, COLLECTION_PATTERNS, COLLECTION_CODEBASE),
    SOURCE_TYPE_CONSTRAINTS: (COLLECTION_CONSTRAINTS,),
    SOURCE_TYPE_DOCS: (COLLECTION_CONSTRAINTS, COLLECTION_PATTERNS),
    SOURCE_TYPE_CODE: (COLLECTION_CODEBASE,),
}


def check_constraints(
    ctx: ProjectContext,
    change_description: str,
    num_results: int,
    source_type: str = "all",
) -> Dict[str, Any]:
    """Query collections for constraints, patterns, and code examples."""
    client = _client(ctx)
    targets = _SOURCE_TO_COLLECTIONS.get(source_type, _SOURCE_TO_COLLECTIONS["all"])

    constraints = (
        _query_collection(client, COLLECTION_CONSTRAINTS, change_description,
                          num_results, "constraint", extract_rules=True)
        if COLLECTION_CONSTRAINTS in targets else []
    )
    patterns = (
        _query_collection(client, COLLECTION_PATTERNS, change_description,
                          num_results, "pattern")
        if COLLECTION_PATTERNS in targets else []
    )
    examples = (
        _query_collection(client, COLLECTION_CODEBASE, change_description,
                          num_results, "code")
        if COLLECTION_CODEBASE in targets else []
    )

    return {
        "query": change_description,
        "sourceFilter": source_type,
        "constraints": constraints,
        "patterns": patterns,
        "examples": examples,
        "summary": (
            f"Found {len(constraints)} constraints, "
            f"{len(patterns)} patterns, "
            f"{len(examples)} examples for this change."
            + (f" (filtered by source_type={source_type!r})" if source_type != "all" else "")
        ),
    }


# ============================================================
# query_impact
# ============================================================


def _split_csv(value: Any) -> Iterable[str]:
    if not value:
        return ()
    return (s for s in str(value).split(",") if s)


def _imports_reference(imports_str: Any, target_rel: str, target_stem: str) -> bool:
    """True iff this importer's imports list references our target file.

    Avoids false positives like "auth.js" matching `oauth`/`authority` by
    requiring exact stem match between path components or a relative-path
    suffix that ends in target_rel.
    """
    target_rel_norm = target_rel.replace("\\", "/")
    for imp in _split_csv(imports_str):
        imp_norm = imp.replace("\\", "/")
        # Whole-stem match somewhere in the path components.
        components = re.split(r"[/.\s]", imp_norm)
        if target_stem in components:
            return True
        # Or a relative path that resolves to the same file.
        if imp_norm.endswith(target_rel_norm) or imp_norm.endswith("/" + target_rel_norm):
            return True
    return False


def query_impact(
    ctx: ProjectContext,
    file_path: str,
    num_similar: int,
) -> Dict[str, Any]:
    """Analyze the blast radius of changing a specific file."""
    client = _client(ctx)
    try:
        codebase_col = client.get_collection(name=COLLECTION_CODEBASE)
    except Exception as e:
        raise ValueError(
            "Codebase collection not available — run rag_index or wait for "
            f"first-run indexing to finish. ({e})"
        )

    file_chunks = codebase_col.get(
        where={"filePath": file_path},
        include=["metadatas"],
    )

    if not file_chunks["metadatas"]:
        raise ValueError(
            f'File "{file_path}" not found in index. Check the path or run rag_index.'
        )

    export_set: set = set()
    endpoint_set: set = set()
    ws_set: set = set()
    for meta in file_chunks["metadatas"]:
        if not meta:
            continue
        export_set.update(_split_csv(meta.get("exports")))
        endpoint_set.update(_split_csv(meta.get("apiEndpoints")))
        ws_set.update(_split_csv(meta.get("wsEvents")))

    file_stem = Path(file_path).stem

    dependents: List[Dict[str, Any]] = []
    try:
        importers = codebase_col.get(
            where_document={"$contains": file_stem},
            include=["metadatas"],
        )
        seen: set = set()
        for meta in importers["metadatas"]:
            if not meta:
                continue
            fp = meta.get("filePath", "")
            if not fp or fp == file_path or fp in seen:
                continue
            imports_str = meta.get("imports", "")
            if not imports_str:
                continue
            if not _imports_reference(imports_str, file_path, file_stem):
                continue
            seen.add(str(fp))
            imps = [
                imp for imp in _split_csv(imports_str)
                if file_stem in re.split(r"[/.\s]", imp.replace("\\", "/"))
            ]
            dependents.append({"filePath": str(fp), "imports": imps})
    except Exception as e:
        log.warning("dependent search failed: %s", e)

    similar_files: List[Dict[str, Any]] = []
    try:
        file_content = codebase_col.get(
            where={"filePath": file_path},
            include=["documents"],
        )
        if file_content["documents"] and file_content["documents"][0]:
            query_text = file_content["documents"][0]
            total = codebase_col.count()
            n = min(num_similar + 5, total) if total > 0 else 0
            if n > 0:
                sim = codebase_col.query(query_texts=[query_text], n_results=n)
                metas = (sim.get("metadatas") or [[]])[0] or []
                dists = (sim.get("distances") or [[]])[0] or []
                seen2: set = set()
                for i, meta in enumerate(metas):
                    if not meta:
                        continue
                    fp = meta.get("filePath", "")
                    if not fp or fp == file_path or fp in seen2:
                        continue
                    seen2.add(str(fp))
                    dist = dists[i] if i < len(dists) else 1.0
                    similar_files.append({
                        "filePath": str(fp),
                        "similarity": round(chroma_distance_to_relevance(dist), 4),
                    })
                    if len(similar_files) >= num_similar:
                        break
    except Exception as e:
        log.warning("similarity search failed: %s", e)

    return {
        "filePath": file_path,
        "exports": list(export_set),
        "apiEndpoints": list(endpoint_set),
        "websocketEvents": list(ws_set),
        "dependents": dependents,
        "similarFiles": similar_files,
        "summary": (
            f"{len(export_set)} exports, "
            f"{len(endpoint_set)} API endpoints, "
            f"{len(dependents)} dependents, "
            f"{len(similar_files)} similar files."
        ),
    }
