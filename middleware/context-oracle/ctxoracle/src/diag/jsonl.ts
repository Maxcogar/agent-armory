// The JSONL fault channel (Step 6, AD-17). A direct file write, NOT through the
// store — a dead store cannot log its own death (that is the whole point of the
// channel: `store_corrupt` and `store_busy` must still be recordable). One JSON
// object per line, appended with O_APPEND|O_CREAT at mode 0600, flushed before
// return.

import { closeSync, fchmodSync, fsyncSync, openSync, writeSync } from 'node:fs';
import path from 'node:path';
import type { FaultCode } from './fault_codes.js';

export interface Fault {
  code: FaultCode;
  detail: unknown;
  session?: string;
}

/** Filesystem-safe short session tag for the per-session JSONL filename. */
function sessionShort(session: string | undefined): string {
  if (session === undefined || session === '') return 'session';
  const safe = session.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 12);
  return safe.length > 0 ? safe : 'session';
}

/**
 * Append one fault record to `<diagnosticsDir>/<session-short>.jsonl`. Opens
 * with append+create at 0600, forces the mode (defeating umask, as the layout
 * step does for directories), writes one line, and fsyncs before returning so
 * the record survives even if the process exits immediately afterward.
 */
export function appendFault(diagnosticsDir: string, fault: Fault): void {
  const file = path.join(diagnosticsDir, `${sessionShort(fault.session)}.jsonl`);
  const record = {
    ts: new Date().toISOString(),
    code: fault.code,
    ...(fault.session !== undefined ? { session: fault.session } : {}),
    detail: fault.detail,
  };
  const line = `${JSON.stringify(record)}\n`;
  const fd = openSync(file, 'a', 0o600); // 'a' = O_APPEND | O_CREAT | O_WRONLY
  try {
    fchmodSync(fd, 0o600);
    writeSync(fd, line);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
