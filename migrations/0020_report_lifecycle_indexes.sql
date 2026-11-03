-- Report queues and per-account report history.
-- Keep report rows independent of user/comment/novel deletion so moderation
-- evidence is not silently erased; orphaned context is surfaced by LEFT JOINs.
CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON reports(status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_created
  ON reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_novel
  ON reports(novel_id);
CREATE INDEX IF NOT EXISTS idx_reports_chapter
  ON reports(chapter_id);

CREATE INDEX IF NOT EXISTS idx_comment_reports_status_created
  ON comment_reports(status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_status
  ON comment_reports(comment_id, status);
