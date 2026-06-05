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

// A type used purely in a type position (field, parameter, return, var,
// composite literal) — never "called" — must still count as used. These pin the
// Go type-node and inline-FQN-path resolution that earlier missed such uses.

test("Go: an exported type used only as a parameter type + composite literal is NOT dead", async () => {
  const dead = await deadKeys({
    "go.mod": `module example.com/app\n\ngo 1.21\n`,
    "model.go": `package app\ntype User struct { Name string }\n`,
    "service.go": `package app\nfunc Greet(u User) string { return u.Name }\n`,
    "main.go": `package app\nfunc Run() { u := User{Name: "x"}; _ = Greet(u) }\n`,
  });
  assert.ok(!dead.includes("model.go#User"), "User is used as a param type and composite literal");
});

test("Go: an exported type used only across packages as a qualified type is NOT dead", async () => {
  const dead = await deadKeys({
    "go.mod": `module example.com/app\n\ngo 1.21\n`,
    "store/store.go": `package store\ntype Widget struct{}\n`,
    "main.go": `package main\nimport "example.com/app/store"\nfunc Build() store.Widget { return store.Widget{} }\n`,
  });
  assert.ok(!dead.includes(path.join("store", "store.go") + "#Widget"), "Widget is used as store.Widget");
});

test("Rust: symbols referenced via an inline `crate::` path with no `use` are NOT dead", async () => {
  const dead = await deadKeys({
    "src/lib.rs": `pub mod util;\npub mod m;\npub mod app;\n`,
    "src/util.rs": `pub fn helper() -> i32 { 1 }\n`,
    "src/m.rs": `pub struct Inner { pub x: i32 }\n`,
    "src/app.rs": `pub fn run() { let _ = crate::util::helper(); }\npub fn make() -> crate::m::Inner { crate::m::Inner { x: 1 } }\n`,
  });
  assert.ok(!dead.includes(path.join("src", "util.rs") + "#helper"), "helper is used via crate::util::helper()");
  assert.ok(!dead.includes(path.join("src", "m.rs") + "#Inner"), "Inner is used via crate::m::Inner");
});

test("Java: a type referenced by inline package-qualified name with no import is NOT dead", async () => {
  const dead = await deadKeys({
    "store/Store.java": `package store;\npublic class Store {}\n`,
    "web/H.java": `package web;\npublic class H { public void run() { store.Store s = new store.Store(); } }\n`,
  });
  assert.ok(!dead.includes(path.join("store", "Store.java") + "#Store"), "Store is used via the inline FQN store.Store");
});

test("PHP: a class referenced by inline absolute FQN with no `use` is NOT dead", async () => {
  const dead = await deadKeys({
    "Store.php": `<?php\nnamespace App\\Store;\nclass Store {}\n`,
    "H.php": `<?php\nnamespace App\\Web;\nclass H { function run() { $s = new \\App\\Store\\Store(); } }\n`,
  });
  assert.ok(!dead.includes("Store.php#Store"), "Store is used via the inline absolute FQN");
});

test("C++: a definition called via a forward declaration in another .cpp is NOT dead", async () => {
  // No shared header; main.cpp forward-declares helper() and calls it, while the
  // definition lives in a.cpp. The call binds to the prototype, so the definition
  // would look dead without the One-Definition-Rule name guard.
  const dead = await deadKeys({
    "a.cpp": `int helper() { return 1; }\n`,
    "main.cpp": `int helper();\nint main() { return helper(); }\n`,
  });
  assert.ok(!dead.includes("a.cpp#helper"), "the definition of a forward-declared, called function is not dead");
});

test("C++: a genuinely unused function IS still flagged (the name guard doesn't over-suppress)", async () => {
  const dead = await deadKeys({
    "lib.cpp": `int reallyUnused() { return 7; }\nint usedOne() { return 1; }\n`,
    "main.cpp": `int usedOne();\nint main() { return usedOne(); }\n`,
  });
  assert.ok(dead.includes("lib.cpp#reallyUnused"), "an uncalled function with no same-named use is still dead");
});

test("C++: a struct used only as a parameter type is NOT dead, but a truly unused struct IS", async () => {
  // `Widget`/`Used` appear only in type position (never constructed by a call),
  // which a value-only walker would miss; `Unused` is referenced nowhere.
  const dead = await deadKeys({
    "types.h": `struct Used { int x; };\nstruct Unused { int y; };\n`,
    "use.cpp": `#include "types.h"\nint f(Used u) { return u.x; }\nint main() { Used a; return f(a); }\n`,
  });
  assert.ok(!dead.includes("types.h#Used"), "Used is referenced as a parameter/variable type");
  assert.ok(dead.includes("types.h#Unused"), "Unused is genuinely dead and still flagged");
});
