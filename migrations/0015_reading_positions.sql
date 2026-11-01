-- Persist chapter scroll position per account for cross-device reading continuity.
CREATE TABLE IF NOT EXISTS reading_positions (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK(progress_percent BETWEEN 0 AND 100),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, novel_id, chapter_number),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reading_positions_user_updated
  ON reading_positions(user_id, updated_at DESC);
