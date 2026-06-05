"use strict";

// Reproductions of the false-"dead" soundness bugs found in review. Each builds
// real code where a symbol IS used, and asserts find_dead_exports does NOT flag
// it. These failed before the fixes; they are the cases the earlier tests dodged.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolFindDeadExports } = require("../dist/tools/query.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-sound-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}
const deadKeys = async (files) => {
  const graph = await buildDependencyGraph(writeProject(files));
  return toolFindDeadExports(graph).dead.map((d) => `${d.relativePath}#${d.name}`);
};

test("C++: a .cpp definition used via its header is NOT dead (header/impl split)", async () => {
  const dead = await deadKeys({
    "sensor.h": `int readSensor();\n`,
    "sensor.cpp": `#include "sensor.h"\nint readSensor() { return 1; }\n`,
    "main.cpp": `#include "sensor.h"\nint main() { return readSensor(); }\n`,
  });
  assert.ok(!dead.includes("sensor.cpp#readSensor"), "the .cpp definition of a used function must not be dead");
});

test("Go: a symbol in a package whose name != dir name is NOT dead", async () => {
  const dead = await deadKeys({
    "go.mod": `module example.com/app\n\ngo 1.21\n`,
    "utilpkg/u.go": `package fancy\nfunc DoWork() int { return 1 }\n`,
    "main.go": `package main\n\nimport "example.com/app/utilpkg"\n\nfunc main() { fancy.DoWork() }\n`,
  });
  assert.ok(!dead.includes(path.join("utilpkg", "u.go") + "#DoWork"), "DoWork is used via fancy.DoWork()");
});

test("Python: a symbol used via `from mod import *` is NOT dead", async () => {
  const dead = await deadKeys({
    "helpers.py": `def star_fn():\n    return 1\n`,
    "main.py": `from helpers import *\n\ndef run():\n    return star_fn()\n`,
  });
  assert.ok(!dead.includes("helpers.py#star_fn"), "star_fn is used through the wildcard import");
});

test("Rust: a symbol in an inline `mod {}` used via `use` is NOT dead", async () => {
  const dead = await deadKeys({
    "src/lib.rs": `pub mod helpers;\npub mod app;\n`,
    "src/helpers.rs": `pub mod inner { pub struct Thing { pub x: i32 } }\n`,
    "src/app.rs": `use crate::helpers::inner::Thing;\npub fn run() { let _ = Thing { x: 1 }; }\n`,
  });
  assert.ok(!dead.includes(path.join("src", "helpers.rs") + "#Thing"), "Thing is used via the inline-mod use path");
  // module declarations are namespaces, not dead-code candidates
  assert.ok(!dead.some((k) => /#(helpers|app|inner)$/.test(k)), "Rust `mod` declarations are not flagged dead");
});
