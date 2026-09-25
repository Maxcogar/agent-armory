// Consequence (FR-A2d, AD-15): the tests coupled to an edit target.
// WALKING SKELETON: `test_map` is not produced by the indexer yet (G11), so this
// generator has no input and returns nothing.
import type { Generator } from './generator.js';

export const consequenceGenerator: Generator = {
  genre: 'consequence',
  triggerEvents: ['PreToolUse'],
  candidates() {
    return [];
  },
};
