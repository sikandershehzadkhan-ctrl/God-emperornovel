import sqlite3
from pathlib import Path

migration = Path("migrations/0050_imperial_user_xp_ledger.sql").read_text(encoding="utf-8")
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("""
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','author','moderator','admin')),
  tickets REAL NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  banned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
""")
db.executescript(migration)

columns = {row[1]: row for row in db.execute("PRAGMA table_info(users)")}
assert "imperial_rank_visibility" in columns
assert columns["imperial_rank_visibility"][4] == "0", "rank visibility must default to private/off"

db.execute(
    "INSERT INTO users(username,email,password_hash) VALUES(?,?,?)",
    ("reader_one", "reader@example.test", "test-hash"),
)
user_id = db.execute("SELECT id FROM users WHERE username='reader_one'").fetchone()[0]
assert db.execute(
    "SELECT imperial_rank_visibility FROM users WHERE id=?", (user_id,)
).fetchone()[0] == 0

db.execute(
    """INSERT INTO imperial_xp_ledger(user_id,xp_delta,event_type,source_event_key)
       VALUES(?,?,?,?)""",
    (user_id, 100, "chapter_reading_milestone", "chapter-completion:reader-1:chapter-9"),
)
assert db.execute(
    "SELECT SUM(xp_delta) FROM imperial_xp_ledger WHERE user_id=?", (user_id,)
).fetchone()[0] == 100

def must_reject(sql, params, label):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError("Expected database to reject " + label)

must_reject(
    "INSERT INTO imperial_xp_ledger(user_id,xp_delta,event_type,source_event_key) VALUES(?,?,?,?)",
    (user_id, 50, "chapter_reading_milestone", "chapter-completion:reader-1:chapter-9"),
    "a duplicate idempotency key",
)
must_reject(
    "INSERT INTO imperial_xp_ledger(user_id,xp_delta,event_type,source_event_key) VALUES(?,?,?,?)",
    (user_id, 0, "chapter_reading_milestone", "zero-xp"),
    "zero XP",
)
must_reject(
    "INSERT INTO imperial_xp_ledger(user_id,xp_delta,event_type,source_event_key) VALUES(?,?,?,?)",
    (user_id, 10, "untrusted_client_award", "bad-event-type"),
    "an unsupported event type",
)
must_reject(
    "INSERT INTO imperial_xp_ledger(user_id,xp_delta,event_type,source_event_key) VALUES(?,?,?,?)",
    (9999, 10, "review_published", "unknown-user"),
    "an XP row for a nonexistent user",
)
must_reject(
    "UPDATE users SET imperial_rank_visibility=2 WHERE id=?",
    (user_id,),
    "an invalid public-rank visibility value",
)

db.execute("UPDATE users SET imperial_rank_visibility=1 WHERE id=?", (user_id,))
assert db.execute(
    "SELECT imperial_rank_visibility FROM users WHERE id=?", (user_id,)
).fetchone()[0] == 1

db.execute("DELETE FROM users WHERE id=?", (user_id,))
assert db.execute("SELECT COUNT(*) FROM imperial_xp_ledger").fetchone()[0] == 0

indexes = {row[1] for row in db.execute("PRAGMA index_list(imperial_xp_ledger)")}
assert "idx_imperial_xp_user_time" in indexes
assert "idx_imperial_xp_time_user" in indexes
print("Imperial XP ledger migration tests passed: constraints, idempotency, visibility, indexes, and account cascade.")
