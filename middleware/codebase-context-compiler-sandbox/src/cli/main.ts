#!/usr/bin/env node
/**
 * ctxpack CLI entry point (sandbox build).
 * Commands: init, index, package, expand, override, check-plan, review, run-agent.
 *
 * This build stores its index with Node's built-in `node:sqlite`, which emits
 * an `ExperimentalWarning` the moment the builtin is loaded by the ESM module
 * loader. To keep that notice out of stderr (it is otherwise printed on every
 * CLI run and every Claude Code hook invocation), the warning filter is the
 * only thing imported statically; the command wiring — which transitively
 * imports `node:sqlite` — is loaded dynamically afterwards so the filter is in
 * place before the builtin is translated.
 */
import './suppress-experimental-warnings.js';

import('./program.js')
  .then((m) => m.run())
  .catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
