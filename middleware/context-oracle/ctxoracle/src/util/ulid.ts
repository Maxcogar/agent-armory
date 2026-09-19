// ULID generator (Step 9, AD-26). Timestamped rows take ULID ids so concurrent
// handler processes (each event is a fresh process, AD-1) never collide on an
// autoincrement id. A ULID is 26 Crockford-base32 chars: 48-bit millisecond
// timestamp (10 chars) + 80 bits of randomness (16 chars).

import { randomBytes } from 'node:crypto';

// Crockford base32 — excludes I, L, O, U.
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(ms: number): string {
  let n = Math.floor(ms);
  let out = '';
  for (let i = 0; i < 10; i++) {
    out = CROCKFORD[n % 32]! + out;
    n = Math.floor(n / 32);
  }
  return out;
}

function encodeRandom(): string {
  // 256 is a multiple of 32, so `byte % 32` is unbiased over 0..31.
  const bytes = randomBytes(16);
  let out = '';
  for (let i = 0; i < 16; i++) out += CROCKFORD[bytes[i]! % 32]!;
  return out;
}

/** A new ULID for `now` (defaults to the current time). */
export function ulid(now: number = Date.now()): string {
  return encodeTime(now) + encodeRandom();
}
