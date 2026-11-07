-- Move the product rating scale from 1–5 to 1–10 without losing existing votes.
-- Legacy votes are doubled (1→2, 2→4, …, 5→10), preserving their relative positions.
-- Create the legacy shape first so this migration also works on fresh databases where
-- the Worker bootstrap has not yet created the ratings table.
CREATE TABLE IF NOT EXISTS ratings (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,novel_id)
);

CREATE TABLE ratings_scale_10 (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 10),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,novel_id)
);

INSERT INTO ratings_scale_10(user_id,novel_id,rating,created_at,updated_at)
SELECT user_id,novel_id,rating*2,created_at,updated_at FROM ratings;

DROP TABLE ratings;
ALTER TABLE ratings_scale_10 RENAME TO ratings;

UPDATE novels
SET rating=COALESCE((SELECT AVG(r.rating) FROM ratings r WHERE r.novel_id=novels.id),0);
