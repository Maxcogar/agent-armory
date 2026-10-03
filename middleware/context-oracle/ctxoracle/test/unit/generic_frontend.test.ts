// T-15-2 — Generic frontend on a shell file (Step 15; AD-12, L6).
//
// Unit: the real `genericFrontend`; no doubles. Data: a `.sh` file with two
// functions, one in each shell function syntax (POSIX `name() { … }` and the
// `function name { … }` keyword form), plus a `source` line — the shell's
// import-shaped statement, which the generic frontend must not turn into an
// import. Technique: equivalence partitioning.
//
// Expected values come from Step 15's text: the generic frontend's
// identifier-shape regexes cover shell function syntax; it declares
// `imports: false` and returns no imports (so no `import_edges`/`symbol_refs`
// can follow from it); `capabilities` is `{symbols: true, imports: false}`.

import test from 'node:test';
import assert from 'node:assert/strict';
import { genericFrontend } from '../../src/index/generic_frontend.js';

const SH = ['#!/bin/sh', '. ./lib.sh', 'source ./other.sh', '', 'greet() {', '  echo hello', '}', '', 'function farewell {', '  echo bye', '}', ''].join('\n');

test('T-15-2: genericFrontend declares {symbols: true, imports: false}', () => {
  assert.deepEqual(genericFrontend.capabilities, { symbols: true, imports: false });
});

test('T-15-2: a .sh file with two functions yields both function-shape symbols and no import', async () => {
  await genericFrontend.init();
  const r = genericFrontend.parse('scripts/two.sh', Buffer.from(SH));
  assert.ok(r.ok, `the generic frontend failed to parse: ${r.ok ? '' : r.error}`);
  const names = r.symbols.map((s) => s.name);
  for (const expected of ['greet', 'farewell']) assert.ok(names.includes(expected), `symbol ${expected} is missing (got ${JSON.stringify(names)})`);
  assert.deepEqual(r.imports, [], 'the generic frontend emitted an import');
});
