// T-4-1 — ensureLayout creates 0o700 directories and reports (never alters)
// pre-existing loose-mode directories (Step 4). Real filesystem in a temp dir;
// no doubles. Does NOT assert umask policy.

import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ensureLayout } from '../../src/identity/layout.js';

const KEY = 'testrepokey';

/** Permission bits (mode without the file-type bits). */
function perms(p: string): number {
  return statSync(p).mode & 0o777;
}

test('T-4-1a: an empty home yields 0o700 directories and an empty looseMode', () => {
  const base = mkdtempSync(path.join(tmpdir(), 'ctxoracle-layout-a-'));
  // `home` itself does not exist yet, so ensureLayout must create it too.
  const home = path.join(base, 'ctxhome');
  try {
    const layout = ensureLayout(home, KEY);

    // Returned paths.
    assert.equal(layout.global, path.join(home, 'global', 'global.db'));
    assert.equal(layout.project, path.join(home, 'projects', KEY, 'store.db'));
    assert.equal(layout.diagnostics, path.join(home, 'projects', KEY, 'diagnostics'));
    assert.deepEqual(layout.looseMode, []);

    // Every created directory is owner-only. The `.db` files are NOT created here.
    for (const dir of [
      home,
      path.join(home, 'global'),
      path.join(home, 'projects'),
      path.join(home, 'projects', KEY),
      path.join(home, 'projects', KEY, 'diagnostics'),
    ]) {
      assert.ok(existsSync(dir), `${dir} exists`);
      assert.equal(perms(dir), 0o700, `${dir} is 0o700`);
    }
    assert.equal(existsSync(layout.global), false, 'global.db is not created by ensureLayout');
    assert.equal(existsSync(layout.project), false, 'store.db is not created by ensureLayout');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('T-4-1b: a pre-existing loose projects/<key> is reported, never chmod-ed', () => {
  const base = mkdtempSync(path.join(tmpdir(), 'ctxoracle-layout-b-'));
  const home = path.join(base, 'ctxhome');
  const projectDir = path.join(home, 'projects', KEY);
  try {
    // Pre-create home/projects/<key> owner-only, then loosen only <key> to 0o755.
    mkdirSync(projectDir, { recursive: true });
    chmodSync(home, 0o700);
    chmodSync(path.join(home, 'projects'), 0o700);
    chmodSync(projectDir, 0o755);
    assert.equal(perms(projectDir), 0o755, 'precondition: <key> is loose (0o755)');

    const layout = ensureLayout(home, KEY);

    // The loose directory is reported exactly once and left unchanged.
    assert.deepEqual(layout.looseMode, [projectDir]);
    assert.equal(perms(projectDir), 0o755, '<key> mode is untouched');

    // Newly created directories under the layout are still 0o700.
    assert.equal(perms(layout.diagnostics), 0o700, 'diagnostics created 0o700');
    assert.equal(perms(path.join(home, 'global')), 0o700, 'global dir created 0o700');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
