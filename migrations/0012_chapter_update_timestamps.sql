-- Imperial Novel: durable chapter update timestamps for live publication feeds.
ALTER TABLE chapters ADD COLUMN updated_at TEXT;
UPDATE chapters SET updated_at=COALESCE(created_at,CURRENT_TIMESTAMP) WHERE updated_at IS NULL OR updated_at='';
CREATE TRIGGER IF NOT EXISTS chapters_set_updated_at_after_insert
AFTER INSERT ON chapters
BEGIN
  UPDATE chapters SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS chapters_set_updated_at_after_edit
AFTER UPDATE OF title,content,chapter_number,publication_status ON chapters
WHEN NEW.updated_at IS OLD.updated_at
BEGIN
  UPDATE chapters SET updated_at=CURRENT_TIMESTAMP WHERE id=NEW.id;
END;
CREATE INDEX IF NOT EXISTS idx_chapters_updated ON chapters(publication_status,updated_at);
