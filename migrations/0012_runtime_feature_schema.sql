-- Runtime feature tables are also created lazily by runtime-feature-schema.mjs.
-- Keep this migration as the declarative D1 installation path for fresh databases.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(scope,key_hash)
);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window ON auth_rate_limits(window_start);

CREATE TABLE IF NOT EXISTS comment_likes (
  user_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,comment_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comment_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id,comment_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE
);
-- Existing lazy-bootstrap databases may contain duplicates from concurrent reports.
-- Keep the earliest report per user/comment before enforcing the same invariant.
DELETE FROM comment_reports
WHERE rowid NOT IN (
  SELECT MIN(rowid) FROM comment_reports GROUP BY user_id,comment_id
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reports_user_comment
  ON comment_reports(user_id,comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_status_created
  ON comment_reports(status,created_at);

CREATE TABLE IF NOT EXISTS novel_reactions (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  reaction TEXT NOT NULL CHECK(reaction IN ('love','fire','laugh','sad','clap')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,novel_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_novel_reactions_novel
  ON novel_reactions(novel_id,reaction);

CREATE TABLE IF NOT EXISTS request_votes (
  request_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(request_id,user_id),
  FOREIGN KEY(request_id) REFERENCES novel_requests(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_request_votes_request
  ON request_votes(request_id);
