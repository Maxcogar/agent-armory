// rebuild.mjs — prototype of AD-4's rebuild of a legacy store, table by table.
//
//   node rebuild.mjs --home <CTXORACLE_HOME> --repo <repository root> --head <HEAD build dir>
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
// Not prototyped (named in the README): the lock databases and the re-check under
// them (AD-26), the first index and mine after the rename (the new indexer does not
// exist yet), and the status text.
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const sql = (dir, f) => readFileSync(path.join(HERE, dir, f), 'utf8');
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
    fresh: ['schema_version', 'fts_state', 'repo_key', 'keying_mode'],
    derived: ['last_mined_commit', 'index_head', 'index_stale', 'mined_half_life_days', 'mining_in_progress', 'ref_ts',
      'corpus_floor_met', 'lang_capabilities', 'walk_mode', 'frontend_fingerprint', 'weight_epoch', 'head_unresolved_since',
      'indexing_in_progress', 'reindex_owner_pid', 'reindex_started_at'],
    noWriter: ['regret_index_seq'],
  },
  global: { asIsPrefix: ['repo_path:'], fresh: ['schema_version', 'store_rebuilt', 'legacy_unplaced'], freshPrefix: ['legacy_pending:'], replicaPrefix: ['whisper_stats_watermark:'] },
};

// ---------------------------------------------------------------------------
const KILL = process.env.REBUILD_KILL_AT;
function kill(step) { if (KILL === step) process.kill(process.pid, 'SIGKILL'); }

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
/** The known layout whose committed DDL the legacy file's DDL equals exactly (FTS objects aside), or null. */
export function detectLayout(legacy, scope) {
  const have = JSON.stringify(legacy.prepare(MASTER).all());
  for (const l of LAYOUTS) {
    const m = new DatabaseSync(':memory:');
    m.exec(sql(`layouts/${l}`, scope === 'project' ? NEW.project : NEW.global));
    const want = JSON.stringify(m.prepare(MASTER).all());
    m.close();
    if (have === want) return l;
  }
  return null;
}

const sha = (s) => createHash('sha256').update(s).digest('hex');
function discard(p) { for (const s of ['', '-journal', '-wal', '-shm']) rmSync(p + s, { force: true }); }
function createTmp(tmp) {
  discard(tmp);
  const db = new DatabaseSync(tmp);
  db.exec('PRAGMA journal_mode = DELETE'); // no -wal/-shm beside a file that is renamed
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}
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
  const rows = legacy.prepare(`SELECT rowid AS __rowid, * FROM ${t}${where} ORDER BY ${orderBy}`).all();
  const total = legacy.prepare(`SELECT count(*) AS n FROM ${t}`).get().n;
  if (r.where && total > rows.length) report.dropped[t] = total - rows.length;
  for (const c of lcols) if (!ncols.includes(c)) throw new Error(`${t}.${c}: no such column in the new layout`);
  let seq = 0, n = 0;
  for (const row of rows) {
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
    tmp.prepare(`INSERT INTO ${t}(${k.join(', ')}) VALUES(${k.map(() => '?').join(', ')})`).run(...k.map((c) => out[c]));
    n++;
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
      for (const o of rows) report.unplaced.push({ table: 'tuning', key, value: o.value, reason: refused.refused });
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
    } else if ((m.fresh ?? []).includes(key) || (m.derived ?? []).includes(key) || [...(m.replicaPrefix ?? []), ...(m.freshPrefix ?? [])].some((p) => key.startsWith(p))) {
      // written fresh by the rebuild, or by the first index/mine/fold
    } else report.unplaced.push({ table: t, key, value, reason: (m.noWriter ?? []).includes(key) ? 'no build of the layout writes it' : 'key unknown to the mapping' });
  }
  return n;
}

function recordMigrations(tmp, t, files) {
  for (const [dir, f] of files) tmp.prepare(`INSERT OR REPLACE INTO ${t}(key, value) VALUES(?, ?)`).run(`migration_sha256:${f}`, sha(sql(dir, f)));
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
  const report = { legacyPath, layout: null, carried: {}, unplaced: [], dropped: {}, nulled: {} };
  let db;
  try {
    try {
      legacy = new DatabaseSync(legacyPath, { readOnly: true });
      legacy.exec('BEGIN'); // one read snapshot for every table (F5-12)
      report.layout = detectLayout(legacy, scope);
    } catch (e) {
      // A file that cannot be opened or whose schema cannot be read is of no known
      // layout: rebuilt from the repository, unread, never a failure that repeats.
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
      for (const [k, v] of [['fts_state', fts ? 'fts5' : 'fallback'], ['repo_key', extra.key.key], ['keying_mode', extra.key.mode], ['index_stale', '1']])
        tmp.prepare('INSERT INTO schema_meta(key, value) VALUES(?, ?)').run(k, v);
    } else {
      tmp.exec(sql('new-layout', NEW.global));
      recordMigrations(tmp, meta, [['new-layout', NEW.global]]);
      head.seedDefaults(tmp);
      // No build of either layout records a repo_path: binding, so after this rebuild
      // no binding names any repository. Each project directory still holding a legacy
      // store is recorded, so the handler's binding miss knows a rebuild may be owed (F5-5).
      const projects = path.join(path.dirname(legacyPath), '..', 'projects');
      for (const k of existsSync(projects) ? readdirSync(projects) : [])
        if (existsSync(path.join(projects, k, 'store.db')) && !existsSync(path.join(projects, k, 'project.db')))
          tmp.prepare('INSERT INTO global_meta(key, value) VALUES(?, ?)').run(`legacy_pending:${k}`, '1');
    }
    kill(`${pre}2-created`);
    if (report.layout === null) {
      report.unread = true; // another layout: rebuilt from the repository; its rows are not read
    } else {
      const rules = RULES[report.layout][scope];
      const legacyTables = tables(legacy);
      for (const t of legacyTables) if (!(t in rules)) throw new Error(`${t}: no rule for this table`);
      // every legacy table's row count at the snapshot, so status can report rows
      // a still-running earlier build writes to the legacy file afterwards (F5-18)
      report.legacyCounts = Object.fromEntries(legacyTables.filter((t) => !t.startsWith('fts_')).map((t) => [t, legacy.prepare(`SELECT count(*) AS n FROM ${t}`).get().n]));
      const ids = new Map();
      const fileIdFor = (legacyId) => {
        if (ids.has(legacyId)) return ids.get(legacyId);
        const f = legacy.prepare('SELECT * FROM files WHERE id = ?').get(legacyId);
        if (f === undefined) throw new Error(`files.id ${legacyId}: no legacy row`);
        const got = tmp.prepare('SELECT id FROM files WHERE path = ?').get(f.path);
        const now = Date.now();
        const id = got?.id ?? tmp.prepare(`INSERT INTO files(path, lang, zone, in_tree, content_hash, mtime, prov_kind, prov_ref, trust,
            injection_suspect, created_at, updated_at) VALUES(?, 'unknown', 'unknown', 0, NULL, NULL, ?, ?, ?, ?, ?, ?) RETURNING id`)
          .get(f.path, f.prov_kind, f.prov_ref, f.trust, f.injection_suspect, now, now).id;
        ids.set(legacyId, id);
        return id;
      };
      let half = false;
      tmp.transaction(() => {
        report.carried[meta] = copyMeta(legacy, tmp, scope, report);
        for (const t of legacyTables) {
          const r = rules[t];
          if (r.rule === 'as-is' || r.rule === 'translate' || r.rule === 'filter') report.carried[t] = copyTable(legacy, tmp, t, r, fileIdFor, report);
          else if (r.rule === 'merge') report.carried[t] = mergeTuning(legacy, tmp, head, report);
          else if (r.rule === 'no-writer') {
            const n = legacy.prepare(`SELECT count(*) AS n FROM ${t}`).get().n;
            if (n > 0) report.unplaced.push({ table: t, rows: n, reason: r.why });
          }
          if (!half) { half = true; kill(`${pre}3-mid-copy`); }
        }
        if (scope === 'project') report.carried.files_created = ids.size;
      });
    }
    // The record goes into the new store before the rename, so a kill after the
    // rename cannot lose it (the JSONL line below is only a copy). The global store
    // has no faults table: its record is global_meta.store_rebuilt.
    tmp.transaction(() => {
      tmp.prepare(`INSERT OR REPLACE INTO ${meta}(key, value) VALUES('legacy_unplaced', ?)`).run(String(report.unplaced.length));
      if (scope === 'project') {
        tmp.prepare("INSERT INTO faults(id, ts, code, detail_json, session) VALUES(?, ?, 'store_rebuilt', ?, NULL)")
          .run(`rebuild-${Date.now()}`, Date.now(), JSON.stringify(report));
      } else tmp.prepare("INSERT INTO global_meta(key, value) VALUES('store_rebuilt', ?)").run(JSON.stringify(report));
    });
    kill(`${pre}4-copied`);
    legacy?.exec('COMMIT');
    db.close(); db = undefined;
    kill(`${pre}5-closed`);
    renameSync(tmpPath, newPath);
    kill(`${pre}6-renamed`);
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

export async function rebuild({ home, repo, headBuild }) {
  const d = path.join(headBuild, 'middleware/context-oracle/ctxoracle/dist/src');
  const head = {
    ...(await import(path.join(d, 'stores/dao/tuning.js'))),
    ...(await import(path.join(d, 'identity/repo_key.js'))),
    probeFts5: (await import(path.join(d, 'stores/adapter.js'))).probeFts5,
  };
  const out = [];
  const gNew = path.join(home, 'global/global-store.db');
  out.push(rebuildStore('global', path.join(home, 'global/global.db'), gNew, head, { jsonl: path.join(home, 'diagnostics/rebuild.jsonl') }));
  if (out[0].state === 'failed') return out;
  kill('g7-global-done');
  const root = realpathSync(repo);
  const key = head.resolveRepoKey(root); // AD-3's rule, as init and every legacy build's open derive it
  const dir = path.join(home, 'projects', key.key);
  const p = rebuildStore('project', path.join(dir, 'store.db'), path.join(dir, 'project.db'), head, { key, jsonl: path.join(dir, 'diagnostics/rebuild.jsonl') });
  out.push(p);
  if (p.state === 'rebuilt' || p.state === 'current') {
    // The binding init records (AD-20); no legacy build wrote one.
    const g = new DatabaseSync(gNew);
    g.exec('BEGIN');
    g.prepare('INSERT OR REPLACE INTO global_meta(key, value) VALUES(?, ?)').run(`repo_path:${root}`, key.key);
    g.prepare('DELETE FROM global_meta WHERE key = ?').run(`legacy_pending:${key.key}`);
    g.exec('COMMIT');
    g.close();
    kill('p7-bound');
  }
  return out;
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
  console.log(`- META project: as-is ${META.project.asIs.join(', ')}; written fresh ${META.project.fresh.join(', ')} (plus index_stale '1' and the migration checksums); derived ${META.project.derived.join(', ')}; no writer ${META.project.noWriter.join(', ')}; any other key unplaced`);
  console.log(`- META global: as-is ${META.global.asIsPrefix.join(', ')}*; written fresh ${META.global.fresh.join(', ')}, ${META.global.freshPrefix.join(', ')}* (and the migration checksum); replica ${META.global.replicaPrefix.join(', ')}*; any other key unplaced`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  if (a.includes('--print-rules')) printRules();
  else {
    const arg = (n) => { const i = a.indexOf(n); if (i < 0 || a[i + 1] === undefined) { console.error(`missing ${n}`); process.exit(2); } return a[i + 1]; };
    const out = await rebuild({ home: arg('--home'), repo: arg('--repo'), headBuild: arg('--head') });
    console.log(JSON.stringify(out));
    process.exit(out.some((o) => o.state === 'failed') ? 1 : 0);
  }
}
