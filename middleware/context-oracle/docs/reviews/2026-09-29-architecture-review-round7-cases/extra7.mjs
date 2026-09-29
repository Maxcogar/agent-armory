// extra7.mjs <work> — round-7 reviewer's added cases, run against the round-6 evidence's
// prototype (2026-09-29-rebuild-mapping-evidence-r6/rebuild.mjs), unchanged.
// <work> holds the builds and stores copied from verify-rb.pU4N (HEAD, b229c04,
// 59cc05c, oracle{A,B,C}, repo{A,B,C}). Every case works on a fresh copy under <work>/r7.
//   Y1  an old build's `note` on the legacy project file after its rebuild, both layouts
//   Y2  an in-place update of a carried row (questions.status) after the rebuild
//   Y3  a legacy export (HEAD's `export`, VACUUM INTO): layout identified, rebuilt, and
//       the legacy-file rule after an import judged against the export's record
//   Y5  a legacy file with one corrupt table page: the rebuild fails the same way twice
//   Y6  the migration checksum of the same file checked out LF and CRLF
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, rmSync, mkdirSync, copyFileSync, realpathSync, readFileSync, openSync, writeSync, closeSync, existsSync } from 'node:fs';
import path from 'node:path';
const W = path.resolve(process.argv[2]);
const R6 = '/home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r6';
const EV = '/home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence';
const { detectLayout, legacyNotCarried } = await import(path.join(R6, 'rebuild.mjs'));
const { resolveRepoKey } = await import(path.join(W, 'HEAD/middleware/context-oracle/ctxoracle/dist/src/identity/repo_key.js'));
const T = path.join(W, 'r7'); mkdirSync(T, { recursive: true });
const env0 = () => { const e = { ...process.env }; delete e.GIT_DIR; delete e.GIT_WORK_TREE; delete e.REBUILD_KILL_AT; return e; };
const rebuild = (home, repo) => { const r = spawnSync(process.execPath, ['--no-warnings', path.join(R6, 'rebuild.mjs'), '--home', home, '--repo', repo, '--head', path.join(W, 'HEAD')], { env: env0(), encoding: 'utf8' });
  return { status: r.status, out: r.stdout ? JSON.parse(r.stdout) : null, err: r.stderr }; };
const cli = (build, home, repo, ...args) => { const h = path.join(T, 'userhome'); mkdirSync(h, { recursive: true });
  const r = spawnSync(process.execPath, ['--no-warnings', path.join(W, build, 'middleware/context-oracle/ctxoracle/dist/src/cli/dispatch.js'), ...args], { cwd: repo, env: { ...env0(), HOME: h, CTXORACLE_HOME: home }, encoding: 'utf8' });
  return `${r.status} ${(r.stdout + r.stderr).trim().split('\n').pop()}`; };
const q = (p, s) => { const d = new DatabaseSync(p, { readOnly: true }); const r = d.prepare(s).all(); d.close(); return r; };
const keyOf = (repo) => resolveRepoKey(realpathSync(repo)).key;
const fresh = (name, src) => { const d = path.join(T, name); rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, src), d, { recursive: true }); return d; };
const nc = (x) => JSON.stringify(x);

// Y1: an old build writes an owner row into the legacy project file after the rebuild.
for (const [lab, build] of [['A', 'b229c04'], ['C', '59cc05c']]) {
  const d = fresh(`Y1-${lab}`, `oracle${lab}`), repo = path.join(W, `repo${lab}`), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const r = rebuild(d, repo);
  const before = legacyNotCarried('project', lp, np), nBefore = q(lp, 'SELECT count(*) n FROM human_facts')[0].n;
  const c = cli(build, d, repo, 'note', 'typed through the old build after the upgrade');
  const after = legacyNotCarried('project', lp, np), nAfter = q(lp, 'SELECT count(*) n FROM human_facts')[0].n;
  console.log(`Y1 ${lab}: rebuild exit ${r.status}; ${build} note -> ${c}; legacy human_facts ${nBefore} -> ${nAfter}, rebuilt ${q(np, 'SELECT count(*) n FROM human_facts')[0].n}; before ${nc(before)}; after ${nc(after)}`);
}

// Y2: an in-place update of a carried row after the rebuild (a hand model of an old
// build's answer-drift consumer closing a question).
{
  const d = fresh('Y2', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const r = rebuild(d, repo);
  const x = new DatabaseSync(lp); const ch = x.prepare("UPDATE questions SET status = 'answered', closed_at = 1 WHERE rowid = (SELECT min(rowid) FROM questions WHERE status = 'open')").run().changes; x.close();
  console.log(`Y2: rebuild exit ${r.status}; questions rows updated ${ch}; legacyNotCarried ${nc(legacyNotCarried('project', lp, np))}`);
}

// Y3: a legacy export, and the legacy-file rule after an import of it.
{
  const src = fresh('Y3-src', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const exp = path.join(T, 'Y3-export'); rmSync(exp, { recursive: true, force: true });
  const e = cli('HEAD', src, repo, 'export', exp);
  const lay = ['project.db', 'global.db'].map((f) => { const db = new DatabaseSync(path.join(exp, f), { readOnly: true }); db.exec('BEGIN'); const l = detectLayout(db, f === 'project.db' ? 'project' : 'global'); db.exec('COMMIT'); db.close(); return l; });
  // the export rebuilt as a legacy store (AD-5's "AD-4's mapping rebuilds it"), in its own home
  const hx = path.join(T, 'Y3-export-home'); rmSync(hx, { recursive: true, force: true });
  mkdirSync(path.join(hx, 'global'), { recursive: true }); mkdirSync(path.join(hx, 'projects', k), { recursive: true });
  copyFileSync(path.join(exp, 'global.db'), path.join(hx, 'global/global.db')); copyFileSync(path.join(exp, 'project.db'), path.join(hx, 'projects', k, 'store.db'));
  const rx = rebuild(hx, repo);
  const cnt = (p) => ['human_facts', 'corrections', 'questions', 'invariants'].map((t) => `${t} ${q(p, `SELECT count(*) n FROM ${t}`)[0].n}`).join(', ');
  console.log(`Y3: HEAD export -> ${e}; layouts ${nc(lay)}; export rebuilt exit ${rx.status} ${rx.out.map((o) => `${o.scope}:${o.state}:${o.layout}`).join(' ')}; export ${cnt(path.join(exp, 'project.db'))}; rebuilt ${cnt(path.join(hx, 'projects', k, 'project.db'))}`);
  // This machine: the same legacy file, plus one hand-added schema_meta key (unplaced:
  // "key unknown to the mapping"; a meta digest covers only carried keys), rebuilt.
  const d = fresh('Y3-local', 'oracleB');
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const x = new DatabaseSync(lp); x.prepare("INSERT INTO schema_meta(key, value) VALUES('hand_added_key', 'kept only in this file')").run(); x.close();
  const rl = rebuild(d, repo);
  const own = legacyNotCarried('project', lp, np);
  // The import's phase 3 backs the rebuilt export copy into the live project store (the
  // pre-import copy is kept beside it). Modelled by the file copy below.
  copyFileSync(np, `${np}.pre-import-1`); copyFileSync(path.join(hx, 'projects', k, 'project.db'), np);
  const rec = JSON.parse(q(np, "SELECT detail_json AS r FROM faults WHERE code = 'store_rebuilt' ORDER BY ts DESC, rowid DESC LIMIT 1")[0].r);
  const after = legacyNotCarried('project', lp, np);
  console.log(`Y3: local rebuild exit ${rl.status}; own record: ${nc(own)}; after the import the latest record's legacyPath is ${path.relative(T, rec.legacyPath)} (the file checked is ${path.relative(T, lp)}); legacyNotCarried ${nc(after)}; hand_added_key still in the legacy file: ${q(lp, "SELECT count(*) n FROM schema_meta WHERE key = 'hand_added_key'")[0].n}`);
  // The same after-import check on a legacy file that is not a database (store E's shape).
  rmSync(lp, { force: true }); for (const s of ['-wal', '-shm']) rmSync(lp + s, { force: true });
  copyFileSync(path.join(EV, 'README.md'), lp);
  let res; try { res = nc(legacyNotCarried('project', lp, np)); } catch (err) { res = `throws: ${err.message}`; }
  console.log(`Y3: after the import, a legacy file that is not a database: legacyNotCarried ${res}`);
}

// Y5: a legacy file whose schema reads but one table's root page is corrupt.
{
  const d = fresh('Y5', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db');
  const x = new DatabaseSync(lp); x.exec('PRAGMA wal_checkpoint(TRUNCATE)'); x.exec('PRAGMA journal_mode = DELETE');
  const ps = x.prepare('PRAGMA page_size').get().page_size;
  const root = x.prepare("SELECT rootpage FROM sqlite_master WHERE name = 'session_log'").get().rootpage; x.close();
  const fd = openSync(lp, 'r+'); writeSync(fd, Buffer.alloc(ps, 0xa5), 0, ps, (root - 1) * ps); closeSync(fd);
  const runs = [rebuild(d, repo), rebuild(d, repo)];
  console.log(`Y5: session_log root page ${root} overwritten; run 1 exit ${runs[0].status} ${nc(runs[0].out[1])}; run 2 exit ${runs[1].status} project state ${runs[1].out[1].state} error ${nc(runs[1].out[1].error)}; project.db exists ${existsSync(path.join(d, 'projects', k, 'project.db'))}`);
}

// Y6: the checksum the design compares byte for byte, over one migration file checked
// out with LF and with CRLF line endings.
{
  const lf = readFileSync(path.join(EV, 'new-layout/001_phase_a_project.sql'), 'utf8');
  const sha = (s) => createHash('sha256').update(s).digest('hex');
  console.log(`Y6: 001_phase_a_project.sql sha256 LF ${sha(lf).slice(0, 16)} CRLF ${sha(lf.replaceAll('\n', '\r\n')).slice(0, 16)} equal ${sha(lf) === sha(lf.replaceAll('\n', '\r\n'))}`);
}
