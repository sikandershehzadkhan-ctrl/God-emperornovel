import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','author','moderator','admin')),
  banned INTEGER NOT NULL DEFAULT 0
);
INSERT INTO users(id,username,role,banned) VALUES(1,'reader-one','user',0),(2,'reader-two','user',0);
""")
migration = Path(__file__).resolve().parents[1] / "migrations" / "0011_author_applications.sql"
sql = migration.read_text(encoding="utf-8")
db.executescript(sql)
db.executescript(sql)  # IF NOT EXISTS migration objects must be safe to re-apply in a test fixture.

def insert_pending(user_id, name):
    return db.execute(
        """INSERT INTO author_applications
           (user_id,display_name,bio,sample_work,preferred_formats,rights_confirmed,status)
           VALUES(?,?,?,?,?,1,'pending')""",
        (user_id, name, "A sufficiently detailed creator biography.", "A" * 300, '["original"]'),
    ).lastrowid

first = insert_pending(1, "Writer One")
try:
    insert_pending(1, "Duplicate Pending")
    raise AssertionError("A user must not have two pending author applications.")
except sqlite3.IntegrityError:
    pass

db.execute("UPDATE author_applications SET status='rejected',review_notes='Please provide a clearer sample.' WHERE id=?", (first,))
second = insert_pending(1, "Writer One Updated")
assert second != first
assert db.execute("SELECT COUNT(*) FROM author_applications WHERE user_id=1 AND status='pending'").fetchone()[0] == 1

third = insert_pending(2, "Writer Two")
db.execute("UPDATE author_applications SET status='approved',reviewed_by=2,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'", (third,))
db.execute("UPDATE users SET role='author' WHERE id=2 AND role='user' AND banned=0 AND EXISTS(SELECT 1 FROM author_applications WHERE id=? AND status='approved' AND reviewed_by=2)", (third,))
assert db.execute("SELECT role FROM users WHERE id=2").fetchone()[0] == "author"

try:
    db.execute("UPDATE author_applications SET status='invalid' WHERE id=?", (second,))
    raise AssertionError("Invalid application states must be rejected by the schema.")
except sqlite3.IntegrityError:
    pass

print("Author application schema tests passed.")
