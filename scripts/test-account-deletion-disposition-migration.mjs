import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base=readFileSync(new URL("../migrations/0015_account_deletion_review_store.sql",import.meta.url),"utf8");
const migration=readFileSync(new URL("../migrations/0017_account_deletion_disposition_plans.sql",import.meta.url),"utf8");
const python=String.raw`
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
`;
const script=python+String.raw`
db.executescript(sys.stdin.readline())
now=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat()
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version,claimed_by,claim_expires_at) VALUES(100,10,1,'review_in_progress',2,2,?)",(now,))
digest='a'*64
db.execute("INSERT INTO account_deletion_disposition_plans(review_id,request_id,plan_version,base_review_version,proposer_id,policy_version,plan_digest) VALUES(100,10,1,2,2,'2026-11',?)",(digest,))
plan=db.execute("SELECT id FROM account_deletion_disposition_plans").fetchone()[0]
db.execute("INSERT INTO account_deletion_disposition_items(plan_id,dependency_key,outcome,reason,policy_reference) VALUES(?,'creator_content','retain','Preserve works pending rights review','retention-v1')",(plan,))
def rejected(sql,args=()):
 try: db.execute(sql,args); raise AssertionError("invalid disposition mutation accepted")
 except sqlite3.IntegrityError: pass
rejected("INSERT INTO account_deletion_disposition_plans(review_id,request_id,plan_version,base_review_version,proposer_id,policy_version,plan_digest) VALUES(100,10,2,1,2,'2026-11',?)",(digest,))
rejected("INSERT INTO account_deletion_disposition_plans(review_id,request_id,plan_version,base_review_version,proposer_id,policy_version,plan_digest) VALUES(100,10,2,2,1,'2026-11',?)",(digest,))
rejected("INSERT INTO account_deletion_disposition_plans(review_id,request_id,plan_version,base_review_version,proposer_id,policy_version,plan_digest) VALUES(100,10,2,2,3,'2026-11',?)",(digest,))
rejected("INSERT INTO account_deletion_disposition_items(plan_id,dependency_key,outcome,reason,policy_reference) VALUES(?,'unknown_dependency','retain','reason','policy')",(plan,))
rejected("UPDATE account_deletion_disposition_plans SET policy_version='changed' WHERE id=?",(plan,))
rejected("UPDATE account_deletion_disposition_items SET reason='changed' WHERE plan_id=?",(plan,))
db.execute("UPDATE account_deletion_reviews SET version=3 WHERE id=100")
db.execute("INSERT INTO account_deletion_disposition_plans(review_id,request_id,plan_version,base_review_version,proposer_id,policy_version,plan_digest) VALUES(100,10,2,3,2,'2026-11',?)",('b'*64,))
assert db.execute("SELECT COUNT(*) FROM account_deletion_disposition_plans").fetchone()[0]==2
assert db.execute("SELECT COUNT(*) FROM account_deletion_disposition_items").fetchone()[0]==1
print("PASS: disposition plans are claim-, subject-, request-, and version-bound; items are constrained and immutable; revised plans receive a new version.")
`;
const result=spawnSync("python3",["-c",script],{input:base+"\n"+migration,encoding:"utf8"});
if(result.error) throw result.error;
if(result.status!==0){process.stderr.write(result.stderr||"");process.stdout.write(result.stdout||"");process.exit(result.status||1)}
process.stdout.write(result.stdout);
