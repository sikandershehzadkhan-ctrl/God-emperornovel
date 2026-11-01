-- Imperial Novel: ensure chapter editing has a reliable update timestamp.
-- Existing chapter rows inherit their creation timestamp; new rows receive one automatically.
ALTER TABLE chapters ADD COLUMN updated_at TEXT;
UPDATE chapters SET updated_at = COALESCE(NULLIF(updated_at, ''), created_at, CURRENT_TIMESTAMP);
CREATE TRIGGER IF NOT EXISTS trg_chapters_set_updated_at_after_insert
AFTER INSERT ON chapters
WHEN NEW.updated_at IS NULL OR NEW.updated_at = ''
BEGIN
  UPDATE chapters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
