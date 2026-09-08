#!/usr/bin/env bash
# Claims (Steps 1, 15; V14): the pinned packages install with no install-phase scripts and no native files; tree-sitter-wasms ships grammars under out/ with no exports map; web-tree-sitter exposes Parser.init, setLanguage, Language.load.
cd "$PROBE_LAYOUT"
node -e "const p=require('./node_modules/tree-sitter-wasms/package.json');console.log('tree-sitter-wasms', p.version, 'files', JSON.stringify(p.files), 'exports', JSON.stringify(p.exports??null), 'scripts', JSON.stringify(Object.keys(p.scripts||{})))"
node -e "const p=require('./node_modules/web-tree-sitter/package.json');console.log('web-tree-sitter', p.version, 'dependencies', JSON.stringify(p.dependencies??{}), 'install-scripts', JSON.stringify(Object.keys(p.scripts||{}).filter(k=>/^(pre|post)?install$/.test(k))))"
echo "wasm grammars: $(ls node_modules/tree-sitter-wasms/out/*.wasm | wc -l)"
echo "native .node files: $(find node_modules -name '*.node' | wc -l)"
grep -c "static init(\|static load(\|setLanguage(" node_modules/web-tree-sitter/web-tree-sitter.d.ts | sed 's/^/API declarations (init,load,setLanguage) present: /'
