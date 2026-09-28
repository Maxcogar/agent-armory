// precheck_probe.mjs <rows> — cost of the read-only forward-migration pre-check
// on the hook path: one EXISTS over a table with AD-4's provenance block and no
// human row (the worst case: a full scan), WAL, a fresh process per run.
import { DatabaseSync } from 'node:sqlite';
import { rmSync, existsSync } from 'node:fs';
const N = Number(process.argv[2]); const db = `pc${N}.db`;
if (!existsSync(db)) {
  const d = new DatabaseSync(db); d.exec('PRAGMA journal_mode = WAL');
  d.exec(`CREATE TABLE symbols(id INTEGER PRIMARY KEY, file_id INTEGER NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL, span_start INTEGER NOT NULL, span_end INTEGER NOT NULL, legacy_note TEXT, prov_kind TEXT NOT NULL, prov_ref TEXT NOT NULL, trust TEXT NOT NULL, injection_suspect INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT`);
  d.exec('BEGIN'); const ins = d.prepare('INSERT INTO symbols VALUES (NULL,?,?,?,?,?,NULL,?,?,?,0,1,1)');
  for (let i = 0; i < N; i++) ins.run(i % 3000, `name${i}`, 'function', i, i + 40, 'repo_span', `src/f${i % 3000}.ts:${i}-${i + 40}`, 'untrusted_repo');
  d.exec('COMMIT'); d.close();
}
const d = new DatabaseSync(db, { readOnly: true });
const q = d.prepare(`SELECT EXISTS(SELECT 1 FROM symbols WHERE (prov_kind = 'human' OR trust = 'human') AND legacy_note IS NOT NULL) e`);
const t0 = performance.now(); const r = q.get(); const t1 = performance.now();
console.log(`rows=${N} exists=${r.e} ms=${(t1 - t0).toFixed(2)}`);
