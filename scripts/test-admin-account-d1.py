#!/usr/bin/env python3
"""SQLite integration checks for the D1 administrator account PATCH invariants."""
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
db.row_factory = sqlite3.Row
db.execute("PRAGMA foreign_keys = ON")
db.executescript((ROOT / "migrations/0001_initial.sql").read_text())

# Keep the SQL predicate in sync with src/index.js; the companion Node test
# asserts that the Worker handler contains the same guard and D1 batch pattern.
def patch(actor_id, target_id, *, role=None, verified=None, banned=None):
    current = db.execute(
        "SELECT id,role,verified,banned FROM users WHERE id=?", (target_id,)
    ).fetchone()
    if current is None:
        return 0, 0
    assignments, values = [], []
    if role is not None:
        assignments.append("role=?")
        values.append(role)
    if verified is not None:
        assignments.append("verified=?")
        values.append(int(verified))
    if banned is not None:
        assignments.append("banned=?")
        values.append(int(banned))
    if not assignments:
        return 0, 0
    next_role = role if role is not None else current["role"]
    next_banned = int(banned) if banned is not None else int(current["banned"] or 0)
    sql = (
        "UPDATE users SET " + ",".join(assignments) +
        " WHERE id=? AND NOT (role='admin' AND banned=0 "
        "AND (?!='admin' OR ?=1) "
        "AND (SELECT COUNT(*) FROM users WHERE role='admin' AND banned=0)<=1)"
    )
    try:
        db.execute("BEGIN")
        cur = db.execute(sql, (*values, target_id, next_role, next_banned))
        updated = cur.rowcount
        # Model D1's conditional audit insert from the successful update count.
        audit = db.execute(
            "INSERT INTO audit_logs(user_id,action,details) VALUES(?,?,?)",
            (actor_id, "admin_user_update", "{}"),
        ) if updated == 1 else None
        logged = audit.rowcount if audit is not None else 0
        db.commit()
        return updated, logged
    except Exception:
        db.rollback()
        raise

def seed():
    db.execute("DELETE FROM audit_logs")
    db.execute("DELETE FROM users")
    db.executemany(
        "INSERT INTO users(id,username,email,password_hash,role,verified,banned) VALUES(?,?,?,?,?,?,?)",
        [
            (1, "root-a", "a@example.test", "hash", "admin", 1, 0),
            (2, "root-b", "b@example.test", "hash", "admin", 0, 0),
            (3, "member", "m@example.test", "hash", "user", 1, 1),
        ],
    )
    db.commit()

seed()
# A role-only update must not clear verification or unban an account.
assert patch(1, 3, role="author") == (1, 1)
member = db.execute("SELECT role,verified,banned FROM users WHERE id=3").fetchone()
assert tuple(member) == ("author", 1, 1)

# With two active administrators, removing one is allowed; removing the last is not.
assert patch(1, 2, role="user") == (1, 1)
assert patch(1, 1, role="user") == (0, 0)
assert db.execute("SELECT role FROM users WHERE id=1").fetchone()[0] == "admin"

# The same last-active-admin protection applies to banning.
assert patch(2, 1, banned=True) == (0, 0)
assert db.execute("SELECT banned FROM users WHERE id=1").fetchone()[0] == 0

# A failed audit write must roll back the account mutation in the same transaction.
seed()
db.execute(
    "CREATE TRIGGER reject_admin_audit BEFORE INSERT ON audit_logs "
    "BEGIN SELECT RAISE(ABORT, 'audit unavailable'); END"
)
try:
    patch(1, 3, role="author")
    raise AssertionError("audit failure should abort the batch")
except sqlite3.IntegrityError:
    pass
assert db.execute("SELECT role FROM users WHERE id=3").fetchone()[0] == "user"

print("PASS: D1-compatible SQLite integration checks cover omitted fields, last-admin protection, conditional audit and atomic rollback.")
