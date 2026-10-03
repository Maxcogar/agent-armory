// T-3-5 — Transactions nest; `mustExist` never creates (reopened Step 3 build
// delta: AD-26's re-entrant transaction, gap-list review G9; the handler's
// no-create open, N15; missing vs unreadable, plan-pass collapse-hunt H8).
//
// Real node:sqlite on temp-file databases; no doubles. Every expected row set and
// every expected error class below is the one T-3-5's Data field states.
// NOT asserted: savepoint names; the EACCES case (the runner may be root, which
// no mode bit refuses).

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, StoreBusy, StoreMissing, StoreUnreadable, TransactionAborted, type Store } from '../../src/stores/adapter.js';

function withTable(fn: (store: Store, dbPath: string) => void): void {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-nest-'));
  const dbPath = path.join(dir, 'store.db');
  const store = openStore(dbPath);
  try {
    store.exec('CREATE TABLE t(x INTEGER)');
    fn(store, dbPath);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function rows(store: Store): number[] {
  return (store.prepare('SELECT x FROM t ORDER BY x').all() as { x: number }[]).map((r) => r.x);
}

function ins(store: Store, x: number): void {
  store.prepare('INSERT INTO t(x) VALUES(?)').run(x);
}

test('T-3-5a: outer inserts 1, inner inserts 2 and returns -> both rows', () => {
  withTable((store) => {
    store.transaction(() => {
      ins(store, 1);
      store.transaction(() => {
        ins(store, 2);
      });
    });
    assert.deepEqual(rows(store), [1, 2]);
  });
});

test('T-3-5b: inner throws, outer catches and returns -> only the outer row', () => {
  withTable((store) => {
    store.transaction(() => {
      ins(store, 1);
      try {
        store.transaction(() => {
          ins(store, 2);
          throw new Error('inner failure');
        });
        assert.fail('the inner transaction must rethrow');
      } catch (e) {
        assert.equal((e as Error).message, 'inner failure', 'the inner error is rethrown unchanged');
      }
    });
    assert.deepEqual(rows(store), [1]);
  });
});

test('T-3-5c: inner returns, outer then throws -> neither row', () => {
  withTable((store) => {
    assert.throws(
      () =>
        store.transaction(() => {
          ins(store, 1);
          store.transaction(() => {
            ins(store, 2);
          });
          throw new Error('outer failure');
        }),
      /outer failure/
    );
    assert.deepEqual(rows(store), []);
  });
});

test('T-3-5d: three levels, the middle throws and the outer catches -> innermost and middle rows gone, outer kept', () => {
  withTable((store) => {
    store.transaction(() => {
      ins(store, 1);
      try {
        store.transaction(() => {
          ins(store, 2);
          store.transaction(() => {
            ins(store, 3);
          });
          throw new Error('middle failure');
        });
      } catch (e) {
        assert.equal((e as Error).message, 'middle failure');
      }
    });
    assert.deepEqual(rows(store), [1]);
  });
});

test('T-3-5e: an inner call given onBusyRetry while the write lock is contended is never retried', () => {
  withTable((store, dbPath) => {
    let retries = 0;
    store.transaction(() => {
      ins(store, 1);
      // Another process contends for the write lock the outer transaction holds:
      // its BEGIN IMMEDIATE must report SQLITE_BUSY, proving the lock is ours.
      const probe = [
        "const { DatabaseSync } = require('node:sqlite');",
        'const db = new DatabaseSync(process.argv[1]);',
        "db.exec('PRAGMA busy_timeout = 100');",
        "try { db.exec('BEGIN IMMEDIATE'); db.exec('ROLLBACK'); process.stdout.write('acquired'); }",
        "catch (e) { process.stdout.write(e.errcode === 5 ? 'busy' : 'error:' + e.message); }",
        'db.close();',
      ].join('\n');
      const out = execFileSync(process.execPath, ['-e', probe, dbPath], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      assert.equal(out, 'busy', 'the contending process sees the lock held');
      store.transaction(
        () => {
          ins(store, 2);
        },
        { onBusyRetry: () => { retries += 1; } }
      );
    });
    assert.equal(retries, 0, 'onBusyRetry must never fire below depth 0');
    assert.deepEqual(rows(store), [1, 2]);
  });
});

test('T-3-5f: mustExist on a missing path throws StoreMissing and creates nothing; an existing WAL store at a path with space, # and ? opens', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-mustexist-f-'));
  try {
    const missing = path.join(dir, 'missing.db');
    assert.throws(() => openStore(missing, { mustExist: true }), StoreMissing);
    assert.equal(existsSync(missing), false, 'the missing path must not be created');

    const oddDir = path.join(dir, 'a b#c?d');
    mkdirSync(oddDir);
    const odd = path.join(oddDir, 'store #1?.db');
    const created = openStore(odd); // default: create-if-missing
    created.exec('CREATE TABLE t(x INTEGER)');
    created.prepare('INSERT INTO t(x) VALUES(7)').run();
    created.close();

    const reopened = openStore(odd, { mustExist: true });
    try {
      assert.deepEqual(rows(reopened), [7], 'the existing store opens with its row');
      const mode = reopened.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
      assert.equal(mode.journal_mode, 'wal');
    } finally {
      reopened.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('T-3-5g: mustExist on a path in a missing directory throws StoreMissing and creates no directory', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-mustexist-g-'));
  try {
    const missingDir = path.join(dir, 'no-such-dir');
    assert.throws(() => openStore(path.join(missingDir, 'store.db'), { mustExist: true }), StoreMissing);
    assert.equal(existsSync(missingDir), false, 'the missing directory must not be created');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("T-3-5h: mustExist on a path that is a directory throws StoreUnreadable with pathKind 'directory'", () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-mustexist-h-'));
  try {
    const asDir = path.join(dir, 'store.db');
    mkdirSync(asDir);
    let caught: unknown;
    try {
      openStore(asDir, { mustExist: true });
    } catch (e) {
      caught = e;
    }
    assert.ok(caught instanceof StoreUnreadable, `expected StoreUnreadable, got ${String(caught)}`);
    assert.equal(caught instanceof StoreMissing, false, 'a directory is not a missing store');
    assert.equal(caught.pathKind, 'directory');
    assert.equal(caught.path, asDir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---- Added by the 2026-09-26 independent build review (docs/reviews/2026-09-26-steps-1-12-build-review.md).
// Both cases are stated in Step 3's build delta: "a `stat` that fails with
// `ENOENT` or `ENOTDIR` throws the typed `StoreMissing` ...; any other outcome
// — ... or `stat` fails with another errno — throws the typed
// `StoreUnreadable` carrying {path, pathKind, errno, message} (`pathKind` null
// when the `stat` failed)". (g) and (h) above exercise only ENOENT and an
// existing directory, so neither branch below was pinned.

test('T-3-5g2 (review): mustExist on a path whose parent is a regular file (stat ENOTDIR) throws StoreMissing', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-mustexist-g2-'));
  try {
    const parentFile = path.join(dir, 'not-a-dir');
    writeFileSync(parentFile, 'x');
    const p = path.join(parentFile, 'store.db');
    let caught: unknown;
    try {
      openStore(p, { mustExist: true });
    } catch (e) {
      caught = e;
    }
    assert.ok(caught instanceof StoreMissing, `expected StoreMissing for ENOTDIR, got ${String(caught)}`);
    assert.ok((caught as Error).message.includes(p), 'the path is in its message');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('T-3-5h2 (review): mustExist on a path whose stat fails with another errno (ELOOP) throws StoreUnreadable with pathKind null and that errno', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-mustexist-h2-'));
  try {
    const a = path.join(dir, 'loop-a');
    const b = path.join(dir, 'loop-b');
    symlinkSync(b, a);
    symlinkSync(a, b);
    let caught: unknown;
    try {
      openStore(a, { mustExist: true });
    } catch (e) {
      caught = e;
    }
    assert.ok(caught instanceof StoreUnreadable, `expected StoreUnreadable, got ${String(caught)}`);
    assert.equal(caught instanceof StoreMissing, false, 'a symlink loop is not a missing store');
    assert.equal(caught.pathKind, null, 'pathKind is null when the stat failed');
    assert.equal(caught.errno, 'ELOOP');
    assert.equal(caught.path, a);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---- Case (i), added for the fix that follows the Steps 1–12 build review
// (docs/reviews/2026-09-26-steps-1-12-build-review.md S1), written from plan
// T-3-5 case (i) and Step 3's delta as amended by commit ca67af7:
// "`PRAGMA max_page_count` is capped just above the table's size; the outer
// inserts 1, an inner call inserts a row too large to fit (`SQLITE_FULL`), the
// outer catches that error, inserts 3, and returns. If the engine kept the
// transaction, the result is case (b)'s shape: rows {1, 3}, no throw. If it
// abandoned it, the outer call throws `TransactionAborted` and the table is
// empty. Either way rows {3} alone — the executed defect — fails the test; the
// test records which branch the engine took."
// And Step 3: "while aborted, every `transaction` call and every statement run
// through the `Store` throws `TransactionAborted` until the depth-0 call
// unwinds, which clears the mark and rethrows."

/** Cap the file just above its current size (the review's page_count + 2). */
function capPages(store: Store): void {
  const { page_count } = store.prepare('PRAGMA page_count').get() as { page_count: number };
  store.exec(`PRAGMA max_page_count = ${page_count + 2}`);
}

function insertTooLarge(store: Store): void {
  store.prepare('INSERT INTO t(x) VALUES(randomblob(200000))').run();
}

/**
 * Whether the write lock is free, observed from a second connection (engine
 * state, independent of the adapter's bookkeeping): a held lock makes its
 * BEGIN IMMEDIATE busy through the one retry (StoreBusy).
 */
function writeLockFree(dbPath: string): boolean {
  const other = openStore(dbPath);
  try {
    other.transaction(() => undefined);
    return true;
  } catch (e) {
    if (e instanceof StoreBusy) return false;
    throw e;
  } finally {
    other.close();
  }
}

test('T-3-5i: engine-abandoned transaction — rows {1, 3} with no throw, or TransactionAborted with no rows; never {3} alone', (t) => {
  withTable((store) => {
    capPages(store);
    let innerErr: unknown;
    let outerErr: unknown;
    try {
      store.transaction(() => {
        ins(store, 1);
        try {
          store.transaction(() => {
            insertTooLarge(store);
          });
        } catch (e) {
          innerErr = e; // the unit of work catches the inner error and continues
        }
        ins(store, 3);
      });
    } catch (e) {
      outerErr = e;
    }
    const after = rows(store);
    assert.notEqual(innerErr, undefined, 'precondition: the too-large inner insert failed');

    if (outerErr === undefined) {
      t.diagnostic('T-3-5i branch: the engine KEPT the transaction (case (b) shape)');
      assert.deepEqual(after, [1, 3], 'a kept transaction yields case (b)\'s rows {1, 3}');
    } else {
      t.diagnostic(`T-3-5i branch: the engine ABANDONED the transaction; outer threw ${String(outerErr)}`);
      assert.ok(
        outerErr instanceof TransactionAborted,
        `an abandoned transaction must surface as TransactionAborted, got ${String(outerErr)}; rows ${JSON.stringify(after)}`
      );
      assert.deepEqual(after, [], 'an abandoned transaction leaves the table empty');
    }
    assert.notDeepEqual(after, [3], 'rows {3} alone is the executed defect (row 3 durable without row 1)');
  });
});

test('T-3-5i2: while the transaction is aborted, every statement and transaction call through the Store throws TransactionAborted; the depth-0 unwind rethrows it and clears the mark', (t) => {
  withTable((store, dbPath) => {
    capPages(store);
    let abandoned: boolean | undefined;
    let innerErr: unknown;
    const whileAborted: Array<[string, unknown]> = [];
    const attempt = (label: string, fn: () => unknown): void => {
      try {
        fn();
        whileAborted.push([label, undefined]);
      } catch (e) {
        whileAborted.push([label, e]);
      }
    };
    let outerErr: unknown;
    try {
      store.transaction(() => {
        ins(store, 1);
        try {
          store.transaction(() => {
            insertTooLarge(store);
          });
        } catch (e) {
          innerErr = e;
        }
        abandoned = writeLockFree(dbPath);
        if (!abandoned) return;
        attempt('prepare().run (INSERT)', () => ins(store, 3));
        attempt('prepare().get (SELECT)', () => store.prepare('SELECT count(*) AS n FROM t').get());
        attempt('prepare().all (SELECT)', () => store.prepare('SELECT x FROM t').all());
        attempt('exec', () => store.exec('INSERT INTO t(x) VALUES(4)'));
        attempt('nested transaction', () => store.transaction(() => ins(store, 5)));
      });
    } catch (e) {
      outerErr = e;
    }
    if (abandoned === false) {
      t.skip('this engine kept the transaction after SQLITE_FULL; the aborted state is unreachable here');
      return;
    }
    t.diagnostic('T-3-5i2: the engine abandoned the transaction (the write lock was free after SQLITE_FULL)');
    assert.ok(innerErr instanceof TransactionAborted, `the inner call throws TransactionAborted, got ${String(innerErr)}`);
    for (const [label, err] of whileAborted) {
      assert.ok(err instanceof TransactionAborted, `${label} while aborted must throw TransactionAborted, got ${String(err)}`);
    }
    assert.ok(outerErr instanceof TransactionAborted, `the depth-0 call rethrows TransactionAborted, got ${String(outerErr)}`);
    assert.deepEqual(rows(store), [], 'nothing of the aborted unit is durable');

    // The depth-0 unwind cleared the mark: the handle works again.
    store.transaction(() => ins(store, 9));
    assert.deepEqual(rows(store), [9], 'a later unit of work commits normally');
  });
});

// ---- Case (j) — busyTimeoutMs (plan Step 3 at e4b4455; AD-26 as corrected
// after CI on 821c835 failed T-13-5b with the miner raising StoreBusy) --------
//
// Step 3: "a store opened with `busyTimeoutMs: 5000` completes a write while a
// second process holds the lock for 1 s; one opened with the default raises
// `StoreBusy`" (default busy_timeout 100 ms + one retry, well under 1 s).

/** A second process: BEGIN IMMEDIATE + insert, writes `<marker>`, holds the lock 1 s, commits. */
function holdLockFor1s(dbPath: string, marker: string): Promise<number | null> {
  const holder = [
    "const { DatabaseSync } = require('node:sqlite');",
    "const { writeFileSync } = require('node:fs');",
    'const [dbPath, marker] = process.argv.slice(1);',
    'const db = new DatabaseSync(dbPath);',
    "db.exec('PRAGMA busy_timeout = 100');",
    "db.exec('BEGIN IMMEDIATE');",
    "db.exec('INSERT INTO t(x) VALUES(100)');",
    "writeFileSync(marker, 'holding');",
    'Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);',
    "db.exec('COMMIT');",
    'db.close();',
  ].join('\n');
  const child = spawn(process.execPath, ['-e', holder, dbPath, marker], { stdio: ['ignore', 'ignore', 'inherit'] });
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => resolve(code));
  });
}

async function waitForFile(p: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (!existsSync(p)) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${p}`);
    await new Promise((r) => setTimeout(r, 5));
  }
}

test('T-3-5j: busyTimeoutMs 5000 waits out a 1 s lock and commits; the default raises StoreBusy', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-busy-'));
  const dbPath = path.join(dir, 'store.db');
  const setup = openStore(dbPath);
  setup.exec('CREATE TABLE t(x INTEGER)');
  setup.close();
  try {
    // A store opened with busyTimeoutMs 5000 completes its write.
    const patient = openStore(dbPath, { busyTimeoutMs: 5000 });
    try {
      const held = holdLockFor1s(dbPath, path.join(dir, 'held-1'));
      await waitForFile(path.join(dir, 'held-1'));
      let outcome = 'committed';
      try {
        patient.transaction(() => ins(patient, 1));
      } catch (e) {
        outcome = e instanceof StoreBusy ? 'StoreBusy' : `error: ${String(e)}`;
      }
      assert.equal(await held, 0, 'the lock holder committed');
      assert.equal(outcome, 'committed', 'a store opened with busyTimeoutMs 5000 did not complete its write while the lock was held for 1 s');
      assert.deepEqual(rows(patient), [1, 100]);
    } finally {
      patient.close();
    }

    // A store opened with the default raises StoreBusy.
    const hasty = openStore(dbPath);
    try {
      const held = holdLockFor1s(dbPath, path.join(dir, 'held-2'));
      await waitForFile(path.join(dir, 'held-2'));
      assert.throws(() => hasty.transaction(() => ins(hasty, 2)), StoreBusy, 'the default-opened store did not raise StoreBusy');
      assert.equal(await held, 0);
      assert.deepEqual(rows(hasty), [1, 100, 100], 'the default-opened store wrote nothing');
    } finally {
      hasty.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
