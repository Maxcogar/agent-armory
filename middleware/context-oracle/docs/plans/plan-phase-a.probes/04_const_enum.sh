#!/usr/bin/env bash
# Claim (Step 6): under the Step 1 tsconfig a `const enum` cannot be enumerated at runtime from the same compilation; an `as const` tuple can.
cd "$PROBE_LAYOUT"; mkdir -p src/enumprobe; rm -rf dist
printf "export const enum FaultCode { A = 'hooks_not_firing', B = 'latency_breach' }\nexport const FAULT_CODES = ['hooks_not_firing', 'latency_breach'] as const;\n" > src/enumprobe/codes.ts
printf "import { FaultCode, FAULT_CODES } from './codes.js';\nexport const n = Object.values(FaultCode as unknown as object).length;\nexport const m = FAULT_CODES.length;\n" > src/enumprobe/use.ts
npx tsc -p tsconfig.json 2>&1 | grep -o 'error TS[0-9]*' | head -1 | sed 's/^/const enum Object.values: /'; echo "exit=${PIPESTATUS[0]}"
rm -rf src/enumprobe
