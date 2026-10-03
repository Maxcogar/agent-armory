// The single source of truth for fault codes (Step 6, AD-17, AD-26). A readonly
// `as const` tuple — NOT a TypeScript `enum` — so the same declaration is both
// the runtime-enumerable list (`status` renders every code from it, T-6-1
// snapshots it) and the derived literal-union type. A `const enum` cannot be
// enumerated at runtime in-project (TS2475 on Object.values), and a regular
// `enum` would be a second runtime object that diverges from the tuple; one list
// is AD-17's rule.
//
// Every code the architecture and this plan name appears here, verbatim — the
// list of the Step 6 build delta (2026-09-26). The former plan-named
// `whisper_dropped_stale` is removed: AD-15/AD-17 name the rumor-rule drop
// `whisper_dropped_unverifiable` with `detail.reason`, which covers it.

export const FAULT_CODES = [
  // AD-17 — the enumerated diagnostic codes.
  'hooks_not_firing',
  'latency_breach',
  'store_corrupt',
  'index_stale',
  'produced_but_undelivered',
  'deny_after_answer_lag',
  'deny_despite_answer_text',
  'deny_loop',
  'deny_bypass_suspect',
  'catchup_incomplete',
  'intake_invalidated',
  'rebuild_recovered_nothing', // detail carries set: 'questions' | 'delivered' (AD-9, AD-16)
  'transcript_layout_changed',
  'unrecognized_user_entry',
  'repo_not_bound', // {cwd, root, reason: 'no_binding'|'store_missing'|'store_unreadable'} (+ {store, pathKind, errno})
  'whisper_dropped_unverifiable', // rumor-rule drop: {genre, subjectKey, reason: stale_pointer|not_in_tree|masked_path}
  'import_rejected', // {file, check: 'quick_check_failed'|'unopenable'|'partial_write'}
  // AD-17 — reserved: rendered by `status` as "not yet measured (Phase B/C)".
  'model_path_down',
  'missed_skill_block',
  // AD-26 — store contention give-up.
  'store_busy',
  // Codes this plan names (Step 6 build delta, 2026-09-26).
  'tuning_missing', // a tuning key read found no row (Step 12 re-seeds; key in detail)
  'head_unresolved', // HEAD ref neither loose nor packed (Step 14; not index_stale)
  'miner_unparsed_numstat', // a `-z --numstat` record the miner (Step 13) cannot parse
  'reindex_locked', // reindex refused: a live process holds the claim row (Step 14)
  'frontend_parse_failed', // tree-sitter parse threw; indexed via the generic frontend (Step 15)
  'history_rewritten', // G4: {oldWatermark, newHead}
  'path_not_utf8', // G7: {writer: 'miner'|'indexer', count, first} (first: <= 5 escapeBytes forms)
  'index_path_only_oversize', // G15: {path, bytes, lines, cap: 'bytes'|'lines'}
  'handler_exception', // G31: {errorClass, message (redacted), event}
] as const;

/** Every value the fault channel and `status` may use. Derived from the tuple. */
export type FaultCode = (typeof FAULT_CODES)[number];
