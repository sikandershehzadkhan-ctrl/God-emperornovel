-- Dedicated comment-report records used by community reporting and moderation APIs.
-- A user may report a given comment once; status changes remain auditable.
CREATE TABLE IF NOT EXISTS comment_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, comment_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_reports_status_created
  ON comment_reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_status
  ON comment_reports(comment_id, status);
