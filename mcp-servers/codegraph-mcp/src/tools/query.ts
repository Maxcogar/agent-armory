import * as fs from "fs";
import * as path from "path";
import {
  DependencyGraph,
  FileNode,
  FileRef,
  FileDependencies,
  FileDependents,
  ChangeImpact,
  SubGraph,
  GraphStats,
  ConnectedFile,
  Language,
  DocRef,
  DocListRef,
  RelatedDocsResult,
  CyclesResult,
  PathBetweenResult,
  OrphansResult,
  LayersResult,
  Liveness,
  SymbolKind,
  SymbolNode,
} from "../types.js";
import {
  findFileInGraph,
  findEntryPoints,
  findOrphans,
  findCycles,
  findDependencyPath,
  computeLayers,
  collectSubgraph,
  getTransitiveDependents,
  getTransitiveDependencies,
  isTypeOnlyEdge,
  findUnreachable,
  findClusters,
} from "../graph.js";
import {
  exportMermaid,
  exportDot,
  ExportResult,
  ExportOptions,
} from "../export.js";
import { symbolStem, extractUnusedImports } from "../treesitter/symbols.js";
import { normalizeHttpPath, mqttMatches } from "../treesitter/surface.js";
import { computeTsLiveness, TsLiveness } from "../tscompiler/liveness.js";

// ============================================================
// Helpers
// ============================================================

function toFileRef(absPath: string, graph: DependencyGraph): FileRef {
  const node = graph.nodes.get(absPath);
  return {
    path: absPath,
    relativePath: node?.relativePath ?? path.relative(graph.rootDir, absPath),
    language: node?.language ?? "unknown",
  };
}

export function resolveSingleFile(
  graph: DependencyGraph,
  fileQuery: string
): { resolved: string | null; error: string | null } {
  const matches = findFileInGraph(graph, fileQuery);
  if (matches.length === 0) {
    return {
      resolved: null,
      error: `File not found in graph: "${fileQuery}". Try codegraph_list_files to see available files.`,
    };
  }
  if (matches.length > 1) {
    const relPaths = matches.map((m) => path.relative(graph.rootDir, m));
    return {
      resolved: null,
      error: `Ambiguous file query "${fileQuery}" matched ${matches.length} files:\n${relPaths.join("\n")}\nPlease provide a more specific path.`,
    };
  }
  return { resolved: matches[0], error: null };
}

// ============================================================
// Tool Implementations
// ============================================================

/** codegraph_get_dependencies */
export function toolGetDependencies(
  graph: DependencyGraph,
  fileQuery: string
): FileDependencies | { error: string } {
  const { resolved, error } = resolveSingleFile(graph, fileQuery);
  if (error || !resolved) return { error: error! };

  const node = graph.nodes.get(resolved)!;
  return {
    file: resolved,
    relativePath: node.relativePath,
    language: node.language,
    dependencies: node.dependencies.map((d) => toFileRef(d, graph)),
    dependencyCount: node.dependencies.length,
  };
}

/** codegraph_get_dependents */
export function toolGetDependents(
  graph: DependencyGraph,
  fileQuery: string
): FileDependents | { error: string } {
  const { resolved, error } = resolveSingleFile(graph, fileQuery);
  if (error || !resolved) return { error: error! };

  const node = graph.nodes.get(resolved)!;
  return {
    file: resolved,
    relativePath: node.relativePath,
    language: node.language,
    dependents: node.dependents.map((d) => toFileRef(d, graph)),
    dependentCount: node.dependents.length,
  };
}

/** codegraph_get_change_impact */
export function toolGetChangeImpact(
  graph: DependencyGraph,
  fileQueries: string[],
  excludeTypeOnly: boolean = false
): ChangeImpact | { error: string } {
  const changedFilePaths: string[] = [];

  for (const query of fileQueries) {
    const { resolved, error } = resolveSingleFile(graph, query);
    if (error || !resolved) return { error: error! };
    changedFilePaths.push(resolved);
  }

  const changedSet = new Set(changedFilePaths);

  // Direct dependents (one hop)
  const directlyAffectedSet = new Set<string>();
  for (const filePath of changedFilePaths) {
    const node = graph.nodes.get(filePath)!;
    for (const dep of node.dependents) {
      if (changedSet.has(dep)) continue;
      // Skip importers coupled only via type-only imports when requested.
      if (excludeTypeOnly) {
        const importer = graph.nodes.get(dep);
        if (importer && isTypeOnlyEdge(importer, filePath)) continue;
      }
      directlyAffectedSet.add(dep);
    }
  }

  // Transitive dependents (all hops)
  const allAffected = getTransitiveDependents(graph, changedSet, { excludeTypeOnly });
  const transitiveOnly = new Set([...allAffected].filter((f) => !directlyAffectedSet.has(f)));

  const totalImpacted = allAffected.size;
  const blastRadius = changedFilePaths.length + totalImpacted;
  const coveragePercent = parseFloat(
    ((blastRadius / Math.max(graph.totalFiles, 1)) * 100).toFixed(1)
  );

  return {
    changedFiles: changedFilePaths.map((f) => toFileRef(f, graph)),
    directlyAffected: [...directlyAffectedSet].map((f) => toFileRef(f, graph)),
    transitivelyAffected: [...transitiveOnly].map((f) => toFileRef(f, graph)),
    totalImpacted,
    blastRadius,
    coveragePercent,
  };
}

/** codegraph_get_subgraph */
export function toolGetSubgraph(
  graph: DependencyGraph,
  fileQuery: string,
  depth: number
): SubGraph | { error: string } {
  const { resolved, error } = resolveSingleFile(graph, fileQuery);
  if (error || !resolved) return { error: error! };

  const { nodes, edges } = collectSubgraph(graph, resolved, depth);

  return {
    centerFile: toFileRef(resolved, graph),
    depth,
    nodes: [...nodes.values()],
    edges,
  };
}

/** codegraph_find_entry_points */
export function toolFindEntryPoints(
  graph: DependencyGraph,
  language?: Language
): FileRef[] {
  const entries = findEntryPoints(graph);
  return entries
    .filter((f) => {
      if (!language) return true;
      return graph.nodes.get(f)?.language === language;
    })
    .map((f) => toFileRef(f, graph));
}

/** codegraph_list_files */
export function toolListFiles(
  graph: DependencyGraph,
  language?: Language,
  limit: number = 200,
  offset: number = 0
): {
  files: FileRef[];
  total: number;
  returned: number;
  offset: number;
  has_more: boolean;
  note?: string;
} {
  let files = [...graph.nodes.values()];

  if (language) {
    files = files.filter((n) => n.language === language);
  }

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const total = files.length;
  const page = files.slice(offset, offset + limit);

  const result: {
    files: FileRef[];
    total: number;
    returned: number;
    offset: number;
    has_more: boolean;
    note?: string;
  } = {
    files: page.map((n) => toFileRef(n.path, graph)),
    total,
    returned: page.length,
    offset,
    has_more: offset + page.length < total,
  };

  // codegraph_list_files only returns code files (the dependency-graph nodes).
  // Documentation files (.md/.mdx/.rst/.txt) are scanned into a separate index.
  // If a project has no code files but does have docs, surface that explicitly
  // so an empty result isn't mistaken for "nothing was scanned".
  if (graph.nodes.size === 0 && graph.docNodes.size > 0) {
    result.note =
      `No code files are in the graph, but ${graph.docNodes.size} documentation ` +
      `file(s) were scanned. codegraph_list_files only lists code (JS/TS/Python/C++). ` +
      `Use codegraph_list_docs to list the documentation files.`;
  }

  return result;
}

/** codegraph_list_docs */
export function toolListDocs(
  graph: DependencyGraph,
  limit: number = 200,
  offset: number = 0
): {
  docs: DocListRef[];
  total: number;
  returned: number;
  offset: number;
  has_more: boolean;
} {
  const docs = [...graph.docNodes.values()].sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath)
  );

  const total = docs.length;
  const page = docs.slice(offset, offset + limit);

  return {
    docs: page.map((d) => ({
      path: d.path,
      relativePath: d.relativePath,
      referencedCodeFileCount: d.referencedCodeFiles.length,
    })),
    total,
    returned: page.length,
    offset,
    has_more: offset + page.length < total,
  };
}

/** codegraph_find_related_docs */
export function toolFindRelatedDocs(
  graph: DependencyGraph,
  fileQueries: string[]
): RelatedDocsResult | { error: string } {
  // Resolve all changed files
  const changedFilePaths: string[] = [];
  for (const query of fileQueries) {
    const { resolved, error } = resolveSingleFile(graph, query);
    if (error || !resolved) return { error: error! };
    changedFilePaths.push(resolved);
  }

  const changedSet = new Set(changedFilePaths);

  // Compute full blast radius: changed files + all transitive dependents
  const transitivelyAffected = getTransitiveDependents(graph, changedSet);
  const blastRadiusSet = new Set([...changedSet, ...transitivelyAffected]);

  // Find all doc files that reference ANY file in the blast radius
  const relatedDocs: DocRef[] = [];

  for (const [, docNode] of graph.docNodes) {
    const matchedCodeFiles: FileRef[] = [];
    for (const codeRef of docNode.referencedCodeFiles) {
      if (blastRadiusSet.has(codeRef)) {
        matchedCodeFiles.push(toFileRef(codeRef, graph));
      }
    }

    if (matchedCodeFiles.length > 0) {
      const matchedPaths = matchedCodeFiles.map((f) => f.relativePath);
      relatedDocs.push({
        path: docNode.path,
        relativePath: docNode.relativePath,
        matchedCodeFiles,
        reason: `references ${matchedPaths.join(", ")}`,
      });
    }
  }

  // Sort by number of matched references (most connected docs first)
  relatedDocs.sort((a, b) => b.matchedCodeFiles.length - a.matchedCodeFiles.length);

  return {
    changedFiles: changedFilePaths.map((f) => toFileRef(f, graph)),
    blastRadius: [...blastRadiusSet].map((f) => toFileRef(f, graph)),
    relatedDocs,
    totalDocsToReview: relatedDocs.length,
    totalDocsInProject: graph.docNodes.size,
  };
}

/** codegraph_get_stats */
export function toolGetStats(graph: DependencyGraph): GraphStats {
  const byLanguage: Record<string, number> = {};
  let totalDeps = 0;

  const allNodes = [...graph.nodes.values()];

  for (const node of allNodes) {
    byLanguage[node.language] = (byLanguage[node.language] ?? 0) + 1;
    totalDeps += node.dependencies.length;
  }

  const mostConnected: ConnectedFile[] = allNodes
    .map((n) => ({
      path: n.path,
      relativePath: n.relativePath,
      language: n.language,
      count: n.dependencies.length + n.dependents.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const mostDependedOn: ConnectedFile[] = allNodes
    .map((n) => ({
      path: n.path,
      relativePath: n.relativePath,
      language: n.language,
      count: n.dependents.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const entryPoints = findEntryPoints(graph)
    .slice(0, 20)
    .map((f) => toFileRef(f, graph));

  return {
    rootDir: graph.rootDir,
    builtAt: new Date(graph.builtAt).toISOString(),
    totalFiles: graph.totalFiles,
    byLanguage,
    entryPoints,
    mostConnected,
    mostDependedOn,
    parseErrors: graph.parseErrors.length,
    averageDependencies:
      allNodes.length > 0
        ? parseFloat((totalDeps / allNodes.length).toFixed(2))
        : 0,
  };
}

// ============================================================
// Graph Intelligence Tools
// ============================================================

/** codegraph_find_cycles */
export function toolFindCycles(
  graph: DependencyGraph,
  maxCycles: number = 50
): CyclesResult {
  const all = findCycles(graph);
  const page = all.slice(0, maxCycles);
  return {
    cycles: page.map((ring) => ring.map((f) => toFileRef(f, graph))),
    count: all.length,
    hasCycles: all.length > 0,
    truncated: all.length > page.length,
  };
}

/** codegraph_get_path_between */
export function toolGetPathBetween(
  graph: DependencyGraph,
  fromQuery: string,
  toQuery: string
): PathBetweenResult | { error: string } {
  const from = resolveSingleFile(graph, fromQuery);
  if (from.error || !from.resolved) return { error: from.error! };
  const to = resolveSingleFile(graph, toQuery);
  if (to.error || !to.resolved) return { error: to.error! };

  const chain = findDependencyPath(graph, from.resolved, to.resolved);
  if (chain) {
    return {
      from: toFileRef(from.resolved, graph),
      to: toFileRef(to.resolved, graph),
      path: chain.map((f) => toFileRef(f, graph)),
      found: true,
      length: chain.length - 1,
    };
  }

  // No forward path; report whether the reverse dependency exists as a hint.
  const reverse = findDependencyPath(graph, to.resolved, from.resolved);
  return {
    from: toFileRef(from.resolved, graph),
    to: toFileRef(to.resolved, graph),
    path: null,
    found: false,
    length: null,
    reverseExists: reverse !== null,
  };
}

/** codegraph_find_orphans */
export function toolFindOrphans(
  graph: DependencyGraph,
  language?: Language
): OrphansResult {
  const orphans = findOrphans(graph)
    .filter((f) => !language || graph.nodes.get(f)?.language === language)
    .sort((a, b) => {
      const ra = graph.nodes.get(a)!.relativePath;
      const rb = graph.nodes.get(b)!.relativePath;
      return ra.localeCompare(rb);
    })
    .map((f) => toFileRef(f, graph));
  return { orphans, count: orphans.length };
}

/** codegraph_get_layers */
export function toolGetLayers(graph: DependencyGraph): LayersResult {
  const { layers, depth, cyclic, cyclicNodes } = computeLayers(graph);
  return {
    layers: layers.map((layer) => layer.map((f) => toFileRef(f, graph))),
    depth,
    cyclic,
    cyclicNodes: cyclicNodes.map((f) => toFileRef(f, graph)),
  };
}

// ============================================================
// Import-edge tools (broken imports / external dependencies)
// ============================================================

/** Aggregate an external specifier to its package root ("lodash/fn" -> "lodash"). */
function externalName(spec: string): string {
  if (spec.startsWith("@")) return spec.split("/").slice(0, 2).join("/");
  return spec.split(/[/.]/)[0];
}

/** codegraph_find_broken_imports — relative/local imports that resolved to nothing. */
export function toolFindBrokenImports(graph: DependencyGraph): {
  broken: { file: string; relativePath: string; raw: string; line: number }[];
  count: number;
} {
  const broken: { file: string; relativePath: string; raw: string; line: number }[] = [];
  for (const node of graph.nodes.values()) {
    if (!node.imports) continue;
    for (const edge of node.imports) {
      if (edge.resolution === "unresolved") {
        broken.push({ file: node.path, relativePath: node.relativePath, raw: edge.raw, line: edge.line });
      }
    }
  }
  broken.sort((a, b) => a.relativePath.localeCompare(b.relativePath) || a.line - b.line);
  return { broken, count: broken.length };
}

/** codegraph_list_external_dependencies — third-party/builtin packages used, by importer count. */
export function toolListExternalDependencies(
  graph: DependencyGraph,
  language?: Language
): { externals: { name: string; importerCount: number }[]; count: number } {
  const importers = new Map<string, Set<string>>();
  for (const node of graph.nodes.values()) {
    if (language && node.language !== language) continue;
    if (!node.imports) continue;
    for (const edge of node.imports) {
      if (edge.resolution !== "external") continue;
      const name = externalName(edge.raw);
      let set = importers.get(name);
      if (!set) importers.set(name, (set = new Set()));
      set.add(node.path);
    }
  }
  const externals = [...importers.entries()]
    .map(([name, files]) => ({ name, importerCount: files.size }))
    .sort((a, b) => b.importerCount - a.importerCount || a.name.localeCompare(b.name));
  return { externals, count: externals.length };
}

/** codegraph_get_external_users — which files import a given external package. */
export function toolGetExternalUsers(
  graph: DependencyGraph,
  name: string
): { name: string; users: FileRef[]; count: number } {
  const users: FileRef[] = [];
  for (const node of graph.nodes.values()) {
    if (!node.imports) continue;
    const uses = node.imports.some(
      (e) => e.resolution === "external" && (e.raw === name || externalName(e.raw) === name)
    );
    if (uses) users.push(toFileRef(node.path, graph));
  }
  users.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return { name, users, count: users.length };
}

// ============================================================
// Reachability & clustering tools
// ============================================================

/** codegraph_find_unreachable — code files no entry point can reach (true dead code). */
export function toolFindUnreachable(
  graph: DependencyGraph,
  entryQueries?: string[],
  includeTests: boolean = false
): { unreachable: FileRef[]; entryPoints: FileRef[]; count: number } | { error: string } {
  let entryPaths: string[] | null = null;
  if (entryQueries && entryQueries.length > 0) {
    entryPaths = [];
    for (const q of entryQueries) {
      const { resolved, error } = resolveSingleFile(graph, q);
      if (error || !resolved) return { error: error! };
      entryPaths.push(resolved);
    }
  }
  const { unreachable, entryPoints } = findUnreachable(graph, entryPaths, includeTests);
  return {
    unreachable: unreachable.map((f) => toFileRef(f, graph)),
    entryPoints: entryPoints
      .map((f) => toFileRef(f, graph))
      .sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
    count: unreachable.length,
  };
}

/** codegraph_find_clusters — weakly-connected islands of related files. */
export function toolFindClusters(
  graph: DependencyGraph,
  minSize: number = 2,
  includeTests: boolean = false
): { clusters: { id: number; size: number; files: FileRef[] }[]; count: number } {
  const clusters = findClusters(graph, minSize, includeTests).map((files, id) => ({
    id,
    size: files.length,
    files: files.map((f) => toFileRef(f, graph)),
  }));
  return { clusters, count: clusters.length };
}

// ============================================================
// Symbol-level tools (Phase 1)
// ============================================================

export interface SymbolRef {
  [key: string]: unknown;
  file: string;
  relativePath: string;
  name: string;
  kind: SymbolKind;
  line: number;
  exported: boolean;
}

function toSymbolRef(node: FileNode, sym: SymbolNode): SymbolRef {
  return {
    file: node.path,
    relativePath: node.relativePath,
    name: sym.name,
    kind: sym.kind,
    line: sym.line,
    exported: sym.exported,
  };
}

/** Per-target-file consumption: which named symbols are imported, and whether
 *  any namespace/star/dynamic path makes consumption unprovable (ambiguous). */
interface Consumer {
  named: Set<string>;
  ambiguous: boolean;
  reason?: string;
}

function computeConsumers(graph: DependencyGraph): Map<string, Consumer> {
  const map = new Map<string, Consumer>();
  for (const node of graph.nodes.values()) {
    if (!node.imports) continue;
    for (const e of node.imports) {
      if (e.resolution !== "internal" || !e.to) continue;
      let rec = map.get(e.to);
      if (!rec) map.set(e.to, (rec = { named: new Set(), ambiguous: false }));
      for (const s of e.specifiers) {
        if (s.kind === "named") rec.named.add(s.imported);
        else if (s.kind === "namespace") {
          rec.ambiguous = true;
          rec.reason =
            e.kind === "re-export"
              ? "re-exported via `export *`"
              : "imported via a namespace (`import * as`)";
        }
      }
      if (e.kind === "dynamic") {
        rec.ambiguous = true;
        rec.reason = rec.reason ?? "the module is loaded via dynamic import()";
      }
    }
  }
  return map;
}

// Building a TypeScript Program is expensive; memoize the authoritative liveness
// per graph (a rescan produces a new graph object, invalidating the entry).
const tsLivenessCache = new WeakMap<DependencyGraph, TsLiveness>();

function getTsLiveness(graph: DependencyGraph): TsLiveness {
  let cached = tsLivenessCache.get(graph);
  if (!cached) {
    const tsJs = [...graph.nodes.values()]
      .filter((n) => n.language === "typescript" || n.language === "javascript")
      .map((n) => n.path);
    cached = computeTsLiveness(graph.rootDir, tsJs);
    tsLivenessCache.set(graph, cached);
  }
  return cached;
}

/**
 * Liveness for an exported symbol. For TS/JS files the TypeScript compiler
 * resolves it authoritatively (used/unused, following barrels and namespaces).
 * Otherwise it is calibrated: only ever `unused` when there is no named importer
 * AND no namespace/star/dynamic path that could carry it — the asymmetry that
 * prevents a false "dead".
 */
function livenessFor(
  name: string,
  node: FileNode,
  consumers: Map<string, Consumer>,
  tsLiveness: TsLiveness
): Liveness {
  if (
    (node.language === "typescript" || node.language === "javascript") &&
    tsLiveness.covered.has(node.path)
  ) {
    return tsLiveness.usedExternally.has(`${node.path}#${name}`)
      ? { verdict: "used" }
      : { verdict: "unused" };
  }
  const rec = consumers.get(node.path);
  if (rec && rec.named.has(name)) return { verdict: "used" };
  if (rec && rec.ambiguous) return { verdict: "ambiguous", reason: rec.reason };
  return { verdict: "unused" };
}

/** Files that import `name` from `targetFile`. */
function symbolImporters(
  graph: DependencyGraph,
  targetFile: string,
  name: string
): { file: FileRef; via: string; line: number; throughNamespace: boolean }[] {
  const out: { file: FileRef; via: string; line: number; throughNamespace: boolean }[] = [];
  for (const node of graph.nodes.values()) {
    if (!node.imports) continue;
    for (const e of node.imports) {
      if (e.to !== targetFile) continue;
      const named = e.specifiers.some((s) => s.kind === "named" && s.imported === name);
      const namespace = e.specifiers.some((s) => s.kind === "namespace");
      if (named || namespace) {
        out.push({ file: toFileRef(node.path, graph), via: e.kind, line: e.line, throughNamespace: namespace && !named });
      }
    }
  }
  out.sort((a, b) => a.file.relativePath.localeCompare(b.file.relativePath) || a.line - b.line);
  return out;
}

/** codegraph_find_symbol_dependents — who imports a specific symbol of a file. */
export function toolFindSymbolDependents(
  graph: DependencyGraph,
  fileQuery: string,
  symbol: string
): {
  symbol: string;
  file: FileRef;
  definedAt: number | null;
  dependents: { file: FileRef; via: string; line: number; throughNamespace: boolean }[];
  count: number;
} | { error: string } {
  const { resolved, error } = resolveSingleFile(graph, fileQuery);
  if (error || !resolved) return { error: error! };
  const node = graph.nodes.get(resolved)!;
  const def = node.symbols?.find((s) => s.name === symbol);
  const dependents = symbolImporters(graph, resolved, symbol);
  return {
    symbol,
    file: toFileRef(resolved, graph),
    definedAt: def ? def.line : null,
    dependents,
    count: dependents.length,
  };
}

/** codegraph_get_symbol — definition(s), references, verdict, and live siblings. */
export function toolGetSymbol(
  graph: DependencyGraph,
  name: string,
  fileQuery?: string
): {
  name: string;
  found: boolean;
  definitions: (SymbolRef & { liveness: Liveness; references: FileRef[] })[];
  siblings: { name: string; relativePath: string; line: number; liveness: Liveness }[];
} | { error: string } {
  let fileFilter: string | null = null;
  if (fileQuery) {
    const { resolved, error } = resolveSingleFile(graph, fileQuery);
    if (error || !resolved) return { error: error! };
    fileFilter = resolved;
  }

  const consumers = computeConsumers(graph);
  const tsLiveness = getTsLiveness(graph);
  const definitions: (SymbolRef & { liveness: Liveness; references: FileRef[] })[] = [];
  const stem = symbolStem(name);
  const siblings: { name: string; relativePath: string; line: number; liveness: Liveness }[] = [];

  for (const node of graph.nodes.values()) {
    if (!node.symbols) continue;
    for (const sym of node.symbols) {
      if (sym.name === name && (!fileFilter || node.path === fileFilter)) {
        definitions.push({
          ...toSymbolRef(node, sym),
          liveness: sym.exported ? livenessFor(name, node, consumers, tsLiveness) : { verdict: "used" },
          references: symbolImporters(graph, node.path, name).map((d) => d.file),
        });
      } else if (sym.name !== name && symbolStem(sym.name) === stem) {
        siblings.push({
          name: sym.name,
          relativePath: node.relativePath,
          line: sym.line,
          liveness: sym.exported ? livenessFor(sym.name, node, consumers, tsLiveness) : { verdict: "used" },
        });
      }
    }
  }

  definitions.sort((a, b) => a.relativePath.localeCompare(b.relativePath) || a.line - b.line);
  siblings.sort((a, b) => a.relativePath.localeCompare(b.relativePath) || a.line - b.line);
  return { name, found: definitions.length > 0, definitions, siblings };
}

/** codegraph_find_dead_exports — exported symbols with no live importer. */
export function toolFindDeadExports(
  graph: DependencyGraph,
  fileQuery?: string,
  includeTests: boolean = false
): {
  dead: (SymbolRef & { liveness: Liveness })[];
  count: number;
  ambiguousCount: number;
} | { error: string } {
  let fileFilter: string | null = null;
  if (fileQuery) {
    const { resolved, error } = resolveSingleFile(graph, fileQuery);
    if (error || !resolved) return { error: error! };
    fileFilter = resolved;
  }

  const consumers = computeConsumers(graph);
  const tsLiveness = getTsLiveness(graph);
  const dead: (SymbolRef & { liveness: Liveness })[] = [];
  let ambiguousCount = 0;

  for (const node of graph.nodes.values()) {
    if (!node.symbols) continue;
    if (fileFilter && node.path !== fileFilter) continue;
    if (node.isTest && !includeTests) continue;
    for (const sym of node.symbols) {
      if (!sym.exported) continue;
      const liveness = livenessFor(sym.name, node, consumers, tsLiveness);
      if (liveness.verdict === "unused") dead.push({ ...toSymbolRef(node, sym), liveness });
      else if (liveness.verdict === "ambiguous") ambiguousCount++;
    }
  }

  dead.sort((a, b) => a.relativePath.localeCompare(b.relativePath) || a.line - b.line);
  return { dead, count: dead.length, ambiguousCount };
}

/** codegraph_find_unused_imports — specifiers imported but never referenced. */
export function toolFindUnusedImports(
  graph: DependencyGraph,
  fileQuery?: string
): {
  unused: { file: FileRef; imported: string; local: string; line: number }[];
  count: number;
} | { error: string } {
  let targets: FileNode[];
  if (fileQuery) {
    const { resolved, error } = resolveSingleFile(graph, fileQuery);
    if (error || !resolved) return { error: error! };
    targets = [graph.nodes.get(resolved)!];
  } else {
    targets = [...graph.nodes.values()];
  }

  const unused: { file: FileRef; imported: string; local: string; line: number }[] = [];
  for (const node of targets) {
    if (node.language !== "typescript" && node.language !== "javascript" && node.language !== "python") {
      continue;
    }
    let code: string;
    try {
      code = fs.readFileSync(node.path, "utf-8");
    } catch {
      continue;
    }
    for (const u of extractUnusedImports(node.language, code)) {
      unused.push({ file: toFileRef(node.path, graph), imported: u.imported, local: u.local, line: u.line });
    }
  }
  unused.sort((a, b) => a.file.relativePath.localeCompare(b.file.relativePath) || a.line - b.line);
  return { unused, count: unused.length };
}

// ============================================================
// Surface diff (exported-symbol changes between two scans)
// ============================================================

interface SurfaceEntry {
  relativePath: string;
  name: string;
  kind: SymbolKind;
  line: number;
}

function exportedSurface(graph: DependencyGraph): Map<string, SurfaceEntry> {
  const surface = new Map<string, SurfaceEntry>();
  for (const node of graph.nodes.values()) {
    if (!node.symbols) continue;
    for (const sym of node.symbols) {
      if (!sym.exported) continue;
      surface.set(`${node.relativePath}#${sym.name}`, {
        relativePath: node.relativePath,
        name: sym.name,
        kind: sym.kind,
        line: sym.line,
      });
    }
  }
  return surface;
}

/** codegraph_diff_surface — exported-symbol changes vs the pre-scan baseline. */
export function toolDiffSurface(
  graph: DependencyGraph,
  baseline: DependencyGraph | null
): {
  hasBaseline: boolean;
  added: SurfaceEntry[];
  removed: SurfaceEntry[];
  signatureChanged: { relativePath: string; name: string; before: SymbolKind; after: SymbolKind }[];
  addedCount: number;
  removedCount: number;
  changedCount: number;
  message?: string;
} {
  if (!baseline) {
    return {
      hasBaseline: false,
      added: [],
      removed: [],
      signatureChanged: [],
      addedCount: 0,
      removedCount: 0,
      changedCount: 0,
      message:
        "No prior scan to diff against in this session. Re-scan after a change; " +
        "the surface before each scan is kept as the baseline.",
    };
  }

  const current = exportedSurface(graph);
  const base = exportedSurface(baseline);
  const added: SurfaceEntry[] = [];
  const removed: SurfaceEntry[] = [];
  const signatureChanged: { relativePath: string; name: string; before: SymbolKind; after: SymbolKind }[] = [];

  for (const [key, entry] of current) {
    const prev = base.get(key);
    if (!prev) added.push(entry);
    else if (prev.kind !== entry.kind) {
      signatureChanged.push({ relativePath: entry.relativePath, name: entry.name, before: prev.kind, after: entry.kind });
    }
  }
  for (const [key, entry] of base) {
    if (!current.has(key)) removed.push(entry);
  }

  const byLoc = (a: SurfaceEntry, b: SurfaceEntry) =>
    a.relativePath.localeCompare(b.relativePath) || a.name.localeCompare(b.name);
  added.sort(byLoc);
  removed.sort(byLoc);
  signatureChanged.sort((a, b) => a.relativePath.localeCompare(b.relativePath) || a.name.localeCompare(b.name));

  return {
    hasBaseline: true,
    added,
    removed,
    signatureChanged,
    addedCount: added.length,
    removedCount: removed.length,
    changedCount: signatureChanged.length,
  };
}

// ============================================================
// Document <-> code consistency (verify_doc)
// ============================================================

const DOC_STOPWORDS = new Set([
  "This", "That", "These", "Note", "Returns", "Example", "Args", "Type", "Types",
  "None", "True", "False", "Object", "Array", "String", "Number", "Boolean",
  "Promise", "Record", "Partial", "Phase", "Step", "Code", "File", "Files",
  "Used", "Usage", "Input", "Output", "Json", "Http", "Https",
]);

/** A doc token that plausibly names a code symbol (PascalCase or camelCase). */
function isCandidateName(t: string): boolean {
  if (t.length < 4 || DOC_STOPWORDS.has(t)) return false;
  return /[a-z][A-Z]/.test(t) || /^[A-Z][a-z]+$/.test(t);
}

/** Extract symbol-like tokens a doc claims about: code-span/fenced identifiers,
 *  dotted-access roots (`plantInfo.x` -> plantInfo), and standalone Pascal types. */
function extractDocCandidates(content: string): string[] {
  const spans: string[] = [];
  for (const m of content.matchAll(/`([^`\n]+)`/g)) spans.push(m[1]);
  for (const m of content.matchAll(/```[a-zA-Z0-9]*\n([\s\S]*?)```/g)) spans.push(m[1]);

  const out = new Set<string>();
  for (const span of spans) {
    for (const m of span.matchAll(/\b([A-Za-z_]\w*)(?:\.\w+)+/g)) {
      if (isCandidateName(m[1])) out.add(m[1]);
    }
    for (const m of span.matchAll(/(?<!\.)\b[A-Z][a-z][A-Za-z0-9]{2,}\b/g)) {
      if (isCandidateName(m[0])) out.add(m[0]);
    }
  }
  return [...out];
}

function sharedPrefixLen(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/** Real symbols whose names are closest to an unknown token (for suggestions). */
function nearestSymbols(token: string, allNames: string[]): string[] {
  const lt = token.toLowerCase();
  const key = lt.slice(0, Math.min(5, lt.length));
  const scored: { name: string; score: number }[] = [];
  for (const name of allNames) {
    const ln = name.toLowerCase();
    if (ln === lt) continue;
    let score = 0;
    if (ln.startsWith(key) || lt.startsWith(ln.slice(0, 5))) score = sharedPrefixLen(lt, ln) + 2;
    else if (ln.includes(key) || lt.includes(ln.slice(0, 5))) score = 1;
    if (score > 0) scored.push({ name, score });
  }
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of scored) {
    if (seen.has(s.name)) continue;
    seen.add(s.name);
    out.push(s.name);
    if (out.length >= 3) break;
  }
  return out;
}

function resolveDoc(graph: DependencyGraph, query: string): { path: string; relativePath: string } | null {
  const q = query.replace(/\\/g, "/").toLowerCase();
  for (const doc of graph.docNodes.values()) {
    const rel = doc.relativePath.replace(/\\/g, "/").toLowerCase();
    if (rel === q || rel.endsWith("/" + q) || path.basename(rel) === q || doc.path.toLowerCase() === q) {
      return { path: doc.path, relativePath: doc.relativePath };
    }
  }
  return null;
}

/** codegraph_verify_doc — check the symbol claims a doc makes against the code. */
export function toolVerifyDoc(
  graph: DependencyGraph,
  docQuery: string
): {
  doc: { path: string; relativePath: string };
  checked: number;
  missing: { token: string; nearest: string[] }[];
  dead: { token: string; symbol: SymbolRef; reason: string }[];
} | { error: string } {
  const doc = resolveDoc(graph, docQuery);
  if (!doc) {
    return { error: `Documentation file not found in graph: "${docQuery}". Use codegraph_list_docs to see scanned docs.` };
  }
  let content: string;
  try {
    content = fs.readFileSync(doc.path, "utf-8");
  } catch {
    return { error: `Could not read documentation file: ${doc.relativePath}` };
  }

  const byName = new Map<string, { node: FileNode; sym: SymbolNode }[]>();
  const fileBasenames = new Set<string>();
  for (const node of graph.nodes.values()) {
    fileBasenames.add(path.basename(node.relativePath).replace(/\.[^.]+$/, "").toLowerCase());
    if (!node.symbols) continue;
    for (const sym of node.symbols) {
      const list = byName.get(sym.name);
      if (list) list.push({ node, sym });
      else byName.set(sym.name, [{ node, sym }]);
    }
  }
  const allNames = [...byName.keys()];

  const consumers = computeConsumers(graph);
  const tsLiveness = getTsLiveness(graph);
  const missing: { token: string; nearest: string[] }[] = [];
  const dead: { token: string; symbol: SymbolRef; reason: string }[] = [];

  const candidates = extractDocCandidates(content);
  for (const token of candidates) {
    const entries = byName.get(token);
    if (entries) {
      const exported = entries.filter((e) => e.sym.exported);
      if (exported.length > 0) {
        const anyLive = exported.some(
          (e) => livenessFor(e.sym.name, e.node, consumers, tsLiveness).verdict !== "unused"
        );
        if (!anyLive) {
          dead.push({
            token,
            symbol: toSymbolRef(exported[0].node, exported[0].sym),
            reason: "the doc references this symbol, but it is a dead export (no live importer)",
          });
        }
      }
    } else if (!fileBasenames.has(token.toLowerCase())) {
      missing.push({ token, nearest: nearestSymbols(token, allNames) });
    }
  }

  missing.sort((a, b) => a.token.localeCompare(b.token));
  dead.sort((a, b) => a.token.localeCompare(b.token));
  return { doc, checked: candidates.length, missing, dead };
}

// ============================================================
// Interface surface: endpoints + cross-language bridges
// ============================================================

/** codegraph_list_endpoints — every HTTP route defined in the code. */
export function toolListEndpoints(graph: DependencyGraph): {
  endpoints: { method: string; route: string; framework: string; relativePath: string; line: number }[];
  count: number;
  byFramework: Record<string, number>;
} {
  const endpoints: { method: string; route: string; framework: string; relativePath: string; line: number }[] = [];
  const byFramework: Record<string, number> = {};
  for (const node of graph.nodes.values()) {
    if (!node.endpoints) continue;
    for (const ep of node.endpoints) {
      endpoints.push({ method: ep.method, route: ep.route, framework: ep.framework, relativePath: node.relativePath, line: ep.line });
      byFramework[ep.framework] = (byFramework[ep.framework] ?? 0) + 1;
    }
  }
  endpoints.sort((a, b) => a.route.localeCompare(b.route) || a.method.localeCompare(b.method));
  // "Active vs dead" for endpoints is answered by codegraph_find_bridges: an
  // endpoint with status "no-consumer" is defined but uncalled in-repo.
  return { endpoints, count: endpoints.length, byFramework };
}

interface BridgeSide {
  relativePath: string;
  language: Language;
  line: number;
}

/** codegraph_find_bridges — cross-language producer/consumer connections. */
export function toolFindBridges(graph: DependencyGraph): {
  bridges: {
    kind: string;
    key: string;
    producers: BridgeSide[];
    consumers: BridgeSide[];
    status: "connected" | "no-consumer" | "no-producer";
    crossLanguage: boolean;
  }[];
  count: number;
} {
  // Collect producers/consumers per (kind,key). HTTP producers come from endpoints.
  const producers = new Map<string, BridgeSide[]>();
  const consumers = new Map<string, BridgeSide[]>();
  const add = (m: Map<string, BridgeSide[]>, key: string, side: BridgeSide) => {
    const list = m.get(key);
    if (list) list.push(side);
    else m.set(key, [side]);
  };

  for (const node of graph.nodes.values()) {
    const side = (line: number): BridgeSide => ({ relativePath: node.relativePath, language: node.language, line });
    for (const ep of node.endpoints ?? []) {
      add(producers, `http ${normalizeHttpPath(ep.route)}`, side(ep.line));
    }
    for (const ch of node.channels ?? []) {
      const key = `${ch.kind} ${ch.key}`;
      add(ch.role === "producer" ? producers : consumers, key, side(ch.line));
    }
  }

  const keys = new Set([...producers.keys(), ...consumers.keys()]);
  const bridges: {
    kind: string;
    key: string;
    producers: BridgeSide[];
    consumers: BridgeSide[];
    status: "connected" | "no-consumer" | "no-producer";
    crossLanguage: boolean;
  }[] = [];

  for (const composite of keys) {
    const [kind, key] = composite.split(" ");
    const prod = producers.get(composite) ?? [];
    let cons = consumers.get(composite) ?? [];

    // MQTT subscriptions may use +/# wildcards — match them to this topic too.
    if (kind === "mqtt") {
      for (const [ck, sides] of consumers) {
        const [ckind, ckey] = ck.split(" ");
        if (ckind === "mqtt" && ckey !== key && mqttMatches(ckey, key)) cons = cons.concat(sides);
      }
    }
    if (prod.length === 0 && cons.length === 0) continue;

    const langs = new Set([...prod, ...cons].map((s) => s.language));
    const status = prod.length > 0 && cons.length > 0 ? "connected" : prod.length > 0 ? "no-consumer" : "no-producer";
    bridges.push({ kind, key, producers: prod, consumers: cons, status, crossLanguage: langs.size > 1 });
  }

  bridges.sort((a, b) => a.kind.localeCompare(b.kind) || a.key.localeCompare(b.key));
  return { bridges, count: bridges.length };
}

// ============================================================
// Visualization export tools
// ============================================================

export interface ExportArgs {
  file?: string;
  depth: number;
  language?: Language;
  maxNodes: number;
}

/**
 * Resolve the optional `file` arg to a concrete center path, returning the
 * ExportOptions both exporters consume. Centralizes resolution so
 * codegraph_export_mermaid and codegraph_export_dot behave identically.
 */
export function resolveExportOptions(
  graph: DependencyGraph,
  args: ExportArgs
): ExportOptions | { error: string } {
  if (args.file === undefined) {
    return { depth: args.depth, language: args.language, maxNodes: args.maxNodes };
  }
  const { resolved, error } = resolveSingleFile(graph, args.file);
  if (error || !resolved) return { error: error! };
  return {
    center: resolved,
    depth: args.depth,
    language: args.language,
    maxNodes: args.maxNodes,
  };
}

/** codegraph_export_mermaid */
export function toolExportMermaid(
  graph: DependencyGraph,
  args: ExportArgs
): ExportResult | { error: string } {
  const opts = resolveExportOptions(graph, args);
  if (isExportError(opts)) return opts;
  return exportMermaid(graph, opts);
}

/** codegraph_export_dot */
export function toolExportDot(
  graph: DependencyGraph,
  args: ExportArgs
): ExportResult | { error: string } {
  const opts = resolveExportOptions(graph, args);
  if (isExportError(opts)) return opts;
  return exportDot(graph, opts);
}

function isExportError(
  v: ExportOptions | { error: string }
): v is { error: string } {
  return (v as { error: string }).error !== undefined;
}
