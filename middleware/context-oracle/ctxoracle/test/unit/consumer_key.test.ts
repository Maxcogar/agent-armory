// T-6-4 — Consumer key encoding and role (reopened Step 6 build delta:
// `consumerKey`/`consumerRole`, AD-4, G23/G29). Real functions; no doubles.
// NOT asserted: storage.

import test from 'node:test';
import assert from 'node:assert/strict';
import { consumerKey, consumerRole } from '../../src/types/consumer.js';

test("T-6-4a: ('s1') and ('s1', '') are s1#main with role main", () => {
  assert.equal(consumerKey('s1'), 's1#main');
  assert.equal(consumerKey('s1', ''), 's1#main');
  assert.equal(consumerRole(consumerKey('s1')), 'main');
});

test("T-6-4b: ('s1', 'ag1') is s1#sub:ag1 with role subagent", () => {
  const k = consumerKey('s1', 'ag1');
  assert.equal(k, 's1#sub:ag1');
  assert.equal(consumerRole(k), 'subagent');
});

test("T-6-4c: a subagent whose agent id is 'main' is not the main agent", () => {
  const k = consumerKey('s1', 'main');
  assert.notEqual(k, consumerKey('s1'));
  assert.equal(consumerRole(k), 'subagent');
});

test("T-6-4d: the same agent id in two sessions is two consumers", () => {
  assert.notEqual(consumerKey('s2', 'ag1'), consumerKey('s1', 'ag1'));
});

test('T-6-4e: a malformed key throws, never silently reads as main', () => {
  // A well-formed key reads first, so the throw below is the malformed-key rule,
  // not an unbuilt function.
  assert.equal(consumerRole(consumerKey('s1')), 'main');
  assert.throws(() => consumerRole('garbage'));
});

// ---- Added by the 2026-09-26 independent build review. Step 6's build delta:
// `consumerRole(key)` "reads the part after the **first** `#` (`main` -> main,
// `sub:` prefix -> subagent; anything else throws, so a malformed key never
// silently reads as main)".
test("T-6-4f (review): an agent id containing '#' still keys a subagent (the role is read after the first '#')", () => {
  const k = consumerKey('s1', 'ag#main');
  assert.equal(k, 's1#sub:ag#main');
  assert.equal(consumerRole(k), 'subagent');
});

test("T-6-4g (review): a key whose role part merely starts with 'main' throws", () => {
  assert.throws(() => consumerRole('s1#mainx'));
  assert.throws(() => consumerRole('s1#bogus'));
});
