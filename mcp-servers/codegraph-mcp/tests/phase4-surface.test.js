"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph } = require("../dist/graph.js");
const { toolListEndpoints, toolFindBridges } = require("../dist/tools/query.js");

function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-p4-"));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

test("list_endpoints finds Express, FastAPI, and Next routes", async () => {
  const root = writeProject({
    "server.ts": `const app = express();\napp.get('/users', (req, res) => res.end());\napp.post('/users/:id', (req, res) => res.end());`,
    "api.py": `from fastapi import FastAPI\napp = FastAPI()\n@app.get("/items")\ndef items():\n    return []`,
    "app/health/route.ts": `export function GET() { return new Response('ok'); }`,
  });
  const graph = await buildDependencyGraph(root);
  const { endpoints } = toolListEndpoints(graph);
  const sig = endpoints.map((e) => `${e.method} ${e.route} [${e.framework}]`);
  assert.ok(sig.includes("GET /users [express]"));
  assert.ok(sig.includes("POST /users/:id [express]"));
  assert.ok(sig.includes("GET /items [fastapi]"));
  assert.ok(sig.includes("GET /health [next]"));
});

test("find_bridges connects an MQTT publisher and a wildcard subscriber across languages", async () => {
  const root = writeProject({
    "device.py": `client.publish("sensors/esp32/temp", 22)`,
    "hub.ts": `mqttClient.subscribe("sensors/+/temp");`,
  });
  const graph = await buildDependencyGraph(root);
  const { bridges } = toolFindBridges(graph);
  const mqtt = bridges.find((b) => b.kind === "mqtt" && b.key === "sensors/esp32/temp");
  assert.ok(mqtt, "the concrete topic forms a bridge");
  assert.equal(mqtt.status, "connected");
  assert.equal(mqtt.crossLanguage, true);
  assert.ok(mqtt.producers.some((p) => p.relativePath === "device.py"));
  assert.ok(mqtt.consumers.some((c) => c.relativePath === "hub.ts"));
});

test("find_bridges flags an HTTP call with no matching endpoint as no-producer", async () => {
  const root = writeProject({
    "server.ts": `const app = express();\napp.get('/api/data', (req, res) => res.end());`,
    "client.ts": `fetch('/api/data');\nfetch('/api/missing');`,
  });
  const graph = await buildDependencyGraph(root);
  const { bridges } = toolFindBridges(graph);

  const data = bridges.find((b) => b.kind === "http" && b.key === "/api/data");
  assert.equal(data.status, "connected", "endpoint + fetch to the same path connect");

  const missing = bridges.find((b) => b.kind === "http" && b.key === "/api/missing");
  assert.equal(missing.status, "no-producer", "a fetch to an undefined endpoint is flagged");
});
