-- PR #118 migration 0012 owns the canonical comment_reports table, including
-- uniqueness, foreign keys, legacy archival, validation triggers and status index.
-- Keep only the additional comment-first index used by moderation lookups.
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_status
  ON comment_reports(comment_id, status);
