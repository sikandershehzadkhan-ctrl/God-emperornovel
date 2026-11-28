-- Canonical server-side XP ledger for Imperial user rank progression.
-- Rank is derived from this ledger and the application-owned rank catalogue.
-- Founder identity and founder-only rank are intentionally not represented here.
ALTER TABLE users ADD COLUMN imperial_rank_visibility INTEGER NOT NULL DEFAULT 0
  CHECK (imperial_rank_visibility IN (0, 1));

CREATE TABLE IF NOT EXISTS imperial_xp_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  xp_delta INTEGER NOT NULL
    CHECK (
      typeof(xp_delta) = 'integer'
      AND xp_delta BETWEEN -100000 AND 100000
      AND xp_delta <> 0
    ),
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'chapter_reading_milestone',
      'review_published',
      'novel_published',
      'chapter_published',
      'community_contribution',
      'system_correction'
    )),
  source_event_key TEXT NOT NULL UNIQUE
    CHECK (length(source_event_key) BETWEEN 1 AND 160),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_imperial_xp_user_time
  ON imperial_xp_ledger(user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_imperial_xp_time_user
  ON imperial_xp_ledger(created_at DESC, user_id);
