ALTER TABLE users ADD COLUMN username_changed_at TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_users_username_changed_at ON users(username_changed_at);

CREATE TABLE IF NOT EXISTS username_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_username TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, old_username)
);
CREATE INDEX IF NOT EXISTS idx_username_history_user ON username_history(user_id, changed_at);
CREATE TRIGGER IF NOT EXISTS trg_users_username_history
AFTER UPDATE OF username ON users
FOR EACH ROW
WHEN OLD.username <> NEW.username
BEGIN
  INSERT OR IGNORE INTO username_history(user_id, old_username)
  VALUES(OLD.id, OLD.username);
END;

CREATE UNIQUE INDEX IF NOT EXISTS idx_username_history_global
ON username_history(old_username COLLATE NOCASE);

CREATE TRIGGER IF NOT EXISTS trg_users_reject_historical_username_reuse
BEFORE UPDATE OF username ON users
FOR EACH ROW
WHEN EXISTS (
  SELECT 1 FROM username_history
  WHERE old_username = NEW.username COLLATE NOCASE
    AND user_id <> OLD.id
)
BEGIN
  SELECT RAISE(ABORT, 'username is reserved');
END;

CREATE TRIGGER IF NOT EXISTS trg_users_reject_casefold_username_collision
BEFORE UPDATE OF username ON users
FOR EACH ROW
WHEN EXISTS (
  SELECT 1 FROM users
  WHERE username = NEW.username COLLATE NOCASE
    AND id <> OLD.id
)
BEGIN
  SELECT RAISE(ABORT, 'username is already in use');
END;
