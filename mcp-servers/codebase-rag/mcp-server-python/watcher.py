"""File-system watcher that keeps the index live during a session.

Listens for write-class events (created / modified / deleted / moved) and
debounces them per-path. A single dedicated worker thread drains the
debounced batches so concurrent rebases or codemods can't spawn unbounded
indexer threads.
"""

import logging
import os
import queue
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


log = logging.getLogger(__name__)


def _debounce_seconds() -> float:
    raw = os.environ.get("RAG_WATCHER_DEBOUNCE_MS")
    if not raw:
        return 0.5
    try:
        return max(0.05, float(raw) / 1000.0)
    except ValueError:
        return 0.5


class _Handler(FileSystemEventHandler):
    """Routes write-class events through a per-path debounce.

    Each event resets a single timer; on fire, the buffered set is shipped
    to the worker queue. The handler holds at most one timer thread at a
    time, never spawning new ones while another batch is in flight.
    """

    def __init__(
        self,
        ctx: ProjectContext,
        gitignore_holder: "_GitIgnoreHolder",
        on_paths: Callable[[Set[str]], None],
    ):
        super().__init__()
        self._ctx = ctx
        self._gitignore_holder = gitignore_holder
        self._on_paths = on_paths
        self._buffer: Set[str] = set()
        self._timer: Optional[threading.Timer] = None
        self._lock = threading.Lock()
        self._debounce_s = _debounce_seconds()

    def on_created(self, event: FileSystemEvent) -> None:
        self._enqueue(event.src_path, event.is_directory)

    def on_modified(self, event: FileSystemEvent) -> None:
        self._enqueue(event.src_path, event.is_directory)

    def on_deleted(self, event: FileSystemEvent) -> None:
        self._enqueue(event.src_path, event.is_directory)

    def on_moved(self, event: FileSystemEvent) -> None:
        is_dir = isinstance(event, (FileMovedEvent, DirMovedEvent)) and event.is_directory
        self._enqueue(event.src_path, is_dir)
        dest = getattr(event, "dest_path", None)
        if dest:
            self._enqueue(dest, is_dir)

    def _enqueue(self, path: str, is_directory: bool) -> None:
        if is_directory or not path:
            return
        abs_path = os.path.abspath(path)
        if os.path.basename(abs_path) == ".gitignore":
            # The set of ignored files just changed; reload before next match.
            self._gitignore_holder.reload()
            return
        if not scope.is_in_scope(abs_path, self._ctx, gitignore=self._gitignore_holder.matcher):
            return
        with self._lock:
            self._buffer.add(abs_path)
            if self._timer is None:
                # Only schedule a flush if one isn't already pending. The
                # existing timer will pick up the newly-added paths.
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
                log.warning("dispatch error: %s", e)


class _GitIgnoreHolder:
    """Thread-safe wrapper around scope.GitIgnore for hot reload."""

    def __init__(self, project_root: str):
        self._project_root = project_root
        self._lock = threading.Lock()
        self._matcher = scope.load_gitignore(project_root)

    @property
    def matcher(self):
        with self._lock:
            return self._matcher

    def reload(self) -> None:
        with self._lock:
            self._matcher = scope.load_gitignore(self._project_root)


class ProjectWatcher:
    """Observes ctx.project_root and dispatches debounced batches of changed paths.

    Concurrency: a single worker thread drains a bounded queue. Watchdog
    callbacks return immediately after enqueueing, never blocking on I/O.
    Re-index callbacks per file run sequentially, eliminating the unbounded
    Timer-thread fan-out that earlier versions had.
    """

    def __init__(self, ctx: ProjectContext, on_change: Callable[[str, scope.GitIgnore], None]):
        self._ctx = ctx
        self._on_change = on_change
        self._observer: Optional[Observer] = None
        self._handler: Optional[_Handler] = None
        self._gitignore_holder: Optional[_GitIgnoreHolder] = None
        self._queue: "queue.Queue[Optional[Set[str]]]" = queue.Queue(maxsize=64)
        self._worker: Optional[threading.Thread] = None
        self._stop = threading.Event()

    def start(self) -> None:
        if self._observer is not None:
            return
        if not os.path.isdir(self._ctx.project_root):
            log.warning(
                "project root missing, watcher not starting: %s",
                self._ctx.project_root,
            )
            return
        self._gitignore_holder = _GitIgnoreHolder(self._ctx.project_root)
        self._handler = _Handler(self._ctx, self._gitignore_holder, self._submit)
        self._observer = Observer()
        self._observer.daemon = True
        self._observer.schedule(self._handler, self._ctx.project_root, recursive=True)
        self._observer.start()
        self._worker = threading.Thread(target=self._run_worker, daemon=True, name="rag-watcher-worker")
        self._worker.start()

    def stop(self) -> None:
        if self._observer is None:
            return
        try:
            self._observer.stop()
            self._observer.join(timeout=2.0)
        except Exception as e:
            log.warning("observer stop error: %s", e)
        self._stop.set()
        try:
            self._queue.put_nowait(None)
        except queue.Full:
            pass
        if self._worker is not None:
            self._worker.join(timeout=2.0)
        self._observer = None
        self._handler = None
        self._worker = None

    # --- internal ---

    def _submit(self, paths: Set[str]) -> None:
        try:
            self._queue.put_nowait(paths)
        except queue.Full:
            log.warning(
                "watcher queue full (%d items pending); dropping batch of %d",
                self._queue.maxsize, len(paths),
            )

    def _run_worker(self) -> None:
        while not self._stop.is_set():
            try:
                batch = self._queue.get(timeout=0.5)
            except queue.Empty:
                continue
            if batch is None:
                return
            for p in batch:
                if self._stop.is_set():
                    return
                try:
                    self._on_change(p, self._gitignore_holder.matcher if self._gitignore_holder else None)
                except Exception as e:
                    log.warning("reindex error for %s: %s", p, e)
