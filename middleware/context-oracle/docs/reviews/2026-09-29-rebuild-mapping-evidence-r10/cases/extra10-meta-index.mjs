// extra10-meta-index.mjs <work> <build> — R9-5's index-only case on the tables the round-9
// cases did not damage: the primary-key index of schema_meta (project) and of global_meta
// (global), on stores B and C, each on a fresh copy of the pristine store (never the source).
// AD-4 (round 9) says "The rebuild reads no index of the legacy file, so an index-only fault
// is neither observed nor recorded: every row is carried".
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { closeSync, cpSync, openSync, realpathSync, rmSync, writeSync } from 'node:fs';
import path from 'node:path';
const [W, HEADB] = process.argv.slice(2).map((p) => path.resolve(p));
const R = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'); // round-10 copy: this directory's rebuild.mjs (the reviewer's file named the round-9 directory)
const { legacyNotCarried } = await import(path.join(R, 'rebuild.mjs'));
const { resolveRepoKey } = await import(path.join(HEADB, 'middleware/context-oracle/ctxoracle/dist/src/identity/repo_key.js'));
const env = { ...process.env }; delete env.GIT_DIR; delete env.GIT_WORK_TREE; delete env.REBUILD_KILL_AT; delete env.REBUILD_FAULT;
for (const [L, scope] of [['B', 'project'], ['C', 'project'], ['B', 'global'], ['C', 'global']]) {
  const repo = path.join(W, `repo${L}`), key = resolveRepoKey(realpathSync(repo)).key;
  const home = path.join(W, '..', `meta-index-${L}-${scope}`); rmSync(home, { recursive: true, force: true }); cpSync(path.join(W, `oracle${L}`), home, { recursive: true });
  const lp = scope === 'project' ? path.join(home, 'projects', key, 'store.db') : path.join(home, 'global/global.db');
  const np = scope === 'project' ? path.join(home, 'projects', key, 'project.db') : path.join(home, 'global/global-store.db');
  const t = scope === 'project' ? 'schema_meta' : 'global_meta';
  const x = new DatabaseSync(lp); x.exec('PRAGMA wal_checkpoint(TRUNCATE)'); x.exec('PRAGMA journal_mode = DELETE');
  const ps = x.prepare('PRAGMA page_size').get().page_size;
  const idx = x.prepare(`SELECT name, rootpage FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND name LIKE 'sqlite_autoindex_%'`).get(t);
  x.close();
  const fd = openSync(lp, 'r+'); writeSync(fd, Buffer.alloc(ps, 0xa5), 0, ps, (idx.rootpage - 1) * ps); closeSync(fd);
  const y = new DatabaseSync(lp, { readOnly: true });
  const scan = y.prepare(`SELECT key FROM ${t} NOT INDEXED ORDER BY rowid`).all().map((r) => r.key);
  let ordered; try { ordered = y.prepare(`SELECT key, value FROM ${t} ORDER BY key`).all().length; } catch (e) { ordered = `throws: ${e.message}`; }
  y.close();
  const r = spawnSync(process.execPath, ['--no-warnings', path.join(R, 'rebuild.mjs'), '--home', home, '--repo', repo, '--head', HEADB], { env, encoding: 'utf8' });
  const out = JSON.parse(r.stdout), o = scope === 'project' ? out[1] : out[0];
  const n = new DatabaseSync(np, { readOnly: true });
  const carriedKeys = n.prepare(`SELECT key FROM ${t}`).all().map((q) => q.key);
  n.close();
  const lost = scan.filter((k) => ['store_created_at', 'settings_created_by_init', 'claude_dir_created_by_init', 'pinned_interpreter', 'identity', 'fold_watermark_audit', 'fold_watermark_corrections'].includes(k) && !carriedKeys.includes(k));
  const unread = (o.unplaced ?? []).filter((u) => u.unread);
  const rule = legacyNotCarried(scope, lp, np);
  console.log(`${L} ${scope}: ${idx.name} (root page ${idx.rootpage}) overwritten; a scan of ${t} reads ${scan.length} rows; the copy's query (ORDER BY key) ${JSON.stringify(ordered)}; rebuild exit ${r.status} ${o.state}; unread entries ${JSON.stringify(unread)}; ${t} digest ${o.legacyDigests?.[t] === null ? 'null' : 'non-null'}; carried as-is keys present in the legacy file but absent from the new store ${JSON.stringify(lost)}; legacy-file rule ${JSON.stringify(rule)}`);
  rmSync(home, { recursive: true, force: true });
}
