// Secret redactor (Step 11, AD-19, FR-X1). Runs at every ingress. Named-pattern
// rules for known secret shapes, then a high-entropy-token heuristic for
// everything else. Replacements use the stable marker `[redacted:<kind>]`. The
// entropy thresholds are explicit parameters — production callers pass the
// `security.entropy_*` tuning rows (Step 12); the unit tests pass literals.
//
// This is best-effort by design (L5): it reduces, not eliminates, secret leakage,
// which is why suspect content is also pointer-only and confidence-capped
// downstream (AD-19). Missed secrets are a corrections signal, not a silent loss.

export interface RedactOptions {
  entropyBitsPerChar?: number;
  minTokenLength?: number;
}

export interface RedactResult {
  redacted: string;
  count: number;
}

const NAMED_PATTERNS: { kind: string; re: RegExp }[] = [
  // PEM private-key blocks first (multi-line; would otherwise be seen as tokens).
  { kind: 'pem', re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g },
  { kind: 'aws_key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { kind: 'github_pat', re: /\bghp_[0-9A-Za-z]{36}\b/g },
  { kind: 'github_pat', re: /\bgithub_pat_[0-9A-Za-z_]{40,}\b/g },
  { kind: 'jwt', re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g },
  // KEY=value / KEY: value credential forms with a credential-ish key name.
  {
    kind: 'credential',
    re: /\b(?:password|passwd|secret|token|api[_-]?key|apikey|access[_-]?key|auth[_-]?token|credentials?)\s*[=:]\s*\S+/gi,
  },
];

const TOKEN = /[A-Za-z0-9+/=_-]+/g;

/** Shannon entropy of `s` in bits per character. */
function bitsPerChar(s: string): number {
  const freq = new Map<string, number>();
  for (const c of s) freq.set(c, (freq.get(c) ?? 0) + 1);
  let h = 0;
  for (const n of freq.values()) {
    const p = n / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

export function redact(input: string, opts: RedactOptions = {}): RedactResult {
  const minLen = opts.minTokenLength ?? 20;
  const bits = opts.entropyBitsPerChar ?? 4.0;
  let count = 0;
  let out = input;

  for (const { kind, re } of NAMED_PATTERNS) {
    out = out.replace(re, () => {
      count++;
      return `[redacted:${kind}]`;
    });
  }

  out = out.replace(TOKEN, (tok) => {
    if (tok.length >= minLen && bitsPerChar(tok) > bits) {
      count++;
      return '[redacted:high_entropy]';
    }
    return tok;
  });

  return { redacted: out, count };
}
