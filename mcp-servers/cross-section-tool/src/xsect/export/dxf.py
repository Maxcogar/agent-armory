"""DXF export (FR-19..FR-22, D9/D15): exact entities for Fusion 360 import.

* R2010 (AC1024) — verified against installed ezdxf 1.4.4 in the build
  session; header ``$INSUNITS = 4`` (millimetres), ``$LWDISPLAY = 1``.
* Per-component layers ``XSECT_<NAME>`` (sanitized), lineweight 0.35 mm;
  centerlines on ``XSECT_CENTER`` with the CENTER linetype, 0.13 mm.
* Lines -> LINE; arcs -> ARC with **ccw** start/end in degrees (the DXF ARC
  convention); model-cw arcs export with start/end swapped. Full circles ->
  CIRCLE.
* Filename is ``<slug>-<sha256(entity canon)[:12]>.dxf`` inside the export
  jail — content-addressed, so identical geometry writes identical names and
  the doc handle never leaks into output bytes (D15).

Determinism: exporting the same resolved section twice yields the identical
entity set (type, layer, coordinates through :func:`xsect.fmt.fmt`). Byte
identity of the whole file is NOT promised — ezdxf stamps creation/update
Julian dates in the header — the determinism tests compare canonical entity
dumps (recorded in the architecture's determinism note).
"""

from __future__ import annotations

import hashlib
import math
import re
from pathlib import Path

import ezdxf

from xsect.fmt import fmt
from xsect.model.errors import ExportError
from xsect.model.geometry import Arc, Edge, Line, is_full_circle
from xsect.section import ResolvedSection

_LAYER_RE = re.compile(r"[^A-Za-z0-9_-]+")
CENTER_LAYER = "XSECT_CENTER"


def _layer_name(component: str, used: set[str]) -> str:
    base = "XSECT_" + (_LAYER_RE.sub("_", component).strip("_").upper() or "COMPONENT")
    out, k = base[:60], 1
    while out in used:
        k += 1
        out = f"{base[:56]}_{k}"
    used.add(out)
    return out


def _arc_angles_deg(arc: Arc) -> tuple[float, float]:
    """DXF arcs run ccw from start to end; flip cw arcs."""
    sa, ea = (arc.start_angle, arc.end_angle) if arc.ccw else (arc.end_angle, arc.start_angle)
    return math.degrees(sa) % 360.0, math.degrees(ea) % 360.0


def _canon_entity(kind: str, layer: str, *coords: float) -> str:
    return kind + "|" + layer + "|" + ",".join(fmt(c) for c in coords)


def export_dxf(
    resolved: ResolvedSection, out_dir: Path, slug: str
) -> tuple[Path, list[str], int]:
    """Write the DXF; return (path, layer names, entity count)."""
    if not resolved.placement_ok:
        raise ExportError(
            "cannot export: the section is not placed "
            f"({resolved.constraint_state.status}). Fix the constraints first."
        )
    doc = ezdxf.new(  # type: ignore[attr-defined]  # runtime-verified export
        "R2010", setup=True)
    doc.header["$INSUNITS"] = 4  # millimetres
    doc.header["$LWDISPLAY"] = 1
    msp = doc.modelspace()

    used: set[str] = set()
    layers: list[str] = []
    canon: list[str] = []

    def add_edge(edge: Edge, layer: str) -> None:
        attribs = {"layer": layer}
        if isinstance(edge, Line):
            msp.add_line((edge.p0.x, edge.p0.y), (edge.p1.x, edge.p1.y), dxfattribs=attribs)
            canon.append(
                _canon_entity("LINE", layer, edge.p0.x, edge.p0.y, edge.p1.x, edge.p1.y)
            )
        elif is_full_circle(edge):
            msp.add_circle((edge.center.x, edge.center.y), edge.radius, dxfattribs=attribs)
            canon.append(
                _canon_entity("CIRCLE", layer, edge.center.x, edge.center.y, edge.radius)
            )
        else:
            sa, ea = _arc_angles_deg(edge)
            msp.add_arc(
                (edge.center.x, edge.center.y), edge.radius, sa, ea, dxfattribs=attribs
            )
            canon.append(
                _canon_entity(
                    "ARC", layer, edge.center.x, edge.center.y, edge.radius, sa, ea
                )
            )

    for comp in resolved.components:
        layer = _layer_name(comp.name, used)
        layers.append(layer)
        doc.layers.add(layer, lineweight=35)
        for loop in comp.loops:
            for edge in loop:
                add_edge(edge, layer)

    if resolved.centerlines:
        doc.layers.add(CENTER_LAYER, linetype="CENTER", lineweight=13)
        layers.append(CENTER_LAYER)
        for cl in resolved.centerlines:
            msp.add_line(
                (cl.p0.x, cl.p0.y), (cl.p1.x, cl.p1.y), dxfattribs={"layer": CENTER_LAYER}
            )
            canon.append(
                _canon_entity("LINE", CENTER_LAYER, cl.p0.x, cl.p0.y, cl.p1.x, cl.p1.y)
            )

    digest = hashlib.sha256("\n".join(canon).encode("utf-8")).hexdigest()[:12]
    out_dir.mkdir(parents=True, exist_ok=True)
    path = (out_dir / f"{slug}-{digest}.dxf").resolve()
    if out_dir.resolve() not in path.parents:
        raise ExportError("export path escaped the export directory (internal).")
    try:
        doc.saveas(path)
    except OSError as exc:
        raise ExportError(f"failed to write DXF at {path}: {exc}") from exc
    return path, layers, len(canon)
