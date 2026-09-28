// truncate_probe.mjs <db> — hold of one unfiltered DELETE (SQLite's truncate
// optimization) of cochange_pairs and of commits, WAL, synchronous = NORMAL.
import { DatabaseSync } from 'node:sqlite';
const d = new DatabaseSync(process.argv[2]);
d.exec('PRAGMA journal_mode = WAL'); d.exec('PRAGMA synchronous = NORMAL');
for (const t of ['cochange_pairs', 'commits']) {
  d.exec('BEGIN IMMEDIATE'); const t0 = performance.now();
  const n = d.prepare(`DELETE FROM ${t}`).run().changes; const t1 = performance.now();
  d.exec('COMMIT'); const t2 = performance.now();
  console.log(`${t} rows=${n} work_ms=${(t1 - t0).toFixed(1)} commit_ms=${(t2 - t1).toFixed(1)} hold_ms=${(t2 - t0).toFixed(1)}`);
}
