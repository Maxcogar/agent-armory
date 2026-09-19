// T-11-4 — isSuspect leaves normal prose alone (Step 11).

import test from 'node:test';
import assert from 'node:assert/strict';
import { isSuspect } from '../../src/security/injection.js';

const prose: { name: string; input: string }[] = [
  {
    name: 'README paragraph',
    input:
      'This library provides a small assistant for building CLIs. The model of computation is a simple pipeline; see the docs for details.',
  },
  { name: 'code comment', input: '// Parse the response and return the token count; the caller ignores whitespace.' },
  { name: 'commit message', input: 'Ignore generated lockfiles in the linter and update the CI matrix.' },
];

test('T-11-4: normal prose is not flagged', () => {
  for (const p of prose) {
    assert.equal(isSuspect(p.input), false, `${p.name} should not be flagged`);
  }
});
