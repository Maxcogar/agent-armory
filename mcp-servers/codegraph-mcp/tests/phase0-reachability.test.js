"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const {
  toolGetChangeImpact,
  toolFindUnreachable,
  toolFindClusters,
} = require("../dist/tools/query.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-p0-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

const rels = (refs) => refs.map((r) => r.relativePath).sort();

test("change-impact: exclude_type_only drops a type-only importer", async () => {
  const root = writeProject({
    "b.ts": `export interface B { n: number }`,
    "a.ts": `import type { B } from './b';\nexport const a: B = { n: 1 };`,
  });
  const graph = await buildDependencyGraph(root);

  const normal = toolGetChangeImpact(graph, ["b.ts"], false);
  assert.ok(rels(normal.directlyAffected).includes("a.ts"), "default impact counts the type importer");

  const runtime = toolGetChangeImpact(graph, ["b.ts"], true);
  assert.equal(runtime.totalImpacted, 0, "type-only importer is excluded from runtime blast radius");
});

test("find_unreachable: a dead cycle is reported, live files are not", async () => {
  const root = writeProject({
    "main.ts": `import { x } from './live';\nexport const m = x;`,
    "live.ts": `export const x = 1;`,
    "deadA.ts": `import { b } from './deadB';\nexport const a = b;`,
    "deadB.ts": `import { a } from './deadA';\nexport const b = a;`,
  });
  const graph = await buildDependencyGraph(root);
  const { unreachable } = toolFindUnreachable(graph);
  const got = rels(unreachable);
  assert.deepEqual(got, ["deadA.ts", "deadB.ts"]);
  assert.ok(!got.includes("main.ts") && !got.includes("live.ts"), "reachable files are live");
});

test("find_unreachable: prod file used only by a test is dead unless include_tests", async () => {
  const root = writeProject({
    "prod.ts": `export const p = 1;`,
    "prod.test.ts": `import { p } from './prod';\nexport const t = p;`,
  });
  const graph = await buildDependencyGraph(root);

  const excluded = toolFindUnreachable(graph, undefined, false);
  assert.deepEqual(rels(excluded.unreachable), ["prod.ts"], "test-only prod code is dead by default");

  const included = toolFindUnreachable(graph, undefined, true);
  assert.deepEqual(rels(included.unreachable), [], "with include_tests, the test keeps prod alive");
});

test("find_clusters: two disjoint islands are two clusters", async () => {
  const root = writeProject({
    "a.ts": `import { b } from './b';\nexport const a = b;`,
    "b.ts": `export const b = 1;`,
    "c.ts": `import { d } from './d';\nexport const c = d;`,
    "d.ts": `export const d = 1;`,
  });
  const graph = await buildDependencyGraph(root);
  const { clusters, count } = toolFindClusters(graph, 2, false);
  assert.equal(count, 2);
  assert.deepEqual(clusters.map((c) => c.size).sort(), [2, 2]);
});
