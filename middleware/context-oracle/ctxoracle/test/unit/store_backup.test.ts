// T-3-6 — `backupFile` into a store another process holds open (reopened Step 3
// build delta: `backupFile`, AD-5 import via backup(); the G34 probe the review
// executed — a copy import gave "database disk image is malformed").
//
// Real node:sqlite; a real child process (store_backup_holder.ts) holds the live
// store L open with >= 200 uncheckpointed WAL frames; no doubles.
// NOT asserted: backup speed.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { backupFile, openStore } from '../../src/stores/adapter.js';

const holderPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'store_backup_holder.js');
const WAL_HEADER = 32;
const FRAME_HEADER = 24;

test('T-3-6: backupFile(E, L) while a holder keeps L open with uncheckpointed WAL frames yields an intact L holding exactly E', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-backup-'));
  const live = path.join(dir, 'live.db');
  const exportPath = path.join(dir, 'export.db');
  const holder = spawn(process.execPath, [holderPath, live], { stdio: ['pipe', 'pipe', 'inherit'] });
  const exited = new Promise<number | null>((resolve, reject) => {
    holder.on('error', reject);
    holder.on('exit', (code) => resolve(code));
  });
  try {
    // The export E: table t with 5 rows.
    const e = openStore(exportPath);
    e.exec('CREATE TABLE t(x INTEGER NOT NULL)');
    for (let i = 1; i <= 5; i++) e.prepare('INSERT INTO t(x) VALUES(?)').run(i);
    e.close();

    // Wait for the holder's report (an observable, never the clock).
    const pageSize = await new Promise<number>((resolve, reject) => {
      let buf = '';
      holder.stdout!.setEncoding('utf8');
      holder.stdout!.on('data', (chunk: string) => {
        buf += chunk;
        const m = /holding (\d+)\n/.exec(buf);
        if (m) resolve(Number(m[1]));
      });
      holder.on('exit', () => reject(new Error(`holder exited before holding; stdout: ${buf}`)));
    });

    // Precondition: L has >= 200 uncheckpointed WAL frames while held open.
    const walBytes = statSync(`${live}-wal`).size;
    const frames = Math.floor((walBytes - WAL_HEADER) / (pageSize + FRAME_HEADER));
    assert.ok(frames >= 200, `precondition: >= 200 uncheckpointed WAL frames (got ${frames})`);

    await backupFile(exportPath, live);

    holder.stdin!.end();
    assert.equal(await exited, 0, 'the holder exits cleanly');

    const l = openStore(live);
    try {
      const ic = l.prepare('PRAGMA integrity_check').all() as { integrity_check: string }[];
      assert.deepEqual(ic.map((r) => r.integrity_check), ['ok'], 'L is intact');
      const tables = (l.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as {
        name: string;
      }[]).map((r) => r.name);
      assert.deepEqual(tables, ['t'], "L's tables are exactly E's");
      const tRows = (l.prepare('SELECT x FROM t ORDER BY x').all() as { x: number }[]).map((r) => r.x);
      assert.deepEqual(tRows, [1, 2, 3, 4, 5], "t holds E's 5 rows");
    } finally {
      l.close();
    }
  } finally {
    if (holder.exitCode === null) holder.kill();
    await exited.catch(() => null);
    rmSync(dir, { recursive: true, force: true });
  }
});
