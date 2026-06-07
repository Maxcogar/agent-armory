"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolListDocs, toolListFiles } = require("../dist/tools/query.js");

function makeTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-listdocs-test-"));
}

test("toolListDocs enumerates markdown-only projects that list_files cannot", async () => {
  const root = makeTempProject();
  fs.writeFileSync(path.join(root, "README.md"), "# Readme\n");
  fs.writeFileSync(path.join(root, "GUIDE.md"), "# Guide\n");
  fs.mkdirSync(path.join(root, "docs"));
  fs.writeFileSync(path.join(root, "docs", "intro.rst"), "Intro\n");

  const graph = await buildDependencyGraph(root);

  // list_files sees no code files...
  const files = toolListFiles(graph);
  assert.equal(files.total, 0, "expected zero code files in a docs-only project");
  assert.ok(
    files.note && files.note.includes("codegraph_list_docs"),
    "expected an explanatory note pointing at codegraph_list_docs"
  );

  // ...but list_docs finds all three docs.
  const docs = toolListDocs(graph);
  assert.equal(docs.total, 3, "expected all three doc files to be listed");
  assert.deepEqual(
    docs.docs.map((d) => d.relativePath).sort(),
    ["GUIDE.md", "README.md", "docs/intro.rst"].sort()
  );
  for (const d of docs.docs) {
    assert.equal(typeof d.referencedCodeFileCount, "number");
  }
});

test("toolListDocs reports referencedCodeFileCount and paginates", async () => {
  const root = makeTempProject();
  fs.writeFileSync(path.join(root, "lib.ts"), "export const x = 1;\n");
  fs.writeFileSync(
    path.join(root, "API.md"),
    "See lib.ts for the implementation.\n"
  );
  fs.writeFileSync(path.join(root, "NOTES.md"), "Unrelated prose.\n");

  const graph = await buildDependencyGraph(root);

  const docs = toolListDocs(graph);
  assert.equal(docs.total, 2);

  const api = docs.docs.find((d) => d.relativePath === "API.md");
  const notes = docs.docs.find((d) => d.relativePath === "NOTES.md");
  assert.equal(api.referencedCodeFileCount, 1, "API.md references lib.ts");
  assert.equal(notes.referencedCodeFileCount, 0, "NOTES.md references nothing");

  // Pagination: first page of 1, then the remainder.
  const page1 = toolListDocs(graph, 1, 0);
  assert.equal(page1.returned, 1);
  assert.equal(page1.has_more, true);
  const page2 = toolListDocs(graph, 1, 1);
  assert.equal(page2.returned, 1);
  assert.equal(page2.has_more, false);
});
