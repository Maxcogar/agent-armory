// faults DAO (Step 9). The store-backed fault table (the JSONL channel is the
// store-dead fallback). ULID id.
import type { Store } from '../adapter.js';
import type { FaultCode } from '../../diag/fault_codes.js';
import { ulid } from '../../util/ulid.js';

export interface FaultInput {
  code: FaultCode;
  detail_json?: string | null;
  session?: string | null;
  ts?: number;
}

export interface FaultRecord {
  id: string;
  ts: number;
  code: string;
  detail_json: string | null;
  session: string | null;
}

export interface FaultsDao {
  append(row: FaultInput): string;
  sinceTs(ts: number): FaultRecord[];
  countByCode(): Record<string, number>;
}

export function faultsDao(store: Store): FaultsDao {
  return {
    append(row) {
      const ts = row.ts ?? Date.now();
      const id = ulid(ts);
      store
        .prepare('INSERT INTO faults(id, ts, code, detail_json, session) VALUES(?, ?, ?, ?, ?)')
        .run(id, ts, row.code, row.detail_json ?? null, row.session ?? null);
      return id;
    },
    sinceTs(ts) {
      return store.prepare('SELECT * FROM faults WHERE ts >= ? ORDER BY ts, id').all(ts) as FaultRecord[];
    },
    countByCode() {
      const out: Record<string, number> = {};
      for (const r of store.prepare('SELECT code, count(*) AS n FROM faults GROUP BY code').all() as {
        code: string;
        n: number;
      }[]) {
        out[r.code] = r.n;
      }
      return out;
    },
  };
}
