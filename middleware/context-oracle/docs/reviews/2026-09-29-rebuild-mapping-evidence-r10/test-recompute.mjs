// test-recompute.mjs — checks recompute.mjs, the model of AD-13's pass (round-10 revision
// of the round-9 evidence's test, kept unedited). Every ratio is compared with a fresh
// mine of the same commits; the tolerance is AD-13's derived bound, far above the
// model's 400-commit error. Cases:
//   Z1   the round-8 reviewer's case: mined at h = 365, tuned to 20, the recompute killed
//        after each transaction count in turn, tuned back to 365, next pass. The pending
//        recompute's h differs, so it is superseded (recorded) and redone at 365 (R8-2, R9-1);
//   Z1c  the same kills with no tune back: the recompute resumes at its own h and epoch;
//   Z1r  200 random orders of tunes of h (365, 20, 50) and kills, then one pass that is
//        not interrupted: every ratio equals a fresh mine at the last h (R9-1);
//   F5-6 bench-epoch.mjs's case: a recompute at an older tip killed half-way, the next
//        pass on the newer tip inside the old bound finishes it (the marker is needed);
//   R8-7 a pass that recomputes and mines new commits (one author-dated in the future),
//        killed in the recompute and in the mine: one epoch, one cap for the recompute;
//   K1   the round-9 reviewer's case: a first mine killed after 4 transactions, then every
//        pass killed after 1 (C-3's case) or 5; and a first mine killed after each k of
//        its transactions, then one pass (R9-1);
//   KR   C-3 on a recompute: every pass killed after 1 or 5 transactions (R9-1, R9-6);
//   K2   the round-9 reviewer's case on this model: a tune of the classifying key, a
//        reconcile with D = S, 30 passes each killed after 10 (and after 1); a tune back
//        during the eviction; a second tune during the mine (R9-2);
//   K10-RM the round-10 reviewer's case: a recompute and a mine of new commits in one pass,
//        killed after each K, then one pass; every pass killed after 1, 2 or 3 (R10-1);
//   T3   the round-10 reviewer's case: a first mine killed after 4, h tuned, then every
//        pass killed after 1 or 5 (R10-1);
//   RW   the recompute killed after each K, then the implicit rowids renumbered, as VACUUM
//        is documented to allow, then the next pass (R10-3);
//   MV   the round-10 reviewer's case: each mined-with value deleted beside stored commits
//        (R10-4);
//   BS   the round-10 reviewer's case: a recompute killed, then a pass on a tip past its
//        epoch's bound (R10-6).
// Z1's kill after the recompute's last transaction now finds the recompute ended (R10-1).
// Exit 0 only when every check passes.
import assert from 'node:assert/strict';
import { DAY, build, history, pass, freshMine, maxRelErr, meta, faults, pastBound } from './recompute.mjs';

const TOL = 1.6e-13 * 2 * 3; // AD-13: term bound, x2 per ratio, x3 for fresh vs incremental (n small)
let passes = 0, failures = 0;
const check = (name, fn) => { try { fn(); passes++; } catch (e) { failures++; console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`); } };
const T0 = 1790000000;
const killed = (d, o) => { try { pass(d, o); return false; } catch (e) { if (e.message !== 'killed') throw e; return true; } };
const settled = (d) => meta(d, 'recompute_pending') === undefined && meta(d, 'mining_in_progress') === undefined;
const nC = (d) => d.prepare('SELECT count(*) n FROM commits').get().n;
const codes = (d) => faults(d).map((f) => f.code);
/** Passes, each killed after `j` transactions, until one completes; returns the passes made (the completing one included). */
const untilDone = (d, o, j, max = 100) => { for (let p = 1; p <= max; p++) if (!killed(d, { ...(typeof o === 'function' ? o(p) : o), stopAfter: j })) return p; return Infinity; };

// Z1 and Z1c
{
  const H = history({ newest: T0 });
  const total = (() => { const d = build(); pass(d, { refTs: T0, h: 365, commits: H }); return pass(d, { refTs: T0 + DAY, h: 20 }); })();
  const fresh0 = freshMine(H, T0 + 2 * DAY, 365), fresh1 = freshMine(H, T0 + 2 * DAY, 20);
  const errs = [], errsC = [];
  for (let K = 1; K < total; K++) {
    const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
    const k = killed(d, { refTs: T0 + DAY, h: 20, stopAfter: K });
    const ended = K === total - 1; // only the final transaction left: the recompute has ended (R10-1)
    const mid = JSON.parse(meta(d, 'recompute_pending') ?? 'null'), hAtKill = Number(meta(d, 'mined_half_life_days'));
    pass(d, { refTs: T0 + 2 * DAY, h: 365 }); // tuned back
    errs.push(maxRelErr(d, fresh0));
    check(`Z1 killed after ${K} of ${total}: killed, the recompute's inputs stored (after its last transaction: its values), then superseded (recorded) or recomputed, and settled at h 365`, () => {
      assert.ok(k);
      if (ended) { assert.equal(mid, null); assert.equal(hAtKill, 20); } else { assert.equal(mid.h, 20); assert.equal(mid.epoch, T0 + DAY); }
      assert.ok(settled(d)); assert.equal(Number(meta(d, 'mined_half_life_days')), 365); assert.equal(Number(meta(d, 'weight_epoch')), T0 + 2 * DAY);
      const sup = faults(d).filter((f) => f.code === 'recompute_superseded');
      assert.equal(sup.length, ended ? 0 : 1);
      if (!ended) { assert.deepEqual(sup[0].from, { h: 20, epoch: T0 + DAY }); assert.deepEqual(sup[0].to, { h: 365, epoch: T0 + 2 * DAY }); }
    });
    check(`Z1 killed after ${K} of ${total}: every ratio equals a fresh mine at h 365`, () => assert.ok(errs.at(-1) <= TOL, `error ${errs.at(-1)}`));
    const c = build(); pass(c, { refTs: T0, h: 365, commits: H });
    killed(c, { refTs: T0 + DAY, h: 20, stopAfter: K });
    const t2 = pass(c, { refTs: T0 + 2 * DAY, h: 20 });
    errsC.push(maxRelErr(c, fresh1));
    check(`Z1c killed after ${K} of ${total}, no tune back: resumed at its own epoch, equals a fresh mine at h 20`, () => {
      assert.ok(errsC.at(-1) <= TOL, `error ${errsC.at(-1)}`);
      assert.equal(Number(meta(c, 'weight_epoch')), T0 + DAY, 'the recompute keeps its own epoch');
      assert.equal(t2, total - K, 'the resumed pass does only the work left');
      assert.deepEqual(codes(c), ['mining_resumed']);
    });
  }
  console.log(`Z1: ${total} transactions in the recompute pass; killed after 1..${total - 1}, tuned back to 365 (superseded, recorded; after ${total - 1}, the recompute's last transaction, a new recompute): max relative ratio error vs a fresh mine ${Math.max(...errs).toExponential(3)}; with no tune back (resumed, h 20): ${Math.max(...errsC).toExponential(3)}`);
}
// Z1r: random orders of tunes and interruptions
{
  const H = history({ newest: T0 });
  let s = 12345; const r = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  let worst = 0, sup = 0, res = 0;
  for (let i = 0; i < 200; i++) {
    const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
    let refTs = T0, h = 365;
    const steps = 1 + Math.floor(r() * 4);
    for (let j = 0; j < steps; j++) {
      refTs += DAY; h = [365, 20, 50][Math.floor(r() * 3)];
      killed(d, { refTs, h, stopAfter: r() < 0.2 ? Infinity : 1 + Math.floor(r() * 30) });
    }
    refTs += DAY;
    pass(d, { refTs, h });
    const e = maxRelErr(d, freshMine(H, refTs, h));
    worst = Math.max(worst, e);
    sup += codes(d).filter((c) => c === 'recompute_superseded').length; res += codes(d).filter((c) => c === 'mining_resumed').length;
    check(`Z1r order ${i}: settled at the last h, every ratio equals a fresh mine`, () => { assert.ok(settled(d)); assert.equal(Number(meta(d, 'mined_half_life_days')), h); assert.ok(e <= TOL, `error ${e}`); });
  }
  console.log(`Z1r: 200 random orders of 1-4 tunes of h (365, 20, 50), each pass killed after 1-30 transactions or not, then one pass: max relative ratio error ${worst.toExponential(3)}; recompute_superseded ${sup}, mining_resumed ${res} records`);
}
// F5-6 (bench-epoch.mjs's shape at the half-life floor)
{
  const h = 1.787, OLDER = T0 - 30 * DAY;
  const H = history({ newest: OLDER });
  const total = (() => { const d = build(); pass(d, { refTs: T0, h, commits: H }); return pass(d, { refTs: OLDER, h }); })();
  const d = build(); pass(d, { refTs: T0, h, commits: H });
  const pb = pastBound(OLDER, T0, h);
  const k = killed(d, { refTs: OLDER, h, stopAfter: Math.floor(total / 2) });
  const inside = !pastBound(T0, Number(meta(d, 'weight_epoch')), h) && !pastBound(T0, OLDER, h);
  pass(d, { refTs: T0, h });
  const err = maxRelErr(d, freshMine(H, T0, h));
  console.log(`F5-6: older tip past the bound ${pb}; recompute killed after ${Math.floor(total / 2)} of ${total}; next pass at the newer tip inside the old and the recompute's bound ${inside}; resumed, epoch ${Number(meta(d, 'weight_epoch')) === OLDER ? 'the recompute\'s' : 'another'}; max relative ratio error vs a fresh mine ${err.toExponential(3)}`);
  check('F5-6 the marker makes the next pass finish the recompute though its own compare finds nothing', () => {
    assert.ok(pb); assert.ok(k); assert.ok(inside); assert.ok(settled(d)); assert.ok(err <= TOL, `error ${err}`);
    assert.equal(Number(meta(d, 'weight_epoch')), OLDER);
  });
}
// R8-7: recompute and mine in one pass, killed in each phase; a future-dated commit is capped.
// The recompute's rows use its own epoch and cap wherever it is resumed; a commit mined by a
// resuming pass at a later refTs is capped at that pass's refTs, as every mine caps (AD-13's
// capped-commit exception), so the reference caps the future-dated commit where it was mined.
// A stored commit authored after the first mine's tip ('late', capped at T0 when mined) is
// re-capped by the recompute at the recompute's own refTs.
{
  const H = [...history({ newest: T0 }), { hash: 'late', ts: T0 + 20 * DAY, files: [4, 5, 6] }];
  const NEW = history({ n: 60, newest: T0 + 40 * DAY }).map((c, i) => ({ ...c, hash: `n${i}` }));
  NEW.push({ hash: 'future', ts: T0 + 400 * DAY, files: [1, 2, 3] }); // author date past every refTs
  const refTs = T0 + 50 * DAY;
  const total = (() => { const d = build(); pass(d, { refTs: T0, h: 365, commits: H }); return pass(d, { refTs, h: 30, commits: [...H, ...NEW] }); })();
  const errs = [];
  for (let K = 1; K <= total; K++) {
    const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
    const k = K < total ? killed(d, { refTs, h: 30, commits: [...H, ...NEW], stopAfter: K }) : (pass(d, { refTs: refTs + DAY, h: 30, commits: [...H, ...NEW] }), false);
    const minedByKilled = d.prepare("SELECT count(*) n FROM commits WHERE hash = 'future'").get().n === 1;
    if (k) pass(d, { refTs: refTs + DAY, h: 30, commits: [...H, ...NEW] });
    const cap = k ? (minedByKilled ? refTs : refTs + DAY) : refTs + DAY;
    const ref = freshMine([...H, ...NEW.map((c) => (c.hash === 'future' ? { ...c, ts: cap } : c))], refTs + DAY, 30);
    errs.push(maxRelErr(d, ref));
    const fw = d.prepare("SELECT weight FROM commits WHERE hash = 'future'").get().weight;
    const lw = d.prepare("SELECT weight FROM commits WHERE hash = 'late'").get().weight;
    const E = Number(meta(d, 'weight_epoch'));
    check(`R8-7 ${K < total ? `killed after ${K} of ${total}` : 'not killed'}: one epoch, the recompute's cap, and every ratio equals a fresh mine`, () => {
      assert.ok(settled(d)); assert.equal(E, k ? refTs : refTs + DAY, 'the recompute keeps its epoch when resumed');
      assert.equal(fw, 2 ** ((cap - E) / (DAY * 30)), 'the future-dated commit is capped at the refTs of the pass that mined it');
      assert.equal(lw, 2 ** ((T0 + 20 * DAY - E) / (DAY * 30)), 'the recompute re-caps a stored commit at its own refTs, not the stored epoch');
      assert.ok(errs.at(-1) <= TOL, `error ${errs.at(-1)}`);
    });
  }
  console.log(`R8-7: a recompute (h 365 -> 30) and a mine of ${NEW.length} commits in one pass of ${total} transactions, killed after 1..${total - 1} or not, then a pass one day later: max relative ratio error vs a fresh mine (the future-dated commit capped where it was mined) ${Math.max(...errs).toExponential(3)}`);
}
// K1: a first mine killed, then every pass killed (C-3; the round-9 review's K1)
{
  const H = history({ n: 400, newest: T0 });
  const C = pass(build(), { refTs: T0, h: 365, commits: H });
  for (const J of [1, 5]) {
    const d = build();
    const k = killed(d, { refTs: T0, h: 365, commits: H, stopAfter: 4 });
    const after = { commits: nC(d), h: meta(d, 'mined_half_life_days'), E: meta(d, 'weight_epoch') };
    const p = untilDone(d, { refTs: T0, h: 365, commits: H }, J);
    const err = maxRelErr(d, freshMine(H, T0, 365));
    console.log(`K1: first mine killed after 4 of C = ${C} transactions: commits ${after.commits}, mined_half_life_days ${after.h}, weight_epoch ${after.E}; then every pass killed after ${J}: complete after ${p} more passes (${p + 1} in all); recompute_pending never set ${meta(d, 'recompute_pending') === undefined && !codes(d).includes('recompute_superseded')}; records ${JSON.stringify(codes(d))}; error ${err.toExponential(3)}`);
    check(`K1 killed after 4, then every pass after ${J}: completes within C passes, equal to a fresh mine`, () => {
      assert.ok(k); assert.equal(after.commits, 200); assert.equal(Number(after.h), 365); assert.equal(Number(after.E), T0);
      assert.ok(p + 1 <= C, `${p + 1} passes > C = ${C}`); assert.ok(settled(d)); assert.equal(nC(d), 400); assert.ok(err <= TOL);
    });
  }
  // killed after each k of its transactions, then one pass: that pass mines only T \ S
  const seen = [];
  for (let K = 1; K < C; K++) {
    const d = build(); killed(d, { refTs: T0, h: 365, commits: H, stopAfter: K });
    const s = nC(d);
    const t = pass(d, { refTs: T0, h: 365, commits: H });
    seen.push(`${K}:${s}+${t}`);
    check(`K1 first mine killed after ${K}: the next pass does only the work left and equals a fresh mine`, () => {
      assert.equal(t, C - K); assert.equal(meta(d, 'recompute_pending'), undefined); assert.equal(nC(d), 400); assert.ok(maxRelErr(d, freshMine(H, T0, 365)) <= TOL);
    });
  }
  console.log(`K1 killed after k, then one pass (k: commits kept + the next pass's transactions): ${seen.join(' ')}`);
}
// KR: C-3 on a recompute — tune h, then every pass killed after J transactions, refTs advancing
{
  const H = history({ newest: T0 });
  const C = (() => { const d = build(); pass(d, { refTs: T0, h: 365, commits: H }); return pass(d, { refTs: T0 + DAY, h: 20 }); })();
  for (const J of [1, 5]) {
    const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
    const p = untilDone(d, (q) => ({ refTs: T0 + q * DAY, h: 20 }), J);
    const last = T0 + p * DAY;
    const err = maxRelErr(d, freshMine(H, last, 20));
    const resumed = faults(d).filter((f) => f.code === 'mining_resumed');
    console.log(`KR: recompute pass of C = ${C} transactions; every pass killed after ${J}: complete after ${p} passes; mining_resumed records ${resumed.length}, last {interrupted: ${resumed.at(-1)?.interrupted}}; epoch the first pass's ${Number(meta(d, 'weight_epoch')) === T0 + DAY}; error ${err.toExponential(3)}`);
    check(`KR every recompute pass killed after ${J}: completes within C passes at its own inputs, each resume recorded`, () => {
      assert.ok(p <= C, `${p} passes > C = ${C}`); assert.ok(settled(d)); assert.ok(err <= TOL, `error ${err}`);
      assert.equal(Number(meta(d, 'weight_epoch')), T0 + DAY); assert.equal(Number(meta(d, 'mined_half_life_days')), 20);
      assert.equal(resumed.length, p - 1); assert.deepEqual(resumed.map((f) => f.interrupted), Array.from({ length: p - 1 }, (_, i) => i + 1));
      assert.ok(!codes(d).includes('recompute_superseded'));
    });
  }
}
// K2: case 2, a tune of the classifying key (the round-9 review's K2 on this model)
{
  const H = history({ n: 400, newest: T0 });
  const lexes = (d) => d.prepare('SELECT lex, count(*) n FROM commits GROUP BY lex ORDER BY lex').all().map((x) => `${x.lex}:${x.n}`).join(',');
  const C = (() => { const d = build(); pass(d, { refTs: T0, h: 365, commits: H }); return pass(d, { refTs: T0, h: 365, lex: 'L1', commits: H }); })();
  for (const J of [10, 1]) {
    const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
    const seen = [];
    let p = 0;
    for (; p < 30; p++) { if (!killed(d, { refTs: T0, h: 365, lex: 'L1', commits: H, stopAfter: J })) { seen.push('completed'); break; } seen.push(d.prepare("SELECT count(*) n FROM commits WHERE lex = 'L1'").get().n); }
    const err = maxRelErr(d, freshMine(H, T0, 365, 40, 'L1'));
    console.log(`K2: L0 -> L1, a reconcile with D = S of 400 commits in chunks of 50 (an uninterrupted pass: C = ${C} transactions); passes each killed after ${J}: commits at L1 after each ${JSON.stringify(seen)}; digest ${meta(d, 'mined_fix_lexicon_digest')}; commits by digest ${lexes(d)}; error ${err.toExponential(3)}`);
    check(`K2 every pass killed after ${J}: completes within C passes, every commit classified at the new value`, () => {
      assert.equal(seen.at(-1), 'completed'); assert.ok(p + 1 <= C, `${p + 1} passes > C = ${C}`);
      assert.equal(meta(d, 'mined_fix_lexicon_digest'), 'L1'); assert.equal(lexes(d), 'L1:400'); assert.ok(settled(d)); assert.ok(err <= TOL);
    });
  }
  // a tune back during the eviction, and a second tune during the mine
  {
    const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
    killed(d, { refTs: T0, h: 365, lex: 'L1', commits: H, stopAfter: 3 }); // 150 of 400 evicted
    const mid = { n: nC(d), digest: meta(d, 'mined_fix_lexicon_digest') };
    pass(d, { refTs: T0, h: 365, lex: 'L0', commits: H });
    const back = { digest: meta(d, 'mined_fix_lexicon_digest'), lex: lexes(d), err: maxRelErr(d, freshMine(H, T0, 365)) };
    const e = build(); pass(e, { refTs: T0, h: 365, commits: H });
    killed(e, { refTs: T0, h: 365, lex: 'L1', commits: H, stopAfter: 10 }); // eviction done, 100 mined at L1
    const mid2 = { digest: meta(e, 'mined_fix_lexicon_digest'), lex: lexes(e) };
    pass(e, { refTs: T0, h: 365, lex: 'L2', commits: H });
    const second = { digest: meta(e, 'mined_fix_lexicon_digest'), lex: lexes(e), err: maxRelErr(e, freshMine(H, T0, 365, 40, 'L2')) };
    console.log(`K2 tune back during the eviction: after the kill ${mid.n} commits, digest ${mid.digest}; after a pass at L0: digest ${back.digest}, ${back.lex}, error ${back.err.toExponential(3)}. Second tune during the mine: after the kill digest ${mid2.digest}, ${mid2.lex}; after a pass at L2: digest ${second.digest}, ${second.lex}, error ${second.err.toExponential(3)}`);
    check('K2 a tune back during the eviction re-mines the evicted commits at the old value; a second tune during the mine evicts and re-mines at the newest', () => {
      assert.equal(mid.n, 250); assert.equal(mid.digest, 'L0'); assert.equal(back.digest, 'L0'); assert.equal(back.lex, 'L0:400'); assert.ok(back.err <= TOL);
      assert.equal(mid2.digest, 'L1'); assert.equal(mid2.lex, 'L1:100'); assert.equal(second.digest, 'L2'); assert.equal(second.lex, 'L2:400'); assert.ok(second.err <= TOL);
    });
  }
}
// K10-RM and T3 (R10-1): a pass that recomputes and then mines; a killed first mine, then a
// tune of h. The recompute's last transaction ends it, so a pass killed in the mine resumes
// as an ordinary pass and recomputes nothing again.
{
  const H = history({ n: 400, newest: T0 });
  // the new commits touch 20 files the stored history never touched (41-60), so the mine inserts new pairs
  const NEW = history({ n: 100, files: 20, newest: T0 + 20 * DAY }).map((c, i) => ({ ...c, hash: `n${i}`, files: c.files.map((f) => f + 40) }));
  const ALL = [...H, ...NEW], REF = T0 + 30 * DAY;
  const base = () => { const d = build(60); pass(d, { refTs: T0, h: 365, commits: H }); return d; };
  const C = pass(base(), { refTs: REF, h: 20, commits: ALL });
  const fresh = freshMine(ALL, REF, 20, 60);
  const over = [];
  let worst = 0;
  for (let K = 1; K < C; K++) {
    const d = base(); killed(d, { refTs: REF, h: 20, commits: ALL, stopAfter: K });
    const t = pass(d, { refTs: REF, h: 20, commits: ALL });
    const e = maxRelErr(d, fresh); worst = Math.max(worst, e);
    if (t !== C - K) over.push(`${K}:${t}`);
    check(`K10-RM killed after ${K} of ${C}: the next pass does only the C - K transactions left, equal to a fresh mine`, () => { assert.equal(t, C - K); assert.ok(settled(d)); assert.ok(e <= TOL, `error ${e}`); });
  }
  console.log(`K10-RM: a recompute (h 365 -> 20) and a mine of 100 new commits on 20 new files in one pass, C = ${C}; killed after K, then one pass: transactions differ from C - K for ${over.length} of ${C - 1} values of K ${over.join(' ')}; max relative ratio error ${worst.toExponential(3)}`);
  for (const J of [1, 2, 3]) {
    const d = base();
    const p = untilDone(d, { refTs: REF, h: 20, commits: ALL }, J);
    const err = maxRelErr(d, fresh);
    console.log(`K10-RM every pass killed after ${J}: complete after ${p} passes (C = ${C}); weight_epoch the recompute's ${Number(meta(d, 'weight_epoch')) === REF}; records ${JSON.stringify([...new Set(codes(d))])}; error ${err.toExponential(3)}`);
    check(`K10-RM every pass killed after ${J}: completes within C passes, equal to a fresh mine`, () => {
      assert.ok(p <= C, `${p} passes > C = ${C}`); assert.ok(settled(d)); assert.ok(err <= TOL, `error ${err}`);
      assert.equal(Number(meta(d, 'weight_epoch')), REF); assert.equal(Number(meta(d, 'mined_half_life_days')), 20);
    });
  }
  for (const J of [1, 5]) {
    const c = build(); killed(c, { refTs: T0, h: 365, commits: H, stopAfter: 4 });
    const C3 = pass(c, { refTs: T0, h: 50, commits: H });
    const d = build(); killed(d, { refTs: T0, h: 365, commits: H, stopAfter: 4 });
    const p = untilDone(d, { refTs: T0, h: 50, commits: H }, J);
    const err = maxRelErr(d, freshMine(H, T0, 50));
    console.log(`T3 first mine killed after 4, h tuned 365 -> 50, every pass killed after ${J}: complete after ${p} passes (C = ${C3}); commits ${nC(d)}; error ${err.toExponential(3)}`);
    check(`T3 first mine killed after 4, h tuned, every pass killed after ${J}: completes within C passes, equal to a fresh mine`, () => { assert.ok(p <= C3, `${p} passes > C = ${C3}`); assert.ok(settled(d)); assert.equal(nC(d), 400); assert.ok(err <= TOL, `error ${err}`); });
  }
}
// RW (R10-3): the recompute killed after K, then every implicit rowid of commits and pairs
// renumbered (reversed), which SQLite documents VACUUM "may change" for a table with no
// explicit INTEGER PRIMARY KEY (export is VACUUM INTO); then the next pass. `done` names a
// row by its primary key, so the resume takes exactly the rows left.
{
  const H = history({ newest: T0 });
  const total = (() => { const d = build(); pass(d, { refTs: T0, h: 365, commits: H }); return pass(d, { refTs: T0 + DAY, h: 20 }); })();
  const fresh = freshMine(H, T0 + 2 * DAY, 20);
  const renumber = (d) => { for (const t of ['commits', 'pairs']) d.exec(`CREATE TEMP TABLE x AS SELECT * FROM ${t} ORDER BY rowid DESC; DELETE FROM ${t}; INSERT INTO ${t} SELECT * FROM x ORDER BY rowid; DROP TABLE x`); };
  const errs = [];
  for (let K = 1; K < total; K++) {
    const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
    killed(d, { refTs: T0 + DAY, h: 20, stopAfter: K });
    const before = d.prepare("SELECT rowid r FROM commits WHERE hash = 'c0'").get().r;
    renumber(d);
    const moved = d.prepare("SELECT rowid r FROM commits WHERE hash = 'c0'").get().r !== before;
    const t2 = pass(d, { refTs: T0 + 2 * DAY, h: 20 });
    errs.push(maxRelErr(d, fresh));
    check(`RW killed after ${K} of ${total}, rowids renumbered: the next pass does only the work left, equal to a fresh mine`, () => {
      assert.ok(moved); assert.equal(t2, total - K); assert.ok(errs.at(-1) <= TOL, `error ${errs.at(-1)}`); assert.deepEqual(codes(d), ['mining_resumed']);
    });
  }
  console.log(`RW: recompute pass of ${total} transactions killed after 1..${total - 1}, commits' and pairs' rowids reversed, then the next pass: max relative ratio error ${Math.max(...errs).toExponential(3)}`);
}
// MV (R10-4; the round-10 review's k10-missing-value.mjs): each mined-with value deleted from
// a store holding commits, then a pass with new commits: recorded, and read as changed.
{
  const H = history({ n: 200, newest: T0 }), NEW = history({ n: 50, newest: T0 + 10 * DAY }).map((c, i) => ({ ...c, hash: `n${i}` }));
  const fresh = freshMine([...H, ...NEW], T0 + 10 * DAY, 365);
  for (const key of ['mined_half_life_days', 'weight_epoch', 'mined_fix_lexicon_digest']) {
    const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
    d.prepare('DELETE FROM meta WHERE key = ?').run(key);
    let out = 'completed'; try { pass(d, { refTs: T0 + 10 * DAY, h: 365, commits: [...H, ...NEW] }); } catch (e) { out = `threw: ${e.message}`; }
    const rec = faults(d).filter((f) => f.code === 'mined_with_missing').map((f) => f.missing);
    const err = maxRelErr(d, fresh), E = Number(meta(d, 'weight_epoch'));
    const cs = key === 'mined_fix_lexicon_digest' ? 2 : 1;
    console.log(`MV ${key} deleted: pass ${out}; mined_with_missing ${JSON.stringify(rec)}; weight_epoch ${E === T0 ? 'the first mine\'s' : E === T0 + 10 * DAY ? 'this pass\'s (a recompute)' : E}; error ${Number.isFinite(err) ? err.toExponential(3) : err}`);
    check(`MV ${key} missing beside stored commits: recorded, case ${cs}, equal to a fresh mine`, () => {
      assert.equal(out, 'completed'); assert.deepEqual(rec, [[key]]); assert.ok(settled(d)); assert.ok(err <= TOL, `error ${err}`);
      assert.equal(E, cs === 1 ? T0 + 10 * DAY : T0);
    });
  }
}
// BS (R10-6; the round-10 review's k10-bound-supersede.mjs): at the half-life floor, the
// recompute (epoch T0) killed, then a pass on a tip 90 days older, past that epoch's bound:
// superseded and recorded, and every ratio equal to a fresh mine's at the older tip.
{
  const h = 1.787, OLDER = T0 - 90 * DAY, H = history({ newest: OLDER });
  const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
  const k = killed(d, { refTs: T0, h, stopAfter: 5 });
  const pend = JSON.parse(meta(d, 'recompute_pending') ?? 'null');
  const past = pend !== null && pastBound(OLDER, pend.epoch, h);
  let out = 'completed'; try { pass(d, { refTs: OLDER, h }); } catch (e) { out = `threw: ${e.message}`; }
  const err = maxRelErr(d, freshMine(H, OLDER, h));
  const sup = faults(d).filter((f) => f.code === 'recompute_superseded');
  console.log(`BS: killed ${k}; pending epoch T0 ${pend?.epoch === T0}; the older tip past its bound ${past}; next pass ${out}; recompute_superseded ${JSON.stringify(sup.map((x) => ({ from: x.from.epoch === T0 ? 'T0' : x.from.epoch, to: x.to.epoch === OLDER ? 'OLDER' : x.to.epoch })))}; error ${err.toExponential(3)}`);
  check("BS a pass past the pending recompute's epoch bound supersedes it, recorded, equal to a fresh mine at its tip", () => {
    assert.ok(k); assert.equal(pend.epoch, T0); assert.ok(past); assert.equal(out, 'completed'); assert.ok(settled(d));
    assert.deepEqual(sup.map((x) => [x.from, x.to]), [[{ h, epoch: T0 }, { h, epoch: OLDER }]]);
    assert.equal(Number(meta(d, 'weight_epoch')), OLDER); assert.ok(err <= TOL, `error ${err}`);
  });
}
console.log(`\n${passes} checks passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
