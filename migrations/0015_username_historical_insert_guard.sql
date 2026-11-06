-- Enforce historical username reservation for newly registered accounts.
-- This complements the UPDATE guard in 0013 and closes the INSERT path.
CREATE TRIGGER IF NOT EXISTS trg_users_reject_historical_username_reuse_on_insert
BEFORE INSERT ON users
FOR EACH ROW WHEN EXISTS (
  SELECT 1 FROM username_history
  WHERE old_username=NEW.username COLLATE NOCASE
)
BEGIN
  SELECT RAISE(ABORT, 'username is reserved');
END;
