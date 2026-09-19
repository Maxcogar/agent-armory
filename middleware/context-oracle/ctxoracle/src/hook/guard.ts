// Recursion guard (Step 10, AD-21, FR-J4). The handler's first act: if the
// process was itself spawned by the oracle (its spawn seam sets
// CTXORACLE_INTERNAL=1), the handler must not run — otherwise a Phase B
// host-CLI piggyback would re-trigger the oracle's own hooks, a recursion.

export function isInternal(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.CTXORACLE_INTERNAL === '1';
}
