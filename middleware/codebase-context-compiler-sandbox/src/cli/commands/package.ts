/** `ctxpack package "<task>"` — generate the Context Package (JSON + Markdown). */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openContext, PKG_JSON, PKG_MD } from '../app-context.js';
import { buildPackage } from '../../core/services/package-builder.js';
import { renderPackageMarkdown } from '../../adapters/markdown/package-markdown-writer.js';
import { AuditLog } from '../../security/audit-log.js';

export interface PackageOpts { root?: string; budget?: number }

export async function runPackage(task: string, opts: PackageOpts): Promise<number> {
  if (!task || !task.trim()) { console.error('A task description is required.'); return 2; }
  const ctx = openContext(opts.root);
  try {
    const idx = await ctx.indexer.index(ctx.root, ctx.repoName, {
      excludes: ctx.config.excludes,
      maxBytes: ctx.config.maxBytes,
      staticAnalysis: ctx.config.staticAnalysis,
    });
    const snapshot = ctx.storage.getSnapshot(idx.snapshotId)!;
    const pkg = buildPackage(ctx.storage, snapshot, task, {
      injectionScanner: ctx.injectionScanner,
      tokenBudget: opts.budget ?? ctx.config.tokenBudget,
    });
    const validation = ctx.validator.validatePackage(pkg);
    if (!validation.valid) {
      console.error('Generated package failed schema validation:\n  ' + validation.errors.join('\n  '));
      return 1;
    }
    ctx.storage.savePackage(pkg);
    new AuditLog(ctx.storage, 'cli').record('package', `id=${pkg.package_id} snapshot=${pkg.repository.snapshot_id} task="${task}"`);

    const jsonPath = join(ctx.contextDir, PKG_JSON);
    const mdPath = join(ctx.contextDir, PKG_MD);
    writeFileSync(jsonPath, JSON.stringify(pkg, null, 2));
    writeFileSync(mdPath, renderPackageMarkdown(pkg));

    const sat = pkg.context_requirements.filter((c) => c.status === 'satisfied').length;
    console.log(`Context package generated for: "${pkg.task.normalized_task}"`);
    console.log(`  task types: ${pkg.task.task_types.join(', ')}`);
    console.log(`  relevant files: ${pkg.relevant_files.length} | requirements satisfied: ${sat}/${pkg.context_requirements.length}`);
    console.log(`  unknowns: ${pkg.unknowns.length} | forbidden moves: ${pkg.forbidden_moves.length} | flagged repo text: ${pkg.flagged_repository_text.length}`);
    if (pkg.token_budget.overflow) console.log(`  ⚠️ context exceeds token budget (${pkg.token_budget.estimated}/${pkg.token_budget.budget})`);
    console.log(`  wrote ${jsonPath}`);
    console.log(`  wrote ${mdPath}`);
    if (pkg.unresolved_decisions.length) console.log(`  ⚠️ ${pkg.unresolved_decisions.length} unresolved decision(s) require a human.`);
    return 0;
  } finally {
    ctx.storage.close();
  }
}
