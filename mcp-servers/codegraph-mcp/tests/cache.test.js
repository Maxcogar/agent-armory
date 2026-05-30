"use strict";

// Tests for Stage 4 persistence: graph serialization (Map round-trip + schema
// versioning) and incremental rescan correctness. The headline correctness
// guarantee — incremental produces the same graph a full rebuild would — is
// asserted directly via an equivalence check.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph, incrementalUpdate } = require("../dist/graph.js");
const {
  serializeGraph,
  deserializeGraph,
  saveCache,
  loadCache,
  clearCache,
  SCHEMA_VERSION,
} = require("../dist/cache.js");

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-cache-"));
}
function w(root, rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A canonical, order-independent view of a graph's edges, for equivalence checks.
function edgeSet(graph) {
  const edges = [];
  for (const [from, node] of graph.nodes) {
    for (const dep of node.dependencies) {
      edges.push(`${path.relative(graph.rootDir, from)} -> ${path.relative(graph.rootDir, dep)}`);
    }
  }
  return edges.sort();
}
function nodeSet(graph) {
  return [...graph.nodes.keys()].map((k) => path.relative(graph.rootDir, k)).sort();
}

// --- serialization ---

test("serialize -> deserialize restores Maps and edges (deep round-trip)", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "export const x = 1;\n");
  w(root, "README.md", "see a.ts\n");
  const graph = await buildDependencyGraph(root);

  // Simulate a real disk round-trip through JSON.
  const restored = deserializeGraph(JSON.parse(JSON.stringify(serializeGraph(graph))));

  assert.ok(restored.nodes instanceof Map);
  assert.ok(restored.docNodes instanceof Map);
  assert.equal(restored.nodes.size, graph.nodes.size);
  assert.equal(restored.docNodes.size, graph.docNodes.size);
  assert.deepEqual(nodeSet(restored), nodeSet(graph));
  assert.deepEqual(edgeSet(restored), edgeSet(graph));
});

test("deserialize rejects schema mismatch and garbage (never stale)", () => {
  assert.equal(deserializeGraph({ schemaVersion: SCHEMA_VERSION + 999, rootDir: "/x", nodes: [], docNodes: [] }), null);
  assert.equal(deserializeGraph({ schemaVersion: SCHEMA_VERSION }), null); // missing arrays
  assert.equal(deserializeGraph("not an object"), null);
  assert.equal(deserializeGraph(null), null);
});

test("saveCache / loadCache via an isolated cache dir", async () => {
  const cacheDir = tmp();
  const prev = process.env.CODEGRAPH_CACHE_DIR;
  process.env.CODEGRAPH_CACHE_DIR = cacheDir;
  try {
    const root = tmp();
    w(root, "a.ts", "import './b';\n");
    w(root, "b.ts", "export const x = 1;\n");
    const graph = await buildDependencyGraph(root);

    saveCache(graph);
    const loaded = loadCache(root);
    assert.ok(loaded);
    assert.deepEqual(edgeSet(loaded), edgeSet(graph));

    // Unknown root -> null.
    assert.equal(loadCache(tmp()), null);

    // clearCache removes it.
    clearCache(root);
    assert.equal(loadCache(root), null);
  } finally {
    if (prev === undefined) delete process.env.CODEGRAPH_CACHE_DIR;
    else process.env.CODEGRAPH_CACHE_DIR = prev;
  }
});

// --- incremental rescan ---

test("incremental: changed file re-parsed, unchanged reused", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "export const x = 1;\n");
  w(root, "c.ts", "export const y = 1;\n");
  const g1 = await buildDependencyGraph(root);

  await sleep(10);
  w(root, "a.ts", "import './b';\nimport './c';\n"); // a now imports c too

  const { graph, delta } = await incrementalUpdate(g1);
  assert.deepEqual(delta, { added: 0, changed: 1, removed: 0, reused: 2 });

  const cNode = [...graph.nodes.values()].find((n) => n.relativePath === "c.ts");
  assert.deepEqual(
    cNode.dependents.map((d) => path.basename(d)),
    ["a.ts"]
  );
});

test("incremental: deleted file removes node and prunes a dangling edge from an unchanged importer", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "export const x = 1;\n");
  const g1 = await buildDependencyGraph(root);

  await sleep(10);
  fs.rmSync(path.join(root, "b.ts")); // a.ts is untouched but now imports a gone file

  const { graph, delta } = await incrementalUpdate(g1);
  assert.equal(delta.removed, 1);
  assert.ok(!nodeSet(graph).includes("b.ts"));
  const aNode = [...graph.nodes.values()].find((n) => n.relativePath === "a.ts");
  assert.deepEqual(aNode.dependencies, []); // dangling edge pruned
});

test("incremental: added file is parsed", async () => {
  const root = tmp();
  w(root, "a.ts", "export const x = 1;\n");
  const g1 = await buildDependencyGraph(root);

  await sleep(10);
  w(root, "b.ts", "import './a';\n");

  const { graph, delta } = await incrementalUpdate(g1);
  assert.equal(delta.added, 1);
  const bNode = [...graph.nodes.values()].find((n) => n.relativePath === "b.ts");
  assert.deepEqual(
    bNode.dependencies.map((d) => path.basename(d)),
    ["a.ts"]
  );
});

test("incremental result equals a full rebuild after edits (node set + edges)", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "import './c';\n");
  w(root, "c.ts", "export const x = 1;\n");
  w(root, "d.ts", "export const y = 1;\n");
  const g1 = await buildDependencyGraph(root);

  await sleep(10);
  w(root, "a.ts", "import './c';\n"); // change: a now imports c directly
  fs.rmSync(path.join(root, "d.ts")); // delete d
  w(root, "e.ts", "import './b';\n"); // add e

  const { graph: incremental } = await incrementalUpdate(g1);
  const full = await buildDependencyGraph(root);

  assert.deepEqual(nodeSet(incremental), nodeSet(full));
  assert.deepEqual(edgeSet(incremental), edgeSet(full));
});

test("incremental: nothing changed reuses everything", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "export const x = 1;\n");
  const g1 = await buildDependencyGraph(root);

  const { delta } = await incrementalUpdate(g1);
  assert.deepEqual(delta, { added: 0, changed: 0, removed: 0, reused: 2 });
});
