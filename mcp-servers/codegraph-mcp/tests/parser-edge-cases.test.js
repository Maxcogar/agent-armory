"use strict";

// Regression tests for parser bugs found by empirically running the parsers
// (2026-05-30 audit), not by reading the source. Each test reproduces a bug
// that the source previously got wrong.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { parsePythonDependencies } = require("../dist/parsers/python.js");
const { parseJavaScriptDependencies } = require("../dist/parsers/javascript.js");
const {
  parseCppDependencies,
  collectCppSearchDirs,
} = require("../dist/parsers/cpp.js");

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-edge-"));
}
function w(root, rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}
function rels(root, abs) {
  return abs.map((a) => path.relative(root, a)).sort();
}

// --- Python ---

test("python: consecutive 'import' statements are all captured", () => {
  // Previously: the directImport regex char class included \s (matches \n),
  // so a single `import` swallowed every following line and resolved to [].
  const root = tmp();
  w(root, "a.py", "");
  w(root, "b.py", "");
  w(root, "c.py", "");
  const main = w(root, "main.py", "import a\nimport b\nimport c\n");
  assert.deepEqual(rels(root, parsePythonDependencies(main, root)), [
    "a.py",
    "b.py",
    "c.py",
  ]);
});

test("python: 'import a, b' on one line still works", () => {
  const root = tmp();
  w(root, "a.py", "");
  w(root, "b.py", "");
  const main = w(root, "main.py", "import a, b\n");
  assert.deepEqual(rels(root, parsePythonDependencies(main, root)), [
    "a.py",
    "b.py",
  ]);
});

test("python: 'import a as alias' resolves to a", () => {
  const root = tmp();
  w(root, "a.py", "");
  const main = w(root, "main.py", "import a as alias\n");
  assert.deepEqual(rels(root, parsePythonDependencies(main, root)), ["a.py"]);
});

test("python: indented (conditional) imports are captured", () => {
  // try/except ImportError fallbacks are extremely common; the old anchored
  // ^import / ^from regexes missed anything indented.
  const root = tmp();
  w(root, "fast.py", "");
  w(root, "slow.py", "");
  const main = w(
    root,
    "main.py",
    "try:\n    import fast\nexcept ImportError:\n    import slow\n"
  );
  assert.deepEqual(rels(root, parsePythonDependencies(main, root)), [
    "fast.py",
    "slow.py",
  ]);
});

test("python: stdlib imports interleaved with a local import", () => {
  const root = tmp();
  w(root, "mymod.py", "");
  const main = w(root, "main.py", "import os\nimport sys\nimport mymod\n");
  assert.deepEqual(rels(root, parsePythonDependencies(main, root)), [
    "mymod.py",
  ]);
});

// --- JavaScript / TypeScript ---

test("js: line-commented import is not a dependency", () => {
  const root = tmp();
  w(root, "a.ts", "export const x = 1;\n");
  const main = w(root, "main.ts", "// import a from './a';\nconst y = 1;\n");
  assert.deepEqual(rels(root, parseJavaScriptDependencies(main, root)), []);
});

test("js: block-commented (multiline) import is not a dependency", () => {
  const root = tmp();
  w(root, "a.ts", "export const x = 1;\n");
  const main = w(
    root,
    "main.ts",
    "/*\nimport a from './a';\n*/\nconst y = 1;\n"
  );
  assert.deepEqual(rels(root, parseJavaScriptDependencies(main, root)), []);
});

test("js: real import next to a commented one is still captured", () => {
  const root = tmp();
  w(root, "a.ts", "export const x = 1;\n");
  w(root, "b.ts", "export const z = 1;\n");
  const main = w(
    root,
    "main.ts",
    "// import a from './a';\nimport { z } from './b';\n"
  );
  assert.deepEqual(rels(root, parseJavaScriptDependencies(main, root)), [
    "b.ts",
  ]);
});

// --- C++ ---

test("cpp: line-commented #include is not a dependency", () => {
  const root = tmp();
  w(root, "a.h", "");
  const main = w(root, "main.cpp", '// #include "a.h"\nint main(){}\n');
  const dirs = collectCppSearchDirs(root);
  assert.deepEqual(rels(root, parseCppDependencies(main, dirs)), []);
});

test("cpp: block-commented #include is not a dependency", () => {
  const root = tmp();
  w(root, "a.h", "");
  const main = w(
    root,
    "main.cpp",
    '/*\n#include "a.h"\n*/\nint main(){}\n'
  );
  const dirs = collectCppSearchDirs(root);
  assert.deepEqual(rels(root, parseCppDependencies(main, dirs)), []);
});

test("cpp: real #include next to a commented one is still captured", () => {
  const root = tmp();
  w(root, "a.h", "");
  w(root, "b.h", "");
  const main = w(
    root,
    "main.cpp",
    '// #include "a.h"\n#include "b.h"\nint main(){}\n'
  );
  const dirs = collectCppSearchDirs(root);
  assert.deepEqual(rels(root, parseCppDependencies(main, dirs)), ["b.h"]);
});
