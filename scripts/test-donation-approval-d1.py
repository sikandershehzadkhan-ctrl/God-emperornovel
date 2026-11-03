#!/usr/bin/env python3
"""SQLite integration checks for the donation approval D1 batch sequence."""
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
db.row_factory = sqlite3.Row
db.execute("PRAGMA foreign_keys = ON")
db.executescript((ROOT / "migrations/0001_initial.sql").read_text())
db.executescript("""
CREATE TABLE ticket_ledger (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 delta REAL NOT NULL,
 reason TEXT NOT NULL,
 reference TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
""")
db.execute("INSERT INTO users(id,username,email,password_hash,tickets) VALUES(1,'reader','reader@example.test','hash',4)")
db.execute("INSERT INTO donations(id,user_id,amount,reference_id,status) VALUES(10,1,25,'ref-10','pending')")
db.commit()

def approve(donation_id, user_id, crowns):
    db.execute("BEGIN")
    try:
        transition = db.execute(
            "UPDATE donations SET status='approved' WHERE id=? AND status='pending' AND user_id IS NOT NULL",
            (donation_id,),
        )
        transitioned = transition.rowcount
        credit = db.execute(
            "UPDATE users SET tickets=tickets+? WHERE id=? AND changes()=1",
            (crowns, user_id),
        )
        credited = credit.rowcount
        ledger = db.execute(
            "INSERT INTO ticket_ledger(user_id,delta,reason,reference) "
            "SELECT ?,?,?,? WHERE changes()=1",
            (user_id, crowns, "payment", str(donation_id)),
        )
        logged = ledger.rowcount
        if (transitioned, credited, logged) != (1, 1, 1):
            db.rollback()
            return False
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise

assert approve(10, 1, 25) is True
assert db.execute("SELECT status FROM donations WHERE id=10").fetchone()[0] == "approved"
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0] == 29
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE reference='10'").fetchone()[0] == 1

# A replay cannot credit twice because the pending-only transition changes zero rows.
assert approve(10, 1, 25) is False
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0] == 29
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE reference='10'").fetchone()[0] == 1

# A ledger failure must roll back the preceding donation status and balance updates.
db.execute("INSERT INTO donations(id,user_id,amount,reference_id,status) VALUES(11,1,15,'ref-11','pending')")
db.execute(
    "CREATE TRIGGER reject_payment_ledger BEFORE INSERT ON ticket_ledger "
    "WHEN NEW.reference='11' BEGIN SELECT RAISE(ABORT,'ledger unavailable'); END"
)
db.commit()
try:
    approve(11, 1, 15)
    raise AssertionError("ledger failure should abort the D1 batch")
except sqlite3.IntegrityError:
    pass
assert db.execute("SELECT status FROM donations WHERE id=11").fetchone()[0] == "pending"
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0] == 29
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE reference='11'").fetchone()[0] == 0

print("PASS: donation approval is one-time; duplicate approvals cannot double-credit; ledger failure rolls back status and ticket balance.")
