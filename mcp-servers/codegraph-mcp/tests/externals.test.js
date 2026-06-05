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

// A *local* import that points at nothing is a genuine bug; an import of a
// third-party/stdlib name is not. These pin that distinction per language:
// only the unambiguously-local, unresolvable references are reported.
test("broken imports: local references to missing files are flagged per language", async () => {
  const root = writeProject({
    "main.cpp": `#include "missing.h"\n#include <vector>\nint main() { return 0; }\n`,
    "pkg/__init__.py": ``,
    "pkg/mod.py": `from .gone import thing\nimport os\n`,
    "src/a.ts": `import { x } from "./nope";\nimport { join } from "path";\nexport const y = x;\n`,
  });
  const graph = await buildDependencyGraph(root);
  const broken = toolFindBrokenImports(graph).broken;
  const raws = broken.map((b) => b.raw);

  assert.ok(raws.includes("missing.h"), "C++: a quoted include of a missing header is broken");
  assert.ok(raws.includes(".gone"), "Python: a relative import of a missing module is broken");
  assert.ok(raws.includes("./nope"), "TS: a relative import of a missing file is broken");

  // The well-formed third-party/stdlib references must NOT be reported broken.
  assert.ok(!raws.includes("vector"), "C++ <vector> is a system include, not broken");
  assert.ok(!raws.includes("os"), "Python stdlib `os` is not broken");
  assert.ok(!raws.includes("path"), "TS bare `path` import is external, not broken");
  assert.equal(broken.length, 3, "exactly the three local-but-missing imports are flagged");
});

// FQN languages name a type by namespace; an import that resolves to no project
// type is treated as third-party (external), never as a false "broken". This
// pins the conservative classification that keeps the report trustworthy.
test("broken imports: an unresolvable FQN import is external, not falsely broken", async () => {
  const root = writeProject({
    "Handler.php": `<?php\nnamespace App\\Web;\nuse Vendor\\Lib\\Thing;\nclass Handler { function run() { new Thing(); } }\n`,
  });
  const graph = await buildDependencyGraph(root);
  const ext = toolListExternalDependencies(graph).externals.map((e) => e.name);
  assert.ok(ext.includes("Vendor"), "the unresolved FQN import is reported as an external dependency");
  assert.equal(toolFindBrokenImports(graph).count, 0, "no false 'broken' for a third-party FQN import");
});
