// Claim (Step 3, T-3-3): with busy_timeout 100 ms and retry-once, under a
// causally forced schedule — A holds BEGIN IMMEDIATE and says so; C then makes
// both of its attempts while A holds and raises StoreBusy; B then makes its
// first attempt while A holds, A commits only after B reports that first
// failure, and B's retry succeeds — the outcomes are A success (1 attempt),
// C StoreBusy (2 attempts), B success (2 attempts), rows [A, B], on every run
// regardless of machine load. Every step waits for the previous step's
// observable (a line on stdout or a marker file); no wall-clock offset exists.
import { DatabaseSync } from 'node:sqlite'; import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const dir = process.env.PROBE_LAYOUT; const db = path.join(dir, 'probe07.db');
const mark = (n) => path.join(dir, 'probe07.' + n + '.go');
for (const s of ['', '-wal', '-shm']) { try { fs.unlinkSync(db + s) } catch {} }
for (const n of ['A', 'B', 'Bfirst']) { try { fs.unlinkSync(mark(n)) } catch {} }
const init = new DatabaseSync(db); init.exec('PRAGMA journal_mode=WAL; CREATE TABLE t(v TEXT) STRICT'); init.close();
const child = path.join(dir, 'probe07_child.cjs');
fs.writeFileSync(child, `
const { DatabaseSync } = require('node:sqlite'); const fs = require('node:fs'); const [,, p, name, mode, goFile, firstFile] = process.argv;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const waitFor = (f) => { while (!fs.existsSync(f)) sleep(5); };
const d = new DatabaseSync(p, { timeout: 100 });
const say = (m) => fs.writeSync(1, m + '\\n');
if (mode === 'hold') { d.exec('BEGIN IMMEDIATE'); d.exec("INSERT INTO t(v) VALUES ('" + name + "')"); say('holding'); waitFor(goFile); d.exec('COMMIT'); say(name + ' success attempts=1'); }
else {
  let attempts = 0, ok = false;
  while (attempts < 2 && !ok) {
    attempts++;
    try { d.exec('BEGIN IMMEDIATE'); d.exec("INSERT INTO t(v) VALUES ('" + name + "')"); d.exec('COMMIT'); ok = true; }
    catch (e) { say(name + ' busy attempt=' + attempts); if (attempts === 1 && firstFile) { fs.writeFileSync(firstFile, ''); waitFor(goFile); } }
  }
  say(name + ' ' + (ok ? 'success' : 'StoreBusy') + ' attempts=' + attempts);
}
d.close();`);
function start(name, mode, goFile, firstFile) {
  const k = spawn(process.execPath, [child, db, name, mode, goFile || '', firstFile || ''], { env: { ...process.env, NODE_NO_WARNINGS: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
  let out = '';
  k.stdout.on('data', (c) => { out += c; });
  const exited = new Promise((r) => k.on('close', () => r(out.trim().split('\n'))));
  const seen = (re) => new Promise((r) => { const t = setInterval(() => { if (re.test(out)) { clearInterval(t); r(); } }, 5); });
  return { exited, seen };
}
const waitFile = (f) => new Promise((r) => { const t = setInterval(() => { if (fs.existsSync(f)) { clearInterval(t); r(); } }, 5); });
const runs = [];
for (let i = 0; i < 3; i++) {
  const conn = new DatabaseSync(db); conn.exec('DELETE FROM t'); conn.close();
  for (const n of ['A', 'B', 'Bfirst']) { try { fs.unlinkSync(mark(n)) } catch {} }
  const A = start('A', 'hold', mark('A')); await A.seen(/^holding$/m);          // A holds and has said so
  const C = start('C', 'plain'); const cLines = await C.exited;                 // both C attempts while A holds
  const B = start('B', 'plain', mark('B'), mark('Bfirst')); await waitFile(mark('Bfirst')); // B's first attempt failed while A holds
  fs.writeFileSync(mark('A'), ''); const aLines = await A.exited;              // A commits only now
  fs.writeFileSync(mark('B'), ''); const bLines = await B.exited;              // B's retry finds the lock free
  const final = [...aLines, ...cLines, ...bLines].filter((l) => / (success|StoreBusy) attempts=/.test(l)).sort();
  const rows = new DatabaseSync(db); const vs = rows.prepare('SELECT v FROM t ORDER BY v').all().map((r) => r.v); rows.close();
  runs.push(final.join(' | ') + ' | rows ' + JSON.stringify(vs));
}
console.log('identical across 3 runs:', new Set(runs).size === 1); console.log(runs[0].split(' | ').join('\n'));
