#!/usr/bin/env bash
# Claim (Step 24, T24-3): a module-private `unique symbol` brand rejects an annotated construction of DenyVerdict outside the module (TS2741) but not a type assertion.
cd "$PROBE_LAYOUT"; mkdir -p src/blocks test/build/fixtures
cat > src/blocks/verdict.ts <<'TS'
const denyBrand: unique symbol = Symbol('deny');
export type DenyVerdict = { readonly kind: 'deny'; readonly reason: string; readonly audit_id: string; readonly [denyBrand]: true };
export function makeDenyVerdict(reason: string, auditId: string): DenyVerdict { return { kind: 'deny', reason, audit_id: auditId, [denyBrand]: true }; }
TS
printf "import type { DenyVerdict } from '../../../src/blocks/verdict.js';\nexport function f(): DenyVerdict { return { kind: 'deny', reason: 'x', audit_id: 'y' }; }\n" > test/build/fixtures/deny_annotated.ts
printf "import type { DenyVerdict } from '../../../src/blocks/verdict.js';\nexport const v = { kind: 'deny', reason: 'x', audit_id: 'y' } as DenyVerdict;\n" > test/build/fixtures/deny_cast.ts
F="--noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --verbatimModuleSyntax --types node"
npx tsc $F test/build/fixtures/deny_annotated.ts 2>&1 | grep -o 'error TS[0-9]*' | head -1 | sed 's/^/annotated return: /'; echo "annotated return: exit=${PIPESTATUS[0]}"
npx tsc $F test/build/fixtures/deny_cast.ts >/dev/null 2>&1; echo "type assertion: exit=$?"
rm -f test/build/fixtures/deny_*.ts
