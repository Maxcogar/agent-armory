// T-5-3 — node:child_process single-importer convention (Step 5): only
// dist/src/util/spawn.js may import child_process, under either specifier
// spelling. Unlike the sqlite substring scan, this resolves import specifiers
// specifically (static `from`, side-effect, and dynamic `import()`), so a mere
// comment mentioning the module is not a false positive.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

const CP = "((?:node:)?child_process)";
const STATIC_FROM = new RegExp(`(?:^|[^.\\w])(?:import|export)\\b[^;'"]*?\\bfrom\\s*['"]${CP}['"]`);
const SIDE_EFFECT = new RegExp(`(?:^|[^.\\w])import\\s*['"]${CP}['"]`);
const DYNAMIC = new RegExp(`\\bimport\\s*\\(\\s*['"]${CP}['"]\\s*\\)`);

function importsChildProcess(src: string): boolean {
  return STATIC_FROM.test(src) || SIDE_EFFECT.test(src) || DYNAMIC.test(src);
}

/** Read a file, treating a mid-scan disappearance as empty: the sqlite
 *  convention test seeds/removes its own files in this same tree concurrently
 *  (node --test runs test files in parallel), so a foreign seed can vanish
 *  between readdir and read. Its content is orthogonal to ours anyway. */
function readOrEmpty(abs: string): string {
  try {
    return readFileSync(abs, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw e;
  }
}

function importers(): string[] {
  const hits: string[] = [];
  for (const rel of readdirSync(distSrc, { recursive: true })) {
    const relStr = String(rel);
    if (!relStr.endsWith('.js')) continue;
    if (importsChildProcess(readOrEmpty(path.join(distSrc, relStr)))) {
      hits.push(relStr.split(path.sep).join('/'));
    }
  }
  return hits.sort();
}

test('T-5-3: only util/spawn.js imports child_process; both spellings are detected', () => {
  assert.deepEqual(importers(), ['util/spawn.js']);

  const seedNode = path.join(distSrc, '__seed_cp_node.js');
  const seedBare = path.join(distSrc, '__seed_cp_bare.js');
  try {
    writeFileSync(seedNode, "import 'node:child_process';\n");
    writeFileSync(seedBare, "import 'child_process';\n");
    const withSeeds = importers();
    assert.ok(withSeeds.includes('__seed_cp_node.js'), "the 'node:child_process' spelling is detected");
    assert.ok(withSeeds.includes('__seed_cp_bare.js'), "the 'child_process' spelling is detected");
  } finally {
    rmSync(seedNode, { force: true });
    rmSync(seedBare, { force: true });
  }
  assert.deepEqual(importers(), ['util/spawn.js'], 'clean again after removing the seeds');
});
