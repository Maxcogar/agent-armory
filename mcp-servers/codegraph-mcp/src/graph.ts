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
/**
 * Escape a string for literal use inside a RegExp.
 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Test whether `term` appears in `content` as a bounded token — preceded by
 * start-of-line/whitespace/quote/paren and followed by end-of-line/whitespace/
 * quote/paren/punctuation. This prevents substring false positives such as
 * "app" matching inside "happens" or "api" inside "rapid".
 */
function containsAsToken(content: string, term: string): boolean {
  const pattern = new RegExp(
    `(?:^|[\\s\`'"(/])${escapeRegExp(term)}(?:$|[\\s\`'")/,;:.])`,
    "m"
  );
  return pattern.test(content);
}

function scanDocForCodeReferences(
  docContent: string,
  codeNodes: Map<string, FileNode>,
  rootDir: string
): string[] {
  const matchedFiles = new Set<string>();

  // Normalize content for matching (case-sensitive for paths)
  const content = docContent;

  // Collect directory prefixes referenced as "dir/" tokens (e.g. "src/auth/"),
  // so a doc that names a directory matches every file under it. Computed once.
  const referencedDirs = new Set<string>();
  const candidateDirs = new Set<string>();
  for (const node of codeNodes.values()) {
    const parts = node.relativePath.split("/");
    for (let i = 1; i < parts.length; i++) {
      candidateDirs.add(parts.slice(0, i).join("/"));
    }
  }
  for (const dir of candidateDirs) {
    // Require the trailing slash so "src/auth/" matches but a bare word does not.
    if (containsAsToken(content, dir + "/")) {
      referencedDirs.add(dir);
    }
  }

  for (const [absPath, node] of codeNodes) {
    const relPath = node.relativePath;
    const relPathNoExt = relPath.replace(/\.[^.]+$/, "");
    const fileName = path.basename(absPath);
    const fileNameNoExt = path.basename(absPath).replace(/\.[^.]+$/, "");

    // Match the full relative path as a bounded token (with extension), or — for
    // multi-segment paths only — without the extension. A single-segment stem
    // like "app" is NOT matched here (it would match prose words); it falls
    // through to the filename logic below, which has length/generic guards.
    if (
      containsAsToken(content, relPath) ||
      (relPathNoExt.includes("/") && containsAsToken(content, relPathNoExt))
    ) {
      matchedFiles.add(absPath);
      continue;
    }

    // Directory reference: the file lives under a directory the doc named.
    let underReferencedDir = false;
    for (const dir of referencedDirs) {
      if (relPath === dir || relPath.startsWith(dir + "/")) {
        underReferencedDir = true;
        break;
      }
    }
    if (underReferencedDir) {
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
      // Bounded filename match: "login.ts" must not match inside "not-login.tsx".
      if (containsAsToken(content, fileName)) {
        matchedFiles.add(absPath);
        continue;
      }

      // Also try filename without extension with the same boundary matching
      // (useful for docs that reference "LoginService" not "LoginService.ts").
      if (fileNameNoExt.length > 3 && containsAsToken(content, fileNameNoExt)) {
        matchedFiles.add(absPath);
        continue;
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

/**
 * Find orphan (dead) files: zero dependents AND zero dependencies. These are
 * isolated nodes — nothing imports them and they import nothing in-project.
 *
 * This is a distinct concept from an entry point. An entry point has
 * dependencies but no dependents (a root that pulls others in); an orphan has
 * neither. `findEntryPoints` deliberately excludes orphans, so without this
 * function isolated files are invisible to every tool.
 */
export function findOrphans(graph: DependencyGraph): string[] {
  const orphans: string[] = [];
  for (const [filePath, node] of graph.nodes) {
    if (node.dependents.length === 0 && node.dependencies.length === 0) {
      orphans.push(filePath);
    }
  }
  return orphans;
}

/**
 * Shortest dependency path from `from` to `to`, following the `dependencies`
 * (import) direction. Returns the chain of absolute paths inclusive of both
 * endpoints, or null if `to` is not reachable from `from`.
 *
 * BFS gives the fewest-hops path and is deterministic given a stable neighbour
 * order. Used to answer "why does A depend on B?".
 */
export function findDependencyPath(
  graph: DependencyGraph,
  from: string,
  to: string
): string[] | null {
  if (from === to) return [from];

  const prev = new Map<string, string>();
  const visited = new Set<string>([from]);
  const queue: string[] = [from];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = graph.nodes.get(current);
    if (!node) continue;

    for (const dep of node.dependencies) {
      if (visited.has(dep)) continue;
      visited.add(dep);
      prev.set(dep, current);
      if (dep === to) {
        // Reconstruct the path back to `from`.
        const path: string[] = [to];
        let step = to;
        while (step !== from) {
          step = prev.get(step)!;
          path.push(step);
        }
        return path.reverse();
      }
      queue.push(dep);
    }
  }

  return null;
}

// ============================================================
// Strongly Connected Components (Tarjan) — cycle detection
// ============================================================

/**
 * Tarjan's algorithm: partition the graph into strongly connected components
 * over the `dependencies` edges. Returns each SCC as a list of absolute paths.
 * Iterative (explicit stack) to avoid blowing the call stack on large graphs.
 */
export function stronglyConnectedComponents(graph: DependencyGraph): string[][] {
  let index = 0;
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  // Iterative DFS frame: a node plus the position of the next neighbour to visit.
  interface Frame {
    node: string;
    deps: string[];
    i: number;
  }

  for (const start of graph.nodes.keys()) {
    if (indices.has(start)) continue;

    const callStack: Frame[] = [
      { node: start, deps: graph.nodes.get(start)!.dependencies, i: 0 },
    ];
    indices.set(start, index);
    lowlink.set(start, index);
    index++;
    stack.push(start);
    onStack.add(start);

    while (callStack.length > 0) {
      const frame = callStack[callStack.length - 1];
      const { node, deps } = frame;

      if (frame.i < deps.length) {
        const dep = deps[frame.i];
        frame.i++;
        if (!graph.nodes.has(dep)) continue; // edge to a non-node; skip
        if (!indices.has(dep)) {
          indices.set(dep, index);
          lowlink.set(dep, index);
          index++;
          stack.push(dep);
          onStack.add(dep);
          callStack.push({
            node: dep,
            deps: graph.nodes.get(dep)!.dependencies,
            i: 0,
          });
        } else if (onStack.has(dep)) {
          lowlink.set(node, Math.min(lowlink.get(node)!, indices.get(dep)!));
        }
      } else {
        // Done with this node's neighbours; settle its lowlink into its parent.
        if (lowlink.get(node) === indices.get(node)) {
          const component: string[] = [];
          let w: string;
          do {
            w = stack.pop()!;
            onStack.delete(w);
            component.push(w);
          } while (w !== node);
          sccs.push(component);
        }
        callStack.pop();
        const parent = callStack[callStack.length - 1];
        if (parent) {
          lowlink.set(
            parent.node,
            Math.min(lowlink.get(parent.node)!, lowlink.get(node)!)
          );
        }
      }
    }
  }

  return sccs;
}

/**
 * Detect dependency cycles. A cycle is any SCC of size > 1, plus any single
 * node with a self-edge (a file importing itself, which Tarjan reports as a
 * singleton SCC). Each cycle is returned as an ordered ring of absolute paths,
 * normalized to start at the lexicographically smallest member so the same
 * cycle isn't reported in N rotations.
 */
export function findCycles(graph: DependencyGraph): string[][] {
  const cycles: string[][] = [];

  for (const scc of stronglyConnectedComponents(graph)) {
    if (scc.length > 1) {
      cycles.push(orderCycle(graph, scc));
    } else {
      // Singleton SCC is a cycle only if it has a self-edge.
      const only = scc[0];
      if (graph.nodes.get(only)?.dependencies.includes(only)) {
        cycles.push([only]);
      }
    }
  }

  // Deterministic order: by smallest member.
  cycles.sort((a, b) => a[0].localeCompare(b[0]));
  return cycles;
}

/**
 * Order an SCC's members into a readable ring by walking dependency edges that
 * stay inside the component, starting from its lexicographically smallest node.
 */
function orderCycle(graph: DependencyGraph, scc: string[]): string[] {
  const members = new Set(scc);
  const start = [...scc].sort((a, b) => a.localeCompare(b))[0];

  const ring: string[] = [start];
  const visited = new Set<string>([start]);
  let current = start;

  while (ring.length < scc.length) {
    const node = graph.nodes.get(current);
    const next = node?.dependencies.find(
      (d) => members.has(d) && !visited.has(d)
    );
    if (!next) break; // defensive: shouldn't happen in a true SCC
    ring.push(next);
    visited.add(next);
    current = next;
  }

  return ring;
}

// ============================================================
// Topological layering (over the SCC condensation)
// ============================================================

export interface GraphLayers {
  layers: string[][];
  depth: number;
  cyclic: boolean;
  cyclicNodes: string[];
}

/**
 * Partition files into dependency layers. Layer 0 holds files that import
 * nothing in-project; each subsequent layer holds files whose dependencies all
 * live in earlier layers.
 *
 * Cycles break a plain topological sort, so we first condense each SCC into a
 * super-node (the condensation is always a DAG), layer that via Kahn's
 * algorithm, then expand super-nodes back to their members. Files participating
 * in a cycle are reported in `cyclicNodes`.
 */
export function computeLayers(graph: DependencyGraph): GraphLayers {
  const sccs = stronglyConnectedComponents(graph);

  // Map each node to its component id.
  const compOf = new Map<string, number>();
  sccs.forEach((scc, id) => scc.forEach((n) => compOf.set(n, id)));

  // Build the condensation DAG: edges between distinct components, and track
  // in-degree for Kahn. A component is cyclic if it has >1 member or a self-edge.
  const compDeps = new Map<number, Set<number>>();
  const indegree = new Map<number, number>();
  const cyclicComp = new Set<number>();
  for (let id = 0; id < sccs.length; id++) {
    compDeps.set(id, new Set());
    indegree.set(id, 0);
    if (sccs[id].length > 1) cyclicComp.add(id);
  }
  for (const [node, nodeData] of graph.nodes) {
    const from = compOf.get(node)!;
    for (const dep of nodeData.dependencies) {
      if (!compOf.has(dep)) continue;
      const to = compOf.get(dep)!;
      if (from === to) {
        if (node === dep) cyclicComp.add(from); // self-edge
        continue;
      }
      // Edge node -> dep means `from` depends on `to`; `to` must layer first.
      if (!compDeps.get(to)!.has(from)) {
        compDeps.get(to)!.add(from);
        indegree.set(from, indegree.get(from)! + 1);
      }
    }
  }

  // Kahn layering on the condensation.
  let frontier = [...indegree.keys()].filter((id) => indegree.get(id) === 0);
  const compLayer = new Map<number, number>();
  let layerIdx = 0;
  let processed = 0;
  while (frontier.length > 0) {
    const next: number[] = [];
    for (const id of frontier) {
      compLayer.set(id, layerIdx);
      processed++;
      for (const dependent of compDeps.get(id)!) {
        indegree.set(dependent, indegree.get(dependent)! - 1);
        if (indegree.get(dependent) === 0) next.push(dependent);
      }
    }
    frontier = next;
    layerIdx++;
  }

  // Expand components into node layers.
  const layers: string[][] = Array.from({ length: layerIdx }, () => []);
  for (let id = 0; id < sccs.length; id++) {
    const li = compLayer.get(id);
    if (li === undefined) continue; // unreached (only if condensation had a cycle — impossible)
    for (const node of sccs[id]) layers[li].push(node);
  }
  for (const layer of layers) layer.sort((a, b) => a.localeCompare(b));

  const cyclicNodes: string[] = [];
  for (const [node] of graph.nodes) {
    if (cyclicComp.has(compOf.get(node)!)) cyclicNodes.push(node);
  }
  cyclicNodes.sort((a, b) => a.localeCompare(b));

  return {
    layers,
    depth: layers.length,
    cyclic: cyclicComp.size > 0,
    cyclicNodes,
  };
}
