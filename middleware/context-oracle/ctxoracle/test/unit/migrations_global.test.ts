// T-8-1 — the global migration (002) creates exactly the four Phase A global
// tables and no Phase B/C table (Step 8). Real node:sqlite; no doubles.
//
// Reopened 2026-09-26 (Step 8 build delta, AD-5, G33/N11; T-8-1 Data revised):
// `whisper_stats` is the replaced replica keyed (genre, project_key) with the
// columns genre, project_key, sent, corrected_false, corrected_missed,
// published_at — no window_start/window_end — and a second row with the same
// (genre, project_key) is rejected.

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

    // whisper_stats: exactly the replica's columns, keyed (genre, project_key).
    const info = store.prepare('PRAGMA table_info(whisper_stats)').all() as { name: string; pk: number }[];
    assert.deepEqual(
      info.map((c) => c.name),
      ['genre', 'project_key', 'sent', 'corrected_false', 'corrected_missed', 'published_at']
    );
    const pk = info.filter((c) => c.pk > 0).sort((a, b) => a.pk - b.pk).map((c) => c.name);
    assert.deepEqual(pk, ['genre', 'project_key'], 'primary key is (genre, project_key)');
    const ins = store.prepare(
      `INSERT INTO whisper_stats(genre, project_key, sent, corrected_false, corrected_missed, published_at)
       VALUES(?, ?, ?, ?, ?, ?)`
    );
    ins.run('coupling', 'k', 1, 0, 0, 1);
    assert.throws(() => ins.run('coupling', 'k', 2, 0, 0, 2), /UNIQUE constraint failed/, 'a second (genre, project_key) row is rejected');
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
