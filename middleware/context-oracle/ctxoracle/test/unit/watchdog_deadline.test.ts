// T-10-4 — the deadline fires at exactly `ms` under an injected clock, and
// isInternal recognizes the guard variable (Step 10). Fake clock (a working
// now() the test advances); nothing else doubled.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeadline, DeadlineExceeded } from '../../src/hook/watchdog.js';
import { isInternal } from '../../src/hook/guard.js';

test('T-10-4: createDeadline reports not-fired at ms-1 and fired at ms', () => {
  let clock = 0;
  const d = createDeadline({ ms: 2500, now: () => clock });

  clock = 0;
  assert.doesNotThrow(() => d.check());
  clock = 2499;
  assert.doesNotThrow(() => d.check());
  assert.equal(d.elapsed(), 2499);
  clock = 2500;
  assert.throws(() => d.check(), DeadlineExceeded);
  clock = 2501;
  assert.throws(() => d.check(), DeadlineExceeded);
});

test('T-10-4: isInternal is true only for "1"', () => {
  assert.equal(isInternal({ CTXORACLE_INTERNAL: '1' }), true);
  assert.equal(isInternal({}), false); // unset
  assert.equal(isInternal({ CTXORACLE_INTERNAL: '' }), false);
  assert.equal(isInternal({ CTXORACLE_INTERNAL: '0' }), false);
});
