-- Email ownership verification is separate from the existing creator/admin verification badge.
-- A reset flow must never interpret users.verified as proof of mailbox ownership.
ALTER TABLE users ADD COLUMN email_verified_at TEXT;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email_snapshot TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose = 'email_verification'),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  consumption_id TEXT UNIQUE,
  invalidated_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_created
  ON email_verification_tokens(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expiry
  ON email_verification_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_active
  ON email_verification_tokens(user_id, expires_at)
  WHERE consumed_at IS NULL AND invalidated_at IS NULL;
