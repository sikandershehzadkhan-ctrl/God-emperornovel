-- Declarative counterpart of src/runtime-feature-schema.mjs for fresh D1 installs.
-- Comment-report evidence is intentionally owned by 0019 and is not cascaded here.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(scope,key_hash)
);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window
  ON auth_rate_limits(window_start);

CREATE TABLE IF NOT EXISTS comment_likes (
  user_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,comment_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment
  ON comment_likes(comment_id);

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

-- request_votes was first introduced by migration 0008; keep this defensive
-- declaration so fresh and partially upgraded databases converge.
CREATE TABLE IF NOT EXISTS request_votes (
  request_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(request_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_request_votes_request
  ON request_votes(request_id);
