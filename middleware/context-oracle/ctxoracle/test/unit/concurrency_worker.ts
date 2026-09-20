// Worker process for the T-3-3 concurrency test (Step 3). NOT a test file — the
// name has no `.test` suffix, so scripts/run-tests.mjs never counts or runs it,
// and the count guard stays balanced.
//
// Three roles the parent test (concurrency.test.ts) sequences purely by
// filesystem observables — never by the clock. The retry path of
// Store.transaction is exercised deterministically via its `onBusyRetry` seam,
// which fires exactly once between the first busy attempt and the retry:
//   A  holds a write lock: BEGIN IMMEDIATE + one insert, signals `A.holding`,
//      then waits for `A.release` before COMMIT/close. It uses the raw
//      exec/prepare seams (not transaction(), which is synchronous and cannot
//      span the wait).
//   B  a contended writer that succeeds after exactly one retry: signals
//      `B.starting`, then runs a transaction() insert. Its first attempt runs
//      while A holds and fails busy, firing `onBusyRetry`, in which B signals
//      `B.first_attempt_busy` and blocks on `B.may_retry`. The parent releases A
//      only after B's first-attempt report, and releases B's retry only after A
//      has exited — so the retry finds the lock free by construction. Signals
//      `B.success`. If B ever commits without its first attempt going busy (no
//      retry recorded), `B.first_attempt_busy` is absent and the parent fails.
//   C  a contended writer that fails open after exactly two attempts: runs
//      transaction() while A holds the lock throughout. Its first attempt fails
//      busy and fires `onBusyRetry` (C signals `C.retried` and does not wait);
//      the retry also fails busy, so transaction() raises StoreBusy. Signals
//      `C.storebusy`. A partial C row must never be committed.
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
    // The first attempt runs while A holds → busy → onBusyRetry fires. B reports
    // that first-attempt failure and blocks until the parent (having released
    // and awaited A's exit) permits the retry, which then finds the lock free.
    store.transaction(() => store.prepare('INSERT INTO t(who) VALUES(?)').run('B'), {
      onBusyRetry: () => {
        signal('B.first_attempt_busy');
        waitFor('B.may_retry');
      },
    });
    signal('B.success');
  } else if (role === 'C') {
    try {
      // A holds the lock throughout both of C's attempts. The first fails busy
      // (onBusyRetry fires → C.retried); the retry also fails busy → StoreBusy.
      store.transaction(() => store.prepare('INSERT INTO t(who) VALUES(?)').run('C'), {
        onBusyRetry: () => signal('C.retried'),
      });
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
