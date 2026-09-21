// T-1-3 — The fixture generator is deterministic and complete (Step 1).
// Every §5.1 fixture name generates without error, and two generations of the
// same name yield identical commit hashes (for git-repo fixtures).

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { generateFixture, FIXTURE_NAMES } from '../fixtures/generate.js';

// The fixture set the plan's §5.1 fixes (its `test/fixtures/repos/<name>` rows),
// written as a literal so a drift between generate.ts and §5.1 — a fixture added
// to one but not the other — fails here instead of passing vacuously by
// iterating the generator's own keys (m2, first-round review). Kept sorted to
// match FIXTURE_NAMES (Object.keys(generators).sort()).
const PLAN_FIXTURE_NAMES: readonly string[] = [
  'answer-drift-clearly-off',
  'bar-two-candidates',
  'completeness-paired-change',
  'consequence-coupled-tests',
  'corpus-floor-29',
  'coupling-nonobvious',
  'dedup-read-set',
  'indexer-small',
  'language-config-added',
  'miner-hygiene',
  'orientation-mixed-shape',
  'over-threshold-file',
  'pristine-tree',
  'regret-no-inflate',
  'regret-true-positive',
  'repo-key-full',
  'repo-key-nongit',
  'repo-key-shallow',
  'repo-key-shallow-no-origin',
  'reuse-mixed-language',
  'reuse-observed-zero',
  'reuse-same-name-collision',
  'secret-injection',
  'seeded-facts',
  'subagent-delivery',
  'verification-covering-test',
  'warning-landmine',
];

function revListAll(dir: string): string | null {
  try {
    return execFileSync('git', ['rev-list', '--all'], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' },
    });
  } catch {
    return null; // not a git repository (e.g. repo-key-nongit)
  }
}

test('T-1-3: every fixture generates deterministically and without error', () => {
  // The generator set must be exactly the plan §5.1 fixture set — no more, no
  // fewer — so a fixture present in one place but not the other is caught here.
  assert.deepEqual([...FIXTURE_NAMES], [...PLAN_FIXTURE_NAMES], 'generator set != plan §5.1 fixture set');

  for (const name of FIXTURE_NAMES) {
    const a = mkdtempSync(path.join(tmpdir(), `fx-a-`));
    const b = mkdtempSync(path.join(tmpdir(), `fx-b-`));
    try {
      generateFixture(name, a);
      generateFixture(name, b);
      assert.ok(existsSync(a) && readdirSync(a).length > 0, `${name}: generated no content`);
      const ra = revListAll(a);
      const rb = revListAll(b);
      assert.equal(ra, rb, `${name}: commit hashes differ across two generations`);
      if (ra !== null) {
        assert.ok(ra.trim().length > 0, `${name}: git repo has no commits`);
      }
    } finally {
      rmSync(a, { recursive: true, force: true });
      rmSync(b, { recursive: true, force: true });
    }
  }
});
