// T-10-3 — the faults and session_log tables are written only through their two
// writers (Step 10, AD-17). Import scan over dist/src/**: every importer of a
// DAO must be within its allow-list. Reader modules named in §5.1 that do not
// exist yet are simply absent importers (the check is a subset, not equality).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

const FAULTS_ALLOW = ['diag/fault_writer.js', 'diag/status.js'];
const SESSION_ALLOW = ['diag/session_writer.js', 'diag/status.js', 'diag/log.js', 'diag/regret.js'];

function readOrEmpty(abs: string): string {
  try {
    return readFileSync(abs, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw e;
  }
}

/** Files under dist/src that import `dao/<daoFile>`, excluding the DAO itself. */
function importersOf(daoFile: string): string[] {
  const re = new RegExp(`['"][^'"]*dao/${daoFile.replace('.', '\\.')}['"]`);
  const hits: string[] = [];
  for (const rel of readdirSync(distSrc, { recursive: true })) {
    const relStr = String(rel);
    if (!relStr.endsWith('.js')) continue;
    const posix = relStr.split(path.sep).join('/');
    if (posix === `stores/dao/${daoFile}`) continue;
    if (re.test(readOrEmpty(path.join(distSrc, relStr)))) hits.push(posix);
  }
  return hits.sort();
}

test('T-10-3: faults.js and session_log.js are imported only by their allowed writers/readers', () => {
  for (const imp of importersOf('faults.js')) {
    assert.ok(FAULTS_ALLOW.includes(imp), `unexpected importer of faults.js: ${imp}`);
  }
  for (const imp of importersOf('session_log.js')) {
    assert.ok(SESSION_ALLOW.includes(imp), `unexpected importer of session_log.js: ${imp}`);
  }

  // A seeded rogue importer is detected.
  const seed = path.join(distSrc, '__seed_faults_importer.js');
  try {
    writeFileSync(seed, "import './stores/dao/faults.js';\n");
    const imps = importersOf('faults.js');
    assert.ok(imps.includes('__seed_faults_importer.js'), 'the seeded importer is detected');
    assert.equal(FAULTS_ALLOW.includes('__seed_faults_importer.js'), false, 'and is outside the allow-list');
  } finally {
    rmSync(seed, { force: true });
  }
});
