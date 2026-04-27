"""Project configuration management.

State (config.json + ChromaDB collections) lives in a per-machine cache
directory under <platform-cache>/codebase-rag/<hash>/, NOT inside the
project tree. A one-shot migration copies any legacy <project>/.rag/
contents (config + collections, best-effort) into the cache dir; the
legacy folder is left in place for the user to remove.
"""

import json
import logging
import os
import shutil
import tempfile
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any

from utils.paths import cache_dir_for, ensure_dir


log = logging.getLogger(__name__)


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
    include_extensions: List[str] = field(default_factory=lambda: _default_include_extensions())
    exclude_dirs: List[str] = field(default_factory=lambda: _default_exclude_dirs())
    chunk_size: int = 300
    chunk_overlap: int = 50
    default_results: int = 5
    max_results: int = 20
    weights: Dict[str, float] = field(default_factory=lambda: _default_weights())
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

def _default_include_extensions() -> List[str]:
    return [
        ".js", ".jsx", ".mjs", ".cjs",
        ".ts", ".tsx",
        ".svelte",
        ".py",
        ".go", ".rs", ".java", ".rb", ".php",
        ".yml", ".yaml", ".md", ".json",
    ]


def _default_exclude_dirs() -> List[str]:
    return [
        "node_modules", ".git", "dist", "build", "__pycache__",
        ".venv", "venv", ".next", ".rag", "coverage",
        ".turbo", ".cache",
    ]


def _default_weights() -> Dict[str, float]:
    return {
        "ARCHITECTURE.yml": 10.0,
        "ARCHITECTURE.yaml": 10.0,
        "CONSTRAINTS.md": 10.0,
        "CLAUDE.md": 10.0,
        "docs/patterns/": 8.0,
    }


DEFAULT_CONFIG = ProjectConfig(
    include_extensions=_default_include_extensions(),
    exclude_dirs=_default_exclude_dirs(),
    chunk_size=300,
    chunk_overlap=50,
    default_results=5,
    max_results=20,
    weights=_default_weights(),
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

    Copies both `config.json` and (best-effort) `collections/`. If the
    collections copy fails — different chromadb on-disk format, partial
    write, etc. — log a clear warning so the next query is known to
    trigger a rebuild rather than appearing to hang silently. The legacy
    directory is left in place for the user to remove.
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
        log.warning("migration warning (config): %s", e)
        return

    legacy_collections = os.path.join(legacy_root, "collections")
    new_collections = chroma_db_path(project_root)
    if os.path.isdir(legacy_collections) and not os.path.isdir(new_collections):
        try:
            shutil.copytree(legacy_collections, new_collections)
            log.info("migrated index from %s to %s", legacy_root, rag_dir(project_root))
        except OSError as e:
            log.warning(
                "could not migrate legacy collections (%s); the index will be "
                "rebuilt on next query (this may take up to a minute for medium projects)",
                e,
            )
    else:
        log.info("migrated config from %s to %s", legacy_cfg, new_cfg)


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
        log.warning("could not read config: %s", e)
        return None


def _atomic_write_json(target: str, data: Dict[str, Any]) -> None:
    """Write JSON to `target` via tmpfile + os.replace for atomicity."""
    target_dir = os.path.dirname(target) or "."
    ensure_dir(target_dir)
    fd, tmp_path = tempfile.mkstemp(prefix=".config-", suffix=".json.tmp", dir=target_dir)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, target)
    except Exception:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


def write_config(ctx: ProjectContext) -> None:
    """Atomically serialize ProjectContext to the project's cache dir."""
    cfg = {
        "projectRoot": ctx.project_root,
        "frontendPath": ctx.frontend_path,
        "backendPath": ctx.backend_path,
        "lastIndexedAt": ctx.last_indexed_at,
        "lastWrittenAt": datetime.now(timezone.utc).isoformat(),
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
    _atomic_write_json(config_file_path(ctx.project_root), cfg)


def restore_context(project_root: str) -> Optional[ProjectContext]:
    """Rebuild ProjectContext from persisted config on disk.

    The function argument is the canonical project root. If the persisted
    config records a different `projectRoot` (e.g., the project was renamed
    or moved on disk), we trust the live argument over the stale recorded
    value so all derived paths stay consistent.
    """
    project_root = os.path.abspath(project_root)
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
        include_extensions=cfg.get("includeExtensions", _default_include_extensions()),
        exclude_dirs=cfg.get("excludeDirs", _default_exclude_dirs()),
        chunk_size=cfg.get("chunkSize", DEFAULT_CONFIG.chunk_size),
        chunk_overlap=cfg.get("chunkOverlap", DEFAULT_CONFIG.chunk_overlap),
        default_results=DEFAULT_CONFIG.default_results,
        max_results=DEFAULT_CONFIG.max_results,
        weights=cfg.get("weights", _default_weights()),
        custom_sources=custom_sources,
    )

    return ProjectContext(
        project_root=project_root,
        frontend_path=cfg.get("frontendPath"),
        backend_path=cfg.get("backendPath"),
        chroma_db_path=chroma_db_path(project_root),
        last_indexed_at=cfg.get("lastIndexedAt"),
        config=config,
    )
