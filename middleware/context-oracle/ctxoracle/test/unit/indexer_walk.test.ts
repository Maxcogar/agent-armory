// T-14-3 — The walk, zones, `in_tree`, `test_map`, UTF-8, oversize (Step 14;
// G2, G7, G11, G15, N7, N13; AD-12).
//
// Integration: real `git`, filesystem, store; fixtures `indexer-walk` and
// `indexer-nongit`; no doubles. `runIndex` runs with an empty frontend list at
// Step 14 (D-plan-29). Both indexed; then `src/k.ts` deleted and re-indexed.
// Technique: decision table over path classes + state-transition.
//
// Step 15 subtests (their `todo` marks retired by Step 15): the assertions
// that need symbols or `import_edges` — the `test_map` rows
// `src/a.test.ts -> src/a.ts` and `tests/test_b.py -> b.py` (`import_edge`),
// and the precondition that `src/k.ts` has `symbols` rows before its deletion
// — run on their own `indexer-walk` copy with Step 15's
// `defaultFrontends(tuning)`.
//
// Expected values come from the fixture and Step 14's text: the tracked-and-
// ignored zone evidence `tracked file matches an ignore pattern`; `test_map`
// `region_glob` = the covered file's path, `source` `same_dir` for a language
// in `lexicon.test_same_dir_languages` (seeded `['go']`), else `import_edge`;
// `path_not_utf8` reported once with writer `'indexer'`;
// `index_path_only_oversize` `{path, bytes, lines, cap}` with `cap: 'lines'`
// for the 20,001-line file under 1 MB; `schema_meta.walk_mode` `'git'` /
// `'readdir'` (a `.git` directory without `HEAD` counts as absent).

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { runIndex } from '../../src/index/indexer.js';
import { defaultFrontends } from '../../src/index/frontends.js';
import { generateFixture, INDEXER_WALK } from '../fixtures/generate.js';

const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-walk-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const diag = path.join(root, 'diagnostics');

function newStores(name: string): { store: Store; global: Store } {
  const store = openStore(path.join(root, `${name}.db`));
  applyMigrations(store, { fts: true });
  const global = openStore(path.join(root, `${name}-global.db`));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  return { store, global };
}

async function index(store: Store, global: Store, repo: string, withFrontends = false): Promise<void> {
  const tuning = tuningReader(global, path.basename(repo), () => {});
  const frontends = withFrontends ? defaultFrontends(tuning) : [];
  await runIndex(store, repo, { full: false, frontends, tuning, diagnosticsDir: diag });
}

interface FileRow {
  id: number;
  path: string;
  zone: string;
  zone_evidence: string | null;
  in_tree: number;
}

function file(store: Store, p: string): FileRow | undefined {
  return store.prepare('SELECT id, path, zone, zone_evidence, in_tree FROM files WHERE path = ?').get(p) as FileRow | undefined;
}

function meta(store: Store, key: string): string | undefined {
  const row = store.prepare('SELECT value FROM schema_meta WHERE key = ?').get(key) as { value: string | null } | undefined;
  return row?.value ?? undefined;
}

function symbolCount(store: Store, fileId: number): number {
  return (store.prepare('SELECT count(*) AS n FROM symbols WHERE file_id = ?').get(fileId) as { n: number }).n;
}

function pairExists(store: Store, a: string, b: string): boolean {
  const fa = file(store, a);
  const fb = file(store, b);
  if (fa === undefined || fb === undefined) return false;
  return (
    store.prepare('SELECT 1 AS x FROM cochange_pairs WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)').get(fa.id, fb.id, fb.id, fa.id) !== undefined
  );
}

function faultDetails(store: Store, code: string): Record<string, unknown>[] {
  return (store.prepare('SELECT detail_json FROM faults WHERE code = ? ORDER BY id').all(code) as { detail_json: string | null }[]).map(
    (r) => (r.detail_json === null ? {} : (JSON.parse(r.detail_json) as Record<string, unknown>))
  );
}

const walk = path.join(root, 'indexer-walk');
generateFixture('indexer-walk', walk);
const { store, global } = newStores('walk');
process.on('exit', () => {
  store.close();
  global.close();
});
let indexed: Promise<void> | undefined;
/** The first index of indexer-walk, shared by the cases below (each test awaits it). */
function firstIndex(): Promise<void> {
  indexed ??= index(store, global, walk);
  return indexed;
}

test('T-14-3: tracked-and-ignored files are zone generated with the ignore-match evidence; an untracked ignored file is not indexed', async () => {
  await firstIndex();
  assert.equal(meta(store, 'walk_mode'), 'git', 'walk_mode for a git checkout');
  for (const p of ['dist/a.js', 'src/api.gen.ts']) {
    const row = file(store, p);
    assert.ok(row !== undefined, `${p} lacks its files row`);
    assert.equal(row.zone, 'generated', `${p} is not zone generated`);
    assert.equal(row.zone_evidence, 'tracked file matches an ignore pattern', `${p} zone evidence does not name the ignore match`);
  }
  assert.equal(file(store, 'dist/b.js'), undefined, 'the untracked ignored dist/b.js is indexed');
});

test('T-14-3: a tracked file deleted from the working tree keeps its row with in_tree = 0 and its history pair', async () => {
  await firstIndex();
  const gone = file(store, 'gone.ts');
  assert.ok(gone !== undefined, 'gone.ts row is deleted');
  assert.equal(gone.in_tree, 0, 'gone.ts has in_tree = 1');
  assert.ok(pairExists(store, 'gone.ts', 'src/k.ts'), 'the gone.ts / src/k.ts pair is deleted');
});

test('T-14-3: non-UTF-8 paths get no row and one path_not_utf8 fault (writer indexer) with count 2', async () => {
  await firstIndex();
  const bad = store.prepare("SELECT path FROM files WHERE path LIKE 'bad%'").all() as { path: string }[];
  assert.deepEqual(bad, [], 'a bad\\x.. file has a row');
  const fromIndexer = faultDetails(store, 'path_not_utf8').filter((d) => d.writer === 'indexer');
  assert.equal(fromIndexer.length, 1, 'the indexer path_not_utf8 fault is absent (or reported more than once)');
  assert.equal(fromIndexer[0]?.count, INDEXER_WALK.badNames.length, 'the path_not_utf8 fault reports count != 2');
});

function testMapRows(st: Store): string[] {
  return (
    st
      .prepare('SELECT f.path AS test, m.region_glob AS region, m.source AS source FROM test_map m JOIN files f ON f.id = m.test_file')
      .all() as { test: string; region: string; source: string }[]
  ).map((r) => `${r.test} -> ${r.region} (${r.source})`);
}

test('T-14-3: test_map holds the same_dir convention', async () => {
  await firstIndex();
  const rows = testMapRows(store);
  assert.ok(rows.includes('pkg/x_test.go -> pkg/x.go (same_dir)'), `test_map lacks pkg/x_test.go -> pkg/x.go (same_dir); has ${JSON.stringify(rows)}`);
});

test('T-14-3: a 20,001-line file under 1 MB is path-only with cap lines', async () => {
  await firstIndex();
  const size = statSync(path.join(walk, INDEXER_WALK.longPath)).size;
  assert.ok(size < 1_000_000, `precondition: ${INDEXER_WALK.longPath} is under 1 MB (${size} bytes)`);
  const row = file(store, INDEXER_WALK.longPath);
  assert.ok(row !== undefined, `${INDEXER_WALK.longPath} lacks its files row`);
  assert.equal(symbolCount(store, row.id), 0, `${INDEXER_WALK.longPath} was parsed`);
  const f = faultDetails(store, 'index_path_only_oversize').filter((d) => d.path === INDEXER_WALK.longPath);
  assert.equal(f.length, 1, `${INDEXER_WALK.longPath} has no index_path_only_oversize fault`);
  assert.equal(f[0]?.cap, 'lines', `the ${INDEXER_WALK.longPath} fault lacks cap: 'lines'`);
});

test('T-14-3: after src/k.ts is deleted and re-indexed its row is kept with in_tree = 0 and no symbols', async () => {
  await firstIndex();
  const before = file(store, 'src/k.ts');
  assert.ok(before !== undefined && before.in_tree === 1, 'precondition: src/k.ts is in the tree');
  rmSync(path.join(walk, 'src', 'k.ts'));
  await index(store, global, walk);
  const after = file(store, 'src/k.ts');
  assert.ok(after !== undefined, 'src/k.ts row is deleted');
  assert.equal(after.in_tree, 0, 'src/k.ts row is not in_tree = 0');
  assert.equal(symbolCount(store, after.id), 0, 'src/k.ts keeps symbols rows');
  assert.ok(pairExists(store, 'gone.ts', 'src/k.ts'), 'the gone.ts / src/k.ts pair is deleted');
});

// --- Step 15 subtests: indexed with defaultFrontends(tuning) on their own copy.

const walk15 = path.join(root, 'indexer-walk-15');
let s15: { store: Store; global: Store } | undefined;
let indexed15: Promise<void> | undefined;
function frontendIndex(): Promise<{ store: Store; global: Store }> {
  indexed15 ??= (async () => {
    generateFixture('indexer-walk', walk15);
    s15 = newStores('walk-15');
    await index(s15.store, s15.global, walk15, true);
  })();
  return indexed15.then(() => s15 as { store: Store; global: Store });
}
process.on('exit', () => {
  s15?.store.close();
  s15?.global.close();
});

test('T-14-3 (Step 15): test_map holds the import_edge rows of the TypeScript and Python test files', async () => {
  const s = await frontendIndex();
  const rows = testMapRows(s.store);
  for (const expected of ['src/a.test.ts -> src/a.ts (import_edge)', 'tests/test_b.py -> b.py (import_edge)']) {
    assert.ok(rows.includes(expected), `test_map lacks ${expected}; has ${JSON.stringify(rows)}`);
  }
});

test('T-14-3 (Step 15): src/k.ts has symbols rows before its deletion', async () => {
  const s = await frontendIndex();
  const k = file(s.store, 'src/k.ts');
  assert.ok(k !== undefined && k.in_tree === 1, 'src/k.ts is not in the tree');
  assert.ok(symbolCount(s.store, k.id) > 0, 'src/k.ts has no symbols row before its deletion');
});

test('T-14-3: indexer-nongit walks by readdir, skips node_modules/ and .git/, and does not throw', async () => {
  const nongit = path.join(root, 'indexer-nongit');
  generateFixture('indexer-nongit', nongit);
  const s = newStores('nongit');
  try {
    await index(s.store, s.global, nongit);
    assert.equal(meta(s.store, 'walk_mode'), 'readdir', 'indexer-nongit records walk_mode other than readdir');
    assert.ok(file(s.store, 'a.ts') !== undefined, 'a.ts lacks its files row');
    const walked = (s.store.prepare('SELECT path FROM files ORDER BY path').all() as { path: string }[]).map((r) => r.path);
    assert.deepEqual(walked.filter((p) => p.startsWith('node_modules/')), [], 'node_modules/ is walked in indexer-nongit');
    assert.deepEqual(walked.filter((p) => p.startsWith('.git/')), [], '.git/ is walked in indexer-nongit');
  } finally {
    s.store.close();
    s.global.close();
  }
});
