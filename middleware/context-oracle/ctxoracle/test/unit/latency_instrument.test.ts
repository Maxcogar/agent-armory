// T-10-2 — the deadline's elapsed() tracks real time within ±5 ms of an
// independent performance.now() delta across a 50 ms span (Step 10). Real clock.

import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { setTimeout as sleep } from 'node:timers/promises';
import { createDeadline } from '../../src/hook/watchdog.js';

test('T-10-2: recorded latency is within ±5 ms of the observed delta (5 runs)', async () => {
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    const d = createDeadline({ ms: 10_000 });
    await sleep(50);
    const recorded = d.elapsed();
    const actual = performance.now() - t0;
    assert.ok(
      Math.abs(recorded - actual) <= 5,
      `run ${i}: recorded=${recorded.toFixed(2)} actual=${actual.toFixed(2)}`
    );
  }
});
