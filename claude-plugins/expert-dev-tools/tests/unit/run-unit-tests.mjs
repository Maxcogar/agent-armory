// Unit tests for the standalone scripts (plan S12, the structural/unit test split D-P1).
// These modules are used as-is (no doubling), so they get genuine unit tests.
// Run: node tests/unit/run-unit-tests.mjs   (from the plugin root)

import { readFileSync, mkdtempSync, writeFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from '../../scripts/validate-ledger.mjs';
import { readOwnerTurns } from '../../scripts/extract-owner-turns.mjs';
import { decide, projectRoot, TERMINAL_PHASES, STALE_MS } from '../../hooks/continuation-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA = JSON.parse(readFileSync(join(HERE, '../../scripts/ledger.schema.json'), 'utf8'));

let failures = 0;
function check(label, cond) {
  if (!cond) failures++;
  console.log(`${cond ? 'ok  ' : 'FAIL'}  ${label}`);
}

// ---- T-U1: ledger validator ------------------------------------------------
const goodLedger = {
  revision: 3, task: 't', task_verbatim: 'the owner\'s request turn, word for word', phase: 'plan',
  artifact_index: [{ role: 'spec', path: 'docs/specs/x.md', sha256: 'a'.repeat(64), approved_by_owner: true, approval_segment: 1 }],
  gate_history: [{ gate: 'plan', round: 2, verdict: 'PASS', findings_count: 0, tokens: 1200 }],
  amendments: [], escalations: [{ gate_type: 'intent', segment: 1, resolved: true }],
  budget: { total_tokens: 5000, per_phase: { spec: 2000, plan: 3000 } },
  feedback_marker: { session_file: 'abc.jsonl', line: 42 },
  signature_history: [{
    signature: 's', description: 'd', responsible_component: 'agents/x.md',
    occurrences: [{ project: 'p', session_file: 'abc.jsonl', date: '2026-07-22', plugin_version: '0.1.0' }],
    state: 'corrected', correction: { artifact: 'agents/x.md', change: 'fix', fixed_in_version: '0.2.0', commit: null },
  }],
};
const V = (obj) => validate(obj, SCHEMA, SCHEMA, '$', []).length;
const clone = (o) => JSON.parse(JSON.stringify(o));
check('T-U1 accepts a valid ledger', V(goodLedger) === 0);
const withReview = clone(goodLedger);
withReview.artifact_index.push({ role: 'review', path: '.claude/expert/reviews/spec.md', sha256: 'b'.repeat(64), approved_by_owner: false, approval_segment: null });
check('T-U1 accepts a review-role artifact (RV)', V(withReview) === 0);
const bad = (mut) => { const c = clone(goodLedger); mut(c); return V(c) > 0; };
check('T-U1 rejects missing required field', bad((c) => delete c.phase));
check('T-U1 rejects wrong type', bad((c) => { c.revision = '3'; }));
check('T-U1 rejects bad enum', bad((c) => { c.phase = 'banana'; }));
check('T-U1 rejects below minimum', bad((c) => { c.revision = -1; }));
check('T-U1 rejects additional property', bad((c) => { c.foo = 1; }));
check('T-U1 rejects bad sha256 pattern', bad((c) => { c.artifact_index[0].sha256 = 'xyz'; }));
check('T-U1 rejects invented verdict (middle-verdict ban)', bad((c) => { c.gate_history[0].verdict = 'PASS WITH NOTES'; }));
check('T-U1 rejects empty occurrences (minItems)', bad((c) => { c.signature_history[0].occurrences = []; }));
check('T-U1 rejects non-integer revision', bad((c) => { c.revision = 1.5; }));
check('T-U1 rejects missing task_verbatim (verbatim capture is required)', bad((c) => delete c.task_verbatim));
check('T-U1 rejects empty task_verbatim (minLength)', bad((c) => { c.task_verbatim = ''; }));

// ---- T-U2: transcript reader ----------------------------------------------
const dir = mkdtempSync(join(tmpdir(), 'edt-tu2-'));
const A = [
  { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'ctx A' }] } },
  { type: 'user', message: { role: 'user', content: 'first' } },
  { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', content: 'r' }] } },
  { type: 'user', message: { role: 'user', content: 'second' } },
];
const B = [
  { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'ctx B' }] } },
  { type: 'user', message: { role: 'user', content: 'third' } },
];
writeFileSync(join(dir, 'a.jsonl'), A.map((o) => JSON.stringify(o)).join('\n'));
writeFileSync(join(dir, 'b.jsonl'), B.map((o) => JSON.stringify(o)).join('\n'));
utimesSync(join(dir, 'a.jsonl'), new Date(1e6), new Date(1e6));
utimesSync(join(dir, 'b.jsonl'), new Date(2e6), new Date(2e6));
const texts = (r) => r.turns.map((t) => t.text);

const full = readOwnerTurns(dir, { session_file: null, line: 0 });
check('T-U2 full sweep extracts owner turns, skips tool-results',
  JSON.stringify(texts(full)) === JSON.stringify(['first', 'second', 'third']));
check('T-U2 attaches preceding-assistant context',
  full.turns[0].context === 'ctx A' && full.turns[2].context === 'ctx B');
check('T-U2 advances the marker',
  JSON.stringify(full.marker) === JSON.stringify({ session_file: 'b.jsonl', line: 2 }));
check('T-U2 marker end-of-file-a yields only later turns',
  JSON.stringify(texts(readOwnerTurns(dir, { session_file: 'a.jsonl', line: 4 }))) === JSON.stringify(['third']));
check('T-U2 marker mid-file-a resumes correctly',
  JSON.stringify(texts(readOwnerTurns(dir, { session_file: 'a.jsonl', line: 2 }))) === JSON.stringify(['second', 'third']));
check('T-U2 marker at end yields nothing',
  texts(readOwnerTurns(dir, { session_file: 'b.jsonl', line: 2 })).length === 0);

// ---- T-U3: findings-shape guard (role-boundary correction C2) ---------------
// The guard is a pure predicate inside the workflow (not an importable module),
// so it is LIFTED from the source with its own extracted dependencies and
// EXECUTED — the gate is held demonstrably able to fail (the T-A2a-neg
// convention), never assumed from source text.
{
  const wfSrc = readFileSync(join(HERE, '../../workflows/expert-lifecycle.js'), 'utf8');
  const grab = (re) => (wfSrc.match(re) || [''])[0];
  const decl = (header) => {
    const i = wfSrc.indexOf(header);
    let depth = 0;
    for (let j = wfSrc.indexOf('{', i); j < wfSrc.length; j++) {
      if (wfSrc[j] === '{') depth++;
      else if (wfSrc[j] === '}' && --depth === 0) return wfSrc.slice(i, j + 1);
    }
    throw new Error(`unbalanced: ${header}`);
  };
  const lifted = new Function([
    grab(/const FINDING_BOUNDS =[^\n]*/),
    grab(/const FINDING_KEYS =[^\n]*/),
    grab(/const PRESCRIPTION_RE =[^\n]*/),
    decl('function findingShapeFault('),
    'return { findingShapeFault, FINDING_BOUNDS }',
  ].join('\n'))();
  const { findingShapeFault: fsf, FINDING_BOUNDS: FB } = lifted;
  const clean = { classification: 'Moderate', standard: 'ISO/IEC/IEEE 29148:2018 5.2.6', location: 'spec.md:10-20', premise_evidence: 'verified by Read at spec.md:10-20' };
  check('T-U3 a finding carrying a fix key faults (unknown_keys names the key)',
    (() => { const r = fsf([{ ...clean, fix: 'change line 10 to X' }]); return !!r && r.kind === 'unknown_keys' && r.keys[0] === 'fix'; })());
  check('T-U3 a recommendation key also faults (the class, not the one spelling)',
    (fsf([{ ...clean, recommendation: 'use Y instead' }]) || {}).kind === 'unknown_keys');
  check('T-U3 an over-bound premise_evidence faults (field_over_bound names field and bound)',
    (() => { const r = fsf([{ ...clean, premise_evidence: 'x'.repeat(FB.premise_evidence + 1) }]); return !!r && r.kind === 'field_over_bound' && r.field === 'premise_evidence' && r.bound === FB.premise_evidence; })());
  check('T-U3 a premise_evidence at exactly the bound passes (boundary value)',
    fsf([{ ...clean, premise_evidence: 'x'.repeat(FB.premise_evidence) }]) === null);
  check('T-U3 a prescription phrase inside premise_evidence faults',
    (fsf([{ ...clean, premise_evidence: 'the section should be changed to use the shared helper' }]) || {}).kind === 'prescription_in_evidence');
  check('T-U3 a non-string field faults (fail-closed on type, not just length)',
    (fsf([{ ...clean, standard: 42 }]) || {}).kind === 'field_over_bound');
  check('T-U3 a clean finding passes', fsf([clean]) === null);
  check('T-U3 an empty findings array passes (a clean PASS round is not faulted)', fsf([]) === null);
}

// ---- T-U4: continuation-gate decision function (round-1 F1/F2) --------------
// `decide` is pure and exported, so the allow/block axes get direct unit coverage
// rather than only the spawned end-to-end cases in the structural tier. Every case
// here is one way a lifecycle can fail to be IN FLIGHT — the property the gate must
// establish before it blocks, and the one the shipped 0.4.0 version did not test.
{
  const liveLedger = (over = {}) => JSON.stringify({
    revision: 4, task: 't', task_verbatim: 'the owner\'s request turn, word for word',
    phase: 'implement', artifact_index: [], gate_history: [], amendments: [],
    escalations: [{ gate_type: 'spec_traceable', segment: 1, resolved: true }],
    budget: { total_tokens: 0 }, feedback_marker: { session_file: null, line: 0 },
    signature_history: [], ...over,
  });
  const NOW = 1_800_000_000_000;
  const code = (text, mtime = NOW) => decide({ hook_event_name: 'Stop' }, text, mtime, NOW).code;

  check('T-U4 a fresh, schema-valid, mid-phase ledger with no open gate BLOCKS (exit 2)',
    code(liveLedger()) === 2);
  check('T-U4 stop_hook_active allows regardless of the ledger (the API loop guard)',
    decide({ stop_hook_active: true }, liveLedger(), NOW, NOW).code === 0);
  check('T-U4 no ledger allows (an ordinary session is never governed)',
    decide({}, null, null, NOW).code === 0);
  check('T-U4 an unresolved escalation allows (a legitimate §3.4 halt still halts)',
    code(liveLedger({ escalations: [{ gate_type: 'intent', segment: 2 }] })) === 0);
  // Named literally, NOT looped over TERMINAL_PHASES: a case list derived from the
  // constant under test shrinks with it, so widening the set would silently widen the
  // test too and the exemption would stop being observed.
  check('T-U4 phase \'complete\' allows (the workflow\'s terminal write)',
    code(liveLedger({ phase: 'complete' })) === 0);
  // Round-2 F1: 'closeout' is where the report, the commit, and the PR are still ahead
  // of the agent (workflows/expert-lifecycle.js @ `Closeout: write the final report against the spec`,
  // with workflows/expert-lifecycle.js @ `delta.phase = 'complete'` written only after
  // that dispatch RETURNS). Exempting it by name made one whole phase
  // permanently unguarded against the defect this gate answers, and bought nothing —
  // the real ledger that motivated the exemption is allowed twice over by the schema
  // and staleness conditions, which rest on evidence rather than on a phase name.
  check('T-U4 phase \'closeout\' BLOCKS when fresh and ungated — the report, commit and PR have not happened yet',
    code(liveLedger({ phase: 'closeout' })) === 2);
  check('T-U4 TERMINAL_PHASES is exactly [\'complete\'] (literal pin)',
    TERMINAL_PHASES.slice().sort().join(',') === 'complete');
  check('T-U4 TERMINAL_PHASES contains \'complete\' and specifically NOT \'closeout\' (explicit membership, independent of the literal pin)',
    TERMINAL_PHASES.includes('complete') && !TERMINAL_PHASES.includes('closeout'));
  check('T-U4 every other schema phase still blocks when fresh and ungated (the gate did not become inert)',
    ['intake', 'spec', 'architecture', 'plan', 'implement', 'implementation_review', 'ground_truth', 'closeout']
      .every((p) => code(liveLedger({ phase: p })) === 2));
  // The closeout ledger the exemption was added FOR is still allowed — by the schema
  // and staleness axes, which is the point: evidence, not a phase name.
  check('T-U4 an abandoned closeout still allows via the staleness axis (the real case never needed the exemption)',
    code(liveLedger({ phase: 'closeout' }), NOW - STALE_MS - 1000) === 0);
  check('T-U4 a schema-invalid closeout still allows via the unresumable axis',
    (() => { const l = JSON.parse(liveLedger({ phase: 'closeout' })); delete l.task_verbatim; const v = decide({}, JSON.stringify(l), NOW, NOW); return v.code === 0 && /not resumable/.test(v.note); })());
  check('T-U4 a ledger missing task_verbatim allows — it is schema-invalid, so `/expert resume` could not run it either',
    (() => { const l = JSON.parse(liveLedger()); delete l.task_verbatim; const v = decide({}, JSON.stringify(l), NOW, NOW); return v.code === 0 && /not resumable/.test(v.note); })());
  check('T-U4 a ledger just inside the activity window still blocks (boundary value)',
    code(liveLedger(), NOW - STALE_MS + 1000) === 2);
  check('T-U4 a ledger just past the activity window allows (boundary value)',
    code(liveLedger(), NOW - STALE_MS - 1000) === 0);
  check('T-U4 an unparseable ledger allows with a note (fail open, never a stop loop)',
    (() => { const v = decide({}, '{not json', NOW, NOW); return v.code === 0 && /unparseable/.test(v.note); })());
  check('T-U4 the block note names the phase and routes to /expert resume',
    (() => { const v = decide({}, liveLedger(), NOW, NOW); return /implement/.test(v.note) && /\/expert resume/.test(v.note); })());

  // F1: the platform documents cwd and CLAUDE_PROJECT_DIR as diverging, and the ledger
  // lives at the project root. Both directions, plus the no-source case.
  check('T-U4 projectRoot prefers CLAUDE_PROJECT_DIR over the payload cwd',
    projectRoot({ cwd: '/worktree' }, { CLAUDE_PROJECT_DIR: '/project' }) === '/project');
  check('T-U4 projectRoot falls back to cwd when CLAUDE_PROJECT_DIR is unset or empty',
    projectRoot({ cwd: '/worktree' }, {}) === '/worktree' &&
    projectRoot({ cwd: '/worktree' }, { CLAUDE_PROJECT_DIR: '' }) === '/worktree');
  check('T-U4 projectRoot yields null when neither source names a root (no ledger is then read)',
    projectRoot({}, {}) === null && projectRoot(null, {}) === null);
}

console.log(failures ? `\nUNIT TESTS FAILED (${failures})` : '\nUNIT TESTS PASSED');
process.exit(failures ? 1 : 0);
