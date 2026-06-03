import type { ReviewFinding } from './review-finding.js';

export interface StaticAnalysisFinding extends ReviewFinding {
  snapshot_id: string;
  source: string;
}
