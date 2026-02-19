import * as path from "path";
import {
  DependencyGraph,
  FileRef,
  FileDependencies,
  FileDependents,
  ChangeImpact,
  SubGraph,
  SubGraphNode,
  SubGraphEdge,
  GraphStats,
  ConnectedFile,
  Language,
} from "../types.js";
import {
  findFileInGraph,
  findEntryPoints,
  getTransitiveDependents,
  getTransitiveDependencies,
} from "../graph.js";

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

  const centerNode = graph.nodes.get(resolved)!;
  const nodesMap = new Map<string, SubGraphNode>();
  const edges: SubGraphEdge[] = [];

  // Add center
  nodesMap.set(resolved, {
    path: resolved,
    relativePath: centerNode.relativePath,
    language: centerNode.language,
    distanceFromCenter: 0,
    direction: "center",
  });

  // BFS in both directions up to `depth`
  const queue: Array<{ filePath: string; dist: number; dir: "dependency" | "dependent" }> = [];

  for (const dep of centerNode.dependencies) {
    queue.push({ filePath: dep, dist: 1, dir: "dependency" });
  }
  for (const dep of centerNode.dependents) {
    queue.push({ filePath: dep, dist: 1, dir: "dependent" });
  }

  while (queue.length > 0) {
    const { filePath, dist, dir } = queue.shift()!;
    if (nodesMap.has(filePath) || dist > depth) continue;

    const n = graph.nodes.get(filePath);
    if (!n) continue;

    nodesMap.set(filePath, {
      path: filePath,
      relativePath: n.relativePath,
      language: n.language,
      distanceFromCenter: dist,
      direction: dir,
    });

    if (dist < depth) {
      if (dir === "dependency") {
        for (const dep of n.dependencies) {
          if (!nodesMap.has(dep)) queue.push({ filePath: dep, dist: dist + 1, dir: "dependency" });
        }
      } else {
        for (const dep of n.dependents) {
          if (!nodesMap.has(dep)) queue.push({ filePath: dep, dist: dist + 1, dir: "dependent" });
        }
      }
    }
  }

  // Build edges (only between nodes in the subgraph)
  for (const [from, fromNode] of graph.nodes) {
    if (!nodesMap.has(from)) continue;
    for (const to of fromNode.dependencies) {
      if (nodesMap.has(to)) {
        edges.push({ from, to, type: "imports" });
      }
    }
  }

  return {
    centerFile: toFileRef(resolved, graph),
    depth,
    nodes: [...nodesMap.values()],
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
} {
  let files = [...graph.nodes.values()];

  if (language) {
    files = files.filter((n) => n.language === language);
  }

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const total = files.length;
  const page = files.slice(offset, offset + limit);

  return {
    files: page.map((n) => toFileRef(n.path, graph)),
    total,
    returned: page.length,
    offset,
    has_more: offset + page.length < total,
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
