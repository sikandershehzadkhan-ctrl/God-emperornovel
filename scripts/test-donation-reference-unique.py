import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE donations(id INTEGER PRIMARY KEY, user_id INTEGER, amount INTEGER NOT NULL, reference_id TEXT NOT NULL, status TEXT NOT NULL)")
db.execute("CREATE UNIQUE INDEX idx_donations_reference_normalized ON donations(LOWER(TRIM(reference_id)))")
db.execute("INSERT INTO donations(user_id,amount,reference_id,status) VALUES(1,100,'TX-First','pending')")
duplicate = db.execute("INSERT INTO donations(user_id,amount,reference_id,status) SELECT 2,100,' tx-first ','pending' WHERE NOT EXISTS (SELECT 1 FROM donations WHERE LOWER(TRIM(reference_id))=LOWER(TRIM(' tx-first ')))")
assert duplicate.rowcount == 0
try:
    db.execute("INSERT INTO donations(user_id,amount,reference_id,status) VALUES(2,100,' tx-FIRST ','pending')")
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Unique normalized reference index allowed a duplicate")
db.execute("INSERT INTO donations(user_id,amount,reference_id,status) VALUES(2,100,'TX-Second','pending')")
assert db.execute("SELECT COUNT(*) FROM donations").fetchone()[0] == 2
print("PASS: normalized donation reference uniqueness and duplicate insert guard.")
