// Unit tests for the standalone scripts (plan S12, two-tier test architecture D-P1).
// These modules are used as-is (no doubling), so they get genuine unit tests.
// Run: node tests/unit/run-unit-tests.mjs   (from the plugin root)

import { readFileSync, mkdtempSync, writeFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from '../../scripts/validate-ledger.mjs';
import { readOwnerTurns } from '../../scripts/extract-owner-turns.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA = JSON.parse(readFileSync(join(HERE, '../../scripts/ledger.schema.json'), 'utf8'));

let failures = 0;
function check(label, cond) {
  if (!cond) failures++;
  console.log(`${cond ? 'ok  ' : 'FAIL'}  ${label}`);
}

// ---- T-U1: ledger validator ------------------------------------------------
const goodLedger = {
  revision: 3, task: 't', phase: 'plan',
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

console.log(failures ? `\nUNIT TESTS FAILED (${failures})` : '\nUNIT TESTS PASSED');
process.exit(failures ? 1 : 0);
