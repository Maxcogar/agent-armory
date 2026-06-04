/**
 * Relationship-based context expansion (Spec FR5, Architecture D12 step 6).
 *
 * Expansion follows code relationships (imports, imported-by, tests), NOT
 * keyword/embedding similarity. Each related file carries the evidence (edge)
 * that justified its inclusion, so a reviewer can audit why it is present
 * (FR20/NFR1). Lexical search is available separately as ONE evidence source,
 * never the selection driver (D12 step 5).
 */
import type { Storage } from '../ports/storage.js';
import type { EvidenceRef } from '../domain/evidence.js';
import type { EdgeKind, FileBoundary } from '../domain/repository-map.js';

export interface RelatedFile {
  path: string;
  boundary: FileBoundary;
  depth: number;
  /** Human-readable relevance reasons (FR20). */
  reasons: string[];
  evidence: EvidenceRef[];
}

export interface ExpansionResult {
  /** Seed files that actually exist in the snapshot. */
  seeds: string[];
  related: RelatedFile[];
}

export interface ExpandOptions {
  maxDepth?: number;
  maxFiles?: number;
}

const DEPENDENCY_EDGES: EdgeKind[] = ['imports', 'references', 'calls', 'renders', 'tests', 'configures'];

export function expandContext(
  storage: Storage,
  snapshotId: string,
  seedPaths: string[],
  opts: ExpandOptions = {},
): ExpansionResult {
  const maxDepth = opts.maxDepth ?? 2;
  const maxFiles = opts.maxFiles ?? 40;

  const seeds = seedPaths.filter((p) => storage.getFile(snapshotId, p) !== null);
  const seedSet = new Set(seeds);
  const acc = new Map<string, RelatedFile>();
  const queue: Array<{ path: string; depth: number }> = seeds.map((p) => ({ path: p, depth: 0 }));
  const visited = new Set<string>(seeds);

  const addRelation = (from: string, to: string, depth: number, reason: string, ev: EvidenceRef) => {
    if (seedSet.has(to)) return; // a seed is never its own related file
    const file = storage.getFile(snapshotId, to);
    if (!file) return; // never include a file that does not exist
    let rec = acc.get(to);
    if (!rec) {
      rec = { path: to, boundary: file.boundary, depth, reasons: [], evidence: [] };
      acc.set(to, rec);
    }
    rec.depth = Math.min(rec.depth, depth);
    if (!rec.reasons.includes(reason)) rec.reasons.push(reason);
    rec.evidence.push(ev);
  };

  while (queue.length) {
    const { path, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;

    // Outgoing dependencies: `path` depends on `to`.
    for (const e of storage.outgoingEdges(snapshotId, path, DEPENDENCY_EDGES)) {
      if (storage.getFile(snapshotId, e.to_path) === null) continue; // external dep
      addRelation(path, e.to_path, depth + 1,
        `${edgeReason(e.kind)} by ${path}${e.symbol ? ` (uses ${e.symbol})` : ''}`,
        evidenceFor(e.from_path, e.symbol, e.from_line, e.kind));
      if (!visited.has(e.to_path)) { visited.add(e.to_path); queue.push({ path: e.to_path, depth: depth + 1 }); }
    }

    // Incoming dependencies: `from` depends on `path` (callers / dependents).
    for (const e of storage.incomingEdges(snapshotId, path, DEPENDENCY_EDGES)) {
      const fromFile = storage.getFile(snapshotId, e.from_path);
      if (!fromFile) continue;
      const reason = fromFile.boundary === 'test'
        ? `test that exercises ${path}`
        : `depends on ${path}${e.symbol ? ` (uses ${e.symbol})` : ''}`;
      addRelation(path, e.from_path, depth + 1, reason,
        evidenceFor(e.from_path, e.symbol, e.from_line, fromFile.boundary === 'test' ? 'tests' : e.kind));
      if (!visited.has(e.from_path)) { visited.add(e.from_path); queue.push({ path: e.from_path, depth: depth + 1 }); }
    }
  }

  const related = [...acc.values()]
    .sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path))
    .slice(0, maxFiles);

  return { seeds, related };
}

function evidenceFor(path: string, symbol: string | null, line: number | null, relationship: string): EvidenceRef {
  return { source_type: 'file', path, symbol, start_line: line, end_line: line, relationship };
}

function edgeReason(kind: EdgeKind): string {
  if (kind === 'imports') return 'imported';
  if (kind === 'references') return 'referenced';
  if (kind === 'configures') return 'configured';
  return kind;
}
