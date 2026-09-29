// z2-stale-wal.mjs — round-8 review, case Z2 (R7-8's order: "each database file before
// its -journal, -wal and -shm", and "A journal or WAL left beside a deleted database is
// harmless: SQLite deletes a journal or WAL it finds beside an empty database").
// A project.db with a hot WAL (its writer killed before any checkpoint) is purged in
// AD-20's order and the purge is killed after project.db is unlinked, before its -wal.
// Then a new project.db appears at that name in two ways:
//   (a) opened empty by node:sqlite (a direct creation): SQLite deletes the stale WAL;
//   (b) renamed into place already populated, as AD-4's rebuild publishes its
//       <new name>.rebuild-tmp (step 5), whose step 1 discards only the temporary
//       file's -journal/-wal/-shm.
//   node z2-stale-wal.mjs <dir>
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, renameSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
const dir = path.resolve(process.argv[2] ?? 'z2');
for (const mode of ['a', 'b']) {
  const d = path.join(dir, mode); rmSync(d, { recursive: true, force: true }); mkdirSync(d, { recursive: true });
  const P = path.join(d, 'project.db');
  // The purged store: WAL mode, rows committed into the WAL, the writer SIGKILLed.
  const w = spawnSync(process.execPath, ['--no-warnings', '-e', `
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(${JSON.stringify(P)});
    db.exec("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE human_facts(id INTEGER PRIMARY KEY, text TEXT)");
    for (let i = 0; i < 50; i++) db.prepare('INSERT INTO human_facts(text) VALUES(?)').run('purged note ' + i);
    process.kill(process.pid, 'SIGKILL');`]);
  const before = readdirSync(d).sort();
  rmSync(P); // purge: the database file first ... killed here, before project.db-wal
  const left = readdirSync(d).sort();
  if (mode === 'a') {
    const db = new DatabaseSync(P); // direct creation of an empty file
    db.exec('CREATE TABLE human_facts(id INTEGER PRIMARY KEY, text TEXT)');
    const n = db.prepare('SELECT count(*) AS n FROM human_facts').get().n; db.close();
    console.log(`Z2 (a) writer signal ${w.signal}; before ${JSON.stringify(before)}; after unlinking project.db ${JSON.stringify(left)}; empty open: rows ${n}; files ${JSON.stringify(readdirSync(d).sort())}`);
  } else {
    const T = path.join(d, 'project.db.rebuild-tmp');
    const t = new DatabaseSync(T); // rollback-journal mode, as AD-4 step 2 creates it
    t.exec("CREATE TABLE human_facts(id INTEGER PRIMARY KEY, text TEXT); CREATE TABLE schema_meta(key TEXT PRIMARY KEY, value TEXT); INSERT INTO schema_meta VALUES('store_created_at','rebuilt'); INSERT INTO human_facts(text) VALUES('rebuilt note')");
    t.close();
    renameSync(T, P);
    let out;
    try {
      const db = new DatabaseSync(P);
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((r) => r.name);
      let rows; try { rows = db.prepare('SELECT count(*) AS n FROM human_facts').get().n; } catch (e) { rows = e.message; }
      let qc; try { qc = db.prepare('PRAGMA quick_check').all().map((r) => r.quick_check).join('|'); } catch (e) { qc = e.message; }
      out = `tables ${JSON.stringify(tables)}; human_facts rows ${rows}; quick_check ${qc}`;
      db.close();
    } catch (e) { out = `open failed: ${e.message}`; }
    console.log(`Z2 (b) writer signal ${w.signal}; before ${JSON.stringify(before)}; after unlinking project.db ${JSON.stringify(left)}; populated file renamed in: ${out}`);
  }
}
