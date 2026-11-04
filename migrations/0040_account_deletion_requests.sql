-- A deletion request is a reversible workflow, never an erasure command.
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending_deletion','review_required','cancelled','finalized')),
  requested_at TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,
  cancelled_at TEXT,
  review_reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CHECK(scheduled_for > requested_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_account_deletion_active_request
  ON account_deletion_requests(user_id)
  WHERE status IN ('pending_deletion','review_required');

CREATE INDEX IF NOT EXISTS idx_account_deletion_review
  ON account_deletion_requests(status, scheduled_for);
