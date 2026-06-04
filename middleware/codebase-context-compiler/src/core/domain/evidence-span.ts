/**
 * Evidence-span helpers (Spec FR7). A span is a 1-based inclusive line range
 * into a file's indexed content; the excerpt is what a reviewer inspects to
 * confirm a fact (NFR1).
 */
export interface LineSpan {
  start_line: number;
  end_line: number;
}

/** Returns the 1-based inclusive line range covering `index..index` window. */
export function lineOfOffset(content: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < content.length; i++) {
    if (content[i] === '\n') line++;
  }
  return line;
}

export function excerpt(content: string, span: LineSpan): string {
  const lines = content.split('\n');
  return lines.slice(span.start_line - 1, span.end_line).join('\n');
}
