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
  'miner-hygiene': (dir) => trivial(dir, 'miner-hygiene'),
  'indexer-small': (dir) => trivial(dir, 'indexer-small'),
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
