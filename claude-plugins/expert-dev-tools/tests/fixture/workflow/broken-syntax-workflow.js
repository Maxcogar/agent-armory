// NEGATIVE FIXTURE — deliberately unparseable. Do not "fix" it.
// tests/structural/check-structure.mjs asserts T-A2a's oracle REJECTS this file.
// If this file ever parses, the syntax gate has stopped being able to fail and
// the class F-2 names has returned. The defect is the unescaped apostrophe below,
// the exact shape that shipped green through `node --check` at implementation
// round 1 (docs/reviews/implementation-round-01.md, F-1/F-2).
export const meta = { name: 'broken-syntax-workflow' }
function phase() { return 1 }
const claim = 'The authoring skill's process rules are not the standard'
return phase()
