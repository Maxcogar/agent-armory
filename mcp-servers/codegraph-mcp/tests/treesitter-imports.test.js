"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { extractImports } = require("../dist/treesitter/imports.js");

function byRaw(imports, raw) {
  return imports.find((i) => i.raw === raw);
}

test("JS/TS: named + type-only specifier on one import", () => {
  const imps = extractImports("typescript", `import { a, type B } from './mod';`);
  const mod = byRaw(imps, "./mod");
  assert.ok(mod, "expected an import of './mod'");
  assert.equal(mod.kind, "value");
  assert.deepEqual(
    mod.specifiers.map((s) => [s.imported, s.local, s.kind, s.isType]),
    [
      ["a", "a", "named", false],
      ["B", "B", "named", true],
    ]
  );
});

test("JS/TS: whole `import type` statement is kind=type", () => {
  const imps = extractImports("typescript", `import type { C } from './types';`);
  const t = byRaw(imps, "./types");
  assert.equal(t.kind, "type");
  assert.equal(t.specifiers[0].isType, true);
});

test("JS/TS: namespace, default, and side-effect imports", () => {
  const code = [
    `import * as ns from './ns';`,
    `import Def from './d';`,
    `import './polyfill';`,
  ].join("\n");
  const imps = extractImports("javascript", code);

  const ns = byRaw(imps, "./ns").specifiers[0];
  assert.deepEqual([ns.imported, ns.local, ns.kind], ["*", "ns", "namespace"]);

  const def = byRaw(imps, "./d").specifiers[0];
  assert.deepEqual([def.imported, def.local, def.kind], ["default", "Def", "default"]);

  const side = byRaw(imps, "./polyfill");
  assert.equal(side.kind, "side-effect");
  assert.deepEqual(side.specifiers, []);
});

test("JS/TS: aliased named import keeps imported vs local", () => {
  const imps = extractImports("typescript", `import { A as B } from './al';`);
  const s = byRaw(imps, "./al").specifiers[0];
  assert.deepEqual([s.imported, s.local], ["A", "B"]);
});

test("JS/TS: dynamic import() and require() with their kinds", () => {
  const code = [
    `async function f() { return import('./dyn'); }`,
    `const r = require('./req');`,
  ].join("\n");
  const imps = extractImports("javascript", code);
  assert.equal(byRaw(imps, "./dyn").kind, "dynamic");
  assert.equal(byRaw(imps, "./req").kind, "value");
});

test("JS/TS: re-exports are kind=re-export (named and star)", () => {
  const code = [
    `export { X } from './re';`,
    `export * from './star';`,
  ].join("\n");
  const imps = extractImports("typescript", code);
  assert.equal(byRaw(imps, "./re").kind, "re-export");
  assert.equal(byRaw(imps, "./re").specifiers[0].imported, "X");

  const star = byRaw(imps, "./star");
  assert.equal(star.kind, "re-export");
  assert.equal(star.specifiers[0].kind, "namespace");
});

test("JS/TS: import-like text in a comment or string is NOT extracted", () => {
  const code = [
    `// import { z } from './commented';`,
    `const s = "import x from './in-a-string'";`,
    `import { real } from './real';`,
  ].join("\n");
  const imps = extractImports("typescript", code);
  assert.equal(byRaw(imps, "./commented"), undefined);
  assert.equal(byRaw(imps, "./in-a-string"), undefined);
  assert.ok(byRaw(imps, "./real"), "the genuine import is still found");
});

test("JS/TS: line numbers are 1-based", () => {
  const code = `const a = 1;\nimport { b } from './b';`;
  assert.equal(byRaw(extractImports("typescript", code), "./b").line, 2);
});

test("Python: from-import, dotted import, and alias", () => {
  const code = [
    `from .mod import x`,
    `from pkg.sub import a, b`,
    `import os`,
    `import a.b as c`,
  ].join("\n");
  const raws = extractImports("python", code).map((i) => i.raw).sort();
  for (const expected of [".mod", "pkg.sub", "os", "a.b"]) {
    assert.ok(raws.includes(expected), `expected python import raw '${expected}' in ${JSON.stringify(raws)}`);
  }
});

test("C++: only quoted local includes are extracted, not <system>", () => {
  const code = `#include "local.h"\n#include <vector>\n`;
  const imps = extractImports("cpp", code);
  assert.deepEqual(imps.map((i) => i.raw), ["local.h"]);
});

test("unsupported language yields no imports", () => {
  assert.deepEqual(extractImports("config", `whatever := 1`), []);
});
