"""Derivation DAG over dimensions (D6; FR-3/FR-4/FR-5).

Edges come from each derived dimension's relation expression — the expression
engine's referenced-name set is the single source of truth for ``inputs``
(a caller-supplied inputs list, if present, is cross-checked and must match).
Cycles are rejected via :class:`graphlib.CycleError`. On any input change,
every dependent re-evaluates in topological order and a
:class:`RederivationReport` records exactly what moved (FR-4).

There is deliberately **no** function here that writes a value into a derived
dimension: derived values exist only as evaluation results (FR-3 at the model
level).
"""

from __future__ import annotations

import graphlib
from collections.abc import Mapping
from dataclasses import dataclass, replace

from xsect.model.dimensions import DerivedProv, Dimension, Tier, validate_dimension
from xsect.model.errors import DerivationError
from xsect.model.expressions import Expr, evaluate, parse


@dataclass(frozen=True)
class RederivationReport:
    """FR-4 report: every value that changed, and the evaluation order used."""

    changed: tuple[tuple[str, float, float], ...]  # (name, old, new)
    order: tuple[str, ...]  # topological evaluation order of derived dims


def parse_relation(dim: Dimension) -> Expr:
    assert isinstance(dim.provenance, DerivedProv)
    return parse(dim.provenance.relation_expr)


def build_order(dims: Mapping[str, Dimension]) -> tuple[str, ...]:
    """Validate the DAG and return the topological order of derived dims.

    Raises :class:`DerivationError` on unknown inputs or cycles (with the
    cycle members named).
    """
    sorter: graphlib.TopologicalSorter[str] = graphlib.TopologicalSorter()
    relation_names: dict[str, frozenset[str]] = {}
    for name, dim in dims.items():
        if dim.tier is Tier.DERIVED:
            assert isinstance(dim.provenance, DerivedProv)
            expr = parse_relation(dim)
            relation_names[name] = expr.names
            recorded = frozenset(dim.provenance.inputs)
            if recorded != expr.names:
                raise DerivationError(
                    f"derived dimension {name!r}: recorded inputs "
                    f"{sorted(recorded)} do not match the relation's referenced "
                    f"names {sorted(expr.names)}. Inputs are extracted from the "
                    "relation; omit them or make them match."
                )
            for inp in expr.names:
                if inp not in dims:
                    raise DerivationError(
                        f"derived dimension {name!r} references unknown input "
                        f"{inp!r}. Define it with xsect_define_dimensions first."
                    )
            sorter.add(name, *sorted(expr.names))
        else:
            sorter.add(name)
    try:
        full_order = tuple(sorter.static_order())
    except graphlib.CycleError as exc:
        cycle = exc.args[1] if len(exc.args) > 1 else ()
        raise DerivationError(
            f"derivation cycle rejected: {' -> '.join(cycle)}. Relations must "
            "form a DAG; break the cycle by re-deriving one member from "
            "independent inputs."
        ) from exc
    return tuple(n for n in full_order if dims[n].tier is Tier.DERIVED)


def evaluate_all(dims: Mapping[str, Dimension]) -> dict[str, Dimension]:
    """Return a new mapping with every derived value computed in topo order."""
    order = build_order(dims)
    out: dict[str, Dimension] = dict(dims)
    for name in order:
        expr = parse_relation(out[name])
        env = {n: out[n].value for n in expr.names}
        value = evaluate(expr, env)
        out[name] = replace(out[name], value=value)
        validate_dimension(out[name], auto="." in name)
    return out


def rederive(
    dims: Mapping[str, Dimension], changes: Mapping[str, float]
) -> tuple[dict[str, Dimension], RederivationReport]:
    """Apply input changes and re-evaluate all dependents (FR-4).

    ``changes`` may target only non-derived dimensions — derived values are
    computed, never supplied (FR-3).
    """
    working: dict[str, Dimension] = dict(dims)
    changed: list[tuple[str, float, float]] = []
    for name, new_value in changes.items():
        if name not in working:
            raise DerivationError(
                f"cannot update {name!r}: no such dimension. Define it first."
            )
        dim = working[name]
        if dim.tier is Tier.DERIVED:
            raise DerivationError(
                f"cannot update {name!r}: it is a derived dimension. Derived "
                "values are computed from their relation (FR-3/FR-4); update "
                "its inputs instead."
            )
        value = float(new_value)
        candidate = replace(dim, value=value)
        validate_dimension(candidate, auto="." in name)
        if value != dim.value:
            changed.append((name, dim.value, value))
        working[name] = candidate

    order = build_order(working)
    for name in order:
        expr = parse_relation(working[name])
        env = {n: working[n].value for n in expr.names}
        old = working[name].value
        new = evaluate(expr, env)
        if new != old:
            changed.append((name, old, new))
        working[name] = replace(working[name], value=new)
    return working, RederivationReport(changed=tuple(changed), order=order)
