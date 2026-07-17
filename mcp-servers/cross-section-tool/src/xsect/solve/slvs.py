"""python-solvespace backend for the SolverAdapter seam (D4/D8).

Encoding — empirically verified against python-solvespace 3.0.8 in the build
session (the binding's docs are thin; the running library is the standard):

* group 1: datum — dragged origin (0,0), x-dir (1,0), y-dir (0,1), the two
  datum axis lines, and every FIXED component's feature points. Group 1 is
  not solved when group 2 is active, so these are effectively anchored.
* group 2: each free component is origin ``O`` + heading ``H`` with
  ``distance(O, H, 1.0)`` (3 DOF). A feature at local ``p`` is pinned by
  ``distance(O, F, |p|)`` + ``distance(H, F, |p - (1,0)|)``; ``O``/``H`` are
  reused when ``p`` is (0,0)/(1,0) to avoid zero-distance constraints.
  Reflection branches resolve to the deterministic initial guess (FR-13
  local-uniqueness note).
* ``failures()`` returns 1-based indices in CONSTRAINT CREATION ORDER
  (verified: 10 constraints -> cons_len()==10, failures named the 9th/10th
  created), so every creation increments a counter mapped to a caller id.
* ``dof()`` is valid only after ``solve()``.
* Projected distances use point-to-line distance (PT_LINE_DISTANCE via the
  binding's ``distance(point, line, value, wp)`` dispatch, verified here):
  along-X distance from ``a`` to ``b`` = distance from ``b`` to the vertical
  unit line through ``a``. The earlier aux-corner encoding degenerated to a
  zero-length line whenever both points shared the measured coordinate; the
  point-line form has no degenerate case. PT_LINE_DISTANCE is side-signed in
  the core, so ``b`` stays on its initial-guess side — the same deterministic
  branch selection FR-13 already documents.
"""

from __future__ import annotations

import math
from collections.abc import Callable
from typing import Any

from xsect.model.errors import ConstraintError
from xsect.model.geometry import Transform
from xsect.solve.adapter import (
    AdapterConstraint,
    ComponentSpec,
    PlacementResult,
    PlacementStatus,
)

try:  # guarded import: the seam exists so absence degrades, not crashes (D4)
    from python_solvespace import ResultFlag, SolverSystem

    SOLVER_AVAILABLE = True
    _IMPORT_ERROR: Exception | None = None
except Exception as exc:  # pragma: no cover - environment dependent
    SOLVER_AVAILABLE = False
    _IMPORT_ERROR = exc


_SPREAD_PAD = 10.0


class SlvsAdapter:
    """SolverAdapter implementation over python-solvespace 3.0.8."""

    def solve(
        self,
        components: tuple[ComponentSpec, ...],
        constraints: tuple[AdapterConstraint, ...],
    ) -> PlacementResult:
        free = [c for c in components if not c.fixed]
        if not free:
            # Nothing to solve: every component is anchored. No backend needed.
            return PlacementResult(
                status=PlacementStatus.WELL,
                dof=0,
                transforms={c.name: Transform(0.0, 0.0, 0.0) for c in components},
                failed_constraint_ids=(),
                message="all components fixed; no free placement variables",
            )
        if not SOLVER_AVAILABLE:
            raise ConstraintError(
                "constraint solving requires python-solvespace, which is not "
                f"installed ({_IMPORT_ERROR}). Install it (Windows/macOS wheels "
                "exist for CPython 3.11; Linux builds from the sdist with a C++ "
                "toolchain) or compose a single fixed component."
            )

        sys = SolverSystem()
        wp = sys.create_2d_base()

        tags: list[str] = []  # creation-order tags; failures() indexes 1-based

        def con(tag: str, fn: Callable[..., object], *args: object) -> None:
            fn(*args, wp)
            tags.append(tag)

        # ---- group 1: datum + fixed features ------------------------------
        sys.set_group(1)
        datum_o = sys.add_point_2d(0.0, 0.0, wp)
        datum_x = sys.add_point_2d(1.0, 0.0, wp)
        datum_y = sys.add_point_2d(0.0, 1.0, wp)
        con("internal:datum", sys.dragged, datum_o)
        con("internal:datum", sys.dragged, datum_x)
        con("internal:datum", sys.dragged, datum_y)
        axis_lines = {
            "X": sys.add_line_2d(datum_o, datum_x, wp),
            "Y": sys.add_line_2d(datum_o, datum_y, wp),
        }

        points: dict[tuple[str, str], Any] = {}
        spread = 2.0 * max((c.extent for c in components), default=0.0) + _SPREAD_PAD

        for comp in components:
            if comp.fixed:
                for feat, p in comp.features.items():
                    points[(comp.name, feat)] = sys.add_point_2d(p.x, p.y, wp)
                points.setdefault(
                    (comp.name, "__origin__"), sys.add_point_2d(0.0, 0.0, wp)
                )
                points.setdefault(
                    (comp.name, "__heading__"), sys.add_point_2d(1.0, 0.0, wp)
                )

        # ---- group 2: free rigid bodies -----------------------------------
        sys.set_group(2)
        origins: dict[str, Any] = {}
        headings: dict[str, Any] = {}
        free_index = 0
        for comp in components:
            if comp.fixed:
                continue
            ox = free_index * spread
            free_index += 1
            o = sys.add_point_2d(ox, 0.0, wp)
            h = sys.add_point_2d(ox + 1.0, 0.0, wp)
            con(f"internal:{comp.name}.rigid", sys.distance, o, h, 1.0)
            origins[comp.name] = o
            headings[comp.name] = h
            points[(comp.name, "__origin__")] = o
            points[(comp.name, "__heading__")] = h
            for feat, p in comp.features.items():
                if math.hypot(p.x, p.y) <= 1e-12:
                    points[(comp.name, feat)] = o
                    continue
                if math.hypot(p.x - 1.0, p.y) <= 1e-12:
                    points[(comp.name, feat)] = h
                    continue
                f = sys.add_point_2d(ox + p.x, p.y, wp)
                con(
                    f"internal:{comp.name}.{feat}",
                    sys.distance,
                    o,
                    f,
                    math.hypot(p.x, p.y),
                )
                con(
                    f"internal:{comp.name}.{feat}",
                    sys.distance,
                    h,
                    f,
                    math.hypot(p.x - 1.0, p.y),
                )
                points[(comp.name, feat)] = f

        def pt(ref: tuple[str, str] | None, cid: str) -> Any:
            assert ref is not None
            try:
                return points[ref]
            except KeyError:
                raise ConstraintError(
                    f"constraint {cid!r} references {ref[0]}.{ref[1]}, which "
                    "was not registered as a feature point (internal)."
                ) from None

        # ---- caller constraints -------------------------------------------
        for c in constraints:
            if c.kind == "coincident_points":
                con(c.caller_id, sys.coincident, pt(c.a, c.caller_id), pt(c.b, c.caller_id))
            elif c.kind == "point_on_axis":
                assert c.axis in ("X", "Y")
                con(c.caller_id, sys.coincident, pt(c.a, c.caller_id), axis_lines[c.axis])
            elif c.kind == "axis_align":
                assert c.axis in ("X", "Y") and c.comp is not None
                o = pt((c.comp, "__origin__"), c.caller_id)
                marker_feat = "__heading__" if c.local_axis == "X" else "axis.Y"
                m = pt((c.comp, marker_feat), c.caller_id)
                con(c.caller_id, sys.coincident, o, axis_lines[c.axis])
                con(c.caller_id, sys.coincident, m, axis_lines[c.axis])
            elif c.kind == "distance":
                value = float(c.value or 0.0)
                if value <= 0.0:
                    raise ConstraintError(
                        f"constraint {c.caller_id!r}: distance must be positive "
                        f"(got {value:g}). Use a coincident constraint for zero."
                    )
                pa, pb = pt(c.a, c.caller_id), pt(c.b, c.caller_id)
                if c.along == "free":
                    con(c.caller_id, sys.distance, pa, pb, value)
                else:
                    # Projected distance = point-to-line distance from b to
                    # the axis-aligned line through a. The helper leg a->Av is
                    # unit-length, so nothing degenerates when a and b share a
                    # coordinate (the aux-corner encoding failed exactly there
                    # — caught and fixed empirically in this build).
                    ga = sys.params(pa.params)
                    if c.along == "X":
                        av = sys.add_point_2d(ga[0], ga[1] + 1.0, wp)
                        line = sys.add_line_2d(pa, av, wp)
                        con(c.caller_id, sys.vertical, line)
                    else:
                        av = sys.add_point_2d(ga[0] + 1.0, ga[1], wp)
                        line = sys.add_line_2d(pa, av, wp)
                        con(c.caller_id, sys.horizontal, line)
                    con(c.caller_id, sys.distance, pa, av, 1.0)
                    con(c.caller_id, sys.distance, pb, line, value)
            else:  # pragma: no cover - section normalizes kinds
                raise ConstraintError(f"unknown normalized constraint kind {c.kind!r}.")

        # ---- solve ----------------------------------------------------------
        result = sys.solve()
        if result == ResultFlag.OKAY:
            dof = sys.dof()
            if dof == 0:
                transforms: dict[str, Transform] = {}
                for comp in components:
                    if comp.fixed:
                        transforms[comp.name] = Transform(0.0, 0.0, 0.0)
                    else:
                        ox, oy = sys.params(origins[comp.name].params)
                        hx, hy = sys.params(headings[comp.name].params)
                        transforms[comp.name] = Transform(
                            ox, oy, math.atan2(hy - oy, hx - ox)
                        )
                return PlacementResult(
                    status=PlacementStatus.WELL,
                    dof=0,
                    transforms=transforms,
                    failed_constraint_ids=(),
                    message="well constrained (at the deterministic initial "
                    "guess; local uniqueness per FR-13)",
                )
            return PlacementResult(
                status=PlacementStatus.UNDER,
                dof=dof,
                transforms={},
                failed_constraint_ids=(),
                message=f"under constrained: {dof} degree(s) of freedom remain. "
                "Add distance/coincident/axis_align constraints.",
            )

        failed_ids: list[str] = []
        for idx in sys.failures():
            tag = tags[idx - 1] if 1 <= idx <= len(tags) else f"constraint#{idx}"
            if tag not in failed_ids:
                failed_ids.append(tag)
        caller_failed = tuple(t for t in failed_ids if not t.startswith("internal:"))
        over_msg = (
            "over constrained / inconsistent: the named constraints conflict "
            "or are redundant. Remove or relax one of them."
        )
        if not caller_failed and failed_ids:
            # SolveSpace attributed the redundancy to internal rigid-body
            # welds — translate to the caller constraints that over-determine
            # those components (a rigid body has exactly 3 DOF).
            comps = {t.split(":", 1)[1].split(".", 1)[0] for t in failed_ids}
            involved: list[str] = []
            for c in constraints:
                touches = {c.comp} | {
                    ref[0] for ref in (c.a, c.b) if ref is not None
                }
                if touches & comps and c.caller_id not in involved:
                    involved.append(c.caller_id)
            caller_failed = tuple(involved)
            over_msg = (
                f"over constrained: component(s) {sorted(comps)} receive more "
                "constraint equations than their 3 rigid-body degrees of "
                "freedom (SolveSpace rejects redundant sets even when "
                "consistent). Remove one of the listed constraints — e.g. "
                "concentric + axis_align on the same pair is redundant by "
                "construction; prefer axis_align + a distance along the axis."
            )
        if result == ResultFlag.INCONSISTENT:
            named = caller_failed or tuple(failed_ids)
            if not named:
                # Observed empirically (~1% of identical runs on 3.0.8): the
                # binding reports INCONSISTENT with an empty failures() list.
                # An OVER verdict must always name candidates, so fall back
                # to the full caller set rather than an empty diagnosis.
                named = tuple(dict.fromkeys(c.caller_id for c in constraints))
                over_msg = (
                    "over constrained / inconsistent: the solver did not "
                    "attribute the conflict to specific constraints; every "
                    "caller constraint is listed as a candidate. Remove or "
                    "relax one and re-compose."
                )
            return PlacementResult(
                status=PlacementStatus.OVER,
                dof=0,
                transforms={},
                failed_constraint_ids=named,
                message=over_msg,
            )
        detail = (
            "solver capacity exceeded"
            if result == ResultFlag.TOO_MANY_UNKNOWNS
            else "solver did not converge"
        )
        return PlacementResult(
            status=PlacementStatus.NOT_CONVERGED,
            dof=0,
            transforms={},
            failed_constraint_ids=caller_failed or tuple(failed_ids),
            message=f"{detail} ({result!r}). Simplify the constraint set or "
            "reduce component count.",
        )
