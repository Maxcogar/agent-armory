"use strict";

// The "who uses this symbol" attribution is structural: a reference belongs to
// the declaration whose body *encloses* it, not to whichever declaration happens
// to start on the nearest line above. These cases pin that — each has a reference
// whose line-nearest declaration is the WRONG owner, so a line-proximity
// heuristic would mis-attribute it.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolTraceSymbol } = require("../dist/tools/query.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-attr-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

test("Go: a top-level var initializer attributes to module load, not the line-above function", async () => {
  const root = writeProject({
    "go.mod": `module example.com/app\n\ngo 1.21\n`,
    // `var g = alpha()` sits on the line after beta(); a line-proximity owner
    // would blame beta. It actually runs at package init -> module scope.
    "main.go": `package main\n\nfunc alpha() int { return 1 }\nfunc beta() int { return 2 }\n\nvar g = alpha()\n\nfunc main() { _ = g; _ = beta() }\n`,
  });
  const graph = await buildDependencyGraph(root);
  const users = toolTraceSymbol(graph, "alpha", "main.go").usedBy.chain.map((c) => c.name);

  assert.ok(users.includes("(module top-level)"), "alpha's use is the module-level var initializer");
  assert.ok(!users.includes("beta"), "alpha is NOT used by beta (the line-nearest declaration)");
});

test("Ruby: a class-body reference after a method attributes to the class, not the method", async () => {
  const root = writeProject({
    "lib.rb": `class Helper\nend\n`,
    // `USED = Helper` is a constant in App's body, on a line below method `first`.
    // It belongs to App (the enclosing class), not to `first`.
    "app.rb": `require_relative 'lib'\nclass App\n  def first\n    1\n  end\n  USED = Helper\nend\n`,
  });
  const graph = await buildDependencyGraph(root);
  const users = toolTraceSymbol(graph, "Helper", "lib.rb").usedBy.chain.map((c) => c.name);

  assert.ok(users.includes("App"), "Helper is used by the App class body");
  assert.ok(!users.includes("first"), "Helper is NOT attributed to the line-nearest method `first`");
});

test("Java: a method-body reference attributes to the method, not a sibling declared earlier", async () => {
  const root = writeProject({
    "Dep.java": `package m;\npublic class Dep {}\n`,
    // `early` is declared first; `late` is the method that actually references Dep.
    "Owner.java": `package m;\nimport m.Dep;\npublic class Owner {\n  void early() {}\n  void late() { Dep d = new Dep(); }\n}\n`,
  });
  const graph = await buildDependencyGraph(root);
  const users = toolTraceSymbol(graph, "Dep", "Dep.java").usedBy.chain.map((c) => c.name);

  assert.ok(users.includes("late"), "Dep is used inside method `late`");
  assert.ok(!users.includes("early"), "Dep is NOT attributed to the earlier sibling method `early`");
});
