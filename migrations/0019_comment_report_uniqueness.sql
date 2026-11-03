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
