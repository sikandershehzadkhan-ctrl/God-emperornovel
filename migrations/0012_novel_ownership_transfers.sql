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
