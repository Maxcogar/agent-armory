// T-9-1 — every Step 9 DAO creates/reads/updates/deletes against the STRICT
// schema; ids are ULIDs; whisper_audit.append returns its id synchronously; and
// FR-X4 trust laundering is rejected at the DAO entry point. Real node:sqlite via
// the real migrations; no doubles.

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

const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const mech: Provenance = { prov_kind: 'mechanical', prov_ref: 'idx', trust: 'mechanical' };
const human: Provenance = { prov_kind: 'human', prov_ref: 'owner', trust: 'human' };

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

test('T-9-1: structural DAOs round-trip', () => {
  withStores((s) => {
    const files = filesDao(s);
    const id1 = files.upsert({ path: 'src/a.ts', lang: 'ts', zone: 'source', contentHash: 'h1', mtime: 1, prov: mech });
    const id2 = files.upsert({ path: 'test/a.test.ts', lang: 'ts', zone: 'source', contentHash: 'h2', mtime: 2, prov: mech });
    assert.equal(files.byId(id1)?.path, 'src/a.ts');
    assert.equal(files.byPath('test/a.test.ts')?.id, id2);
    assert.equal(files.all().length, 2);
    // update via upsert (same path) keeps id, updates content_hash
    const id1b = files.upsert({ path: 'src/a.ts', lang: 'ts', zone: 'source', contentHash: 'h1x', mtime: 3, prov: mech });
    assert.equal(id1b, id1);
    assert.equal(files.byId(id1)?.content_hash, 'h1x');

    const symbols = symbolsDao(s);
    symbols.replaceForFile(id1, [{ name: 'foo', kind: 'function', spanStart: 0, spanEnd: 5 }], mech);
    const foo = symbols.byName('foo');
    assert.equal(foo.length, 1);
    assert.equal(symbols.byId(foo[0]!.id)?.name, 'foo');
    // replace removes the old rows
    symbols.replaceForFile(id1, [{ name: 'bar', kind: 'function', spanStart: 0, spanEnd: 3 }], mech);
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
    tm.replaceForFile(id2, [{ regionGlob: 'src/*', source: 'heuristic' }], mech);
    assert.deepEqual(tm.coveringTests('src/a.ts'), [id2]);
    assert.deepEqual(tm.coveringTests('other/x.ts'), []);

    const commits = commitsDao(s);
    commits.upsert({ hash: 'abc', ts: 100, entityCount: 2 });
    commits.upsert({ hash: 'def', ts: 200, entityCount: 1, excluded: true, excludeReason: 'merge' });
    assert.equal(commits.exists('abc'), true);
    assert.equal(commits.exists('zzz'), false);
    assert.equal(commits.tsOf('def'), 200);
    assert.equal(commits.countIncluded(), 1);

    const co = cochangePairsDao(s);
    co.bump(id1, id2, 100);
    co.bump(id2, id1, 200); // normalized to the same pair
    assert.equal(co.pair(id1, id2)?.pair_count, 2);
    assert.equal(co.pair(id1, id2)?.last_ts, 200);
    assert.deepEqual(co.partnersOf(id1).map((p) => p.partner), [id2]);

    // files.deleteMissing removes vanished files (and cascades).
    files.upsert({ path: 'gone.ts', lang: 'ts', zone: 'source', contentHash: 'g', mtime: 9, prov: mech });
    files.deleteMissing(['src/a.ts', 'test/a.test.ts']);
    assert.equal(files.byPath('gone.ts'), undefined);
    assert.equal(files.byPath('src/a.ts')?.id, id1);
  });
});

test('T-9-1: knowledge DAOs round-trip; ids are ULIDs; FR-X4 laundering rejected', () => {
  withStores((s, g) => {
    const files = filesDao(s);
    const fid = files.upsert({ path: 'src/a.ts', lang: 'ts', zone: 'source', contentHash: 'h', mtime: 1, prov: mech });

    const landmines = landminesDao(s);
    const lmId = landmines.upsert({ kind: 'revert_chain', fileId: fid, evidence: 'e', support: 2, prov: mech });
    assert.match(lmId, ULID);
    assert.equal(landmines.forFile(fid).length, 1);
    // dedup: same (kind, file, evidence) updates support, no new row
    const lmId2 = landmines.upsert({ kind: 'revert_chain', fileId: fid, evidence: 'e', support: 5, prov: mech });
    assert.equal(lmId2, lmId);
    assert.equal(landmines.forFile(fid).length, 1);
    assert.equal(landmines.forFile(fid)[0]!.support, 5);

    const inv = invariantsDao(s);
    const invId = inv.create({ description: 'x holds', prov: human }, [{ fileId: fid, span: '1-3' }]);
    assert.match(invId, ULID);
    assert.equal(inv.forFile(fid).length, 1);

    const hf = humanFactsDao(s);
    const hfId = hf.create({ statement: 'owns it', targetKind: 'file', targetRef: 'src/a.ts', statedAt: 1, prov: human });
    assert.match(hfId, ULID);
    assert.equal(hf.forTarget('file', 'src/a.ts').length, 1);

    const corr = correctionsDao(s);
    const cId = corr.create({ whisperId: 'w1', verdict: 'false_fire', ts: 10 });
    assert.match(cId, ULID);
    assert.equal(corr.forWhisper('w1').length, 1);
    assert.equal(corr.forDeny('w1').length, 0);
    assert.equal(corr.sinceTs(5).length, 1);
    assert.equal(corr.sinceTs(20).length, 0);

    const lessons = lessonsDao(g);
    const lId = lessons.create({ statement: 'always X', prov: mech });
    assert.match(lId, ULID);
    assert.equal(lessons.all().length, 1);

    // FR-X4: a human input cannot be written as untrusted, and repo content
    // cannot be written as human.
    assert.throws(() =>
      hf.create({ statement: 's', targetKind: 'file', targetRef: 'a', statedAt: 1, prov: { prov_kind: 'human', prov_ref: 'o', trust: 'untrusted_repo' } })
    );
    assert.throws(() =>
      hf.create({ statement: 's', targetKind: 'file', targetRef: 'a', statedAt: 1, prov: { prov_kind: 'repo_span', prov_ref: 'a.ts', trust: 'human' } })
    );
  });
});

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
    cs.set('main', 42, 'uuid-a');
    assert.equal(cs.get('main')?.bookmark_offset, 42);
    cs.set('main', 43, 'uuid-b'); // update
    assert.equal(cs.get('main')?.bookmark_uuid, 'uuid-b');

    const cons = consumerStateDao(s);
    cons.add('main', 'delivered', 'subj1');
    assert.equal(cons.has('main', 'delivered', 'subj1'), true);
    assert.equal(cons.has('main', 'delivered', 'subj2'), false);
    cons.clear('main', 'delivered');
    assert.equal(cons.has('main', 'delivered', 'subj1'), false);

    const sl = sessionLogDao(s);
    const slId = sl.append({ session: 'S', consumer: 'main', seq: 0, event_type: 'PreToolUse', ts: 100 });
    assert.match(slId, ULID);
    sl.append({ session: 'S', consumer: 'main', seq: 1, event_type: 'Stop', ts: 200 });
    assert.equal(sl.forSession('S').length, 2);
    assert.equal(sl.lastEventTs('S'), 200);
    assert.deepEqual(sl.livenessRows(true).map((r) => r.session), ['S']);
    sl.append({ session: 'S', consumer: 'main', seq: 2, event_type: 'SessionEnd', ts: 300 });
    assert.deepEqual(sl.livenessRows(true), []); // last event is SessionEnd -> not open

    const oa = observedActionsDao(s);
    oa.append({ session: 'S', consumer: 'main', seq: 0, tool: 'Edit', path: 'a.ts', content_hash: 'e1', outcome: 'ok', ts: 100 });
    oa.append({ session: 'S', consumer: 'main', seq: 1, tool: 'Read', outcome: 'ok', ts: 110 });
    oa.append({ session: 'S', consumer: 'main', seq: 2, tool: 'Bash', command_class: 2, outcome: 'ok', ts: 120 });
    assert.equal(oa.okEdits('S'), 1);
    assert.equal(oa.okReads('S'), 1);
    assert.equal(oa.runs('S'), 1);
    assert.deepEqual(oa.pathWrites('S', -1), ['a.ts']);
    assert.equal(oa.firstHash('S', 'a.ts'), 'e1');
    assert.equal(oa.writtenSince('a.ts', 50), true);
    assert.equal(oa.writtenSince('a.ts', 200), false);

    const regret = regretDao(s);
    const rId = regret.append({ session: 'S', factKind: 'landmine', factRef: 'x', churnKind: 'reverted', candidateState: 'held_below_bar', ts: 1 });
    assert.match(rId, ULID);
    assert.equal(regret.forSession('S').length, 1);
    assert.equal(regret.countsByState().held_below_bar, 1);
    assert.equal(regret.countsByState().held_dedup, 0);

    const wa = whisperAuditDao(s);
    const waId = wa.append({ session: 'S', consumer: 'main', kind: 'whisper', genre: 'coupling', ts: 100, text: 't' });
    assert.equal(typeof waId, 'string'); // synchronous, not a Promise
    assert.match(waId, ULID);
    wa.append({ session: 'S', consumer: 'main', kind: 'deny', ts: 150, text: 'no' });
    assert.equal(wa.forSession('S').length, 2);
    assert.equal(wa.denies('main', 0).length, 1);
    assert.deepEqual(wa.lastKinds('main', 2), ['deny', 'whisper']);
    assert.deepEqual(wa.deliveredSubjects('S'), ['coupling']);

    const faults = faultsDao(s);
    const fId = faults.append({ code: 'store_busy', detail_json: '{}', session: 'S', ts: 10 });
    assert.match(fId, ULID);
    assert.equal(faults.sinceTs(5).length, 1);
    assert.equal(faults.countByCode().store_busy, 1);

    const ct = classifiedTurnsDao(s);
    assert.equal(ct.record('main', 'u1', 10, true, null), 'new');
    assert.equal(ct.record('main', 'u1', 10, false, 'deferral_only'), 'updated');
    assert.equal(ct.between('main', 0, 100).length, 1);
    // sinceQuestionOpened: only turns at/after the newest open question.
    const q = questionsDao(s);
    const qId = q.insertOpen({ consumer: 'main', questionText: 'why?', contentHash: 'H' });
    assert.match(qId, ULID);
    const openedAt = q.openFor('main')[0]!.opened_at;
    ct.record('main', 'u2', openedAt + 1, false, null);
    assert.deepEqual(ct.sinceQuestionOpened('main').map((r) => r.uuid), ['u2']);

    // questions lifecycle
    assert.equal(q.openFor('main').length, 1);
    q.backfill(qId, 'asked-uuid', 7);
    assert.equal(q.openFor('main')[0]!.asked_uuid, 'asked-uuid');
    q.closeAll('main', 'ans-uuid', 'generic_text_all_prior');
    assert.equal(q.openFor('main').length, 0);
    const qId2 = q.insertOpen({ consumer: 'main', questionText: 'another?', contentHash: 'H2' });
    q.setStatus(qId2, 'answered', 'generic_text_all_prior');
    assert.equal(q.openFor('main').length, 0);
    q.insertOpen({ consumer: 'main', questionText: 'third?', contentHash: 'H3' });
    q.expireOpen('main');
    assert.equal(q.openFor('main').length, 0);

    const ws = whisperStatsDao(g);
    ws.upsertFold([{ genre: 'coupling', projectKey: 'k', sent: 3, correctedFalse: 1, correctedMissed: 0, windowStart: 0, windowEnd: 10 }]);
    ws.upsertFold([{ genre: 'coupling', projectKey: 'k', sent: 4, correctedFalse: 1, correctedMissed: 1, windowStart: 0, windowEnd: 20 }]); // update
    const row = g.prepare("SELECT sent, window_end FROM whisper_stats WHERE genre='coupling' AND project_key='k' AND window_start=0").get() as { sent: number; window_end: number };
    assert.equal(row.sent, 4);
    assert.equal(row.window_end, 20);
  });
});
