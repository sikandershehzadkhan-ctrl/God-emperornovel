-- Convert legacy integer ratings from 1–5 to the equivalent even values on 1–10.
-- The release workflow preflights the live table definition and runs this file only
-- when ratings is absent or still has the legacy 1–5 constraint. It skips a verified
-- 1–10 table on subsequent release attempts.
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
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 10 AND rating=CAST(rating AS INTEGER)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id,novel_id)
);

INSERT INTO ratings_scale_10(user_id,novel_id,rating,created_at,updated_at)
SELECT user_id,novel_id,rating*2,created_at,updated_at
FROM ratings;

DROP TABLE ratings;
ALTER TABLE ratings_scale_10 RENAME TO ratings;

UPDATE novels
SET rating=COALESCE((SELECT AVG(r.rating) FROM ratings r WHERE r.novel_id=novels.id),0);
