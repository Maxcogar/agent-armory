#!/usr/bin/env node
// ctxoracle CLI entry point — the package's `bin` target (AD-25).
//
// Step 1 ships this as a minimal, valid, buildable stub: it registers no verbs,
// does no work, and exits non-zero on any invocation. Nothing invokes it until
// Step 28, which extends this same file with the internal `hook`/`index` verbs;
// Steps 31–35 add the remaining verbs. The stub exists so the manifest's `bin`
// entry points at a file that is built from the first `npm run build`.
process.stderr.write('ctxoracle: no verbs are available yet\n');
process.exit(1);
