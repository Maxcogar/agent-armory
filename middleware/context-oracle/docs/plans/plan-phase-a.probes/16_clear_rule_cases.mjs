// Claim (Step 23, T-23-2, D-plan-24): AD-9's clear rule with "content-free
// deferral" operationalized as phrase-strip-then-floor — strip tool noise and
// fences, remove every deferral-stoplist phrase, and clear when the remaining
// text is at least the floor (2) — over the spec's own examples (FR-B1,
// FR-B5), the reviewer-supplied direct answers, and the deferral cases.
// Reference implementation of the rule Step 23 states; no other vocabulary.
const DEFER = ["i'll get to that", "i will get to that", "i'll come back to", "i'll get back to you", "will look into that", "first let me", "before i answer"];
function clears(text, floor = 2) {
  const stripped = text.replace(/```[\s\S]*?```/g, ' ').replace(/<tool[\s\S]*?<\/tool>/g, ' ');
  let low = stripped.toLowerCase();
  let deferral = false;
  for (const d of DEFER) if (low.includes(d)) { deferral = true; low = low.split(d).join(' '); }
  const content = low.replace(/[\s.,;:!?—\-()'"]+/g, '');
  const ok = content.length >= floor;
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
  // dressed dodges: the skeleton clears them (measured at exit as escapes; the human channel corrects)
  ["Sure, I'll get to that after the refactor.", true],
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
if (bad) { console.log(bad + ' case(s) differ'); process.exit(1); }
