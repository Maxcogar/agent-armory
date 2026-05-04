"""Single source of truth for file scoping and routing.

Used by full-project indexing (indexer.discover_indexable_files), per-file
incremental indexing (indexer.index_file), and the filesystem watcher.

Path containment is checked via Path.relative_to (not string startswith) so
sibling directories with a shared prefix don't leak in. Excluded-dir matches
are computed against the *relative* path so projects living under
~/.cache/foo/ aren't entirely excluded by their ancestor's name.
"""

import fnmatch
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

from config import (
    ProjectContext,
    COLLECTION_CODEBASE,
    COLLECTION_CONSTRAINTS,
    COLLECTION_PATTERNS,
    SOURCE_TYPE_CONSTRAINTS,
    SOURCE_TYPE_DOCS,
    SOURCE_TYPE_CODE,
)


log = logging.getLogger(__name__)


CONSTRAINT_FILE_NAMES: Tuple[str, ...] = (
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
    weight: float


# ============================================================
# .gitignore loader
# ============================================================


class GitIgnore:
    """Walks the project tree once at construction, collecting every `.gitignore`.

    Each `.gitignore` is a `pathspec.PathSpec` rooted at its containing
    directory. `match_file(rel_path)` checks every applicable spec; a file is
    ignored iff any ancestor `.gitignore` says so. Returns False (i.e., don't
    ignore) when pathspec isn't installed.
    """

    def __init__(self, project_root: str):
        self._project_root = os.path.abspath(project_root)
        self._specs: List[Tuple[str, "pathspec.PathSpec"]] = []
        self._loaded = False
        self._reload()

    def _reload(self) -> None:
        try:
            import pathspec  # noqa: F401  (imported for the type)
        except ImportError:
            self._loaded = False
            return

        import pathspec as _ps
        specs: List[Tuple[str, _ps.PathSpec]] = []
        for dirpath, dirnames, filenames in os.walk(self._project_root):
            # Don't descend into .git or anything obvious; the user can add more
            # via exclude_dirs but at least skip the universally useless ones.
            dirnames[:] = [d for d in dirnames if d not in (".git",)]
            if ".gitignore" in filenames:
                gi_path = os.path.join(dirpath, ".gitignore")
                try:
                    with open(gi_path, "r", encoding="utf-8", errors="replace") as f:
                        patterns = f.read().splitlines()
                except OSError as e:
                    log.warning("failed to read %s: %s", gi_path, e)
                    continue
                if not patterns:
                    continue
                try:
                    spec = _ps.PathSpec.from_lines("gitwildmatch", patterns)
                except Exception as e:
                    log.warning("failed to parse %s: %s", gi_path, e)
                    continue
                specs.append((dirpath, spec))
        self._specs = specs
        self._loaded = True

    def reload(self) -> None:
        """Re-read every .gitignore in the project tree."""
        self._reload()

    def match_file(self, abs_path: str) -> bool:
        if not self._loaded or not self._specs:
            return False
        for spec_dir, spec in self._specs:
            try:
                rel = os.path.relpath(abs_path, spec_dir)
            except ValueError:
                continue
            if rel.startswith(".."):
                continue
            if spec.match_file(rel.replace(os.sep, "/")):
                return True
        return False


def load_gitignore(project_root: str) -> Optional[GitIgnore]:
    """Build a GitIgnore matcher for the project, or None if pathspec missing."""
    try:
        import pathspec  # noqa: F401
    except ImportError:
        return None
    return GitIgnore(project_root)


# ============================================================
# Containment + filtering primitives
# ============================================================


def _is_within(abs_path: str, project_root: str) -> bool:
    """True iff abs_path is the project root or a descendant of it."""
    try:
        rel = Path(os.path.normcase(abs_path)).resolve().relative_to(
            Path(os.path.normcase(project_root)).resolve()
        )
    except (ValueError, OSError):
        return False
    return ".." not in rel.parts


def _matches_excluded_dir(rel_path: str, exclude_dirs: Iterable[str]) -> bool:
    """Check excluded names against the *relative* path's segments only."""
    parts = rel_path.replace("\\", "/").split("/")
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


# ============================================================
# Public API
# ============================================================


def is_in_scope(
    abs_path: str,
    ctx: ProjectContext,
    gitignore: Optional[GitIgnore] = None,
) -> bool:
    """True iff this file should be indexed."""
    project_root = os.path.abspath(ctx.project_root)
    abs_path = os.path.abspath(abs_path)

    if not _is_within(abs_path, project_root):
        return False

    rel_path = os.path.relpath(abs_path, project_root).replace(os.sep, "/")

    if _matches_excluded_dir(rel_path, ctx.config.exclude_dirs):
        return False

    if gitignore is not None and gitignore.match_file(abs_path):
        return False

    if _is_constraint_name(rel_path):
        return True

    _, ext = os.path.splitext(abs_path)
    if not ext:
        return False
    return ext in ctx.config.include_extensions


def categorize(
    abs_path: str,
    ctx: ProjectContext,
    gitignore: Optional[GitIgnore] = None,
) -> Optional[Category]:
    """Decide the collection + metadata for a file. None if not in scope."""
    if not is_in_scope(abs_path, ctx, gitignore=gitignore):
        return None

    rel_path = os.path.relpath(
        os.path.abspath(abs_path), os.path.abspath(ctx.project_root)
    ).replace(os.sep, "/")
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
        # Non-code extensions that aren't constraints/patterns aren't routed.
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
