// T-14-7 — Bounded reads, GLOB-escaped regions, the comment-line marker, the
// walk's git environment, and walk errors (Step 14; Step 14 build review M1,
// M2, M3, m1, m2).
//
// Integration: real `git`, filesystem, `node:sqlite`, plus `classifyZone` and
// `walkRepository` called directly; no doubles. The M1 cases pass a minimal
// frontend (as in T-14-6: the review's `tsLike`, with `version`) whose `parse`
// of `a.ts` changes `b.ts` on disk — an input that makes the tree change
// during the pass, as an agent writing files does under the detached reindex.
// Technique: error guessing (TOCTOU, bracketed path, false-positive marker,
// hook environment); decision table over marker lines; boundary value
// (1,000,000 / 1,000,001 bytes).

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { appendFileSync, chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { testMapDao } from '../../src/stores/dao/test_map.js';
import { runIndex, type IndexResult, type RunIndexResult } from '../../src/index/indexer.js';
import { classifyZone } from '../../src/index/zone.js';
import { walkRepository } from '../../src/index/walk.js';
import type { LanguageFrontend } from '../../src/index/frontend.js';
import { fixtureCommit, fixtureGit, fixtureInit } from '../fixtures/generate.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..', '..', '..');
const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-reads-'));
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
    { message: 'reads fixture', day: 0 }
  );
  return dir;
}

function run(env: Env, dir: string, frontends: LanguageFrontend[]): Promise<RunIndexResult> {
  const tuning = tuningReader(env.global, 'reads', () => {});
  return runIndex(env.store, dir, { full: false, frontends, tuning, diagnosticsDir: diag });
}

async function index(env: Env, dir: string, frontends: LanguageFrontend[]): Promise<IndexResult> {
  const r = await run(env, dir, frontends);
  assert.ok(!('refused' in r), 'precondition: the run was not refused');
  return r;
}

/** The review's minimal frontend, with `version`, and an optional hook run on each parse. */
function tsLike(onParse?: (p: string, content: Buffer) => void): LanguageFrontend {
  return {
    lang: 'typescript',
    capabilities: { symbols: true, imports: true },
    version: 'v1',
    async init() {},
    parse(p, content) {
      onParse?.(p, content);
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
      return files.has(dst) ? { kind: 'resolved', dst } : { kind: 'unresolved' };
    },
  };
}

function meta(s: Store, key: string): string | undefined {
  const r = s.prepare('SELECT value FROM schema_meta WHERE key = ?').get(key) as { value: string | null } | undefined;
  return r?.value ?? undefined;
}

const fileRow = (s: Store, p: string): { id: number; in_tree: number } | undefined =>
  s.prepare('SELECT id, in_tree FROM files WHERE path = ?').get(p) as never;

const B_CONTENT = 'export function b() {}\n'; // 23 bytes

// ---------------------------------------------------------------------------
// M1 — the read is bounded by the descriptor, not by the earlier lstat.

test('T-14-7 (M1): a file grown past the cap after the lstat is path-only; no parse receives more than 1,000,000 bytes', async () => {
  assert.equal(Buffer.byteLength(B_CONTENT), 23);
  const dir = repo({ 'a.ts': 'export function a() {}\n', 'b.ts': B_CONTENT });
  const env = stores();
  let largest = 0;
  let grown = false;
  const fe = tsLike((p, content) => {
    largest = Math.max(largest, content.length);
    if (p === 'a.ts' && !grown) {
      grown = true;
      appendFileSync(path.join(dir, 'b.ts'), Buffer.alloc(5_000_000, 0x20));
    }
  });
  try {
    await index(env, dir, [fe]);
    assert.ok(grown, 'precondition: the parse of a.ts ran and grew b.ts');
    assert.ok(largest <= 1_000_000, `a parse call received ${largest} bytes (> 1,000,000)`);
    const b = fileRow(env.store, 'b.ts');
    assert.ok(b !== undefined, 'b.ts lacks its files row');
    assert.equal((env.store.prepare('SELECT count(*) AS n FROM symbols WHERE file_id = ?').get(b.id) as { n: number }).n, 0, 'b.ts is not path-only (it has symbols)');
    const f = (env.store.prepare("SELECT detail_json FROM faults WHERE code = 'index_path_only_oversize'").all() as { detail_json: string }[])
      .map((r) => JSON.parse(r.detail_json) as { path: string; cap: string; bytes: number })
      .filter((d) => d.path === 'b.ts');
    assert.ok(
      f.some((d) => d.cap === 'bytes' && d.bytes > 1_000_000),
      `no index_path_only_oversize fault names b.ts with cap 'bytes' and bytes > 1,000,000: ${JSON.stringify(f)}`
    );
  } finally {
    env.close();
  }
});

test('T-14-7 (M1): b.ts swapped to a symlink, then to a FIFO, after the lstat is absent and never parsed', { timeout: 20_000 }, async (t) => {
  const outside = path.join(root, 'outside-leak.ts');
  writeFileSync(outside, 'export function leak() {}\n');
  const dir = repo({ 'a.ts': 'export function a() {}\n', 'b.ts': B_CONTENT });
  const env = stores();
  let swap: 'link' | 'fifo' | null = 'link';
  // A synchronous open that blocks on a FIFO freezes this process's event loop,
  // so a node:test timeout cannot fire. The unblocker opens the FIFO
  // read-write after UNBLOCK_MS (on Linux that open does not block and counts
  // as a writer, releasing a blocked reader); a run that lasts that long
  // blocked on the open and fails the case instead of hanging it.
  const UNBLOCK_MS = 3000;
  let unblocker: ChildProcess | undefined;
  const fe = tsLike((p) => {
    if (p !== 'a.ts' || swap === null) return;
    const b = path.join(dir, 'b.ts');
    rmSync(b);
    if (swap === 'link') symlinkSync(outside, b);
    else {
      const r = spawnSync('mkfifo', [b]);
      assert.equal(r.status, 0, `mkfifo failed: ${r.stderr?.toString()}`);
      unblocker = spawn('sh', ['-c', `sleep ${UNBLOCK_MS / 1000}; exec 3<>"$1"; sleep 1`, 'sh', b], { stdio: 'ignore' });
    }
    swap = null;
  });
  const leaks = (): number => (env.store.prepare("SELECT count(*) AS n FROM symbols WHERE name = 'leak'").get() as { n: number }).n;
  try {
    await t.test('symlink run', { timeout: 10_000 }, async () => {
      await assert.doesNotReject(index(env, dir, [fe]), 'the symlink run rejects');
      assert.equal(leaks(), 0, 'a symbols row is named leak');
      assert.notEqual(fileRow(env.store, 'b.ts')?.in_tree, 1, 'b.ts has in_tree = 1 after the symlink run');
    });
    await t.test('FIFO run', { timeout: 10_000 }, async () => {
      // A second run: b.ts a regular file again and a.ts changed, so a.ts is re-parsed and swaps b.ts.
      rmSync(path.join(dir, 'b.ts'));
      writeFileSync(path.join(dir, 'b.ts'), B_CONTENT);
      writeFileSync(path.join(dir, 'a.ts'), 'export function a() {}\n// second run\n');
      swap = 'fifo';
      const started = Date.now();
      await assert.doesNotReject(index(env, dir, [fe]), 'the FIFO run rejects');
      const took = Date.now() - started;
      assert.ok(took < UNBLOCK_MS, `the FIFO run blocked on the open (${took} ms; released only by the unblocker)`);
      assert.equal(swap, null, 'precondition: the parse of a.ts ran and swapped b.ts to a FIFO');
      assert.equal(leaks(), 0, 'a symbols row is named leak');
      assert.notEqual(fileRow(env.store, 'b.ts')?.in_tree, 1, 'b.ts has in_tree = 1 after the FIFO run');
    });
  } finally {
    unblocker?.kill('SIGKILL');
    rmSync(path.join(dir, 'b.ts'), { force: true });
    env.close();
  }
});

// ---------------------------------------------------------------------------
// M2 — region_glob is a GLOB-escaped pattern.

test('T-14-7 (M2): bracketed and wildcard test paths map only themselves; the unchanged re-run writes no test_map row', async () => {
  const dir = repo({
    'app/[id]/page.ts': 'export function page() {}\n',
    'app/[id]/page.test.ts': "import { page } from './page.js';\n",
    'app/i/page.ts': 'export function page() {}\n',
    'lib/a*b.ts': 'export function ab() {}\n',
    'lib/a*b.test.ts': "import { ab } from './a*b.js';\n",
    'lib/axxb.ts': 'export function axxb() {}\n',
    'lib/a?b.ts': 'export function aqb() {}\n',
    'lib/a?b.test.ts': "import { aqb } from './a?b.js';\n",
    'lib/axb.ts': 'export function axb() {}\n',
  });
  const env = stores();
  try {
    await index(env, dir, [tsLike()]);
    const globs = (env.store.prepare('SELECT region_glob AS g FROM test_map ORDER BY g').all() as { g: string }[]).map((r) => r.g);
    assert.deepEqual(globs, ['app/[[]id]/page.ts', 'lib/a[*]b.ts', 'lib/a[?]b.ts'].sort(), 'a stored region_glob is not the escaped form');

    const tm = testMapDao(env.store);
    const pathOf = (id: number): string => (env.store.prepare('SELECT path FROM files WHERE id = ?').get(id) as { path: string }).path;
    const covering = (p: string): string[] => tm.coveringTests(p).map(pathOf).sort();
    assert.deepEqual(covering('app/[id]/page.ts'), ['app/[id]/page.test.ts']);
    assert.deepEqual(covering('lib/a*b.ts'), ['lib/a*b.test.ts']);
    assert.deepEqual(covering('lib/a?b.ts'), ['lib/a?b.test.ts']);
    assert.deepEqual(covering('app/i/page.ts'), [], 'coveringTests of app/i/page.ts returns a row');
    assert.deepEqual(covering('lib/axxb.ts'), [], 'coveringTests of lib/axxb.ts returns a row');
    assert.deepEqual(covering('lib/axb.ts'), [], 'coveringTests of lib/axb.ts returns a row');

    const before = (env.store.prepare('SELECT rowid AS _rowid_, * FROM test_map ORDER BY rowid').all() as unknown[]).map((r) => JSON.stringify(r));
    await index(env, dir, [tsLike()]);
    const after = (env.store.prepare('SELECT rowid AS _rowid_, * FROM test_map ORDER BY rowid').all() as unknown[]).map((r) => JSON.stringify(r));
    assert.deepEqual(after, before, 'the unchanged re-run writes a test_map row');
  } finally {
    env.close();
  }
});

// ---------------------------------------------------------------------------
// M3 — the marker matches only as a comment line.

test('T-14-7 (M3): the generated marker matches only as a comment line', () => {
  // zone.ts's own header line as it stands (read from the source, not copied).
  const zoneSrc = readFileSync(path.join(packageRoot, 'src', 'index', 'zone.ts'), 'utf8');
  const zoneLine = zoneSrc.split('\n').find((l) => /^\s*\/\/.*2\. a generated-file marker comment in the head 2 KB/.test(l));
  assert.ok(zoneLine !== undefined, "precondition: zone.ts's header line '2. a generated-file marker comment in the head 2 KB' exists");
  assert.ok(zoneLine.includes('@generated'), "precondition: zone.ts's header line names the tag");

  const cases: [string, string, 'generated' | 'source'][] = [
    ['Go convention', '// Code generated by stringer; DO NOT EDIT.\n', 'generated'],
    ['Go convention, CRLF', '// Code generated by stringer; DO NOT EDIT.\r\n', 'generated'],
    ['# @generated', '# @generated by scripts/gen.sh -- DO NOT EDIT\n', 'generated'],
    ['// @generated', '// @generated -- DO NOT EDIT\n', 'generated'],
    ['/* @generated */', '/* @generated */\n', 'generated'],
    [' * @generated', ' * @generated\n', 'generated'],
    ['<!-- @generated -->', '<!-- @generated -->\n', 'generated'],
    ['-- @generated', '-- @generated\n', 'generated'],
    ["zone.ts's header line", `${zoneLine}\n`, 'source'],
    ['owner-approval prose', '# DO NOT EDIT THIS FILE WITHOUT DIRECT OWNER APPROVAL\n', 'source'],
    ['string literal', 'const s = "@generated";\n', 'source'],
    ['Go line without the final period', '// Code generated by x. DO NOT EDIT\n', 'source'],
    ['@generatedFoo', '// @generatedFoo\n', 'source'],
    ['DO NOT EDIT alone', 'DO NOT EDIT\n', 'source'],
  ];
  const wrong = cases
    .map(([name, line, expected]) => ({ name, expected, got: classifyZone('src/f.ts', Buffer.from(`${line}x\n`), false).zone }))
    .filter((c) => c.got !== c.expected)
    .map((c) => `${c.name}: expected ${c.expected}, got ${c.got}`);
  assert.deepEqual(wrong, []);
});

// ---------------------------------------------------------------------------
// m1 — inherited repository variables do not redirect the walk or the miner.

test('T-14-7 (m1): inherited GIT_DIR / GIT_WORK_TREE / GIT_INDEX_FILE / GIT_OBJECT_DIRECTORY / GIT_COMMON_DIR do not redirect the walk or the miner', async () => {
  seq += 1;
  const a = path.join(root, `A${seq}`);
  fixtureInit(a);
  fixtureCommit(a, [{ path: 'a.ts', content: 'a1\n' }, { path: 'c.ts', content: 'c1\n' }], { message: 'a1', day: 0 });
  fixtureCommit(a, [{ path: 'a.ts', content: 'a2\n' }, { path: 'c.ts', content: 'c2\n' }], { message: 'a2', day: 1 });
  const aHashes = fixtureGit(a, ['rev-list', 'HEAD']).trim().split('\n').sort();
  const b = path.join(root, `B${seq}`);
  fixtureInit(b);
  fixtureCommit(b, [{ path: 'only-in-b.ts', content: 'b\n' }], { message: 'b', day: 0 });
  const env = stores();

  const names = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_COMMON_DIR'] as const;
  const saved = Object.fromEntries(names.map((k) => [k, process.env[k]]));
  try {
    process.env.GIT_DIR = path.join(b, '.git');
    process.env.GIT_WORK_TREE = b;
    process.env.GIT_INDEX_FILE = path.join(b, '.git', 'index');
    process.env.GIT_OBJECT_DIRECTORY = path.join(b, '.git', 'objects');
    process.env.GIT_COMMON_DIR = path.join(b, '.git');

    assert.deepEqual(walkRepository(a).paths, ['a.ts', 'c.ts'], 'walkRepository(A).paths is redirected');
    await index(env, a, []);
  } finally {
    for (const k of names) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
  try {
    assert.equal(fileRow(env.store, 'only-in-b.ts'), undefined, 'runIndex on A writes a files row for only-in-b.ts');
    const commits = (env.store.prepare('SELECT hash FROM commits ORDER BY hash').all() as { hash: string }[]).map((r) => r.hash);
    assert.deepEqual(commits, aHashes, "the commits rows are not exactly A's two hashes");
    const bPairs = env.store
      .prepare(
        "SELECT count(*) AS n FROM cochange_pairs p JOIN files fa ON fa.id = p.a JOIN files fb ON fb.id = p.b WHERE fa.path = 'only-in-b.ts' OR fb.path = 'only-in-b.ts'"
      )
      .get() as { n: number };
    assert.equal(bPairs.n, 0, 'a cochange_pairs row names only-in-b.ts');
  } finally {
    env.close();
  }
});

// ---------------------------------------------------------------------------
// m2 — an unreadable directory is skipped and counted.

const PATH_MAX = 4096;

test('T-14-7 (m2): an unreadable directory is skipped and counted in walkErrors and schema_meta.walk_errors; a missing root rejects', async () => {
  seq += 1;
  const dir = path.join(root, `m2-${seq}`);
  mkdirSync(path.join(dir, 'sub'), { recursive: true });
  writeFileSync(path.join(dir, 'ok.ts'), 'export function ok() {}\n');
  writeFileSync(path.join(dir, 'sub', 'deep.ts'), 'export function deep() {}\n');
  const env = stores();
  let restore: () => void = () => {};
  let failing: { path: string; code: string };
  try {
    await index(env, dir, []);

    if (process.getuid?.() !== 0) {
      chmodSync(path.join(dir, 'sub'), 0o000);
      restore = () => chmodSync(path.join(dir, 'sub'), 0o755);
      failing = { path: 'sub', code: 'EACCES' };
    } else {
      // As root permissions do not block: move sub/ under a chain of nested
      // directories whose absolute path exceeds PATH_MAX, built by renameSync
      // of already-nested directories so no single call's path exceeds it.
      const seg = (c: string): string => c.repeat(200);
      const chainA = Array.from({ length: 11 }, () => seg('d'));
      const chainB = Array.from({ length: 11 }, () => seg('e'));
      const aTop = path.join(dir, 'chain');
      const aDeep = path.join(aTop, ...chainA);
      mkdirSync(aDeep, { recursive: true });
      const staging = path.join(root, `stage${seq}`);
      const bDeep = path.join(staging, ...chainB);
      mkdirSync(bDeep, { recursive: true });
      renameSync(path.join(dir, 'sub'), path.join(bDeep, 'sub'));
      const bTopInA = path.join(aDeep, chainB[0] as string);
      renameSync(path.join(staging, chainB[0] as string), bTopInA);
      assert.ok(Buffer.byteLength(path.join(aDeep, ...chainB, 'sub')) > PATH_MAX, 'precondition: the moved directory is past PATH_MAX');
      // The ground truth for "the failing directory": the first directory on the chain the OS refuses to list.
      const rels = [...chainA, ...chainB, 'sub'].map((_, i, all) => ['chain', ...all.slice(0, i + 1)].join('/'));
      let found: { path: string; code: string } | undefined;
      for (const rel of ['chain', ...rels]) {
        try {
          readdirSync(path.join(dir, rel));
        } catch (e) {
          found = { path: rel, code: String((e as NodeJS.ErrnoException).code) };
          break;
        }
      }
      assert.ok(found !== undefined && found.code === 'ENAMETOOLONG', `precondition: a chain directory fails ENAMETOOLONG (${JSON.stringify(found)})`);
      failing = found;
      restore = () => {
        // bTopInA's own path is under PATH_MAX; moving it back out makes sub/ reachable by a short path again.
        renameSync(bTopInA, path.join(staging, chainB[0] as string));
        renameSync(path.join(bDeep, 'sub'), path.join(dir, 'sub'));
      };
    }

    const faultsBefore = (env.store.prepare('SELECT count(*) AS n FROM faults').get() as { n: number }).n;
    let second: IndexResult | undefined;
    await assert.doesNotReject(async () => {
      second = await index(env, dir, []);
    }, 'the pass with an unreadable directory rejects');
    assert.equal(second?.walkErrors, 1, 'IndexResult.walkErrors is not 1');
    const we = meta(env.store, 'walk_errors');
    assert.deepEqual(we === undefined ? undefined : JSON.parse(we), { count: 1, first: [failing] }, 'schema_meta.walk_errors is not {count: 1, first: [{path, code}]}');
    assert.equal(fileRow(env.store, 'ok.ts')?.in_tree, 1, 'ok.ts loses its row or in_tree = 1');
    assert.equal((env.store.prepare('SELECT count(*) AS n FROM faults').get() as { n: number }).n, faultsBefore, 'a fault is recorded for the walk error');

    restore();
    restore = () => {};
    await index(env, dir, []);
    assert.equal(meta(env.store, 'walk_errors'), undefined, 'a later pass with the directory readable again leaves schema_meta.walk_errors present');
  } finally {
    restore();
    env.close();
  }

  const missing = stores();
  try {
    await assert.rejects(run(missing, path.join(root, 'no-such-root'), []), 'the missing-root call resolves instead of rejecting');
  } finally {
    missing.close();
  }
});
