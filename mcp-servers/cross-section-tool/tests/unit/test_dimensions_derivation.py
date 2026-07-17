"""FR-1..FR-5: tier/provenance shapes, DAG evaluation, rederivation."""

import pytest

from xsect.model.derivation import build_order, evaluate_all, rederive
from xsect.model.dimensions import (
    AssumedProv,
    DerivedProv,
    Dimension,
    SourcedProv,
    Tier,
    validate_dimension,
)
from xsect.model.errors import DerivationError


def dim(name: str, tier: Tier, value: float = 0.0, **kw: object) -> Dimension:
    prov: object
    if tier is Tier.DERIVED:
        prov = DerivedProv(
            relation_expr=str(kw.get("relation", "")),
            inputs=tuple(kw.get("inputs", ())),  # type: ignore[arg-type]
            regime=str(kw.get("regime", "test regime")),
        )
    elif tier in (Tier.MEASURED, Tier.RECALLED):
        prov = SourcedProv(source=str(kw.get("source", "caliper")))
    else:
        prov = AssumedProv(basis=kw.get("basis"))  # type: ignore[arg-type]
    return Dimension(
        name=name, unit=str(kw.get("unit", "mm")), value=value, tier=tier,
        provenance=prov,
    )


def test_shape_validation_per_tier() -> None:
    validate_dimension(dim("a", Tier.MEASURED, 1.0))
    validate_dimension(dim("b", Tier.ASSUMED, 1.0))
    with pytest.raises(DerivationError, match="source"):
        validate_dimension(
            Dimension("c", "mm", 1.0, Tier.MEASURED, AssumedProv())
        )
    with pytest.raises(DerivationError, match="relation"):
        validate_dimension(
            Dimension("d", "mm", 1.0, Tier.DERIVED, SourcedProv("x"))
        )
    with pytest.raises(DerivationError, match="regime"):
        validate_dimension(dim("e", Tier.DERIVED, relation="a+1", inputs=("a",), regime=" "))
    with pytest.raises(DerivationError, match="unit"):
        validate_dimension(Dimension("f", "", 1.0, Tier.MEASURED, SourcedProv("x")))
    with pytest.raises(DerivationError, match="reserved"):
        validate_dimension(dim("sin", Tier.MEASURED, 1.0))
    with pytest.raises(DerivationError, match="invalid"):
        validate_dimension(dim("not a name", Tier.MEASURED, 1.0))


def test_topological_evaluation() -> None:
    dims = {
        "od": dim("od", Tier.MEASURED, 50.0),
        "wall_t": dim("wall_t", Tier.ASSUMED, 3.0),
        "idr": dim("idr", Tier.DERIVED, relation="od/2 - wall_t", inputs=("od", "wall_t")),
        "area": dim("area", Tier.DERIVED, relation="pi * idr**2", inputs=("idr",)),
    }
    out = evaluate_all(dims)
    assert out["idr"].value == 22.0
    assert out["area"].value == pytest.approx(3.141592653589793 * 484.0)


def test_cycle_rejected_with_members_named() -> None:
    dims = {
        "x": dim("x", Tier.DERIVED, relation="y+1", inputs=("y",)),
        "y": dim("y", Tier.DERIVED, relation="x+1", inputs=("x",)),
    }
    with pytest.raises(DerivationError, match="cycle") as ei:
        build_order(dims)
    assert "x" in str(ei.value) and "y" in str(ei.value)


def test_inputs_must_match_relation() -> None:
    dims = {
        "a": dim("a", Tier.MEASURED, 1.0),
        "b": dim("b", Tier.DERIVED, relation="a*2", inputs=("a", "phantom")),
    }
    with pytest.raises(DerivationError, match="do not match"):
        build_order(dims)


def test_unknown_input_rejected() -> None:
    dims = {"b": dim("b", Tier.DERIVED, relation="ghost*2", inputs=("ghost",))}
    with pytest.raises(DerivationError, match="ghost"):
        build_order(dims)


def test_rederive_reports_every_change_and_blocks_derived_targets() -> None:
    dims = evaluate_all(
        {
            "od": dim("od", Tier.MEASURED, 50.0),
            "wall_t": dim("wall_t", Tier.ASSUMED, 3.0),
            "idr": dim("idr", Tier.DERIVED, relation="od/2 - wall_t", inputs=("od", "wall_t")),
        }
    )
    out, report = rederive(dims, {"od": 60.0})
    assert out["idr"].value == 27.0
    assert ("od", 50.0, 60.0) in report.changed
    assert ("idr", 22.0, 27.0) in report.changed
    assert report.order == ("idr",)
    with pytest.raises(DerivationError, match="derived"):
        rederive(dims, {"idr": 99.0})
    with pytest.raises(DerivationError, match="no such"):
        rederive(dims, {"ghost": 1.0})
