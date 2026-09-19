// T-7-1 — the project migration applies under both FTS flags, every CHECK
// rejects its negative, the open-scoped dedup index enforces the questions state
// machine, and no Phase B/C table is created (Step 7). Real node:sqlite + the
// real migration files; no doubles.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';

function withStore(fn: (store: Store) => void): void {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-migr-'));
  const store = openStore(path.join(dir, 'store.db'));
  try {
    fn(store);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function names(store: Store, type?: string): Set<string> {
  const sql = type ? `SELECT name FROM sqlite_master WHERE type = '${type}'` : 'SELECT name FROM sqlite_master';
  return new Set((store.prepare(sql).all() as { name: string }[]).map((r) => r.name));
}

function metaValue(store: Store, key: string): string | undefined {
  const row = store.prepare('SELECT value FROM schema_meta WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

function rejects(store: Store, sql: string, params: unknown[]): void {
  assert.throws(() => store.prepare(sql).run(...params));
}

function insertSql(table: string, cols: string[]): string {
  return `INSERT INTO ${table}(${cols.join(', ')}) VALUES(${cols.map(() => '?').join(', ')})`;
}

test('T-7-1a: fts:true applies 001 + 001b; fts_state=fts5; LIKE indexes and no forbidden tables', () => {
  withStore((store) => {
    applyMigrations(store, { fts: true });
    const tables = names(store, 'table');
    assert.equal(metaValue(store, 'fts_state'), 'fts5');
    assert.ok(tables.has('fts_symbols') && tables.has('fts_paths'), 'fts virtual tables exist');
    const indexes = names(store, 'index');
    assert.ok(indexes.has('symbols_name') && indexes.has('files_path'), 'LIKE-fallback indexes exist');
    for (const forbidden of ['exemplars', 'recipes', 'env_capabilities', 'deferred_queue', 'genre_state']) {
      assert.equal(tables.has(forbidden), false, `${forbidden} must not exist`);
    }
  });
});

test('T-7-1b: fts:false applies 001 only; fts_state=fallback; no fts_* table; re-run does not flip it', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    let tables = names(store, 'table');
    assert.equal(metaValue(store, 'fts_state'), 'fallback');
    assert.equal(tables.has('fts_symbols'), false);
    assert.equal(tables.has('fts_paths'), false);
    const indexes = names(store, 'index');
    assert.ok(indexes.has('symbols_name') && indexes.has('files_path'), 'LIKE-fallback indexes exist');

    // Re-run with the opposite flag: fts_state is written once, never retried.
    applyMigrations(store, { fts: true });
    tables = names(store, 'table');
    assert.equal(metaValue(store, 'fts_state'), 'fallback', 'fts_state unchanged on re-run');
    assert.equal(tables.has('fts_symbols'), false, 'no fts table appears on re-run');
    assert.equal(tables.has('fts_paths'), false);
  });
});

test('T-7-1c: every CHECK-constrained column rejects its negative; valid rows are accepted', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });

    // Two files to satisfy the FK-and-CHECK cases below.
    const fileCols = [
      'path', 'lang', 'zone', 'content_hash', 'mtime',
      'prov_kind', 'prov_ref', 'trust', 'injection_suspect', 'created_at', 'updated_at',
    ];
    const fileVals = (p: string): unknown[] => [p, 'ts', 'source', 'h', 1, 'mechanical', 'r', 'mechanical', 0, 1, 1];
    const f1 = store.prepare(insertSql('files', fileCols)).run(...fileVals('a.ts'));
    const f2 = store.prepare(insertSql('files', fileCols)).run(...fileVals('b.ts'));
    const id1 = Number(f1.lastInsertRowid);
    const id2 = Number(f2.lastInsertRowid);

    // files: zone + the three PROV CHECKs.
    rejects(store, insertSql('files', fileCols), ['z.ts', 'ts', 'bogus', 'h', 1, 'mechanical', 'r', 'mechanical', 0, 1, 1]);
    rejects(store, insertSql('files', fileCols), ['z.ts', 'ts', 'source', 'h', 1, 'bogus', 'r', 'mechanical', 0, 1, 1]);
    rejects(store, insertSql('files', fileCols), ['z.ts', 'ts', 'source', 'h', 1, 'mechanical', 'r', 'trusted', 0, 1, 1]);
    rejects(store, insertSql('files', fileCols), ['z.ts', 'ts', 'source', 'h', 1, 'mechanical', 'r', 'mechanical', 2, 1, 1]);

    // The PROV CHECK block on every other knowledge table: a valid row, then
    // trust/prov_kind/injection_suspect negatives (proves the CHECK is present
    // on each table, not just files).
    const prov = ['prov_kind', 'prov_ref', 'trust', 'injection_suspect', 'created_at', 'updated_at'];
    const provOk = ['mechanical', 'r', 'mechanical', 0, 1, 1];
    const provBad: [number, string | number][] = [
      [0, 'bogus'], // prov_kind
      [2, 'trusted'], // trust
      [3, 2], // injection_suspect
    ];
    const provTables: { table: string; head: string[]; headVals: unknown[] }[] = [
      { table: 'symbols', head: ['file_id', 'name', 'kind', 'span_start', 'span_end'], headVals: [id1, 's', 'function', 0, 5] },
      { table: 'test_map', head: ['test_file', 'region_glob', 'source'], headVals: [id1, 'g', 'heuristic'] },
      { table: 'landmines', head: ['id', 'kind', 'file_id', 'evidence'], headVals: ['L1', 'revert_chain', id1, 'e'] },
      { table: 'invariants', head: ['id', 'description'], headVals: ['I1', 'd'] },
      { table: 'human_facts', head: ['id', 'statement', 'target_kind', 'target_ref', 'stated_at'], headVals: ['H1', 's', 'file', 'a.ts', 1] },
    ];
    for (const { table, head, headVals } of provTables) {
      const cols = [...head, ...prov];
      store.prepare(insertSql(table, cols)).run(...headVals, ...provOk); // valid
      for (const [idx, badVal] of provBad) {
        const bad = [...provOk];
        bad[idx] = badVal;
        rejects(store, insertSql(table, cols), [...headVals, ...bad]);
      }
    }

    // landmines.kind negative.
    rejects(store, insertSql('landmines', ['id', 'kind', 'file_id', 'evidence', ...prov]),
      ['L2', 'bogus', id1, 'e', ...provOk]);

    // cochange_pairs CHECK(a < b).
    store.prepare(insertSql('cochange_pairs', ['a', 'b', 'pair_count', 'a_count', 'b_count', 'last_ts']))
      .run(id1, id2, 1, 1, 1, 1); // valid a<b
    rejects(store, insertSql('cochange_pairs', ['a', 'b', 'pair_count', 'a_count', 'b_count', 'last_ts']),
      [id2, id1, 1, 1, 1, 1]); // a>b
    rejects(store, insertSql('cochange_pairs', ['a', 'b', 'pair_count', 'a_count', 'b_count', 'last_ts']),
      [id1, id1, 1, 1, 1, 1]); // a==b

    // corrections: verdict + the whisper/deny exclusive-or.
    store.prepare(insertSql('corrections', ['id', 'whisper_id', 'deny_id', 'verdict', 'ts']))
      .run('C1', 'w1', null, 'false_fire', 1); // valid
    rejects(store, insertSql('corrections', ['id', 'whisper_id', 'deny_id', 'verdict', 'ts']),
      ['C2', 'w2', null, 'bogus', 1]); // bad verdict
    rejects(store, insertSql('corrections', ['id', 'whisper_id', 'deny_id', 'verdict', 'ts']),
      ['C3', null, null, 'confirm', 1]); // neither set
    rejects(store, insertSql('corrections', ['id', 'whisper_id', 'deny_id', 'verdict', 'ts']),
      ['C4', 'w4', 'd4', 'confirm', 1]); // both set

    // consumer_state.kind.
    store.prepare(insertSql('consumer_state', ['consumer', 'kind', 'subject_key', 'ts']))
      .run('main', 'delivered', 'k', 1);
    rejects(store, insertSql('consumer_state', ['consumer', 'kind', 'subject_key', 'ts']),
      ['main', 'bogus', 'k2', 1]);

    // observed_actions: command_class + outcome.
    store.prepare(insertSql('observed_actions', ['session', 'consumer', 'seq', 'tool', 'command_class', 'outcome', 'ts']))
      .run('s', 'main', 0, 'Bash', 1, 'ok', 1);
    rejects(store, insertSql('observed_actions', ['session', 'consumer', 'seq', 'tool', 'command_class', 'outcome', 'ts']),
      ['s', 'main', 1, 'Bash', 4, 'ok', 1]);
    rejects(store, insertSql('observed_actions', ['session', 'consumer', 'seq', 'tool', 'command_class', 'outcome', 'ts']),
      ['s', 'main', 2, 'Bash', 1, 'maybe', 1]);

    // regret: fact_kind + churn_kind + candidate_state.
    const regCols = ['id', 'session', 'fact_kind', 'fact_ref', 'churn_kind', 'candidate_state', 'ts'];
    store.prepare(insertSql('regret', regCols)).run('R1', 's', 'landmine', 'x', 'reverted', 'held_below_bar', 1);
    rejects(store, insertSql('regret', regCols), ['R2', 's', 'bogus', 'x', 'reverted', 'held_below_bar', 1]);
    rejects(store, insertSql('regret', regCols), ['R3', 's', 'landmine', 'x', 'bogus', 'held_below_bar', 1]);
    rejects(store, insertSql('regret', regCols), ['R4', 's', 'landmine', 'x', 'reverted', 'bogus', 1]);

    // whisper_audit.kind.
    store.prepare(insertSql('whisper_audit', ['id', 'session', 'consumer', 'kind', 'ts', 'text']))
      .run('WA1', 's', 'main', 'whisper', 1, 't');
    rejects(store, insertSql('whisper_audit', ['id', 'session', 'consumer', 'kind', 'ts', 'text']),
      ['WA2', 's', 'main', 'bogus', 1, 't']);

    // classified_turns: clears + reason.
    store.prepare(insertSql('classified_turns', ['consumer', 'uuid', 'ts', 'clears', 'reason']))
      .run('main', 'u1', 1, 1, null);
    rejects(store, insertSql('classified_turns', ['consumer', 'uuid', 'ts', 'clears', 'reason']),
      ['main', 'u2', 1, 2, null]); // clears out of {0,1}
    rejects(store, insertSql('classified_turns', ['consumer', 'uuid', 'ts', 'clears', 'reason']),
      ['main', 'u3', 1, 0, 'bogus']); // bad reason

    // questions: status + closed_by_kind negatives.
    rejects(store, insertSql('questions', ['id', 'consumer', 'question_text', 'content_hash', 'status', 'opened_at']),
      ['Qneg', 'main', 't', 'h', 'bogus', 1]);
    rejects(store, insertSql('questions', ['id', 'consumer', 'question_text', 'content_hash', 'status', 'closed_by_kind', 'opened_at']),
      ['Qneg2', 'main', 't', 'h', 'answered', 'bogus', 1]);
  });
});

test('T-7-1d: the open-scoped dedup index enforces open -> duplicate(rejected) -> answered -> re-open', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    const cols = ['id', 'consumer', 'question_text', 'content_hash', 'asked_uuid', 'status', 'opened_at'];
    const ins = insertSql('questions', cols);

    store.prepare(ins).run('q1', 'main', 'why?', 'H', 'u1', 'open', 1); // open
    rejects(store, ins, ['q2', 'main', 'why?', 'H', 'u2', 'open', 2]); // duplicate open -> rejected

    store.prepare("UPDATE questions SET status = 'answered', closed_at = 3 WHERE id = 'q1'").run(); // answered
    store.prepare(ins).run('q3', 'main', 'why?', 'H', 'u3', 'open', 4); // re-open now accepted

    const open = store
      .prepare("SELECT id FROM questions WHERE consumer = 'main' AND content_hash = 'H' AND status = 'open'")
      .all() as { id: string }[];
    assert.deepEqual(open.map((r) => r.id), ['q3']);
  });
});
