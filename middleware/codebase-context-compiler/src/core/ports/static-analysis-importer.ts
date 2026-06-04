/**
 * Static-analysis importer port (Spec FR17). Optional SARIF ingestion.
 */
import type { ReviewFinding } from '../domain/review-finding.js';

export interface StaticAnalysisImporter {
  readonly name: string;
  importFindings(sourcePath: string): Promise<ReviewFinding[]>;
}
