// Commit labels for the co-change miner (Step 13, AD-15).
//
// The miner reads a commit's subject and body only to call these two functions
// and never stores message text (AD-15, AD-19 pointer-only). Which commits each
// label is applied to — revert detection before the size exclusion, fix labels
// only on included commits, a revert never also a fix — is the miner's rule
// (src/miner/cochange.ts); these functions are the pure predicates.

/** git-revert(1)'s default body line: `This reverts commit <hash>.`, the hash
 *  40 hex (SHA-1) or 64 hex (SHA-256) — AD-15, Step 13 build review M1. */
const REVERT_TRAILER = /^This reverts commit ([0-9a-f]{40}|[0-9a-f]{64})\.$/m;

/**
 * True when the commit is one git itself generated as a revert: its body holds
 * git-revert(1)'s default trailer line, or — the fallback for a message without
 * the trailer — its subject starts with `Revert "` or `Reapply "` (the subject
 * git writes when reverting a revert). Executed 2026-09-26 on git 2.43.0:
 * `git revert --no-edit HEAD` wrote subject `Revert "both"` and body
 * `This reverts commit <hash>.` (AD-15).
 */
export function isRevertLabelled(subject: string, body: string): boolean {
  if (REVERT_TRAILER.test(body)) return true;
  return subject.startsWith('Revert "') || subject.startsWith('Reapply "');
}

/**
 * True when a whole token of the lower-cased subject equals a member of
 * `fixKeywords` (the `lexicon.fix_keywords` tuning list). The subject is split on
 * `/[^\p{L}\p{N}]+/u`, so `Fix: a` and `bug-fix b` match and `fixture`,
 * `prefix`, `suffix` do not — the SZZ keyword heuristic matches keywords as
 * words (Śliwerski, Zimmermann, Zeller, MSR 2005; AD-15). Members are compared
 * lower-cased, since AD-15 states the match is case-insensitive.
 */
export function isFixLabelled(subject: string, fixKeywords: readonly string[]): boolean {
  if (fixKeywords.length === 0) return false;
  const members = new Set(fixKeywords.map((k) => k.toLowerCase()));
  for (const token of subject.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (token !== '' && members.has(token)) return true;
  }
  return false;
}
