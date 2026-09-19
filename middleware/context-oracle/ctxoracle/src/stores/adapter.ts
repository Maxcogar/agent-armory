// The ONLY file in the codebase that imports node:sqlite (Step 3, AD-2, AD-26).
// Every other component consumes the `Store` interface, so node:sqlite's
// Experimental API surface is quarantined behind this one seam. A convention
// test (sqlite_single_importer.test.ts) enforces the single-importer rule.

import { DatabaseSync } from 'node:sqlite';

/** Raised when a write cannot acquire the lock after the one bounded retry. */
export class StoreBusy extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreBusy';
  }
}

const SQLITE_BUSY = 5;
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
   * Run `fn` inside a single `BEGIN IMMEDIATE` transaction. On SQLITE_BUSY the
   * whole acquire-and-run is retried once; a second SQLITE_BUSY raises
   * `StoreBusy` (the caller turns that into a `store_busy` fault and fails open,
   * AD-26). Any non-busy error rolls back and propagates unchanged.
   */
  transaction<T>(fn: () => T): T;
  /** `PRAGMA quick_check` — used only off the event path (AD-17). */
  integrityCheck(): 'ok' | 'failed';
  /** Consistent snapshot to `destPath` via `VACUUM INTO` (AD-5, V17). */
  exportTo(destPath: string): void;
  close(): void;
}

export function openStore(dbPath: string): Store {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 100');

  const cache = new Map<string, Statement>();
  function prepare(sql: string): Statement {
    let st = cache.get(sql);
    if (st === undefined) {
      st = db.prepare(sql) as unknown as Statement;
      cache.set(sql, st);
    }
    return st;
  }

  function transaction<T>(fn: () => T): T {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        db.exec('BEGIN IMMEDIATE');
      } catch (e) {
        lastErr = e;
        if (isBusy(e)) continue; // could not even acquire — retry once
        throw e;
      }
      try {
        const result = fn();
        db.exec('COMMIT');
        return result;
      } catch (e) {
        try {
          db.exec('ROLLBACK');
        } catch {
          /* ignore rollback failure; the original error is what matters */
        }
        lastErr = e;
        if (isBusy(e)) continue; // lost the write race — retry once
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
    exec: (sql: string): void => db.exec(sql),
    transaction,
    integrityCheck(): 'ok' | 'failed' {
      const row = db.prepare('PRAGMA quick_check').get() as { quick_check?: string } | undefined;
      return row?.quick_check === 'ok' ? 'ok' : 'failed';
    },
    exportTo(destPath: string): void {
      // VACUUM INTO requires a single-quoted SQL string literal; a double-quoted
      // path is parsed as an identifier (verified against the runtime, §11.4).
      const escaped = destPath.replace(/'/g, "''");
      db.exec(`VACUUM INTO '${escaped}'`);
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
 * indexed LIKE queries.
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
