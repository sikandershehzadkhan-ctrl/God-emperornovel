import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for path in sorted(Path("migrations").glob("*.sql")):
    db.executescript(path.read_text(encoding="utf-8"))

for username in ("owner", "intruder"):
    db.execute("INSERT INTO users(username,email,password_hash) VALUES(?,?,?)",
               (username, f"{username}@example.test", "hash"))
db.execute("INSERT INTO novels(title,author,kind,owner_user_id) VALUES('Comic','owner','webtoon',1)")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content,publication_status) VALUES(1,1,'Episode 1','','draft')")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content,publication_status) VALUES(1,2,'Episode 2','','draft')")

def asset(owner, key):
    cur = db.execute("""INSERT INTO media_assets(owner_user_id,object_key,mime_type,size_bytes)
                        VALUES(?,?, 'image/webp', 1024)""", (owner, key))
    asset_id = cur.lastrowid
    db.execute("""INSERT INTO media_asset_reviews(media_asset_id,reviewer_user_id,decision,note)
                  VALUES(?,?, 'approved','License evidence checked')""", (asset_id, owner))
    db.execute("""UPDATE media_assets SET status='ready',rights_status='approved',
                  reviewed_by_user_id=? WHERE id=?""", (owner, asset_id))
    return asset_id

a1 = asset(1, "private/owner/page-1")
a2 = asset(1, "private/owner/page-2")
foreign = asset(2, "private/intruder/page")
db.execute("""INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number,alt_text,caption)
              VALUES(1,?,1,'First page','Opening')""", (a1,))

def must_fail(sql, params=(), message="Expected database guard to reject operation"):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError(message)

# The novel owner can attach only their own ready + approved media.
must_fail("""INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number)
             VALUES(1,?,2)""", (foreign,), "Cross-owner comic media attachment must fail")
must_fail("""INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number)
             VALUES(1,?,2)""", (a1,), "The same asset cannot be attached twice to one chapter")
db.execute("""INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number)
              VALUES(1,?,2)""", (a2,))

# Publishing locks the page composition, including direct database writes.
db.execute("UPDATE chapters SET publication_status='published' WHERE id=1")
must_fail("""INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number)
             VALUES(1,?,3)""", (a1,))
must_fail("DELETE FROM comic_chapter_pages WHERE chapter_id=1 AND page_number=1")
must_fail("UPDATE comic_chapter_pages SET page_number=3 WHERE chapter_id=1 AND page_number=1")

# Authors must unpublish before editing or removing page references.
db.execute("UPDATE chapters SET publication_status='draft' WHERE id=1")
db.execute("DELETE FROM comic_chapter_pages WHERE chapter_id=1 AND page_number=1")
assert db.execute("SELECT COUNT(*) FROM comic_chapter_pages WHERE chapter_id=1").fetchone()[0] == 1

# Page ordering is unique and bounded by the schema.
must_fail("""INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number)
             VALUES(1,?,2)""", (a1,))
print("PASS: comic page owner isolation, uniqueness, draft-only edits, and published-page immutability.")
