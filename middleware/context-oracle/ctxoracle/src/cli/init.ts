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
    const res = await runIndex(r.project, r.repoPath, {
      full: true,
      frontends: defaultFrontends(r.global, r.layout.diagnostics),
      diagnosticsDir: r.layout.diagnostics,
      global: r.global,
    });
    process.stdout.write(
      `ctxoracle initialized: repo key ${r.key.key} (${r.key.mode}); ${res.filesIndexed} files indexed; ${res.mine?.commitsIncluded ?? 0} commits mined; hooks wired in ${settingsPath}\n`
    );
    return 0;
  } finally {
    r.project.close();
    r.global.close();
  }
}
