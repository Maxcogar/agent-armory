// test-recompute.mjs — checks recompute.mjs, the model of AD-13's pass around a full
// recompute (R8-2, R8-7). Every ratio is compared with a fresh mine of the same commits
// at the last pass's refTs and h; the tolerance is AD-13's derived bound, far above the
// model's 400-commit error. Cases:
//   Z1   the round-8 reviewer's case: mined at h = 365, tuned to 20, the recompute killed
//        after each transaction count in turn, tuned back to 365, next pass (R8-2);
//   Z1c  the same kills with no tune back;
//   F5-6 bench-epoch.mjs's case: a recompute at an older tip killed half-way, the next
//        pass on the newer tip inside the old bound (the marker is still needed);
//   R8-7 a pass that recomputes and mines new commits (one of them author-dated in the
//        future), killed in the recompute and in the mine: one epoch and one cap;
//   REP  the stated limitation: every pass killed before the recompute ends; then one
//        pass that is not interrupted.
// Exit 0 only when every check passes.
import assert from 'node:assert/strict';
import { DAY, build, history, pass, freshMine, maxRelErr, meta, pastBound } from './recompute.mjs';

const TOL = 1.6e-13 * 2 * 3; // AD-13: term bound, x2 per ratio, x3 for fresh vs incremental (n small)
let passes = 0, failures = 0;
const check = (name, fn) => { try { fn(); passes++; } catch (e) { failures++; console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`); } };
const T0 = 1790000000;
const killed = (d, o) => { try { pass(d, o); return false; } catch (e) { if (e.message !== 'killed') throw e; return true; } };
const settled = (d) => meta(d, 'recompute_pending') === undefined && meta(d, 'mining_in_progress') === undefined;

// Z1 and Z1c
{
  const H = history({ newest: T0 });
  const total = (() => { const d = build(); pass(d, { refTs: T0, h: 365, commits: H }); return pass(d, { refTs: T0 + DAY, h: 20 }); })();
  const fresh0 = freshMine(H, T0 + 2 * DAY, 365), fresh1 = freshMine(H, T0 + 2 * DAY, 20);
  const errs = [], errsC = [];
  for (let K = 1; K < total; K++) {
    const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
    const k = killed(d, { refTs: T0 + DAY, h: 20, stopAfter: K });
    pass(d, { refTs: T0 + 2 * DAY, h: 365 }); // tuned back
    errs.push(maxRelErr(d, fresh0));
    check(`Z1 killed after ${K} of ${total}: killed, then settled at h 365`, () => { assert.ok(k); assert.ok(settled(d)); assert.equal(Number(meta(d, 'mined_half_life_days')), 365); assert.equal(Number(meta(d, 'weight_epoch')), T0 + 2 * DAY); });
    check(`Z1 killed after ${K} of ${total}: every ratio equals a fresh mine at h 365`, () => assert.ok(errs.at(-1) <= TOL, `error ${errs.at(-1)}`));
    const c = build(); pass(c, { refTs: T0, h: 365, commits: H });
    killed(c, { refTs: T0 + DAY, h: 20, stopAfter: K });
    pass(c, { refTs: T0 + 2 * DAY, h: 20 });
    errsC.push(maxRelErr(c, fresh1));
    check(`Z1c killed after ${K} of ${total}, no tune back: equals a fresh mine at h 20`, () => assert.ok(errsC.at(-1) <= TOL, `error ${errsC.at(-1)}`));
  }
  console.log(`Z1: ${total} transactions in the recompute pass; killed after 1..${total - 1}, tuned back to 365: max relative ratio error vs a fresh mine ${Math.max(...errs).toExponential(3)}; with no tune back (h 20): ${Math.max(...errsC).toExponential(3)}`);
}
// F5-6 (bench-epoch.mjs's shape at the half-life floor)
{
  const h = 1.787, OLDER = T0 - 30 * DAY;
  const H = history({ newest: OLDER });
  const total = (() => { const d = build(); pass(d, { refTs: T0, h, commits: H }); return pass(d, { refTs: OLDER, h }); })();
  const d = build(); pass(d, { refTs: T0, h, commits: H });
  const pb = pastBound(OLDER, T0, h);
  const k = killed(d, { refTs: OLDER, h, stopAfter: Math.floor(total / 2) });
  const inside = !pastBound(T0, Number(meta(d, 'weight_epoch')), h);
  pass(d, { refTs: T0, h });
  const err = maxRelErr(d, freshMine(H, T0, h));
  console.log(`F5-6: older tip past the bound ${pb}; recompute killed after ${Math.floor(total / 2)} of ${total}; next pass at the newer tip inside the old bound ${inside}; max relative ratio error vs a fresh mine ${err.toExponential(3)}`);
  check('F5-6 the marker makes the next pass recompute though its own compare finds nothing', () => { assert.ok(pb); assert.ok(k); assert.ok(inside); assert.ok(settled(d)); assert.ok(err <= TOL, `error ${err}`); });
}
// R8-7: recompute and mine in one pass, killed in each phase; a future-dated commit is capped
{
  const H = history({ newest: T0 });
  const NEW = history({ n: 60, newest: T0 + 40 * DAY }).map((c, i) => ({ ...c, hash: `n${i}` }));
  NEW.push({ hash: 'future', ts: T0 + 400 * DAY, files: [1, 2, 3] }); // author date past every refTs
  const refTs = T0 + 50 * DAY;
  const total = (() => { const d = build(); pass(d, { refTs: T0, h: 365, commits: H }); return pass(d, { refTs, h: 30, commits: [...H, ...NEW] }); })();
  const fresh = freshMine([...H, ...NEW], refTs + DAY, 30);
  const errs = [];
  for (let K = 1; K <= total; K++) {
    const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
    const k = K < total ? killed(d, { refTs, h: 30, commits: [...H, ...NEW], stopAfter: K }) : (pass(d, { refTs: refTs + DAY, h: 30, commits: [...H, ...NEW] }), false);
    if (k) pass(d, { refTs: refTs + DAY, h: 30, commits: [...H, ...NEW] });
    errs.push(maxRelErr(d, fresh));
    const fw = d.prepare("SELECT weight FROM commits WHERE hash = 'future'").get().weight;
    check(`R8-7 ${K < total ? `killed after ${K} of ${total}` : 'not killed'}: one epoch, the cap at it, and every ratio equals a fresh mine`, () => {
      assert.ok(settled(d)); assert.equal(Number(meta(d, 'weight_epoch')), refTs + DAY);
      assert.equal(fw, 1, 'the future-dated commit is capped at the epoch, its term 2^0');
      assert.ok(errs.at(-1) <= TOL, `error ${errs.at(-1)}`);
    });
  }
  console.log(`R8-7: a recompute (h 365 -> 30) and a mine of ${NEW.length} commits in one pass of ${total} transactions, killed after 1..${total - 1} or not: max relative ratio error vs a fresh mine ${Math.max(...errs).toExponential(3)}`);
}
// REP: the limitation the restart leaves, and its end
{
  const H = history({ newest: T0 });
  const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
  let kills = 0;
  for (let p = 1; p <= 20; p++) if (killed(d, { refTs: T0 + p * DAY, h: 20, stopAfter: 5 })) kills++;
  const stuck = { pending: meta(d, 'recompute_pending'), mip: meta(d, 'mining_in_progress'), h: meta(d, 'mined_half_life_days') };
  pass(d, { refTs: T0 + 21 * DAY, h: 20 });
  const err = maxRelErr(d, freshMine(H, T0 + 21 * DAY, 20));
  console.log(`REP: 20 passes each killed after 5 transactions: ${kills} killed; after them recompute_pending ${stuck.pending}, mining_in_progress ${stuck.mip}, mined_half_life_days ${stuck.h}; one uninterrupted pass: max relative ratio error ${err.toExponential(3)}`);
  check('REP repeated interruption never finishes the recompute and leaves the flag set; one uninterrupted pass ends it exactly', () => {
    assert.equal(kills, 20); assert.equal(Number(stuck.pending), 1); assert.equal(Number(stuck.mip), 1); assert.equal(Number(stuck.h), 365);
    assert.ok(settled(d)); assert.ok(err <= TOL);
  });
}
console.log(`\n${passes} checks passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
