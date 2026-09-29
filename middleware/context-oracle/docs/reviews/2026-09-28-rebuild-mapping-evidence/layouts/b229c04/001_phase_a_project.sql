-- 001_phase_a_project.sql — Phase A project store (Step 7, AD-4).
-- Every table AD-4 names for Phase A; STRICT throughout; provenance is a NOT
-- NULL + CHECK block (PROV), so a provenance-less knowledge row is
-- unrepresentable at the DB level. Forward-only for shipped stores (AD-25); no
-- store has shipped, so the reopened 2026-09-26 build delta edits this file in
-- place (plan §6). The two FTS5 virtual tables are the separate, conditional
-- 001b migration.
--
-- PROV (the AD-4 provenance block, expanded inline on every knowledge table):
--   prov_kind TEXT NOT NULL CHECK(prov_kind IN
--     ('repo_span','commit','human','mechanical','session')),
--   prov_ref TEXT NOT NULL,
--   trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
--   injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
--   created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
--
-- File-keyed rows: the index-derived ones (symbols, edges, refs, test map, path
-- tokens) cascade on a files delete; the history-derived ones (cochange_pairs,
-- landmines, labelled_touches, invariant_members) reference files WITHOUT
-- cascade, so the engine refuses to delete a files row mined history still
-- references (AD-4 "never cascading away its pairs or landmines"; G2).

CREATE TABLE schema_meta(key TEXT PRIMARY KEY, value TEXT) STRICT;
  -- keys: schema_version, repo_key, keying_mode, identity, last_mined_commit,
  -- index_head, index_stale, fts_state ('fts5'|'fallback'),
  -- settings_created_by_init, claude_dir_created_by_init, pinned_interpreter,
  -- regret_index_seq, mined_half_life_days, store_created_at,
  -- fold_watermark_audit, fold_watermark_corrections, mining_in_progress,
  -- ref_ts, corpus_floor_met, lang_capabilities, walk_mode (plan Step 7)

CREATE TABLE files(id INTEGER PRIMARY KEY, path TEXT NOT NULL UNIQUE,
  lang TEXT NOT NULL, zone TEXT NOT NULL CHECK(zone IN
    ('source','generated','vendored','build_output','unknown')),
  zone_evidence TEXT, zone_evidence_suspect INTEGER NOT NULL DEFAULT 0,
  entry_score INTEGER NOT NULL DEFAULT 0,
  in_tree INTEGER NOT NULL CHECK(in_tree IN (0,1)),   -- AD-4
  change_count INTEGER NOT NULL DEFAULT 0,            -- AD-4/AD-13: support(file)
  change_weight REAL NOT NULL DEFAULT 0,              -- AD-4/AD-13: the same commits,
                                                      -- each weighted 2^((ts-T0)/h)
  unresolved_imports INTEGER NOT NULL DEFAULT 0,      -- AD-4/AD-12
  content_hash TEXT,     -- NULL on a history-only row never indexed (AD-4:
  mtime INTEGER,         -- no in-band sentinel; "not in the tree" is in_tree=0)
  prov_kind TEXT NOT NULL CHECK(prov_kind IN
    ('repo_span','commit','human','mechanical','session')),
  prov_ref TEXT NOT NULL,
  trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
  injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT;          -- PROV.injection_suspect = the PATH was flagged (AD-19)

CREATE TABLE symbols(id INTEGER PRIMARY KEY,
  file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  name TEXT NOT NULL, kind TEXT NOT NULL,
  span_start INTEGER NOT NULL, span_end INTEGER NOT NULL,
  prov_kind TEXT NOT NULL CHECK(prov_kind IN
    ('repo_span','commit','human','mechanical','session')),
  prov_ref TEXT NOT NULL,
  trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
  injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT;

CREATE TABLE import_edges(
  src_file INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  dst_file INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  kind TEXT NOT NULL) STRICT;

CREATE TABLE symbol_refs(
  symbol_id INTEGER NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
  src_file INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  ref_count INTEGER NOT NULL) STRICT;   -- one row per (symbol, referencing file)

CREATE TABLE test_map(
  test_file INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  region_glob TEXT NOT NULL,            -- the covered file's path (AD-12)
  source TEXT NOT NULL CHECK(source IN ('import_edge','same_dir')),
  prov_kind TEXT NOT NULL CHECK(prov_kind IN
    ('repo_span','commit','human','mechanical','session')),
  prov_ref TEXT NOT NULL,
  trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
  injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT;

CREATE TABLE commits(hash TEXT PRIMARY KEY, ts INTEGER NOT NULL,
  entity_count INTEGER NOT NULL, excluded INTEGER NOT NULL DEFAULT 0,
  exclude_reason TEXT) STRICT;

CREATE TABLE cochange_pairs(
  a INTEGER NOT NULL REFERENCES files(id),
  b INTEGER NOT NULL REFERENCES files(id),
  pair_count INTEGER NOT NULL,
  pair_weight REAL NOT NULL,   -- AD-4/AD-13: the pair's commits, each weighted
                               -- 2^((ts-T0)/h); confidence = pair_weight /
                               -- change_weight(a)
  last_ts INTEGER NOT NULL,
  last_commit TEXT NOT NULL,   -- AD-4 (D-plan-35): the hash of the newest commit
                               -- in the pair's count — the commit pointer
                               -- AD-15's pair headlines carry
  PRIMARY KEY(a, b), CHECK(a < b)) STRICT;

CREATE TABLE landmines(id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('revert_chain','fix_chatter','human_stated')),
  file_id INTEGER NOT NULL REFERENCES files(id),
  evidence TEXT NOT NULL, support INTEGER,
  prov_kind TEXT NOT NULL CHECK(prov_kind IN
    ('repo_span','commit','human','mechanical','session')),
  prov_ref TEXT NOT NULL,
  trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
  injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT;
CREATE UNIQUE INDEX landmines_miner_key ON landmines(kind, file_id)
  WHERE kind IN ('revert_chain','fix_chatter');     -- AD-15: one row per (kind, file)

CREATE TABLE labelled_touches(
  file_id INTEGER NOT NULL REFERENCES files(id),
  commit_hash TEXT NOT NULL, label TEXT NOT NULL CHECK(label IN ('revert','fix')),
  ts INTEGER NOT NULL, PRIMARY KEY(file_id, commit_hash, label)) STRICT;  -- AD-4

CREATE TABLE invariants(id TEXT PRIMARY KEY, description TEXT NOT NULL,
  prov_kind TEXT NOT NULL CHECK(prov_kind IN
    ('repo_span','commit','human','mechanical','session')),
  prov_ref TEXT NOT NULL,
  trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
  injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT;

CREATE TABLE invariant_members(
  invariant_id TEXT NOT NULL REFERENCES invariants(id) ON DELETE CASCADE,
  file_id INTEGER NOT NULL REFERENCES files(id),
  span TEXT) STRICT;

CREATE TABLE human_facts(id TEXT PRIMARY KEY, statement TEXT NOT NULL,
  target_kind TEXT NOT NULL, target_ref TEXT NOT NULL,
  stated_at INTEGER NOT NULL,
  prov_kind TEXT NOT NULL CHECK(prov_kind IN
    ('repo_span','commit','human','mechanical','session')),
  prov_ref TEXT NOT NULL,
  trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
  injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT;

CREATE TABLE corrections(seq INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE,
  whisper_id TEXT, deny_id TEXT,
  verdict TEXT NOT NULL CHECK(verdict IN ('false_fire','missed','confirm')),
  genre TEXT,          -- AD-4 (D-plan-35): the fold's attribution input for a
                       -- whisper-less 'missed' (the --genre value, or
                       -- 'answer_drift' for --missed-question) — AD-5/AD-18
  note TEXT, ts INTEGER NOT NULL,
  CHECK(whisper_id IS NULL OR deny_id IS NULL),
  CHECK(whisper_id IS NOT NULL OR deny_id IS NOT NULL OR verdict = 'missed'),
  CHECK(genre IS NULL OR (whisper_id IS NULL AND deny_id IS NULL))) STRICT;
  -- append-only (AD-4): no code path updates or deletes a corrections row

CREATE TABLE stats_folds(seq INTEGER PRIMARY KEY, genre TEXT NOT NULL,
  sent INTEGER NOT NULL, corrected_false INTEGER NOT NULL,
  corrected_missed INTEGER NOT NULL,
  audit_from INTEGER NOT NULL, audit_to INTEGER NOT NULL,
  corrections_from INTEGER NOT NULL, corrections_to INTEGER NOT NULL,
  ts INTEGER NOT NULL) STRICT;                        -- AD-4/AD-5; append-only

CREATE TABLE questions(id TEXT PRIMARY KEY, consumer TEXT NOT NULL,
  question_text TEXT NOT NULL, content_hash TEXT NOT NULL,
  asked_uuid TEXT, asked_offset INTEGER,
  status TEXT NOT NULL CHECK(status IN ('open','answered','expired')),
  closed_by_uuid TEXT,
  closed_by_kind TEXT CHECK(closed_by_kind IN
    ('generic_text_all_prior','expired','intake_invalidated')),
  opened_at INTEGER NOT NULL, closed_at INTEGER,
  UNIQUE(consumer, asked_uuid)) STRICT;
CREATE UNIQUE INDEX q_open_dedup ON questions(consumer, content_hash)
  WHERE status = 'open';

CREATE TABLE classify_state(consumer TEXT PRIMARY KEY,
  bookmark_offset INTEGER NOT NULL DEFAULT 0, bookmark_uuid TEXT,
  updated_at INTEGER NOT NULL) STRICT;

CREATE TABLE consumer_state(consumer TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('delivered','read')),
  subject_key TEXT NOT NULL, ts INTEGER NOT NULL,
  PRIMARY KEY(consumer, kind, subject_key)) STRICT;

-- `seq INTEGER PRIMARY KEY` (an explicit rowid alias assigned at insert under
-- the write lock) on the four watermarked/ordered tables: VACUUM (and so VACUUM
-- INTO export) may change the ROWIDs of tables without an explicit INTEGER
-- PRIMARY KEY (AD-4/AD-5; G33/N11/N16).
CREATE TABLE session_log(seq INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE,
  session TEXT NOT NULL, consumer TEXT NOT NULL, event_type TEXT NOT NULL,
  ts INTEGER NOT NULL, latency_ms INTEGER, candidates_json TEXT,
  outcome TEXT, detail_json TEXT) STRICT;

CREATE TABLE observed_actions(seq INTEGER PRIMARY KEY,   -- N16: engine-assigned
  session TEXT NOT NULL, consumer TEXT NOT NULL,
  tool TEXT NOT NULL, path TEXT,
  command_class INTEGER CHECK(command_class IN (1,2,3)),
  outcome TEXT CHECK(outcome IN ('ok','failed')),
  content_hash TEXT,   -- AD-4/AD-23: the edited file's hash after an ok
                       -- Edit/Write; NULL above the AD-12 cap
  segments_json TEXT,  -- plan column: Step 17's per-segment classes for a
                       -- Bash row (Verification's run subtraction reads them)
  ts INTEGER NOT NULL) STRICT;

CREATE TABLE regret(id TEXT PRIMARY KEY, session TEXT NOT NULL,
  fact_kind TEXT NOT NULL CHECK(fact_kind IN
    ('cochange_pair','landmine','human_fact','invariant')),
  fact_ref TEXT NOT NULL, churn_kind TEXT NOT NULL CHECK(churn_kind IN
    ('re_edited','reverted','covering_test_failed')),
  candidate_state TEXT NOT NULL CHECK(candidate_state IN
    ('held_below_bar','held_dedup','never_triggered')),
  ts INTEGER NOT NULL) STRICT;   -- plan table (AD-18)

CREATE TABLE whisper_audit(seq INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE,
  session TEXT NOT NULL, consumer TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('whisper','deny')),
  genre TEXT, ts INTEGER NOT NULL, text TEXT NOT NULL, evidence_json TEXT,
  confidence REAL, channel TEXT,
  subject_key TEXT,    -- AD-4/AD-16: NULL on deny rows
  continuation INTEGER NOT NULL DEFAULT 0) STRICT;
  -- append-only (AD-4, FR-X6)

CREATE TABLE faults(id TEXT PRIMARY KEY, ts INTEGER NOT NULL,
  code TEXT NOT NULL, detail_json TEXT, session TEXT) STRICT;

CREATE TABLE classified_turns(consumer TEXT NOT NULL, uuid TEXT NOT NULL,
  ts INTEGER NOT NULL, clears INTEGER NOT NULL CHECK(clears IN (0,1)),
  reason TEXT CHECK(reason IN ('below_length_floor','deferral_only')),
  PRIMARY KEY(consumer, uuid)) STRICT;   -- plan table (D-plan-27)

CREATE TABLE path_tokens(token TEXT NOT NULL,
  file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE) STRICT;
  -- plan table: the indexed token-prefix path search of the fallback (AD-2;
  -- N6); written by the indexer in both FTS states (Step 14)
CREATE TABLE symbol_tokens(token TEXT NOT NULL,
  symbol_id INTEGER NOT NULL REFERENCES symbols(id) ON DELETE CASCADE) STRICT;
  -- plan table: AD-2's normalized symbol tokens for the fallback — one row per
  -- distinct token of a symbol's name; written by the indexer in both FTS
  -- states (Step 14)

-- Indexes: the fallback searches (AD-2) — plain BINARY indexes serve the range
-- `token >= ? AND token < ? || char(0x10FFFF)`; the tokens are already
-- case-folded, so no NOCASE.
CREATE INDEX symbol_tokens_token ON symbol_tokens(token);
CREATE INDEX path_tokens_token ON path_tokens(token);
CREATE INDEX files_path ON files(path);
CREATE INDEX whisper_audit_text ON whisper_audit(text);  -- AD-16 fork reseed
CREATE INDEX observed_actions_session ON observed_actions(session, consumer);
CREATE INDEX cochange_pairs_b ON cochange_pairs(b);       -- partnersOf(x) reads a=x OR b=x
