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

// ---- Added by the 2026-09-26 independent build review. Each case is read from
// Step 5's build delta: `splitNul` returns "fields between NULs, a trailing
// empty field dropped" (only the trailing one); `escapeBytes` keeps "printable
// ASCII 0x20–0x7e except `\`", every other byte as `\xHH`; and the decoder is
// "the one place a path's bytes become a string ... so the two writers of
// `files` can never key one byte string two ways" — so two distinct valid byte
// strings must decode to two distinct strings (a leading EF BB BF must survive).

test('T-5-4f (review): splitNul keeps an empty field between two NULs and drops only the trailing one', () => {
  const fields = splitNul(Buffer.from('a\0\0b\0', 'binary'));
  assert.deepEqual(fields.map((f) => f.toString('utf8')), ['a', '', 'b']);
});

test('T-5-4g (review): escapeBytes escapes the backslash and the bytes just outside 0x20–0x7e, and keeps the range ends', () => {
  assert.equal(escapeBytes(Buffer.from('back\\slash', 'binary')), 'back\\x5cslash');
  assert.equal(escapeBytes(Buffer.from([0x1f, 0x20, 0x7e, 0x7f])), '\\x1f ~\\x7f');
});

test('T-5-4h (review): a leading UTF-8 BOM is kept, so it and the BOM-less name decode to two different paths', () => {
  const withBom = Buffer.from([0xef, 0xbb, 0xbf, 0x61]);
  const plain = Buffer.from('a', 'utf8');
  const a = decodePathBytes(withBom);
  const b = decodePathBytes(plain);
  assert.equal(a, '﻿a');
  assert.notEqual(a, b, 'two byte strings are never keyed as one path');
  assert.deepEqual([...Buffer.from(a ?? '', 'utf8')], [...withBom], 'the decode round-trips to the same bytes');
});
