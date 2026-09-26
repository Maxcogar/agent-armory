// T-14-2 — `refreshIfStale` records `index_stale`, sets the flag, spawns nothing
// (Step 14; AD-17's detector as a pure store effect; D-plan-30's HEAD layouts).
//
// Integration: real `node:sqlite`; real `git`; no doubles. No child process is
// expected: an import scan of `dist/src/index/indexer.js` establishes that none
// can be started (it imports neither `dist/src/util/spawn.js` nor
// `child_process` under either spelling — T-5-3's scan), and the absence of any
// `schema_meta.reindex_owner_pid` row after each call establishes that none was
// (Step 14's claim is the trace a reindex child leaves).
//
// Data: `indexer-small` indexed (empty frontend list); one commit added (HEAD
// moves); `refreshIfStale(store, checkoutRoot, diagnosticsDir)` twice; `runIndex`; then
// `refreshIfStale` again — in four layouts: the ordinary checkout; with the
// branch ref packed (`git pack-refs --all`, its loose file gone); a detached
// HEAD (`git checkout --detach`); a linked worktree (`git worktree add`,
// checkoutRoot = the worktree's own root). Plus an unborn branch (`git init`
// with no commit). Technique: state-transition (fresh -> stale -> stale ->
// fresh) x equivalence partitioning over HEAD layouts.
//
// M4 cases (Step 14 build review): refreshIfStale five times on an unborn
// branch, then one commit there and one more call; and two planted reftable
// layouts of the ordinary checkout, each called three times.
//
// `refreshIfStale(store, checkoutRoot, diagnosticsDir)` gets a per-test
// temporary diagnostics directory (the JSONL mirror of its faults).

import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { refreshIfStale, runIndex } from '../../src/index/indexer.js';
import { generateFixture, fixtureGit, fixtureCommit, fixtureInit } from '../fixtures/generate.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const distSrc = path.resolve(here, '..', '..', 'src');
const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-stale-'));
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

async function index(store: Store, global: Store, checkoutRoot: string): Promise<void> {
  const tuning = tuningReader(global, 'indexer-small', () => {});
  await runIndex(store, checkoutRoot, { full: false, frontends: [], tuning, diagnosticsDir: diag });
}

function meta(store: Store, key: string): string | undefined {
  const row = store.prepare('SELECT value FROM schema_meta WHERE key = ?').get(key) as { value: string | null } | undefined;
  return row?.value ?? undefined;
}

function faultCount(store: Store, code?: string): number {
  return code === undefined
    ? (store.prepare('SELECT count(*) AS n FROM faults').get() as { n: number }).n
    : (store.prepare('SELECT count(*) AS n FROM faults WHERE code = ?').get(code) as { n: number }).n;
}

function totalChanges(store: Store): number {
  return (store.prepare('SELECT total_changes() AS n').get() as { n: number }).n;
}

// --- The import scan (T-5-3's specifier patterns, plus the spawn wrapper by resolved path).

const SPEC = `['"]([^'"]+)['"]`;
const STATIC_FROM = new RegExp(`(?:^|[^.\\w])(?:import|export)\\b[^;'"]*?\\bfrom\\s*${SPEC}`, 'g');
const SIDE_EFFECT = new RegExp(`(?:^|[^.\\w])import\\s*${SPEC}`, 'g');
const DYNAMIC = new RegExp(`\\bimport\\s*\\(\\s*${SPEC}\\s*\\)`, 'g');

function importSpecifiers(src: string): string[] {
  const out: string[] = [];
  for (const re of [STATIC_FROM, SIDE_EFFECT, DYNAMIC]) {
    for (const m of src.matchAll(re)) out.push(m[1] as string);
  }
  return out;
}

test('T-14-2: dist/src/index/indexer.js imports neither the spawn wrapper nor child_process', () => {
  const file = path.join(distSrc, 'index', 'indexer.js');
  const specs = importSpecifiers(readFileSync(file, 'utf8'));
  assert.ok(specs.length > 0, 'precondition: the scan finds the module imports');
  const spawnJs = path.join(distSrc, 'util', 'spawn.js');
  const bad = specs.filter(
    (s) => s === 'child_process' || s === 'node:child_process' || (s.startsWith('.') && path.resolve(path.dirname(file), s) === spawnJs)
  );
  assert.deepEqual(bad, [], 'dist/src/index/indexer.js imports the spawn wrapper or child_process');
});

type Layout = 'ordinary' | 'packed' | 'detached' | 'worktree';

async function runLayout(layout: Layout): Promise<void> {
  const repo = path.join(root, `repo-${layout}`);
  generateFixture('indexer-small', repo);
  let checkoutRoot = repo;
  if (layout === 'packed') fixtureGit(repo, ['pack-refs', '--all']);
  if (layout === 'detached') fixtureGit(repo, ['checkout', '-q', '--detach']);
  if (layout === 'worktree') {
    checkoutRoot = path.join(root, `wt-${layout}`);
    fixtureGit(repo, ['worktree', 'add', '-q', '-b', 'wt', checkoutRoot]);
    assert.ok(statSync(path.join(checkoutRoot, '.git')).isFile(), 'precondition: the worktree .git is a gitdir: file');
  }

  const { store, global } = newStores(`stale-${layout}`);
  try {
    await index(store, global, checkoutRoot);

    // HEAD moves.
    fixtureCommit(checkoutRoot, [{ path: 'added.txt', content: 'moves HEAD\n' }], { message: 'move HEAD', day: 1 });
    if (layout === 'packed') {
      fixtureGit(repo, ['pack-refs', '--all']);
      assert.ok(!existsSync(path.join(repo, '.git', 'refs', 'heads', 'main')), 'precondition: the branch ref is packed, its loose file gone');
    }
    if (layout === 'detached') {
      assert.match(readFileSync(path.join(repo, '.git', 'HEAD'), 'utf8').trim(), /^[0-9a-f]{40}([0-9a-f]{24})?$/, 'precondition: HEAD is detached');
    }

    const staleBefore = faultCount(store, 'index_stale');
    const first = refreshIfStale(store, checkoutRoot, diag);
    assert.deepEqual(first, { stale: true }, `${layout}: the stale call misses the moved HEAD`);
    assert.equal(faultCount(store, 'index_stale'), staleBefore + 1, `${layout}: the stale call records no index_stale fault`);
    assert.equal(meta(store, 'index_stale'), '1', `${layout}: the stale call leaves the flag unset`);
    assert.equal(meta(store, 'reindex_owner_pid'), undefined, `${layout}: a reindex_owner_pid row appears during the stale call`);

    const tc = totalChanges(store);
    const second = refreshIfStale(store, checkoutRoot, diag);
    assert.deepEqual(second, { stale: true }, `${layout}: the second stale call returns anything but {stale: true}`);
    assert.equal(faultCount(store, 'index_stale'), staleBefore + 1, `${layout}: the second stale call records a second index_stale fault`);
    assert.equal(totalChanges(store) - tc, 0, `${layout}: the second stale call writes (a fault or schema_meta) again`);
    assert.equal(meta(store, 'reindex_owner_pid'), undefined, `${layout}: a reindex_owner_pid row appears during the second stale call`);

    await index(store, global, checkoutRoot);
    assert.equal(meta(store, 'index_stale'), '0', `${layout}: runIndex does not clear the flag`);

    const faultsBefore = faultCount(store);
    const fresh = refreshIfStale(store, checkoutRoot, diag);
    assert.deepEqual(fresh, { stale: false }, `${layout}: the fresh call reports stale`);
    assert.equal(faultCount(store), faultsBefore, `${layout}: the fresh call records a fault`);
    assert.equal(meta(store, 'reindex_owner_pid'), undefined, `${layout}: a reindex_owner_pid row appears during the fresh call`);
  } finally {
    store.close();
    global.close();
  }
}

for (const layout of ['ordinary', 'packed', 'detached', 'worktree'] as const) {
  test(`T-14-2: ${layout} layout — fresh -> stale (one fault, flag set) -> stale (no write) -> runIndex clears -> fresh`, async () => {
    await runLayout(layout);
  });
}

test('T-14-2: an unborn branch records head_unresolved with its reason and returns {stale: false}', () => {
  const repo = path.join(root, 'unborn');
  fixtureInit(repo);
  const { store, global } = newStores('stale-unborn');
  try {
    const r = refreshIfStale(store, repo, diag);
    assert.deepEqual(r, { stale: false }, 'the unborn-branch case returns {stale: true}');
    assert.equal(faultCount(store, 'index_stale'), 0, 'the unborn-branch case records index_stale');
    const rows = store.prepare("SELECT detail_json FROM faults WHERE code = 'head_unresolved'").all() as { detail_json: string | null }[];
    assert.equal(rows.length, 1, 'the unborn-branch case records no head_unresolved');
    const detail = rows[0]?.detail_json ?? null;
    assert.ok(detail !== null && detail !== 'null' && detail !== '{}' && detail !== '""', 'head_unresolved carries no reason');
    assert.equal(meta(store, 'reindex_owner_pid'), undefined, 'a reindex_owner_pid row appears during the call');
  } finally {
    store.close();
    global.close();
  }
});

// --- M4 (Step 14 build review): head_unresolved on the transition only, and reftable.

function headUnresolvedReasons(store: Store): unknown[] {
  return (store.prepare("SELECT detail_json FROM faults WHERE code = 'head_unresolved' ORDER BY id").all() as { detail_json: string | null }[]).map(
    (r) => (r.detail_json === null ? null : (JSON.parse(r.detail_json) as { reason?: unknown }).reason)
  );
}

test('T-14-2 (M4): five unresolved calls record one head_unresolved; a resolving call clears head_unresolved_since', () => {
  const repo = path.join(root, 'unborn-m4');
  fixtureInit(repo);
  const { store, global } = newStores('stale-unborn-m4');
  try {
    for (let i = 1; i <= 5; i++) {
      assert.deepEqual(refreshIfStale(store, repo, diag), { stale: false }, `unborn call ${i} returns {stale: true}`);
    }
    assert.equal(faultCount(store, 'head_unresolved'), 1, 'the five unborn calls record other than exactly one head_unresolved fault');
    assert.ok(meta(store, 'head_unresolved_since') !== undefined, 'schema_meta.head_unresolved_since is absent after the unborn calls');
    fixtureCommit(repo, [{ path: 'first.txt', content: 'first\n' }], { message: 'first commit', day: 0 });
    refreshIfStale(store, repo, diag);
    assert.equal(meta(store, 'head_unresolved_since'), undefined, 'head_unresolved_since survives the call made after the first commit');
  } finally {
    store.close();
    global.close();
  }
});

// git 2.43.0 here has no reftable backend, so both layouts are planted files
// (git-scm.com/docs/reftable, "Backward compatibility"): a reftable HEAD is a
// regular file holding `ref: refs/heads/.invalid` (written with git's trailing
// newline), or the config sets `extensions.refStorage = reftable`.
const REFTABLE_LAYOUTS: Record<string, (repo: string) => void> = {
  'HEAD = ref: refs/heads/.invalid': (repo) => writeFileSync(path.join(repo, '.git', 'HEAD'), 'ref: refs/heads/.invalid\n'),
  'config extensions.refStorage = reftable': (repo) => appendFileSync(path.join(repo, '.git', 'config'), '[extensions]\n\trefStorage = reftable\n'),
};

for (const [name, plant] of Object.entries(REFTABLE_LAYOUTS)) {
  test(`T-14-2 (M4): reftable layout (${name}) — three calls record one head_unresolved with reason reftable, never stale`, () => {
    const repo = path.join(root, `reftable-${Object.keys(REFTABLE_LAYOUTS).indexOf(name)}`);
    generateFixture('indexer-small', repo);
    plant(repo);
    const { store, global } = newStores(`stale-reftable-${Object.keys(REFTABLE_LAYOUTS).indexOf(name)}`);
    try {
      for (let i = 1; i <= 3; i++) {
        assert.deepEqual(refreshIfStale(store, repo, diag), { stale: false }, `reftable call ${i} returns {stale: true}`);
        assert.equal(meta(store, 'reindex_owner_pid'), undefined, `reftable call ${i} writes a reindex_owner_pid row`);
      }
      assert.equal(faultCount(store, 'index_stale'), 0, 'a reftable call records index_stale');
      assert.deepEqual(headUnresolvedReasons(store), ['reftable'], "the three calls record other than exactly one head_unresolved fault with reason 'reftable'");
    } finally {
      store.close();
      global.close();
    }
  });
}
