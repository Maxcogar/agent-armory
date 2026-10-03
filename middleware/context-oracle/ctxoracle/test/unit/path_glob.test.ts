// T-14-4 — The test-path glob dialect (Step 14, AD-12's stated dialect).
//
// Unit; the real `matchesTestPattern`; no doubles. Decision table: every
// seeded `lexicon.test_path_patterns` member × the ten paths the spec names,
// plus the five dialect cells (`*` within one segment, `**` zero or more whole
// segments, `?` one character within a segment). Expected values follow from
// the dialect as Step 14 states it: anchored at the repository root over the
// POSIX path; `*` matches any characters within one segment; `**` matches zero
// or more whole segments; `?` matches one character within a segment.

import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesTestPattern } from '../../src/index/path_glob.js';
import { LIST_SEEDS } from '../../src/stores/dao/tuning_seeds.js';

const PATHS = [
  'src/a.test.ts',
  'a.spec.js',
  'x/test_y.py',
  'y_test.go',
  'a/__tests__/b.js',
  'test/u.js',
  'tests/v.py',
  'src/test/w.js',
  'atest.ts',
  'test_y.pyc',
] as const;

// pattern -> the paths (of PATHS) it matches under the dialect; every other cell is false.
const TABLE: Record<string, readonly string[]> = {
  '**/*.test.*': ['src/a.test.ts'],
  '**/*.spec.*': ['a.spec.js'],
  '**/test_*.py': ['x/test_y.py'],
  '**/*_test.go': ['y_test.go'],
  '**/__tests__/**': ['a/__tests__/b.js'],
  'test/**': ['test/u.js'], // root-anchored: src/test/w.js is false
  'tests/**': ['tests/v.py'],
};

test('T-14-4: every seeded pattern × every named path matches per the dialect', () => {
  // Precondition: the table's rows are exactly the seeded patterns (Step 12's list).
  const seeded = LIST_SEEDS.find((s) => s.key === 'lexicon.test_path_patterns');
  assert.ok(seeded !== undefined, 'lexicon.test_path_patterns is a seeded list');
  assert.deepEqual([...seeded.values].sort(), Object.keys(TABLE).sort());
  const wrong: string[] = [];
  for (const [pattern, hits] of Object.entries(TABLE)) {
    for (const p of PATHS) {
      const expected = hits.includes(p);
      const got = matchesTestPattern(p, pattern);
      if (got !== expected) wrong.push(`${pattern} vs ${p}: expected ${expected}, got ${got}`);
    }
  }
  assert.deepEqual(wrong, []);
});

test('T-14-4: the dialect cells for *, ** and ?', () => {
  const cells: [string, string, boolean][] = [
    ['a/*/c', 'a/b/c', true],
    ['a/*/c', 'a/b/d/c', false],
    ['a/**/c', 'a/c', true],
    ['a?c', 'abc', true],
    ['a?c', 'a/c', false],
  ];
  const wrong = cells
    .map(([pattern, p, expected]) => ({ pattern, p, expected, got: matchesTestPattern(p, pattern) }))
    .filter((c) => c.got !== c.expected)
    .map((c) => `${c.pattern} vs ${c.p}: expected ${c.expected}, got ${c.got}`);
  assert.deepEqual(wrong, []);
});
