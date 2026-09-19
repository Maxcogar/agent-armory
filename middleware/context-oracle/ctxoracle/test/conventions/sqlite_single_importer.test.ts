// T-3-2 — node:sqlite single-importer convention (Step 3): only
// dist/src/stores/adapter.js may contain the string `node:sqlite`.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

/** Read a file, treating a mid-scan disappearance as empty: the child_process
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

function importersOfNodeSqlite(): string[] {
  const hits: string[] = [];
  for (const rel of readdirSync(distSrc, { recursive: true })) {
    const relStr = String(rel);
    if (!relStr.endsWith('.js')) continue;
    const abs = path.join(distSrc, relStr);
    if (readOrEmpty(abs).includes('node:sqlite')) hits.push(relStr.split(path.sep).join('/'));
  }
  return hits.sort();
}

test('T-3-2: only stores/adapter.js imports node:sqlite; a seeded violation is detected', () => {
  assert.deepEqual(importersOfNodeSqlite(), ['stores/adapter.js']);

  const seed = path.join(distSrc, '__seed_sqlite_importer.js');
  try {
    writeFileSync(seed, "import 'node:sqlite';\n");
    assert.ok(
      importersOfNodeSqlite().includes('__seed_sqlite_importer.js'),
      'the scan must detect a second importer'
    );
  } finally {
    rmSync(seed, { force: true });
  }
  assert.deepEqual(importersOfNodeSqlite(), ['stores/adapter.js'], 'clean again after removing the seed');
});
