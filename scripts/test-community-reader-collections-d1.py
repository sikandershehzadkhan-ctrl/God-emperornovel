import sqlite3
from pathlib import Path

migration = Path("migrations/0048_community_reader_collections.sql").read_text(encoding="utf-8")
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript("""
CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE);
CREATE TABLE novels (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publication_status TEXT NOT NULL DEFAULT 'published',
  rights_status TEXT NOT NULL DEFAULT 'original',
  rating REAL NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  cover_url TEXT NOT NULL DEFAULT ''
);
""")
db.executescript(migration)
db.execute("INSERT INTO users(id,username) VALUES(1,'reader-one')")
db.execute("INSERT INTO users(id,username) VALUES(2,'reader-two')")
for novel_id in range(1, 102):
    db.execute(
        "INSERT INTO novels(id,title,author,publication_status,rights_status) VALUES(?,?,?,'published','original')",
        (novel_id, f"Novel {novel_id}", "Author")
    )
for collection_id in range(1, 51):
    db.execute(
        "INSERT INTO community_collections(owner_user_id,title,visibility) VALUES(1,?,'private')",
        (f"Collection {collection_id}",)
    )
try:
    db.execute("INSERT INTO community_collections(owner_user_id,title) VALUES(1,'Collection 51')")
    raise AssertionError("database must reject a reader's 51st collection")
except sqlite3.IntegrityError as error:
    assert "community_collection_owner_limit" in str(error)
collection_id = db.execute("SELECT id FROM community_collections WHERE owner_user_id=1 ORDER BY id LIMIT 1").fetchone()[0]
for novel_id in range(1, 101):
    db.execute(
        "INSERT INTO community_collection_items(collection_id,novel_id,position) VALUES(?,?,?)",
        (collection_id, novel_id, novel_id)
    )
try:
    db.execute(
        "INSERT INTO community_collection_items(collection_id,novel_id,position) VALUES(?,?,?)",
        (collection_id, 101, 101)
    )
    raise AssertionError("database must reject a collection's 101st novel")
except sqlite3.IntegrityError as error:
    assert "community_collection_item_limit" in str(error)
try:
    db.execute(
        "INSERT INTO community_collection_items(collection_id,novel_id,position) VALUES(?,?,?)",
        (collection_id, 1, 102)
    )
    raise AssertionError("database must reject duplicate novel membership")
except sqlite3.IntegrityError as error:
    assert "UNIQUE constraint failed" in str(error)
db.execute("DELETE FROM users WHERE id=1")
assert db.execute("SELECT COUNT(*) FROM community_collections WHERE owner_user_id=1").fetchone()[0] == 0
assert db.execute("SELECT COUNT(*) FROM community_collection_items WHERE collection_id=?", (collection_id,)).fetchone()[0] == 0
print("PASS: reader collection D1 migration enforces 50/100 quotas atomically, duplicate membership and cascading owner deletion.")
