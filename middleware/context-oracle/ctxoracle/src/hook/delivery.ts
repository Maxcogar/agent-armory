// Delivery (Step 20, AD-16, D-20): per-consumer dedup, SessionStart
// reconciliation, and the Stop-time channel. Names no hook field — the adapter
// (Step 28) turns a StopDelivery into the hook's output.
// SKELETON: G23 — `consumer_state` is keyed by consumer ('main'|'subagent')
// only: every subagent shares one set, and concurrent sessions on one repo share
// 'main''s set.
import type { Store } from '../stores/adapter.js';
import type { Candidate } from '../types/candidate.js';
import { consumerStateDao } from '../stores/dao/consumer_state.js';

export function perConsumerDedup(store: Store, consumer: string, c: Candidate): boolean {
  const cs = consumerStateDao(store);
  return !(cs.has(consumer, 'delivered', c.subjectKey) || cs.has(consumer, 'read', c.subjectKey));
}

export function reconcileDedupOnSessionStart(store: Store, consumer: string, source: string): void {
  const cs = consumerStateDao(store);
  if (source === 'startup' || source === 'clear') {
    cs.clear(consumer, 'delivered');
    cs.clear(consumer, 'read');
  } else if (source === 'compact') {
    cs.clear(consumer, 'read');
  }
}

export function updateReadSet(store: Store, consumer: string, tool: string, path: string | undefined): void {
  if (path === undefined || !['Read', 'Grep', 'Glob'].includes(tool)) return;
  consumerStateDao(store).add(consumer, 'read', `path:${path}`);
}

export function recordDelivered(store: Store, consumer: string, subjectKey: string): void {
  consumerStateDao(store).add(consumer, 'delivered', subjectKey);
}

export type StopDelivery = { context: string } | null;

export function deliverStop(whisperText: string, stopHookActive: boolean): StopDelivery {
  if (stopHookActive || whisperText.length === 0) return null;
  return { context: whisperText };
}
