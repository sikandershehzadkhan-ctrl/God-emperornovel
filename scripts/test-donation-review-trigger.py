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
db.executescript((root / "migrations/0024_donation_review_audit.sql").read_text(encoding="utf-8"))
db.executescript((root / "migrations/0026_donation_independent_review.sql").read_text(encoding="utf-8"))

def user(name, email):
    cur = db.execute(
        "INSERT INTO users(username,email,password_hash,role) VALUES(?,?,?,'user')",
        (name, email, "test-hash")
    )
    return cur.lastrowid

donor = user("donor", "donor@example.test")
admin = user("reviewer", "reviewer@example.test")
self_reviewer = user("selfreview", "selfreview@example.test")
db.commit()

# A pending donation cannot be finalized without an attributable review.
cur = db.execute(
    "INSERT INTO donations(user_id,amount,reference_id) VALUES(?,?,?)",
    (donor, 25, "missing-review")
)
missing_review_donation = cur.lastrowid
db.commit()
try:
    db.execute("UPDATE donations SET status='approved' WHERE id=?", (missing_review_donation,))
    raise AssertionError("approval without a review unexpectedly succeeded")
except sqlite3.IntegrityError as exc:
    assert "attributable review" in str(exc)
    db.rollback()

# A reviewed approval credits the user and writes exactly one ledger row via the DB trigger.
cur = db.execute(
    "INSERT INTO donations(user_id,amount,reference_id) VALUES(?,?,?)",
    (donor, 25, "approved-reference")
)
approved_id = cur.lastrowid
db.commit()
db.execute(
    "INSERT INTO donation_reviews(donation_id,reviewer_user_id,decision,tickets,note) VALUES(?,?,?,?,?)",
    (approved_id, admin, "approved", 25, "Payment reference independently verified")
)
db.execute("UPDATE donations SET status='approved' WHERE id=? AND status='pending'", (approved_id,))
assert db.execute("SELECT tickets FROM users WHERE id=?", (donor,)).fetchone()[0] == 25
assert db.execute(
    "SELECT COUNT(*) FROM ticket_ledger WHERE user_id=? AND reason='payment' AND reference=?",
    (donor, str(approved_id))
).fetchone()[0] == 1
db.commit()

# Repeated finalization cannot post a second credit or ledger row.
db.execute("UPDATE donations SET status='approved' WHERE id=?", (approved_id,))
assert db.execute("SELECT tickets FROM users WHERE id=?", (donor,)).fetchone()[0] == 25
assert db.execute(
    "SELECT COUNT(*) FROM ticket_ledger WHERE user_id=? AND reason='payment' AND reference=?",
    (donor, str(approved_id))
).fetchone()[0] == 1
db.commit()

# A rejection is recorded but never credits the donor.
cur = db.execute(
    "INSERT INTO donations(user_id,amount,reference_id) VALUES(?,?,?)",
    (donor, 40, "rejected-reference")
)
rejected_id = cur.lastrowid
db.commit()
db.execute(
    "INSERT INTO donation_reviews(donation_id,reviewer_user_id,decision,tickets,note) VALUES(?,?,?,?,?)",
    (rejected_id, admin, "rejected", 0, "Payment evidence did not match")
)
db.execute("UPDATE donations SET status='rejected' WHERE id=? AND status='pending'", (rejected_id,))
assert db.execute("SELECT tickets FROM users WHERE id=?", (donor,)).fetchone()[0] == 25
assert db.execute(
    "SELECT COUNT(*) FROM ticket_ledger WHERE reason='payment' AND reference=?",
    (str(rejected_id),)
).fetchone()[0] == 0
db.commit()

# The database independently rejects a self-review even if application validation is bypassed.
cur = db.execute(
    "INSERT INTO donations(user_id,amount,reference_id) VALUES(?,?,?)",
    (self_reviewer, 10, "self-review")
)
self_id = cur.lastrowid
db.commit()
db.execute(
    "INSERT INTO donation_reviews(donation_id,reviewer_user_id,decision,tickets,note) VALUES(?,?,?,?,?)",
    (self_id, self_reviewer, "approved", 10, "Attempted self-review")
)
try:
    db.execute("UPDATE donations SET status='approved' WHERE id=?", (self_id,))
    raise AssertionError("self-review unexpectedly succeeded")
except sqlite3.IntegrityError as exc:
    assert "independent attributable review" in str(exc)
    db.rollback()

# Review history is append-only.
try:
    db.execute("UPDATE donation_reviews SET note='changed' WHERE donation_id=?", (approved_id,))
    raise AssertionError("review update unexpectedly succeeded")
except sqlite3.IntegrityError as exc:
    assert "immutable" in str(exc)
    db.rollback()

print("PASS: donation review trigger requires attribution and independent review; approval posts exactly one Crown credit and ledger row; rejection posts none; review history is immutable.")
