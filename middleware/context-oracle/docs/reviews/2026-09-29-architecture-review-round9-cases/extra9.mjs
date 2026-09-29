// extra9.mjs <work> <build> — round-9 reviewer's cases against the committed round-8
// prototype (docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs), unchanged.
// <work> holds copies of oracle{A,B,C} and repo{A,B,C} from scratchpad/verify-rb.pU4N/.
//
//   V1 / V1C  A legacy project file that is locked by another connection while the rebuild
//             reads its schema (SQLITE_BUSY, a condition of the moment, not of the file's
//             content), on store B (b229c04 layout) and store C (4dd0f00/4e070ce layout);
//             then the lock is released and the rebuild re-run.
//   V2 / V2C  The rebuild killed after the rename (p6-renamed) on a home whose only legacy
//             project store is that one; the handler's miss rule at the rebuilt root, with
//             no other legacy store and with an unrelated orphan legacy store.
//   V3        A second clone of repository B fires the first event after the upgrade, while
//             B's store is still legacy; then the root init ran at fires.
import { DatabaseSync } from 'node:sqlite';
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import path from 'node:path';

const R8 = '/home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8';
const { legacyNotCarried, legacyProjects, handlerMiss } = await import(path.join(R8, 'rebuild.mjs'));
const W = path.resolve(process.argv[2]), B = path.resolve(process.argv[3]);
const { resolveRepoKey } = await import(path.join(B, 'middleware/context-oracle/ctxoracle/dist/src/identity/repo_key.js'));
const keyOf = (repo) => resolveRepoKey(realpathSync(repo)).key;
const T = path.join(W, 'test9'); mkdirSync(T, { recursive: true });
const fresh = (name, src) => { const d = path.join(T, name); rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, src), d, { recursive: true }); return d; };
const env = () => { const e = { ...process.env }; delete e.GIT_DIR; delete e.GIT_WORK_TREE; delete e.REBUILD_KILL_AT; delete e.REBUILD_FAULT; return e; };
const run = (home, repo, extraEnv = {}, args = []) => spawnSync(process.execPath, ['--no-warnings', path.join(R8, 'rebuild.mjs'), '--home', home, '--repo', repo, '--head', B, ...args], { env: { ...env(), ...extraEnv }, encoding: 'utf8' });
const n = (p, q) => { const d = new DatabaseSync(p, { readOnly: true }); try { return d.prepare(q).get().n; } finally { d.close(); } };
const bindingOf = (home, root) => { const g = new DatabaseSync(path.join(home, 'global/global-store.db'), { readOnly: true }); try { return g.prepare('SELECT value FROM global_meta WHERE key = ?').get(`repo_path:${realpathSync(root)}`)?.value ?? null; } finally { g.close(); } };
const faults = (home) => { const f = path.join(home, 'diagnostics/faults.jsonl'); return existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []; };
const OWNER = ['human_facts', 'corrections', 'questions', 'invariants'];

// ---- V1: a lock held on the legacy file while the rebuild reads its schema ---------------
for (const L of ['B', 'C']) {
  const d = fresh(`V1-${L}`, `oracle${L}`), repo = path.join(W, `repo${L}`), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  // Another process holds the file in EXCLUSIVE locking mode with a write transaction open
  // (a stand-in for any condition of the moment: a lock, EMFILE, ENOMEM, EIO), then waits.
  const holder = spawn(process.execPath, ['--no-warnings', '-e', `
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(${JSON.stringify(lp)});
    db.exec('PRAGMA locking_mode = EXCLUSIVE; BEGIN IMMEDIATE; SELECT count(*) FROM sqlite_master;');
    db.exec("UPDATE schema_meta SET value = value WHERE key = 'store_created_at'");
    process.stdout.write('locked\\n');
    setTimeout(() => {}, 60000);`], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res) => holder.stdout.once('data', res));
  const r1 = run(d, repo);
  holder.kill('SIGKILL'); await new Promise((res) => holder.once('exit', res));
  const readable = Object.fromEntries(OWNER.map((t) => [t, n(lp, `SELECT count(*) n FROM ${t}`)]));
  const r2 = run(d, repo);
  const o1 = JSON.parse(r1.stdout)[1], s2 = JSON.parse(r2.stdout).map((x) => x.state);
  const carried = Object.fromEntries(OWNER.map((t) => [t, n(np, `SELECT count(*) n FROM ${t}`)]));
  const rule = legacyNotCarried('project', lp, np);
  console.log(`V1 ${L}: rebuild while locked exit ${r1.status}: project ${o1.state}, layout ${o1.layout}, unreadable ${JSON.stringify(o1.unreadable)}; lock released: owner rows readable in the legacy file ${JSON.stringify(readable)}; re-run exit ${r2.status} states ${s2.join(',')}; owner rows in the rebuilt store ${JSON.stringify(carried)}; legacy-file rule ${JSON.stringify(rule)}`);
}

// ---- V2: kill after the rename, then the handler at the rebuilt root ----------------------
for (const L of ['A', 'C']) {
  const repo = path.join(W, `repo${L}`), k = keyOf(repo), root = realpathSync(repo);
  const out = [];
  for (const orphan of [false, true]) {
    const d = fresh(`V2-${L}-${orphan ? 'orphan' : 'alone'}`, `oracle${L}`);
    const rk = run(d, repo, { REBUILD_KILL_AT: 'p6-renamed' });
    if (orphan) { mkdirSync(path.join(d, 'projects', 'deadbeef0000'), { recursive: true }); copyFileSync(path.join(W, `oracle${L}`, 'projects', k, 'store.db'), path.join(d, 'projects', 'deadbeef0000', 'store.db')); }
    const legacy = legacyProjects(d);
    const h = handlerMiss({ home: d, root, session: `s-v2-${orphan}`, event: 'SessionStart' });
    const rc = h === 'spawn' ? run(d, repo, {}, ['--session', `s-v2-${orphan}`]) : null;
    const h2 = handlerMiss({ home: d, root, session: `s-v2-${orphan}`, event: 'UserPromptSubmit' });
    out.push(`${orphan ? 'with an unrelated orphan legacy store' : 'no other legacy store'}: kill ${rk.signal}; legacy projects ${JSON.stringify(legacy)}; handler ${h}${rc ? `, child exit ${rc.status} binding ${JSON.parse(rc.stdout)[1].binding}` : ''}; second event ${h2}; binding of the root ${bindingOf(d, repo)}; faults ${JSON.stringify(faults(d).map((f) => f.code))}`);
  }
  console.log(`V2 ${L} (kill at p6-renamed): ${out.join(' | ')}`);
}

// ---- V3: a second clone fires first while B's store is legacy -----------------------------
{
  const d = fresh('V3', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const clone = path.join(T, 'V3-clone'); rmSync(clone, { recursive: true, force: true });
  const c = spawnSync('git', ['clone', '-q', repo, clone], { env: env(), encoding: 'utf8' });
  // the global store is rebuilt by the first child; a legacy project store is present
  const h1 = handlerMiss({ home: d, root: realpathSync(clone), session: 's-v3', event: 'SessionStart' });
  const rc = h1 === 'spawn' ? run(d, clone, {}, ['--session', 's-v3']) : null;
  const pc = rc ? JSON.parse(rc.stdout)[1] : {};
  const h2 = handlerMiss({ home: d, root: realpathSync(repo), session: 's-v3b', event: 'SessionStart' });
  console.log(`V3: clone exit ${c.status}, key ${keyOf(clone)} = B's ${k}: ${keyOf(clone) === k}; handler at the clone ${h1}, child exit ${rc?.status} project ${pc.state} binding ${pc.binding}, record root ${JSON.stringify(pc.root === realpathSync(clone) ? '<clone>' : pc.root)}; binding of the clone ${bindingOf(d, clone)}, of the root init ran at ${bindingOf(d, repo)}; a new session at that root: handler ${h2}; faults ${JSON.stringify(faults(d).map((f) => [f.code, f.root === realpathSync(repo) ? '<init root>' : f.root]))}`);
}
