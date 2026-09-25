// Warning ⚠ (FR-A2e, FR-A5a, AD-15): landmines on the edit target, flagged hazard
// so the bar applies the noise floor only. WALKING SKELETON.
import type { Generator } from './generator.js';

export const warningGenerator: Generator = {
  genre: 'warning',
  triggerEvents: ['PreToolUse'],
  candidates(ctx, store) {
    if (ctx.targetPath === undefined || !['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(ctx.toolName ?? '')) return [];
    const rows = store
      .prepare('SELECT l.kind, l.evidence, l.support FROM landmines l JOIN files f ON f.id = l.file_id WHERE f.path = ?')
      .all(ctx.targetPath) as { kind: string; evidence: string; support: number | null }[];
    return rows.map((r) => ({
      genre: 'warning',
      subjectKey: `warning:${r.kind}:${ctx.targetPath}`,
      factClass: 'mined' as const,
      pointers: [{ path: ctx.targetPath as string }],
      support: r.support ?? 0,
      hazard: true,
      headline: `⚠ ${ctx.targetPath}: ${r.kind === 'revert_chain' ? 'reverted repeatedly' : r.kind === 'fix_chatter' ? 'fixed repeatedly in the last 90 days' : 'owner-stated hazard'} (support ${r.support ?? 0}; confidence: uncertain)`,
      evidenceJson: JSON.stringify(r),
      context: 'edit' as const,
      crossFile: true,
      trust: 'untrusted_repo' as const,
    }));
  },
};
