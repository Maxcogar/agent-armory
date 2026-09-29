// Does VACUUM INTO (AD-5's export) keep the implicit rowids that recompute_pending.done names?
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const dir = mkdtempSync(path.join(os.tmpdir(), 'vr-'));
const d = new DatabaseSync(path.join(dir, 'a.db'));
console.log('sqlite', d.prepare('select sqlite_version() v').get().v);
d.exec(`CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER, weight REAL);
CREATE TABLE cochange_pairs(a INTEGER, b INTEGER, pair_weight REAL, PRIMARY KEY(a,b));`);
d.exec('BEGIN');
for (let i = 0; i < 400; i++) d.prepare('INSERT INTO commits VALUES(?,?,0)').run('h' + ((i * 7919) % 400).toString(16).padStart(4, '0'), i);
for (let i = 0; i < 400; i++) d.prepare('INSERT INTO cochange_pairs VALUES(?,?,0)').run((i * 37) % 97, 100 + i);
d.exec('COMMIT');
d.exec("DELETE FROM commits WHERE rowid % 3 = 0; DELETE FROM cochange_pairs WHERE rowid % 5 = 0");
for (const variant of ['VACUUM INTO', 'VACUUM']) {
  const before = { c: d.prepare('SELECT rowid r, hash k FROM commits ORDER BY rowid').all(), p: d.prepare('SELECT rowid r, a, b FROM cochange_pairs ORDER BY rowid').all() };
  let e;
  if (variant === 'VACUUM INTO') { d.exec(`VACUUM INTO '${path.join(dir, 'x.db')}'`); e = new DatabaseSync(path.join(dir, 'x.db')); }
  else { d.exec('VACUUM'); e = d; }
  const after = { c: e.prepare('SELECT rowid r, hash k FROM commits ORDER BY rowid').all(), p: e.prepare('SELECT rowid r, a, b FROM cochange_pairs ORDER BY rowid').all() };
  const same = (x, y) => x.length === y.length && x.every((r, i) => JSON.stringify(r) === JSON.stringify(y[i]));
  const firstDiff = (x, y) => { const i = x.findIndex((r, i) => JSON.stringify(r) !== JSON.stringify(y[i])); return i < 0 ? null : { before: x[i], after: y[i] }; };
  console.log(`${variant}: commits rowids kept ${same(before.c, after.c)} ${JSON.stringify(firstDiff(before.c, after.c))}; cochange_pairs rowids kept ${same(before.p, after.p)} ${JSON.stringify(firstDiff(before.p, after.p))}`);
}
rmSync(dir, { recursive: true, force: true });
