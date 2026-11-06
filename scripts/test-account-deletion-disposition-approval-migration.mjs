import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base=readFileSync(new URL("../migrations/0041_account_deletion_review_store.sql",import.meta.url),"utf8");
const plans=readFileSync(new URL("../migrations/0043_account_deletion_disposition_plans.sql",import.meta.url),"utf8");
const approvals=readFileSync(new URL("../migrations/0044_account_deletion_disposition_approvals.sql",import.meta.url),"utf8");
const script=String.raw`
import sqlite3,sys
from datetime import datetime,timedelta,timezone
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY);
CREATE TABLE account_closure_requests(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,status TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT);
INSERT INTO users(id) VALUES(1),(2),(3);
INSERT INTO account_closure_requests(id,user_id,status) VALUES(10,1,'review_required');
""")
`+String.raw`
db.executescript(sys.stdin.read())
expiry=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat()
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version,claimed_by,claim_expires_at) VALUES(100,10,1,'review_in_progress',2,2,?)",(expiry,))
digest1='a'*64
digest2='b'*64
db.execute("INSERT INTO account_deletion_disposition_plans(review_id,request_id,plan_version,base_review_version,proposer_id,policy_version,plan_digest) VALUES(100,10,1,2,2,'2026-11',?)",(digest1,))
plan1=db.execute("SELECT id FROM account_deletion_disposition_plans WHERE plan_version=1").fetchone()[0]
db.execute("UPDATE account_deletion_reviews SET version=version+1,proposed_by=2,plan_digest=? WHERE id=100",(digest1,))
db.execute("UPDATE account_deletion_reviews SET version=version+1 WHERE id=100")
db.execute("INSERT INTO account_deletion_disposition_plans(review_id,request_id,plan_version,base_review_version,proposer_id,policy_version,plan_digest) VALUES(100,10,2,4,2,'2026-11',?)",(digest2,))
plan2=db.execute("SELECT id FROM account_deletion_disposition_plans WHERE plan_version=2").fetchone()[0]
db.execute("UPDATE account_deletion_reviews SET version=version+1,proposed_by=2,plan_digest=? WHERE id=100",(digest2,))
def rejected(sql,args=()):
 try: db.execute(sql,args); raise AssertionError("invalid approval accepted")
 except sqlite3.IntegrityError: pass
insert="INSERT INTO account_deletion_disposition_approvals(plan_id,review_id,request_id,approver_id,approved_plan_digest,approval_policy_version) VALUES(?,100,10,?,?,'approval-v1')"
rejected(insert,(plan1,3,digest1))
rejected(insert,(plan2,2,digest2))
rejected(insert,(plan2,1,digest2))
rejected(insert,(plan2,3,digest1))
db.execute(insert,(plan2,3,digest2))
rejected("UPDATE account_deletion_disposition_approvals SET approval_policy_version='changed' WHERE plan_id=?",(plan2,))
rejected("DELETE FROM account_deletion_disposition_approvals WHERE plan_id=?",(plan2,))
rejected(insert,(plan2,3,digest2))
assert db.execute("SELECT COUNT(*) FROM account_deletion_disposition_approvals").fetchone()[0]==1
print("PASS: approvals bind only to the latest active plan and exact digest; proposer/requester self-approval, stale plans, duplicates, updates, and deletion are rejected.")
`;
const result=spawnSync("python3",["-c",script],{input:base+"\n"+plans+"\n"+approvals,encoding:"utf8"});
if(result.error) throw result.error;
if(result.status!==0){process.stderr.write(result.stderr||"");process.stdout.write(result.stdout||"");process.exit(result.status||1)}
process.stdout.write(result.stdout);
