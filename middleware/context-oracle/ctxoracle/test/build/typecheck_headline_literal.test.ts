// T-6-3 — A non-literal headline word fails to compile (reopened Step 6 build
// delta: `lit`'s literal-only parameter type, G24). NOT asserted: template-literal
// arguments (T-19-3's scan).

import test from 'node:test';
import assert from 'node:assert/strict';
import { compileFixture } from './tsc_fixture.js';

test('T-6-3: lit(s) with s: string fails to compile with TS2345', () => {
  const { code, output } = compileFixture('test/build/fixtures/headline_nonliteral.ts');
  assert.notEqual(code, 0, `the fixture must not compile; output:\n${output}`);
  assert.match(output, /TS2345/);
});
