import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")

# Exercise the canonical fresh-install chain through migration 0017 only.
for path in sorted(Path("migrations").glob("[0-9][0-9][0-9][0-9]_*.sql")):
    if int(path.name[:4]) > 17:
        continue
    db.executescript(path.read_text(encoding="utf-8"))

def must_fail(sql, params=()):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError("Expected migration constraint to reject: " + sql)

db.execute("INSERT INTO users(username,email,password_hash) VALUES('reader','reader@example.test','hash')")
db.execute("INSERT INTO users(username,email,password_hash) VALUES('second','second@example.test','hash')")
profile = db.execute("SELECT display_name,bio,avatar_url,website_url,location,profile_visibility,show_reading_stats,profile_updated_at,preferences_json FROM users WHERE id=1").fetchone()
assert profile == ("","","","","","private",0,"","{}"), profile
must_fail("UPDATE users SET profile_visibility='friends' WHERE id=1")
must_fail("UPDATE users SET show_reading_stats=2 WHERE id=1")

# Username history is recorded and globally reserved, including future inserts.
db.execute("UPDATE users SET username='reader-renamed' WHERE id=1")
assert db.execute("SELECT user_id,old_username FROM username_history").fetchall() == [(1,"reader")]
must_fail("UPDATE users SET username='reader' WHERE id=2")
must_fail("INSERT INTO users(username,email,password_hash) VALUES('reader','third@example.test','hash')")
must_fail("UPDATE users SET username='READER-RENAMED' WHERE id=2")

# Chapter revision snapshots retain the chapter/editor relationship.
db.execute("INSERT INTO novels(title,author,owner_user_id) VALUES('Revision fixture','reader-renamed',1)")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content) VALUES(1,1,'Chapter 1','Current text')")
db.execute("""INSERT INTO chapter_revisions(chapter_id,chapter_number,title,content,is_locked,ticket_cost,editor_user_id)
              VALUES(1,1,'Chapter 1','Earlier text',0,0,1)""")
assert db.execute("SELECT content FROM chapter_revisions WHERE chapter_id=1").fetchone()[0] == "Earlier text"
must_fail("""INSERT INTO chapter_revisions(chapter_id,chapter_number,title,content,editor_user_id)
             VALUES(999,1,'Missing','Snapshot',1)""")

# A chapter can have one scheduled publication record, with valid foreign keys.
db.execute("INSERT INTO scheduled_chapter_publications(chapter_id,publish_at,created_by) VALUES(1,'2030-01-01T00:00:00Z',1)")
assert db.execute("SELECT publish_at FROM scheduled_chapter_publications WHERE chapter_id=1").fetchone()[0] == "2030-01-01T00:00:00Z"
must_fail("INSERT INTO scheduled_chapter_publications(chapter_id,publish_at) VALUES(1,'2031-01-01T00:00:00Z')")
must_fail("INSERT INTO scheduled_chapter_publications(chapter_id,publish_at) VALUES(999,'2031-01-01T00:00:00Z')")

assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
assert db.execute("PRAGMA foreign_key_check").fetchall() == []
print("PASS: profile defaults/constraints, username history and reservation, chapter revision snapshots, scheduled publication uniqueness and referential integrity.")
