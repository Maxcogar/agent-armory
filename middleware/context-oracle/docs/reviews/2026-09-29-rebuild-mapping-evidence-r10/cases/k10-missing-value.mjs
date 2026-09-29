// k10-missing-value.mjs <recompute.mjs> — what the round-9 model does with a store that holds
// weighted commits and lacks one mined-with value (the case-1 trigger R9-1 removed from AD-13).
import path from 'node:path';
const { DAY, build, history, pass, freshMine, maxRelErr, meta, faults } = await import(path.resolve(process.argv[2]));
const T0 = 1790000000;
const H = history({ n: 200, newest: T0 }), NEW = history({ n: 50, newest: T0 + 10 * DAY }).map((c, i) => ({ ...c, hash: `n${i}` }));
for (const k of ['mined_half_life_days', 'weight_epoch', 'mined_fix_lexicon_digest']) {
  const d = build(); pass(d, { refTs: T0, h: 365, commits: H });
  d.prepare('DELETE FROM meta WHERE key = ?').run(k);
  let out;
  try { const t = pass(d, { refTs: T0 + 10 * DAY, h: 365, commits: [...H, ...NEW] }); out = `pass completed in ${t} transactions`; } catch (e) { out = `pass threw: ${e.message}`; }
  const nan = d.prepare('SELECT count(*) n FROM commits WHERE weight IS NULL OR weight <> weight').get().n;
  const err = maxRelErr(d, freshMine([...H, ...NEW], T0 + 10 * DAY, 365));
  console.log(`${k} deleted: ${out}; commits with a NULL or NaN weight ${nan}; weight_epoch now ${JSON.stringify(meta(d, 'weight_epoch'))}; records ${JSON.stringify(faults(d).map((f) => f.code))}; max relative ratio error vs a fresh mine ${Number.isNaN(err) ? 'NaN' : err.toExponential(3)}`);
}
