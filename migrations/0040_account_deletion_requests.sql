-- Rebuild the canonical account_closure_requests table at the account-deletion
-- review boundary without creating a second request ledger. Migration 0031 on
-- this governed lineage already includes the full review lifecycle status set.
-- Preserve every existing field and historical review metadata exactly.
CREATE TABLE account_closure_requests_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','review_required','pending_deletion','cancelled','completed')),
  requested_at INTEGER NOT NULL,
  grace_until INTEGER NOT NULL,
  cancelled_at INTEGER,
  completed_at INTEGER,
  review_reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CHECK(grace_until > requested_at)
);
INSERT INTO account_closure_requests_v2
  (id,user_id,status,requested_at,grace_until,cancelled_at,completed_at,review_reason,created_at,updated_at)
SELECT id,user_id,
  CASE WHEN status IN ('pending','review_required','pending_deletion','cancelled','completed')
    THEN status ELSE 'review_required' END,
  requested_at,grace_until,cancelled_at,completed_at,
  review_reason,created_at,updated_at
FROM account_closure_requests;
DROP TABLE account_closure_requests;
ALTER TABLE account_closure_requests_v2 RENAME TO account_closure_requests;
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_closure_one_pending_per_user
  ON account_closure_requests(user_id)
  WHERE status IN ('pending','review_required','pending_deletion');
CREATE INDEX IF NOT EXISTS idx_account_closure_status_grace
  ON account_closure_requests(status,grace_until);
