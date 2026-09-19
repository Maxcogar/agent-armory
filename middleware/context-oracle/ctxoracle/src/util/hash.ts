// SHA-256 helpers (Step 5). Used for repo-key derivation (repo_key.ts) and, in
// later steps, content hashing. `node:crypto` is a stable core module (not
// Experimental), so it needs no single-importer quarantine.

import { createHash } from 'node:crypto';

/** Lowercase hex SHA-256 digest of `data`. */
export function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/** First `len` hex characters of the SHA-256 digest of `data` (default 12). */
export function sha256Short(data: string | Buffer, len = 12): string {
  return sha256Hex(data).slice(0, len);
}
