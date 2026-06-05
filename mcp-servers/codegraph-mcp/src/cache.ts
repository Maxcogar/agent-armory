import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as crypto from "crypto";
import { DependencyGraph, FileNode, DocNode, ParseError } from "./types.js";

// ============================================================
// On-disk graph cache
// ============================================================
//
// The graph is persisted between sessions so a re-scan can reuse parse results
// for unchanged files (see incrementalUpdate). Two correctness rules:
//   1. `nodes` and `docNodes` are Maps, which JSON.stringify drops silently —
//      they are serialized as entry arrays and rebuilt on load.
//   2. The cache carries a schemaVersion. On any mismatch the cache is ignored
//      (treated as absent), never deserialized into a stale-shaped graph.
//
// The cache lives OUTSIDE the scanned project (keyed by a hash of the root
// path), so scanning an arbitrary repo never writes a file into it. Override
// the location with CODEGRAPH_CACHE_DIR.

/** Bump whenever the serialized graph shape changes. */
// v2: FileNode gained optional imports/isTest (tree-sitter import edges).
// v3: FileNode.symbols now populated (symbol layer) — force rebuild to fill it.
export const SCHEMA_VERSION = 3;

interface SerializedGraph {
  schemaVersion: number;
  rootDir: string;
  builtAt: number;
  totalFiles: number;
  parseErrors: ParseError[];
  nodes: Array<[string, FileNode]>;
  docNodes: Array<[string, DocNode]>;
}

export function cacheDir(): string {
  if (process.env.CODEGRAPH_CACHE_DIR) return process.env.CODEGRAPH_CACHE_DIR;
  const base = os.homedir() || os.tmpdir();
  return path.join(base, ".cache", "codegraph-mcp");
}

export function cacheFilePathFor(rootDir: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(path.resolve(rootDir))
    .digest("hex")
    .slice(0, 16);
  return path.join(cacheDir(), `${hash}.json`);
}

export function serializeGraph(graph: DependencyGraph): SerializedGraph {
  return {
    schemaVersion: SCHEMA_VERSION,
    rootDir: graph.rootDir,
    builtAt: graph.builtAt,
    totalFiles: graph.totalFiles,
    parseErrors: graph.parseErrors,
    nodes: [...graph.nodes.entries()],
    docNodes: [...graph.docNodes.entries()],
  };
}

/**
 * Rebuild a DependencyGraph from parsed cache JSON, or return null if the data
 * is missing/invalid or its schemaVersion does not match. Never throws.
 */
export function deserializeGraph(data: unknown): DependencyGraph | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Partial<SerializedGraph>;
  if (d.schemaVersion !== SCHEMA_VERSION) return null;
  if (!Array.isArray(d.nodes) || !Array.isArray(d.docNodes)) return null;
  if (typeof d.rootDir !== "string") return null;

  return {
    rootDir: d.rootDir,
    builtAt: typeof d.builtAt === "number" ? d.builtAt : Date.now(),
    totalFiles: typeof d.totalFiles === "number" ? d.totalFiles : d.nodes.length,
    parseErrors: Array.isArray(d.parseErrors) ? d.parseErrors : [],
    nodes: new Map(d.nodes),
    docNodes: new Map(d.docNodes),
  };
}

export function saveCache(graph: DependencyGraph): void {
  const file = cacheFilePathFor(graph.rootDir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(serializeGraph(graph)));
}

/** Load a cached graph for `rootDir`, or null if absent/unreadable/stale. */
export function loadCache(rootDir: string): DependencyGraph | null {
  const file = cacheFilePathFor(rootDir);
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf-8");
  } catch {
    return null;
  }
  try {
    return deserializeGraph(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearCache(rootDir: string): void {
  try {
    fs.rmSync(cacheFilePathFor(rootDir));
  } catch {
    // absent: nothing to do
  }
}
