import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript((root / "migrations/0001_initial.sql").read_text(encoding="utf-8"))
db.execute("""CREATE TABLE ticket_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  delta REAL NOT NULL,
  reason TEXT NOT NULL,
  reference TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
)""")
db.executescript((root / "migrations/0027_novel_request_refunds.sql").read_text(encoding="utf-8"))

def user(name, email, role="user"):
    cur = db.execute(
        "INSERT INTO users(username,email,password_hash,role) VALUES(?,?,?,?)",
        (name, email, "test-hash", role)
    )
    return cur.lastrowid

donor = user("refund-donor", "refund-donor@example.test")
admin = user("refund-admin", "refund-admin@example.test", "admin")
self_admin = user("self-admin", "self-admin@example.test", "admin")
db.commit()

# The refund record cannot be inserted while the request is still pending.
cur = db.execute(
    "INSERT INTO novel_requests(user_id,url,source_host,week_key,cost,status) VALUES(?,?,?,?,?,'pending')",
    (donor, "https://example.test/story", "example.test", 20261120, 25)
)
pending_id = cur.lastrowid
db.commit()
try:
    db.execute(
        "INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note) VALUES(?,?,?,?,?)",
        (pending_id, admin, donor, 25, "Verified request cancellation")
    )
    raise AssertionError("refund against pending request unexpectedly succeeded")
except sqlite3.IntegrityError as exc:
    assert "matching rejected paid request" in str(exc)
    db.rollback()

# A rejected paid request receives exactly one database-owned balance credit and ledger entry.
db.execute("UPDATE novel_requests SET status='rejected' WHERE id=? AND status='pending'", (pending_id,))
db.execute(
    "INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note) VALUES(?,?,?,?,?)",
    (pending_id, admin, donor, 25, "Verified request cancellation")
)
db.commit()
assert db.execute("SELECT tickets FROM users WHERE id=?", (donor,)).fetchone()[0] == 25
assert db.execute(
    "SELECT COUNT(*) FROM ticket_ledger WHERE user_id=? AND reason='novel_request_refund' AND reference=?",
    (donor, "novel_request:" + str(pending_id))
).fetchone()[0] == 1

# Unique request identity prevents a second refund and therefore a second credit.
try:
    db.execute(
        "INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note) VALUES(?,?,?,?,?)",
        (pending_id, admin, donor, 25, "Retry")
    )
    raise AssertionError("duplicate refund unexpectedly succeeded")
except sqlite3.IntegrityError:
    db.rollback()
assert db.execute("SELECT tickets FROM users WHERE id=?", (donor,)).fetchone()[0] == 25

# Refund amount must exactly match the paid request cost.
cur = db.execute(
    "INSERT INTO novel_requests(user_id,url,source_host,week_key,cost,status) VALUES(?,?,?,?,?,'rejected')",
    (donor, "https://example.test/other", "example.test", 20261120, 10)
)
wrong_amount_id = cur.lastrowid
db.commit()
try:
    db.execute(
        "INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note) VALUES(?,?,?,?,?)",
        (wrong_amount_id, admin, donor, 11, "Incorrect amount")
    )
    raise AssertionError("mismatched refund amount unexpectedly succeeded")
except sqlite3.IntegrityError as exc:
    assert "matching rejected paid request" in str(exc)
    db.rollback()

# The database rejects a refund initiated by an administrator for their own account.
cur = db.execute(
    "INSERT INTO novel_requests(user_id,url,source_host,week_key,cost,status) VALUES(?,?,?,?,?,'rejected')",
    (self_admin, "https://example.test/self", "example.test", 20261120, 5)
)
self_id = cur.lastrowid
db.commit()
try:
    db.execute(
        "INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note) VALUES(?,?,?,?,?)",
        (self_id, self_admin, self_admin, 5, "Self refund")
    )
    raise AssertionError("self refund unexpectedly succeeded")
except sqlite3.IntegrityError as exc:
    assert "matching rejected paid request" in str(exc)
    db.rollback()

# Refund history is immutable.
try:
    db.execute("UPDATE novel_request_refunds SET note='changed' WHERE request_id=?", (pending_id,))
    raise AssertionError("refund update unexpectedly succeeded")
except sqlite3.IntegrityError as exc:
    assert "immutable" in str(exc)
    db.rollback()

print("PASS: migration 0027 requires a rejected paid request and independent admin; refund posting is exactly once, amount-matched, and immutable.")
