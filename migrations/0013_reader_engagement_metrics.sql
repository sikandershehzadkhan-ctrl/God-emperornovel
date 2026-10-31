-- Imperial Novel: durable reaction and comment-like state for live engagement reporting.
-- Idempotent so this migration is safe to validate and re-apply.
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,comment_id)
);
CREATE TABLE IF NOT EXISTS novel_reactions (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  reaction TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,novel_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_novel_reactions_novel ON novel_reactions(novel_id,reaction);
CREATE INDEX IF NOT EXISTS idx_comments_novel_status_created ON comments(novel_id,status,created_at);
