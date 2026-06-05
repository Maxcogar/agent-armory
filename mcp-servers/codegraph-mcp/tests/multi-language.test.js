"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolTraceSymbol, toolGetSymbol } = require("../dist/tools/query.js");

function projectWith(rel, content) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-ml-"));
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  return root;
}

const cases = {
  Go: ["main.go", `package main\nfunc Helper() int { return 1 }\nfunc Run() int { return Helper() }\n`],
  Rust: ["lib.rs", `pub fn helper() -> i32 { 1 }\npub fn run() -> i32 { helper() }\n`],
  Java: ["A.java", `public class A {\n  int helper() { return 1; }\n  int run() { return helper(); }\n}\n`],
  Ruby: ["a.rb", `def helper\n  1\nend\ndef run\n  helper\nend\n`],
  CSharp: ["A.cs", `class A {\n  int Helper() { return 1; }\n  int Run() { return Helper(); }\n}\n`],
  Php: ["a.php", `<?php\nfunction helper() { return 1; }\nfunction run() { return helper(); }\n`],
};

const targets = { Go: "Helper", Rust: "helper", Java: "helper", Ruby: "helper", CSharp: "Helper", Php: "helper" };
const callers = { Go: "Run", Rust: "run", Java: "run", Ruby: "run", CSharp: "Run", Php: "run" };

for (const [lang, [rel, content]] of Object.entries(cases)) {
  test(`${lang}: symbol is extracted and the chain resolves`, async () => {
    const root = projectWith(rel, content);
    const graph = await buildDependencyGraph(root);

    const sym = toolGetSymbol(graph, targets[lang]);
    assert.equal(sym.found, true, `${lang}: ${targets[lang]} is extracted as a symbol`);

    const res = toolTraceSymbol(graph, targets[lang]);
    assert.ok(!res.error, `${lang}: trace resolves`);
    const upstream = res.usedBy.chain.map((c) => c.name);
    assert.ok(
      upstream.includes(callers[lang]),
      `${lang}: ${callers[lang]} should be upstream of ${targets[lang]} (got ${JSON.stringify(upstream)})`
    );
  });
}

test("dead-export liveness works for a new language (Go) — no false deads", async () => {
  const { toolFindDeadExports } = require("../dist/tools/query.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-go-dead-"));
  fs.writeFileSync(path.join(root, "lib.go"), `package main\nfunc Used() int { return 1 }\nfunc Unused() int { return 2 }\n`);
  fs.writeFileSync(path.join(root, "main.go"), `package main\nfunc main() { Used() }\n`);
  const graph = await buildDependencyGraph(root);
  const dead = toolFindDeadExports(graph);
  const names = dead.dead.map((d) => d.name);
  assert.ok(names.includes("Unused"), "an uncalled exported Go func is dead");
  assert.ok(!names.includes("Used"), "a called one is not dead (no false dead)");
});
