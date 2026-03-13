import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import {
  DependencyGraph,
  DocNode,
  FileNode,
  Language,
  ParseError,
} from "./types.js";
import { parseJavaScriptDependencies, resolveJsImport, clearTsConfigCache } from "./parsers/javascript.js";
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

const SUPPORTED_EXTENSIONS_GLOB =
  "**/*.{ts,tsx,js,jsx,mjs,cjs,py,cpp,cc,cxx,c,h,hpp,ino}";

export const DEFAULT_IGNORE_PATTERNS = [
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

async function discoverFiles(rootDir: string, ignorePatterns?: string[]): Promise<string[]> {
  return glob(SUPPORTED_EXTENSIONS_GLOB, {
    cwd: rootDir,
    absolute: true,
    ignore: ignorePatterns ?? DEFAULT_IGNORE_PATTERNS,
    nodir: true,
  });
}

// ============================================================
// Graph Builder
// ============================================================

export interface BuildGraphOptions {
  /** Custom ignore patterns. If provided, replaces the defaults entirely. */
  ignorePatterns?: string[];
  /** Additional ignore patterns to append to the defaults. */
  additionalIgnorePatterns?: string[];
}

export async function buildDependencyGraph(
  rootDir: string,
  options?: BuildGraphOptions
): Promise<DependencyGraph> {
  const normalizedRoot = path.resolve(rootDir);
  const parseErrors: ParseError[] = [];

  // Clear tsconfig cache on each scan to pick up config changes
  clearTsConfigCache();

  // Merge ignore patterns
  let ignorePatterns: string[] | undefined;
  if (options?.ignorePatterns) {
    ignorePatterns = options.ignorePatterns;
  } else if (options?.additionalIgnorePatterns?.length) {
    ignorePatterns = [...DEFAULT_IGNORE_PATTERNS, ...options.additionalIgnorePatterns];
  }

  // Discover all files
  const files = await discoverFiles(normalizedRoot, ignorePatterns);

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
          rawDeps = parseJavaScriptDependencies(filePath, normalizedRoot);
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

  // Third pass: discover and scan documentation files for code references
  const docNodes = await buildDocNodes(normalizedRoot, nodes, ignorePatterns);

  return {
    rootDir: normalizedRoot,
    builtAt: Date.now(),
    nodes,
    totalFiles: nodes.size,
    parseErrors,
    docNodes,
  };
}

// ============================================================
// Documentation File Discovery & Reference Scanning
// ============================================================

const DOC_EXTENSIONS_GLOB = "**/*.{md,mdx,rst,txt}";

async function discoverDocFiles(rootDir: string, ignorePatterns?: string[]): Promise<string[]> {
  return glob(DOC_EXTENSIONS_GLOB, {
    cwd: rootDir,
    absolute: true,
    ignore: ignorePatterns ?? DEFAULT_IGNORE_PATTERNS,
    nodir: true,
  });
}

/**
 * Scan a documentation file's content and find references to code files in the graph.
 *
 * Matching strategy (deterministic, no AI):
 * 1. Relative paths:  "src/auth/login.ts" or "src/auth/login"
 * 2. Filenames:       "login.ts" (only if unique in the graph)
 * 3. Directory references: "src/auth/" matches all files under that dir
 *
 * We build a set of search terms from the graph and scan the doc content once.
 */
function scanDocForCodeReferences(
  docContent: string,
  codeNodes: Map<string, FileNode>,
  rootDir: string
): string[] {
  const matchedFiles = new Set<string>();

  // Normalize content for matching (case-sensitive for paths)
  const content = docContent;

  for (const [absPath, node] of codeNodes) {
    const relPath = node.relativePath;
    const relPathNoExt = relPath.replace(/\.[^.]+$/, "");
    const fileName = path.basename(absPath);
    const fileNameNoExt = path.basename(absPath).replace(/\.[^.]+$/, "");

    // Match relative path (with or without extension)
    if (content.includes(relPath) || content.includes(relPathNoExt)) {
      matchedFiles.add(absPath);
      continue;
    }

    // Match filename with extension (but only if reasonably specific —
    // skip very generic names like "index.ts" to avoid false positives)
    const genericNames = new Set([
      "index.ts", "index.js", "index.tsx", "index.jsx",
      "index.py", "main.py", "main.ts", "main.js",
      "__init__.py", "setup.py",
    ]);

    if (!genericNames.has(fileName)) {
      // Use word boundary-ish matching: filename must be preceded by
      // whitespace, punctuation, or start of line, and followed by
      // whitespace, punctuation, or end of line.
      // This prevents "login.ts" from matching inside "not-login.tsx"
      const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(?:^|[\\s\`'"(/])${escapedFileName}(?:$|[\\s\`'")/,;:])`, "m");
      if (pattern.test(content)) {
        matchedFiles.add(absPath);
        continue;
      }

      // Also try filename without extension with the same boundary matching
      // (useful for docs that reference "LoginService" not "LoginService.ts")
      if (fileNameNoExt.length > 3) {
        const escapedNoExt = fileNameNoExt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const patternNoExt = new RegExp(`(?:^|[\\s\`'"(/])${escapedNoExt}(?:$|[\\s\`'")/,;:.])`, "m");
        if (patternNoExt.test(content)) {
          matchedFiles.add(absPath);
          continue;
        }
      }
    }
  }

  return [...matchedFiles];
}

async function buildDocNodes(
  rootDir: string,
  codeNodes: Map<string, FileNode>,
  ignorePatterns?: string[]
): Promise<Map<string, DocNode>> {
  const docFiles = await discoverDocFiles(rootDir, ignorePatterns);
  const docNodes = new Map<string, DocNode>();

  for (const docPath of docFiles) {
    let content: string;
    try {
      content = fs.readFileSync(docPath, "utf-8");
    } catch {
      continue;
    }

    const referencedCodeFiles = scanDocForCodeReferences(content, codeNodes, rootDir);

    docNodes.set(docPath, {
      path: docPath,
      relativePath: path.relative(rootDir, docPath),
      referencedCodeFiles,
    });
  }

  return docNodes;
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
