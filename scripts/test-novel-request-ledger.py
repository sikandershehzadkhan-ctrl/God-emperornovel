import sqlite3

def setup(balance, prior_requests=0):
    db = sqlite3.connect(":memory:")
    db.executescript("""
        CREATE TABLE users(id INTEGER PRIMARY KEY, tickets REAL NOT NULL);
        CREATE TABLE novel_requests(
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
            url TEXT NOT NULL, source_host TEXT NOT NULL, week_key INTEGER NOT NULL,
            cost REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending'
        );
        CREATE TABLE ticket_ledger(
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
            delta REAL NOT NULL, reason TEXT NOT NULL, reference TEXT NOT NULL
        );
    """)
    db.execute("INSERT INTO users(id,tickets) VALUES(1,?)", (balance,))
    for n in range(prior_requests):
        db.execute(
            "INSERT INTO novel_requests(user_id,url,source_host,week_key,cost,status) VALUES(1,?,?,7,0,'pending')",
            (f"https://source.example/{n}", "source.example"),
        )
    db.commit()
    return db

def create_request(db, url):
    user_id, week, host = 1, 7, "source.example"
    cost_sql = "(SELECT CASE WHEN COUNT(*)<3 THEN 0 ELSE (COUNT(*)-2)*100 END FROM novel_requests WHERE user_id=? AND week_key=?)"
    db.execute("BEGIN")
    db.execute(
        f"""INSERT INTO novel_requests(user_id,url,source_host,week_key,cost,status)
            SELECT ?,?,?,?,{cost_sql},'pending'
            WHERE EXISTS (SELECT 1 FROM users WHERE id=? AND tickets>={cost_sql})""",
        (user_id, url, host, week, user_id, week, user_id, user_id, week),
    )
    inserted = db.execute("SELECT changes()").fetchone()[0]
    request_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.execute(
        """UPDATE users SET tickets=tickets-(SELECT cost FROM novel_requests WHERE id=last_insert_rowid() AND user_id=?)
           WHERE id=? AND changes()=1
             AND EXISTS (SELECT 1 FROM novel_requests WHERE id=last_insert_rowid() AND user_id=?)""",
        (user_id, user_id, user_id),
    )
    debited = db.execute("SELECT changes()").fetchone()[0]
    db.execute(
        """INSERT INTO ticket_ledger(user_id,delta,reason,reference)
           SELECT user_id,-cost,'novel_request',substr(url,1,180)
           FROM novel_requests
           WHERE id=last_insert_rowid() AND cost>0 AND changes()=1"""
    )
    ledger = db.execute("SELECT changes()").fetchone()[0]
    db.commit()
    return inserted, request_id, debited, ledger

# First three requests are free; the fourth costs 100 and is debited once.
db = setup(500)
for n in range(3):
    inserted, _, debited, ledger = create_request(db, f"https://source.example/free-{n}")
    assert (inserted, debited, ledger) == (1, 1, 0)
inserted, request_id, debited, ledger = create_request(db, "https://source.example/paid")
assert (inserted, debited, ledger) == (1, 1, 1)
assert db.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0] == 400
assert db.execute("SELECT cost FROM novel_requests WHERE id=?", (request_id,)).fetchone()[0] == 100
assert db.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0] == 1

# Insufficient balance creates no request and no ledger entry.
poor = setup(50, prior_requests=4)
inserted, _, debited, ledger = create_request(poor, "https://source.example/blocked")
assert (inserted, debited, ledger) == (0, 0, 0)
assert poor.execute("SELECT COUNT(*) FROM novel_requests").fetchone()[0] == 4
assert poor.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0] == 50
assert poor.execute("SELECT COUNT(*) FROM ticket_ledger").fetchone()[0] == 0

# The next tier is derived from the committed request count.
tier = setup(500, prior_requests=4)
inserted, request_id, debited, ledger = create_request(tier, "https://source.example/tier-two")
assert (inserted, debited, ledger) == (1, 1, 1)
assert tier.execute("SELECT cost FROM novel_requests WHERE id=?", (request_id,)).fetchone()[0] == 200
assert tier.execute("SELECT tickets FROM users WHERE id=1").fetchone()[0] == 300
print("PASS: free tiers, paid request debit, ledger linkage, insufficient-balance rejection and escalating weekly pricing.")
