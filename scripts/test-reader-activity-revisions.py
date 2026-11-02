import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
db.row_factory = sqlite3.Row
for migration in sorted((root / "migrations").glob("*.sql")):
    db.executescript(migration.read_text(encoding="utf-8"))

db.executescript("""
INSERT INTO users(id,username,email,password_hash) VALUES
 (1,'reader-one','one@example.test','x'),
 (2,'reader-two','two@example.test','x');
INSERT INTO novels(id,title,author,publication_status) VALUES
 (41,'Test Novel','Test Author','published');
INSERT INTO chapters(id,novel_id,chapter_number,title,content,publication_status) VALUES
 (4101,41,1,'One','x','published'),
 (4102,41,2,'Two','x','published');
""")

history_write = """INSERT INTO history(user_id,novel_id,chapter_number)
SELECT ?,?,? WHERE ?=COALESCE((SELECT history_version FROM reader_activity_versions WHERE user_id=? AND novel_id=?),0)
ON CONFLICT(user_id,novel_id) DO UPDATE SET
 chapter_number=MAX(history.chapter_number,excluded.chapter_number),
 updated_at=CASE WHEN excluded.chapter_number>=history.chapter_number THEN CURRENT_TIMESTAMP ELSE history.updated_at END"""
bookmark_write = """INSERT INTO bookmarks(user_id,novel_id,chapter_number)
SELECT ?,?,? WHERE ?=COALESCE((SELECT bookmark_version FROM reader_activity_versions WHERE user_id=? AND novel_id=?),0)
ON CONFLICT(user_id,novel_id) DO UPDATE SET
 chapter_number=MAX(bookmarks.chapter_number,excluded.chapter_number),
 updated_at=CASE WHEN excluded.chapter_number>=bookmarks.chapter_number THEN CURRENT_TIMESTAMP ELSE bookmarks.updated_at END"""

def write_history(user, novel, chapter, version):
    return db.execute(history_write, (user, novel, chapter, version, user, novel)).rowcount

def write_bookmark(user, novel, chapter, version):
    return db.execute(bookmark_write, (user, novel, chapter, version, user, novel)).rowcount

assert write_history(1, 41, 2, 0) == 1
assert write_bookmark(1, 41, 2, 0) == 1

# The revision increment and deletion are a single transaction, just like D1 batch().
with db:
    db.execute("""INSERT INTO reader_activity_versions(user_id,novel_id,history_version,bookmark_version)
                  VALUES(?,?,1,0)
                  ON CONFLICT(user_id,novel_id) DO UPDATE SET
                  history_version=history_version+1,updated_at=CURRENT_TIMESTAMP""", (1, 41))
    db.execute("DELETE FROM history WHERE user_id=? AND novel_id=?", (1, 41))

versions = db.execute("SELECT * FROM reader_activity_versions WHERE user_id=1 AND novel_id=41").fetchone()
assert versions["history_version"] == 1 and versions["bookmark_version"] == 0
assert db.execute("SELECT 1 FROM history WHERE user_id=1 AND novel_id=41").fetchone() is None
assert write_history(1, 41, 2, 0) == 0, "Old device must not recreate deleted history."
assert write_history(1, 41, 2, 1) == 1, "A fresh read using the current revision must be accepted."
assert write_bookmark(1, 41, 1, 0) == 1, "History deletion must not invalidate the independent bookmark."

# A bookmark deletion advances only the bookmark revision.
with db:
    db.execute("""INSERT INTO reader_activity_versions(user_id,novel_id,history_version,bookmark_version)
                  VALUES(?,?,0,1)
                  ON CONFLICT(user_id,novel_id) DO UPDATE SET
                  bookmark_version=bookmark_version+1,updated_at=CURRENT_TIMESTAMP""", (1, 41))
    db.execute("DELETE FROM bookmarks WHERE user_id=? AND novel_id=?", (1, 41))
versions = db.execute("SELECT * FROM reader_activity_versions WHERE user_id=1 AND novel_id=41").fetchone()
assert versions["history_version"] == 1 and versions["bookmark_version"] == 1
assert db.execute("SELECT 1 FROM history WHERE user_id=1 AND novel_id=41").fetchone() is not None
assert write_bookmark(1, 41, 2, 0) == 0, "Old device must not recreate deleted bookmark."
assert write_bookmark(1, 41, 2, 1) == 1, "A new bookmark action using the current revision must be accepted."

# Repeated deletion remains safe and advances the revision even if no row exists.
with db:
    db.execute("""INSERT INTO reader_activity_versions(user_id,novel_id,history_version,bookmark_version)
                  VALUES(?,?,1,0)
                  ON CONFLICT(user_id,novel_id) DO UPDATE SET
                  history_version=history_version+1,updated_at=CURRENT_TIMESTAMP""", (1, 41))
    db.execute("DELETE FROM history WHERE user_id=? AND novel_id=?", (1, 41))
versions = db.execute("SELECT history_version FROM reader_activity_versions WHERE user_id=1 AND novel_id=41").fetchone()
assert versions["history_version"] == 2
assert write_history(2, 41, 1, 0) == 1, "A different account must have an independent revision namespace."

print("PASS: revision-aware D1 writes reject stale history and bookmark events after deletion, accept fresh events, preserve independent activity dimensions, handle repeated deletes, and isolate accounts.")
