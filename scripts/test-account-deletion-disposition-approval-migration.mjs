import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base=readFileSync(new URL("../migrations/0015_account_deletion_review_store.sql",import.meta.url),"utf8");
const plans=readFileSync(new URL("../migrations/0017_account_deletion_disposition_plans.sql",import.meta.url),"utf8");
const approvals=readFileSync(new URL("../migrations/0018_account_deletion_disposition_approvals.sql",import.meta.url),"utf8");
const script=String.raw`
import sqlite3,sys
from datetime import datetime,timedelta,timezone
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY);
CREATE TABLE account_deletion_requests(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,status TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT);
INSERT INTO users(id) VALUES(1),(2),(3);
INSERT INTO account_deletion_requests(id,user_id,status) VALUES(10,1,'review_required');
""")
`+String.raw`
db.executescript(sys.stdin.read())
expiry=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat()
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version,claimed_by,claim_expires_at) VALUES(100,10,1,'review_in_progress',2,2,?)",(expiry,))
digest='a'*64
db.execute("INSERT INTO account_deletion_disposition_plans(review_id,request_id,plan_version,base_review_version,proposer_id,policy_version,plan_digest) VALUES(100,10,1,2,2,'2026-11',?)",(digest,))
plan=db.execute("SELECT id FROM account_deletion_disposition_plans").fetchone()[0]
def rejected(sql,args=()):
 try: db.execute(sql,args); raise AssertionError("invalid approval accepted")
 except sqlite3.IntegrityError: pass
db.execute("INSERT INTO account_deletion_disposition_approvals(plan_id,review_id,request_id,approver_id,approved_plan_digest,approval_policy_version) VALUES(?,100,10,3,?,'approval-v1')",(plan,digest))
rejected("INSERT INTO account_deletion_disposition_approvals(plan_id,review_id,request_id,approver_id,approved_plan_digest,approval_policy_version) VALUES(?,100,10,2,?,'approval-v1')",(plan,digest))
rejected("INSERT INTO account_deletion_disposition_approvals(plan_id,review_id,request_id,approver_id,approved_plan_digest,approval_policy_version) VALUES(?,100,10,1,?,'approval-v1')",(plan,digest))
rejected("INSERT INTO account_deletion_disposition_approvals(plan_id,review_id,request_id,approver_id,approved_plan_digest,approval_policy_version) VALUES(?,100,10,3,?,'approval-v1')",(plan,'b'*64))
rejected("UPDATE account_deletion_disposition_approvals SET approval_policy_version='changed' WHERE plan_id=?",(plan,))
rejected("DELETE FROM account_deletion_disposition_approvals WHERE plan_id=?",(plan,))
rejected("INSERT INTO account_deletion_disposition_approvals(plan_id,review_id,request_id,approver_id,approved_plan_digest,approval_policy_version) VALUES(?,100,10,3,?,'approval-v1')",(plan,digest))
assert db.execute("SELECT COUNT(*) FROM account_deletion_disposition_approvals").fetchone()[0]==1
print("PASS: independent approvals bind to the exact plan digest, reject proposer/requester self-approval, and remain immutable and unique.")
`;
const result=spawnSync("python3",["-c",script],{input:base+"\n"+plans+"\n"+approvals,encoding:"utf8"});
if(result.error) throw result.error;
if(result.status!==0){process.stderr.write(result.stderr||"");process.stdout.write(result.stdout||"");process.exit(result.status||1)}
process.stdout.write(result.stdout);
