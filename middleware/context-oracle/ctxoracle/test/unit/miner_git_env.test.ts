// T-13-1o, T-13-1p, T-13-6e — the miner against the git it actually meets
// (Step 13; Step 13 build review S1, M1, M2).
//
// T-13-1o: a repository whose four commit objects carry a `gpgsig` header
//   (written with `git hash-object -t commit -w`, so no signing key is
//   needed; plan §11.4), mined once plainly and once after
//   `log.showSignature = true`, `log.showRoot = false`, `gpg.format = openpgp`
//   are set in the repository's own config. The pinned flags must make the
//   two mines identical.
// T-13-1p: a SHA-256 repository (`git init --object-format=sha256`), three
//   a.txt/b.txt commits and a `git revert --no-edit HEAD` amended to subject
//   `undo three` with git's 64-hex trailer body kept; plus the parser fed
//   `\x1e` + 41, 63, 65 hex where a header is expected.
// T-13-6e: the pass runs in T-13-5's worker (role `mine`) with `PATH` led by
//   a `git` shim that runs the real git and, only for the `log` call carrying
//   `--numstat`, rewrites the `\x1e` of chosen headers to `X` — a process-
//   boundary double for a stream drift; no double inside the miner.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore, probeFts5, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { filesDao } from '../../src/stores/dao/files.js';
import { cochangePairsDao } from '../../src/stores/dao/cochange_pairs.js';
import { schemaMetaDao } from '../../src/stores/dao/schema_meta.js';
import { mineCochange, parseNumstatZ } from '../../src/miner/cochange.js';
import { fixtureCommit, fixtureGit, fixtureInit } from '../fixtures/generate.js';

const workerPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'miner_chunks_worker.js');
const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-miner-gitenv-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const diag = path.join(root, 'diagnostics');

interface Dbs {
  project: string;
  global: string;
}

function newDbs(name: string): Dbs {
  const project = path.join(root, `${name}.db`);
  const global = path.join(root, `${name}-global.db`);
  const p = openStore(project);
  applyMigrations(p, { fts: probeFts5(p) });
  p.close();
  const g = openStore(global);
  applyMigrations(g, { fts: false, scope: 'global' });
  seedDefaults(g);
  g.close();
  return { project, global };
}

async function mine(dbs: Dbs, repo: string): Promise<void> {
  const store = openStore(dbs.project);
  const global = openStore(dbs.global);
  try {
    await mineCochange(store, repo, { tuning: tuningReader(global, 'miner-git-env', () => {}), diagnosticsDir: diag });
  } finally {
    store.close();
    global.close();
  }
}

function withStore<T>(dbs: Dbs, f: (s: Store) => T): T {
  const s = openStore(dbs.project);
  try {
    return f(s);
  } finally {
    s.close();
  }
}

function pairCount(s: Store, p: string, q: string): number {
  const a = filesDao(s).byPath(p);
  const b = filesDao(s).byPath(q);
  if (a === undefined || b === undefined) return 0;
  return cochangePairsDao(s).pair(a.id, b.id)?.pair_count ?? 0;
}

/** commits, pairs (counts and weights), per-file counts and weights, labelled_touches — by path. */
function historyRows(s: Store): Record<string, string[]> {
  const pathOf = new Map(filesDao(s).all().map((f) => [f.id, f.path]));
  const p = (id: number): string => pathOf.get(id) ?? `#${id}`;
  const commits = (s.prepare('SELECT hash, ts, entity_count, excluded, exclude_reason FROM commits').all() as Record<string, unknown>[])
    .map((r) => JSON.stringify([r.hash, r.ts, r.entity_count, r.excluded, r.exclude_reason]))
    .sort();
  const pairs = (s.prepare('SELECT a, b, pair_count, pair_weight FROM cochange_pairs').all() as { a: number; b: number; pair_count: number; pair_weight: number }[])
    .map((r) => `${[p(r.a), p(r.b)].sort().join(' | ')} count=${r.pair_count} weight=${r.pair_weight}`)
    .sort();
  const files = filesDao(s)
    .all()
    .filter((f) => f.change_count !== 0 || f.change_weight !== 0)
    .map((f) => `${f.path} count=${f.change_count} weight=${f.change_weight}`)
    .sort();
  const touches = (s.prepare('SELECT file_id, commit_hash, label FROM labelled_touches').all() as { file_id: number; commit_hash: string; label: string }[])
    .map((r) => `${p(r.file_id)} ${r.label} ${r.commit_hash}`)
    .sort();
  return { commits, pairs, files, touches };
}

/** Pair and per-file counts and weights only (T-13-6e's comparison). */
function countRows(s: Store): { pairs: string[]; files: string[] } {
  const { pairs, files } = historyRows(s);
  return { pairs: pairs ?? [], files: files ?? [] };
}

function unparsedFaults(s: Store): unknown[] {
  return (s.prepare("SELECT detail_json FROM faults WHERE code = 'miner_unparsed_numstat'").all() as { detail_json: string | null }[]).map(
    (r) => JSON.parse(r.detail_json ?? 'null') as unknown
  );
}

// The stream's format and range, without the four pinning flags (T-13-1o's precondition).
const STREAM_ARGS = ['log', '--no-merges', '-M', '-z', '--numstat', '--reverse', '--format=%x1e%H%x00%at%x00%s%x00%b%x00', 'HEAD'];

/** Rewrite every commit of `main` (oldest first) with a `gpgsig` header; no key needed. */
function signAllCommits(repo: string): void {
  const hashes = fixtureGit(repo, ['rev-list', '--reverse', 'HEAD']).trim().split('\n');
  let parent: string | null = null;
  for (const h of hashes) {
    const lines = fixtureGit(repo, ['cat-file', 'commit', h]).split('\n');
    const out: string[] = [];
    for (const l of lines) {
      if (l.startsWith('parent ')) continue;
      out.push(l);
      if (l.startsWith('tree ') && parent !== null) out.push(`parent ${parent}`);
      if (l.startsWith('committer ')) {
        out.push('gpgsig -----BEGIN PGP SIGNATURE-----', ' ', ' iQEzBAABCAAdFiEEnotarealsignatureAAAA', ' -----END PGP SIGNATURE-----');
      }
    }
    parent = execFileSync('git', ['hash-object', '-t', 'commit', '-w', '--stdin'], {
      cwd: repo,
      input: out.join('\n'),
      encoding: 'utf8',
      env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' },
    }).trim();
  }
  if (parent === null) throw new Error('fixture: no commits to sign');
  fixtureGit(repo, ['update-ref', 'refs/heads/main', parent]);
  fixtureGit(repo, ['reset', '-q', '--hard', 'main']);
}

test('T-13-1o: a pass under log.showSignature / log.showRoot config mines what a plain pass mines', async () => {
  const repo = path.join(root, 'signed');
  fixtureInit(repo);
  // Four commits, root included; a.txt/b.txt co-change in the root and two later ones.
  fixtureCommit(repo, [{ path: 'a.txt', content: 'a1\n' }, { path: 'b.txt', content: 'b1\n' }], { message: 'root pair', day: 1 });
  fixtureCommit(repo, [{ path: 'a.txt', content: 'a2\n' }, { path: 'b.txt', content: 'b2\n' }], { message: 'pair two', day: 2 });
  fixtureCommit(repo, [{ path: 'c.txt', content: 'c\n' }], { message: 'solo', day: 3 });
  fixtureCommit(repo, [{ path: 'a.txt', content: 'a3\n' }, { path: 'b.txt', content: 'b3\n' }], { message: 'pair three', day: 4 });
  signAllCommits(repo);
  assert.ok(fixtureGit(repo, ['cat-file', 'commit', 'HEAD']).includes('gpgsig '), 'fixture: HEAD carries a gpgsig header');
  const head = fixtureGit(repo, ['rev-parse', 'HEAD']).trim();
  const headCt = fixtureGit(repo, ['log', '-1', '--format=%ct', 'HEAD']).trim();
  const plainStream = fixtureGit(repo, STREAM_ARGS);

  const plain = newDbs('o-plain');
  await mine(plain, repo);

  fixtureGit(repo, ['config', 'log.showSignature', 'true']);
  fixtureGit(repo, ['config', 'log.showRoot', 'false']);
  fixtureGit(repo, ['config', 'gpg.format', 'openpgp']);
  // Precondition: the settings change the unflagged stream's bytes on this machine.
  const configured = execFileSync('git', STREAM_ARGS, {
    cwd: repo,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' },
  });
  assert.notEqual(configured, plainStream, 'precondition: log.showSignature/log.showRoot did not change the unflagged stream on this machine');

  const configuredDbs = newDbs('o-configured');
  await mine(configuredDbs, repo);

  const plainRows = withStore(plain, historyRows);
  const configuredRows = withStore(configuredDbs, historyRows);
  assert.deepEqual(configuredRows, plainRows, 'the configured pass mined something different from the plain pass');
  for (const [name, dbs] of [
    ['plain', plain],
    ['configured', configuredDbs],
  ] as const) {
    withStore(dbs, (s) => {
      assert.equal(pairCount(s, 'a.txt', 'b.txt'), 3, `${name}: pair(a, b).pair_count (the root commit's entries counted)`);
      assert.equal(schemaMetaDao(s).get('ref_ts'), headCt, `${name}: ref_ts is not HEAD's committer time`);
      assert.equal(schemaMetaDao(s).get('last_mined_commit'), head, `${name}: last_mined_commit is not HEAD`);
    });
  }
  assert.deepEqual(withStore(configuredDbs, unparsedFaults), [], 'the configured pass recorded miner_unparsed_numstat faults');
});

test('T-13-1p: a SHA-256 repository mines with no faults', async () => {
  const repo = path.join(root, 'sha256');
  rmSync(repo, { recursive: true, force: true });
  mkdirSync(repo, { recursive: true });
  fixtureGit(repo, ['init', '-q', '--object-format=sha256', '-b', 'main']);
  fixtureGit(repo, ['config', 'commit.gpgsign', 'false']);
  for (let i = 1; i <= 3; i++) {
    fixtureCommit(repo, [{ path: 'a.txt', content: `a${i}\n` }, { path: 'b.txt', content: `b${i}\n` }], { message: `commit ${i}`, day: i });
  }
  fixtureGit(repo, ['revert', '--no-edit', 'HEAD'], { day: 4 });
  const body = fixtureGit(repo, ['log', '-1', '--format=%b']).trim();
  assert.match(body, /^This reverts commit [0-9a-f]{64}\.$/, "fixture: git's 64-hex revert trailer");
  fixtureGit(repo, ['commit', '-q', '--amend', '-m', 'undo three', '-m', body], { day: 4 });
  const undo = fixtureGit(repo, ['rev-parse', 'HEAD']).trim();
  assert.match(undo, /^[0-9a-f]{64}$/, 'fixture: a 64-hex object name');
  const all = fixtureGit(repo, ['rev-list', 'HEAD']).trim().split('\n').sort();

  const dbs = newDbs('p');
  await mine(dbs, repo);
  withStore(dbs, (s) => {
    assert.deepEqual(unparsedFaults(s), [], 'the SHA-256 pass recorded miner_unparsed_numstat faults');
    const hashes = (s.prepare('SELECT hash FROM commits').all() as { hash: string }[]).map((r) => r.hash).sort();
    assert.deepEqual(hashes, all, "commits does not hold exactly the repository's 4 commits (64-hex)");
    assert.equal(hashes.length, 4);
    assert.equal(pairCount(s, 'a.txt', 'b.txt'), 4, 'pair(a, b).pair_count');
    const reverts = (
      s
        .prepare("SELECT f.path FROM labelled_touches t JOIN files f ON f.id = t.file_id WHERE t.label = 'revert' AND t.commit_hash = ?")
        .all(undo) as { path: string }[]
    )
      .map((r) => r.path)
      .sort();
    assert.deepEqual(reverts, ['a.txt', 'b.txt'], '`undo three` (64-hex trailer only) has no revert row for a.txt and b.txt');
    assert.equal(schemaMetaDao(s).get('last_mined_commit'), undo, "last_mined_commit is not HEAD's 64-hex hash");
  });

  // Boundary: 41, 63 and 65 hex where a header is expected are not headers.
  const H1 = '1'.repeat(40);
  for (const n of [41, 63, 65]) {
    const bad = 'b'.repeat(n);
    const fields = [`\x1e${H1}`, '1700000000', 's', '', '', '\n1\t0\tone.txt', `\x1e${bad}`, '1700000100', 't', '', '', '\n1\t0\ttwo.txt'];
    const { commits } = parseNumstatZ(Buffer.from(fields.join('\0') + '\0', 'utf8'));
    assert.ok(!commits.some((c) => c.hash === bad), `a ${n}-hex field was taken for a header`);
  }
});

// ---- T-13-6e ----------------------------------------------------------------

const realGit = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim();
const shimDir = path.join(root, 'shim');
mkdirSync(shimDir, { recursive: true });
writeFileSync(
  path.join(shimDir, 'git'),
  `#!${process.execPath}
// T-13-6e git shim: runs the real git; for the \`log\` call carrying --numstat,
// rewrites the 0x1e of each header listed in CTXORACLE_TEST_CORRUPT (comma-
// separated hashes, or ALL) to 'X'. Every other call and byte passes through.
const { spawnSync } = require('node:child_process');
const args = process.argv.slice(2);
const r = spawnSync(${JSON.stringify(realGit)}, args, { stdio: ['inherit', 'pipe', 'inherit'], maxBuffer: 1 << 30 });
let out = r.stdout ?? Buffer.alloc(0);
if (args.includes('log') && args.includes('--numstat')) {
  const list = (process.env.CTXORACLE_TEST_CORRUPT || '').split(',').filter(Boolean);
  const buf = Buffer.from(out);
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] !== 0x1e) continue;
    const hex = buf.subarray(i + 1, i + 65).toString('latin1').match(/^[0-9a-f]+/);
    const h = hex ? hex[0] : '';
    if (list.includes('ALL') || list.some((x) => h.startsWith(x))) buf[i] = 0x58;
  }
  out = buf;
}
process.stdout.write(out, () => process.exit(r.status === null ? 1 : r.status));
`
);
chmodSync(path.join(shimDir, 'git'), 0o755);
// The shim is CommonJS (`require`); give its directory a package.json saying so.
writeFileSync(path.join(shimDir, 'package.json'), '{"type":"commonjs"}');

async function shimmedMine(dbs: Dbs, repo: string, corrupt: string): Promise<string> {
  const child = spawn(process.execPath, [workerPath, 'mine', repo, dbs.project, dbs.global, diag, 'auto'], {
    stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, PATH: `${shimDir}${path.delimiter}${process.env.PATH ?? ''}`, CTXORACLE_TEST_CORRUPT: corrupt },
  });
  let stderr = '';
  child.stderr?.on('data', (d: Buffer) => {
    stderr += d.toString('utf8');
  });
  await new Promise<void>((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', () => resolve());
  });
  return stderr;
}

function completenessFaults(s: Store): unknown[] {
  return unparsedFaults(s).filter((d) => d !== null && typeof d === 'object' && 'expected' in d && 'read' in d);
}

test('T-13-6e: a stream that yields fewer commits than the range holds never claims HEAD', async () => {
  const repo = path.join(root, 'short-stream');
  fixtureInit(repo);
  for (let i = 1; i <= 4; i++) {
    fixtureCommit(repo, [{ path: 'a.txt', content: `a${i}\n` }, { path: 'b.txt', content: `b${i}\n` }], { message: `c${i}`, day: i });
  }
  const [c1, c2, c3, c4] = fixtureGit(repo, ['rev-list', '--reverse', 'HEAD']).trim().split('\n');
  assert.ok(c1 !== undefined && c2 !== undefined && c3 !== undefined && c4 !== undefined);
  const head = c4;

  const reference = newDbs('e-reference');
  await mine(reference, repo);
  const refCounts = withStore(reference, countRows);

  // (a) a full first mine with c4's header corrupted, then a mine without the shim.
  const a = newDbs('e-a');
  const errA = await shimmedMine(a, repo, c4);
  withStore(a, (s) => {
    assert.deepEqual(completenessFaults(s), [{ expected: 4, read: 3 }], `(a) not exactly one {expected: 4, read: 3} fault; worker stderr:\n${errA}`);
    assert.equal(schemaMetaDao(s).get('last_mined_commit'), c3, "(a) last_mined_commit is not c3's hash");
    assert.equal(schemaMetaDao(s).get('mining_in_progress'), '1', "(a) mining_in_progress is not '1'");
  });
  await mine(a, repo);
  withStore(a, (s) => {
    assert.equal(schemaMetaDao(s).get('last_mined_commit'), head, '(a) the completing mine did not reach HEAD');
    assert.equal(schemaMetaDao(s).get('mining_in_progress'), '0', "(a) mining_in_progress is not '0' after the completing mine");
    assert.deepEqual(countRows(s), refCounts, "(a) counts differ from the reference store's");
  });

  // (b) a store mined plainly to c2; every header of the c2..HEAD stream corrupted.
  const b = newDbs('e-b');
  fixtureGit(repo, ['checkout', '-q', '--detach', c2]);
  await mine(b, repo);
  fixtureGit(repo, ['checkout', '-q', 'main']);
  withStore(b, (s) => assert.equal(schemaMetaDao(s).get('last_mined_commit'), c2, 'fixture: the store is mined to c2'));
  const errB = await shimmedMine(b, repo, 'ALL');
  withStore(b, (s) => {
    assert.deepEqual(completenessFaults(s), [{ expected: 2, read: 0 }], `(b) not exactly one {expected: 2, read: 0} fault; worker stderr:\n${errB}`);
    assert.equal(schemaMetaDao(s).get('last_mined_commit'), c2, "(b) last_mined_commit is not c2's hash");
    assert.equal(schemaMetaDao(s).get('mining_in_progress'), '0', "(b) mining_in_progress is not '0'");
  });
  await mine(b, repo);
  withStore(b, (s) => {
    assert.equal(schemaMetaDao(s).get('last_mined_commit'), head, '(b) the completing mine did not reach HEAD');
    assert.equal(schemaMetaDao(s).get('mining_in_progress'), '0', "(b) mining_in_progress is not '0' after the completing mine");
    // Counts exactly, weights on a common epoch (plan §12 at 6d6f21d).
    assertCommonEpoch(epochRows(s), withStore(reference, epochRows), "(b) counts differ from the reference store's");
  });
});

// ---- Weights on a common epoch (plan §12 at 6d6f21d) -------------------------
// An incremental pass keeps its store's weight_epoch while a from-scratch mine
// re-bases it (AD-13), so raw weights differ by exactly the factor that cancels
// in every ratio. Each store's weight × 2^((E_store − E_ref)/(h × 86400)) must
// equal the reference's within 1e-9 relative (h = the seeded 365 days); counts
// are compared exactly.

interface EpochRows {
  epoch: number;
  files: Map<string, { count: number; weight: number }>;
  pairs: Map<string, { count: number; weight: number }>;
}

function epochRows(store: Store): EpochRows {
  const epochText = (store.prepare("SELECT value FROM schema_meta WHERE key = 'weight_epoch'").get() as { value: string | null } | undefined)?.value;
  const all = filesDao(store).all();
  const pathOf = new Map(all.map((f) => [f.id, f.path]));
  const files = new Map<string, { count: number; weight: number }>();
  for (const f of all) if (f.change_count !== 0 || f.change_weight !== 0) files.set(f.path, { count: f.change_count, weight: f.change_weight });
  const pairs = new Map<string, { count: number; weight: number }>();
  for (const r of store.prepare('SELECT a, b, pair_count, pair_weight FROM cochange_pairs').all() as { a: number; b: number; pair_count: number; pair_weight: number }[]) {
    pairs.set([pathOf.get(r.a) ?? `#${r.a}`, pathOf.get(r.b) ?? `#${r.b}`].sort().join(' | '), { count: r.pair_count, weight: r.pair_weight });
  }
  return { epoch: Number(epochText), files, pairs };
}

function assertCommonEpoch(actual: EpochRows, reference: EpochRows, what: string): void {
  assert.ok(Number.isFinite(actual.epoch) && Number.isFinite(reference.epoch), `${what}: a store has no numeric weight_epoch`);
  const factor = 2 ** ((actual.epoch - reference.epoch) / (365 * 86400));
  for (const [kind, a, r] of [
    ['file', actual.files, reference.files],
    ['pair', actual.pairs, reference.pairs],
  ] as const) {
    assert.deepEqual([...a.keys()].sort(), [...r.keys()].sort(), `${what}: the ${kind} set differs from the reference's`);
    for (const [key, ref] of r) {
      const got = a.get(key);
      assert.ok(got !== undefined);
      assert.equal(got.count, ref.count, `${what}: ${kind} ${key} count differs from the reference's`);
      const rel = Math.abs(got.weight * factor - ref.weight) / Math.abs(ref.weight);
      assert.ok(rel <= 1e-9, `${what}: ${kind} ${key} weight on the common epoch differs by ${rel} relative (> 1e-9)`);
    }
  }
}
