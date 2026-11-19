from pathlib import Path
import sqlite3

baseline = Path("migrations/0034_ratings_baseline.sql").read_text(encoding="utf-8")
upgrade = Path("migrations/0035_ten_point_ratings.sql").read_text(encoding="utf-8")


def prepare_base(db):
    db.executescript("""
    CREATE TABLE users (id INTEGER PRIMARY KEY);
    CREATE TABLE novels (id INTEGER PRIMARY KEY, rating REAL NOT NULL DEFAULT 0);
    INSERT INTO users(id) VALUES (1),(2),(3),(4),(5);
    INSERT INTO novels(id,rating) VALUES (10,99),(20,77),(30,55);
    """)


def assert_rejects(db, sql, params=()):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError("Expected rating constraint to reject the operation")


def assert_integrity(db):
    assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    assert db.execute("PRAGMA foreign_key_check").fetchall() == []


# Fresh installation: baseline creates the table before the 1–5 to 1–10 upgrade.
fresh = sqlite3.connect(":memory:")
prepare_base(fresh)
fresh.executescript(baseline)
fresh.executescript(upgrade)
schema = fresh.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='ratings'"
).fetchone()[0]
assert "BETWEEN 1 AND 10" in schema
assert "CAST(rating AS INTEGER)" in schema
fresh.execute("INSERT INTO ratings(user_id,novel_id,rating) VALUES(1,10,10)")
assert_rejects(fresh, "INSERT INTO ratings(user_id,novel_id,rating) VALUES(2,10,11)")
assert_rejects(fresh, "INSERT INTO ratings(user_id,novel_id,rating) VALUES(3,10,1.5)")
assert_rejects(fresh, "INSERT INTO ratings(user_id,novel_id,rating) VALUES(1,10,5)")
assert_integrity(fresh)
fresh.close()


# Existing installation: preserve every key and timestamp, map scores, and
# recompute every novel average (including novels with no remaining ratings).
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
original_rows = [
    (1, 10, 1, "created-1a", "updated-1a"),
    (2, 10, 3, "created-2a", "updated-2a"),
    (3, 10, 5, "created-3a", "updated-3a"),
    (4, 20, 2, "created-4b", "updated-4b"),
    (5, 20, 4, "created-5b", "updated-5b"),
]
legacy.executemany(
    "INSERT INTO ratings(user_id,novel_id,rating,created_at,updated_at) VALUES(?,?,?,?,?)",
    original_rows,
)
legacy.executescript(baseline)
legacy.executescript(upgrade)

rows = legacy.execute(
    "SELECT user_id,novel_id,rating,created_at,updated_at "
    "FROM ratings ORDER BY user_id,novel_id"
).fetchall()
expected = [
    (user_id, novel_id, rating * 2, created_at, updated_at)
    for user_id, novel_id, rating, created_at, updated_at in original_rows
]
assert rows == expected, (rows, expected)
assert legacy.execute("SELECT COUNT(*) FROM ratings").fetchone()[0] == len(original_rows)

# Averages are independently checked per novel; empty novels must reset to zero.
averages = dict(legacy.execute("SELECT id,rating FROM novels ORDER BY id").fetchall())
assert averages == {10: 6.0, 20: 6.0, 30: 0.0}, averages

# The composite primary key must still reject duplicate user/novel pairs.
assert_rejects(
    legacy,
    "INSERT INTO ratings(user_id,novel_id,rating) VALUES(1,10,7)",
)
# New valid boundary scores remain accepted after the table rebuild.
legacy.execute("INSERT INTO ratings(user_id,novel_id,rating) VALUES(1,30,1)")
legacy.execute("INSERT INTO ratings(user_id,novel_id,rating) VALUES(2,30,10)")
assert_rejects(legacy, "INSERT INTO ratings(user_id,novel_id,rating) VALUES(1,30,0)")
assert_rejects(legacy, "INSERT INTO ratings(user_id,novel_id,rating) VALUES(2,30,11)")
assert_rejects(legacy, "INSERT INTO ratings(user_id,novel_id,rating) VALUES(3,30,4.5)")

# Confirm the rebuilt table still exposes the expected composite primary key.
pk = legacy.execute("PRAGMA table_info(ratings)").fetchall()
pk_columns = [row[1] for row in sorted((row for row in pk if row[5]), key=lambda row: row[5])]
assert pk_columns == ["user_id", "novel_id"], pk_columns
assert_integrity(legacy)
print(
    "Ten-point rating migration passed: fresh install, complete legacy row/timestamp "
    "preservation, multi-novel averages, empty-novel reset, composite key, "
    "constraints and SQLite integrity."
)
