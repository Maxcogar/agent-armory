import * as path from "path";
import {
  DependencyGraph,
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
} from "../graph.js";
import {
  exportMermaid,
  exportDot,
  ExportResult,
  ExportOptions,
} from "../export.js";

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
  fileQueries: string[]
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
      if (!changedSet.has(dep)) {
        directlyAffectedSet.add(dep);
      }
    }
  }

  // Transitive dependents (all hops)
  const allAffected = getTransitiveDependents(graph, changedSet);
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
