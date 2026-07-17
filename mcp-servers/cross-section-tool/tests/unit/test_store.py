"""DocumentStore: snapshots store inputs, load replays them (D9, FR-5, T4).

A snapshot is never trusted as geometry: reload re-runs define_dimensions /
add_profile / compose through the same validation the live path uses, so a
corrupt or hand-edited file fails loudly instead of resurrecting stale state.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from xsect.model.errors import StoreError
from xsect.store.documents import DocumentStore

RECT_DIMS = [
    {"name": "w", "unit": "mm", "tier": "measured", "value": 40.0, "source": "caliper"},
    {"name": "h", "unit": "mm", "tier": "measured", "value": 20.0, "source": "caliper"},
]
RECT_OPS = [
    {"op": "start"},
    {"op": "line_to", "x": "w", "y": "h*0"},
    {"op": "line_to", "x": "w", "y": "h"},
    {"op": "line_to", "x": "w*0", "y": "h"},
    {"op": "close"},
]


def _build_doc(store: DocumentStore) -> str:
    rec = store.create("Store Test", "mm")
    rec.model.define_dimensions(list(RECT_DIMS))
    rec.model.add_profile("plate", list(RECT_OPS))
    rec.model.compose([{"name": "P", "profile": "plate", "fixed": True}], [])
    store.snapshot(rec)
    return rec.doc_id


def test_create_assigns_sequential_slug_ids(tmp_path: Path) -> None:
    store = DocumentStore(tmp_path)
    a = store.create("My Housing!", "mm")
    b = store.create("My Housing!", "mm")
    assert a.doc_id == "my-housing-0001"
    assert b.doc_id == "my-housing-0002"
    assert store.list_ids() == [a.doc_id, b.doc_id]


def test_units_other_than_mm_are_rejected(tmp_path: Path) -> None:
    store = DocumentStore(tmp_path)
    with pytest.raises(StoreError, match="mm"):
        store.create("Imperial", "in")


def test_empty_name_is_rejected(tmp_path: Path) -> None:
    store = DocumentStore(tmp_path)
    with pytest.raises(StoreError, match="non-empty"):
        store.create("   ", "mm")


def test_unknown_doc_id_lists_known_ids(tmp_path: Path) -> None:
    store = DocumentStore(tmp_path)
    store.create("Known", "mm")
    with pytest.raises(StoreError, match="known-0001"):
        store.get("nope-9999")


def test_reload_replays_snapshot_and_preserves_geometry(tmp_path: Path) -> None:
    store = DocumentStore(tmp_path)
    doc_id = _build_doc(store)
    before = store.get(doc_id).model.resolve()

    reloaded = DocumentStore(tmp_path)
    assert doc_id in reloaded.list_ids()
    model = reloaded.get(doc_id).model
    assert model.dims["w"].value == 40.0
    assert model.dims["h"].value == 20.0
    assert "plate" in model.profiles
    after = model.resolve()
    assert after.placement_ok
    assert after.bbox == before.bbox
    assert [c.name for c in after.components] == ["P"]


def test_counter_survives_reload(tmp_path: Path) -> None:
    store = DocumentStore(tmp_path)
    store.create("Doc", "mm")  # -> doc-0001
    reloaded = DocumentStore(tmp_path)
    rec = reloaded.create("Doc", "mm")
    assert rec.doc_id == "doc-0002"


def test_mutations_are_snapshotted_and_replayed(tmp_path: Path) -> None:
    store = DocumentStore(tmp_path)
    doc_id = _build_doc(store)
    rec = store.get(doc_id)
    rec.model.update_inputs({"w": 55.0})
    store.snapshot(rec)

    reloaded = DocumentStore(tmp_path)
    model = reloaded.get(doc_id).model
    assert model.dims["w"].value == 55.0
    resolved = model.resolve()
    assert resolved.bbox[2] - resolved.bbox[0] == pytest.approx(55.0)


def test_corrupt_snapshot_fails_loudly(tmp_path: Path) -> None:
    store = DocumentStore(tmp_path)
    doc_id = _build_doc(store)
    snap = tmp_path / "docs" / f"{doc_id}.json"
    data = json.loads(snap.read_text(encoding="utf-8"))
    # Corrupt a stored input in a way the replay validation must catch:
    # a numeric literal inside a profile op violates FR-9.
    data["profiles"]["plate"][1]["x"] = 40.0
    snap.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(StoreError, match="failed to load/replay"):
        DocumentStore(tmp_path)


def test_snapshot_writes_are_atomic_no_temp_residue(tmp_path: Path) -> None:
    store = DocumentStore(tmp_path)
    _build_doc(store)
    leftovers = [p for p in tmp_path.rglob("*") if p.suffix == ".tmp"]
    assert leftovers == []


def test_snapshot_stores_inputs_not_solved_geometry(tmp_path: Path) -> None:
    """The snapshot must contain dimension/op/constraint inputs, never
    transforms or resolved entities (T4: stale geometry is unrepresentable)."""
    store = DocumentStore(tmp_path)
    doc_id = _build_doc(store)
    raw = (tmp_path / "docs" / f"{doc_id}.json").read_text(encoding="utf-8")
    data = json.loads(raw)
    assert set(data) == {
        "schema",
        "doc_id",
        "name",
        "units",
        "dimensions",
        "profiles",
        "components",
        "constraints",
    }
    assert "transforms" not in raw
    # Auto-registered geometry dims (dotted names) are re-derived, not stored.
    assert all("." not in d["name"] for d in data["dimensions"])
