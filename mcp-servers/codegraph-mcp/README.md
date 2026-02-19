# codegraph-mcp-server

A deterministic static analysis MCP server that builds real dependency graphs for your codebases and exposes them as queryable tools in Claude Code.

No AI guessing — pure AST/regex parsing to map actual import/include relationships.

## Supported Languages

| Language | Extensions | What's parsed |
|---|---|---|
| TypeScript | `.ts`, `.tsx` | `import`, re-exports |
| JavaScript | `.js`, `.jsx`, `.mjs`, `.cjs` | `import`, `require()`, dynamic `import()` |
| Python | `.py` | `import`, `from x import` (absolute + relative) |
| C++ | `.cpp`, `.c`, `.h`, `.hpp` | `#include "local.h"` |
| Arduino | `.ino` | `#include "local.h"` |

Automatically ignores: `node_modules`, `.git`, `dist`, `build`, `__pycache__`, `.venv`, `.pio`

## Tools

| Tool | Description |
|---|---|
| `codegraph_scan` | **Call first.** Scans a directory and builds the graph in memory |
| `codegraph_get_dependencies` | What does file X import? |
| `codegraph_get_dependents` | What files import file X? |
| `codegraph_get_change_impact` | Full blast radius if file(s) change |
| `codegraph_get_subgraph` | Local neighborhood around a file (configurable depth) |
| `codegraph_find_entry_points` | Files at the top of the tree (nothing imports them) |
| `codegraph_list_files` | All files in the graph, with language filter + pagination |
| `codegraph_get_stats` | Codebase overview: most connected, most depended-on, etc. |

## Installation

```bash
# Clone or copy this folder
cd codegraph-mcp-server
npm install
npm run build
```

## Claude Code Configuration (Windows)

Add to your `claude_desktop_config.json` or `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "codegraph": {
      "command": "cmd",
      "args": [
        "/c",
        "node",
        "C:\\Users\\maxco\\path\\to\\codegraph-mcp-server\\dist\\index.js"
      ]
    }
  }
}
```

## Usage Workflow

```
1. codegraph_scan({ root_dir: "C:\\Users\\maxco\\projects\\my-app" })
   → Scans all files and builds the graph

2. codegraph_get_stats()
   → Overview: 47 files, most depended-on is "src/utils/api.ts" (12 dependents)

3. codegraph_get_change_impact({ files: ["src/utils/api.ts"] })
   → Blast radius: 12 directly affected, 8 transitively = 42% of codebase

4. codegraph_get_subgraph({ file: "api.ts", depth: 2 })
   → Full local context before making changes
```

## Quality Hook Integration

This server pairs well with completion-verification hooks. When an agent claims
"I changed X and nothing else was affected," a hook can call:

```
codegraph_get_change_impact({ files: ["X"] })
```

...and verify the agent's claim against the actual dependency graph before
accepting task completion.

## Graph Lifecycle

- The graph is built in memory when you call `codegraph_scan`
- It persists for the entire Claude Code session
- Re-call `codegraph_scan` if you've made significant file changes
- Absolute file paths are used internally; relative paths are shown in results

## Building

```bash
npm run build    # Compile TypeScript → dist/
npm start        # Run server (stdio transport)
```
