#!/usr/bin/env bash
# Claim (Step 1, D-plan-3): a must-fail fixture inside `include` turns `tsc -p` red; with `exclude` the build is green and a per-fixture `tsc --noEmit` still fails on it.
cd "$PROBE_LAYOUT"; mkdir -p src test/build/fixtures; rm -rf dist
printf 'export const ok: number = 1;\n' > src/ok.ts
printf 'export const x: number = "not a number";\n' > test/build/fixtures/bad.ts
printf 'import { ok } from "../../../src/ok.js";\nexport const y: number = ok;\n' > test/build/fixtures/good.ts
npx tsc -p tsconfig.json >/dev/null 2>&1; echo "build with exclude: exit=$?"; [ -e dist/test/build/fixtures ] && echo "fixtures emitted: yes" || echo "fixtures emitted: no"
sed 's/"exclude": \["test\/build\/fixtures"\]/"exclude": []/' tsconfig.json > tsconfig.noexclude.json
npx tsc -p tsconfig.noexclude.json 2>&1 | grep -o 'error TS[0-9]*' | head -1 | sed 's/^/build without exclude: /'; echo "build without exclude: exit=${PIPESTATUS[0]}"
F="--noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --verbatimModuleSyntax --types node"
npx tsc $F test/build/fixtures/bad.ts 2>&1 | grep -o 'error TS[0-9]*' | head -1 | sed 's/^/per-fixture bad: /'; echo "per-fixture bad: exit=${PIPESTATUS[0]}"
npx tsc $F test/build/fixtures/good.ts >/dev/null 2>&1; echo "per-fixture good: exit=$?"
rm -f tsconfig.noexclude.json
