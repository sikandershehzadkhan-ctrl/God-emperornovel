-- Canonical reversible account-closure request, extended for independent review.
-- This is the single request record used by both the user-facing cooling-off flow
-- and the later privacy/creator/finance review workflow. It never performs erasure.
CREATE TABLE IF NOT EXISTS account_closure_requests (
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_closure_one_pending_per_user
  ON account_closure_requests(user_id)
  WHERE status IN ('pending','review_required','pending_deletion');
CREATE INDEX IF NOT EXISTS idx_account_closure_status_grace
  ON account_closure_requests(status,grace_until);
