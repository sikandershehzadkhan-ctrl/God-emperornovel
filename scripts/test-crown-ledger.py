import sqlite3

def setup():
    db = sqlite3.connect(":memory:")
    db.executescript("""
      CREATE TABLE users(id INTEGER PRIMARY KEY, tickets REAL NOT NULL);
      CREATE TABLE chapters(id INTEGER PRIMARY KEY, ticket_cost REAL NOT NULL, is_locked INTEGER NOT NULL);
      CREATE TABLE unlocks(user_id INTEGER NOT NULL, chapter_id INTEGER NOT NULL, cost REAL NOT NULL, PRIMARY KEY(user_id,chapter_id));
      CREATE TABLE ticket_ledger(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, delta REAL NOT NULL, reason TEXT NOT NULL, reference TEXT NOT NULL);
      CREATE TABLE unlock_batches(id INTEGER PRIMARY KEY, user_id INTEGER, novel_id INTEGER, start_chapter INTEGER, end_chapter INTEGER, requested_count INTEGER, cost REAL);
      CREATE TABLE donations(id INTEGER PRIMARY KEY, user_id INTEGER, amount REAL, status TEXT);
      CREATE TABLE novel_requests(id INTEGER PRIMARY KEY, user_id INTEGER, cost REAL, status TEXT, url TEXT);
      INSERT INTO donations VALUES(1,2,5,'pending');
      INSERT INTO novel_requests VALUES(1,2,3,'pending','https://source.example/book/1');
      INSERT INTO users VALUES(1, 15);
      INSERT INTO users VALUES(2, 1);
      INSERT INTO chapters VALUES(101, 5, 1);
      INSERT INTO chapters VALUES(102, 5, 1);
      INSERT INTO chapters VALUES(103, 0, 1);
    """)
    return db

def single(db, user, chapter, cost):
    with db:
        db.execute("UPDATE users SET tickets=tickets-? WHERE id=? AND tickets>=? AND NOT EXISTS (SELECT 1 FROM unlocks WHERE user_id=? AND chapter_id=?)", (cost,user,cost,user,chapter))
        db.execute("INSERT INTO unlocks(user_id,chapter_id,cost) SELECT ?,?,? WHERE changes()=1", (user,chapter,cost))
        db.execute("INSERT INTO ticket_ledger(user_id,delta,reason,reference) SELECT ?,?,?,? WHERE changes()=1", (user,-cost,"chapter_unlock",str(chapter)))
    return db.execute("SELECT tickets FROM users WHERE id=?", (user,)).fetchone()[0]

db=setup()
assert single(db,1,101,5)==10
assert db.execute("SELECT COUNT(*) FROM unlocks WHERE user_id=1 AND chapter_id=101").fetchone()[0]==1
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE user_id=1 AND reference='101'").fetchone()[0]==1
# Insufficient balance: no grant and no ledger entry.
before=db.execute("SELECT tickets FROM users WHERE id=2").fetchone()[0]
single(db,2,101,5)
assert db.execute("SELECT tickets FROM users WHERE id=2").fetchone()[0]==before
assert db.execute("SELECT COUNT(*) FROM unlocks WHERE user_id=2").fetchone()[0]==0
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE user_id=2").fetchone()[0]==0
# Repeated requests cannot charge the same chapter twice.
single(db,1,101,5)
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0]==10
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE user_id=1 AND reference='101'").fetchone()[0]==1
# A batch debit is conditional on both sufficient balance and no overlapping prior unlock.
rows=[102,103]
slots=",".join("?" for _ in rows)
with db:
    cur=db.execute(f"UPDATE users SET tickets=tickets-? WHERE id=? AND tickets>=? AND NOT EXISTS (SELECT 1 FROM unlocks WHERE user_id=? AND chapter_id IN ({slots}))", (5,1,5,1,*rows))
    db.execute("INSERT INTO unlocks(user_id,chapter_id,cost) SELECT ?,?,? WHERE changes()=1", (1,102,5))
    db.execute("INSERT INTO unlocks(user_id,chapter_id,cost) SELECT ?,?,? WHERE changes()=1", (1,103,0))
    db.execute("INSERT INTO unlock_batches(user_id,novel_id,start_chapter,end_chapter,requested_count,cost) SELECT ?,?,?,?,?,? WHERE changes()=1", (1,9,2,3,10,5))
    db.execute("INSERT INTO ticket_ledger(user_id,delta,reason,reference) SELECT ?,?,?,? WHERE changes()=1", (1,-5,"batch_unlock","9:2:10"))
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0]==5
assert db.execute("SELECT COUNT(*) FROM unlocks WHERE user_id=1 AND chapter_id IN (102,103)").fetchone()[0]==2
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE user_id=1 AND reason='batch_unlock'").fetchone()[0]==1
# Insufficient batch: neither unlock nor debit.
with db:
    cur=db.execute("UPDATE users SET tickets=tickets-? WHERE id=? AND tickets>=? AND NOT EXISTS (SELECT 1 FROM unlocks WHERE user_id=? AND chapter_id IN (?,?))", (10,2,10,2,101,102))
    db.execute("INSERT INTO unlocks(user_id,chapter_id,cost) SELECT ?,?,? WHERE changes()=1", (2,101,5))
assert cur.rowcount==0
assert db.execute("SELECT COUNT(*) FROM unlocks WHERE user_id=2").fetchone()[0]==0
assert db.execute("SELECT tickets FROM users WHERE id=2").fetchone()[0]==1

# Payment approval credits the pending server-side amount once, never a callback-supplied amount.
with db:
    db.execute("UPDATE donations SET status='approved' WHERE id=? AND status='pending'", (1,))
    db.execute("UPDATE users SET tickets=tickets+? WHERE id=? AND changes()=1", (5,2))
    db.execute("INSERT INTO ticket_ledger(user_id,delta,reason,reference) SELECT ?,?,?,? WHERE changes()=1", (2,5,"payment","1"))
assert db.execute("SELECT tickets FROM users WHERE id=2").fetchone()[0]==6
with db:
    db.execute("UPDATE donations SET status='approved' WHERE id=? AND status='pending'", (1,))
    db.execute("UPDATE users SET tickets=tickets+? WHERE id=? AND changes()=1", (5,2))
    db.execute("INSERT INTO ticket_ledger(user_id,delta,reason,reference) SELECT ?,?,?,? WHERE changes()=1", (2,5,"payment","1"))
assert db.execute("SELECT tickets FROM users WHERE id=2").fetchone()[0]==6
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE user_id=2 AND reason='payment'").fetchone()[0]==1
# Paid request charge: request and ledger writes occur only after a successful debit.
with db:
    db.execute("UPDATE users SET tickets=tickets-? WHERE id=? AND tickets>=?", (5,1,5))
    db.execute("INSERT INTO novel_requests(user_id,url,cost,status) SELECT ?,?,?, 'pending' WHERE changes()=1", (1,"https://source.example/book/2",5))
    db.execute("INSERT INTO ticket_ledger(user_id,delta,reason,reference) SELECT ?,?,?,? WHERE changes()=1", (1,-5,"novel_request","https://source.example/book/2"))
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0]==0
assert db.execute("SELECT COUNT(*) FROM novel_requests WHERE user_id=1 AND url LIKE '%/2'").fetchone()[0]==1
# Refund status transition gates both Crown credit and ledger insertion.
with db:
    db.execute("UPDATE novel_requests SET status='rejected' WHERE id=1 AND status='pending'")
    db.execute("UPDATE users SET tickets=tickets+? WHERE id=? AND changes()=1", (3,2))
    db.execute("INSERT INTO ticket_ledger(user_id,delta,reason,reference) SELECT ?,?,?,? WHERE changes()=1", (2,3,"novel_request_refund","https://source.example/book/1"))
assert db.execute("SELECT tickets FROM users WHERE id=2").fetchone()[0]==9
with db:
    db.execute("UPDATE novel_requests SET status='rejected' WHERE id=1 AND status='pending'")
    db.execute("UPDATE users SET tickets=tickets+? WHERE id=? AND changes()=1", (3,2))
    db.execute("INSERT INTO ticket_ledger(user_id,delta,reason,reference) SELECT ?,?,?,? WHERE changes()=1", (2,3,"novel_request_refund","https://source.example/book/1"))
assert db.execute("SELECT tickets FROM users WHERE id=2").fetchone()[0]==9
assert db.execute("SELECT COUNT(*) FROM ticket_ledger WHERE user_id=2 AND reason='novel_request_refund'").fetchone()[0]==1

print("PASS: Crown debits, chapter grants, batch unlocks, payment credits, paid requests and refunds are conditional and idempotent.")
