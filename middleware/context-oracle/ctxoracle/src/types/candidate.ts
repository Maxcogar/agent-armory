// Shared candidate + tuning types (Step 6, AD-14, AD-12). Type-only (erased at
// build), declared ahead of the genre modules (Step 18) and the bar/dedup/
// composer that consume them.

/** A location a candidate points at: a file span, or a commit. */
export type Pointer = { path: string; spanStart?: number; spanEnd?: number } | { commit: string };

/** Where a candidate's fact came from — the AD-14 combinator carries no genre term. */
export type FactClass = 'mined' | 'structural' | 'human';

/**
 * One genre's proposed whisper before the bar, dedup, and composer act on it.
 * `evidenceJson` is the serialized evidence the audit records; `headline` is the
 * human-facing line; `hazard` marks a warning-class candidate.
 */
export interface Candidate {
  genre: string;
  subjectKey: string;
  factClass: FactClass;
  pointers: Pointer[];
  support?: number;
  ratio?: number;
  lastTs?: number;
  hazard: boolean;
  headline: string;
  evidenceJson: string;
}

/**
 * Read side of the tuning table (Step 12 builds the concrete `TuningReader`,
 * which re-seeds a missing key and records `tuning_missing`). `get` returns a
 * single value; `list` returns the values recorded under a key.
 */
export interface TuningReader {
  get(key: string): string | undefined;
  list(key: string): string[];
}
