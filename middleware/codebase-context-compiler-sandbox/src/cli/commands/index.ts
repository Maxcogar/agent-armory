/** `ctxpack index [root]` — build/update the repository map. */
import { openContext } from '../app-context.js';

export async function runIndex(root: string | undefined): Promise<number> {
  const ctx = openContext(root);
  try {
    const r = await ctx.indexer.index(ctx.root, ctx.repoName, {
      excludes: ctx.config.excludes,
      maxBytes: ctx.config.maxBytes,
      staticAnalysis: ctx.config.staticAnalysis,
    });
    console.log(`Indexed ${ctx.repoName}: ${r.fileCount} files, ${r.symbolCount} symbols, ${r.edgeCount} edges.`);
    console.log(`Snapshot: ${r.snapshotId}`);
    if (r.gaps.length) console.log(`Capability gaps: ${r.gaps.length} (parsing was partial for some files).`);
    return 0;
  } finally {
    ctx.storage.close();
  }
}
