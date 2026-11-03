-- Account-scoped chapter scroll progress for cross-device reading resume.
-- Scroll percentage is a chapter position, not an estimate of whole-novel completion.
CREATE TABLE IF NOT EXISTS reader_progress (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL CHECK (chapter_number > 0),
  progress_percent INTEGER NOT NULL CHECK (progress_percent BETWEEN 0 AND 100),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, novel_id)
);
CREATE INDEX IF NOT EXISTS idx_reader_progress_user_updated
  ON reader_progress(user_id, updated_at DESC);
