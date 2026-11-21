import re
import sqlite3
from pathlib import Path

source = Path("src/index.js").read_text(encoding="utf-8")

def extract(pattern, label):
    match = re.search(pattern, source, re.S)
    if not match:
        raise AssertionError("Could not extract live Worker SQL: " + label)
    return match.group(1)

tick = r"\x60"
chapter_insert = extract(
    r"prepare\(" + tick + r"(INSERT INTO chapters\(novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status\) SELECT \?,\?,\?,\?,\?,\?, 'draft' WHERE EXISTS \(SELECT 1 FROM novels WHERE id=\? AND \(owner_user_id=\? OR \?=char\(97,100,109,105,110\)\)\))" + tick + r"\)",
    "author chapter insert",
)
chapter_update = extract(
    r"prepare\(" + tick + r"(UPDATE chapters SET chapter_number=.*?WHERE id=\? AND EXISTS \(SELECT 1 FROM novels n WHERE n.id=chapters.novel_id AND \(n.owner_user_id=\? OR \?=char\(97,100,109,105,110\)\)\))" + tick + r"\)",
    "author chapter update",
)
chapter_publish = extract(
    r"prepare\('(UPDATE chapters SET publication_status=.*?WHERE id=\? AND EXISTS \(SELECT 1 FROM novels n WHERE n.id=chapters.novel_id AND \(n.owner_user_id=\? OR \?=char\(97,100,109,105,110\)\)\))'\)",
    "author chapter publication",
)
novel_submit = extract(
    r'prepare\("(UPDATE novels SET publication_status=\'review\'.*?WHERE id=\? AND \(owner_user_id=\? OR \?=char\(97,100,109,105,110\)\))"\)',
    "author novel submission",
)

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for migration in sorted(Path("migrations").glob("*.sql")):
    db.executescript(migration.read_text(encoding="utf-8"))

db.executemany(
    "INSERT INTO users(username,email,password_hash) VALUES(?,?,?)",
    [("author_a","a@example.test","hash"),("author_b","b@example.test","hash")],
)
db.execute("INSERT INTO novels(title,author,owner_user_id,rights_status,publication_status) VALUES('A novel','Author A',1,'original','draft')")
db.execute("INSERT INTO novels(title,author,owner_user_id,rights_status,publication_status) VALUES('B novel','Author B',2,'original','draft')")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content,publication_status) VALUES(1,1,'A chapter','A content','draft')")
db.execute("INSERT INTO chapters(novel_id,chapter_number,title,content,publication_status) VALUES(2,1,'B chapter','B content','draft')")

# Author B cannot edit or publish Author A's chapter. Author A can.
assert db.execute(chapter_update, (2,"Hijack","tampered",0,0,1,2,"author")).rowcount == 0
assert db.execute("SELECT title,content FROM chapters WHERE id=1").fetchone() == ("A chapter","A content")
assert db.execute(chapter_update, (2,"A revised","A revised content",0,0,1,1,"author")).rowcount == 1
assert db.execute(chapter_publish, ("published",1,2,"author")).rowcount == 0
assert db.execute("SELECT publication_status FROM chapters WHERE id=1").fetchone()[0] == "draft"
assert db.execute(chapter_publish, ("published",1,1,"author")).rowcount == 1

# Chapter creation is scoped in the INSERT itself, not just a preceding read.
assert db.execute(chapter_insert, (1,2,"Injected","bad",0,0,1,2,"author")).rowcount == 0
assert db.execute("SELECT COUNT(*) FROM chapters WHERE novel_id=1").fetchone()[0] == 1
assert db.execute(chapter_insert, (1,3,"A second","valid",0,0,1,1,"author")).rowcount == 1

# Submission is ownership-scoped at write time.
assert db.execute(novel_submit, (1,2,"author")).rowcount == 0
assert db.execute("SELECT publication_status FROM novels WHERE id=1").fetchone()[0] == "draft"
assert db.execute(novel_submit, (1,1,"author")).rowcount == 1

assert db.execute("SELECT id FROM novels WHERE owner_user_id=?", (1,)).fetchall() == [(1,)]
assert db.execute("SELECT id FROM novels WHERE owner_user_id=?", (2,)).fetchall() == [(2,)]
assert db.execute(chapter_publish, ("draft",2,99,"admin")).rowcount == 1

print("PASS: two-account SQLite/D1-SQL integration checks for author chapter create/edit/publish, novel submission, ownership isolation, and admin exception.")
