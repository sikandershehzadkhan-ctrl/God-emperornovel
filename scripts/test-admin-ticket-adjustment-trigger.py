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
db.executescript((root / "migrations/0025_admin_ticket_adjustments.sql").read_text(encoding="utf-8"))

def user(name, email, role="user"):
    cur = db.execute(
        "INSERT INTO users(username,email,password_hash,role) VALUES(?,?,?,?)",
        (name, email, "test-hash", role)
    )
    return cur.lastrowid

admin = user("credit-admin", "credit-admin@example.test", "admin")
target = user("credit-target", "credit-target@example.test")
db.commit()

# One immutable adjustment insert posts one balance credit and one ledger row.
db.execute(
    "INSERT INTO admin_ticket_adjustments(idempotency_key,admin_user_id,target_user_id,amount,note) VALUES(?,?,?,?,?)",
    ("operation-key-0001", admin, target, 50, "Compensation for verified billing issue")
)
db.commit()
assert db.execute("SELECT tickets FROM users WHERE id=?", (target,)).fetchone()[0] == 50
assert db.execute(
    "SELECT COUNT(*) FROM ticket_ledger WHERE user_id=? AND reason='admin_adjustment' AND reference='1'",
    (target,)
).fetchone()[0] == 1

# Reusing the idempotency key cannot post another credit.
try:
    db.execute(
        "INSERT INTO admin_ticket_adjustments(idempotency_key,admin_user_id,target_user_id,amount,note) VALUES(?,?,?,?,?)",
        ("operation-key-0001", admin, target, 50, "Compensation for verified billing issue")
    )
    raise AssertionError("duplicate idempotency key unexpectedly succeeded")
except sqlite3.IntegrityError:
    db.rollback()
assert db.execute("SELECT tickets FROM users WHERE id=?", (target,)).fetchone()[0] == 50
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE reason='admin_adjustment'").fetchone()[0] == 1

# The schema rejects self-credit and invalid review notes.
for values in [
    ("operation-key-0002", admin, admin, 10, "Self credit"),
    ("operation-key-0003", admin, target, 10, "   "),
]:
    try:
        db.execute(
            "INSERT INTO admin_ticket_adjustments(idempotency_key,admin_user_id,target_user_id,amount,note) VALUES(?,?,?,?,?)",
            values
        )
        raise AssertionError("invalid administrator adjustment unexpectedly succeeded")
    except sqlite3.IntegrityError:
        db.rollback()

# Adjustment history is append-only.
try:
    db.execute("UPDATE admin_ticket_adjustments SET note='changed' WHERE idempotency_key='operation-key-0001'")
    raise AssertionError("adjustment update unexpectedly succeeded")
except sqlite3.IntegrityError as exc:
    assert "immutable" in str(exc)
    db.rollback()
try:
    db.execute("DELETE FROM admin_ticket_adjustments WHERE idempotency_key='operation-key-0001'")
    raise AssertionError("adjustment deletion unexpectedly succeeded")
except sqlite3.IntegrityError as exc:
    assert "immutable" in str(exc)
    db.rollback()

print("PASS: administrator Crown adjustments enforce unique operation keys, independent actor, bounded note, exactly-once balance/ledger posting, and immutable history.")
