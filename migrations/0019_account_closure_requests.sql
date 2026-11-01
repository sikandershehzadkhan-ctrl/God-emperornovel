-- Imperial Novel account closure requests.
-- This records an authenticated, reversible request only. It does not erase accounts.
CREATE TABLE IF NOT EXISTS account_closure_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','cancelled','completed')),
  requested_at INTEGER NOT NULL,
  grace_until INTEGER NOT NULL,
  cancelled_at INTEGER,
  completed_at INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_closure_one_pending_per_user
  ON account_closure_requests(user_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_account_closure_status_grace
  ON account_closure_requests(status,grace_until);
