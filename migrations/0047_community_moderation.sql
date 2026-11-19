-- Community moderation schema required by the public comments and admin moderation handlers.
ALTER TABLE comments ADD COLUMN parent_id INTEGER;
ALTER TABLE comments ADD COLUMN edited_at TEXT;
CREATE TABLE IF NOT EXISTS comment_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_status ON comment_reports(comment_id,status);
CREATE INDEX IF NOT EXISTS idx_comment_reports_user_created ON comment_reports(user_id,created_at);
