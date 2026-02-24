import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import {
  DependencyGraph,
  FileNode,
  Language,
  ParseError,
} from "./types.js";
import { parseJavaScriptDependencies, resolveJsImport } from "./parsers/javascript.js";
import { parsePythonDependencies } from "./parsers/python.js";
import { parseCppDependencies, collectCppSearchDirs } from "./parsers/cpp.js";

// ============================================================
// Language Detection
// ============================================================

export function detectLanguage(filePath: string): Language {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();

  if ([".ts", ".tsx"].includes(ext)) return "typescript";
  if ([".js", ".jsx", ".mjs", ".cjs"].includes(ext)) return "javascript";
  if (ext === ".py") return "python";
  if ([".ino"].includes(ext)) return "arduino";
  if ([".cpp", ".cc", ".cxx", ".c"].includes(ext)) return "cpp";
  if ([".h", ".hpp", ".hh"].includes(ext)) {
    // Arduino header heuristic: check if same-named .ino exists
    return "cpp";
  }

  return "unknown";
}

// ============================================================
// File Discovery
// ============================================================

const SUPPORTED_EXTENSIONS = [
  "**/*.ts", "**/*.tsx",
  "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs",
  "**/*.py",
  "**/*.cpp", "**/*.cc", "**/*.cxx", "**/*.c",
  "**/*.h", "**/*.hpp",
  "**/*.ino",
];

const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/__pycache__/**",
  "**/.venv/**",
  "**/venv/**",
  "**/.pio/**",
  "**/coverage/**",
  "**/*.min.js",
  "**/*.bundle.js",
];

async function discoverFiles(rootDir: string): Promise<string[]> {
  const allFiles: string[] = [];
  for (const pattern of SUPPORTED_EXTENSIONS) {
    const matches = await glob(pattern, {
      cwd: rootDir,
      absolute: true,
      ignore: IGNORE_PATTERNS,
      nodir: true,
    });
    allFiles.push(...matches);
  }
  // Deduplicate
  return [...new Set(allFiles)];
}

// ============================================================
// Graph Builder
// ============================================================

export async function buildDependencyGraph(rootDir: string): Promise<DependencyGraph> {
  const normalizedRoot = path.resolve(rootDir);
  const parseErrors: ParseError[] = [];

  // Discover all files
  const files = await discoverFiles(normalizedRoot);

  // Collect C++ search directories once
  const cppSearchDirs = collectCppSearchDirs(normalizedRoot);

  // First pass: create all nodes
  const nodes = new Map<string, FileNode>();
  for (const filePath of files) {
    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }

    const lang = detectLanguage(filePath);
    nodes.set(filePath, {
      path: filePath,
      relativePath: path.relative(normalizedRoot, filePath),
      language: lang,
      dependencies: [],
      dependents: [],
      sizeBytes: stat.size,
      lastModified: stat.mtimeMs,
    });
  }

  // Second pass: parse dependencies for each file
  for (const [filePath, node] of nodes) {
    try {
      let rawDeps: string[] = [];

      switch (node.language) {
        case "typescript":
        case "javascript":
          rawDeps = parseJavaScriptDependencies(filePath);
          break;
        case "python":
          rawDeps = parsePythonDependencies(filePath, normalizedRoot);
          break;
        case "cpp":
        case "arduino":
          rawDeps = parseCppDependencies(filePath, cppSearchDirs);
          break;
        default:
          break;
      }

      // Only keep deps that are in the graph (i.e., part of the project)
      const validDeps = rawDeps.filter((dep) => nodes.has(dep));
      node.dependencies = validDeps;

      // Register reverse edges (dependents)
      for (const dep of validDeps) {
        const depNode = nodes.get(dep);
        if (depNode && !depNode.dependents.includes(filePath)) {
          depNode.dependents.push(filePath);
        }
      }
    } catch (err: unknown) {
      parseErrors.push({
        file: filePath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    rootDir: normalizedRoot,
    builtAt: Date.now(),
    nodes,
    totalFiles: nodes.size,
    parseErrors,
  };
}

// ============================================================
// Graph Query Utilities
// ============================================================

/**
 * Get all files transitively affected by changing the given files.
 * Uses BFS traversal up the dependent chain.
 */
export function getTransitiveDependents(
  graph: DependencyGraph,
  filePathSet: Set<string>
): Set<string> {
  const visited = new Set<string>();
  const queue = [...filePathSet];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = graph.nodes.get(current);
    if (node) {
      for (const dep of node.dependents) {
        if (!visited.has(dep)) {
          queue.push(dep);
        }
      }
    }
  }

  // Remove the seed files from the result
  for (const seed of filePathSet) {
    visited.delete(seed);
  }

  return visited;
}

/**
 * Get all transitive dependencies of a file (what it needs to run).
 */
export function getTransitiveDependencies(
  graph: DependencyGraph,
  filePath: string
): Set<string> {
  const visited = new Set<string>();
  const queue = [filePath];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = graph.nodes.get(current);
    if (node) {
      for (const dep of node.dependencies) {
        if (!visited.has(dep)) {
          queue.push(dep);
        }
      }
    }
  }

  visited.delete(filePath);
  return visited;
}

/**
 * Find a file path in the graph by partial match (relative path or filename).
 * Returns all matches.
 */
export function findFileInGraph(graph: DependencyGraph, query: string): string[] {
  const normalizedQuery = query.replace(/\\/g, "/").toLowerCase();
  const results: string[] = [];

  for (const [absPath, node] of graph.nodes) {
    const normalizedRel = node.relativePath.replace(/\\/g, "/").toLowerCase();
    const normalizedAbs = absPath.replace(/\\/g, "/").toLowerCase();

    if (
      normalizedRel === normalizedQuery ||
      normalizedRel.endsWith("/" + normalizedQuery) ||
      normalizedAbs === normalizedQuery ||
      path.basename(normalizedAbs) === normalizedQuery
    ) {
      results.push(absPath);
    }
  }

  return results;
}

/**
 * Find entry points: files with no dependents (nothing imports them).
 */
export function findEntryPoints(graph: DependencyGraph): string[] {
  const entries: string[] = [];
  for (const [filePath, node] of graph.nodes) {
    if (node.dependents.length === 0 && node.dependencies.length > 0) {
      entries.push(filePath);
    }
  }
  return entries;
}
