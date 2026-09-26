// Internal `hook integrity-check` verb (Step 28, AD-17): PRAGMA quick_check off
// the event path; `store_corrupt` on failure.
import { openRepo } from './context.js';
import { recordFault } from '../diag/fault_writer.js';

export function integrityCheckVerb(): number {
  const r = openRepo(process.cwd(), false);
  if (r === null) return 0;
  try {
    if (r.project.integrityCheck() !== 'ok') recordFault(r.project, r.layout.diagnostics, { code: 'store_corrupt', detail: { check: 'quick_check' } });
    return 0;
  } finally {
    r.project.close();
    r.global.close();
  }
}
