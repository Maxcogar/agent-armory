// Compile-time test helper (Step 1). Runs `tsc --noEmit` on a single fixture
// file — one of the must-fail fixtures under test/build/fixtures/, which the
// project build excludes — and returns the exit code plus diagnostics, so a
// compile-time test (T-9-2, T-11-5, T-24-1, T-24-3) can assert a non-zero exit
// whose diagnostics name the intended error.

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export interface TscFixtureResult {
  code: number;
  output: string;
}

// Compiled to dist/test/build/tsc_fixture.js, so three levels up is the package
// root (the directory holding package.json, node_modules/, and the fixtures).
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/**
 * Compile a single fixture with the same strict options the project build uses
 * (`--types node`, not `emscripten`, since these fixtures import nothing from
 * the tree-sitter runtime). `fixtureRelPath` is relative to the package root,
 * e.g. `test/build/fixtures/missing_provenance.ts`.
 */
export function compileFixture(fixtureRelPath: string): TscFixtureResult {
  const tsc = path.join(packageRoot, 'node_modules', '.bin', 'tsc');
  const fixture = path.join(packageRoot, fixtureRelPath);
  const args = [
    '--noEmit',
    '--strict',
    '--target', 'ES2022',
    '--module', 'NodeNext',
    '--moduleResolution', 'NodeNext',
    '--verbatimModuleSyntax',
    '--types', 'node',
    fixture,
  ];
  try {
    const output = execFileSync(tsc, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, output };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return {
      code: typeof e.status === 'number' ? e.status : 1,
      output: `${e.stdout ?? ''}${e.stderr ?? ''}`,
    };
  }
}
