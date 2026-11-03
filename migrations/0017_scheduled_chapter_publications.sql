CREATE TABLE IF NOT EXISTS scheduled_chapter_publications (
  chapter_id INTEGER PRIMARY KEY,
  publish_at TEXT NOT NULL,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_scheduled_chapter_publications_due
  ON scheduled_chapter_publications(publish_at);
