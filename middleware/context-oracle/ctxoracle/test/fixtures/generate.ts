// Deterministic fixture-repository generator (Step 1, D-plan-5, AD-24).
//
// One generator per fixture repository named in the plan's §5.1. Each builds a
// real git repository with fixed author, message and absolute timestamps, so
// the same name yields identical commit hashes on every machine (T-1-3). The
// scenario a fixture plants is the one its consuming test's Data field states;
// the generator writes nothing a test asserts on except the scenario itself.
//
// Determinism contract: every commit is made with GIT_AUTHOR_* and
// GIT_COMMITTER_* fully pinned (name, email, date), gpg signing off, and
// core.autocrlf off, and the repo is initialised on a fixed branch name. git
// config is isolated from the host (GIT_CONFIG_GLOBAL/SYSTEM=/dev/null) so a
// developer's global config cannot perturb the hashes.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const AUTHOR_NAME = 'Ctxoracle Fixture';
const AUTHOR_EMAIL = 'fixtures@ctxoracle.test';

// A fixed epoch anchor (2026-01-01T00:00:00Z) plus per-commit offsets, so the
// timeline is deterministic and independent of the wall clock. Horizon-relative
// fixtures (miner-hygiene, warning-landmine) measure their windows back from
// their own HEAD commit time, so they hold on any calendar day.
const ANCHOR = Date.parse('2026-01-01T00:00:00Z') / 1000;
const DAY = 86_400;

const ISO = (tsSeconds: number): string => new Date(tsSeconds * 1000).toISOString();

function git(cwd: string, args: string[], extraEnv: Record<string, string> = {}): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_SYSTEM: '/dev/null',
      GIT_TERMINAL_PROMPT: '0',
      ...extraEnv,
    },
  });
}

function initRepo(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  git(dir, ['init', '-q', '-b', 'main']);
  git(dir, ['config', 'user.name', AUTHOR_NAME]);
  git(dir, ['config', 'user.email', AUTHOR_EMAIL]);
  git(dir, ['config', 'commit.gpgsign', 'false']);
  git(dir, ['config', 'core.autocrlf', 'false']);
  git(dir, ['config', 'gc.auto', '0']);
}

interface WriteEntry {
  path: string;
  content: string | Buffer;
}

function writeFiles(dir: string, files: WriteEntry[]): void {
  for (const f of files) {
    const p = path.join(dir, f.path);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, f.content);
  }
}

interface CommitOpts {
  message: string;
  /** Offset in days from ANCHOR for this commit's fixed author/committer date. */
  day: number;
  /** Optional finer offset in seconds within the day, to order commits. */
  sec?: number;
}

function commit(dir: string, files: WriteEntry[], opts: CommitOpts): void {
  writeFiles(dir, files);
  git(dir, ['add', '-A']);
  const ts = ANCHOR + opts.day * DAY + (opts.sec ?? 0);
  const date = ISO(ts);
  git(dir, ['commit', '-q', '-m', opts.message], {
    GIT_AUTHOR_NAME: AUTHOR_NAME,
    GIT_AUTHOR_EMAIL: AUTHOR_EMAIL,
    GIT_AUTHOR_DATE: date,
    GIT_COMMITTER_NAME: AUTHOR_NAME,
    GIT_COMMITTER_EMAIL: AUTHOR_EMAIL,
    GIT_COMMITTER_DATE: date,
  });
}

/** A trivial single-commit repository — the deterministic baseline shape. */
function trivial(dir: string, marker = 'fixture'): void {
  initRepo(dir);
  commit(dir, [{ path: 'README.md', content: `# ${marker}\n` }], { message: 'init', day: 0 });
}

/** The pinned author/committer identity and date for a fixture-relative instant. */
function dateEnv(day: number, sec = 0): Record<string, string> {
  const date = ISO(ANCHOR + day * DAY + sec);
  return {
    GIT_AUTHOR_NAME: AUTHOR_NAME,
    GIT_AUTHOR_EMAIL: AUTHOR_EMAIL,
    GIT_AUTHOR_DATE: date,
    GIT_COMMITTER_NAME: AUTHOR_NAME,
    GIT_COMMITTER_EMAIL: AUTHOR_EMAIL,
    GIT_COMMITTER_DATE: date,
  };
}

/** `git revert --no-edit <rev>` at a pinned date: git writes `Revert "<subject>"` + the trailer. */
function revert(dir: string, rev: string, day: number, sec = 0): void {
  git(dir, ['revert', '--no-edit', rev], dateEnv(day, sec));
}

// --- Helpers exported for the tests that change a generated fixture ---------
// (T-13-3 rewrites miner-labels' history; T-13-4 adds commits after a first
// mine; T-13-5 clones miner-large). Same pinned identity, dates, and isolated
// git config as the generators, so a test's own commits are deterministic too.

/** Run git in a fixture repo with the generators' isolated config (and a pinned date when `at` is given). */
export function fixtureGit(dir: string, args: string[], at?: { day: number; sec?: number }): string {
  return git(dir, args, at === undefined ? {} : dateEnv(at.day, at.sec ?? 0));
}

/** Initialise an empty fixture repo in `dir` (replaced) with the generators' pinned config. */
export function fixtureInit(dir: string): void {
  initRepo(dir);
}

/** Write `files` and commit them at `ANCHOR + day·86400 + sec` with `message`. */
export function fixtureCommit(dir: string, files: WriteEntry[], opts: CommitOpts): void {
  commit(dir, files, opts);
}

/** The fixture timeline's epoch-seconds instant for `day`/`sec` (ANCHOR-relative). */
export function fixtureTs(day: number, sec = 0): number {
  return ANCHOR + day * DAY + sec;
}

// --- Step 13 miner fixtures (plan §12 T-13-1 .. T-13-5 Data fields) ----------

/** The miner-hygiene planted pair (cross-directory) and its partner. */
export const HYGIENE = {
  pairA: 'left/alpha.txt',
  partner: 'right/beta.txt',
  headDay: 60,
  /** 6 years (6 × 365.25 days, rounded up) before HEAD — beyond the 5-year horizon. */
  ancientDay: 60 - 2192,
  specialPaths: ['caf\u00e9.txt', 'back\\slash.txt', 'ta\tb.txt', 'ne\nwl.txt', 'we\u001eird.txt'],
  arrowPath: 'a => b.txt',
  binaryPath: 'bin.dat',
  bulkPaths: Array.from({ length: 43 }, (_, i) => `bulk/f${String(i).padStart(2, '0')}.txt`),
  revertFile: 'rv.txt',
  fixFile: 'fx.txt',
} as const;

function minerHygiene(dir: string): void {
  const H = HYGIENE;
  initRepo(dir);
  let beta = 0;
  const betaEdit = (): WriteEntry => ({ path: H.partner, content: `beta ${++beta}\n` });
  // Beyond the horizon: touches the pair (must not count) and a file only it touches.
  commit(
    dir,
    [
      { path: H.pairA, content: 'alpha ancient\n' },
      { path: H.partner, content: 'beta ancient\n' },
      { path: 'ancient.txt', content: 'ancient\n' },
    ],
    { message: 'ancient change', day: H.ancientDay }
  );
  commit(dir, [{ path: 'old.txt', content: 'line one\nline two\nline three\nline four\n' }], { message: 'add old', day: 1 });
  // The planted pair: 5 co-changes.
  for (let i = 0; i < 5; i++) {
    commit(
      dir,
      [
        { path: H.pairA, content: `alpha ${i}\n` },
        betaEdit(),
      ],
      { message: `pair change ${i}`, day: 2 + i }
    );
  }
  // A 45-file commit (size-excluded) that touches the pair.
  commit(
    dir,
    [{ path: H.pairA, content: 'alpha bulk\n' }, betaEdit(), ...H.bulkPaths.map((p) => ({ path: p, content: 'bulk\n' }))],
    { message: 'bulk sweep', day: 7 }
  );
  // One merge commit (excluded by --no-merges) whose own resolution touches the pair.
  git(dir, ['checkout', '-q', '-b', 'side']);
  commit(dir, [{ path: 'side.txt', content: 'side\n' }], { message: 'side work', day: 8 });
  git(dir, ['checkout', '-q', 'main']);
  commit(dir, [{ path: 'main.txt', content: 'main\n' }], { message: 'main work', day: 9 });
  // (stderr piped: `--no-commit` reports "stopped before committing" there.)
  execFileSync('git', ['merge', '-q', '--no-ff', '--no-commit', 'side'], {
    cwd: dir,
    stdio: 'pipe',
    env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', ...dateEnv(10) },
  });
  writeFiles(dir, [{ path: H.pairA, content: 'alpha merge\n' }, betaEdit()]);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'merge side'], dateEnv(10));
  git(dir, ['branch', '-q', '-D', 'side']);
  // Two revert-labelled commits on one file (git-generated, with the trailer).
  commit(dir, [{ path: H.revertFile, content: 'rv 0\n' }], { message: 'add rv', day: 11 });
  commit(dir, [{ path: H.revertFile, content: 'rv 1\n' }], { message: 'edit rv', day: 12 });
  revert(dir, 'HEAD', 13);
  commit(dir, [{ path: H.revertFile, content: 'rv 2\n' }], { message: 'edit rv again', day: 14 });
  revert(dir, 'HEAD', 15);
  // A rename in place (old.txt -> new.txt, identical content) with the partner.
  git(dir, ['mv', 'old.txt', 'new.txt']);
  commit(dir, [betaEdit()], { message: 'rename old to new', day: 16 });
  // The raw special-byte paths, each co-changing with the partner in one commit.
  H.specialPaths.forEach((p, i) => {
    commit(dir, [{ path: p, content: `special ${i}\n` }, betaEdit()], { message: `add special ${i}`, day: 17 + i });
  });
  // A real file literally named `a => b.txt` (a plain add, not a rename).
  commit(dir, [{ path: H.arrowPath, content: 'arrow\n' }, betaEdit()], { message: 'add arrow file', day: 22 });
  // A binary file (numstat `-\t-`).
  commit(dir, [{ path: H.binaryPath, content: Buffer.from([0, 1, 2, 0, 255, 0, 3]) }, betaEdit()], {
    message: 'add binary',
    day: 23,
  });
  // Three fix-labelled commits on another file within the 90 days before HEAD.
  commit(dir, [{ path: H.fixFile, content: 'fx 1\n' }], { message: 'fix one', day: 50 });
  commit(dir, [{ path: H.fixFile, content: 'fx 2\n' }], { message: 'fix two', day: 51 });
  commit(dir, [{ path: H.fixFile, content: 'fx 3\n' }], { message: 'fix three', day: 52 });
  commit(dir, [{ path: 'README.md', content: '# miner-hygiene\n' }], { message: 'readme', day: H.headDay });
}

/** miner-denominator (T-13-2): a.txt in 7 commits, 4 with b.txt; c.txt alone once. */
function minerDenominator(dir: string): void {
  initRepo(dir);
  for (let i = 0; i < 4; i++) {
    commit(
      dir,
      [
        { path: 'a.txt', content: `a ${i}\n` },
        { path: 'b.txt', content: `b ${i}\n` },
      ],
      { message: `a and b ${i}`, day: 1 + i }
    );
  }
  for (let i = 4; i < 7; i++) {
    commit(dir, [{ path: 'a.txt', content: `a ${i}\n` }], { message: `a alone ${i}`, day: 1 + i });
  }
  commit(dir, [{ path: 'c.txt', content: 'c\n' }], { message: 'c alone', day: 8 });
}

/** miner-labels timeline (T-13-3, T-13-4): day offsets from ANCHOR. */
export const LABELS = {
  headDay: 200,
  /** Days for T-13-4's three incremental `fix e/f/g` commits (after HEAD). */
  incrementalDays: [201, 202, 203],
  bigPaths: Array.from({ length: 40 }, (_, i) => `big/b${String(i).padStart(2, '0')}.txt`),
  lintPaths: Array.from({ length: 39 }, (_, i) => `lint/l${String(i).padStart(2, '0')}.txt`),
  fixSubjects: ['Fix: a', 'bug-fix b', 'hotfix c', 'fixing d'],
  nonFixSubjects: ['add fixture', 'prefix cleanup', 'suffix'],
} as const;

function minerLabels(dir: string): void {
  const L = LABELS;
  initRepo(dir);
  // old.txt: fix commits 100 days before HEAD (window 90 -> no fix_chatter).
  for (let i = 0; i < 3; i++) {
    commit(dir, [{ path: 'old.txt', content: `old ${i}\n` }], { message: `fix old ${i}`, day: L.headDay - 100, sec: i });
  }
  // x.txt: substring-only subjects -> no label.
  L.nonFixSubjects.forEach((m, i) => {
    commit(dir, [{ path: 'x.txt', content: `x ${i}\n` }], { message: m, day: 150, sec: i });
  });
  // big/: a 40-file commit (size-excluded) reverted by a 40-file revert.
  commit(dir, L.bigPaths.map((p) => ({ path: p, content: 'big\n' })), { message: 'add big', day: 160 });
  revert(dir, 'HEAD', 161);
  // s.txt: a 40-file `fix lint` commit (size-excluded -> no fix label).
  commit(
    dir,
    [{ path: 's.txt', content: 's\n' }, ...L.lintPaths.map((p) => ({ path: p, content: 'lint\n' }))],
    { message: 'fix lint', day: 162 }
  );
  // v.txt: subject `Revert "fix v"` with no trailer (the subject fallback).
  commit(dir, [{ path: 'v.txt', content: 'v\n' }], { message: 'Revert "fix v"', day: 163 });
  // f.txt: four included fix-labelled commits.
  L.fixSubjects.forEach((m, i) => {
    commit(dir, [{ path: 'f.txt', content: `f ${i}\n` }], { message: m, day: 190 + i });
  });
  // r.txt: two commits, each reverted with `git revert --no-edit`; HEAD is the
  // revert of the second (commit X of T-13-3).
  commit(dir, [{ path: 'r.txt', content: 'r one\n' }], { message: 'edit r one', day: 196 });
  revert(dir, 'HEAD', 197);
  commit(dir, [{ path: 'r.txt', content: 'r two\n' }], { message: 'edit r two', day: 198 });
  revert(dir, 'HEAD', L.headDay);
}

/** miner-large (T-13-5): 2,000 commits x 20 files, one hour apart, via `git fast-import`. */
export const LARGE = { commits: 2000, files: 20, startDay: 1, stepSec: 3600 } as const;

function minerLarge(dir: string): void {
  initRepo(dir);
  const parts: string[] = [];
  for (let i = 1; i <= LARGE.commits; i++) {
    const ts = ANCHOR + LARGE.startDay * DAY + i * LARGE.stepSec;
    const msg = `large ${i}\n`;
    parts.push('commit refs/heads/main\n');
    parts.push(`mark :${i}\n`);
    parts.push(`author ${AUTHOR_NAME} <${AUTHOR_EMAIL}> ${ts} +0000\n`);
    parts.push(`committer ${AUTHOR_NAME} <${AUTHOR_EMAIL}> ${ts} +0000\n`);
    parts.push(`data ${Buffer.byteLength(msg)}\n${msg}`);
    for (let f = 0; f < LARGE.files; f++) {
      const content = `f${f} c${i}\n`;
      parts.push(`M 100644 inline f${String(f).padStart(2, '0')}.txt\ndata ${Buffer.byteLength(content)}\n${content}`);
    }
    parts.push('\n');
  }
  execFileSync('git', ['fast-import', '--quiet'], {
    cwd: dir,
    input: parts.join(''),
    env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' },
    maxBuffer: 64 * 1024 * 1024,
  });
  git(dir, ['reset', '-q', '--hard', 'main']);
}

// --- Step 14 indexer fixtures (plan §12 T-14-1 .. T-14-3 Data fields) --------

/**
 * indexer-small (T-14-1, T-14-2): 3 `.ts` files (`src/app.ts` importing
 * `src/util.ts`; `test/util.test.ts` — the `test/` file importing a source
 * file), 1 `.py`, 1 `.sh` whose generated-marker comment (zone evidence)
 * carries a planted secret, and 1 file > 1 MB carrying a seeded fact.
 * Step 15 (T-15-3; plan Step 15 "Fixtures built out (G6)"): the `.py` package
 * case — `pkg/use.py` with `from .mod import f` and `from . import mod`, beside
 * `pkg/mod.py` (review G12/N8). The `.ts` file importing `./util.js` for a
 * `util.ts` is `src/app.ts`, already here.
 */
export const INDEXER_SMALL = {
  /** An AWS-access-key-shaped secret (Step 11's `aws_key` named pattern). */
  secret: 'AKIAIOSFODNN7EXAMPLE',
  bigPath: 'big.txt',
  bigBytes: 1_100_000 + '\nSEEDED_FACT\n'.length,
  markerPath: 'scripts/gen.sh',
  paths: ['README.md', 'big.txt', 'pkg/mod.py', 'pkg/use.py', 'scripts/gen.sh', 'src/app.ts', 'src/util.ts', 'test/util.test.ts', 'tool.py'],
} as const;

function indexerSmall(dir: string): void {
  const S = INDEXER_SMALL;
  initRepo(dir);
  commit(
    dir,
    [
      { path: 'README.md', content: '# indexer-small\n' },
      { path: 'src/util.ts', content: 'export function util(): number {\n  return 1;\n}\n' },
      { path: 'src/app.ts', content: "import { util } from './util.js';\n\nexport function app(): number {\n  return util() + 1;\n}\n" },
      { path: 'test/util.test.ts', content: "import { util } from '../src/util.js';\n\nif (util() !== 1) throw new Error('util');\n" },
      { path: 'tool.py', content: 'def tool():\n    return 1\n' },
      { path: 'pkg/mod.py', content: 'def f():\n    return 1\n' },
      { path: 'pkg/use.py', content: 'from .mod import f\nfrom . import mod\n\n\ndef use():\n    return f() + mod.f()\n' },
      { path: S.markerPath, content: `# @generated by scripts/gen.sh -- DO NOT EDIT (deploy key ${S.secret})\ngen() {\n  echo gen\n}\n` },
      { path: S.bigPath, content: `${'x'.repeat(1_100_000)}\nSEEDED_FACT\n` },
    ],
    { message: 'indexer-small', day: 0 }
  );
}

/**
 * indexer-walk (T-14-3): `.gitignore` = `dist/` and `*.gen.ts`; force-added
 * `dist/a.js` and `src/api.gen.ts`; `src/k.ts`; an untracked ignored
 * `dist/b.js`; a tracked `gone.ts` deleted from the working tree after commit
 * (history pairs it with `src/k.ts`); `bad\xff.txt` and `bad\xfe.txt`;
 * `src/a.ts` + `src/a.test.ts` importing it; `b.py` + `tests/test_b.py`
 * importing `b`; `pkg/x.go` + `pkg/x_test.go`; `node_modules/m/index.js`; and
 * `src/long.ts`, 20,001 lines under 1 MB (T-14-3's line-cap case).
 * Step 15 (plan Step 15 "Fixtures built out (G6)"): the alias case —
 * `src/alias.ts` with `import { h } from '@/util'` and no `@` package declared
 * (no `package.json` in the fixture).
 */
export const INDEXER_WALK = {
  longPath: 'src/long.ts',
  longLines: 20_001,
  badNames: [Buffer.from('bad\xff.txt', 'latin1'), Buffer.from('bad\xfe.txt', 'latin1')],
} as const;

function indexerWalk(dir: string): void {
  initRepo(dir);
  const long = Array.from({ length: INDEXER_WALK.longLines }, (_, i) => `export function f${i}() {}\n`).join('');
  writeFiles(dir, [
    { path: '.gitignore', content: 'dist/\n*.gen.ts\n' },
    { path: 'dist/a.js', content: 'export const a = 1;\n' },
    { path: 'src/api.gen.ts', content: 'export function api(): number {\n  return 1;\n}\n' },
    { path: 'src/k.ts', content: 'export function k(): number {\n  return 1;\n}\n' },
    { path: 'gone.ts', content: 'export function gone(): number {\n  return 1;\n}\n' },
    { path: 'src/a.ts', content: 'export function a(): number {\n  return 1;\n}\n' },
    { path: 'src/a.test.ts', content: "import { a } from './a.js';\n\nif (a() !== 1) throw new Error('a');\n" },
    { path: 'src/alias.ts', content: "import { h } from '@/util';\n\nexport function alias(): number {\n  return h();\n}\n" },
    { path: 'b.py', content: 'def b():\n    return 1\n' },
    { path: 'tests/test_b.py', content: 'import b\n\n\ndef test_b():\n    assert b.b() == 1\n' },
    { path: 'pkg/x.go', content: 'package x\n\nfunc X() int { return 1 }\n' },
    { path: 'pkg/x_test.go', content: 'package x\n\nimport "testing"\n\nfunc TestX(t *testing.T) {\n\tif X() != 1 {\n\t\tt.Fatal("x")\n\t}\n}\n' },
    { path: 'node_modules/m/index.js', content: 'module.exports = 1;\n' },
    { path: INDEXER_WALK.longPath, content: long },
  ]);
  for (const name of INDEXER_WALK.badNames) {
    writeFileSync(Buffer.concat([Buffer.from(`${dir}/`), name]), 'not utf-8 named\n');
  }
  git(dir, ['add', '-A']);
  git(dir, ['add', '-f', 'dist/a.js', 'src/api.gen.ts']);
  git(dir, ['commit', '-q', '-m', 'indexer-walk'], dateEnv(0));
  // History pairing gone.ts with src/k.ts.
  commit(
    dir,
    [
      { path: 'gone.ts', content: 'export function gone(): number {\n  return 2;\n}\n' },
      { path: 'src/k.ts', content: 'export function k(): number {\n  return 2;\n}\n' },
    ],
    { message: 'change gone and k together', day: 1 }
  );
  // Working-tree state after the commits (no hash depends on it).
  writeFiles(dir, [{ path: 'dist/b.js', content: 'export const b = 1;\n' }]);
  rmSync(path.join(dir, 'gone.ts'));
}

/** indexer-nongit (T-14-3): a plain tree — `a.ts`, a stray `.git/config`, `node_modules/n.js`. */
function indexerNongit(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFiles(dir, [
    { path: 'a.ts', content: 'export function a(): number {\n  return 1;\n}\n' },
    { path: '.git/config', content: '[core]\n\tbare = false\n' },
    { path: 'node_modules/n.js', content: 'module.exports = 1;\n' },
  ]);
}

// --- Fixture generators ------------------------------------------------------
//
// Each entry plants the scenario its §5.1 description / consuming-test Data
// states. Fixtures whose deep scenario is only pinned by a later step's test
// (Steps 13–38) are elaborated when that step is built and can verify them;
// every entry here already produces a deterministic repo so T-1-3 holds.

const generators: Record<string, (dir: string) => void> = {
  // Repo-identity fixtures (consumed by T-5-1 at Step 5).
  'repo-key-full'(dir) {
    // Full history with three root commits: main's root, plus two orphan roots
    // merged in, so `git rev-list --max-parents=0 HEAD` returns three roots and
    // the resolver keys on the lexicographically smallest.
    initRepo(dir);
    commit(dir, [{ path: 'a.txt', content: 'a\n' }], { message: 'root-main', day: 0 });
    git(dir, ['checkout', '-q', '--orphan', 'r2']);
    git(dir, ['rm', '-rfq', '--cached', '.']);
    rmSync(path.join(dir, 'a.txt'), { force: true });
    commit(dir, [{ path: 'b.txt', content: 'b\n' }], { message: 'root-two', day: 1 });
    git(dir, ['checkout', '-q', '--orphan', 'r3']);
    git(dir, ['rm', '-rfq', '--cached', '.']);
    rmSync(path.join(dir, 'b.txt'), { force: true });
    commit(dir, [{ path: 'c.txt', content: 'c\n' }], { message: 'root-three', day: 2 });
    git(dir, ['checkout', '-q', 'main']);
    // Merge the two orphan roots into main one at a time (unrelated histories),
    // so HEAD reaches all three root commits. Sequential 2-way merges avoid the
    // octopus strategy's refusal to combine unrelated histories.
    const mergeEnv = (day: number): Record<string, string> => ({
      GIT_AUTHOR_NAME: AUTHOR_NAME,
      GIT_AUTHOR_EMAIL: AUTHOR_EMAIL,
      GIT_AUTHOR_DATE: ISO(ANCHOR + day * DAY),
      GIT_COMMITTER_NAME: AUTHOR_NAME,
      GIT_COMMITTER_EMAIL: AUTHOR_EMAIL,
      GIT_COMMITTER_DATE: ISO(ANCHOR + day * DAY),
    });
    git(dir, ['merge', '-q', '--no-edit', '--allow-unrelated-histories', 'r2'], mergeEnv(3));
    git(dir, ['merge', '-q', '--no-edit', '--allow-unrelated-histories', 'r3'], mergeEnv(4));
  },
  'repo-key-shallow'(dir) {
    // Depth-1 clone of repo-key-full, with a fixed, real-looking origin URL so
    // the shallow branch keys on the normalized origin (T-5-1).
    const src = path.join(path.dirname(dir), `.${path.basename(dir)}-src`);
    generators['repo-key-full'](src);
    rmSync(dir, { recursive: true, force: true });
    git(path.dirname(dir), ['clone', '-q', '--depth', '1', `file://${src}`, path.basename(dir)]);
    git(dir, ['remote', 'set-url', 'origin', 'https://github.com/Owner/Repo.git']);
    rmSync(src, { recursive: true, force: true });
  },
  'repo-key-shallow-no-origin'(dir) {
    const src = path.join(path.dirname(dir), `.${path.basename(dir)}-src`);
    generators['repo-key-full'](src);
    rmSync(dir, { recursive: true, force: true });
    git(path.dirname(dir), ['clone', '-q', '--depth', '1', `file://${src}`, path.basename(dir)]);
    git(dir, ['remote', 'remove', 'origin']);
    rmSync(src, { recursive: true, force: true });
  },
  'repo-key-nongit'(dir) {
    // A plain directory that is not a git repository at all (resolver rule 4).
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    writeFiles(dir, [{ path: 'plain.txt', content: 'not a git repo\n' }]);
  },

  // Miner / index / genre fixtures — deterministic baseline repos here;
  // full planted scenarios are completed at their consuming steps (13–38).
  'miner-hygiene': minerHygiene, // T-13-1 (Step 13)
  'indexer-small': indexerSmall, // T-14-1, T-14-2 (Step 14)
  'coupling-nonobvious': (dir) => trivial(dir, 'coupling-nonobvious'),
  'orientation-mixed-shape': (dir) => trivial(dir, 'orientation-mixed-shape'),
  'reuse-mixed-language': (dir) => trivial(dir, 'reuse-mixed-language'),
  'reuse-observed-zero': (dir) => trivial(dir, 'reuse-observed-zero'),
  'reuse-same-name-collision': (dir) => trivial(dir, 'reuse-same-name-collision'),
  'consequence-coupled-tests': (dir) => trivial(dir, 'consequence-coupled-tests'),
  'warning-landmine': (dir) => trivial(dir, 'warning-landmine'),
  'completeness-paired-change': (dir) => trivial(dir, 'completeness-paired-change'),
  'verification-covering-test': (dir) => trivial(dir, 'verification-covering-test'),
  'bar-two-candidates': (dir) => trivial(dir, 'bar-two-candidates'),
  'dedup-read-set': (dir) => trivial(dir, 'dedup-read-set'),
  'corpus-floor-29'(dir) {
    // 29 non-excluded commits; the miner test adds the 30th at the corpus floor.
    initRepo(dir);
    for (let i = 0; i < 29; i++) {
      commit(dir, [{ path: 'f.txt', content: `line ${i}\n` }], { message: `c${i}`, day: i });
    }
  },
  'answer-drift-clearly-off': (dir) => trivial(dir, 'answer-drift-clearly-off'),
  'pristine-tree': (dir) => trivial(dir, 'pristine-tree'),
  'secret-injection': (dir) => trivial(dir, 'secret-injection'),
  'subagent-delivery': (dir) => trivial(dir, 'subagent-delivery'),
  'language-config-added': (dir) => trivial(dir, 'language-config-added'),
  'seeded-facts': (dir) => trivial(dir, 'seeded-facts'),
  'regret-true-positive': (dir) => trivial(dir, 'regret-true-positive'),
  'regret-no-inflate': (dir) => trivial(dir, 'regret-no-inflate'),
  // Reopened 2026-09-26 (Step 1 build delta (b); §5.1): deterministic
  // single-commit baselines, elaborated to their planted scenario by the
  // consuming step, exactly like the partial entries above —
  // coupling-key-symmetry (Step 38), miner-denominator / miner-labels /
  // miner-large (Step 13), indexer-walk / indexer-nongit (Step 14),
  // reuse-alias-unresolved (Step 18), recency-weighting (Step 16).
  'coupling-key-symmetry': (dir) => trivial(dir, 'coupling-key-symmetry'),
  'miner-denominator': minerDenominator, // T-13-2 (Step 13)
  'miner-labels': minerLabels, // T-13-3, T-13-4 (Step 13)
  'miner-large': minerLarge, // T-13-5 (Step 13)
  'indexer-walk': indexerWalk, // T-14-3 (Step 14)
  'indexer-nongit': indexerNongit, // T-14-3 (Step 14)
  'reuse-alias-unresolved': (dir) => trivial(dir, 'reuse-alias-unresolved'),
  'recency-weighting': (dir) => trivial(dir, 'recency-weighting'),
  'over-threshold-file'(dir) {
    // A >1 MB file carrying a seeded fact (AD-24 size cap).
    initRepo(dir);
    const big = 'x'.repeat(1_100_000);
    commit(
      dir,
      [
        { path: 'big.txt', content: `${big}\nSEEDED_FACT\n` },
        { path: 'small.ts', content: 'export const ok = 1;\n' },
      ],
      { message: 'add big file', day: 0 }
    );
  },
};

export const FIXTURE_NAMES: readonly string[] = Object.keys(generators).sort();

/** Generate the named fixture repository into `dir` (created/replaced). */
export function generateFixture(name: string, dir: string): void {
  const gen = generators[name];
  if (!gen) {
    throw new Error(`unknown fixture: ${name} (known: ${FIXTURE_NAMES.join(', ')})`);
  }
  gen(dir);
}
