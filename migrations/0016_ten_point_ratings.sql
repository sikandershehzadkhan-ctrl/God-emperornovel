-- Expand the stored novel rating constraint from 1-5 to 1-10.
-- Preserve every existing valid rating while rebuilding the SQLite table constraint.
CREATE TABLE ratings_ten_point (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 10),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,novel_id)
);

INSERT INTO ratings_ten_point (user_id,novel_id,rating,created_at,updated_at)
SELECT user_id,novel_id,rating,created_at,updated_at
FROM ratings
WHERE rating BETWEEN 1 AND 10;

DROP TABLE ratings;
ALTER TABLE ratings_ten_point RENAME TO ratings;
