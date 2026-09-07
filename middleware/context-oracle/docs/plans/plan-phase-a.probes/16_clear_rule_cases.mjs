// Claim (Step 23, T-23-2, D-plan-24): AD-9's clear rule as two predicates on
// the turn — after stripping tool noise and fences, SUBSTANCE: the remaining
// text is at least the floor (2); DEFERRAL: a deferral-stoplist phrase is
// present and every token outside the phrases is a deferral-filler word; the
// turn clears iff substance and not deferral — over the spec's own examples
// (FR-B1, FR-B5), the reviewer-supplied direct answers and deferral inputs, and
// the generated phrase × filler class. Reference implementation of the rule
// Step 23 states; the two seeded lists of Step 12 and no other vocabulary.
const DEFER = ["i'll get to that", "i will get to that", "i'll come back to", "i'll get back to you", "will look into that", "first let me", "before i answer"];
const FILLER = ["later", "soon", "now", "next", "then", "first", "shortly", "afterwards", "momentarily", "moment", "sec", "second", "minute", "bit", "while", "i", "we", "you", "it", "that", "this", "them", "one", "a", "an", "the", "on", "to", "in", "for", "not", "yet", "just"];
function clears(text, floor = 2) {
  const stripped = text.replace(/```[\s\S]*?```/g, ' ').replace(/<tool[\s\S]*?<\/tool>/g, ' ');
  const low = stripped.toLowerCase();
  const substance = low.replace(/[\s.,;:!?—\-()'"]+/g, '').length >= floor;
  let rest = low, phrase = false;
  for (const d of DEFER) if (rest.includes(d)) { phrase = true; rest = rest.split(d).join(' '); }
  const tokens = rest.split(/[^a-z']+/).filter(Boolean);
  const deferral = phrase && tokens.every(t => FILLER.includes(t));
  const ok = substance && !deferral;
  return { clears: ok, reason: ok ? undefined : (deferral ? 'deferral_only' : 'below_length_floor') };
}
const cases = [
  // spec examples and boundaries
  ["", false, 'below_length_floor'], [".", false, 'below_length_floor'], ["No.", true], ["Yes.", true], ["Yes, line 12.", true],
  ["I'll get to that.", false, 'deferral_only'], ["I'll get to that!", false, 'deferral_only'],
  // direct answers (FR-B5: err toward clearing)
  ["Sure.", true], ["Ok.", true], ["Right.", true], ["Understood.", true], ["Got it, will do.", true],
  ["Yes, absolutely.", true], ["Sure, it is safe to rename.", true],
  ["Because the fixture is written later than the assertion reads it.", true],
  ["The deploy fails because the migration runs later than the seed.", true],
  ["First let me check: the null check is not the cause.", true],
  ["It is safe; the helper is only used in tests.", true],
  // deferral with an answer beside it, in either order
  ["I'll get to that. The null check does not fix it, see line 12.", true],
  ["No — the null check does not fix it, see line 12, though I'll get to the rest later.", true],
  // the recognized phrase with nothing but filler beside it (FR-B1's class; the round-5 collapse-hunt's inputs)
  ["I'll get to that later.", false, 'deferral_only'], ["I'll get to that soon.", false, 'deferral_only'], ["I'll get to that next.", false, 'deferral_only'],
  ["I'll come back to it.", false, 'deferral_only'], ["I'll come back to that.", false, 'deferral_only'],
  ["I'll get back to you on that.", false, 'deferral_only'], ["I'll get back to you.", false, 'deferral_only'],
  ["Will look into that.", false, 'deferral_only'], ["I will look into that.", false, 'deferral_only'],
  ["Before I answer, one sec.", false, 'deferral_only'], ["I'll get to that, I'll get to that.", false, 'deferral_only'],
  // dressed or plan-stating dodges: a content word beside the phrase clears (measured at exit as escapes; the human channel corrects)
  ["Sure, I'll get to that after the refactor.", true], ["I'll get to that after the refactor.", true], ["First let me finish this.", true],
  // no recognized phrase: clears (the under-fire the exit run measures; never an acknowledgement vocabulary)
  ["Later.", true], ["Not now.", true], ["One moment.", true], ["Let me look into that first.", true], ["Hmm.", true], ["Hm", true],
  // noise-only and fence cases
  ["```js\nx\n```\nNo.", true], ["<tool>noise</tool>", false, 'below_length_floor'],
];
let bad = 0;
for (const [text, want, reason] of cases) {
  const r = clears(text);
  const good = r.clears === want && (reason === undefined || r.reason === reason);
  if (!good) bad++;
  console.log((good ? 'ok  ' : 'BAD ') + JSON.stringify(text) + ' -> ' + r.clears + (r.reason ? ' (' + r.reason + ')' : ''));
}
// the generated class: every phrase × every filler word × {after, before} must hold; each with one content word must clear
const cap = s => s[0].toUpperCase() + s.slice(1);
let holds = 0, holdBad = 0, clearsN = 0, clearBad = 0;
for (const p of DEFER) for (const f of FILLER) for (const t of [`${cap(p)} ${f}.`, `${cap(f)}, ${p}.`]) {
  const r = clears(t); holds++; if (r.clears || r.reason !== 'deferral_only') { holdBad++; console.log('BAD ' + JSON.stringify(t) + ' -> ' + r.clears + ' (' + r.reason + ')'); }
  const c = clears(t.replace(/\.$/, ' refactor.')); clearsN++; if (!c.clears) { clearBad++; console.log('BAD ' + JSON.stringify(t.replace(/\.$/, ' refactor.')) + ' -> false (' + c.reason + ')'); }
}
console.log(`generated: ${DEFER.length} phrases x ${FILLER.length} filler words x 2 placements = ${holds} hold cases, ${holds - holdBad} ok; ${clearsN} clear cases, ${clearsN - clearBad} ok`);
bad += holdBad + clearBad;
if (bad) { console.log(bad + ' case(s) differ'); process.exit(1); }
