import { DependencyGraph, Language } from "./types.js";
import { collectSubgraph } from "./graph.js";

// ============================================================
// Visual export: Mermaid & Graphviz DOT
// ============================================================
//
// Rendering is a separate concern from graph building. Both formats face the
// same two correctness hazards, handled once here:
//   1. Node IDs: file paths contain `/ . - space` which are illegal in bare
//      Mermaid/DOT identifiers. We never emit a path as an ID — each node gets
//      a stable synthetic id (n0, n1, ...) assigned in sorted order, and the
//      path lives only in the (escaped) label.
//   2. Size: a whole-graph export of a large repo is unrenderable. We cap at
//      `maxNodes`, keeping the highest-degree nodes, and flag truncation.

export interface ExportResult {
  [key: string]: unknown;
  format: "mermaid" | "dot";
  diagram: string;
  nodeCount: number;
  edgeCount: number;
  truncated: boolean;
}

export interface ExportOptions {
  /** Center file (absolute path, already resolved & known to be in the graph). When omitted, the whole graph is exported. */
  center?: string;
  depth: number;
  language?: Language;
  maxNodes: number;
}

interface SelectedNode {
  path: string;
  relativePath: string;
  language: Language;
  /** Synthetic, render-safe identifier (n0, n1, ...) */
  id: string;
}

interface Selection {
  nodes: SelectedNode[];
  /** Edges as pairs of absolute paths, both endpoints guaranteed in `nodes` */
  edges: Array<{ from: string; to: string }>;
  truncated: boolean;
}

/**
 * Decide which nodes and edges appear in the diagram, apply the language filter
 * and the max-node cap, and assign render-safe synthetic ids. Shared by both
 * exporters so Mermaid and DOT always depict the identical graph.
 */
function selectGraph(graph: DependencyGraph, opts: ExportOptions): Selection {
  // Candidate paths + the raw edge set, scoped or whole-graph.
  let candidatePaths: string[];
  let rawEdges: Array<{ from: string; to: string }>;

  if (opts.center !== undefined) {
    const sub = collectSubgraph(graph, opts.center, opts.depth);
    candidatePaths = [...sub.nodes.keys()];
    rawEdges = sub.edges.map((e) => ({ from: e.from, to: e.to }));
  } else {
    candidatePaths = [...graph.nodes.keys()];
    rawEdges = [];
    for (const [from, node] of graph.nodes) {
      for (const to of node.dependencies) {
        if (graph.nodes.has(to)) rawEdges.push({ from, to });
      }
    }
  }

  // Language filter.
  if (opts.language) {
    candidatePaths = candidatePaths.filter(
      (p) => graph.nodes.get(p)?.language === opts.language
    );
  }

  // Truncate to the highest-degree nodes when over the cap. Degree is the
  // global connectivity (deps + dependents), mirroring get_stats' mostConnected,
  // so the most structurally important nodes survive. Ties broken by path for
  // determinism.
  let kept = candidatePaths;
  let truncated = false;
  if (candidatePaths.length > opts.maxNodes) {
    truncated = true;
    kept = [...candidatePaths]
      .sort((a, b) => {
        const da =
          graph.nodes.get(a)!.dependencies.length +
          graph.nodes.get(a)!.dependents.length;
        const db =
          graph.nodes.get(b)!.dependencies.length +
          graph.nodes.get(b)!.dependents.length;
        if (db !== da) return db - da;
        return a.localeCompare(b);
      })
      .slice(0, opts.maxNodes);
  }

  // Assign synthetic ids in sorted-by-relativePath order (deterministic, diffable).
  const keptSet = new Set(kept);
  const ordered = kept
    .map((p) => graph.nodes.get(p)!)
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const nodes: SelectedNode[] = ordered.map((n, i) => ({
    path: n.path,
    relativePath: n.relativePath,
    language: n.language,
    id: `n${i}`,
  }));

  // Keep only edges whose both endpoints survived selection.
  const edges = rawEdges.filter(
    (e) => keptSet.has(e.from) && keptSet.has(e.to)
  );

  return { nodes, edges, truncated };
}

/** Escape a label for use inside a double-quoted Mermaid/DOT string. */
function escapeLabel(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const LANGUAGE_CLASS: Record<string, string> = {
  typescript: "ts",
  javascript: "js",
  python: "py",
  cpp: "cpp",
  arduino: "ino",
  config: "cfg",
  unknown: "unk",
};

/**
 * Render a Mermaid flowchart (`graph LR`). Node ids are synthetic; paths are in
 * labels. A small classDef per language adds optional coloring.
 */
export function exportMermaid(
  graph: DependencyGraph,
  opts: ExportOptions
): ExportResult {
  const { nodes, edges, truncated } = selectGraph(graph, opts);
  const idOf = new Map(nodes.map((n) => [n.path, n.id]));

  const lines: string[] = ["graph LR"];
  if (truncated) {
    lines.push(
      `  %% truncated: showing ${nodes.length} highest-degree nodes (cap ${opts.maxNodes})`
    );
  }

  for (const n of nodes) {
    lines.push(`  ${n.id}["${escapeLabel(n.relativePath)}"]`);
    lines.push(`  class ${n.id} ${LANGUAGE_CLASS[n.language] ?? "unk"};`);
  }
  for (const e of edges) {
    lines.push(`  ${idOf.get(e.from)} --> ${idOf.get(e.to)}`);
  }

  // classDefs (rendered even if a language is absent — harmless).
  lines.push("  classDef ts fill:#3178c6,color:#fff;");
  lines.push("  classDef js fill:#f7df1e,color:#000;");
  lines.push("  classDef py fill:#3776ab,color:#fff;");
  lines.push("  classDef cpp fill:#00599c,color:#fff;");
  lines.push("  classDef ino fill:#00979d,color:#fff;");
  lines.push("  classDef cfg fill:#6e5494,color:#fff;");
  lines.push("  classDef unk fill:#999,color:#fff;");

  return {
    format: "mermaid",
    diagram: lines.join("\n"),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    truncated,
  };
}

/**
 * Render a Graphviz DOT digraph. Synthetic ids are quoted; paths are in labels.
 * Cycles need no special handling in DOT.
 */
export function exportDot(
  graph: DependencyGraph,
  opts: ExportOptions
): ExportResult {
  const { nodes, edges, truncated } = selectGraph(graph, opts);
  const idOf = new Map(nodes.map((n) => [n.path, n.id]));

  const lines: string[] = ["digraph deps {"];
  lines.push("  rankdir=LR;");
  lines.push("  node [shape=box];");
  if (truncated) {
    lines.push(
      `  // truncated: showing ${nodes.length} highest-degree nodes (cap ${opts.maxNodes})`
    );
  }

  for (const n of nodes) {
    lines.push(`  "${n.id}" [label="${escapeLabel(n.relativePath)}"];`);
  }
  for (const e of edges) {
    lines.push(`  "${idOf.get(e.from)}" -> "${idOf.get(e.to)}";`);
  }
  lines.push("}");

  return {
    format: "dot",
    diagram: lines.join("\n"),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    truncated,
  };
}
