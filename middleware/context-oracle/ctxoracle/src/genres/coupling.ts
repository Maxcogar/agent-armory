// Coupling (FR-A2b, AD-15): on a Read/Grep/Glob, the touched file's co-change
// partners. WALKING SKELETON, reduced at
// Checkpoint 1R (plan §9 placeholder rule 1): the generator returns no
// candidates until Step 18 builds it.
import type { Generator } from './generator.js';

export const couplingGenerator: Generator = {
  genre: 'coupling',
  triggerEvents: ['PostToolUse'],
  candidates() {
    // SKELETON: 1R — stands in for the coupling generator over Step 6's Candidate (no
    // string headline, no a_count read); retired by Step 18
    return [];
  },
};
