/**
 * Repository map domain types (Spec FR1, FR18; Architecture D4/D5).
 *
 * A RepositorySnapshot pins the map to a specific repository state (FR18) so a
 * package generated before a change can never be mistaken for one generated
 * after it. Facts are immutable per snapshot (Architecture "Core conventions").
 */
export interface RepositorySnapshot {
  snapshot_id: string;
  repo_name: string;
  root: string;
  /** Git commit hash when available, else null. */
  revision: string | null;
  /** True when the working tree has uncommitted changes (or is non-git). */
  dirty_state: boolean;
  created_at: string;
}

export interface FileRecord {
  snapshot_id: string;
  path: string;
  language: string | null;
  /** sha256 of file contents — drives staleness detection (FR19). */
  content_hash: string;
  size_bytes: number;
  /** Inferred role boundary (Spec FR21): source | test | config | generated | vendor | doc | unknown. */
  boundary: FileBoundary;
}

export type FileBoundary =
  | 'source'
  | 'test'
  | 'config'
  | 'generated'
  | 'vendor'
  | 'doc'
  | 'unknown';

export type SymbolKind =
  | 'function'
  | 'method'
  | 'class'
  | 'interface'
  | 'type'
  | 'variable'
  | 'constant'
  | 'component'
  | 'route'
  | 'export'
  | 'unknown';

export interface SymbolRecord {
  snapshot_id: string;
  name: string;
  kind: SymbolKind;
  path: string;
  start_line: number;
  end_line: number;
  /** Whether the symbol is exported from its module. */
  exported: boolean;
}

/** A directed relationship between two files (and optionally symbols). */
export type EdgeKind =
  | 'imports'
  | 'exports'
  | 'references'
  | 'calls'
  | 'defines'
  | 'tests'
  | 'configures'
  | 'renders';

export interface EdgeRecord {
  snapshot_id: string;
  from_path: string;
  to_path: string;
  kind: EdgeKind;
  /** Symbol involved, when the edge is symbol-specific (e.g. an imported name). */
  symbol: string | null;
  /** Source line of the relationship in from_path, when known. */
  from_line: number | null;
}

/** Reported capability gap from an adapter (Architecture "Core conventions"). */
export interface CapabilityGap {
  adapter: string;
  path: string;
  reason: string;
}
