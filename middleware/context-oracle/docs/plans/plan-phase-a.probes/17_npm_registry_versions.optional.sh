#!/usr/bin/env bash
# Claims (§3, §11.4, D-plan-2): registry facts for the four pinned packages.
v=$(npm view typescript@5.9.3 version 2>/dev/null) || { echo "SKIPPED: network"; exit 0; }; [ -z "$v" ] && { echo "SKIPPED: network"; exit 0; }
echo "typescript 5.9.3 exists: $v; published $(npm view typescript time --json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["5.9.3"][:10])')"
echo "typescript latest major: $(npm view typescript version 2>/dev/null | cut -d. -f1)"
echo "@types/node 22.20.1 exists: $(npm view @types/node@22.20.1 version 2>/dev/null)"
echo "web-tree-sitter 0.25.10 dependencies: $(npm view web-tree-sitter@0.25.10 dependencies --json 2>/dev/null | tr -d '\n '); 0.25.10 published $(npm view web-tree-sitter time --json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["0.25.10"][:10])'); newest 0.25.x: $(npm view web-tree-sitter versions --json 2>/dev/null | python3 -c 'import sys,json;print([v for v in json.load(sys.stdin) if v.startswith("0.25.")][-1])')"
echo "@types/emscripten 1.41.6 exists: $(npm view @types/emscripten@1.41.6 version 2>/dev/null); dependencies: $(npm view @types/emscripten@1.41.6 dependencies --json 2>/dev/null | tr -d '\n ')"
echo "tree-sitter-wasms 0.1.13 scripts: $(npm view tree-sitter-wasms@0.1.13 scripts --json 2>/dev/null | tr -d '\n ')"
