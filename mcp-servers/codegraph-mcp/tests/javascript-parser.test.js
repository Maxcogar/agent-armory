"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { parseJavaScriptDependencies } = require("../dist/parsers/javascript.js");

function makeTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "codegraph-parser-test-"));
  return root;
}

test("parseJavaScriptDependencies resolves Node16-style .js import to .ts source", () => {
  const root = makeTempProject();
  const fooTs = path.join(root, "foo.ts");
  const barTs = path.join(root, "bar.ts");

  fs.writeFileSync(fooTs, "export const x = 1;\n");
  fs.writeFileSync(
    barTs,
    "import { x } from './foo.js';\nexport const y = x + 1;\n"
  );

  const deps = parseJavaScriptDependencies(barTs, root);

  assert.deepEqual(
    deps,
    [fooTs],
    "expected bar.ts to resolve './foo.js' to the actual foo.ts source file"
  );
});
