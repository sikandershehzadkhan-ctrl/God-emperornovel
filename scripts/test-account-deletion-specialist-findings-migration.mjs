import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const migration=readFileSync(new URL("../migrations/0042_account_deletion_reviewer_roles.sql",import.meta.url),"utf8");
const reviewStore=readFileSync(new URL("../migrations/0041_account_deletion_review_store.sql",import.meta.url),"utf8");
const specialist=readFileSync(new URL("../migrations/0045_account_deletion_specialist_findings.sql",import.meta.url),"utf8");
const script=String.raw`
import json,sqlite3,sys
payload=json.load(sys.stdin)
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users(id INTEGER PRIMARY KEY);
INSERT INTO users(id) VALUES(1),(2),(3),(4),(5);
""")
db.executescript(payload["migration"])
# Assignment automatically produces one matching immutable event.
db.execute("INSERT INTO account_deletion_reviewer_assignments(user_id,role_key,assigned_by) VALUES(2,'privacy_administrator',1)")
assignment=db.execute("SELECT id FROM account_deletion_reviewer_assignments WHERE user_id=2").fetchone()[0]
events=db.execute("SELECT target_user_id,actor_id,action,role_key FROM account_deletion_reviewer_assignment_events WHERE assignment_id=?",(assignment,)).fetchall()
assert events==[(2,1,"assigned","privacy_administrator")],events
# Active duplicate role and forged/mismatched events are rejected.
def rejected(sql,args=()):
 try:
  db.execute(sql,args)
  raise AssertionError("invalid reviewer mutation accepted")
 except sqlite3.IntegrityError: pass
rejected("INSERT INTO account_deletion_reviewer_assignments(user_id,role_key,assigned_by) VALUES(2,'privacy_administrator',3)")
rejected("INSERT INTO account_deletion_reviewer_assignment_events(assignment_id,target_user_id,actor_id,action,role_key) VALUES(?,2,3,'assigned','privacy_administrator')",(assignment,))
# Revocation produces exactly one second event and cannot be repeated.
db.execute("UPDATE account_deletion_reviewer_assignments SET revoked_by=3,revoked_at=CURRENT_TIMESTAMP WHERE id=?",(assignment,))
events=db.execute("SELECT actor_id,action FROM account_deletion_reviewer_assignment_events WHERE assignment_id=? ORDER BY id",(assignment,)).fetchall()
assert events==[(1,"assigned"),(3,"revoked")],events
rejected("UPDATE account_deletion_reviewer_assignments SET revoked_by=4,revoked_at=CURRENT_TIMESTAMP WHERE id=?",(assignment,))
# Both assignment and revocation audit records are immutable.
rejected("UPDATE account_deletion_reviewer_assignment_events SET actor_id=4 WHERE assignment_id=?",(assignment,))
rejected("DELETE FROM account_deletion_reviewer_assignment_events WHERE assignment_id=?",(assignment,))
# A failed audit insert rolls back the role assignment itself.
db.execute("CREATE TRIGGER injected_assignment_audit_failure BEFORE INSERT ON account_deletion_reviewer_assignment_events WHEN NEW.action='assigned' BEGIN SELECT RAISE(ABORT,'injected audit failure'); END")
db.commit()
try:
 db.execute("INSERT INTO account_deletion_reviewer_assignments(user_id,role_key,assigned_by) VALUES(4,'support_reviewer',1)")
 raise AssertionError("assignment survived failed audit insertion")
except sqlite3.IntegrityError: pass
assert db.execute("SELECT COUNT(*) FROM account_deletion_reviewer_assignments WHERE user_id=4").fetchone()[0]==0
# A failed revocation audit insert must roll back the revocation update too.
db.execute("INSERT INTO account_deletion_reviewer_assignments(user_id,role_key,assigned_by) VALUES(5,'support_reviewer',1)")
revoke_id=db.execute("SELECT id FROM account_deletion_reviewer_assignments WHERE user_id=5").fetchone()[0]
db.execute("CREATE TRIGGER injected_revocation_audit_failure BEFORE INSERT ON account_deletion_reviewer_assignment_events WHEN NEW.action='revoked' BEGIN SELECT RAISE(ABORT,'injected revocation audit failure'); END")
try:
 db.execute("UPDATE account_deletion_reviewer_assignments SET revoked_by=3,revoked_at=CURRENT_TIMESTAMP WHERE id=?",(revoke_id,))
 raise AssertionError("revocation survived failed audit insertion")
except sqlite3.IntegrityError: pass
assert db.execute("SELECT revoked_at FROM account_deletion_reviewer_assignments WHERE id=?",(revoke_id,)).fetchone()[0] is None
assert db.execute("SELECT COUNT(*) FROM account_deletion_reviewer_assignment_events WHERE assignment_id=?",(revoke_id,)).fetchone()[0]==1
# Revoked reviewer cannot write specialist findings after the role has been revoked.
db.executescript("""
CREATE TABLE account_closure_requests(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,status TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT);
INSERT INTO account_closure_requests(id,user_id,status) VALUES(10,1,'review_required');
""")
db.executescript(payload["reviewStore"])
db.executescript(payload["specialist"])
future='2999-01-01T00:00:00Z'
db.execute("INSERT INTO account_deletion_reviewer_assignments(user_id,role_key,assigned_by) VALUES(2,'creator_rights_reviewer',1)")
db.execute("INSERT INTO account_deletion_reviews(id,request_id,subject_user_id,state,version,claimed_by,claim_expires_at) VALUES(100,10,1,'review_in_progress',1,3,?)",(future,))
db.execute("UPDATE account_deletion_reviewer_assignments SET revoked_by=3,revoked_at=CURRENT_TIMESTAMP WHERE user_id=2 AND role_key='creator_rights_reviewer'")
try:
 db.execute("""INSERT INTO account_deletion_disposition_findings(review_id,request_id,dependency_key,revision,reviewer_id,review_version,outcome,reason,policy_reference) VALUES(100,10,'creator_content',1,2,1,'retain','Cannot write after revocation','policy-v1')""")
 raise AssertionError("revoked specialist was allowed to write")
except sqlite3.IntegrityError: pass
print("PASS: reviewer assignment and revocation each generate exactly one scoped audit event; failed audit writes roll back the role change; revoked specialists cannot submit findings.")
`;
const result=spawnSync("python3",["-c",script],{input:JSON.stringify({migration,reviewStore,specialist}),encoding:"utf8"});
if(result.error) throw result.error;
if(result.status!==0){process.stderr.write(result.stderr||"");process.stdout.write(result.stdout||"");process.exit(result.status||1)}
process.stdout.write(result.stdout);
