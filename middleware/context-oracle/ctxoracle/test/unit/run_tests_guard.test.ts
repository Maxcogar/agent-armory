// T-1-2 — The runner refuses an empty or mismatched test set and propagates a
// test failure (Step 1). Spawns the real scripts/run-tests.mjs against three
// temp package layouts.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const runnerSource = path.join(packageRoot, 'scripts', 'run-tests.mjs');

interface Layout {
  sources: number; // *.test.ts under test/unit
  compiled: 'none' | 'one-passing' | 'one-failing';
}

function build(layout: Layout): { dir: string; runner: string } {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-runner-'));
  // The compiled tests are ESM (like the real package), so the temp layout
  // needs "type":"module" for node --test to load and run them.
  writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}\n');
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  cpSync(runnerSource, path.join(dir, 'scripts', 'run-tests.mjs'));
  mkdirSync(path.join(dir, 'test', 'unit'), { recursive: true });
  for (let i = 0; i < layout.sources; i++) {
    writeFileSync(path.join(dir, 'test', 'unit', `s${i}.test.ts`), '// source\n');
  }
  mkdirSync(path.join(dir, 'dist', 'test', 'unit'), { recursive: true });
  if (layout.compiled === 'one-passing' || layout.compiled === 'one-failing') {
    const body =
      layout.compiled === 'one-failing'
        ? "import test from 'node:test';\nimport assert from 'node:assert';\ntest('x', () => assert.equal(1, 2));\n"
        : "import test from 'node:test';\ntest('x', () => {});\n";
    writeFileSync(path.join(dir, 'dist', 'test', 'unit', 's0.test.js'), body);
  }
  return { dir, runner: path.join(dir, 'scripts', 'run-tests.mjs') };
}

function run(runner: string): number {
  // In production the runner is invoked by `npm test`, outside any test runner.
  // This test runs under `node --test`, which sets NODE_TEST_CONTEXT in the
  // environment; if it leaked into the runner's own `node --test` grandchild,
  // that grandchild would act as a child reporter (exit 0) instead of a
  // standalone run. Strip it so the runner sees the production environment.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, [runner], { encoding: 'utf8', env });
  return r.status ?? 1;
}

test('T-1-2a: empty compiled set (2 sources, 0 compiled) exits 1', () => {
  const { dir, runner } = build({ sources: 2, compiled: 'none' });
  try {
    assert.equal(run(runner), 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('T-1-2b: source/compiled count mismatch (2 sources, 1 compiled) exits 1', () => {
  const { dir, runner } = build({ sources: 2, compiled: 'one-passing' });
  try {
    assert.equal(run(runner), 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('T-1-2c: a failing compiled test propagates a non-zero exit', () => {
  const { dir, runner } = build({ sources: 1, compiled: 'one-failing' });
  try {
    assert.notEqual(run(runner), 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
