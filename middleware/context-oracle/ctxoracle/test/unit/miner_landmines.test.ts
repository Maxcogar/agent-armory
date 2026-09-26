// T-13-4 — Labels and the per-pass landmine rebuild (Step 13; AD-15, gap-list
// review G1, G5, N5).
//
// Real git over a fresh generation of `miner-labels`; real store; no doubles.
// Seeds (Step 12): lexicon.fix_keywords [fix, fixes, fixed, fixing, bug,
// bugfix, hotfix], landmine.fix_chatter_k 3, landmine.fix_chatter_window_days
// 90, miner.max_transaction_entities 30, miner.horizon_years 5.
//
// Decision table (fixture `miner-labels`, HEAD at day 200):
//   r.txt   two commits, each reverted by `git revert --no-edit` (trailer)
//           -> two revert labels, revert_chain support 2
//   big/    a 40-file commit (size-excluded) reverted by a 40-file revert
//           -> every big/ file carries one revert label (revert detection runs
//              before the size exclusion)
//   f.txt   `Fix: a`, `bug-fix b`, `hotfix c`, `fixing d` (whole-token match)
//           -> fix_chatter support 4; after three more `fix e/f/g` commits and
//              an incremental mine -> one fix_chatter row, support 7
//   x.txt   `add fixture`, `prefix cleanup`, `suffix` -> no label
//   s.txt   a 40-file `fix lint` commit -> no fix label (size-excluded)
//   v.txt   `Revert "fix v"` (no trailer: the subject fallback) -> a revert
//           label and no fix label
//   old.txt three fix commits 100 days before HEAD -> fix labels (included
//           commits), but no fix_chatter (window 90)
// then the whole run repeated three times with no new commits.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, probeFts5, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { filesDao } from '../../src/stores/dao/files.js';
import { mineCochange } from '../../src/miner/cochange.js';
import type { TuningReader } from '../../src/types/candidate.js';
import { generateFixture, fixtureCommit, fixtureGit, LABELS } from '../fixtures/generate.js';

const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-miner-labels-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const repo = path.join(root, 'repo');
const diag = path.join(root, 'diagnostics');
let store: Store;
let tuning: TuningReader;

const INCREMENTAL_SUBJECTS = ['fix e', 'fix f', 'fix g'];

function hashBySubject(): Map<string, string> {
  const m = new Map<string, string>();
  for (const line of fixtureGit(repo, ['log', '--format=%H %s']).trim().split('\n')) {
    const sp = line.indexOf(' ');
    m.set(line.slice(sp + 1), line.slice(0, sp));
  }
  return m;
}

function h(subject: string): string {
  const v = hashBySubject().get(subject);
  if (v === undefined) throw new Error(`fixture has no commit with subject ${JSON.stringify(subject)}`);
  return v;
}

function mine(): Promise<unknown> {
  return mineCochange(store, repo, { tuning, diagnosticsDir: diag });
}

/** labelled_touches as sorted `path label hash` strings. */
function touches(): string[] {
  return (
    store
      .prepare('SELECT f.path, t.label, t.commit_hash FROM labelled_touches t JOIN files f ON f.id = t.file_id')
      .all() as { path: string; label: string; commit_hash: string }[]
  )
    .map((r) => `${r.path} ${r.label} ${r.commit_hash}`)
    .sort();
}

interface MinerRow {
  kind: string;
  path: string;
  support: number | null;
  evidence: string[];
}

function minerRows(): MinerRow[] {
  return (
    store
      .prepare(
        "SELECT l.kind, f.path, l.support, l.evidence FROM landmines l JOIN files f ON f.id = l.file_id WHERE l.kind IN ('revert_chain','fix_chatter') ORDER BY l.kind, f.path"
      )
      .all() as { kind: string; path: string; support: number | null; evidence: string }[]
  ).map((r) => ({ kind: r.kind, path: r.path, support: r.support, evidence: JSON.parse(r.evidence) as string[] }));
}

function assertOneRowPerKind(when: string): void {
  const dup = store
    .prepare(
      "SELECT kind, file_id, count(*) AS n FROM landmines WHERE kind IN ('revert_chain','fix_chatter') GROUP BY kind, file_id HAVING n > 1"
    )
    .all();
  assert.deepEqual(dup.map((r) => ({ ...(r as Record<string, unknown>) })), [], `${when}: a file has more than one row of a miner kind`);
}

/** Every fixture commit subject (and git's trailer text) that must never be stored. */
function messageTexts(): string[] {
  return [...hashBySubject().keys(), 'This reverts commit'];
}

function assertNoMessageText(when: string): void {
  const tables = (store.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map((r) => r.name);
  const texts = messageTexts();
  for (const t of tables) {
    let rows: Record<string, unknown>[];
    try {
      rows = store.prepare(`SELECT * FROM "${t}"`).all() as Record<string, unknown>[];
    } catch {
      continue; // an FTS5 shadow/virtual table this handle cannot scan
    }
    for (const r of rows) {
      for (const [col, v] of Object.entries(r)) {
        if (typeof v !== 'string') continue;
        for (const m of texts) assert.ok(!v.includes(m), `${when}: commit message text ${JSON.stringify(m)} stored in ${t}.${col}`);
      }
    }
  }
}

function expectedTouches(fixSubjects: string[]): string[] {
  const rows: string[] = [];
  rows.push(`r.txt revert ${h('Revert "edit r one"')}`, `r.txt revert ${h('Revert "edit r two"')}`);
  for (const p of LABELS.bigPaths) rows.push(`${p} revert ${h('Revert "add big"')}`);
  for (const s of fixSubjects) rows.push(`f.txt fix ${h(s)}`);
  rows.push(`v.txt revert ${h('Revert "fix v"')}`);
  for (let i = 0; i < 3; i++) rows.push(`old.txt fix ${h(`fix old ${i}`)}`);
  return rows.sort();
}

function expectedMinerRows(fixSubjects: string[]): MinerRow[] {
  return [
    {
      kind: 'fix_chatter',
      path: 'f.txt',
      support: fixSubjects.length,
      evidence: [...fixSubjects].reverse().map(h), // newest first
    },
    {
      kind: 'revert_chain',
      path: 'r.txt',
      support: 2,
      evidence: [h('Revert "edit r two"'), h('Revert "edit r one"')], // newest first
    },
  ];
}

test('T-13-4a: the base mine labels exactly the decision table and rebuilds one row per (kind, file)', async () => {
  generateFixture('miner-labels', repo);
  store = openStore(path.join(root, 'project.db'));
  applyMigrations(store, { fts: probeFts5(store) });
  const global = openStore(path.join(root, 'global.db'));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  tuning = tuningReader(global, 'miner-labels', () => {});

  await mine();

  const base = [...LABELS.fixSubjects];
  assert.deepEqual(touches(), expectedTouches(base), 'labelled_touches differs from the decision table');
  assert.deepEqual(minerRows(), expectedMinerRows(base), 'miner-kind landmines differ (rows, support, or newest-first evidence)');
  // Stated absences, by name.
  const labelled = new Set(touches().map((t) => t.split(' ')[0]));
  for (const p of ['x.txt', 's.txt', ...LABELS.lintPaths]) assert.ok(!labelled.has(p), `${p} must carry no label`);
  assert.ok(!touches().some((t) => t.startsWith('v.txt fix ')), 'v.txt (`Revert "fix v"`) must carry no fix label');
  assert.ok(!minerRows().some((r) => r.path === 'old.txt'), 'old.txt (fixes 100 days before HEAD, window 90) has no fix_chatter');
  assert.ok(filesDao(store).byPath('f.txt') !== undefined);
  assertOneRowPerKind('base pass');
  assertNoMessageText('base pass');
});

test('T-13-4b: three more fix commits and an incremental mine give one fix_chatter row, support 7', async () => {
  INCREMENTAL_SUBJECTS.forEach((m, i) => {
    fixtureCommit(repo, [{ path: 'f.txt', content: `f inc ${i}\n` }], { message: m, day: LABELS.incrementalDays[i] as number });
  });
  await mine();
  const all = [...LABELS.fixSubjects, ...INCREMENTAL_SUBJECTS];
  assert.deepEqual(touches(), expectedTouches(all), 'labelled_touches after the incremental pass');
  assert.deepEqual(minerRows(), expectedMinerRows(all), 'miner-kind landmines after the incremental pass');
  assertOneRowPerKind('incremental pass');
  assertNoMessageText('incremental pass');
});

test('T-13-4c: three idle passes with no new commits change nothing', async () => {
  const all = [...LABELS.fixSubjects, ...INCREMENTAL_SUBJECTS];
  for (let pass = 1; pass <= 3; pass++) {
    await mine();
    assert.deepEqual(touches(), expectedTouches(all), `idle pass ${pass}: labelled_touches`);
    assert.deepEqual(minerRows(), expectedMinerRows(all), `idle pass ${pass}: miner-kind landmines`);
    assertOneRowPerKind(`idle pass ${pass}`);
    assertNoMessageText(`idle pass ${pass}`);
  }
});
