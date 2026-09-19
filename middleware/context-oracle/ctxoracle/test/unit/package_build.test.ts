// T-1-1 — Package skeleton builds cleanly (Step 1).
//
// Copies the source-only checkout (no node_modules, no dist) into a temp dir,
// runs `npm ci` then `npm run build`, and asserts: the lockfile is present, no
// preinstall/install/postinstall lifecycle script runs, and the build produces
// dist/src/cli/dispatch.js and dist/test/**.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

test('T-1-1: npm ci + npm run build succeed, no install-phase script, dist artifacts present', () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'ctxoracle-build-'));
  try {
    for (const item of ['package.json', 'package-lock.json', 'tsconfig.json', 'src', 'scripts', 'test']) {
      cpSync(path.join(packageRoot, item), path.join(tmp, item), { recursive: true });
    }
    assert.ok(existsSync(path.join(tmp, 'package-lock.json')), 'package-lock.json must be in the checkout');

    const ci = spawnSync('npm', ['ci', '--ignore-scripts=false', '--loglevel=silly'], {
      cwd: tmp,
      encoding: 'utf8',
    });
    assert.equal(ci.status, 0, `npm ci failed:\n${ci.stdout ?? ''}\n${ci.stderr ?? ''}`);
    const ciLog = `${ci.stdout ?? ''}\n${ci.stderr ?? ''}`;
    assert.doesNotMatch(
      ciLog,
      /npm \S+ run \S+ (preinstall|install|postinstall)\b/i,
      'no preinstall/install/postinstall lifecycle script should run during npm ci'
    );

    const build = spawnSync('npm', ['run', 'build'], { cwd: tmp, encoding: 'utf8' });
    assert.equal(build.status, 0, `npm run build failed:\n${build.stdout ?? ''}\n${build.stderr ?? ''}`);

    assert.ok(existsSync(path.join(tmp, 'dist', 'src', 'cli', 'dispatch.js')), 'dist/src/cli/dispatch.js must exist');
    assert.ok(existsSync(path.join(tmp, 'dist', 'test')), 'dist/test/** must exist');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
