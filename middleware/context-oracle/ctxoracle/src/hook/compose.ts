// Whisper composer + rumor rule (Step 19, AD-19, AD-15, FR-D1/FR-D2).
// Pointer-only: paths, spans, commit hashes, symbol names and numbers — never
// verbatim repo text. Each pointer is re-resolved before speaking; one that no
// longer holds drops the candidate (`whisper_dropped_stale`).
// WALKING SKELETON: a path pointer is re-resolved by existence (and span within
// size) rather than a seek-and-read of the cited span.
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Store } from '../stores/adapter.js';
import type { Candidate } from '../types/candidate.js';

const MAX_BYTES = 1_000_000;

function normalizePath(p: string): string {
  return path.posix.normalize(p.replace(/\\/g, '/')).replace(/[\u0000-\u001f\u007f]/g, '?');
}

export function compose(
  c: Candidate,
  repoPath: string,
  store: Store,
  confidence?: number
): { text: string } | { dropped: 'whisper_dropped_stale' } {
  for (const p of c.pointers) {
    if ('commit' in p) {
      if (store.prepare('SELECT 1 AS n FROM commits WHERE hash = ?').get(p.commit) === undefined) return { dropped: 'whisper_dropped_stale' };
      continue;
    }
    const abs = path.join(repoPath, p.path);
    if (!existsSync(abs)) return { dropped: 'whisper_dropped_stale' };
    const size = statSync(abs).size;
    if (p.spanEnd !== undefined && size <= MAX_BYTES && p.spanEnd > size) return { dropped: 'whisper_dropped_stale' };
  }
  // SKELETON: G24 — the headline is built by each genre from repo paths; the
  // composer re-renders from pointers and numbers only, so no genre-written text
  // reaches the agent. The genre's headline wording is not used.
  const ptrs = c.pointers.map((p) => ('commit' in p ? p.commit.slice(0, 12) : normalizePath(p.path))).join(', ');
  const evidence =
    c.factClass === 'mined' && c.support !== undefined
      ? c.ratio !== undefined && c.ratio > 0
        ? ` (${c.support} co-changes, ratio ${c.ratio.toFixed(2)})`
        : ` (support ${c.support})`
      : '';
  const flag = c.hazard || (confidence !== undefined && confidence < 0.8) ? ' [confidence: uncertain]' : '';
  return { text: `[oracle] ${c.hazard ? '⚠ ' : ''}${c.genre}: ${ptrs}${evidence}${flag}` };
}
