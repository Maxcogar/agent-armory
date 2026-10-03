// Zone classification (Step 14, AD-12; review G2/N9; AD-19 for the evidence).
//
// Precedence, first match wins (plan Step 14, as settled at 6f5ceb8):
//   1. membership of the walk's tracked-and-ignored set → `generated`,
//      evidence `tracked file matches an ignore pattern`;
//   2. a generated-file marker comment in the head 2 KB (`@generated` as a
//      comment's leading tag, or Go's full `Code generated … DO NOT EDIT.`
//      line — matched only as a comment line, Step 14 build review M3) →
//      `generated`, evidence the marker line;
//   3. a `vendor/` or `node_modules/` directory segment → `vendored`;
//   4. a `dist/` or `build/` directory segment, or a lockfile basename →
//      `build_output`;
//   5. otherwise `source`.
// The evidence string is redacted (Step 11) before it is kept, then
// injection-flagged (`zone_evidence_suspect`). Every zone is still parsed for
// symbols (N9); consumers exclude non-`source` candidates by zone (Step 18).
import type { Zone } from '../stores/dao/files.js';
import { redact } from '../security/redact.js';
import { isSuspect } from '../security/injection.js';

export interface ZoneResult {
  zone: Zone;
  evidence: string | null;
  evidenceSuspect: boolean;
}

/** How much of a file's head the marker check reads (AD-12: the head 2 KB). */
export const ZONE_HEAD_BYTES = 2048;
/** The longest marker-line evidence kept (after redaction). */
const EVIDENCE_MAX_CHARS = 200;

/**
 * The marker lines (Step 14 build review M3). Go's published convention,
 * `^// Code generated .* DO NOT EDIT\.$` (pkg.go.dev/cmd/go, "Generate Go files
 * by processing source"); or a comment whose text starts with the tag
 * `@generated`, after one of the leaders `//`, `#`, `/*`, `*`, `<!--`, `--`.
 * A mention anywhere else — prose, a string, later in a comment, or `DO NOT
 * EDIT` without Go's full line — is not a marker: matching anywhere classified
 * `zone.ts` itself, a test, and a spec line as generated, and Orientation and
 * Reuse drop non-`source` files (Step 18).
 */
const GO_MARKER = /^\/\/ Code generated .* DO NOT EDIT\.$/u;
const TAG_MARKER = /^\s*(?:\/\/|#|\/\*+|\*+|<!--|--)\s*@generated(?![\p{L}\p{N}_])/u;

/** The first marker line of the head, trimmed of a trailing `\r`, or undefined. */
function markerLine(text: string): string | undefined {
  for (const raw of text.split('\n')) {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (GO_MARKER.test(line) || TAG_MARKER.test(line)) return line;
  }
  return undefined;
}
const VENDOR_SEGMENTS = new Set(['vendor', 'node_modules']);
const BUILD_SEGMENTS = new Set(['dist', 'build']);
/**
 * Lockfile basenames. AD-12 names "lockfile patterns" without a list; these are
 * the lockfiles of the package managers whose ecosystems the default grammar
 * table covers (npm, Yarn, pnpm, Cargo, Poetry, Bundler, Composer).
 */
const LOCKFILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'Cargo.lock', 'poetry.lock', 'Gemfile.lock', 'composer.lock']);

const IGNORED_TRACKED_EVIDENCE = 'tracked file matches an ignore pattern';

function result(zone: Zone, evidence: string | null): ZoneResult {
  const ev = evidence === null ? null : redact(evidence).redacted.slice(0, EVIDENCE_MAX_CHARS);
  return { zone, evidence: ev, evidenceSuspect: ev !== null && isSuspect(ev) };
}

/**
 * Classify one file. `head` is at most its first `ZONE_HEAD_BYTES` bytes;
 * `ignoredTracked` is its membership of the walk's tracked-and-ignored set.
 */
export function classifyZone(path: string, head: Buffer, ignoredTracked: boolean): ZoneResult {
  if (ignoredTracked) return result('generated', IGNORED_TRACKED_EVIDENCE);
  const text = head.subarray(0, ZONE_HEAD_BYTES).toString('utf8');
  const line = markerLine(text);
  if (line !== undefined) {
    // Redact the whole line first: truncating first could cut a secret into a
    // fragment the patterns no longer recognise.
    return result('generated', line.trim());
  }
  const segs = path.split('/');
  const dirs = segs.slice(0, -1);
  const vendor = dirs.find((s) => VENDOR_SEGMENTS.has(s));
  if (vendor !== undefined) return result('vendored', `path segment ${vendor}/`);
  const build = dirs.find((s) => BUILD_SEGMENTS.has(s));
  if (build !== undefined) return result('build_output', `path segment ${build}/`);
  const base = segs[segs.length - 1] as string;
  if (LOCKFILES.has(base)) return result('build_output', `lockfile ${base}`);
  return result('source', null);
}
