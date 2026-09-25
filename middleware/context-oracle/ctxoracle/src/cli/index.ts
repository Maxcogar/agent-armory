// `index [--full]` verb (Step 28): runIndex with the default frontends; also the
// detached reindex child the handler spawns on a stale SessionStart.
import { openRepo } from './context.js';
import { runIndex } from '../index/indexer.js';
import { defaultFrontends } from '../index/frontends.js';

export async function indexVerb(args: string[]): Promise<number> {
  const r = openRepo(process.cwd(), false);
  if (r === null) {
    process.stderr.write('ctxoracle: this repository is not initialized — run `ctxoracle init`\n');
    return 1;
  }
  try {
    const res = await runIndex(r.project, r.repoPath, {
      full: args.includes('--full'),
      frontends: defaultFrontends(r.global, r.layout.diagnostics),
      diagnosticsDir: r.layout.diagnostics,
      global: r.global,
    });
    process.stdout.write(`indexed ${res.filesIndexed} of ${res.filesSeen} files; ${res.mine?.commitsIncluded ?? 0} commits mined\n`);
    return res.refused === undefined ? 0 : 1;
  } finally {
    r.project.close();
    r.global.close();
  }
}
