// session_log writer (Step 10, AD-17, FR-M1). The one path through which
// per-event diagnostic records reach the session_log table; a thin wrapper over
// the DAO so the writers-only convention (T-10-3) can enforce that no other
// module writes the table directly.

import type { Store } from '../stores/adapter.js';
import { sessionLogDao, type SessionEventInput } from '../stores/dao/session_log.js';

/**
 * Write one session_log event; returns its ULID id and the `seq` the engine
 * assigned (Step 10 build delta, N16: the caller passes no `seq`).
 */
export function writeSessionEvent(store: Store, event: SessionEventInput): { id: string; seq: number } {
  return sessionLogDao(store).append(event);
}
