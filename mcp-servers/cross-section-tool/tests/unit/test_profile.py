"""FR-6..FR-11: relative ops, FR-9 magnitude discipline, mirroring, fillets."""

import math

import pytest

from xsect.model.derivation import evaluate_all
from xsect.model.dimensions import (
    AssumedProv,
    DerivedProv,
    Dimension,
    SourcedProv,
    Tier,
)
from xsect.model.errors import ExpressionError, GeometryError
from xsect.model.geometry import Arc, edge_end, edge_start
from xsect.model.profile import compile_profile, extract_auto_dims

DIMS = {
    "w": Dimension("w", "mm", 40.0, Tier.MEASURED, SourcedProv("caliper")),
    "h": Dimension("h", "mm", 20.0, Tier.MEASURED, SourcedProv("caliper")),
    "r": Dimension("r", "mm", 5.0, Tier.ASSUMED, AssumedProv("typical")),
    "full": Dimension(
        "full", "rad", 0.0, Tier.DERIVED,
        provenance=DerivedProv("tau", (), "definitional"),
    ),
    "quarter": Dimension(
        "quarter", "rad", 0.0, Tier.DERIVED,
        provenance=DerivedProv("deg(90)", (), "definitional"),
    ),
}


def build(name: str, ops: list[dict[str, object]]):
    auto = extract_auto_dims(name, ops, DIMS)
    values = {n: d.value for n, d in evaluate_all({**DIMS, **auto}).items()}
    return compile_profile(name, ops, DIMS, values)


def test_rectangle_via_relative_ops_closes() -> None:
    p = build("rect", [
        {"op": "start"},
        {"op": "line", "length": "w"},
        {"op": "line", "length": "h", "turn": "quarter"},
        {"op": "line", "length": "w", "turn": "quarter"},
        {"op": "close"},
    ])
    (loop,) = p.loops
    assert len(loop) == 4  # close() added the return edge
    assert edge_end(loop[-1]) == edge_start(loop[0])
    assert p.refs["edge1.end"].x == pytest.approx(40.0)
    assert p.refs["edge1.end"].y == pytest.approx(20.0)


def test_fr9_rejects_numbers_and_zero_reference_expressions() -> None:
    with pytest.raises(GeometryError, match="literal"):
        build("bad", [{"op": "start"}, {"op": "line", "length": 40}, {"op": "close"}])
    with pytest.raises(GeometryError, match="references no dimension"):
        build("bad2", [{"op": "start"}, {"op": "line", "length": "6*7"}, {"op": "close"}])
    with pytest.raises(GeometryError, match="undefined dimension"):
        build("bad3", [{"op": "start"}, {"op": "line", "length": "ghost"}, {"op": "close"}])
    with pytest.raises(ExpressionError):
        build("bad4", [
            {"op": "start"},
            {"op": "line", "length": "__import__('os')"},
            {"op": "close"},
        ])


def test_auto_dims_are_named_and_leaf_derived() -> None:
    ops: list[dict[str, object]] = [
        {"op": "start"},
        {"op": "line", "length": "w/2 + r"},
        {"op": "line", "length": "h", "turn": "quarter"},
        {"op": "line", "length": "w/2 + r", "turn": "quarter"},
        {"op": "close"},
    ]
    auto = extract_auto_dims("plate", ops, DIMS)
    assert "plate.op1.length" in auto
    d = auto["plate.op1.length"]
    assert d.tier is Tier.DERIVED
    assert d.provenance.regime == "geometric composition"  # type: ignore[union-attr]
    assert set(d.provenance.inputs) == {"w", "r"}  # type: ignore[union-attr]
    p = build("plate", ops)
    assert "plate.op1.length" in p.used_dims and "w" in p.used_dims


@pytest.mark.parametrize(
    ("direction", "size", "cy_sign", "sweep_kind"),
    [
        ("ccw", "minor", +1, "minor"),
        ("ccw", "major", -1, "major"),
        ("cw", "minor", -1, "minor"),
        ("cw", "major", +1, "major"),
    ],
)
def test_arc_to_center_selection(direction: str, size: str, cy_sign: int, sweep_kind: str) -> None:
    # chord along +X from (0,0) to (w,0); "left" of the chord is +Y
    p = build(f"a_{direction}_{size}", [
        {"op": "start"},
        {"op": "arc_to", "x": "w", "y": "w*0", "radius": "w*0.75",
         "dir": direction, "size": size, "ref": "a"},
        {"op": "arc_to", "x": "w*0", "y": "w*0", "radius": "w*0.75",
         "dir": direction, "size": size},
        {"op": "close"},
    ])
    center = p.refs["a.center"]
    assert math.copysign(1, center.y) == cy_sign
    arc = p.loops[0][0]
    assert isinstance(arc, Arc)
    sweep = abs(arc.end_angle - arc.start_angle)
    if sweep_kind == "minor":
        assert sweep < math.pi
    else:
        assert sweep > math.pi
    assert arc.ccw == (direction == "ccw")


def test_fillet_square_corner_is_tangent() -> None:
    p = build("sq", [
        {"op": "start"},
        {"op": "line", "length": "w"},
        {"op": "line", "length": "w", "turn": "quarter"},
        {"op": "line", "length": "w", "turn": "quarter"},
        {"op": "fillet", "vertex": 1, "radius": "r"},
        {"op": "close"},
    ])
    (loop,) = p.loops
    arcs = [e for e in loop if isinstance(e, Arc)]
    assert len(arcs) == 1
    arc = arcs[0]
    # 90-degree corner at (w,0): center at (w-r, r), quarter sweep, tangent
    assert (arc.center.x, arc.center.y) == pytest.approx((35.0, 5.0))
    assert abs(arc.end_angle - arc.start_angle) == pytest.approx(math.pi / 2)
    # tangency: trimmed incoming edge ends exactly at the arc start
    i = loop.index(arc)
    assert edge_end(loop[i - 1]) == pytest.approx(edge_start(arc)) or (
        (edge_end(loop[i - 1]).x, edge_end(loop[i - 1]).y)
        == pytest.approx((edge_start(arc).x, edge_start(arc).y))
    )


def test_fillet_rejects_overtrim_and_curved_corners() -> None:
    with pytest.raises(GeometryError, match="consume"):
        build("ot", [
            {"op": "start"},
            {"op": "line", "length": "r"},
            {"op": "line", "length": "w", "turn": "quarter"},
            {"op": "line", "length": "r", "turn": "quarter"},
            {"op": "fillet", "vertex": 1, "radius": "r*1.5"},
            {"op": "fillet", "vertex": 2, "radius": "r*1.5"},
            {"op": "close"},
        ])
    with pytest.raises(GeometryError, match="line/line"):
        build("la", [
            {"op": "start"},
            {"op": "line", "length": "w"},
            {"op": "arc", "radius": "r", "sweep": "quarter"},
            {"op": "line", "length": "w", "turn": "quarter"},
            {"op": "fillet", "vertex": 2, "radius": "r"},
            {"op": "close"},
        ])


def test_half_section_mirrors_and_flags_off_axis_endpoints() -> None:
    p = build("hs", [
        {"op": "start"},
        {"op": "line_to", "x": "w*0", "y": "h"},
        {"op": "line_to", "x": "w", "y": "h"},
        {"op": "line_to", "x": "w", "y": "h*0"},
        {"op": "half_section", "axis": "X"},
    ])
    (loop,) = p.loops
    assert len(loop) == 6  # 3 original + 3 mirrored
    ys = [edge_start(e).y for e in loop] + [edge_end(e).y for e in loop]
    assert min(ys) == pytest.approx(-20.0) and max(ys) == pytest.approx(20.0)
    assert p.axes == ("X",)
    with pytest.raises(GeometryError, match="off the X axis"):
        build("hs2", [
            {"op": "start", "y": "h"},
            {"op": "line_to", "x": "w", "y": "h"},
            {"op": "half_section", "axis": "X"},
        ])


def test_multi_loop_annulus_and_full_circle_single_edge() -> None:
    p = build("tube", [
        {"op": "start", "y": "0 - w/2"},
        {"op": "arc", "radius": "w/2", "sweep": "full", "ref": "outer"},
        {"op": "close"},
        {"op": "start", "y": "0 - h/2"},
        {"op": "arc", "radius": "h/2", "sweep": "full", "ref": "bore"},
        {"op": "close"},
    ])
    assert len(p.loops) == 2
    assert all(len(lp) == 1 for lp in p.loops)
    assert all(isinstance(lp[0], Arc) for lp in p.loops)
    assert p.refs["bore.center"].x == pytest.approx(0.0, abs=1e-9)
    # bare-named radius on the bore ("h/2" is an expression -> no callout)
    assert p.named_radius_arcs == ()


def test_open_loop_and_double_start_rejected() -> None:
    with pytest.raises(GeometryError, match="left open"):
        build("open", [{"op": "start"}, {"op": "line", "length": "w"}])
    with pytest.raises(GeometryError, match="close"):
        build("dbl", [
            {"op": "start"},
            {"op": "line", "length": "w"},
            {"op": "start"},
        ])


def test_ref_alias_rules() -> None:
    with pytest.raises(GeometryError, match="reused"):
        build("dup", [
            {"op": "start"},
            {"op": "line", "length": "w", "ref": "top"},
            {"op": "line", "length": "h", "turn": "quarter", "ref": "top"},
            {"op": "line", "length": "w", "turn": "quarter"},
            {"op": "close"},
        ])
    with pytest.raises(GeometryError, match="edge/axis"):
        build("ns", [
            {"op": "start"},
            {"op": "line", "length": "w", "ref": "edge9"},
            {"op": "close"},
        ])


def test_profile_name_must_be_identifier_shaped() -> None:
    """Profile names prefix auto-registered dimension names; anything outside
    [A-Za-z_][A-Za-z0-9_]* would be unreferencable in expressions."""
    with pytest.raises(GeometryError, match=r"A-Za-z_"):
        build("bad-name", [
            {"op": "start"},
            {"op": "line_to", "x": "w", "y": "w*0"},
            {"op": "line_to", "x": "w", "y": "w"},
            {"op": "close"},
        ])
