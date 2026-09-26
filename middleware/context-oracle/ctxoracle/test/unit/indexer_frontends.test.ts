// T-15-3 — Indexer with the default frontends on `indexer-small` (Step 15;
// G12, N6, N8; AD-2, AD-12; D-plan-28, D-plan-29).
//
// Integration: real `node:sqlite` (both FTS states), real `web-tree-sitter` +
// `tree-sitter-wasms` grammars, real `runIndex` given
// `defaultFrontends(tuning)`; fixture `indexer-small`; no doubles. Technique:
// equivalence partitioning over language, with the FTS flag as a second
// partition.
//
// Expected values, each from the fixture's text and Step 14/15's stated rules:
// - symbols: `src/util.ts` → `util`, `src/app.ts` → `app`, `tool.py` → `tool`,
//   `pkg/mod.py` → `f`, `pkg/use.py` → `use`, `scripts/gen.sh` → `gen`
//   (generic frontend, shell function syntax).
// - import_edges: `src/app.ts` → `src/util.ts` (`./util.js`),
//   `test/util.test.ts` → `src/util.ts` (`../src/util.js`), `pkg/use.py` →
//   `pkg/mod.py` (`from .mod import f` and `from . import mod`, the latter
//   captured as `.mod` — Step 15's resolver text).
// - symbol_refs (Step 14: one row per (symbol, importing file) whose redacted
//   text holds the name as a whole identifier `(?<![\p{L}\p{N}_$])name(?![\p{L}\p{N}_$])`,
//   `ref_count` = occurrences): `util` in `src/app.ts` 3 (`{ util }`,
//   `./util.js`, `util()`), `util` in `test/util.test.ts` 4 (`{ util }`,
//   `../src/util.js`, `util()`, `'util'`), `f` in `pkg/use.py` 3 (`import f`,
//   `f()`, `mod.f()`).
// - entry_score (import in-degree + `index.entry_marker_points` (seed 1) when
//   the stem is in `lexicon.entry_marker_stems` (seed main/index/cli/app)):
//   `src/util.ts` 2, `src/app.ts` 1.
// - test_map: `test/util.test.ts` (matches seed `test/**`) → `src/util.ts`
//   (`import_edge`).
// - lang_capabilities: `typescript` and `python` with `imports: true`; the
//   `.sh` file's recorded language `unknown` (bash is excluded from the
//   default table) with frontend `generic`, `imports: false`.
// - hit sets agree between the two FTS states for all five tokens (`help`,
//   `util`, `mod`, `schem`, `user`); that `help`/`schem` find something is
//   not asserted (T-15-3 NOT asserts — T-14-5 covers them).
// - indexer-walk's alias case: `src/alias.ts` (`import { h } from '@/util'`,
//   no `package.json`) has `unresolved_imports = 1`, and
//   `lang_capabilities.typescript.unresolved` equals the sum of
//   `unresolved_imports` over that run's in-tree `typescript` files.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { runIndex } from '../../src/index/indexer.js';
import { defaultFrontends } from '../../src/index/frontends.js';
import { pathSearch, symbolSearch } from '../../src/index/search.js';
import type { RepoFiles } from '../../src/index/frontend.js';
import { generateFixture, INDEXER_SMALL } from '../fixtures/generate.js';
import type { TuningReader } from '../../src/types/candidate.js';

const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-idx-frontends-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const diag = path.join(root, 'diagnostics');
const repo = path.join(root, 'indexer-small');
generateFixture('indexer-small', repo);

const TOKENS = ['help', 'util', 'mod', 'schem', 'user'];

async function indexed(fts: boolean, fixtureRepo = repo, name = 'indexer-small'): Promise<Store> {
  const store = openStore(path.join(root, `${name}-project-fts-${fts}.db`));
  applyMigrations(store, { fts });
  const global = openStore(path.join(root, `${name}-global-fts-${fts}.db`));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  try {
    const tuning: TuningReader = tuningReader(global, name, () => {});
    const r = await runIndex(store, fixtureRepo, { full: false, frontends: defaultFrontends(tuning), tuning, diagnosticsDir: diag });
    assert.ok(!('refused' in r), 'runIndex was refused');
  } catch (e) {
    store.close();
    throw e;
  } finally {
    global.close();
  }
  return store;
}

let stores: Promise<{ fts: Store; fb: Store }> | undefined;
const opened: Store[] = [];
function both(): Promise<{ fts: Store; fb: Store }> {
  stores ??= (async () => {
    const fts = await indexed(true);
    opened.push(fts);
    const fb = await indexed(false);
    opened.push(fb);
    return { fts, fb };
  })();
  return stores;
}
process.on('exit', () => {
  for (const s of opened) s.close();
});

function count(store: Store, sql: string, ...args: (string | number)[]): number {
  return Number((store.prepare(sql).get(...args) as { n: number }).n);
}

function symbolNames(store: Store, p: string): string[] {
  return (store.prepare('SELECT s.name AS name FROM symbols s JOIN files f ON f.id = s.file_id WHERE f.path = ?').all(p) as { name: string }[]).map((r) => r.name);
}

function edges(store: Store): string[] {
  return (
    store
      .prepare('SELECT s.path AS src, d.path AS dst FROM import_edges e JOIN files s ON s.id = e.src_file JOIN files d ON d.id = e.dst_file')
      .all() as { src: string; dst: string }[]
  ).map((e) => `${e.src} -> ${e.dst}`);
}

const EXPECTED_SYMBOLS: Record<string, string> = {
  'src/util.ts': 'util',
  'src/app.ts': 'app',
  'tool.py': 'tool',
  'pkg/mod.py': 'f',
  'pkg/use.py': 'use',
  'scripts/gen.sh': 'gen',
};
const EXPECTED_EDGES = ['src/app.ts -> src/util.ts', 'test/util.test.ts -> src/util.ts', 'pkg/use.py -> pkg/mod.py'];
const EXPECTED_REFS: [symbolFile: string, symbol: string, importer: string, refCount: number][] = [
  ['src/util.ts', 'util', 'src/app.ts', 3],
  ['src/util.ts', 'util', 'test/util.test.ts', 4],
  ['pkg/mod.py', 'f', 'pkg/use.py', 3],
];
const EXPECTED_ENTRY: Record<string, number> = { 'src/util.ts': 2, 'src/app.ts': 1 };

for (const fts of [true, false]) {
  test(`T-15-3 (fts: ${fts}): symbols, import_edges, symbol_refs, entry_score and test_map populate`, async () => {
    const s = await both();
    const store = fts ? s.fts : s.fb;
    for (const [p, name] of Object.entries(EXPECTED_SYMBOLS)) {
      assert.ok(symbolNames(store, p).includes(name), `${p} lacks its symbols row ${name} (has ${JSON.stringify(symbolNames(store, p))})`);
    }
    const e = edges(store);
    for (const x of EXPECTED_EDGES) assert.ok(e.includes(x), `import_edges lacks ${x} (has ${JSON.stringify(e)})`);
    for (const [symFile, sym, importer, n] of EXPECTED_REFS) {
      const row = store
        .prepare(
          `SELECT r.ref_count AS n FROM symbol_refs r
             JOIN symbols s ON s.id = r.symbol_id JOIN files sf ON sf.id = s.file_id JOIN files rf ON rf.id = r.src_file
            WHERE sf.path = ? AND s.name = ? AND rf.path = ?`
        )
        .get(symFile, sym, importer) as { n: number } | undefined;
      assert.ok(row !== undefined, `symbol_refs lacks (${symFile}:${sym}, ${importer})`);
      assert.equal(Number(row.n), n, `symbol_refs (${symFile}:${sym}, ${importer}) ref_count`);
    }
    for (const [p, score] of Object.entries(EXPECTED_ENTRY)) {
      assert.equal(count(store, 'SELECT entry_score AS n FROM files WHERE path = ?', p), score, `${p} entry_score`);
    }
    assert.ok(count(store, "SELECT entry_score AS n FROM files WHERE path = 'pkg/mod.py'") >= 1, 'pkg/mod.py entry_score lacks its import in-degree');
    const tm = (
      store
        .prepare('SELECT f.path AS test, m.region_glob AS region, m.source AS source FROM test_map m JOIN files f ON f.id = m.test_file')
        .all() as { test: string; region: string; source: string }[]
    ).map((r) => `${r.test} -> ${r.region} (${r.source})`);
    assert.ok(tm.includes('test/util.test.ts -> src/util.ts (import_edge)'), `test_map lacks test/util.test.ts -> src/util.ts (import_edge); has ${JSON.stringify(tm)}`);
  });
}

test('T-15-3: pkg/use.py’s two import forms are each captured and each resolve to pkg/mod.py', async () => {
  await both(); // creates and seeds the global store read below
  const tuning = (() => {
    const g = openStore(path.join(root, 'indexer-small-global-fts-true.db'));
    return { g, t: tuningReader(g, 'indexer-small', () => {}) };
  })();
  try {
    const py = defaultFrontends(tuning.t).find((f) => f.lang === 'python');
    assert.ok(py !== undefined, 'defaultFrontends has no python frontend');
    await py.init();
    const r = py.parse('pkg/use.py', readFileSync(path.join(repo, 'pkg/use.py')));
    assert.ok(r.ok, `pkg/use.py parse failed: ${r.ok ? '' : r.error}`);
    const specs = r.imports.map((i) => i.specifier);
    assert.equal(specs.filter((x) => x === '.mod').length, 2, `from .mod import f and from . import mod are not both captured as .mod (got ${JSON.stringify(specs)})`);
    const present = new Set<string>(INDEXER_SMALL.paths);
    const files: RepoFiles = { has: (p) => present.has(p), nearestPackageJsonDeps: () => new Set<string>() };
    assert.equal(typeof py.resolve, 'function', 'the python frontend lacks resolve');
    for (const spec of specs.filter((x) => x === '.mod')) {
      assert.deepEqual(py.resolve?.('pkg/use.py', spec, files), { kind: 'resolved', dst: 'pkg/mod.py' }, `${spec} does not resolve to pkg/mod.py`);
    }
  } finally {
    tuning.g.close();
  }
});

test('T-15-3: symbolSearch and pathSearch return the same hit sets under fts: true and fts: false for every listed token', async () => {
  const s = await both();
  const differ: string[] = [];
  for (const q of TOKENS) {
    const sym = (st: Store): string[] => symbolSearch(st, [q]).map((h) => `${h.name}|${h.kind}|${h.fileId}`).sort();
    const pth = (st: Store): string[] => pathSearch(st, [q]).map((h) => h.path).sort();
    if (JSON.stringify(sym(s.fts)) !== JSON.stringify(sym(s.fb))) differ.push(`symbolSearch ${q}: fts5 ${JSON.stringify(sym(s.fts))} vs fallback ${JSON.stringify(sym(s.fb))}`);
    if (JSON.stringify(pth(s.fts)) !== JSON.stringify(pth(s.fb))) differ.push(`pathSearch ${q}: fts5 ${JSON.stringify(pth(s.fts))} vs fallback ${JSON.stringify(pth(s.fb))}`);
  }
  assert.deepEqual(differ, [], 'a hit set differs between the two FTS states');
});

test('T-15-3: under fts: true, fts_symbols holds one row per symbols row', async () => {
  const s = await both();
  const n = count(s.fts, 'SELECT count(*) AS n FROM symbols');
  assert.ok(n > 0, 'precondition: the fts: true store has symbols rows');
  assert.equal(count(s.fts, 'SELECT count(*) AS n FROM fts_symbols'), n, 'fts_symbols row count != symbols row count');
});

test('T-15-3: lang_capabilities lists typescript and python with imports: true and unknown (the .sh file’s recorded language) with frontend generic, imports: false', async () => {
  const s = await both();
  for (const store of [s.fts, s.fb]) {
    const caps = JSON.parse((store.prepare("SELECT value FROM schema_meta WHERE key = 'lang_capabilities'").get() as { value: string }).value) as Record<
      string,
      { frontend: string; imports: boolean }
    >;
    for (const lang of ['typescript', 'python']) {
      assert.ok(caps[lang] !== undefined, `lang_capabilities lacks ${lang}`);
      assert.equal(caps[lang]?.imports, true, `lang_capabilities.${lang}.imports is not true`);
      assert.equal(caps[lang]?.frontend, 'tree-sitter', `lang_capabilities.${lang}.frontend is not tree-sitter`);
    }
    const shLang = (store.prepare('SELECT lang FROM files WHERE path = ?').get(INDEXER_SMALL.markerPath) as { lang: string }).lang;
    assert.equal(shLang, 'unknown', `${INDEXER_SMALL.markerPath}'s recorded language is not unknown`);
    assert.deepEqual(
      { frontend: caps.unknown?.frontend, imports: caps.unknown?.imports },
      { frontend: 'generic', imports: false },
      'lang_capabilities.unknown (the .sh file’s recorded language) is not {frontend: generic, imports: false}'
    );
  }
});

test('T-15-3: on indexer-walk, the @/util alias import is counted unresolved in the typescript share', async () => {
  const walk = path.join(root, 'indexer-walk');
  generateFixture('indexer-walk', walk);
  const store = await indexed(true, walk, 'indexer-walk');
  try {
    assert.equal(count(store, "SELECT unresolved_imports AS n FROM files WHERE path = 'src/alias.ts'"), 1, 'src/alias.ts unresolved_imports is not 1');
    const caps = JSON.parse((store.prepare("SELECT value FROM schema_meta WHERE key = 'lang_capabilities'").get() as { value: string }).value) as Record<
      string,
      { unresolved: number }
    >;
    const sum = count(store, "SELECT COALESCE(sum(unresolved_imports), 0) AS n FROM files WHERE in_tree = 1 AND lang = 'typescript'");
    assert.ok(sum >= 1, 'precondition: the typescript files’ unresolved_imports sum includes the alias import');
    assert.equal(caps.typescript?.unresolved, sum, 'lang_capabilities.typescript.unresolved differs from the typescript files’ unresolved_imports sum');
  } finally {
    store.close();
  }
});
