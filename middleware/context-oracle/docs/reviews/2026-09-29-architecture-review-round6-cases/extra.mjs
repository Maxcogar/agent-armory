// extra.mjs <work> — round-6 reviewer's added cases against the committed prototype (unchanged).
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, copyFileSync, realpathSync, existsSync } from 'node:fs';
import path from 'node:path';
const W = path.resolve(process.argv[2]);
const E = '/home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence';
const { resolveRepoKey } = await import(path.join(W, 'HEAD/middleware/context-oracle/ctxoracle/dist/src/identity/repo_key.js'));
const run = (home, repo) => { const env = { ...process.env }; delete env.GIT_DIR; delete env.GIT_WORK_TREE; delete env.REBUILD_KILL_AT;
  const r = spawnSync(process.execPath, ['--no-warnings', path.join(E, 'rebuild.mjs'), '--home', home, '--repo', repo, '--head', path.join(W, 'HEAD')], { env, encoding: 'utf8' });
  return { status: r.status, out: JSON.parse(r.stdout) }; };
const q = (p, s) => { const d = new DatabaseSync(p, { readOnly: true }); const r = d.prepare(s).all(); d.close(); return r; };
const keyOf = (repo) => resolveRepoKey(realpathSync(repo)).key;
// X1: an unread (other-layout) legacy file: what the purge's two counters see.
{
  const d = path.join(W, 'x1'); rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, 'oracleB'), d, { recursive: true });
  const k = keyOf(path.join(W, 'repoB')); const lp = path.join(d, 'projects', k, 'store.db');
  const x = new DatabaseSync(lp); x.exec('ALTER TABLE human_facts ADD COLUMN extra TEXT'); x.close();
  const r = run(d, path.join(W, 'repoB'));
  const np = path.join(d, 'projects', k, 'project.db');
  const rec = JSON.parse(q(np, "SELECT detail_json FROM faults WHERE code='store_rebuilt'")[0].detail_json);
  console.log('X1 exit', r.status, 'layout', rec.layout, 'unread', rec.unread,
    'legacy_unplaced', q(np, "SELECT value FROM schema_meta WHERE key='legacy_unplaced'")[0].value,
    'legacyCounts' in rec ? 'legacyCounts present' : 'legacyCounts absent',
    'legacy human_facts rows', q(lp, 'SELECT count(*) n FROM human_facts')[0].n,
    'new human_facts rows', q(np, 'SELECT count(*) n FROM human_facts')[0].n);
}
// X2: two repositories on one home, mixed layouts (global of the 4dd0f00/4e070ce layout from C,
// project stores of C and of B's b229c04 layout), plus an orphan store whose repository is gone.
{
  const d = path.join(W, 'x2'); rmSync(d, { recursive: true, force: true }); cpSync(path.join(W, 'oracleC'), d, { recursive: true });
  const kB = keyOf(path.join(W, 'repoX')), kC = keyOf(path.join(W, 'repoC'));
  cpSync(path.join(W, 'oracleB', 'projects', keyOf(path.join(W, 'repoB'))), path.join(d, 'projects', kB), { recursive: true });
  mkdirSync(path.join(d, 'projects', 'deadbeef0000'), { recursive: true });
  copyFileSync(path.join(W, 'oracleB', 'projects', keyOf(path.join(W, 'repoB')), 'store.db'), path.join(d, 'projects', 'deadbeef0000', 'store.db'));
  const rc = run(d, path.join(W, 'repoC'));
  const g = path.join(d, 'global/global-store.db');
  console.log('X2 after repoC:', rc.status, rc.out.map((o) => `${o.scope}:${o.state}:${o.layout}`).join(' '), 'pending', JSON.stringify(q(g, "SELECT key FROM global_meta WHERE key LIKE 'legacy_pending:%' ORDER BY key").map((r) => r.key)));
  const rb = run(d, path.join(W, 'repoX'));
  console.log('X2 after repoX:', rb.status, rb.out.map((o) => `${o.scope}:${o.state}:${o.layout ?? ''}`).join(' '), 'pending', JSON.stringify(q(g, "SELECT key FROM global_meta WHERE key LIKE 'legacy_pending:%' ORDER BY key").map((r) => r.key)),
    'bindings', q(g, "SELECT count(*) n FROM global_meta WHERE key LIKE 'repo_path:%'")[0].n);
  for (const [k, lab] of [[kB, 'B'], [kC, 'C']]) {
    const lp = path.join(d, 'projects', k, 'store.db'), np = path.join(d, 'projects', k, 'project.db');
    console.log(`X2 ${lab}: human_facts legacy ${q(lp, 'SELECT count(*) n FROM human_facts')[0].n} new ${q(np, 'SELECT count(*) n FROM human_facts')[0].n}; corrections legacy ${q(lp, 'SELECT count(*) n FROM corrections')[0].n} new ${q(np, 'SELECT count(*) n FROM corrections')[0].n}; questions legacy ${q(lp, 'SELECT count(*) n FROM questions')[0].n} new ${q(np, 'SELECT count(*) n FROM questions')[0].n}`);
  }
  console.log('X2 lessons legacy', q(path.join(d, 'global/global.db'), 'SELECT count(*) n FROM lessons')[0].n, 'new', q(g, 'SELECT count(*) n FROM lessons')[0].n);
}
