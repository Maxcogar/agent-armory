// Holder process for T-3-6 (reopened Step 3 build delta, G34). NOT a test file —
// no `.test` suffix, so scripts/run-tests.mjs never counts or runs it.
//
// Opens the live store L with wal_autocheckpoint = 0, writes table `other` in
// 300 separate autocommit inserts (each at least one uncheckpointed WAL frame),
// reports `holding <page_size>` on stdout, and keeps L open until its stdin
// ends — so the parent's backupFile runs while another process holds L open
// with uncheckpointed WAL frames (the executed G34 scenario).

import { openStore } from '../../src/stores/adapter.js';

const dbPath = process.argv[2];
if (dbPath === undefined) {
  process.stderr.write('store_backup_holder: expected <dbPath>\n');
  process.exit(2);
}

const store = openStore(dbPath);
store.exec('PRAGMA wal_autocheckpoint = 0');
store.exec('CREATE TABLE other(x TEXT NOT NULL)');
const ins = store.prepare('INSERT INTO other(x) VALUES(?)');
for (let i = 0; i < 300; i++) ins.run(`${i}:`.padEnd(3000, 'x'));
const pageSize = (store.prepare('PRAGMA page_size').get() as { page_size: number }).page_size;
process.stdout.write(`holding ${pageSize}\n`);

process.stdin.resume();
process.stdin.on('end', () => {
  store.close();
  process.exit(0);
});
