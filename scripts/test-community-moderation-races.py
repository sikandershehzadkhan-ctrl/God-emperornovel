import re
import sqlite3
from pathlib import Path

worker = Path("src/index.js").read_text(encoding="utf-8")
patterns = {
    "comment": r'prepare\("(UPDATE comments SET status=\?[^"]+)"\)',
    "community_report": r'prepare\("(UPDATE comment_reports SET status=\?[^"]+)"\)',
    "report": r"prepare\('(UPDATE reports SET status=\?[^']+)'\)",
}
sql = {}
for name, pattern in patterns.items():
    match = re.search(pattern, worker)
    assert match, f"Could not extract {name} moderation update SQL"
    sql[name] = match.group(1)
    assert "AND status=?" in sql[name], f"{name} update is not compare-and-set"

db = sqlite3.connect(":memory:")
db.executescript("""
  CREATE TABLE comments(id INTEGER PRIMARY KEY,status TEXT NOT NULL);
  CREATE TABLE comment_reports(id INTEGER PRIMARY KEY,status TEXT NOT NULL);
  CREATE TABLE reports(id INTEGER PRIMARY KEY,status TEXT NOT NULL);
  INSERT INTO comments VALUES(1,'visible');
  INSERT INTO comment_reports VALUES(2,'open');
  INSERT INTO reports VALUES(3,'open');
""")

# A second administrator holding the old status cannot overwrite the first decision.
assert db.execute(sql["comment"], ("hidden", 1, "visible")).rowcount == 1
assert db.execute(sql["comment"], ("deleted", 1, "visible")).rowcount == 0
assert db.execute("SELECT status FROM comments WHERE id=1").fetchone()[0] == "hidden"

assert db.execute(sql["community_report"], ("resolved", 2, "open")).rowcount == 1
assert db.execute(sql["community_report"], ("dismissed", 2, "open")).rowcount == 0
assert db.execute("SELECT status FROM comment_reports WHERE id=2").fetchone()[0] == "resolved"

assert db.execute(sql["report"], ("resolved", 3, "open")).rowcount == 1
assert db.execute(sql["report"], ("dismissed", 3, "open")).rowcount == 0
assert db.execute("SELECT status FROM reports WHERE id=3").fetchone()[0] == "resolved"

print("PASS: comment, community-report, and generic-report moderation SQL rejects stale concurrent administrator decisions.")
