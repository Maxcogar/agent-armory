"use strict";

// Tests for Stage 4 watch mode. Uses a real fs.watch (recursive, supported on
// this Node 22 / Linux), with generous timing because filesystem events are
// inherently async. Verifies the debounced rescan fires, the single-watcher
// invariant holds, and stop releases the watcher (no further rescans).

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildDependencyGraph, incrementalUpdate } = require("../dist/graph.js");
const { startWatch, stopWatch, isWatching, watchedRoot } = require("../dist/watch.js");

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-watch-"));
}
function w(root, rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wait until `predicate()` is true or the timeout elapses (poll-based).
async function waitFor(predicate, timeoutMs = 3000, stepMs = 50) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return true;
    await sleep(stepMs);
  }
  return false;
}

test("watch: a burst of changes triggers a single debounced rescan that updates the graph", async () => {
  const root = tmp();
  w(root, "a.ts", "export const x = 1;\n");
  let graph = await buildDependencyGraph(root);
  let rescans = 0;

  startWatch(
    root,
    async () => {
      const res = await incrementalUpdate(graph);
      graph = res.graph;
      rescans++;
    },
    100
  );

  try {
    assert.equal(isWatching(), true);
    assert.equal(watchedRoot(), root);

    await sleep(50);
    // Burst of writes — should coalesce into one rescan via debounce.
    w(root, "b.ts", "import './a';\n");
    w(root, "c.ts", "export const z = 1;\n");

    // Absolute graph keys are host-native (backslashes on Windows); compare on
    // a POSIX-normalized form so the suffix check is cross-platform.
    const picked = await waitFor(() =>
      [...graph.nodes.keys()].some((k) => k.replace(/\\/g, "/").endsWith("/b.ts"))
    );
    assert.ok(picked, "graph should pick up the new file");
    assert.equal(rescans, 1, "burst should debounce to a single rescan");
  } finally {
    stopWatch();
  }
});

test("watch: stop releases the watcher and prevents further rescans", async () => {
  const root = tmp();
  w(root, "a.ts", "export const x = 1;\n");
  let graph = await buildDependencyGraph(root);
  let rescans = 0;

  startWatch(
    root,
    async () => {
      const res = await incrementalUpdate(graph);
      graph = res.graph;
      rescans++;
    },
    100
  );

  await sleep(50);
  w(root, "b.ts", "export const y = 1;\n");
  await waitFor(() => rescans >= 1);
  const countAtStop = rescans;

  const stopped = stopWatch();
  assert.equal(stopped, true);
  assert.equal(isWatching(), false);

  // Writes after stop must not trigger rescans.
  w(root, "c.ts", "export const z = 1;\n");
  await sleep(300);
  assert.equal(rescans, countAtStop, "no rescans should occur after stop");
});

test("watch: starting again replaces the prior watcher (single-watcher invariant)", async () => {
  const root1 = tmp();
  const root2 = tmp();
  w(root1, "a.ts", "export const x = 1;\n");
  w(root2, "a.ts", "export const x = 1;\n");

  startWatch(root1, () => {}, 100);
  assert.equal(watchedRoot(), root1);
  // Restart on a different root — the first watcher is closed, only root2 live.
  startWatch(root2, () => {}, 100);
  assert.equal(watchedRoot(), root2);
  assert.equal(isWatching(), true);

  stopWatch();
  assert.equal(isWatching(), false);
});

test("watch: stop is safe when nothing is watching", () => {
  assert.equal(stopWatch(), false);
});
