export const CTXPACK_PLAN_OPEN = '<CTXPACK_PLAN>';
export const CTXPACK_PLAN_CLOSE = '</CTXPACK_PLAN>';

const PLAN_RE = /<CTXPACK_PLAN>([\s\S]*?)<\/CTXPACK_PLAN>/g;

export function extractLatestCtxpackPlan(text: string): string | null {
  let latest: string | null = null;
  for (const match of text.matchAll(PLAN_RE)) {
    const body = match[1]?.trim();
    if (body) latest = body;
  }
  return latest;
}

export function transcriptText(rawTranscript: string): string {
  const parts: string[] = [];
  for (const line of rawTranscript.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      collectText(JSON.parse(trimmed), parts);
    } catch {
      parts.push(trimmed);
    }
  }
  return parts.join('\n');
}

function collectText(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value);
    return;
  }
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const item of value) collectText(item, out);
    return;
  }

  const obj = value as Record<string, unknown>;
  if (typeof obj['text'] === 'string') out.push(obj['text']);
  collectText(obj['content'], out);
  collectText(obj['message'], out);
}
