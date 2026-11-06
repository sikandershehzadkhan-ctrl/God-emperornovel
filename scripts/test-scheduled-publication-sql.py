import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
migration = (ROOT / "migrations" / "0017_scheduled_chapter_publications.sql").read_text()
module = (ROOT / "src" / "features" / "publishing-studio" / "index.mjs").read_text()

assert "n.id AS novel_id" in module, "due query must project the parent novel id"
assert "DELETE FROM scheduled_chapter_publications WHERE chapter_id=? AND changes()=1" in module
assert "UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND changes()=1" in module
assert "INSERT INTO audit_logs(user_id,action,details) SELECT ?,?,? WHERE changes()=1" in module

def database():
    db = sqlite3.connect(":memory:", isolation_level=None)
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript("""
      CREATE TABLE users(id INTEGER PRIMARY KEY);
      CREATE TABLE novels(
        id INTEGER PRIMARY KEY,
        owner_user_id INTEGER NOT NULL,
        publication_status TEXT NOT NULL,
        rights_status TEXT NOT NULL,
        rights_evidence TEXT,
        updated_at TEXT
      );
      CREATE TABLE chapters(
        id INTEGER PRIMARY KEY,
        novel_id INTEGER NOT NULL,
        chapter_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        publication_status TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY(novel_id) REFERENCES novels(id) ON DELETE CASCADE
      );
      CREATE TABLE audit_logs(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT NOT NULL
      );
    """)
    db.executescript(migration)
    return db

due_sql = """
SELECT s.chapter_id,s.created_by,c.chapter_number,c.title chapter_title,
       n.id AS novel_id,n.title AS novel_title,n.owner_user_id,
       n.publication_status AS novel_publication_status,n.rights_status,n.rights_evidence
FROM scheduled_chapter_publications s
JOIN chapters c ON c.id=s.chapter_id
JOIN novels n ON n.id=c.novel_id
WHERE s.publish_at<=strftime('%Y-%m-%dT%H:%M:%fZ','now')
  AND c.publication_status='draft'
  AND n.publication_status='published'
  AND n.owner_user_id=s.created_by
  AND n.rights_status IN ('original','public_domain','licensed','authorized')
  AND (n.rights_status='original' OR TRIM(COALESCE(n.rights_evidence,''))<>'')
ORDER BY s.publish_at LIMIT 100
"""

def seed(db):
    db.execute("INSERT INTO users(id) VALUES(1)")
    db.execute("INSERT INTO novels(id,owner_user_id,publication_status,rights_status,rights_evidence,updated_at) VALUES(10,1,'published','original','', '2000-01-01')")
    db.execute("INSERT INTO chapters(id,novel_id,chapter_number,title,publication_status,updated_at) VALUES(100,10,4,'A New Dawn','draft','2000-01-01')")
    db.execute("INSERT INTO scheduled_chapter_publications(chapter_id,publish_at,created_by) VALUES(100,'2000-01-01T00:00:00Z',1)")

def execute_publication_batch(db, row):
    db.execute("BEGIN IMMEDIATE")
    try:
        db.execute("""
          UPDATE chapters SET publication_status='published',updated_at=CURRENT_TIMESTAMP
          WHERE id=? AND publication_status='draft'
            AND EXISTS(
              SELECT 1 FROM novels n
              WHERE n.id=chapters.novel_id
                AND n.owner_user_id=?
                AND n.publication_status='published'
                AND n.rights_status IN ('original','public_domain','licensed','authorized')
                AND (n.rights_status='original' OR TRIM(COALESCE(n.rights_evidence,''))<>'')
            )
        """, (row["chapter_id"], row["created_by"]))
        chapter_changes = db.execute("SELECT changes()").fetchone()[0]
        db.execute("DELETE FROM scheduled_chapter_publications WHERE chapter_id=? AND changes()=1", (row["chapter_id"],))
        db.execute("UPDATE novels SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND changes()=1", (row["novel_id"],))
        db.execute("INSERT INTO audit_logs(user_id,action,details) SELECT ?,?,? WHERE changes()=1",
                   (row["created_by"], "author_chapter_scheduled_published", f"chapter={row['chapter_id']}"))
        db.execute("COMMIT")
        return chapter_changes
    except Exception:
        db.execute("ROLLBACK")
        raise

# Successful publication and stale-snapshot concurrent invocation.
db = database()
seed(db)
row = dict(zip([x[0] for x in db.execute(due_sql).description], db.execute(due_sql).fetchone()))
assert row["novel_id"] == 10
assert execute_publication_batch(db, row) == 1
assert db.execute("SELECT publication_status FROM chapters WHERE id=100").fetchone()[0] == "published"
assert db.execute("SELECT COUNT(*) FROM scheduled_chapter_publications WHERE chapter_id=100").fetchone()[0] == 0
assert db.execute("SELECT COUNT(*) FROM audit_logs WHERE action='author_chapter_scheduled_published'").fetchone()[0] == 1
assert execute_publication_batch(db, row) == 0, "a second invocation with a stale due-row snapshot must lose the conditional update"
assert db.execute("SELECT COUNT(*) FROM audit_logs WHERE action='author_chapter_scheduled_published'").fetchone()[0] == 1, "a lost race must not duplicate the audit record"
db.close()

# Rights and owner changes after selection must prevent publication and audit.
for change_sql in [
    "UPDATE novels SET rights_status='pending' WHERE id=10",
    "UPDATE novels SET owner_user_id=2 WHERE id=10"
]:
    db = database()
    seed(db)
    names = [x[0] for x in db.execute(due_sql).description]
    row = dict(zip(names, db.execute(due_sql).fetchone()))
    db.execute(change_sql)
    assert execute_publication_batch(db, row) == 0, "changed rights or ownership must invalidate the stale due row"
    assert db.execute("SELECT publication_status FROM chapters WHERE id=100").fetchone()[0] == "draft"
    assert db.execute("SELECT COUNT(*) FROM audit_logs").fetchone()[0] == 0
    db.close()

print("Scheduled publication SQLite transaction checks passed.")
