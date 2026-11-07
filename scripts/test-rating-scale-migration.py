import pathlib
import sqlite3
import tempfile

MIGRATION = pathlib.Path("migrations/0012_novel_ratings_scale_10.sql").read_text(encoding="utf-8")

def database(with_votes):
    db = sqlite3.connect(":memory:")
    db.execute("CREATE TABLE novels (id INTEGER PRIMARY KEY, rating REAL NOT NULL DEFAULT 0)")
    db.executemany("INSERT INTO novels(id,rating) VALUES(?,?)", [(1, 5.0), (2, 3.0), (3, 0.0)])
    if with_votes:
        db.execute("""CREATE TABLE ratings (
            user_id INTEGER NOT NULL, novel_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(user_id,novel_id))""")
        db.executemany(
            "INSERT INTO ratings(user_id,novel_id,rating,created_at,updated_at) VALUES(?,?,?,?,?)",
            [(1,1,1,"2026-01-01","2026-01-02"), (2,1,5,"2026-01-03","2026-01-04"),
             (1,2,3,"2026-02-01","2026-02-02"), (2,2,4,"2026-02-03","2026-02-04"),
             (1,3,2,"2026-03-01","2026-03-02")]
        )
    return db

def assert_new_scale(db):
    sql = db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='ratings'").fetchone()[0]
    assert "BETWEEN 1 AND 10" in sql, sql
    values = [row[0] for row in db.execute("SELECT rating FROM ratings ORDER BY novel_id,user_id")]
    assert all(isinstance(v, int) and 1 <= v <= 10 for v in values), values
    try:
        db.execute("INSERT INTO ratings(user_id,novel_id,rating) VALUES(999,999,0)")
        raise AssertionError("zero rating unexpectedly accepted")
    except sqlite3.IntegrityError:
        pass
    try:
        db.execute("INSERT INTO ratings(user_id,novel_id,rating) VALUES(998,999,11)")
        raise AssertionError("rating 11 unexpectedly accepted")
    except sqlite3.IntegrityError:
        pass

# Existing installation: preserve each vote and timestamp while mapping 1–5 to 2–10.
existing = database(True)
existing.executescript(MIGRATION)
assert_new_scale(existing)
rows = existing.execute("SELECT user_id,novel_id,rating,created_at,updated_at FROM ratings ORDER BY novel_id,user_id").fetchall()
assert rows == [(1,1,2,"2026-01-01","2026-01-02"), (2,1,10,"2026-01-03","2026-01-04"),
                (1,2,6,"2026-02-01","2026-02-02"), (2,2,8,"2026-02-03","2026-02-04"),
                (1,3,4,"2026-03-01","2026-03-02")], rows
aggregates = dict(existing.execute("SELECT id,rating FROM novels"))
assert aggregates == {1:6.0, 2:7.0, 3:4.0}, aggregates
assert existing.execute("SELECT COUNT(*) FROM ratings WHERE novel_id=999").fetchone()[0] == 0
assert existing.execute("SELECT COUNT(*) FROM ratings").fetchone()[0] == 5

# Clean installation: no ratings table exists before this migration.
fresh = database(False)
fresh.executescript(MIGRATION)
assert_new_scale(fresh)
assert fresh.execute("SELECT COUNT(*) FROM ratings").fetchone()[0] == 0
assert dict(fresh.execute("SELECT id,rating FROM novels")) == {1:0.0, 2:0.0, 3:0.0}

print("PASS: D1 rating migration preserves votes/timestamps, maps 1–5 to 2–10, recomputes aggregates, enforces bounds, and supports clean installs.")
