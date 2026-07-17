"""FastMCP server for the Cross-Section Tool (D3, D13, D16).

Verified against installed fastmcp 3.4.3 in the build session:
``fastmcp.apps.AppConfig(resource_uri=...)`` (snake_case; the pydantic
alias ``resourceUri`` is also accepted), ``@mcp.tool(app=...)``,
``ToolResult(content=, structured_content=, meta=)``,
``@mcp.resource(uri, mime_type=UI_MIME_TYPE)`` with
``UI_MIME_TYPE == "text/html;profile=mcp-app"``, and
``mcp.run(transport="http", host=, port=)``.

Environment: ``XSECT_HOST`` (default 127.0.0.1 — bind loopback and publish
via Tailscale Serve per the deployment doc), ``XSECT_PORT`` (default 8765),
``XSECT_DATA_DIR`` (default ``~/.xsect``).

Payload budget (D16): structured render content over 1 MiB carries a warning
in the summary; over 4 MiB the tool refuses with a typed error instead of
degrading the host.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastmcp import FastMCP
from fastmcp.apps import UI_MIME_TYPE, AppConfig
from fastmcp.exceptions import ToolError
from fastmcp.tools.tool import ToolResult

from xsect.export.dxf import export_dxf
from xsect.fmt import fmt
from xsect.model.errors import ExportError, XsectError
from xsect.render.svg import render_svg
from xsect.store.documents import DocumentStore

PAYLOAD_WARN_BYTES = 1 * 1024 * 1024
PAYLOAD_REFUSE_BYTES = 4 * 1024 * 1024

UI_URI = "ui://xsect/view.html"
_VIEW_HTML = (Path(__file__).parent / "ui" / "view.html").read_text(encoding="utf-8")

mcp: FastMCP = FastMCP(
    "xsect",
    instructions=(
        "Cross-Section Tool: dimension-driven 2D cross sections with tiered "
        "provenance (measured > derived > recalled > assumed), constraint-"
        "based composition, SVG rendering, and DXF export for Fusion 360. "
        "Workflow: xsect_create_document -> xsect_define_dimensions -> "
        "xsect_add_profile -> xsect_compose -> xsect_render / "
        "xsect_export_dxf. Every geometry magnitude must be a dimension name "
        "or an expression over dimensions (never a number); lengths are mm, "
        "angles radians (use deg(45) in expressions for degrees)."
    ),
)

_store: DocumentStore | None = None


def get_store() -> DocumentStore:
    global _store
    if _store is None:
        data_dir = Path(os.environ.get("XSECT_DATA_DIR", Path.home() / ".xsect"))
        _store = DocumentStore(data_dir)
    return _store


def _fail(exc: XsectError) -> ToolError:
    return ToolError(f"{type(exc).__name__}: {exc}")


@mcp.tool
async def xsect_create_document(name: str, units: str = "mm") -> dict[str, Any]:
    """Create a cross-section document and return its doc_id.

    Args:
        name: Human-readable document name (e.g. "GT3582R oil pump housing").
        units: Only "mm" in v1 — internal math is millimetres and radians.
            Label angle dimensions "rad" or "deg" and convert with deg(x) in
            expressions.

    Returns: {"doc_id", "name", "units"}.
    Errors: StoreError for unsupported units or an empty name.
    """
    try:
        record = get_store().create(name, units)
    except XsectError as exc:
        raise _fail(exc) from exc
    return {"doc_id": record.doc_id, "name": name, "units": units}


@mcp.tool
async def xsect_define_dimensions(
    doc_id: str, dimensions: list[dict[str, Any]]
) -> dict[str, Any]:
    """Define named dimensions with tier + provenance (FR-1/FR-2).

    Each dimension object:
      {"name", "unit",                       # mm | rad | deg (labels)
       "tier": "measured"|"derived"|"recalled"|"assumed",
       "value": <number>,                    # forbidden for derived
       "source": "...",                      # required for measured/recalled
       "basis": "...",                       # optional for assumed
       "relation": "od/2 - wall_t",          # required for derived
       "regime": "thin-wall, od >> wall_t"}  # required for derived

    Derived values are computed from the relation in dependency order and can
    never be set directly (FR-3). Relations use the restricted grammar:
    + - * / ** %, sin cos tan asin acos atan atan2 sqrt abs min max floor
    ceil deg rad, constants pi/tau; deg(90) means 90 degrees in radians.

    Returns: {"defined": [...], "values": {name: value}}.
    Errors: DerivationError (shape, cycles, unknown inputs, duplicate names),
    ExpressionError (rejected relation construct, named).
    """
    try:
        record = get_store().get(doc_id)
        with record.lock:
            added = record.model.define_dimensions(dimensions)
            get_store().snapshot(record)
            values = {n: record.model.dims[n].value for n in added}
    except XsectError as exc:
        raise _fail(exc) from exc
    return {"defined": added, "values": values}


@mcp.tool
async def xsect_update_inputs(
    doc_id: str, changes: dict[str, float]
) -> dict[str, Any]:
    """Update input (non-derived) dimension values; rederive dependents (FR-4).

    Args:
        changes: {dimension_name: new_value}. Targeting a derived dimension
            is rejected — update its inputs instead (FR-3).

    Returns a rederivation report: {"changed": [[name, old, new], ...],
    "order": [...derived evaluation order...]}.
    """
    try:
        record = get_store().get(doc_id)
        with record.lock:
            report = record.model.update_inputs(changes)
            get_store().snapshot(record)
    except XsectError as exc:
        raise _fail(exc) from exc
    return {
        "changed": [[n, old, new] for n, old, new in report.changed],
        "order": list(report.order),
    }


@mcp.tool
async def xsect_add_profile(
    doc_id: str, name: str, ops: list[dict[str, Any]]
) -> dict[str, Any]:
    """Add a profile: relative drawing ops compiled to exact loops (FR-6..11).

    Ops (magnitudes are STRINGS — a dimension name or an expression over
    dimensions; JSON numbers are rejected per FR-9):
      {"op":"start","x"?,"y"?}                    begin a loop (default origin)
      {"op":"line_to","x","y","ref"?}
      {"op":"line","length","turn"?,"ref"?}       turn radians, +ccw, then draw
      {"op":"arc","radius","sweep","ref"?}        tangent arc; sweep tau = circle
      {"op":"arc_to","x","y","radius","dir":"cw"|"ccw","size"?:"minor"|"major","ref"?}
      {"op":"fillet","vertex":<int>,"radius"}     line/line corners only
      {"op":"close"}
      {"op":"half_section","axis":"X"|"Y"}        mirror an open path (last op)
      {"op":"symmetry_axis","axis":"X"|"Y"}       declare a centerline axis

    Multiple start/close pairs build multi-loop regions (annuli, holes) with
    even-odd fill. "ref" labels create constraint refs like "<comp>.bore.center".

    Returns: {"profile", "edges", "loops", "refs", "axes", "auto_dims"}.
    Errors: GeometryError (open loops, literal magnitudes, impossible arcs,
    fillets that do not fit — each names the op index and the fix).
    """
    try:
        record = get_store().get(doc_id)
        with record.lock:
            compiled = record.model.add_profile(name, ops)
            get_store().snapshot(record)
    except XsectError as exc:
        raise _fail(exc) from exc
    return {
        "profile": name,
        "edges": compiled.edge_count,
        "loops": len(compiled.loops),
        "refs": sorted(compiled.refs),
        "axes": list(compiled.axes),
        "auto_dims": sorted(n for n in compiled.used_dims if "." in n),
    }


@mcp.tool
async def xsect_compose(
    doc_id: str,
    components: list[dict[str, Any]],
    constraints: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Compose components and solve their placement (FR-12/FR-13).

    Components: {"name", "profile", "fixed"?: bool} — at most one fixed; with
    none fixed the first is anchored as the datum (reported).

    Constraints: {"id", "kind", ...}:
      concentric: {"a":"A.bore","b":"B.body"}            (arc refs; centers coincide)
      coincident: {"a":"A.edge0.start","b":"B.origin"}
      distance:   {"a","b","dim":"offset","along":"X"|"Y"|"free"}  (dim = named dimension)
      axis_align: {"a":"B.axis.X","axis":"X"}            (declared symmetry axes)

    Returns constraint_state: WELL placements are applied; UNDER/OVER return
    status + DOF + failed constraint ids as diagnostics — never geometry.
    """
    try:
        record = get_store().get(doc_id)
        with record.lock:
            resolved = record.model.compose(components, constraints or [])
            get_store().snapshot(record)
    except XsectError as exc:
        raise _fail(exc) from exc
    return {
        "constraint_state": resolved.constraint_state.to_dict(),
        "placement_ok": resolved.placement_ok,
        "components": [c.name for c in resolved.components],
        "warnings": list(resolved.warnings),
    }


@mcp.tool(app=AppConfig(resource_uri=UI_URI))
async def xsect_render(
    doc_id: str, annotate: bool = True, hatch: bool = True
) -> ToolResult:
    """Render the composed section to SVG with evidence (FR-14..18, FR-23).

    Output structure: exact arcs (never polylines), per-component hatch angles
    (Y14.2-style), centerlines on declared symmetry axes, dimension
    annotations with tier badges [M]/[D]/[R]/[A] (asterisk = weaker effective
    tier), and the FR-23 sketch banner whenever a driving dimension rests on
    recalled/assumed values.

    Returns text (summary + banner + evidence) plus structured content
    {"svg", "evidence_report", "constraint_state"} that the MCP Apps view
    (ui://xsect/view.html) displays inline on hosts with the apps capability;
    text-only hosts lose nothing that matters (D16).
    """
    try:
        record = get_store().get(doc_id)
        with record.lock:
            resolved = record.model.resolve()
            evidence = resolved.evidence
            if resolved.placement_ok:
                svg = render_svg(resolved, annotate=annotate, hatch=hatch)
            else:
                svg = None
        structured: dict[str, Any] = {
            "svg": svg,
            "evidence_report": evidence.to_dict(),
            "constraint_state": resolved.constraint_state.to_dict(),
            "warnings": list(resolved.warnings),
        }
        size = len(repr(structured).encode("utf-8"))
        if size > PAYLOAD_REFUSE_BYTES:
            raise ExportError(
                f"render payload is {size} bytes, over the {PAYLOAD_REFUSE_BYTES}"
                " byte budget (D16). Reduce segment count or render without "
                "annotations."
            )
        lines: list[str] = []
        if resolved.placement_ok:
            lines.append(
                f"Rendered {record.model.name!r}: "
                f"{len(resolved.components)} component(s), bbox "
                f"{fmt(resolved.bbox[2] - resolved.bbox[0])} x "
                f"{fmt(resolved.bbox[3] - resolved.bbox[1])} mm."
            )
        else:
            st = resolved.constraint_state
            lines.append(
                f"Placement {st.status} (dof={st.dof}): {st.message}"
            )
            if st.failed_constraint_ids:
                lines.append(
                    "Failed constraints: " + ", ".join(st.failed_constraint_ids)
                )
        for w in resolved.warnings:
            lines.append(f"note: {w}")
        if size > PAYLOAD_WARN_BYTES:
            lines.append(f"note: payload is {size} bytes (over 1 MiB; 4 MiB cap).")
        lines.append("")
        lines.append(evidence.to_text())
        return ToolResult(content="\n".join(lines), structured_content=structured)
    except XsectError as exc:
        raise _fail(exc) from exc


@mcp.tool
async def xsect_export_dxf(doc_id: str) -> dict[str, Any]:
    """Export the composed section to DXF R2010 for Fusion 360 (FR-19..22).

    Millimetre units ($INSUNITS=4); LINE/ARC/CIRCLE entities (exact, no
    polylines) on per-component layers XSECT_<NAME>; centerlines on
    XSECT_CENTER. The filename is content-addressed (slug + geometry hash)
    inside the server's export directory.

    Returns: {"path", "layers", "entities"}.
    Errors: ExportError when the section is unplaced or the file cannot be
    written.
    """
    try:
        record = get_store().get(doc_id)
        with record.lock:
            resolved = record.model.resolve()
            path, layers, count = export_dxf(
                resolved, get_store().exports_dir, record.doc_id
            )
    except XsectError as exc:
        raise _fail(exc) from exc
    return {"path": str(path), "layers": layers, "entities": count}


@mcp.tool(annotations={"readOnlyHint": True})
async def xsect_inspect(doc_id: str) -> dict[str, Any]:
    """Inspect a document: dimensions with tiers/chains, profiles, composition.

    Read-only. Returns {"doc_id", "name", "units", "dimensions" (evidence
    rows incl. auto-registered geometry dims), "profiles", "components",
    "constraints", "constraint_state" (null before compose)}.
    """
    try:
        record = get_store().get(doc_id)
        with record.lock:
            m = record.model
            state: dict[str, Any] | None = None
            if m.components:
                resolved = m.resolve()
                evidence = resolved.evidence
                state = resolved.constraint_state.to_dict()
            else:
                from xsect.report.evidence import build_evidence

                evidence = build_evidence(m._merged_dims(), frozenset())
            return {
                "doc_id": record.doc_id,
                "name": m.name,
                "units": m.units,
                "dimensions": evidence.to_dict()["rows"],
                "profiles": {n: len(ops) for n, ops in m.profiles.items()},
                "components": m.components,
                "constraints": m.constraints,
                "constraint_state": state,
            }
    except XsectError as exc:
        raise _fail(exc) from exc


@mcp.resource(UI_URI, mime_type=UI_MIME_TYPE)
def xsect_view() -> str:
    """The MCP Apps inline view for xsect_render results."""
    return _VIEW_HTML


def main() -> None:
    host = os.environ.get("XSECT_HOST", "127.0.0.1")
    port = int(os.environ.get("XSECT_PORT", "8765"))
    mcp.run(transport="http", host=host, port=port)


if __name__ == "__main__":
    main()
