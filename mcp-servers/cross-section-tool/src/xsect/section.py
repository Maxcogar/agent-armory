"""Section orchestration: dimensions + profiles + composition -> ResolvedSection.

This module owns the resolve pipeline (D6/D7/D8) and the caller-facing
constraint reference grammar:

* ``<component>.origin``
* ``<component>.edge<k>.start|end|center`` (final post-fillet indices)
* ``<component>.<alias>.start|end|center`` (op ``ref`` labels)
* ``<component>.axis.X|Y`` (declared symmetry axes; axis_align only)
* ``section.origin`` / ``section.axis.X|Y`` (the datum)

Constraint JSON: ``{"id", "kind": concentric|coincident|distance|axis_align,
"a", "b"?, "dim"?, "along"?: "X"|"Y"|"free", "axis"?}``. ``distance`` values
come from a **named dimension** (``dim``) — never a literal — which is what
lets constraint dimensions feed annotations and the evidence chain (FR-9,
D9). ``concentric`` normalizes to coincidence of the two arc centers.

Placement failures resolve to diagnostics with no geometry (FR-13): an
UNDER/OVER/NOT_CONVERGED result carries status, DOF, and failed constraint
ids; ``components`` is empty.
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass, field

from xsect.model.derivation import RederivationReport, evaluate_all, rederive
from xsect.model.dimensions import (
    AssumedProv,
    DerivedProv,
    Dimension,
    SourcedProv,
    Tier,
    validate_dimension,
)
from xsect.model.errors import ConstraintError, DerivationError, GeometryError
from xsect.model.geometry import (
    Edge,
    Line,
    Point,
    Transform,
    loop_bbox,
)
from xsect.model.profile import (
    CompiledProfile,
    compile_profile,
    extract_auto_dims,
)
from xsect.report.evidence import EvidenceReport, build_evidence
from xsect.solve.adapter import (
    AdapterConstraint,
    ComponentSpec,
    PlacementResult,
    PlacementStatus,
)

MAX_COMPONENTS = 64
MAX_CONSTRAINTS = 512
MAX_DIMENSIONS = 2048

#: Y14.2-motivated hatch palette (degrees); consecutive entries always differ,
#: including the wrap, so adjacent components never share an angle (D9).
HATCH_PALETTE: tuple[float, ...] = (45.0, 135.0, 22.5, 112.5, 67.5, 157.5)

_TIERS = {t.value: t for t in Tier}
_CONSTRAINT_KINDS = ("concentric", "coincident", "distance", "axis_align")


@dataclass(frozen=True)
class LinearAnnotation:
    dim: str
    value: float
    unit: str
    badge: str
    a: Point
    b: Point
    along: str  # 'X' | 'Y' | 'free'


@dataclass(frozen=True)
class RadiusAnnotation:
    dim: str
    value: float
    unit: str
    badge: str
    center: Point
    radius: float
    anchor_angle: float


@dataclass(frozen=True)
class Centerline:
    component: str
    axis: str
    p0: Point
    p1: Point


@dataclass(frozen=True)
class ResolvedComponent:
    name: str
    loops: tuple[tuple[Edge, ...], ...]
    hatch_angle: float
    transform: Transform


@dataclass(frozen=True)
class ConstraintState:
    status: str
    dof: int
    failed_constraint_ids: tuple[str, ...]
    message: str
    auto_fixed: str | None

    def to_dict(self) -> dict[str, object]:
        return {
            "status": self.status,
            "dof": self.dof,
            "failed_constraint_ids": list(self.failed_constraint_ids),
            "message": self.message,
            "auto_fixed": self.auto_fixed,
        }


@dataclass(frozen=True)
class ResolvedSection:
    name: str
    placement_ok: bool
    components: tuple[ResolvedComponent, ...]
    centerlines: tuple[Centerline, ...]
    linear_annotations: tuple[LinearAnnotation, ...]
    radius_annotations: tuple[RadiusAnnotation, ...]
    evidence: EvidenceReport
    constraint_state: ConstraintState
    bbox: tuple[float, float, float, float]
    warnings: tuple[str, ...]


@dataclass
class SectionModel:
    """Mutable document state; the store serializes exactly these inputs."""

    name: str
    units: str = "mm"
    dims: dict[str, Dimension] = field(default_factory=dict)
    profiles: dict[str, list[dict[str, object]]] = field(default_factory=dict)
    components: list[dict[str, object]] = field(default_factory=list)
    constraints: list[dict[str, object]] = field(default_factory=list)

    # ---- mutations ---------------------------------------------------------

    def define_dimensions(self, specs: list[dict[str, object]]) -> list[str]:
        added: list[str] = []
        for spec in specs:
            dim = _dimension_from_spec(spec)
            if dim.name in self.dims:
                raise DerivationError(
                    f"dimension {dim.name!r} already exists. Use "
                    "xsect_update_inputs to change input values."
                )
            self.dims[dim.name] = dim
            added.append(dim.name)
        if len(self.dims) > MAX_DIMENSIONS:
            raise DerivationError(
                f"dimension count exceeds the cap of {MAX_DIMENSIONS} (T3)."
            )
        # validate the DAG now (unknown inputs / cycles fail fast, atomically)
        try:
            self.dims = evaluate_all(self.dims)
        except Exception:
            for name in added:
                self.dims.pop(name, None)
            raise
        return added

    def update_inputs(self, changes: Mapping[str, float]) -> RederivationReport:
        for name in changes:
            if isinstance(name, str) and "." in name:
                raise DerivationError(
                    f"cannot update {name!r}: auto-registered geometry "
                    "dimensions are derived; update their inputs instead."
                )
        new_dims, report = rederive(self.dims, changes)
        self.dims = new_dims
        return report

    def add_profile(self, name: str, ops: list[dict[str, object]]) -> CompiledProfile:
        if not isinstance(name, str) or not name.strip():
            raise GeometryError("profile name must be a non-empty string.")
        if name in self.profiles:
            raise GeometryError(
                f"profile {name!r} already exists. Profiles are immutable in "
                "v1; add a new name."
            )
        compiled = self._compile_one(name, ops)  # validates before recording
        self.profiles[name] = ops
        return compiled

    def compose(
        self,
        components: list[dict[str, object]],
        constraints: list[dict[str, object]],
    ) -> ResolvedSection:
        if not components:
            raise ConstraintError("compose requires at least one component.")
        if len(components) > MAX_COMPONENTS:
            raise ConstraintError(
                f"component count exceeds the cap of {MAX_COMPONENTS} (T3)."
            )
        if len(constraints) > MAX_CONSTRAINTS:
            raise ConstraintError(
                f"constraint count exceeds the cap of {MAX_CONSTRAINTS} (T3)."
            )
        seen: set[str] = set()
        fixed_names: list[str] = []
        for comp in components:
            if not isinstance(comp, dict):
                raise ConstraintError("each component must be an object.")
            extra = set(comp) - {"name", "profile", "fixed"}
            if extra:
                raise ConstraintError(
                    f"component has unknown keys {sorted(extra)}; allowed: "
                    "name, profile, fixed."
                )
            cname, prof = comp.get("name"), comp.get("profile")
            if not isinstance(cname, str) or not cname.strip():
                raise ConstraintError("component 'name' must be a non-empty string.")
            if cname in seen:
                raise ConstraintError(f"component {cname!r} declared twice.")
            seen.add(cname)
            if prof not in self.profiles:
                raise ConstraintError(
                    f"component {cname!r} references unknown profile {prof!r}. "
                    f"Known profiles: {sorted(self.profiles) or 'none'}."
                )
            if comp.get("fixed", False):
                fixed_names.append(cname)
        if len(fixed_names) > 1:
            raise ConstraintError(
                f"at most one component may be fixed; got {fixed_names}. "
                "Position the others with constraints relative to the datum."
            )
        for c in constraints:
            _check_constraint_shape(c)
        self.components = components
        self.constraints = constraints
        return self.resolve()

    # ---- resolve pipeline ---------------------------------------------------

    def _merged_dims(self) -> dict[str, Dimension]:
        merged = dict(self.dims)
        for pname, ops in self.profiles.items():
            for key, dim in extract_auto_dims(pname, ops, self.dims).items():
                merged[key] = dim
        if len(merged) > MAX_DIMENSIONS:
            raise DerivationError(
                f"dimension count (incl. auto-registered) exceeds the cap of "
                f"{MAX_DIMENSIONS} (T3)."
            )
        return evaluate_all(merged)

    def _compile_one(self, name: str, ops: list[dict[str, object]]) -> CompiledProfile:
        auto = extract_auto_dims(name, ops, self.dims)
        merged = evaluate_all({**self.dims, **auto})
        values = {n: d.value for n, d in merged.items()}
        return compile_profile(name, ops, self.dims, values)

    def resolve(self) -> ResolvedSection:
        if not self.components:
            raise ConstraintError(
                "nothing composed yet: call xsect_compose with components "
                "(and constraints) before rendering or exporting."
            )
        evaluated = self._merged_dims()
        values = {n: d.value for n, d in evaluated.items()}
        compiled: dict[str, CompiledProfile] = {
            p: compile_profile(p, ops, self.dims, values)
            for p, ops in self.profiles.items()
        }

        comp_profiles: dict[str, CompiledProfile] = {}
        comp_order: list[str] = []
        fixed_flag: dict[str, bool] = {}
        for comp in self.components:
            cname = str(comp["name"])
            comp_order.append(cname)
            comp_profiles[cname] = compiled[str(comp["profile"])]
            fixed_flag[cname] = bool(comp.get("fixed", False))
        auto_fixed: str | None = None
        if not any(fixed_flag.values()):
            auto_fixed = comp_order[0]
            fixed_flag[auto_fixed] = True

        adapter_constraints, features_needed, constraint_dims = _normalize_constraints(
            self.constraints, comp_profiles, values, evaluated
        )

        specs = tuple(
            ComponentSpec(
                name=cname,
                fixed=fixed_flag[cname],
                extent=max(
                    (
                        max(b[2] - b[0], b[3] - b[1])
                        for b in map(loop_bbox, comp_profiles[cname].loops)
                    ),
                    default=1.0,
                ),
                features=features_needed.get(cname, {}),
            )
            for cname in comp_order
        )

        from xsect.solve.slvs import SlvsAdapter  # local import: guarded backend

        result: PlacementResult = SlvsAdapter().solve(specs, adapter_constraints)
        state = ConstraintState(
            status=result.status.value,
            dof=result.dof,
            failed_constraint_ids=result.failed_constraint_ids,
            message=result.message,
            auto_fixed=auto_fixed,
        )

        driving: set[str] = set(constraint_dims)
        for cname in comp_order:
            driving |= comp_profiles[cname].used_dims
        evidence = build_evidence(evaluated, driving)

        warnings: list[str] = []
        if auto_fixed is not None and len(comp_order) > 1:
            warnings.append(
                f"no component was marked fixed; {auto_fixed!r} was anchored as "
                "the datum."
            )

        if result.status is not PlacementStatus.WELL:
            return ResolvedSection(
                name=self.name,
                placement_ok=False,
                components=(),
                centerlines=(),
                linear_annotations=(),
                radius_annotations=(),
                evidence=evidence,
                constraint_state=state,
                bbox=(0.0, 0.0, 0.0, 0.0),
                warnings=tuple(warnings),
            )

        if len(comp_order) > len(HATCH_PALETTE):
            warnings.append(
                f"{len(comp_order)} components exceed the {len(HATCH_PALETTE)}-"
                "angle hatch palette; angles repeat (adjacent components still "
                "differ)."
            )

        resolved_components: list[ResolvedComponent] = []
        centerlines: list[Centerline] = []
        boxes: list[tuple[float, float, float, float]] = []
        for idx, cname in enumerate(comp_order):
            tf = result.transforms[cname]
            prof = comp_profiles[cname]
            world_loops = tuple(
                tuple(tf.apply_edge(e) for e in loop) for loop in prof.loops
            )
            resolved_components.append(
                ResolvedComponent(
                    name=cname,
                    loops=world_loops,
                    hatch_angle=HATCH_PALETTE[idx % len(HATCH_PALETTE)],
                    transform=tf,
                )
            )
            for loop in world_loops:
                boxes.append(loop_bbox(loop))
        bbox = (
            min(b[0] for b in boxes),
            min(b[1] for b in boxes),
            max(b[2] for b in boxes),
            max(b[3] for b in boxes),
        )
        extent = max(bbox[2] - bbox[0], bbox[3] - bbox[1], 1e-9)
        overhang = 0.05 * extent

        for cname in comp_order:
            tf = result.transforms[cname]
            prof = comp_profiles[cname]
            for axis in prof.axes:
                local_dir = Point(1.0, 0.0) if axis == "X" else Point(0.0, 1.0)
                o = tf.apply_point(Point(0.0, 0.0))
                d = tf.apply_point(local_dir)
                dx, dy = d.x - o.x, d.y - o.y
                # extend across the section bbox plus 5% overhang
                half = 0.5 * math.hypot(bbox[2] - bbox[0], bbox[3] - bbox[1]) + overhang
                centerlines.append(
                    Centerline(
                        component=cname,
                        axis=axis,
                        p0=Point(o.x - half * dx, o.y - half * dy),
                        p1=Point(o.x + half * dx, o.y + half * dy),
                    )
                )

        linear, radial = _build_annotations(
            self.constraints,
            comp_profiles,
            result.transforms,
            values,
            evaluated,
            evidence,
            comp_order,
        )

        return ResolvedSection(
            name=self.name,
            placement_ok=True,
            components=tuple(resolved_components),
            centerlines=tuple(centerlines),
            linear_annotations=linear,
            radius_annotations=radial,
            evidence=evidence,
            constraint_state=state,
            bbox=bbox,
            warnings=tuple(warnings),
        )


# ---------------------------------------------------------------------------
# spec parsing helpers


def _dimension_from_spec(spec: object) -> Dimension:
    if not isinstance(spec, dict):
        raise DerivationError("each dimension must be an object.")
    allowed = {"name", "unit", "value", "tier", "source", "basis", "relation", "regime", "inputs"}
    extra = set(spec) - allowed
    if extra:
        raise DerivationError(
            f"dimension spec has unknown keys {sorted(extra)}; allowed: "
            f"{sorted(allowed)}."
        )
    name = spec.get("name")
    if not isinstance(name, str):
        raise DerivationError("dimension 'name' must be a string.")
    unit = spec.get("unit")
    if not isinstance(unit, str):
        raise DerivationError(
            f"dimension {name!r}: 'unit' must be a string (mm for lengths; "
            "rad or deg for angles — internal math is mm/radians)."
        )
    tier_s = spec.get("tier")
    if tier_s not in _TIERS:
        raise DerivationError(
            f"dimension {name!r}: tier must be one of "
            f"{sorted(_TIERS)} (FR-1), got {tier_s!r}."
        )
    tier = _TIERS[str(tier_s)]

    if tier is Tier.DERIVED:
        if "value" in spec:
            raise DerivationError(
                f"dimension {name!r} is derived: its value is computed from the "
                "relation, never supplied (FR-3). Remove 'value'."
            )
        relation = spec.get("relation")
        regime = spec.get("regime")
        if not isinstance(relation, str) or not isinstance(regime, str):
            raise DerivationError(
                f"derived dimension {name!r} requires string 'relation' and "
                "'regime' (FR-2)."
            )
        from xsect.model.expressions import parse as parse_expr

        expr = parse_expr(relation)
        inputs_spec = spec.get("inputs")
        if inputs_spec is not None:
            if not isinstance(inputs_spec, list) or frozenset(inputs_spec) != expr.names:
                raise DerivationError(
                    f"derived dimension {name!r}: supplied inputs do not match "
                    f"the relation's referenced names {sorted(expr.names)}. "
                    "Omit 'inputs' — they are extracted from the relation."
                )
        prov: DerivedProv | SourcedProv | AssumedProv = DerivedProv(
            relation_expr=relation, inputs=tuple(sorted(expr.names)), regime=regime
        )
        dim = Dimension(name=name, unit=unit, value=0.0, tier=tier, provenance=prov)
    else:
        value = spec.get("value")
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise DerivationError(
                f"dimension {name!r} (tier {tier.value}) requires a numeric "
                "'value'."
            )
        if tier in (Tier.MEASURED, Tier.RECALLED):
            source = spec.get("source")
            if not isinstance(source, str) or not source.strip():
                raise DerivationError(
                    f"dimension {name!r} (tier {tier.value}) requires a "
                    "non-empty 'source' (FR-2)."
                )
            prov = SourcedProv(source=source)
        else:
            basis = spec.get("basis")
            if basis is not None and not isinstance(basis, str):
                raise DerivationError(
                    f"dimension {name!r}: 'basis' must be a string when given."
                )
            prov = AssumedProv(basis=basis)
        dim = Dimension(
            name=name, unit=unit, value=float(value), tier=tier, provenance=prov
        )
    validate_dimension(dim)
    return dim


def _check_constraint_shape(c: object) -> None:
    if not isinstance(c, dict):
        raise ConstraintError("each constraint must be an object.")
    cid, kind = c.get("id"), c.get("kind")
    if not isinstance(cid, str) or not cid.strip():
        raise ConstraintError("every constraint needs a string 'id'.")
    if kind not in _CONSTRAINT_KINDS:
        raise ConstraintError(
            f"constraint {cid!r}: kind must be one of {_CONSTRAINT_KINDS}, "
            f"got {kind!r}."
        )
    allowed = {"id", "kind", "a", "b", "dim", "along", "axis"}
    extra = set(c) - allowed
    if extra:
        raise ConstraintError(
            f"constraint {cid!r} has unknown keys {sorted(extra)}."
        )


def _split_ref(ref: object, cid: str) -> tuple[str, str]:
    if not isinstance(ref, str) or "." not in ref:
        raise ConstraintError(
            f"constraint {cid!r}: ref {ref!r} must look like "
            "'<component>.<feature>' (e.g. 'A.bore.center', 'B.origin', "
            "'section.axis.X')."
        )
    comp, rest = ref.split(".", 1)
    return comp, rest


def _resolve_point_ref(
    ref: object,
    cid: str,
    comp_profiles: Mapping[str, CompiledProfile],
) -> tuple[str, str, Point]:
    """Resolve a point ref -> (component, feature_key, local point).

    ``section.origin`` resolves to a synthetic fixed datum feature.
    """
    comp, rest = _split_ref(ref, cid)
    if comp == "section":
        if rest != "origin":
            raise ConstraintError(
                f"constraint {cid!r}: {ref!r} is not a point. Section point "
                "refs: 'section.origin'."
            )
        return ("section", "origin", Point(0.0, 0.0))
    if comp not in comp_profiles:
        raise ConstraintError(
            f"constraint {cid!r}: unknown component {comp!r}. Composed: "
            f"{sorted(comp_profiles)}."
        )
    prof = comp_profiles[comp]
    if rest in prof.refs:
        return (comp, rest, prof.refs[rest])
    raise ConstraintError(
        f"constraint {cid!r}: {ref!r} does not resolve to a point on "
        f"component {comp!r}. Available point refs include 'origin', "
        "'edge<k>.start|end|center', and op aliases '<ref>.start|end|center'."
    )


def _resolve_center_ref(
    ref: object, cid: str, comp_profiles: Mapping[str, CompiledProfile]
) -> tuple[str, str, Point]:
    """Concentric ergonomics: accept an arc ref and use its ``.center``."""
    comp, rest = _split_ref(ref, cid)
    if comp in comp_profiles and not rest.endswith(".center"):
        candidate = f"{rest}.center"
        if candidate in comp_profiles[comp].refs:
            return (comp, candidate, comp_profiles[comp].refs[candidate])
    resolved = _resolve_point_ref(ref, cid, comp_profiles)
    if not resolved[1].endswith(".center") and resolved[1] != "origin":
        raise ConstraintError(
            f"constraint {cid!r}: concentric requires arc refs (a '.center' "
            f"point); {ref!r} resolved to a non-center point."
        )
    return resolved


def _normalize_constraints(
    constraints: list[dict[str, object]],
    comp_profiles: Mapping[str, CompiledProfile],
    values: Mapping[str, float],
    dims: Mapping[str, Dimension],
) -> tuple[
    tuple[AdapterConstraint, ...],
    dict[str, dict[str, Point]],
    set[str],
]:
    out: list[AdapterConstraint] = []
    features: dict[str, dict[str, Point]] = {}
    constraint_dims: set[str] = set()

    def register(comp: str, feat: str, p: Point) -> None:
        if comp == "section":
            return
        features.setdefault(comp, {})[feat] = p

    for c in constraints:
        cid, kind = str(c["id"]), str(c["kind"])
        if kind in ("coincident", "concentric"):
            resolver = _resolve_point_ref if kind == "coincident" else _resolve_center_ref
            ca, fa, pa = resolver(c.get("a"), cid, comp_profiles)
            cb, fb, pb = resolver(c.get("b"), cid, comp_profiles)
            register(ca, fa, pa)
            register(cb, fb, pb)
            # section.origin participates as a point on the datum -> encode as
            # point-on-axis pair only when truly needed; here it is a fixed
            # point, which the backend represents via the fixed datum origin.
            a_key = (ca, fa) if ca != "section" else ("__datum__", "origin")
            b_key = (cb, fb) if cb != "section" else ("__datum__", "origin")
            if "__datum__" in (a_key[0], b_key[0]):
                # coincide with the datum origin == point on both axes
                target = a_key if a_key[0] != "__datum__" else b_key
                out.append(
                    AdapterConstraint(caller_id=cid, kind="point_on_axis", a=target, axis="X")
                )
                out.append(
                    AdapterConstraint(caller_id=cid, kind="point_on_axis", a=target, axis="Y")
                )
            else:
                out.append(
                    AdapterConstraint(
                        caller_id=cid, kind="coincident_points", a=a_key, b=b_key
                    )
                )
        elif kind == "distance":
            along = c.get("along", "free")
            if along not in ("X", "Y", "free"):
                raise ConstraintError(
                    f"constraint {cid!r}: along must be 'X', 'Y', or 'free'."
                )
            dim_name = c.get("dim")
            if not isinstance(dim_name, str) or dim_name not in dims:
                raise ConstraintError(
                    f"constraint {cid!r}: 'dim' must name a defined dimension "
                    "(FR-9 — no literal distances). Define one with "
                    "xsect_define_dimensions."
                )
            if "." in dim_name:
                raise ConstraintError(
                    f"constraint {cid!r}: 'dim' must be a caller-named "
                    "dimension, not an auto-registered geometry dimension."
                )
            constraint_dims.add(dim_name)
            ca, fa, pa = _resolve_point_ref(c.get("a"), cid, comp_profiles)
            cb, fb, pb = _resolve_point_ref(c.get("b"), cid, comp_profiles)
            register(ca, fa, pa)
            register(cb, fb, pb)
            a_key = (ca, fa) if ca != "section" else ("__missing__", "")
            b_key = (cb, fb) if cb != "section" else ("__missing__", "")
            if "__missing__" in (a_key[0], b_key[0]):
                raise ConstraintError(
                    f"constraint {cid!r}: distance to 'section.origin' is not "
                    "supported in v1 — use distances between component features "
                    "or axis_align + a distance along the axis."
                )
            out.append(
                AdapterConstraint(
                    caller_id=cid,
                    kind="distance",
                    a=a_key,
                    b=b_key,
                    value=float(values[dim_name]),
                    along=str(along),
                )
            )
        else:  # axis_align
            axis = c.get("axis")
            if axis not in ("X", "Y"):
                raise ConstraintError(
                    f"constraint {cid!r}: axis_align requires axis 'X' or 'Y' "
                    "(the section datum axis)."
                )
            comp, rest = _split_ref(c.get("a"), cid)
            if comp not in comp_profiles:
                raise ConstraintError(
                    f"constraint {cid!r}: unknown component {comp!r}."
                )
            if not rest.startswith("axis.") or rest[5:] not in ("X", "Y"):
                raise ConstraintError(
                    f"constraint {cid!r}: axis_align 'a' must be "
                    "'<component>.axis.X' or '<component>.axis.Y'."
                )
            local_axis = rest[5:]
            if local_axis not in comp_profiles[comp].axes:
                raise ConstraintError(
                    f"constraint {cid!r}: component {comp!r} has no declared "
                    f"{local_axis} symmetry axis. Declare it in the profile "
                    "with a symmetry_axis or half_section op."
                )
            if local_axis == "Y":
                register(comp, "axis.Y", Point(0.0, 1.0))
            out.append(
                AdapterConstraint(
                    caller_id=cid,
                    kind="axis_align",
                    comp=comp,
                    local_axis=local_axis,
                    axis=str(axis),
                )
            )
    return tuple(out), features, constraint_dims


def _build_annotations(
    constraints: list[dict[str, object]],
    comp_profiles: Mapping[str, CompiledProfile],
    transforms: Mapping[str, Transform],
    values: Mapping[str, float],
    dims: Mapping[str, Dimension],
    evidence: EvidenceReport,
    comp_order: list[str],
) -> tuple[tuple[LinearAnnotation, ...], tuple[RadiusAnnotation, ...]]:
    from xsect.model.dimensions import TIER_BADGE

    def badge(name: str) -> str:
        row = evidence.row(name)
        star = "*" if row.effective_tier is not row.tier else ""
        return TIER_BADGE[row.tier] + star

    linear: list[LinearAnnotation] = []
    for c in constraints:
        if c.get("kind") != "distance":
            continue
        cid = str(c["id"])
        dim_name = str(c["dim"])
        ca, fa, pa = _resolve_point_ref(c.get("a"), cid, comp_profiles)
        cb, fb, pb = _resolve_point_ref(c.get("b"), cid, comp_profiles)
        wa = transforms[ca].apply_point(pa) if ca in transforms else pa
        wb = transforms[cb].apply_point(pb) if cb in transforms else pb
        linear.append(
            LinearAnnotation(
                dim=dim_name,
                value=values[dim_name],
                unit=dims[dim_name].unit,
                badge=badge(dim_name),
                a=wa,
                b=wb,
                along=str(c.get("along", "free")),
            )
        )

    radial: list[RadiusAnnotation] = []
    seen: set[tuple[str, str]] = set()
    for cname in comp_order:
        prof = comp_profiles[cname]
        tf = transforms[cname]
        for dim_name, edge_idx in prof.named_radius_arcs:
            if (cname, dim_name) in seen:
                continue  # one callout per (component, dimension)
            seen.add((cname, dim_name))
            arc = prof.edge(edge_idx)
            world = tf.apply_edge(arc)
            assert not isinstance(world, Line)
            mid = (world.start_angle + world.end_angle) / 2.0
            radial.append(
                RadiusAnnotation(
                    dim=dim_name,
                    value=values[dim_name],
                    unit=dims[dim_name].unit,
                    badge=badge(dim_name),
                    center=world.center,
                    radius=world.radius,
                    anchor_angle=mid,
                )
            )
    return tuple(linear), tuple(radial)
