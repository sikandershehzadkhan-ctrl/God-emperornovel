-- Ensure fresh D1 installs have the table even when the separate runtime-schema
-- migration from the earlier feature branch is not present in this branch.
CREATE TABLE IF NOT EXISTS comment_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enforce one comment report per account and comment.
-- Keep the earliest existing report if legacy data contains duplicates.
DELETE FROM comment_reports
WHERE id NOT IN (
  SELECT MIN(id)
  FROM comment_reports
  GROUP BY user_id, comment_id
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reports_user_comment
ON comment_reports(user_id, comment_id);
