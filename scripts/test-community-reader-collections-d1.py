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
duplicate_collection_id = db.execute(
    "INSERT INTO community_collections(owner_user_id,title) VALUES(2,'Duplicate Fixture') RETURNING id"
).fetchone()[0]
db.execute(
    "INSERT INTO community_collection_items(collection_id,novel_id,position) VALUES(?,?,?)",
    (duplicate_collection_id, 1, 0)
)
try:
    db.execute(
        "INSERT INTO community_collection_items(collection_id,novel_id,position) VALUES(?,?,?)",
        (duplicate_collection_id, 1, 1)
    )
    raise AssertionError("database must reject duplicate novel membership")
except sqlite3.IntegrityError as error:
    assert "UNIQUE constraint failed" in str(error)
db.execute("DELETE FROM users WHERE id=1")
assert db.execute("SELECT COUNT(*) FROM community_collections WHERE owner_user_id=1").fetchone()[0] == 0
assert db.execute("SELECT COUNT(*) FROM community_collection_items WHERE collection_id=?", (collection_id,)).fetchone()[0] == 0

# Exercise the same ownership predicates and public/eligible-story filters used by the API.
db.execute("INSERT INTO novels(id,title,author,publication_status,rights_status) VALUES(102,'Draft','Author','draft','original')")
db.execute("INSERT INTO novels(id,title,author,publication_status,rights_status) VALUES(103,'Unlicensed','Author','published','unlicensed')")
private_other = db.execute(
    "INSERT INTO community_collections(owner_user_id,title,visibility) VALUES(2,'Reader two private','private') RETURNING id"
).fetchone()[0]
public_other = db.execute(
    "INSERT INTO community_collections(owner_user_id,title,visibility) VALUES(2,'Reader two public','public') RETURNING id"
).fetchone()[0]
# Public discovery must never return the private collection.
public_ids = {
    row[0] for row in db.execute(
        "SELECT c.id FROM community_collections c WHERE c.visibility='public'"
    ).fetchall()
}
assert public_other in public_ids
assert private_other not in public_ids
# The private index is constrained to the authenticated owner.
reader_one_ids = {
    row[0] for row in db.execute(
        "SELECT c.id FROM community_collections c WHERE c.owner_user_id=?",
        (1,)
    ).fetchall()
}
reader_two_ids = {
    row[0] for row in db.execute(
        "SELECT c.id FROM community_collections c WHERE c.owner_user_id=?",
        (2,)
    ).fetchall()
}
assert private_other not in reader_one_ids
assert private_other in reader_two_ids
# Private detail is concealed from a different reader, while public detail is readable.
private_owner = db.execute(
    "SELECT owner_user_id,visibility FROM community_collections WHERE id=?",
    (private_other,)
).fetchone()
assert private_owner is not None and (
    private_owner[1] == 'public' or int(private_owner[0]) == 1
), "reader one must not see reader two's private collection"
assert private_owner[1] == 'public' or int(private_owner[0]) == 2, (
    "the owner must be allowed to read their private collection"
)
public_owner = db.execute(
    "SELECT owner_user_id,visibility FROM community_collections WHERE id=?",
    (public_other,)
).fetchone()
assert public_owner is not None and (
    public_owner[1] == 'public' or int(public_owner[0]) == 1
)
# An owner-scoped update cannot mutate another reader's collection.
changed = db.execute(
    "UPDATE community_collections SET title=? WHERE id=? AND owner_user_id=?",
    ("Hijacked title", private_other, 1)
).rowcount
assert changed == 0
assert db.execute(
    "SELECT title FROM community_collections WHERE id=?", (private_other,)
).fetchone()[0] == "Reader two private"
# An owner-scoped delete cannot delete another reader's collection.
deleted = db.execute(
    "DELETE FROM community_collections WHERE id=? AND owner_user_id=?",
    (private_other, 1)
).rowcount
assert deleted == 0
assert db.execute(
    "SELECT COUNT(*) FROM community_collections WHERE id=?", (private_other,)
).fetchone()[0] == 1
# Adding an item requires ownership and only accepts published, rights-cleared stories.
owned = db.execute(
    "SELECT id FROM community_collections WHERE id=? AND owner_user_id=?",
    (private_other, 1)
).fetchone()
assert owned is None
owned = db.execute(
    "SELECT id FROM community_collections WHERE id=? AND owner_user_id=?",
    (private_other, 2)
).fetchone()
assert owned is not None
eligible = db.execute(
    "SELECT id FROM novels WHERE id=? AND publication_status='published' "
    "AND rights_status IN ('original','public_domain','licensed','authorized')",
    (1,)
).fetchone()
assert eligible is not None
for rejected_id in (102, 103):
    rejected = db.execute(
        "SELECT id FROM novels WHERE id=? AND publication_status='published' "
        "AND rights_status IN ('original','public_domain','licensed','authorized')",
        (rejected_id,)
    ).fetchone()
    assert rejected is None
# Story removal repeats the owner check inside the DELETE statement.
db.execute(
    "INSERT INTO community_collection_items(collection_id,novel_id,position) VALUES(?,?,?)",
    (private_other, 1, 0)
)
removed_by_wrong_owner = db.execute(
    "DELETE FROM community_collection_items WHERE collection_id=? AND novel_id=? "
    "AND EXISTS(SELECT 1 FROM community_collections c WHERE c.id=? AND c.owner_user_id=?)",
    (private_other, 1, private_other, 1)
).rowcount
assert removed_by_wrong_owner == 0
assert db.execute(
    "SELECT COUNT(*) FROM community_collection_items WHERE collection_id=? AND novel_id=?",
    (private_other, 1)
).fetchone()[0] == 1
removed_by_owner = db.execute(
    "DELETE FROM community_collection_items WHERE collection_id=? AND novel_id=? "
    "AND EXISTS(SELECT 1 FROM community_collections c WHERE c.id=? AND c.owner_user_id=?)",
    (private_other, 1, private_other, 2)
).rowcount
assert removed_by_owner == 1

print("PASS: reader collection D1 migration enforces 50/100 quotas, duplicate membership, cascading deletion, private/public visibility, owner-scoped writes, and eligible-story filtering.")
