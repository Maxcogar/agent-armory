// Claims (§4, Steps 1, 12, 15, 38; D-plan-2): under the pinned web-tree-sitter,
// every grammar tree-sitter-wasms ships loads except the two below the
// runtime's minimum language ABI, and every default-table grammar can be set
// on a parser and parse without throwing; the four exclusions are named by
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
const excluded = new Set(["elm", "ql", "yaml", "bash"]);
const table = shipped.filter((g) => !excluded.has(g));
let usable = 0; const failed = [];
for (const g of table) {
  try { const p = new Parser(); p.setLanguage(await load(g)); const t = p.parse("\n"); if (!t.rootNode) throw new Error("no root"); usable++; }
  catch (e) { failed.push(`${g}: ${e?.constructor?.name}`); }
}
console.log(`default table (${table.length} grammars): setLanguage + parse without throwing: ${usable}; failed: ${failed.length ? failed.join(", ") : "none"}`);
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
