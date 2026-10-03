// T-6-1 — FAULT_CODES equals exactly the enumerated set (Step 6).
//
// Reopened 2026-09-26 (Step 6 build delta; T-6-1 Data revised): the expected
// value is the literal list of the delta — the 19 AD-17 codes (now including
// repo_not_bound, whisper_dropped_unverifiable, import_rejected, and the two
// reserved), store_busy, and the nine plan-named codes — 29 codes; the removed
// whisper_dropped_stale must be absent.
//
// The runtime half is the deepEqual below. The compile-time half ("a value
// assignable to FaultCode is outside the tuple") is the type-equality check
// between FaultCode and the tuple's element type: it holds by derivation and
// fails to compile if FaultCode is ever re-declared as a hand-written union.
// EXPECTED is deliberately typed `readonly string[]`, not `FaultCode[]`: typed
// as FaultCode[], a code the tuple does not yet hold would be a compile error
// that breaks the whole one-project build instead of failing this test.

import test from 'node:test';
import assert from 'node:assert/strict';
import { FAULT_CODES, type FaultCode } from '../../src/diag/fault_codes.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const FAULT_CODE_IS_THE_TUPLE: Equal<FaultCode, (typeof FAULT_CODES)[number]> = true;

const EXPECTED: readonly string[] = [
  // AD-17
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
  'repo_not_bound',
  'whisper_dropped_unverifiable',
  'import_rejected',
  'model_path_down',
  'missed_skill_block',
  // AD-26
  'store_busy',
  // plan-named
  'tuning_missing',
  'head_unresolved',
  'miner_unparsed_numstat',
  'reindex_locked',
  'frontend_parse_failed',
  'history_rewritten',
  'path_not_utf8',
  'index_path_only_oversize',
  'handler_exception',
];

test('T-6-1: FAULT_CODES is exactly the 29 enumerated codes, with no duplicates and no whisper_dropped_stale', () => {
  assert.equal(FAULT_CODE_IS_THE_TUPLE, true);
  assert.equal(EXPECTED.length, 29, 'the literal list holds 29 codes');
  assert.equal(new Set(FAULT_CODES).size, FAULT_CODES.length, 'no duplicate codes');
  assert.deepEqual([...FAULT_CODES].sort(), [...EXPECTED].sort());
  assert.equal((FAULT_CODES as readonly string[]).includes('whisper_dropped_stale'), false, 'the removed code is absent');
  // Sanity: an out-of-set string is not a member (in-set/out-of-set partition).
  assert.equal((FAULT_CODES as readonly string[]).includes('not_a_real_code'), false);
});
