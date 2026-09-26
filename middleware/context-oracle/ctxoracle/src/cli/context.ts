// Opening a repository's stores from a working directory — shared by the CLI
// verbs. WALKING SKELETON (the plan has no shared helper for this; each verb
// step repeats the sequence).
import { existsSync } from 'node:fs';
import path from 'node:path';
import { openStore, probeFts5, type Store } from '../stores/adapter.js';
import { ctxoracleHome } from '../identity/home.js';
import { ensureLayout, type Layout } from '../identity/layout.js';
import { resolveRepoKey, type RepoKey } from '../identity/repo_key.js';
import { applyMigrations } from '../stores/migration_runner.js';
import { seedDefaults } from '../stores/dao/tuning.js';
import { schemaMetaDao } from '../stores/dao/schema_meta.js';

export function repoRootOf(cwd: string): string {
  let dir = path.resolve(cwd);
  for (;;) {
    if (existsSync(path.join(dir, '.git'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return path.resolve(cwd);
    dir = up;
  }
}

export interface OpenedRepo {
  repoPath: string;
  key: RepoKey;
  layout: Layout;
  project: Store;
  global: Store;
}

/** Open (and with `create`, migrate and seed) the stores for the repository at `cwd`. */
export function openRepo(cwd: string, create: boolean): OpenedRepo | null {
  const repoPath = repoRootOf(cwd);
  const key = resolveRepoKey(repoPath);
  const layout = ensureLayout(ctxoracleHome(), key.key);
  if (!create && !existsSync(layout.project)) return null;
  // SKELETON: 13 — both stores open with the off-path wait (AD-26; Step 3's
  // busyTimeoutMs 5000), so the `index`/`init` verbs' miner cannot abort on
  // StoreBusy against a live session (plan §9 row "Step 13's skeleton store
  // opener"); retired by Step 35
  const project = openStore(layout.project, { busyTimeoutMs: 5000 });
  const global = openStore(layout.global, { busyTimeoutMs: 5000 });
  if (create) {
    applyMigrations(project, { fts: probeFts5(project) });
    applyMigrations(global, { fts: false, scope: 'global' });
    seedDefaults(global);
    const meta = schemaMetaDao(project);
    if (meta.get('store_created_at') === undefined) meta.set('store_created_at', String(Date.now()));
  }
  return { repoPath, key, layout, project, global };
}
