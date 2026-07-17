"""FR-7/FR-17: exact primitives, rigid transforms, mirror handedness."""

import math

import pytest

from xsect.model.errors import GeometryError
from xsect.model.geometry import (
    Arc,
    Line,
    Point,
    Transform,
    arc_sweep,
    edge_bbox,
    edge_end,
    edge_start,
    is_full_circle,
    make_arc,
    mirror_edge,
    reverse_edge,
    validate_loop_closed,
)


def test_make_arc_normalizes_sweep_invariant() -> None:
    a = make_arc(Point(0, 0), 1.0, math.pi / 2, 0.0, ccw=True)  # wraps forward
    assert a.end_angle > a.start_angle
    assert arc_sweep(a) == pytest.approx(1.5 * math.pi)
    c = make_arc(Point(0, 0), 1.0, 0.0, 0.0, ccw=True)
    assert is_full_circle(c)
    with pytest.raises(GeometryError):
        make_arc(Point(0, 0), -1.0, 0.0, 1.0, ccw=True)


def test_arc_endpoints() -> None:
    a = make_arc(Point(1, 1), 2.0, 0.0, math.pi / 2, ccw=True)
    s, e = edge_start(a), edge_end(a)
    assert (s.x, s.y) == pytest.approx((3.0, 1.0))
    assert (e.x, e.y) == pytest.approx((1.0, 3.0))


def test_transform_rotates_then_translates_preserving_handedness() -> None:
    tf = Transform(10.0, 0.0, math.pi / 2)
    a = make_arc(Point(1, 0), 1.0, 0.0, math.pi / 2, ccw=True)
    w = tf.apply_edge(a)
    assert isinstance(w, Arc) and w.ccw
    assert (w.center.x, w.center.y) == pytest.approx((10.0, 1.0))
    ws, as_ = edge_start(w), edge_start(a)
    expect = tf.apply_point(as_)
    assert (ws.x, ws.y) == pytest.approx((expect.x, expect.y))


def test_mirror_flips_arc_handedness_and_maps_endpoints() -> None:
    a = make_arc(Point(0, 2), 1.0, -math.pi / 2, math.pi / 2, ccw=True)
    m = mirror_edge(a, "X")
    assert isinstance(m, Arc) and not m.ccw
    ms, me = edge_start(m), edge_end(m)
    s, e = edge_start(a), edge_end(a)
    assert (ms.x, ms.y) == pytest.approx((s.x, -s.y))
    assert (me.x, me.y) == pytest.approx((e.x, -e.y))
    my = mirror_edge(Line(Point(1, 2), Point(3, 4)), "Y")
    assert isinstance(my, Line)
    assert (my.p0.x, my.p0.y) == (-1, 2)


def test_reverse_edge_roundtrip() -> None:
    a = make_arc(Point(0, 0), 1.0, 0.0, math.pi / 2, ccw=True)
    r = reverse_edge(a)
    assert isinstance(r, Arc) and not r.ccw
    assert edge_start(r) == edge_end(a) or (
        pytest.approx((edge_start(r).x, edge_start(r).y))
        == (edge_end(a).x, edge_end(a).y)
    )


def test_edge_bbox_includes_arc_axis_extremes() -> None:
    # quarter arc from (1,0) to (0,1): bbox must include the arc, and a half
    # arc crossing +Y must reach y=r even though endpoints are at y=0
    half = make_arc(Point(0, 0), 2.0, 0.0, math.pi, ccw=True)
    b = edge_bbox(half)
    assert b[3] == pytest.approx(2.0)  # top of the arc, not an endpoint


def test_validate_loop_closed_names_the_gap() -> None:
    open_loop = (
        Line(Point(0, 0), Point(10, 0)),
        Line(Point(10, 0), Point(10, 10)),
        Line(Point(10, 10), Point(0, 5)),  # ends away from start
    )
    with pytest.raises(GeometryError, match="not closed"):
        validate_loop_closed(open_loop, "test")
    closed = (
        Line(Point(0, 0), Point(10, 0)),
        Line(Point(10, 0), Point(10, 10)),
        Line(Point(10, 10), Point(0, 0)),
    )
    validate_loop_closed(closed, "test")
