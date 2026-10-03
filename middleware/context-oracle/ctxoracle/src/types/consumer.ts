// The consumer key (Step 6 build delta; AD-4, AD-9, AD-16; gap-list review
// G23/G29). A consumer is one agent in one session, never a role: the former
// `Consumer = 'main' | 'subagent'` let a question asked in one session deny an
// Edit in another (executed, G23). Runtime, dependency-free.
//
// Encoding: `${sessionId}#main` for the main agent, `${sessionId}#sub:${agentId}`
// for a subagent — so a subagent whose agent id is the string `main` stays
// distinct from the main agent. The role is used only for FR-O6's main-only
// deny scope (Step 25).

declare const brand: unique symbol;

/** `${sessionId}#main` or `${sessionId}#sub:${agentId}`. */
export type ConsumerKey = string & { readonly [brand]: true };

/** `${sessionId}#main` when `agentId` is absent or empty, else `${sessionId}#sub:${agentId}`. */
export function consumerKey(sessionId: string, agentId?: string): ConsumerKey {
  const suffix = agentId === undefined || agentId === '' ? 'main' : `sub:${agentId}`;
  return `${sessionId}#${suffix}` as ConsumerKey;
}

/**
 * The role read from the part after the first `#`: `main` -> main, a `sub:`
 * prefix with a non-empty agent id -> subagent. Anything else throws, so a
 * malformed key never silently reads as main.
 */
export function consumerRole(key: ConsumerKey | string): 'main' | 'subagent' {
  const hash = key.indexOf('#');
  const role = hash === -1 ? null : key.slice(hash + 1);
  if (role === 'main') return 'main';
  if (role !== null && role.startsWith('sub:') && role.length > 'sub:'.length) return 'subagent';
  throw new Error(`consumerRole: malformed consumer key ${JSON.stringify(key)}`);
}
