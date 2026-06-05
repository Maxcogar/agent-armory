import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import {
  DependencyGraph,
  DocNode,
  FileNode,
  Language,
  ParseError,
  SubGraphNode,
  SubGraphEdge,
} from "./types.js";
import { parseJavaScriptDependencies, resolveJsImport, clearTsConfigCache } from "./parsers/javascript.js";
import { parsePythonDependencies } from "./parsers/python.js";
import { parseCppDependencies, collectCppSearchDirs } from "./parsers/cpp.js";
import { parsePackageJsonDependencies } from "./parsers/packagejson.js";
import { parseRequirementsTxtDependencies } from "./parsers/requirementstxt.js";
import { parseGoModDependencies } from "./parsers/gomod.js";
import { parseGoDependencies, clearGoModuleCache } from "./parsers/golang.js";
import { parseRustDependencies } from "./parsers/rust.js";
import { parseRubyDependencies } from "./parsers/ruby.js";
import { analyzeFile } from "./treesitter/analyze.js";
import { computeNamespacedConnections, NS_LANGS } from "./treesitter/namespaced.js";

// ============================================================
// Language Detection
// ============================================================

/** Package-manager manifest kinds whose local edges we resolve. */
export type ManifestKind = "npm" | "pip" | "go";

/**
 * Classify a file as a dependency manifest by its (base) filename, or null if
 * it is not a manifest. Dispatch is by exact name, not extension: package.json
 * and go.mod are exact, while pip requirements files vary in name (e.g.
 * requirements.txt, requirements-dev.txt, dev-requirements.txt).
 */
export function manifestKind(filePath: string): ManifestKind | null {
  const base = path.basename(filePath).toLowerCase();
  if (base === "package.json") return "npm";
  if (base === "go.mod") return "go";
  if (base.endsWith(".txt") && base.includes("requirements")) return "pip";
  return null;
}

export function detectLanguage(filePath: string): Language {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath).toLowerCase();

  if (manifestKind(filePath) !== null) return "config";
  if ([".ts", ".tsx"].includes(ext)) return "typescript";
  if ([".js", ".jsx", ".mjs", ".cjs"].includes(ext)) return "javascript";
  if (ext === ".py") return "python";
  if (ext === ".go") return "go";
  if (ext === ".rs") return "rust";
  if (ext === ".java") return "java";
  if (ext === ".rb") return "ruby";
  if (ext === ".cs") return "csharp";
  if ([".php", ".phtml"].includes(ext)) return "php";
  if ([".ino"].includes(ext)) return "arduino";
  if ([".cpp", ".cc", ".cxx", ".c"].includes(ext)) return "cpp";
  if ([".h", ".hpp", ".hh"].includes(ext)) {
    // Arduino header heuristic: check if same-named .ino exists
    return "cpp";
  }

  return "unknown";
}

/**
 * Classify a file as a test by conventional path/name patterns:
 * a `test/`, `tests/`, or `__tests__/` directory, a `*.test.*` / `*.spec.*`
 * file, or Python `test_*.py` / `*_test.py`. Used so dead-code/orphan/impact
 * queries can optionally treat test-only references as non-production.
 */
export function isTestFile(relativePath: string): boolean {
  const p = relativePath.replace(/\\/g, "/");
  return (
    /(^|\/)(__tests__|tests?)\//.test(p) ||
    /\.(test|spec)\.[cm]?[jt]sx?$/.test(p) ||
    /(^|\/)test_[^/]+\.py$/.test(p) ||
    /_test\.py$/.test(p)
  );
}

// ============================================================
// File Discovery
// ============================================================

const SUPPORTED_EXTENSIONS_GLOB =
  "**/*.{ts,tsx,js,jsx,mjs,cjs,py,cpp,cc,cxx,c,h,hpp,ino,go,rs,java,rb,cs,php,phtml}";

// Dependency manifests, matched by name rather than extension. The default
// ignore patterns (node_modules, dist, .venv, ...) keep this from sweeping up
// vendored manifests.
const MANIFEST_GLOB = "**/{package.json,go.mod,*requirements*.txt}";

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
  const ignore = ignorePatterns ?? DEFAULT_IGNORE_PATTERNS;
  const [code, manifests] = await Promise.all([
    glob(SUPPORTED_EXTENSIONS_GLOB, { cwd: rootDir, absolute: true, ignore, nodir: true }),
    glob(MANIFEST_GLOB, { cwd: rootDir, absolute: true, ignore, nodir: true }),
  ]);
  // Dedupe in case a pattern overlap ever surfaces the same path twice.
  return [...new Set([...code, ...manifests])];
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

/**
 * Build a name -> package.json map over all in-tree npm manifests, so a
 * dependency referenced by name (the common monorepo/workspace case) can be
 * resolved to a local edge. First declaration wins on a name collision.
 */
function buildLocalPackageMap(nodes: Map<string, FileNode>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [filePath, node] of nodes) {
    if (node.language !== "config" || manifestKind(filePath) !== "npm") continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (pkg && typeof pkg.name === "string" && pkg.name && !map.has(pkg.name)) {
        map.set(pkg.name, filePath);
      }
    } catch {
      // Unparseable manifest: skip; the parse error is surfaced in the second pass.
    }
  }
  return map;
}

/** Dispatch a manifest file to the parser for its package manager. */
function parseManifestDependencies(
  filePath: string,
  localPackages: Map<string, string>
): string[] {
  switch (manifestKind(filePath)) {
    case "npm":
      return parsePackageJsonDependencies(filePath, localPackages);
    case "pip":
      return parseRequirementsTxtDependencies(filePath);
    case "go":
      return parseGoModDependencies(filePath);
    default:
      return [];
  }
}

/** Everything a single-file parse needs that is derived once per scan. */
interface ParseContext {
  rootDir: string;
  cppSearchDirs: string[];
  localPackages: Map<string, string>;
}

/**
 * Parse one file's raw (unfiltered) dependency targets by language. The single
 * dispatch point shared by the full build and incremental updates, so both
 * resolve imports identically.
 */
function parseNodeDependencies(
  filePath: string,
  language: Language,
  ctx: ParseContext
): string[] {
  switch (language) {
    case "typescript":
    case "javascript":
      return parseJavaScriptDependencies(filePath, ctx.rootDir);
    case "python":
      return parsePythonDependencies(filePath, ctx.rootDir);
    case "cpp":
    case "arduino":
      return parseCppDependencies(filePath, ctx.cppSearchDirs);
    case "go":
      return parseGoDependencies(filePath, ctx.rootDir);
    case "rust":
      return parseRustDependencies(filePath);
    case "ruby":
      return parseRubyDependencies(filePath);
    case "config":
      return parseManifestDependencies(filePath, ctx.localPackages);
    default:
      return [];
  }
}

/**
 * Recompute every node's `dependents` from the forward `dependencies` edges.
 * Deriving reverse edges in a single pass (rather than patching them) keeps
 * them consistent after incremental updates — there is no way to leave a stale
 * dependent behind.
 */
function computeDependents(nodes: Map<string, FileNode>): void {
  for (const node of nodes.values()) node.dependents = [];
  for (const [filePath, node] of nodes) {
    for (const dep of node.dependencies) {
      const depNode = nodes.get(dep);
      if (depNode && !depNode.dependents.includes(filePath)) {
        depNode.dependents.push(filePath);
      }
    }
  }
}

/** Resolve the effective ignore globs from build options (shared by full + incremental). */
function resolveIgnorePatterns(options?: BuildGraphOptions): string[] | undefined {
  if (options?.ignorePatterns) return options.ignorePatterns;
  if (options?.additionalIgnorePatterns?.length) {
    return [...DEFAULT_IGNORE_PATTERNS, ...options.additionalIgnorePatterns];
  }
  return undefined;
}

/**
 * Add file-level dependency edges for the FQN languages (Java/C#/PHP/Rust),
 * derived from their precise symbol resolution: if a symbol in file F references
 * a symbol in file G, then F depends on G. These languages resolve cross-file
 * references by namespace/module rather than by a path-mapped import, so their
 * file edges can't be produced per-file — they fall out of the symbol graph.
 */
function addFqnFileEdges(rootDir: string, nodes: Map<string, FileNode>): void {
  if (![...nodes.values()].some((n) => NS_LANGS.has(n.language))) return;
  const sg = computeNamespacedConnections({ rootDir, nodes } as DependencyGraph);
  const fileOf = (key: string): string => key.slice(0, key.lastIndexOf("#"));
  for (const [userKey, used] of sg.uses) {
    const uf = fileOf(userKey);
    const un = nodes.get(uf);
    if (!un || !NS_LANGS.has(un.language)) continue;
    const deps = new Set(un.dependencies);
    for (const usedKey of used) {
      const gf = fileOf(usedKey);
      if (gf !== uf && nodes.has(gf)) deps.add(gf);
    }
    un.dependencies = [...deps];
  }
}

export async function buildDependencyGraph(
  rootDir: string,
  options?: BuildGraphOptions
): Promise<DependencyGraph> {
  const normalizedRoot = path.resolve(rootDir);
  const parseErrors: ParseError[] = [];

  // Clear tsconfig cache on each scan to pick up config changes
  clearTsConfigCache();
  clearGoModuleCache();

  const ignorePatterns = resolveIgnorePatterns(options);

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
    const relativePath = path.relative(normalizedRoot, filePath);
    nodes.set(filePath, {
      path: filePath,
      relativePath,
      language: lang,
      dependencies: [],
      dependents: [],
      sizeBytes: stat.size,
      lastModified: stat.mtimeMs,
      isTest: isTestFile(relativePath),
    });
  }

  // Map in-tree npm package names to their package.json, so workspace deps
  // referenced by name (workspace:* or plain semver) resolve to a local edge.
  const localPackages = buildLocalPackageMap(nodes);

  // Second pass: parse dependencies for each file
  const ctx: ParseContext = { rootDir: normalizedRoot, cppSearchDirs, localPackages };
  for (const [filePath, node] of nodes) {
    try {
      const rawDeps = parseNodeDependencies(filePath, node.language, ctx);
      // Only keep deps that are in the graph (i.e., part of the project).
      node.dependencies = rawDeps.filter((dep) => nodes.has(dep));
      // Additively attach rich import edges + declared symbols (one parse).
      // `dependencies` stays the source of truth; parity is asserted in tests.
      const analysis = analyzeFile(filePath, node.language, ctx);
      if (analysis.imports) node.imports = analysis.imports;
      if (analysis.symbols) node.symbols = analysis.symbols;
      if (analysis.endpoints && analysis.endpoints.length > 0) node.endpoints = analysis.endpoints;
      if (analysis.channels && analysis.channels.length > 0) node.channels = analysis.channels;
    } catch (err: unknown) {
      parseErrors.push({
        file: filePath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Reverse edges (dependents) are derived from the forward edges in one pass.
  computeDependents(nodes);
  addFqnFileEdges(normalizedRoot, nodes);
  computeDependents(nodes);

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

export interface IncrementalDelta {
  added: number;
  changed: number;
  removed: number;
  reused: number;
}

/**
 * Rebuild the graph reusing the previous one, re-parsing only files whose mtime
 * or size changed (make-style, no hashing). Unchanged files keep their cached
 * dependency edges; reverse edges and docs are recomputed wholesale so the
 * result is structurally identical to a full build — with one documented
 * exception (below).
 *
 * Known limitation: a file that is itself unchanged but contains an import that
 * only becomes resolvable because its target was just *added* will not gain that
 * edge until the importer is touched or a full rescan (`force`) is run — the
 * importer's mtime did not change, so it is not re-parsed. Likewise, edits to a
 * non-node config (e.g. tsconfig.json path aliases) are not detected. Both are
 * inherent to mtime-based incremental builds; `force` is the escape hatch.
 */
export async function incrementalUpdate(
  previous: DependencyGraph,
  options?: BuildGraphOptions
): Promise<{ graph: DependencyGraph; delta: IncrementalDelta }> {
  const rootDir = previous.rootDir;
  clearTsConfigCache();
  clearGoModuleCache();

  const ignorePatterns = resolveIgnorePatterns(options);
  const files = await discoverFiles(rootDir, ignorePatterns);
  const parseErrors: ParseError[] = [];

  const nodes = new Map<string, FileNode>();
  const toParse: string[] = [];
  let added = 0;
  let changed = 0;
  let reused = 0;

  for (const filePath of files) {
    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }
    const prev = previous.nodes.get(filePath);
    if (prev && prev.lastModified === stat.mtimeMs && prev.sizeBytes === stat.size) {
      // Unchanged: reuse the cached node (and its forward edges). Dependents are
      // cleared because they are recomputed globally below.
      nodes.set(filePath, { ...prev, dependents: [] });
      reused++;
    } else {
      const relativePath = path.relative(rootDir, filePath);
      nodes.set(filePath, {
        path: filePath,
        relativePath,
        language: detectLanguage(filePath),
        dependencies: [],
        dependents: [],
        sizeBytes: stat.size,
        lastModified: stat.mtimeMs,
        isTest: isTestFile(relativePath),
      });
      if (prev) changed++;
      else added++;
      toParse.push(filePath);
    }
  }
  const removed = previous.totalFiles - reused - changed;

  // Re-parse only the changed/added files.
  const ctx: ParseContext = {
    rootDir,
    cppSearchDirs: collectCppSearchDirs(rootDir),
    localPackages: buildLocalPackageMap(nodes),
  };
  const reparsed = new Set(toParse);
  for (const filePath of toParse) {
    const node = nodes.get(filePath)!;
    try {
      const rawDeps = parseNodeDependencies(filePath, node.language, ctx);
      node.dependencies = rawDeps.filter((dep) => nodes.has(dep));
      const analysis = analyzeFile(filePath, node.language, ctx);
      if (analysis.imports) node.imports = analysis.imports;
      if (analysis.symbols) node.symbols = analysis.symbols;
      if (analysis.endpoints && analysis.endpoints.length > 0) node.endpoints = analysis.endpoints;
      if (analysis.channels && analysis.channels.length > 0) node.channels = analysis.channels;
    } catch (err: unknown) {
      parseErrors.push({
        file: filePath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Reused nodes kept edges that may point at now-deleted files; prune to the
  // current node set so nothing dangles.
  for (const node of nodes.values()) {
    if (!reparsed.has(node.path)) {
      node.dependencies = node.dependencies.filter((dep) => nodes.has(dep));
    }
  }

  // Carry forward parse errors for files we did not re-parse but still exist.
  for (const pe of previous.parseErrors) {
    if (!reparsed.has(pe.file) && nodes.has(pe.file)) parseErrors.push(pe);
  }

  computeDependents(nodes);
  addFqnFileEdges(rootDir, nodes);
  computeDependents(nodes);
  const docNodes = await buildDocNodes(rootDir, nodes, ignorePatterns);

  return {
    graph: {
      rootDir,
      builtAt: Date.now(),
      nodes,
      totalFiles: nodes.size,
      parseErrors,
      docNodes,
    },
    delta: { added, changed, removed, reused },
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
    // A file already indexed as code (e.g. a requirements.txt manifest, which
    // the `.txt` doc glob also matches) is not documentation — skip it so it is
    // never both a code node and a doc node.
    if (codeNodes.has(docPath)) continue;

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
  filePathSet: Set<string>,
  opts?: { excludeTypeOnly?: boolean }
): Set<string> {
  const excludeType = opts?.excludeTypeOnly === true;
  const visited = new Set<string>();
  const queue = [...filePathSet];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = graph.nodes.get(current);
    if (node) {
      for (const dep of node.dependents) {
        if (visited.has(dep)) continue;
        // When excluding type-only coupling, skip an importer that only imports
        // `current` in type position (no runtime dependency).
        if (excludeType) {
          const importer = graph.nodes.get(dep);
          if (importer && isTypeOnlyEdge(importer, current)) continue;
        }
        queue.push(dep);
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
 * True when `importer` imports `target` only in type position — every import
 * edge it has to `target` is `kind: "type"`. Such an edge is erased at compile
 * time and is not runtime coupling. Returns false when import-kind data is
 * absent (treated as a real dependency, the safe default).
 */
export function isTypeOnlyEdge(importer: FileNode, target: string): boolean {
  if (!importer.imports) return false;
  let sawEdge = false;
  let sawRuntime = false;
  for (const edge of importer.imports) {
    if (edge.to !== target) continue;
    sawEdge = true;
    if (edge.kind !== "type") sawRuntime = true;
  }
  return sawEdge && !sawRuntime;
}

/**
 * The set of files treated as program entry points for reachability: graph
 * roots (nothing imports them), Arduino sketches (`.ino`), and `__main__.py`.
 * Test files are entries only when `includeTests` is set.
 */
export function computeEntrySet(graph: DependencyGraph, includeTests: boolean): Set<string> {
  const entries = new Set<string>();
  for (const [filePath, node] of graph.nodes) {
    if (node.isTest && !includeTests) continue;
    if (
      node.dependents.length === 0 ||
      node.language === "arduino" ||
      path.basename(filePath) === "__main__.py"
    ) {
      entries.add(filePath);
    }
  }
  return entries;
}

const CODE_LANGUAGES: ReadonlySet<Language> = new Set<Language>([
  "typescript", "javascript", "python", "cpp", "arduino",
  "go", "rust", "java", "ruby", "csharp", "php",
]);

/**
 * Code files not reachable from any entry point by following imports forward.
 * This catches dead clusters that degree-zero orphan detection misses (e.g. a
 * group of files that import each other but that nothing outside imports).
 * Only code files are reported; tests are excluded unless `includeTests`.
 */
export function findUnreachable(
  graph: DependencyGraph,
  entryPaths: string[] | null,
  includeTests: boolean
): { unreachable: string[]; entryPoints: string[] } {
  const entries =
    entryPaths && entryPaths.length > 0
      ? new Set(entryPaths)
      : computeEntrySet(graph, includeTests);

  const live = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (live.has(current)) continue;
    live.add(current);
    const node = graph.nodes.get(current);
    if (node) for (const dep of node.dependencies) if (!live.has(dep)) queue.push(dep);
  }

  const unreachable: string[] = [];
  for (const [filePath, node] of graph.nodes) {
    if (!CODE_LANGUAGES.has(node.language)) continue;
    if (node.isTest && !includeTests) continue;
    if (!live.has(filePath)) unreachable.push(filePath);
  }
  unreachable.sort((a, b) =>
    graph.nodes.get(a)!.relativePath.localeCompare(graph.nodes.get(b)!.relativePath)
  );
  return { unreachable, entryPoints: [...entries] };
}

/**
 * Weakly-connected components (treating imports as undirected): islands of
 * related files. Distinct from layers (topological tiers), cycles (SCCs), and
 * subgraph (one neighbourhood). Only components with >= minSize are returned;
 * test files are excluded unless `includeTests`.
 */
export function findClusters(
  graph: DependencyGraph,
  minSize: number,
  includeTests: boolean
): string[][] {
  const included = (p: string): boolean => {
    const n = graph.nodes.get(p);
    return !!n && (includeTests || !n.isTest);
  };

  const visited = new Set<string>();
  const clusters: string[][] = [];
  for (const start of graph.nodes.keys()) {
    if (visited.has(start) || !included(start)) continue;
    const component: string[] = [];
    const queue = [start];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current) || !included(current)) continue;
      visited.add(current);
      component.push(current);
      const node = graph.nodes.get(current);
      if (!node) continue;
      for (const neighbour of [...node.dependencies, ...node.dependents]) {
        if (!visited.has(neighbour) && included(neighbour)) queue.push(neighbour);
      }
    }
    if (component.length >= minSize) {
      component.sort((a, b) =>
        graph.nodes.get(a)!.relativePath.localeCompare(graph.nodes.get(b)!.relativePath)
      );
      clusters.push(component);
    }
  }
  clusters.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
  return clusters;
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

// ============================================================
// Subgraph collection (shared by subgraph query + visual exporters)
// ============================================================

export interface CollectedSubgraph {
  nodes: Map<string, SubGraphNode>;
  edges: SubGraphEdge[];
}

/**
 * Collect the neighbourhood of `center` up to `depth` hops, traversing both
 * the dependency and dependent directions via BFS. Returns the nodes (keyed by
 * absolute path, each tagged with its distance and direction from center) and
 * the edges that fall entirely within the collected node set.
 *
 * Single source of truth for neighbourhood scoping — used by the subgraph query
 * tool and by the Mermaid/DOT exporters so they cannot drift apart. `center`
 * must be an absolute path already present in the graph.
 */
export function collectSubgraph(
  graph: DependencyGraph,
  center: string,
  depth: number
): CollectedSubgraph {
  const centerNode = graph.nodes.get(center)!;
  const nodes = new Map<string, SubGraphNode>();
  const edges: SubGraphEdge[] = [];

  nodes.set(center, {
    path: center,
    relativePath: centerNode.relativePath,
    language: centerNode.language,
    distanceFromCenter: 0,
    direction: "center",
  });

  const queue: Array<{
    filePath: string;
    dist: number;
    dir: "dependency" | "dependent";
  }> = [];
  for (const dep of centerNode.dependencies) {
    queue.push({ filePath: dep, dist: 1, dir: "dependency" });
  }
  for (const dep of centerNode.dependents) {
    queue.push({ filePath: dep, dist: 1, dir: "dependent" });
  }

  while (queue.length > 0) {
    const { filePath, dist, dir } = queue.shift()!;
    if (nodes.has(filePath) || dist > depth) continue;

    const n = graph.nodes.get(filePath);
    if (!n) continue;

    nodes.set(filePath, {
      path: filePath,
      relativePath: n.relativePath,
      language: n.language,
      distanceFromCenter: dist,
      direction: dir,
    });

    if (dist < depth) {
      const next = dir === "dependency" ? n.dependencies : n.dependents;
      for (const dep of next) {
        if (!nodes.has(dep)) queue.push({ filePath: dep, dist: dist + 1, dir });
      }
    }
  }

  // Edges between nodes that both made it into the subgraph.
  for (const [from, fromNode] of graph.nodes) {
    if (!nodes.has(from)) continue;
    for (const to of fromNode.dependencies) {
      if (nodes.has(to)) edges.push({ from, to, type: "imports" });
    }
  }

  return { nodes, edges };
}
