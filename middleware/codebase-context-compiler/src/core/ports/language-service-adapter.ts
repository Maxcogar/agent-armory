/**
 * Optional LSP enrichment port (Architecture D6, Spec FR2/FR6). Not required
 * for indexing; when absent the structural map still stands.
 */
import type { EdgeRecord, CapabilityGap } from '../domain/repository-map.js';

export interface LanguageServiceAdapter {
  readonly name: string;
  available(): Promise<boolean>;
  /** Enrich the graph with semantic references/definitions when possible. */
  enrich(snapshotId: string, root: string): Promise<{
    edges: Omit<EdgeRecord, 'snapshot_id'>[];
    gaps: Omit<CapabilityGap, 'adapter'>[];
  }>;
}
