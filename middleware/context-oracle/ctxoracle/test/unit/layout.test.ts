// T-4-1 — ensureLayout creates 0o700 directories and reports (never alters)
// pre-existing loose-mode directories (Step 4). Real filesystem in a temp dir;
// no doubles. Does NOT assert umask policy.
//
// Reopened 2026-09-26 (Step 4 build delta, AD-3/AD-17, G35/N15): T-4-1's Data
// gains (a) `ensureHome` alone on an empty home, then `ensureLayout`, and (c) a
// home with a pre-existing `diagnostics/` at 0o755 — T-4-1a2 and T-4-1c below.

import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ensureHome, ensureLayout } from '../../src/identity/layout.js';

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
      // Reopened 2026-09-26: ensureLayout calls ensureHome first, so the
      // home-level diagnostics/ exists too (Step 4 build delta).
      path.join(home, 'diagnostics'),
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

test('T-4-1a2: ensureHome alone on an empty home creates <home>/, global/, diagnostics/ at 0o700 and no projects/ entry; ensureLayout then adds the project', () => {
  const base = mkdtempSync(path.join(tmpdir(), 'ctxoracle-layout-a2-'));
  const home = path.join(base, 'ctxhome');
  try {
    const h = ensureHome(home);
    assert.equal(h.homeDiagnostics, path.join(home, 'diagnostics'), 'returned path is <home>/diagnostics');
    assert.deepEqual(h.looseMode, []);
    for (const dir of [home, path.join(home, 'global'), path.join(home, 'diagnostics')]) {
      assert.ok(existsSync(dir), `${dir} exists`);
      assert.equal(perms(dir), 0o700, `${dir} is 0o700`);
    }
    assert.equal(existsSync(path.join(home, 'projects')), false, 'ensureHome creates no projects/ entry');

    const layout = ensureLayout(home, KEY);
    assert.deepEqual(layout.looseMode, []);
    for (const dir of [path.join(home, 'projects'), path.join(home, 'projects', KEY), layout.diagnostics]) {
      assert.ok(existsSync(dir), `${dir} exists`);
      assert.equal(perms(dir), 0o700, `${dir} is 0o700`);
    }
    assert.equal(perms(path.join(home, 'diagnostics')), 0o700, 'home diagnostics/ unchanged by ensureLayout');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('T-4-1c: a pre-existing loose <home>/diagnostics/ is reported by ensureHome, never chmod-ed', () => {
  const base = mkdtempSync(path.join(tmpdir(), 'ctxoracle-layout-c-'));
  const home = path.join(base, 'ctxhome');
  const diag = path.join(home, 'diagnostics');
  try {
    mkdirSync(diag, { recursive: true });
    chmodSync(home, 0o700);
    chmodSync(diag, 0o755);
    assert.equal(perms(diag), 0o755, 'precondition: diagnostics/ is loose (0o755)');

    const h = ensureHome(home);
    assert.equal(h.homeDiagnostics, diag);
    assert.deepEqual(h.looseMode, [diag], 'the loose diagnostics/ is listed');
    assert.equal(perms(diag), 0o755, 'diagnostics/ mode is untouched');
    assert.equal(perms(path.join(home, 'global')), 0o700, 'the missing global/ is created 0o700');
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// ---- Added for the fixes that follow the Steps 1–12 build review
// (docs/reviews/2026-09-26-steps-1-12-build-review.md m3), written from plan
// Step 4 as amended by commit ca67af7: ensureHome "creates <home>/,
// <home>/global/, and <home>/diagnostics/ at 0o700 when missing (created with
// `mkdirSync(path, {mode: 0o700})`, so the umask can only narrow the mode and
// there is no window at a looser one, then `chmod` to `0o700` exactly)".
// The window between mkdir and chmod is not observable from a test; what is
// observable is the mode every directory ensureHome creates is left at when
// the umask narrows nothing (umask 0o000).

function withUmask0(fn: () => void): void {
  const prev = process.umask(0);
  try {
    fn();
  } finally {
    process.umask(prev);
  }
}

test('T-4-1d (review m3): under umask 0o000, ensureHome leaves <home>/, global/ and diagnostics/ at exactly 0o700', () => {
  const base = mkdtempSync(path.join(tmpdir(), 'ctxoracle-layout-d-'));
  const home = path.join(base, 'ctxhome');
  try {
    withUmask0(() => {
      const h = ensureHome(home);
      assert.deepEqual(h.looseMode, []);
    });
    for (const dir of [home, path.join(home, 'global'), path.join(home, 'diagnostics')]) {
      assert.equal(perms(dir), 0o700, `${dir} is 0o700 under umask 0`);
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('T-4-1e (review m3): under umask 0o000, a missing ancestor of <home> that ensureHome creates is not left looser than 0o700', () => {
  // ensureHome creates <home> with a recursive mkdir, so it also creates any
  // missing ancestor; "no window at a looser one" covers every directory the
  // call creates, not only the three it names.
  const base = mkdtempSync(path.join(tmpdir(), 'ctxoracle-layout-e-'));
  const ancestor = path.join(base, 'missing-parent');
  const home = path.join(ancestor, 'ctxhome');
  try {
    withUmask0(() => {
      ensureHome(home);
    });
    assert.equal(perms(home), 0o700, '<home> is 0o700');
    assert.equal(perms(ancestor) & 0o077, 0, `the created ancestor ${ancestor} has no group/other bits (mode ${perms(ancestor).toString(8)})`);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
