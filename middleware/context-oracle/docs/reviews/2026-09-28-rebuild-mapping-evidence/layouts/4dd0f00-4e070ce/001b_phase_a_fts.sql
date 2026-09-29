-- 001b_phase_a_fts.sql (Step 7, AD-2, D-plan-28). Applied by the migration
-- runner ONLY when schema_meta.fts_state = 'fts5' (the row the runner records
-- from init's probeFts5 result). On 'fallback' this file is never run and the
-- search interface uses the indexed LIKE path.

CREATE VIRTUAL TABLE fts_symbols USING fts5(name, kind UNINDEXED,
  file_id UNINDEXED, tokenize = 'unicode61');
CREATE VIRTUAL TABLE fts_paths USING fts5(path, file_id UNINDEXED,
  tokenize = "unicode61 tokenchars '/_-.'");
