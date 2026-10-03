// SessionEnd fold (Step 30, AD-5, AD-26): the project's whisper_audit and
// corrections rows newer than the project store's seq watermarks are folded into
// a stats_folds row per genre, and the project's totals replace its rows in the
// global whisper_stats replica. WALKING SKELETON, reduced at Checkpoint 1R.
import type { Store } from '../stores/adapter.js';

export function foldWhisperStats(global: Store, project: Store, repoKey: string): { folded: number } {
  // SKELETON: 1R — stands in for the fold; the skeleton body wrote the removed
  // `window_start`/`window_end` columns of migration 002 (the Step 9 DAO's
  // removed `upsertFold` shape) and is removed; retired by Step 30
  void global;
  void project;
  void repoKey;
  return { folded: 0 };
}
