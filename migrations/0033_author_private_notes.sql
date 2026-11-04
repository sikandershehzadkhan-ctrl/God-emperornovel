-- Private creator notes, optionally attached to an owned chapter.
-- Branch-local migration 0015 is placed after the canonical 0001–0032 chain.
CREATE TABLE IF NOT EXISTS author_private_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  chapter_id INTEGER,
  note TEXT NOT NULL CHECK(length(note) BETWEEN 1 AND 4000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE,
  FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_author_private_notes_owner_story_updated
  ON author_private_notes(owner_user_id,novel_id,updated_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_author_private_notes_chapter
  ON author_private_notes(chapter_id,updated_at DESC);
