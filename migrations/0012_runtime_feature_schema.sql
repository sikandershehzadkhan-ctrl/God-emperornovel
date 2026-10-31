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
-- Preserve legacy duplicate reports for moderation/audit history before deduplication.
CREATE TABLE IF NOT EXISTS comment_reports_legacy_duplicates (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archive_reason TEXT NOT NULL DEFAULT 'duplicate'
);
-- Preserve invalid legacy reports for moderation/audit review before removing them.
INSERT OR IGNORE INTO comment_reports_legacy_duplicates
  (id,user_id,comment_id,reason,details,status,created_at,archive_reason)
SELECT r.id,r.user_id,r.comment_id,r.reason,r.details,r.status,r.created_at,'orphan_reference'
FROM comment_reports r
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id=r.user_id)
   OR NOT EXISTS (SELECT 1 FROM comments c WHERE c.id=r.comment_id);
-- Preserve duplicate reports before keeping the earliest active report per user/comment.
INSERT OR IGNORE INTO comment_reports_legacy_duplicates
  (id,user_id,comment_id,reason,details,status,created_at,archive_reason)
SELECT id,user_id,comment_id,reason,details,status,created_at,'duplicate'
FROM comment_reports
WHERE rowid NOT IN (
  SELECT MIN(rowid) FROM comment_reports GROUP BY user_id,comment_id
);
-- Invalid non-report interactions have no valid parent and are safe to discard.
DELETE FROM comment_likes
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id=comment_likes.user_id)
   OR NOT EXISTS (SELECT 1 FROM comments c WHERE c.id=comment_likes.comment_id);
-- Remove duplicate and orphan reports only after preserving report history above.
DELETE FROM comment_reports
WHERE rowid NOT IN (
  SELECT MIN(rowid) FROM comment_reports GROUP BY user_id,comment_id
)
   OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id=comment_reports.user_id)
   OR NOT EXISTS (SELECT 1 FROM comments c WHERE c.id=comment_reports.comment_id);
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
-- Clean orphan rows from the legacy tables after all referenced tables exist.
DELETE FROM novel_reactions
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id=novel_reactions.user_id)
   OR NOT EXISTS (SELECT 1 FROM novels n WHERE n.id=novel_reactions.novel_id);
DELETE FROM request_votes
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id=request_votes.user_id)
   OR NOT EXISTS (SELECT 1 FROM novel_requests r WHERE r.id=request_votes.request_id);


-- Enforce referential integrity for legacy tables created before FK constraints existed.
CREATE TRIGGER IF NOT EXISTS trg_comment_likes_validate_insert
BEFORE INSERT ON comment_likes
WHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)
  OR NOT EXISTS (SELECT 1 FROM comments WHERE id=NEW.comment_id)
BEGIN SELECT RAISE(ABORT,'comment_likes parent missing'); END;

CREATE TRIGGER IF NOT EXISTS trg_comment_likes_validate_update
BEFORE UPDATE OF user_id,comment_id ON comment_likes
WHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)
  OR NOT EXISTS (SELECT 1 FROM comments WHERE id=NEW.comment_id)
BEGIN SELECT RAISE(ABORT,'comment_likes parent missing'); END;

CREATE TRIGGER IF NOT EXISTS trg_comment_likes_user_cascade
AFTER DELETE ON users
BEGIN DELETE FROM comment_likes WHERE user_id=OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_comment_likes_comment_cascade
AFTER DELETE ON comments
BEGIN DELETE FROM comment_likes WHERE comment_id=OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_comment_reports_validate_insert
BEFORE INSERT ON comment_reports
WHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)
  OR NOT EXISTS (SELECT 1 FROM comments WHERE id=NEW.comment_id)
BEGIN SELECT RAISE(ABORT,'comment_reports parent missing'); END;

CREATE TRIGGER IF NOT EXISTS trg_comment_reports_validate_update
BEFORE UPDATE OF user_id,comment_id ON comment_reports
WHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)
  OR NOT EXISTS (SELECT 1 FROM comments WHERE id=NEW.comment_id)
BEGIN SELECT RAISE(ABORT,'comment_reports parent missing'); END;

CREATE TRIGGER IF NOT EXISTS trg_comment_reports_user_cascade
AFTER DELETE ON users
BEGIN DELETE FROM comment_reports WHERE user_id=OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_comment_reports_comment_cascade
AFTER DELETE ON comments
BEGIN DELETE FROM comment_reports WHERE comment_id=OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_novel_reactions_validate_insert
BEFORE INSERT ON novel_reactions
WHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)
  OR NOT EXISTS (SELECT 1 FROM novels WHERE id=NEW.novel_id)
BEGIN SELECT RAISE(ABORT,'novel_reactions parent missing'); END;

CREATE TRIGGER IF NOT EXISTS trg_novel_reactions_validate_update
BEFORE UPDATE OF user_id,novel_id ON novel_reactions
WHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)
  OR NOT EXISTS (SELECT 1 FROM novels WHERE id=NEW.novel_id)
BEGIN SELECT RAISE(ABORT,'novel_reactions parent missing'); END;

CREATE TRIGGER IF NOT EXISTS trg_novel_reactions_user_cascade
AFTER DELETE ON users
BEGIN DELETE FROM novel_reactions WHERE user_id=OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_novel_reactions_novel_cascade
AFTER DELETE ON novels
BEGIN DELETE FROM novel_reactions WHERE novel_id=OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_request_votes_validate_insert
BEFORE INSERT ON request_votes
WHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)
  OR NOT EXISTS (SELECT 1 FROM novel_requests WHERE id=NEW.request_id)
BEGIN SELECT RAISE(ABORT,'request_votes parent missing'); END;

CREATE TRIGGER IF NOT EXISTS trg_request_votes_validate_update
BEFORE UPDATE OF user_id,request_id ON request_votes
WHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id)
  OR NOT EXISTS (SELECT 1 FROM novel_requests WHERE id=NEW.request_id)
BEGIN SELECT RAISE(ABORT,'request_votes parent missing'); END;

CREATE TRIGGER IF NOT EXISTS trg_request_votes_user_cascade
AFTER DELETE ON users
BEGIN DELETE FROM request_votes WHERE user_id=OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_request_votes_request_cascade
AFTER DELETE ON novel_requests
BEGIN DELETE FROM request_votes WHERE request_id=OLD.id; END;
