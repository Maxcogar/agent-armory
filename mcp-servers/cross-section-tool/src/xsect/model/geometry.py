"""Exact 2D geometry primitives (FR-7, FR-17).

Arcs are arcs: no polyline type exists anywhere in this module or downstream
of it. Invariant on :class:`Arc`: for ``ccw`` arcs ``end_angle > start_angle``
with sweep in ``(0, 2*pi]``; for ``cw`` arcs ``end_angle < start_angle``
likewise. Constructors normalize into that invariant, so sweep is always
``abs(end_angle - start_angle)``.

All angles are radians. All coordinates are floats in millimetres (the
canonical internal unit per the architecture's recorded units assumption).
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from xsect.model.errors import GeometryError

#: Closure tolerance factor (architecture: CLOSE_TOL = 1e-9 * max_extent).
CLOSE_TOL_FACTOR = 1e-9
TWO_PI = 2.0 * math.pi


@dataclass(frozen=True)
class Point:
    x: float
    y: float


@dataclass(frozen=True)
class Line:
    p0: Point
    p1: Point


@dataclass(frozen=True)
class Arc:
    center: Point
    radius: float
    start_angle: float
    end_angle: float
    ccw: bool


Edge = Line | Arc


def make_arc(center: Point, radius: float, start_angle: float, end_angle: float, ccw: bool) -> Arc:
    """Construct an arc, normalizing angles into the sweep invariant.

    ``start_angle == end_angle`` (mod 2*pi) means a full circle.
    """
    if not (radius > 0.0) or not math.isfinite(radius):
        raise GeometryError(f"arc radius must be a positive finite value, got {radius!r}.")
    sa, ea = float(start_angle), float(end_angle)
    if ccw:
        while ea <= sa + 1e-15:
            ea += TWO_PI
        if ea - sa > TWO_PI + 1e-12:
            raise GeometryError("arc sweep exceeds a full circle.")
        ea = min(ea, sa + TWO_PI)
    else:
        while ea >= sa - 1e-15:
            ea -= TWO_PI
        if sa - ea > TWO_PI + 1e-12:
            raise GeometryError("arc sweep exceeds a full circle.")
        ea = max(ea, sa - TWO_PI)
    return Arc(center=center, radius=radius, start_angle=sa, end_angle=ea, ccw=ccw)


def arc_sweep(arc: Arc) -> float:
    return abs(arc.end_angle - arc.start_angle)


def is_full_circle(arc: Arc) -> bool:
    return abs(arc_sweep(arc) - TWO_PI) <= 1e-12


def arc_point(arc: Arc, angle: float) -> Point:
    return Point(
        arc.center.x + arc.radius * math.cos(angle),
        arc.center.y + arc.radius * math.sin(angle),
    )


def edge_start(edge: Edge) -> Point:
    if isinstance(edge, Line):
        return edge.p0
    return arc_point(edge, edge.start_angle)


def edge_end(edge: Edge) -> Point:
    if isinstance(edge, Line):
        return edge.p1
    return arc_point(edge, edge.end_angle)


def reverse_edge(edge: Edge) -> Edge:
    if isinstance(edge, Line):
        return Line(edge.p1, edge.p0)
    return Arc(
        center=edge.center,
        radius=edge.radius,
        start_angle=edge.end_angle,
        end_angle=edge.start_angle,
        ccw=not edge.ccw,
    )


@dataclass(frozen=True)
class Transform:
    """Rigid transform: rotate by ``theta`` about the origin, then translate."""

    tx: float
    ty: float
    theta: float

    def apply_point(self, p: Point) -> Point:
        c, s = math.cos(self.theta), math.sin(self.theta)
        return Point(self.tx + c * p.x - s * p.y, self.ty + s * p.x + c * p.y)

    def apply_edge(self, edge: Edge) -> Edge:
        if isinstance(edge, Line):
            return Line(self.apply_point(edge.p0), self.apply_point(edge.p1))
        return Arc(
            center=self.apply_point(edge.center),
            radius=edge.radius,
            start_angle=edge.start_angle + self.theta,
            end_angle=edge.end_angle + self.theta,
            ccw=edge.ccw,
        )


IDENTITY = Transform(0.0, 0.0, 0.0)


def mirror_point(p: Point, axis: str) -> Point:
    """Mirror about the local X axis (y -> -y) or Y axis (x -> -x)."""
    if axis == "X":
        return Point(p.x, -p.y)
    if axis == "Y":
        return Point(-p.x, p.y)
    raise GeometryError(f"mirror axis must be 'X' or 'Y', got {axis!r}.")


def mirror_edge(edge: Edge, axis: str) -> Edge:
    """Mirror an edge about a local axis; arc handedness flips (FR-17)."""
    if isinstance(edge, Line):
        return Line(mirror_point(edge.p0, axis), mirror_point(edge.p1, axis))
    center = mirror_point(edge.center, axis)
    if axis == "X":
        sa, ea = -edge.start_angle, -edge.end_angle
    else:
        sa, ea = math.pi - edge.start_angle, math.pi - edge.end_angle
    return Arc(center=center, radius=edge.radius, start_angle=sa, end_angle=ea, ccw=not edge.ccw)


def _dist(a: Point, b: Point) -> float:
    return math.hypot(a.x - b.x, a.y - b.y)


def edge_bbox(edge: Edge) -> tuple[float, float, float, float]:
    """(min_x, min_y, max_x, max_y), including arc axis-crossing extremes."""
    s, e = edge_start(edge), edge_end(edge)
    xs, ys = [s.x, e.x], [s.y, e.y]
    if isinstance(edge, Arc):
        lo, hi = sorted((edge.start_angle, edge.end_angle))
        k = math.ceil(lo / (math.pi / 2.0))
        ang = k * (math.pi / 2.0)
        while ang <= hi + 1e-15:
            p = arc_point(edge, ang)
            xs.append(p.x)
            ys.append(p.y)
            ang += math.pi / 2.0
    return min(xs), min(ys), max(xs), max(ys)


def loop_bbox(edges: tuple[Edge, ...]) -> tuple[float, float, float, float]:
    boxes = [edge_bbox(e) for e in edges]
    return (
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    )


def bbox_extent(bbox: tuple[float, float, float, float]) -> float:
    return max(bbox[2] - bbox[0], bbox[3] - bbox[1])


def close_tolerance(edges: tuple[Edge, ...]) -> float:
    extent = bbox_extent(loop_bbox(edges))
    return CLOSE_TOL_FACTOR * max(extent, 1.0)


def validate_loop_closed(edges: tuple[Edge, ...], where: str) -> None:
    """Assert that consecutive endpoints chain and the loop closes (FR-6)."""
    if not edges:
        raise GeometryError(f"{where}: loop has no edges.")
    tol = close_tolerance(edges)
    for i, edge in enumerate(edges):
        nxt = edges[(i + 1) % len(edges)]
        gap = _dist(edge_end(edge), edge_start(nxt))
        if gap > tol:
            raise GeometryError(
                f"{where}: loop is not closed — gap of {gap:.3e} between edge "
                f"{i} end and edge {(i + 1) % len(edges)} start exceeds the "
                f"closure tolerance {tol:.3e}. Chain ops so endpoints coincide, "
                "or finish the loop with close()."
            )
