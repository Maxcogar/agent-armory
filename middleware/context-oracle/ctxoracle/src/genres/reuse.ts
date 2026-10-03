// Reuse (FR-A2c, AD-15, L6): the dominant symbol among a search's matches.
// WALKING SKELETON: `symbol_refs` is not produced by the indexer yet (G11), so no
// candidate set is comparable and the genre stays silent — the same silence the
// incomparable-set rule prescribes.
import type { Generator } from './generator.js';

export const reuseGenerator: Generator = {
  genre: 'reuse',
  triggerEvents: ['PostToolUse'],
  candidates() {
    // SKELETON: 1R — stands in for the reuse generator over Step 6's Candidate (no
    // string headline, no a_count read); retired by Step 18
    return [];
  },
};
