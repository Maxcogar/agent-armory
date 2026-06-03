/** `ctxpack override <override-file>` - apply a human reviewer override. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openContext, loadPackageFile, PKG_JSON, PKG_MD } from '../app-context.js';
import { applyHumanOverride } from '../../core/services/human-override.js';
import { renderPackageMarkdown } from '../../adapters/markdown/package-markdown-writer.js';
import { AuditLog } from '../../security/audit-log.js';
import type { HumanOverrideRequest } from '../../core/domain/human-override.js';

export interface OverrideOpts { root?: string; package?: string }

export async function runOverride(overrideFile: string, opts: OverrideOpts): Promise<number> {
  const ctx = openContext(opts.root);
  try {
    const request = JSON.parse(readFileSync(overrideFile, 'utf8').replace(/^\uFEFF/, '')) as HumanOverrideRequest;
    const overrideValidation = ctx.validator.validateHumanOverride(request);
    if (!overrideValidation.valid) {
      console.error('Invalid human override:\n  ' + overrideValidation.errors.join('\n  '));
      return 2;
    }

    const pkgPath = opts.package ?? join(ctx.contextDir, PKG_JSON);
    const pkg = loadPackageFile(pkgPath);
    ctx.validator.assertPackage(pkg);

    const updated = applyHumanOverride(ctx.storage, pkg, request);
    const validation = ctx.validator.validatePackage(updated);
    if (!validation.valid) {
      console.error('Overridden package failed schema validation:\n  ' + validation.errors.join('\n  '));
      return 1;
    }

    ctx.storage.savePackage(updated);
    writeFileSync(join(ctx.contextDir, PKG_JSON), JSON.stringify(updated, null, 2));
    writeFileSync(join(ctx.contextDir, PKG_MD), renderPackageMarkdown(updated));
    new AuditLog(ctx.storage, 'cli').record('override', `from=${pkg.package_id} to=${updated.package_id} action=${request.action}`);

    console.log(`Human override applied: ${pkg.package_id} -> ${updated.package_id}`);
    console.log(`Action: ${request.action}`);
    return 0;
  } finally {
    ctx.storage.close();
  }
}
