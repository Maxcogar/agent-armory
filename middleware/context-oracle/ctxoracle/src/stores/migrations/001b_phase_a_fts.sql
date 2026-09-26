-- 001b_phase_a_fts.sql (Step 7, AD-2, D-plan-28). Applied by the migration
-- runner ONLY when schema_meta.fts_state = 'fts5' (the row the runner records
-- from init's probeFts5 result). On 'fallback' this file is never run and the
-- search interface uses the symbol_tokens/path_tokens range path.
--
-- Both columns hold the in-house tokens (Step 14's tokenize) joined by one
-- space; the ascii tokenizer splits exactly there, because every non-ASCII
-- codepoint is a token character to it and the tokens hold no ASCII byte but
-- [a-z0-9] (AD-2: "the FTS path indexes those tokens").
CREATE VIRTUAL TABLE fts_symbols USING fts5(tokens, kind UNINDEXED,
  symbol_id UNINDEXED, file_id UNINDEXED, tokenize = "ascii");
CREATE VIRTUAL TABLE fts_paths USING fts5(tokens, file_id UNINDEXED,
  tokenize = "ascii");
