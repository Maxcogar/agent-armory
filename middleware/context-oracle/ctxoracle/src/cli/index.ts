// `index [--full]` verb (Step 28): runIndex with the default frontends; also the
// detached reindex child the handler spawns on a stale SessionStart.
import { openRepo } from './context.js';
import { runIndex } from '../index/indexer.js';
import { defaultFrontends } from '../index/frontends.js';
import { tuningReader } from '../stores/dao/tuning.js';
import { schemaMetaDao } from '../stores/dao/schema_meta.js';
import { recordFault } from '../diag/fault_writer.js';

/** sysexits.h EX_TEMPFAIL: a temporary failure, try again later (plan Step 28). */
const EX_TEMPFAIL = 75;

export async function indexVerb(args: string[]): Promise<number> {
  const r = openRepo(process.cwd(), false);
  if (r === null) {
    process.stderr.write('ctxoracle: this repository is not initialized — run `ctxoracle init`\n');
    return 1;
  }
  try {
    // SKELETON: 14 — the skeleton verb calls Step 14's runIndex with `tuning`
    // bound to (global store, repo key) and no `global` option, and narrows on
    // `'refused' in res` before reading the IndexResult; a refused run prints
    // Step 28's notice and exits 75 (plan §9 row "Step 14's skeleton callers");
    // retired by Step 28
    const diag = r.layout.diagnostics;
    const tuning = tuningReader(r.global, r.key.key, (k) => recordFault(r.project, diag, { code: 'tuning_missing', detail: { key: k } }));
    const res = await runIndex(r.project, r.repoPath, {
      full: args.includes('--full'),
      // Step 15 changed defaultFrontends to (tuning: TuningReader) — the shape
      // D-plan-29 and Steps 28/31 name for this call; only the argument moved.
      frontends: defaultFrontends(tuning),
      tuning,
      diagnosticsDir: diag,
    });
    if ('refused' in res) {
      const started = Number(schemaMetaDao(r.project).get('reindex_started_at') ?? NaN);
      const when = Number.isFinite(started) ? ` (started ${new Date(started).toISOString()})` : '';
      process.stdout.write(`ctxoracle: another index run is in progress${when}; nothing was changed — try again when it finishes\n`);
      return EX_TEMPFAIL;
    }
    process.stdout.write(`indexed ${res.filesWritten} of ${res.filesPresent} files; ${res.mine?.included ?? 0} commits mined\n`);
    return 0;
  } finally {
    r.project.close();
    r.global.close();
  }
}
