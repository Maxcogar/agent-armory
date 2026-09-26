// T-7-1 — the project migration applies under both FTS flags, every CHECK
// rejects its negative, the open-scoped dedup index enforces the questions state
// machine, and no Phase B/C table is created (Step 7). Real node:sqlite + the
// real migration files; no doubles.
//
// Reopened 2026-09-26 (Step 7 build delta; T-7-1 Data revised). Changes against
// the Checkpoint-1 version of this file, each cited:
// - The built `symbols_name` index is "no longer created" (001 edited in place);
//   `symbol_tokens_token` and `path_tokens_token` exist instead. T-7-1a/b
//   formerly asserted `symbols_name` exists; they now assert its absence.
// - `files` rows carry the new NOT NULL `in_tree` column; `cochange_pairs` rows
//   use `pair_weight`/`last_commit` (no `a_count`/`b_count`); `test_map.source`
//   is CHECKed to ('import_edge','same_dir'), so the valid row uses
//   'import_edge' (formerly 'heuristic') and a negative is added.
// - The landmines PROV-CHECK rows use kind 'human_stated', because a second
//   'revert_chain' row for one file is now rejected by `landmines_miner_key`
//   whatever its PROV values — a negative rejected by the unique index would no
//   longer prove the CHECK.
// - The 2026-09-26 cases (T-7-1e onward) are new.

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

function columns(store: Store, table: string): string[] {
  return (store.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((r) => r.name);
}

function metaValue(store: Store, key: string): string | undefined {
  const row = store.prepare('SELECT value FROM schema_meta WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

// A negative must be refused by a constraint — never pass because the SQL itself
// is wrong (an unknown column or table would also throw).
function rejects(store: Store, sql: string, params: unknown[]): void {
  assert.throws(() => store.prepare(sql).run(...params), /constraint failed/i);
}

function insertSql(table: string, cols: string[]): string {
  return `INSERT INTO ${table}(${cols.join(', ')}) VALUES(${cols.map(() => '?').join(', ')})`;
}

const FILE_COLS = [
  'path', 'lang', 'zone', 'in_tree', 'content_hash', 'mtime',
  'prov_kind', 'prov_ref', 'trust', 'injection_suspect', 'created_at', 'updated_at',
];
const fileVals = (p: string): unknown[] => [p, 'ts', 'source', 1, 'h', 1, 'repo_span', 'r', 'untrusted_repo', 0, 1, 1];
function insertFile(store: Store, p: string): number {
  return Number(store.prepare(insertSql('files', FILE_COLS)).run(...fileVals(p)).lastInsertRowid);
}

const PROV = ['prov_kind', 'prov_ref', 'trust', 'injection_suspect', 'created_at', 'updated_at'];
const PROV_OK = ['repo_span', 'r', 'untrusted_repo', 0, 1, 1];
const PAIR_COLS = ['a', 'b', 'pair_count', 'pair_weight', 'last_ts', 'last_commit'];
const LANDMINE_COLS = ['id', 'kind', 'file_id', 'evidence', ...PROV];

test('T-7-1a: fts:true applies 001 + 001b; fts_state=fts5; token indexes, no symbols_name, no forbidden tables', () => {
  withStore((store) => {
    applyMigrations(store, { fts: true });
    const tables = names(store, 'table');
    assert.equal(metaValue(store, 'fts_state'), 'fts5');
    assert.ok(tables.has('fts_symbols') && tables.has('fts_paths'), 'fts virtual tables exist');
    const indexes = names(store, 'index');
    assert.ok(indexes.has('files_path'), 'files_path index exists');
    assert.ok(indexes.has('symbol_tokens_token') && indexes.has('path_tokens_token'), 'token indexes exist');
    assert.equal(indexes.has('symbols_name'), false, 'symbols_name is no longer created');
    for (const forbidden of ['exemplars', 'recipes', 'env_capabilities', 'deferred_queue', 'genre_state']) {
      assert.equal(tables.has(forbidden), false, `${forbidden} must not exist`);
    }
  });
});

test('T-7-1b: fts:false applies 001 only; fts_state=fallback; no fts_* table; token indexes, no symbols_name; re-run does not flip it', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    let tables = names(store, 'table');
    assert.equal(metaValue(store, 'fts_state'), 'fallback');
    assert.equal(tables.has('fts_symbols'), false);
    assert.equal(tables.has('fts_paths'), false);
    const indexes = names(store, 'index');
    assert.ok(indexes.has('symbol_tokens_token'), 'symbol_tokens_token index exists');
    assert.ok(indexes.has('path_tokens_token'), 'path_tokens_token index exists');
    assert.equal(indexes.has('symbols_name'), false, 'no symbols_name index');

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

    const id1 = insertFile(store, 'a.ts');
    const id2 = insertFile(store, 'b.ts');

    // files: zone + the three PROV CHECKs.
    const badFile = (i: number, v: unknown): unknown[] => {
      const vals = fileVals('z.ts');
      vals[i] = v;
      return vals;
    };
    rejects(store, insertSql('files', FILE_COLS), badFile(2, 'bogus')); // zone
    rejects(store, insertSql('files', FILE_COLS), badFile(6, 'bogus')); // prov_kind
    rejects(store, insertSql('files', FILE_COLS), badFile(8, 'trusted')); // trust
    rejects(store, insertSql('files', FILE_COLS), badFile(9, 2)); // injection_suspect

    // The PROV CHECK block on every other knowledge table: a valid row, then
    // trust/prov_kind/injection_suspect negatives.
    const provBad: [number, string | number][] = [
      [0, 'bogus'], // prov_kind
      [2, 'trusted'], // trust
      [3, 2], // injection_suspect
    ];
    const provTables: { table: string; head: string[]; headVals: unknown[] }[] = [
      { table: 'symbols', head: ['file_id', 'name', 'kind', 'span_start', 'span_end'], headVals: [id1, 's', 'function', 0, 5] },
      { table: 'test_map', head: ['test_file', 'region_glob', 'source'], headVals: [id1, 'a.ts', 'import_edge'] },
      { table: 'landmines', head: ['id', 'kind', 'file_id', 'evidence'], headVals: ['L1', 'human_stated', id1, 'e'] },
      { table: 'invariants', head: ['id', 'description'], headVals: ['I1', 'd'] },
      { table: 'human_facts', head: ['id', 'statement', 'target_kind', 'target_ref', 'stated_at'], headVals: ['H1', 's', 'file', 'a.ts', 1] },
    ];
    let n = 0;
    for (const { table, head, headVals } of provTables) {
      const cols = [...head, ...PROV];
      store.prepare(insertSql(table, cols)).run(...headVals, ...PROV_OK); // valid
      for (const [idx, badVal] of provBad) {
        const bad = [...PROV_OK];
        bad[idx] = badVal;
        const hv = [...headVals];
        if (typeof hv[0] === 'string') hv[0] = `${hv[0]}-neg${n++}`; // fresh text id per negative
        rejects(store, insertSql(table, cols), [...hv, ...bad]);
      }
    }

    // test_map.source negative.
    rejects(store, insertSql('test_map', ['test_file', 'region_glob', 'source', ...PROV]),
      [id1, 'a.ts', 'heuristic', ...PROV_OK]);

    // landmines.kind negative.
    rejects(store, insertSql('landmines', LANDMINE_COLS), ['L2', 'bogus', id1, 'e', ...PROV_OK]);

    // cochange_pairs CHECK(a < b).
    store.prepare(insertSql('cochange_pairs', PAIR_COLS)).run(id1, id2, 1, 1.0, 1, 'h'); // valid a<b
    rejects(store, insertSql('cochange_pairs', PAIR_COLS), [id2, id1, 1, 1.0, 1, 'h']); // a>b
    rejects(store, insertSql('cochange_pairs', PAIR_COLS), [id1, id1, 1, 1.0, 1, 'h']); // a==b

    // corrections: verdict + the whisper/deny rules.
    const corrCols = ['id', 'whisper_id', 'deny_id', 'verdict', 'ts'];
    store.prepare(insertSql('corrections', corrCols)).run('C1', 'w1', null, 'false_fire', 1); // valid
    rejects(store, insertSql('corrections', corrCols), ['C2', 'w2', null, 'bogus', 1]); // bad verdict
    rejects(store, insertSql('corrections', corrCols), ['C3', null, null, 'confirm', 1]); // neither set, not missed
    rejects(store, insertSql('corrections', corrCols), ['C4', 'w4', 'd4', 'confirm', 1]); // both set

    // consumer_state.kind.
    store.prepare(insertSql('consumer_state', ['consumer', 'kind', 'subject_key', 'ts']))
      .run('s#main', 'delivered', 'k', 1);
    rejects(store, insertSql('consumer_state', ['consumer', 'kind', 'subject_key', 'ts']),
      ['s#main', 'bogus', 'k2', 1]);

    // observed_actions: command_class + outcome.
    const oaCols = ['session', 'consumer', 'tool', 'command_class', 'outcome', 'ts'];
    store.prepare(insertSql('observed_actions', oaCols)).run('s', 's#main', 'Bash', 1, 'ok', 1);
    rejects(store, insertSql('observed_actions', oaCols), ['s', 's#main', 'Bash', 4, 'ok', 1]);
    rejects(store, insertSql('observed_actions', oaCols), ['s', 's#main', 'Bash', 1, 'maybe', 1]);

    // regret: fact_kind + churn_kind + candidate_state.
    const regCols = ['id', 'session', 'fact_kind', 'fact_ref', 'churn_kind', 'candidate_state', 'ts'];
    store.prepare(insertSql('regret', regCols)).run('R1', 's', 'landmine', 'x', 'reverted', 'held_below_bar', 1);
    rejects(store, insertSql('regret', regCols), ['R2', 's', 'bogus', 'x', 'reverted', 'held_below_bar', 1]);
    rejects(store, insertSql('regret', regCols), ['R3', 's', 'landmine', 'x', 'bogus', 'held_below_bar', 1]);
    rejects(store, insertSql('regret', regCols), ['R4', 's', 'landmine', 'x', 'reverted', 'bogus', 1]);

    // whisper_audit.kind.
    store.prepare(insertSql('whisper_audit', ['id', 'session', 'consumer', 'kind', 'ts', 'text']))
      .run('WA1', 's', 's#main', 'whisper', 1, 't');
    rejects(store, insertSql('whisper_audit', ['id', 'session', 'consumer', 'kind', 'ts', 'text']),
      ['WA2', 's', 's#main', 'bogus', 1, 't']);

    // classified_turns: clears + reason.
    store.prepare(insertSql('classified_turns', ['consumer', 'uuid', 'ts', 'clears', 'reason']))
      .run('s#main', 'u1', 1, 1, null);
    rejects(store, insertSql('classified_turns', ['consumer', 'uuid', 'ts', 'clears', 'reason']),
      ['s#main', 'u2', 1, 2, null]); // clears out of {0,1}
    rejects(store, insertSql('classified_turns', ['consumer', 'uuid', 'ts', 'clears', 'reason']),
      ['s#main', 'u3', 1, 0, 'bogus']); // bad reason

    // questions: status + closed_by_kind negatives.
    rejects(store, insertSql('questions', ['id', 'consumer', 'question_text', 'content_hash', 'status', 'opened_at']),
      ['Qneg', 's#main', 't', 'h', 'bogus', 1]);
    rejects(store, insertSql('questions', ['id', 'consumer', 'question_text', 'content_hash', 'status', 'closed_by_kind', 'opened_at']),
      ['Qneg2', 's#main', 't', 'h', 'answered', 'bogus', 1]);
  });
});

test('T-7-1d: the open-scoped dedup index enforces open -> duplicate(rejected) -> answered -> re-open', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    const cols = ['id', 'consumer', 'question_text', 'content_hash', 'asked_uuid', 'status', 'opened_at'];
    const ins = insertSql('questions', cols);

    store.prepare(ins).run('q1', 's#main', 'why?', 'H', 'u1', 'open', 1); // open
    rejects(store, ins, ['q2', 's#main', 'why?', 'H', 'u2', 'open', 2]); // duplicate open -> rejected

    store.prepare("UPDATE questions SET status = 'answered', closed_at = 3 WHERE id = 'q1'").run(); // answered
    store.prepare(ins).run('q3', 's#main', 'why?', 'H', 'u3', 'open', 4); // re-open now accepted

    const open = store
      .prepare("SELECT id FROM questions WHERE consumer = 's#main' AND content_hash = 'H' AND status = 'open'")
      .all() as { id: string }[];
    assert.deepEqual(open.map((r) => r.id), ['q3']);
  });
});

// ---- 2026-09-26 cases (Step 7 build delta) ----

test('T-7-1e: files.in_tree CHECK; a history-only row (NULL content_hash, in_tree 0) is accepted with change_weight 0', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    const vals = fileVals('two.ts');
    vals[3] = 2; // in_tree = 2
    rejects(store, insertSql('files', FILE_COLS), vals);

    const histCols = ['path', 'lang', 'zone', 'in_tree', 'content_hash', 'mtime', ...PROV];
    const id = Number(
      store.prepare(insertSql('files', histCols)).run('gone.txt', 'unknown', 'unknown', 0, null, null, 'commit', 'h', 'untrusted_repo', 0, 1, 1)
        .lastInsertRowid
    );
    const row = store.prepare('SELECT in_tree, content_hash, change_weight FROM files WHERE id = ?').get(id) as {
      in_tree: number;
      content_hash: string | null;
      change_weight: number;
    };
    assert.equal(row.in_tree, 0);
    assert.equal(row.content_hash, null);
    assert.equal(row.change_weight, 0, 'change_weight defaults to 0');
  });
});

test('T-7-1f: cochange_pairs has no a_count/b_count and requires last_commit and pair_weight', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    const cols = columns(store, 'cochange_pairs');
    assert.equal(cols.includes('a_count'), false, 'no a_count column');
    assert.equal(cols.includes('b_count'), false, 'no b_count column');
    assert.ok(cols.includes('pair_weight') && cols.includes('last_commit'));
    const a = insertFile(store, 'a.ts');
    const b = insertFile(store, 'b.ts');
    rejects(store, insertSql('cochange_pairs', ['a', 'b', 'pair_count', 'pair_weight', 'last_ts']), [a, b, 1, 1.0, 1]);
    rejects(store, insertSql('cochange_pairs', ['a', 'b', 'pair_count', 'last_ts', 'last_commit']), [a, b, 1, 1, 'h']);
    store.prepare(insertSql('cochange_pairs', PAIR_COLS)).run(a, b, 1, 1.0, 1, 'h');
  });
});

test('T-7-1g: deleting a symbols row cascades its symbol_tokens rows', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    const f = insertFile(store, 'a.ts');
    const sym = Number(
      store.prepare(insertSql('symbols', ['file_id', 'name', 'kind', 'span_start', 'span_end', ...PROV]))
        .run(f, 'user_name', 'function', 0, 5, ...PROV_OK).lastInsertRowid
    );
    store.prepare('INSERT INTO symbol_tokens(token, symbol_id) VALUES(?, ?)').run('user', sym);
    store.prepare('INSERT INTO symbol_tokens(token, symbol_id) VALUES(?, ?)').run('name', sym);
    store.prepare('DELETE FROM symbols WHERE id = ?').run(sym);
    const left = store.prepare('SELECT count(*) AS n FROM symbol_tokens').get() as { n: number };
    assert.equal(left.n, 0);
  });
});

test('T-7-1h: deleting a file mined history references fails with a foreign-key error; index-only references cascade', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    const fkError = /FOREIGN KEY/i;

    // Referenced by cochange_pairs.
    const p1 = insertFile(store, 'p1.ts');
    const p2 = insertFile(store, 'p2.ts');
    store.prepare(insertSql('cochange_pairs', PAIR_COLS)).run(p1, p2, 1, 1.0, 1, 'h');
    assert.throws(() => store.prepare('DELETE FROM files WHERE id = ?').run(p1), fkError);

    // Referenced by landmines.
    const l = insertFile(store, 'l.ts');
    store.prepare(insertSql('landmines', LANDMINE_COLS)).run('LM1', 'fix_chatter', l, 'e', 'commit', 'h', 'untrusted_repo', 0, 1, 1);
    assert.throws(() => store.prepare('DELETE FROM files WHERE id = ?').run(l), fkError);

    // Referenced by labelled_touches.
    const t = insertFile(store, 't.ts');
    store.prepare(insertSql('labelled_touches', ['file_id', 'commit_hash', 'label', 'ts'])).run(t, 'h', 'fix', 1);
    assert.throws(() => store.prepare('DELETE FROM files WHERE id = ?').run(t), fkError);

    // Referenced only by symbols / import_edges / path_tokens: the delete cascades.
    const x = insertFile(store, 'x.ts');
    const y = insertFile(store, 'y.ts');
    store.prepare(insertSql('symbols', ['file_id', 'name', 'kind', 'span_start', 'span_end', ...PROV]))
      .run(x, 's', 'function', 0, 1, ...PROV_OK);
    store.prepare(insertSql('import_edges', ['src_file', 'dst_file', 'kind'])).run(x, y, 'import');
    store.prepare(insertSql('path_tokens', ['token', 'file_id'])).run('x', x);
    store.prepare('DELETE FROM files WHERE id = ?').run(x);
    const count = (table: string, col: string): number =>
      (store.prepare(`SELECT count(*) AS n FROM ${table} WHERE ${col} = ?`).get(x) as { n: number }).n;
    assert.equal(count('symbols', 'file_id'), 0, 'symbols cascaded');
    assert.equal(count('import_edges', 'src_file'), 0, 'import_edges cascaded');
    assert.equal(count('path_tokens', 'file_id'), 0, 'path_tokens cascaded');
  });
});

test('T-7-1i: landmines_miner_key rejects a second fix_chatter row for a file and accepts a second human_stated row', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    const f = insertFile(store, 'a.ts');
    const minerProv = ['commit', 'h', 'untrusted_repo', 0, 1, 1];
    const humanProv = ['human', 'owner', 'human', 0, 1, 1];
    store.prepare(insertSql('landmines', LANDMINE_COLS)).run('F1', 'fix_chatter', f, 'e1', ...minerProv);
    rejects(store, insertSql('landmines', LANDMINE_COLS), ['F2', 'fix_chatter', f, 'e2', ...minerProv]);
    store.prepare(insertSql('landmines', LANDMINE_COLS)).run('H1', 'human_stated', f, 'said once', ...humanProv);
    store.prepare(insertSql('landmines', LANDMINE_COLS)).run('H2', 'human_stated', f, 'said twice', ...humanProv);
  });
});

test('T-7-1j: corrections accepts whisper-only, whisper-less missed with and without genre; rejects both ids, neither with false_fire, whisper id + genre', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    const cols = ['id', 'whisper_id', 'deny_id', 'verdict', 'genre', 'ts'];
    const ins = insertSql('corrections', cols);
    store.prepare(ins).run('A1', 'w1', null, 'false_fire', null, 1); // whisper id, no genre
    store.prepare(ins).run('A2', null, null, 'missed', 'coupling', 1); // neither id, missed, genre
    store.prepare(ins).run('A3', null, null, 'missed', null, 1); // neither id, missed, no genre
    rejects(store, ins, ['R1', 'w2', 'd2', 'confirm', null, 1]); // both ids
    rejects(store, ins, ['R2', null, null, 'false_fire', null, 1]); // neither id, false_fire
    rejects(store, ins, ['R3', 'w3', null, 'false_fire', 'coupling', 1]); // whisper id + genre
  });
});

test('T-7-1k: whisper_audit, corrections, session_log, observed_actions assign seq 1, 2, 3 in insert order', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    const cases: { table: string; cols: string[]; vals: (i: number) => unknown[] }[] = [
      { table: 'whisper_audit', cols: ['id', 'session', 'consumer', 'kind', 'ts', 'text'], vals: (i) => [`W${i}`, 's', 's#main', 'whisper', i, `t${i}`] },
      { table: 'corrections', cols: ['id', 'verdict', 'ts'], vals: (i) => [`C${i}`, 'missed', i] },
      { table: 'session_log', cols: ['id', 'session', 'consumer', 'event_type', 'ts'], vals: (i) => [`S${i}`, 's', 's#main', 'Stop', i] },
      { table: 'observed_actions', cols: ['session', 'consumer', 'tool', 'ts'], vals: (i) => ['s', 's#main', 'Read', i] },
    ];
    for (const { table, cols, vals } of cases) {
      for (let i = 1; i <= 3; i++) store.prepare(insertSql(table, cols)).run(...vals(i));
      const seqs = (store.prepare(`SELECT seq FROM ${table} ORDER BY ts`).all() as { seq: number }[]).map((r) => r.seq);
      assert.deepEqual(seqs, [1, 2, 3], `${table}: seq 1, 2, 3 in insert order`);
    }
  });
});

test("T-7-1l: the fallback's token-prefix range query uses symbol_tokens_token, not a SCAN", () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    const plan = store
      .prepare("EXPLAIN QUERY PLAN SELECT symbol_id FROM symbol_tokens WHERE token >= 'ab' AND token < 'ab' || char(1114111)")
      .all() as { detail: string }[];
    const detail = plan.map((r) => r.detail).join(' | ');
    assert.match(detail, /symbol_tokens_token/, `plan names the index: ${detail}`);
    assert.doesNotMatch(detail, /\bSCAN\b/, `plan is not a scan: ${detail}`);
  });
});

test('T-7-1m: under fts:true, the in-house tokens match by prefix in fts_paths and fts_symbols', () => {
  withStore((store) => {
    applyMigrations(store, { fts: true });
    const f = insertFile(store, 'src/util.ts');
    // Rows written as the indexer writes them: the in-house tokens joined by one space.
    store.prepare('INSERT INTO fts_paths(tokens, file_id) VALUES(?, ?)').run('src util ts', f);
    store.prepare('INSERT INTO fts_symbols(tokens, kind, symbol_id, file_id) VALUES(?, ?, ?, ?)').run('user name', 'function', 1, f);
    store.prepare('INSERT INTO fts_symbols(tokens, kind, symbol_id, file_id) VALUES(?, ?, ?, ?)').run('getusername', 'function', 2, f);

    const paths = store.prepare(`SELECT file_id FROM fts_paths WHERE fts_paths MATCH '"util"*'`).all() as { file_id: number }[];
    assert.deepEqual(paths.map((r) => r.file_id), [f], "'\"util\"*' matches the path row");

    const syms = store.prepare(`SELECT symbol_id FROM fts_symbols WHERE fts_symbols MATCH '"user"*'`).all() as {
      symbol_id: number;
    }[];
    assert.deepEqual(syms.map((r) => r.symbol_id), [1], "'\"user\"*' matches user_name and not getUserName");
  });
});

// ---- Added by the 2026-09-26 independent build review
// (docs/reviews/2026-09-26-steps-1-12-build-review.md). T-7-1's Data: "per
// knowledge table one valid row and one row per CHECK-constrained column
// violating it". `labelled_touches` is new at 2026-09-26 (Step 7's DDL:
// `label TEXT NOT NULL CHECK(label IN ('revert','fix'))`) and T-7-1c has no row
// for it.
test('T-7-1n (review): labelled_touches.label accepts revert and fix and rejects any other label', () => {
  withStore((store) => {
    applyMigrations(store, { fts: false });
    const f = insertFile(store, 'a.ts');
    const cols = ['file_id', 'commit_hash', 'label', 'ts'];
    store.prepare(insertSql('labelled_touches', cols)).run(f, 'h1', 'revert', 1);
    store.prepare(insertSql('labelled_touches', cols)).run(f, 'h1', 'fix', 1);
    rejects(store, insertSql('labelled_touches', cols), [f, 'h2', 'refactor', 1]);
  });
});
