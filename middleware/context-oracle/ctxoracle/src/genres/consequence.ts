// Consequence (FR-A2d, AD-15): the tests coupled to an edit target.
// WALKING SKELETON: `test_map` is not produced by the indexer yet (G11), so this
// generator has no input and returns nothing.
import type { Generator } from './generator.js';

export const consequenceGenerator: Generator = {
  genre: 'consequence',
  triggerEvents: ['PreToolUse'],
  candidates() {
    // SKELETON: 1R — stands in for the consequence generator over Step 6's Candidate (no
    // string headline, no a_count read); retired by Step 18
    return [];
  },
};
