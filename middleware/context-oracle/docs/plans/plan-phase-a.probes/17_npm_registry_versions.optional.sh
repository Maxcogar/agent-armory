#!/usr/bin/env bash
# Claims (§3, §11.4, D-plan-2): registry facts for the four pinned packages.
v=$(npm view typescript@5.9.3 version 2>/dev/null) || { echo "SKIPPED: network"; exit 0; }; [ -z "$v" ] && { echo "SKIPPED: network"; exit 0; }
echo "typescript 5.9.3 exists: $v; published $(npm view typescript time --json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["5.9.3"][:10])')"
echo "typescript latest major: $(npm view typescript version 2>/dev/null | cut -d. -f1)"
echo "@types/node 22.20.1 exists: $(npm view @types/node@22.20.1 version 2>/dev/null)"
echo "web-tree-sitter 0.26.13 dependencies: $(npm view web-tree-sitter@0.26.13 dependencies --json 2>/dev/null | tr -d '\n '); 0.26.13 published $(npm view web-tree-sitter time --json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["0.26.13"][:10])')"
echo "tree-sitter-wasms 0.1.13 scripts: $(npm view tree-sitter-wasms@0.1.13 scripts --json 2>/dev/null | tr -d '\n ')"
