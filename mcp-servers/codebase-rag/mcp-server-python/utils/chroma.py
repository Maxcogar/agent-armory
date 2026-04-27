"""Process-wide ChromaDB client cache.

ChromaDB's PersistentClient is meant to be a long-lived singleton — opening
a fresh client per operation costs an extra SQLite open + session creation.
This cache returns one client per persistence path, lazily, thread-safely.
"""

import sys
import threading
from typing import Dict, Optional

import chromadb
from chromadb.config import Settings


_clients: Dict[str, "chromadb.ClientAPI"] = {}
_lock = threading.Lock()


def get_client(persist_path: str) -> "chromadb.ClientAPI":
    """Return (and cache) the PersistentClient for `persist_path`."""
    with _lock:
        client = _clients.get(persist_path)
        if client is not None:
            return client
        client = chromadb.PersistentClient(
            path=persist_path,
            settings=Settings(anonymized_telemetry=False),
        )
        _clients[persist_path] = client
        return client


def warmup_embedding_model() -> Optional[str]:
    """Force the default embedding model to download/load.

    Returns None on success, or an error message describing the failure
    (suitable for logging or surfacing to the user).
    """
    try:
        from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
        DefaultEmbeddingFunction()(["warmup"])
        return None
    except Exception as e:  # pragma: no cover - covers every download/IO path
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
