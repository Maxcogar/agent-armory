// T-14-1 — Indexer skeleton on a small fixture repo (Step 14).
//
// Integration: real `node:sqlite`; fixtures `indexer-small` and
// `over-threshold-file`; no doubles. Every run passes the empty frontend list
// (D-plan-29); the base run is under `fts: true`, and the whole run is repeated
// on a store migrated with `fts: false`. Technique: equivalence partitioning
// over language/size/secret classes; state-transition (run -> unchanged re-run
// -> concurrent claim); two-process race.
//
// Expected per-file values come from the fixtures (test/fixtures/generate.ts)
// and Step 14's stated rules: zone `generated` for the marker-comment file
// (a `@generated`/`DO NOT EDIT` marker in the head 2 KB), `source` otherwise;
// path tokens = AD-2's tokenizer over the path (NFKD, lowercase, marks
// dropped, split on non-letter/digit runs); `fts_paths.tokens` = those tokens
// joined by one space; the > 1 MB file path-only with
// `index_path_only_oversize` `{path, bytes, lines: null, cap: 'bytes'}`.
//
// The unchanged re-run: a per-table snapshot (every row, ordered by rowid — the
// primary key of every snapshotted table) of `files`, `symbols`,
// `import_edges`, `symbol_refs`, `test_map`, `path_tokens`, `symbol_tokens`,
// and under `fts: true` `fts_paths` and `fts_symbols`, before and after the
// second run, with `entry_score` compared per `files` row; `schema_meta` and
// `faults` are excluded (every run writes the claim and the final schema_meta
// rows).
//
// The refusal: a claim held by a live child the test keeps alive, planted
// before `runIndex`; the run must resolve to `{refused: 'reindex_locked'}`,
// record the fault, and write no snapshotted row.
//
// The race: a planted stale claim (`schema_meta.reindex_owner_pid` holding the
// pid of a process that has exited), re-planted before each of 50 iterations,
// raced by two real child processes started behind a start barrier (each opens
// the store, reports ready, and waits for one stdin line), each calling
// `acquireReindexClaim` directly and reporting whether it acquired; each holds
// any acquired claim until both have reported (a barrier file the parent
// creates), then calls `releaseReindexClaim`. The children are inline
// ES-module scripts run by `node --input-type=module -e` over the built
// `dist/src` modules (T-14-1 names no worker file).

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { runIndex } from '../../src/index/indexer.js';
import { pathSearch } from '../../src/index/search.js';
import { generateFixture, INDEXER_SMALL } from '../fixtures/generate.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const distSrc = path.resolve(here, '..', '..', 'src');
const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-indexer-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const diag = path.join(root, 'diagnostics');

const small = path.join(root, 'indexer-small');
generateFixture('indexer-small', small);
const over = path.join(root, 'over-threshold-file');
generateFixture('over-threshold-file', over);

interface Dbs {
  project: string;
  global: string;
}

function newDbs(name: string, fts: boolean): Dbs {
  const project = path.join(root, `${name}.db`);
  const global = path.join(root, `${name}-global.db`);
  const p = openStore(project);
  applyMigrations(p, { fts });
  p.close();
  const g = openStore(global);
  applyMigrations(g, { fts: false, scope: 'global' });
  seedDefaults(g);
  g.close();
  return { project, global };
}

async function index(store: Store, dbs: Dbs, repo: string): Promise<unknown> {
  const global = openStore(dbs.global);
  try {
    const tuning = tuningReader(global, path.basename(repo), () => {});
    return await runIndex(store, repo, { full: false, frontends: [], tuning, diagnosticsDir: diag });
  } finally {
    global.close();
  }
}

const DATA_TABLES = ['files', 'symbols', 'import_edges', 'symbol_refs', 'test_map', 'path_tokens', 'symbol_tokens'];
const FTS_TABLES = ['fts_paths', 'fts_symbols'];

/** Every row of the index's data tables, ordered by rowid (T-14-1's per-table snapshot). */
function snapshot(store: Store, fts: boolean): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const t of fts ? [...DATA_TABLES, ...FTS_TABLES] : DATA_TABLES) {
    out[t] = (store.prepare(`SELECT rowid AS _rowid_, * FROM "${t}" ORDER BY rowid`).all() as Record<string, unknown>[]).map((r) =>
      JSON.stringify(r, (_k, v: unknown) => (v instanceof Uint8Array ? Buffer.from(v).toString('hex') : v))
    );
  }
  return out;
}

function count(store: Store, sql: string, ...args: (string | number)[]): number {
  return (store.prepare(sql).get(...args) as { n: number }).n;
}

function meta(store: Store, key: string): string | undefined {
  const row = store.prepare('SELECT value FROM schema_meta WHERE key = ?').get(key) as { value: string | null } | undefined;
  return row?.value ?? undefined;
}

function faults(store: Store, code: string): unknown[] {
  return (store.prepare('SELECT detail_json FROM faults WHERE code = ? ORDER BY id').all(code) as { detail_json: string | null }[]).map((r) =>
    r.detail_json === null ? null : (JSON.parse(r.detail_json) as unknown)
  );
}

interface Expected {
  zone: string;
  /** AD-2's tokenizer over the path, in order (fts_paths.tokens joins these by one space). */
  tokens: string[];
}

const SMALL: Record<string, Expected> = {
  'README.md': { zone: 'source', tokens: ['readme', 'md'] },
  'big.txt': { zone: 'source', tokens: ['big', 'txt'] },
  'scripts/gen.sh': { zone: 'generated', tokens: ['scripts', 'gen', 'sh'] },
  'src/app.ts': { zone: 'source', tokens: ['src', 'app', 'ts'] },
  'src/util.ts': { zone: 'source', tokens: ['src', 'util', 'ts'] },
  'test/util.test.ts': { zone: 'source', tokens: ['test', 'util', 'test', 'ts'] },
  'tool.py': { zone: 'source', tokens: ['tool', 'py'] },
};

const OVER: Record<string, Expected> = {
  'big.txt': { zone: 'source', tokens: ['big', 'txt'] },
  'small.ts': { zone: 'source', tokens: ['small', 'ts'] },
};

/** Every Step 14 property T-14-1 pins on one indexed store. */
function baseChecks(store: Store, dbPath: string, fts: boolean, expected: Record<string, Expected>, oversize: { path: string; bytes: number }, secret?: string): void {
  for (const [p, e] of Object.entries(expected)) {
    const row = store.prepare('SELECT id, zone, in_tree FROM files WHERE path = ?').get(p) as { id: number; zone: string; in_tree: number } | undefined;
    assert.ok(row !== undefined, `${p} lacks its files row`);
    assert.equal(row.in_tree, 1, `${p} is not in_tree = 1`);
    assert.equal(row.zone, e.zone, `${p} zone`);
    const tokens = (store.prepare('SELECT token FROM path_tokens WHERE file_id = ? ORDER BY token').all(row.id) as { token: string }[]).map((r) => r.token);
    assert.deepEqual(tokens, [...new Set(e.tokens)].sort(), `${p} lacks its path_tokens rows (one per distinct token)`);
    if (fts) {
      const f = store.prepare('SELECT tokens FROM fts_paths WHERE file_id = ?').all(row.id) as { tokens: string }[];
      assert.deepEqual(
        f.map((r) => r.tokens),
        [e.tokens.join(' ')],
        `${p} lacks its one fts_paths row holding its tokens joined by one space`
      );
    }
  }
  if (fts) {
    assert.equal(count(store, 'SELECT count(*) AS n FROM fts_paths'), count(store, 'SELECT count(*) AS n FROM files'), 'fts_paths row count != files row count');
  }
  assert.equal(count(store, 'SELECT count(*) AS n FROM symbols'), 0, 'a symbols row exists under the empty frontend list');
  assert.equal(count(store, 'SELECT count(*) AS n FROM import_edges'), 0, 'an import_edges row exists under the empty frontend list');

  const over = faults(store, 'index_path_only_oversize');
  assert.deepEqual(over, [{ path: oversize.path, bytes: oversize.bytes, lines: null, cap: 'bytes' }], 'the > 1 MB file is not path-only with its oversize fault');

  if (secret !== undefined) {
    const leaks: string[] = [];
    const tables = (store.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map((r) => r.name);
    for (const t of tables) {
      const rows = store.prepare(`SELECT * FROM "${t}"`).all();
      const text = JSON.stringify(rows, (_k, v: unknown) => (v instanceof Uint8Array ? Buffer.from(v).toString('latin1') : v));
      if (text.includes(secret)) leaks.push(`table ${t}`);
    }
    for (const f of [dbPath, `${dbPath}-wal`]) {
      if (existsSync(f) && readFileSync(f).includes(Buffer.from(secret))) leaks.push(`file ${path.basename(f)}`);
    }
    assert.deepEqual(leaks, [], 'the planted secret appears verbatim in the store');
    const ev = store.prepare('SELECT zone_evidence FROM files WHERE path = ?').get(INDEXER_SMALL.markerPath) as { zone_evidence: string | null };
    assert.ok(ev.zone_evidence !== null && ev.zone_evidence !== '', 'the marker file records its zone evidence');
  }
}

const PATH_QUERIES = ['readme', 'md', 'big', 'txt', 'scripts', 'gen', 'sh', 'src', 'app', 'ts', 'util', 'test', 'tool', 'py'];

test('T-14-1: indexer-small and over-threshold-file under fts: true — files, zones, path tokens, no symbols, path-only oversize, no secret', async () => {
  const dbs = newDbs('small-fts', true);
  const store = openStore(dbs.project);
  try {
    await index(store, dbs, small);
    assert.equal(meta(store, 'reindex_owner_pid'), undefined, 'a reindex_owner_pid row survives a completed runIndex');
    baseChecks(store, dbs.project, true, SMALL, { path: INDEXER_SMALL.bigPath, bytes: INDEXER_SMALL.bigBytes }, INDEXER_SMALL.secret);
  } finally {
    store.close();
  }
  const odbs = newDbs('over-fts', true);
  const ostore = openStore(odbs.project);
  try {
    await index(ostore, odbs, over);
    baseChecks(ostore, odbs.project, true, OVER, { path: 'big.txt', bytes: 1_100_000 + '\nSEEDED_FACT\n'.length });
  } finally {
    ostore.close();
  }
});

test('T-14-1: the whole run repeated under fts: false — same properties, and pathSearch returns the fts: true hit sets', async () => {
  const ftsDbs = newDbs('small-cmp-fts', true);
  const fbDbs = newDbs('small-cmp-fallback', false);
  const ftsStore = openStore(ftsDbs.project);
  const fbStore = openStore(fbDbs.project);
  try {
    await index(ftsStore, ftsDbs, small);
    await index(fbStore, fbDbs, small);
    baseChecks(fbStore, fbDbs.project, false, SMALL, { path: INDEXER_SMALL.bigPath, bytes: INDEXER_SMALL.bigBytes }, INDEXER_SMALL.secret);
    const differ: string[] = [];
    for (const q of PATH_QUERIES) {
      const a = pathSearch(ftsStore, [q]).map((h) => h.path).sort();
      const b = pathSearch(fbStore, [q]).map((h) => h.path).sort();
      if (JSON.stringify(a) !== JSON.stringify(b)) differ.push(`${q}: fts5 ${JSON.stringify(a)} vs fallback ${JSON.stringify(b)}`);
      assert.ok(a.length > 0, `precondition: the path-token query ${q} hits a fixture path`);
    }
    assert.deepEqual(differ, [], 'pathSearch hit sets differ between fts: true and fts: false');
  } finally {
    ftsStore.close();
    fbStore.close();
  }
});

test('T-14-1: a second run over an unchanged tree changes no row of the index data tables and no entry_score (N4)', async () => {
  const dbs = newDbs('small-rerun', true);
  const store = openStore(dbs.project);
  try {
    await index(store, dbs, small);
    const before = snapshot(store, true);
    const scores = store.prepare('SELECT id, path, entry_score FROM files ORDER BY id').all();
    await index(store, dbs, small);
    assert.deepEqual(store.prepare('SELECT id, path, entry_score FROM files ORDER BY id').all(), scores, 'entry_score changed on an unchanged tree');
    assert.deepEqual(snapshot(store, true), before, 'the second run changed, added, or removed a row of the index data tables');
  } finally {
    store.close();
  }
});

/** Spawn a process, return its pid once it has exited (a pid no live process holds). */
async function exitedPid(): Promise<number> {
  const child = spawn(process.execPath, ['-e', ''], { stdio: 'ignore' });
  const pid = child.pid;
  await new Promise<void>((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', () => resolve());
  });
  assert.ok(pid !== undefined);
  return pid;
}

test("T-14-1: with a live process holding the claim, runIndex resolves to {refused: 'reindex_locked'}, records the fault, and writes no index row", async () => {
  const dbs = newDbs('small-held', true);
  const store = openStore(dbs.project);
  const holder = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1 << 30)'], { stdio: 'ignore' });
  try {
    assert.ok(holder.pid !== undefined);
    store.prepare("INSERT INTO schema_meta(key, value) VALUES('reindex_owner_pid', ?)").run(String(holder.pid));
    const before = snapshot(store, true);
    const result = await index(store, dbs, small);
    assert.deepEqual(result, { refused: 'reindex_locked' }, 'runIndex under a live claim resolves to something other than {refused}');
    assert.equal(faults(store, 'reindex_locked').length, 1, 'the refused run records no reindex_locked fault');
    assert.deepEqual(snapshot(store, true), before, 'the refused run wrote a row of the index data tables');
  } finally {
    holder.kill('SIGKILL');
    store.close();
  }
});

const CHILD = `
import { existsSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
const cfg = JSON.parse(process.env.T141_CFG);
const { openStore } = await import(cfg.adapter);
const { acquireReindexClaim, releaseReindexClaim } = await import(cfg.indexer);
const store = openStore(cfg.project, { busyTimeoutMs: 5000 });
process.stdout.write('ready\\n');
await new Promise((resolve) => process.stdin.once('data', resolve));
const r = acquireReindexClaim(store);
process.stdout.write(JSON.stringify({ acquired: r.acquired === true }) + '\\n');
while (!existsSync(cfg.barrier)) await delay(1);
releaseReindexClaim(store);
store.close();
process.exit(0);
`;

interface Racer {
  ready: Promise<void>;
  report: Promise<{ acquired: boolean }>;
  exit: Promise<{ code: number | null; stderr: string }>;
  go(): void;
}

function startRacer(dbs: Dbs, barrier: string): Racer {
  const cfg = {
    adapter: pathToFileURL(path.join(distSrc, 'stores', 'adapter.js')).href,
    indexer: pathToFileURL(path.join(distSrc, 'index', 'indexer.js')).href,
    project: dbs.project,
    barrier,
  };
  const child = spawn(process.execPath, ['--input-type=module', '-e', CHILD], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, T141_CFG: JSON.stringify(cfg) },
  });
  let stderr = '';
  child.stderr.on('data', (d: Buffer) => {
    stderr += d.toString('utf8');
  });
  const exit = new Promise<{ code: number | null; stderr: string }>((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code, stderr }));
  });
  let out = '';
  const lines: ((line: string) => void)[] = [];
  child.stdout.on('data', (d: Buffer) => {
    out += d.toString('utf8');
    let nl: number;
    while ((nl = out.indexOf('\n')) >= 0) {
      const line = out.slice(0, nl);
      out = out.slice(nl + 1);
      lines.shift()?.(line);
    }
  });
  const next = (): Promise<string> =>
    new Promise((resolve, reject) => {
      lines.push(resolve);
      void exit.then((e) => reject(new Error(`racer exited early (code ${e.code}): ${e.stderr}`)));
    });
  const ready = next().then(() => undefined);
  const report = ready.then(() => next()).then((l) => JSON.parse(l) as { acquired: boolean });
  return { ready, report, exit, go: () => child.stdin.end('go\n') };
}

test('T-14-1: two real processes calling acquireReindexClaim on a stale claim yield exactly one owner, 50 iterations', async () => {
  const dbs = newDbs('small-race', true);
  const store = openStore(dbs.project);
  const failures: string[] = [];
  try {
    for (let i = 1; i <= 50; i++) {
      const barrier = path.join(root, `race-barrier-${i}`);
      const stale = await exitedPid();
      store.prepare("INSERT OR REPLACE INTO schema_meta(key, value) VALUES('reindex_owner_pid', ?)").run(String(stale));
      const a = startRacer(dbs, barrier);
      const b = startRacer(dbs, barrier);
      let reports: { acquired: boolean }[];
      try {
        await Promise.all([a.ready, b.ready]);
        a.go();
        b.go();
        reports = await Promise.all([a.report, b.report]);
      } catch (e) {
        writeFileSync(barrier, '');
        await Promise.all([a.exit, b.exit]);
        failures.push(`iteration ${i}: ${(e as Error).message}`);
        break;
      }
      writeFileSync(barrier, '');
      const [ea, eb] = await Promise.all([a.exit, b.exit]);
      if (ea.code !== 0 || eb.code !== 0) failures.push(`iteration ${i}: a child failed (codes ${ea.code}, ${eb.code}): ${ea.stderr}${eb.stderr}`);
      const owners = reports.filter((r) => r.acquired).length;
      if (owners === 2) failures.push(`iteration ${i}: both children acquired the claim`);
      if (owners === 0) failures.push(`iteration ${i}: neither child acquired the claim`);
      const left = meta(store, 'reindex_owner_pid');
      if (left !== undefined) failures.push(`iteration ${i}: the claim row survives the acquiring child's releaseReindexClaim (${left})`);
    }
  } finally {
    store.close();
  }
  assert.deepEqual(failures, []);
});
