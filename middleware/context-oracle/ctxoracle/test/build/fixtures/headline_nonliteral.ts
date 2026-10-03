// Must-fail fixture for T-6-3 (reopened Step 6 build delta, G24). `lit` accepts
// only a string literal written in the genre module; passing a `string`-typed
// value must be a TypeScript error (TS2345), so this file must not compile.
// Excluded from the project build; only compiled by compileFixture.

import { lit } from '../../../src/types/headline.js';

const s: string = process.argv[2] ?? '';
lit(s);
