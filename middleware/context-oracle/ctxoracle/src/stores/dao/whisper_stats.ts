// whisper_stats DAO (Step 9, AD-5). Global per-(genre, project, window) fold of
// whisper outcomes. `upsertFold` writes the recomputed window rows.
import type { Store } from '../adapter.js';

export interface WhisperStatFold {
  genre: string;
  projectKey: string;
  sent: number;
  correctedFalse: number;
  correctedMissed: number;
  windowStart: number;
  windowEnd: number;
}

export interface WhisperStatsDao {
  upsertFold(rows: WhisperStatFold[]): void;
}

export function whisperStatsDao(store: Store): WhisperStatsDao {
  return {
    upsertFold(rows) {
      store.transaction(() => {
        const ins = store.prepare(
          `INSERT INTO whisper_stats(genre, project_key, sent, corrected_false, corrected_missed,
             window_start, window_end)
           VALUES(?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(genre, project_key, window_start) DO UPDATE SET
             sent = excluded.sent, corrected_false = excluded.corrected_false,
             corrected_missed = excluded.corrected_missed, window_end = excluded.window_end`
        );
        for (const r of rows) {
          ins.run(r.genre, r.projectKey, r.sent, r.correctedFalse, r.correctedMissed, r.windowStart, r.windowEnd);
        }
      });
    },
  };
}
