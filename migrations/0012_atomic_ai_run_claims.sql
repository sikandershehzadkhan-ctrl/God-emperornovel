-- Imperial Novel 17.24.0: atomic AI Author Studio run claims.
-- Additive only. Existing job history is preserved; no rows are rewritten.
ALTER TABLE ai_author_projects ADD COLUMN active_run_token TEXT;
ALTER TABLE ai_author_projects ADD COLUMN active_run_started_at TEXT;
ALTER TABLE ai_author_projects ADD COLUMN active_run_owner_user_id INTEGER;
ALTER TABLE ai_chapter_jobs ADD COLUMN run_token TEXT;
CREATE INDEX IF NOT EXISTS idx_ai_chapter_jobs_run_token ON ai_chapter_jobs(run_token);
