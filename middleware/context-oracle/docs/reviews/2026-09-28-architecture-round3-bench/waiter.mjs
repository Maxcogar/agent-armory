// waiter.mjs <db> <ms> — the event-path stand-in: one audit-like insert in the
// HEAD adapter's Store.transaction (busy_timeout 100, retry once) every 20 ms,
// for <ms>; prints ok/busy and the longest wait. Uses the r3rev build of HEAD.
import { openStore } from './middleware/context-oracle/ctxoracle/dist/src/stores/adapter.js';
const [, , db, msArg] = process.argv;
const s = openStore(db);
s.exec('CREATE TABLE IF NOT EXISTS audit_probe(id INTEGER PRIMARY KEY, ts INTEGER NOT NULL) STRICT');
const ins = s.prepare('INSERT INTO audit_probe(ts) VALUES (?)');
const end = Date.now() + Number(msArg);
let ok = 0, busy = 0, maxWait = 0;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
while (Date.now() < end) {
  const t0 = performance.now();
  try { s.transaction(() => ins.run(Date.now())); ok++; }
  catch (e) { if (/busy|locked/i.test(String(e?.message)) || e?.name === 'StoreBusy') busy++; else throw e; }
  maxWait = Math.max(maxWait, performance.now() - t0);
  sleep(20);
}
console.log(JSON.stringify({ ok, busy, maxWaitMs: Math.round(maxWait) }));
