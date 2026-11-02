CREATE TABLE IF NOT EXISTS author_story_goals (
  novel_id INTEGER PRIMARY KEY,
  owner_user_id INTEGER NOT NULL,
  target_chapters INTEGER NOT NULL DEFAULT 0 CHECK(target_chapters BETWEEN 0 AND 10000),
  target_words INTEGER NOT NULL DEFAULT 0 CHECK(target_words BETWEEN 0 AND 5000000),
  target_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE,
  FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_author_story_goals_owner_updated
  ON author_story_goals(owner_user_id,updated_at DESC);
