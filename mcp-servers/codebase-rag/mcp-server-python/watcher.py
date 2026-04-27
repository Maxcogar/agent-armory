"""File-system watcher that keeps the index live during a session.

Listens for write-class events (created / modified / deleted / moved) and
debounces them per-path. Filtering routes through `scope.is_in_scope`, the
single source of truth shared with the full and per-file indexers.
"""

import os
import sys
import threading
from typing import Callable, Optional, Set

from watchdog.events import (
    FileSystemEvent,
    FileSystemEventHandler,
    FileMovedEvent,
    DirMovedEvent,
)
from watchdog.observers import Observer

from config import ProjectContext
import scope


def _debounce_seconds() -> float:
    raw = os.environ.get("RAG_WATCHER_DEBOUNCE_MS")
    if not raw:
        return 0.5
    try:
        return max(0.05, float(raw) / 1000.0)
    except ValueError:
        return 0.5


class _Handler(FileSystemEventHandler):
    """Routes write-class events through a per-path debounce."""

    def __init__(self, on_paths: Callable[[Set[str]], None], ctx: ProjectContext):
        super().__init__()
        self._on_paths = on_paths
        self._ctx = ctx
        self._gitignore = scope._load_gitignore(ctx.project_root)
        self._buffer: Set[str] = set()
        self._timer: Optional[threading.Timer] = None
        self._lock = threading.Lock()
        self._debounce_s = _debounce_seconds()

    # --- watchdog write-class hooks ---

    def on_created(self, event: FileSystemEvent) -> None:
        self._enqueue(event.src_path, event.is_directory)

    def on_modified(self, event: FileSystemEvent) -> None:
        self._enqueue(event.src_path, event.is_directory)

    def on_deleted(self, event: FileSystemEvent) -> None:
        self._enqueue(event.src_path, event.is_directory)

    def on_moved(self, event: FileSystemEvent) -> None:
        # A move is a delete-of-src + create-of-dest; queue both.
        is_dir = isinstance(event, (FileMovedEvent, DirMovedEvent)) and event.is_directory
        self._enqueue(event.src_path, is_dir)
        dest = getattr(event, "dest_path", None)
        if dest:
            self._enqueue(dest, is_dir)

    # --- internal ---

    def _enqueue(self, path: str, is_directory: bool) -> None:
        if is_directory or not path:
            return
        abs_path = os.path.abspath(path)
        # For deletes, the file may not exist; is_in_scope still works as long
        # as the path is under the project root and matches an include rule.
        if not scope.is_in_scope(abs_path, self._ctx, gitignore=self._gitignore):
            return
        with self._lock:
            self._buffer.add(abs_path)
            if self._timer is not None:
                self._timer.cancel()
            self._timer = threading.Timer(self._debounce_s, self._flush)
            self._timer.daemon = True
            self._timer.start()

    def _flush(self) -> None:
        with self._lock:
            paths = self._buffer
            self._buffer = set()
            self._timer = None
        if paths:
            try:
                self._on_paths(paths)
            except Exception as e:
                sys.stderr.write(f"[codebase_rag_mcp] watcher dispatch error: {e}\n")


class ProjectWatcher:
    """Observes ctx.project_root and dispatches debounced batches of changed paths."""

    def __init__(self, ctx: ProjectContext, on_change: Callable[[str], None]):
        self._ctx = ctx
        self._on_change = on_change
        self._observer: Optional[Observer] = None
        self._handler: Optional[_Handler] = None

    def start(self) -> None:
        if self._observer is not None:
            return
        if not os.path.isdir(self._ctx.project_root):
            sys.stderr.write(
                f"[codebase_rag_mcp] watcher: project root missing, not starting: "
                f"{self._ctx.project_root}\n"
            )
            return
        self._handler = _Handler(self._dispatch, self._ctx)
        self._observer = Observer()
        self._observer.daemon = True
        self._observer.schedule(self._handler, self._ctx.project_root, recursive=True)
        self._observer.start()

    def stop(self) -> None:
        if self._observer is None:
            return
        try:
            self._observer.stop()
            self._observer.join(timeout=2.0)
        except Exception as e:
            sys.stderr.write(f"[codebase_rag_mcp] watcher stop error: {e}\n")
        self._observer = None
        self._handler = None

    def _dispatch(self, paths: Set[str]) -> None:
        for p in paths:
            try:
                self._on_change(p)
            except Exception as e:
                sys.stderr.write(
                    f"[codebase_rag_mcp] watcher reindex error for {p}: {e}\n"
                )
