// test-rebuild.mjs <work-dir> — runs rebuild.mjs against the real legacy stores
// build-stores.sh left in <work-dir> (oracleA, oracleB, oracleC and their repos),
// each time on a fresh copy, and checks:
//   1. every owner-typed row, and every other carried row, arrives unchanged
//      (translated columns compared through their path);
//   2. every file reference resolves to the same path;
//   3. the tuning value the store's own reader returns is the owner's, or the
//      owner row is recorded unplaced with the validator's reason and the seed
//      is served; a list key the owner never tuned serves this build's seed;
//   4. no duplicates: one row per scalar tuning key, row counts equal;
//   5. a SIGKILL at each step leaves every legacy file byte-identical (sha256)
//      and the next run succeeds with checks 1-4; a run after success is a no-op;
//   6. the first index's path-keyed upsert (HEAD's files DAO) keeps a created
//      row's id; integrity_check and foreign_key_check are clean.
// Exit 0 only when every check passes.
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, copyFileSync, existsSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { RULES } from './rebuild.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = path.resolve(process.argv[2] ?? '');
const HEADB = path.join(W, 'HEAD');
const D = path.join(HEADB, 'middleware/context-oracle/ctxoracle/dist/src');
const { tuningReader } = await import(path.join(D, 'stores/dao/tuning.js'));
const { SCALAR_SEEDS, LIST_SEEDS } = await import(path.join(D, 'stores/dao/tuning_seeds.js'));
const { filesDao } = await import(path.join(D, 'stores/dao/files.js'));
const { resolveRepoKey } = await import(path.join(D, 'identity/repo_key.js'));
const STEPS = ['g1-discarded', 'g2-created', 'g3-mid-copy', 'g4-copied', 'g5-closed', 'g6-renamed', 'g7-global-done',
  'p1-discarded', 'p2-created', 'p3-mid-copy', 'p4-copied', 'p5-closed', 'p6-renamed', 'p7-bound'];

let failures = 0, passes = 0;
function check(name, fn) {
  try { fn(); passes++; } catch (e) { failures++; console.log(`FAIL ${name}: ${e.message.split('\n').slice(0, 6).join(' | ')}`); }
}
const ro = (p) => new DatabaseSync(p, { readOnly: true });
const legacyFiles = (home) => {
  const out = [];
  const walk = (d) => { for (const n of readdirSync(d)) { const p = path.join(d, n); if (statSync(p).isDirectory()) walk(p); else if (/(^|\/)(store|global)\.db(-wal|-shm)?$/.test(p)) out.push(p); } };
  walk(home);
  return out.sort();
};
const shaAll = (home) => Object.fromEntries(legacyFiles(home).map((p) => [path.relative(home, p), createHash('sha256').update(readFileSync(p)).digest('hex')]));
function wrap(db) {
  let n = 0;
  return { prepare: (s) => db.prepare(s), exec: (s) => db.exec(s), transaction(fn) { const sp = `t${n++}`; db.exec(`SAVEPOINT ${sp}`); try { const r = fn(); db.exec(`RELEASE ${sp}`); return r; } catch (e) { db.exec(`ROLLBACK TO ${sp}`); db.exec(`RELEASE ${sp}`); throw e; } } };
}
function run(home, repo, killAt) {
  const env = { ...process.env }; delete env.GIT_DIR; delete env.GIT_WORK_TREE; delete env.REBUILD_KILL_AT;
  if (killAt) env.REBUILD_KILL_AT = killAt;
  return spawnSync(process.execPath, ['--no-warnings', path.join(HERE, 'rebuild.mjs'), '--home', home, '--repo', repo, '--head', HEADB], { env, encoding: 'utf8' });
}
const cols = (db, t) => db.prepare(`SELECT name FROM pragma_table_info('${t}') ORDER BY cid`).all().map((r) => r.name);
const has = (db, t) => db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t) !== undefined;
const norm = (rows) => rows.map((r) => JSON.stringify(r)).sort();

/** Checks 1-4 and 6 on a rebuilt home, against the legacy files in `legacyHome` (the same home, read only after
 * its sha256 check, so the pristine copies are never opened). */
function contentChecks(tag, home, repo, legacyHome) {
  const key = resolveRepoKey(realpathSync(repo)).key;
  const lp = ro(path.join(legacyHome, 'projects', key, 'store.db'));
  const lg = ro(path.join(legacyHome, 'global/global.db'));
  const np = ro(path.join(home, 'projects', key, 'project.db'));
  const ng = ro(path.join(home, 'global/global-store.db'));
  const layout = has(lp, 'stats_folds') ? 'b229c04' : '4dd0f00-4e070ce';
  const rules = RULES[layout];
  // 1 + 2: every carried table, row for row.
  for (const [t, r] of Object.entries(rules.project)) {
    if (!['as-is', 'translate', 'filter'].includes(r.rule) || !has(lp, t)) continue;
    check(`${tag} ${t} rows arrive`, () => {
      const lc = cols(lp, t);
      const set = r.set ?? {};
      const plain = lc.filter((c) => !(c in set) && !(r.ids ?? []).includes(c));
      const idSel = (r.ids ?? []).map((c) => `(SELECT path FROM files f WHERE f.id = x.${c}) AS ${c}_path`);
      const sel = [...plain.map((c) => `x.${c}`), ...idSel].join(', ');
      const where = r.where ? ` WHERE ${r.where.replaceAll(/\b(kind|subject_key)\b/g, 'x.$1')}` : '';
      const lrows = lp.prepare(`SELECT ${sel} FROM ${t} x${where} ORDER BY ${set.seq === 'order' ? 'x.ts, x.rowid' : 'x.rowid'}`).all();
      const nwhere = t === 'faults' ? " WHERE x.code <> 'store_rebuilt'" : where; // the rebuild's own record
      const nrows = np.prepare(`SELECT ${sel} FROM ${t} x${nwhere} ORDER BY ${cols(np, t).includes('seq') ? 'x.seq' : 'x.rowid'}`).all();
      assert.deepEqual(norm(nrows), norm(lrows));
      for (const c of r.ids ?? []) assert.equal(nrows.filter((x) => x[`${c}_path`] === null).length, 0, `${t}.${c} resolves to no path`);
      if (set.seq === 'order') {
        assert.deepEqual(nrows.map((x) => JSON.stringify(x)), lrows.map((x) => JSON.stringify(x)), 'legacy order kept');
        assert.deepEqual(np.prepare(`SELECT seq FROM ${t} ORDER BY seq`).all().map((x) => x.seq), lrows.map((_, i) => i + 1));
      }
      for (const [c, v] of Object.entries(set)) if (v === 'NULL') assert.equal(np.prepare(`SELECT count(*) n FROM ${t} WHERE ${c} IS NOT NULL`).get().n, 0);
    });
  }
  check(`${tag} lessons rows arrive`, () => assert.deepEqual(norm(ng.prepare('SELECT * FROM lessons').all()), norm(lg.prepare('SELECT * FROM lessons').all())));
  check(`${tag} owner-typed tables are non-empty where the verbs wrote them`, () => {
    for (const t of ['human_facts', 'corrections', 'questions', 'whisper_audit', 'invariants', 'invariant_members']) assert.ok(np.prepare(`SELECT count(*) n FROM ${t}`).get().n > 0, t);
    assert.ok(ng.prepare('SELECT count(*) n FROM lessons').get().n > 0, 'lessons');
    assert.equal(np.prepare("SELECT count(*) n FROM questions WHERE question_text = 'why does the build take so long?'").get().n, 1, 'the --missed-question row');
  });
  // 3: the served tuning value.
  const pRep = JSON.parse(np.prepare("SELECT detail_json FROM faults WHERE code = 'store_rebuilt'").get().detail_json);
  const gRep = JSON.parse(ng.prepare("SELECT value FROM global_meta WHERE key = 'store_rebuilt'").get().value);
  check(`${tag} the rebuild's records are in the new stores`, () => {
    assert.equal(pRep.layout, layout); assert.equal(gRep.layout, layout);
    assert.equal(np.prepare("SELECT count(*) n FROM faults WHERE code = 'store_rebuilt'").get().n, 1);
    assert.equal(ng.prepare("SELECT value FROM global_meta WHERE key = 'legacy_unplaced'").get().value, String(gRep.unplaced.length));
  });
  const reader = tuningReader(wrap(ng), key, (k) => { throw new Error(`reader re-seeded ${k}`); });
  const owner = lg.prepare("SELECT key, value FROM tuning WHERE source = 'owner' ORDER BY rowid").all();
  for (const o of owner) {
    check(`${tag} tuning ${o.key} served`, () => {
      const refused = gRep.unplaced.find((u) => u.table === 'tuning' && u.key === o.key);
      const scalar = SCALAR_SEEDS.find((s) => s.key === o.key), list = LIST_SEEDS.find((s) => s.key === o.key);
      if (refused) {
        assert.match(refused.reason, /^refused: /);
        if (scalar) assert.equal(reader.str(o.key), scalar.value, 'a refused owner value serves the seed');
        else if (list) assert.deepEqual(reader.list(o.key), list.values);
        else assert.throws(() => reader.str(o.key), /unknown scalar key/);
      } else if (list) assert.deepEqual(reader.list(o.key), owner.filter((x) => x.key === o.key).map((x) => x.value));
      else assert.equal(reader.str(o.key), o.value);
    });
  }
  check(`${tag} untouched list key serves this build's seed`, () => {
    const s = LIST_SEEDS.find((x) => x.key === 'index.ext_to_grammar');
    assert.deepEqual(reader.list('index.ext_to_grammar'), s.values);
    assert.ok(!reader.list('index.ext_to_grammar').includes('.lua=lua'));
  });
  check(`${tag} every seeded key reads without error`, () => {
    for (const s of SCALAR_SEEDS) reader.str(s.key);
    for (const s of LIST_SEEDS) reader.list(s.key);
  });
  // 4: no duplicates.
  check(`${tag} one row per scalar key, no duplicate list member`, () => {
    assert.deepEqual(ng.prepare('SELECT key, count(*) n FROM tuning WHERE project_key IS NULL GROUP BY key HAVING n > 1 AND key NOT IN (' + LIST_SEEDS.map(() => '?').join(',') + ')').all(...LIST_SEEDS.map((s) => s.key)), []);
    assert.deepEqual(ng.prepare('SELECT key, value, count(*) n FROM tuning GROUP BY key, project_key, value HAVING n > 1').all(), []);
  });
  check(`${tag} identity, binding and migration records`, () => {
    const m = Object.fromEntries(np.prepare('SELECT key, value FROM schema_meta').all().map((r) => [r.key, r.value]));
    assert.equal(m.repo_key, key); assert.ok(['commit', 'url', 'path'].includes(m.keying_mode)); assert.ok(['fts5', 'fallback'].includes(m.fts_state));
    assert.ok(m['migration_sha256:001_phase_a_project.sql']);
    assert.equal(ng.prepare('SELECT value FROM global_meta WHERE key = ?').get(`repo_path:${realpathSync(repo)}`)?.value, key);
    assert.equal(ng.prepare("SELECT count(*) n FROM global_meta WHERE key LIKE 'legacy_pending:%'").get().n, 0, 'legacy_pending cleared by the project rebuild');
    assert.deepEqual(Object.keys(pRep.legacyCounts).sort(), lp.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'fts%' AND name NOT LIKE 'sqlite%'").all().map((r) => r.name).sort());
  });
  check(`${tag} integrity_check and foreign_key_check`, () => {
    for (const d of [np, ng]) { assert.equal(d.prepare('PRAGMA integrity_check').get().integrity_check, 'ok'); assert.deepEqual(d.prepare('PRAGMA foreign_key_check').all(), []); }
  });
  for (const d of [lp, lg, np, ng]) d.close();
  return key;
}

for (const L of ['A', 'B', 'C']) {
  const pristine = path.join(W, `oracle${L}`), repo = path.join(W, `repo${L}`);
  const sums = shaAll(pristine);
  const fresh = (tag) => { const d = path.join(W, 'test', `${L}-${tag}`); rmSync(d, { recursive: true, force: true }); cpSync(pristine, d, { recursive: true }); return d; };
  console.log(`== store ${L}: ${Object.keys(sums).length} legacy files`);
  // clean run, then a re-run
  const h = fresh('clean');
  const r1 = run(h, repo);
  check(`${L} clean run exits 0`, () => assert.equal(r1.status, 0, r1.stdout + r1.stderr));
  check(`${L} clean run leaves legacy files byte-identical`, () => assert.deepEqual(shaAll(h), sums));
  const key = contentChecks(`${L} clean`, h, repo, h);
  const counts = (p) => { const d = ro(p); const o = Object.fromEntries(d.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'fts%'").all().map((t) => [t.name, d.prepare(`SELECT count(*) n FROM ${t.name}`).get().n])); d.close(); return o; };
  const before = [counts(path.join(h, 'projects', key, 'project.db')), counts(path.join(h, 'global/global-store.db'))];
  const r2 = run(h, repo);
  check(`${L} re-run is a no-op`, () => {
    assert.equal(r2.status, 0);
    assert.deepEqual(JSON.parse(r2.stdout).map((o) => o.state), ['current', 'current']);
    assert.deepEqual([counts(path.join(h, 'projects', key, 'project.db')), counts(path.join(h, 'global/global-store.db'))], before);
  });
  check(`${L} first index's path upsert keeps a created row's id`, () => {
    const cp = path.join(W, 'test', `${L}-upsert.db`); copyFileSync(path.join(h, 'projects', key, 'project.db'), cp);
    const d = new DatabaseSync(cp);
    const row = d.prepare('SELECT id, path FROM files WHERE in_tree = 0 ORDER BY id LIMIT 1').get();
    const id = filesDao(wrap(d)).upsert({ path: row.path, lang: 'typescript', zone: 'source', contentHash: 'x', mtime: 1, in_tree: 1, prov: { prov_kind: 'repo_span', prov_ref: row.path, trust: 'untrusted_repo' } });
    assert.equal(id, row.id); assert.equal(d.prepare('SELECT in_tree FROM files WHERE id = ?').get(id).in_tree, 1);
    d.close();
  });
  console.log(`   clean: exit ${r1.status}; ${r1.stdout.length} bytes of report; re-run states ${r2.stdout.trim().slice(0, 80)}`);
  // a kill at every step, then a completing run
  for (const s of STEPS) {
    const k = fresh(`kill-${s}`);
    const rk = run(k, repo, s);
    check(`${L} kill at ${s}: killed`, () => assert.equal(rk.signal, 'SIGKILL', `status ${rk.status} ${rk.stderr}`));
    check(`${L} kill at ${s}: legacy files byte-identical`, () => assert.deepEqual(shaAll(k), sums));
    if (s === 'g7-global-done') check(`${L} kill at ${s}: legacy_pending names the project still to rebuild`, () => {
      const g = ro(path.join(k, 'global/global-store.db'));
      assert.deepEqual(g.prepare("SELECT key FROM global_meta WHERE key LIKE 'legacy_pending:%'").all().map((r) => r.key), [`legacy_pending:${key}`]);
      g.close();
    });
    const rn = run(k, repo);
    check(`${L} kill at ${s}: next run succeeds`, () => assert.equal(rn.status, 0, rn.stdout + rn.stderr));
    check(`${L} kill at ${s}: legacy files byte-identical after the next run`, () => assert.deepEqual(shaAll(k), sums));
    check(`${L} kill at ${s}: no temporary file left`, () => assert.deepEqual(readdirSync(path.join(k, 'projects', key)).concat(readdirSync(path.join(k, 'global'))).filter((n) => n.includes('rebuild-tmp')), []));
    contentChecks(`${L} after kill at ${s}`, k, repo, k);
    console.log(`   kill at ${s}: signal ${rk.signal}; next run exit ${rn.status}; states ${JSON.parse(rn.stdout).map((o) => o.state).join(',')}`);
  }
}
// Another layout: store B's project file with one column added (a DDL no build
// made). It is rebuilt from the repository with its rows unread, and left as it is.
{
  const d = path.join(W, 'test', 'D-other-layout');
  rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, 'oracleB'), d, { recursive: true });
  const key = resolveRepoKey(realpathSync(path.join(W, 'repoB'))).key;
  const lpPath = path.join(d, 'projects', key, 'store.db');
  const x = new DatabaseSync(lpPath); x.exec('ALTER TABLE human_facts ADD COLUMN extra TEXT'); x.close();
  const sums = shaAll(d);
  const r = run(d, path.join(W, 'repoB'));
  console.log(`== another layout: exit ${r.status}; project ${JSON.stringify(JSON.parse(r.stdout)[1]).replaceAll(W, '<work>').slice(0, 160)}`);
  check('D another layout: exits 0', () => assert.equal(r.status, 0, r.stdout + r.stderr));
  // Here the ALTER's close removed the -wal and -shm, and SQLite's read-only open of a
  // WAL database creates them again (an empty -wal, a -shm index): the database files
  // must be byte-identical and a created -wal empty.
  check('D another layout: legacy database files byte-identical; a created -wal is empty', () => {
    const now = shaAll(d);
    for (const [f, h] of Object.entries(sums)) assert.equal(now[f], h, f);
    const created = Object.keys(now).filter((f) => !(f in sums));
    console.log(`   side files the read-only open created: ${created.join(', ') || 'none'}`);
    for (const f of created) assert.match(f, /-(wal|shm)$/);
    for (const f of created.filter((x) => x.endsWith('-wal'))) assert.equal(statSync(path.join(d, f)).size, 0, f);
  });
  check('D another layout: project rows unread, store created, binding recorded', () => {
    const o = JSON.parse(r.stdout)[1];
    assert.equal(o.layout, null); assert.equal(o.unread, true);
    const np = ro(path.join(d, 'projects', key, 'project.db'));
    assert.equal(np.prepare('SELECT count(*) n FROM human_facts').get().n, 0);
    assert.equal(np.prepare("SELECT value FROM schema_meta WHERE key = 'repo_key'").get().value, key);
    np.close();
  });
}
// An unreadable legacy file: store B's project file overwritten with bytes that are
// not a database. It is rebuilt from the repository, unread, not left failing.
{
  const d = path.join(W, 'test', 'E-unreadable');
  rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, 'oracleB'), d, { recursive: true });
  const key = resolveRepoKey(realpathSync(path.join(W, 'repoB'))).key;
  const lpPath = path.join(d, 'projects', key, 'store.db');
  for (const f of ['-wal', '-shm']) rmSync(lpPath + f, { force: true });
  writeFileSync(lpPath, Buffer.alloc(8192, 0x5a));
  const sums = shaAll(d);
  const r = run(d, path.join(W, 'repoB'));
  const o = JSON.parse(r.stdout)[1];
  console.log(`== unreadable legacy file: exit ${r.status}; project state ${o.state}, layout ${o.layout}, unreadable ${JSON.stringify(o.unreadable)}`);
  check('E unreadable: exits 0, rebuilt unread', () => { assert.equal(r.status, 0); assert.equal(o.state, 'rebuilt'); assert.equal(o.layout, null); assert.ok(o.unreadable); });
  check('E unreadable: legacy database file byte-identical', () => { const now = shaAll(d); for (const [f, h] of Object.entries(sums)) assert.equal(now[f], h, f); });
}
console.log(`\n${passes} checks passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
