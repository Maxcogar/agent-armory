/** `ctxpack check-plan <plan-file>` — assumption firewall over an agent plan. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openContext, loadPackageFile, PKG_JSON } from '../app-context.js';
import { AssumptionFirewall } from '../../core/services/assumption-firewall.js';
import { checkStaleness } from '../../core/services/staleness.js';
import { AuditLog } from '../../security/audit-log.js';

export interface CheckPlanOpts { root?: string; package?: string }

export async function runCheckPlan(planFile: string, opts: CheckPlanOpts): Promise<number> {
  const ctx = openContext(opts.root);
  try {
    const pkgPath = opts.package ?? join(ctx.contextDir, PKG_JSON);
    const pkg = loadPackageFile(pkgPath);
    const plan = readFileSync(planFile, 'utf8');

    const stale = checkStaleness(ctx.root, ctx.repoName, pkg);
    if (stale.stale) {
      console.error(`⚠️  Package is STALE (snapshot ${pkg.repository.snapshot_id} ≠ current ${stale.currentSnapshotId}). Regenerate before trusting this check.`);
    }

    const result = new AssumptionFirewall().check(pkg, plan);
    new AuditLog(ctx.storage, 'cli').record('check-plan', `id=${pkg.package_id} passed=${result.passed}`);

    const flagged = result.checks.filter((c) => c.verdict !== 'supported' && c.verdict !== 'allowed_creation');
    if (result.passed) {
      console.log(`✅ Plan passed the assumption firewall (${result.checks.length} claims checked).`);
    } else {
      console.log(`❌ Plan FAILED the assumption firewall:`);
      for (const c of flagged) console.log(`  L${c.claim.line} [${c.verdict}] ${c.offending_reference ?? ''} — ${c.reason}`);
    }
    return result.passed && !stale.stale ? 0 : 1;
  } finally {
    ctx.storage.close();
  }
}
