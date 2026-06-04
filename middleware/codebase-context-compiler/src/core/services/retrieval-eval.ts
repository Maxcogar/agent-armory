import type { ContextPackage } from '../domain/context-package.js';
import type { RuntimeDomain, TaskIntent } from '../domain/task.js';

export type EvalRubric =
  | 'precision'
  | 'recall'
  | 'diff_bounded'
  | 'failing_path'
  | 'precedent_contracts'
  | 'security_recall';

export interface RetrievalEvalCase {
  name: string;
  prompt: string;
  expectedIntent: TaskIntent;
  expectedDomains?: RuntimeDomain[];
  rubric: EvalRubric;
  mustHavePrimaryFiles: string[];
  acceptableSupportingFiles?: string[];
  noisyFiles?: string[];
  topN?: number;
  maxInjectedContextChars?: number;
  requiredFactPatterns?: RegExp[];
}

export interface RetrievalEvalResult {
  name: string;
  passed: boolean;
  score: number;
  failures: string[];
  metrics: Record<string, number>;
}

export function evaluateRetrieval(pkg: ContextPackage, testCase: RetrievalEvalCase): RetrievalEvalResult {
  const topN = testCase.topN ?? 3;
  const files = pkg.relevant_files.map((f) => f.path);
  const top = files.slice(0, topN);
  const failures: string[] = [];
  const metrics: Record<string, number> = {};

  if (pkg.task.intent !== testCase.expectedIntent) {
    failures.push(`intent ${pkg.task.intent} did not match expected ${testCase.expectedIntent}`);
  }
  if (testCase.expectedDomains?.length) {
    const missingDomains = testCase.expectedDomains.filter((d) => !pkg.task.domains.includes(d));
    if (missingDomains.length) failures.push(`missing expected domain(s): ${missingDomains.join(', ')}`);
  }

  const primaryHits = testCase.mustHavePrimaryFiles.filter((p) => top.includes(p));
  const packageHits = testCase.mustHavePrimaryFiles.filter((p) => files.includes(p));
  metrics.primary_precision_hits = primaryHits.length;
  metrics.required_recall_hits = packageHits.length;

  if (testCase.rubric === 'precision' || testCase.rubric === 'precedent_contracts') {
    for (const p of testCase.mustHavePrimaryFiles) {
      if (!top.includes(p)) failures.push(`required primary file not in top ${topN}: ${p}`);
    }
  } else {
    for (const p of testCase.mustHavePrimaryFiles) {
      if (!files.includes(p)) failures.push(`required file missing from package: ${p}`);
    }
  }

  for (const p of testCase.noisyFiles ?? []) {
    if (top.includes(p)) failures.push(`noisy file appeared in top ${topN}: ${p}`);
  }

  for (const pattern of testCase.requiredFactPatterns ?? []) {
    const found = pkg.known_facts.some((f) => pattern.test(f.statement))
      || pkg.relevant_files.some((f) => f.key_facts.some((fact) => pattern.test(fact)));
    if (!found) failures.push(`required fact pattern not found: ${pattern}`);
  }

  if (testCase.maxInjectedContextChars !== undefined) {
    const estimate = JSON.stringify({
      task: pkg.task,
      relevant_files: pkg.relevant_files.slice(0, 12),
      known_facts: pkg.known_facts.slice(0, 8),
      unknowns: pkg.unknowns.slice(0, 8),
    }).length;
    metrics.estimated_injected_context_chars = estimate;
    if (estimate > testCase.maxInjectedContextChars) {
      failures.push(`estimated injected context ${estimate} exceeds ${testCase.maxInjectedContextChars}`);
    }
  }

  const required = Math.max(1, testCase.mustHavePrimaryFiles.length);
  const recall = packageHits.length / required;
  const precision = primaryHits.length / required;
  const noisePenalty = (testCase.noisyFiles ?? []).filter((p) => top.includes(p)).length / Math.max(1, topN);
  const score = Math.max(0, Math.round((rubricScore(testCase.rubric, precision, recall) - noisePenalty) * 100) / 100);

  return {
    name: testCase.name,
    passed: failures.length === 0,
    score,
    failures,
    metrics,
  };
}

function rubricScore(rubric: EvalRubric, precision: number, recall: number): number {
  switch (rubric) {
    case 'recall':
    case 'security_recall':
      return recall * 0.8 + precision * 0.2;
    case 'diff_bounded':
    case 'failing_path':
      return recall * 0.6 + precision * 0.4;
    case 'precision':
    case 'precedent_contracts':
    default:
      return precision * 0.75 + recall * 0.25;
  }
}
