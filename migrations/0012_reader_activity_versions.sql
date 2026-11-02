-- Server-issued activity revisions prevent stale tabs/devices from recreating deleted rows.
CREATE TABLE IF NOT EXISTS reader_activity_versions (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  history_version INTEGER NOT NULL DEFAULT 0 CHECK(history_version >= 0),
  bookmark_version INTEGER NOT NULL DEFAULT 0 CHECK(bookmark_version >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,novel_id)
);
