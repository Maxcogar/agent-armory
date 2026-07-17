"""Document registry + JSON snapshots (D12/D15).

Snapshots store **inputs, not geometry**: dimensions (with tier/provenance),
profile ops, components, constraints. On load the model is reconstructed by
replaying those inputs through the same validated mutation paths, so a
snapshot that no longer validates fails loudly instead of resurrecting stale
geometry.

* ``doc_id = <slug>-<counter>`` — the counter persists in ``registry.json``,
  so ids are deterministic given the call sequence and survive restarts.
* Writes are atomic (temp file + ``os.replace``); one lock per document
  serializes mutations, a store lock serializes creation.
"""

from __future__ import annotations

import json
import os
import re
import threading
from dataclasses import dataclass, field
from pathlib import Path

from xsect.model.dimensions import (
    AssumedProv,
    DerivedProv,
    Dimension,
    SourcedProv,
)
from xsect.model.errors import StoreError
from xsect.section import SectionModel

SCHEMA_VERSION = 1
_SLUG_RE = re.compile(r"[^a-z0-9]+")


def slugify(name: str) -> str:
    return _SLUG_RE.sub("-", name.lower()).strip("-") or "section"


def _dim_to_json(dim: Dimension) -> dict[str, object]:
    out: dict[str, object] = {
        "name": dim.name,
        "unit": dim.unit,
        "tier": dim.tier.value,
    }
    p = dim.provenance
    if isinstance(p, DerivedProv):
        out["relation"] = p.relation_expr
        out["regime"] = p.regime
    elif isinstance(p, SourcedProv):
        out["value"] = dim.value
        out["source"] = p.source
    else:
        assert isinstance(p, AssumedProv)
        out["value"] = dim.value
        if p.basis is not None:
            out["basis"] = p.basis
    return out


@dataclass
class DocumentRecord:
    doc_id: str
    model: SectionModel
    lock: threading.RLock = field(default_factory=threading.RLock)


class DocumentStore:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = Path(data_dir)
        self.docs_dir = self.data_dir / "docs"
        self.exports_dir = self.data_dir / "exports"
        self.docs_dir.mkdir(parents=True, exist_ok=True)
        self.exports_dir.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._records: dict[str, DocumentRecord] = {}
        self._counter = self._load_counter()
        self._load_all()

    # ---- registry -----------------------------------------------------------

    def _registry_path(self) -> Path:
        return self.data_dir / "registry.json"

    def _load_counter(self) -> int:
        path = self._registry_path()
        if not path.exists():
            return 0
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return int(data.get("counter", 0))
        except (OSError, ValueError) as exc:
            raise StoreError(f"registry file {path} is unreadable: {exc}") from exc

    def _save_counter(self) -> None:
        _atomic_write(
            self._registry_path(),
            json.dumps({"schema": SCHEMA_VERSION, "counter": self._counter}),
        )

    def _load_all(self) -> None:
        for path in sorted(self.docs_dir.glob("*.json")):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                record = _record_from_snapshot(data)
            except StoreError:
                raise
            except Exception as exc:
                raise StoreError(
                    f"snapshot {path.name} failed to load/replay: {exc}. Fix or "
                    "remove the file; stale geometry is never resurrected "
                    "silently."
                ) from exc
            self._records[record.doc_id] = record

    # ---- API ------------------------------------------------------------------

    def create(self, name: str, units: str) -> DocumentRecord:
        if units != "mm":
            raise StoreError(
                f"units {units!r} are not supported in v1: internal math is "
                "millimetres/radians. Pass units='mm' (label angle dimensions "
                "rad/deg and use deg() in expressions)."
            )
        if not isinstance(name, str) or not name.strip():
            raise StoreError("document name must be a non-empty string.")
        with self._lock:
            self._counter += 1
            doc_id = f"{slugify(name)}-{self._counter:04d}"
            record = DocumentRecord(doc_id=doc_id, model=SectionModel(name=name, units=units))
            self._records[doc_id] = record
            self._save_counter()
            self._snapshot(record)
            return record

    def get(self, doc_id: str) -> DocumentRecord:
        try:
            return self._records[doc_id]
        except KeyError:
            raise StoreError(
                f"unknown doc_id {doc_id!r}. Known: "
                f"{sorted(self._records) or 'none'} — create one with "
                "xsect_create_document."
            ) from None

    def list_ids(self) -> list[str]:
        return sorted(self._records)

    def snapshot(self, record: DocumentRecord) -> None:
        self._snapshot(record)

    def _snapshot(self, record: DocumentRecord) -> None:
        m = record.model
        data = {
            "schema": SCHEMA_VERSION,
            "doc_id": record.doc_id,
            "name": m.name,
            "units": m.units,
            "dimensions": [
                _dim_to_json(d) for n, d in sorted(m.dims.items()) if "." not in n
            ],
            "profiles": {name: ops for name, ops in m.profiles.items()},
            "components": m.components,
            "constraints": m.constraints,
        }
        _atomic_write(self.docs_dir / f"{record.doc_id}.json", json.dumps(data, indent=1))


def _record_from_snapshot(data: dict[str, object]) -> DocumentRecord:
    if data.get("schema") != SCHEMA_VERSION:
        raise StoreError(
            f"snapshot schema {data.get('schema')!r} is not supported "
            f"(expected {SCHEMA_VERSION})."
        )
    doc_id = str(data["doc_id"])
    model = SectionModel(name=str(data["name"]), units=str(data.get("units", "mm")))
    dims = data.get("dimensions", [])
    profiles = data.get("profiles", {})
    components = data.get("components", [])
    constraints = data.get("constraints", [])
    if (
        not isinstance(dims, list)
        or not isinstance(profiles, dict)
        or not isinstance(components, list)
        or not isinstance(constraints, list)
    ):
        raise StoreError(
            "snapshot fields have the wrong shapes: dimensions/components/"
            "constraints must be lists and profiles an object."
        )
    if dims:
        model.define_dimensions(list(dims))  # replay through validation
    for pname, ops in profiles.items():
        if not isinstance(ops, list):
            raise StoreError(f"snapshot profile {pname!r} ops must be a list.")
        model.add_profile(str(pname), ops)
    if components:
        model.compose(components, constraints)
    return DocumentRecord(doc_id=doc_id, model=model)


def _atomic_write(path: Path, text: str) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    try:
        tmp.write_text(text, encoding="utf-8")
        os.replace(tmp, path)
    except OSError as exc:
        raise StoreError(f"failed to write {path}: {exc}") from exc
