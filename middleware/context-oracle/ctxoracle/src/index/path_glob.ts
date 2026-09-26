// The in-house test-path glob matcher (Step 14, AD-12 — ER m3).
//
// The dialect AD-12 states, and nothing more: a pattern is matched against the
// repository-relative POSIX path, anchored at the repository root; `*` matches
// any characters within one path segment; `**` (a whole segment) matches zero
// or more whole segments; `?` matches one character within a segment. No
// braces, character classes, or negation. Node's `path.matchesGlob` is
// experimental on Node 22, so the matcher takes no dependency on it.

const segmentCache = new Map<string, RegExp>();

/** One pattern segment (no `/`) as an anchored regex: `*` → any run, `?` → one character, the rest literal. */
function segmentRegex(seg: string): RegExp {
  const cached = segmentCache.get(seg);
  if (cached !== undefined) return cached;
  let src = '';
  for (const ch of seg) {
    if (ch === '*') src += '[^/]*';
    else if (ch === '?') src += '[^/]';
    else src += ch.replace(/[\\^$.|+(){}[\]]/g, '\\$&');
  }
  const re = new RegExp(`^${src}$`, 'u');
  segmentCache.set(seg, re);
  return re;
}

function matchFrom(p: readonly string[], i: number, g: readonly string[], j: number): boolean {
  if (j === g.length) return i === p.length;
  if (g[j] === '**') {
    for (let k = i; k <= p.length; k++) if (matchFrom(p, k, g, j + 1)) return true;
    return false;
  }
  if (i === p.length) return false;
  return segmentRegex(g[j] as string).test(p[i] as string) && matchFrom(p, i + 1, g, j + 1);
}

export function matchesTestPattern(path: string, pattern: string): boolean {
  return matchFrom(path.split('/'), 0, pattern.split('/'), 0);
}
