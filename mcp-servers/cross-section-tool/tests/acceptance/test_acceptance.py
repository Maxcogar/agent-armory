"""Acceptance criteria AC-1..AC-10 through the real MCP surface.

The spec document was not available in the build environment, so these ACs
are *inferred* from the architecture's FR/NFR set (flagged in the final
report). Each test drives the FastMCP server through the in-memory
``fastmcp.Client`` — the same code path an MCP host exercises, minus the
HTTP transport.

No pytest-asyncio dependency: each test owns its own ``asyncio.run``.
"""

from __future__ import annotations

import asyncio
import re
from collections.abc import Awaitable, Callable
from pathlib import Path

import ezdxf
import pytest
from fastmcp import Client
from fastmcp.exceptions import ToolError

import xsect.server.app as app
from xsect.model.geometry import Line
from xsect.section import SectionModel
from xsect.solve.slvs import SOLVER_AVAILABLE

needs_solver = pytest.mark.skipif(
    not SOLVER_AVAILABLE, reason="python-solvespace is not installed"
)

RECT_DIMS = [
    {"name": "w", "unit": "mm", "tier": "measured", "value": 40.0, "source": "caliper"},
    {"name": "h", "unit": "mm", "tier": "measured", "value": 20.0, "source": "caliper"},
]
RECT_OPS = [
    {"op": "start"},
    {"op": "line_to", "x": "w", "y": "h*0"},
    {"op": "line_to", "x": "w", "y": "h"},
    {"op": "line_to", "x": "w*0", "y": "h"},
    {"op": "close"},
]


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Client:
    """Fresh store per test: env-pinned data dir + reset singleton."""
    monkeypatch.setenv("XSECT_DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setattr(app, "_store", None)
    return Client(app.mcp)


def run(coro_fn: Callable[[], Awaitable[None]]) -> None:
    asyncio.run(coro_fn())


async def _make_rect_doc(c: Client, name: str = "Plate") -> str:
    doc = (await c.call_tool("xsect_create_document", {"name": name})).data["doc_id"]
    await c.call_tool(
        "xsect_define_dimensions", {"doc_id": doc, "dimensions": list(RECT_DIMS)}
    )
    await c.call_tool(
        "xsect_add_profile", {"doc_id": doc, "name": "plate", "ops": list(RECT_OPS)}
    )
    return doc


# ---------------------------------------------------------------------------
# AC-1: document lifecycle — create, then inspect reflects the state.
# ---------------------------------------------------------------------------
def test_ac1_create_and_inspect(client: Client) -> None:
    async def go() -> None:
        async with client as c:
            res = await c.call_tool(
                "xsect_create_document", {"name": "GT3582R oil pump housing"}
            )
            doc = res.data["doc_id"]
            assert re.fullmatch(r"[a-z0-9-]+-\d{4}", doc)
            info = (await c.call_tool("xsect_inspect", {"doc_id": doc})).data
            assert info["doc_id"] == doc
            assert info["units"] == "mm"
            assert info["profiles"] == {}
            assert info["constraint_state"] is None

    run(go)


# ---------------------------------------------------------------------------
# AC-2: dimensions carry tier + provenance; derived values are computed and
# can never be set directly (FR-1..FR-3).
# ---------------------------------------------------------------------------
def test_ac2_tiers_and_derived_dimensions(client: Client) -> None:
    async def go() -> None:
        async with client as c:
            doc = (await c.call_tool("xsect_create_document", {"name": "Tiers"})).data[
                "doc_id"
            ]
            res = await c.call_tool(
                "xsect_define_dimensions",
                {
                    "doc_id": doc,
                    "dimensions": [
                        {"name": "od", "unit": "mm", "tier": "measured",
                         "value": 30.0, "source": "caliper"},
                        {"name": "wall_t", "unit": "mm", "tier": "recalled",
                         "value": 3.0, "source": "datasheet, from memory"},
                        {"name": "stickout", "unit": "mm", "tier": "assumed",
                         "value": 12.0, "basis": "typical for this fixture"},
                        {"name": "id_", "unit": "mm", "tier": "derived",
                         "relation": "od - 2*wall_t", "regime": "thin tube"},
                    ],
                },
            )
            assert res.data["values"]["id_"] == pytest.approx(24.0)
            # Derived targets reject direct value updates (FR-3).
            with pytest.raises(ToolError, match="derived"):
                await c.call_tool(
                    "xsect_update_inputs", {"doc_id": doc, "changes": {"id_": 99.0}}
                )
            info = (await c.call_tool("xsect_inspect", {"doc_id": doc})).data
            tiers = {r["name"]: r["tier"] for r in info["dimensions"]}
            assert tiers["od"] == "measured"
            assert tiers["stickout"] == "assumed"
            assert tiers["id_"] == "derived"

    run(go)


# ---------------------------------------------------------------------------
# AC-3: FR-9 — numeric literals in geometry are rejected with a typed,
# actionable error; the error names the offense.
# ---------------------------------------------------------------------------
def test_ac3_literal_magnitudes_rejected(client: Client) -> None:
    async def go() -> None:
        async with client as c:
            doc = await _make_rect_doc(c)
            with pytest.raises(ToolError, match="(?i)literal|number|dimension"):
                await c.call_tool(
                    "xsect_add_profile",
                    {
                        "doc_id": doc,
                        "name": "bad",
                        "ops": [
                            {"op": "start"},
                            {"op": "line_to", "x": 40.0, "y": "h*0"},
                            {"op": "close"},
                        ],
                    },
                )

    run(go)


# ---------------------------------------------------------------------------
# AC-4: a fully-constrained composition reports well_constrained and the
# render carries geometry (FR-12, FR-14).
# ---------------------------------------------------------------------------
def test_ac4_well_constrained_compose_and_render(client: Client) -> None:
    async def go() -> None:
        async with client as c:
            doc = await _make_rect_doc(c)
            res = await c.call_tool(
                "xsect_compose",
                {
                    "doc_id": doc,
                    "components": [{"name": "P", "profile": "plate", "fixed": True}],
                    "constraints": [],
                },
            )
            assert res.data["constraint_state"]["status"] == "well_constrained"
            assert res.data["placement_ok"] is True
            render = await c.call_tool("xsect_render", {"doc_id": doc})
            sc = render.structured_content
            assert sc is not None and sc["svg"] is not None
            assert sc["svg"].startswith("<svg")
            assert "evidence_report" in sc and "constraint_state" in sc

    run(go)


# ---------------------------------------------------------------------------
# AC-5 / AC-6: UNDER and OVER return diagnostics — status, DOF, failed ids —
# and never geometry (FR-13).
# ---------------------------------------------------------------------------
@needs_solver
def test_ac5_under_constrained_returns_diagnostics_only(client: Client) -> None:
    async def go() -> None:
        async with client as c:
            doc = await _make_rect_doc(c)
            await c.call_tool(
                "xsect_add_profile",
                {"doc_id": doc, "name": "plate2", "ops": list(RECT_OPS)},
            )
            res = await c.call_tool(
                "xsect_compose",
                {
                    "doc_id": doc,
                    "components": [
                        {"name": "A", "profile": "plate", "fixed": True},
                        {"name": "B", "profile": "plate2"},
                    ],
                    "constraints": [
                        {"id": "c1", "kind": "coincident",
                         "a": "A.origin", "b": "B.origin"},
                    ],
                },
            )
            state = res.data["constraint_state"]
            assert state["status"] == "under_constrained"
            assert state["dof"] >= 1
            assert res.data["placement_ok"] is False
            render = await c.call_tool("xsect_render", {"doc_id": doc})
            sc = render.structured_content
            assert sc is not None and sc["svg"] is None, (
                "diagnostics, never geometry"
            )
            assert "under_constrained" in render.content[0].text

    run(go)


@needs_solver
def test_ac6_over_constrained_names_caller_constraints(client: Client) -> None:
    async def go() -> None:
        async with client as c:
            doc = await _make_rect_doc(c)
            await c.call_tool(
                "xsect_add_profile",
                {
                    "doc_id": doc,
                    "name": "plate2",
                    "ops": [
                        {"op": "start"},
                        {"op": "line_to", "x": "w", "y": "h*0"},
                        {"op": "line_to", "x": "w", "y": "h", "ref": "far"},
                        {"op": "line_to", "x": "w*0", "y": "h"},
                        {"op": "close"},
                    ],
                },
            )
            res = await c.call_tool(
                "xsect_compose",
                {
                    "doc_id": doc,
                    "components": [
                        {"name": "A", "profile": "plate", "fixed": True},
                        {"name": "B", "profile": "plate2"},
                    ],
                    "constraints": [
                        {"id": "pin1", "kind": "coincident",
                         "a": "A.origin", "b": "B.origin"},
                        {"id": "pin2", "kind": "coincident",
                         "a": "A.edge1.end", "b": "B.far.end"},
                    ],
                },
            )
            state = res.data["constraint_state"]
            assert state["status"] == "over_constrained"
            assert state["failed_constraint_ids"], "must name the offenders"
            assert set(state["failed_constraint_ids"]) <= {"pin1", "pin2"}
            assert res.data["placement_ok"] is False

    run(go)


# ---------------------------------------------------------------------------
# AC-7: render exposes the MCP Apps view (meta resourceUri) and the FR-23
# sketch banner whenever recalled/assumed values drive geometry.
# ---------------------------------------------------------------------------
def test_ac7_render_meta_and_sketch_banner(client: Client) -> None:
    async def go() -> None:
        async with client as c:
            tools = {t.name: t for t in await c.list_tools()}
            meta = tools["xsect_render"].meta or {}
            ui = meta.get("ui") or meta.get("fastmcp", {}).get("ui") or {}
            assert ui.get("resourceUri") == "ui://xsect/view.html", meta

            doc = (await c.call_tool("xsect_create_document", {"name": "Banner"})).data[
                "doc_id"
            ]
            await c.call_tool(
                "xsect_define_dimensions",
                {
                    "doc_id": doc,
                    "dimensions": [
                        {"name": "w", "unit": "mm", "tier": "assumed",
                         "value": 40.0, "basis": "eyeballed"},
                        {"name": "h", "unit": "mm", "tier": "measured",
                         "value": 20.0, "source": "caliper"},
                    ],
                },
            )
            await c.call_tool(
                "xsect_add_profile",
                {"doc_id": doc, "name": "plate", "ops": list(RECT_OPS)},
            )
            await c.call_tool(
                "xsect_compose",
                {
                    "doc_id": doc,
                    "components": [{"name": "P", "profile": "plate", "fixed": True}],
                    "constraints": [],
                },
            )
            render = await c.call_tool("xsect_render", {"doc_id": doc})
            sc = render.structured_content
            assert sc is not None
            banner = sc["evidence_report"]["banner_text"]
            assert banner and "SKETCH" in banner.upper()
            assert banner in render.content[0].text

    run(go)


# ---------------------------------------------------------------------------
# AC-8: update_inputs rederives dependents and changes downstream geometry
# (FR-4); the report lists exactly what changed.
# ---------------------------------------------------------------------------
def test_ac8_update_inputs_rederives_and_moves_geometry(client: Client) -> None:
    async def go() -> None:
        async with client as c:
            doc = await _make_rect_doc(c)
            await c.call_tool(
                "xsect_compose",
                {
                    "doc_id": doc,
                    "components": [{"name": "P", "profile": "plate", "fixed": True}],
                    "constraints": [],
                },
            )
            svg_before = (
                await c.call_tool("xsect_render", {"doc_id": doc})
            ).structured_content["svg"]
            res = await c.call_tool(
                "xsect_update_inputs", {"doc_id": doc, "changes": {"w": 60.0}}
            )
            changed = {row[0]: (row[1], row[2]) for row in res.data["changed"]}
            assert changed["w"] == (40.0, 60.0)
            svg_after = (
                await c.call_tool("xsect_render", {"doc_id": doc})
            ).structured_content["svg"]
            assert svg_before != svg_after
            vb = re.search(r'viewBox="([^"]+)"', svg_after)
            assert vb is not None

    run(go)


# ---------------------------------------------------------------------------
# AC-9: DXF export lands in the export jail and its entities match the
# resolved section geometry to 1e-6 (FR-19..FR-22, NFR-2).
# ---------------------------------------------------------------------------
def test_ac9_dxf_jail_and_geometric_identity(
    client: Client, tmp_path: Path
) -> None:
    async def go() -> None:
        async with client as c:
            doc = await _make_rect_doc(c, name="DXF")
            await c.call_tool(
                "xsect_compose",
                {
                    "doc_id": doc,
                    "components": [{"name": "P", "profile": "plate", "fixed": True}],
                    "constraints": [],
                },
            )
            res = await c.call_tool("xsect_export_dxf", {"doc_id": doc})
            out = Path(res.data["path"])
            jail = (tmp_path / "data" / "exports").resolve()
            assert out.resolve().is_relative_to(jail)
            assert out.exists()
            assert "XSECT_P" in res.data["layers"]

            # Independent in-process model with the same inputs.
            m = SectionModel(name="check", units="mm")
            m.define_dimensions(list(RECT_DIMS))
            m.add_profile("plate", list(RECT_OPS))
            resolved = m.compose(
                [{"name": "P", "profile": "plate", "fixed": True}], []
            )
            def norm(ax: float, ay: float, bx: float, by: float) -> tuple:
                a = (round(ax, 6), round(ay, 6))
                b = (round(bx, 6), round(by, 6))
                return ("LINE",) + tuple(sorted((a, b)))

            want = set()
            for comp in resolved.components:
                for loop in comp.loops:
                    for edge in loop:
                        if isinstance(edge, Line):
                            want.add(
                                norm(edge.p0.x, edge.p0.y, edge.p1.x, edge.p1.y)
                            )

            got = set()
            dxf = ezdxf.readfile(str(out))
            for e in dxf.modelspace():
                if e.dxftype() == "LINE" and e.dxf.layer == "XSECT_P":
                    got.add(
                        norm(e.dxf.start.x, e.dxf.start.y, e.dxf.end.x, e.dxf.end.y)
                    )
            assert got == want

    run(go)


# ---------------------------------------------------------------------------
# AC-10: the MCP Apps resource is served with the profile MIME type and the
# guest implements the 2026-01-26 lifecycle.
# ---------------------------------------------------------------------------
def test_ac10_apps_resource_lifecycle(client: Client) -> None:
    async def go() -> None:
        async with client as c:
            res = await c.read_resource("ui://xsect/view.html")
            assert res[0].mimeType == "text/html;profile=mcp-app"
            html = res[0].text
            for token in (
                "ui/initialize",
                "ui/notifications/initialized",
                "ui/notifications/tool-result",
                "ui/resource-teardown",
                "ui/notifications/size-changed",
            ):
                assert token in html, f"guest lifecycle missing {token}"

    run(go)


# ---------------------------------------------------------------------------
# Flagship flow: shaft in housing via axis_align + distance along X — the
# scenario the whole tool exists for (solver required).
# ---------------------------------------------------------------------------
@needs_solver
def test_flagship_shaft_in_housing_end_to_end(client: Client) -> None:
    async def go() -> None:
        async with client as c:
            doc = (
                await c.call_tool("xsect_create_document", {"name": "Shaft Fit"})
            ).data["doc_id"]
            await c.call_tool(
                "xsect_define_dimensions",
                {
                    "doc_id": doc,
                    "dimensions": [
                        {"name": "housing_l", "unit": "mm", "tier": "measured",
                         "value": 50.0, "source": "caliper"},
                        {"name": "housing_h", "unit": "mm", "tier": "measured",
                         "value": 30.0, "source": "caliper"},
                        {"name": "shaft_d", "unit": "mm", "tier": "recalled",
                         "value": 12.0, "source": "print, from memory"},
                        {"name": "shaft_l", "unit": "mm", "tier": "measured",
                         "value": 40.0, "source": "caliper"},
                        {"name": "shaft_stickout", "unit": "mm", "tier": "assumed",
                         "value": 15.0, "basis": "assembly guess"},
                    ],
                },
            )
            await c.call_tool(
                "xsect_add_profile",
                {
                    "doc_id": doc,
                    "name": "housing",
                    "ops": [
                        {"op": "start"},
                        {"op": "line_to", "x": "housing_l*0", "y": "housing_h/2"},
                        {"op": "line_to", "x": "housing_l", "y": "housing_h/2"},
                        {"op": "line_to", "x": "housing_l", "y": "housing_h*0"},
                        {"op": "half_section", "axis": "X"},
                    ],
                },
            )
            await c.call_tool(
                "xsect_add_profile",
                {
                    "doc_id": doc,
                    "name": "shaft",
                    "ops": [
                        {"op": "start"},
                        {"op": "line_to", "x": "shaft_l*0", "y": "shaft_d/2"},
                        {"op": "line_to", "x": "shaft_l", "y": "shaft_d/2"},
                        {"op": "line_to", "x": "shaft_l", "y": "shaft_d*0"},
                        {"op": "half_section", "axis": "X"},
                    ],
                },
            )
            res = await c.call_tool(
                "xsect_compose",
                {
                    "doc_id": doc,
                    "components": [
                        {"name": "H", "profile": "housing", "fixed": True},
                        {"name": "S", "profile": "shaft"},
                    ],
                    "constraints": [
                        {"id": "coax", "kind": "axis_align",
                         "a": "S.axis.X", "axis": "X"},
                        {"id": "stick", "kind": "distance",
                         "a": "H.origin", "b": "S.origin",
                         "dim": "shaft_stickout", "along": "X"},
                    ],
                },
            )
            assert res.data["constraint_state"]["status"] == "well_constrained"
            render = await c.call_tool("xsect_render", {"doc_id": doc})
            sc = render.structured_content
            assert sc is not None
            svg = sc["svg"]
            assert svg is not None
            # Both symmetry centerlines and both hatch patterns present.
            assert svg.count('class="xs-centerline"') >= 2 or "xs-centerlines" in svg
            assert "hatch-" in svg
            # Banner: recalled shaft_d + assumed stickout drive geometry.
            banner = sc["evidence_report"]["banner_text"]
            assert banner and "SKETCH" in banner.upper()

            # The shaft transform must place its origin at x = stickout;
            # verify through the exported DXF (geometry stays server-side).
            dxf_res = await c.call_tool("xsect_export_dxf", {"doc_id": doc})
            dxf = ezdxf.readfile(dxf_res.data["path"])
            xs = [
                e.dxf.start.x
                for e in dxf.modelspace()
                if e.dxftype() == "LINE" and e.dxf.layer == "XSECT_S"
            ] + [
                e.dxf.end.x
                for e in dxf.modelspace()
                if e.dxftype() == "LINE" and e.dxf.layer == "XSECT_S"
            ]
            assert xs, "shaft layer must contain lines"
            assert min(xs) == pytest.approx(15.0, abs=1e-6)
            assert max(xs) == pytest.approx(55.0, abs=1e-6)

    run(go)
