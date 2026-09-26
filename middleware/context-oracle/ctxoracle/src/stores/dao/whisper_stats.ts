// whisper_stats DAO (Step 9; reopened 2026-09-26 build delta, AD-5). The global
// replica of each project's stats_folds totals, keyed (genre, project_key). The
// fold's publish step replaces a project's rows wholesale, so an import, a
// purge, or a replaced store can neither strand nor double-count a row.
import type { Store } from '../adapter.js';

/** One replica row of a project's totals. */
export interface WhisperStatRow {
  genre: string;
  sent: number;
  correctedFalse: number;
  correctedMissed: number;
}

export interface WhisperStatRecord {
  genre: string;
  project_key: string;
  sent: number;
  corrected_false: number;
  corrected_missed: number;
  published_at: number;
}

export interface WhisperStatsDao {
  /** Delete the project's rows and insert `rows`, atomically (inside the caller's transaction when there is one). */
  replaceForProject(projectKey: string, rows: WhisperStatRow[], publishedAt: number): void;
  forProject(projectKey: string): WhisperStatRecord[];
}

export function whisperStatsDao(store: Store): WhisperStatsDao {
  return {
    replaceForProject(projectKey, rows, publishedAt) {
      store.transaction(() => {
        store.prepare('DELETE FROM whisper_stats WHERE project_key = ?').run(projectKey);
        const ins = store.prepare(
          `INSERT INTO whisper_stats(genre, project_key, sent, corrected_false, corrected_missed, published_at)
           VALUES(?, ?, ?, ?, ?, ?)`
        );
        for (const r of rows) ins.run(r.genre, projectKey, r.sent, r.correctedFalse, r.correctedMissed, publishedAt);
      });
    },
    forProject(projectKey) {
      return store
        .prepare('SELECT * FROM whisper_stats WHERE project_key = ? ORDER BY genre')
        .all(projectKey) as WhisperStatRecord[];
    },
  };
}
