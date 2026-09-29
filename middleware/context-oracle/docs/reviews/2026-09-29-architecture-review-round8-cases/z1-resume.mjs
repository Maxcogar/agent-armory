// z1-resume.mjs — round-8 review, case Z1 (R7-9's watermark, text only in the design).
// Model: bench-epoch.mjs's store (40 files, 400 commits, 4 files each), extended with
// AD-13 L2999-3008's resume: the recompute visits commits by rowid, then files, then
// pairs, `chunk` rows per transaction, and each transaction writes recompute_done
// (table, rowid). A pass that finds recompute_epoch set resumes after recompute_done.
// The half-life used is the current tuning value (AD-13 names no stored h for the
// recompute; mined_half_life_days is written only in the pass's final transaction).
// Scenario: store mined at h0 = 365; owner tunes h1 = 20 (case 1, full recompute at a
// new epoch); the pass is killed after K transactions; owner tunes back to h0; the
// next pass resumes, then compares mined-with values (h0 == h0: no recompute).
//   node z1-resume.mjs
import { DatabaseSync } from 'node:sqlite';
const DAY = 86400, T0 = 1790000000, Y = 5;
let seed = 7;
const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function build() {
  seed = 7;
  const d = new DatabaseSync(':memory:');
  d.exec(`CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL, weight REAL);
    CREATE TABLE commit_touches(commit_hash TEXT, file_id INTEGER, PRIMARY KEY(commit_hash, file_id)) WITHOUT ROWID;
    CREATE TABLE files(id INTEGER PRIMARY KEY, change_weight REAL NOT NULL DEFAULT 0);
    CREATE TABLE pairs(a INTEGER, b INTEGER, pair_weight REAL NOT NULL DEFAULT 0, PRIMARY KEY(a, b));
    CREATE TABLE meta(key TEXT PRIMARY KEY, value);`);
  for (let f = 1; f <= 40; f++) d.prepare('INSERT INTO files(id) VALUES(?)').run(f);
  for (let c = 0; c < 400; c++) {
    const ts = Math.floor(T0 - 1 - rnd() * (Y * 365.25 * DAY - DAY));
    d.prepare('INSERT INTO commits(hash, ts) VALUES(?, ?)').run(`c${c}`, ts);
    const fs = new Set(); while (fs.size < 4) fs.add(1 + Math.floor(rnd() * 40));
    for (const f of fs) d.prepare('INSERT INTO commit_touches VALUES(?, ?)').run(`c${c}`, f);
    const ids = [...fs].sort((x, y) => x - y);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) d.prepare('INSERT OR IGNORE INTO pairs(a, b) VALUES(?, ?)').run(ids[i], ids[j]);
  }
  return d;
}
const meta = (d, k) => d.prepare('SELECT value FROM meta WHERE key = ?').get(k)?.value;
const setMeta = (d, k, v) => d.prepare('INSERT OR REPLACE INTO meta VALUES(?, ?)').run(k, v);
// The recompute as AD-13 L2999-3008 states it. h: the tuning value the pass reads.
function recompute(d, E, h, { stopAfter = Infinity, resume = true, chunk = 50 } = {}) {
  let txns = 0;
  const step = (fn) => { if (txns >= stopAfter) throw new Error('killed'); d.exec('BEGIN'); fn(); d.exec('COMMIT'); txns++; };
  const order = [
    ['commits', d.prepare('SELECT rowid AS r, ts FROM commits ORDER BY rowid').all()],
    ['files', d.prepare('SELECT rowid AS r FROM files ORDER BY rowid').all()],
    ['pairs', d.prepare('SELECT rowid AS r, a, b FROM pairs ORDER BY rowid').all()],
  ];
  const done = resume && meta(d, 'recompute_done') ? JSON.parse(meta(d, 'recompute_done')) : null;
  let skipping = done !== null;
  const work = [];
  for (const [t, rows] of order) for (const row of rows) {
    if (skipping) { if (t === done.t && row.r === done.r) skipping = false; continue; }
    work.push([t, row]);
  }
  if (!meta(d, 'recompute_epoch')) step(() => { setMeta(d, 'recompute_epoch', E); setMeta(d, 'mining_in_progress', 1); });
  for (let i = 0; i < work.length; i += chunk) step(() => {
    for (const [t, row] of work.slice(i, i + chunk)) {
      if (t === 'commits') d.prepare('UPDATE commits SET weight = ? WHERE rowid = ?').run(2 ** ((row.ts - E) / (DAY * h)), row.r);
      else if (t === 'files') d.prepare('UPDATE files SET change_weight = (SELECT total(c.weight) FROM commit_touches t JOIN commits c ON c.hash = t.commit_hash WHERE t.file_id = ?) WHERE rowid = ?').run(row.r, row.r);
      else d.prepare(`UPDATE pairs SET pair_weight = (SELECT total(c.weight) FROM commits c WHERE c.hash IN
        (SELECT t1.commit_hash FROM commit_touches t1 JOIN commit_touches t2 ON t1.commit_hash = t2.commit_hash WHERE t1.file_id = ? AND t2.file_id = ?)) WHERE rowid = ?`).run(row.a, row.b, row.r);
      if (resume) setMeta(d, 'recompute_done', JSON.stringify({ t, r: row.r }));
    }
  });
  step(() => { // the pass's final transaction: mined-with values, markers deleted
    setMeta(d, 'weight_epoch', E); setMeta(d, 'mined_half_life_days', h);
    d.prepare("DELETE FROM meta WHERE key IN ('recompute_epoch', 'recompute_done', 'mining_in_progress')").run();
  });
}
// A pass (AD-13): finish a pending recompute at recompute_epoch, then compare mined-with h.
function pass(d, refTs, h, opts) {
  const pending = meta(d, 'recompute_epoch');
  if (pending !== undefined) recompute(d, Number(pending), h, opts);
  if (Number(meta(d, 'mined_half_life_days')) !== h) recompute(d, refTs, h, opts);
}
const ratios = (d) => d.prepare('SELECT p.a, p.b, p.pair_weight / f.change_weight AS r FROM pairs p JOIN files f ON f.id = p.a ORDER BY p.a, p.b').all();
const maxRelErr = (d, f) => { const x = ratios(d), y = ratios(f); let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i].r - y[i].r) / y[i].r); return m; };
const h0 = 365, h1 = 20;
const fresh = build(); recompute(fresh, T0, h0);
for (const [label, resume] of [['R7-9 watermark resume', true], ['round-6 restart from the first transaction', false]]) {
  for (const K of [2, 5, 9, 12]) {
    const d = build(); recompute(d, T0, h0, { resume }); // first mine at h0
    try { pass(d, T0 + DAY, h1, { stopAfter: K, resume }); } catch { /* killed */ }
    const doneAt = meta(d, 'recompute_done');
    pass(d, T0 + 2 * DAY, h0, { resume }); // owner tuned back to h0; next pass
    console.log(`Z1 ${label}: killed after ${K} transactions (recompute_done ${doneAt ?? 'absent'}); after the next pass at h0: mined_half_life_days ${meta(d, 'mined_half_life_days')}, recompute_epoch ${meta(d, 'recompute_epoch') ?? 'absent'}; max relative ratio error vs a fresh mine at h0 ${maxRelErr(d, fresh).toExponential(3)}`);
  }
}
// Control: the same kills with no tune back (the next pass at h1): the resume is exact.
const fresh1 = build(); recompute(fresh1, T0 + DAY, h1);
for (const K of [2, 5, 9, 12]) {
  const d = build(); recompute(d, T0, h0);
  try { pass(d, T0 + DAY, h1, { stopAfter: K }); } catch { /* killed */ }
  pass(d, T0 + 2 * DAY, h1, {});
  console.log(`Z1 control, no tune back: killed after ${K} transactions; max relative ratio error vs a fresh mine at h1 ${maxRelErr(d, fresh1).toExponential(3)}`);
}
