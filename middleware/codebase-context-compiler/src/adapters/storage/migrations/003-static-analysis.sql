-- Migration 003: static-analysis findings imported into the repository map.

CREATE TABLE IF NOT EXISTS static_findings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id TEXT NOT NULL,
  source      TEXT NOT NULL,
  rule_id     TEXT NOT NULL,
  severity    TEXT NOT NULL,
  message     TEXT NOT NULL,
  path        TEXT,
  start_line  INTEGER,
  end_line    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_static_findings_path ON static_findings(snapshot_id, path);
