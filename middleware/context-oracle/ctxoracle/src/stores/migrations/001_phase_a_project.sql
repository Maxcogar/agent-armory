-- 001_phase_a_project.sql — Phase A project store (Step 7, AD-4).
-- Every table AD-4 names for Phase A; STRICT throughout; provenance is a NOT
-- NULL + CHECK block (PROV), so a provenance-less knowledge row is
-- unrepresentable at the DB level. Forward-only (AD-25). The two FTS5 virtual
-- tables are the separate, conditional 001b migration.
--
-- PROV (the AD-4 provenance block, expanded inline on every knowledge table):
--   prov_kind TEXT NOT NULL CHECK(prov_kind IN
--     ('repo_span','commit','human','mechanical','session')),
--   prov_ref TEXT NOT NULL,
--   trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
--   injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
--   created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL

CREATE TABLE schema_meta(key TEXT PRIMARY KEY, value TEXT) STRICT;

CREATE TABLE files(id INTEGER PRIMARY KEY, path TEXT NOT NULL UNIQUE,
  lang TEXT NOT NULL, zone TEXT NOT NULL CHECK(zone IN
    ('source','generated','vendored','build_output','unknown')),
  zone_evidence TEXT, zone_evidence_suspect INTEGER NOT NULL DEFAULT 0,
  entry_score INTEGER NOT NULL DEFAULT 0, content_hash TEXT NOT NULL,
  mtime INTEGER NOT NULL,
  prov_kind TEXT NOT NULL CHECK(prov_kind IN
    ('repo_span','commit','human','mechanical','session')),
  prov_ref TEXT NOT NULL,
  trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
  injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT;

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
  ref_count INTEGER NOT NULL) STRICT;

CREATE TABLE test_map(
  test_file INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  region_glob TEXT NOT NULL, source TEXT NOT NULL,
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
  a INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  b INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  pair_count INTEGER NOT NULL, a_count INTEGER NOT NULL,
  b_count INTEGER NOT NULL, last_ts INTEGER NOT NULL,
  PRIMARY KEY(a, b), CHECK(a < b)) STRICT;

CREATE TABLE landmines(id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('revert_chain','fix_chatter','human_stated')),
  file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  evidence TEXT NOT NULL, support INTEGER,
  prov_kind TEXT NOT NULL CHECK(prov_kind IN
    ('repo_span','commit','human','mechanical','session')),
  prov_ref TEXT NOT NULL,
  trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
  injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT;

CREATE TABLE invariants(id TEXT PRIMARY KEY, description TEXT NOT NULL,
  prov_kind TEXT NOT NULL CHECK(prov_kind IN
    ('repo_span','commit','human','mechanical','session')),
  prov_ref TEXT NOT NULL,
  trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
  injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT;

CREATE TABLE invariant_members(
  invariant_id TEXT NOT NULL REFERENCES invariants(id) ON DELETE CASCADE,
  file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
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

CREATE TABLE corrections(id TEXT PRIMARY KEY, whisper_id TEXT, deny_id TEXT,
  verdict TEXT NOT NULL CHECK(verdict IN ('false_fire','missed','confirm')),
  note TEXT, ts INTEGER NOT NULL,
  CHECK((whisper_id IS NULL) <> (deny_id IS NULL))) STRICT;

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

CREATE TABLE session_log(id TEXT PRIMARY KEY, session TEXT NOT NULL,
  consumer TEXT NOT NULL, seq INTEGER NOT NULL, event_type TEXT NOT NULL,
  ts INTEGER NOT NULL, latency_ms INTEGER, candidates_json TEXT,
  outcome TEXT, detail_json TEXT) STRICT;

CREATE TABLE observed_actions(session TEXT NOT NULL, consumer TEXT NOT NULL,
  seq INTEGER NOT NULL, tool TEXT NOT NULL, path TEXT,
  content_hash TEXT,   -- plan column (FR-L4 revert detection, Step 30)
  command_class INTEGER CHECK(command_class IN (1,2,3)),
  outcome TEXT CHECK(outcome IN ('ok','failed')), ts INTEGER NOT NULL) STRICT;

CREATE TABLE regret(id TEXT PRIMARY KEY, session TEXT NOT NULL,
  fact_kind TEXT NOT NULL CHECK(fact_kind IN
    ('cochange_pair','landmine','human_fact','invariant')),
  fact_ref TEXT NOT NULL, churn_kind TEXT NOT NULL CHECK(churn_kind IN
    ('re_edited','reverted','covering_test_failed')),
  candidate_state TEXT NOT NULL CHECK(candidate_state IN
    ('held_below_bar','held_dedup','never_triggered')),
  ts INTEGER NOT NULL) STRICT;   -- plan table (AD-18)

CREATE TABLE whisper_audit(id TEXT PRIMARY KEY, session TEXT NOT NULL,
  consumer TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('whisper','deny')),
  genre TEXT, ts INTEGER NOT NULL, text TEXT NOT NULL, evidence_json TEXT,
  confidence REAL, channel TEXT,
  continuation INTEGER NOT NULL DEFAULT 0) STRICT;

CREATE TABLE faults(id TEXT PRIMARY KEY, ts INTEGER NOT NULL,
  code TEXT NOT NULL, detail_json TEXT, session TEXT) STRICT;

CREATE TABLE classified_turns(consumer TEXT NOT NULL, uuid TEXT NOT NULL,
  ts INTEGER NOT NULL, clears INTEGER NOT NULL CHECK(clears IN (0,1)),
  reason TEXT CHECK(reason IN ('below_length_floor','deferral_only')),
  PRIMARY KEY(consumer, uuid)) STRICT;   -- plan table (D-plan-27)

-- Indexes the LIKE fallback searches use (AD-2); always created.
CREATE INDEX symbols_name ON symbols(name);
CREATE INDEX files_path ON files(path);
