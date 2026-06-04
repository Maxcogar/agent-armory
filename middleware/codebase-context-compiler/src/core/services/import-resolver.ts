/**
 * Resolve an import specifier to a repository file path when possible.
 * Bare/external specifiers (e.g. "react", "os") resolve to null and are kept as
 * external-dependency edges; only resolvable edges are followed during graph
 * expansion so the package never invents a file that does not exist (FR24).
 */
import { posix } from 'node:path';

const JS_EXTS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];
const JS_INDEX = JS_EXTS.map((e) => `/index${e}`);

export function resolveImport(fromPath: string, spec: string, fileSet: ReadonlySet<string>): string | null {
  if (spec.startsWith('.')) {
    const base = posix.normalize(posix.join(posix.dirname(fromPath), spec)).replace(/^\.\//, '');
    return tryCandidates(base, fileSet, [...JS_EXTS, ...JS_INDEX]) ?? resolvePython(base, fromPath, spec, fileSet);
  }
  // Python relative imports begin with '.'; handled above. Dotted absolute
  // python module: best-effort map "pkg.mod" -> "pkg/mod.py".
  if (/^[a-zA-Z_][\w.]*$/.test(spec) && spec.includes('.')) {
    const base = spec.split('.').join('/');
    return tryCandidates(base, fileSet, ['.py', '.pyi', '/__init__.py']);
  }
  return null;
}

function tryCandidates(base: string, fileSet: ReadonlySet<string>, suffixes: string[]): string | null {
  if (fileSet.has(base)) return base;
  for (const s of suffixes) {
    const cand = base.endsWith('/') ? base.slice(0, -1) + s : base + s;
    if (fileSet.has(cand)) return cand;
  }
  return null;
}

function resolvePython(base: string, fromPath: string, spec: string, fileSet: ReadonlySet<string>): string | null {
  if (!fromPath.endsWith('.py') && !fromPath.endsWith('.pyi')) return null;
  return tryCandidates(base, fileSet, ['.py', '.pyi', '/__init__.py']);
}
