/**
 * Live filesystem grounding (the continuous-grounding core).
 *
 * Answers "is this edit grounded in what actually exists right now?" by checking
 * the LIVE filesystem — not a frozen index snapshot — so it stays correct as the
 * agent creates files during a session. No plan, no configuration, no babysitting.
 *
 * High-signal, low-false-positive checks:
 *   - ungrounded_import: a RELATIVE import whose target file does not exist on disk
 *     (and isn't the file being written) — i.e. importing something that isn't there.
 *   - forbidden_boundary: writing a generated/vendor/build-output file that should
 *     not be hand-edited.
 */
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export type GroundingKind = 'ungrounded_import' | 'forbidden_boundary';

export interface GroundingFinding {
  kind: GroundingKind;
  message: string;
  line: number | null;
}

const JS_EXTS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];
const PY_EXTS = ['.py', '.pyi'];
const CODE_EXT_RE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|py|pyi)$/i;

const FORBIDDEN_DIR_RE = /(^|\/)(dist|build|out|node_modules|vendor|third_party|\.next|coverage|__generated__|generated)\//i;
const FORBIDDEN_FILE_RE = /\.(min\.(js|css)|d\.ts)$|(^|\/)[\w.-]*\.generated\.[\w]+$/i;

interface ImportRef { spec: string; line: number }

function lineAt(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) if (content[i] === '\n') line++;
  return line;
}

function extractRelativeImports(content: string, isPython: boolean): ImportRef[] {
  const refs: ImportRef[] = [];
  if (isPython) {
    for (const m of content.matchAll(/^\s*from\s+(\.[\w.]*)\s+import\b/gm)) {
      if (m[1]) refs.push({ spec: m[1], line: lineAt(content, m.index ?? 0) });
    }
    return refs;
  }
  for (const m of content.matchAll(/(?:\bfrom|\bimport)\s+['"]([^'"]+)['"]/g)) {
    if (m[1]?.startsWith('.')) refs.push({ spec: m[1], line: lineAt(content, m.index ?? 0) });
  }
  for (const m of content.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (m[1]?.startsWith('.')) refs.push({ spec: m[1], line: lineAt(content, m.index ?? 0) });
  }
  return refs;
}

function resolvesOnDisk(root: string, fromFile: string, spec: string, isPython: boolean): boolean {
  const baseDir = dirname(resolve(root, fromFile));
  if (isPython) {
    // .models -> models, ..pkg.mod -> ../pkg/mod, . -> current package
    const rel = spec.replace(/^\.+/, (dots) => '../'.repeat(Math.max(0, dots.length - 1)) || './');
    const target = resolve(baseDir, rel.replace(/\./g, '/'));
    return [target, ...PY_EXTS.map((e) => target + e), join(target, '__init__.py')].some(existsSync);
  }
  const target = resolve(baseDir, spec);
  const cands = [
    target,
    ...JS_EXTS.map((e) => target + e),
    ...JS_EXTS.map((e) => join(target, 'index' + e)),
  ];
  return cands.some(existsSync);
}

/** Returns the absolute path's forbidden-boundary reason, or null. */
export function forbiddenBoundary(filePath: string): string | null {
  const p = filePath.replace(/\\/g, '/');
  if (FORBIDDEN_DIR_RE.test(p + '/')) return 'lives in a build-output/vendor/generated directory';
  if (FORBIDDEN_FILE_RE.test(p)) return 'is a generated/minified/declaration artifact';
  return null;
}

export function groundEditContent(root: string, filePath: string, content: string): GroundingFinding[] {
  const findings: GroundingFinding[] = [];

  const boundary = forbiddenBoundary(filePath);
  if (boundary) {
    findings.push({ kind: 'forbidden_boundary', message: `${filePath} ${boundary}; it should not be hand-edited.`, line: null });
  }

  if (CODE_EXT_RE.test(filePath) && content) {
    const isPython = /\.pyi?$/.test(filePath);
    for (const imp of extractRelativeImports(content, isPython)) {
      if (!resolvesOnDisk(root, filePath, imp.spec, isPython)) {
        findings.push({
          kind: 'ungrounded_import',
          message: `imports "${imp.spec}" but no such file exists on disk relative to ${filePath} — it may be hallucinated; create it or correct the path.`,
          line: imp.line,
        });
      }
    }
  }
  return findings;
}
