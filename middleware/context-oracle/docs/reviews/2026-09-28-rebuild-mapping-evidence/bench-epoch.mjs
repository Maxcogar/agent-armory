// bench-epoch.mjs — F5-6: a full recompute at a new epoch (AD-13 case 1, "an
// epoch past its bound"), killed part-way, then a pass at a refTs inside the
// old epoch's bound. Compares every pair's confidence ratio
// pair_weight / change_weight(a) with a fresh recompute's:
//   rule as written  — the next pass finds no stored difference, so no recompute;
//   recompute_epoch  — the first recompute transaction records its target epoch,
//                      a pass that finds it set finishes the recompute at that
//                      epoch before any other work, the final transaction deletes it.
// Also prints the backward margin 1,022·h − 365.25·Y (days): how far below the
// epoch's tip a checkout's tip may lie before the lower bound forces a recompute.
//   node bench-epoch.mjs
import { DatabaseSync } from 'node:sqlite';

const DAY = 86400, H = 1.787, Y = 5, T0 = 1790000000;
let seed = 7;
const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const OLDER = T0 - 30 * DAY; // the older tip a checkout moves to
function build() {
  seed = 7; // every build is the same store
  const d = new DatabaseSync(':memory:');
  d.exec(`CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL, weight REAL);
    CREATE TABLE commit_touches(commit_hash TEXT, file_id INTEGER, PRIMARY KEY(commit_hash, file_id)) WITHOUT ROWID;
    CREATE TABLE files(id INTEGER PRIMARY KEY, change_weight REAL NOT NULL DEFAULT 0);
    CREATE TABLE pairs(a INTEGER, b INTEGER, pair_weight REAL NOT NULL DEFAULT 0, PRIMARY KEY(a, b));
    CREATE TABLE meta(key TEXT PRIMARY KEY, value);`);
  for (let f = 1; f <= 40; f++) d.prepare('INSERT INTO files(id) VALUES(?)').run(f);
  for (let c = 0; c < 400; c++) {
    // every commit is older than the older tip, inside both tips' 5-year horizon
    const ts = Math.floor(OLDER - 1 - rnd() * (Y * 365.25 * DAY - 31 * DAY));
    d.prepare('INSERT INTO commits(hash, ts) VALUES(?, ?)').run(`c${c}`, ts);
    const fs = new Set(); while (fs.size < 4) fs.add(1 + Math.floor(rnd() * 40));
    for (const f of fs) d.prepare('INSERT INTO commit_touches VALUES(?, ?)').run(`c${c}`, f);
    const ids = [...fs].sort((x, y) => x - y);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) d.prepare('INSERT OR IGNORE INTO pairs(a, b) VALUES(?, ?)').run(ids[i], ids[j]);
  }
  return d;
}
const w = (ts, E) => 2 ** ((ts - E) / (DAY * H));
// The recompute: weights, then every file's and every pair's sum, in `chunks`
// transactions over files+pairs; `stopAfter` transactions are committed before a kill.
function recompute(d, E, { stopAfter = Infinity, marker = false } = {}) {
  let txns = 0;
  const step = (fn) => { if (txns >= stopAfter) throw new Error('killed'); d.exec('BEGIN'); fn(); d.exec('COMMIT'); txns++; };
  step(() => {
    if (marker) d.prepare("INSERT OR REPLACE INTO meta VALUES('recompute_epoch', ?)").run(E);
    d.prepare('INSERT OR REPLACE INTO meta VALUES(\'mining_in_progress\', 1)').run();
    for (const c of d.prepare('SELECT hash, ts FROM commits').all()) d.prepare('UPDATE commits SET weight = ? WHERE hash = ?').run(w(c.ts, E), c.hash);
  });
  const rows = [...d.prepare('SELECT id FROM files').all().map((r) => ['f', r.id]), ...d.prepare('SELECT a, b FROM pairs').all().map((r) => ['p', r.a, r.b])];
  for (let i = 0; i < rows.length; i += 60) step(() => {
    for (const r of rows.slice(i, i + 60)) {
      if (r[0] === 'f') d.prepare('UPDATE files SET change_weight = (SELECT total(c.weight) FROM commit_touches t JOIN commits c ON c.hash = t.commit_hash WHERE t.file_id = ?) WHERE id = ?').run(r[1], r[1]);
      else d.prepare(`UPDATE pairs SET pair_weight = (SELECT total(c.weight) FROM commits c WHERE c.hash IN
        (SELECT t1.commit_hash FROM commit_touches t1 JOIN commit_touches t2 ON t1.commit_hash = t2.commit_hash WHERE t1.file_id = ? AND t2.file_id = ?)) WHERE a = ? AND b = ?`).run(r[1], r[2], r[1], r[2]);
    }
  });
  step(() => { // final transaction
    d.prepare("INSERT OR REPLACE INTO meta VALUES('weight_epoch', ?)").run(E);
    d.prepare("DELETE FROM meta WHERE key IN ('recompute_epoch', 'mining_in_progress')").run();
  });
  return txns;
}
const ratios = (d) => d.prepare('SELECT p.a, p.b, p.pair_weight / f.change_weight AS r FROM pairs p JOIN files f ON f.id = p.a ORDER BY p.a, p.b').all();
function maxRelErr(d, fresh) {
  const x = ratios(d), y = ratios(fresh); let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i].r - y[i].r) / y[i].r);
  return m;
}
// bound check of a pass at refTs against stored epoch E (AD-13): newest exponent <= B, oldest >= -1022
const B = 1023 - Math.ceil(Math.log2(10000)) - 1;
const pastBound = (refTs, E) => (refTs - E) / (DAY * H) > B || (refTs - Y * 365.25 * DAY - E) / (DAY * H) < -1022;

const fresh = build(); recompute(fresh, T0);
for (const marker of [false, true]) {
  const d = build();
  recompute(d, T0); // first mine: E = T0
  const E = Number(d.prepare("SELECT value FROM meta WHERE key = 'weight_epoch'").get().value);
  console.log(`${marker ? 'recompute_epoch' : 'rule as written'}: checkout of a tip 30 days older: past bound ${pastBound(OLDER, E)}`);
  const total = recompute(build(), OLDER);
  let killedAt = Math.floor(total / 2);
  try { recompute(d, OLDER, { stopAfter: killedAt, marker }); } catch { /* the kill */ }
  // next pass at refTs = T0, back on the newer tip
  const storedE = Number(d.prepare("SELECT value FROM meta WHERE key = 'weight_epoch'").get().value);
  const pending = d.prepare("SELECT value FROM meta WHERE key = 'recompute_epoch'").get();
  const trigger = pastBound(T0, storedE);
  if (pending) recompute(d, Number(pending.value), { marker });
  else if (trigger) recompute(d, T0, { marker });
  console.log(`  killed after ${killedAt} of ${total} transactions; next pass at the newer tip: past bound ${trigger}, recompute_epoch ${pending ? 'set' : 'absent'}; max relative ratio error vs fresh ${maxRelErr(d, fresh).toExponential(3)}`);
}
for (const h of [1.787, 1.8, 1.816, 2, 20, 365]) console.log(`h=${h} days: backward margin 1022*h - 365.25*${Y} = ${(1022 * h - 365.25 * Y).toFixed(2)} days`);
