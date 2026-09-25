// Deny health detectors (Step 26, AD-9, AD-17). WALKING SKELETON: the
// path-write predicate and the loop detector are built; the lag and
// despite-answer detectors are minimal.
import type { Store } from '../stores/adapter.js';
import type { TuningReader } from '../types/candidate.js';
import { whisperAuditDao } from '../stores/dao/whisper_audit.js';
import { classifiedTurnsDao } from '../stores/dao/classified_turns.js';
import { recordFault } from '../diag/fault_writer.js';

/** AD-4's enumerated path-write list, verbatim: `>`/`>>`, `tee`, `sed -i`,
 *  `perl -i`, `cp`/`mv`/`install` to a path. */
export function pathWriteTarget(command: string): string | null {
  const pats = [
    /(?:^|[^>])>>?\s*([^\s;&|]+)/,
    /\btee\s+(?:-a\s+)?([^\s;&|]+)/,
    /\bsed\s+-i(?:\S*)?\s+(?:'[^']*'|"[^"]*"|\S+)\s+([^\s;&|]+)/,
    /\bperl\s+-i\S*\s+(?:-\S+\s+)*(?:'[^']*'|"[^"]*"|\S+)\s+([^\s;&|]+)/,
    /\b(?:cp|mv|install)\s+(?:-\S+\s+)*\S+\s+([^\s;&|]+)/,
  ];
  for (const p of pats) {
    const m = p.exec(command);
    if (m !== null) return m[1] as string;
  }
  return null;
}

export function checkDenyLoop(store: Store, diagnosticsDir: string, consumer: string, t: TuningReader): boolean {
  const k = Number(t.get('deny.loop_threshold') ?? '3');
  const denies = whisperAuditDao(store).denies(consumer, 0).slice(-k);
  if (denies.length < k) return false;
  const first = denies[0]!.ts;
  const last = denies[denies.length - 1]!.ts;
  if (classifiedTurnsDao(store).between(consumer, first, last).length > 0) return false;
  recordFault(store, diagnosticsDir, { code: 'deny_loop', detail: { consumer, denies: denies.map((d) => d.id) } });
  return true;
}

export function checkDenyAfterAnswerLag(
  store: Store,
  diagnosticsDir: string,
  consumer: string,
  newTurns: { uuid: string; ts: number; clears: boolean }[]
): void {
  const denies = whisperAuditDao(store).denies(consumer, 0);
  for (const turn of newTurns.filter((x) => x.clears)) {
    const after = denies.filter((d) => d.ts > turn.ts);
    if (after.length > 0)
      recordFault(store, diagnosticsDir, { code: 'deny_after_answer_lag', detail: { turn: turn.uuid, denies: after.map((d) => d.id) } });
  }
}

export function checkDenyBypassSuspect(store: Store, diagnosticsDir: string, consumer: string, command: string): void {
  const target = pathWriteTarget(command);
  if (target === null) return;
  const lastDeny = whisperAuditDao(store).denies(consumer, 0).at(-1);
  if (lastDeny === undefined) return;
  const ev = JSON.parse(lastDeny.evidence_json ?? '{}') as { target?: string };
  if (ev.target === target) recordFault(store, diagnosticsDir, { code: 'deny_bypass_suspect', detail: { deny: lastDeny.id, target } });
}
