import sqlite3
from pathlib import Path

root = Path(".")
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY, role TEXT NOT NULL, tickets INTEGER NOT NULL DEFAULT 0);
CREATE TABLE novel_requests(
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
 url TEXT NOT NULL, source_host TEXT NOT NULL, week_key INTEGER NOT NULL,
 cost INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending',
 FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE ticket_ledger(
 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
 delta INTEGER NOT NULL, reason TEXT NOT NULL, reference TEXT NOT NULL
);
INSERT INTO users(id,role,tickets) VALUES(1,'user',20),(2,'admin',0),(3,'user',5);
INSERT INTO novel_requests(id,user_id,url,source_host,week_key,cost,status) VALUES
 (10,1,'https://example.test/paid','example.test',1,100,'pending'),
 (11,3,'https://example.test/free','example.test',1,0,'pending'),
 (12,1,'https://example.test/rejected','example.test',1,50,'rejected');
""")
db.executescript((root / "migrations/0021_novel_request_refunds.sql").read_text(encoding="utf-8"))

def reject(fn, label):
    try:
        fn()
    except sqlite3.IntegrityError:
        print("PASS:", label)
        return
    raise AssertionError("Expected database rejection: " + label)

# A single transaction mirrors the D1 batch: state transition then refund record.
db.execute("BEGIN")
db.execute("UPDATE novel_requests SET status='rejected' WHERE id=10 AND status='pending'")
assert db.execute("SELECT changes()").fetchone()[0] == 1
db.execute("""INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note)
              SELECT 10,2,1,100,'Provider request rejected after verification'
              WHERE changes()=1""")
db.commit()
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0] == 120
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE reason='novel_request_refund' AND reference='novel_request:10'").fetchone()[0] == 1
print("PASS: rejected paid request records an immutable refund and atomically credits balance plus ledger")

reject(lambda: db.execute("""INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note)
 VALUES(10,2,1,100,'Duplicate')"""), "duplicate request refund cannot be posted twice")
reject(lambda: db.execute("""INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note)
 VALUES(11,2,3,50,'Free request cannot be refunded')"""), "free request cannot generate a refund")
reject(lambda: db.execute("""INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note)
 VALUES(12,1,1,50,'Non-admin cannot refund')"""), "non-admin reviewer cannot issue a refund")
reject(lambda: db.execute("""INSERT INTO novel_request_refunds(request_id,admin_user_id,user_id,amount,note)
 VALUES(12,2,1,49,'Wrong amount')"""), "refund must equal the original charged amount")
reject(lambda: db.execute("UPDATE novel_request_refunds SET note='edited' WHERE request_id=10"), "refund audit is immutable")
reject(lambda: db.execute("DELETE FROM novel_request_refunds WHERE request_id=10"), "refund audit cannot be deleted")
assert db.execute("SELECT tickets FROM users WHERE id=3").fetchone()[0] == 5
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE user_id=3").fetchone()[0] == 0
print("PASS: invalid refund attempts never credit user balances")
