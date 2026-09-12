// Claims (§4; D-plan-2): under web-tree-sitter 0.26.13 and 0.27.0 (registry
// install, network), Language.load rejects every grammar tree-sitter-wasms
// 0.1.13 ships with an Error whose message is empty — the 0.26+ loader reads
// only a `dylink.0` custom section and every shipped grammar carries the
// legacy `dylink` section — so the pin below 0.26 is forced, not chosen.
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
const grammars = join(process.env.PROBE_LAYOUT, "node_modules/tree-sitter-wasms/out");
const files = readdirSync(grammars).filter((f) => f.endsWith(".wasm")).sort();
const sections = (buf) => { const m = new WebAssembly.Module(buf); return [WebAssembly.Module.customSections(m, "dylink").length, WebAssembly.Module.customSections(m, "dylink.0").length]; };
const { readFileSync } = await import("node:fs");
let legacy = 0, modern = 0;
for (const f of files) { const [a, b] = sections(readFileSync(join(grammars, f))); legacy += a > 0 ? 1 : 0; modern += b > 0 ? 1 : 0; }
console.log(`shipped grammars carrying a legacy "dylink" section: ${legacy} of ${files.length}; carrying "dylink.0": ${modern}`);
for (const v of ["0.26.13", "0.27.0"]) {
  const d = mkdtempSync(join(tmpdir(), "wts-"));
  const r = spawnSync("npm", ["install", "--silent", "--no-audit", "--no-fund", `web-tree-sitter@${v}`], { cwd: d, encoding: "utf8", timeout: 180000 });
  if (r.status !== 0) { console.log(`SKIPPED: network (npm install web-tree-sitter@${v} failed)`); process.exit(0); }
  const { Parser, Language } = await import(pathToFileURL(join(d, "node_modules/web-tree-sitter/web-tree-sitter.js")).href);
  await Parser.init();
  let loaded = 0; const kinds = new Set();
  for (const f of files) { try { await Language.load(join(grammars, f)); loaded++; } catch (e) { kinds.add(`${e?.constructor?.name} with message ${JSON.stringify(String(e?.message ?? ""))}`); } }
  console.log(`web-tree-sitter ${v}: loaded ${loaded} of ${files.length}; failures: ${[...kinds].join("; ")}`);
  rmSync(d, { recursive: true, force: true });
}
