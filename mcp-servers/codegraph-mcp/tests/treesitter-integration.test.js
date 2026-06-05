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

test("non-JS/TS files do not get imports[] populated in this step", async () => {
  const root = writeProject({
    "m.py": `import os\nfrom . import sibling`,
    "sibling.py": `x = 1`,
  });
  const graph = await buildDependencyGraph(root);
  const m = nodeByRel(graph, "m.py");
  assert.equal(m.imports, undefined, "python imports[] are wired in a later step");
});
