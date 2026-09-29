// k10-termination.mjs <recompute.mjs> — C-3's kill-every-pass case for the kinds of pass the
// round-9 tests do not cover, against the round-9 model (unchanged): an incremental mine of
// new commits; a pass that is both case 1 and case 2 (h and the classifying key tuned
// together); a first mine killed, then h tuned; case 2 while the tip advances and new
// commits arrive on every pass; a recompute while the tip advances by a day per pass; and
// 300 random orders of tunes of h AND of the classifying key with kills (exactness of the
// combined machinery). Each: passes killed after J transactions until one completes;
// reports the passes made against C (the uninterrupted pass's transactions) and the
// largest relative ratio error against a fresh mine.
import path from 'node:path';
const M = await import(path.resolve(process.argv[2]));
const { DAY, build, history, pass, freshMine, maxRelErr, meta, faults } = M;
const T0 = 1790000000, TOL = 1.6e-13 * 2 * 3;
const killed = (d, o) => { try { pass(d, o); return false; } catch (e) { if (e.message !== 'killed') throw e; return true; } };
const nC = (d) => d.prepare('SELECT count(*) n FROM commits').get().n;
const settled = (d) => meta(d, 'recompute_pending') === undefined && meta(d, 'mining_in_progress') === undefined;
const untilDone = (d, o, J, max = 200) => { for (let p = 1; p <= max; p++) if (!killed(d, { ...(typeof o === 'function' ? o(p) : o), stopAfter: J })) return p; return Infinity; };
const clone = (d) => { const e = build(); for (const t of ['commits', 'commit_touches', 'pairs', 'meta', 'faults']) { const rows = d.prepare(`SELECT * FROM ${t}`).all(); if (!rows.length) continue; const k = Object.keys(rows[0]); const ins = e.prepare(`INSERT OR REPLACE INTO ${t}(${k.join(',')}) VALUES(${k.map(() => '?').join(',')})`); for (const r of rows) ins.run(...k.map((c) => r[c])); } for (const r of d.prepare('SELECT id, change_weight FROM files').all()) e.prepare('UPDATE files SET change_weight = ? WHERE id = ?').run(r.change_weight, r.id); return e; };
let bad = 0;
const report = (name, p, C, err, extra = '') => { const ok = p <= C && err <= TOL; if (!ok) bad++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}: complete after ${p} passes (C = ${C}); max relative ratio error ${err.toExponential(3)}${extra}`); };

const H = history({ n: 400, newest: T0 });
const H1 = H.slice(0, 200), NEW = history({ n: 200, newest: T0 + 30 * DAY }).map((c, i) => ({ ...c, hash: `n${i}` }));
// T1: an incremental mine of 200 new commits after a first mine of 200
for (const J of [1, 3]) {
  const base = build(); pass(base, { refTs: T0, h: 365, commits: H1 });
  const C = pass(clone(base), { refTs: T0 + 30 * DAY, h: 365, commits: [...H1, ...NEW] });
  const d = clone(base);
  const p = untilDone(d, { refTs: T0 + 30 * DAY, h: 365, commits: [...H1, ...NEW] }, J);
  report(`T1 incremental mine of 200 new commits, every pass killed after ${J}`, p, C, maxRelErr(d, freshMine([...H1, ...NEW], T0 + 30 * DAY, 365)), `; commits ${nC(d)}, settled ${settled(d)}`);
}
// T2: h and the classifying key tuned together (case 1 and case 2 in one pass)
for (const J of [1, 4]) {
  const base = build(); pass(base, { refTs: T0, h: 365, commits: H });
  const C = pass(clone(base), { refTs: T0 + DAY, h: 20, lex: 'L1', commits: H });
  const d = clone(base);
  const p = untilDone(d, { refTs: T0 + DAY, h: 20, lex: 'L1', commits: H }, J);
  const lex = d.prepare("SELECT count(*) n FROM commits WHERE lex = 'L1'").get().n;
  report(`T2 h 365->20 and lex L0->L1 in one pass, every pass killed after ${J}`, p, C, maxRelErr(d, freshMine(H, T0 + DAY, 20, 40, 'L1')), `; commits at L1 ${lex}/400, settled ${settled(d)}, records ${JSON.stringify([...new Set(faults(d).map((f) => f.code))])}`);
}
// T3: a first mine killed after 4, then h tuned, then every pass killed after J
for (const J of [1, 5]) {
  const d = build(); killed(d, { refTs: T0, h: 365, commits: H, stopAfter: 4 });
  const C = pass(clone(d), { refTs: T0, h: 50, commits: H });
  const p = untilDone(d, { refTs: T0, h: 50, commits: H }, J);
  report(`T3 first mine killed after 4, h tuned 365->50, every pass killed after ${J}`, p, C, maxRelErr(d, freshMine(H, T0, 50)), `; commits ${nC(d)}, weight_epoch ${meta(d, 'weight_epoch')}`);
}
// T4: case 2 while the tip advances a day on every pass (T fixed: with new commits on every
// pass, a pass killed after one transaction can never reach its final one, under any rule)
for (const J of [1, 10]) {
  const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
  let last;
  const p = untilDone(d, (q) => (last = { refTs: T0 + q * DAY, h: 365, lex: 'L1', commits: H }), J);
  const lex = d.prepare("SELECT count(*) n FROM commits WHERE lex <> 'L1'").get().n;
  // the reference caps each commit where it was mined; compare only the classification and settledness here
  console.log(`${lex === 0 && settled(d) ? 'OK  ' : 'FAIL'} T4 case 2 with the tip advancing a day per pass, every pass killed after ${J}: complete after ${p} passes (C = 17); commits not at L1 ${lex}; commits ${nC(d)}; digest ${meta(d, 'mined_fix_lexicon_digest')}`);
  if (!(lex === 0 && settled(d) && p <= 17)) bad++;
}
// T5: a recompute (h 365->20) while the tip advances a day per pass, inside the bound
for (const J of [1, 5]) {
  const base = build(); pass(base, { refTs: T0, h: 365, commits: H });
  const C = pass(clone(base), { refTs: T0 + DAY, h: 20, commits: H });
  const d = clone(base);
  let last;
  const p = untilDone(d, (q) => (last = { refTs: T0 + q * DAY, h: 20, commits: H }), J);
  const sup = faults(d).filter((f) => f.code === 'recompute_superseded').length;
  report(`T5 recompute with the tip advancing a day per pass, every pass killed after ${J}`, p, C, maxRelErr(d, freshMine(H, last.refTs, 20)), `; superseded ${sup}; epoch the first pass's ${Number(meta(d, 'weight_epoch')) === T0 + DAY}`);
}
// T6: 300 random orders of tunes of h (365, 20, 50) and of lex (L0, L1, L2), each pass killed
// after 1-40 transactions or not, then one pass: every ratio equals a fresh mine at the last values
{
  let s = 777; const r = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  let worst = 0, fails = 0;
  for (let i = 0; i < 300; i++) {
    const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
    let refTs = T0, h = 365, lex = 'L0';
    const steps = 1 + Math.floor(r() * 5);
    for (let j = 0; j < steps; j++) {
      refTs += DAY; if (r() < 0.6) h = [365, 20, 50][Math.floor(r() * 3)]; if (r() < 0.6) lex = ['L0', 'L1', 'L2'][Math.floor(r() * 3)];
      killed(d, { refTs, h, lex, commits: H, stopAfter: r() < 0.15 ? Infinity : 1 + Math.floor(r() * 40) });
    }
    refTs += DAY; pass(d, { refTs, h, lex, commits: H });
    const e = maxRelErr(d, freshMine(H, refTs, h, 40, lex));
    const cls = d.prepare('SELECT count(*) n FROM commits WHERE lex <> ?').get(lex).n;
    worst = Math.max(worst, e); if (!(e <= TOL && cls === 0 && settled(d) && nC(d) === 400)) fails++;
  }
  if (fails) bad++;
  console.log(`${fails ? 'FAIL' : 'OK  '} T6 300 random orders of tunes of h and lex with kills, then one pass: ${fails} orders wrong; max relative ratio error ${worst.toExponential(3)}`);
}
console.log(`\n${bad} failed`);
process.exit(bad ? 1 : 0);
