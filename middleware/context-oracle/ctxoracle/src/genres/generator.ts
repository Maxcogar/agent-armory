// The Generator seam every genre implements (Step 18, AD-15).
// SKELETON: G8 — genres read tuning, which lives in the global store; the plan's
// `candidates(ctx, store)` takes only the project store, so a TuningReader is
// passed as well.
import type { Store } from '../stores/adapter.js';
import type { EventContext, EventKind } from '../types/events.js';
import type { Candidate, TuningReader } from '../types/candidate.js';

export interface Generator {
  readonly genre: string;
  readonly triggerEvents: EventKind[];
  // SKELETON: 1R — `tuning` is Step 6's `TuningReader` ({num, str, list});
  // retired by Step 18
  candidates(ctx: EventContext, store: Store, tuning: TuningReader): Candidate[];
}

/** Shared lookup: the co-change partners of `path`, with their paths. */
export function partnersOfPath(store: Store, path: string): { path: string; pairCount: number; aCount: number; lastTs: number }[] {
  // SKELETON: 1R — stands in for the partner lookup; the pair query named the
  // removed `a_count`/`b_count` columns and is removed (Step 7 schema); retired
  // by Step 18
  void store;
  void path;
  return [];
}

/** Same directory + same stem: the obvious pair AC-1 suppresses (AD-14 marginal value). */
export function obviousPair(a: string, b: string): boolean {
  const dir = (p: string): string => p.slice(0, p.lastIndexOf('/') + 1);
  const stem = (p: string): string => p.slice(p.lastIndexOf('/') + 1).replace(/(\.test|\.spec)?\.[^.]+$/, '');
  return dir(a) === dir(b) && stem(a) === stem(b);
}
