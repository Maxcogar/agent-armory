"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolListExternalDependencies, toolFindBrokenImports } = require("../dist/tools/query.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-ext-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

test("external dependencies are detected for Java, Rust, and Ruby; internal imports are not", async () => {
  const root = writeProject({
    "store/Store.java": `package store;\npublic class Store {}\n`,
    "web/H.java": `package web;\nimport java.util.List;\nimport store.Store;\npublic class H { void m() { new Store(); } }\n`,
    "src/lib.rs": `pub mod store;\npub mod app;\n`,
    "src/store.rs": `pub struct Store {}\n`,
    "src/app.rs": `use std::collections::HashMap;\nuse crate::store::Store;\npub fn r() { let _: HashMap<i32,i32> = HashMap::new(); let _ = Store {}; }\n`,
    "a.rb": `require 'json'\nrequire_relative 'b'\n`,
    "b.rb": `class B\nend\n`,
  });
  const graph = await buildDependencyGraph(root);
  const ext = toolListExternalDependencies(graph).externals.map((e) => e.name);

  assert.ok(ext.includes("java"), "Java stdlib import is external");
  assert.ok(ext.includes("std"), "Rust std is external");
  assert.ok(ext.includes("json"), "Ruby gem is external");

  // imports that resolve to project code must NOT appear as external
  assert.ok(!ext.includes("store"), "the in-project store import is internal, not external");
  assert.ok(!ext.includes("crate"), "a `use crate::...` is internal, not external");
});

test("broken imports: a missing require_relative is flagged", async () => {
  const root = writeProject({ "a.rb": `require_relative 'does_not_exist'\n` });
  const graph = await buildDependencyGraph(root);
  const broken = toolFindBrokenImports(graph).broken.map((b) => b.raw);
  assert.ok(broken.some((r) => r.includes("does_not_exist")), "the missing require_relative is reported broken");
});
