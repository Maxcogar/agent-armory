/** `ctxpack review <diff-file>` — review a patch against the package. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openContext, loadPackageFile, PKG_JSON, REVIEW_JSON, REVIEW_SARIF } from '../app-context.js';
import { PatchReviewer } from '../../core/services/patch-reviewer.js';
import { toSarif } from '../../adapters/sarif/sarif-writer.js';
import { checkStaleness } from '../../core/services/staleness.js';
import { AuditLog } from '../../security/audit-log.js';
import type { VerificationStatus } from '../../core/domain/review-finding.js';

export interface ReviewOpts { root?: string; package?: string; sarif?: boolean; verification?: VerificationStatus }

export async function runReview(diffFile: string, opts: ReviewOpts): Promise<number> {
  const ctx = openContext(opts.root);
  try {
    const pkgPath = opts.package ?? join(ctx.contextDir, PKG_JSON);
    const pkg = loadPackageFile(pkgPath);
    const diff = diffFile === '-' ? readFileSync(0, 'utf8') : readFileSync(diffFile, 'utf8');

    const result = new PatchReviewer(ctx.storage).review({ pkg, diff, verification: opts.verification ?? 'unknown' });

    const stale = checkStaleness(ctx.root, ctx.repoName, pkg);
    if (stale.stale) result.findings.push({ rule_id: 'staleness', severity: 'warning', message: `Package snapshot ${pkg.repository.snapshot_id} differs from current ${stale.currentSnapshotId}.`, path: null, start_line: null, end_line: null });

    ctx.validator.assertReview(result);
    ctx.storage.saveReview(result);
    new AuditLog(ctx.storage, 'cli').record('review', `id=${pkg.package_id} passed=${result.passed} findings=${result.findings.length}`);

    const jsonPath = join(ctx.contextDir, REVIEW_JSON);
    writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    if (opts.sarif) writeFileSync(join(ctx.contextDir, REVIEW_SARIF), JSON.stringify(toSarif(result), null, 2));

    console.log(result.passed ? '✅ Patch review passed (no errors).' : '❌ Patch review found blocking issues.');
    for (const f of result.findings) console.log(`  [${f.severity}] ${f.rule_id} ${f.path ?? ''} — ${f.message}`);
    console.log(`  wrote ${jsonPath}${opts.sarif ? ' (+ review.sarif)' : ''}`);
    return result.passed ? 0 : 1;
  } finally {
    ctx.storage.close();
  }
}
