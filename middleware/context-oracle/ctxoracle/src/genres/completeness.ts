// Completeness (FR-A2f, AD-15): at Stop, the partners of the session's edited
// files that were not edited. WALKING SKELETON.
import type { Generator } from './generator.js';
import { partnersOfPath, obviousPair } from './generator.js';
import { observedActionsDao } from '../stores/dao/observed_actions.js';

export const completenessGenerator: Generator = {
  genre: 'completeness',
  triggerEvents: ['Stop'],
  candidates(ctx, store) {
    // SKELETON: G22 — ObservedActionsReader exposes counts only; the edited-file
    // list comes from the DAO's pathWrites.
    const edited = new Set(observedActionsDao(store).pathWrites(ctx.session, 0));
    const out = [];
    for (const e of edited) {
      for (const p of partnersOfPath(store, e)) {
        if (edited.has(p.path) || obviousPair(e, p.path)) continue;
        out.push({
          genre: 'completeness',
          subjectKey: `completeness:${e}:${p.path}`,
          factClass: 'mined' as const,
          pointers: [{ path: p.path }],
          support: p.pairCount,
          ratio: p.aCount > 0 ? p.pairCount / p.aCount : 0,
          lastTs: p.lastTs,
          hazard: false,
          headline: `${e} was edited; ${p.path} usually changes with it (${p.pairCount} of ${p.aCount}) and was not touched`,
          evidenceJson: JSON.stringify({ edited: e, partner: p.path }),
          context: 'edit' as const,
          crossFile: true,
          trust: 'untrusted_repo' as const,
        });
      }
    }
    return out;
  },
};
