"""Path utilities for consistent cross-platform path handling."""

import hashlib
import os
from pathlib import Path
from typing import Optional


PROJECT_ROOT_SENTINELS = (
    ".git",
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
)


def normalize_path(p: str) -> str:
    """Normalize a path to always use forward slashes."""
    return p.replace("\\", "/")


def safe_relative_path(root: str, target: str) -> str:
    """Compute a relative path from root to target, normalized to forward slashes."""
    return normalize_path(os.path.relpath(target, root))


def resolve_path(root: str, p: str) -> str:
    """Resolve a potentially relative path against a root directory."""
    if os.path.isabs(p):
        return os.path.abspath(p)
    return os.path.abspath(os.path.join(root, p))


def directory_exists(dir_path: str) -> bool:
    """Check if a directory exists."""
    return os.path.isdir(dir_path)


def file_exists(file_path: str) -> bool:
    """Check if a file exists."""
    return os.path.isfile(file_path)


def ensure_dir(dir_path: str) -> None:
    """Ensure a directory exists, creating it recursively if needed."""
    os.makedirs(dir_path, exist_ok=True)


def find_project_root(start_dir: Optional[str] = None) -> Optional[str]:
    """Walk up from start_dir to the first directory containing a project sentinel.

    Stops at filesystem root or $HOME. Returns the absolute path of the directory
    containing the sentinel, or None if none found.
    """
    current = Path(start_dir or os.getcwd()).resolve()
    home = Path.home().resolve()
    fs_root = Path(current.anchor or "/")

    while True:
        for sentinel in PROJECT_ROOT_SENTINELS:
            if (current / sentinel).exists():
                return str(current)
        if current == home or current == fs_root or current.parent == current:
            return None
        current = current.parent


def cache_dir_for(project_root: str) -> Path:
    """Compute and create the cache directory for a project.

    Layout: $XDG_CACHE_HOME/codebase-rag/<sha1(abs_root)[:16]>/
    Falls back to ~/.cache when XDG_CACHE_HOME is unset.
    """
    abs_root = os.path.abspath(project_root)
    digest = hashlib.sha1(abs_root.encode("utf-8")).hexdigest()[:16]
    base = os.environ.get("XDG_CACHE_HOME")
    cache_root = Path(base) if base else Path.home() / ".cache"
    cache = cache_root / "codebase-rag" / digest
    cache.mkdir(parents=True, exist_ok=True)
    return cache


def index_exists_for(project_root: str) -> bool:
    """True iff the cache dir for this project contains a populated ChromaDB."""
    cache = cache_dir_for(project_root)
    config_file = cache / "config.json"
    collections_dir = cache / "collections"
    if not config_file.is_file():
        return False
    if not collections_dir.is_dir():
        return False
    try:
        return any(collections_dir.iterdir())
    except OSError:
        return False
