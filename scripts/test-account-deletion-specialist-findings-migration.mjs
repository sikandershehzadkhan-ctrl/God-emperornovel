import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base=readFileSync(new URL("../migrations/0015_account_deletion_review_store.sql",import.meta.url),"utf8");
const roles=readFileSync(new URL("../migrations/0016_account_deletion_reviewer_roles.sql",import.meta.url),"utf8");
const migration=readFileSync(new URL("../migrations/0019_account_deletion_specialist_findings.sql",import.meta.url),"utf8");
const script=String.raw`
import json,sqlite3,sys
from datetime import datetime,timedelta,timezone
payload=json.load(sys.stdin)
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY);
CREATE TABLE account_deletion_requests(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,status TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT);
INSERT INTO users(id) VALUES(1),(2),(3),(4),(5);
INSERT INTO account_deletion_requests(id,user_id,status) VALUES
 (10,1,'review_required'),(11,4,'review_required'),(12,1,'review_required'),(13,1,'review_required');
""")
db.executescript(payload["base"])
db.executescript(payload["roles"])
db.executescript(payload["migration"])
db.executemany(
 "INSERT INTO account_deletion_reviewer_assignments(user_id,role_key,assigned_by) VALUES(?,?,1)",
 [(3,"creator_rights_reviewer"),(4,"finance_compliance_reviewer"),
  (2,"privacy_administrator"),(5,"support_reviewer")]
)
future=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat()
past=(datetime.now(timezone.utc)-timedelta(days=1)).isoformat()
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version,claimed_by,claim_expires_at) VALUES(100,10,1,'review_in_progress',2,2,?)",(future,))
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version,claimed_by,claim_expires_at) VALUES(101,11,4,'review_in_progress',2,2,?)",(future,))
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version,claimed_by,claim_expires_at) VALUES(102,12,1,'review_in_progress',2,2,?)",(past,))
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version) VALUES(103,13,1,'review_required',2)")
insert="INSERT INTO account_deletion_disposition_findings(review_id,request_id,dependency_key,revision,reviewer_id,review_version,outcome,reason,policy_reference) VALUES(?,?,?,?,?,?,?,?,?,?)"
def add(key,revision,reviewer,version=2,review=100,request=10,outcome="retain",reason="Preserve pending specialist review",policy="policy-v1"):
 db.execute(insert,(review,request,key,revision,reviewer,version,outcome,reason,policy))
def rejected(sql,args=()):
 try:
  db.execute(sql,args)
  raise AssertionError("invalid specialist finding accepted")
 except sqlite3.IntegrityError:
  pass
add("creator_rights",1,3)
add("financial_ledger",1,4)
rejected(insert,(100,10,"ai_projects",1,3,2,"retain","Wrong specialist role","policy"))
rejected(insert,(100,11,"ai_projects",1,3,2,"retain","Request mismatch","policy"))
rejected(insert,(100,10,"creator_content",1,1,2,"retain","Requester cannot review","policy"))
rejected(insert,(102,12,"creator_content",1,3,2,"retain","Expired lease","policy"))
rejected(insert,(103,13,"creator_content",1,3,2,"retain","No active lease","policy"))
rejected(insert,(100,10,"creator_rights",3,3,2,"retain","Revision skipped","policy"))
rejected(insert,(100,10,"creator_rights",1,3,2,"retain","Duplicate revision","policy"))
rejected(insert,(100,10,"creator_rights",2,3,2,"erase_all","Unknown outcome","policy"))
rejected(insert,(100,10,"creator_rights",2,3,2,"retain"," ","policy"))
rejected("UPDATE account_deletion_disposition_findings SET reason='tampered' WHERE review_id=100")
rejected("DELETE FROM account_deletion_disposition_findings WHERE review_id=100")
db.execute("UPDATE account_deletion_reviews SET version=version+1 WHERE id=100")
add("creator_rights",2,3,version=3)
assert db.execute("SELECT COUNT(*) FROM account_deletion_disposition_findings WHERE review_id=100").fetchone()[0]==3
assert db.execute("SELECT COUNT(*) FROM account_deletion_review_events WHERE event_type='disposition_proposed' AND review_id=100").fetchone()[0]==3
db.execute("UPDATE account_deletion_reviewer_assignments SET revoked_by=3,revoked_at=CURRENT_TIMESTAMP WHERE user_id=2 AND role_key='privacy_administrator' AND revoked_at IS NULL")
rejected(insert,(100,10,"ai_projects",1,2,3,"retain","Revoked reviewer must be denied","policy"))
db.execute("CREATE TRIGGER injected_audit_failure BEFORE INSERT ON account_deletion_review_events WHEN NEW.event_type='disposition_proposed' BEGIN SELECT RAISE(ABORT,'injected audit failure'); END")
try:
 db.execute("BEGIN")
 db.execute("UPDATE account_deletion_reviews SET version=version+1 WHERE id=100")
 add("creator_rights",3,3,version=4)
 raise AssertionError("injected audit failure did not abort finding")
except sqlite3.IntegrityError:
 db.rollback()
assert db.execute("SELECT version FROM account_deletion_reviews WHERE id=100").fetchone()[0]==3
assert db.execute("SELECT COUNT(*) FROM account_deletion_disposition_findings WHERE review_id=100").fetchone()[0]==3
print("PASS: specialist findings require active category-specific reviewer roles, exact request/subject/version and lease scope, sequential immutable revisions, and atomic audit rollback.")
`;
const result=spawnSync("python3",["-c",script],{input:JSON.stringify({base,roles,migration}),encoding:"utf8"});
if(result.error) throw result.error;
if(result.status!==0){process.stderr.write(result.stderr||"");process.stdout.write(result.stdout||"");process.exit(result.status||1)}
process.stdout.write(result.stdout);
