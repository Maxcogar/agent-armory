"""Dimensions, tiers, and provenance records (D6, FR-1/FR-2).

The tier vocabulary is fixed by FR-1 via [MES]: ``measured > derived >
recalled > assumed``. Provenance is a tagged union: derived dimensions carry
relation + inputs + regime; measured/recalled carry a source; assumed carries
an optional basis. **Structural validation only** — whether a tier assignment
or a source is *justified* is the caller's engineering judgment (the
epistemology twin of C-2); the tool validates shape, never truth.
"""

from __future__ import annotations

import enum
import math
import re
from dataclasses import dataclass

from xsect.model.errors import DerivationError
from xsect.model.expressions import RESERVED_NAMES, is_bare_name


class Tier(enum.Enum):
    MEASURED = "measured"
    DERIVED = "derived"
    RECALLED = "recalled"
    ASSUMED = "assumed"


#: [MES] ordering: higher rank = stronger evidence. Effective tier = min rank
#: over the provenance chain (weakest link; anti-laundering rule, D6).
TIER_RANK: dict[Tier, int] = {
    Tier.MEASURED: 3,
    Tier.DERIVED: 2,
    Tier.RECALLED: 1,
    Tier.ASSUMED: 0,
}

#: Single-letter badges for annotations (D9).
TIER_BADGE: dict[Tier, str] = {
    Tier.MEASURED: "M",
    Tier.DERIVED: "D",
    Tier.RECALLED: "R",
    Tier.ASSUMED: "A",
}


@dataclass(frozen=True)
class DerivedProv:
    """FR-2: relation expression, referenced inputs, and validity regime."""

    relation_expr: str
    inputs: tuple[str, ...]
    regime: str


@dataclass(frozen=True)
class SourcedProv:
    """Provenance for measured and recalled dimensions: the source (FR-2)."""

    source: str


@dataclass(frozen=True)
class AssumedProv:
    """Provenance for assumed dimensions: optional stated basis."""

    basis: str | None = None


Provenance = DerivedProv | SourcedProv | AssumedProv


#: Caller-facing dimension names: plain identifiers. Auto-registered
#: dimensions (D7) use dotted names, constructed only internally — dotted
#: names cannot appear in expressions (the grammar's Name node cannot contain
#: a dot), which is what keeps auto dims leaves of the DAG.
_AUTO_NAME_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$")


@dataclass(frozen=True)
class Dimension:
    """A named, unit-labelled, tiered value with provenance (FR-1/FR-2).

    The name is the identifier (unique per document). ``value`` for derived
    dimensions is computed by the derivation layer, never supplied.
    """

    name: str
    unit: str
    value: float
    tier: Tier
    provenance: Provenance


def validate_caller_name(name: str) -> None:
    if not is_bare_name(name):
        raise DerivationError(
            f"dimension name {name!r} is invalid. Names must match "
            "[A-Za-z_][A-Za-z0-9_]* so they can be referenced in relations."
        )
    if name in RESERVED_NAMES:
        raise DerivationError(
            f"dimension name {name!r} collides with a reserved expression "
            f"function or constant. Reserved: {', '.join(sorted(RESERVED_NAMES))}."
        )


def validate_dimension(dim: Dimension, *, auto: bool = False) -> None:
    """Structural validation of a dimension record (D6).

    Rejects tier/provenance shape mismatches and non-finite values. ``auto``
    permits the dotted names of auto-registered geometry dimensions (D7).
    """
    if auto:
        if not _AUTO_NAME_RE.match(dim.name):
            raise DerivationError(
                f"auto-registered dimension name {dim.name!r} is malformed."
            )
    else:
        validate_caller_name(dim.name)
    if not dim.unit or not isinstance(dim.unit, str):
        raise DerivationError(
            f"dimension {dim.name!r} has no unit. Every dimension carries an "
            "explicit unit label (canonical length unit is mm; angles rad/deg)."
        )
    if not isinstance(dim.value, float) or not math.isfinite(dim.value):
        raise DerivationError(
            f"dimension {dim.name!r} has a non-finite value {dim.value!r}."
        )
    tier, prov = dim.tier, dim.provenance
    if tier is Tier.DERIVED:
        if not isinstance(prov, DerivedProv):
            raise DerivationError(
                f"dimension {dim.name!r} is tier 'derived' but has no relation. "
                "Derived dimensions require relation_expr, inputs, and regime (FR-2)."
            )
        if not prov.relation_expr.strip():
            raise DerivationError(
                f"derived dimension {dim.name!r} has an empty relation_expr."
            )
        if not prov.regime.strip():
            raise DerivationError(
                f"derived dimension {dim.name!r} has an empty regime. State the "
                "validity regime of the governing relation (FR-2)."
            )
    elif tier in (Tier.MEASURED, Tier.RECALLED):
        if not isinstance(prov, SourcedProv) or not prov.source.strip():
            raise DerivationError(
                f"dimension {dim.name!r} is tier '{tier.value}' but has no source. "
                "Measured and recalled dimensions require a non-empty source (FR-2)."
            )
    else:  # ASSUMED
        if not isinstance(prov, AssumedProv):
            raise DerivationError(
                f"dimension {dim.name!r} is tier 'assumed' but carries "
                f"{type(prov).__name__} provenance. Assumed dimensions carry an "
                "optional basis only."
            )
