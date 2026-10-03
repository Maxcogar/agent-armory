// T-14-6 — Every input of a file's derived rows (frontend set, appearing and
// disappearing files), atomic absence, `init` failure (Step 14; Step 14 build
// review S1, S2, M5, m5, m6, and the self-import rule; AD-12 as amended at
// 0528470).
//
// Integration: real `git`, filesystem, `node:sqlite`; no doubles. Where a case
// needs symbols or edges it passes `tsLike` — a minimal frontend written to
// Step 14's LanguageFrontend interface, as test/unit/indexer_review.test.ts
// does (`export function <name>` symbols, `from '<specifier>'` imports, a
// relative resolver answering `resolved` only for a present target, or for
// any target with `resolveAll`), carrying `version` ('v1' unless the case says
// otherwise). It is an input of `runIndex` under D-plan-29, not a double. The
// skeleton `genericFrontend` is the generic frontend. The M5 case plants a
// SQLite TEMP trigger on the store's own connection — fault injection into the
// real store. Technique: state-transition (index -> changed input -> index)
// over the frontend set, the present set, and a failing chunk; error guessing.
//
// The fingerprint formula is the plan's: sha256Hex of the JSON.stringify array
// of [lang, capabilities.symbols, capabilities.imports, version], one entry per
// frontend passed (less any disabled by a rejected init), sorted by lang then
// version.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { runIndex, type IndexResult, type RunIndexResult } from '../../src/index/indexer.js';
import { genericFrontend } from '../../src/index/generic_frontend.js';
import type { LanguageFrontend } from '../../src/index/frontend.js';
import { sha256Hex } from '../../src/util/hash.js';
import { fixtureCommit, fixtureGit, fixtureInit } from '../fixtures/generate.js';

const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-inputs-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const diag = path.join(root, 'diagnostics');
let seq = 0;

interface Env {
  store: Store;
  global: Store;
  close(): void;
}

function stores(fts = true): Env {
  seq += 1;
  const store = openStore(path.join(root, `s${seq}.db`));
  applyMigrations(store, { fts });
  const global = openStore(path.join(root, `s${seq}-global.db`));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  return {
    store,
    global,
    close() {
      store.close();
      global.close();
    },
  };
}

function repo(files: Record<string, string>): string {
  seq += 1;
  const dir = path.join(root, `r${seq}`);
  fixtureInit(dir);
  fixtureCommit(
    dir,
    Object.entries(files).map(([p, content]) => ({ path: p, content })),
    { message: 'inputs fixture', day: 0 }
  );
  return dir;
}

function plainDir(files: Record<string, string>): string {
  seq += 1;
  const dir = path.join(root, `d${seq}`);
  for (const [p, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, p)), { recursive: true });
    writeFileSync(path.join(dir, p), content);
  }
  return dir;
}

function run(env: Env, dir: string, frontends: LanguageFrontend[]): Promise<RunIndexResult> {
  const tuning = tuningReader(env.global, 'inputs', () => {});
  return runIndex(env.store, dir, { full: false, frontends, tuning, diagnosticsDir: diag });
}

async function index(env: Env, dir: string, frontends: LanguageFrontend[]): Promise<IndexResult> {
  const r = await run(env, dir, frontends);
  assert.ok(!('refused' in r), 'precondition: the run was not refused');
  return r;
}

/** The review's minimal frontend (test/unit/indexer_review.test.ts), with a `version`. */
function tsLike(resolveAll = false, version = 'v1'): LanguageFrontend {
  return {
    lang: 'typescript',
    capabilities: { symbols: true, imports: true },
    version,
    async init() {},
    parse(_p, content) {
      const text = content.toString('utf8');
      const symbols = [...text.matchAll(/export function (\w+)/g)].map((m) => ({
        name: m[1] as string,
        kind: 'function',
        spanStart: m.index,
        spanEnd: m.index + m[0].length,
      }));
      const imports = [...text.matchAll(/from '([^']+)'/g)].map((m) => ({ specifier: m[1] as string, kind: 'import' }));
      return { ok: true, symbols, imports };
    },
    resolve(from, spec, files) {
      if (!spec.startsWith('.')) return { kind: 'external' };
      const dst = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec)).replace(/\.js$/, '.ts');
      return resolveAll || files.has(dst) ? { kind: 'resolved', dst } : { kind: 'unresolved' };
    },
  };
}

function fingerprintOf(frontends: LanguageFrontend[]): string {
  const entries = frontends
    .map((f) => [f.lang, f.capabilities.symbols, f.capabilities.imports, f.version] as [string, boolean, boolean, string])
    .sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[3] < y[3] ? -1 : x[3] > y[3] ? 1 : 0));
  return sha256Hex(JSON.stringify(entries));
}

function meta(s: Store, key: string): string | undefined {
  const r = s.prepare('SELECT value FROM schema_meta WHERE key = ?').get(key) as { value: string | null } | undefined;
  return r?.value ?? undefined;
}

function langCaps(s: Store): Record<string, Record<string, unknown>> {
  const v = meta(s, 'lang_capabilities');
  return v === undefined ? {} : (JSON.parse(v) as Record<string, Record<string, unknown>>);
}

const edges = (s: Store): string[] =>
  (
    s
      .prepare('SELECT a.path AS s, b.path AS d FROM import_edges e JOIN files a ON a.id = e.src_file JOIN files b ON b.id = e.dst_file ORDER BY 1, 2')
      .all() as { s: string; d: string }[]
  ).map((r) => `${r.s} -> ${r.d}`);

const testMap = (s: Store): string[] =>
  (
    s.prepare('SELECT f.path AS t, m.region_glob AS g, m.source AS src FROM test_map m JOIN files f ON f.id = m.test_file ORDER BY 1, 2, 3').all() as {
      t: string;
      g: string;
      src: string;
    }[]
  ).map((r) => `${r.t} -> ${r.g} (${r.src})`);

const fileRow = (s: Store, p: string): { id: number; in_tree: number; entry_score: number; unresolved_imports: number } | undefined =>
  s.prepare('SELECT id, in_tree, entry_score, unresolved_imports FROM files WHERE path = ?').get(p) as never;

const symbolNames = (s: Store): string[] => (s.prepare('SELECT name FROM symbols ORDER BY name').all() as { name: string }[]).map((r) => r.name);

function rowsOf(s: Store, table: string): string[] {
  return (s.prepare(`SELECT rowid AS _rowid_, * FROM "${table}" ORDER BY rowid`).all() as Record<string, unknown>[]).map((r) => JSON.stringify(r));
}

// ---------------------------------------------------------------------------

test('T-14-6 (S1): a frontend-set change re-parses an unchanged tree; the fingerprint is stable and stored', async () => {
  const dir = repo({ 'src/a.ts': "import { b } from './b.js'; export function a() { b(); }\n", 'src/b.ts': 'export function b() {}\n' });
  const env = stores();
  try {
    await index(env, dir, []);
    assert.equal(meta(env.store, 'frontend_fingerprint'), fingerprintOf([]), 'the [] pass stores a fingerprint other than the formula');

    const v1 = [tsLike()];
    await index(env, dir, v1);
    assert.deepEqual(symbolNames(env.store), ['a', 'b'], 'the [tsLike()] pass leaves symbols other than a and b');
    assert.deepEqual(edges(env.store), ['src/a.ts -> src/b.ts'], 'the [tsLike()] pass leaves import_edges other than src/a.ts -> src/b.ts');
    assert.equal(langCaps(env.store).typescript?.resolved, 1, 'lang_capabilities.typescript.resolved != 1');
    assert.equal(meta(env.store, 'frontend_fingerprint'), fingerprintOf(v1), 'the [tsLike()] pass stores a fingerprint other than the formula');

    const v2 = [tsLike(false, 'v2')];
    const r2 = await index(env, dir, v2);
    assert.equal(r2.filesWritten, 2, "the 'v2' pass does not re-parse the unchanged tree");
    assert.equal(meta(env.store, 'frontend_fingerprint'), fingerprintOf(v2), "the 'v2' pass stores a fingerprint other than the formula");

    const before = ['symbols', 'import_edges', 'symbol_refs', 'test_map'].map((t) => rowsOf(env.store, t));
    const r3 = await index(env, dir, [tsLike(false, 'v2')]);
    assert.equal(r3.filesWritten, 0, "the repeated 'v2' pass writes files (the fingerprint is not stable)");
    assert.deepEqual(['symbols', 'import_edges', 'symbol_refs', 'test_map'].map((t) => rowsOf(env.store, t)), before, "the repeated 'v2' pass changes a derived row");
    assert.equal(meta(env.store, 'frontend_fingerprint'), fingerprintOf(v2));

    env.store.prepare("DELETE FROM schema_meta WHERE key = 'frontend_fingerprint'").run();
    const r4 = await index(env, dir, [tsLike(false, 'v2')]);
    assert.equal(r4.filesWritten, 2, 'the pass with the fingerprint key deleted writes other than 2 files');
    assert.equal(meta(env.store, 'frontend_fingerprint'), fingerprintOf(v2));
  } finally {
    env.close();
  }
});

test('T-14-6 (S1): on a readdir root (no index_head), a missing fingerprint beside in-tree rows makes the pass full', async () => {
  const dir = plainDir({ 'src/a.ts': "import { b } from './b.js'; export function a() { b(); }\n", 'src/b.ts': 'export function b() {}\n' });
  const env = stores();
  try {
    await index(env, dir, []);
    assert.equal(meta(env.store, 'index_head'), undefined, 'precondition: a readdir root stores no index_head');
    env.store.prepare("DELETE FROM schema_meta WHERE key = 'frontend_fingerprint'").run();
    const r = await index(env, dir, []);
    assert.equal(r.filesWritten, 2, 'the missing-fingerprint pass on a readdir root writes other than 2 files');
    assert.equal(meta(env.store, 'frontend_fingerprint'), fingerprintOf([]));
  } finally {
    env.close();
  }
});

/** The path-keyed snapshot of the S2 round trip. */
function roundTripSnapshot(s: Store): Record<string, string[]> {
  const files = (
    s.prepare('SELECT path, entry_score, unresolved_imports FROM files WHERE in_tree = 1 ORDER BY path').all() as {
      path: string;
      entry_score: number;
      unresolved_imports: number;
    }[]
  ).map((r) => `${r.path} entry_score=${r.entry_score} unresolved_imports=${r.unresolved_imports}`);
  const refs = (
    s
      .prepare(
        `SELECT sy.name AS name, sf.path AS sfile, rf.path AS rfile, r.ref_count AS n
         FROM symbol_refs r JOIN symbols sy ON sy.id = r.symbol_id
         JOIN files sf ON sf.id = sy.file_id JOIN files rf ON rf.id = r.src_file ORDER BY 1, 2, 3`
      )
      .all() as { name: string; sfile: string; rfile: string; n: number }[]
  ).map((r) => `${r.name}@${r.sfile} <- ${r.rfile} x${r.n}`);
  return { edges: edges(s), testMap: testMap(s), files, refs };
}

test('T-14-6 (S2): a branch round trip restores edges, test_map, entry_score and symbol_refs exactly', async () => {
  const dir = repo({
    'src/a.ts': "import { b } from './b.js'; export function a() { b(); }\n",
    'src/b.ts': 'export function b() {}\n',
    'src/b.test.ts': "import { b } from './b.js'; b();\n",
  });
  fixtureGit(dir, ['checkout', '-q', '-b', 'nob']);
  fixtureGit(dir, ['rm', '-q', 'src/b.ts']);
  fixtureGit(dir, ['commit', '-q', '-m', 'drop b'], { day: 1 });
  fixtureGit(dir, ['checkout', '-q', 'main']);
  const env = stores();
  const fe = [tsLike()];
  try {
    await index(env, dir, fe);
    const first = roundTripSnapshot(env.store);
    assert.ok(first.edges?.includes('src/a.ts -> src/b.ts'), `the first snapshot lacks src/a.ts -> src/b.ts: ${JSON.stringify(first.edges)}`);
    assert.ok(first.edges?.includes('src/b.test.ts -> src/b.ts'), `the first snapshot lacks src/b.test.ts -> src/b.ts: ${JSON.stringify(first.edges)}`);
    assert.ok(first.testMap?.includes('src/b.test.ts -> src/b.ts (import_edge)'), `the first snapshot lacks the test_map row: ${JSON.stringify(first.testMap)}`);
    assert.equal(fileRow(env.store, 'src/b.ts')?.entry_score, 2, "src/b.ts's entry_score is not 2");

    fixtureGit(dir, ['checkout', '-q', 'nob']);
    await index(env, dir, fe);
    assert.deepEqual(edges(env.store).filter((e) => e.endsWith('-> src/b.ts')), [], 'on nob an edge into src/b.ts remains');
    assert.equal(fileRow(env.store, 'src/a.ts')?.unresolved_imports, 1, 'on nob src/a.ts does not have unresolved_imports = 1');
    assert.equal(fileRow(env.store, 'src/b.test.ts')?.unresolved_imports, 1, 'on nob src/b.test.ts does not have unresolved_imports = 1');

    fixtureGit(dir, ['checkout', '-q', 'main']);
    await index(env, dir, fe);
    assert.deepEqual(roundTripSnapshot(env.store), first, 'after the return to main a snapshotted table or value differs from the first snapshot');
  } finally {
    env.close();
  }
});

test('T-14-6 (S2): a test written before its source maps once the source appears', async () => {
  const dir = repo({ 'src/foo.test.ts': "import { foo } from './foo.js'; foo();\n" });
  const env = stores();
  const fe = [tsLike()];
  try {
    await index(env, dir, fe);
    writeFileSync(path.join(dir, 'src', 'foo.ts'), 'export function foo() {}\n'); // untracked is enough (--others)
    await index(env, dir, fe);
    assert.ok(edges(env.store).includes('src/foo.test.ts -> src/foo.ts'), `import_edges lacks src/foo.test.ts -> src/foo.ts: ${JSON.stringify(edges(env.store))}`);
    assert.ok(testMap(env.store).includes('src/foo.test.ts -> src/foo.ts (import_edge)'), `test_map lacks src/foo.test.ts -> src/foo.ts: ${JSON.stringify(testMap(env.store))}`);
    assert.equal(fileRow(env.store, 'src/foo.test.ts')?.unresolved_imports, 0, 'src/foo.test.ts keeps unresolved_imports != 0');
    assert.equal(fileRow(env.store, 'src/foo.ts')?.entry_score, 1, "src/foo.ts's entry_score != 1");
  } finally {
    env.close();
  }
});

test('T-14-6 (m5): a resolved import whose target is not present counts unresolved and writes no edge', async () => {
  const dir = repo({ 'src/a.ts': "import { m } from './missing.js'; export function a() { m(); }\n" });
  const env = stores();
  try {
    await index(env, dir, [tsLike(true)]);
    const a = fileRow(env.store, 'src/a.ts');
    assert.ok(a !== undefined);
    assert.equal(
      (env.store.prepare('SELECT count(*) AS n FROM import_edges WHERE src_file = ?').get(a.id) as { n: number }).n,
      0,
      'an import_edges row exists for src/a.ts'
    );
    assert.equal(a.unresolved_imports, 1, "src/a.ts's unresolved_imports != 1");
    assert.equal(langCaps(env.store).typescript?.unresolved, 1, 'lang_capabilities.typescript.unresolved != 1');
  } finally {
    env.close();
  }
});

test('T-14-6 (self): a file importing itself counts the import resolved and writes no edge', async () => {
  // src/s.ts imports ./s.js; tsLike's resolver answers `resolved` with dst src/s.ts (the file is present).
  const dir = repo({ 'src/s.ts': "import { s } from './s.js'; export function s() {}\n" });
  const env = stores();
  try {
    await index(env, dir, [tsLike()]);
    assert.deepEqual(edges(env.store), [], 'an import_edges row src/s.ts -> src/s.ts exists');
    const r = fileRow(env.store, 'src/s.ts');
    assert.ok(r !== undefined, 'src/s.ts lacks its files row');
    assert.equal(r.unresolved_imports, 0, "src/s.ts's unresolved_imports != 0");
    // In-degree from the self-import would be 1; `s` is not an entry-marker stem, so entry_score is 0.
    assert.equal(r.entry_score, 0, "src/s.ts's in-degree or entry_score counts the self-import");
  } finally {
    env.close();
  }
});

/** Every derived row of file `id` (T-14-6 M5's list), by table. */
function derivedRows(s: Store, id: number): Record<string, number> {
  const c = (sql: string): number => (s.prepare(sql).get(id, id) as { n: number }).n;
  return {
    symbols: c('SELECT count(*) AS n FROM symbols WHERE file_id = ? OR file_id = ?'),
    symbol_tokens: c('SELECT count(*) AS n FROM symbol_tokens t JOIN symbols y ON y.id = t.symbol_id WHERE y.file_id = ? OR y.file_id = ?'),
    path_tokens: c('SELECT count(*) AS n FROM path_tokens WHERE file_id = ? OR file_id = ?'),
    import_edges: c('SELECT count(*) AS n FROM import_edges WHERE src_file = ? OR dst_file = ?'),
    symbol_refs: c('SELECT count(*) AS n FROM symbol_refs r JOIN symbols y ON y.id = r.symbol_id WHERE r.src_file = ? OR y.file_id = ?'),
    test_map: c('SELECT count(*) AS n FROM test_map WHERE test_file = ? OR test_file = ?'),
    fts_paths: c('SELECT count(*) AS n FROM fts_paths WHERE file_id = ? OR file_id = ?'),
    fts_symbols: c('SELECT count(*) AS n FROM fts_symbols WHERE file_id = ? OR file_id = ?'),
  };
}

const NONE = { symbols: 0, symbol_tokens: 0, path_tokens: 0, import_edges: 0, symbol_refs: 0, test_map: 0, fts_paths: 0, fts_symbols: 0 };

test('T-14-6 (M5): an absent file\'s in_tree = 0 commits with its derived-row deletes', async () => {
  const dir = repo({ 'src/x.ts': 'export function x() {}\n', 'src/y.ts': 'export function y() {}\n' });
  const env = stores(true);
  try {
    await index(env, dir, [tsLike()]);
    const y = fileRow(env.store, 'src/y.ts');
    assert.ok(y !== undefined, 'precondition: src/y.ts is indexed');
    rmSync(path.join(dir, 'src', 'x.ts'));
    rmSync(path.join(dir, 'src', 'y.ts'));
    env.store.exec(`CREATE TEMP TRIGGER m5_inject BEFORE DELETE ON path_tokens WHEN old.file_id = ${y.id} BEGIN SELECT RAISE(ABORT, 'injected'); END`);
    await assert.rejects(run(env, dir, [tsLike()]), /injected/, 'the injected pass resolves');
    env.store.exec('DROP TRIGGER m5_inject');

    const outOfTree = env.store.prepare('SELECT id, path FROM files WHERE in_tree = 0').all() as { id: number; path: string }[];
    for (const f of outOfTree) {
      assert.deepEqual(derivedRows(env.store, f.id), NONE, `${f.path} has in_tree = 0 but keeps derived rows after the injected pass`);
    }
    assert.equal(fileRow(env.store, 'src/y.ts')?.in_tree, 1, "src/y.ts has in_tree = 0 although its chunk rolled back");
    assert.equal(meta(env.store, 'reindex_owner_pid'), undefined, 'the reindex claim survives the injected pass');

    await index(env, dir, [tsLike()]);
    for (const p of ['src/x.ts', 'src/y.ts']) {
      const r = fileRow(env.store, p);
      if (r === undefined) continue; // swept: no row, so no derived rows either
      assert.equal(r.in_tree, 0, `${p} has in_tree = 1 after the last pass`);
      assert.deepEqual(derivedRows(env.store, r.id), NONE, `${p} keeps derived rows after the last pass`);
    }
  } finally {
    env.close();
  }
});

test('T-14-6 (m6): an init rejection disables one frontend for the pass and the pass completes', async () => {
  const files = { 'src/a.ts': "import { b } from './b.js';\nexport function a() {}\n", 'src/b.ts': 'export function b() {}\n' };
  const dir = repo(files);
  const broken: LanguageFrontend = { ...tsLike(), init: () => Promise.reject(new Error('grammar missing')) };
  const env = stores();
  try {
    await assert.doesNotReject(index(env, dir, [broken, genericFrontend]), 'the [broken, genericFrontend] pass rejects');
    const failed = (env.store.prepare("SELECT detail_json FROM faults WHERE code = 'frontend_parse_failed'").all() as { detail_json: string }[]).map(
      (r) => JSON.parse(r.detail_json) as unknown
    );
    assert.deepEqual(failed, [{ lang: 'typescript', error: 'grammar missing', phase: 'init' }], 'not exactly one frontend_parse_failed {lang, error, phase: init}');
    const a = fileRow(env.store, 'src/a.ts');
    assert.ok(a !== undefined);
    const aSyms = (env.store.prepare('SELECT name FROM symbols WHERE file_id = ?').all(a.id) as { name: string }[]).map((r) => r.name);
    assert.ok(aSyms.includes('a'), `src/a.ts lacks the generic frontend's a symbol: ${JSON.stringify(aSyms)}`);
    assert.deepEqual(edges(env.store), [], 'an import_edges row exists after the disabled-frontend pass');
    const ts = langCaps(env.store).typescript;
    assert.ok(ts !== undefined, 'lang_capabilities has no typescript record');
    assert.deepEqual({ frontend: ts.frontend, symbols: ts.symbols, imports: ts.imports }, { frontend: 'generic', symbols: true, imports: false }, 'lang_capabilities.typescript');

    const r = await index(env, dir, [tsLike(), genericFrontend]);
    assert.equal(r.filesWritten, 2, 'the following [tsLike(), genericFrontend] pass does not re-parse both files');
    assert.deepEqual(edges(env.store), ['src/a.ts -> src/b.ts'], 'the following pass does not yield src/a.ts -> src/b.ts');
    assert.equal(langCaps(env.store).typescript?.frontend, 'tree-sitter', "lang_capabilities.typescript.frontend != 'tree-sitter'");
  } finally {
    env.close();
  }

  const alone = stores();
  try {
    await assert.doesNotReject(index(alone, dir, [broken]), 'the [broken]-only pass rejects');
    assert.deepEqual(symbolNames(alone.store), [], 'the [broken]-only pass writes a symbols row');
    assert.equal(langCaps(alone.store).typescript?.frontend, 'path-only', "the [broken]-only pass records lang_capabilities.typescript.frontend other than 'path-only'");
  } finally {
    alone.close();
  }
});
