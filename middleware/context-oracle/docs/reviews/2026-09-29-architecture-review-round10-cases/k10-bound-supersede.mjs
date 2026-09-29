// k10-bound-supersede.mjs <recompute.mjs> — the supersession branch AD-13 states for "a
// checkout past the stored epoch's bound" while a recompute is unfinished (h unchanged), at
// the half-life floor (bench-epoch's shape): mined at h 365, h tuned to the floor 1.787, the
// recompute (epoch T0) killed, and the next pass runs on a tip 90 days older, past that
// recompute's epoch's bound (backward margin 1,022 h - 365.25 Y = 0.05 days). Expect:
// superseded and recorded, and every ratio equal to a fresh mine's at the older tip.
import path from 'node:path';
const { DAY, build, history, pass, freshMine, maxRelErr, meta, faults, pastBound } = await import(path.resolve(process.argv[2]));
const T0 = 1790000000, h = 1.787, TOL = 1.6e-13 * 2 * 3;
const OLDER = T0 - 90 * DAY, H = history({ newest: OLDER });
const killed = (d, o) => { try { pass(d, o); return false; } catch (e) { if (e.message !== 'killed') throw e; return true; } };
const d = build(); pass(d, { refTs: T0, h: 365, commits: H });      // mined at T0, h 365
const k = killed(d, { refTs: T0, h, stopAfter: 5 });                 // h tuned to 1.787: a recompute at epoch T0, killed
const pend = JSON.parse(meta(d, 'recompute_pending'));
const past = pastBound(OLDER, pend.epoch, h);                        // the older tip: past the recompute's own bound?
let out; try { pass(d, { refTs: OLDER, h }); out = 'completed'; } catch (e) { out = `threw ${e.message}`; }
const err = maxRelErr(d, freshMine(H, OLDER, h));
const sup = faults(d).filter((f) => f.code === 'recompute_superseded');
console.log(`killed ${k}; pending epoch ${pend.epoch === T0 ? 'T0' : pend.epoch}; the older tip past the pending epoch's bound ${past}; next pass at the older tip ${out}; recompute_superseded ${JSON.stringify(sup.map((s) => ({ from: s.from.epoch === T0 ? 'T0' : s.from.epoch, to: s.to.epoch === OLDER ? 'OLDER' : s.to.epoch })))}; weight_epoch ${Number(meta(d, 'weight_epoch')) === OLDER ? 'OLDER' : Number(meta(d, 'weight_epoch')) === T0 ? 'T0' : meta(d, 'weight_epoch')}; max relative ratio error ${Number.isFinite(err) ? err.toExponential(3) : err} ${err <= TOL ? '(exact)' : '(WRONG)'}`);
