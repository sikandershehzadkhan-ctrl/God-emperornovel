-- PR #118 migration 0012 owns the canonical comment_likes and novel_reactions
-- table definitions, including referential-integrity constraints. This migration
-- adds only the reader-engagement indexes needed by the analytics queries.
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_novel_status_created ON comments(novel_id,status,created_at);
