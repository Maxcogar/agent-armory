// The ONLY file in the codebase that imports node:sqlite (Step 3, AD-2, AD-26).
// Every other component consumes the `Store` interface, so node:sqlite's
// Experimental API surface is quarantined behind this one seam. A convention
// test (sqlite_single_importer.test.ts) enforces the single-importer rule.

import { statSync } from 'node:fs';
import { backup, DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

/** Raised when a write cannot acquire the lock after the one bounded retry. */
export class StoreBusy extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreBusy';
  }
}

/**
 * Raised when the transaction a unit of work holds is gone: SQLite rolled the
 * whole transaction back on its own (after SQLITE_FULL, SQLITE_IOERR,
 * SQLITE_NOMEM or SQLITE_BUSY — "Response To Errors Within A Transaction",
 * sqlite.org/lang_transaction.html), or a savepoint's undo failed. Once raised,
 * every `transaction` call and every statement run through the `Store` throws
 * it until the depth-0 `transaction` call unwinds, which clears the mark and
 * rethrows it; nothing of the unit is committed (Step 3; Steps 1-12 build
 * review S1). `cause` is the error that ended the transaction, when known.
 */
export class TransactionAborted extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'TransactionAborted';
  }
}

const SQLITE_BUSY = 5;
const SQLITE_CANTOPEN = 14;
function isBusy(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { errcode?: number }).errcode === SQLITE_BUSY;
}

export interface Statement {
  run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export interface Store {
  /** Prepared-statement wrapper (cached by SQL text). */
  prepare(sql: string): Statement;
  /** Execute SQL directly (DDL, PRAGMAs). */
  exec(sql: string): void;
  /**
   * Run `fn` as one unit of work. Re-entrant (AD-26; gap-list review G9): the
   * handle keeps a depth counter. At depth 0 the call issues `BEGIN IMMEDIATE`,
   * runs `fn`, and `COMMIT`s; on SQLITE_BUSY the whole acquire-and-run is
   * retried once; a second SQLITE_BUSY raises `StoreBusy` (the caller turns that
   * into a `store_busy` fault and fails open). Any non-busy error rolls back and
   * propagates unchanged — including everything nested calls released. At depth
   * > 0 the call issues `SAVEPOINT sp<depth>`, runs `fn`, and `RELEASE`s it; on
   * a throw it issues `ROLLBACK TO` + `RELEASE` and rethrows. There is no busy
   * retry at depth > 0 (the write lock is already held) and `opts.onBusyRetry`
   * is ignored there. After a throw at depth > 0, if the engine has ended the
   * transaction itself (`db.isTransaction` false), the `ROLLBACK TO` is
   * skipped, the handle is marked aborted and the call throws
   * `TransactionAborted`; while aborted every `transaction` call and every
   * statement through the `Store` throws `TransactionAborted` until the depth-0
   * call unwinds, which clears the mark and rethrows (Steps 1-12 review S1).
   *
   * `opts.onBusyRetry`, when supplied, is invoked exactly once — after the first
   * attempt's SQLITE_BUSY, before the retry — and takes no part in the
   * transaction (it runs outside BEGIN/COMMIT and cannot affect the row set). It
   * is the deterministic observation seam T-3-3 uses to sequence the
   * retry-then-succeed path: a contending worker signals its first-attempt busy
   * and blocks inside it until the lock is released. Production callers omit it,
   * and behaviour is then identical to a bare `transaction(fn)`.
   */
  transaction<T>(fn: () => T, opts?: { onBusyRetry?: () => void }): T;
  /** `PRAGMA quick_check` — used only off the event path (AD-17). */
  integrityCheck(): 'ok' | 'failed';
  /** Consistent snapshot to `destPath` via `VACUUM INTO` (AD-5, V17). */
  exportTo(destPath: string): void;
  close(): void;
}

/**
 * Raised by `openStore(path, {mustExist: true})` when the store file does not
 * exist: SQLite refused the open and a follow-up `stat` failed with `ENOENT` or
 * `ENOTDIR` (the path is in its `message`). Step 3 build delta, N15.
 */
export class StoreMissing extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreMissing';
  }
}

/**
 * Raised by `openStore(path, {mustExist: true})` when SQLite refuses the open
 * and the path exists (a directory, a file the process cannot open) or `stat`
 * fails with an errno other than `ENOENT`/`ENOTDIR` (`pathKind` null then).
 * A CANTOPEN alone cannot say "deleted" — only the `stat` can (collapse-hunt H8).
 */
export class StoreUnreadable extends Error {
  readonly path: string;
  readonly pathKind: 'file' | 'directory' | 'other' | null;
  readonly errno: string | null;
  constructor(info: {
    path: string;
    pathKind: 'file' | 'directory' | 'other' | null;
    errno: string | null;
    message: string;
  }) {
    super(info.message);
    this.name = 'StoreUnreadable';
    this.path = info.path;
    this.pathKind = info.pathKind;
    this.errno = info.errno;
  }
}

/**
 * Classify a CANTOPEN refusal of a `mustExist` open. Nothing was created by the
 * refused open, so the `stat` cannot race a file this call made.
 */
function cantOpenError(dbPath: string, cause: unknown): Error {
  let pathKind: 'file' | 'directory' | 'other' | null;
  let errno: string | null = null;
  try {
    const st = statSync(dbPath);
    pathKind = st.isFile() ? 'file' : st.isDirectory() ? 'directory' : 'other';
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code ?? null;
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      return new StoreMissing(`store missing: ${dbPath}`);
    }
    pathKind = null;
    errno = code;
  }
  const why = (cause as { message?: string })?.message ?? String(cause);
  return new StoreUnreadable({
    path: dbPath,
    pathKind,
    errno,
    message: `store unreadable: ${dbPath} (${pathKind ?? `stat ${errno ?? 'failed'}`}): ${why}`,
  });
}

/**
 * Open the store at `dbPath` in WAL mode with `foreign_keys=ON` and
 * `busy_timeout` = `opts.busyTimeoutMs` (default 100, the event path's value;
 * the miner, the indexer and the CLI verbs open with 5000 — AD-26's off-path
 * wait, Step 3). The retry-once rule is unchanged. With `opts.mustExist` the file is opened through a
 * `file:` URI with `mode=rw`, so a missing store is never created (N15); a
 * refusal throws `StoreMissing` or `StoreUnreadable` (see `cantOpenError`).
 * Default: create-if-missing (init, the replay harness, store-creating verbs).
 */
export function openStore(dbPath: string, opts?: { mustExist?: boolean; busyTimeoutMs?: number }): Store {
  const busyTimeoutMs = opts?.busyTimeoutMs ?? 100;
  // The value is interpolated into a PRAGMA, so only a non-negative integer is accepted.
  if (!Number.isInteger(busyTimeoutMs) || busyTimeoutMs < 0) {
    throw new RangeError(`openStore: busyTimeoutMs must be a non-negative integer, not ${String(busyTimeoutMs)}`);
  }
  let db: DatabaseSync;
  if (opts?.mustExist === true) {
    try {
      db = new DatabaseSync(`${pathToFileURL(dbPath).href}?mode=rw`);
    } catch (e) {
      if ((e as { errcode?: number }).errcode === SQLITE_CANTOPEN) throw cantOpenError(dbPath, e);
      throw e;
    }
  } else {
    db = new DatabaseSync(dbPath);
  }
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`PRAGMA busy_timeout = ${busyTimeoutMs}`);

  // Re-entrancy depth: 0 = no transaction open on this handle (AD-26, G9).
  let depth = 0;
  // Set when the unit of work's transaction is gone (engine auto-rollback, or a
  // failed savepoint undo) while depth > 0; cleared only by the depth-0 frame.
  // While set, every statement and `transaction` call throws TransactionAborted,
  // so a caller that caught an inner error can never autocommit later writes
  // one by one (Step 3; Steps 1-12 build review S1).
  let aborted = false;

  function abortedError(cause?: unknown): TransactionAborted {
    const why = cause === undefined ? '' : `: ${String((cause as { message?: string })?.message ?? cause)}`;
    return new TransactionAborted(
      `transaction aborted at ${dbPath}: the unit of work's transaction was rolled back${why}`,
      cause === undefined ? undefined : { cause }
    );
  }

  /**
   * Run one statement-level operation. While aborted it throws
   * TransactionAborted without touching the engine. When it throws inside a
   * unit of work (depth > 0) and the engine no longer has a transaction open
   * (`db.isTransaction`, node:sqlite >= 22.16.0 — the engines floor), the handle
   * is marked aborted and the original error propagates.
   */
  function guarded<T>(op: () => T): T {
    if (aborted) throw abortedError();
    try {
      return op();
    } catch (e) {
      if (depth > 0 && !db.isTransaction) aborted = true;
      throw e;
    }
  }

  const cache = new Map<string, Statement>();
  function prepare(sql: string): Statement {
    if (aborted) throw abortedError();
    let st = cache.get(sql);
    if (st === undefined) {
      const raw = db.prepare(sql);
      st = {
        run: (...params: unknown[]) =>
          guarded(() => raw.run(...(params as never[]))) as ReturnType<Statement['run']>,
        get: (...params: unknown[]) => guarded(() => raw.get(...(params as never[]))),
        all: (...params: unknown[]) => guarded(() => raw.all(...(params as never[]))),
      };
      cache.set(sql, st);
    }
    return st;
  }

  function nested<T>(fn: () => T): T {
    if (aborted) throw abortedError();
    const name = `sp${depth}`;
    guarded(() => db.exec(`SAVEPOINT ${name}`));
    depth += 1;
    let result: T;
    try {
      result = fn();
    } catch (e) {
      depth -= 1;
      // The engine may have ended the whole transaction (then the savepoint is
      // gone and ROLLBACK TO would fail): skip the undo and poison the unit.
      if (aborted || !db.isTransaction) {
        aborted = true;
        throw e instanceof TransactionAborted ? e : abortedError(e);
      }
      try {
        db.exec(`ROLLBACK TO ${name}`);
        db.exec(`RELEASE ${name}`);
      } catch (undoErr) {
        // The savepoint's writes could not be undone, so the unit is no longer
        // atomic: poison it so the depth-0 frame rolls everything back.
        aborted = true;
        throw abortedError(undoErr);
      }
      throw e;
    }
    depth -= 1;
    // fn returned, but an abort inside it was caught and swallowed there: the
    // unit's work is gone, so this call must not report success.
    if (aborted) throw abortedError();
    guarded(() => db.exec(`RELEASE ${name}`));
    return result;
  }

  function transaction<T>(fn: () => T, opts?: { onBusyRetry?: () => void }): T {
    // Below depth 0 the write lock is already held: a savepoint, no busy retry,
    // and `onBusyRetry` is ignored.
    if (depth > 0) return nested(fn);
    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        db.exec('BEGIN IMMEDIATE');
      } catch (e) {
        lastErr = e;
        // could not even acquire — retry once; fire the seam only on the first
        // (attempt 0) busy, so it runs exactly once, between the two attempts.
        if (isBusy(e)) {
          if (attempt === 0) opts?.onBusyRetry?.();
          continue;
        }
        throw e;
      }
      depth = 1;
      try {
        const result = fn();
        // fn returned after catching an abort: nothing of the unit may commit.
        if (aborted) throw abortedError();
        db.exec('COMMIT');
        depth = 0;
        return result;
      } catch (e) {
        depth = 0;
        // The depth-0 unwind clears the abort mark and rethrows.
        aborted = false;
        // Skip ROLLBACK when the engine has already ended the transaction
        // (auto-rollback); otherwise undo everything the unit wrote.
        if (db.isTransaction) {
          try {
            db.exec('ROLLBACK');
          } catch {
            /* the original error is what the caller needs */
          }
        }
        lastErr = e;
        if (isBusy(e)) {
          if (attempt === 0) opts?.onBusyRetry?.(); // lost the write race — retry once
          continue;
        }
        throw e;
      }
    }
    throw new StoreBusy(
      `store busy at ${dbPath}: lock held through one retry (${String(
        (lastErr as { message?: string })?.message ?? lastErr
      )})`
    );
  }

  return {
    prepare,
    exec: (sql: string): void => guarded(() => db.exec(sql)),
    transaction,
    integrityCheck(): 'ok' | 'failed' {
      const row = guarded(() => db.prepare('PRAGMA quick_check').get()) as { quick_check?: string } | undefined;
      return row?.quick_check === 'ok' ? 'ok' : 'failed';
    },
    exportTo(destPath: string): void {
      // VACUUM INTO requires a single-quoted SQL string literal; a double-quoted
      // path is parsed as an identifier (verified against the runtime, §11.4).
      const escaped = destPath.replace(/'/g, "''");
      guarded(() => db.exec(`VACUUM INTO '${escaped}'`));
    },
    close(): void {
      db.close();
    },
  };
}

/**
 * Defense-in-depth FTS5 capability probe (AD-2), called by `init` (Step 31):
 * create and drop a throwaway fts5 table inside a transaction, rolling back on
 * throw. Returns false when the runtime lacks FTS5, so search falls back to
 * token-prefix range queries over `symbol_tokens`/`path_tokens` (AD-2).
 */
export function probeFts5(store: Store): boolean {
  try {
    store.transaction(() => {
      store.exec('CREATE VIRTUAL TABLE _fts5_probe USING fts5(x)');
      store.exec('DROP TABLE _fts5_probe');
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy the database at `sourcePath` into `destinationPath` through node:sqlite's
 * module-level `backup()` (SQLite's online backup API), with the source opened
 * read-only (AD-5, G34). The import verb calls it twice (export -> temporary
 * file; temporary file -> live store). Unlike a file copy, the backup writes
 * through SQLite, so a destination another process holds open with
 * uncheckpointed WAL frames ends intact. It lives here because this file is
 * the only node:sqlite importer (AD-2).
 */
export async function backupFile(sourcePath: string, destinationPath: string): Promise<void> {
  const source = new DatabaseSync(sourcePath, { readOnly: true });
  try {
    await backup(source, destinationPath);
  } finally {
    source.close();
  }
}
