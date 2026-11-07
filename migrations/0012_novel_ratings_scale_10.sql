-- Imperial Novel: migrate individual novel ratings from 1–5 to 1–10.
-- Existing votes map to even scores (1→2, 2→4, 3→6, 4→8, 5→10).
-- Create the legacy shape only when absent so clean D1 installs can run this migration too.
CREATE TABLE IF NOT EXISTS ratings (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,novel_id)
);

CREATE TABLE ratings_1_to_10 (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 10),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,novel_id)
);

INSERT INTO ratings_1_to_10(user_id,novel_id,rating,created_at,updated_at)
SELECT user_id,novel_id,rating*2,created_at,updated_at
FROM ratings;

DROP TABLE ratings;
ALTER TABLE ratings_1_to_10 RENAME TO ratings;

UPDATE novels
SET rating = COALESCE((SELECT AVG(r.rating) FROM ratings r WHERE r.novel_id=novels.id),0);
