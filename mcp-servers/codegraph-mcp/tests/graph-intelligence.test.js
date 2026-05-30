"use strict";

// Tests for Stage 1 graph-intelligence tools: cycles, path-between, orphans,
// layers. Built by empirically probing the algorithms, then locking in behavior.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph, findCycles } = require("../dist/graph.js");
const {
  toolFindCycles,
  toolGetPathBetween,
  toolFindOrphans,
  toolGetLayers,
} = require("../dist/tools/query.js");

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-intel-"));
}
function w(root, rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}
function rels(refsArrays) {
  return refsArrays.map((ring) => ring.map((f) => f.relativePath));
}

// --- cycles ---

test("cycles: two-node cycle reported once", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "import './a';\n");
  const res = toolFindCycles(await buildDependencyGraph(root));
  assert.equal(res.hasCycles, true);
  assert.equal(res.count, 1);
  assert.deepEqual(rels(res.cycles), [["a.ts", "b.ts"]]);
});

test("cycles: three-node ring normalized to smallest start", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "import './c';\n");
  w(root, "c.ts", "import './a';\n");
  const res = toolFindCycles(await buildDependencyGraph(root));
  assert.equal(res.count, 1);
  // Ring starts at lexicographically smallest member (a.ts).
  assert.deepEqual(rels(res.cycles), [["a.ts", "b.ts", "c.ts"]]);
});

test("cycles: acyclic graph reports none", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "export const x = 1;\n");
  const res = toolFindCycles(await buildDependencyGraph(root));
  assert.equal(res.hasCycles, false);
  assert.deepEqual(res.cycles, []);
});

test("cycles: two independent cycles both found", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "import './a';\n");
  w(root, "c.ts", "import './d';\n");
  w(root, "d.ts", "import './c';\n");
  const res = toolFindCycles(await buildDependencyGraph(root));
  assert.equal(res.count, 2);
  assert.deepEqual(rels(res.cycles), [
    ["a.ts", "b.ts"],
    ["c.ts", "d.ts"],
  ]);
});

test("cycles: max_cycles caps output and sets truncated", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "import './a';\n");
  w(root, "c.ts", "import './d';\n");
  w(root, "d.ts", "import './c';\n");
  const res = toolFindCycles(await buildDependencyGraph(root), 1);
  assert.equal(res.count, 2);
  assert.equal(res.cycles.length, 1);
  assert.equal(res.truncated, true);
});

test("cycles: self-loop branch handled (hand-built graph, since parsers strip self-edges)", () => {
  // The JS/Python/C++ parsers all drop self-references, so a self-edge cannot
  // arise from scanning today. Construct the graph directly to lock in that
  // findCycles still reports a self-loop as a cycle — relevant once config
  // edges (Stage 3) may self-reference.
  const graph = {
    rootDir: "/x",
    builtAt: 0,
    totalFiles: 1,
    parseErrors: [],
    docNodes: new Map(),
    nodes: new Map([
      [
        "/x/a.ts",
        {
          path: "/x/a.ts",
          relativePath: "a.ts",
          language: "typescript",
          dependencies: ["/x/a.ts"],
          dependents: ["/x/a.ts"],
          sizeBytes: 0,
          lastModified: 0,
        },
      ],
    ]),
  };
  const cycles = findCycles(graph);
  assert.deepEqual(cycles, [["/x/a.ts"]]);
});

// --- path between ---

test("path: linear chain returns full path with hop count", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "import './c';\n");
  w(root, "c.ts", "export const x = 1;\n");
  const res = toolGetPathBetween(await buildDependencyGraph(root), "a.ts", "c.ts");
  assert.equal(res.found, true);
  assert.equal(res.length, 2);
  assert.deepEqual(res.path.map((f) => f.relativePath), ["a.ts", "b.ts", "c.ts"]);
});

test("path: no forward path but reverse exists is hinted", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "export const x = 1;\n");
  const res = toolGetPathBetween(await buildDependencyGraph(root), "b.ts", "a.ts");
  assert.equal(res.found, false);
  assert.equal(res.path, null);
  assert.equal(res.length, null);
  assert.equal(res.reverseExists, true);
});

test("path: unrelated files report no path and no reverse", async () => {
  const root = tmp();
  w(root, "a.ts", "export const x = 1;\n");
  w(root, "b.ts", "export const y = 1;\n");
  const res = toolGetPathBetween(await buildDependencyGraph(root), "a.ts", "b.ts");
  assert.equal(res.found, false);
  assert.equal(res.reverseExists, false);
});

test("path: same file returns trivial path of length 0", async () => {
  const root = tmp();
  w(root, "a.ts", "export const x = 1;\n");
  const res = toolGetPathBetween(await buildDependencyGraph(root), "a.ts", "a.ts");
  assert.equal(res.found, true);
  assert.equal(res.length, 0);
  assert.deepEqual(res.path.map((f) => f.relativePath), ["a.ts"]);
});

// --- orphans ---

test("orphans: only fully isolated files, distinct from entry points and leaves", async () => {
  const root = tmp();
  w(root, "iso.ts", "export const x = 1;\n"); // isolated -> orphan
  w(root, "a.ts", "import './b';\n"); // entry point (has deps, no dependents)
  w(root, "b.ts", "export const y = 1;\n"); // leaf (has dependents, no deps)
  const res = toolFindOrphans(await buildDependencyGraph(root));
  assert.deepEqual(res.orphans.map((f) => f.relativePath), ["iso.ts"]);
  assert.equal(res.count, 1);
});

test("orphans: language filter applied", async () => {
  const root = tmp();
  w(root, "iso.ts", "export const x = 1;\n");
  w(root, "iso.py", "x = 1\n");
  const graph = await buildDependencyGraph(root);
  const py = toolFindOrphans(graph, "python");
  assert.deepEqual(py.orphans.map((f) => f.relativePath), ["iso.py"]);
});

// --- layers ---

test("layers: linear chain produces one file per layer, deepest first", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "import './c';\n");
  w(root, "c.ts", "export const x = 1;\n");
  const res = toolGetLayers(await buildDependencyGraph(root));
  assert.equal(res.cyclic, false);
  assert.equal(res.depth, 3);
  assert.deepEqual(rels(res.layers), [["c.ts"], ["b.ts"], ["a.ts"]]);
});

test("layers: diamond places shared base alone, mid tier together", async () => {
  const root = tmp();
  w(root, "top.ts", "import './l';\nimport './rt';\n");
  w(root, "l.ts", "import './base';\n");
  w(root, "rt.ts", "import './base';\n");
  w(root, "base.ts", "export const x = 1;\n");
  const res = toolGetLayers(await buildDependencyGraph(root));
  assert.deepEqual(rels(res.layers), [
    ["base.ts"],
    ["l.ts", "rt.ts"],
    ["top.ts"],
  ]);
});

test("layers: cyclic graph completes without hanging and flags cycle members", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "import './a';\n");
  w(root, "c.ts", "import './a';\n");
  const res = toolGetLayers(await buildDependencyGraph(root));
  assert.equal(res.cyclic, true);
  assert.deepEqual(res.cyclicNodes.map((f) => f.relativePath), ["a.ts", "b.ts"]);
  // All three files still placed into some layer (none dropped).
  const placed = res.layers.flat().map((f) => f.relativePath).sort();
  assert.deepEqual(placed, ["a.ts", "b.ts", "c.ts"]);
});
