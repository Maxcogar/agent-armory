# codegraph

Deterministic dependency graph builder for full-stack + IoT codebases.

Parses imports, function calls, API endpoints, MQTT topics, WebSocket events, serial connections, and environment variables across JavaScript/TypeScript, Python, and C++/Arduino. Detects cross-language bridges where different parts of your stack communicate through shared strings (MQTT topics, HTTP endpoints, socket events, env vars).

**Zero dependencies.** Python 3.8+ stdlib only. No pip install, no node_modules, just copy and run.

## Why This Exists

LLMs are bad at tracing code connections. They grep, they guess, they hallucinate relationships. If you ask three different models to map your codebase connections, you get three different incomplete answers.

`codegraph` replaces the guessing with a deterministic parser. It builds a directed graph of actual code relationships by reading your source files, then outputs structured data that both humans and AI agents can consume as ground truth.

## Quick Start

```bash
# Full report
python codegraph.py /path/to/project

# Trace everything connected to a specific file
python codegraph.py /path/to/project --trace src/api/auth.js

# Trace from an MQTT topic across all languages
python codegraph.py /path/to/project --trace "sensors/temperature"

# Limit trace depth for focused results
python codegraph.py /path/to/project --trace auth.js --depth 2

# Just show cross-language bridges
python codegraph.py /path/to/project --bridges-only

# Generate file clusters for code review routing
python codegraph.py /path/to/project --clusters
```

## Output Formats

| Format | Flag | Use Case |
|--------|------|----------|
| Markdown | `--format markdown` (default) | Human-readable report |
| JSON | `--format json` | Machine consumption, agent input |
| Mermaid | `--format mermaid` | Visual diagrams (paste into GitHub/Notion) |
| DOT | `--format dot` | GraphViz rendering |
| Bridges | `--bridges-only` | Just cross-language connections as JSON |
| Clusters | `--clusters` | File groups for review agent routing |

## What It Detects

### Within a Language

- **JS/TS**: `import`/`require`, `export`, Express/Fastify routes, `fetch`/`axios` calls, Socket.io emit/on, MQTT publish/subscribe, `process.env` usage
- **Python**: `import`/`from import`, function/class definitions, Flask/FastAPI routes, `requests` calls, paho-mqtt pub/sub, `serial` read/write, `os.environ`/`os.getenv`
- **C++/Arduino**: `#include`, function definitions, PubSubClient MQTT, `Serial.print`/`Serial.read`, ESP32 HTTPClient

### Cross-Language Bridges

These are the connections that LLMs consistently miss — where two files in different languages communicate through a shared string:

- **MQTT**: ESP32 publishes to `sensors/esp32-01/telemetry` → Python Pi hub subscribes to `sensors/#` → Node.js backend subscribes to `sensors/+/telemetry`. Codegraph matches all three including wildcard patterns (`#` and `+`).
- **HTTP**: Express defines `GET /api/sensors` → React calls `fetch('/api/sensors')` → ESP32 calls `http.begin("http://server/api/sensors")`. Codegraph normalizes path parameters (`:id`, `{id}`, `${id}`) for matching.
- **WebSocket**: Server emits `sensor-update` → Client listens for `sensor-update`. Matched by event name across files.
- **Serial**: Arduino `Serial.println()` → Python `ser.readline()`. Detected as a serial bridge.
- **Environment Variables**: `.env` defines `JWT_SECRET` → `auth.js` reads `process.env.JWT_SECRET` → matched as an env bridge. Undefined vars (used but not in any `.env` file) are flagged.

### Broken Connections

Codegraph flags problems it finds:

- `UNMATCHED:` HTTP endpoints called but never defined (404 waiting to happen)
- `UNDEFINED:` env vars used but not in any `.env` file
- MQTT topics with subscribers but no publishers (dead listeners)
- Orphan files with no detected connections

## Use Cases

### Tech Debt Tracing

"I need to refactor the auth system. What files are affected?"

```bash
python codegraph.py . --trace auth.js --depth 3
```

Returns every file within 3 hops of auth.js — not grep matches, but actual import chains, the routes that use the middleware, the env vars it reads, and the tests that cover it.

### Pre-Refactor Impact Analysis

"If I change this MQTT topic structure, what breaks?"

```bash
python codegraph.py . --trace "sensors/+/telemetry"
```

Shows every file across every language that publishes to, subscribes to, or wildcards against that topic pattern.

### Code Review Routing

"Send each review agent a coherent cluster of related files instead of random groups."

```bash
python codegraph.py . --clusters > .code-review/graph_clusters.json
```

The `code-review-swarm` tool reads this file when present and routes files by actual connectivity instead of keyword/extension matching.

### Onboarding Documentation

"Generate a visual map of how the codebase is connected."

```bash
python codegraph.py . --format mermaid > ARCHITECTURE.mermaid
```

Paste into GitHub or Notion for an auto-generated architecture diagram.

## Integration with code-review-swarm

When `codegraph` output exists, `review.sh` uses it for smarter file routing:

```bash
# In your project, before running a review:
python codegraph.py . --clusters -o .code-review/graph_clusters.json

# The review swarm will automatically detect and use it:
./review.sh .
```

The review swarm reads `bridge_groups` from the cluster output and assigns files to agents by their actual connectivity rather than file extensions. This means the MQTT review agent gets the ESP32 firmware, Pi hub Python, and Node.js MQTT handler as a single coherent unit — because they're all part of the same data pipeline.

## Subgraph Depth

The `--depth` flag controls how far the BFS traversal goes from your starting node:

- `--depth 1`: Direct connections only (imports this file, imported by this file)
- `--depth 2`: One hop further (files that import files that import yours)
- `--depth 3-5`: Typical useful range for feature-level tracing
- `--depth 10` (default): Reaches most of the connected component

In a small, tightly-coupled project, even depth 2 might reach everything. In a larger project with clear module boundaries, depth 3-5 gives you feature-level subgraphs.

## Limitations

**Regex-based, not AST-based.** Codegraph uses regular expressions to parse imports and patterns, not full ASTs. This means it will miss:
- Dynamic imports built from variables (`import(getModulePath())`)
- Computed MQTT topics (`client.publish(prefix + deviceId + "/data", ...)`)
- Indirect function calls through dependency injection
- Complex metaprogramming patterns

For most codebases, regex captures 85-95% of connections. The remaining 5-15% are usually dynamic patterns that would require runtime tracing anyway.

**No execution-time tracing.** Codegraph reads source code statically. It can't detect connections that only exist at runtime (e.g., topics generated from database queries, routes registered dynamically).

**Single project scope.** Codegraph analyzes one project directory. It doesn't follow external package internals or cross-repository connections.

**MQTT wildcard matching is one-directional.** If code subscribes to `sensors/#` and publishes to `sensors/esp32-01/telemetry`, codegraph will match them. But it won't infer that a subscriber to `sensors/+/telemetry` should also match `sensors/esp32-01/data` — it only matches exact topics and explicit wildcards found in the source.
