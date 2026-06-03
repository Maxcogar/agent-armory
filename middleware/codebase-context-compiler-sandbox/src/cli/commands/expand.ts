/** `ctxpack expand <request-file>` - FR14/AC4 context expansion. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openContext, loadPackageFile, PKG_JSON, PKG_MD } from '../app-context.js';
import { expandPackageContext } from '../../core/services/context-expansion.js';
import { renderPackageMarkdown } from '../../adapters/markdown/package-markdown-writer.js';
import { AuditLog } from '../../security/audit-log.js';
import type { ContextExpansionRequest } from '../../core/domain/context-expansion.js';

export interface ExpandOpts { root?: string; package?: string }

export async function runExpand(requestFile: string, opts: ExpandOpts): Promise<number> {
  const ctx = openContext(opts.root);
  try {
    const request = JSON.parse(readFileSync(requestFile, 'utf8').replace(/^\uFEFF/, '')) as ContextExpansionRequest;
    const reqValidation = ctx.validator.validateExpansionRequest(request);
    if (!reqValidation.valid) {
      console.error('Invalid expansion request:\n  ' + reqValidation.errors.join('\n  '));
      return 2;
    }

    const pkgPath = opts.package ?? join(ctx.contextDir, PKG_JSON);
    const pkg = loadPackageFile(pkgPath);
    ctx.validator.assertPackage(pkg);

    const result = expandPackageContext(ctx.storage, pkg, request);
    ctx.storage.saveExpansion(result);

    if (result.denial) {
      new AuditLog(ctx.storage, 'cli').record('expand-denied', `package=${pkg.package_id} reason="${result.denial.reason}"`);
      console.log(`Context expansion denied: ${result.denial.reason}`);
      if (result.denial.checked_paths.length) console.log(`Checked: ${[...new Set(result.denial.checked_paths)].join(', ')}`);
      return 1;
    }

    const updated = result.updated_package!;
    const validation = ctx.validator.validatePackage(updated);
    if (!validation.valid) {
      console.error('Expanded package failed schema validation:\n  ' + validation.errors.join('\n  '));
      return 1;
    }

    ctx.storage.savePackage(updated);
    writeFileSync(join(ctx.contextDir, PKG_JSON), JSON.stringify(updated, null, 2));
    writeFileSync(join(ctx.contextDir, PKG_MD), renderPackageMarkdown(updated));
    new AuditLog(ctx.storage, 'cli').record('expand', `from=${pkg.package_id} to=${updated.package_id} added=${result.added_files.map((f) => f.path).join(',')}`);

    console.log(`Context package expanded: ${pkg.package_id} -> ${updated.package_id}`);
    console.log(`Added files: ${result.added_files.map((f) => f.path).join(', ')}`);
    return 0;
  } finally {
    ctx.storage.close();
  }
}
