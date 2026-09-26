// observed_actions DAO (Step 9; reopened 2026-09-26 build delta, N16/G22/M7).
// The per-session record of tool actions the oracle observed (AD-4). The engine
// assigns `seq` (INTEGER PRIMARY KEY) at insert under the write lock; every
// ordering and watermark reads `seq`, never the wall-clock `ts`. The tool
// classification below is the DAO's mapping; the handler (Step 28) owns which
// tools it records under which name.
import type { Store } from '../adapter.js';

// The change/re-edit consumers' set. The current hooks reference documents the
// file tools Write, Edit, and NotebookEdit and no MultiEdit tool (plan Step 9
// (a); expert review m6), so no tool set names MultiEdit.
const EDIT_TOOLS = ['Edit', 'Write', 'NotebookEdit'];
const READ_TOOLS = ['Read', 'Grep', 'Glob'];

export interface ObservedActionInput {
  session: string;
  consumer: string;
  tool: string;
  path?: string | null;
  content_hash?: string | null;
  command_class?: 1 | 2 | 3 | null;
  outcome?: 'ok' | 'failed' | null;
  /** Step 17's per-segment classes of a Bash row, as JSON. */
  segments_json?: string | null;
  ts: number;
}

/** A Bash row as `runs` returns it (either outcome). */
export interface RunRow {
  command_class: 1 | 2 | 3 | null;
  segments_json: string | null;
  outcome: 'ok' | 'failed' | null;
}

export interface ObservedActionsDao {
  append(row: ObservedActionInput): void;
  okEdits(session: string): number;
  okReads(session: string): number;
  /** The consumer's Bash rows of either outcome, in seq order. */
  runs(session: string, consumer: string): RunRow[];
  /** Distinct paths written by an edit tool with seq > sinceSeq, in seq order of first write. */
  pathWrites(session: string, sinceSeq: number): string[];
  firstHash(session: string, path: string): string | undefined;
  /** Post-write hashes of the session's ok edits of `path`, in seq order. */
  hashesFor(session: string, path: string): string[];
  /** Distinct paths of the consumer's `outcome = 'ok'` edit-tool rows (G22). */
  okEditedPaths(session: string, consumer: string): string[];
  /** Whether any ok edit-tool row of `path` exists with seq > sinceSeq, in any session (M7). */
  writtenSinceSeq(path: string, sinceSeq: number): boolean;
  /** The largest seq, or 0 on an empty table. */
  maxSeq(): number;
}

function inList(col: string, values: string[]): string {
  return `${col} IN (${values.map(() => '?').join(', ')})`;
}

export function observedActionsDao(store: Store): ObservedActionsDao {
  return {
    append(row) {
      store
        .prepare(
          `INSERT INTO observed_actions(session, consumer, tool, path, command_class, outcome,
             content_hash, segments_json, ts)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          row.session,
          row.consumer,
          row.tool,
          row.path ?? null,
          row.command_class ?? null,
          row.outcome ?? null,
          row.content_hash ?? null,
          row.segments_json ?? null,
          row.ts
        );
    },
    okEdits(session) {
      const row = store
        .prepare(
          `SELECT count(*) AS n FROM observed_actions
           WHERE session = ? AND outcome = 'ok' AND ${inList('tool', EDIT_TOOLS)}`
        )
        .get(session, ...EDIT_TOOLS) as { n: number };
      return row.n;
    },
    okReads(session) {
      const row = store
        .prepare(
          `SELECT count(*) AS n FROM observed_actions
           WHERE session = ? AND outcome = 'ok' AND ${inList('tool', READ_TOOLS)}`
        )
        .get(session, ...READ_TOOLS) as { n: number };
      return row.n;
    },
    runs(session, consumer) {
      return store
        .prepare(
          `SELECT command_class, segments_json, outcome FROM observed_actions
           WHERE session = ? AND consumer = ? AND tool = 'Bash' ORDER BY seq`
        )
        .all(session, consumer) as RunRow[];
    },
    pathWrites(session, sinceSeq) {
      return (
        store
          .prepare(
            `SELECT path FROM observed_actions
             WHERE session = ? AND seq > ? AND path IS NOT NULL AND ${inList('tool', EDIT_TOOLS)}
             GROUP BY path ORDER BY min(seq)`
          )
          .all(session, sinceSeq, ...EDIT_TOOLS) as { path: string }[]
      ).map((r) => r.path);
    },
    firstHash(session, path) {
      const row = store
        .prepare(
          `SELECT content_hash FROM observed_actions
           WHERE session = ? AND path = ? AND outcome = 'ok' AND content_hash IS NOT NULL
           ORDER BY seq LIMIT 1`
        )
        .get(session, path) as { content_hash: string } | undefined;
      return row?.content_hash;
    },
    hashesFor(session, path) {
      return (
        store
          .prepare(
            `SELECT content_hash FROM observed_actions
             WHERE session = ? AND path = ? AND outcome = 'ok' AND content_hash IS NOT NULL
               AND ${inList('tool', EDIT_TOOLS)}
             ORDER BY seq`
          )
          .all(session, path, ...EDIT_TOOLS) as { content_hash: string }[]
      ).map((r) => r.content_hash);
    },
    okEditedPaths(session, consumer) {
      return (
        store
          .prepare(
            `SELECT path FROM observed_actions
             WHERE session = ? AND consumer = ? AND outcome = 'ok' AND path IS NOT NULL
               AND ${inList('tool', EDIT_TOOLS)}
             GROUP BY path ORDER BY min(seq)`
          )
          .all(session, consumer, ...EDIT_TOOLS) as { path: string }[]
      ).map((r) => r.path);
    },
    writtenSinceSeq(path, sinceSeq) {
      return (
        store
          .prepare(
            `SELECT 1 AS n FROM observed_actions
             WHERE path = ? AND seq > ? AND outcome = 'ok' AND ${inList('tool', EDIT_TOOLS)}
             LIMIT 1`
          )
          .get(path, sinceSeq, ...EDIT_TOOLS) !== undefined
      );
    },
    maxSeq() {
      return (store.prepare('SELECT coalesce(max(seq), 0) AS m FROM observed_actions').get() as { m: number }).m;
    },
  };
}
