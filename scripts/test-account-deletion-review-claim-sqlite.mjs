import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const migration14=readFileSync(new URL("../migrations/0014_account_deletion_requests.sql",import.meta.url),"utf8");
const migration15=readFileSync(new URL("../migrations/0015_account_deletion_review_store.sql",import.meta.url),"utf8");
const python=String.raw`
import json, sqlite3, sys
payload=json.load(sys.stdin)
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE users(id INTEGER PRIMARY KEY)")
db.executemany("INSERT INTO users(id) VALUES(?)",[(1,),(2,),(3,)])
db.executescript(payload["migration14"])
db.executescript(payload["migration15"])
db.execute("INSERT INTO account_deletion_requests(user_id,status,requested_at,scheduled_for) VALUES(1,'pending_deletion','2026-11-01T00:00:00Z','2026-12-01T00:00:00Z')")
request_id=db.execute("SELECT id FROM account_deletion_requests").fetchone()[0]
insert_sql="INSERT INTO account_deletion_reviews(request_id,subject_user_id,state) SELECT id,user_id,'review_required' FROM account_deletion_requests WHERE id=? AND status IN ('pending_deletion','review_required') ON CONFLICT(request_id) DO NOTHING"
update_sql="UPDATE account_deletion_reviews SET claimed_by=?,claim_expires_at=?,version=version+1,updated_at=? WHERE request_id=? AND subject_user_id<>? AND state IN ('review_required','review_in_progress','awaiting_user_action','blocked_retention') AND (claimed_by IS NULL OR claim_expires_at<=?) AND EXISTS(SELECT 1 FROM account_deletion_requests r WHERE r.id=account_deletion_reviews.request_id AND r.user_id=account_deletion_reviews.subject_user_id AND r.status IN ('pending_deletion','review_required')) RETURNING id,request_id,subject_user_id,state,version,claimed_by,claim_expires_at"
event_sql="INSERT INTO account_deletion_review_events(review_id,request_id,actor_id,event_type,from_state,to_state,review_version,metadata_json) SELECT id,request_id,?,'case_claimed',state,state,version,'{}' FROM account_deletion_reviews WHERE request_id=? AND claimed_by=? AND claim_expires_at=? AND version=(SELECT MAX(version) FROM account_deletion_reviews WHERE request_id=?) AND changes()=1"
def claim(actor, now, expiry):
    db.execute("BEGIN IMMEDIATE")
    try:
        db.execute(insert_sql,(request_id,))
        row=db.execute(update_sql,(actor,expiry,now,request_id,actor,now)).fetchone()
        if row:
            db.execute(event_sql,(actor,request_id,actor,expiry,request_id))
            assert db.execute("SELECT changes()").fetchone()[0]==1
        db.commit()
        return row
    except:
        db.rollback()
        raise
first=claim(2,"2026-11-02T00:00:00Z","2026-11-02T00:10:00Z")
assert first and first[5]==2 and first[4]==2
assert claim(3,"2026-11-02T00:01:00Z","2026-11-02T00:11:00Z") is None
assert db.execute("SELECT COUNT(*) FROM account_deletion_review_events").fetchone()[0]==1
# A lease that has expired can be acquired by another authorized reviewer.
second=claim(3,"2026-11-02T00:11:00Z","2026-11-02T00:21:00Z")
assert second and second[5]==3 and second[4]==3
assert db.execute("SELECT COUNT(*) FROM account_deletion_review_events").fetchone()[0]==2
# The subject account cannot claim its own case.
assert claim(1,"2026-11-02T00:12:00Z","2026-11-02T00:22:00Z") is None
# If audit insertion fails, the claim update must roll back with it.
db.execute("UPDATE account_deletion_reviews SET claimed_by=NULL,claim_expires_at=NULL,version=version+1 WHERE request_id=?",(request_id,))
db.execute("CREATE TRIGGER reject_claim_event BEFORE INSERT ON account_deletion_review_events BEGIN SELECT RAISE(ABORT,'injected audit failure'); END")
before=db.execute("SELECT version,claimed_by FROM account_deletion_reviews WHERE request_id=?",(request_id,)).fetchone()
try:
    claim(2,"2026-11-02T00:30:00Z","2026-11-02T00:40:00Z")
    raise AssertionError("injected audit failure should abort claim transaction")
except sqlite3.IntegrityError:
    pass
after=db.execute("SELECT version,claimed_by FROM account_deletion_reviews WHERE request_id=?",(request_id,)).fetchone()
assert after==before, (before,after)
assert db.execute("SELECT COUNT(*) FROM account_deletion_review_events").fetchone()[0]==2
print("PASS: claim SQL enforces a single active lease, expired-lease takeover, requester exclusion, immutable audit, and rollback if audit insertion fails.")
`;
const result=spawnSync("python3",["-c",python],{input:JSON.stringify({migration14,migration15}),encoding:"utf8"});
if(result.status!==0) throw new Error(result.stderr||result.stdout||"SQLite reviewer claim test failed");
process.stdout.write(result.stdout);
