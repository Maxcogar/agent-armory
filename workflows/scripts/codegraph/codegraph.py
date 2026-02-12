#!/usr/bin/env python3
"""
codegraph — Deterministic dependency graph builder for full-stack + IoT codebases.

Parses imports, function calls, API endpoints, MQTT topics, WebSocket events,
and serial connections across JS/TS, Python, and C++/Arduino. Builds a directed
graph and detects cross-language bridges.

Zero external dependencies. Just Python 3.8+ stdlib.

Usage:
    # Build graph and write JSON + Markdown report
    python codegraph.py /path/to/project

    # Extract subgraph for a specific file or function
    python codegraph.py /path/to/project --trace src/api/auth.js

    # Find everything connected to an MQTT topic
    python codegraph.py /path/to/project --trace "sensors/temperature"

    # Output formats
    python codegraph.py /path/to/project --format json
    python codegraph.py /path/to/project --format mermaid
    python codegraph.py /path/to/project --format dot
    python codegraph.py /path/to/project --format markdown

    # Just list cross-language bridges
    python codegraph.py /path/to/project --bridges-only

    # Generate file clusters for code review agents
    python codegraph.py /path/to/project --clusters
"""

import os
import re
import sys
import json
import argparse
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional
from collections import defaultdict, deque
from difflib import SequenceMatcher

# ════════════════════════════════════════════════════════════════════════════
# Data Model
# ════════════════════════════════════════════════════════════════════════════

@dataclass
class Node:
    id: str                     # Unique: "file:path" or "mqtt:topic" or "http:GET:/api/x"
    file: str                   # Source file path (relative to project root)
    name: str                   # Human-readable name
    node_type: str              # file | function | class | endpoint | event | topic | variable
    language: str               # js | ts | python | cpp | arduino | config
    line: int = 0               # Line number where defined
    metadata: dict = field(default_factory=dict)

    def to_dict(self):
        d = asdict(self)
        if not d['metadata']:
            del d['metadata']
        if not d['line']:
            del d['line']
        return d

@dataclass
class Edge:
    source: str                 # Source node id
    target: str                 # Target node id
    edge_type: str              # imports | exports | calls | defines | emits | subscribes
                                # | publishes | fetches | exposes | includes | serial_write
                                # | serial_read | env_uses | env_defines
    file: str = ""              # File where this relationship is declared
    line: int = 0               # Line where this relationship is declared
    metadata: dict = field(default_factory=dict)

    def to_dict(self):
        d = asdict(self)
        if not d['metadata']:
            del d['metadata']
        if not d['line']:
            del d['line']
        if not d['file']:
            del d['file']
        return d

@dataclass
class Bridge:
    """A cross-language connection detected via string matching."""
    bridge_type: str            # mqtt | http | websocket | serial | env
    key: str                    # The shared string (topic, endpoint, event name, env var)
    producers: list = field(default_factory=list)   # [{file, line, language, action}]
    consumers: list = field(default_factory=list)   # [{file, line, language, action}]

    def to_dict(self):
        return asdict(self)

class CodeGraph:
    def __init__(self):
        self.nodes: dict[str, Node] = {}
        self.edges: list[Edge] = []
        self.bridges: list[Bridge] = []
        self._adjacency: dict[str, list[Edge]] = defaultdict(list)       # forward
        self._reverse_adj: dict[str, list[Edge]] = defaultdict(list)     # backward

    def add_node(self, node: Node):
        if node.id not in self.nodes:
            self.nodes[node.id] = node

    def add_edge(self, edge: Edge):
        self.edges.append(edge)
        self._adjacency[edge.source].append(edge)
        self._reverse_adj[edge.target].append(edge)

    def add_bridge(self, bridge: Bridge):
        self.bridges.append(bridge)

    def get_node(self, node_id: str) -> Optional[Node]:
        return self.nodes.get(node_id)

    def neighbors(self, node_id: str, direction="both") -> set[str]:
        """Get neighboring node IDs."""
        result = set()
        if direction in ("forward", "both"):
            for edge in self._adjacency.get(node_id, []):
                result.add(edge.target)
        if direction in ("backward", "both"):
            for edge in self._reverse_adj.get(node_id, []):
                result.add(edge.source)
        return result

    def subgraph(self, start_id: str, max_depth: int = 10) -> 'CodeGraph':
        """BFS from a node to extract connected subgraph."""
        sub = CodeGraph()
        visited = set()
        queue = deque([(start_id, 0)])

        # Also check if start_id is a partial match (e.g. filename without path)
        if start_id not in self.nodes:
            matches = [nid for nid in self.nodes if start_id in nid]
            if len(matches) == 1:
                start_id = matches[0]
            elif len(matches) > 1:
                # Try exact filename match
                exact = [m for m in matches if m.endswith(start_id) or m.split(":")[-1] == start_id]
                if exact:
                    start_id = exact[0]
                else:
                    start_id = matches[0]

        while queue:
            current, depth = queue.popleft()
            if current in visited or depth > max_depth:
                continue
            visited.add(current)

            if current in self.nodes:
                sub.add_node(self.nodes[current])

            for edge in self._adjacency.get(current, []):
                sub.add_edge(edge)
                if edge.target not in visited:
                    queue.append((edge.target, depth + 1))

            for edge in self._reverse_adj.get(current, []):
                sub.add_edge(edge)
                if edge.source not in visited:
                    queue.append((edge.source, depth + 1))

        # Include relevant bridges
        sub_files = {n.file for n in sub.nodes.values() if n.file}
        for bridge in self.bridges:
            bridge_files = {p['file'] for p in bridge.producers + bridge.consumers}
            if bridge_files & sub_files:
                sub.add_bridge(bridge)

        return sub

    def clusters(self, min_size: int = 2) -> list[set[str]]:
        """Find connected components (clusters of related files)."""
        visited = set()
        components = []

        for node_id in self.nodes:
            if node_id in visited:
                continue
            component = set()
            queue = deque([node_id])
            while queue:
                current = queue.popleft()
                if current in visited:
                    continue
                visited.add(current)
                component.add(current)
                for neighbor in self.neighbors(current, "both"):
                    if neighbor not in visited:
                        queue.append(neighbor)
            if len(component) >= min_size:
                components.append(component)

        return sorted(components, key=len, reverse=True)

    def file_clusters(self, min_size: int = 2) -> list[set[str]]:
        """Clusters grouped by file rather than node ID."""
        node_clusters = self.clusters(min_size=1)
        file_clusters = []
        for cluster in node_clusters:
            files = set()
            for node_id in cluster:
                node = self.nodes.get(node_id)
                if node and node.file:
                    files.add(node.file)
            if len(files) >= min_size:
                file_clusters.append(files)
        # Deduplicate overlapping clusters
        seen_files = set()
        result = []
        for cluster in sorted(file_clusters, key=len, reverse=True):
            remaining = cluster - seen_files
            if len(remaining) >= min_size:
                result.append(remaining)
                seen_files |= remaining
        return result

    def stats(self) -> dict:
        return {
            "nodes": len(self.nodes),
            "edges": len(self.edges),
            "bridges": len(self.bridges),
            "files": len({n.file for n in self.nodes.values() if n.file}),
            "languages": list({n.language for n in self.nodes.values()}),
            "edge_types": dict(sorted(
                defaultdict(int, {e.edge_type: sum(1 for x in self.edges if x.edge_type == e.edge_type)
                                  for e in self.edges}).items(),
                key=lambda x: -x[1]
            )),
            "bridge_types": dict(sorted(
                defaultdict(int, {b.bridge_type: sum(1 for x in self.bridges if x.bridge_type == b.bridge_type)
                                  for b in self.bridges}).items(),
                key=lambda x: -x[1]
            )),
        }


# ════════════════════════════════════════════════════════════════════════════
# File Discovery
# ════════════════════════════════════════════════════════════════════════════

SKIP_DIRS = {
    'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
    'venv', '.venv', 'coverage', '.nyc_output', 'vendor', '.pio',
    '.platformio', 'managed_components', '.code-review',
}

LANGUAGE_MAP = {
    '.js': 'js', '.jsx': 'js', '.mjs': 'js', '.cjs': 'js',
    '.ts': 'ts', '.tsx': 'ts',
    '.py': 'python',
    '.cpp': 'cpp', '.c': 'cpp', '.h': 'cpp', '.hpp': 'cpp',
    '.ino': 'arduino',
    '.json': 'config', '.yaml': 'config', '.yml': 'config',
    '.toml': 'config', '.ini': 'config', '.env': 'config',
}

def discover_files(project_root: Path) -> list[Path]:
    """Walk the project tree and collect parseable files."""
    files = []
    for dirpath, dirnames, filenames in os.walk(project_root):
        # Prune skip directories in-place
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]

        for fname in filenames:
            fpath = Path(dirpath) / fname
            ext = fpath.suffix.lower()
            # Handle .env files (no suffix or .env.*)
            if fname.startswith('.env'):
                files.append(fpath)
            elif ext in LANGUAGE_MAP:
                files.append(fpath)
    return sorted(files)

def read_file_safe(fpath: Path) -> str:
    """Read file with encoding fallback."""
    for enc in ('utf-8', 'latin-1', 'ascii'):
        try:
            return fpath.read_text(encoding=enc)
        except (UnicodeDecodeError, ValueError):
            continue
    return ""

def rel_path(fpath: Path, root: Path) -> str:
    """Get relative path string."""
    try:
        return str(fpath.relative_to(root))
    except ValueError:
        return str(fpath)


# ════════════════════════════════════════════════════════════════════════════
# Language Parsers
# ════════════════════════════════════════════════════════════════════════════

def parse_javascript(fpath: Path, content: str, relp: str, graph: CodeGraph):
    """Parse JS/TS file for imports, exports, function definitions, API calls."""
    lang = 'ts' if fpath.suffix in ('.ts', '.tsx') else 'js'

    # File node
    file_node_id = f"file:{relp}"
    graph.add_node(Node(id=file_node_id, file=relp, name=fpath.name,
                        node_type="file", language=lang))

    for line_num, line in enumerate(content.splitlines(), 1):
        stripped = line.strip()
        if not stripped or stripped.startswith('//'):
            continue

        # ── Imports ──────────────────────────────────────────────────────
        # import X from './module'
        # import { X } from 'package'
        # const X = require('./module')
        # require('package')
        import_patterns = [
            r"""import\s+.*?\s+from\s+['"](\.{1,2}/[^'"]+|[^'"]+)['"]""",
            r"""import\s+['"](\.{1,2}/[^'"]+|[^'"]+)['"]""",
            r"""require\s*\(\s*['"](\.{1,2}/[^'"]+|[^'"]+)['"]\s*\)""",
            r"""import\s*\(\s*['"](\.{1,2}/[^'"]+|[^'"]+)['"]\s*\)""",
        ]
        for pat in import_patterns:
            for m in re.finditer(pat, line):
                module_path = m.group(1)
                target_id = resolve_js_import(relp, module_path)
                graph.add_edge(Edge(
                    source=file_node_id, target=f"file:{target_id}",
                    edge_type="imports", file=relp, line=line_num,
                    metadata={"raw": module_path}
                ))

        # ── Exports ──────────────────────────────────────────────────────
        # export default function X
        # export const X =
        # module.exports =
        export_pats = [
            r"""export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)""",
            r"""export\s+\{([^}]+)\}""",
        ]
        for pat in export_pats:
            for m in re.finditer(pat, line):
                names = [n.strip().split(' as ')[0].strip()
                         for n in m.group(1).split(',')]
                for name in names:
                    if name:
                        node_id = f"export:{relp}:{name}"
                        graph.add_node(Node(id=node_id, file=relp, name=name,
                                           node_type="function", language=lang, line=line_num))
                        graph.add_edge(Edge(source=file_node_id, target=node_id,
                                           edge_type="exports", file=relp, line=line_num))

        # ── Express/Fastify Route Definitions ────────────────────────────
        route_pat = r"""(?:app|router|server)\.(get|post|put|patch|delete|all)\s*\(\s*['""`]([^'""`]+)['""`]"""
        for m in re.finditer(route_pat, line, re.IGNORECASE):
            method = m.group(1).upper()
            path = m.group(2)
            endpoint_id = f"http:{method}:{path}"
            graph.add_node(Node(id=endpoint_id, file=relp, name=f"{method} {path}",
                                node_type="endpoint", language=lang, line=line_num,
                                metadata={"method": method, "path": path}))
            graph.add_edge(Edge(source=file_node_id, target=endpoint_id,
                                edge_type="defines", file=relp, line=line_num))

        # ── API Calls (fetch, axios) ─────────────────────────────────────
        api_call_pats = [
            (r"""fetch\s*\(\s*['""`]([^'""`]+)['""`]""", "GET"),
            (r"""axios\s*\.\s*(get|post|put|patch|delete)\s*\(\s*['""`]([^'""`]+)['""`]""", None),
            (r"""api\s*\.\s*(get|post|put|patch|delete)\s*\(\s*['""`]([^'""`]+)['""`]""", None),
        ]
        for pat, default_method in api_call_pats:
            for m in re.finditer(pat, line, re.IGNORECASE):
                if default_method:
                    path = m.group(1)
                    method = default_method
                else:
                    method = m.group(1).upper()
                    path = m.group(2)
                endpoint_id = f"http:{method}:{path}"
                graph.add_edge(Edge(source=file_node_id, target=endpoint_id,
                                    edge_type="fetches", file=relp, line=line_num,
                                    metadata={"method": method, "path": path}))

        # ── Socket.io Events ─────────────────────────────────────────────
        ws_emit = re.findall(r"""(?:socket|io)\s*\.\s*emit\s*\(\s*['""`]([^'""`]+)['""`]""", line)
        for event in ws_emit:
            event_id = f"ws:{event}"
            graph.add_node(Node(id=event_id, file=relp, name=f"ws:{event}",
                                node_type="event", language=lang, line=line_num))
            graph.add_edge(Edge(source=file_node_id, target=event_id,
                                edge_type="emits", file=relp, line=line_num))

        ws_listen = re.findall(r"""(?:socket|io)\s*\.\s*on\s*\(\s*['""`]([^'""`]+)['""`]""", line)
        for event in ws_listen:
            event_id = f"ws:{event}"
            graph.add_node(Node(id=event_id, file=relp, name=f"ws:{event}",
                                node_type="event", language=lang))
            graph.add_edge(Edge(source=event_id, target=file_node_id,
                                edge_type="subscribes", file=relp, line=line_num))

        # ── MQTT (JS mqtt/aedes libraries) ───────────────────────────────
        mqtt_pub = re.findall(r"""\.publish\s*\(\s*['""`]([^'""`]+)['""`]""", line)
        for topic in mqtt_pub:
            topic_id = f"mqtt:{topic}"
            graph.add_node(Node(id=topic_id, file=relp, name=f"mqtt:{topic}",
                                node_type="topic", language=lang, line=line_num))
            graph.add_edge(Edge(source=file_node_id, target=topic_id,
                                edge_type="publishes", file=relp, line=line_num))

        mqtt_sub = re.findall(r"""\.subscribe\s*\(\s*['""`]([^'""`]+)['""`]""", line)
        for topic in mqtt_sub:
            topic_id = f"mqtt:{topic}"
            graph.add_node(Node(id=topic_id, file=relp, name=f"mqtt:{topic}",
                                node_type="topic", language=lang))
            graph.add_edge(Edge(source=topic_id, target=file_node_id,
                                edge_type="subscribes", file=relp, line=line_num))

        # ── Environment Variables ────────────────────────────────────────
        env_pats = [
            r"""process\.env\.(\w+)""",
            r"""process\.env\[['"](\w+)['"]\]""",
            r"""import\.meta\.env\.(\w+)""",
        ]
        for pat in env_pats:
            for m in re.finditer(pat, line):
                var = m.group(1)
                env_id = f"env:{var}"
                graph.add_node(Node(id=env_id, file=relp, name=var,
                                    node_type="variable", language="config"))
                graph.add_edge(Edge(source=file_node_id, target=env_id,
                                    edge_type="env_uses", file=relp, line=line_num))


def parse_python(fpath: Path, content: str, relp: str, graph: CodeGraph):
    """Parse Python file for imports, MQTT, serial, HTTP calls."""
    file_node_id = f"file:{relp}"
    graph.add_node(Node(id=file_node_id, file=relp, name=fpath.name,
                        node_type="file", language="python"))

    for line_num, line in enumerate(content.splitlines(), 1):
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue

        # ── Imports ──────────────────────────────────────────────────────
        # import module
        # from module import X
        # from . import X
        # from ..module import X
        import_pats = [
            r"""^from\s+([\w.]+)\s+import""",
            r"""^import\s+([\w.]+)""",
        ]
        for pat in import_pats:
            m = re.match(pat, stripped)
            if m:
                module = m.group(1)
                target_id = resolve_python_import(relp, module)
                graph.add_edge(Edge(
                    source=file_node_id, target=f"file:{target_id}",
                    edge_type="imports", file=relp, line=line_num,
                    metadata={"module": module}
                ))

        # ── Function / Class Definitions ─────────────────────────────────
        func_match = re.match(r"""^(?:async\s+)?def\s+(\w+)""", stripped)
        if func_match:
            name = func_match.group(1)
            node_id = f"func:{relp}:{name}"
            graph.add_node(Node(id=node_id, file=relp, name=name,
                                node_type="function", language="python", line=line_num))
            graph.add_edge(Edge(source=file_node_id, target=node_id,
                                edge_type="defines", file=relp, line=line_num))

        class_match = re.match(r"""^class\s+(\w+)""", stripped)
        if class_match:
            name = class_match.group(1)
            node_id = f"class:{relp}:{name}"
            graph.add_node(Node(id=node_id, file=relp, name=name,
                                node_type="class", language="python", line=line_num))
            graph.add_edge(Edge(source=file_node_id, target=node_id,
                                edge_type="defines", file=relp, line=line_num))

        # ── MQTT (paho-mqtt) ─────────────────────────────────────────────
        mqtt_pub = re.findall(r"""\.publish\s*\(\s*['"]([\w/#+]+)['"]""", line)
        for topic in mqtt_pub:
            topic_id = f"mqtt:{topic}"
            graph.add_node(Node(id=topic_id, file=relp, name=f"mqtt:{topic}",
                                node_type="topic", language="python", line=line_num))
            graph.add_edge(Edge(source=file_node_id, target=topic_id,
                                edge_type="publishes", file=relp, line=line_num))

        mqtt_sub = re.findall(r"""\.subscribe\s*\(\s*['"]([\w/#+]+)['"]""", line)
        for topic in mqtt_sub:
            topic_id = f"mqtt:{topic}"
            graph.add_node(Node(id=topic_id, file=relp, name=f"mqtt:{topic}",
                                node_type="topic", language="python"))
            graph.add_edge(Edge(source=topic_id, target=file_node_id,
                                edge_type="subscribes", file=relp, line=line_num))

        # ── MQTT message callback routing ────────────────────────────────
        # client.message_callback_add("topic", handler)
        mqtt_callback = re.findall(r"""message_callback_add\s*\(\s*['"]([\w/#+]+)['"]""", line)
        for topic in mqtt_callback:
            topic_id = f"mqtt:{topic}"
            graph.add_node(Node(id=topic_id, file=relp, name=f"mqtt:{topic}",
                                node_type="topic", language="python"))
            graph.add_edge(Edge(source=topic_id, target=file_node_id,
                                edge_type="subscribes", file=relp, line=line_num))

        # ── Serial ───────────────────────────────────────────────────────
        serial_read = re.findall(r"""(?:serial|ser)\s*\.\s*(read|readline|read_until)\s*\(""", line, re.IGNORECASE)
        if serial_read:
            serial_id = "serial:connection"
            graph.add_node(Node(id=serial_id, file=relp, name="serial",
                                node_type="event", language="python"))
            graph.add_edge(Edge(source=serial_id, target=file_node_id,
                                edge_type="serial_read", file=relp, line=line_num))

        serial_write = re.findall(r"""(?:serial|ser)\s*\.\s*(write|writelines)\s*\(""", line, re.IGNORECASE)
        if serial_write:
            serial_id = "serial:connection"
            graph.add_node(Node(id=serial_id, file=relp, name="serial",
                                node_type="event", language="python"))
            graph.add_edge(Edge(source=file_node_id, target=serial_id,
                                edge_type="serial_write", file=relp, line=line_num))

        # ── HTTP requests (requests library) ─────────────────────────────
        http_pats = [
            r"""requests\.(get|post|put|patch|delete)\s*\(\s*['"](https?://[^'"]+)['"]""",
            r"""requests\.(get|post|put|patch|delete)\s*\(\s*f?['"](https?://[^'"]+)['"]""",
        ]
        for pat in http_pats:
            for m in re.finditer(pat, line, re.IGNORECASE):
                method = m.group(1).upper()
                url = m.group(2)
                endpoint_id = f"http:{method}:{url}"
                graph.add_edge(Edge(source=file_node_id, target=endpoint_id,
                                    edge_type="fetches", file=relp, line=line_num))

        # ── Flask/FastAPI route definitions ──────────────────────────────
        route_pats = [
            r"""@(?:app|router|blueprint)\s*\.\s*(?:route|get|post|put|delete)\s*\(\s*['"]([\w/{}:<>]+)['"]""",
        ]
        for pat in route_pats:
            for m in re.finditer(pat, line):
                path = m.group(1)
                method = "GET"  # Simplified; real detection would need decorator args
                endpoint_id = f"http:{method}:{path}"
                graph.add_node(Node(id=endpoint_id, file=relp, name=f"{method} {path}",
                                    node_type="endpoint", language="python", line=line_num))
                graph.add_edge(Edge(source=file_node_id, target=endpoint_id,
                                    edge_type="defines", file=relp, line=line_num))

        # ── Environment Variables ────────────────────────────────────────
        env_pats = [
            r"""os\.environ\s*(?:\.get\s*\(|\.?\[)\s*['"]([\w]+)['"]""",
            r"""os\.getenv\s*\(\s*['"]([\w]+)['"]""",
        ]
        for pat in env_pats:
            for m in re.finditer(pat, line):
                var = m.group(1)
                env_id = f"env:{var}"
                graph.add_node(Node(id=env_id, file=relp, name=var,
                                    node_type="variable", language="config"))
                graph.add_edge(Edge(source=file_node_id, target=env_id,
                                    edge_type="env_uses", file=relp, line=line_num))


def parse_cpp_arduino(fpath: Path, content: str, relp: str, graph: CodeGraph):
    """Parse C++/Arduino file for includes, MQTT, serial, WiFi, function defs."""
    lang = 'arduino' if fpath.suffix == '.ino' else 'cpp'
    file_node_id = f"file:{relp}"
    graph.add_node(Node(id=file_node_id, file=relp, name=fpath.name,
                        node_type="file", language=lang))

    for line_num, line in enumerate(content.splitlines(), 1):
        stripped = line.strip()
        if not stripped or stripped.startswith('//'):
            continue

        # ── Includes ─────────────────────────────────────────────────────
        inc_match = re.match(r"""#include\s*[<"]([^>"]+)[>"]""", stripped)
        if inc_match:
            header = inc_match.group(1)
            # Local includes (quoted) are project files
            if '"' in line:
                target_id = resolve_cpp_include(relp, header)
                graph.add_edge(Edge(source=file_node_id, target=f"file:{target_id}",
                                    edge_type="includes", file=relp, line=line_num))
            else:
                # System/library includes — create a library node
                lib_id = f"lib:{header}"
                graph.add_node(Node(id=lib_id, file="", name=header,
                                    node_type="file", language="cpp"))
                graph.add_edge(Edge(source=file_node_id, target=lib_id,
                                    edge_type="includes", file=relp, line=line_num))

        # ── Function Definitions ─────────────────────────────────────────
        # Match: void functionName(...) {  or  int functionName(...)
        func_pat = r"""^(?:void|int|float|double|bool|String|char\s*\*?|unsigned|long|uint\w+|size_t)\s+(\w+)\s*\("""
        func_match = re.match(func_pat, stripped)
        if func_match:
            name = func_match.group(1)
            if name not in ('if', 'while', 'for', 'switch', 'return'):
                node_id = f"func:{relp}:{name}"
                graph.add_node(Node(id=node_id, file=relp, name=name,
                                    node_type="function", language=lang, line=line_num))
                graph.add_edge(Edge(source=file_node_id, target=node_id,
                                    edge_type="defines", file=relp, line=line_num))

        # ── MQTT (PubSubClient) ──────────────────────────────────────────
        mqtt_pub = re.findall(r"""\.publish\s*\(\s*"([^"]+)"\s*,""", line)
        for topic in mqtt_pub:
            topic_id = f"mqtt:{topic}"
            graph.add_node(Node(id=topic_id, file=relp, name=f"mqtt:{topic}",
                                node_type="topic", language=lang, line=line_num))
            graph.add_edge(Edge(source=file_node_id, target=topic_id,
                                edge_type="publishes", file=relp, line=line_num))

        mqtt_sub = re.findall(r"""\.subscribe\s*\(\s*"([^"]+)"\s*""", line)
        for topic in mqtt_sub:
            topic_id = f"mqtt:{topic}"
            graph.add_node(Node(id=topic_id, file=relp, name=f"mqtt:{topic}",
                                node_type="topic", language=lang))
            graph.add_edge(Edge(source=topic_id, target=file_node_id,
                                edge_type="subscribes", file=relp, line=line_num))

        # ── Serial Output ────────────────────────────────────────────────
        serial_out = re.findall(r"""Serial\d*\.(print|println|write|printf)\s*\(""", line)
        if serial_out:
            serial_id = "serial:connection"
            graph.add_node(Node(id=serial_id, file=relp, name="serial",
                                node_type="event", language=lang))
            graph.add_edge(Edge(source=file_node_id, target=serial_id,
                                edge_type="serial_write", file=relp, line=line_num))

        serial_in = re.findall(r"""Serial\d*\.(read|readString|readLine|parseInt|parseFloat|available)\s*\(""", line)
        if serial_in:
            serial_id = "serial:connection"
            graph.add_node(Node(id=serial_id, file=relp, name="serial",
                                node_type="event", language=lang))
            graph.add_edge(Edge(source=serial_id, target=file_node_id,
                                edge_type="serial_read", file=relp, line=line_num))

        # ── HTTP Client Calls (ESP32 HTTPClient) ─────────────────────────
        http_begin = re.findall(r"""\.begin\s*\(\s*"(https?://[^"]+)"\s*\)""", line)
        for url in http_begin:
            endpoint_id = f"http:GET:{url}"
            graph.add_edge(Edge(source=file_node_id, target=endpoint_id,
                                edge_type="fetches", file=relp, line=line_num))


def parse_env_file(fpath: Path, content: str, relp: str, graph: CodeGraph):
    """Parse .env files for variable definitions."""
    file_node_id = f"file:{relp}"
    graph.add_node(Node(id=file_node_id, file=relp, name=fpath.name,
                        node_type="file", language="config"))

    for line_num, line in enumerate(content.splitlines(), 1):
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        m = re.match(r"""^(\w+)\s*=\s*(.*)$""", stripped)
        if m:
            var = m.group(1)
            env_id = f"env:{var}"
            graph.add_node(Node(id=env_id, file=relp, name=var,
                                node_type="variable", language="config", line=line_num))
            graph.add_edge(Edge(source=file_node_id, target=env_id,
                                edge_type="env_defines", file=relp, line=line_num))


def parse_config_files(fpath: Path, content: str, relp: str, graph: CodeGraph):
    """Parse package.json, platformio.ini, docker-compose for dependency info."""
    file_node_id = f"file:{relp}"
    graph.add_node(Node(id=file_node_id, file=relp, name=fpath.name,
                        node_type="file", language="config"))

    if fpath.name == 'package.json':
        try:
            pkg = json.loads(content)
            for dep_type in ('dependencies', 'devDependencies'):
                for dep_name in pkg.get(dep_type, {}):
                    dep_id = f"pkg:{dep_name}"
                    graph.add_node(Node(id=dep_id, file="", name=dep_name,
                                        node_type="file", language="config"))
                    graph.add_edge(Edge(source=file_node_id, target=dep_id,
                                        edge_type="imports", file=relp,
                                        metadata={"type": dep_type}))
            # Scripts
            for script_name, script_cmd in pkg.get('scripts', {}).items():
                node_id = f"script:{relp}:{script_name}"
                graph.add_node(Node(id=node_id, file=relp, name=f"npm:{script_name}",
                                    node_type="function", language="config",
                                    metadata={"command": script_cmd}))
        except json.JSONDecodeError:
            pass


# ════════════════════════════════════════════════════════════════════════════
# Import Resolution
# ════════════════════════════════════════════════════════════════════════════

def resolve_js_import(source_file: str, import_path: str) -> str:
    """Resolve a JS import path to a likely file path."""
    if not import_path.startswith('.'):
        # External package — use package node
        pkg = import_path.split('/')[0]
        if import_path.startswith('@'):
            pkg = '/'.join(import_path.split('/')[:2])
        return f"__pkg__/{pkg}"

    source_dir = str(Path(source_file).parent)
    resolved = os.path.normpath(os.path.join(source_dir, import_path))
    resolved = resolved.replace('\\', '/')
    return resolved

def resolve_python_import(source_file: str, module: str) -> str:
    """Resolve a Python import to a likely file path."""
    if module.startswith('.'):
        # Relative import
        source_dir = str(Path(source_file).parent)
        parts = module.lstrip('.').split('.')
        levels = len(module) - len(module.lstrip('.'))
        base = source_dir
        for _ in range(levels - 1):
            base = str(Path(base).parent)
        return os.path.normpath(os.path.join(base, *parts)).replace('\\', '/')

    # Absolute import — convert dots to path
    parts = module.split('.')
    return '/'.join(parts)

def resolve_cpp_include(source_file: str, header: str) -> str:
    """Resolve a C++ local include to a file path."""
    source_dir = str(Path(source_file).parent)
    return os.path.normpath(os.path.join(source_dir, header)).replace('\\', '/')


# ════════════════════════════════════════════════════════════════════════════
# Cross-Language Bridge Detection
# ════════════════════════════════════════════════════════════════════════════

def detect_bridges(graph: CodeGraph):
    """Find cross-language connections by matching shared keys (topics, endpoints, events, etc.)."""

    # ── MQTT Bridges ─────────────────────────────────────────────────────
    mqtt_producers = defaultdict(list)  # topic → [{file, line, language}]
    mqtt_consumers = defaultdict(list)
    for edge in graph.edges:
        if edge.edge_type == "publishes":
            topic = edge.target.replace("mqtt:", "")
            node = graph.nodes.get(f"file:{edge.file}")
            lang = node.language if node else "unknown"
            mqtt_producers[topic].append({
                "file": edge.file, "line": edge.line, "language": lang, "action": "publish"
            })
        elif edge.edge_type == "subscribes":
            node_source = graph.nodes.get(edge.source)
            if node_source and node_source.node_type == "topic":
                topic = edge.source.replace("mqtt:", "")
                # edge.target is already "file:path" — look up directly
                node = graph.nodes.get(edge.target)
                lang = node.language if node else "unknown"
                mqtt_consumers[topic].append({
                    "file": node.file if node else edge.target, "line": edge.line, "language": lang, "action": "subscribe"
                })

    # Match including MQTT wildcards (# and +)
    all_topics = set(list(mqtt_producers.keys()) + list(mqtt_consumers.keys()))
    for topic in all_topics:
        prods = mqtt_producers.get(topic, [])
        cons = mqtt_consumers.get(topic, [])
        # Also check wildcard matches
        for sub_topic in mqtt_consumers:
            if sub_topic != topic and mqtt_topic_matches(sub_topic, topic):
                cons = cons + mqtt_consumers[sub_topic]
        if prods or cons:
            # Only record as bridge if multi-language or multi-file
            all_files = {p['file'] for p in prods} | {c['file'] for c in cons}
            all_langs = {p['language'] for p in prods} | {c['language'] for c in cons}
            if len(all_files) > 1 or len(all_langs) > 1:
                graph.add_bridge(Bridge(
                    bridge_type="mqtt", key=topic,
                    producers=prods, consumers=cons
                ))

    # ── HTTP Bridges ─────────────────────────────────────────────────────
    http_definers = defaultdict(list)
    http_callers = defaultdict(list)
    for edge in graph.edges:
        if edge.edge_type == "defines":
            target = graph.nodes.get(edge.target)
            if target and target.node_type == "endpoint":
                path = target.metadata.get("path", edge.target)
                node = graph.nodes.get(f"file:{edge.file}")
                lang = node.language if node else "unknown"
                http_definers[normalize_http_path(path)].append({
                    "file": edge.file, "line": edge.line, "language": lang,
                    "action": f"defines {target.name}"
                })
        elif edge.edge_type == "fetches":
            path = edge.metadata.get("path", edge.target.split(":", 2)[-1] if ":" in edge.target else edge.target)
            node = graph.nodes.get(f"file:{edge.file}")
            lang = node.language if node else "unknown"
            http_callers[normalize_http_path(path)].append({
                "file": edge.file, "line": edge.line, "language": lang,
                "action": f"calls {path}"
            })

    for path in set(list(http_definers.keys()) + list(http_callers.keys())):
        defs = http_definers.get(path, [])
        calls = http_callers.get(path, [])
        if defs and calls:
            graph.add_bridge(Bridge(
                bridge_type="http", key=path,
                producers=defs, consumers=calls
            ))
        elif calls and not defs:
            # Unmatched call — potential broken endpoint
            graph.add_bridge(Bridge(
                bridge_type="http", key=f"UNMATCHED:{path}",
                producers=[], consumers=calls
            ))

    # ── WebSocket Bridges ────────────────────────────────────────────────
    ws_emitters = defaultdict(list)
    ws_listeners = defaultdict(list)
    for edge in graph.edges:
        if edge.edge_type == "emits":
            event = edge.target.replace("ws:", "")
            node = graph.nodes.get(f"file:{edge.file}")
            lang = node.language if node else "unknown"
            ws_emitters[event].append({
                "file": edge.file, "line": edge.line, "language": lang, "action": "emits"
            })
        elif edge.edge_type == "subscribes":
            source_node = graph.nodes.get(edge.source)
            if source_node and source_node.node_type == "event" and source_node.id.startswith("ws:"):
                event = edge.source.replace("ws:", "")
                # edge.target is already "file:path"
                node = graph.nodes.get(edge.target)
                lang = node.language if node else "unknown"
                ws_listeners[event].append({
                    "file": node.file if node else edge.target, "line": edge.line, "language": lang, "action": "listens"
                })

    for event in set(list(ws_emitters.keys()) + list(ws_listeners.keys())):
        emits = ws_emitters.get(event, [])
        listens = ws_listeners.get(event, [])
        all_files = {e['file'] for e in emits} | {l['file'] for l in listens}
        if len(all_files) > 1:
            graph.add_bridge(Bridge(
                bridge_type="websocket", key=event,
                producers=emits, consumers=listens
            ))

    # ── Serial Bridges ───────────────────────────────────────────────────
    serial_writers = []
    serial_readers = []
    for edge in graph.edges:
        if edge.edge_type == "serial_write":
            node = graph.nodes.get(f"file:{edge.file}")
            lang = node.language if node else "unknown"
            serial_writers.append({
                "file": edge.file, "line": edge.line, "language": lang, "action": "write"
            })
        elif edge.edge_type == "serial_read":
            node = graph.nodes.get(f"file:{edge.file}")
            lang = node.language if node else "unknown"
            serial_readers.append({
                "file": edge.file, "line": edge.line, "language": lang, "action": "read"
            })

    if serial_writers and serial_readers:
        graph.add_bridge(Bridge(
            bridge_type="serial", key="serial",
            producers=serial_writers, consumers=serial_readers
        ))

    # ── Environment Variable Bridges ─────────────────────────────────────
    env_definers = defaultdict(list)
    env_users = defaultdict(list)
    for edge in graph.edges:
        if edge.edge_type == "env_defines":
            var = edge.target.replace("env:", "")
            env_definers[var].append({
                "file": edge.file, "line": edge.line, "language": "config", "action": "defines"
            })
        elif edge.edge_type == "env_uses":
            var = edge.target.replace("env:", "")
            node = graph.nodes.get(f"file:{edge.file}")
            lang = node.language if node else "unknown"
            env_users[var].append({
                "file": edge.file, "line": edge.line, "language": lang, "action": "uses"
            })

    for var in set(list(env_definers.keys()) + list(env_users.keys())):
        defs = env_definers.get(var, [])
        uses = env_users.get(var, [])
        if uses and not defs:
            graph.add_bridge(Bridge(
                bridge_type="env", key=f"UNDEFINED:{var}",
                producers=[], consumers=uses
            ))
        elif defs and uses:
            all_files = {d['file'] for d in defs} | {u['file'] for u in uses}
            if len(all_files) > 1:
                graph.add_bridge(Bridge(
                    bridge_type="env", key=var,
                    producers=defs, consumers=uses
                ))


def mqtt_topic_matches(pattern: str, topic: str) -> bool:
    """Check if an MQTT subscription pattern matches a topic."""
    if pattern == topic:
        return True
    pat_parts = pattern.split('/')
    top_parts = topic.split('/')
    for i, pp in enumerate(pat_parts):
        if pp == '#':
            return True  # Multi-level wildcard matches rest
        if i >= len(top_parts):
            return False
        if pp == '+':
            continue  # Single-level wildcard
        if pp != top_parts[i]:
            return False
    return len(pat_parts) == len(top_parts)

def normalize_http_path(path: str) -> str:
    """Normalize HTTP path for matching."""
    path = re.sub(r':(\w+)', '{param}', path)
    path = re.sub(r'\$\{[^}]+\}', '{param}', path)
    path = re.sub(r'\{[^}]+\}', '{param}', path)
    return path.rstrip('/').lower()


# ════════════════════════════════════════════════════════════════════════════
# Export Formats
# ════════════════════════════════════════════════════════════════════════════

def export_json(graph: CodeGraph) -> str:
    return json.dumps({
        "stats": graph.stats(),
        "nodes": {nid: n.to_dict() for nid, n in graph.nodes.items()},
        "edges": [e.to_dict() for e in graph.edges],
        "bridges": [b.to_dict() for b in graph.bridges],
    }, indent=2)

def export_mermaid(graph: CodeGraph, max_nodes: int = 60) -> str:
    """Export as Mermaid flowchart. Limits output for readability."""
    lines = ["graph LR"]

    # Map node IDs to short safe labels
    id_map = {}
    counter = 0
    for nid, node in list(graph.nodes.items())[:max_nodes]:
        safe_id = f"N{counter}"
        id_map[nid] = safe_id
        counter += 1

        label = node.name.replace('"', "'")
        if node.node_type == "file":
            lines.append(f'    {safe_id}["{label}"]')
        elif node.node_type == "endpoint":
            lines.append(f'    {safe_id}{{"{ {label} }"}}')
        elif node.node_type == "topic":
            lines.append(f'    {safe_id}(("{label}"))')
        elif node.node_type == "event":
            lines.append(f'    {safe_id}(["{label}"])')
        else:
            lines.append(f'    {safe_id}("{label}")')

    edge_labels = {
        "imports": "imports",
        "exports": "exports",
        "defines": "defines",
        "fetches": "calls",
        "emits": "emits",
        "subscribes": "listens",
        "publishes": "publishes",
        "includes": "includes",
        "serial_write": "writes",
        "serial_read": "reads",
        "env_uses": "uses",
        "env_defines": "defines",
    }

    seen_edges = set()
    for edge in graph.edges:
        src = id_map.get(edge.source)
        tgt = id_map.get(edge.target)
        if src and tgt:
            key = (src, tgt, edge.edge_type)
            if key not in seen_edges:
                seen_edges.add(key)
                label = edge_labels.get(edge.edge_type, edge.edge_type)
                lines.append(f'    {src} -->|{label}| {tgt}')

    # Styling
    lines.append("")
    lines.append("    classDef file fill:#e1f5fe,stroke:#0288d1")
    lines.append("    classDef endpoint fill:#fff3e0,stroke:#f57c00")
    lines.append("    classDef topic fill:#e8f5e9,stroke:#388e3c")
    lines.append("    classDef event fill:#fce4ec,stroke:#c62828")

    for nid, node in graph.nodes.items():
        safe = id_map.get(nid)
        if safe:
            lines.append(f"    class {safe} {node.node_type}")

    return '\n'.join(lines)

def export_dot(graph: CodeGraph) -> str:
    """Export as GraphViz DOT."""
    lines = ['digraph codegraph {', '    rankdir=LR;', '    node [fontname="Helvetica"];']

    shapes = {"file": "box", "function": "ellipse", "endpoint": "hexagon",
              "topic": "diamond", "event": "octagon", "variable": "note", "class": "box3d"}
    colors = {"js": "#f7df1e", "ts": "#3178c6", "python": "#3776ab",
              "cpp": "#00599c", "arduino": "#00979d", "config": "#cccccc"}

    for nid, node in graph.nodes.items():
        safe = nid.replace('"', '\\"')
        label = node.name.replace('"', '\\"')
        shape = shapes.get(node.node_type, "box")
        color = colors.get(node.language, "#ffffff")
        lines.append(f'    "{safe}" [label="{label}", shape={shape}, style=filled, fillcolor="{color}"];')

    for edge in graph.edges:
        src = edge.source.replace('"', '\\"')
        tgt = edge.target.replace('"', '\\"')
        lines.append(f'    "{src}" -> "{tgt}" [label="{edge.edge_type}"];')

    lines.append('}')
    return '\n'.join(lines)

def export_markdown(graph: CodeGraph) -> str:
    """Export as human-readable Markdown report."""
    stats = graph.stats()
    lines = [
        "# Code Graph Report",
        "",
        "## Summary",
        f"- **Files**: {stats['files']}",
        f"- **Nodes**: {stats['nodes']}",
        f"- **Edges**: {stats['edges']}",
        f"- **Bridges**: {stats['bridges']}",
        f"- **Languages**: {', '.join(stats['languages'])}",
        "",
    ]

    # Edge types
    if stats['edge_types']:
        lines.append("## Relationship Types")
        for etype, count in stats['edge_types'].items():
            lines.append(f"- {etype}: {count}")
        lines.append("")

    # Cross-language bridges
    if graph.bridges:
        lines.append("## Cross-Language Bridges")
        lines.append("")

        for btype in ['mqtt', 'http', 'websocket', 'serial', 'env']:
            type_bridges = [b for b in graph.bridges if b.bridge_type == btype]
            if not type_bridges:
                continue

            lines.append(f"### {btype.upper()} Bridges")
            lines.append("")

            for bridge in type_bridges:
                is_broken = bridge.key.startswith("UNMATCHED:") or bridge.key.startswith("UNDEFINED:")
                icon = "🔴" if is_broken else "🔗"
                lines.append(f"**{icon} {bridge.key}**")

                if bridge.producers:
                    lines.append("  Producers:")
                    for p in bridge.producers:
                        lines.append(f"  - `{p['file']}:{p['line']}` ({p['language']}) — {p['action']}")
                elif is_broken:
                    lines.append("  Producers: ⚠️ **NONE** — no definition found")

                if bridge.consumers:
                    lines.append("  Consumers:")
                    for c in bridge.consumers:
                        lines.append(f"  - `{c['file']}:{c['line']}` ({c['language']}) — {c['action']}")
                elif not is_broken:
                    lines.append("  Consumers: ⚠️ **NONE** — defined but never consumed")

                lines.append("")

    # Orphan files (no connections)
    connected_files = set()
    for edge in graph.edges:
        src_node = graph.nodes.get(edge.source)
        tgt_node = graph.nodes.get(edge.target)
        if src_node and src_node.file:
            connected_files.add(src_node.file)
        if tgt_node and tgt_node.file:
            connected_files.add(tgt_node.file)

    all_files = {n.file for n in graph.nodes.values() if n.file and n.node_type == "file"}
    orphans = all_files - connected_files
    if orphans:
        lines.append("## Orphan Files (No Connections Detected)")
        for f in sorted(orphans):
            lines.append(f"- `{f}`")
        lines.append("")

    # File clusters
    clusters = graph.file_clusters(min_size=2)
    if clusters:
        lines.append("## File Clusters (Connected Components)")
        lines.append("")
        for i, cluster in enumerate(clusters, 1):
            lines.append(f"### Cluster {i} ({len(cluster)} files)")
            for f in sorted(cluster):
                lines.append(f"- `{f}`")
            lines.append("")

    return '\n'.join(lines)


# ════════════════════════════════════════════════════════════════════════════
# Review Swarm Integration
# ════════════════════════════════════════════════════════════════════════════

def export_review_clusters(graph: CodeGraph) -> str:
    """Generate file clusters optimized for code review agent routing.

    This is the integration point with code-review-swarm. Instead of routing
    files by keyword/extension, the review swarm reads this output and sends
    each cluster to an agent as a coherent unit.
    """
    clusters = graph.file_clusters(min_size=2)
    bridge_files = defaultdict(set)
    for bridge in graph.bridges:
        for p in bridge.producers + bridge.consumers:
            bridge_files[bridge.bridge_type].add(p['file'])

    output = {
        "clusters": [],
        "bridge_groups": {},
        "orphans": [],
    }

    for i, cluster in enumerate(clusters):
        # Determine the dominant language in this cluster
        langs = defaultdict(int)
        for f in cluster:
            node = graph.nodes.get(f"file:{f}")
            if node:
                langs[node.language] += 1
        dominant = max(langs, key=langs.get) if langs else "unknown"

        # Determine which bridges this cluster touches
        touched_bridges = []
        for btype, bfiles in bridge_files.items():
            if cluster & bfiles:
                touched_bridges.append(btype)

        output["clusters"].append({
            "id": i,
            "files": sorted(cluster),
            "dominant_language": dominant,
            "bridges": touched_bridges,
            "size": len(cluster),
        })

    # Bridge groups: files grouped by the bridge they participate in
    for btype, files in bridge_files.items():
        output["bridge_groups"][btype] = sorted(files)

    # Orphan files
    all_clustered = set()
    for c in clusters:
        all_clustered |= c
    all_files = {n.file for n in graph.nodes.values() if n.file and n.node_type == "file"}
    output["orphans"] = sorted(all_files - all_clustered)

    return json.dumps(output, indent=2)


# ════════════════════════════════════════════════════════════════════════════
# Main Pipeline
# ════════════════════════════════════════════════════════════════════════════

def build_graph(project_root: Path) -> CodeGraph:
    """Full pipeline: discover → parse → bridge → return graph."""
    graph = CodeGraph()
    files = discover_files(project_root)

    for fpath in files:
        relp = rel_path(fpath, project_root)
        content = read_file_safe(fpath)
        if not content:
            continue

        ext = fpath.suffix.lower()
        fname = fpath.name

        if fname.startswith('.env'):
            parse_env_file(fpath, content, relp, graph)
        elif ext in ('.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'):
            parse_javascript(fpath, content, relp, graph)
        elif ext == '.py':
            parse_python(fpath, content, relp, graph)
        elif ext in ('.cpp', '.c', '.h', '.hpp', '.ino'):
            parse_cpp_arduino(fpath, content, relp, graph)
        elif fname == 'package.json':
            parse_config_files(fpath, content, relp, graph)

    # Detect cross-language bridges
    detect_bridges(graph)

    return graph


def main():
    parser = argparse.ArgumentParser(
        description="codegraph — Deterministic dependency graph builder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python codegraph.py .                          Build graph, output markdown
  python codegraph.py . --format json            Full graph as JSON
  python codegraph.py . --trace src/api/auth.js  Subgraph from a file
  python codegraph.py . --trace "sensors/#"      Everything touching an MQTT topic
  python codegraph.py . --bridges-only           Just cross-language connections
  python codegraph.py . --clusters               File clusters for review routing
        """
    )
    parser.add_argument("project_dir", help="Project root directory")
    parser.add_argument("--format", "-f", choices=["json", "mermaid", "dot", "markdown"],
                        default="markdown", help="Output format (default: markdown)")
    parser.add_argument("--trace", "-t", help="Extract subgraph reachable from this node")
    parser.add_argument("--depth", "-d", type=int, default=10,
                        help="Max traversal depth for --trace (default: 10)")
    parser.add_argument("--bridges-only", "-b", action="store_true",
                        help="Only show cross-language bridges")
    parser.add_argument("--clusters", "-c", action="store_true",
                        help="Output file clusters for review agent routing")
    parser.add_argument("--output", "-o", help="Output file (default: stdout)")
    parser.add_argument("--quiet", "-q", action="store_true",
                        help="Suppress progress messages")

    args = parser.parse_args()
    project_root = Path(args.project_dir).resolve()

    if not project_root.is_dir():
        print(f"Error: {project_root} is not a directory", file=sys.stderr)
        sys.exit(1)

    # Build the graph
    if not args.quiet:
        print(f"Scanning {project_root}...", file=sys.stderr)

    graph = build_graph(project_root)

    if not args.quiet:
        stats = graph.stats()
        print(f"Found {stats['files']} files, {stats['nodes']} nodes, "
              f"{stats['edges']} edges, {stats['bridges']} bridges", file=sys.stderr)

    # Subgraph extraction
    if args.trace:
        # Try to find the node by various ID patterns
        trace_id = args.trace
        candidates = [
            trace_id,
            f"file:{trace_id}",
            f"mqtt:{trace_id}",
            f"ws:{trace_id}",
            f"env:{trace_id}",
        ]
        found = False
        for cid in candidates:
            if cid in graph.nodes:
                trace_id = cid
                found = True
                break
        if not found:
            # Fuzzy match
            matches = [nid for nid in graph.nodes if trace_id in nid]
            if matches:
                trace_id = matches[0]
                if not args.quiet:
                    print(f"Matched to: {trace_id}", file=sys.stderr)
            else:
                print(f"Warning: No node matching '{args.trace}' found", file=sys.stderr)

        graph = graph.subgraph(trace_id, max_depth=args.depth)
        if not args.quiet:
            stats = graph.stats()
            print(f"Subgraph: {stats['files']} files, {stats['nodes']} nodes, "
                  f"{stats['edges']} edges", file=sys.stderr)

    # Output
    if args.bridges_only:
        output = json.dumps([b.to_dict() for b in graph.bridges], indent=2)
    elif args.clusters:
        output = export_review_clusters(graph)
    elif args.format == "json":
        output = export_json(graph)
    elif args.format == "mermaid":
        output = export_mermaid(graph)
    elif args.format == "dot":
        output = export_dot(graph)
    else:
        output = export_markdown(graph)

    if args.output:
        Path(args.output).write_text(output)
        if not args.quiet:
            print(f"Written to {args.output}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
