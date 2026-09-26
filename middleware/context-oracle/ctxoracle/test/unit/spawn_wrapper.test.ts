// T-5-2 — The spawn wrapper always sets the recursion guard and, on
// `scrub: true`, drops exactly the session-identity set while keeping every
// other variable (Step 5, AD-21). Real child process: `node -e` prints its
// environment as JSON.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { oracleExecFileSync, oracleRunSync, SCRUBBED_ENV } from '../../src/util/spawn.js';

const PRINT_ENV = 'process.stdout.write(JSON.stringify(process.env))';

function childEnv(base: NodeJS.ProcessEnv, cwd: string, scrub: boolean): Record<string, string> {
  const out = oracleExecFileSync(process.execPath, ['-e', PRINT_ENV], { cwd, env: base, scrub });
  return JSON.parse(out) as Record<string, string>;
}

test('T-5-2: guard is always set; scrub removes exactly SCRUBBED_ENV, keeps the rest', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'ctxoracle-spawn-'));
  try {
    // Base env: every scrub member set, plus routing/non-member vars.
    const base: NodeJS.ProcessEnv = {
      PATH: process.env.PATH ?? '',
      ANTHROPIC_BASE_URL: 'http://x',
      CLAUDE_CODE_USER_EMAIL: 'y',
    };
    for (const k of SCRUBBED_ENV) base[k] = '1';

    // scrub: false — every variable reaches the child, and the guard is added.
    const kept = childEnv(base, cwd, false);
    assert.equal(kept.CTXORACLE_INTERNAL, '1', 'guard set without scrub');
    for (const k of SCRUBBED_ENV) assert.equal(kept[k], '1', `${k} inherited without scrub`);
    assert.equal(kept.ANTHROPIC_BASE_URL, 'http://x');
    assert.equal(kept.CLAUDE_CODE_USER_EMAIL, 'y');

    // scrub: true — only the session-identity set is removed.
    const scrubbed = childEnv(base, cwd, true);
    assert.equal(scrubbed.CTXORACLE_INTERNAL, '1', 'guard set under scrub');
    for (const k of SCRUBBED_ENV) assert.equal(scrubbed[k], undefined, `${k} scrubbed`);
    assert.equal(scrubbed.ANTHROPIC_BASE_URL, 'http://x', 'routing var kept under scrub');
    assert.equal(scrubbed.CLAUDE_CODE_USER_EMAIL, 'y', 'non-member kept under scrub');
    assert.ok((scrubbed.PATH ?? '').length > 0, 'PATH kept under scrub');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

// T-5-5 — `oracleRunSync` returns raw bytes and a non-zero status (reopened
// Step 5 build delta, G7). Real `node -e` children; no doubles. NOT asserted:
// timing.
test('T-5-5a: a child writing 0xff 0x00 0x41 and exiting 1 returns those bytes and status 1 without throwing', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'ctxoracle-runsync-'));
  try {
    const r = oracleRunSync(
      process.execPath,
      ['-e', 'process.stdout.write(Buffer.from([0xff, 0x00, 0x41])); process.exitCode = 1;'],
      { cwd }
    );
    assert.equal(r.status, 1);
    assert.ok(Buffer.isBuffer(r.stdout), 'stdout is raw bytes');
    assert.deepEqual([...r.stdout], [0xff, 0x00, 0x41]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('T-5-5b: a child echoing its stdin returns exactly the input bytes', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'ctxoracle-runsync-'));
  try {
    const input = Buffer.from('a\0b', 'binary');
    const r = oracleRunSync(process.execPath, ['-e', 'process.stdin.pipe(process.stdout)'], { cwd, input });
    assert.equal(r.status, 0);
    assert.ok(Buffer.isBuffer(r.stdout));
    assert.deepEqual([...r.stdout], [...input]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('T-5-5c: a child started by oracleRunSync carries CTXORACLE_INTERNAL=1', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'ctxoracle-runsync-'));
  try {
    const r = oracleRunSync(
      process.execPath,
      ['-e', "process.stdout.write(process.env.CTXORACLE_INTERNAL ?? '<unset>')"],
      { cwd }
    );
    assert.equal(r.stdout.toString('utf8'), '1');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
