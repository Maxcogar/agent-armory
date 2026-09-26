// Per-language import resolvers (Step 15; AD-12; gap-list review G12, N8).
//
// A resolver classifies one captured import specifier of the file `fromPath`
// against the walked repository (`RepoFiles`, Step 14): `resolved` (an
// `import_edges` row to `dst`), `external` (the resolver's stated external
// rule), or `unresolved` (counted into `files.unresolved_imports`, so the
// per-language unresolved share tells "observed zero" from "never counted" —
// AD-12, CH H4). No resolver ever tries another language's extensions (review
// G12: the skeleton tried `.py` for TypeScript and `.ts` for Python).
//
// Every path here is a repository-relative POSIX path; a relative specifier
// whose target climbs above the repository root resolves to nothing.
import { builtinModules } from 'node:module';
import path from 'node:path';
import type { ImportResolution, RepoFiles } from './frontend.js';

/**
 * The identity of the resolver rules below: part of each resolving frontend's
 * `version` (Step 14 build review S1), so a rule change here re-parses every
 * file through the frontend fingerprint. Changed by hand with any rule.
 */
export const RESOLVER_RULES_VERSION = 'resolvers-s15.1';

const UNRESOLVED: ImportResolution = { kind: 'unresolved' };
const EXTERNAL: ImportResolution = { kind: 'external' };

/** Normalize `rel` against `fromPath`'s directory; null when it climbs above the repository root. */
function joinFrom(fromPath: string, rel: string): string | null {
  const joined = path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), rel));
  if (joined === '..' || joined.startsWith('../') || path.posix.isAbsolute(joined)) return null;
  return joined;
}

function firstPresent(candidates: readonly string[], repo: RepoFiles): ImportResolution {
  for (const c of candidates) if (repo.has(c)) return { kind: 'resolved', dst: c };
  return UNRESOLVED;
}

// ---------------------------------------------------------------------------
// TypeScript / JavaScript — TypeScript `moduleResolution: NodeNext` for
// relative specifiers; the `package.json` dependency fields and Node builtins
// for bare ones.

/** The TS/JS extensions a written specifier may carry (NodeNext resolves only to TS/JS files). */
const TS_JS_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);
/**
 * The TypeScript source extensions tried for a written JavaScript extension,
 * before the written path itself — TypeScript's order: a `.js` specifier
 * resolves to its `.ts` source when both exist (typescriptlang.org, Modules
 * Reference, "Module resolution" — relative paths and extension substitution).
 */
const SOURCE_FOR: Record<string, readonly string[]> = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts'],
};
/** Appended to an extensionless (or non-TS/JS-extension) specifier, then after `/index`. */
const APPENDED = ['.ts', '.tsx', '.js', '.jsx'];

const NODE_BUILTINS = new Set(builtinModules);

/** The package name of a bare specifier: `name` or `@scope/name`; null when it is neither. */
function packageName(spec: string): string | null {
  if (spec.startsWith('@')) {
    const m = /^(@[^/@\s]+\/[^/\s]+)/.exec(spec);
    return m === null ? null : (m[1] as string);
  }
  const first = spec.split('/')[0] as string;
  return first === '' ? null : first;
}

export function resolveTsImport(fromPath: string, specifier: string, repo: RepoFiles): ImportResolution {
  const relative = specifier === '.' || specifier === '..' || specifier.startsWith('./') || specifier.startsWith('../');
  if (relative) {
    // A trailing slash names a directory: only its index files can be meant.
    const dirOnly = specifier.endsWith('/');
    const base = joinFrom(fromPath, dirOnly ? specifier.slice(0, -1) || '.' : specifier);
    if (base === null) return UNRESOLVED;
    const index = APPENDED.map((e) => (base === '.' ? `index${e}` : `${base}/index${e}`));
    if (dirOnly || base === '.') return firstPresent(index, repo);
    const ext = path.posix.extname(base);
    if (TS_JS_EXTENSIONS.has(ext)) {
      const stem = base.slice(0, -ext.length);
      return firstPresent([...(SOURCE_FOR[ext] ?? []).map((e) => stem + e), base], repo);
    }
    // Extensionless, or a non-TS/JS extension (`./user.service`, `./py.py`):
    // appended extensions, then `/index.*` — never the written path itself.
    return firstPresent([...APPENDED.map((e) => base + e), ...index], repo);
  }
  if (specifier.startsWith('node:')) return EXTERNAL;
  const name = packageName(specifier);
  if (name === null) return UNRESOLVED; // e.g. `@/util`, a tsconfig path alias
  if (NODE_BUILTINS.has(name) || NODE_BUILTINS.has(specifier)) return EXTERNAL;
  return repo.nearestPackageJsonDeps(fromPath).has(name) ? EXTERNAL : UNRESOLVED;
}

// ---------------------------------------------------------------------------
// Python — PEP 328 relative imports; absolute dotted names against the
// repository root.

/** `a.b` under `dir` → `a/b.py`, then `a/b/__init__.py` (the empty module path → `dir/__init__.py`). */
function moduleCandidates(dir: string, dotted: string): string[] {
  const prefix = dir === '.' || dir === '' ? '' : `${dir}/`;
  if (dotted === '') return [`${prefix}__init__.py`];
  const mod = prefix + dotted.split('.').join('/');
  return [`${mod}.py`, `${mod}/__init__.py`];
}

export function resolvePythonImport(fromPath: string, specifier: string, repo: RepoFiles): ImportResolution {
  const dots = /^\.*/.exec(specifier)?.[0].length ?? 0;
  const rest = specifier.slice(dots);
  if (rest !== '' && !/^[\p{L}\p{N}_]+(\.[\p{L}\p{N}_]+)*$/u.test(rest)) return UNRESOLVED;
  if (dots > 0) {
    // n leading dots: the (n − 1)-th parent package of fromPath's directory.
    let dir = path.posix.dirname(fromPath);
    for (let i = 1; i < dots; i++) {
      if (dir === '.' || dir === '') return UNRESOLVED; // above the repository root
      dir = path.posix.dirname(dir);
    }
    return firstPresent(moduleCandidates(dir, rest), repo);
  }
  if (rest === '') return UNRESOLVED;
  // Python has no alias mechanism in the language: an absolute name that is
  // not a module under the repository root is the standard library or an
  // installed distribution (plan Step 15).
  const found = firstPresent(moduleCandidates('.', rest), repo);
  return found.kind === 'resolved' ? found : EXTERNAL;
}
