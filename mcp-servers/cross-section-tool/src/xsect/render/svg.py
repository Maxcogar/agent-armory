"""SVG rendering (FR-14..FR-18, D9): exact arcs, layered groups, theming.

Coordinate mapping: model space is y-up mm; SVG is y-down, so every point maps
``(x, y) -> (x, -y)``. Under that flip a model-ccw arc renders with SVG
``sweep-flag 0`` and model-cw with ``1``. Arcs are ``A`` commands — never
polylines (FR-17); full circles split into two half arcs (the SVG ``A``
command cannot express a 360-degree sweep with coincident endpoints).

Layers: ``xs-hatch`` (bottom), ``xs-centerlines``, ``xs-outlines``,
``xs-annotations`` (top). Each component's region is a single path holding
all its loops as subpaths with ``fill-rule="evenodd"`` (annuli, holes,
disjoint regions). Colors are CSS variables with light fallbacks so the MCP
Apps host theme applies (D10).

Determinism: every float goes through :func:`xsect.fmt.fmt`; iteration is in
component/loop/edge order; no timestamps, ids derive from sanitized names.
"""

from __future__ import annotations

import math
import re
from xml.sax.saxutils import escape

from xsect.fmt import fmt
from xsect.model.geometry import Arc, Edge, Line, arc_point, is_full_circle
from xsect.render.annotate import linear_fragments, radius_fragments
from xsect.render.hatch import STROKE_COLOR, hatch_pattern
from xsect.section import ResolvedSection

_ID_RE = re.compile(r"[^A-Za-z0-9_-]+")


def _sanitize_id(name: str, used: set[str]) -> str:
    base = _ID_RE.sub("-", name).strip("-") or "component"
    out, k = base, 1
    while out in used:
        k += 1
        out = f"{base}-{k}"
    used.add(out)
    return out


def _pt(x: float, y: float) -> str:
    return f"{fmt(x)} {fmt(-y)}"


def _arc_cmd(arc: Arc, end_angle: float) -> str:
    end = arc_point(arc, end_angle)
    sweep = abs(end_angle - arc.start_angle)
    large = "1" if sweep > math.pi else "0"
    flag = "0" if arc.ccw else "1"
    return f"A {fmt(arc.radius)} {fmt(arc.radius)} 0 {large} {flag} {_pt(end.x, end.y)}"


def _edge_cmds(edge: Edge) -> str:
    if isinstance(edge, Line):
        return f"L {_pt(edge.p1.x, edge.p1.y)}"
    if is_full_circle(edge):
        mid = (edge.start_angle + edge.end_angle) / 2.0
        half = Arc(edge.center, edge.radius, edge.start_angle, mid, edge.ccw)
        rest = Arc(edge.center, edge.radius, mid, edge.end_angle, edge.ccw)
        return f"{_arc_cmd(half, mid)} {_arc_cmd(rest, edge.end_angle)}"
    return _arc_cmd(edge, edge.end_angle)


def _loop_path(loop: tuple[Edge, ...]) -> str:
    first = loop[0]
    start = first.p0 if isinstance(first, Line) else arc_point(first, first.start_angle)
    cmds = [f"M {_pt(start.x, start.y)}"]
    for edge in loop:
        cmds.append(_edge_cmds(edge))
    cmds.append("Z")
    return " ".join(cmds)


def render_svg(
    resolved: ResolvedSection, *, annotate: bool = True, hatch: bool = True
) -> str:
    if not resolved.placement_ok:
        raise ValueError(
            "render_svg called on an unplaced section (guard in the server)."
        )
    bbox = resolved.bbox
    extent = max(bbox[2] - bbox[0], bbox[3] - bbox[1], 1e-9)
    stroke_w = 0.005 * extent
    thin = stroke_w / 2.0
    has_linear = annotate and bool(resolved.linear_annotations)
    pad = (0.24 if has_linear else 0.08) * extent

    # SVG-space bbox after the y-flip: y in [-max_y, -min_y]
    vx = bbox[0] - pad
    vy = -bbox[3] - pad
    vw = (bbox[2] - bbox[0]) + 2.0 * pad
    vh = (bbox[3] - bbox[1]) + 2.0 * pad

    used_ids: set[str] = set()
    comp_ids = {c.name: _sanitize_id(c.name, used_ids) for c in resolved.components}

    defs: list[str] = []
    hatch_paths: list[str] = []
    outline_paths: list[str] = []
    for comp in resolved.components:
        cid = comp_ids[comp.name]
        d = " ".join(_loop_path(loop) for loop in comp.loops)
        if hatch:
            pid = f"hatch-{cid}"
            defs.append(hatch_pattern(pid, comp.hatch_angle, extent, thin))
            hatch_paths.append(
                f'<path id="fill-{cid}" d="{d}" fill="url(#{pid})" '
                f'fill-rule="evenodd" stroke="none"/>'
            )
        outline_paths.append(
            f'<path id="outline-{cid}" d="{d}" fill="none" '
            f'stroke="{STROKE_COLOR}" stroke-width="{fmt(stroke_w)}" '
            f'stroke-linejoin="round" stroke-linecap="round"/>'
        )

    dash = " ".join(
        fmt(f * extent) for f in (0.06, 0.01, 0.015, 0.01)
    )
    centerlines = [
        f'<line x1="{fmt(cl.p0.x)}" y1="{fmt(-cl.p0.y)}" x2="{fmt(cl.p1.x)}" '
        f'y2="{fmt(-cl.p1.y)}" stroke="{STROKE_COLOR}" '
        f'stroke-width="{fmt(thin)}" stroke-dasharray="{dash}"/>'
        for cl in resolved.centerlines
    ]

    ann_frags: list[str] = []
    if annotate:
        ann_frags.extend(linear_fragments(resolved.linear_annotations, bbox, extent))
        ann_frags.extend(radius_fragments(resolved.radius_annotations, extent))

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="{fmt(vx)} {fmt(vy)} {fmt(vw)} {fmt(vh)}" '
        f'role="img" aria-label="Cross-section: {escape(resolved.name)}">',
    ]
    if defs:
        parts.append("<defs>" + "".join(defs) + "</defs>")
    parts.append('<g id="xs-hatch">' + "".join(hatch_paths) + "</g>")
    parts.append('<g id="xs-centerlines">' + "".join(centerlines) + "</g>")
    parts.append('<g id="xs-outlines">' + "".join(outline_paths) + "</g>")
    parts.append('<g id="xs-annotations">' + "".join(ann_frags) + "</g>")
    parts.append("</svg>")
    return "".join(parts)
