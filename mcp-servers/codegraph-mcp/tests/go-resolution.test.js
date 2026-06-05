"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolTraceSymbol, toolFindDeadExports, toolGetDependencies } = require("../dist/tools/query.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-go-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

test("Go: cross-package import resolves precisely despite a name collision", async () => {
  // Two packages both declare `Process`. main calls store.Process — it must
  // resolve to store's Process, NOT cache's. Name-based resolution would fail
  // this (ambiguous -> no edge); package-scoped resolution gets it right.
  const root = writeProject({
    "go.mod": `module example.com/app\n\ngo 1.21\n`,
    "store/store.go": `package store\nfunc Process() int { return 1 }\n`,
    "cache/cache.go": `package cache\nfunc Process() int { return 2 }\n`,
    "main.go": `package main\n\nimport "example.com/app/store"\n\nfunc main() {\n  store.Process()\n}\n`,
  });
  const graph = await buildDependencyGraph(root);

  // store.Process is used (by main); it must NOT be dead.
  const dead = toolFindDeadExports(graph);
  const deadKeys = dead.dead.map((d) => `${d.relativePath}#${d.name}`);
  assert.ok(
    !deadKeys.includes(path.join("store", "store.go") + "#Process"),
    "store.Process is used by main and must not be flagged dead (no false dead via collision)"
  );
  // cache.Process is genuinely unused -> dead.
  assert.ok(
    deadKeys.includes(path.join("cache", "cache.go") + "#Process"),
    "cache.Process is unused and should be dead"
  );

  // The chain confirms the precise edge.
  const trace = toolTraceSymbol(graph, "Process", "store/store.go");
  assert.ok(trace.usedBy.chain.some((c) => c.name === "main"), "main is upstream of store.Process");
});

test("Go: file-level dependency edges resolve package imports", async () => {
  const root = writeProject({
    "go.mod": `module example.com/app\n\ngo 1.21\n`,
    "util/util.go": `package util\nfunc Help() {}\n`,
    "main.go": `package main\nimport "example.com/app/util"\nfunc main() { util.Help() }\n`,
  });
  const graph = await buildDependencyGraph(root);
  const deps = toolGetDependencies(graph, "main.go");
  assert.ok(
    deps.dependencies.some((d) => d.relativePath === path.join("util", "util.go")),
    "main.go depends on util/util.go via the Go import"
  );
});

test("find_dead_exports skips Ruby (runtime dynamism) — no false deads", async () => {
  const root = writeProject({
    "a.rb": `class Used\nend\nclass Unused\nend\n`,
  });
  const graph = await buildDependencyGraph(root);
  const dead = toolFindDeadExports(graph);
  assert.ok(dead.skippedLanguages && dead.skippedLanguages.includes("ruby"), "ruby is skipped");
  assert.ok(!dead.dead.some((d) => d.relativePath === "a.rb"), "no ruby symbol is claimed dead");
});
