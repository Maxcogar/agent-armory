-- Migration 002: context expansion audit trail (FR14 / AC4).

CREATE TABLE IF NOT EXISTS expansions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id  TEXT NOT NULL,
  snapshot_id TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  request_json TEXT NOT NULL,
  result_json  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expansions_package ON expansions(package_id, created_at);
