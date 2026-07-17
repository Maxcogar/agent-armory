"""Layering contract (D2): enforced structurally, not by convention.

    server -> {store, report, render, export, section} -> solve -> model

* ``xsect.model`` and ``xsect.fmt`` import only the stdlib (and xsect.model
  internally) — the math core must run anywhere, dependency-free.
* ``xsect.render`` / ``xsect.export`` / ``xsect.report`` never import
  ``xsect.solve`` (they consume ResolvedSection, never the solver).
* ``xsect.solve`` never imports render/export/report/store/server/section.
* ``fastmcp`` appears only under ``xsect.server``.

The test walks every module's AST, so a violating import fails CI even if it
is inside ``if TYPE_CHECKING`` or a function body.
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src" / "xsect"
STDLIB = set(sys.stdlib_module_names)


def _module_name(path: Path) -> str:
    rel = path.relative_to(SRC.parent)  # e.g. xsect/model/geometry.py
    parts = list(rel.with_suffix("").parts)
    if parts[-1] == "__init__":
        parts = parts[:-1]
    return ".".join(parts)


def _imports(path: Path) -> set[str]:
    """Absolute roots of everything a module imports."""
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    mod = _module_name(path)
    out: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            out.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            if node.level == 0:
                if node.module:
                    out.add(node.module)
            else:
                # Resolve relative imports against this module's package.
                pkg = mod.split(".")[: -node.level] if "." in mod else []
                base = ".".join(pkg)
                target = f"{base}.{node.module}" if node.module else base
                out.add(target)
    return out


def _all_modules() -> dict[str, set[str]]:
    return {
        _module_name(p): _imports(p)
        for p in sorted(SRC.rglob("*.py"))
    }


MODULES = _all_modules()


def _violations(prefix: str, forbidden: tuple[str, ...]) -> list[str]:
    bad: list[str] = []
    for mod, imps in MODULES.items():
        if not mod.startswith(prefix):
            continue
        for imp in imps:
            if any(imp == f or imp.startswith(f + ".") for f in forbidden):
                bad.append(f"{mod} imports {imp}")
    return bad


def test_source_tree_is_where_this_test_expects() -> None:
    assert SRC.is_dir(), f"expected package at {SRC}"
    assert "xsect.model.geometry" in MODULES


def test_model_and_fmt_are_stdlib_only() -> None:
    offenders: list[str] = []
    for mod, imps in MODULES.items():
        if not (mod.startswith("xsect.model") or mod == "xsect.fmt"):
            continue
        for imp in imps:
            root = imp.split(".")[0]
            if root in STDLIB:
                continue
            if imp.startswith("xsect.model"):
                continue
            offenders.append(f"{mod} imports {imp}")
    assert offenders == [], f"model layer must stay stdlib-only: {offenders}"


def test_render_export_report_never_import_solve() -> None:
    forbidden = ("xsect.solve", "xsect.server", "fastmcp")
    bad = (
        _violations("xsect.render", forbidden)
        + _violations("xsect.export", forbidden)
        + _violations("xsect.report", forbidden)
    )
    assert bad == [], bad


def test_solve_never_imports_upper_layers() -> None:
    forbidden = (
        "xsect.render",
        "xsect.export",
        "xsect.report",
        "xsect.store",
        "xsect.server",
        "xsect.section",
        "fastmcp",
    )
    assert _violations("xsect.solve", forbidden) == []


def test_fastmcp_only_appears_in_server_layer() -> None:
    offenders = [
        f"{mod} imports {imp}"
        for mod, imps in MODULES.items()
        if not mod.startswith("xsect.server")
        for imp in imps
        if imp == "fastmcp" or imp.startswith("fastmcp.")
    ]
    assert offenders == []


def test_store_never_imports_render_export_or_server() -> None:
    forbidden = ("xsect.render", "xsect.export", "xsect.server", "fastmcp")
    assert _violations("xsect.store", forbidden) == []
