import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for path in sorted(Path("migrations").glob("*.sql")):
    db.executescript(path.read_text(encoding="utf-8"))

db.execute("INSERT INTO users(username,email,password_hash) VALUES('creator','creator@example.test','hash')")
db.execute("INSERT INTO novels(title,author,owner_user_id) VALUES('Test comic','creator',1)")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content,publication_status) VALUES(1,1,'Chapter 1','','draft')")
db.execute("""INSERT INTO media_assets(owner_user_id,object_key,mime_type,size_bytes)
              VALUES(1,'private/users/1/assets/1/token','image/webp',1024)""")

def must_fail(sql, params=()):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError("Expected database guard to reject: " + sql)

# Pending uploads and unreviewed rights must never enter published chapter pages.
must_fail("""INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number)
             VALUES(1,1,1)""")

# Approval without an attributable administrator review must fail.
must_fail("UPDATE media_assets SET status='ready', rights_status='approved' WHERE id=1")
db.execute("""INSERT INTO media_asset_reviews(media_asset_id,reviewer_user_id,decision,note)
              VALUES(1,1,'approved','Rights evidence checked')""")
db.execute("""UPDATE media_assets
              SET status='ready', rights_status='approved', reviewed_by_user_id=1
              WHERE id=1""")
# Review history is append-only.
must_fail("UPDATE media_asset_reviews SET note='changed' WHERE media_asset_id=1")
must_fail("DELETE FROM media_asset_reviews WHERE media_asset_id=1")
db.execute("""INSERT INTO comic_chapter_pages(chapter_id,media_asset_id,page_number)
              VALUES(1,1,1)""")

# Reader delivery is eligible only through a published novel and chapter.
db.execute("UPDATE novels SET publication_status='published' WHERE id=1")
db.execute("UPDATE chapters SET publication_status='published' WHERE id=1")
delivery = db.execute("""SELECT a.id FROM media_assets a
    JOIN comic_chapter_pages cp ON cp.media_asset_id=a.id
    JOIN chapters c ON c.id=cp.chapter_id
    JOIN novels n ON n.id=c.novel_id
    WHERE a.id=1 AND a.status='ready' AND a.rights_status='approved'
      AND c.publication_status='published' AND n.publication_status='published'""").fetchone()
assert delivery == (1,)
db.execute("UPDATE novels SET publication_status='draft' WHERE id=1")
assert db.execute("""SELECT COUNT(*) FROM media_assets a
    JOIN comic_chapter_pages cp ON cp.media_asset_id=a.id
    JOIN chapters c ON c.id=cp.chapter_id
    JOIN novels n ON n.id=c.novel_id
    WHERE a.id=1 AND a.status='ready' AND a.rights_status='approved'
      AND c.publication_status='published' AND n.publication_status='published'""").fetchone()[0] == 0
db.execute("UPDATE novels SET publication_status='published' WHERE id=1")

# Rights withdrawal, rejection, deletion or reprocessing cannot silently break a live page.
must_fail("UPDATE media_assets SET rights_status='withdrawn' WHERE id=1")
must_fail("UPDATE media_assets SET status='deleted' WHERE id=1")
must_fail("UPDATE media_assets SET status='processing' WHERE id=1")

# Once a page references it, only an authorized unlink workflow can permit a state change.
db.execute("UPDATE chapters SET publication_status='draft' WHERE id=1")
db.execute("DELETE FROM comic_chapter_pages WHERE chapter_id=1 AND media_asset_id=1")
db.execute("UPDATE media_assets SET rights_status='withdrawn' WHERE id=1")
assert db.execute("SELECT rights_status FROM media_assets WHERE id=1").fetchone()[0] == "withdrawn"
print("PASS: publication requires ready + approved media; referenced assets cannot silently lose readiness or rights.")
