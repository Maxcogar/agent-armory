// rebuild.mjs — prototype of AD-4's rebuild of a legacy store, table by table.
// Round-9 revision of 2026-09-29-rebuild-mapping-evidence-r8/rebuild.mjs, itself a
// revision of the round-7, round-6 and 2026-09-28 files (all kept unedited; the layout
// SQL is read from the 2026-09-28 directory). The changes, each named by its round-6,
// round-7, round-8 or round-9 finding, are listed in this directory's README.md.
//
//   node rebuild.mjs --home <CTXORACLE_HOME> --repo <repository root> --head <HEAD build dir>
//                    [--origin local|import] [--session <session_id>]
//        the rebuild entry point: AD-4's rebuild, then the binding decision of the
//        child a binding miss spawns (R8-1). --origin import marks the records of the
//        rebuild import runs on a legacy export (R8-5).
//   node rebuild.mjs --print-rules      (the mapping table, generated from RULES below
//                                        and the committed layout SQL)
//
// It reads a legacy store (global/global.db, projects/<key>/store.db) read-only, in
// one read transaction, and writes a new store (global/global-store.db,
// projects/<key>/project.db) in the layout of new-layout/*.sql at a temporary name,
// then renames it into place. The legacy files are never written, renamed or
// deleted. The HEAD build supplies what the new build would: the tuning seeds, the
// tuning reader and validator (AD-14), and AD-3's key rule (resolveRepoKey).
//
// Test hook: REBUILD_KILL_AT=<step> sends SIGKILL to this process at that step
// (the step names are the kill() calls below).
//
// Test hook: REBUILD_FAULT=tmp-corrupt:<table> makes the first insert into that table
// of the new (temporary) store throw SQLite's SQLITE_CORRUPT, as a fault of the new
// file would (R8-4 (3)). REBUILD_FAULT=legacy-corrupt:<table> makes the copy's read of
// that legacy table throw SQLITE_CORRUPT on the legacy connection, after the digest
// read it (R9-5: a table whose copy fails has a null digest and count).
//
// Exports used by the test, and the one rule AD-20's purge and AD-4's status apply
// to a legacy file: legacyNotCarried(). legacyProjects() is the file test that
// replaces the legacy_pending rows (R6-3). purgeFiles() is the purge's deletion, in
// AD-20's order (R7-8). migrationChecksum() is the checksum over a migration's text
// with CRLF read as LF (R7-2). publishStore() is the rename onto a new-name store,
// with the name's -journal/-wal/-shm deleted first (R8-3). handlerMiss() is the
// handler's binding-miss rule and childBinding() the spawned child's (R8-1).
// handlerEvent() is the hook path's order before it: a legacy global store, the binding
// lookup, a bound store that is legacy (the legacy-store spawn), then the miss (R9-3).
//
// Not prototyped (named in the README): the lock databases and the re-check under
// them (AD-26), the first index and mine after the rename (the new indexer does not
// exist yet), the rest of the handler, the purge's refusal bullets other than the
// legacy-file rule, and the status text.
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// layouts/ and new-layout/ are unchanged: read from the 2026-09-28 evidence directory.
const EVIDENCE = path.join(HERE, '..', '2026-09-28-rebuild-mapping-evidence');
const sql = (dir, f) => readFileSync(path.join(EVIDENCE, dir, f), 'utf8');
const NEW = { project: '001_phase_a_project.sql', fts: '001b_phase_a_fts.sql', global: '002_phase_a_global.sql' };
const LAYOUTS = ['b229c04', '4dd0f00-4e070ce'];

// ---------------------------------------------------------------------------
// RULES — every table of each known layout. `rule` is one of:
//   as-is       every column copied unchanged (columns listed in `set` excepted)
//   translate   copied, the columns in `ids` mapped legacy files.id -> path -> new files.id
//   filter      only rows matching `where` are carried (with `ids` if any)
//   merge       tuning: see mergeTuning()
//   meta        schema_meta / global_meta: per key, see META
//   derived     not carried: rebuilt from the repository and its history
//   no-writer   not carried: no build of the layout writes it; a legacy row is
//               recorded as unplaced, never dropped silently
//   replica     not carried: a copy the fold republishes from carried rows
// `set` gives a new value for a column: 'NULL', or 'order' (seq assigned in the
// legacy insertion order, for a legacy table without an explicit seq).
// ---------------------------------------------------------------------------
const DERIVED = 'derived from the repository and its git history; the first index and mine rebuild it';
const P_B229 = {
  schema_meta: { rule: 'meta' },
  files: { rule: 'derived', why: `${DERIVED}; a row is created (in_tree 0, lang/zone 'unknown', NULL hash and mtime, the legacy row's provenance) for each path a carried row references, and the first index upserts it by its UNIQUE path` },
  symbols: { rule: 'derived', why: DERIVED }, import_edges: { rule: 'derived', why: DERIVED },
  symbol_refs: { rule: 'derived', why: DERIVED }, test_map: { rule: 'derived', why: DERIVED },
  commits: { rule: 'derived', why: DERIVED }, cochange_pairs: { rule: 'derived', why: DERIVED },
  labelled_touches: { rule: 'derived', why: DERIVED }, path_tokens: { rule: 'derived', why: DERIVED },
  symbol_tokens: { rule: 'derived', why: DERIVED },
  fts_symbols: { rule: 'derived', why: DERIVED }, fts_paths: { rule: 'derived', why: DERIVED },
  landmines: { rule: 'filter', where: "kind = 'human_stated'", ids: ['file_id'], why: "human_stated rows are owner input (note --kind landmine, built at 59cc05c only); miner kinds are rebuilt from labelled_touches by the mine" },
  invariants: { rule: 'as-is' },
  invariant_members: { rule: 'translate', ids: ['file_id'] },
  human_facts: { rule: 'as-is', why: 'target_ref is a path (note --file) or empty, never an id' },
  corrections: { rule: 'as-is' },
  stats_folds: { rule: 'as-is', why: 'kept with the two fold watermarks, so the fold state matches the carried whisper_audit/corrections seq values (no build of the layout writes it: the fold is a no-op stub)' },
  questions: { rule: 'as-is', why: "live answer-drift state (F5-8), and the only record of `correct --missed-question`, which writes no corrections row in any build" },
  classify_state: { rule: 'as-is', why: 'the catch-up bookmark of each consumer (F5-8); byte offsets into transcripts the rebuild does not change' },
  consumer_state: { rule: 'filter', where: "subject_key LIKE 'path:%'", why: "read-set keys are path:<path> (hook/delivery.ts) and carry as they are; any other key may embed a file or symbol id, and dropping it only lets a fact repeat once (AD-16's safe direction) — no build writes one (every genre returns [])" },
  session_log: { rule: 'as-is', why: 'the session diagnostics status and log read (FR-M1)' },
  observed_actions: { rule: 'as-is', why: 'paths, not ids; the live edit set and run state (F5-8)' },
  regret: { rule: 'no-writer', why: 'the regret proxy is not built in any build (hook/handler.ts "SKELETON: G32"); fact_ref may embed ids' },
  whisper_audit: { rule: 'as-is', set: { subject_key: 'NULL' }, why: 'the audit trail (FR-X6) and the genre a correction is booked to; subject_key may embed file or symbol ids (F5-1) and is carried as NULL, which under-seeds a later resume/fork reseed (AD-16\'s safe direction) — no build writes a non-NULL one' },
  faults: { rule: 'as-is', why: 'the fault history status reads (FR-M2); ids are ULIDs' },
  classified_turns: { rule: 'as-is' },
};
const P_L0 = {
  ...P_B229,
  corrections: { rule: 'as-is', set: { seq: 'order', genre: 'NULL' }, why: 'no seq or genre column in this layout: seq is assigned in legacy order (ts, rowid); genre NULL is what AD-5 folds as unattributed, and every legacy row names a whisper or deny' },
  whisper_audit: { rule: 'as-is', set: { seq: 'order', subject_key: 'NULL' }, why: 'no seq or subject_key column in this layout: seq assigned in legacy order (ts, rowid); subject_key NULL' },
  session_log: { rule: 'as-is', set: { seq: 'order' }, why: "the legacy seq is a caller-supplied per-session counter; the new seq is engine-assigned (N16), in legacy insertion order (ts, rowid)" },
  observed_actions: { rule: 'as-is', set: { seq: 'order', segments_json: 'NULL' }, why: 'as session_log; segments_json did not exist' },
};
delete P_L0.stats_folds; delete P_L0.labelled_touches; delete P_L0.path_tokens; delete P_L0.symbol_tokens;
const G_B229 = {
  global_meta: { rule: 'meta' },
  whisper_stats: { rule: 'as-is', why: "each project's replica, kept consistent with the carried stats_folds (no build of the layout writes it)" },
  tuning: { rule: 'merge' },
  lessons: { rule: 'as-is' },
};
const G_L0 = { ...G_B229, whisper_stats: { rule: 'replica', why: "59cc05c's windowed replica; the fold republishes it from the carried corrections and whisper_audit from watermark 0" } };
export const RULES = { b229c04: { project: P_B229, global: G_B229 }, '4dd0f00-4e070ce': { project: P_L0, global: G_L0 } };

// Per-key rules of the meta tables. Keys are every key any build writes
// (grep of `meta.set(`/`schema_meta`/`global_meta` writers at b229c04, 59cc05c and
// HEAD) plus the keys 001's comment lists. An unlisted key is recorded unplaced.
const META = {
  project: {
    asIs: ['store_created_at', 'settings_created_by_init', 'claude_dir_created_by_init', 'pinned_interpreter', 'identity',
      'fold_watermark_audit', 'fold_watermark_corrections'],
    fresh: ['fts_state', 'repo_key', 'keying_mode'],
    replaced: ['schema_version'], // the migration checksums replace it (R6-7)
    derived: ['last_mined_commit', 'index_head', 'index_stale', 'mined_half_life_days', 'mining_in_progress', 'ref_ts',
      'corpus_floor_met', 'lang_capabilities', 'walk_mode', 'frontend_fingerprint', 'weight_epoch', 'head_unresolved_since',
      'indexing_in_progress', 'reindex_owner_pid', 'reindex_started_at'],
    noWriter: ['regret_index_seq'],
  },
  global: { asIsPrefix: ['repo_path:'], replaced: ['schema_version'], replicaPrefix: ['whisper_stats_watermark:'] },
};

// ---------------------------------------------------------------------------
const KILL = process.env.REBUILD_KILL_AT;
function kill(step) { if (KILL === step) process.kill(process.pid, 'SIGKILL'); }
const FAULT = process.env.REBUILD_FAULT ?? '';

/** The Store shape the HEAD DAOs use, over one DatabaseSync. */
function wrap(db) {
  let n = 0;
  return {
    db,
    prepare: (s) => db.prepare(s),
    exec: (s) => db.exec(s),
    transaction(fn) {
      const sp = `sp${n++}`;
      db.exec(`SAVEPOINT ${sp}`);
      try { const r = fn(); db.exec(`RELEASE ${sp}`); return r; } catch (e) { db.exec(`ROLLBACK TO ${sp}`); db.exec(`RELEASE ${sp}`); throw e; }
    },
    close: () => db.close(),
  };
}

const MASTER = "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'fts\\_%' ESCAPE '\\' ORDER BY type, name";
// The DDL text with CRLF line endings read as LF (R6-9): the repository's
// .gitattributes sets `* text=auto`, so a checkout on a CRLF platform hands the
// legacy runner migration files with CRLF, and sqlite_master keeps the text as run.
// Nothing else is normalised: no other transformation of the files is known.
const ddl = (db) => JSON.stringify(db.prepare(MASTER).all().map((r) => ({ ...r, sql: r.sql === null ? null : r.sql.replaceAll('\r\n', '\n') })));
/** The known layout whose committed DDL the legacy file's DDL equals (FTS objects aside; CRLF read as LF), or null. */
export function detectLayout(legacy, scope) {
  const have = ddl(legacy);
  for (const l of LAYOUTS) {
    const m = new DatabaseSync(':memory:');
    m.exec(sql(`layouts/${l}`, scope === 'project' ? NEW.project : NEW.global));
    const want = ddl(m);
    m.close();
    if (have === want) return l;
  }
  return null;
}

const sha = (s) => createHash('sha256').update(s).digest('hex');
/** A migration's checksum, over its text with CRLF read as LF (R7-2): the same
 * normalisation as the layout test (R6-9), so a checkout's line endings do not
 * change it (Flyway's checksum is "encoding and line-ending independent"). */
export const migrationChecksum = (text) => sha(text.replaceAll('\r\n', '\n'));
function discard(p) { for (const s of ['', '-journal', '-wal', '-shm']) rmSync(p + s, { force: true }); }
/**
 * The rename onto a new-name store (R8-3). It runs under the store's lock, after the
 * re-check that the new name is absent, so a -journal, -wal or -shm at that name
 * belongs to no database: a purged or crashed store's. SQLite deletes such a file only
 * beside an empty database (pager.c: pagerOpenWalIfPresent and hasHotJournal act on
 * it only when nPage == 0), and a populated file renamed in is not empty, so a stale
 * WAL would be replayed into it (the round-8 review's Z2 (b), Z6, Z6b).
 */
export function publishStore(tmpPath, newPath) {
  for (const s of ['-journal', '-wal', '-shm']) rmSync(newPath + s, { force: true });
  renameSync(tmpPath, newPath);
}
function createTmp(tmp) {
  discard(tmp);
  const db = new DatabaseSync(tmp);
  db.exec('PRAGMA journal_mode = DELETE'); // no -wal/-shm beside a file that is renamed
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}
/** A table's row count by a scan of the table itself, used where the count decides
 * whether a table is read (the copy's count, a no-writer table's count; R9-5): SQLite
 * answers a plain count(*) from the smallest index when one exists, so a damaged index
 * alone made a table whose every row reads look unreadable. NOT INDEXED forbids any
 * index. The counts that only report how many rows a table holds that could not be read
 * (countRows, countOrNull) stay plain count(*), which may still answer from an index
 * when the table's own pages fail (Y5: session_log's 13). */
const countSql = (t) => `SELECT count(*) AS n FROM "${t.replaceAll('"', '""')}" NOT INDEXED`;
/** Each table's row count, null for a table that cannot be counted (R7-4). */
const countRows = (db) => Object.fromEntries(tables(db).map((t) => {
  try { return [t, db.prepare(`SELECT count(*) AS n FROM "${t.replaceAll('"', '""')}"`).get().n]; } catch { return [t, null]; }
}));
/** A read error that is a property of the file's content, not of the machine (R7-3). */
const fileUnreadable = (e) => e?.code === 'ERR_SQLITE_ERROR' && [11 /* SQLITE_CORRUPT */, 26 /* SQLITE_NOTADB */].includes(e.errcode & 0xff);
/**
 * The legacy connection with every statement's content error marked `legacyContent`
 * (R8-4 (3)): only an error raised by a statement on the legacy file is a property of
 * that file. The same error from the new store is a machine fault and fails the rebuild.
 */
function legacyReader(db) {
  const tag = (e) => { if (fileUnreadable(e)) e.legacyContent = true; return e; };
  const guard = (fn) => (...a) => { try { return fn(...a); } catch (e) { throw tag(e); } };
  return {
    prepare: guard((s) => { const st = db.prepare(s); return { all: guard((...a) => st.all(...a)), get: guard((...a) => st.get(...a)) }; }),
    exec: guard((s) => db.exec(s)),
  };
}
const countOrNull = (db, t) => { try { return db.prepare(`SELECT count(*) AS n FROM "${t.replaceAll('"', '""')}"`).get().n; } catch { return null; } };
const cols = (db, t) => db.prepare(`SELECT name FROM pragma_table_info('${t}') ORDER BY cid`).all().map((r) => r.name);
const tables = (db) => db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\' AND name NOT LIKE 'fts\\_%\\_%' ESCAPE '\\' ORDER BY rowid").all().map((r) => r.name);

/** Copy one table by its rule; returns the number of rows written. */
function copyTable(legacy, tmp, t, r, fileIdFor, report) {
  const lcols = cols(legacy, t);
  const ncols = cols(tmp.db, t);
  const set = r.set ?? {};
  const where = r.where ? ` WHERE ${r.where}` : '';
  // legacy insertion order: the explicit seq where the table has one, else (ts, rowid)
  const orderBy = set.seq === 'order' ? 'ts, rowid' : lcols.includes('seq') ? 'seq' : 'rowid';
  // Every legacy read that can fail the table as a whole runs before its first write
  // (R9-8): its rows are read in full and counted here, so a rollback of the table never
  // discards a files row the id translation's cache still holds. The one legacy read
  // inside the loop, fileIdFor's files lookup, fails only its row (unplaced below).
  if (FAULT === `legacy-corrupt:${t}`) throw Object.assign(new Error('database disk image is malformed (injected: the legacy file)'), { code: 'ERR_SQLITE_ERROR', errcode: 11, legacyContent: true });
  const rows = legacy.prepare(`SELECT rowid AS __rowid, * FROM ${t}${where} ORDER BY ${orderBy}`).all();
  const total = legacy.prepare(countSql(t)).get().n;
  if (r.where && total > rows.length) report.dropped[t] = total - rows.length;
  for (const c of lcols) if (!ncols.includes(c)) throw new Error(`${t}.${c}: no such column in the new layout`);
  let seq = 0, n = 0;
  for (const row of rows) {
    // A row the new layout refuses (a constraint), whose file id has no legacy files
    // row, or whose legacy files row cannot be read (a content error on the legacy
    // file, R8-4) is not carried: it is recorded unplaced with the reason, and stays
    // in the legacy file (R6-8). Any other error (disk full, I/O, any error of the new
    // store) fails the rebuild.
    try {
      const out = {};
      for (const c of ncols) {
        if (set[c] === 'NULL') {
          if (lcols.includes(c) && row[c] !== null) report.nulled[`${t}.${c}`] = (report.nulled[`${t}.${c}`] ?? 0) + 1;
          out[c] = null;
        } else if (set[c] === 'order') out[c] = ++seq;
        else if ((r.ids ?? []).includes(c)) out[c] = fileIdFor(row[c]);
        else if (lcols.includes(c)) out[c] = row[c];
      }
      const k = Object.keys(out);
      if (FAULT === `tmp-corrupt:${t}`) throw Object.assign(new Error('database disk image is malformed (injected: the new file)'), { code: 'ERR_SQLITE_ERROR', errcode: 11 });
      tmp.prepare(`INSERT INTO ${t}(${k.join(', ')}) VALUES(${k.map(() => '?').join(', ')})`).run(...k.map((c) => out[c]));
      n++;
    } catch (e) {
      if (!(e.unplaceable || e.legacyContent || (e.code === 'ERR_SQLITE_ERROR' && (e.errcode & 0xff) === 19 /* SQLITE_CONSTRAINT */))) throw e;
      report.unplaced.push({ table: t, rows: 1, rowid: row.__rowid, reason: e.message });
    }
  }
  return n;
}

/** The owner's tuning rows replace the new store's rows for the same key, each validated like `tune` (F5-2, F5-3). */
function mergeTuning(legacy, tmp, head, report) {
  const owner = legacy.prepare("SELECT rowid, key, project_key, value, source, updated_at FROM tuning WHERE source = 'owner' ORDER BY rowid").all();
  const groups = new Map();
  for (const o of owner) {
    const g = `${o.key}\u0000${o.project_key ?? ''}`;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(o);
  }
  let n = 0;
  for (const rows of groups.values()) {
    const { key, project_key } = rows[0];
    const reader = head.tuningReader(tmp, project_key ?? '', () => {});
    const refused = rows.map((o) => head.checkTuningWrite(reader, key, o.value)).find((c) => 'refused' in c);
    if (refused) {
      for (const o of rows) report.unplaced.push({ table: 'tuning', rows: 1, key, value: o.value, reason: refused.refused });
      continue;
    }
    tmp.transaction(() => {
      tmp.prepare('DELETE FROM tuning WHERE key = ? AND project_key IS ?').run(key, project_key);
      for (const o of rows) {
        tmp.prepare('INSERT INTO tuning(key, project_key, value, source, updated_at) VALUES(?, ?, ?, ?, ?)')
          .run(o.key, o.project_key, o.value, o.source, o.updated_at);
        n++;
      }
    });
  }
  return n;
}

function copyMeta(legacy, tmp, scope, report) {
  const t = scope === 'project' ? 'schema_meta' : 'global_meta';
  const m = META[scope];
  let n = 0;
  for (const { key, value } of legacy.prepare(`SELECT key, value FROM ${t} ORDER BY key`).all()) {
    if ((m.asIs ?? []).includes(key) || (m.asIsPrefix ?? []).some((p) => key.startsWith(p))) {
      tmp.prepare(`INSERT INTO ${t}(key, value) VALUES(?, ?)`).run(key, value); n++;
    } else if ([...(m.fresh ?? []), ...(m.replaced ?? []), ...(m.derived ?? [])].includes(key) || (m.replicaPrefix ?? []).some((p) => key.startsWith(p))) {
      // written fresh by the rebuild, replaced by the checksums, or by the first index/mine/fold
    } else report.unplaced.push({ table: t, rows: 1, key, value, reason: (m.noWriter ?? []).includes(key) ? 'no build of the layout writes it' : 'key unknown to the mapping' });
  }
  return n;
}

/** The legacy rows a table's rule carries, in rowid order: the query and its parameters, or null. */
function carriedQuery(t, r, scope) {
  if (r.rule === 'merge') return [`SELECT * FROM ${t} WHERE source = 'owner' ORDER BY rowid`, []];
  if (r.rule === 'meta') {
    const m = META[scope], keys = m.asIs ?? [], pre = m.asIsPrefix ?? [];
    const w = [...keys.map(() => 'key = ?'), ...pre.map(() => 'substr(key, 1, ?) = ?')];
    return [`SELECT * FROM ${t} WHERE ${w.join(' OR ') || '0'} ORDER BY rowid`, [...keys, ...pre.flatMap((x) => [x.length, x])]];
  }
  if (['as-is', 'translate', 'filter'].includes(r.rule)) return [`SELECT * FROM ${t}${r.where ? ` WHERE ${r.where}` : ''} ORDER BY rowid`, []];
  return null;
}
/**
 * A SHA-256 per carried table over the rows its rule carries (R6-2). Recorded at the
 * snapshot, and compared later, it names a table an earlier build changed after the
 * rebuild, an update or a delete-and-insert (`tune`) included, which a row count
 * does not see.
 */
export function carriedDigests(legacy, layout, scope) {
  const rules = RULES[layout][scope], digests = {}, counts = {}, unreadable = {};
  const l = legacyReader(legacy);
  for (const t of tables(legacy)) {
    const q = t in rules ? carriedQuery(t, rules[t], scope) : null;
    if (q === null) continue;
    let rows;
    try { rows = l.prepare(q[0]).all(...q[1]); } catch (e) {
      // A table that fails to read on its content has no digest and no count (R8-4);
      // any other error is not a property of the file and is thrown.
      if (!e.legacyContent) throw e;
      digests[t] = null; counts[t] = null; unreadable[t] = e.message;
      continue;
    }
    const h = createHash('sha256');
    for (const row of rows) h.update(`${JSON.stringify(row)}\n`);
    digests[t] = h.digest('hex');
    counts[t] = rows.length; // beside the digest, so a message can say how many rows (R7-5)
  }
  return { digests, counts, unreadable };
}

function recordMigrations(tmp, t, files) {
  for (const [dir, f] of files) tmp.prepare(`INSERT OR REPLACE INTO ${t}(key, value) VALUES(?, ?)`).run(`migration_sha256:${f}`, migrationChecksum(sql(dir, f)));
}

function jsonl(file, obj) { mkdirSync(path.dirname(file), { recursive: true }); appendFileSync(file, `${JSON.stringify(obj)}\n`); }

/** Rebuild one legacy store. `scope` 'global' | 'project'. */
function rebuildStore(scope, legacyPath, newPath, head, extra) {
  const pre = scope === 'global' ? 'g' : 'p';
  if (existsSync(newPath)) return { scope, state: 'current' };
  if (!existsSync(legacyPath)) return { scope, state: 'no-legacy' };
  const tmpPath = `${newPath}.rebuild-tmp`;
  discard(tmpPath); kill(`${pre}1-discarded`);
  let legacy = null;
  // legacyRel and origin select the record the legacy-file rule reads (R8-5); root is
  // the root step 6 binds, the only root a later run completes the binding for (R8-1).
  const legacyRel = scope === 'project' ? path.join('projects', path.basename(path.dirname(legacyPath)), 'store.db') : path.join('global', 'global.db');
  const report = { legacyPath, legacyRel, origin: extra.origin ?? 'local', ...(scope === 'project' ? { root: extra.root } : {}), layout: null, carried: {}, unplaced: [], dropped: {}, nulled: {} };
  let db;
  try {
    try {
      legacy = new DatabaseSync(legacyPath, { readOnly: true });
      legacy.exec('BEGIN'); // one read snapshot for every table (F5-12)
      report.layout = detectLayout(legacy, scope);
    } catch (e) {
      // Only a content error (SQLITE_CORRUPT, SQLITE_NOTADB) makes the file one of no
      // known layout: rebuilt from the repository, unread (R9-4). Any other error of the
      // open or the schema read (SQLITE_BUSY or _LOCKED, SQLITE_CANTOPEN, SQLITE_IOERR,
      // SQLITE_NOMEM) is a condition of the moment: the rebuild fails and is retried.
      if (!fileUnreadable(e)) throw e;
      report.unreadable = String(e?.message ?? e);
      try { legacy?.close(); } catch { /* already unusable */ }
      legacy = null;
    }
    db = createTmp(tmpPath);
    const tmp = wrap(db);
    const meta = scope === 'project' ? 'schema_meta' : 'global_meta';
    if (scope === 'project') {
      const fts = head.probeFts5(tmp);
      tmp.exec(sql('new-layout', NEW.project));
      if (fts) tmp.exec(sql('new-layout', NEW.fts));
      recordMigrations(tmp, meta, fts ? [['new-layout', NEW.project], ['new-layout', NEW.fts]] : [['new-layout', NEW.project]]);
      // No index_stale key (R6-7): index_head is absent, so AD-23's staleness check
      // (index_head differs from HEAD) spawns the first index.
      for (const [k, v] of [['fts_state', fts ? 'fts5' : 'fallback'], ['repo_key', extra.key.key], ['keying_mode', extra.key.mode]])
        tmp.prepare('INSERT INTO schema_meta(key, value) VALUES(?, ?)').run(k, v);
    } else {
      tmp.exec(sql('new-layout', NEW.global));
      recordMigrations(tmp, meta, [['new-layout', NEW.global]]);
      head.seedDefaults(tmp);
      // No legacy_pending: rows (R6-3). Which project stores still await a rebuild is
      // the file test legacyProjects() below, which needs no row to be ended.
    }
    kill(`${pre}2-created`);
    if (report.layout !== null) {
      const L = legacyReader(legacy);
      const rules = RULES[report.layout][scope];
      const legacyTables = tables(L);
      for (const t of legacyTables) if (!(t in rules)) throw new Error(`${t}: no rule for this table`);
      // the carried rows' digest per table at the snapshot, so status names a table a
      // still-running earlier build changes in the legacy file afterwards (F5-18, R6-2)
      const dg = carriedDigests(legacy, report.layout, scope);
      ({ digests: report.legacyDigests, counts: report.legacyCounts } = dg);
      const ids = new Map();
      const fileIdFor = (legacyId) => {
        if (ids.has(legacyId)) return ids.get(legacyId);
        const f = L.prepare('SELECT * FROM files WHERE id = ?').get(legacyId);
        if (f === undefined) throw Object.assign(new Error(`files.id ${legacyId}: no legacy row`), { unplaceable: true });
        const got = tmp.prepare('SELECT id FROM files WHERE path = ?').get(f.path);
        const now = Date.now();
        const id = got?.id ?? tmp.prepare(`INSERT INTO files(path, lang, zone, in_tree, content_hash, mtime, prov_kind, prov_ref, trust,
            injection_suspect, created_at, updated_at) VALUES(?, 'unknown', 'unknown', 0, NULL, NULL, ?, ?, ?, ?, ?, ?) RETURNING id`)
          .get(f.path, f.prov_kind, f.prov_ref, f.trust, f.injection_suspect, now, now).id;
        ids.set(legacyId, id);
        return id;
      };
      // Table by table (R8-4): a table whose read fails on the legacy file's content
      // is rolled back alone and recorded as an unplaced whole-table entry, with its
      // row count where it can still be counted (else null) and the error; every other
      // table is carried. A table whose digest could not be taken is not carried either,
      // since a later change to it could not be seen. Any other error fails the rebuild.
      const unreadTable = (t, message) => report.unplaced.push({ table: t, rows: countOrNull(legacy, t), reason: `the table could not be read (${message})`, unread: true });
      const perTable = (t, fn) => {
        if (dg.unreadable[t] !== undefined) return unreadTable(t, dg.unreadable[t]);
        const mark = report.unplaced.length;
        try { tmp.transaction(fn); } catch (e) {
          if (!e.legacyContent) throw e;
          report.unplaced.length = mark; delete report.carried[t]; delete report.dropped[t];
          // its digest and count are null, as for a table whose digest read failed (R9-5)
          if (t in report.legacyDigests) { report.legacyDigests[t] = null; report.legacyCounts[t] = null; }
          for (const k of Object.keys(report.nulled)) if (k.startsWith(`${t}.`)) delete report.nulled[k];
          unreadTable(t, e.message);
        }
      };
      let half = false;
      tmp.transaction(() => {
        for (const t of legacyTables) {
          const r = rules[t];
          if (r.rule === 'meta') perTable(t, () => { report.carried[t] = copyMeta(L, tmp, scope, report); });
          else if (r.rule === 'as-is' || r.rule === 'translate' || r.rule === 'filter') perTable(t, () => { report.carried[t] = copyTable(L, tmp, t, r, fileIdFor, report); });
          else if (r.rule === 'merge') perTable(t, () => { report.carried[t] = mergeTuning(L, tmp, head, report); });
          else if (r.rule === 'no-writer') perTable(t, () => {
            const n = L.prepare(countSql(t)).get().n;
            if (n > 0) report.unplaced.push({ table: t, rows: n, reason: r.why });
          });
          if (!half) { half = true; kill(`${pre}3-mid-copy`); }
        }
        if (scope === 'project') report.carried.files_created = ids.size;
      });
    }
    if (report.layout === null) {
      report.unread = true; // another layout, or unreadable: rebuilt from the repository; its rows are not read
      // ...but counted, where the file's schema can be read, so status and the purge's
      // refusal can say how many rows the file holds (R6-1; store-recovery items 3, 4).
      // A table that cannot be counted is null (R7-4).
      if (legacy !== null) report.unreadRows = countRows(legacy);
    }
    // The record goes into the new store before the rename, so a kill after the
    // rename cannot lose it (the JSONL line below is only a copy). The global store
    // has no faults table: its record is global_meta.store_rebuilt.
    // No legacy_unplaced key (R6-7): the record's unplaced entries each carry `rows`.
    tmp.transaction(() => {
      if (scope === 'project') {
        tmp.prepare("INSERT INTO faults(id, ts, code, detail_json, session) VALUES(?, ?, 'store_rebuilt', ?, NULL)")
          .run(`rebuild-${Date.now()}`, Date.now(), JSON.stringify(report));
      } else tmp.prepare("INSERT INTO global_meta(key, value) VALUES('store_rebuilt', ?)").run(JSON.stringify(report));
    });
    kill(`${pre}4-copied`);
    // Step 5, a project store only: the binding, before the rename (R9-3). A kill after
    // it leaves this root bound to a store that is still legacy, which the hook path's
    // legacy-store spawn rebuilds; a kill after the rename leaves nothing to complete.
    if (scope === 'project') { extra.bind(); kill('p5-bound'); }
    // The read transaction writes nothing, so it ends by ROLLBACK: on a file with a
    // content error its COMMIT reports the same corruption (R7-3, executed on Y5).
    if (legacy?.isTransaction) legacy.exec('ROLLBACK');
    db.close(); db = undefined;
    kill(scope === 'project' ? 'p6-closed' : 'g5-closed');
    publishStore(tmpPath, newPath); // the name's -journal/-wal/-shm deleted first (R8-3)
    kill(scope === 'project' ? 'p7-renamed' : 'g6-renamed');
    jsonl(extra.jsonl, { code: 'store_rebuilt', scope, ...report });
    return { scope, state: 'rebuilt', ...report };
  } catch (e) {
    const detail = { code: 'store_rebuild_failed', scope, legacyPath, error: String(e?.message ?? e) };
    jsonl(extra.jsonl, detail);
    return { scope, state: 'failed', ...detail };
  } finally {
    if (db !== undefined) db.close();
    legacy?.close();
  }
}

export async function rebuild({ home, repo, headBuild, origin = 'local', session = null }) {
  const d = path.join(headBuild, 'middleware/context-oracle/ctxoracle/dist/src');
  const head = {
    ...(await import(path.join(d, 'stores/dao/tuning.js'))),
    ...(await import(path.join(d, 'identity/repo_key.js'))),
    probeFts5: (await import(path.join(d, 'stores/adapter.js'))).probeFts5,
  };
  const out = [];
  const gNew = path.join(home, 'global/global-store.db');
  out.push(rebuildStore('global', path.join(home, 'global/global.db'), gNew, head, { origin, jsonl: path.join(home, 'diagnostics/rebuild.jsonl') }));
  if (out[0].state === 'failed') return out;
  kill('g7-global-done');
  const root = realpathSync(repo);
  const key = head.resolveRepoKey(root); // AD-3's rule, as init and every legacy build's open derive it
  const dir = path.join(home, 'projects', key.key);
  const p = rebuildStore('project', path.join(dir, 'store.db'), path.join(dir, 'project.db'), head, { key, root, origin, jsonl: path.join(dir, 'diagnostics/rebuild.jsonl'), bind: () => bindRoot(home, root, key.key) });
  out.push(p);
  if (p.state !== 'failed') p.binding = childBinding({ home, root, key: key.key, state: p.state, session });
  return out;
}

/** The binding init records (AD-20), repo_path:<root> -> key in the global store; no
 * legacy build wrote one. */
function bindRoot(home, root, key) {
  const g = new DatabaseSync(path.join(home, 'global/global-store.db'));
  try { g.exec('BEGIN'); g.prepare('INSERT OR REPLACE INTO global_meta(key, value) VALUES(?, ?)').run(`repo_path:${root}`, key); g.exec('COMMIT'); } finally { g.close(); }
}
const boundKey = (home, root) => {
  const gp = path.join(home, 'global/global-store.db');
  if (!existsSync(gp)) return undefined;
  const g = new DatabaseSync(gp, { readOnly: true });
  try { return g.prepare('SELECT value FROM global_meta WHERE key = ?').get(`repo_path:${root}`)?.value; } finally { g.close(); }
};
/**
 * The binding decision after the rebuild step, for the derived key's store in each of
 * its states (R8-1, R9-3). It is the same for a verb and for the child a binding miss spawns:
 *   - rebuilt now (the store was legacy): step 5 bound this root before the rename;
 *   - current (a project.db exists, whatever its schema state): bound when this root
 *     already has its binding; any other root is a checkout init has not bound (a second
 *     clone, a moved checkout): repo_not_bound on the home-level channel, no binding;
 *   - none (no store.db and no project.db): repo_not_bound on the home-level channel.
 * Since the rebuild binds before it renames (R9-3), no current store owes its own root a
 * binding: the round-8 completion by the record's root is gone, and the outcome at a
 * root does not depend on whether some unrelated legacy store exists.
 */
export function childBinding({ home, root, key, state, session }) {
  const notBound = (why) => { jsonl(path.join(home, 'diagnostics/faults.jsonl'), { code: 'repo_not_bound', root, key, session, why }); return 'repo_not_bound'; };
  if (state === 'rebuilt') return 'bound';
  if (state === 'no-legacy') return notBound('no store for the derived key');
  if (boundKey(home, root) === key) return 'bound';
  return notBound('the store of the derived key is current and this root is not bound');
}

/**
 * The hook path's order for an event whose upward walk found `root` (AD-4, AD-23;
 * R9-3), as far as the rebuild needs it: a legacy global store is spawned for; else the
 * binding is looked up; a bound store that is legacy (a store.db, no project.db) is the
 * legacy-store spawn, once per session_id under the same home-level marker; a bound
 * current store is served; a miss goes to handlerMiss(). Returns 'served', 'marked',
 * 'wait', 'spawn' or 'repo_not_bound' ('bound, no store' for a binding whose store is
 * gone, a state outside this prototype). The store_legacy record and the dispatch beyond
 * this decision are not prototyped.
 */
export function handlerEvent({ home, root, session, event }) {
  const legacySpawn = () => {
    const marker = path.join(home, 'diagnostics', `miss-${session}.marker`);
    if (existsSync(marker)) return 'marked';
    if (!['SessionStart', 'UserPromptSubmit'].includes(event)) return 'wait';
    mkdirSync(path.dirname(marker), { recursive: true }); writeFileSync(marker, '');
    return 'spawn';
  };
  if (!existsSync(path.join(home, 'global/global-store.db')) && existsSync(path.join(home, 'global/global.db'))) return legacySpawn();
  const key = boundKey(home, root);
  if (key === undefined) return handlerMiss({ home, root, session, event });
  if (existsSync(path.join(home, 'projects', key, 'project.db'))) return 'served';
  if (existsSync(path.join(home, 'projects', key, 'store.db'))) return legacySpawn();
  return 'bound, no store'; // a binding whose store is gone: outside this prototype
}

/**
 * The handler's binding-miss rule (AD-23, AD-17; R8-1), for an event whose upward walk
 * found `root` and whose lookup found no binding. The session's home-level marker
 * bounds it to once per session_id. With a legacy project store present it records no
 * fault and, on SessionStart and UserPromptSubmit, writes the marker and spawns the
 * child (the caller runs rebuild() with --session); the child records the miss by
 * childBinding(). Otherwise it records repo_not_bound itself.
 * Returns 'marked' (already handled this session), 'wait' (a legacy store, another
 * event), 'spawn' or 'repo_not_bound'.
 */
export function handlerMiss({ home, root, session, event }) {
  const marker = path.join(home, 'diagnostics', `miss-${session}.marker`);
  if (existsSync(marker)) return 'marked';
  const legacy = legacyProjects(home).length > 0;
  if (legacy && !['SessionStart', 'UserPromptSubmit'].includes(event)) return 'wait';
  mkdirSync(path.dirname(marker), { recursive: true }); writeFileSync(marker, '');
  if (legacy) return 'spawn';
  jsonl(path.join(home, 'diagnostics/faults.jsonl'), { code: 'repo_not_bound', root, session, why: 'no binding for this root' });
  return 'repo_not_bound';
}

/** The project directories that still hold a legacy store: a store.db and no project.db (R6-3). */
export function legacyProjects(home) {
  const projects = path.join(home, 'projects');
  return (existsSync(projects) ? readdirSync(projects) : []).filter((k) =>
    existsSync(path.join(projects, k, 'store.db')) && !existsSync(path.join(projects, k, 'project.db'))).sort();
}

/**
 * AD-20's one rule for a legacy file (R6-1): null when the file is absent or fully
 * carried, else why not. Fully carried means the file's own rebuild record exists, its
 * layout is known, it has zero unplaced rows and no table it could not read, and the
 * carried rows' digests are unchanged since (R6-2). A file of unknown layout, or one
 * that could not be read, is not carried.
 * The file's own record (R8-5) is the local record, in the new store beside it, whose
 * legacyRel is the file's path relative to its home: not the record of an import's
 * rebuild (origin 'import'), and independent of how the home's path is spelled or
 * where the home was moved.
 */
export function legacyNotCarried(scope, legacyPath, newPath) {
  if (!existsSync(legacyPath)) return null;
  // Not rebuilt yet: the rows the rebuild would carry would be lost, so their
  // per-table counts, and the command that rebuilds it (R7-5, R8-5).
  if (!existsSync(newPath)) return { reason: 'not rebuilt yet', ...carriedCounts(scope, legacyPath), command: 'ctxoracle index' };
  const rel = scope === 'project' ? path.join('projects', path.basename(path.dirname(legacyPath)), 'store.db') : path.join('global', 'global.db');
  const n = new DatabaseSync(newPath, { readOnly: true });
  const got = n.prepare(scope === 'project'
    ? "SELECT detail_json AS r FROM faults WHERE code = 'store_rebuilt' AND json_extract(detail_json, '$.origin') = 'local' AND json_extract(detail_json, '$.legacyRel') = ? ORDER BY ts DESC, rowid DESC LIMIT 1"
    : "SELECT value AS r FROM global_meta WHERE key = 'store_rebuilt' AND json_extract(value, '$.origin') = 'local' AND json_extract(value, '$.legacyRel') = ?").get(rel);
  n.close();
  // No record of this file (after an import replaced the store beside it): its carried
  // rows' counts, and no command, since project.db exists and no run rebuilds the file.
  if (got === undefined) return { reason: 'no rebuild record', ...carriedCounts(scope, legacyPath), command: null };
  const rec = JSON.parse(got.r);
  if (rec.layout === null) return { reason: rec.unreadable ? `the file could not be read (${rec.unreadable})` : 'layout unknown: its rows were not read', rows: rec.unreadRows ?? null };
  const unplacedRows = rec.unplaced.reduce((s, u) => s + (u.rows ?? 0), 0);
  const unreadTables = rec.unplaced.filter((u) => u.unread).map((u) => ({ table: u.table, rows: u.rows }));
  let now;
  try {
    const l = new DatabaseSync(legacyPath, { readOnly: true });
    try { l.exec('BEGIN'); now = carriedDigests(l, rec.layout, scope); l.exec('ROLLBACK'); } finally { l.close(); }
  } catch (e) { return { reason: `the file could not be read (${e.message})`, rows: null }; } // not carried, not a throw (R7-4)
  // A table unread at the rebuild is already named in unreadTables; one unread now is changed.
  const changedSince = Object.keys(rec.legacyDigests).filter((t) => rec.legacyDigests[t] !== null && now.digests[t] !== rec.legacyDigests[t])
    .map((t) => ({ table: t, rowsAtRebuild: rec.legacyCounts[t], rowsNow: now.counts[t] ?? null }));
  if (unplacedRows === 0 && unreadTables.length === 0 && changedSince.length === 0) return null;
  return { reason: 'rows not carried', unplacedRows, unreadTables, changedSince };
}
/** The layout of a legacy file and its carried rows' counts per table (the rows a rebuild
 * would carry); for a file of no known layout every table's count; rows null when the
 * file cannot be read (R8-5). */
function carriedCounts(scope, p) {
  try {
    const d = new DatabaseSync(p, { readOnly: true });
    try {
      d.exec('BEGIN');
      const layout = detectLayout(d, scope);
      return { layout, rows: layout === null ? countRows(d) : carriedDigests(d, layout, scope).counts };
    } finally { if (d.isTransaction) d.exec('ROLLBACK'); d.close(); }
  } catch { return { layout: null, rows: null }; }
}

/**
 * The purge's deletion (AD-20, R7-8): every file in the project directory except
 * reindex.lock, in this order, so that an interrupted purge never leaves the legacy
 * definition (a store.db with no project.db) and a re-run completes: the legacy file,
 * then the kept import copies, then any other file, and the project store last, each
 * database file before its -journal, -wal and -shm. A companion a kill leaves beside a
 * deleted database is harmless only because every creation of that name deletes the
 * name's companions first (publishStore, R8-3): SQLite itself deletes one only beside
 * an empty database (pager.c). The refusal is not prototyped here but for
 * legacyNotCarried.
 */
export function purgeFiles(dir) {
  const db = (n) => [n, `${n}-journal`, `${n}-wal`, `${n}-shm`];
  const all = readdirSync(dir).filter((n) => n !== 'reindex.lock');
  const first = [...db('store.db'), ...all.filter((n) => /\.pre-import-[^-]+$/.test(n)).sort().flatMap(db)];
  const last = db('project.db');
  const rest = all.filter((n) => !first.includes(n) && !last.includes(n)).sort();
  for (const n of [...first, ...rest, ...last]) {
    if (!existsSync(path.join(dir, n))) continue;
    rmSync(path.join(dir, n), { recursive: true, force: true });
    kill(`purge-after-${n}`);
  }
}

function printRules() {
  const lines = ['| layout | store | table | column | rule |', '|---|---|---|---|---|'];
  for (const l of LAYOUTS) for (const scope of ['project', 'global']) {
    const m = new DatabaseSync(':memory:');
    m.exec(sql(`layouts/${l}`, scope === 'project' ? NEW.project : NEW.global));
    if (scope === 'project') m.exec(sql(`layouts/${l}`, NEW.fts));
    const rules = RULES[l][scope];
    const ts = tables(m);
    for (const t of ts) if (!(t in rules)) throw new Error(`${l} ${t}: no rule`);
    for (const t of Object.keys(rules)) if (!ts.includes(t)) throw new Error(`${l} ${t}: rule for a table the layout lacks`);
    for (const t of ts) {
      const r = rules[t];
      for (const c of cols(m, t)) {
        let rule = r.rule;
        if (r.rule === 'meta') rule = 'per key (META)';
        else if ((r.ids ?? []).includes(c)) rule = 'id translation: legacy files.id -> path -> new files.id';
        else if (r.set?.[c] === 'NULL') rule = 'written NULL';
        else if (r.set?.[c] === 'order') rule = 'assigned in legacy insertion order';
        else if (['as-is', 'translate', 'filter'].includes(r.rule)) rule = r.where ? `as-is, rows where ${r.where}` : 'as-is';
        else if (r.rule === 'merge') rule = 'merge (owner rows replace the key\'s rows; validated as tune)';
        lines.push(`| ${l} | ${scope} | ${t} | ${c} | ${rule} |`);
      }
      for (const [c, v] of Object.entries(r.set ?? {})) if (!cols(m, t).includes(c)) lines.push(`| ${l} | ${scope} | ${t} | (new) ${c} | ${v === 'NULL' ? 'written NULL' : 'assigned in legacy insertion order'} |`);
    }
    m.close();
  }
  console.log(lines.join('\n'));
  for (const l of LAYOUTS) for (const scope of ['project', 'global']) for (const [t, r] of Object.entries(RULES[l][scope])) if (r.why) console.log(`- ${l} ${t}: ${r.why}`);
  console.log(`- META project: as-is ${META.project.asIs.join(', ')}; written fresh ${META.project.fresh.join(', ')} (plus the migration checksums); replaced by the checksums ${META.project.replaced.join(', ')}; derived ${META.project.derived.join(', ')}; no writer ${META.project.noWriter.join(', ')}; any other key unplaced`);
  console.log(`- META global: as-is ${META.global.asIsPrefix.join(', ')}*; replaced by the checksum ${META.global.replaced.join(', ')}; replica ${META.global.replicaPrefix.join(', ')}*; any other key unplaced`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  if (a.includes('--print-rules')) printRules();
  else if (a.includes('--purge-files')) purgeFiles(a[a.indexOf('--purge-files') + 1]);
  else {
    const arg = (n) => { const i = a.indexOf(n); if (i < 0 || a[i + 1] === undefined) { console.error(`missing ${n}`); process.exit(2); } return a[i + 1]; };
    const opt = (n, dflt) => { const i = a.indexOf(n); return i < 0 ? dflt : a[i + 1]; };
    const out = await rebuild({ home: arg('--home'), repo: arg('--repo'), headBuild: arg('--head'), origin: opt('--origin', 'local'), session: opt('--session', null) });
    console.log(JSON.stringify(out));
    process.exit(out.some((o) => o.state === 'failed') ? 1 : 0);
  }
}
