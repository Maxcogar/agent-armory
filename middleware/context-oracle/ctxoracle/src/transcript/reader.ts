// Bookmarked JSONL tail + entry discrimination (Step 21, AD-11, AD-23, V12).
// Human turns are recognized by markers — `origin.kind === 'human'` and not
// `isMeta` — never by content shape.
import { closeSync, openSync, readSync, fstatSync } from 'node:fs';

const SLICE = 64 * 1024;

export class TranscriptLayoutChanged extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptLayoutChanged';
  }
}

export type Discriminated =
  | { kind: 'human'; text: string; uuid: string; timestamp: string }
  | { kind: 'assistant_text'; text: string; uuid: string; timestamp: string }
  | { kind: 'skip'; reason: 'meta' | 'task_notification' | 'tool_result' | 'thinking_only' | 'tool_use_only' | 'unknown_shape' };

export const TranscriptReader = {
  /** Read complete lines from `offset` to EOF; a partial trailing line is left
   *  for the next call. Returns the parsed entries and the offset parsed up to. */
  readFrom(file: string, offset: number): { entries: { entry: unknown; endOffset: number }[]; offset: number } {
    const fd = openSync(file, 'r');
    try {
      const size = fstatSync(fd).size;
      if (offset > size) throw new TranscriptLayoutChanged(`bookmark ${offset} beyond size ${size}`);
      const chunks: Buffer[] = [];
      let pos = offset;
      while (pos < size) {
        const buf = Buffer.alloc(Math.min(SLICE, size - pos));
        const n = readSync(fd, buf, 0, buf.length, pos);
        if (n <= 0) break;
        chunks.push(buf.subarray(0, n));
        pos += n;
      }
      const data = Buffer.concat(chunks);
      const entries: { entry: unknown; endOffset: number }[] = [];
      let start = 0;
      for (;;) {
        const nl = data.indexOf(0x0a, start);
        if (nl < 0) break;
        const line = data.subarray(start, nl).toString('utf8').trim();
        start = nl + 1;
        if (line === '') continue;
        try {
          entries.push({ entry: JSON.parse(line), endOffset: offset + start });
        } catch {
          throw new TranscriptLayoutChanged(`unparseable line at ${offset + start}`);
        }
      }
      return { entries, offset: offset + start };
    } finally {
      closeSync(fd);
    }
  },

  discriminateEntry(e: unknown): Discriminated {
    const entry = e as {
      type?: string;
      uuid?: string;
      timestamp?: string;
      isMeta?: boolean;
      origin?: { kind?: string };
      message?: { content?: unknown };
    };
    const uuid = entry.uuid ?? '';
    const timestamp = entry.timestamp ?? '';
    const content = entry.message?.content;
    if (entry.type === 'user') {
      if (entry.isMeta === true) return { kind: 'skip', reason: 'meta' };
      if (entry.origin?.kind === 'task-notification') return { kind: 'skip', reason: 'task_notification' };
      if (Array.isArray(content) && content.some((b) => (b as { type?: string }).type === 'tool_result'))
        return { kind: 'skip', reason: 'tool_result' };
      if (entry.origin?.kind !== 'human') return { kind: 'skip', reason: 'unknown_shape' };
      const text = typeof content === 'string' ? content : Array.isArray(content) ? textOf(content) : null;
      if (text === null) return { kind: 'skip', reason: 'unknown_shape' };
      return { kind: 'human', text, uuid, timestamp };
    }
    if (entry.type === 'assistant') {
      if (!Array.isArray(content)) return { kind: 'skip', reason: 'unknown_shape' };
      const types = content.map((b) => (b as { type?: string }).type);
      if (types.includes('text')) return { kind: 'assistant_text', text: textOf(content), uuid, timestamp };
      if (types.every((t) => t === 'thinking')) return { kind: 'skip', reason: 'thinking_only' };
      return { kind: 'skip', reason: 'tool_use_only' };
    }
    return { kind: 'skip', reason: 'unknown_shape' };
  },
};

function textOf(blocks: unknown[]): string {
  return blocks
    .filter((b) => (b as { type?: string }).type === 'text')
    .map((b) => (b as { text?: string }).text ?? '')
    .join('\n');
}
