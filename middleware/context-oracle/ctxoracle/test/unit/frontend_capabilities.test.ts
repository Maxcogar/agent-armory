// T-15-6 — Declared capability matches behaviour (Step 15; G13; AD-12, AC-1b).
//
// Integration: real `web-tree-sitter` and `tree-sitter-wasms` grammars, real
// `defaultFrontends(tuning)` over the seeded `index.ext_to_grammar` table; no
// doubles. Data: for each frontend `defaultFrontends` returns, a one-file
// sample in its language with one definition and one relative import of a
// sibling. Technique: equivalence partitioning (declared true / false).
//
// Every sample parses without an ERROR node under its pinned grammar
// (executed 2026-09-26, web-tree-sitter 0.25.10), so a missing symbol or
// import is the frontend's, not a malformed sample's. There is no `lua`
// sample: `lua` is out of the default table (§4, AD-12/L6 as corrected
// 2026-09-26), so a `lua` frontend in the list fails here as unsampled.
// Samples exist for every grammar the default table can name (the 31 of §4;
// `lua` is excluded and is a generic-frontend language) and for the generic
// frontend (`'*'`, a shell file), because which grammars
// get a `QUERIES` entry is the build's; a returned frontend with no sample
// here fails the test rather than passing unchecked.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openStore } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { defaultFrontends } from '../../src/index/frontends.js';
import { QUERIES } from '../../src/index/tree_sitter_frontend.js';

const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-capabilities-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));

/** One definition and one relative import of a sibling, per language (path, text). */
const SAMPLES: Record<string, [string, string]> = {
  c: ['sample.c', '#include "sibling.h"\n\nint answer(void) {\n  return 42;\n}\n'],
  c_sharp: ['Sample.cs', 'using Sibling;\n\nclass Sample {\n  int Answer() { return 42; }\n}\n'],
  cpp: ['sample.cpp', '#include "sibling.hpp"\n\nint answer() {\n  return 42;\n}\n'],
  css: ['sample.css', '@import "./sibling.css";\n\n.answer {\n  color: red;\n}\n'],
  dart: ['sample.dart', "import 'sibling.dart';\n\nint answer() {\n  return 42;\n}\n"],
  elisp: ['sample.el', "(require 'sibling)\n\n(defun answer ()\n  42)\n"],
  elixir: ['sample.ex', 'defmodule Sample do\n  import Sibling\n\n  def answer do\n    42\n  end\nend\n'],
  embedded_template: ['sample.erb', '<%= render "./sibling" %>\n<% def answer; 42; end %>\n'],
  go: ['sample.go', 'package sample\n\nimport "./sibling"\n\nfunc Answer() int {\n\treturn 42\n}\n'],
  html: ['sample.html', '<!doctype html>\n<html>\n<head><script src="./sibling.js"></script></head>\n<body><div id="answer"></div></body>\n</html>\n'],
  java: ['Sample.java', 'import sibling.Sibling;\n\nclass Sample {\n  int answer() { return 42; }\n}\n'],
  javascript: ['sample.js', "import { helper } from './sibling.js';\n\nexport function answer() {\n  return helper();\n}\n"],
  json: ['sample.json', '{\n  "$ref": "./sibling.json",\n  "answer": 42\n}\n'],
  kotlin: ['Sample.kt', 'import sibling.helper\n\nfun answer(): Int {\n    return 42\n}\n'],
  objc: ['sample.m', '#import "Sibling.h"\n\nint answer(void) {\n  return 42;\n}\n'],
  ocaml: ['sample.ml', 'open Sibling\n\nlet answer () = 42\n'],
  php: ['sample.php', "<?php\nrequire_once './sibling.php';\n\nfunction answer() {\n  return 42;\n}\n"],
  python: ['pkg/sample.py', 'from .sibling import helper\n\n\ndef answer():\n    return helper()\n'],
  rescript: ['Sample.res', 'open Sibling\n\nlet answer = () => 42\n'],
  ruby: ['sample.rb', "require_relative './sibling'\n\ndef answer\n  42\nend\n"],
  rust: ['sample.rs', 'mod sibling;\n\nfn answer() -> i32 {\n    42\n}\n'],
  scala: ['Sample.scala', 'import sibling.Helper\n\nobject Sample {\n  def answer(): Int = 42\n}\n'],
  solidity: ['Sample.sol', 'pragma solidity ^0.8.0;\n\nimport "./Sibling.sol";\n\ncontract Sample {\n  function answer() public pure returns (uint) { return 42; }\n}\n'],
  swift: ['Sample.swift', 'import Sibling\n\nfunc answer() -> Int {\n    return 42\n}\n'],
  // T-15-6 Data: SystemRDL's only file inclusion is the `` `include `` preprocessor directive,
  // which the shipped grammar does not parse (executed: an ERROR node), so the
  // sample carries the definition alone and no import can be captured.
  systemrdl: ['sample.rdl', 'addrmap answer {\n  reg { field {} f; } r;\n};\n'],
  tlaplus: ['Sample.tla', '---- MODULE Sample ----\nEXTENDS Sibling\n\nAnswer == 42\n====\n'],
  toml: ['sample.toml', 'include = "./sibling.toml"\n\n[answer]\nvalue = 42\n'],
  tsx: ['sample.tsx', "import { helper } from './sibling.js';\n\nexport function Answer() {\n  return <div>{helper()}</div>;\n}\n"],
  typescript: ['sample.ts', "import { helper } from './sibling.js';\n\nexport function answer(): number {\n  return helper();\n}\n"],
  vue: ['Sample.vue', "<template>\n  <div>{{ answer }}</div>\n</template>\n<script>\nimport Sibling from './Sibling.vue';\nexport default { name: 'Sample' };\n</script>\n"],
  zig: ['sample.zig', 'const sibling = @import("sibling.zig");\n\nfn answer() i32 {\n    return 42;\n}\n'],
  '*': ['sample.sh', '. ./sibling.sh\n\nanswer() {\n  echo 42\n}\n'],
};

/** Step 15's enumerated default `index.ext_to_grammar` grammars — the 31 of §4 (no `lua`). */
const TABLE_GRAMMARS = [
  'c', 'c_sharp', 'cpp', 'css', 'dart', 'elisp', 'elixir', 'embedded_template', 'go', 'html', 'java',
  'javascript', 'json', 'kotlin', 'objc', 'ocaml', 'php', 'python', 'rescript', 'ruby', 'rust', 'scala',
  'solidity', 'swift', 'systemrdl', 'tlaplus', 'toml', 'tsx', 'typescript', 'vue', 'zig',
];

test('T-15-6: every frontend defaultFrontends returns declares what it does', async () => {
  const global = openStore(path.join(root, 'global.db'));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  try {
    const reader = tuningReader(global, 'capabilities', () => {});
    const frontends = defaultFrontends(reader);
    assert.ok(frontends.length > 0, 'defaultFrontends returned no frontend');
    assert.equal(TABLE_GRAMMARS.length, 31);
    const seeded = [...new Set(reader.list('index.ext_to_grammar').map((m) => m.slice(m.indexOf('=') + 1)))].sort();
    assert.deepEqual(seeded, [...TABLE_GRAMMARS].sort(), 'the seeded index.ext_to_grammar table is not the 31-grammar table (lua excluded)');
    const outside = frontends.map((f) => f.lang).filter((l) => l !== '*' && !TABLE_GRAMMARS.includes(l));
    assert.deepEqual(outside, [], 'defaultFrontends returned a tree-sitter frontend for a grammar outside the 31-grammar table');
    const wrong: string[] = [];
    for (const fe of frontends) {
      if (fe.lang !== '*' && !(fe.lang in QUERIES)) wrong.push(`${fe.lang}: has a tree-sitter frontend but no QUERIES entry`);
      const sample = SAMPLES[fe.lang];
      if (sample === undefined) {
        wrong.push(`${fe.lang}: no sample in this test (add one)`);
        continue;
      }
      try {
        await fe.init();
      } catch (e) {
        wrong.push(`${fe.lang}: init rejected: ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
      const [file, text] = sample;
      const r = fe.parse(file, Buffer.from(text));
      if (!r.ok) {
        wrong.push(`${fe.lang}: parse failed: ${r.error}`);
        continue;
      }
      const { symbols, imports } = fe.capabilities;
      if (symbols && r.symbols.length === 0) wrong.push(`${fe.lang}: declares symbols: true but yields no symbol`);
      if (imports && r.imports.length === 0) wrong.push(`${fe.lang}: declares imports: true but yields no captured import`);
      if (imports && typeof fe.resolve !== 'function') wrong.push(`${fe.lang}: declares imports: true but lacks resolve`);
      if (!imports && r.imports.length > 0) wrong.push(`${fe.lang}: declares imports: false but yields ${JSON.stringify(r.imports.map((i) => i.specifier))}`);
    }
    assert.deepEqual(wrong, []);
  } finally {
    global.close();
  }
});
