"""SVG hatch patterns (D9): thin parallel lines at a per-component angle.

The pattern is defined in user space (``patternUnits="userSpaceOnUse"``) so
hatch pitch is geometry-scaled, and rotated with ``patternTransform``. The
renderer maps model space to SVG with a y-flip, so a model-space hatch angle
``a`` becomes ``rotate(-a)`` in SVG space.
"""

from __future__ import annotations

from xsect.fmt import fmt

STROKE_COLOR = "var(--color-text-primary, #1f2328)"


def hatch_pattern(pattern_id: str, angle_deg: float, extent: float, thin: float) -> str:
    pitch = 0.025 * extent
    return (
        f'<pattern id="{pattern_id}" patternUnits="userSpaceOnUse" '
        f'width="{fmt(pitch)}" height="{fmt(pitch)}" '
        f'patternTransform="rotate({fmt(-angle_deg)})">'
        f'<line x1="0" y1="0" x2="0" y2="{fmt(pitch)}" '
        f'stroke="{STROKE_COLOR}" stroke-width="{fmt(thin)}"/>'
        f"</pattern>"
    )
