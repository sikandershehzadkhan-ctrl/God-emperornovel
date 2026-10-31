import sqlite3
from pathlib import Path

migration = Path("migrations/0019_admin_ticket_adjustments.sql").read_text(encoding="utf-8")
source = Path("src/index.js").read_text(encoding="utf-8")
admin = Path("public/admin.html").read_text(encoding="utf-8")

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY, username TEXT, tickets REAL NOT NULL DEFAULT 0);
CREATE TABLE ticket_ledger(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, delta REAL NOT NULL, reason TEXT NOT NULL, reference TEXT DEFAULT '');
INSERT INTO users(id,username,tickets) VALUES(1,'admin',0),(2,'reader',100);
""")
db.executescript(migration)

db.execute("INSERT INTO admin_ticket_adjustments(idempotency_key,admin_user_id,target_user_id,amount,note) VALUES('request-key-00000001',1,2,75,'Verified support credit')")
assert db.execute("SELECT tickets FROM users WHERE id=2").fetchone()[0] == 175
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE user_id=2 AND reason='admin_adjustment' AND delta=75").fetchone()[0] == 1
print("PASS: one adjustment insert atomically updates balance and ledger")

try:
    db.execute("INSERT INTO admin_ticket_adjustments(idempotency_key,admin_user_id,target_user_id,amount,note) VALUES('request-key-00000001',1,2,75,'Verified support credit')")
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("duplicate idempotency key was accepted")
assert db.execute("SELECT tickets FROM users WHERE id=2").fetchone()[0] == 175
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE user_id=2 AND reason='admin_adjustment'").fetchone()[0] == 1
print("PASS: duplicate idempotency key cannot double-credit")

for statement, label in [
    ("UPDATE admin_ticket_adjustments SET note='edited' WHERE id=1", "history cannot be edited"),
    ("DELETE FROM admin_ticket_adjustments WHERE id=1", "history cannot be deleted"),
]:
    try:
        db.execute(statement)
    except sqlite3.IntegrityError:
        print("PASS:", label)
    else:
        raise AssertionError(label)

start = source.index('if(p==="/api/admin/tickets"&&m==="POST"){')
end = source.index('if(p==="/api/admin/connectors"', start)
route = source[start:end]
checks = {
    "admin-only endpoint and rate limit": "const e=admin(u);if(e)return e;" in route and 'consumeAuthRateLimit(env,"admin-ticket-credit"' in route,
    "idempotency key and required reason validated": "idempotency_key" in route and "if(!note||note.length>500)" in route,
    "duplicate request returns an idempotent replay": "idempotent_replay:true" in route,
    "balance and ledger are not separately written in route": "UPDATE users SET tickets=tickets+" not in route and "INSERT INTO ticket_ledger" not in route,
    "admin adjustment history endpoint is protected": 'if(p==="/api/admin/ticket-adjustments"&&m==="GET"){const e=admin(u);if(e)return e;' in route,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)

assert "sessionStorage.getItem(storageKey)" in admin and "idempotency_key:key" in admin
assert "Required reason for this Crown adjustment" in admin
print("PASS: Admin UI reuses a pending idempotency key and requires a reason")
