// T-3-1 — Adapter WAL/STRICT/PRAGMA round-trip (Step 3).

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore } from '../../src/stores/adapter.js';

test('T-3-1: openStore yields WAL, foreign_keys, busy_timeout, STRICT, and round-trips', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-adapter-'));
  const store = openStore(path.join(dir, 'store.db'));
  try {
    assert.equal((store.prepare('PRAGMA journal_mode').get() as { journal_mode: string }).journal_mode, 'wal');
    assert.equal((store.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number }).foreign_keys, 1);
    assert.equal((store.prepare('PRAGMA busy_timeout').get() as { timeout: number }).timeout, 100);

    store.exec('CREATE TABLE t (x INTEGER NOT NULL) STRICT');
    store.transaction(() => store.prepare('INSERT INTO t(x) VALUES(?)').run(1));
    assert.equal((store.prepare('SELECT x FROM t').get() as { x: number }).x, 1);

    // STRICT rejects a wrong-typed value.
    assert.throws(() => store.transaction(() => store.prepare('INSERT INTO t(x) VALUES(?)').run('not-an-int')));
    // The rejected insert rolled back: still exactly one row.
    assert.equal((store.prepare('SELECT count(*) AS n FROM t').get() as { n: number }).n, 1);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
