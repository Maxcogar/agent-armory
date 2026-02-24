"""Path utilities for consistent cross-platform path handling."""

import os


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
