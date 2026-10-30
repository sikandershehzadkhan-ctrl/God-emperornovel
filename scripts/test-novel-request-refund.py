import sqlite3

def fixture():
    db = sqlite3.connect(":memory:")
    db.executescript("""
      CREATE TABLE users(id INTEGER PRIMARY KEY, tickets INTEGER NOT NULL);
      CREATE TABLE novel_requests(id INTEGER PRIMARY KEY, user_id INTEGER, cost INTEGER NOT NULL, status TEXT NOT NULL, url TEXT NOT NULL);
      CREATE TABLE ticket_ledger(id INTEGER PRIMARY KEY, user_id INTEGER, delta INTEGER, reason TEXT, reference TEXT);
      INSERT INTO users VALUES(7, 40);
      INSERT INTO novel_requests VALUES(12, 7, 100, 'pending', 'https://source.example/book');
    """)
    return db

def reject(db, request_id):
    db.execute("BEGIN")
    results = []
    db.execute("""UPDATE novel_requests SET status='rejected'
                  WHERE id=? AND status='pending'
                  AND EXISTS (SELECT 1 FROM users WHERE id=novel_requests.user_id)""", (request_id,))
    transitioned = db.execute("SELECT changes()").fetchone()[0]
    db.execute("""UPDATE users SET tickets=tickets+100
                  WHERE id=7 AND changes()=1""")
    credited = db.execute("SELECT changes()").fetchone()[0]
    db.execute("""INSERT INTO ticket_ledger(user_id,delta,reason,reference)
                  SELECT 7,100,'novel_request_refund','https://source.example/book'
                  WHERE changes()=1""")
    ledger = db.execute("SELECT changes()").fetchone()[0]
    db.commit()
    return transitioned, credited, ledger

db = fixture()
assert reject(db, 12) == (1, 1, 1)
assert db.execute("SELECT tickets FROM users WHERE id=7").fetchone()[0] == 140
assert db.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0] == 1
assert reject(db, 12) == (0, 0, 0)
assert db.execute("SELECT tickets FROM users WHERE id=7").fetchone()[0] == 140
assert db.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0] == 1

missing = fixture()
missing.execute("DELETE FROM users WHERE id=7")
missing.commit()
assert reject(missing, 12) == (0, 0, 0)
assert missing.execute("SELECT status FROM novel_requests WHERE id=12").fetchone()[0] == "pending"
print("PASS: one-time request refund, status transition guard, balance credit and ledger idempotency.")
