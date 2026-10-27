-- Imperial Novel 16.7.0 chapter publishing and statistics.
ALTER TABLE chapters ADD COLUMN publication_status TEXT NOT NULL DEFAULT 'published';
CREATE INDEX IF NOT EXISTS idx_chapters_publication ON chapters(novel_id,publication_status,chapter_number);
CREATE TABLE IF NOT EXISTS chapter_views (chapter_id INTEGER PRIMARY KEY, views INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE);
