#!/usr/bin/env bash
# Claim (Step 1): under the Step 1 tsconfig, TypeScript (the pinned 5.9.3 from
# layout/prepare.sh) preserves a leading `#!/usr/bin/env node` shebang verbatim
# as the emitted .js file's first line, and the emitted bin target exits
# non-zero when invoked (the Step 1 stub does no work). Compiled in isolation
# from a dedicated source dir so leftovers from earlier probes cannot affect
# it. Only the stable properties are printed; the compiler version and paths
# are not (they are environment-incidental).
cd "$PROBE_LAYOUT"
rm -rf shebang_src shebang_out; mkdir -p shebang_src
cat > shebang_src/entry.ts <<'TS'
#!/usr/bin/env node
const verb: string | undefined = process.argv[2];
switch (verb) {
  default:
    process.exit(1);
}
TS
npx tsc --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --verbatimModuleSyntax --types node --outDir shebang_out shebang_src/entry.ts >/dev/null 2>&1
first=$(head -1 shebang_out/entry.js 2>/dev/null)
[ "$first" = '#!/usr/bin/env node' ] && echo "tsc emits shebang verbatim as first line: true" || echo "tsc emits shebang verbatim as first line: false"
chmod +x shebang_out/entry.js 2>/dev/null
./shebang_out/entry.js someverb >/dev/null 2>&1; rc=$?
[ "$rc" -ne 0 ] && echo "shebang-invoked stub exits non-zero: true" || echo "shebang-invoked stub exits non-zero: false"
node shebang_out/entry.js >/dev/null 2>&1; rc=$?
[ "$rc" -ne 0 ] && echo "node-invoked stub exits non-zero: true" || echo "node-invoked stub exits non-zero: false"
rm -rf shebang_src shebang_out
