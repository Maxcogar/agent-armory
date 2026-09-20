// T-11-2 — the redactor leaves normal code/text alone (Step 11): tokens below
// the entropy threshold or below the minimum length are not redacted.

import test from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../../src/security/redact.js';

const OPTS = { entropyBitsPerChar: 4.0, minTokenLength: 20 };

const negatives: { name: string; input: string }[] = [
  { name: 'variable name', input: 'const userName = getName();' },
  { name: 'url path', input: 'GET /api/v1/users/profile returns 200' },
  { name: 'hex colour', input: 'background: #ffffff;' },
  { name: 'short base64', input: 'small YWJjZGVmZ2g= token' }, // 12 chars, below min length
  { name: 'unicode phrase', input: 'こんにちは、世界。ありがとう' },
  // A realistic ≥20-char code identifier sitting just below the 4.0-bit
  // threshold (getUserProfileByEmailAddress is 28 chars, 3.968 bits/char),
  // rather than a degenerate low-entropy run. This is the case that catches
  // over-redaction of real code: nudge the threshold down or break the token
  // rule and this identifier gets wrongly redacted here (m3, first-round review).
  { name: 'realistic long identifier near the entropy boundary', input: 'const u = getUserProfileByEmailAddress(id);' },
];

test('T-11-2: normal code and text are left unredacted', () => {
  for (const n of negatives) {
    const { redacted, count } = redact(n.input, OPTS);
    assert.equal(count, 0, `${n.name}: nothing should be redacted`);
    assert.equal(redacted, n.input, `${n.name}: output is unchanged`);
  }
});
