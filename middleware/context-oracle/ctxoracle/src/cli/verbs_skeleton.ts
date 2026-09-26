// WALKING SKELETON (2026-09-25): thin versions of the Steps 32–35 verbs, in one
// file so the dispatch switch can reach them. The full build splits them into the
// plan's files (deinit.ts, export.ts, import.ts, status.ts, log.ts, tune.ts,
// correct.ts, note.ts) and adds what is marked missing below.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openRepo } from './context.js';
import { openStore } from '../stores/adapter.js';
import { schemaMetaDao } from '../stores/dao/schema_meta.js';
import { tuning } from '../stores/dao/tuning.js';
import { correctionsDao } from '../stores/dao/corrections.js';
import { humanFactsDao } from '../stores/dao/human_facts.js';
import { lessonsDao } from '../stores/dao/lessons.js';
import { foldWhisperStats } from '../diag/whisper_stats_fold.js';
import { recognizeQuestions } from '../qa/classify.js';
import { openQuestion } from '../qa/state.js';

const MARKER = /[\\/]dist[\\/]src[\\/]cli[\\/]dispatch\.js"? hook /;
const out = (s: string): void => {
  process.stdout.write(`${s}\n`);
};

function repoOrFail(): ReturnType<typeof openRepo> {
  const r = openRepo(process.cwd(), false);
  if (r === null) process.stderr.write('ctxoracle: this repository is not initialized — run `ctxoracle init`\n');
  return r;
}

export function statusVerb(): number {
  const r = repoOrFail();
  if (r === null) return 1;
  try {
    const p = r.project;
    const meta = schemaMetaDao(p);
    const n = (sql: string): number => (p.prepare(sql).get() as { n: number }).n;
    out(`repo key ${r.key.key} (${r.key.mode}: ${r.key.identity})`);
    out(`search: ${meta.get('fts_state') === 'fts5' ? 'full-text (FTS5)' : 'fallback (LIKE)'}`);
    out(`index: head ${meta.get('index_head') ?? 'none'}${meta.get('index_stale') === '1' ? ' — STALE' : ''}`);
    out(`files ${n('SELECT count(*) AS n FROM files')}, co-change pairs ${n('SELECT count(*) AS n FROM cochange_pairs')}, landmines ${n('SELECT count(*) AS n FROM landmines')}`);
    for (const g of p.prepare("SELECT genre, count(*) AS n FROM whisper_audit WHERE kind = 'whisper' GROUP BY genre").all() as { genre: string; n: number }[])
      out(`  whispers: ${g.genre} ${g.n}`);
    out(`denies issued ${n("SELECT count(*) AS n FROM whisper_audit WHERE kind = 'deny'")}; open questions ${n("SELECT count(*) AS n FROM questions WHERE status = 'open'")}`);
    for (const f of p.prepare('SELECT code, count(*) AS n FROM faults GROUP BY code ORDER BY n DESC').all() as { code: string; n: number }[])
      out(`  fault ${f.code}: ${f.n}`);
    // SKELETON: the hooks_not_firing detectors, rates and their labels, regret, and
    // the suppressing conditions are not rendered yet.
    return 0;
  } finally {
    r.project.close();
    r.global.close();
  }
}

export function logVerb(args: string[]): number {
  const r = repoOrFail();
  if (r === null) return 1;
  try {
    const limit = Number(args[0] ?? '20');
    for (const w of r.project.prepare('SELECT id, kind, genre, ts, text FROM whisper_audit ORDER BY ts DESC LIMIT ?').all(limit) as {
      id: string;
      kind: string;
      genre: string | null;
      ts: number;
      text: string;
    }[])
      out(`${new Date(w.ts).toISOString()} ${w.kind.padEnd(7)} ${w.id} ${w.text}`);
    return 0;
  } finally {
    r.project.close();
    r.global.close();
  }
}

export function tuneVerb(args: string[]): number {
  const r = repoOrFail();
  if (r === null) return 1;
  try {
    const [key, value] = args;
    if (key === undefined) {
      for (const row of r.global.prepare('SELECT key, value, source FROM tuning WHERE project_key IS NULL ORDER BY key').all() as {
        key: string;
        value: string;
        source: string;
      }[])
        out(`${row.key} = ${row.value} (${row.source})`);
      return 0;
    }
    if (value === undefined) {
      out(`${key} = ${tuning.get(r.global, key) ?? '(unset)'}`);
      return 0;
    }
    tuning.set(r.global, key, value, 'owner');
    out(`${key} = ${value}`);
    return 0;
  } finally {
    r.project.close();
    r.global.close();
  }
}

export function correctVerb(args: string[]): number {
  const r = repoOrFail();
  if (r === null) return 1;
  try {
    const mq = args.indexOf('--missed-question');
    if (mq >= 0) {
      const qs = recognizeQuestions(args[mq + 1] ?? '', [], { requireTerminalMark: false });
      for (const q of qs) {
        const res = openQuestion(r.project, { consumer: 'main', questionText: q.questionText, contentHash: q.contentHash });
        out(res === 'already_open' ? 'the question is already open and armed; nothing to change' : `opened question ${res}`);
      }
      return 0;
    }
    const id = args[0];
    const vi = args.indexOf('--verdict');
    const verdict = vi >= 0 ? args[vi + 1] : undefined;
    if (id === undefined || (verdict !== 'false_fire' && verdict !== 'missed' && verdict !== 'confirm')) {
      process.stderr.write('usage: ctxoracle correct <whisper-or-deny-id> --verdict false_fire|missed|confirm [--note "<text>"]\n');
      return 1;
    }
    const row = r.project.prepare('SELECT kind FROM whisper_audit WHERE id = ?').get(id) as { kind: string } | undefined;
    if (row === undefined) {
      process.stderr.write(`ctxoracle: no whisper or deny with id ${id} (see \`ctxoracle log\`)\n`);
      return 1;
    }
    const ni = args.indexOf('--note');
    correctionsDao(r.project).create({
      whisperId: row.kind === 'whisper' ? id : null,
      denyId: row.kind === 'deny' ? id : null,
      verdict,
      note: ni >= 0 ? (args[ni + 1] ?? null) : null,
      ts: Date.now(),
    });
    foldWhisperStats(r.global, r.project, r.key.key);
    out(`recorded ${verdict} for ${id}`);
    return 0;
  } finally {
    r.project.close();
    r.global.close();
  }
}

export function noteVerb(args: string[]): number {
  const r = repoOrFail();
  if (r === null) return 1;
  try {
    const human = { prov_kind: 'human' as const, prov_ref: 'ctxoracle note', trust: 'human' as const };
    if (args[0] === '--global') {
      lessonsDao(r.global).create({ statement: args[1] ?? '', prov: human });
      out('lesson recorded');
      return 0;
    }
    const fact = args[0] ?? '';
    const fi = args.indexOf('--file');
    const file = fi >= 0 ? args[fi + 1] : undefined;
    const ki = args.indexOf('--kind');
    const kind = ki >= 0 ? args[ki + 1] : undefined;
    if (kind === 'landmine' && file !== undefined) {
      // SKELETON: 1R — the `note --kind landmine` branch called the removed
      // `landmines.upsert` and is removed; retired by Step 35 (deletes the file)
      out('note --kind landmine: not built yet');
      return 1;
    }
    // SKELETON: --kind invariant / target_correction are not built.
    humanFactsDao(r.project).create({ statement: fact, targetKind: file === undefined ? 'repo' : 'file', targetRef: file ?? '', statedAt: Date.now(), prov: human });
    out('fact recorded');
    return 0;
  } finally {
    r.project.close();
    r.global.close();
  }
}

export function exportVerb(args: string[]): number {
  const r = repoOrFail();
  if (r === null) return 1;
  try {
    const dir = args[0];
    if (dir === undefined) return 1;
    mkdirSync(dir, { recursive: true });
    r.project.exportTo(path.join(dir, 'project.db'));
    r.global.exportTo(path.join(dir, 'global.db'));
    out(`exported to ${dir}`);
    return 0;
  } finally {
    r.project.close();
    r.global.close();
  }
}

export function importVerb(args: string[]): number {
  const r = openRepo(process.cwd(), false);
  const dir = args[0];
  if (r === null || dir === undefined) return 1;
  r.project.close();
  r.global.close();
  for (const [name, dest] of [
    ['project.db', r.layout.project],
    ['global.db', r.layout.global],
  ] as const) {
    const src = path.join(dir, name);
    const s = openStore(src);
    const ok = s.integrityCheck() === 'ok';
    s.close();
    if (!ok) {
      process.stderr.write(`ctxoracle: ${src} failed quick_check; nothing imported\n`);
      return 1;
    }
    if (existsSync(dest) && !args.includes('--replace')) {
      process.stderr.write(`ctxoracle: ${dest} exists; pass --replace to overwrite\n`);
      return 1;
    }
    copyFileSync(src, dest);
  }
  out('imported');
  return 0;
}

export function deinitVerb(): number {
  const r = openRepo(process.cwd(), false);
  const repoPath = r?.repoPath ?? process.cwd();
  r?.project.close();
  r?.global.close();
  const settingsPath = path.join(repoPath, '.claude', 'settings.json');
  if (!existsSync(settingsPath)) return 0;
  const settings = JSON.parse(readFileSync(settingsPath, 'utf8')) as { hooks?: Record<string, { hooks: { command: string }[] }[]> };
  for (const [ev, groups] of Object.entries(settings.hooks ?? {})) {
    const kept = groups.filter((g) => !g.hooks.some((h) => MARKER.test(h.command)));
    if (kept.length === 0) delete settings.hooks![ev];
    else settings.hooks![ev] = kept;
  }
  if (settings.hooks !== undefined && Object.keys(settings.hooks).length === 0) delete settings.hooks;
  // SKELETON: removing a settings.json / .claude/ that init created, and --purge,
  // are not built.
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  out('hooks removed');
  return 0;
}
