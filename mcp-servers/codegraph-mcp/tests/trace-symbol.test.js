"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolTraceSymbol } = require("../dist/tools/query.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-trace-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

test("trace_symbol walks the full upstream chain to where it ends", async () => {
  const root = writeProject({
    // A chain that runs:  module code -> handler -> identify() -> Result type
    "result.ts": `export interface Result { name: string }`,
    "service.ts": `import { Result } from './result';\nexport function identify(): Result { return { name: 'x' }; }`,
    "page.ts": `import { identify } from './service';\nexport function handler() { return identify(); }\nhandler();`,
  });
  const graph = await buildDependencyGraph(root);
  const res = toolTraceSymbol(graph, "Result");

  const names = res.usedBy.chain.map((c) => c.name);
  assert.ok(names.includes("identify"), "the function that uses the type is in the chain");
  assert.ok(names.includes("handler"), "and the function that uses THAT is further up the chain");

  const byName = (n) => res.usedBy.chain.find((c) => c.name === n);
  assert.equal(byName("identify").depth, 1, "identify is one hop up");
  assert.ok(byName("handler").depth >= 2, "handler is further up");
});

test("trace_symbol shows a dead chain that goes cold", async () => {
  const root = writeProject({
    "contracts.ts": `export interface Response { name: string }`,
    // identifyStub uses Response, but nothing uses identifyStub -> the chain ends here.
    "stub.ts": `import { Response } from './contracts';\nexport function identifyStub(): Response { throw new Error('NOT_IMPLEMENTED'); }`,
  });
  const graph = await buildDependencyGraph(root);
  const res = toolTraceSymbol(graph, "Response");

  assert.ok(res.usedBy.chain.some((c) => c.name === "identifyStub"), "the stub is in the chain");
  const terminalNames = res.usedBy.terminals.map((t) => t.name);
  assert.ok(terminalNames.includes("identifyStub"), "the chain dead-ends at the stub (nothing uses it)");
});

test("trace_symbol: downstream shows what a symbol uses", async () => {
  const root = writeProject({
    "dep.ts": `export const helper = () => 1;`,
    "main.ts": `import { helper } from './dep';\nexport function run() { return helper(); }`,
  });
  const graph = await buildDependencyGraph(root);
  const res = toolTraceSymbol(graph, "run", "main.ts");
  assert.ok(res.uses.chain.some((c) => c.name === "helper"), "run uses helper (downstream)");
});
