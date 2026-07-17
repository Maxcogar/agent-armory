"""Annotation rendering (D9/FR-18): extension lines, dimension lines,
arrowheads, value text with tier badges, and radius leaders.

Layout policy (implementation decision, deterministic): along-X dimensions
stack above the section bbox; along-Y dimensions stack to the right; free
dimensions sit on a perpendicular offset at their midpoint. Radius callouts
lead outward from the arc midpoint. Collision-free layout of arbitrary
drawings is out of scope for v1 and recorded as a limitation.

All coordinates arriving here are MODEL space; ``_s`` maps to SVG (y-flip).
"""

from __future__ import annotations

import math
from xml.sax.saxutils import escape

from xsect.fmt import fmt
from xsect.section import LinearAnnotation, RadiusAnnotation

COLOR = "var(--color-text-secondary, #59636e)"


def _s(x: float, y: float) -> tuple[float, float]:
    return x, -y


def _line(a: tuple[float, float], b: tuple[float, float], w: float) -> str:
    return (
        f'<line x1="{fmt(a[0])}" y1="{fmt(a[1])}" x2="{fmt(b[0])}" '
        f'y2="{fmt(b[1])}" stroke="{COLOR}" stroke-width="{fmt(w)}"/>'
    )


def _arrow(tip: tuple[float, float], direction: tuple[float, float], size: float) -> str:
    dx, dy = direction
    n = math.hypot(dx, dy) or 1.0
    dx, dy = dx / n, dy / n
    px, py = -dy, dx
    b1 = (tip[0] - size * dx + 0.4 * size * px, tip[1] - size * dy + 0.4 * size * py)
    b2 = (tip[0] - size * dx - 0.4 * size * px, tip[1] - size * dy - 0.4 * size * py)
    return (
        f'<path d="M {fmt(tip[0])} {fmt(tip[1])} L {fmt(b1[0])} {fmt(b1[1])} '
        f'L {fmt(b2[0])} {fmt(b2[1])} Z" fill="{COLOR}"/>'
    )


def _text(x: float, y: float, content: str, size: float, anchor: str = "middle") -> str:
    return (
        f'<text x="{fmt(x)}" y="{fmt(y)}" font-size="{fmt(size)}" '
        f'font-family="ui-monospace, SFMono-Regular, Menlo, monospace" '
        f'fill="{COLOR}" text-anchor="{anchor}">{escape(content)}</text>'
    )


def linear_fragments(
    annotations: tuple[LinearAnnotation, ...],
    bbox: tuple[float, float, float, float],
    extent: float,
) -> list[str]:
    thin = 0.0025 * extent
    arrow = 0.02 * extent
    font = 0.035 * extent
    frags: list[str] = []
    kx = ky = kf = 0
    for ann in annotations:
        label = f"{ann.dim} = {fmt(ann.value)} {ann.unit} [{ann.badge}]"
        if ann.along == "X":
            level = bbox[3] + (0.08 + 0.06 * kx) * extent  # model y above top
            kx += 1
            a = _s(ann.a.x, level)
            b = _s(ann.b.x, level)
            frags.append(_line(_s(ann.a.x, ann.a.y), a, thin))
            frags.append(_line(_s(ann.b.x, ann.b.y), b, thin))
            frags.append(_line(a, b, thin))
            frags.append(_arrow(a, (a[0] - b[0], 0.0), arrow))
            frags.append(_arrow(b, (b[0] - a[0], 0.0), arrow))
            frags.append(_text((a[0] + b[0]) / 2.0, a[1] - 0.35 * font, label, font))
        elif ann.along == "Y":
            level = bbox[2] + (0.08 + 0.06 * ky) * extent  # model x right of box
            ky += 1
            a = _s(level, ann.a.y)
            b = _s(level, ann.b.y)
            frags.append(_line(_s(ann.a.x, ann.a.y), a, thin))
            frags.append(_line(_s(ann.b.x, ann.b.y), b, thin))
            frags.append(_line(a, b, thin))
            frags.append(_arrow(a, (0.0, a[1] - b[1]), arrow))
            frags.append(_arrow(b, (0.0, b[1] - a[1]), arrow))
            frags.append(
                _text(a[0] + 0.35 * font, (a[1] + b[1]) / 2.0, label, font, "start")
            )
        else:
            kf += 1
            dx, dy = ann.b.x - ann.a.x, ann.b.y - ann.a.y
            n = math.hypot(dx, dy) or 1.0
            px, py = -dy / n, dx / n
            off = (0.05 + 0.05 * (kf - 1)) * extent
            a_m = (ann.a.x + off * px, ann.a.y + off * py)
            b_m = (ann.b.x + off * px, ann.b.y + off * py)
            a, b = _s(*a_m), _s(*b_m)
            frags.append(_line(_s(ann.a.x, ann.a.y), a, thin))
            frags.append(_line(_s(ann.b.x, ann.b.y), b, thin))
            frags.append(_line(a, b, thin))
            frags.append(_arrow(a, (a[0] - b[0], a[1] - b[1]), arrow))
            frags.append(_arrow(b, (b[0] - a[0], b[1] - a[1]), arrow))
            mid = _s((a_m[0] + b_m[0]) / 2.0 + px * font, (a_m[1] + b_m[1]) / 2.0 + py * font)
            frags.append(_text(mid[0], mid[1], label, font))
    return frags


def radius_fragments(
    annotations: tuple[RadiusAnnotation, ...], extent: float
) -> list[str]:
    thin = 0.0025 * extent
    font = 0.035 * extent
    lead = 0.12 * extent
    frags: list[str] = []
    for ann in annotations:
        ax = ann.center.x + ann.radius * math.cos(ann.anchor_angle)
        ay = ann.center.y + ann.radius * math.sin(ann.anchor_angle)
        tx = ann.center.x + (ann.radius + lead) * math.cos(ann.anchor_angle)
        ty = ann.center.y + (ann.radius + lead) * math.sin(ann.anchor_angle)
        frags.append(_line(_s(ax, ay), _s(tx, ty), thin))
        sx, sy = _s(tx, ty)
        anchor = "start" if math.cos(ann.anchor_angle) >= 0.0 else "end"
        label = f"R{fmt(ann.value)} {ann.unit} [{ann.badge}]"
        frags.append(_text(sx, sy - 0.35 * font, label, font, anchor))
    return frags
