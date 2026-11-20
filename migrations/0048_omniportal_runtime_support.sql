-- Canonical OmniPortal support tables.
-- These tables were previously created lazily by GET handlers. They are now
-- provisioned by migration so read endpoints remain side-effect-free.

CREATE TABLE IF NOT EXISTS connector_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connector_id INTEGER,
  event TEXT NOT NULL,
  status TEXT NOT NULL,
  details TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  connector_id INTEGER,
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  message TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  novel_id INTEGER,
  reason TEXT,
  score REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connector_authorization_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connector_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  evidence_url TEXT DEFAULT '',
  terms_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  metadata_import_allowed INTEGER NOT NULL DEFAULT 0,
  attribution_required INTEGER NOT NULL DEFAULT 0,
  reviewed_by INTEGER,
  reviewed_at TEXT,
  review_notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_connector_events_connector
  ON connector_events(connector_id, created_at);
CREATE INDEX IF NOT EXISTS idx_import_jobs_user
  ON import_jobs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_connector_auth_requests_status
  ON connector_authorization_requests(status, created_at);
