// recompute.mjs — a model of AD-13's mining pass: the mined-with compare, case 1's full
// recompute, case 2's reconcile with D = S, the mine and the final transaction. Round-9
// revision of the round-8 evidence's recompute.mjs (kept unedited). It is a model over a
// small synthetic store (the tables and sums AD-13 names, one classifying key standing
// for miner.max_transaction_entities and lexicon.fix_keywords, no git read, no horizon
// eviction), not the miner. The rule, by finding:
//
//   R8-7  (kept) a pass has one epoch E for all of its work.
//   R9-1  a full recompute resumes under its OWN inputs. Its first transaction stores
//         them in recompute_pending = {h, epoch, done}: the half-life, the epoch, which
//         is also the cap (a recompute's E is its own refTs, R8-7), and the last row it
//         finished ({t, r}: table and rowid, in the order commits, files, pairs), which
//         every recompute transaction advances. A pass that finds it with the current h,
//         and the current refTs inside the stored epoch's bound, resumes after `done`
//         with the stored h and epoch, and its evict and mine then use that epoch, as an
//         incremental pass uses the stored one. A pass that finds it with another h, or
//         past the stored epoch's bound, starts a new recompute from the first row at
//         its own inputs and records recompute_superseded: rows never mix two inputs.
//         The final transaction writes the recompute's epoch and h as weight_epoch and
//         mined_half_life_days and deletes the key.
//   R9-1  a first mine (S empty) writes its mined-with values in its FIRST transaction:
//         no earlier row exists to mix with, so a killed first mine resumes as an
//         ordinary pass instead of turning into a full recompute.
//   R9-2  case 2 (a changed classifying digest) evicts every stored commit (D = S) and
//         writes the digest in the transaction that ends that eviction: from then on every
//         stored commit was classified at the current value, so a crash during the mine
//         resumes as an ordinary reconcile, and a crash during the eviction finds the
//         digest still stale and evicts the rest (the round-9 review's K2).
//   R9-6  every transaction of a pass carries work: the pass's bookkeeping (markers,
//         stored inputs, records) is written in its first work transaction. A pass that
//         finds mining_in_progress set records mining_resumed {interrupted}, the number
//         of passes that started this work and did not finish (the key's value).
//
// A pass: compare, then recompute if needed, then evict D, then mine the new commits,
// then the final transaction. `stopAfter` kills the pass after that many committed
// transactions (the model of SIGKILL).
//
//   import { build, pass, freshMine, maxRelErr, meta, faults } from './recompute.mjs'
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
  d.exec(`CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL, weight REAL, lex TEXT);
    CREATE TABLE commit_touches(commit_hash TEXT, file_id INTEGER, PRIMARY KEY(commit_hash, file_id)) WITHOUT ROWID;
    CREATE INDEX touches_file ON commit_touches(file_id, commit_hash);
    CREATE TABLE files(id INTEGER PRIMARY KEY, change_weight REAL NOT NULL DEFAULT 0);
    CREATE TABLE pairs(a INTEGER, b INTEGER, pair_weight REAL NOT NULL DEFAULT 0, PRIMARY KEY(a, b));
    CREATE TABLE meta(key TEXT PRIMARY KEY, value);
    CREATE TABLE faults(seq INTEGER PRIMARY KEY, code TEXT NOT NULL, detail TEXT NOT NULL);`);
  const ins = d.prepare('INSERT INTO files(id) VALUES(?)');
  for (let f = 1; f <= files; f++) ins.run(f);
  return d;
}
export const meta = (d, k) => d.prepare('SELECT value FROM meta WHERE key = ?').get(k)?.value;
const setMeta = (d, k, v) => d.prepare('INSERT OR REPLACE INTO meta VALUES(?, ?)').run(k, v);
const term = (ts, cap, E, h) => 2 ** ((Math.min(ts, cap) - E) / (DAY * h));
/** AD-13's epoch bound for a pass at refTs against epoch E. */
export const pastBound = (refTs, E, h) => (refTs - E) / (DAY * h) > B || (refTs - Y * 365.25 * DAY - E) / (DAY * h) < -1022;

/** The records a pass wrote (the model's faults table), oldest first. */
export const faults = (d) => d.prepare('SELECT code, detail FROM faults ORDER BY seq').all().map((r) => ({ code: r.code, ...JSON.parse(r.detail) }));
const record = (d, code, detail) => d.prepare('INSERT INTO faults(code, detail) VALUES(?, ?)').run(code, JSON.stringify(detail));
const ORDER = ['commits', 'files', 'pairs'];

/**
 * One mining pass at (refTs, h, lex) that mines `commits` (those not yet stored). `lex`
 * is the current digest of the classifying keys. Returns the number of transactions it
 * committed. Throws 'killed' after `stopAfter`.
 */
export function pass(d, { refTs, h, lex = 'L0', commits = [], stopAfter = Infinity, chunk = 50 }) {
  let txns = 0;
  const head = []; // the pass's bookkeeping, written in its first transaction beside its first work (R9-6)
  const step = (fn) => {
    if (txns >= stopAfter) throw new Error('killed');
    d.exec('BEGIN'); if (txns === 0) for (const w of head) w(); fn(); d.exec('COMMIT'); txns++;
  };
  const stored = d.prepare('SELECT count(*) AS n FROM commits').get().n;
  const storedE = meta(d, 'weight_epoch'), minedH = meta(d, 'mined_half_life_days'), minedLex = meta(d, 'mined_fix_lexicon_digest');
  const pendingRaw = meta(d, 'recompute_pending'), mip = meta(d, 'mining_in_progress');
  const pending = pendingRaw === undefined ? null : JSON.parse(pendingRaw);
  // Case 1. A recompute started and not finished resumes under its own inputs while the
  // current h equals its h and the current refTs is inside its epoch's bound; otherwise a
  // new recompute starts from the first row at this pass's inputs (R9-1).
  let rc = null, superseded = null;
  if (pending !== null) {
    if (pending.h === h) rc = pending; // MUTANT: the resume ignores the stored epoch's bound
    else { rc = { h, epoch: refTs, done: null }; superseded = pending; }
  } else if (stored > 0 && (Number(minedH) !== h || pastBound(refTs, Number(storedE), h))) rc = { h, epoch: refTs, done: null };
  // Case 2 (R9-2): a changed classifying digest evicts every stored commit (D = S).
  const evictAll = stored > 0 && minedLex !== lex;
  // The pass's one epoch (R8-7): the recompute's, a first mine's own refTs, else the stored one.
  const E = rc !== null ? rc.epoch : stored === 0 ? refTs : Number(storedE);
  const firstMine = stored === 0 && rc === null;
  if (mip !== undefined) head.push(() => { setMeta(d, 'mining_in_progress', Number(mip) + 1); record(d, 'mining_resumed', { interrupted: Number(mip) }); });
  else head.push(() => setMeta(d, 'mining_in_progress', 1));
  if (rc !== null && rc !== pending) head.push(() => {
    setMeta(d, 'recompute_pending', JSON.stringify(rc));
    if (superseded !== null) record(d, 'recompute_superseded', { from: { h: superseded.h, epoch: superseded.epoch }, to: { h: rc.h, epoch: rc.epoch } });
  });
  // A first mine has no earlier row to mix with: its mined-with values go in its first transaction (R9-1).
  if (firstMine) head.push(() => { setMeta(d, 'weight_epoch', E); setMeta(d, 'mined_half_life_days', h); setMeta(d, 'mined_fix_lexicon_digest', lex); });
  if (rc !== null) {
    const after = rc.done, ai = after === null ? -1 : ORDER.indexOf(after.t);
    const from = (t) => (ORDER.indexOf(t) < ai ? null : ORDER.indexOf(t) === ai ? after.r : -Infinity);
    const sel = { commits: 'SELECT rowid AS r, ts FROM commits WHERE rowid > ? ORDER BY rowid', files: 'SELECT id AS r FROM files WHERE id > ? ORDER BY id', pairs: 'SELECT rowid AS r, a, b FROM pairs WHERE rowid > ? ORDER BY rowid' };
    const rows = ORDER.flatMap((t) => (from(t) === null ? [] : d.prepare(sel[t]).all(from(t) === -Infinity ? -1 : from(t)).map((x) => [t, x])));
    const upC = d.prepare('UPDATE commits SET weight = ? WHERE rowid = ?');
    const upF = d.prepare('UPDATE files SET change_weight = (SELECT total(c.weight) FROM commit_touches t JOIN commits c ON c.hash = t.commit_hash WHERE t.file_id = ?) WHERE id = ?');
    const upP = d.prepare(`UPDATE pairs SET pair_weight = (SELECT total(c.weight) FROM commit_touches t1 JOIN commit_touches t2 ON t2.commit_hash = t1.commit_hash AND t2.file_id = ?
      JOIN commits c ON c.hash = t1.commit_hash WHERE t1.file_id = ?) WHERE rowid = ?`);
    for (let i = 0; i < rows.length; i += chunk) step(() => {
      const part = rows.slice(i, i + chunk);
      for (const [t, x] of part) {
        if (t === 'commits') upC.run(term(x.ts, rc.epoch, rc.epoch, rc.h), x.r); // the recompute's own epoch and cap
        else if (t === 'files') upF.run(x.r, x.r);
        else upP.run(x.b, x.a, x.r);
      }
      const [t, x] = part.at(-1);
      rc.done = { t, r: x.r };
      setMeta(d, 'recompute_pending', JSON.stringify(rc)); // the watermark advances with the rows it names
    });
  }
  // Evict D (case 2 only in this model): per commit, delete it and its touches, then
  // recompute every affected file's and pair's sum from the remaining touches, deleting
  // a pair no remaining commit touches. The transaction that ends D = S writes the digest.
  if (evictAll) {
    const D = d.prepare('SELECT hash FROM commits ORDER BY rowid').all().map((x) => x.hash);
    const tf = d.prepare('SELECT file_id AS f FROM commit_touches WHERE commit_hash = ?');
    const reF = d.prepare('UPDATE files SET change_weight = (SELECT total(c.weight) FROM commit_touches t JOIN commits c ON c.hash = t.commit_hash WHERE t.file_id = ?) WHERE id = ?');
    const reP = d.prepare(`UPDATE pairs SET pair_weight = (SELECT total(c.weight) FROM commit_touches t1 JOIN commit_touches t2 ON t2.commit_hash = t1.commit_hash AND t2.file_id = ?
      JOIN commits c ON c.hash = t1.commit_hash WHERE t1.file_id = ?) WHERE a = ? AND b = ?`);
    const deadP = d.prepare(`DELETE FROM pairs WHERE a = ? AND b = ? AND NOT EXISTS (SELECT 1 FROM commit_touches t1 JOIN commit_touches t2 ON t2.commit_hash = t1.commit_hash AND t2.file_id = ? WHERE t1.file_id = ?)`);
    for (let i = 0; i < D.length; i += chunk) step(() => {
      for (const c of D.slice(i, i + chunk)) {
        const fs = tf.all(c).map((x) => x.f);
        d.prepare('DELETE FROM commit_touches WHERE commit_hash = ?').run(c);
        d.prepare('DELETE FROM commits WHERE hash = ?').run(c);
        for (const f of fs) reF.run(f, f);
        for (let x = 0; x < fs.length; x++) for (let y = x + 1; y < fs.length; y++) { reP.run(fs[y], fs[x], fs[x], fs[y]); deadP.run(fs[x], fs[y], fs[y], fs[x]); }
      }
      if (i + chunk >= D.length) setMeta(d, 'mined_fix_lexicon_digest', lex); // every stored commit is now classified at lex (R9-2)
    });
  }
  // The mine: every commit not yet stored, weighted at the pass's E and h, ts capped at refTs.
  const have = new Set(d.prepare('SELECT hash FROM commits').all().map((x) => x.hash));
  const add = commits.filter((c) => !have.has(c.hash));
  const insC = d.prepare('INSERT INTO commits(hash, ts, weight, lex) VALUES(?, ?, ?, ?)');
  const insT = d.prepare('INSERT INTO commit_touches VALUES(?, ?)');
  const addF = d.prepare('UPDATE files SET change_weight = change_weight + ? WHERE id = ?');
  const addP = d.prepare('INSERT INTO pairs(a, b, pair_weight) VALUES(?, ?, ?) ON CONFLICT(a, b) DO UPDATE SET pair_weight = pair_weight + excluded.pair_weight');
  for (let i = 0; i < add.length; i += chunk) step(() => {
    for (const c of add.slice(i, i + chunk)) {
      const w = term(c.ts, refTs, E, h);
      insC.run(c.hash, c.ts, w, lex);
      for (const f of c.files) { insT.run(c.hash, f); addF.run(w, f); }
      for (let x = 0; x < c.files.length; x++) for (let y = x + 1; y < c.files.length; y++) addP.run(c.files[x], c.files[y], w);
    }
  });
  step(() => { // the pass's final transaction: the mined-with values, the markers deleted
    setMeta(d, 'weight_epoch', E); setMeta(d, 'mined_half_life_days', h); setMeta(d, 'mined_fix_lexicon_digest', lex);
    d.prepare("DELETE FROM meta WHERE key IN ('recompute_pending', 'mining_in_progress')").run();
  });
  return txns;
}
/** A fresh mine of `commits` at (refTs, h): the reference every ratio is compared with. */
export function freshMine(commits, refTs, h, files = 40, lex = 'L0') { const d = build(files); pass(d, { refTs, h, lex, commits }); return d; }
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
