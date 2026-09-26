// The single source of tuning seed values + provenance (Step 12). Both
// `seedDefaults` and the tuning reader read this module, so no consuming module
// carries a number of its own. Every value names its provenance:
//   architecture_default — a value the architecture states (AD-14/AD-13/AD-9).
//   plan_seed           — a value the architecture leaves open and this plan
//                         chooses (§10 D-plan-7); printed by status and the exit
//                         report so every measurement is read as conditional on it.

export type TuningSource = 'architecture_default' | 'plan_seed' | 'owner';

export interface ScalarSeed {
  key: string;
  value: string;
  source: TuningSource;
}

export interface ListSeed {
  key: string;
  values: string[];
  source: TuningSource;
}

export const SCALAR_SEEDS: ScalarSeed[] = [
  // architecture_default (AD-14, AD-13, AD-9)
  { key: 'bar.confidence_floor', value: '0.6', source: 'architecture_default' },
  { key: 'bar.support_min', value: '3', source: 'architecture_default' },
  { key: 'bar.noise_floor_support_min', value: '2', source: 'architecture_default' },
  { key: 'bar.impact_read_min_coupled', value: '2', source: 'architecture_default' },
  { key: 'miner.max_transaction_entities', value: '30', source: 'architecture_default' },
  { key: 'miner.horizon_years', value: '5', source: 'architecture_default' },
  { key: 'miner.horizon_commits', value: '10000', source: 'architecture_default' },
  { key: 'miner.corpus_floor_commits', value: '30', source: 'architecture_default' },
  { key: 'deny.loop_threshold', value: '3', source: 'architecture_default' },
  // plan_seed (§10 D-plan-7)
  { key: 'bar.reuse_dominance_k', value: '3', source: 'plan_seed' },
  { key: 'deny.despite_answer_text_threshold', value: '3', source: 'plan_seed' },
  { key: 'qa.clear_length_floor_chars', value: '2', source: 'plan_seed' },
  { key: 'landmine.fix_chatter_k', value: '3', source: 'plan_seed' },
  { key: 'landmine.fix_chatter_window_days', value: '90', source: 'plan_seed' },
  { key: 'security.entropy_bits_per_char', value: '4.0', source: 'plan_seed' },
  { key: 'security.entropy_min_token_length', value: '20', source: 'plan_seed' },
  { key: 'qa.done_claim_trailing_turns_k', value: '3', source: 'plan_seed' },
  // The half-life h of AD-13's commit weights (the former bar.stale_index_factor
  // plan seed is superseded by the architecture's bar.stale_factor, below).
  { key: 'bar.recency_half_life_days', value: '365', source: 'plan_seed' },
  { key: 'diag.hooks_not_firing_gap_s', value: '600', source: 'plan_seed' },
  // Reopened 2026-09-26 (Step 12 build delta) — architecture_default scalars the
  // architecture states, each marked illustrative there (AD-14, AD-12, AD-26).
  // The gap-list review's bar.untrusted_confidence_cap is NOT seeded: AD-14
  // superseded it with the trust dampener.
  { key: 'bar.high_confidence_min', value: '0.8', source: 'architecture_default' },
  { key: 'bar.untrusted_trust_factor', value: '0.9', source: 'architecture_default' },
  { key: 'bar.suspect_confidence_cap', value: '0.7', source: 'architecture_default' },
  { key: 'bar.heuristic_confidence_cap', value: '0.7', source: 'architecture_default' },
  { key: 'bar.stale_factor', value: '0.9', source: 'architecture_default' },
  { key: 'bar.hazard_full_support', value: '3', source: 'architecture_default' },
  { key: 'reuse.max_unresolved_import_share', value: '0.05', source: 'architecture_default' },
  { key: 'miner.chunk_ms', value: '50', source: 'architecture_default' },
  // plan_seed: the score a marker-stem file adds to its import in-degree
  // (entry_score = in-degree + points); AD-12 names the markers but no weight.
  { key: 'index.entry_marker_points', value: '1', source: 'plan_seed' },
];

// The ext -> grammar table (32 grammars the pinned runtime loads and parses, §4).
// Each member is `<ext>=<grammar>`; elm/ql/yaml/bash are excluded by cause and
// fall to the generic frontend.
const EXT_TO_GRAMMAR: [string, string][] = [
  ['.c', 'c'], ['.h', 'c'],
  ['.cs', 'c_sharp'],
  ['.cc', 'cpp'], ['.cpp', 'cpp'], ['.cxx', 'cpp'], ['.hpp', 'cpp'], ['.hh', 'cpp'],
  ['.css', 'css'],
  ['.dart', 'dart'],
  ['.el', 'elisp'],
  ['.ex', 'elixir'], ['.exs', 'elixir'],
  ['.erb', 'embedded_template'], ['.ejs', 'embedded_template'],
  ['.go', 'go'],
  ['.html', 'html'], ['.htm', 'html'],
  ['.java', 'java'],
  ['.js', 'javascript'], ['.mjs', 'javascript'], ['.cjs', 'javascript'], ['.jsx', 'javascript'],
  ['.json', 'json'],
  ['.kt', 'kotlin'], ['.kts', 'kotlin'],
  ['.lua', 'lua'],
  ['.m', 'objc'], ['.mm', 'objc'],
  ['.ml', 'ocaml'], ['.mli', 'ocaml'],
  ['.php', 'php'],
  ['.py', 'python'], ['.pyi', 'python'],
  ['.res', 'rescript'], ['.resi', 'rescript'],
  ['.rb', 'ruby'],
  ['.rs', 'rust'],
  ['.scala', 'scala'], ['.sc', 'scala'],
  ['.sol', 'solidity'],
  ['.swift', 'swift'],
  ['.rdl', 'systemrdl'],
  ['.tla', 'tlaplus'],
  ['.toml', 'toml'],
  ['.tsx', 'tsx'],
  ['.ts', 'typescript'], ['.mts', 'typescript'], ['.cts', 'typescript'],
  ['.vue', 'vue'],
  ['.zig', 'zig'],
];

export const LIST_SEEDS: ListSeed[] = [
  {
    key: 'lexicon.stoplist',
    source: 'plan_seed',
    values: [
      'why is CI always so flaky?',
      'who knows?',
      'what could go wrong?',
      'right?',
      'you know?',
      "isn't it?",
      'see?',
      'ok?',
    ],
  },
  {
    key: 'lexicon.deferral_stoplist',
    source: 'plan_seed',
    values: [
      "i'll get to that",
      'i will get to that',
      "i'll come back to",
      "i'll get back to you",
      'will look into that',
      'first let me',
      'before i answer',
    ],
  },
  {
    key: 'lexicon.deferral_filler',
    source: 'plan_seed',
    values: [
      'later', 'soon', 'now', 'next', 'then', 'first', 'shortly', 'afterwards',
      'momentarily', 'moment', 'sec', 'second', 'minute', 'bit', 'while', 'i',
      'we', 'you', 'it', 'that', 'this', 'them', 'one', 'a', 'an', 'the', 'on',
      'to', 'in', 'for', 'not', 'yet', 'just',
    ],
  },
  {
    key: 'lexicon.command_class_test_runners',
    source: 'plan_seed',
    values: [
      'npm test', 'npm run test', 'pnpm test', 'yarn test', 'pytest', 'cargo test',
      'go test', 'jest', 'mocha', 'vitest', 'node --test',
    ],
  },
  {
    key: 'lexicon.command_class_innocuous',
    source: 'plan_seed',
    values: [
      'ls', 'cd', 'cat', 'pwd', 'echo', 'git status', 'git log', 'git diff',
      'grep', 'rg', 'find', 'head', 'tail', 'wc',
    ],
  },
  {
    key: 'lexicon.completion_claim',
    source: 'plan_seed',
    values: ['done', 'complete', 'completed', 'implemented', 'fixed', 'finished'],
  },
  {
    key: 'index.ext_to_grammar',
    source: 'architecture_default',
    values: EXT_TO_GRAMMAR.map(([ext, grammar]) => `${ext}=${grammar}`),
  },
  // Reopened 2026-09-26 (Step 12 build delta) — architecture_default lists.
  {
    key: 'lexicon.fix_keywords', // AD-15, G1
    source: 'architecture_default',
    values: ['fix', 'fixes', 'fixed', 'fixing', 'bug', 'bugfix', 'hotfix'],
  },
  {
    key: 'lexicon.test_path_patterns', // AD-12, N13
    source: 'architecture_default',
    values: ['**/*.test.*', '**/*.spec.*', '**/test_*.py', '**/*_test.go', '**/__tests__/**', 'test/**', 'tests/**'],
  },
  {
    key: 'lexicon.test_same_dir_languages', // AD-12
    source: 'architecture_default',
    values: ['go'],
  },
  {
    key: 'lexicon.entry_marker_stems', // AD-12's path-convention markers (no route registration)
    source: 'architecture_default',
    values: ['main', 'index', 'cli', 'app'],
  },
];
