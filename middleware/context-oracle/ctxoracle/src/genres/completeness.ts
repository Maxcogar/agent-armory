// Completeness (FR-A2f, AD-15): at Stop, the partners of the session's edited
// files that were not edited. WALKING SKELETON, reduced at
// Checkpoint 1R (plan §9 placeholder rule 1): the generator returns no
// candidates until Step 18 builds it.
import type { Generator } from './generator.js';

export const completenessGenerator: Generator = {
  genre: 'completeness',
  triggerEvents: ['Stop'],
  candidates() {
    // SKELETON: 1R — stands in for the completeness generator over Step 6's Candidate (no
    // string headline, no a_count read); retired by Step 18
    return [];
  },
};
