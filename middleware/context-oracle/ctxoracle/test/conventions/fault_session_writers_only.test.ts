// T-10-3 — the faults and session_log tables are written only through their two
// writers (Step 10, AD-17). Import scan over dist/src/**: every importer of a
// DAO must be within its allow-list. Reader modules named in §5.1 that do not
// exist yet are simply absent importers (the check is a subset, not equality).
//
// Reopened 2026-09-26 (T-10-3 as revised with Step 10's text): the session_log
// allow-list gains `dist/src/cli/correct.js` (the `--missed-question` target
// session is read from session_log, Step 34), and the seeded rogue importer is
// a temporary compiled *genre* file, as T-10-3's Data field states.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const distSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

const FAULTS_ALLOW = ['diag/fault_writer.js', 'diag/status.js'];
const SESSION_ALLOW = [
  'diag/session_writer.js',
  'diag/status.js',
  'diag/log.js',
  'diag/regret.js',
  'cli/correct.js',
];

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
  const seed = path.join(distSrc, 'genres', '__seed_faults_importer.js');
  try {
    writeFileSync(seed, "import '../stores/dao/faults.js';\n");
    const imps = importersOf('faults.js');
    assert.ok(imps.includes('genres/__seed_faults_importer.js'), 'the seeded genre importer is detected');
    assert.equal(FAULTS_ALLOW.includes('genres/__seed_faults_importer.js'), false, 'and is outside the allow-list');
  } finally {
    rmSync(seed, { force: true });
  }
});
