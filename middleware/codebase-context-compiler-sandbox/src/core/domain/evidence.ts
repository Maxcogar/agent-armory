/**
 * EvidenceRef — the auditability primitive (Spec FR7, NFR1, §10).
 *
 * Every non-trivial factual claim in a Context Package must carry at least one
 * EvidenceRef so a human reviewer can trace where the fact came from. This is
 * the type that makes "no silent guessing" (FR24) enforceable: a claim with an
 * empty evidence array and no explicit unknown/assumption marker is, by
 * definition, unsupported.
 */
export type EvidenceSourceType =
  | 'file'
  | 'symbol'
  | 'static_analysis'
  | 'external_input'
  | 'human_override';

export interface EvidenceRef {
  source_type: EvidenceSourceType;
  /** Repository-relative path. Always present even for symbol/static_analysis. */
  path: string;
  symbol: string | null;
  start_line: number | null;
  end_line: number | null;
  /** e.g. "imports", "exports", "calls", "defines", "references", "tests". */
  relationship: string | null;
}
