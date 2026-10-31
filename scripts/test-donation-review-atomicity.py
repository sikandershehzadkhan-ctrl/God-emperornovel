import sqlite3
from pathlib import Path

root = Path(".")
migration = (root / "migrations/0018_donation_review_audit.sql").read_text(encoding="utf-8")
source = (root / "src/index.js").read_text(encoding="utf-8")
start = source.index('if(p==="/api/admin/donations"&&m==="GET"){')
end = source.index('if(p==="/api/admin/reports"&&m==="GET"){', start)
route = source[start:end]

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY, tickets REAL NOT NULL DEFAULT 0);
CREATE TABLE donations(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, amount REAL NOT NULL, reference_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending');
CREATE TABLE ticket_ledger(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, delta REAL NOT NULL, reason TEXT NOT NULL, reference TEXT DEFAULT '');
INSERT INTO users(id,tickets) VALUES(7,15),(99,0);
INSERT INTO donations(id,user_id,amount,reference_id,status) VALUES(41,7,25,'TX-41','pending');
INSERT INTO donations(id,user_id,amount,reference_id,status) VALUES(42,7,50,'TX-42','pending');
INSERT INTO donations(id,user_id,amount,reference_id,status) VALUES(43,7,75,'TX-43','pending');
""")
db.executescript(migration)

def expect_integrity_error(fn, label):
    try:
        fn()
    except sqlite3.IntegrityError:
        print("PASS:", label)
        return
    raise AssertionError("Expected integrity error: " + label)

expect_integrity_error(
    lambda: db.execute("UPDATE donations SET status='approved' WHERE id=41"),
    "approval cannot bypass an attributable review"
)

db.execute(
    "INSERT INTO donation_reviews(donation_id,reviewer_user_id,decision,tickets,note) VALUES(41,99,'approved',25,'Verified provider receipt')"
)
db.execute("UPDATE donations SET status='approved' WHERE id=41")
assert db.execute("SELECT tickets FROM users WHERE id=7").fetchone()[0] == 40
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE reason='payment' AND reference='41'").fetchone()[0] == 1
print("PASS: approval posts the reviewed Crown amount and one ledger entry")

expect_integrity_error(
    lambda: db.execute("INSERT INTO donation_reviews(donation_id,reviewer_user_id,decision,tickets,note) VALUES(41,99,'approved',25,'Duplicate')"),
    "a donation can have only one final review"
)
expect_integrity_error(
    lambda: db.execute("UPDATE donation_reviews SET note='edited' WHERE donation_id=41"),
    "review history cannot be edited"
)
expect_integrity_error(
    lambda: db.execute("DELETE FROM donation_reviews WHERE donation_id=41"),
    "review history cannot be deleted"
)

db.execute(
    "INSERT INTO donation_reviews(donation_id,reviewer_user_id,decision,tickets,note) VALUES(42,99,'rejected',0,'Reference could not be verified')"
)
db.execute("UPDATE donations SET status='rejected' WHERE id=42")
assert db.execute("SELECT tickets FROM users WHERE id=7").fetchone()[0] == 40
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE reference='42'").fetchone()[0] == 0
print("PASS: rejection records a decision without crediting Crowns")

db.execute("UPDATE donations SET status='approved' WHERE id=41")
assert db.execute("SELECT tickets FROM users WHERE id=7").fetchone()[0] == 40
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE reason='payment' AND reference='41'").fetchone()[0] == 1
print("PASS: repeating an already-approved status does not post a second credit")

checks = {
    "admin authentication protects donation review": 'const e=admin(u);if(e)return e;' in route,
    "donation review endpoint is rate-limited": 'consumeAuthRateLimit(env,"admin-donation-review",String(u.id),30,300)' in route,
    "review requires a bounded explanation": 'if(!note||note.length>1000)' in route,
    "reviewer identity and decision are recorded before finalization": "INSERT INTO donation_reviews" in route and "reviewer_user_id" in route,
    "approval amount remains server-validated": "parseManualDonationApproval(b,d)" in route,
    "approval route does not directly credit users or insert payment ledger rows": "UPDATE users SET tickets" not in route and "INSERT INTO ticket_ledger" not in route,
    "review history is returned to administrators": "r.review_decision" in route and "r.review_note" in route,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
    raise SystemExit(1)
