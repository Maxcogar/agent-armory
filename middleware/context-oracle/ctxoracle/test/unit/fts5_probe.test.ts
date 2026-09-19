// T-3-4 — FTS5 probe returns true on this runtime and leaves no probe table
// behind (Step 3).

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, probeFts5 } from '../../src/stores/adapter.js';

test('T-3-4: probeFts5 is true and the probe table is gone afterwards', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-fts5-'));
  const store = openStore(path.join(dir, 'store.db'));
  try {
    assert.equal(probeFts5(store), true);
    const row = store
      .prepare("SELECT name FROM sqlite_master WHERE name = '_fts5_probe'")
      .get();
    assert.equal(row, undefined, '_fts5_probe must not persist after the probe');
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
