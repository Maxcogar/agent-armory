"""Extract metadata from source code files.

All returned values are lists of strings for later storage as comma-separated
values in ChromaDB metadata.
"""

import re
from typing import List

# ============================================================
# Imports
# ============================================================

JS_IMPORT_PATTERNS = [
    # ES module imports: import X from 'y', import { X } from 'y'
    re.compile(r"""(?:import\s+(?:[\w*{}\s,]+)\s+from\s+)['"]([^'"]+)['"]"""),
    # Dynamic imports: import('y')
    re.compile(r"""import\s*\(\s*['"]([^'"]+)['"]\s*\)"""),
    # CommonJS requires: require('y')
    re.compile(r"""require\s*\(\s*['"]([^'"]+)['"]\s*\)"""),
]

PYTHON_IMPORT_PATTERNS = [
    # from X import Y
    re.compile(r"^from\s+([\w.]+)\s+import\s+", re.MULTILINE),
    # import X
    re.compile(r"^import\s+([\w.]+)", re.MULTILINE),
]


def extract_imports(content: str, language: str) -> List[str]:
    """Extract import paths from source code."""
    imports: set[str] = set()
    patterns = PYTHON_IMPORT_PATTERNS if language == "python" else JS_IMPORT_PATTERNS

    for pattern in patterns:
        for match in pattern.finditer(content):
            if match.group(1):
                imports.add(match.group(1))

    return list(imports)


# ============================================================
# Exports
# ============================================================

JS_EXPORT_PATTERNS = [
    # export function name
    re.compile(r"export\s+(?:async\s+)?function\s+(\w+)"),
    # export class name
    re.compile(r"export\s+class\s+(\w+)"),
    # export const/let/var name
    re.compile(r"export\s+(?:const|let|var)\s+(\w+)"),
    # export default function name
    re.compile(r"export\s+default\s+(?:async\s+)?function\s+(\w+)"),
    # export default class name
    re.compile(r"export\s+default\s+class\s+(\w+)"),
    # module.exports = { name1, name2 }
    re.compile(r"module\.exports\s*=\s*\{([^}]+)\}"),
    # exports.name = ...
    re.compile(r"exports\.(\w+)\s*="),
]

PYTHON_EXPORT_PATTERNS = [
    # def function_name
    re.compile(r"^def\s+(\w+)\s*\(", re.MULTILINE),
    # class ClassName
    re.compile(r"^class\s+(\w+)", re.MULTILINE),
    # __all__ = ['name1', 'name2']
    re.compile(r"__all__\s*=\s*\[([^\]]+)\]"),
]


def extract_exports(content: str, language: str) -> List[str]:
    """Extract exported names from source code."""
    exports: set[str] = set()
    patterns = PYTHON_EXPORT_PATTERNS if language == "python" else JS_EXPORT_PATTERNS

    for pattern in patterns:
        for match in pattern.finditer(content):
            if match.group(1):
                text = match.group(0)
                if "module.exports" in text or "__all__" in text:
                    names = re.split(r"""[,\s'"]+""", match.group(1))
                    for name in names:
                        name = name.strip()
                        if name and re.match(r"^\w+$", name):
                            exports.add(name)
                else:
                    exports.add(match.group(1))

    return list(exports)


# ============================================================
# API Endpoints
# ============================================================

ENDPOINT_PATTERNS = [
    # Express: router.get('/path', ...) or app.get('/path', ...)
    re.compile(r"""(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]"""),
    # Flask: @app.route('/path', methods=['GET'])
    re.compile(r"""@app\.route\s*\(\s*['"]([^'"]+)['"]"""),
    # FastAPI: @app.get('/path')
    re.compile(r"""@app\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]"""),
]


def extract_api_endpoints(content: str) -> List[str]:
    """Extract API endpoint definitions from source code."""
    endpoints: set[str] = set()

    for pattern in ENDPOINT_PATTERNS:
        for match in pattern.finditer(content):
            if match.lastindex and match.lastindex >= 2 and match.group(2):
                # Express or FastAPI style: method is group 1, path is group 2
                endpoints.add(f"{match.group(1).upper()} {match.group(2)}")
            elif match.group(1):
                # Flask style: path is group 1
                endpoints.add(match.group(1))

    return list(endpoints)


# ============================================================
# WebSocket Events
# ============================================================

WS_PATTERNS = [
    # socket.on('event', ...)
    re.compile(r"""(?:socket|io|ws)\.on\s*\(\s*['"]([^'"]+)['"]"""),
    # socket.emit('event', ...)
    re.compile(r"""(?:socket|io|ws)\.emit\s*\(\s*['"]([^'"]+)['"]"""),
    # io.to(...).emit('event', ...)
    re.compile(r"""\.emit\s*\(\s*['"]([^'"]+)['"]"""),
]

IGNORED_WS_EVENTS = {"connection", "disconnect", "error"}


def extract_ws_events(content: str) -> List[str]:
    """Extract WebSocket event names from source code."""
    events: set[str] = set()

    for pattern in WS_PATTERNS:
        for match in pattern.finditer(content):
            event = match.group(1)
            if event and event not in IGNORED_WS_EVENTS:
                events.add(event)

    return list(events)


# ============================================================
# Language Detection
# ============================================================

LANG_MAP = {
    "js": "javascript",
    "jsx": "javascript",
    "mjs": "javascript",
    "cjs": "javascript",
    "ts": "typescript",
    "tsx": "typescript",
    "py": "python",
    "go": "go",
    "rs": "rust",
    "java": "java",
    "rb": "ruby",
    "php": "php",
    "yml": "yaml",
    "yaml": "yaml",
    "md": "markdown",
    "json": "json",
}


def detect_language(file_path: str) -> str:
    """Detect programming language from file extension."""
    ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""
    return LANG_MAP.get(ext, "unknown")
