"""The single float renderer (architecture D15).

Every float that reaches an output string — SVG coordinates, evidence text,
annotation values, DXF entity hashing — goes through :func:`fmt`. One policy,
one place, so byte-determinism is a property of the pipeline rather than a
per-callsite accident.

Policy: 9 significant digits via ``%.9g`` (printf semantics — stable for a
given double value on a given platform/build), with negative zero normalized
to ``0`` and exact integers rendered without an exponent tail where ``%.9g``
already does so. Cross-platform byte identity is NOT promised (libm variance;
recorded in the architecture's Limitations); per-platform determinism is.
"""

from __future__ import annotations


def fmt(x: float) -> str:
    """Render a float deterministically at 9 significant digits."""
    if x == 0.0:  # collapses -0.0 as well: (-0.0 == 0.0) is True
        return "0"
    return f"{x:.9g}"
