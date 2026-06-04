/**
 * SARIF 2.1.0 export (Spec FR17; Architecture D8). Maps internal ReviewFindings
 * to the OASIS SARIF 2.1.0 schema without losing file location, rule id,
 * message, or severity. SARIF is an export format, not the internal model.
 */
import type { ReviewResult, ReviewFinding, Severity } from '../../core/domain/review-finding.js';

const RULE_DESCRIPTIONS: Record<string, string> = {
  diff_scope: 'Modified file is outside the context package scope.',
  required_impact: 'A required file identified by the package was not addressed.',
  pattern_duplication: 'Patch duplicates an existing shared mechanism.',
  unsupported_assumption_regression: 'Patch relies on an unsupported assumption.',
  verification: 'Verification guidance was not confirmed.',
  forbidden_move: 'Patch performs a forbidden move.',
  staleness: 'Package is stale relative to the repository.',
};

function level(s: Severity): 'error' | 'warning' | 'note' {
  return s; // ctxpack severities are already the SARIF level vocabulary.
}

export function toSarif(result: ReviewResult): object {
  const ruleIds = [...new Set(result.findings.map((f) => f.rule_id))];
  return {
    version: '2.1.0',
    $schema: 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/cos02/schemas/sarif-schema-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'ctxpack',
            informationUri: 'https://ctxpack.dev',
            version: '0.1.0',
            rules: ruleIds.map((id) => ({
              id,
              shortDescription: { text: RULE_DESCRIPTIONS[id] ?? id },
            })),
          },
        },
        properties: {
          packageId: result.package_id,
          repositorySnapshotId: result.repository_snapshot_id,
          verificationStatus: result.verification_status,
          passed: result.passed,
        },
        results: result.findings.map((f) => sarifResult(f)),
      },
    ],
  };
}

function sarifResult(f: ReviewFinding) {
  const base: Record<string, unknown> = {
    ruleId: f.rule_id,
    level: level(f.severity),
    message: { text: f.message },
  };
  if (f.path) {
    base['locations'] = [
      {
        physicalLocation: {
          artifactLocation: { uri: f.path },
          ...(f.start_line
            ? { region: { startLine: f.start_line, ...(f.end_line ? { endLine: f.end_line } : {}) } }
            : {}),
        },
      },
    ];
  }
  return base;
}
