// T-13-3 — History rewrite: one purge, a full re-mine, a fault (Step 13; AD-13's
// purge set, gap-list review G4).
//
// State transition mined → rewritten → re-mined, on a fresh generation of
// `miner-labels` (whose HEAD is `Revert "edit r two"`, a `git revert --no-edit`
// of the earlier commit X = `edit r two`). After the first mine: `git commit
// --amend` on HEAD (a new committer date, so the hash changes), then `git
// rebase --onto X^ X` dropping X (git also drops the amended revert, whose
// patch is then already upstream — executed on git 2.43.0), so the old
// watermark is no longer an ancestor of HEAD (`merge-base --is-ancestor` exits
// 1). The second mine must purge and re-mine; its result is compared with a
// second store that mines the rewritten history from scratch.
//
// Rows are compared by path, never by file id (the two stores assign ids in
// their own order); a `human_stated` landmine planted before the rewrite must
// survive the purge.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, probeFts5, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { filesDao } from '../../src/stores/dao/files.js';
import { landminesDao } from '../../src/stores/dao/landmines.js';
import { schemaMetaDao } from '../../src/stores/dao/schema_meta.js';
import { mineCochange } from '../../src/miner/cochange.js';
import type { TuningReader } from '../../src/types/candidate.js';
import { generateFixture, fixtureGit, LABELS } from '../fixtures/generate.js';

function openProject(file: string): Store {
  const s = openStore(file);
  applyMigrations(s, { fts: probeFts5(s) });
  return s;
}

function openTuning(file: string, key: string): TuningReader {
  const g = openStore(file);
  applyMigrations(g, { fts: false, scope: 'global' });
  seedDefaults(g);
  return tuningReader(g, key, () => {});
}

/** Every history-derived row, keyed by path (ids and wall-clock stamps excluded). */
function historySnapshot(store: Store): Record<string, unknown> {
  const pathOf = new Map(filesDao(store).all().map((f) => [f.id, f.path]));
  const p = (id: number): string => pathOf.get(id) ?? `#${id}`;
  const commits = store.prepare('SELECT hash, ts, entity_count, excluded, exclude_reason FROM commits ORDER BY hash').all();
  const pairs = (
    store.prepare('SELECT a, b, pair_count, pair_weight, last_ts, last_commit FROM cochange_pairs').all() as {
      a: number;
      b: number;
      pair_count: number;
      pair_weight: number;
      last_ts: number;
      last_commit: string;
    }[]
  )
    .map((r) => ({
      key: [p(r.a), p(r.b)].sort().join(' | '),
      pair_count: r.pair_count,
      pair_weight: r.pair_weight,
      last_ts: r.last_ts,
      last_commit: r.last_commit,
    }))
    .sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
  const touches = (
    store.prepare('SELECT file_id, commit_hash, label, ts FROM labelled_touches').all() as {
      file_id: number;
      commit_hash: string;
      label: string;
      ts: number;
    }[]
  )
    .map((r) => `${p(r.file_id)} ${r.commit_hash} ${r.label} ${r.ts}`)
    .sort();
  const counts = filesDao(store)
    .all()
    .filter((f) => f.change_count !== 0 || f.change_weight !== 0)
    .map((f) => ({ path: f.path, change_count: f.change_count, change_weight: f.change_weight }))
    .sort((x, y) => (x.path < y.path ? -1 : x.path > y.path ? 1 : 0));
  const landmines = (
    store
      .prepare(
        "SELECT kind, file_id, evidence, support, prov_kind, prov_ref, trust, injection_suspect FROM landmines WHERE kind IN ('revert_chain','fix_chatter')"
      )
      .all() as { kind: string; file_id: number; evidence: string; support: number | null; prov_kind: string; prov_ref: string; trust: string; injection_suspect: number }[]
  )
    .map((r) => ({
      kind: r.kind,
      path: p(r.file_id),
      evidence: r.evidence,
      support: r.support,
      prov_kind: r.prov_kind,
      prov_ref: r.prov_ref,
      trust: r.trust,
      injection_suspect: r.injection_suspect,
    }))
    .sort((x, y) => (`${x.kind} ${x.path}` < `${y.kind} ${y.path}` ? -1 : 1));
  return { commits: commits.map((r) => ({ ...(r as Record<string, unknown>) })), pairs, touches, counts, landmines };
}

/** Every (table, column) whose text value contains `needle`, excluding the `faults` table. */
function citations(store: Store, needle: string): string[] {
  const tables = (
    store.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name <> 'faults'").all() as { name: string }[]
  ).map((r) => r.name);
  const hits: string[] = [];
  for (const t of tables) {
    let rows: Record<string, unknown>[];
    try {
      rows = store.prepare(`SELECT * FROM "${t}"`).all() as Record<string, unknown>[];
    } catch {
      continue; // an FTS5 shadow/virtual table this handle cannot scan
    }
    for (const r of rows) {
      for (const [col, v] of Object.entries(r)) {
        if (typeof v === 'string' && v.includes(needle)) hits.push(`${t}.${col}`);
      }
    }
  }
  return [...new Set(hits)];
}

test('T-13-3: a history rewrite purges once, re-mines in full, and records history_rewritten', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-miner-rewrite-'));
  try {
    const repo = path.join(root, 'repo');
    generateFixture('miner-labels', repo);
    const diag = path.join(root, 'diagnostics');
    const store = openProject(path.join(root, 'project.db'));
    const tuning = openTuning(path.join(root, 'global.db'), 'miner-labels');

    // --- mined ---
    await mineCochange(store, repo, { tuning, diagnosticsDir: diag });
    const oldHead = fixtureGit(repo, ['rev-parse', 'HEAD']).trim();
    assert.match(fixtureGit(repo, ['log', '-1', '--format=%s', 'HEAD']).trim(), /^Revert "edit r two"$/, 'fixture: HEAD reverts X');
    const x = fixtureGit(repo, ['rev-parse', 'HEAD~1']).trim();
    assert.equal(fixtureGit(repo, ['log', '-1', '--format=%s', x]).trim(), 'edit r two', 'fixture: X is `edit r two`');
    const humanFile = filesDao(store).byPath('f.txt');
    assert.ok(humanFile !== undefined, 'the first mine created a files row for f.txt');
    const humanId = landminesDao(store).createHuman({
      fileId: humanFile.id,
      evidence: 'owner-stated hazard planted before the rewrite',
      prov: { prov_kind: 'human', prov_ref: 'T-13-3', trust: 'human' },
    });

    // --- rewritten ---
    fixtureGit(repo, ['commit', '-q', '--amend', '--no-edit'], { day: LABELS.headDay, sec: 30 });
    fixtureGit(repo, ['rebase', '-q', '--onto', `${x}~1`, x], { day: LABELS.headDay, sec: 60 });
    const newHead = fixtureGit(repo, ['rev-parse', 'HEAD']).trim();
    assert.notEqual(newHead, oldHead, 'fixture: the rewrite moved HEAD');

    // --- re-mined ---
    await mineCochange(store, repo, { tuning, diagnosticsDir: diag });

    const scratch = openProject(path.join(root, 'scratch.db'));
    await mineCochange(scratch, repo, { tuning: openTuning(path.join(root, 'global2.db'), 'miner-labels'), diagnosticsDir: diag });

    assert.deepEqual(historySnapshot(store), historySnapshot(scratch), 'the re-mined store differs from a from-scratch mine of the rewritten history');

    for (const [name, h] of [
      ['old HEAD', oldHead],
      ['X', x],
    ] as const) {
      assert.deepEqual(citations(store, h), [], `a row cites the rewritten-away ${name} ${h}`);
    }

    const human = landminesDao(store)
      .forFile(humanFile.id)
      .filter((l) => l.kind === 'human_stated');
    assert.deepEqual(
      human.map((l) => l.id),
      [humanId],
      'the human_stated row planted before the rewrite is gone'
    );

    const faults = store.prepare("SELECT detail_json FROM faults WHERE code = 'history_rewritten'").all() as { detail_json: string | null }[];
    assert.ok(
      faults.some((f) => {
        const d = JSON.parse(f.detail_json ?? 'null') as { oldWatermark?: unknown; newHead?: unknown } | null;
        return d !== null && d.oldWatermark === oldHead && d.newHead === newHead;
      }),
      `no history_rewritten fault carries {oldWatermark: ${oldHead}, newHead: ${newHead}}: ${JSON.stringify(faults)}`
    );

    assert.equal(schemaMetaDao(store).get('mining_in_progress'), '0', "mining_in_progress is not '0' afterwards");
    store.close();
    scratch.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
