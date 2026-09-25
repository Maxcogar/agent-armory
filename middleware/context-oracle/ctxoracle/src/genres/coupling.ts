// Coupling (FR-A2b, AD-15): on a Read/Grep/Glob, the touched file's co-change
// partners. WALKING SKELETON.
import type { Generator } from './generator.js';
import { partnersOfPath, obviousPair } from './generator.js';

export const couplingGenerator: Generator = {
  genre: 'coupling',
  triggerEvents: ['PostToolUse'],
  candidates(ctx, store) {
    if (ctx.targetPath === undefined || !['Read', 'Grep', 'Glob'].includes(ctx.toolName ?? '')) return [];
    const target = ctx.targetPath;
    return partnersOfPath(store, target)
      .filter((p) => !obviousPair(target, p.path))
      .map((p) => ({
        genre: 'coupling',
        subjectKey: `coupling:${target}:${p.path}`,
        factClass: 'mined' as const,
        pointers: [{ path: p.path }],
        support: p.pairCount,
        // SKELETON: G3 — with the Step 9 stand-in a_count equals pair_count, so
        // this ratio is always 1.0 and the confidence floor never filters.
        ratio: p.aCount > 0 ? p.pairCount / p.aCount : 0,
        lastTs: p.lastTs,
        hazard: false,
        headline: `${p.path} changed together with ${target} in ${p.pairCount} of its last ${p.aCount} changes`,
        evidenceJson: JSON.stringify({ target, partner: p.path, pairCount: p.pairCount, aCount: p.aCount }),
        context: 'read' as const,
        blastRadius: 2,
        crossFile: true,
        trust: 'untrusted_repo' as const,
      }));
  },
};
