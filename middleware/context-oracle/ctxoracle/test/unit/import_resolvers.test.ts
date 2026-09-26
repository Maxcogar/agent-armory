// T-15-5 — Import resolvers: the classification table (Step 15; G12, N8;
// AD-12; PEP 328; TypeScript NodeNext module resolution).
//
// Unit over a `RepoFiles` fake (Meszaros) built from a literal path list and a
// `package.json` dependency set — justified because the resolvers' contract is
// pure over that interface, and Step 14's real one is exercised by T-15-3.
// Technique: decision table; every cell is the spec's Data field verbatim.

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTsImport, resolvePythonImport } from '../../src/index/resolvers.js';
import type { ImportResolution, RepoFiles } from '../../src/index/frontend.js';

/**
 * `RepoFiles.hasTopLevelModule` over a literal path list, by the rule Step 15
 * states: some path is `<dir>/<name>.py`, or has a directory segment `<name>`
 * with a `.py` file beneath it.
 */
function hasTopLevelModuleIn(paths: Iterable<string>, name: string): boolean {
  for (const p of paths) {
    if (!p.endsWith('.py')) continue;
    const segs = p.split('/');
    if (segs[segs.length - 1] === `${name}.py`) return true;
    if (segs.slice(0, -1).includes(name)) return true;
  }
  return false;
}

/** The fake: the files the table names as existing, and `react` as the one declared dependency. */
function repoFiles(paths: string[], deps: string[]): RepoFiles {
  const set = new Set(paths);
  const depSet: ReadonlySet<string> = new Set(deps);
  return { has: (p) => set.has(p), nearestPackageJsonDeps: () => depSet, hasTopLevelModule: (name) => hasTopLevelModuleIn(set, name) };
}

const TS_REPO = repoFiles(['package.json', 'src/a.ts', 'src/b.ts', 'src/c.tsx', 'src/d/index.ts', 'src/e.mts', 'src/py.py'], ['react']);

const TS_TABLE: [string, ImportResolution][] = [
  ['./b.js', { kind: 'resolved', dst: 'src/b.ts' }],
  ['./c', { kind: 'resolved', dst: 'src/c.tsx' }],
  ['./d', { kind: 'resolved', dst: 'src/d/index.ts' }],
  ['./e.mjs', { kind: 'resolved', dst: 'src/e.mts' }],
  ['react', { kind: 'external' }],
  ['node:fs', { kind: 'external' }],
  ['path', { kind: 'external' }],
  ['@/util', { kind: 'unresolved' }],
  ['lodash', { kind: 'unresolved' }],
  ['./missing', { kind: 'unresolved' }],
  ['./py.py', { kind: 'unresolved' }],
];

// `pkg/sub/m2.ts` is present so a resolver that tried `.ts` for `.m2` would
// resolve it, and the `.m2` cell would catch it (T-15-5 Data).
const PY_REPO = repoFiles(['pkg/sub/u.py', 'pkg/sub/m.py', 'pkg/n/__init__.py', 'pkg/sub/m2.ts'], []);

const PY_TABLE: [string, ImportResolution][] = [
  ['.m', { kind: 'resolved', dst: 'pkg/sub/m.py' }],
  ['..n', { kind: 'resolved', dst: 'pkg/n/__init__.py' }],
  ['.missing', { kind: 'unresolved' }],
  ['os', { kind: 'external' }],
  ['pkg.sub.m', { kind: 'resolved', dst: 'pkg/sub/m.py' }],
  ['.m2', { kind: 'unresolved' }],
];

// Ancestor lookup (T-15-5 Data, plan d616f1f): an absolute name is looked up
// from the importer's directory up to the repository root, nearest first;
// with no hit it is external only when no in-repo module has its top-level
// name, otherwise unresolved. Importer `tools/sub/run.py`.
const PY_ANCESTOR_REPO = repoFiles(['tools/sub/run.py', 'tools/helpers/x.py', 'tools/sub/local.py'], []);

const PY_ANCESTOR_TABLE: [string, ImportResolution][] = [
  ['helpers.x', { kind: 'resolved', dst: 'tools/helpers/x.py' }], // found at the ancestor tools/, not the root
  ['local', { kind: 'resolved', dst: 'tools/sub/local.py' }], // the importer's own directory first
  ['json', { kind: 'external' }], // no in-repo json module
  ['tools.missing', { kind: 'unresolved' }], // tools/ is the repository's own; no missing module under any ancestor
];

function wrongCells(resolve: (from: string, spec: string, repo: RepoFiles) => ImportResolution, from: string, repo: RepoFiles, table: [string, ImportResolution][]): string[] {
  const wrong: string[] = [];
  for (const [spec, expected] of table) {
    let got: ImportResolution | string;
    try {
      got = resolve(from, spec, repo);
    } catch (e) {
      got = `threw ${e instanceof Error ? e.message : String(e)}`;
    }
    if (JSON.stringify(got) !== JSON.stringify(expected)) wrong.push(`${from} ${JSON.stringify(spec)}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`);
  }
  return wrong;
}

test('T-15-5: resolveTsImport from src/a.ts classifies every cell of the table', () => {
  assert.deepEqual(wrongCells(resolveTsImport, 'src/a.ts', TS_REPO, TS_TABLE), []);
});

test('T-15-5: resolvePythonImport from pkg/sub/u.py classifies every cell of the table (never a .ts file)', () => {
  assert.deepEqual(wrongCells(resolvePythonImport, 'pkg/sub/u.py', PY_REPO, PY_TABLE), []);
});

for (const [spec, expected] of PY_ANCESTOR_TABLE) {
  test(`T-15-5 (ancestor lookup cell): ${spec} from tools/sub/run.py → ${JSON.stringify(expected)}`, () => {
    assert.deepEqual(resolvePythonImport('tools/sub/run.py', spec, PY_ANCESTOR_REPO), expected);
  });
}
