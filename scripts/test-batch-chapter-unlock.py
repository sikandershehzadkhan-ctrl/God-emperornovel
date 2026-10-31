import sqlite3

def fixture(tickets=100):
    db = sqlite3.connect(":memory:")
    db.executescript("""
      CREATE TABLE users(id INTEGER PRIMARY KEY, tickets INTEGER NOT NULL);
      CREATE TABLE unlocks(user_id INTEGER NOT NULL, chapter_id INTEGER NOT NULL, cost INTEGER NOT NULL, PRIMARY KEY(user_id,chapter_id));
      CREATE TABLE ticket_ledger(id INTEGER PRIMARY KEY, user_id INTEGER, delta INTEGER, reason TEXT, reference TEXT);
      CREATE TABLE unlock_batches(id INTEGER PRIMARY KEY, user_id INTEGER, novel_id INTEGER, start_chapter INTEGER, end_chapter INTEGER, requested_count INTEGER, cost INTEGER);
      CREATE TABLE chapters(id INTEGER PRIMARY KEY, novel_id INTEGER, chapter_number INTEGER, publication_status TEXT, is_locked INTEGER, ticket_cost INTEGER);
      INSERT INTO chapters VALUES
        (101,5,1,'published',1,20),
        (102,5,2,'published',1,30),
        (103,5,3,'published',0,0);
    """)
    db.execute("INSERT INTO users VALUES(1,?)", (tickets,))
    db.commit()
    return db

def batch_unlock(db, novel=5, start=1, count=10):
    db.execute("BEGIN")
    rows = db.execute("""
      SELECT c.id,c.chapter_number,c.ticket_cost
      FROM chapters c
      LEFT JOIN unlocks x ON x.chapter_id=c.id AND x.user_id=1
      WHERE c.novel_id=? AND c.publication_status='published'
        AND c.is_locked=1 AND c.chapter_number>=? AND x.chapter_id IS NULL
      ORDER BY c.chapter_number LIMIT ?
    """, (novel,start,count)).fetchall()
    if not rows:
        db.commit()
        return {"debited":0,"batch":0,"unlocked":0,"cost":0}
    cost = sum(row[2] for row in rows)
    ids = [row[0] for row in rows]
    marks = ",".join("?" for _ in ids)
    db.execute(
      "UPDATE users SET tickets=tickets-? WHERE id=1 AND tickets>=? "
      f"AND NOT EXISTS(SELECT 1 FROM unlocks WHERE user_id=1 AND chapter_id IN ({marks}))",
      [cost,cost,*ids]
    )
    debited = db.execute("SELECT changes()").fetchone()[0]
    for chapter_id, _, price in rows:
        db.execute(
          "INSERT INTO unlocks(user_id,chapter_id,cost) SELECT 1,?,? WHERE changes()=1",
          (chapter_id,price)
        )
    if cost > 0:
        db.execute(
          "INSERT INTO ticket_ledger(user_id,delta,reason,reference) "
          "SELECT 1,?,'batch_unlock',? WHERE changes()=1",
          (-cost,f"{novel}:{start}:{count}")
        )
    db.execute("""
      INSERT INTO unlock_batches(user_id,novel_id,start_chapter,end_chapter,requested_count,cost)
      SELECT 1,?,?,?,?,? WHERE changes()=1
    """, (novel,rows[0][1],rows[-1][1],count,cost))
    batch = db.execute("SELECT changes()").fetchone()[0]
    db.commit()
    return {"debited":debited,"batch":batch,"unlocked":len(rows) if debited==1 and batch==1 else 0,"cost":cost}

db=fixture(100)
first=batch_unlock(db)
assert first=={"debited":1,"batch":1,"unlocked":2,"cost":50}
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0]==50
assert db.execute("SELECT COUNT(*) FROM unlocks").fetchone()[0]==2
assert db.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0]==1
assert db.execute("SELECT COUNT(*) FROM unlock_batches").fetchone()[0]==1
assert batch_unlock(db)=={"debited":0,"batch":0,"unlocked":0,"cost":0}
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0]==50
assert db.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0]==1

poor=fixture(10)
assert batch_unlock(poor)=={"debited":0,"batch":0,"unlocked":0,"cost":50}
assert poor.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0]==10
assert poor.execute("SELECT COUNT(*) FROM unlocks").fetchone()[0]==0
assert poor.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0]==0
assert poor.execute("SELECT COUNT(*) FROM unlock_batches").fetchone()[0]==0

free=fixture(0)
assert batch_unlock(free,start=3)=={"debited":0,"batch":0,"unlocked":0,"cost":0}
assert free.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0]==0
assert free.execute("SELECT COUNT(*) FROM unlocks").fetchone()[0]==0
assert free.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0]==0
assert free.execute("SELECT COUNT(*) FROM unlock_batches").fetchone()[0]==0

mixed=fixture(100)
result=batch_unlock(mixed)
assert result["unlocked"]==2, "free chapter 3 must not consume a paid batch slot"
assert mixed.execute("SELECT COUNT(*) FROM unlocks WHERE chapter_id=103").fetchone()[0]==0
assert mixed.execute("SELECT COUNT(*) FROM unlock_batches WHERE end_chapter=2").fetchone()[0]==1
print("PASS: atomic batch unlock selects locked chapters only, excludes free chapters, prevents duplicate debit, rejects insufficient balance and avoids empty purchase records.")
