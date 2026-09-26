// Shared candidate + tuning types (Step 6, AD-14, AD-12; reopened 2026-09-26
// build delta, G18). Type-only (erased at build), declared ahead of the genre
// modules (Step 18) and the bar/dedup/composer that consume them.

import type { Trust } from '../security/trust.js';
import type { Headline } from './headline.js';

/** A location a candidate points at: a file span, or a commit. */
export type Pointer =
  | { kind: 'file'; fileId: number; path: string; spanStart?: number; spanEnd?: number }
  | { kind: 'commit'; hash: string };

/** Where a candidate's fact came from — the AD-14 combinator carries no genre term. */
export type FactClass = 'mined' | 'structural' | 'human';

/** A `files.zone` value — mirrors the DB CHECK of Step 7. */
export type Zone = 'source' | 'generated' | 'vendored' | 'build_output' | 'unknown';

/** A ratio as raw counts (AD-14's display rule) or recency-weighted sums (AD-13). */
export interface Ratio {
  num: number;
  den: number;
}

/**
 * One genre's proposed whisper before the bar, dedup, and composer act on it.
 * Every field is required (G18): a genre states each property, so no consumer
 * reads an absent one as a default.
 */
export interface Candidate {
  genre: string;
  subjectKey: string;
  /** Read-set keys that make it self-served (AD-16, G25). */
  incorporatedBy: string[];
  factClass: FactClass;
  /** Coupling's same-directory same-stem pair; false elsewhere (AC-1). */
  obvious: boolean;
  crossFile: boolean;
  /** Declared per genre in its module header (G18d). */
  comparative: boolean;
  pointers: Pointer[];
  support: number | null;
  /** The ratio the headline states — raw counts (AD-14's display rule). */
  evidence: Ratio | null;
  /** `pair_weight / change_weight` (AD-13); non-null exactly when `evidence` is a pair ratio. */
  weightedEvidence: Ratio | null;
  /** Display and audit only; no confidence term reads it. */
  lastTs: number | null;
  hazard: boolean;
  trust: Trust;
  injectionSuspect: boolean;
  /** A `symbol_refs`-derived count — AD-14's heuristic cap. */
  heuristic: boolean;
  context: 'edit' | 'read';
  blastRadius: number;
  zone: Zone;
  headline: Headline;
  evidenceJson: string;
}

/**
 * Read side of the tuning table (Step 12's `tuningReader` builds it, bound to
 * `(globalStore, repoKey)`): the project row before the NULL row; a missing key
 * is re-seeded and recorded as `tuning_missing`. `num` parses a finite number or
 * throws; `list` returns the member rows of a list key.
 */
export interface TuningReader {
  num(key: string): number;
  str(key: string): string;
  list(key: string): string[];
}
