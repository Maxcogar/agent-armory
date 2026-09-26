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
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, StoreMissing, StoreUnreadable, type Store } from '../../src/stores/adapter.js';

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
