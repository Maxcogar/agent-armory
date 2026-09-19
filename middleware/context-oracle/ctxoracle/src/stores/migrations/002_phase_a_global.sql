-- 002_phase_a_global.sql — Phase A global store (Step 8, AD-5). The four
-- cross-project tables, STRICT, same type resolution as Step 7. `global_meta`
-- also holds the per-project fold watermarks (rows keyed
-- `whisper_stats_watermark:<repo-key>`). The `tuning` seed rows are written by
-- Step 12, not here. No `env_capabilities` (a Phase B writer's table).
--
-- PROV = the AD-4 provenance block, expanded inline (see 001).

CREATE TABLE global_meta(key TEXT PRIMARY KEY, value TEXT) STRICT;

CREATE TABLE whisper_stats(genre TEXT NOT NULL, project_key TEXT NOT NULL,
  sent INTEGER NOT NULL DEFAULT 0, corrected_false INTEGER NOT NULL DEFAULT 0,
  corrected_missed INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL, window_end INTEGER NOT NULL,
  PRIMARY KEY(genre, project_key, window_start)) STRICT;

CREATE TABLE tuning(key TEXT NOT NULL, project_key TEXT, value TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('architecture_default','plan_seed','owner')),
  updated_at INTEGER NOT NULL) STRICT;

CREATE TABLE lessons(id TEXT PRIMARY KEY, statement TEXT NOT NULL,
  evidence_json TEXT,
  prov_kind TEXT NOT NULL CHECK(prov_kind IN
    ('repo_span','commit','human','mechanical','session')),
  prov_ref TEXT NOT NULL,
  trust TEXT NOT NULL CHECK(trust IN ('untrusted_repo','human','mechanical')),
  injection_suspect INTEGER NOT NULL DEFAULT 0 CHECK(injection_suspect IN (0,1)),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL) STRICT;
