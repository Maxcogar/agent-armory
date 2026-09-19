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
