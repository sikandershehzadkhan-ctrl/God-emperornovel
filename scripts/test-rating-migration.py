from pathlib import Path
import sqlite3

baseline = Path("migrations/0034_ratings_baseline.sql").read_text(encoding="utf-8")
upgrade = Path("migrations/0035_ten_point_ratings.sql").read_text(encoding="utf-8")

def prepare_base(db):
    db.executescript("""
    CREATE TABLE users (id INTEGER PRIMARY KEY);
    CREATE TABLE novels (id INTEGER PRIMARY KEY, rating REAL NOT NULL DEFAULT 0);
    INSERT INTO users(id) VALUES (1),(2),(3),(4),(5);
    INSERT INTO novels(id,rating) VALUES (10,0);
    """)

def assert_rejects(db, sql, params):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError("Expected rating CHECK constraint to reject value")

# Fresh installation: baseline creates the table before the 1–10 upgrade.
fresh = sqlite3.connect(":memory:")
prepare_base(fresh)
fresh.executescript(baseline)
fresh.executescript(upgrade)
schema = fresh.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='ratings'").fetchone()[0]
assert "BETWEEN 1 AND 10" in schema
fresh.execute("INSERT INTO ratings(user_id,novel_id,rating) VALUES(1,10,10)")
assert_rejects(fresh, "INSERT INTO ratings(user_id,novel_id,rating) VALUES(2,10,11)", ())
fresh.close()

# Existing installation: preserve all existing ratings and timestamps, scale 1–5 to even 1–10 values.
legacy = sqlite3.connect(":memory:")
prepare_base(legacy)
legacy.executescript("""
CREATE TABLE ratings (
 user_id INTEGER NOT NULL,
 novel_id INTEGER NOT NULL,
 rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,novel_id)
);
""")
legacy.executemany(
    "INSERT INTO ratings(user_id,novel_id,rating,created_at,updated_at) VALUES(?,?,?,?,?)",
    [(i,10,i,f"created-{i}",f"updated-{i}") for i in range(1,6)]
)
legacy.executescript(baseline)
legacy.executescript(upgrade)
rows = legacy.execute("SELECT user_id,rating,created_at,updated_at FROM ratings ORDER BY user_id").fetchall()
assert [row[1] for row in rows] == [2,4,6,8,10]
assert rows[0][2:] == ("created-1","updated-1")
assert legacy.execute("SELECT rating FROM novels WHERE id=10").fetchone()[0] == 6
legacy.execute("INSERT INTO ratings(user_id,novel_id,rating) VALUES(6,10,1)")
legacy.execute("INSERT INTO ratings(user_id,novel_id,rating) VALUES(7,10,10)")
assert_rejects(legacy, "INSERT INTO ratings(user_id,novel_id,rating) VALUES(8,10,0)", ())
assert_rejects(legacy, "INSERT INTO ratings(user_id,novel_id,rating) VALUES(9,10,11)", ())
print("Ten-point rating migration passed: fresh install, legacy conversion, timestamps, averages and 1–10 constraints.")
