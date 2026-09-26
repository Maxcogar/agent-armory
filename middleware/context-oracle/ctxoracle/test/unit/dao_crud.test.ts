// T-9-1 — every Step 9 DAO creates/reads/updates/deletes against the STRICT
// schema; ids are ULIDs; whisper_audit.append returns its id synchronously; and
// FR-X4 trust laundering is rejected at the DAO entry point. Real node:sqlite via
// the real migrations; no doubles.
//
// Reopened 2026-09-26 (Step 9 build delta; T-9-1 Data gains the "2026-09-26
// surface"). Changes against the Checkpoint-1 version of this file, each cited:
// - `files.deleteMissing` is removed (G2) — its round-trip is replaced by
//   `markAbsentExcept`/`sweepUnreferenced`; `files.upsert` passes `in_tree`.
// - `landmines.upsert` is removed (G5/N5) — replaced by `rebuildMinerKinds`,
//   `deleteMinerKinds`, `createHuman`.
// - `cochange_pairs.bump` takes `(a, b, ts, hash, weight)`; `partnersOf` returns
//   `{partnerId, pairCount, pairWeight, lastTs, lastCommit}` (G3).
// - `corrections.sinceTs` is removed (N11) — replaced by `since(seq)`/`maxSeq()`.
// - `observed_actions.writtenSince(path, ts)` is replaced by
//   `writtenSinceSeq(path, seq)` (M7); `append` and `session_log.append` take no
//   `seq` (N16).
// - `whisper_audit.deliveredSubjects` returns `subject_key` values, not genres.
// - `whisper_stats.upsertFold` is removed — replaced by `replaceForProject`.
// - `test_map` rows use source 'import_edge' and the covered file's path
//   (Step 7's CHECK and AD-12), not the former 'heuristic' / 'src/*'.
// - The former `oa.runs('S') === 1` assertion is not carried: the delta re-signs
//   `runs(session, consumer)` to return `{command_class, segments_json,
//   outcome}` rows, and that shape cannot be stubbed without breaking the
//   unreduced handler's compile (reported to the builder).

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import type { Provenance } from '../../src/security/trust.js';

import { schemaMetaDao } from '../../src/stores/dao/schema_meta.js';
import { globalMetaDao } from '../../src/stores/dao/global_meta.js';
import { filesDao } from '../../src/stores/dao/files.js';
import { symbolsDao } from '../../src/stores/dao/symbols.js';
import { importEdgesDao } from '../../src/stores/dao/import_edges.js';
import { symbolRefsDao } from '../../src/stores/dao/symbol_refs.js';
import { testMapDao } from '../../src/stores/dao/test_map.js';
import { commitsDao } from '../../src/stores/dao/commits.js';
import { cochangePairsDao } from '../../src/stores/dao/cochange_pairs.js';
import { landminesDao } from '../../src/stores/dao/landmines.js';
import { invariantsDao } from '../../src/stores/dao/invariants.js';
import { humanFactsDao } from '../../src/stores/dao/human_facts.js';
import { correctionsDao } from '../../src/stores/dao/corrections.js';
import { questionsDao } from '../../src/stores/dao/questions.js';
import { classifyStateDao } from '../../src/stores/dao/classify_state.js';
import { consumerStateDao } from '../../src/stores/dao/consumer_state.js';
import { sessionLogDao } from '../../src/stores/dao/session_log.js';
import { observedActionsDao } from '../../src/stores/dao/observed_actions.js';
import { regretDao } from '../../src/stores/dao/regret.js';
import { classifiedTurnsDao } from '../../src/stores/dao/classified_turns.js';
import { whisperAuditDao } from '../../src/stores/dao/whisper_audit.js';
import { faultsDao } from '../../src/stores/dao/faults.js';
import { whisperStatsDao } from '../../src/stores/dao/whisper_stats.js';
import { lessonsDao } from '../../src/stores/dao/lessons.js';
import { labelledTouchesDao } from '../../src/stores/dao/labelled_touches.js';
import { statsFoldsDao } from '../../src/stores/dao/stats_folds.js';
import { pathTokensDao } from '../../src/stores/dao/path_tokens.js';
import { symbolTokensDao } from '../../src/stores/dao/symbol_tokens.js';

const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;
// A stand-in valid non-human provenance for CRUD round-trips: repo-derived
// content ⇒ trust='untrusted_repo' (FR-X4). 'mechanical' is NOT a Phase A
// learned-record trust (see the rejection case below).
const repo: Provenance = { prov_kind: 'repo_span', prov_ref: 'src/a.ts:0-5', trust: 'untrusted_repo' };
const mined: Provenance = { prov_kind: 'commit', prov_ref: 'h1', trust: 'untrusted_repo' };
const human: Provenance = { prov_kind: 'human', prov_ref: 'owner', trust: 'human' };
const S = 'S';
const C = 'S#main';

function withStores(fn: (project: Store, global: Store) => void): void {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxoracle-dao-'));
  const project = openStore(path.join(dir, 'store.db'));
  const global = openStore(path.join(dir, 'global.db'));
  try {
    applyMigrations(project, { fts: false });
    applyMigrations(global, { fts: false, scope: 'global' });
    fn(project, global);
  } finally {
    project.close();
    global.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function inTreeFile(s: Store, p: string): number {
  return filesDao(s).upsert({ path: p, lang: 'ts', zone: 'source', contentHash: `h-${p}`, mtime: 1, prov: repo, in_tree: 1 });
}

function fileCounts(s: Store, id: number): { change_count: number; change_weight: number; in_tree: number } {
  return s.prepare('SELECT change_count, change_weight, in_tree FROM files WHERE id = ?').get(id) as {
    change_count: number;
    change_weight: number;
    in_tree: number;
  };
}

// ---- structural DAOs ----

test('T-9-1: structural DAOs round-trip', () => {
  withStores((s) => {
    const files = filesDao(s);
    const id1 = inTreeFile(s, 'src/a.ts');
    const id2 = inTreeFile(s, 'test/a.test.ts');
    assert.equal(files.byId(id1)?.path, 'src/a.ts');
    assert.equal(files.byPath('test/a.test.ts')?.id, id2);
    assert.equal(files.all().length, 2);
    // update via upsert (same path) keeps id, updates content_hash
    const id1b = files.upsert({ path: 'src/a.ts', lang: 'ts', zone: 'source', contentHash: 'h1x', mtime: 3, prov: repo, in_tree: 1 });
    assert.equal(id1b, id1);
    assert.equal(files.byId(id1)?.content_hash, 'h1x');
    assert.equal(fileCounts(s, id1).in_tree, 1, 'upsert writes in_tree');

    const symbols = symbolsDao(s);
    symbols.replaceForFile(id1, [{ name: 'foo', kind: 'function', spanStart: 0, spanEnd: 5 }], repo);
    const foo = symbols.byName('foo');
    assert.equal(foo.length, 1);
    assert.equal(symbols.byId(foo[0]!.id)?.name, 'foo');
    symbols.replaceForFile(id1, [{ name: 'bar', kind: 'function', spanStart: 0, spanEnd: 3 }], repo);
    assert.equal(symbols.byName('foo').length, 0);
    const bar = symbols.byName('bar', 'function');
    assert.equal(bar.length, 1);

    const edges = importEdgesDao(s);
    edges.replaceForFile(id1, [{ dstFile: id2, kind: 'import' }]);
    assert.equal(edges.inDegree(id2), 1);
    assert.deepEqual(edges.importersOf(id2), [id1]);

    const refs = symbolRefsDao(s);
    refs.replaceForFile(id1, [{ symbolId: bar[0]!.id, refCount: 3 }]);
    assert.equal(refs.refCount(bar[0]!.id), 3);

    const tm = testMapDao(s);
    tm.replaceForFile(id2, [{ regionGlob: 'src/a.ts', source: 'import_edge' }], repo);
    assert.deepEqual(tm.coveringTests('src/a.ts'), [id2]);
    assert.deepEqual(tm.coveringTests('other/x.ts'), []);

    const commits = commitsDao(s);
    commits.upsert({ hash: 'abc', ts: 100, entityCount: 2 });
    commits.upsert({ hash: 'def', ts: 200, entityCount: 1, excluded: true, excludeReason: 'merge' });
    assert.equal(commits.exists('abc'), true);
    assert.equal(commits.exists('zzz'), false);
    assert.equal(commits.tsOf('def'), 200);
    assert.equal(commits.countIncluded(), 1);
  });
});

test('T-9-1 (2026-09-26): files.ensureHistoryRow is insert-if-absent with in_tree 0, zone unknown, NULL content_hash', () => {
  withStores((s) => {
    const files = filesDao(s);
    const a = files.ensureHistoryRow('h.txt', false);
    const b = files.ensureHistoryRow('h.txt', false);
    assert.equal(b, a, 'the same id both times');
    const row = s.prepare('SELECT * FROM files WHERE id = ?').get(a) as Record<string, unknown>;
    assert.equal(row.in_tree, 0);
    assert.equal(row.zone, 'unknown');
    assert.equal(row.lang, 'unknown');
    assert.equal(row.content_hash, null);
    assert.equal(row.mtime, null);
    assert.equal(row.prov_kind, 'commit');
    assert.equal(row.trust, 'untrusted_repo');
    assert.equal(files.all().length, 1);

    // It never changes an existing row.
    const idx = inTreeFile(s, 'present.ts');
    assert.equal(files.ensureHistoryRow('present.ts', false), idx);
    assert.equal(fileCounts(s, idx).in_tree, 1, 'an existing in-tree row is unchanged');
  });
});

test('T-9-1 (2026-09-26): files.markAbsentExcept returns the unlisted in-tree id and leaves its row with in_tree 0', () => {
  withStores((s) => {
    const files = filesDao(s);
    const keep = inTreeFile(s, 'keep.ts');
    const gone = inTreeFile(s, 'gone.ts');
    assert.deepEqual(files.markAbsentExcept([keep]), [gone]);
    assert.equal(fileCounts(s, gone).in_tree, 0, 'the row is kept, marked absent');
    assert.equal(fileCounts(s, keep).in_tree, 1);
  });
});

test('T-9-1 (2026-09-26): files.sweepUnreferenced deletes an unreferenced in_tree 0 row and keeps one a pair references', () => {
  withStores((s) => {
    const files = filesDao(s);
    const lone = files.ensureHistoryRow('lone.txt', false);
    const paired = files.ensureHistoryRow('paired.txt', false);
    const partner = inTreeFile(s, 'partner.ts');
    cochangePairsDao(s).bump(paired, partner, 100, 'h1', 1);
    assert.equal(files.sweepUnreferenced(), 1);
    assert.equal(files.byId(lone), undefined, 'the unreferenced history-only row is deleted');
    assert.equal(files.byId(paired)?.path, 'paired.txt', 'the pair-referenced row is kept');
  });
});

test('T-9-1 (2026-09-26): cochange_pairs.bump accumulates pair_count and pair_weight; last_ts/last_commit follow the newest commit', () => {
  withStores((s) => {
    const a = inTreeFile(s, 'a.ts');
    const b = inTreeFile(s, 'b.ts');
    const co = cochangePairsDao(s);
    co.bump(a, b, 100, 'h1', 0.5);
    co.bump(a, b, 50, 'h0', 0.25);
    const p = co.pair(a, b);
    assert.equal(p?.pair_count, 2);
    assert.equal(p?.pair_weight, 0.75);
    assert.equal(p?.last_ts, 100);
    assert.equal(p?.last_commit, 'h1');
    assert.deepEqual(co.partnersOf(a), [{ partnerId: b, pairCount: 2, pairWeight: 0.75, lastTs: 100, lastCommit: 'h1' }]);
    assert.deepEqual(co.partnersOf(b).map((x) => x.partnerId), [a], 'partnersOf reads both a = x and b = x');
    co.deleteAll();
    assert.equal(co.pair(a, b), undefined);
  });
});

test('T-9-1 (2026-09-26): files.addChangeCount accumulates count and weight; resetChangeCounts zeroes both', () => {
  withStores((s) => {
    const files = filesDao(s);
    const id = inTreeFile(s, 'a.ts');
    files.addChangeCount(id, 1, 0.5);
    files.addChangeCount(id, 1, 0.5);
    assert.equal(fileCounts(s, id).change_count, 2);
    assert.equal(fileCounts(s, id).change_weight, 1.0);
    files.resetChangeCounts();
    assert.equal(fileCounts(s, id).change_count, 0);
    assert.equal(fileCounts(s, id).change_weight, 0);
  });
});

test('T-9-1 (2026-09-26): files.setUnresolvedImports and setEntryScore assign their columns', () => {
  withStores((s) => {
    const files = filesDao(s);
    const id = inTreeFile(s, 'a.ts');
    files.setUnresolvedImports(id, 4);
    files.setEntryScore(id, 7);
    const row = s.prepare('SELECT unresolved_imports, entry_score FROM files WHERE id = ?').get(id) as {
      unresolved_imports: number;
      entry_score: number;
    };
    assert.equal(row.unresolved_imports, 4);
    assert.equal(row.entry_score, 7);
    files.setEntryScore(id, 7); // an assignment: the same value again leaves 7, never 14 (N4)
    assert.equal((s.prepare('SELECT entry_score FROM files WHERE id = ?').get(id) as { entry_score: number }).entry_score, 7);
  });
});

test('T-9-1 (2026-09-26): symbol_tokens.replaceForFile twice leaves only the second token set; path_tokens.replaceForFile likewise', () => {
  withStores((s) => {
    const f = inTreeFile(s, 'src/util.ts');
    symbolsDao(s).replaceForFile(f, [{ name: 'user_name', kind: 'function', spanStart: 0, spanEnd: 5 }], repo);
    const sym = symbolsDao(s).byName('user_name')[0]!.id;
    const st = symbolTokensDao(s);
    st.replaceForFile(f, [{ symbolId: sym, tokens: ['user', 'name'] }]);
    st.replaceForFile(f, [{ symbolId: sym, tokens: ['username'] }]);
    const tokens = (s.prepare('SELECT token FROM symbol_tokens WHERE symbol_id = ? ORDER BY token').all(sym) as {
      token: string;
    }[]).map((r) => r.token);
    assert.deepEqual(tokens, ['username']);

    const pt = pathTokensDao(s);
    pt.replaceForFile(f, ['src', 'util', 'ts']);
    pt.replaceForFile(f, ['util']);
    const ptoks = (s.prepare('SELECT token FROM path_tokens WHERE file_id = ? ORDER BY token').all(f) as {
      token: string;
    }[]).map((r) => r.token);
    assert.deepEqual(ptoks, ['util']);
  });
});

test('T-9-1 (2026-09-26): labelled_touches add is idempotent; touchesSince groups distinct hashes per file; deleteAll empties', () => {
  withStores((s) => {
    const f = inTreeFile(s, 'a.ts');
    const lt = labelledTouchesDao(s);
    lt.add(f, 'h1', 'fix', 100);
    lt.add(f, 'h1', 'fix', 100); // ON CONFLICT DO NOTHING
    lt.add(f, 'h2', 'fix', 200);
    lt.add(f, 'h3', 'revert', 300);
    lt.add(f, 'h0', 'fix', 10); // before sinceTs
    const since = lt.touchesSince('fix', 100);
    assert.equal(since.length, 1);
    assert.equal(since[0]!.fileId, f);
    assert.deepEqual([...since[0]!.hashes].sort(), ['h1', 'h2']);
    assert.equal(since[0]!.count, 2);
    lt.deleteAll();
    assert.deepEqual(lt.touchesSince('fix', 0), []);
  });
});

test('T-9-1 (2026-09-26): commits.deleteAll empties the commit index', () => {
  withStores((s) => {
    const commits = commitsDao(s);
    commits.upsert({ hash: 'abc', ts: 100, entityCount: 2 });
    commits.deleteAll();
    assert.equal(commits.exists('abc'), false);
  });
});

// ---- knowledge DAOs ----

test('T-9-1: knowledge DAOs round-trip; ids are ULIDs; FR-X4 laundering rejected', () => {
  withStores((s, g) => {
    const files = filesDao(s);
    const fid = inTreeFile(s, 'src/a.ts');

    const inv = invariantsDao(s);
    const invId = inv.create({ description: 'x holds', prov: human }, [{ fileId: fid, span: '1-3' }]);
    assert.match(invId, ULID);
    assert.equal(inv.forFile(fid).length, 1);

    const hf = humanFactsDao(s);
    const hfId = hf.create({ statement: 'owns it', targetKind: 'file', targetRef: 'src/a.ts', statedAt: 1, prov: human });
    assert.match(hfId, ULID);
    assert.equal(hf.forTarget('file', 'src/a.ts').length, 1);

    const lessons = lessonsDao(g);
    const lId = lessons.create({ statement: 'always X', prov: repo });
    assert.match(lId, ULID);
    assert.equal(lessons.all().length, 1);

    // FR-X4: a human input cannot be written as untrusted, and non-human
    // content cannot be written as 'human' NOR as 'mechanical'.
    assert.throws(() =>
      hf.create({ statement: 's', targetKind: 'file', targetRef: 'a', statedAt: 1, prov: { prov_kind: 'human', prov_ref: 'o', trust: 'untrusted_repo' } })
    );
    assert.throws(() =>
      hf.create({ statement: 's', targetKind: 'file', targetRef: 'a', statedAt: 1, prov: { prov_kind: 'repo_span', prov_ref: 'a.ts', trust: 'human' } })
    );
    assert.throws(() =>
      files.upsert({ path: 'x.ts', lang: 'ts', zone: 'source', contentHash: 'hx', mtime: 1, prov: { prov_kind: 'repo_span', prov_ref: 'x.ts:0-1', trust: 'mechanical' }, in_tree: 1 })
    );
  });
});

test('T-9-1 (2026-09-26): landmines.rebuildMinerKinds twice leaves one row per (kind, file_id) and never removes human_stated; forFile lists human rows first', () => {
  withStores((s) => {
    const f = inTreeFile(s, 'src/a.ts');
    const lm = landminesDao(s);
    const hId = lm.createHuman({ fileId: f, evidence: 'do not touch', support: null, prov: human });
    assert.match(hId, ULID);
    const rows = [
      { kind: 'revert_chain' as const, fileId: f, evidence: 'e1', support: 2, prov: mined },
      { kind: 'fix_chatter' as const, fileId: f, evidence: 'e2', support: 4, prov: mined },
    ];
    lm.rebuildMinerKinds(rows);
    lm.rebuildMinerKinds(rows);
    const all = lm.forFile(f);
    assert.equal(all.length, 3);
    assert.equal(all[0]!.kind, 'human_stated', 'human rows first');
    assert.deepEqual(all.slice(1).map((r) => r.kind).sort(), ['fix_chatter', 'revert_chain']);
    for (const r of all) assert.match(r.id, ULID);

    lm.deleteMinerKinds();
    assert.deepEqual(lm.forFile(f).map((r) => r.kind), ['human_stated'], 'deleteMinerKinds keeps human_stated');

    // FR-X4 at the human writer: repo-derived content cannot be written as human.
    assert.throws(() => lm.createHuman({ fileId: f, evidence: 'x', prov: { prov_kind: 'repo_span', prov_ref: 'a', trust: 'human' } }));
  });
});

test('T-9-1 (2026-09-26): corrections.since(0) returns rows in seq order; since(maxSeq()) returns none; a whisper-less missed row carries genre', () => {
  withStores((s) => {
    const corr = correctionsDao(s);
    const c1 = corr.create({ whisperId: 'w1', verdict: 'false_fire', ts: 30 });
    const c2 = corr.create({ verdict: 'missed', genre: 'coupling', ts: 10 });
    assert.match(c1, ULID);
    assert.match(c2, ULID);
    assert.deepEqual(corr.since(0).map((r) => r.id), [c1, c2], 'seq order, not ts order');
    assert.deepEqual(corr.since(corr.maxSeq()), []);
    assert.equal(corr.forWhisper('w1').length, 1);
    assert.equal(corr.forDeny('w1').length, 0);
    const g = s.prepare('SELECT genre FROM corrections WHERE id = ?').get(c2) as { genre: string | null };
    assert.equal(g.genre, 'coupling');
  });
});

// ---- session / diagnostic DAOs ----

test('T-9-1: session/diagnostic DAOs round-trip; whisper_audit.append is synchronous', () => {
  withStores((s, g) => {
    const meta = schemaMetaDao(s);
    meta.set('schema_version', '1');
    assert.equal(meta.get('schema_version'), '1');
    assert.equal(meta.get('nope'), undefined);

    const gmeta = globalMetaDao(g);
    gmeta.set('k', 'v');
    assert.equal(gmeta.get('k'), 'v');

    const cs = classifyStateDao(s);
    cs.set(C, 42, 'uuid-a');
    assert.equal(cs.get(C)?.bookmark_offset, 42);
    cs.set(C, 43, 'uuid-b'); // update
    assert.equal(cs.get(C)?.bookmark_uuid, 'uuid-b');

    const cons = consumerStateDao(s);
    cons.add(C, 'delivered', 'subj1');
    assert.equal(cons.has(C, 'delivered', 'subj1'), true);
    assert.equal(cons.has(C, 'delivered', 'subj2'), false);
    cons.clear(C, 'delivered');
    assert.equal(cons.has(C, 'delivered', 'subj1'), false);

    const regret = regretDao(s);
    const rId = regret.append({ session: S, factKind: 'landmine', factRef: 'x', churnKind: 'reverted', candidateState: 'held_below_bar', ts: 1 });
    assert.match(rId, ULID);
    assert.equal(regret.forSession(S).length, 1);
    assert.equal(regret.countsByState().held_below_bar, 1);
    assert.equal(regret.countsByState().held_dedup, 0);

    const wa = whisperAuditDao(s);
    const waId = wa.append({ session: S, consumer: C, kind: 'whisper', genre: 'coupling', ts: 100, text: 't', subject_key: 'coupling:1-2' });
    assert.equal(typeof waId, 'string'); // synchronous, not a Promise
    assert.match(waId, ULID);
    wa.append({ session: S, consumer: C, kind: 'deny', ts: 150, text: 'no' });
    assert.equal(wa.forSession(S).length, 2);
    assert.equal(wa.denies(C, 0).length, 1);
    assert.deepEqual(wa.lastKinds(C, 2), ['deny', 'whisper']);

    const faults = faultsDao(s);
    const fId = faults.append({ code: 'store_busy', detail_json: '{}', session: S, ts: 10 });
    assert.match(fId, ULID);
    assert.equal(faults.sinceTs(5).length, 1);
    assert.equal(faults.countByCode().store_busy, 1);

    const ct = classifiedTurnsDao(s);
    assert.equal(ct.record(C, 'u1', 10, true, null), 'new');
    assert.equal(ct.record(C, 'u1', 10, false, 'deferral_only'), 'updated');
    assert.equal(ct.between(C, 0, 100).length, 1);
    const q = questionsDao(s);
    const qId = q.insertOpen({ consumer: C, questionText: 'why?', contentHash: 'H' });
    assert.match(qId, ULID);
    const openedAt = q.openFor(C)[0]!.opened_at;
    ct.record(C, 'u2', openedAt + 1, false, null);
    assert.deepEqual(ct.sinceQuestionOpened(C).map((r) => r.uuid), ['u2']);

    assert.equal(q.openFor(C).length, 1);
    q.backfill(qId, 'asked-uuid', 7);
    assert.equal(q.openFor(C)[0]!.asked_uuid, 'asked-uuid');
    q.closeAll(C, 'ans-uuid', 'generic_text_all_prior');
    assert.equal(q.openFor(C).length, 0);
    const qId2 = q.insertOpen({ consumer: C, questionText: 'another?', contentHash: 'H2' });
    q.setStatus(qId2, 'answered', 'generic_text_all_prior');
    assert.equal(q.openFor(C).length, 0);
    q.insertOpen({ consumer: C, questionText: 'third?', contentHash: 'H3' });
    q.expireOpen(C);
    assert.equal(q.openFor(C).length, 0);
  });
});

test('T-9-1 (2026-09-26): schema_meta/global_meta delete; global_meta.keysWithPrefix lists the bindings', () => {
  withStores((s, g) => {
    const meta = schemaMetaDao(s);
    meta.set('ref_ts', '1');
    meta.delete('ref_ts');
    assert.equal(meta.get('ref_ts'), undefined);

    const gm = globalMetaDao(g);
    gm.set('repo_path:/a', 'k1');
    gm.set('repo_path:/b', 'k2');
    gm.set('schema_version', '1');
    assert.deepEqual([...gm.keysWithPrefix('repo_path:')].sort(), ['repo_path:/a', 'repo_path:/b']);
    gm.delete('repo_path:/a');
    assert.equal(gm.get('repo_path:/a'), undefined);
    assert.deepEqual(gm.keysWithPrefix('repo_path:'), ['repo_path:/b']);
  });
});

test('T-9-1 (2026-09-26): consumer_state.hasAny is true iff any key is present', () => {
  withStores((s) => {
    const cons = consumerStateDao(s);
    cons.add(C, 'read', 'k2');
    assert.equal(cons.hasAny(C, 'read', ['k1', 'k2']), true);
    assert.equal(cons.hasAny(C, 'read', ['k1', 'k3']), false);
    assert.equal(cons.hasAny(C, 'delivered', ['k2']), false);
  });
});

test('T-9-1 (2026-09-26): session_log.append takes no seq; ids are ULIDs; latestSession names the largest-seq session; hasEnded only after SessionEnd', () => {
  withStores((s) => {
    const sl = sessionLogDao(s);
    sl.append({ session: 'A', consumer: 'A#main', event_type: 'liveness', ts: 500 });
    sl.append({ session: 'B', consumer: 'B#main', event_type: 'PreToolUse', ts: 100 });
    sl.append({ session: 'B', consumer: 'B#main', event_type: 'Stop', ts: 150 });
    const bRows = sl.forSession('B');
    assert.equal(bRows.length, 2);
    for (const r of bRows) assert.match(r.id, ULID);
    const bSeqs = (s.prepare("SELECT seq FROM session_log WHERE session = 'B' ORDER BY seq").all() as { seq: number }[]).map((r) => r.seq);
    assert.deepEqual(bSeqs, [2, 3], 'the engine assigns seq in insert order');
    assert.equal(sl.lastEventTs('B'), 150);

    // A's liveness row is the newest by ts; B holds the largest seq.
    assert.deepEqual(sl.latestSession(), { session: 'B', startedTs: 100, lastTs: 150 });

    assert.equal(sl.hasEnded('B'), false);
    sl.append({ session: 'B', consumer: 'B#main', event_type: 'SessionEnd', ts: 160 });
    assert.equal(sl.hasEnded('B'), true);
    assert.equal(sl.hasEnded('A'), false);
  });
});

test('T-9-1 (2026-09-26): observed_actions — append takes no seq; writtenSinceSeq, maxSeq, okEditedPaths, hashesFor', () => {
  withStores((s) => {
    const oa = observedActionsDao(s);
    oa.append({ session: S, consumer: C, tool: 'Edit', path: 'a.ts', content_hash: 'e1', outcome: 'ok', ts: 100 });
    oa.append({ session: S, consumer: C, tool: 'Edit', path: 'b.ts', content_hash: 'f1', outcome: 'failed', ts: 105 });
    oa.append({ session: S, consumer: C, tool: 'Read', path: 'r.ts', outcome: 'ok', ts: 110 });
    oa.append({ session: S, consumer: C, tool: 'Bash', path: 'c.ts', command_class: 2, outcome: 'ok', segments_json: '[2]', ts: 120 });
    oa.append({ session: S, consumer: C, tool: 'Write', path: 'a.ts', content_hash: 'e2', outcome: 'ok', ts: 130 });

    assert.equal(oa.maxSeq(), 5, 'the engine assigned seq 1..5');
    assert.equal(oa.okEdits(S), 2);
    assert.equal(oa.okReads(S), 1);
    assert.equal(oa.firstHash(S, 'a.ts'), 'e1');
    assert.deepEqual(oa.hashesFor(S, 'a.ts'), ['e1', 'e2'], 'post-write hashes of ok edits, in order');
    assert.deepEqual(oa.okEditedPaths(S, C), ['a.ts'], 'excludes the failed Edit and the Bash row');

    assert.equal(oa.writtenSinceSeq('a.ts', 0), true, 'an ok Edit with seq > 0');
    assert.equal(oa.writtenSinceSeq('b.ts', 0), false, 'a failed Edit is not a write');
    assert.equal(oa.writtenSinceSeq('a.ts', oa.maxSeq()), false, 'nothing after maxSeq');
  });
});

test('T-9-1 (2026-09-26): whisper_audit — deliveredSubjects returns subject_key values; since/maxSeq; subjectKeyForText', () => {
  withStores((s) => {
    const wa = whisperAuditDao(s);
    const w1 = wa.append({ session: S, consumer: C, kind: 'whisper', genre: 'coupling', ts: 1, text: 'T', subject_key: 'sk-old' });
    const w2 = wa.append({ session: S, consumer: C, kind: 'whisper', genre: 'coupling', ts: 2, text: 'T', subject_key: 'sk-new' });
    wa.append({ session: S, consumer: C, kind: 'deny', ts: 3, text: 'T' });
    assert.deepEqual([...wa.deliveredSubjects(S)].sort(), ['sk-new', 'sk-old']);
    assert.equal(wa.subjectKeyForText('T'), 'sk-new', 'the newest matching whisper row');
    assert.equal(wa.subjectKeyForText('unmatched'), null);
    assert.deepEqual(wa.since(0).map((r) => r.id).slice(0, 2), [w1, w2]);
    assert.equal(wa.since(0).length, 3);
    assert.deepEqual(wa.since(wa.maxSeq()), []);
  });
});

test('T-9-1 (2026-09-26): whisper_stats.replaceForProject twice leaves exactly the rows for that project and others untouched', () => {
  withStores((_s, g) => {
    const ws = whisperStatsDao(g);
    ws.replaceForProject('other', [{ genre: 'warning', sent: 9, correctedFalse: 1, correctedMissed: 1 }], 1);
    const rows = [
      { genre: 'coupling', sent: 4, correctedFalse: 1, correctedMissed: 0 },
      { genre: 'reuse', sent: 2, correctedFalse: 0, correctedMissed: 1 },
    ];
    ws.replaceForProject('k', rows, 2);
    ws.replaceForProject('k', rows, 3);
    const read = (key: string) =>
      g
        .prepare('SELECT genre, sent, corrected_false, corrected_missed FROM whisper_stats WHERE project_key = ? ORDER BY genre')
        .all(key) as { genre: string; sent: number; corrected_false: number; corrected_missed: number }[];
    assert.deepEqual(read('k').map((r) => ({ ...r })), [
      { genre: 'coupling', sent: 4, corrected_false: 1, corrected_missed: 0 },
      { genre: 'reuse', sent: 2, corrected_false: 0, corrected_missed: 1 },
    ]);
    assert.deepEqual(read('other').map((r) => ({ ...r })), [{ genre: 'warning', sent: 9, corrected_false: 1, corrected_missed: 1 }]);
    assert.equal(ws.forProject('k').length, 2);
  });
});

test('T-9-1 (2026-09-26): stats_folds append / totals (SUM per genre) / all', () => {
  withStores((s) => {
    const sf = statsFoldsDao(s);
    const fold = (genre: string, sent: number, f: number, m: number) => ({
      genre, sent, correctedFalse: f, correctedMissed: m,
      auditFrom: 0, auditTo: 5, correctionsFrom: 0, correctionsTo: 2, ts: 1,
    });
    sf.append([fold('coupling', 3, 1, 0), fold('reuse', 1, 0, 0)]);
    sf.append([fold('coupling', 2, 0, 1)]);
    const totals = [...sf.totals()].sort((a, b) => a.genre.localeCompare(b.genre));
    assert.deepEqual(totals.map((t) => ({ ...t })), [
      { genre: 'coupling', sent: 5, correctedFalse: 1, correctedMissed: 1 },
      { genre: 'reuse', sent: 1, correctedFalse: 0, correctedMissed: 0 },
    ]);
    assert.equal(sf.all().length, 3);
  });
});

test('T-9-1 (2026-09-26): an outer store.transaction around two DAO writes that then throws leaves neither row (DAOs compose)', () => {
  withStores((s) => {
    const f = inTreeFile(s, 'src/a.ts');
    assert.throws(
      () =>
        s.transaction(() => {
          symbolsDao(s).replaceForFile(f, [{ name: 'foo', kind: 'function', spanStart: 0, spanEnd: 1 }], repo);
          invariantsDao(s).create({ description: 'x holds', prov: human }, [{ fileId: f, span: '1-3' }]);
          throw new Error('unit of work fails');
        }),
      /unit of work fails/
    );
    assert.equal(symbolsDao(s).byName('foo').length, 0, 'no symbol row');
    assert.equal(invariantsDao(s).forFile(f).length, 0, 'no invariant row');
  });
});
