// T-2-1 — Runtime floor rejects below 22.16.0 and accepts at/above it, compared
// as SemVer (Step 2). The version is a stub parameter because one Node process
// cannot vary its own version. Boundary values plus the string-prefix trap
// "22.9.0" (which sorts after "22.16.0" as a string but is below it numerically).

import test from 'node:test';
import assert from 'node:assert/strict';
import { assertRuntime } from '../../src/util/env.js';

test('T-2-1: below-floor versions throw, at/above pass, "22.9.0" is rejected', () => {
  for (const below of ['22.15.9', '22.9.0']) {
    assert.throws(
      () => assertRuntime(below),
      (err: unknown) => err instanceof Error && err.message.includes(below) && err.message.includes('22.16.0'),
      `${below} must be rejected with a message naming the current and required versions`
    );
  }
  for (const ok of ['22.16.0', '22.16.1', '23.0.0']) {
    assert.doesNotThrow(() => assertRuntime(ok), `${ok} must be accepted`);
  }
});
