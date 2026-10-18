"""Cross-process single-writer lock for a project's cache directory.

ChromaDB's PersistentClient does not support multiple processes writing the
same directory: concurrent writers lose deletes, see collections vanish, race
SQLite migrations, and interleave HNSW segment writes. Every Claude Code
session starts its own server, and the Stop hook starts a reindex process, so
without this lock several processes write one index at once.

The OS releases the lock when the holding process exits, including on a hard
kill, so a crashed owner never leaves the index stuck.
"""

import logging
import os
import sys
from typing import Optional, IO


log = logging.getLogger(__name__)


LOCK_FILE_NAME = "writer.lock"


class WriterLock:
    def __init__(self, cache_dir: str):
        self.path = os.path.join(cache_dir, LOCK_FILE_NAME)
        self._file: Optional[IO[bytes]] = None

    @property
    def held(self) -> bool:
        return self._file is not None

    def try_acquire(self) -> bool:
        """Take the lock without blocking. Returns True if this process now holds it."""
        if self._file is not None:
            return True
        f = open(self.path, "a+b")
        try:
            if sys.platform == "win32":
                import msvcrt
                f.seek(0)
                msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(f.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            f.close()
            return False
        self._file = f
        return True

    def release(self) -> None:
        f, self._file = self._file, None
        if f is None:
            return
        try:
            if sys.platform == "win32":
                import msvcrt
                f.seek(0)
                msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except OSError as e:
            log.warning("writer lock release: %s", e)
        finally:
            f.close()
