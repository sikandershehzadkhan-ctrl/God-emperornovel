-- Imperial Novel: consent-based creator ownership transfer.
-- Transfer records intentionally retain numeric actor IDs for audit history.
-- No ownership is changed by inserting a request; acceptance is a separate guarded operation.

CREATE TABLE IF NOT EXISTS novel_ownership_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER NOT NULL,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected','cancelled','expired')),
  request_note TEXT NOT NULL DEFAULT '',
  requested_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  decided_at INTEGER,
  decision_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (from_user_id > 0),
  CHECK (to_user_id > 0),
  CHECK (from_user_id <> to_user_id),
  CHECK (expires_at > requested_at)
);

-- A novel may have at most one outstanding invitation at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_novel_ownership_transfer_pending
  ON novel_ownership_transfers(novel_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_ownership_transfer_recipient
  ON novel_ownership_transfers(to_user_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_ownership_transfer_owner
  ON novel_ownership_transfers(from_user_id, status, requested_at);

CREATE INDEX IF NOT EXISTS idx_ownership_transfer_novel_history
  ON novel_ownership_transfers(novel_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_ownership_transfer_expiry
  ON novel_ownership_transfers(status, expires_at);

-- Atomic guarded acceptance: ownership and invitation state share one SQLite statement.

CREATE TRIGGER IF NOT EXISTS trg_novel_ownership_transfer_accept
BEFORE UPDATE OF status ON novel_ownership_transfers
WHEN NEW.status = 'accepted' AND OLD.status = 'pending'
BEGIN
  SELECT CASE WHEN NEW.novel_id <> OLD.novel_id
    OR NEW.from_user_id <> OLD.from_user_id
    OR NEW.to_user_id <> OLD.to_user_id
    OR NEW.expires_at <> OLD.expires_at
    THEN RAISE(ABORT, 'ownership transfer identity is immutable') END;
  SELECT CASE WHEN OLD.expires_at <= CAST(strftime('%s','now') AS INTEGER)
    THEN RAISE(ABORT, 'ownership transfer expired') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM novels n
    JOIN users recipient ON recipient.id = NEW.to_user_id
    WHERE n.id = NEW.novel_id
      AND n.owner_user_id = NEW.from_user_id
      AND n.publication_status NOT IN ('review','archived','deleted')
      AND n.rights_status IN ('original','public_domain','licensed','authorized')
      AND (n.rights_status = 'original' OR LENGTH(TRIM(COALESCE(n.rights_evidence,''))) > 0)
      AND recipient.role = 'author' AND recipient.banned = 0
  ) THEN RAISE(ABORT, 'ownership transfer eligibility changed') END;
  UPDATE novels SET owner_user_id = NEW.to_user_id, updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.novel_id AND owner_user_id = NEW.from_user_id;
  SELECT CASE WHEN changes() <> 1 THEN RAISE(ABORT, 'novel ownership changed') END;
END;
