import re
import sqlite3
from pathlib import Path

worker = Path("src/index.js").read_text(encoding="utf-8")
reject_match = re.search(r'prepare\("(UPDATE taxonomy_submissions SET status=\'rejected\'[^"]+)"\)', worker)
approve_match = re.search(r'prepare\("(UPDATE taxonomy_submissions SET status=\'approved\'[^"]+)"\)', worker)
insert_match = re.search(r'prepare\(`(INSERT OR IGNORE INTO \$\{table\}\(name,slug\) SELECT[^\`]+)`\)', worker)
assert reject_match and approve_match and insert_match, "Could not extract exact taxonomy moderation SQL from Worker"
reject_sql, approve_sql = reject_match.group(1), approve_match.group(1)
insert_sql = insert_match.group(1).replace("${table}", "genres")

def fixture():
    db = sqlite3.connect(":memory:")
    db.executescript("""
      CREATE TABLE taxonomy_submissions(
        id INTEGER PRIMARY KEY, type TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', reviewed_at TEXT, reviewer_id INTEGER,
        UNIQUE(type,slug)
      );
      CREATE TABLE genres(id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE);
      INSERT INTO taxonomy_submissions(id,type,name,slug) VALUES
        (1,'genre','Imperial Fantasy','imperial-fantasy'),
        (2,'genre','Celestial Cultivation','celestial-cultivation');
    """)
    return db

# Two reviewers race to reject the same proposal. Only the first pending-state claim wins.
db = fixture()
first = db.execute(reject_sql, (101, 1))
assert first.rowcount == 1
second = db.execute(reject_sql, (202, 1))
assert second.rowcount == 0
row = db.execute("SELECT status,reviewer_id FROM taxonomy_submissions WHERE id=1").fetchone()
assert row == ("rejected", 101)

# Two reviewers race to approve. The loser cannot change the reviewer or insert after losing the claim.
db = fixture()
first = db.execute(approve_sql, (101, 2))
assert first.rowcount == 1
inserted = db.execute(insert_sql, (2,))
assert inserted.rowcount == 1
second = db.execute(approve_sql, (202, 2))
assert second.rowcount == 0
db.execute(insert_sql, (2,))
row = db.execute("SELECT status,reviewer_id FROM taxonomy_submissions WHERE id=2").fetchone()
assert row == ("approved", 101)
assert db.execute("SELECT COUNT(*) FROM genres WHERE slug='celestial-cultivation'").fetchone()[0] == 1

print("PASS: taxonomy approve/reject moderation uses atomic pending-state claims; concurrent reviewers cannot overwrite decisions or publish rejected terms.")
