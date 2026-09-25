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
  candidates(ctx: EventContext, store: Store, tuning: TuningReader): Candidate[];
}

/** Shared lookup: the co-change partners of `path`, with their paths. */
export function partnersOfPath(store: Store, path: string): { path: string; pairCount: number; aCount: number; lastTs: number }[] {
  const f = store.prepare('SELECT id FROM files WHERE path = ?').get(path) as { id: number } | undefined;
  if (f === undefined) return [];
  return (
    store
      .prepare(
        `SELECT CASE WHEN p.a = ? THEN fb.path ELSE fa.path END AS path, p.pair_count AS pairCount,
                CASE WHEN p.a = ? THEN p.a_count ELSE p.b_count END AS aCount, p.last_ts AS lastTs
           FROM cochange_pairs p JOIN files fa ON fa.id = p.a JOIN files fb ON fb.id = p.b
          WHERE p.a = ? OR p.b = ? ORDER BY p.pair_count DESC`
      )
      .all(f.id, f.id, f.id, f.id) as { path: string; pairCount: number; aCount: number; lastTs: number }[]
  );
}

/** Same directory + same stem: the obvious pair AC-1 suppresses (AD-14 marginal value). */
export function obviousPair(a: string, b: string): boolean {
  const dir = (p: string): string => p.slice(0, p.lastIndexOf('/') + 1);
  const stem = (p: string): string => p.slice(p.lastIndexOf('/') + 1).replace(/(\.test|\.spec)?\.[^.]+$/, '');
  return dir(a) === dir(b) && stem(a) === stem(b);
}
