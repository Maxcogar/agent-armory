// Command-class classifier (Step 17, AD-15). Ternary: 1 = a recognized test run,
// 2 = every segment innocuous, 3 = anything else (the safe default: the
// Verification genre then ships only the weak "no *recognized* test run" claim).
// Splitting is quote-aware; a quoting error, a subshell, or an `sh -c` wrapper is
// class 3 wholesale.

export interface SegmentClass {
  text: string;
  class: 1 | 2 | 3;
}

function splitSegments(cmd: string): string[] | null {
  const out: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i] as string;
    if (quote !== null) {
      if (ch === quote) quote = null;
      else if (ch === '\\' && quote === '"') cur += cmd[++i] ?? '';
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '(' || ch === '`' || (ch === '$' && cmd[i + 1] === '(')) return null;
    const two = cmd.slice(i, i + 2);
    if (two === '&&' || two === '||') {
      out.push(cur);
      cur = '';
      i++;
      continue;
    }
    if (ch === ';' || ch === '|') {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (quote !== null) return null;
  out.push(cur);
  return out.map((s) => s.trim()).filter((s) => s.length > 0);
}

function startsWithEntry(segment: string, lexicon: string[]): boolean {
  return lexicon.some((e) => segment === e || segment.startsWith(`${e} `));
}

export function classifyBashCommand(
  command: string,
  testRunnerLexicon: string[],
  innocuousLexicon: string[]
): { class: 1 | 2 | 3; segments: SegmentClass[] } {
  const segs = splitSegments(command);
  if (segs === null || segs.some((s) => /^(sh|bash|zsh)\s+-c\b/.test(s))) {
    return { class: 3, segments: [{ text: command, class: 3 }] };
  }
  const segments: SegmentClass[] = segs.map((text) => ({
    text,
    class: startsWithEntry(text, testRunnerLexicon) ? 1 : startsWithEntry(text, innocuousLexicon) ? 2 : 3,
  }));
  if (segments.some((s) => s.class === 1)) return { class: 1, segments };
  if (segments.every((s) => s.class === 2)) return { class: 2, segments };
  return { class: 3, segments };
}
