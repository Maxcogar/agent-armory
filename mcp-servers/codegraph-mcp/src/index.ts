import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as path from "path";

import { DependencyGraph, Language } from "./types.js";
import { buildDependencyGraph } from "./graph.js";
import {
  toolGetDependencies,
  toolGetDependents,
  toolGetChangeImpact,
  toolGetSubgraph,
  toolFindEntryPoints,
  toolListFiles,
  toolGetStats,
} from "./tools/query.js";

// ============================================================
// Response Helpers
// ============================================================

function okResponse(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errResponse(message: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: message }],
  };
}

function noGraphError() {
  return errResponse("No graph loaded. Call codegraph_scan first with the project root directory.");
}

function isToolError(result: unknown): result is { error: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as Record<string, unknown>).error === "string"
  );
}

// ============================================================
// Server State
// ============================================================

let currentGraph: DependencyGraph | null = null;

const LANGUAGE_VALUES = [
  "javascript",
  "typescript",
  "python",
  "cpp",
  "arduino",
  "unknown",
] as const;

// ============================================================
// MCP Server Setup
// ============================================================

const server = new McpServer({
  name: "codegraph-mcp-server",
  version: "1.0.0",
});

// ============================================================
// Tool: codegraph_scan
// ============================================================

server.registerTool(
  "codegraph_scan",
  {
    title: "Scan Codebase and Build Dependency Graph",
    description: `Scans a project directory and builds a complete dependency graph for all JS/TS, Python, and C++/Arduino files.

This MUST be called first before using any other codegraph tools. It performs static analysis (no AI, fully deterministic) to map all import/require/include relationships.

After scanning, the graph is held in memory for all subsequent queries in this session. Re-scan if files have changed.

Supported languages:
- JavaScript (.js, .jsx, .mjs, .cjs): import/require/dynamic import
- TypeScript (.ts, .tsx): import statements
- Python (.py): import/from import (absolute and relative)
- C++/Arduino (.cpp, .c, .h, .hpp, .ino): local #include "file.h"

Automatically ignores: node_modules, .git, dist, build, __pycache__, .venv, .pio, *.min.js

Args:
  - root_dir (string): Absolute path to the project root directory to scan

Returns:
  Summary of the scan including file counts by language and any parse errors.`,
    inputSchema: {
      root_dir: z
        .string()
        .describe("Absolute path to the project root directory to scan"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ root_dir }) => {
    const normalizedRoot = path.resolve(root_dir);
    process.stderr.write(`[codegraph] Scanning: ${normalizedRoot}\n`);

    try {
      currentGraph = await buildDependencyGraph(normalizedRoot);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return errResponse(`Error scanning directory: ${msg}`);
    }

    const stats = toolGetStats(currentGraph);
    return okResponse({
      status: "success",
      rootDir: currentGraph.rootDir,
      totalFiles: currentGraph.totalFiles,
      byLanguage: stats.byLanguage,
      parseErrors: currentGraph.parseErrors.length,
      parseErrorDetails:
        currentGraph.parseErrors.length > 0
          ? currentGraph.parseErrors.slice(0, 5)
          : undefined,
      message: `Graph built. ${currentGraph.totalFiles} files scanned. Use codegraph_get_stats for full overview.`,
    });
  }
);

// ============================================================
// Tool: codegraph_get_dependencies
// ============================================================

server.registerTool(
  "codegraph_get_dependencies",
  {
    title: "Get File Dependencies",
    description: `Returns all files that a given file directly imports or includes.

These are the files this file NEEDS to function — its direct dependencies.

Args:
  - file (string): File path to query. Can be:
    - Relative path from project root: "src/auth/login.ts"
    - Just the filename: "login.ts" (must be unique in the project)
    - Absolute path

Returns:
  List of files imported by the queried file, with their language.

Example use cases:
  - "What does auth.js import?" → file="auth.js"
  - "What are the dependencies of the entry point?" → file="index.ts"
  - "What headers does my Arduino sketch include?" → file="main.ino"

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      file: z
        .string()
        .describe("File path to query (relative, absolute, or just filename)"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ file }) => {
    if (!currentGraph) return noGraphError();
    const result = toolGetDependencies(currentGraph, file);
    if (isToolError(result)) return errResponse(result.error);
    return okResponse(result);
  }
);

// ============================================================
// Tool: codegraph_get_dependents
// ============================================================

server.registerTool(
  "codegraph_get_dependents",
  {
    title: "Get File Dependents",
    description: `Returns all files that directly import or include a given file.

These are the files that DEPEND ON this file — changing it could break all of them.

Args:
  - file (string): File path to query. Can be relative, absolute, or just the filename.

Returns:
  List of files that import the queried file, with their language.

Example use cases:
  - "What files use auth.js?" → file="auth.js"
  - "What breaks if I change this utility?" → file="utils/helpers.ts"
  - "What Arduino files include this header?" → file="config.h"
  - "Is this file safe to delete?" → check if dependentCount is 0

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      file: z
        .string()
        .describe("File path to query (relative, absolute, or just filename)"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ file }) => {
    if (!currentGraph) return noGraphError();
    const result = toolGetDependents(currentGraph, file);
    if (isToolError(result)) return errResponse(result.error);
    return okResponse(result);
  }
);

// ============================================================
// Tool: codegraph_get_change_impact
// ============================================================

server.registerTool(
  "codegraph_get_change_impact",
  {
    title: "Get Change Impact (Blast Radius)",
    description: `Calculates the full impact of changing one or more files — the "blast radius".

Returns both direct dependents (one hop away) and transitive dependents (all hops up the chain). Use this BEFORE making changes to understand what could break, or AFTER an agent claims completion to verify the impact was correctly assessed.

Args:
  - files (string[]): Array of file paths being changed.

Returns:
  - changedFiles: The files being changed
  - directlyAffected: Files that directly import the changed files
  - transitivelyAffected: Files affected through indirect chains
  - totalImpacted: Total count of affected files
  - blastRadius: Changed files + all affected files
  - coveragePercent: Percentage of the whole codebase affected

Example use cases:
  - "What breaks if I refactor auth.ts?" → files=["auth.ts"]
  - "Impact of changing the DB layer?" → files=["db.ts", "models.ts"]
  - "Verify agent's completion claim" → compare claimed vs actual blast radius

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      files: z
        .array(z.string())
        .min(1)
        .max(20)
        .describe("Array of file paths to analyze for change impact"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ files }) => {
    if (!currentGraph) return noGraphError();
    const result = toolGetChangeImpact(currentGraph, files);
    if (isToolError(result)) return errResponse(result.error);
    return okResponse(result);
  }
);

// ============================================================
// Tool: codegraph_get_subgraph
// ============================================================

server.registerTool(
  "codegraph_get_subgraph",
  {
    title: "Get Subgraph Around a File",
    description: `Returns the local dependency neighborhood around a file up to a given depth.

Explores both directions: what this file imports (dependencies) AND what imports this file (dependents). Useful for understanding the full context of a file before modifying it.

Args:
  - file (string): Center file for the subgraph
  - depth (number): Hops to explore in each direction (1-5, default: 2)
    - depth=1: Direct connections only
    - depth=2: Direct + their direct connections

Returns:
  - nodes: All files in the neighborhood with distance from center and direction
  - edges: All import relationships between nodes in the subgraph

Example use cases:
  - "Show me the context around auth.ts" → file="auth.ts", depth=2
  - "Map the middleware layer" → file="middleware.ts", depth=3

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      file: z
        .string()
        .describe("Center file for the subgraph (relative, absolute, or filename)"),
      depth: z
        .number()
        .int()
        .min(1)
        .max(5)
        .default(2)
        .describe("Number of hops to explore in each direction (1-5, default: 2)"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ file, depth }) => {
    if (!currentGraph) return noGraphError();
    const result = toolGetSubgraph(currentGraph, file, depth);
    if (isToolError(result)) return errResponse(result.error);
    return okResponse(result);
  }
);

// ============================================================
// Tool: codegraph_find_entry_points
// ============================================================

server.registerTool(
  "codegraph_find_entry_points",
  {
    title: "Find Entry Points",
    description: `Finds all entry point files — files that nothing else imports.

Entry points are at the "top" of the dependency tree: main files, CLI scripts, test files, route handlers. They have dependencies but no dependents within the project.

Args:
  - language (string, optional): Filter by language: javascript, typescript, python, cpp, arduino, unknown.

Returns:
  List of entry point files with their language.

Example use cases:
  - "What are the main entry points?" → no language filter
  - "Find standalone Python scripts" → language="python"
  - "What are my Arduino main sketches?" → language="arduino"

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      language: z
        .enum(LANGUAGE_VALUES)
        .optional()
        .describe("Optional: filter by language"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ language }) => {
    if (!currentGraph) return noGraphError();
    const entries = toolFindEntryPoints(currentGraph, language as Language | undefined);
    return okResponse({ entryPoints: entries, count: entries.length });
  }
);

// ============================================================
// Tool: codegraph_list_files
// ============================================================

server.registerTool(
  "codegraph_list_files",
  {
    title: "List All Files in Graph",
    description: `Lists all files currently in the dependency graph, sorted by relative path.

Use this to discover available files before querying them, or to get an overview of what was scanned.

Args:
  - language (string, optional): Filter by language.
  - limit (number, optional): Max files to return (default: 200, max: 500)
  - offset (number, optional): Pagination offset (default: 0)

Returns:
  - files: Array of file references with paths and languages
  - total: Total matching count
  - has_more: Whether there are more files beyond this page

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      language: z
        .enum(LANGUAGE_VALUES)
        .optional()
        .describe("Optional: filter by language"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .default(200)
        .describe("Maximum files to return (default: 200)"),
      offset: z
        .number()
        .int()
        .min(0)
        .default(0)
        .describe("Pagination offset (default: 0)"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ language, limit, offset }) => {
    if (!currentGraph) return noGraphError();
    const result = toolListFiles(
      currentGraph,
      language as Language | undefined,
      limit,
      offset
    );
    return okResponse(result);
  }
);

// ============================================================
// Tool: codegraph_get_stats
// ============================================================

server.registerTool(
  "codegraph_get_stats",
  {
    title: "Get Graph Statistics",
    description: `Returns comprehensive statistics about the scanned codebase.

Provides an overview of the entire dependency graph: file counts by language, most connected files, most imported files (likely core utilities), entry points, and health metrics.

Args: None

Returns:
  - totalFiles: Total files in the graph
  - byLanguage: File count by language
  - entryPoints: Top entry point files
  - mostConnected: Files with most total connections
  - mostDependedOn: Files most frequently imported by others (critical shared modules)
  - averageDependencies: Average imports per file
  - parseErrors: Count of files that failed to parse

Example use cases:
  - "Give me a codebase overview" → high-level stats
  - "What are the most critical shared files?" → check mostDependedOn
  - "How complex is this codebase?" → check averageDependencies

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    if (!currentGraph) return noGraphError();
    return okResponse(toolGetStats(currentGraph));
  }
);

// ============================================================
// Start Server
// ============================================================

async function run(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[codegraph-mcp-server] Ready. Call codegraph_scan to begin.\n");
}

run().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[codegraph-mcp-server] Fatal error: ${msg}\n`);
  process.exit(1);
});
