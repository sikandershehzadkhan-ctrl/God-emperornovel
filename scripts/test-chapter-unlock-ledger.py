import sqlite3

def db_fixture(tickets=20):
    db = sqlite3.connect(":memory:")
    db.executescript("""
      CREATE TABLE users(id INTEGER PRIMARY KEY, tickets INTEGER NOT NULL);
      CREATE TABLE unlocks(user_id INTEGER NOT NULL, chapter_id INTEGER NOT NULL, cost INTEGER NOT NULL, PRIMARY KEY(user_id,chapter_id));
      CREATE TABLE ticket_ledger(id INTEGER PRIMARY KEY, user_id INTEGER, delta INTEGER, reason TEXT, reference TEXT);
    """)
    db.execute("INSERT INTO users VALUES(1,?)", (tickets,))
    db.commit()
    return db

def unlock(db, cost, chapter=10):
    db.execute("BEGIN")
    db.execute("""UPDATE users SET tickets=tickets-?
                  WHERE id=1 AND tickets>=?
                  AND NOT EXISTS(SELECT 1 FROM unlocks WHERE user_id=1 AND chapter_id=?)""",
               (cost, cost, chapter))
    debited = db.execute("SELECT changes()").fetchone()[0]
    db.execute("""INSERT INTO unlocks(user_id,chapter_id,cost)
                  SELECT 1,?,? WHERE changes()=1""", (chapter, cost))
    inserted = db.execute("SELECT changes()").fetchone()[0]
    if cost > 0:
        db.execute("""INSERT INTO ticket_ledger(user_id,delta,reason,reference)
                      SELECT 1,?,'chapter_unlock',? WHERE changes()=1""", (-cost, str(chapter)))
        ledger = db.execute("SELECT changes()").fetchone()[0]
    else:
        ledger = 0
    db.commit()
    return debited, inserted, ledger

db = db_fixture(20)
assert unlock(db, 7) == (1, 1, 1)
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0] == 13
assert unlock(db, 7) == (0, 0, 0)
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0] == 13
assert db.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0] == 1

poor = db_fixture(3)
assert unlock(poor, 7) == (0, 0, 0)
assert poor.execute("SELECT COUNT(*) FROM unlocks").fetchone()[0] == 0
assert poor.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0] == 0

free = db_fixture(0)
assert unlock(free, 0, 11) == (1, 1, 0)
assert free.execute("SELECT COUNT(*) FROM unlocks").fetchone()[0] == 1
assert free.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0] == 0
print("PASS: atomic chapter unlock, no duplicate debit, insufficient-balance rejection and free locked chapter handling.")
