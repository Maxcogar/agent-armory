// T-3-3 — Concurrency discipline of Store.transaction (Step 3, AD-26).
//
// Three writer processes contend for one WAL database. The test sequences them
// purely by filesystem observables (marker files), never by sleeping a fixed
// duration and hoping:
//   1. A acquires the write lock (BEGIN IMMEDIATE + insert) and holds it,
//      signalling `A.holding`.
//   2. C attempts a transaction() write while A holds. BEGIN IMMEDIATE is
//      refused through both bounded attempts (~2 x busy_timeout), so C fails
//      open with StoreBusy and writes nothing. A is still holding — so C's
//      failure proves real contention, not a lost race.
//   3. Only after C has failed does the test start B and then release A. B's
//      transaction() therefore contends against a still-held lock and then
//      succeeds once A releases.
//
// Deterministic assertions: A commits, B commits, C is absent (its failed-open
// transaction left no partial write), and C observed StoreBusy specifically.
// What is NOT asserted is B's exact retry count: whether B's write lands inside
// the first attempt's busy_timeout window or on the one explicit retry depends
// on sub-100ms scheduling that no process-level observable can pin down. The
// at-most-one-retry bound is structural in adapter.ts (a two-iteration loop) and
// its give-up branch is exercised by C; asserting an exact count here would only
// make the test flaky.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { openStore } from '../../src/stores/adapter.js';

const workerPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'concurrency_worker.js');

/** Resolve once the marker file exists; reject if the backstop deadline passes. */
async function waitForMarker(dir: string, name: string, timeoutMs = 15_000): Promise<void> {
  const target = path.join(dir, name);
  const deadline = Date.now() + timeoutMs;
  while (!existsSync(target)) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for marker ${name}`);
    await delay(5);
  }
}

interface Worker {
  role: string;
  exit: Promise<number>;
}

function startWorker(role: string, dir: string, dbPath: string): Worker {
  const child = spawn(process.execPath, [workerPath, role, dir, dbPath], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const exit = new Promise<number>((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? -1));
  });
  return { role, exit };
}

test('T-3-3: contended writers — one holds, one succeeds, one fails open with StoreBusy', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-concurrency-'));
  const dbPath = path.join(dir, 'store.db');

  // Create the schema before any contender opens the database.
  const setup = openStore(dbPath);
  setup.exec('CREATE TABLE t (who TEXT NOT NULL UNIQUE) STRICT');
  setup.close();

  try {
    const a = startWorker('A', dir, dbPath);
    await waitForMarker(dir, 'A.holding');

    // A holds the write lock. C must fail open while it is held.
    const c = startWorker('C', dir, dbPath);
    await waitForMarker(dir, 'C.storebusy');
    assert.equal(existsSync(path.join(dir, 'C.unexpected_success')), false);

    // Now let B contend, then release A so B's write can land.
    const b = startWorker('B', dir, dbPath);
    await waitForMarker(dir, 'B.starting');
    // Signal A to release by creating the marker it waits on.
    writeFileSync(path.join(dir, 'A.release'), 'x');

    await waitForMarker(dir, 'A.released');
    await waitForMarker(dir, 'B.success');

    assert.equal(await a.exit, 0, 'A exited cleanly');
    assert.equal(await b.exit, 0, 'B exited cleanly');
    assert.equal(await c.exit, 0, 'C exited cleanly (fail-open is not a crash)');

    // The committed set is exactly A and B; C's failed-open transaction wrote
    // nothing.
    const verify = openStore(dbPath);
    try {
      const rows = (verify.prepare('SELECT who FROM t ORDER BY who').all() as { who: string }[]).map(
        (r) => r.who
      );
      assert.deepEqual(rows, ['A', 'B']);
    } finally {
      verify.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
