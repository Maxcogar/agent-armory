// recompute.mjs — a model of AD-13's mining pass around a full recompute (the
// mined-with rule's case 1), for the round-8 findings R8-2 and R8-7. It is a model over
// a small synthetic store (the tables and sums AD-13 names, no git read, no eviction),
// not the miner. It is bench-epoch.mjs's store (2026-09-28 evidence) and the round-8
// reviewer's z1-resume.mjs model, with the rule changed:
//
//   R8-2: the round-7 resume (schema_meta.recompute_done, R7-9) is removed. A full
//         recompute restarts from its first row after an interruption. The marker
//         recompute_pending (it replaces recompute_epoch) says only that a recompute
//         was started and not finished; the pass that finds it recomputes every row.
//   R8-7: a pass that runs a full recompute uses one epoch for all of its own work:
//         E = its own refTs. The recompute caps ts at it, the pass's mine weights
//         its new commits with it (and caps their ts at it), and the final
//         transaction writes it as weight_epoch, with h as mined_half_life_days.
//         A pass with no recompute uses the stored weight_epoch and caps at its refTs.
//
// A pass: compare the mined-with values (h, and here the epoch bound), then recompute
// if needed, then mine the new commits, then the final transaction. `stopAfter`
// kills the pass after that many committed transactions (the model of SIGKILL).
//
//   import { build, pass, freshMine, maxRelErr, meta } from './recompute.mjs'
//   node recompute.mjs --bench <commits>   (the duration of one full recompute of a
//                                           synthetic store of that size, chunked by
//                                           miner.chunk_ms with miner.chunk_gap_ms gaps)
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

export const DAY = 86400, Y = 5, HORIZON_COMMITS = 10000;
export const B = 1023 - Math.ceil(Math.log2(HORIZON_COMMITS)) - 1; // AD-13's bound, 1,008
let seed = 7;
const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/** The synthetic history: `n` commits of `k` files each over `files` files, author
 * times in (newest - Y years, newest), plus any `extra` [{hash, ts, files}]. */
export function history({ n = 400, files = 40, k = 4, newest, extra = [] }) {
  seed = 7;
  const out = [];
  for (let c = 0; c < n; c++) {
    const ts = Math.floor(newest - 1 - rnd() * (Y * 365.25 * DAY - 31 * DAY));
    const fs = new Set(); const kk = typeof k === 'function' ? k(rnd) : k;
    while (fs.size < kk) fs.add(1 + Math.floor(rnd() * files));
    out.push({ hash: `c${c}`, ts, files: [...fs].sort((x, y) => x - y) });
  }
  return [...out, ...extra];
}
export function build(files = 40) {
  const d = new DatabaseSync(':memory:');
  d.exec(`CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL, weight REAL);
    CREATE TABLE commit_touches(commit_hash TEXT, file_id INTEGER, PRIMARY KEY(commit_hash, file_id)) WITHOUT ROWID;
    CREATE INDEX touches_file ON commit_touches(file_id, commit_hash);
    CREATE TABLE files(id INTEGER PRIMARY KEY, change_weight REAL NOT NULL DEFAULT 0);
    CREATE TABLE pairs(a INTEGER, b INTEGER, pair_weight REAL NOT NULL DEFAULT 0, PRIMARY KEY(a, b));
    CREATE TABLE meta(key TEXT PRIMARY KEY, value);`);
  const ins = d.prepare('INSERT INTO files(id) VALUES(?)');
  for (let f = 1; f <= files; f++) ins.run(f);
  return d;
}
export const meta = (d, k) => d.prepare('SELECT value FROM meta WHERE key = ?').get(k)?.value;
const setMeta = (d, k, v) => d.prepare('INSERT OR REPLACE INTO meta VALUES(?, ?)').run(k, v);
const term = (ts, cap, E, h) => 2 ** ((Math.min(ts, cap) - E) / (DAY * h));
/** AD-13's epoch bound for a pass at refTs against epoch E. */
export const pastBound = (refTs, E, h) => (refTs - E) / (DAY * h) > B || (refTs - Y * 365.25 * DAY - E) / (DAY * h) < -1022;

/**
 * One mining pass at (refTs, h) that mines `commits` (those not yet stored).
 * Returns the number of transactions it committed. Throws 'killed' after `stopAfter`.
 */
export function pass(d, { refTs, h, commits = [], stopAfter = Infinity, chunk = 50 }) {
  let txns = 0;
  const step = (fn) => { if (txns >= stopAfter) throw new Error('killed'); d.exec('BEGIN'); fn(); d.exec('COMMIT'); txns++; };
  const stored = d.prepare('SELECT count(*) AS n FROM commits').get().n;
  const storedE = meta(d, 'weight_epoch'), minedH = meta(d, 'mined_half_life_days');
  const pending = meta(d, 'recompute_pending') !== undefined;
  // The mined-with compare (case 1): a changed h, a missing value while the store holds
  // weighted commits, an epoch past its bound, or a recompute started and not finished.
  const recompute = stored > 0 && (pending || minedH === undefined || Number(minedH) !== h || pastBound(refTs, Number(storedE), h));
  // R8-7: the pass's one epoch. A recompute or a first mine: this pass's refTs.
  const E = pending ? Number(meta(d, 'recompute_epoch')) : recompute || storedE === undefined ? refTs : Number(storedE);
  if (recompute) {
    // The first transaction sets the marker, so an interruption is found by the next
    // pass whatever its own compare says (F5-6); there is no watermark (R8-2).
    if (!pending) step(() => { setMeta(d, 'recompute_pending', 1); setMeta(d, 'recompute_epoch', E); setMeta(d, 'mining_in_progress', 1); });
    const rows = [
      ...d.prepare('SELECT rowid AS r, ts FROM commits ORDER BY rowid').all().map((x) => ['c', x]),
      ...d.prepare('SELECT id AS r FROM files ORDER BY id').all().map((x) => ['f', x]),
      ...d.prepare('SELECT rowid AS r, a, b FROM pairs ORDER BY rowid').all().map((x) => ['p', x]),
    ];
    const upC = d.prepare('UPDATE commits SET weight = ? WHERE rowid = ?');
    const upF = d.prepare('UPDATE files SET change_weight = (SELECT total(c.weight) FROM commit_touches t JOIN commits c ON c.hash = t.commit_hash WHERE t.file_id = ?) WHERE id = ?');
    const upP = d.prepare(`UPDATE pairs SET pair_weight = (SELECT total(c.weight) FROM commit_touches t1 JOIN commit_touches t2 ON t2.commit_hash = t1.commit_hash AND t2.file_id = ?
      JOIN commits c ON c.hash = t1.commit_hash WHERE t1.file_id = ?) WHERE rowid = ?`);
    const done = pending && meta(d, 'recompute_done') !== undefined ? Number(meta(d, 'recompute_done')) : 0;
    for (let i = done; i < rows.length; i += chunk) step(() => { setMeta(d, 'recompute_done', Math.min(i + chunk, rows.length));
      for (const [t, x] of rows.slice(i, i + chunk)) {
        if (t === 'c') upC.run(term(x.ts, refTs, E, h), x.r); // capped at the recompute's epoch, its refTs (R8-7)
        else if (t === 'f') upF.run(x.r, x.r);
        else upP.run(x.b, x.a, x.r);
      }
    });
  }
  // The mine: every commit not yet stored, weighted at the pass's E and h, ts capped at refTs.
  const have = new Set(d.prepare('SELECT hash FROM commits').all().map((x) => x.hash));
  const add = commits.filter((c) => !have.has(c.hash));
  if (add.length > 0 && !recompute && stored > 0) step(() => setMeta(d, 'mining_in_progress', 1));
  const insC = d.prepare('INSERT INTO commits(hash, ts, weight) VALUES(?, ?, ?)');
  const insT = d.prepare('INSERT INTO commit_touches VALUES(?, ?)');
  const addF = d.prepare('UPDATE files SET change_weight = change_weight + ? WHERE id = ?');
  const addP = d.prepare('INSERT INTO pairs(a, b, pair_weight) VALUES(?, ?, ?) ON CONFLICT(a, b) DO UPDATE SET pair_weight = pair_weight + excluded.pair_weight');
  for (let i = 0; i < add.length; i += chunk) step(() => {
    for (const c of add.slice(i, i + chunk)) {
      const w = term(c.ts, refTs, E, h);
      insC.run(c.hash, c.ts, w);
      for (const f of c.files) { insT.run(c.hash, f); addF.run(w, f); }
      for (let x = 0; x < c.files.length; x++) for (let y = x + 1; y < c.files.length; y++) addP.run(c.files[x], c.files[y], w);
    }
  });
  step(() => { // the pass's final transaction: the mined-with values, the markers deleted
    setMeta(d, 'weight_epoch', E); setMeta(d, 'mined_half_life_days', h);
    d.prepare("DELETE FROM meta WHERE key IN ('recompute_pending', 'mining_in_progress', 'recompute_epoch', 'recompute_done')").run();
  });
  return txns;
}
/** A fresh mine of `commits` at (refTs, h): the reference every ratio is compared with. */
export function freshMine(commits, refTs, h, files = 40) { const d = build(files); pass(d, { refTs, h, commits }); return d; }
const ratios = (d) => d.prepare('SELECT p.a, p.b, p.pair_weight / f.change_weight AS r FROM pairs p JOIN files f ON f.id = p.a ORDER BY p.a, p.b').all();
/** The largest relative error of a pair's confidence ratio pair_weight / change_weight(a). */
export function maxRelErr(d, fresh) {
  const x = ratios(d), y = ratios(fresh);
  if (x.length !== y.length) return Infinity;
  let m = 0;
  for (let i = 0; i < x.length; i++) { if (x[i].a !== y[i].a || x[i].b !== y[i].b) return Infinity; m = Math.max(m, Math.abs(x[i].r - y[i].r) / y[i].r); }
  return m;
}

// --bench <n>: one full recompute of a synthetic store of n commits (up to 30 files
// each, 2,000 files), chunked by elapsed time at miner.chunk_ms = 50 ms with a
// miner.chunk_gap_ms = 30 ms gap (AD-26's seeds), on a file-backed WAL store. A
// model's duration, not the miner's: it bounds nothing, it sizes the window in
// which an interruption makes the recompute start again.
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === '--bench') {
  const { mkdtempSync, rmSync } = await import('node:fs');
  const os = await import('node:os'); const path = await import('node:path');
  const n = Number(process.argv[3] ?? HORIZON_COMMITS), FILES = 2000, T0 = 1790000000;
  const dir = mkdtempSync(path.join(os.tmpdir(), 'rc-bench-'));
  const d = new DatabaseSync(path.join(dir, 'p.db'));
  d.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL');
  d.exec(`CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL, weight REAL);
    CREATE TABLE commit_touches(commit_hash TEXT, file_id INTEGER, PRIMARY KEY(commit_hash, file_id)) WITHOUT ROWID;
    CREATE INDEX touches_file ON commit_touches(file_id, commit_hash);
    CREATE TABLE files(id INTEGER PRIMARY KEY, change_weight REAL NOT NULL DEFAULT 0);
    CREATE TABLE pairs(a INTEGER, b INTEGER, pair_weight REAL NOT NULL DEFAULT 0, PRIMARY KEY(a, b));`);
  const hist = history({ n, files: FILES, k: (r) => 1 + Math.floor(r() ** 3 * 30), newest: T0 });
  d.exec('BEGIN');
  for (let f = 1; f <= FILES; f++) d.prepare('INSERT INTO files(id) VALUES(?)').run(f);
  for (const c of hist) {
    d.prepare('INSERT INTO commits VALUES(?, ?, 0)').run(c.hash, c.ts);
    for (const f of c.files) d.prepare('INSERT INTO commit_touches VALUES(?, ?)').run(c.hash, f);
    for (let x = 0; x < c.files.length; x++) for (let y = x + 1; y < c.files.length; y++) d.prepare('INSERT OR IGNORE INTO pairs(a, b) VALUES(?, ?)').run(c.files[x], c.files[y]);
  }
  d.exec('COMMIT');
  const counts = ['commits', 'commit_touches', 'files', 'pairs'].map((t) => `${t} ${d.prepare(`SELECT count(*) n FROM ${t}`).get().n}`).join(', ');
  const rows = [...d.prepare('SELECT rowid AS r, ts FROM commits').all().map((x) => ['c', x]), ...d.prepare('SELECT id AS r FROM files').all().map((x) => ['f', x]), ...d.prepare('SELECT rowid AS r, a, b FROM pairs').all().map((x) => ['p', x])];
  const upC = d.prepare('UPDATE commits SET weight = ? WHERE rowid = ?');
  const upF = d.prepare('UPDATE files SET change_weight = (SELECT total(c.weight) FROM commit_touches t JOIN commits c ON c.hash = t.commit_hash WHERE t.file_id = ?) WHERE id = ?');
  const upP = d.prepare(`UPDATE pairs SET pair_weight = (SELECT total(c.weight) FROM commit_touches t1 JOIN commit_touches t2 ON t2.commit_hash = t1.commit_hash AND t2.file_id = ?
      JOIN commits c ON c.hash = t1.commit_hash WHERE t1.file_id = ?) WHERE rowid = ?`);
  const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  const t0 = performance.now(); let txns = 0, i = 0, hold = 0;
  while (i < rows.length) {
    const s = performance.now(); d.exec('BEGIN IMMEDIATE');
    while (i < rows.length && performance.now() - s < 50) {
      const [t, x] = rows[i++];
      if (t === 'c') upC.run(term(x.ts, T0, T0, 365), x.r); else if (t === 'f') upF.run(x.r, x.r); else upP.run(x.b, x.a, x.r);
    }
    d.exec('COMMIT'); hold = Math.max(hold, performance.now() - s); txns++;
    if (i < rows.length) sleep(30);
  }
  const ms = performance.now() - t0;
  console.log(`bench: ${counts}; one full recompute ${(ms / 1000).toFixed(1)} s in ${txns} transactions (longest hold ${hold.toFixed(1)} ms; ${((txns - 1) * 30 / 1000).toFixed(1)} s of it in 30 ms gaps)`);
  d.close(); rmSync(dir, { recursive: true, force: true });
}
