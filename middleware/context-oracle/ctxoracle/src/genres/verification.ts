// Verification / completion check (FR-A2g, AD-15, D-38) and the done-claim
// recognizer. WALKING SKELETON: the recognizer is built as specified; the
// generator reports covering tests from `test_map`, which the indexer does not
// produce yet (G11), so it finds nothing to say.
import type { Generator } from './generator.js';

const NEGATION = /\b(not|never|isn't|haven't|wasn't)\b|n't\b/i;

export function recognizeDoneClaim(lastAssistantMessage: string, completionLexicon: string[]): boolean {
  const text = lastAssistantMessage.replace(/```[\s\S]*?```/g, ' ').trim();
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 0);
  const last = sentences[sentences.length - 1];
  if (last === undefined || last.endsWith('?')) return false;
  for (const phrase of completionLexicon) {
    const m = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').exec(last);
    if (m === null) continue;
    const clause = last.slice(0, m.index).split(/[,;:]/).pop() ?? '';
    if (!NEGATION.test(clause)) return true;
  }
  return false;
}

export const verificationGenerator: Generator = {
  genre: 'verification',
  triggerEvents: ['Stop'],
  candidates() {
    // SKELETON: 1R — stands in for the verification generator over Step 6's Candidate (no
    // string headline, no a_count read); retired by Step 18
    return [];
  },
};
