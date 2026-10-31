import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for path in sorted(Path("migrations").glob("*.sql")):
    db.executescript(path.read_text(encoding="utf-8"))

db.execute("INSERT INTO users(username,email,password_hash) VALUES('creator','creator@example.test','hash')")
db.execute("INSERT INTO novels(title,author,owner_user_id) VALUES('Test comic','creator',1)")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content) VALUES(1,1,'Chapter 1','')")
db.execute("""INSERT INTO media_assets(owner_user_id,object_key,mime_type,size_bytes)
              VALUES(1,'private/creator/asset-1.webp','image/webp',1024)""")
# The registry test checks asset constraints and page uniqueness. The
# publication lifecycle is tested separately. Record an attributable review
# before the fixture transitions to approved and ready.
db.execute("""INSERT INTO media_asset_reviews(media_asset_id,reviewer_user_id,decision,note)
              VALUES(1,1,'approved','Test fixture review')""")
db.execute("""UPDATE media_assets
              SET status='ready', rights_status='approved', reviewed_by_user_id=1
              WHERE id=1""")
db.execute("""INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number,alt_text)
              VALUES(1,1,1,'Opening page')""")

def must_fail(sql, params=()):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError("Expected database constraint to reject: " + sql)

must_fail("INSERT INTO media_assets(owner_user_id,object_key,mime_type,size_bytes) VALUES(1,'private/x','image/svg+xml',100)")
must_fail("INSERT INTO media_assets(owner_user_id,object_key,mime_type,size_bytes) VALUES(1,'private/too-large','image/png',20971521)")
must_fail("INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number) VALUES(1,1,1)")
must_fail("INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number) VALUES(1,1,301)")
must_fail("INSERT INTO media_assets(owner_user_id,object_key,mime_type,size_bytes) VALUES(999,'private/orphan','image/png',100)")
assert db.execute("SELECT COUNT(*) FROM media_assets").fetchone()[0] == 1
assert db.execute("SELECT COUNT(*) FROM comic_chapter_pages").fetchone()[0] == 1
print("PASS: media registry, foreign keys, safe MIME allowlist, 20 MiB cap and comic page uniqueness/order constraints.")
