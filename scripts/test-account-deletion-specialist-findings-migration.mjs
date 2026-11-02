import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base=readFileSync(new URL("../migrations/0015_account_deletion_review_store.sql",import.meta.url),"utf8");
const migration=readFileSync(new URL("../migrations/0019_account_deletion_specialist_findings.sql",import.meta.url),"utf8");
const script=String.raw`
import sqlite3,sys
from datetime import datetime,timedelta,timezone
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY);
CREATE TABLE account_deletion_requests(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,status TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT);
INSERT INTO users(id) VALUES(1),(2),(3),(4);
INSERT INTO account_deletion_requests(id,user_id,status) VALUES(10,1,'review_required'),(11,4,'review_required');
""")
`+String.raw`
db.executescript(sys.stdin.read())
future=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat()
past=(datetime.now(timezone.utc)-timedelta(days=1)).isoformat()
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version,claimed_by,claim_expires_at) VALUES(100,10,1,'review_in_progress',2,2,?)",(future,))
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version,claimed_by,claim_expires_at) VALUES(101,11,4,'review_in_progress',2,2,?)",(future,))
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version,claimed_by,claim_expires_at) VALUES(102,10,1,'review_in_progress',2,2,?)",(past,))
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version) VALUES(103,10,1,'review_required',2)")
insert="INSERT INTO account_deletion_disposition_findings(review_id,request_id,dependency_key,revision,reviewer_id,review_version,outcome,reason,policy_reference) VALUES(100,10,?, ?,3,2,'retain','Preserve pending specialist review','policy-v1')"
db.execute(insert,("creator_rights",1))
db.execute(insert,("financial_ledger",1))
def rejected(sql,args=()):
 try: db.execute(sql,args); raise AssertionError("invalid specialist finding accepted")
 except sqlite3.IntegrityError: pass
rejected(insert,("creator_content",1))
rejected("INSERT INTO account_deletion_disposition_findings(review_id,request_id,dependency_key,revision,reviewer_id,review_version,outcome,reason,policy_reference) VALUES(100,11,'ai_projects',1,3,2,'retain','Reason','policy')")
rejected("INSERT INTO account_deletion_disposition_findings(review_id,request_id,dependency_key,revision,reviewer_id,review_version,outcome,reason,policy_reference) VALUES(100,10,'ai_projects',1,1,2,'retain','Reason','policy')")
rejected("INSERT INTO account_deletion_disposition_findings(review_id,request_id,dependency_key,revision,reviewer_id,review_version,outcome,reason,policy_reference) VALUES(102,10,'ai_projects',1,3,2,'retain','Reason','policy')")
rejected("INSERT INTO account_deletion_disposition_findings(review_id,request_id,dependency_key,revision,reviewer_id,review_version,outcome,reason,policy_reference) VALUES(103,10,'ai_projects',1,3,2,'retain','Reason','policy')")
rejected(insert,("creator_rights",3))
rejected(insert,("creator_rights",2))
rejected("UPDATE account_deletion_disposition_findings SET reason='tampered' WHERE review_id=100")
rejected("DELETE FROM account_deletion_disposition_findings WHERE review_id=100")
db.execute("UPDATE account_deletion_reviews SET version=version+1 WHERE id=100")
db.execute("INSERT INTO account_deletion_disposition_findings(review_id,request_id,dependency_key,revision,reviewer_id,review_version,outcome,reason,policy_reference) VALUES(100,10,'creator_rights',2,4,3,'retain','Second specialist revision','policy-v2')")
assert db.execute("SELECT COUNT(*) FROM account_deletion_disposition_findings WHERE review_id=100").fetchone()[0]==3
print("PASS: specialist findings permit independent reviewers under an active case lease, enforce request/subject/version scope and sequential revisions, and are immutable.")
`;
const result=spawnSync("python3",["-c",script],{input:base+"\n"+migration,encoding:"utf8"});
if(result.error) throw result.error;
if(result.status!==0){process.stderr.write(result.stderr||"");process.stdout.write(result.stdout||"");process.exit(result.status||1)}
process.stdout.write(result.stdout);
