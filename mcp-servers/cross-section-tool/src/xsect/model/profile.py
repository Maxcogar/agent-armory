"""Profile compiler: relative drawing ops -> exact edge loops (FR-6..FR-11).

Vocabulary (ops are JSON dicts; every *magnitude* is a string per FR-9):

* ``{"op": "start", "x"?, "y"?, }``          — begin a loop (omitted = origin)
* ``{"op": "line_to", "x", "y", "ref"?}``    — straight edge to a point
* ``{"op": "line", "length", "turn"?, "ref"?}`` — turn (rad, +ccw) then draw
* ``{"op": "arc_to", "x", "y", "radius", "dir", "size"?, "ref"?}``
* ``{"op": "arc", "radius", "sweep", "ref"?}`` — tangent arc; sweep rad, +ccw;
  ``abs(sweep) == tau`` draws a full circle
* ``{"op": "fillet", "vertex": int, "radius"}`` — line/line corners only
* ``{"op": "close"}``                        — close the current loop
* ``{"op": "half_section", "axis": "X"|"Y"}`` — mirror an open path (last op)
* ``{"op": "symmetry_axis", "axis": "X"|"Y"}`` — declare a centerline axis

FR-9 magnitude discipline: a magnitude is either a **bare dimension name** or
an **expression referencing at least one dimension**. JSON numbers and
zero-reference expressions are rejected with the fix stated. Expressions
auto-register derived dimensions named ``{profile}.op{i}.{arg}`` (regime
``"geometric composition"``); dotted names cannot appear inside expressions,
so auto dims are always DAG leaves (D7).

Definitional (non-magnitude) defaults: omitted ``start`` coordinates mean the
local origin; omitted ``turn`` means 0; omitted ``size`` means ``"minor"``.
These are identity elements of the composition, not silent magnitudes.

Multi-loop: after ``close()``, a new ``start`` begins another loop of the same
profile; the region is the even-odd fill across loops (annuli, disjoint
regions). ``half_section`` is restricted to single-loop profiles.
"""

from __future__ import annotations

import math
import re
from collections.abc import Mapping
from dataclasses import dataclass

from xsect.model.dimensions import DerivedProv, Dimension, Tier
from xsect.model.errors import GeometryError
from xsect.model.expressions import is_bare_name, parse
from xsect.model.geometry import (
    TWO_PI,
    Arc,
    Edge,
    Line,
    Point,
    close_tolerance,
    edge_end,
    edge_start,
    make_arc,
    mirror_edge,
    reverse_edge,
    validate_loop_closed,
)

_PROFILE_NAME_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

MAX_PROFILE_SEGMENTS = 4096

#: op -> ((arg, unit, required), ...); units label the auto dims (mm / rad).
_OP_MAGS: dict[str, tuple[tuple[str, str, bool], ...]] = {
    "start": (("x", "mm", False), ("y", "mm", False)),
    "line_to": (("x", "mm", True), ("y", "mm", True)),
    "line": (("length", "mm", True), ("turn", "rad", False)),
    "arc_to": (("x", "mm", True), ("y", "mm", True), ("radius", "mm", True)),
    "arc": (("radius", "mm", True), ("sweep", "rad", True)),
    "fillet": (("radius", "mm", True),),
}

_OP_EXTRA_KEYS: dict[str, frozenset[str]] = {
    "start": frozenset(),
    "line_to": frozenset({"ref"}),
    "line": frozenset({"ref"}),
    "arc_to": frozenset({"ref", "dir", "size"}),
    "arc": frozenset({"ref"}),
    "fillet": frozenset({"vertex"}),
    "close": frozenset(),
    "half_section": frozenset({"axis"}),
    "symmetry_axis": frozenset({"axis"}),
}

_EDGE_OPS = frozenset({"line_to", "line", "arc_to", "arc"})


@dataclass(frozen=True)
class CompiledProfile:
    """A compiled profile in local coordinates."""

    name: str
    loops: tuple[tuple[Edge, ...], ...]
    refs: dict[str, Point]
    #: (dimension name, global edge index) for arcs whose radius was a bare
    #: named dimension — the deterministic radius-callout set (D9).
    named_radius_arcs: tuple[tuple[str, int], ...]
    axes: tuple[str, ...]
    used_dims: frozenset[str]
    edge_count: int

    def edge(self, global_index: int) -> Edge:
        k = global_index
        for loop in self.loops:
            if k < len(loop):
                return loop[k]
            k -= len(loop)
        raise GeometryError(f"profile {self.name!r} has no edge {global_index}.")


def auto_dim_name(profile: str, op_index: int, arg: str) -> str:
    return f"{profile}.op{op_index}.{arg}"


def _check_op_shape(profile: str, i: int, op: object) -> dict[str, object]:
    if not isinstance(op, dict):
        raise GeometryError(
            f"profile {profile!r} op {i}: expected an object, got "
            f"{type(op).__name__}."
        )
    kind = op.get("op")
    if kind not in _OP_EXTRA_KEYS:
        raise GeometryError(
            f"profile {profile!r} op {i}: unknown op {kind!r}. Valid ops: "
            f"{', '.join(sorted(_OP_EXTRA_KEYS))}."
        )
    allowed = (
        {"op"} | {a for a, _u, _r in _OP_MAGS.get(kind, ())} | set(_OP_EXTRA_KEYS[kind])
    )
    extra = set(op) - allowed
    if extra:
        raise GeometryError(
            f"profile {profile!r} op {i} ({kind}): unknown keys "
            f"{sorted(extra)}. Allowed keys: {sorted(allowed)}."
        )
    for arg, _unit, required in _OP_MAGS.get(kind, ()):
        if required and arg not in op:
            raise GeometryError(
                f"profile {profile!r} op {i} ({kind}): missing required "
                f"magnitude {arg!r}."
            )
    return op


def _magnitude_key(
    profile: str, i: int, arg: str, source: object, dims: Mapping[str, Dimension]
) -> tuple[str, str, frozenset[str]]:
    """Classify a magnitude: ('name', dim_name, {name}) or ('auto', key, refs).

    Enforces FR-9: numbers and zero-reference expressions are rejected.
    """
    if isinstance(source, bool) or isinstance(source, (int, float)):
        raise GeometryError(
            f"profile {profile!r} op {i}: magnitude {arg!r} is a literal number "
            f"({source!r}). FR-9 forbids literal magnitudes — pass a dimension "
            "name or an expression over dimensions (define one with "
            "xsect_define_dimensions if needed)."
        )
    if not isinstance(source, str):
        raise GeometryError(
            f"profile {profile!r} op {i}: magnitude {arg!r} must be a string "
            f"(dimension name or expression), got {type(source).__name__}."
        )
    if is_bare_name(source):
        name = source.strip()
        if name not in dims:
            raise GeometryError(
                f"profile {profile!r} op {i}: magnitude {arg!r} references "
                f"undefined dimension {name!r}. Define it first."
            )
        return ("name", name, frozenset({name}))
    expr = parse(source)  # ExpressionError propagates with the construct named
    if not expr.names:
        raise GeometryError(
            f"profile {profile!r} op {i}: magnitude {arg!r} expression "
            f"{source!r} references no dimension. FR-9 requires every magnitude "
            "to trace to named dimensions — define one (e.g. a derived "
            "dimension with this relation) and reference it."
        )
    missing = sorted(n for n in expr.names if n not in dims)
    if missing:
        raise GeometryError(
            f"profile {profile!r} op {i}: magnitude {arg!r} references "
            f"undefined dimension(s) {missing}. Define them first."
        )
    return ("auto", auto_dim_name(profile, i, arg), expr.names)


def extract_auto_dims(
    profile: str, ops: list[dict[str, object]], dims: Mapping[str, Dimension]
) -> dict[str, Dimension]:
    """First pass: validate op shapes/magnitudes; return auto dims to register."""
    if not _PROFILE_NAME_RE.match(profile):
        raise GeometryError(
            f"profile name {profile!r} must match [A-Za-z_][A-Za-z0-9_]* — it "
            "becomes the prefix of auto-registered geometry dimensions "
            "(e.g. '<profile>.op3.radius'), which live in the expression "
            "namespace where '-' means subtraction."
        )
    out: dict[str, Dimension] = {}
    for i, raw in enumerate(ops):
        op = _check_op_shape(profile, i, raw)
        kind = str(op["op"])
        for arg, unit, _required in _OP_MAGS.get(kind, ()):
            if arg not in op:
                continue
            klass, key, refs = _magnitude_key(profile, i, arg, op[arg], dims)
            if klass == "auto":
                out[key] = Dimension(
                    name=key,
                    unit=unit,
                    value=0.0,
                    tier=Tier.DERIVED,
                    provenance=DerivedProv(
                        relation_expr=str(op[arg]),
                        inputs=tuple(sorted(refs)),
                        regime="geometric composition",
                    ),
                )
    return out


# ---------------------------------------------------------------------------
# geometry helpers


def _unit(dx: float, dy: float, what: str) -> tuple[float, float]:
    n = math.hypot(dx, dy)
    if n <= 1e-12:
        raise GeometryError(f"{what}: zero-length direction.")
    return dx / n, dy / n


def _fillet_line_line(
    incoming: Line, outgoing: Line, radius: float, where: str
) -> tuple[float, Arc]:
    """Return (trim length t, tangent arc) for a line/line corner."""
    ux, uy = _unit(incoming.p1.x - incoming.p0.x, incoming.p1.y - incoming.p0.y, where)
    wx, wy = _unit(outgoing.p1.x - outgoing.p0.x, outgoing.p1.y - outgoing.p0.y, where)
    cross = ux * wy - uy * wx
    dot = ux * wx + uy * wy
    if abs(cross) < 1e-9:
        raise GeometryError(
            f"{where}: edges are collinear — there is no corner to fillet."
        )
    # interior angle between (-u) and w
    phi = math.acos(max(-1.0, min(1.0, -dot)))
    if phi < 1e-6:
        raise GeometryError(f"{where}: corner angle is degenerate (near zero).")
    t = radius / math.tan(phi / 2.0)
    c_dist = radius / math.sin(phi / 2.0)
    p = incoming.p1
    bx, by = _unit(-ux + wx, -uy + wy, where)
    center = Point(p.x + c_dist * bx, p.y + c_dist * by)
    p1 = Point(p.x - t * ux, p.y - t * uy)
    p2 = Point(p.x + t * wx, p.y + t * wy)
    sa = math.atan2(p1.y - center.y, p1.x - center.x)
    ea = math.atan2(p2.y - center.y, p2.x - center.x)
    return t, make_arc(center, radius, sa, ea, ccw=cross > 0.0)


def _apply_fillets(
    edges: list[Edge],
    fillets: list[tuple[int, float, int]],  # (vertex, radius, op index)
    *,
    closed: bool,
    profile: str,
) -> tuple[list[Edge], dict[int, int]]:
    """Apply all fillets against ORIGINAL vertex indexing; rebuild once.

    Returns the new edge list and an old-index -> new-index map for refs.
    Vertex ``v`` is the junction between edge ``v-1`` and edge ``v``; on a
    closed loop vertex 0 is the wrap junction. On an open path (half-section)
    only interior vertices ``1..len-1`` are valid.
    """
    n = len(edges)
    if not fillets:
        return edges, {i: i for i in range(n)}

    by_vertex: dict[int, tuple[float, Arc]] = {}
    trims: dict[int, list[float]] = {i: [0.0, 0.0] for i in range(n)}  # [start, end]
    for vertex, radius, op_i in fillets:
        where = f"profile {profile!r} op {op_i} (fillet at vertex {vertex})"
        lo, hi = (0, n - 1) if closed else (1, n - 1)
        if not (lo <= vertex <= hi):
            raise GeometryError(
                f"{where}: vertex out of range. Valid vertices for this "
                f"{'closed loop' if closed else 'open path'}: {lo}..{hi}."
            )
        if vertex in by_vertex:
            raise GeometryError(f"{where}: vertex already filleted.")
        e_in = edges[(vertex - 1) % n]
        e_out = edges[vertex % n]
        if not isinstance(e_in, Line) or not isinstance(e_out, Line):
            raise GeometryError(
                f"{where}: only line/line corners can be filleted in v1. "
                "Model tangent arcs to curved edges explicitly with arc/arc_to."
            )
        if not (radius > 0.0):
            raise GeometryError(f"{where}: fillet radius must be positive.")
        t, arc = _fillet_line_line(e_in, e_out, radius, where)
        by_vertex[vertex] = (t, arc)
        trims[(vertex - 1) % n][1] += t
        trims[vertex % n][0] += t

    for i, (t0, t1) in trims.items():
        edge = edges[i]
        if isinstance(edge, Line) and (t0 > 0.0 or t1 > 0.0):
            length = math.hypot(edge.p1.x - edge.p0.x, edge.p1.y - edge.p0.y)
            if t0 + t1 >= length - 1e-9:
                raise GeometryError(
                    f"profile {profile!r}: fillet trims ({t0:g} + {t1:g}) consume "
                    f"edge {i} (length {length:g}). Reduce the fillet radii."
                )

    new_edges: list[Edge] = []
    index_map: dict[int, int] = {}
    for i, edge in enumerate(edges):
        t0, t1 = trims[i]
        if isinstance(edge, Line) and (t0 > 0.0 or t1 > 0.0):
            dx, dy = _unit(edge.p1.x - edge.p0.x, edge.p1.y - edge.p0.y, "trim")
            edge = Line(
                Point(edge.p0.x + t0 * dx, edge.p0.y + t0 * dy),
                Point(edge.p1.x - t1 * dx, edge.p1.y - t1 * dy),
            )
        index_map[i] = len(new_edges)
        new_edges.append(edge)
        nxt_vertex = i + 1 if not closed else (i + 1) % n
        if nxt_vertex in by_vertex:
            new_edges.append(by_vertex[nxt_vertex][1])
    return new_edges, index_map


# ---------------------------------------------------------------------------
# the compiler


def compile_profile(
    name: str,
    ops: list[dict[str, object]],
    dims: Mapping[str, Dimension],
    values: Mapping[str, float],
) -> CompiledProfile:
    """Compile ops into exact loops using evaluated dimension ``values``.

    ``values`` must contain every caller dimension and every auto dim from
    :func:`extract_auto_dims` (the section layer guarantees this by running
    the derivation pass first).
    """

    def mag(i: int, arg: str, op: dict[str, object]) -> float:
        _klass, key, _refs = _magnitude_key(name, i, arg, op[arg], dims)
        return values[key]

    loops: list[tuple[Edge, ...]] = []
    refs: dict[str, Point] = {"origin": Point(0.0, 0.0)}
    axes: list[str] = []
    used: set[str] = set()
    named_radius: list[tuple[str, int, int]] = []  # (dim, loop#, local edge)
    alias_edges: list[tuple[str, int, int]] = []  # (alias, loop#, local edge)
    aliases_seen: set[str] = set()

    open_edges: list[Edge] = []
    open_started = False
    pending_fillets: list[tuple[int, float, int]] = []
    pos = Point(0.0, 0.0)
    heading = 0.0
    half_sectioned = False

    def note_used(i: int, arg: str, op: dict[str, object]) -> None:
        _klass, key, refnames = _magnitude_key(name, i, arg, op[arg], dims)
        used.add(key)
        used.update(refnames)

    def take_alias(i: int, op: dict[str, object], local_edge: int) -> None:
        alias = op.get("ref")
        if alias is None:
            return
        if not isinstance(alias, str) or not is_bare_name(alias) or alias == "origin":
            raise GeometryError(
                f"profile {name!r} op {i}: ref {alias!r} must be a plain "
                "identifier (and not 'origin')."
            )
        if alias.startswith("edge") or alias.startswith("axis"):
            raise GeometryError(
                f"profile {name!r} op {i}: ref {alias!r} collides with the "
                "automatic edge/axis namespaces."
            )
        if alias in aliases_seen:
            raise GeometryError(f"profile {name!r} op {i}: ref {alias!r} reused.")
        aliases_seen.add(alias)
        alias_edges.append((alias, len(loops), local_edge))

    def finalize_loop(closed_edges: list[Edge], index_map: dict[int, int]) -> None:
        loop = tuple(closed_edges)
        validate_loop_closed(loop, f"profile {name!r} loop {len(loops)}")
        if all(isinstance(e, Line) for e in loop) and len(loop) < 3:
            raise GeometryError(
                f"profile {name!r} loop {len(loops)}: a straight-edged loop "
                "needs at least 3 edges to bound an area."
            )
        # remap this loop's aliases / radius records through the fillet pass
        for lst in (alias_edges, named_radius):
            for j, (label, loop_i, local) in enumerate(lst):
                if loop_i == len(loops):
                    lst[j] = (label, loop_i, index_map[local])
        loops.append(loop)

    for i, raw in enumerate(ops):
        op = _check_op_shape(name, i, raw)
        kind = str(op["op"])
        if half_sectioned:
            raise GeometryError(
                f"profile {name!r} op {i}: half_section must be the last op."
            )
        for arg, _unit_label, _req in _OP_MAGS.get(kind, ()):
            if arg in op:
                note_used(i, arg, op)

        if kind == "symmetry_axis":
            axis = op.get("axis")
            if axis not in ("X", "Y"):
                raise GeometryError(
                    f"profile {name!r} op {i}: axis must be 'X' or 'Y'."
                )
            if axis not in axes:
                axes.append(str(axis))
            continue

        if kind == "start":
            if open_started and open_edges:
                raise GeometryError(
                    f"profile {name!r} op {i}: close() the current loop before "
                    "starting another."
                )
            x = mag(i, "x", op) if "x" in op else 0.0
            y = mag(i, "y", op) if "y" in op else 0.0
            pos = Point(x, y)
            heading = 0.0
            open_started = True
            open_edges = []
            pending_fillets = []
            continue

        if kind in _EDGE_OPS or kind in ("fillet", "close", "half_section"):
            if not open_started:
                raise GeometryError(
                    f"profile {name!r} op {i} ({kind}): no open loop — begin "
                    "with a start op."
                )

        if kind == "line_to":
            target = Point(mag(i, "x", op), mag(i, "y", op))
            d = math.hypot(target.x - pos.x, target.y - pos.y)
            if d <= 1e-12:
                raise GeometryError(
                    f"profile {name!r} op {i}: line_to target coincides with "
                    "the current point (zero-length edge)."
                )
            take_alias(i, op, len(open_edges))
            open_edges.append(Line(pos, target))
            heading = math.atan2(target.y - pos.y, target.x - pos.x)
            pos = target

        elif kind == "line":
            length = mag(i, "length", op)
            if not (length > 0.0):
                raise GeometryError(
                    f"profile {name!r} op {i}: line length must be positive, "
                    f"got {length:g}."
                )
            turn = mag(i, "turn", op) if "turn" in op else 0.0
            heading += turn
            target = Point(
                pos.x + length * math.cos(heading),
                pos.y + length * math.sin(heading),
            )
            take_alias(i, op, len(open_edges))
            open_edges.append(Line(pos, target))
            pos = target

        elif kind == "arc":
            radius = mag(i, "radius", op)
            sweep = mag(i, "sweep", op)
            if sweep == 0.0:
                raise GeometryError(
                    f"profile {name!r} op {i}: arc sweep must be nonzero "
                    "(radians; positive = ccw)."
                )
            if abs(sweep) > TWO_PI + 1e-12:
                raise GeometryError(
                    f"profile {name!r} op {i}: arc sweep {sweep:g} exceeds a "
                    "full circle (tau)."
                )
            ccw = sweep > 0.0
            side = heading + (math.pi / 2.0 if ccw else -math.pi / 2.0)
            center = Point(
                pos.x + radius * math.cos(side), pos.y + radius * math.sin(side)
            )
            sa = math.atan2(pos.y - center.y, pos.x - center.x)
            ea = sa + sweep
            arc = make_arc(center, radius, sa, ea, ccw=ccw)
            if isinstance(op.get("radius"), str) and is_bare_name(str(op["radius"])):
                named_radius.append((str(op["radius"]).strip(), len(loops), len(open_edges)))
            take_alias(i, op, len(open_edges))
            open_edges.append(arc)
            heading += sweep
            pos = edge_end(arc)

        elif kind == "arc_to":
            target = Point(mag(i, "x", op), mag(i, "y", op))
            radius = mag(i, "radius", op)
            direction = op.get("dir")
            if direction not in ("cw", "ccw"):
                raise GeometryError(
                    f"profile {name!r} op {i}: arc_to requires dir 'cw' or 'ccw'."
                )
            size = op.get("size", "minor")
            if size not in ("minor", "major"):
                raise GeometryError(
                    f"profile {name!r} op {i}: size must be 'minor' or 'major'."
                )
            chord = math.hypot(target.x - pos.x, target.y - pos.y)
            if chord <= 1e-12:
                raise GeometryError(
                    f"profile {name!r} op {i}: arc_to target coincides with the "
                    "current point. Use arc with sweep tau for full circles."
                )
            h = chord / 2.0
            if h > radius * (1.0 + 1e-9):
                raise GeometryError(
                    f"profile {name!r} op {i}: radius {radius:g} is too small "
                    f"for the chord (needs >= {h:g})."
                )
            d = math.sqrt(max(radius * radius - h * h, 0.0))
            mx, my = (pos.x + target.x) / 2.0, (pos.y + target.y) / 2.0
            cx_dir, cy_dir = _unit(target.x - pos.x, target.y - pos.y, "arc_to")
            lx, ly = -cy_dir, cx_dir  # left of the chord
            ccw = direction == "ccw"
            # center side: ccw+minor -> left, ccw+major -> right, cw+minor ->
            # right, cw+major -> left (derived + verified in the build session)
            left_side = (ccw and size == "minor") or (not ccw and size == "major")
            sign = 1.0 if left_side else -1.0
            center = Point(mx + sign * d * lx, my + sign * d * ly)
            sa = math.atan2(pos.y - center.y, pos.x - center.x)
            ea = math.atan2(target.y - center.y, target.x - center.x)
            arc = make_arc(center, radius, sa, ea, ccw=ccw)
            if isinstance(op.get("radius"), str) and is_bare_name(str(op["radius"])):
                named_radius.append((str(op["radius"]).strip(), len(loops), len(open_edges)))
            take_alias(i, op, len(open_edges))
            open_edges.append(arc)
            heading = arc.end_angle + (math.pi / 2.0 if ccw else -math.pi / 2.0)
            pos = target

        elif kind == "fillet":
            vertex = op.get("vertex")
            if not isinstance(vertex, int) or isinstance(vertex, bool):
                raise GeometryError(
                    f"profile {name!r} op {i}: fillet vertex must be an integer "
                    "index (vertex v joins edge v-1 and edge v)."
                )
            pending_fillets.append((vertex, mag(i, "radius", op), i))

        elif kind == "close":
            if not open_edges:
                raise GeometryError(
                    f"profile {name!r} op {i}: close() on an empty loop."
                )
            start_pt = edge_start(open_edges[0])
            tol = close_tolerance(tuple(open_edges))
            gap = math.hypot(start_pt.x - pos.x, start_pt.y - pos.y)
            if gap > tol:
                open_edges.append(Line(pos, start_pt))
            new_edges, index_map = _apply_fillets(
                open_edges, pending_fillets, closed=True, profile=name
            )
            finalize_loop(new_edges, index_map)
            open_started = False
            open_edges = []
            pending_fillets = []

        elif kind == "half_section":
            axis = op.get("axis")
            if axis not in ("X", "Y"):
                raise GeometryError(
                    f"profile {name!r} op {i}: half_section axis must be 'X' or 'Y'."
                )
            if loops:
                raise GeometryError(
                    f"profile {name!r} op {i}: half_section is restricted to "
                    "single-loop profiles in v1. Model multi-loop sections with "
                    "explicit full loops."
                )
            if not open_edges:
                raise GeometryError(
                    f"profile {name!r} op {i}: half_section on an empty path."
                )
            tol = close_tolerance(tuple(open_edges))
            axis_str = str(axis)

            def off_axis(p: Point, ax: str = axis_str) -> float:
                return abs(p.y) if ax == "X" else abs(p.x)

            def snap(p: Point, ax: str = axis_str) -> Point:
                return Point(p.x, 0.0) if ax == "X" else Point(0.0, p.y)

            first, last = open_edges[0], open_edges[-1]
            s, e = edge_start(first), edge_end(last)
            for label, pt in (("start", s), ("end", e)):
                if off_axis(pt) > tol:
                    raise GeometryError(
                        f"profile {name!r} op {i}: half_section {label} point "
                        f"({pt.x:g}, {pt.y:g}) is off the {axis_str} axis by "
                        f"{off_axis(pt):.3e} (tolerance {tol:.3e}). Half-section "
                        "paths must begin and end on the declared axis."
                    )
            # snap endpoints exactly onto the axis so the mirrored loop closes
            if isinstance(first, Line):
                open_edges[0] = Line(snap(first.p0), first.p1)
            if isinstance(last, Line):
                open_edges[-1] = Line(last.p0, snap(last.p1))
            new_edges, index_map = _apply_fillets(
                open_edges, pending_fillets, closed=False, profile=name
            )
            mirrored = [
                reverse_edge(mirror_edge(e2, axis_str)) for e2 in reversed(new_edges)
            ]
            finalize_loop(list(new_edges) + mirrored, index_map)
            if axis_str not in axes:
                axes.append(axis_str)
            open_started = False
            open_edges = []
            pending_fillets = []
            half_sectioned = True

    if open_started and open_edges:
        raise GeometryError(
            f"profile {name!r}: the final loop was left open. Finish with "
            "close() or half_section."
        )
    if not loops:
        raise GeometryError(f"profile {name!r} produced no loops.")

    edge_count = sum(len(lp) for lp in loops)
    if edge_count > MAX_PROFILE_SEGMENTS:
        raise GeometryError(
            f"profile {name!r} has {edge_count} segments; the cap is "
            f"{MAX_PROFILE_SEGMENTS} (T3)."
        )

    # ---- build the ref table on FINAL indices -----------------------------
    loop_bases: list[int] = []
    base = 0
    for lp in loops:
        loop_bases.append(base)
        base += len(lp)

    def point_refs(prefix: str, edge: Edge) -> dict[str, Point]:
        out = {f"{prefix}.start": edge_start(edge), f"{prefix}.end": edge_end(edge)}
        if isinstance(edge, Arc):
            out[f"{prefix}.center"] = edge.center
        return out

    k = 0
    for lp in loops:
        for edge in lp:
            refs.update(point_refs(f"edge{k}", edge))
            k += 1
    for alias, loop_i, local in alias_edges:
        refs.update(point_refs(alias, loops[loop_i][local]))

    radius_arcs = tuple(
        (dim, loop_bases[loop_i] + local)
        for dim, loop_i, local in named_radius
        if isinstance(loops[loop_i][local], Arc)
    )
    return CompiledProfile(
        name=name,
        loops=tuple(loops),
        refs=refs,
        named_radius_arcs=radius_arcs,
        axes=tuple(axes),
        used_dims=frozenset(used),
        edge_count=edge_count,
    )
