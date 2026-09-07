// Claim (Step 23, T23-2, D-plan-24): the clear-recognizer rule — strip tool noise and fences, split sentences into clauses, drop deferral clauses and acknowledgement-only clauses, clear when the surviving text is ≥ the floor (2) — yields the T23-2 case table. Reference implementation of the stated rule; the seeded lists are Step 12's.
const DEFER = ["i'll get to that","i will get to that","i'll come back to","i'll get back to you","will look into that","later","in a moment","first let me","before i answer"];
const ACK = new Set(["ok","okay","sure","got it","will do","understood","noted","right","alright","gotcha"]);
function clears(text, floor = 2) {
  const stripped = text.replace(/```[\s\S]*?```/g, ' ').replace(/<tool[\s\S]*?<\/tool>/g, ' ');
  let content = '';
  for (const s of stripped.split(/(?<=[.!?])\s+|\n+/)) for (const c of s.split(/[,;:—]|\s-\s/)) {
    const low = c.trim().toLowerCase().replace(/[.!?]+$/, '').trim();
    if (!low || DEFER.some(d => low.includes(d)) || ACK.has(low)) continue; content += low; }
  return content.length >= floor;
}
const cases = [["", false], [".", false], ["No.", true], ["Yes.", true], ["Yes, line 12.", true], ["I'll get to that.", false], ["Sure, I'll get to that after the refactor.", false], ["I'll get to that. The null check does not fix it, see line 12.", true], ["No — the null check does not fix it, see line 12, though I'll get to the rest later.", true], ["Ok.", false], ["Got it, will do.", false], ["```js\nx\n```\nNo.", true], ["<tool>noise</tool>", false]];
for (const [t, exp] of cases) console.log(`${clears(t) === exp ? 'ok ' : 'BAD'} ${JSON.stringify(t)} -> ${clears(t)}`);
