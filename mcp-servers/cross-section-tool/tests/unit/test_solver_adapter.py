"""SolverAdapter contract over python-solvespace 3.0.8 (D5, FR-12, FR-13).

Every expected transform here was verified against the installed solver
during the build session (not recalled): identity placement for the
already-satisfied coincident+distance pair, (25, 0, 0) for axis_align +
along-X distance, dof=1 for a lone coincident, and caller-id translation
for redundant sets that SolveSpace attributes to internal rigid-body welds.
"""

from __future__ import annotations

import math

import pytest

from xsect.model.errors import ConstraintError
from xsect.model.geometry import Point
from xsect.solve import slvs
from xsect.solve.adapter import AdapterConstraint, ComponentSpec, PlacementStatus
from xsect.solve.slvs import SOLVER_AVAILABLE, SlvsAdapter

needs_solver = pytest.mark.skipif(
    not SOLVER_AVAILABLE, reason="python-solvespace is not installed"
)

# Fixtures mirroring the verified smoke geometry.
A = ComponentSpec(
    name="A",
    fixed=True,
    extent=50.0,
    features={"bore.center": Point(0.0, 0.0), "mark": Point(12.0, 1.0)},
)
B = ComponentSpec(
    name="B",
    fixed=False,
    extent=20.0,
    features={"body.center": Point(0.0, 0.0), "pin": Point(2.0, 1.0)},
)
C = ComponentSpec(name="C", fixed=False, extent=10.0, features={"origin": Point(0.0, 0.0)})


def test_all_fixed_short_circuits_without_backend() -> None:
    """A fully anchored composition never needs the solver at all."""
    only = ComponentSpec(name="only", fixed=True, extent=5.0, features={})
    r = SlvsAdapter().solve((only,), ())
    assert r.status is PlacementStatus.WELL
    assert r.dof == 0
    tf = r.transforms["only"]
    assert (tf.tx, tf.ty, tf.theta) == (0.0, 0.0, 0.0)
    assert r.failed_constraint_ids == ()


@needs_solver
def test_well_coincident_plus_free_distance() -> None:
    """3 equations on 3 DOF; the initial guess already satisfies both."""
    r = SlvsAdapter().solve(
        (A, B),
        (
            AdapterConstraint(
                caller_id="c1",
                kind="coincident_points",
                a=("B", "body.center"),
                b=("A", "bore.center"),
            ),
            AdapterConstraint(
                caller_id="c2",
                kind="distance",
                a=("A", "mark"),
                b=("B", "pin"),
                value=10.0,
                along="free",
            ),
        ),
    )
    assert r.status is PlacementStatus.WELL
    assert r.dof == 0
    tf = r.transforms["B"]
    pin_world = tf.apply_point(Point(2.0, 1.0))
    assert math.isclose(pin_world.x, 2.0, abs_tol=1e-6)
    assert math.isclose(pin_world.y, 1.0, abs_tol=1e-6)
    # Fixed components report identity transforms.
    fa = r.transforms["A"]
    assert (fa.tx, fa.ty, fa.theta) == (0.0, 0.0, 0.0)


@needs_solver
def test_well_axis_align_plus_projected_distance_along_x() -> None:
    """The flagship shaft-in-housing constraint pattern: exact (25, 0, 0)."""
    r = SlvsAdapter().solve(
        (A, C),
        (
            AdapterConstraint(
                caller_id="ax", kind="axis_align", comp="C", local_axis="X", axis="X"
            ),
            AdapterConstraint(
                caller_id="dx",
                kind="distance",
                a=("A", "bore.center"),
                b=("C", "origin"),
                value=25.0,
                along="X",
            ),
        ),
    )
    assert r.status is PlacementStatus.WELL
    assert r.dof == 0
    tf = r.transforms["C"]
    assert math.isclose(tf.tx, 25.0, abs_tol=1e-6)
    assert math.isclose(tf.ty, 0.0, abs_tol=1e-6)
    assert math.isclose(tf.theta, 0.0, abs_tol=1e-6)


@needs_solver
def test_projected_distance_survives_shared_coordinate() -> None:
    """Regression: the old aux-corner encoding degenerated when a and b shared
    the measured coordinate. The point-line encoding must not."""
    # C starts at the same y as A.bore.center; along-X distance must still
    # solve (this is exactly the degenerate configuration).
    r = SlvsAdapter().solve(
        (A, C),
        (
            AdapterConstraint(
                caller_id="ax", kind="axis_align", comp="C", local_axis="X", axis="X"
            ),
            AdapterConstraint(
                caller_id="dx",
                kind="distance",
                a=("A", "bore.center"),
                b=("C", "origin"),
                value=7.5,
                along="X",
            ),
        ),
    )
    assert r.status is PlacementStatus.WELL
    assert math.isclose(abs(r.transforms["C"].tx), 7.5, abs_tol=1e-6)


@needs_solver
def test_under_constrained_returns_diagnostics_not_geometry() -> None:
    """A lone coincident leaves rotation free: UNDER, dof 1, no transforms."""
    r = SlvsAdapter().solve(
        (A, B),
        (
            AdapterConstraint(
                caller_id="c1",
                kind="coincident_points",
                a=("B", "body.center"),
                b=("A", "bore.center"),
            ),
        ),
    )
    assert r.status is PlacementStatus.UNDER
    assert r.dof == 1
    assert r.transforms == {}
    assert "under constrained" in r.message


@needs_solver
def test_over_constrained_translates_internal_tags_to_caller_ids() -> None:
    """Two coincidents on one rigid body = 4 equations on 3 DOF. SolveSpace
    may blame internal rigid-body welds; the adapter must surface the caller
    constraint ids instead (verified fix from the build session)."""
    r = SlvsAdapter().solve(
        (A, B),
        (
            AdapterConstraint(
                caller_id="c1",
                kind="coincident_points",
                a=("B", "body.center"),
                b=("A", "bore.center"),
            ),
            AdapterConstraint(
                caller_id="c2",
                kind="coincident_points",
                a=("B", "pin"),
                b=("A", "mark"),
            ),
        ),
    )
    assert r.status is PlacementStatus.OVER
    assert r.transforms == {}
    assert r.failed_constraint_ids, "OVER must name at least one constraint"
    assert all(not fid.startswith("internal:") for fid in r.failed_constraint_ids)
    assert set(r.failed_constraint_ids) <= {"c1", "c2"}
    assert "over constrained" in r.message


@needs_solver
def test_distance_must_be_positive() -> None:
    with pytest.raises(ConstraintError, match="coincident constraint for zero"):
        SlvsAdapter().solve(
            (A, B),
            (
                AdapterConstraint(
                    caller_id="d0",
                    kind="distance",
                    a=("A", "mark"),
                    b=("B", "pin"),
                    value=0.0,
                    along="free",
                ),
            ),
        )


@needs_solver
def test_unregistered_feature_reference_is_named() -> None:
    with pytest.raises(ConstraintError, match="was not registered"):
        SlvsAdapter().solve(
            (A, B),
            (
                AdapterConstraint(
                    caller_id="bad",
                    kind="coincident_points",
                    a=("B", "no_such_feature"),
                    b=("A", "mark"),
                ),
            ),
        )


def test_missing_solver_guard_names_the_dependency(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """With the backend absent and a free component present, the error must
    name python-solvespace and the escape hatch."""
    monkeypatch.setattr(slvs, "SOLVER_AVAILABLE", False)
    with pytest.raises(ConstraintError, match="python-solvespace"):
        SlvsAdapter().solve((A, B), ())
