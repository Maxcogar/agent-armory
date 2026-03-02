"""Project configuration management.

Handles default config, persistence to .rag/config.json,
and restoring ProjectContext from disk.
"""

import json
import os
import sys
from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, List, Any

from utils.paths import ensure_dir


# ============================================================
# Types
# ============================================================


@dataclass
class ProjectConfig:
    include_extensions: List[str]
    exclude_dirs: List[str]
    chunk_size: int
    chunk_overlap: int
    default_results: int
    max_results: int
    weights: Dict[str, float]


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
    return os.path.join(project_root, ".rag")


def config_file_path(project_root: str) -> str:
    return os.path.join(rag_dir(project_root), "config.json")


def chroma_db_path(project_root: str) -> str:
    return os.path.join(rag_dir(project_root), "collections")


# ============================================================
# Read / Write
# ============================================================


def read_config(project_root: str) -> Optional[Dict[str, Any]]:
    """Read persisted config from .rag/config.json. Returns None if not found."""
    cfg_path = config_file_path(project_root)
    try:
        with open(cfg_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        sys.stderr.write(f"[codebase_rag_mcp] Note: Could not read config: {e}\n")
        return None


def write_config(ctx: ProjectContext) -> None:
    """Serialize ProjectContext to .rag/config.json."""
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
    }

    from datetime import datetime, timezone
    cfg["setupAt"] = datetime.now(timezone.utc).isoformat()

    directory = rag_dir(ctx.project_root)
    ensure_dir(directory)
    with open(config_file_path(ctx.project_root), "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)


def restore_context(project_root: str) -> Optional[ProjectContext]:
    """Rebuild ProjectContext from persisted config on disk."""
    cfg = read_config(project_root)
    if cfg is None:
        return None

    config = ProjectConfig(
        include_extensions=cfg.get("includeExtensions", DEFAULT_CONFIG.include_extensions),
        exclude_dirs=cfg.get("excludeDirs", DEFAULT_CONFIG.exclude_dirs),
        chunk_size=cfg.get("chunkSize", DEFAULT_CONFIG.chunk_size),
        chunk_overlap=cfg.get("chunkOverlap", DEFAULT_CONFIG.chunk_overlap),
        default_results=DEFAULT_CONFIG.default_results,
        max_results=DEFAULT_CONFIG.max_results,
        weights=cfg.get("weights", DEFAULT_CONFIG.weights),
    )

    return ProjectContext(
        project_root=cfg.get("projectRoot", project_root),
        frontend_path=cfg.get("frontendPath"),
        backend_path=cfg.get("backendPath"),
        chroma_db_path=chroma_db_path(cfg.get("projectRoot", project_root)),
        last_indexed_at=cfg.get("lastIndexedAt"),
        config=config,
    )
