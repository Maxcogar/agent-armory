// k10-recompute-mine.mjs <recompute.mjs> — C-3's bound for a pass that resumes a recompute and
// then mines new commits (a tune of h, then new commits: AD-13's "a recompute ... and a mine
// in one pass"), against the round-9 model unchanged. (a) killed after each K of its C
// transactions, then one pass: does that pass do only the C - K transactions left (AD-24)?
// (b) every pass killed after J: complete within C passes (AD-13's C-3 claim)? (c) what the
// wasted passes did: rows of recompute_pending.done's table added after the recompute started.
import path from 'node:path';
const { DAY, build, history, pass, freshMine, maxRelErr, meta } = await import(path.resolve(process.argv[2]));
const T0 = 1790000000, TOL = 1.6e-13 * 2 * 3;
const killed = (d, o) => { try { pass(d, o); return false; } catch (e) { if (e.message !== 'killed') throw e; return true; } };
const H = history({ n: 400, newest: T0 });
// the new commits touch 20 files the stored history never touched (41-60), so the mine inserts new pairs
const NEW = history({ n: 100, files: 20, newest: T0 + 20 * DAY }).map((c, i) => ({ ...c, hash: `n${i}`, files: c.files.map((f) => f + 40) }));
const ALL = [...H, ...NEW], REF = T0 + 30 * DAY;
const base = () => { const d = build(60); pass(d, { refTs: T0, h: 365, commits: H }); return d; };
const C = pass(base(), { refTs: REF, h: 20, commits: ALL });
const fresh = freshMine(ALL, REF, 20, 60);
const over = [];
for (let K = 1; K < C; K++) {
  const d = base(); killed(d, { refTs: REF, h: 20, commits: ALL, stopAfter: K });
  const t = pass(d, { refTs: REF, h: 20, commits: ALL });
  if (t !== C - K) over.push(`${K}:${t}`);
}
console.log(`(a) recompute + mine of 100 new commits: C = ${C}; killed after K, the next pass's transactions differ from C - K for ${over.length} of ${C - 1} values of K (K:transactions) ${over.join(' ')}`);
for (const J of [1, 2, 3]) {
  const d = base(); const seen = [];
  let p = 1;
  for (; p <= 3 * C; p++) {
    const before = { c: d.prepare('SELECT count(*) n FROM commits').get().n, pend: meta(d, 'recompute_pending') };
    if (!killed(d, { refTs: REF, h: 20, commits: ALL, stopAfter: J })) break;
    const after = d.prepare('SELECT count(*) n FROM commits').get().n;
    const pd = JSON.parse(meta(d, 'recompute_pending'));
    seen.push(after > before.c ? `m${after - before.c}` : `r${pd.done.t[0]}${pd.done.r}`);
  }
  const err = maxRelErr(d, fresh);
  console.log(`(b) every pass killed after ${J}: complete after ${p} passes (C = ${C}) ${p <= C ? 'within' : 'NOT within'} C; error ${err.toExponential(3)} ${err <= TOL ? '(exact)' : '(WRONG)'}; per killed pass (m<n> = n commits mined, r<t><rowid> = recompute only, done advanced to): ${seen.join(' ')}`);
}
{
  const maxPairs = base().prepare('SELECT max(rowid) m FROM pairs').get().m;
  const e = base(); killed(e, { refTs: REF, h: 20, commits: ALL, stopAfter: C - 1 });
  const pd = JSON.parse(meta(e, 'recompute_pending'));
  const added = e.prepare('SELECT count(*) n FROM pairs WHERE rowid > ?').get(pd.done.r).n;
  const t = pass(e, { refTs: REF, h: 20, commits: ALL });
  console.log(`(c) pairs before the pass: max rowid ${maxPairs}; killed after ${C - 1} (only the final transaction left): recompute_pending.done ${JSON.stringify(pd.done)}, pairs with a rowid after it ${added} (rows the pass's own mine inserted, which the resume recomputes again); the next pass does ${t} transactions, not 1`);
}
