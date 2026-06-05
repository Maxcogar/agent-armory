import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as path from "path";

import { DependencyGraph, Language } from "./types.js";
import {
  buildDependencyGraph,
  incrementalUpdate,
  DEFAULT_IGNORE_PATTERNS,
  type BuildGraphOptions,
} from "./graph.js";
import { saveCache, loadCache } from "./cache.js";
import { startWatch, stopWatch } from "./watch.js";
import {
  toolGetDependencies,
  toolGetDependents,
  toolGetChangeImpact,
  toolGetSubgraph,
  toolFindEntryPoints,
  toolListFiles,
  toolListDocs,
  toolGetStats,
  toolFindRelatedDocs,
  toolFindCycles,
  toolGetPathBetween,
  toolFindOrphans,
  toolGetLayers,
  toolFindBrokenImports,
  toolListExternalDependencies,
  toolGetExternalUsers,
  toolExportMermaid,
  toolExportDot,
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
// Build options from the most recent scan, replayed by incremental rescans and
// the file watcher so they discover the same file set.
let lastBuildOptions: BuildGraphOptions | undefined;

const LANGUAGE_VALUES = [
  "javascript",
  "typescript",
  "python",
  "cpp",
  "arduino",
  "config",
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

Default ignores: node_modules, .git, dist, build, __pycache__, .venv, .pio, *.min.js

Now supports TypeScript path aliases (from tsconfig.json) and baseUrl resolution for non-relative imports.

Args:
  - root_dir (string): Absolute path to the project root directory to scan
  - ignore_patterns (string[], optional): Custom ignore glob patterns. Replaces the defaults entirely.
  - additional_ignore_patterns (string[], optional): Extra ignore patterns appended to the defaults.

Returns:
  Summary of the scan including file counts by language and any parse errors.`,
    inputSchema: {
      root_dir: z
        .string()
        .describe("Absolute path to the project root directory to scan"),
      ignore_patterns: z
        .array(z.string())
        .optional()
        .describe(
          "Custom ignore glob patterns that replace the defaults entirely. " +
          "Default ignores: " + DEFAULT_IGNORE_PATTERNS.join(", ")
        ),
      additional_ignore_patterns: z
        .array(z.string())
        .optional()
        .describe(
          "Extra ignore glob patterns appended to the defaults (e.g. ['**/test/**', '**/fixtures/**'])"
        ),
      force: z
        .boolean()
        .optional()
        .describe(
          "Force a full rebuild, bypassing the cache and any in-memory graph. " +
          "Use after changing a non-tracked config (e.g. tsconfig.json) or to recover from a stale incremental result."
        ),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ root_dir, ignore_patterns, additional_ignore_patterns, force }) => {
    const normalizedRoot = path.resolve(root_dir);
    const options: BuildGraphOptions = {
      ignorePatterns: ignore_patterns,
      additionalIgnorePatterns: additional_ignore_patterns,
    };

    // Choose a base graph for an incremental update: the in-memory graph if it
    // is for this same root, else a cached graph from a prior session. With no
    // base (or force), do a full rebuild.
    const base =
      !force &&
      (currentGraph && currentGraph.rootDir === normalizedRoot
        ? currentGraph
        : loadCache(normalizedRoot));

    let mode: "full" | "incremental";
    let delta: { added: number; changed: number; removed: number; reused: number } | undefined;
    try {
      if (base) {
        process.stderr.write(`[codegraph] Incremental rescan: ${normalizedRoot}\n`);
        const result = await incrementalUpdate(base, options);
        currentGraph = result.graph;
        delta = result.delta;
        mode = "incremental";
      } else {
        process.stderr.write(`[codegraph] Scanning: ${normalizedRoot}\n`);
        currentGraph = await buildDependencyGraph(normalizedRoot, options);
        mode = "full";
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return errResponse(`Error scanning directory: ${msg}`);
    }

    lastBuildOptions = options;
    try {
      saveCache(currentGraph);
    } catch (err: unknown) {
      // A cache write failure must not fail the scan; the graph is in memory.
      process.stderr.write(
        `[codegraph] cache write failed: ${err instanceof Error ? err.message : String(err)}\n`
      );
    }

    const stats = toolGetStats(currentGraph);
    return okResponse({
      status: "success",
      mode,
      delta,
      rootDir: currentGraph.rootDir,
      totalFiles: currentGraph.totalFiles,
      totalDocFiles: currentGraph.docNodes.size,
      byLanguage: stats.byLanguage,
      parseErrors: currentGraph.parseErrors.length,
      parseErrorDetails:
        currentGraph.parseErrors.length > 0
          ? currentGraph.parseErrors.slice(0, 5)
          : undefined,
      message: `Graph ${mode === "incremental" ? "updated incrementally" : "built"}. ${currentGraph.totalFiles} code files and ${currentGraph.docNodes.size} doc files. Use codegraph_get_stats for a full overview.`,
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
// Tool: codegraph_list_docs
// ============================================================

server.registerTool(
  "codegraph_list_docs",
  {
    title: "List All Documentation Files in Graph",
    description: `Lists all documentation files (.md, .mdx, .rst, .txt) discovered during the scan, sorted by relative path.

codegraph_list_files only returns CODE files (the dependency-graph nodes). Documentation files are scanned into a separate index. Use THIS tool to enumerate docs — e.g. for a docs-only directory where codegraph_list_files returns nothing.

Each entry includes how many code files in the graph the doc references (referencedCodeFileCount), which is useful for finding orphaned docs (count 0) or heavily cross-linked docs.

Args:
  - limit (number, optional): Max docs to return (default: 200, max: 500)
  - offset (number, optional): Pagination offset (default: 0)

Returns:
  - docs: Array of doc references with path, relativePath, and referencedCodeFileCount
  - total: Total doc count
  - has_more: Whether there are more docs beyond this page

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .default(200)
        .describe("Maximum docs to return (default: 200)"),
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
  async ({ limit, offset }) => {
    if (!currentGraph) return noGraphError();
    return okResponse(toolListDocs(currentGraph, limit, offset));
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
// Tool: codegraph_find_cycles
// ============================================================

server.registerTool(
  "codegraph_find_cycles",
  {
    title: "Find Dependency Cycles",
    description: `Detects circular dependencies in the graph — groups of files that import each other directly or transitively (A→B→C→A), plus any file that imports itself.

Each cycle is returned once as an ordered ring of files, normalized to start at the lexicographically smallest path (so the same cycle is never reported in multiple rotations). Computed via strongly-connected-component analysis — deterministic, no guessing.

Args:
  - max_cycles (number, optional): Max cycles to return (default: 50). If more exist, "truncated" is true.

Returns:
  - cycles: Array of cycles, each an ordered array of files in the ring
  - count: Total number of distinct cycles found
  - hasCycles: Whether any cycle exists
  - truncated: Whether more cycles existed than were returned

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      max_cycles: z
        .number()
        .int()
        .min(1)
        .max(500)
        .default(50)
        .describe("Maximum number of cycles to return (default: 50)"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ max_cycles }) => {
    if (!currentGraph) return noGraphError();
    return okResponse(toolFindCycles(currentGraph, max_cycles));
  }
);

// ============================================================
// Tool: codegraph_get_path_between
// ============================================================

server.registerTool(
  "codegraph_get_path_between",
  {
    title: "Get Dependency Path Between Two Files",
    description: `Finds the shortest dependency chain from one file to another, following the import direction. Answers "why does A depend on B?" by showing the exact chain A → ... → B.

If there is no forward path, the result reports found=false and a "reverseExists" hint indicating whether B depends on A instead.

Args:
  - from (string): Starting file (relative, absolute, or filename)
  - to (string): Target file (relative, absolute, or filename)

Returns:
  - from, to: The resolved endpoints
  - path: The chain of files from->...->to (inclusive), or null if unreachable
  - found: Whether a forward dependency path exists
  - length: Number of hops in the path (0 if from===to, null if not found)
  - reverseExists: When not found, whether the reverse path (to->from) exists

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      from: z
        .string()
        .describe("Starting file (relative, absolute, or filename)"),
      to: z
        .string()
        .describe("Target file (relative, absolute, or filename)"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ from, to }) => {
    if (!currentGraph) return noGraphError();
    const result = toolGetPathBetween(currentGraph, from, to);
    if (isToolError(result)) return errResponse(result.error);
    return okResponse(result);
  }
);

// ============================================================
// Tool: codegraph_find_orphans
// ============================================================

server.registerTool(
  "codegraph_find_orphans",
  {
    title: "Find Orphan (Dead) Files",
    description: `Finds orphan files — files with zero dependents AND zero dependencies. Nothing imports them and they import nothing in-project, making them candidates for dead code.

This is distinct from entry points: an entry point imports other files but has no dependents (a root). An orphan has neither. codegraph_find_entry_points deliberately excludes orphans, so this is the only tool that surfaces fully isolated files. (Note: a file may be legitimately isolated — e.g. a standalone script — so review before deleting.)

Args:
  - language (string, optional): Filter by language.

Returns:
  - orphans: Array of isolated files, sorted by path
  - count: Number of orphans

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
    return okResponse(toolFindOrphans(currentGraph, language as Language | undefined));
  }
);

// ============================================================
// Tool: codegraph_get_layers
// ============================================================

server.registerTool(
  "codegraph_get_layers",
  {
    title: "Get Dependency Layers",
    description: `Partitions files into dependency layers (architectural tiers). Layer 0 contains files that import nothing in-project; each subsequent layer contains files whose dependencies all live in earlier layers. This reveals the depth and tiering of the codebase.

Cycles cannot be topologically ordered, so files in a cycle are condensed together and reported in "cyclicNodes". The layering still completes (it never hangs or drops files) and "cyclic" is set true.

Args: None

Returns:
  - layers: Array of layers, each an array of files (layer 0 = deepest dependencies)
  - depth: Number of layers
  - cyclic: Whether the graph contains any dependency cycle
  - cyclicNodes: Files participating in a cycle (empty when acyclic)

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
    return okResponse(toolGetLayers(currentGraph));
  }
);

// ============================================================
// Tool: codegraph_export_mermaid / codegraph_export_dot
// ============================================================

// Shared input schema for both exporters: an optional center file, neighbourhood
// depth, language filter, and a node cap that guards against unrenderable
// whole-graph dumps.
const EXPORT_INPUT_SCHEMA = {
  file: z
    .string()
    .optional()
    .describe(
      "Optional center file (relative, absolute, or filename). When given, the diagram is scoped to its neighbourhood; when omitted, the whole graph is exported (capped by max_nodes)."
    ),
  depth: z
    .number()
    .int()
    .min(1)
    .max(5)
    .default(2)
    .describe("Neighbourhood radius around the center file (default: 2, ignored when no file is given)"),
  language: z
    .enum(LANGUAGE_VALUES)
    .optional()
    .describe("Optional: only include files of this language"),
  max_nodes: z
    .number()
    .int()
    .min(1)
    .max(2000)
    .default(200)
    .describe("Maximum nodes to render; over this, the highest-degree nodes are kept and truncated=true (default: 200)"),
};

server.registerTool(
  "codegraph_export_mermaid",
  {
    title: "Export Dependency Graph as Mermaid",
    description: `Renders the dependency graph (or a file's neighbourhood) as a Mermaid flowchart that can be pasted into Markdown, GitHub, or a Mermaid live editor.

File paths are placed in node labels, never in node IDs (IDs are synthetic, e.g. n0, n1), so paths containing slashes/dots/dashes render correctly. Output is deterministic.

Args:
  - file (string, optional): Center the diagram on this file's neighbourhood. Omit for the whole graph.
  - depth (number, optional): Neighbourhood radius (1-5, default 2). Ignored without a file.
  - language (string, optional): Only include files of this language.
  - max_nodes (number, optional): Cap (default 200). Over this, highest-degree nodes are kept and truncated=true.

Returns: { format, diagram, nodeCount, edgeCount, truncated }

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: EXPORT_INPUT_SCHEMA,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ file, depth, language, max_nodes }) => {
    if (!currentGraph) return noGraphError();
    const result = toolExportMermaid(currentGraph, {
      file,
      depth,
      language: language as Language | undefined,
      maxNodes: max_nodes,
    });
    if (isToolError(result)) return errResponse(result.error);
    return okResponse(result);
  }
);

server.registerTool(
  "codegraph_export_dot",
  {
    title: "Export Dependency Graph as Graphviz DOT",
    description: `Renders the dependency graph (or a file's neighbourhood) as Graphviz DOT, for rendering with \`dot\`/\`graphviz\` into SVG/PNG.

File paths are placed in node labels, never in node IDs (IDs are synthetic, e.g. n0, n1), so paths containing slashes/dots/dashes render correctly. Output is deterministic.

Args:
  - file (string, optional): Center the diagram on this file's neighbourhood. Omit for the whole graph.
  - depth (number, optional): Neighbourhood radius (1-5, default 2). Ignored without a file.
  - language (string, optional): Only include files of this language.
  - max_nodes (number, optional): Cap (default 200). Over this, highest-degree nodes are kept and truncated=true.

Returns: { format, diagram, nodeCount, edgeCount, truncated }

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: EXPORT_INPUT_SCHEMA,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ file, depth, language, max_nodes }) => {
    if (!currentGraph) return noGraphError();
    const result = toolExportDot(currentGraph, {
      file,
      depth,
      language: language as Language | undefined,
      maxNodes: max_nodes,
    });
    if (isToolError(result)) return errResponse(result.error);
    return okResponse(result);
  }
);

// ============================================================
// Tool: codegraph_watch_start / codegraph_watch_stop
// ============================================================

/**
 * Incrementally rebuild the in-memory graph and refresh the cache. Used by the
 * file watcher; assumes a graph is already loaded.
 */
async function rescanCurrentGraph(): Promise<void> {
  if (!currentGraph) return;
  const result = await incrementalUpdate(currentGraph, lastBuildOptions);
  currentGraph = result.graph;
  try {
    saveCache(currentGraph);
  } catch {
    /* cache write best-effort */
  }
}

server.registerTool(
  "codegraph_watch_start",
  {
    title: "Start Watching the Scanned Project",
    description: `Watches the scanned project for file changes and keeps the dependency graph up to date automatically via incremental rescans (debounced to coalesce bursts of edits).

A single watcher is maintained per server; calling this again restarts it on the current root. Use codegraph_watch_stop to stop.

Prerequisite: codegraph_scan must be called first.

Returns: { status, watching, rootDir }`,
    inputSchema: {},
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async () => {
    if (!currentGraph) return noGraphError();
    const rootDir = currentGraph.rootDir;
    try {
      startWatch(rootDir, rescanCurrentGraph);
    } catch (err: unknown) {
      return errResponse(
        `Failed to start watch: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    return okResponse({
      status: "success",
      watching: true,
      rootDir,
      message: `Watching ${rootDir}. The graph will update automatically on file changes.`,
    });
  }
);

server.registerTool(
  "codegraph_watch_stop",
  {
    title: "Stop Watching the Project",
    description: `Stops the active file watcher started by codegraph_watch_start and releases its resources. Safe to call when not watching.

Returns: { status, wasWatching }`,
    inputSchema: {},
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    const wasWatching = stopWatch();
    return okResponse({
      status: "success",
      wasWatching,
      message: wasWatching ? "Watcher stopped." : "No watcher was active.",
    });
  }
);

// ============================================================
// Tool: codegraph_find_broken_imports
// ============================================================

server.registerTool(
  "codegraph_find_broken_imports",
  {
    title: "Find Broken Imports",
    description: `Lists imports that resolved to nothing — a relative/local import or include whose target file does not exist (a typo, a moved/deleted file, a bad path alias).

These are distinct from external packages: an unresolved import is almost always a bug, whereas a bare package specifier (express, lodash) is expected and is reported by codegraph_list_external_dependencies instead.

Returns:
  - broken: { relativePath, raw, line } for each unresolved import
  - count: total broken imports

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
    return okResponse(toolFindBrokenImports(currentGraph));
  }
);

// ============================================================
// Tool: codegraph_list_external_dependencies
// ============================================================

server.registerTool(
  "codegraph_list_external_dependencies",
  {
    title: "List External Dependencies",
    description: `Lists the third-party / built-in packages the code imports (npm, PyPI, system headers) — every import specifier that did not resolve to a project file — aggregated to the package root and ranked by how many files import it.

This is the supply-chain view: "which external packages does this codebase actually use in source, and how widely?" Use codegraph_get_external_users to see which files use a specific one.

Args:
  - language (string, optional): only count imports from files of this language.

Returns:
  - externals: { name, importerCount }[] sorted by importerCount
  - count: number of distinct external packages

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      language: z
        .enum(LANGUAGE_VALUES)
        .optional()
        .describe("Optional: only count imports from files of this language"),
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
    return okResponse(toolListExternalDependencies(currentGraph, language as Language | undefined));
  }
);

// ============================================================
// Tool: codegraph_get_external_users
// ============================================================

server.registerTool(
  "codegraph_get_external_users",
  {
    title: "Get Files Using an External Package",
    description: `Lists every file that imports a given external package. Matches by package root, so "lodash" also matches "lodash/fp" and "@scope/pkg" matches its subpaths.

Use this for impact/audit questions like "which files use this deprecated library?" or "what would a CVE in package X touch?".

Args:
  - name (string): the external package name (e.g. "express", "@scope/pkg", "numpy").

Returns:
  - name, users: FileRef[], count

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      name: z.string().describe("External package name (package root, e.g. \"express\")"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ name }) => {
    if (!currentGraph) return noGraphError();
    return okResponse(toolGetExternalUsers(currentGraph, name));
  }
);

// ============================================================
// Tool: codegraph_find_related_docs
// ============================================================

server.registerTool(
  "codegraph_find_related_docs",
  {
    title: "Find Documentation Affected by Code Changes",
    description: `Given a set of changed code files, finds ALL documentation files that need to be reviewed and potentially updated.

This tool is deterministic — it does not guess. It works by:
1. Computing the full blast radius of the changed files (direct + transitive dependents via the import graph)
2. Finding every documentation file (.md, .mdx, .rst, .txt) that references ANY code file in that blast radius
3. Returning an exhaustive list with the exact reason each doc matched

Documentation files are matched by scanning their content for references to code file paths, filenames, and directory paths. If a doc mentions a file that was changed or is affected by a change, it will be returned.

This is designed for enforcing documentation sync — the output is the complete set of docs that MUST be reviewed after a code change. No judgment calls, no optional updates.

Args:
  - files (string[]): Array of changed file paths (from a diff, git status, etc.)

Returns:
  - changedFiles: The input files
  - blastRadius: All code files affected (changed + transitive dependents)
  - relatedDocs: Every doc file that references any file in the blast radius, with:
    - matchedCodeFiles: Which code files this doc references
    - reason: Human-readable explanation of why this doc matched
  - totalDocsToReview: Count of docs that need review
  - totalDocsInProject: Total docs found (for coverage context)

Example use cases:
  - Post-commit hook: "What docs need updating after this commit?" → files from git diff
  - PR review: "Are all affected docs updated?" → files from PR diff
  - Pre-merge check: "What documentation was missed?" → compare relatedDocs against PR file list

Prerequisite: codegraph_scan must be called first.`,
    inputSchema: {
      files: z
        .array(z.string())
        .min(1)
        .max(50)
        .describe("Array of changed file paths to find related documentation for"),
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
    const result = toolFindRelatedDocs(currentGraph, files);
    if (isToolError(result)) return errResponse(result.error);
    return okResponse(result);
  }
);

// ============================================================
// Start Server
// ============================================================

async function run(): Promise<void> {
  // Release the file watcher on exit so it never outlives the process.
  const cleanup = () => {
    stopWatch();
  };
  process.on("exit", cleanup);
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      cleanup();
      process.exit(0);
    });
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[codegraph-mcp-server] Ready. Call codegraph_scan to begin.\n");
}

run().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[codegraph-mcp-server] Fatal error: ${msg}\n`);
  process.exit(1);
});
