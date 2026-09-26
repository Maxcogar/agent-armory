-- 002_phase_a_global.sql — Phase A global store (Step 8, AD-5). The four
-- cross-project tables, STRICT, same type resolution as Step 7. Edited in place
-- by the reopened 2026-09-26 build delta (plan §6: no store has shipped).
--
-- `global_meta` holds the schema version and the repository bindings
-- (`repo_path:<realpath of a repository root>` -> repo key, AD-20) and NO fold
-- watermark: the watermarks and the per-fold ledger live in the project store
-- (schema_meta, stats_folds), and `whisper_stats` is a replaceable copy of each
-- project's stats_folds totals (AD-5; G33/N11). The `tuning` seed rows are
-- written by Step 12, not here. No `env_capabilities` (a Phase B writer's table).

CREATE TABLE global_meta(key TEXT PRIMARY KEY, value TEXT) STRICT;

CREATE TABLE whisper_stats(genre TEXT NOT NULL, project_key TEXT NOT NULL,
  sent INTEGER NOT NULL, corrected_false INTEGER NOT NULL,
  corrected_missed INTEGER NOT NULL, published_at INTEGER NOT NULL,
  PRIMARY KEY(genre, project_key)) STRICT;
  -- AD-5: a replica, replaced per project by the fold's publish step

CREATE TABLE tuning(key TEXT NOT NULL, project_key TEXT, value TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('architecture_default','plan_seed','owner')),
  updated_at INTEGER NOT NULL) STRICT;
  -- scalar keys: one row per (key, project_key); list keys (lexicon.*,
  -- index.ext_to_grammar): one row per member

CREATE TABLE lessons(id TEXT PRIMARY KEY, statement TEXT NOT NULL,
  evidence_json TEXT,
  prov_kind TEXT NOT NULL CHECK(prov_kind IN
    ('repo_span','commit','human','mechanical','session')),
  prov_ref TEXT NOT NULL,
  trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
  injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT;
