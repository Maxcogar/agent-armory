// T-14-5 — Search semantics agree under both FTS states (Step 14; N6, G16; AD-2).
//
// Integration: two real stores built by the migrations (`fts: true` and
// `fts: false`) and `runIndex`; no doubles. Technique: equivalence partitioning
// + error guessing (syntax injection).
//
//   - `tokenize` directly over the spec's ten inputs, each against its stated
//     output.
//   - Two stores indexed from the same four files, built in a temporary git
//     repository with `fixtureInit`/`fixtureCommit`, each line exactly as the
//     spec writes it (FILES below).
//   - Step 14 (empty frontend list, D-plan-29): every named query through
//     `pathSearch` on both stores — hit sets compared between the stores and
//     asserted exactly, derived from Step 14's stated semantics (a term's
//     tokens by `tokenize`; each token a prefix; a term's hits the
//     intersection over its tokens; a term with no token matches nothing) over
//     the path tokens src/util/ts, src/db/schema/ts, lib/cafe/x/ts,
//     lib/a/b/c/sh — and the injected terms, which must neither throw nor
//     match everything.
//   - Step 15 subtest (its `todo` mark retired by Step 15): the same two
//     stores indexed with Step 15's `defaultFrontends(tuning)`; every query's
//     `symbolSearch` hit set compared between them, and the symbol-hit
//     clauses.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { runIndex } from '../../src/index/indexer.js';
import { tokenize, pathSearch, symbolSearch } from '../../src/index/search.js';
import { defaultFrontends } from '../../src/index/frontends.js';
import { fixtureInit, fixtureCommit } from '../fixtures/generate.js';

const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-search-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const diag = path.join(root, 'diagnostics');

test('T-14-5: tokenize yields the stated tokens', () => {
  const cases: [string, string[]][] = [
    ['CAFÉ', ['cafe']],
    ['café', ['cafe']],
    ['Über', ['uber']],
    ['foo-bar', ['foo', 'bar']],
    ['my.method', ['my', 'method']],
    ['Foo::Bar', ['foo', 'bar']],
    ['user_name', ['user', 'name']],
    ['getUserName', ['getusername']],
    ['$store', ['store']],
    ['café', ['cafe']],
  ];
  const wrong = cases
    .map(([input, expected]) => ({ input, expected, got: tokenize(input) }))
    .filter((c) => JSON.stringify(c.got) !== JSON.stringify(c.expected))
    .map((c) => `${JSON.stringify(c.input)}: expected ${JSON.stringify(c.expected)}, got ${JSON.stringify(c.got)}`);
  assert.deepEqual(wrong, []);
});

/** The four files, each line exactly as the spec writes it. */
const FILES: Record<string, string[]> = {
  'src/util.ts': ['export function help() {}', 'export function helper() {}', 'export function $store() {}'],
  'src/db/schema.ts': ['export function user_name() {}', 'export function getUserName() {}'],
  'lib/café-x.ts': ['export function CAFÉ() {}', 'export function Über() {}'],
  'lib/a_b-c.sh': ['foo-bar() { :; }', 'my.method() { :; }', 'Foo::Bar() { :; }'],
};
const INJECTED = ['sch"em*', '"*'];
const QUERIES = ['util', 'schem', 'b', 'café', 'CAFE', 'über', 'bar', 'method', 'help', 'user', 'USER', 'get', 'name'];

// Expected path hits per query, from the stated semantics over the four paths' tokens.
const PATH_HITS: Record<string, string[]> = {
  util: ['src/util.ts'],
  schem: ['src/db/schema.ts'],
  b: ['lib/a_b-c.sh'],
  café: ['lib/café-x.ts'],
  CAFE: ['lib/café-x.ts'],
  über: [],
  bar: [],
  method: [],
  help: [],
  user: [],
  USER: [],
  get: [],
  name: [],
  'sch"em*': [], // tokens sch + em: no path holds a token with prefix em
  '"*': [], // no token: matches nothing
};

let repo: string | undefined;
function filesRepo(): string {
  if (repo === undefined) {
    repo = path.join(root, 'repo');
    fixtureInit(repo);
    fixtureCommit(
      repo,
      Object.entries(FILES).map(([p, lines]) => ({ path: p, content: lines.map((l) => `${l}\n`).join('') })),
      { message: 'search semantics files', day: 0 }
    );
  }
  return repo;
}

async function indexedStore(name: string, fts: boolean, withFrontends: boolean): Promise<Store> {
  const store = openStore(path.join(root, `${name}-fts-${fts}.db`));
  applyMigrations(store, { fts });
  const global = openStore(path.join(root, `${name}-fts-${fts}-global.db`));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  try {
    const tuning = tuningReader(global, 'search-semantics', () => {});
    const frontends = withFrontends ? defaultFrontends(tuning) : [];
    await runIndex(store, filesRepo(), { full: false, frontends, tuning, diagnosticsDir: diag });
  } finally {
    global.close();
  }
  return store;
}

function assertStates(ftsStore: Store, fbStore: Store): void {
  const state = (s: Store): string | undefined =>
    (s.prepare("SELECT value FROM schema_meta WHERE key = 'fts_state'").get() as { value: string } | undefined)?.value;
  assert.equal(state(ftsStore), 'fts5', 'precondition: the fts: true store is under fts5');
  assert.equal(state(fbStore), 'fallback', 'precondition: the fts: false store is under fallback');
}

test('T-14-5: pathSearch hit sets agree under fts5 and fallback and follow token-prefix semantics; injected terms are inert', async () => {
  const ftsStore = await indexedStore('paths', true, false);
  const fbStore = await indexedStore('paths', false, false);
  try {
    assertStates(ftsStore, fbStore);
    const paths = (s: Store, q: string): string[] => pathSearch(s, [q]).map((h) => h.path).sort();
    const differ: string[] = [];
    const wrong: string[] = [];
    for (const [q, expected] of Object.entries(PATH_HITS)) {
      const a = paths(ftsStore, q);
      const b = paths(fbStore, q);
      if (JSON.stringify(a) !== JSON.stringify(b)) differ.push(`pathSearch ${JSON.stringify(q)}: fts5 ${JSON.stringify(a)} vs fallback ${JSON.stringify(b)}`);
      if (JSON.stringify(a) !== JSON.stringify([...expected].sort())) wrong.push(`pathSearch ${JSON.stringify(q)} (fts5): expected ${JSON.stringify(expected)}, got ${JSON.stringify(a)}`);
      if (JSON.stringify(b) !== JSON.stringify([...expected].sort())) wrong.push(`pathSearch ${JSON.stringify(q)} (fallback): expected ${JSON.stringify(expected)}, got ${JSON.stringify(b)}`);
    }
    assert.deepEqual(differ, [], 'a pathSearch hit set differs between the two stores');
    assert.deepEqual(wrong, [], 'a path hit set differs from the token-prefix semantics (util must hit src/util.ts — G16)');

    for (const s of [ftsStore, fbStore]) {
      for (const q of INJECTED) {
        let hits: string[] = [];
        assert.doesNotThrow(() => {
          hits = paths(s, q);
        }, `pathSearch ${JSON.stringify(q)} throws`);
        assert.ok(hits.length < Object.keys(FILES).length, `pathSearch ${JSON.stringify(q)} matches everything`);
        assert.doesNotThrow(() => symbolSearch(s, [q]), `symbolSearch ${JSON.stringify(q)} throws`);
      }
    }
  } finally {
    ftsStore.close();
    fbStore.close();
  }
});

test('T-14-5 (Step 15): symbolSearch hit sets agree under both stores and meet the symbol clauses', async () => {
  const ftsStore = await indexedStore('symbols', true, true);
  const fbStore = await indexedStore('symbols', false, true);
  try {
    assertStates(ftsStore, fbStore);
    const names = (s: Store, q: string): string[] => symbolSearch(s, [q]).map((h) => h.name).sort();
    const full = (s: Store, q: string): string[] => symbolSearch(s, [q]).map((h) => `${h.name}|${h.kind}|${h.fileId}`).sort();
    const differ: string[] = [];
    for (const q of [...QUERIES, ...INJECTED]) {
      const a = full(ftsStore, q);
      const b = full(fbStore, q);
      if (JSON.stringify(a) !== JSON.stringify(b)) differ.push(`symbolSearch ${JSON.stringify(q)}: fts5 ${JSON.stringify(a)} vs fallback ${JSON.stringify(b)}`);
    }
    assert.deepEqual(differ, [], 'a symbolSearch hit set differs between the two stores');
    for (const s of [ftsStore, fbStore]) {
      const has = (q: string, name: string): boolean => names(s, q).includes(name);
      assert.ok(has('help', 'helper'), '`help` misses `helper` (N6)');
      assert.ok(!has('user', 'getUserName'), '`user` matches `getUserName`');
      assert.ok(has('user', 'user_name'), '`user` misses `user_name`');
      assert.ok(has('café', 'CAFÉ'), '`café` misses `CAFÉ`');
      assert.ok(has('CAFE', 'CAFÉ'), '`CAFE` misses `CAFÉ`');
      assert.ok(has('über', 'Über'), '`über` misses `Über`');
      assert.ok(has('bar', 'foo-bar'), '`bar` misses `foo-bar`');
      assert.ok(has('bar', 'Foo::Bar'), '`bar` misses `Foo::Bar`');
      assert.ok(has('method', 'my.method'), '`method` misses `my.method`');
    }
  } finally {
    ftsStore.close();
    fbStore.close();
  }
});
