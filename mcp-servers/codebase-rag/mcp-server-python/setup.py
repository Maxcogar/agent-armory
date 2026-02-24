"""Project setup: detection, pattern scanning, and file generation."""

import json
import os
import sys
from dataclasses import dataclass
from typing import Optional, List, Dict, Any

import yaml

from config import (
    ProjectContext,
    ProjectConfig,
    DEFAULT_CONFIG,
    chroma_db_path,
    write_config,
)
from utils.paths import (
    directory_exists,
    file_exists,
    ensure_dir,
    normalize_path,
)


# ============================================================
# Frontend / Backend Detection
# ============================================================

FRONTEND_MARKERS = ["react", "vue", "angular", "svelte", "vite", "next", "nuxt"]
BACKEND_MARKERS = ["express", "fastify", "koa", "hapi", "django", "flask", "fastapi", "gin"]
FRONTEND_DIRS = ["frontend", "client", "web", "app", "src"]
BACKEND_DIRS = ["backend", "server", "api"]


def _has_frontend_package_json(dir_path: str) -> bool:
    pkg_path = os.path.join(dir_path, "package.json")
    if not file_exists(pkg_path):
        return False
    try:
        with open(pkg_path, "r", encoding="utf-8") as f:
            pkg = json.load(f)
        all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        return any(
            marker in dep_name
            for marker in FRONTEND_MARKERS
            for dep_name in all_deps
        )
    except Exception as e:
        sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to read {pkg_path}: {e}\n")
        return False


def _has_backend_markers(dir_path: str) -> bool:
    # Check package.json for backend deps
    pkg_path = os.path.join(dir_path, "package.json")
    if file_exists(pkg_path):
        try:
            with open(pkg_path, "r", encoding="utf-8") as f:
                pkg = json.load(f)
            all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            if any(
                marker in dep_name
                for marker in BACKEND_MARKERS
                for dep_name in all_deps
            ):
                return True
        except Exception as e:
            sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to read {pkg_path}: {e}\n")

    # Check for Python or Go markers
    if file_exists(os.path.join(dir_path, "requirements.txt")):
        return True
    if file_exists(os.path.join(dir_path, "go.mod")):
        return True
    if file_exists(os.path.join(dir_path, "Cargo.toml")):
        return True
    return False


def detect_frontend(project_root: str) -> Optional[str]:
    for dir_name in FRONTEND_DIRS:
        candidate = os.path.join(project_root, dir_name)
        if directory_exists(candidate) and _has_frontend_package_json(candidate):
            return dir_name
    if _has_frontend_package_json(project_root):
        return "."
    return None


def detect_backend(project_root: str) -> Optional[str]:
    for dir_name in BACKEND_DIRS:
        candidate = os.path.join(project_root, dir_name)
        if directory_exists(candidate) and _has_backend_markers(candidate):
            return dir_name
    if _has_backend_markers(project_root):
        return "."
    return None


# ============================================================
# Pattern Scanning
# ============================================================


@dataclass
class DetectedPatterns:
    middleware: List[str]
    response_format: Optional[str]
    frontend_imports: List[str]


def scan_backend_patterns(project_root: str, backend_path: Optional[str]) -> Dict[str, Any]:
    result: Dict[str, Any] = {"middleware": [], "responseFormat": None}
    if not backend_path:
        return result

    routes_dir = os.path.join(project_root, backend_path, "routes")
    middleware_dir = os.path.join(project_root, backend_path, "middleware")

    # Detect middleware
    if directory_exists(middleware_dir):
        try:
            files = os.listdir(middleware_dir)
            result["middleware"] = [
                os.path.splitext(f)[0]
                for f in files
                if f.endswith((".js", ".ts"))
            ]
        except Exception as e:
            sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to read middleware dir: {e}\n")

    # Detect response format from first route file
    if directory_exists(routes_dir):
        try:
            files = [f for f in os.listdir(routes_dir) if f.endswith((".js", ".ts"))]
            if files:
                with open(os.path.join(routes_dir, files[0]), "r", encoding="utf-8") as f:
                    content = f.read()
                if "success: true" in content and "success: false" in content:
                    result["responseFormat"] = "success_data_error"
                elif "status:" in content and "data:" in content:
                    result["responseFormat"] = "status_data"
        except Exception as e:
            sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to scan route files: {e}\n")

    return result


def scan_frontend_patterns(project_root: str, frontend_path: Optional[str]) -> Dict[str, Any]:
    result: Dict[str, Any] = {"frontendImports": []}
    if not frontend_path:
        return result

    src_dir = os.path.join(project_root, frontend_path, "src")
    components_dir = os.path.join(src_dir, "components")

    if directory_exists(components_dir):
        try:
            import re
            files = [
                f for f in os.listdir(components_dir)
                if re.match(r".*\.[jt]sx?$", f)
            ]
            import_paths: set[str] = set()
            for file_name in files[:5]:
                with open(os.path.join(components_dir, file_name), "r", encoding="utf-8") as f:
                    content = f.read()
                matches = re.findall(r"""from\s+['"](@/[^'"]+|\.\./[^'"]+)['"]""", content)
                for imp in matches:
                    if imp.startswith("@/"):
                        import_paths.add("@/")
                    elif imp.startswith("../"):
                        import_paths.add("../")
                    elif imp.startswith("./"):
                        import_paths.add("./")
            result["frontendImports"] = list(import_paths)
        except Exception as e:
            sys.stderr.write(f"[codebase_rag_mcp] Warning: failed to scan frontend components: {e}\n")

    return result


# ============================================================
# Architecture File Generation
# ============================================================


def _generate_architecture_yml(
    project_root: str,
    frontend_path: Optional[str],
    backend_path: Optional[str],
    patterns: DetectedPatterns,
) -> str:
    arch: Dict[str, Any] = {
        "project": {
            "name": os.path.basename(project_root),
            "description": "Auto-detected project architecture",
        },
        "architecture": {
            "layers": [],
        },
        "constraints": {},
    }

    layers = arch["architecture"]["layers"]

    if backend_path:
        response_rule = (
            "Response format: { success: true/false, data/error: ... }"
            if patterns.response_format == "success_data_error"
            else "Define and use a consistent response format"
        )
        layers.append({
            "name": "routes",
            "path": normalize_path(f"{backend_path}/routes/"),
            "description": "HTTP request handlers",
            "rules": [
                "All route handlers must validate input",
                "All responses must use consistent format",
                response_rule,
            ],
        })

        if patterns.middleware:
            layers.append({
                "name": "middleware",
                "path": normalize_path(f"{backend_path}/middleware/"),
                "description": f"Middleware: {', '.join(patterns.middleware)}",
                "rules": ["Middleware must call next() or send a response"],
            })

        layers.append({
            "name": "services",
            "path": normalize_path(f"{backend_path}/services/"),
            "description": "Business logic layer",
            "rules": [
                "Services must not access req/res directly",
                "No business logic in route handlers",
            ],
        })

    if frontend_path:
        layers.append({
            "name": "components",
            "path": normalize_path(f"{frontend_path}/src/components/"),
            "description": "UI components",
            "rules": [
                "Components must use custom hooks for API calls",
                "No direct fetch/axios in components",
            ],
        })

        layers.append({
            "name": "hooks",
            "path": normalize_path(f"{frontend_path}/src/hooks/"),
            "description": "Custom hooks for shared logic",
            "rules": ["Hooks must handle loading, error, and data states"],
        })

    return yaml.dump(arch, default_flow_style=False, sort_keys=False)


# ============================================================
# Pattern Doc Generators
# ============================================================


def _generate_api_endpoint_pattern(backend_path: str, patterns: DetectedPatterns) -> str:
    middleware = patterns.middleware or []
    middleware_list = (
        ", ".join(f"`{m}`" for m in middleware)
        if middleware
        else "auth, validate"
    )

    response_section = (
        '```json\n{ "success": true, "data": { ... } }\n{ "success": false, "error": "message" }\n```'
        if patterns.response_format == "success_data_error"
        else "Follow the existing response format in the codebase."
    )

    return f"""# Pattern: Adding a New API Endpoint

## Middleware Stack
Apply in order: {middleware_list}

## Response Format
{response_section}

## Steps
1. Create/update model if needed
2. Add business logic in services layer
3. Add validation schema
4. Create route handler with middleware stack
5. Register route in main app

## Rules
- No business logic in route handlers
- All input must be validated
- Use consistent error handling
"""


def _generate_component_pattern(frontend_path: str, patterns: DetectedPatterns) -> str:
    import_style = "@/" if "@/" in (patterns.frontend_imports or []) else "../"

    return f"""# Pattern: Adding a New React Component

## Import Style
Use `{import_style}` for project imports.

## Rules
- Use custom hooks for API calls (never use fetch/axios directly)
- Handle loading, error, and data states
- Use the project's routing solution for navigation

## Template
```jsx
import {{ useApi }} from '{import_style}hooks/useApi';

export default function MyComponent() {{
  const {{ data, loading, error, execute }} = useApi(apiCall);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {{error}}</div>;
  return <div>{{/* Render data */}}</div>;
}}
```
"""


# ============================================================
# Main Setup Function
# ============================================================


def setup_project(
    project_root: str,
    frontend_path_override: Optional[str] = None,
    backend_path_override: Optional[str] = None,
    force: bool = False,
) -> Dict[str, Any]:
    """Set up a project for RAG indexing.

    Returns dict with 'result' and 'context' keys.
    Raises ValueError on validation errors.
    """
    # Validate project root
    if not directory_exists(project_root):
        raise ValueError(f"Project root does not exist or is not a directory: {project_root}")

    # Detect or use overrides
    frontend_path = frontend_path_override if frontend_path_override is not None else detect_frontend(project_root)
    backend_path = backend_path_override if backend_path_override is not None else detect_backend(project_root)

    # Validate overrides
    if frontend_path_override:
        resolved = (
            frontend_path_override
            if os.path.isabs(frontend_path_override)
            else os.path.join(project_root, frontend_path_override)
        )
        if not directory_exists(resolved):
            raise ValueError(f"Frontend path does not exist: {frontend_path_override}")

    if backend_path_override:
        resolved = (
            backend_path_override
            if os.path.isabs(backend_path_override)
            else os.path.join(project_root, backend_path_override)
        )
        if not directory_exists(resolved):
            raise ValueError(f"Backend path does not exist: {backend_path_override}")

    # Scan patterns
    backend_patterns = scan_backend_patterns(project_root, backend_path)
    frontend_patterns = scan_frontend_patterns(project_root, frontend_path)
    patterns = DetectedPatterns(
        middleware=backend_patterns.get("middleware", []),
        response_format=backend_patterns.get("responseFormat"),
        frontend_imports=frontend_patterns.get("frontendImports", []),
    )

    # Generate files
    files_generated: List[str] = []
    arch_path = os.path.join(project_root, "ARCHITECTURE.yml")

    if not file_exists(arch_path) or force:
        yml_content = _generate_architecture_yml(project_root, frontend_path, backend_path, patterns)
        with open(arch_path, "w", encoding="utf-8") as f:
            f.write(yml_content)
        files_generated.append("ARCHITECTURE.yml")

    # Generate pattern docs
    patterns_dir = os.path.join(project_root, "docs", "patterns")
    if not directory_exists(patterns_dir) or force:
        ensure_dir(patterns_dir)

        if backend_path:
            api_pattern_path = os.path.join(patterns_dir, "api-endpoints.md")
            if not file_exists(api_pattern_path) or force:
                with open(api_pattern_path, "w", encoding="utf-8") as f:
                    f.write(_generate_api_endpoint_pattern(backend_path, patterns))
                files_generated.append("docs/patterns/api-endpoints.md")

        if frontend_path:
            comp_pattern_path = os.path.join(patterns_dir, "react-components.md")
            if not file_exists(comp_pattern_path) or force:
                with open(comp_pattern_path, "w", encoding="utf-8") as f:
                    f.write(_generate_component_pattern(frontend_path, patterns))
                files_generated.append("docs/patterns/react-components.md")

    # Create .rag directory
    db_path = chroma_db_path(project_root)
    ensure_dir(db_path)

    # Build context
    config = ProjectConfig(
        include_extensions=list(DEFAULT_CONFIG.include_extensions),
        exclude_dirs=list(DEFAULT_CONFIG.exclude_dirs),
        chunk_size=DEFAULT_CONFIG.chunk_size,
        chunk_overlap=DEFAULT_CONFIG.chunk_overlap,
        default_results=DEFAULT_CONFIG.default_results,
        max_results=DEFAULT_CONFIG.max_results,
        weights=dict(DEFAULT_CONFIG.weights),
    )

    context = ProjectContext(
        project_root=project_root,
        frontend_path=frontend_path,
        backend_path=backend_path,
        chroma_db_path=db_path,
        last_indexed_at=None,
        config=config,
    )

    # Write config
    write_config(context)

    result = {
        "status": "success",
        "projectRoot": project_root,
        "frontendDetected": frontend_path,
        "backendDetected": backend_path,
        "chromaDbPath": db_path,
        "filesGenerated": files_generated,
        "patternsDetected": {
            "middleware": patterns.middleware,
            "responseFormat": patterns.response_format,
            "frontendImports": patterns.frontend_imports,
        },
        "message": "Project initialized. Call rag_index to build search collections.",
    }

    return {"result": result, "context": context}
