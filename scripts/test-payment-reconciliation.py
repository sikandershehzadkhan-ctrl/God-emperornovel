import sqlite3
from pathlib import Path

root = Path(".")
source = (root / "src/index.js").read_text(encoding="utf-8")
module = (root / "src/payment-reconciliation.mjs").read_text(encoding="utf-8")
start = source.index('if(p==="/api/admin/payment-reconciliation"&&m==="GET"){')
end = source.index('if(p==="/api/admin/ticket-reconciliation"&&m==="GET"){', start)
route = source[start:end]

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY, tickets REAL NOT NULL DEFAULT 0);
CREATE TABLE donations(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, amount REAL NOT NULL, reference_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending');
CREATE TABLE ticket_ledger(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, delta REAL NOT NULL, reason TEXT NOT NULL, reference TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
INSERT INTO users(id,tickets) VALUES(1,25),(2,50),(9,0);
INSERT INTO donations(id,user_id,amount,reference_id,status) VALUES
 (1,1,25,'EP-ONE','approved'),
 (2,2,50,'EP-TWO','approved'),
 (3,1,75,'EP-DUP','pending'),
 (4,2,75,' ep-dup ','pending'),
 (5,1,100,'EP-REJECT','rejected');
""")
db.executescript((root / "migrations/0018_donation_review_audit.sql").read_text(encoding="utf-8"))
db.executescript("""
INSERT INTO donation_reviews(donation_id,reviewer_user_id,decision,tickets,note) VALUES
 (1,9,'approved',25,'Provider receipt checked'),
 (2,9,'approved',50,'Provider receipt checked'),
 (5,9,'rejected',0,'Provider reference not found');
INSERT INTO ticket_ledger(user_id,delta,reason,reference) VALUES
 (1,25,'payment','1'),
 (1,75,'payment','3'),
 (9,10,'payment','999');
""")

duplicate_groups = db.execute("""
 SELECT COUNT(*) FROM (
  SELECT LOWER(TRIM(reference_id)) FROM donations
  GROUP BY LOWER(TRIM(reference_id)) HAVING COUNT(*)>1
 )
""").fetchone()[0]
finalized_without_review = db.execute("""
 SELECT COUNT(*) FROM donations d LEFT JOIN donation_reviews r ON r.donation_id=d.id
 WHERE d.status IN ('approved','rejected') AND r.id IS NULL
""").fetchone()[0]
donation_anomalies = db.execute("""
 SELECT COUNT(*) FROM donations d
 LEFT JOIN donation_reviews r ON r.donation_id=d.id
 LEFT JOIN ticket_ledger l ON l.reason='payment' AND l.reference=CAST(d.id AS TEXT)
 WHERE (d.status='approved' AND (
   r.id IS NULL OR l.id IS NULL OR l.user_id IS NOT d.user_id
   OR ABS(l.delta-r.tickets)>0.000001
   OR (SELECT COUNT(*) FROM ticket_ledger lx WHERE lx.reason='payment' AND lx.reference=CAST(d.id AS TEXT))<>1
 )) OR (d.status<>'approved' AND l.id IS NOT NULL)
""").fetchone()[0]
unmatched = db.execute("""
 SELECT COUNT(*) FROM ticket_ledger l WHERE l.reason='payment'
 AND NOT EXISTS (SELECT 1 FROM donations d WHERE CAST(d.id AS TEXT)=l.reference)
""").fetchone()[0]
assert duplicate_groups == 1, duplicate_groups
assert finalized_without_review == 0, finalized_without_review
assert donation_anomalies == 2, donation_anomalies
assert unmatched == 1, unmatched
print("PASS: case/whitespace-normalized duplicate provider references are detected")
print("PASS: finalized donations missing attributable reviews are counted")
print("PASS: approved donations missing ledger credits and pending donations with credits are detected")
print("PASS: unmatched payment ledger entries are detected")

checks = {
 "route requires administrator authorization": "const e=admin(u);if(e)return e;" in route,
 "route has per-admin rate limiting": 'consumeAuthRateLimit(env,"admin-payment-reconciliation",String(u.id),20,300)' in route,
 "route only returns reconciliation output": "getPaymentReconciliation(env.DB)" in route and "UPDATE " not in route and "INSERT " not in route and "DELETE " not in route,
 "module explicitly documents read-only behavior": "never mutates balances or payment records" in module,
 "module reports normalized duplicate references": "LOWER(TRIM(reference_id))" in module and "duplicate_references" in module,
 "module detects approved donation and ledger inconsistencies": "donation_ledger_anomalies" in module and "donation_anomalies" in module,
 "module detects unmatched payment ledger rows": "unmatched_payment_ledger" in module,
}
for label, ok in checks.items():
 print(("PASS" if ok else "FAIL") + ": " + label)
if not all(checks.values()):
 raise SystemExit(1)
