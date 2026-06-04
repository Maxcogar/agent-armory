/**
 * Patch-review findings (Spec FR16, PR1-PR5; Architecture D8).
 *
 * The internal model is richer than SARIF; the SARIF adapter (D8) maps these
 * without losing path, rule id, message, or severity (FR17).
 */
export type Severity = 'error' | 'warning' | 'note';

export type ReviewRule = string;

export interface ReviewFinding {
  rule_id: ReviewRule;
  severity: Severity;
  message: string;
  path: string | null;
  start_line: number | null;
  end_line: number | null;
}

export type VerificationStatus = 'run_passed' | 'run_failed' | 'not_run' | 'unknown' | 'waived';

export interface ReviewResult {
  package_id: string;
  repository_snapshot_id: string;
  reviewed_at: string;
  /** Overall gate: passed only when there are no error-severity findings. */
  passed: boolean;
  findings: ReviewFinding[];
  verification_status: VerificationStatus;
}
