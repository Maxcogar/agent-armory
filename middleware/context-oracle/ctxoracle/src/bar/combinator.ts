// The bar (Step 16, AD-14): a conjunction of three floors — confidence,
// decision-impact, marginal value — with no multiplication, no caps, and the
// hazard bypass on the confidence floor only (FR-A5, FR-A5a, OL-C1, D-18).
//
// WALKING SKELETON (2026-09-25): the axes read the provisional candidate fields
// of G18; `ageRef` stands in for Step 13's reference instant (see G19).
import type { Candidate, TuningReader } from '../types/candidate.js';

export type Axis = 'confidence' | 'impact' | 'marginal';

const DAY_S = 86_400;

function n(t: TuningReader, key: string, fallback: number): number {
  const v = Number(t.get(key));
  return Number.isFinite(v) ? v : fallback;
}

/** Confidence per fact class (AD-14): mined = ratio × recency × staleness, capped
 *  by trust; human = high by construction. */
export function confidenceOf(c: Candidate, t: TuningReader, ctx: { indexStale: boolean; refTs: number }): number {
  if (c.factClass === 'human') return 1;
  let conf = c.ratio ?? 0;
  if (c.lastTs !== undefined) {
    const ageDays = Math.max(0, (ctx.refTs - c.lastTs) / DAY_S);
    conf *= 0.5 ** (ageDays / n(t, 'bar.recency_half_life_days', 365));
  }
  if (ctx.indexStale) conf *= n(t, 'bar.stale_index_factor', 0.8);
  // SKELETON: G20 — "capped by trust (untrusted_repo can never yield
  // high-confidence)": no cap value is written anywhere. The skeleton applies
  // none, since every Phase A mined fact is untrusted_repo and any cap below the
  // 0.6 floor would silence every history genre.
  return conf;
}

export function passesBar(
  c: Candidate,
  t: TuningReader,
  ctx: { indexStale: boolean; refTs: number }
): { passes: boolean; failedAxis?: Axis } {
  const support = c.support ?? 0;
  // Confidence — hazards skip it and need only the noise floor.
  if (c.hazard) {
    if (support < n(t, 'bar.noise_floor_support_min', 2)) return { passes: false, failedAxis: 'confidence' };
  } else if (c.factClass !== 'human') {
    if (support < n(t, 'bar.support_min', 3) || confidenceOf(c, t, ctx) < n(t, 'bar.confidence_floor', 0.6))
      return { passes: false, failedAxis: 'confidence' };
  }
  // Decision-impact — edit context always; read context needs the blast-radius band.
  if (c.context !== 'edit' && (c.blastRadius ?? 0) < n(t, 'bar.impact_read_min_coupled', 2))
    return { passes: false, failedAxis: 'impact' };
  // Marginal value — single-file current-state fails; cross-file history passes;
  // cross-file current-state passes only when comparative.
  if (c.factClass === 'structural' && !c.crossFile) return { passes: false, failedAxis: 'marginal' };
  if (c.factClass === 'structural' && c.crossFile && !c.comparative) return { passes: false, failedAxis: 'marginal' };
  return { passes: true };
}
