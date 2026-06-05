CREATE TABLE IF NOT EXISTS file_content_lookup (
  snapshot_id TEXT NOT NULL,
  path        TEXT NOT NULL,
  content     TEXT NOT NULL,
  PRIMARY KEY (snapshot_id, path)
);

INSERT OR IGNORE INTO file_content_lookup (snapshot_id, path, content)
SELECT snapshot_id, path, content FROM file_content;
