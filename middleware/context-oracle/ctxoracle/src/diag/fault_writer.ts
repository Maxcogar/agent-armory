// fault writer (Step 10, AD-17, FR-M2). Mirror-writes every fault to BOTH the
// store's `faults` table (relational surface `status` queries) AND the JSONL
// channel (the store-death fallback — a corrupt store cannot log its own death).
// The store write is best-effort: if the store handle is null or the write
// throws (e.g. the store is exactly what is corrupt), the JSONL write still
// records the fault. Both writes are idempotent by their own key, so no shared
// lock is taken (AD-17).

import type { Store } from '../stores/adapter.js';
import { faultsDao } from '../stores/dao/faults.js';
import { appendFault } from './jsonl.js';
import type { FaultCode } from './fault_codes.js';

export interface FaultRecord {
  code: FaultCode;
  detail: unknown;
  session?: string;
}

export function recordFault(store: Store | null, diagnosticsDir: string, fault: FaultRecord): void {
  if (store !== null) {
    try {
      faultsDao(store).append({
        code: fault.code,
        detail_json: JSON.stringify(fault.detail),
        session: fault.session ?? null,
      });
    } catch {
      // The store is down or corrupt — the JSONL mirror below is the fallback.
    }
  }
  try {
    appendFault(diagnosticsDir, { code: fault.code, detail: fault.detail, session: fault.session });
  } catch {
    // Last-resort channel failed too; nothing more we can safely do on the event path.
  }
}
