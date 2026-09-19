// T-10-1 — a store_corrupt induction (byte 0 of the store file overwritten after
// close) surfaces on the JSONL channel through recordFault, with reproducing
// detail (Step 10). Real store, really corrupted; no doubles.

import test from 'node:test';
import assert from 'node:assert/strict';
import { closeSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { recordFault } from '../../src/diag/fault_writer.js';

test('T-10-1: a corrupt store surfaces store_corrupt on the JSONL channel', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-corrupt-'));
  const dbPath = path.join(dir, 'store.db');
  const diag = path.join(dir, 'diagnostics');
  mkdirSync(diag, { recursive: true });
  try {
    // Create a valid store, then corrupt the SQLite header (byte 0).
    const s = openStore(dbPath);
    s.exec('CREATE TABLE t (x INTEGER) STRICT');
    s.close();
    const fd = openSync(dbPath, 'r+');
    writeSync(fd, Buffer.from([0x00]), 0, 1, 0);
    closeSync(fd);

    // Event-path caller: opening / reading the corrupt store throws; the caller
    // records the fault. `store` may be null if the open itself failed.
    let store: Store | null = null;
    let threw = false;
    try {
      store = openStore(dbPath);
      store.prepare('SELECT count(*) AS n FROM t').get();
    } catch (e) {
      threw = true;
      recordFault(store, diag, { code: 'store_corrupt', detail: { error: String(e) }, session: 'S1' });
    } finally {
      if (store !== null) {
        try {
          store.close();
        } catch {
          /* corrupt handle */
        }
      }
    }
    assert.ok(threw, 'the corrupt store must throw on the event path');

    const lines = readFileSync(path.join(diag, 'S1.jsonl'), 'utf8')
      .split('\n')
      .filter((l) => l.length > 0)
      .map((l) => JSON.parse(l) as { code: string; detail: { error?: string } });
    const corrupt = lines.find((l) => l.code === 'store_corrupt');
    assert.ok(corrupt, 'a store_corrupt line is present on the JSONL channel');
    assert.ok(
      typeof corrupt!.detail.error === 'string' && corrupt!.detail.error.length > 0,
      'the line carries reproducing detail'
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
