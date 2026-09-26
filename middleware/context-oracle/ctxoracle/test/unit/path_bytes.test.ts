// T-5-4 — The fatal path decoder and the byte escaper (reopened Step 5 build
// delta, gap-list review G7: `decodePathBytes`, `splitNul`, `escapeBytes`).
// Real functions; no doubles. NOT asserted: filesystem behaviour.

import test from 'node:test';
import assert from 'node:assert/strict';
import { decodePathBytes, escapeBytes, splitNul } from '../../src/util/path_bytes.js';

const BAD_FF = Buffer.concat([Buffer.from('bad', 'ascii'), Buffer.from([0xff]), Buffer.from('.txt', 'ascii')]);
const BAD_FE = Buffer.concat([Buffer.from('bad', 'ascii'), Buffer.from([0xfe]), Buffer.from('.txt', 'ascii')]);

test('T-5-4a: café.txt as UTF-8 decodes', () => {
  assert.equal(decodePathBytes(Buffer.from('café.txt', 'utf8')), 'café.txt');
});

test('T-5-4b: an invalid UTF-8 name decodes to null (never U+FFFD)', () => {
  assert.equal(decodePathBytes(BAD_FF), null);
  assert.equal(decodePathBytes(BAD_FE), null);
});

test('T-5-4c: the two invalid names escape distinctly, as bad\\xff.txt and bad\\xfe.txt', () => {
  const ff = escapeBytes(BAD_FF);
  const fe = escapeBytes(BAD_FE);
  assert.equal(ff, 'bad\\xff.txt');
  assert.equal(fe, 'bad\\xfe.txt');
  assert.notEqual(ff, fe);
});

test('T-5-4d: splitNul on a\\0b\\0 returns two fields (the trailing empty field dropped)', () => {
  const fields = splitNul(Buffer.from('a\0b\0', 'binary'));
  assert.equal(fields.length, 2);
  assert.deepEqual(fields.map((f) => f.toString('utf8')), ['a', 'b']);
});

test('T-5-4e: an empty buffer — splitNul yields no field, decodePathBytes yields the empty string', () => {
  // Derived from the Step 5 definitions: the only field of an empty buffer is a
  // trailing empty field (dropped); an empty byte sequence is valid UTF-8.
  assert.deepEqual(splitNul(Buffer.alloc(0)), []);
  assert.equal(decodePathBytes(Buffer.alloc(0)), '');
});
