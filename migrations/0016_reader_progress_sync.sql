ALTER TABLE history ADD COLUMN progress_percent INTEGER NOT NULL DEFAULT 0 CHECK(progress_percent BETWEEN 0 AND 100);
CREATE INDEX IF NOT EXISTS idx_history_user_updated ON history(user_id,updated_at DESC);
