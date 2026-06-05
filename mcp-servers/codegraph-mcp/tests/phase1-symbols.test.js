"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const {
  toolGetSymbol,
  toolFindSymbolDependents,
  toolFindDeadExports,
  toolFindUnusedImports,
} = require("../dist/tools/query.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-p1-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

test("dead exports: unused exports are flagged, used ones are not", async () => {
  const root = writeProject({
    "contracts.ts": [
      `export interface FooResponse { commonName: string }`,
      `export interface FooResult { commonName: string }`,
      `export const used = 1;`,
      `export const deadConst = 2;`,
    ].join("\n"),
    "ui.ts": `import { FooResult, used } from './contracts';\nexport type T = FooResult;\nexport const x = used;`,
  });
  const graph = await buildDependencyGraph(root);
  const result = toolFindDeadExports(graph, "contracts.ts");
  const deadNames = result.dead.map((d) => d.name).sort();
  assert.deepEqual(deadNames, ["FooResponse", "deadConst"]);
});

test("get_symbol: dead symbol surfaces its live sibling (the audit case)", async () => {
  const root = writeProject({
    "contracts.ts": `export interface PlantIdentificationResponse { commonName: string }`,
    "client.ts": `export interface PlantIdentificationResult { commonName: string }`,
    "ui.ts": `import { PlantIdentificationResult } from './client';\nexport const x: PlantIdentificationResult = { commonName: 'a' };`,
  });
  const graph = await buildDependencyGraph(root);
  const res = toolGetSymbol(graph, "PlantIdentificationResponse");
  assert.equal(res.found, true);
  assert.equal(res.definitions[0].liveness.verdict, "unused", "the nested Response is dead");

  const sibling = res.siblings.find((s) => s.name === "PlantIdentificationResult");
  assert.ok(sibling, "the live sibling is surfaced");
  assert.equal(sibling.liveness.verdict, "used", "and it is reported as used");
});

test("export * barrel (Phase 2): unconsumed re-export resolves to unused, not ambiguous", async () => {
  const root = writeProject({
    "contracts.ts": `export interface Bar { n: number }`,
    "index.ts": `export * from './contracts';`,
  });
  const graph = await buildDependencyGraph(root);
  const res = toolGetSymbol(graph, "Bar");
  assert.equal(res.definitions[0].liveness.verdict, "unused", "nothing consumes Bar through the barrel");

  const dead = toolFindDeadExports(graph, "contracts.ts");
  assert.ok(dead.dead.some((d) => d.name === "Bar"));
  assert.equal(dead.ambiguousCount, 0, "the TS compiler resolves barrels, so no ambiguity");
});

test("export * barrel (Phase 2): a name consumed through the barrel is used", async () => {
  const root = writeProject({
    "contracts.ts": `export interface Used { n: number }\nexport interface Dead { n: number }`,
    "index.ts": `export * from './contracts';`,
    "app.ts": `import { Used } from './index';\nexport const x: Used = { n: 1 };`,
  });
  const graph = await buildDependencyGraph(root);
  const dead = toolFindDeadExports(graph, "contracts.ts");
  const names = dead.dead.map((d) => d.name);
  assert.ok(names.includes("Dead"), "Dead is genuinely unused");
  assert.ok(!names.includes("Used"), "Used is reached through the barrel");
});

test("namespace import (Phase 2): member usage resolves used vs unused", async () => {
  const root = writeProject({
    "util.ts": `export const helper = 1;\nexport const other = 2;`,
    "app.ts": `import * as U from './util';\nexport const x = U.helper;`,
  });
  const graph = await buildDependencyGraph(root);
  assert.equal(toolGetSymbol(graph, "helper").definitions[0].liveness.verdict, "used");
  assert.equal(toolGetSymbol(graph, "other").definitions[0].liveness.verdict, "unused");
});

test("find_symbol_dependents: who imports a specific symbol", async () => {
  const root = writeProject({
    "b.ts": `export const wanted = 1;\nexport const ignored = 2;`,
    "a.ts": `import { wanted } from './b';\nexport const x = wanted;`,
    "c.ts": `import { wanted } from './b';\nexport const y = wanted;`,
  });
  const graph = await buildDependencyGraph(root);
  const res = toolFindSymbolDependents(graph, "b.ts", "wanted");
  assert.equal(res.count, 2);
  assert.deepEqual(res.dependents.map((d) => d.file.relativePath).sort(), ["a.ts", "c.ts"]);
});

test("find_unused_imports flags imported-but-unreferenced bindings", async () => {
  const root = writeProject({
    "b.ts": `export const used = 1;\nexport const dead = 2;`,
    "a.ts": `import { used, dead } from './b';\nexport const x = used;`,
  });
  const graph = await buildDependencyGraph(root);
  const res = toolFindUnusedImports(graph, "a.ts");
  assert.deepEqual(res.unused.map((u) => u.local), ["dead"]);
});

test("Python: dead top-level function is flagged, used one is not", async () => {
  const root = writeProject({
    "mod.py": `def live_fn():\n    return 1\n\ndef dead_fn():\n    return 2\n`,
    "main.py": `from .mod import live_fn\n\nprint(live_fn())\n`,
  });
  const graph = await buildDependencyGraph(root);
  const dead = toolFindDeadExports(graph);
  const names = dead.dead.map((d) => d.name);
  assert.ok(names.includes("dead_fn"), "dead_fn is unused");
  assert.ok(!names.includes("live_fn"), "live_fn is imported by main.py");
});
