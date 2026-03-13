"""Content chunking with function-boundary detection."""

import hashlib
import re
from dataclasses import dataclass
from typing import List

from .paths import normalize_path

# Target ~300 tokens per chunk. Rough heuristic: 1 line ~ 10 tokens.
TARGET_LINES = 30
OVERLAP_LINES = 5


@dataclass
class Chunk:
    id: str
    content: str
    index: int
    total_chunks: int


def chunk_id(file_path: str, index: int) -> str:
    """Generate a SHA-256 based chunk ID (truncated to 32 hex chars)."""
    data = f"{file_path}::chunk::{index}"
    return hashlib.sha256(data.encode()).hexdigest()[:32]


# Patterns that indicate top-level block boundaries
BOUNDARY_PATTERNS = [
    re.compile(r"^(?:export\s+)?(?:async\s+)?function\s+"),
    re.compile(r"^(?:export\s+)?(?:default\s+)?class\s+"),
    re.compile(r"^(?:export\s+)?const\s+\w+\s*=\s*(?:async\s+)?\("),
    re.compile(r"^(?:export\s+)?const\s+\w+\s*=\s*(?:async\s+)?function"),
    re.compile(r"^(?:export\s+default\s+)?function\s+"),
    re.compile(r"^(?:module\.exports|exports)\s*[=.]"),
    re.compile(r"^(?:router|app)\.(?:get|post|put|patch|delete|use)\s*\("),
    re.compile(r"^def\s+\w+\s*\("),
    re.compile(r"^class\s+\w+"),
    re.compile(r"^async\s+def\s+\w+"),
]


def detect_boundaries(lines: List[str]) -> List[int]:
    """Detect function/class boundaries in code.

    Returns line indices where new top-level blocks start.
    """
    boundaries = [0]

    for i in range(1, len(lines)):
        trimmed = lines[i].lstrip()
        indent = len(lines[i]) - len(trimmed)
        if indent > 4:
            continue

        for pat in BOUNDARY_PATTERNS:
            if pat.search(trimmed):
                boundaries.append(i)
                break

    return boundaries


def chunk_content(file_path: str, content: str) -> List[Chunk]:
    """Chunk file content respecting function boundaries where possible.

    Falls back to line-based chunking with overlap.
    """
    normalized_path = normalize_path(file_path)
    lines = content.split("\n")

    if len(lines) <= TARGET_LINES:
        cid = chunk_id(normalized_path, 0)
        return [
            Chunk(
                id=cid,
                content=f"# File: {normalized_path}\n{content}",
                index=0,
                total_chunks=1,
            )
        ]

    boundaries = detect_boundaries(lines)
    raw_chunks: List[List[str]] = []
    current_chunk: List[str] = []
    current_len = 0

    for bi in range(len(boundaries)):
        start = boundaries[bi]
        end = boundaries[bi + 1] if bi + 1 < len(boundaries) else len(lines)
        block = lines[start:end]

        # If adding this block would exceed the target, save current and start new
        if current_len > 0 and current_len + len(block) > TARGET_LINES * 1.5:
            raw_chunks.append(current_chunk)
            # Add overlap from end of previous chunk
            overlap_start = max(0, len(current_chunk) - OVERLAP_LINES)
            current_chunk = current_chunk[overlap_start:]
            current_len = len(current_chunk)

        current_chunk.extend(block)
        current_len += len(block)

    if current_chunk:
        raw_chunks.append(current_chunk)

    # If boundary detection produced too few chunks, fall back to simple line chunking
    if len(raw_chunks) <= 1 and len(lines) > TARGET_LINES:
        raw_chunks = []
        step = TARGET_LINES - OVERLAP_LINES
        for i in range(0, len(lines), step):
            raw_chunks.append(lines[i : i + TARGET_LINES])

    total_chunks = len(raw_chunks)
    results: List[Chunk] = []

    for i, chunk_lines in enumerate(raw_chunks):
        cid = chunk_id(normalized_path, i)
        if total_chunks == 1:
            header = f"# File: {normalized_path}\n"
        else:
            header = f"# File: {normalized_path} (chunk {i + 1}/{total_chunks})\n"
        results.append(
            Chunk(
                id=cid,
                content=header + "\n".join(chunk_lines),
                index=i,
                total_chunks=total_chunks,
            )
        )

    return results
