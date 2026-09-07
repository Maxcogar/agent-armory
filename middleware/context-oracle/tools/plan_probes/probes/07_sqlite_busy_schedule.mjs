// Claim (Step 3, T3-3): with busy_timeout 100 ms and retry-once, A holding BEGIN IMMEDIATE 0–400 ms, C at 100 ms raises StoreBusy after two attempts, B at 250 ms succeeds on its second attempt.
import { DatabaseSync } from 'node:sqlite'; import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const dir = process.env.PROBE_LAYOUT; const db = path.join(dir, 'probe07.db'); for (const s of ['', '-wal', '-shm']) { try { fs.unlinkSync(db + s) } catch {} }
const init = new DatabaseSync(db); init.exec('PRAGMA journal_mode=WAL; CREATE TABLE t(v TEXT) STRICT'); init.close();
const child = path.join(dir, 'probe07_child.cjs');
fs.writeFileSync(child, `
const { DatabaseSync } = require('node:sqlite'); const [,, p, name, startMs, holdMs] = process.argv; const t0 = Number(process.env.T0);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); const now = () => Date.now() - t0;
sleep(Math.max(0, Number(startMs) - now())); const d = new DatabaseSync(p, { timeout: 100 }); let attempts = 0, ok = false;
while (attempts < 2 && !ok) { attempts++; try { d.exec('BEGIN IMMEDIATE'); d.exec("INSERT INTO t(v) VALUES ('" + name + "')"); if (Number(holdMs) > 0) sleep(Number(holdMs)); d.exec('COMMIT'); ok = true; } catch (e) {} }
console.log(name + ' ' + (ok ? 'success' : 'StoreBusy') + ' attempts=' + attempts);`);
// three runs; the schedule must produce the same outcome every time
const runs = [];
for (let i = 0; i < 3; i++) {
  new DatabaseSync(db).exec('DELETE FROM t');
  const T0 = Date.now(); const kids = [['A', 0, 400], ['C', 100, 0], ['B', 250, 0]].map(([n, s, h]) => spawn(process.execPath, [child, db, n, String(s), String(h)], { env: { ...process.env, T0: String(T0), NODE_NO_WARNINGS: '1' } }));
  const outs = await Promise.all(kids.map(k => new Promise(r => { let o = ''; k.stdout.on('data', d => o += d); k.on('exit', () => r(o.trim())); })));
  runs.push(outs.sort().join(' | ') + ' | rows ' + JSON.stringify(new DatabaseSync(db).prepare('SELECT v FROM t ORDER BY v').all().map(r => r.v)));
}
console.log('identical across 3 runs:', new Set(runs).size === 1); console.log(runs[0].split(' | ').join('\n'));
