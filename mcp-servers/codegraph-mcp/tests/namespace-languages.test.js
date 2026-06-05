"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolTraceSymbol, toolFindDeadExports } = require("../dist/tools/query.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-ns-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

const deadKeys = (res) => res.dead.map((d) => `${d.relativePath}#${d.name}`);

// Each case has two namespaces declaring a class `Store`. The web file imports
// exactly one of them. Precise FQN resolution must link the *imported* Store
// (not the colliding one) — so the imported Store is live and the other is dead.
// Name-based resolution would fail this (ambiguous name -> no link -> false dead).

test("Java: FQN import resolves across a name collision; dead-code is precise", async () => {
  const root = writeProject({
    "store/Store.java": `package store;\npublic class Store { public void save() {} }\n`,
    "cache/Store.java": `package cache;\npublic class Store {}\n`,
    "web/Handler.java": `package web;\nimport store.Store;\npublic class Handler {\n  void run() { Store s = new Store(); s.save(); }\n}\n`,
  });
  const graph = await buildDependencyGraph(root);

  const trace = toolTraceSymbol(graph, "Store", "store/Store.java");
  assert.ok(trace.usedBy.chain.some((c) => c.name === "run"), "web.Handler.run uses store.Store");

  const dead = deadKeys(toolFindDeadExports(graph));
  assert.ok(!dead.includes(path.join("store", "Store.java") + "#Store"), "imported store.Store is live");
  assert.ok(dead.includes(path.join("cache", "Store.java") + "#Store"), "the colliding cache.Store is dead");
});

test("C#: using-directive resolves across a name collision; dead-code is precise", async () => {
  const root = writeProject({
    "Store.cs": `namespace App.Store { public class Store { public void Save() {} } }\n`,
    "CacheStore.cs": `namespace App.Cache { public class Store {} }\n`,
    "Handler.cs": `using App.Store;\nnamespace App.Web { class Handler { void Run() { var s = new Store(); s.Save(); } } }\n`,
  });
  const graph = await buildDependencyGraph(root);

  const trace = toolTraceSymbol(graph, "Store", "Store.cs");
  assert.ok(trace.usedBy.chain.some((c) => c.name === "Run"), "App.Web.Handler.Run uses App.Store.Store");

  const dead = deadKeys(toolFindDeadExports(graph));
  assert.ok(!dead.includes("Store.cs#Store"), "imported App.Store.Store is live");
  assert.ok(dead.includes("CacheStore.cs#Store"), "the colliding App.Cache.Store is dead");
});

test("PHP: use-statement resolves across a name collision; dead-code is precise", async () => {
  const root = writeProject({
    "Store.php": `<?php\nnamespace App\\Store;\nclass Store { function save() {} }\n`,
    "CacheStore.php": `<?php\nnamespace App\\Cache;\nclass Store {}\n`,
    "Handler.php": `<?php\nnamespace App\\Web;\nuse App\\Store\\Store;\nclass Handler { function run() { $s = new Store(); $s->save(); } }\n`,
  });
  const graph = await buildDependencyGraph(root);

  const trace = toolTraceSymbol(graph, "Store", "Store.php");
  assert.ok(trace.usedBy.chain.some((c) => c.name === "run"), "App Web Handler.run uses App Store Store");

  const dead = deadKeys(toolFindDeadExports(graph));
  assert.ok(!dead.includes("Store.php#Store"), "imported App\\Store\\Store is live");
  assert.ok(dead.includes("CacheStore.php#Store"), "the colliding App\\Cache\\Store is dead");
});

test("FQN languages get derived file-level edges (blast-radius parity)", async () => {
  const { toolGetDependencies } = require("../dist/tools/query.js");
  const root = writeProject({
    "store/Store.java": `package store;\npublic class Store {}\n`,
    "web/Handler.java": `package web;\nimport store.Store;\npublic class Handler { void run() { new Store(); } }\n`,
    "App.cs": `namespace A.Store { public class Store {} }\n`,
    "Use.cs": `using A.Store;\nnamespace A.Web { class Use { void m() { new Store(); } } }\n`,
  });
  const graph = await buildDependencyGraph(root);
  const jdeps = toolGetDependencies(graph, "web/Handler.java").dependencies.map((d) => d.relativePath);
  assert.ok(jdeps.includes(path.join("store", "Store.java")), "Java import yields a file edge");
  const cdeps = toolGetDependencies(graph, "Use.cs").dependencies.map((d) => d.relativePath);
  assert.ok(cdeps.includes("App.cs"), "C# using yields a file edge (derived from the namespace resolution)");
});
