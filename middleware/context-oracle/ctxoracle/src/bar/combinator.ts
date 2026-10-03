// The bar (Step 16, AD-14): a conjunction of three floors — confidence,
// decision-impact, marginal value — with no multiplication, no caps, and the
// hazard bypass on the confidence floor only (FR-A5, FR-A5a, OL-C1, D-18).
//
// WALKING SKELETON (2026-09-25), reduced at Checkpoint 1R (plan §9): the axes
// are not built; both functions below are Checkpoint 1R stand-ins.
import type { Candidate, TuningReader } from '../types/candidate.js';

export type Axis = 'confidence' | 'impact' | 'marginal';

/** Confidence per fact class (AD-14). */
export function confidenceOf(c: Candidate, t: TuningReader, ctx: { indexStale: boolean; historyStale: boolean }): number {
  // SKELETON: 1R — stands in for AD-14's confidence (the skeleton's body read the
  // removed `Candidate.ratio` and `TuningReader.get`); unreachable while every
  // generator returns []; retired by Step 16
  void c;
  void t;
  void ctx;
  return 0;
}

export function passesBar(
  c: Candidate,
  t: TuningReader,
  ctx: { indexStale: boolean; historyStale: boolean }
): { passes: boolean; failedAxis?: Axis; confidence: number; tier: 'high' | 'uncertain' } {
  // SKELETON: 1R — stands in for AD-14's conjunction of the three floors over
  // Step 6's Candidate; unreachable while every generator returns []; retired by
  // Step 16
  void c;
  void t;
  void ctx;
  return { passes: false, failedAxis: 'confidence', confidence: 0, tier: 'uncertain' };
}
