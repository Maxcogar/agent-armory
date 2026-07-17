"""SolverAdapter seam (D4): the placement problem, backend-neutral.

The section layer normalizes caller constraints into the small primitive set
below; a backend (``xsect.solve.slvs``) encodes them for its engine. Placement
failures return **diagnostics, never geometry** (FR-13): UNDER reports the
remaining DOF; OVER names the conflicting caller constraint ids.

Local-uniqueness honesty note (FR-13, carried from the architecture): a
numeric constraint solver converges to the branch nearest its deterministic
initial guess. WELL means "well-constrained at the found solution", not a
proof of global uniqueness.
"""

from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Protocol

from xsect.model.geometry import Point, Transform


class PlacementStatus(enum.Enum):
    WELL = "well_constrained"
    UNDER = "under_constrained"
    OVER = "over_constrained"
    NOT_CONVERGED = "not_converged"


@dataclass(frozen=True)
class ComponentSpec:
    """One rigid body: the local feature points the constraints reference."""

    name: str
    fixed: bool
    extent: float
    features: dict[str, Point] = field(default_factory=dict)


@dataclass(frozen=True)
class AdapterConstraint:
    """A normalized constraint primitive.

    kinds:
      * ``coincident_points``: a == b
      * ``point_on_axis``: a lies on the section datum axis ``axis``
      * ``distance``: |a - b| (``along`` 'free') or the projected X/Y distance
      * ``axis_align``: component ``comp``'s local axis ``local_axis`` is
        colinear with the section datum axis ``axis``
    """

    caller_id: str
    kind: str
    a: tuple[str, str] | None = None  # (component, feature)
    b: tuple[str, str] | None = None
    value: float | None = None
    along: str = "free"  # 'X' | 'Y' | 'free'
    axis: str | None = None  # section datum axis
    comp: str | None = None
    local_axis: str | None = None


@dataclass(frozen=True)
class PlacementResult:
    status: PlacementStatus
    dof: int
    transforms: dict[str, Transform]
    failed_constraint_ids: tuple[str, ...]
    message: str


class SolverAdapter(Protocol):
    def solve(
        self,
        components: tuple[ComponentSpec, ...],
        constraints: tuple[AdapterConstraint, ...],
    ) -> PlacementResult: ...
