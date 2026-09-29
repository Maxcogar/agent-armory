// bench-checkpoint.mjs — F5-10: the pass's lock hold for the chunk shape AD-26
// keeps (write for miner.chunk_ms = 50 ms, commit, yield miner.chunk_gap_ms =
// 30 ms), with and without SQLite's automatic checkpoint on the pass connection,
// beside a handler-like waiter.
//
//   node bench-checkpoint.mjs build <db>
//   node bench-checkpoint.mjs pass <db> <variant> <chunks>      variant: auto | gap
//   node bench-checkpoint.mjs waiter <db> <ms> <head-build> <handlerAuto 1|0>
//   node bench-checkpoint.mjs run <dir> <head-build> <variant> <handlerAuto> <runs>
//
// The store is the round-3 bench's seed-sized shape (3,000 files, 10,000 commits,
// 300,000 commit_touches, 289,606 pairs), built here with the same PRNG. A pass
// chunk mines synthetic 30-file commits: one commits row, 30 commit_touches, 30
// files updates and the 435 pair upserts — the mine's writes (AD-13) — checking
// the elapsed time before each commit's writes (AD-26's before-write rule).
//   auto: the pass connection keeps the default wal_autocheckpoint (1000 pages).
//   gap:  PRAGMA wal_autocheckpoint = 0 on the pass connection, and
//         PRAGMA wal_checkpoint(PASSIVE) at the start of each yield gap, outside
//         any transaction.
// The waiter is the HEAD adapter's Store (busy_timeout 100 ms, one retry): one
// single-row insert every 20 ms; handlerAuto 0 also sets wal_autocheckpoint = 0 on it.
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , mode, ...a] = process.argv;
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
let seed = 12345;
const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hex = (n) => { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(rnd() * 16).toString(16); return s; };
function open(p, auto) {
  const d = new DatabaseSync(p);
  d.exec('PRAGMA journal_mode = WAL'); d.exec('PRAGMA synchronous = NORMAL'); d.exec('PRAGMA busy_timeout = 100');
  if (!auto) d.exec('PRAGMA wal_autocheckpoint = 0');
  return d;
}
const pct = (xs, p) => { const s = [...xs].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

if (mode === 'build') {
  const [db] = a;
  for (const f of [db, `${db}-wal`, `${db}-shm`]) rmSync(f, { force: true });
  const d = open(db, true);
  d.exec(`CREATE TABLE files(id INTEGER PRIMARY KEY, path TEXT NOT NULL UNIQUE, change_count INTEGER NOT NULL, change_weight REAL NOT NULL) STRICT;
    CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL, entity_count INTEGER NOT NULL, excluded INTEGER NOT NULL, weight REAL) STRICT;
    CREATE TABLE commit_touches(commit_hash TEXT NOT NULL, file_id INTEGER NOT NULL, PRIMARY KEY(commit_hash, file_id)) STRICT, WITHOUT ROWID;
    CREATE INDEX ct_file ON commit_touches(file_id, commit_hash);
    CREATE TABLE cochange_pairs(a INTEGER NOT NULL, b INTEGER NOT NULL, pair_count INTEGER NOT NULL, pair_weight REAL NOT NULL, last_ts INTEGER NOT NULL, last_commit TEXT NOT NULL, PRIMARY KEY(a,b), CHECK(a<b)) STRICT;
    CREATE INDEX cochange_pairs_b ON cochange_pairs(b);`);
  d.exec('BEGIN');
  const fi = d.prepare('INSERT INTO files VALUES (?,?,?,?)');
  for (let i = 1; i <= 3000; i++) fi.run(i, `src/dir${i % 97}/file${i}.ts`, 10, 1.5 + rnd());
  const ci = d.prepare('INSERT INTO commits VALUES (?,?,?,?,?)'), ti = d.prepare('INSERT OR IGNORE INTO commit_touches VALUES (?,?)');
  const hashes = [];
  for (let c = 0; c < 10000; c++) { const h = c.toString(16).padStart(8, '0') + hex(32); hashes.push(h); ci.run(h, 1600000000 + c * 1000, 30, 0, 0.5 + rnd()); for (let k = 0; k < 30; k++) ti.run(h, 1 + Math.floor(rnd() * 3000)); }
  const pi = d.prepare('INSERT OR IGNORE INTO cochange_pairs VALUES (?,?,?,?,?,?)');
  let pairs = 0;
  while (pairs < 289606) { let x = 1 + Math.floor(rnd() * 3000), y = 1 + Math.floor(rnd() * 3000); if (x === y) continue; if (x > y) [x, y] = [y, x]; pairs += pi.run(x, y, 1 + Math.floor(rnd() * 5), rnd() * 4, 1600000000, hashes[Math.floor(rnd() * 10000)]).changes; }
  d.exec('COMMIT'); d.exec('PRAGMA wal_checkpoint(TRUNCATE)'); d.close();
  console.log('built');
} else if (mode === 'pass') {
  const [db, variant, chunksArg] = a;
  const d = open(db, variant === 'auto');
  const CHUNK_MS = 50, GAP_MS = 30, CHUNKS = Number(chunksArg);
  const ci = d.prepare('INSERT INTO commits VALUES (?,?,?,?,?)'), ti = d.prepare('INSERT OR IGNORE INTO commit_touches VALUES (?,?)');
  const fu = d.prepare('UPDATE files SET change_count = change_count + 1, change_weight = change_weight + ? WHERE id = ?');
  const pu = d.prepare(`INSERT INTO cochange_pairs VALUES (?,?,1,?,?,?) ON CONFLICT(a,b) DO UPDATE SET pair_count = pair_count + 1,
    pair_weight = pair_weight + excluded.pair_weight, last_ts = excluded.last_ts, last_commit = excluded.last_commit`);
  const holds = [], ckpts = [];
  let c = 0;
  for (let k = 0; k < CHUNKS; k++) {
    d.exec('BEGIN IMMEDIATE');
    const t0 = performance.now();
    do {
      const h = `f${(c++).toString(16).padStart(7, '0')}${hex(32)}`, ts = 1700000000 + c, w = 0.5 + rnd();
      ci.run(h, ts, 30, 0, w);
      const fs = new Set(); while (fs.size < 30) fs.add(1 + Math.floor(rnd() * 3000));
      const ids = [...fs].sort((x, y) => x - y);
      for (const f of ids) { ti.run(h, f); fu.run(w, f); }
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pu.run(ids[i], ids[j], w, ts, h);
    } while (performance.now() - t0 < CHUNK_MS);
    d.exec('COMMIT');
    holds.push(performance.now() - t0);
    const g0 = performance.now();
    if (variant === 'gap') { d.prepare('PRAGMA wal_checkpoint(PASSIVE)').get(); ckpts.push(performance.now() - g0); }
    const left = GAP_MS - (performance.now() - g0);
    if (left > 0) sleep(left);
  }
  d.close();
  console.log(JSON.stringify({ variant, chunks: CHUNKS, commits: c, holdMax: +Math.max(...holds).toFixed(1), holdP99: +pct(holds, 0.99).toFixed(1), holdP50: +pct(holds, 0.5).toFixed(1),
    over150: holds.filter((x) => x > 150).length, over200: holds.filter((x) => x > 200).length,
    ckptMax: ckpts.length ? +Math.max(...ckpts).toFixed(1) : null, ckptP50: ckpts.length ? +pct(ckpts, 0.5).toFixed(1) : null }));
} else if (mode === 'waiter') {
  const [db, msArg, head, handlerAuto] = a;
  const { openStore } = await import(path.join(head, 'middleware/context-oracle/ctxoracle/dist/src/stores/adapter.js'));
  const s = openStore(db);
  if (handlerAuto === '0') s.exec('PRAGMA wal_autocheckpoint = 0');
  s.exec('CREATE TABLE IF NOT EXISTS audit_probe(id INTEGER PRIMARY KEY, ts INTEGER NOT NULL) STRICT');
  const ins = s.prepare('INSERT INTO audit_probe(ts) VALUES (?)');
  const end = Date.now() + Number(msArg);
  let ok = 0, busy = 0; const waits = [];
  while (Date.now() < end) {
    const t0 = performance.now();
    try { s.transaction(() => ins.run(Date.now())); ok++; } catch (e) { if (/busy|locked/i.test(String(e?.message)) || e?.name === 'StoreBusy') busy++; else throw e; }
    waits.push(performance.now() - t0);
    sleep(20);
  }
  console.log(JSON.stringify({ ok, busy, waitMax: +Math.max(...waits).toFixed(1), waitP99: +pct(waits, 0.99).toFixed(1), over200: waits.filter((x) => x > 200).length }));
} else if (mode === 'run') {
  const [dir, head, variant, handlerAuto, runsArg] = a;
  const me = fileURLToPath(import.meta.url);
  const base = path.join(dir, 'ckpt-base.db');
  if (!existsSync(base)) await new Promise((r) => spawn(process.execPath, ['--no-warnings', me, 'build', base], { stdio: 'inherit' }).on('exit', r));
  for (let i = 0; i < Number(runsArg); i++) {
    const db = path.join(dir, 'ckpt.db');
    for (const f of [db, `${db}-wal`, `${db}-shm`]) rmSync(f, { force: true });
    copyFileSync(base, db);
    const out = (args) => new Promise((r) => { let s = ''; const p = spawn(process.execPath, ['--no-warnings', me, ...args]); p.stdout.on('data', (x) => (s += x)); p.stderr.on('data', (x) => (s += x)); p.on('exit', () => r(s.trim())); });
    const w = out(['waiter', db, '26000', head, handlerAuto]);
    sleep(300);
    const p = await out(['pass', db, variant, '300']);
    const wr = await w;
    const wal = existsSync(`${db}-wal`) ? statSync(`${db}-wal`).size : 0;
    console.log(`run ${i + 1} variant=${variant} handlerAuto=${handlerAuto} pass=${p} waiter=${wr} walBytesAtEnd=${wal}`);
  }
}
