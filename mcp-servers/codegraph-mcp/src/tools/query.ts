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

/**
 * Calibrated liveness for an exported symbol. Only ever `unused` when there is
 * no named importer AND no namespace/star/dynamic path that could carry it —
 * the asymmetry that prevents a false "dead".
 */
function livenessFor(name: string, filePath: string, consumers: Map<string, Consumer>): Liveness {
  const rec = consumers.get(filePath);
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
  const definitions: (SymbolRef & { liveness: Liveness; references: FileRef[] })[] = [];
  const stem = symbolStem(name);
  const siblings: { name: string; relativePath: string; line: number; liveness: Liveness }[] = [];

  for (const node of graph.nodes.values()) {
    if (!node.symbols) continue;
    for (const sym of node.symbols) {
      if (sym.name === name && (!fileFilter || node.path === fileFilter)) {
        definitions.push({
          ...toSymbolRef(node, sym),
          liveness: sym.exported ? livenessFor(name, node.path, consumers) : { verdict: "used" },
          references: symbolImporters(graph, node.path, name).map((d) => d.file),
        });
      } else if (sym.name !== name && symbolStem(sym.name) === stem) {
        siblings.push({
          name: sym.name,
          relativePath: node.relativePath,
          line: sym.line,
          liveness: sym.exported ? livenessFor(sym.name, node.path, consumers) : { verdict: "used" },
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
  const dead: (SymbolRef & { liveness: Liveness })[] = [];
  let ambiguousCount = 0;

  for (const node of graph.nodes.values()) {
    if (!node.symbols) continue;
    if (fileFilter && node.path !== fileFilter) continue;
    if (node.isTest && !includeTests) continue;
    for (const sym of node.symbols) {
      if (!sym.exported) continue;
      const liveness = livenessFor(sym.name, node.path, consumers);
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
