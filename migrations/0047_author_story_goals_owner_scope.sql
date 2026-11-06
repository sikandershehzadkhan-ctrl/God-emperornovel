-- Preserve private goals per creator when a novel changes owners.
-- The former owner's row remains private; the new owner may create a separate goal.
DROP INDEX IF EXISTS idx_author_story_goals_owner_updated;
ALTER TABLE author_story_goals RENAME TO author_story_goals_legacy;

CREATE TABLE author_story_goals (
  owner_user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  target_chapters INTEGER NOT NULL DEFAULT 0 CHECK(target_chapters BETWEEN 0 AND 10000),
  target_words INTEGER NOT NULL DEFAULT 0 CHECK(target_words BETWEEN 0 AND 5000000),
  target_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(owner_user_id,novel_id),
  FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE,
  FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO author_story_goals(owner_user_id,novel_id,target_chapters,target_words,target_date,created_at,updated_at)
SELECT owner_user_id,novel_id,target_chapters,target_words,target_date,created_at,updated_at
FROM author_story_goals_legacy;

DROP TABLE author_story_goals_legacy;

CREATE INDEX IF NOT EXISTS idx_author_story_goals_owner_updated
  ON author_story_goals(owner_user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_author_story_goals_novel
  ON author_story_goals(novel_id);
