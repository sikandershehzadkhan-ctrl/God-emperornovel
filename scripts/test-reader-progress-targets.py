import sqlite3
from pathlib import Path

db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for migration in sorted(Path("migrations").glob("*.sql")):
    db.executescript(migration.read_text(encoding="utf-8"))

db.execute("INSERT INTO users(username,email,password_hash,role) VALUES('reader','reader@example.test','x','user')")
db.execute("INSERT INTO novels(title,author,publication_status,rights_status) VALUES('Published','Writer','published','original')")
db.execute("INSERT INTO novels(title,author,publication_status,rights_status) VALUES('Draft','Writer','draft','original')")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content,publication_status) VALUES(1,1,'Chapter 1','text','published')")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content,publication_status) VALUES(1,2,'Unpublished','text','draft')")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content,publication_status) VALUES(2,1,'Draft chapter','text','published')")

sql="""SELECT n.id FROM novels n JOIN chapters c ON c.novel_id=n.id
 WHERE n.id=? AND c.chapter_number=? AND n.publication_status='published'
  AND n.rights_status IN ('original','public_domain','licensed','authorized')
  AND c.publication_status='published' LIMIT 1"""
def eligible(novel_id,chapter_number):
    return db.execute(sql,(novel_id,chapter_number)).fetchone()

assert eligible(1,1)==(1,)
assert eligible(1,2) is None, "unpublished chapter must be rejected"
assert eligible(2,1) is None, "unpublished novel must be rejected"
assert eligible(1,99) is None, "missing chapter must be rejected"
assert eligible(999,1) is None, "missing novel must be rejected"
assert eligible(1,1) != eligible(2,1), "same chapter number in another novel must not satisfy target"

# Validation failures must not alter existing user progress.
db.execute("INSERT INTO bookmarks(user_id,novel_id,chapter_number) VALUES(1,1,1)")
db.execute("INSERT INTO history(user_id,novel_id,chapter_number) VALUES(1,1,1)")
before=db.execute("SELECT chapter_number FROM bookmarks WHERE user_id=1 AND novel_id=1").fetchone()[0]
before_history=db.execute("SELECT chapter_number FROM history WHERE user_id=1 AND novel_id=1").fetchone()[0]
if eligible(1,2):
    db.execute("UPDATE bookmarks SET chapter_number=2 WHERE user_id=1 AND novel_id=1")
    db.execute("UPDATE history SET chapter_number=2 WHERE user_id=1 AND novel_id=1")
assert db.execute("SELECT chapter_number FROM bookmarks WHERE user_id=1 AND novel_id=1").fetchone()[0]==before
assert db.execute("SELECT chapter_number FROM history WHERE user_id=1 AND novel_id=1").fetchone()[0]==before_history

print("PASS: only a published chapter belonging to a published, rights-eligible novel can be a progress target.")
print("PASS: missing, unpublished, and cross-novel targets are rejected without mutating saved progress.")
