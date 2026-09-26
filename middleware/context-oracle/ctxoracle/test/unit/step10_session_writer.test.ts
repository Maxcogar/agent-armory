// Step 10 build delta (N16) — `writeSessionEvent` takes no `seq` and returns
// `{id, seq}`. Added by the 2026-09-26 independent build review
// (docs/reviews/2026-09-26-steps-1-12-build-review.md): no test read the
// writer's return value. Plan text: "`writeSessionEvent(store, {session,
// consumer, event_type, ts, latency_ms, candidates_json, outcome,
// detail_json?}): {id, seq}` ... the caller no longer passes `seq`; the engine
// assigns it (Step 7's `seq INTEGER PRIMARY KEY` ...), and the writer returns it."
// Real node:sqlite via the real migrations; no doubles.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { writeSessionEvent } from '../../src/diag/session_writer.js';

const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

test('Step 10 (review): writeSessionEvent returns the ULID and the engine-assigned seq of the row it wrote; two events in one millisecond get distinct seqs', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-sw-'));
  const store = openStore(path.join(dir, 'store.db'));
  try {
    applyMigrations(store, { fts: false });
    const ts = 1_000;
    const a = writeSessionEvent(store, { session: 'S', consumer: 'S#main', event_type: 'PreToolUse', ts, latency_ms: 3, candidates_json: null, outcome: null });
    const b = writeSessionEvent(store, { session: 'S', consumer: 'S#main', event_type: 'PostToolUse', ts, latency_ms: 4, candidates_json: null, outcome: null });
    assert.match(a.id, ULID);
    assert.match(b.id, ULID);
    assert.notEqual(a.seq, b.seq, 'the same millisecond never collides (N16)');
    const rows = (store.prepare('SELECT seq, id, event_type FROM session_log ORDER BY seq').all() as {
      seq: number;
      id: string;
      event_type: string;
    }[]).map((r) => ({ ...r }));
    assert.deepEqual(rows, [
      { seq: a.seq, id: a.id, event_type: 'PreToolUse' },
      { seq: b.seq, id: b.id, event_type: 'PostToolUse' },
    ]);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
