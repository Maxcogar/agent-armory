// Warning ⚠ (FR-A2e, FR-A5a, AD-15): landmines on the edit target, flagged hazard
// so the bar applies the noise floor only. WALKING SKELETON, reduced at
// Checkpoint 1R (plan §9 placeholder rule 1): the generator returns no
// candidates until Step 18 builds it.
import type { Generator } from './generator.js';

export const warningGenerator: Generator = {
  genre: 'warning',
  triggerEvents: ['PreToolUse'],
  candidates() {
    // SKELETON: 1R — stands in for the warning generator over Step 6's Candidate (no
    // string headline, no a_count read); retired by Step 18
    return [];
  },
};
