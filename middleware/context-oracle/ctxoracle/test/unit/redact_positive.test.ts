// T-11-1 — the redactor replaces known secret shapes and a high-entropy token
// (Step 11). One canonical example per pattern; literal thresholds (4.0, 20).

import test from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../../src/security/redact.js';

const OPTS = { entropyBitsPerChar: 4.0, minTokenLength: 20 };
const MARKER = /\[redacted:[a-z_]+\]/;

const cases: { name: string; input: string; secret: string }[] = [
  { name: 'aws', input: 'key = AKIAIOSFODNN7EXAMPLE end', secret: 'AKIAIOSFODNN7EXAMPLE' },
  { name: 'github', input: 'tok ghp_abcdefghijklmnopqrstuvwxyz0123456789 x', secret: 'ghp_abcdefghijklmnopqrstuvwxyz0123456789' },
  {
    name: 'jwt',
    input: 'auth eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJVadQssw5c z',
    secret: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJVadQssw5c',
  },
  {
    name: 'pem',
    input: '-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAKj34GkxFhD\n-----END RSA PRIVATE KEY-----',
    secret: 'MIIBOgIBAAJBAKj34GkxFhD',
  },
  { name: 'credential', input: 'config PASSWORD=hunter2 done', secret: 'hunter2' },
  { name: 'high-entropy', input: 'blob aB3xK9mZ2pQ7wR5tY8uL1nD4vF6hJ0sC more', secret: 'aB3xK9mZ2pQ7wR5tY8uL1nD4vF6hJ0sC' },
];

test('T-11-1: every secret shape is redacted with a well-formed marker', () => {
  for (const c of cases) {
    const { redacted, count } = redact(c.input, OPTS);
    assert.ok(count >= 1, `${c.name}: at least one redaction`);
    assert.equal(redacted.includes(c.secret), false, `${c.name}: the secret must not survive`);
    assert.match(redacted, MARKER, `${c.name}: a well-formed marker is present`);
  }
});
