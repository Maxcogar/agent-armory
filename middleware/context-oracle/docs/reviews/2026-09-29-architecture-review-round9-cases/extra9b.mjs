// extra9b.mjs <work> <build> — round-9 reviewer's case V4 against the committed round-8
// prototype, unchanged: an owner table whose rows all read by a table scan, with only its
// primary-key index's root page overwritten (the round-8 evidence's Y5c mechanism, applied
// to an owner table): human_facts on store B (b229c04 layout) and corrections on store C
// (4dd0f00/4e070ce layout).
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { closeSync, cpSync, mkdirSync, openSync, realpathSync, rmSync, writeSync } from 'node:fs';
import path from 'node:path';

const R8 = '/home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8';
const { legacyNotCarried } = await import(path.join(R8, 'rebuild.mjs'));
const W = path.resolve(process.argv[2]), B = path.resolve(process.argv[3]);
const { resolveRepoKey } = await import(path.join(B, 'middleware/context-oracle/ctxoracle/dist/src/identity/repo_key.js'));
const keyOf = (repo) => resolveRepoKey(realpathSync(repo)).key;
const T = path.join(W, 'test9'); mkdirSync(T, { recursive: true });
const env = { ...process.env }; delete env.GIT_DIR; delete env.GIT_WORK_TREE; delete env.REBUILD_KILL_AT; delete env.REBUILD_FAULT;
const run = (home, repo) => spawnSync(process.execPath, ['--no-warnings', path.join(R8, 'rebuild.mjs'), '--home', home, '--repo', repo, '--head', B], { env, encoding: 'utf8' });

for (const [L, table] of [['B', 'human_facts'], ['C', 'corrections']]) {
  const d = path.join(T, `V4-${L}`); rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, `oracle${L}`), d, { recursive: true });
  const repo = path.join(W, `repo${L}`), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const x = new DatabaseSync(lp); x.exec('PRAGMA wal_checkpoint(TRUNCATE)'); x.exec('PRAGMA journal_mode = DELETE');
  const ps = x.prepare('PRAGMA page_size').get().page_size;
  const idx = x.prepare("SELECT name, rootpage FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND name LIKE 'sqlite_autoindex_%' ORDER BY name LIMIT 1").get(table);
  x.close();
  const fd = openSync(lp, 'r+'); writeSync(fd, Buffer.alloc(ps, 0xa5), 0, ps, (idx.rootpage - 1) * ps); closeSync(fd);
  const y = new DatabaseSync(lp, { readOnly: true });
  const scan = y.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all().length;
  let count; try { count = y.prepare(`SELECT count(*) n FROM ${table}`).get().n; } catch (e) { count = `throws: ${e.message}`; }
  y.close();
  const r = run(d, repo);
  const o = JSON.parse(r.stdout)[1];
  const entry = (o.unplaced ?? []).filter((u) => u.unread);
  const nd = new DatabaseSync(np, { readOnly: true }); const carried = nd.prepare(`SELECT count(*) n FROM ${table}`).get().n; nd.close();
  console.log(`V4 ${L}: ${idx.name} (root page ${idx.rootpage}) overwritten; in the legacy file a table scan of ${table} reads ${scan} rows, count(*) ${JSON.stringify(count)}; rebuild exit ${r.status} project ${o.state} layout ${o.layout}; unread entries ${JSON.stringify(entry)}; digest recorded ${o.legacyDigests?.[table] === null ? 'null' : 'non-null'}, count recorded ${JSON.stringify(o.legacyCounts?.[table])}; ${table} rows in the rebuilt store ${carried}; legacy-file rule ${JSON.stringify(legacyNotCarried('project', lp, np))}`);
}
