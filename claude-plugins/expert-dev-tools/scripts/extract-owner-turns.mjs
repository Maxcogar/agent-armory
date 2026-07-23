#!/usr/bin/env node
// Transcript reader for the feedback sweep (architecture C8, plan S5, F-14).
// Given a project's transcript directory and a read-position marker {session_file, line},
// stream the *.jsonl transcripts and extract genuine OWNER turns after the marker, each
// with a bounded window of preceding-assistant context, plus the advanced marker.
//
// "Owner turn" = a JSONL entry with type == "user" whose message.content is a STRING.
// Tool results also appear as type=="user" but carry LIST content (tool_result blocks);
// those are not owner turns and are skipped. Semantic filtering (which turns are actually
// complaints) is the diagnostician's job — this reader is purely mechanical.
//
// No external dependencies. CLI:  node extract-owner-turns.mjs <transcript_dir> [markerJSON]

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const MAX_TEXT = 4000; // cap a single owner turn's captured text
const MAX_CONTEXT = 500; // cap the preceding-assistant context window

function ownerText(content) {
  // Owner-typed prompts are string content. List content = tool results → not an owner turn.
  return typeof content === 'string' ? content : null;
}

function assistantText(message) {
  if (!message || !Array.isArray(message.content)) return '';
  return message.content
    .filter((c) => c && c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text)
    .join(' ');
}

// marker: { session_file: string|null, line: number } where `line` is the count of lines
// already consumed in session_file. Returns { turns, marker } with the advanced marker.
export function readOwnerTurns(dir, marker = { session_file: null, line: 0 }) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => ({ name: f, mtime: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => a.mtime - b.mtime); // oldest first; the current session is last

  let startIdx = 0;
  let startLine = 0;
  if (marker && marker.session_file) {
    const idx = files.findIndex((f) => f.name === marker.session_file);
    if (idx >= 0) {
      startIdx = idx;
      startLine = marker.line || 0;
    }
    // If the marked file is gone (transcript cleanup), start from the oldest remaining.
  }

  const turns = [];
  let lastAssistant = '';
  let newMarker = { session_file: marker?.session_file ?? null, line: marker?.line ?? 0 };

  for (let fi = startIdx; fi < files.length; fi++) {
    const fname = files[fi].name;
    const fromLine = fi === startIdx ? startLine : 0;
    const lines = readFileSync(join(dir, fname), 'utf8').split(/\r?\n/);

    for (let li = 0; li < lines.length; li++) {
      const raw = lines[li];
      if (!raw) continue;
      let o;
      try {
        o = JSON.parse(raw);
      } catch {
        continue;
      }
      // Track assistant context even for lines before the marker, so an owner turn just
      // after the marker still gets the context it was reacting to.
      if (o.type === 'assistant') {
        const t = assistantText(o.message);
        if (t) lastAssistant = t;
      }
      if (li < fromLine) continue;
      if (o.type === 'user' && o.message) {
        const text = ownerText(o.message.content);
        if (text !== null) {
          turns.push({
            session_file: fname,
            line: li,
            text: text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) + '…' : text,
            context:
              lastAssistant.length > MAX_CONTEXT ? '…' + lastAssistant.slice(-MAX_CONTEXT) : lastAssistant,
          });
        }
      }
    }
    newMarker = { session_file: fname, line: lines.length };
  }

  return { turns, marker: newMarker };
}

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: node extract-owner-turns.mjs <transcript_dir> [markerJSON]');
    process.exit(2);
  }
  let marker = { session_file: null, line: 0 };
  if (process.argv[3]) {
    try {
      const parsed = JSON.parse(process.argv[3]);
      if (parsed && typeof parsed === 'object') marker = { session_file: parsed.session_file ?? null, line: parsed.line ?? 0 };
    } catch (e) {
      console.error(`invalid marker JSON: ${e.message}`);
      process.exit(2);
    }
  }
  let result;
  try {
    result = readOwnerTurns(dir, marker);
  } catch (e) {
    console.error(`cannot read transcripts in ${dir}: ${e.message}`);
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(result));
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
