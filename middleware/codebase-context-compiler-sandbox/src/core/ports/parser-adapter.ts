/**
 * Parser adapter port (Architecture D5). Tree-sitter is the baseline impl.
 * Adapters may be incomplete but MUST report capability gaps (Core conventions).
 */
import type { SymbolRecord, EdgeRecord, CapabilityGap } from '../domain/repository-map.js';

export interface ParseInput {
  snapshotId: string;
  path: string;
  content: string;
}

export interface ParseOutput {
  /** Symbols without snapshot_id (the indexer stamps it). */
  symbols: Omit<SymbolRecord, 'snapshot_id'>[];
  /** Edges without snapshot_id; to_path may be an unresolved import specifier. */
  edges: Omit<EdgeRecord, 'snapshot_id'>[];
  gaps: Omit<CapabilityGap, 'adapter'>[];
}

export interface ParserAdapter {
  readonly name: string;
  /** File extensions this adapter handles, e.g. ['.ts', '.tsx']. */
  readonly extensions: string[];
  parse(input: ParseInput): Promise<ParseOutput>;
}
