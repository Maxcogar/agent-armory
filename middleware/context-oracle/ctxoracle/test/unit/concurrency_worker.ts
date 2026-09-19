// Worker process for the T-3-3 concurrency test (Step 3). NOT a test file — the
// name has no `.test` suffix, so scripts/run-tests.mjs never counts or runs it,
// and the count guard stays balanced.
//
// Three roles the parent test (concurrency.test.ts) sequences purely by
// filesystem observables — never by the clock:
//   A  holds a write lock: BEGIN IMMEDIATE + one insert, signals `A.holding`,
//      then waits for `A.release` before COMMIT/close. It uses the raw
//      exec/prepare seams (not transaction(), which is synchronous and cannot
//      span the wait).
//   B  a contended writer that succeeds: signals `B.starting`, then runs a
//      transaction() insert; the parent releases A around then, so B's write
//      lands. Signals `B.success`.
//   C  a contended writer that fails open: runs transaction() while A still
//      holds the lock through both bounded attempts, so it raises StoreBusy.
//      Signals `C.storebusy`. A partial C row must never be committed.
//
// The `who` column is UNIQUE so a re-run of the same role can never double-insert
// undetected; the parent asserts the exact committed set afterwards.

import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openStore, StoreBusy } from '../../src/stores/adapter.js';

const [role, dir, dbPath] = process.argv.slice(2);
if (role === undefined || dir === undefined || dbPath === undefined) {
  process.stderr.write('concurrency_worker: expected <role> <dir> <dbPath>\n');
  process.exit(2);
}

/** Sleep `ms` without spinning the CPU (no dependency on a timer/event loop). */
function nap(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Signal an observable by creating a marker file the parent polls for. */
function signal(name: string): void {
  writeFileSync(path.join(dir, name), 'x');
}

/**
 * Block until the observable `name` exists. Sequencing is the file's existence,
 * not elapsed time; the deadline is only a backstop so a wiring bug fails the
 * test instead of hanging the whole suite.
 */
function waitFor(name: string): void {
  const target = path.join(dir, name);
  const deadline = Date.now() + 15_000;
  while (!existsSync(target)) {
    if (Date.now() > deadline) {
      process.stderr.write(`concurrency_worker(${role}): timed out waiting for ${name}\n`);
      process.exit(3);
    }
    nap(5);
  }
}

const store = openStore(dbPath);
try {
  if (role === 'A') {
    store.exec('BEGIN IMMEDIATE');
    store.prepare('INSERT INTO t(who) VALUES(?)').run('A');
    signal('A.holding');
    waitFor('A.release');
    store.exec('COMMIT');
    signal('A.released');
  } else if (role === 'B') {
    signal('B.starting');
    store.transaction(() => store.prepare('INSERT INTO t(who) VALUES(?)').run('B'));
    signal('B.success');
  } else if (role === 'C') {
    try {
      store.transaction(() => store.prepare('INSERT INTO t(who) VALUES(?)').run('C'));
      // The lock was held throughout; a success here is a contract violation.
      signal('C.unexpected_success');
      process.exit(4);
    } catch (e) {
      if (e instanceof StoreBusy) {
        signal('C.storebusy');
      } else {
        process.stderr.write(`concurrency_worker(C): unexpected error: ${String(e)}\n`);
        process.exit(5);
      }
    }
  } else {
    process.stderr.write(`concurrency_worker: unknown role ${JSON.stringify(role)}\n`);
    process.exit(2);
  }
} finally {
  store.close();
}
