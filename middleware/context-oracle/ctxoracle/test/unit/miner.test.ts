// T-13-1 — Miner hygiene, pair emission, landmine classes (Step 13, AD-13,
// AD-15, FR-K2, FR-A6; gap-list review G6, G7, G19, N1).
//
// Integration: real `git log` over the generated `miner-hygiene` fixture, real
// node:sqlite, no doubles. `mineCochange` runs with a `tuningReader` over a
// seeded global store (G8), so every threshold is its Step 12 seed:
// miner.max_transaction_entities 30, miner.horizon_years 5,
// miner.corpus_floor_commits 30, landmine.fix_chatter_k 3,
// landmine.fix_chatter_window_days 90.
//
// The two synthetic malformed `-z` records, the body-held `0x1e`+hex, and the
// empty-body commit are fed to the pure parser directly (plan Step 13, G6:
// "T-13-1 feeds it malformed records directly") — real git never emits them.
// Their layout is the one Step 13 states and §11.4 executed: per commit
// `\x1e<40 hex>`, `<ts>`, `<subject>`, `<body>`, one empty field, then the
// numstat entries, the first carrying a leading `\n`.
//
// Parser-result fields read here are `commits[].hash` and `commits[].paths`
// (the `ParsedCommit` type Step 13's declared `parseNumstatZ` returns) and
// `malformed.length`; a path is compared through `String()`, which reads a
// string or a UTF-8 Buffer the same way.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore, probeFts5, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { filesDao } from '../../src/stores/dao/files.js';
import { cochangePairsDao } from '../../src/stores/dao/cochange_pairs.js';
import { schemaMetaDao } from '../../src/stores/dao/schema_meta.js';
import { mineCochange, parseNumstatZ } from '../../src/miner/cochange.js';
import { generateFixture, fixtureGit, HYGIENE } from '../fixtures/generate.js';

interface Mined {
  store: Store;
  repo: string;
  head: string;
  headCommitterTs: number;
  hashOf: (subject: string) => string;
}

const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-miner-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));

async function mineHygiene(): Promise<Mined> {
  const repo = path.join(root, 'repo');
  generateFixture('miner-hygiene', repo);
  const store = openStore(path.join(root, 'project.db'));
  applyMigrations(store, { fts: probeFts5(store) });
  const global = openStore(path.join(root, 'global.db'));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  const diag = path.join(root, 'diagnostics');
  const tuning = tuningReader(global, 'miner-hygiene', () => {});
  await mineCochange(store, repo, { tuning, diagnosticsDir: diag });
  const head = fixtureGit(repo, ['rev-parse', 'HEAD']).trim();
  const headCommitterTs = Number(fixtureGit(repo, ['log', '-1', '--format=%ct', 'HEAD']).trim());
  const bySubject = new Map<string, string>();
  for (const line of fixtureGit(repo, ['log', '--format=%H %s']).trim().split('\n')) {
    const sp = line.indexOf(' ');
    bySubject.set(line.slice(sp + 1), line.slice(0, sp));
  }
  const hashOf = (s: string): string => {
    const h = bySubject.get(s);
    if (h === undefined) throw new Error(`fixture has no commit with subject ${JSON.stringify(s)}`);
    return h;
  };
  return { store, repo, head, headCommitterTs, hashOf };
}

// One mine, shared by the T-13-1 cases below (a rejection fails every case).
const mined = mineHygiene();
mined.catch(() => {}); // observed by each case's `await`; not an unhandled rejection

function idOf(store: Store, p: string): number | undefined {
  return filesDao(store).byPath(p)?.id;
}

function pairCount(store: Store, p: string, q: string): number {
  const a = idOf(store, p);
  const b = idOf(store, q);
  if (a === undefined || b === undefined) return 0;
  return cochangePairsDao(store).pair(a, b)?.pair_count ?? 0;
}

function allPaths(store: Store): string[] {
  return filesDao(store).all().map((f) => f.path);
}

test('T-13-1a: the planted cross-directory pair counts exactly its 5 co-changes', async () => {
  const { store } = await mined;
  assert.equal(pairCount(store, HYGIENE.pairA, HYGIENE.partner), 5);
});

test('T-13-1b: no excluded commit (merge, 45-file, beyond-horizon) contributes to a pair count', async () => {
  const { store, hashOf } = await mined;
  const ancient = hashOf('ancient change');
  const bulk = hashOf('bulk sweep');
  const merge = hashOf('merge side');
  const rows = store.prepare('SELECT hash, excluded, exclude_reason FROM commits WHERE hash IN (?, ?)').all(ancient, bulk) as {
    hash: string;
    excluded: number;
    exclude_reason: string | null;
  }[];
  const byHash = new Map(rows.map((r) => [r.hash, r]));
  assert.equal(byHash.get(ancient)?.excluded, 1, 'the commit 6 years before HEAD has a commits row, excluded');
  assert.equal(byHash.get(ancient)?.exclude_reason, 'horizon');
  assert.equal(byHash.get(bulk)?.excluded, 1, 'the 45-file commit has a commits row, excluded');
  assert.equal(byHash.get(bulk)?.exclude_reason, 'size');
  const cited = store
    .prepare('SELECT count(*) AS n FROM cochange_pairs WHERE last_commit IN (?, ?, ?)')
    .get(ancient, bulk, merge) as { n: number };
  assert.equal(cited.n, 0, 'no pair row cites an excluded commit');
  // Files touched only by an excluded commit have no pair at all.
  for (const p of ['ancient.txt', ...HYGIENE.bulkPaths]) {
    const id = idOf(store, p);
    if (id === undefined) continue;
    assert.deepEqual(cochangePairsDao(store).partnersOf(id), [], `${p} (only in an excluded commit) has no pair`);
  }
});

test('T-13-1c: the revert_chain and fix_chatter rows exist and carry evidence', async () => {
  const { store } = await mined;
  const rowFor = (kind: string, p: string): { evidence: string } | undefined =>
    store
      .prepare('SELECT l.evidence FROM landmines l JOIN files f ON f.id = l.file_id WHERE l.kind = ? AND f.path = ?')
      .get(kind, p) as { evidence: string } | undefined;
  for (const [kind, p] of [
    ['revert_chain', HYGIENE.revertFile],
    ['fix_chatter', HYGIENE.fixFile],
  ] as const) {
    const row = rowFor(kind, p);
    assert.ok(row !== undefined, `${kind} row for ${p} is missing`);
    const ev = JSON.parse(row.evidence) as unknown;
    assert.ok(Array.isArray(ev) && ev.length > 0, `${kind} row for ${p} carries no evidence`);
  }
});

test('T-13-1d: the rename contributes both identities, never an unsplit literal', async () => {
  const { store } = await mined;
  assert.ok(pairCount(store, 'old.txt', HYGIENE.partner) >= 1, 'old.txt identity missing from the pair counts');
  assert.ok(pairCount(store, 'new.txt', HYGIENE.partner) >= 1, 'new.txt identity missing from the pair counts');
  for (const p of allPaths(store)) {
    if (p === HYGIENE.arrowPath) continue;
    assert.ok(!(p.includes('old.txt') && p.includes('new.txt')), `rename landed as an unsplit literal: ${JSON.stringify(p)}`);
    assert.ok(!p.includes('=>'), `rename landed as an unsplit literal: ${JSON.stringify(p)}`);
  }
});

test('T-13-1e: every raw special-byte path lands under its exact raw key, paired with the partner, never C-quoted', async () => {
  const { store } = await mined;
  for (const p of HYGIENE.specialPaths) {
    assert.ok(idOf(store, p) !== undefined, `raw path ${JSON.stringify(p)} absent from files`);
    assert.ok(pairCount(store, p, HYGIENE.partner) >= 1, `raw path ${JSON.stringify(p)} lost its co-change with the partner`);
  }
  for (const p of allPaths(store)) {
    assert.ok(!p.startsWith('"'), `C-quoted path: ${JSON.stringify(p)}`);
    assert.ok(!/\\[0-7]{3}/.test(p), `octal escape in path: ${JSON.stringify(p)}`);
    assert.ok(!p.includes('\\\\') && !p.includes('\\t') && !p.includes('\\n'), `residual escape in path: ${JSON.stringify(p)}`);
  }
});

test('T-13-1f: the 0x1e path is recorded whole, never cut by the record framing', async () => {
  const { store } = await mined;
  const whole = HYGIENE.specialPaths.find((p) => p.includes('\x1e'));
  assert.ok(whole !== undefined);
  assert.ok(idOf(store, whole) !== undefined, 'the 0x1e path is not recorded whole');
  for (const phantom of ['we', 'ird.txt']) {
    assert.equal(idOf(store, phantom), undefined, `phantom entry ${JSON.stringify(phantom)} fabricated by the framing`);
  }
});

test('T-13-1g: a real file named `a => b.txt` is the single path `a => b.txt`', async () => {
  const { store } = await mined;
  assert.ok(idOf(store, HYGIENE.arrowPath) !== undefined, '`a => b.txt` is not recorded as one path');
  assert.ok(pairCount(store, HYGIENE.arrowPath, HYGIENE.partner) >= 1);
  assert.equal(idOf(store, 'a'), undefined, 'phantom rename side `a`');
  assert.equal(idOf(store, 'b.txt'), undefined, 'phantom rename side `b.txt`');
});

test('T-13-1h: the binary file (numstat `-\\t-`) is in the touched set', async () => {
  const { store } = await mined;
  assert.ok(pairCount(store, HYGIENE.binaryPath, HYGIENE.partner) >= 1, 'binary path missing from the touched set');
});

test('T-13-1i: the watermark is HEAD, ref_ts is HEAD\'s committer time, and the corpus floor is not met', async () => {
  const { store, head, headCommitterTs } = await mined;
  const meta = schemaMetaDao(store);
  assert.equal(meta.get('last_mined_commit'), head, 'watermark did not advance to HEAD');
  assert.equal(meta.get('ref_ts'), String(headCommitterTs), 'schema_meta.ref_ts is not HEAD\'s committer time');
  assert.equal(meta.get('corpus_floor_met'), '0', 'fewer than 30 included commits: corpus_floor_met must be \'0\'');
});

// ---- The parser, fed synthetic records directly ----------------------------

const H1 = '1'.repeat(40);
const H2 = '2'.repeat(40);
const H3 = 'a'.repeat(40); // appears only inside a body field

function syntheticStream(): Buffer {
  const fields = [
    // Commit 1: empty body -> the empty %b field, the empty separator, then the
    // first entry with its leading `\n`; then a numstat entry missing a field.
    `\x1e${H1}`, '1700000000', 'subject one', '', '', '\n1\t0\tfirst.txt', '5\tshort.txt',
    // Commit 2: a body that is exactly 0x1e + 40 hex (must not start a commit);
    // one good entry; then a truncated rename (marker, empty path, no identity
    // fields) at end of stream.
    `\x1e${H2}`, '1700000100', 'subject two', `\x1e${H3}`, '', '\n1\t1\tsecond.txt', '1\t1\t',
  ];
  return Buffer.from(fields.join('\0') + '\0', 'utf8');
}

test('T-13-1j: both synthetic malformed -z records are reported, never guessed into a path', () => {
  const { commits, malformed } = parseNumstatZ(syntheticStream());
  assert.equal(malformed.length, 2, 'the field-short entry and the truncated rename are each one malformed record');
  const every = commits.flatMap((c) => c.paths.map((p) => String(p)));
  for (const guessed of ['short.txt', '', '5', '1']) {
    assert.ok(!every.includes(guessed), `malformed record guessed into path ${JSON.stringify(guessed)}`);
  }
});

test('T-13-1k: a body holding 0x1e + 40 hex does not start a commit; the empty-body commit keeps its first entry', () => {
  const { commits } = parseNumstatZ(syntheticStream());
  assert.deepEqual(
    commits.map((c) => c.hash),
    [H1, H2],
    'exactly the two framed commits (the body-held header is not a commit)'
  );
  assert.deepEqual(commits[0]?.paths.map((p) => String(p)), ['first.txt'], 'the empty-body commit lost its first entry');
  assert.deepEqual(commits[1]?.paths.map((p) => String(p)), ['second.txt']);
});

// ---- Step 13 build review (2026-09-26): parser cases the mutation pass found
// unasserted, written from plan Step 13's parser text -------------------------

function stream(fields: string[]): Buffer {
  return Buffer.from(fields.join('\0') + '\0', 'utf8');
}

test('T-13-1l: a rename cut after its first identity is malformed and contributes no partial identity', () => {
  // Plan Step 13: "a rename marker missing its two identity fields is a
  // `miner_unparsed_numstat` diagnostic ... and contributes nothing".
  const { commits, malformed } = parseNumstatZ(
    stream([`\x1e${H1}`, '1700000000', 'subject', '', '', '\n1\t1\tkept.txt', '2\t0\t', 'old-only.txt'])
  );
  assert.equal(malformed.length, 1, 'the one-identity rename is one malformed record');
  assert.deepEqual(commits.flatMap((c) => c.paths.map((p) => String(p))), ['kept.txt'], 'a partial rename identity was kept');
});

test('T-13-1m: an entry with an empty added or deleted count lacks the <added>\\t<deleted>\\t shape', () => {
  // Plan Step 13: "an entry lacking the `<added>\t<deleted>\t` shape ... is a
  // `miner_unparsed_numstat` diagnostic ... and contributes nothing".
  const { commits, malformed } = parseNumstatZ(
    stream([`\x1e${H1}`, '1700000000', 'subject', '', '', '\n1\t0\tgood.txt', '\t\tno-counts.txt', '1\t\tno-deleted.txt'])
  );
  assert.equal(malformed.length, 2, 'each count-less entry is one malformed record');
  assert.deepEqual(commits.flatMap((c) => c.paths.map((p) => String(p))), ['good.txt']);
});

test('T-13-1n: a field is a commit header only when it is exactly 0x1e + 40 hex', () => {
  // Plan Step 13: "a field is a commit header only when it is exactly `\x1e` +
  // 40 hex at a position where a header is expected".
  const { commits, malformed } = parseNumstatZ(
    stream([
      `\x1e${H1}`, '1700000000', 'subject one', '', '', '\n1\t0\tone.txt',
      `\x1e${'g'.repeat(40)}`, // 0x1e + 40 non-hex: not a header, a shape-less entry
      '1\t0\ttwo.txt',
      `\x1e${H2}`, '1700000100', 'subject two', '', '', '\n1\t0\tthree.txt',
    ])
  );
  assert.deepEqual(commits.map((c) => c.hash), [H1, H2]);
  assert.deepEqual(commits[0]?.paths.map((p) => String(p)), ['one.txt', 'two.txt'], 'a loose header split the first commit');
  assert.equal(malformed.length, 1, 'the non-hex pseudo-header is one malformed record');
});

// ---- Step 13 build review m3, m5 (T-13-1's added synthetic records) ---------

test('T-13-1q: a record whose timestamp field is `1e3` is not read as a commit (m5)', () => {
  // Plan Step 13: the author timestamp must match /^[0-9]+$/ before it is read
  // as a number; `Number('1e3')` is 1000, the regex rejects it.
  const { commits } = parseNumstatZ(
    stream([
      `\x1e${H1}`, '1e3', 'subject one', '', '', '\n1\t0\tone.txt',
      `\x1e${H2}`, '1700000100', 'subject two', '', '', '\n1\t0\ttwo.txt',
    ])
  );
  assert.ok(!commits.some((c) => c.hash === H1), 'the `1e3`-timestamp record was read as a commit');
  assert.ok(!commits.flatMap((c) => c.paths.map((p) => String(p))).includes('one.txt'), 'the `1e3` record contributed a path');
  assert.deepEqual(commits.map((c) => c.hash), [H2], 'the next valid header starts the next commit');
});

test('T-13-1r: a non-header leading field and its record yield exactly one miner_unparsed_numstat diagnostic (m3)', () => {
  // Plan Step 13: "after a malformed field where a header is expected, the
  // parser stays silent until the next valid header, counting what it skips
  // into the same fault" — one per malformed commit record, never one per field.
  const { commits, malformed } = parseNumstatZ(
    stream([
      'not-a-header', 'subject of the bad record', 'body of the bad record\n', '', '\n1\t0\tbad-one.txt', '2\t1\tbad-two.txt',
      `\x1e${H2}`, '1700000100', 'subject two', '', '', '\n1\t0\ttwo.txt',
    ])
  );
  assert.equal(malformed.length, 1, `the non-header record yielded ${malformed.length} diagnostics, not exactly one`);
  assert.deepEqual(commits.map((c) => c.hash), [H2]);
  assert.deepEqual(commits[0]?.paths.map((p) => String(p)), ['two.txt'], 'a skipped entry leaked into the next commit');
});
