import { readFileSync } from 'node:fs';
import type { StaticAnalysisImporter } from '../../core/ports/static-analysis-importer.js';
import type { ReviewFinding } from '../../core/domain/review-finding.js';

export class SarifImporter implements StaticAnalysisImporter {
  readonly name = 'sarif';

  async importFindings(sourcePath: string): Promise<ReviewFinding[]> {
    const doc = JSON.parse(readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, ''));
    const findings: ReviewFinding[] = [];
    for (const run of doc.runs ?? []) {
      for (const result of run.results ?? []) {
        const loc = result.locations?.[0]?.physicalLocation;
        const uri = loc?.artifactLocation?.uri ? normalizePath(loc.artifactLocation.uri) : null;
        const region = loc?.region ?? {};
        findings.push({
          rule_id: String(result.ruleId ?? 'static_analysis'),
          severity: levelToSeverity(result.level),
          message: String(result.message?.text ?? result.message?.markdown ?? 'Static analysis finding'),
          path: uri,
          start_line: Number.isInteger(region.startLine) ? region.startLine : null,
          end_line: Number.isInteger(region.endLine) ? region.endLine : (Number.isInteger(region.startLine) ? region.startLine : null),
        });
      }
    }
    return findings;
  }
}

function normalizePath(path: string): string {
  return path.replace(/^file:\/+/, '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function levelToSeverity(level: unknown): ReviewFinding['severity'] {
  if (level === 'error') return 'error';
  if (level === 'warning') return 'warning';
  return 'note';
}
