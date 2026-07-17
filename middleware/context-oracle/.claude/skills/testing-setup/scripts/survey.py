#!/usr/bin/env python3
"""
Deterministic codebase survey for testing framework setup.

Scans a project directory and produces a JSON manifest describing:
- Language(s) detected (Python, JS/TS, or both)
- Build tool (Vite, Webpack, None, etc.)
- Package manager (npm, yarn, pnpm, pip, poetry, etc.)
- Existing test infrastructure (configs, test dirs, test files)
- Framework hints (React, FastAPI, Express, Flask, etc.)
- Async usage (for pytest-asyncio decision)
- Files worth testing (modules with exports/functions)

Output: JSON to stdout. Agents read this instead of running their own grep.
"""

import json
import os
import re
import sys
from pathlib import Path

SKIP_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv", "env",
    ".tox", ".mypy_cache", ".pytest_cache", "dist", "build",
    ".next", ".nuxt", "coverage", ".coverage", "htmlcov",
    ".eggs", "*.egg-info", ".vite", ".cache",
}

# ── Filesystem helpers ──────────────────────────────────────────────

def walk_project(root: str):
    """Yield (relative_path, filename) for every non-skipped file."""
    root_path = Path(root).resolve()
    for dirpath, dirnames, filenames in os.walk(root_path):
        # Prune skipped directories in-place
        dirnames[:] = [
            d for d in dirnames
            if d not in SKIP_DIRS and not d.endswith(".egg-info")
        ]
        for f in filenames:
            full = Path(dirpath) / f
            rel = full.relative_to(root_path)
            yield str(rel), f


def file_exists(root: str, *candidates: str) -> str | None:
    """Return the first candidate path that exists, or None."""
    for c in candidates:
        if (Path(root) / c).is_file():
            return c
    return None


def read_file(root: str, relpath: str) -> str:
    """Read a file, return empty string on failure."""
    try:
        return (Path(root) / relpath).read_text(encoding="utf-8", errors="replace")
    except (OSError, UnicodeDecodeError):
        return ""


# ── Detectors ───────────────────────────────────────────────────────

def detect_languages(files: list[tuple[str, str]]) -> dict:
    """Count source files by language."""
    py_count = 0
    js_count = 0
    ts_count = 0
    jsx_count = 0
    tsx_count = 0

    for relpath, fname in files:
        # Skip test files themselves
        if _is_test_file(relpath):
            continue
        ext = Path(fname).suffix.lower()
        if ext == ".py":
            py_count += 1
        elif ext == ".js":
            js_count += 1
        elif ext == ".ts":
            ts_count += 1
        elif ext == ".jsx":
            jsx_count += 1
        elif ext == ".tsx":
            tsx_count += 1

    result = {
        "python": py_count,
        "javascript": js_count,
        "typescript": ts_count,
        "jsx": jsx_count,
        "tsx": tsx_count,
    }
    # Summary flags
    result["has_python"] = py_count > 0
    result["has_js_ts"] = (js_count + ts_count + jsx_count + tsx_count) > 0
    result["has_react"] = (jsx_count + tsx_count) > 0
    result["uses_typescript"] = (ts_count + tsx_count) > 0
    return result


def detect_package_manager(root: str) -> dict:
    """Detect JS/TS and Python package managers."""
    result = {
        "js_manager": None,
        "js_install_cmd": None,
        "js_run_cmd": None,
        "python_manager": None,
        "python_install_cmd": None,
    }

    # JS/TS package manager
    if file_exists(root, "pnpm-lock.yaml"):
        result.update(js_manager="pnpm", js_install_cmd="pnpm add -D", js_run_cmd="pnpm")
    elif file_exists(root, "yarn.lock"):
        result.update(js_manager="yarn", js_install_cmd="yarn add -D", js_run_cmd="yarn")
    elif file_exists(root, "bun.lockb", "bun.lock"):
        result.update(js_manager="bun", js_install_cmd="bun add -D", js_run_cmd="bun")
    elif file_exists(root, "package-lock.json", "package.json"):
        result.update(js_manager="npm", js_install_cmd="npm install --save-dev", js_run_cmd="npx")

    # Python package manager
    if file_exists(root, "poetry.lock"):
        result.update(python_manager="poetry", python_install_cmd="poetry add --group dev")
    elif file_exists(root, "Pipfile.lock", "Pipfile"):
        result.update(python_manager="pipenv", python_install_cmd="pipenv install --dev")
    elif file_exists(root, "uv.lock"):
        result.update(python_manager="uv", python_install_cmd="uv add --dev")
    elif file_exists(root, "requirements.txt", "setup.py", "setup.cfg", "pyproject.toml"):
        result.update(python_manager="pip", python_install_cmd="pip install")

    return result


def detect_build_tool(root: str) -> dict:
    """Detect JS build tool — important for vitest vs jest decision."""
    result = {"tool": None, "config_file": None}

    # Check vite
    vite_config = file_exists(
        root, "vite.config.ts", "vite.config.js", "vite.config.mts", "vite.config.mjs"
    )
    if vite_config:
        result["tool"] = "vite"
        result["config_file"] = vite_config
        return result

    # Check package.json for vite dependency
    pkg = _read_package_json(root)
    all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    if "vite" in all_deps:
        result["tool"] = "vite"
        result["config_file"] = None  # No config file yet but vite is a dep
        return result

    # Check webpack
    webpack_config = file_exists(
        root, "webpack.config.js", "webpack.config.ts", "webpack.config.mjs"
    )
    if webpack_config:
        result["tool"] = "webpack"
        result["config_file"] = webpack_config
        return result

    # Check for Next.js, Remix, etc.
    if "next" in all_deps:
        result["tool"] = "next"
    elif "@remix-run/dev" in all_deps:
        result["tool"] = "remix"

    return result


def detect_existing_tests(root: str, files: list[tuple[str, str]]) -> dict:
    """Find any existing test infrastructure."""
    result = {
        "has_test_dir": False,
        "test_dirs": [],
        "test_files": [],
        "test_configs": [],
        "test_runner": None,
    }

    # Check for test directories
    for dirname in ["tests", "test", "__tests__", "spec"]:
        if (Path(root) / dirname).is_dir():
            result["has_test_dir"] = True
            result["test_dirs"].append(dirname)

    # Check for test config files
    config_map = {
        "jest.config.js": "jest",
        "jest.config.ts": "jest",
        "jest.config.mjs": "jest",
        "jest.config.cjs": "jest",
        "jest.config.json": "jest",
        "vitest.config.ts": "vitest",
        "vitest.config.js": "vitest",
        "vitest.config.mts": "vitest",
        "vitest.workspace.ts": "vitest",
        "vitest.workspace.js": "vitest",
        "pytest.ini": "pytest",
        "setup.cfg": None,  # might have pytest section
        "tox.ini": None,  # might have pytest section
        ".nycrc": "jest",  # NYC coverage often paired with jest
    }

    for config_file, runner in config_map.items():
        if file_exists(root, config_file):
            result["test_configs"].append(config_file)
            if runner and not result["test_runner"]:
                result["test_runner"] = runner

    # Check pyproject.toml for pytest config
    pyproject = read_file(root, "pyproject.toml")
    if "[tool.pytest" in pyproject or "[pytest]" in pyproject:
        result["test_configs"].append("pyproject.toml (pytest section)")
        if not result["test_runner"]:
            result["test_runner"] = "pytest"

    # Check package.json for test runner
    pkg = _read_package_json(root)
    all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    if "vitest" in all_deps:
        result["test_runner"] = result["test_runner"] or "vitest"
    elif "jest" in all_deps:
        result["test_runner"] = result["test_runner"] or "jest"

    # Check for test script in package.json
    scripts = pkg.get("scripts", {})
    if "test" in scripts:
        result["existing_test_script"] = scripts["test"]

    # Find test files
    for relpath, fname in files:
        if _is_test_file(relpath):
            result["test_files"].append(relpath)

    return result


def detect_frameworks(root: str) -> dict:
    """Detect application frameworks — affects test setup (providers, clients, etc.)."""
    result = {
        "python_frameworks": [],
        "js_frameworks": [],
    }

    # Python frameworks
    for check_file in ["requirements.txt", "pyproject.toml", "setup.py", "setup.cfg", "Pipfile"]:
        content = read_file(root, check_file)
        if "fastapi" in content.lower():
            result["python_frameworks"].append("fastapi")
        if "flask" in content.lower():
            result["python_frameworks"].append("flask")
        if "django" in content.lower():
            result["python_frameworks"].append("django")
        if "sqlalchemy" in content.lower():
            result["python_frameworks"].append("sqlalchemy")
        if "pydantic" in content.lower():
            result["python_frameworks"].append("pydantic")

    # JS frameworks from package.json
    pkg = _read_package_json(root)
    all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    framework_checks = {
        "react": "react",
        "next": "next.js",
        "vue": "vue",
        "@angular/core": "angular",
        "express": "express",
        "svelte": "svelte",
    }
    for dep, name in framework_checks.items():
        if dep in all_deps:
            result["js_frameworks"].append(name)

    # Deduplicate
    result["python_frameworks"] = list(set(result["python_frameworks"]))
    result["js_frameworks"] = list(set(result["js_frameworks"]))

    return result


def detect_async_usage(root: str, files: list[tuple[str, str]]) -> dict:
    """Check for async patterns in Python code — drives pytest-asyncio decision."""
    result = {"has_async": False, "async_files": []}

    for relpath, fname in files:
        if not fname.endswith(".py"):
            continue
        if _is_test_file(relpath):
            continue
        content = read_file(root, relpath)
        if re.search(r"\basync\s+def\b", content):
            result["has_async"] = True
            result["async_files"].append(relpath)
            if len(result["async_files"]) >= 20:
                break  # Enough to confirm the pattern

    return result


def find_testable_modules(root: str, files: list[tuple[str, str]]) -> dict:
    """Map every source module in the project, categorized by architectural layer.

    Categories:
    - routes: API endpoints, controllers, route handlers
    - services: Business logic, domain logic
    - models: ORM models, schemas, data classes
    - utilities: Pure functions, helpers
    - components: React/Vue/Svelte UI components
    - hooks: React hooks (use* pattern)
    - middleware: Express/FastAPI/Django middleware
    - config: Configuration, settings
    - other: Anything that doesn't fit above
    """
    modules = []

    for relpath, fname in files:
        if _is_test_file(relpath):
            continue

        ext = Path(fname).suffix.lower()
        entry = None

        if ext == ".py":
            content = read_file(root, relpath)
            functions = re.findall(r"^(?:async\s+)?def\s+(\w+)", content, re.MULTILINE)
            classes = re.findall(r"^class\s+(\w+)", content, re.MULTILINE)
            public_funcs = [f for f in functions if not f.startswith("_")]
            if public_funcs or classes:
                entry = {
                    "path": relpath,
                    "language": "python",
                    "functions": public_funcs,
                    "classes": classes,
                    "layer": _classify_layer(relpath, content, "python"),
                }

        elif ext in (".js", ".ts", ".jsx", ".tsx"):
            content = read_file(root, relpath)
            # ESM exports
            exports = re.findall(
                r"export\s+(?:default\s+)?(?:function|const|class|async\s+function)\s+(\w+)",
                content,
            )
            # CommonJS: module.exports = { name1, name2 }
            cjs_match = re.search(r"module\.exports\s*=\s*\{([^}]+)\}", content)
            if cjs_match:
                cjs_names = re.findall(r"\b(\w+)\b", cjs_match.group(1))
                exports.extend(cjs_names)
            # CommonJS: module.exports = functionName
            cjs_single = re.search(r"module\.exports\s*=\s*(\w+)", content)
            if cjs_single and not cjs_match:
                exports.append(cjs_single.group(1))
            named_exports = re.findall(r"exports\.(\w+)\s*=", content)
            exports.extend(named_exports)
            exports = list(dict.fromkeys(exports))
            if exports:
                entry = {
                    "path": relpath,
                    "language": "js_ts",
                    "exports": exports,
                    "layer": _classify_layer(relpath, content, "js_ts"),
                }

        if entry:
            modules.append(entry)

    # Group by layer
    by_layer = {}
    for mod in modules:
        layer = mod["layer"]
        if layer not in by_layer:
            by_layer[layer] = []
        by_layer[layer].append(mod)

    # Sort within each layer: most exports/functions first
    for layer in by_layer:
        by_layer[layer].sort(
            key=lambda x: len(x.get("functions", [])) + len(x.get("classes", [])) + len(x.get("exports", [])),
            reverse=True,
        )

    # Summary stats
    summary = {
        "total_modules": len(modules),
        "by_layer": {layer: len(mods) for layer, mods in by_layer.items()},
        "by_language": {
            "python": sum(1 for m in modules if m["language"] == "python"),
            "js_ts": sum(1 for m in modules if m["language"] == "js_ts"),
        },
    }

    return {"modules": by_layer, "summary": summary}


def _classify_layer(relpath: str, content: str, language: str) -> str:
    """Classify a source file into an architectural layer based on path and content."""
    parts = Path(relpath).parts
    fname = Path(relpath).stem.lower()
    relpath_lower = relpath.lower()

    # Config — check first, these are low-priority for testing
    if fname in ("config", "settings", "constants", "env") or "config/" in relpath_lower:
        return "config"

    # Middleware
    if "middleware" in relpath_lower:
        return "middleware"
    if language == "python" and re.search(r"(class\s+\w+Middleware|async\s+def\s+dispatch)", content):
        return "middleware"

    # Routes / API endpoints
    route_dirs = {"routes", "api", "endpoints", "controllers", "routers", "views"}
    if any(p.lower() in route_dirs for p in parts):
        return "routes"
    if language == "python" and re.search(
        r"(@(?:app|router|api)\.(get|post|put|delete|patch|route)|APIRouter|Blueprint)", content
    ):
        return "routes"
    if language == "js_ts" and re.search(
        r"(router\.(get|post|put|delete|patch|use)|app\.(get|post|put|delete))", content
    ):
        return "routes"

    # Models / Schemas / Data
    model_dirs = {"models", "schemas", "entities", "types"}
    if any(p.lower() in model_dirs for p in parts):
        return "models"
    if language == "python" and re.search(
        r"(DeclarativeBase|BaseModel|class\s+\w+\(.*Model\)|mapped_column|Column\()", content
    ):
        return "models"

    # Hooks (React)
    if "hooks" in relpath_lower or (language == "js_ts" and re.search(r"export\s+(?:function|const)\s+use[A-Z]", content)):
        return "hooks"

    # Components (React/Vue/Svelte)
    component_dirs = {"components", "pages", "views", "screens", "layouts"}
    if any(p.lower() in component_dirs for p in parts):
        return "components"
    if Path(relpath).suffix.lower() in (".jsx", ".tsx") and re.search(r"return\s*\(?\s*<", content):
        return "components"

    # Services / Business logic
    service_dirs = {"services", "service", "business", "domain", "logic", "core", "use_cases", "usecases"}
    if any(p.lower() in service_dirs for p in parts):
        return "services"

    # Utilities
    util_dirs = {"utils", "util", "helpers", "helper", "lib", "common", "shared"}
    if any(p.lower() in util_dirs for p in parts):
        return "utilities"
    # Files that are mostly pure functions (no classes, no route decorators, no models)
    if language == "python":
        funcs = re.findall(r"^def\s+", content, re.MULTILINE)
        classes = re.findall(r"^class\s+", content, re.MULTILINE)
        if len(funcs) >= 3 and len(classes) == 0:
            return "utilities"

    return "other"


# ── Helpers ─────────────────────────────────────────────────────────

def _is_test_file(relpath: str) -> bool:
    """Check if a file path looks like a test file."""
    fname = Path(relpath).name.lower()
    parts = Path(relpath).parts
    # In a test directory
    if any(p in ("tests", "test", "__tests__", "spec") for p in parts):
        return True
    # Named as a test file
    if fname.startswith("test_") or fname.endswith(("_test.py", ".test.js", ".test.ts",
                                                      ".test.jsx", ".test.tsx", ".spec.js",
                                                      ".spec.ts", ".spec.jsx", ".spec.tsx")):
        return True
    if fname == "conftest.py":
        return True
    return False


def _read_package_json(root: str) -> dict:
    """Read and parse package.json, return empty dict on failure."""
    content = read_file(root, "package.json")
    if not content:
        return {}
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {}


# ── Main ────────────────────────────────────────────────────────────

def survey(root: str) -> dict:
    """Run the full survey and return the manifest."""
    root = str(Path(root).resolve())
    files = list(walk_project(root))

    manifest = {
        "project_root": root,
        "languages": detect_languages(files),
        "package_manager": detect_package_manager(root),
        "build_tool": detect_build_tool(root),
        "existing_tests": detect_existing_tests(root, files),
        "frameworks": detect_frameworks(root),
        "async_usage": detect_async_usage(root, files),
        "testable_modules": find_testable_modules(root, files),
    }

    # Derive the recommended test runner
    manifest["recommendation"] = _recommend(manifest)

    return manifest


def _recommend(m: dict) -> dict:
    """Produce a test runner recommendation based on survey results."""
    rec = {"python": None, "js_ts": None, "notes": []}

    # Python recommendation
    if m["languages"]["has_python"]:
        rec["python"] = "pytest"
        extras = ["pytest"]
        if m["async_usage"]["has_async"]:
            extras.append("pytest-asyncio")
            rec["notes"].append("Async code detected — pytest-asyncio required.")
        if "fastapi" in m["frameworks"]["python_frameworks"]:
            extras.append("httpx")  # For TestClient
            rec["notes"].append("FastAPI detected — httpx needed for async test client.")
        extras.append("pytest-cov")
        rec["python_packages"] = extras

    # JS/TS recommendation
    if m["languages"]["has_js_ts"]:
        if m["build_tool"]["tool"] == "vite":
            rec["js_ts"] = "vitest"
            rec["notes"].append("Vite detected — vitest is the correct choice (shares Vite config).")
        elif m["existing_tests"]["test_runner"] == "jest":
            rec["js_ts"] = "jest"
            rec["notes"].append("Existing Jest config found — keeping Jest.")
        elif m["existing_tests"]["test_runner"] == "vitest":
            rec["js_ts"] = "vitest"
            rec["notes"].append("Existing Vitest config found — keeping Vitest.")
        else:
            # No Vite, no existing runner — default to Jest for non-Vite projects
            rec["js_ts"] = "jest"
            rec["notes"].append("No Vite detected — Jest is the standard choice.")

        # React testing library
        if m["languages"]["has_react"]:
            rec["notes"].append("React detected — @testing-library/react + @testing-library/user-event + @testing-library/jest-dom needed.")

    return rec


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    result = survey(target)
    print(json.dumps(result, indent=2))
