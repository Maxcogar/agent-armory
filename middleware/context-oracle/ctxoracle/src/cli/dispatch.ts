#!/usr/bin/env node
// ctxoracle CLI entry point — the package's `bin` target (AD-25). A manual verb
// switch, no argument-parsing dependency. WALKING SKELETON: `hook`, `index` and
// `init` are registered; the remaining verbs are added by Steps 32–35.
import { hookVerb } from './hook.js';
import { indexVerb } from './index.js';
import { integrityCheckVerb } from './integrity_check.js';
import { initVerb } from './init.js';

async function main(argv: string[]): Promise<number> {
  const [verb, ...rest] = argv;
  switch (verb) {
    case 'hook':
      return rest[0] === 'integrity-check' ? integrityCheckVerb() : hookVerb(rest);
    case 'index':
      return indexVerb(rest);
    case 'init':
      return initVerb();
    default:
      process.stderr.write(`ctxoracle: unknown verb ${verb ?? '(none)'}\n`);
      return 1;
  }
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e: unknown) => {
    process.stderr.write(`ctxoracle: ${String(e)}\n`);
    process.exit(1);
  }
);
