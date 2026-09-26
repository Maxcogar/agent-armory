// T-15-4 — A parse that throws falls back to generic with a diagnostic (Step
// 15; G14; plan §4 — the catch-every-throwable rule).
//
// Integration: real `web-tree-sitter` and the shipped `bash` grammar, registered
// explicitly through the frontend list `runIndex` takes (D-plan-29 — `bash` is
// outside the default table, §4); real `node:sqlite`; real git; no doubles.
// Data: two `.sh` files — `a_case.sh` containing `case x in a) ;; esac` (whose
// parse throws a `TypeError` under the pinned runtime, executed) and
// `b_plain.sh` without it — indexed with `[treeSitterFrontend('bash'),
// genericFrontend]`. The names sort so git's listing, and so the pass, parses
// the throwing file first. Technique: error guessing (the executed throw);
// state-transition (throw → discard → fresh instance).
//
// Setup (T-15-4): `bash` is excluded from the default table, so `.sh` maps to
// no grammar; the test adds `.sh=bash` to `index.ext_to_grammar` on a real
// seeded global store with `tuning.addToList(global, 'index.ext_to_grammar',
// '.sh=bash', 'owner')` before the reader `runIndex` uses is built (the reader
// caches), and asserts as a precondition that after the run
// `lang_capabilities.bash.frontend = 'tree-sitter'`.
//
// Executed 2026-09-26 against the pinned web-tree-sitter 0.25.10: parsing
// `first() {\n  case x in a) ;; esac\n}\n` throws `TypeError: resolved is not a
// function`; the same parser then throws on `second() { echo two }`; a fresh
// parser parses it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuning, tuningReader } from '../../src/stores/dao/tuning.js';
import { runIndex } from '../../src/index/indexer.js';
import { treeSitterFrontend } from '../../src/index/tree_sitter_frontend.js';
import { genericFrontend } from '../../src/index/generic_frontend.js';
import { fixtureInit, fixtureCommit } from '../fixtures/generate.js';

const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-ts-fallback-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const diag = path.join(root, 'diagnostics');

const CASE_FILE = 'a_case.sh';
const PLAIN_FILE = 'b_plain.sh';
const CASE_TEXT = 'first() {\n  case x in a) ;; esac\n}\n';
const PLAIN_TEXT = 'second() {\n  echo two\n}\n';

test('T-15-4: a throwing parse falls back to the generic frontend with frontend_parse_failed; the next file gets a fresh parser', async () => {
  const repo = path.join(root, 'repo');
  fixtureInit(repo);
  fixtureCommit(
    repo,
    [
      { path: CASE_FILE, content: CASE_TEXT },
      { path: PLAIN_FILE, content: PLAIN_TEXT },
    ],
    { message: 'two shell files', day: 0 }
  );
  const store = openStore(path.join(root, 'project.db'));
  applyMigrations(store, { fts: true });
  const global = openStore(path.join(root, 'global.db'));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  tuning.addToList(global, 'index.ext_to_grammar', '.sh=bash', 'owner');
  try {
    const t = tuningReader(global, 'fallback', () => {});
    assert.ok(t.list('index.ext_to_grammar').includes('.sh=bash'), 'precondition: the table maps .sh to bash');
    const r = await runIndex(store, repo, { full: false, frontends: [treeSitterFrontend('bash'), genericFrontend], tuning: t, diagnosticsDir: diag });
    assert.ok(!('refused' in r), 'runIndex was refused');

    const symbolsOf = (p: string): string[] | undefined => {
      const f = store.prepare('SELECT id, in_tree FROM files WHERE path = ?').get(p) as { id: number; in_tree: number } | undefined;
      if (f === undefined || f.in_tree !== 1) return undefined;
      return (store.prepare('SELECT name FROM symbols WHERE file_id = ? ORDER BY name').all(f.id) as { name: string }[]).map((s) => s.name);
    };

    const caseSymbols = symbolsOf(CASE_FILE);
    assert.ok(caseSymbols !== undefined, `${CASE_FILE} lacks its in-tree files row`);
    assert.ok(caseSymbols.includes('first'), `${CASE_FILE} lacks its generic-frontend symbols row (first); has ${JSON.stringify(caseSymbols)}`);

    const faults = (store.prepare("SELECT detail_json FROM faults WHERE code = 'frontend_parse_failed' ORDER BY id").all() as { detail_json: string | null }[]).map(
      (f) => (f.detail_json === null ? {} : (JSON.parse(f.detail_json) as Record<string, unknown>))
    );
    assert.ok(
      faults.some((d) => d.path === CASE_FILE && d.lang === 'bash'),
      `no frontend_parse_failed fault names ${CASE_FILE} and lang bash; faults: ${JSON.stringify(faults)}`
    );

    const plainSymbols = symbolsOf(PLAIN_FILE);
    assert.ok(plainSymbols !== undefined, `${PLAIN_FILE}, parsed after the throw, lacks its in-tree files row`);
    assert.ok(plainSymbols.includes('second'), `${PLAIN_FILE}, parsed after the throw, failed to index (symbols ${JSON.stringify(plainSymbols)})`);
    assert.ok(
      !faults.some((d) => d.path === PLAIN_FILE),
      `${PLAIN_FILE}'s parse threw — the exhausted parser instance was reused; faults: ${JSON.stringify(faults)}`
    );

    const caps = JSON.parse(
      (store.prepare("SELECT value FROM schema_meta WHERE key = 'lang_capabilities'").get() as { value: string }).value
    ) as Record<string, { frontend: string }>;
    assert.equal(caps.bash?.frontend, 'tree-sitter', 'precondition: the bash frontend was the one used for the pass (not disabled at init)');
  } finally {
    store.close();
    global.close();
  }
});
