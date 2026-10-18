"""Structural check of persisted HNSW segments, run BEFORE chromadb opens them.

chroma-hnswlib's loadPersistedIndex trusts the sizes recorded in header.bin:
a corrupted size_data_per_element makes it allocate max_elements times that
value (GBs from a few-MB index), and a corrupted cur_element_count makes it
read past its buffers and segfault. Neither is detectable once the load has
started, so every segment is checked here first.

Layout (chroma-hnswlib 0.7.x, little-endian, 100 bytes):
  0  u32 persistence version (1)     52 i32 maxlevel
  4  u64 offsetLevel0 (0)            56 u32 enterpoint_node
  12 u64 max_elements                60 u64 maxM
  20 u64 cur_element_count           68 u64 maxM0
  28 u64 size_data_per_element       76 u64 M
  36 u64 label_offset                84 f64 mult
  44 u64 offsetData                  92 u64 ef_construction

Invariants come from how hnswlib derives these fields from (dim, M):
offsetData = maxM0*4 + 4, label_offset = offsetData + dim*4,
size_data_per_element = label_offset + 8, maxM = M, maxM0 = 2*M. The data
files are sized in whole elements between cur and max.
"""

import math
import os
import struct
from typing import List, Optional


HEADER_SIZE = 100
PERSISTENCE_VERSION = 1
_MAX_M = 4096
_MAX_DIM = 65536
_MAX_LEVEL = 64
_NO_ENTRYPOINT = 0xFFFFFFFF


def check_segment(segment_dir: str) -> Optional[str]:
    """Return a description of the first problem found, or None if the segment is sound."""
    header_path = os.path.join(segment_dir, "header.bin")
    has_meta = os.path.isfile(os.path.join(segment_dir, "index_metadata.pickle"))
    if not os.path.isfile(header_path):
        # Chroma only loads the HNSW files when index_metadata.pickle exists.
        return "index_metadata.pickle without header.bin" if has_meta else None

    with open(header_path, "rb") as f:
        raw = f.read(HEADER_SIZE + 1)
    if len(raw) != HEADER_SIZE:
        return f"header.bin is {len(raw)} bytes, expected {HEADER_SIZE}"

    (version,) = struct.unpack_from("<I", raw, 0)
    offset_level0, max_el, cur, size_el, label_off, offset_data = struct.unpack_from("<6Q", raw, 4)
    maxlevel, enterpoint = struct.unpack_from("<iI", raw, 52)
    max_m, max_m0, m = struct.unpack_from("<3Q", raw, 60)
    (mult,) = struct.unpack_from("<d", raw, 84)

    if version != PERSISTENCE_VERSION:
        return f"persistence version {version}"
    if offset_level0 != 0:
        return f"offsetLevel0 {offset_level0}"
    if not (1 <= m <= _MAX_M and max_m == m and max_m0 == 2 * m):
        return f"M/maxM/maxM0 inconsistent ({m}/{max_m}/{max_m0})"
    if offset_data != max_m0 * 4 + 4:
        return f"offsetData {offset_data} != maxM0*4+4"
    data_size = label_off - offset_data
    if label_off <= offset_data or data_size % 4 or data_size // 4 > _MAX_DIM:
        return f"label_offset {label_off} implies invalid dimension"
    if size_el != label_off + 8:
        return f"size_data_per_element {size_el} != label_offset+8"
    if cur > max_el:
        return f"cur_element_count {cur} > max_elements {max_el}"
    if not math.isfinite(mult) or mult <= 0:
        return f"mult {mult}"
    if cur == 0:
        if enterpoint != _NO_ENTRYPOINT:
            return f"enterpoint {enterpoint} in an empty index"
    elif enterpoint >= cur or not (0 <= maxlevel <= _MAX_LEVEL):
        return f"enterpoint {enterpoint} / maxlevel {maxlevel} out of range"

    for name, unit in (("data_level0.bin", size_el), ("length.bin", 4)):
        path = os.path.join(segment_dir, name)
        if not os.path.isfile(path):
            return f"{name} missing"
        size = os.path.getsize(path)
        if size % unit or not (cur * unit <= size <= max_el * unit):
            return f"{name} is {size} bytes; expected a multiple of {unit} between {cur * unit} and {max_el * unit}"
    if not os.path.isfile(os.path.join(segment_dir, "link_lists.bin")):
        return "link_lists.bin missing"
    return None


def find_corrupt_segments(collections_dir: str) -> List[str]:
    """Check every segment directory under a PersistentClient path.

    Returns one "<segment>: <problem>" string per bad segment; empty means sound.
    """
    problems: List[str] = []
    try:
        entries = sorted(os.scandir(collections_dir), key=lambda e: e.name)
    except FileNotFoundError:
        return problems
    for entry in entries:
        if not entry.is_dir():
            continue
        try:
            problem = check_segment(entry.path)
        except OSError as e:
            problem = f"unreadable ({e})"
        if problem:
            problems.append(f"{entry.name}: {problem}")
    return problems
