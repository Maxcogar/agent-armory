"""D6 evidence chains, D9 render structure, FR-19..22 DXF entities."""

import math
import re
from pathlib import Path

import ezdxf
import pytest

from xsect.model.derivation import evaluate_all
from xsect.model.dimensions import (
    AssumedProv,
    DerivedProv,
    Dimension,
    SourcedProv,
    Tier,
)
from xsect.render.svg import render_svg
from xsect.report.evidence import build_evidence
from xsect.section import SectionModel
from xsect.solve.slvs import SOLVER_AVAILABLE

needs_solver = pytest.mark.skipif(
    not SOLVER_AVAILABLE, reason="python-solvespace is not installed"
)


def _dims() -> dict[str, Dimension]:
    return evaluate_all({
        "od": Dimension("od", "mm", 50.0, Tier.MEASURED, SourcedProv("caliper")),
        "wall_t": Dimension("wall_t", "mm", 3.0, Tier.ASSUMED, AssumedProv("guess")),
        "idr": Dimension("idr", "mm", 0.0, Tier.DERIVED,
                         DerivedProv("od/2 - wall_t", ("od", "wall_t"), "thin wall")),
        "area": Dimension("area", "mm", 0.0, Tier.DERIVED,
                          DerivedProv("pi * od**2 / 4", ("od",), "solid")),
    })


def test_effective_tier_is_weakest_link() -> None:
    rep = build_evidence(_dims(), driving=frozenset())
    assert rep.row("idr").tier is Tier.DERIVED
    assert rep.row("idr").effective_tier is Tier.ASSUMED  # laundering blocked
    assert rep.row("area").effective_tier is Tier.DERIVED  # measured chain


def test_banner_fires_only_on_weak_driving_dims() -> None:
    clean = build_evidence(_dims(), driving=frozenset({"area", "od"}))
    assert not clean.sketch and clean.banner_text is None
    dirty = build_evidence(_dims(), driving=frozenset({"idr"}))
    assert dirty.sketch and "idr" in dirty.sketch_dims
    assert dirty.banner_text is not None and "SKETCH" in dirty.banner_text
    assert "idr" in dirty.to_text()


@pytest.fixture()
def two_plate_section() -> SectionModel:
    m = SectionModel(name="hostile <name> & co")
    m.define_dimensions([
        {"name": "w", "unit": "mm", "tier": "measured", "value": 30.0, "source": "caliper"},
        {"name": "h", "unit": "mm", "tier": "measured", "value": 10.0, "source": "caliper"},
        {"name": "rr", "unit": "mm", "tier": "measured", "value": 4.0, "source": "radius gauge"},
        {"name": "full", "unit": "rad", "tier": "derived", "relation": "tau",
         "regime": "definitional"},
    ])
    m.add_profile("plate", [
        {"op": "start"},
        {"op": "line_to", "x": "w", "y": "h*0"},
        {"op": "line_to", "x": "w", "y": "h"},
        {"op": "line_to", "x": "w*0", "y": "h"},
        {"op": "close"},
        {"op": "symmetry_axis", "axis": "X"},
    ])
    m.add_profile("disc", [
        {"op": "start", "y": "0-rr"},
        {"op": "arc", "radius": "rr", "sweep": "full"},
        {"op": "close"},
        {"op": "symmetry_axis", "axis": "X"},
    ])
    return m


def test_concentric_on_a_line_ref_is_rejected(two_plate_section: SectionModel) -> None:
    """Concentric needs arc refs; a line edge must fail with a named error,
    never a silent fallback."""
    from xsect.model.errors import ConstraintError

    m = two_plate_section
    with pytest.raises(ConstraintError, match="does not resolve to a point|arc refs"):
        m.compose(
            [{"name": "P<1>", "profile": "plate", "fixed": True},
             {"name": "P<1>b", "profile": "disc"}],
            [{"id": "cc", "kind": "concentric", "a": "P<1>b.edge0", "b": "P<1>.edge1"}],
        )


@needs_solver
def test_svg_render_structure(two_plate_section: SectionModel) -> None:
    m = two_plate_section
    # axis_align (origin on X, heading pinned) + distance along X = 3 eq on
    # 3 DOF: disc lands at (w, 0, 0) — deterministic, no redundancy.
    r = m.compose([
        {"name": "P<1>", "profile": "plate", "fixed": True},
        {"name": "disc&co", "profile": "disc", "fixed": False},
    ], [
        {"id": "c1", "kind": "axis_align", "a": "disc&co.axis.X", "axis": "X"},
        {"id": "c2", "kind": "distance", "a": "P<1>.origin", "b": "disc&co.edge0.center",
         "dim": "rr", "along": "X"},
    ])
    assert r.placement_ok, r.constraint_state.message
    svg = render_svg(r, annotate=True, hatch=True)
    assert svg.count("<pattern") == 2
    angles = set(re.findall(r'patternTransform="rotate\((-?[\d.]+)\)"', svg))
    assert len(angles) == 2  # adjacent components differ (D9)
    assert " A " in svg or "A " in svg  # arcs are A commands
    assert "polyline" not in svg and "<polygon" not in svg
    assert 'fill-rule="evenodd"' in svg
    assert 'id="xs-centerlines"' in svg and "stroke-dasharray" in svg
    assert "var(--color-text-primary" in svg  # theme variables (D10)
    # hostile names never appear raw
    assert "<1>" not in svg.replace("&lt;1&gt;", "")
    assert "[M]" in svg  # tier badge on the rr annotation


def test_dxf_entities_layers_units_and_cw_arc_flip(
    tmp_path: Path, two_plate_section: SectionModel
) -> None:
    from xsect.export.dxf import export_dxf

    m = two_plate_section
    # half-section profile gives mirrored (cw) arcs — build one with an arc
    m.add_profile("dome", [
        {"op": "start"},
        {"op": "arc_to", "x": "w", "y": "w*0", "radius": "w*0.6", "dir": "ccw", "size": "minor"},
        {"op": "half_section", "axis": "X"},
    ])
    r = m.compose([{"name": "D", "profile": "dome", "fixed": True}], [])
    path, layers, count = export_dxf(r, tmp_path, "dome")
    assert path.exists() and path.parent == tmp_path.resolve()
    doc = ezdxf.readfile(path)
    assert doc.header["$INSUNITS"] == 4
    ents = list(doc.modelspace())
    kinds = sorted({e.dxftype() for e in ents})
    assert "ARC" in kinds and "LINE" in kinds
    assert {e.dxf.layer for e in ents} == {"XSECT_D", "XSECT_CENTER"}
    # cw model arc exported as ccw DXF arc: verify endpoint geometry roundtrips
    model_arcs = [e for lp in r.components[0].loops for e in lp if hasattr(e, "radius")]
    dxf_arcs = [e for e in ents if e.dxftype() == "ARC"]
    assert len(dxf_arcs) == len(model_arcs) == 2
    for e in dxf_arcs:
        sa = math.radians(e.dxf.start_angle)
        sp = (e.dxf.center.x + e.dxf.radius * math.cos(sa),
              e.dxf.center.y + e.dxf.radius * math.sin(sa))
        # every DXF arc endpoint must be an endpoint of some model arc
        model_pts = []
        for a in model_arcs:
            for ang in (a.start_angle, a.end_angle):
                model_pts.append((a.center.x + a.radius * math.cos(ang),
                                  a.center.y + a.radius * math.sin(ang)))
        assert any(math.hypot(sp[0] - p[0], sp[1] - p[1]) < 1e-6 for p in model_pts)
