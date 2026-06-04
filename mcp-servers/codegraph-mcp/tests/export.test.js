"use strict";

// Tests for Stage 2 visualization exporters (Mermaid + DOT). The load-bearing
// correctness concerns are: never emit a file path as a bare node ID, depict the
// same graph in both formats, scope correctly to a file's neighbourhood, cap
// huge graphs, and never crash on edge cases (cycles, empty graph).

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const {
  toolExportMermaid,
  toolExportDot,
  toolGetSubgraph,
} = require("../dist/tools/query.js");

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-export-"));
}
function w(root, rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}

// --- ID sanitization (the #1 hand-rolled-exporter bug) ---

test("mermaid: paths with / . - never appear as node IDs, only in labels", async () => {
  const root = tmp();
  w(root, "src/foo-bar/a.ts", "import '../baz/b';\n");
  w(root, "src/baz/b.ts", "export const x = 1;\n");
  const res = toolExportMermaid(await buildDependencyGraph(root), {
    depth: 2,
    maxNodes: 200,
  });

  // Every node declaration uses a synthetic id (n<number>), not a path.
  const nodeDecls = res.diagram
    .split("\n")
    .filter((l) => /^\s+n\d+\["/.test(l));
  assert.equal(nodeDecls.length, 2);
  // No line declares a node whose id contains a slash or dot before the label.
  assert.ok(!/^\s+[^\s"]*[/.][^\s"]*\["/m.test(res.diagram));
  // The paths live in labels.
  assert.ok(res.diagram.includes('"src/foo-bar/a.ts"'));
  assert.ok(res.diagram.includes('"src/baz/b.ts"'));
});

test("dot: synthetic quoted IDs, paths in labels", async () => {
  const root = tmp();
  w(root, "src/foo-bar/a.ts", "import '../baz/b';\n");
  w(root, "src/baz/b.ts", "export const x = 1;\n");
  const res = toolExportDot(await buildDependencyGraph(root), {
    depth: 2,
    maxNodes: 200,
  });
  assert.ok(res.diagram.startsWith("digraph deps {"));
  assert.ok(res.diagram.trimEnd().endsWith("}"));
  assert.ok(/"n\d+" \[label="src\/foo-bar\/a\.ts"\];/.test(res.diagram));
  // Edges reference synthetic ids only.
  assert.ok(/"n\d+" -> "n\d+";/.test(res.diagram));
});

// --- cycles ---

test("both formats export a cyclic graph without error", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "import './a';\n");
  const graph = await buildDependencyGraph(root);
  const m = toolExportMermaid(graph, { depth: 2, maxNodes: 200 });
  const d = toolExportDot(graph, { depth: 2, maxNodes: 200 });
  assert.equal(m.edgeCount, 2); // a->b and b->a
  assert.equal(d.edgeCount, 2);
});

// --- file scoping matches the shared subgraph ---

test("file-scoped export matches the subgraph node set exactly", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "import './c';\n");
  w(root, "c.ts", "export const x = 1;\n");
  w(root, "far.ts", "export const z = 1;\n"); // unrelated, must be excluded
  const graph = await buildDependencyGraph(root);

  const sub = toolGetSubgraph(graph, "a.ts", 1);
  const subPaths = new Set(sub.nodes.map((n) => n.relativePath));
  const res = toolExportMermaid(graph, { file: "a.ts", depth: 1, maxNodes: 200 });

  assert.equal(res.nodeCount, subPaths.size);
  for (const p of subPaths) {
    assert.ok(res.diagram.includes(`"${p}"`), `expected ${p} in diagram`);
  }
  assert.ok(!res.diagram.includes('"far.ts"'));
});

// --- truncation ---

test("truncation keeps highest-degree nodes and flags truncated", async () => {
  const root = tmp();
  w(root, "hub.ts", "export const x = 1;\n"); // imported by all -> highest degree
  for (let i = 0; i < 10; i++) w(root, `m${i}.ts`, "import './hub';\n");
  const res = toolExportMermaid(await buildDependencyGraph(root), {
    depth: 2,
    maxNodes: 3,
  });
  assert.equal(res.nodeCount, 3);
  assert.equal(res.truncated, true);
  assert.ok(res.diagram.includes('"hub.ts"')); // survives by degree
  assert.ok(res.diagram.includes("truncated:")); // explanatory comment
});

test("no truncation under the cap", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "export const x = 1;\n");
  const res = toolExportDot(await buildDependencyGraph(root), {
    depth: 2,
    maxNodes: 200,
  });
  assert.equal(res.truncated, false);
});

// --- empty graph ---

test("empty graph yields valid, crash-free skeletons", async () => {
  const root = tmp();
  const graph = await buildDependencyGraph(root);
  const m = toolExportMermaid(graph, { depth: 2, maxNodes: 200 });
  const d = toolExportDot(graph, { depth: 2, maxNodes: 200 });
  assert.ok(m.diagram.startsWith("graph LR"));
  assert.equal(m.nodeCount, 0);
  assert.ok(d.diagram.startsWith("digraph deps {"));
  assert.ok(d.diagram.trimEnd().endsWith("}"));
  assert.equal(d.nodeCount, 0);
});

// --- language filter ---

test("language filter restricts the exported node set", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\n");
  w(root, "b.ts", "export const x = 1;\n");
  w(root, "c.py", "x = 1\n");
  const res = toolExportMermaid(await buildDependencyGraph(root), {
    depth: 2,
    maxNodes: 200,
    language: "python",
  });
  assert.equal(res.nodeCount, 1);
  assert.ok(res.diagram.includes('"c.py"'));
  assert.ok(!res.diagram.includes('"a.ts"'));
});

// --- error path ---

test("unknown center file returns an error", async () => {
  const root = tmp();
  w(root, "a.ts", "export const x = 1;\n");
  const res = toolExportMermaid(await buildDependencyGraph(root), {
    file: "nope.ts",
    depth: 2,
    maxNodes: 200,
  });
  assert.ok(res.error);
});

// --- determinism ---

test("export output is deterministic across runs", async () => {
  const root = tmp();
  w(root, "a.ts", "import './b';\nimport './c';\n");
  w(root, "b.ts", "import './c';\n");
  w(root, "c.ts", "export const x = 1;\n");
  const graph = await buildDependencyGraph(root);
  const first = toolExportDot(graph, { depth: 3, maxNodes: 200 }).diagram;
  const second = toolExportDot(graph, { depth: 3, maxNodes: 200 }).diagram;
  assert.equal(first, second);
});
