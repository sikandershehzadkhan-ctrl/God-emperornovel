import sqlite3

connection = sqlite3.connect(":memory:")
connection.execute("CREATE TABLE reading_positions (user_id INTEGER NOT NULL, novel_id INTEGER NOT NULL, chapter_number INTEGER NOT NULL, percent REAL NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, novel_id))")
sql = """INSERT INTO reading_positions(user_id,novel_id,chapter_number,percent,revision)
SELECT ?,?,?,?,1
WHERE ?=0 OR EXISTS(SELECT 1 FROM reading_positions WHERE user_id=? AND novel_id=? AND revision=?)
ON CONFLICT(user_id,novel_id) DO UPDATE SET chapter_number=excluded.chapter_number,percent=excluded.percent,revision=reading_positions.revision+1,updated_at=CURRENT_TIMESTAMP
WHERE reading_positions.revision=?
RETURNING novel_id,chapter_number,percent,revision"""
def write(user, novel, chapter, percent, expected):
    return connection.execute(sql, (user, novel, chapter, percent, expected, user, novel, expected, expected)).fetchone()

assert write(7, 11, 1, 10, 8) is None, "a nonzero revision must not create a missing row"
created = write(7, 11, 1, 10, 0)
assert created and created[3] == 1, "revision zero must create revision one"
updated = write(7, 11, 2, 55, 1)
assert updated and updated[1] == 2 and updated[2] == 55 and updated[3] == 2, "matching revision must update and increment"
assert write(7, 11, 3, 90, 1) is None, "stale revision must not overwrite newer progress"
assert write(8, 11, 3, 90, 2) is None, "another user must not update the owner's row"
assert connection.execute("SELECT user_id,chapter_number,percent,revision FROM reading_positions").fetchone() == (7, 2, 55.0, 2)
print("PASS: SQLite reader progress create, revision compare-and-swap, stale-write rejection and user isolation.")
