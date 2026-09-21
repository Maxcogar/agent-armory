// T-3-3 — Concurrency discipline of Store.transaction (Step 3, AD-26).
//
// Three writer processes contend for one WAL database. The test sequences them
// purely by filesystem observables (marker files), never by sleeping a fixed
// duration and hoping. Store.transaction's `onBusyRetry` seam makes the
// retry-once path observable, so both contended outcomes are forced by the
// ordering rather than by sub-100ms timing:
//   1. A acquires the write lock (BEGIN IMMEDIATE + insert) and holds it,
//      signalling `A.holding`.
//   2. C attempts a transaction() write while A holds. Its first attempt fails
//      busy (firing onBusyRetry -> `C.retried`); the retry also fails busy, so C
//      fails open with StoreBusy (`C.storebusy`) after exactly two attempts and
//      writes nothing. A is still holding, so C's failure is real contention.
//   3. Only then B starts. B's first attempt fails busy while A holds
//      (`B.first_attempt_busy`) and blocks inside onBusyRetry. A is released to
//      commit only after that report; B is released to retry only after A has
//      exited, so B's retry finds the lock free by construction and commits
//      (`B.success`).
//
// Deterministic assertions: A commits; B commits after exactly one recorded
// retry (`B.first_attempt_busy` present — B could not have won its first attempt
// while A held); C recorded one retry then failed open (`C.retried` +
// `C.storebusy`) leaving no partial row; the committed set is exactly {A, B}.
// The one-retry bound is structural in adapter.ts (a two-iteration loop that
// fires onBusyRetry only on attempt 0), and both the retry-then-succeed branch
// (B) and the give-up branch (C) are exercised.

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

test('T-3-3: contended writers — retry-then-succeed (B) and give-up (C), by construction', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-concurrency-'));
  const dbPath = path.join(dir, 'store.db');

  // Create the schema before any contender opens the database.
  const setup = openStore(dbPath);
  setup.exec('CREATE TABLE t (who TEXT NOT NULL UNIQUE) STRICT');
  setup.close();

  try {
    const a = startWorker('A', dir, dbPath);
    await waitForMarker(dir, 'A.holding');

    // A holds the write lock. C must make both attempts and fail open while it
    // is held — proving the retry branch fires and the give-up branch is taken.
    const c = startWorker('C', dir, dbPath);
    await waitForMarker(dir, 'C.storebusy');
    assert.equal(
      existsSync(path.join(dir, 'C.retried')),
      true,
      'C retried once (two attempts) before failing open'
    );
    assert.equal(existsSync(path.join(dir, 'C.unexpected_success')), false);

    // Now B contends. Its first attempt fails busy while A still holds; B reports
    // that and blocks. Only then release A; only after A exits, permit B's retry
    // — which then finds the lock free by construction.
    const b = startWorker('B', dir, dbPath);
    await waitForMarker(dir, 'B.starting');
    await waitForMarker(dir, 'B.first_attempt_busy');
    writeFileSync(path.join(dir, 'A.release'), 'x');
    await waitForMarker(dir, 'A.released');
    writeFileSync(path.join(dir, 'B.may_retry'), 'x');
    await waitForMarker(dir, 'B.success');

    assert.equal(await a.exit, 0, 'A exited cleanly');
    assert.equal(await b.exit, 0, 'B exited cleanly');
    assert.equal(await c.exit, 0, 'C exited cleanly (fail-open is not a crash)');

    // B committed only after recording exactly one retry (its first attempt went
    // busy while A held; onBusyRetry fires only on attempt 0).
    assert.equal(
      existsSync(path.join(dir, 'B.first_attempt_busy')),
      true,
      'B recorded exactly one retry before success'
    );

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
