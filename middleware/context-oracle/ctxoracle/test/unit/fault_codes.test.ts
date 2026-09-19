// T-6-1 — FAULT_CODES equals exactly the enumerated set (Step 6). The expected
// list is typed `FaultCode[]`, so the compile-time half fails if the union and
// the tuple diverge; the runtime deepEqual catches a missing or extra code.

import test from 'node:test';
import assert from 'node:assert/strict';
import { FAULT_CODES, type FaultCode } from '../../src/diag/fault_codes.js';

// Typed as FaultCode[]: a code here that is not in the union fails to compile.
const EXPECTED: FaultCode[] = [
  'hooks_not_firing',
  'latency_breach',
  'store_corrupt',
  'index_stale',
  'produced_but_undelivered',
  'deny_after_answer_lag',
  'deny_despite_answer_text',
  'deny_loop',
  'deny_bypass_suspect',
  'catchup_incomplete',
  'intake_invalidated',
  'rebuild_recovered_nothing',
  'transcript_layout_changed',
  'unrecognized_user_entry',
  'model_path_down',
  'missed_skill_block',
  'store_busy',
  'whisper_dropped_stale',
  'tuning_missing',
  'head_unresolved',
  'miner_unparsed_numstat',
  'reindex_locked',
  'frontend_parse_failed',
];

test('T-6-1: FAULT_CODES is exactly the enumerated set, with no duplicates', () => {
  assert.equal(new Set(FAULT_CODES).size, FAULT_CODES.length, 'no duplicate codes');
  assert.deepEqual([...FAULT_CODES].sort(), [...EXPECTED].sort());
  // Sanity: an out-of-set string is not a member (in-set/out-of-set partition).
  assert.equal((FAULT_CODES as readonly string[]).includes('not_a_real_code'), false);
});
