// Structural indexer (Step 14, AD-12, AD-23, AD-26, D-plan-29/30/32).
//
// WALKING SKELETON (2026-09-25): does the step's minimum real work — lists the
// repository's files, classifies zones, hands each file to its frontend, stores
// files/symbols/import_edges and the FTS rows, resolves HEAD by bounded file
// reads, holds the reindex claim, then runs the co-change miner. Provisional
// choices are marked `SKELETON: G<n>` and listed in docs/implementation-log.md.

import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Store } from '../stores/adapter.js';
import type { LanguageFrontend } from './frontend.js';
import { classifyZone } from './zone.js';
import { filesDao } from '../stores/dao/files.js';
import { symbolsDao } from '../stores/dao/symbols.js';
import { importEdgesDao } from '../stores/dao/import_edges.js';
import { schemaMetaDao } from '../stores/dao/schema_meta.js';
import { tuning } from '../stores/dao/tuning.js';
import { recordFault } from '../diag/fault_writer.js';
import { redact } from '../security/redact.js';
import { isSuspect } from '../security/injection.js';
import { sha256Hex } from '../util/hash.js';
import { oracleExecFileSync } from '../util/spawn.js';
import { mineCochange, type MineResult } from '../miner/cochange.js';

const MAX_BYTES = 1_000_000;
const MAX_LINES = 20_000;

export interface IndexOptions {
  full: boolean;
  frontends: LanguageFrontend[];
  diagnosticsDir: string;
  /** SKELETON: G8 — the global store, for `tuning` (ext_to_grammar, miner thresholds). */
  global: Store;
}

export interface IndexResult {
  filesSeen: number;
  filesIndexed: number;
  pathOnly: number;
  symbols: number;
  importEdges: number;
  head: string | null;
  mine: MineResult | null;
  refused?: 'reindex_locked';
}

// ---------------------------------------------------------------------------
// HEAD resolution by bounded file reads (AD-23, D-plan-30): never a subprocess.

export function resolveHead(repoPath: string): { commit: string } | { unresolved: string } {
  const dotGit = path.join(repoPath, '.git');
  if (!existsSync(dotGit)) return { unresolved: 'no .git' };
  let gitDir = dotGit;
  if (statSync(dotGit).isFile()) {
    const m = /^gitdir:\s*(.+)$/m.exec(readFileSync(dotGit, 'utf8'));
    if (m === null) return { unresolved: '.git file without gitdir line' };
    gitDir = path.resolve(repoPath, (m[1] as string).trim());
  }
  const commondirFile = path.join(gitDir, 'commondir');
  const commonDir = existsSync(commondirFile)
    ? path.resolve(gitDir, readFileSync(commondirFile, 'utf8').trim())
    : gitDir;
  const headFile = path.join(gitDir, 'HEAD');
  if (!existsSync(headFile)) return { unresolved: 'no HEAD' };
  const head = readFileSync(headFile, 'utf8').trim();
  if (/^[0-9a-f]{40}([0-9a-f]{24})?$/.test(head)) return { commit: head };
  const ref = /^ref:\s*(\S+)$/.exec(head);
  if (ref === null) return { unresolved: 'HEAD neither a hash nor a ref' };
  const refPath = ref[1] as string;
  const loose = path.join(commonDir, refPath);
  if (existsSync(loose)) return { commit: readFileSync(loose, 'utf8').trim() };
  const packed = path.join(commonDir, 'packed-refs');
  if (existsSync(packed)) {
    for (const line of readFileSync(packed, 'utf8').split('\n')) {
      const [hash, name] = line.split(' ');
      if (name === refPath && hash !== undefined) return { commit: hash };
    }
  }
  return { unresolved: `ref ${refPath} not found (unborn branch?)` };
}

export function refreshIfStale(store: Store, repoPath: string, diagnosticsDir: string): { stale: boolean } {
  const meta = schemaMetaDao(store);
  const h = resolveHead(repoPath);
  if ('unresolved' in h) {
    recordFault(store, diagnosticsDir, { code: 'head_unresolved', detail: { reason: h.unresolved } });
    return { stale: false };
  }
  if (meta.get('index_head') === h.commit) return { stale: false };
  recordFault(store, diagnosticsDir, { code: 'index_stale', detail: { index_head: meta.get('index_head'), head: h.commit } });
  meta.set('index_stale', '1');
  return { stale: true };
}

// ---------------------------------------------------------------------------
// Reindex claim (D-plan-32): liveness check and claim write in one BEGIN IMMEDIATE.

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

export function acquireReindexClaim(store: Store): boolean {
  const meta = schemaMetaDao(store);
  return store.transaction(() => {
    const owner = Number(meta.get('reindex_owner_pid') ?? '0');
    if (owner > 0 && owner !== process.pid && alive(owner)) return false;
    meta.set('reindex_owner_pid', String(process.pid));
    meta.set('reindex_started_at', String(Date.now()));
    return true;
  });
}

export function releaseReindexClaim(store: Store): void {
  store.prepare("DELETE FROM schema_meta WHERE key IN ('reindex_owner_pid', 'reindex_started_at')").run();
}

// ---------------------------------------------------------------------------

function extToLang(global: Store): Map<string, string> {
  const m = new Map<string, string>();
  for (const member of tuning.list(global, 'index.ext_to_grammar')) {
    const eq = member.indexOf('=');
    if (eq > 0) m.set(member.slice(0, eq), member.slice(eq + 1));
  }
  return m;
}

/** SKELETON: G11 — the plan says "walks the working tree respecting .gitignore";
 *  the skeleton asks git for the tracked + untracked-not-ignored list instead of
 *  re-implementing gitignore matching. Paths are git's raw `-z` bytes, the same
 *  keys the miner uses. */
function listFiles(repoPath: string): string[] {
  const out = oracleExecFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: repoPath,
    maxBuffer: 256 * 1024 * 1024,
  });
  return [...new Set(out.split('\0').filter((p) => p !== ''))].filter((p) => {
    try {
      return statSync(path.join(repoPath, p)).isFile();
    } catch {
      return false;
    }
  });
}

/** SKELETON: G12 — the plan says an import edge "resolves to the imported file"
 *  but defines no resolution. The skeleton resolves relative specifiers only:
 *  the path as written, then TypeScript's `.js`→`.ts` convention, then added
 *  extensions and `/index.*`. Bare (package) specifiers produce no edge. */
function resolveImport(fromPath: string, spec: string, known: Map<string, number>): number | undefined {
  if (!spec.startsWith('.')) return undefined;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), spec));
  const tries = [
    base,
    base.replace(/\.(m|c)?js$/, '.$1ts'),
    base.replace(/\.jsx$/, '.tsx'),
    ...['.ts', '.tsx', '.js', '.mjs', '.py'].map((e) => base + e),
    ...['/index.ts', '/index.js', '/__init__.py'].map((e) => base + e),
  ];
  for (const t of tries) {
    const id = known.get(t);
    if (id !== undefined) return id;
  }
  return undefined;
}

const ENTRY_MARKER = /(^|\/)(main|index|cli|app)\.[a-z]+$/;

export async function runIndex(store: Store, repoPath: string, opts: IndexOptions): Promise<IndexResult> {
  if (!acquireReindexClaim(store)) {
    recordFault(store, opts.diagnosticsDir, { code: 'reindex_locked', detail: { owner: schemaMetaDao(store).get('reindex_owner_pid') } });
    return { filesSeen: 0, filesIndexed: 0, pathOnly: 0, symbols: 0, importEdges: 0, head: null, mine: null, refused: 'reindex_locked' };
  }
  try {
    const files = filesDao(store);
    const syms = symbolsDao(store);
    const edges = importEdgesDao(store);
    const fts = schemaMetaDao(store).get('fts_state') === 'fts5';
    const langOf = extToLang(opts.global);
    const byLang = new Map(opts.frontends.filter((f) => f.lang !== 'generic').map((f) => [f.lang, f]));
    const generic = opts.frontends.find((f) => f.lang === 'generic');
    for (const f of opts.frontends) if (f.init) await f.init();

    const paths = listFiles(repoPath);
    const known = new Map<string, number>();
    const pendingImports: { id: number; path: string; specs: string[] }[] = [];
    let indexed = 0;
    let pathOnly = 0;
    let symbolCount = 0;

    for (const p of paths) {
      const abs = path.join(repoPath, p);
      const content = readFileSync(abs);
      const hash = sha256Hex(content);
      const prior = files.byPath(p);
      const ext = path.extname(p).toLowerCase();
      const lang = langOf.get(ext) ?? 'unknown';
      if (!opts.full && prior !== undefined && prior.content_hash === hash) {
        known.set(p, prior.id);
        continue;
      }
      const head = content.subarray(0, 2048).toString('utf8');
      const zone = classifyZone(p, head);
      const prov = { prov_kind: 'repo_span' as const, prov_ref: p, trust: 'untrusted_repo' as const };
      // SKELETON: 1R — `files.upsert` takes `in_tree` (1: the walk listed the
      // file) and the path's injection flag, `isSuspect(path)`, as the row's
      // PROV injection_suspect (AD-4, AD-19); retired by Step 14
      const id = files.upsert({
        path: p,
        lang,
        zone: zone.zone,
        zoneEvidence: zone.evidence,
        zoneEvidenceSuspect: zone.evidenceSuspect,
        entryScore: ENTRY_MARKER.test(p) ? 1 : 0,
        contentHash: hash,
        mtime: Math.floor(statSync(abs).mtimeMs),
        prov: { ...prov, injection_suspect: isSuspect(p) },
        in_tree: 1,
      });
      known.set(p, id);
      indexed += 1;
      // SKELETON: 1R — the skeleton's `fts_paths` insert named the pre-1R
      // `path` column, which migration 001b no longer defines, so it is removed
      // and the FTS tables stay empty at 1R (plan §9, Steps 1-12 build review
      // M1); the per-file deletes still match 001b's `file_id`; retired by Step 14
      if (fts) {
        store.prepare('DELETE FROM fts_paths WHERE file_id = ?').run(id);
        store.prepare('DELETE FROM fts_symbols WHERE file_id = ?').run(id);
      }
      const tooBig = content.length > MAX_BYTES || content.toString('utf8').split('\n').length > MAX_LINES;
      const fe = byLang.get(lang) ?? generic;
      if (tooBig || fe === undefined || zone.zone !== 'source') {
        // SKELETON: G15 — oversize files are path-only "with a diagnostic", but no
        // fault code exists for it; the skeleton records nothing.
        if (tooBig) pathOnly += 1;
        syms.replaceForFile(id, [], prov);
        continue;
      }
      const parsed = fe.parse(p, content);
      const rows = parsed.symbols.map((s) => ({ ...s, name: redact(s.name).redacted }));
      syms.replaceForFile(id, rows, prov);
      symbolCount += rows.length;
      // SKELETON: 1R — the skeleton's `fts_symbols` insert (pre-1R `name`
      // column) is removed; see the fts_paths note above; retired by Step 14
      pendingImports.push({ id, path: p, specs: parsed.imports.map((i) => i.dst) });
    }

    let edgeCount = 0;
    for (const pi of pendingImports) {
      const dst = pi.specs
        .map((s) => resolveImport(pi.path, s, known))
        .filter((d): d is number => d !== undefined && d !== pi.id);
      edges.replaceForFile(pi.id, [...new Set(dst)].map((d) => ({ dstFile: d, kind: 'import' })));
      edgeCount += dst.length;
    }
    // SKELETON: G11 — entry_score is only the path marker plus in-degree here;
    // symbol_refs and test_map are not produced yet.
    for (const [, id] of known) {
      const deg = edges.inDegree(id);
      if (deg > 0) store.prepare('UPDATE files SET entry_score = entry_score + ? WHERE id = ?').run(deg, id);
    }
    // SKELETON: 1R — the deletion of files the tree no longer lists (the
    // skeleton's inline equivalent of the removed `files.deleteMissing`, G2) is
    // removed: a file gone from the tree keeps its row at 1R; retired by Step 14

    const h = resolveHead(repoPath);
    const headCommit = 'commit' in h ? h.commit : null;
    if (headCommit !== null) schemaMetaDao(store).set('index_head', headCommit);
    schemaMetaDao(store).set('index_stale', '0');
    const mine = mineCochange(store, repoPath, { diagnosticsDir: opts.diagnosticsDir, global: opts.global });
    return { filesSeen: paths.length, filesIndexed: indexed, pathOnly, symbols: symbolCount, importEdges: edgeCount, head: headCommit, mine };
  } finally {
    releaseReindexClaim(store);
  }
}
