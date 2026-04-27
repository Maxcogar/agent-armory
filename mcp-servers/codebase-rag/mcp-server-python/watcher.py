"""File-system watcher that keeps the index live during a session.

Uses watchdog to observe the project tree. Changes are debounced (one batch
per 500ms) and dispatched to a callback which is responsible for re-indexing.
The callback runs in the watcher's own thread, so it must be reasonably fast.
"""

import os
import sys
import threading
from typing import Callable, Optional, Set

from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer

from config import ProjectContext
from indexer import should_index


DEBOUNCE_SECONDS = 0.5


class _Handler(FileSystemEventHandler):
    def __init__(self, on_paths: Callable[[Set[str]], None], ctx: ProjectContext):
        super().__init__()
        self._on_paths = on_paths
        self._ctx = ctx
        self._buffer: Set[str] = set()
        self._timer: Optional[threading.Timer] = None
        self._lock = threading.Lock()

    def on_any_event(self, event: FileSystemEvent) -> None:
        if event.is_directory:
            return
        # `dest_path` is set on move events; treat moves as a touch of the destination.
        path = getattr(event, "dest_path", None) or event.src_path
        if not path:
            return
        abs_path = os.path.abspath(path)
        # Skip cache dir and anything we wouldn't index. (For deletes, should_index
        # returns False since the file is gone — we still want to fire on delete,
        # so we don't filter on existence here, only on path/extension.)
        parts = abs_path.replace("\\", "/").split("/")
        for excl in self._ctx.config.exclude_dirs:
            if excl in parts:
                return
        _, ext = os.path.splitext(abs_path)
        rel_basename = os.path.basename(abs_path)
        constraint_names = ("ARCHITECTURE.yml", "ARCHITECTURE.yaml", "CONSTRAINTS.md", "CLAUDE.md")
        if not ext and rel_basename not in constraint_names:
            return
        if ext and ext not in self._ctx.config.include_extensions:
            return

        with self._lock:
            self._buffer.add(abs_path)
            if self._timer is not None:
                self._timer.cancel()
            self._timer = threading.Timer(DEBOUNCE_SECONDS, self._flush)
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
        self._observer.schedule(self._handler, self._ctx.project_root, recursive=True)
        self._observer.daemon = True
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
