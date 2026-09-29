// Which legacy reads of rebuild.mjs (r9) can use an index? EXPLAIN QUERY PLAN of the copy's
// row query, the digest query and the counts, on a copy of each legacy store (never the source).
import { DatabaseSync } from 'node:sqlite';
import { copyFileSync, mkdtempSync } from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const [W, R] = process.argv.slice(2);
const { RULES, detectLayout } = await import(path.join(R, 'rebuild.mjs'));
for (const s of ['A', 'B', 'C']) for (const scope of ['project', 'global']) {
  const src = path.join(W, `oracle${s}`, scope === 'project' ? 'projects/c6d653fb7aac/store.db' : 'global/global.db');
  const tmp = path.join(mkdtempSync(path.join(os.tmpdir(), 'qp-')), 'x.db'); copyFileSync(src, tmp);
  const d = new DatabaseSync(tmp, { readOnly: true });
  const layout = detectLayout(d, scope);
  const rules = RULES[layout][scope];
  const uses = [];
  for (const [t, r] of Object.entries(rules)) {
    const lcols = d.prepare(`SELECT name FROM pragma_table_info('${t}')`).all().map((x) => x.name);
    const set = r.set ?? {};
    const orderBy = set.seq === 'order' ? 'ts, rowid' : lcols.includes('seq') ? 'seq' : 'rowid';
    const qs = [];
    if (['as-is', 'translate', 'filter'].includes(r.rule)) {
      qs.push(['copy rows', `SELECT rowid AS __rowid, * FROM ${t}${r.where ? ` WHERE ${r.where}` : ''} ORDER BY ${orderBy}`]);
      qs.push(['digest', `SELECT * FROM ${t}${r.where ? ` WHERE ${r.where}` : ''} ORDER BY rowid`]);
      qs.push(['copy count', `SELECT count(*) AS n FROM "${t}" NOT INDEXED`]);
    }
    if (r.rule === 'merge') qs.push(['merge rows', `SELECT rowid, key, project_key, value, source, updated_at FROM tuning WHERE source = 'owner' ORDER BY rowid`]);
    if (r.rule === 'meta') qs.push(['meta rows', `SELECT key, value FROM ${t} ORDER BY key`]);
    for (const [what, q] of qs) {
      const plan = d.prepare(`EXPLAIN QUERY PLAN ${q}`).all().map((x) => x.detail).join('; ');
      if (/INDEX/.test(plan)) uses.push(`${t} ${what}: ${plan}`);
    }
  }
  if (scope === 'project') { const p = d.prepare('EXPLAIN QUERY PLAN SELECT * FROM files WHERE id = ?').all().map((x) => x.detail).join('; '); uses.push(`files lookup: ${p}`); }
  console.log(`${s} ${scope} (${layout}): reads that use an index: ${uses.length ? uses.join(' | ') : 'none'}`);
  d.close();
}
