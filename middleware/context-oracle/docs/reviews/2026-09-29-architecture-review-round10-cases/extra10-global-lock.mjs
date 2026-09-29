// extra10-global-lock.mjs <work> <build> — R9-4 on the GLOBAL legacy file (owner tuning rows
// and lessons live there; the round-9 V1 locks only the project file): another process holds
// global/global.db in EXCLUSIVE locking mode with a write transaction open during the rebuild;
// then the lock is released and the rebuild re-run. Stores B and C, fresh copies.
import { DatabaseSync } from 'node:sqlite';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
const [W, HEADB] = process.argv.slice(2).map((p) => path.resolve(p));
const R = '/home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r9';
const env = { ...process.env }; delete env.GIT_DIR; delete env.GIT_WORK_TREE; delete env.REBUILD_KILL_AT; delete env.REBUILD_FAULT;
const run = (home, repo) => spawnSync(process.execPath, ['--no-warnings', path.join(R, 'rebuild.mjs'), '--home', home, '--repo', repo, '--head', HEADB], { env, encoding: 'utf8' });
const q = (p, s) => { const d = new DatabaseSync(p, { readOnly: true }); try { return d.prepare(s).get().n; } finally { d.close(); } };
for (const L of ['B', 'C']) {
  const home = path.join(W, '..', `global-lock-${L}`); rmSync(home, { recursive: true, force: true }); cpSync(path.join(W, `oracle${L}`), home, { recursive: true });
  const lg = path.join(home, 'global/global.db'), ng = path.join(home, 'global/global-store.db'), repo = path.join(W, `repo${L}`);
  const holder = spawn(process.execPath, ['--no-warnings', '-e', `
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(${JSON.stringify(lg)});
    db.exec('PRAGMA locking_mode = EXCLUSIVE; BEGIN IMMEDIATE;');
    db.exec("UPDATE tuning SET value = value WHERE 0");
    db.exec("INSERT INTO global_meta(key, value) VALUES('x-lock-probe', '1')");
    db.exec("DELETE FROM global_meta WHERE key = 'x-lock-probe'");
    process.stdout.write('locked\\n'); setTimeout(() => {}, 60000);`], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res) => holder.stdout.once('data', res));
  const r1 = run(home, repo);
  const g1 = JSON.parse(r1.stdout)[0], newAbsent = !existsSync(ng);
  holder.kill('SIGKILL'); await new Promise((res) => holder.once('exit', res));
  const owner = q(lg, "SELECT count(*) n FROM tuning WHERE source = 'owner'"), lessons = q(lg, 'SELECT count(*) n FROM lessons');
  const r2 = run(home, repo);
  const out2 = JSON.parse(r2.stdout);
  const refused = (out2[0].unplaced ?? []).filter((u) => u.table === 'tuning').length;
  const carried = q(ng, "SELECT count(*) n FROM tuning WHERE source = 'owner'"), lessonsNew = q(ng, 'SELECT count(*) n FROM lessons');
  console.log(`${L} global locked: rebuild exit ${r1.status}, global ${g1.state}, error ${JSON.stringify(g1.error ?? null)}, layout ${JSON.stringify(g1.layout ?? null)}, new name absent ${newAbsent}; released: owner tuning rows ${owner}, lessons ${lessons}; re-run exit ${r2.status} ${out2.map((o) => o.state).join(',')}; owner tuning rows in the new store ${carried} (+ ${refused} refused, recorded unplaced), lessons ${lessonsNew}`);
  rmSync(home, { recursive: true, force: true });
}
