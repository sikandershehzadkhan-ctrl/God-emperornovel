-- Add the timestamp column required by author chapter list/edit/publish handlers.
-- A constant default keeps this migration compatible with SQLite ALTER TABLE.
ALTER TABLE chapters ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
UPDATE chapters SET updated_at=CURRENT_TIMESTAMP WHERE updated_at IS NULL OR updated_at='';
