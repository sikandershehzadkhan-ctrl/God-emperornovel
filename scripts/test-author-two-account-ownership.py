import re
import sqlite3
from pathlib import Path

source = Path("src/index.js").read_text(encoding="utf-8")

def extract(pattern, label):
    match = re.search(pattern, source, re.S)
    if not match:
        raise AssertionError("Could not extract live Worker SQL: " + label)
    return match.group(1).rstrip('"')

tick = r"\x60"
novel_update = extract(
    r"prepare\(" + tick + r"(UPDATE novels SET title=.*?WHERE id=\? AND \(owner_user_id=\? OR \?=char\(97,100,109,105,110\)\))" + tick + r"\)",
    "author novel update",
)
chapter_insert = extract(
    r"prepare\(" + tick + r"(INSERT INTO chapters\(novel_id,chapter_number,title,content,is_locked,ticket_cost,publication_status\) SELECT \?,\?,\?,\?,0,0,'draft' WHERE EXISTS \(SELECT 1 FROM novels n WHERE n.id=\? AND \(n.owner_user_id=\? OR \?=char\(97,100,109,105,110\)\) AND n.rights_status IN \('original','public_domain','licensed','authorized'\)\))" + tick + r"\)",
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
# Match the documented runtime-initializer column used by the live submission SQL.
for migration in sorted(Path("migrations").glob("*.sql")):
    db.executescript(migration.read_text(encoding="utf-8"))

# Match the documented runtime-initializer column used by the live submission SQL.
db.execute("ALTER TABLE novels ADD COLUMN review_feedback TEXT DEFAULT ''")
db.execute("ALTER TABLE novels ADD COLUMN reviewed_by INTEGER")
db.execute("ALTER TABLE novels ADD COLUMN reviewed_at TEXT")

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
assert db.execute(chapter_insert, (1,2,"Injected","bad",1,2,"author")).rowcount == 0
assert db.execute("SELECT COUNT(*) FROM chapters WHERE novel_id=1").fetchone()[0] == 1
assert db.execute(chapter_insert, (1,3,"A second","valid",1,1,"author")).rowcount == 1

# Editing a novel is ownership-scoped at write time too.
novel_update_params = ("A changed title","","Author A","","ongoing","original","English","","","original","","",0,0,0,0,"Rights details changed.",0,0,1,2,"author")
assert db.execute(novel_update, novel_update_params).rowcount == 0
assert db.execute("SELECT title FROM novels WHERE id=1").fetchone()[0] == "A novel"
owner_params = novel_update_params[:-2] + (1,"author")
assert db.execute(novel_update, owner_params).rowcount == 1
assert db.execute("SELECT title FROM novels WHERE id=1").fetchone()[0] == "A changed title"

# Submission is ownership-scoped at write time.
assert db.execute(novel_submit, (1,2,"author")).rowcount == 0
assert db.execute("SELECT publication_status FROM novels WHERE id=1").fetchone()[0] == "draft"
assert db.execute(novel_submit, (1,1,"author")).rowcount == 1

assert db.execute("SELECT id FROM novels WHERE owner_user_id=?", (1,)).fetchall() == [(1,)]
assert db.execute("SELECT id FROM novels WHERE owner_user_id=?", (2,)).fetchall() == [(2,)]
assert db.execute(chapter_publish, ("draft",2,99,"admin")).rowcount == 1


# Build the AI tables from the exact runtime DDL in the Worker.
for table in ("ai_author_projects", "ai_chapter_jobs"):
    ddl_match = re.search(tick + r"(CREATE TABLE IF NOT EXISTS " + table + r" \(.*?\))" + tick, source, re.S)
    if not ddl_match:
        raise AssertionError("Could not extract runtime AI table DDL: " + table)
    db.execute(ddl_match.group(1))

ai_project_update = extract(
    r"prepare\(" + tick + r"(UPDATE ai_author_projects SET name=.*?owner_user_id=\? OR \?=char\(97,100,109,105,110\)\))" + tick + r"\)",
    "AI project edit",
)
ai_bible_update = extract(
    r"prepare\('(UPDATE ai_author_projects SET bible_json=.*?owner_user_id=\? OR \?=char\(97,100,109,105,110\)\))'\)",
    "AI Story Bible save",
)
ai_run_update = extract(
    r'prepare\("(UPDATE ai_author_projects SET status=\'running\'.*?owner_user_id=\? OR \?=char\(97,100,109,105,110\)\) AND status<>\'running\'")\)',
    "AI project run claim",
)
ai_job_insert = extract(
    r"prepare\(" + tick + r"(INSERT INTO ai_chapter_jobs.*?WHERE EXISTS \(SELECT 1 FROM ai_author_projects WHERE id=\? AND \(owner_user_id=\? OR \?=char\(97,100,109,105,110\)\)\))" + tick + r"\)",
    "AI job creation",
)
ai_jobs_read = extract(
    r"prepare\('(SELECT id,chapter_number,job_type,status,attempts,created_at,finished_at FROM ai_chapter_jobs WHERE project_id=.*?LIMIT 100)'\)",
    "AI job history read",
)

db.execute("INSERT INTO ai_author_projects(owner_user_id,name) VALUES(1,'A AI project')")
db.execute("INSERT INTO ai_author_projects(owner_user_id,name) VALUES(2,'B AI project')")
project_a = db.execute("SELECT id FROM ai_author_projects WHERE owner_user_id=1").fetchone()[0]
project_b = db.execute("SELECT id FROM ai_author_projects WHERE owner_user_id=2").fetchone()[0]

project_values = ("Hijacked name","manual","Fantasy","","premise","hero","{}",0,5,project_a,2,"author")
assert db.execute(ai_project_update, project_values).rowcount == 0
assert db.execute("SELECT name FROM ai_author_projects WHERE id=?", (project_a,)).fetchone()[0] == "A AI project"
owner_values = project_values[:-2] + (1,"author")
assert db.execute(ai_project_update, owner_values).rowcount == 1

assert db.execute(ai_bible_update, ('{"stolen":true}',project_a,2,"author")).rowcount == 0
assert db.execute("SELECT bible_json FROM ai_author_projects WHERE id=?", (project_a,)).fetchone()[0] == "{}"
assert db.execute(ai_bible_update, ('{"owner":true}',project_a,1,"author")).rowcount == 1

assert db.execute(ai_run_update, (project_a,2,"author")).rowcount == 0
assert db.execute("SELECT status FROM ai_author_projects WHERE id=?", (project_a,)).fetchone()[0] == "draft"
assert db.execute(ai_run_update, (project_a,1,"author")).rowcount == 1
assert db.execute(ai_run_update, (project_a,1,"author")).rowcount == 0, "concurrent AI run claim must fail after the first claim"

# A user cannot queue a job under another author's AI project.
assert db.execute(ai_job_insert, (project_a,2,1,"forged prompt",project_a,2,"author")).rowcount == 0
assert db.execute(ai_job_insert, (project_a,1,1,"owner prompt",project_a,1,"author")).rowcount == 1
assert db.execute(ai_job_insert, (project_b,2,1,"other owner prompt",project_b,2,"author")).rowcount == 1
assert db.execute(ai_jobs_read, (project_a,2,"author")).fetchall() == []
assert len(db.execute(ai_jobs_read, (project_a,1,"author")).fetchall()) == 1
assert len(db.execute(ai_jobs_read, (project_a,2,"admin")).fetchall()) == 1

print("PASS: two-account SQLite/D1-SQL integration checks for author and AI project/job ownership isolation, chapter create/edit/publish, novel edit/submission, and admin exception.")
