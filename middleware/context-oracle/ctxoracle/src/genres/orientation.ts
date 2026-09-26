// Orientation (FR-A2a, AD-15): on a prompt, the entry-point files its words
// point at. WALKING SKELETON, reduced at
// Checkpoint 1R (plan §9 placeholder rule 1): the generator returns no
// candidates until Step 18 builds it.
import type { Generator } from './generator.js';

export const orientationGenerator: Generator = {
  genre: 'orientation',
  triggerEvents: ['UserPromptSubmit'],
  candidates() {
    // SKELETON: 1R — stands in for the orientation generator over Step 6's Candidate (no
    // string headline, no a_count read); retired by Step 18
    return [];
  },
};
