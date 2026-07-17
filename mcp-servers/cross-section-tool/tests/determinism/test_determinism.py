"""Determinism (D15, NFR-1): same inputs => byte-identical SVG, always.

Three axes of "same inputs":
  1. two renders in one process,
  2. a render in a *fresh* interpreter (hash-seed/import-order independence),
  3. a render after a snapshot round-trip through the DocumentStore.

DXF determinism is entity-level, not byte-level: ezdxf stamps Julian-date
headers, so the promise (documented in xsect.export.dxf) is that the decoded
entity set — kinds, layers, coordinates — is identical, and the
content-addressed filename (hash of the canonical entity dump) is identical.
"""

from __future__ import annotations

import hashlib
import subprocess
import sys
from pathlib import Path
from typing import Any

import ezdxf
import pytest

from xsect.export.dxf import export_dxf
from xsect.render.svg import render_svg
from xsect.section import SectionModel
from xsect.solve.slvs import SOLVER_AVAILABLE
from xsect.store.documents import DocumentStore

ROOT = Path(__file__).resolve().parents[2]

# One source of truth for the model, shared verbatim by the in-process build
# and the fresh-subprocess build so the two cannot drift apart.
BUILD_SRC = """
from xsect.section import SectionModel

def build():
    m = SectionModel(name="det", units="mm")
    m.define_dimensions([
        {"name": "od", "unit": "mm", "tier": "measured", "value": 30.0,
         "source": "caliper"},
        {"name": "wall_t", "unit": "mm", "tier": "recalled", "value": 3.0,
         "source": "spec sheet, from memory"},
        {"name": "id_", "unit": "mm", "tier": "derived",
         "relation": "od - 2*wall_t", "regime": "concentric tube"},
        {"name": "full_turn", "unit": "rad", "tier": "derived",
         "relation": "tau", "regime": "closed circle sweep"},
    ])
    m.add_profile("tube", [
        {"op": "start", "x": "od/2", "y": "od*0"},
        {"op": "arc", "radius": "od/2", "sweep": "full_turn", "ref": "outer"},
        {"op": "close"},
        {"op": "start", "x": "id_/2", "y": "id_*0"},
        {"op": "arc", "radius": "id_/2", "sweep": "full_turn", "ref": "bore"},
        {"op": "close"},
        {"op": "symmetry_axis", "axis": "X"},
    ])
    m.compose([{"name": "T", "profile": "tube", "fixed": True}], [])
    return m
"""

_ns: dict[str, Any] = {}
exec(BUILD_SRC, _ns)  # noqa: S102 - our own literal source, shared with subprocess
build = _ns["build"]


def test_svg_bytes_identical_across_repeat_renders() -> None:
    svg1 = render_svg(build().resolve(), annotate=True, hatch=True)
    svg2 = render_svg(build().resolve(), annotate=True, hatch=True)
    assert svg1 == svg2
    assert svg1.encode("utf-8") == svg2.encode("utf-8")


def test_svg_bytes_identical_in_fresh_interpreter() -> None:
    script = BUILD_SRC + (
        "\nimport hashlib\n"
        "from xsect.render.svg import render_svg\n"
        "svg = render_svg(build().resolve(), annotate=True, hatch=True)\n"
        "print(hashlib.sha256(svg.encode('utf-8')).hexdigest())\n"
    )
    local = hashlib.sha256(
        render_svg(build().resolve(), annotate=True, hatch=True).encode("utf-8")
    ).hexdigest()
    proc = subprocess.run(
        [sys.executable, "-c", script],
        cwd=ROOT,
        env={"PYTHONPATH": str(ROOT / "src"), "PATH": "/usr/bin:/bin"},
        capture_output=True,
        text=True,
        timeout=120,
    )
    assert proc.returncode == 0, proc.stderr
    assert proc.stdout.strip() == local


def test_svg_bytes_identical_after_snapshot_reload(tmp_path: Path) -> None:
    store = DocumentStore(tmp_path)
    rec = store.create("det", "mm")
    fresh = build()
    rec.model.define_dimensions(
        [
            {"name": "od", "unit": "mm", "tier": "measured", "value": 30.0,
             "source": "caliper"},
            {"name": "wall_t", "unit": "mm", "tier": "recalled", "value": 3.0,
             "source": "spec sheet, from memory"},
            {"name": "id_", "unit": "mm", "tier": "derived",
             "relation": "od - 2*wall_t", "regime": "concentric tube"},
            {"name": "full_turn", "unit": "rad", "tier": "derived",
             "relation": "tau", "regime": "closed circle sweep"},
        ]
    )
    rec.model.add_profile(
        "tube",
        [
            {"op": "start", "x": "od/2", "y": "od*0"},
            {"op": "arc", "radius": "od/2", "sweep": "full_turn", "ref": "outer"},
            {"op": "close"},
            {"op": "start", "x": "id_/2", "y": "id_*0"},
            {"op": "arc", "radius": "id_/2", "sweep": "full_turn", "ref": "bore"},
            {"op": "close"},
            {"op": "symmetry_axis", "axis": "X"},
        ],
    )
    rec.model.compose([{"name": "T", "profile": "tube", "fixed": True}], [])
    store.snapshot(rec)

    reloaded = DocumentStore(tmp_path).get(rec.doc_id).model
    svg_reloaded = render_svg(reloaded.resolve(), annotate=True, hatch=True)
    svg_fresh = render_svg(fresh.resolve(), annotate=True, hatch=True)
    assert svg_reloaded == svg_fresh


def _canonical_entities(path: Path) -> list[tuple[Any, ...]]:
    doc = ezdxf.readfile(str(path))
    rows: list[tuple[Any, ...]] = []
    for e in doc.modelspace():
        kind = e.dxftype()
        layer = e.dxf.layer
        if kind == "LINE":
            rows.append(
                (
                    kind,
                    layer,
                    round(e.dxf.start.x, 9),
                    round(e.dxf.start.y, 9),
                    round(e.dxf.end.x, 9),
                    round(e.dxf.end.y, 9),
                )
            )
        elif kind == "ARC":
            rows.append(
                (
                    kind,
                    layer,
                    round(e.dxf.center.x, 9),
                    round(e.dxf.center.y, 9),
                    round(e.dxf.radius, 9),
                    round(e.dxf.start_angle, 9),
                    round(e.dxf.end_angle, 9),
                )
            )
        elif kind == "CIRCLE":
            rows.append(
                (
                    kind,
                    layer,
                    round(e.dxf.center.x, 9),
                    round(e.dxf.center.y, 9),
                    round(e.dxf.radius, 9),
                )
            )
        else:  # pragma: no cover - export emits only the three kinds above
            rows.append((kind, layer))
    return sorted(rows)


def test_dxf_entity_identity_and_content_addressed_filename(
    tmp_path: Path,
) -> None:
    out_a = tmp_path / "a"
    out_b = tmp_path / "b"
    out_a.mkdir()
    out_b.mkdir()
    path_a, layers_a, count_a = export_dxf(build().resolve(), out_a, "det")
    path_b, layers_b, count_b = export_dxf(build().resolve(), out_b, "det")
    assert path_a.name == path_b.name, "content hash must be input-determined"
    assert layers_a == layers_b
    assert count_a == count_b > 0
    assert _canonical_entities(path_a) == _canonical_entities(path_b)


@pytest.mark.skipif(not SOLVER_AVAILABLE, reason="python-solvespace not installed")
def test_determinism_holds_through_the_solver_path() -> None:
    """Two-component placement (solver in the loop) must render identically
    across independent builds — FR-13 deterministic branch selection."""

    def build_pair() -> SectionModel:
        m = SectionModel(name="pair", units="mm")
        m.define_dimensions(
            [
                {"name": "w", "unit": "mm", "tier": "measured", "value": 40.0,
                 "source": "caliper"},
                {"name": "h", "unit": "mm", "tier": "measured", "value": 20.0,
                 "source": "caliper"},
                {"name": "gap", "unit": "mm", "tier": "assumed", "value": 55.0,
                 "basis": "clearance guess"},
            ]
        )
        half = [
            {"op": "start"},
            {"op": "line_to", "x": "w*0", "y": "h/2"},
            {"op": "line_to", "x": "w", "y": "h/2"},
            {"op": "line_to", "x": "w", "y": "h*0"},
            {"op": "half_section", "axis": "X"},
        ]
        m.add_profile("a", list(half))
        m.add_profile("b", list(half))
        m.compose(
            [
                {"name": "L", "profile": "a", "fixed": True},
                {"name": "R", "profile": "b"},
            ],
            [
                # The flagship pattern (verified robust on this backend):
                # axis_align pins ty and theta, the projected distance pins tx.
                {"id": "coax", "kind": "axis_align", "a": "R.axis.X",
                 "axis": "X"},
                {"id": "off", "kind": "distance", "a": "L.origin",
                 "b": "R.origin", "dim": "gap", "along": "X"},
            ],
        )
        return m

    r1, r2 = build_pair().resolve(), build_pair().resolve()
    assert r1.placement_ok, r1.constraint_state.message
    assert r2.placement_ok, r2.constraint_state.message
    assert render_svg(r1, annotate=True, hatch=True) == render_svg(
        r2, annotate=True, hatch=True
    )
