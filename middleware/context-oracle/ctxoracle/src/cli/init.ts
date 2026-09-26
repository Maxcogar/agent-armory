// `init` verb (Step 31, AD-20). WALKING SKELETON: prepares the stores, wires the
// eight hook entries into <repo>/.claude/settings.json (the one sanctioned
// in-tree write, D-9), and runs the first index. Keying-mode change detection,
// the settings-file creation markers and the pinned-interpreter check are not
// built yet.
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { assertRuntime } from '../util/env.js';
import { openRepo } from './context.js';
import { runIndex } from '../index/indexer.js';
import { defaultFrontends } from '../index/frontends.js';
import { schemaMetaDao } from '../stores/dao/schema_meta.js';
import { tuningReader } from '../stores/dao/tuning.js';
import { recordFault } from '../diag/fault_writer.js';

const EVENTS = ['UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PostToolUseFailure', 'Stop', 'SubagentStop', 'SessionStart', 'SessionEnd'];
const MARKER = /[\\/]dist[\\/]src[\\/]cli[\\/]dispatch\.js"? hook /;

export async function initVerb(): Promise<number> {
  assertRuntime(process.versions.node);
  const r = openRepo(process.cwd(), true);
  if (r === null) return 1;
  try {
    const dispatch = realpathSync(process.argv[1] as string);
    const settingsPath = path.join(r.repoPath, '.claude', 'settings.json');
    mkdirSync(path.dirname(settingsPath), { recursive: true });
    const settings = existsSync(settingsPath) ? (JSON.parse(readFileSync(settingsPath, 'utf8')) as Record<string, unknown>) : {};
    const hooks = (settings.hooks ?? {}) as Record<string, { hooks: { type: string; command: string; timeout: number }[] }[]>;
    for (const ev of EVENTS) {
      const command = `"${process.execPath}" "${dispatch}" hook ${ev}`;
      const kept = (hooks[ev] ?? []).filter((g) => !g.hooks.some((h) => MARKER.test(h.command)));
      hooks[ev] = [...kept, { hooks: [{ type: 'command', command, timeout: 5 }] }];
    }
    settings.hooks = hooks;
    writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
    schemaMetaDao(r.project).set('pinned_interpreter', process.execPath);
    // SKELETON: 14 — the skeleton verb calls Step 14's runIndex with `tuning`
    // bound to (global store, repo key) and no `global` option, and narrows on
    // `'refused' in res`; a refused run prints Step 31's notice (an index run is
    // already in progress, and when it started) and init still exits 0 (plan §9
    // row "Step 14's skeleton callers"); retired by Step 31
    const diag = r.layout.diagnostics;
    const tuning = tuningReader(r.global, r.key.key, (k) => recordFault(r.project, diag, { code: 'tuning_missing', detail: { key: k } }));
    const res = await runIndex(r.project, r.repoPath, {
      full: true,
      frontends: defaultFrontends(r.global, diag),
      tuning,
      diagnosticsDir: diag,
    });
    if ('refused' in res) {
      const started = Number(schemaMetaDao(r.project).get('reindex_started_at') ?? NaN);
      const when = Number.isFinite(started) ? ` (started ${new Date(started).toISOString()})` : '';
      process.stdout.write(
        `ctxoracle initialized: repo key ${r.key.key} (${r.key.mode}); hooks wired in ${settingsPath}; an index run is already in progress${when} and will produce the index\n`
      );
      return 0;
    }
    process.stdout.write(
      `ctxoracle initialized: repo key ${r.key.key} (${r.key.mode}); ${res.filesWritten} files indexed; ${res.mine?.included ?? 0} commits mined; hooks wired in ${settingsPath}\n`
    );
    return 0;
  } finally {
    r.project.close();
    r.global.close();
  }
}
