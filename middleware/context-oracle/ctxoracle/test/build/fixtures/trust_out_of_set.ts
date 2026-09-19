// Must-fail fixture for T-11-5 (Step 11). Assigning an out-of-set value to a
// Trust-typed variable must be a TypeScript error, so this file must not compile.
// Excluded from the project build; only compiled by compileFixture.

import type { Trust } from '../../../src/security/trust.js';

const t: Trust = 'trusted';
void t;
