CREATE TABLE IF NOT EXISTS author_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT NOT NULL,
  experience TEXT NOT NULL DEFAULT '',
  portfolio_url TEXT NOT NULL DEFAULT '',
  sample_work TEXT NOT NULL,
  preferred_formats TEXT NOT NULL DEFAULT '[]',
  rights_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(rights_confirmed IN (0,1)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','withdrawn')),
  review_notes TEXT NOT NULL DEFAULT '',
  reviewed_by INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_author_applications_one_pending
  ON author_applications(user_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_author_applications_status_created
  ON author_applications(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_author_applications_user_created
  ON author_applications(user_id,created_at DESC);
