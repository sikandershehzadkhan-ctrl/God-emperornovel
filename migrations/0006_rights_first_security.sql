-- Imperial Novel 16.16.1 Rights-First + OmniPortal Security
-- Additive, idempotent tables. Existing publishing columns are preserved.

CREATE TABLE IF NOT EXISTS content_rights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'unknown',
  source_url TEXT,
  rights_status TEXT NOT NULL DEFAULT 'pending_review',
  license_name TEXT,
  rights_holder TEXT,
  attribution_required INTEGER NOT NULL DEFAULT 0,
  evidence_note TEXT,
  reviewed_by INTEGER,
  reviewed_at TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_rights_status
  ON content_rights(rights_status);

CREATE INDEX IF NOT EXISTS idx_content_rights_content
  ON content_rights(content_type, content_id);

CREATE TABLE IF NOT EXISTS rights_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT NOT NULL,
  actor_id INTEGER,
  action TEXT NOT NULL,
  content_type TEXT,
  content_id INTEGER,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rights_audit_content
  ON rights_audit_log(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_rights_audit_created
  ON rights_audit_log(created_at);
