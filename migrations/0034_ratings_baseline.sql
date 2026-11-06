-- Ensure the legacy rating table exists before the following 1–5 to 1–10 rebuild.
-- Existing Worker-created tables are left intact; fresh installs receive the same baseline.
CREATE TABLE IF NOT EXISTS ratings (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,novel_id)
);
