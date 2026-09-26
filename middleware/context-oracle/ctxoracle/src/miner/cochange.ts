// Co-change miner (Step 13, AD-13, AD-15 landmine sources, FR-K2, FR-A6).
//
// WALKING SKELETON (2026-09-25). This file does the step's minimum real work end
// to end — a real `git log -z` stream, the NUL-delimited parser, commit rows with
// the hygiene exclusions, canonical file-pair counts, the watermark, and the two
// deterministic landmine classes — so the steps after it can be connected and
// exercised. Every place a decision the plan left open was made provisionally is
// marked `SKELETON:` and listed in docs/implementation-log.md ("Skeleton gap list").
// The full build of Step 13 replaces those marks with reviewed decisions.
//
// Why `-z`: git's machine-output mode emits every path as raw bytes (no C-quoting
// of non-ASCII, quote, backslash, tab, newline or control bytes) and a rename as
// two separate NUL fields, so a path is never mis-keyed and a real file named
// `a => b.txt` is never mistaken for a rename (probe:24_git_numstat_z). NUL is the
// only byte a pathname cannot contain, so the stream is split on NUL alone.

import type { Store } from '../stores/adapter.js';
import { oracleExecFileSync } from '../util/spawn.js';
import { recordFault } from '../diag/fault_writer.js';
import { commitsDao } from '../stores/dao/commits.js';
import { cochangePairsDao } from '../stores/dao/cochange_pairs.js';
import { filesDao } from '../stores/dao/files.js';
import { schemaMetaDao } from '../stores/dao/schema_meta.js';
import { tuning } from '../stores/dao/tuning.js';

const HEADER = /^\x1e[0-9a-f]{40}$/;
const DAY_S = 86_400;

/** One commit as parsed from the `-z --numstat` stream. */
export interface ParsedCommit {
  hash: string;
  ts: number;
  subject: string;
  /** Raw touched paths; a rename contributes both identities. */
  paths: string[];
  /** Records the parser could not read (never guessed into a path). */
  unparsed: string[];
}

/**
 * Parse the output of
 *   git log --no-merges -M -z --numstat --format=%x1e%H%x00%at%x00%s%x00
 * The format puts three NUL-terminated fields per commit (header, time, subject),
 * then git adds an empty field and the numstat entries, the first prefixed by a
 * newline. Header, time and subject are consumed positionally, so a subject or a
 * path containing 0x1e is never taken for a header.
 */
export function parseNumstatZ(stream: string): ParsedCommit[] {
  const fields = stream.split('\0');
  const commits: ParsedCommit[] = [];
  let cur: ParsedCommit | null = null;
  let i = 0;
  while (i < fields.length) {
    let f = fields[i] as string;
    if (HEADER.test(f)) {
      cur = {
        hash: f.slice(1),
        ts: Number(fields[i + 1]),
        subject: fields[i + 2] ?? '',
        paths: [],
        unparsed: [],
      };
      commits.push(cur);
      i += 3;
      continue;
    }
    if (f.startsWith('\n')) f = f.slice(1);
    if (f === '') {
      i += 1;
      continue;
    }
    if (cur === null) {
      // A field before any header is a malformed stream; there is no commit to
      // attach it to.
      i += 1;
      continue;
    }
    const m = /^(-|\d+)\t(-|\d+)\t([\s\S]*)$/.exec(f);
    if (m === null) {
      cur.unparsed.push(f);
      i += 1;
      continue;
    }
    const path = m[3] as string;
    if (path === '') {
      const oldPath = fields[i + 1];
      const newPath = fields[i + 2];
      if (oldPath === undefined || newPath === undefined || oldPath === '' || newPath === '') {
        cur.unparsed.push(`rename:${f}`);
        i = fields.length; // truncated rename at end of stream: nothing left to read
        continue;
      }
      cur.paths.push(oldPath, newPath);
      i += 3;
      continue;
    }
    cur.paths.push(path);
    i += 1;
  }
  return commits;
}

/** git-generated revert subjects (`git revert` writes `Revert "…"`; reverting a
 *  revert writes `Reapply "…"`, git ≥ 2.43 — executed 2026-09-25). */
export function isRevertLabelled(subject: string): boolean {
  return subject.startsWith('Revert "') || subject.startsWith('Reapply "');
}

/** SKELETON: fix-label keyword rule (SZZ-style subject keywords). A revert is not
 *  also a fix. The vocabulary is provisional — see the gap list. */
export function isFixLabelled(subject: string): boolean {
  if (isRevertLabelled(subject)) return false;
  return /\b(fix|fixes|fixed|fixing|bug|bugfix|hotfix)\b/i.test(subject);
}

export interface MineOptions {
  diagnosticsDir: string;
  /** SKELETON: G8 — `tuning` lives in the global store (migration 002), which the
   *  plan's `mineCochange(store, repoPath, opts)` signature never passes. */
  global: Store;
}

export interface MineResult {
  commitsSeen: number;
  commitsIncluded: number;
  pairsWritten: number;
  unparsed: number;
  corpusFloorMet: boolean;
  headCommit: string | null;
}

function num(store: Store, key: string, fallback: number): number {
  const v = tuning.get(store, key);
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function git(repoPath: string, args: string[]): string {
  return oracleExecFileSync('git', args, { cwd: repoPath, maxBuffer: 256 * 1024 * 1024 });
}

/**
 * Mine `watermark..HEAD` into commits and cochange_pairs.
 * SKELETON: 1R — the miner writes no landmine at 1R: the `landmines.upsert`
 * calls (removed from the Step 9 DAO) are deleted together with the
 * revert/fix-hit collection that only they served; retired by Step 13
 */
export function mineCochange(store: Store, repoPath: string, opts: MineOptions): MineResult {
  const meta = schemaMetaDao(store);
  const commits = commitsDao(store);
  const pairs = cochangePairsDao(store);
  const files = filesDao(store);

  let head: string;
  try {
    head = git(repoPath, ['rev-parse', 'HEAD']).trim();
  } catch {
    return { commitsSeen: 0, commitsIncluded: 0, pairsWritten: 0, unparsed: 0, corpusFloorMet: false, headCommit: null };
  }
  const refTs = Number(git(repoPath, ['log', '-1', '--format=%ct', 'HEAD']).trim());

  const g = opts.global;
  const maxEntities = num(g, 'miner.max_transaction_entities', 30);
  const horizonYears = num(g, 'miner.horizon_years', 5);
  const horizonCommits = num(g, 'miner.horizon_commits', 10000);
  const floor = num(g, 'miner.corpus_floor_commits', 30);
  const horizonTs = refTs - horizonYears * 365 * DAY_S;

  // SKELETON: history-rewrite handling (G4). An unreachable watermark falls back
  // to a full mine without clearing existing counts and without a fault code.
  let range = 'HEAD';
  const watermark = meta.get('last_mined_commit');
  if (watermark !== undefined) {
    try {
      git(repoPath, ['merge-base', '--is-ancestor', watermark, 'HEAD']);
      range = `${watermark}..HEAD`;
    } catch {
      range = 'HEAD';
    }
  }

  const stream = git(repoPath, ['log', '--no-merges', '-M', '-z', '--numstat', '--format=%x1e%H%x00%at%x00%s%x00', range]);
  const parsed = parseNumstatZ(stream);

  const fileId = new Map<string, number>();
  const idFor = (p: string, hash: string): number => {
    let id = fileId.get(p);
    if (id !== undefined) return id;
    // SKELETON: G2 — a path with no indexer row gets a placeholder `files` row so
    // the foreign keys hold; the indexer (Step 14) overwrites it for paths still
    // in the tree.
    const existing = files.byPath(p);
    id =
      existing?.id ??
      files.upsert({
        path: p,
        lang: 'unknown',
        zone: 'unknown',
        contentHash: '',
        mtime: 0,
        prov: { prov_kind: 'commit', prov_ref: hash, trust: 'untrusted_repo' },
        // SKELETON: 1R — `files.upsert` takes `in_tree`; a miner-created row is
        // history-only (AD-4), so the stand-in is 0; retired by Step 13
        in_tree: 0,
      });
    fileId.set(p, id);
    return id;
  };

  let included = 0;
  let pairsWritten = 0;
  let unparsed = 0;

  // `git log` lists newest first; the commit-count horizon counts from HEAD back.
  store.transaction(() => {
    parsed.forEach((c, idx) => {
      if (c.unparsed.length > 0) {
        unparsed += c.unparsed.length;
        recordFault(store, opts.diagnosticsDir, {
          code: 'miner_unparsed_numstat',
          detail: { commit: c.hash, records: c.unparsed.length },
        });
      }
      const touched = [...new Set(c.paths)];
      let excludeReason: string | null = null;
      if (touched.length > maxEntities) excludeReason = 'max_transaction_entities';
      else if (c.ts < horizonTs || idx >= horizonCommits) excludeReason = 'horizon';
      commits.upsert({ hash: c.hash, ts: c.ts, entityCount: touched.length, excluded: excludeReason !== null, excludeReason });
      if (excludeReason !== null) return;
      included += 1;
      const ids = touched.map((p) => idFor(p, c.hash)).sort((a, b) => a - b);
      for (let a = 0; a < ids.length; a++) {
        for (let b = a + 1; b < ids.length; b++) {
          // SKELETON: 1R — `bump` takes the commit hash (parsed above) and AD-13's
          // recency weight, whose stand-in is 1 (no per-file counts are written
          // at 1R); retired by Step 13
          pairs.bump(ids[a] as number, ids[b] as number, c.ts, c.hash, 1);
          pairsWritten += 1;
        }
      }
    });

    meta.set('last_mined_commit', head);
  });

  return {
    commitsSeen: parsed.length,
    commitsIncluded: included,
    pairsWritten,
    unparsed,
    corpusFloorMet: commits.countIncluded() >= floor,
    headCommit: head,
  };
}
