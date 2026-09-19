// T-9-2 — provenance is required at compile time (Step 9). The must-fail fixture
// calls each knowledge DAO's write method without provenance; tsc must reject it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { compileFixture } from './tsc_fixture.js';

test('T-9-2: a knowledge write without provenance fails to compile', () => {
  const { code, output } = compileFixture('test/build/fixtures/missing_provenance.ts');
  assert.notEqual(code, 0, `the fixture must not compile; output:\n${output}`);
  // The failures are provenance-related (a missing `prov` property or a missing
  // argument), not some unrelated breakage.
  assert.match(output, /prov|argument/i);
});
