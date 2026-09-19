// Dependency-free test runner (Step 1, AD-24).
//
// Compiles-then-runs discipline: `tsc` emits every test to dist/; this runner
// enumerates the compiled *.test.js files and executes them with `node --test`.
// Because `node --test` exits 0 when its file list is empty, a glob that
// silently matched nothing would turn every "Fails when" clause in the plan's
// §12 into documentation. So this runner is the guard: for each tier it counts
// the *.test.ts sources against the compiled *.test.js and refuses to run — exit
// 1 — on any mismatch, and refuses to report success on a zero-total set.
//
// Default: the unit/build/conventions/build_time tiers (`npm test`).
// With --replay: the acceptance tier (`npm test -- --replay`), Steps 37–38.

import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const replay = process.argv.includes('--replay');

// Each tier: its subdirectory name under both `test/` (sources) and
// `dist/test/` (compiled output).
const tiers = replay
  ? ['replay']
  : ['unit', 'build', 'conventions', 'build_time'];

function listRecursive(dir, ext) {
  let entries;
  try {
    entries = readdirSync(dir, { recursive: true });
  } catch {
    return []; // directory does not exist yet — treated as an empty tier
  }
  return entries
    .map((e) => String(e))
    .filter((e) => e.endsWith(ext))
    .map((e) => path.join(dir, e));
}

const compiled = [];
for (const tier of tiers) {
  const sourceFiles = listRecursive(path.join(packageRoot, 'test', tier), '.test.ts');
  const compiledFiles = listRecursive(path.join(packageRoot, 'dist', 'test', tier), '.test.js');
  if (compiledFiles.length !== sourceFiles.length) {
    console.error(
      `run-tests: tier "${tier}" has ${sourceFiles.length} source *.test.ts but ` +
        `${compiledFiles.length} compiled *.test.js. Run \`npm run build\` before \`npm test\`.`
    );
    process.exit(1);
  }
  compiled.push(...compiledFiles);
}

if (compiled.length === 0) {
  console.error(
    'run-tests: no compiled test files were found — refusing to report success on ' +
      'an empty test set. Run `npm run build` first.'
  );
  process.exit(1);
}

try {
  execFileSync(process.execPath, ['--test', ...compiled], { stdio: 'inherit' });
} catch (err) {
  process.exit(typeof err?.status === 'number' ? err.status : 1);
}
