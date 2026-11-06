import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for path in sorted(Path("migrations").glob("*.sql")):
    db.executescript(path.read_text(encoding="utf-8"))

db.executemany(
    "INSERT INTO users(username,email,password_hash) VALUES(?,?,?)",
    [("creator","creator@example.test","hash"),("other","other@example.test","hash")]
)
db.execute("INSERT INTO novels(title,author,owner_user_id) VALUES('Creator comic','creator',1)")
db.execute("INSERT INTO novels(title,author,owner_user_id) VALUES('Other comic','other',2)")
db.execute("INSERT INTO novels(title,author) VALUES('Unclaimed comic','legacy')")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content,publication_status) VALUES(1,1,'Creator chapter','','draft')")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content,publication_status) VALUES(2,1,'Other chapter','','draft')")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content,publication_status) VALUES(3,1,'Unclaimed chapter','','draft')")
db.executemany(
    """INSERT INTO media_assets(owner_user_id,object_key,mime_type,size_bytes,status,rights_status)
       VALUES(?,?, 'image/webp',1024,'ready','approved')""",
    [(1,"private/users/1/assets/a"),(2,"private/users/2/assets/b")]
)

def must_fail(sql, params=()):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError("Expected ownership guard to reject: " + sql)

# Same-owner media is attachable.
db.execute("INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number) VALUES(1,1,1)")
# Cross-account asset attachment and reassignment are rejected.
must_fail("INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number) VALUES(1,2,2)")
must_fail("INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number) VALUES(2,1,1)")
must_fail("INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number) VALUES(3,1,1)")
must_fail("UPDATE comic_chapter_pages SET chapter_id=2 WHERE chapter_id=1 AND media_asset_id=1")
must_fail("UPDATE comic_chapter_pages SET media_asset_id=2 WHERE chapter_id=1 AND media_asset_id=1")

assert db.execute("SELECT COUNT(*) FROM comic_chapter_pages").fetchone()[0] == 1
print("PASS: comic page media must belong to the novel owner on insert and reassignment.")
