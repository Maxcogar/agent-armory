// SessionEnd fold (Step 30, AD-5, AD-26): project whisper_audit + corrections
// newer than this project's watermark → global whisper_stats, in one BEGIN
// IMMEDIATE on the global store. WALKING SKELETON.
// SKELETON: G33 — whisper_stats is keyed by (genre, project_key, window_start)
// but no window is defined; the skeleton uses one all-time window (start 0).
import type { Store } from '../stores/adapter.js';

export function foldWhisperStats(global: Store, project: Store, repoKey: string): number {
  return global.transaction(() => {
    const wmKey = `whisper_stats_watermark:${repoKey}`;
    const wm = Number((global.prepare('SELECT value FROM global_meta WHERE key = ?').get(wmKey) as { value: string } | undefined)?.value ?? '0');
    const now = Date.now();
    const sent = project
      .prepare("SELECT genre, count(*) AS n FROM whisper_audit WHERE kind = 'whisper' AND ts > ? AND ts <= ? GROUP BY genre")
      .all(wm, now) as { genre: string | null; n: number }[];
    for (const r of sent) {
      global
        .prepare(
          `INSERT INTO whisper_stats(genre, project_key, sent, window_start, window_end) VALUES(?, ?, ?, 0, ?)
           ON CONFLICT(genre, project_key, window_start) DO UPDATE SET sent = sent + excluded.sent, window_end = excluded.window_end`
        )
        .run(r.genre ?? 'unknown', repoKey, r.n, now);
    }
    global.prepare('INSERT OR REPLACE INTO global_meta(key, value) VALUES(?, ?)').run(wmKey, String(now));
    return sent.reduce((a, r) => a + r.n, 0);
  });
}
