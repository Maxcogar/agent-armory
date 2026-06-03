/**
 * Patch reviewer (Spec FR16, PR1-PR5; Architecture D8). Reviews a unified diff
 * against the Context Package and repository snapshot. Findings map cleanly to
 * SARIF (FR17). The gate fails (passed=false) on any error-severity finding.
 */
import type { Storage } from '../ports/storage.js';
import type { ContextPackage } from '../domain/context-package.js';
import type { ReviewFinding, ReviewResult, VerificationStatus } from '../domain/review-finding.js';
import { parseUnifiedDiff, type FileDiff } from './diff-parser.js';

export interface ReviewInput {
  pkg: ContextPackage;
  diff: string;
  verification?: VerificationStatus;
}

export class PatchReviewer {
  constructor(private storage: Storage) {}

  review({ pkg, diff, verification = 'unknown' }: ReviewInput): ReviewResult {
    const snap = pkg.repository.snapshot_id;
    const fileDiffs = parseUnifiedDiff(diff);
    const changed = new Set(fileDiffs.map((f) => f.path));
    const created = new Set(fileDiffs.filter((f) => f.created).map((f) => f.path));
    const relevant = new Set(pkg.relevant_files.map((f) => f.path));
    const allowedCreationTerms = pkg.context_gaps_allowed_to_create
      .flatMap((g) => g.description.toLowerCase().match(/[a-z0-9_]+/g) ?? [])
      .filter((w) => w.length > 3);
    const findings: ReviewFinding[] = [];

    // PR1 — diff scope: modified files outside the package and not freshly created.
    for (const fd of fileDiffs) {
      if (relevant.has(fd.path)) continue;
      if (created.has(fd.path) && matchesAllowedCreation(fd.path, allowedCreationTerms)) continue;
      findings.push(this.f('diff_scope', 'warning',
        `Modified file ${fd.path} is outside the package scope and not an allowed creation; justify via context expansion or human override.`, fd.path));
    }

    // FR16/PR1 — forbidden moves: modifying a generated/vendor boundary file.
    for (const fd of fileDiffs) {
      const file = this.storage.getFile(snap, fd.path);
      if (file && (file.boundary === 'generated' || file.boundary === 'vendor') && !fd.created) {
        findings.push(this.f('forbidden_move', 'error',
          `Patch modifies ${file.boundary} file ${fd.path}, which is a forbidden boundary.`, fd.path));
      }
    }

    // PR2 — required impact: a required target file that was not modified.
    for (const rf of pkg.relevant_files) {
      if (rf.required && rf.role === 'source' && !changed.has(rf.path)) {
        const isSeedTarget = rf.evidence.some((e) => e.relationship === 'task_target');
        findings.push(this.f('required_impact', isSeedTarget ? 'warning' : 'note',
          `Required ${isSeedTarget ? 'target' : 'related'} file ${rf.path} was not modified — confirm this is intentional.`, rf.path));
      }
    }

    // PR3 — pattern duplication: re-implementing a mechanism the package says is shared.
    const stateForbidden = pkg.forbidden_moves.find((m) => /provides state management|fork state|fork behaviou?r|second (parallel )?definition/i.test(m.description));
    if (stateForbidden) {
      for (const fd of fileDiffs) {
        if (fd.addedLines.some((l) => /\b(localStorage|sessionStorage)\b/.test(l))) {
          findings.push(this.f('pattern_duplication', 'warning',
            `${fd.path} adds direct storage access while the package marks an existing shared mechanism: "${stateForbidden.description}".`, fd.path));
        }
      }
    }

    // PR4 — unsupported assumption regression: added imports pointing at files that
    // are neither in the package nor created by this patch (a guessed dependency).
    for (const fd of fileDiffs) {
      for (const spec of importTargets(fd)) {
        const resolved = resolveAdded(fd.path, spec, changed, relevant);
        if (spec.startsWith('.') && !resolved) {
          findings.push(this.f('unsupported_assumption_regression', 'warning',
            `${fd.path} imports "${spec}", which is not in the package and not created by this patch — possible unsupported assumption.`, fd.path));
        }
      }
    }

    // PR5 — verification status.
    if (pkg.verification_guidance.commands.length > 0 && (verification === 'unknown' || verification === 'not_run')) {
      findings.push(this.f('verification', 'note',
        `Verification commands are known (${pkg.verification_guidance.commands.join(', ')}) but were reported as ${verification}.`, null));
    }

    const passed = !findings.some((f) => f.severity === 'error');
    return {
      package_id: pkg.package_id,
      repository_snapshot_id: snap,
      reviewed_at: new Date().toISOString(),
      passed,
      findings,
      verification_status: verification,
    };
  }

  private f(rule_id: ReviewFinding['rule_id'], severity: ReviewFinding['severity'], message: string, path: string | null): ReviewFinding {
    return { rule_id, severity, message, path, start_line: null, end_line: null };
  }
}

function importTargets(fd: FileDiff): string[] {
  const out: string[] = [];
  for (const l of fd.addedLines) {
    const js = l.match(/(?:import|from)\s+['"]([^'"]+)['"]/);
    if (js && js[1]) out.push(js[1]);
    const py = l.match(/^\s*from\s+([\w.]+)\s+import/);
    if (py && py[1]) out.push(py[1]);
  }
  return out;
}

function resolveAdded(fromPath: string, spec: string, changed: Set<string>, relevant: Set<string>): boolean {
  // Conservative: treat as resolved if any known/changed path shares the basename.
  const base = spec.split('/').pop()!.replace(/\.[a-z]+$/, '');
  for (const set of [changed, relevant]) {
    for (const p of set) if (p.includes(base)) return true;
  }
  return false;
}

function matchesAllowedCreation(path: string, terms: string[]): boolean {
  if (terms.length === 0) return false;
  const words = path.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
  return words.some((w) => terms.includes(w));
}
