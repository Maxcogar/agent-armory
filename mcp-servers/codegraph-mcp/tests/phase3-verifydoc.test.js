"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolVerifyDoc } = require("../dist/tools/query.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-p3-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

test("verify_doc flags invented names (with nearest) and dead references", async () => {
  const root = writeProject({
    "contracts.ts": `export interface PlantIdentificationResponse { commonName: string }`,
    "client.ts": `export interface PlantIdentificationResult { commonName: string }`,
    "ui.ts": `import { PlantIdentificationResult } from './client';\nexport const x = (p: PlantIdentificationResult) => p.commonName;`,
    "doc.md": [
      "# Identify flow",
      "",
      "The flow returns `plantInfo.commonName` and `careRequirements.light`.",
      "It validates against `PlantIdentificationResponse`.",
      "The UI renders `PlantIdentificationResult`.",
    ].join("\n"),
  });
  const graph = await buildDependencyGraph(root);
  const res = toolVerifyDoc(graph, "doc.md");

  const missingTokens = res.missing.map((m) => m.token);
  assert.ok(missingTokens.includes("plantInfo"), "invented camelCase root is flagged");
  assert.ok(missingTokens.includes("careRequirements"), "invented camelCase root is flagged");

  const plantInfo = res.missing.find((m) => m.token === "plantInfo");
  assert.ok(
    plantInfo.nearest.some((n) => n.startsWith("PlantIdentification")),
    "nearest suggests the real Plant* symbols"
  );

  const deadTokens = res.dead.map((d) => d.token);
  assert.ok(deadTokens.includes("PlantIdentificationResponse"), "dead interface referenced as live is flagged");
  assert.ok(!deadTokens.includes("PlantIdentificationResult"), "the live sibling is not flagged");
});

test("verify_doc reports an error for an unknown doc", async () => {
  const root = writeProject({ "a.ts": `export const a = 1;`, "doc.md": "hi" });
  const graph = await buildDependencyGraph(root);
  const res = toolVerifyDoc(graph, "nope.md");
  assert.ok(res.error);
});
