import sqlite3

CLAIM_REVIEW = """
UPDATE account_deletion_reviews
SET state='review_in_progress',version=version+1,claimed_by=?,
    claim_expires_at=datetime('now','+30 minutes'),updated_at=CURRENT_TIMESTAMP
WHERE id=? AND subject_user_id<>? AND version=?
  AND (state='review_required' OR
       (state='review_in_progress' AND
        (claimed_by=? OR claim_expires_at<=CURRENT_TIMESTAMP)))
"""
UPDATE_REQUEST = """
UPDATE account_closure_requests
SET status='review_required',updated_at=CURRENT_TIMESTAMP
WHERE id=? AND user_id=? AND status IN ('pending','review_required')
  AND changes()=1
  AND EXISTS (
    SELECT 1 FROM account_deletion_reviews v
    WHERE v.id=? AND v.request_id=? AND v.claimed_by=? AND v.version=?
  )
"""
ROLLBACK_GUARD = "SELECT CASE WHEN changes()=1 THEN 1 ELSE json('not-json') END"

def setup(request_status='pending'):
    db = sqlite3.connect(':memory:')
    db.execute('PRAGMA foreign_keys=ON')
    db.executescript("""
    CREATE TABLE account_closure_requests(
      id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,status TEXT NOT NULL,
      updated_at TEXT
    );
    CREATE TABLE account_deletion_reviews(
      id INTEGER PRIMARY KEY,request_id INTEGER NOT NULL,subject_user_id INTEGER NOT NULL,
      state TEXT NOT NULL,version INTEGER NOT NULL,claimed_by INTEGER,claim_expires_at TEXT,
      updated_at TEXT
    );
    INSERT INTO account_closure_requests VALUES(10,1,'pending');
    INSERT INTO account_deletion_reviews VALUES(100,10,1,'review_required',1,NULL,NULL,CURRENT_TIMESTAMP);
    """)
    db.execute("UPDATE account_closure_requests SET status=? WHERE id=10", (request_status,))
    db.commit()
    return db

def claim(db, reviewer, expected_version):
    try:
        db.execute('BEGIN')
        db.execute(CLAIM_REVIEW, (reviewer,100,reviewer,expected_version,reviewer))
        db.execute(UPDATE_REQUEST, (10,1,100,10,reviewer,expected_version+1))
        db.execute(ROLLBACK_GUARD)
        db.commit()
        return True
    except sqlite3.DatabaseError:
        db.rollback()
        return False

# Normal path: both records transition together.
db = setup()
assert claim(db,2,1)
assert db.execute("SELECT state,version,claimed_by FROM account_deletion_reviews WHERE id=100").fetchone() == ('review_in_progress',2,2)
assert db.execute("SELECT status FROM account_closure_requests WHERE id=10").fetchone()[0] == 'review_required'

# If the request changed before claim, the guard aborts and rolls back the review update.
db = setup('cancelled')
assert not claim(db,2,1)
assert db.execute("SELECT state,version,claimed_by FROM account_deletion_reviews WHERE id=100").fetchone() == ('review_required',1,None)
assert db.execute("SELECT status FROM account_closure_requests WHERE id=10").fetchone()[0] == 'cancelled'

# A stale concurrent claimant cannot overwrite the winning reviewer's claim.
db = setup()
assert claim(db,2,1)
assert not claim(db,3,1)
assert db.execute("SELECT state,version,claimed_by FROM account_deletion_reviews WHERE id=100").fetchone() == ('review_in_progress',2,2)
assert db.execute("SELECT status FROM account_closure_requests WHERE id=10").fetchone()[0] == 'review_required'

print("PASS: account-deletion claim SQL updates both records together, rolls back partial transitions, and rejects stale concurrent claims.")
