// k-termination.mjs — round-9 reviewer's cases K1 and K2 (AD-13's termination under
// repeated interruption, C-3). Run from anywhere:
//   node --no-warnings k-termination.mjs <path to the round-8 evidence's recompute.mjs>
//
// K1 uses the round-8 evidence's own model (recompute.mjs's pass(), unchanged): a FIRST
// mine of 400 commits is killed after 4 of its transactions. The store then holds
// weighted commits and no mined-with values (they are written only in the final
// transaction), so the next pass is case 1's full recompute (the model's own compare,
// `minedH === undefined`), which restarts on each interruption. Every later pass is
// killed after J transactions, as C-3's settlement test kills "every pass after one
// chunk". C-3: resuming "completes within C passes".
//
// K2 is a minimal model of AD-13's case 2 (a changed miner.max_transaction_entities or
// lexicon.fix_keywords makes the pass "a reconcile with D = S", the digest written only
// in the final transaction). Each pass is killed after J transactions.
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
const M = await import(path.resolve(process.argv[2]));
const { build, pass, history, freshMine, maxRelErr, meta, DAY } = M;

// ---- K1 -------------------------------------------------------------------
for (const J of [1, 5]) {
  const T0 = 1790000000, h = 365, hist = history({ n: 400, newest: T0 });
  const d = build();
  let first;
  try { pass(d, { refTs: T0, h, commits: hist, stopAfter: 4 }); } catch (e) { first = e.message; }
  const after1 = { commits: d.prepare('SELECT count(*) n FROM commits').get().n, mined_half_life_days: meta(d, 'mined_half_life_days') ?? 'absent', weight_epoch: meta(d, 'weight_epoch') ?? 'absent' };
  const N = 20, seen = [];
  for (let i = 0; i < N; i++) {
    try { pass(d, { refTs: T0, h, commits: hist, stopAfter: J }); seen.push('completed'); break; } catch (e) { seen.push(d.prepare('SELECT count(*) n FROM commits').get().n); }
  }
  const stuck = { commits: d.prepare('SELECT count(*) n FROM commits').get().n, recompute_pending: meta(d, 'recompute_pending') ?? 'absent', mined_half_life_days: meta(d, 'mined_half_life_days') ?? 'absent' };
  // C = the transactions an uninterrupted first mine needs (the resume bound C-3 states)
  const C = pass(build(), { refTs: T0, h, commits: hist });
  const t = pass(d, { refTs: T0, h, commits: hist });
  const err = maxRelErr(d, freshMine(hist, T0, h));
  console.log(`K1 first mine (h ${h}, refTs unchanged) killed after 4 transactions: ${first}; store ${JSON.stringify(after1)}`);
  console.log(`K1 then ${N} passes, each killed after ${J} transactions: commits after each ${JSON.stringify(seen)}; store ${JSON.stringify(stuck)}; an uninterrupted first mine needs C = ${C} transactions`);
  console.log(`K1 one uninterrupted pass then: ${t} transactions, commits ${d.prepare('SELECT count(*) n FROM commits').get().n}, max relative ratio error vs a fresh mine ${err.toExponential(3)}`);
}

// ---- K2 -------------------------------------------------------------------
{
  const T = Array.from({ length: 400 }, (_, i) => `c${i}`);
  const d = new DatabaseSync(':memory:');
  d.exec('CREATE TABLE commits(hash TEXT PRIMARY KEY, lex TEXT); CREATE TABLE meta(key TEXT PRIMARY KEY, value)');
  const get = (k) => d.prepare('SELECT value FROM meta WHERE key = ?').get(k)?.value;
  const set = (k, v) => d.prepare('INSERT OR REPLACE INTO meta VALUES(?, ?)').run(k, v);
  // a completed mine at digest 'old'
  d.exec('BEGIN'); for (const c of T) d.prepare('INSERT INTO commits VALUES(?, ?)').run(c, 'old'); set('mined_fix_lexicon_digest', 'old'); d.exec('COMMIT');
  const chunk = 50;
  /** AD-13's pass: compare, then evict D (D = S when the digest differs, else S \ T), then mine A = T \ S, then the final transaction. */
  const kpass = (lex, stopAfter) => {
    let n = 0; const step = (fn) => { if (n >= stopAfter) throw new Error('killed'); d.exec('BEGIN'); fn(); d.exec('COMMIT'); n++; };
    const S = d.prepare('SELECT hash FROM commits ORDER BY rowid').all().map((r) => r.hash);
    const D = get('mined_fix_lexicon_digest') !== lex ? S : S.filter((c) => !T.includes(c));
    for (let i = 0; i < D.length; i += chunk) step(() => { for (const c of D.slice(i, i + chunk)) d.prepare('DELETE FROM commits WHERE hash = ?').run(c); });
    const have = new Set(d.prepare('SELECT hash FROM commits').all().map((r) => r.hash));
    const A = T.filter((c) => !have.has(c));
    for (let i = 0; i < A.length; i += chunk) step(() => { for (const c of A.slice(i, i + chunk)) d.prepare('INSERT INTO commits VALUES(?, ?)').run(c, lex); });
    step(() => set('mined_fix_lexicon_digest', lex));
    return n;
  };
  const J = 10, N = 30, seen = [];
  for (let i = 0; i < N; i++) {
    try { kpass('new', J); seen.push('completed'); break; } catch { seen.push(d.prepare("SELECT count(*) n FROM commits WHERE lex = 'new'").get().n); }
  }
  const C = (() => { const n0 = 400 / chunk; return n0 + n0 + 1; })();
  console.log(`K2 lexicon.fix_keywords tuned (digest old -> new), a reconcile with D = S of 400 commits in chunks of ${chunk} (an uninterrupted pass: ${C} transactions); ${N} passes each killed after ${J}: commits at the new values after each ${JSON.stringify(seen)}; digest ${get('mined_fix_lexicon_digest')}`);
  const t = kpass('new', Infinity);
  console.log(`K2 one uninterrupted pass then: ${t} transactions, digest ${get('mined_fix_lexicon_digest')}`);
}
