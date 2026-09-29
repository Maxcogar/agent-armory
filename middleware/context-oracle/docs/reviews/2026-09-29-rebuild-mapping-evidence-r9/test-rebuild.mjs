// test-rebuild.mjs <work-dir> [<build>] — runs rebuild.mjs against the real legacy stores
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
// Round-6 revision: the one rule for a legacy file, legacyNotCarried() (R6-1, R6-2), is
// checked on every store, and the reviewer's cases X1, X2, X3 and one case per testable
// round-6 fix are added at the end.
// Round-7 revision (this directory's README lists every change): <build> is the build
// whose tuning validator, seeds, reader and key rule the rebuild and the checks use
// (default <work-dir>/HEAD). The half-life check expects the designed outcome, so the
// acceptance run passes the build's own (designed) validator (R7-1). The round-7
// reviewer's Y1-Y6 and one case per testable round-7 fix are added at the end.
// Round-8 revision (this directory's README lists every change): the round-8 reviewer's
// Z2-Z6b and one case per round-8 behaviour fix (R8-1, R8-3, R8-4, R8-5) are added, and
// the checks the round-8 fixes change are changed (README).
// Round-9 revision (this directory's README lists every change): the rebuild binds
// before it renames (R9-3), so the project kill points are p5-bound, p6-closed and
// p7-renamed; the round-9 reviewer's V1-V4 are added with the expected outcomes, with
// one case per round-9 behaviour fix (R9-3's handler after every kill point, R9-5's
// copy failure after the digest); the three statements outside any check that ended
// three mutants with an uncaught error are made non-throwing (the round-9 review's
// crash/guard.py), so a check reports them.
// The interface an implementation substitutes to run this test (R8-6, R9-7):
//   - the rebuild entry point (the command spawned by run(), with its --home, --repo,
//     --head, --origin and --session arguments and its JSON stdout), and the purge's
//     deletion (--purge-files);
//   - the exports of rebuild.mjs imported below: RULES (the mapping), legacyNotCarried
//     (the legacy-file rule), legacyProjects (the file test), migrationChecksum,
//     detectLayout (the layout test), publishStore (the rename onto a new name),
//     handlerMiss (the handler's miss rule) and handlerEvent (the hook path's order
//     before it);
//   - the test hooks REBUILD_KILL_AT and REBUILD_FAULT;
//   - the build argument's modules, at these paths under
//     <build>/middleware/context-oracle/ctxoracle/dist/src/ with these exports:
//     stores/dao/tuning.js (tuningReader, checkTuningWrite), stores/dao/tuning_seeds.js
//     (SCALAR_SEEDS, LIST_SEEDS), stores/dao/files.js (filesDao) and
//     identity/repo_key.js (resolveRepoKey); and, read by rebuild.mjs itself,
//     stores/dao/tuning.js (seedDefaults) and stores/adapter.js (probeFts5).
// Only those bindings change; every check stays as it is.
// Exit 0 only when every check passes.
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, cpSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync, writeSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { RULES, legacyNotCarried, legacyProjects, migrationChecksum, detectLayout, publishStore, handlerMiss, handlerEvent } from './rebuild.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = path.resolve(process.argv[2] ?? '');
const HEADB = path.resolve(process.argv[3] ?? path.join(W, 'HEAD'));
const D = path.join(HEADB, 'middleware/context-oracle/ctxoracle/dist/src');
const { tuningReader, checkTuningWrite } = await import(path.join(D, 'stores/dao/tuning.js'));
const { SCALAR_SEEDS, LIST_SEEDS } = await import(path.join(D, 'stores/dao/tuning_seeds.js'));
const { filesDao } = await import(path.join(D, 'stores/dao/files.js'));
const { resolveRepoKey } = await import(path.join(D, 'identity/repo_key.js'));
const STEPS = ['g1-discarded', 'g2-created', 'g3-mid-copy', 'g4-copied', 'g5-closed', 'g6-renamed', 'g7-global-done',
  'p1-discarded', 'p2-created', 'p3-mid-copy', 'p4-copied', 'p5-bound', 'p6-closed', 'p7-renamed'];

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
function run(home, repo, killAt, args = [], extraEnv = {}) {
  const env = { ...process.env }; delete env.GIT_DIR; delete env.GIT_WORK_TREE; delete env.REBUILD_KILL_AT; delete env.REBUILD_FAULT;
  if (killAt) env.REBUILD_KILL_AT = killAt;
  return spawnSync(process.execPath, ['--no-warnings', path.join(HERE, 'rebuild.mjs'), '--home', home, '--repo', repo, '--head', HEADB, ...args], { env: { ...env, ...extraEnv }, encoding: 'utf8' });
}
const cols = (db, t) => db.prepare(`SELECT name FROM pragma_table_info('${t}') ORDER BY cid`).all().map((r) => r.name);
const has = (db, t) => db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t) !== undefined;
const norm = (rows) => rows.map((r) => JSON.stringify(r)).sort();
const layoutOf = (L) => (L === 'C' ? '4dd0f00-4e070ce' : 'b229c04');
/** The project tables a layout's rules carry (the tables legacyDigests covers). */
const carriedTables = (layout) => Object.entries(RULES[layout].project).filter(([, r]) => ['as-is', 'translate', 'filter', 'meta'].includes(r.rule)).map(([t]) => t).sort();

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
  const pRep = JSON.parse(np.prepare("SELECT detail_json FROM faults WHERE code = 'store_rebuilt'").get()?.detail_json ?? '{"unplaced":[],"legacyDigests":{},"legacyCounts":{}}');
  const gRep = JSON.parse(ng.prepare("SELECT value FROM global_meta WHERE key = 'store_rebuilt'").get()?.value ?? '{"unplaced":[],"legacyDigests":{},"legacyCounts":{}}');
  check(`${tag} the rebuild's records are in the new stores`, () => {
    assert.equal(pRep.layout, layout); assert.equal(gRep.layout, layout);
    assert.equal(np.prepare("SELECT count(*) n FROM faults WHERE code = 'store_rebuilt'").get().n, 1);
    // R6-7: every unplaced entry counts rows; no legacy_unplaced, index_stale or schema_version key is written
    for (const u of [...pRep.unplaced, ...gRep.unplaced]) assert.ok(Number.isInteger(u.rows) && u.rows >= 1, JSON.stringify(u));
    assert.equal(ng.prepare("SELECT count(*) n FROM global_meta WHERE key IN ('legacy_unplaced', 'schema_version')").get().n, 0);
    assert.equal(np.prepare("SELECT count(*) n FROM schema_meta WHERE key IN ('legacy_unplaced', 'index_stale', 'schema_version')").get().n, 0);
  });
  // R6-1/R6-2: the one legacy-file rule. The project file is fully carried; the global
  // file is not, exactly by the owner tunings the validator refused (unplaced), and
  // nothing changed since the rebuild.
  check(`${tag} legacy-file rule: project fully carried, global not (refused tunings only)`, () => {
    assert.equal(legacyNotCarried('project', path.join(legacyHome, 'projects', key, 'store.db'), path.join(home, 'projects', key, 'project.db')), null);
    const g = legacyNotCarried('global', path.join(legacyHome, 'global/global.db'), path.join(home, 'global/global-store.db'));
    const refused = gRep.unplaced.filter((u) => u.table === 'tuning').length;
    assert.ok(refused > 0);
    assert.deepEqual(g, { reason: 'rows not carried', unplacedRows: gRep.unplaced.reduce((s2, u) => s2 + u.rows, 0), unreadTables: [], changedSince: [] });
  });
  const reader = tuningReader(wrap(ng), key, (k) => { throw new Error(`reader re-seeded ${k}`); });
  // R7-1: the one check that pins an outcome. Through the build's own validator,
  // bar.recency_half_life_days 10 is carried and served (AD-13's designed floor,
  // 365.25 x horizon_years / 1022, about 1.79 days) and bar.no_such_key 1 is refused.
  // Run with HEAD's validator (37-day floor), this check fails: HEAD-only evidence.
  check(`${tag} the designed outcome: half-life 10 carried and served, bar.no_such_key refused`, () => {
    assert.ok('ok' in checkTuningWrite(reader, 'bar.recency_half_life_days', '10'), "this build's validator refuses 10: not the designed validator");
    assert.equal(gRep.unplaced.find((x) => x.table === 'tuning' && x.key === 'bar.recency_half_life_days'), undefined);
    assert.equal(reader.str('bar.recency_half_life_days'), '10');
    assert.match(gRep.unplaced.find((x) => x.table === 'tuning' && x.key === 'bar.no_such_key').reason, /^refused: /);
  });
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
    // R7-2: the recorded checksum is the file's with CRLF read as LF, so a CRLF checkout's copy matches it
    const lf = readFileSync(path.join(HERE, '..', '2026-09-28-rebuild-mapping-evidence', 'new-layout', '001_phase_a_project.sql'), 'utf8');
    assert.equal(m['migration_sha256:001_phase_a_project.sql'], migrationChecksum(lf.replaceAll('\n', '\r\n')));
    assert.equal(ng.prepare('SELECT value FROM global_meta WHERE key = ?').get(`repo_path:${realpathSync(repo)}`)?.value, key);
    assert.equal(ng.prepare("SELECT count(*) n FROM global_meta WHERE key LIKE 'legacy_pending:%'").get().n, 0, 'no legacy_pending row is written (R6-3)');
    assert.ok(!legacyProjects(home).includes(key), 'the rebuilt project is no longer legacy by the file test');
    // the digests cover exactly the tables whose rows the rule carries (R6-2)
    const carried = Object.entries(rules.project).filter(([t, r]) => ['as-is', 'translate', 'filter', 'meta'].includes(r.rule) && has(lp, t)).map(([t]) => t).sort();
    assert.deepEqual(Object.keys(pRep.legacyDigests).sort(), carried);
    assert.deepEqual(Object.keys(pRep.legacyCounts).sort(), carried); // R7-5: counts beside the digests
    assert.deepEqual(Object.keys(gRep.legacyCounts).sort(), Object.keys(gRep.legacyDigests).sort());
    assert.deepEqual(Object.keys(gRep.legacyDigests).sort(), ['global_meta', 'lessons', 'tuning', ...(rules.global.whisper_stats.rule === 'as-is' ? ['whisper_stats'] : [])].sort());
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
    if (s === 'g7-global-done') check(`${L} kill at ${s}: the file test names the project still to rebuild, and no row does (R6-3)`, () => {
      assert.deepEqual(legacyProjects(k), [key]);
      // R7-5: a file not rebuilt yet is not carried, with its per-table row counts
      const nc = legacyNotCarried('project', path.join(k, 'projects', key, 'store.db'), path.join(k, 'projects', key, 'project.db'));
      assert.equal(nc.reason, 'not rebuilt yet'); assert.ok(nc.rows.human_facts > 0, JSON.stringify(nc));
      // R8-5: only the tables the rebuild carries are counted, and the command that rebuilds it is named
      assert.equal(nc.command, 'ctxoracle index'); assert.equal(nc.layout, layoutOf(L));
      assert.deepEqual(Object.keys(nc.rows).sort(), carriedTables(layoutOf(L)), 'counts only carried tables');
      const g = ro(path.join(k, 'global/global-store.db'));
      assert.equal(g.prepare("SELECT count(*) n FROM global_meta WHERE key LIKE 'legacy_pending:%'").get().n, 0);
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
  // X1 / R6-1: the unread file's rows are counted, the one rule refuses on it, and the file stays.
  check('D (X1) another layout: not carried, with its row counts; the legacy file is kept', () => {
    const nc = legacyNotCarried('project', lpPath, path.join(d, 'projects', key, 'project.db'));
    console.log(`   X1 legacyNotCarried: ${JSON.stringify(nc)}`);
    assert.equal(nc.reason, 'layout unknown: its rows were not read');
    assert.equal(nc.rows.human_facts, 2);
    assert.ok(existsSync(lpPath));
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
  check('E unreadable (R6-1): not carried, rows unknown', () => {
    const nc = legacyNotCarried('project', lpPath, path.join(d, 'projects', key, 'project.db'));
    console.log(`   E legacyNotCarried: ${JSON.stringify(nc)}`);
    assert.match(nc.reason, /^the file could not be read/); assert.equal(nc.rows, null);
  });
}

// ---------------------------------------------------------------------------
// Round-6 cases. X1 is store D above. X2 and X3 are the reviewer's
// (2026-09-29-architecture-review-round6-cases/extra.mjs, and E-2's command).
// ---------------------------------------------------------------------------
const keyOf = (repo) => resolveRepoKey(realpathSync(repo)).key;
const n = (p, q) => { let x; try { x = ro(p); } catch { return null; } const v = x.prepare(q).get().n; x.close(); return v; };
const dispatch = (build) => path.join(W, build, 'middleware/context-oracle/ctxoracle/dist/src/cli/dispatch.js');
// X2: two repositories on one home with mixed layouts (store C's home, whose global
// store has the 4dd0f00/4e070ce layout, plus store B's b229c04-layout project under a
// second repository's key), and an orphan legacy store whose repository is gone.
{
  const repoX = path.join(W, 'repoX');
  if (!existsSync(repoX)) { // the reviewer's repoX: one commit, fixed date, three files
    mkdirSync(path.join(repoX, 'src'), { recursive: true });
    for (const f of ['a', 'b', 'c']) writeFileSync(path.join(repoX, 'src', `${f}.ts`), `export const ${f} = 1;\n`);
    const env = { ...process.env, GIT_AUTHOR_DATE: '2025-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2025-01-01T00:00:00Z' }; delete env.GIT_DIR; delete env.GIT_WORK_TREE;
    for (const a of [['init', '-q', '-b', 'main', '.'], ['config', 'user.email', 't@example.invalid'], ['config', 'user.name', 'T'], ['config', 'commit.gpgsign', 'false'], ['add', '.'], ['commit', '-q', '-m', 'x']])
      assert.equal(spawnSync('git', a, { cwd: repoX, env }).status, 0, a.join(' '));
  }
  const d = path.join(W, 'test', 'X2'); rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, 'oracleC'), d, { recursive: true });
  const kB = keyOf(repoX), kC = keyOf(path.join(W, 'repoC'));
  cpSync(path.join(W, 'oracleB', 'projects', keyOf(path.join(W, 'repoB'))), path.join(d, 'projects', kB), { recursive: true });
  mkdirSync(path.join(d, 'projects', 'deadbeef0000'), { recursive: true });
  copyFileSync(path.join(W, 'oracleB', 'projects', keyOf(path.join(W, 'repoB')), 'store.db'), path.join(d, 'projects', 'deadbeef0000', 'store.db'));
  const g = path.join(d, 'global/global-store.db');
  const rc = run(d, path.join(W, 'repoC')), afterC = legacyProjects(d);
  const rb = run(d, repoX), afterX = legacyProjects(d);
  const st = (r) => JSON.parse(r.stdout).map((o) => `${o.scope}:${o.state}:${o.layout ?? ''}`).join(' ');
  console.log(`== X2: after repoC exit ${rc.status} ${st(rc)}; legacy projects ${JSON.stringify(afterC)}; after repoX exit ${rb.status} ${st(rb)}; legacy projects ${JSON.stringify(afterX)}`);
  check('X2 both repositories rebuild and bind; no legacy_pending row exists (R6-3)', () => {
    assert.equal(rc.status, 0); assert.equal(rb.status, 0);
    assert.equal(st(rc), 'global:rebuilt:4dd0f00-4e070ce project:rebuilt:4dd0f00-4e070ce');
    assert.equal(st(rb), 'global:current: project:rebuilt:b229c04');
    assert.equal(n(g, "SELECT count(*) n FROM global_meta WHERE key LIKE 'repo_path:%'"), 2);
    assert.equal(n(g, "SELECT count(*) n FROM global_meta WHERE key LIKE 'legacy_pending:%'"), 0);
  });
  check('X2 the file test tracks what is legacy: B still owed after repoC, only the orphan after repoX, nothing once it is removed (R6-3)', () => {
    assert.deepEqual(afterC, [kB, 'deadbeef0000'].sort());
    assert.deepEqual(afterX, ['deadbeef0000']);
    const o = path.join(W, 'test', 'X2-orphan-removed'); rmSync(o, { recursive: true, force: true }); cpSync(d, o, { recursive: true });
    rmSync(path.join(o, 'projects', 'deadbeef0000'), { recursive: true });
    assert.deepEqual(legacyProjects(o), []);
  });
  for (const [k, lab] of [[kB, 'B'], [kC, 'C']]) check(`X2 ${lab}: owner-typed rows arrive, and the file is fully carried`, () => {
    const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
    for (const t of ['human_facts', 'corrections', 'questions']) assert.equal(n(np, `SELECT count(*) n FROM ${t}`), n(lp, `SELECT count(*) n FROM ${t}`), t);
    assert.equal(legacyNotCarried('project', lp, np), null);
  });
  check('X2 lessons arrive', () => assert.equal(n(g, 'SELECT count(*) n FROM lessons'), n(path.join(d, 'global/global.db'), 'SELECT count(*) n FROM lessons')));
}
// X3 (R6-2): a legacy-build `tune` after the rebuild. Every build's tune deletes the
// key's rows and inserts one, so the row count is unchanged; the digest names it.
{
  const d = path.join(W, 'test', 'X3'); rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, 'oracleA'), d, { recursive: true });
  const r = run(d, path.join(W, 'repoA'));
  const lg = path.join(d, 'global/global.db'), ng = path.join(d, 'global/global-store.db');
  const before = legacyNotCarried('global', lg, ng), countBefore = n(lg, 'SELECT count(*) n FROM tuning');
  const home = path.join(W, 'test', 'X3-home'); rmSync(home, { recursive: true, force: true }); mkdirSync(home, { recursive: true });
  const env = { ...process.env, HOME: home, CTXORACLE_HOME: d }; delete env.GIT_DIR; delete env.GIT_WORK_TREE;
  const t = spawnSync(process.execPath, ['--no-warnings', dispatch('b229c04'), 'tune', 'bar.confidence_floor', '0.7'], { cwd: path.join(W, 'repoA'), env, encoding: 'utf8' });
  const after = legacyNotCarried('global', lg, ng), countAfter = n(lg, 'SELECT count(*) n FROM tuning');
  const val = (p) => { const x = ro(p); const v = x.prepare("SELECT value FROM tuning WHERE key = 'bar.confidence_floor' AND source = 'owner'").all().map((y) => y.value); x.close(); return v; };
  console.log(`== X3: rebuild exit ${r.status}; b229c04 tune exit ${t.status} (${t.stdout.trim()}); tuning rows legacy ${countBefore} -> ${countAfter}; legacy floor ${JSON.stringify(val(lg))}, rebuilt ${JSON.stringify(val(ng))}; before ${JSON.stringify(before)}; after ${JSON.stringify(after)}`);
  check('X3 the tune leaves the row count equal, so a count comparison misses it', () => { assert.equal(t.status, 0, t.stderr); assert.equal(countAfter, countBefore); assert.deepEqual(val(lg), ['0.7']); assert.deepEqual(val(ng), ['0.65']); });
  check('X3 the digest names the tuning table as changed since the rebuild (R6-2), with its counts (R7-5)', () => {
    assert.deepEqual(before.changedSince, []);
    const owner = n(lg, "SELECT count(*) n FROM tuning WHERE source = 'owner'");
    assert.deepEqual(after.changedSince, [{ table: 'tuning', rowsAtRebuild: owner, rowsNow: owner }]);
  });
}
// R6-8: rows the new layout refuses are unplaced, not a failure that repeats: an
// invariant_members row whose file id has no legacy files row, and one whose
// invariant does not exist (the new store enforces its foreign keys).
{
  const d = path.join(W, 'test', 'R6-8-refused-rows'); rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, 'oracleB'), d, { recursive: true });
  const key = keyOf(path.join(W, 'repoB'));
  const lp = path.join(d, 'projects', key, 'store.db'), np = path.join(d, 'projects', key, 'project.db');
  const x = new DatabaseSync(lp, { enableForeignKeyConstraints: false }); // a hand edit: node:sqlite enforces foreign keys by default
  const inv = x.prepare('SELECT invariant_id, file_id FROM invariant_members LIMIT 1').get();
  x.prepare('INSERT INTO invariant_members(invariant_id, file_id, span) VALUES(?, 99999, NULL)').run(inv.invariant_id);
  x.prepare("INSERT INTO invariant_members(invariant_id, file_id, span) VALUES('no-such-invariant', ?, NULL)").run(inv.file_id);
  const legacyMembers = x.prepare('SELECT count(*) n FROM invariant_members').get().n; x.close();
  const r = run(d, path.join(W, 'repoB'));
  const o = JSON.parse(r.stdout)[1];
  console.log(`== R6-8: exit ${r.status}; project ${o.state}; unplaced ${JSON.stringify(o.unplaced)}`);
  check('R6-8 refused rows: the rebuild completes, both rows are named unplaced, the rest arrive', () => {
    assert.equal(r.status, 0); assert.equal(o.state, 'rebuilt');
    const u = o.unplaced.filter((e) => e.table === 'invariant_members');
    assert.equal(u.length, 2); assert.ok(u.every((e) => e.rows === 1 && Number.isInteger(e.rowid)));
    assert.ok(u.some((e) => /files\.id 99999: no legacy row/.test(e.reason))); assert.ok(u.some((e) => /FOREIGN KEY constraint failed/.test(e.reason)));
    assert.equal(n(np, 'SELECT count(*) n FROM invariant_members'), legacyMembers - 2);
  });
  check('R6-8 refused rows: the legacy file is not fully carried (2 unplaced rows)', () => {
    assert.deepEqual(legacyNotCarried('project', lp, np), { reason: 'rows not carried', unplacedRows: 2, unreadTables: [], changedSince: [] });
  });
}
// R6-9: a b229c04-layout store whose DDL text has CRLF line endings, as the legacy
// runner writes it from a CRLF checkout (.gitattributes `* text=auto`). Its layout is
// identified and its rows are carried.
{
  const d = path.join(W, 'test', 'R6-9-crlf'); rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, 'oracleB'), d, { recursive: true });
  const key = keyOf(path.join(W, 'repoB'));
  const lp = path.join(d, 'projects', key, 'store.db');
  for (const f of ['', '-wal', '-shm']) rmSync(lp + f, { force: true });
  const EV = path.join(HERE, '..', '2026-09-28-rebuild-mapping-evidence', 'layouts', 'b229c04');
  const c = new DatabaseSync(lp);
  c.exec(readFileSync(path.join(EV, '001_phase_a_project.sql'), 'utf8').replaceAll('\n', '\r\n'));
  c.exec(readFileSync(path.join(EV, '001b_phase_a_fts.sql'), 'utf8').replaceAll('\n', '\r\n'));
  const src = ro(path.join(W, 'oracleB', 'projects', key, 'store.db'));
  for (const { name } of src.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'fts%' AND name NOT LIKE 'sqlite%' ORDER BY rowid").all()) {
    for (const row of src.prepare(`SELECT * FROM ${name}`).all()) { const k = Object.keys(row); c.prepare(`INSERT INTO ${name}(${k.join(', ')}) VALUES(${k.map(() => '?').join(', ')})`).run(...k.map((y) => row[y])); }
  }
  const legacyFacts = src.prepare('SELECT count(*) n FROM human_facts').get().n; src.close();
  const crs = c.prepare("SELECT count(*) n FROM sqlite_master WHERE instr(sql, char(13)) > 0").get().n; c.close();
  const r = run(d, path.join(W, 'repoB'));
  const o = JSON.parse(r.stdout)[1];
  console.log(`== R6-9: ${crs} schema rows hold a CR; exit ${r.status}; project ${o.state}, layout ${o.layout}`);
  check('R6-9 CRLF DDL: identified as b229c04 and carried', () => {
    assert.ok(crs > 0, 'the fixture holds CRLF DDL');
    assert.equal(r.status, 0); assert.equal(o.layout, 'b229c04');
    assert.equal(n(path.join(d, 'projects', key, 'project.db'), 'SELECT count(*) n FROM human_facts'), legacyFacts);
    assert.ok(legacyFacts > 0);
  });
}
// ---------------------------------------------------------------------------
// Round-7 cases. Y1, Y2, Y3, Y5 and Y6 are the round-7 reviewer's
// (2026-09-29-architecture-review-round7-cases/extra7.mjs), here with the expected
// outcomes; Y4 is this test run with the designed validator (README). R7-8 is added.
// ---------------------------------------------------------------------------
const cli = (build, home, repo, ...args) => {
  const h = path.join(W, 'test', 'userhome'); mkdirSync(h, { recursive: true });
  const env = { ...process.env, HOME: h, CTXORACLE_HOME: home }; delete env.GIT_DIR; delete env.GIT_WORK_TREE; delete env.REBUILD_KILL_AT;
  return spawnSync(process.execPath, ['--no-warnings', dispatch(build), ...args], { cwd: repo, env, encoding: 'utf8' });
};
const freshOf = (name, src) => { const d = path.join(W, 'test', name); rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, src), d, { recursive: true }); return d; };
// Y1: an old build's `note` on the legacy project file after its rebuild, one case per layout.
for (const [lab, build] of [['A', 'b229c04'], ['C', '59cc05c']]) {
  const d = freshOf(`Y1-${lab}`, `oracle${lab}`), repo = path.join(W, `repo${lab}`), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const r = run(d, repo);
  const before = legacyNotCarried('project', lp, np), nBefore = n(lp, 'SELECT count(*) n FROM human_facts');
  const c = cli(build, d, repo, 'note', 'typed through the old build after the upgrade');
  const after = legacyNotCarried('project', lp, np);
  console.log(`== Y1 ${lab}: rebuild exit ${r.status}; ${build} note exit ${c.status}; before ${JSON.stringify(before)}; after ${JSON.stringify(after)}`);
  check(`Y1 ${lab}: an old build's note after the rebuild makes the file not carried, naming human_facts with its counts (R6-2, R7-5)`, () => {
    assert.equal(r.status, 0); assert.equal(c.status, 0, c.stderr); assert.equal(before, null);
    assert.deepEqual(after, { reason: 'rows not carried', unplacedRows: 0, unreadTables: [], changedSince: [{ table: 'human_facts', rowsAtRebuild: nBefore, rowsNow: nBefore + 1 }] });
  });
}
// Y2: an in-place update of a carried questions row after the rebuild.
{
  const d = freshOf('Y2', 'oracleB'), k = keyOf(path.join(W, 'repoB'));
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const r = run(d, path.join(W, 'repoB'));
  const x = new DatabaseSync(lp); const ch = x.prepare("UPDATE questions SET status = 'answered', closed_at = 1 WHERE rowid = (SELECT min(rowid) FROM questions WHERE status = 'open')").run().changes; x.close();
  const nc = legacyNotCarried('project', lp, np), q = n(lp, 'SELECT count(*) n FROM questions');
  console.log(`== Y2: rebuild exit ${r.status}; questions rows updated ${ch}; legacyNotCarried ${JSON.stringify(nc)}`);
  check('Y2 an in-place update is named, the count unchanged (R6-2, R7-5)', () => {
    assert.equal(ch, 1);
    assert.deepEqual(nc, { reason: 'rows not carried', unplacedRows: 0, unreadTables: [], changedSince: [{ table: 'questions', rowsAtRebuild: q, rowsNow: q }] });
  });
}
// Y3 (R7-4): a legacy export made by HEAD's `export`, rebuilt as the import rebuilds it,
// then backed into the live project store (modelled by a file copy). The rule reads the
// record of the file it judges, not the latest record.
{
  const repo = path.join(W, 'repoB'), k = keyOf(repo);
  const src = freshOf('Y3-src', 'oracleB');
  const exp = path.join(W, 'test', 'Y3-export'); rmSync(exp, { recursive: true, force: true });
  const e = cli('HEAD', src, repo, 'export', exp);
  const lay = ['project.db', 'global.db'].map((f) => { const db = ro(path.join(exp, f)); db.exec('BEGIN'); const l = detectLayout(db, f === 'project.db' ? 'project' : 'global'); db.exec('COMMIT'); db.close(); return l; });
  const hx = path.join(W, 'test', 'Y3-export-home'); rmSync(hx, { recursive: true, force: true });
  mkdirSync(path.join(hx, 'global'), { recursive: true }); mkdirSync(path.join(hx, 'projects', k), { recursive: true });
  copyFileSync(path.join(exp, 'global.db'), path.join(hx, 'global/global.db')); copyFileSync(path.join(exp, 'project.db'), path.join(hx, 'projects', k, 'store.db'));
  const rx = run(hx, repo, undefined, ['--origin', 'import']); // the import's rebuild of the export (R8-5)
  const d = freshOf('Y3-local', 'oracleB');
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const x = new DatabaseSync(lp); x.prepare("INSERT INTO schema_meta(key, value) VALUES('hand_added_key', 'kept only in this file')").run(); x.close();
  const rl = run(d, repo);
  const own = legacyNotCarried('project', lp, np);
  // A rebuilt file that later cannot be read: not carried, not a throw. (Its own home,
  // rebuilt in place: the record names the file by its path.)
  const d2 = freshOf('Y3-rebuilt-then-unreadable', 'oracleB');
  const r2 = run(d2, repo);
  const lp2 = path.join(d2, 'projects', k, 'store.db');
  for (const f of ['', '-wal', '-shm']) rmSync(lp2 + f, { force: true });
  writeFileSync(lp2, Buffer.alloc(8192, 0x5a));
  let unreadable; try { unreadable = legacyNotCarried('project', lp2, path.join(d2, 'projects', k, 'project.db')); } catch (err) { unreadable = `throws: ${err.message}`; }
  copyFileSync(np, `${np}.pre-import-1`); copyFileSync(path.join(hx, 'projects', k, 'project.db'), np);
  const after = legacyNotCarried('project', lp, np);
  console.log(`== Y3: export exit ${e.status}; layouts ${JSON.stringify(lay)}; export rebuilt exit ${rx.status}; local rebuild exit ${rl.status}; own ${JSON.stringify(own)}; after the import ${JSON.stringify(after)}; rebuilt then unreadable ${JSON.stringify(unreadable)}`);
  check('Y3 a legacy export is identified and rebuilt', () => {
    assert.equal(e.status, 0, e.stderr); assert.deepEqual(lay, ['b229c04', 'b229c04']); assert.equal(rx.status, 0);
    for (const t of ['human_facts', 'corrections', 'questions', 'invariants']) assert.equal(n(path.join(hx, 'projects', k, 'project.db'), `SELECT count(*) n FROM ${t}`), n(path.join(exp, 'project.db'), `SELECT count(*) n FROM ${t}`), t);
  });
  check('Y3 the local file is judged by its own record: not carried before and after the import (R7-4)', () => {
    assert.deepEqual(own, { reason: 'rows not carried', unplacedRows: 1, unreadTables: [], changedSince: [] });
    // R8-5: no record of the local file (the imported store's is the import's), with the
    // carried rows' counts of the kept file and no command (project.db exists)
    assert.equal(after.reason, 'no rebuild record'); assert.equal(after.command, null); assert.equal(after.layout, 'b229c04');
    assert.deepEqual(Object.keys(after.rows).sort(), carriedTables('b229c04'));
    assert.equal(after.rows.human_facts, n(lp, 'SELECT count(*) n FROM human_facts'));
    assert.equal(n(lp, "SELECT count(*) n FROM schema_meta WHERE key = 'hand_added_key'"), 1);
  });
  check('Y3 a rebuilt legacy file that cannot be read is not carried, and the rule does not throw (R7-4)', () => {
    assert.equal(r2.status, 0); assert.equal(typeof unreadable, 'object', String(unreadable)); assert.match(unreadable.reason, /^the file could not be read/); assert.equal(unreadable.rows, null);
  });
}
// Y5 (R7-3) and Z4 (R8-4): a legacy file of a known layout whose schema reads but one
// table's root page is corrupt: the round-7 reviewer's session_log case on store B (the
// round-8 reviewer's Z4 B), the same on store C (Z4 C, the other layout), and
// invariant_members on store B (Y5b), whose count also fails. (Round 8's Y5c, an index
// page of the no-writer table regret, moved to the round-9 index-only cases: a table
// scan now counts it.) Round 8:
// every table that
// reads is carried, the owner's rows included; the table that does not is an unplaced
// whole-table entry with its count (null where it cannot be counted) and its error; the
// file is kept byte-identical and is not fully carried; the second run is a no-op.
const OWNER_TABLES = ['human_facts', 'corrections', 'questions', 'invariants'];
for (const [lab, table, L, countable, page = table] of [['Y5/Z4 B', 'session_log', 'B', true], ['Z4 C', 'session_log', 'C', true], ['Y5b', 'invariant_members', 'B', false]]) {
  const d = freshOf(lab.replaceAll(/[ /]/g, '-'), `oracle${L}`), repo = path.join(W, `repo${L}`), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const x = new DatabaseSync(lp); x.exec('PRAGMA wal_checkpoint(TRUNCATE)'); x.exec('PRAGMA journal_mode = DELETE');
  const ps = x.prepare('PRAGMA page_size').get().page_size;
  const root = x.prepare('SELECT rootpage FROM sqlite_master WHERE name = ?').get(page).rootpage; x.close();
  const fd = openSync(lp, 'r+'); writeSync(fd, Buffer.alloc(ps, 0xa5), 0, ps, (root - 1) * ps); closeSync(fd);
  const sums = shaAll(d);
  const readable = Object.fromEntries(OWNER_TABLES.map((t) => [t, n(lp, `SELECT count(*) n FROM ${t}`)]));
  const r1 = run(d, repo), r2 = run(d, repo);
  const o = JSON.parse(r1.stdout)[1];
  const carried = Object.fromEntries(OWNER_TABLES.map((t) => [t, n(np, `SELECT count(*) n FROM ${t}`)]));
  const nc = legacyNotCarried('project', lp, np);
  const entry = (o.unplaced ?? []).filter((u) => u.unread);
  console.log(`== ${lab}: ${page} root page ${root} overwritten; run 1 exit ${r1.status} project ${o.state} layout ${o.layout}; unread entries ${JSON.stringify(entry)}; owner rows readable in the kept file ${JSON.stringify(readable)}, in the rebuilt store ${JSON.stringify(carried)}; run 2 exit ${r2.status} ${JSON.parse(r2.stdout).map((y) => y.state).join(',')}; legacyNotCarried ${JSON.stringify(nc)}`);
  check(`${lab} a corrupt ${table} page: rebuilt from the file's layout, the file kept byte-identical, the second run a no-op (R7-3, R8-4)`, () => {
    assert.equal(r1.status, 0, r1.stdout + r1.stderr); assert.equal(o.state, 'rebuilt'); assert.equal(o.layout, layoutOf(L)); assert.equal(o.unreadable, undefined);
    assert.equal(r2.status, 0); assert.deepEqual(JSON.parse(r2.stdout).map((y) => y.state), ['current', 'current']);
    const now = shaAll(d); for (const [f, h] of Object.entries(sums)) assert.equal(now[f], h, f);
    assert.equal(n(np, "SELECT value AS n FROM schema_meta WHERE key = 'repo_key'"), k);
  });
  check(`${lab} every owner row that reads is carried (R8-4)`, () => {
    for (const t of OWNER_TABLES) assert.equal(carried[t], readable[t], t);
    assert.ok(Object.values(carried).every((v) => v > 0));
  });
  check(`${lab} the unread table is one unplaced whole-table entry with its count or null, and the file is not carried (R8-4)`, () => {
    assert.equal(entry.length, 1); assert.equal(entry[0].table, table); assert.match(entry[0].reason, /^the table could not be read \(.*malformed/);
    if (countable) assert.ok(Number.isInteger(entry[0].rows)); else assert.equal(entry[0].rows, null);
    assert.equal(n(np, `SELECT count(*) n FROM ${table}`), 0);
    assert.deepEqual(nc, { reason: 'rows not carried', unplacedRows: entry[0].rows ?? 0, unreadTables: [{ table, rows: entry[0].rows }], changedSince: [] });
  });
}
// Y6 (R7-2): a migration's checksum is the same over its LF and its CRLF text.
{
  const EVN = path.join(HERE, '..', '2026-09-28-rebuild-mapping-evidence', 'new-layout');
  const res = readdirSync(EVN).sort().map((f) => { const lf = readFileSync(path.join(EVN, f), 'utf8'); return [f, migrationChecksum(lf).slice(0, 16), migrationChecksum(lf.replaceAll('\n', '\r\n')).slice(0, 16), lf.includes('\r')]; });
  console.log(`== Y6: ${res.map(([f, a, b]) => `${f} LF ${a} CRLF ${b}`).join('; ')}`);
  check('Y6 each migration checksum is line-ending independent (R7-2)', () => { for (const [f, a, b, cr] of res) { assert.equal(cr, false, `${f} committed with CR`); assert.equal(a, b, f); } });
}
// R7-8: the purge's deletion, killed after each file it deletes. No kill leaves the
// legacy definition (a store.db with no project.db), reindex.lock and global.db stay,
// and a re-run completes.
{
  const src = freshOf('R7-8-src', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const r = run(src, repo);
  const pd = path.join(src, 'projects', k);
  copyFileSync(path.join(pd, 'project.db'), path.join(pd, 'project.db.pre-import-1'));
  writeFileSync(path.join(pd, 'reindex.lock'), '');
  const names = readdirSync(pd).filter((f) => f !== 'reindex.lock').sort();
  const purge = (home, killAt) => { const env = { ...process.env }; delete env.REBUILD_KILL_AT; if (killAt) env.REBUILD_KILL_AT = killAt;
    return spawnSync(process.execPath, ['--no-warnings', path.join(HERE, 'rebuild.mjs'), '--purge-files', path.join(home, 'projects', k)], { env, encoding: 'utf8' }); };
  const seen = [];
  for (const f of names) {
    const d = path.join(W, 'test', 'R7-8'); rmSync(d, { recursive: true, force: true }); cpSync(src, d, { recursive: true });
    const pk = purge(d, `purge-after-${f}`);
    const legacyAfterKill = legacyProjects(d);
    const left = readdirSync(path.join(d, 'projects', k)).sort();
    const pr = purge(d);
    const done = readdirSync(path.join(d, 'projects', k));
    seen.push(`${f}: ${pk.signal} left [${left.join(' ')}]`);
    check(`R7-8 purge killed after deleting ${f}: never legacy, a re-run completes`, () => {
      assert.equal(pk.signal, 'SIGKILL', pk.stderr);
      assert.deepEqual(legacyAfterKill, [], `legacy again: [${left.join(' ')}]`);
      assert.equal(pr.status, 0, pr.stderr); assert.deepEqual(done, ['reindex.lock']);
      assert.ok(existsSync(path.join(d, 'global/global.db')));
    });
  }
  console.log(`== R7-8: rebuild exit ${r.status}; files ${names.join(' ')}; kills: ${seen.join('; ')}`);
}
// ---------------------------------------------------------------------------
// Round-8 cases. Z2-Z6b are the round-8 reviewer's
// (2026-09-29-architecture-review-round8-cases/z2-stale-wal.mjs and extra8.mjs), here
// against this prototype with the expected outcomes; one case per round-8 behaviour fix
// is added (R8-1's three store states and the handler, R8-4's new-file fault and
// unreadable files table). Z1 is test-recompute.mjs's.
// ---------------------------------------------------------------------------
const T8 = path.join(W, 'test', 'r8'); mkdirSync(T8, { recursive: true });
const jsonlRows = (f) => (existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const bindingOf = (home, root) => { const g = ro(path.join(home, 'global/global-store.db')); try { return g.prepare('SELECT value FROM global_meta WHERE key = ?').get(`repo_path:${realpathSync(root)}`)?.value ?? null; } finally { g.close(); } };
const hotWal = (db, sqlText) => spawnSync(process.execPath, ['--no-warnings', '-e', `
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(${JSON.stringify(db)});
  db.exec("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0");
  db.exec(${JSON.stringify(sqlText)});
  process.kill(process.pid, 'SIGKILL');`], { encoding: 'utf8' });
// Z2 (R8-3): a stale project.db-wal (its writer killed before any checkpoint, then the
// database unlinked as the purge does) beside (a) a file created empty, (b) a populated
// file renamed in with a plain rename, (c) the same file published by publishStore.
{
  const res = {};
  for (const mode of ['a', 'b', 'c']) {
    const d = path.join(T8, `Z2-${mode}`); rmSync(d, { recursive: true, force: true }); mkdirSync(d, { recursive: true });
    const P = path.join(d, 'project.db');
    const w = hotWal(P, "CREATE TABLE human_facts(id INTEGER PRIMARY KEY, text TEXT); WITH RECURSIVE i(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM i WHERE x < 50) INSERT INTO human_facts(text) SELECT 'purged note ' || x FROM i");
    rmSync(P);
    if (mode === 'a') { const db = new DatabaseSync(P); db.exec('CREATE TABLE human_facts(id INTEGER PRIMARY KEY, text TEXT)'); db.close(); }
    else {
      const T = `${P}.rebuild-tmp`; const t = new DatabaseSync(T);
      t.exec("CREATE TABLE human_facts(id INTEGER PRIMARY KEY, text TEXT); INSERT INTO human_facts(text) VALUES('rebuilt note')"); t.close();
      if (mode === 'b') renameSync(T, P); else publishStore(T, P);
    }
    const db = new DatabaseSync(P, { readOnly: true });
    res[mode] = { writer: w.signal, rows: db.prepare('SELECT count(*) n FROM human_facts').get().n, qc: db.prepare('PRAGMA quick_check').get().quick_check };
    db.close();
  }
  console.log(`== Z2: (a) created empty: rows ${res.a.rows}; (b) populated file, plain rename: rows ${res.b.rows}; (c) publishStore: rows ${res.c.rows}, quick_check ${res.c.qc}`);
  check('Z2 a stale WAL is dropped beside an empty file and replayed into a plainly renamed populated one; publishStore drops it (R8-3)', () => {
    assert.equal(res.a.writer, 'SIGKILL'); assert.equal(res.a.rows, 0); assert.equal(res.b.rows, 50);
    assert.equal(res.c.rows, 1); assert.equal(res.c.qc, 'ok');
  });
}
// Z6 and Z6b (R8-3): the purge killed after unlinking project.db while it has a hot
// WAL, then a store.db appears again (an old build re-creates it; Z6 from B's file,
// Z6b from C's, the other layout) and the rebuild publishes onto project.db.
for (const [lab, srcStore] of [['Z6', 'B'], ['Z6b', 'C']]) {
  const d = freshOf(lab, 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo), pd = path.join(d, 'projects', k), np = path.join(pd, 'project.db');
  const r1 = run(d, repo);
  const w = hotWal(np, "INSERT INTO schema_meta(key, value) VALUES('z6_written_before_purge', 'x')");
  const pk = spawnSync(process.execPath, ['--no-warnings', path.join(HERE, 'rebuild.mjs'), '--purge-files', pd], { env: { ...process.env, REBUILD_KILL_AT: 'purge-after-project.db' }, encoding: 'utf8' });
  const left = readdirSync(pd).sort();
  copyFileSync(path.join(W, `oracle${srcStore}`, 'projects', keyOf(path.join(W, `repo${srcStore}`)), 'store.db'), path.join(pd, 'store.db'));
  const legacy = legacyProjects(d);
  const r2 = run(d, repo);
  const db = ro(np);
  const got = { z6: db.prepare("SELECT count(*) n FROM schema_meta WHERE key = 'z6_written_before_purge'").get().n, recs: db.prepare("SELECT count(*) n FROM faults WHERE code = 'store_rebuilt'").get().n,
    layout: JSON.parse(db.prepare("SELECT detail_json FROM faults WHERE code = 'store_rebuilt'").get()?.detail_json ?? 'null')?.layout, qc: db.prepare('PRAGMA quick_check').get().quick_check };
  db.close();
  console.log(`== ${lab}: writer ${w.signal}; purge ${pk.signal} after project.db, left ${JSON.stringify(left)}; legacy again ${JSON.stringify(legacy)}; rebuild exit ${r2.status}; the new project.db: ${JSON.stringify(got)}`);
  check(`${lab} a rebuild onto a purged name holds none of the purged store's pages (R8-3)`, () => {
    assert.equal(r1.status, 0); assert.equal(w.signal, 'SIGKILL'); assert.equal(pk.signal, 'SIGKILL');
    assert.deepEqual(left, ['project.db-shm', 'project.db-wal']); assert.deepEqual(legacy, [k]);
    assert.equal(r2.status, 0);
    assert.deepEqual(got, { z6: 0, recs: 1, layout: layoutOf(srcStore), qc: 'ok' });
  });
}
// Z3 (R8-1): an orphan legacy store is present, and a second clone of rebuilt
// repository B derives B's key, whose store is current. The handler spawns the child
// once in the session; the child records repo_not_bound and binds nothing. The same
// clone with no legacy store present: the handler records repo_not_bound itself. The
// original root's re-run finds its own binding.
{
  const d = freshOf('Z3', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const r1 = run(d, repo);
  mkdirSync(path.join(d, 'projects', 'deadbeef0000'), { recursive: true });
  copyFileSync(path.join(W, 'oracleB', 'projects', k, 'store.db'), path.join(d, 'projects', 'deadbeef0000', 'store.db'));
  const clone = path.join(T8, 'Z3-clone'); rmSync(clone, { recursive: true, force: true });
  const env = { ...process.env }; delete env.GIT_DIR; delete env.GIT_WORK_TREE;
  const c = spawnSync('git', ['clone', '-q', repo, clone], { env, encoding: 'utf8' });
  const faults = path.join(d, 'diagnostics/faults.jsonl');
  const h1 = handlerMiss({ home: d, root: realpathSync(clone), session: 's-z3', event: 'SessionStart' });
  const rc = h1 === 'spawn' ? run(d, clone, undefined, ['--session', 's-z3']) : null;
  const h2 = handlerMiss({ home: d, root: realpathSync(clone), session: 's-z3', event: 'UserPromptSubmit' });
  const afterSpawn = jsonlRows(faults);
  rmSync(path.join(d, 'projects', 'deadbeef0000'), { recursive: true });
  const h3 = handlerMiss({ home: d, root: realpathSync(clone), session: 's-z3b', event: 'SessionStart' });
  const afterNoLegacy = jsonlRows(faults);
  const rOwn = run(d, repo);
  const pc = rc ? JSON.parse(rc.stdout)[1] : {};
  console.log(`== Z3: clone exit ${c.status}; key of the clone ${keyOf(clone)}; handler ${h1}, child exit ${rc?.status} project ${pc.state} binding ${pc.binding}, second event ${h2}; binding of the clone ${bindingOf(d, clone)}; faults ${JSON.stringify(afterSpawn.map((f) => [f.code, f.session, f.why]))}; no legacy store: handler ${h3}, faults ${afterNoLegacy.length}; repoB re-run binding ${JSON.parse(rOwn.stdout)[1].binding}`);
  check('Z3 a second clone of a rebuilt repository misses visibly, once per session, and is not bound (R8-1)', () => {
    assert.equal(r1.status, 0); assert.equal(c.status, 0); assert.equal(keyOf(clone), k);
    assert.equal(h1, 'spawn'); assert.equal(rc.status, 0); assert.equal(pc.state, 'current'); assert.equal(pc.binding, 'repo_not_bound');
    assert.equal(h2, 'marked');
    assert.equal(bindingOf(d, clone), null); assert.equal(bindingOf(d, repo), k);
    assert.equal(afterSpawn.length, 1);
    assert.deepEqual([afterSpawn[0].code, afterSpawn[0].root, afterSpawn[0].session], ['repo_not_bound', realpathSync(clone), 's-z3']);
  });
  check('Z3 without a legacy store the handler records the same miss itself (R8-1: independent of unrelated legacy stores)', () => {
    assert.equal(h3, 'repo_not_bound'); assert.equal(afterNoLegacy.length, 2);
    assert.deepEqual([afterNoLegacy[1].code, afterNoLegacy[1].root, afterNoLegacy[1].session], ['repo_not_bound', realpathSync(clone), 's-z3b']);
    assert.equal(bindingOf(d, clone), null);
  });
  check("Z3 the rebuilt root's own re-run finds its binding and records nothing (R8-1)", () => {
    assert.equal(rOwn.status, 0); assert.equal(JSON.parse(rOwn.stdout)[1].binding, 'bound'); assert.equal(jsonlRows(faults).length, 2);
  });
  // R8-1, the third state: no store at all for the derived key (X2's repoX, whose key
  // differs from repoB's, in B's home).
  const rn = run(d, path.join(W, 'repoX'), undefined, ['--session', 's-none']);
  const pn = JSON.parse(rn.stdout)[1], fn = jsonlRows(faults).at(-1);
  console.log(`== R8-1 no store: exit ${rn.status} project ${pn.state} binding ${pn.binding}; fault ${JSON.stringify([fn.code, fn.session, fn.why])}`);
  check('R8-1 a derived key with no store records repo_not_bound and binds nothing', () => {
    assert.equal(rn.status, 0); assert.equal(pn.state, 'no-legacy'); assert.equal(pn.binding, 'repo_not_bound');
    assert.notEqual(keyOf(path.join(W, 'repoX')), k); assert.ok(!existsSync(path.join(d, 'projects', keyOf(path.join(W, 'repoX')))));
    assert.deepEqual([fn.code, fn.root, fn.session], ['repo_not_bound', realpathSync(path.join(W, 'repoX')), 's-none']);
    assert.equal(bindingOf(d, path.join(W, 'repoX')), null);
  });
}
// Z5 (R8-5): the rule through a symlinked spelling of the home, through its realpath,
// and for a copy of the home at another path: the same record in each.
{
  const d = freshOf('Z5', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const link = path.join(T8, 'Z5-link'); rmSync(link, { force: true }); symlinkSync(d, link);
  const r = run(link, repo);
  const at = (h) => legacyNotCarried('project', path.join(h, 'projects', k, 'store.db'), path.join(h, 'projects', k, 'project.db'));
  const moved = path.join(T8, 'Z5-moved'); rmSync(moved, { recursive: true, force: true }); cpSync(d, moved, { recursive: true });
  const res = [at(link), at(d), at(moved)];
  console.log(`== Z5: rebuild via a symlinked home exit ${r.status}; rule via the link ${JSON.stringify(res[0])}, via the realpath ${JSON.stringify(res[1])}, for a copy of the home ${JSON.stringify(res[2])}`);
  check('Z5 a home reached by another spelling, or copied, still finds its record: fully carried (R8-5)', () => {
    assert.equal(r.status, 0); assert.deepEqual(res, [null, null, null]);
  });
}
// R8-4 (3): a content error of the new file (injected: SQLITE_CORRUPT from the first
// human_facts insert into the temporary store) fails the rebuild, is not recorded as a
// property of the legacy file, and a run without the fault succeeds.
{
  const d = freshOf('R8-4-new-file-fault', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const sums = shaAll(d);
  const r = run(d, repo, undefined, [], { REBUILD_FAULT: 'tmp-corrupt:human_facts' });
  const o = JSON.parse(r.stdout)[1];
  const legacy = legacyProjects(d), absent = !existsSync(path.join(d, 'projects', k, 'project.db')), same = JSON.stringify(shaAll(d)) === JSON.stringify(sums);
  const r2 = run(d, repo);
  console.log(`== R8-4 new-file fault: exit ${r.status} project ${o.state} error ${JSON.stringify(o.error)}; legacy ${JSON.stringify(legacy)}; next run exit ${r2.status} ${JSON.parse(r2.stdout).map((y) => y.state).join(',')}`);
  check('R8-4 a content error from the new store fails the rebuild and leaves the store legacy; the next run carries every row', () => {
    assert.equal(r.status, 1); assert.equal(o.state, 'failed'); assert.match(o.error, /injected: the new file/);
    assert.deepEqual(legacy, [k]); assert.ok(absent, 'the new name is absent'); assert.ok(same, 'legacy files byte-identical');
    assert.equal(r2.status, 0); assert.equal(legacyNotCarried('project', path.join(d, 'projects', k, 'store.db'), path.join(d, 'projects', k, 'project.db')), null);
  });
}
// R8-4: store B with its legacy files table's root page overwritten. Every row that
// needs a file id is unplaced by the existing rule, one entry per row, with the error;
// the owner tables that need none are carried.
{
  const d = freshOf('R8-4-files-page', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const x = new DatabaseSync(lp); x.exec('PRAGMA wal_checkpoint(TRUNCATE)'); x.exec('PRAGMA journal_mode = DELETE');
  const ps = x.prepare('PRAGMA page_size').get().page_size, root = x.prepare("SELECT rootpage FROM sqlite_master WHERE name = 'files'").get().rootpage;
  const members = x.prepare('SELECT count(*) n FROM invariant_members').get().n; x.close();
  const fd = openSync(lp, 'r+'); writeSync(fd, Buffer.alloc(ps, 0xa5), 0, ps, (root - 1) * ps); closeSync(fd);
  const r = run(d, repo);
  const o = JSON.parse(r.stdout)[1];
  const um = (o.unplaced ?? []).filter((u) => u.table === 'invariant_members');
  const nc = legacyNotCarried('project', lp, np);
  console.log(`== R8-4 files page: exit ${r.status} project ${o.state} layout ${o.layout}; invariant_members ${members} legacy rows, ${um.length} unplaced (first ${JSON.stringify(um[0])}); human_facts carried ${n(np, 'SELECT count(*) n FROM human_facts')}; rule ${JSON.stringify(nc)}`);
  check('R8-4 a corrupt files page unplaces each row needing a file id, and carries the rest', () => {
    assert.equal(r.status, 0); assert.equal(o.state, 'rebuilt'); assert.equal(o.layout, 'b229c04');
    assert.equal(um.length, members); assert.ok(um.every((u) => u.rows === 1 && /malformed/.test(u.reason) && !u.unread));
    assert.equal(n(np, 'SELECT count(*) n FROM human_facts'), n(lp, 'SELECT count(*) n FROM human_facts'));
    assert.equal(nc.reason, 'rows not carried'); assert.ok(nc.unplacedRows >= members);
  });
}
const bindingOf2 = (home, root) => { const gp = path.join(home, 'global/global-store.db'); if (!existsSync(gp)) return null; const g = ro(gp); try { return g.prepare('SELECT value FROM global_meta WHERE key = ?').get(`repo_path:${root}`)?.value ?? null; } finally { g.close(); } };
const n2 = (p, q) => { const x = ro(p); try { return x.prepare(q).get()?.v; } finally { x.close(); } };
// ---------------------------------------------------------------------------
// Round-9 cases. V1-V4 are the round-9 reviewer's
// (2026-09-29-architecture-review-round9-cases/extra9.mjs and extra9b.mjs), here against
// this prototype with the expected outcomes; one case per round-9 behaviour fix is added
// (R9-3's handler after every kill point, R9-5's copy failure after the digest). K1, K2
// and the recompute cases are test-recompute.mjs's.
// ---------------------------------------------------------------------------
const T9 = path.join(W, 'test', 'r9'); mkdirSync(T9, { recursive: true });
// V1 (R9-4): another process holds the legacy project file in EXCLUSIVE locking mode with
// a write transaction open while the rebuild reads its schema (SQLITE_BUSY, a condition
// of the moment). The rebuild fails and leaves the store legacy; once the lock is
// released, the next run carries every owner row.
for (const L of ['B', 'C']) {
  const d = freshOf(`V1-${L}`, `oracle${L}`), repo = path.join(W, `repo${L}`), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const holder = spawn(process.execPath, ['--no-warnings', '-e', `
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(${JSON.stringify(lp)});
    db.exec('PRAGMA locking_mode = EXCLUSIVE; BEGIN IMMEDIATE; SELECT count(*) FROM sqlite_master;');
    db.exec("UPDATE schema_meta SET value = value WHERE key = 'store_created_at'");
    process.stdout.write('locked\\n');
    setTimeout(() => {}, 60000);`], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res) => holder.stdout.once('data', res));
  const r1 = run(d, repo);
  const legacyWhileLocked = legacyProjects(d), absent = !existsSync(np);
  holder.kill('SIGKILL'); await new Promise((res) => holder.once('exit', res));
  const readable = Object.fromEntries(OWNER_TABLES.map((t) => [t, n(lp, `SELECT count(*) n FROM ${t}`)]));
  const r2 = run(d, repo);
  const o1 = JSON.parse(r1.stdout)[1], o2 = JSON.parse(r2.stdout)[1];
  const carried = Object.fromEntries(OWNER_TABLES.map((t) => [t, n(np, `SELECT count(*) n FROM ${t}`)]));
  const rule = legacyNotCarried('project', lp, np);
  const failedRec = jsonlRows(path.join(d, 'projects', k, 'diagnostics/rebuild.jsonl')).filter((x) => x.code === 'store_rebuild_failed');
  console.log(`== V1 ${L}: rebuild while locked exit ${r1.status}: project ${o1.state}, error ${JSON.stringify(o1.error)}; legacy ${JSON.stringify(legacyWhileLocked)}, new name absent ${absent}; lock released: owner rows readable ${JSON.stringify(readable)}; re-run exit ${r2.status} project ${o2.state} layout ${o2.layout}; owner rows in the rebuilt store ${JSON.stringify(carried)}; legacy-file rule ${JSON.stringify(rule)}`);
  check(`V1 ${L} a lock of the moment fails the rebuild (store_rebuild_failed), not a file of no known layout (R9-4)`, () => {
    assert.equal(r1.status, 1); assert.equal(o1.state, 'failed'); assert.match(o1.error, /database is locked/);
    assert.deepEqual(legacyWhileLocked, [k]); assert.ok(absent); assert.equal(failedRec.length, 1);
  });
  check(`V1 ${L} the next run after the lock is released carries every owner row, fully carried`, () => {
    assert.equal(r2.status, 0); assert.equal(o2.state, 'rebuilt'); assert.equal(o2.layout, layoutOf(L));
    assert.deepEqual(carried, readable); assert.ok(Object.values(carried).every((v) => v > 0)); assert.equal(rule, null);
  });
}
// V2 (R9-3): the rebuild killed at each of its 14 steps; then the hook path at the root
// (handlerEvent: the binding lookup, the legacy-store spawn, the miss rule) on
// SessionStart, the child it spawns run with --session, then a UserPromptSubmit of the
// same session. With no other legacy store, and with an unrelated orphan legacy store.
// The root is bound and served in every case, and the outcome is the same either way.
for (const L of ['A', 'C']) {
  const repo = path.join(W, `repo${L}`), k = keyOf(repo), root = realpathSync(repo);
  const lines = [];
  for (const s of STEPS) {
    const res = {};
    for (const orphan of [false, true]) {
      const d = freshOf(`V2-${L}-${s}-${orphan ? 'orphan' : 'alone'}`, `oracle${L}`);
      const rk = run(d, repo, s);
      if (orphan) { mkdirSync(path.join(d, 'projects', 'deadbeef0000'), { recursive: true }); copyFileSync(path.join(W, `oracle${L}`, 'projects', k, 'store.db'), path.join(d, 'projects', 'deadbeef0000', 'store.db')); }
      const bound0 = bindingOf2(d, root);
      const h1 = handlerEvent({ home: d, root, session: 's-v2', event: 'SessionStart' });
      const rc = h1 === 'spawn' ? run(d, repo, undefined, ['--session', 's-v2']) : null;
      const h2 = handlerEvent({ home: d, root, session: 's-v2', event: 'UserPromptSubmit' });
      res[orphan] = { kill: rk.signal, bound0, h1, child: rc ? `${rc.status}:${JSON.parse(rc.stdout)[1]?.binding}` : null, h2, binding: bindingOf(d, repo), faults: jsonlRows(path.join(d, 'diagnostics/faults.jsonl')).map((f) => f.code) };
    }
    lines.push(`${s}: ${JSON.stringify(res[false])}${JSON.stringify(res[true]) === JSON.stringify(res[false]) ? ' (the same with an orphan legacy store)' : ` | with an orphan ${JSON.stringify(res[true])}`}`);
    check(`V2 ${L} kill at ${s}: the hook path binds and serves the root, whether or not an unrelated legacy store exists (R9-3)`, () => {
      for (const o of [false, true]) {
        const r = res[o];
        assert.equal(r.kill, 'SIGKILL'); assert.equal(r.binding, k); assert.deepEqual(r.faults, []); assert.equal(r.h2, 'served');
        assert.equal(r.bound0, ['p5-bound', 'p6-closed', 'p7-renamed'].includes(s) ? k : null, 'bound exactly from step 5 on');
        if (s === 'p7-renamed') { assert.equal(r.h1, 'served'); assert.equal(r.child, null); } else { assert.equal(r.h1, 'spawn'); assert.equal(r.child, '0:bound'); }
      }
      assert.deepEqual(res[true], res[false]);
    });
  }
  console.log(`== V2 ${L} (a kill, then the hook path at the root):\n   ${lines.join('\n   ')}`);
}
// V3 (R9-9, the stated departure): a second clone of repository B fires first while B's
// store is legacy. The child rebuilds and binds the clone, and records the clone as the
// rebuild's root; a new session at the root init ran at then misses visibly.
{
  const d = freshOf('V3', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const clone = path.join(T9, 'V3-clone'); rmSync(clone, { recursive: true, force: true });
  const env = { ...process.env }; delete env.GIT_DIR; delete env.GIT_WORK_TREE;
  const c = spawnSync('git', ['clone', '-q', repo, clone], { env, encoding: 'utf8' });
  const h1 = handlerEvent({ home: d, root: realpathSync(clone), session: 's-v3', event: 'SessionStart' });
  const rc = h1 === 'spawn' ? run(d, clone, undefined, ['--session', 's-v3']) : null;
  const pc = rc ? JSON.parse(rc.stdout)[1] : {};
  const h2 = handlerEvent({ home: d, root: realpathSync(repo), session: 's-v3b', event: 'SessionStart' });
  const f = jsonlRows(path.join(d, 'diagnostics/faults.jsonl'));
  const rec = JSON.parse(n2(path.join(d, 'projects', k, 'project.db'), "SELECT detail_json AS v FROM faults WHERE code = 'store_rebuilt'") ?? '{}');
  console.log(`== V3: clone exit ${c.status}; handler at the clone ${h1}, child exit ${rc?.status} project ${pc.state} binding ${pc.binding}; the record's root is the clone ${rec.root === realpathSync(clone)}; binding of the clone ${bindingOf(d, clone)}, of the root init ran at ${bindingOf(d, repo)}; a new session there: ${h2}; faults ${JSON.stringify(f.map((x) => [x.code, x.root === realpathSync(repo) ? '<init root>' : x.root]))}`);
  check('V3 the first root to fire while the store is legacy is bound and recorded as the rebuild\'s root; the init root misses visibly (R9-9)', () => {
    assert.equal(c.status, 0); assert.equal(keyOf(clone), k); assert.equal(h1, 'spawn'); assert.equal(rc.status, 0); assert.equal(pc.binding, 'bound');
    assert.equal(rec.root, realpathSync(clone)); assert.equal(bindingOf(d, clone), k); assert.equal(bindingOf(d, repo), null);
    assert.equal(h2, 'repo_not_bound'); assert.equal(f.length, 1); assert.equal(f[0].root, realpathSync(repo));
  });
}
// V4 (R9-5) and round 8's Y5c: only an index of a table damaged (its primary-key index's
// root page overwritten), while a table scan reads every row: human_facts on B, corrections
// on C, and the no-writer table regret on B. The table is counted by a scan (NOT INDEXED)
// and carried by its rule; nothing is unread.
for (const [lab, L, table] of [['V4 B', 'B', 'human_facts'], ['V4 C', 'C', 'corrections'], ['Y5c', 'B', 'regret']]) {
  const d = freshOf(lab.replace(' ', '-'), `oracle${L}`), repo = path.join(W, `repo${L}`), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const x = new DatabaseSync(lp); x.exec('PRAGMA wal_checkpoint(TRUNCATE)'); x.exec('PRAGMA journal_mode = DELETE');
  const ps = x.prepare('PRAGMA page_size').get().page_size;
  const idx = x.prepare("SELECT name, rootpage FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND name LIKE 'sqlite_autoindex_%' ORDER BY name LIMIT 1").get(table);
  x.close();
  const fd = openSync(lp, 'r+'); writeSync(fd, Buffer.alloc(ps, 0xa5), 0, ps, (idx.rootpage - 1) * ps); closeSync(fd);
  const y = ro(lp); const scan = y.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all().length;
  let plain; try { plain = y.prepare(`SELECT count(*) n FROM ${table}`).get().n; } catch (e) { plain = `throws: ${e.message}`; } y.close();
  const r = run(d, repo);
  const o = JSON.parse(r.stdout)[1];
  const unread = (o.unplaced ?? []).filter((u) => u.unread), entry = (o.unplaced ?? []).find((u) => u.table === table);
  const inNew = n(np, `SELECT count(*) n FROM ${table}`);
  const nc = legacyNotCarried('project', lp, np);
  console.log(`== ${lab}: ${idx.name} (root page ${idx.rootpage}) overwritten; a table scan reads ${scan} rows, a plain count(*) ${JSON.stringify(plain)}; rebuild exit ${r.status} project ${o.state} layout ${o.layout}; unread entries ${JSON.stringify(unread)}; ${table}: entry ${JSON.stringify(entry ?? null)}, digest ${o.legacyDigests?.[table] === undefined ? 'not taken (no-writer)' : o.legacyDigests[table] === null ? 'null' : 'non-null'}, count ${JSON.stringify(o.legacyCounts?.[table])}, rows in the rebuilt store ${inNew}; legacy-file rule ${JSON.stringify(nc)}`);
  check(`${lab} a damaged index alone leaves the table read and carried by its rule (R9-5)`, () => {
    assert.equal(r.status, 0); assert.equal(o.state, 'rebuilt'); assert.equal(o.layout, layoutOf(L)); assert.match(String(plain), /^throws: .*malformed/);
    assert.deepEqual(unread, []);
    if (table === 'regret') { // no-writer: its rows, if any, are one unplaced entry with the scan's count; store B's has none
      assert.equal(inNew, 0);
      if (scan > 0) { assert.deepEqual([entry.rows, entry.unread], [scan, undefined]); assert.deepEqual(nc, { reason: 'rows not carried', unplacedRows: scan, unreadTables: [], changedSince: [] }); }
      else { assert.equal(entry, undefined); assert.equal(nc, null); }
    }
    else { assert.equal(inNew, scan); assert.equal(o.legacyCounts[table], scan); assert.equal(entry, undefined); assert.equal(nc, null); }
  });
}
// R9-5: a table whose copy fails on the legacy file's content after its digest was taken
// (injected: SQLITE_CORRUPT on the legacy connection at the copy of human_facts) has a
// null digest and count in the record, as AD-4 says, and is an unread entry with its count.
{
  const d = freshOf('R9-5-copy-fails', 'oracleB'), repo = path.join(W, 'repoB'), k = keyOf(repo);
  const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
  const r = run(d, repo, undefined, [], { REBUILD_FAULT: 'legacy-corrupt:human_facts' });
  const o = JSON.parse(r.stdout)[1];
  const unread = (o.unplaced ?? []).filter((u) => u.unread);
  const nc = legacyNotCarried('project', lp, np), facts = n(lp, 'SELECT count(*) n FROM human_facts');
  console.log(`== R9-5 copy fails after the digest: exit ${r.status} project ${o.state}; unread ${JSON.stringify(unread)}; digest ${JSON.stringify(o.legacyDigests?.human_facts)}, count ${JSON.stringify(o.legacyCounts?.human_facts)}; corrections carried ${n(np, 'SELECT count(*) n FROM corrections')}; rule ${JSON.stringify(nc)}`);
  check('R9-5 a table whose copy fails has a null digest and count, one unread entry with its count; the other tables are carried', () => {
    assert.equal(r.status, 0); assert.equal(o.state, 'rebuilt');
    assert.equal(o.legacyDigests?.human_facts, null); assert.equal(o.legacyCounts?.human_facts, null);
    assert.equal(unread.length, 1); assert.equal(unread[0].table, 'human_facts'); assert.equal(unread[0].rows, facts);
    assert.equal(n(np, 'SELECT count(*) n FROM human_facts'), 0); assert.equal(n(np, 'SELECT count(*) n FROM corrections'), n(lp, 'SELECT count(*) n FROM corrections'));
    assert.deepEqual(nc, { reason: 'rows not carried', unplacedRows: facts, unreadTables: [{ table: 'human_facts', rows: facts }], changedSince: [] });
  });
}
console.log(`\n${passes} checks passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
