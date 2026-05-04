"""Process-wide ChromaDB client cache.

ChromaDB's PersistentClient is meant to be a long-lived singleton — opening
a fresh client per operation costs an extra SQLite open + session creation.
This cache returns one client per persistence path, lazily, thread-safely.

The cache invalidates entries whose persist directory has been removed
under us (the README documents `rm -rf` as the recovery path).
"""

import logging
import os
import threading
from typing import Dict, Optional

import chromadb
from chromadb.config import Settings


log = logging.getLogger(__name__)


_clients: Dict[str, "chromadb.ClientAPI"] = {}
_lock = threading.Lock()


def get_client(persist_path: str) -> "chromadb.ClientAPI":
    """Return (and cache) the PersistentClient for `persist_path`.

    Drops the cached client if the on-disk directory has been removed.
    """
    persist_path = os.path.abspath(persist_path)
    with _lock:
        client = _clients.get(persist_path)
        if client is not None and not _is_dir_present(persist_path):
            log.info("dropping stale chroma client for %s", persist_path)
            _clients.pop(persist_path, None)
            client = None
        if client is not None:
            return client
        os.makedirs(persist_path, exist_ok=True)
        client = chromadb.PersistentClient(
            path=persist_path,
            settings=Settings(anonymized_telemetry=False),
        )
        _clients[persist_path] = client
        return client


def invalidate(persist_path: str) -> None:
    """Drop the cached client for `persist_path`, if any."""
    persist_path = os.path.abspath(persist_path)
    with _lock:
        _clients.pop(persist_path, None)


def warmup_embedding_model() -> Optional[str]:
    """Force the default embedding model to download/load.

    Returns None on success, or an error message describing the failure.
    """
    try:
        from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
        DefaultEmbeddingFunction()(["warmup"])
        return None
    except Exception as e:  # pragma: no cover
        return (
            f"Failed to load the default embedding model: {e}. "
            "First-run requires network access to download the all-MiniLM-L6-v2 "
            "ONNX model. Try: rm -rf ~/.cache/chroma and retry, or pre-warm "
            "with: python -c 'from chromadb.utils.embedding_functions "
            "import DefaultEmbeddingFunction; DefaultEmbeddingFunction()([\"warmup\"])'"
        )


def reset_cache() -> None:
    """Test-only: drop cached clients (e.g., when removing the persist dir)."""
    with _lock:
        _clients.clear()


def _is_dir_present(path: str) -> bool:
    try:
        return os.path.isdir(path)
    except OSError:
        return False
