-- Imperial Novel: additive AI Author Studio atomic run-claim fields.
-- Create the base tables if a deployment has not initialized AI Author Studio yet.
CREATE TABLE IF NOT EXISTS ai_author_projects (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_user_id INTEGER NOT NULL, novel_id INTEGER, name TEXT NOT NULL, mode TEXT NOT NULL DEFAULT 'manual', status TEXT NOT NULL DEFAULT 'draft', genre TEXT DEFAULT '', fandom TEXT DEFAULT '', premise TEXT DEFAULT '', protagonist TEXT DEFAULT '', settings_json TEXT NOT NULL DEFAULT '{}', bible_json TEXT NOT NULL DEFAULT '{}', auto_publish INTEGER NOT NULL DEFAULT 0, chapters_target INTEGER NOT NULL DEFAULT 0, chapters_generated INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS ai_chapter_jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, owner_user_id INTEGER NOT NULL, chapter_number INTEGER NOT NULL, job_type TEXT NOT NULL DEFAULT 'draft', status TEXT NOT NULL DEFAULT 'queued', prompt TEXT DEFAULT '', result TEXT DEFAULT '', error TEXT DEFAULT '', attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, started_at TEXT, finished_at TEXT);
ALTER TABLE ai_author_projects ADD COLUMN active_run_token TEXT;
ALTER TABLE ai_author_projects ADD COLUMN active_run_started_at TEXT;
ALTER TABLE ai_author_projects ADD COLUMN active_run_owner_user_id INTEGER;
ALTER TABLE ai_chapter_jobs ADD COLUMN run_token TEXT;
CREATE INDEX IF NOT EXISTS idx_ai_chapter_jobs_run_token ON ai_chapter_jobs(run_token);
