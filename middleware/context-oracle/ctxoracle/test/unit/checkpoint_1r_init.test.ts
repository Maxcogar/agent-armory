// Checkpoint 1R — `ctxoracle init` then `ctxoracle index` exit 0 on an
// FTS5-capable runtime (Steps 1–12 build review M1; plan §9's placeholder row
// for `src/index/indexer.ts` as amended by commit ca67af7: "the
// `fts_paths`/`fts_symbols` inserts, which name the pre-1R columns, are
// removed, so `init` and `index` run at 1R with empty FTS tables (2)").
//
// Real built binary, real git repository (the skeleton_e2e setup), a
// temporary CTXORACLE_HOME; no doubles. Between `init` and `index` a new
// TypeScript file is committed, so `index` has a new path and a new symbol to
// write and cannot pass by finding nothing to do.
// NOT asserted: the FTS tables' contents (empty at 1R; Step 14's T-14-1), the
// verbs' stdout wording, any whisper behaviour (the skeleton's todo test).

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore, probeFts5 } from '../../src/stores/adapter.js';

const dispatch = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/cli/dispatch.js');

test('Checkpoint 1R (review M1): `ctxoracle init` then `ctxoracle index` exit 0 on an FTS5 build', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'ctxo-1r-init-'));
  try {
    // Precondition: this runtime has FTS5, so migration 001b's FTS tables exist
    // and the indexer's FTS path is the one exercised.
    const probeStore = openStore(':memory:');
    try {
      assert.equal(probeFts5(probeStore), true, 'precondition: the runtime is an FTS5 build');
    } finally {
      probeStore.close();
    }

    const repo = path.join(root, 'repo');
    const home = path.join(root, 'home');
    mkdirSync(repo);
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_SYSTEM: '/dev/null',
      CTXORACLE_HOME: home,
      NODE_NO_WARNINGS: '1',
    };
    delete env.CTXORACLE_INTERNAL;
    const git = (...a: string[]): void => {
      execFileSync('git', a, { cwd: repo, env });
    };
    git('init', '-q', '-b', 'main');
    git('config', 'user.email', 'f@x');
    git('config', 'user.name', 'f');
    git('config', 'commit.gpgsign', 'false');
    mkdirSync(path.join(repo, 'src/api'), { recursive: true });
    mkdirSync(path.join(repo, 'src/db'), { recursive: true });
    for (let i = 0; i < 4; i++) {
      writeFileSync(path.join(repo, 'src/api/handler.ts'), `export function handle${i}(): number { return ${i}; }\n`);
      writeFileSync(path.join(repo, 'src/db/schema.ts'), `export const s${i} = ${i};\n`);
      git('add', '-A');
      git('commit', '-qm', `change ${i}`);
    }

    const run = (...args: string[]): { status: number | null; stdout: string; stderr: string } => {
      const r = spawnSync(process.execPath, [dispatch, ...args], { cwd: repo, env, encoding: 'utf8' });
      if (r.error !== undefined) throw r.error;
      return { status: r.status, stdout: r.stdout, stderr: r.stderr };
    };

    const init = run('init');
    assert.equal(init.status, 0, `ctxoracle init must exit 0; stderr: ${init.stderr.trim()}`);

    writeFileSync(path.join(repo, 'src/api/extra.ts'), 'export function extraHelper(): string { return "x"; }\n');
    git('add', '-A');
    git('commit', '-qm', 'add extra');

    const index = run('index');
    assert.equal(index.status, 0, `ctxoracle index must exit 0; stderr: ${index.stderr.trim()}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
