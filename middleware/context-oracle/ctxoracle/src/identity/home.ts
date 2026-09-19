// Resolve the ctxoracle home directory (Step 4, AD-3). Everything the oracle
// persists lives under this one root: `<home>/global/` (shared across repos) and
// `<home>/projects/<repoKey>/` (per repo). The default is `~/.ctxoracle`;
// `CTXORACLE_HOME` overrides it (used by tests and by owners who relocate the
// store). This is the only place the default location is decided.

import os from 'node:os';
import path from 'node:path';

/** The ctxoracle home directory: `$CTXORACLE_HOME`, else `~/.ctxoracle`. */
export function ctxoracleHome(): string {
  const override = process.env.CTXORACLE_HOME;
  if (override !== undefined && override.length > 0) return override;
  return path.join(os.homedir(), '.ctxoracle');
}
