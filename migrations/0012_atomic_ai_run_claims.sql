-- Imperial Novel: additive AI Author Studio atomic run-claim fields.
-- Additive only. Existing job history is preserved; no rows are rewritten.
ALTER TABLE ai_author_projects ADD COLUMN active_run_token TEXT;
ALTER TABLE ai_author_projects ADD COLUMN active_run_started_at TEXT;
ALTER TABLE ai_author_projects ADD COLUMN active_run_owner_user_id INTEGER;
ALTER TABLE ai_chapter_jobs ADD COLUMN run_token TEXT;
CREATE INDEX IF NOT EXISTS idx_ai_chapter_jobs_run_token ON ai_chapter_jobs(run_token);
