// observed_actions DAO (Step 9). The per-session record of tool actions the
// oracle observed (AD-4). No id/ULID (keyed by session+seq in practice). The
// tool classification below is the DAO's mapping; the handler (Step 25/28)
// owns which tools it records under which name.
import type { Store } from '../adapter.js';

const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'];
const READ_TOOLS = ['Read', 'Grep', 'Glob'];

export interface ObservedActionInput {
  session: string;
  consumer: string;
  seq: number;
  tool: string;
  path?: string | null;
  content_hash?: string | null;
  command_class?: 1 | 2 | 3 | null;
  outcome?: 'ok' | 'failed' | null;
  ts: number;
}

export interface ObservedActionsDao {
  append(row: ObservedActionInput): void;
  okEdits(session: string): number;
  okReads(session: string): number;
  runs(session: string): number;
  pathWrites(session: string, sinceSeq: number): string[];
  firstHash(session: string, path: string): string | undefined;
  /** Whether any ok Edit/Write of `path` exists with ts > sinceTs, any session. */
  writtenSince(path: string, sinceTs: number): boolean;
}

function inList(col: string, values: string[]): string {
  return `${col} IN (${values.map(() => '?').join(', ')})`;
}

export function observedActionsDao(store: Store): ObservedActionsDao {
  return {
    append(row) {
      store
        .prepare(
          `INSERT INTO observed_actions(session, consumer, seq, tool, path, content_hash,
             command_class, outcome, ts)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          row.session,
          row.consumer,
          row.seq,
          row.tool,
          row.path ?? null,
          row.content_hash ?? null,
          row.command_class ?? null,
          row.outcome ?? null,
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
    runs(session) {
      const row = store
        .prepare("SELECT count(*) AS n FROM observed_actions WHERE session = ? AND tool = 'Bash'")
        .get(session) as { n: number };
      return row.n;
    },
    pathWrites(session, sinceSeq) {
      return (
        store
          .prepare(
            `SELECT DISTINCT path FROM observed_actions
             WHERE session = ? AND seq > ? AND path IS NOT NULL AND ${inList('tool', EDIT_TOOLS)}
             ORDER BY path`
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
    writtenSince(path, sinceTs) {
      return (
        store
          .prepare(
            `SELECT 1 AS n FROM observed_actions
             WHERE path = ? AND ts > ? AND outcome = 'ok' AND ${inList('tool', EDIT_TOOLS)}
             LIMIT 1`
          )
          .get(path, sinceTs, ...EDIT_TOOLS) !== undefined
      );
    },
  };
}
