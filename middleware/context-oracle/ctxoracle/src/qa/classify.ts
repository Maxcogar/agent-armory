// The honest-floor recognizers (Step 23, AD-9, D-plan-24, D-39). Deliberately
// conservative; Phase B replaces this file. They hold no configuration: the
// stoplists, filler set and floor are passed in.
import { sha256Short } from '../util/hash.js';

function stripFencesAndQuotes(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .split('\n')
    .filter((l) => !l.trimStart().startsWith('>'))
    .join('\n');
}

export function recognizeQuestions(
  text: string,
  stoplist: string[],
  opts: { requireTerminalMark: boolean } = { requireTerminalMark: true }
): { questionText: string; contentHash: string }[] {
  const stop = new Set(stoplist.map((s) => s.toLowerCase().trim()));
  const sentences = stripFencesAndQuotes(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return sentences
    .filter((s) => (opts.requireTerminalMark ? s.endsWith('?') : true))
    .filter((s) => !stop.has(s.toLowerCase()))
    .map((s) => ({ questionText: s, contentHash: sha256Short(s.toLowerCase()) }));
}

function tokens(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

export function recognizeClearing(
  assistantText: string,
  deferralStoplist: string[],
  deferralFiller: string[],
  lengthFloorChars: number
): { clears: boolean; reason?: 'below_length_floor' | 'deferral_only' } {
  const text = stripFencesAndQuotes(assistantText);
  const substance = text.replace(/[\s\p{P}\p{S}]/gu, '');
  if (substance.length < lengthFloorChars) return { clears: false, reason: 'below_length_floor' };
  const lower = text.toLowerCase();
  const phrases = deferralStoplist.map((p) => p.toLowerCase()).filter((p) => lower.includes(p));
  if (phrases.length > 0) {
    let rest = lower;
    for (const p of phrases) rest = rest.split(p).join(' ');
    const filler = new Set(deferralFiller.map((f) => f.toLowerCase()));
    if (tokens(rest).every((t) => filler.has(t))) return { clears: false, reason: 'deferral_only' };
  }
  return { clears: true };
}

const MOVE_TOOLS = new Set(['Write', 'Edit', 'NotebookEdit']);
export function recognizeMove(toolName: string): boolean {
  return MOVE_TOOLS.has(toolName);
}
