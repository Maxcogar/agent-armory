// Migration runner (Step 7, AD-4, AD-5, AD-25). `applyMigrations` is the ONLY
// writer of `schema_meta.fts_state` and of the schema-version rows; `init` (Step
// 31) is its only production caller, and test setup (Step 28's replay harness,
// Step 29's large-store generator) builds stores through this same function —
// never through DDL of its own, so the schema always comes from the migration
// files.
//
// Forward-only: an already-migrated store (version >= 1) is left untouched, so a
// store's fts_state — recorded once, from init's probeFts5 result at creation —
// is never retried (a re-run with the opposite flag is a no-op; recovery from a
// wrong fts_state is deinit --purge + init, AD-25/Q7).
//
// The scope selects the migration set: 'project' (001 + conditional 001b) or
// 'global' (002). The `.sql` files are read at runtime from the package's own
// src/ tree (shipped beside dist/), so tsc — which emits no .sql — needs no copy
// step.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Store } from './adapter.js';

export type MigrationScope = 'project' | 'global';

// dist/src/stores/migration_runner.js -> ../../../src/stores/migrations
const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../src/stores/migrations'
);

function readSql(name: string): string {
  return readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8');
}

function tableExists(store: Store, name: string): boolean {
  const row = store
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name);
  return row !== undefined && row !== null;
}

/** The recorded schema version of `metaTable`, or 0 when the store is empty. */
function currentVersion(store: Store, metaTable: 'schema_meta' | 'global_meta'): number {
  if (!tableExists(store, metaTable)) return 0;
  const row = store.prepare(`SELECT value FROM ${metaTable} WHERE key = 'schema_version'`).get() as
    | { value: string | null }
    | undefined;
  if (row === undefined || row.value === null) return 0;
  const n = Number.parseInt(row.value, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Apply the Phase A migrations for `scope` (default 'project') to `store`. */
export function applyMigrations(store: Store, opts: { fts: boolean; scope?: MigrationScope }): void {
  if ((opts.scope ?? 'project') === 'project') applyProject(store, opts.fts);
  else applyGlobal(store);
}

function applyProject(store: Store, fts: boolean): void {
  if (currentVersion(store, 'schema_meta') >= 1) return; // forward-only
  store.transaction(() => {
    store.exec(readSql('001_phase_a_project.sql'));
    // Record fts_state once, from the fts argument, between 001 and 001b.
    const existing = store.prepare("SELECT value FROM schema_meta WHERE key = 'fts_state'").get();
    if (existing === undefined) {
      store
        .prepare("INSERT INTO schema_meta(key, value) VALUES('fts_state', ?)")
        .run(fts ? 'fts5' : 'fallback');
    }
    const state = (
      store.prepare("SELECT value FROM schema_meta WHERE key = 'fts_state'").get() as { value: string }
    ).value;
    if (state === 'fts5') store.exec(readSql('001b_phase_a_fts.sql'));
    store.prepare("INSERT OR REPLACE INTO schema_meta(key, value) VALUES('schema_version', '1')").run();
  });
}

function applyGlobal(store: Store): void {
  if (currentVersion(store, 'global_meta') >= 1) return; // forward-only
  store.transaction(() => {
    store.exec(readSql('002_phase_a_global.sql'));
    store.prepare("INSERT OR REPLACE INTO global_meta(key, value) VALUES('schema_version', '1')").run();
  });
}
