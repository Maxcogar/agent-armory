// Round-3 revision benchmark (2026-09-28): the per-row cost of the key-range
// statements AD-13's rescale, 003's reset and a chunked forward migration run,
// and the longest write-lock hold per transaction under AD-26's before-write
// rule. Throwaway; kept here so the architecture's figures can be re-run.
//
//   node rescale_bench.mjs build <db>                       build the synthetic store
//   node rescale_bench.mjs whole <db>                       one UPDATE per table (the round-3 shape)
//   node rescale_bench.mjs range <db> <rows> [chunkMs] [gapMs]   key-range rescale
//   node rescale_bench.mjs delete <db> <rows> [chunkMs] [gapMs]  key-range delete (003 reset)
//   node rescale_bench.mjs move <db> <rows> [chunkMs] [gapMs]    key-range copy+delete (forward migration)
//
// Store at the horizon's seeds: 3,000 files, 10,000 commits, 300,000
// commit_touches, 289,606 pair rows; WAL, synchronous = NORMAL (AD-26's pass
// connection). The hold is measured as the adapter sees it: BEGIN IMMEDIATE
// returned to COMMIT returned.
import { DatabaseSync } from 'node:sqlite';
import { rmSync, existsSync } from 'node:fs';

const [, , mode, db, rowsArg, chunkArg, gapArg] = process.argv;
const ROWS = Number(rowsArg ?? 0);
const CHUNK_MS = Number(chunkArg ?? 50);
const GAP_MS = Number(gapArg ?? 30);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function open(path) {
  const d = new DatabaseSync(path);
  d.exec('PRAGMA journal_mode = WAL');
  d.exec('PRAGMA synchronous = NORMAL');
  d.exec('PRAGMA busy_timeout = 100');
  // NOCKPT=1: no automatic checkpoint on this connection, so COMMIT's time is the
  // lock hold alone (SQLite runs the automatic checkpoint inside COMMIT's call).
  if (process.env.NOCKPT === '1') d.exec('PRAGMA wal_autocheckpoint = 0');
  return d;
}

// Deterministic PRNG so every build is the same store.
// mulberry32 (a plain LCG's consecutive draws are correlated, so its (a, b)
// pairs cover too few distinct pairs to fill the table).
let seed = 12345;
const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hex = (n) => { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(rnd() * 16).toString(16); return s; };

if (mode === 'build') {
  for (const f of [db, db + '-wal', db + '-shm']) if (existsSync(f)) rmSync(f);
  const d = open(db);
  d.exec(`CREATE TABLE files(id INTEGER PRIMARY KEY, path TEXT NOT NULL UNIQUE, change_count INTEGER NOT NULL, change_weight REAL NOT NULL, wepoch INTEGER) STRICT;
          CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL, entity_count INTEGER NOT NULL, excluded INTEGER NOT NULL, weight REAL, wepoch INTEGER) STRICT;
          CREATE TABLE commit_touches(commit_hash TEXT NOT NULL, file_id INTEGER NOT NULL, PRIMARY KEY(commit_hash, file_id)) STRICT, WITHOUT ROWID;
          CREATE INDEX ct_file ON commit_touches(file_id, commit_hash);
          CREATE TABLE cochange_pairs(a INTEGER NOT NULL, b INTEGER NOT NULL, pair_count INTEGER NOT NULL, pair_weight REAL NOT NULL, wepoch INTEGER, last_ts INTEGER NOT NULL, last_commit TEXT NOT NULL, PRIMARY KEY(a,b), CHECK(a<b)) STRICT;
          CREATE INDEX cochange_pairs_b ON cochange_pairs(b);  -- as 001_phase_a_project.sql L244
          CREATE TABLE cochange_pairs_new(a INTEGER NOT NULL, b INTEGER NOT NULL, pair_count INTEGER NOT NULL, pair_weight REAL NOT NULL, wepoch INTEGER, last_ts INTEGER NOT NULL, last_commit TEXT NOT NULL, PRIMARY KEY(a,b), CHECK(a<b)) STRICT;
          CREATE INDEX cochange_pairs_new_b ON cochange_pairs_new(b);`);
  d.exec('BEGIN');
  const fi = d.prepare('INSERT INTO files VALUES (?,?,?,?,?)');
  for (let i = 1; i <= 3000; i++) fi.run(i, `src/dir${i % 97}/file${i}.ts`, 10, 1.5 + rnd(), 20);
  const ci = d.prepare('INSERT INTO commits VALUES (?,?,?,?,?,?)');
  const ti = d.prepare('INSERT OR IGNORE INTO commit_touches VALUES (?,?)');
  const hashes = [];
  let touches = 0;
  for (let c = 0; c < 10000; c++) {
    const h = c.toString(16).padStart(8, '0') + hex(32); hashes.push(h);
    ci.run(h, 1600000000 + c * 1000, 30, 0, 0.5 + rnd(), 20);
    for (let k = 0; k < 30; k++) { ti.run(h, 1 + Math.floor(rnd() * 3000)); touches++; }
  }
  const pi = d.prepare('INSERT OR IGNORE INTO cochange_pairs VALUES (?,?,?,?,?,?,?)');
  let pairs = 0;
  while (pairs < 289606) {
    let a = 1 + Math.floor(rnd() * 3000), b = 1 + Math.floor(rnd() * 3000);
    if (a === b) continue; if (a > b) [a, b] = [b, a];
    const r = pi.run(a, b, 1 + Math.floor(rnd() * 5), rnd() * 4, 20, 1600000000, hashes[Math.floor(rnd() * 10000)]);
    pairs += r.changes;
  }
  d.exec('COMMIT');
  const n = (t) => d.prepare(`SELECT count(*) n FROM ${t}`).get().n;
  console.log(`built files=${n('files')} commits=${n('commits')} commit_touches=${n('commit_touches')} pairs=${n('cochange_pairs')}`);
  d.close();
  process.exit(0);
}

const d = open(db);
const holds = [];
function txn(fn) {
  d.exec('BEGIN IMMEDIATE');
  const t0 = performance.now();
  const rows = fn(t0);
  const t1 = performance.now();
  d.exec('COMMIT');
  const hold = performance.now() - t0;
  holds.push({ hold, rows, work: t1 - t0, commit: hold - (t1 - t0) });
  return rows;
}

// wepoch column and weight column per table, for the rescale.
const TABLES = [['commits', 'weight'], ['files', 'change_weight'], ['cochange_pairs', 'pair_weight']];
const E1 = 21; // every row is at wepoch 20: one half-life move, factor 2^(20-21) = 0.5

function report(label) {
  const hs = holds.map((x) => x.hold);
  const rows = holds.reduce((s, x) => s + x.rows, 0);
  const max = Math.max(...hs);
  const perRowUs = holds.filter((x) => x.rows > 0).map((x) => (x.hold * 1000) / x.rows);
  const maxWork = Math.max(...holds.map((x) => x.work));
  const maxCommit = Math.max(...holds.map((x) => x.commit));
  console.log(`${label} rows=${ROWS || 'all'} chunkMs=${CHUNK_MS} txns=${holds.length} rowsWritten=${rows} max_work_ms=${maxWork.toFixed(1)} max_commit_ms=${maxCommit.toFixed(1)} max_hold_ms=${max.toFixed(1)} p50_hold_ms=${hs.sort((a, b) => a - b)[Math.floor(hs.length / 2)].toFixed(1)} max_us_per_row=${Math.max(...perRowUs).toFixed(3)} total_ms=${(performance.now() - START).toFixed(0)}`);
}
const START = performance.now();

if (mode === 'whole') {
  for (const [t, w] of TABLES) txn(() => d.prepare(`UPDATE ${t} SET ${w} = ${w} * ?, wepoch = ? WHERE wepoch = ?`).run(0.5, E1, 20).changes);
  report('whole');
} else if (mode === 'range' || mode === 'delete' || mode === 'move') {
  const targets = mode === 'range' ? TABLES : [['cochange_pairs', 'pair_weight']];
  for (const [t, w] of targets) {
    const hiQ = d.prepare(`SELECT rowid r FROM ${t} WHERE rowid > ? ORDER BY rowid LIMIT 1 OFFSET ?`);
    const maxQ = d.prepare(`SELECT max(rowid) r FROM ${t}`);
    const epochsQ = d.prepare(`SELECT DISTINCT wepoch e FROM ${t} WHERE rowid > ? AND rowid <= ? AND wepoch IS NOT NULL AND wepoch <> ?`);
    const upd = d.prepare(`UPDATE ${t} SET ${w} = ${w} * ?, wepoch = ? WHERE rowid > ? AND rowid <= ? AND wepoch = ?`);
    const del = d.prepare(`DELETE FROM ${t} WHERE rowid > ? AND rowid <= ?`);
    const copy = mode !== 'move' ? null : d.prepare(`INSERT OR IGNORE INTO cochange_pairs_new SELECT a,b,pair_count,pair_weight,wepoch,last_ts,last_commit FROM ${t} WHERE rowid > ? AND rowid <= ?`);
    let last = 0;
    const max = maxQ.get().r ?? 0;
    while (last < max) {
      txn((t0) => {
        let n = 0;
        // AD-26's before-write rule: elapsed time is checked before each write.
        do {
          const hiRow = hiQ.get(last, ROWS - 1);
          const hi = hiRow ? hiRow.r : max;
          if (mode === 'range') {
            for (const { e } of epochsQ.all(last, hi, E1)) n += upd.run(2 ** (e - E1), E1, last, hi, e).changes;
          } else if (mode === 'delete') {
            n += del.run(last, hi).changes;
          } else {
            copy.run(last, hi);
            n += del.run(last, hi).changes;
          }
          last = hi;
        } while (last < max && performance.now() - t0 < CHUNK_MS);
        return n;
      });
      sleep(GAP_MS);
    }
  }
  report(mode);
} else {
  console.error('usage: see header');
  process.exit(2);
}
d.close();
