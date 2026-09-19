// T-11-5 — the Trust type rejects an out-of-set value at compile time (Step 11).

import test from 'node:test';
import assert from 'node:assert/strict';
import { compileFixture } from './tsc_fixture.js';

test('T-11-5: assigning an out-of-set value to a Trust variable fails to compile', () => {
  const { code, output } = compileFixture('test/build/fixtures/trust_out_of_set.ts');
  assert.notEqual(code, 0, `the fixture must not compile; output:\n${output}`);
  assert.match(output, /Trust|trusted|assignable/i);
});
