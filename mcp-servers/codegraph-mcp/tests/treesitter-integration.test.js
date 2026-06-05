"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-integ-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

function nodeByRel(graph, rel) {
  for (const node of graph.nodes.values()) {
    if (node.relativePath === rel) return node;
  }
  return undefined;
}

test("imports[] internal-in-graph set matches dependencies[] (parity gate)", async () => {
  const root = writeProject({
    "a.ts": [
      `import { b } from './b';`,
      `import express from 'express';`,
      `import { gone } from './missing';`,
      `import type { T } from './types';`,
      `export const a = b;`,
    ].join("\n"),
    "b.ts": `export const b = 1;`,
    "types.ts": `export interface T { x: number }`,
  });

  const graph = await buildDependencyGraph(root);
  const a = nodeByRel(graph, "a.ts");
  assert.ok(a, "a.ts node exists");
  assert.ok(Array.isArray(a.imports), "a.ts has rich imports[]");

  const internalInGraph = a.imports
    .filter((e) => e.resolution === "internal" && e.to && graph.nodes.has(e.to))
    .map((e) => e.to)
    .sort();

  assert.deepEqual(
    internalInGraph,
    [...a.dependencies].sort(),
    "tree-sitter internal edges must equal the regex dependencies"
  );
});

test("resolution distinguishes external vs unresolved vs internal", async () => {
  const root = writeProject({
    "a.ts": [
      `import { b } from './b';`,
      `import express from 'express';`,
      `import { gone } from './missing';`,
    ].join("\n"),
    "b.ts": `export const b = 1;`,
  });

  const graph = await buildDependencyGraph(root);
  const a = nodeByRel(graph, "a.ts");
  const byRaw = (raw) => a.imports.find((e) => e.raw === raw);

  assert.equal(byRaw("./b").resolution, "internal");
  assert.equal(byRaw("express").resolution, "external");
  assert.equal(byRaw("./missing").resolution, "unresolved", "a relative import to a missing file is broken, not external");
});

test("type-only import is tagged kind=type in the graph", async () => {
  const root = writeProject({
    "a.ts": `import type { T } from './types';\nexport const a = 1;`,
    "types.ts": `export interface T { x: number }`,
  });

  const graph = await buildDependencyGraph(root);
  const a = nodeByRel(graph, "a.ts");
  const edge = a.imports.find((e) => e.raw === "./types");
  assert.equal(edge.kind, "type");
  // type-only still resolves to a real internal file...
  assert.equal(edge.resolution, "internal");
  // ...and the legacy dependency edge is preserved (current behavior unchanged).
  assert.ok([...a.dependencies].some((d) => d.endsWith("types.ts")));
});

test("Python imports[] resolve: internal sibling, external stdlib, broken relative", async () => {
  const root = writeProject({
    "m.py": `import os\nfrom .sibling import thing\nfrom .missing import gone`,
    "sibling.py": `thing = 1`,
  });
  const graph = await buildDependencyGraph(root);
  const m = nodeByRel(graph, "m.py");
  assert.ok(Array.isArray(m.imports), "python files now get imports[]");
  const byRaw = (raw) => m.imports.find((e) => e.raw === raw);

  assert.equal(byRaw("os").resolution, "external", "stdlib import is external");
  assert.equal(byRaw(".sibling").resolution, "internal", "relative import resolves to sibling.py");
  assert.equal(byRaw(".missing").resolution, "unresolved", "missing relative module is broken");
});

test("config/manifest files get no imports[] (no grammar)", async () => {
  const root = writeProject({
    "package.json": `{ "name": "x", "version": "1.0.0" }`,
    "a.ts": `export const a = 1;`,
  });
  const graph = await buildDependencyGraph(root);
  assert.equal(nodeByRel(graph, "package.json").imports, undefined);
  assert.ok(Array.isArray(nodeByRel(graph, "a.ts").imports));
});

test("isTest classification flags test files only", async () => {
  const root = writeProject({
    "src/a.ts": `export const a = 1;`,
    "src/a.test.ts": `import { a } from './a';`,
    "tests/b.ts": `export const b = 1;`,
    "pkg/test_thing.py": `x = 1`,
  });
  const graph = await buildDependencyGraph(root);
  assert.equal(nodeByRel(graph, "src/a.ts").isTest, false);
  assert.equal(nodeByRel(graph, "src/a.test.ts").isTest, true);
  assert.equal(nodeByRel(graph, "tests/b.ts").isTest, true);
  assert.equal(nodeByRel(graph, "pkg/test_thing.py").isTest, true);
});

test("tool: find_broken_imports surfaces unresolved imports across languages", async () => {
  const { toolFindBrokenImports } = require("../dist/tools/query.js");
  const root = writeProject({
    "a.ts": `import { x } from './gone';\nexport const a = 1;`,
    "b.py": `from .nope import y`,
    "ok.ts": `export const ok = 1;`,
  });
  const graph = await buildDependencyGraph(root);
  const { broken, count } = toolFindBrokenImports(graph);
  assert.equal(count, 2);
  const raws = broken.map((b) => b.raw).sort();
  assert.deepEqual(raws, ["./gone", ".nope"]);
  assert.ok(broken.every((b) => typeof b.line === "number" && b.line > 0));
});

test("tools: external dependencies are listed and queryable by package root", async () => {
  const { toolListExternalDependencies, toolGetExternalUsers } = require("../dist/tools/query.js");
  const root = writeProject({
    "a.ts": `import express from 'express';\nimport { merge } from 'lodash/fp';`,
    "b.ts": `import express from 'express';`,
  });
  const graph = await buildDependencyGraph(root);

  const { externals } = toolListExternalDependencies(graph);
  const express = externals.find((e) => e.name === "express");
  const lodash = externals.find((e) => e.name === "lodash");
  assert.equal(express.importerCount, 2, "express imported by two files");
  assert.equal(lodash.importerCount, 1, "lodash/fp aggregates under 'lodash'");

  const users = toolGetExternalUsers(graph, "lodash");
  assert.equal(users.count, 1, "lodash/fp matches a query for 'lodash'");
});
