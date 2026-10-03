// The only module that knows where transcripts live (Step 21, AD-11, V12).
import { realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { InternalEvent } from '../types/events.js';

export function locateTranscript(ev: InternalEvent): string {
  return path.resolve(ev.transcriptPath);
}

export function projectTranscriptDir(cwd: string): string {
  let real = cwd;
  try {
    real = realpathSync(cwd);
  } catch {
    // keep the given path
  }
  return path.join(os.homedir(), '.claude', 'projects', real.replace(/\//g, '-'));
}
