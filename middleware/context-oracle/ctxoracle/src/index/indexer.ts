// Structural indexer (Step 14; AD-12, AD-2, AD-4, AD-19, AD-23, AD-26;
// D-plan-29, D-plan-30, D-plan-32; gap-list review G2, G6, G7, G11, G13, G14,
// G15, N4, N6, N7, N9, N13; Step 14 build review S1, S2, M1–M5, m1–m6).
//
// `runIndex` takes the reindex claim, walks the repository (git listing or
// `readdir`, `walk.ts`), and per present file: classifies its zone, applies the
// ingestion caps (ASVS 5.0 V5), parses it through the frontend the caller
// passed (D-plan-29 — the frontend list is an argument, so an empty list
// indexes paths, zones and tokens only), and writes its rows. Everything a
// search or genre reads later is written here, and — under `fts_state =
// 'fts5'` — the FTS rows beside the relational ones, deleted explicitly
// (a virtual table is outside `ON DELETE CASCADE`'s reach).
//
// "Unchanged" covers every input of a file's derived rows, not only its bytes
// (AD-12 as amended at 0528470): a changed frontend fingerprint makes the pass
// full (S1), and when a file appears or disappears the files whose import
// resolution could change are re-parsed (S2).
//
// Lock discipline (AD-26): every file read, hash, parse and resolution runs
// outside any transaction; the rows are written in chunk transactions of
// `miner.chunk_ms` writing time, each file's FTS / token rows in the same
// chunk as its relational rows, and an absent file's `in_tree = 0` in the same
// chunk as its derived-row deletes (M5); `index_head`, `index_stale = '0'`,
// `lang_capabilities`, `walk_mode`, `frontend_fingerprint`, and `walk_errors`
// only in the final transaction, so a crashed pass leaves the old `index_head`
// and fingerprint and the staleness check re-triggers it. Then `mineCochange`
// (Step 13) runs with the same tuning, diagnostics directory, and the caller's
// `full`, still under the claim (D-plan-32: two passes over one range would
// double-count pairs).
//
// Every read of a working-tree file goes through one descriptor-bounded helper
// (M1; ASVS 5.0 V5, AD-23, CWE-367): `O_RDONLY | O_NOFOLLOW | O_NONBLOCK`, then
// `fstat` on the descriptor, then at most the bound — so a file that grew, or
// was swapped for a symlink or a FIFO, after the walk's `lstat` is judged by
// what is actually opened. HEAD is resolved by bounded file reads, never a
// subprocess (AD-23).
//
// Memory — a stated limit (plan §13 R17): all parse output of a pass is held
// before the first write, so a first or full index holds every present file's
// symbols and captured imports at once; the writes stay chunked.

import { closeSync, constants as fsConstants, fstatSync, lstatSync, openSync, readSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import type { Store } from '../stores/adapter.js';
import type { ImportResolution, LanguageFrontend, RepoFiles } from './frontend.js';
import type { CapturedImport, SymbolRow } from '../types/index_types.js';
import type { TuningReader } from '../types/candidate.js';
import { classifyZone, ZONE_HEAD_BYTES, type ZoneResult } from './zone.js';
import { walkRepository } from './walk.js';
import { matchesTestPattern } from './path_glob.js';
import { tokenize } from './search.js';
import { readGitPointer } from '../identity/git_layout.js';
import { filesDao, type FileRecord } from '../stores/dao/files.js';
import { symbolsDao } from '../stores/dao/symbols.js';
import { symbolTokensDao } from '../stores/dao/symbol_tokens.js';
import { pathTokensDao } from '../stores/dao/path_tokens.js';
import { importEdgesDao } from '../stores/dao/import_edges.js';
import { symbolRefsDao } from '../stores/dao/symbol_refs.js';
import { testMapDao } from '../stores/dao/test_map.js';
import { schemaMetaDao } from '../stores/dao/schema_meta.js';
import { recordFault } from '../diag/fault_writer.js';
import { redact } from '../security/redact.js';
import { isSuspect } from '../security/injection.js';
import type { Provenance } from '../security/trust.js';
import { sha256Hex } from '../util/hash.js';
import { escapeBytes } from '../util/path_bytes.js';
import { mineCochange, type MineResult } from '../miner/cochange.js';

/** AD-12's ingestion caps (ASVS 5.0 V5 File Handling): > 1 MB or > 20k lines → path-only. */
const MAX_BYTES = 1_000_000;
const MAX_LINES = 20_000;
/** Step 6's `path_not_utf8` detail and `walk_errors` carry at most this many samples. */
const SAMPLE = 5;
/** Read granularity of the bounded reads. */
const READ_CHUNK = 64 * 1024;
/** Error text kept from a frontend's failure (after redaction). */
const ERROR_MAX_CHARS = 200;

export interface IndexOptions {
  full: boolean;
  frontends: LanguageFrontend[];
  tuning: TuningReader;
  diagnosticsDir: string;
}

export interface IndexResult {
  walkMode: 'git' | 'readdir';
  /** Paths the walk listed (decoded). */
  filesSeen: number;
  /** Listed paths present as regular files (at the walk's lstat and at the read). */
  filesPresent: number;
  /** Present files whose rows this run wrote (new, changed, re-parsed, or re-recorded). */
  filesWritten: number;
  /** Of `filesWritten`, the path-only ones (over a cap). */
  pathOnlyWritten: number;
  /** In-tree rows this run marked `in_tree = 0`. */
  filesMarkedAbsent: number;
  /** Paths the walk rejected as not UTF-8. */
  pathsRejected: number;
  symbolsWritten: number;
  importEdgesWritten: number;
  /** The commit recorded as `index_head`, or null when `HEAD` did not resolve. */
  head: string | null;
  /** The co-change pass (Step 13); null when the root is not a git work tree. */
  mine: MineResult | null;
  /** Directories the walk could not read and skipped (Step 14 build review m2). */
  walkErrors: number;
}

export type RunIndexResult = IndexResult | { refused: 'reindex_locked' };

// ---------------------------------------------------------------------------
// Bounded reads.

/** At most `max` bytes from the start of `file` (git metadata files; follows no special rules). */
function readHeadOfPath(file: string, max: number): Buffer {
  const fd = openSync(file, 'r');
  try {
    return readFromFd(fd, max);
  } finally {
    closeSync(fd);
  }
}

function readFromFd(fd: number, max: number): Buffer {
  const buf = Buffer.alloc(max);
  let n = 0;
  while (n < max) {
    const got = readSync(fd, buf, n, max - n, null);
    if (got === 0) break;
    n += got;
  }
  return buf.subarray(0, n);
}

// O_NOFOLLOW: a symlink at open fails ELOOP instead of being followed out of
// the tree; O_NONBLOCK: a FIFO swapped in after the lstat cannot block the
// open (open(2)), and the flag has no effect on a regular file's reads.
const OPEN_FLAGS = fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0) | (fsConstants.O_NONBLOCK ?? 0);

/** What one descriptor-bounded read of a working-tree file found. */
type TreeRead =
  | { kind: 'absent' }
  | { kind: 'bytes-cap'; bytes: number; mtime: number; head: Buffer }
  | { kind: 'lines-cap'; bytes: number; mtime: number; read: Buffer }
  | { kind: 'content'; mtime: number; content: Buffer };

/**
 * The one read of a working-tree file (Step 14 build review M1). The open
 * refuses a symlink and never blocks; the descriptor must be a regular file;
 * the read is bounded by the descriptor — at most 1,000,001 bytes (cap + 1) for
 * a content read, 2,048 for the head of a file whose `fstat` size is over the
 * cap — and stops at the first byte of line 20,001.
 */
function readTreeFile(abs: string): TreeRead {
  let fd: number;
  try {
    fd = openSync(abs, OPEN_FLAGS);
  } catch {
    // ENOENT (vanished), ELOOP (a symlink), EACCES …: not a present file.
    return { kind: 'absent' };
  }
  try {
    const st = fstatSync(fd);
    if (!st.isFile()) return { kind: 'absent' };
    const mtime = Math.floor(st.mtimeMs);
    if (st.size > MAX_BYTES) return { kind: 'bytes-cap', bytes: st.size, mtime, head: readFromFd(fd, ZONE_HEAD_BYTES) };
    const parts: Buffer[] = [];
    let total = 0;
    let newlines = 0;
    for (;;) {
      const want = Math.min(READ_CHUNK, MAX_BYTES + 1 - total);
      if (want <= 0) break;
      const buf = Buffer.alloc(want);
      const got = readSync(fd, buf, 0, want, null);
      if (got === 0) break;
      const chunk = buf.subarray(0, got);
      for (let i = 0; i < chunk.length; i++) {
        if (newlines === MAX_LINES) {
          // A byte after the 20,000th newline: line 20,001 exists. The bytes end
          // at that byte, so their hash never equals a 20,000-line file's.
          parts.push(chunk.subarray(0, i + 1));
          return { kind: 'lines-cap', bytes: st.size, mtime, read: Buffer.concat(parts) };
        }
        if (chunk[i] === 0x0a) newlines += 1;
      }
      parts.push(chunk);
      total += got;
    }
    const content = Buffer.concat(parts);
    if (content.length > MAX_BYTES) {
      // Grown past the cap since the fstat: path-only by bytes.
      return { kind: 'bytes-cap', bytes: Math.max(st.size, content.length), mtime, head: content.subarray(0, ZONE_HEAD_BYTES) };
    }
    return { kind: 'content', mtime, content };
  } catch {
    return { kind: 'absent' };
  } finally {
    closeSync(fd);
  }
}

// ---------------------------------------------------------------------------
// HEAD resolution by bounded file reads (AD-23, D-plan-30): never a subprocess.

const HASH_LINE = /^[0-9a-f]{40}([0-9a-f]{24})?$/;
/** A `HEAD` or loose ref file is one line; packed-refs is scanned in chunks. */
const REF_MAX_BYTES = 4096;
/** The bound of the reftable check's read of the repository config (plan Step 14, M4). */
const CONFIG_MAX_BYTES = 64 * 1024;
/** A reftable repository's `HEAD` (git-scm.com/docs/reftable, "Backward compatibility"). */
const REFTABLE_HEAD = 'ref: refs/heads/.invalid';

function readSmall(file: string, max = REF_MAX_BYTES): string | null {
  try {
    return readHeadOfPath(file, max).toString('utf8');
  } catch {
    return null;
  }
}

/** Scan `packed-refs` line by line for `<hash> <refPath>`; one read, bounded by the ref count. */
function scanPackedRefs(file: string, refPath: string): string | null {
  let fd: number;
  try {
    fd = openSync(file, 'r');
  } catch {
    return null;
  }
  try {
    let carry = '';
    const check = (line: string): string | null => {
      if (line.startsWith('#') || line.startsWith('^')) return null;
      const sp = line.indexOf(' ');
      if (sp < 0) return null;
      const hash = line.slice(0, sp);
      return line.slice(sp + 1).trimEnd() === refPath && HASH_LINE.test(hash) ? hash : null;
    };
    for (;;) {
      const buf = Buffer.alloc(READ_CHUNK);
      const got = readSync(fd, buf, 0, READ_CHUNK, null);
      if (got === 0) break;
      const lines = (carry + buf.subarray(0, got).toString('utf8')).split('\n');
      carry = lines.pop() as string;
      for (const l of lines) {
        const h = check(l);
        if (h !== null) return h;
      }
    }
    return carry === '' ? null : check(carry);
  } catch {
    return null;
  } finally {
    closeSync(fd);
  }
}

/**
 * Whether the config sets `extensions.refStorage = reftable`: a line scan of at
 * most its first 64 KiB; section and key names compared case-insensitively, as
 * git-config(1) defines them.
 */
function configSaysReftable(configFile: string): boolean {
  const text = readSmall(configFile, CONFIG_MAX_BYTES);
  if (text === null) return false;
  let section = '';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#') || line.startsWith(';')) continue;
    if (line.startsWith('[')) {
      const end = line.indexOf(']');
      section = (end < 0 ? line.slice(1) : line.slice(1, end)).trim().toLowerCase();
      continue;
    }
    if (section !== 'extensions') continue;
    const m = /^([A-Za-z][A-Za-z0-9-]*)\s*=\s*(.*)$/.exec(line);
    if (m === null || (m[1] as string).toLowerCase() !== 'refstorage') continue;
    const value = (m[2] as string).replace(/\s[;#].*$/, '').trim().replace(/^"(.*)"$/, '$1').toLowerCase();
    if (value === 'reftable') return true;
  }
  return false;
}

export function resolveHead(checkoutRoot: string): { commit: string } | { unresolved: string } {
  const ptr = readGitPointer(checkoutRoot);
  if (ptr === null) return { unresolved: 'no git directory at the checkout root' };
  const commonDir = ptr.kind === 'file' ? ptr.commonDir : ptr.gitDir;
  const head = readSmall(path.join(ptr.gitDir, 'HEAD'));
  if (head === null) return { unresolved: 'HEAD unreadable' };
  const h = head.trim();
  // Reftable is detected before any ref lookup (Step 14 build review M4): the
  // resolver does not read the reftable format, so the staleness of such a
  // repository is unknown — never stale, never a reindex.
  if (h === REFTABLE_HEAD || configSaysReftable(path.join(commonDir, 'config'))) return { unresolved: 'reftable' };
  if (HASH_LINE.test(h)) return { commit: h };
  const ref = /^ref:[ \t]*(\S+)$/.exec(h);
  if (ref === null) return { unresolved: 'HEAD is neither a commit hash nor a ref' };
  const refPath = ref[1] as string;
  const loose = readSmall(path.join(commonDir, refPath));
  if (loose !== null) {
    const l = loose.trim();
    if (HASH_LINE.test(l)) return { commit: l };
  }
  const packed = scanPackedRefs(path.join(commonDir, 'packed-refs'), refPath);
  if (packed !== null) return { commit: packed };
  return { unresolved: `ref ${refPath} is neither a loose nor a packed ref (an unborn branch, or a layout not understood)` };
}

/**
 * AD-17's `index_stale` detector as a pure store effect: never spawns (the
 * handler, Step 28, owns the detached reindex). `index_stale` and
 * `head_unresolved` are each recorded only on the transition (expert review
 * m3; Step 14 build review M4), so a state that persists across many events
 * writes one fault, not one per event.
 */
export function refreshIfStale(store: Store, checkoutRoot: string, diagnosticsDir: string): { stale: boolean } {
  const meta = schemaMetaDao(store);
  const h = resolveHead(checkoutRoot);
  if ('unresolved' in h) {
    if (meta.get('head_unresolved_since') === undefined) {
      store.transaction(() => {
        recordFault(store, diagnosticsDir, { code: 'head_unresolved', detail: { reason: h.unresolved } });
        meta.set('head_unresolved_since', String(Date.now()));
      });
    }
    return { stale: false };
  }
  if (meta.get('head_unresolved_since') !== undefined) meta.delete('head_unresolved_since');
  const indexHead = meta.get('index_head');
  if (indexHead === h.commit) return { stale: false };
  if (meta.get('index_stale') !== '1') {
    recordFault(store, diagnosticsDir, { code: 'index_stale', detail: { index_head: indexHead ?? null, head: h.commit } });
    meta.set('index_stale', '1');
  }
  return { stale: true };
}

// ---------------------------------------------------------------------------
// Reindex claim (D-plan-32): liveness check and claim write in one BEGIN IMMEDIATE.

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    // EPERM: the process exists but belongs to someone else — alive.
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

export function acquireReindexClaim(store: Store): { acquired: true } | { acquired: false; ownerPid: number } {
  const meta = schemaMetaDao(store);
  return store.transaction(() => {
    const owner = Number(meta.get('reindex_owner_pid') ?? '0');
    // A live owner — including this process, whose earlier call has not
    // released — holds the claim; a dead one's claim is taken over.
    if (Number.isInteger(owner) && owner > 0 && alive(owner)) return { acquired: false as const, ownerPid: owner };
    meta.set('reindex_owner_pid', String(process.pid));
    meta.set('reindex_started_at', String(Date.now()));
    return { acquired: true as const };
  });
}

export function releaseReindexClaim(store: Store): void {
  const meta = schemaMetaDao(store);
  store.transaction(() => {
    if (meta.get('reindex_owner_pid') !== String(process.pid)) return;
    meta.delete('reindex_owner_pid');
    meta.delete('reindex_started_at');
  });
}

// ---------------------------------------------------------------------------
// The pass.

/** A present file this run writes. */
interface PendingFile {
  path: string;
  lang: string;
  zone: ZoneResult;
  key: string;
  mtime: number;
  pathOnly: { bytes: number; lines: number | null; cap: 'bytes' | 'lines' } | null;
  symbols: SymbolRow[];
  /** The captured imports and the frontend that resolves them (resolved after every read). */
  imports: CapturedImport[];
  frontend: LanguageFrontend | null;
  /** Filled by resolution: destinations (repository paths), de-duplicated, never the file itself. */
  edgeDsts: string[];
  unresolved: number;
  pathSuspect: boolean;
}

function repoSpanProv(p: string, injectionSuspect: boolean): Provenance {
  return { prov_kind: 'repo_span', prov_ref: p, trust: 'untrusted_repo', injection_suspect: injectionSuspect };
}

/** Run `write` over `items` in transactions that each commit after `chunkMs` of writing (AD-26). */
function writeChunked<T>(store: Store, items: readonly T[], chunkMs: number, write: (item: T) => void): void {
  let next = 0;
  while (next < items.length) {
    store.transaction(() => {
      const started = performance.now();
      do {
        write(items[next] as T);
        next += 1;
      } while (next < items.length && performance.now() - started < chunkMs);
    });
  }
}

function langOf(p: string, extToLang: Map<string, string>): string {
  return extToLang.get(path.posix.extname(p).toLowerCase()) ?? 'unknown';
}

/** The dependency names of a `package.json` (its four dependency fields), read through the bounded helper. */
function packageDeps(abs: string): Set<string> {
  const out = new Set<string>();
  const r = readTreeFile(abs);
  if (r.kind !== 'content') return out;
  try {
    const json = JSON.parse(r.content.toString('utf8')) as Record<string, unknown>;
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      const deps = json[field];
      if (deps !== null && typeof deps === 'object') for (const name of Object.keys(deps)) out.add(name);
    }
  } catch {
    // A malformed package.json declares nothing.
  }
  return out;
}

const IDENT_CHAR = '[\\p{L}\\p{N}_$]';

function countIdentifier(text: string, name: string): number {
  if (name === '') return 0;
  const escaped = name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const re = new RegExp(`(?<!${IDENT_CHAR})${escaped}(?!${IDENT_CHAR})`, 'gu');
  let n = 0;
  while (re.exec(text) !== null) n += 1;
  return n;
}

/**
 * A path as a SQL GLOB pattern matching only itself (Step 14 build review M2):
 * each of GLOB's metacharacters `[`, `*`, `?` wrapped in brackets, so
 * `test_map.coveringTests`' `? GLOB region_glob` matches that path alone.
 */
function globEscape(p: string): string {
  return p.replace(/[[*?]/g, '[$&]');
}

function errorText(e: unknown): string {
  return redact(e instanceof Error ? e.message : String(e)).redacted.slice(0, ERROR_MAX_CHARS);
}

/**
 * The frontend fingerprint (Step 14 build review S1): `sha256Hex` of the
 * `JSON.stringify` array of `[lang, symbols, imports, version]`, one entry per
 * frontend the pass parses with (those passed, less any disabled by a rejected
 * `init`), sorted by `lang` then `version`.
 */
function fingerprintOf(frontends: readonly LanguageFrontend[]): string {
  const entries = frontends
    .map((f) => [f.lang, f.capabilities.symbols, f.capabilities.imports, f.version] as [string, boolean, boolean, string])
    .sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : x[3] < y[3] ? -1 : x[3] > y[3] ? 1 : 0));
  return sha256Hex(JSON.stringify(entries));
}

export async function runIndex(store: Store, repoPath: string, opts: IndexOptions): Promise<RunIndexResult> {
  const claim = acquireReindexClaim(store);
  if (!claim.acquired) {
    const startedAt = schemaMetaDao(store).get('reindex_started_at') ?? null;
    recordFault(store, opts.diagnosticsDir, { code: 'reindex_locked', detail: { ownerPid: claim.ownerPid, startedAt } });
    return { refused: 'reindex_locked' };
  }
  try {
    return await indexPass(store, repoPath, opts);
  } finally {
    releaseReindexClaim(store);
  }
}

async function indexPass(store: Store, repoPath: string, opts: IndexOptions): Promise<IndexResult> {
  const t = opts.tuning;
  const chunkMs = t.num('miner.chunk_ms');
  const entryPoints = t.num('index.entry_marker_points');
  const entryStems = new Set(t.list('lexicon.entry_marker_stems'));
  const testPatterns = t.list('lexicon.test_path_patterns');
  const sameDirLangs = new Set(t.list('lexicon.test_same_dir_languages'));
  const extToLang = new Map<string, string>();
  for (const member of t.list('index.ext_to_grammar')) {
    const eq = member.indexOf('=');
    if (eq > 0) extToLang.set(member.slice(0, eq).toLowerCase(), member.slice(eq + 1));
  }

  const meta = schemaMetaDao(store);
  const files = filesDao(store);
  const symbols = symbolsDao(store);
  const symbolTokens = symbolTokensDao(store);
  const pathTokens = pathTokensDao(store);
  const edges = importEdgesDao(store);
  const refs = symbolRefsDao(store);
  const testMap = testMapDao(store);
  const fts = meta.get('fts_state') === 'fts5';

  // HEAD is resolved before the walk: if it moves during the pass, the recorded
  // head is the older one and the staleness check re-triggers.
  const head = resolveHead(repoPath);

  // ---- Walk and lstat (no transaction). ---------------------------------------
  const walk = walkRepository(repoPath);
  const listed: string[] = [];
  for (const p of walk.paths) {
    try {
      // lstat: a symlink is not a present file (it can point outside the tree);
      // a stat that fails (a tracked file deleted from the working tree, still
      // listed by --cached) is absent. The read re-checks through the descriptor.
      if (lstatSync(path.join(repoPath, p)).isFile()) listed.push(p);
    } catch {
      // absent
    }
  }
  const presentSet = new Set(listed);

  // Every stored row, read before any write.
  const stored = new Map<string, FileRecord>();
  for (const r of files.all()) stored.set(r.path, r);
  const storedInTree = [...stored.values()].filter((r) => r.in_tree === 1);

  // ---- Frontends: init the needed ones; a rejection disables one (m6). ---------
  const byLang = new Map<string, LanguageFrontend>();
  let generic: LanguageFrontend | undefined;
  for (const f of opts.frontends) {
    if (f.lang === '*') generic ??= f;
    else if (!byLang.has(f.lang)) byLang.set(f.lang, f);
  }
  const disabled = new Set<LanguageFrontend>();
  const initFaults: { lang: string; error: string; phase: 'init' }[] = [];
  const tryInit = async (f: LanguageFrontend): Promise<void> => {
    try {
      await f.init();
    } catch (e) {
      disabled.add(f);
      initFaults.push({ lang: f.lang, error: errorText(e), phase: 'init' });
    }
  };
  const presentLangs = new Set(listed.map((p) => langOf(p, extToLang)));
  for (const lang of [...presentLangs].sort()) {
    const f = byLang.get(lang);
    if (f !== undefined) await tryInit(f);
  }
  if (generic !== undefined && [...presentLangs].some((l) => { const f = byLang.get(l); return f === undefined || disabled.has(f); })) {
    await tryInit(generic);
  }
  const frontendFor = (lang: string): LanguageFrontend | undefined => {
    const f = byLang.get(lang);
    if (f !== undefined && !disabled.has(f)) return f;
    return generic !== undefined && !disabled.has(generic) ? generic : undefined;
  };
  const enabled = [...opts.frontends].filter((f) => !disabled.has(f));
  const fingerprint = fingerprintOf(enabled);

  // A pass is full when the caller asks, when an earlier pass stopped after its
  // first write (`indexing_in_progress`), or when the frontend set differs from
  // the one the stored rows were parsed with — or none is recorded beside
  // in-tree rows (S1). This `full` is the index pass's only; the miner gets the
  // caller's.
  const storedFingerprint = meta.get('frontend_fingerprint');
  const full =
    opts.full ||
    meta.get('indexing_in_progress') === '1' ||
    (storedFingerprint === undefined ? storedInTree.length > 0 : storedFingerprint !== fingerprint);

  // ---- Re-parse sets for appearing and disappearing files (S2). -----------------
  const forced = new Set<string>();
  const edgeSourcesInto = store.prepare(
    'SELECT DISTINCT s.path AS path FROM import_edges e JOIN files s ON s.id = e.src_file JOIN files d ON d.id = e.dst_file WHERE d.path = ?'
  );
  const forceSourcesOf = (gonePath: string): void => {
    for (const r of edgeSourcesInto.all(gonePath) as { path: string }[]) forced.add(r.path);
  };
  // (a) a path present with no in_tree = 1 row before: files with unresolved imports may now resolve.
  if (listed.some((p) => stored.get(p)?.in_tree !== 1)) {
    for (const r of storedInTree) if (r.unresolved_imports > 0 && presentSet.has(r.path)) forced.add(r.path);
  }
  // (b) a stored in-tree path that left the present set: the sources of its edges.
  for (const r of storedInTree) if (!presentSet.has(r.path)) forceSourcesOf(r.path);

  // ---- Read, classify, parse (no transaction). --------------------------------
  const pending: PendingFile[] = [];
  const parseFailures: { lang: string; path: string; error: string }[] = [];
  /** Present paths judged unchanged (candidates for a forced re-parse later). */
  const skipped = new Set<string>();

  const processFile = (p: string): void => {
    skipped.delete(p);
    const prior = stored.get(p);
    const lang = langOf(p, extToLang);
    const ignored = walk.ignoredTracked.has(p);
    const isForced = full || forced.has(p);
    const unchanged = (key: string, zone: ZoneResult): boolean =>
      !isForced &&
      prior !== undefined &&
      prior.in_tree === 1 &&
      prior.content_hash === key &&
      prior.lang === lang &&
      prior.zone === zone.zone &&
      prior.zone_evidence === zone.evidence;
    const read = readTreeFile(path.join(repoPath, p));
    if (read.kind === 'absent') {
      // A symlink or non-regular file at open, or vanished at read time: absent
      // this pass (M1), and a disappearance for rule (b).
      presentSet.delete(p);
      if (prior?.in_tree === 1) forceSourcesOf(p);
      return;
    }
    if (read.kind === 'bytes-cap') {
      const zone = classifyZone(p, read.head, ignored);
      const key = `stat:${read.bytes}:${read.mtime}`;
      if (unchanged(key, zone)) {
        skipped.add(p);
        return;
      }
      pending.push(pathOnlyPending(p, lang, zone, key, read.mtime, { bytes: read.bytes, lines: null, cap: 'bytes' }));
      return;
    }
    if (read.kind === 'lines-cap') {
      const zone = classifyZone(p, read.read.subarray(0, ZONE_HEAD_BYTES), ignored);
      const key = sha256Hex(read.read);
      if (unchanged(key, zone)) {
        skipped.add(p);
        return;
      }
      pending.push(pathOnlyPending(p, lang, zone, key, read.mtime, { bytes: read.bytes, lines: MAX_LINES + 1, cap: 'lines' }));
      return;
    }
    const bytes = read.content;
    const key = sha256Hex(bytes);
    const zone = classifyZone(p, bytes.subarray(0, ZONE_HEAD_BYTES), ignored);
    if (unchanged(key, zone)) {
      skipped.add(p);
      return;
    }
    const pf: PendingFile = {
      path: p,
      lang,
      zone,
      key,
      mtime: read.mtime,
      pathOnly: null,
      symbols: [],
      imports: [],
      frontend: null,
      edgeDsts: [],
      unresolved: 0,
      pathSuspect: isSuspect(p),
    };
    const fe = frontendFor(lang);
    if (fe !== undefined) {
      let parsed: ReturnType<LanguageFrontend['parse']>;
      try {
        parsed = fe.parse(p, bytes);
      } catch (e) {
        parsed = { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
      if (!parsed.ok) {
        parseFailures.push({ lang, path: p, error: redact(parsed.error).redacted.slice(0, ERROR_MAX_CHARS) });
      } else {
        // Symbols are parsed from the file's own bytes so their spans address
        // the file on disk (the rumor rule re-resolves spans there, AD-15);
        // every string derived from the content is redacted before it is
        // stored (Step 11, AD-19). Import specifiers are never stored.
        if (fe.capabilities.symbols) pf.symbols = parsed.symbols.map((s) => ({ ...s, name: redact(s.name).redacted }));
        if (fe.capabilities.imports) {
          pf.imports = parsed.imports;
          pf.frontend = fe;
        }
      }
    }
    pending.push(pf);
  };

  for (const p of listed) processFile(p);
  // A disappearance found at read time can force files already judged
  // unchanged; re-process until nothing new is forced.
  for (;;) {
    const again = [...forced].filter((p) => skipped.has(p));
    if (again.length === 0) break;
    for (const p of again) processFile(p);
  }

  // ---- Resolution, against this pass's final present set (m5, self-import). ----
  const pkgCache = new Map<string, ReadonlySet<string>>();
  const repoFiles: RepoFiles = {
    has: (p) => presentSet.has(p),
    nearestPackageJsonDeps(fromPath) {
      let dir = path.posix.dirname(fromPath);
      for (;;) {
        const pj = dir === '.' || dir === '' ? 'package.json' : `${dir}/package.json`;
        if (presentSet.has(pj)) {
          let deps = pkgCache.get(pj);
          if (deps === undefined) {
            deps = packageDeps(path.join(repoPath, pj));
            pkgCache.set(pj, deps);
          }
          return deps;
        }
        if (dir === '.' || dir === '' || dir === '/') return new Set();
        dir = path.posix.dirname(dir);
      }
    },
  };
  for (const pf of pending) {
    const fe = pf.frontend;
    if (fe === null) continue;
    const dsts = new Set<string>();
    for (const imp of pf.imports) {
      let r: ImportResolution;
      try {
        r = fe.resolve === undefined ? { kind: 'unresolved' } : fe.resolve(pf.path, imp.specifier, repoFiles);
      } catch {
        r = { kind: 'unresolved' };
      }
      if (r.kind === 'resolved') {
        if (r.dst === pf.path) continue; // resolved, but a self-edge would inflate its own in-degree
        if (presentSet.has(r.dst)) dsts.add(r.dst);
        else pf.unresolved += 1; // no files row to point at; rule (a) re-resolves it when it appears
      } else if (r.kind === 'unresolved') {
        pf.unresolved += 1;
      }
    }
    pf.edgeDsts = [...dsts].sort();
  }

  // The stored in-tree rows not present this pass (read before any write).
  const absent = storedInTree.filter((r) => !presentSet.has(r.path));

  // ---- Pass 1 (chunked): each written file's row, symbols, tokens, FTS. -------
  const ftsDelete = fts
    ? {
        paths: store.prepare('DELETE FROM fts_paths WHERE file_id = ?'),
        symbols: store.prepare('DELETE FROM fts_symbols WHERE file_id = ?'),
      }
    : null;
  const ftsInsert = fts
    ? {
        path: store.prepare('INSERT INTO fts_paths(tokens, file_id) VALUES(?, ?)'),
        symbol: store.prepare('INSERT INTO fts_symbols(tokens, kind, symbol_id, file_id) VALUES(?, ?, ?, ?)'),
      }
    : null;
  const symbolIdsOf = store.prepare('SELECT id, name, kind FROM symbols WHERE file_id = ? ORDER BY id');
  const written = new Map<string, number>();
  let symbolsWritten = 0;
  if (pending.length > 0 || absent.length > 0) {
    // A pass that stops after this leaves the flag set, and the next pass runs
    // as full: cross-file rows of files whose own rows were already rewritten
    // would otherwise be skipped as unchanged.
    store.transaction(() => meta.set('indexing_in_progress', '1'));
  }
  writeChunked(store, pending, chunkMs, (pf) => {
    const prior = files.byPath(pf.path);
    const id = files.upsert({
      path: pf.path,
      lang: pf.lang,
      zone: pf.zone.zone,
      zoneEvidence: pf.zone.evidence,
      zoneEvidenceSuspect: pf.zone.evidenceSuspect,
      entryScore: prior?.entry_score ?? 0,
      contentHash: pf.key,
      mtime: pf.mtime,
      prov: repoSpanProv(pf.path, pf.pathSuspect),
      in_tree: 1,
    });
    written.set(pf.path, id);
    ftsDelete?.paths.run(id);
    ftsDelete?.symbols.run(id);
    const symProv = repoSpanProv(pf.path, pf.pathSuspect || pf.symbols.some((s) => isSuspect(s.name)));
    symbols.replaceForFile(id, pf.symbols, symProv);
    const rows = symbolIdsOf.all(id) as { id: number; name: string; kind: string }[];
    symbolTokens.replaceForFile(
      id,
      rows.map((r) => ({ symbolId: r.id, tokens: tokenize(r.name) }))
    );
    for (const r of rows) ftsInsert?.symbol.run(tokenize(r.name).join(' '), r.kind, r.id, id);
    symbolsWritten += rows.length;
    const pt = tokenize(pf.path);
    pathTokens.replaceForFile(id, pt);
    ftsInsert?.path.run(pt.join(' '), id);
    // Edges are rewritten in pass 2, once every destination has its row.
    edges.replaceForFile(id, []);
    files.setUnresolvedImports(id, 0);
  });
  // The oversize fault is recorded only when the row is written (6f5ceb8).
  for (const pf of pending) {
    if (pf.pathOnly !== null) {
      recordFault(store, opts.diagnosticsDir, {
        code: 'index_path_only_oversize',
        detail: { path: pf.path, bytes: pf.pathOnly.bytes, lines: pf.pathOnly.lines, cap: pf.pathOnly.cap },
      });
    }
  }
  for (const f of initFaults) recordFault(store, opts.diagnosticsDir, { code: 'frontend_parse_failed', detail: f });
  for (const pf of parseFailures) recordFault(store, opts.diagnosticsDir, { code: 'frontend_parse_failed', detail: pf });

  // Ids of every present file (written or unchanged).
  const idOf = new Map<string, number>();
  for (const r of store.prepare('SELECT id, path FROM files WHERE in_tree = 1').all() as { id: number; path: string }[]) {
    if (presentSet.has(r.path)) idOf.set(r.path, Number(r.id));
  }

  // ---- Pass 2 (chunked): import edges and unresolved counts of parsed files. --
  const parsed = pending.filter((pf) => pf.pathOnly === null && (pf.edgeDsts.length > 0 || pf.unresolved > 0));
  let importEdgesWritten = 0;
  writeChunked(store, parsed, chunkMs, (pf) => {
    const id = written.get(pf.path) as number;
    const dst = pf.edgeDsts.map((d) => idOf.get(d)).filter((d): d is number => d !== undefined && d !== id);
    edges.replaceForFile(
      id,
      dst.map((d) => ({ dstFile: d, kind: 'import' }))
    );
    files.setUnresolvedImports(id, pf.unresolved);
    importEdgesWritten += dst.length;
  });

  // ---- Absent files (chunked): each file's in_tree = 0 commits with its
  // derived-row deletes, in one chunk transaction (M5); the row is kept (AD-4, G2).
  const setAbsent = store.prepare('UPDATE files SET in_tree = 0, updated_at = ? WHERE id = ? AND in_tree = 1');
  const dropEdgesInto = store.prepare('DELETE FROM import_edges WHERE dst_file = ?');
  writeChunked(store, absent, chunkMs, (rec) => {
    const id = rec.id;
    const prov = repoSpanProv(rec.path, false);
    ftsDelete?.paths.run(id);
    ftsDelete?.symbols.run(id);
    symbols.replaceForFile(id, [], prov); // cascades symbol_tokens and symbol_refs of its symbols
    edges.replaceForFile(id, []);
    dropEdgesInto.run(id);
    refs.replaceForFile(id, []);
    testMap.replaceForFile(id, [], prov);
    pathTokens.replaceForFile(id, []);
    files.setUnresolvedImports(id, 0);
    setAbsent.run(Date.now(), id);
  });
  store.transaction(() => files.sweepUnreferenced());

  // ---- symbol_refs: importers whose references may have changed. -------------
  // A written file's symbols were replaced (their reference rows cascaded
  // away), so each of its importers is recomputed, as is every written file
  // as an importer (a re-parsed file counts as written). Importers over the
  // cap are path-only and import nothing.
  const writtenIds = new Set(written.values());
  const importersOf = store.prepare('SELECT DISTINCT src_file AS id FROM import_edges WHERE dst_file = ?');
  const recompute = new Set<number>(writtenIds);
  for (const id of writtenIds) for (const r of importersOf.all(id) as { id: number }[]) recompute.add(Number(r.id));
  const pathOfId = new Map([...idOf].map(([p, id]) => [id, p]));
  const dstsOf = store.prepare('SELECT DISTINCT dst_file AS id FROM import_edges WHERE src_file = ?');
  const refRows: { src: number; rows: { symbolId: number; refCount: number }[] }[] = [];
  for (const src of [...recompute].sort((a, b) => a - b)) {
    const srcPath = pathOfId.get(src);
    if (srcPath === undefined) continue;
    const dsts = (dstsOf.all(src) as { id: number }[]).map((r) => Number(r.id)).filter((d) => d !== src);
    const targetSymbols = dsts.flatMap((d) => symbolIdsOf.all(d) as { id: number; name: string }[]);
    const rows: { symbolId: number; refCount: number }[] = [];
    if (targetSymbols.length > 0) {
      const read = readTreeFile(path.join(repoPath, srcPath));
      if (read.kind !== 'content') continue;
      const text = redact(read.content.toString('utf8')).redacted;
      for (const s of targetSymbols) {
        const n = countIdentifier(text, s.name);
        if (n > 0) rows.push({ symbolId: Number(s.id), refCount: n });
      }
    }
    refRows.push({ src, rows });
  }
  writeChunked(store, refRows, chunkMs, (r) => refs.replaceForFile(r.src, r.rows));

  // ---- test_map: rewritten only where the derived rows differ (AD-12, N13). ----
  const isTest = (p: string): boolean => testPatterns.some((pat) => matchesTestPattern(p, pat));
  const langById = new Map<number, string>();
  for (const r of store.prepare('SELECT id, lang FROM files WHERE in_tree = 1').all() as { id: number; lang: string }[]) {
    langById.set(Number(r.id), r.lang);
  }
  const testPaths = [...idOf.keys()].filter(isTest).sort();
  const testSet = new Set(testPaths);
  const nonTestByDirLang = new Map<string, string[]>();
  for (const [p, id] of idOf) {
    if (testSet.has(p)) continue;
    const k = `${path.posix.dirname(p)}\0${langById.get(id) ?? ''}`;
    const list = nonTestByDirLang.get(k) ?? [];
    list.push(p);
    nonTestByDirLang.set(k, list);
  }
  const storedMap = store.prepare('SELECT region_glob AS region, source FROM test_map WHERE test_file = ? ORDER BY region_glob, source');
  const mapWrites: { id: number; path: string; rows: { regionGlob: string; source: string }[] }[] = [];
  const byRegion = (a: { regionGlob: string; source: string }, b: { regionGlob: string; source: string }): number =>
    a.regionGlob < b.regionGlob ? -1 : a.regionGlob > b.regionGlob ? 1 : a.source < b.source ? -1 : a.source > b.source ? 1 : 0;
  for (const tp of testPaths) {
    const id = idOf.get(tp) as number;
    const lang = langById.get(id) ?? '';
    let covered: { path: string; source: string }[];
    if (sameDirLangs.has(lang)) {
      covered = (nonTestByDirLang.get(`${path.posix.dirname(tp)}\0${lang}`) ?? []).map((p) => ({ path: p, source: 'same_dir' }));
    } else {
      covered = (dstsOf.all(id) as { id: number }[])
        .map((r) => pathOfId.get(Number(r.id)))
        .filter((p): p is string => p !== undefined && !testSet.has(p))
        .map((p) => ({ path: p, source: 'import_edge' }));
    }
    // region_glob is the covered path as a GLOB-escaped pattern (M2); the
    // comparison below is over the escaped form, so an unchanged tree writes nothing.
    const rows = covered.map((c) => ({ regionGlob: globEscape(c.path), source: c.source })).sort(byRegion);
    const have = storedMap.all(id) as { region: string; source: string }[];
    const same = have.length === rows.length && have.every((s, i) => s.region === rows[i]?.regionGlob && s.source === rows[i]?.source);
    if (!same) mapWrites.push({ id, path: tp, rows });
  }
  // A present file that is no longer a test file (a tuned pattern list) loses its rows.
  for (const r of store.prepare('SELECT DISTINCT test_file AS id FROM test_map').all() as { id: number }[]) {
    const p = pathOfId.get(Number(r.id));
    if (p !== undefined && !testSet.has(p)) mapWrites.push({ id: Number(r.id), path: p, rows: [] });
  }
  writeChunked(store, mapWrites, chunkMs, (w) => testMap.replaceForFile(w.id, w.rows, repoSpanProv(w.path, isSuspect(w.path))));

  // ---- entry_score: assigned (never added) for every in-tree file (N4). -------
  const inDegree = new Map<number, number>();
  for (const r of store.prepare('SELECT dst_file AS id, count(*) AS n FROM import_edges WHERE src_file <> dst_file GROUP BY dst_file').all() as {
    id: number;
    n: number;
  }[]) {
    inDegree.set(Number(r.id), Number(r.n));
  }
  const scores: { id: number; score: number }[] = [];
  for (const [p, id] of idOf) {
    const base = path.posix.basename(p);
    const dot = base.indexOf('.');
    const stem = dot < 0 ? base : base.slice(0, dot);
    scores.push({ id, score: (inDegree.get(id) ?? 0) + (entryStems.has(stem) ? entryPoints : 0) });
  }
  writeChunked(store, scores, chunkMs, (s) => files.setEntryScore(s.id, s.score));

  // ---- Per-language capability record (AD-12, G13): the frontend actually used. -
  const caps: Record<string, { frontend: 'tree-sitter' | 'generic' | 'path-only'; symbols: boolean; imports: boolean; resolved: number; unresolved: number; files: number }> = {};
  const langRows = store
    .prepare(
      `SELECT f.lang AS lang, count(*) AS files, COALESCE(sum(f.unresolved_imports), 0) AS unresolved,
              COALESCE(sum((SELECT count(*) FROM import_edges e WHERE e.src_file = f.id)), 0) AS resolved
         FROM files f WHERE f.in_tree = 1 GROUP BY f.lang ORDER BY f.lang`
    )
    .all() as { lang: string; files: number; unresolved: number; resolved: number }[];
  for (const r of langRows) {
    const fe = frontendFor(r.lang);
    caps[r.lang] = {
      frontend: fe === undefined ? 'path-only' : fe.lang === '*' ? 'generic' : 'tree-sitter',
      symbols: fe?.capabilities.symbols ?? false,
      imports: fe?.capabilities.imports ?? false,
      resolved: Number(r.resolved),
      unresolved: Number(r.unresolved),
      files: Number(r.files),
    };
  }

  if (walk.rejected.length > 0) {
    recordFault(store, opts.diagnosticsDir, {
      code: 'path_not_utf8',
      detail: { writer: 'indexer', count: walk.rejected.length, first: walk.rejected.slice(0, SAMPLE).map(escapeBytes) },
    });
  }

  // ---- The final transaction. -------------------------------------------------
  const headCommit = 'commit' in head ? head.commit : null;
  const walkErrors = walk.walkErrors;
  store.transaction(() => {
    if (headCommit !== null) {
      meta.set('index_head', headCommit);
      meta.delete('head_unresolved_since');
    } else {
      meta.delete('index_head');
    }
    meta.set('index_stale', '0');
    meta.set('lang_capabilities', JSON.stringify(caps));
    meta.set('walk_mode', walk.mode);
    meta.set('frontend_fingerprint', fingerprint);
    // No fault code means a skipped directory; the count and the first
    // entries are recorded here and shown by `status` (m2).
    if (walkErrors.length > 0) {
      meta.set(
        'walk_errors',
        JSON.stringify({ count: walkErrors.length, first: walkErrors.slice(0, SAMPLE).map((e) => ({ path: redact(e.path).redacted, code: e.code })) })
      );
    } else {
      meta.delete('walk_errors');
    }
    meta.delete('indexing_in_progress');
  });

  // ---- The co-change pass (Step 13), under the same claim. --------------------
  // Only a git work tree has history; a `readdir` root is not one, and asking
  // git there would mine whatever repository encloses the directory.
  const mine =
    walk.mode === 'git' ? await mineCochange(store, repoPath, { tuning: t, diagnosticsDir: opts.diagnosticsDir, full: opts.full }) : null;

  return {
    walkMode: walk.mode,
    filesSeen: walk.paths.length,
    filesPresent: idOf.size,
    filesWritten: written.size,
    pathOnlyWritten: pending.filter((pf) => pf.pathOnly !== null).length,
    filesMarkedAbsent: absent.length,
    pathsRejected: walk.rejected.length,
    symbolsWritten,
    importEdgesWritten,
    head: headCommit,
    mine,
    walkErrors: walkErrors.length,
  };
}

function pathOnlyPending(p: string, lang: string, zone: ZoneResult, key: string, mtime: number, cap: NonNullable<PendingFile['pathOnly']>): PendingFile {
  return { path: p, lang, zone, key, mtime, pathOnly: cap, symbols: [], imports: [], frontend: null, edgeDsts: [], unresolved: 0, pathSuspect: isSuspect(p) };
}
