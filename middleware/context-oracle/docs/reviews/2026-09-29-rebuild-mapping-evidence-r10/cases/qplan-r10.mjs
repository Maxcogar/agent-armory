// qplan-r10.mjs <work> <build> <scratch> — which legacy reads can use an index (R10-2)? The
// round-10 reviewer's qplan.mjs listed the round-9 query texts by hand; this one records
// every statement the rebuild (and the legacy-file rule) actually prepares on a legacy
// connection, by wrapping DatabaseSync.prototype.prepare, and prints the EXPLAIN QUERY
// PLAN of each that uses an index or a key lookup, and the distinct plans of the rest. Run on a copy of each store in <scratch>, never the source.
import { DatabaseSync } from 'node:sqlite';
import { cpSync, realpathSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const [W, HEADB, S] = process.argv.slice(2).map((p) => path.resolve(p));
const HERE = path.dirname(fileURLToPath(import.meta.url));
const { rebuild, legacyNotCarried } = await import(path.join(HERE, '..', 'rebuild.mjs'));
const orig = DatabaseSync.prototype.prepare, seen = new Map();
DatabaseSync.prototype.prepare = function (sql) {
  const file = orig.call(this, 'PRAGMA database_list').all().find((x) => x.name === 'main')?.file ?? '';
  if (/(\/store|\/global)\.db$/.test(file) && /^\s*SELECT/i.test(sql) && !seen.has(sql)) {
    let plan; try { plan = orig.call(this, `EXPLAIN QUERY PLAN ${sql}`).all().map((x) => x.detail).join('; '); } catch (e) { plan = `(no plan: ${e.message})`; }
    seen.set(sql, plan);
  }
  return orig.call(this, sql);
};
for (const L of ['A', 'B', 'C']) {
  const home = path.join(S, `qplan-${L}`); rmSync(home, { recursive: true, force: true }); cpSync(path.join(W, `oracle${L}`), home, { recursive: true });
  seen.clear();
  const out = await rebuild({ home, repo: path.join(W, `repo${L}`), headBuild: HEADB });
  const key = path.basename(path.dirname(out[1].legacyPath));
  legacyNotCarried('project', path.join(home, 'projects', key, 'store.db'), path.join(home, 'projects', key, 'project.db'));
  legacyNotCarried('global', path.join(home, 'global/global.db'), path.join(home, 'global/global-store.db'));
  const IX = /USING (COVERING )?INDEX|USING INTEGER PRIMARY KEY|USING PRIMARY KEY/;
  const idx = [...seen].filter(([, p]) => IX.test(p));
  console.log(`${L}: ${out.map((o) => o.state).join(',')}; ${seen.size} distinct SELECT statements on the legacy connections; those whose plan names an index or a key lookup: ${idx.length ? idx.map(([q, p]) => `${q.replace(/\s+/g, ' ')} -> ${p}`).join(' | ') : 'none'}; the rest: ${[...new Set([...seen.values()].filter((p) => !IX.test(p)).map((p) => p.replace(/(SCAN|SEARCH) (?!pragma|sqlite_master)[^;\s]+/g, '$1 <table>')))].join(' / ')}`);
  rmSync(home, { recursive: true, force: true });
}
