import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
const migration=readFileSync(new URL("../migrations/0016_account_deletion_reviewer_roles.sql",import.meta.url),"utf8");
const py=String.raw`
import sqlite3,sys
db=sqlite3.connect(":memory:");db.execute("PRAGMA foreign_keys=ON")
db.executescript("CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1),(2),(3);")
db.executescript(sys.stdin.read())
db.execute("INSERT INTO account_deletion_reviewer_assignments(user_id,role_key,assigned_by) VALUES(2,'support_reviewer',1)")
aid=db.execute("SELECT id FROM account_deletion_reviewer_assignments").fetchone()[0]
db.execute("INSERT INTO account_deletion_reviewer_assignment_events(assignment_id,target_user_id,actor_id,action,role_key) VALUES(?,2,1,'assigned','support_reviewer')",(aid,))
# No self-assignment, unsupported role, or duplicate active role.
for sql in [
 "INSERT INTO account_deletion_reviewer_assignments(user_id,role_key,assigned_by) VALUES(1,'support_reviewer',1)",
 "INSERT INTO account_deletion_reviewer_assignments(user_id,role_key,assigned_by) VALUES(2,'super_admin',1)",
 "INSERT INTO account_deletion_reviewer_assignments(user_id,role_key,assigned_by) VALUES(2,'support_reviewer',3)"
]:
 try: db.execute(sql);raise AssertionError("invalid assignment accepted")
 except sqlite3.IntegrityError: pass
# Revocation is one-way and preserves history.
db.execute("UPDATE account_deletion_reviewer_assignments SET revoked_by=1,revoked_at='2026-11-02T00:00:00Z' WHERE id=?",(aid,))
db.execute("INSERT INTO account_deletion_reviewer_assignments(user_id,role_key,assigned_by) VALUES(2,'support_reviewer',3)")
for sql in [
 "UPDATE account_deletion_reviewer_assignment_events SET action='revoked' WHERE id=1",
 "DELETE FROM account_deletion_reviewer_assignment_events WHERE id=1",
 "UPDATE account_deletion_reviewer_assignments SET revoked_by=3,revoked_at='2026-11-03T00:00:00Z' WHERE id=?"
]:
 try: db.execute(sql,(aid,)) if "WHERE id=?" in sql else db.execute(sql);raise AssertionError("immutable or one-way rule failed")
 except sqlite3.IntegrityError: pass
print("PASS: reviewer roles reject self/duplicate/unknown assignments; revocation is one-way; assignment events are append-only.")
`;
const r=spawnSync("python3",["-c",py],{input:migration,encoding:"utf8"});
if(r.error)throw r.error;
if(r.status!==0){process.stderr.write(r.stderr||"");process.stdout.write(r.stdout||"");process.exit(r.status||1)}
process.stdout.write(r.stdout);
assert.match(migration,/uq_account_deletion_reviewer_active_role/);
console.log("PASS: reviewer assignment migration policy.");
