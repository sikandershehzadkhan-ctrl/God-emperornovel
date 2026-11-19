from pathlib import Path
import sqlite3

migration = Path("migrations/0040_account_deletion_requests.sql").read_text(encoding="utf-8")

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY);
INSERT INTO users(id) VALUES (1),(2),(3);
-- Simulate a historical production table that predates the canonical status CHECK.
CREATE TABLE account_closure_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at INTEGER NOT NULL,
  grace_until INTEGER NOT NULL,
  cancelled_at INTEGER,
  completed_at INTEGER,
  review_reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
);
""")

legacy_rows = [
    (201, 1, "pending", 100, 200, None, None, "ordinary pending request", "old-created-a", "old-updated-a"),
    (202, 2, "cancelled", 300, 400, 350, None, "user cancelled", "old-created-b", "old-updated-b"),
    (203, 3, "legacy_processing", 500, 700, None, None, "unrecognized historical state", "old-created-c", "old-updated-c"),
]
db.executemany("""
INSERT INTO account_closure_requests
(id,user_id,status,requested_at,grace_until,cancelled_at,completed_at,review_reason,created_at,updated_at)
VALUES(?,?,?,?,?,?,?,?,?,?)
""", legacy_rows)

before_count = db.execute("SELECT COUNT(*) FROM account_closure_requests").fetchone()[0]
db.executescript(migration)

actual = db.execute("""
SELECT id,user_id,status,requested_at,grace_until,cancelled_at,completed_at,review_reason,created_at,updated_at
FROM account_closure_requests ORDER BY id
""").fetchall()

expected = [
    legacy_rows[0],
    legacy_rows[1],
    (203, 3, "review_required", 500, 700, None, None, "unrecognized historical state", "old-created-c", "old-updated-c"),
]
assert actual == expected, (actual, expected)
assert db.execute("SELECT COUNT(*) FROM account_closure_requests").fetchone()[0] == before_count

# The normalized status must remain valid, and active-request uniqueness must hold.
db.execute("INSERT INTO account_closure_requests(user_id,status,requested_at,grace_until) VALUES(1,'pending_deletion',800,900)")
try:
    db.execute("INSERT INTO account_closure_requests(user_id,status,requested_at,grace_until) VALUES(1,'review_required',1000,1100)")
    raise AssertionError("second active request for one user was accepted")
except sqlite3.IntegrityError:
    pass

# Historical metadata is retained, while invalid states cannot be reintroduced.
try:
    db.execute("UPDATE account_closure_requests SET status='legacy_processing' WHERE id=203")
    raise AssertionError("unrecognized status was accepted after migration")
except sqlite3.IntegrityError:
    pass

assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
assert db.execute("PRAGMA foreign_key_check").fetchall() == []
print("PASS: migration 0040 normalizes unknown legacy statuses to review_required while preserving every other field, row count, uniqueness and referential integrity.")
