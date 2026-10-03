// T-15-1 — Tree-sitter frontend on a TypeScript fixture (Step 15; G12; AD-12).
//
// Integration: real `web-tree-sitter` + the `tree-sitter-wasms` TypeScript
// grammar, real `node:sqlite`, real `runIndex`; no doubles. Data: the two `.ts`
// files of `indexer-small` — `src/app.ts` importing `./util.js` where only
// `src/util.ts` exists. Technique: state-transition (source → parse → rows).
//
// Expected values come from the fixture (`src/util.ts` defines `util`,
// `src/app.ts` defines `app`) and Step 15's text (TypeScript ships a
// definitions query, an imports query and a resolver: `{symbols: true,
// imports: true}`; `./util.js` resolves to its source `util.ts`).
// A symbol's span is its declaration node's byte span, which contains the
// name (T-15-1 Data); the test asserts each span lies within the file's bytes
// and covers the bytes of the symbol's name — not its exact end byte.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { runIndex } from '../../src/index/indexer.js';
import { treeSitterFrontend } from '../../src/index/tree_sitter_frontend.js';
import type { SymbolRow } from '../../src/types/index_types.js';
import { generateFixture } from '../fixtures/generate.js';

const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-ts-frontend-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const diag = path.join(root, 'diagnostics');
const repo = path.join(root, 'indexer-small');
generateFixture('indexer-small', repo);

/** The two `.ts` files and the one definition each carries (the fixture's text). */
const FILES: Record<string, string> = { 'src/util.ts': 'util', 'src/app.ts': 'app' };

/** The name's byte offset as a whole identifier in the file (the definition site: the first `function <name>`). */
function nameOffset(content: Buffer, name: string): number {
  const at = content.indexOf(Buffer.from(`function ${name}`));
  assert.ok(at >= 0, `precondition: the fixture defines function ${name}`);
  return at + 'function '.length;
}

function assertSpan(file: string, content: Buffer, s: { name: string; spanStart: number; spanEnd: number }): void {
  const at = nameOffset(content, s.name);
  const nameEnd = at + Buffer.byteLength(s.name);
  assert.ok(
    Number.isInteger(s.spanStart) && Number.isInteger(s.spanEnd) && s.spanStart >= 0 && s.spanStart < s.spanEnd && s.spanEnd <= content.length,
    `${file} ${s.name}: span [${s.spanStart}, ${s.spanEnd}) is not a non-empty range within the file's ${content.length} bytes`
  );
  assert.ok(s.spanStart <= at && nameEnd <= s.spanEnd, `${file} ${s.name}: span [${s.spanStart}, ${s.spanEnd}) does not cover the name at [${at}, ${nameEnd})`);
}

test('T-15-1: treeSitterFrontend(typescript) declares {symbols: true, imports: true} and provides resolve', () => {
  const fe = treeSitterFrontend('typescript');
  assert.equal(fe.lang, 'typescript');
  assert.deepEqual(fe.capabilities, { symbols: true, imports: true }, 'the TypeScript frontend does not declare {symbols: true, imports: true}');
  assert.equal(typeof fe.resolve, 'function', 'the TypeScript frontend declares imports but lacks resolve');
});

test('T-15-1: parse yields each file’s symbol with a span that addresses it, and captures ./util.js', async () => {
  const fe = treeSitterFrontend('typescript');
  await fe.init();
  for (const [file, name] of Object.entries(FILES)) {
    const content = readFileSync(path.join(repo, file));
    const r = fe.parse(file, content);
    assert.ok(r.ok, `${file}: parse failed: ${r.ok ? '' : r.error}`);
    const found = r.symbols.filter((s: SymbolRow) => s.name === name);
    assert.equal(found.length, 1, `${file}: symbol ${name} is lost (symbols: ${JSON.stringify(r.symbols.map((s) => s.name))})`);
    assertSpan(file, content, found[0] as SymbolRow);
  }
  const app = fe.parse('src/app.ts', readFileSync(path.join(repo, 'src/app.ts')));
  assert.ok(app.ok);
  assert.deepEqual(
    app.imports.map((i) => i.specifier),
    ['./util.js'],
    'src/app.ts: the ./util.js import is not the one captured specifier'
  );
});

test('T-15-1: runIndex with the TypeScript frontend writes the symbols rows with their spans and an import_edges row src/app.ts → src/util.ts', async () => {
  const store = openStore(path.join(root, 'project.db'));
  applyMigrations(store, { fts: true });
  const global = openStore(path.join(root, 'global.db'));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  try {
    const tuning = tuningReader(global, 'indexer-small', () => {});
    const r = await runIndex(store, repo, { full: false, frontends: [treeSitterFrontend('typescript')], tuning, diagnosticsDir: diag });
    assert.ok(!('refused' in r), 'runIndex was refused');
    for (const [file, name] of Object.entries(FILES)) {
      const content = readFileSync(path.join(repo, file));
      const rows = store
        .prepare('SELECT s.name AS name, s.span_start AS spanStart, s.span_end AS spanEnd FROM symbols s JOIN files f ON f.id = s.file_id WHERE f.path = ? AND s.name = ?')
        .all(file, name) as { name: string; spanStart: number; spanEnd: number }[];
      assert.equal(rows.length, 1, `${file}: the symbols row for ${name} is lost`);
      assertSpan(file, content, { name, spanStart: Number(rows[0]?.spanStart), spanEnd: Number(rows[0]?.spanEnd) });
    }
    const edges = (
      store
        .prepare('SELECT s.path AS src, d.path AS dst FROM import_edges e JOIN files s ON s.id = e.src_file JOIN files d ON d.id = e.dst_file WHERE s.path = ?')
        .all('src/app.ts') as { src: string; dst: string }[]
    ).map((e) => `${e.src} -> ${e.dst}`);
    assert.deepEqual(edges, ['src/app.ts -> src/util.ts'], 'the ./util.js import does not yield exactly the import_edges row to src/util.ts');
    const unresolved = store.prepare('SELECT unresolved_imports AS n FROM files WHERE path = ?').get('src/app.ts') as { n: number };
    assert.equal(Number(unresolved.n), 0, 'src/app.ts counts an unresolved import');
  } finally {
    store.close();
    global.close();
  }
});
