"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolTraceSymbol, toolFindDeadExports, toolGetDependencies } = require("../dist/tools/query.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-rr-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

test("Rust: `use` resolves across a module name collision; dead-code is precise", async () => {
  // Two modules each declare a struct `Store`. app imports crate::store::Store.
  const root = writeProject({
    "src/lib.rs": `pub mod store;\npub mod cache;\npub mod app;\n`,
    "src/store.rs": `pub struct Store {}\nimpl Store { pub fn new() -> Store { Store {} } }\n`,
    "src/cache.rs": `pub struct Store {}\n`,
    "src/app.rs": `use crate::store::Store;\npub fn run() { let _s = Store::new(); }\n`,
  });
  const graph = await buildDependencyGraph(root);

  const trace = toolTraceSymbol(graph, "Store", "src/store.rs");
  assert.ok(trace.usedBy.chain.some((c) => c.name === "run"), "app::run uses crate::store::Store");

  const dead = toolFindDeadExports(graph).dead.map((d) => `${d.relativePath}#${d.name}`);
  assert.ok(!dead.includes("src/store.rs#Store"), "imported store::Store is live");
  assert.ok(dead.includes("src/cache.rs#Store"), "the colliding cache::Store is dead");
});

test("Rust: file-level edges from `mod` and `use`", async () => {
  const root = writeProject({
    "src/lib.rs": `pub mod util;\npub mod app;\n`,
    "src/util.rs": `pub fn help() {}\n`,
    "src/app.rs": `use crate::util::help;\npub fn run() { help(); }\n`,
  });
  const graph = await buildDependencyGraph(root);
  const libDeps = toolGetDependencies(graph, "lib.rs").dependencies.map((d) => d.relativePath);
  assert.ok(libDeps.includes("src/util.rs"), "lib.rs depends on util.rs via `mod util`");
  const appDeps = toolGetDependencies(graph, "app.rs").dependencies.map((d) => d.relativePath);
  assert.ok(appDeps.includes("src/util.rs"), "app.rs depends on util.rs via `use`");
});

test("Ruby: require_relative scopes resolution; the chain crosses files", async () => {
  const root = writeProject({
    "store.rb": `class Store\n  def save\n  end\nend\n`,
    "app.rb": `require_relative 'store'\n\nclass App\n  def run\n    Store.new.save\n  end\nend\n`,
  });
  const graph = await buildDependencyGraph(root);

  // file edge from require_relative
  const appDeps = toolGetDependencies(graph, "app.rb").dependencies.map((d) => d.relativePath);
  assert.ok(appDeps.includes("store.rb"), "app.rb requires store.rb");

  // symbol chain across the require
  const trace = toolTraceSymbol(graph, "Store", "store.rb");
  assert.ok(trace.usedBy.chain.some((c) => c.name === "run"), "App#run references Store across the require");
});
