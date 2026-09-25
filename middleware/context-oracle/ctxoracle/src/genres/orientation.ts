// Orientation (FR-A2a, AD-15): on a prompt, the entry-point files its words
// point at. WALKING SKELETON: ranks by match count × entry_score only (no hub
// degree, no invariants).
import type { Generator } from './generator.js';
import { symbolSearch, pathSearch } from '../index/search.js';

export const orientationGenerator: Generator = {
  genre: 'orientation',
  triggerEvents: ['UserPromptSubmit'],
  candidates(ctx, store) {
    const words = (ctx.promptText ?? '').toLowerCase().match(/[a-z_][a-z0-9_]{3,}/g) ?? [];
    if (words.length === 0) return [];
    const score = new Map<number, number>();
    for (const h of [...symbolSearch(store, words), ...pathSearch(store, words)]) score.set(h.fileId, (score.get(h.fileId) ?? 0) + 1);
    const ranked = [...score.entries()]
      .map(([id, s]) => {
        const f = store.prepare('SELECT path, entry_score FROM files WHERE id = ?').get(id) as { path: string; entry_score: number };
        return { path: f.path, rank: s * (1 + f.entry_score) };
      })
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 4);
    if (ranked.length < 2) return [];
    return [
      {
        genre: 'orientation',
        subjectKey: `orientation:${ranked.map((r) => r.path).join(',')}`,
        factClass: 'structural' as const,
        pointers: ranked.map((r) => ({ path: r.path })),
        hazard: false,
        headline: `entry points for this task: ${ranked.map((r) => r.path).join(', ')}`,
        evidenceJson: JSON.stringify(ranked),
        context: 'read' as const,
        blastRadius: ranked.length,
        crossFile: true,
        comparative: true,
        support: 3,
        ratio: 1,
      },
    ];
  },
};
