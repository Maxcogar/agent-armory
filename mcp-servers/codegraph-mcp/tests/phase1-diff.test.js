"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolDiffSurface } = require("../dist/tools/query.js");

test("diff_surface reports added, removed, and kind-changed exports", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-diff-"));
  const file = path.join(root, "a.ts");

  fs.writeFileSync(file, `export const keep = 1;\nexport const removeMe = 2;\nexport interface Shape { x: number }`);
  const baseline = await buildDependencyGraph(root);

  fs.writeFileSync(file, `export const keep = 1;\nexport const added = 3;\nexport type Shape = { x: number }`);
  const current = await buildDependencyGraph(root);

  const diff = toolDiffSurface(current, baseline);
  assert.equal(diff.hasBaseline, true);
  assert.deepEqual(diff.added.map((e) => e.name), ["added"]);
  assert.deepEqual(diff.removed.map((e) => e.name), ["removeMe"]);
  assert.equal(diff.signatureChanged.length, 1);
  assert.deepEqual(
    { name: diff.signatureChanged[0].name, before: diff.signatureChanged[0].before, after: diff.signatureChanged[0].after },
    { name: "Shape", before: "interface", after: "type" }
  );
});

test("diff_surface with no baseline reports hasBaseline false", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-diff-nb-"));
  fs.writeFileSync(path.join(root, "a.ts"), `export const a = 1;`);
  const current = await buildDependencyGraph(root);
  const diff = toolDiffSurface(current, null);
  assert.equal(diff.hasBaseline, false);
  assert.equal(diff.addedCount, 0);
});
