"""Project configuration management.

State (config.json + ChromaDB collections) lives in a per-machine cache
directory under ~/.cache/codebase-rag/<hash>/, NOT inside the project tree.
A one-shot migration reads any legacy <project>/.rag/config.json on first
access and copies it into the cache dir; the legacy folder is left in place
for the user to remove.
"""

import json
import os
import shutil
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any

from utils.paths import cache_dir_for, ensure_dir


# ============================================================
# Source Type Constants
# ============================================================

SOURCE_TYPE_CONSTRAINTS = "constraints"
SOURCE_TYPE_DOCS = "docs"
SOURCE_TYPE_CODE = "code"

VALID_SOURCE_TYPES = [SOURCE_TYPE_CONSTRAINTS, SOURCE_TYPE_DOCS, SOURCE_TYPE_CODE]


# ============================================================
# Types
# ============================================================


@dataclass
class CustomSource:
    """A user-configured document source (ADRs, OpenAPI specs, style guides, etc.)."""
    pattern: str           # Glob pattern relative to project root (e.g., "docs/adr/*.md")
    source_type: str       # One of: "constraints", "docs", "code"
    weight: float = 8.0    # Retrieval weight (default 8.0, same as built-in patterns)


@dataclass
class ProjectConfig:
    include_extensions: List[str]
    exclude_dirs: List[str]
    chunk_size: int
    chunk_overlap: int
    default_results: int
    max_results: int
    weights: Dict[str, float]
    custom_sources: List[CustomSource] = field(default_factory=list)


@dataclass
class ProjectContext:
    project_root: str
    frontend_path: Optional[str]
    backend_path: Optional[str]
    chroma_db_path: str
    last_indexed_at: Optional[str]
    config: ProjectConfig


# ============================================================
# Defaults
# ============================================================

DEFAULT_CONFIG = ProjectConfig(
    include_extensions=[
        ".js", ".jsx", ".mjs", ".cjs",
        ".ts", ".tsx",
        ".py",
        ".go", ".rs", ".java", ".rb", ".php",
        ".yml", ".yaml", ".md", ".json",
    ],
    exclude_dirs=[
        "node_modules", ".git", "dist", "build", "__pycache__",
        ".venv", "venv", ".next", ".rag", "coverage",
        ".turbo", ".cache",
    ],
    chunk_size=300,
    chunk_overlap=50,
    default_results=5,
    max_results=20,
    weights={
        "ARCHITECTURE.yml": 10.0,
        "CONSTRAINTS.md": 10.0,
        "CLAUDE.md": 10.0,
        "docs/patterns/": 8.0,
    },
)

# ============================================================
# Collection Names
# ============================================================

COLLECTION_CODEBASE = "codebase"
COLLECTION_CONSTRAINTS = "constraints"
COLLECTION_PATTERNS = "patterns"

ALL_COLLECTIONS = [COLLECTION_CODEBASE, COLLECTION_CONSTRAINTS, COLLECTION_PATTERNS]


# ============================================================
# Config File Paths
# ============================================================


def rag_dir(project_root: str) -> str:
    """Cache directory for this project. NOT inside the project tree."""
    return str(cache_dir_for(project_root))


def config_file_path(project_root: str) -> str:
    return os.path.join(rag_dir(project_root), "config.json")


def chroma_db_path(project_root: str) -> str:
    return os.path.join(rag_dir(project_root), "collections")


def legacy_rag_dir(project_root: str) -> str:
    """Where the index used to live before it moved to the user cache."""
    return os.path.join(project_root, ".rag")


# ============================================================
# Read / Write
# ============================================================


def _migrate_legacy(project_root: str) -> None:
    """One-shot migration from <project>/.rag/ into the user cache dir.

    Copies both `config.json` and (best-effort) `collections/` so users with
    existing indexes don't pay a full rebuild after upgrade. If the
    collections copy fails — different chromadb on-disk format, partial
    write, etc. — we log a clear warning so the user knows the next query
    will trigger a rebuild rather than appearing to hang silently.
    Legacy directory is left in place for the user to remove.
    """
    legacy_root = legacy_rag_dir(project_root)
    legacy_cfg = os.path.join(legacy_root, "config.json")
    new_cfg = config_file_path(project_root)
    if not os.path.isfile(legacy_cfg) or os.path.isfile(new_cfg):
        return

    try:
        ensure_dir(rag_dir(project_root))
        shutil.copy2(legacy_cfg, new_cfg)
    except OSError as e:
        sys.stderr.write(f"[codebase_rag_mcp] Migration warning (config): {e}\n")
        return

    legacy_collections = os.path.join(legacy_root, "collections")
    new_collections = chroma_db_path(project_root)
    if os.path.isdir(legacy_collections) and not os.path.isdir(new_collections):
        try:
            shutil.copytree(legacy_collections, new_collections)
            sys.stderr.write(
                f"[codebase_rag_mcp] Migrated index from {legacy_root} to "
                f"{rag_dir(project_root)}\n"
            )
        except OSError as e:
            sys.stderr.write(
                f"[codebase_rag_mcp] Could not migrate legacy collections "
                f"({e}); the index will be rebuilt on next query (this may "
                "take up to a minute for medium projects).\n"
            )
    else:
        sys.stderr.write(
            f"[codebase_rag_mcp] Migrated config from {legacy_cfg} to {new_cfg}\n"
        )


def read_config(project_root: str) -> Optional[Dict[str, Any]]:
    """Read persisted config from the project's cache dir. Returns None if not found."""
    _migrate_legacy(project_root)
    cfg_path = config_file_path(project_root)
    try:
        with open(cfg_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as e:
        sys.stderr.write(f"[codebase_rag_mcp] Note: Could not read config: {e}\n")
        return None


def write_config(ctx: ProjectContext) -> None:
    """Serialize ProjectContext to the project's cache dir."""
    cfg = {
        "projectRoot": ctx.project_root,
        "frontendPath": ctx.frontend_path,
        "backendPath": ctx.backend_path,
        "lastIndexedAt": ctx.last_indexed_at,
        "setupAt": None,  # Will be set below
        "includeExtensions": ctx.config.include_extensions,
        "excludeDirs": ctx.config.exclude_dirs,
        "chunkSize": ctx.config.chunk_size,
        "chunkOverlap": ctx.config.chunk_overlap,
        "weights": ctx.config.weights,
        "customSources": [
            {"pattern": s.pattern, "sourceType": s.source_type, "weight": s.weight}
            for s in ctx.config.custom_sources
        ],
    }

    cfg["setupAt"] = datetime.now(timezone.utc).isoformat()

    ensure_dir(rag_dir(ctx.project_root))
    with open(config_file_path(ctx.project_root), "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)


def restore_context(project_root: str) -> Optional[ProjectContext]:
    """Rebuild ProjectContext from persisted config on disk."""
    cfg = read_config(project_root)
    if cfg is None:
        return None

    raw_sources = cfg.get("customSources", [])
    custom_sources = [
        CustomSource(
            pattern=s.get("pattern", ""),
            source_type=s.get("sourceType", SOURCE_TYPE_DOCS),
            weight=s.get("weight", 8.0),
        )
        for s in raw_sources
        if s.get("pattern")
    ]

    config = ProjectConfig(
        include_extensions=cfg.get("includeExtensions", DEFAULT_CONFIG.include_extensions),
        exclude_dirs=cfg.get("excludeDirs", DEFAULT_CONFIG.exclude_dirs),
        chunk_size=cfg.get("chunkSize", DEFAULT_CONFIG.chunk_size),
        chunk_overlap=cfg.get("chunkOverlap", DEFAULT_CONFIG.chunk_overlap),
        default_results=DEFAULT_CONFIG.default_results,
        max_results=DEFAULT_CONFIG.max_results,
        weights=cfg.get("weights", DEFAULT_CONFIG.weights),
        custom_sources=custom_sources,
    )

    return ProjectContext(
        project_root=cfg.get("projectRoot", project_root),
        frontend_path=cfg.get("frontendPath"),
        backend_path=cfg.get("backendPath"),
        chroma_db_path=chroma_db_path(cfg.get("projectRoot", project_root)),
        last_indexed_at=cfg.get("lastIndexedAt"),
        config=config,
    )
