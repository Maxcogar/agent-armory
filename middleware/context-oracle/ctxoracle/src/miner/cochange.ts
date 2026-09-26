// Co-change miner (Step 13; AD-13, AD-15 labels and landmine derivation, AD-26
// chunked writes, AD-19 pointer-only evidence; FR-K2 hygiene, FR-A6 corpus floor).
//
// One pass: decide full vs incremental (exactly two cases), purge on a full
// pass, stream `git log -z --numstat --reverse` through the single spawn seam and
// aggregate it in memory outside any transaction, write the aggregate in chunk
// transactions of `miner.chunk_ms` that each advance the watermark with their own
// rows, then one short final transaction (landmine rebuild, watermark = the HEAD
// mined, ref_ts, corpus floor, sweep).
//
// Why `-z`: git's machine-output mode emits every path as raw bytes (no
// C-quoting) and a rename as two separate NUL fields, so a path is never
// mis-keyed and a real file named `a => b.txt` is never mistaken for a rename
// (probe:24_git_numstat_z). NUL is the only byte a pathname cannot hold, so the
// stream is split on NUL alone, and header/subject/body/path fields are consumed
// positionally, never rescanned.

import { performance } from 'node:perf_hooks';
import type { Store } from '../stores/adapter.js';
import { oracleRunSync, oracleSpawn } from '../util/spawn.js';
import { decodePathBytes, escapeBytes } from '../util/path_bytes.js';
import { recordFault } from '../diag/fault_writer.js';
import { commitsDao } from '../stores/dao/commits.js';
import { cochangePairsDao } from '../stores/dao/cochange_pairs.js';
import { filesDao } from '../stores/dao/files.js';
import { labelledTouchesDao, type TouchLabel } from '../stores/dao/labelled_touches.js';
import { landminesDao, type MinerLandmineRow } from '../stores/dao/landmines.js';
import { schemaMetaDao } from '../stores/dao/schema_meta.js';
import { isSuspect } from '../security/injection.js';
import type { TuningReader } from '../types/candidate.js';
import { isFixLabelled, isRevertLabelled } from './labels.js';

/** AD-13's fixed weight epoch: 2000-01-01T00:00:00Z in epoch seconds. */
const T0 = 946_684_800;
const DAY_S = 86_400;
/** `miner.horizon_years` is converted with the Julian year (plan Step 13). */
const YEAR_DAYS = 365.25;
const NUL = 0x00;
const RS = 0x1e;
const TAB = 0x09;
const LF = 0x0a;
/** Fault detail carries at most this many leading bytes of a malformed record (plan Step 13). */
const DETAIL_BYTES = 80;
/** `path_not_utf8` detail carries at most this many rejected paths (Step 6 fault shape). */
const REJECTED_SAMPLE = 5;

// ---------------------------------------------------------------------------
// The `-z --numstat` parser.

/** One commit as parsed from the stream. */
export interface ParsedCommit {
  hash: string;
  /** Author time (`%at`), epoch seconds. */
  ts: number;
  /** Read only by the label functions; never stored (AD-15, AD-19). */
  subject: string;
  /** Read only by the label functions; never stored (AD-15, AD-19). */
  body: string;
  /** Raw path bytes as git recorded them; a rename contributes both identities. */
  paths: Buffer[];
}

/** A record the parser could not read; reported as `miner_unparsed_numstat`, never guessed. */
export interface MalformedRecord {
  /** The commit the record sits in, or null before any header. */
  commit: string | null;
  /** The record's first 80 bytes, escaped (`escapeBytes`). */
  detail: string;
}

type State = 'header' | 'ts' | 'subject' | 'body' | 'sep' | 'entry' | 'renameOld' | 'renameNew';

function isHeader(f: Buffer): boolean {
  if (f.length !== 41 || f[0] !== RS) return false;
  for (let i = 1; i < 41; i++) {
    const b = f[i] as number;
    if (!((b >= 0x30 && b <= 0x39) || (b >= 0x61 && b <= 0x66))) return false;
  }
  return true;
}

function isCountField(f: Buffer): boolean {
  if (f.length === 1 && f[0] === 0x2d) return true; // '-' (binary)
  if (f.length === 0) return false;
  for (const b of f) if (b < 0x30 || b > 0x39) return false;
  return true;
}

/**
 * Incremental parser over the NUL-delimited stream. `push` accepts `Buffer`
 * chunks in stream order; a commit is emitted when the next header (or the end)
 * shows it is complete. Only the field being read is held beyond the current
 * commit's paths.
 */
class NumstatZParser {
  private state: State = 'header';
  private rest: Buffer = Buffer.alloc(0);
  private cur: ParsedCommit | null = null;
  private firstEntry = false;
  private renameMarker: Buffer | null = null;
  private renameOld: Buffer | null = null;

  constructor(
    private readonly onCommit: (c: ParsedCommit) => void,
    private readonly onMalformed: (m: MalformedRecord) => void
  ) {}

  push(chunk: Buffer): void {
    const buf = this.rest.length === 0 ? chunk : Buffer.concat([this.rest, chunk]);
    let start = 0;
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === NUL) {
        this.field(buf.subarray(start, i));
        start = i + 1;
      }
    }
    // Copy the partial field so the chunk it came from is not retained.
    this.rest = Buffer.from(buf.subarray(start));
  }

  end(): void {
    if (this.rest.length > 0) {
      this.malformed(this.rest); // an unterminated final field
      this.rest = Buffer.alloc(0);
    }
    switch (this.state) {
      case 'renameOld':
      case 'renameNew':
        // A rename marker whose identity fields are missing at end of stream.
        this.malformed(this.renameMarker ?? Buffer.alloc(0));
        this.emit();
        break;
      case 'ts':
      case 'subject':
      case 'body':
      case 'sep':
        // A header whose fields stop short: the commit cannot be read.
        this.malformed(Buffer.from(`\x1e${this.cur?.hash ?? ''}`, 'latin1'));
        this.cur = null;
        break;
      default:
        this.emit();
    }
    this.state = 'header';
  }

  private malformed(record: Buffer): void {
    this.onMalformed({ commit: this.cur?.hash ?? null, detail: escapeBytes(record.subarray(0, DETAIL_BYTES)) });
  }

  private emit(): void {
    if (this.cur !== null) this.onCommit(this.cur);
    this.cur = null;
  }

  private startCommit(f: Buffer): void {
    this.emit();
    this.cur = { hash: f.subarray(1).toString('latin1'), ts: NaN, subject: '', body: '', paths: [] };
    this.state = 'ts';
  }

  private field(f: Buffer): void {
    switch (this.state) {
      case 'header':
        if (isHeader(f)) this.startCommit(f);
        else this.malformed(f); // a leading field that is not a valid header
        return;
      case 'ts': {
        const ts = Number(f.toString('latin1'));
        if (!Number.isInteger(ts)) {
          this.malformed(f);
          this.cur = null; // the commit cannot be dated: nothing of it is used
          this.state = 'header';
          return;
        }
        (this.cur as ParsedCommit).ts = ts;
        this.state = 'subject';
        return;
      }
      case 'subject':
        (this.cur as ParsedCommit).subject = f.toString('utf8');
        this.state = 'body';
        return;
      case 'body':
        (this.cur as ParsedCommit).body = f.toString('utf8');
        this.state = 'sep';
        return;
      case 'sep':
        this.state = 'entry';
        this.firstEntry = true;
        if (f.length !== 0) this.entry(f); // git always writes it empty; read the field as an entry otherwise
        return;
      case 'entry':
        if (isHeader(f)) {
          // A header is expected here: after the separator or after an entry.
          this.startCommit(f);
          return;
        }
        this.entry(f);
        return;
      case 'renameOld':
        this.renameOld = f;
        this.state = 'renameNew';
        return;
      case 'renameNew':
        (this.cur as ParsedCommit).paths.push(Buffer.from(this.renameOld as Buffer), Buffer.from(f));
        this.renameOld = null;
        this.renameMarker = null;
        this.state = 'entry';
        return;
    }
  }

  private entry(raw: Buffer): void {
    let f = raw;
    if (this.firstEntry) {
      this.firstEntry = false;
      if (f[0] === LF) f = f.subarray(1); // the first entry carries exactly one leading `\n`
    }
    const t1 = f.indexOf(TAB);
    const t2 = t1 < 0 ? -1 : f.indexOf(TAB, t1 + 1);
    if (t1 < 0 || t2 < 0 || !isCountField(f.subarray(0, t1)) || !isCountField(f.subarray(t1 + 1, t2))) {
      this.malformed(f); // lacks the `<added>\t<deleted>\t` shape
      return;
    }
    const path = f.subarray(t2 + 1);
    if (path.length === 0) {
      // A rename: the two raw identity fields follow.
      this.renameMarker = Buffer.from(f);
      this.state = 'renameOld';
      return;
    }
    (this.cur as ParsedCommit).paths.push(Buffer.from(path));
  }
}

/**
 * Parse the output of
 *   git log --no-merges -M -z --numstat --reverse --format=%x1e%H%x00%at%x00%s%x00%b%x00
 * Per commit: `\x1e<40 hex>`, `<author ts>`, `<subject>`, `<body>`, one empty
 * field, then the numstat entries, the first carrying one leading `\n`. A field
 * is a header only where a header is expected (stream start, after the
 * separator, after an entry), so a body or path holding `0x1e` never starts a
 * commit. A leading non-header field, an entry lacking `<added>\t<deleted>\t`,
 * and a rename marker missing its two identity fields are malformed records.
 */
export function parseNumstatZ(buf: Buffer): { commits: ParsedCommit[]; malformed: MalformedRecord[] } {
  const commits: ParsedCommit[] = [];
  const malformed: MalformedRecord[] = [];
  const p = new NumstatZParser(
    (c) => commits.push(c),
    (m) => malformed.push(m)
  );
  p.push(buf);
  p.end();
  return { commits, malformed };
}

// ---------------------------------------------------------------------------
// The pass.

export interface MineOptions {
  tuning: TuningReader;
  diagnosticsDir: string;
  /** The indexer's own full flag, passed through unchanged (Step 14). */
  full?: boolean;
}

export interface MineResult {
  /** Commits the stream yielded in this pass's range. */
  commitsSeen: number;
  /** Commits this pass wrote as included. */
  included: number;
  /** Commits this pass wrote as excluded (horizon or size). */
  excluded: number;
  /** Chunk transactions committed. */
  chunks: number;
  /** The watermark was not an ancestor of HEAD (a `history_rewritten` pass). */
  rewritten: boolean;
  /** Path occurrences rejected by `decodePathBytes` (the `path_not_utf8` count). */
  pathsRejected: number;
}

/** One commit, aggregated in memory before its chunk writes it. */
interface PendingCommit {
  hash: string;
  ts: number;
  entityCount: number;
  excludeReason: 'horizon' | 'size' | null;
  /** Decoded touched paths (distinct); empty when nothing of the commit is written beyond its row. */
  paths: string[];
  label: TouchLabel | null;
}

function git(repoPath: string, args: string[]): { status: number | null; out: string; err: string } {
  const r = oracleRunSync('git', args, { cwd: repoPath });
  return { status: r.status, out: r.stdout.toString('utf8'), err: r.stderr.toString('utf8') };
}

function gitOk(repoPath: string, args: string[]): string {
  const r = git(repoPath, args);
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} exited ${String(r.status)}: ${r.err.trim()}`);
  return r.out.trim();
}

/** Stream `git log` through the spawn seam, handing each stdout `Buffer` chunk to `onChunk`. */
function streamGitLog(repoPath: string, args: string[], onChunk: (b: Buffer) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = oracleSpawn('git', args, { cwd: repoPath, stdout: 'pipe' });
    let failed: unknown = null;
    child.stdout?.on('data', (b: Buffer) => {
      if (failed !== null) return;
      try {
        onChunk(b);
      } catch (e) {
        failed = e;
        child.kill();
      }
    });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (failed !== null) reject(failed);
      else if (code !== 0) reject(new Error(`git ${args.join(' ')} exited ${String(code ?? signal)}`));
      else resolve();
    });
  });
}

/**
 * Mine the repository's history into `commits`, `files.change_count` /
 * `change_weight`, `cochange_pairs`, and `labelled_touches`, and rebuild the
 * miner-kind landmines (plan Step 13). Every threshold is read from
 * `opts.tuning`; none has a fallback literal.
 */
export async function mineCochange(store: Store, repoPath: string, opts: MineOptions): Promise<MineResult> {
  const t = opts.tuning;
  const maxEntities = t.num('miner.max_transaction_entities');
  const horizonYears = t.num('miner.horizon_years');
  const horizonCommits = t.num('miner.horizon_commits');
  const floor = t.num('miner.corpus_floor_commits');
  const chunkMs = t.num('miner.chunk_ms');
  const h = t.num('bar.recency_half_life_days');
  const fixK = t.num('landmine.fix_chatter_k');
  const fixWindowDays = t.num('landmine.fix_chatter_window_days');
  const fixKeywords = t.list('lexicon.fix_keywords');

  const meta = schemaMetaDao(store);
  const commits = commitsDao(store);
  const pairs = cochangePairsDao(store);
  const files = filesDao(store);
  const touches = labelledTouchesDao(store);
  const landmines = landminesDao(store);

  const result: MineResult = { commitsSeen: 0, included: 0, excluded: 0, chunks: 0, rewritten: false, pathsRejected: 0 };

  // A repository with no commit has no history to mine; nothing is written.
  const headProbe = git(repoPath, ['rev-parse', '--verify', '-q', 'HEAD']);
  if (headProbe.status !== 0) return result;
  const head = headProbe.out.trim();
  // The reference instant is HEAD's committer time, never the wall clock (G19).
  const refTs = Number(gitOk(repoPath, ['log', '-1', '--format=%ct', 'HEAD']));
  const horizonTs = refTs - horizonYears * YEAR_DAYS * DAY_S;

  // ---- Full or incremental: exactly two cases (expert review S3). --------
  const watermark = meta.get('last_mined_commit');
  let full = opts.full === true || watermark === undefined || meta.get('mining_in_progress') === '1';
  const minedH = meta.get('mined_half_life_days');
  if (watermark !== undefined && (minedH === undefined || Number(minedH) !== h)) full = true;
  if (watermark !== undefined) {
    const anc = git(repoPath, ['merge-base', '--is-ancestor', watermark, 'HEAD']);
    if (anc.status === 1 || anc.status === 128) {
      // The watermark is not an ancestor (1) or the object is gone (128): G4.
      result.rewritten = true;
      full = true;
      recordFault(store, opts.diagnosticsDir, { code: 'history_rewritten', detail: { oldWatermark: watermark, newHead: head } });
    } else if (anc.status !== 0) {
      throw new Error(`git merge-base --is-ancestor exited ${String(anc.status)}: ${anc.err.trim()}`);
    }
  }

  if (full) {
    // The purge transaction (AD-13's purge set); on an empty store every delete is a no-op.
    store.transaction(() => {
      commits.deleteAll();
      pairs.deleteAll();
      touches.deleteAll();
      files.resetChangeCounts();
      landmines.deleteMinerKinds();
      meta.delete('last_mined_commit');
      meta.set('mined_half_life_days', String(h));
      meta.set('mining_in_progress', '1');
    });
  }
  const range = full ? 'HEAD' : `${watermark as string}..HEAD`;

  // ---- Stream and aggregate, outside any transaction (AD-26). -------------
  const rangeCount = Number(gitOk(repoPath, ['rev-list', '--count', '--no-merges', range]));
  const firstInHorizon = rangeCount - horizonCommits; // stream positions below this are horizon-excluded
  const pending: PendingCommit[] = [];
  const malformed: MalformedRecord[] = [];
  const rejectedSample: string[] = [];
  let position = 0;

  const onCommit = (c: ParsedCommit): void => {
    const pos = position++;
    result.commitsSeen += 1;
    // A commit already in `commits` is skipped: a resumed pass never counts it twice (AD-13).
    if (commits.exists(c.hash)) return;
    const seenRaw = new Set<string>();
    const decoded = new Set<string>();
    for (const raw of c.paths) {
      const key = raw.toString('latin1');
      if (seenRaw.has(key)) continue;
      seenRaw.add(key);
      const p = decodePathBytes(raw);
      if (p === null) {
        result.pathsRejected += 1;
        if (rejectedSample.length < REJECTED_SAMPLE) rejectedSample.push(escapeBytes(raw));
        continue;
      }
      decoded.add(p);
    }
    // entity_count measures the commit as git recorded it, rejected paths included.
    const entityCount = seenRaw.size;
    const horizonExcluded = pos < firstInHorizon || c.ts < horizonTs;
    const sizeExcluded = !horizonExcluded && entityCount > maxEntities;
    // Revert detection runs over every horizon-included commit, before the size
    // exclusion; fix labels only on included commits, never on a revert (AD-15).
    const revert = !horizonExcluded && isRevertLabelled(c.subject, c.body);
    const fix = !horizonExcluded && !sizeExcluded && !revert && isFixLabelled(c.subject, fixKeywords);
    const label: TouchLabel | null = revert ? 'revert' : fix ? 'fix' : null;
    const writesPaths = !horizonExcluded && (!sizeExcluded || revert);
    pending.push({
      hash: c.hash,
      ts: c.ts,
      entityCount,
      excludeReason: horizonExcluded ? 'horizon' : sizeExcluded ? 'size' : null,
      paths: writesPaths ? [...decoded] : [],
      label,
    });
  };
  const parser = new NumstatZParser(onCommit, (m) => malformed.push(m));
  await streamGitLog(
    repoPath,
    ['log', '--no-merges', '-M', '-z', '--numstat', '--reverse', '--format=%x1e%H%x00%at%x00%s%x00%b%x00', range],
    (b) => parser.push(b)
  );
  parser.end();

  for (const m of malformed) {
    recordFault(store, opts.diagnosticsDir, { code: 'miner_unparsed_numstat', detail: { commit: m.commit, record: m.detail } });
  }
  if (result.pathsRejected > 0) {
    recordFault(store, opts.diagnosticsDir, {
      code: 'path_not_utf8',
      detail: { writer: 'miner', count: result.pathsRejected, first: rejectedSample },
    });
  }

  // ---- Chunk transactions (AD-26). ---------------------------------------
  const writeCommit = (c: PendingCommit): void => {
    // The commit row first, so a path's first-naming commit is "in commits"
    // when its provenance is checked (plan Step 13).
    commits.upsert({ hash: c.hash, ts: c.ts, entityCount: c.entityCount, excluded: c.excludeReason !== null, excludeReason: c.excludeReason });
    if (c.excludeReason === null) result.included += 1;
    else result.excluded += 1;
    if (c.paths.length === 0) return;
    const w = 2 ** ((c.ts - T0) / (h * DAY_S));
    const ids: number[] = [];
    for (const p of c.paths) {
      const id = files.ensureHistoryRow(p, isSuspect(p), c.hash);
      files.repointStaleCommitProv(id, c.hash);
      ids.push(id);
      if (c.label !== null) touches.add(id, c.hash, c.label, c.ts);
    }
    if (c.excludeReason !== null) return; // a size-excluded revert: labels only
    ids.sort((a, b) => a - b);
    for (const id of ids) files.addChangeCount(id, 1, w);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) pairs.bump(ids[i] as number, ids[j] as number, c.ts, c.hash, w);
    }
  };

  let next = 0;
  while (next < pending.length) {
    store.transaction(() => {
      const started = performance.now();
      do {
        writeCommit(pending[next] as PendingCommit);
        next += 1;
      } while (next < pending.length && performance.now() - started < chunkMs);
      // The watermark commits with its own rows: never ahead of its data.
      meta.set('last_mined_commit', (pending[next - 1] as PendingCommit).hash);
    });
    result.chunks += 1;
  }

  // ---- The final transaction. ---------------------------------------------
  store.transaction(() => {
    const rows: MinerLandmineRow[] = [];
    const build = (kind: MinerLandmineRow['kind'], label: TouchLabel, sinceTs: number, min: number): void => {
      for (const g of touches.touchesSince(label, sinceTs)) {
        if (g.count < min) continue;
        const evidence = [...g.hashes].reverse(); // newest first
        const file = files.byId(g.fileId);
        rows.push({
          kind,
          fileId: g.fileId,
          evidence: JSON.stringify(evidence),
          support: g.count,
          prov: {
            prov_kind: 'commit',
            prov_ref: evidence[0] as string,
            trust: 'untrusted_repo',
            injection_suspect: file?.injection_suspect === 1,
          },
        });
      }
    };
    build('revert_chain', 'revert', horizonTs, 2);
    build('fix_chatter', 'fix', refTs - fixWindowDays * DAY_S, fixK);
    landmines.rebuildMinerKinds(rows);
    // The HEAD mined to, including a merge HEAD no chunk can name (AD-13).
    meta.set('last_mined_commit', head);
    meta.set('ref_ts', String(refTs));
    meta.set('corpus_floor_met', commits.countIncluded() >= floor ? '1' : '0');
    if (full) meta.set('mining_in_progress', '0');
    files.sweepUnreferenced();
  });

  return result;
}
