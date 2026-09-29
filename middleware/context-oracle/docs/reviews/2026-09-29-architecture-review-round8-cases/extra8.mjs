// extra8.mjs <work> <build> — round-8 review cases, against the committed round-7
// prototype (docs/reviews/2026-09-29-rebuild-mapping-evidence-r7/rebuild.mjs), unchanged.
// <work>: builds and stores copied from verify-rb.pU4N; <build>: the designed build.
//   Z3 (R7-6): a second clone of an already rebuilt repository while projects/ holds an
//       orphan legacy store: same key, a current store, no binding for the clone's root.
//   Z4 (R7-3): the owner rows of a file with one corrupt session_log page: readable in
//       the kept file, none in the rebuilt store.
//   Z5 (R7-4, R7-5): the rule after the home is reached by another spelling of its path
//       (a symlink), and after an import: "no rebuild record", with no counts.
//   Z6 (R7-8): a purge killed after unlinking project.db while project.db has a hot WAL;
//       then a store.db appears again (as an old build's write re-creates it) and the
//       prototype's rebuild renames its populated temporary file onto project.db.
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { closeSync, cpSync, copyFileSync, existsSync, mkdirSync, openSync, readdirSync, realpathSync, rmSync, symlinkSync, writeSync } from 'node:fs';
import path from 'node:path';
const R7 = '/home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r7';
const { legacyNotCarried, legacyProjects } = await import(path.join(R7, 'rebuild.mjs'));
const W = path.resolve(process.argv[2]), B = path.resolve(process.argv[3]);
const { resolveRepoKey } = await import(path.join(B, 'middleware/context-oracle/ctxoracle/dist/src/identity/repo_key.js'));
const keyOf = (r) => resolveRepoKey(realpathSync(r)).key;
const T = path.join(W, 'test8'); mkdirSync(T, { recursive: true });
const fresh = (name, src) => { const d = path.join(T, name); rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, src), d, { recursive: true }); return d; };
const env = () => { const e = { ...process.env }; delete e.GIT_DIR; delete e.GIT_WORK_TREE; delete e.REBUILD_KILL_AT; return e; };
const run = (home, repo, killAt) => spawnSync(process.execPath, ['--no-warnings', path.join(R7, 'rebuild.mjs'), '--home', home, '--repo', repo, '--head', B], { env: { ...env(), ...(killAt ? { REBUILD_KILL_AT: killAt } : {}) }, encoding: 'utf8' });
const purge = (dir, killAt) => spawnSync(process.execPath, ['--no-warnings', path.join(R7, 'rebuild.mjs'), '--purge-files', dir], { env: { ...env(), ...(killAt ? { REBUILD_KILL_AT: killAt } : {}) }, encoding: 'utf8' });
const q = (p, sql, ...a) => { const d = new DatabaseSync(p, { readOnly: true }); try { return d.prepare(sql).get(...a); } finally { d.close(); } };
const owner = ['human_facts', 'corrections', 'questions', 'invariants'];

// Z3
{
  const d = fresh('Z3', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const r1 = run(d, repo);
  mkdirSync(path.join(d, 'projects', 'deadbeef0000'), { recursive: true });
  copyFileSync(path.join(W, 'oracleB', 'projects', k, 'store.db'), path.join(d, 'projects', 'deadbeef0000', 'store.db'));
  const clone = path.join(T, 'Z3-clone'); rmSync(clone, { recursive: true, force: true });
  const c = spawnSync('git', ['clone', '-q', repo, clone], { env: env(), encoding: 'utf8' });
  const kc = keyOf(clone);
  const g = path.join(d, 'global/global-store.db');
  const bindOrig = q(g, 'SELECT value FROM global_meta WHERE key = ?', `repo_path:${realpathSync(repo)}`)?.value;
  const bindClone = q(g, 'SELECT value FROM global_meta WHERE key = ?', `repo_path:${realpathSync(clone)}`)?.value ?? null;
  const r2 = run(d, clone); // the child's analogue at the clone's root
  const bindAfter = q(g, 'SELECT value FROM global_meta WHERE key = ?', `repo_path:${realpathSync(clone)}`)?.value ?? null;
  const faults = q(path.join(d, 'projects', k, 'project.db'), "SELECT count(*) n FROM faults WHERE code = 'repo_not_bound'").n;
  console.log(`Z3: rebuild exit ${r1.status}; clone exit ${c.status}; key of repoB ${k}, key of the clone ${kc}, equal ${k === kc}; project.db of that key exists ${existsSync(path.join(d, 'projects', k, 'project.db'))}; legacy projects ${JSON.stringify(legacyProjects(d))}; binding of repoB ${bindOrig}; binding of the clone ${bindClone}; prototype run at the clone: exit ${r2.status} states ${r2.stdout.trim()}; binding of the clone after it ${bindAfter}; repo_not_bound rows ${faults}`);
}
// Z4, on store B (b229c04 layout) and store C (4dd0f00/4e070ce layout)
for (const L of ['B', 'C']) {
  const d = fresh(`Z4-${L}`, `oracle${L}`), repo = path.join(W, `repo${L}`), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const x = new DatabaseSync(lp); x.exec('PRAGMA wal_checkpoint(TRUNCATE)'); x.exec('PRAGMA journal_mode = DELETE');
  const ps = x.prepare('PRAGMA page_size').get().page_size, root = x.prepare("SELECT rootpage FROM sqlite_master WHERE name = 'session_log'").get().rootpage; x.close();
  const fd = openSync(lp, 'r+'); writeSync(fd, Buffer.alloc(ps, 0xa5), 0, ps, (root - 1) * ps); closeSync(fd);
  const r = run(d, repo);
  const legacyRows = owner.map((t) => { try { return `${t} ${q(lp, `SELECT count(*) n FROM ${t}`).n}`; } catch (e) { return `${t} ${e.message}`; } });
  const legacyText = q(lp, 'SELECT statement FROM human_facts ORDER BY rowid LIMIT 1')?.statement;
  const newRows = owner.map((t) => `${t} ${q(np, `SELECT count(*) n FROM ${t}`).n}`);
  console.log(`Z4 ${L}: session_log root page ${root} overwritten; rebuild exit ${r.status} ${JSON.parse(r.stdout)[1].state} layout ${JSON.parse(r.stdout)[1].layout}; readable in the kept file: ${legacyRows.join(', ')} (first note ${JSON.stringify(legacyText)}); in the rebuilt store: ${newRows.join(', ')}; rule ${legacyNotCarried('project', lp, np).reason}`);
}
// Z5
{
  const d = fresh('Z5', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const link = path.join(T, 'Z5-link'); rmSync(link, { force: true }); symlinkSync(d, link);
  const r = run(link, repo); // the rebuild run with the home spelled through a symlink
  const viaLink = legacyNotCarried('project', path.join(link, 'projects', k, 'store.db'), path.join(link, 'projects', k, 'project.db'));
  const viaReal = legacyNotCarried('project', path.join(d, 'projects', k, 'store.db'), path.join(d, 'projects', k, 'project.db'));
  const moved = path.join(T, 'Z5-moved'); rmSync(moved, { recursive: true, force: true }); cpSync(d, moved, { recursive: true });
  const afterMove = legacyNotCarried('project', path.join(moved, 'projects', k, 'store.db'), path.join(moved, 'projects', k, 'project.db'));
  const same = owner.every((t) => q(path.join(d, 'projects', k, 'store.db'), `SELECT count(*) n FROM ${t}`).n === q(path.join(d, 'projects', k, 'project.db'), `SELECT count(*) n FROM ${t}`).n);
  console.log(`Z5: rebuild via a symlinked home exit ${r.status}; rule through the same spelling ${JSON.stringify(viaLink)}; through the realpath ${JSON.stringify(viaReal)}; home copied to another path ${JSON.stringify(afterMove)}; owner-table counts equal in the legacy file and the rebuilt store ${same}`);
}
// Z6 (same legacy file) and Z6b (a different legacy file: store C's, another layout)
for (const [lab, srcStore] of [['Z6', 'B'], ['Z6b', 'C']]) {
  const d = fresh(lab, 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo), pd = path.join(d, 'projects', k);
  const r1 = run(d, repo);
  const np = path.join(pd, 'project.db');
  // a writer of this build dies with committed rows only in project.db-wal
  const w = spawnSync(process.execPath, ['--no-warnings', '-e', `
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(${JSON.stringify(np)});
    db.exec("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0");
    db.prepare("INSERT INTO schema_meta(key, value) VALUES('z6_written_before_purge', 'x')").run();
    process.kill(process.pid, 'SIGKILL');`], { encoding: 'utf8' });
  const before = readdirSync(pd).sort();
  const p = purge(pd, 'purge-after-project.db');
  const left = readdirSync(pd).sort();
  const sk = keyOf(path.join(W, `repo${srcStore}`)); copyFileSync(path.join(W, `oracle${srcStore}`, 'projects', sk, 'store.db'), path.join(pd, 'store.db')); // an old build's store.db again
  const legacy = legacyProjects(d);
  const r2 = run(d, repo);
  let got;
  try {
    const db = new DatabaseSync(np, { readOnly: true });
    got = `layout of the record ${JSON.parse(db.prepare("SELECT detail_json FROM faults WHERE code = 'store_rebuilt' ORDER BY rowid DESC LIMIT 1").get()?.detail_json ?? 'null')?.layout}; z6 key ${db.prepare("SELECT count(*) n FROM schema_meta WHERE key = 'z6_written_before_purge'").get().n}; store_rebuilt records ${db.prepare("SELECT count(*) n FROM faults WHERE code = 'store_rebuilt'").get().n}; quick_check ${db.prepare('PRAGMA quick_check').get().quick_check}`;
    db.close();
  } catch (e) { got = `open: ${e.message}`; }
  const st = JSON.parse(r2.stdout || '[]').map((o) => `${o.scope}:${o.state}:${o.layout ?? ''}`).join(' ');
  console.log(`${lab}: rebuild exit ${r1.status}; writer ${w.signal}; before the purge ${JSON.stringify(before)}; purge ${p.signal} after project.db, left ${JSON.stringify(left)}; legacy again ${JSON.stringify(legacy)}; rebuild exit ${r2.status} ${st}; the new project.db reads: ${got}`);
}
