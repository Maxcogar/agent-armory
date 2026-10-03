// Whisper composer + rumor rule (Step 19, AD-19, AD-15, FR-D1/FR-D2).
// Pointer-only: paths, spans, commit hashes, symbol names and numbers — never
// verbatim repo text. Each pointer is re-resolved before speaking; one that no
// longer holds drops the candidate (`whisper_dropped_unverifiable`, with the
// drop reason).
// WALKING SKELETON, reduced at Checkpoint 1R (plan §9): the composer is not
// built; the body below is a Checkpoint 1R stand-in.
import type { Store } from '../stores/adapter.js';
import type { Candidate } from '../types/candidate.js';

export function compose(
  c: Candidate,
  repoPath: string,
  store: Store,
  confidence?: number
): { text: string } | { dropped: 'stale_pointer' } {
  // SKELETON: 1R — stands in for the pointer-only composer over Step 6's
  // Candidate and structured Headline; unreachable while every generator returns
  // []; the `whisper_dropped_stale` result is removed; retired by Step 19
  void c;
  void repoPath;
  void store;
  void confidence;
  return { dropped: 'stale_pointer' };
}
