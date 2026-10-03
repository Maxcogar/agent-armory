// Internal `hook <event> [--deadline-ms <n>]` verb (Step 28): stdin JSON in,
// response JSON out, exit 0 always.
import { readFileSync } from 'node:fs';
import type { EventKind } from '../types/events.js';
import { runHandler } from '../hook/handler.js';

export function hookVerb(args: string[]): number {
  const kind = args[0] as EventKind;
  const i = args.indexOf('--deadline-ms');
  const deadlineMs = i >= 0 ? Number(args[i + 1]) : undefined;
  let stdin = '';
  try {
    stdin = readFileSync(0, 'utf8');
  } catch {
    stdin = '{}';
  }
  const r = runHandler(stdin, kind, deadlineMs !== undefined && Number.isFinite(deadlineMs) ? { deadlineMs } : {});
  if (r.stdout !== '') process.stdout.write(r.stdout);
  return 0;
}
