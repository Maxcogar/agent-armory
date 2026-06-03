/**
 * Secret detection + redaction (Spec SR2; Architecture D11/T1). Runs in the
 * indexer BEFORE content reaches storage/FTS, so the stored index and any
 * generated package cannot leak detected secret values. The non-sensitive
 * fact (which key exists, what kind of secret) is preserved for reasoning.
 */
import type { SecretRedactor } from '../core/ports/security.js';
import { redactionMarker } from './redaction.js';

interface Pattern { kind: string; re: RegExp }

const PATTERNS: Pattern[] = [
  { kind: 'aws_access_key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { kind: 'private_key_block', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g },
  { kind: 'github_token', re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { kind: 'slack_token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { kind: 'jwt', re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g },
  { kind: 'bearer_token', re: /\b[Bb]earer\s+[A-Za-z0-9._-]{20,}\b/g },
];

// key = "value" style assignments where the key name implies a secret.
const ASSIGNMENT_RE =
  /\b([A-Za-z0-9_]*(?:secret|password|passwd|token|api[_-]?key|apikey|access[_-]?key|client[_-]?secret|private[_-]?key)[A-Za-z0-9_]*)\b(\s*[:=]\s*)(['"]?)([^'"\s,;]{6,})\3/gi;

export class SecretScanner implements SecretRedactor {
  redact(_path: string, content: string): string {
    let out = content;
    for (const p of PATTERNS) {
      out = out.replace(p.re, redactionMarker(p.kind));
    }
    out = out.replace(ASSIGNMENT_RE, (_m, key: string, sep: string, q: string) =>
      `${key}${sep}${q}${redactionMarker('secret')}${q}`);
    return out;
  }
}
