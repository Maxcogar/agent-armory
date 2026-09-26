// The one search interface (Step 14, AD-2, D-plan-28): FTS5 MATCH when the store's
// fts_state is 'fts5', indexed LIKE otherwise; same result shape either way.
import type { Store } from '../stores/adapter.js';

export interface SymbolHit {
  name: string;
  kind: string;
  fileId: number;
}
export interface PathHit {
  path: string;
  fileId: number;
}

export function symbolSearch(store: Store, terms: string[]): SymbolHit[] {
  // SKELETON: 1R — the skeleton's FTS body queried fts_symbols' pre-1R `name`
  // column, which migration 001b no longer defines; its LIKE body still ran but
  // is not AD-2's fallback (the symbol_tokens range path). Both are reduced to
  // []; no caller remains at 1R (plan §9, Steps 1-12 build review M1); retired
  // by Step 14
  void store;
  void terms;
  return [];
}

export function pathSearch(store: Store, terms: string[]): PathHit[] {
  // SKELETON: 1R — the skeleton's FTS body queried fts_paths' pre-1R `path`
  // column, which migration 001b no longer defines; its LIKE body is not AD-2's
  // fallback (the path_tokens range path). Both are reduced to []; no caller
  // remains at 1R (plan §9, Steps 1-12 build review M1); retired by Step 14
  void store;
  void terms;
  return [];
}
