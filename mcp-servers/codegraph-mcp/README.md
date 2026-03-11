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

Automatically ignores: `node_modules`, `.git`, `dist`, `build`, `__pycache__`, `.venv`, `.pio`, `*.min.js`

## Tools

| Tool | Description |
|---|---|
| `codegraph_scan` | **Call first.** Scans a directory and builds the graph in memory. Also scans doc files (`.md`, `.mdx`, `.rst`, `.txt`) for code references. |
| `codegraph_get_dependencies` | What does file X import? |
| `codegraph_get_dependents` | What files import file X? |
| `codegraph_get_change_impact` | Full blast radius if file(s) change (direct + transitive) |
| `codegraph_get_subgraph` | Local neighborhood around a file (configurable depth) |
| `codegraph_find_entry_points` | Files at the top of the tree (nothing imports them) |
| `codegraph_list_files` | All files in the graph, with language filter + pagination |
| `codegraph_get_stats` | Codebase overview: most connected, most depended-on, etc. |
| `codegraph_find_related_docs` | Find all documentation files affected by code changes |

### codegraph_find_related_docs

Given a set of changed code files, finds **all** documentation that needs to be reviewed and potentially updated. This is deterministic — it does not guess. It works by:

1. Computing the full blast radius of the changed files (direct + transitive dependents via the import graph)
2. Finding every documentation file (`.md`, `.mdx`, `.rst`, `.txt`) that references ANY code file in that blast radius
3. Returning an exhaustive list with the exact reason each doc matched

This is designed for enforcing documentation sync — the output is the complete set of docs that **must** be reviewed after a code change. No judgment calls, no optional updates.

```
codegraph_find_related_docs({ files: ["src/utils/api.ts"] })
→ {
    affected_docs: [
      { doc: "docs/api-guide.md", reason: "references src/utils/api.ts" },
      { doc: "README.md", reason: "references src/utils/api.ts" }
    ],
    blast_radius: ["src/utils/api.ts", "src/pages/Dashboard.tsx", ...]
  }
```

## Installation

```bash
cd codegraph-mcp-server
npm install
npm run build
```

Requires Node.js >= 18.0.0.

## Configuration

Add to your `.claude/mcp.json` (or `claude_desktop_config.json`):

**macOS / Linux:**

```json
{
  "mcpServers": {
    "codegraph": {
      "command": "node",
      "args": ["/path/to/codegraph-mcp-server/dist/index.js"]
    }
  }
}
```

**Windows:**

```json
{
  "mcpServers": {
    "codegraph": {
      "command": "cmd",
      "args": [
        "/c",
        "node",
        "C:\\Users\\you\\path\\to\\codegraph-mcp-server\\dist\\index.js"
      ]
    }
  }
}
```

## Usage Workflow

```
1. codegraph_scan({ root_dir: "/path/to/my-app" })
   → Scans all files and builds the graph

2. codegraph_get_stats()
   → Overview: 47 files, most depended-on is "src/utils/api.ts" (12 dependents)

3. codegraph_get_change_impact({ files: ["src/utils/api.ts"] })
   → Blast radius: 12 directly affected, 8 transitively = 42% of codebase

4. codegraph_get_subgraph({ file: "api.ts", depth: 2 })
   → Full local context before making changes

5. codegraph_find_related_docs({ files: ["src/utils/api.ts"] })
   → Docs that reference changed or affected files and need review
```

## Features

- **TypeScript path aliases**: Resolves paths from `tsconfig.json` (`baseUrl` and `paths`)
- **Doc scanning**: Scans `.md`, `.mdx`, `.rst`, `.txt` files for references to code files
- **Fuzzy file resolution**: Query by filename, relative path, or absolute path
- **Pagination**: `codegraph_list_files` supports `offset` and `limit` for large codebases

## Quality Hook Integration

This server pairs well with completion-verification hooks. When an agent claims
"I changed X and nothing else was affected," a hook can call:

```
codegraph_get_change_impact({ files: ["X"] })
```

...and verify the agent's claim against the actual dependency graph before
accepting task completion.

Similarly, enforce doc-sync after any code change:

```
codegraph_find_related_docs({ files: ["X"] })
```

...to get the complete list of docs that must be reviewed.

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
