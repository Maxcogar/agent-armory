// Claims (§4, Steps 1, 12, 15, 38; D-plan-2): under the pinned web-tree-sitter,
// every grammar tree-sitter-wasms ships loads except the two below the
// runtime's minimum language ABI; `yaml` and `bash` throw on parse (scanner
// imports the runtime never exports); and the default-table grammars are
// exactly the remaining ones whose valid sample parses error-free on every
// repeated parse — every candidate is loaded first (as the indexer's init()
// loads each present grammar before any parse), then each sample is parsed
// three times with a fresh Parser each, then once more in a second pass after
// every other grammar has parsed. A parse that returns an ERROR or MISSING node
// counts against a grammar exactly as a throw does, because `lua` loads, never
// throws, and returns ERROR trees for valid source after its first parse in a
// process (Step 15 test writer, 2026-09-26; one parse per grammar, as this
// probe did on 2026-09-11, cannot show it). The five exclusions are named by
// cause. The 0.26/0.27 side of the claim is probe 21.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const layout = process.env.PROBE_LAYOUT;
const { Parser, Language, Query } = await import(pathToFileURL(join(layout, "node_modules/web-tree-sitter/tree-sitter.js")).href);
const dir = pathToFileURL(join(layout, "node_modules/tree-sitter-wasms/out/"));
const version = JSON.parse(readFileSync(join(layout, "node_modules/web-tree-sitter/package.json"), "utf8")).version;
const shipped = readdirSync(dir).filter((f) => f.endsWith(".wasm")).map((f) => f.replace(/^tree-sitter-|\.wasm$/g, "")).sort();
const load = (g) => Language.load(new URL(`tree-sitter-${g}.wasm`, dir).pathname);
await Parser.init();
console.log(`web-tree-sitter ${version}; grammars shipped: ${shipped.length}`);
// ABI: the two legacy grammars are read first, before any large side module
// has consumed heap (their trap is memory-layout-dependent, never asserted).
for (const g of ["elm", "ql"]) {
  const lang = await load(g);
  let msg = "";
  try { new Parser().setLanguage(lang); } catch (e) { msg = String(e.message || e); }
  console.log(`${g}: loads; language ABI ${lang.version}; setLanguage throws: ${msg.replace(/\d+\. Compatibility range .*$/, "N. Compatibility range 13 through 15")}`);
}
// The two unresolved-import exclusions, by cause.
for (const [g, src, label] of [["yaml", "key: value\n", "first parse"], ["bash", "case x in a) ;; esac\n", "a case…esac parse"]]) {
  const p = new Parser(); p.setLanguage(await load(g));
  let kind = "no throw";
  try { p.parse(src); } catch (e) { kind = `${e?.constructor?.name}: ${String(e.message || e)}`; }
  console.log(`${g}: loads; ${label} throws: ${kind}`);
}
{ const p = new Parser(); p.setLanguage(await load("bash")); p.parse("x=1\n");
  let afterThrow = "ok"; try { p.parse("case x in a) ;; esac\n"); } catch {} try { p.parse("x=1\n"); } catch (e) { afterThrow = `throws ${e?.constructor?.name}`; }
  const q = new Parser(); q.setLanguage(await load("bash")); let fresh = "ok"; try { q.parse("x=1\n"); } catch { fresh = "throws"; }
  console.log(`bash: the parser instance that threw is dead afterwards (${afterThrow}); a fresh instance parses (${fresh})`); }
const ts = await load("typescript"); const tp = new Parser(); tp.setLanguage(ts);
const tree = tp.parse("export function f(x: number): number { return x; }\n");
const caps = new Query(ts, "(function_declaration name: (identifier) @fn)").captures(tree.rootNode).map((c) => c.node.text);
console.log(`typescript: root ${tree.rootNode.type}; hasError ${tree.rootNode.hasError}; Query captures ${JSON.stringify(caps)}`);
// One valid sample per candidate grammar (a definition and, where the language
// has one the grammar parses, an import) — the T-15-6 samples.
const SAMPLES = {
  c: '#include "sibling.h"\n\nint answer(void) {\n  return 42;\n}\n',
  c_sharp: 'using Sibling;\n\nclass Sample {\n  int Answer() { return 42; }\n}\n',
  cpp: '#include "sibling.hpp"\n\nint answer() {\n  return 42;\n}\n',
  css: '@import "./sibling.css";\n\n.answer {\n  color: red;\n}\n',
  dart: "import 'sibling.dart';\n\nint answer() {\n  return 42;\n}\n",
  elisp: "(require 'sibling)\n\n(defun answer ()\n  42)\n",
  elixir: 'defmodule Sample do\n  import Sibling\n\n  def answer do\n    42\n  end\nend\n',
  embedded_template: '<%= render "./sibling" %>\n<% def answer; 42; end %>\n',
  go: 'package sample\n\nimport "./sibling"\n\nfunc Answer() int {\n\treturn 42\n}\n',
  html: '<!doctype html>\n<html>\n<head><script src="./sibling.js"></script></head>\n<body><div id="answer"></div></body>\n</html>\n',
  java: 'import sibling.Sibling;\n\nclass Sample {\n  int answer() { return 42; }\n}\n',
  javascript: "import { helper } from './sibling.js';\n\nexport function answer() {\n  return helper();\n}\n",
  json: '{\n  "$ref": "./sibling.json",\n  "answer": 42\n}\n',
  kotlin: 'import sibling.helper\n\nfun answer(): Int {\n    return 42\n}\n',
  lua: 'local sibling = require("sibling")\n\nfunction answer()\n  return 42\nend\n',
  objc: '#import "Sibling.h"\n\nint answer(void) {\n  return 42;\n}\n',
  ocaml: 'open Sibling\n\nlet answer () = 42\n',
  php: "<?php\nrequire_once './sibling.php';\n\nfunction answer() {\n  return 42;\n}\n",
  python: 'from .sibling import helper\n\n\ndef answer():\n    return helper()\n',
  rescript: 'open Sibling\n\nlet answer = () => 42\n',
  ruby: "require_relative './sibling'\n\ndef answer\n  42\nend\n",
  rust: 'mod sibling;\n\nfn answer() -> i32 {\n    42\n}\n',
  scala: 'import sibling.Helper\n\nobject Sample {\n  def answer(): Int = 42\n}\n',
  solidity: 'pragma solidity ^0.8.0;\n\nimport "./Sibling.sol";\n\ncontract Sample {\n  function answer() public pure returns (uint) { return 42; }\n}\n',
  swift: 'import Sibling\n\nfunc answer() -> Int {\n    return 42\n}\n',
  // SystemRDL's only inclusion is the `include preprocessor directive, which
  // the shipped grammar does not parse (an ERROR node), so no import here.
  systemrdl: 'addrmap answer {\n  reg { field {} f; } r;\n};\n',
  tlaplus: '---- MODULE Sample ----\nEXTENDS Sibling\n\nAnswer == 42\n====\n',
  toml: 'include = "./sibling.toml"\n\n[answer]\nvalue = 42\n',
  tsx: "import { helper } from './sibling.js';\n\nexport function Answer() {\n  return <div>{helper()}</div>;\n}\n",
  typescript: "import { helper } from './sibling.js';\n\nexport function answer(): number {\n  return helper();\n}\n",
  vue: "<template>\n  <div>{{ answer }}</div>\n</template>\n<script>\nimport Sibling from './Sibling.vue';\nexport default { name: 'Sample' };\n</script>\n",
  zig: 'const sibling = @import("sibling.zig");\n\nfn answer() i32 {\n    return 42;\n}\n',
};
// The four exclusions by load or throw cause (shown above); every other shipped
// grammar is a candidate.
const excluded = new Set(["elm", "ql", "yaml", "bash"]);
const candidates = shipped.filter((g) => !excluded.has(g));
const missingSample = candidates.filter((g) => !(g in SAMPLES));
if (missingSample.length) throw new Error(`no sample for ${missingSample.join(", ")}`);
// Each parse: a fresh Parser; outcome "ok", "throws <Class>", or "ERROR/MISSING".
const langs = new Map();
// Which parses of `lua` err depends on the process's heap state (executed: its
// first parse is clean when it is loaded early and errs when loaded after the
// others), so a failing grammar is reported by its distinct outcomes, never by
// parse number.
const bad = new Map(); // grammar -> Set of outcomes other than "ok"
const parseOnce = (g) => {
  let outcome = "ok"; let p; let t;
  try {
    p = new Parser(); p.setLanguage(langs.get(g));
    t = p.parse(SAMPLES[g]);
    if (!t?.rootNode) outcome = "no root";
    else if (t.rootNode.hasError) outcome = "ERROR/MISSING";
  } catch (e) { outcome = `throws ${e?.constructor?.name}`; }
  try { t?.delete(); p?.delete(); } catch {}
  if (outcome !== "ok") { if (!bad.has(g)) bad.set(g, new Set()); bad.get(g).add(outcome); }
};
for (const g of candidates) {
  try { langs.set(g, await load(g)); } catch (e) { bad.set(g, new Set([`load throws ${e?.constructor?.name}`])); }
}
for (const g of candidates) if (langs.has(g)) for (let n = 1; n <= 3; n++) parseOnce(g);
for (const g of candidates) if (langs.has(g)) parseOnce(g);
const table = candidates.filter((g) => !bad.has(g));
console.log(`candidates (${candidates.length} grammars; all loaded, then each valid sample parsed 3 times with a fresh Parser each and once more after every other grammar has parsed): error-free on every parse: ${table.length}; not usable: ${bad.size ? [...bad].map(([g, o]) => `${g} (${[...o].join(", ")})`).join("; ") : "none"}`);
console.log(`default table (${table.length} grammars): ${table.join(" ")}`);
// Exit once stdout has drained: with every candidate grammar loaded, Node's
// own teardown of the WASM heap takes ~17 s after the last line (measured
// 2026-09-26), which is not part of any claim here.
process.stdout.write("", () => process.exit(0));
