#!/usr/bin/env bash
# Claims (Step 1, D-plan-2): a source file importing web-tree-sitter compiles
# under the plan's tsconfig only with @types/emscripten installed —
# web-tree-sitter's d.ts references the global EmscriptenModule and declares
# @types/emscripten an optional peer, which npm does not install.
set -u
cd "$PROBE_LAYOUT"
mkdir -p src
cat > src/probe_wts_import.ts <<'TS'
import { Parser, Language, Query } from "web-tree-sitter";
export async function parseOne(wasm: string, source: string): Promise<string> {
  await Parser.init();
  const lang = await Language.load(wasm);
  const parser = new Parser();
  parser.setLanguage(lang);
  const tree = parser.parse(source);
  const q = new Query(lang, "(function_declaration name: (identifier) @fn)");
  return `${tree?.rootNode.type ?? "none"}:${q.captures(tree!.rootNode).length}`;
}
TS
npx tsc -p tsconfig.json >/tmp/probe22.out 2>&1; rc=$?
echo "with the pinned @types/emscripten: tsc exit $rc; dist/src/probe_wts_import.js emitted: $([ -f dist/src/probe_wts_import.js ] && echo true || echo false)"
npx tsc -p tsconfig.json --types node >/tmp/probe22b.out 2>&1; rc=$?
echo "with @types/emscripten excluded (--types node): tsc exit $rc; TS2304 'EmscriptenModule' reported: $(grep -q "TS2304.*EmscriptenModule" /tmp/probe22b.out && echo true || echo false)"
rm -f src/probe_wts_import.ts dist/src/probe_wts_import.js dist/src/probe_wts_import.d.ts /tmp/probe22.out /tmp/probe22b.out
