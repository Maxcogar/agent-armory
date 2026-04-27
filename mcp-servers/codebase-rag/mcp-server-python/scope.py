"""Single source of truth for file scoping and routing.

Used by both full-project indexing (indexer.index_project) and per-file
incremental indexing (indexer.index_file, watcher.ProjectWatcher). Every
"is this file in scope?" / "what collection does it go in?" decision in
the codebase comes through here.
"""

import fnmatch
import os
import sys
from dataclasses import dataclass
from typing import Iterable, List, Optional

from config import (
    ProjectContext,
    COLLECTION_CODEBASE,
    COLLECTION_CONSTRAINTS,
    COLLECTION_PATTERNS,
    SOURCE_TYPE_CONSTRAINTS,
    SOURCE_TYPE_DOCS,
    SOURCE_TYPE_CODE,
)
from utils.paths import safe_relative_path


CONSTRAINT_FILE_NAMES = (
    "ARCHITECTURE.yml",
    "ARCHITECTURE.yaml",
    "CONSTRAINTS.md",
    "CLAUDE.md",
)

PATTERN_DIR_PREFIX = "docs/patterns/"


@dataclass
class Category:
    collection: str       # COLLECTION_* constant
    type_label: str       # "code" | "constraint" | "pattern" | "custom"
    source_type: str      # SOURCE_TYPE_* constant
    weight: float         # retrieval weight


# ============================================================
# .gitignore loader
# ============================================================


def _load_gitignore(project_root: str):
    """Build a pathspec matcher from the project's .gitignore chain.

    Returns None if pathspec isn't installed or no .gitignore exists; callers
    must handle None as "no extra ignores beyond exclude_dirs".
    """
    try:
        import pathspec
    except ImportError:
        return None

    patterns: List[str] = []
    # Repo root .gitignore is the most common case; nested .gitignore files
    # are also respected by walking the tree below.
    root_gi = os.path.join(project_root, ".gitignore")
    if os.path.isfile(root_gi):
        try:
            with open(root_gi, "r", encoding="utf-8", errors="replace") as f:
                patterns.extend(f.read().splitlines())
        except OSError as e:
            sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to read .gitignore: {e}\n")

    if not patterns:
        return None

    try:
        return pathspec.PathSpec.from_lines("gitwildmatch", patterns)
    except Exception as e:
        sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to parse .gitignore: {e}\n")
        return None


# ============================================================
# Scope
# ============================================================


def _path_segments(abs_path: str) -> List[str]:
    return abs_path.replace("\\", "/").split("/")


def _matches_excluded_dir(abs_path: str, exclude_dirs: Iterable[str]) -> bool:
    parts = _path_segments(abs_path)
    return any(excl in parts for excl in exclude_dirs)


def _is_constraint_name(rel_path: str) -> bool:
    return rel_path in CONSTRAINT_FILE_NAMES


def _is_pattern_path(rel_path: str) -> bool:
    norm = rel_path.replace("\\", "/")
    return norm.startswith(PATTERN_DIR_PREFIX) and norm.endswith(".md")


def _matches_custom_source(rel_path: str, ctx: ProjectContext):
    norm = rel_path.replace("\\", "/")
    for source in ctx.config.custom_sources:
        if fnmatch.fnmatch(norm, source.pattern.replace("\\", "/")):
            return source
    return None


def is_in_scope(abs_path: str, ctx: ProjectContext, gitignore=None) -> bool:
    """True iff this file should be indexed.

    Honors:
      1. Project root containment.
      2. config.exclude_dirs (always).
      3. .gitignore via pathspec, when available.
      4. config.include_extensions (constraint-named files allowed regardless).
    """
    project_root = os.path.abspath(ctx.project_root)
    abs_path = os.path.abspath(abs_path)
    if not abs_path.startswith(project_root):
        return False

    if _matches_excluded_dir(abs_path, ctx.config.exclude_dirs):
        return False

    rel_path = safe_relative_path(project_root, abs_path)

    if gitignore is not None:
        if gitignore.match_file(rel_path):
            return False

    if _is_constraint_name(rel_path):
        return True

    _, ext = os.path.splitext(abs_path)
    if not ext:
        return False
    return ext in ctx.config.include_extensions


def categorize(abs_path: str, ctx: ProjectContext) -> Optional[Category]:
    """Decide the collection + metadata for a file. None if not in scope.

    Mirrors the routing baked into index_project: constraint names → constraints,
    docs/patterns/ → patterns, custom-source matches → their declared collection,
    code extensions → codebase, plain markdown/yaml/json that isn't a constraint
    or pattern → not indexed.
    """
    if not is_in_scope(abs_path, ctx):
        return None

    rel_path = safe_relative_path(ctx.project_root, abs_path)
    weights = ctx.config.weights

    if _is_constraint_name(rel_path):
        return Category(
            collection=COLLECTION_CONSTRAINTS,
            type_label="constraint",
            source_type=SOURCE_TYPE_CONSTRAINTS,
            weight=_weight_for(rel_path, weights),
        )

    if _is_pattern_path(rel_path):
        return Category(
            collection=COLLECTION_PATTERNS,
            type_label="pattern",
            source_type=SOURCE_TYPE_DOCS,
            weight=_weight_for(rel_path, weights),
        )

    custom = _matches_custom_source(rel_path, ctx)
    if custom is not None:
        collection_for_source = {
            SOURCE_TYPE_CONSTRAINTS: COLLECTION_CONSTRAINTS,
            SOURCE_TYPE_DOCS: COLLECTION_PATTERNS,
            SOURCE_TYPE_CODE: COLLECTION_CODEBASE,
        }.get(custom.source_type, COLLECTION_PATTERNS)
        return Category(
            collection=collection_for_source,
            type_label="custom",
            source_type=custom.source_type,
            weight=custom.weight,
        )

    _, ext = os.path.splitext(rel_path)
    if ext in (".yml", ".yaml", ".md", ".json"):
        # Non-code extensions that aren't constraints/patterns aren't routed anywhere.
        return None

    return Category(
        collection=COLLECTION_CODEBASE,
        type_label="code",
        source_type=SOURCE_TYPE_CODE,
        weight=_weight_for(rel_path, weights),
    )


def _weight_for(relative_path: str, weights) -> float:
    """Use longest pattern-match wins; falls back to 1.0."""
    sorted_patterns = sorted(weights.items(), key=lambda x: len(x[0]), reverse=True)
    for pattern, weight in sorted_patterns:
        if pattern in relative_path:
            return weight
    return 1.0
