-- Convert existing 1-5 reader ratings to the equivalent even values on a 1-10 scale.
-- Rebuild preserves every voter, novel association and timestamp.
CREATE TABLE ratings_ten_point (
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, novel_id)
);
INSERT INTO ratings_ten_point (user_id, novel_id, rating, created_at, updated_at)
SELECT user_id, novel_id,
       CASE rating WHEN 1 THEN 2 WHEN 2 THEN 4 WHEN 3 THEN 6 WHEN 4 THEN 8 WHEN 5 THEN 10 ELSE rating END,
       created_at, updated_at
FROM ratings;
DROP TABLE ratings;
ALTER TABLE ratings_ten_point RENAME TO ratings;
UPDATE novels
SET rating = COALESCE((SELECT AVG(r.rating) FROM ratings r WHERE r.novel_id = novels.id), 0);
