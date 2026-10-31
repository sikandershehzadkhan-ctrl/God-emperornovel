import sqlite3

def fixture(tickets=100):
    db = sqlite3.connect(":memory:")
    db.executescript("""
      CREATE TABLE users(id INTEGER PRIMARY KEY, tickets INTEGER NOT NULL);
      CREATE TABLE unlocks(user_id INTEGER NOT NULL, chapter_id INTEGER NOT NULL, cost INTEGER NOT NULL, PRIMARY KEY(user_id,chapter_id));
      CREATE TABLE ticket_ledger(id INTEGER PRIMARY KEY, user_id INTEGER, delta INTEGER, reason TEXT, reference TEXT);
      CREATE TABLE unlock_batches(id INTEGER PRIMARY KEY, user_id INTEGER, novel_id INTEGER, start_chapter INTEGER, end_chapter INTEGER, requested_count INTEGER, cost INTEGER);
      CREATE TABLE chapters(id INTEGER PRIMARY KEY, chapter_number INTEGER, is_locked INTEGER, ticket_cost INTEGER);
      INSERT INTO chapters VALUES(101,1,1,20),(102,2,1,30),(103,3,0,0);
    """)
    db.execute("INSERT INTO users VALUES(1,?)", (tickets,))
    db.commit()
    return db

def batch_unlock(db, chapter_ids=(101,102), novel=5, count=10):
    db.execute("BEGIN")
    ids = list(chapter_ids)
    marks = ",".join("?" for _ in ids)
    cost = db.execute(f"SELECT COALESCE(SUM(ticket_cost),0) FROM chapters WHERE id IN ({marks})", ids).fetchone()[0] if ids else 0
    guard = f" AND NOT EXISTS(SELECT 1 FROM unlocks WHERE user_id=? AND chapter_id IN ({marks}))" if ids else ""
    params = [cost,1,cost] + ([1]+ids if ids else [])
    db.execute("UPDATE users SET tickets=tickets-? WHERE id=? AND tickets>=?" + guard, params)
    debited = db.execute("SELECT changes()").fetchone()[0]
    for cid in ids:
        price = db.execute("SELECT ticket_cost FROM chapters WHERE id=?", (cid,)).fetchone()[0]
        db.execute("INSERT INTO unlocks(user_id,chapter_id,cost) SELECT 1,?,? WHERE changes()=1", (cid,price))
    if cost > 0:
        db.execute("INSERT INTO ticket_ledger(user_id,delta,reason,reference) SELECT 1,?,'batch_unlock',? WHERE changes()=1", (-cost,f"{novel}:1:{count}"))
    db.execute("""INSERT INTO unlock_batches(user_id,novel_id,start_chapter,end_chapter,requested_count,cost)
                  SELECT 1,5,1,3,10,? WHERE changes()=1""", (cost,))
    batch = db.execute("SELECT changes()").fetchone()[0]
    db.commit()
    return debited, batch

db=fixture(100)
assert batch_unlock(db)==(1,1)
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0]==50
assert db.execute("SELECT COUNT(*) FROM unlocks").fetchone()[0]==2
assert db.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0]==1
assert batch_unlock(db)==(0,0)
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0]==50
assert db.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0]==1

poor=fixture(10)
assert batch_unlock(poor)==(0,0)
assert poor.execute("SELECT COUNT(*) FROM unlocks").fetchone()[0]==0
assert poor.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0]==0

free=fixture(0)
assert batch_unlock(free,(103,))==(1,1)
assert free.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0]==0
assert free.execute("SELECT COUNT(*) FROM unlock_batches").fetchone()[0]==1
print("PASS: atomic multi-chapter unlock, duplicate protection, insufficient balance and free chapter batch.")
