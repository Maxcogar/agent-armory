"use strict";

// Regression tests for the documentation-reference matcher
// (scanDocForCodeReferences via toolFindRelatedDocs), found by empirically
// running the matcher (2026-05-30 audit). Covers substring false positives
// and the previously-unimplemented directory-reference feature.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolFindRelatedDocs } = require("../dist/tools/query.js");

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-docs-"));
}
function w(root, rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}
async function relatedDocs(root, changed) {
  const graph = await buildDependencyGraph(root);
  return toolFindRelatedDocs(graph, changed).relatedDocs
    .map((d) => d.relativePath)
    .sort();
}

// --- false positives (the stem must not match inside prose words) ---

test("doc matcher: 'app.ts' does not match the word 'happens'", async () => {
  const root = tmp();
  w(root, "app.ts", "export const a = 1;\n");
  w(root, "D.md", "This happens to everyone.\n");
  assert.deepEqual(await relatedDocs(root, ["app.ts"]), []);
});

test("doc matcher: 'api.ts' does not match the word 'rapid'", async () => {
  const root = tmp();
  w(root, "api.ts", "export const a = 1;\n");
  w(root, "D.md", "We use rapid prototyping.\n");
  assert.deepEqual(await relatedDocs(root, ["api.ts"]), []);
});

test("doc matcher: 'auth.ts' does not match inside 'author'", async () => {
  const root = tmp();
  w(root, "auth.ts", "export const a = 1;\n");
  w(root, "D.md", "The author wrote this.\n");
  assert.deepEqual(await relatedDocs(root, ["auth.ts"]), []);
});

// --- legitimate references must still match ---

test("doc matcher: explicit 'app.ts' token still matches", async () => {
  const root = tmp();
  w(root, "app.ts", "export const a = 1;\n");
  w(root, "D.md", "Edit app.ts now.\n");
  assert.deepEqual(await relatedDocs(root, ["app.ts"]), ["D.md"]);
});

test("doc matcher: full relative path matches with and without extension", async () => {
  const rootA = tmp();
  w(rootA, "src/api.ts", "export const a = 1;\n");
  w(rootA, "D.md", "See src/api.ts for details.\n");
  assert.deepEqual(await relatedDocs(rootA, ["src/api.ts"]), ["D.md"]);

  const rootB = tmp();
  w(rootB, "src/api.ts", "export const a = 1;\n");
  w(rootB, "D.md", "See `src/api` for details.\n");
  assert.deepEqual(await relatedDocs(rootB, ["src/api.ts"]), ["D.md"]);
});

// --- directory references (README-documented, previously not implemented) ---

test("doc matcher: directory reference 'src/auth/' matches files under it", async () => {
  const root = tmp();
  w(root, "src/auth/login.ts", "export const l = 1;\n");
  w(root, "D.md", "Everything in src/auth/ is protected.\n");
  assert.deepEqual(await relatedDocs(root, ["src/auth/login.ts"]), ["D.md"]);
});

test("doc matcher: directory reference matches deeply nested files", async () => {
  const root = tmp();
  w(root, "src/auth/oauth/token.ts", "export const t = 1;\n");
  w(root, "D.md", "All of src/auth/ is sensitive.\n");
  assert.deepEqual(
    await relatedDocs(root, ["src/auth/oauth/token.ts"]),
    ["D.md"]
  );
});

// --- blast-radius integration: doc references a dependent of the changed file ---

test("doc matcher: matches a doc referencing a transitive dependent", async () => {
  const root = tmp();
  w(root, "core.ts", "export const c = 1;\n");
  w(root, "feature.ts", "import { c } from './core';\nexport const f = c;\n");
  w(root, "D.md", "The feature.ts module is documented here.\n");
  // Changing core.ts should flag D.md, because feature.ts (which depends on
  // core.ts) is in the blast radius and D.md references feature.ts.
  assert.deepEqual(await relatedDocs(root, ["core.ts"]), ["D.md"]);
});
