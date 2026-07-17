"""Evidence reports: tiers, provenance chains, and the sketch banner (D6, FR-23).

Effective tier is the weakest link of the provenance closure: a dimension's
own tier min-ranked against every transitive input's effective tier. That is
the anti-laundering rule — a derived value computed from an assumed input can
never present as stronger than assumed.

The FR-23 banner fires when any **driving** dimension (profile magnitudes of
composed components, plus distance-constraint dimensions) has an effective
tier of recalled or assumed. Banner wording is this implementation's (the
spec text was not available; flagged in the build report).
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass

from xsect.fmt import fmt
from xsect.model.dimensions import (
    TIER_RANK,
    AssumedProv,
    DerivedProv,
    Dimension,
    SourcedProv,
    Tier,
)

_RANK_TO_TIER = {rank: tier for tier, rank in TIER_RANK.items()}


@dataclass(frozen=True)
class EvidenceRow:
    name: str
    value: float
    unit: str
    tier: Tier
    effective_tier: Tier
    provenance: str
    chain: tuple[str, ...]
    driving: bool

    def to_dict(self) -> dict[str, object]:
        return {
            "name": self.name,
            "value": self.value,
            "unit": self.unit,
            "tier": self.tier.value,
            "effective_tier": self.effective_tier.value,
            "provenance": self.provenance,
            "chain": list(self.chain),
            "driving": self.driving,
        }


@dataclass(frozen=True)
class EvidenceReport:
    rows: tuple[EvidenceRow, ...]
    sketch: bool
    sketch_dims: tuple[str, ...]
    banner_text: str | None

    def row(self, name: str) -> EvidenceRow:
        for r in self.rows:
            if r.name == name:
                return r
        raise KeyError(name)

    def to_dict(self) -> dict[str, object]:
        return {
            "rows": [r.to_dict() for r in self.rows],
            "sketch": self.sketch,
            "sketch_dims": list(self.sketch_dims),
            "banner_text": self.banner_text,
        }

    def to_text(self) -> str:
        lines: list[str] = []
        if self.banner_text:
            lines.append(self.banner_text)
            lines.append("")
        lines.append("Evidence (tier / effective):")
        for r in self.rows:
            eff = (
                ""
                if r.effective_tier is r.tier
                else f" -> effective {r.effective_tier.value}"
            )
            drv = " [driving]" if r.driving else ""
            lines.append(
                f"  {r.name} = {fmt(r.value)} {r.unit}  "
                f"[{r.tier.value}{eff}]{drv}  {r.provenance}"
            )
            for link in r.chain:
                lines.append(f"      {link}")
        return "\n".join(lines)


def _prov_text(dim: Dimension) -> str:
    p = dim.provenance
    if isinstance(p, DerivedProv):
        return f"= {p.relation_expr}  (regime: {p.regime})"
    if isinstance(p, SourcedProv):
        return f"(source: {p.source})"
    assert isinstance(p, AssumedProv)
    return f"(basis: {p.basis})" if p.basis else "(no stated basis)"


def build_evidence(
    dims: Mapping[str, Dimension], driving: Iterable[str]
) -> EvidenceReport:
    driving_set = frozenset(driving)
    memo: dict[str, Tier] = {}

    def effective(name: str) -> Tier:
        if name in memo:
            return memo[name]
        dim = dims[name]
        rank = TIER_RANK[dim.tier]
        if isinstance(dim.provenance, DerivedProv):
            for inp in dim.provenance.inputs:
                rank = min(rank, TIER_RANK[effective(inp)])
        memo[name] = _RANK_TO_TIER[rank]
        return memo[name]

    rows: list[EvidenceRow] = []
    for name in sorted(dims):
        dim = dims[name]
        chain: list[str] = []
        if isinstance(dim.provenance, DerivedProv):
            for inp in dim.provenance.inputs:
                d2 = dims[inp]
                chain.append(
                    f"<- {inp} = {fmt(d2.value)} {d2.unit} "
                    f"[{effective(inp).value}] {_prov_text(d2)}"
                )
        rows.append(
            EvidenceRow(
                name=name,
                value=dim.value,
                unit=dim.unit,
                tier=dim.tier,
                effective_tier=effective(name),
                provenance=_prov_text(dim),
                chain=tuple(chain),
                driving=name in driving_set,
            )
        )

    weak = sorted(
        n
        for n in driving_set
        if n in dims and TIER_RANK[effective(n)] <= TIER_RANK[Tier.RECALLED]
    )
    banner = None
    if weak:
        parts = ", ".join(f"{n} [{effective(n).value}]" for n in weak)
        banner = (
            "\u26a0 SKETCH \u2014 driving dimensions rest on recalled/assumed "
            f"values: {parts}. Geometry is illustrative, not to scale for "
            "engineering use, until these are measured or derived (FR-23)."
        )
    return EvidenceReport(
        rows=tuple(rows),
        sketch=bool(weak),
        sketch_dims=tuple(weak),
        banner_text=banner,
    )
