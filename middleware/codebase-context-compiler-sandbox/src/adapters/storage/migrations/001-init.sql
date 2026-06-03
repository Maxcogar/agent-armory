-- Migration 001: initial repository-map + package/review/audit schema.
-- Architecture D4 (SQLite + FTS5). Facts are immutable per snapshot.

CREATE TABLE IF NOT EXISTS snapshots (
  snapshot_id TEXT PRIMARY KEY,
  repo_name   TEXT NOT NULL,
  root        TEXT NOT NULL,
  revision    TEXT,
  dirty_state INTEGER NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snapshots_root ON snapshots(root, created_at);

CREATE TABLE IF NOT EXISTS files (
  snapshot_id  TEXT NOT NULL,
  path         TEXT NOT NULL,
  language     TEXT,
  content_hash TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,
  boundary     TEXT NOT NULL,
  PRIMARY KEY (snapshot_id, path)
);

CREATE TABLE IF NOT EXISTS symbols (
  snapshot_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL,
  path        TEXT NOT NULL,
  start_line  INTEGER NOT NULL,
  end_line    INTEGER NOT NULL,
  exported    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(snapshot_id, name);
CREATE INDEX IF NOT EXISTS idx_symbols_path ON symbols(snapshot_id, path);

CREATE TABLE IF NOT EXISTS edges (
  snapshot_id TEXT NOT NULL,
  from_path   TEXT NOT NULL,
  to_path     TEXT NOT NULL,
  kind        TEXT NOT NULL,
  symbol      TEXT,
  from_line   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_edges_from ON edges(snapshot_id, from_path);
CREATE INDEX IF NOT EXISTS idx_edges_to ON edges(snapshot_id, to_path);

-- Full-text searchable file content (FTS5). snapshot_id/path are stored but
-- not tokenized so they can scope MATCH queries and back getFileContent.
CREATE VIRTUAL TABLE IF NOT EXISTS file_content USING fts5(
  snapshot_id UNINDEXED,
  path UNINDEXED,
  content
);

CREATE TABLE IF NOT EXISTS packages (
  package_id   TEXT PRIMARY KEY,
  snapshot_id  TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  json         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id   TEXT NOT NULL,
  snapshot_id  TEXT NOT NULL,
  reviewed_at  TEXT NOT NULL,
  json         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  ts     TEXT NOT NULL,
  actor  TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL
);
