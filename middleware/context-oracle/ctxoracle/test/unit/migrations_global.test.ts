// T-8-1 — the global migration (002) creates exactly the four Phase A global
// tables and no Phase B/C table (Step 8). Real node:sqlite; no doubles.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';

test('T-8-1: migration 002 creates exactly {global_meta, whisper_stats, tuning, lessons}', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-global-'));
  const store = openStore(path.join(dir, 'global.db'));
  try {
    applyMigrations(store, { fts: false, scope: 'global' });
    const tables = (store.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
      name: string;
    }[]).map((r) => r.name);
    assert.deepEqual([...tables].sort(), ['global_meta', 'lessons', 'tuning', 'whisper_stats']);
    // No Phase B writer's table.
    assert.equal(tables.includes('env_capabilities'), false);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
