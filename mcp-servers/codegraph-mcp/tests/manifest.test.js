"use strict";

// Tests for Stage 3 config-aware edges: package.json / go.mod / requirements.txt
// manifests become graph nodes whose LOCAL dependencies become edges. The
// load-bearing invariant is local-only: the npm/Go/PyPI universe must never
// leak into the graph. Also verifies the homogeneous-edge model lets the Stage
// 1/2 tools operate on manifest edges unchanged.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const {
  toolFindCycles,
  toolFindOrphans,
  toolExportMermaid,
} = require("../dist/tools/query.js");

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-manifest-"));
}
function w(root, rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}
// Local dependency edges of a node identified by its relative path suffix.
function depsOf(graph, relSuffix) {
  const abs = [...graph.nodes.keys()].find((k) => k.endsWith("/" + relSuffix));
  assert.ok(abs, `node ${relSuffix} not found in graph`);
  return graph.nodes
    .get(abs)
    .dependencies.map((d) => path.relative(graph.rootDir, d))
    .sort();
}

// --- npm ---

test("package.json: file: and workspace-by-name resolve locally; external skipped", async () => {
  const root = tmp();
  w(
    root,
    "package.json",
    JSON.stringify({
      name: "root",
      dependencies: {
        "@me/utils": "workspace:*", // resolved by name
        lodash: "^4.0.0", // external -> skipped
        "local-thing": "file:./packages/thing", // resolved by path
      },
    })
  );
  w(root, "packages/utils/package.json", JSON.stringify({ name: "@me/utils" }));
  w(root, "packages/thing/package.json", JSON.stringify({ name: "local-thing" }));

  const graph = await buildDependencyGraph(root);
  assert.deepEqual(depsOf(graph, "package.json").filter((p) => p !== "package.json"), [
    "packages/thing/package.json",
    "packages/utils/package.json",
  ]);
});

test("package.json: external-only dependencies produce no edges", async () => {
  const root = tmp();
  w(
    root,
    "package.json",
    JSON.stringify({ name: "solo", dependencies: { react: "^18", express: "^4" } })
  );
  const graph = await buildDependencyGraph(root);
  assert.deepEqual(depsOf(graph, "package.json"), []);
});

test("package.json: devDependencies are included", async () => {
  const root = tmp();
  w(
    root,
    "package.json",
    JSON.stringify({ name: "root", devDependencies: { tool: "file:./tool" } })
  );
  w(root, "tool/package.json", JSON.stringify({ name: "tool" }));
  const graph = await buildDependencyGraph(root);
  assert.deepEqual(depsOf(graph, "package.json"), ["tool/package.json"]);
});

// --- go ---

test("go.mod: local replace edges only; version replace and require skipped", async () => {
  const root = tmp();
  w(
    root,
    "go.mod",
    [
      "module example.com/app",
      "",
      "go 1.21",
      "",
      "require (",
      "\texample.com/lib v1.2.3",
      "\tgithub.com/ext/pkg v0.1.0",
      ")",
      "",
      "replace example.com/lib => ./lib",
      "replace github.com/ext/pkg => github.com/fork/pkg v0.2.0",
      "",
    ].join("\n")
  );
  w(root, "lib/go.mod", "module example.com/lib\n\ngo 1.21\n");
  const graph = await buildDependencyGraph(root);
  assert.deepEqual(depsOf(graph, "go.mod").filter((p) => p !== "go.mod"), [
    "lib/go.mod",
  ]);
});

// --- pip ---

test("requirements.txt: -r, -e local, and bare local paths; PyPI skipped", async () => {
  const root = tmp();
  w(
    root,
    "requirements.txt",
    [
      "flask==2.0", // external
      "requests", // external
      "-r requirements-dev.txt", // referenced requirements file
      "-e ./pkg", // editable local package
      "# a comment",
      "./other", // bare local path
      "",
    ].join("\n")
  );
  w(root, "requirements-dev.txt", "pytest\n");
  w(root, "pkg/requirements.txt", "numpy\n");
  w(root, "other/requirements.txt", "scipy\n");
  const graph = await buildDependencyGraph(root);
  assert.deepEqual(depsOf(graph, "requirements.txt"), [
    "other/requirements.txt",
    "pkg/requirements.txt",
    "requirements-dev.txt",
  ]);
});

test("requirements.txt: VCS editable is not treated as local", async () => {
  const root = tmp();
  w(root, "requirements.txt", "-e git+https://github.com/x/y.git#egg=y\n");
  const graph = await buildDependencyGraph(root);
  assert.deepEqual(depsOf(graph, "requirements.txt"), []);
});

// --- discovery / hygiene ---

test("manifests under ignored dirs (node_modules) are not scanned", async () => {
  const root = tmp();
  w(root, "package.json", JSON.stringify({ name: "root", dependencies: { dep: "file:./node_modules/dep" } }));
  w(root, "node_modules/dep/package.json", JSON.stringify({ name: "dep" }));
  const graph = await buildDependencyGraph(root);
  // The vendored manifest is neither a node nor a (valid) edge target.
  const hasVendored = [...graph.nodes.keys()].some((k) => k.includes("node_modules"));
  assert.equal(hasVendored, false);
  assert.deepEqual(depsOf(graph, "package.json"), []);
});

// --- integration with Stage 1/2 over the homogeneous edge model ---

test("intelligence tools operate on manifest edges (cycle between two package.json)", async () => {
  const root = tmp();
  w(root, "a/package.json", JSON.stringify({ name: "a", dependencies: { b: "file:../b" } }));
  w(root, "b/package.json", JSON.stringify({ name: "b", dependencies: { a: "file:../a" } }));
  const graph = await buildDependencyGraph(root);

  const cycles = toolFindCycles(graph);
  assert.equal(cycles.count, 1);
  assert.deepEqual(cycles.cycles[0].map((f) => f.relativePath), [
    "a/package.json",
    "b/package.json",
  ]);

  // They reference each other, so neither is an orphan.
  assert.deepEqual(toolFindOrphans(graph).orphans, []);

  // Exporter renders manifest nodes without special-casing.
  const m = toolExportMermaid(graph, { depth: 2, maxNodes: 200 });
  assert.equal(m.nodeCount, 2);
});

test("language filter recognizes config manifests", async () => {
  const root = tmp();
  w(root, "package.json", JSON.stringify({ name: "x" })); // isolated manifest -> orphan
  w(root, "a.ts", "export const x = 1;\n");
  const graph = await buildDependencyGraph(root);
  const res = toolFindOrphans(graph, "config");
  assert.deepEqual(res.orphans.map((f) => f.relativePath), ["package.json"]);
});
